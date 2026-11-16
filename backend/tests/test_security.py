import asyncio
import io
from pathlib import Path
import pytest
from app.config import QUARANTINE_DIR, MAX_REQUEST_BODY_BYTES
from app.middleware import default_limiter


@pytest.mark.anyio
async def test_reject_unsupported_media_type(client):
    # Upload executable masquerading as audio
    files = {
        "file": ("malware.exe", io.BytesIO(b"MZ\x90\x00"), "application/x-dosexec")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 415
    data = response.json()
    assert "detail" in data
    assert "không được hỗ trợ" in data["detail"]


@pytest.mark.anyio
async def test_reject_unsupported_extension_even_with_audio_mime(client):
    # Extension .py with audio/mpeg MIME
    files = {
        "file": ("exploit.py", io.BytesIO(b"import os; os.system('calc')"), "audio/mpeg")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 415


@pytest.mark.anyio
async def test_reject_oversized_file(client, monkeypatch):
    # Temporarily set MAX_UPLOAD_SIZE_BYTES to 1024 bytes (1 KB) for fast test
    monkeypatch.setattr("app.config.MAX_UPLOAD_SIZE_BYTES", 1024)
    monkeypatch.setattr("app.routers.analyses.stream_upload_to_quarantine.__defaults__", (1024,))

    big_content = b"A" * 2048  # 2KB > 1KB limit
    files = {
        "file": ("big_sample.mp3", io.BytesIO(big_content), "audio/mpeg")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 413
    assert "vượt quá giới hạn" in response.json()["detail"]


@pytest.mark.anyio
async def test_sanitize_path_traversal_filename(client):
    traversal_name = "../../../../windows/system32/evil.mp3"
    files = {
        "file": (traversal_name, io.BytesIO(b"safe sound content"), "audio/mpeg")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 202
    analysis_id = response.json()["id"]

    detail_res = await client.get(f"/api/v1/analyses/{analysis_id}")
    assert detail_res.status_code == 200
    safe_name = detail_res.json()["file_facts"]["file_name"]

    # Verify no path separators or traversal remain
    assert "/" not in safe_name
    assert "\\" not in safe_name
    assert ".." not in safe_name
    assert safe_name.endswith("evil.mp3")


@pytest.mark.anyio
async def test_quarantine_cleanup_immediate(client):
    # Confirm that no leftover .bin files linger in quarantine directory
    test_content = b"sound data to check cleanup"
    files = {
        "file": ("cleanup_test.wav", io.BytesIO(test_content), "audio/wav")
    }
    res = await client.post("/api/v1/analyses", files=files)
    assert res.status_code == 202

    # Verify quarantine directory has 0 leftover .bin files
    bin_files = list(Path(QUARANTINE_DIR).glob("*.bin"))
    assert len(bin_files) == 0


@pytest.mark.anyio
async def test_early_content_length_rejected_before_parser(client):
    # Exceeding Content-Length must be rejected at ASGI layer with 413 without multipart parsing
    huge_length = MAX_REQUEST_BODY_BYTES + 1024
    headers = {
        "content-length": str(huge_length),
        "content-type": "multipart/form-data; boundary=fake_boundary",
    }
    response = await client.post("/api/v1/analyses", headers=headers, content=b"dummy")
    assert response.status_code == 413
    data = response.json()
    assert "detail" in data
    assert "vượt quá giới hạn" in data["detail"]

    # Verify no partial files were created in quarantine
    bin_files = list(Path(QUARANTINE_DIR).glob("*.bin"))
    assert len(bin_files) == 0


@pytest.mark.anyio
async def test_chunked_streaming_over_limit_cutoff(client, monkeypatch):
    # Stream bytes exceeding MAX_REQUEST_BODY_BYTES must be aborted with 413
    monkeypatch.setattr("app.config.MAX_REQUEST_BODY_BYTES", 2048)

    boundary = "stream_boundary"
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="stream.mp3"\r\n'
        f"Content-Type: audio/mpeg\r\n\r\n"
    ).encode()

    async def stream_generator():
        yield header
        for _ in range(4):
            yield b"X" * 1024  # 4 * 1024 + header > 2048 limit

    headers = {"content-type": f"multipart/form-data; boundary={boundary}"}
    response = await client.post("/api/v1/analyses", headers=headers, content=stream_generator())
    assert response.status_code == 413
    data = response.json()
    assert "vượt quá giới hạn cho phép" in data["detail"]

    # Verify no quarantine leaks
    bin_files = list(Path(QUARANTINE_DIR).glob("*.bin"))
    assert len(bin_files) == 0


@pytest.mark.anyio
async def test_concurrency_semaphore_rate_limits_to_429(client):
    # Acquire all concurrency slots
    assert await default_limiter.try_acquire()
    assert await default_limiter.try_acquire()
    assert await default_limiter.try_acquire()

    try:
        # 4th request must be rejected with 429 Too Many Requests immediately
        files = {
            "file": ("slot_test.mp3", io.BytesIO(b"dummy mp3 data"), "audio/mpeg")
        }
        response = await client.post("/api/v1/analyses", files=files)
        assert response.status_code == 429
        assert response.headers.get("retry-after") == "5"
        assert "nhiều tệp tải lên đồng thời" in response.json()["detail"]
    finally:
        # Release all slots
        await default_limiter.release()
        await default_limiter.release()
        await default_limiter.release()

    # Once released, subsequent upload succeeds
    files = {
        "file": ("slot_test.mp3", io.BytesIO(b"dummy mp3 data"), "audio/mpeg")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 202


@pytest.mark.anyio
async def test_upload_timeout_enforcement(client, monkeypatch):
    # Set short timeout to verify 504 Gateway Timeout without hanging test
    monkeypatch.setattr("app.config.UPLOAD_TIMEOUT_SECONDS", 0.05)

    async def hanging_stream():
        await asyncio.sleep(0.15)
        yield b"chunk"

    headers = {"content-type": "multipart/form-data; boundary=timeout_boundary"}
    response = await client.post("/api/v1/analyses", headers=headers, content=hanging_stream())
    assert response.status_code == 504
    assert "Thời gian tải lên vượt quá giới hạn" in response.json()["detail"]

    # Verify no files in quarantine
    bin_files = list(Path(QUARANTINE_DIR).glob("*.bin"))
    assert len(bin_files) == 0


@pytest.mark.anyio
async def test_validation_error_normalized(client):
    # Empty body to POST /api/v1/analyses triggers validation error
    response = await client.post(
        "/api/v1/analyses",
        headers={"content-type": "application/json"},
        content=b"{}",
    )
    assert response.status_code == 422
    data = response.json()
    assert data == {"detail": "Dữ liệu yêu cầu không hợp lệ."}
    # Ensure no internal path or schema details leaked
    assert "loc" not in str(data)
    assert "ctx" not in str(data)


@pytest.mark.anyio
async def test_cors_configuration_narrowed(client):
    # Test preflight OPTIONS request
    headers = {
        "origin": "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "Content-Type",
    }
    response = await client.options("/api/v1/analyses", headers=headers)
    assert response.status_code == 200
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "POST" in allow_methods
    assert "GET" in allow_methods
    assert "DELETE" in allow_methods
    # Ensure dangerous/unneeded methods not exposed
    assert "PUT" not in allow_methods
    assert "PATCH" not in allow_methods
    assert "*" not in allow_methods


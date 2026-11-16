import hashlib
import io
import pytest


@pytest.mark.anyio
async def test_upload_and_get_analysis_lifecycle(client):
    test_content = b"ID3\x03\x00\x00\x00\x00\x00#dummy mp3 audio data for testing factual hash extraction"
    expected_hash = hashlib.sha256(test_content).hexdigest()
    expected_size = len(test_content)

    # 1. Upload valid MP3 file
    files = {
        "file": ("test_sample.mp3", io.BytesIO(test_content), "audio/mpeg")
    }
    response = await client.post("/api/v1/analyses", files=files)
    assert response.status_code == 202
    create_data = response.json()
    assert "id" in create_data
    assert create_data["status"] == "completed"
    assert "created_at" in create_data
    analysis_id = create_data["id"]

    # 2. Get Analysis by ID
    get_res = await client.get(f"/api/v1/analyses/{analysis_id}")
    assert get_res.status_code == 200
    detail = get_res.json()

    # Verify result contract invariants
    assert detail["id"] == analysis_id
    assert detail["status"] == "completed"
    assert detail["mode"] == "demo"
    assert detail["ai_status"] == "Phân tích AI chưa khả dụng trong v1"
    assert detail["confidence"] is None

    # Verify real file facts
    facts = detail["file_facts"]
    assert facts["file_name"] == "test_sample.mp3"
    assert facts["file_size_bytes"] == expected_size
    assert facts["mime_type"] == "audio/mpeg"
    assert facts["sha256_hash"] == expected_hash

    # Verify educational mock cues adhere to mandatory prefix
    assert len(detail["educational_mock_cues"]) >= 1
    for cue in detail["educational_mock_cues"]:
        assert cue["label"].startswith("[Minh họa / Mock cues]")
        assert "description" in cue

    # Verify 4-step checklist & recommendations
    assert len(detail["verification_checklist"]) == 4
    assert len(detail["recommendations"]) >= 2

    # 3. Delete analysis
    del_res = await client.delete(f"/api/v1/analyses/{analysis_id}")
    assert del_res.status_code == 204

    # 4. Verify subsequent retrieval returns 404
    get_again = await client.get(f"/api/v1/analyses/{analysis_id}")
    assert get_again.status_code == 404

    # 5. Verify subsequent delete returns 404
    del_again = await client.delete(f"/api/v1/analyses/{analysis_id}")
    assert del_again.status_code == 404

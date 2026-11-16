import io
import os
import sys
import time
import wave
import struct
import hashlib
import subprocess
from pathlib import Path
import httpx

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
QUARANTINE_DIR = BACKEND_DIR / "quarantine"
PYTHON_EXE = sys.executable

def create_synthetic_wav(duration_seconds: float, sample_rate: int = 16000) -> bytes:
    """Synthesize clean in-memory PCM 16-bit mono WAV data without external files."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        n_frames = int(duration_seconds * sample_rate)
        # 16-bit silence
        data = struct.pack("<h", 0) * n_frames
        wf.writeframes(data)
    return buf.getvalue()

def kill_process_tree(proc: subprocess.Popen | None, name: str = ""):
    if proc is None:
        return
    try:
        if proc.poll() is None:
            print(f"[TEARDOWN] Terminating {name} (PID: {proc.pid}) process tree...")
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
            proc.wait(timeout=5)
            print(f"[TEARDOWN] {name} terminated successfully.")
    except Exception as exc:
        print(f"[TEARDOWN] Error stopping {name}: {exc}")

def wait_for_endpoint(url: str, expected_status: int = 200, timeout_seconds: float = 15.0) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            r = httpx.get(url, timeout=2.0)
            if r.status_code == expected_status:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def find_available_port(preferred: int) -> int:
    import socket
    for p in (preferred, preferred + 1, preferred + 8, preferred + 80):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return preferred + 1

def main():
    print("=== STARTING QA E2E INTEGRATION SUITE ===")
    backend_proc = None
    frontend_proc = None
    test_results = []
    backend_port = find_available_port(8000)
    backend_url = f"http://127.0.0.1:{backend_port}"
    frontend_port = find_available_port(5173)
    frontend_url = f"http://127.0.0.1:{frontend_port}"
    print(f"Targeting Backend port {backend_port} ({backend_url})")
    print(f"Targeting Frontend port {frontend_port} ({frontend_url})")

    def record_step(step_name: str, passed: bool, detail: str = ""):
        test_results.append((step_name, passed, detail))
        status_tag = "PASS" if passed else "FAIL"
        print(f"[{status_tag}] {step_name}: {detail}")

    try:
        # Step 5: Start Backend and Frontend
        print("\n--- Step 5: Spawning Backend and Frontend Servers ---")
        
        # Start backend with 2.0s upload timeout specifically for QA test suite
        backend_env = {**os.environ, "UPLOAD_TIMEOUT_SECONDS": "2.0"}
        backend_cmd = [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(backend_port)]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=backend_env,
        )
        print(f"Backend spawned with PID {backend_proc.pid}")

        # Start frontend dev server on dedicated strictPort
        npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
        frontend_env = {**os.environ, "VITE_API_BASE_URL": backend_url}
        frontend_cmd = [npx_cmd, "vite", "--port", str(frontend_port), "--strictPort", "--host", "127.0.0.1"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=frontend_env,
        )
        print(f"Frontend spawned with PID {frontend_proc.pid} on port {frontend_port} (strictPort=True)")

        # Wait for backend live
        backend_ready = wait_for_endpoint(f"{backend_url}/health/live", 200, timeout_seconds=10.0)
        record_step(f"Backend Port {backend_port} Availability", backend_ready, f"GET {backend_url}/health/live reachable")
        if not backend_ready:
            err = backend_proc.stderr.read() if backend_proc.stderr else ""
            print(f"[BACKEND STDERR]: {err}")
            raise RuntimeError(f"Backend server failed to start within timeout: {err}")

        # Wait for frontend live on dedicated strict port
        frontend_ready = wait_for_endpoint(frontend_url, 200, timeout_seconds=15.0)
        record_step(f"Frontend Port {frontend_port} Availability", frontend_ready, f"GET {frontend_url} reachable")
        if not frontend_ready:
            err = frontend_proc.stderr.read() if frontend_proc.stderr else ""
            print(f"[FRONTEND STDERR]: {err}")
            raise RuntimeError(f"Frontend server failed to start on port {frontend_port} within timeout: {err}")

        # Step 6: HTTP E2E tests
        print("\n--- Step 6: HTTP E2E with Synthetic In-Memory WAV ---")
        with httpx.Client(timeout=10.0) as client:
            # 6.1 GET frontend page
            res_fe = client.get(f"{frontend_url}/")
            fe_ok = res_fe.status_code == 200 and ("<!DOCTYPE html>" in res_fe.text or "<html" in res_fe.text)
            record_step(f"GET Frontend Page ({frontend_url}/)", fe_ok, f"Status: {res_fe.status_code}")

            # 6.2 GET /health/live
            res_live = client.get(f"{backend_url}/health/live")
            live_data = res_live.json()
            live_ok = res_live.status_code == 200 and live_data.get("status") == "live"
            record_step("GET /health/live", live_ok, f"Status: {res_live.status_code}, Payload: {live_data}")

            # 6.3 GET /health/ready
            res_ready = client.get(f"{backend_url}/health/ready")
            ready_data = res_ready.json()
            ready_ok = res_ready.status_code == 200 and ready_data.get("status") == "ready" and ready_data.get("storage_writable") is True
            record_step("GET /health/ready", ready_ok, f"Status: {res_ready.status_code}, Payload: {ready_data}")

            # 6.4 POST short WAV (1.0 second synthetic)
            short_wav_bytes = create_synthetic_wav(duration_seconds=1.0, sample_rate=16000)
            short_sha256 = hashlib.sha256(short_wav_bytes).hexdigest()
            short_len = len(short_wav_bytes)

            files = {
                "file": ("qa_synthetic_short.wav", io.BytesIO(short_wav_bytes), "audio/wav")
            }
            res_post = client.post(f"{backend_url}/api/v1/analyses", files=files)
            post_data = res_post.json() if res_post.status_code == 202 else {}
            post_ok = (
                res_post.status_code == 202
                and post_data.get("status") == "completed"
                and "id" in post_data
                and "created_at" in post_data
            )
            analysis_id = post_data.get("id")
            record_step("POST Short Synthetic WAV to /api/v1/analyses", post_ok, f"Status: {res_post.status_code}, ID: {analysis_id}")

            # 6.5 GET analysis report
            res_get_report = client.get(f"{backend_url}/api/v1/analyses/{analysis_id}")
            report = res_get_report.json() if res_get_report.status_code == 200 else {}
            
            mode_ok = report.get("mode") == "demo"
            confidence_ok = report.get("confidence") is None
            facts = report.get("file_facts", {})
            size_ok = facts.get("file_size_bytes") == short_len
            hash_ok = facts.get("sha256_hash") == short_sha256
            duration_val = facts.get("duration_seconds")
            # In local demo without container sandbox, wave.open is suspended on untrusted uploads
            duration_ok = duration_val is None
            
            mock_cues = report.get("educational_mock_cues", [])
            cues_count_ok = len(mock_cues) >= 1
            cues_prefix_ok = all(cue.get("label", "").startswith("[Minh họa / Mock cues]") for cue in mock_cues)

            report_all_ok = (
                res_get_report.status_code == 200
                and mode_ok
                and confidence_ok
                and size_ok
                and hash_ok
                and duration_ok
                and cues_count_ok
                and cues_prefix_ok
            )
            record_step(
                "GET Report Invariants Verification",
                report_all_ok,
                f"mode={report.get('mode')}, conf={report.get('confidence')}, size={facts.get('file_size_bytes')}/{short_len}, "
                f"hash_match={hash_ok}, duration={duration_val} (correctly null as parser is suspended until sandbox is deployed), cues_prefix_ok={cues_prefix_ok}"
            )

            # 6.5.1 Vite Dev Server Proxy Verification
            res_proxy_live = client.get(f"{frontend_url}/health/live")
            proxy_live_ok = res_proxy_live.status_code == 200 and res_proxy_live.json().get("status") == "live"
            res_proxy_report = client.get(f"{frontend_url}/api/v1/analyses/{analysis_id}")
            proxy_report_ok = res_proxy_report.status_code == 200 and res_proxy_report.json().get("id") == analysis_id
            record_step(
                "Vite Proxy Forwarding to Backend",
                proxy_live_ok and proxy_report_ok,
                f"GET {frontend_url}/health/live -> {res_proxy_live.status_code}, GET {frontend_url}/api/v1/analyses/{analysis_id} -> {res_proxy_report.status_code} (Proxied to {backend_url})"
            )

            # 6.5.2 Analytical Pillars, Checklist, Scenarios & UI Contract Verification
            report_comp_path = FRONTEND_DIR / "src" / "components" / "AnalysisReport.tsx"
            report_comp_src = report_comp_path.read_text(encoding="utf-8") if report_comp_path.exists() else ""
            
            pillar_filters_ok = (
                'role="toolbar"' in report_comp_src
                and 'aria-label="Bộ lọc phân loại tín hiệu mẫu minh họa"' in report_comp_src
                and "setActiveCategory('all')" in report_comp_src
                and "setActiveCategory('audio')" in report_comp_src
                and "setActiveCategory('visual')" in report_comp_src
                and "setActiveCategory('scam')" in report_comp_src
            )
            checklist_ok = (
                'aria-labelledby="checklist-heading"' in report_comp_src
                and 'Quy trình 4 bước xác minh an toàn ngoại tuyến' in report_comp_src
                and 'Giữ bình tĩnh & Trì hoãn' in report_comp_src
                and 'Xác minh qua kênh độc lập' in report_comp_src
                and 'Đặt câu hỏi thử thách bí mật' in report_comp_src
                and 'Báo cáo cơ quan chức năng & Ngân hàng' in report_comp_src
                and 'role="checkbox"' in report_comp_src
            )
            scenarios_ok = (
                'aria-labelledby="scenarios-heading"' in report_comp_src
                and 'Nhận biết 4 kịch bản lừa đảo mạo danh phổ biến tại Việt Nam' in report_comp_src
                and 'Giả danh Công an / Viện kiểm sát / Tòa án' in report_comp_src
                and 'Người thân gặp nạn / Cấp cứu bệnh viện' in report_comp_src
                and 'Video call mờ giật, giả eKYC ngân hàng' in report_comp_src
                and 'Giả danh Nhân viên viễn thông / Ngân hàng' in report_comp_src
                and 'role="tablist"' in report_comp_src
                and 'role="tab"' in report_comp_src
                and 'role="tabpanel"' in report_comp_src
            )
            delete_btn_ok = (
                'Xóa dữ liệu phiên phân tích' in report_comp_src
                and 'Xóa phiên' in report_comp_src
            )
            ui_contracts_ok = pillar_filters_ok and checklist_ok and scenarios_ok and delete_btn_ok
            record_step(
                "UI Components: Pillar Filters, Checklist, Scenarios & Delete Button Contract",
                ui_contracts_ok,
                f"PillarFilters={pillar_filters_ok}, 4StepChecklist={checklist_ok}, 4ScenariosPlaybook={scenarios_ok}, DeleteBtn={delete_btn_ok}"
            )

            # 6.5.3 Viewports (Desktop 1920x1080 & Mobile 375x667) & Responsive Markup Check
            html_index_path = FRONTEND_DIR / "index.html"
            html_src = html_index_path.read_text(encoding="utf-8") if html_index_path.exists() else ""
            app_comp_path = FRONTEND_DIR / "src" / "App.tsx"
            app_comp_src = app_comp_path.read_text(encoding="utf-8") if app_comp_path.exists() else ""
            viewport_meta_ok = '<meta name="viewport" content="width=device-width, initial-scale=1.0"' in html_src
            responsive_classes_ok = (
                ("max-w-6xl" in app_comp_src or "max-w-4xl" in report_comp_src)
                and ("px-4 sm:px-6" in app_comp_src or "px-4 sm:px-6" in report_comp_src)
                and "grid-cols-1 md:grid-cols-2" in report_comp_src
                and "flex-col sm:flex-row" in report_comp_src
            )
            viewports_contract_ok = viewport_meta_ok and responsive_classes_ok
            record_step(
                "Viewport & Responsive Markup Contract (Desktop 1920x1080 & Mobile 375x667)",
                viewports_contract_ok,
                "Viewport meta tag present; responsive breakpoints (sm, md, flex-col/row, grid-cols-1/2) verified. Note: Browser origin gate active (headless browser binary not present on PATH); verified via HTTP markup and CSS contracts."
            )

            # 6.6 DELETE report -> 204, then GET -> 404
            res_delete = client.delete(f"{backend_url}/api/v1/analyses/{analysis_id}")
            delete_ok = res_delete.status_code == 204
            record_step("DELETE Report (/api/v1/analyses/{id})", delete_ok, f"Status: {res_delete.status_code}")

            res_get_after_delete = client.get(f"{backend_url}/api/v1/analyses/{analysis_id}")
            get_404_ok = res_get_after_delete.status_code == 404
            record_step("GET Report After DELETE", get_404_ok, f"Status: {res_get_after_delete.status_code} (Expected 404)")

            # 6.7 Hardening: Early Content-Length Header Rejection (HTTP 413 before multipart parser)
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5.0)
            sock.connect(("127.0.0.1", backend_port))
            raw_req = (
                f"POST /api/v1/analyses HTTP/1.1\r\n"
                f"Host: 127.0.0.1:{backend_port}\r\n"
                f"Content-Length: 20971520\r\n"
                f"Content-Type: multipart/form-data; boundary=boundary_e2e_cl\r\n\r\n"
            ).encode()
            sock.sendall(raw_req)
            resp_bytes = bytearray()
            while True:
                try:
                    chunk = sock.recv(4096)
                    if not chunk:
                        break
                    resp_bytes.extend(chunk)
                    if b"}" in chunk:
                        break
                except Exception:
                    break
            sock.close()
            raw_resp = resp_bytes.decode("utf-8", errors="replace")
            cl_early_ok = "413" in raw_resp
            status_line = raw_resp.splitlines()[0] if raw_resp else "Empty"
            record_step(
                "Early Content-Length Rejection with HTTP 413",
                cl_early_ok,
                f"Status: {status_line}, Body: {raw_resp[-100:] if len(raw_resp) > 100 else raw_resp}"
            )

            # 6.8 Hardening: Chunked Streaming Over-Limit Cutoff (HTTP 413 or clean connection close)
            def generate_oversized_stream():
                b = "stream_boundary_e2e"
                yield f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"stream.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode()
                chunk = b"0" * (1024 * 1024)
                for _ in range(16):  # 16 MiB > 15 MiB limit
                    yield chunk
                yield f"\r\n--{b}--\r\n".encode()

            chunked_passed = False
            chunked_detail = ""
            try:
                res_chunked = client.post(
                    f"{backend_url}/api/v1/analyses",
                    headers={"content-type": "multipart/form-data; boundary=stream_boundary_e2e"},
                    content=generate_oversized_stream(),
                )
                if res_chunked.status_code == 413:
                    chunked_passed = True
                    chunked_detail = f"Server returned HTTP 413: {res_chunked.text[:60]}"
                else:
                    chunked_passed = False
                    chunked_detail = f"Unexpected status: {res_chunked.status_code}"
            except (httpx.RemoteProtocolError, httpx.WriteError, httpx.NetworkError) as exc:
                chunked_passed = True
                chunked_detail = f"connection closed by server on cutoff ({type(exc).__name__})"
            except Exception as exc:
                chunked_passed = False
                chunked_detail = f"Unexpected error: {type(exc).__name__}: {str(exc)[:100]}"

            record_step("Chunked Streaming Over-Limit Cutoff", chunked_passed, chunked_detail)

            # Verify server is still responsive and healthy after stream cutoff
            res_after_chunked = client.get(f"{backend_url}/health/live")
            record_step(
                "Backend Responsive After Stream Cutoff",
                res_after_chunked.status_code == 200,
                f"Health status: {res_after_chunked.status_code}"
            )

            # 6.9 Hardening: Concurrency Limit Barrier & Rate Limiting (HTTP 429 & Retry-After)
            import threading
            barrier_ready = threading.Barrier(4)
            barrier_release = threading.Event()
            slot_responses = []
            threads = []
            rate_limited_ok = False
            res_4th = None

            def holding_stream(worker_id):
                def slow_gen():
                    b = f"bound_{worker_id}"
                    yield f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"slow_{worker_id}.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode()
                    yield b"RIFF" + b"\x00" * 36 + b"data" + b"\x00" * 100
                    try:
                        barrier_ready.wait(timeout=5.0)
                    except threading.BrokenBarrierError:
                        return
                    barrier_release.wait(timeout=5.0)
                    yield f"\r\n--{b}--\r\n".encode()

                with httpx.Client(timeout=10.0) as slow_client:
                    try:
                        r = slow_client.post(
                            f"{backend_url}/api/v1/analyses",
                            headers={"content-type": f"multipart/form-data; boundary=bound_{worker_id}"},
                            content=slow_gen(),
                        )
                        slot_responses.append(r.status_code)
                    except Exception as e:
                        slot_responses.append(f"err:{type(e).__name__}")

            try:
                threads = [threading.Thread(target=holding_stream, args=(i,), daemon=True) for i in range(3)]
                for t in threads:
                    t.start()

                # Wait until all 3 workers are holding semaphore slots
                barrier_ready.wait(timeout=5.0)
                time.sleep(0.1)

                # Send 4th request while all 3 slots are occupied
                res_4th = client.post(
                    f"{backend_url}/api/v1/analyses",
                    headers={"content-type": "multipart/form-data; boundary=probe_bound"},
                    content=b"--probe_bound\r\nContent-Disposition: form-data; name=\"file\"; filename=\"probe.wav\"\r\nContent-Type: audio/wav\r\n\r\nsample\r\n--probe_bound--\r\n",
                )
                rate_limited_ok = (
                    res_4th.status_code == 429
                    and res_4th.headers.get("retry-after") == "5"
                    and "nhiều tệp tải lên đồng thời" in res_4th.text
                )
            finally:
                # Guarantees all holding threads are unblocked and joined cleanly
                barrier_release.set()
                lingering_threads = []
                for idx, t in enumerate(threads):
                    t.join(timeout=3.0)
                    if t.is_alive():
                        lingering_threads.append(idx)

            record_step(
                "Deterministic Concurrency Barrier & Rate Limiting (429)",
                rate_limited_ok and len(lingering_threads) == 0,
                f"4th request status: {res_4th.status_code if res_4th else 'None'}, Retry-After: {res_4th.headers.get('retry-after') if res_4th else 'None'}, Lingering threads: {lingering_threads}"
            )

            # 6.10 Hardening: Real HTTP 504 Timeout Verification
            # Backend process was spawned with UPLOAD_TIMEOUT_SECONDS = 2.0
            def slow_hanging_stream():
                b = "stream_timeout_e2e"
                yield f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"slow.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode()
                yield b"initial_chunk"
                time.sleep(2.5)  # Exceeds 2.0s UPLOAD_TIMEOUT_SECONDS
                yield b"subsequent_chunk"
                yield f"\r\n--{b}--\r\n".encode()

            try:
                res_timeout = client.post(
                    f"{backend_url}/api/v1/analyses",
                    headers={"content-type": "multipart/form-data; boundary=stream_timeout_e2e"},
                    content=slow_hanging_stream(),
                    timeout=6.0,
                )
                timeout_ok = (
                    res_timeout.status_code == 504
                    and "Thời gian tải lên vượt quá giới hạn" in res_timeout.text
                    and "(2 giây)" in res_timeout.text
                )
                timeout_detail = f"Status: {res_timeout.status_code}, Body: {res_timeout.text[:80]}"
            except Exception as exc:
                timeout_ok = False
                timeout_detail = f"Request error: {type(exc).__name__}: {str(exc)[:80]}"

            record_step("Upload Timeout 504 Real HTTP Verification", timeout_ok, timeout_detail)

            # 6.11 Verification: Post-timeout single upload accepts new upload (at least 1 slot available)
            probe_wav = create_synthetic_wav(duration_seconds=1.0, sample_rate=16000)
            probe_files = {
                "file": ("post_timeout_probe.wav", io.BytesIO(probe_wav), "audio/wav")
            }
            res_upload_after_timeout = client.post(
                f"{backend_url}/api/v1/analyses",
                files=probe_files,
            )
            upload_slot_ok = (
                res_upload_after_timeout.status_code == 202
                and "id" in res_upload_after_timeout.json()
            )
            record_step(
                "Upload Acceptance After Timeout (Upload 202 Verified)",
                upload_slot_ok,
                f"Status: {res_upload_after_timeout.status_code}, ID: {res_upload_after_timeout.json().get('id') if upload_slot_ok else 'None'}"
            )
            # Clean up the probe analysis session
            if upload_slot_ok:
                probe_id = res_upload_after_timeout.json()["id"]
                client.delete(f"{backend_url}/api/v1/analyses/{probe_id}")

            # 6.12 Hardening: Full 3-Slot Concurrency Barrier Verification Post-Timeout
            # Verifies that ALL 3 semaphore slots were restored and can be held simultaneously,
            # and that a 4th request receives 429 + Retry-After: 5
            post_barrier_ready = threading.Barrier(4)
            post_barrier_release = threading.Event()
            post_threads = []
            post_rate_limited_ok = False
            res_post_4th = None

            def post_timeout_holding_stream(worker_id):
                def slow_gen():
                    b = f"post_bound_{worker_id}"
                    yield f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"post_slow_{worker_id}.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode()
                    yield b"RIFF" + b"\x00" * 36 + b"data" + b"\x00" * 100
                    try:
                        post_barrier_ready.wait(timeout=5.0)
                    except threading.BrokenBarrierError:
                        return
                    post_barrier_release.wait(timeout=5.0)
                    yield f"\r\n--{b}--\r\n".encode()

                with httpx.Client(timeout=10.0) as slow_client:
                    try:
                        slow_client.post(
                            f"{backend_url}/api/v1/analyses",
                            headers={"content-type": f"multipart/form-data; boundary=post_bound_{worker_id}"},
                            content=slow_gen(),
                        )
                    except Exception:
                        pass

            try:
                post_threads = [threading.Thread(target=post_timeout_holding_stream, args=(i,), daemon=True) for i in range(3)]
                for t in post_threads:
                    t.start()

                # Wait until all 3 workers hold the 3 restored slots
                post_barrier_ready.wait(timeout=5.0)
                time.sleep(0.1)

                # Send 4th request while all 3 slots are occupied
                res_post_4th = client.post(
                    f"{backend_url}/api/v1/analyses",
                    headers={"content-type": "multipart/form-data; boundary=post_probe_bound"},
                    content=b"--post_probe_bound\r\nContent-Disposition: form-data; name=\"file\"; filename=\"post_probe.wav\"\r\nContent-Type: audio/wav\r\n\r\nsample\r\n--post_probe_bound--\r\n",
                )
                post_rate_limited_ok = (
                    res_post_4th.status_code == 429
                    and res_post_4th.headers.get("retry-after") == "5"
                    and "nhiều tệp tải lên đồng thời" in res_post_4th.text
                )
            finally:
                post_barrier_release.set()
                post_lingering_threads = []
                for idx, t in enumerate(post_threads):
                    t.join(timeout=3.0)
                    if t.is_alive():
                        post_lingering_threads.append(idx)

            record_step(
                "Post-Timeout Full 3-Slot Concurrency Barrier Verification (429)",
                post_rate_limited_ok and len(post_lingering_threads) == 0,
                f"4th request status: {res_post_4th.status_code if res_post_4th else 'None'}, Retry-After: {res_post_4th.headers.get('retry-after') if res_post_4th else 'None'}, Lingering threads: {post_lingering_threads}"
            )

            # 6.13 Media Parser Sandbox State (Security Notice: not counted as passing test)
            print("\n[SECURITY NOTICE] Parser wave.open is suspended on untrusted uploads. Container sandbox does not exist on host (Docker not on PATH). Project Gate remains PARTIAL.")

            # 6.14 Check quarantine folder has no leftover files
            quarantine_files = list(QUARANTINE_DIR.iterdir()) if QUARANTINE_DIR.exists() else []
            quarantine_clean = len(quarantine_files) == 0
            record_step(
                "Quarantine Directory Zero Leftover Check",
                quarantine_clean,
                f"Remaining files in {QUARANTINE_DIR}: {[f.name for f in quarantine_files]}"
            )

    finally:
        # Step 7: Teardown QA processes
        print("\n--- Step 7: Gracefully Stopping QA Backend & Frontend Servers ---")
        kill_process_tree(frontend_proc, "Frontend Dev Server")
        kill_process_tree(backend_proc, "Backend Server")

        # Verify ports released
        time.sleep(1.0)
        with httpx.Client(timeout=2.0) as verify_client:
            b_down = False
            try:
                verify_client.get(f"{backend_url}/health/live")
            except Exception:
                b_down = True
            f_down = False
            try:
                verify_client.get(f"http://127.0.0.1:{frontend_port}")
            except Exception:
                f_down = True
            print(f"[TEARDOWN CHECK] Port {backend_port} closed: {b_down}, Port {frontend_port} closed: {f_down}")

    print("\n=== E2E TEST SUMMARY ===")
    all_passed = all(passed for _, passed, _ in test_results)
    for name, passed, detail in test_results:
        mark = "PASS" if passed else "FAIL"
        print(f"[{mark}] {name} -> {detail}")
    print(f"OVERALL RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")

    if not all_passed:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()

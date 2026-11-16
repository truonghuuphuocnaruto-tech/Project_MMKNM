# Báo Cáo Bàn Giao Kỹ Thuật Web v1 Local & Hardening Pipeline (Handoff Report)

- **Ngày chạy kiểm thử và lập báo cáo:** 12-11-2026
- **URL và Cổng thực tế:**
  - **Backend:** `http://127.0.0.1:8000` (Cổng 8000)
  - **Frontend:** `http://127.0.0.1:5173` (Cổng 5173)
  - **Cơ chế cổng động của QA runner (`backend/tests/e2e_runner.py`):** Dò cổng rảnh tự động qua `find_available_port(8000)` và `find_available_port(5173)`. Nếu phát hiện cổng bận, tự động gán cổng rảnh kế tiếp (ví dụ 8001 cho backend, 5174 với `--strictPort` và `VITE_API_BASE_URL` cho frontend) nhằm không can thiệp vào tiến trình người dùng. Trong lần chạy nghiệm thu thực tế khi cổng mặc định sẵn sàng, runner đã bind và kiểm tra trực tiếp trên Backend `http://127.0.0.1:8000` và Frontend `http://127.0.0.1:5173`.
- **Điều phối Empryo & Lịch sử Run Records:**
  - **Web v1 Local Demo ban đầu (Bước 2):** **PASS** (xác minh hoàn tất tại run `orun-1-e31d44a2`).
  - **Run Empryo `orun-3-d1b421a5` (Hardening Pipeline File):** Node Judge ghi nhận phán quyết **VERDICT: PASS** trên 7 tiêu chí kiểm thử logic, middleware, giới hạn tải và unit/security tests.
  - **Run Empryo `orun-4-98512fde` (Web v1 UI Completion):** Node Judge ghi nhận phán quyết **VERDICT: PASS** trên các tiêu chí hoàn thiện copy/UX, chuẩn hóa nhãn minh họa kèm hộp cảnh báo disclaimer, khuyến nghị an toàn có căn cứ theo Cục ATTT & Bộ Công an, trợ năng ARIA, responsive breakpoints và kiểm thử cổng động độc lập.
  - **Run Empryo `orun-8-75b45a3d` (Runtime Sandbox v1):** Tải bộ cài chính thức Podman Desktop v1.30.5; thẩm định thiết kế sandbox worker 7 tiêu chí an ninh đạt **PASS**; Runtime Gate Judge phán quyết **VERDICT: PARTIAL** do host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và cần quyền Administrator cùng reboot máy; Project Security Gate Bước 3 tiếp tục giữ mức **PARTIAL**; Bước 4: **CHƯA BẮT ĐẦU**.
- **Tách Biệt Rõ Ràng 3 Trạng Thái Kỹ Thuật Dự Án:**
  1. **Web v1 Local Demo:** **VERDICT: PASS** (chạy local an toàn; toàn bộ luồng giao diện Web v1, bộ lọc minh họa, checklist 4 bước, tabs kịch bản, nút xóa phiên, và kết nối Vite proxy sang backend đạt 100% kiểm thử E2E 20/20 và review chức năng).
  2. **Bước 3 Project Security Gate (Cổng An Toàn Dự Án):** **VERDICT: PARTIAL** (phân biệt rạch ròi với verdict lịch sử PASS của run `orun-3-d1b421a5` và `orun-4-98512fde`; các kiểm soát mã nguồn ASGI đạt chuẩn, tuy nhiên do máy chủ host chưa có worker container sandbox độc lập cho parser media trên host, cổng an toàn kỹ thuật được bảo lưu ở mức PARTIAL cho đến khi sandbox được cài đặt và kiểm chứng thực nghiệm; tuyệt đối không chuyển sang Bước 4).
  3. **Bước 4 (Baseline Model):** **TRẠNG THÁI: CHƯA BẮT ĐẦU** (chỉ ở giai đoạn nghiên cứu sẵn sàng; giữ parser media tiếp tục **TẮT** trên host process; đã hoàn tất bảng so sánh sơ bộ 2 model ứng viên AASIST & RawNet2 trong hồ sơ nghiên cứu mà không tải weights/dataset vào kho lưu trữ).
- **Cam kết an toàn và vận hành:** Không ghi PID tạm thời, không tự ý git commit, không git push, không deploy ra môi trường public, không mở tunnel và không kết nối outbound API hay ingest URL từ xa.

---

## 1. Môi Trường Runtime & Phiên Bản Dependency Thực Tế

Đã kiểm chứng trực tiếp trên hệ thống local:
- **Hệ điều hành:** Windows 10/11 x64
- **Runtime môi trường:**
  - **Python:** `3.15.2` (trong virtual environment `backend/.venv`). *Lưu ý tương thích:* `backend/app/middleware.py` đã được cập nhật sử dụng `asyncio.wait_for` tương thích với Python >=3.10 theo khai báo trong `pyproject.toml`. Tuy nhiên môi trường máy hiện tại chạy Python 3.15.2, không có runtime Python 3.10 vật lý để kiểm chứng trực tiếp; tài liệu ghi nhận rõ giới hạn này và không tuyên bố đã xác minh trên runtime 3.10.
  - **Node.js:** `v24.22.1`
  - **npm:** `11.19.1`
- **Backend Dependencies (đã cài đặt & kiểm tra trong `backend/requirements.txt`):**
  - `fastapi`: `0.162.4`
  - `uvicorn`: `0.54.0`
  - `pydantic`: `2.14.3`
  - `python-multipart`: `0.0.33`
  - `httpx`: `0.28.1`
  - `pytest`: `9.2.0`
  - Thư viện chuẩn: `wave`, `struct`, `asyncio`, `socket` (Python Standard Library)
- **Frontend Dependencies (khóa chặt trong `frontend/package-lock.json`):**
  - `react`: `19.3.1`
  - `react-dom`: `19.3.1`
  - `vite`: `8.3.8`
  - `@vitejs/plugin-react`: `6.3.0`
  - `typescript`: `5.6.3`
  - `tailwindcss`: `3.4.16`

---

## 2. Ghi Nhận Phạm Vi Bước 3: Hardening Pipeline File

Hệ thống đã triển khai các cơ chế gia cố an toàn tệp tải lên (defense-in-depth) tại backend và frontend:
1. **Kiểm tra Content-Length sớm (Pre-parsing ASGI Guard):**
   - Triển khai middleware ASGI (`backend/app/middleware.py`) chặn ngay request có header `Content-Length > MAX_REQUEST_BODY_BYTES` (15 MB + 128 KiB overhead tại `backend/app/config.py`) với mã HTTP 413 trước khi server spool multipart body vào bộ nhớ/đĩa.
2. **Chunk Streaming Byte Counter:**
   - Đếm byte liên tục theo chunk 64 KiB trong luồng `receive()` và tại `backend/app/services/storage.py`, ngắt luồng tải tức thì bằng ngoại lệ `PayloadTooLargeError` nếu stream chunked vượt quá 15 MB.
3. **Bộ điều tiết đồng thời & Timeout (Concurrency Limiter & Timeout):**
   - Giới hạn tối đa 3 upload đồng thời (`MAX_CONCURRENT_UPLOADS = 3`) bằng `ConcurrencyLimiter` Semaphore (`backend/app/middleware.py`). Khi quá tải, trả về HTTP 429 kèm header `Retry-After: 5`.
   - Timeout tải lên 60 giây sử dụng `asyncio.wait_for` trả mã HTTP 504 khi quá thời gian cho phép, đảm bảo giải phóng Semaphore trong khối `finally` kể cả khi bị hủy (cancellation).
4. **Cách ly thư mục Quarantine & Dọn dẹp:**
   - Tệp tạm ghi vào thư mục `backend/quarantine` với tên tệp UUID v4 ngẫu nhiên, ngăn chặn nguy cơ Path Traversal do không sử dụng tên tệp từ client. Khối `finally` đảm bảo xóa tệp tạm ngay lập tức sau khi tính toán facts (0 tệp tồn dư).
5. **Xử lý Parser Media & Giới hạn Sandbox:**
   - Do máy chủ local không có Docker container sandbox, tạm ngừng gọi `wave.open` trên file upload của người dùng (`backend/app/services/media_facts.py:89-97`); trường `duration_seconds` trả về `null` (hiển thị 'Chưa phân tích' trên giao diện). Giới hạn thời lượng 60s tạm thời chưa được xác minh khi tắt parser.
6. **Xóa phiên làm việc (Deletion Lifecycle):**
   - Hỗ trợ `DELETE /api/v1/analyses/{id}` giải phóng báo cáo trong RAM, trả HTTP 204 và các truy vấn sau đó trả về HTTP 404.
7. **Ranh giới hợp đồng minh bạch:**
   - Duy trì bất biến `mode="demo"`, `confidence=null`, tiền tố `[Minh họa / Mock cues]` và tách bạch hoàn toàn giữa Facts đo được với Cues giáo dục trên UI. Chỉ bind nội bộ `127.0.0.1` và thu hẹp CORS (lưu ý: đây là cấu hình bind local, không phải network isolation vì chưa có kiểm soát egress).

---

## 3. Báo Cáo Chi Tiết Kiểm Thử Chất Lượng (QA Verification Log)

Toàn bộ các lệnh kiểm thử chất lượng từ cài đặt phụ thuộc, build tĩnh, kiểm tra bảo mật npm audit, unit & security tests pytest (14 tests), đến kịch bản tích hợp HTTP E2E qua server thật đã được thực thi và lưu lại kết quả thực tế (100% Exit Code 0). Dữ liệu kiểm thử sử dụng sóng âm PCM tổng hợp trực tiếp trong RAM, không sử dụng tệp người dùng thật hay mã độc.

### Chi tiết các lệnh kiểm thử QA thực tế:

#### 1. Cài đặt phụ thuộc Frontend (npm ci)
- **Lệnh thực thi:** `cd frontend && npm ci`
- **Exit Code:** `0`
- **Kết quả:** `added 97 packages, and audited 98 packages in 16s. found 0 vulnerabilities`.

#### 2. Build Frontend Production Bundle
- **Lệnh thực thi:** `cd frontend && npm run build`
- **Exit Code:** `0`
- **Kết quả:** `tsc && vite build` hoàn tất trong 1.89s. 26 modules transformed, sinh ra bundle sạch tại `dist/` (`dist/index.html` 0.84 kB, `dist/assets/index-OA5PTvZI.css` 25.98 kB, `dist/assets/index-slWC67ZC.js` 268.00 kB). Không có lỗi typecheck hoặc bundling.

#### 3. Kiểm tra lỗ hổng bảo mật Frontend (npm audit)
- **Lệnh thực thi:** `cd frontend && npm audit`
- **Exit Code:** `0`
- **Kết quả:** `found 0 vulnerabilities` (0 lỗ hổng bảo mật).

#### 4. Backend Unit & Security Tests (Pytest)
- **Lệnh thực thi:** `cd backend && .\.venv\Scripts\python.exe -m pytest -q`
- **Exit Code:** `0`
- **Kết quả:** `14 passed in 0.47s` (14/14 tests đạt 100%, bao gồm kiểm thử health, storage, sanitization, media facts, concurrency limiter, Content-Length guard, upload timeout và quarantine cleanup).

#### 5. Kịch bản tích hợp HTTP E2E qua server thật với dữ liệu WAV tổng hợp trong RAM
- **Lệnh thực thi:** `backend\.venv\Scripts\python.exe backend/tests/e2e_runner.py`
- **Exit Code:** `0`
- **Dữ liệu kiểm thử:** Hoàn toàn tạo trong bộ nhớ RAM qua thư viện chuẩn Python `wave` + `struct` (PCM 16-bit Mono, không sử dụng bất kỳ tệp người dùng hay malware).
- **Cổng mặc định thủ công vs Cổng động QA runner:**
  - *Cổng mặc định khi người dùng chạy thủ công:* Backend tại `http://127.0.0.1:8000`, Frontend tại `http://127.0.0.1:5173`.
  - *Cơ chế cổng động của QA runner (`backend/tests/e2e_runner.py`):* Runner sử dụng `find_available_port(8000)` và `find_available_port(5173)` để thăm dò cổng rảnh. Nếu phát hiện cổng mặc định 8000 hoặc 5173 đang bận (ví dụ do server người dùng đang hoạt động), runner tự động chọn cổng kế tiếp khả dụng (như 8001 cho backend, 5174 với `--strictPort` cho frontend), truyền biến môi trường `VITE_API_BASE_URL` trỏ vào đúng backend port mới, và tuyệt đối không can thiệp hay dừng tiến trình của người dùng.
  - *Cổng thực tế trong lần chạy nghiệm thu:* Khi cổng mặc định khả dụng, QA runner đã bind vào Backend `http://127.0.0.1:8000` và Frontend `http://127.0.0.1:5173`.
- **Nhật ký chi tiết 20 phép kiểm tra E2E và kiểm tra an toàn thực tế (Exit Code 0, 20/20 PASS):**
  1. `Backend Port 8000 Availability`: PASS (`GET http://127.0.0.1:8000/health/live` reachable - kiểm tra tính khả dụng cổng backend).
  2. `Frontend Port 5173 Availability`: PASS (`GET http://127.0.0.1:5173` reachable - kiểm tra tính khả dụng cổng frontend).
  3. `GET Frontend Page (http://127.0.0.1:5173/)`: PASS (Trang index HTML tại `http://127.0.0.1:5173/` trả về HTTP 200).
  4. `GET /health/live`: PASS (Trạng thái live, HTTP 200, payload `{'status': 'live'}`).
  5. `GET /health/ready`: PASS (Trạng thái ready, storage writable, HTTP 200, payload `{'status': 'ready', 'storage_writable': True}`).
  6. `POST Short Synthetic WAV to /api/v1/analyses`: PASS (Tải lên file WAV tổng hợp trong RAM thành công, HTTP 202).
  7. `GET Report Invariants Verification`: PASS (`mode=demo`, `conf=None`, `size=32044/32044`, `hash_match=True`, `duration=None` đúng chuẩn khi tạm dừng parser chờ sandbox, `cues_prefix_ok=True` với prefix `[Minh họa / Mock cues]`).
  8. `Vite Proxy Forwarding to Backend`: PASS (`GET http://127.0.0.1:5173/health/live` -> 200, `GET http://127.0.0.1:5173/api/v1/analyses/{id}` -> 200 proxied sang backend cổng 8000).
  9. `UI Components: Pillar Filters, Checklist, Scenarios & Delete Button Contract`: PASS (`PillarFilters=True`, `4StepChecklist=True`, `4ScenariosPlaybook=True`, `DeleteBtn=True`).
  10. `Viewport & Responsive Markup Contract (Desktop 1920x1080 & Mobile 375x667)`: PASS (Thẻ viewport meta hiện diện, responsive breakpoints `sm`, `md`, `flex-col/row`, `grid-cols-1/2` được xác minh. *Lưu ý:* Browser sandbox origin gate kích hoạt do chưa có headless browser binary trên PATH; kiểm tra qua cấu trúc HTTP markup và CSS contract thay vì live browser rendering).
  11. `DELETE Report (/api/v1/analyses/{id})`: PASS (Xóa phiên trả về HTTP 204).
  12. `GET Report After DELETE`: PASS (Truy vấn lại sau xóa trả về HTTP 404).
  13. `Early Content-Length Rejection with HTTP 413`: PASS (Socket request gửi header `Content-Length: 20971520` $\rightarrow$ nhận `HTTP/1.1 413 Content Too Large` ngay lập tức trước khi đọc body).
  14. `Chunked Streaming Over-Limit Cutoff`: PASS (Stream chunked vượt trần 15MB/16MiB $\rightarrow$ Server ngắt luồng và trả về HTTP 413).
  15. `Backend Responsive After Stream Cutoff`: PASS (Server duy trì phản hồi bình thường sau khi ngắt luồng chunked vượt ngưỡng, HTTP 200).
  16. `Deterministic Concurrency Barrier & Rate Limiting (429)`: PASS (Đồng bộ giữ 3 slots upload bằng barrier $\rightarrow$ request thứ 4 nhận HTTP 429 kèm `Retry-After: 5`, toàn bộ thread được giải phóng an toàn).
  17. `Upload Timeout 504 Real HTTP Verification`: PASS (Stream chậm trễ 2.5s vượt ngưỡng QA 2.0s $\rightarrow$ Server trả HTTP 504 khớp thông báo runtime: `{"detail": "Thời gian tải lên vượt quá giới hạn cho phép (2 giây)."}`). Lưu ý: Timeout production mặc định là 60s; tiến trình QA đặt 2s để kiểm tra xác thực.
  18. `Upload Acceptance After Timeout (Upload 202 Verified)`: PASS (Gửi yêu cầu upload mới ngay sau timeout $\rightarrow$ nhận HTTP 202, chứng minh slot upload được giải phóng trong khối `finally` của middleware).
  19. `Post-Timeout Full 3-Slot Concurrency Barrier Verification (429)`: PASS (Thực hiện kiểm tra barrier lấp đầy đồng thời cả 3 slots sau timeout $\rightarrow$ request thứ 4 vẫn nhận HTTP 429 kèm `Retry-After: 5`, xác nhận toàn bộ 3 slots đều được phục hồi đầy đủ; 0 thread bị kẹt).
  20. `Quarantine Directory Zero Leftover Check`: PASS (Thư mục `backend/quarantine` sạch 100%, 0 tệp tồn dư sau toàn bộ chuỗi kiểm thử).

*Ghi chú ranh giới an toàn (Security Notice):* Parser `wave.open` đang tạm ngừng trên host process vì chưa có container sandbox (Docker không có trên PATH); Project Security Gate giữ mức PARTIAL (không tính là test đạt).

*Dọn dẹp tiến trình (Teardown):* Toàn bộ cây tiến trình backend và frontend do chính QA khởi chạy đã được dừng trong khối `finally`, giải phóng cổng mạng (`Port 8000 closed: True, Port 5173 closed: True`). Không ghi nhận và không lưu trữ PID tạm thời. Script không kết nối hay can thiệp vào tiến trình của người dùng.

---

## 4. Báo Cáo Đánh Giá Độc Lập (Reviews)

### 4.1. Kết Luận Đánh Giá Chức Năng (Functional Review)
- **Kết quả:** **PASS**
- **Đánh giá chi tiết:**
  - Tiếp nhận upload an toàn, stream chunk, tính toán thông số, dọn tệp cách ly tại `finally`. Endpoint `GET /{id}` trả kết quả chính xác; `DELETE /{id}` xóa khỏi RAM và trả về HTTP 204 $\rightarrow$ 404. Giao diện frontend hỗ trợ polling, hiển thị báo cáo kèm checklist 4 bước và nút xóa phiên an toàn.
  - Phân định File Facts vs Mock Cues: Schema và UI tách bạch hoàn toàn `file_facts` và `educational_mock_cues` có tiền tố bắt buộc `[Minh họa / Mock cues]`. Thời lượng hiển thị 'Chưa phân tích (chưa có sandbox cách ly)'.

### 4.2. Kết Luận Đánh Giá An Toàn & Bảo Mật (Security Review)
- **Kết quả:** **PASS trên phạm vi cục bộ**
- **Đánh giá chi tiết:**
  - Multi-tier Upload Defense: Chặn sớm Content-Length (15MB + 128KB overhead) tại ASGI middleware; đếm byte chunk streaming 64KB ngắt ngay khi vượt trần.
  - Điều tiết tài nguyên: Semaphore giới hạn 3 upload đồng thời chống DoS/tràn RAM; timeout 60 giây chống connection starvation.
  - Cách ly Quarantine: Tên tệp sinh bằng UUID v4 ngẫu nhiên, ngăn chặn nguy cơ Path Traversal; khối `finally` xóa sạch tệp cách ly ngay lập tức.
  - An toàn cấu hình: Chỉ bind local `127.0.0.1`, thu hẹp CORS; không rò rỉ stack trace. Không coi đây là network isolation vì chưa có egress filtering.

---

## 5. Kết Luận Của Trọng Tài & Đánh Giá Cổng Dự Án

### 5.1. Lịch Sử Phán Quyết Run Records (Empryo Orchestrations)
- **Run `orun-3-d1b421a5` (Hardening Pipeline File):** **VERDICT: PASS** (Node Judge phán quyết PASS dựa trên 7 tiêu chí kiểm thử logic, middleware ASGI, giới hạn tải và unit/security tests cục bộ).
- **Run `orun-4-98512fde` (Web v1 UI Completion):** **VERDICT: PASS** (Node Judge phán quyết PASS đối với việc hoàn thiện copy/UX, nhãn minh họa kèm disclaimer cảnh báo rõ ràng, cập nhật khuyến nghị phòng chống lừa đảo theo Cục ATTT & Bộ Công an, trợ năng ARIA, responsive breakpoints và kịch bản test cổng động độc lập).
- **Run `orun-8-75b45a3d` (Runtime Sandbox v1):** **VERDICT: PARTIAL** (Tải installer chính thức Podman Desktop v1.30.5; thiết kế sandbox worker Podman 7 tiêu chí đạt PASS qua kiểm toán an ninh; Runtime Gate Judge phán quyết PARTIAL do host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và cần quyền Administrator cùng thao tác reboot; dừng an toàn trước thay đổi hệ điều hành).

### 5.2. Kết Luận Nghiệm Thu Riêng Biệt Cho Web v1
- **Trạng thái Web v1:** **VERDICT: PASS**
- **Cơ sở đánh giá:** Giao diện người dùng Web v1 hoàn chỉnh, UX rõ ràng, các mock cues có disclaimer không gây nhầm lẫn, checklist 4 bước, tabs kịch bản, các responsive breakpoints, accessibility ARIA, tải tệp demo, tính toán facts cơ bản trong RAM, xóa phiên HTTP 204/404, Vite proxy hoạt động đầy đủ và toàn bộ 20/20 test E2E đạt.

### 5.3. Đánh Giá Cổng An Toàn Dự Án Bước 3 (Project Security Gate)
- **Trạng thái Project Security Gate Bước 3:** **VERDICT: PARTIAL**
- **Cơ sở đánh giá & Tính độc lập với Web v1:** Phân biệt rõ ràng giữa kết quả phán quyết lịch sử của các run logic/UI (Web v1 PASS độc lập) với cổng bảo mật kỹ thuật tổng thể của dự án:
  - Các lớp phòng vệ code (Content-Length ASGI guard 413, chunked cutoff 413, concurrency barrier 429 kèm `Retry-After: 5`, timeout 504, dọn dẹp quarantine 0 tệp tồn dư) đã được kiểm chứng hoạt động chính xác trong E2E.
  - Tại run `orun-8-75b45a3d`, thiết kế kỹ thuật sandbox worker cho Podman Desktop đã được kiểm toán an ninh độc lập và phê duyệt **PASS** trên 7 tiêu chí: non-root UID 10001, `--read-only` rootfs, tmpfs 64MB `noexec`, `--network none`, Seccomp cho phép `clone`/`clone3` (phục vụ decoding/multithreading) và chặn các syscall nhạy cảm (`ptrace`, `mount`, `chroot`), quota cứng 0.5 CPU / 128MB RAM / 64 PIDs / timeout 5-10s, subprocess argument array không shell injection, `--rm` và dọn dẹp cách ly.
  - Tuy nhiên, máy chủ host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và phiên làm việc non-elevated không thể tự ý kích hoạt UAC Admin hoặc tự reboot máy. Do đó, việc triển khai mã sandbox worker bị dừng an toàn theo đúng chỉ thị, lệnh CLI `podman` chưa thể hoạt động.
  - Do chưa có worker container sandbox hoạt động thực tế trên host, parser media trên host process (`backend/app/services/media_facts.py:89-96`) tiếp tục được giữ **TẮT** (`duration_seconds: null`), bảo vệ an toàn cho tiến trình backend.
  - **Quy tắc cổng:** Project Security Gate cho Bước 3 tiếp tục được bảo lưu ở mức **PARTIAL** cho đến khi sandbox được cài đặt và kiểm chứng thực nghiệm; tuyệt đối **KHÔNG CHUYỂN SANG BƯỚC 4 (tích hợp model thật)**.

### 5.4. Trạng Thái Bước 4 (Thay Thế Adapter Bằng Baseline Model): CHƯA BẮT ĐẦU
- **Trạng thái Bước 4:** **CHƯA BẮT ĐẦU (NOT STARTED)**
- **Ranh giới thực thi:**
  - Bước 4 chỉ ở giai đoạn **nghiên cứu sẵn sàng (readiness research)** về mặt tài liệu và phương pháp luận; tuyệt đối chưa bắt đầu triển khai code hay tích hợp mô hình vào pipeline.
  - Parser media trên host process tiếp tục được giữ **TẮT** (`duration_seconds: null`).
  - Đã chuẩn bị bảng so sánh 2 model ứng viên sơ bộ (AASIST & RawNet2) vào hồ sơ nghiên cứu.
  - Tuyệt đối **KHÔNG tải bất kỳ tệp trọng số (model weights) hay bộ dữ liệu (dataset)** nào vào kho lưu trữ (repository).

---

## 6. Khảo Sát Runtime Tiên Quyết, Thiết Kế Sandbox Worker & Điều Kiện Bắt Đầu Bước 4

### 6.1. Bằng Chứng Thực Nghiệm Khảo Sát Môi Trường Windows Local (`state.runtime_install`)
- **Bộ cài đặt Podman Desktop Local:**
  - Nguồn tải: GitHub Releases chính thức của dự án Podman Desktop (`containers/podman-desktop/releases/tag/v1.30.5`).
  - Tệp lưu trữ: `installers\podman-desktop-1.30.5-setup-x64.exe` (Dung lượng: 162.833.128 bytes ~155.28 MB).
  - Kiểm chứng mã băm SHA-256 (bằng CertUtil): `0689d9389853a5256c2b0ce7a09c012399948a5df4c9c4d4735c09de1bbe6928`.
- **Hiện trạng máy host Windows 11 Home:**
  - Hệ điều hành: Microsoft Windows 11 Home Single Language (Build 26200 x64).
  - Quyền hạn phiên chạy: Người dùng tiêu chuẩn non-elevated (không thể tự nâng quyền Administrator hoặc tự khởi động lại máy).
  - Lệnh `wsl --status`: Output thực tế: `"The Windows Subsystem for Linux is not installed. You can install by running 'wsl.exe --install'."`
  - Lệnh `podman`: `'podman' is not recognized as an internal or external command` (chưa có trên PATH).
  - Docker Desktop: Không có `docker.exe` trên PATH; không có dịch vụ `com.docker.service` hay named pipe `\\.\pipe\docker_engine`.

### 6.2. Hướng Dẫn Điều Kiện Tiên Quyết Dành Cho Quản Trị Viên / Người Dùng
Để hoàn tất hạ tầng và kích hoạt container sandbox, người dùng/quản trị viên cần thực hiện lần lượt các bước sau:
1. **Bước 1 - Mở PowerShell với quyền Administrator (Elevated UAC):**
   Kích hoạt Virtual Machine Platform và cấu hình nền tảng WSL2 bằng lệnh:
   ```powershell
   wsl --install --no-distribution
   ```
   *(hoặc kích hoạt tính năng qua DISM: `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`)*.
2. **Bước 2 - Khởi động lại hệ điều hành bắt buộc (Mandatory System Reboot):**
   - *Rủi ro & Tác động:* Sau khi bật Virtual Machine Platform, **bắt buộc phải reboot máy tính** để Windows nạp kernel hypervisor virtualization driver.
   - *Cảnh báo:* Nếu chưa reboot, mọi nỗ lực khởi chạy Podman machine hay Docker container đều sẽ thất bại với lỗi thiếu hypervisor / kernel component.
3. **Bước 3 - Cài đặt Podman Desktop từ bộ cài đã chuẩn bị:**
   - Sau khi Windows khởi động lại, khởi chạy tệp cài đặt đã tải sẵn:
     `D:\Project_MMKNM\installers\podman-desktop-1.30.5-setup-x64.exe`
   - *Ưu điểm vận hành:* Cài đặt theo người dùng (per-user), hoàn toàn mã nguồn mở theo giấy phép **Apache 2.0** (không vướng ràng buộc bản quyền thương mại của Docker SSA). Khởi tạo Podman machine rootless trên WSL2 backend; vận hành hàng ngày không cần quyền Administrator.
   *(Nếu tổ chức chọn sử dụng Docker Desktop: Lưu ý điều kiện bản quyền Docker Subscription Service Agreement SSA - chỉ miễn phí cho cá nhân/doanh nghiệp nhỏ <250 nhân sự và <10 triệu USD doanh thu; cài đặt All-users yêu cầu quyền Administrator và phân quyền nhóm `docker-users`).*
4. **Bước 4 - Xác minh lệnh CLI:**
   - Chạy lệnh CLI để kiểm chứng engine đã hoạt động:
     ```powershell
     podman version
     # hoặc
     podman info
     ```
   - Chỉ khi lệnh trên trả về thông tin engine hoạt động và output phiên bản cụ thể, cổng an toàn kỹ thuật mới có cơ sở chuyển sang phê duyệt để mở sandbox worker.

### 6.3. Kiến Trúc Container Worker Nhỏ Nhất Đã Rà Soát Sẵn Sàng (`state.sandbox_design`)
Bản thiết kế kiến trúc sandbox worker nhỏ nhất (`Minimal Media Parser Worker`) đã được kiểm toán bảo mật độc lập (`state.sandbox_review`) xác nhận đáp ứng đầy đủ các tiêu chuẩn tại `docs/research/SECURITY_AND_PRIVACY.md:29-32`, sẵn sàng triển khai ngay khi runtime có mặt:
- **Base Image:** Stripped Alpine Linux / Distroless (< 30 MB) chỉ chứa binary `ffprobe` statically linked, không có shell, không package manager, không compiler.
- **Đặc quyền tối thiểu (Least Privilege):** Non-root user UID `10001:10001` (`sandboxworker`), gỡ bỏ toàn bộ capabilities (`--cap-drop ALL`), thiết lập cờ `--security-opt no-new-privileges:true`.
- **Hệ thống tệp (Filesystem):** Root filesystem `--read-only`, chỉ mount tmpfs ramdisk tạm thời per-task (`/tmp`), tự hủy container sau khi xử lý (`--rm`).
- **Cách ly mạng (Network Isolation):** `--network none`, chặn hoàn toàn lưu lượng outbound/inbound (ngăn chặn rủi ro C2, SSRF và data exfiltration).
- **Bộ lọc Syscall (Seccomp):** Seccomp profile nghiêm ngặt chặn các syscall nguy hiểm (`ptrace`, `clone`, `mount`, `chroot`).
- **Hạn ngạch tài nguyên (DoS Protection):** Hard timeout 5 giây, giới hạn bộ nhớ 128 MB, giới hạn CPU 0.5 core chống Decompression Bomb và CPU exhaustion.

### 6.4. Các Hạn Chế Kỹ Thuật Chưa Xác Minh
1. **Worker sandbox chưa có container runtime trên host:** Docker CLI và Podman không có trên PATH; chưa thể khởi tạo container cô lập trên máy Windows này.
2. **Bộ giải mã media tạm ngừng & Giới hạn thời lượng 60s chưa xác minh:** Parser media tiếp tục được giữ **TẮT** trên host process (`backend/app/services/media_facts.py:89-96`); trường `duration_seconds` trả về `null`. Giới hạn thời lượng 60 giây chưa được xác minh do parser tạm dừng.
3. **Browser sandbox origin gate chưa xác minh qua headless browser thực:** Môi trường host chưa cài đặt headless browser binary (như Playwright/Chromium trên PATH); kiểm tra UI responsive qua cấu trúc HTTP markup và CSS breakpoints.
4. **Chưa tích hợp ClamAV daemon trên host:** Daemon ClamAV chưa được cài đặt và tích hợp qua socket trên host.
5. **Cơ chế cô lập mạng:** Backend chỉ bind cục bộ `127.0.0.1` và thu hẹp CORS; chưa có network egress filtering ở mức kernel.
6. **Lưu trữ in-memory RAM với TTL:** Dữ liệu lưu trong RAM backend, tự giải phóng khi restart hoặc sau 15 phút; chưa có PostgreSQL và MinIO.
7. **Chưa tích hợp mô hình AI thực tế:** Chưa kết nối Celery worker, Redis queue hay các mô hình deep learning thật.

### 6.5. Điều Kiện Chính Xác Để Bắt Đầu Bước 4 (Thay Adapter Bằng Baseline Model)
Để bắt đầu triển khai Bước 4 trong `ROADMAP.md`, toàn bộ các điều kiện tiên quyết sau đây bắt buộc phải được thỏa mãn:
1. **Điều kiện 1 (Cài đặt Runtime & Kích hoạt Sandbox):** Quản trị viên hoàn tất cài đặt runtime (Podman/Docker Desktop), bật Virtual Machine Platform, khởi động lại Windows, và kích hoạt worker container sandbox cô lập (UID 10001, `--read-only`, `--network none`, Seccomp, quota 128MB/5s).
2. **Điều kiện 2 (Kích hoạt lại Parser An toàn trong Sandbox & Xác minh 60s):** Di chuyển toàn bộ tác vụ giải mã media vào bên trong container sandbox; xác minh trích xuất metadata và thực thi giới hạn thời lượng 60 giây trên các tệp kiểm thử an toàn mà không chạy trên host.
3. **Điều kiện 3 (Tích hợp Quét Mã Độc ClamAV):** Thiết lập ClamAV daemon kiểm tra virus cho toàn bộ tệp nhị phân tải lên trước khi đưa vào pipeline xử lý.
4. **Điều kiện 4 (Quản trị Mô hình & Test Holdout theo ROADMAP):** Chọn đúng một nhánh kiểm thử trước (chỉ audio hoặc chỉ video), xác minh tính hợp pháp của model card/license theo `SOURCES.md`, thiết lập benchmark protocol với tập dữ liệu holdout độc lập; chỉ bật nhãn model thật trên UI sau khi đã kiểm chứng độc lập trên tập holdout.
- **Quy tắc cổng an toàn:** Tuyệt đối **KHÔNG CHUYỂN SANG BƯỚC 4** khi các điều kiện container sandbox trên chưa hoàn tất.

### 6.6. Bảng So Sánh Sơ Bộ 2 Ứng Viên Baseline Model Audio (Nghiên Cứu Sẵn Sàng - Không Tải Weights/Dataset)
Hồ sơ nghiên cứu đã chuẩn bị bảng đối chiếu kỹ thuật giữa 2 mô hình ứng viên baseline cho nhánh âm thanh chống giả mạo (Audio Anti-Spoofing):

| Tiêu chí | AASIST (Jung et al., 2021/2022) | RawNet2 (Tak et al., 2021) |
|---|---|---|
| **Repo chính thức & Giấy phép Mã Nguồn** | [clovaai/aasist](https://github.com/clovaai/aasist) — Giấy phép **MIT** (NAVER Corp.). *Lưu ý:* Pretrained weights và dữ liệu ASVspoof chịu điều khoản phân phối riêng biệt. | [asvspoof-challenge/2021](https://github.com/asvspoof-challenge/2021/tree/main/LA/Baseline-RawNet2) — Giấy phép **MIT** (xác minh trực tiếp file `LICENSE`: MIT License Copyright (c) 2021 eurecom-asp). *Lưu ý:* Pretrained weights và dữ liệu ASVspoof chịu điều khoản riêng. |
| **Kiến trúc & Kích thước** | SincNet + H-GAT (Heterogeneous Graph Attention); AASIST: ~297k params; AASIST-L: 85.306 params | SincNet filterbanks + Residual blocks + 3 GRU layers (1024 nodes) + FC; ~4,4M params |
| **Tài nguyên tính toán** | Train: 1x GPU V100 16GB (bs=24); Inference: CPU đa nhân hoặc GPU <1GB VRAM (~120–150ms/clip) | Train: GPU 6–8GB VRAM (bs=32); Inference: CPU hoặc GPU <1GB VRAM (~200–300ms/clip) |
| **Định dạng & Độ dài đầu vào** | 16kHz, 16-bit mono PCM WAV; chuẩn cố định `nb_samp = 64600` (~4,04 giây; đệm lặp/cắt cửa sổ) | 16kHz, 16-bit mono PCM WAV; chuẩn cố định `nb_samp = 64600` (~4,04 giây) |
| **Benchmark công khai (EER)** | ASVspoof 2019 LA: **0,83%** (min t-DCF 0,0275); ASVspoof 2021 DF: **15,6%–17,5%** (chưa augment codec) | ASVspoof 2019 LA: **5,00%** (min t-DCF 0,1264); ASVspoof 2021 LA Progress: **9,49%**, DF Progress: **6,10%** |
| **Suy giảm miền (Domain Shift)** | Huấn luyện trên tiếng Anh (VCTK); lệch nghiêm trọng trước âm điệu 6 thanh tiếng Việt và phương ngữ Bắc-Trung-Nam | Tương tự; sinc-filters phụ thuộc đặc tính âm học gốc tiếng Anh, không học đặc trưng âm tiết mở/khép tiếng Việt |
| **Tác động nén OTT / Viễn thông** | Mất dải phổ cao (>4kHz/8kHz) trên Opus (Zalo/Telegram 6–24kbps), AMR-WB/NB; triệt tiêu đặc trưng pha vi mô | Băng thông hẹp và lượng tử hóa phá vỡ đáp ứng xung của SincNet, làm tăng mạnh tỷ lệ báo động giả |
| **Rủi ro FP / FN** | **FP:** Nhiễu nền, mic rẻ tiền bị gán nhãn fake; **FN:** Lọt qua bởi diffusion/neural vocoder thế hệ mới (CosyVoice, XTTS) | **FP:** Tạp âm đường truyền viễn thông bị nhận nhầm là artifact; **FN:** Không nhận diện được speech conversion chất lượng cao |

- **Đánh giá quyền dữ liệu & Đo lường độ tin cậy:**
  - *Giấy phép ASVspoof (ODC-By v1.0):* Bộ dữ liệu ASVspoof 2019/2021 tuân thủ *Open Data Commons Attribution License*. Cho phép nghiên cứu kèm trích dẫn nguồn; nghiêm cấm tải raw biometric audio của người thật lên repo công khai theo Luật số 91/2025/QH15.
  - *Calibration, PR-AUC & Cơ chế Abstain:* Không suy đoán xác suất từ logit thô; cần đo lường hiệu chuẩn qua **ECE (Expected Calibration Error)**, **Brier score** và **PR-AUC**. Khi entropy dự đoán vượt ngưỡng hoặc độ bất định cao, bắt buộc kích hoạt cơ chế **Abstain** (trả về nhãn `needs_review`, `confidence: null`).
  - *Cam kết an toàn dữ liệu:* Bảng so sánh trên phục vụ nghiên cứu phương pháp luận; **tuyệt đối KHÔNG tải bất kỳ tệp trọng số (model weights) hay bộ dữ liệu (dataset)** nào vào repo. Giữ parser media tiếp tục **TẮT** trên host process.

---

## 7. Xác Nhận Tuân Thủ & Không Git Commit / Deploy Ra Ngoài

- **Không tự ý Git commit / push:** Không thực hiện bất kỳ lệnh `git commit`, `git push` hay can thiệp vào remote git repository.
- **Không Public Deploy:** Hệ thống chỉ liên kết trên localhost (`127.0.0.1:8000` và `127.0.0.1:5173`), không mở tunnel (ngrok, cloudflare tunnel), không deploy ra staging hay hosting công cộng.
- **An toàn tệp:** Toàn bộ dữ liệu kiểm định là sóng âm thuần tổng hợp trong RAM; thư mục `backend/quarantine` được xác nhận sạch 100% (0 tệp tồn dư) sau kiểm thử.
- **Không ghi PID tạm:** Không ghi lại PID của các tiến trình tạm thời của hệ điều hành, tuân thủ nguyên tắc chỉ ghi nhận kết quả và dữ liệu có output chứng minh.

---

## 8. Mốc Hoàn Thiện Giao Diện Web v1 (UI Completion & User Flow Verification)

- **Cải tiến Copy & Trải nghiệm (UX):**
  1. *Chính xác hóa mô tả hạ tầng:* Thay đổi nhãn thành `"Backend bind localhost (127.0.0.1); không phải network isolation"`.
  2. *Chuẩn hóa nhãn bộ lọc minh họa:* Thay các nút kỹ thuật thành `"Mẫu âm thanh (Minh họa)"`, `"Mẫu hình ảnh (Minh họa)"`, `"Mẫu kịch bản (Minh họa)"`, hỗ trợ `role="toolbar"` và `aria-pressed`.
  3. *Hộp cảnh báo trên từng Mock Cue:* Gắn huy hiệu `"Mẫu minh họa / Mock"` cùng dòng chú thích nổi bật: *"Lưu ý: Tín hiệu mẫu này KHÔNG được suy ra hay phát hiện từ tệp media người dùng tải lên."*
  4. *Khuyến nghị an toàn có căn cứ:* Thay khẳng định tuyệt đối bằng hướng dẫn thận trọng dựa trên tài liệu Cục An toàn thông tin và Bộ Công an (cảnh giác khi bị đe dọa, ép chuyển tiền gấp, đòi mã OTP; ngắt liên lạc và tự xác minh qua kênh độc lập).
  5. *Làm rõ ranh giới cử động hình ảnh:* Bỏ quan điểm cử động vẫy tay hay quay mặt là bằng chứng deepfake tin cậy; khuyến cáo không dùng thử thách video để kết luận thật/giả.
  6. *Trợ năng & Responsive:* Tích hợp đầy đủ phím (`Enter`/`Space`) cho checklist và scenario tabs; xác minh bố cục responsive trên cả desktop (1920x1080) và mobile (375x667).
  7. *Khởi chạy độc lập:* Frontend QA dùng cờ `--strictPort` trên cổng khả dụng (5173); Vite proxy chuyển tiếp chính xác `/api` và `/health` sang backend.
- **Cách mở xem trực tiếp trên máy local:**
  - Cửa sổ 1 (Backend): `cd backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - Cửa sổ 2 (Frontend): `cd frontend && npm run dev -- --host 127.0.0.1 --port 5173`
  - Truy cập: `http://127.0.0.1:5173` (hoặc cổng in ra terminal nếu 5173 bị chiếm dụng).



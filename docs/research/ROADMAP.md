# Roadmap triển khai cho Empryo

Mỗi chặng cần đầu ra review được. Đừng chuyển sang chặng tiếp nếu tiêu chí bảo mật/độ tin cậy liên quan chưa đạt.

## 0. Khảo sát repo và đóng băng scope

- Đọc `README.md`, `PROJECT_BLUEPRINT.md`, agent profiles, `backend/`, `frontend/`, lockfiles và trạng thái Git.
- Ghi stack/runtime hiện có, lệnh chạy hiện tại và phần nào thật sự đã implement.
- Chốt MVP: upload local + demo adapter trước; URL ingest, API ngoài và production hosting mặc định off.
- **Đầu ra:** inventory repo, sơ đồ luồng, danh sách giả định.

## 1. Threat model và product contract

- Lập data-flow, asset, trust boundaries, STRIDE và abuse cases theo `SECURITY_AND_PRIVACY.md`.
- Định nghĩa API schema có `mode=demo/model`, uncertainty và report version.
- Viết privacy notice/retention behavior cho prototype.
- **Gate:** không lưu media/transcript lâu hoặc gửi vendor ngoài theo mặc định.

## 2. Vertical slice demo

- UI upload → API tạo job → queue/worker → report demo → UI kết quả.
- Ràng buộc demo rõ trên UI và response; không giả điểm thật.
- Implement status/error/cleanup path trước visualization nâng cao.
- **Đầu ra:** một luồng end-to-end chạy local với dữ liệu vô hại.

## 3. Hardening pipeline file [TRẠNG THÁI: PARTIAL - 12/11/2026]

- **Hiện trạng & Tách Biệt Rõ Ràng 3 Trạng Thái Kỹ Thuật:**
  1. **Nghiệm thu Web v1 (Web v1 Local Demo & UI Completion):** **VERDICT: PASS** (chạy local an toàn; toàn bộ luồng giao diện, bộ lọc minh họa, disclaimer cảnh báo, checklist 4 bước, tabs kịch bản, responsive layout, phím trợ năng ARIA, xóa phiên HTTP 204/404 và Vite proxy đạt 100% kiểm thử E2E).
  2. **Đánh giá Cổng An Toàn Dự Án cho Bước 3 (Project Security Gate):** **VERDICT: PARTIAL** (các kiểm soát mã nguồn ASGI đạt kiểm thử; tuy nhiên do chưa có worker container sandbox cô lập cho parser media trên host, cổng an toàn kỹ thuật được bảo lưu ở mức PARTIAL cho đến khi sandbox được cài đặt và kiểm chứng thực nghiệm, tuyệt đối không chuyển sang Bước 4).
  3. **Bước 4 (Baseline Model):** **TRẠNG THÁI: CHƯA BẮT ĐẦU** (chỉ ở giai đoạn nghiên cứu sẵn sàng; giữ parser media trên host tiếp tục **TẮT**; đã hoàn tất bảng so sánh sơ bộ 2 model ứng viên AASIST & RawNet2 trong hồ sơ nghiên cứu mà không tải weights/dataset vào kho lưu trữ).
- **Lịch sử Run Records Empryo (giữ nguyên verdict lịch sử PASS từ Node Judge):**
  - Run `orun-3-d1b421a5` (Hardening Pipeline File): Node Judge ghi nhận phán quyết **VERDICT: PASS** trên 7 tiêu chí kiểm thử logic, middleware, giới hạn tải và unit/security tests.
  - Run `orun-4-98512fde` (Web v1 UI Completion): Node Judge ghi nhận phán quyết **VERDICT: PASS** trên các tiêu chí cải tiến copy/UX, nhãn minh họa kèm disclaimer, khuyến nghị ATTT/Bộ Công an, ARIA accessibility, responsive breakpoints và kiểm thử cổng động độc lập.
  - Run `orun-8-75b45a3d` (Runtime Sandbox v1): Tải bộ cài chính thức Podman Desktop v1.30.5; thẩm định thiết kế sandbox worker Podman 7 tiêu chí an ninh đạt **PASS**; Runtime Gate Judge phán quyết **VERDICT: PARTIAL** do host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và cần quyền Administrator cùng thao tác reboot; Project Security Gate Bước 3 tiếp tục giữ mức **PARTIAL**; Bước 4: **CHƯA BẮT ĐẦU**.
- **Ngày chạy kiểm thử, URL & Cổng thực tế:**
  - Ngày chạy: 12-11-2026.
  - Cổng người dùng chạy thủ công: Backend `http://127.0.0.1:8000` (Port 8000), Frontend `http://127.0.0.1:5173` (Port 5173).
  - Cơ chế cổng động của QA runner (`backend/tests/e2e_runner.py`): Tự động phát hiện cổng bận qua `find_available_port(8000)` và `find_available_port(5173)`. Khi cổng bận, runner linh hoạt gán cổng rảnh kế tiếp (như 8001 cho backend, 5174 với `--strictPort` và `VITE_API_BASE_URL` động cho frontend) để không can thiệp hay dừng tiến trình của người dùng. Trong lần chạy nghiệm thu khi cổng mặc định sẵn sàng, runner đã bind và kiểm tra trực tiếp trên Backend `http://127.0.0.1:8000` và Frontend `http://127.0.0.1:5173`.
- **Các lệnh QA đã chạy, Exit Code và Kết quả thực tế quan sát được:**
  - `cd frontend && npm ci`: Exit code `0` (`added 97 packages, and audited 98 packages in 16s. found 0 vulnerabilities`).
  - `cd frontend && npm run build`: Exit code `0` (`tsc && vite build` hoàn tất trong 1.89s, 26 modules transformed, bundle sạch tại `dist/`: `dist/index.html` 0.84 kB, `dist/assets/index-OA5PTvZI.css` 25.98 kB, `dist/assets/index-slWC67ZC.js` 268.00 kB; 0 lỗi typecheck/bundling).
  - `cd frontend && npm audit`: Exit code `0` (`found 0 vulnerabilities`).
  - `cd backend && .\.venv\Scripts\python.exe -m pytest -q`: Exit code `0` (`14 passed in 0.47s`, 14/14 tests đạt).
  - `backend\.venv\Scripts\python.exe backend/tests/e2e_runner.py`: Exit code `0` (Đạt 100% 20/20 phép kiểm tra: 2 kiểm tra cổng khả dụng, 17 kiểm tra HTTP/UI contract/hardening, 1 kiểm tra dọn sạch thư mục quarantine 0 tệp tồn dư; teardown đóng cổng an toàn, không rò rỉ kết nối). Không ghi nhận và không lưu trữ PID tạm thời.
- **Ranh giới bảo mật & Lý do giữ PARTIAL:**
  - *Đã triển khai & xác minh:* Chặn sớm Content-Length trước parser (HTTP 413), chunked streaming cutoff (HTTP 413), concurrency barrier limiter (Semaphore 3 slots trả 429 kèm `Retry-After: 5`), timeout runtime qua `asyncio.wait_for` trả 504 phản ánh đúng cấu hình (mặc định production 60s, QA đặt 2s), dọn dẹp quarantine sau mọi tình huống (0 tệp tồn dư), bind local `127.0.0.1` và thu hẹp CORS (lưu ý: không phải network isolation).
  - *Thẩm định thiết kế Sandbox Worker Podman (Run orun-8-75b45a3d):* Đạt phê duyệt **PASS** qua kiểm toán an ninh trên 7 tiêu chí (non-root UID 10001, `--read-only` rootfs, tmpfs `/tmp` noexec 64MB, `--network none`, Seccomp cho phép clone/chặn ptrace/mount, quota 0.5 CPU / 128MB RAM / timeout 5-10s, subprocess đối số mảng, `--rm` cleanup). Bộ cài chính thức `podman-desktop-1.30.5-setup-x64.exe` (SHA-256: `0689d9389853a5256c2b0ce7a09c012399948a5df4c9c4d4735c09de1bbe6928`) đã được tải về `installers/`.
  - *Gate chưa đạt (Blocker - Runtime Prerequisite Missing):* Host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 (`wsl --status`: "The Windows Subsystem for Linux is not installed"). Việc kích hoạt đòi hỏi quyền elevated Administrator (hộp thoại UAC) và bắt buộc phải reboot máy để nạp kernel hypervisor virtualization driver. Khi chưa có runtime thực tế, việc viết mã sandbox worker bị dừng an toàn theo đúng chỉ thị. Parser media trên host process (`backend/app/services/media_facts.py:89-96`) tiếp tục được giữ **TẮT** (`duration_seconds: null`). Project Security Gate tiếp tục bảo lưu ở mức **PARTIAL**; tuyệt đối **CHƯA BẮT ĐẦU BƯỚC 4**.
- **Khảo sát Runtime Tiên Quyết & Hướng Dẫn Các Bước Dành Cho Quản Trị Viên (Runtime Preflight Survey):**
  - *Bằng chứng thực nghiệm Windows local (Read-Only):*
      - Bộ cài local: `installers\podman-desktop-1.30.5-setup-x64.exe` (162.833.128 bytes, CertUtil SHA-256: `0689d9389853a5256c2b0ce7a09c012399948a5df4c9c4d4735c09de1bbe6928`).
      - Docker Desktop: Không có `docker.exe` trên PATH; không có dịch vụ Windows `com.docker.service`; named pipe `\\.\pipe\docker_engine` không tồn tại.
      - Podman CLI: Lệnh `podman` chưa có trên PATH; engine chưa hoạt động.
      - WSL2: `wsl --status` xác nhận WSL chưa cài đặt trên Windows.
  - *Các bước người dùng/quản trị viên cần thực hiện tiếp theo:*
      1. **Bước 1 - Mở PowerShell với quyền Administrator (Elevated UAC):**
         Kích hoạt Virtual Machine Platform và cấu hình nền tảng WSL2:
         ```powershell
         wsl --install --no-distribution
         ```
         *(hoặc qua lệnh DISM: `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`)*.
      2. **Bước 2 - Khởi động lại hệ điều hành bắt buộc (Mandatory System Reboot):**
         *Rủi ro & Tác động:* Bắt buộc khởi động lại Windows sau khi kích hoạt tính năng ảo hóa để nạp virtualization driver ở cấp kernel. Nếu chưa khởi động lại, các container runtime (Podman/WSL2/Docker) không thể khởi tạo engine ảo hóa và sẽ gặp lỗi kernel thiếu.
      3. **Bước 3 - Cài đặt Podman Desktop:**
         Sau khi khởi động lại máy, khởi chạy bộ cài đặt đã chuẩn bị:
         `D:\Project_MMKNM\installers\podman-desktop-1.30.5-setup-x64.exe`
         *(Hoàn toàn mã nguồn mở theo giấy phép Apache 2.0, không giới hạn thương mại SSA; cài đặt per-user; khởi tạo Podman machine rootless trên WSL2 backend; vận hành hàng ngày không cần quyền Admin)*.
      4. **Bước 4 - Xác minh CLI hoạt động:**
         Chạy lệnh kiểm chứng CLI:
         ```powershell
         podman version
         ```
         Chỉ triển khai mã sandbox worker khi lệnh trả về output phiên bản thực tế của engine.
  - **Thiết Kế Worker Container Sandbox Nhỏ Nhất (Đã Rà Soát Sẵn Sàng Kích Hoạt):**
  - Kiến trúc sandbox container cô lập (`Minimal Media Parser Worker`) đã được thẩm định an toàn độc lập và sẵn sàng triển khai ngay khi runtime có mặt:
      - *Base Image:* Minimal Alpine / Distroless (< 30 MB) chỉ chứa binary `ffprobe` statically linked, không có shell hay compiler.
      - *Đặc quyền tối thiểu (Least Privilege):* Chạy dưới non-root UID `10001:10001`, thiết lập `--security-opt no-new-privileges:true`, `--cap-drop ALL`.
    - *Hệ thống tệp & Mạng:* Rootfs `--read-only`, chỉ mount ephemeral ramdisk tmpfs per-task, cô lập mạng tuyệt đối với `--network none` (ngăn triệt để C2/SSRF/exfiltration).
    - *Syscall & Tài nguyên:* Seccomp profile chặn các syscall nguy hiểm (ptrace, clone, mount); quota cứng timeout 5s, bộ nhớ 128MB, CPU cap 0.5 core, tự hủy container (`--rm`).
- **Danh sách các hạn chế kỹ thuật chưa xác minh:**
  1. *Worker media parser sandbox trên host:* Thiếu container runtime (Docker/Podman); chưa thể khởi tạo container cô lập trên host.
  2. *Giới hạn thời lượng media 60 giây:* Chưa được xác minh do parser media tạm ngừng hoạt động trên host.
  3. *Browser sandbox origin gate:* Host chưa có headless browser binary (như Playwright/Chromium trên PATH); giao diện responsive (desktop 1920x1080 và mobile 375x667) và hợp đồng UI được xác minh qua cấu trúc HTTP markup và phân tích CSS breakpoints thay vì render trực tiếp qua browser engine.
  4. *Quét mã độc ClamAV:* Daemon ClamAV chưa được cài đặt và tích hợp qua socket trên host.
  5. *Cơ chế cô lập mạng:* Chỉ bind localhost `127.0.0.1` và thu hẹp CORS; chưa có network egress filtering ở mức kernel.
  6. *Lưu trữ in-memory RAM với TTL:* Dữ liệu lưu trong RAM backend, tự giải phóng khi restart hoặc sau 15 phút; chưa có PostgreSQL và MinIO.
  7. *Chưa tích hợp mô hình AI thực tế:* Chưa kết nối Celery worker, Redis queue hay các mô hình deep learning.
- **Điều kiện chính xác để bắt đầu Bước 4:**
  1. Hoàn tất cài đặt container runtime (Podman/Docker Desktop) có WSL2/Hyper-V virtualization nạp hoàn tất trên host Windows.
  2. Kích hoạt worker container sandbox cô lập (UID 10001, `--read-only`, `--network none`, Seccomp, quota 128MB/5s) theo thiết kế đã được rà soát.
  3. Kích hoạt lại parser an toàn bên trong container sandbox, xác minh giải mã metadata và kiểm chứng giới hạn thời lượng 60 giây trên các tệp mẫu an toàn mà không chạy trên host.
  4. Tích hợp ClamAV daemon quét virus tệp tải lên trước khi đưa vào pipeline phân tích.
  5. Thiết lập quy trình quản trị mô hình: chọn đúng một nhánh (audio hoặc video), xác minh nguồn gốc/license/model card theo `SOURCES.md`, và chạy benchmark protocol trên tập test holdout độc lập trước khi kích hoạt trên UI.
  - **Quy tắc cổng:** Tiếp tục bảo lưu trạng thái **PARTIAL** cho Bước 3. Giữ parser media trên host tiếp tục **TẮT**; tuyệt đối **KHÔNG CHUYỂN SANG BƯỚC 4 (tích hợp model thật)** khi chưa hoàn tất container runtime và vượt qua bài kiểm tra thẩm định cách ly thực tế.
- **Cam kết tuân thủ:** Không tự ý git commit, không push, không deploy ra môi trường public hay mở tunnel.

## 4. Thay adapter bằng baseline model [TRẠNG THÁI: CHƯA BẮT ĐẦU - CHỈ Ở GIAI ĐOẠN NGHIÊN CỨU SẴN SÀNG; GIỮ PARSER TẮT TRÊN HOST]

- **Hiện trạng giai đoạn:** Bước 4 **CHƯA BẮT ĐẦU**. Dự án hiện chỉ hoàn thành công tác nghiên cứu sẵn sàng (readiness research) về phương pháp luận và đối chiếu kỹ thuật tài liệu; tuyệt đối chưa bắt đầu viết code tích hợp hay tải mô hình vào hệ thống.
- **Ranh giới an toàn:** Parser media trên host process tiếp tục được giữ **TẮT** (`duration_seconds: null`). Tuyệt đối **KHÔNG tải bất kỳ tệp trọng số (model weights) hay bộ dữ liệu (dataset)** nào vào kho lưu trữ (repository).
- **Bảng So Sánh Sơ Bộ 2 Ứng Viên Baseline Model Audio (Nghiên Cứu Sẵn Sàng - Không Tải Weights/Data):**

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

- **Kế hoạch triển khai khi cổng an toàn mở:**
  - Chọn đúng một nhánh trước (audio anti-spoofing), xác minh nguồn/license/model card theo `SOURCES.md`.
  - Chạy benchmark protocol có test holdout độc lập; tuân thủ giấy phép dữ liệu ODC-By v1.0 và Luật bảo vệ dữ liệu cá nhân 91/2025/QH15.
  - Đo lường độ tin cậy qua ECE, Brier score, PR-AUC; áp dụng cơ chế Abstain (`needs_review`, `confidence: null`) khi độ bất định cao.
  - Thêm model version, preprocess version và threshold; không điều chỉnh trên test.
  - **Gate:** UI chỉ gọi là model thật sau khi kiểm chứng trên test độc lập; còn lại giữ demo/experimental. Tuyệt đối không kích hoạt khi chưa có sandbox container.

## 5. Thêm ngữ cảnh tiếng Việt

- Thiết kế taxonomy scam-cue không gán nhãn người phạm tội.
- Tạo/thu thập ví dụ có consent và license; hai annotator nếu có thể; đo disagreement.
- Whisper/ASR tùy chọn, không lưu transcript mặc định.
- **Gate:** đánh giá false alarms theo miền/giọng; abstain khi bất định cao.

## 6. Giao diện báo cáo và tài liệu học thuật

- Giải thích provenance từng signal; không dựng heatmap giả như evidence.
- Tạo sơ đồ kiến trúc, threat model, data-flow, API contract.
- Viết báo cáo/slide theo `PROJECT_BRIEF.md` và chỉ sử dụng số liệu thực nghiệm.
- **Gate:** mọi biểu đồ/kết quả có caption, nguồn dữ liệu, metric và giới hạn.

## 7. Kiểm chứng và bàn giao

- Chạy kiểm tra liên quan đến thay đổi, các luồng UI/API thật và security cases trong môi trường an toàn.
- Ghi phiên bản dependencies/tools tại ngày chạy, lệnh và kết quả; không khẳng định điều chưa chạy.
- Cập nhật `SOURCES.md`, `README.md`, agent instructions và known limitations.
- **Gate phát hành:** pháp lý/quyền dữ liệu, privacy notice, secrets, retention, sandbox, model validity, accessibility.

## Hướng dẫn điều phối agent

1. Một agent sở hữu một vùng file rõ ràng; không sửa chồng lấn khi chưa thống nhất.
2. `researcher` xác minh nguồn/license/model cards; không tự tải dataset bị hạn chế.
3. `security-auditor` lập STRIDE và review cấu hình; không đưa payload nguy hiểm vào môi trường host.
4. `ai-engineer` chỉ thay mock bằng model sau khi protocol/rights được chốt.
5. `fullstack-developer` tích hợp API/UI theo schema; không hiển thị “% xác suất” chưa hiệu chuẩn.
6. `qa-engineer` kiểm tra luồng thực và edge cases bằng mẫu an toàn, không tạo test data chứa malware thực.
7. Agent tổng hợp phải đọc diff, xác nhận provenance, license và báo rõ việc chưa xong.


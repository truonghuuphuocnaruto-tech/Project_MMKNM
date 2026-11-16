# AI Voice & Video Scam Checker

Web demo giáo dục về nhận biết rủi ro media và lừa đảo qua cuộc gọi. Hệ thống bao gồm hai trải nghiệm được phân tách rõ ràng trên cùng một ứng dụng frontend:
1. **Trang giới thiệu sản phẩm dạng Scrollytelling (`/`):** Website truyền thông giáo dục, hướng dẫn người dùng "Dừng một nhịp trước khi tin", nhận biết các tình huống gây áp lực tâm lý, quy trình xác minh 3 bước độc lập, ranh giới an toàn và checklist phòng ngừa.
2. **Ứng dụng Upload Demo Cục Bộ (`/app`):** Ứng dụng phân tích cục bộ hiện hữu chạy với adapter `mode=demo`. Ứng dụng **không phát hiện deepfake**, không xác minh danh tính và không kết luận có lừa đảo.

## Kiến Trúc Hai Trải Nghiệm (Dual-Route Experience)

Ứng dụng frontend sử dụng bộ định tuyến native zero-dependency (dựa trên HTML5 History API `pushState`, `popstate` và window events) để cô lập hoàn toàn hai giao diện:
- **Route `/` (Product Story Site):** Trình diễn phong cách báo chí (editorial scrollytelling), tông nền giấy sáng ấm (`#faf8f5`), thanh điều hướng cố định hỗ trợ anchor link (`#tinh-huong`, `#cach-xu-ly`, `#cong-cu`, `#gioi-han`, `#checklist`, `#quyen-rieng-tu`), 100% cuộn gốc (native scroll), hỗ trợ đầy đủ phím trợ năng (skip-link, ARIA landmarks) và tự động tắt chuyển động khi người dùng bật `prefers-reduced-motion`.
- **Route `/app` (Analysis App Demo):** Giữ nguyên 100% trải nghiệm ứng dụng phân tích tải tệp dark theme (`#0b1120`), luồng kiểm tra sức khỏe backend, tính toán mã băm SHA-256, hiển thị metadata tệp đo được, thẻ tín hiệu mẫu minh họa hư cấu (cues mock), checklist xác minh 4 bước và chức năng xóa phiên dữ liệu khỏi bộ nhớ RAM.
- **Điều hướng chuyển tiếp:** Các nút CTA *"Mở bản demo local (/app)"* trên trang landing page cho phép chuyển hướng tức thì sang `/app`. Nút *"← Quay lại trang giới thiệu"* trên `/app` cho phép quay trở về `/`. Hỗ trợ hoàn hảo các nút Browser Back/Forward và tải trực tiếp/refresh trang tại cả hai route.

## Chạy trên Windows

Yêu cầu Python 3.10 trở lên, Node.js 22 trở lên và npm. Mở hai cửa sổ PowerShell tại thư mục dự án.

### Cửa sổ 1: backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Cửa sổ 2: giao diện

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ URL hiển thị trên terminal ở Cửa sổ 2 (mặc định là [http://127.0.0.1:5173](http://127.0.0.1:5173)):
- **Truy cập Trang giới thiệu sản phẩm (Story Site):** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Truy cập Trực tiếp Ứng dụng Demo (Local App):** [http://127.0.0.1:5173/app](http://127.0.0.1:5173/app)

**Phân biệt Cổng/URL mặc định thủ công vs Cổng QA runner:**
- **Khi người dùng chạy thủ công:** Backend mặc định tại [http://127.0.0.1:8000](http://127.0.0.1:8000), Frontend mặc định tại [http://127.0.0.1:5173](http://127.0.0.1:5173). Nếu cổng 5173 đang bận, Vite sẽ tự động chuyển sang cổng khả dụng tiếp theo (ví dụ `5174`, `5175`...); người dùng cần truy cập theo đúng cổng in ra terminal (dòng `Local: http://127.0.0.1:<cổng>/`). Dừng mỗi dịch vụ bằng `Ctrl+C` tại cửa sổ tương ứng. API docs mở tại [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
- **Khi chạy QA runner (`backend/tests/e2e_runner.py`):** Runner tự động dò tìm cổng khả dụng bằng `find_available_port(8000)` và `find_available_port(5173)`. Nếu phát hiện cổng mặc định 8000 hoặc 5173 đang bận (ví dụ do server người dùng đang chạy), QA runner tự động chọn cổng kế tiếp (như 8001 cho backend, 5174 kèm `--strictPort` cho frontend), truyền biến môi trường `VITE_API_BASE_URL` động trỏ đúng backend port mới, và tuyệt đối không can thiệp hay dừng tiến trình của người dùng.

> Nếu `npm ci` báo thiếu lockfile, chạy `npm install` một lần trong `frontend/` để tạo lockfile, sau đó dùng `npm ci` ở các lần sau.

## Luồng demo

Chọn một tệp audio/video tối đa 15 MiB → tải lên backend local → nhận các thông số byte, SHA-256, MIME do trình duyệt khai báo (thời lượng hiển thị 'Chưa phân tích' do parser media tạm ngừng chạy trên host process để chờ container sandbox độc lập) → xem tín hiệu giáo dục minh họa và checklist xác minh → xóa báo cáo khỏi RAM backend. Tệp tạm được xóa sau khi tính thông số. Báo cáo RAM tự mất khi backend dừng.

Các định dạng media không được giải mã trực tiếp trên host khi chưa có container sandbox; giới hạn thời lượng 60 giây tạm thời chưa được xác minh do parser tắt. MIME chưa được xác minh theo byte nội dung. Tín hiệu trong báo cáo là mock và không liên quan đến tệp đã tải. Không có tải URL, API bên thứ ba, mô hình phát hiện, xác suất, hay triển khai public.

## Tài liệu dự án

- [Hồ sơ nghiên cứu](docs/research/README.md)
- [Báo cáo bàn giao kỹ thuật Web v1 Local](docs/research/FIRST_WEB_HANDOFF.md)
- [Báo cáo bàn giao kỹ thuật Product Story Site](docs/product/PRODUCT_STORY_SITE_HANDOFF.md)
- [Brief yêu cầu Product Story Site](docs/product/PRODUCT_STORY_SITE_BRIEF.md)
- [Brief điều phối Empryo Orchestrate cho web v1](docs/research/EMPRYO_FIRST_WEB_ORCHESTRATION.md)
- [Nhật ký điều phối Orchestration](docs/research/EMPRYO_RUN_LOG.md)
- [Blueprint ban đầu](PROJECT_BLUEPRINT.md), chỉ dùng làm bản nháp; quyết định hiện hành nằm trong hồ sơ nghiên cứu

## Phiên bản đã kiểm chứng trong workspace

Backend chạy Python 3.15.2, FastAPI 0.162.4, Uvicorn 0.54.0, Pydantic 2.14.3, python-multipart 0.0.33, Pytest 9.2.0, HTTPX 0.28.1. Frontend chạy Node.js v24.22.1, npm 11.19.1, React 19.3.1, Vite 8.3.8, @vitejs/plugin-react 6.3.0, TypeScript 5.6.3. Phiên bản chi tiết được khóa trong `frontend/package-lock.json`. Bộ kiểm thử E2E tự động hóa khép kín có thể chạy qua `backend/.venv/Scripts/python.exe backend/tests/e2e_runner.py`.

## Trạng thái nghiệm thu & Kết quả kiểm thử thực tế (12-11-2026)

- **URL & Cổng:**
  - *Cổng mặc định người dùng chạy thủ công:* Backend tại [http://127.0.0.1:8000](http://127.0.0.1:8000) (Port 8000), Frontend tại [http://127.0.0.1:5173](http://127.0.0.1:5173) (Port 5173).
  - *Cơ chế cổng động của QA runner (`e2e_runner.py`):* Tự động dò tìm cổng rảnh từ 8000 và 5173 qua `find_available_port`; tự chọn cổng kế tiếp nếu phát hiện cổng bận (kèm `--strictPort` và `VITE_API_BASE_URL` động), không chiếm cổng hay dừng tiến trình của người dùng. Trong lần chạy nghiệm thu khi cổng mặc định sẵn sàng, runner đã sử dụng trực tiếp cổng 8000 và 5173.
- **Các lệnh QA đã chạy & Exit Code thực tế:**
  - `cd frontend && npm ci`: Exit code `0` (`added 97 packages, and audited 98 packages in 16s. found 0 vulnerabilities`).
  - `cd frontend && npm run build`: Exit code `0` (`tsc && vite build` hoàn tất trong 1.89s, 26 modules transformed, sinh ra bundle sạch tại `dist/`: `dist/index.html` 0.84 kB, `dist/assets/index-OA5PTvZI.css` 25.98 kB, `dist/assets/index-slWC67ZC.js` 268.00 kB).
  - `cd frontend && npm audit`: Exit code `0` (`found 0 vulnerabilities`).
  - `cd backend && .\.venv\Scripts\python.exe -m pytest -q`: Exit code `0` (`14 passed in 0.47s`, 14/14 tests đạt).
  - `backend\.venv\Scripts\python.exe backend/tests/e2e_runner.py`: Exit code `0` (Đạt 100% 20/20 phép kiểm tra: gồm 2 bước kiểm tra tính khả dụng cổng, 17 bước kiểm tra HTTP/UI contract/hardening, và 1 bước kiểm tra dọn sạch thư mục quarantine 0 tệp tồn dư; giải phóng tiến trình và đóng cổng an toàn).
- **Lịch sử Run Records & Phán Quyết Trọng Tài:**
  - *Run `orun-3-d1b421a5` (Hardening Pipeline File):* Node Judge phán quyết **VERDICT: PASS** trên 7 tiêu chí kiểm thử logic, middleware, và unit/security tests.
  - *Run `orun-4-98512fde` (Web v1 UI Completion):* Node Judge phán quyết **VERDICT: PASS** đối với việc hoàn thiện copy/UX, nhãn minh họa kèm disclaimer cảnh báo rõ ràng, cập nhật khuyến nghị theo Cục ATTT & Bộ Công an, trợ năng ARIA, responsive breakpoints và kiểm thử cổng động độc lập.
  - *Run `orun-8-75b45a3d` (Runtime Sandbox v1):* Node Judge phán quyết **VERDICT: PARTIAL** (tải bộ cài chính thức Podman Desktop v1.30.5; thẩm định thiết kế sandbox worker Podman 7 tiêu chí đạt PASS qua kiểm toán an ninh; Runtime Gate Judge phán quyết PARTIAL do host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và cần quyền Administrator cùng thao tác reboot; dừng an toàn trước thay đổi hệ điều hành).
  - *Run `orun-1-5aad2086` & Phiên đối chiếu (Product Story Site v1):* Run gốc `orun-1-5aad2086` hoàn tất với top-level `done` và terminal `final-pass`, nhưng node `judge` gặp lỗi `no VERDICT line in the reply` và node `handoff` tự phát sinh PASS ngoài luồng (run gốc chưa có Judge PASS hợp lệ). Trong phiên đối chiếu (Reconciliation 16-11-2026), toàn bộ artifacts thực tế được xác minh; cập nhật tiêu đề trung tính và đường dẫn `backend/app/` tại `PrivacySection.tsx:89,92`; `npm run build` đạt exit code 0; 34/34 ca kiểm thử browser tự động qua Chrome CDP đạt exit code 0 kèm 6 ảnh screenshot thực tế; cấu trúc lại graph cô lập `handoff-pass` và `handoff-partial` (cạnh fallback `always` vẫn tồn tại nhưng chỉ trỏ về `handoff-partial/final-partial`, không có cạnh `always` nào dẫn tới `final-pass`; xác nhận schema cấu hình, chưa kiểm chứng bằng live run); thẩm định độc lập bởi reviewer `security-auditor` kết luận **VERDICT: PASS** trên 5 tiêu chí nghiệm thu (giữ Security Gate Bước 3 ở mức PARTIAL, parser media trên host tắt, giới hạn WAV 60s chưa kiểm chứng khi parser tắt, Bước 4 CHƯA BẮT ĐẦU).
- **Tách Biệt Rõ Ràng 3 Trạng Thái Kỹ Thuật Dự Án:**
  1. **Web v1 Local Demo:** **VERDICT: PASS** (chạy local an toàn; hoàn tất luồng upload demo, facts tệp, mock cues có disclaimer cảnh báo, checklist 4 bước, tabs kịch bản, responsive layout, phím trợ năng ARIA, xóa phiên HTTP 204 $\rightarrow$ 404, và Vite proxy chuyển tiếp cổng chuẩn xác; 20/20 bài test E2E đạt).
  2. **Bước 3 Project Security Gate (Cổng An Toàn Dự Án):** **VERDICT: PARTIAL** (phân biệt rạch ròi với verdict lịch sử PASS của run `orun-3-d1b421a5` và `orun-4-98512fde`; thiết kế sandbox worker Podman 7 tiêu chí đạt PASS kiểm toán an ninh, tuy nhiên runtime trên host chưa có và đang chờ thao tác Administrator/reboot từ người dùng; cổng an toàn kỹ thuật được bảo lưu ở mức PARTIAL; tuyệt đối không chuyển sang Bước 4).
  3. **Bước 4 (Baseline Model):** **TRẠNG THÁI: CHƯA BẮT ĐẦU** (chỉ ở giai đoạn nghiên cứu sẵn sàng; giữ parser media trên host process tiếp tục **TẮT**; tuyệt đối CHƯA BẮT ĐẦU khi Bước 3 là PARTIAL).
- **Khảo Sát Runtime Tiên Quyết & Hướng Dẫn Quản Trị Viên (Admin Installation Guide):**
  - *Môi trường thực tế & Bộ cài local:*
      - Bộ cài đặt: `installers\podman-desktop-1.30.5-setup-x64.exe` (162.833.128 bytes, SHA-256: `0689d9389853a5256c2b0ce7a09c012399948a5df4c9c4d4735c09de1bbe6928`), tải trực tiếp từ GitHub Releases chính thức.
    - Hiện trạng host: Windows 11 Home Single Language x64, phiên làm việc non-elevated. Lệnh `wsl --status` xác nhận: "The Windows Subsystem for Linux is not installed". Lệnh `podman` chưa có trên PATH; Docker service/named pipe không hiện diện.
    - *Các bước quản trị viên/người dùng cần thực hiện tiếp theo:*
    1. Mở PowerShell với quyền Administrator (Elevated UAC) và chạy lệnh:
         ```powershell
         wsl --install --no-distribution
         ```
         *(hoặc DISM: `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`)*.
      2. **Khởi động lại hệ điều hành bắt buộc (Mandatory System Reboot):** Sau khi kích hoạt tính năng ảo hóa, **bắt buộc phải reboot máy tính** để Windows nạp virtualization driver ở cấp kernel. *Rủi ro:* Nếu chưa reboot, các runtime container (Podman/WSL2/Docker) không thể khởi động engine ảo hóa và sẽ gặp lỗi thiếu kernel component.
    3. **Cài đặt Podman Desktop:** Sau khi reboot, khởi chạy `D:\Project_MMKNM\installers\podman-desktop-1.30.5-setup-x64.exe` (chạy per-user, giấy phép mã nguồn mở **Apache 2.0** hoàn toàn tự do thương mại; tạo Podman machine rootless trên WSL2 backend, vận hành hàng ngày không cần quyền Admin).
         *(Nếu chọn Docker Desktop: Cần lưu ý điều kiện bản quyền Docker SSA - chỉ miễn phí cho cá nhân/doanh nghiệp nhỏ <250 nhân sự và <10M USD doanh thu; cài all-users cần quyền Admin và gán nhóm `docker-users`)*.
    4. **Xác minh lệnh CLI:** Chạy `podman version` hoặc `podman info` trên terminal. Cổng bảo mật kỹ thuật chỉ mở khi CLI có output phiên bản thực tế.
- **Nghiên Cứu Sơ Bộ Ứng Viên Baseline Model (AASIST & RawNet2):**
  - Đã hoàn tất bảng so sánh thông số kỹ thuật 2 mô hình ứng viên sơ bộ: AASIST mã nguồn MIT, ~297k tham số vs RawNet2 mã nguồn MIT (xác minh trực tiếp từ file `LICENSE` repo chính thức: MIT License Copyright (c) 2021 eurecom-asp), ~4.4M tham số; cùng nhận đầu vào 16kHz mono PCM 64.600 samples. Lưu ý: Giấy phép mã nguồn tách biệt hoàn toàn với điều khoản phân phối pretrained weights và dữ liệu ASVspoof (ODC-By v1.0).
  - Tuyệt đối **không tải weights** hay **dataset** (như ASVspoof) vào repo; parser media vẫn giữ **TẮT** trên host process cho đến khi container sandbox được thiết lập.
- **Các hạn chế kỹ thuật chưa xác minh:**
  - *Media parser sandbox gate:* Do máy chưa có container sandbox độc lập (non-root UID 10001, read-only rootfs, Seccomp, no network egress `--network none`), parser `wave.open` tạm ngừng gọi trên file tải lên (`duration_seconds` trả về `null`).
  - *Giới hạn thời lượng media 60 giây:* Tạm thời chưa được xác minh do parser media tắt.
  - *Browser sandbox origin gate:* Host chưa có binary headless browser (như Playwright/Chromium trên PATH); kiểm thử responsive UI desktop (1920x1080) và mobile (375x667) được xác minh qua hợp đồng HTTP markup và phân tích CSS rules, chưa thực thi qua browser engine live render.
  - *ClamAV daemon:* Chưa tích hợp quét virus qua socket.
  - *Network isolation:* Chỉ bind local `127.0.0.1` và thu hẹp CORS; chưa có kiểm soát egress cấp kernel/sandbox.
  - *Lưu trữ in-memory RAM với TTL:* Chưa có cơ sở dữ liệu bền vững (PostgreSQL, MinIO).
- **Điều kiện chính xác để bắt đầu Bước 4 (Thay adapter bằng baseline model):**
  1. Quản trị viên hoàn tất bật Virtual Machine Platform, reboot Windows, và cài đặt container runtime (Docker Desktop tuân thủ SSA hoặc Podman Desktop Apache 2.0).
  2. Dựng hoàn chỉnh worker container sandbox cô lập (UID 10001, `--cap-drop ALL`, `--read-only`, tmpfs, Seccomp profile, `--network none`, quota cứng 128MB/5s) cho parser media.
  3. Kích hoạt lại parser an toàn bên trong container sandbox, xác minh trích xuất metadata và kiểm chứng giới hạn thời lượng 60 giây trên các tệp mẫu an toàn mà không chạy trên host.
  4. Tích hợp ClamAV daemon quét virus cho tệp tải lên trước khi đưa vào pipeline.
  5. Quản trị mô hình theo ROADMAP: chọn đúng một nhánh (audio), xác minh nguồn gốc/license/model card theo `SOURCES.md`, và chạy benchmark protocol trên tập test holdout độc lập trước khi kích hoạt trên UI.
  - **Quy tắc cổng:** Tuyệt đối **không bắt đầu Bước 4** khi các điều kiện container sandbox trên chưa hoàn tất thực nghiệm.
- **Cam kết tuân thủ:**
  - Không tự ý git commit, không git push, không deploy ra môi trường public hay mở tunnel.
  - Không ghi lại PID tạm thời của hệ điều hành, chỉ ghi nhận các số liệu và trạng thái có output kiểm thử thực tế chứng minh.

# Nguồn tham khảo và ghi chú sử dụng

Đã rà soát và cập nhật ngày **12-11-2026** (kiểm chứng phục vụ bàn giao kỹ thuật Web v1 và đánh giá cổng an toàn Bước 3 tại `docs/research/FIRST_WEB_HANDOFF.md`). Ưu tiên nguồn chính thức, repo tác giả và bài nghiên cứu gốc. Link/metadata có thể đổi; trước khi tích hợp, mở lại trang upstream, kiểm tra commit/release gần nhất và LICENSE. Các ghi chú dưới đây tóm tắt, không thay điều khoản gốc.

## Ngữ cảnh dự án & Báo cáo kỹ thuật nội bộ

- [ChatGPT share: Xây dựng dự án Deepfake](https://chatgpt.com/share/6af42501-8d80-83ec-b4cf-2ec3d580af84) — ý tưởng tải audio/video hoặc link, risk indicators, demo/API; đã đọc trực tiếp bản chia sẻ ngày 11-11-2026.
- [`PROJECT_BLUEPRINT.md`](../../PROJECT_BLUEPRINT.md) — phác thảo stack/6 bước ban đầu của repo.
- [`FIRST_WEB_HANDOFF.md`](FIRST_WEB_HANDOFF.md) — báo cáo bàn giao kỹ thuật Web v1 Local & Hardening Pipeline (lập ngày 12-11-2026); lưu trữ lịch sử phán quyết Node Judge (`orun-3-d1b421a5` PASS, `orun-4-98512fde` PASS), tách biệt rõ ràng 3 trạng thái: Web v1 Local Demo (PASS), Project Security Gate Bước 3 (PARTIAL cho đến khi sandbox được kiểm chứng thực nghiệm), và Bước 4 Baseline Model (CHƯA BẮT ĐẦU, chỉ ở giai đoạn nghiên cứu sẵn sàng; parser tắt trên host).
- [`ROADMAP.md`](ROADMAP.md) — lộ trình triển khai và tiêu chí cổng an toàn qua từng bước.

## Hạ tầng container & Ảo hóa Windows (Dành cho Quản trị viên)

- [Microsoft Learn: Virtual Machine Platform & WSL2 on Windows](https://learn.microsoft.com/en-us/windows/wsl/install) — kích hoạt tính năng ảo hóa Windows và cài đặt WSL2 cho quản trị viên qua lệnh `wsl --install --no-distribution` (hoặc DISM: `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`); **bắt buộc reboot hệ điều hành (mandatory reboot)** để nạp virtualization driver ở cấp kernel trước khi khởi chạy container runtime.
- [Podman Desktop Windows Installation](https://podman-desktop.io/docs/installation/windows-install) và [Podman Documentation](https://podman.io/docs) — mã nguồn mở hoàn toàn theo giấy phép **Apache 2.0** (không ràng buộc thương mại theo quy mô doanh thu/nhân sự); hỗ trợ cài đặt per-user và vận hành Podman machine trên WSL2 hoàn toàn rootless trong không gian người dùng sau khi ảo hóa Windows đã được bật.
- [Podman Desktop GitHub Releases (v1.30.5)](https://github.com/podman-desktop/podman-desktop/releases/tag/v1.30.5) — nguồn tải bộ cài chính thức: tệp `podman-desktop-1.30.5-setup-x64.exe` (162.833.128 bytes, SHA-256: `0689d9389853a5256c2b0ce7a09c012399948a5df4c9c4d4735c09de1bbe6928`), đã tải sẵn về thư mục local `installers/podman-desktop-1.30.5-setup-x64.exe`.
- [Docker Desktop for Windows Install Documentation](https://docs.docker.com/desktop/setup/install/windows-install/) — tài liệu cài đặt all-users vs per-user.
- [Docker Desktop Windows Permission Requirements](https://docs.docker.com/desktop/setup/install/windows-permission-requirements/) — phân định đặc quyền: chỉ yêu cầu Administrator khi cài đặt all-users (ghi `C:\Program Files\Docker\Docker`, tạo `com.docker.service`, gán nhóm `docker-users`); vận hành hàng ngày có thể chạy non-admin nếu tài khoản thuộc nhóm `docker-users` hoặc trong WSL2.
- [Docker Subscription Service Agreement (SSA)](https://docs.docker.com/subscription/desktop-license/) — điều khoản cấp phép thương mại: miễn phí (Docker Personal) cho cá nhân, giáo dục, dự án open source phi thương mại và doanh nghiệp nhỏ (<250 nhân sự VÀ doanh thu <10 triệu USD); doanh nghiệp lớn hơn bắt buộc phải mua giấy phép trả phí (Pro, Team, Business).

## Chuẩn ATTT và AI risk

- [OWASP Top 10:2025](https://top10.owasp.org/2025/) — danh mục rủi ro web hiện hành; dùng để lập checklist ban đầu, không thay threat model.
- [OWASP ASVS](https://asvs.owasp.org/) — phiên bản stable hiển thị khi tra cứu: 5.0.0; yêu cầu kiểm chứng kỹ thuật, nên pin version trong báo cáo.
- [OWASP Web Security Testing Guide: malicious file upload](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/09-Test_Upload_of_Malicious_Files/) — kiểm thử upload; extension allowlist đơn lẻ không đủ.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) và [Generative AI Profile NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) — khung nhận diện/quản lý rủi ro AI.
- [Docker Engine security](https://docs.docker.com/engine/security/) — nguyên tắc least privilege/capabilities.
- [Docker rootless mode](https://docs.docker.com/engine/security/rootless/) — giảm impact khi daemon/container runtime bị khai thác.
- [Docker seccomp](https://docs.docker.com/engine/security/seccomp/) — syscall filtering; dùng profile phù hợp runtime hiện hành, không copy mù quáng.

## Pháp luật và dữ liệu cá nhân Việt Nam

- [Công báo Chính phủ: Luật 91/2025/QH15](https://congbao.chinhphu.vn/van-ban/luat-so-91-2025-qh15-45578/57730.htm) — văn bản gốc; hiệu lực 01-01-2026.
- [Bộ Công an: thông tin luật có hiệu lực](https://bocongan.gov.vn/bai-viet/luat-bao-ve-du-lieu-ca-nhan-chinh-thuc-co-hieu-luc-thi-hanh-tu-ngay-01-01-2026-1767186124) — tóm lược quyền dữ liệu/hiệu lực.
- [Cổng Chính phủ: Luật AI Việt Nam](https://en.baochinhphu.vn/viet-nams-law-on-artificial-intelligence-111260715113551787.htm) — trang English summary được truy xuất khi nghiên cứu; trước báo cáo pháp lý cần dẫn văn bản tiếng Việt gốc và điều khoản áp dụng chính xác.

## Khuyến cáo phòng chống lừa đảo trực tuyến tại Việt Nam

- [Cục An toàn thông tin - Cổng Không gian mạng Quốc gia: Cẩm nang nhận diện và phòng chống lừa đảo trực tuyến](https://khonggianmang.vn/cam-nang-nhan-dien-va-phong-chong-lua-dao-truc-tuyen) — truy cập/rà soát ngày **11-11-2026** và tái xác nhận áp dụng trong mốc Web v1 UI Completion (`orun-4-98512fde`) ngày **12-11-2026**; tài liệu chính thức tổng hợp các hình thức lừa đảo phổ biến (cuộc gọi video deepfake, mạo danh cơ quan công quyền/tổ chức tài chính). Khuyến cáo: cảnh giác cao độ trước các yêu cầu chuyển tiền gấp hoặc đòi cung cấp OTP/mật khẩu; các cử động thị giác (vẫy tay, quay mặt) không phải là phép thử đáng tin cậy để chứng minh thật/giả; ưu tiên hàng đầu là chủ động ngắt tương tác và tự xác minh qua kênh độc lập đã biết.
- [Cổng thông tin điện tử Bộ Công an: Cảnh báo thủ đoạn mạo danh cơ quan tư pháp](https://bocongan.gov.vn/) — truy cập/rà soát ngày **11-11-2026** và tái xác nhận áp dụng trong mốc Web v1 UI Completion (`orun-4-98512fde`) ngày **12-11-2026**; thông tin khuyến cáo người dân nâng cao cảnh giác trước các cuộc gọi đe dọa, xưng danh cán bộ công an, viện kiểm sát, tòa án yêu cầu chuyển tiền vào "tài khoản tạm giữ" hoặc kê khai tài sản. Khuyến cáo người dân không chuyển tiền, không cung cấp thông tin nhạy cảm qua điện thoại, chủ động ngắt máy và tự xác minh qua số điện thoại chính thức đã biết trước hoặc đến trực tiếp trụ sở cơ quan công an gần nhất.

## Deepfake/media forensics và dataset

- [ASVspoof 2021 official](https://www.asvspoof.org/index2021.html) — LA/PA/DF và baseline/scripts; trang chỉ rõ Open Data Commons Attribution License (ODC-By v1.0) cho data release; đọc license/metadata cụ thể trước dùng. Nghiêm cấm tải thô dữ liệu âm thanh sinh trắc học lên kho mã nguồn công khai theo Luật bảo vệ dữ liệu cá nhân 91/2025/QH15.
- [ASVspoof 2021 baseline/scripts](https://github.com/asvspoof-challenge/2021) — mã baseline, metrics EER/min t-DCF.
- [ASVspoof 5 official](https://www.asvspoof.org/) — kiểm tra track mới và điều khoản hiện hành.
- [AASIST official research code (Jung et al., 2021/2022)](https://github.com/clovaai/aasist) — mã nguồn audio anti-spoofing chính thức từ NAVER Corp theo giấy phép **MIT** (áp dụng cho mã nguồn; pretrained weights và dataset huấn luyện ASVspoof chịu các điều khoản phân phối riêng biệt). Sơ đồ kiến trúc SincNet + H-GAT, ~297k tham số (AASIST-L: ~85k), đầu vào chuẩn 16kHz mono PCM WAV 64.600 samples (~4,04 giây). Ứng viên baseline cho Bước 4 (chỉ ở giai đoạn nghiên cứu sẵn sàng, **tuyệt đối chưa tải weights/dataset**).
- [RawNet2 Baseline for ASVspoof 2021 (Tak et al., 2021)](https://github.com/asvspoof-challenge/2021/tree/main/LA/Baseline-RawNet2) — mã baseline chính thức từ EURECOM theo giấy phép **MIT** (xác minh trực tiếp từ file `LICENSE` tại repo: MIT License Copyright (c) 2021 eurecom-asp; pretrained weights và dataset ASVspoof 2021 chịu điều khoản phân phối và giấy phép dữ liệu riêng). Sơ đồ kiến trúc SincNet filterbanks + Residual blocks + 3 GRU layers, ~4,4M tham số, đầu vào chuẩn 16kHz mono PCM WAV 64.600 samples (~4,04 giây). Ứng viên baseline cho Bước 4 (chỉ ở giai đoạn nghiên cứu sẵn sàng, **tuyệt đối chưa tải weights/dataset**).
- [FaceForensics++ official repository](https://github.com/ondyari/faceforensics) — repo nói code MIT nhưng data theo FaceForensics Terms of Use, yêu cầu form/chấp thuận; điều khoản giới hạn sử dụng phi thương mại/nghiên cứu-giáo dục.
- [FaceForensics Terms of Use](https://kaldir.vc.in.tum.de/faceforensics_tos.pdf) — đọc trực tiếp trước khi xin/tải dữ liệu.
- [DeepfakeBench](https://github.com/SCLBD/DeepfakeBench) và [paper NeurIPS Datasets & Benchmarks 2023](https://arxiv.org/abs/2307.01426) — harness với preprocessing/protocol/model; README nhấn mạnh dữ liệu thuộc nhà cung cấp gốc; stack cũ cần đánh giá tương thích.
- [NIST OpenMFC](https://mfc.nist.gov/) — benchmark media forensics; trang hiện nêu kết thúc evaluation và dataset không được phát hành public.
- [SEA-Spoof paper](https://arxiv.org/abs/2509.19865) — nghiên cứu multilingual Đông Nam Á gồm Vietnamese; kiểm tra availability, terms và peer-review/status trước dùng.
- [Whisper GitHub](https://github.com/openai/whisper) — ASR, code/model MIT theo README; không phải deepfake detector.

## Thư viện và hạ tầng gợi ý từ blueprint

- [FastAPI docs](https://fastapi.tiangolo.com/) — API framework; kiểm tra version, upload streaming và deployment guidance trước triển khai.
- [Celery docs](https://docs.celeryq.dev/) — background jobs; thiết kế retry/idempotency/timeouts phù hợp workload.
- [FFmpeg documentation](https://ffmpeg.org/documentation.html) — decoder/transcoder; parser attack surface cao nên chạy sandbox, không chỉ “sanitize”.
- [Next.js docs](https://nextjs.org/docs) — frontend; kiểm tra phiên bản project hiện tại thay vì giữ cố định Next 15 từ bản blueprint.
- [Prometheus docs](https://prometheus.io/docs/) — metrics; tránh labels/logs chứa PII.
- [ClamAV documentation](https://docs.clamav.net/) — malware scanning; bổ trợ, không chứng minh file an toàn.

## License và trích dẫn

- Mã nguồn phải giữ LICENSE/NOTICE upstream và tuân thủ license từng component.
- Dataset/video có người thật cần quyền truy cập và quyền sử dụng riêng; không commit bản sao lên repo.
- Papers cần trích dẫn theo BibTeX của tác giả. Ghi ngày truy cập; ưu tiên link DOI/arXiv/publisher.
- Không mirror toàn bộ docs, model weights hoặc data. Tài liệu này tóm lược ở mức cần thiết và trỏ người đọc về nguồn chính.


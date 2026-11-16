# Nhật Ký Điều Phối Orchestration (Empryo Run Ledger)

Tài liệu này lưu trữ lịch sử các phiên điều phối (orchestration runs) trong dự án AI Voice & Video Scam Checker. Mọi mục ghi nhận đều dựa trên dữ liệu thực tế đọc được từ run-state JSON (`.empryo/orchestrations/runs/`) và background artifacts (`.empryo/dispatch/`), tuyệt đối không sửa đổi hay giả mạo run-state.

---

## Bảng Tổng Hợp Các Phiên Điều Phối

| Run ID | Graph ID | Trạng thái Top-level | Node kết thúc (Terminal) | Phán quyết nghiệp vụ (Business Verdict) | Ghi chú & Semantics Orchestrator |
|---|---|---|---|---|---|
| `orun-1-e31d44a2` | `scam-checker-handoff-v1` | **done** | `final-pass` | **Web v1: PASS** | Nghiệm thu Web v1 ban đầu (Vertical Slice Demo). Đạt toàn bộ 7 tiêu chí nghiệm thu. |
| `orun-2-b97c0345` | `scam-checker-hardening-v1` | **failed** | `qa-engineer` | N/A (Timeout) | Tiến trình QA ban đầu gặp timeout 1 giờ do shell command tương tác. |
| `orun-3-d1b421a5` | `scam-checker-hardening-qa-v1` | **done** | `final-pass` | **Judge: PASS / Gate: PARTIAL** | Nghiệm thu QA/E2E Hardening. Judge phán quyết PASS trên logic/middleware; Project Security Gate Bước 3 bảo lưu PARTIAL do thiếu container sandbox. |
| `orun-4-98512fde` | `scam-checker-web-v1-ui-completion` | **done** | `final-pass` | **Web v1 UI: PASS / Gate: PARTIAL** | Hoàn thiện giao diện Web v1, nhãn disclaimer, khuyến nghị ATTT/Bộ Công an, ARIA, responsive, strictPort. Đạt 20/20 test E2E. |
| `orun-5-faa1b787` | `scam-checker-project-next-gate-v1` | **failed** | `final-partial` | **Web v1: PASS / Bước 3: PARTIAL** | Chặng tiếp theo: Web v1 đạt PASS; `sandbox-gate-judge` phán quyết PARTIAL do Docker vắng mặt trên PATH; kết thúc tại `final-partial`. |
| `orun-6-ec426ee2` | `scam-checker-sandbox-gate-v1` | **failed** | `final-partial` | **Bước 3: PARTIAL** | Khảo sát runtime Windows (Docker/Podman vắng mặt); thiết kế worker tối thiểu; `sandbox-judge` phán quyết PARTIAL, kết thúc tại `final-partial`. |
| `orun-7-6ef70f9b` | `scam-checker-next-readiness-v1` | **failed** | `final-partial` | **Bước 3: PARTIAL / Bước 4: CHƯA BẮT ĐẦU** | Rà soát tài liệu cài đặt runtime (all-users vs per-user, SSA license, reboot); nghiên cứu model ứng viên (AASIST/RawNet2); Judge PARTIAL, kết thúc tại `final-partial`. |
| `orun-8-75b45a3d` | `scam-checker-runtime-sandbox-v1` | **failed** | `final-partial` | **Bước 3: PARTIAL / Bước 4: CHƯA BẮT ĐẦU** | Tải installer chính thức Podman Desktop v1.30.5; thẩm định thiết kế sandbox đạt PASS; Runtime Gate phán quyết PARTIAL do thiếu Virtual Machine Platform/WSL2 và cần quyền Administrator/reboot; kết thúc tại `final-partial`. |
| `orun-1-5aad2086` | `scam-checker-story-site-v1` | **done** | `final-pass` | **Chưa có Judge Verdict hợp lệ (Lỗi node Judge)** | Run hoàn tất top-level `done` và terminal `final-pass`, nhưng node `judge` thất bại (`no VERDICT line in the reply`). Node `handoff` nhận đầu vào lỗi nhưng tự phát PASS ngoài luồng; run cũ không có Judge PASS hợp lệ. |
| *Reconciliation* (16-11-2026) | `scam-checker-story-site-v1` | N/A (Kiểm toán độc lập) | N/A | **Reconciliation: PASS / Gate: PARTIAL** | Đối chiếu artifacts thực tế: sửa tiêu đề trung tính dòng 89 và đường dẫn backend/app/ dòng 92 tại PrivacySection.tsx; npm run build exit code 0; 34/34 browser QA tests passed với 6 screenshots; tái cấu trúc graph cô lập handoff-pass và handoff-partial (cạnh fallback always chỉ trỏ về handoff-partial/final-partial, không có cạnh always nào dẫn tới final-pass; xác nhận schema cấu hình, chưa chạy live runtime); reviewer độc lập security-auditor thẩm định đạt VERDICT: PASS; Cổng An Toàn Bước 3 giữ PARTIAL (parser tắt, giới hạn WAV 60s chưa kiểm chứng, Bước 4 CHƯA BẮT ĐẦU). |

---

## Chi Tiết Các Run Gần Nhất

### 1. Run `orun-5-faa1b787`
- **Graph:** `scam-checker-project-next-gate-v1`
- **Trạng thái Top-level:** `failed`
- **Node kết thúc:** `final-partial` (kind: end, status: fail)
- **Phán quyết nghiệp vụ (Business Verdict):**
  - **Web v1 Local Demo:** `VERDICT: PASS` (tại node `judge-web-v1`, bg-44)
  - **Project Security Gate Bước 3:** `VERDICT: PARTIAL` (tại node `sandbox-gate-judge`, bg-47)
- **Chuỗi thực thi:**
  - `inventory-and-reconcile` (bg-39): ok
  - `web-v1-finalize` (bg-40): ok
  - `qa-web-v1` (bg-41): ok
  - `review-parallel` (bg-42, bg-43): ok
  - `judge-web-v1` (bg-44): ok PASS
  - `sandbox-preflight` (bg-45): ok
  - `sandbox-design-review` (bg-46): ok
  - `sandbox-gate-judge` (bg-47): fail PARTIAL (`error: "VERDICT PARTIAL — Docker và Podman vắng mặt trên PATH; cần cài đặt runtime container độc lập để đạt Gate Bước 3"`)
  - `handoff` (bg-48): ok
  - `final-partial`: ok
- **Bằng chứng đã lưu:** `docs/research/FIRST_WEB_HANDOFF.md`, `ROADMAP.md`.

### 2. Run `orun-6-ec426ee2`
- **Graph:** `scam-checker-sandbox-gate-v1`
- **Trạng thái Top-level:** `failed`
- **Node kết thúc:** `final-partial` (kind: end, status: fail)
- **Phán quyết nghiệp vụ (Business Verdict):** `VERDICT: PARTIAL` (tại node `sandbox-judge`, bg-52)
- **Chuỗi thực thi:**
  - `runtime-preflight` (bg-49): ok (khảo sát thực nghiệm xác nhận Docker, Podman, WSL2 kernel driver vắng mặt)
  - `sandbox-design` (bg-50): ok (thiết kế worker 7 lớp: non-root, read-only rootfs, `--network none`, Seccomp, quota 128MB/5s)
  - `sandbox-security-review` (bg-51): ok
  - `sandbox-judge` (bg-52): fail PARTIAL (`error: "VERDICT PARTIAL — runtime container vắng mặt trên máy host, cần cài đặt và cấu hình độc lập từ người dùng trước khi có thể mở sandbox"`)
  - `runtime-prerequisite-handoff` (bg-53): ok
  - `final-partial`: ok
- **Bằng chứng đã lưu:** `docs/research/FIRST_WEB_HANDOFF.md`, `ROADMAP.md`.

### 3. Run `orun-7-6ef70f9b`
- **Graph:** `scam-checker-next-readiness-v1`
- **Trạng thái Top-level:** `failed`
- **Node kết thúc:** `final-partial` (kind: end, status: fail)
- **Phán quyết nghiệp vụ (Business Verdict):** `VERDICT: PARTIAL` (tại node `readiness-judge`, bg-57)
- **Chuỗi thực thi:**
  - `readiness-research-parallel` (ok):
    - `runtime-install-doc-audit` (bg-54): ok (tài liệu Docker Desktop, Podman Desktop, WSL2)
    - `model-readiness-research` (bg-55): ok (bảng so sánh sơ bộ AASIST vs RawNet2)
  - `security-review` (bg-56): ok
  - `readiness-judge` (bg-57): fail PARTIAL (`error: "VERDICT PARTIAL — Container runtime (Docker/Podman) chưa được cài đặt và kích hoạt trên host; ranh giới mô hình và sandbox worker mới hoàn thành ở mức nghiên cứu tài liệu và chưa thể kiểm chứng thực nghiệm."`)
  - `handoff` (bg-58): ok
  - `final-partial`: ok
- **Bằng chứng đã lưu:** `docs/research/FIRST_WEB_HANDOFF.md`, `ROADMAP.md`, `SOURCES.md`, `TECHNICAL_BASELINE.md`, `DATASETS_AND_EVALUATION.md`.

### 4. Run `orun-8-75b45a3d`
- **Graph:** `scam-checker-runtime-sandbox-v1`
- **Trạng thái Top-level:** `failed`
- **Node kết thúc:** `final-partial` (kind: end, status: fail)
- **Phán quyết nghiệp vụ (Business Verdict):** `VERDICT: PARTIAL` (tại node `runtime-gate-judge`, bg-61; Web v1 Local Demo: giữ nguyên `PASS`; Project Security Gate Bước 3: `PARTIAL`; Bước 4: `CHƯA BẮT ĐẦU`)
- **Chuỗi thực thi:**
  - `runtime-install` (bg-59): ok (So sánh runtime, ưu tiên Podman Desktop theo Apache 2.0; tải thành công bộ cài chính thức `podman-desktop-1.30.5-setup-x64.exe` từ GitHub Releases về `installers/` kèm kiểm chứng SHA-256; phát hiện host Windows 11 Home chưa kích hoạt Virtual Machine Platform / WSL2 và phiên làm việc non-elevated; dừng an toàn trước thay đổi hệ điều hành theo đúng chỉ thị).
  - `sandbox-design-review` (bg-60): ok (Kiểm toán an ninh thiết kế sandbox worker Podman 7 tiêu chí: UID 10001:10001, `--cap-drop ALL`, `no-new-privileges`, `--read-only` rootfs, tmpfs `/tmp` noexec 64MB, `--network none`, Seccomp cho phép `clone`/`clone3` và chặn syscall nhạy cảm, quota 0.5 CPU / 128MB RAM / 64 PIDs / timeout 5-10s, subprocess mảng đối số không shell injection, `--rm` và cleanup; phán quyết: PHÊ DUYỆT THIẾT KẾ nhưng GIỮ GATE PARTIAL do thiếu runtime trên host).
  - `runtime-gate-judge` (bg-61): fail PARTIAL (`error: "VERDICT: PARTIAL — Runtime container chưa hoạt động do cần Administrator để bật Virtual Machine Platform/WSL2 và cần reboot máy trước khi sử dụng Podman CLI"`).
  - `handoff` (bg-62): ok (Cập nhật trung thực các tài liệu kỹ thuật, tách bạch 3 trạng thái, hướng dẫn chi tiết các bước cho người dùng/quản trị viên, ghi nhận rủi ro reboot bắt buộc và link nguồn chính thức).
  - `final-partial`: ok (Chuyển tiếp theo quy tắc graph kết thúc tại terminal node dự kiến).
- **Bằng chứng đã lưu:** `docs/research/FIRST_WEB_HANDOFF.md`, `ROADMAP.md`, `SOURCES.md`, `EMPRYO_RUN_LOG.md`, `installers/podman-desktop-1.30.5-setup-x64.exe`.

### 5. Run `orun-1-5aad2086` (Nguyên trạng lịch sử)
- **Graph:** `scam-checker-story-site-v1`
- **Trạng thái Top-level:** `done`
- **Node kết thúc:** `final-pass` (kind: end)
- **Phán quyết nghiệp vụ ban đầu (Business Verdict):** `Chưa có Judge Verdict hợp lệ` (Node `judge` gặp lỗi `no VERDICT line in the reply`, `ok: false`; node `handoff` nhận đầu vào `An answer has been delivered.` nhưng tự phát ra PASS ngoài luồng; do đó run cũ KHÔNG có phán quyết Judge PASS hợp lệ).
- **Chuỗi thực thi:**
  - `inventory-and-plan` (bg-63): ok (Khảo sát mã nguồn frontend, xác nhận app tải tệp render ở `/`, thiết kế router native và tokens CSS riêng).
  - `story-site-implementation` (bg-64): ok (Triển khai router native, xây dựng `ProductStoryPage` 8 components, bọc `AnalysisAppPage`, tạo `story-tokens.css`).
  - `qa-visual-and-functional` (bg-65): ok (Chạy `npm run build` exit code 0; chạy `browser_qa_runner.mjs` qua Chrome CDP đạt 34/34 tests, lưu 6 screenshots tại `docs/product/screenshots/`).
  - `review-parallel` (ok):
    - `product-truth` (bg-66): ok (Kiểm toán độc lập nội dung copy đối chiếu `docs/research/`).
    - `accessibility-performance` (bg-67): ok (Kiểm toán độc lập a11y, ARIA landmarks, `prefers-reduced-motion`, 100% native scroll).
  - `judge` (bg-68): **fail** (`error: "no VERDICT line in the reply"`, `ok: false`; không phát ra dòng VERDICT có cấu trúc).
  - `handoff` (bg-69): ok (Cạnh `always` kích hoạt chuyển tiếp tới handoff; handoff nhận đầu vào thiếu verdict nhưng tự phát sinh `VERDICT: PASS` trong summary).
  - `final-pass`: ok (Cạnh `out~=VERDICT: PASS` từ handoff kích hoạt kết thúc tại `final-pass`).
- **Bằng chứng đã lưu:** `docs/product/PRODUCT_STORY_SITE_HANDOFF.md`, `docs/product/screenshots/*.png`, `tests/qa/browser_qa_runner.mjs`.

### 6. Phiên Đối Chiếu Sau Run (Targeted Post-Run Reconciliation — 16-11-2026)
- **Mục tiêu:** Kiểm toán độc lập, khắc phục lỗi nội dung và tái cấu trúc đồ thị mà không chạy lại toàn bộ implementation.
- **Phán quyết độc lập của Reviewer:** `VERDICT: PASS — Landing page trung thực 100%, lỗi run gốc được ghi nhận minh bạch, 34/34 test và 6 screenshots có thật, graph mới đã cô lập đúng fallback dù chưa có runtime proof.` (bởi reviewer độc lập `security-auditor` trong vai trò explore/read-only với ngữ cảnh sạch).
- **Các hành động đã thực hiện & Kết quả kiểm chứng thực tế:**
  1. *Đối chiếu artifacts:* Xác nhận `tests/qa/results.json` ghi nhận 34/34 tests passed; 6 ảnh screenshots tại `docs/product/screenshots/` tồn tại thực tế (kích thước 45–157 KB).
  2. *Sửa lỗi nội dung tại `frontend/src/components/story/PrivacySection.tsx`:*
     - Dòng 89: Đổi tiêu đề thành trung tính: *"Thông tin về ranh giới kỹ thuật hiện tại:"* (thay cho *"Ranh giới kỹ thuật được bảo đảm:"*).
     - Dòng 92: Đổi tham chiếu sai `backend/api/` thành đường dẫn đúng `backend/app/`, nêu rõ parser media đang tắt, duration null, chưa kiểm tra giới hạn 60s, và Security Gate Bước 3 bảo lưu PARTIAL.
  3. *Biên dịch lại mã nguồn:* Chạy `npm run build` tại `frontend/` đạt Exit Code 0 (39 modules, bundle 320 kB trong 1.10s, 0 lỗi TypeScript).
  4. *Kiểm tra lại browser tự động:* Khởi chạy `tests/qa/browser_qa_runner.mjs` với Chrome CDP cổng 9222, hoàn tất 34/34 ca kiểm thử đạt 100% PASS (Exit Code 0), làm mới 6 ảnh screenshots.
  5. *Tái cấu trúc đồ thị `scam-checker-story-site-v1`:* Tách bạch node `handoff-pass` và node `handoff-partial`. Cạnh fallback `always` vẫn tồn tại nhưng chỉ định tuyến từ `judge` tới `handoff-partial` và từ `handoff-partial` tới `final-partial`; hoàn toàn không có cạnh `always` nào dẫn tới `final-pass`. Điều kiện hoàn tất PASS chỉ được cấu hình duy nhất cho nhánh Judge có phán quyết PASS hợp lệ (`judge [PASS] → handoff-pass [ok] → final-pass`). Đồ thị đã được thẩm định hợp lệ và lưu vào `.empryo/orchestrations/scam-checker-story-site-v1.json`.  
     *Lưu ý giới hạn:* Đây là xác nhận cấu trúc cấu hình đạt chuẩn schema (`orchestrate(action: "validate")`), chưa phải bằng chứng đã chạy đúng trong một phiên live run runtime thực tế.
  6. *Kiểm toán độc lập:* Chuyên gia an toàn thông tin độc lập (`security-auditor`) trong vai trò explore/read-only với ngữ cảnh sạch đã thẩm định toàn diện các artifacts và kết luận đạt VERDICT: PASS (với Project Security Gate Bước 3 tiếp tục bảo lưu `PARTIAL`).

---

## Quy Ước Phân Biệt Ngữ Nghĩa (Orchestrator Semantics)
- **Top-level status = `failed`:** Do trong cơ chế của Empryo Orchestrator, một Judge node khi phát ra kết luận `PARTIAL` được engine gán nhãn `ok: false` và gán thông báo lỗi `error: "VERDICT PARTIAL..."`. Mặc dù graph định tuyến chính xác đến node kết thúc dự kiến (`final-partial`), trạng thái chung của run vẫn hiển thị là `failed`.
- **Business Verdict = `PARTIAL`:** Đây là kết quả nghiệp vụ bình thường và đúng đắn của Cổng An Toàn Dự Án khi môi trường vật lý chưa có runtime container. Nó **không phải lỗi thực thi node (execution crash)** và không làm mất giá trị nghiệm thu PASS của Web v1.

# Empryo Orchestration brief: dựng web v1 từ đầu đến cuối

**Đây là brief để Empryo Orchestrator thiết kế graph, không phải JSON graph giả lập.** Empryo tự tạo, validate, lưu và chạy graph; đừng sửa tay file trong `.empryo/orchestrations/runs/` vì đó là run state.

## Cách chạy

Mở tab dự án trong Empryo, chọn **Orchestrate mode**, rồi dán nguyên prompt bên dưới. Orchestrator phải hiện graph và model/agent assignments, đối chiếu acceptance criteria, validate graph rồi chạy. Theo dõi bằng `/runs` hoặc Orchestration trong Workbench.

## Prompt chạy

```text
Hãy thiết kế và chạy một Empryo orchestration để hoàn thành web v1 đầu tiên của dự án trong repo hiện tại, từ khảo sát đến code chạy được, kiểm tra bằng chứng và bàn giao.

ĐỌC TRƯỚC
- Đọc AGENTS.md ở root repo.
- Đọc docs/research/README.md và toàn bộ tài liệu được nó liên kết, nhất là PROJECT_BRIEF.md, TECHNICAL_BASELINE.md, SECURITY_AND_PRIVACY.md, DATASETS_AND_EVALUATION.md, ROADMAP.md, SOURCES.md.
- Kiểm tra code và runtime thật trong backend/, frontend/, lockfiles và lệnh chạy hiện có. Không giả định repo đã có app hoặc stack.
- Kiểm tra Empryo custom agents trong .empryo/agents/ và skills trong .empryo/skills/. Dùng đúng người cho đúng việc; không để 2 agent sửa chồng cùng file.

MỤC TIÊU SẢN PHẨM
- Hoàn thành một website v1 responsive cho AI Voice & Video Scam Checker, giao diện tiếng Việt, chạy được local theo một hướng dẫn ngắn.
- Đây là công cụ hỗ trợ sàng lọc rủi ro. Nó không xác minh danh tính, không chứng minh deepfake/lừa đảo và không thay thế xác minh thủ công.
- Có luồng hoàn chỉnh: giới thiệu/phạm vi → chọn file audio/video có giới hạn → trạng thái xử lý → báo cáo kết quả có nguồn gốc/giới hạn → gợi ý xác minh an toàn → xóa phiên phân tích nếu phù hợp.
- Mọi kết quả mô phỏng phải hiện nhãn “DEMO / dữ liệu mô phỏng” rõ ở trang tải lên, tiến trình, kết quả và API. Không tạo phần trăm xác suất giả, không trình bày heatmap/waveform giả như bằng chứng.
- Dựng một vertical slice phù hợp codebase và máy dev. Không tự thêm Redis, PostgreSQL, MinIO, Celery, ClamAV, model weights hay dịch vụ chỉ vì chúng có trong blueprint. Chỉ thêm khi planner chứng minh cần thiết cho v1.
- Không triển khai public, không gọi dịch vụ tính phí, không gửi media tới bên thứ ba, không dùng media/giọng/khuôn mặt người thật. Chưa làm URL scanning, real-time call monitoring, eKYC, speaker identification hoặc voice cloning.

THIẾT KẾ GRAPH
1. Bắt đầu bằng planner chỉ đọc: khảo sát repo, tra tài liệu upstream mới nhất cho stack thực sự cần dùng, tổng hợp scope, sơ đồ luồng, file ownership, lệnh chạy và acceptance criteria. Tránh chép nguyên blueprint cũ.
2. Sau planner, chạy review thiết kế bảo mật độc lập bằng security-auditor. Bắt buộc xử lý upload, parser/decoder isolation, resource limits, retention/logging, authorization và SSRF (URL fetch tắt trong v1). Reviewer không sửa cùng file với developer.
3. Sau khi kế hoạch đạt, một agent implementation sở hữu tích hợp toàn cục. Có thể chia frontend/backend chạy song song chỉ khi planner tạo contract trước, mỗi agent có vùng file độc quyền, và có agent tích hợp sau đó. Dùng fullstack-developer cùng frontend-design/react-best-practices/FastAPI/security skills hiện có nếu tương thích với stack thực.
4. Ai-engineer chỉ làm adapter DEMO hoặc đánh giá model khi quyền dữ liệu, license, model card, tài nguyên và test protocol đã rõ. Không tải benchmark cần chấp thuận hay model weights trong v1.
5. Sau implementation, chạy QA trên app thật: install/build/lint/typecheck phù hợp dự án, rồi E2E qua luồng người dùng thật nếu môi trường cho phép. Không tạo unit tests sau code; ưu tiên E2E. Không dùng payload độc hại thật, dataset hạn chế hoặc media cá nhân.
6. Chạy song song hai review sạch ngữ cảnh: (a) reviewer kiểm tra yêu cầu/UX/chức năng theo acceptance criteria; (b) security-auditor kiểm tra diff và luồng dữ liệu độc lập, không nhận kết luận của review thứ nhất. Dùng judge/arbitrator để so sánh và trả PASS/FAIL/PARTIAL.
7. PASS mới kết thúc thành công. FAIL quay lại implementation với findings cụ thể, tối đa 2 vòng sửa. Sau mỗi vòng, chạy lại review/check bị ảnh hưởng. PARTIAL không được đổi thành PASS; ghi việc chưa xác minh và dừng với trạng thái PARTIAL.
8. Kết thúc bằng README/run instructions, cấu hình môi trường mẫu không có secrets, giới hạn sản phẩm, danh sách file thay đổi, các lệnh/kết quả kiểm tra thật. Không commit.

YÊU CẦU ORCHESTRATE
- Đây là yêu cầu cho công cụ orchestrate, không phải yêu cầu agent điều phối tự sửa code. Agent node mới thực hiện.
- Trước khi chạy, hiện graph, vai trò/model assignments, các nhánh song song, điều kiện PASS/FAIL/PARTIAL và max retry. Validate graph. Đối chiếu với 8 mục THIẾT KẾ GRAPH; nếu thiếu node/edge hoặc reviewer độc lập, sửa graph trước khi chạy.
- Tôi đã yêu cầu hoàn thành web v1 nên tự chạy graph sau khi hợp lệ; không hỏi lại lựa chọn triển khai thông thường. Chỉ dừng nếu thiếu thông tin bắt buộc, cần thanh toán, API key/đăng nhập mới, gửi dữ liệu thật ra ngoài, tải dữ liệu bị hạn chế, thay đổi quyền bảo mật, hoặc deploy/publish public.
- Tôn trọng quyền của phiên; không tự cấp quyền agent vượt quá phiên.
- Nếu provider không khả dụng, giữ run có thể tiếp tục/resume và báo node bị chặn, không giả vờ hoàn tất.

TIÊU CHÍ CHẤP NHẬN WEB V1
- App mở được local theo README; build/dev command được xác nhận thật.
- Có responsive interface desktop/mobile, loading/empty/error/success và keyboard/focus labels cơ bản.
- Luồng demo đầy đủ từ file chọn đến report; không gửi file đi nơi khác. Client-side validation không được mô tả là bảo mật server-side.
- Kết quả phân biệt rõ quan sát, suy luận, demo/model; hiển thị uncertainty/limitations; không bịa accuracy, model, benchmark hoặc evidence visualization.
- Không có media, transcript, secret, model weights hay dataset bị hạn chế trong repo.
- Ghi kết quả kiểm tra bằng môi trường/lệnh thực chạy; reviewer PASS theo toàn bộ tiêu chí hoặc PARTIAL kèm phần chưa xong.

Hãy bắt đầu bằng việc thiết kế graph, hiện graph đã validate, sau đó thực thi đến kết quả cuối theo các điều kiện trên.
```

## Sơ đồ luồng mong đợi

```text
Plan & repo inventory
        ↓
Independent security/design review
        ↓
Implementation (FE/BE parallel only after contract + file ownership)
        ↓
Integration + real-app checks
        ↓
┌──────────────────────┬──────────────────────┐
│ Functional reviewer  │ Security reviewer     │  song song, ngữ cảnh độc lập
└──────────────────────┴──────────────────────┘
        ↓
Judge: PASS ─────────────→ bàn giao
       FAIL → fix tối đa 2 vòng → review/check lại
       PARTIAL ───────────→ báo phần chưa xác minh, không tuyên bố hoàn tất
```

## Vì sao flow này hợp Orchestrate mode

Empryo dùng graph: agent node thực hiện việc; judge trả PASS/FAIL/PARTIAL; parallel/join nối các nhánh; loop cần giới hạn; Orchestrator thiết kế và điều phối chứ không tự sửa file. Brief này bám tài liệu chính thức [Multi-agent workflows](https://empryo.com/docs/agents/workflows) và [Tools by mode](https://empryo.com/docs/reference/tools). Hai orchestration cũ trong repo chỉ tạo skills/agents, không phải graph dựng web.

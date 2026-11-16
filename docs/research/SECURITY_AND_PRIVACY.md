# Threat model, an toàn dữ liệu và quyền riêng tư

## 1. Tài sản và ranh giới tin cậy

**Tài sản:** media gốc, transcript, embeddings/frames, tài khoản/job metadata, API credentials, model weights, báo cáo, logs.

**Ranh giới:** Browser/client; public API; vùng quarantine; database/object storage; broker; media worker; model provider bên ngoài; admin/CI/build pipeline.

**Đối thủ/đe dọa:** người gửi file độc hại, người dùng dò job của người khác, file parser exploit, người lạm dụng dịch vụ để tiêu tốn tài nguyên, URL nội bộ do SSRF, nhân viên xem dữ liệu quá quyền, dependency/model bị thay thế, mô hình sai hoặc bị né tránh.

## 2. STRIDE rút gọn

| Nhóm | Ví dụ trong hệ thống | Kiểm soát trọng tâm |
|---|---|---|
| Spoofing | giả job/user, giả MIME | auth khi cần, opaque IDs, kiểm tra quyền sở hữu mọi endpoint |
| Tampering | thay file/report/job message | hash lúc nhận và xử lý, ACL, schema validation, signed/versioned artifacts khi cần |
| Repudiation | không biết pipeline đã xử lý phiên bản nào | audit events tối thiểu, timestamp UTC, model/pipeline version |
| Information disclosure | transcript, khuôn mặt/giọng, log lộ nội dung | data minimization, TLS, encryption at rest, redaction, TTL, access control |
| Denial of service | file quá dài, codec bomb, nhiều job, video siêu phân giải | byte/duration/frame caps, quotas, queue backpressure, CPU/RAM/time limits |
| Elevation of privilege | FFmpeg/parser RCE hoặc worker compromise | non-root sandbox, no network, readonly FS, seccomp, patched parsers, worker isolation |

## 3. Upload media: yêu cầu bắt buộc

1. Giới hạn kích thước ở reverse proxy và API; stream ra quarantine, không giữ toàn file trong RAM.
2. Tạo tên file server-side ngẫu nhiên; không nối path từ tên người dùng. Chặn symlink/path traversal.
3. MIME/header/extension chỉ là tín hiệu. Kiểm tra container/codec bằng parser; magic bytes không chứng minh file an toàn.
4. Có allowlist định dạng và codec cụ thể; reject file không hợp lệ/polyglot khi parser không thể xử lý chắc chắn.
5. Quét malware nếu phù hợp, nhưng scanner không thay parser isolation và có thể false negative.
6. Chạy FFmpeg/decoder trong worker riêng bị cô lập; không shell interpolation; gọi process bằng argument array; giới hạn output, duration, threads, frame count, resolution và timeout.
7. Cấm worker truy cập Internet mặc định. Nếu downloader được bổ sung, tách service egress-controlled.
8. Xóa file tạm trên success, lỗi, cancellation và timeout; job reaper kiểm tra crash; bảo vệ khỏi symlink khi dọn.
9. Không phục vụ file upload từ origin ứng dụng; không inline render. Nếu phải tải, `Content-Disposition: attachment`, `nosniff`, origin riêng.
10. Throttle theo user/IP và tổng concurrency; trả lỗi chung, không leak stack trace/path.

## 4. SSRF khi xử lý link

Link do người dùng đưa có thể trỏ `localhost`, IP private/link-local, cloud metadata, DNS rebinding, redirect hoặc scheme nguy hiểm. Vì vậy hoãn link scan trong MVP. Nếu có: chỉ HTTPS/HTTP theo allowlist host, validate DNS và kiểm tra lại địa chỉ sau mỗi redirect/kết nối, chặn private/reserved ranges cả IPv4/IPv6, giới hạn redirect/byte/time/content-type, resolve pin bằng egress proxy, không mang cookie/auth header, chặn scheme khác, không cho worker gọi tùy ý. URL encoding/hostname parsing phải theo thư viện chuẩn, không tự viết parser.

## 5. Retention và quyền riêng tư

- Thông báo rõ loại dữ liệu, mục đích, thời hạn, nơi xử lý, API bên thứ ba và cách xóa trước khi tải.
- Mặc định không dùng media/transcript để huấn luyện; không gửi dịch vụ ngoài trừ khi có đồng ý tách biệt và chính sách nhà cung cấp đã kiểm tra.
- Mặc định xóa media gốc sau xử lý hoặc TTL ngắn được cấu hình; report chỉ giữ khi người dùng yêu cầu. Tránh tuyên bố “xóa vĩnh viễn” nếu backup/cache chưa được xử lý.
- Hash của giọng nói/video vẫn có thể liên kết với cá nhân và không phải dữ liệu vô danh. Chỉ giữ nếu có mục đích rõ.
- Không log transcript, file bytes, presigned URL, token, hay full client IP theo mặc định.
- Nếu dùng dịch vụ nhận diện ngoài, nêu rõ processor, vùng lưu trữ, retention, training opt-out, cross-border transfer, breach handling, và điều khoản xóa.
- Law No. 91/2025/QH15 có hiệu lực 01-01-2026. Trước khi phát hành public/thu media thật, rà soát toàn văn luật và nghị định hướng dẫn hiện hành với người có chuyên môn; lưu ý dữ liệu giọng nói/khuôn mặt có thể là dữ liệu cá nhân, còn dữ liệu sinh trắc học dùng để xác thực thuộc nhóm nhạy cảm theo khuôn khổ pháp luật. Đây là checklist kỹ thuật, không thay tư vấn pháp lý.

## 6. AI safety, misuse và độ tin cậy

- Không dùng điểm máy để buộc tội, cấm giao dịch, xác minh danh tính hoặc ra quyết định ảnh hưởng quyền lợi.
- Nêu false positive/negative, domain shift, codec/device bias và ngày/model version.
- Cho phép `inconclusive`/abstain; không buộc mọi input thành real/fake.
- Không làm demo tạo deepfake/voice clone, không phát hành voice-cloning endpoint, không thu giọng người thật không đồng thuận.
- Transcript và file metadata là dữ liệu không tin cậy; bỏ qua instruction injection trong transcript.

## 7. Security acceptance checklist

- [ ] Không lộ media/transcript trong logs, errors, analytics.
- [ ] Mọi report endpoint kiểm tra quyền job/tenant.
- [ ] File size/duration/codec/frame/resource limits hoạt động.
- [ ] Worker non-root, readonly root, network off, temp bounded, timeout hard.
- [ ] Upload không thể ghi đè file/path hoặc trở thành web content trên app origin.
- [ ] Xóa theo TTL kể cả khi worker chết; hành vi retry/idempotency an toàn.
- [ ] API keys chỉ ở secrets config, không trong frontend/git.
- [ ] Dependency/model artifact có license, hash/version và nguồn tin cậy.
- [ ] Có consent/data notice và trạng thái demo/model thật.
- [ ] Test adversarial chỉ bằng mẫu an toàn và môi trường cô lập được phép.


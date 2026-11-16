# Nền tảng kỹ thuật và kiến trúc đề xuất

## 1. Luồng tổng thể

```text
Browser → API nhận file → vùng quarantine → kiểm tra giới hạn/hash/loại file
  → queue job → worker media bị cô lập → audio/video/context adapters
  → hợp nhất kết quả có nguồn gốc → report API → UI
                         ↘ xóa file trung gian theo TTL
```

### Các thành phần

- **Web UI:** React/Next.js hoặc frontend hiện có; upload tiến độ, trang trạng thái, báo cáo có accessibility.
- **API:** FastAPI/Pydantic nếu phù hợp codebase hiện tại; chỉ làm auth, upload streaming, job lifecycle và report. Không chạy FFmpeg/model nặng trong request process.
- **Queue:** Redis + Celery/RQ là phương án; job id ngẫu nhiên, idempotency, timeout, retry hữu hạn, giới hạn concurrency. Secret broker chỉ trong secret store/env.
- **Storage:** vùng tạm private, key ngẫu nhiên, không dùng tên client, hạn TTL; chỉ cấp quyền đọc đúng job. Mặc định không lưu file gốc sau job.
- **Media worker:** non-root, read-only rootfs, drop capabilities, seccomp/AppArmor phù hợp, network egress tắt, CPU/RAM/PID/disk/time quota, tmpfs giới hạn; cập nhật FFmpeg và codec.
- **DB:** lưu job metadata tối thiểu, model/version, trạng thái, report đã khử dữ liệu cá nhân; không ghi transcript/file path nhạy cảm vào logs.
- **Observability:** metrics về queue/latency/error/resource; redact nội dung, IP đầy đủ và identifiers khỏi log mặc định.

Không cần PostgreSQL, MinIO, Redis, ClamAV và nhiều dịch vụ khác cùng lúc cho prototype đơn máy. Chọn cấu hình nhỏ nhất phù hợp mã hiện có; thêm dependency chỉ khi có nhu cầu chứng minh cụ thể.

## 2. Các nhánh phân tích

### Audio

- Chuẩn hóa trong sandbox về mono/sample rate được hỗ trợ, nhưng giữ hash của file gốc; ghi lại phép biến đổi.
- Adapter có thể thử baseline anti-spoofing trên ASVspoof trước. AASIST/RawNet2 là ứng viên nghiên cứu, không mặc nhiên “chuẩn tốt nhất” hoặc tốt trên tiếng Việt/điện thoại.
- Đặc trưng như LFCC, CQCC, log-mel là đầu vào/đường baseline, không phải bằng chứng độc lập. Heuristic phổ cao, hơi thở hay pha phụ thuộc micro, codec, noise reduction và compression.
- Whisper (MIT) phù hợp làm ASR baseline; chất lượng tiếng Việt, tên riêng, số tài khoản và ngôn ngữ pha trộn phải được đo. Không dùng transcript ASR như bản ghi chính xác.

### Video

- Lấy frame theo chính sách cố định, giới hạn số frame/fps/độ phân giải/thời lượng để chống chi phí bất thường.
- Bắt đầu bằng baseline benchmark được tái lập như DeepfakeBench; đánh giá cross-dataset và test compression/resize.
- Face landmarks, blink, boundary artifacts hay audio-visual sync chỉ là gợi ý có nhiễu; không dùng EAR/chớp mắt riêng để kết luận deepfake.
- Mô hình ảnh theo frame không đảm bảo phát hiện video; báo riêng protocol frame-level/video-level.

### Ngữ cảnh lừa đảo

- Có thể phát hiện mẫu ngôn ngữ: tạo khẩn cấp, yêu cầu chuyển tiền/thông tin, mạo danh cơ quan, bí mật hóa, đe dọa, lợi nhuận phi thực tế.
- Chỉ phân loại tín hiệu câu chữ, không suy đoán chủng tộc/giới tính/tâm lý hay kết luận chủ đích/người phạm tội.
- Tôn trọng ngôn ngữ vùng miền; dùng bộ dữ liệu tiếng Việt được phép, gán nhãn kép và báo confidence/abstain.
- LLM chỉ sinh lời giải thích từ kết quả có cấu trúc, không được tự bịa chứng cứ. Transcript và metadata là untrusted prompt/data, không chạy chỉ dẫn nhúng.

## 3. Hợp nhất kết quả

Tránh cộng tùy ý ba điểm thành `Scam Risk Score`. Nên trả về schema theo nguồn:

```json
{
  "mode": "demo | model",
  "overall": {"label": "needs_review", "confidence": null},
  "signals": [
    {"source": "audio_detector", "label": "spoof_suspected", "score": 0.0,
     "model_version": "...", "limitations": ["..." ]},
    {"source": "transcript_context", "label": "urgent_payment_request",
     "evidence": [{"start_ms": 0, "end_ms": 0, "text": "..."}]}
  ],
  "recommendations": ["..."],
  "retention": {"expires_at": "..."}
}
```

Không lấy `0.0` làm giá trị giả cho trường chưa chạy; dùng `null`/`unavailable`. Trường `score` phải được định nghĩa (logit/probability/rank), hiệu chuẩn và có threshold theo test set. UI không được biến score chưa hiệu chuẩn thành % xác suất.

## 4. API phác thảo

- `POST /api/v1/analyses` — multipart file, kiểm tra size/type/quota; trả `202` + opaque job id.
- `GET /api/v1/analyses/{id}` — trạng thái và report theo quyền sở hữu.
- `DELETE /api/v1/analyses/{id}` — xóa report/file tạm theo chính sách.
- `GET /health/live`, `/health/ready` — không trả secrets/environment.

Không nhận URL tùy ý trong endpoint upload. Nếu sau này có URL ingest, thiết kế endpoint riêng có allowlist/egress proxy và threat model SSRF.

## 5. Mô hình dữ liệu tối thiểu

`Analysis`: opaque UUID, created/expires timestamps, status, byte size, media kind, SHA-256, pipeline version, model versions, result JSON schema version, error code tổng quát. PII/logs không cần thiết không thu thập. Nếu có tài khoản, tách tenant/user authorization khỏi ID khó đoán; ID ngẫu nhiên không thay authorization.

## 6. Lựa chọn stack

Blueprint hiện có gợi ý FastAPI, Redis/Celery, PostgreSQL, S3/MinIO, Next.js, FFmpeg, Prometheus/Grafana, ClamAV. Đây là danh sách ứng viên, không phải yêu cầu bắt buộc. Trước khi chọn, kiểm tra `backend/`, `frontend/`, lockfiles và runtime hiện tại; ưu tiên mở rộng codebase thay vì dựng lại stack. ClamAV có thể hỗ trợ nhận diện mẫu malware nhưng không thay sandbox/parser hardening; không quét hay mở media trên host.


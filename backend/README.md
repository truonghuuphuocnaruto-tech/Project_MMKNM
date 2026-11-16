# Backend local

FastAPI phục vụ web demo. API đo byte, SHA-256 và MIME trình duyệt khai báo; chỉ thử đọc thời lượng WAV bằng Python standard library. Không có mô hình deepfake.

## Cài đặt và chạy trên Windows

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Swagger UI: `http://127.0.0.1:8000/docs`. Health checks: `/health/live` và `/health/ready`.

## Hành vi và giới hạn

- Tệp được stream theo chunk 64 KiB vào tên ngẫu nhiên trong `backend/quarantine/`; giới hạn mặc định 15 MiB (chặn sớm qua Content-Length header và ngắt stream khi vượt). Tệp được xóa sau khi lấy thông số, kể cả nhánh xử lý thông thường có lỗi.
- Parser media (kể cả `wave.open`) tạm ngừng gọi trực tiếp trên host process để phòng ngừa rủi ro parser exploit khi chưa có worker container sandbox; `duration_seconds` trả về `null`. Giới hạn thời lượng 60s tạm thời chưa được xác minh khi tắt parser.
- Kết quả lưu trong RAM tiến trình đến khi DELETE, hết TTL 15 phút hoặc backend dừng. Đây không phải kho lưu bền vững.
- Schema luôn có `mode: demo`, `confidence: null`, tín hiệu mock có nhãn `[Minh họa / Mock cues]`; không có xác suất giả.
- Không tải URL, không gọi API ngoài, không có worker cách ly parser media và không triển khai public.

## Kiểm tra backend

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

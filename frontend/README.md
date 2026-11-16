# Frontend local

React + TypeScript + Vite + Tailwind. Giao diện tiếng Việt cho web demo, không gọi dịch vụ ngoài.

## Chạy

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Mở `http://127.0.0.1:5173`. Vite proxy `/api` và `/health` sang backend `http://localhost:8000`. Lệnh production build: `npm run build`.

## Phạm vi giao diện

- Luồng: chọn tệp audio/video → trạng thái upload → báo cáo → checklist xác minh → xóa báo cáo khỏi RAM backend.
- Cảnh báo DEMO luôn hiện; cue chỉ là ví dụ, không tính trên tệp upload và không có xác suất deepfake.
- Kích thước 15 MiB được kiểm tra ở client để báo sớm và luôn được backend giới hạn độc lập.
- Thông tin MIME là do trình duyệt khai báo; nội dung tệp chưa được xác minh. Backend chỉ đọc WAV ngắn bằng standard library.

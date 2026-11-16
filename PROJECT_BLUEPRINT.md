# 🛡️ AI VOICE & VIDEO SCAM CHECKER (HỆ THỐNG PHÁT HIỆN LỪA ĐẢO DEEPFAKE ÂM THANH & HÌNH ẢNH)
> Dự án Chuyên ngành An toàn Thông tin & Trí tuệ Nhân tạo Phòng thủ (Cybersecurity Defense & AI Forensics)

> **Lưu ý:** Đây là bản phác thảo ban đầu, không phải đặc tả đã được xác minh. Trước khi triển khai, đọc [`docs/research/README.md`](docs/research/README.md), đặc biệt các giới hạn về model score, dataset/license, quyền riêng tư, upload và SSRF. Những tên công cụ/model/stack phía dưới là ứng viên cần kiểm tra theo codebase và tài liệu upstream hiện hành.

---

## 1. TỔNG QUAN HỆ THỐNG & MÔ HÌNH ĐE DỌA (THREAT MODELING)
- **Mục tiêu**: Phát hiện và cảnh báo các cuộc gọi, tin nhắn thoại (Audio) và video call (Video) lừa đảo được tạo/giả mạo bởi công cụ GenAI (Voice Cloning, Face-swap, Lip-sync) kết hợp kịch bản thao túng tâm lý (Social Engineering / BEC).
- **Phân loại đe dọa (Threat Vectors)**:
  1. **Voice Cloning / Vishing**: Tấn công giả dạng giọng người thân, giám đốc doanh nghiệp (CEO Fraud) chuyển tiền gấp.
  2. **Video Deepfake / eKYC Bypass**: Giả mạo khuôn mặt, cử động mắt, cử động môi trong cuộc gọi video lừa đảo hoặc vượt rào xác thực định danh số.
  3. **Social Engineering Context**: Phân tích nội dung hội thoại nhận diện các mẫu lừa đảo (đe dọa vi phạm pháp luật, chuyển khoản gấp, nhận quà từ nước ngoài).
  4. **Attacker File Exploit**: File audio/video tải lên chứa payload khai thác lỗ hổng parser (FFmpeg RCE, Polyglot files).

---

## 2. BẢN ĐỒ KỸ NĂNG CẦN THIẾT (CORE SKILLS MATRIX)

| Nhóm kỹ năng | Các năng lực trọng tâm | Ứng dụng cụ thể trong dự án |
| :--- | :--- | :--- |
| **1. Digital Media Forensics & AI** | Deep Learning, DSP (Digital Signal Processing), Computer Vision, Audio Processing | Trích xuất đặc trưng phổ tần âm thanh (MFCC, Mel-spectrogram), phân tích biến dạng khuôn mặt, nhịp chớp mắt, đồng bộ môi - tiếng. |
| **2. Web Security & Application Security** | OWASP Top 10, ASVS, Sandboxing, Secure File Upload, Anti-RCE, Auth/RBAC | Cách ly luồng xử lý media (FFmpeg sandbox), chặn DoS bằng file bomb (decompression bomb), kiểm tra mã độc ClamAV. |
| **3. Backend & High-Concurrency Architecture** | FastAPI, Asynchronous Python, Task Queue (Celery/Redis), WebSockets | Xử lý các tác vụ AI tốn GPU/RAM qua hàng đợi bất đồng bộ, stream kết quả quét thời gian thực tới frontend. |
| **4. Modern Frontend & Data Visualization** | Next.js/React, TypeScript, Tailwind CSS, Audio/Video Canvas, Recharts | Hiển thị spectrogram âm thanh, bounding-box khuôn mặt, heatmap vùng bị deepfake, radar chart phân tích rủi ro. |
| **5. MLOps & Model Optimization** | ONNX Runtime, TensorRT, Docker, Docker Compose, Model Quantization | Chuyển đổi mô hình PyTorch sang ONNX/TensorRT để giảm latency từ 10s xuống <1.5s/request. |

---

## 3. TECH STACK & BỘ TOOL HOÀN CHỈNH (THE TOOLCHAIN)

### 3.1. Tầng Phân tích AI & Pháp y Kỹ thuật số (AI Forensics Layer)
- **Audio Deepfake Detection**:
  - `RawNet2` / `AASIST` (Audio Anti-Spoofing using Integrated Spectro-Temporal Graph Attention Networks) - Chuẩn benchmark của cuộc thi ASVspoof.
  - `Librosa` & `Torchaudio`: Trích xuất Mel-Spectrogram, LFCC (Linear Frequency Cepstral Coefficients), phân tích ngắt quãng thở sinh lý.
- **Video Deepfake Detection**:
  - `FaceForensics++` pipeline: `EfficientNet-B4` hoặc `Xception` fine-tuned trên tập dữ liệu Deepfake Detection Challenge (DFDC) & Celeb-DF.
  - `MediaPipe` / `OpenCV`: Nhận diện khuôn mặt (Face Landmark 468 điểm), tính chỉ số bất thường nhịp chớp mắt (Eye Aspect Ratio - EAR), hướng nhìn và viền ghép da mặt (blending boundary artifacts).
  - `Wav2Lip Discriminator` / `SyncNet`: Đánh giá độ lệch đồng bộ khẩu hình và âm thanh (Lip-sync mismatch).
- **Speech-to-Text & Scam Context Classifier (Nội dung lừa đảo)**:
  - `OpenAI Whisper` (Model `small` hoặc `medium` hỗ trợ tiếng Việt mượt mà).
  - Phân loại ngữ cảnh: Fine-tuned `PhoBERT` hoặc mô hình LLM (`Llama-3-8B-Instruct` / `Qwen-2.5-7B`) với prompt phân loại Intent lừa đảo (Giả công an, đe dọa tố tụng, vay tiền gấp, đầu tư tài chính).

### 3.2. Tầng Backend & Pipeline Quản lý Tác vụ (Backend & Async Processing)
- **API Framework**: `FastAPI` (Python 3.11+, Asynchronous, Type validation với Pydantic v2).
- **Message Broker & Task Queue**: `Redis` + `Celery` (hoặc `RQ` / `RabbitMQ`) để xử lý batch job tải video nặng.
- **Media Engine**: `FFmpeg` (kết hợp `libav` filter an toàn để strip metadata, chuẩn hóa codec về H.264/AAC, sanitize input).
- **Database & Storage**:
  - `PostgreSQL`: Lưu lịch sử phân tích, báo cáo audit, tài khoản và telemetry.
  - `MinIO` / S3: Lưu trữ file tạm trong môi trường mã hóa (AES-256), tự động xóa sau khi phân tích xong (Data retention policy).

### 3.3. Tầng Frontend (Dashboard & Forensics Viewer)
- **Framework**: `Next.js 15` (App Router) / `React 19` + `TypeScript`.
- **UI Kit & Styling**: `Tailwind CSS`, `shadcn/ui`, `Lucide React`.
- **Trực quan hóa pháp y (Forensics Visualization)**:
  - `Wavesurfer.js`: Hiển thị dải sóng âm thanh và vùng nghi vấn cắt ghép.
  - Canvas Video Heatmap: Vẽ bounding box và gradient heatmap điểm nghi vấn trên từng frame video.
  - `Recharts`: Biểu đồ radar đánh giá đa chiều (Độ tự nhiên giọng nói, nhịp chớp mắt, kịch bản ngữ cảnh, đồng bộ khẩu hình).

### 3.4. Tầng An ninh & Hạ tầng (Security & DevOps)
- **Container Sandboxing**: Docker với seccomp profile hạn chế syscall của FFmpeg và Python AI workers.
- **Antivirus Gateway**: `ClamAV` quét virus/trojan trước khi nạp file vào bộ nhớ.
- **Rate Limiting & WAF**: `Nginx` / `Traefik` kết hợp fail2ban, hạn chế DoS payload lớn.
- **Monitoring & Audit Logging**: `Prometheus` + `Grafana`, OpenTelemetry.

---

## 4. TRÌNH TỰ THỰC HIỆN DỰ ÁN (CHÍNH XÁC THEO 6 BƯỚC)

```
[BƯỚC 1: KHỞI TẠO KIẾN TRÚC & THREAT MODEL]
   │  └── Định nghĩa pipeline phân tích 3 tầng: File Upload -> Sandbox Sanitizer -> AI Engine -> Report
   │
[BƯỚC 2: PHÁT TRIỂN CORE AI DETECTION ENGINES]
   │  ├── Engine A (Voice): Trích xuất phổ âm, phát hiện artifacts tổng hợp giọng.
   │  ├── Engine B (Video): Trích xuất frames, phân tích landmarks & texture bất thường.
   │  └── Engine C (Text/Scam): Whisper ASR -> Phân loại kịch bản thao túng tâm lý.
   │
[BƯỚC 3: XÂY DỰNG BACKEND ASYNC PIPELINE (FastAPI + Celery)]
   │  ├── Xử lý upload an toàn (giới hạn dung lượng, định dạng, sanitize qua FFmpeg).
   │  └── Hàng đợi Celery chạy song song 3 engines và tổng hợp điểm Scam Risk Score (0 - 100%).
   │
[BƯỚC 4: THIẾT KẾ GIAO DIỆN PHÁP Y (Next.js Dashboard)]
   │  ├── Màn hình tải file kéo thả với realtime progress bar qua WebSocket.
   │  └── Báo cáo bằng chứng: Heatmap khuôn mặt, phổ âm thanh, transcript gắn nhãn câu lừa đảo.
   │
[BƯỚC 5: TỐI ƯU HÓA BẢO MẬT & SANDBOXING (Chuyên ngành ATTT)]
   │  ├── Cách ly tiến trình xử lý media trong Docker non-root, drop capabilities.
   │  └── Cài đặt cơ chế bảo vệ chống ReDoS, Zip-bomb, SSRF và Path Traversal.
   │
[BƯỚC 6: BENCHMARK, KIỂM THỬ THỰC TẾ & BÁO CÁO KHOA HỌC]
   │  └── Đo lường EER (Equal Error Rate), AUC-ROC trên tập kiểm thử ASVspoof & DeepfakeBench.
```

---

## 5. CẤU TRÚC THƯ MỤC CHUẨN CỦA DỰ ÁN (PROJECT STRUCTURE)

```
Project_MMKNM/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── analyze.py          # Endpoint upload & kích hoạt phân tích
│   │   │   │   ├── reports.py          # Xem chi tiết kết quả phân tích
│   │   │   │   └── health.py           # Healthcheck & metrics
│   │   ├── core/
│   │   │   ├── config.py               # Cấu hình môi trường, max file size, security keys
│   │   │   └── security.py             # Hash validation, rate limit, token auth
│   │   ├── engines/
│   │   │   ├── audio_engine.py         # Phân tích dải tần, AASIST/RawNet model
│   │   │   ├── video_engine.py         # Nhận diện frame, landmarks, FaceForensics model
│   │   │   └── context_engine.py       # Whisper ASR & phân loại kịch bản lừa đảo
│   │   ├── workers/
│   │   │   ├── celery_app.py           # Celery broker cấu hình
│   │   │   └── tasks.py                # Tác vụ phân tích nền bất đồng bộ
│   │   └── utils/
│   │       ├── media_sanitizer.py      # FFmpeg sandbox & metadata stripper
│   │       └── clamav_scanner.py       # Kiểm tra mã độc trước khi nạp model
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx      # Bảng điều khiển lịch sử phân tích
│   │   │   ├── scan/page.tsx           # Giao diện tải lên & quét thời gian thực
│   │   │   └── report/[id]/page.tsx    # Báo cáo chi tiết bằng chứng pháp y
│   │   ├── components/
│   │   │   ├── AudioWaveformViewer.tsx # Sóng âm thanh tương tác
│   │   │   ├── VideoHeatmapViewer.tsx  # Video player hiển thị vùng giả mạo
│   │   │   └── RiskGauge.tsx           # Đồng hồ đo mức độ rủi ro lừa đảo
│   └── package.json
├── docker-compose.yml                  # Khởi chạy toàn bộ: API, Celery, Redis, Next.js, Postgres
└── README.md
```

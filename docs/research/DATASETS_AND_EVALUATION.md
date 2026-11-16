# Dữ liệu, model và đánh giá

## 1. Nguyên tắc chọn dữ liệu

Tách license mã nguồn, license model weights, license dữ liệu, quyền hình ảnh/giọng nói và quyền dùng thương mại. Một repository MIT không làm dataset đi kèm thành MIT. Không tải/commit tập dữ liệu cần đăng ký hoặc chỉ cho nghiên cứu phi thương mại. Lưu manifest gồm nguồn, ngày lấy, điều khoản, phiên bản, split, hash, nhãn và quyền được cấp.

## 2. Nguồn benchmark tham khảo

| Tập/benchmark | Dùng để | Ràng buộc/cảnh báo |
|---|---|---|
| ASVspoof 2021 LA/PA/DF | Audio spoof/deepfake; baseline EER/min t-DCF | Official site ghi Open Data Commons Attribution License; kiểm tra metadata, split và điều kiện attribution |
| ASVspoof 5 | Bài toán audio spoofing mới hơn/multilingual | Kiểm tra phiên bản và điều khoản trực tiếp trên site chính thức trước dùng; không mặc định dữ liệu hợp tiếng Việt đời thực |
| FaceForensics++ | Face manipulation benchmark | Cần yêu cầu quyền; terms cho mục đích nghiên cứu/giáo dục phi thương mại; không redistribute |
| Celeb-DF v2 | Video deepfake chất lượng cao hơn | Xác minh điều khoản/chấp thuận; chứa người thật, rủi ro quyền riêng tư/đồng thuận |
| DFDC | Nhiều kịch bản và biến thiên | Xác minh terms, giấy phép và quyền phân phối bản cụ thể |
| DeepfakeBench | Chuẩn hóa preprocessing, detector và protocol | Framework có mã riêng; dữ liệu bên trong vẫn có license từng nguồn. Kiểm tra runtime/dependencies cũ trước tích hợp |
| NIST OpenMFC | Phương pháp đánh giá media forensics | Trang hiện ghi evaluation kết thúc và không phát hành dataset công khai; không lấy làm nguồn download |
| SEA-Spoof | Audio deepfake nhiều ngôn ngữ Đông Nam Á, gồm tiếng Việt | Nghiên cứu rất mới; kiểm tra paper, dataset availability/terms, chất lượng annotation, speaker leakage trước dùng |

Khi không đủ quyền/tài nguyên, bắt đầu bằng data giả/synthetic do nhóm tự tạo từ consent rõ ràng, hoặc chỉ chạy trên public sample chính thức có license phù hợp. Synthetic demo không chứng minh khả năng thực tế.

## 3. Mô hình ứng viên

- **AASIST/RawNet2:** nghiên cứu audio anti-spoof; benchmark trước trên ASVspoof và domain tiếng Việt. Không mặc định có model production-ready.
- **Whisper:** ASR mã nguồn MIT; chỉ tạo transcript, không phát hiện deepfake. Cần đo lỗi tiếng Việt và dùng input untrusted.
- **DeepfakeBench:** harness tham khảo cho video, nhiều detector/protocol. Không chép dataset đóng gói của repo khi chưa kiểm tra quyền.
- **API thương mại/hosted:** chỉ dùng sau khi xác minh API thực sự public, terms, data retention, giá, rate limits, vùng xử lý, model output semantics và điều kiện gửi dữ liệu. Không suy đoán endpoint từ tên thương hiệu.

Model-card tối thiểu: tác vụ, kiến trúc/checkpoint, nguồn & hash, license, train dataset, test dataset, ngôn ngữ/codec/hardware được hỗ trợ, limitations, known bias, threshold, calibration và ngày kiểm tra.

## 4. Protocol đánh giá

1. **Định nghĩa task riêng:** audio fake-vs-bona-fide; video manipulation-vs-authentic; transcript scam cue. Không gộp nhãn thành “scam” nếu không có ground truth.
2. **Tách theo người/nguồn/tạo tác:** tránh cùng speaker/video hoặc source leak giữa train/val/test.
3. **Giữ test set đóng:** không chọn threshold theo test. Ghi seed, code commit, dependencies, model checksum và preprocessing.
4. **Cross-domain:** dataset khác nguồn, codec/compression, noise, thiết bị, crop/frame rate; test tiếng Việt theo vùng giọng và code-switch nếu có quyền dữ liệu.
5. **Metrics:** ROC-AUC, PR-AUC, EER khi thích hợp, FPR tại operating point, FNR, precision/recall/F1, confusion matrix, Brier/ECE hoặc calibration plot, latency p50/p95 và memory.
6. **Slicing:** theo codec, sample rate, duration, noise, language/accent, synthesis family và dataset. Báo metric từng nhóm cùng CI/bootstrap nếu cỡ mẫu cho phép.
7. **Human factors:** đo người dùng hiểu cảnh báo/uncertainty không; không chỉ benchmark classifier.
8. **Demo status:** dữ liệu mock được tách hoàn toàn khỏi model result; mọi response UI/API ghi `mode=demo`.

Không đặt mục tiêu latency như “<1.5 s” trước khi đo trên phần cứng xác định. Mọi headline accuracy phải nêu dataset, split, metric, threshold, cỡ mẫu và điều kiện.

## 5. Bảng ghi kết quả (điền sau khi chạy)

| Task | Dataset/test split | Metric | Threshold | Result | CI | Runtime/hardware | Model/version |
|---|---|---|---|---|---|---|---|
| Audio | Chưa chạy | — | — | — | — | — | — |
| Video | Chưa chạy | — | — | — | — | — | — |
| Scam-context | Chưa chạy | — | — | — | — | — | — |


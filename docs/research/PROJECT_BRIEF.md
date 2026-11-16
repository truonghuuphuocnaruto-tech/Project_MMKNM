# Đề cương sản phẩm và báo cáo

## 1. Tên và ý tưởng

**AI Voice & Video Scam Checker** là web app giáo dục/an toàn thông tin giúp người dùng rà soát một đoạn audio/video nghi vấn. Hệ thống kết hợp (a) dấu hiệu kỹ thuật có thể đo trên media, (b) ngôn ngữ gây áp lực hoặc yêu cầu giao dịch bất thường, và (c) hướng dẫn xác minh độc lập.

Ý tưởng được rút từ đoạn chat chia sẻ [`Xây dựng dự án Deepfake`](https://chatgpt.com/share/6af42501-8d80-83ec-b4cf-2ec3d580af84): tải media hoặc dán link, hiển thị mức rủi ro và lý do; có thể dùng API ngoài hoặc mô phỏng cho demo. Phạm vi bên dưới làm rõ giới hạn cần thiết để tránh khẳng định sai.

## 2. Vấn đề và mục tiêu

Cuộc gọi giả mạo, voice cloning, video bị chỉnh sửa và kịch bản vishing/BEC khiến người nhận khó kiểm tra trong lúc chịu áp lực. Mục tiêu là làm một bản demo có thể:

- tiếp nhận media có kiểm soát;
- chạy các phép phân tích riêng biệt và minh bạch;
- trả về phát hiện kèm bằng chứng/giới hạn, không chỉ một con số;
- hướng dẫn người dùng xác minh qua kênh đã biết trước và trì hoãn hành động tài chính;
- chứng minh kiến thức ATTT qua threat model, xử lý upload an toàn, quyền riêng tư, logging tối thiểu và đánh giá mô hình.

## 3. Đối tượng và trường hợp dùng

- Người dân muốn kiểm tra tin nhắn thoại/video đáng ngờ.
- Sinh viên/giảng viên xem demo AI forensics và secure media pipeline.
- Nhóm kỹ thuật kiểm tra mô hình trên tập dữ liệu có quyền sử dụng.

Không phải hệ thống giám định pháp y được chứng nhận, công cụ xác minh danh tính, hệ thống giám sát bí mật, hay công cụ quyết định giao dịch/ngân hàng.

## 4. Phạm vi MVP

### Có trong MVP

1. Tải lên một file audio/video ngắn, giới hạn định dạng/dung lượng/thời lượng.
2. Kiểm tra định dạng bằng parser an toàn trong worker cách ly; loại file sai, hỏng, quá dài hoặc vượt ngưỡng tài nguyên.
3. Tạo job bất đồng bộ, trạng thái xử lý rõ ràng.
4. Bộ phân tích thay thế được: `demo` ban đầu; adapter thật chỉ bật khi đã xác minh license, quyền riêng tư, hiệu năng và chất lượng.
5. Phân tích ngữ cảnh transcript tùy chọn, có thông báo; cho phép xóa transcript/file.
6. Báo cáo gồm kết quả từng nhánh, mức bất định, chỉ báo thực sự đo được, cảnh báo giới hạn và checklist xác minh an toàn.
7. Tự xóa media tạm và không lưu nội dung đầu vào vào log.

### Hoãn khỏi MVP

- Nhận URL từ Internet: chỉ thêm sau thiết kế SSRF-safe với allowlist, chặn IP nội bộ/metadata, redirect kiểm soát, DNS rebinding defense, giới hạn byte/thời gian và egress proxy. Không để backend gọi URL tùy ý.
- Phân tích cuộc gọi trực tiếp/real-time, eKYC, xác thực người nói, xác định danh tính, nhận diện cảm xúc.
- Huấn luyện mô hình lớn, fine-tune dữ liệu người dùng, hoặc tuyên bố tương thích với mọi codec/ngôn ngữ.
- Gửi media lên API của bên thứ ba theo mặc định.

## 5. Các định nghĩa dùng trong báo cáo

- **Deepfake:** media tổng hợp hoặc chỉnh sửa bằng kỹ thuật học máy nhằm mô phỏng người/sự kiện. Không phải mọi nội dung AI đều là lừa đảo.
- **Voice cloning:** tạo hoặc chuyển đổi tiếng nói để giống giọng một người. Phát hiện giọng tổng hợp không đồng nghĩa nhận diện được người nói.
- **Vishing:** lừa đảo qua cuộc gọi/thoại, thường dùng mạo danh, đe dọa, khẩn cấp hoặc yêu cầu giao dịch.
- **BEC/CEO fraud:** giả mạo hoặc chiếm đoạt trao đổi doanh nghiệp để thúc đẩy thanh toán/chuyển dữ liệu.
- **Media forensics:** kiểm tra đặc tính/nguồn gốc/tính toàn vẹn của ảnh, âm thanh hoặc video; kết quả phụ thuộc dữ liệu và phương pháp.
- **False positive/false negative:** nội dung thật bị báo giả / nội dung giả bị bỏ sót.
- **EER:** điểm mà tỷ lệ false acceptance và false rejection bằng nhau; hữu ích trong speaker/anti-spoofing benchmark nhưng không đủ để mô tả trải nghiệm sản phẩm.
- **AUC-ROC / PR-AUC:** khả năng xếp hạng phân biệt lớp; PR-AUC hữu ích khi tỷ lệ lớp mất cân bằng.
- **Calibration:** mức độ mà confidence dự đoán phù hợp với tần suất đúng thực tế.
- **OOD/generalization:** dữ liệu ngoài miền huấn luyện, ví dụ codec, ngôn ngữ, thiết bị hay kiểu giả mới.

## 6. UX và nội dung kết quả

Không dùng nhãn “99% là deepfake” nếu số đó không phải xác suất đã hiệu chuẩn. Khuyến nghị UI hiển thị:

- `Chưa đủ dữ liệu`, `Có một số dấu hiệu cần kiểm tra`, `Nhiều dấu hiệu rủi ro`;
- điểm từng nhánh (audio/video/ngữ cảnh), model version và trạng thái `demo` hay `model thật`;
- những quan sát thực tế (ví dụ codec/độ dài/transcript) tách biệt với suy luận của mô hình;
- câu “Kết quả không xác minh danh tính hoặc chứng minh lừa đảo. Hãy xác minh qua số/kênh đã lưu trước đó.”

Checklist gợi ý: gọi lại số điện thoại có sẵn, đặt câu hỏi xác minh riêng đã thống nhất, xác nhận yêu cầu chuyển tiền qua kênh thứ hai, không dùng số/link do người gọi cung cấp.

## 7. Dàn ý báo cáo và slide

### Báo cáo

1. Tóm tắt, bối cảnh và vấn đề.
2. Mục tiêu, phạm vi, giả định và đạo đức.
3. Cơ sở lý thuyết: deepfake, audio spoofing, vishing/BEC, media forensics.
4. Yêu cầu chức năng/phi chức năng và use case.
5. Kiến trúc và luồng dữ liệu.
6. Threat model STRIDE, rủi ro upload/SSRF/riêng tư/supply chain.
7. Mô hình phát hiện, giải thích, dữ liệu và license.
8. Thiết kế triển khai, API, giao diện.
9. Kế hoạch test bảo mật và đánh giá mô hình.
10. Kết quả đo, giới hạn, false positive/negative.
11. Quyền riêng tư, pháp lý, đạo đức và biện pháp giảm thiểu.
12. Kết luận, hướng phát triển, tài liệu tham khảo.

### Slide bảo vệ (10–12 trang)

1. Tên dự án và demo trong một câu.
2. Tình huống/vấn đề.
3. Mục tiêu và ranh giới hệ thống.
4. Luồng sử dụng.
5. Kiến trúc 3 nhánh phát hiện.
6. Demo giao diện/kết quả có giải thích.
7. ATTT: upload sandbox, dữ liệu, retention.
8. Dataset/model và giấy phép.
9. Đánh giá: dữ liệu test, metric, kết quả thật.
10. Hạn chế/đạo đức.
11. Roadmap.
12. Tài liệu tham khảo.

Không điền số liệu benchmark giả định vào báo cáo hoặc slide. Chỉ thêm kết quả sau khi chạy đánh giá đã mô tả trong `DATASETS_AND_EVALUATION.md`.


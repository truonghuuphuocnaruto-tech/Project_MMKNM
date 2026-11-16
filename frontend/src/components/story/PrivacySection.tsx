import React from 'react';

export const PrivacySection: React.FC = () => {
  return (
    <section id="quyen-rieng-tu" className="py-16 sm:py-20 border-b border-[#e6dcce] bg-[#f8f4ec]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f766e] bg-[#ccfbf1] border border-[#99f6e4] rounded-full mb-3">
            Minh bạch dữ liệu &amp; Quyền riêng tư
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            Cách thức xử lý dữ liệu thực tế trong hệ thống
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Chúng tôi mô tả chính xác hành vi mã nguồn hiện hành của ứng dụng, không đưa ra các cam kết phóng đại về bảo mật hay sự an toàn tuyệt đối.
          </p>
        </div>

        {/* Comparison grid: Landing Page vs Local Demo App */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Landing Page Privacy Card */}
          <div className="story-card p-6 border-t-4 border-t-[#0f766e]">
            <div className="flex items-center justify-between pb-3 border-b border-[#efe7dc]">
              <h3 className="text-base font-bold text-[#17232e]">Trang giới thiệu (/)</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Phía Client
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-xs sm:text-sm text-[#485966]">
              <li className="flex items-start space-x-2">
                <span className="text-[#0f766e] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Hoàn toàn tĩnh:</strong> Trang giới thiệu này không yêu cầu bạn tải lên hay gửi bất kỳ tệp media âm thanh hoặc hình ảnh nào.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#0f766e] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Không theo dõi cá nhân:</strong> Không sử dụng cookie theo dõi hành vi, không nhúng mã phân tích (tracking scripts), không gọi tới các mạng lưới quảng cáo hoặc CDN thu thập dữ liệu bên thứ ba.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#0f766e] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Không truyền dữ liệu:</strong> Toàn bộ nội dung giao diện được biên dịch sẵn và chạy trực tiếp trong trình duyệt web của bạn.
                </span>
              </li>
            </ul>
          </div>

          {/* Local App Privacy Card */}
          <div className="story-card p-6 border-t-4 border-t-[#b45309]">
            <div className="flex items-center justify-between pb-3 border-b border-[#efe7dc]">
              <h3 className="text-base font-bold text-[#17232e]">Ứng dụng thử nghiệm (/app)</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                Localhost Execution
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-xs sm:text-sm text-[#485966]">
              <li className="flex items-start space-x-2">
                <span className="text-[#b45309] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Môi trường thử nghiệm cục bộ:</strong> Tệp được gửi trực tiếp đến backend FastAPI chạy trên máy cá nhân của bạn (<code className="font-mono text-xs bg-[#efe7dc] px-1 py-0.5 rounded">localhost:8000</code>).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#b45309] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Cách ly &amp; Xóa tệp tạm trên đĩa:</strong> Tệp được lưu tạm vào thư mục cách ly (quarantine) nội bộ của máy chủ để tính mã băm SHA-256 và kích thước byte. Ngay sau khi hoàn tất tính toán, tệp gốc trong thư mục này được xóa bỏ khỏi đĩa.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#b45309] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Lưu trữ bộ nhớ in-memory (TTL 15 phút):</strong> Bản ghi kết quả phân tích chỉ được giữ trong bộ nhớ RAM của tiến trình backend và tự động hết hạn sau 15 phút, hoặc bị xóa ngay lập tức khi bạn nhấn nút <em>&ldquo;Xóa phiên phân tích&rdquo;</em>.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Honest Disclosure Boundaries Note */}
        <div className="mt-8 p-5 rounded-2xl bg-[#ffffff] border border-[#d8ccbc] shadow-sm text-xs sm:text-sm text-[#334155]">
          <h4 className="font-bold text-[#17232e] mb-1 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0f766e]"></span>
            <span>Thông tin về ranh giới kỹ thuật hiện tại:</span>
          </h4>
          <p className="leading-relaxed text-[#485966]">
            Chúng tôi không tuyên bố &ldquo;bảo mật tuyệt đối không thể xâm phạm&rdquo; hay &ldquo;không lưu giữ bất kỳ định danh nào&rdquo; ở mức độ chung chung. Mọi hành vi lưu trữ tạm thời, dọn dẹp tệp cách ly và giải phóng bộ nhớ được triển khai đúng theo mã nguồn hiện hành của backend local (tại <code className="font-mono text-xs bg-[#efe7dc] px-1 py-0.5 rounded">backend/app/</code>) và không gửi dữ liệu ra bất kỳ máy chủ từ xa nào. Parser media trên host process tiếp tục được giữ tắt (thời lượng hiển thị chưa phân tích, chưa kiểm tra giới hạn 60 giây) và Cổng An Toàn Bước 3 đang bảo lưu ở mức PARTIAL để chờ môi trường sandbox cô lập.
          </p>
        </div>
      </div>
    </section>
  );
};

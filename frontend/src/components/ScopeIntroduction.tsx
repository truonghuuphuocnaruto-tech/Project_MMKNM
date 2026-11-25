import React, { useState } from 'react';

export const ScopeIntroduction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      aria-labelledby="scope-heading"
      className="bg-slate-800/60 rounded-xl border border-slate-700/70 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <h2 id="scope-heading" className="text-base font-semibold text-slate-100">
            Giới thiệu &amp; Phạm vi hoạt động (Bản thử nghiệm v1)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="scope-details"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-slate-700/50 transition focus:ring-1 focus:ring-cyan-400"
        >
          {isOpen ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-300 leading-relaxed">
        Hệ thống được thiết kế theo kiến trúc tối giản, an toàn cục bộ. Trong phiên bản v1, hệ thống thực hiện đo lường
        các <strong className="text-white">thông số kỹ thuật tệp</strong> (SHA-256, dung lượng byte, MIME do trình duyệt khai báo)
        nhằm mục đích kiểm định tính toàn vẹn dữ liệu và cung cấp checklist khuyến nghị ứng phó tình huống lừa đảo.
      </p>

      {isOpen && (
        <div id="scope-details" className="mt-4 pt-4 border-t border-slate-700/60 space-y-3 text-xs sm:text-sm text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
              <p className="font-semibold text-cyan-300 mb-1">1. Thông số kỹ thuật thực tế</p>
              <p className="text-slate-400 text-xs">
                Tính SHA-256 theo từng khối, đo dung lượng và ghi lại MIME trình duyệt khai báo. Nội dung media chưa được xác minh.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
              <p className="font-semibold text-cyan-300 mb-1">2. Trạng thái phân tích AI</p>
              <p className="text-slate-400 text-xs">
                Mô hình học sâu AI chưa khả dụng trong v1. Hệ thống không tạo điểm số rủi ro ảo hay biểu đồ giả mạo.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
              <p className="font-semibold text-cyan-300 mb-1">3. Bảo vệ quyền riêng tư</p>
                <p className="text-slate-400 text-xs">
                  Tệp tạm có tên ngẫu nhiên trong thư mục quarantine; backend xóa ngay sau khi tính thông số. Thời lượng media (WAV, MP3, OGG, MP4, WebM) chỉ được đọc trong container sandbox cô lập, không chạy parser trên tiến trình host.
                </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200 text-xs flex items-start space-x-2">
            <span className="text-blue-400 text-base leading-none">ℹ</span>
            <p>
              <strong>Nguyên tắc đạo đức công nghệ:</strong> Để tránh gây hoang mang hoặc suy diễn sai lệch, hệ thống tuân thủ nghiêm ngặt nguyên tắc không hiển thị xác suất lừa đảo giả lập khi chưa có mô hình AI đã được thẩm định pháp y số.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

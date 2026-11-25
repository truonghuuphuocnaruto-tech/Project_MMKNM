import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/60 mt-12 py-8 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-slate-400 font-medium">
            AI Voice &amp; Video Scam Checker • Kiến trúc v1 tối giản cục bộ
          </p>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">Xử lý tạm thời (TTL 15 phút)</span>
              <span>•</span>
            <span className="text-slate-400">Cách ly tệp tạm thời</span>
            <span>•</span>
            <span className="text-slate-400">Không gửi dữ liệu ra ngoài</span>
          </div>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed text-center sm:text-left">
          Tuân thủ nguyên tắc bảo vệ quyền riêng tư theo tài liệu kỹ thuật dự án. Tệp tin tải lên chỉ phục vụ tính toán mã băm SHA-256 và đo lường thông số kỹ thuật thực tế trong phiên làm việc hiện tại, tự động dọn dẹp hoặc xóa ngay khi người dùng nhấn nút xóa phiên.
        </p>
      </div>
    </footer>
  );
};

import React from 'react';

interface StoryFooterProps {
  onNavigate: (to: string) => void;
}

export const StoryFooter: React.FC<StoryFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#17232e] text-[#cbd5e1] border-t border-[#334155] pt-14 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Big CTA Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0f766e] via-[#115e59] to-[#134e4a] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-[#2dd4bf]/30">
          <div className="max-w-2xl text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-100 border border-white/20 mb-3">
              Môi trường thử nghiệm cục bộ
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Sẵn sàng trải nghiệm giao diện phân tích?
            </h3>
            <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
              Truy cập ứng dụng thử nghiệm tải tệp media, kiểm tra mã băm SHA-256, xem các cues minh họa và thực hành quy trình xóa phiên tại máy cục bộ.
            </p>
            <p className="mt-3 text-xs text-teal-200/80 font-mono">
              Yêu cầu: Máy chủ backend FastAPI đang lắng nghe tại http://localhost:8000
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/app')}
              className="px-6 py-4 text-sm font-bold text-[#17232e] bg-white hover:bg-teal-50 active:bg-teal-100 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center space-x-2"
            >
              <span>Mở bản demo local (/app)</span>
              <svg className="w-4 h-4 text-[#0f766e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Official Sources & References */}
        <div className="border-t border-[#334155] pt-10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-4">
            Tài liệu nguồn tham khảo phòng chống lừa đảo trực tuyến tại Việt Nam
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#94a3b8]">
            <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]/80 hover:border-[#0f766e] transition">
              <a
                href="https://khonggianmang.vn/cam-nang-nhan-dien-va-phong-chong-lua-dao-truc-tuyen"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#2dd4bf] flex items-center space-x-1.5"
              >
                <span>Cục An toàn thông tin - Cổng Không gian mạng Quốc gia</span>
                <span className="text-[10px] text-[#2dd4bf]">↗</span>
              </a>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Cẩm nang nhận diện và phòng chống lừa đảo trực tuyến — Tổng hợp các hình thức lừa đảo phổ biến và khuyến cáo ngắt tương tác để tự xác minh qua kênh độc lập.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]/80 hover:border-[#0f766e] transition">
              <a
                href="https://bocongan.gov.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#2dd4bf] flex items-center space-x-1.5"
              >
                <span>Cổng thông tin điện tử Bộ Công an</span>
                <span className="text-[10px] text-[#2dd4bf]">↗</span>
              </a>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Cảnh báo thủ đoạn mạo danh cơ quan tư pháp — Khuyến cáo người dân cảnh giác trước các cuộc gọi đe dọa, không chuyển tiền vào tài khoản tạm giữ và tự xác minh qua số điện thoại chính thức hoặc trụ sở công an.
              </p>
            </div>
          </div>
        </div>

        {/* Institutional Independence & Disclaimer Box */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#334155] text-xs text-[#94a3b8] leading-relaxed">
          <strong className="text-amber-400 font-bold block mb-1 uppercase tracking-wide text-[11px]">
            Tuyên bố miễn trừ trách nhiệm &amp; Tính độc lập:
          </strong>
          <p>
            Debunk là dự án nghiên cứu và công cụ giáo dục an toàn số mã nguồn mở độc lập. Dự án tham khảo và phổ biến lại các cẩm nang hướng dẫn phòng chống lừa đảo chính thức nêu trên nhằm mục đích nâng cao nhận thức cộng đồng. Dự án <strong>KHÔNG đại diện, KHÔNG trực thuộc và KHÔNG được chứng nhận hay bảo trợ bởi Cục An toàn thông tin, Bộ Công an hay bất kỳ cơ quan quản lý nhà nước nào</strong>.
          </p>
        </div>

        {/* Bottom copyright & project info */}
        <div className="border-t border-[#334155] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748b] gap-3">
          <div>
            <span>© 2026 Debunk. Giấy phép mã nguồn mở MIT.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Thiết kế thuần SVG/CSS không phụ thuộc asset ngoài</span>
            <span>•</span>
              <button
                type="button"
                onClick={() => {
                  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
                }}
                className="text-[#94a3b8] hover:text-white"
              >
                Về đầu trang ↑
              </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

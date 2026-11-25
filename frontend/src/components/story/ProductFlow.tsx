import React from 'react';

interface ProductFlowProps {
  onNavigate: (to: string) => void;
}

export const ProductFlow: React.FC<ProductFlowProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '1',
      title: 'Tải tệp cục bộ an toàn',
      badge: 'Localhost Only',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Tệp âm thanh (.wav, .mp3, .ogg) hoặc video (.mp4, .webm) chỉ được gửi trực tiếp tới máy chủ backend chạy trên máy của bạn (http://localhost:8000). Không có dữ liệu nào bị chuyển tiếp ra internet.',
    },
    {
      num: '2',
      title: 'Đo lường thông số kỹ thuật thực tế',
      badge: 'Đo thật theo Bytes',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      desc: 'Hệ thống tính toán kích thước byte thực tế và tạo mã băm mật mã SHA-256 đóng vai trò dấu vân tay số nguyên vẹn của bằng chứng. Tệp tạm được cách ly trong thư mục nội bộ và xóa ngay sau khi băm.',
    },
    {
      num: '3',
      title: 'Minh họa các góc độ giám định (Demo Cues)',
      badge: 'Dữ liệu mẫu giáo dục',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      desc: 'Trực quan hóa các dấu hiệu cảnh báo tiềm năng (như biến dạng phổ âm thanh, méo tiếng cơ học, khuôn mặt thiếu tự nhiên) để giúp người học hiểu cách các hệ thống phân tích đa tầng vận hành.',
    },
    {
      num: '4',
      title: 'Checklist hành động & Xóa phiên an toàn',
      badge: 'Tự chủ dữ liệu',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      desc: 'Cung cấp hướng dẫn hành động tức thì để bảo vệ tài khoản ngân hàng. Người dùng có quyền bấm "Xóa phiên" để loại bỏ ngay lập tức bản ghi kết quả khỏi bộ nhớ RAM của backend.',
    },
  ];

  return (
    <section id="cong-cu" className="py-16 sm:py-20 border-b border-[#e6dcce] bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f766e] bg-[#ccfbf1] border border-[#99f6e4] rounded-full mb-3">
            Kiến trúc công cụ demo
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            Công cụ hỗ trợ bạn những gì trong bản demo local?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Chúng tôi xây dựng quy trình tiếp nhận và đánh giá tệp minh bạch, tuân thủ nghiêm ngặt nguyên tắc an toàn dữ liệu và ranh giới trung thực kỹ thuật.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((st) => (
            <div key={st.num} className="story-card p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#efe7dc]">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm">
                      {st.num}
                    </span>
                    <h3 className="text-base font-bold text-[#17232e]">{st.title}</h3>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${st.badgeColor}`}>
                    {st.badge}
                  </span>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-[#485966] leading-relaxed">
                  {st.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#efe7dc] text-[11px] text-[#6b7d8c] flex items-center justify-between">
                <span>Môi trường thực thi:</span>
                <span className="font-mono text-[#0f766e] font-semibold">Localhost (Port 8000)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Try demo link CTA */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => onNavigate('/app')}
            className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-[#0f766e] hover:bg-[#115e59] rounded-xl shadow-sm hover:shadow transition"
          >
            <span>Trải nghiệm trực tiếp tại /app</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

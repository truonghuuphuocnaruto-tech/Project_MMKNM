import React from 'react';

interface HeroSceneProps {
  onNavigate: (to: string) => void;
}

export const HeroScene: React.FC<HeroSceneProps> = ({ onNavigate }) => {
  return (
    <section className="py-14 sm:py-20 border-b border-[#e6dcce] relative overflow-hidden bg-gradient-to-b from-[#faf7f2] via-[#f7f3eb] to-[#f4eee2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badges bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e6dcce]/60 text-[#485966] border border-[#d8ccbc]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] mr-2"></span>
            Nghiên cứu giáo dục an toàn số
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
            Bản thử nghiệm cục bộ (Local Demo v1)
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]">
            100% Client/Localhost — Không gửi file ra ngoài
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#17232e] tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Trước khi tin một cuộc gọi, <br className="hidden sm:inline" />
          <span className="text-[#0f766e] underline decoration-[#0f766e]/30 underline-offset-8">
            hãy dừng một nhịp.
          </span>
        </h1>

        {/* Calm lead paragraph */}
        <p className="mt-6 text-base sm:text-xl text-[#485966] max-w-3xl mx-auto leading-relaxed">
          Kẻ mạo danh có thể mô phỏng giọng nói hoặc nét mặt của người thân, cơ quan công quyền để tạo ra tình thế cấp bách. Nhưng áp lực tâm lý chỉ có hiệu lực khi bạn phản ứng vội vã. Hãy dành ra 5 phút để xác minh độc lập.
        </p>

        {/* Call to action buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => onNavigate('#tinh-huong')}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-[#17232e] bg-[#ffffff] hover:bg-[#efe7dc] border border-[#d8ccbc] rounded-xl shadow-sm hover:shadow transition flex items-center justify-center space-x-2"
          >
            <span>Nhận diện bẫy tâm lý</span>
            <svg className="w-4 h-4 text-[#0f766e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/app')}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-[#0f766e] hover:bg-[#115e59] active:bg-[#134e4a] rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>Mở bản demo local (/app)</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Sub-note with clear boundary */}
        <div className="mt-5 text-xs text-[#6b7d8c] flex items-center justify-center space-x-1.5">
          <svg className="w-4 h-4 text-[#b45309] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Bản demo local yêu cầu dịch vụ backend đang chạy tại <code className="bg-[#e6dcce]/60 px-1.5 py-0.5 rounded font-mono text-[#17232e]">localhost:8000</code>.
          </span>
        </div>
      </div>
    </section>
  );
};

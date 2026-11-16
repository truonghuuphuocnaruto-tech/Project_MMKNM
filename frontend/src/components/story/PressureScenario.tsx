import React from 'react';

export const PressureScenario: React.FC = () => {
  return (
    <section id="tinh-huong" className="py-16 sm:py-20 border-b border-[#e6dcce] bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title & Fiction badge */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#991b1b] bg-[#fee2e2] border border-[#fca5a5] rounded-full mb-3">
            [Tình huống hư cấu minh họa — Mục đích huấn luyện nhận thức]
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            Cách một cuộc gọi lừa đảo dồn ép bạn
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Kẻ tấn công không cần một bản deepfake hoàn hảo không tì vết. Chúng chỉ cần tạo ra đủ sự bất ngờ và hoảng loạn để tước đi phản xạ kiểm chứng thông thường của bạn.
          </p>
        </div>

        {/* Fictional Call Card Simulation */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Mock Call Interface */}
          <div className="lg:col-span-5 bg-[#ffffff] border border-[#d8ccbc] rounded-2xl p-5 sm:p-6 shadow-md relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#efe7dc]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#e2e8f0] flex items-center justify-center text-xl font-bold text-[#475569] border border-[#cbd5e1]">
                  👤
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#0f172a] flex items-center space-x-1.5">
                      <span>Người quen (Mạo danh)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold whitespace-nowrap shrink-0">Giả lập</span>
                    </h3>
                  <p className="text-xs text-[#64748b]">Cuộc gọi video ngắn (3 giây) rồi ngắt kết nối</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#dc2626] font-bold animate-pulse">00:03</span>
            </div>

            {/* Simulated transcript snippet */}
            <div className="mt-4 space-y-3 font-mono text-xs text-[#334155] bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0]">
              <div className="flex items-start space-x-2">
                <span className="text-rose-600 font-bold shrink-0">[Giọng nói giả lập]:</span>
                <p className="italic font-sans text-xs text-rose-950 font-medium">
                  &ldquo;Mẹ ơi! Con đang bị tai nạn ở cổng trường, công an đang giữ xe, phải đóng viện phí gấp 30 triệu trong 15 phút nếu không bác sĩ không phẫu thuật...&rdquo;
                </p>
              </div>
              <div className="border-t border-[#e2e8f0] pt-2 text-[11px] text-[#64748b] font-sans">
                → Hình ảnh cố tình làm mờ nhiễu hạt, sau đó lập tức tắt màn hình viện cớ &ldquo;mạng chập chờn&rdquo; rồi chuyển sang thúc giục qua tin nhắn.
              </div>
            </div>

            {/* Visual warning cues inside card */}
            <div className="mt-4 pt-3 border-t border-[#efe7dc] flex items-center justify-between text-xs text-[#485966]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#dc2626]"></span>
                <span>Số điện thoại: <strong>Không hiển thị SIM</strong></span>
              </span>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Áp lực thời gian: Cực cao
              </span>
            </div>
          </div>

          {/* Three Psychological Levers breakdown */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-bold text-[#17232e] mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-[#0f766e] text-white flex items-center justify-center text-xs">!</span>
              <span>3 đòn bẩy tâm lý thường thấy trong các kịch bản lừa đảo</span>
            </h3>

            {/* Lever 1 */}
            <div className="bg-[#ffffff] border border-[#e6dcce] rounded-xl p-4 transition hover:border-[#0f766e]">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#b45309] font-bold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17232e]">Tạo áp lực khẩn cấp nhân tạo (Artificial Urgency)</h4>
                  <p className="mt-1 text-xs sm:text-sm text-[#485966] leading-relaxed">
                    Kẻ gian luôn đặt ra hạn định gắt gao (&ldquo;trong 10 - 15 phút&rdquo;, &ldquo;ngay bây giờ&rdquo;) để não bộ rơi vào trạng thái hoảng sợ (fight-or-flight), chặn đứng khả năng suy nghĩ logic và kiểm tra lại.
                  </p>
                </div>
              </div>
            </div>

            {/* Lever 2 */}
            <div className="bg-[#ffffff] border border-[#e6dcce] rounded-xl p-4 transition hover:border-[#0f766e]">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#fee2e2] text-[#b91c1c] font-bold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17232e]">Bắt buộc giữ bí mật &amp; Cô lập nạn nhân (Isolation)</h4>
                  <p className="mt-1 text-xs sm:text-sm text-[#485966] leading-relaxed">
                    Viện cớ &ldquo;bí mật chuyên án điều tra&rdquo; hoặc &ldquo;người thân dặn không được cho ai biết&rdquo; để ngăn bạn trao đổi với người khác hoặc xin tư vấn từ bạn bè, ngân hàng.
                  </p>
                </div>
              </div>
            </div>

            {/* Lever 3 */}
            <div className="bg-[#ffffff] border border-[#e6dcce] rounded-xl p-4 transition hover:border-[#0f766e]">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#ccfbf1] text-[#0f766e] font-bold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17232e]">Làm mờ giác quan &amp; Rút lui nhanh (Sensory Distortion)</h4>
                  <p className="mt-1 text-xs sm:text-sm text-[#485966] leading-relaxed">
                    Video deepfake thường cố ý tạo hiệu ứng nhòe, chập chờn, chỉ nhấp nháy vài giây rồi tắt để bạn chỉ kịp nhận ra &ldquo;đúng là giọng nói/mặt người quen&rdquo; mà không kịp nhận thấy các lỗi đồ họa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Takeaway box */}
        <div className="mt-8 p-4 rounded-xl bg-[#f4eee2] border border-[#d8ccbc] text-[#17232e] text-xs sm:text-sm flex items-start space-x-3">
          <span className="text-lg shrink-0">💡</span>
          <div>
            <strong className="font-bold text-[#0f766e]">Nguyên tắc cốt lõi: </strong>
            <span>
              Đừng cố căng mắt nhìn xem môi có lệch hay mắt có chớp đều. Khuyến nghị an toàn chính thức chỉ ra rằng kẻ tấn công đánh vào <strong>tâm lý hoảng sợ</strong>. Biện pháp phòng vệ hiệu quả nhất không phải là đoán hình ảnh, mà là <strong>ngắt kết nối và gọi lại theo kênh độc lập</strong>.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

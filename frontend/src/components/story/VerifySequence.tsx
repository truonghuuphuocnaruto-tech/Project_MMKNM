import React, { useState, useEffect, useRef } from 'react';

export const VerifySequence: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      step: '01',
      title: 'DỪNG LẠI',
      subtitle: 'Tạm dừng phản ứng tức thì & Ngắt tương tác',
      color: 'border-[#b45309] text-[#b45309] bg-[#fef3c7]',
      accentBg: 'bg-[#b45309]',
      description:
        'Hít sâu một nhịp và chủ động kết thúc cuộc gọi. Kẻ gian thường tìm cách duy trì cuộc gọi liên tục để khống chế tâm lý bạn. Việc ngắt máy hoàn toàn không làm phát sinh rủi ro pháp lý hay y tế nào như lời đe dọa.',
      bulletPoints: [
        'Không chuyển bất kỳ khoản tiền nào dù chỉ 1 đồng trong lúc nghe máy.',
        'Không cung cấp mã OTP, mật khẩu tài khoản ngân hàng hoặc số định danh cá nhân.',
        'Tuyệt đối không truy cập các đường link lạ hoặc quét mã QR gửi kèm.',
      ],
    },
    {
      step: '02',
      title: 'GỌI LẠI KÊNH ĐÃ BIẾT',
      subtitle: 'Sử dụng kênh liên lạc truyền thống (Out-of-band)',
      color: 'border-[#0f766e] text-[#0f766e] bg-[#ccfbf1]',
      accentBg: 'bg-[#0f766e]',
      description:
        'Không nhấn nút gọi lại trên ứng dụng mạng xã hội vừa liên lạc vì tài khoản có thể đã bị chiếm quyền kiểm soát (hack/clone). Hãy mở ứng dụng điện thoại thông thường để gọi trực tiếp.',
      bulletPoints: [
        'Gọi trực tiếp vào số điện thoại viễn thông (SIM) đã lưu trong danh bạ trước đó.',
        'Hỏi các câu hỏi riêng tư mà chỉ người thân thực sự mới biết câu trả lời (câu hỏi bí mật gia đình).',
        'Lưu ý: Không dùng các yêu cầu như "vẫy tay, quay mặt" vì deepfake real-time có thể qua mặt.',
      ],
    },
    {
      step: '03',
      title: 'XÁC NHẬN ĐỘC LẬP',
      subtitle: 'Kiểm chứng qua bên thứ ba và cơ quan chức năng',
      color: 'border-[#1e40af] text-[#1e40af] bg-[#dbeafe]',
      accentBg: 'bg-[#1e40af]',
      description:
        'Nếu số điện thoại của người thân không liên lạc được, hãy kiểm chứng chéo qua các mối quan hệ thân cận khác hoặc đối chiếu quy trình làm việc chuẩn của cơ quan chức năng.',
      bulletPoints: [
        'Liên hệ ngay với người thân khác trong gia đình, đồng nghiệp, giáo viên hoặc bạn cùng phòng.',
        'Cơ quan Công an, Viện kiểm sát, Tòa án KHÔNG làm việc qua điện thoại và KHÔNG yêu cầu chuyển tiền vào "tài khoản an toàn/tài khoản tạm giữ".',
        'Nếu còn nghi ngờ, hãy đến trực tiếp trụ sở Công an phường/xã hoặc chi nhánh ngân hàng gần nhất.',
      ],
    },
  ];

  useEffect(() => {
    // Reveal and step advancement via intersection observer
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // cycle or set step
            setActiveStep((prev) => (prev === 0 ? 0 : prev));
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="cach-xu-ly" className="py-16 sm:py-24 border-b border-[#e6dcce] bg-[#f7f3eb] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" ref={containerRef}>
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f766e] bg-[#ccfbf1] border border-[#99f6e4] rounded-full mb-3">
            Quy trình xác minh an toàn
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            DỪNG → GỌI LẠI KÊNH ĐÃ BIẾT → XÁC NHẬN ĐỘC LẬP
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Khi công nghệ giả mạo trở nên tinh vi hơn, lớp phòng vệ đáng tin cậy nhất chính là <strong>thay đổi kênh giao tiếp</strong> ra khỏi phạm vi kẻ tấn công đang kiểm soát.
          </p>
        </div>

        {/* Interactive Step Switcher Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-4" role="tablist" aria-label="Các bước xử lý">
          {steps.map((item, idx) => (
            <button
              key={item.step}
              role="tab"
              aria-selected={activeStep === idx}
              aria-controls={`step-panel-${idx}`}
              id={`step-tab-${idx}`}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2.5 border ${
                activeStep === idx
                  ? 'bg-[#ffffff] text-[#17232e] border-[#0f766e] shadow-md ring-2 ring-[#0f766e]/20'
                  : 'bg-[#faf7f2] text-[#485966] border-[#e6dcce] hover:bg-[#ffffff] hover:border-[#cbd5e1]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                  activeStep === idx ? 'bg-[#0f766e]' : 'bg-[#94a3b8]'
                }`}
              >
                {item.step}
              </span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* Narrative Step Content Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={item.step}
                id={`step-panel-${idx}`}
                role="tabpanel"
                aria-labelledby={`step-tab-${idx}`}
                className={`story-card p-6 flex flex-col justify-between transition duration-300 relative ${
                  isSelected
                    ? 'border-2 border-[#0f766e] shadow-lg bg-[#ffffff] scale-[1.02]'
                    : 'border border-[#e6dcce] bg-[#ffffff]/80 opacity-90 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Step header tag */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#efe7dc]">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${item.color}`}>
                      BƯỚC {item.step}
                    </span>
                    <span className="text-xs text-[#6b7d8c] font-medium">Hành động cốt lõi</span>
                  </div>

                  {/* Title & subtitle */}
                  <h3 className="mt-4 text-lg font-black text-[#17232e] tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#0f766e]">{item.subtitle}</p>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-[#485966] leading-relaxed">{item.description}</p>

                  {/* Bullet checklist */}
                  <ul className="mt-4 space-y-2 border-t border-[#efe7dc] pt-3 text-xs text-[#334155]">
                    {item.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx} className="flex items-start space-x-2">
                        <span className="text-[#0f766e] font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-tight">{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card footer indicator */}
                <div className="mt-6 pt-3 border-t border-[#efe7dc] flex items-center justify-between text-[11px] text-[#6b7d8c]">
                  <span>Trạng thái kiểm chứng:</span>
                  <span className="font-semibold text-[#17232e]">Bắt buộc thực hiện</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendation caveat box */}
        <div className="mt-10 p-5 rounded-2xl bg-[#ffffff] border border-[#cbd5e1] shadow-sm text-xs sm:text-sm text-[#334155] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <strong className="text-[#0f172a] font-bold">Lưu ý quan trọng về cử động thị giác:</strong>
              <p className="mt-0.5 text-xs text-[#475569] leading-relaxed">
                Nhiều người truyền miệng cách yêu cầu người gọi &ldquo;quay mặt sang trái, sang phải hoặc vẫy tay&rdquo; trước camera để xem có lỗi render deepfake không. Các chuyên gia an toàn thông tin cảnh báo: với công nghệ hiện nay, <strong>đây không phải phép thử an toàn</strong>. Chỉ có <strong>xác minh kênh độc lập</strong> mới có giá trị khẳng định.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('cong-cu');
              if (el) {
                const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
              }
            }}
            className="shrink-0 text-xs font-bold text-[#0f766e] hover:underline"
          >
            Xem công cụ hỗ trợ gì ↓
          </button>
        </div>
      </div>
    </section>
  );
};

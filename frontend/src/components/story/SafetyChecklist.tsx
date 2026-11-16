import React, { useState } from 'react';

export const SafetyChecklist: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  const checklistItems = [
    {
      id: 'item-1',
      action: 'Dừng lại ít nhất 5 phút',
      detail:
        'Cắt đứt ngay luồng cảm xúc hoảng loạn do kẻ gian cố ý tạo ra. Bất kỳ yêu cầu nào ép chuyển tiền trong vòng 10-15 phút đều là dấu hiệu đỏ của hành vi lừa đảo.',
      why: 'Kẻ lừa đảo không thể tiếp tục thao túng nếu bạn thoát khỏi trạng thái hoảng loạn.',
    },
    {
      id: 'item-2',
      action: 'Gọi lại số điện thoại đã lưu trong SIM',
      detail:
        'Không bấm nút gọi lại trên ứng dụng mạng xã hội (Zalo, Messenger, Telegram). Hãy thoát ra, mở danh bạ điện thoại thông thường và bấm số SIM quen thuộc của người đó.',
      why: 'Tài khoản mạng xã hội có thể bị chiếm quyền (hack), nhưng số điện thoại vật lý rất khó bị giả lập khi nhận cuộc gọi đến.',
    },
    {
      id: 'item-3',
      action: 'Xác minh qua kênh thứ hai độc lập',
      detail:
        'Hỏi ý kiến của một người thân khác trong gia đình, đồng nghiệp, hoặc gọi trực tiếp đến tổng đài chăm sóc khách hàng chính thức của ngân hàng hoặc hotline Công an địa phương.',
      why: 'Người thứ ba ở trạng thái tâm lý bình tĩnh sẽ nhận diện bẫy lừa đảo rõ ràng hơn nạn nhân đang chịu áp lực.',
    },
    {
      id: 'item-4',
      action: 'Tuyệt đối không làm theo hướng dẫn cài đặt lạ',
      detail:
        'Không cài đặt các ứng dụng từ tệp lạ (.apk), không truy cập website do người gọi cung cấp, không quét mã QR nhận tiền và tuyệt đối không chia sẻ mã OTP hoặc mật khẩu ngân hàng.',
      why: 'Cơ quan chức năng và ngân hàng không bao giờ yêu cầu người dân cài ứng dụng ngoài kho App Store/Google Play hay cung cấp mã OTP.',
    },
  ];

  const handleToggle = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <section id="checklist" className="py-16 sm:py-20 border-b border-[#e6dcce] bg-[#faf7f2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f766e] bg-[#ccfbf1] border border-[#99f6e4] rounded-full mb-3">
            Cẩm nang tự bảo vệ
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            Checklist 4 hành động trước khi chuyển tiền
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Hãy biến 4 bước này thành phản xạ tự nhiên của bạn và người thân trước bất kỳ cuộc gọi nào yêu cầu hỗ trợ tài chính khẩn cấp.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 p-4 bg-[#ffffff] border border-[#e6dcce] rounded-xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#17232e]">Tiến độ ghi nhớ:</span>
            <span className="font-semibold text-[#0f766e]">
              Đã kiểm tra {completedCount} / {checklistItems.length} việc
            </span>
          </div>
          <div className="w-32 bg-[#e6dcce] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0f766e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Checklist cards */}
        <div className="mt-6 space-y-4">
          {checklistItems.map((item, idx) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-[#f0fdfa] border-[#0f766e] shadow-sm'
                    : 'bg-[#ffffff] border-[#e6dcce] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition mt-0.5 ${
                      isChecked
                        ? 'bg-[#0f766e] border-[#0f766e] text-white'
                        : 'border-[#cbd5e1] bg-white'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm sm:text-base font-bold transition ${
                          isChecked ? 'text-[#0f766e]' : 'text-[#17232e]'
                        }`}
                      >
                        {idx + 1}. {item.action}
                      </h3>
                      {isChecked && (
                        <span className="text-[11px] font-semibold text-[#0f766e] bg-[#ccfbf1] px-2 py-0.5 rounded">
                          Đã nắm rõ
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#485966] leading-relaxed">
                      {item.detail}
                    </p>
                    <div className="mt-3 text-xs text-[#0f766e] bg-[#ffffff] p-2.5 rounded-lg border border-[#e6dcce] inline-block">
                      <strong>Vì sao:</strong> {item.why}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import React from 'react';

export const DemoLimitations: React.FC = () => {
  const boundaries = [
    {
      label: 'Bản thử nghiệm giáo dục (DEMO)',
      status: 'DEMO V1',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-300',
      detail:
        'Giao diện web hiện tại là bản nguyên mẫu v1 phục vụ mục đích kiểm thử tương tác kỹ thuật và nâng cao nhận thức cộng đồng. Ứng dụng chưa được triển khai như một dịch vụ thương mại hay hệ thống giám định tự động.',
    },
    {
      label: 'Chưa phát hiện Deepfake bằng AI thật',
      status: 'CHƯA TÍCH HỢP MODEL',
      statusClass: 'bg-rose-100 text-rose-800 border-rose-300',
      detail:
        'Hệ thống hiện tại HOÀN TOÀN CHƯA tích hợp các mô hình suy luận học sâu (như AASIST, RawNet hay Deepfake video detectors). Tuyệt đối không sử dụng kết quả từ bản demo để khẳng định một người có hành vi lừa đảo hay kết luận tệp media là giả mạo.',
    },
    {
      label: 'Các chỉ số Cues là nội dung minh họa tĩnh',
      status: 'MOCK CUES',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-300',
      detail:
        'Danh sách các dấu hiệu (cues) xuất hiện trong báo cáo phân tích là dữ liệu giáo dục mẫu được định nghĩa sẵn nhằm mô tả các phương diện kiểm tra, KHÔNG PHẢI là kết quả suy luận từ nội dung âm thanh/video do bạn tải lên.',
    },
    {
      label: 'Trình phân tích media chạy cô lập trong sandbox (WAV, MP3, OGG, MP4, WebM)',
      status: 'SANDBOX: ACTIVE',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      detail:
        'Trình trích xuất thời lượng media được kích hoạt chạy cô lập 100% bên trong container sandbox Podman Rootless (với 7 lớp phòng vệ an ninh, kiểm chứng giới hạn 60s cho cả Voice & Video) thay vì chạy trên tiến trình host. Định dạng không hợp lệ hoặc vượt giới hạn bị từ chối nghiêm ngặt.',
    },
    {
      label: 'Ranh giới an toàn Bước 3 & Bước 4 Model CHƯA BẮT ĐẦU',
      status: 'BƯỚC 3: XÁC MINH',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      detail:
        'Cơ chế container sandbox đã được kiểm chứng trên runtime Podman Rootless. Tuy nhiên, Bước 4 (mô hình AI phân tích deepfake) hoàn toàn CHƯA BẮT ĐẦU và không tải bất kỳ tệp weights hay dataset nào vào repository.',
    },
  ];

  return (
    <section id="gioi-han" className="py-16 sm:py-20 border-b border-[#e6dcce] bg-[#fdfbf7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#b45309] bg-[#fef3c7] border border-[#fde68a] rounded-full mb-3">
            Ranh giới trung thực kỹ thuật
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17232e] tracking-tight">
            Những điều bản demo hiện tại CHƯA làm
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#485966] leading-relaxed">
            Chúng tôi cam kết công khai minh bạch 100% về năng lực thực tế của phần mềm, nói không với việc phóng đại tính năng AI hay gây nhầm lẫn cho người sử dụng.
          </p>
        </div>

        {/* Warning card list */}
        <div className="mt-10 space-y-4 max-w-4xl mx-auto">
          {boundaries.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#ffffff] border border-[#e6dcce] shadow-sm hover:border-[#b45309] transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#efe7dc]">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] shrink-0"></span>
                  <h3 className="text-sm sm:text-base font-bold text-[#17232e]">{item.label}</h3>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border self-start sm:self-auto ${item.statusClass}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#485966] leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Big Alert Disclaimer Box */}
        <div className="mt-8 max-w-4xl mx-auto p-5 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] flex items-start space-x-3 text-xs sm:text-sm">
          <span className="text-xl shrink-0 mt-0.5">🛑</span>
          <div>
            <strong className="font-bold text-[#7f1d1d] block mb-1">
              Khuyến cáo quan trọng về quyết định pháp lý và tài chính:
            </strong>
            <p className="text-[#991b1b] leading-relaxed">
              Mọi quyết định chuyển tiền, khai báo thông tin cá nhân hoặc trình báo cơ quan công an cần dựa trên việc <strong>xác minh thực tế qua kênh điện thoại chính thống hoặc gặp mặt trực tiếp</strong>. Không bao giờ lấy kết quả của bất kỳ phần mềm thử nghiệm nào để làm căn cứ miễn trừ việc tự xác minh độc lập.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

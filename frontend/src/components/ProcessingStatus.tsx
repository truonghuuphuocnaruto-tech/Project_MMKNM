import React from 'react';

interface ProcessingStatusProps {
  currentStage: string;
  progressPercent?: number;
  onCancel?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStage,
  progressPercent = 45,
  onCancel,
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="p-6 rounded-xl bg-slate-800/80 border border-cyan-800/50 shadow-xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Đang xử lý tệp &amp; Đo lường thông số kỹ thuật
            </h3>
            <p className="text-xs text-cyan-300 font-mono mt-0.5">{currentStage}</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition"
          >
            Hủy bỏ
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(10, progressPercent))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Tiếp nhận &amp; Cách ly</span>
          <span>Tính toán mã băm SHA-256</span>
          <span>Trích xuất thông số</span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs text-slate-300 space-y-1">
        <p className="font-medium text-slate-200">Quy trình demo local đang thực thi:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-0.5 pl-1">
          <li>Tệp được lưu vào thư mục cách ly tạm thời (quarantine)</li>
          <li>Đọc từng khối nhị phân để tính mã băm SHA-256</li>
          <li>Đo thời lượng WAV tối đa 60 giây bằng thư viện chuẩn; định dạng khác không được giải mã</li>
        </ul>
      </div>
    </section>
  );
};

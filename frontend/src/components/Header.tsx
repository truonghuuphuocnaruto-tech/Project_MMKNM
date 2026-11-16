import React from 'react';

interface HeaderProps {
  backendOnline: boolean | null;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ backendOnline, onRefreshHealth }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Voice &amp; Video Scam Checker
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1 Local Demo
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sàng lọc rủi ro tệp đa phương tiện &amp; Giáo dục phòng chống lừa đảo mạo danh
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onRefreshHealth}
            title="Kiểm tra kết nối backend"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
            aria-label="Trạng thái kết nối máy chủ backend"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                  : backendOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-300">
              {backendOnline === true
                ? 'Backend: Sẵn sàng'
                : backendOnline === false
                ? 'Backend: Ngắt kết nối'
                : 'Đang kiểm tra...'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

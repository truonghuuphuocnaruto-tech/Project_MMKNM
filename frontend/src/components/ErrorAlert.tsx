import React from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-4 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-200 shadow-md space-y-3"
    >
      <div className="flex items-start space-x-3">
        <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
          !
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-rose-100">{title}</h3>
          <p className="mt-1 text-xs sm:text-sm text-rose-200/90 leading-relaxed break-words">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Đóng thông báo lỗi"
            className="text-rose-400 hover:text-white text-sm font-bold px-1.5 py-0.5 rounded hover:bg-rose-900/50"
          >
            ✕
          </button>
        )}
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 transition"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

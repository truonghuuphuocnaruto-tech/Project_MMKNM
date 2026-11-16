import React, { useRef, useState, DragEvent, ChangeEvent, KeyboardEvent } from 'react';
import { formatBytes } from '../utils/formatters';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.mp4', '.webm'];
const ALLOWED_MIME_PREFIXES = ['audio/', 'video/'];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  isLoading,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Tệp vượt quá giới hạn 15MB cho phép (${formatBytes(file.size)}). Vui lòng chọn tệp nhỏ hơn 15MB.`;
    }

    if (file.size === 0) {
      return 'Tệp rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.';
    }

    // Check extension
    const nameLower = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    const hasAllowedMime = ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));

    if (!hasAllowedExt && !hasAllowedMime) {
      return `Định dạng tệp không được hỗ trợ. Chỉ chấp nhận tệp âm thanh (.mp3, .wav, .ogg) hoặc video (.mp4, .webm).`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setClientError(null);
    const error = validateFile(file);
    if (error) {
      setClientError(error);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleBoxKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFile && !clientError) {
      onFileSelected(selectedFile);
    }
  };

  const handleClearSelected = () => {
    setSelectedFile(null);
    setClientError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section aria-labelledby="upload-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="upload-heading" className="text-base sm:text-lg font-semibold text-white">
          Khu vực tải lên tệp âm thanh / video
        </h2>
        <span className="text-xs text-slate-400">
          Giới hạn: <strong className="text-cyan-400">Tối đa 15 MB</strong>
        </span>
      </div>

      <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Hàng đợi bảo vệ ASGI: <strong>Tối đa 3 tải lên đồng thời</strong> để bảo toàn I/O hệ thống.</span>
        </div>
        <span className="text-slate-400 text-[11px]">Tự động điều tiết (429) &amp; ngắt kết nối an toàn khi quá tải.</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        accept=".mp3,.wav,.ogg,.mp4,.webm,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm"
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled || isLoading}
        aria-label="Chọn tệp âm thanh hoặc video tải lên"
      />

      <div
        tabIndex={disabled || isLoading ? -1 : 0}
        role="button"
        aria-label="Khu vực kéo thả tệp. Nhấn phím Enter hoặc Phím cách để duyệt tệp từ thiết bị"
        onKeyDown={handleBoxKeyDown}
        onClick={() => !isLoading && !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
        } ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-sm sm:text-base font-medium text-slate-200">
              Kéo thả tệp vào đây hoặc{' '}
              <span className="text-cyan-400 underline underline-offset-2">duyệt từ thiết bị</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Định dạng hỗ trợ: Âm thanh (<code className="text-cyan-300">.mp3</code>,{' '}
              <code className="text-cyan-300">.wav</code>, <code className="text-cyan-300">.ogg</code>) | Video (
              <code className="text-cyan-300">.mp4</code>, <code className="text-cyan-300">.webm</code>)
            </p>
          </div>
        </div>
      </div>

      {clientError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs sm:text-sm flex items-start space-x-2"
        >
          <span className="text-rose-400 font-bold">✕</span>
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Tệp không hợp lệ:</p>
            <p>{clientError}</p>
          </div>
        </div>
      )}

      {selectedFile && !clientError && (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3 overflow-hidden">
              <span className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-mono">
                {selectedFile.type.startsWith('video/') ? 'VIDEO' : 'AUDIO'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  Kích thước: {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString('vi-VN')} bytes) • Loại:{' '}
                  {selectedFile.type || 'Không xác định'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClearSelected}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 transition"
              >
                Hủy chọn
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
              >
                {isLoading ? 'Đang gửi...' : 'Bắt đầu phân tích'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 italic">
        * Lưu ý bảo mật: Quá trình kiểm định định dạng thực tế và chữ ký nhị phân (magic bytes) sẽ được tiến hành nghiêm ngặt tại máy chủ backend để ngăn ngừa tệp độc hại hoặc giả mạo phần mở rộng. Máy chủ áp dụng cơ chế tự vệ kiểm soát kích thước trần nghiêm ngặt 15MB (HTTP 413) và điều tiết concurrency (HTTP 429) ở tầng ASGI trước khi nạp tệp.
      </p>
    </section>
  );
};

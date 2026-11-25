import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { DemoBanner } from '../components/DemoBanner';
import { ScopeIntroduction } from '../components/ScopeIntroduction';
import { FileUploader } from '../components/FileUploader';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { AnalysisReport } from '../components/AnalysisReport';
import { ErrorAlert } from '../components/ErrorAlert';
import { Footer } from '../components/Footer';
import { uploadFile, getAnalysis, deleteAnalysis, checkBackendHealth, ApiError } from '../services/api';
import { AnalysisResult } from '../types/api';

type AppStage = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface AnalysisAppPageProps {
  onNavigateHome?: () => void;
}

export const AnalysisAppPage: React.FC<AnalysisAppPageProps> = ({ onNavigateHome }) => {
  const [stage, setStage] = useState<AppStage>('idle');
  const [currentStageText, setCurrentStageText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);

  const pollingTimerRef = useRef<number | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const requestSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendOnline(health !== null);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const clearPolling = () => {
    if (pollingTimerRef.current !== null) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      requestSeqRef.current++;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      clearPolling();
    };
  }, []);

  const handleStartUpload = async (file: File) => {
    const seq = ++requestSeqRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    clearPolling();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLastUploadedFile(file);
    setStage('uploading');
    setCurrentStageText('Đang tải tệp lên backend local...');
    setProgressPercent(20);

    try {
      const uploadResp = await uploadFile(file, controller.signal);
      if (seq !== requestSeqRef.current) return;
      const jobId = uploadResp.id;
      activeJobIdRef.current = jobId;

      setStage('processing');
      setCurrentStageText('Máy chủ đang cách ly tệp và tính toán mã băm SHA-256...');
      setProgressPercent(50);

      // Start polling for result
      let attempts = 0;
      const maxAttempts = 35; // 35 * 800ms ~ 28s

      const poll = async () => {
        if (seq !== requestSeqRef.current) return;
        attempts++;
        try {
          const result = await getAnalysis(jobId, controller.signal);
          if (seq !== requestSeqRef.current) return;

          if (result.status === 'completed') {
            setProgressPercent(100);
            setCurrentStageText('Hoàn tất trích xuất thông số!');
            setAnalysisResult(result);
            setStage('completed');
            return;
          }

          if (result.status === 'failed') {
            throw new Error(result.error || 'Máy chủ gặp lỗi trong quá trình xử lý tệp.');
          }

          // Still processing
          setProgressPercent(Math.min(90, 50 + attempts * 3));
          setCurrentStageText(`Đang xử lý thông số kỹ thuật (bước ${attempts})...`);

          if (attempts >= maxAttempts) {
            throw new Error('Thời gian xử lý vượt quá giới hạn (30 giây). Vui lòng thử lại với tệp nhỏ hơn.');
          }

          pollingTimerRef.current = window.setTimeout(poll, 800);
        } catch (pollErr) {
          if (seq !== requestSeqRef.current) return;
          const msg =
            pollErr instanceof ApiError
              ? pollErr.message
              : pollErr instanceof Error
              ? pollErr.message
              : 'Đã xảy ra lỗi không xác định khi truy vấn kết quả phân tích.';
          setErrorMessage(msg);
          setStage('error');
        }
      };

      // Initial fast poll
      pollingTimerRef.current = window.setTimeout(poll, 400);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Không thể tải tệp lên máy chủ.';
      setErrorMessage(msg);
      setStage('error');
    }
  };

  const handleDeleteSession = async () => {
    if (!analysisResult) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAnalysis(analysisResult.id);
      setAnalysisResult(null);
      setStage('idle');
      activeJobIdRef.current = null;
      setSuccessNotice('Đã xóa báo cáo khỏi bộ nhớ của backend. Tệp gốc đã được xóa ngay sau khi tính thông số.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Không thể xóa phiên phân tích trên máy chủ.';
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetToUpload = () => {
    requestSeqRef.current++;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearPolling();
    setStage('idle');
    setErrorMessage(null);
    setAnalysisResult(null);
    activeJobIdRef.current = null;
  };

  const handleRetry = () => {
    if (lastUploadedFile) {
      handleStartUpload(lastUploadedFile);
    } else {
      handleResetToUpload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Accessibility skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-md"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Top back-to-landing bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400 py-1.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Không gian thử nghiệm: <strong>Local Demo App (/app)</strong></span>
        </div>
        <a
          href="/"
          onClick={(e) => {
            if (onNavigateHome) {
              e.preventDefault();
              onNavigateHome();
            }
          }}
          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center space-x-1 underline decoration-cyan-500/50 hover:decoration-cyan-400 transition"
        >
          <span>← Quay lại trang giới thiệu (/)</span>
        </a>
      </div>

      {/* Header with Backend status */}
      <Header backendOnline={backendOnline} onRefreshHealth={checkHealth} />

      {/* Notification Toast */}
      {successNotice && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-400 hover:text-white text-sm font-bold ml-2"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
        {/* Banner DEMO nổi bật */}
        <DemoBanner />

        {/* Cảnh báo trạng thái Local-Only khi Backend không kết nối */}
        {backendOnline === false && (
          <div
            role="status"
            className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/50 text-slate-200 text-xs sm:text-sm space-y-2 shadow-lg"
          >
            <div className="flex items-start space-x-3">
              <span className="text-amber-400 text-lg leading-none mt-0.5">⚠️</span>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-300">
                  Giao diện thử nghiệm cục bộ (Local-Only Demo) — Backend chưa kết nối
                </p>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  Website công khai chỉ phục vụ mục đích giới thiệu và trải nghiệm giao diện. Backend xử lý tệp media được giữ <strong>hoàn toàn trên máy cá nhân (localhost:8000)</strong> và <strong>không được public lên Internet</strong> nhằm bảo đảm an toàn dữ liệu và quyền riêng tư cục bộ.
                </p>
                <p className="text-slate-400 text-xs">
                  Để thực hiện phân tích tệp media, vui lòng tải mã nguồn về máy và khởi chạy backend theo hướng dẫn trong <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">README.md</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Giới thiệu & Phạm vi */}
        <ScopeIntroduction />

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            onRetry={stage === 'error' ? handleRetry : undefined}
            onDismiss={() => {
              setErrorMessage(null);
              if (stage === 'error') {
                setStage('idle');
              }
            }}
          />
        )}

        {/* Trạng thái 1: Chưa tải / Sẵn sàng tải */}
        {stage === 'idle' && (
          <FileUploader
            onFileSelected={handleStartUpload}
            isLoading={false}
            disabled={backendOnline === false}
          />
        )}

        {/* Trạng thái 2: Đang tải hoặc Đang xử lý */}
        {(stage === 'uploading' || stage === 'processing') && (
          <ProcessingStatus
            currentStage={currentStageText}
            progressPercent={progressPercent}
            onCancel={handleResetToUpload}
          />
        )}

        {/* Trạng thái 3: Báo cáo kết quả hoàn tất */}
        {stage === 'completed' && analysisResult && (
          <AnalysisReport
            analysis={analysisResult}
            onDeleteSession={handleDeleteSession}
            onReset={handleResetToUpload}
            isDeleting={isDeleting}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

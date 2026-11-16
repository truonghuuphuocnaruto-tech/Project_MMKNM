import React, { useState } from 'react';
import { AnalysisResult } from '../types/api';
import { formatBytes, formatDuration } from '../utils/formatters';

interface AnalysisReportProps {
  analysis: AnalysisResult;
  onDeleteSession: () => Promise<void>;
  onReset: () => void;
  isDeleting: boolean;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({
  analysis,
  onDeleteSession,
  onReset,
  isDeleting,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<'all' | 'audio' | 'visual' | 'scam'>('all');
  const [activePlaybookTab, setActivePlaybookTab] = useState<number>(0);

  const facts = analysis.file_facts;

  const handleCopyHash = async () => {
    if (!facts?.sha256_hash) return;
    try {
      await navigator.clipboard.writeText(facts.sha256_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // Fallback
      setCopiedHash(false);
    }
  };

  const toggleChecklistStep = (stepNumber: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const completedStepsCount = Object.values(checkedSteps).filter(Boolean).length;

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % commonScenarios.length;
      setActivePlaybookTab(nextIndex);
      document.getElementById(`scenario-tab-${nextIndex}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + commonScenarios.length) % commonScenarios.length;
      setActivePlaybookTab(prevIndex);
      document.getElementById(`scenario-tab-${prevIndex}`)?.focus();
    }
  };

  const mockCuesList = [
    ...(analysis.educational_mock_cues || []),
    {
      category: 'scam_intent',
      label: '[Minh họa / Mock cues] Mẫu kịch bản gây áp lực khẩn cấp',
      description: 'Dấu hiệu thao túng tâm lý: thúc ép chuyển tiền ngay lập tức, đe dọa tố tụng hoặc cô lập nạn nhân không cho liên hệ gia đình.',
    },
    {
      category: 'scam_intent',
      label: '[Minh họa / Mock cues] Yêu cầu cung cấp thông tin nhạy cảm',
      description: 'Dấu hiệu đáng ngờ yêu cầu đọc mã OTP, chụp thẻ căn cước hai mặt hoặc truy cập đường dẫn lạ để cài đặt ứng dụng APK.',
    },
  ];

  const filteredCues = mockCuesList.filter(cue => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'audio') return cue.category === 'audio_artifact';
    if (activeCategory === 'visual') return cue.category === 'visual_artifact';
    if (activeCategory === 'scam') return cue.category === 'scam_intent';
    return true;
  });

  const commonScenarios = [
    {
      title: '1. Giả danh Công an / Viện kiểm sát / Tòa án',
      icon: '⚖️',
      signs: 'Thông báo liên quan đường dây rửa tiền, ma túy; đe dọa lệnh bắt; yêu cầu chuyển tiền vào "tài khoản tạm giữ của cơ quan điều tra".',
      action: 'Cảnh giác cao độ khi bị đe dọa, ép chuyển tiền gấp hoặc yêu cầu cung cấp OTP/mật khẩu. Chủ động ngắt tương tác, không chuyển tiền và tự xác minh qua số điện thoại chính thức đã biết trước hoặc đến trực tiếp trụ sở cơ quan công quyền gần nhất.',
    },
    {
      title: '2. "Người thân gặp nạn / Cấp cứu bệnh viện"',
      icon: '🏥',
      signs: 'Cuộc gọi giọng giống người thân (hoặc tự xưng bác sĩ) trong tình trạng hoảng loạn, báo tai nạn cần chuyển tiền gấp để mổ.',
      action: 'Giữ bình tĩnh, cúp máy và gọi trực tiếp vào số điện thoại của người thân hoặc liên hệ người cùng nhà, trường học/cơ quan của người đó.',
    },
    {
      title: '3. Video call mờ giật, giả eKYC ngân hàng',
      icon: '📹',
      signs: 'Cuộc gọi video ngắn vài giây có khuôn mặt cử động gượng gạo, âm thanh ngắt quãng, viện cớ sóng yếu để tắt camera rồi nhắn tin đòi tiền.',
      action: 'Các cử động thị giác (như yêu cầu quay mặt, chớp mắt, vẫy tay) không đáng tin cậy để chứng minh thật/giả vì deepfake thời gian thực ngày càng tinh vi. Ưu tiên hàng đầu là chủ động ngắt cuộc gọi và xác minh qua kênh độc lập đã biết trước (gọi lại số điện thoại lưu từ trước hoặc gặp mặt trực tiếp).',
    },
    {
      title: '4. Giả danh Nhân viên viễn thông / Ngân hàng',
      icon: '💳',
      signs: 'Thông báo sim sắp bị khóa, tài khoản bị nghi ngờ gian lận, yêu cầu bấm cú pháp lạ hoặc chuyển tiếp mã OTP để "nâng cấp bảo mật".',
      action: 'Cảnh giác cao độ, tuyệt đối không chia sẻ mã OTP hoặc mã PIN với bất kỳ ai, kể cả người tự xưng nhân viên ngân hàng. Gọi lại tổng đài chính thức in trên mặt sau thẻ hoặc trên website chính thức.',
    },
  ];

  return (
    <article aria-labelledby="report-heading" className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 id="report-heading" className="text-base sm:text-lg font-bold text-white">
              Báo cáo thông số tệp &amp; Khuyến nghị an toàn
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mã định danh phiên (UUID): <code className="text-cyan-400 font-mono">{analysis.id}</code>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReset}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition"
          >
            ← Phân tích tệp khác
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            aria-haspopup="dialog"
            aria-expanded={showDeleteConfirm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900 border border-rose-800/60 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Xóa dữ liệu phiên phân tích và tệp cách ly"
          >
              {isDeleting ? 'Đang xóa...' : '🗑 Xóa phiên'}
            </button>
        </div>
      </div>

        {/* Confirmation Modal / Banner for Session Deletion */}
        {showDeleteConfirm && (
          <div
          role="alertdialog"
            aria-modal="true"
          aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
          onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setShowDeleteConfirm(false);
              }
            }}
            className="p-4 rounded-xl bg-rose-950/70 border border-rose-600/70 space-y-3"
          >
            <h3 id="confirm-delete-title" className="text-sm font-bold text-rose-200">
              Xóa báo cáo khỏi bộ nhớ backend?
            </h3>
            <p id="confirm-delete-desc" className="text-xs text-rose-300/90 leading-relaxed">
              Hành động này gửi lệnh <code>DELETE /api/v1/analyses/{analysis.id}</code> để xóa bản ghi khỏi RAM của tiến trình backend. Tệp gốc đã được xóa sau khi tính thông số. Bản ghi RAM cũng mất khi backend khởi động lại.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
                type="button"
              autoFocus
              onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDeleteSession();
                }}
              disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận xóa ngay'}
              </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Hủy (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Real File Facts */}
      <section
        aria-labelledby="file-facts-heading"
        className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 shadow-md space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold">
              THỰC TẾ
            </span>
            <h3 id="file-facts-heading" className="text-sm sm:text-base font-bold text-white">
              Thông số kỹ thuật thực tế của file (File Facts)
            </h3>
          </div>
          <span className="text-xs text-cyan-400 font-medium">Đo lường an toàn cục bộ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Tên tệp gốc:</span>
            <p className="text-sm font-semibold text-slate-100 break-all font-mono">
              {facts.file_name || 'Không xác định'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Dung lượng thực tế:</span>
            <p className="text-sm font-semibold text-slate-100 font-mono">
              {formatBytes(facts.file_size_bytes)} ({facts.file_size_bytes.toLocaleString('vi-VN')} bytes)
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">MIME trình duyệt khai báo (chưa xác minh nội dung):</span>
            <p className="text-sm font-semibold text-cyan-300 font-mono">
              {facts.mime_type || 'Không xác định'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Thời lượng phát:</span>
            <p className="text-sm font-semibold text-slate-100">
              {formatDuration(facts.duration_seconds)}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">
                Mã băm bảo mật SHA-256:
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-xs text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center space-x-1"
                aria-label="Sao chép mã băm SHA-256 vào bộ nhớ tạm"
              >
                <span>{copiedHash ? '✓ Đã sao chép' : '📋 Sao chép mã'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm font-mono text-cyan-300 bg-slate-950 p-2.5 rounded border border-slate-800 break-all select-all">
              {facts.sha256_hash}
            </p>
            <p className="text-[11px] text-slate-400">
              * SHA-256 là dấu vân tay của byte đã nhận; riêng nó không chứng minh nguồn gốc hay tính xác thực của tệp.
            </p>
          </div>
        </div>

        {/* Security & Provenance Badge */}
        <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tệp tạm: <strong>Đã xóa ngay</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Bộ nhớ: <strong>RAM tạm thời (15 phút)</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Mạng: <strong>Backend bind localhost (127.0.0.1); không phải network isolation</strong></span>
          </div>
        </div>
      </section>

      {/* Section 2: Educational Mock Cues & AI Status */}
      <section
        aria-labelledby="mock-cues-heading"
        className="p-5 rounded-xl bg-slate-800/60 border border-amber-800/40 shadow-md space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-xs font-bold">
              [Minh họa / Mock cues]
            </span>
            <h3 id="mock-cues-heading" className="text-sm sm:text-base font-bold text-white">
              Tín hiệu mẫu minh họa cho mục đích giáo dục
            </h3>
          </div>
          <span className="text-xs text-amber-300 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            Chế độ: {analysis.mode || 'demo'}
          </span>
        </div>

        {/* AI Status Banner */}
        <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-700/50 flex items-start space-x-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">ℹ</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-200">
              Trạng thái AI: {analysis.ai_status}
            </p>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Hệ thống không đưa ra suy diễn AI hay tính toán xác suất deepfake giả định. Các quan sát dưới đây là kịch bản mẫu giúp người dùng làm quen với các dạng tín hiệu bất thường trong giám định đa phương tiện:
            </p>
          </div>
        </div>

        {/* Filter Tabs by Analytical Pillars */}
        <div
          role="toolbar"
          aria-label="Bộ lọc phân loại tín hiệu mẫu minh họa"
          className="flex flex-wrap gap-2 pt-1"
        >
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Tất cả ({mockCuesList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('audio')}
            aria-pressed={activeCategory === 'audio'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              activeCategory === 'audio'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            🎙️ Mẫu âm thanh (Minh họa)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('visual')}
            aria-pressed={activeCategory === 'visual'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              activeCategory === 'visual'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            📹 Mẫu hình ảnh (Minh họa)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('scam')}
            aria-pressed={activeCategory === 'scam'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              activeCategory === 'scam'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            ⚠️ Mẫu kịch bản (Minh họa)
          </button>
        </div>

        {/* Filtered Mock Cues Cards */}
        <div className="space-y-3">
          {filteredCues.map((cue, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-700/60 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {cue.category}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/70">
                  Mẫu minh họa / Mock
                </span>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                  {cue.label}
                </h4>
              </div>
              <p className="text-xs text-slate-300 pl-1">{cue.description}</p>
              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded border border-amber-800/40 flex items-start space-x-1.5">
                <span className="text-amber-400 font-bold flex-shrink-0" aria-hidden="true">⚠️</span>
                <span>
                  <strong>Lưu ý:</strong> Tín hiệu mẫu này KHÔNG được suy ra hay phát hiện từ tệp media người dùng tải lên.
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 italic">
          * Tuyệt đối không dựa vào các tín hiệu mẫu này để đánh giá tệp thực tế của bạn là thật hay giả.
        </p>
      </section>

      {/* Section 3: Interactive 4-Step Offline Verification Checklist */}
      <section
        aria-labelledby="checklist-heading"
        className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 shadow-md space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <h3 id="checklist-heading" className="text-sm sm:text-base font-bold text-white">
              Quy trình 4 bước xác minh an toàn ngoại tuyến
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-medium">
            Tiến độ: {completedStepsCount}/4 bước đã tích
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Hãy tích chọn các bước dưới đây khi bạn đã thực tế thực hiện để kiểm soát nguy cơ bị thao túng tâm lý:
        </p>

        <div
          role="group"
            aria-label="Quy trình 4 bước xác minh an toàn ngoại tuyến"
            className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
          >
            {[
            {
                num: 1,
              title: 'Giữ bình tĩnh & Trì hoãn',
              desc: 'Kẻ gian thường tạo áp lực thời gian khẩn cấp (đe dọa tư pháp, tai nạn, trúng thưởng). Cảnh giác cao độ, tuyệt đối không vội vàng chuyển tiền hay gửi mã OTP/mật khẩu.',
              },
            {
                num: 2,
              title: 'Xác minh qua kênh độc lập',
              desc: 'Chủ động cúp máy và gọi lại cho người thân/đối tác theo số điện thoại đã lưu trong danh bạ từ trước, hoặc liên hệ qua kênh tin cậy khác.',
              },
            {
                num: 3,
              title: 'Đặt câu hỏi thử thách bí mật',
              desc: 'Hỏi một chi tiết chỉ có bạn và người đó cùng biết (ví dụ kỷ niệm riêng, địa điểm ăn uống quen thuộc, tên thú cưng).',
              },
            {
                num: 4,
                title: 'Báo cáo cơ quan chức năng & Ngân hàng',
                desc: 'Nếu phát hiện hành vi lừa đảo hoặc nghi vấn đã chuyển tiền/lộ thông tin, lập tức gọi hotline ngân hàng yêu cầu khóa khẩn cấp và trình báo cơ quan công an gần nhất.',
              },
            ].map(step => {
              const isChecked = !!checkedSteps[step.num];
              return (
                <div
                key={step.num}
                onClick={() => toggleChecklistStep(step.num)}
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`Bước ${step.num}: ${step.title}`}
                  tabIndex={0}
                onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                    toggleChecklistStep(step.num);
                    }
                }}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start space-x-3 select-none focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-600/70'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                      isChecked
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  >
                    {isChecked ? '✓' : step.num}
                  </div>
                  <div className="space-y-1">
                    <h4
                      className={`text-xs sm:text-sm font-semibold transition ${
                        isChecked ? 'text-emerald-200 line-through opacity-80' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                </div>
              );
            })}
          </div>

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 space-y-1">
            <p className="font-semibold text-cyan-300">Khuyến nghị bổ sung từ hệ thống:</p>
              <ul className="list-disc list-inside space-y-0.5 text-cyan-200/90 pl-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
              ))}
              </ul>
            </div>
        )}
        </section>

        {/* Section 4: Educational Scenarios Playbook */}
        <section
          aria-labelledby="scenarios-heading"
          className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 shadow-md space-y-4"
        >
          <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
          <span className="p-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-bold">
              CẨM NANG
          </span>
            <h3 id="scenarios-heading" className="text-sm sm:text-base font-bold text-white">
              Nhận biết 4 kịch bản lừa đảo mạo danh phổ biến tại Việt Nam
            </h3>
          </div>

          <div
            role="tablist"
            aria-label="Danh sách các kịch bản lừa đảo mạo danh phổ biến"
            className="flex flex-wrap gap-2"
          >
            {commonScenarios.map((sc, idx) => {
            const isSelected = activePlaybookTab === idx;
              return (
              <button
                  key={idx}
                  id={`scenario-tab-${idx}`}
                  role="tab"
                type="button"
                  aria-selected={isSelected}
                  aria-controls={`scenario-panel-${idx}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActivePlaybookTab(idx)}
                  onKeyDown={e => handleTabKeyDown(e, idx)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700'
                  }`}
              >
                  <span className="mr-1.5" aria-hidden="true">{sc.icon}</span>
                  <span>{sc.title.split('.')[1]?.trim() || sc.title}</span>
              </button>
              );
            })}
          </div>

          <div
          id={`scenario-panel-${activePlaybookTab}`}
          role="tabpanel"
          aria-labelledby={`scenario-tab-${activePlaybookTab}`}
          tabIndex={0}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 focus:outline-none focus:ring-1 focus:ring-slate-700"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg" aria-hidden="true">{commonScenarios[activePlaybookTab].icon}</span>
            <h4 className="text-sm font-bold text-indigo-200">
              {commonScenarios[activePlaybookTab].title}
            </h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-amber-400">Dấu hiệu nhận biết:</strong>{' '}
              {commonScenarios[activePlaybookTab].signs}
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-emerald-400">Cách xử lý an toàn:</strong>{' '}
              {commonScenarios[activePlaybookTab].action}
            </p>
          </div>
        </div>
      </section>
    </article>
  );
};

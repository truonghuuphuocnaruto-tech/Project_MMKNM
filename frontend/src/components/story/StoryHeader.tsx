import React, { useState } from 'react';

interface StoryHeaderProps {
  onNavigate: (to: string) => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Tình huống', href: '#tinh-huong' },
    { label: 'Cách xử lý', href: '#cach-xu-ly' },
    { label: 'Công cụ', href: '#cong-cu' },
    { label: 'Giới hạn', href: '#gioi-han' },
    { label: 'Checklist', href: '#checklist' },
    { label: 'Quyền riêng tư', href: '#quyen-rieng-tu' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#faf7f2]/95 backdrop-blur-md border-b border-[#e6dcce] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="flex items-center space-x-2.5 text-left group"
              aria-label="Về đầu trang giới thiệu"
            >
              <div className="w-9 h-9 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#115e59] transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="block text-sm sm:text-base font-bold text-[#17232e] tracking-tight leading-tight group-hover:text-[#0f766e] transition">
                  Debunk
                </span>
                <span className="hidden sm:block text-[11px] text-[#6b7d8c] font-medium leading-tight">
                  Nhận thức phòng vệ số &amp; Phân tích kỹ thuật
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Nav Anchors */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Điều hướng các phần nội dung">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-1.5 text-xs font-semibold text-[#485966] hover:text-[#0f766e] hover:bg-[#efe7dc]/60 rounded-md transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTA */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('/app')}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0f766e] hover:bg-[#115e59] active:bg-[#134e4a] rounded-lg shadow-sm transition"
              title="Chuyển tới giao diện tải tệp thử nghiệm tại máy cục bộ"
            >
              <span>Mở bản demo local (/app)</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => onNavigate('/app')}
              className="sm:hidden px-2.5 py-1 text-xs font-bold text-white bg-[#0f766e] rounded-md"
            >
              Demo /app
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#485966] hover:text-[#17232e] hover:bg-[#efe7dc] rounded-md"
              aria-label="Mở danh mục điều hướng"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#faf7f2] border-b border-[#e6dcce] px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="block px-3 py-2 text-sm font-medium text-[#17232e] hover:bg-[#efe7dc] rounded-md"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#e6dcce]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/app');
              }}
              className="w-full text-center px-4 py-2 text-sm font-bold text-white bg-[#0f766e] hover:bg-[#115e59] rounded-md"
            >
              Mở bản demo local (/app)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

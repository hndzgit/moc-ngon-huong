import { isFigmaPreview } from '../lib/previewMode';
import { BrandLogo } from './BrandLogo';
import { FigmaIcon } from './FigmaIcon';
import React, { useState } from 'react';
import { PageRoute } from '../types';

interface FooterProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      if (!isFigmaPreview) {
        setSubscribeError('Đăng ký nhận tin trực tuyến hiện chưa khả dụng.');
        return;
      }
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="site-footer w-full bg-[#3e5641] text-[#f7f4d5]">
      <div className="figma-container pt-12 pb-8 md:pt-14 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 pb-10 border-b border-[#f7f4d5]/20">
          {/* Column 1: Brand Identity & Socials */}
          <div className="lg:pr-8 lg:border-r lg:border-[#f7f4d5]/20">
            <BrandLogo className="mb-4" />
            <p className="text-[13px] leading-[20px] text-[#f7f4d5]/85 mb-4 max-w-[260px]">
              Thương hiệu quà tặng trà đặc sản Thái Nguyên định vị kết nối cảm xúc. Chọn hương thơm, gửi gắm trọn vẹn lời thương khó nói.
            </p>
            <div className="flex items-center gap-3 -ml-2.5" aria-label="Mạng xã hội">
              <a
                href="https://www.facebook.com/p/M%E1%BB%99c-Ng%C3%B4n-H%C6%B0%C6%A1ng-61590217692405/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Mộc Ngôn Hương"
                title="Facebook Mộc Ngôn Hương"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#f7f4d5] opacity-90 hover:opacity-100 hover:bg-white/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f7f4d5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3e5641] transition-all"
              >
                <FigmaIcon name="facebook" />
              </a>
              <a
                href="https://www.tiktok.com/@mocngonhuong"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok Mộc Ngôn Hương"
                title="TikTok Mộc Ngôn Hương"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#f7f4d5] opacity-90 hover:opacity-100 hover:bg-white/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f7f4d5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3e5641] transition-all"
              >
                <FigmaIcon name="tiktok" />
              </a>
            </div>
          </div>

          {/* Column 2: BỘ SƯU TẬP */}
          <div className="lg:px-8 lg:border-r lg:border-[#f7f4d5]/20">
            <h3 className="font-bold text-[14px] uppercase tracking-wider text-[#f7f4d5] mb-4">
              BỘ SƯU TẬP
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#f7f4d5]/85">
              <li><button type="button" onClick={()=>onNavigate('gift-journey')} className="hover:text-white transition-colors text-left">Tự tay chọn món quà</button></li>
              <li><button type="button" onClick={()=>onNavigate('corporate')} className="hover:text-white transition-colors text-left">Quà tặng doanh nghiệp</button></li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('detail', 'buoi-an')}
                  className="hover:text-white transition-colors text-left"
                >
                  Trà Bưởi (AN) — Bình An
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('detail', 'nhai-thuong')}
                  className="hover:text-white transition-colors text-left"
                >
                  Trà Nhài (THƯƠNG) — Yêu thương
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('detail', 'soi-cam')}
                  className="hover:text-white transition-colors text-left"
                >
                  Trà Hoa Sói (CẢM) — Tri Ân
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('detail', 'com-nho')}
                  className="hover:text-white transition-colors text-left"
                >
                  Trà Cốm (NHỚ) — Kỷ Niệm
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('detail', 'hop-qua-tam-y')}
                  className="hover:text-white transition-colors text-left"
                >
                  Combo Hộp Quà &ldquo;TÂM Ý&rdquo;
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ Trợ Quà Tặng */}
          <div className="lg:px-8 lg:border-r lg:border-[#f7f4d5]/20">
            <h3 className="font-bold text-[14px] text-[#f7f4d5] mb-4">
              Hỗ Trợ Quà Tặng
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#f7f4d5]/85">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('gift-journey')}
                  className="hover:text-white transition-colors text-left"
                >
                  Chuẩn bị lời nhắn trên thiệp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('corporate')}
                  className="hover:text-white transition-colors text-left"
                >
                  Tư vấn quà doanh nghiệp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="hover:text-white transition-colors text-left"
                >
                  Hướng Dẫn Pha Trà Chuẩn Hương
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  Chính Sách Đổi Trả &amp; Giao Vận
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Đăng Ký Nhận Thưởng */}
          <div className="lg:pl-8">
            <h3 className="font-bold text-[14px] text-[#f7f4d5] mb-3">
              Đăng Ký Nhận Thưởng
            </h3>
            <p className="text-[12.5px] leading-[19px] text-[#f7f4d5]/85 mb-3">
              Nhận Cẩm Nang Thưởng Trà Và Mã Ưu Đãi 10% Cho Đơn Hàng Đầu Tiên Của Bạn.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="h-[36px] px-3 rounded-l-[6px] bg-white/10 border border-[#f7f4d5]/30 text-[12.5px] text-[#f7f4d5] placeholder:text-[#f7f4d5]/60 focus:outline-none flex-1 min-w-0"
              />
              <button
                type="submit"
                className="h-[36px] px-4 rounded-r-[6px] bg-[#c89f5d] text-white font-semibold text-[12.5px] hover:bg-[#b58d4b] transition-colors shrink-0"
              >
                Gửi
              </button>
            </form>
            <p aria-live="polite" className="text-[11px] text-[#f7f4d5]/70 mt-2">
              {subscribeError || (subscribed ? 'Đã đăng ký nhận ưu đãi 10%!' : 'Bảo Mật Thông Tin 100%')}
            </p>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#f7f4d5]/75">
          <p>© 2026 Mộc Ngôn Hương. Trao Hương - Gửi Lời Thương.</p>
          <p>Dự án khởi nghiệp văn hóa trà trẻ Việt Nam</p>
        </div>
      </div>
    </footer>
  );
};

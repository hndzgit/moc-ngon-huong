import { BrandLogo } from './BrandLogo';
import { FigmaIcon } from './FigmaIcon';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRoute } from '../types';

interface FooterProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useTranslation('navigation');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribeNotice, setSubscribeNotice] = useState('');

  const collectionLinks = t('footer.collectionLinks', { returnObjects: true }) as ReadonlyArray<{
    label: string;
    page: PageRoute;
    id: string;
  }>;
  const supportLinks = t('footer.supportLinks', { returnObjects: true }) as ReadonlyArray<{
    label: string;
    page: PageRoute;
  }>;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribeNotice(t('footer.newsletterNotice'));
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
              {t('footer.brandIntro')}
            </p>
            <div className="flex items-center gap-3 -ml-2.5" aria-label={t('footer.socialsAria')}>
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
              {t('footer.collectionTitle')}
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#f7f4d5]/85">
              {collectionLinks.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.page, item.id)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Hỗ Trợ Quà Tặng */}
          <div className="lg:px-8 lg:border-r lg:border-[#f7f4d5]/20">
            <h3 className="font-bold text-[14px] text-[#f7f4d5] mb-4">
              {t('footer.supportTitle')}
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#f7f4d5]/85">
              {supportLinks.map((item) => (
                <li key={item.page}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Bản Tin Văn Hóa Trà */}
          <div className="lg:pl-8">
            <h3 className="font-bold text-[14px] text-[#f7f4d5] mb-3">
              {t('footer.newsletterTitle')}
            </h3>
            <p className="text-[12.5px] leading-[19px] text-[#f7f4d5]/85 mb-3">
              {t('footer.newsletterSubtitle')}
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (subscribeNotice) setSubscribeNotice('');
                }}
                placeholder={t('footer.newsletterPlaceholder')}
                aria-label={t('footer.newsletterEmailLabel')}
                className="h-[36px] px-3 rounded-l-[6px] bg-white/10 border border-[#f7f4d5]/30 text-[12.5px] text-[#f7f4d5] placeholder:text-[#f7f4d5]/60 focus:outline-none flex-1 min-w-0"
              />
              <button
                type="submit"
                className="h-[36px] px-4 rounded-r-[6px] bg-[#c89f5d] text-white font-semibold text-[12.5px] hover:bg-[#b58d4b] transition-colors shrink-0"
              >
                {t('footer.newsletterButton')}
              </button>
            </form>
            <p aria-live="polite" className="text-[11px] leading-[16px] text-[#f7f4d5]/75 mt-2">
              {subscribeNotice || t('footer.newsletterDefaultNote')}
            </p>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#f7f4d5]/75">
          <p>{t('footer.copyrightLine')}</p>
          <p>{t('footer.subCopyrightLine')}</p>
        </div>
      </div>
    </footer>
  );
};

import { assetUrl } from '../lib/assets';
import { scrollBehavior } from '../motion/motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import './Hero.css';
import { PageRoute } from '../types';

interface HeroProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  onStartGift?:()=>void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate,onStartGift }) => {
  const { t } = useTranslation('home');
  const scrollToEmotionSelector = () => {
    const el = document.getElementById('chon-cam-xuc');
    if (el) {
      el.scrollIntoView({ behavior: scrollBehavior() });
    } else {
      onNavigate('products');
    }
  };

  return (
    <section className="home-hero relative w-full overflow-hidden bg-[#203323]">
      {/* Hero Background Image (Figma 61:1165) */}
      <div className="hero-photo-mask">
        <picture>
          <source
            type="image/webp"
            srcSet={[768,1280,1920,2560,3840].map(width => `${assetUrl(`/assets/optimized/hero-${width}.webp`)} ${width}w`).join(', ')}
            sizes="(max-width: 1023px) max(100vw, calc(606px + 40.2vw)), 100vw"
          />
          <img
            src={assetUrl('/assets/optimized/hero-1920.webp')}
            width={4096}
            height={2731}
            fetchPriority="high"
            decoding="async"
            data-figma-node="61:1165"
            alt={t('hero.bannerAlt')}
            className="hero-photo"
          />
        </picture>
      </div>

      {/* Gradient Overlay for Left Text Readability */}
      <img src={assetUrl("/assets/figma/originals/4ce5c.png")} alt="" aria-hidden="true" decoding="async" className="hero-overlay-turn absolute pointer-events-none" />
      <img src={assetUrl("/assets/figma/originals/3ee72.png")} alt="" aria-hidden="true" decoding="async" className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Left-aligned Content Overlay (Figma 61:1189) */}
      <div className="hero-content relative z-10 figma-container h-full text-left">
        <div className="hero-copy">
          <h1 className="font-philosopher">
            {t('hero.title')}
          </h1>

          <p className="hero-description">
            {t('hero.description')}
          </p>

          <div className="hero-cta">
            <button
              type="button"
              onClick={onStartGift||scrollToEmotionSelector}
              className="hero-button hero-button-primary"
            >
              {t('hero.ctaPrimary')}
            </button>

            <button
              type="button"
              onClick={scrollToEmotionSelector}
              className="hero-button hero-button-secondary"
            >
              {t('hero.ctaSecondary')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

import { assetUrl } from '../lib/assets';
import React from 'react';
import { PageRoute } from '../types';

interface HeroProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const scrollToEmotionSelector = () => {
    const el = document.getElementById('chon-cam-xuc');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('products');
    }
  };

  return (
    <section className="home-hero relative w-full h-[500px] sm:h-[620px] lg:h-[720px] overflow-hidden bg-[#203323]">
      {/* Hero Background Image (Figma 61:1165) */}
      <img
        src={assetUrl("/assets/figma/hero-banner.png")}
        alt="Mộc Ngôn Hương — Trao hương, gửi lời thương"
        className="hero-photo absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Gradient Overlay for Left Text Readability */}
      <img src={assetUrl("/assets/figma/originals/4ce5c.png")} alt="" aria-hidden="true" className="hero-overlay-turn absolute pointer-events-none" />
      <img src={assetUrl("/assets/figma/originals/3ee72.png")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Left-aligned Content Overlay (Figma 61:1189) */}
      <div className="relative z-10 figma-container h-full flex flex-col justify-center items-start text-left">
        <div className="max-w-[720px]">
          <h1 className="font-philosopher font-bold text-[42px] sm:text-[60px] lg:text-[76px] leading-[1.08] text-[#f7f4d5] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
            Mộc Ngôn Hương
          </h1>

          <p className="text-[#f7f4d5]/95 text-[15px] sm:text-[17px] lg:text-[19px] leading-[26px] sm:leading-[30px] max-w-[560px] mb-8 font-normal drop-shadow">
            Đôi khi, những điều chân thành nhất lại khó cất thành lời. Hãy chọn điều bạn muốn gửi, Mộc Ngôn Hương sẽ thay bạn nói lời thương.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={scrollToEmotionSelector}
              className="h-[48px] px-7 rounded-full bg-[#3e5641]/90 border border-[#f7f4d5]/40 text-[#f7f4d5] font-semibold text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-[#3e5641] transition-all duration-200"
            >
              Điều Bạn Muốn Gửi
            </button>

            <button
              type="button"
              onClick={() => onNavigate('detail', 'hop-qua-tam-y')}
              className="h-[48px] px-8 rounded-full bg-white text-[#203323] font-semibold text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-[#f7f4d5] transition-all duration-200"
            >
              Hộp Quà Tâm Ý
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

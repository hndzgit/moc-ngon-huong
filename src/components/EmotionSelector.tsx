import { assetUrl } from '../lib/assets';
import { FIGMA_PRODUCT_COPY } from '../data/figmaMedia';
import { MotionDialog } from '../motion/MotionDialog';
import { MotionImage } from '../motion/MotionImage';
import { useChangeMotion } from '../motion/motion';
import { FigmaIcon } from './FigmaIcon';
import React, { useState } from 'react';
import { EMOTION_CARDS, PRODUCTS } from '../data/products';
import { EmotionKey, PageRoute, Product, TeaEmotion } from '../types';

interface EmotionSelectorProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onComposeGift?:(emotion:TeaEmotion)=>void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  onNavigate,
  onAddToCart,
  onComposeGift,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<Exclude<EmotionKey, 'ALL' | 'COMBO'>>('AN');
  const [qrOpen, setQrOpen] = useState(false);
  const flavorMotion = useChangeMotion<HTMLDivElement>(selectedEmotion, '[data-flavor-copy]', .3);

  const activeItem =
    EMOTION_CARDS.find((item) => item.key === selectedEmotion) || EMOTION_CARDS[0];
  const storyCopy = FIGMA_PRODUCT_COPY[activeItem.productId];
  const matchedProduct =
    PRODUCTS.find((p) => p.id === activeItem.productId) || PRODUCTS[0];

  const handleSelectEmotion = (key: Exclude<EmotionKey, 'ALL' | 'COMBO'>) => {
    setSelectedEmotion(key);
    setQrOpen(false);
  };

  return (
    <section
      id="chon-cam-xuc"
      className="home-emotion relative py-14 md:py-20 bg-[#faf7f2] overflow-hidden"
    >
      <div className="figma-container relative z-10">
        {/* Section Heading (Figma 56:1033) */}
        <div className="text-center max-w-[760px] mx-auto mb-10">
          <p className="text-[13px] md:text-[14px] font-medium text-[#9c5435] mb-1.5">
            Trải nghiệm Tương Tác
          </p>
          <h2 className="font-philosopher font-bold text-[28px] sm:text-[38px] lg:text-[44px] text-[#203323] leading-[1.15] mb-3">
            Hôm nay, bạn muốn gửi điều gì?
          </h2>
          <p className="text-[14px] md:text-[15px] text-[#666666] leading-[22px] max-w-[560px] mx-auto">
            Đôi khi ta ngập ngừng chưa thể nói hết lòng mình. Hãy chọn thông điệp bạn đang ấp ủ, Mộc Ngôn Hương sẽ gợi mở hương trà tương ứng.
          </p>
        </div>

        {/* 4 Emotion Selector Cards (Figma Component 5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {EMOTION_CARDS.map((card) => {
            const isSelected = card.key === selectedEmotion;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => handleSelectEmotion(card.key)}
                aria-pressed={isSelected}
                className={`group relative text-left rounded-[14px] p-4 transition-all duration-200 flex flex-col justify-between bg-white border ${
                  isSelected
                    ? 'border-[#3e5641] ring-2 ring-[#3e5641]/15 shadow-md'
                    : 'border-gray-200 hover:border-[#3e5641]/50 shadow-2xs'
                }`}
              >
                <div className="w-full flex items-start justify-between mb-2">
                  <img
                    src={assetUrl(`/assets/optimized/discovery-botanical-${card.key}.webp`)}
                    data-original-asset={card.illustration}
                    alt={card.teaName}
                    loading="lazy" decoding="async"
                    className="w-[46px] h-[46px] object-contain"
                  />
                  <span
                    className="inline-block px-3 py-0.5 rounded-full text-[11.5px] font-semibold"
                    style={{
                      backgroundColor: card.pillBg,
                      color: card.pillText,
                    }}
                  >
                    {card.shortPill}
                  </span>
                </div>

                <div>
                  <h3 className="font-philosopher font-bold text-[17px] text-[#222222] leading-snug">
                    {card.cardTitle}
                  </h3>
                  <p className="text-[12.5px] text-[#777777] mt-0.5">
                    {card.teaName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {onComposeGift&&<div className="emotion-compose-entry"><span>Đã tìm thấy hương trà cho lời muốn gửi?</span><button type="button" onClick={()=>onComposeGift(selectedEmotion)}>Viết lời nhắn cho món quà {matchedProduct.shortName}</button></div>}
        {/* Main Flavor Card Showcase (Figma Component 6 - 80:4148) */}
        <div ref={flavorMotion} className="bg-white rounded-[20px] border border-gray-200/80 shadow-[0_12px_36px_rgba(32,51,35,0.08)] p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Flavor Story, 2-Column Info Boxes & CTA */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div data-flavor-copy>
                <span
                  className="inline-block px-3.5 py-1 rounded-full text-[12px] font-semibold mb-3"
                  style={{
                    backgroundColor: activeItem.pillBg,
                    color: activeItem.pillText,
                  }}
                >
                  {activeItem.suggestPill}
                </span>

                <h3 className="font-philosopher font-bold text-[26px] sm:text-[32px] text-[#203323] leading-[1.2] mb-4">
                  {storyCopy.storyTitle}
                </h3>

                {/* Quote with Left Accent Border */}
                <blockquote className="border-l-[3px] border-[#3e5641]/60 pl-4 py-1 italic text-[14px] md:text-[15px] leading-[24px] text-[#555555] mb-5">
                  {storyCopy.quote}
                </blockquote>

                {/* 2 Side-by-Side Info Columns (Tầng hương & Món quà hoàn hảo cho) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 pt-3 border-t border-gray-100">
                  <div>
                    <h4 className="text-[12px] text-[#888888] mb-0.5">
                      Tầng hương
                    </h4>
                    <p className="text-[13px] font-medium text-[#222222] line-clamp-2">
                      {storyCopy.scent}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[12px] text-[#888888] mb-0.5">
                      Món quà hoàn hảo cho
                    </h4>
                    <p className="text-[13px] font-medium text-[#222222] line-clamp-2">
                      {storyCopy.giftFor}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price & Full-width 2-Column Buttons */}
              <div className="pt-3 border-t border-gray-100">
                <div className="font-philosopher font-bold text-[24px] md:text-[28px] text-[#203323] mb-4">
                  {matchedProduct.price.toLocaleString('en-US')}đ
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => onAddToCart(matchedProduct, 1)}
                    className="h-[44px] px-5 rounded-full border border-[#3e5641] text-[#3e5641] font-semibold text-[14px] hover:bg-[#3e5641]/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <FigmaIcon name="giftBag" />
                    <span>Thêm Vào Giỏ Hàng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('detail', matchedProduct.id)}
                    className="h-[44px] px-5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[14px] hover:bg-[#203323] transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <FigmaIcon name="wallet" /><span>Mua Ngay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Product Photo & Inline QR Overlay */}
            <div className="lg:col-span-6">
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] rounded-[16px] overflow-hidden shadow-sm bg-[#203323]">
                <MotionImage
                  src={assetUrl(`/assets/optimized/discovery-card-${activeItem.productId}.webp`)}
                  data-original-asset={selectedEmotion==='AN'?'/assets/figma/originals/ae4e7.png':activeItem.image}
                  alt={storyCopy.storyTitle}
                  loading="lazy" decoding="async"
                  className="w-full h-full object-cover"
                />

                {!qrOpen ? (
                  <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
                    <button
                      type="button"
                      onClick={event=>{event.currentTarget.focus({preventScroll:true});setQrOpen(true)}}
                      className="h-[38px] px-4 rounded-full bg-white/95 backdrop-blur-sm text-[#203323] font-medium text-[13px] shadow-md hover:bg-white transition-all flex items-center gap-2"
                    >
                      <FigmaIcon name="scan" />
                      <span>Quét QR nghe Audio chuyện trà</span>
                    </button>
                  </div>
                ) : null}
                <MotionDialog open={qrOpen} onClose={()=>setQrOpen(false)}>
                  <div role="dialog" aria-modal="true" aria-label="Mã QR nghe chuyện trà" className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white p-3.5 rounded-[14px] shadow-2xl mb-4">
                      <img
                        src={assetUrl("/assets/figma/qr-code.png")}
                        alt="Mã QR nghe Audio chuyện trà"
                        className="w-[180px] h-[180px] object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setQrOpen(false)}
                      className="w-9 h-9 rounded-full bg-white text-[#222222] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      aria-label="Đóng mã QR"
                    >
                      <FigmaIcon name="closeModal" />
                    </button>
                  </div>
                </MotionDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { FigmaArtwork } from './FigmaArtwork';
import { FigmaIcon } from './FigmaIcon';
import React, { useRef, useState } from 'react';
import { PRODUCTS } from '../data/products';
import { PageRoute, Product } from '../types';
import './SignatureAtelier.css';

interface SignatureBoxSectionProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  /** Retained for existing callers; catalog price is authoritative. */
  displayPrice?: number;
  onComposeGift?: () => void;
}

const GIFT_VIEWS = [
  { src: '/source-assets/figma/combo-slide-1.png', node: '96:2989', title: 'Hộp quà Tâm Ý', caption: 'Một món quà, bốn sắc hương trà Việt.' },
  { src: '/source-assets/figma/originals/gift-96-3129.jpg', node: '96:3129', title: 'Mở hộp quà', caption: 'Khám phá hộp quà qua ảnh chụp nguyên bản.' },
  { src: '/source-assets/figma/originals/gift-96-3091.jpg', node: '96:3091', title: 'Những điều bên trong', caption: 'Các thức trà và phụ kiện trong cùng một món quà.' },
  { src: '/source-assets/figma/originals/gift-96-3111.jpg', node: '96:3111', title: 'Bốn sắc hương', caption: 'Bưởi — AN, Nhài — THƯƠNG, Hoa Sói — CẢM, Cốm — NHỚ.' },
] as const;

export const SignatureBoxSection: React.FC<SignatureBoxSectionProps> = ({
  onNavigate,
  onAddToCart,
  onComposeGift,
}) => {
  const signatureProduct =
    PRODUCTS.find((p) => p.id === 'hop-qua-tam-y') || PRODUCTS[4];
  // Component 8 originals; product-detail galleries are a separate Figma slot.
  const slides = GIFT_VIEWS;
  const [slideIdx, setSlideIdx] = useState(0);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressImageClick = useRef(false);

  const prevSlide = () =>
    setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIdx((i) => (i + 1) % slides.length);

  return (
    <section id="hop-qua-tam-y" aria-labelledby="signature-box-title" className="signature-box signature-atelier relative py-14 md:py-20 bg-[#3e5641] text-[#f7f4d5] overflow-hidden">
      <div className="figma-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image Carousel with Arrows & Dots (Figma Component 8 - 96:3135) */}
          <div className="lg:col-span-6" role="region" aria-label="Hình ảnh Hộp Quà Tâm Ý" aria-roledescription="thư viện ảnh">
            <div className="relative rounded-[18px] overflow-hidden shadow-xl aspect-[16/10]">
              <button
                type="button"
                className="signature-photo-link"
                aria-label="Xem chi tiết Hộp Quà Tâm Ý"
                onPointerDown={event => {
                  if (event.button !== 0) return;
                  gesture.current = { x: event.clientX, y: event.clientY };
                  suppressImageClick.current = false;
                }}
                onPointerCancel={() => { gesture.current = null; }}
                onPointerUp={event => {
                  const start = gesture.current;
                  gesture.current = null;
                  if (!start) return;
                  const dx = event.clientX - start.x, dy = event.clientY - start.y;
                  if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                    suppressImageClick.current = true;
                    if (dx < 0) nextSlide(); else prevSlide();
                  }
                }}
                onClick={() => {
                  if (suppressImageClick.current) { suppressImageClick.current = false; return; }
                  onNavigate('detail', signatureProduct.id);
                }}
              >
              <MotionImage
                src={assetUrl(`/assets/optimized/gift-view-${slideIdx + 1}.webp`)}
                data-original-asset={slides[slideIdx].src}
                data-figma-node={slides[slideIdx].node}
                alt={`${slides[slideIdx].title} — ảnh ${slideIdx + 1} trong 4`}
                loading="lazy" decoding="async"
                draggable={false}
                className="w-full h-full object-cover cursor-pointer"
              />
              </button>

              {/* Left / Right Carousel Arrows */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-4 top-1/2 lg:top-[51.90114%] -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(140,131,131,0.2)] lg:backdrop-blur-[19.3px] shadow-[0_-3px_20px_rgba(0,0,0,0.04)] text-white flex items-center justify-center"
                aria-label="Ảnh trước"
              >
                <FigmaIcon name="arrowLeft" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-4 top-1/2 lg:top-[51.90114%] -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(140,131,131,0.2)] lg:backdrop-blur-[19.3px] shadow-[0_-3px_20px_rgba(0,0,0,0.04)] text-white flex items-center justify-center"
                aria-label="Ảnh tiếp"
              >
                <FigmaIcon name="arrowRight" />
              </button>
            </div>
            <div className="signature-view-caption" aria-live="polite" aria-atomic="true">
              <span>{String(slideIdx + 1).padStart(2, '0')} / 04</span>
              <p>{slides[slideIdx].caption}</p>
            </div>
            <div className="signature-thumbnails" role="group" aria-label="Góc nhìn hộp quà">
              {slides.map((slide, idx) => (
                <button key={slide.node} type="button" aria-label={slide.title} aria-pressed={slideIdx === idx} onClick={() => setSlideIdx(idx)}>
                  <img src={assetUrl(`/assets/optimized/gift-thumb-${idx + 1}.webp`)} alt="" width={180} height={120} loading="lazy" decoding="async" />
                  <span>{slide.title}</span>
                </button>
              ))}
            </div>

            {/* 4 Carousel Dots */}
            <div data-figma-node={["96:3010","96:3076","96:3096","96:3116"][slideIdx]} className="signature-dots flex items-center justify-center gap-2 mt-6">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    idx === slideIdx
                      ? 'bg-[#8e6746]'
                      : 'bg-white'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                  aria-current={idx === slideIdx ? 'true' : undefined}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Badge, Title, Quote, 3 Feature Boxes, Price & 2 Buttons */}
          <div className="lg:col-span-6">
            <span className="inline-block px-3.5 py-1 rounded-full border border-[#c89f5d]/60 bg-[#c89f5d]/15 text-[#f7f4d5] text-[12px] font-medium mb-3">
              Quà Tặng Signature Cao Cấp
            </span>

            <h2 id="signature-box-title" className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#f7f4d5] leading-[1.15] mb-4">
              Hộp Quà Trà Đa Hương — &ldquo;TÂM Ý&rdquo;
            </h2>

            <blockquote className="border-l-[3px] border-[#c89f5d] pl-4 py-0.5 italic text-[14px] md:text-[15px] leading-[24px] text-[#f7f4d5]/90 mb-5">
              Giải pháp quà tặng trọn vẹn dành cho các dịp lễ kỷ niệm, Ngày Nhà giáo 20/11 hay ra mắt gia đình. Một chiếc hộp chứa đựng cả 4 phong vị trà trứ danh cùng phụ kiện thủ công kỷ niệm.
            </blockquote>

            {/* 3 Feature Highlight Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="tea" /> 4 Hộp Trà Mộc
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  Bưởi, Nhài, Sói, Cốm
                </p>
              </div>
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="spoon" /> Muỗng Gỗ
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  Phụ kiện thưởng trà
                </p>
              </div>
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="card" /> Thẻ Thông Điệp QR
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  Xem trước lời nhắn 2D
                </p>
              </div>
            </div>

            <div className="font-philosopher font-bold text-[28px] md:text-[32px] text-[#f7f4d5] mb-5">
              {signatureProduct.price.toLocaleString('vi-VN')}đ
            </div>

            <details className="signature-inclusions">
              <summary>Trong hộp quà có gì?</summary>
              <p>{signatureProduct.packaging}</p>
              <ul>
                {signatureProduct.includedFlavors?.map(flavor => <li key={flavor.id}>{flavor.subtitle} · {flavor.title}</li>)}
              </ul>
            </details>

            {onComposeGift && <button className="signature-compose" type="button" onClick={onComposeGift}>Viết lời nhắn cho món quà này <FigmaIcon name="arrowRight" /></button>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onAddToCart(signatureProduct, 1)}
                className="h-[46px] px-6 rounded-full bg-white text-[#203323] font-semibold text-[14.5px] hover:bg-[#f7f4d5] transition-colors flex items-center justify-center gap-2"
              >
                <FigmaIcon name="giftBag" />
                <span>Thêm Vào Giỏ Hàng</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(signatureProduct, 1);
                  onNavigate('checkout');
                }}
                className="h-[46px] px-6 rounded-full bg-[#c89f5d] text-white font-semibold text-[14.5px] hover:bg-[#b58d4b] transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <FigmaIcon name="wallet" /><span>Mua Ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

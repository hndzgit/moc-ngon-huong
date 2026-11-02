import { assetUrl } from '../lib/assets';
import { FigmaArtwork } from './FigmaArtwork';
import { FigmaIcon } from './FigmaIcon';
import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { PageRoute, Product } from '../types';

interface SignatureBoxSectionProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  displayPrice?: number;
}

export const SignatureBoxSection: React.FC<SignatureBoxSectionProps> = ({
  onNavigate,
  onAddToCart,
  displayPrice = 399000,
}) => {
  const signatureProduct =
    PRODUCTS.find((p) => p.id === 'hop-qua-tam-y') || PRODUCTS[4];
  const slides = ['/assets/figma/combo-slide-1.png', ...signatureProduct.gallery.slice(1)];
  const [slideIdx, setSlideIdx] = useState(0);

  const prevSlide = () =>
    setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIdx((i) => (i + 1) % slides.length);

  return (
    <section className="signature-box relative py-14 md:py-20 bg-[#3e5641] text-[#f7f4d5] overflow-hidden">
      <div className="figma-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image Carousel with Arrows & Dots (Figma Component 8 - 96:3135) */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[18px] overflow-hidden shadow-xl aspect-[16/10] bg-[#203323]">
              <img
                src={assetUrl(slides[slideIdx])}
                alt='Hộp Quà Trà Đa Hương — "TÂM Ý"'
                onClick={() => onNavigate('detail', signatureProduct.id)}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Left / Right Carousel Arrows */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-[14px] transition-colors"
                aria-label="Ảnh trước"
              >
                <FigmaIcon name="arrowLeft" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-[14px] transition-colors"
                aria-label="Ảnh tiếp"
              >
                <FigmaIcon name="arrowRight" />
              </button>
            </div>

            {/* 4 Carousel Dots */}
            <div className="flex items-center justify-center gap-2 mt-3.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === slideIdx
                      ? 'w-5 bg-[#c89f5d]'
                      : 'w-2 bg-[#f7f4d5]/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Badge, Title, Quote, 3 Feature Boxes, Price & 2 Buttons */}
          <div className="lg:col-span-6">
            <span className="inline-block px-3.5 py-1 rounded-full border border-[#c89f5d]/60 bg-[#c89f5d]/15 text-[#f7f4d5] text-[12px] font-medium mb-3">
              Quà Tặng Signature Cao Cấp
            </span>

            <h2 className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#f7f4d5] leading-[1.15] mb-4">
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
                  <FigmaArtwork name="spoon" /> Muỗng Gỗ Khắc Tên
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  Gỗ dẻ gai thủ công
                </p>
              </div>
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="card" /> Thiệp Nắn Nót Lời Chúc
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  Hỗ trợ viết tay cá nhân
                </p>
              </div>
            </div>

            <div className="font-philosopher font-bold text-[28px] md:text-[32px] text-[#f7f4d5] mb-5">
              {displayPrice.toLocaleString('en-US')}đ
            </div>

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
                onClick={() => onNavigate('detail', signatureProduct.id)}
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

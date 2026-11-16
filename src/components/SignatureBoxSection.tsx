import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { FigmaArtwork } from './FigmaArtwork';
import { FigmaIcon } from './FigmaIcon';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRODUCTS } from '../data/products';
import { getLocalizedFigmaProductCopy, getLocalizedProduct } from '../data/localizedCatalog';
import { formatVnd, normalizeLocale } from '../lib/locale';
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
  { src: '/source-assets/figma/combo-slide-1.png', node: '96:2989' },
  { src: '/source-assets/figma/originals/gift-96-3129.jpg', node: '96:3129' },
  { src: '/source-assets/figma/originals/gift-96-3091.jpg', node: '96:3091' },
  { src: '/source-assets/figma/originals/gift-96-3111.jpg', node: '96:3111' },
] as const;

export const SignatureBoxSection: React.FC<SignatureBoxSectionProps> = ({
  onNavigate,
  onAddToCart,
  onComposeGift,
}) => {
  const { t, i18n } = useTranslation('home');
  const locale = normalizeLocale(i18n.language);
  const rawSignatureProduct =
    PRODUCTS.find((p) => p.id === 'hop-qua-tam-y') || PRODUCTS[4];
  const signatureProduct = getLocalizedProduct(rawSignatureProduct, locale);
  const viewCopies = t('signatureBox.views', { returnObjects: true }) as ReadonlyArray<{
    title: string;
    caption: string;
  }>;
  const featureBoxes = t('signatureBox.features', { returnObjects: true }) as ReadonlyArray<{
    title: string;
    subtitle: string;
  }>;
  const comboFigmaCopy = getLocalizedFigmaProductCopy('hop-qua-tam-y', locale);

  const slides = GIFT_VIEWS.map((view, idx) => ({
    ...view,
    title: viewCopies[idx]?.title || '',
    caption: viewCopies[idx]?.caption || '',
  }));
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
          <div className="lg:col-span-6" role="region" aria-label={t('signatureBox.regionAria')} aria-roledescription={t('signatureBox.regionRoleDesc')}>
            <div className="relative rounded-[18px] overflow-hidden shadow-xl aspect-[16/10]">
              <button
                type="button"
                className="signature-photo-link"
                aria-label={t('signatureBox.photoLinkAria')}
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
                alt={`${slides[slideIdx].title} — ${t('signatureBox.altProgress', { idx: slideIdx + 1 })}`}
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
                aria-label={t('signatureBox.prevSlideAria')}
              >
                <FigmaIcon name="arrowLeft" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-4 top-1/2 lg:top-[51.90114%] -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(140,131,131,0.2)] lg:backdrop-blur-[19.3px] shadow-[0_-3px_20px_rgba(0,0,0,0.04)] text-white flex items-center justify-center"
                aria-label={t('signatureBox.nextSlideAria')}
              >
                <FigmaIcon name="arrowRight" />
              </button>
            </div>
            <div className="signature-view-caption" aria-live="polite" aria-atomic="true">
              <span>{String(slideIdx + 1).padStart(2, '0')} / 04</span>
              <p>{slides[slideIdx].caption}</p>
            </div>
            <div className="signature-thumbnails" role="group" aria-label={t('signatureBox.viewsAria')}>
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
                  aria-label={t('signatureBox.slideLabel', { idx: idx + 1 })}
                  aria-current={idx === slideIdx ? 'true' : undefined}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Badge, Title, Quote, 3 Feature Boxes, Price & 2 Buttons */}
          <div className="lg:col-span-6">
            <span className="inline-block px-3.5 py-1 rounded-full border border-[#c89f5d]/60 bg-[#c89f5d]/15 text-[#f7f4d5] text-[12px] font-medium mb-3">
              {t('signatureBox.badge')}
            </span>

            <h2 id="signature-box-title" className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#f7f4d5] leading-[1.15] mb-4">
              {t('signatureBox.title')}
            </h2>

            <blockquote className="border-l-[3px] border-[#c89f5d] pl-4 py-0.5 italic text-[14px] md:text-[15px] leading-[24px] text-[#f7f4d5]/90 mb-5">
              {comboFigmaCopy.summary}
            </blockquote>

            {/* 3 Feature Highlight Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="tea" /> {featureBoxes[0]?.title}
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  {featureBoxes[0]?.subtitle}
                </p>
              </div>
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="spoon" /> {featureBoxes[1]?.title}
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  {featureBoxes[1]?.subtitle}
                </p>
              </div>
              <div className="rounded-[10px] border border-[#f7f4d5]/25 bg-white/5 px-3.5 py-2.5">
                <p className="font-semibold text-[12.5px] text-[#f7f4d5]">
                  <FigmaArtwork name="card" /> {featureBoxes[2]?.title}
                </p>
                <p className="text-[11px] text-[#f7f4d5]/75 mt-0.5">
                  {featureBoxes[2]?.subtitle}
                </p>
              </div>
            </div>

            <div className="font-philosopher font-bold text-[28px] md:text-[32px] text-[#f7f4d5] mb-5">
              {formatVnd(rawSignatureProduct.price, locale, 'compact-vi')}
            </div>

            <details className="signature-inclusions">
              <summary>{t('signatureBox.inclusionsSummary')}</summary>
              <p>{signatureProduct.packaging}</p>
              <ul>
                {signatureProduct.includedFlavors?.map(flavor => <li key={flavor.id}>{flavor.subtitle} · {flavor.title}</li>)}
              </ul>
            </details>

            {onComposeGift && <button className="signature-compose" type="button" onClick={onComposeGift}>{t('signatureBox.composeCta')} <FigmaIcon name="arrowRight" /></button>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onAddToCart(rawSignatureProduct, 1)}
                className="h-[46px] px-6 rounded-full bg-white text-[#203323] font-semibold text-[14.5px] hover:bg-[#f7f4d5] transition-colors flex items-center justify-center gap-2"
              >
                <FigmaIcon name="giftBag" />
                <span>{t('signatureBox.addToCart')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(rawSignatureProduct, 1);
                  onNavigate('checkout');
                }}
                className="h-[46px] px-6 rounded-full bg-[#c89f5d] text-white font-semibold text-[14.5px] hover:bg-[#b58d4b] transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <FigmaIcon name="wallet" /><span>{t('signatureBox.buyNow')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import './ProductDetailPage.css';
import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { useChangeMotion } from '../motion/motion';
import {
  FIGMA_PRODUCT_MEDIA,
  FIGMA_PRODUCT_COPY,
  FIGMA_CARD_COPY,
  FIGMA_RELATED_MEDIA,
  FIGMA_DETAIL_GALLERY,
  FigmaGalleryItem,
  figmaImage,
} from '../data/figmaMedia';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState, useEffect, useMemo } from 'react';
import { EMOTION_CARDS, PRODUCTS, REVIEWS } from '../data/products';
import { PageRoute, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: PageRoute, productId?: string) => void;
  cartQuantities: Record<string, number>;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const SERVICE_BADGES = [
  {
    icon: 'group' as const,
    title: 'Hỏa Tốc',
    subtitle: 'Nội thành Hà Nội',
  },
  {
    icon: 'dollar' as const,
    title: 'COD',
    subtitle: 'Thanh toán khi nhận',
  },
  {
    icon: 'box' as const,
    title: 'Hút Chân Không',
    subtitle: 'Theo yêu cầu',
  },
  {
    icon: 'airplane' as const,
    title: 'Giao Hàng Bay',
    subtitle: 'Đà Nẵng, HCM',
  },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
  cartQuantities,
  onUpdateQuantity,
  onAddToCart,
}) => {
  const product =
    PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];

  const media = FIGMA_PRODUCT_MEDIA[product.id];
  const copy = FIGMA_PRODUCT_COPY[product.id];

  const galleryItems = useMemo<FigmaGalleryItem[]>(() => {
    const figmaGallery = FIGMA_DETAIL_GALLERY[product.id];
    if (figmaGallery && figmaGallery.length > 0) {
      return figmaGallery;
    }
    if (media) {
      return [
        {
          full: media.main,
          thumb: media.thumb,
          alt: product.name,
        },
        ...product.gallery.slice(1).map((img, i) => ({
          full: img,
          thumb: img,
          alt: `${product.name} ${i + 2}`,
        })),
      ];
    }
    const imgs = product.gallery.length ? product.gallery : [product.image];
    return imgs.map((img, i) => ({
      full: img,
      thumb: img,
      alt: `${product.name} ${i + 1}`,
    }));
  }, [media, product]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = galleryItems[activeIndex] || galleryItems[0];
  const [buyQty, setBuyQty] = useState(1);
  const [selectedComboFlavor, setSelectedComboFlavor] = useState<typeof EMOTION_CARDS[number] | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'media'>('all');
  const reviewsMotion=useChangeMotion<HTMLDivElement>(activeFilter,undefined,.25);
  const quantityMotion=useChangeMotion<HTMLSpanElement>(buyQty,undefined,.18);

  useEffect(() => {
    setActiveIndex(0);
    setBuyQty(1);
    setSelectedComboFlavor(null);
    if (typeof window !== 'undefined') {
      galleryItems.slice(1).forEach((item) => {
        const img = new Image();
        img.src = assetUrl(item.full);
      });
    }
  }, [galleryItems]);

  const otherProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const selectedFlavorCopy = selectedComboFlavor ? FIGMA_PRODUCT_COPY[selectedComboFlavor.productId] : null;

  const storyData =
    product.id === 'hop-qua-tam-y' && selectedComboFlavor
      ? {
          title: selectedFlavorCopy?.storyTitle || selectedComboFlavor.heading,
          quote: selectedFlavorCopy?.quote || selectedComboFlavor.quote,
          scent: selectedFlavorCopy?.scent || selectedComboFlavor.scentProfile,
          giftFor: selectedFlavorCopy?.giftFor || selectedComboFlavor.occasion,
          image: selectedComboFlavor.image,
        }
      : {
          title: copy?.storyTitle || product.storyTitle,
          quote: copy?.quote || product.storyQuote,
          scent: copy?.scent || product.scentNotes.join(' '),
          giftFor: copy?.giftFor || product.perfectGiftFor.join(' '),
          image: media ? figmaImage(media.story) : product.storyImage,
        };

  return (
    <div className={`product-detail-page ${product.id === 'hop-qua-tam-y' ? 'detail-combo' : ''} bg-[#faf8f3]`}>
      {/* 1. Top Product Showcase Section (Figma 35:3068, 120:6560) */}
      <section className="py-10 md:py-14">
        <div className="figma-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Main Photo + 3 Thumbnails */}
            <div className="lg:col-span-6">
              <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-[#f0ede6] mb-3.5 shadow-sm">
                <MotionImage
                  src={assetUrl(activeSlide.full)}
                  alt={activeSlide.alt || product.name}
                  fetchPriority="high"
                  decoding="async"
                  width={1280}
                  height={960}
                  className={activeSlide.fullFit === 'contain' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'}
                  style={activeSlide.fullPosition ? { objectPosition: activeSlide.fullPosition } : undefined}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 sm:w-3/4">
                {galleryItems.map((item, idx) => (
                  <button
                    key={item.full}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={item.alt || `Ảnh sản phẩm ${idx + 1}`}
                    aria-pressed={activeIndex === idx}
                    className={`relative aspect-[4/3] rounded-[10px] overflow-hidden bg-[#f0ede6] border-2 transition-all ${
                      activeIndex === idx
                        ? 'border-[#3e5641] shadow-xs'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={assetUrl(item.thumb)}
                      loading="eager"
                      decoding="async"
                      width={320}
                      height={240}
                      style={{
                        objectPosition: item.thumbPosition || 'center',
                        transform: item.thumbScale,
                        transformOrigin: item.thumbPosition || 'center',
                      }}
                      alt={item.alt || `${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Product Details, Quantity, Service Badges & CTAs */}
            <div className="lg:col-span-6">
              <h1 className="font-philosopher font-bold text-[30px] sm:text-[38px] lg:text-[42px] text-[#222222] leading-[1.15]">
                {copy?.title || product.name}
              </h1>

              <p className="text-[14px] md:text-[15px] leading-[23px] text-[#555555] mt-2">
                {copy?.summary || product.shortDesc}
              </p>

              <div className="font-philosopher font-bold text-[28px] md:text-[34px] text-[#222222] mt-4">
                {product.price.toLocaleString('en-US')}đ
              </div>

              {/* Quantity Row (Số Lượng / Trong kho: 999) */}
              <div className="mt-5 pt-5 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[14.5px] text-[#222222]">Số Lượng</p>
                  <p className="text-[12px] text-[#777777]">
                    Trong kho: <span className="text-[#9c5435]">{product.stock}</span>
                  </p>
                </div>

                <div className="h-[36px] px-3 rounded-full border border-gray-300 bg-white flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                    className="text-[16px] font-medium text-[#222222] hover:text-[#3e5641] px-1"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span ref={quantityMotion} className="min-w-[18px] text-center font-semibold text-[14px] text-[#222222]">
                    {buyQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => q + 1)}
                    className="text-[16px] font-medium text-[#222222] hover:text-[#3e5641] px-1"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2x2 Included Flavors Selector for Signature Combo "TÂM Ý" (Figma 120:6560) */}
              {product.id === 'hop-qua-tam-y' && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EMOTION_CARDS.map((card) => {
                    const active = selectedComboFlavor?.key === card.key;
                    const codeLabel = card.key === 'THUONG' ? 'THƯƠNG' : card.key === 'CAM' ? 'CẢM' : card.key === 'NHO' ? 'NHỚ' : 'AN';
                    return (
                      <button
                        key={card.key}
                        type="button"
                        onClick={() => setSelectedComboFlavor((prev) => (prev?.key === card.key ? null : card))}
                        aria-pressed={active}
                        className={`text-left rounded-[12px] p-3 border transition-all flex items-center justify-between bg-white ${
                          active
                            ? 'border-[#3e5641] ring-1 ring-[#3e5641]/20'
                            : 'border-gray-200 hover:border-[#3e5641]/50'
                        }`}
                      >
                        <div>
                          <p className="font-minion font-normal text-[17px] text-[#222222] leading-[1.21]">
                            {card.cardTitle}
                          </p>
                          <p className="text-[12px] text-[#666666] mb-1">
                            {card.teaName} – {codeLabel}
                          </p>
                          <span
                            className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: card.pillBg,
                              color: card.pillText,
                            }}
                          >
                            {card.shortPill}
                          </span>
                        </div>
                        <img
                          src={assetUrl(card.illustration)}
                          alt={card.teaName}
                          loading="lazy"
                          decoding="async"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2x2 Service Guarantees Grid */}
              <div className="mt-5 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                {SERVICE_BADGES.map((badge) => (
                  <div
                    key={badge.title}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    <span className="w-7 h-7 rounded-[6px] border border-gray-200 bg-white text-[#3e5641] flex items-center justify-center shrink-0 text-[12px]">
                      <FigmaIcon name={badge.icon} />
                    </span>
                    <div>
                      <p className="font-semibold text-[13px] text-[#222222]">
                        {badge.title}
                      </p>
                      <p className="text-[11.5px] text-[#777777]">
                        {badge.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Thêm Vào Giỏ Hàng & Mua Ngay */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => onAddToCart(product, buyQty)}
                  className="h-[46px] rounded-full border border-[#3e5641] text-[#3e5641] bg-white font-semibold text-[14.5px] hover:bg-[#3e5641]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <FigmaIcon name="detailBag" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product, buyQty);
                    onNavigate('checkout');
                  }}
                  className="h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[14.5px] hover:bg-[#203323] transition-colors shadow-xs"
                >
                  <FigmaIcon name="detailWallet" /> Mua Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dark-Green Storytelling Banner (#3e5641) */}
      <section className="detail-story relative py-12 md:py-16 bg-[#3e5641] text-[#f7f4d5]">
        <img src={assetUrl("/assets/optimized/illus-lache-green.webp")} alt="" aria-hidden="true" loading="lazy" decoding="async" width={400} height={400} className="detail-leaf-left pointer-events-none absolute" />
        <img src={assetUrl("/assets/optimized/illus-lache-green.webp")} alt="" aria-hidden="true" loading="lazy" decoding="async" width={400} height={400} className="detail-leaf-right pointer-events-none absolute" />
        <img src={assetUrl("/assets/optimized/illus-nui.webp")} alt="" aria-hidden="true" loading="lazy" decoding="async" width={600} height={300} className="detail-mountain pointer-events-none absolute" />
        <div className="figma-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-[16px] overflow-hidden shadow-lg aspect-[4/3]">
                <img
                  src={assetUrl(storyData.image)}
                  alt={storyData.title}
                  loading="lazy" decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-philosopher font-bold text-[26px] sm:text-[34px] text-[#f7f4d5] leading-[1.2]">
                {storyData.title}
              </h2>

              <blockquote className="border-l-[3px] border-[#c89f5d] pl-4 py-0.5 italic text-[14px] md:text-[15px] leading-[24px] text-[#f7f4d5]/90">
                {storyData.quote}
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="rounded-[10px] border border-[#f7f4d5]/30 bg-white/5 px-4 py-3">
                  <h3 className="text-[11.5px] text-[#f7f4d5]/70 mb-0.5">
                    Tầng hương:
                  </h3>
                  <p className="text-[13px] font-medium text-[#f7f4d5]">
                    {storyData.scent}
                  </p>
                </div>

                <div className="rounded-[10px] border border-[#f7f4d5]/30 bg-white/5 px-4 py-3">
                  <h3 className="text-[11.5px] text-[#f7f4d5]/70 mb-0.5">
                    Món quà hoàn hảo cho:
                  </h3>
                  <p className="text-[13px] font-medium text-[#f7f4d5]">
                    {storyData.giftFor}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Related Products 4-Column Row ("Các sản phẩm khác của Mộc Ngôn Hương") — ABOVE Reviews as in Figma 35:3068 */}
      <section className="py-12 md:py-16 bg-[#faf8f3]">
        <div className="figma-container">
          <h2 className="font-philosopher font-bold text-[24px] sm:text-[30px] text-[#222222] text-center mb-8">
            Các sản phẩm khác của Mộc Ngôn Hương
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                displayTitle={FIGMA_CARD_COPY[item.id]?.title}
                displayDescription={FIGMA_CARD_COPY[item.id]?.description}
                displayNote={FIGMA_CARD_COPY[item.id]?.note}
                imageSrc={FIGMA_RELATED_MEDIA[item.id] || item.image}
                quantity={cartQuantities[item.id] || 0}
                onUpdateQuantity={onUpdateQuantity}
                onSelect={(id) => onNavigate('detail', id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Customer Reviews Section ("Đánh giá sản phẩm") */}
      <section className="pb-16 md:pb-20 pt-4 bg-[#faf8f3]">
        <div className="figma-container">
          <div className="bg-white rounded-[18px] p-6 sm:p-10 border border-black/5 shadow-xs">
            <h2 className="font-philosopher font-bold text-[24px] md:text-[28px] text-[#222222] text-center mb-8">
              Đánh giá sản phẩm
            </h2>

            {/* Rating Summary Header */}
            <div className="review-summary flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                {/* Score 4.8 */}
                <div className="text-center sm:text-left">
                  <div className="font-philosopher font-bold text-[36px] md:text-[42px] leading-none text-[#222222]">
                    {product.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[#3e5641] my-1.5 text-[14px]">
                    <FigmaIcon name="star" />
                    <FigmaIcon name="star" />
                    <FigmaIcon name="star" />
                    <FigmaIcon name="star" />
                    <FigmaIcon name={product.rating < 5 ? "halfStar" : "star"} />
                  </div>
                  <p className="text-[12px] text-[#777777]">
                    {product.reviewsCount} đánh giá
                  </p>
                </div>

                {/* 5 Progress Bars */}
                <div className="space-y-1.5 min-w-[200px] sm:min-w-[240px]">
                  {[
                    { star: 5, pct: '85%' },
                    { star: 4, pct: '12%' },
                    { star: 3, pct: '3%' },
                    { star: 2, pct: '0%' },
                    { star: 1, pct: '0%' },
                  ].map((row) => (
                    <div key={row.star} className="flex items-center gap-2 text-[12px]">
                      <span className="w-3 text-[#444444]">{row.star}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-[#3e5641] rounded-full"
                          style={{ width: row.pct }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="h-[34px] px-3.5 rounded-[8px] border border-gray-200 text-[12.5px] text-[#222222] hover:border-[#3e5641] transition-colors flex items-center gap-1.5"
                >
                  <span>Lọc: Gần nhất</span>
                  <img src={assetUrl("/assets/figma/icon-chevron-down.svg")} width="24" height="24" alt="" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="h-[34px] px-3.5 rounded-[8px] border border-gray-200 text-[12.5px] text-[#222222] hover:border-[#3e5641] transition-colors flex items-center gap-1.5"
                >
                  <span>Đánh giá</span>
                  <img src={assetUrl("/assets/figma/icon-chevron-down.svg")} width="24" height="24" alt="" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-pressed={activeFilter === 'media'}
                  onClick={() =>
                    setActiveFilter((f) => (f === 'media' ? 'all' : 'media'))
                  }
                  className={`h-[34px] px-3.5 rounded-[8px] border text-[12.5px] transition-colors ${
                    activeFilter === 'media'
                      ? 'border-[#3e5641] bg-[#3e5641] text-[#f7f4d5]'
                      : 'border-gray-200 text-[#222222] hover:border-[#3e5641]'
                  }`}
                >
                  Có hình ảnh / video
                </button>
              </div>
            </div>

            {/* Review Cards List matching Figma 35:3068 */}
            <div ref={reviewsMotion} className="review-list divide-y divide-gray-100">
              {REVIEWS.filter((_, idx) => activeFilter !== 'media' || idx === 0).map((rev, idx) => (
                <div key={rev.id} className="py-6 flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div className="sm:w-[180px] shrink-0 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#3e5641] text-[#f7f4d5] flex items-center justify-center text-[12px] shrink-0">
                      <FigmaIcon name="avatar" />
                    </div>
                    <div>
                      <p className="font-bold text-[13.5px] text-[#222222]">
                        {rev.author}
                      </p>
                      <p className="text-[11px] text-[#3e5641]">
                        <FigmaIcon name="verifiedReview" /> Xác nhận đã mua hàng
                      </p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-0.5 text-[#3e5641] text-[13px]">
                        <FigmaIcon name="star" />
                        <FigmaIcon name="star" />
                        <FigmaIcon name="star" />
                        <FigmaIcon name="star" />
                        <FigmaIcon name="star" />
                      </div>
                      <span className="text-[11.5px] text-[#888888]">{rev.date}</span>
                    </div>

                    <p className="font-semibold text-[13px] text-[#222222] mb-1">
                      {product.name}
                    </p>
                    <p className="text-[13px] leading-[20px] text-[#555555] mb-3 max-w-[540px]">
                      Cảm giác khi uống và rất thư thái, tôi đã mua và uống hàng ngày, sẽ tiếp tục ủng hộ
                    </p>

                    {idx === 0 && (
                      <div className="review-photo relative w-[150px] h-[200px] overflow-hidden"><img loading="lazy" decoding="async"
                        src={assetUrl("/assets/optimized/an-hand-800.webp")}
                        alt="Ảnh thực tế khách hàng"
                        className="absolute max-w-none"
                        style={{ width:'228.15%', height:'230.5%', left:'-94.9%', top:'-51.44%' }}
                        width={800}
                        height={800}
                      /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

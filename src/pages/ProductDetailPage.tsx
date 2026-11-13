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
import { EMOTION_CARDS, PRODUCTS } from '../data/products';
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

              {/* Quantity Row (Số Lượng / Tình trạng) */}
              <div className="mt-5 pt-5 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[14.5px] text-[#222222]">Số Lượng</p>
                  <p className="text-[12px] text-[#3e5641]">
                    Còn hàng • Đóng gói thủ công
                  </p>
                </div>

                <div className="h-[36px] px-3 rounded-full border border-gray-300 bg-white flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                    disabled={buyQty <= 1}
                    className="text-[16px] font-medium text-[#222222] hover:text-[#3e5641] px-1 disabled:opacity-35 disabled:cursor-not-allowed"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span ref={quantityMotion} className="min-w-[18px] text-center font-semibold text-[14px] text-[#222222]">
                    {buyQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.min(99, product.stock, q + 1))}
                    disabled={buyQty >= Math.min(99, product.stock)}
                    className="text-[16px] font-medium text-[#222222] hover:text-[#3e5641] px-1 disabled:opacity-35 disabled:cursor-not-allowed"
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

      {/* 4. Honest Customer Reviews Section ("Đánh giá sản phẩm") */}
      <section className="pb-16 md:pb-20 pt-4 bg-[#faf8f3]">
        <div className="figma-container">
          <div className="bg-white rounded-[18px] p-6 sm:p-10 border border-black/5 shadow-xs text-center">
            <h2 className="font-philosopher font-bold text-[24px] md:text-[28px] text-[#222222] mb-3">
              Đánh giá sản phẩm
            </h2>
            <p className="text-[15px] font-medium text-[#3e5641] mb-2">
              Chưa có đánh giá trực tuyến cho sản phẩm này
            </p>
            <p className="text-[13.5px] leading-[22px] text-[#666666] max-w-[560px] mx-auto mb-6">
              Mộc Ngôn Hương chỉ đăng tải nhận xét xác thực từ khách hàng đã hoàn tất đơn hàng và trải nghiệm trà. Nếu bạn cần tư vấn chọn hương trà phù hợp, đội ngũ tiệm trà luôn sẵn sàng hỗ trợ.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="h-[42px] px-6 rounded-full border border-[#3e5641] text-[#3e5641] hover:bg-[#3e5641] hover:text-[#f7f4d5] transition-colors font-medium text-[13.5px]"
            >
              Liên hệ tư vấn trực tiếp
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

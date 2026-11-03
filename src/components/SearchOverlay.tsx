import { assetUrl } from '../lib/assets';
import { usePresenceMotion } from '../motion/motion';
import { useDialogLifecycle } from './useDialogLifecycle';
import { FigmaIcon } from './FigmaIcon';
import React, { useState, useMemo } from 'react';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { FIGMA_CARD_COPY, FIGMA_LISTING_MEDIA } from '../data/figmaMedia';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  cartQuantities: Record<string, number>;
  onUpdateQuantity: (product: Product, delta: number) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  cartQuantities,
  onUpdateQuantity,
}) => {
  const {ref,present,phase}=usePresenceMotion<HTMLDivElement>(isOpen,'search');
  useDialogLifecycle(present,onClose,ref);
  const [query, setQuery] = useState('');
  const [recentViewed, setRecentViewed] = useState<Product[]>([
    PRODUCTS[0],
  ]);

  const filteredProducts = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
    const q = normalize(query.trim());
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        normalize(p.name).includes(q) ||
        normalize(p.shortName).includes(q) ||
        normalize(p.emotionLabel).includes(q) ||
        normalize(p.shortDesc).includes(q)
    );
  }, [query]);

  if (!present) return null;

  const handleSelect = (productId: string) => {
    const found =
      PRODUCTS.find((p) => p.id.startsWith(productId)) ||
      PRODUCTS.find((p) => p.id === productId);
    if (found) {
      setRecentViewed((prev) => [
        found,
        ...prev.filter((item) => item.id !== found.id),
      ].slice(0, 5));
    }
    onSelectProduct(productId);
    onClose();
  };

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && filteredProducts.length === 0;

  return (
    <div ref={ref} data-motion-phase={phase} className="search-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 backdrop-blur-[2px] p-4 sm:p-6 md:pt-20">
      {/* Backdrop click receiver */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Centered White Rounded Search Card (Figma 127:12938, 127:13466, 127:13960 - max-w-[1290px]) */}
      <div inert={!isOpen} role="dialog" aria-modal="true" aria-label="Tìm kiếm sản phẩm" className="search-card relative z-10 w-full max-w-[1680px] bg-white rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.3)] p-6 sm:p-8 lg:p-10 my-auto md:my-0">
        {/* Top Search Input Pill */}
        <div className="relative flex items-center w-full h-[52px] rounded-full border border-[#222222]/35 bg-white px-5 mb-7 focus-within:border-[#3e5641] focus-within:ring-2 focus-within:ring-[#3e5641]/15">
          <img
            src={assetUrl("/assets/figma/icon-search.svg")}
            alt=""
            className="w-5 h-5 opacity-60 mr-3 shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm sản phẩm"
            autoFocus
            className="w-full bg-transparent text-[15px] md:text-[16px] text-[#222222] placeholder:text-[#888888] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (query) {
                setQuery('');
              } else {
                onClose();
              }
            }}
            className="ml-2 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#555555] text-[16px] shrink-0"
            aria-label={query ? 'Xóa từ khóa' : 'Đóng tìm kiếm'}
          >
            <FigmaIcon name="closeModal" />
          </button>
        </div>

        {/* Variant 3: Empty Search Result Message (Figma 127:13960) */}
        {noResults && (
          <div className="py-6 mb-4 text-center">
            <p className="text-[15px] md:text-[16px] text-[#444444]">
              Không tìm thấy kết quả nào cho &ldquo;
              <span className="font-semibold text-[#222222]">{query}</span>
              &rdquo;. Hãy thử tìm kiếm khác
            </p>
          </div>
        )}

        {/* Variant 1: Recently Viewed Row (Figma 127:12938) */}
        {!hasQuery && recentViewed.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-philosopher font-bold text-[20px] md:text-[22px] text-[#222222]">
                Đã xem gần đây
              </h3>
              <button
                type="button"
                onClick={() => setRecentViewed([])}
                className="text-[14px] text-[#666666] hover:text-[#222222] transition-colors"
              >
                Xóa
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {recentViewed.map((product) => (
                <ProductCard
                  key={`recent-${product.id}`}
                  product={product}
                  displayTitle={FIGMA_CARD_COPY[product.id]?.title}
                  displayDescription={FIGMA_CARD_COPY[product.id]?.subtitle}
                  quantity={cartQuantities[product.id] || 0}
                  onUpdateQuantity={onUpdateQuantity}
                  onSelect={handleSelect}
                  imageSrc={FIGMA_LISTING_MEDIA[product.id] || product.image}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {/* Main 5-Column Product Row: "Sản phẩm của Mộc Ngôn Hương" */}
        {!noResults && <div>
          <h3 className="font-philosopher font-bold text-[20px] md:text-[22px] text-[#222222] mb-4">
            Sản phẩm của Mộc Ngôn Hương
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {(noResults ? PRODUCTS : filteredProducts).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                displayTitle={FIGMA_CARD_COPY[product.id]?.title}
                displayDescription={FIGMA_CARD_COPY[product.id]?.subtitle}
                quantity={cartQuantities[product.id] || 0}
                onUpdateQuantity={onUpdateQuantity}
                onSelect={handleSelect}
                imageSrc={FIGMA_LISTING_MEDIA[product.id] || product.image}
                compact
              />
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
};

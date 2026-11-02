import { assetUrl } from '../lib/assets';
import { FigmaIcon } from './FigmaIcon';
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onSelect: (productId: string) => void;
  imageSrc?: string;
  displayTitle?: string;
  displayDescription?: string;
  displayNote?: string;
  compact?: boolean;
  large?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onUpdateQuantity,
  onSelect,
  compact = false,
  large = false,
  imageSrc,
  displayTitle,
  displayDescription,
  displayNote,
}) => {
  const detailId = product.id.endsWith('-le')
    ? product.id === 'combo-tam-y-le'
      ? 'hop-qua-tam-y'
      : product.id.replace('-le', '')
    : product.id;

  return (
    <div
      className={`product-card ${large ? 'product-card-large' : ''} ${displayNote ? 'product-card-with-note' : ''} group flex flex-col bg-white rounded-[14px] ${
        large ? 'p-4 md:p-5' : 'p-3.5'
      } border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_rgba(32,51,35,0.1)] transition-all`}
    >
      {/* Product Thumbnail */}
      <div
        onClick={() => onSelect(detailId)}
        className={`relative w-full ${
          large ? 'aspect-[16/10]' : 'aspect-[4/3]'
        } rounded-[10px] overflow-hidden bg-[#f0ede6] cursor-pointer`}
      >
        <img
          src={assetUrl(imageSrc || product.image)}
          alt={product.shortName || product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Title, Short Description & Price + Stepper Bar */}
      <div className="pt-3 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelect(detailId)}
            className={`font-philosopher font-bold ${
              large
                ? 'text-[22px] md:text-[26px]'
                : compact
                ? 'text-[16px]'
                : 'text-[18px] md:text-[19px]'
            } text-[#222222] group-hover:text-[#3e5641] transition-colors cursor-pointer line-clamp-1`}
          >
            {displayTitle || (large ? product.name : product.shortName || product.name)}
          </h3>
          {(!compact || displayDescription) && (
            <p
              className={`${
                large ? 'text-[14px] leading-[22px] mt-1.5' : 'text-[12.5px] leading-[18px] mt-1'
              } text-[#666666] ${!large && displayDescription ? 'line-clamp-3' : 'line-clamp-2'}`}
            >
              {displayDescription || product.shortDesc}
            </p>
          )}
          {displayNote && <p className="product-card-note">{displayNote}</p>}
        </div>

        {/* Bottom Price (Left) + (- 0 +) Stepper (Right) matching Figma 56:1033 & 77:2583 */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelect(detailId)}
            className={`font-bold ${
              large ? 'text-[20px] md:text-[22px]' : 'text-[15px] md:text-[16px]'
            } text-[#222222] hover:text-[#3e5641] transition-colors text-left`}
          >
            {product.price.toLocaleString('en-US')}đ
          </button>

          <div
            className="h-[32px] px-2 rounded-full border border-gray-200 bg-[#faf8f3] flex items-center gap-2.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onUpdateQuantity(product, -1)}
              disabled={quantity <= 0}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[#222222] hover:bg-white disabled:opacity-35 transition-colors font-semibold text-[14px] leading-none"
              aria-label="Giảm số lượng"
            >
              <FigmaIcon name={large ? 'minusLarge' : 'minus'} />
            </button>
            <span className="min-w-[14px] text-center text-[12.5px] font-semibold text-[#222222]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(product, 1)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[#222222] hover:bg-white transition-colors font-semibold text-[14px] leading-none"
              aria-label="Tăng số lượng"
            >
              <FigmaIcon name={large ? 'plusLarge' : 'plus'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

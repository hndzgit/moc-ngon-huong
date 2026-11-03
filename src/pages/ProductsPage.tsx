import { FIGMA_LISTING_MEDIA, FIGMA_PRODUCT_COPY, FIGMA_LISTING_COPY, figmaImage } from '../data/figmaMedia';
import React from 'react';
import { LISTING_PRODUCTS } from '../data/products';
import { PageRoute, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SignatureBoxSection } from '../components/SignatureBoxSection';

interface ProductsPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  cartQuantities: Record<string, number>;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onNavigate,
  cartQuantities,
  onUpdateQuantity,
  onAddToCart,
}) => {
  return (
    <div className="products-page bg-[#faf8f3]">
      {/* 1. Top Cream Title Header (Figma 77:2583) */}
      <section className="py-12 md:py-16 text-center bg-[#faf8f3]">
        <div className="figma-container max-w-[780px] mx-auto">
          <p className="text-[13px] md:text-[14px] font-medium uppercase tracking-[0.22em] text-[#9c5435] mb-2">
            MỘC NGÔN HƯƠNG
          </p>
          <h1 className="font-philosopher font-bold text-[34px] sm:text-[46px] lg:text-[56px] text-[#3e5641] leading-[1.15] mb-2">
            Danh Sách Sản Phẩm
          </h1>
          <p className="italic text-[14.5px] md:text-[16px] text-[#666666]">
            &ldquo;Một tách trà, đôi khi là lý do để chúng ta ngồi lại.&rdquo;
          </p>
        </div>
      </section>

      {/* 2. Featured Dark-Green Signature Gift Box "TÂM Ý" Carousel Section (399,000đ) */}
      <SignatureBoxSection
        onNavigate={onNavigate}
        onAddToCart={onAddToCart}
        displayPrice={399000}
      />

      {/* 3. 2x2 Large Product Grid of the 4 Tea Sets (289,000đ) */}
      <section className="py-14 md:py-20 bg-[#faf8f3]">
        <div className="figma-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {LISTING_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                imageSrc={FIGMA_LISTING_MEDIA[product.id] || product.image}
                displayTitle={FIGMA_PRODUCT_COPY[product.id].title}
                displayDescription={FIGMA_LISTING_COPY[product.id]}
                quantity={cartQuantities[product.id] || 0}
                onUpdateQuantity={onUpdateQuantity}
                onSelect={(id) => onNavigate('detail', id)}
                large
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

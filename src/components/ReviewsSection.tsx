import { assetUrl } from '../lib/assets';
import { FigmaIcon } from './FigmaIcon';
import React from 'react';
import { REVIEWS } from '../data/products';

export const ReviewsSection: React.FC = () => {
  const featuredReviews = REVIEWS.slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-[#fbfaf5]">
      <div className="figma-container">
        <div className="text-center max-w-[760px] mx-auto mb-12 md:mb-14">
          <span className="text-[14px] font-semibold uppercase tracking-widest text-[#c89f5d]">
            Cảm Nhận Từ Khách Hàng
          </span>
          <h2 className="font-philosopher font-bold text-[32px] sm:text-[42px] lg:text-[48px] text-[#3e5641] mt-2">
            Những Câu Chuyện Trao Hương Đầy Cảm Xúc
          </h2>
          <p className="text-[15px] md:text-[17px] text-[#5f5c5c] mt-3 leading-relaxed">
            Hơn 5,000 hộp quà tâm ý đã được gửi trao đến Ông Bà, Cha Mẹ, Thầy Cô và những người thương quý trên khắp mọi miền.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-[20px] p-7 border border-[#e5e5e5] shadow-card flex flex-col justify-between"
            >
              <div>
                {/* Top Rating & Verified Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#c89f5d]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <FigmaIcon key={idx} name="star" />
                    ))}
                  </div>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3e5641] bg-[#3e5641]/10 px-2.5 py-1 rounded-full">
                      <FigmaIcon name="check" /> Đã mua hàng
                    </span>
                  )}
                </div>

                {rev.title && (
                  <h3 className="font-philosopher font-bold text-[20px] text-[#222222] mb-2">
                    “{rev.title}”
                  </h3>
                )}

                <p className="text-[14px] sm:text-[15px] text-[#3d3d3d] leading-relaxed">
                  {rev.comment}
                </p>

                {/* Review Photo Thumbnail if available */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2.5 mt-4">
                    {rev.images.map((img, i) => (
                      <img
                        key={i}
                        src={assetUrl(img)}
                        alt={rev.productName}
                        className="w-16 h-16 rounded-[10px] object-cover border border-[#e5e5e5]"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-[#f0ede6] flex items-center gap-3">
                <img
                  src={assetUrl(rev.avatar)}
                  alt={rev.author}
                  className="w-11 h-11 rounded-full object-cover border border-[#c89f5d]"
                />
                <div className="min-w-0">
                  <h4 className="font-philosopher font-bold text-[17px] text-[#222222] truncate">
                    {rev.author}
                  </h4>
                  <p className="text-[12px] text-[#6b6b6b] truncate">
                    {rev.productName} • {rev.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

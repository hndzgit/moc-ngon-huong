import { assetUrl } from '../lib/assets';
import React from 'react';
import { PageRoute } from '../types';

interface StepsSectionProps {
  onNavigate: (page: PageRoute) => void;
}

export const StepsSection: React.FC<StepsSectionProps> = ({ onNavigate }) => {
  const steps = [
    {
      number: '01',
      title: 'Chọn Tầng Hương Cảm Xúc',
      desc: 'Lựa chọn vị trà đại diện cho lời muốn nói: AN (Bình yên), THƯƠNG (Yêu thương), CẢM (Tri ân), NHỚ (Ký ức) hoặc trọn bộ hộp quà TÂM Ý.',
      iconImg: '/assets/figma/icon-step-scroll.png'
    },
    {
      number: '02',
      title: 'Viết Lời Nhắn Tâm Ý (Miễn Phí)',
      desc: 'Tự tay soạn lời chúc hoặc sử dụng Trợ lý AI của Mộc Ngôn Hương để gợi ý những câu chúc sâu sắc, in lên tấm thiệp xanh trang nhã.',
      iconImg: '/assets/figma/icon-step-envelope.png'
    },
    {
      number: '03',
      title: 'Đóng Gói Chỉn Chu & Trao Tặng',
      desc: 'Hộp trà được đóng gói cẩn thận kèm túi vải đay, muỗng gỗ và giao tận tay người nhận miễn phí vận chuyển trên toàn quốc.',
      iconImg: '/assets/figma/logo-header.png'
    }
  ];

  return (
    <section className="relative py-16 md:py-24 bg-[#f5f2ed] overflow-hidden">
      {/* Decorative green tea leaves illustration matching Figma 56:1033 */}
      <img
        src={assetUrl("/assets/optimized/illus-lache-green.webp")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={320}
        height={320}
        className="pointer-events-none select-none absolute -bottom-10 -left-10 w-[240px] md:w-[320px] opacity-30 object-contain"
      />
      <img
        src={assetUrl("/assets/optimized/illus-lache-green.webp")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={320}
        height={320}
        className="pointer-events-none select-none absolute -top-10 -right-10 w-[240px] md:w-[320px] opacity-25 object-contain rotate-180"
      />

      <div className="figma-container relative z-10">
        <div className="text-center max-w-[760px] mx-auto mb-12 md:mb-16">
          <span className="text-[14px] font-semibold uppercase tracking-widest text-[#c89f5d]">
            Quy Trình Tặng Quà Tinh Tế
          </span>
          <h2 className="font-philosopher font-bold text-[32px] sm:text-[42px] lg:text-[48px] text-[#3e5641] mt-2">
            Gửi Trao Tâm Ý Chỉ Với 3 Bước Giản Dị
          </h2>
          <p className="text-[15px] md:text-[17px] text-[#5f5c5c] mt-3 leading-relaxed">
            Mỗi hộp trà Mộc Ngôn Hương đều đi kèm tấm thiệp viết tay miễn phí để món quà của bạn trọn vẹn cả hương lẫn tình.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative bg-white rounded-[20px] p-8 border border-[#e5e5e5] shadow-card hover:shadow-elevated transition-all flex flex-col items-center text-center"
            >
              {/* Step Number Badge */}
              <div className="absolute top-5 right-5 font-philosopher font-bold text-[32px] text-[#3e5641]/15">
                {step.number}
              </div>

              {/* Icon Frame (matching 96:2976 scroll & envelope icons) */}
              <div className="w-24 h-24 rounded-2xl bg-[#fbfaf5] border border-[#e5e5e5] p-3 flex items-center justify-center mb-6">
                <img
                  src={assetUrl(step.iconImg)}
                  alt={step.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <span className="px-3 py-0.5 rounded-full bg-[#3e5641]/10 text-[#3e5641] text-[13px] font-semibold mb-3">
                Bước {index + 1}
              </span>

              <h3 className="font-philosopher font-bold text-[24px] text-[#222222]">
                {step.title}
              </h3>

              <p className="mt-3 text-[14px] sm:text-[15px] text-[#5f5c5c] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => onNavigate('checkout')}
            className="h-[52px] px-9 rounded-full bg-[#3e5641] hover:bg-[#2f4232] text-[#f7f4d5] font-semibold text-[16px] shadow-md transition-colors"
          >
            Thử Tạo Thiệp Tâm Ý Ngay →
          </button>
        </div>
      </div>
    </section>
  );
};

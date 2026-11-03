import { assetUrl } from '../lib/assets';
import React from 'react';
import { Leaf, Sun, Heart, Award } from 'lucide-react';
import elem14 from '../assets/elem_14.webp';
import elem16 from '../assets/elem_16.webp';
import elem18 from '../assets/elem_18.webp';

export const CraftmanshipSection: React.FC = () => {
  return (
    <section className="py-20 lg:py-28 bg-rice relative overflow-hidden">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text & Story */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest uppercase text-sage">
              <Leaf className="w-3.5 h-3.5" />
              <span>Nghệ Thuật Ướp Hoa Tự Nhiên</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest tracking-tight leading-tight">
              Hương Hoa Thân Thuộc Đánh Thức Miền Ký Ức
            </h2>

            <p className="text-sm sm:text-base text-tea-charcoal/80 font-light leading-relaxed">
              Hương bưởi sau vườn mẹ, hoa nhài đêm hè thanh khiết, hoa sói cổ truyền hay nốt cốm ngậy thơm mùa gặt. Những nốt hương mang theo linh hồn làng quê đánh thức miền ký ức bình yên trong lòng mỗi người con đất Việt.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-forest/5 text-forest flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-forest text-base">Thu Hái Đúng Thời Khắc</h4>
                  <p className="text-xs text-tea-muted font-light mt-0.5">
                    Hoa bưởi hái khi vừa hé nở lúc bình minh; hoa nhài thu hoạch lúc hoàng hôn để hương thơm giữ được trọn vẹn tinh dầu tự nhiên.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-forest/5 text-forest flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-forest text-base">Búp Chè Tân Cương & La Bằng</h4>
                  <p className="text-xs text-tea-muted font-light mt-0.5">
                    100% búp chè 1 tôm 2 lá non mơn mởn, sao suốt bằng tay bởi nghệ nhân giàu kinh nghiệm, cho nước trà trong xanh ánh vàng mật ong.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white border border-tea-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-forest/5 text-forest flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-red-700/80" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-forest text-base">5 Lần Ướp & Sấy Than Củi</h4>
                  <p className="text-xs text-tea-muted font-light mt-0.5">
                    Mỗi mẻ trà được ủ đan xen hoa tươi qua 5 lượt liên tiếp, sấy khô nhẹ nhàng bằng nhiệt than hoa để hương hoa quyện sâu vào từng sớ trà.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2 text-xs text-sage font-medium">
              <span>#HuongHoaViet</span>
              <span>•</span>
              <span>#KyUcTuoiTho</span>
              <span>•</span>
              <span>#CheThaiNguyen</span>
            </div>
          </div>

          {/* Right Visual Collage */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated border border-tea-border bg-rice-dark">
                <img
                  src={assetUrl(elem16)}
                  alt="Búp trà Thái Nguyên"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-5 rounded-2xl bg-forest text-rice text-center">
                <span className="font-serif text-3xl font-bold text-gold block">100%</span>
                <span className="text-xs text-rice/80 font-light">Nguyên liệu tự nhiên thuần khiết</span>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 pt-8">
              <div className="p-5 rounded-2xl bg-white border border-tea-border text-center shadow-xs">
                <span className="font-serif text-3xl font-bold text-forest block">5 Đợt</span>
                <span className="text-xs text-tea-muted font-light">Ủ ướp hoa tươi truyền thống</span>
              </div>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated border border-tea-border bg-rice-dark">
                <img
                  src={assetUrl(elem18)}
                  alt="Ướp hoa truyền thống"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

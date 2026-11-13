import { useState, useEffect, useRef } from 'react';
import { assetUrl } from '../lib/assets';
import type { CartItem, PageRoute, PaymentStatus } from '../types';
import { FIGMA_PRODUCT_COPY, getOrderMedia } from '../data/figmaMedia';
import confetti from 'canvas-confetti';
import {
  Check,
  Copy,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export interface OrderConfirmationProps {
  items: CartItem[];
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  payment: string;
  paymentMethod?: 'cod' | 'bank';
  paymentStatus?: PaymentStatus | string;
  shippingMode?: 'delivery' | 'pickup';
  orderCode?: string;
  orderDate?: string;
  orderStatus?: string;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  total?: number;
  note?: string;
  onNavigate: (page: PageRoute) => void;
}

export function OrderConfirmation({
  items,
  fullName,
  phone,
  email,
  address,
  payment,
  paymentMethod = 'cod',
  paymentStatus,
  shippingMode = 'delivery',
  orderCode,
  orderDate,
  orderStatus = 'Đang chuẩn bị',
  subtotal: propSubtotal,
  shippingFee: propShippingFee = 0,
  discount: propDiscount = 0,
  total: propTotal,
  note,
  onNavigate,
}: OrderConfirmationProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>{clearTimeout(copyTimer.current);},[]);

  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const subtotal = propSubtotal ?? calculatedSubtotal;
  const shippingFee = propShippingFee;
  const discount = propDiscount;
  const total = propTotal ?? (subtotal + shippingFee - discount);

  const money = (n: number) => `${n.toLocaleString('en-US')}đ`;

  useEffect(() => {
    // Smooth scroll to top on mount
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth' });

    // Restrained, luxury confetti launch if not reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.35 },
          colors: ['#3E5641', '#C89F5D', '#FAF8F3', '#738676', '#D4AF37'],
          ticks: 200,
          gravity: 0.8,
          scalar: 0.9,
        });
      } catch {
        // Safe fallback if canvas is unavailable
      }
    }
    return ()=>{confetti.reset();};
  }, []);

  const handleCopyCode = async () => {
    if (!orderCode) return;
    try {
      await navigator.clipboard.writeText(orderCode);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current=setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <section
      className="order-confirmation-section min-h-screen py-12 md:py-20 bg-[#FAF8F3] text-[#222222] font-sans"
      data-figma-node="77:3506"
    >
      <div className="max-w-[880px] mx-auto px-4 sm:px-6">
        
        {/* Animated Success Badge & Header */}
        <div className="text-center mb-10 md:mb-12 checkout-section-animate">
          <div className="flex justify-center mb-5">
            <div className="relative order-success-badge">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#3E5641] to-[#2B3C2D] flex items-center justify-center text-[#F7F4D5] shadow-xl order-gold-ring border-4 border-[#FAF8F3]">
                <Check className="w-10 h-10 md:w-12 md:h-12 stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C89F5D] flex items-center justify-center text-white shadow-md border-2 border-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <p className="font-serif text-[#C89F5D] tracking-[.25em] text-[12px] md:text-[13px] uppercase font-semibold mb-2">
            MỘC NGÔN HƯƠNG • TRÀ THỦ CÔNG
          </p>
          <h1 className="font-philosopher text-[#3E5641] font-bold text-[32px] sm:text-[44px] md:text-[52px] leading-tight tracking-wide">
            ĐẶT HÀNG THÀNH CÔNG!
          </h1>
          <p className="mt-3 text-[#666666] text-[15px] sm:text-[16px] md:text-[17px] max-w-xl mx-auto leading-relaxed">
            Đơn hàng của bạn đã được ghi nhận. Mộc Ngôn Hương đang chuẩn bị đơn hàng để sớm trao gửi đến bạn.
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="h-[1px] w-12 bg-[#C89F5D]/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#C89F5D]" />
            <span className="h-[1px] w-12 bg-[#C89F5D]/30" />
          </div>
        </div>

        {/* Main Luxury Receipt Container */}
        <div className="order-receipt bg-white rounded-[24px] p-6 sm:p-8 md:p-10 shadow-sm border border-[#E5DFD5]">
          
          {/* Top Order Code & Status Strip */}
          {orderCode && (
            <div className="bg-[#FAF8F3] rounded-[18px] p-5 sm:p-6 mb-8 border border-[#E5DFD5]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
                <div>
                  <span className="text-[12px] font-semibold tracking-wider text-[#8E867B] uppercase block mb-1">
                    Mã Đơn Hàng Của Bạn
                  </span>
                  <div className="flex items-center gap-3">
                    <strong className="text-[20px] sm:text-[22px] text-[#3E5641] font-mono tracking-wider">
                      {orderCode}
                    </strong>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-white text-[#3E5641] border border-[#3E5641]/25 hover:bg-[#3E5641]/5 transition-all active:scale-95 shadow-2xs"
                      title="Sao chép mã đơn hàng"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#3E5641]" />
                          <span className="text-[#3E5641] font-semibold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5">
                  {formattedDate && (
                    <span className="text-[13px] text-[#777777] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8E867B]" />
                      {formattedDate}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#3E5641]/10 text-[#3E5641] font-medium text-[13px] border border-[#3E5641]/15">
                    <span className="w-2 h-2 rounded-full bg-[#3E5641] animate-pulse"></span>
                    {orderStatus}
                  </span>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="pt-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#3E5641] text-[#FAF8F3] flex items-center justify-center text-[13px] mb-2 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#3E5641]">
                      Đã Tiếp Nhận
                    </span>
                    <span className="text-[11px] text-[#888888] hidden sm:block">Đơn đã lưu hệ thống</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#C89F5D] text-white flex items-center justify-center text-[13px] mb-2 shadow-xs">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#C89F5D]">
                      Đang Chuẩn Bị Trà
                    </span>
                    <span className="text-[11px] text-[#888888] hidden sm:block">Đóng gói thủ công</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E5DFD5] text-[#8E867B] flex items-center justify-center text-[13px] mb-2">
                      {shippingMode === 'pickup' ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[12px] sm:text-[13px] font-medium text-[#777777]">
                      {shippingMode === 'pickup' ? 'Nhận Tại Tiệm' : 'Giao Hàng Tận Nơi'}
                    </span>
                    <span className="text-[11px] text-[#888888] hidden sm:block">Bước tiếp theo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ordered Items List */}
          <div className="mb-8">
            <h2 className="text-[14px] font-semibold text-[#8E867B] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#3E5641]" />
              Sản Phẩm Đã Chọn ({items.length})
            </h2>

            <div className="divide-y divide-[#E5DFD5]/60 border-t border-b border-[#E5DFD5]/60">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 sm:gap-6 py-4.5 items-center">
                  <div className="relative shrink-0">
                    <img
                      src={assetUrl(getOrderMedia(product.id)?.image || product.image)}
                      style={{ objectPosition: getOrderMedia(product.id)?.position }}
                      alt={product.name}
                      className="w-[84px] sm:w-[104px] aspect-square object-cover rounded-[14px] border border-[#E5DFD5] bg-[#FAF8F3]"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#3E5641] text-[#FAF8F3] text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-philosopher text-[17px] sm:text-[20px] text-[#3E5641] font-bold truncate">
                      {product.id === 'hop-qua-tam-y'
                        ? 'Hộp Quà Tâm Ý'
                        : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}
                    </h3>
                    <p className="text-[#777777] text-[13px] mt-0.5">
                      {product.emotion === 'COMBO'
                        ? 'AN, THƯƠNG, CẢM, NHỚ'
                        : {
                            AN: 'Trà Hương Hoa Bưởi thanh khiết',
                            THUONG: 'Trà Hương Hoa Nhài đượm hương',
                            CAM: 'Trà Hương Hoa Sói trầm ấm',
                            NHO: 'Trà Hương Cốm dịu ngọt',
                            ALL: 'Bộ sưu tập hương trà',
                          }[product.emotion] || product.emotion}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[#3E5641] text-[16px] sm:text-[18px] font-semibold">
                        {money(product.price * quantity)}
                      </span>
                      {quantity > 1 && (
                        <span className="text-[#888888] text-[12px]">
                          ({money(product.price)} / hộp)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Delivery Summary Card */}
          <div className="bg-[#FAF8F3] rounded-[20px] p-6 mb-8 border border-[#E5DFD5]">
            <h3 className="text-[14px] font-semibold text-[#8E867B] uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3E5641]" />
              Thông Tin Nhận Hàng & Thanh Toán
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[14.5px]">
              {/* Recipient Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[100px] shrink-0">Người nhận:</span>
                  <strong className="text-[#222222] font-semibold">{fullName}</strong>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[100px] shrink-0">Điện thoại:</span>
                  <a
                    href={`tel:${phone}`}
                    className="text-[#3E5641] font-semibold hover:underline"
                  >
                    {phone}
                  </a>
                </div>
                {email && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-[#8E867B] min-w-[100px] shrink-0">Email:</span>
                    <span className="text-[#444444] break-all">{email}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Payment Method */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">Hình thức nhận:</span>
                  <span className="text-[#222222] font-medium">
                    {shippingMode === 'pickup' ? 'Đến lấy tại tiệm' : 'Giao tận nơi'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">Địa chỉ:</span>
                  <span className="text-[#333333] leading-relaxed">{address}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">Thanh toán:</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#222222] font-medium">{payment}</span>
                    <span className="text-[12.5px] font-medium">
                      {paymentMethod === 'cod' ? (
                        <span className="text-[#555555]">
                          (Thanh toán khi nhận hàng)
                        </span>
                      ) : (
                        <span className="text-[#B37424] font-semibold">
                          (Chờ xác nhận giao dịch)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Note if present */}
            {note && (
              <div className="mt-4 pt-4 border-t border-[#E5DFD5]/80 flex items-start gap-2.5 text-[13.5px]">
                <FileText className="w-4 h-4 text-[#8E867B] shrink-0 mt-0.5" />
                <div className="text-[#555555]">
                  <strong className="text-[#333333] mr-1">Ghi chú:</strong>
                  <span className="italic">"{note}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer Instructions if Selected */}
          {paymentMethod === 'bank' && (
            <div className="bg-[#FAF6EE] border-1.5 border-[#C89F5D]/40 rounded-[20px] p-6 mb-8 text-[14px]">
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldCheck className="w-5 h-5 text-[#C89F5D]" />
                <h4 className="font-philosopher font-bold text-[18px] text-[#3E5641]">
                  Hướng Dẫn Chuyển Khoản Ngân Hàng An Toàn
                </h4>
              </div>
              <p className="text-[#555555] mb-4 text-[13.5px] leading-relaxed">
                Đơn hàng của bạn đã được ghi nhận với phương thức Chuyển khoản ngân hàng.
                Chuyên viên trà Mộc Ngôn Hương sẽ trực tiếp liên hệ qua điện thoại 
                <a href="tel:0889742556" className="font-bold text-[#3E5641] ml-1 mr-1 underline">
                  0889 742 556
                </a>
                để xác nhận đơn và cung cấp số tài khoản doanh nghiệp chính thức của công ty.
              </p>
              
              <div className="bg-white rounded-[14px] p-4.5 border border-[#C89F5D]/25 space-y-2.5 text-[13.5px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#666666]">Cú pháp chuyển khoản dự kiến:</span>
                  <code className="font-mono font-bold text-[14.5px] text-[#3E5641] bg-[#FAF8F3] px-3 py-1 rounded-md border border-[#E5DFD5]">
                    MNH {orderCode || 'MADON'} {phone}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#FAF8F3]">
                  <span className="text-[#666666]">Trạng thái thanh toán:</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#B37424]">
                    <span className="w-2 h-2 rounded-full bg-[#B37424]"></span>
                    Chờ xác nhận giao dịch
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-[#8E867B] mt-3 italic">
                * Lưu ý: Mộc Ngôn Hương không yêu cầu thanh toán qua tài khoản cá nhân không xác thực. Vui lòng chỉ chuyển khoản sau khi nhận được liên hệ chính thức từ tổng đài viên.
              </p>
            </div>
          )}

          {/* Pricing Breakdown */}
          <dl className="border-t border-[#E5DFD5] pt-5 pb-6 mb-6 text-[15px] sm:text-[16px] space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-[#666666]">Tạm tính sản phẩm</dt>
              <dd className="font-medium text-[#222222]">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#666666]">Phí vận chuyển toàn quốc</dt>
              <dd className="font-semibold text-[#3E5641]">Miễn phí (0đ)</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#666666]">Ưu đãi giảm giá</dt>
                <dd className="font-medium text-[#B37424]">-{money(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between items-baseline gap-4 pt-4 border-t border-[#E5DFD5] text-[18px] sm:text-[22px] font-bold text-[#222222]">
              <dt className="font-philosopher">Tổng Thanh Toán</dt>
              <dd className="text-[#3E5641] font-mono font-bold text-[22px] sm:text-[26px]">
                {money(total)}
              </dd>
            </div>
            <p className="text-right text-[#999999] text-[12px] mt-1">
              (Giá đã bao gồm thuế GTGT & quy cách đóng gói hộp quà cao cấp Mộc Ngôn Hương)
            </p>
          </dl>

          {/* Luxury Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="rounded-full bg-[#3E5641] min-h-[50px] text-[#FAF8F3] font-semibold text-[14.5px] hover:bg-[#2B3C2D] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <span>Xem Đơn Hàng Của Tôi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="rounded-full border border-[#C89F5D] min-h-[50px] text-[#3E5641] bg-white font-semibold text-[14.5px] hover:bg-[#FAF8F3] hover:border-[#3E5641] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Tiếp Tục Mua Sắm</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="rounded-full border border-[#D9D2C7] min-h-[50px] text-[#555555] bg-white font-medium text-[14.5px] hover:bg-gray-50 hover:text-[#222222] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Liên Hệ Tiệm Trà</span>
            </button>
          </div>

          {/* Reassurance Footer */}
          <div className="mt-8 pt-6 border-t border-[#E5DFD5]/70 text-center text-[13px] text-[#8E867B]">
            <p>
              Cần hỗ trợ gấp về đơn hàng? Gọi ngay hotline:{' '}
              <a href="tel:0889742556" className="text-[#3E5641] font-bold hover:underline">
                0889 742 556
              </a>{' '}
              hoặc email{' '}
              <a href="mailto:mocngonhuong@gmail.com" className="text-[#3E5641] font-medium hover:underline">
                mocngonhuong@gmail.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default OrderConfirmation;

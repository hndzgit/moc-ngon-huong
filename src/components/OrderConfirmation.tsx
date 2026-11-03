import { assetUrl } from '../lib/assets';
import type { CartItem, PageRoute } from '../types';
import { FIGMA_PRODUCT_COPY, FIGMA_ORDER_MEDIA } from '../data/figmaMedia';

export interface OrderConfirmationProps {
  items: CartItem[];
  fullName: string;
  phone: string;
  address: string;
  payment: string;
  paymentMethod?: 'cod' | 'bank';
  orderCode?: string;
  orderDate?: string;
  orderStatus?: string;
  onNavigate: (page: PageRoute) => void;
}

// Visual state of Figma 77:3506 with verified server confirmation details
export function OrderConfirmation({
  items,
  fullName,
  phone,
  address,
  payment,
  paymentMethod = 'cod',
  orderCode,
  orderDate,
  orderStatus = 'Đang chuẩn bị',
  onNavigate,
}: OrderConfirmationProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const money = (n: number) => `${n.toLocaleString('en-US')}đ`;

  return (
    <section className="order-confirmation py-14 md:py-20 bg-[#faf7f2]" data-figma-node="77:3506">
      <div className="text-center px-5 mb-10">
        <p className="font-serif text-[#8e6746] tracking-[.2em] mb-2">MỘC NGÔN HƯƠNG</p>
        <h1 className="font-philosopher text-[#3e5641] font-bold text-[36px] md:text-[64px]">
          Đặt Hàng Thành Công
        </h1>
        <p className="mt-2 text-[#666]">
          Đơn hàng của bạn đã được ghi nhận. Mộc Ngôn Hương đang chuẩn bị đơn hàng để sớm trao gửi đến bạn.
        </p>
      </div>

      <div className="order-receipt max-w-[822px] mx-auto bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-black/5">
        {/* Order Reference Badge */}
        {orderCode && (
          <div className="bg-[#3e5641]/10 rounded-[14px] p-4 mb-6 flex flex-wrap items-center justify-between gap-3 border border-[#3e5641]/15">
            <div>
              <span className="text-[13px] text-[#666666]">Mã đơn hàng:</span>{' '}
              <strong className="text-[16px] text-[#3e5641] font-mono tracking-wider ml-1">
                {orderCode}
              </strong>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              {orderDate && (
                <span className="text-[#777777] hidden sm:inline">
                  {new Date(orderDate).toLocaleDateString('vi-VN')}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-[#3e5641] text-[#f7f4d5] font-medium text-[12px]">
                {orderStatus}
              </span>
            </div>
          </div>
        )}

        {/* Ordered Items List */}
        <div className="divide-y divide-gray-100 mb-6">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 sm:gap-6 py-4">
              <img
                src={assetUrl(FIGMA_ORDER_MEDIA[product.id]?.image || product.image)}
                style={{ objectPosition: FIGMA_ORDER_MEDIA[product.id]?.position }}
                alt={product.name}
                className="w-[100px] sm:w-[140px] aspect-square object-cover rounded-[14px] border border-black/5 shrink-0"
              />
              <div className="min-w-0 flex-1 py-1">
                <h2 className="font-philosopher text-[18px] sm:text-[24px] text-[#3e5641] font-bold truncate">
                  {product.id === 'hop-qua-tam-y'
                    ? 'Hộp Quà Tâm Ý'
                    : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}
                </h2>
                <p className="text-[#666] text-[13px] mt-0.5">
                  {product.emotion === 'COMBO'
                    ? 'AN, THƯƠNG, CẢM, NHỚ'
                    : {
                        AN: 'Trà Bưởi',
                        THUONG: 'Trà Nhài',
                        CAM: 'Trà Hoa Sói',
                        NHO: 'Trà Cốm',
                        ALL: 'Các hương trà',
                      }[product.emotion]}
                </p>
                <p className="text-[#3e5641] text-[18px] sm:text-[20px] font-semibold my-2">
                  {money(product.price * quantity)}
                </p>
                <p className="text-[#888888] text-[13px]">Số lượng: {quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Customer & Delivery Summary */}
        <div className="bg-[#faf8f3] rounded-[16px] p-5 text-[#555555] text-[15px] sm:text-[16px] leading-[26px] space-y-1 border border-black/5">
          <p className="font-semibold text-[#222222] text-[17px]">{fullName}</p>
          <p>Điện thoại: {phone}</p>
          <p>Địa chỉ nhận: {address}</p>
          <p>Hình thức: {payment}</p>
        </div>

        {/* Bank Transfer Instructions if Selected */}
        {paymentMethod === 'bank' && (
          <div className="bg-[#fcfbf9] border border-[#c89f5d]/30 rounded-[16px] p-5 my-6 text-[14px]">
            <h3 className="font-philosopher font-bold text-[18px] text-[#3e5641] mb-1.5">
              Hướng Dẫn Thanh Toán Chuyển Khoản
            </h3>
            <p className="text-[#555555] mb-3 text-[13.5px] leading-[22px]">
              Đơn hàng của bạn đã được ghi nhận với phương thức Chuyển khoản ngân hàng. 
              Chuyên viên trà Mộc Ngôn Hương sẽ trực tiếp liên hệ qua điện thoại/SMS để xác nhận đơn và cung cấp thông tin tài khoản ngân hàng chính thức của công ty.
            </p>
            <div className="bg-white rounded-[10px] p-4 border border-[#c89f5d]/20 space-y-2 text-[13.5px] text-[#222222]">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c89f5d]"></span>
                <span><strong>Cú pháp chuyển khoản:</strong> <span className="font-mono text-[#3e5641] font-bold">{orderCode || 'Mã đơn'} - {phone}</span></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c89f5d]"></span>
                <span><strong>Trạng thái thanh toán:</strong> <span className="text-[#9c5435] font-semibold">Chờ xác nhận giao dịch</span></span>
              </p>
            </div>
            <p className="text-[12px] text-[#888888] mt-2.5 italic">
              * Quý khách vui lòng chỉ chuyển tiền theo thông tin tài khoản doanh nghiệp được nhân viên Mộc Ngôn Hương xác nhận chính thức.
            </p>
          </div>
        )}

        {/* Pricing Breakdown */}
        <dl className="border-y border-[#d9d9d9] py-5 my-6 text-[16px] sm:text-[18px] space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-[#666666]">Tạm tính</dt>
            <dd className="font-medium text-[#222222]">{money(total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#666666]">Giao hàng</dt>
            <dd className="font-medium text-[#3e5641]">Miễn phí</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#666666]">Giảm giá</dt>
            <dd className="font-medium text-[#222222]">0đ</dd>
          </div>
        </dl>

        <div className="flex justify-between items-center text-[18px] sm:text-[22px] font-bold text-[#222222]">
          <span>Tổng tiền</span>
          <span className="text-[#3e5641]">{money(total)}</span>
        </div>
        <p className="text-right text-[#999999] text-[12px] mt-1.5">
          (Giá tham khảo đã bao gồm VAT)
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8">
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="rounded-full bg-[#3e5641] min-h-[50px] text-[#f7f4d5] font-semibold text-[14.5px] hover:bg-[#203323] transition-colors shadow-xs"
          >
            Xem Đơn Hàng Của Tôi
          </button>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="rounded-full border border-[#3e5641] min-h-[50px] text-[#3e5641] font-semibold text-[14.5px] hover:bg-[#3e5641]/5 transition-colors"
          >
            Liên Hệ Chúng Tôi
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="rounded-full border border-gray-300 min-h-[50px] text-[#444] font-semibold text-[14.5px] hover:bg-gray-50 transition-colors"
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    </section>
  );
}
export default OrderConfirmation;

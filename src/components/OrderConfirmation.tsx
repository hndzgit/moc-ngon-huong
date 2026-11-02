import { assetUrl } from '../lib/assets';
import type { CartItem, PageRoute } from '../types';
import { FIGMA_PRODUCT_COPY, FIGMA_ORDER_MEDIA } from '../data/figmaMedia';

// Visual state of Figma 77:3506. The caller retains responsibility for order persistence.
export function OrderConfirmation({ items, fullName, phone, address, payment, onNavigate }: {
  items: CartItem[]; fullName:string; phone:string; address:string; payment:string;
  onNavigate:(page:PageRoute) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const money = (n:number) => `${n.toLocaleString('en-US')}đ`;
  return <section className="order-confirmation py-14 md:py-20 bg-[#faf7f2]" data-figma-node="77:3506">
    <div className="text-center px-5 mb-10">
      <p className="font-serif text-[#8e6746] tracking-[.2em] mb-2">MỘC NGÔN HƯƠNG</p>
      <h1 className="font-philosopher text-[#3e5641] font-bold text-[36px] md:text-[64px]">Đặt Hàng Thành Công</h1>
      <p className="mt-2 text-[#666]">Trong vòng 60 phút nhân viên sẽ liên hệ qua SMS hoặc cuộc gọi để xác nhận đơn hàng.</p>
    </div>
    <div className="order-receipt max-w-[822px] mx-auto bg-white rounded-[24px] p-6">
      {items.map(({product, quantity}) => <div key={product.id} className="flex gap-6 mb-6">
        <img src={assetUrl(FIGMA_ORDER_MEDIA[product.id]?.image || product.image)} style={{objectPosition:FIGMA_ORDER_MEDIA[product.id]?.position}} alt={product.name} className="w-[120px] sm:w-[200px] aspect-square object-cover rounded-[16px]" />
        <div className="min-w-0 py-2"><h2 className="font-philosopher text-[24px] sm:text-[30px] text-[#3e5641]">{product.id === 'hop-qua-tam-y' ? 'Hộp Quà Tâm Ý' : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}</h2>
          <p className="text-[#666] mt-1">{product.emotion === 'COMBO' ? 'AN, THƯƠNG' : {AN:'Trà Bưởi',THUONG:'Trà Nhài',CAM:'Trà Hoa Sói',NHO:'Trà Cốm',ALL:'Các hương trà'}[product.emotion]}</p><p className="text-[#3e5641] text-[24px] my-4">{money(product.price * quantity)}</p>
          <p className="text-[#999]">Số lượng: {quantity}</p></div>
      </div>)}
      <div className="text-[#666] text-[20px] leading-[30px] py-2"><p>{fullName}</p><p>{phone}</p><p>Địa chỉ: {address}</p><p>Thanh toán: {payment}</p></div>
      <dl className="border-y border-[#d9d9d9] py-6 my-6 text-[20px] space-y-4">
        <div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd>{money(total)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Giao hàng</dt><dd>Miễn phí</dd></div>
        <div className="flex justify-between gap-4"><dt>Giảm giá</dt><dd>0 đ</dd></div>
      </dl>
      <div className="flex justify-between text-[20px]"><span>Tổng tiền</span><span>{money(total)}</span></div>
      <p className="text-right text-[#999] mt-2">(Giá tham khảo đã bao gồm VAT)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <button type="button" onClick={() => onNavigate('contact')} className="rounded-full border border-[#3e5641] min-h-[62px] text-[#3e5641]">Liên Hệ Chúng Tôi</button>
        <button type="button" onClick={() => onNavigate('home')} className="rounded-full bg-[#3e5641] min-h-[62px] text-white">Quay Về Trang Chủ</button>
      </div>
    </div>
  </section>;
}

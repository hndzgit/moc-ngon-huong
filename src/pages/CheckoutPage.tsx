import { isFigmaPreview } from '../lib/previewMode';
import { useChangeMotion } from '../motion/motion';
import { assetUrl } from '../lib/assets';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState } from 'react';
import { CartItem, PageRoute } from '../types';
import { FIGMA_PRODUCT_COPY, FIGMA_ORDER_MEDIA } from '../data/figmaMedia';

interface CheckoutPageProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  onClearCart,
  onNavigate,
}) => {
  const [shippingMode, setShippingMode] = useState<'delivery' | 'pickup'>('delivery');
  const [gender, setGender] = useState<'anh' | 'chi'>('anh');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [pickupStore, setPickupStore] = useState('42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('cod');
  const [note, setNote] = useState('');
  const [agreePromo, setAgreePromo] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const shippingMotion=useChangeMotion<HTMLDivElement>(shippingMode,undefined,.25,false,!orderComplete);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [orderCode, setOrderCode] = useState('');

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('Giỏ hàng của bạn đang trống.');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ và Tên, Số Điện Thoại và Email.');
      return;
    }
    if (shippingMode === 'delivery' && !address.trim()) {
      setErrorMsg('Vui lòng nhập Địa chỉ nhận hàng.');
      return;
    }
    if (!isFigmaPreview) {
      setErrorMsg('Đặt hàng trực tuyến hiện chưa khả dụng. Vui lòng liên hệ cửa hàng để được hỗ trợ.');
      return;
    }
    setErrorMsg('');
    setOrderCode(`MNH-${Math.floor(100000 + Math.random() * 900000)}`);
    setOrderItems(items.map(item => ({ ...item })));
    setOrderComplete(true);
    onClearCart();
  };

  if (orderComplete) return <OrderConfirmation items={orderItems} fullName={fullName} phone={phone}
    address={shippingMode === 'pickup' ? pickupStore : [address, ward, district, city].filter(Boolean).join(', ')}
    payment={paymentMethod === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'} onNavigate={onNavigate} />;

  return (
    <div className={`checkout-page checkout-${shippingMode} bg-[#faf8f3] py-12 md:py-16`}>
      <div className="figma-container max-w-[1140px] mx-auto">
        {/* Top Centered Header matching Figma 77:3389 & 77:3506 */}
        <div className="text-center mb-8">
          <p className="text-[13px] md:text-[14px] font-medium uppercase tracking-[0.22em] text-[#9c5435] mb-1.5">
            MỘC NGÔN HƯƠNG
          </p>
          <h1 className="font-philosopher font-bold text-[34px] sm:text-[46px] text-[#3e5641] leading-[1.15]">
            Đặt Hàng
          </h1>
        </div>

        {/* Single Centered White Card Form (Figma 77:3389 & 77:3506) */}
        <form
          onSubmit={handlePlaceOrder}
          className="bg-white rounded-[18px] p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 space-y-7"
          noValidate
        >
          {/* 1. Product Summary Table */}
          <div className="checkout-summary">
            <div className="bg-[#3e5641] text-[#f7f4d5] rounded-[8px] px-5 py-3 grid grid-cols-12 text-[13px] font-semibold">
              <div className="col-span-6">Danh sách sản phẩm</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="py-4 px-2 grid grid-cols-12 items-center gap-2 text-[14px]"
                >
                  <div className="col-span-6 flex items-center gap-3.5 min-w-0">
                    <img
                      src={assetUrl(FIGMA_ORDER_MEDIA[product.id]?.image || product.image)}
                      style={{objectPosition:FIGMA_ORDER_MEDIA[product.id]?.position}}
                      alt={product.name}
                      className="w-[64px] h-[52px] rounded-[8px] object-cover shrink-0 border border-black/5"
                    />
                    <div className="min-w-0">
                      <h3 className="font-philosopher font-bold text-[16px] text-[#222222] truncate">
                        {product.id === 'hop-qua-tam-y' ? 'Hộp Quà Tâm Ý' : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}
                      </h3>
                      <p className="text-[12px] text-[#777777]">
                        {product.emotion === 'COMBO' ? 'AN, THƯƠNG' : 'Trà Bưởi'}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-medium text-[#222222]">
                    {quantity}
                  </div>
                  <div className="col-span-2 text-right text-[#444444]">
                    {product.price.toLocaleString('en-US')}đ
                  </div>
                  <div className="col-span-2 text-right font-semibold text-[#222222]">
                    {(product.price * quantity).toLocaleString('en-US')}đ
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[15px] font-bold text-[#222222]">
              <span>Tổng tiền</span>
              <span className="text-[18px]">{subtotal.toLocaleString('en-US')}đ</span>
            </div>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
              {errorMsg}
            </div>
          )}

          {/* 2. Buyer Information ("Thông tin người mua") */}
          <div className="checkout-buyer space-y-4">
            <h2 className="font-bold text-[15px] text-[#222222]">
              Thông tin người mua
            </h2>

            <div className="flex items-center gap-6 text-[13.5px] text-[#444444]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'anh'}
                  onChange={() => setGender('anh')}
                  className="accent-[#3e5641]"
                />
                <span>Anh</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'chi'}
                  onChange={() => setGender('chi')}
                  className="accent-[#3e5641]"
                />
                <span>Chị</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#222222] mb-1">
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#222222] mb-1">
                  Số Điện Thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#222222] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
              />
            </div>
          </div>

          {/* 3. Delivery Method ("Hình thức nhận hàng") */}
          <div ref={shippingMotion} className="checkout-shipping space-y-4">
            <h2 className="font-bold text-[15px] text-[#222222]">
              Hình thức nhận hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setShippingMode('delivery')}
                className={`h-[54px] rounded-[8px] border text-center transition-all flex flex-col items-center justify-center ${
                  shippingMode === 'delivery'
                    ? 'bg-[#c89f5d] border-[#c89f5d] text-white'
                    : 'bg-white border-gray-300 text-[#444444]'
                }`}
              >
                <span className="font-semibold text-[13.5px]">Giao tận nơi</span>
                <span className="text-[11px] opacity-90">Miễn phí trên toàn quốc</span>
              </button>

              <button
                type="button"
                onClick={() => setShippingMode('pickup')}
                className={`h-[54px] rounded-[8px] border text-center transition-all flex flex-col items-center justify-center ${
                  shippingMode === 'pickup'
                    ? 'bg-[#c89f5d] border-[#c89f5d] text-white'
                    : 'bg-white border-gray-300 text-[#444444]'
                }`}
              >
                <span className="font-semibold text-[13.5px]">Đến lấy hàng</span>
                <span className="text-[11px] opacity-80">Nhận tại cửa hàng</span>
              </button>
            </div>

            {shippingMode === 'delivery' ? (
              <div className="checkout-address space-y-3.5">
                <div>
                  <label className="block text-[13px] font-medium text-[#222222] mb-1">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                  />
                </div>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                >
                  <option value="">Chọn tỉnh / thành</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Thái Nguyên">Thái Nguyên</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                  >
                    <option value="">Chọn huyện</option>
                    <option value="Hoàn Kiếm">Quận Hoàn Kiếm</option>
                    <option value="Ba Đình">Quận Ba Đình</option>
                  </select>

                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                  >
                    <option value="">Chọn xã</option>
                    <option value="Hàng Điếu">Phường Hàng Điếu</option>
                    <option value="Tràng Tiền">Phường Tràng Tiền</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-medium text-[#222222] mb-1">
                  Chọn cửa hàng nhận trà
                </label>
                <select
                  value={pickupStore}
                  onChange={(e) => setPickupStore(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#222222] bg-white"
                >
                  <option value="42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội">
                    Không gian thưởng trà Hà Nội — 42 Phố Hàng Điếu, Hoàn Kiếm
                  </option>
                  <option value="Xã Tân Cương, TP. Thái Nguyên">
                    Xưởng trà Mộc Ngôn Hương — Xã Tân Cương, TP. Thái Nguyên
                  </option>
                </select>
              </div>
            )}

            <div className="checkout-consent space-y-2 pt-1 text-[13px] text-[#555555]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePromo}
                  onChange={(e) => setAgreePromo(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#3e5641]"
                />
                <span>Đồng ý nhận các thông tin và chương trình khuyến mãi qua email, SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#3e5641]"
                />
                <span>Lưu thông tin cho lần mua hàng tiếp theo</span>
              </label>
            </div>
          </div>

          {/* 4. Payment Method & Order Note (2 Columns) */}
          <div className="checkout-payment grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-[15px] text-[#222222] mb-3">
                Phương thức thanh toán
              </h2>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full h-[42px] px-4 rounded-[8px] border text-left text-[13px] transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#3e5641] bg-[#3e5641]/5 text-[#222222] font-medium'
                      : 'border-gray-300 text-[#666666]'
                  }`}
                >
                  Thanh toán tiền mặt khi nhận hàng (COD)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`w-full h-[42px] px-4 rounded-[8px] border text-left text-[13px] transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-[#3e5641] bg-[#3e5641]/5 text-[#222222] font-medium'
                      : 'border-gray-300 text-[#666666]'
                  }`}
                >
                  Thanh toán qua phương thức ngân hàng
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-[15px] text-[#222222] mb-3">
                Ghi chú đơn hàng
              </h2>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú"
                className="w-full p-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
              />
            </div>
          </div>

          {/* 5. Full-width Submit Button ("Đặt Hàng") */}
          <button
            type="submit"
            className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm"
          >
            Đặt Hàng
          </button>
        </form>
      </div>

      {/* Order Confirmation Modal */}
      {orderComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="bg-white rounded-[20px] max-w-[440px] w-full p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#3e5641] text-[#f7f4d5] flex items-center justify-center mx-auto mb-4 text-[26px]">
              <FigmaIcon name="success" />
            </div>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              Đặt Hàng Thành Công
            </h2>
            <p className="text-[14px] text-[#3e5641] font-semibold mb-2">
              Mã đơn hàng: {orderCode}
            </p>
            <p className="text-[14px] leading-[22px] text-[#555555] mb-6">
              Cảm ơn bạn đã tin chọn Mộc Ngôn Hương. Chúng mình sẽ liên hệ xác nhận và gửi trao hộp trà đến bạn trong thời gian sớm nhất.
            </p>
            <button
              type="button"
              onClick={() => {
                setOrderComplete(false);
                onNavigate('home');
              }}
              className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

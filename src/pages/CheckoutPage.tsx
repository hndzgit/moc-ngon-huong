import { useChangeMotion } from '../motion/motion';
import { assetUrl } from '../lib/assets';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { GiftCardPreview } from '../components/GiftCardPreview';
import './CheckoutGiftDraft.css';
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, PageRoute, OrderRecord } from '../types';
import { FIGMA_PRODUCT_COPY, FIGMA_ORDER_MEDIA } from '../data/figmaMedia';
import { useAuth } from '../context/AuthContext';

interface CheckoutPageProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export type CheckoutStatus =
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'confirmed'
  | 'failed'
  | 'uncertain';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  onClearCart,
  onNavigate,
}) => {
  const { user, profile } = useAuth();

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

  // Accurate checkout state machine (idle -> validating -> submitting -> confirmed | failed | uncertain)
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const shippingMotion = useChangeMotion<HTMLDivElement>(
    shippingMode,
    undefined,
    0.25,
    false,
    !orderComplete
  );
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [serverOrder, setServerOrder] = useState<OrderRecord | null>(null);

  // Client-side idempotency key - retained across retries of the SAME submission
  const generateNewIdempotencyKey = () =>
    `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const idempotencyKeyRef = useRef<string>(generateNewIdempotencyKey());

  // Auto-populate customer fields if user is authenticated or has saved profile
  useEffect(() => {
    if (user) {
      if (user.displayName && !fullName) {
        setFullName(user.displayName);
      }
      if (user.email && !email) {
        setEmail(user.email);
      }
    }
    if (profile) {
      if (profile.fullName && !fullName) {
        setFullName(profile.fullName);
      }
      if (profile.phone && !phone) {
        setPhone(profile.phone);
      }
      if (profile.address && !address) {
        setAddress(profile.address);
      }
    }
  }, [user, profile]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (checkoutStatus === 'submitting' || checkoutStatus === 'validating') return;

    setCheckoutStatus('validating');
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Giỏ hàng của bạn đang trống.');
      setCheckoutStatus('idle');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ và Tên, Số Điện Thoại và Email.');
      setCheckoutStatus('idle');
      return;
    }
    if (shippingMode === 'delivery' && !address.trim()) {
      setErrorMsg('Vui lòng nhập Địa chỉ nhận hàng.');
      setCheckoutStatus('idle');
      return;
    }

    // Phone format basic check
    const phoneClean = phone.replace(/[\s.-]/g, '');
    if (!/^(0|\+84)[1-9][0-9]{8}$/.test(phoneClean)) {
      setErrorMsg(
        'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại 10 chữ số tại Việt Nam.'
      );
      setCheckoutStatus('idle');
      return;
    }

    setCheckoutStatus('submitting');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      // Build order payload with verified snapshots & customer data
      const payload = {
        idempotencyKey: idempotencyKeyRef.current,
        userId: user?.uid || null,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          giftConfiguration: item.giftConfiguration || undefined,
        })),
        customer: {
          fullName: fullName.trim(),
          phone: phoneClean,
          email: email.trim(),
          shippingMode,
          address: shippingMode === 'delivery' ? address.trim() : undefined,
          city: shippingMode === 'delivery' ? city || undefined : undefined,
          district: shippingMode === 'delivery' ? district || undefined : undefined,
          ward: shippingMode === 'delivery' ? ward || undefined : undefined,
          pickupStore: shippingMode === 'pickup' ? pickupStore : undefined,
          note: note.trim() || undefined,
        },
        paymentMethod,
      };

      let authHeader: string | undefined;
      if (user) {
        try {
          const idToken = await user.getIdToken();
          if (idToken) authHeader = `Bearer ${idToken}`;
        } catch {
          // Continue gracefully as guest-authorized
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error('Máy chủ phản hồi định dạng không hợp lệ.');
      }

      // 1. Success confirmation: HTTP 201 (new persisted order) OR HTTP 200 (persisted retry/duplicate)
      if (
        (response.status === 201 || response.status === 200) &&
        data?.success === true &&
        data?.order?.orderCode
      ) {
        const confirmedOrder: OrderRecord = data.order;
        setServerOrder(confirmedOrder);
        setOrderItems(items.map((item) => ({ ...item })));

        // Save to local order history for the Profile view
        try {
          const historyKey = user?.uid ? `mnh_user_orders_${user.uid}` : 'mnh_guest_orders_v1';
          const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
          const updated = [
            confirmedOrder,
            ...existing.filter((o: OrderRecord) => o.id !== confirmedOrder.id),
          ].slice(0, 30);
          localStorage.setItem(historyKey, JSON.stringify(updated));
        } catch {
          // Storage write error non-blocking
        }

        // If user checked "Save info for next time"
        if (saveInfo) {
          try {
            localStorage.setItem(
              'mnh_saved_customer_info',
              JSON.stringify({
                fullName: fullName.trim(),
                phone: phoneClean,
                email: email.trim(),
                address: address.trim(),
              })
            );
          } catch {}
        }

        // CLEAR CART ONLY AFTER PERSISTENCE IS CONFIRMED
        onClearCart();
        setCheckoutStatus('confirmed');
        setOrderComplete(true);
        return;
      }

      // 2. HTTP 409 Conflict (Idempotency key conflict)
      if (response.status === 409) {
        setCheckoutStatus('failed');
        setErrorMsg(
          data?.error ||
            'Xung đột mã yêu cầu (409 Conflict): Khóa đặt hàng này đã được sử dụng với nội dung khác. Vui lòng tạo đơn hàng mới.'
        );
        return;
      }

      // 3. HTTP 503 Service Unavailable (Database not ready / fail-closed)
      if (response.status === 503) {
        setCheckoutStatus('failed');
        setErrorMsg(
          data?.error ||
            'Hệ thống tiếp nhận đơn hàng đang bảo trì cơ sở dữ liệu. Quý khách vui lòng liên hệ hotline Mộc Ngôn Hương. Giỏ hàng của bạn vẫn được lưu giữ an toàn.'
        );
        return;
      }

      // Other 4xx / 5xx errors
      setCheckoutStatus('failed');
      setErrorMsg(
        data?.error ||
          `Không thể tạo đơn hàng (Mã lỗi ${response.status}). Giỏ hàng của bạn vẫn được lưu giữ.`
      );
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Handle Network Timeout or Disconnection -> UNCERTAIN STATE
      if (
        err.name === 'AbortError' ||
        err.message?.includes('fetch') ||
        err.message?.includes('NetworkError') ||
        (typeof navigator !== 'undefined' && !navigator.onLine)
      ) {
        setCheckoutStatus('uncertain');
        setErrorMsg(
          'Kết nối tới máy chủ bị gián đoạn hoặc vượt quá thời gian chờ (Timeout). Đơn hàng của bạn có thể đã được tiếp nhận trên hệ thống.'
        );
        return;
      }

      setCheckoutStatus('failed');
      setErrorMsg(
        err?.message || 'Đã xảy ra lỗi khi gửi đơn hàng. Giỏ hàng của bạn vẫn được lưu giữ.'
      );
    }
  };

  const handleResetForNewOrder = () => {
    idempotencyKeyRef.current = generateNewIdempotencyKey();
    setErrorMsg('');
    setCheckoutStatus('idle');
  };

  // Figma 77:3506 Order Confirmation view
  if (orderComplete && serverOrder) {
    return (
      <OrderConfirmation
        items={orderItems}
        fullName={serverOrder.customer.fullName}
        phone={serverOrder.customer.phone}
        address={
          serverOrder.customer.shippingMode === 'pickup'
            ? serverOrder.customer.pickupStore || pickupStore
            : [
                serverOrder.customer.address,
                serverOrder.customer.ward,
                serverOrder.customer.district,
                serverOrder.customer.city,
              ]
                .filter(Boolean)
                .join(', ')
        }
        payment={
          serverOrder.paymentMethod === 'cod'
            ? 'Thanh toán tiền mặt khi nhận hàng (COD)'
            : 'Chuyển khoản ngân hàng'
        }
        paymentMethod={serverOrder.paymentMethod}
        orderCode={serverOrder.orderCode}
        orderDate={serverOrder.createdAt}
        orderStatus={
          serverOrder.orderStatus === 'pending_confirmation'
            ? 'Chờ xác nhận'
            : serverOrder.orderStatus
        }
        onNavigate={onNavigate}
      />
    );
  }

  const isSubmitting = checkoutStatus === 'submitting' || checkoutStatus === 'validating';

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

        {items
          .filter((item) => item.giftConfiguration)
          .map((item) => (
            <aside
              key={item.product.id}
              className="checkout-gift-draft"
              aria-label={`Bản nháp thiệp ${item.product.shortName}`}
            >
              <div>
                <h2>Bản nháp đi cùng món quà</h2>
                <p>{item.product.name}</p>
                <p>
                  Lời nhắn chỉ có trong phiên này, chưa gửi tới cửa hàng. In thiệp và dịch vụ cá
                  nhân hóa cần tư vấn; chưa tính thêm phí.
                </p>
              </div>
              <GiftCardPreview configuration={item.giftConfiguration!} compact />
            </aside>
          ))}

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
                      style={{ objectPosition: FIGMA_ORDER_MEDIA[product.id]?.position }}
                      alt={product.name}
                      className="w-[64px] h-[52px] rounded-[8px] object-cover shrink-0 border border-black/5"
                    />
                    <div className="min-w-0">
                      <h3 className="font-philosopher font-bold text-[16px] text-[#222222] truncate">
                        {product.id === 'hop-qua-tam-y'
                          ? 'Hộp Quà Tâm Ý'
                          : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}
                      </h3>
                      <p className="text-[12px] text-[#777777]">
                        {product.emotion === 'COMBO'
                          ? 'AN · THƯƠNG · CẢM · NHỚ'
                          : {
                              AN: 'Trà Bưởi',
                              THUONG: 'Trà Nhài',
                              CAM: 'Trà Hoa Sói',
                              NHO: 'Trà Cốm',
                              ALL: 'Các hương trà',
                            }[product.emotion]}
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
              <span className="text-[18px] text-[#3e5641]">
                {subtotal.toLocaleString('en-US')}đ
              </span>
            </div>
          </div>

          {/* Uncertain State Reconciliation Alert */}
          {checkoutStatus === 'uncertain' && (
            <div
              role="alert"
              className="p-4 rounded-[12px] bg-amber-50 border border-amber-300 text-amber-900 text-[13.5px] space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[18px]">⚠️</span>
                <div>
                  <p className="font-semibold text-[14px]">Trạng thái giao dịch chưa chắc chắn</p>
                  <p className="mt-1 leading-[20px] text-amber-800">
                    {errorMsg ||
                      'Kết nối mạng bị gián đoạn hoặc vượt quá thời gian phản hồi. Để tránh tạo trùng 2 đơn hàng, giỏ hàng của bạn được giữ nguyên.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  className="px-4 py-2 rounded-full bg-[#3e5641] text-[#f7f4d5] font-medium text-[13px] hover:bg-[#203323] transition-colors"
                >
                  Kiểm Tra & Gửi Lại (Bảo toàn đơn)
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewOrder}
                  className="px-4 py-2 rounded-full bg-white border border-amber-300 text-amber-900 font-medium text-[13px] hover:bg-amber-100 transition-colors"
                >
                  Tạo Mã Yêu Cầu Mới
                </button>
              </div>
            </div>
          )}

          {/* Generic Error Alert */}
          {errorMsg && checkoutStatus !== 'uncertain' && (
            <div
              role="alert"
              className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]"
            >
              {errorMsg}
            </div>
          )}

          {/* 2. Buyer Information ("Thông tin người mua") */}
          <div className="checkout-buyer space-y-4">
            <h2 className="font-bold text-[15px] text-[#222222]">Thông tin người mua</h2>

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
                  placeholder="Ví dụ: Nguyễn Văn An"
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
                  placeholder="Ví dụ: 0912345678"
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
                placeholder="Ví dụ: an.nguyen@email.com"
                className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
              />
            </div>
          </div>

          {/* 3. Delivery Method ("Hình thức nhận hàng") */}
          <div ref={shippingMotion} className="checkout-shipping space-y-4">
            <h2 className="font-bold text-[15px] text-[#222222]">Hình thức nhận hàng</h2>

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
                <span className="text-[11px] opacity-90">Miễn phí giao hàng (Ưu đãi ra mắt)</span>
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
                <span className="text-[11px] opacity-80">Nhận tại không gian thưởng trà</span>
              </button>
            </div>

            {shippingMode === 'delivery' ? (
              <div className="checkout-address space-y-3.5">
                <div>
                  <label className="block text-[13px] font-medium text-[#222222] mb-1">
                    Địa chỉ nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, ngõ/ngách, tên đường..."
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                  />
                </div>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                >
                  <option value="">Chọn tỉnh / thành phố</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Thái Nguyên">Thái Nguyên</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Khác">Tỉnh / Thành khác</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                  >
                    <option value="">Chọn quận / huyện</option>
                    <option value="Hoàn Kiếm">Quận Hoàn Kiếm</option>
                    <option value="Ba Đình">Quận Ba Đình</option>
                    <option value="Đống Đa">Quận Đống Đa</option>
                    <option value="Cầu Giấy">Quận Cầu Giấy</option>
                    <option value="Khác">Quận / Huyện khác</option>
                  </select>

                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#444444] bg-white"
                  >
                    <option value="">Chọn phường / xã</option>
                    <option value="Hàng Điếu">Phường Hàng Điếu</option>
                    <option value="Tràng Tiền">Phường Tràng Tiền</option>
                    <option value="Khác">Phường / Xã khác</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-medium text-[#222222] mb-1">
                  Chọn không gian nhận trà
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
              <h2 className="font-bold text-[15px] text-[#222222] mb-3">Phương thức thanh toán</h2>
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
              <h2 className="font-bold text-[15px] text-[#222222] mb-3">Ghi chú đơn hàng</h2>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm về thời gian giao hàng hoặc yêu cầu đóng gói..."
                className="w-full p-3.5 rounded-[8px] border border-gray-300 text-[13.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
              />
            </div>
          </div>

          {/* 5. Full-width Submit Button ("Đặt Hàng") */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-[46px] rounded-full font-semibold text-[15px] transition-colors shadow-sm flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#3e5641] text-[#f7f4d5] hover:bg-[#203323]'
            }`}
          >
            {isSubmitting && (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            <span>
              {isSubmitting
                ? 'Đang Xử Lý Đơn Hàng...'
                : checkoutStatus === 'uncertain'
                ? 'Kiểm Tra & Gửi Lại'
                : 'Đặt Hàng'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default CheckoutPage;

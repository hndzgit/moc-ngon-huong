import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChangeMotion } from '../motion/motion';
import { assetUrl } from '../lib/assets';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { GiftCardPreview } from '../components/GiftCardPreview';
import { CartItem, PageRoute, OrderRecord } from '../types';
import { getOrderMedia } from '../data/figmaMedia';
import { getCartProductSubtitle, getCartProductTitle } from '../data/localizedCatalog';
import { formatVnd, normalizeLocale } from '../lib/locale';
import { BUSINESS_CONTACT } from '../lib/contact';
import { useAuth } from '../context/AuthContext';
import {
  getProvinces,
  getProvinceByCode,
  getCommunesByProvinceCode,
  getCommuneByCode,
  validateDeliveryAddress,
  formatCustomerDeliveryAddress,
  attemptLegacyAddressConversion,
  ConversionProposal,
} from '../data/address';
import { SearchableAddressSelect } from '../components/SearchableAddressSelect';
import {
  Truck,
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  PackageCheck,
  PhoneCall,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  User,
  MapPin,
  FileText,
} from 'lucide-react';
import './CheckoutGiftDraft.css';
import './CheckoutPage.css';

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
  const { t, i18n } = useTranslation(['cartCheckout', 'common']);
  const locale = normalizeLocale(i18n.language);
  const { user, profile, updateProfileData, getIdToken, ensureGuestAuthToken } = useAuth();

  const [shippingMode, setShippingMode] = useState<'delivery' | 'pickup'>('delivery');
  const [gender, setGender] = useState<'anh' | 'chi'>('anh');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [communeCode, setCommuneCode] = useState('');
  const [addressError, setAddressError] = useState('');
  const [legacyProposal, setLegacyProposal] = useState<ConversionProposal | null>(null);
  const [dismissProposal, setDismissProposal] = useState(false);
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
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [recoveringSession, setRecoveringSession] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryOrderCodeInput, setRecoveryOrderCodeInput] = useState('');
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [sendingRecoveryEmail, setSendingRecoveryEmail] = useState(false);
  const [recoveryEmailSentMsg, setRecoveryEmailSentMsg] = useState<string | null>(null);

  // Client-side idempotency key - retained across retries of the SAME submission
  const generateNewIdempotencyKey = () =>
    `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const idempotencyKeyRef = useRef<string>(generateNewIdempotencyKey());

  // Crash-safe order & VietQR payment session recovery (from URL #/thanh-toan?orderId=...&token=... or active localStorage session)
  useEffect(() => {
    let cancelled = false;

    const attemptOrderRecovery = async () => {
      const hashQuery = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : '';
      const params = new URLSearchParams(hashQuery);
      let targetOrderId = (params.get('orderId') || '').trim();
      let targetToken = (params.get('token') || '').trim();

      // If no explicit URL orderId, only auto-recover from localStorage when cart is empty (page reload after order creation)
      if (!targetOrderId && items.length === 0 && !serverOrder) {
        try {
          const savedSession = localStorage.getItem('mnh_active_payment_session_v1');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed?.orderId) {
              targetOrderId = String(parsed.orderId);
              targetToken = String(parsed.recoveryToken || '');
            }
          }
        } catch {}
      }

      if (!targetOrderId) return;
      if (serverOrder && serverOrder.id === targetOrderId) return;

      setRecoveringSession(true);
      setRecoveryError(null);

      try {
        let idToken = await getIdToken();
        if (!idToken && !targetToken) {
          const guestAuth = await ensureGuestAuthToken();
          idToken = guestAuth.idToken;
        }

        // Also check saved session token if URL only had orderId
        if (!targetToken) {
          try {
            const savedSession = JSON.parse(
              localStorage.getItem('mnh_active_payment_session_v1') || '{}'
            );
            if (savedSession?.orderId === targetOrderId && savedSession?.recoveryToken) {
              targetToken = String(savedSession.recoveryToken);
            }
          } catch {}
        }

        const url = `/api/orders?orderId=${encodeURIComponent(targetOrderId)}${
          targetToken ? `&token=${encodeURIComponent(targetToken)}` : ''
        }`;
        const res = await fetch(url, {
          headers: {
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            ...(targetToken ? { 'x-order-recovery-token': targetToken } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data?.success && data?.order) {
          const recoveredOrder: OrderRecord = data.order;
          setServerOrder(recoveredOrder);
          setRecoveryToken(targetToken || recoveredOrder.recoveryToken || null);
          setCheckoutStatus('confirmed');
          setOrderComplete(true);
        } else {
          setRecoveryError(
            data?.error ||
              t('cartCheckout:checkout.recoveryBanner.invalidLinkError')
          );
        }
      } catch {
        if (!cancelled) {
          setRecoveryError(t('cartCheckout:checkout.recoveryBanner.networkError'));
        }
      } finally {
        if (!cancelled) {
          setRecoveringSession(false);
        }
      }
    };

    attemptOrderRecovery();
    window.addEventListener('hashchange', attemptOrderRecovery);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', attemptOrderRecovery);
    };
  }, [getIdToken, ensureGuestAuthToken]);

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

      // Check if profile already contains verified 2-tier 2026 data
      if (profile.provinceCode && !provinceCode) {
        setProvinceCode(profile.provinceCode);
        if (profile.communeCode && !communeCode) {
          setCommuneCode(profile.communeCode);
        }
      } else if (!provinceCode && !dismissProposal && (profile.city || profile.address)) {
        // Attempt safe legacy mapping
        const proposal = attemptLegacyAddressConversion({
          address: profile.address,
          city: profile.city,
          district: profile.district,
          ward: profile.ward,
        });
        if (proposal.isUnambiguous) {
          setLegacyProposal(proposal);
        } else if (proposal.proposedProvinceCode) {
          setProvinceCode(proposal.proposedProvinceCode);
        }
      }
    } else {
      // Guest local storage fallback
      try {
        const saved = localStorage.getItem('mnh_saved_customer_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullName && !fullName) setFullName(parsed.fullName);
          if (parsed.phone && !phone) setPhone(parsed.phone);
          if (parsed.email && !email) setEmail(parsed.email);
          if (parsed.address && !address) setAddress(parsed.address);
          if (parsed.provinceCode && !provinceCode) {
            setProvinceCode(parsed.provinceCode);
            if (parsed.communeCode && !communeCode) {
              setCommuneCode(parsed.communeCode);
            }
          }
        }
      } catch {}
    }
  }, [user, profile]);

  const selectedProvince = React.useMemo(() => getProvinceByCode(provinceCode), [provinceCode]);
  const selectedCommune = React.useMemo(
    () => getCommuneByCode(provinceCode, communeCode),
    [provinceCode, communeCode]
  );

  const provinceOptions = React.useMemo(() => {
    return getProvinces().map((p) => ({
      code: p.code,
      name: p.name,
      fullName: p.fullName,
      badge: p.type,
      extraInfo: t('cartCheckout:checkout.delivery.communeCountBadge', { count: p.communeCount }),
    }));
  }, [t]);

  const communeOptions = React.useMemo(() => {
    if (!provinceCode) return [];
    return getCommunesByProvinceCode(provinceCode).map((c) => ({
      code: c.code,
      name: c.name,
      badge: c.type,
    }));
  }, [provinceCode]);

  const formattedPreview = React.useMemo(() => {
    if (shippingMode === 'pickup') {
      return pickupStore;
    }
    if (!address.trim() && !selectedCommune && !selectedProvince) {
      return '';
    }
    return [address.trim(), selectedCommune?.name, selectedProvince?.fullName]
      .filter(Boolean)
      .join(', ');
  }, [shippingMode, pickupStore, address, selectedCommune, selectedProvince]);

  const handleProvinceChange = (newCode: string) => {
    setProvinceCode(newCode);
    setCommuneCode(''); // Reset commune selection when province changes
    setAddressError('');
    if (legacyProposal) setLegacyProposal(null);
  };

  const handleCommuneChange = (newCode: string) => {
    setCommuneCode(newCode);
    setAddressError('');
  };

  const handleAcceptProposal = () => {
    if (legacyProposal?.proposedProvinceCode) {
      setProvinceCode(legacyProposal.proposedProvinceCode);
      if (legacyProposal?.proposedCommuneCode) {
        setCommuneCode(legacyProposal.proposedCommuneCode);
      }
    }
    setDismissProposal(true);
    setLegacyProposal(null);
  };

  const handleDismissProposal = () => {
    setDismissProposal(true);
    setLegacyProposal(null);
  };

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
      setErrorMsg(t('cartCheckout:checkout.validation.emptyCart'));
      setCheckoutStatus('idle');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(t('cartCheckout:checkout.validation.missingContact'));
      setCheckoutStatus('idle');
      return;
    }
    if (shippingMode === 'delivery') {
      const addressValidation = validateDeliveryAddress({
        address,
        provinceCode,
        communeCode,
        locale,
      });
      if (!addressValidation.isValid) {
        setErrorMsg(addressValidation.error || t('cartCheckout:checkout.validation.invalidAddress'));
        setAddressError(addressValidation.error || '');
        setCheckoutStatus('idle');
        return;
      }
    }

    // Phone format basic check
    const phoneClean = phone.replace(/[\s.-]/g, '');
    if (!/^(0|\+84)[1-9][0-9]{8}$/.test(phoneClean)) {
      setErrorMsg(t('cartCheckout:checkout.validation.invalidPhone'));
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
        locale,
        items: items.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          variantId: item.product.variantId || undefined,
          quantity: item.quantity,
          giftConfiguration: item.giftConfiguration || undefined,
        })),
        customer: {
          fullName: fullName.trim(),
          phone: phoneClean,
          email: email.trim(),
          shippingMode,
          address: shippingMode === 'delivery' ? address.trim() : undefined,
          provinceCode: shippingMode === 'delivery' ? provinceCode : undefined,
          provinceName: shippingMode === 'delivery' ? selectedProvince?.fullName : undefined,
          communeCode: shippingMode === 'delivery' ? communeCode : undefined,
          communeName: shippingMode === 'delivery' ? selectedCommune?.name : undefined,
          formattedAddress: shippingMode === 'delivery' ? formattedPreview : undefined,
          addressSchemaVersion: shippingMode === 'delivery' ? '2' : undefined,
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
      } else {
        try {
          const guestAuth = await ensureGuestAuthToken();
          if (guestAuth.idToken) {
            authHeader = `Bearer ${guestAuth.idToken}`;
          }
        } catch {
          // Continue gracefully if anonymous auth is unavailable
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
        throw new Error(t('cartCheckout:checkout.validation.invalidServerResponse'));
      }

      // 1. Success confirmation: HTTP 201 (new persisted order) OR HTTP 200 (persisted retry/duplicate)
      if (
        (response.status === 201 || response.status === 200) &&
        data?.success === true &&
        data?.order?.orderCode
      ) {
        const confirmedOrder: OrderRecord = data.order;
        const activeToken = confirmedOrder.recoveryToken || null;
        setServerOrder(confirmedOrder);
        setRecoveryToken(activeToken);
        setOrderItems(items.map((item) => ({ ...item })));

        // Persist active payment session for crash/reload recovery
        try {
          localStorage.setItem(
            'mnh_active_payment_session_v1',
            JSON.stringify({
              orderId: confirmedOrder.id,
              orderCode: confirmedOrder.orderCode,
              recoveryToken: activeToken,
              email: confirmedOrder.customer.email,
              createdAt: confirmedOrder.createdAt,
            })
          );
          const recoveryHash = `#/thanh-toan?orderId=${encodeURIComponent(confirmedOrder.id)}${
            activeToken ? `&token=${encodeURIComponent(activeToken)}` : ''
          }`;
          window.history.replaceState(null, '', recoveryHash);
        } catch {}

        // Save to local order history for the Profile view & Guest-to-Account linking
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
                provinceCode: shippingMode === 'delivery' ? provinceCode : undefined,
                provinceName: shippingMode === 'delivery' ? selectedProvince?.fullName : undefined,
                communeCode: shippingMode === 'delivery' ? communeCode : undefined,
                communeName: shippingMode === 'delivery' ? selectedCommune?.name : undefined,
                formattedAddress: shippingMode === 'delivery' ? formattedPreview : undefined,
                addressSchemaVersion: shippingMode === 'delivery' ? '2' : undefined,
              })
            );
          } catch {}

          if (user && profile) {
            updateProfileData({
              fullName: fullName.trim(),
              phone: phoneClean,
              address: shippingMode === 'delivery' ? address.trim() : profile.address,
              provinceCode: shippingMode === 'delivery' ? provinceCode : profile.provinceCode,
              provinceName: shippingMode === 'delivery' ? selectedProvince?.fullName : profile.provinceName,
              communeCode: shippingMode === 'delivery' ? communeCode : profile.communeCode,
              communeName: shippingMode === 'delivery' ? selectedCommune?.name : profile.communeName,
              formattedAddress: shippingMode === 'delivery' ? formattedPreview : profile.formattedAddress,
              addressSchemaVersion: shippingMode === 'delivery' ? '2' : profile.addressSchemaVersion,
            }).catch(() => {});
          }
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
          data?.error || t('cartCheckout:checkout.validation.conflict409')
        );
        return;
      }

      // 3. HTTP 503 Service Unavailable (Database not ready / fail-closed)
      if (response.status === 503) {
        setCheckoutStatus('failed');
        setErrorMsg(
          data?.error || t('cartCheckout:checkout.validation.unavailable503')
        );
        return;
      }

      // Other 4xx / 5xx errors
      setCheckoutStatus('failed');
      setErrorMsg(
        data?.error ||
          t('cartCheckout:checkout.validation.genericError', { status: response.status })
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
        setErrorMsg(t('cartCheckout:checkout.validation.timeoutError'));
        return;
      }

      setCheckoutStatus('failed');
      setErrorMsg(
        err?.message || t('cartCheckout:checkout.validation.unexpectedError')
      );
    }
  };

  const handleResetForNewOrder = () => {
    idempotencyKeyRef.current = generateNewIdempotencyKey();
    setErrorMsg('');
    setCheckoutStatus('idle');
  };

  const handleRequestRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryOrderCodeInput.trim() || !recoveryEmailInput.trim() || sendingRecoveryEmail) return;
    setSendingRecoveryEmail(true);
    setRecoveryEmailSentMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_recovery_link',
          orderCode: recoveryOrderCodeInput.trim().toUpperCase(),
          email: recoveryEmailInput.trim(),
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setRecoveryEmailSentMsg(
        t('cartCheckout:checkout.recoveryBanner.defaultSentMsg')
      );
    } catch {
      setRecoveryEmailSentMsg(t('cartCheckout:checkout.recoveryBanner.errorMsg'));
    } finally {
      setSendingRecoveryEmail(false);
    }
  };

  if (recoveringSession) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center bg-[#FAF8F3] px-4 py-16 text-center">
        <div className="w-11 h-11 border-4 border-[#3E5641]/20 border-t-[#3E5641] rounded-full animate-spin mb-4" />
        <p className="font-philosopher text-[20px] font-bold text-[#3E5641]">
          {t('cartCheckout:checkout.recoveringTitle')}
        </p>
        <p className="text-[13.5px] text-[#666666] mt-1">
          {t('cartCheckout:checkout.recoveringSubtitle')}
        </p>
      </div>
    );
  }

  // Figma 77:3506 Order Confirmation & VietQR Payment view
  if (orderComplete && serverOrder) {
    return (
      <OrderConfirmation
        items={orderItems}
        order={serverOrder}
        recoveryToken={recoveryToken}
        orderId={serverOrder.id}
        fullName={serverOrder.customer.fullName}
        phone={serverOrder.customer.phone}
        email={serverOrder.customer.email}
        shippingMode={serverOrder.customer.shippingMode}
        address={
          serverOrder.customer.shippingMode === 'pickup'
            ? serverOrder.customer.pickupStore || pickupStore
            : (serverOrder.customer.formattedAddress ||
                formatCustomerDeliveryAddress(serverOrder.customer))
        }
        payment={
          serverOrder.paymentMethod === 'cod'
            ? t('cartCheckout:confirmation.paymentMethodLabels.cod')
            : t('cartCheckout:confirmation.paymentMethodLabels.bank')
        }
        paymentMethod={serverOrder.paymentMethod}
        paymentStatus={serverOrder.paymentStatus}
        paymentInstructions={serverOrder.paymentInstructions}
        orderCode={serverOrder.orderCode}
        orderDate={serverOrder.createdAt}
        orderStatus={serverOrder.orderStatus}
        subtotal={serverOrder.subtotal}
        shippingFee={serverOrder.shippingFee}
        discount={serverOrder.discount}
        total={serverOrder.total}
        note={serverOrder.customer.note}
        onOrderUpdated={(updated) => setServerOrder(updated)}
        onStartNewCheckout={() => {
          try {
            localStorage.removeItem('mnh_active_payment_session_v1');
            window.history.replaceState(null, '', '#/thanh-toan');
          } catch {}
          setOrderComplete(false);
          setServerOrder(null);
          setRecoveryToken(null);
          setCheckoutStatus('idle');
        }}
        onNavigate={onNavigate}
      />
    );
  }

  const isSubmitting = checkoutStatus === 'submitting' || checkoutStatus === 'validating';

  return (
    <div className={`checkout-page checkout-premium checkout-${shippingMode} py-10 md:py-16`}>
      <div className="figma-container max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* Editorial Page Header & Step Tracker */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3E5641]/10 text-[#3E5641] text-[12px] md:text-[13px] font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C89F5D]" />
            {t('cartCheckout:checkout.atelierBadge')}
          </div>
          <h1 className="font-philosopher font-bold text-[32px] sm:text-[44px] md:text-[50px] text-[#3E5641] leading-[1.15]">
            {t('cartCheckout:checkout.pageTitle')}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#666666] mt-2 max-w-[540px] mx-auto">
            {t('cartCheckout:checkout.pageSubtitle')}
          </p>

          {/* Luxury Step Indicator */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-6 text-[12.5px] sm:text-[13.5px] font-medium text-[#777777]">
            <span className="flex items-center gap-1.5 text-[#3E5641]">
              <span className="w-5 h-5 rounded-full bg-[#3E5641] text-white flex items-center justify-center text-[11px]">✓</span>
              {t('cartCheckout:checkout.steps.cart')}
            </span>
            <span className="w-8 h-[1px] bg-[#C89F5D]/40"></span>
            <span className="flex items-center gap-1.5 text-[#3E5641] font-semibold">
              <span className="w-5 h-5 rounded-full bg-[#C89F5D] text-white flex items-center justify-center text-[11px]">2</span>
              {t('cartCheckout:checkout.steps.info')}
            </span>
            <span className="w-8 h-[1px] bg-[#C89F5D]/40"></span>
            <span className="flex items-center gap-1.5 opacity-60">
              <span className="w-5 h-5 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center text-[11px]">3</span>
              {t('cartCheckout:checkout.steps.receive')}
            </span>
          </div>
        </div>

        {/* Recovery Error & Guest Recovery Link Request Banner (when an invalid/expired recovery link was opened) */}
        {recoveryError && (
          <div
            role="alert"
            data-testid="order-recovery-error-banner"
            className="mb-8 p-6 rounded-[20px] bg-white border-2 border-[#C89F5D]/50 shadow-sm max-w-[760px] mx-auto space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-philosopher font-bold text-[19px] text-[#203323]">
                  {t('cartCheckout:checkout.recoveryBanner.title')}
                </h2>
                <p className="text-[13.5px] text-[#555555] mt-1 leading-relaxed">{recoveryError}</p>
              </div>
            </div>

            <form
              onSubmit={handleRequestRecoveryEmail}
              className="pt-3 border-t border-[#EAE5DB] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-4">
                <label className="block text-[12px] font-semibold text-[#444444] mb-1">
                  {t('cartCheckout:checkout.recoveryBanner.orderCodeLabel')}
                </label>
                <input
                  type="text"
                  value={recoveryOrderCodeInput}
                  onChange={(e) => setRecoveryOrderCodeInput(e.target.value)}
                  placeholder={t('cartCheckout:checkout.recoveryBanner.orderCodePlaceholder')}
                  className="checkout-input font-mono uppercase"
                  required
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-[12px] font-semibold text-[#444444] mb-1">
                  {t('cartCheckout:checkout.recoveryBanner.emailLabel')}
                </label>
                <input
                  type="email"
                  value={recoveryEmailInput}
                  onChange={(e) => setRecoveryEmailInput(e.target.value)}
                  placeholder={t('cartCheckout:checkout.recoveryBanner.emailPlaceholder')}
                  className="checkout-input"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={sendingRecoveryEmail}
                  className="w-full h-[46px] rounded-full bg-[#3E5641] text-[#FAF8F3] text-[13px] font-semibold hover:bg-[#203323] transition-colors cursor-pointer"
                >
                  {sendingRecoveryEmail
                    ? t('cartCheckout:checkout.recoveryBanner.sending')
                    : t('cartCheckout:checkout.recoveryBanner.submit')}
                </button>
              </div>
            </form>

            {recoveryEmailSentMsg && (
              <p className="text-[13px] text-[#3E5641] font-medium bg-[#FAF8F3] p-3 rounded-xl border border-[#E5DFD5]">
                {recoveryEmailSentMsg}
              </p>
            )}
          </div>
        )}

        {/* Gift Card Attachments (if configured in cart) */}
        {items
          .filter((item) => item.giftConfiguration)
          .map((item) => {
            const localizedName = getCartProductTitle(item.product, locale);
            return (
              <aside
                key={item.product.id}
                className="checkout-gift-draft rounded-[18px] mb-8"
                aria-label={`${t('cartCheckout:checkout.giftDraft.ariaPrefix')} ${localizedName}`}
              >
                <div>
                  <h2>{t('cartCheckout:checkout.giftDraft.title')}</h2>
                  <p className="font-semibold text-[#3e5641] text-[15px]">{localizedName}</p>
                  <p>
                    {t('cartCheckout:checkout.giftDraft.description')}
                  </p>
                </div>
                <GiftCardPreview configuration={item.giftConfiguration!} compact />
              </aside>
            );
          })}

        {/* Two-Column Master Layout (Form Left, Sticky Summary Right) */}
        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
            
            {/* LEFT COLUMN: Customer Information, Shipping & Payment */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6">

              {/* SECTION 1: Buyer Information */}
              <section className="checkout-card p-6 sm:p-8 checkout-section-animate" aria-labelledby="section-buyer">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#EAE5DB]">
                  <span className="w-8 h-8 rounded-full bg-[#3E5641]/10 text-[#3E5641] flex items-center justify-center text-[14px] font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 id="section-buyer" className="font-philosopher font-bold text-[18px] sm:text-[20px] text-[#222222]">
                      {t('cartCheckout:checkout.buyer.heading')}
                    </h2>
                    <p className="text-[12.5px] text-[#777777]">{t('cartCheckout:checkout.buyer.subtitle')}</p>
                  </div>
                </div>

                {/* Salutation / Title */}
                <div className="flex items-center gap-6 mb-4 text-[13.5px] text-[#444444]">
                  <span className="text-[#888888] text-[13px]">{t('cartCheckout:checkout.buyer.salutationLabel')}</span>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'anh'}
                      onChange={() => setGender('anh')}
                      className="accent-[#3E5641] w-4 h-4 cursor-pointer"
                    />
                    <span className="group-hover:text-[#3E5641] transition-colors">{t('cartCheckout:checkout.buyer.salutationAnh')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'chi'}
                      onChange={() => setGender('chi')}
                      className="accent-[#3E5641] w-4 h-4 cursor-pointer"
                    />
                    <span className="group-hover:text-[#3E5641] transition-colors">{t('cartCheckout:checkout.buyer.salutationChi')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-fullName" className="block text-[13px] font-semibold text-[#222222] mb-1.5">
                      {t('cartCheckout:checkout.buyer.fullNameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="checkout-fullName" value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('cartCheckout:checkout.buyer.fullNamePlaceholder')}
                      className="checkout-input"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="block text-[13px] font-semibold text-[#222222] mb-1.5">
                      {t('cartCheckout:checkout.buyer.phoneLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="checkout-phone" value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('cartCheckout:checkout.buyer.phonePlaceholder')}
                      className="checkout-input"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="checkout-email" className="block text-[13px] font-semibold text-[#222222] mb-1.5">
                    {t('cartCheckout:checkout.buyer.emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="checkout-email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('cartCheckout:checkout.buyer.emailPlaceholder')}
                    className="checkout-input"
                    required
                  />
                  <p className="text-[11.5px] text-[#888888] mt-1.5 flex items-center gap-1.5">
                    <span>✉️</span> {t('cartCheckout:checkout.buyer.emailHint')}
                  </p>
                </div>
              </section>

              {/* SECTION 2: Delivery Selection */}
              <section className="checkout-card p-6 sm:p-8 checkout-section-animate" aria-labelledby="section-delivery">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#EAE5DB]">
                  <span className="w-8 h-8 rounded-full bg-[#3E5641]/10 text-[#3E5641] flex items-center justify-center text-[14px] font-bold shrink-0">
                    <Truck className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 id="section-delivery" className="font-philosopher font-bold text-[18px] sm:text-[20px] text-[#222222]">
                      {t('cartCheckout:checkout.delivery.heading')}
                    </h2>
                    <p className="text-[12.5px] text-[#777777]">{t('cartCheckout:checkout.delivery.subtitle')}</p>
                  </div>
                </div>

                {/* Delivery Mode Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div
                    onClick={() => setShippingMode('delivery')}
                    className={`checkout-select-card ${shippingMode === 'delivery' ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setShippingMode('delivery')}
                    aria-pressed={shippingMode === 'delivery'}
                  >
                    <div className="checkout-radio-indicator" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[14.5px] text-[#222222]">{t('cartCheckout:checkout.delivery.deliveryTitle')}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#3E5641]/10 text-[#3E5641] text-[11px] font-bold">
                          {t('cartCheckout:checkout.delivery.deliveryBadge')}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#666666] mt-1 leading-[18px]">
                        {t('cartCheckout:checkout.delivery.deliveryDesc')}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setShippingMode('pickup')}
                    className={`checkout-select-card ${shippingMode === 'pickup' ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setShippingMode('pickup')}
                    aria-pressed={shippingMode === 'pickup'}
                  >
                    <div className="checkout-radio-indicator" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[14.5px] text-[#222222]">{t('cartCheckout:checkout.delivery.pickupTitle')}</span>
                      </div>
                      <p className="text-[12px] text-[#666666] mt-1 leading-[18px]">
                        {t('cartCheckout:checkout.delivery.pickupDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address Fields or Pickup Selector */}
                <div ref={shippingMotion}>
                  {shippingMode === 'delivery' ? (
                    <div className="space-y-4 pt-1">
                      {/* Optional Legacy Address Conversion Proposal */}
                      {legacyProposal?.isUnambiguous && !dismissProposal && (
                        <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#C89F5D]/40 text-[13px] space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#3E5641] flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#C89F5D]" /> {t('cartCheckout:checkout.delivery.legacyBanner.title')}
                            </span>
                            <span className="text-[11px] bg-[#C89F5D]/20 text-[#3E5641] px-2 py-0.5 rounded-full font-medium">
                              {t('cartCheckout:checkout.delivery.legacyBanner.badge')}
                            </span>
                          </div>
                          <p className="text-[#555555] text-[12.5px] leading-relaxed">
                            {t('cartCheckout:checkout.delivery.legacyBanner.desc')}
                          </p>
                          <div className="font-medium text-[#222222] bg-white p-2.5 rounded-lg border border-[#E5DFD5]">
                            {legacyProposal.proposedFormattedAddress}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleAcceptProposal}
                              className="px-3.5 py-1.5 rounded-full bg-[#3E5641] text-[#FAF8F3] text-[12px] font-medium hover:bg-[#203323] transition-colors"
                            >
                              {t('cartCheckout:checkout.delivery.legacyBanner.acceptBtn')}
                            </button>
                            <button
                              type="button"
                              onClick={handleDismissProposal}
                              className="px-3 py-1.5 rounded-full border border-[#D5CFC5] text-[#666666] text-[12px] hover:bg-stone-50 transition-colors"
                            >
                              {t('cartCheckout:checkout.delivery.legacyBanner.dismissBtn')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2-tier Dropdowns: Tỉnh/Thành phố & Phường/Xã/Đặc khu */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <SearchableAddressSelect
                          id="checkout-province"
                          label={t('cartCheckout:checkout.delivery.provinceLabel')}
                          required
                          placeholder={t('cartCheckout:checkout.delivery.provincePlaceholder')}
                          searchPlaceholder={t('cartCheckout:checkout.delivery.provinceSearchPlaceholder')}
                          value={provinceCode}
                          options={provinceOptions}
                          onChange={handleProvinceChange}
                          emptyMessage={t('cartCheckout:checkout.delivery.provinceEmpty')}
                        />

                        <SearchableAddressSelect
                          id="checkout-commune"
                          label={t('cartCheckout:checkout.delivery.communeLabel')}
                          required
                          disabled={!provinceCode}
                          placeholder={
                            provinceCode
                              ? t('cartCheckout:checkout.delivery.communePlaceholder')
                              : t('cartCheckout:checkout.delivery.communeWaitPlaceholder')
                          }
                          searchPlaceholder={t('cartCheckout:checkout.delivery.communeSearchPlaceholder')}
                          value={communeCode}
                          options={communeOptions}
                          onChange={handleCommuneChange}
                          emptyMessage={
                            provinceCode
                              ? t('cartCheckout:checkout.delivery.communeEmptyProvinceSelected')
                              : t('cartCheckout:checkout.delivery.communeEmptyNoProvince')
                          }
                          helperText={
                            provinceCode && selectedProvince
                              ? t('cartCheckout:checkout.delivery.communeHelper', {
                                  provinceName: selectedProvince.fullName,
                                  count: communeOptions.length,
                                })
                              : undefined
                          }
                        />
                      </div>

                      {/* Detailed Street Address */}
                      <div>
                        <label
                          htmlFor="checkout-address"
                          className="block text-[12.5px] font-medium text-[#444444] mb-1"
                        >
                          {t('cartCheckout:checkout.delivery.streetLabel')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="checkout-address"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setAddressError('');
                          }}
                          placeholder={t('cartCheckout:checkout.delivery.streetPlaceholder')}
                          className={`checkout-input ${
                            addressError ? 'border-red-400 ring-1 ring-red-400/20' : ''
                          }`}
                          required
                        />
                        {addressError && (
                          <p className="text-red-500 text-[11.5px] mt-1 pl-1">{addressError}</p>
                        )}
                      </div>

                      {/* Formatted Address Preview */}
                      {formattedPreview && (
                        <div className="rounded-xl p-3 bg-[#FAF8F3] border border-[#E8E2D5] text-[12.5px] flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-[#C89F5D] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#8C827A] text-[11px] uppercase tracking-wider block">
                              {t('cartCheckout:checkout.delivery.fullAddressLabel')}
                            </span>
                            <span className="font-medium text-[#2B3A2D] text-[13px] block mt-0.5">
                              {formattedPreview}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      <label className="block text-[13px] font-semibold text-[#222222]">
                        {t('cartCheckout:checkout.delivery.pickupLabel')}
                      </label>
                      <select
                        value={pickupStore}
                        onChange={(e) => setPickupStore(e.target.value)}
                        className="checkout-input checkout-select text-[14px]"
                      >
                        {(t('cartCheckout:checkout.delivery.pickupStores', { returnObjects: true }) as ReadonlyArray<{
                          value: string;
                          label: string;
                        }>).map((store) => (
                          <option key={store.value} value={store.value}>
                            {store.label}
                          </option>
                        ))}
                      </select>
                      <div className="p-3.5 rounded-[12px] bg-[#FAF8F3] border border-[#EAE5DB] text-[12.5px] text-[#666666] leading-[19px] flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#3E5641] shrink-0 mt-0.5" />
                        <span>
                          {t('cartCheckout:checkout.delivery.pickupNote')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* SECTION 3: Payment Method */}
              <section className="checkout-card p-6 sm:p-8 checkout-section-animate" aria-labelledby="section-payment">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#EAE5DB]">
                  <span className="w-8 h-8 rounded-full bg-[#3E5641]/10 text-[#3E5641] flex items-center justify-center text-[14px] font-bold shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 id="section-payment" className="font-philosopher font-bold text-[18px] sm:text-[20px] text-[#222222]">
                      {t('cartCheckout:checkout.payment.heading')}
                    </h2>
                    <p className="text-[12.5px] text-[#777777]">{t('cartCheckout:checkout.payment.subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Option 1: COD */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`checkout-select-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPaymentMethod('cod')}
                    aria-pressed={paymentMethod === 'cod'}
                  >
                    <div className="checkout-radio-indicator" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-[#3E5641]" />
                        <span className="font-semibold text-[14.5px] text-[#222222]">
                          {t('cartCheckout:checkout.payment.codTitle')}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#666666] mt-1 leading-[18px]">
                        {t('cartCheckout:checkout.payment.codDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Bank Transfer (VietQR) */}
                  <div
                    onClick={() => setPaymentMethod('bank')}
                    data-testid="payment-method-bank"
                    className={`checkout-select-card ${paymentMethod === 'bank' ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPaymentMethod('bank')}
                    aria-pressed={paymentMethod === 'bank'}
                  >
                    <div className="checkout-radio-indicator" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CreditCard className="w-4 h-4 text-[#C89F5D]" />
                        <span className="font-semibold text-[14.5px] text-[#222222]">
                          {t('cartCheckout:checkout.payment.bankTitle')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#C89F5D]/15 text-[#8E6746] text-[11px] font-bold">
                          {t('cartCheckout:checkout.payment.bankBadge')}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#666666] mt-1 leading-[18px]">
                        {t('cartCheckout:checkout.payment.bankDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Order Notes & Preferences */}
              <section className="checkout-card p-6 sm:p-8 checkout-section-animate" aria-labelledby="section-notes">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#EAE5DB]">
                  <span className="w-8 h-8 rounded-full bg-[#3E5641]/10 text-[#3E5641] flex items-center justify-center text-[14px] font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 id="section-notes" className="font-philosopher font-bold text-[18px] sm:text-[20px] text-[#222222]">
                      {t('cartCheckout:checkout.notes.heading')}
                    </h2>
                    <p className="text-[12.5px] text-[#777777]">{t('cartCheckout:checkout.notes.subtitle')}</p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('cartCheckout:checkout.notes.placeholder')}
                  className="w-full p-4 rounded-[12px] border border-[#D9D2C7] text-[14px] text-[#222222] placeholder:text-[#9E968B] focus:outline-none focus:border-[#3E5641] focus:ring-2 focus:ring-[#3E5641]/15 transition-all"
                />

                <div className="space-y-3 pt-3 text-[13px] text-[#555555]">
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={agreePromo}
                      onChange={(e) => setAgreePromo(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#3e5641] cursor-pointer"
                    />
                    <span className="group-hover:text-[#222222] transition-colors leading-[20px]">
                      {t('cartCheckout:checkout.notes.agreePromo')}
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#3e5641] cursor-pointer"
                    />
                    <span className="group-hover:text-[#222222] transition-colors leading-[20px]">
                      {t('cartCheckout:checkout.notes.saveInfo')}
                    </span>
                  </label>
                </div>
              </section>

              {/* Uncertain State Reconciliation Alert */}
              {checkoutStatus === 'uncertain' && (
                <div
                  role="alert"
                  className="p-5 rounded-[16px] bg-amber-50 border border-amber-300 text-amber-900 text-[13.5px] space-y-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[15px] text-amber-950">
                        {t('cartCheckout:checkout.uncertain.title')}
                      </p>
                      <p className="mt-1 leading-[22px] text-amber-800">
                        {errorMsg || t('cartCheckout:checkout.uncertain.defaultMsg')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-1 pl-8">
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder()}
                      className="px-5 py-2.5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[13px] hover:bg-[#203323] transition-colors shadow-xs"
                    >
                      {t('cartCheckout:checkout.uncertain.retryBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForNewOrder}
                      className="px-5 py-2.5 rounded-full bg-white border border-amber-300 text-amber-900 font-semibold text-[13px] hover:bg-amber-100 transition-colors"
                    >
                      {t('cartCheckout:checkout.uncertain.newKeyBtn')}
                    </button>
                  </div>
                </div>
              )}

              {/* Generic Error Alert */}
              {errorMsg && checkoutStatus !== 'uncertain' && (
                <div
                  role="alert"
                  className="p-4 rounded-[14px] bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-[20px]">{errorMsg}</span>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Sticky Order Summary & Primary Action */}
            <div className="lg:col-span-5 xl:col-span-5">
              <aside className="checkout-card checkout-sticky-summary p-6 sm:p-7 space-y-6" aria-labelledby="section-summary">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DB]">
                  <h2 id="section-summary" className="font-philosopher font-bold text-[20px] text-[#3E5641]">
                    {t('cartCheckout:checkout.summary.heading')}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#E5DFD5] text-[#3E5641] text-[12px] font-semibold">
                    {t('cartCheckout:checkout.summary.itemCount', {
                      count: items.reduce<number>((acc, i) => acc + i.quantity, 0),
                    })}
                  </span>
                </div>

                {/* Product Items List */}
                <div className="divide-y divide-[#F0EBE1] max-h-[360px] overflow-y-auto pr-1">
                  {items.map(({ product, quantity, giftConfiguration }) => {
                    const localizedTitle = getCartProductTitle(product, locale);
                    const localizedSubtitle = getCartProductSubtitle(product, locale);
                    return (
                      <div key={product.id} className="py-3.5 flex items-start sm:items-center gap-3 sm:gap-3.5 group">
                        <div className="relative shrink-0">
                          <img
                            src={assetUrl(getOrderMedia(product.id)?.image || product.image)}
                            style={{ objectPosition: getOrderMedia(product.id)?.position }}
                            alt={localizedTitle}
                            className="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] rounded-[10px] object-cover border border-[#E5DFD5] bg-[#FAF8F3]"
                          />
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#3E5641] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {quantity}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-philosopher font-bold text-[14.5px] text-[#222222] leading-snug group-hover:text-[#3E5641] transition-colors">
                            {localizedTitle}
                          </h3>
                          <p className="text-[11.5px] text-[#777777] mt-0.5">
                            {localizedSubtitle}
                          </p>
                          {product.sku && (
                            <p
                              data-testid={`checkout-item-sku-${product.id}`}
                              className="text-[11px] font-mono text-[#555555] mt-0.5 leading-snug"
                            >
                              {t('common:labels.sku')}:{' '}
                              <span className="whitespace-nowrap font-semibold text-[#3E5641]">
                                {product.sku}
                              </span>
                            </p>
                          )}
                          <p className="text-[11px] text-[#777777] mt-0.5 leading-snug">
                            {t('common:labels.quantity')}: <strong className="text-[#222222]">{quantity}</strong> • {t('common:labels.unitPrice')}:{' '}
                            <span className="whitespace-nowrap">
                              {formatVnd(product.price, locale, 'compact-vi')}
                            </span>
                          </p>
                          {giftConfiguration && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#C89F5D] font-medium mt-0.5">
                              <Sparkles className="w-3 h-3" /> {t('cartCheckout:checkout.summary.giftAttached')}
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-semibold text-[14px] text-[#222222] block">
                            {formatVnd(product.price * quantity, locale, 'spaced-vi')}
                          </span>
                          <span className="text-[11px] text-[#888888]">
                            {t('cartCheckout:checkout.summary.perBox', {
                              price: formatVnd(product.price, locale, 'spaced-vi'),
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Financial Summary */}
                <div className="pt-4 border-t border-[#EAE5DB] space-y-2.5 text-[13.5px]">
                  <div className="flex justify-between text-[#666666]">
                    <span>{t('cartCheckout:checkout.summary.subtotal')}</span>
                    <span className="font-medium text-[#222222]">
                      {formatVnd(subtotal, locale, 'spaced-vi')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span className="flex items-center gap-1.5">
                      {t('cartCheckout:checkout.summary.shipping')}
                      <span className="text-[11px] text-[#C89F5D] bg-[#C89F5D]/10 px-1.5 py-0.5 rounded">
                        {t('cartCheckout:checkout.summary.shippingBadge')}
                      </span>
                    </span>
                    <span className="font-semibold text-[#3E5641]">
                      {t('cartCheckout:checkout.summary.shippingFree')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>{t('cartCheckout:checkout.summary.giftWrap')}</span>
                    <span className="font-medium text-[#3E5641]">{t('cartCheckout:checkout.summary.giftWrapFree')}</span>
                  </div>

                  {/* Total Row */}
                  <div className="pt-3 mt-3 border-t border-[#EAE5DB] flex justify-between items-baseline">
                    <span className="font-philosopher font-bold text-[17px] text-[#222222]">
                      {t('cartCheckout:checkout.summary.totalLabel')}
                    </span>
                    <div className="text-right">
                      <span className="font-philosopher font-bold text-[24px] sm:text-[26px] text-[#3E5641]">
                        {formatVnd(subtotal, locale, 'spaced-vi')}
                      </span>
                      <span className="block text-[11px] text-[#888888] -mt-1">
                        {t('cartCheckout:checkout.summary.taxNote')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Master Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className={`w-full min-h-[52px] rounded-full font-semibold text-[15px] sm:text-[16px] transition-all duration-200 shadow-md flex items-center justify-center gap-2.5 cursor-pointer ${
                    isSubmitting || items.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-[#3E5641] text-[#FAF8F3] hover:bg-[#203323] hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
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
                      <span>{t('cartCheckout:checkout.summary.submittingBtn')}</span>
                    </>
                  ) : checkoutStatus === 'uncertain' ? (
                    <>
                      <span>{t('cartCheckout:checkout.summary.retrySubmitBtn')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{t('cartCheckout:checkout.summary.confirmBtn')}</span>
                      <ArrowRight className="w-4 h-4 text-[#C89F5D]" />
                    </>
                  )}
                </button>

                {/* Brand Trust Badges */}
                <div className="pt-4 border-t border-[#F0EBE1] grid grid-cols-1 gap-2.5 text-[12px] text-[#666666]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#3E5641] shrink-0" />
                    <span>{t('cartCheckout:checkout.summary.trust1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-[#C89F5D] shrink-0" />
                    <span>{t('cartCheckout:checkout.summary.trust2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#3E5641] shrink-0" />
                    <span>{t('cartCheckout:checkout.summary.trust3Prefix')} <strong>{BUSINESS_CONTACT.hotlineDisplay}</strong></span>
                  </div>
                </div>

              </aside>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
};

export default CheckoutPage;

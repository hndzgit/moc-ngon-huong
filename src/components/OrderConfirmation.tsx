import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { assetUrl } from '../lib/assets';
import type {
  CartItem,
  OrderPaymentInstructions,
  OrderRecord,
  PageRoute,
  PaymentStatus,
} from '../types';
import { PRODUCTS, findLegacyOrderProductVisual } from '../data/products';
import { getOrderMedia } from '../data/figmaMedia';
import { getCartProductSubtitle, getCartProductTitle } from '../data/localizedCatalog';
import { formatLocaleDateTime, formatVnd, normalizeLocale } from '../lib/locale';
import {
  buildOrderPaymentInstructions,
  DEFAULT_VIETQR_ACCOUNT_NAME,
  DEFAULT_VIETQR_ACCOUNT_NO,
  DEFAULT_VIETQR_BANK_BIN,
  DEFAULT_VIETQR_BANK_FULL_NAME,
  DEFAULT_VIETQR_BANK_SHORT_NAME,
} from '../lib/vietqr';
import { useAuth } from '../context/AuthContext';
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
  FileText,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  QrCode,
  RefreshCw,
  AlertCircle,
  Link2,
} from 'lucide-react';

export interface OrderConfirmationProps {
  items: CartItem[];
  order?: OrderRecord | null;
  recoveryToken?: string | null;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  payment: string;
  paymentMethod?: 'cod' | 'bank';
  paymentStatus?: PaymentStatus | string;
  paymentInstructions?: OrderPaymentInstructions | null;
  shippingMode?: 'delivery' | 'pickup';
  orderId?: string;
  orderCode?: string;
  orderDate?: string;
  orderStatus?: string;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  total?: number;
  note?: string;
  onOrderUpdated?: (updated: OrderRecord) => void;
  onStartNewCheckout?: () => void;
  onNavigate: (page: PageRoute) => void;
}

export function OrderConfirmation({
  items,
  order,
  recoveryToken,
  fullName,
  phone,
  email,
  address,
  payment,
  paymentMethod = 'cod',
  paymentStatus: propPaymentStatus,
  paymentInstructions: propPaymentInstructions,
  shippingMode = 'delivery',
  orderId: propOrderId,
  orderCode: propOrderCode,
  orderDate,
  orderStatus = 'Đang chuẩn bị',
  subtotal: propSubtotal,
  shippingFee: propShippingFee = 0,
  discount: propDiscount = 0,
  total: propTotal,
  note,
  onOrderUpdated,
  onStartNewCheckout,
  onNavigate,
}: OrderConfirmationProps) {
  const { t, i18n } = useTranslation(['cartCheckout', 'common']);
  const locale = normalizeLocale(i18n.language);
  const { user, getIdToken, ensureGuestAuthToken } = useAuth();

  const effectiveOrderId = order?.id || propOrderId || '';
  const effectiveOrderCode = order?.orderCode || propOrderCode || '';
  const effectivePaymentMethod = order?.paymentMethod || paymentMethod;
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<string>(
    order?.paymentStatus ||
      propPaymentStatus ||
      (effectivePaymentMethod === 'bank' ? 'pending_payment' : 'pending')
  );
  const [customerReportedAt, setCustomerReportedAt] = useState<string | null>(
    order?.customerReportedAt || null
  );
  const [paymentConfirmedAt, setPaymentConfirmedAt] = useState<string | null>(
    order?.paymentConfirmedAt || null
  );

  useEffect(() => {
    if (order?.paymentStatus) {
      setCurrentPaymentStatus(order.paymentStatus);
    } else if (propPaymentStatus) {
      setCurrentPaymentStatus(propPaymentStatus);
    }
    if (order?.customerReportedAt) {
      setCustomerReportedAt(order.customerReportedAt);
    }
    if (order?.paymentConfirmedAt) {
      setPaymentConfirmedAt(order.paymentConfirmedAt);
    }
  }, [order?.paymentStatus, propPaymentStatus, order?.customerReportedAt, order?.paymentConfirmedAt]);

  const [copiedField, setCopiedField] = useState<'code' | 'account' | 'content' | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // Reporting transfer state ("Tôi đã chuyển khoản")
  const [reportingTransfer, setReportingTransfer] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(
    currentPaymentStatus === 'customer_reported_paid'
      ? t('cartCheckout:confirmation.reportMessages.defaultFeedback')
      : null
  );
  const [reportError, setReportError] = useState<string | null>(null);

  // Guest-to-Account linking state
  const [linkingOrder, setLinkingOrder] = useState(false);
  const [linkedSuccessMsg, setLinkedSuccessMsg] = useState<string | null>(null);

  // Refreshing authoritative order state
  const [refreshingOrder, setRefreshingOrder] = useState(false);

  // Reconstruct display items from CartItem[] OR OrderRecord.items (for recovered orders)
  const displayItems = useMemo(() => {
    if (order?.items && order.items.length > 0) {
      return order.items.map((snap) => {
        const found = PRODUCTS.find((p) => p.id === snap.productId);
        const visualFallback = findLegacyOrderProductVisual(snap.productId);
        const resolvedEmotion = found?.emotion || visualFallback.emotion;
        const resolvedProduct = found || ({ id: snap.productId, name: snap.productName, emotion: resolvedEmotion || 'ALL' } as any);
        return {
          id: snap.productId,
          sku: typeof snap.sku === 'string' && snap.sku.trim() ? snap.sku.trim() : undefined,
          name: getCartProductTitle(resolvedProduct, locale),
          subtitle: resolvedEmotion
            ? getCartProductSubtitle(resolvedProduct, locale)
            : t('cartCheckout:confirmation.items.defaultSubtitle'),
          price: snap.price,
          quantity: snap.quantity,
          image:
            getOrderMedia(snap.productId)?.image ||
            snap.image ||
            visualFallback.image,
          position: getOrderMedia(snap.productId)?.position,
        };
      });
    }
    if (items && items.length > 0) {
      return items.map(({ product, quantity }) => ({
        id: product.id,
        sku: product.sku,
        name: getCartProductTitle(product, locale),
        subtitle: getCartProductSubtitle(product, locale),
        price: product.price,
        quantity,
        image: getOrderMedia(product.id)?.image || product.image,
        position: getOrderMedia(product.id)?.position,
      }));
    }
    return [];
  }, [items, order?.items, locale, t]);

  const calculatedSubtotal = displayItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const subtotal = order?.subtotal ?? propSubtotal ?? calculatedSubtotal;
  const shippingFee = order?.shippingFee ?? propShippingFee;
  const discount = order?.discount ?? propDiscount;
  const total = order?.total ?? propTotal ?? subtotal + shippingFee - discount;

  // Build authoritative VietQR instructions for bank transfer orders
  const vietQrDetails = useMemo<OrderPaymentInstructions | null>(() => {
    if (effectivePaymentMethod !== 'bank') return null;
    const rawInst = order?.paymentInstructions || propPaymentInstructions;
    if (effectiveOrderCode && total > 0) {
      try {
        return buildOrderPaymentInstructions({
          orderCode: effectiveOrderCode,
          amount: total,
          bankBin: rawInst?.bankBin || DEFAULT_VIETQR_BANK_BIN,
          accountNo: rawInst?.accountNo || DEFAULT_VIETQR_ACCOUNT_NO,
          accountName: rawInst?.accountName || DEFAULT_VIETQR_ACCOUNT_NAME,
        });
      } catch {
        if (rawInst) return rawInst;
      }
    }
    return rawInst || null;
  }, [effectivePaymentMethod, order?.paymentInstructions, propPaymentInstructions, effectiveOrderCode, total]);

  const money = (n: number) => formatVnd(n, locale, 'spaced-vi');

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });

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
      } catch {}
    }
    return () => {
      confetti.reset();
    };
  }, []);

  const handleCopyText = async (text: string, field: 'code' | 'account' | 'content') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedField(null), 2400);
    } catch {
      setCopiedField(null);
    }
  };

  const handleReportTransfer = async () => {
    if (!effectiveOrderId || reportingTransfer) return;
    setReportingTransfer(true);
    setReportError(null);

    try {
      let idToken = await getIdToken();
      if (!idToken) {
        const guestAuth = await ensureGuestAuthToken();
        idToken = guestAuth.idToken;
      }

      const activeToken = recoveryToken || order?.recoveryToken || undefined;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          ...(activeToken ? { 'x-order-recovery-token': activeToken } : {}),
        },
        body: JSON.stringify({
          action: 'report_transfer',
          orderId: effectiveOrderId,
          locale,
          ...(activeToken ? { recoveryToken: activeToken } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || t('cartCheckout:confirmation.reportMessages.failed')
        );
      }

      const updated: OrderRecord = data.order;
      setCurrentPaymentStatus(updated.paymentStatus);
      if (updated.customerReportedAt) {
        setCustomerReportedAt(updated.customerReportedAt);
      }
      if (updated.paymentConfirmedAt) {
        setPaymentConfirmedAt(updated.paymentConfirmedAt);
      }
      setReportFeedback(
        t('cartCheckout:confirmation.reportMessages.defaultFeedback')
      );
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }
    } catch (err: any) {
      setReportError(err?.message || t('cartCheckout:confirmation.reportMessages.networkError'));
    } finally {
      setReportingTransfer(false);
    }
  };

  const handleRefreshOrderStatus = async () => {
    if (!effectiveOrderId || refreshingOrder) return;
    setRefreshingOrder(true);
    setReportError(null);
    try {
      let idToken = await getIdToken();
      if (!idToken) {
        const guestAuth = await ensureGuestAuthToken();
        idToken = guestAuth.idToken;
      }
      const activeToken = recoveryToken || order?.recoveryToken || undefined;
      const url = `/api/orders?orderId=${encodeURIComponent(effectiveOrderId)}${
        activeToken ? `&token=${encodeURIComponent(activeToken)}` : ''
      }`;
      const res = await fetch(url, {
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          ...(activeToken ? { 'x-order-recovery-token': activeToken } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.order) {
        const refreshed: OrderRecord = data.order;
        setCurrentPaymentStatus(refreshed.paymentStatus);
        if (refreshed.customerReportedAt) setCustomerReportedAt(refreshed.customerReportedAt);
        if (refreshed.paymentConfirmedAt) setPaymentConfirmedAt(refreshed.paymentConfirmedAt);
        if (onOrderUpdated) onOrderUpdated(refreshed);
      }
    } catch {} finally {
      setRefreshingOrder(false);
    }
  };

  const handleLinkGuestOrderToAccount = async () => {
    const activeToken = recoveryToken || order?.recoveryToken;
    if (!user || !effectiveOrderId || !activeToken || linkingOrder) return;
    setLinkingOrder(true);
    setReportError(null);
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error(t('cartCheckout:confirmation.reloginError'));
      const res = await fetch('/api/me/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: 'link_guest_order',
          orderId: effectiveOrderId,
          recoveryToken: activeToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('cartCheckout:confirmation.linkError'));
      }
      setLinkedSuccessMsg(
        t('cartCheckout:confirmation.linkedDefault', { code: effectiveOrderCode })
      );
      if (onOrderUpdated && data.order) {
        onOrderUpdated(data.order);
      }
    } catch (err: any) {
      setReportError(err?.message || t('cartCheckout:confirmation.linkError'));
    } finally {
      setLinkingOrder(false);
    }
  };

  const formattedDate = orderDate
    ? formatLocaleDateTime(orderDate, locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const isPaid = currentPaymentStatus === 'paid' || currentPaymentStatus === 'completed';
  const isReported = currentPaymentStatus === 'customer_reported_paid';
  const isCancelled = currentPaymentStatus === 'cancelled' || order?.orderStatus === 'cancelled';

  const rawOrderStatus = order?.orderStatus || orderStatus || 'pending';
  const resolvedPickup = (order?.customer?.shippingMode || shippingMode) === 'pickup';
  const displayOrderStatus =
    ({
      pending: t('cartCheckout:confirmation.orderStatuses.pending'),
      pending_confirmation: resolvedPickup
        ? t('cartCheckout:confirmation.orderStatuses.preparingPickup')
        : t('cartCheckout:confirmation.orderStatuses.preparingDelivery'),
      preparing: resolvedPickup
        ? t('cartCheckout:confirmation.orderStatuses.preparingPickup')
        : t('cartCheckout:confirmation.orderStatuses.preparingDelivery'),
      confirmed: t('cartCheckout:confirmation.orderStatuses.confirmed'),
      ready_for_pickup: t('cartCheckout:confirmation.orderStatuses.readyForPickup'),
      shipping: t('cartCheckout:confirmation.orderStatuses.shipping'),
      delivered: t('cartCheckout:confirmation.orderStatuses.delivered'),
      completed: resolvedPickup
        ? t('cartCheckout:confirmation.orderStatuses.completedPickup')
        : t('cartCheckout:confirmation.orderStatuses.completedDelivery'),
      cancelled: t('cartCheckout:confirmation.orderStatuses.cancelled'),
    } as Record<string, string>)[rawOrderStatus] || rawOrderStatus;

  const paymentBadgeInfo = useMemo(() => {
    if (isPaid) {
      return {
        label: t('cartCheckout:confirmation.paymentStatuses.paid'),
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-600',
      };
    }
    if (isReported) {
      return {
        label: t('cartCheckout:confirmation.paymentStatuses.reported'),
        className: 'bg-blue-50 text-blue-800 border-blue-200',
        dotClass: 'bg-blue-600 animate-pulse',
      };
    }
    if (currentPaymentStatus === 'payment_review') {
      return {
        label: t('cartCheckout:confirmation.paymentStatuses.review'),
        className: 'bg-purple-50 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-600',
      };
    }
    if (isCancelled) {
      return {
        label: t('cartCheckout:confirmation.paymentStatuses.cancelled'),
        className: 'bg-rose-50 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-600',
      };
    }
    if (effectivePaymentMethod === 'cod') {
      return {
        label: t('cartCheckout:confirmation.paymentStatuses.cod'),
        className: 'bg-[#3E5641]/10 text-[#3E5641] border-[#3E5641]/20',
        dotClass: 'bg-[#3E5641]',
      };
    }
    return {
      label: t('cartCheckout:confirmation.paymentStatuses.pendingVietQr'),
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500 animate-pulse',
    };
  }, [isPaid, isReported, currentPaymentStatus, isCancelled, effectivePaymentMethod, t]);

  return (
    <section
      className="order-confirmation-section min-h-screen py-12 md:py-20 bg-[#FAF8F3] text-[#222222] font-sans"
      data-figma-node="77:3506"
    >
      <div className="max-w-[920px] mx-auto px-4 sm:px-6">
        {/* Animated Success Badge & Header */}
        <div className="text-center mb-10 md:mb-12 checkout-section-animate">
          <div className="flex justify-center mb-5">
            <div className="relative order-success-badge">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#3E5641] to-[#2B3C2D] flex items-center justify-center text-[#F7F4D5] shadow-xl order-gold-ring border-4 border-[#FAF8F3]">
                {effectivePaymentMethod === 'bank' && !isPaid ? (
                  <QrCode className="w-10 h-10 md:w-12 md:h-12 stroke-[2]" />
                ) : (
                  <Check className="w-10 h-10 md:w-12 md:h-12 stroke-[2.5]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C89F5D] flex items-center justify-center text-white shadow-md border-2 border-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <p className="font-serif text-[#C89F5D] tracking-[.25em] text-[12px] md:text-[13px] uppercase font-semibold mb-2">
            {t('cartCheckout:confirmation.brandKicker')}
          </p>
          <h1 className="font-philosopher text-[#3E5641] font-bold text-[30px] sm:text-[42px] md:text-[50px] leading-tight tracking-wide">
            {effectivePaymentMethod === 'bank' && !isPaid
              ? t('cartCheckout:confirmation.headingBankPending')
              : t('cartCheckout:confirmation.headingSuccess')}
          </h1>
          <p className="mt-3 text-[#666666] text-[15px] sm:text-[16px] md:text-[17px] max-w-2xl mx-auto leading-relaxed">
            {isPaid
              ? t('cartCheckout:confirmation.subtitlePaid')
              : effectivePaymentMethod === 'bank'
              ? t('cartCheckout:confirmation.subtitleBankPending')
              : t('cartCheckout:confirmation.subtitleCod')}
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="h-[1px] w-12 bg-[#C89F5D]/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#C89F5D]" />
            <span className="h-[1px] w-12 bg-[#C89F5D]/30" />
          </div>
        </div>

          {/* Main Luxury Receipt Container */}
        <div className="order-receipt bg-white rounded-[24px] p-3.5 sm:p-8 md:p-10 shadow-sm border border-[#E5DFD5]">
          {/* Top Order Code & Status Strip */}
          {effectiveOrderCode && (
            <div className="bg-[#FAF8F3] rounded-[18px] p-5 sm:p-6 mb-8 border border-[#E5DFD5]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
                <div>
                  <span className="text-[12px] font-semibold tracking-wider text-[#8E867B] uppercase block mb-1">
                    {t('cartCheckout:confirmation.yourOrderCodeLabel')}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <strong
                      data-testid="order-confirmation-code"
                      className="text-[20px] sm:text-[24px] text-[#3E5641] font-mono tracking-wider"
                    >
                      {effectiveOrderCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(effectiveOrderCode, 'code')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-white text-[#3E5641] border border-[#3E5641]/25 hover:bg-[#3E5641]/5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title={t('cartCheckout:confirmation.copyOrderCodeTitle')}
                    >
                      {copiedField === 'code' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#3E5641]" />
                          <span className="text-[#3E5641] font-semibold">{t('cartCheckout:confirmation.copiedCodeBtn')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('cartCheckout:confirmation.copyCodeBtn')}</span>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3E5641]/10 text-[#3E5641] font-medium text-[12.5px] border border-[#3E5641]/15">
                      <span className="w-2 h-2 rounded-full bg-[#3E5641]"></span>
                      {displayOrderStatus}
                    </span>
                    <span
                      data-testid="order-payment-status-badge"
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-[12.5px] border ${paymentBadgeInfo.className}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${paymentBadgeInfo.dotClass}`}></span>
                      {paymentBadgeInfo.label}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="text-[13.5px] text-[#555555]">
                      {t('cartCheckout:confirmation.totalLabelInline')}{' '}
                      <strong
                        data-testid="order-confirmation-header-total"
                        className="text-[#3E5641] font-bold"
                      >
                        {money(total)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest-to-Account Linking Prompt if signed in while viewing a guest order */}
              {user && order?.isGuestOrder && (recoveryToken || order?.recoveryToken) && !linkedSuccessMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-white border border-[#C89F5D]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[13px] text-[#444444]">
                    <strong className="text-[#3E5641]">{t('cartCheckout:confirmation.syncPromptStrong')}</strong> {t('cartCheckout:confirmation.syncPromptBodyPrefix')}{' '}
                    <span className="font-medium">{user.email}</span>{t('cartCheckout:confirmation.syncPromptBodySuffix')}
                  </div>
                  <button
                    type="button"
                    disabled={linkingOrder}
                    onClick={handleLinkGuestOrderToAccount}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#3E5641] text-[#FAF8F3] text-[12.5px] font-semibold hover:bg-[#2B3C2D] transition-colors shrink-0 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{linkingOrder ? t('cartCheckout:confirmation.linkingBtn') : t('cartCheckout:confirmation.linkBtn')}</span>
                  </button>
                </div>
              )}

              {linkedSuccessMsg && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{linkedSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================
              DYNAMIC VIETQR PAYMENT SECTION (WHEN PAYMENT METHOD === 'bank')
          ================================================================== */}
          {effectivePaymentMethod === 'bank' && vietQrDetails && (
            <div
              data-testid="vietqr-payment-panel"
              className="bg-gradient-to-br from-[#FAF6EE] to-[#F5EFE2] border-2 border-[#C89F5D]/50 rounded-[22px] p-3.5 sm:p-7 mb-8 shadow-xs"
            >
              {/* Confirmed Paid State Banner */}
              {isPaid ? (
                <div
                  data-testid="vietqr-confirmed-paid-banner"
                  className="bg-emerald-50 border border-emerald-200 rounded-[18px] p-6 text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="font-philosopher font-bold text-[22px] text-emerald-900">
                    {t('cartCheckout:confirmation.paidBanner.title')}
                  </h3>
                  <p className="text-[14.5px] text-emerald-800 max-w-xl mx-auto leading-relaxed">
                    {t('cartCheckout:confirmation.paidBanner.note')}
                  </p>
                  {paymentConfirmedAt && (
                    <p className="text-[12.5px] text-emerald-700 font-medium">
                      {t('cartCheckout:confirmation.paidBanner.confirmedAt', {
                        time: formatLocaleDateTime(paymentConfirmedAt, locale),
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#C89F5D]/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#3E5641] text-[#FAF8F3] flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-philosopher font-bold text-[20px] sm:text-[22px] text-[#203323]">
                          {t('cartCheckout:confirmation.vietQrBox.title')}
                        </h2>
                        <p className="text-[12.5px] text-[#666666]">
                          {t('cartCheckout:confirmation.vietQrBox.subtitle')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRefreshOrderStatus}
                      disabled={refreshingOrder}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D9D2C7] text-[#3E5641] text-[12px] font-semibold hover:bg-[#FAF8F3] transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingOrder ? 'animate-spin' : ''}`} />
                      <span>{t('cartCheckout:confirmation.vietQrBox.refreshBtn')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left: Dynamic VietQR Code Frame */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <div className="bg-white rounded-[20px] p-3.5 sm:p-5 border-2 border-[#3E5641]/20 shadow-md w-full max-w-[300px] text-center">
                        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100 text-[12px] font-bold tracking-wider">
                          <span className="text-[#1A4B8C] uppercase">BIDV • {DEFAULT_VIETQR_BANK_BIN}</span>
                          <span className="text-[#C89F5D] uppercase">VietQR • NAPAS 247</span>
                        </div>

                        {vietQrDetails.qrSvgDataUrl && (
                          <div className="bg-white p-1 rounded-xl flex items-center justify-center">
                            <img
                              data-testid="vietqr-dynamic-image"
                              src={vietQrDetails.qrSvgDataUrl}
                              alt={t('cartCheckout:confirmation.vietQrBox.qrAlt', {
                                code: effectiveOrderCode,
                                amount: money(total),
                              })}
                              width={240}
                              height={240}
                              className="w-full max-w-[200px] sm:max-w-[240px] aspect-square h-auto object-contain mx-auto block"
                            />
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-0.5">
                          <p className="text-[12px] font-bold text-[#203323] uppercase tracking-wide">
                            {vietQrDetails.accountName || DEFAULT_VIETQR_ACCOUNT_NAME}
                          </p>
                          <p className="text-[13px] font-mono font-bold text-[#3E5641]">
                            {vietQrDetails.accountNo || DEFAULT_VIETQR_ACCOUNT_NO}
                          </p>
                          <p className="text-[11px] text-[#777777]">
                            {t('cartCheckout:confirmation.vietQrBox.autoFillPrefix')} <strong className="text-[#3E5641]">{effectiveOrderCode}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Bank Account Details, Copy Actions & Customer Report Button */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-white rounded-[16px] p-4 sm:p-5 border border-[#E5DFD5] space-y-3 text-[13.5px] sm:text-[14px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-gray-100">
                          <span className="text-[#777777]">{t('cartCheckout:confirmation.vietQrBox.bankLabel')}</span>
                          <strong className="text-[#222222] sm:text-right">
                            {DEFAULT_VIETQR_BANK_SHORT_NAME} — {DEFAULT_VIETQR_BANK_FULL_NAME}
                          </strong>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-gray-100">
                          <span className="text-[#777777]">{t('cartCheckout:confirmation.vietQrBox.accountOwnerLabel')}</span>
                          <strong
                            data-testid="vietqr-account-name"
                            className="text-[#203323] font-bold uppercase tracking-wide"
                          >
                            {vietQrDetails.accountName || DEFAULT_VIETQR_ACCOUNT_NAME}
                          </strong>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                          <div>
                            <span className="text-[#777777] block text-[12.5px]">{t('cartCheckout:confirmation.vietQrBox.accountNoLabel')}</span>
                            <strong
                              data-testid="vietqr-account-no"
                              className="text-[17px] sm:text-[18px] font-mono font-bold text-[#3E5641] tracking-wider"
                            >
                              {vietQrDetails.accountNo || DEFAULT_VIETQR_ACCOUNT_NO}
                            </strong>
                          </div>
                          <button
                            type="button"
                            data-testid="copy-account-no-btn"
                            onClick={() =>
                              handleCopyText(
                                vietQrDetails.accountNo || DEFAULT_VIETQR_ACCOUNT_NO,
                                'account'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#FAF8F3] text-[#3E5641] border border-[#3E5641]/25 hover:bg-[#3E5641] hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedField === 'account' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('cartCheckout:confirmation.vietQrBox.copiedAccountBtn')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t('cartCheckout:confirmation.vietQrBox.copyAccountBtn')}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                          <div>
                            <span className="text-[#777777] block text-[12.5px]">{t('cartCheckout:confirmation.vietQrBox.amountLabel')}</span>
                            <strong
                              data-testid="vietqr-amount"
                              className="text-[18px] sm:text-[20px] font-mono font-bold text-[#3E5641]"
                            >
                              {money(total)}
                            </strong>
                          </div>
                          <span className="text-[11.5px] px-2.5 py-1 rounded-md bg-[#3E5641]/10 text-[#3E5641] font-medium">
                            {t('cartCheckout:confirmation.vietQrBox.exactBadge')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[#777777] block text-[12.5px]">
                              {t('cartCheckout:confirmation.vietQrBox.transferContentLabel')}
                            </span>
                            <strong
                              data-testid="vietqr-transfer-content"
                              className="text-[18px] sm:text-[20px] font-mono font-bold text-[#B37424] tracking-wider"
                            >
                              {vietQrDetails.transferContent || effectiveOrderCode}
                            </strong>
                          </div>
                          <button
                            type="button"
                            data-testid="copy-transfer-content-btn"
                            onClick={() =>
                              handleCopyText(
                                vietQrDetails.transferContent || effectiveOrderCode,
                                'content'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#FAF6EE] text-[#B37424] border border-[#C89F5D]/50 hover:bg-[#C89F5D] hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedField === 'content' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('cartCheckout:confirmation.vietQrBox.copiedContentBtn')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t('cartCheckout:confirmation.vietQrBox.copyContentBtn')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Instructions note */}
                      <div className="text-[12.5px] text-[#555555] bg-white/80 rounded-xl p-3.5 border border-[#E5DFD5] leading-relaxed">
                        <strong>{t('cartCheckout:confirmation.vietQrBox.guideLabel')}</strong> {t('cartCheckout:confirmation.vietQrBox.guidePart1')} <strong>{t('cartCheckout:confirmation.vietQrBox.guideScanBold')}</strong> {t('cartCheckout:confirmation.vietQrBox.guidePart2')} <strong>{effectiveOrderCode}</strong>{t('cartCheckout:confirmation.vietQrBox.guidePart3')} <strong>{t('cartCheckout:confirmation.vietQrBox.guideBtnBold')}</strong> {t('cartCheckout:confirmation.vietQrBox.guidePart4')}
                      </div>

                      {/* Error message if reporting transfer failed */}
                      {reportError && (
                        <div
                          role="alert"
                          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-start gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                          <span>{reportError}</span>
                        </div>
                      )}

                      {/* Reported Confirmation Banner OR Action Button */}
                      {isReported || reportFeedback ? (
                        <div
                          data-testid="customer-reported-transfer-feedback"
                          className="p-4 rounded-[16px] bg-blue-50/90 border border-blue-200 text-blue-950 space-y-1.5"
                        >
                          <div className="flex items-center gap-2 font-bold text-[14.5px] text-blue-900">
                            <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0" />
                            <span>{t('cartCheckout:confirmation.vietQrBox.reportedBoxTitle')}</span>
                          </div>
                          <p className="text-[13.5px] leading-relaxed text-blue-900">
                            {t('cartCheckout:confirmation.reportMessages.defaultFeedback')}
                          </p>
                          {customerReportedAt && (
                            <p className="text-[11.5px] text-blue-700 pt-0.5">
                              {t('cartCheckout:confirmation.vietQrBox.reportedAt', {
                                time: formatLocaleDateTime(customerReportedAt, locale),
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-testid="customer-report-transfer-btn"
                          disabled={reportingTransfer || isCancelled}
                          onClick={handleReportTransfer}
                          className="w-full min-h-[52px] rounded-full bg-[#3E5641] hover:bg-[#2B3C2D] text-[#FAF8F3] font-semibold text-[15px] sm:text-[16px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                        >
                          <CheckCircle2 className="w-5 h-5 text-[#C89F5D]" />
                          <span>
                            {reportingTransfer
                              ? t('cartCheckout:confirmation.vietQrBox.reportButtonSubmitting')
                              : t('cartCheckout:confirmation.vietQrBox.reportButton')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ordered Items List */}
          <div className="mb-8">
            <h2 className="text-[14px] font-semibold text-[#8E867B] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#3E5641]" />
              {t('cartCheckout:confirmation.items.heading', { count: displayItems.length })}
            </h2>

            <div className="divide-y divide-[#E5DFD5]/60 border-t border-b border-[#E5DFD5]/60">
              {displayItems.map((item) => (
                <div key={item.id} className="flex gap-4 sm:gap-6 py-4.5 items-center">
                  <div className="relative shrink-0">
                    <img
                      src={assetUrl(item.image)}
                      style={{ objectPosition: item.position }}
                      alt={item.name}
                      className="w-[84px] sm:w-[104px] aspect-square object-cover rounded-[14px] border border-[#E5DFD5] bg-[#FAF8F3]"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#3E5641] text-[#FAF8F3] text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-philosopher text-[17px] sm:text-[20px] text-[#3E5641] font-bold truncate">
                      {item.name}
                    </h3>
                    <p className="text-[#777777] text-[13px] mt-0.5">{item.subtitle}</p>
                    {item.sku && (
                      <p
                        data-testid={`confirmation-item-sku-${item.id}`}
                        className="text-[#555555] text-[12px] font-mono mt-0.5"
                      >
                        {t('cartCheckout:confirmation.items.skuPrefix')}{' '}
                        <span className="whitespace-nowrap font-semibold text-[#3E5641]">
                          {item.sku}
                        </span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-[#3E5641] text-[16px] sm:text-[18px] font-semibold">
                        {money(item.price * item.quantity)}
                      </span>
                      <span className="text-[#777777] text-[12.5px]">
                        {t('cartCheckout:confirmation.items.qtyAndPrice', {
                          qty: item.quantity,
                          price: money(item.price),
                        })}
                      </span>
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
              {t('cartCheckout:confirmation.receiver.heading')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[14.5px]">
              {/* Recipient Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[100px] shrink-0">{t('cartCheckout:confirmation.receiver.recipientLabel')}</span>
                  <strong className="text-[#222222] font-semibold">{fullName}</strong>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[100px] shrink-0">{t('cartCheckout:confirmation.receiver.phoneLabel')}</span>
                  <a
                    href={`tel:${phone}`}
                    className="text-[#3E5641] font-semibold hover:underline"
                  >
                    {phone}
                  </a>
                </div>
                {email && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-[#8E867B] min-w-[100px] shrink-0">{t('cartCheckout:confirmation.receiver.emailLabel')}</span>
                    <span className="text-[#444444] break-all">{email}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Payment Method */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">{t('cartCheckout:confirmation.receiver.methodLabel')}</span>
                  <span className="text-[#222222] font-medium">
                    {shippingMode === 'pickup'
                      ? t('cartCheckout:confirmation.receiver.pickupText')
                      : t('cartCheckout:confirmation.receiver.deliveryText')}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">{t('cartCheckout:confirmation.receiver.addressLabel')}</span>
                  <span className="text-[#333333] leading-relaxed">{address}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#8E867B] min-w-[110px] shrink-0">{t('cartCheckout:confirmation.receiver.paymentLabel')}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#222222] font-medium">
                      {effectivePaymentMethod === 'bank'
                        ? t('cartCheckout:confirmation.paymentMethodLabels.bank')
                        : t('cartCheckout:confirmation.paymentMethodLabels.cod')}
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#3E5641]">
                      ({paymentBadgeInfo.label})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {note && (
              <div className="mt-4 pt-4 border-t border-[#E5DFD5]/80 flex items-start gap-2.5 text-[13.5px]">
                <FileText className="w-4 h-4 text-[#8E867B] shrink-0 mt-0.5" />
                <div className="text-[#555555]">
                  <strong className="text-[#333333] mr-1">{t('cartCheckout:confirmation.receiver.noteLabel')}</strong>
                  <span className="italic">&ldquo;{note}&rdquo;</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <dl className="border-t border-[#E5DFD5] pt-5 pb-6 mb-6 text-[15px] sm:text-[16px] space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-[#666666]">{t('cartCheckout:confirmation.breakdown.subtotal')}</dt>
              <dd className="font-medium text-[#222222]">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#666666]">{t('cartCheckout:confirmation.breakdown.shipping')}</dt>
              <dd className="font-semibold text-[#3E5641]">
                {shippingFee === 0 ? t('cartCheckout:confirmation.breakdown.shippingFree') : money(shippingFee)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#666666]">{t('cartCheckout:confirmation.breakdown.discount')}</dt>
                <dd className="font-medium text-[#B37424]">-{money(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between items-baseline gap-4 pt-4 border-t border-[#E5DFD5] text-[18px] sm:text-[22px] font-bold text-[#222222]">
              <dt className="font-philosopher">{t('cartCheckout:confirmation.breakdown.total')}</dt>
              <dd
                data-testid="order-confirmation-total"
                className="text-[#3E5641] font-mono font-bold text-[22px] sm:text-[26px]"
              >
                {money(total)}
              </dd>
            </div>
            <p className="text-right text-[#999999] text-[12px] mt-1">
              {t('cartCheckout:confirmation.breakdown.taxNote')}
            </p>
          </dl>

          {/* Luxury Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="rounded-full bg-[#3E5641] min-h-[50px] text-[#FAF8F3] font-semibold text-[14.5px] hover:bg-[#2B3C2D] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span>{t('cartCheckout:confirmation.actions.myOrders')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onStartNewCheckout) onStartNewCheckout();
                onNavigate('products');
              }}
              className="rounded-full border border-[#C89F5D] min-h-[50px] text-[#3E5641] bg-white font-semibold text-[14.5px] hover:bg-[#FAF8F3] hover:border-[#3E5641] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <span>{t('cartCheckout:confirmation.actions.continueShopping')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="rounded-full border border-[#D9D2C7] min-h-[50px] text-[#555555] bg-white font-medium text-[14.5px] hover:bg-gray-50 hover:text-[#222222] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <span>{t('cartCheckout:confirmation.actions.contact')}</span>
            </button>
          </div>

          {/* Reassurance Footer */}
          <div className="mt-8 pt-6 border-t border-[#E5DFD5]/70 text-center text-[13px] text-[#8E867B]">
            <p>
              {t('cartCheckout:confirmation.supportFooterPrefix')}{' '}
              <a href="tel:0889742556" className="text-[#3E5641] font-bold hover:underline">
                0889 742 556
              </a>{' '}
              {t('cartCheckout:confirmation.supportFooterOr')}{' '}
              <a
                href="mailto:mocngonhuong@gmail.com"
                className="text-[#3E5641] font-medium hover:underline"
              >
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

import { assetUrl } from '../lib/assets';
import { MotionDialog } from '../motion/MotionDialog';
import { useChangeMotion } from '../motion/motion';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthStep, PageRoute, OrderRecord, OrderStatus, PaymentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { findLegacyOrderProductVisual } from '../data/products';
import { getOrderMedia } from '../data/figmaMedia';
import { formatLocaleDateTime, formatVnd, normalizeLocale } from '../lib/locale';
import {
  getLocalizedEmotionName,
  getLocalizedProductNameById,
} from '../data/localizedCatalog';

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onNavigate,
}) => {
  const {
    user,
    isAuthAvailable,
    isEmailVerified,
    profile,
    login,
    register,
    logout,
    reloadUser,
    sendResetEmail,
    verifyResetCode,
    confirmReset,
    applyVerifyCode,
    updateProfileData,
    getIdToken,
  } = useAuth();

  const { t, i18n } = useTranslation(['authAccount', 'common']);
  const locale = normalizeLocale(i18n.language);

  const [step, setStep] = useState<AuthStep>(() => (user ? 'profile' : 'login'));
  const stateMotion = useChangeMotion<HTMLDivElement>(step, 'h1, form, .profile-card', 0.25);

  // Shared form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeAll, setAgreeAll] = useState(false);

  // Password visibility toggles
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Reset action code from Firebase email link
  const [resetActionCode, setResetActionCode] = useState<string | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sub-navigation within account: 'orders' | 'profile'
  const [profileTab, setProfileTab] = useState<'orders' | 'profile'>('orders');

  // Genuine database-backed orders from /api/me/orders
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 5;

  // Editing profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const isFigmaQa = import.meta.env.DEV && typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('figma-qa') ||
    (window.location.hash.includes('?') && new URLSearchParams(window.location.hash.split('?')[1]).has('figma-qa'))
  );
  const activeUser = user || (isFigmaQa ? { email: 'khachhang.demo@mocngonhuong.com', displayName: locale === 'en' ? 'Demo Tea Guest' : 'Khách Hàng Trải Nghiệm', emailVerified: true } : null);

  // Auto switch to profile if user signs in, unless explicitly overridden in dev
  useEffect(() => {
    if (user && step !== 'profile') {
      if (!isFigmaQa) {
        setStep('profile');
      }
    }
  }, [user, isFigmaQa]);

  // Load genuine database-backed customer orders
  const loadUserOrders = useCallback(async () => {
    if (!activeUser) {
      setUserOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      let idToken = await getIdToken();
      if (!idToken && isFigmaQa) {
        idToken = 'mock-token-user-a';
      }
      if (!idToken) {
        setOrdersError(t('errors.sessionUnauthenticated'));
        setOrdersLoading(false);
        return;
      }

      // Safely link any guest orders placed in the same browser with the same email and a valid recoveryToken
      if (activeUser.email) {
        try {
          const guestOrders: OrderRecord[] = JSON.parse(
            localStorage.getItem('mnh_guest_orders_v1') || '[]'
          );
          const matchingGuests = guestOrders.filter(
            (go) =>
              go?.id &&
              go?.recoveryToken &&
              String(go?.customer?.email || '').trim().toLowerCase() ===
                String(activeUser.email || '').trim().toLowerCase()
          );
          for (const go of matchingGuests) {
            await fetch('/api/me/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                action: 'link_guest_order',
                orderId: go.id,
                recoveryToken: go.recoveryToken,
              }),
            }).catch(() => {});
          }
        } catch {}
      }

      const response = await fetch('/api/me/orders?limit=50', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.status === 401) {
        setOrdersError(t('errors.sessionExpired'));
        setOrdersLoading(false);
        return;
      }
      if (response.status === 503) {
        setOrdersError(t('errors.dbMaintenance'));
        setOrdersLoading(false);
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        setUserOrders(data.orders);
      } else {
        setOrdersError(data.error || t('errors.loadOrdersFailed'));
      }
    } catch {
      setOrdersError(t('errors.loadOrdersNetwork'));
    } finally {
      setOrdersLoading(false);
    }
  }, [activeUser, getIdToken, isFigmaQa]);

  // Fetch orders when user signs in or opens profile
  useEffect(() => {
    if (activeUser && step === 'profile') {
      loadUserOrders();
    } else if (!activeUser) {
      setUserOrders([]);
      setSelectedOrder(null);
    }
  }, [activeUser, step, loadUserOrders]);

  // Check URL parameters for Firebase email actions (?mode=resetPassword / legacy ?mode=verifyEmail)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const mode = params.get('mode') || hashParams.get('mode');
    const oobCode = params.get('oobCode') || hashParams.get('oobCode');

    if (mode && oobCode) {
      if (mode === 'resetPassword') {
        setLoading(true);
        verifyResetCode(oobCode)
          .then((recoveredEmail) => {
            setEmail(recoveredEmail);
            setResetActionCode(oobCode);
            setStep('forgot-reset');
            setInfoMsg(t('messages.resetActiveFor', { email: recoveredEmail }));
            setErrorMsg('');
          })
          .catch(() => {
            setErrorMsg(t('errors.invalidResetLink'));
            setStep('forgot-email');
          })
          .finally(() => setLoading(false));
      } else if (mode === 'verifyEmail') {
        // Silently apply legacy verification code if present without interrupting customer shopping flow
        applyVerifyCode(oobCode).catch(() => {});
        // Clean URL to prevent stale mode parameter
        try {
          const cleanUrl = window.location.pathname + (window.location.hash ? window.location.hash.split('?')[0] : '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}
      }
    }
  }, [applyVerifyCode, verifyResetCode]);

  const switchStep = (next: AuthStep) => {
    setErrorMsg('');
    setInfoMsg('');
    setStep(next);
  };

  // 1. Login Submit (Figma 127:11104)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg(t('errors.missingCredentials'));
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg(t('errors.authUnavailable'));
        return;
      }
      const loggedUser = await login(email.trim(), password, rememberMe);
      onLoginSuccess(loggedUser.email || email.trim());
      setStep('profile');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg(t('errors.invalidCredential'));
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg(t('errors.tooManyRequests'));
      } else if (code === 'auth/invalid-email') {
        setErrorMsg(t('errors.invalidEmail'));
      } else {
        setErrorMsg(err.message || t('errors.genericLogin'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Simplified Autonomous Registration Submit (V17.0B)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg(t('errors.missingRegisterFields'));
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMsg(t('errors.invalidRegisterEmail'));
      return;
    }
    if (password.length < 8) {
      setErrorMsg(t('errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('errors.passwordMismatch'));
      return;
    }
    if (!agreeAll) {
      setErrorMsg(t('errors.mustAgreeTerms'));
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg(t('errors.registerUnavailable'));
        return;
      }
      const newUser = await register(email.trim(), password, fullName.trim(), address.trim());
      onLoginSuccess(newUser.email || email.trim());
      setRegistrationSuccess(true);
      setInfoMsg(
        t('messages.registerWelcome')
      );
      setStep('profile');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg(t('errors.emailInUse'));
      } else if (code === 'auth/weak-password') {
        setErrorMsg(t('errors.weakPassword'));
      } else {
        setErrorMsg(err.message || t('errors.genericRegister'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password Step 1: Send Reset Link (Figma 127:10877)
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim()) {
      setErrorMsg(t('errors.missingResetEmail'));
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg(t('errors.resetUnavailable'));
        return;
      }
      await sendResetEmail(email.trim());
      setInfoMsg(
        t('messages.resetSent')
      );
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        // Generic response to avoid email enumeration
        setInfoMsg(t('messages.resetNonEnumerating'));
      } else {
        setErrorMsg(t('errors.genericResetError'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password Submit (Figma 127:11753)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password.length < 8) {
      setErrorMsg(t('errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('errors.passwordMismatch'));
      return;
    }

    if (!resetActionCode) {
      setErrorMsg(t('errors.missingResetCode'));
      return;
    }

    setLoading(true);
    try {
      await confirmReset(resetActionCode, password);
      setStep('forgot-success');
    } catch (err: any) {
      setErrorMsg(t('errors.expiredResetCode'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Save edited profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      fullName: editFullName,
      address: editAddress,
      phone: editPhone,
    });
    setIsEditingProfile(false);
    setInfoMsg(t('messages.profileSaved'));
  };

  const handleStartEditProfile = () => {
    setEditFullName(profile?.fullName || user?.displayName || '');
    setEditAddress(profile?.address || '');
    setEditPhone(profile?.phone || '');
    setIsEditingProfile(true);
  };

  const isForgotFlow =
    step === 'forgot-email' ||
    step === 'forgot-reset' ||
    step === 'forgot-success';

  // Date & Currency formatters
  const formatVNDate = (isoStr: string) =>
    formatLocaleDateTime(isoStr, locale, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getItemImage = (item: { productId: string; image?: string }) => {
    const orderMedia = getOrderMedia(item.productId);
    if (orderMedia) return assetUrl(orderMedia.image);
    if (item.image) return assetUrl(item.image);
    return assetUrl(findLegacyOrderProductVisual(item.productId).image);
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return {
          label: t('orderStatuses.pending_confirmation.label'),
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          desc: t('orderStatuses.pending_confirmation.desc'),
        };
      case 'confirmed':
        return {
          label: t('orderStatuses.confirmed.label'),
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          desc: t('orderStatuses.confirmed.desc'),
        };
      case 'preparing':
        return {
          label: t('orderStatuses.preparing.label'),
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          desc: t('orderStatuses.preparing.desc'),
        };
      case 'ready_for_pickup':
        return {
          label: t('orderStatuses.ready_for_pickup.label'),
          color: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          desc: t('orderStatuses.ready_for_pickup.desc'),
        };
      case 'shipping':
        return {
          label: t('orderStatuses.shipping.label'),
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          desc: t('orderStatuses.shipping.desc'),
        };
      case 'completed':
        return {
          label: t('orderStatuses.completed.label'),
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          desc: t('orderStatuses.completed.desc'),
        };
      case 'cancelled':
        return {
          label: t('orderStatuses.cancelled.label'),
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          desc: t('orderStatuses.cancelled.desc'),
        };
      default:
        return {
          label: status,
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          dot: 'bg-gray-500',
          desc: '',
        };
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus | string, method: 'cod' | 'bank') => {
    if (status === 'paid' || status === 'completed') {
      return {
        label: t('paymentStatuses.paid'),
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (status === 'customer_reported_paid') {
      return {
        label: t('paymentStatuses.customer_reported_paid'),
        color: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    if (status === 'payment_review') {
      return {
        label: t('paymentStatuses.payment_review'),
        color: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    }
    if (status === 'cancelled') {
      return {
        label: t('paymentStatuses.cancelled'),
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (status === 'failed') {
      return {
        label: t('paymentStatuses.failed'),
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (status === 'refunded') {
      return {
        label: t('paymentStatuses.refunded'),
        color: 'bg-gray-50 text-gray-700 border-gray-200',
      };
    }
    if (method === 'cod') {
      return {
        label: t('paymentStatuses.cod'),
        color: 'bg-[#3e5641]/10 text-[#3e5641] border-[#3e5641]/20',
      };
    }
    return {
      label: t('paymentStatuses.pendingBank'),
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  };

  const handleContinueVietQrPayment = (order: OrderRecord) => {
    setSelectedOrder(null);
    const tokenParam = order.recoveryToken
      ? `&token=${encodeURIComponent(order.recoveryToken)}`
      : '';
    window.location.hash = `#/thanh-toan?orderId=${encodeURIComponent(order.id)}${tokenParam}`;
  };

  // Order filtering and pagination
  const filteredOrders = userOrders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return o.orderStatus === orderFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * ORDERS_PER_PAGE,
    orderPage * ORDERS_PER_PAGE
  );


  return (
    <div ref={stateMotion} className={`auth-page auth-${step} bg-white py-10 md:py-16`}>
      <div className="figma-container max-w-[1680px] mx-auto">
        {/* Quick Figma State Switcher for QA Inspection in DEV */}
        {import.meta.env.DEV && isFigmaQa && (
          <div className="qa-state-switcher mb-8 pb-4 border-b border-gray-100 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-[#888888] font-medium mr-1">{t('qaBar.label')}</span>
            {[
              { id: 'login' as AuthStep, label: t('qaBar.login') },
              { id: 'register' as AuthStep, label: t('qaBar.register') },
              { id: 'forgot-email' as AuthStep, label: t('qaBar.forgotEmail') },
              { id: 'forgot-reset' as AuthStep, label: t('qaBar.forgotReset') },
              { id: 'forgot-success' as AuthStep, label: t('qaBar.forgotSuccess') },
              { id: 'profile' as AuthStep, label: t('qaBar.profile') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchStep(tab.id)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  step === tab.id
                    ? 'bg-[#3e5641] text-[#f7f4d5] font-semibold'
                    : 'bg-[#f5f2ed] text-[#555555] hover:text-[#222222]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN: CUSTOMER ACCOUNT PROFILE (WHEN AUTHENTICATED)     */}
        {/* ========================================================= */}
        {step === 'profile' && activeUser && (
          <div className="profile-view max-w-[1140px] mx-auto">
            <div className="bg-[#faf8f3] rounded-[24px] p-5 sm:p-10 border border-[#e5dfd5] shadow-sm mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-[#e5dfd5]">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 max-w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-[#3e5641] text-[#f7f4d5] font-philosopher text-[24px] sm:text-[28px] font-bold flex items-center justify-center shadow-inner">
                    {(profile?.fullName || activeUser.displayName || activeUser.email || 'M')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-philosopher font-bold text-[22px] sm:text-[36px] text-[#203323] leading-tight truncate">
                      {profile?.fullName || activeUser.displayName || t('profile.fallbackGreeting')}
                    </h1>
                    <p className="text-[13px] sm:text-[14px] text-[#666666] truncate">{activeUser.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3e5641]/10 text-[#3e5641] border border-[#3e5641]/20 text-[13px] font-medium">
                    <svg className="w-4 h-4 text-[#3e5641]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('profile.memberBadge')}
                  </span>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2 rounded-full border border-red-300 text-red-700 text-[13.5px] font-medium hover:bg-red-50 transition-colors ml-auto sm:ml-0"
                  >
                    {t('profile.logout')}
                  </button>
                </div>
              </div>

              {registrationSuccess ? (
                <div className="mt-6 p-5 rounded-[14px] bg-[#f7f9f7] border border-[#3e5641]/20 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#3e5641] text-[#f7f4d5] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-philosopher font-bold text-[18px] text-[#203323] mb-1">
                      {t('profile.registerSuccessTitle')}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-[#4a554d]">
                      {t('profile.registerSuccessDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistrationSuccess(false)}
                    className="text-gray-400 hover:text-gray-600 text-[20px] leading-none p-1"
                    aria-label={t('profile.closeNoticeAria')}
                  >
                    ×
                  </button>
                </div>
              ) : infoMsg ? (
                <div className="mt-6 p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[14px]">
                  {infoMsg}
                </div>
              ) : null}
              {errorMsg && (
                <div className="mt-6 p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
                  {errorMsg}
                </div>
              )}

              {/* Sub-navigation Tabs: Đơn hàng của tôi vs Thông tin giao nhận */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-8 mb-6 border-b border-[#e5dfd5] pb-4">
                <div className="profile-tab-controls flex flex-wrap items-center gap-3 sm:gap-6 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileTab('orders');
                      setOrderPage(1);
                    }}
                    className={`relative pb-3 text-[17px] sm:text-[20px] font-philosopher font-bold transition-all ${
                      profileTab === 'orders'
                        ? 'text-[#3e5641] border-b-2 border-[#3e5641]'
                        : 'text-[#888888] hover:text-[#222222]'
                    }`}
                  >
                    {t('profile.tabs.orders')}
                    {userOrders.length > 0 && (
                      <span className="ml-2.5 px-2.5 py-0.5 rounded-full bg-[#3e5641] text-[#f7f4d5] text-[12px] font-mono font-medium">
                        {userOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileTab('profile')}
                    className={`relative pb-3 text-[17px] sm:text-[20px] font-philosopher font-bold transition-all ${
                      profileTab === 'profile'
                        ? 'text-[#3e5641] border-b-2 border-[#3e5641]'
                        : 'text-[#888888] hover:text-[#222222]'
                    }`}
                  >
                    {t('profile.tabs.info')}
                  </button>
                </div>

                {profileTab === 'orders' && (
                  <button
                    type="button"
                    onClick={() => loadUserOrders()}
                    disabled={ordersLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#e5dfd5] text-[#3e5641] text-[13px] font-medium hover:bg-[#faf7f2] transition-colors disabled:opacity-50 shadow-2xs"
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t('profile.refreshOrders')}
                  </button>
                )}
              </div>

              {/* ========================================================= */}
              {/* TAB 1: ĐƠN HÀNG CỦA TÔI (DATABASE-BACKED ORDER HISTORY)    */}
              {/* ========================================================= */}
              {profileTab === 'orders' && (
                <div className="orders-tab space-y-6">
                  {/* Status Filter Chips */}
                  {userOrders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pb-2">
                      {[
                        { key: 'ALL', label: t('profile.filters.all', { count: userOrders.length }) },
                        { key: 'pending_confirmation', label: t('profile.filters.pending') },
                        { key: 'confirmed', label: t('profile.filters.confirmed') },
                        { key: 'shipping', label: t('profile.filters.shipping') },
                        { key: 'completed', label: t('profile.filters.completed') },
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => {
                            setOrderFilter(chip.key);
                            setOrderPage(1);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors ${
                            orderFilter === chip.key
                              ? 'bg-[#3e5641] text-[#f7f4d5] font-semibold shadow-xs'
                              : 'bg-white text-[#555555] border border-[#e5dfd5] hover:text-[#222222]'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Loading State Skeleton */}
                  {ordersLoading && (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="bg-white rounded-[20px] p-6 border border-[#e5dfd5] animate-pulse space-y-4"
                        >
                          <div className="flex justify-between items-center">
                            <div className="h-5 bg-gray-200 rounded w-36"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                          </div>
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-[12px]"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {ordersError && !ordersLoading && (
                    <div className="bg-red-50 rounded-[18px] p-6 border border-red-200 text-center space-y-3">
                      <div className="w-10 h-10 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-[14.5px] text-red-800 font-medium">{ordersError}</p>
                      <button
                        type="button"
                        onClick={() => loadUserOrders()}
                        className="px-5 py-2 rounded-full bg-red-600 text-white font-medium text-[13px] hover:bg-red-700 transition-colors shadow-xs"
                      >
                        {t('common:actions.retry')}
                      </button>
                    </div>
                  )}

                  {/* Empty State */}
                  {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
                    <div className="bg-white rounded-[24px] p-10 sm:p-14 border border-[#e5dfd5] text-center max-w-[640px] mx-auto shadow-xs">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#3e5641]/10 flex items-center justify-center text-[#3e5641]">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="font-philosopher font-bold text-[24px] sm:text-[28px] text-[#203323] mb-3">
                        {t('profile.emptyOrdersTitle')}
                      </h3>
                      <p className="text-[#666666] text-[14.5px] leading-relaxed max-w-[460px] mx-auto mb-8">
                        {t('profile.emptyOrdersDesc')}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('products')}
                        className="px-8 py-3.5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-all shadow-md hover:shadow-lg"
                      >
                        {t('profile.exploreTeasCta')}
                      </button>
                    </div>
                  )}

                  {/* Order List Cards */}
                  {!ordersLoading && !ordersError && paginatedOrders.length > 0 && (
                    <div className="space-y-5">
                      {paginatedOrders.map((order) => {
                        const orderStatusInfo = getOrderStatusBadge(order.orderStatus);
                        const paymentStatusInfo = getPaymentStatusBadge(order.paymentStatus, order.paymentMethod);
                        const firstItem = order.items?.[0];
                        const additionalItemsCount = (order.items?.length || 0) - 1;

                        return (
                          <div
                            key={order.id || order.orderCode}
                            className="order-card bg-white rounded-[22px] p-5 sm:p-7 border border-[#e5dfd5] shadow-xs hover:border-[#3e5641]/40 transition-all"
                          >
                            {/* Card Top: Code, Date & Status Badges */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="font-mono font-bold text-[#3e5641] text-[16px] sm:text-[17px] tracking-wide">
                                  {order.orderCode}
                                </span>
                                <span className="text-[12.5px] text-[#888888]">
                                  • {formatVNDate(order.createdAt)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${orderStatusInfo.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${orderStatusInfo.dot}`}></span>
                                  {orderStatusInfo.label}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${paymentStatusInfo.color}`}>
                                  {paymentStatusInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Card Body: Items Preview */}
                            <div className="py-4 space-y-3">
                              {order.items?.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                  <img
                                    src={getItemImage(item)}
                                    style={{ objectPosition: getOrderMedia(item.productId)?.position }}
                                    alt={getLocalizedProductNameById(item.productId, item.productName, locale)}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] object-cover border border-black/5 shrink-0 bg-[#faf7f2]"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-philosopher font-bold text-[16px] sm:text-[17px] text-[#222222] truncate">
                                      {getLocalizedProductNameById(item.productId, item.productName, locale)}
                                    </h4>
                                    <p className="text-[13px] text-[#777777] mt-0.5">
                                      {t('profile.orderCard.qtyLabel')} <span className="font-medium text-[#222222]">{item.quantity}</span> • {t('profile.orderCard.unitPriceLabel')}{' '}
                                      <span className="font-medium text-[#222222]">{formatVnd(item.price, locale, 'spaced-vi')}</span>
                                      {item.sku && (
                                        <span className="font-mono text-[#555555] whitespace-nowrap">
                                          {t('profile.orderCard.skuLabel')}
                                          {item.sku}
                                        </span>
                                      )}
                                    </p>
                                    {item.giftConfiguration && (
                                      <span className="inline-block mt-1 text-[11px] font-medium text-[#8e6746] bg-[#f8f5ee] px-2 py-0.5 rounded-md">
                                        {t('profile.orderCard.giftTag')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-semibold text-[15px] sm:text-[16px] text-[#222222]">
                                      {formatVnd((item.price || 0) * (item.quantity || 1), locale, 'spaced-vi')}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {additionalItemsCount > 1 && (
                                <p className="text-[12.5px] text-[#888888] pt-1">
                                  {t('profile.orderCard.moreItems', { count: additionalItemsCount - 1 })}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Summary & Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                              <div className="text-[13px] text-[#666666]">
                                <span className="text-[#888888]">{t('profile.orderCard.deliverTo')}</span>{' '}
                                <strong className="text-[#333333]">
                                  {order.customer?.shippingMode === 'pickup'
                                    ? t('profile.orderCard.pickupSaved')
                                    : (order.customer?.formattedAddress ||
                                        (order.customer?.communeName
                                          ? [
                                              order.customer?.address,
                                              order.customer?.communeName,
                                              order.customer?.provinceName,
                                            ]
                                              .filter(Boolean)
                                              .join(', ')
                                          : [
                                              order.customer?.address,
                                              order.customer?.ward,
                                              order.customer?.district,
                                              order.customer?.city,
                                            ]
                                              .filter(Boolean)
                                              .join(', ') || t('profile.orderCard.savedAddressFallback')))}
                                </strong>
                              </div>

                              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-5">
                                <div className="text-right">
                                  <span className="text-[12px] text-[#888888] block">{t('profile.orderCard.totalLabel')}</span>
                                  <span className="font-bold text-[#3e5641] text-[18px] sm:text-[20px]">
                                    {formatVnd(order.total, locale, 'spaced-vi')}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {order.paymentMethod === 'bank' &&
                                    order.orderStatus !== 'cancelled' &&
                                    (order.paymentStatus === 'pending_payment' ||
                                      order.paymentStatus === 'pending' ||
                                      order.paymentStatus === 'customer_reported_paid') && (
                                      <button
                                        type="button"
                                        data-testid={`continue-payment-${order.orderCode}`}
                                        onClick={() => handleContinueVietQrPayment(order)}
                                        className="px-4 py-2.5 rounded-full bg-[#c89f5d] text-[#203323] font-bold text-[13px] hover:bg-[#b58c4b] transition-colors shadow-xs cursor-pointer"
                                      >
                                        {order.paymentStatus === 'customer_reported_paid'
                                          ? t('profile.orderCard.viewVietQr')
                                          : t('profile.orderCard.continuePayment')}
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="px-5 py-2.5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[13.5px] hover:bg-[#203323] transition-colors shadow-xs cursor-pointer"
                                  >
                                    {t('profile.orderCard.viewDetails')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {!ordersLoading && !ordersError && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                        disabled={orderPage === 1}
                        className="px-4 py-2 rounded-full border border-[#e5dfd5] bg-white text-[13px] font-medium text-[#444] disabled:opacity-40 hover:bg-[#faf7f2] transition-colors"
                      >
                        {t('profile.pagination.prev')}
                      </button>
                      <span className="text-[13.5px] font-medium text-[#666]">
                        {t('profile.pagination.info', { page: orderPage, total: totalPages })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderPage((p) => Math.min(totalPages, p + 1))}
                        disabled={orderPage === totalPages}
                        className="px-4 py-2 rounded-full border border-[#e5dfd5] bg-white text-[13px] font-medium text-[#444] disabled:opacity-40 hover:bg-[#faf7f2] transition-colors"
                      >
                        {t('profile.pagination.next')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: THÔNG TIN GIAO NHẬN & TÀI KHOẢN                     */}
              {/* ========================================================= */}
              {profileTab === 'profile' && (
                <div className="profile-details-tab">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-philosopher text-[22px] font-bold text-[#3e5641]">
                      {t('profile.addressSection.heading')}
                    </h2>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleStartEditProfile}
                        className="text-[13.5px] text-[#3e5641] font-semibold hover:underline"
                      >
                        {t('profile.addressSection.editBtn')}
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-[600px] bg-white p-6 rounded-[16px] border border-gray-200 shadow-xs">
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">{t('profile.addressSection.fullNameLabel')}</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">{t('profile.addressSection.phoneLabel')}</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder={t('profile.addressSection.phonePlaceholder')}
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">{t('profile.addressSection.addressLabel')}</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder={t('profile.addressSection.addressPlaceholder')}
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-[#3e5641] text-[#f7f4d5] text-[13.5px] font-semibold hover:bg-[#203323]"
                        >
                          {t('profile.addressSection.saveBtn')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-[13.5px]"
                        >
                          {t('profile.addressSection.cancelBtn')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-white rounded-[16px] p-6 border border-[#e5dfd5] grid grid-cols-1 sm:grid-cols-3 gap-5 text-[14px] shadow-xs">
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">{t('profile.addressSection.fieldName')}</span>
                        <p className="font-medium text-[#222]">{profile?.fullName || activeUser.displayName || t('profile.addressSection.notUpdated')}</p>
                      </div>
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">{t('profile.addressSection.fieldPhone')}</span>
                        <p className="font-medium text-[#222]">{profile?.phone || t('profile.addressSection.notUpdated')}</p>
                      </div>
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">{t('profile.addressSection.fieldAddress')}</span>
                        <p className="font-medium text-[#222]">{profile?.address || t('profile.addressSection.noDefaultAddress')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="rounded-full bg-[#3e5641] text-[#f7f4d5] px-8 py-3 font-semibold text-[14.5px] hover:bg-[#203323] transition-colors shadow-sm"
                >
                  {t('profile.backHomeBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt when profile is visited while unauthenticated */}
        {step === 'profile' && !activeUser && (
          <div className="max-w-[600px] mx-auto text-center py-16 px-6 bg-[#faf8f3] rounded-[24px] border border-[#e5dfd5] my-8 shadow-sm">
            <h2 className="font-philosopher text-[28px] font-bold text-[#203323] mb-3">
              {t('unauthPrompt.title')}
            </h2>
            <p className="text-[15px] text-[#666666] mb-8 leading-relaxed">
              {t('unauthPrompt.desc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => switchStep('login')}
                className="px-8 py-3 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[14px] hover:bg-[#203323] transition-colors shadow-sm"
              >
                {t('unauthPrompt.loginBtn')}
              </button>
              <button
                type="button"
                onClick={() => switchStep('register')}
                className="px-8 py-3 rounded-full border border-[#3e5641] text-[#3e5641] font-semibold text-[14px] hover:bg-[#3e5641]/10 transition-colors"
              >
                {t('unauthPrompt.registerBtn')}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: REGISTER VIEW (Figma 127:12046)                */}
        {/* ========================================================= */}
        {step === 'register' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              {/* Left Form */}
              <div className="lg:col-span-5">
                <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-6">
                  {t('register.title')}
                </h1>
                <p className="register-intro text-[#666] leading-relaxed mb-1">
                  {t('register.intro')}
                </p>
                <button
                  type="button"
                  onClick={() => switchStep('login')}
                  className="register-login-link text-[#3e5641] border-b border-current mb-6"
                >
                  {t('register.loginLink')}
                </button>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      {t('register.fullNameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('register.fullNamePlaceholder')}
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      {t('login.emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      {t('login.passwordLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('register.passwordPlaceholder')}
                        className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                      >
                        {showPass ? t('login.hidePass') : t('login.showPass')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      {t('register.confirmPasswordLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                      >
                        {showConfirmPass ? t('login.hidePass') : t('login.showPass')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      {t('register.addressLabel')}
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('register.addressPlaceholder')}
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 text-[14px] text-[#222222] pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAll}
                      onChange={(e) => setAgreeAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#3e5641]"
                    />
                    <span>{t('register.agreeAll')}</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60 mt-2"
                  >
                    {loading ? t('register.submitting') : t('register.submit')}
                  </button>
                </form>
              </div>

              {/* Exact consent copy from 127:12099 */}
              <div className="register-policy lg:col-span-7 text-[#666] text-[14px] leading-relaxed">
                <p>
                  {t('register.policyLead')}
                </p>
                <ol className="list-decimal pl-[30px] my-3 space-y-1">
                  {(t('register.policyItems', { returnObjects: true }) as string[]).map((policy, idx) => (
                    <li key={idx}>{policy}</li>
                  ))}
                </ol>
                <p className="mb-2">
                  {t('register.policyCommitment')}
                </p>
                <p>
                  {t('register.policyPrivacyNote')}
                </p>
              </div>
            </div>

            {/* Bottom Wide Banner Image (Figma 127:12046) */}
            <div className="mt-12 rounded-[20px] overflow-hidden h-[240px] sm:h-[320px] shadow-md">
              <img
                src={assetUrl('/assets/optimized/auth-tea-banner.webp')}
                alt={t('register.bannerAlt')}
                loading="lazy"
                decoding="async"
                width={1280}
                height={853}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2-COLUMN SPLIT LAYOUT FOR LOGIN, ACTIVATE, FORGOT FLOWS  */}
        {/* ========================================================= */}
        {step !== 'register' && step !== 'profile' && (
          <div className="auth-layout grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Form Column */}
            <div className="lg:col-span-5">
              {/* SCREEN 1: LOGIN (Figma 127:11104) */}
              {step === 'login' && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    {t('login.title')}
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    {t('login.subtitle')}
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
                    </div>
                  )}
                  {infoMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13.5px]">
                      {infoMsg}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        {t('login.emailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('login.emailPlaceholder')}
                        className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        {t('login.passwordLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('login.passwordPlaceholder')}
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[13px]"
                        >
                          {showPass ? t('login.hidePass') : t('login.showPass')}
                        </button>
                      </div>
                      <div className="text-right mt-1.5">
                        <button
                          type="button"
                          onClick={() => switchStep('forgot-email')}
                          className="text-[12.5px] text-[#555555] hover:text-[#3e5641]"
                        >
                          {t('login.forgotLink')}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-[13.5px] text-[#444444] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#3e5641]"
                      />
                      <span>{t('login.rememberMe')}</span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? t('login.submitting') : t('login.submit')}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[14px] text-[#555555]">
                    {t('login.noAccountPrompt')}{' '}
                    <button
                      type="button"
                      onClick={() => switchStep('register')}
                      className="font-semibold text-[#3e5641] hover:underline"
                    >
                      {t('login.registerLink')}
                    </button>
                  </p>
                </div>
              )}

              {/* SCREEN: FORGOT PASSWORD STEP 1 (Figma 127:10877) */}
              {step === 'forgot-email' && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    {t('forgot.title')}
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    {t('forgot.subtitle')}
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
                    </div>
                  )}

                  {infoMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13.5px]">
                      {infoMsg}
                    </div>
                  )}

                  <form onSubmit={handleSendResetLink} className="space-y-5" noValidate>
                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        {t('login.emailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('login.emailPlaceholder')}
                        className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? t('forgot.submitting') : t('forgot.submit')}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[14px] text-[#555555]">
                    {t('forgot.rememberPrompt')}{' '}
                    <button
                      type="button"
                      onClick={() => switchStep('login')}
                      className="font-semibold text-[#3e5641] hover:underline"
                    >
                      {t('forgot.backToLogin')}
                    </button>
                  </p>
                </div>
              )}

              {/* SCREEN 6: RESET PASSWORD (Figma 127:11753) */}
              {(step === 'forgot-reset' || step === 'forgot-success') && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    {t('reset.title')}
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    {t('reset.subtitle')}
                  </p>

                  {errorMsg && step === 'forgot-reset' && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
                    </div>
                  )}
                  {infoMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13.5px]">
                      {infoMsg}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        {t('reset.newPasswordLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('reset.newPasswordPlaceholder')}
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                        >
                          {showPass ? t('login.hidePass') : t('login.showPass')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        {t('register.confirmPasswordLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('reset.confirmPlaceholder')}
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                        >
                          {showConfirmPass ? t('login.hidePass') : t('login.showPass')}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? t('reset.submitting') : t('reset.submit')}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Image Column */}
            <div className="lg:col-span-7">
              <div className="rounded-[20px] overflow-hidden shadow-lg h-[360px] sm:h-[440px] lg:h-[520px]">
                <img
                  src={assetUrl(
                    isForgotFlow
                      ? '/assets/optimized/auth-split-an.webp'
                      : '/assets/optimized/auth-split-default.webp'
                  )}
                  alt="Mộc Ngôn Hương"
                  loading="lazy"
                  decoding="async"
                  width={1280}
                  height={1280}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PASSWORD RESET SUCCESS OVERLAY (Figma 127:11871) */}
      <MotionDialog open={step === 'forgot-success'} onClose={() => switchStep('login')}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('reset.successAria')}
            className="auth-modal relative bg-[#faf7f2] rounded-[24px] max-w-[460px] w-full p-8 text-center shadow-2xl"
          >
            <div className="flex items-center justify-center mx-auto mb-6">
              <FigmaIcon name="success" />
            </div>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              {t('reset.successTitle')}
            </h2>
            <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
              {t('reset.successDesc')}
            </p>
            <button
              type="button"
              onClick={() => switchStep('login')}
              className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors"
            >
              {t('reset.successCta')}
            </button>
          </div>
        </div>
      </MotionDialog>

      {/* MODAL 3: ORDER DETAIL OVERLAY (CUSTOMER ORDER EXPERIENCE) */}
      <MotionDialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          {selectedOrder && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('orderDetailModal.ariaLabel')}
              className="relative bg-[#faf7f2] rounded-[24px] max-w-[760px] w-full p-6 sm:p-8 my-8 shadow-2xl border border-[#e5dfd5] text-left max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label={t('orderDetailModal.closeAria')}
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header: Reference and Timestamp */}
              <div className="pr-10 pb-4 border-b border-[#e5dfd5]">
                <span className="text-[#8e6746] font-serif text-[12px] tracking-[.15em] uppercase font-bold block mb-1">
                  {t('orderDetailModal.brandOrderKicker')}
                </span>
                <h2 className="font-philosopher font-bold text-[24px] sm:text-[30px] text-[#203323] leading-tight">
                  #{selectedOrder.orderCode}
                </h2>
                <p className="text-[13px] text-[#777777] mt-1">
                  {t('orderDetailModal.orderedAt', { time: formatVNDate(selectedOrder.createdAt) })}
                </p>
              </div>

              {/* Status Banner */}
              <div className="my-5 p-4 rounded-[16px] bg-white border border-[#e5dfd5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[12px] text-[#888888] block mb-1">{t('orderDetailModal.operationalStatus')}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-semibold border ${getOrderStatusBadge(selectedOrder.orderStatus).color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getOrderStatusBadge(selectedOrder.orderStatus).dot}`}></span>
                      {getOrderStatusBadge(selectedOrder.orderStatus).label}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium border ${getPaymentStatusBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod).color}`}>
                      {getPaymentStatusBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod).label}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#666666] mt-2 italic">
                    {getOrderStatusBadge(selectedOrder.orderStatus).desc}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <span className="text-[12px] text-[#888888] block">{t('orderDetailModal.methodLabel')}</span>
                  <span className="text-[13.5px] font-medium text-[#222222]">
                    {selectedOrder.paymentMethod === 'cod' ? t('orderDetailModal.methodCod') : t('orderDetailModal.methodBank')}
                  </span>
                </div>
              </div>

              {/* Product Items Table / List */}
              <div className="space-y-4 mb-6">
                <h3 className="font-philosopher text-[18px] font-bold text-[#3e5641]">
                  {t('orderDetailModal.itemsHeading', { count: selectedOrder.items?.length || 0 })}
                </h3>
                <div className="bg-white rounded-[18px] p-4 sm:p-5 border border-[#e5dfd5] divide-y divide-gray-100 shadow-2xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-4">
                      <img
                        src={getItemImage(item)}
                        style={{ objectPosition: getOrderMedia(item.productId)?.position }}
                        alt={getLocalizedProductNameById(item.productId, item.productName, locale)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] object-cover border border-black/5 shrink-0 bg-[#faf7f2]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-philosopher font-bold text-[17px] sm:text-[18px] text-[#222222]">
                          {getLocalizedProductNameById(item.productId, item.productName, locale)}
                        </h4>
                        <p className="text-[13px] text-[#777777] mt-1">
                          {t('orderDetailModal.verifiedUnitPrice')} <span className="font-medium text-[#222222]">{formatVnd(item.price, locale, 'spaced-vi')}</span> • {t('orderDetailModal.qtyShort')} <span className="font-bold text-[#3e5641]">x{item.quantity}</span>
                          {item.sku && (
                            <span className="font-mono text-[#555555] whitespace-nowrap">
                              {t('profile.orderCard.skuLabel')}
                              {item.sku}
                            </span>
                          )}
                        </p>
                        {item.giftConfiguration && (
                          <div className="mt-2.5 p-3 rounded-[12px] bg-[#f8f5ee] border border-[#e8e2d5] text-[12.5px] text-[#555555] space-y-1">
                            <p className="font-semibold text-[#8e6746]">
                              {t('orderDetailModal.giftHeading', { recipient: item.giftConfiguration.recipient || t('orderDetailModal.defaultGiftRecipient'), emotion: ['AN', 'THUONG', 'CAM', 'NHO'].includes(item.giftConfiguration.emotion) ? getLocalizedEmotionName(item.giftConfiguration.emotion as any, locale) : item.giftConfiguration.emotion })}
                            </p>
                            {item.giftConfiguration.message && (
                              <p className="italic text-[#666666]">
                                "{item.giftConfiguration.message}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-[16px] sm:text-[17px] text-[#3e5641]">
                          {formatVnd((item.price || 0) * (item.quantity || 1), locale, 'spaced-vi')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6">
                <h3 className="font-philosopher text-[18px] font-bold text-[#3e5641] mb-2.5">
                  {t('orderDetailModal.deliveryHeading')}
                </h3>
                <div className="bg-white rounded-[18px] p-5 border border-[#e5dfd5] text-[13.5px] space-y-2 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[#888888]">{t('orderDetailModal.recipientLabel')}</span>
                    <strong className="text-[#222222]">
                      {selectedOrder.customer?.fullName} • {selectedOrder.customer?.phone}
                    </strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[#888888]">{t('orderDetailModal.confirmEmailLabel')}</span>
                    <span className="text-[#333333] font-mono">{selectedOrder.customer?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-gray-100">
                    <span className="text-[#888888]">{t('orderDetailModal.receiveMethodLabel')}</span>
                    <span className="font-medium text-[#222222]">
                      {selectedOrder.customer?.shippingMode === 'pickup'
                        ? t('orderDetailModal.receivePickup')
                        : t('orderDetailModal.receiveDelivery')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-1 border-t border-gray-100">
                    <span className="text-[#888888] shrink-0">{t('orderDetailModal.addressLabel')}</span>
                    <span className="text-right text-[#222222] font-medium">
                      {selectedOrder.customer?.shippingMode === 'pickup'
                        ? selectedOrder.customer?.pickupStore || (locale === 'en' ? '42 Hang Dieu St, Hoan Kiem District, Hanoi' : '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội')
                        : (selectedOrder.customer?.formattedAddress ||
                            (selectedOrder.customer?.communeName
                              ? [
                                  selectedOrder.customer?.address,
                                  selectedOrder.customer?.communeName,
                                  selectedOrder.customer?.provinceName,
                                ]
                                  .filter(Boolean)
                                  .join(', ')
                              : [
                                  selectedOrder.customer?.address,
                                  selectedOrder.customer?.ward,
                                  selectedOrder.customer?.district,
                                  selectedOrder.customer?.city,
                                ]
                                  .filter(Boolean)
                                  .join(', ')))}
                    </span>
                  </div>
                  {selectedOrder.customer?.note && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[#888888] block mb-0.5">{t('orderDetailModal.noteLabel')}</span>
                      <p className="text-[#555555] bg-[#faf7f2] p-2.5 rounded-[10px] text-[13px] italic">
                        {selectedOrder.customer.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Transfer Instructions (If Applicable) */}
              {selectedOrder.paymentMethod === 'bank' &&
                selectedOrder.paymentStatus !== 'paid' &&
                selectedOrder.paymentStatus !== 'completed' &&
                selectedOrder.orderStatus !== 'cancelled' && (
                  <div className="mb-6 p-5 rounded-[18px] bg-[#f8f5ee] border border-[#e5dfd5] text-[13.5px] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-philosopher font-bold text-[18px] text-[#3e5641]">
                        {t('orderDetailModal.vietQrHeading')}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleContinueVietQrPayment(selectedOrder)}
                        className="px-4 py-2 rounded-full bg-[#3e5641] text-[#f7f4d5] text-[12.5px] font-semibold hover:bg-[#203323] transition-colors cursor-pointer"
                      >
                        {t('orderDetailModal.openVietQrPage')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white p-4 rounded-[14px] border border-[#e8e2d5]">
                      {selectedOrder.paymentInstructions?.qrSvgDataUrl && (
                        <div className="sm:col-span-4 flex justify-center">
                          <img
                            src={selectedOrder.paymentInstructions.qrSvgDataUrl}
                            alt={`VietQR ${selectedOrder.orderCode}`}
                            className="w-[150px] h-[150px] object-contain rounded-lg border border-gray-100 p-1"
                          />
                        </div>
                      )}
                      <div
                        className={`${
                          selectedOrder.paymentInstructions?.qrSvgDataUrl
                            ? 'sm:col-span-8'
                            : 'sm:col-span-12'
                        } space-y-1.5 text-[13px]`}
                      >
                        <p>
                          <span className="text-[#888]">{t('orderDetailModal.bankLabel')}</span>{' '}
                          <strong className="text-[#222]">
                            {t('orderDetailModal.bankFullValue')}
                          </strong>
                        </p>
                        <p>
                          <span className="text-[#888]">{t('orderDetailModal.accountOwnerLabel')}</span>{' '}
                          <strong className="text-[#222]">
                            {selectedOrder.paymentInstructions?.accountName || 'NGUYEN THI VAN ANH'}
                          </strong>
                        </p>
                        <p>
                          <span className="text-[#888]">{t('orderDetailModal.accountNoLabel')}</span>{' '}
                          <strong className="font-mono text-[#3e5641] text-[14.5px]">
                            {selectedOrder.paymentInstructions?.accountNo || '8960826751'}
                          </strong>
                        </p>
                        <p>
                          <span className="text-[#888]">{t('orderDetailModal.amountLabel')}</span>{' '}
                          <strong className="text-[#3e5641] text-[14.5px]">
                            {formatVnd(selectedOrder.total, locale, 'spaced-vi')}
                          </strong>
                        </p>
                        <p>
                          <span className="text-[#888]">{t('orderDetailModal.transferContentLabel')}</span>{' '}
                          <strong className="font-mono text-[#8e6746] text-[14.5px]">
                            {selectedOrder.orderCode}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Financial Breakdown */}
              <div className="bg-white rounded-[18px] p-5 border border-[#e5dfd5] text-[14px] space-y-2.5 mb-6 shadow-2xs">
                <div className="flex justify-between text-[#666666]">
                  <span>{t('orderDetailModal.subtotalLabel')}</span>
                  <span className="font-medium text-[#222222]">
                    {formatVnd(selectedOrder.subtotal, locale, 'spaced-vi')}
                  </span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>{t('orderDetailModal.shippingLabel')}</span>
                  <span className="font-medium text-[#3e5641]">
                    {selectedOrder.shippingFee === 0 ? t('orderDetailModal.freeShipping') : formatVnd(selectedOrder.shippingFee, locale, 'spaced-vi')}
                  </span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#666666]">
                    <span>{t('orderDetailModal.discountLabel')}</span>
                    <span className="font-medium text-[#222222]">
                      -{formatVnd(selectedOrder.discount, locale, 'spaced-vi')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[18px] sm:text-[20px] font-bold text-[#222222]">
                  <span className="font-philosopher">{t('orderDetailModal.totalLabel')}</span>
                  <span className="text-[#3e5641]">
                    {formatVnd(selectedOrder.total, locale, 'spaced-vi')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[14.5px] hover:bg-[#203323] transition-colors shadow-xs cursor-pointer"
                >
                  {t('orderDetailModal.closeBtn')}
                </button>
              </div>
            </div>
          )}
        </div>
      </MotionDialog>
    </div>
  );
};

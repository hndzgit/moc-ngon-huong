import { assetUrl } from '../lib/assets';
import { MotionDialog } from '../motion/MotionDialog';
import { useChangeMotion } from '../motion/motion';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { AuthStep, PageRoute, OrderRecord, OrderStatus, PaymentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../data/products';

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
  const activeUser = user || (isFigmaQa ? { email: 'khachhang.demo@mocngonhuong.com', displayName: 'Khách Hàng Trải Nghiệm', emailVerified: true } : null);

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
        setOrdersError('Chưa xác thực được phiên đăng nhập. Vui lòng đăng nhập lại.');
        setOrdersLoading(false);
        return;
      }
      const response = await fetch('/api/me/orders?limit=50', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.status === 401) {
        setOrdersError('Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang hoặc đăng nhập lại.');
        setOrdersLoading(false);
        return;
      }
      if (response.status === 503) {
        setOrdersError('Hệ thống cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau ít phút.');
        setOrdersLoading(false);
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        setUserOrders(data.orders);
      } else {
        setOrdersError(data.error || 'Không thể tải lịch sử đơn hàng.');
      }
    } catch {
      setOrdersError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
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
            setInfoMsg(`Đang đặt lại mật khẩu cho tài khoản ${recoveredEmail}. Vui lòng nhập mật khẩu mới.`);
            setErrorMsg('');
          })
          .catch(() => {
            setErrorMsg('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
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
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg('Hệ thống tài khoản đang được hoàn thiện kết nối. Vui lòng thử lại sau.');
        return;
      }
      const loggedUser = await login(email.trim(), password, rememberMe);
      onLoginSuccess(loggedUser.email || email.trim());
      setStep('profile');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Quá nhiều lần thử không thành công. Vui lòng thử lại sau ít phút.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Định dạng email không hợp lệ.');
      } else {
        setErrorMsg(err.message || 'Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.');
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
      setErrorMsg('Vui lòng điền đầy đủ Họ và tên cùng địa chỉ Email.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!agreeAll) {
      setErrorMsg('Vui lòng đồng ý với các điều khoản bảo mật và xử lý thông tin để tiếp tục.');
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg('Dịch vụ tạo tài khoản đang được bảo trì. Vui lòng thử lại sau.');
        return;
      }
      const newUser = await register(email.trim(), password, fullName.trim(), address.trim());
      onLoginSuccess(newUser.email || email.trim());
      setRegistrationSuccess(true);
      setInfoMsg(
        'Chào mừng bạn đến với Mộc Ngôn Hương. Tài khoản của bạn đã được tạo thành công. Hãy cùng khám phá những hương trà và món quà ý nghĩa!'
      );
      setStep('profile');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng chức năng Quên mật khẩu.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Mật khẩu quá yếu. Vui lòng dùng mật khẩu có độ bảo mật cao hơn.');
      } else {
        setErrorMsg(err.message || 'Không thể tạo tài khoản. Vui lòng thử lại sau.');
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
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setLoading(true);
    try {
      if (!isAuthAvailable) {
        setErrorMsg('Dịch vụ đặt lại mật khẩu chưa khả dụng.');
        return;
      }
      await sendResetEmail(email.trim());
      setInfoMsg(
        'Liên kết đặt lại mật khẩu bảo mật đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến (và thư mục Spam/Rác) và bấm vào liên kết để tạo mật khẩu mới.'
      );
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        // Generic response to avoid email enumeration
        setInfoMsg('Nếu email đã được đăng ký, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.');
      } else {
        setErrorMsg('Không thể gửi liên kết đặt lại mật khẩu. Vui lòng thử lại sau.');
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
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!resetActionCode) {
      setErrorMsg('Không tìm thấy mã xác thực hợp lệ. Vui lòng mở lại liên kết từ email của bạn.');
      return;
    }

    setLoading(true);
    try {
      await confirmReset(resetActionCode, password);
      setStep('forgot-success');
    } catch (err: any) {
      setErrorMsg('Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc đã được sử dụng.');
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
    setInfoMsg('Đã cập nhật thông tin tài khoản thành công.');
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
  const formatVNDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoStr;
    }
  };

  const allCatalog = [...PRODUCTS, ...LOOSE_TEA_PRODUCTS];
  const getItemImage = (item: { productId: string; image?: string }) => {
    if (item.image) return assetUrl(item.image);
    const found = allCatalog.find((p) => p.id === item.productId);
    return assetUrl(found?.image || '/assets/optimized/card-buoi-an-800.webp');
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return {
          label: 'Chờ xác nhận',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          desc: 'Đơn hàng đã được lưu an toàn. Tiệm sẽ liên hệ xác nhận trong vòng 60 phút.',
        };
      case 'confirmed':
        return {
          label: 'Đã xác nhận',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          desc: 'Tiệm đã duyệt đơn và đang chuẩn bị đóng gói trà cẩn thận.',
        };
      case 'preparing':
        return {
          label: 'Đang chuẩn bị',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          desc: 'Đang hoàn tất đóng hộp quà trà và thiệp chúc.',
        };
      case 'ready_for_pickup':
        return {
          label: 'Chờ nhận tại tiệm',
          color: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          desc: 'Gói trà đã sẵn sàng tại tiệm để quý khách ghé nhận.',
        };
      case 'shipping':
        return {
          label: 'Đang giao hàng',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          desc: 'Đơn hàng đang trên đường vận chuyển đến địa chỉ của bạn.',
        };
      case 'completed':
        return {
          label: 'Đã giao hàng',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          desc: 'Đơn hàng đã hoàn tất thành công. Mộc Ngôn Hương chân thành cảm ơn bạn.',
        };
      case 'cancelled':
        return {
          label: 'Đã hủy',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          desc: 'Đơn hàng đã được hủy theo yêu cầu.',
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

  const getPaymentStatusBadge = (status: PaymentStatus, method: 'cod' | 'bank') => {
    if (status === 'completed') {
      return {
        label: 'Đã thanh toán',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (status === 'failed') {
      return {
        label: 'Thanh toán lỗi',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (status === 'refunded') {
      return {
        label: 'Đã hoàn tiền',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
      };
    }
    if (method === 'cod') {
      return {
        label: 'Thanh toán COD khi nhận hàng',
        color: 'bg-[#3e5641]/10 text-[#3e5641] border-[#3e5641]/20',
      };
    }
    return {
      label: 'Chờ chuyển khoản',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    };
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
            <span className="text-[#888888] font-medium mr-1">Luồng tài khoản:</span>
            {[
              { id: 'login' as AuthStep, label: 'Đăng nhập (127:11104)' },
              { id: 'register' as AuthStep, label: 'Đăng ký (127:12046)' },
              { id: 'forgot-email' as AuthStep, label: 'Quên MK (127:10877)' },
              { id: 'forgot-reset' as AuthStep, label: 'Tạo MK mới (127:11753)' },
              { id: 'forgot-success' as AuthStep, label: 'Hoàn tất (127:11871)' },
              { id: 'profile' as AuthStep, label: 'Hồ sơ khách hàng' },
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
                      {profile?.fullName || activeUser.displayName || 'Khách hàng thân thiết'}
                    </h1>
                    <p className="text-[13px] sm:text-[14px] text-[#666666] truncate">{activeUser.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3e5641]/10 text-[#3e5641] border border-[#3e5641]/20 text-[13px] font-medium">
                    <svg className="w-4 h-4 text-[#3e5641]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thành viên thân thiết
                  </span>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2 rounded-full border border-red-300 text-red-700 text-[13.5px] font-medium hover:bg-red-50 transition-colors ml-auto sm:ml-0"
                  >
                    Đăng xuất
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
                      Đăng ký tài khoản thành công!
                    </h3>
                    <p className="text-[14px] leading-relaxed text-[#4a554d]">
                      Chào mừng bạn đến với Mộc Ngôn Hương. Tài khoản của bạn đã được tạo thành công. Hãy cùng khám phá những hương trà và món quà ý nghĩa!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistrationSuccess(false)}
                    className="text-gray-400 hover:text-gray-600 text-[20px] leading-none p-1"
                    aria-label="Đóng thông báo"
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
                    Đơn hàng của tôi
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
                    Thông tin giao nhận
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
                    Làm mới đơn hàng
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
                        { key: 'ALL', label: `Tất cả (${userOrders.length})` },
                        { key: 'pending_confirmation', label: 'Chờ xác nhận' },
                        { key: 'confirmed', label: 'Đã xác nhận' },
                        { key: 'shipping', label: 'Đang giao' },
                        { key: 'completed', label: 'Đã hoàn tất' },
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
                        Thử Lại
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
                        Bạn chưa có đơn hàng nào
                      </h3>
                      <p className="text-[#666666] text-[14.5px] leading-relaxed max-w-[460px] mx-auto mb-8">
                        Hãy khám phá các thức trà ướp hoa tự nhiên hoặc lựa chọn hộp quà tặng tinh tế để trao gửi tâm tình.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('products')}
                        className="px-8 py-3.5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-all shadow-md hover:shadow-lg"
                      >
                        Khám Phá Các Vị Trà
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
                                    alt={item.productName}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] object-cover border border-black/5 shrink-0 bg-[#faf7f2]"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-philosopher font-bold text-[16px] sm:text-[17px] text-[#222222] truncate">
                                      {item.productName}
                                    </h4>
                                    <p className="text-[13px] text-[#777777] mt-0.5">
                                      Số lượng: <span className="font-medium text-[#222222]">{item.quantity}</span> • Đơn giá:{' '}
                                      <span className="font-medium text-[#222222]">{item.price?.toLocaleString('vi-VN')} đ</span>
                                    </p>
                                    {item.giftConfiguration && (
                                      <span className="inline-block mt-1 text-[11px] font-medium text-[#8e6746] bg-[#f8f5ee] px-2 py-0.5 rounded-md">
                                        Kèm thiệp & lời chúc cá nhân
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-semibold text-[15px] sm:text-[16px] text-[#222222]">
                                      {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {additionalItemsCount > 1 && (
                                <p className="text-[12.5px] text-[#888888] pt-1">
                                  + và {additionalItemsCount - 1} sản phẩm khác trong đơn hàng
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Summary & Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                              <div className="text-[13px] text-[#666666]">
                                <span className="text-[#888888]">Giao đến:</span>{' '}
                                <strong className="text-[#333333]">
                                  {order.customer?.shippingMode === 'pickup'
                                    ? 'Nhận tại tiệm (42 Phố Hàng Điếu, Hà Nội)'
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
                                              .join(', ') || 'Địa chỉ đã lưu'))}
                                </strong>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-5">
                                <div className="text-right">
                                  <span className="text-[12px] text-[#888888] block">Tổng thanh toán</span>
                                  <span className="font-bold text-[#3e5641] text-[18px] sm:text-[20px]">
                                    {order.total?.toLocaleString('vi-VN')} đ
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-5 py-2.5 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[13.5px] hover:bg-[#203323] transition-colors shadow-xs"
                                >
                                  Xem chi tiết
                                </button>
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
                        Trang trước
                      </button>
                      <span className="text-[13.5px] font-medium text-[#666]">
                        Trang {orderPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderPage((p) => Math.min(totalPages, p + 1))}
                        disabled={orderPage === totalPages}
                        className="px-4 py-2 rounded-full border border-[#e5dfd5] bg-white text-[13px] font-medium text-[#444] disabled:opacity-40 hover:bg-[#faf7f2] transition-colors"
                      >
                        Trang sau
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
                      Địa chỉ nhận hàng mặc định
                    </h2>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleStartEditProfile}
                        className="text-[13.5px] text-[#3e5641] font-semibold hover:underline"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-[600px] bg-white p-6 rounded-[16px] border border-gray-200 shadow-xs">
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">Họ và tên người nhận</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678"
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#444] mb-1">Địa chỉ giao hàng</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                          className="w-full h-[42px] px-3.5 rounded-[8px] border border-gray-300 text-[14px] focus:outline-none focus:border-[#3e5641]"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-[#3e5641] text-[#f7f4d5] text-[13.5px] font-semibold hover:bg-[#203323]"
                        >
                          Lưu Thay Đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-[13.5px]"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-white rounded-[16px] p-6 border border-[#e5dfd5] grid grid-cols-1 sm:grid-cols-3 gap-5 text-[14px] shadow-xs">
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">Họ và tên</span>
                        <p className="font-medium text-[#222]">{profile?.fullName || activeUser.displayName || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">Số điện thoại</span>
                        <p className="font-medium text-[#222]">{profile?.phone || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <span className="text-[#888] block text-[12px] uppercase tracking-wider mb-1">Địa chỉ nhận hàng</span>
                        <p className="font-medium text-[#222]">{profile?.address || 'Chưa có địa chỉ mặc định'}</p>
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
                  Quay Về Trang Chủ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt when profile is visited while unauthenticated */}
        {step === 'profile' && !activeUser && (
          <div className="max-w-[600px] mx-auto text-center py-16 px-6 bg-[#faf8f3] rounded-[24px] border border-[#e5dfd5] my-8 shadow-sm">
            <h2 className="font-philosopher text-[28px] font-bold text-[#203323] mb-3">Tài Khoản Mộc Ngôn Hương</h2>
            <p className="text-[15px] text-[#666666] mb-8 leading-relaxed">
              Vui lòng đăng nhập hoặc đăng ký tài khoản để xem thông tin cá nhân và quản lý lịch sử đơn hàng của quý khách.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => switchStep('login')}
                className="px-8 py-3 rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[14px] hover:bg-[#203323] transition-colors shadow-sm"
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => switchStep('register')}
                className="px-8 py-3 rounded-full border border-[#3e5641] text-[#3e5641] font-semibold text-[14px] hover:bg-[#3e5641]/10 transition-colors"
              >
                Tạo Tài Khoản
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
                  Tạo tài khoản
                </h1>
                <p className="register-intro text-[#666] leading-relaxed mb-1">
                  Với tạo tài khoản, bạn có thể nhận các dịch vụ dành cho khách hàng thân thiết của chúng tôi, truy cập giỏ hàng của bạn từ bất kỳ thiết bị nào và xem lịch sử đơn hàng của mình.
                </p>
                <button
                  type="button"
                  onClick={() => switchStep('login')}
                  className="register-login-link text-[#3e5641] border-b border-current mb-6"
                >
                  Đăng nhập
                </button>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn"
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email của bạn"
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tạo mật khẩu (tối thiểu 8 ký tự)"
                        className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                      >
                        {showPass ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                      >
                        {showConfirmPass ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Địa chỉ nhận trà
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nhập địa chỉ nhận trà của bạn (tùy chọn)"
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
                    <span>Đồng ý tất cả các điều khoản</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60 mt-2"
                  >
                    {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
                  </button>
                </form>
              </div>

              {/* Exact consent copy from 127:12099 */}
              <div className="register-policy lg:col-span-7 text-[#666] text-[14px] leading-relaxed">
                <p>
                  Bằng việc cung cấp thông tin cá nhân ở trên, tôi đồng ý cho phép Thương Hiệu và các đối tác liên kết được phép xử lý tên, email, số điện thoại và các thông tin khác của tôi cho các mục đích sau:
                </p>
                <ol className="list-decimal pl-[30px] my-3 space-y-1">
                  <li>Giao tiếp và Chăm sóc Khách hàng: Liên hệ để xác nhận đơn hàng, hỗ trợ và cung cấp các dịch vụ liên quan.</li>
                  <li>Tiếp thị Cá nhân hóa: Gửi thông tin về các sản phẩm mới, bộ sưu tập độc quyền, chương trình ưu đãi, sự kiện đặc biệt và các nội dung tiếp thị khác phù hợp với sở thích của tôi.</li>
                  <li>Nghiên cứu &amp; Cải tiến Dịch vụ: Sử dụng dữ liệu tổng hợp để phân tích thị trường và nâng cao trải nghiệm khách hàng.</li>
                </ol>
                <p className="mb-2">
                  Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và chỉ chia sẻ với các đối tác tin cậy để hoàn tất đơn hàng.
                </p>
                <p>
                  Để biết thêm chi tiết về cách chúng tôi bảo vệ dữ liệu của bạn, vui lòng tham khảo Chính sách bảo mật thông tin khách hàng của Mộc Ngôn Hương.
                </p>
              </div>
            </div>

            {/* Bottom Wide Banner Image (Figma 127:12046) */}
            <div className="mt-12 rounded-[20px] overflow-hidden h-[240px] sm:h-[320px] shadow-md">
              <img
                src={assetUrl('/assets/optimized/auth-tea-banner.webp')}
                alt="Không gian trà Mộc Ngôn Hương"
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
                    Đăng Nhập
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    Với tài khoản Mộc Ngôn Hương, bạn có thể lưu trữ giỏ hàng, theo dõi đơn hàng và nhận những đặc quyền dành cho khách hàng thân thiết.
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
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email của bạn"
                        className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[13px]"
                        >
                          {showPass ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                      <div className="text-right mt-1.5">
                        <button
                          type="button"
                          onClick={() => switchStep('forgot-email')}
                          className="text-[12.5px] text-[#555555] hover:text-[#3e5641]"
                        >
                          Quên mật khẩu?
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
                      <span>Ghi nhớ đăng nhập</span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[14px] text-[#555555]">
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => switchStep('register')}
                      className="font-semibold text-[#3e5641] hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              )}

              {/* SCREEN: FORGOT PASSWORD STEP 1 (Figma 127:10877) */}
              {step === 'forgot-email' && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    Quên Mật Khẩu
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    Vui lòng nhập email đã đăng ký. Mộc Ngôn Hương sẽ gửi liên kết bảo mật để bạn thiết lập lại mật khẩu mới.
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
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email của bạn"
                        className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại'}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[14px] text-[#555555]">
                    Nhớ mật khẩu?{' '}
                    <button
                      type="button"
                      onClick={() => switchStep('login')}
                      className="font-semibold text-[#3e5641] hover:underline"
                    >
                      Đăng nhập
                    </button>
                  </p>
                </div>
              )}

              {/* SCREEN 6: RESET PASSWORD (Figma 127:11753) */}
              {(step === 'forgot-reset' || step === 'forgot-success') && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    Tạo Mật Khẩu Mới
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    Mật khẩu mới của bạn phải có tối thiểu 8 ký tự và khác với mật khẩu đã sử dụng trước đó.
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
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                        >
                          {showPass ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]"
                        >
                          {showConfirmPass ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading ? 'Đang cập nhật...' : 'Đặt Lại Mật Khẩu'}
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
            aria-label="Cập nhật mật khẩu thành công"
            className="auth-modal relative bg-[#faf7f2] rounded-[24px] max-w-[460px] w-full p-8 text-center shadow-2xl"
          >
            <div className="flex items-center justify-center mx-auto mb-6">
              <FigmaIcon name="success" />
            </div>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              Thành Công
            </h2>
            <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
              Mật khẩu của bạn đã được cập nhật thành công. Hãy đăng nhập để tiếp tục khám phá hương vị trà Mộc Ngôn Hương nhé.
            </p>
            <button
              type="button"
              onClick={() => switchStep('login')}
              className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors"
            >
              Đăng Nhập Ngay
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
              aria-label="Chi tiết đơn hàng"
              className="relative bg-[#faf7f2] rounded-[24px] max-w-[760px] w-full p-6 sm:p-8 my-8 shadow-2xl border border-[#e5dfd5] text-left max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết đơn hàng"
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header: Reference and Timestamp */}
              <div className="pr-10 pb-4 border-b border-[#e5dfd5]">
                <span className="text-[#8e6746] font-serif text-[12px] tracking-[.15em] uppercase font-bold block mb-1">
                  Mộc Ngôn Hương • Đơn hàng
                </span>
                <h2 className="font-philosopher font-bold text-[24px] sm:text-[30px] text-[#203323] leading-tight">
                  #{selectedOrder.orderCode}
                </h2>
                <p className="text-[13px] text-[#777777] mt-1">
                  Thời gian đặt: {formatVNDate(selectedOrder.createdAt)}
                </p>
              </div>

              {/* Status Banner */}
              <div className="my-5 p-4 rounded-[16px] bg-white border border-[#e5dfd5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[12px] text-[#888888] block mb-1">Trạng thái vận hành</span>
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
                  <span className="text-[12px] text-[#888888] block">Phương thức</span>
                  <span className="text-[13.5px] font-medium text-[#222222]">
                    {selectedOrder.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
              </div>

              {/* Product Items Table / List */}
              <div className="space-y-4 mb-6">
                <h3 className="font-philosopher text-[18px] font-bold text-[#3e5641]">
                  Danh sách sản phẩm ({selectedOrder.items?.length || 0})
                </h3>
                <div className="bg-white rounded-[18px] p-4 sm:p-5 border border-[#e5dfd5] divide-y divide-gray-100 shadow-2xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-4">
                      <img
                        src={getItemImage(item)}
                        alt={item.productName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] object-cover border border-black/5 shrink-0 bg-[#faf7f2]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-philosopher font-bold text-[17px] sm:text-[18px] text-[#222222]">
                          {item.productName}
                        </h4>
                        <p className="text-[13px] text-[#777777] mt-1">
                          Đơn giá xác thực: <span className="font-medium text-[#222222]">{item.price?.toLocaleString('vi-VN')} đ</span> • Số lượng: <span className="font-bold text-[#3e5641]">x{item.quantity}</span>
                        </p>
                        {item.giftConfiguration && (
                          <div className="mt-2.5 p-3 rounded-[12px] bg-[#f8f5ee] border border-[#e8e2d5] text-[12.5px] text-[#555555] space-y-1">
                            <p className="font-semibold text-[#8e6746]">
                              Hộp quà trao tặng: {item.giftConfiguration.recipient || 'Người thương'} ({item.giftConfiguration.emotion})
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
                          {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6">
                <h3 className="font-philosopher text-[18px] font-bold text-[#3e5641] mb-2.5">
                  Thông tin giao nhận
                </h3>
                <div className="bg-white rounded-[18px] p-5 border border-[#e5dfd5] text-[13.5px] space-y-2 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[#888888]">Người nhận:</span>
                    <strong className="text-[#222222]">
                      {selectedOrder.customer?.fullName} • {selectedOrder.customer?.phone}
                    </strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[#888888]">Email xác nhận:</span>
                    <span className="text-[#333333] font-mono">{selectedOrder.customer?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-gray-100">
                    <span className="text-[#888888]">Phương thức nhận:</span>
                    <span className="font-medium text-[#222222]">
                      {selectedOrder.customer?.shippingMode === 'pickup'
                        ? 'Nhận trực tiếp tại tiệm'
                        : 'Giao hàng tận nơi'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-1 border-t border-gray-100">
                    <span className="text-[#888888] shrink-0">Địa chỉ / Điểm hẹn:</span>
                    <span className="text-right text-[#222222] font-medium">
                      {selectedOrder.customer?.shippingMode === 'pickup'
                        ? selectedOrder.customer?.pickupStore || '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội'
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
                      <span className="text-[#888888] block mb-0.5">Lời nhắn / Ghi chú đơn:</span>
                      <p className="text-[#555555] bg-[#faf7f2] p-2.5 rounded-[10px] text-[13px] italic">
                        {selectedOrder.customer.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Transfer Instructions (If Applicable) */}
              {selectedOrder.paymentMethod === 'bank' && selectedOrder.paymentStatus === 'pending' && (
                <div className="mb-6 p-5 rounded-[18px] bg-[#f8f5ee] border border-[#e5dfd5] text-[13.5px] space-y-2">
                  <h4 className="font-philosopher font-bold text-[17px] text-[#3e5641]">
                    Thông tin chuyển khoản ngân hàng
                  </h4>
                  <p className="text-[#666666] text-[13px] leading-[20px]">
                    Đơn hàng của Quý khách đang ở trạng thái chờ thanh toán chuyển khoản. Chuyên viên chăm sóc khách hàng Mộc Ngôn Hương sẽ trực tiếp liên hệ qua điện thoại (<strong>0889 742 556</strong>) để xác nhận đơn và cung cấp số tài khoản ngân hàng chính thức của công ty.
                  </p>
                  <div className="bg-white p-3.5 rounded-[12px] border border-[#e8e2d5] space-y-1.5 text-[13px]">
                    <p><span className="text-[#888]">Số tiền thanh toán:</span> <strong className="text-[#3e5641]">{selectedOrder.total?.toLocaleString('vi-VN')} đ</strong></p>
                    <p><span className="text-[#888]">Cú pháp chuyển khoản:</span> <strong className="font-mono text-[#8e6746]">MNH {selectedOrder.orderCode} {selectedOrder.customer?.phone}</strong></p>
                    <p className="text-[12px] text-[#888] italic pt-1">
                      * Quý khách vui lòng chỉ thực hiện chuyển tiền theo thông tin tài khoản doanh nghiệp được chuyên viên Mộc Ngôn Hương xác nhận chính thức.
                    </p>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="bg-white rounded-[18px] p-5 border border-[#e5dfd5] text-[14px] space-y-2.5 mb-6 shadow-2xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Tạm tính sản phẩm</span>
                  <span className="font-medium text-[#222222]">
                    {selectedOrder.subtotal?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Phí giao hàng</span>
                  <span className="font-medium text-[#3e5641]">
                    {selectedOrder.shippingFee === 0 ? 'Miễn phí' : `${selectedOrder.shippingFee?.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#666666]">
                    <span>Ưu đãi</span>
                    <span className="font-medium text-[#222222]">
                      -{selectedOrder.discount?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[18px] sm:text-[20px] font-bold text-[#222222]">
                  <span className="font-philosopher">Tổng cộng thanh toán</span>
                  <span className="text-[#3e5641]">
                    {selectedOrder.total?.toLocaleString('vi-VN')} đ
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
                  Đóng Chi Tiết
                </button>
              </div>
            </div>
          )}
        </div>
      </MotionDialog>
    </div>
  );
};

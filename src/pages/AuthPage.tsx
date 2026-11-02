import { assetUrl } from '../lib/assets';
import { MotionDialog } from '../motion/MotionDialog';
import { useChangeMotion } from '../motion/motion';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState } from 'react';
import { AuthStep, PageRoute } from '../types';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from '../services/firebase';

const hasLiveFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onNavigate,
}) => {
  const [step, setStep] = useState<AuthStep>('login');
  const stateMotion=useChangeMotion<HTMLDivElement>(step,'h1, form',.25);

  // Shared form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [agreeAll, setAgreeAll] = useState(false);

  // Password visibility toggles
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '']);

  // Feedback state
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const switchStep = (next: AuthStep) => {
    setErrorMsg('');
    setInfoMsg('');
    setStep(next);
  };


  const handleToggleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
  };

  // 1. Login Submit (127:11104)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      if (!hasLiveFirebaseKey || !auth) {
        setErrorMsg('Đăng nhập hiện chưa khả dụng. Vui lòng thử lại sau.');
        return;
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess(email.trim());
      onNavigate('home');
    } catch {
      setErrorMsg('Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Register Step 1 Submit -> Transitions to Account Activation (127:12046 -> 127:12445)
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !email.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Email và Địa chỉ.');
      return;
    }
    switchStep('activate');
  };

  // 3. Account Activation Submit (127:12445)
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 8) {
      setErrorMsg('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      if (!hasLiveFirebaseKey || !auth) {
        setErrorMsg('Đăng ký hiện chưa khả dụng. Vui lòng thử lại sau.');
        return;
      }
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess(email.trim() || 'khachhang@mocngonhuong.vn');
      onNavigate('home');
    } catch {
      setErrorMsg('Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password Step 1: Send OTP (127:10877 -> 127:11621)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    if (!hasLiveFirebaseKey || !auth) {
      setErrorMsg('Khôi phục mật khẩu hiện chưa khả dụng. Vui lòng thử lại sau.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMsg('Nếu email đã được đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
    } catch {
      setErrorMsg('Không thể gửi liên kết đặt lại mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // These Figma states require a real OTP/reset service; they never authenticate locally.
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('Chưa thể xác thực mã. Vui lòng dùng liên kết đặt lại mật khẩu trong email.');
  };
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('Vui lòng mở liên kết đặt lại mật khẩu trong email để tiếp tục.');
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const isForgotFlow =
    step === 'forgot-email' ||
    step === 'forgot-otp' ||
    step === 'forgot-reset' ||
    step === 'forgot-success';

  return (
    <div ref={stateMotion} className={`auth-page auth-${step} bg-white py-10 md:py-16`}>
      <div className="figma-container max-w-[1680px] mx-auto">
        {/* Quick Figma State Switcher for QA Inspection */}
        {import.meta.env.DEV && new URLSearchParams(window.location.search).has('figma-qa') && <div className="qa-state-switcher mb-8 pb-4 border-b border-gray-100 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-[#888888] font-medium mr-1">Luồng tài khoản:</span>
          {[
            { id: 'login' as AuthStep, label: 'Đăng nhập (127:11104)' },
            { id: 'register' as AuthStep, label: 'Đăng ký (127:12046)' },
            { id: 'activate' as AuthStep, label: 'Kích hoạt (127:12445)' },
            { id: 'forgot-email' as AuthStep, label: 'Quên MK (127:10877)' },
            { id: 'forgot-otp' as AuthStep, label: 'Mã OTP (127:11621)' },
            { id: 'forgot-reset' as AuthStep, label: 'Tạo MK mới (127:11753)' },
            { id: 'forgot-success' as AuthStep, label: 'Hoàn tất (127:11871)' },
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
        </div>}

        {/* SCREEN 3: REGISTER VIEW (Figma 127:12046) */}
        {step === 'register' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              {/* Left Form */}
              <div className="lg:col-span-5">
                <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-6">
                  Tạo tài khoản
                </h1>
                <p className="register-intro text-[#666] leading-relaxed mb-1">
                  Với tạo tài khoản, bạn có thể nhận các dịch vụ dành cho thành khách hàng thân thiết của chúng tôi, truy cập giỏ hàng của bạn từ bất kỳ thiết bị nào và xem lịch sử đơn hàng của mình.
                </p>
                <button type="button" onClick={() => switchStep('login')} className="register-login-link text-[#3e5641] border-b border-current mb-6">
                  Đăng nhập
                </button>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegisterStep1} className="space-y-4" noValidate>
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
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nhập địa chỉ nhận trà của bạn"
                      className="w-full h-[46px] px-4 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 text-[14px] text-[#222222] pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAll}
                      onChange={(e) => handleToggleAgreeAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#3e5641]"
                    />
                    <span>Đồng ý tất cả các điều khoản</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm mt-2"
                  >
                    Tạo Mật Khẩu
                  </button>
                </form>

              </div>

              {/* Exact consent copy from 127:12099. The original has one consent checkbox. */}
              <div className="register-policy lg:col-span-7 text-[#666] text-[14px] leading-relaxed">
                <p>Bằng việc cung cấp thông tin cá nhân ở trên, tôi đồng ý cho phép Thương Hiệu và các đối tác liên kết được phép xử lý tên, email, số điện thoại và các thông tin khác của tôi cho các mục đích sau:</p>
                <ol className="list-decimal pl-[30px]">
                  <li>Giao tiếp và Chăm sóc Khách hàng: Liên hệ để xác nhận đơn hàng, hỗ trợ và cung cấp các dịch vụ liên quan.</li>
                  <li>Tiếp thị Cá nhân hóa: Gửi thông tin về các sản phẩm mới, bộ sưu tập độc quyền, chương trình ưu đãi, sự kiện đặc biệt và các nội dung tiếp thị khác phù hợp với sở thích của tôi.</li>
                  <li>Nghiên cứu &amp; Cải tiến Dịch vụ: Sử dụng dữ liệu tổng hợp để phân tích thị trường và nâng cao trải nghiệm khách hàng.</li>
                </ol>
                <p>Chúng tôi có thể chia sẻ thông tin của bạn với các nhà cung cấp dịch vụ và đối tác tin cậy để thực hiện các mục đích trên.</p>
                <p>Tôi hiểu rằng mình có quyền truy cập, chỉnh sửa, yêu cầu xóa bỏ thông tin cá nhân và hủy đăng ký nhận thông tin tiếp thị bất cứ lúc nào bằng cách làm theo hướng dẫn trong email hoặc liên hệ với Bộ phận Dịch vụ Khách hàng của Thương Hiệu.</p>
                <p>Để biết thêm chi tiết về cách chúng tôi bảo vệ dữ liệu của bạn, vui lòng tham khảo Chính sách bảo mật thông tin khách hàng của chúng tôi.</p>
              </div>
            </div>

            {/* Bottom Wide Banner Image (Figma 127:12046) */}
            <div className="mt-12 rounded-[20px] overflow-hidden h-[240px] sm:h-[320px] shadow-md">
              <img
                src={assetUrl("/assets/figma/originals/c1a60.png")}
                alt="Không gian trà Mộc Ngôn Hương"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 2-COLUMN SPLIT LAYOUT FOR LOGIN, ACTIVATE, AND FORGOT PASSWORD FLOWS */}
        {step !== 'register' && (
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
                    Với tạo tài khoản, bạn có thể nhận các dịch vụ dành cho khách hàng thân thiết của chúng tôi, truy cập giỏ hàng của bạn từ bất kỳ thiết bị nào và xem lịch sử đơn hàng của mình.
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
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
                      {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
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

              {/* SCREEN 2: ACCOUNT ACTIVATION (Figma 127:12445) */}
              {step === 'activate' && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    Kích Hoạt Tài Khoản
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    Cảm ơn bạn đã tạo tài khoản. Để kích hoạt, vui lòng nhập mật khẩu bạn muốn vào bên dưới. Mật khẩu của bạn phải có độ dài từ 7 đến 12 ký tự và bao gồm ít nhất một chữ số cùng cả chữ hoa và chữ thường.
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleActivateAccount} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                        Tạo mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                          className="w-full h-[46px] pl-4 pr-10 rounded-[8px] border border-gray-300 text-[14px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
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
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm"
                    >
                      Đăng Nhập
                    </button>
                  </form>
                </div>
              )}

              {/* SCREEN 4 & 5: FORGOT PASSWORD STEP 1 (Figma 127:10877 & background of 127:11621) */}
              {(step === 'forgot-email' || step === 'forgot-otp') && (
                <div>
                  <h1 className="font-philosopher font-bold text-[34px] sm:text-[42px] text-[#222222] mb-2">
                    Quên Mật Khẩu
                  </h1>
                  <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
                    Vui lòng nhập email đã đăng ký tài khoản. Mộc Ngôn Hương sẽ gửi liên kết để bạn đặt lại mật khẩu.
                  </p>

                  {errorMsg && step === 'forgot-email' && (
                    <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13.5px]">
                      {errorMsg}
                    </div>
                  )}

                  {infoMsg && (
                    <div className="mb-4 p-3 rounded-[8px] bg-green-50 border border-green-200 text-green-800 text-[13.5px]">
                      {infoMsg}
                    </div>
                  )}

                  <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
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
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm"
                    >
                      Gửi Mã
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

              {/* SCREEN 6 & 7: RESET PASSWORD (Figma 127:11753 & background of 127:11871) */}
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
                      className="w-full h-[48px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors shadow-sm"
                    >
                      Đặt Lại Mật Khẩu
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Image Column */}
            <div className="lg:col-span-7">
              <div className="rounded-[20px] overflow-hidden shadow-lg h-[360px] sm:h-[440px] lg:h-[520px]">
                <img
                  src={
                    assetUrl(isForgotFlow
                      ? '/assets/figma/originals/496fe.png'
                      : step === 'activate' ? '/assets/figma/originals/e31ba.png' : '/assets/figma/originals/7a0f7.png')
                  }
                  alt="Mộc Ngôn Hương"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: 4-DIGIT OTP VERIFICATION OVERLAY (Figma 127:11621) */}
      <MotionDialog open={step === 'forgot-otp'} onClose={()=>switchStep('forgot-email')}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-label="Xác thực mã OTP" className="auth-modal auth-otp-modal relative bg-[#faf7f2] rounded-[24px] max-w-[460px] w-full p-8 text-center shadow-2xl">
            <button type="button" onClick={() => switchStep('forgot-email')} aria-label="Đóng xác thực mã OTP" className="absolute right-6 top-6"><FigmaIcon name="closeModal" /></button>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              Quên Mật Khẩu
            </h2>
            <p className="text-[14px] leading-[22px] text-[#555555] mb-6">
              Vui lòng nhập mã xác thực gồm 4 chữ số vừa được gửi đến email của bạn.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-[8px] bg-red-50 text-red-700 text-[13px]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="flex items-center justify-center gap-3.5 mb-5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-[58px] h-[58px] rounded-[10px] border border-gray-300 text-center font-bold text-[22px] text-[#222222] focus:outline-none focus:border-[#3e5641]"
                  />
                ))}
              </div>

              <p className="text-[13px] text-[#666666] mb-6">
                Bạn chưa nhận được mã?{' '}
                <button
                  type="button"
                  onClick={() => { setOtp(['', '', '', '']); setErrorMsg('Vui lòng yêu cầu liên kết đặt lại mật khẩu qua email.'); }}
                  className="font-semibold text-[#3e5641] hover:underline"
                >
                  Gửi lại mã
                </button>
              </p>

              <p className="otp-expiry flex items-center justify-center gap-1 text-[#3e5641] text-[16px] mb-10">
                <FigmaIcon name="clock" />
                <span aria-label="Chưa có mã xác thực đang hoạt động">—</span>
              </p>

              <button
                type="submit"
                className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors"
              >
                Xác Nhận
              </button>
            </form>
          </div>
        </div>
      </MotionDialog>

      {/* MODAL 2: PASSWORD RESET SUCCESS OVERLAY (Figma 127:11871) */}
      <MotionDialog open={step === 'forgot-success'} onClose={()=>switchStep('login')}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-label="Xác thực tài khoản" className="auth-modal relative bg-[#faf7f2] rounded-[24px] max-w-[460px] w-full p-8 text-center shadow-2xl">
            <div className="flex items-center justify-center mx-auto mb-6">
              <FigmaIcon name="success" />
            </div>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              Thành Công
            </h2>
            <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
              Mật khẩu của bạn đã được cập nhật thành công. Hãy đăng nhập để tiếp tục mua sắm nhé.
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
    </div>
  );
};

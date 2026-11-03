import { isFigmaPreview } from '../lib/previewMode';
import { MotionDialog } from '../motion/MotionDialog';
import { FigmaIcon } from '../components/FigmaIcon';
import React, { useState } from 'react';
import { PageRoute } from '../types';

interface ContactPageProps {
  onNavigate?: (page: PageRoute) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      return;
    }
    if (!isFigmaPreview) {
      setError('Gửi liên hệ trực tuyến hiện chưa khả dụng. Vui lòng liên hệ cửa hàng qua thông tin bên dưới.');
      return;
    }
    setError('');
    setShowSuccessModal(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setFullName('');
    setPhone('');
    setEmail('');
    setSubject('');
    setMessage('');
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="contact-page bg-white py-14 md:py-20">
      <div className="figma-container max-w-[1394px] mx-auto">
        {/* Centered Header (Figma 127:9562) */}
        <div className="text-center mb-10">
          <p className="text-[13px] md:text-[14px] font-medium uppercase tracking-[0.22em] text-[#555555] mb-2">
            MỘC NGÔN HƯƠNG
          </p>
          <h1 className="font-philosopher font-bold text-[34px] sm:text-[46px] lg:text-[54px] text-[#222222] leading-[1.15] mb-4">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-[15px] md:text-[16px] leading-[26px] text-[#555555] max-w-[600px] mx-auto">
            Mọi thắc mắc về sản phẩm hoặc nhu cầu hợp tác, vui lòng để lại thông tin bên dưới. Đội ngũ Mộc Ngôn Hương sẽ phản hồi trong thời gian sớm nhất.
          </p>

          {/* 2 Inline Contact Info Pills */}
          <div className="contact-info grid grid-cols-1 sm:grid-cols-2 items-center text-left gap-5 mt-6 text-[14.5px] md:text-[15.5px] font-medium text-[#222222]">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#3e5641]/10 text-[#3e5641] flex items-center justify-center text-[13px]">
                <FigmaIcon name="call" />
              </span>
              <div>
                <h3 className="font-philosopher font-bold text-[#3e5641]">HotLine</h3>
                <p className="text-[#666]">
                  <a href="tel:+84889742556" className="hover:text-[#3e5641] transition-colors">
                    0889 742 556
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#3e5641]/10 text-[#3e5641] flex items-center justify-center text-[13px]">
                <FigmaIcon name="sms" />
              </span>
              <div>
                <h3 className="font-philosopher font-bold text-[#3e5641]">Email</h3>
                <p className="text-[#666]">
                  <a href="mailto:mocngonhuong@gmail.com" className="hover:text-[#3e5641] transition-colors">
                    mocngonhuong@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Centered Single-Column Form (Figma 127:9562) */}
        <form
          onSubmit={handleSubmit}
          className="max-w-[1394px] mx-auto space-y-5"
          noValidate
        >
          {error && (
            <div role="alert" className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                className="w-full h-[46px] px-4 rounded-[8px] border border-[#222222]/30 text-[14.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                Số Điện Thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ"
                className="w-full h-[46px] px-4 rounded-[8px] border border-[#222222]/30 text-[14.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
              />
            </div>
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
              className="w-full h-[46px] px-4 rounded-[8px] border border-[#222222]/30 text-[14.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Bạn cần tư vấn về vấn đề gì?"
              className="w-full h-[46px] px-4 rounded-[8px] border border-[#222222]/30 text-[14.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
              Lời nhắn <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Chia sẻ thêm chi tiết yêu cầu của bạn..."
              className="w-full p-4 rounded-[8px] border border-[#222222]/30 text-[14.5px] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:border-[#3e5641] resize-y"
            />
          </div>

          <button
            type="submit"
            className="w-full h-[50px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[16px] hover:bg-[#203323] transition-colors shadow-sm"
          >
            Gửi Yêu Cầu <FigmaIcon name="send" />
          </button>
        </form>
      </div>

      {/* Contact Success Modal (Figma 127:10079) */}
      <MotionDialog open={showSuccessModal} onClose={()=>setShowSuccessModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-label="Thông báo gửi yêu cầu" className="contact-success relative bg-paper-texture bg-[#faf7f2] rounded-[24px] max-w-[460px] w-full p-8 text-center shadow-2xl">
            <button type="button" onClick={() => setShowSuccessModal(false)} aria-label="Đóng thông báo" className="absolute right-6 top-6"><FigmaIcon name="closeModal" /></button>
            <div className="flex items-center justify-center mx-auto mb-6">
              <FigmaIcon name="success" />
            </div>
            <h2 className="font-philosopher font-bold text-[28px] text-[#222222] mb-2">
              Thành Công
            </h2>
            <p className="text-[14.5px] leading-[22px] text-[#555555] mb-6">
              Cảm ơn bạn đã liên hệ. Mộc Ngôn Hương đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.
            </p>
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full h-[46px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[15px] hover:bg-[#203323] transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </MotionDialog>
    </div>
  );
};

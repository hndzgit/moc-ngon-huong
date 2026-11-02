import { assetUrl } from '../lib/assets';
import { FigmaIcon } from './FigmaIcon';
import { BrandLogo } from './BrandLogo';
import React, { useState, useRef, useEffect } from 'react';
import { PageRoute } from '../types';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  suggestedProductId?: string;
  suggestedProductLabel?: string;
}

interface ChatBoxProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

const QUICK_REPLIES = [
  'Tư vấn chọn quà theo người nhận',
  'Hộp quà Tâm Ý có gì đặc biệt?',
  'Đặt quà doanh nghiệp số lượng lớn',
];

export const ChatBox: React.FC<ChatBoxProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Chào bạn, Mộc Ngôn Hương rất vui được đón tiếp. Hôm nay bạn đang tìm một thức trà để thưởng thức hay một món quà gửi trao tâm ý ạ?',
      time: 'Vừa xong',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const generateBotReply = (query: string): Omit<ChatMessage, 'id' | 'time'> => {
    const q = query.toLowerCase();
    if (q.includes('tâm ý') || q.includes('combo') || q.includes('399')) {
      return {
        sender: 'bot',
        text: 'Hộp Quà Trà Đa Hương — "TÂM Ý" (399,000đ) hội tụ đủ 4 vị trà An - Thương - Cảm - Nhớ (4 hộp 50g), kèm kẹo lạc trà xanh, túi vải đay, muỗng gỗ và bộ 4 thẻ thông điệp kèm mã QR nghe chuyện trà.',
        suggestedProductId: 'hop-qua-tam-y',
        suggestedProductLabel: 'Xem Hộp Quà "TÂM Ý" (399,000đ)',
      };
    }
    if (q.includes('người nhận') || q.includes('bố mẹ') || q.includes('ông bà') || q.includes('an') || q.includes('bưởi')) {
      return {
        sender: 'bot',
        text: 'Nếu biếu Ông Bà, Cha Mẹ dịp lễ Tết hay mừng thọ, bạn có thể chọn Trà Hương Bưởi – AN (289,000đ) gửi lời chúc bình an, hoặc Hộp Quà "TÂM Ý" (399,000đ) trọn vẹn 4 tầng hương cảm xúc.',
        suggestedProductId: 'buoi-an',
        suggestedProductLabel: 'Xem Trà Hương Bưởi – AN (289,000đ)',
      };
    }
    if (q.includes('doanh nghiệp') || q.includes('số lượng lớn') || q.includes('đối tác')) {
      return {
        sender: 'bot',
        text: 'Mộc Ngôn Hương hỗ trợ thiết kế thiệp riêng, in logo doanh nghiệp và chiết khấu ưu đãi cho đơn hàng quà tặng số lượng lớn. Bạn có thể liên hệ Hotline/Zalo 0889 742 556 (Ms. My) hoặc để lại thông tin tại trang Liên hệ nhé!',
      };
    }
    if (q.includes('nhài') || q.includes('thương')) {
      return {
        sender: 'bot',
        text: 'Trà Nhài – THƯƠNG (289,000đ) mang hương hoa nhài đêm nồng nàn, dịu ngọt — món quà tuyệt vời dành tặng nửa kia, mẹ hoặc chị gái.',
        suggestedProductId: 'nhai-thuong',
        suggestedProductLabel: 'Xem Trà Nhài – THƯƠNG (289,000đ)',
      };
    }
    if (q.includes('sói') || q.includes('cảm') || q.includes('thầy cô')) {
      return {
        sender: 'bot',
        text: 'Trà Hoa Sói – CẢM (289,000đ) là dòng trà cổ truyền quý hiếm với hương trầm ấm, rất hợp để tri ân thầy cô, cấp trên hoặc đối tác.',
        suggestedProductId: 'soi-cam',
        suggestedProductLabel: 'Xem Trà Hoa Sói – CẢM (289,000đ)',
      };
    }
    if (q.includes('cốm') || q.includes('nhớ')) {
      return {
        sender: 'bot',
        text: 'Trà Cốm – NHỚ (289,000đ) thơm bùi hương cốm non mùa thu Hà Nội, rất ý nghĩa để gửi tặng bạn bè phương xa hoặc người tri kỷ.',
        suggestedProductId: 'com-nho',
        suggestedProductLabel: 'Xem Trà Cốm – NHỚ (289,000đ)',
      };
    }
    return {
      sender: 'bot',
      text: 'Cảm ơn bạn đã nhắn cho Mộc Ngôn Hương! Chúng mình có 4 thức trà cảm xúc: Bưởi (An), Nhài (Thương), Hoa Sói (Cảm), Cốm (Nhớ) giá 289,000đ/set (75,000đ/hộp lẻ) và Hộp Quà Đa Hương "TÂM Ý" (399,000đ). Bạn cần tư vấn chi tiết vị nào ạ?',
      suggestedProductId: 'hop-qua-tam-y',
      suggestedProductLabel: 'Khám phá Hộp Quà "TÂM Ý"',
    };
  };

  const handleSend = (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: 'Vừa xong',
    };

    const replyData = generateBotReply(trimmed);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      time: 'Vừa xong',
      ...replyData,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
  };

  return (
    <div className="chat-widget fixed bottom-6 right-6 z-40">
      {/* Expanded Chat Window (Figma 80:5091 - 410x555) */}
      {isOpen && (
        <div className="chat-panel bg-paper-texture mb-3 w-[340px] sm:w-[410px] h-[520px] sm:h-[555px] bg-[#faf7f2] rounded-[20px] shadow-[0_20px_60px_rgba(32,51,35,0.28)] border border-[#3e5641]/20 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header (#3e5641) */}
          <div className="bg-[#3e5641] text-[#f7f4d5] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <BrandLogo className="chat-brand-logo" />
              <div>
                <h3 className="font-philosopher font-bold text-[18px] leading-tight text-[#f7f4d5]">
                  Mộc Ngôn Hương
                </h3>
                <p className="text-[12px] text-[#f7f4d5]/90 flex items-center gap-1.5 mt-0.5">
                  Chúng tôi sẵn sàng hỗ trợ bạn!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
            <button type="button" aria-label="Gợi ý tư vấn thêm" aria-expanded={showMore} onClick={() => setShowMore(v => !v)}><FigmaIcon name="more" className="rotate-90" /></button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#f7f4d5] transition-colors text-[18px]"
              aria-label="Đóng khung chat"
            >
              <FigmaIcon name="closeChat" />
            </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <img
                    src={assetUrl("/assets/figma/logo-header.png")}
                    alt="Bot"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-[#3e5641]/20"
                  />
                )}
                <div
                  className={`max-w-[82%] rounded-[14px] px-4 py-3 text-[13.5px] leading-[20px] ${
                    msg.sender === 'user'
                      ? 'bg-[#3e5641] text-[#f7f4d5] rounded-br-xs'
                      : 'bg-white text-[#222222] border border-black/5 shadow-xs rounded-tl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.suggestedProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('detail', msg.suggestedProductId);
                        setIsOpen(false);
                      }}
                      className="mt-2.5 w-full py-1.5 px-3 rounded-[8px] bg-[#f5f2ed] hover:bg-[#3e5641] text-[#3e5641] hover:text-[#f7f4d5] font-semibold text-[12px] transition-colors text-center block"
                    >
                      {msg.suggestedProductLabel} →
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Reply Suggestions (Figma 80:5091) */}
            <div className="chat-quick-replies pl-9 space-y-2 pt-1">
              {showMore && <p className="text-[11px] text-[#777777]">Gợi ý câu hỏi nhanh:</p>}
              <div className="flex flex-col items-start gap-2">
                {(showMore ? QUICK_REPLIES : ['Quy trình ướp trà bên mình có gì đặc biệt không?', 'Bạn muốn gửi gắm điều gì đến người ấy?']).map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => handleSend(qr)}
                    className="text-left text-[12.5px] px-3.5 py-2 rounded-full bg-white border border-[#3e5641]/30 text-[#3e5641] hover:bg-[#3e5641] hover:text-[#f7f4d5] transition-colors shadow-2xs"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập lời nhắn của bạn..."
              className="flex-1 h-10 px-4 rounded-full bg-[#f5f2ed] text-[13.5px] text-[#222222] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3e5641]"
            />
            <span className="chat-input-art flex items-center gap-6" aria-hidden="true"><FigmaIcon name="emotion" /><FigmaIcon name="attachment" /></span>
            <button
              type="submit"
              className={`${input.trim() ? 'w-10 h-10 rounded-full bg-[#3e5641] text-[#f7f4d5] flex items-center justify-center hover:bg-[#203323] transition-colors shrink-0' : 'sr-only'}`}
              aria-label="Gửi tin nhắn"
            >
              <FigmaIcon name="send" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Launcher Button (Figma 80:5091 - 68x68 circle) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-[60px] h-[60px] md:w-[88px] md:h-[88px] rounded-full bg-[#3e5641] text-[#f7f4d5] shadow-[0_8px_28px_rgba(32,51,35,0.35)] hover:bg-[#203323] hover:scale-105 transition-all flex items-center justify-center ml-auto"
        aria-label="Mở tư vấn trực tuyến Mộc Ngôn Hương"
      >
        <img src={assetUrl("/assets/figma/icon-chat.svg")} alt="Chat" className="w-[40px] h-[40px]" />
      </button>
    </div>
  );
};

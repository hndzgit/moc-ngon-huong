// src/components/ChatBox.tsx
// Mộc Ngôn Hương — Smart Local Tea Assistant (Zero AI API Cost)

import React, { useState, useRef, useEffect } from 'react';
import { assetUrl } from '../lib/assets';
import { usePresenceMotion, scrollBehavior } from '../motion/motion';
import { FigmaIcon } from './FigmaIcon';
import { BrandLogo } from './BrandLogo';
import { PageRoute, Product, GiftDraft, TeaEmotion } from '../types';
import {
  processUserMessage,
  loadContextFromStorage,
  clearContextStorage,
  createInitialContext,
  ConversationContext,
  AssistantReply,
  CardSuggestionItem,
} from '../assistant';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  products?: Product[];
  cardSuggestions?: CardSuggestionItem[];
  quickReplies?: string[];
}

interface ChatBoxProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onOpenGiftJourney?: (draftPatch: Partial<GiftDraft>) => void;
  cartSummary?: { totalQuantity: number; subtotal: number };
}

const INITIAL_QUICK_REPLIES = [
  'Tư vấn quà tặng mẹ',
  'Trà hương nhẹ nhàng',
  'Combo Tâm Ý 4 vị',
  'Chính sách giao hàng',
];

function renderFormattedText(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={idx} className="font-semibold text-[#203323]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  onNavigate,
  onAddToCart,
  onOpenGiftJourney,
  cartSummary,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panel = usePresenceMotion<HTMLDivElement>(isOpen, 'chat');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  // Load persisted session context from browser storage
  const [context, setContext] = useState<ConversationContext>(() => loadContextFromStorage());

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Dạ chào bạn! Mình là trợ lý tư vấn trà Mộc Ngôn Hương. Hôm nay bạn đang tìm thức trà thưởng thức cho riêng mình hay muốn chọn món quà trao gửi người thương ạ?',
      time: 'Vừa xong',
      quickReplies: INITIAL_QUICK_REPLIES,
    },
  ]);

  const streamRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      const stream = streamRef.current;
      stream?.scrollTo({ top: stream.scrollHeight, behavior: scrollBehavior() });
    }
  }, [messages, isTyping, isOpen, panel.present]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]:not(#chat-panel)')) {
        setIsOpen(false);
        launcherRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Reset / Clear Conversation
  const handleResetConversation = () => {
    clearContextStorage();
    const freshContext = createInitialContext();
    setContext(freshContext);
    setMessages([
      {
        id: `bot-${++sequence.current}`,
        sender: 'bot',
        text: 'Dạ, mình đã làm mới phiên trò chuyện rồi ạ! Bạn muốn mình tư vấn chọn vị trà hay giải đáp thắc mắc nào khác không?',
        time: 'Vừa xong',
        quickReplies: INITIAL_QUICK_REPLIES,
      },
    ]);
  };

  const handleSend = (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${++sequence.current}`,
      sender: 'user',
      text: trimmed,
      time: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Subtle 350ms micro-delay for natural conversational typing feel
    setTimeout(() => {
      const { reply, nextContext } = processUserMessage(trimmed, context, cartSummary);
      setContext(nextContext);

      const botMsg: ChatMessage = {
        id: `bot-${++sequence.current}`,
        sender: 'bot',
        text: reply.text,
        time: 'Vừa xong',
        products: reply.products,
        cardSuggestions: reply.cardSuggestions,
        quickReplies: reply.suggestedQuickReplies,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  // Copy card message text
  const handleCopyCard = (card: CardSuggestionItem) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(card.text);
      setCopiedCardId(card.id);
      setTimeout(() => setCopiedCardId(null), 2000);
    }
  };

  // Use card message in Gift Journey
  const handleTransferToGiftJourney = (card: CardSuggestionItem) => {
    if (onOpenGiftJourney) {
      onOpenGiftJourney({
        recipient: card.recipient,
        message: card.text,
        cardStyle: 'botanical',
      });
      setIsOpen(false);
    } else {
      onNavigate('gift-journey');
      setIsOpen(false);
    }
  };

  return (
    <div className="chat-widget fixed bottom-6 right-6 z-40">
      {/* Expanded Chat Window (Figma 80:5091 — 410x555) */}
      {panel.present && (
        <div
          ref={panel.ref}
          id="chat-panel"
          role="region"
          aria-label="Tư vấn Mộc Ngôn Hương"
          data-motion-phase={panel.phase}
          inert={!isOpen}
          className="chat-panel bg-paper-texture mb-3 w-[340px] sm:w-[410px] h-[520px] sm:h-[580px] bg-[#FAF8F3] rounded-[20px] shadow-[0_20px_60px_rgba(32,51,35,0.28)] border border-[#3E5641]/20 flex flex-col overflow-hidden"
        >
          {/* Header (#3E5641) */}
          <div className="bg-[#3E5641] text-[#FAF8F3] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <BrandLogo className="chat-brand-logo" />
              <div>
                <h3 className="font-philosopher font-bold text-[18px] leading-tight text-[#FAF8F3]">
                  Mộc Ngôn Hương
                </h3>
                <p className="text-[11.5px] text-[#FAF8F3]/85 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#85E396] inline-block animate-pulse" />
                  Trợ lý tư vấn trà trực tuyến
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetConversation}
                title="Làm mới trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#FAF8F3] transition-colors text-[13px]"
              >
                <span className="text-[16px]">↺</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  launcherRef.current?.focus({ preventScroll: true });
                }}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#FAF8F3] transition-colors text-[18px]"
                aria-label="Đóng khung chat"
              >
                <FigmaIcon name="closeChat" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={streamRef}
            role="log"
            aria-live="polite"
            className="flex-1 p-4 overflow-y-auto space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <img
                    src={assetUrl('/assets/figma/logo-header.png')}
                    alt="Bot"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-[#3E5641]/20"
                  />
                )}

                <div
                  className={`max-w-[85%] rounded-[14px] px-4 py-3 text-[13.5px] leading-[21px] ${
                    msg.sender === 'user'
                      ? 'bg-[#3E5641] text-[#FAF8F3] rounded-br-xs'
                      : 'bg-white text-[#222222] border border-black/5 shadow-xs rounded-tl-xs'
                  }`}
                >
                  {/* Message Text with simple paragraphs */}
                  <div className="whitespace-pre-line">
                    {msg.sender === 'bot' ? renderFormattedText(msg.text) : msg.text}
                  </div>

                  {/* Product Recommendation Cards (Phase 6 & 10) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {msg.products.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#FAF8F3] border border-[#3E5641]/15 rounded-[12px] p-2.5 flex flex-col gap-2 shadow-2xs"
                        >
                          <div className="flex gap-2.5 items-center">
                            <img
                              src={assetUrl(p.image)}
                              alt={p.name}
                              className="w-14 h-14 rounded-[8px] object-cover shrink-0 border border-black/5"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[13px] text-[#222222] truncate">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-[#3E5641] font-medium">
                                {p.emotionLabel}
                              </p>
                              <p className="text-[12.5px] font-bold text-[#8E6746]">
                                {p.price.toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1 border-t border-[#3E5641]/10">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigate('detail', p.id);
                                setIsOpen(false);
                              }}
                              className="flex-1 py-1.5 px-2 rounded-[6px] bg-white border border-[#3E5641]/20 hover:bg-[#3E5641] hover:text-white text-[#3E5641] font-medium text-[11px] transition-colors text-center"
                            >
                              Xem chi tiết
                            </button>

                            {onAddToCart && (
                              <button
                                type="button"
                                onClick={() => onAddToCart(p, 1)}
                                className="flex-1 py-1.5 px-2 rounded-[6px] bg-[#3E5641] hover:bg-[#203323] text-white font-medium text-[11px] transition-colors text-center shadow-xs"
                              >
                                + Thêm giỏ
                              </button>
                            )}

                            {onOpenGiftJourney && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenGiftJourney({
                                    productId: p.id,
                                    emotion: (p.emotion === 'COMBO' ? 'AN' : p.emotion) as TeaEmotion,
                                  });
                                  setIsOpen(false);
                                }}
                                className="py-1.5 px-2 rounded-[6px] bg-[#C89F5D]/20 hover:bg-[#C89F5D] text-[#8E6746] hover:text-white font-medium text-[11px] transition-colors text-center"
                                title="Tùy biến quà tặng"
                              >
                                Chọn làm quà
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Greeting Card Suggestions (Phase 7) */}
                  {msg.cardSuggestions && msg.cardSuggestions.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      <p className="text-[11px] font-semibold text-[#8E6746] uppercase tracking-wider">
                        Gợi ý thông điệp thiệp quà:
                      </p>
                      {msg.cardSuggestions.map((card) => (
                        <div
                          key={card.id}
                          className="bg-[#FAF8F3] border border-[#C89F5D]/30 rounded-[10px] p-2.5 text-[12px] space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#3E5641] text-[11.5px]">
                              {card.styleLabel}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {card.charCount}/280 ký tự
                            </span>
                          </div>
                          <p className="text-[#333333] italic leading-[17px]">
                            &ldquo;{card.text}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-[#C89F5D]/20">
                            <button
                              type="button"
                              onClick={() => handleCopyCard(card)}
                              className="text-[11px] text-[#3E5641] hover:underline font-medium"
                            >
                              {copiedCardId === card.id ? '✓ Đã sao chép' : 'Sao chép'}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleTransferToGiftJourney(card)}
                              className="text-[11px] text-[#8E6746] hover:underline font-semibold"
                            >
                              Dùng cho thiệp quà →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Quick Reply Chips inside message context */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => handleSend(qr)}
                          className="text-left text-[11.5px] px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#3E5641]/25 text-[#3E5641] hover:bg-[#3E5641] hover:text-white transition-colors"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Natural Typing Indicator (Phase 10) */}
            {isTyping && (
              <div className="chat-message flex items-start gap-2.5 justify-start">
                <img
                  src={assetUrl('/assets/figma/logo-header.png')}
                  alt="Bot"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-[#3E5641]/20"
                />
                <div className="bg-white rounded-[14px] px-4 py-3 border border-black/5 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E5641] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E5641] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E5641] animate-bounce" />
                </div>
              </div>
            )}
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
              placeholder="Nhập câu hỏi của bạn (vd: tư vấn quà tặng mẹ)..."
              className="flex-1 h-10 px-4 rounded-full bg-[#FAF8F3] text-[13px] text-[#222222] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#3E5641]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                input.trim()
                  ? 'bg-[#3E5641] text-[#FAF8F3] hover:bg-[#203323]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Gửi tin nhắn"
            >
              <FigmaIcon name="send" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Launcher Button (Figma 80:5091 — 60px/88px) */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] rounded-full bg-[#3E5641] text-[#FAF8F3] shadow-[0_8px_28px_rgba(32,51,35,0.35)] hover:bg-[#203323] hover:scale-105 active:scale-95 transition-all flex items-center justify-center ml-auto relative"
        aria-label="Mở trợ lý tư vấn trà trực tuyến"
        aria-expanded={isOpen}
        aria-controls="chat-panel"
      >
        <img
          src={assetUrl('/assets/figma/icon-chat.svg')}
          alt="Trợ lý trà"
          className="w-[36px] h-[36px]"
        />
        <span className="sr-only">Trợ lý Mộc Ngôn Hương</span>
      </button>
    </div>
  );
};

// src/assistant/responseEngine.ts
// Mộc Ngôn Hương — Natural Grounded Response Composition Engine

import {
  AssistantIntent,
  ConversationContext,
  AssistantReply,
  CardSuggestionItem,
} from './types';
import { CATALOG_FACTS, STORE_POLICIES } from './catalogKnowledge';
import { CATALOG_FACTS_EN, STORE_POLICIES_EN, EN_RECIPIENT_DISPLAY_NAMES } from './englishNlp';
import { PRODUCTS } from '../data/products';
import { formatVnd, type SupportedLocale } from '../lib/locale';
import { recommendProducts } from './recommendationEngine';
import { generateCardSuggestions } from './greetingCardEngine';

/**
 * Compose natural, grounded response in the active UI locale for given intent and state context.
 */
export function composeResponse(
  intent: AssistantIntent,
  context: ConversationContext,
  cartSummary?: { totalQuantity: number; subtotal: number },
  locale: SupportedLocale = 'vi'
): AssistantReply {
  const isEn = locale === 'en';
  const catalogFacts = isEn ? CATALOG_FACTS_EN : CATALOG_FACTS;

  switch (intent) {
    case 'GREETING': {
      const greetings = isEn
        ? [
            'Hello! I am the Mộc Ngôn Hương tea concierge. Are you looking for a floral tea to enjoy yourself, or selecting a meaningful gift for someone special?',
            'Welcome to Mộc Ngôn Hương! Which La Bằng flower-scented tea would you like to explore, or who are we curating a gift box for today?',
          ]
        : [
            'Dạ chào bạn! Mình là trợ lý trà Mộc Ngôn Hương. Bạn đang tìm hương trà cho riêng mình hay muốn chọn món quà trao gửi người thương?',
            'Chào bạn, Mộc Ngôn Hương rất vui được đón tiếp bạn! Hôm nay bạn muốn tìm hiểu thức trà La Bằng nào hay cần mình tư vấn set quà ý nghĩa?',
          ];
      const text = greetings[context.turnCount % greetings.length];
      return {
        text,
        suggestedQuickReplies: isEn
          ? [
              'Tea gift for Mom',
              'Light gentle floral tea',
              'Tam Y 4-flavor gift box',
              'Shipping policy',
            ]
          : [
              'Tư vấn quà tặng mẹ',
              'Trà hương nhẹ nhàng',
              'Combo Tâm Ý 4 vị',
              'Chính sách giao hàng',
            ],
      };
    }

    case 'RECOMMEND_PRODUCT':
    case 'BUDGET_FILTER': {
      const rec = recommendProducts(context, locale);
      let text = rec.reason;

      if (isEn) {
        if (!context.flavorPreference && (context.recipient === 'mother' || context.recipient === 'parents')) {
          text += '\n\nDo they prefer a light, airy floral note or a richer, deeper herbal infusion?';
        } else if (!context.recipient) {
          text += '\n\nWho is this gift intended for and for what occasion, so I can tailor a personal card note too?';
        } else {
          text += '\n\nWould you like me to draft a personalized gift card wish to pair with this box?';
        }
      } else {
        if (!context.flavorPreference && (context.recipient === 'mother' || context.recipient === 'parents')) {
          text += '\n\nBác thường thích gu trà thanh nhẹ dịu mát hay vị đậm đà sâu lắng ạ?';
        } else if (!context.recipient) {
          text += '\n\nBạn dự định gửi tặng món quà này cho ai và vào dịp nào để mình gợi ý thêm lời chúc ý nghĩa nhé?';
        } else {
          text += '\n\nBạn có muốn mình hỗ trợ gợi ý lời chúc viết thiệp đi kèm luôn không?';
        }
      }

      return {
        text,
        products: rec.products,
        productRecommendationReason: rec.reason,
        suggestedQuickReplies: isEn
          ? [
              'Write a gift card note',
              'More affordable option?',
              'How to brew this tea',
              'Shipping & payment',
            ]
          : [
              'Viết thiệp giúp tôi',
              'Có loại rẻ hơn không?',
              'Cách pha trà ngon',
              'Xem giỏ hàng',
            ],
      };
    }

    case 'CHEAPER_ALTERNATIVE': {
      const rec = recommendProducts(context, locale);
      return {
        text: rec.reason,
        products: rec.products,
        suggestedQuickReplies: isEn
          ? [
              'Write a gift card note',
              'How to brew this tea',
              'Shipping policy',
            ]
          : [
              'Viết thiệp giúp tôi',
              'Cách pha trà này',
              'Chính sách giao hàng',
            ],
      };
    }

    case 'PRICE_INQUIRY': {
      const targetId = context.selectedProductId || (context.lastRecommendedProductIds && context.lastRecommendedProductIds[0]) || 'buoi-an';
      const fact = catalogFacts[targetId] || catalogFacts['buoi-an'];
      const product = PRODUCTS.find((p) => p.id === targetId) || PRODUCTS[0];

      if (isEn) {
        let text = `Our **${fact.name}** is listed at **${formatVnd(product.price, 'en')}**.\n`;
        text += `Includes: ${fact.packaging}.\n`;
        text += `Every online order currently includes complimentary nationwide shipping plus gift presentation and keepsake calligraphy cards.`;

        return {
          text,
          products: [product],
          suggestedQuickReplies: [
            'More affordable option?',
            'Write a gift card note',
            'Shipping policy',
          ],
        };
      }

      let text = `Dạ, **${product.name}** có giá niêm yết chính thức là **${product.price.toLocaleString('vi-VN')}đ** ạ.\n`;
      text += `Quy cách: ${fact.packaging}.\n`;
      text += `Hiện Mộc Ngôn Hương đang miễn phí vận chuyển toàn quốc và tặng kèm hộp quà, thiệp lời chúc cho mỗi đơn hàng ạ.`;

      return {
        text,
        products: [product],
        suggestedQuickReplies: [
          'Có loại rẻ hơn không?',
          'Viết thiệp tặng kèm',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'PRODUCT_INQUIRY': {
      const targetId = context.selectedProductId || 'buoi-an';
      const fact = catalogFacts[targetId] || catalogFacts['buoi-an'];
      const product = PRODUCTS.find((p) => p.id === targetId) || PRODUCTS[0];

      if (isEn) {
        let text = `Here are the details for **${fact.name}** (${formatVnd(product.price, 'en')}):\n\n`;
        text += `🌿 **Tasting profile:** ${fact.tasteNotes}\n`;
        text += `🌸 **Ingredients:** ${fact.ingredients.join(', ')}.\n`;
        text += `📦 **Gift box includes:** ${fact.packaging}.\n\n`;
        text += `*“${fact.storyQuote}”*`;

        return {
          text,
          products: [product],
          suggestedQuickReplies: [
            'How to brew this tea',
            'Write a gift card note',
            'More affordable option?',
          ],
        };
      }

      let text = `Dạ, **${product.name}** (${product.price.toLocaleString('vi-VN')}đ):\n\n`;
      text += `🌿 **Hương vị:** ${fact.tasteNotes}\n`;
      text += `🌸 **Thành phần:** ${fact.ingredients.join(', ')}.\n`;
      text += `📦 **Bộ quà gồm:** ${fact.packaging}.\n\n`;
      text += `*“${fact.storyQuote}”*`;

      return {
        text,
        products: [product],
        suggestedQuickReplies: [
          'Cách pha trà này',
          'Viết thiệp giúp tôi',
          'Có loại rẻ hơn không?',
        ],
      };
    }

    case 'GIFT_CARD_WRITING': {
      const cardRes = generateCardSuggestions(
        {
          recipientCategory: context.recipient,
          recipientRaw: context.recipientRaw,
          occasionCategory: context.occasion,
          occasionRaw: context.occasionRaw,
        },
        locale
      );

      if (isEn) {
        const recipientLabel =
          context.recipientRaw ||
          (context.recipient ? EN_RECIPIENT_DISPLAY_NAMES[context.recipient] : 'your loved one');
        const text = `I prepared 3 card-message styles tailored for **${recipientLabel}** (each within 280 characters). Choose one or customize it further in our Gift Studio:\n`;
        return {
          text,
          cardSuggestions: cardRes.suggestions,
          suggestedQuickReplies: [
            'Suggest a tea to pair',
            'Shipping policy',
            'Price of Tam Y Gift Box',
          ],
          action: {
            type: 'OPEN_GIFT_JOURNEY',
            payload: {
              emotion: cardRes.recommendedEmotion,
              intention: cardRes.intentionId,
            },
          },
        };
      }

      const recipientLabel = context.recipientRaw || (context.recipient ? context.recipient : 'người thương');
      let text = `Mình đã chuẩn bị sẵn 3 phong cách lời chúc dành tặng **${recipientLabel}** (dưới 280 ký tự), bạn có thể chọn hoặc chỉnh sửa theo ý mình nhé:\n`;

      return {
        text,
        cardSuggestions: cardRes.suggestions,
        suggestedQuickReplies: [
          'Đổi kiểu lời chúc',
          'Chọn thêm trà tặng',
          'Chuyển vào Xưởng Quà',
        ],
        action: {
          type: 'OPEN_GIFT_JOURNEY',
          payload: {
            emotion: cardRes.recommendedEmotion,
            intention: cardRes.intentionId,
          },
        },
      };
    }

    case 'BREWING_GUIDE': {
      const targetId = context.selectedProductId || 'buoi-an';
      const fact = catalogFacts[targetId] || catalogFacts['buoi-an'];

      if (isEn) {
        let text = `🍵 **Artisan brewing guide for ${fact.shortName}:**\n\n`;
        text += `1. **Tea portion:** ${fact.brewing.amount}.\n`;
        text += `2. **Water temperature:** ${fact.brewing.temp} (avoid 100°C boiling water so delicate floral aromas remain clear).\n`;
        text += `3. **Steeping time:** ${fact.brewing.time} for the first infusion.\n\n`;
        text += `💡 *Tip:* Decant the steeped liquor completely between infusions. Quality buds yield 3–4 flavorful steeps with a lasting sweet finish.`;
        return {
          text,
          suggestedQuickReplies: [
            'How much is it?',
            'Gift recommendations',
            'Shipping policy',
          ],
        };
      }

      let text = `🍵 **Hướng dẫn pha ${fact.shortName} chuẩn nghệ nhân La Bằng:**\n\n`;
      text += `1. **Lượng trà:** ${fact.brewing.amount}.\n`;
      text += `2. **Nhiệt độ nước:** ${fact.brewing.temp} (tránh dùng nước sôi 100°C trực tiếp để không làm nồng hương hoa).\n`;
      text += `3. **Thời gian hãm:** ${fact.brewing.time} cho nước đầu tiên.\n\n`;
      text += `💡 *Mẹo nhỏ:* Rót kiệt nước trà ra tống trước khi thưởng thức. Trà hãm được 3 – 4 tuần nước mà vẫn giữ được hậu ngọt sâu lắng.`;

      return {
        text,
        suggestedQuickReplies: [
          'Giá bao nhiêu?',
          'Tư vấn quà tặng',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'DISCOUNT_INQUIRY': {
      if (isEn) {
        let text = `Mộc Ngôn Hương currently follows transparent **official listed VND pricing** (**289,000 VND** per 100g single-flavor gift box; **399,000 VND** per "Tâm Ý" 4-flavor gift box) with **complimentary nationwide shipping** and personalized message cards included.\n\n`;
        text += `For corporate events or bulk gift orders, please visit our **Corporate Gifts** page or contact Hotline/Zalo **0889 742 556** (email: mocngonhuong@gmail.com) for a tailored quotation.`;
        return {
          text,
          suggestedQuickReplies: [
            'Tam Y 4-flavor gift box',
            'Corporate gifting policy',
            'Shipping policy',
          ],
        };
      }

      let text = `Hiện tại Mộc Ngôn Hương áp dụng **giá niêm yết thống nhất** (75.000đ/túi lẻ, 289.000đ/hộp quà 4 vị, 399.000đ/Hộp Quà Tâm Ý) cùng **miễn phí giao hàng toàn quốc** và tặng kèm thiệp lời chúc cho mọi đơn đặt trực tuyến ạ.\n\n`;
      text += `Nếu bạn đặt số lượng lớn cho doanh nghiệp hoặc sự kiện, vui lòng tham khảo trang **Quà Doanh Nghiệp** hoặc liên hệ Hotline/Zalo **0889 742 556** (email: mocngonhuong@gmail.com) để được tư vấn báo giá riêng nhé.`;

      return {
        text,
        suggestedQuickReplies: [
          'Tư vấn combo Tâm Ý',
          'Xem Quà Doanh Nghiệp',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'SHIPPING_POLICY': {
      if (isEn) {
        let text = `🚚 **Mộc Ngôn Hương Shipping Policy:**\n\n`;
        text += `• **Shipping fee:** ${STORE_POLICIES_EN.shipping.fee}\n`;
        text += `• **Delivery window:** ${STORE_POLICIES_EN.shipping.estimatedDays}\n`;
        text += `• **Parcel inspection:** ${STORE_POLICIES_EN.shipping.inspection}\n`;
        text += `• **Protective packing:** Reinforced gift cartons with protective cushioning so boxes arrive crisp and intact.`;
        return {
          text,
          suggestedQuickReplies: [
            'Payment & VietQR guide',
            'Return & exchange policy',
            'Recommend a tea gift',
          ],
        };
      }

      let text = `🚚 **Chính sách giao hàng Mộc Ngôn Hương:**\n\n`;
      text += `• **Phí vận chuyển:** ${STORE_POLICIES.shipping.fee}\n`;
      text += `• **Thời gian giao:** ${STORE_POLICIES.shipping.estimatedDays}\n`;
      text += `• **Đồng kiểm:** ${STORE_POLICIES.shipping.inspection}\n`;
      text += `• **Đóng gói:** Hộp carton chịu lực bọc xốp chống sốc, kèm túi vải đay mộc mạc đảm bảo nguyên vẹn khi tới tay bạn.`;

      return {
        text,
        suggestedQuickReplies: [
          'Hình thức thanh toán',
          'Chính sách đổi trả',
          'Tư vấn chọn trà',
        ],
      };
    }

    case 'PAYMENT_POLICY': {
      if (isEn) {
        let text = `💳 **Payment Methods (VND):**\n\n`;
        text += `1. **Cash on Delivery (COD):** Inspect your parcel upon arrival before paying the courier.\n`;
        text += `2. **Manual VietQR Bank Transfer (BIDV • NAPAS 247):** After checkout, scan the generated QR code with exact \`MNHXXXXXX\` transfer reference and click "I have transferred" — our team verifies transactions manually against our bank statement before confirming payment.\n`;
        text += `All orders receive confirmation updates by email and phone.`;
        return {
          text,
          suggestedQuickReplies: [
            'Shipping policy',
            'Return & exchange policy',
            'Price of Tam Y Gift Box',
          ],
        };
      }

      let text = `💳 **Phương thức thanh toán:**\n\n`;
      text += `1. **COD (Thanh toán khi nhận hàng):** Kiểm tra hộp quà trước khi thanh toán cho shipper.\n`;
      text += `2. **Chuyển khoản ngân hàng (VietQR):** Quét mã QR tiện lợi, tự động kiểm tra biên lai.\n`;
      text += `Tất cả các đơn hàng đều được xác nhận qua email và số điện thoại chi tiết.`;

      return {
        text,
        suggestedQuickReplies: [
          'Chính sách giao hàng',
          'Chính sách đổi trả',
          'Xem giỏ hàng',
        ],
      };
    }

    case 'RETURN_POLICY': {
      if (isEn) {
        let text = `🔄 **Returns & Replacement Policy:**\n\n`;
        text += `• **Window:** ${STORE_POLICIES_EN.returnPolicy.time}\n`;
        text += `• **Eligibility:** ${STORE_POLICIES_EN.returnPolicy.conditions}\n`;
        text += `• **Direct support hotline:** **${STORE_POLICIES_EN.contact.hotline}**.`;
        return {
          text,
          suggestedQuickReplies: [
            'Store contact & address',
            'Shipping policy',
            'Recommend a tea gift',
          ],
        };
      }

      let text = `🔄 **Chính sách đổi trả & bảo hành:**\n\n`;
      text += `• Hỗ trợ đổi trả trong vòng **${STORE_POLICIES.returnPolicy.time}**\n`;
      text += `• Điều kiện: ${STORE_POLICIES.returnPolicy.conditions}\n`;
      text += `• Hotline hỗ trợ trực tiếp: **${STORE_POLICIES.contact.hotline}**.`;

      return {
        text,
        suggestedQuickReplies: [
          'Liên hệ cửa hàng',
          'Chính sách giao hàng',
          'Tư vấn sản phẩm',
        ],
      };
    }

    case 'CORPORATE_GIFTING': {
      if (isEn) {
        let text = `🏢 **Corporate & Event Gifting:**\n\n`;
        text += `• Tiered volume quotations tailored to corporate, client, and event quantities.\n`;
        text += `• Custom printed company greeting cards and logo co-branding options on wooden accessories or sleeves.\n`;
        text += `• Full VAT invoicing and nationwide multi-address dispatch support.\n`;
        text += `📞 Contact us: **${STORE_POLICIES_EN.corporateGifting.contactMethod}**`;
        return {
          text,
          suggestedQuickReplies: [
            'Tam Y 4-flavor gift box',
            'Store contact & address',
            'Shipping policy',
          ],
        };
      }

      let text = `🏢 **Chính sách quà tặng Doanh nghiệp & Sự kiện:**\n\n`;
      text += `• Chiết khấu ưu đãi hấp dẫn theo số lượng cho tổ chức, đoàn thể.\n`;
      text += `• Hỗ trợ in thiệp chúc mừng, thông điệp tri ân, khắc logo mộc trên hộp quà hoặc muỗng gỗ.\n`;
      text += `• Cung cấp hóa đơn VAT đầy đủ.\n`;
      text += `📞 Xin vui lòng liên hệ: **${STORE_POLICIES.corporateGifting.contactMethod}**.`;

      return {
        text,
        suggestedQuickReplies: [
          'Xem combo Tâm Ý',
          'Liên hệ hotline',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'ORIGIN_STORY': {
      if (isEn) {
        let text = `🌿 **About Mộc Ngôn Hương:**\n\n`;
        text += `Rooted in the heirloom La Bằng tea region along the Tam Đảo foothills (Thái Nguyên), our hand-picked green tea buds are scented over repeated cycles with fresh seasonal blossoms—early-spring pomelo, night jasmine, wild highland chloranthus, and autumn young green rice.\n\n`;
        text += `Each box conveys four calm moods of affection: **An (Peace) — Thương (Love) — Cảm (Gratitude) — Nhớ (Nostalgia)**.`;
        return {
          text,
          suggestedQuickReplies: [
            'Tam Y 4-flavor gift box',
            'Pomelo Blossom Tea – AN',
            'Jasmine Blossom Tea – THƯƠNG',
          ],
        };
      }

      let text = `🌿 **Về Trà Hoa Mộc Ngôn Hương:**\n\n`;
      text += `Mộc Ngôn Hương bắt nguồn từ vùng chè cổ truyền La Bằng dưới chân dãy Tam Đảo. Búp trà móc câu được thu hái thủ công, ướp cùng các loài hoa tươi bản địa (hoa bưởi đầu xuân, hoa nhài đêm, hoa sói cổ, hương cốm non) qua nhiều tuần lửa đượm.\n\n`;
      text += `Mỗi hộp quà không chỉ là một thức uống thanh sạch, mà còn là một câu chuyện gửi gắm 4 cung bậc cảm xúc: **An — Thương — Cảm — Nhớ**.`;

      return {
        text,
        suggestedQuickReplies: [
          'Xem combo Tâm Ý',
          'Trà Hương Hoa Bưởi - AN',
          'Trà Hương Hoa Nhài - THƯƠNG',
        ],
      };
    }

    case 'STORE_CONTACT': {
      if (isEn) {
        let text = `🏡 **Mộc Ngôn Hương Contact Details:**\n\n`;
        text += `• **Locations:** ${STORE_POLICIES_EN.contact.address}\n`;
        text += `• **Hotline / Zalo:** ${STORE_POLICIES_EN.contact.hotline}\n`;
        text += `• **Email:** ${STORE_POLICIES_EN.contact.email}\n`;
        text += `• **Official website:** https://mocngonhuong.com`;
        return {
          text,
          suggestedQuickReplies: [
            'Recommend a tea gift',
            'Shipping policy',
            'Corporate gifting',
          ],
        };
      }

      let text = `🏡 **Thông tin liên hệ Mộc Ngôn Hương:**\n\n`;
      text += `• **Địa chỉ tiệm trà:** ${STORE_POLICIES.contact.address}\n`;
      text += `• **Hotline / Zalo:** ${STORE_POLICIES.contact.hotline}\n`;
      text += `• **Email:** ${STORE_POLICIES.contact.email}\n`;
      text += `• **Website chính thức:** https://mocngonhuong.com`;

      return {
        text,
        suggestedQuickReplies: [
          'Tư vấn quà tặng',
          'Chính sách giao hàng',
          'Quà Doanh Nghiệp',
        ],
      };
    }

    case 'CLEAR_CONTEXT': {
      if (isEn) {
        return {
          text: 'Conversation reset! How can I help you choose the right tea or gift box today?',
          suggestedQuickReplies: [
            'Tea gift for Mom',
            'Tam Y 4-flavor gift box',
            'Tea pricing guide',
          ],
        };
      }
      return {
        text: 'Dạ, mình đã làm mới phiên trò chuyện rồi ạ! Bạn muốn mình hỗ trợ tư vấn chọn trà hay giải đáp thắc mắc nào khác không?',
        suggestedQuickReplies: [
          'Tư vấn quà tặng mẹ',
          'Combo Tâm Ý 4 vị',
          'Xem giá các loại trà',
        ],
      };
    }

    case 'FALLBACK_CLARIFY':
    default: {
      if (isEn) {
        return {
          text: 'I did not quite catch that. Could you share who the tea is for, whether you prefer a light or rich aroma, or your preferred budget in VND so I can suggest the best match?',
          suggestedQuickReplies: [
            'Gift for Mom or Dad',
            'Corporate partner gift',
            'Price of tea boxes',
            'Store contact & address',
          ],
        };
      }
      return {
        text: 'Xin lỗi bạn, mình chưa hiểu rõ ý này lắm. Bạn có thể cho mình biết thêm thông tin (như người nhận, gu trà thanh hay đậm, hoặc mức ngân sách dự kiến) để mình tư vấn chính xác nhất nhé?',
        suggestedQuickReplies: [
          'Trà tặng người thân',
          'Trà biếu đối tác',
          'Xem bảng giá trà',
          'Liên hệ cửa hàng',
        ],
      };
    }
  }
}

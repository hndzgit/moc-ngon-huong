// src/assistant/responseEngine.ts
// Mộc Ngôn Hương — Natural Grounded Response Composition Engine

import {
  AssistantIntent,
  ConversationContext,
  AssistantReply,
  CardSuggestionItem,
} from './types';
import { CATALOG_FACTS, STORE_POLICIES } from './catalogKnowledge';
import { PRODUCTS } from '../data/products';
import { recommendProducts } from './recommendationEngine';
import { generateCardSuggestions } from './greetingCardEngine';

/**
 * Compose natural, grounded Vietnamese response for given intent and state context.
 */
export function composeResponse(
  intent: AssistantIntent,
  context: ConversationContext,
  cartSummary?: { totalQuantity: number; subtotal: number }
): AssistantReply {
  switch (intent) {
    case 'GREETING': {
      const greetings = [
        'Dạ chào bạn! Mình là trợ lý trà Mộc Ngôn Hương. Bạn đang tìm hương trà cho riêng mình hay muốn chọn món quà trao gửi người thương?',
        'Chào bạn, Mộc Ngôn Hương rất vui được đón tiếp bạn! Hôm nay bạn muốn tìm hiểu thức trà La Bằng nào hay cần mình tư vấn set quà ý nghĩa?',
      ];
      const text = greetings[context.turnCount % greetings.length];
      return {
        text,
        suggestedQuickReplies: [
          'Tư vấn quà tặng mẹ',
          'Trà hương nhẹ nhàng',
          'Combo Tâm Ý 4 vị',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'RECOMMEND_PRODUCT':
    case 'BUDGET_FILTER': {
      const rec = recommendProducts(context);
      let text = rec.reason;

      // Add context-aware follow-up question
      if (!context.flavorPreference && (context.recipient === 'mother' || context.recipient === 'parents')) {
        text += '\n\nBác thường thích gu trà thanh nhẹ dịu mát hay vị đậm đà sâu lắng ạ?';
      } else if (!context.recipient) {
        text += '\n\nBạn dự định gửi tặng món quà này cho ai và vào dịp nào để mình gợi ý thêm lời chúc ý nghĩa nhé?';
      } else {
        text += '\n\nBạn có muốn mình hỗ trợ gợi ý lời chúc viết thiệp đi kèm luôn không?';
      }

      return {
        text,
        products: rec.products,
        productRecommendationReason: rec.reason,
        suggestedQuickReplies: [
          'Viết thiệp giúp tôi',
          'Có loại rẻ hơn không?',
          'Cách pha trà ngon',
          'Xem giỏ hàng',
        ],
      };
    }

    case 'CHEAPER_ALTERNATIVE': {
      const rec = recommendProducts(context);
      return {
        text: rec.reason,
        products: rec.products,
        suggestedQuickReplies: [
          'Viết thiệp giúp tôi',
          'Cách pha trà này',
          'Chính sách giao hàng',
        ],
      };
    }

    case 'PRICE_INQUIRY': {
      const targetId = context.selectedProductId || (context.lastRecommendedProductIds && context.lastRecommendedProductIds[0]) || 'buoi-an';
      const fact = CATALOG_FACTS[targetId];
      const product = PRODUCTS.find((p) => p.id === targetId) || PRODUCTS[0];

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
      const fact = CATALOG_FACTS[targetId];
      const product = PRODUCTS.find((p) => p.id === targetId) || PRODUCTS[0];

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
      const cardRes = generateCardSuggestions({
        recipientCategory: context.recipient,
        recipientRaw: context.recipientRaw,
        occasionCategory: context.occasion,
        occasionRaw: context.occasionRaw,
      });

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
      const fact = CATALOG_FACTS[targetId];

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

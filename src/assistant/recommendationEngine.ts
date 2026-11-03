// src/assistant/recommendationEngine.ts
// Mộc Ngôn Hương — Catalog-Grounded Intelligent Product Recommendation Engine

import { Product } from '../types';
import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../data/products';
import {
  ConversationContext,
  RecipientCategory,
  OccasionCategory,
  FlavorProfileCategory,
} from './types';
import { CATALOG_FACTS } from './catalogKnowledge';

export interface RecommendationResult {
  products: Product[];
  reason: string;
  isCheaperAlternative?: boolean;
  budgetNotice?: string;
}

/**
 * Score each product according to current context (recipient, occasion, flavor, budget).
 */
export function recommendProducts(context: ConversationContext): RecommendationResult {
  const { recipient, occasion, flavorPreference, budgetMax, budgetMin, selectedProductId } = context;

  // Case 1: Cheaper alternative request
  if (context.lastIntent === 'CHEAPER_ALTERNATIVE') {
    return handleCheaperAlternative(context);
  }

  // Filter out products strictly exceeding budgetMax
  let candidates = PRODUCTS.slice();

  if (budgetMax !== undefined) {
    const withinBudget = candidates.filter((p) => p.price <= budgetMax);
    if (withinBudget.length > 0) {
      candidates = withinBudget;
    } else {
      // If even 289k is too high, recommend loose tea if budget is around 75k
      if (budgetMax >= 75000 && budgetMax < 289000) {
        const topProduct = PRODUCTS[0]; // fallback representation
        return {
          products: [topProduct],
          reason: `Với ngân sách dưới ${budgetMax.toLocaleString('vi-VN')}đ, bạn có thể tham khảo dòng **Trà rời Mộc Ngôn Hương (75.000đ / hộp 50g)**, vừa vặn ngân sách mà vẫn giữ trọn hương vị trà hoa La Bằng tự nhiên.`,
          budgetNotice: `Sản phẩm hộp quà chuẩn có giá từ 289.000đ; dòng trà rời 75.000đ là lựa chọn kinh tế nhất.`,
        };
      }
      return {
        products: [PRODUCTS[0]],
        reason: `Hiện tại các hộp quà tặng của Mộc Ngôn Hương có mức giá từ **289.000đ** (hộp đơn 100g) đến **399.000đ** (combo 4 vị Tâm Ý). Mức ngân sách ${budgetMax.toLocaleString('vi-VN')}đ thấp hơn giá hộp quà niêm yết, nhưng bạn có thể chọn dòng trà rời thủ công từ 75.000đ.`,
        budgetNotice: 'Vượt ngân sách tìm kiếm của bạn.',
      };
    }
  }

  if (budgetMin !== undefined) {
    const aboveMin = candidates.filter((p) => p.price >= budgetMin);
    if (aboveMin.length > 0) {
      candidates = aboveMin;
    }
  }

  // Calculate scores for candidates
  const scored = candidates.map((product) => {
    let score = 10;
    const fact = CATALOG_FACTS[product.id];

    // 1. Recipient Match
    if (recipient) {
      if (recipient === 'mother' || recipient === 'father' || recipient === 'parents' || recipient === 'grandparents') {
        if (product.id === 'buoi-an') score += 30; // Bình an & biết ơn
        if (product.id === 'nhai-thuong') score += 25; // Dịu ngọt & yêu thương
        if (product.id === 'hop-qua-tam-y') score += 28; // Chỉn chu cả 4 vị
      } else if (recipient === 'teacher') {
        if (product.id === 'soi-cam') score += 35; // Tri ân thầy cô
        if (product.id === 'buoi-an') score += 25;
        if (product.id === 'hop-qua-tam-y') score += 30;
      } else if (recipient === 'business') {
        if (product.id === 'hop-qua-tam-y') score += 35; // Sang trọng, cao cấp
        if (product.id === 'soi-cam') score += 30; // Đậm đà, truyền thống
        if (product.id === 'buoi-an') score += 20;
      } else if (recipient === 'partner') {
        if (product.id === 'nhai-thuong') score += 35; // Yêu thương, ngọt ngào
        if (product.id === 'buoi-an') score += 25;
        if (product.id === 'com-nho') score += 20;
      } else if (recipient === 'friend') {
        if (product.id === 'com-nho') score += 35; // Nhớ về kỷ niệm
        if (product.id === 'nhai-thuong') score += 25;
        if (product.id === 'buoi-an') score += 20;
      } else if (recipient === 'self') {
        if (product.id === 'buoi-an') score += 30;
        if (product.id === 'com-nho') score += 25;
      }
    }

    // 2. Occasion Match
    if (occasion) {
      if (occasion === 'teachers_day') {
        if (product.id === 'soi-cam') score += 35;
        if (product.id === 'hop-qua-tam-y') score += 30;
      } else if (occasion === 'tet') {
        if (product.id === 'hop-qua-tam-y') score += 35;
        if (product.id === 'buoi-an') score += 30;
        if (product.id === 'soi-cam') score += 25;
      } else if (occasion === 'women_day') {
        if (product.id === 'nhai-thuong') score += 35;
        if (product.id === 'buoi-an') score += 25;
      } else if (occasion === 'vu_lan') {
        if (product.id === 'buoi-an') score += 35;
        if (product.id === 'nhai-thuong') score += 25;
      } else if (occasion === 'gratitude') {
        if (product.id === 'soi-cam') score += 35;
        if (product.id === 'hop-qua-tam-y') score += 30;
      }
    }

    // 3. Flavor Preference Match
    if (flavorPreference) {
      if (flavorPreference === 'gentle') {
        if (product.id === 'buoi-an') score += 40;
        if (product.id === 'com-nho') score += 25;
      } else if (flavorPreference === 'sweet') {
        if (product.id === 'nhai-thuong') score += 40;
      } else if (flavorPreference === 'warm') {
        if (product.id === 'soi-cam') score += 40;
      } else if (flavorPreference === 'nutty') {
        if (product.id === 'com-nho') score += 40;
      } else if (flavorPreference === 'rich') {
        if (product.id === 'soi-cam') score += 35;
        if (product.id === 'hop-qua-tam-y') score += 30;
      } else if (flavorPreference === 'floral') {
        if (product.id === 'nhai-thuong' || product.id === 'buoi-an') score += 35;
      }
    }

    // Slight bonus for signature combo if budget permits
    if (product.id === 'hop-qua-tam-y' && (!budgetMax || budgetMax >= 399000)) {
      score += 5;
    }

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topMatches = scored.slice(0, 2).map((s) => s.product);
  const primaryProduct = topMatches[0];

  const reason = composeRecommendationReason(primaryProduct, context);

  return {
    products: topMatches,
    reason,
  };
}

/**
 * Handle "Có loại rẻ hơn không?"
 */
function handleCheaperAlternative(context: ConversationContext): RecommendationResult {
  const currentId = context.selectedProductId || (context.lastRecommendedProductIds && context.lastRecommendedProductIds[0]);

  if (currentId === 'hop-qua-tam-y') {
    // Current is combo 399k -> suggest single boxes 289k
    const singleBoxes = PRODUCTS.filter((p) => p.id !== 'hop-qua-tam-y');
    let target = singleBoxes[0];
    if (context.flavorPreference === 'sweet') target = singleBoxes.find((p) => p.id === 'nhai-thuong') || target;
    if (context.flavorPreference === 'warm') target = singleBoxes.find((p) => p.id === 'soi-cam') || target;
    if (context.flavorPreference === 'nutty') target = singleBoxes.find((p) => p.id === 'com-nho') || target;

    return {
      products: [target],
      reason: `Nếu muốn tiết kiệm hơn so với Hộp Quà Tâm Ý (399.000đ), bạn có thể chọn các **hộp trà đơn 100g (289.000đ)** như **${target.name}**. Hộp vẫn có đầy đủ kẹo lạc, muỗng gỗ và thẻ thư pháp chỉn chu.`,
      isCheaperAlternative: true,
    };
  }

  // Current is single box 289k -> suggest loose tea 75k
  const sampleLoose = PRODUCTS.find((p) => p.id === 'buoi-an') || PRODUCTS[0];
  return {
    products: [sampleLoose],
    reason: `Để có lựa chọn tiết kiệm nhất, Mộc Ngôn Hương có dòng **Trà rời 50g giá 75.000đ/hộp**, phù hợp tự thưởng hoặc mua kèm để thử nhiều vị trà La Bằng truyền thống.`,
    isCheaperAlternative: true,
  };
}

/**
 * Compose grounded Vietnamese reason for recommendation
 */
function composeRecommendationReason(product: Product, context: ConversationContext): string {
  const fact = CATALOG_FACTS[product.id];
  const { recipient, flavorPreference, budgetMax } = context;

  let reason = '';

  if (product.id === 'buoi-an') {
    if (recipient === 'mother' || recipient === 'parents' || recipient === 'grandparents') {
      reason = `Gợi ý **${product.name} (289.000đ)** vì hương hoa bưởi La Bằng the mát, thanh sạch, vị chát dịu hậu ngọt sâu rất hợp khẩu vị người lớn tuổi, mang lời chúc bình an và sức khỏe.`;
    } else if (flavorPreference === 'gentle') {
      reason = `**${product.name} (289.000đ)** là lựa chọn lý tưởng cho người thích trà hương nhẹ, thanh tao, không quá nồng gắt.`;
    } else {
      reason = `**${product.name} (289.000đ)** mang thông điệp "Bình an & Biết ơn", ướp từ hoa bưởi tươi La Bằng thanh tao, rất được khách hàng ưa chuộng.`;
    }
  } else if (product.id === 'nhai-thuong') {
    if (recipient === 'partner') {
      reason = `Gợi ý **${product.name} (289.000đ)** — ướp từ hoa nhài quế nở đêm thơm ngát, vị trà mềm mại êm dịu, gửi gắm lời yêu thương ngọt ngào tới người thương.`;
    } else if (flavorPreference === 'sweet') {
      reason = `**${product.name} (289.000đ)** chuẩn vị ngọt dịu, hậu ngọt lưu luyến nơi cuống họng mà bạn đang tìm kiếm.`;
    } else {
      reason = `**${product.name} (289.000đ)** mang thông điệp "Yêu thương & Dịu ngọt", hương nhài quế tự nhiên nồng nàn mà thanh thoát.`;
    }
  } else if (product.id === 'soi-cam') {
    if (recipient === 'teacher' || recipient === 'business') {
      reason = `Gợi ý **${product.name} (289.000đ)** — thức trà hoa sói cổ truyền quý hiếm với hương thảo mộc trầm ấm, vị đậm đà sâu lắng, biểu trưng cho sự tri ân kính trọng.`;
    } else {
      reason = `**${product.name} (289.000đ)** mang thông điệp "Cảm — Tri ân & Hoài niệm", đậm vị truyền thống, bền bỉ qua nhiều tuần nước.`;
    }
  } else if (product.id === 'com-nho') {
    if (recipient === 'friend') {
      reason = `Gợi ý **${product.name} (289.000đ)** — hương cốm non mộc mạc thơm bùi, gợi nhắc miền ký ức trong trẻo và tình bạn gắn bó.`;
    } else {
      reason = `**${product.name} (289.000đ)** mang thông điệp "Nhớ — Ký ức & Dịu êm", vị trà thanh bùi như thu Hà Nội.`;
    }
  } else if (product.id === 'hop-qua-tam-y') {
    reason = `**${product.name} (399.000đ)** là set quà cao cấp trọn vẹn nhất, gồm cả 4 thức trà (Bưởi, Nhài, Sói, Cốm), kẹo lạc, túi vải đay và muỗng gỗ mộc, không cần đắn đo chọn vị.`;
  } else {
    reason = `Sản phẩm ${product.name} với giá niêm yết ${product.price.toLocaleString('vi-VN')}đ chuẩn theo catalog.`;
  }

  if (budgetMax) {
    reason += ` (Phù hợp với ngân sách dưới ${budgetMax.toLocaleString('vi-VN')}đ).`;
  }

  return reason;
}

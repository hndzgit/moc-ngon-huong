// src/assistant/discountEngine.ts
// Mộc Ngôn Hương — Quantity Discount Demo Engine (Illustrative Only)

import { QuantityDiscountTier, DemoDiscountInfo } from './types';

export const QUANTITY_DISCOUNT_TIERS: QuantityDiscountTier[] = [
  { minQty: 1, maxQty: 1, percentage: 0, label: '1 sản phẩm (0%)' },
  { minQty: 2, maxQty: 2, percentage: 5, label: '2 sản phẩm (5%)' },
  { minQty: 3, maxQty: 4, percentage: 8, label: '3–4 sản phẩm (8%)' },
  { minQty: 5, percentage: 12, label: 'Từ 5 sản phẩm (12%)' },
];

export const DEMO_DISCOUNT_DISCLAIMER = 'Ưu đãi mô phỏng — chưa áp dụng vào thanh toán.';

/**
 * Calculate illustrative quantity discount tier, savings, and next milestone.
 * NOTE: This is purely for demonstration and UX showcase; it DOES NOT alter final payment calculations.
 */
export function calculateDemoDiscount(totalQuantity: number, subtotal: number): DemoDiscountInfo {
  const qty = Math.max(0, totalQuantity);
  const sub = Math.max(0, subtotal);

  let activeTier: QuantityDiscountTier = QUANTITY_DISCOUNT_TIERS[0];
  let nextTier: QuantityDiscountTier | null = QUANTITY_DISCOUNT_TIERS[1];

  if (qty >= 5) {
    activeTier = QUANTITY_DISCOUNT_TIERS[3];
    nextTier = null;
  } else if (qty >= 3) {
    activeTier = QUANTITY_DISCOUNT_TIERS[2];
    nextTier = QUANTITY_DISCOUNT_TIERS[3];
  } else if (qty >= 2) {
    activeTier = QUANTITY_DISCOUNT_TIERS[1];
    nextTier = QUANTITY_DISCOUNT_TIERS[2];
  } else {
    activeTier = QUANTITY_DISCOUNT_TIERS[0];
    nextTier = QUANTITY_DISCOUNT_TIERS[1];
  }

  const activePercentage = activeTier.percentage;
  const estimatedSavings = Math.round((sub * activePercentage) / 100);
  const itemsToNextTier = nextTier ? Math.max(0, nextTier.minQty - qty) : 0;

  return {
    totalQuantity: qty,
    subtotal: sub,
    activePercentage,
    activeTier,
    nextTier,
    estimatedSavings,
    itemsToNextTier,
    disclaimer: DEMO_DISCOUNT_DISCLAIMER,
  };
}

/**
 * Generate formatted text explaining the discount policy for the chatbot
 */
export function formatDiscountExplanation(currentCartQty = 0, currentCartSubtotal = 0): string {
  const info = calculateDemoDiscount(currentCartQty, currentCartSubtotal);

  let text = 'Mộc Ngôn Hương hiện đang áp dụng chính sách ưu đãi số lượng hấp dẫn:\n';
  text += '• Mua 2 sản phẩm: Giảm 5%\n';
  text += '• Mua 3 – 4 sản phẩm: Giảm 8%\n';
  text += '• Mua từ 5 sản phẩm: Giảm 12%\n\n';

  if (currentCartQty > 0) {
    if (info.activePercentage > 0) {
      text += `🛒 Giỏ hàng hiện tại (${currentCartQty} món): Đạt mốc giảm ${info.activePercentage}% (tiết kiệm ước tính ~${info.estimatedSavings.toLocaleString('vi-VN')}đ).\n`;
    }
    if (info.nextTier) {
      text += `💡 Mua thêm ${info.itemsToNextTier} món nữa để đạt mốc giảm ${info.nextTier.percentage}%!\n\n`;
    }
  } else {
    text += '💡 Bạn có thể kết hợp mua các hộp trà đơn hoặc combo quà tặng để nhận ưu đãi tốt nhất.\n\n';
  }

  text += `* Lưu ý: ${DEMO_DISCOUNT_DISCLAIMER}`;
  return text;
}

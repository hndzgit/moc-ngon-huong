// api/_lib/notifications.ts
// Transactional Email Automation for Mộc Ngôn Hương (Resend API)
// Supports:
// - Email A: Order Created (COD & VietQR with bank transfer instructions + recovery link)
// - Email B: Payment Confirmed (Admin-verified payment confirmation)
// - Guest Order Recovery Link Email

import {
  buildOrderRecoveryUrl,
  getConfiguredVietQrBankDetails,
} from './orderRecovery.js';
import {
  DEFAULT_VIETQR_BANK_FULL_NAME,
  DEFAULT_VIETQR_BANK_SHORT_NAME,
} from '../../src/lib/vietqr.js';
import { BUSINESS_CONTACT } from '../../src/lib/contact.js';

export function renderEmailSupportFooterHtml(compact = false): string {
  const padding = compact ? '14px 28px' : '16px 28px';
  return `<div style="padding: ${padding}; background: #faf8f3; border-top: 1px solid #efe9dc; font-size: 12px; color: #777; text-align: center;">
      ${BUSINESS_CONTACT.brandName} &bull; Hotline/Zalo: <a href="${BUSINESS_CONTACT.hotlineTelHref}" style="color: #3e5641; text-decoration: none; font-weight: 600;">${BUSINESS_CONTACT.hotlineDisplay}</a> &bull; <a href="${BUSINESS_CONTACT.emailMailtoHref}" style="color: #3e5641; text-decoration: none;">${BUSINESS_CONTACT.email}</a>
    </div>`;
}

export type NotificationLocale = 'vi' | 'en';

export function normalizeNotificationLocale(input: unknown): NotificationLocale {
  if (typeof input === 'string' && input.trim().toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'vi';
}

export interface OrderNotificationPayload {
  id: string;
  orderCode: string;
  locale?: NotificationLocale;
  userId?: string | null;
  recoveryToken?: string | null;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address?: string;
    provinceCode?: string;
    provinceName?: string;
    communeCode?: string;
    communeName?: string;
    formattedAddress?: string;
    addressSchemaVersion?: string;
    city?: string;
    district?: string;
    ward?: string;
    shippingMode: 'delivery' | 'pickup';
    pickupStore?: string;
    note?: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    sku?: string;
    productName: string;
    price: number;
    quantity: number;
    weightGrams?: number;
    giftConfiguration?: {
      intention?: string;
      emotion?: string;
      recipient?: string;
      message?: string;
      cardStyle?: string;
    };
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'cod' | 'bank';
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  paymentConfirmedAt?: string | null;
  paymentConfirmedBy?: string | null;
  bankTransactionRef?: string | null;
}

export interface EmailDeliveryResult {
  adminEmailSent: boolean;
  customerEmailSent: boolean;
  messageId?: string | null;
  idempotencyKey?: string;
  sentAt?: string | null;
  error?: string;
}

function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EN_PRODUCT_NAME_MAP: Record<string, string> = {
  'buoi-an': 'Pomelo Blossom Tea – AN',
  'nhai-thuong': 'Jasmine Blossom Tea – THƯƠNG',
  'soi-cam': 'Wild Chloranthus Tea – CẢM',
  'com-nho': 'Young Green Rice Tea – NHỚ',
  'hop-qua-tam-y': 'Multi-Flavor Gift Box — "TÂM Ý"',
};

const EN_EMOTION_NAME_MAP: Record<string, string> = {
  AN: 'AN (Serenity)',
  THUONG: 'THƯƠNG (Affection)',
  CAM: 'CẢM (Gratitude)',
  NHO: 'NHỚ (Nostalgia)',
};

function getLocalizedOrderItemName(productId: string, fallbackName: string, locale: NotificationLocale): string {
  if (locale !== 'en') return fallbackName;
  const baseId = productId.endsWith('-le') ? productId.replace(/-le$/, '') : productId;
  return EN_PRODUCT_NAME_MAP[productId] || EN_PRODUCT_NAME_MAP[baseId] || fallbackName;
}

function getLocalizedGiftEmotion(emotion: string, locale: NotificationLocale): string {
  if (locale !== 'en') return emotion;
  return EN_EMOTION_NAME_MAP[emotion] || emotion;
}

function formatMoney(amount: number, locale: NotificationLocale = 'vi'): string {
  const safe = Math.round(amount || 0);
  if (locale === 'en') {
    return `${safe.toLocaleString('en-US')} VND`;
  }
  return `${safe.toLocaleString('vi-VN')} đ`;
}

function formatDateForLocale(
  isoStr: string | undefined | null,
  locale: NotificationLocale = 'vi'
): string {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(isoStr);
  }
}

function formatDeliveryDestinationEn(order: OrderNotificationPayload): string {
  if (order.customer.shippingMode === 'pickup') {
    const store =
      order.customer.pickupStore && !order.customer.pickupStore.includes('Phố Hàng Điếu')
        ? order.customer.pickupStore
        : '42 Hàng Điếu St, Hoàn Kiếm District, Hanoi';
    return `Store Pickup: ${store}`;
  }
  if (order.customer.formattedAddress) {
    return order.customer.formattedAddress;
  }
  if (order.customer.communeName && order.customer.provinceName) {
    return [order.customer.address, order.customer.communeName, order.customer.provinceName]
      .filter(Boolean)
      .join(', ');
  }
  return [
    order.customer.address,
    order.customer.ward,
    order.customer.district,
    order.customer.city,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatOrderStatusEn(status: string): string {
  switch (status) {
    case 'pending_confirmation':
      return 'Pending Confirmation';
    case 'confirmed':
      return 'Confirmed';
    case 'preparing':
      return 'Preparing Order';
    case 'ready_for_pickup':
      return 'Ready for Store Pickup';
    case 'shipping':
      return 'In Transit';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function formatItemsHtmlRowsEn(order: OrderNotificationPayload): string {
  return order.items
    .map((item) => {
      const displayName = getLocalizedOrderItemName(item.productId, item.productName, 'en');
      const lineTotal = item.price * item.quantity;
      const giftHtml = item.giftConfiguration
        ? `<div style="margin-top:4px;font-size:12px;color:#526956;">🎁 Personalized Gift Card: ${escapeHtml(item.giftConfiguration.recipient || 'Loved One')} (${escapeHtml(getLocalizedGiftEmotion(item.giftConfiguration.emotion, 'en'))})</div>`
        : '';
      const skuHtml = item.sku
        ? `<div style="margin-top:3px;font-size:11.5px;color:#3e5641;font-family:monospace;">SKU: <strong>${escapeHtml(item.sku)}</strong></div>`
        : '';
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #efe9dc; color: #222; font-size: 13.5px;">
            <strong>${escapeHtml(displayName)}</strong>
            ${skuHtml}
            ${giftHtml}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #efe9dc; color: #444; font-size: 13.5px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #efe9dc; color: #203323; font-size: 13.5px; font-weight: 600; text-align: right;">${formatMoney(lineTotal, 'en')}</td>
        </tr>
      `;
    })
    .join('');
}

function formatItemsTextLinesEn(order: OrderNotificationPayload): string[] {
  return order.items.map((item) => {
    const displayName = getLocalizedOrderItemName(item.productId, item.productName, 'en');
    const skuPart = item.sku ? ` [SKU: ${item.sku}]` : '';
    return `- ${displayName}${skuPart} | Qty: ${item.quantity} | Subtotal: ${formatMoney(item.price * item.quantity, 'en')}`;
  });
}

function buildOrderCreatedCustomerEmailEn(order: OrderNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const deliveryDestination = formatDeliveryDestinationEn(order);
  const isBank = order.paymentMethod === 'bank';
  const paymentMethodLabel = isBank
    ? 'Bank Transfer via VietQR (BIDV • NAPAS 247)'
    : 'Cash on Delivery (COD)';
  const paymentStatusLabel = isBank
    ? 'Awaiting Bank Transfer Verification'
    : 'Pay courier upon delivery (COD)';
  const bankCfg = getConfiguredVietQrBankDetails();
  const recoveryUrl = buildOrderRecoveryUrl(order.id, order.recoveryToken, 'en');
  const itemsHtmlRows = formatItemsHtmlRowsEn(order);
  const formattedCreatedAt = formatDateForLocale(order.createdAt, 'en');

  const bankInstructionsHtml = isBank
    ? `
      <div style="margin: 22px 0; padding: 18px 20px; background: #fbfaf6; border: 1px solid #d4af37; border-radius: 12px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #203323; font-family: Georgia, serif;">
          VietQR Bank Transfer Instructions (Exact Reference Required)
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr>
            <td style="padding: 6px 8px; color: #666; border-bottom: 1px solid #f0ece1;">Bank:</td>
            <td style="padding: 6px 8px; color: #222; font-weight: 600; border-bottom: 1px solid #f0ece1;">${escapeHtml(DEFAULT_VIETQR_BANK_SHORT_NAME)} — ${escapeHtml(DEFAULT_VIETQR_BANK_FULL_NAME)} (BIN ${escapeHtml(bankCfg.bankBin)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #666; border-bottom: 1px solid #f0ece1;">Account Name:</td>
            <td style="padding: 6px 8px; color: #222; font-weight: 700; border-bottom: 1px solid #f0ece1;">${escapeHtml(bankCfg.accountName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #666; border-bottom: 1px solid #f0ece1;">Account Number:</td>
            <td style="padding: 6px 8px; color: #203323; font-weight: 700; font-family: monospace; font-size: 15px; border-bottom: 1px solid #f0ece1;">${escapeHtml(bankCfg.accountNo)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #666; border-bottom: 1px solid #f0ece1;">Transfer Amount:</td>
            <td style="padding: 6px 8px; color: #8c6a1f; font-weight: 700; font-size: 15px; border-bottom: 1px solid #f0ece1;">${formatMoney(order.total, 'en')}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #666;">Transfer Reference:</td>
            <td style="padding: 6px 8px; color: #203323; font-weight: 700; font-family: monospace; font-size: 15px;">${escapeHtml(order.orderCode)}</td>
          </tr>
        </table>
        <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #526956; line-height: 1.55;">
          Important: Keep the exact transfer reference <strong>${escapeHtml(order.orderCode)}</strong>. After transferring, click “I have transferred” on your order page so our team can verify your transaction against our bank statement.
        </p>
        <div style="margin-top: 14px;">
          <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 11px 22px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13.5px; font-weight: 600;">
            Open VietQR Payment Page &amp; Order Status →
          </a>
        </div>
      </div>
    `
    : `
      <div style="margin: 20px 0; padding: 14px 18px; background: #faf8f3; border-left: 3px solid #3e5641; border-radius: 6px; font-size: 13.5px; color: #333; line-height: 1.6;">
        You selected <strong>Cash on Delivery (COD)</strong>. Our team will contact you shortly to confirm dispatch timing. You may inspect your tea gift box upon delivery before completing payment.
        <div style="margin-top: 10px;">
          <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 10px 20px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13px; font-weight: 600;">
            Track Your Order Anytime →
          </a>
        </div>
      </div>
    `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #222; background: #f6f4ee; padding: 24px 12px; margin: 0;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5dfd5; border-radius: 16px; overflow: hidden;">
    <div style="background: #203323; padding: 26px 28px; color: #f7f4d5;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d4af37;">Mộc Ngôn Hương • Flavors of Tea Filled with Love</p>
      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; color: #f7f4d5;">Thank you for your order!</h1>
      <p style="margin: 8px 0 0 0; font-size: 13.5px; color: #dce3dc;">Order Code: <strong>${escapeHtml(order.orderCode)}</strong> • Placed at ${escapeHtml(formattedCreatedAt)}</p>
    </div>
    <div style="padding: 24px 28px;">
      <p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.6;">
        Dear <strong>${escapeHtml(order.customer.fullName)}</strong>, we have received your order cleanly and our tea artisans are preparing your gift with care.
      </p>
      ${bankInstructionsHtml}
      <h3 style="margin: 22px 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #3e5641;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #efe9dc; border-radius: 8px;">
        <thead>
          <tr style="background: #faf8f3;">
            <th style="padding: 9px 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Item</th>
            <th style="padding: 9px 12px; text-align: center; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Qty</th>
            <th style="padding: 9px 12px; text-align: right; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtmlRows}</tbody>
      </table>
      <div style="margin-top: 14px; padding: 14px 16px; background: #faf8f3; border-radius: 10px; font-size: 13.5px; line-height: 1.7;">
        <div><strong>Subtotal:</strong> ${formatMoney(order.subtotal, 'en')}</div>
        <div><strong>Shipping Fee:</strong> ${order.shippingFee === 0 ? 'Complimentary' : formatMoney(order.shippingFee, 'en')}</div>
        ${order.discount > 0 ? `<div><strong>Discount:</strong> -${formatMoney(order.discount, 'en')}</div>` : ''}
        <div style="font-size: 15.5px; color: #203323; margin-top: 4px;"><strong>Total Amount:</strong> ${formatMoney(order.total, 'en')}</div>
      </div>
      <div style="margin-top: 18px; font-size: 13.5px; line-height: 1.7; color: #444;">
        <div><strong>Payment Method:</strong> ${escapeHtml(paymentMethodLabel)}</div>
        <div><strong>Payment Status:</strong> ${escapeHtml(paymentStatusLabel)}</div>
        <div><strong>Recipient &amp; Phone:</strong> ${escapeHtml(order.customer.fullName)} • ${escapeHtml(order.customer.phone)}</div>
        <div><strong>Delivery / Pickup:</strong> ${escapeHtml(deliveryDestination)}</div>
        ${order.customer.note ? `<div><strong>Order Note:</strong> ${escapeHtml(order.customer.note)}</div>` : ''}
      </div>
      <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #efe9dc; font-size: 12px; color: #777; line-height: 1.6;">
        Save your personal lookup &amp; payment link: <a href="${escapeHtml(recoveryUrl)}" style="color: #3e5641; word-break: break-all;">${escapeHtml(recoveryUrl)}</a>
      </div>
    </div>
    ${renderEmailSupportFooterHtml(false)}
  </div>
</body>
</html>`;

  const textLines = [
    `Mộc Ngôn Hương — Order Confirmed | ${order.orderCode}`,
    `Dear ${order.customer.fullName},`,
    `Your order has been received (${formattedCreatedAt}).`,
    `Payment Method: ${paymentMethodLabel}`,
    `Payment Status: ${paymentStatusLabel}`,
    `Total Amount: ${formatMoney(order.total, 'en')}`,
    ...(isBank
      ? [
          `--- BANK TRANSFER DETAILS (VIETQR) ---`,
          `Bank: ${DEFAULT_VIETQR_BANK_SHORT_NAME} (${bankCfg.bankBin})`,
          `Account Name: ${bankCfg.accountName}`,
          `Account Number: ${bankCfg.accountNo}`,
          `Exact Transfer Reference: ${order.orderCode}`,
        ]
      : []),
    `--- ORDER ITEMS ---`,
    ...formatItemsTextLinesEn(order),
    `Delivery / Pickup: ${deliveryDestination}`,
    `Order lookup & payment status link: ${recoveryUrl}`,
  ];

  return {
    subject: `Mộc Ngôn Hương — Order Confirmed | ${order.orderCode}`,
    html,
    text: textLines.join('\n'),
  };
}

function buildPaymentConfirmedCustomerEmailEn(order: OrderNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const deliveryDestination = formatDeliveryDestinationEn(order);
  const paymentMethodLabel =
    order.paymentMethod === 'bank'
      ? 'VietQR Bank Transfer (BIDV • NAPAS 247)'
      : 'Cash on Delivery (COD)';
  const confirmedTime = formatDateForLocale(
    order.paymentConfirmedAt || new Date().toISOString(),
    'en'
  );
  const orderStatusLabel = formatOrderStatusEn(order.orderStatus);
  const recoveryUrl = buildOrderRecoveryUrl(order.id, order.recoveryToken, 'en');
  const itemsHtmlRows = formatItemsHtmlRowsEn(order);
  const exactConfirmationMessage = `Payment verified and confirmed for order ${order.orderCode}. Our team is carefully packing and dispatching your tea gift.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #222; background: #f6f4ee; padding: 24px 12px; margin: 0;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5dfd5; border-radius: 16px; overflow: hidden;">
    <div style="background: #203323; padding: 26px 28px; color: #f7f4d5;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d4af37;">Mộc Ngôn Hương • Payment Verification Complete</p>
      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; color: #f7f4d5;">Payment Confirmed</h1>
      <p style="margin: 8px 0 0 0; font-size: 13.5px; color: #dce3dc;">Order Code: <strong>${escapeHtml(order.orderCode)}</strong> • Verified at ${escapeHtml(confirmedTime)}</p>
    </div>
    <div style="padding: 24px 28px;">
      <div style="padding: 14px 18px; background: #eff8f1; border: 1px solid #b7dfc0; border-radius: 10px; color: #1f5c2e; font-size: 14.5px; font-weight: 600; margin-bottom: 18px;">
        ✅ ${escapeHtml(exactConfirmationMessage)}
      </div>
      <p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.6;">
        Dear <strong>${escapeHtml(order.customer.fullName)}</strong>, thank you for your transfer. Your order is now being thoughtfully prepared.
      </p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #efe9dc; margin-bottom: 18px;">
        <thead>
          <tr style="background: #faf8f3;">
            <th style="padding: 9px 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Item</th>
            <th style="padding: 9px 12px; text-align: center; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Qty</th>
            <th style="padding: 9px 12px; text-align: right; font-size: 12px; color: #666; border-bottom: 1px solid #efe9dc;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtmlRows}</tbody>
      </table>
      <div style="padding: 14px 16px; background: #faf8f3; border-radius: 10px; font-size: 13.5px; line-height: 1.7;">
        <div><strong>Order Status:</strong> ${escapeHtml(orderStatusLabel)}</div>
        <div><strong>Payment Method:</strong> ${escapeHtml(paymentMethodLabel)}</div>
        <div><strong>Total Paid:</strong> <strong style="color: #203323;">${formatMoney(order.total, 'en')}</strong></div>
        <div><strong>Delivery / Pickup:</strong> ${escapeHtml(deliveryDestination)}</div>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 11px 24px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13.5px; font-weight: 600;">
          Track Your Order →
        </a>
      </div>
    </div>
    ${renderEmailSupportFooterHtml(false)}
  </div>
</body>
</html>`;

  const text = [
    `Mộc Ngôn Hương — Payment Confirmed | ${order.orderCode}`,
    exactConfirmationMessage,
    `Total Paid: ${formatMoney(order.total, 'en')}`,
    `Order Status: ${orderStatusLabel}`,
    `Delivery / Pickup: ${deliveryDestination}`,
    `Track your order: ${recoveryUrl}`,
  ].join('\n');

  return {
    subject: `Mộc Ngôn Hương — Payment Confirmed | ${order.orderCode}`,
    html,
    text,
  };
}

function formatVND(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString('vi-VN')} đ`;
}

function formatVNDate(isoStr: string | undefined | null): string {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return String(isoStr);
  }
}

function formatDeliveryDestination(order: OrderNotificationPayload): string {
  if (order.customer.shippingMode === 'pickup') {
    return `Nhận tại tiệm: ${order.customer.pickupStore || '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội'}`;
  }
  return (
    order.customer.formattedAddress ||
    (order.customer.communeName
      ? [order.customer.address, order.customer.communeName, order.customer.provinceName]
          .filter(Boolean)
          .join(', ')
      : [order.customer.address, order.customer.ward, order.customer.district, order.customer.city]
          .filter(Boolean)
          .join(', '))
  );
}

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending_confirmation':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'preparing':
      return 'Đang chuẩn bị trà';
    case 'ready_for_pickup':
      return 'Sẵn sàng nhận tại tiệm';
    case 'shipping':
      return 'Đang giao hàng';
    case 'completed':
      return 'Đã hoàn tất';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || 'Đang xử lý';
  }
}

function formatItemsHtmlRows(order: OrderNotificationPayload): string {
  return order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      const giftHtml = item.giftConfiguration
        ? `<div style="margin-top: 6px; padding: 8px 10px; background: #faf7f2; border-left: 3px solid #8e6746; font-size: 12px; color: #555;">
             <strong>Thiệp quà tặng (${escapeHtml(item.giftConfiguration.emotion)}):</strong>
             Người nhận: ${escapeHtml(item.giftConfiguration.recipient)}<br/>
             <em>"${escapeHtml(item.giftConfiguration.message)}"</em>
           </div>`
        : '';

      const skuHtml = item.sku
        ? `<div style="margin-top: 2px; font-size: 12px; color: #666; font-family: monospace;">Mã sản phẩm: ${escapeHtml(item.sku)}</div>`
        : '';

      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; color: #222;">
            <strong>${escapeHtml(item.productName)}</strong>
            ${skuHtml}
            ${giftHtml}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; text-align: center; color: #444;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #444;">
            ${formatVND(item.price)}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; font-weight: 600; color: #203323;">
            ${formatVND(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join('');
}

function formatItemsTextLines(order: OrderNotificationPayload): string[] {
  return order.items.map((item) => {
    const skuPart = item.sku ? ` [Mã sản phẩm: ${item.sku}]` : '';
    return `- ${item.productName}${skuPart} | SL: ${item.quantity} | Thành tiền: ${formatVND(item.price * item.quantity)}`;
  });
}

export interface ResendDispatchOptions {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  reply_to?: string | string[];
  idempotencyKey?: string;
}

export interface ResendDispatchResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function dispatchResendEmail(
  options: ResendDispatchOptions
): Promise<ResendDispatchResult> {
  // Support in-memory test capture without hitting external network when MNH_CAPTURE_EMAILS_FOR_TEST === '1'
  const testCaptureList = (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__;
  if (process.env.MNH_CAPTURE_EMAILS_FOR_TEST === '1' && Array.isArray(testCaptureList)) {
    if (process.env.MNH_SIMULATE_EMAIL_FAILURE === '1') {
      return { success: false, error: 'Simulated transient email provider error' };
    }
    if (options.idempotencyKey) {
      const duplicate = testCaptureList.find((e: any) => e.idempotencyKey === options.idempotencyKey);
      if (duplicate) {
        return { success: true, id: duplicate.messageId };
      }
    }
    const msgId = `re_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    testCaptureList.push({
      ...options,
      messageId: msgId,
      capturedAt: new Date().toISOString(),
    });
    return { success: true, id: msgId };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const { idempotencyKey, replyTo, reply_to, ...restPayload } = options;
  const resolvedReplyTo = replyTo || reply_to || process.env.EMAIL_REPLY_TO || 'mocngonhuong@gmail.com';
  const emailPayload = {
    ...restPayload,
    reply_to: resolvedReplyTo,
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify(emailPayload),
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, id: data?.id || `resend_${Date.now()}` };
    }

    const errMsg = data?.message || (typeof data === 'object' ? JSON.stringify(data) : `HTTP ${res.status}`);
    const isProductionEnv =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      Boolean(process.env.VERCEL);

    if (
      !isProductionEnv &&
      process.env.ALLOW_DEV_RESEND_FALLBACK === 'true' &&
      (res.status === 403 || String(errMsg).includes('domain') || String(errMsg).includes('not verified')) &&
      !options.from.includes('onboarding@resend.dev')
    ) {
      const fallbackRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...emailPayload,
          from: 'Mộc Ngôn Hương <onboarding@resend.dev>',
        }),
      });
      const fallbackData: any = await fallbackRes.json().catch(() => ({}));
      if (fallbackRes.ok) {
        return { success: true, id: fallbackData?.id || `resend_${Date.now()}` };
      }
      return { success: false, error: fallbackData?.message || `HTTP ${fallbackRes.status}` };
    }

    return { success: false, error: errMsg };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error calling Resend API',
    };
  }
}

async function dispatchOrderResendEmail(params: {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const res = await dispatchResendEmail(params);
  return {
    ok: res.success,
    messageId: res.id,
    error: res.error,
  };
}

/**
 * EMAIL A — ORDER CREATED / ORDER RECEIVED
 * Subject: Mộc Ngôn Hương — Đặt hàng thành công | MNH000001
 */
export async function sendOrderNotification(
  order: OrderNotificationPayload
): Promise<EmailDeliveryResult> {
  const adminRecipient = process.env.ORDER_NOTIFICATION_EMAIL || 'mocngonhuong@gmail.com';
  const senderAddress =
    process.env.ORDER_EMAIL_FROM || 'Mộc Ngôn Hương <donhang@mail.mocngonhuong.com>';

  const deliveryDestination = formatDeliveryDestination(order);
  const isBank = order.paymentMethod === 'bank';
  const paymentMethodLabel = isBank
    ? 'Chuyển khoản ngân hàng (VietQR)'
    : 'Thanh toán khi nhận hàng (COD)';
  const paymentStatusLabel = isBank
    ? 'Chờ thanh toán chuyển khoản (Chưa thanh toán)'
    : 'Thanh toán tiền mặt khi nhận hàng (COD)';

  const bankCfg = getConfiguredVietQrBankDetails();
  const recoveryUrl = buildOrderRecoveryUrl(order.id, order.recoveryToken);
  const itemsHtmlRows = formatItemsHtmlRows(order);
  const formattedCreatedAt = formatVNDate(order.createdAt);

  const bankInstructionsHtml = isBank
    ? `
      <div style="margin-top: 22px; padding: 18px; background: #faf6ee; border-radius: 12px; border: 1px solid #d9c398;">
        <h3 style="margin: 0 0 8px; font-size: 16px; color: #203323;">
          Hướng dẫn chuyển khoản thanh toán VietQR
        </h3>
        <p style="margin: 0 0 12px; font-size: 13.5px; color: #555; line-height: 1.55;">
          Đơn hàng của Quý khách đang ở trạng thái <strong>Chờ thanh toán</strong>. Quý khách vui lòng chuyển khoản theo đúng thông tin dưới đây hoặc mở liên kết đơn hàng để quét mã VietQR động:
        </p>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; padding: 12px; border: 1px solid #e5dfd5; font-size: 13.5px;">
          <tr>
            <td style="padding: 8px 12px; color: #666; border-bottom: 1px solid #f0ece1;">Ngân hàng thụ hưởng:</td>
            <td style="padding: 8px 12px; color: #222; font-weight: 600; border-bottom: 1px solid #f0ece1;">${escapeHtml(DEFAULT_VIETQR_BANK_SHORT_NAME)} — ${escapeHtml(DEFAULT_VIETQR_BANK_FULL_NAME)} (BIN ${escapeHtml(bankCfg.bankBin)})</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #666; border-bottom: 1px solid #f0ece1;">Chủ tài khoản:</td>
            <td style="padding: 8px 12px; color: #222; font-weight: 700; border-bottom: 1px solid #f0ece1;">${escapeHtml(bankCfg.accountName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #666; border-bottom: 1px solid #f0ece1;">Số tài khoản:</td>
            <td style="padding: 8px 12px; color: #203323; font-weight: 700; font-family: monospace; font-size: 15px; border-bottom: 1px solid #f0ece1;">${escapeHtml(bankCfg.accountNo)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #666; border-bottom: 1px solid #f0ece1;">Số tiền cần chuyển:</td>
            <td style="padding: 8px 12px; color: #3e5641; font-weight: 700; font-size: 15px; border-bottom: 1px solid #f0ece1;">${formatVND(order.total)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #666;">Nội dung chuyển khoản (chính xác):</td>
            <td style="padding: 8px 12px; color: #8e6746; font-weight: 700; font-family: monospace; font-size: 15px;">${escapeHtml(order.orderCode)}</td>
          </tr>
        </table>
        <div style="margin-top: 14px; text-align: center;">
          <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 11px 22px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13.5px; font-weight: 600;">
            Mở Trang Quét Mã VietQR &amp; Xác Nhận Chuyển Khoản
          </a>
        </div>
      </div>
    `
    : `
      <div style="margin-top: 22px; padding: 16px; background: #f8f5ee; border-radius: 10px; border: 1px solid #e8e2d5; font-size: 13.5px; color: #444; line-height: 1.6;">
        <p style="margin: 0 0 10px;">
          Đơn hàng của Quý khách được áp dụng hình thức <strong>Thanh toán tiền mặt khi nhận hàng (COD)</strong>. Quý khách sẽ thanh toán <strong>${formatVND(order.total)}</strong> khi nhận kiện trà.
        </p>
        <div style="margin-top: 10px;">
          <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 10px 20px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13px; font-weight: 600;">
            Xem Trạng Thái Đơn Hàng ${escapeHtml(order.orderCode)}
          </a>
        </div>
      </div>
    `;

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #faf7f2; padding: 24px; border: 1px solid #e5e0d8; border-radius: 12px; color: #222;">
      <div style="text-align: center; border-bottom: 2px solid #3e5641; padding-bottom: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8e6746; font-weight: 600;">MỘC NGÔN HƯƠNG • TRÀ THỦ CÔNG</p>
        <h1 style="margin: 6px 0 0; font-size: 22px; color: #203323;">Đặt Hàng Thành Công</h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #555;">Mã đơn hàng: <strong style="color: #3e5641;">${escapeHtml(order.orderCode)}</strong></p>
      </div>

      <p style="font-size: 14.5px; line-height: 1.6; color: #333;">
        Thân chào <strong>${escapeHtml(order.customer.fullName)}</strong>,<br/>
        Cảm ơn Quý khách đã trao gửi niềm tin tại <strong>Mộc Ngôn Hương</strong>. Đơn hàng <strong>${escapeHtml(order.orderCode)}</strong> của Quý khách đã được hệ thống ghi nhận vào lúc ${escapeHtml(formattedCreatedAt)}.
      </p>

      <div style="background: #ffffff; border-radius: 10px; padding: 16px; margin: 18px 0; border: 1px solid #ece7df;">
        <h2 style="margin: 0 0 12px; font-size: 15px; color: #3e5641; text-transform: uppercase; letter-spacing: 0.5px;">Thông tin nhận hàng &amp; thanh toán</h2>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Người nhận:</strong> ${escapeHtml(order.customer.fullName)} — ${escapeHtml(order.customer.phone)}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Địa chỉ / Nơi nhận:</strong> ${escapeHtml(deliveryDestination)}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentMethodLabel)}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Trạng thái thanh toán:</strong> <span style="color: #b37424; font-weight: 600;">${escapeHtml(paymentStatusLabel)}</span></p>
        ${order.customer.note ? `<p style="margin: 8px 0 0; font-size: 13px; color: #666;"><strong>Ghi chú:</strong> "${escapeHtml(order.customer.note)}"</p>` : ''}
      </div>

      <div style="background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #ece7df;">
        <h2 style="margin: 0 0 12px; font-size: 15px; color: #3e5641; text-transform: uppercase; letter-spacing: 0.5px;">Chi tiết sản phẩm</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f2ec;">
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #666;">Sản phẩm</th>
              <th style="padding: 8px; text-align: center; font-size: 12px; color: #666;">SL</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #666;">Đơn giá</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #666;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtmlRows}
          </tbody>
        </table>

        <div style="margin-top: 16px; border-top: 2px solid #f0ece1; padding-top: 12px; text-align: right;">
          <p style="margin: 4px 0; font-size: 14px; color: #555;">Tạm tính: <strong>${formatVND(order.subtotal)}</strong></p>
          <p style="margin: 4px 0; font-size: 14px; color: #555;">Phí vận chuyển: <strong>${order.shippingFee === 0 ? 'Miễn phí' : formatVND(order.shippingFee)}</strong></p>
          ${order.discount > 0 ? `<p style="margin: 4px 0; font-size: 14px; color: #555;">Ưu đãi: <strong>-${formatVND(order.discount)}</strong></p>` : ''}
          <p style="margin: 8px 0 0; font-size: 18px; color: #3e5641;"><strong>Tổng thanh toán: ${formatVND(order.total)}</strong></p>
        </div>
      </div>

      ${bankInstructionsHtml}

      <div style="margin-top: 20px; font-size: 12.5px; color: #666; line-height: 1.5; text-align: center;">
        Liên kết tra cứu và khôi phục phiên đơn hàng của Quý khách:<br/>
        <a href="${escapeHtml(recoveryUrl)}" style="color: #3e5641; word-break: break-all;">${escapeHtml(recoveryUrl)}</a>
      </div>
      <div style="margin-top: 18px;">${renderEmailSupportFooterHtml(true)}</div>
    </div>
  `;

  const customerText = [
    `MỘC NGÔN HƯƠNG — ĐẶT HÀNG THÀNH CÔNG | ${order.orderCode}`,
    `Xin chào ${order.customer.fullName},`,
    `Mã đơn hàng: ${order.orderCode}`,
    `Thời gian đặt: ${formattedCreatedAt}`,
    `Người nhận: ${order.customer.fullName} (${order.customer.phone})`,
    `Địa chỉ nhận: ${deliveryDestination}`,
    `Phương thức thanh toán: ${paymentMethodLabel}`,
    `Trạng thái thanh toán: ${paymentStatusLabel}`,
    ...formatItemsTextLines(order),
    `Tổng thanh toán: ${formatVND(order.total)}`,
    ...(isBank
      ? [
          `--- HƯỚNG DẪN CHUYỂN KHOẢN VIETQR ---`,
          `Ngân hàng: ${DEFAULT_VIETQR_BANK_SHORT_NAME} (${bankCfg.bankBin})`,
          `Chủ tài khoản: ${bankCfg.accountName}`,
          `Số tài khoản: ${bankCfg.accountNo}`,
          `Số tiền: ${formatVND(order.total)}`,
          `Nội dung chuyển khoản: ${order.orderCode}`,
        ]
      : []),
    `Liên kết tra cứu & thanh toán đơn hàng: ${recoveryUrl}`,
  ].join('\n');

  const locale = normalizeNotificationLocale(order.locale);
  const enCustomerEmail = locale === 'en' ? buildOrderCreatedCustomerEmailEn(order) : null;
  const customerSubject = enCustomerEmail
    ? enCustomerEmail.subject
    : `Mộc Ngôn Hương — Đặt hàng thành công | ${order.orderCode}`;
  const finalCustomerHtml = enCustomerEmail ? enCustomerEmail.html : customerHtml;
  const finalCustomerText = enCustomerEmail ? enCustomerEmail.text : customerText;
  const customerIdempKey = `order-created-customer-${order.id}`;

  let customerEmailSent = false;
  let adminEmailSent = false;
  let messageId: string | null = null;
  const errors: string[] = [];

  if (order.customer.email) {
    const custRes = await dispatchOrderResendEmail({
      from: senderAddress,
      to: [order.customer.email],
      replyTo: adminRecipient,
      subject: customerSubject,
      html: finalCustomerHtml,
      text: finalCustomerText,
      idempotencyKey: customerIdempKey,
    });
    if (custRes.ok) {
      customerEmailSent = true;
      messageId = custRes.messageId || null;
    } else if (custRes.error) {
      errors.push(`Customer email: ${custRes.error}`);
    }
  }

  // Send admin notification copy
  const adminRes = await dispatchOrderResendEmail({
    from: senderAddress,
    to: [adminRecipient],
    replyTo: order.customer.email || undefined,
    subject: `[Đơn hàng mới ${order.orderCode}] ${order.customer.fullName} — ${formatVND(order.total)}`,
    html: customerHtml,
    text: customerText,
    idempotencyKey: `order-created-admin-${order.id}`,
  });
  if (adminRes.ok) {
    adminEmailSent = true;
    if (!messageId) messageId = adminRes.messageId || null;
  } else if (adminRes.error) {
    errors.push(`Admin email: ${adminRes.error}`);
  }

  return {
    adminEmailSent,
    customerEmailSent,
    messageId,
    idempotencyKey: customerIdempKey,
    sentAt: customerEmailSent || adminEmailSent ? new Date().toISOString() : null,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * EMAIL B — PAYMENT CONFIRMED (Triggered ONLY when an authorized admin confirms payment)
 * Subject: Mộc Ngôn Hương — Xác nhận thanh toán thành công | MNH000001
 */
export async function sendPaymentConfirmedNotification(
  order: OrderNotificationPayload
): Promise<EmailDeliveryResult> {
  const adminRecipient = process.env.ORDER_NOTIFICATION_EMAIL || 'mocngonhuong@gmail.com';
  const senderAddress =
    process.env.ORDER_EMAIL_FROM || 'Mộc Ngôn Hương <donhang@mail.mocngonhuong.com>';

  const deliveryDestination = formatDeliveryDestination(order);
  const paymentMethodLabel =
    order.paymentMethod === 'bank'
      ? 'Chuyển khoản ngân hàng (VietQR)'
      : 'Thanh toán khi nhận hàng (COD)';
  const confirmedTime = formatVNDate(order.paymentConfirmedAt || new Date().toISOString());
  const orderStatusLabel = formatOrderStatusLabel(order.orderStatus);
  const recoveryUrl = buildOrderRecoveryUrl(order.id, order.recoveryToken);
  const itemsHtmlRows = formatItemsHtmlRows(order);

  const exactConfirmationMessage =
    'Mộc Ngôn Hương đã xác nhận khoản thanh toán cho đơn hàng của bạn. Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm của chúng tôi.';

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #faf7f2; padding: 24px; border: 1px solid #e5e0d8; border-radius: 12px; color: #222;">
      <div style="text-align: center; border-bottom: 2px solid #3e5641; padding-bottom: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8e6746; font-weight: 600;">MỘC NGÔN HƯƠNG • XÁC NHẬN THANH TOÁN</p>
        <h1 style="margin: 6px 0 0; font-size: 22px; color: #203323;">Xác Nhận Thanh Toán Thành Công</h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #555;">Mã đơn hàng: <strong style="color: #3e5641;">${escapeHtml(order.orderCode)}</strong></p>
      </div>

      <p style="font-size: 14.5px; line-height: 1.6; color: #333;">
        Thân chào <strong>${escapeHtml(order.customer.fullName)}</strong>,
      </p>

      <div style="padding: 16px 18px; background: #eef6f0; border-left: 4px solid #3e5641; border-radius: 8px; margin: 14px 0 20px; font-size: 14.5px; color: #203323; line-height: 1.6; font-weight: 500;">
        ${escapeHtml(exactConfirmationMessage)}
      </div>

      <div style="background: #ffffff; border-radius: 10px; padding: 16px; margin: 18px 0; border: 1px solid #ece7df;">
        <h2 style="margin: 0 0 12px; font-size: 15px; color: #3e5641; text-transform: uppercase; letter-spacing: 0.5px;">Thông tin xác nhận thanh toán</h2>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace; font-weight: 700; color: #3e5641;">${escapeHtml(order.orderCode)}</span></p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Số tiền đã xác nhận:</strong> <strong style="color: #3e5641;">${formatVND(order.total)}</strong></p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentMethodLabel)}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Trạng thái thanh toán:</strong> <span style="color: #15803d; font-weight: 700;">Đã thanh toán</span></p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Thời gian xác nhận:</strong> ${escapeHtml(confirmedTime)}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Trạng thái đơn hàng:</strong> ${escapeHtml(orderStatusLabel)}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Địa chỉ nhận hàng:</strong> ${escapeHtml(deliveryDestination)}</p>
      </div>

      <div style="background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #ece7df;">
        <h2 style="margin: 0 0 12px; font-size: 15px; color: #3e5641; text-transform: uppercase; letter-spacing: 0.5px;">Tóm tắt đơn hàng</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f2ec;">
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #666;">Sản phẩm</th>
              <th style="padding: 8px; text-align: center; font-size: 12px; color: #666;">SL</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #666;">Đơn giá</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #666;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtmlRows}
          </tbody>
        </table>
        <div style="margin-top: 14px; border-top: 2px solid #f0ece1; padding-top: 10px; text-align: right;">
          <p style="margin: 6px 0 0; font-size: 17px; color: #3e5641;"><strong>Tổng đã thanh toán: ${formatVND(order.total)}</strong></p>
        </div>
      </div>

      <div style="margin-top: 22px; text-align: center;">
        <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 11px 24px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 13.5px; font-weight: 600;">
          Theo Dõi Trạng Thái Đơn Hàng ${escapeHtml(order.orderCode)}
        </a>
      </div>
      <div style="margin-top: 18px;">${renderEmailSupportFooterHtml(true)}</div>
    </div>
  `;

  const text = [
    `MỘC NGÔN HƯƠNG — XÁC NHẬN THANH TOÁN THÀNH CÔNG | ${order.orderCode}`,
    `Xin chào ${order.customer.fullName},`,
    exactConfirmationMessage,
    `Mã đơn hàng: ${order.orderCode}`,
    `Số tiền đã xác nhận: ${formatVND(order.total)}`,
    `Phương thức thanh toán: ${paymentMethodLabel}`,
    `Thời gian xác nhận: ${confirmedTime}`,
    `Trạng thái đơn hàng: ${orderStatusLabel}`,
    `Địa chỉ nhận hàng: ${deliveryDestination}`,
    ...formatItemsTextLines(order),
    `Theo dõi đơn hàng: ${recoveryUrl}`,
  ].join('\n');

  const locale = normalizeNotificationLocale(order.locale);
  const enEmail = locale === 'en' ? buildPaymentConfirmedCustomerEmailEn(order) : null;
  const subject = enEmail
    ? enEmail.subject
    : `Mộc Ngôn Hương — Xác nhận thanh toán thành công | ${order.orderCode}`;
  const finalHtml = enEmail ? enEmail.html : html;
  const finalText = enEmail ? enEmail.text : text;
  const idempotencyKey = `payment-confirmed-${order.id}`;

  if (!order.customer.email) {
    return {
      adminEmailSent: false,
      customerEmailSent: false,
      idempotencyKey,
      error: 'Customer email is empty',
    };
  }

  const res = await dispatchOrderResendEmail({
    from: senderAddress,
    to: [order.customer.email],
    replyTo: adminRecipient,
    subject,
    html: finalHtml,
    text: finalText,
    idempotencyKey,
  });

  return {
    adminEmailSent: false,
    customerEmailSent: res.ok,
    messageId: res.messageId || null,
    idempotencyKey,
    sentAt: res.ok ? new Date().toISOString() : null,
    error: res.error,
  };
}

/**
 * Guest Order Recovery Email (when customer requests a fresh recovery link using orderCode + matching email)
 */
export async function sendOrderRecoveryEmail(params: {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  total: number;
  recoveryToken: string;
  locale?: NotificationLocale;
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  if (normalizeNotificationLocale(params.locale) === 'en') {
    const adminRecipient = process.env.ORDER_NOTIFICATION_EMAIL || 'mocngonhuong@gmail.com';
    const senderAddress =
      process.env.RESEND_FROM_EMAIL || 'Mộc Ngôn Hương <donhang@mail.mocngonhuong.com>';
    const recoveryUrl = buildOrderRecoveryUrl(params.orderId, params.recoveryToken, 'en');
    const displayName =
      params.customerName && params.customerName !== 'Quý khách'
        ? params.customerName
        : 'Valued Guest';
    const subject = `Mộc Ngôn Hương — Guest Order Lookup & Payment Link | ${params.orderCode}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #222; background: #f6f4ee; padding: 24px 12px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5dfd5; border-radius: 16px; overflow: hidden;">
    <div style="background: #203323; padding: 24px 28px; color: #f7f4d5;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d4af37;">Mộc Ngôn Hương • Order Verification Link</p>
      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 20px; color: #f7f4d5;">Guest Order Lookup: ${escapeHtml(params.orderCode)}</h1>
    </div>
    <div style="padding: 24px 28px; font-size: 14.5px; line-height: 1.6;">
      <p style="margin: 0 0 12px 0;">Dear <strong>${escapeHtml(displayName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Use the secure personal link below to view your order summary and VietQR payment status for <strong>${escapeHtml(params.orderCode)}</strong> (${formatMoney(params.total, 'en')}):</p>
      <div style="margin: 18px 0; text-align: center;">
        <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 12px 24px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 600;">
          Open Order &amp; VietQR Status →
        </a>
      </div>
      <p style="margin: 14px 0 6px 0; font-size: 12.5px; color: #666;">Direct link:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all;"><a href="${escapeHtml(recoveryUrl)}" style="color: #3e5641;">${escapeHtml(recoveryUrl)}</a></p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #777;">Please keep this link private and do not share it publicly.</p>
    </div>
    ${renderEmailSupportFooterHtml(true)}
  </div>
</body>
</html>`;
    const text = `Mộc Ngôn Hương — Order Lookup Link ${params.orderCode} (${formatMoney(params.total, 'en')}):\n${recoveryUrl}`;
    const res = await dispatchOrderResendEmail({
      from: senderAddress,
      to: [params.customerEmail],
      replyTo: adminRecipient,
      subject,
      html,
      text,
      idempotencyKey: `order-recovery-${params.orderId}-${params.recoveryToken.slice(0, 12)}`,
    });
    return { sent: res.ok, messageId: res.messageId, error: res.error };
  }

  const adminRecipient = process.env.ORDER_NOTIFICATION_EMAIL || 'mocngonhuong@gmail.com';
  const senderAddress =
    process.env.ORDER_EMAIL_FROM || 'Mộc Ngôn Hương <donhang@mail.mocngonhuong.com>';
  const recoveryUrl = buildOrderRecoveryUrl(params.orderId, params.recoveryToken);

  const subject = `Mộc Ngôn Hương — Liên kết tra cứu & thanh toán đơn hàng | ${params.orderCode}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf7f2; padding: 24px; border: 1px solid #e5e0d8; border-radius: 12px; color: #222;">
      <p style="margin: 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8e6746; font-weight: 600;">MỘC NGÔN HƯƠNG</p>
      <h2 style="margin: 8px 0 14px; color: #203323;">Khôi Phục Phiên Đơn Hàng ${escapeHtml(params.orderCode)}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #333;">
        Thân chào <strong>${escapeHtml(params.customerName)}</strong>,<br/>
        Bạn vừa yêu cầu liên kết bảo mật để xem chi tiết hoặc tiếp tục thanh toán đơn hàng <strong>${escapeHtml(params.orderCode)}</strong> (${formatVND(params.total)}).
      </p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${escapeHtml(recoveryUrl)}" style="display: inline-block; padding: 12px 24px; background: #3e5641; color: #f7f4d5; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 600;">
          Mở Đơn Hàng ${escapeHtml(params.orderCode)}
        </a>
      </div>
      <p style="font-size: 12px; color: #666;">
        Liên kết trực tiếp: <a href="${escapeHtml(recoveryUrl)}" style="color: #3e5641; word-break: break-all;">${escapeHtml(recoveryUrl)}</a>
      </p>
      <div style="margin-top: 18px;">${renderEmailSupportFooterHtml(true)}</div>
    </div>
  `;
  const text = `Mộc Ngôn Hương — Liên kết khôi phục đơn hàng ${params.orderCode} (${formatVND(params.total)}):\n${recoveryUrl}`;

  const res = await dispatchOrderResendEmail({
    from: senderAddress,
    to: [params.customerEmail],
    replyTo: adminRecipient,
    subject,
    html,
    text,
    idempotencyKey: `order-recovery-${params.orderId}-${params.recoveryToken.slice(0, 12)}`,
  });

  return { sent: res.ok, messageId: res.messageId, error: res.error };
}

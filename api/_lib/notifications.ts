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

export interface OrderNotificationPayload {
  id: string;
  orderCode: string;
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
    productName: string;
    price: number;
    quantity: number;
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

      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; color: #222;">
            <strong>${escapeHtml(item.productName)}</strong>
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

async function dispatchResendEmail(params: {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  // Support in-memory test capture without hitting external network when MNH_CAPTURE_EMAILS_FOR_TEST === '1'
  const testCaptureList = (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__;
  if (process.env.MNH_CAPTURE_EMAILS_FOR_TEST === '1' && Array.isArray(testCaptureList)) {
    if (process.env.MNH_SIMULATE_EMAIL_FAILURE === '1') {
      return { ok: false, error: 'Simulated transient email provider error' };
    }
    const duplicate = testCaptureList.find((e: any) => e.idempotencyKey === params.idempotencyKey);
    if (duplicate) {
      return { ok: true, messageId: duplicate.messageId };
    }
    const msgId = `re_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    testCaptureList.push({
      ...params,
      messageId: msgId,
      capturedAt: new Date().toISOString(),
    });
    return { ok: true, messageId: msgId };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': params.idempotencyKey,
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, messageId: data?.id || `resend_${Date.now()}` };
    }
    return {
      ok: false,
      error: data?.message || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error calling Resend API',
    };
  }
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

  const customerSubject = `Mộc Ngôn Hương — Đặt hàng thành công | ${order.orderCode}`;
  const customerIdempKey = `order-created-customer-${order.id}`;

  let customerEmailSent = false;
  let adminEmailSent = false;
  let messageId: string | null = null;
  const errors: string[] = [];

  if (order.customer.email) {
    const custRes = await dispatchResendEmail({
      from: senderAddress,
      to: [order.customer.email],
      replyTo: adminRecipient,
      subject: customerSubject,
      html: customerHtml,
      text: customerText,
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
  const adminRes = await dispatchResendEmail({
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
    `Theo dõi đơn hàng: ${recoveryUrl}`,
  ].join('\n');

  const subject = `Mộc Ngôn Hương — Xác nhận thanh toán thành công | ${order.orderCode}`;
  const idempotencyKey = `payment-confirmed-${order.id}`;

  if (!order.customer.email) {
    return {
      adminEmailSent: false,
      customerEmailSent: false,
      idempotencyKey,
      error: 'Customer email is empty',
    };
  }

  const res = await dispatchResendEmail({
    from: senderAddress,
    to: [order.customer.email],
    replyTo: adminRecipient,
    subject,
    html,
    text,
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
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
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
    </div>
  `;
  const text = `Mộc Ngôn Hương — Liên kết khôi phục đơn hàng ${params.orderCode} (${formatVND(params.total)}):\n${recoveryUrl}`;

  const res = await dispatchResendEmail({
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

import type { OrderRecord } from '../../src/types';

export interface NotificationResult {
  success: boolean;
  provider: 'resend' | 'sendgrid' | 'webhook' | 'dev-logger';
  simulated?: boolean;
  error?: string;
}

/**
 * Sends a transactional order notification email to the configured shop inbox.
 * Triggered only once per newly created order (HTTP 201).
 * Never rolls back or fails an order if email delivery fails.
 */
export async function sendShopOrderNotification(order: OrderRecord): Promise<NotificationResult> {
  const shopEmail =
    process.env.SHOP_NOTIFICATION_EMAIL ||
    process.env.ORDER_NOTIFICATION_EMAIL ||
    'mocngonhuong@gmail.com';
  const fromEmail = process.env.EMAIL_FROM || 'Mộc Ngôn Hương <donhang@mocngonhuong.com>';

  const subject = `[ĐƠN HÀNG MỚI] ${order.orderCode} - ${order.customer.fullName} (${order.total.toLocaleString('vi-VN')}đ)`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.productName}</strong>
          ${
            item.giftConfiguration
              ? `<br><small style="color: #666;">Thiệp: ${item.giftConfiguration.recipient || 'Quà tặng'} - "${item.giftConfiguration.message || ''}"</small>`
              : ''
          }
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')} đ</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
      </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #faf8f3;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5dfd5; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background-color: #3e5641; padding: 24px; text-align: center; color: #f7f4d5;">
          <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px;">MỘC NGÔN HƯƠNG</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">THÔNG BÁO TIẾP NHẬN ĐƠN HÀNG MỚI</p>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f7f4d5; border: 1px solid #c89f5d; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 15px;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace; font-weight: bold; color: #3e5641; font-size: 17px;">${order.orderCode}</span></p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #666;">Thời gian đặt: ${new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          </div>

          <h3 style="color: #3e5641; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 2px solid #3e5641; padding-bottom: 6px;">1. THÔNG TIN KHÁCH HÀNG</h3>
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="width: 130px; color: #666;">Khách hàng:</td><td><strong>${order.customer.fullName}</strong></td></tr>
            <tr><td style="color: #666;">Số điện thoại:</td><td><a href="tel:${order.customer.phone}" style="color: #3e5641; font-weight: bold; font-size: 15px;">${order.customer.phone}</a></td></tr>
            <tr><td style="color: #666;">Email:</td><td>${order.customer.email}</td></tr>
            <tr><td style="color: #666;">Hình thức:</td><td><strong>${order.customer.shippingMode === 'pickup' ? 'Đến lấy hàng tại không gian trà' : 'Giao hàng tận nơi'}</strong></td></tr>
            <tr>
              <td style="color: #666;">Địa chỉ / Cơ sở:</td>
              <td>${order.customer.shippingMode === 'pickup' ? (order.customer.pickupStore || '42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội') : [order.customer.address, order.customer.ward, order.customer.district, order.customer.city].filter(Boolean).join(', ')}</td>
            </tr>
            ${order.customer.note ? `<tr><td style="color: #666;">Ghi chú:</td><td style="color: #d97706;"><em>"${order.customer.note}"</em></td></tr>` : ''}
          </table>

          <h3 style="color: #3e5641; margin-bottom: 12px; font-size: 16px; border-bottom: 2px solid #3e5641; padding-bottom: 6px;">2. CHI TIẾT SẢN PHẨM</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #faf8f3; color: #555;">
                <th style="padding: 8px 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 8px 10px; text-align: center;">SL</th>
                <th style="padding: 8px 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 8px 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background: #faf8f3; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Tạm tính:</span><strong>${order.subtotal.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Phí vận chuyển:</span><strong style="color: #3e5641;">Miễn phí (Ưu đãi ra mắt)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: bold; color: #3e5641; border-top: 1px solid #ddd; padding-top: 8px;">
              <span>TỔNG TIỀN:</span><span>${order.total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div style="background: #fdfbf7; border-left: 4px solid #c89f5d; padding: 12px 16px; font-size: 13.5px; color: #555; margin-bottom: 24px;">
            <p style="margin: 0;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng (Chờ xác nhận)' : 'Thanh toán tiền mặt khi nhận hàng (COD)'}</p>
            <p style="margin: 6px 0 0 0;"><strong>Trạng thái đơn:</strong> Chờ xác nhận liên hệ</p>
          </div>

          <div style="background-color: #3e5641; border-radius: 10px; padding: 16px; text-align: center; font-size: 13.5px; color: #f7f4d5;">
            <p style="margin: 0; font-weight: bold;">HƯỚNG DẪN XỬ LÝ ĐƠN HÀNG CHO CỬA HÀNG:</p>
            <p style="margin: 6px 0 0 0; opacity: 0.95;">1. Liên hệ khách hàng qua điện thoại/SMS trong vòng 60 phút để xác nhận đơn.<br>
            2. Chuẩn bị sản phẩm trà và in thiệp/đóng gói hộp quà.<br>
            3. Trực tiếp sắp xếp giao hàng hoặc hẹn khách tại không gian trà.</p>
          </div>
        </div>

        <div style="background: #f0ebe1; padding: 14px; text-align: center; font-size: 12px; color: #777;">
          Mộc Ngôn Hương — Văn hóa Trà Việt & Quà Tặng Tinh Hoa<br>
          Thông báo tự động nội bộ dành riêng cho chủ cửa hàng
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [shopEmail],
          subject,
          html,
        }),
      });
      if (res.ok) {
        return { success: true, provider: 'resend' };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, provider: 'resend', error: JSON.stringify(errData) };
    } catch (err: any) {
      return { success: false, provider: 'resend', error: err?.message };
    }
  }

  // 2. Custom Webhook
  if (process.env.ORDER_NOTIFICATION_WEBHOOK) {
    try {
      const res = await fetch(process.env.ORDER_NOTIFICATION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.created',
          order,
          recipient: shopEmail,
          subject,
        }),
      });
      return { success: res.ok, provider: 'webhook' };
    } catch (err: any) {
      return { success: false, provider: 'webhook', error: err?.message };
    }
  }

  // 3. Fallback / Dev Logger
  console.log(`[MNH SHOP ORDER NOTIFICATION] To: ${shopEmail} | Code: ${order.orderCode} | Total: ${order.total.toLocaleString('vi-VN')}đ | Customer: ${order.customer.fullName} (${order.customer.phone})`);
  return { success: true, provider: 'dev-logger', simulated: true };
}

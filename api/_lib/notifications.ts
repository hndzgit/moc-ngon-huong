import type { OrderRecord } from '../../src/types';

export interface NotificationResult {
  success: boolean;
  provider: 'resend' | 'sendgrid' | 'webhook' | 'dev-logger';
  simulated?: boolean;
  error?: string;
  details?: {
    shop?: { success: boolean; error?: string };
    customer?: { success: boolean; error?: string };
  };
}

/**
 * Helper to dispatch an email via Resend with automatic fallback
 * to onboarding@resend.dev if custom sender domain is unverified.
 */
export async function dispatchResendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(options),
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = JSON.stringify(errData);

    // If failed due to unverified custom domain and 'from' wasn't already onboarding@resend.dev,
    // automatically retry using onboarding@resend.dev
    if (
      (res.status === 403 || errMsg.includes('domain') || errMsg.includes('not verified')) &&
      !options.from.includes('onboarding@resend.dev')
    ) {
      console.warn('[MNH Resend] Custom sender unverified on Resend. Retrying with onboarding@resend.dev...');
      const fallbackRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...options,
          from: 'Mộc Ngôn Hương <onboarding@resend.dev>',
        }),
      });

      if (fallbackRes.ok) {
        return { success: true };
      }
      const fallbackErr = await fallbackRes.json().catch(() => ({}));
      return { success: false, error: JSON.stringify(fallbackErr) };
    }

    return { success: false, error: errMsg };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Builds HTML table for items in the order.
 */
function buildItemsHtml(order: OrderRecord): string {
  return order.items
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
}

/**
 * Sends a transactional order notification email to the shop inbox.
 */
export async function sendShopOrderNotification(order: OrderRecord): Promise<NotificationResult> {
  const shopEmail =
    process.env.ORDER_NOTIFICATION_EMAIL ||
    process.env.SHOP_NOTIFICATION_EMAIL ||
    'mocngonhuong@gmail.com';

  const fromEmail =
    process.env.ORDER_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    'Mộc Ngôn Hương <donhang@mocngonhuong.com>';

  const subject = `[MỘC NGÔN HƯƠNG] Đơn hàng mới — ${order.orderCode} - ${order.customer.fullName} (${order.total.toLocaleString('vi-VN')}đ)`;
  const itemsHtml = buildItemsHtml(order);

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

  if (process.env.RESEND_API_KEY) {
    const resendRes = await dispatchResendEmail({
      from: fromEmail,
      to: [shopEmail],
      subject,
      html,
    });
    if (resendRes.success) {
      return { success: true, provider: 'resend' };
    }
    return { success: false, provider: 'resend', error: resendRes.error };
  }

  // Fallback Dev Logger
  console.log(`[MNH SHOP ORDER NOTIFICATION] To: ${shopEmail} | Code: ${order.orderCode} | Total: ${order.total.toLocaleString('vi-VN')}đ | Customer: ${order.customer.fullName} (${order.customer.phone})`);
  return { success: true, provider: 'dev-logger', simulated: true };
}

/**
 * Sends a warm, branded confirmation email to the customer.
 */
export async function sendCustomerOrderConfirmation(order: OrderRecord): Promise<NotificationResult> {
  const customerEmail = order.customer.email;
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { success: false, provider: 'dev-logger', error: 'Invalid customer email' };
  }

  const fromEmail =
    process.env.ORDER_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    'Mộc Ngôn Hương <donhang@mocngonhuong.com>';

  const subject = `[MỘC NGÔN HƯƠNG] Xác nhận đơn hàng #${order.orderCode}`;
  const itemsHtml = buildItemsHtml(order);

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #222; margin: 0; padding: 20px; background-color: #faf8f3;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5dfd5; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #3e5641; padding: 28px 24px; text-align: center; color: #f7f4d5;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 2.5px; font-weight: 600;">MỘC NGÔN HƯƠNG</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; font-style: italic;">Trao hương, gửi lời thương</p>
        </div>

        <div style="padding: 24px 28px;">
          <!-- Greeting -->
          <p style="font-size: 15px; margin-top: 0;">Kính gửi Quý khách <strong>${order.customer.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #444; line-height: 1.6;">
            Mộc Ngôn Hương chân thành cảm ơn Quý khách đã gửi trọn niềm tin và lựa chọn những thức trà tinh hoa của chúng tôi. 
            Đơn hàng của Quý khách đã được tiếp nhận thành công vào hệ thống.
          </p>

          <!-- Order Summary Card -->
          <div style="background-color: #f7f4d5; border: 1px solid #c89f5d; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px;">
              <strong>Mã đơn hàng:</strong> 
              <span style="font-family: monospace; font-weight: bold; color: #3e5641; font-size: 17px; margin-left: 8px;">${order.orderCode}</span>
            </p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #666;">
              Thời gian đặt: ${new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          </div>

          <!-- Items Details -->
          <h3 style="color: #3e5641; margin-bottom: 12px; font-size: 16px; border-bottom: 2px solid #3e5641; padding-bottom: 6px;">DANH SÁCH SẢN PHẨM</h3>
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

          <!-- Total Calculation -->
          <div style="background: #faf8f3; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Tạm tính:</span><strong>${order.subtotal.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Phí vận chuyển:</span><strong style="color: #3e5641;">Miễn phí (Ưu đãi ra mắt)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: bold; color: #3e5641; border-top: 1px solid #ddd; padding-top: 8px;">
              <span>TỔNG THANH TOÁN:</span><span>${order.total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <!-- Shipping and Payment Details -->
          <h3 style="color: #3e5641; margin-bottom: 12px; font-size: 16px; border-bottom: 2px solid #3e5641; padding-bottom: 6px;">THÔNG TIN NHẬN HÀNG & THANH TOÁN</h3>
          <table style="width: 100%; font-size: 13.5px; line-height: 1.8; margin-bottom: 20px;">
            <tr><td style="width: 140px; color: #666;">Người nhận:</td><td><strong>${order.customer.fullName}</strong> (${order.customer.phone})</td></tr>
            <tr>
              <td style="color: #666;">Hình thức nhận:</td>
              <td><strong>${order.customer.shippingMode === 'pickup' ? 'Đến lấy hàng tại Không gian Trà' : 'Giao hàng tận nơi'}</strong></td>
            </tr>
            <tr>
              <td style="color: #666;">Địa chỉ / Điểm hẹn:</td>
              <td>${order.customer.shippingMode === 'pickup' ? (order.customer.pickupStore || '42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội') : [order.customer.address, order.customer.ward, order.customer.district, order.customer.city].filter(Boolean).join(', ')}</td>
            </tr>
            <tr>
              <td style="color: #666;">Phương thức:</td>
              <td>${order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng (Chuyên viên Mộc Ngôn Hương sẽ liên hệ đối soát)' : 'Thanh toán tiền mặt khi nhận hàng (COD)'}</td>
            </tr>
          </table>

          <!-- Next Steps Notice -->
          <div style="background-color: #f5f8f5; border-left: 4px solid #3e5641; padding: 14px 18px; border-radius: 4px; font-size: 13.5px; color: #333; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: bold; color: #3e5641;">BƯỚC TIẾP THEO:</p>
            <p style="margin: 6px 0 0 0; line-height: 1.5;">
              Chuyên viên chăm sóc của Mộc Ngôn Hương sẽ liên hệ trực tiếp qua số điện thoại <strong>${order.customer.phone}</strong> trong thời gian sớm nhất để xác nhận chi tiết đơn hàng và chuẩn bị đóng gói trà gửi tới Quý khách.
            </p>
          </div>

          <p style="font-size: 14px; color: #555; text-align: center; margin-top: 30px;">
            Chúc Quý khách luôn có những phút giây an yên bên tách trà ấm nồng.<br>
            <strong>Mộc Ngôn Hương trân trọng cảm ơn!</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f0ebe1; padding: 16px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #e0d8cc;">
          <strong>MỘC NGÔN HƯƠNG — VĂN HÓA TRÀ VIỆT & QUÀ TẶNG TINH HOA</strong><br>
          Website: <a href="https://mocngonhuong.com" style="color: #3e5641; text-decoration: none;">mocngonhuong.com</a> | Hotline: <a href="tel:+84889742556" style="color: #3e5641; text-decoration: none; font-weight: bold;">0889 742 556</a> | Email: <a href="mailto:mocngonhuong@gmail.com" style="color: #3e5641; text-decoration: none;">mocngonhuong@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (process.env.RESEND_API_KEY) {
    const resendRes = await dispatchResendEmail({
      from: fromEmail,
      to: [customerEmail],
      subject,
      html,
    });
    if (resendRes.success) {
      return { success: true, provider: 'resend' };
    }
    return { success: false, provider: 'resend', error: resendRes.error };
  }

  // Fallback Dev Logger
  console.log(`[MNH CUSTOMER CONFIRMATION] To: ${customerEmail} | Code: ${order.orderCode} | Total: ${order.total.toLocaleString('vi-VN')}đ`);
  return { success: true, provider: 'dev-logger', simulated: true };
}

/**
 * Sends both shop notification and customer confirmation emails concurrently.
 * Triggered only once per newly created order (HTTP 201) after successful DB commit.
 * Catches all errors so that email delivery issues never roll back the saved order.
 */
export async function sendOrderNotifications(order: OrderRecord): Promise<NotificationResult> {
  const [shopRes, customerRes] = await Promise.allSettled([
    sendShopOrderNotification(order),
    sendCustomerOrderConfirmation(order),
  ]);

  const shopOutcome = shopRes.status === 'fulfilled' ? shopRes.value : { success: false, provider: 'dev-logger' as const, error: String(shopRes.reason) };
  const customerOutcome = customerRes.status === 'fulfilled' ? customerRes.value : { success: false, provider: 'dev-logger' as const, error: String(customerRes.reason) };

  console.log(
    `[MNH Order Emails] Order: ${order.orderCode} | Shop: ${shopOutcome.success ? 'SENT' : 'FAILED (' + shopOutcome.error + ')'} | Customer: ${customerOutcome.success ? 'SENT' : 'FAILED (' + customerOutcome.error + ')'}`
  );

  return {
    success: shopOutcome.success || customerOutcome.success,
    provider: shopOutcome.provider,
    details: {
      shop: { success: shopOutcome.success, error: shopOutcome.error },
      customer: { success: customerOutcome.success, error: customerOutcome.error },
    },
  };
}

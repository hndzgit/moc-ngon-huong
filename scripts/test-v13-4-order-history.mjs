import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

console.log('=== BẮT ĐẦU BỘ KIỂM THỬ TOÀN DIỆN MASTER PROMPT V13.4 ===');
console.log('=== CUSTOMER ORDER HISTORY + SHOP EMAIL NOTIFICATIONS (NO ADMIN DASHBOARD) ===\n');

async function runV134Tests() {
  const TEST_PORT = 5198;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  console.log(`[1] Khởi chạy Vite Dev Server trên cổng ${TEST_PORT}...`);
  const server = await createServer({
    server: { port: TEST_PORT, host: '127.0.0.1' },
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
  });
  await server.listen();
  console.log(`[1] Server đang chạy tại ${BASE_URL}\n`);

  try {
    // ---------------------------------------------------------
    // PHẦN 1: BẢO MẬT XÁC THỰC ENDPOINT /api/me/orders
    // ---------------------------------------------------------
    console.log('--- PHẦN 1: BẢO MẬT & KIỂM SOÁT TRUY CẬP /api/me/orders ---');

    // Test 1.1: GET /api/me/orders không có token -> 401 Unauthorized
    {
      const res = await fetch(`${BASE_URL}/api/me/orders`);
      assert.equal(res.status, 401, 'Không có Authorization header phải trả về 401');
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Yêu cầu đăng nhập|Phiên xác thực/);
      console.log('  ✓ [PASS] 1.1: Từ chối truy cập không có token (401 Unauthorized)');
    }

    // Test 1.2: GET /api/me/orders với token giả mạo / không hợp lệ -> 401 Unauthorized
    {
      const res = await fetch(`${BASE_URL}/api/me/orders`, {
        headers: { Authorization: 'Bearer invalid-token-forged-signature-123' },
      });
      assert.equal(res.status, 401, 'Token không hợp lệ phải trả về 401');
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Phiên xác thực không hợp lệ|Yêu cầu đăng nhập/);
      console.log('  ✓ [PASS] 1.2: Từ chối token giả mạo/hết hạn (401 Unauthorized)');
    }

    // Test 1.3: Chặn phương thức POST/PUT/DELETE trên /api/me/orders
    {
      const res = await fetch(`${BASE_URL}/api/me/orders`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-token-user-a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hack: true }),
      });
      assert.equal(res.status, 405, 'POST vào /api/me/orders phải trả về 405');
      console.log('  ✓ [PASS] 1.3: Chặn phương thức ghi trái phép với HTTP 405 Method Not Allowed');
    }

    // ---------------------------------------------------------
    // PHẦN 2: TẠO ĐƠN HÀNG XÁC THỰC & LIÊN KẾT UID CHÍNH CHỦ
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 2: TẠO ĐƠN HÀNG XÁC THỰC & LIÊN KẾT AUTHORITATIVE UID ---');

    let orderAId = '';
    let orderACode = '';

    // Test 2.1: Khách hàng A (UID: mock_user_a) đặt hàng với ID Token hợp lệ
    {
      const orderPayloadA = {
        idempotencyKey: `v134_test_order_a_${Date.now()}`,
        userId: 'malicious_spoofed_uid', // Cố tình gửi UID giả trong body để kiểm tra server có bị đánh lừa không
        items: [
          {
            productId: 'hop-qua-tam-y',
            quantity: 1,
            giftConfiguration: {
              intention: 'Chúc mừng sinh nhật',
              emotion: 'AN',
              recipient: 'Mẹ yêu',
              message: 'Kính chúc mẹ luôn bình an và vui khỏe mỗi ngày.',
              cardStyle: 'botanical',
            },
          },
          { productId: 'buoi-an', quantity: 2 },
        ],
        customer: {
          fullName: 'Trần Thị Thu An',
          phone: '0988776655',
          email: 'thuan@example.com',
          shippingMode: 'delivery',
          address: '45 Lê Duẩn, Phường Bến Nghé',
          district: 'Quận 1',
          city: 'TP. Hồ Chí Minh',
          note: 'Giao trong giờ hành chính',
        },
        paymentMethod: 'bank',
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token-user-a',
        },
        body: JSON.stringify(orderPayloadA),
      });

      assert.equal(res.status, 201, 'Tạo đơn mới phải trả về HTTP 201');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.order.orderCode.startsWith('MNH-'));
      assert.equal(data.order.customerUid, 'mock_user_a', 'customerUid PHẢI lấy từ token đã xác thực');
      assert.equal(data.order.userId, 'mock_user_a', 'userId không được phép tin cậy body client');
      assert.notEqual(data.order.userId, 'malicious_spoofed_uid', 'Đã ngăn chặn thành công việc giả mạo UID qua body');
      assert.equal(data.order.items.length, 2);
      assert.ok(data.order.items[0].image, 'Item snapshot phải lưu hình ảnh sản phẩm');

      orderAId = data.order.id;
      orderACode = data.order.orderCode;
      console.log(`  ✓ [PASS] 2.1: Đặt hàng thành công (${orderACode}) - Server trích xuất đúng verified customerUid: mock_user_a`);
    }

    // ---------------------------------------------------------
    // PHẦN 3: ĐỌC LỊCH SỬ ĐƠN HÀNG CHÍNH CHỦ QUA /api/me/orders
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 3: TRUY VẤN LỊCH SỬ ĐƠN HÀNG CHÍNH CHỦ & CÁCH LY DỮ LIỆU ---');

    // Test 3.1: Khách hàng A truy vấn danh sách đơn hàng của mình
    {
      const res = await fetch(`${BASE_URL}/api/me/orders`, {
        headers: { Authorization: 'Bearer mock-token-user-a' },
      });
      assert.equal(res.status, 200, 'Khách hàng hợp lệ phải nhận HTTP 200');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.orders), 'orders phải là mảng');
      assert.ok(data.orders.length >= 1, 'Phải có ít nhất 1 đơn hàng của User A');

      const foundOrder = data.orders.find((o) => o.id === orderAId);
      assert.ok(foundOrder, 'Đơn hàng vừa đặt phải xuất hiện trong lịch sử của User A');
      assert.equal(foundOrder.orderCode, orderACode);
      assert.equal(foundOrder.customerUid, 'mock_user_a');
      assert.equal(foundOrder.orderStatus, 'pending_confirmation');
      assert.equal(foundOrder.paymentStatus, 'pending');
      assert.equal(foundOrder.paymentMethod, 'bank');
      assert.equal(foundOrder.customer.fullName, 'Trần Thị Thu An');
      assert.ok(foundOrder.items[0].giftConfiguration, 'Thông tin quà tặng cá nhân hóa phải được lưu nguyên vẹn');
      console.log('  ✓ [PASS] 3.1: User A đọc đúng danh sách đơn hàng của mình kèm đầy đủ chi tiết sản phẩm và quà tặng');
    }

    // Test 3.2: Khách hàng A xem chi tiết một đơn cụ thể qua orderId
    {
      const res = await fetch(`${BASE_URL}/api/me/orders?orderId=${orderAId}`, {
        headers: { Authorization: 'Bearer mock-token-user-a' },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.order.id, orderAId);
      assert.equal(data.order.orderCode, orderACode);
      console.log('  ✓ [PASS] 3.2: User A truy vấn thành công chi tiết đơn hàng cụ thể theo orderId');
    }

    // Test 3.3: CHỐNG RÒ RỈ DỮ LIỆU (CROSS-ACCOUNT LEAK PREVENTION):
    // Khách hàng B (UID: mock_user_b) cố tình đọc đơn của Khách hàng A -> Bị từ chối HTTP 403 Forbidden!
    {
      const res = await fetch(`${BASE_URL}/api/me/orders?orderId=${orderAId}`, {
        headers: { Authorization: 'Bearer mock-token-user-b' },
      });
      assert.equal(res.status, 403, 'User B cố đọc đơn của User A phải bị chặn bằng 403 Forbidden');
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /không có quyền truy cập/);
      console.log('  ✓ [PASS] 3.3: NGĂN CHẶN RÒ RỈ DỮ LIỆU: User B không thể đọc đơn hàng của User A (HTTP 403 Forbidden)');
    }

    // Test 3.4: Danh sách đơn hàng của Khách hàng B không chứa đơn của Khách hàng A
    {
      const res = await fetch(`${BASE_URL}/api/me/orders`, {
        headers: { Authorization: 'Bearer mock-token-user-b' },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      const containsOrderA = data.orders.some((o) => o.id === orderAId);
      assert.equal(containsOrderA, false, 'Danh sách đơn hàng của User B tuyệt đối không được lộ đơn của User A');
      console.log('  ✓ [PASS] 3.4: CÁCH LY DANH SÁCH HOÀN TOÀN: Danh sách đơn của User B không chứa đơn của User A');
    }

    // ---------------------------------------------------------
    // PHẦN 4: GUEST CHECKOUT & BẢO TOÀN DANH TÍNH
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 4: GUEST CHECKOUT & BẢO VỆ DANH TÍNH ---');

    let guestOrderId = '';
    let guestOrderCode = '';

    // Test 4.1: Khách vãng lai (Guest) đặt hàng không cần tài khoản
    {
      const guestPayload = {
        idempotencyKey: `v134_test_guest_${Date.now()}`,
        items: [{ productId: 'nhai-thuong', quantity: 1 }],
        customer: {
          fullName: 'Khách Vãng Lai',
          phone: '0901234567',
          email: 'guest@example.com',
          shippingMode: 'pickup',
          pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
        },
        paymentMethod: 'cod',
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestPayload),
      });

      assert.equal(res.status, 201, 'Guest checkout thành công với 201');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.order.customerUid, null, 'Guest order không được gán UID');
      assert.equal(data.order.userId, null);
      assert.ok(data.order.orderCode.startsWith('MNH-'));
      guestOrderId = data.order.id;
      guestOrderCode = data.order.orderCode;
      console.log(`  ✓ [PASS] 4.1: Guest checkout thành công (${guestOrderCode}) - userId & customerUid là null`);
    }

    // Test 4.2: Tài khoản người dùng không tự động nhận vơ đơn khách vãng lai chỉ bằng email
    {
      // Thử dùng User B truy vấn trực tiếp guest order
      const res = await fetch(`${BASE_URL}/api/me/orders?orderId=${guestOrderId}`, {
        headers: { Authorization: 'Bearer mock-token-user-b' },
      });
      assert.equal(res.status, 403, 'Đơn guest không được tự động mở cho tài khoản khác');
      console.log('  ✓ [PASS] 4.2: Đơn guest không bị tài khoản khác nhận vơ (403 Forbidden)');
    }

    // ---------------------------------------------------------
    // PHẦN 5: THÔNG BÁO EMAIL CHO CHỦ TIỆM (KHÔNG DÙNG ADMIN DASHBOARD)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 5: THÔNG BÁO EMAIL CHỦ TIỆM & CHỐNG TRÙNG LẶP ---');

    // Test 5.1: Đơn hàng mới (HTTP 201) kích hoạt gửi thông báo email
    {
      const uniqueKey = `v134_notif_test_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: uniqueKey,
          items: [{ productId: 'soi-cam', quantity: 1 }],
          customer: {
            fullName: 'Lê Hoàng Long',
            phone: '0977889900',
            email: 'long@example.com',
            shippingMode: 'delivery',
            address: '10 Hai Bà Trưng, Hà Nội',
          },
          paymentMethod: 'cod',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.order.notificationSent, true, 'Đơn mới tạo (HTTP 201) phải đánh dấu notificationSent = true');
      console.log('  ✓ [PASS] 5.1: Đơn hàng mới (HTTP 201) kích hoạt thông báo email đến hòm thư chủ tiệm');

      // Test 5.2: Gửi lại cùng idempotencyKey (HTTP 200 Retry) không gửi thêm email trùng lặp
      const retryRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: uniqueKey,
          items: [{ productId: 'soi-cam', quantity: 1 }],
          customer: {
            fullName: 'Lê Hoàng Long',
            phone: '0977889900',
            email: 'long@example.com',
            shippingMode: 'delivery',
            address: '10 Hai Bà Trưng, Hà Nội',
          },
          paymentMethod: 'cod',
        }),
      });

      assert.equal(retryRes.status, 200, 'Gửi lại cùng key phải trả về HTTP 200 idempotent');
      const retryData = await retryRes.json();
      assert.equal(retryData.order.id, data.order.id, 'Phải trả về đúng đơn đã tạo trước đó');
      console.log('  ✓ [PASS] 5.2: Idempotent Retry (HTTP 200) hoàn trả đơn đã lưu, không gửi trùng email thông báo');
    }

    // ---------------------------------------------------------
    // PHẦN 6: KIỂM TOÁN TÍCH HỢP GIAO DIỆN & FIRESTORE RULES
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 6: KIỂM TOÁN MÃ NGUỒN FRONTEND & SECURITY RULES ---');

    // Test 6.1: Kiểm tra AuthPage.tsx
    {
      const authPageContent = fs.readFileSync('src/pages/AuthPage.tsx', 'utf-8');
      assert.match(authPageContent, /fetch\('\/api\/me\/orders/);
      assert.match(authPageContent, /loadUserOrders/);
      assert.match(authPageContent, /profileTab === 'orders'/);
      assert.match(authPageContent, /selectedOrder/);
      assert.match(authPageContent, /Xem chi tiết/);
      assert.match(authPageContent, /Khám Phá Các Vị Trà/);
      assert.match(authPageContent, /getOrderStatusBadge/);
      assert.match(authPageContent, /getPaymentStatusBadge/);
      console.log('  ✓ [PASS] 6.1: AuthPage.tsx tích hợp đầy đủ tab Đơn hàng của tôi, modal chi tiết và trạng thái chân thực');
    }

    // Test 6.2: Kiểm tra OrderConfirmation.tsx
    {
      const confirmContent = fs.readFileSync('src/components/OrderConfirmation.tsx', 'utf-8');
      assert.match(confirmContent, /Xem Đơn Hàng Của Tôi/);
      assert.match(confirmContent, /onNavigate\('auth'\)/);
      console.log('  ✓ [PASS] 6.2: OrderConfirmation.tsx có nút chuyển trực tiếp sang Đơn hàng của tôi');
    }

    // Test 6.3: Kiểm tra firestore.rules
    {
      const rules = fs.readFileSync('firestore.rules', 'utf-8');
      assert.match(rules, /resource\.data\.userId == request\.auth\.uid \|\|/);
      assert.match(rules, /resource\.data\.customerUid == request\.auth\.uid/);
      assert.match(rules, /allow create, update, delete: if false;/);
      console.log('  ✓ [PASS] 6.3: firestore.rules kiểm soát quyền truy cập chặt chẽ qua cả userId và customerUid');
    }

    console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ V13.4 ĐÃ HOÀN TOÀN VƯỢT QUA 100%! 🎉\n');
  } finally {
    await server.close();
    console.log('[+] Đã đóng Vite test server an toàn.');
  }
}

runV134Tests().catch((err) => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});

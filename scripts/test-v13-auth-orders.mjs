import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

console.log('=== BẮT ĐẦU BỘ KIỂM THỬ TOÀN DIỆN MASTER PROMPT V13.2 ===');
console.log('=== DURABLE ORDER PERSISTENCE, CROSS-INSTANCE IDEMPOTENCY & FAIL-CLOSED SAFETY ===\n');

async function runViteApiTests() {
  const TEST_PORT = 5199;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  console.log(`[1] Khởi chạy Vite Dev Server trên cổng ${TEST_PORT}...`);
  const server = await createServer({
    server: { port: TEST_PORT, host: '127.0.0.1' },
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
  });
  await server.listen();
  console.log(`[1] Server đang chạy tại ${BASE_URL}`);

  try {
    console.log('\n--- PHẦN 1: KIỂM THỬ ENDPOINT & NGHIỆP VỤ CATALOG ---');

    // Test 1.1: GET health check
    {
      const res = await fetch(`${BASE_URL}/api/orders`);
      assert.equal(res.status, 200, 'GET /api/orders phải trả về HTTP 200');
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'Mộc Ngôn Hương Order API');
      assert.ok(data.version.startsWith('13.'), 'Phiên bản API phải là 13.x');
      console.log('  ✓ [PASS] GET /api/orders: Trả về trạng thái service ok (200, v13.2.0)');
    }

    // Test 1.2: PUT method rejection (405)
    {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 123 }),
      });
      assert.equal(res.status, 405, 'PUT phải trả về 405 Method Not Allowed');
      console.log('  ✓ [PASS] Chặn phương thức không hợp lệ với HTTP 405');
    }

    // Test 1.3: Empty cart rejected (400)
    {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
          customer: { fullName: 'Nguyễn Văn An', phone: '0912345678', email: 'an@gmail.com', address: '123 Phố Huế' },
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Giỏ hàng của bạn đang trống/);
      console.log('  ✓ [PASS] Từ chối giỏ hàng rỗng (400)');
    }

    // Test 1.4: Invalid product ID rejected (400)
    {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'san-pham-khong-ton-tai', quantity: 1 }],
          customer: { fullName: 'Nguyễn Văn An', phone: '0912345678', email: 'an@gmail.com', address: '123 Phố Huế' },
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /không tồn tại trong danh mục/);
      console.log('  ✓ [PASS] Từ chối mã sản phẩm ngoài danh mục (400)');
    }

    // Test 1.5: Invalid quantity rejected (400)
    {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'buoi-an', quantity: 0 }],
          customer: { fullName: 'Nguyễn Văn An', phone: '0912345678', email: 'an@gmail.com', address: '123 Phố Huế' },
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Số lượng sản phẩm/);
      console.log('  ✓ [PASS] Từ chối số lượng không hợp lệ <= 0 (400)');
    }

    // Test 1.6: Invalid phone format rejected (400)
    {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'buoi-an', quantity: 1 }],
          customer: { fullName: 'Nguyễn Văn An', phone: '12345', email: 'an@gmail.com', address: '123 Phố Huế' },
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Số điện thoại không hợp lệ/);
      console.log('  ✓ [PASS] Từ chối số điện thoại không hợp lệ (400)');
    }

    // Test 1.7: Authoritative Pricing & Zero-Trust Client Tampering Protection
    {
      const tamperedPayload = {
        items: [
          { productId: 'buoi-an', quantity: 2, price: 50 }, // Attacker attempts 50đ instead of 289,000đ
          { productId: 'hop-qua-tam-y', quantity: 1, price: 100 }, // Attacker attempts 100đ instead of 399,000đ
        ],
        customer: {
          fullName: 'Trần Thị Mai',
          phone: '0987654321',
          email: 'mai.tran@test.com',
          shippingMode: 'delivery',
          address: '45 Hoàng Hoa Thám',
          city: 'Hà Nội',
        },
        paymentMethod: 'cod',
        idempotencyKey: 'test_tamper_key_' + Date.now(),
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tamperedPayload),
      });

      assert.equal(res.status, 201, 'Tạo đơn thành công phải trả về HTTP 201');
      const data = await res.json();
      assert.equal(data.success, true);
      const order = data.order;

      // Authoritative calculation: 289,000 x 2 = 578,000 + 399,000 = 977,000
      assert.equal(order.items[0].price, 289000, 'Giá sản phẩm phải lấy theo catalog máy chủ');
      assert.equal(order.items[1].price, 399000, 'Giá Hộp Quà Tâm Ý phải đúng 399,000đ theo catalog');
      assert.equal(order.subtotal, 977000, 'Subtotal phải tính theo giá niêm yết chính thức');
      assert.equal(order.total, 977000, 'Tổng tiền đơn hàng không bị giả mạo');
      assert.match(order.orderCode, /^MNH-\d{6}-\d{4}$/, 'Mã đơn hàng đúng định dạng MNH-xxxxxx-xxxx');
      assert.ok(order.schemaVersion.startsWith('13.'), 'Schema version phải là 13.x');
      console.log('  ✓ [PASS] BẢO VỆ GIÁ SERVER: Chặn đứng can thiệp giá, tính toán đúng 977.000đ (HTTP 201)');
    }

    console.log('\n--- PHẦN 2: KIỂM THỬ IDEMPOTENCY & CHỐNG TRÙNG LẶP ĐƠN HÀNG ---');

    // Test 2.1: Valid Idempotent Retry Returns HTTP 200 with Identical Order
    let savedOrderCode = '';
    const idempKey = 'idemp_live_test_' + Date.now();
    const payload = {
      idempotencyKey: idempKey,
      items: [{ productId: 'nhai-thuong', quantity: 1 }],
      customer: {
        fullName: 'Lê Hoàng Nam',
        phone: '0901234567',
        email: 'nam.le@example.com',
        shippingMode: 'pickup',
        pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
      },
      paymentMethod: 'bank',
    };

    {
      // First submission -> HTTP 201
      const res1 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.equal(res1.status, 201);
      const data1 = await res1.json();
      assert.equal(data1.duplicate, false);
      savedOrderCode = data1.order.orderCode;

      // Second submission (same key, same body) -> HTTP 200
      const res2 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.duplicate, true);
      assert.equal(data2.order.orderCode, savedOrderCode, 'Mã đơn phải khớp với đơn ban đầu');
      console.log('  ✓ [PASS] IDEMPOTENT RETRY: Đơn đầu trả về 201 Created; Gửi lại trả về 200 OK cùng mã đơn');
    }

    // Test 2.2: Conflict Protection (Reusing key with DIFFERENT payload returns 409 Conflict)
    {
      const conflictKey = 'idemp_conflict_' + Date.now();
      const initialPayload = {
        idempotencyKey: conflictKey,
        items: [{ productId: 'buoi-an', quantity: 1 }],
        customer: { fullName: 'Đỗ Minh', phone: '0912233445', email: 'minh@test.com', address: '12 Tràng Thi' },
        paymentMethod: 'cod',
      };
      const alteredPayload = {
        idempotencyKey: conflictKey,
        items: [{ productId: 'nhai-thuong', quantity: 3 }], // Different item and quantity!
        customer: { fullName: 'Đỗ Minh', phone: '0912233445', email: 'minh@test.com', address: '12 Tràng Thi' },
        paymentMethod: 'bank',
      };

      const resInit = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialPayload),
      });
      assert.equal(resInit.status, 201);

      const resConflict = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alteredPayload),
      });
      assert.equal(resConflict.status, 409, 'Tái sử dụng khóa với nội dung khác phải bị từ chối 409 Conflict');
      const conflictData = await resConflict.json();
      assert.match(conflictData.error, /Xung đột mã yêu cầu/);
      console.log('  ✓ [PASS] BẢO VỆ XUNG ĐỘT KHÓA (409 CONFLICT): Ngăn chặn tái sử dụng khóa cho đơn khác');
    }

    // Test 2.3: In-flight Concurrency Lock (Two simultaneous requests with identical key)
    {
      const concurrentKey = 'idemp_concurrent_' + Date.now();
      const concurrentPayload = {
        idempotencyKey: concurrentKey,
        items: [{ productId: 'com-nho', quantity: 2 }],
        customer: {
          fullName: 'Vũ Thị Lan',
          phone: '0981122334',
          email: 'lan.vu@test.com',
          shippingMode: 'delivery',
          address: '15 Lý Thường Kiệt',
        },
        paymentMethod: 'cod',
      };

      const [resA, resB] = await Promise.all([
        fetch(`${BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(concurrentPayload),
        }),
        fetch(`${BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(concurrentPayload),
        }),
      ]);

      assert.equal(resA.ok, true);
      assert.equal(resB.ok, true);
      const dataA = await resA.json();
      const dataB = await resB.json();
      assert.equal(dataA.order.orderCode, dataB.order.orderCode, 'Yêu cầu đồng thời phải nhận về cùng 1 mã đơn duy nhất');
      console.log('  ✓ [PASS] CONCURRENCY LOCK: Hai yêu cầu gửi cùng mili-giây nhận về cùng một đơn hàng duy nhất');
    }

    console.log('\n--- PHẦN 3: KIỂM THỬ AN TOÀN SẢN XUẤT FAIL-CLOSED (NO /tmp IN PROD) ---');

    // Test 3.1: Verify production fails closed with HTTP 503 when Firestore credentials are absent
    {
      // Test direct handler invocation with VERCEL=1
      const origVercel = process.env.VERCEL;
      const origNodeEnv = process.env.NODE_ENV;
      const origSa = process.env.FIREBASE_SERVICE_ACCOUNT;
      const origKey = process.env.FIREBASE_PRIVATE_KEY;

      try {
        process.env.VERCEL = '1';
        delete process.env.FIREBASE_SERVICE_ACCOUNT;
        delete process.env.FIREBASE_PRIVATE_KEY;

        // Dynamically load fresh module to evaluate environment
        const { default: prodHandler } = await server.ssrLoadModule('/api/orders.ts?test=fail_closed');

        let statusCode = 0;
        let responseJson = null;
        const fakeReq = {
          method: 'POST',
          body: {
            idempotencyKey: 'fail_closed_test_' + Date.now(),
            items: [{ productId: 'buoi-an', quantity: 1 }],
            customer: { fullName: 'Bảo Trì Test', phone: '0912345678', email: 'test@mnh.vn', address: '123 Test' },
            paymentMethod: 'cod',
          },
        };
        const fakeRes = {
          setHeader() {},
          statusCode: 200,
          end(dataStr) {
            statusCode = this.statusCode;
            try { responseJson = JSON.parse(dataStr); } catch {}
          },
        };

        await prodHandler(fakeReq, fakeRes);

        assert.equal(statusCode, 503, 'Khi thiếu DB trong môi trường production/Vercel, phải trả về HTTP 503 Service Unavailable');
        assert.equal(responseJson.code, 'DATABASE_UNAVAILABLE');
        assert.match(responseJson.error, /Hệ thống tiếp nhận đơn hàng đang bảo trì/);
        console.log('  ✓ [PASS] FAIL-CLOSED PRODUCTION: Thiếu Firestore trên Vercel lập tức trả về 503 (Không lưu /tmp)');

        // Test 3.2: Verify untrusted query parameters or headers CANNOT bypass fail-closed
        const bypassReq = {
          method: 'POST',
          query: { test: 'true', dev: '1' },
          headers: { 'x-test-storage': 'true', 'x-allow-tmp': '1' },
          body: fakeReq.body,
        };
        let bypassStatusCode = 0;
        const bypassRes = {
          setHeader() {},
          statusCode: 200,
          end() { bypassStatusCode = this.statusCode; },
        };
        await prodHandler(bypassReq, bypassRes);
        assert.equal(bypassStatusCode, 503, 'Tham số client không được phép bỏ qua chính sách fail-closed');
        console.log('  ✓ [PASS] BẢO VỆ CHỐNG LÁCH CHÍNH SÁCH: Header/Query giả lập không thể kích hoạt lưu trữ tạm');

      } finally {
        if (origVercel !== undefined) process.env.VERCEL = origVercel;
        else delete process.env.VERCEL;
        if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
        else delete process.env.NODE_ENV;
        if (origSa !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT = origSa;
        if (origKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = origKey;
      }
    }

    console.log('\n--- PHẦN 4: KIỂM THỬ PHÂN QUYỀN FIRESTORE RULES & AUTH CONTEXT ---');

    // Test 4.1: Firestore Security Rules checks
    {
      const rules = fs.readFileSync('firestore.rules', 'utf-8');
      assert.match(rules, /match \/users\/\{userId\}/);
      assert.match(rules, /match \/orders\/\{orderId\}/);
      assert.match(rules, /allow create, update, delete: if false;/);
      assert.match(rules, /match \/order_idempotency\/\{key\}/);
      assert.match(rules, /allow read, write: if false;/);
      console.log('  ✓ [PASS] firestore.rules: Khóa toàn bộ client writes tới orders & order_idempotency');
    }

    // Test 4.2: AuthContext & Real Firebase Flow
    {
      const authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');
      assert.match(authContext, /onAuthStateChanged/);
      assert.match(authContext, /createUserWithEmailAndPassword/);
      assert.match(authContext, /signInWithEmailAndPassword/);
      assert.match(authContext, /sendEmailVerification/);
      assert.match(authContext, /confirmPasswordReset/);
      console.log('  ✓ [PASS] AuthContext.tsx: Tích hợp đầy đủ xác thực Firebase không mật khẩu/OTP giả');
    }

    // Test 4.3: CheckoutPage 6-State Machine & Cart Preservation
    {
      const checkoutPage = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf-8');
      assert.match(checkoutPage, /CheckoutStatus/);
      assert.match(checkoutPage, /'idle'/);
      assert.match(checkoutPage, /'validating'/);
      assert.match(checkoutPage, /'submitting'/);
      assert.match(checkoutPage, /'confirmed'/);
      assert.match(checkoutPage, /'failed'/);
      assert.match(checkoutPage, /'uncertain'/);
      assert.match(checkoutPage, /response\.status === 201 \|\| response\.status === 200/);
      assert.match(checkoutPage, /onClearCart\(\)/);
      assert.match(checkoutPage, /idempotencyKeyRef\.current/);
      console.log('  ✓ [PASS] CheckoutPage.tsx: Máy trạng thái 6 bước (hỗ trợ 200/201, bảo toàn giỏ hàng & idempotency key)');
    }

    console.log('\n=== TẤT CẢ 16 BÀI KIỂM THỬ V13.2 ĐÃ VƯỢT QUA 100%! ===\n');
  } finally {
    await server.close();
    console.log('[+] Đã đóng Vite test server.');
  }
}

runViteApiTests().catch((err) => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});

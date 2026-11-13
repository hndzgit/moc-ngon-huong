// scripts/test-v17-4-orders-api.ts
// Mộc Ngôn Hương — API Integration & Server-Side Compatibility Tests (V17.4)
// Tests: POST /api/orders with 2026 schema, idempotency, legacy backward compatibility, and validation

import assert from 'assert';
import { EventEmitter } from 'events';

// Create mock HTTP Request & Response to invoke api/orders handler directly
function createMockReqRes(method: string, body: any, headers: Record<string, string> = {}) {
  const req: any = new EventEmitter();
  req.method = method;
  req.headers = { 'content-type': 'application/json', ...headers };
  req.body = body;

  const res: any = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.setHeader = (key: string, val: string) => {
    res.headers[key.toLowerCase()] = val;
  };
  res.endPayload = '';
  res.end = (chunk?: any) => {
    if (chunk) res.endPayload += chunk;
    res.emit('finish');
  };

  return { req, res };
}

async function run() {
  console.log('================================================================');
  console.log('MỘC NGÔN HƯƠNG — V17.4 ORDERS API INTEGRATION TESTS');
  console.log('================================================================\n');

  // Dynamically import api/orders handler
  const { default: handler } = await import('../api/orders.js');

  // Test 1: New 2026 2-tier delivery order
  console.log('1. Testing new 2026 2-tier delivery order...');
  const idempKey1 = `test_2026_${Date.now()}_1`;
  const { req: req1, res: res1 } = createMockReqRes('POST', {
    idempotencyKey: idempKey1,
    items: [{ productId: 'buoi-an', quantity: 1 }],
    customer: {
      fullName: 'Nguyễn Văn Minh',
      phone: '0988123456',
      email: 'minh.nguyen@example.com',
      shippingMode: 'delivery',
      address: 'Số 42 Phố Hàng Điếu',
      provinceCode: '01',
      communeCode: '00004',
      note: 'Giao giờ hành chính',
    },
    paymentMethod: 'cod',
  });

  await new Promise<void>((resolve) => {
    res1.on('finish', () => resolve());
    handler(req1, res1);
  });

  const out1 = JSON.parse(res1.endPayload);
  assert.strictEqual(res1.statusCode, 201, `Expected 201, got ${res1.statusCode}: ${JSON.stringify(out1)}`);
  assert.strictEqual(out1.success, true);
  assert.strictEqual(out1.duplicate, false);
  assert(/^MNH(\d{6}|-)/.test(out1.order.orderCode));
  assert.strictEqual(out1.order.customer.provinceCode, '01');
  assert.strictEqual(out1.order.customer.provinceName, 'Thành phố Hà Nội');
  assert.strictEqual(out1.order.customer.communeCode, '00004');
  assert.strictEqual(out1.order.customer.communeName, 'Phường Ba Đình');
  assert.strictEqual(
    out1.order.customer.formattedAddress,
    'Số 42 Phố Hàng Điếu, Phường Ba Đình, Thành phố Hà Nội'
  );
  assert.strictEqual(out1.order.customer.addressSchemaVersion, '2');
  console.log('  ✓ Created order with 2026 schema:', out1.order.orderCode);

  // Test 2: Idempotent retry of identical request (duplicate protection)
  console.log('\n2. Testing idempotent retry (duplicate protection)...');
  const { req: req2, res: res2 } = createMockReqRes('POST', {
    idempotencyKey: idempKey1, // Same key & payload
    items: [{ productId: 'buoi-an', quantity: 1 }],
    customer: {
      fullName: 'Nguyễn Văn Minh',
      phone: '0988123456',
      email: 'minh.nguyen@example.com',
      shippingMode: 'delivery',
      address: 'Số 42 Phố Hàng Điếu',
      provinceCode: '01',
      communeCode: '00004',
      note: 'Giao giờ hành chính',
    },
    paymentMethod: 'cod',
  });

  await new Promise<void>((resolve) => {
    res2.on('finish', () => resolve());
    handler(req2, res2);
  });

  const out2 = JSON.parse(res2.endPayload);
  assert.strictEqual(res2.statusCode, 200, `Expected 200 for idempotent retry, got ${res2.statusCode}`);
  assert.strictEqual(out2.success, true);
  assert.strictEqual(out2.duplicate, true);
  assert.strictEqual(out2.order.orderCode, out1.order.orderCode);
  console.log('  ✓ Idempotent retry returned existing order without creating duplicate');

  // Test 3: Pickup order
  console.log('\n3. Testing pickup store order...');
  const { req: req3, res: res3 } = createMockReqRes('POST', {
    idempotencyKey: `test_pickup_${Date.now()}`,
    items: [{ productId: 'nhai-thuong', quantity: 2 }],
    customer: {
      fullName: 'Trần Thị Mai',
      phone: '0912345678',
      email: 'mai.tran@example.com',
      shippingMode: 'pickup',
      pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
    },
    paymentMethod: 'bank',
  });

  await new Promise<void>((resolve) => {
    res3.on('finish', () => resolve());
    handler(req3, res3);
  });

  const out3 = JSON.parse(res3.endPayload);
  assert.strictEqual(res3.statusCode, 201);
  assert.strictEqual(out3.order.customer.shippingMode, 'pickup');
  assert.strictEqual(out3.order.customer.pickupStore, '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội');
  console.log('  ✓ Pickup order created successfully:', out3.order.orderCode);

  // Test 4: Backward compatibility with legacy 3-tier customer payload
  console.log('\n4. Testing legacy 3-tier address backward compatibility...');
  const { req: req4, res: res4 } = createMockReqRes('POST', {
    idempotencyKey: `test_legacy_${Date.now()}`,
    items: [{ productId: 'buoi-an', quantity: 1 }],
    customer: {
      fullName: 'Lê Hoàng Long',
      phone: '0901234567',
      email: 'long.le@example.com',
      shippingMode: 'delivery',
      address: 'Số 15 Phố Huế',
      city: 'Hà Nội',
      district: 'Hai Bà Trưng',
      ward: 'Hàng Bài',
    },
    paymentMethod: 'cod',
  });

  await new Promise<void>((resolve) => {
    res4.on('finish', () => resolve());
    handler(req4, res4);
  });

  const out4 = JSON.parse(res4.endPayload);
  assert.strictEqual(res4.statusCode, 201);
  assert.strictEqual(out4.order.customer.addressSchemaVersion, '1');
  assert.strictEqual(out4.order.customer.city, 'Hà Nội');
  assert.strictEqual(out4.order.customer.district, 'Hai Bà Trưng');
  console.log('  ✓ Legacy order processed and preserved correctly:', out4.order.orderCode);

  // Test 5: Rejection of invalid commune/province combination
  console.log('\n5. Testing server-side rejection of invalid commune/province pair...');
  const { req: req5, res: res5 } = createMockReqRes('POST', {
    idempotencyKey: `test_invalid_${Date.now()}`,
    items: [{ productId: 'buoi-an', quantity: 1 }],
    customer: {
      fullName: 'Phạm Đức',
      phone: '0977889900',
      email: 'duc.pham@example.com',
      shippingMode: 'delivery',
      address: 'Số 10 Tràng Tiền',
      provinceCode: '01', // Hà Nội
      communeCode: '05503', // Tân Cương, Thái Nguyên (invalid for Hà Nội!)
    },
    paymentMethod: 'cod',
  });

  await new Promise<void>((resolve) => {
    res5.on('finish', () => resolve());
    handler(req5, res5);
  });

  const out5 = JSON.parse(res5.endPayload);
  assert.strictEqual(res5.statusCode, 400);
  assert.strictEqual(out5.success, false);
  assert(out5.error.includes('không thuộc'));
  console.log('  ✓ Successfully rejected spoofed/mismatched province & commune pair with 400');

  // Test 6: Rural delivery address acceptance
  console.log('\n6. Testing rural delivery address acceptance...');
  const { req: req6, res: res6 } = createMockReqRes('POST', {
    idempotencyKey: `test_rural_${Date.now()}`,
    items: [{ productId: 'buoi-an', quantity: 1 }],
    customer: {
      fullName: 'Hoàng Văn Bản',
      phone: '0966554433',
      email: 'ban.hoang@example.com',
      shippingMode: 'delivery',
      address: 'Xóm Chè Giữa, Gần đồi chè cổ thụ',
      provinceCode: '19', // Thái Nguyên
      communeCode: '05503', // Tân Cương
    },
    paymentMethod: 'cod',
  });

  await new Promise<void>((resolve) => {
    res6.on('finish', () => resolve());
    handler(req6, res6);
  });

  const out6 = JSON.parse(res6.endPayload);
  assert.strictEqual(res6.statusCode, 201);
  assert.strictEqual(
    out6.order.customer.formattedAddress,
    'Xóm Chè Giữa, Gần đồi chè cổ thụ, Xã Tân Cương, Tỉnh Thái Nguyên'
  );
  console.log('  ✓ Rural address accepted and formatted correctly:', out6.order.orderCode);

  console.log('\n================================================================');
  console.log('ALL API INTEGRATION TESTS PASSED (6/6)');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});

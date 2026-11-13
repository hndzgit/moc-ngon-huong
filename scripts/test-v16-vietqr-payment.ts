// scripts/test-v16-vietqr-payment.ts
// Mộc Ngôn Hương — V16.0 Complete Automated Verification Suite (Suites 1–6)
// Runs completely against an isolated local store (`MNH_USE_LOCAL_DEV_STORE=1`)
// and captured test emails (`MNH_CAPTURE_EMAILS_FOR_TEST=1`) so zero production
// records, counters, or customer emails are ever touched.

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';

const TEST_STORE_PATH = '/tmp/mnh-v16-test-store.json';
const TEST_COUNTER_PATH = '/tmp/mnh-v16-test-store.counter.json';

process.env.MNH_USE_LOCAL_DEV_STORE = '1';
process.env.MNH_LOCAL_DEV_STORE_PATH = TEST_STORE_PATH;
process.env.MNH_LOCAL_DEV_COUNTER_PATH = TEST_COUNTER_PATH;
process.env.MNH_CAPTURE_EMAILS_FOR_TEST = '1';
process.env.ADMIN_UIDS = 'boss1';
process.env.VIETQR_BANK_BIN = '970418';
process.env.VIETQR_BANK_NAME = 'BIDV';
process.env.VIETQR_ACCOUNT_NO = '8960826751';
process.env.VIETQR_ACCOUNT_NAME = 'NGUYEN THI VAN ANH';

function resetLocalStore(initialOrders: any[] = [], nextSeq = 0) {
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify(initialOrders, null, 2), 'utf8');
  fs.writeFileSync(TEST_COUNTER_PATH, JSON.stringify({ nextSeq }, null, 2), 'utf8');
}

function invokeHandler(
  handler: (req: any, res: any) => Promise<any>,
  options: {
    method: string;
    url?: string;
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
    ip?: string;
  }
): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const req: any = new EventEmitter();
    req.method = options.method;
    req.url = options.url || '/api/orders';
    req.query = options.query || {};
    req.body = options.body;
    req.headers = {
      'content-type': 'application/json',
      ...(options.ip ? { 'x-forwarded-for': options.ip } : {}),
      ...(options.headers || {}),
    };
    req.socket = { remoteAddress: options.ip || '127.0.0.1' };

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    res.setHeader = (k: string, v: string) => {
      res.headers[k.toLowerCase()] = v;
    };
    res.endPayload = '';
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj: any) => {
      res.endPayload = JSON.stringify(obj);
      res.emit('finish');
      return res;
    };
    res.end = (chunk?: any) => {
      if (chunk) res.endPayload += chunk;
      res.emit('finish');
    };

    res.on('finish', () => {
      let parsed: any = {};
      try {
        parsed = res.endPayload ? JSON.parse(res.endPayload) : {};
      } catch {
        parsed = { raw: res.endPayload };
      }
      resolve({ status: res.statusCode, body: parsed, headers: res.headers });
    });

    Promise.resolve(handler(req, res)).catch(reject);
  });
}

async function run() {
  console.log('========================================================================');
  console.log('MỘC NGÔN HƯƠNG — V16.0 MANUAL VIETQR PAYMENT & BACKEND TEST SUITE');
  console.log('========================================================================\n');

  const {
    computeCrc16CcittFalse,
    buildVietQrPayload,
    parseAndValidateVietQrPayload,
    buildOrderPaymentInstructions,
  } = await import('../src/lib/vietqr.js');
  const { renderQrSvgString } = await import('../src/lib/qrCodeGenerator.js');
  const { default: ordersHandler } = await import('../api/orders.js');
  const { default: meOrdersHandler } = await import('../api/me/orders.js');
  const { default: adminOrdersHandler } = await import('../api/admin/orders.js');

  const getCapturedTestEmails = (): any[] => (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__ || [];
  const clearCapturedTestEmails = () => {
    (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__ = [];
  };
  clearCapturedTestEmails();

  const VALID_CUSTOMER = {
    fullName: 'Trần Thanh Hương',
    phone: '0988123456',
    email: 'huong.tran@example.com',
    shippingMode: 'delivery',
    address: 'Số 18 Phố Nhà Thờ',
    provinceCode: '01',
    communeCode: '00004',
    note: 'Giao buổi sáng',
  };

  // ==========================================================================
  // SUITE 1 — ORDER CALCULATION & TAMPERING
  // ==========================================================================
  console.log('▶ SUITE 1: Order Calculation & Tampering Protection');
  resetLocalStore([], 0);
  clearCapturedTestEmails();

  // 1.1 Single item order (buoi-an = 289,000, free shipping = 289,000)
  const s1_single = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's1_single_001',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(s1_single.status, 201);
  assert.strictEqual(s1_single.body.order.subtotal, 289000);
  assert.strictEqual(s1_single.body.order.shippingFee, 0);
  assert.strictEqual(s1_single.body.order.total, 289000);
  console.log('  ✓ 1.1 Single item calculation verified: 289,000 VND');

  // 1.2 Multiple items + quantity variation (buoi-an x2 + nhai-thuong x1 = 867,000)
  const s1_multi = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's1_multi_002',
      items: [
        { productId: 'buoi-an', quantity: 2 },     // 578,000
        { productId: 'nhai-thuong', quantity: 1 }, // 289,000
      ],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(s1_multi.status, 201);
  assert.strictEqual(s1_multi.body.order.subtotal, 867000);
  assert.strictEqual(s1_multi.body.order.shippingFee, 0);
  assert.strictEqual(s1_multi.body.order.total, 867000);
  console.log('  ✓ 1.2 Multi-item & quantity variation calculation verified: 867,000 VND');

  // 1.3 Tampered client prices (0, -50000, 1) must be ignored in favor of server catalog
  for (const tamperedPrice of [0, -50000, 1]) {
    const resTamper = await invokeHandler(ordersHandler, {
      method: 'POST',
      body: {
        idempotencyKey: `s1_tamper_${tamperedPrice}`,
        items: [{ productId: 'buoi-an', quantity: 1, price: tamperedPrice }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'bank',
        subtotal: tamperedPrice,
        total: tamperedPrice,
      },
    });
    assert.strictEqual(resTamper.status, 201);
    assert.strictEqual(resTamper.body.order.items[0].price, 289000);
    assert.strictEqual(resTamper.body.order.total, 289000);
    assert.strictEqual(resTamper.body.order.paymentInstructions.amount, 289000);
  }
  console.log('  ✓ 1.3 Tampered client prices (0, -50000, 1) ignored; server catalog price enforced');

  // 1.4 Invalid product ID rejected
  const s1_badProd = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's1_bad_prod',
      items: [{ productId: 'non-existent-tea-999', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(s1_badProd.status, 400);
  console.log('  ✓ 1.4 Invalid product ID rejected with HTTP 400');

  // 1.5 Invalid quantities (0, -1, 9999) rejected
  for (const badQty of [0, -1, 9999]) {
    const resBadQty = await invokeHandler(ordersHandler, {
      method: 'POST',
      body: {
        idempotencyKey: `s1_bad_qty_${badQty}`,
        items: [{ productId: 'buoi-an', quantity: badQty }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'bank',
      },
    });
    assert.strictEqual(resBadQty.status, 400);
  }
  console.log('  ✓ 1.5 Invalid quantities (0, -1, 9999) rejected with HTTP 400\n');

  // ==========================================================================
  // SUITE 2 — DYNAMIC VIETQR VALIDATION & REAL BARCODE DECODING
  // ==========================================================================
  console.log('▶ SUITE 2: Dynamic VietQR Validation & Real Barcode Decoding');

  // Verify original static BIDV QR payload CRC
  const originalStaticPayload =
    '00020101021138540010A00000072701240006970418011089608267510208QRIBFTTA53037045802VN63042886';
  assert.strictEqual(
    computeCrc16CcittFalse(originalStaticPayload.slice(0, -4)),
    '2886',
    'CRC-16/CCITT-FALSE of original BIDV static QR must equal 2886'
  );

  for (const sample of [
    { code: 'MNH000000', amount: 180000 },
    { code: 'MNH000001', amount: 330000 },
    { code: 'MNH000123', amount: 600000 },
  ]) {
    const instr = buildOrderPaymentInstructions({
      orderCode: sample.code,
      amount: sample.amount,
    });
    const parsed = parseAndValidateVietQrPayload(instr.qrPayload, {
      amount: sample.amount,
      transferContent: sample.code,
    });
    assert.strictEqual(parsed.valid, true, `Invalid QR for ${sample.code}: ${parsed.errors.join(', ')}`);
    assert.strictEqual(parsed.pointOfInitiationMethod, '12');
    assert.strictEqual(parsed.bankBin, '970418');
    assert.strictEqual(parsed.accountNo, '8960826751');
    assert.strictEqual(parsed.serviceCode, 'QRIBFTTA');
    assert.strictEqual(parsed.currencyCode, '704');
    assert.strictEqual(parsed.countryCode, 'VN');
    assert.strictEqual(parsed.amount, sample.amount);
    assert.strictEqual(parsed.transferContent, sample.code);
    assert.strictEqual(parsed.crcProvided, parsed.crcComputed);
  }
  console.log('  ✓ 2.1 Dynamic EMVCo/NAPAS247 payloads validated for MNH000000, MNH000001, MNH000123');

  // Decode rendered SVG QR via macOS sips + Swift Vision framework
  const svgStr = renderQrSvgString(
    buildVietQrPayload({ amount: 180000, transferContent: 'MNH000000' })
  );
  const tmpSvg = '/tmp/mnh-v16-suite2.svg';
  const tmpPng = '/tmp/mnh-v16-suite2.png';
  fs.writeFileSync(tmpSvg, svgStr, 'utf8');
  execSync(`sips -s format png ${tmpSvg} --out ${tmpPng} >/dev/null 2>&1`);
  const decodedByVision = execSync(
    `swift -e 'import Foundation; import Vision; import AppKit; let url = URL(fileURLWithPath: "${tmpPng}"); guard let img = NSImage(contentsOf: url), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }; let req = VNDetectBarcodesRequest(); let h = VNImageRequestHandler(cgImage: cg, options: [:]); try! h.perform([req]); print(req.results?.first?.payloadStringValue ?? "")'`
  )
    .toString()
    .trim();
  const expectedPayload = buildVietQrPayload({ amount: 180000, transferContent: 'MNH000000' });
  assert.strictEqual(decodedByVision, expectedPayload);
  console.log('  ✓ 2.2 Rendered QR SVG -> PNG decoded by macOS Vision barcode scanner matches 100%\n');

  // ==========================================================================
  // SUITE 3 — SEQUENTIAL ORDER CODE, CONCURRENCY & EXHAUSTION
  // ==========================================================================
  console.log('▶ SUITE 3: Sequential Order Code, Concurrency & Exhaustion');
  const legacyOrder = {
    id: 'legacy_doc_1',
    orderCode: 'MNH-963869-1362',
    customer: VALID_CUSTOMER,
    items: [{ productId: 'buoi-an', productName: 'Trà Hương Bưởi – AN', price: 150000, quantity: 1 }],
    subtotal: 150000,
    shippingFee: 30000,
    discount: 0,
    total: 180000,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'preparing',
    createdAt: '2026-11-01T00:00:00.000Z',
  };
  resetLocalStore([legacyOrder], 0);

  // First order must be MNH000000, then MNH000001, MNH000002
  const seq0 = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_0',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const seq1 = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_1',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const seq2 = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_2',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(seq0.body.order.orderCode, 'MNH000000');
  assert.strictEqual(seq1.body.order.orderCode, 'MNH000001');
  assert.strictEqual(seq2.body.order.orderCode, 'MNH000002');
  console.log('  ✓ 3.1 Sequential order codes start at MNH000000 -> MNH000001 -> MNH000002');

  // 10 concurrent order creation requests -> 10 unique sequential codes (MNH000003..MNH000012)
  const concurrentPromises = Array.from({ length: 10 }, (_, idx) =>
    invokeHandler(ordersHandler, {
      method: 'POST',
      body: {
        idempotencyKey: `s3_concurrent_${idx}`,
        items: [{ productId: 'buoi-an', quantity: 1 }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'bank',
      },
    })
  );
  const concurrentResults = await Promise.all(concurrentPromises);
  const allocatedCodes = concurrentResults.map((r) => r.body.order.orderCode).sort();
  const uniqueCodes = new Set(allocatedCodes);
  assert.strictEqual(uniqueCodes.size, 10, 'All 10 concurrent orders must receive unique orderCodes');
  assert.deepStrictEqual(allocatedCodes, [
    'MNH000003',
    'MNH000004',
    'MNH000005',
    'MNH000006',
    'MNH000007',
    'MNH000008',
    'MNH000009',
    'MNH000010',
    'MNH000011',
    'MNH000012',
  ]);
  console.log('  ✓ 3.2 10 concurrent requests produced 10 unique sequential codes (MNH000003..MNH000012)');

  // Idempotent retry must NOT increment counter
  const retrySeq0 = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_0',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(retrySeq0.status, 200);
  assert.strictEqual(retrySeq0.body.duplicate, true);
  assert.strictEqual(retrySeq0.body.order.orderCode, 'MNH000000');
  const nextCounterAfterRetry = JSON.parse(fs.readFileSync(TEST_COUNTER_PATH, 'utf8')).nextSeq;
  assert.strictEqual(nextCounterAfterRetry, 13, 'Idempotent retry must not advance counter');
  console.log('  ✓ 3.3 Idempotent retry returned MNH000000 without incrementing counter');

  // Verify legacy order MNH-963869-1362 still preserved
  const storedOrders = JSON.parse(fs.readFileSync(TEST_STORE_PATH, 'utf8'));
  assert(storedOrders.some((o: any) => o.orderCode === 'MNH-963869-1362'));
  console.log('  ✓ 3.4 Legacy order MNH-963869-1362 preserved intact');

  // Counter exhaustion test: nextSeq = 999999 -> MNH999999 succeeds, next fails with 503 ORDER_CODE_EXHAUSTED
  fs.writeFileSync(TEST_COUNTER_PATH, JSON.stringify({ nextSeq: 999999 }, null, 2), 'utf8');
  const seqMax = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_max_999999',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(seqMax.status, 201);
  assert.strictEqual(seqMax.body.order.orderCode, 'MNH999999');

  const seqOverflow = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's3_seq_overflow_1000000',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(seqOverflow.status, 503);
  assert.strictEqual(seqOverflow.body.code, 'ORDER_CODE_EXHAUSTED');
  console.log('  ✓ 3.5 Counter exhaustion at MNH999999 fails safely with 503 ORDER_CODE_EXHAUSTED (no wrap-around)\n');

  // ==========================================================================
  // SUITE 4 — CRASH-SAFE RECOVERY & SECURITY
  // ==========================================================================
  console.log('▶ SUITE 4: Crash-Safe Recovery & Security');
  resetLocalStore([], 0);

  // Create guest VietQR order
  const guestOrderRes = await invokeHandler(ordersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_anon_uid_guest123' },
    body: {
      idempotencyKey: 's4_guest_order_1',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  assert.strictEqual(guestOrderRes.status, 201);
  const guestOrder = guestOrderRes.body.order;
  const guestToken = guestOrderRes.body.recoveryToken;
  assert(guestToken && guestToken.length === 64, 'Must return 64-hex-char cryptographic recoveryToken');

  // Ensure raw stored document only has recoveryTokenHash, never cleartext recoveryToken
  const rawStored = JSON.parse(fs.readFileSync(TEST_STORE_PATH, 'utf8'))[0];
  assert(rawStored.recoveryTokenHash && rawStored.recoveryTokenHash.length === 64);
  assert.strictEqual(rawStored.recoveryToken, undefined, 'Cleartext recoveryToken must never be stored in DB');
  console.log('  ✓ 4.1 Guest order created with SHA-256 hashed recoveryToken in DB');

  // 4.2 Reload / recover via valid recoveryToken
  const recoverOk = await invokeHandler(ordersHandler, {
    method: 'GET',
    query: { orderId: guestOrder.id, token: guestToken },
  });
  assert.strictEqual(recoverOk.status, 200);
  assert.strictEqual(recoverOk.body.order.orderCode, 'MNH000000');
  assert.strictEqual(recoverOk.body.order.paymentInstructions.transferContent, 'MNH000000');
  console.log('  ✓ 4.2 Guest order recovered via valid cryptographic token');

  // 4.3 Forged token rejected with 403
  const recoverForged = await invokeHandler(ordersHandler, {
    method: 'GET',
    query: { orderId: guestOrder.id, token: 'a'.repeat(64) },
  });
  assert.strictEqual(recoverForged.status, 403);
  console.log('  ✓ 4.3 Forged recovery token rejected with HTTP 403');

  // 4.4 Predictable orderCode alone rejected with 403
  const recoverByCodeOnly = await invokeHandler(ordersHandler, {
    method: 'GET',
    query: { orderCode: 'MNH000000' },
  });
  assert.strictEqual(recoverByCodeOnly.status, 403);
  assert.strictEqual(recoverByCodeOnly.body.code, 'ORDER_CODE_LOOKUP_FORBIDDEN');
  console.log('  ✓ 4.4 Predictable orderCode-only lookup rejected with HTTP 403');

  // 4.5 Expired token rejected with 403
  const storeForExpiry = JSON.parse(fs.readFileSync(TEST_STORE_PATH, 'utf8'));
  storeForExpiry[0].recoveryTokenExpiresAt = '2020-01-01T00:00:00.000Z';
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify(storeForExpiry, null, 2), 'utf8');
  const recoverExpired = await invokeHandler(ordersHandler, {
    method: 'GET',
    query: { orderId: guestOrder.id, token: guestToken },
  });
  assert.strictEqual(recoverExpired.status, 403);
  // Restore valid expiry via idempotent retry (rotates token)
  const retryRotate = await invokeHandler(ordersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_anon_uid_guest123' },
    body: {
      idempotencyKey: 's4_guest_order_1',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const rotatedToken = retryRotate.body.recoveryToken;
  assert(rotatedToken && rotatedToken !== guestToken);
  console.log('  ✓ 4.5 Expired token rejected with 403; timeout retry rotates fresh recoveryToken');

  // 4.6 Guest-to-registered account linking
  const linkRes = await invokeHandler(meOrdersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_token_uid_registered_1' },
    body: {
      action: 'link_guest_order',
      orderId: guestOrder.id,
      recoveryToken: rotatedToken,
    },
  });
  assert.strictEqual(linkRes.status, 200);
  assert.strictEqual(linkRes.body.order.userId, 'registered_1');

  // Registered user can now fetch order via GET /api/me/orders and GET /api/orders without recoveryToken
  const myOrdersRes = await invokeHandler(meOrdersHandler, {
    method: 'GET',
    headers: { Authorization: 'Bearer test_token_uid_registered_1' },
  });
  assert.strictEqual(myOrdersRes.status, 200);
  assert.strictEqual(myOrdersRes.body.orders.length, 1);
  assert.strictEqual(myOrdersRes.body.orders[0].orderCode, 'MNH000000');
  console.log('  ✓ 4.6 Guest order linked to registered account and visible in /api/me/orders\n');

  // ==========================================================================
  // SUITE 5 — PAYMENT AUTHORIZATION & STATE MACHINE
  // ==========================================================================
  console.log('▶ SUITE 5: Payment Authorization & State Machine');
  clearCapturedTestEmails();

  // 5.1 Customer clicks "Tôi đã chuyển khoản" -> transitions pending_payment -> customer_reported_paid (NEVER paid)
  const reportRes1 = await invokeHandler(ordersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_token_uid_registered_1' },
    body: {
      action: 'report_transfer',
      orderId: guestOrder.id,
    },
  });
  assert.strictEqual(reportRes1.status, 200);
  assert.strictEqual(reportRes1.body.order.paymentStatus, 'customer_reported_paid');
  assert(reportRes1.body.order.customerReportedAt);
  assert.strictEqual(
    reportRes1.body.message,
    'Đã ghi nhận thông báo chuyển khoản của bạn. Mộc Ngôn Hương sẽ kiểm tra giao dịch và xác nhận thanh toán.'
  );
  console.log('  ✓ 5.1 "Tôi đã chuyển khoản" transitions pending_payment -> customer_reported_paid (never paid)');

  // 5.2 Repeated click on "Tôi đã chuyển khoản" is idempotent
  const firstReportedAt = reportRes1.body.order.customerReportedAt;
  const reportRes2 = await invokeHandler(ordersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_token_uid_registered_1' },
    body: {
      action: 'report_transfer',
      orderId: guestOrder.id,
    },
  });
  assert.strictEqual(reportRes2.status, 200);
  assert.strictEqual(reportRes2.body.order.paymentStatus, 'customer_reported_paid');
  assert.strictEqual(reportRes2.body.order.customerReportedAt, firstReportedAt);
  console.log('  ✓ 5.2 Repeated "Tôi đã chuyển khoản" is idempotent and preserves timestamp');

  // 5.3 Another user cannot report transfer on someone else's order -> 403
  const crossUserReport = await invokeHandler(ordersHandler, {
    method: 'POST',
    headers: { Authorization: 'Bearer test_token_uid_attacker_99' },
    body: {
      action: 'report_transfer',
      orderId: guestOrder.id,
    },
  });
  assert.strictEqual(crossUserReport.status, 403);
  console.log('  ✓ 5.3 Cross-user transfer report rejected with HTTP 403');

  // 5.4 Non-admin user cannot confirm payment -> 403
  const nonAdminConfirm = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_registered_1' },
    body: {
      orderId: guestOrder.id,
      action: 'confirm_payment',
      paymentStatus: 'paid',
    },
  });
  assert.strictEqual(nonAdminConfirm.status, 403);
  console.log('  ✓ 5.4 Non-admin payment confirmation rejected with HTTP 403');

  // 5.5 Authorized Admin confirms payment -> paid + audit trail
  const adminConfirm1 = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: {
      orderId: guestOrder.id,
      action: 'confirm_payment',
      paymentStatus: 'paid',
      transactionRef: 'BIDV-FT-99887766',
    },
  });
  assert.strictEqual(adminConfirm1.status, 200);
  assert.strictEqual(adminConfirm1.body.order.paymentStatus, 'paid');
  assert(adminConfirm1.body.order.paymentConfirmedAt);
  assert.strictEqual(adminConfirm1.body.order.paymentConfirmedBy, 'boss1');
  assert.strictEqual(adminConfirm1.body.order.bankTransactionRef, 'BIDV-FT-99887766');
  console.log('  ✓ 5.5 Authorized admin confirmed payment -> paid with timestamp, admin UID & bankTransactionRef');

  // 5.6 Cancelled order cannot be confirmed paid unless moved to payment_review first
  const cancelledOrderRes = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's5_cancelled_order',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const cancelledOrderId = cancelledOrderRes.body.order.id;
  await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: { orderId: cancelledOrderId, status: 'cancelled' },
  });
  const confirmCancelledBlocked = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: { orderId: cancelledOrderId, action: 'confirm_payment', paymentStatus: 'paid' },
  });
  assert.strictEqual(confirmCancelledBlocked.status, 409);
  assert.strictEqual(confirmCancelledBlocked.body.code, 'ORDER_CANCELLED_PAYMENT_BLOCKED');

  // Move to payment_review -> then confirm_payment succeeds
  await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: { orderId: cancelledOrderId, paymentStatus: 'payment_review' },
  });
  const confirmAfterReview = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: { orderId: cancelledOrderId, action: 'confirm_payment', paymentStatus: 'paid' },
  });
  assert.strictEqual(confirmAfterReview.status, 200);
  assert.strictEqual(confirmAfterReview.body.order.paymentStatus, 'paid');
  console.log('  ✓ 5.6 Cancelled order payment blocked (409) until moved to payment_review\n');

  // ==========================================================================
  // SUITE 6 — RESEND EMAIL AUTOMATION (EMAIL A & EMAIL B)
  // ==========================================================================
  console.log('▶ SUITE 6: Resend Email Automation (Email A & Email B)');
  resetLocalStore([], 0);
  clearCapturedTestEmails();

  // 6.1 Order Creation triggers Email A ONLY (never Email B)
  const emailOrderRes = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's6_email_order_1',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const emailOrder = emailOrderRes.body.order;
  const emailOrderToken = emailOrderRes.body.recoveryToken;
  const capturedAfterCreate = getCapturedTestEmails();
  const customerEmailsAfterCreate = capturedAfterCreate.filter((e: any) =>
    e.to.includes(VALID_CUSTOMER.email)
  );
  assert.strictEqual(
    customerEmailsAfterCreate.length,
    1,
    'Exactly 1 customer email (Email A) must be sent on order creation'
  );
  const emailA = customerEmailsAfterCreate[0];
  assert.strictEqual(emailA.subject, `Mộc Ngôn Hương — Đặt hàng thành công | ${emailOrder.orderCode}`);
  assert(emailA.html.includes('Chờ thanh toán'), 'Email A must state waiting for payment');
  assert(!emailA.html.includes('Xác nhận thanh toán thành công'), 'Email A must never claim payment is confirmed');
  assert(emailA.html.includes('8960826751'), 'Email A must include BIDV account number');
  assert(emailA.html.includes(emailOrder.orderCode), 'Email A must include exact transfer content');
  assert(emailA.html.includes(`orderId=${encodeURIComponent(emailOrder.id)}`), 'Email A must include recovery link');
  console.log('  ✓ 6.1 Email A sent on order creation with exact subject, VietQR instructions & recovery link');

  // 6.2 Customer clicking "Tôi đã chuyển khoản" does NOT send Email B
  clearCapturedTestEmails();
  await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      action: 'report_transfer',
      orderId: emailOrder.id,
      recoveryToken: emailOrderToken,
    },
  });
  assert.strictEqual(
    getCapturedTestEmails().length,
    0,
    'Customer reporting transfer must NEVER trigger Email B'
  );
  console.log('  ✓ 6.2 Customer "Tôi đã chuyển khoản" does NOT trigger Email B');

  // 6.3 Admin confirming payment triggers Email B with exact required subject and content
  const adminConfirmEmailRes = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: {
      orderId: emailOrder.id,
      action: 'confirm_payment',
      paymentStatus: 'paid',
    },
  });
  assert.strictEqual(adminConfirmEmailRes.status, 200);
  const capturedAfterAdmin = getCapturedTestEmails();
  assert.strictEqual(capturedAfterAdmin.length, 1, 'Admin confirmation must trigger Email B');
  const emailB = capturedAfterAdmin[0];
  assert.strictEqual(
    emailB.subject,
    `Mộc Ngôn Hương — Xác nhận thanh toán thành công | ${emailOrder.orderCode}`
  );
  assert(
    emailB.html.includes(
      'Mộc Ngôn Hương đã xác nhận khoản thanh toán cho đơn hàng của bạn. Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm của chúng tôi.'
    ),
    'Email B must contain exact required confirmation message'
  );
  console.log('  ✓ 6.3 Admin payment confirmation triggered Email B with exact subject and confirmation copy');

  // 6.4 Repeated admin confirmation does NOT send duplicate Email B
  clearCapturedTestEmails();
  const adminRepeatRes = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: {
      orderId: emailOrder.id,
      action: 'confirm_payment',
      paymentStatus: 'paid',
    },
  });
  assert.strictEqual(adminRepeatRes.status, 200);
  assert.strictEqual(
    getCapturedTestEmails().length,
    0,
    'Repeated admin confirmation must NOT send duplicate Email B'
  );
  console.log('  ✓ 6.4 Repeated admin confirmation is idempotent and sends 0 duplicate emails');

  // 6.5 Transient email failure does NOT roll back payment confirmation, and retry_payment_email succeeds
  const emailOrder2Res = await invokeHandler(ordersHandler, {
    method: 'POST',
    body: {
      idempotencyKey: 's6_email_order_2_transient',
      items: [{ productId: 'buoi-an', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'bank',
    },
  });
  const emailOrder2 = emailOrder2Res.body.order;
  clearCapturedTestEmails();
  process.env.MNH_SIMULATE_EMAIL_FAILURE = '1';
  const adminConfirmTransient = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: {
      orderId: emailOrder2.id,
      action: 'confirm_payment',
      paymentStatus: 'paid',
    },
  });
  assert.strictEqual(adminConfirmTransient.status, 200);
  assert.strictEqual(adminConfirmTransient.body.order.paymentStatus, 'paid');
  assert.strictEqual(adminConfirmTransient.body.emailResult.sent, false);

  delete process.env.MNH_SIMULATE_EMAIL_FAILURE;
  const retryEmailRes = await invokeHandler(adminOrdersHandler, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer test_token_uid_boss1' },
    body: {
      orderId: emailOrder2.id,
      action: 'retry_payment_email',
    },
  });
  assert.strictEqual(retryEmailRes.status, 200);
  assert.strictEqual(retryEmailRes.body.emailResult.sent, true);
  assert.strictEqual(getCapturedTestEmails().length, 1);
  console.log('  ✓ 6.5 Transient email failure preserves paid state and retry_payment_email delivers Email B\n');

  // Cleanup temp files
  try {
    fs.unlinkSync(TEST_STORE_PATH);
    fs.unlinkSync(TEST_COUNTER_PATH);
    fs.unlinkSync(tmpSvg);
    fs.unlinkSync(tmpPng);
  } catch {
    // ignore
  }

  console.log('========================================================================');
  console.log('ALL SUITES 1–6 PASSED 100% WITHOUT ERRORS');
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('V16.0 Test Suite failed:', err);
  process.exit(1);
});

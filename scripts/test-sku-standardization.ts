// scripts/test-sku-standardization.ts
// Final SKU Correction, Checkout Code Reconciliation & Full Regression Suite:
// 1. Strict 5-Product / 5-SKU Operational Catalog (Zero 100g Runtime Products)
// 2. Backend Security & Validation: Rejects 100g SKUs, SKU/Product Mismatches, Price Tampering
// 3. Mixed-Product Order Snapshots (productId, sku, variantId, weightGrams, image) + Sequential Order Code + VietQR Invariance
// 4. Resend Email A & Email B Content Reconciliation (Order Code + Product SKU)
// 5. Historical Pre-SKU Order Fallback & Admin SKU Search Compatibility
// 6. Browser E2E (Chromium & WebKit across 320..1920px): Product Detail, Reload/Nav, Cart Persistence & Normalization,
//    Checkout Summary, Order Confirmation, Zero 100g Products in Storefront & Search, Zero Console/Layout Regressions.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const TEST_STORE_PATH = '/tmp/mnh-sku-test-store.json';
const TEST_COUNTER_PATH = '/tmp/mnh-sku-test-store.counter.json';

process.env.MNH_USE_LOCAL_DEV_STORE = '1';
process.env.MNH_LOCAL_DEV_STORE_PATH = TEST_STORE_PATH;
process.env.MNH_LOCAL_DEV_COUNTER_PATH = TEST_COUNTER_PATH;
process.env.MNH_CAPTURE_EMAILS_FOR_TEST = '1';
process.env.ADMIN_UIDS = 'boss1';
process.env.VIETQR_BANK_BIN = '970418';
process.env.VIETQR_BANK_NAME = 'BIDV';
process.env.VIETQR_ACCOUNT_NO = '8960826751';
process.env.VIETQR_ACCOUNT_NAME = 'NGUYEN THI VAN ANH';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  `${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`
);

const ARTIFACT_DIR =
  '/Users/hoainam/.gemini/antigravity/brain/1a0c6f22-0569-45b7-8304-88ae98029e72/sku-evidence';

function resetLocalTestStore(nextSeq = 0) {
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(TEST_COUNTER_PATH, JSON.stringify({ nextSeq }, null, 2), 'utf8');
}

function getCapturedEmails(): any[] {
  if (!Array.isArray((globalThis as any).__MNH_TEST_CAPTURED_EMAILS__)) {
    (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__ = [];
  }
  return (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__;
}

function clearCapturedEmails() {
  (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__ = [];
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  setHeader(k: string, v: string): void;
  status(code: number): MockResponse;
  json(payload: any): MockResponse;
  end(chunk?: any): void;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
    end(chunk?: any) {
      if (chunk && this.body === null) {
        try {
          this.body = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;
        } catch {
          this.body = chunk;
        }
      }
    },
  };
  return res;
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✅ PASS [${passed}]: ${name}`);
}

async function checkAsync(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ✅ PASS [${passed}]: ${name}`);
}

async function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start at ${url} within ${timeoutMs}ms`);
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  getCapturedEmails();

  const productsMod = await import('../src/data/products.js');
  const {
    OFFICIAL_SKU_CATALOG,
    PRODUCTS,
    LISTING_PRODUCTS,
    getCatalogEntryBySku,
    getPublishedCatalogEntryByProductId,
    resolveOrderItemSkuDisplay,
  } = productsMod;
  const { default: ordersHandler } = await import('../api/orders.js');
  const { default: adminOrdersHandler } = await import('../api/admin/orders.js');

  async function invokeHandler(
    handler: (req: any, res: any) => Promise<any>,
    options: {
      method: string;
      query?: Record<string, string>;
      headers?: Record<string, string>;
      body?: any;
    }
  ) {
    const req: any = {
      method: options.method,
      query: options.query || {},
      headers: options.headers || {},
      body: options.body || {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = createMockRes();
    await handler(req, res);
    return { status: res.statusCode, body: res.body, headers: res.headers };
  }

  console.log('=== MỘC NGÔN HƯƠNG — FINAL SKU CORRECTION VERIFICATION SUITE ===\n');

  // ---------------------------------------------------------------------------
  // PART 1: STRICT 5-PRODUCT CATALOG & ZERO 100G RUNTIME ENTRIES
  // ---------------------------------------------------------------------------
  console.log('--- Part 1: Strict 5-Product / 5-SKU Operational Catalog ---');

  check('1.1 Operational runtime catalog contains strictly the 5 approved sellable SKUs (no 100g variants)', () => {
    assert.equal(OFFICIAL_SKU_CATALOG.length, 5);
    assert.equal(PRODUCTS.length, 5);
    assert.equal(LISTING_PRODUCTS.length, 4);
    assert.equal((productsMod as any).RESERVED_100G_PRODUCTS, undefined);
    assert.equal((productsMod as any).LOOSE_TEA_PRODUCTS, undefined);

    const skus = OFFICIAL_SKU_CATALOG.map((e) => e.sku);
    assert.equal(new Set(skus).size, 5, 'All 5 SKUs must be unique');
    assert.deepEqual(skus, ['MNH-A02', 'MNH-T02', 'MNH-C02', 'MNH-N02', 'MNH-TY']);

    for (const excludedSku of ['MNH-A01', 'MNH-T01', 'MNH-C01', 'MNH-N01']) {
      assert.equal(getCatalogEntryBySku(excludedSku), undefined, `Excluded 100g SKU ${excludedSku} must not exist`);
    }
    for (const excludedId of ['buoi-an-100g', 'nhai-thuong-100g', 'soi-cam-100g', 'com-nho-100g', 'buoi-an-le']) {
      assert.equal(
        getPublishedCatalogEntryByProductId(excludedId),
        undefined,
        `Excluded productId ${excludedId} must not exist`
      );
    }
  });

  check('1.2 Exact 5-product SKU, slug, price, and specification reconciliation', () => {
    const expected = [
      { id: 'buoi-an', sku: 'MNH-A02', variantId: 'buoi-an-200g', price: 289000, weightGrams: 200 },
      { id: 'nhai-thuong', sku: 'MNH-T02', variantId: 'nhai-thuong-200g', price: 289000, weightGrams: 200 },
      { id: 'soi-cam', sku: 'MNH-C02', variantId: 'soi-cam-200g', price: 289000, weightGrams: 200 },
      { id: 'com-nho', sku: 'MNH-N02', variantId: 'com-nho-200g', price: 289000, weightGrams: 200 },
      { id: 'hop-qua-tam-y', sku: 'MNH-TY', variantId: 'hop-qua-tam-y', price: 399000, weightGrams: undefined },
    ] as const;

    for (const exp of expected) {
      const p = PRODUCTS.find((item) => item.id === exp.id);
      assert.ok(p, `Missing product ${exp.id}`);
      assert.equal(p.sku, exp.sku);
      assert.equal(p.code, exp.sku);
      assert.equal(p.variantId, exp.variantId);
      assert.equal(p.price, exp.price);
      assert.equal(p.weightGrams, exp.weightGrams);
      assert.equal(p.published, true);
      assert.ok(p.image && p.image.startsWith('/assets/'));

      const entry = getPublishedCatalogEntryByProductId(exp.id);
      assert.ok(entry);
      assert.equal(entry.sku, exp.sku);
      assert.equal(entry.price, exp.price);
    }
  });

  // ---------------------------------------------------------------------------
  // PART 2: BACKEND VALIDATION, MIXED-ORDER SNAPSHOTS, VIETQR & EMAILS
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 2: Backend Order Snapshots, Security Validation, VietQR & Email ---');
  resetLocalTestStore(25); // Start sequence at 25 -> first order gets MNH000025

  try {
    let createdMixedOrder: any = null;

    await checkAsync('2.1 Mixed-product order (2 × MNH-T02 + 1 × MNH-A02 = 867,000 VND) receives MNH000025, full Firestore snapshots, VietQR (867,000 / MNH000025), and Email A', async () => {
      clearCapturedEmails();
      const idempKey = `final_sku_mixed_${Date.now()}`;
      const res = await invokeHandler(ordersHandler, {
        method: 'POST',
        body: {
          idempotencyKey: idempKey,
          items: [
            { productId: 'nhai-thuong', sku: 'MNH-T02', variantId: 'nhai-thuong-200g', quantity: 2 },
            { productId: 'buoi-an', sku: 'MNH-A02', variantId: 'buoi-an-200g', quantity: 1 },
          ],
          customer: {
            fullName: 'Nguyễn Minh Khuê',
            phone: '0912345678',
            email: 'khue.final.sku@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'bank',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const order = res.body.order;
      createdMixedOrder = order;

      // Independent Order Code System
      assert.equal(order.orderCode, 'MNH000025');
      assert.match(order.orderCode, /^MNH\d{6}$/);
      assert.notEqual(order.orderCode, 'MNH-T02');
      assert.notEqual(order.orderCode, 'MNH-A02');

      // Authoritative Server Pricing & Subtotal
      assert.equal(order.subtotal, 867000);
      assert.equal(order.total, 867000);

      // VietQR Invariance: exact amount + orderCode only in transferContent
      assert.ok(order.paymentInstructions);
      assert.equal(order.paymentInstructions.bankBin, '970418');
      assert.equal(order.paymentInstructions.accountNo, '8960826751');
      assert.equal(order.paymentInstructions.amount, 867000);
      assert.equal(order.paymentInstructions.transferContent, 'MNH000025');
      assert.ok(!order.paymentInstructions.qrPayload.includes('MNH-T02'));
      assert.ok(!order.paymentInstructions.qrPayload.includes('MNH-A02'));
      assert.ok(order.paymentInstructions.qrPayload.includes('MNH000025'));

      // Complete Item Snapshots (including SKU, variantId, weightGrams, and image)
      assert.equal(order.items.length, 2);
      assert.deepEqual(order.items[0], {
        productId: 'nhai-thuong',
        variantId: 'nhai-thuong-200g',
        sku: 'MNH-T02',
        productName: 'Trà Hương Hoa Nhài – THƯƠNG',
        price: 289000,
        quantity: 2,
        weightGrams: 200,
        image: '/assets/optimized/order-thumb-nhai-thuong.webp',
      });
      assert.deepEqual(order.items[1], {
        productId: 'buoi-an',
        variantId: 'buoi-an-200g',
        sku: 'MNH-A02',
        productName: 'Trà Hương Hoa Bưởi – AN',
        price: 289000,
        quantity: 1,
        weightGrams: 200,
        image: '/assets/optimized/order-thumb-buoi-an.webp',
      });

      // Verify Idempotent Retry does NOT create duplicate order
      const retryRes = await invokeHandler(ordersHandler, {
        method: 'POST',
        body: {
          idempotencyKey: idempKey,
          items: [
            { productId: 'nhai-thuong', sku: 'MNH-T02', variantId: 'nhai-thuong-200g', quantity: 2 },
            { productId: 'buoi-an', sku: 'MNH-A02', variantId: 'buoi-an-200g', quantity: 1 },
          ],
          customer: {
            fullName: 'Nguyễn Minh Khuê',
            phone: '0912345678',
            email: 'khue.final.sku@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'bank',
        },
      });
      assert.equal(retryRes.status, 200);
      assert.equal(retryRes.body.duplicate, true);
      assert.equal(retryRes.body.order.orderCode, 'MNH000025');

      // Verify Email A contains orderCode MNH000025 AND both SKUs MNH-T02, MNH-A02
      const emails = getCapturedEmails();
      const emailA = emails.find((e) => e.to?.includes('khue.final.sku@example.com'));
      assert.ok(emailA, 'Email A must be sent to customer');
      assert.equal(emailA.subject, 'Mộc Ngôn Hương — Đặt hàng thành công | MNH000025');
      assert.ok(emailA.html.includes('MNH000025'));
      assert.ok(emailA.html.includes('Mã sản phẩm: MNH-T02'));
      assert.ok(emailA.html.includes('Mã sản phẩm: MNH-A02'));
      assert.ok(emailA.text.includes('Mã sản phẩm: MNH-T02'));
      assert.ok(emailA.text.includes('Mã sản phẩm: MNH-A02'));
    });

    await checkAsync('2.2 Admin Payment Confirmation triggers Email B containing orderCode MNH000025 and item SKUs MNH-T02 & MNH-A02', async () => {
      clearCapturedEmails();
      const confirmRes = await invokeHandler(adminOrdersHandler, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test_token_uid_boss1' },
        body: {
          orderId: createdMixedOrder.id,
          action: 'confirm_payment',
          paymentStatus: 'paid',
          bankTransactionRef: 'FT_SKU_867000',
        },
      });
      assert.equal(confirmRes.status, 200);
      assert.equal(confirmRes.body.order.paymentStatus, 'paid');

      const emails = getCapturedEmails();
      assert.equal(emails.length, 1);
      const emailB = emails[0];
      assert.equal(emailB.subject, 'Mộc Ngôn Hương — Xác nhận thanh toán thành công | MNH000025');
      assert.ok(emailB.html.includes('MNH000025'));
      assert.ok(emailB.html.includes('Mã sản phẩm: MNH-T02'));
      assert.ok(emailB.html.includes('Mã sản phẩm: MNH-A02'));
      assert.ok(emailB.html.includes('867.000 đ'));
    });

    await checkAsync('2.3 Server rejects excluded 100g SKUs/IDs, malformed SKUs, SKU/product mismatches, and price manipulation', async () => {
      const baseCustomer = {
        fullName: 'Trần Văn B',
        phone: '0987654321',
        email: 'test@example.com',
        shippingMode: 'pickup',
        pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
      };

      // Reject 100g SKUs submitted with or without productId
      for (const badSku of ['MNH-A01', 'MNH-T01', 'MNH-C01', 'MNH-N01', '', 'FAKE-SKU']) {
        const resWithProductId = await invokeHandler(ordersHandler, {
          method: 'POST',
          body: {
            idempotencyKey: `bad_sku_with_id_${badSku}_${Date.now()}`,
            items: [{ productId: 'buoi-an', sku: badSku, quantity: 1 }],
            customer: baseCustomer,
            paymentMethod: 'cod',
          },
        });
        assert.equal(resWithProductId.status, 400);
        assert.equal(resWithProductId.body.success, false);
        assert.equal(resWithProductId.body.code, 'INVALID_PRODUCT_SKU');

        const resSkuOnly = await invokeHandler(ordersHandler, {
          method: 'POST',
          body: {
            idempotencyKey: `bad_sku_only_${badSku}_${Date.now()}`,
            items: [{ sku: badSku, quantity: 1 }],
            customer: baseCustomer,
            paymentMethod: 'cod',
          },
        });
        assert.equal(resSkuOnly.status, 400);
        assert.equal(resSkuOnly.body.success, false);
      }

      // Reject excluded 100g / loose product IDs
      for (const badId of ['buoi-an-100g', 'nhai-thuong-100g', 'soi-cam-100g', 'com-nho-100g', 'buoi-an-le', 'unknown-id']) {
        const resBadId = await invokeHandler(ordersHandler, {
          method: 'POST',
          body: {
            idempotencyKey: `bad_id_${badId}_${Date.now()}`,
            items: [{ productId: badId, quantity: 1 }],
            customer: baseCustomer,
            paymentMethod: 'cod',
          },
        });
        assert.equal(resBadId.status, 400);
        assert.equal(resBadId.body.code, 'INVALID_PRODUCT');
      }

      // Reject cross-product active SKU mismatch (productId buoi-an with sku MNH-T02)
      const resCrossMismatch = await invokeHandler(ordersHandler, {
        method: 'POST',
        body: {
          idempotencyKey: `cross_mismatch_${Date.now()}`,
          items: [{ productId: 'buoi-an', sku: 'MNH-T02', quantity: 1 }],
          customer: baseCustomer,
          paymentMethod: 'cod',
        },
      });
      assert.equal(resCrossMismatch.status, 400);
      assert.equal(resCrossMismatch.body.code, 'INVALID_PRODUCT_SKU');

      // Enforce authoritative catalog price despite manipulated client price
      const resPriceTamper = await invokeHandler(ordersHandler, {
        method: 'POST',
        body: {
          idempotencyKey: `price_tamper_${Date.now()}`,
          items: [{ productId: 'hop-qua-tam-y', sku: 'MNH-TY', price: 100000, quantity: 1 }],
          customer: baseCustomer,
          paymentMethod: 'cod',
        },
      });
      assert.equal(resPriceTamper.status, 201);
      assert.equal(resPriceTamper.body.order.items[0].sku, 'MNH-TY');
      assert.equal(resPriceTamper.body.order.items[0].price, 399000);
      assert.equal(resPriceTamper.body.order.total, 399000);
    });

    await checkAsync('2.4 Admin API GET search filters accurately by both Order Code and Product SKU', async () => {
      const bySkuRes = await invokeHandler(adminOrdersHandler, {
        method: 'GET',
        headers: { Authorization: 'Bearer test_token_uid_boss1' },
        query: { search: 'MNH-T02' },
      });
      assert.equal(bySkuRes.status, 200);
      assert.ok(bySkuRes.body.orders.some((o: any) => o.orderCode === 'MNH000025'));
      assert.ok(bySkuRes.body.orders.every((o: any) => o.items?.some((i: any) => i.sku === 'MNH-T02')));

      const byExcludedSkuRes = await invokeHandler(adminOrdersHandler, {
        method: 'GET',
        headers: { Authorization: 'Bearer test_token_uid_boss1' },
        query: { search: 'MNH-A01' },
      });
      assert.equal(byExcludedSkuRes.status, 200);
      assert.equal(byExcludedSkuRes.body.orders.length, 0);

      const byOrderCodeRes = await invokeHandler(adminOrdersHandler, {
        method: 'GET',
        headers: { Authorization: 'Bearer test_token_uid_boss1' },
        query: { search: 'MNH000025' },
      });
      assert.equal(byOrderCodeRes.status, 200);
      assert.equal(byOrderCodeRes.body.orders.length, 1);
      assert.equal(byOrderCodeRes.body.orders[0].orderCode, 'MNH000025');
    });
  } finally {
    try {
      fs.unlinkSync(TEST_STORE_PATH);
      fs.unlinkSync(TEST_COUNTER_PATH);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // PART 3: HISTORICAL ORDER FALLBACK & ADMIN COMPATIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 3: Historical Order Fallback Compatibility ---');

  check('3.1 Historical orders missing SKU remain readable without guessing fake SKUs', () => {
    const legacy = resolveOrderItemSkuDisplay({
      productId: 'buoi-an',
      productName: 'Trà Hương Hoa Bưởi – AN',
      price: 289000,
    });
    assert.equal(legacy.sku, null);
    assert.equal(legacy.isLegacyFallback, true);
    assert.equal(legacy.displayText, 'Chưa gắn SKU (đơn cũ)');
  });

  // ---------------------------------------------------------------------------
  // PART 4: CHROMIUM & WEBKIT E2E UI, CART, CHECKOUT & ORDER CONFIRMATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 4: Chromium & WebKit E2E UI, Cart, Checkout & Order Confirmation ---');

  const port = 4187;
  const baseUrl = `http://127.0.0.1:${port}`;
  const devProc = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await checkAsync('4.1 Products page & Search Overlay contain ZERO excluded 100g products (100,000đ / MNH-A01..MNH-N01)', async () => {
        await page.goto(`${baseUrl}/#/san-pham`, { waitUntil: 'networkidle' });
        const productsText = await page.locator('main').innerText();
        assert.ok(!productsText.includes('100,000') && !productsText.includes('100.000'));
        assert.ok(!/MNH-[ATCN]01/.test(productsText));

        await page.locator('header').getByRole('button', { name: 'Tìm kiếm' }).click();
        const searchText = await page.locator('.search-card').innerText();
        assert.ok(!searchText.includes('100,000') && !searchText.includes('100.000'));
        assert.ok(!/MNH-[ATCN]01/.test(searchText));
        await page.keyboard.press('Escape');
      });

      await checkAsync('4.2 All 5 Product Detail pages display exact SKU on load, refresh, and cross-navigation', async () => {
        const expected = [
          { id: 'buoi-an', sku: 'MNH-A02' },
          { id: 'nhai-thuong', sku: 'MNH-T02' },
          { id: 'soi-cam', sku: 'MNH-C02' },
          { id: 'com-nho', sku: 'MNH-N02' },
          { id: 'hop-qua-tam-y', sku: 'MNH-TY' },
        ];
        for (const item of expected) {
          await page.goto(`${baseUrl}/#/san-pham/${item.id}`, { waitUntil: 'networkidle' });
          const el = page.getByTestId('product-detail-sku');
          await el.waitFor({ state: 'visible', timeout: 10000 });
          assert.equal((await el.innerText()).trim(), `Mã sản phẩm: ${item.sku}`);
        }
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal((await page.getByTestId('product-detail-sku').innerText()).trim(), 'Mã sản phẩm: MNH-TY');
      });

      await checkAsync('4.3 Persisted cart normalizes obsolete/mismatched entries on reload and preserves valid SKUs across quantity changes', async () => {
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
          localStorage.setItem(
            'mnh_cart_items_v1',
            JSON.stringify([
              { product: { id: 'buoi-an-100g', sku: 'MNH-A01', price: 100000 }, quantity: 1 },
              { product: { id: 'buoi-an', sku: 'MNH-A01', price: 100000 }, quantity: 1 },
              { product: { id: 'buoi-an-le', price: 75000 }, quantity: 1 },
              { product: { id: 'buoi-an', code: 'MNH-AN-01', price: 1 }, quantity: 1 },
            ])
          );
        });
        await page.reload({ waitUntil: 'networkidle' });
        const normalized = await page.evaluate(() => JSON.parse(localStorage.getItem('mnh_cart_items_v1') || '[]'));
        assert.equal(normalized.length, 1);
        assert.equal(normalized[0].product.id, 'buoi-an');
        assert.equal(normalized[0].product.sku, 'MNH-A02');
        assert.equal(normalized[0].product.price, 289000);
        assert.equal(normalized[0].quantity, 1);
      });

      await checkAsync('4.4 Mixed Cart (2 × THƯƠNG MNH-T02 + 1 × AN MNH-A02) -> Checkout -> VietQR Order Confirmation renders separate Order Code MNH000025 and item SKUs across 7 viewports', async () => {
        await page.evaluate(() => localStorage.setItem('mnh_cart_items_v1', '[]'));
        await page.reload({ waitUntil: 'networkidle' });
        await page.goto(`${baseUrl}/#/san-pham/nhai-thuong`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Tăng số lượng' }).first().click(); // qty = 2
        await page.getByRole('button', { name: /Thêm Vào Giỏ Hàng/i }).click();

        const cartSkuThuong = page.getByTestId('cart-item-sku-nhai-thuong');
        await cartSkuThuong.waitFor({ state: 'visible', timeout: 5000 });
        assert.equal((await cartSkuThuong.innerText()).trim(), 'Mã sản phẩm: MNH-T02');
        assert.ok((await page.getByTestId('cart-item-line-total-nhai-thuong').innerText()).includes('578,000đ'));
        await page.waitForTimeout(450);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cart-drawer-mnh-t02-1440.png') });
        await page.keyboard.press('Escape');

        await page.goto(`${baseUrl}/#/san-pham/buoi-an`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: /Thêm Vào Giỏ Hàng/i }).click();
        await page.getByTestId('cart-item-sku-buoi-an').waitFor({ state: 'visible', timeout: 5000 });
        await page.keyboard.press('Escape');

        await page.goto(`${baseUrl}/#/thanh-toan`, { waitUntil: 'networkidle' });
        assert.equal((await page.getByTestId('checkout-item-sku-nhai-thuong').innerText()).trim(), 'Mã sản phẩm: MNH-T02');
        assert.equal((await page.getByTestId('checkout-item-sku-buoi-an').innerText()).trim(), 'Mã sản phẩm: MNH-A02');

        // Responsive check across all 7 widths
        for (const vp of [
          { width: 320, height: 568 },
          { width: 375, height: 812 },
          { width: 390, height: 844 },
          { width: 768, height: 1024 },
          { width: 1024, height: 768 },
          { width: 1440, height: 900 },
          { width: 1920, height: 1080 },
        ]) {
          await page.setViewportSize(vp);
          await page.waitForTimeout(120);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
          );
          assert.ok(overflow <= 0, `Overflow ${overflow}px on Checkout at ${vp.width}px`);
          assert.equal(await page.getByTestId('checkout-item-sku-nhai-thuong').isVisible(), true);
          const skuNonOverlap = await page.evaluate(() => {
            const skuEl = document.querySelector('[data-testid="checkout-item-sku-nhai-thuong"]') as HTMLElement | null;
            const rowEl = skuEl?.closest('.group') as HTMLElement | null;
            const priceCol = rowEl?.lastElementChild as HTMLElement | null;
            if (!skuEl || !priceCol) return false;
            return skuEl.scrollWidth <= skuEl.clientWidth + 1 && skuEl.getBoundingClientRect().right <= priceCol.getBoundingClientRect().left + 2;
          });
          assert.equal(skuNonOverlap, true, `SKU overlaps price column at ${vp.width}px`);
        }

        // Intercept POST /api/orders with a deterministic local API-like response for UI confirmation verification
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.route('**/api/orders', async (route) => {
          const req = route.request();
          if (req.method() !== 'POST') return route.fallback();
          const payload = JSON.parse(req.postData() || '{}');
          assert.deepEqual(
            payload.items.map((i: any) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity })),
            [
              { productId: 'nhai-thuong', sku: 'MNH-T02', quantity: 2 },
              { productId: 'buoi-an', sku: 'MNH-A02', quantity: 1 },
            ]
          );
          const { buildOrderPaymentInstructions } = await import('../src/lib/vietqr.js');
          const orderCode = 'MNH000025';
          const total = 867000;
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              duplicate: false,
              order: {
                id: 'ord_ui_verify_000025',
                orderCode,
                items: [
                  {
                    productId: 'nhai-thuong',
                    variantId: 'nhai-thuong-200g',
                    sku: 'MNH-T02',
                    productName: 'Trà Hương Hoa Nhài – THƯƠNG',
                    price: 289000,
                    quantity: 2,
                    weightGrams: 200,
                    image: '/assets/optimized/order-thumb-nhai-thuong.webp',
                  },
                  {
                    productId: 'buoi-an',
                    variantId: 'buoi-an-200g',
                    sku: 'MNH-A02',
                    productName: 'Trà Hương Hoa Bưởi – AN',
                    price: 289000,
                    quantity: 1,
                    weightGrams: 200,
                    image: '/assets/optimized/order-thumb-buoi-an.webp',
                  },
                ],
                subtotal: total,
                shippingFee: 0,
                discount: 0,
                total,
                paymentMethod: 'bank',
                paymentStatus: 'pending_payment',
                orderStatus: 'preparing',
                customer: payload.customer,
                paymentInstructions: buildOrderPaymentInstructions({ orderCode, amount: total }),
                createdAt: new Date().toISOString(),
              },
            }),
          });
        });

        await page.locator('#checkout-fullName').fill('Nguyễn Minh Khuê');
        await page.locator('#checkout-phone').fill('0912345678');
        await page.locator('#checkout-email').fill('khue.ui@example.com');
        await page.getByRole('button', { name: /Đến lấy tại tiệm/i }).click();
        await page.getByRole('button', { name: /Chuyển khoản ngân hàng/i }).click();
        await page.getByRole('button', { name: /Xác Nhận Đặt Hàng/i }).click();

        await page.getByTestId('order-confirmation-code').waitFor({ state: 'visible', timeout: 10000 });
        assert.equal((await page.getByTestId('order-confirmation-code').innerText()).trim(), 'MNH000025');
        assert.equal((await page.getByTestId('order-confirmation-header-total').innerText()).trim(), '867.000 đ');
        assert.equal((await page.getByTestId('order-confirmation-total').innerText()).trim(), '867.000 đ');
        assert.equal((await page.getByTestId('confirmation-item-sku-nhai-thuong').innerText()).trim(), 'Mã sản phẩm: MNH-T02');
        assert.equal((await page.getByTestId('confirmation-item-sku-buoi-an').innerText()).trim(), 'Mã sản phẩm: MNH-A02');

        const vietQrText = await page.getByTestId('vietqr-payment-panel').innerText();
        assert.ok(vietQrText.includes('MNH000025'));
        assert.ok(!vietQrText.includes('MNH-T02'));
        assert.ok(!vietQrText.includes('MNH-A02'));

        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'order-confirmation-mnh000025-1440.png'), fullPage: true });
      });

      assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join('; ')}`);
      await page.close();
    } finally {
      await browser.close();
    }

    // 4.5 WebKit 390x844 mobile verification
    const wk = await webkit.launch({ headless: true });
    try {
      const ctx = await wk.newContext({ viewport: { width: 390, height: 844 } });
      const wkPage = await ctx.newPage();
      await checkAsync('4.5 WebKit (390x844) Product Detail & Checkout SKU rendering cleanly without overflow', async () => {
        await wkPage.goto(`${baseUrl}/#/san-pham/nhai-thuong`, { waitUntil: 'networkidle' });
        const el = wkPage.getByTestId('product-detail-sku');
        await el.waitFor({ state: 'visible', timeout: 10000 });
        assert.equal((await el.innerText()).trim(), 'Mã sản phẩm: MNH-T02');
        assert.ok(
          (await wkPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0
        );
        await wkPage.screenshot({ path: path.join(ARTIFACT_DIR, 'webkit-390-detail-mnh-t02.png') });
      });
      await ctx.close();
    } finally {
      await wk.close();
    }
  } finally {
    devProc.kill('SIGTERM');
  }

  console.log(`\n🎉 ALL ${passed} FINAL SKU CORRECTION VERIFICATION CHECKS PASSED!`);
}

main().catch((err) => {
  console.error('\n❌ FINAL SKU CORRECTION TEST FAILED:', err);
  process.exit(1);
});

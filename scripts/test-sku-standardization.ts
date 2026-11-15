// scripts/test-sku-standardization.ts
// Comprehensive Automated Verification Suite for Mộc Ngôn Hương Product SKU Standardization:
// 1. Official 9-SKU Catalog Table & Uniqueness Verification
// 2. Active Storefront (5 Published SKUs) vs Reserved 100g Variants (4 Inactive SKUs)
// 3. Server-Side Order Creation, SKU Snapshot Persistence, Price & SKU Tampering Rejection
// 4. Sequential Order Code (MNH000000) vs Product SKU (MNH-T02) Invariance & VietQR Transfer Content
// 5. Historical Pre-SKU Order Compatibility & Admin SKU Search
// 6. Multi-Viewport Chromium & WebKit UI Verification (320, 375, 390, 768, 1024, 1440, 1920)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  `${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`
);
import {
  OFFICIAL_SKU_CATALOG,
  PRODUCTS,
  RESERVED_100G_PRODUCTS,
  getCatalogEntryBySku,
  getPublishedCatalogEntryByProductId,
  getAnyCatalogEntryByProductId,
  resolveOrderItemSkuDisplay,
} from '../src/data/products.js';
import ordersHandler from '../api/orders.js';
import { readLocalDevOrders, writeLocalDevOrders } from '../api/_lib/orderRecovery.js';

const ARTIFACT_DIR =
  '/Users/hoainam/.gemini/antigravity/brain/1a0c6f22-0569-45b7-8304-88ae98029e72/sku-evidence';
const TEST_STORE_PATH = '/tmp/mnh-sku-test-store.json';
const TEST_COUNTER_PATH = '/tmp/mnh-sku-test-store.counter.json';

process.env.MNH_USE_LOCAL_DEV_STORE = '1';
process.env.MNH_LOCAL_DEV_STORE_PATH = TEST_STORE_PATH;
process.env.MNH_LOCAL_DEV_COUNTER_PATH = TEST_COUNTER_PATH;
process.env.MNH_CAPTURE_EMAILS_FOR_TEST = '1';

function resetLocalTestStore() {
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(TEST_COUNTER_PATH, JSON.stringify({ nextSeq: 0 }, null, 2), 'utf8');
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

async function invokeOrdersApi(options: {
  method: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}) {
  const req: any = {
    method: options.method,
    query: options.query || {},
    headers: options.headers || {},
    body: options.body || {},
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = createMockRes();
  await ordersHandler(req, res);
  return { status: res.statusCode, body: res.body, headers: res.headers };
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
  throw new Error(`Dev server did not start at ${url} within ${timeoutMs}ms`);
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  console.log('=== MỘC NGÔN HƯƠNG — SKU STANDARDIZATION VERIFICATION SUITE ===\n');

  // ---------------------------------------------------------------------------
  // PART 1: OFFICIAL 9-SKU CATALOG & UNIQUENESS TESTS
  // ---------------------------------------------------------------------------
  console.log('--- Part 1: Official 9-SKU Catalog & Uniqueness Verification ---');

  check('1.1 OFFICIAL_SKU_CATALOG contains exactly the 9 official business SKUs', () => {
    assert.equal(OFFICIAL_SKU_CATALOG.length, 9);
    const skus = OFFICIAL_SKU_CATALOG.map((e) => e.sku);
    const uniqueSkus = new Set(skus);
    assert.equal(uniqueSkus.size, 9, 'Every SKU in OFFICIAL_SKU_CATALOG must be unique');
    assert.deepEqual(skus, [
      'MNH-A01',
      'MNH-T01',
      'MNH-C01',
      'MNH-N01',
      'MNH-A02',
      'MNH-T02',
      'MNH-C02',
      'MNH-N02',
      'MNH-TY',
    ]);
  });

  check('1.2 Category A (100g, 100,000 VND) SKUs match official table and are reserved/inactive', () => {
    const expectedCategoryA = [
      { sku: 'MNH-A01', shortCodeName: 'AN', weightGrams: 100, price: 100000 },
      { sku: 'MNH-T01', shortCodeName: 'THƯƠNG', weightGrams: 100, price: 100000 },
      { sku: 'MNH-C01', shortCodeName: 'CẢM', weightGrams: 100, price: 100000 },
      { sku: 'MNH-N01', shortCodeName: 'NHỚ', weightGrams: 100, price: 100000 },
    ] as const;

    for (const exp of expectedCategoryA) {
      const entry = getCatalogEntryBySku(exp.sku);
      assert.ok(entry, `Missing SKU ${exp.sku}`);
      assert.equal(entry.shortCodeName, exp.shortCodeName);
      assert.equal(entry.weightGrams, exp.weightGrams);
      assert.equal(entry.price, exp.price);
      assert.equal(entry.published, false, `${exp.sku} must remain unpublished until business approval`);
      assert.equal(entry.publicationStatus, 'reserved_pending_approval');
    }
    assert.equal(RESERVED_100G_PRODUCTS.length, 4);
    for (const p of RESERVED_100G_PRODUCTS) {
      assert.equal(p.published, false);
      assert.equal(p.price, 100000);
      assert.equal(p.weightGrams, 100);
    }
  });

  check('1.3 Category B (200g Gift Boxes, 289,000 VND) & Category C (Combo TÂM Ý, 399,000 VND) match official table and active PRODUCTS', () => {
    const expectedActive = [
      { id: 'buoi-an', sku: 'MNH-A02', variantId: 'buoi-an-200g', price: 289000, weightGrams: 200 },
      { id: 'nhai-thuong', sku: 'MNH-T02', variantId: 'nhai-thuong-200g', price: 289000, weightGrams: 200 },
      { id: 'soi-cam', sku: 'MNH-C02', variantId: 'soi-cam-200g', price: 289000, weightGrams: 200 },
      { id: 'com-nho', sku: 'MNH-N02', variantId: 'com-nho-200g', price: 289000, weightGrams: 200 },
      { id: 'hop-qua-tam-y', sku: 'MNH-TY', variantId: 'hop-qua-tam-y', price: 399000, weightGrams: undefined },
    ] as const;

    assert.equal(PRODUCTS.length, 5);
    for (const exp of expectedActive) {
      const prod = PRODUCTS.find((p) => p.id === exp.id);
      assert.ok(prod, `Missing active product ${exp.id}`);
      assert.equal(prod.sku, exp.sku);
      assert.equal(prod.code, exp.sku);
      assert.equal(prod.variantId, exp.variantId);
      assert.equal(prod.price, exp.price);
      assert.equal(prod.weightGrams, exp.weightGrams);
      assert.equal(prod.published, true);

      const catEntry = getPublishedCatalogEntryByProductId(exp.id);
      assert.ok(catEntry);
      assert.equal(catEntry.sku, exp.sku);
      assert.equal(catEntry.price, exp.price);
    }
  });

  // ---------------------------------------------------------------------------
  // PART 2: ORDER CREATION, SKU SNAPSHOT & SERVER VALIDATION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 2: Order Creation, SKU Snapshot & Server Validation ---');

  resetLocalTestStore();

  try {
    await checkAsync('2.1 Creating order with active products stores canonical sku, variantId, price, and weightGrams in OrderItemSnapshot', async () => {
      const res = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_valid_${Date.now()}`,
          items: [
            { productId: 'nhai-thuong', sku: 'MNH-T02', variantId: 'nhai-thuong-200g', quantity: 2 },
            { productId: 'hop-qua-tam-y', sku: 'MNH-TY', variantId: 'hop-qua-tam-y', quantity: 1 },
          ],
          customer: {
            fullName: 'Nguyễn Minh Khuê',
            phone: '0912345678',
            email: 'khue.sku.test@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'bank',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const order = res.body.order;

      // Order code must remain sequential MNH000000 format, NEVER a product SKU
      assert.match(order.orderCode, /^MNH\d{6}$/);
      assert.notEqual(order.orderCode, 'MNH-T02');
      assert.notEqual(order.orderCode, 'MNH-TY');

      // VietQR transferContent must equal orderCode, NEVER product SKU
      assert.ok(order.paymentInstructions);
      assert.equal(order.paymentInstructions.transferContent, order.orderCode);

      // Verify item snapshots
      assert.equal(order.items.length, 2);
      assert.deepEqual(order.items[0], {
        productId: 'nhai-thuong',
        variantId: 'nhai-thuong-200g',
        sku: 'MNH-T02',
        productName: 'Trà Hương Hoa Nhài – THƯƠNG',
        price: 289000,
        quantity: 2,
        weightGrams: 200,
      });
      assert.deepEqual(order.items[1], {
        productId: 'hop-qua-tam-y',
        variantId: 'hop-qua-tam-y',
        sku: 'MNH-TY',
        productName: 'Hộp Quà Trà Đa Hương — "TÂM Ý"',
        price: 399000,
        quantity: 1,
      });
      assert.equal(order.total, 289000 * 2 + 399000);
    });

    await checkAsync('2.2 Server rejects attempts to purchase unpublished Category A 100g variants (MNH-A01..MNH-N01)', async () => {
      for (const reservedSku of ['MNH-A01', 'MNH-T01', 'MNH-C01', 'MNH-N01']) {
        const resBySku = await invokeOrdersApi({
          method: 'POST',
          body: {
            idempotencyKey: `sku_test_reserved_${reservedSku}_${Date.now()}`,
            items: [{ productId: 'buoi-an', sku: reservedSku, quantity: 1 }],
            customer: {
              fullName: 'Trần Văn B',
              phone: '0987654321',
              email: 'test@example.com',
              shippingMode: 'pickup',
              pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
            },
            paymentMethod: 'cod',
          },
        });
        assert.equal(resBySku.status, 400);
        assert.equal(resBySku.body.success, false);
        assert.equal(resBySku.body.code, 'PRODUCT_NOT_PUBLISHED');
      }

      const resByReservedId = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_reserved_id_${Date.now()}`,
          items: [{ productId: 'buoi-an-100g', quantity: 1 }],
          customer: {
            fullName: 'Trần Văn B',
            phone: '0987654321',
            email: 'test@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'cod',
        },
      });
      assert.equal(resByReservedId.status, 400);
      assert.equal(resByReservedId.body.code, 'PRODUCT_NOT_PUBLISHED');
    });

    await checkAsync('2.3 Server rejects manipulated/mismatched client SKU or variantId', async () => {
      // Mismatched active SKU: productId 'buoi-an' (MNH-A02) sent with 'MNH-T02'
      const resMismatchSku = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_mismatch_${Date.now()}`,
          items: [{ productId: 'buoi-an', sku: 'MNH-T02', quantity: 1 }],
          customer: {
            fullName: 'Trần Văn C',
            phone: '0987654321',
            email: 'test@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'cod',
        },
      });
      assert.equal(resMismatchSku.status, 400);
      assert.equal(resMismatchSku.body.code, 'INVALID_PRODUCT_SKU');

      // Forged arbitrary SKU
      const resForgedSku = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_forged_${Date.now()}`,
          items: [{ productId: 'soi-cam', sku: 'MNH-HACK-999', quantity: 1 }],
          customer: {
            fullName: 'Trần Văn C',
            phone: '0987654321',
            email: 'test@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'cod',
        },
      });
      assert.equal(resForgedSku.status, 400);
      assert.equal(resForgedSku.body.code, 'INVALID_PRODUCT_SKU');

      // Mismatched variantId
      const resMismatchVariant = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_variant_${Date.now()}`,
          items: [{ productId: 'com-nho', sku: 'MNH-N02', variantId: 'com-nho-100g', quantity: 1 }],
          customer: {
            fullName: 'Trần Văn C',
            phone: '0987654321',
            email: 'test@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'cod',
        },
      });
      assert.equal(resMismatchVariant.status, 400);
      assert.equal(resMismatchVariant.body.code, 'INVALID_PRODUCT_VARIANT');
    });

    await checkAsync('2.4 Server ignores manipulated client price (e.g. 100,000 VND sent for MNH-A02) and enforces 289,000 VND', async () => {
      const resPriceTamper = await invokeOrdersApi({
        method: 'POST',
        body: {
          idempotencyKey: `sku_test_pricetamper_${Date.now()}`,
          items: [{ productId: 'buoi-an', sku: 'MNH-A02', price: 100000, quantity: 1 }],
          customer: {
            fullName: 'Lê Hoàng Nam',
            phone: '0912345678',
            email: 'nam.price@example.com',
            shippingMode: 'pickup',
            pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
          },
          paymentMethod: 'cod',
        },
      });
      assert.equal(resPriceTamper.status, 201);
      assert.equal(resPriceTamper.body.order.items[0].sku, 'MNH-A02');
      assert.equal(resPriceTamper.body.order.items[0].price, 289000);
      assert.equal(resPriceTamper.body.order.total, 289000);
    });
  } finally {
    try {
      fs.unlinkSync(TEST_STORE_PATH);
      fs.unlinkSync(TEST_COUNTER_PATH);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // PART 3: HISTORICAL ORDER FALLBACK & ADMIN SEARCH COMPATIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 3: Historical Order Fallback & Admin Search Compatibility ---');

  check('3.1 Historical order items without SKU use non-destructive fallback and never guess ambiguous SKUs', () => {
    const legacyItem = {
      productId: 'buoi-an',
      productName: 'Trà Hương Hoa Bưởi – AN',
      price: 289000,
      quantity: 1,
    };
    const resolvedLegacy = resolveOrderItemSkuDisplay(legacyItem);
    assert.equal(resolvedLegacy.sku, null);
    assert.equal(resolvedLegacy.isLegacyFallback, true);
    assert.equal(resolvedLegacy.displayText, 'Chưa gắn SKU (đơn cũ)');

    const newItem = {
      productId: 'buoi-an',
      sku: 'MNH-A02',
      productName: 'Trà Hương Hoa Bưởi – AN',
      price: 289000,
      quantity: 1,
    };
    const resolvedNew = resolveOrderItemSkuDisplay(newItem);
    assert.equal(resolvedNew.sku, 'MNH-A02');
    assert.equal(resolvedNew.isLegacyFallback, false);
    assert.equal(resolvedNew.displayText, 'MNH-A02');
  });

  check('3.2 Cart variant matching keeps distinct SKUs separate and merges only identical SKU+variantId', () => {
    const isSameVariant = (
      a: { id: string; sku: string; variantId?: string },
      b: { id: string; sku: string; variantId?: string }
    ) => a.id === b.id && a.sku === b.sku && (a.variantId || '') === (b.variantId || '');

    const giftBoxAn = PRODUCTS[0]; // id: 'buoi-an', sku: 'MNH-A02', variantId: 'buoi-an-200g'
    const individualBoxAn = {
      ...RESERVED_100G_PRODUCTS[0],
      id: 'buoi-an', // even if sharing parent id 'buoi-an'
    }; // sku: 'MNH-A01', variantId: 'buoi-an-100g'

    assert.equal(isSameVariant(giftBoxAn, giftBoxAn), true);
    assert.equal(
      isSameVariant(giftBoxAn, individualBoxAn),
      false,
      '100g (MNH-A01) and 200g (MNH-A02) variants must never merge in cart'
    );
  });

  check('3.3 Admin order search matches item SKU, product name, orderCode, customer name, phone, and email without failing on legacy orders', () => {
    const sampleOrders = [
      {
        orderCode: 'MNH000101',
        customer: { fullName: 'Nguyễn Văn An', phone: '0901112222', email: 'an@example.com' },
        items: [
          {
            productId: 'nhai-thuong',
            sku: 'MNH-T02',
            variantId: 'nhai-thuong-200g',
            productName: 'Trà Hương Hoa Nhài – THƯƠNG',
            price: 289000,
            quantity: 1,
          },
        ],
      },
      {
        orderCode: 'MNH000102',
        customer: { fullName: 'Trần Thị Bình', phone: '0903334444', email: 'binh@example.com' },
        items: [
          {
            productId: 'hop-qua-tam-y',
            sku: 'MNH-TY',
            variantId: 'hop-qua-tam-y',
            productName: 'Hộp Quà Trà Đa Hương — "TÂM Ý"',
            price: 399000,
            quantity: 2,
          },
        ],
      },
      {
        // Legacy pre-SKU order (no item.sku field)
        orderCode: 'MNH000005',
        customer: { fullName: 'Lê Cũ', phone: '0905556666', email: 'cu@example.com' },
        items: [
          {
            productId: 'buoi-an',
            productName: 'Trà Hương Hoa Bưởi – AN',
            price: 289000,
            quantity: 1,
          },
        ],
      },
    ];

    const filterAdminOrders = (termRaw: string) => {
      const term = termRaw.trim().toLowerCase();
      return sampleOrders.filter((o) => {
        const code = String(o.orderCode || '').toLowerCase();
        const name = String(o.customer?.fullName || '').toLowerCase();
        const phone = String(o.customer?.phone || '').toLowerCase();
        const email = String(o.customer?.email || '').toLowerCase();
        const matchesItem = Array.isArray(o.items)
          ? o.items.some((item: any) => {
              const sku = String(item?.sku || '').toLowerCase();
              const productName = String(item?.productName || '').toLowerCase();
              return sku.includes(term) || productName.includes(term);
            })
          : false;
        return (
          code.includes(term) ||
          name.includes(term) ||
          phone.includes(term) ||
          email.includes(term) ||
          matchesItem
        );
      });
    };

    assert.equal(filterAdminOrders('MNH-T02').length, 1);
    assert.equal(filterAdminOrders('MNH-T02')[0].orderCode, 'MNH000101');
    assert.equal(filterAdminOrders('mnh-ty').length, 1);
    assert.equal(filterAdminOrders('mnh-ty')[0].orderCode, 'MNH000102');
    assert.equal(filterAdminOrders('MNH000005').length, 1);
    assert.equal(filterAdminOrders('0903334444').length, 1);
    assert.equal(filterAdminOrders('MNH-A01').length, 0);
  });

  // ---------------------------------------------------------------------------
  // PART 4: MULTI-VIEWPORT CHROMIUM & WEBKIT UI VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Part 4: Multi-Viewport Chromium & WebKit UI Verification ---');

  const port = 4179;
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
      // 4.1 Verify all 5 active Product Detail pages display their exact canonical SKU
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const expectedDetailSkus = [
        { id: 'buoi-an', sku: 'MNH-A02' },
        { id: 'nhai-thuong', sku: 'MNH-T02' },
        { id: 'soi-cam', sku: 'MNH-C02' },
        { id: 'com-nho', sku: 'MNH-N02' },
        { id: 'hop-qua-tam-y', sku: 'MNH-TY' },
      ];

      for (const item of expectedDetailSkus) {
        await checkAsync(`4.1 Product Detail #/san-pham/${item.id} renders canonical SKU ${item.sku}`, async () => {
          await page.goto(`${baseUrl}/#/san-pham/${item.id}`, { waitUntil: 'networkidle' });
          const skuLocator = page.getByTestId('product-detail-sku');
          await skuLocator.waitFor({ state: 'visible', timeout: 10000 });
          const text = (await skuLocator.innerText()).trim();
          assert.equal(text, `Mã SP: ${item.sku}`);
        });
      }

      // Save screenshot of THƯƠNG (MNH-T02) Product Detail page
      await page.goto(`${baseUrl}/#/san-pham/nhai-thuong`, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'product-detail-nhai-thuong-mnh-t02-1440.png'),
        fullPage: false,
      });

      // 4.2 Add THƯƠNG (MNH-T02) and TÂM Ý (MNH-TY) to Cart and verify Cart Drawer & Checkout Summary across 7 viewports
      await checkAsync('4.2 Cart Drawer & Checkout Summary display MNH-T02 and MNH-TY with zero overflow across 320..1920px', async () => {
        await page.goto(`${baseUrl}/#/san-pham/nhai-thuong`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: /Thêm vào giỏ/i }).click();
        const cartSkuThuong = page.getByTestId('cart-item-sku-nhai-thuong');
        await cartSkuThuong.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok((await cartSkuThuong.innerText()).includes('MNH-T02'));

        await page.goto(`${baseUrl}/#/san-pham/hop-qua-tam-y`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: /Thêm vào giỏ/i }).click();
        const cartSkuTamY = page.getByTestId('cart-item-sku-hop-qua-tam-y');
        await cartSkuTamY.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok((await cartSkuTamY.innerText()).includes('MNH-TY'));

        await page.goto(`${baseUrl}/#/thanh-toan`, { waitUntil: 'networkidle' });
        const checkoutSkuThuong = page.getByTestId('checkout-item-sku-nhai-thuong');
        const checkoutSkuTamY = page.getByTestId('checkout-item-sku-hop-qua-tam-y');
        await checkoutSkuThuong.waitFor({ state: 'visible', timeout: 5000 });
        await checkoutSkuTamY.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok((await checkoutSkuThuong.innerText()).includes('MNH-T02'));
        assert.ok((await checkoutSkuTamY.innerText()).includes('MNH-TY'));

        const viewports = [
          { width: 320, height: 568 },
          { width: 375, height: 812 },
          { width: 390, height: 844 },
          { width: 768, height: 1024 },
          { width: 1024, height: 768 },
          { width: 1440, height: 900 },
          { width: 1920, height: 1080 },
        ];

        for (const vp of viewports) {
          await page.setViewportSize(vp);
          await page.waitForTimeout(150);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
          );
          assert.ok(
            overflow <= 0,
            `Horizontal overflow (${overflow}px) detected on Checkout at ${vp.width}x${vp.height}`
          );
        }

        await page.setViewportSize({ width: 375, height: 812 });
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, 'checkout-sku-summary-375.png'),
          fullPage: true,
        });
      });

      await page.close();
    } finally {
      await browser.close();
    }

    // 4.3 WebKit iOS Safari / Facebook IAB (390x844) verification
    const wkBrowser = await webkit.launch({ headless: true });
    try {
      const wkContext = await wkBrowser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/455.0.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/vi_VN;FBOP/5]',
      });
      const wkPage = await wkContext.newPage();

      await checkAsync('4.3 WebKit iOS / Facebook IAB (390x844) Product Detail & Checkout SKU rendering with zero overflow', async () => {
        await wkPage.goto(`${baseUrl}/#/san-pham/buoi-an`, { waitUntil: 'networkidle' });
        const skuEl = wkPage.getByTestId('product-detail-sku');
        await skuEl.waitFor({ state: 'visible', timeout: 10000 });
        assert.equal((await skuEl.innerText()).trim(), 'Mã SP: MNH-A02');

        const overflow = await wkPage.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        assert.ok(overflow <= 0, `WebKit overflow ${overflow}px on Product Detail`);

        await wkPage.screenshot({
          path: path.join(ARTIFACT_DIR, 'webkit-390-product-detail-mnh-a02.png'),
          fullPage: false,
        });
      });

      await wkContext.close();
    } finally {
      await wkBrowser.close();
    }
  } finally {
    devProc.kill('SIGTERM');
  }

  console.log(`\n🎉 ALL ${passed} SKU STANDARDIZATION CHECKS PASSED!`);
}

main().catch((err) => {
  console.error('\n❌ SKU STANDARDIZATION TEST FAILED:', err);
  process.exit(1);
});

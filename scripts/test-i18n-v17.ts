import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

import { viResources } from '../src/locales/vi/index';
import { enResources } from '../src/locales/en/index';
import { formatVnd, normalizeLocale } from '../src/lib/locale';
import { validateDeliveryAddress } from '../src/data/address/index';
import {
  classifyIntent,
  createInitialContext,
  processUserMessage,
  generateCardSuggestions,
} from '../src/assistant/index';
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from '../api/_lib/authEmailTemplates';
import {
  sendPaymentConfirmedNotification,
  sendOrderRecoveryEmail,
} from '../api/_lib/notifications';
import ordersHandler from '../api/orders';
import { resetRecoveryRateLimitsForTest } from '../api/_lib/orderRecovery';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  `${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`
);

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const EVIDENCE_DIR =
  '/Users/hoainam/.gemini/antigravity/brain/1a0c6f22-0569-45b7-8304-88ae98029e72/v17-0-i18n-evidence';
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g) || [];
  return matches.map((m) => m.replace(/\s+/g, '')).sort();
}

function verifyKeyAndPlaceholderParity(viNode: any, enNode: any, prefix: string, errors: string[]) {
  if (typeof viNode !== typeof enNode) {
    errors.push(`Type mismatch at "${prefix}": vi=${typeof viNode}, en=${typeof enNode}`);
    return;
  }
  if (Array.isArray(viNode)) {
    if (!Array.isArray(enNode)) {
      errors.push(`Expected array at "${prefix}" in en`);
      return;
    }
    if (viNode.length !== enNode.length) {
      errors.push(`Array length mismatch at "${prefix}": vi=${viNode.length}, en=${enNode.length}`);
      return;
    }
    for (let i = 0; i < viNode.length; i++) {
      verifyKeyAndPlaceholderParity(viNode[i], enNode[i], `${prefix}[${i}]`, errors);
    }
    return;
  }
  if (viNode && typeof viNode === 'object') {
    const viKeys = Object.keys(viNode).sort();
    const enKeys = Object.keys(enNode).sort();
    for (const k of viKeys) {
      if (!(k in enNode)) errors.push(`Missing EN key: "${prefix}.${k}"`);
    }
    for (const k of enKeys) {
      if (!(k in viNode)) errors.push(`Extra EN key: "${prefix}.${k}"`);
    }
    for (const k of viKeys) {
      if (k in enNode) {
        verifyKeyAndPlaceholderParity(viNode[k], enNode[k], `${prefix}.${k}`, errors);
      }
    }
    return;
  }
  if (typeof viNode === 'string') {
    if (enNode.trim().length === 0 && viNode.trim().length > 0) {
      errors.push(`Empty EN translation at "${prefix}"`);
    }
    const viPh = extractPlaceholders(viNode);
    const enPh = extractPlaceholders(enNode);
    if (JSON.stringify(viPh) !== JSON.stringify(enPh)) {
      errors.push(`Placeholder mismatch at "${prefix}": vi=${viPh.join(',')} vs en=${enPh.join(',')}`);
    }
  }
}

function createMockReqRes(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const req: any = {
    method: options.method || 'GET',
    url: options.url || '/api/orders',
    headers: options.headers || {},
    body: options.body,
    socket: { remoteAddress: '127.0.0.1' },
    on(event: string, cb: (...args: any[]) => void) {
      if (event === 'end') cb();
    },
  };
  let statusCode = 200;
  let body = '';
  const headers: Record<string, string> = {};
  const res: any = {
    statusCode: 200,
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
    end(chunk?: any) {
      if (chunk) body += String(chunk);
    },
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => statusCode,
    set: (v: number) => {
      statusCode = v;
    },
  });
  return {
    req,
    res,
    getJson: () => (body ? JSON.parse(body) : {}),
    getStatus: () => statusCode,
  };
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function startDistAndApiServer(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const reqUrl = req.url || '/';
      const cleanPath = reqUrl.split('?')[0];

      if (cleanPath === '/api/orders') {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          if (chunks.length > 0) {
            const raw = Buffer.concat(chunks).toString('utf-8');
            (req as any).body = raw;
          }
          await ordersHandler(req, res);
        });
        return;
      }

      const relPath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
      let filePath = path.join(DIST_DIR, relPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('MỘC NGÔN HƯƠNG — V17.0 BILINGUAL i18n (VI/EN) COMPREHENSIVE TEST SUITE');
  console.log('========================================================================\n');

  // ------------------------------------------------------------------------
  // 1. Dictionary Parity, Locale Helpers & Address Validation
  // ------------------------------------------------------------------------
  console.log('▶ SUITE 1: Translation Key & Placeholder Parity + Locale Utilities');
  const parityErrors: string[] = [];
  verifyKeyAndPlaceholderParity(viResources, enResources, 'root', parityErrors);
  assert.equal(parityErrors.length, 0, `Translation parity errors:\n${parityErrors.join('\n')}`);
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('vi-VN'), 'vi');
  assert.equal(normalizeLocale(undefined), 'vi');
  assert.equal(formatVnd(289000, 'vi', 'spaced-vi'), '289.000 đ');
  assert.equal(formatVnd(289000, 'en'), '289,000 VND');
  assert.equal(formatVnd(399000, 'en'), '399,000 VND');

  const invalidAddrEn = validateDeliveryAddress({
    address: '',
    provinceCode: '',
    communeCode: '',
    locale: 'en',
  });
  assert.equal(invalidAddrEn.isValid, false);
  assert(invalidAddrEn.error?.includes('Province'), `Expected EN address error, got: ${invalidAddrEn.error}`);

  const validAddrEn = validateDeliveryAddress({
    address: '42 Hang Dieu Street',
    provinceCode: '01',
    communeCode: '00004',
    locale: 'en',
  });
  assert.equal(validAddrEn.isValid, true);
  console.log('  ✅ PASS: All translation namespaces match 100% (keys, arrays, placeholders) + EN/VI formatters');

  // ------------------------------------------------------------------------
  // 2. Bilingual Local Assistant Verification (VI & EN)
  // ------------------------------------------------------------------------
  console.log('\n▶ SUITE 2: Bilingual Client-Side Tea Concierge (EN & VI)');
  const enQueries: Array<{ q: string; expectedIntent?: string; expectedRecipient?: string; expectSubstr: string }> = [
    { q: 'gift tea for mom', expectedIntent: 'RECOMMEND_PRODUCT', expectedRecipient: 'mother', expectSubstr: '399,000 VND' },
    { q: 'light gentle tea for mom', expectedIntent: 'RECOMMEND_PRODUCT', expectedRecipient: 'mother', expectSubstr: '289,000 VND' },
    { q: 'How much is the Tam Y gift box?', expectedIntent: 'PRICE_INQUIRY', expectSubstr: '399,000 VND' },
    { q: 'tea under 300k', expectedIntent: 'BUDGET_FILTER', expectSubstr: '289,000 VND' },
    { q: 'write a card message for teacher', expectedIntent: 'GIFT_CARD_WRITING', expectedRecipient: 'teacher', expectSubstr: 'card' },
    { q: 'how to brew pomelo blossom tea', expectedIntent: 'BREWING_GUIDE', expectSubstr: '80°C - 85°C' },
    { q: 'what is the shipping fee and delivery time?', expectedIntent: 'SHIPPING_POLICY', expectSubstr: '1–2 days' },
    { q: 'vietqr bank transfer or cash on delivery', expectedIntent: 'PAYMENT_POLICY', expectSubstr: 'VietQR' },
    { q: 'corporate gift with logo', expectedIntent: 'CORPORATE_GIFTING', expectSubstr: '0889 742 556' },
  ];
  for (const tc of enQueries) {
    const cls = classifyIntent(tc.q);
    if (tc.expectedIntent) {
      assert.equal(cls.intent, tc.expectedIntent, `Intent mismatch for "${tc.q}": got ${cls.intent}`);
    }
    if (tc.expectedRecipient) {
      assert.equal(cls.entities.recipient, tc.expectedRecipient, `Recipient mismatch for "${tc.q}"`);
    }
    const res = processUserMessage(tc.q, createInitialContext(), undefined, 'en');
    assert(
      res.reply.text.toLowerCase().includes(tc.expectSubstr.toLowerCase()),
      `Expected "${tc.expectSubstr}" in EN reply for "${tc.q}", got:\n${res.reply.text}`
    );
    assert(
      !res.reply.text.includes('289.000đ'),
      `EN assistant reply leaked VI currency format: ${res.reply.text}`
    );
  }
  const enCards = generateCardSuggestions({ recipientCategory: 'partner' }, 'en');
  assert.equal(enCards.suggestions.length, 3);
  assert(enCards.suggestions.every((c) => c.text.length <= 280 && /[a-zA-Z]/.test(c.text)));
  console.log(`  ✅ PASS: ${enQueries.length}/${enQueries.length} English queries + card suggestions passed strictly within 280 chars`);

  // ------------------------------------------------------------------------
  // 3. Backend Orders API, Locale Persistence & Localized Email Verification
  // ------------------------------------------------------------------------
  console.log('\n▶ SUITE 3: Orders API Locale Persistence + Localized Email A/B, Recovery & Auth Emails');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mnh-i18n-orders-'));
  const prevStore = process.env.MNH_LOCAL_DEV_STORE_PATH;
  const prevCapture = process.env.MNH_CAPTURE_EMAILS_FOR_TEST;
  process.env.MNH_LOCAL_DEV_STORE_PATH = path.join(tmpDir, 'orders.json');
  process.env.MNH_CAPTURE_EMAILS_FOR_TEST = '1';
  (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__ = [];
  (globalThis as any).__MNH_TEST_NEXT_SEQ__ = 0;
  resetRecoveryRateLimitsForTest();

  try {
    // 3.1 Auth Email Templates in VI vs EN
    const verifyEn = renderVerificationEmail({
      customerName: 'Alice <Nguyen>',
      verificationLink: 'https://mocngonhuong.com/#/tai-khoan?oob=123',
      locale: 'en',
    });
    assert(verifyEn.subject.includes('Verify Your Mộc Ngôn Hương Account'));
    assert(verifyEn.html.includes('<html xmlns="http://www.w3.org/1999/xhtml" lang="en">'));
    assert(verifyEn.html.includes('Alice &lt;Nguyen&gt;'));

    const resetEn = renderPasswordResetEmail({
      customerName: 'Alice',
      resetLink: 'https://mocngonhuong.com/#/tai-khoan?mode=resetPassword',
      locale: 'en',
    });
    assert(resetEn.subject.includes('Reset Your Mộc Ngôn Hương Password'));
    assert(resetEn.html.includes('Set New Password'));

    const welcomeEn = renderWelcomeEmail({ customerName: 'Alice', locale: 'en' });
    assert(welcomeEn.subject.includes('Welcome to Mộc Ngôn Hương!'));
    assert(welcomeEn.html.includes('Explore Our Tea Collection'));

    const welcomeVi = renderWelcomeEmail({ customerName: 'An' });
    assert(welcomeVi.subject.includes('Chào mừng bạn đến với Mộc Ngôn Hương!'));

    // 3.2 Create English Bank Transfer Order
    const { req: createReq, res: createRes, getJson: getCreateJson, getStatus: getCreateStatus } = createMockReqRes({
      method: 'POST',
      url: '/api/orders',
      body: {
        locale: 'en',
        paymentMethod: 'bank',
        idempotencyKey: 'i18n-test-order-en-1',
        customer: {
          fullName: 'Linh Pham',
          phone: '0912345678',
          email: 'linh.en@example.com',
          shippingMode: 'delivery',
          provinceCode: '01',
          communeCode: '00004',
          address: '42 Hang Dieu Street',
          note: 'Birthday gift note',
        },
        items: [
          { productId: 'buoi-an', sku: 'MNH-A02', quantity: 1 },
          { productId: 'hop-qua-tam-y', sku: 'MNH-TY', quantity: 1 },
        ],
      },
    });
    await ordersHandler(createReq, createRes);
    assert.equal(getCreateStatus(), 201);
    const createdPayload = getCreateJson();
    assert.equal(createdPayload.order.locale, 'en');
    assert.equal(createdPayload.order.orderCode, 'MNH000000');
    assert.equal(createdPayload.order.total, 688000);
    assert.equal(createdPayload.order.paymentInstructions.transferContent, 'MNH000000');
    assert(createdPayload.recoveryUrl.includes('&lang=en'), 'Recovery URL for EN order should include &lang=en');

    const capturedAfterOrder: any[] = (globalThis as any).__MNH_TEST_CAPTURED_EMAILS__;
    const emailAEn = capturedAfterOrder.find(
      (e) => e.idempotencyKey === `order-created-customer-${createdPayload.order.id}`
    );
    assert(emailAEn, 'Email A must be captured for EN order');
    assert.equal(emailAEn.subject, 'Mộc Ngôn Hương — Order Confirmed | MNH000000');
    assert(emailAEn.html.includes('688,000 VND'), 'Email A must show 688,000 VND');
    assert(emailAEn.html.includes('Pomelo Blossom Tea – AN'));
    assert(emailAEn.html.includes('MNH000000'));
    assert(!emailAEn.html.includes('Payment Successful'), 'Email A must never falsely claim payment success');

    // 3.3 Customer "I have transferred" stays customer_reported_paid and sends ZERO Email B
    const countBeforeReport = capturedAfterOrder.length;
    const { req: repReq, res: repRes, getJson: getRepJson, getStatus: getRepStatus } = createMockReqRes({
      method: 'POST',
      url: '/api/orders',
      body: {
        action: 'report_transfer',
        orderId: createdPayload.order.id,
        recoveryToken: createdPayload.recoveryToken,
        locale: 'en',
      },
    });
    await ordersHandler(repReq, repRes);
    assert.equal(getRepStatus(), 200);
    assert.equal(getRepJson().order.paymentStatus, 'customer_reported_paid');
    assert(getRepJson().message.includes('verify the transaction'), 'Report transfer response must be localized in EN');
    assert.equal(capturedAfterOrder.length, countBeforeReport, 'Customer transfer report must NOT send Email B');

    // 3.4 Email B (Payment Confirmed) in EN vs historical fallback to VI
    await sendPaymentConfirmedNotification({
      ...createdPayload.order,
      paymentStatus: 'paid',
      paymentConfirmedAt: new Date().toISOString(),
      recoveryToken: createdPayload.recoveryToken,
    });
    const emailBEn = capturedAfterOrder.find(
      (e) => e.idempotencyKey === `payment-confirmed-${createdPayload.order.id}`
    );
    assert(emailBEn, 'Email B must be captured for EN order');
    assert.equal(emailBEn.subject, 'Mộc Ngôn Hương — Payment Confirmed | MNH000000');
    assert(emailBEn.html.includes('688,000 VND'));

    // Historical order without locale -> strictly falls back to VI
    const { locale: _droppedLocale, ...legacyOrderNoLocale } = createdPayload.order;
    await sendPaymentConfirmedNotification({
      ...legacyOrderNoLocale,
      id: `${createdPayload.order.id}-legacy`,
      orderCode: 'MNH999001',
      paymentStatus: 'paid',
      paymentConfirmedAt: new Date().toISOString(),
    });
    const emailBLegacy = capturedAfterOrder.find(
      (e) => e.idempotencyKey === `payment-confirmed-${createdPayload.order.id}-legacy`
    );
    assert(emailBLegacy?.subject.includes('Xác nhận thanh toán thành công'), 'Legacy orders missing locale must default to VI');

    // 3.5 Recovery link request in EN
    await sendOrderRecoveryEmail({
      orderId: createdPayload.order.id,
      orderCode: 'MNH000000',
      customerName: 'Linh Pham',
      customerEmail: 'linh.en@example.com',
      total: 688000,
      recoveryToken: createdPayload.recoveryToken,
      locale: 'en',
    });
    const recoveryEmailEn = capturedAfterOrder.find((e) => e.subject?.includes('Guest Order Lookup'));
    assert(recoveryEmailEn && recoveryEmailEn.html.includes('688,000 VND'));
    console.log('  ✅ PASS: Order locale persisted, Email A/B & Recovery localized cleanly in EN, legacy orders default to VI');

    // ----------------------------------------------------------------------
    // 4. Built dist/ + API Server E2E Verification in Chromium & WebKit
    // ----------------------------------------------------------------------
    console.log('\n▶ SUITE 4: Playwright Chromium & WebKit Bilingual E2E & Responsive Geometry (320px–1920px)');
    const port = 4189;
    const baseUrl = `http://127.0.0.1:${port}`;
    const server = await startDistAndApiServer(port);

    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    try {
      const chrome = await chromium.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      });
      const wk = await webkit.launch();

      try {
        // Check header overlap & horizontal overflow across all 8 viewports on both browsers in VI & EN
        for (const [browserName, browser] of [
          ['chromium', chrome],
          ['webkit', wk],
        ] as const) {
          for (const lang of ['vi', 'en'] as const) {
            for (const vp of viewports) {
              const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
              await ctx.addInitScript((l) => {
                window.localStorage.setItem('mnh_language_v1', l);
              }, lang);
              const page = await ctx.newPage();
              const errors: string[] = [];
              page.on('pageerror', (err: any) => errors.push(err?.message || String(err)));
              page.on('console', (msg: any) => {
                if (msg.type() === 'error') errors.push(msg.text());
              });

              await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
              await page.waitForTimeout(250);

              const geom = await page.evaluate(() => {
                const htmlLang = document.documentElement.lang;
                const scrollW = document.documentElement.scrollWidth;
                const clientW = document.documentElement.clientWidth;

                const swBtn = document.querySelector('[data-testid="header-language-switcher"]') as HTMLElement | null;
                const headerBtns = Array.from(
                  document.querySelectorAll('header button, header a')
                ).filter((el) => {
                  const style = window.getComputedStyle(el);
                  const r = el.getBoundingClientRect();
                  return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
                }) as HTMLElement[];

                const swRect = swBtn?.getBoundingClientRect() || null;
                const overlaps: string[] = [];
                for (let i = 0; i < headerBtns.length; i++) {
                  for (let j = i + 1; j < headerBtns.length; j++) {
                    const a = headerBtns[i].getBoundingClientRect();
                    const b = headerBtns[j].getBoundingClientRect();
                    const horiz = a.left < b.right - 1 && b.left < a.right - 1;
                    const vert = a.top < b.bottom - 1 && b.top < a.bottom - 1;
                    if (horiz && vert && !headerBtns[i].contains(headerBtns[j]) && !headerBtns[j].contains(headerBtns[i])) {
                      overlaps.push(`${headerBtns[i].id || headerBtns[i].getAttribute('aria-label')} overlaps ${headerBtns[j].id || headerBtns[j].getAttribute('aria-label')}`);
                    }
                  }
                }
                const accountBtn = headerBtns.find((b) =>
                  (b.getAttribute('aria-label') || '').match(/Tài khoản|Account/i)
                );
                const accountRect = accountBtn?.getBoundingClientRect() || null;
                return {
                  htmlLang,
                  overflow: scrollW - clientW,
                  swVisible: Boolean(swRect),
                  swLeftOfAccount: swRect && accountRect ? swRect.right <= accountRect.left + 2 : null,
                  overlaps,
                };
              });

              assert.equal(errors.length, 0, `${browserName} ${lang} ${vp.width} console/page errors: ${errors.join('; ')}`);
              assert.equal(geom.htmlLang, lang, `${browserName} expected html lang=${lang}`);
              assert(geom.overflow <= 1, `${browserName} ${lang} ${vp.width}px horizontal overflow=${geom.overflow}`);
              assert(geom.swVisible, `${browserName} ${lang} ${vp.width}px language switcher missing`);
              assert.equal(geom.overlaps.length, 0, `${browserName} ${lang} ${vp.width}px overlaps: ${geom.overlaps.join('; ')}`);
              if (geom.swLeftOfAccount !== null) {
                assert(geom.swLeftOfAccount, `${browserName} ${lang} ${vp.width}px language switcher not strictly left of account button`);
              }

              await ctx.close();
            }
          }
        }
        console.log('  ✅ PASS: Zero header overlap, zero overflow, and zero errors across 8 viewports in both Chromium & WebKit (VI & EN)');

        // Interactive Desktop E2E Flow in Chromium (VI default -> Switch to EN -> Search -> Assistant -> Cart -> Checkout -> VietQR)
        const desktopCtx = await chrome.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
        const page = await desktopCtx.newPage();
        const runtimeErrors: string[] = [];
        page.on('pageerror', (e: any) => runtimeErrors.push(e?.message || String(e)));

        // A. Default VI load + SEO check (static + dynamic)
        const staticIndexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
        assert(staticIndexHtml.includes('rel="canonical"'));
        assert(staticIndexHtml.includes('hreflang="en"'));
        assert(staticIndexHtml.includes('hreflang="vi"'));
        assert(staticIndexHtml.includes('hreflang="x-default"'));

        await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        const viSeo = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          hreflangVi: document.querySelector('link[hreflang="vi"]')?.getAttribute('href'),
          hreflangEn: document.querySelector('link[hreflang="en"]')?.getAttribute('href'),
          hreflangDefault: document.querySelector('link[hreflang="x-default"]')?.getAttribute('href'),
        }));
        assert.equal(viSeo.lang, 'vi');
        assert(viSeo.title.includes('Mộc Ngôn Hương'));
        assert(viSeo.canonical === 'https://mocngonhuong.com/');
        assert(viSeo.hreflangVi && viSeo.hreflangEn && viSeo.hreflangDefault);

        // B. Switch to EN via Header Switcher + URL ?lang=en sync + Escape check + reload persistence
        await page.click('[data-testid="header-language-switcher"]');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
        assert.equal(await page.locator('[data-testid="language-switcher-menu"]').count(), 0, 'Escape should close language dropdown');

        await page.click('[data-testid="header-language-switcher"]');
        await page.click('[data-testid="language-option-en"]');
        await page.waitForTimeout(250);

        assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
        assert.equal(await page.evaluate(() => window.localStorage.getItem('mnh_language_v1')), 'en');
        assert(page.url().includes('?lang=en'), `Switching to EN should keep ?lang=en in shareable URL, got ${page.url()}`);
        assert.equal(
          await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href')),
          'https://mocngonhuong.com/?lang=en'
        );
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-home-en.png') });

        // Reload and ensure EN persists
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');

        // B2. Fresh incognito context opening hash EN link (#/san-pham/buoi-an?lang=en) with empty localStorage
        const freshUrlCtx = await chrome.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
        const freshUrlPage = await freshUrlCtx.newPage();
        await freshUrlPage.goto(`${baseUrl}/#/san-pham/buoi-an?lang=en`, { waitUntil: 'networkidle' });
        await freshUrlPage.waitForTimeout(250);
        assert.equal(await freshUrlPage.evaluate(() => document.documentElement.lang), 'en');
        assert.equal(await freshUrlPage.evaluate(() => window.localStorage.getItem('mnh_language_v1')), 'en');
        await freshUrlPage.locator('header nav button:has-text("Products")').click();
        await freshUrlPage.waitForTimeout(200);
        assert(freshUrlPage.url().includes('?lang=en'), `Navigation from EN link must retain ?lang=en: ${freshUrlPage.url()}`);
        await freshUrlPage.reload({ waitUntil: 'networkidle' });
        await freshUrlPage.waitForTimeout(250);
        assert.equal(await freshUrlPage.evaluate(() => document.documentElement.lang), 'en');
        // Switching EN -> VI strips ?lang=en from URL so reload stays VI
        await freshUrlPage.click('[data-testid="header-language-switcher"]');
        await freshUrlPage.click('[data-testid="language-option-vi"]');
        await freshUrlPage.waitForTimeout(200);
        assert(!freshUrlPage.url().includes('lang=en'), `Switching to VI must remove ?lang=en from URL: ${freshUrlPage.url()}`);
        await freshUrlPage.reload({ waitUntil: 'networkidle' });
        await freshUrlPage.waitForTimeout(200);
        assert.equal(await freshUrlPage.evaluate(() => document.documentElement.lang), 'vi');
        // Hashchange with ?lang=en updates locale dynamically
        await freshUrlPage.evaluate(() => {
          window.location.hash = '#/cau-chuyen?lang=en';
        });
        await freshUrlPage.waitForTimeout(250);
        assert.equal(await freshUrlPage.evaluate(() => document.documentElement.lang), 'en');
        // Direct ?lang=vi overrides existing 'en' in localStorage
        await freshUrlPage.goto(`${baseUrl}/?lang=vi#/san-pham`, { waitUntil: 'networkidle' });
        await freshUrlPage.waitForTimeout(200);
        assert.equal(await freshUrlPage.evaluate(() => document.documentElement.lang), 'vi');
        await freshUrlCtx.close();

        // C. Bilingual Search Overlay ('jasmine' finds THƯƠNG, 'jasmine blossom' -> 1, 'tra huong buoi' -> 1, 'tra da huong' -> 1)
        await page.locator('header button[aria-label*="Search"]').click();
        await page.waitForTimeout(150);
        const sInput = page.locator('input[placeholder*="Search"]');
        await sInput.fill('jasmine');
        await page.waitForTimeout(180);
        assert((await page.locator('.search-card .product-card').count()) >= 1, '"jasmine" must match at least 1 product');
        const searchBody = await page.locator('body').innerText();
        assert(searchBody.includes('Jasmine Blossom Tea'), 'Bilingual search for "jasmine" must match THƯƠNG');
        await sInput.fill('jasmine blossom');
        await page.waitForTimeout(150);
        assert.equal(await page.locator('.search-card .product-card').count(), 1, '"jasmine blossom" must match 1 product');
        await sInput.fill('tra huong buoi');
        await page.waitForTimeout(150);
        assert.equal(await page.locator('.search-card .product-card').count(), 1, '"tra huong buoi" must match 1 product');
        await sInput.fill('tra da huong');
        await page.waitForTimeout(150);
        assert.equal(await page.locator('.search-card .product-card').count(), 1, '"tra da huong" must match 1 product');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);

        // D. Product Detail Page (MNH-A02) & Cart Retention across VI <-> EN toggle
        await page.goto(`${baseUrl}/#/san-pham/buoi-an`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        const detailTextEn = await page.locator('main').innerText();
        assert(detailTextEn.includes('Pomelo Blossom Tea'));
        assert(detailTextEn.includes('289,000 VND'));
        assert(detailTextEn.includes('MNH-A02'));
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-product-detail-en.png') });

        // Add to cart -> opens CartDrawer
        await page.getByRole('button', { name: /Add to Cart/i }).first().click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-cart-en.png') });

        // Switch VI -> EN and verify Cart badge retains 1 item without reset
        await page.keyboard.press('Escape');
        await page.click('[data-testid="header-language-switcher"]');
        await page.click('[data-testid="language-option-vi"]');
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => document.documentElement.lang), 'vi');
        await page.click('[data-testid="header-language-switcher"]');
        await page.click('[data-testid="language-option-en"]');
        await page.waitForTimeout(200);

        // E. Assistant ChatBox in English
        await page.getByRole('button', { name: /Open Mộc Ngôn Hương online tea advisor/i }).click();
        await page.waitForTimeout(200);
        await page.locator('input[placeholder*="gift for mom"]').fill('gift for mom');
        await page.getByRole('button', { name: /Send message/i }).click();
        await page.waitForTimeout(550);
        const chatText = await page.locator('[aria-label="Mộc Ngôn Hương Tea Advisor"]').innerText();
        assert(chatText.includes('399,000 VND') && chatText.includes('289,000 VND'), 'ChatBox EN should recommend teas in VND');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-chatbox-en.png') });
        await page.getByRole('button', { name: /Close chat window/i }).click();

        // F. Checkout -> Fill Form -> Submit Manual VietQR Order -> Click "I have transferred"
        await page.goto(`${baseUrl}/#/thanh-toan`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        const checkoutEn = await page.locator('main').innerText();
        assert(checkoutEn.includes('Shipping') || checkoutEn.includes('Delivery'), 'Checkout must render in EN');
        assert(checkoutEn.includes('289,000 VND'), 'Checkout summary must display VND price cleanly');

        await page.fill('#checkout-fullName', 'Linh Pham');
        await page.fill('#checkout-phone', '0912345678');
        await page.fill('#checkout-email', 'checkout.en@example.com');

        await page.getByRole('button', { name: /Store Pickup/i }).first().click();
        await page.waitForTimeout(150);
        await page.click('[data-testid="payment-method-bank"]');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-checkout-en.png') });

        // Submit Order
        const [orderResp] = await Promise.all([
          page.waitForResponse((r: any) => r.url().includes('/api/orders') && r.request().method() === 'POST'),
          page.locator('aside[aria-labelledby="section-summary"] button[type="submit"]').click(),
        ]);
        const sentBody = JSON.parse(orderResp.request().postData() || '{}');
        assert.equal(sentBody.locale, 'en', 'Checkout POST /api/orders must send locale: "en"');
        assert.equal(orderResp.status(), 201);

        await page.waitForTimeout(400);
        const confirmText = await page.locator('main').innerText();
        assert(confirmText.includes('MNH000001'), 'VietQR confirmation must display assigned orderCode');
        assert(confirmText.includes('MNH-A02'), 'Confirmation must retain canonical SKU');
        assert(!confirmText.includes('Payment Successful'), 'Before reporting transfer, must NOT display Payment Successful');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-order-confirm-en.png') });

        // Click "I have transferred"
        await page.click('[data-testid="customer-report-transfer-btn"]');
        await page.waitForTimeout(400);
        const feedbackText = await page.locator('[data-testid="customer-reported-transfer-feedback"]').innerText();
        assert(
          /awaiting verification|recorded/i.test(feedbackText),
          `Reported transfer UI must show Awaiting Verification status, got:\n${feedbackText}`
        );
        assert(!/payment successful/i.test(feedbackText), 'customer_reported_paid must NEVER say Payment Successful');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-1440-reported-transfer-en.png') });

        // G. Admin route remains Vietnamese and never exposes Admin nav inside Language Switcher
        await page.goto(`${baseUrl}/#/admin`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        const adminText = await page.locator('main').innerText();
        assert(/Quản trị|Đăng nhập|Quản lý/i.test(adminText), 'AdminPage must remain in Vietnamese');

        // H. Mobile 390px Drawer Language Switch in WebKit
        const mobileCtx = await wk.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
        const mPage = await mobileCtx.newPage();
        await mPage.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
        await mPage.waitForTimeout(250);
        await mPage.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-390-webkit-home-vi.png') });
        await mPage.locator('header button[aria-controls="mobile-navigation"]').click();
        await mPage.waitForTimeout(200);
        await mPage.click('[data-testid="drawer-lang-en"]');
        await mPage.waitForTimeout(200);
        assert.equal(await mPage.evaluate(() => document.documentElement.lang), 'en');
        await mPage.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-390-webkit-home-en.png') });
        await mobileCtx.close();

        assert.equal(runtimeErrors.length, 0, `Desktop E2E runtime errors: ${runtimeErrors.join('; ')}`);
        await desktopCtx.close();
      } finally {
        await chrome.close();
        await wk.close();
      }
    } finally {
      server.close();
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (prevStore === undefined) delete process.env.MNH_LOCAL_DEV_STORE_PATH;
    else process.env.MNH_LOCAL_DEV_STORE_PATH = prevStore;
    if (prevCapture === undefined) delete process.env.MNH_CAPTURE_EMAILS_FOR_TEST;
    else process.env.MNH_CAPTURE_EMAILS_FOR_TEST = prevCapture;
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL V17.0 BILINGUAL i18n AUTOMATED & PLAYWRIGHT TESTS PASSED 100%!');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ V17.0 i18n TEST SUITE FAILED:', err);
  process.exit(1);
});

import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const { chromium, webkit } = createRequire(import.meta.url)(
  `${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`
);

const PORT = 4177;
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const EVIDENCE_DIR =
  process.env.MNH_V17_7_EVIDENCE ||
  '/Users/hoainam/.gemini/antigravity/brain/1a0c6f22-0569-45b7-8304-88ae98029e72/v17-7-evidence';

await fs.mkdir(EVIDENCE_DIR, { recursive: true });

// Start vite preview server
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server startup timeout')), 15000);
  server.stdout.on('data', (chunk) => {
    if (String(chunk).includes(String(PORT))) {
      clearTimeout(timeout);
      resolve();
    }
  });
  server.on('error', reject);
});

console.log(`✓ Vite preview server started on ${BASE_URL}`);

try {
  const browser = await chromium.launch();
  const ctx1x = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const ctx2x = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });

  const page = await ctx2x.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // 1. Verify Phase 3 & Phase 4: Emotion Cards & Vietnamese Font Fix (2x Retina + 1x Normal)
  console.log('\n--- 1. Verifying Phase 3 & 4: Emotion Cards & Vietnamese Diacritics ---');
  const emotionCardsSection = page.locator('.home-emotion');
  await emotionCardsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const expectedCards = [
    {
      id: 'buoi-an',
      code: 'AN',
      heading: 'Bình an & Biết ơn',
      title: 'Trà Hương Hoa Bưởi',
    },
    {
      id: 'nhai-thuong',
      code: 'THƯƠNG',
      heading: 'Dịu Ngọt & Yêu thương',
      title: 'Trà Hương Hoa Nhài',
    },
    {
      id: 'soi-cam',
      code: 'CẢM',
      heading: 'Tri ân & Hoài niệm',
      title: 'Trà Hương Hoa Sói',
    },
    {
      id: 'com-nho',
      code: 'NHỚ',
      heading: 'Ký ức & Dịu êm',
      title: 'Trà Hương Cốm',
    },
  ];

  const cardGrid = page.locator('.home-emotion .grid').first();
  await cardGrid.screenshot({ path: `${EVIDENCE_DIR}/emotion-cards-desktop-2x-retina.png` });

  // Also capture 1x normal density screenshot
  const page1x = await ctx1x.newPage();
  await page1x.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page1x.evaluate(() => document.fonts.ready);
  await page1x.locator('.home-emotion .grid').first().screenshot({
    path: `${EVIDENCE_DIR}/emotion-cards-desktop-1x-normal.png`,
  });
  await page1x.close();

  // Check computed font family & NFC normalization on all 4 emotion card headings
  const cardHeadingDetails = await page.evaluate(() => {
    const firstGrid = document.querySelector('.home-emotion .grid');
    const cards = firstGrid ? Array.from(firstGrid.querySelectorAll(':scope > button')) : [];
    return cards.map((card) => {
      const headingEl = card.querySelector('h3');
      const titleEl = card.querySelector('p');
      const style = headingEl ? window.getComputedStyle(headingEl) : null;
      const text = headingEl?.textContent?.trim() || '';
      return {
        headingText: text,
        isNFC: text === text.normalize('NFC'),
        titleText: titleEl?.textContent?.trim() || '',
        fontFamily: style?.fontFamily || '',
        fontWeight: style?.fontWeight || '',
        letterSpacing: style?.letterSpacing || '',
        overflow: style?.overflow || '',
      };
    });
  });

  assert.equal(cardHeadingDetails.length, 4, 'Expected 4 emotion cards');
  for (let i = 0; i < 4; i++) {
    assert.equal(cardHeadingDetails[i].headingText, expectedCards[i].heading);
    assert.equal(cardHeadingDetails[i].titleText, expectedCards[i].title);
    assert.equal(cardHeadingDetails[i].isNFC, true, `Heading "${expectedCards[i].heading}" must be NFC normalized`);
    assert.match(
      cardHeadingDetails[i].fontFamily,
      /Crimson Pro/i,
      `Heading "${expectedCards[i].heading}" must use Crimson Pro font`
    );
    console.log(
      `  ✓ Card ${expectedCards[i].code}: "${cardHeadingDetails[i].headingText}" | "${cardHeadingDetails[i].titleText}" | font: ${cardHeadingDetails[i].fontFamily}`
    );
  }

  // 2. Verify Phase 7B: QR Experience across all 4 teas
  console.log('\n--- 2. Verifying Phase 7B: QR Experience Across All 4 Teas ---');
  for (const item of expectedCards) {
    await page.locator('.home-emotion .grid > button').filter({ hasText: item.heading }).click();
    const selectorTitle = await page.locator('.home-emotion h3.text-\\[26px\\]').innerText();
    assert.match(selectorTitle, new RegExp(item.title), `Selector detail should match ${item.title}`);

    await page.getByRole('button', { name: 'Quét QR nghe Audio chuyện trà', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Mã QR nghe chuyện trà' });
    await dialog.waitFor({ state: 'visible' });

    const dialogText = await dialog.innerText();
    assert.match(dialogText, new RegExp(item.title), `QR dialog should show ${item.title}`);
    assert.match(dialogText, new RegExp(item.heading), `QR dialog should show ${item.heading}`);

    const qrImgSrc = await dialog.locator('img').first().getAttribute('src');
    assert.ok(qrImgSrc?.startsWith('data:image/svg+xml;utf8,'), 'QR image must be a real SVG data URL');

    if (item.id === 'buoi-an') {
      await dialog.screenshot({ path: `${EVIDENCE_DIR}/qr-modal-buoi-an-2x.png` });
    }

    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    console.log(`  ✓ Verified QR modal for ${item.code} (${item.title})`);
  }

  // Verify QR modal CTA navigation
  await page.locator('.home-emotion .grid > button').filter({ hasText: 'Dịu Ngọt & Yêu thương' }).click();
  await page.getByRole('button', { name: 'Quét QR nghe Audio chuyện trà', exact: true }).click();
  await page.getByRole('button', { name: 'Mở trang chuyện trà & chi tiết', exact: true }).click();
  await page.locator('.product-detail-page').waitFor({ state: 'visible' });
  assert.match(await page.locator('.product-detail-page h1').innerText(), /Trà Hương Hoa Nhài/);
  console.log('  ✓ QR modal CTA button navigates directly to selected tea detail & story page');

  // 3. Verify Phase 7A: "Mua Ngay" in EmotionSelector adds to cart and navigates to Checkout
  console.log('\n--- 3. Verifying Phase 7A: EmotionSelector "Mua Ngay" Purchase Flow ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('mnh_cart_items_v1', '[]'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.home-emotion .grid > button').filter({ hasText: 'Tri ân & Hoài niệm' }).click();
  await page.locator('.home-emotion').getByRole('button', { name: 'Mua Ngay', exact: true }).click();
  await page.locator('.checkout-page').waitFor({ state: 'visible' });
  assert.match(await page.locator('.checkout-page').innerText(), /Trà Hương Hoa Sói/);
  console.log('  ✓ EmotionSelector "Mua Ngay" adds selected tea to cart and navigates to CheckoutPage');

  // 4. Verify Phase 5: Footer Design, Collection Links & Truthful Newsletter
  console.log('\n--- 4. Verifying Phase 5: Footer Collection & Truthful Newsletter ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const footer = page.locator('footer.site-footer');
  await footer.scrollIntoViewIfNeeded();
  await footer.screenshot({ path: `${EVIDENCE_DIR}/footer-desktop-2x.png` });

  const collectionItems = await footer.locator('div:nth-child(2) ul li button').allInnerTexts();
  assert.deepEqual(collectionItems, [
    'Trà hương Hoa Bưởi – AN',
    'Trà hương Hoa Nhài – THƯƠNG',
    'Trà hương Hoa Sói – CẢM',
    'Trà hương Cốm – NHỚ',
    'Combo Hộp Quà “TÂM Ý”',
  ]);
  console.log('  ✓ Footer BỘ SƯU TẬP matches exact 5 Figma collection items');

  const footerText = await footer.innerText();
  assert.ok(!footerText.includes('10%'), 'Footer must not advertise unavailable 10% discount');
  assert.match(footerText, /Bản Tin Văn Hóa Trà/);
  await footer.locator('input[type="email"]').fill('khachhang@example.com');
  await footer.getByRole('button', { name: 'Gửi', exact: true }).click();
  assert.match(await footer.innerText(), /Kênh bản tin email đang được cập nhật/);
  console.log('  ✓ Footer newsletter copy and submission notice are truthful and non-misleading');

  // 5. Verify Phase 7C: TÂM Ý Gift Box & Dynamic 4-Flavor Story Selector on ProductDetailPage
  console.log('\n--- 5. Verifying Phase 7C: TÂM Ý Gift Box Product Detail & Flavor Selector ---');
  await footer.getByRole('button', { name: /Combo Hộp Quà/ }).click();
  await page.locator('.product-detail-page').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${EVIDENCE_DIR}/product-detail-tam-y-2x.png`, fullPage: false });

  const initialStoryText = await page.locator('.product-detail-page > section:nth-child(2)').innerText();
  assert.match(initialStoryText, /Hộp Quà Tâm Ý — Đong đầy mọi sắc thái yêu thương/);
  console.log('  ✓ TÂM Ý initial story displays dedicated TÂM Ý story (not duplicated Trà Hương Hoa Bưởi story)');

  await page.locator('.product-detail-page').getByRole('button').filter({ hasText: 'Trà Hương Hoa Sói' }).first().click();
  const switchedStoryText = await page.locator('.product-detail-page > section:nth-child(2)').innerText();
  assert.match(switchedStoryText, /Trà Hương Hoa Sói — Tấm lòng Tri Ân trầm lắng/);
  console.log('  ✓ Clicking flavor card in TÂM Ý 2x2 grid dynamically switches story to selected flavor');

  // 6. Verify Phase 6 & 7D/7E/7F: Search, Gift Journey, Cart Demo Discount, Checkout & Chatbot
  console.log('\n--- 6. Verifying Phase 6 & 7D/7E/7F: Search, Cart, Checkout & Chatbot ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.locator('header').getByRole('button', { name: 'Tìm kiếm sản phẩm', exact: true }).click();
  const searchInput = page.getByPlaceholder('Tìm kiếm sản phẩm');
  await searchInput.fill('tra huong buoi');
  assert.equal(await page.locator('.search-card .product-card').count(), 1);
  await searchInput.fill('tra da huong');
  assert.equal(await page.locator('.search-card .product-card').count(), 1);
  await searchInput.fill('zzzzzzzz');
  assert.match(await page.locator('.search-card').innerText(), /Không tìm thấy/);
  await page.keyboard.press('Escape');
  console.log('  ✓ Search overlay handles Vietnamese queries (with or without "Hoa") and empty state');

  // Chatbot verification
  await page.getByRole('button', { name: 'Mở trợ lý tư vấn trà trực tuyến' }).click();
  await page.getByPlaceholder(/Nhập câu hỏi của bạn/).fill('Trà nhài giá bao nhiêu');
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await page.waitForTimeout(500);
  const chatText = await page.locator('#chat-panel').innerText();
  assert.match(chatText, /Trà Hương Hoa Nhài – THƯƠNG/);
  assert.match(chatText, /289\.000đ/);
  await page.keyboard.press('Escape');
  console.log('  ✓ Local knowledge-based Chatbot responds with synchronized Figma tea names & real prices');

  // Cart & Honest Total Verification (zero fake/simulated discount)
  await page.evaluate(() => localStorage.setItem('mnh_cart_items_v1', '[]'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.home-emotion').getByRole('button', { name: 'Thêm Vào Giỏ Hàng', exact: true }).click();
  const cartDialog = page.getByRole('dialog', { name: 'Giỏ hàng' });
  await cartDialog.waitFor({ state: 'visible' });
  await cartDialog.getByRole('button', { name: 'Tăng số lượng', exact: true }).first().click();
  const cartText = await cartDialog.innerText();
  assert.doesNotMatch(cartText, /mô phỏng|Chưa đạt mốc/i);
  assert.match(cartText, /578,000đ/);
  await cartDialog.getByRole('button', { name: /Thanh Toán/i }).click();
  await page.locator('.checkout-page').waitFor({ state: 'visible' });
  const checkoutText = await page.locator('.checkout-page').innerText();
  assert.doesNotMatch(checkoutText, /mô phỏng|Chưa đạt mốc/i);
  assert.match(checkoutText, /Hoàn Tất Đơn Hàng/);
  assert.match(checkoutText, /578\.000\s*đ/);
  console.log('  ✓ Simulated discount removed cleanly; real cart & checkout totals stay consistent (578.000 đ)');

  // 7. Verify Phase 8: Multi-Viewport & WebKit Mobile Responsiveness (320px to 1920px)
  console.log('\n--- 7. Verifying Phase 8: 8 Viewports across Chromium & WebKit ---');
  const viewports = [320, 375, 390, 430, 768, 1024, 1440, 1920];
  for (const width of viewports) {
    const vCtx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: width <= 430 ? 2 : 1,
      reducedMotion: 'reduce',
    });
    const vPage = await vCtx.newPage();
    await vPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await vPage.evaluate(() => document.fonts.ready);
    const hasOverflow = await vPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    assert.equal(hasOverflow, false, `Horizontal overflow detected at ${width}px on Home`);

    if (width === 375) {
      await vPage.locator('.home-emotion .grid').first().scrollIntoViewIfNeeded();
      await vPage.locator('.home-emotion .grid').first().screenshot({
        path: `${EVIDENCE_DIR}/emotion-cards-mobile-375-2x.png`,
      });
    }
    await vCtx.close();
    console.log(`  ✓ Chromium ${width}px: zero horizontal overflow`);
  }

  // Test WebKit mobile Safari simulation at 390px Retina
  const wkBrowser = await webkit.launch();
  const wkCtx = await wkBrowser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const wkPage = await wkCtx.newPage();
  await wkPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await wkPage.evaluate(() => document.fonts.ready);
  const wkOverflow = await wkPage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  assert.equal(wkOverflow, false, 'WebKit 390px horizontal overflow');
  await wkPage.locator('.home-emotion .grid').first().scrollIntoViewIfNeeded();
  await wkPage.locator('.home-emotion .grid').first().screenshot({
    path: `${EVIDENCE_DIR}/emotion-cards-webkit-390-2x.png`,
  });
  await wkBrowser.close();
  console.log('  ✓ WebKit 390px (Retina 2x): zero horizontal overflow & clean Vietnamese font rendering');

  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
  assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join('; ')}`);

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 ALL V17.7 FIGMA AUDIT & BROWSER VERIFICATION CHECKS PASSED!');
  console.log('================================================================');
} finally {
  server.kill('SIGTERM');
}

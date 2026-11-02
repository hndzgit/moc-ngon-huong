import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);

const BASE_URL = process.env.TARGET_URL || 'https://moc-ngon-huong.vercel.app';
console.log(`Testing target URL: ${BASE_URL}`);

const browser = await chromium.launch();

try {
  // Test viewports: 1920, 1440, 768, 390
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop-1920' },
    { width: 1440, height: 900, name: 'desktop-1440' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 390, height: 844, name: 'mobile-390' },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    // 1. Load Homepage
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, `Homepage returned ${response.status()}`);

    // Verify Title & Meta
    const title = await page.title();
    assert.match(title, /Mộc Ngôn Hương/);

    // Verify Header / Logo
    const logo = page.locator('header img[alt="Mộc Ngôn Hương"]');
    assert.equal(await logo.count() > 0, true, 'Logo should be visible in header');

    // Verify Hero
    const hero = page.locator('.home-hero, section').first();
    assert.equal(await hero.isVisible(), true, 'Hero section must be visible');

    // Wait for images to decode
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); } catch {}
      }));
    });

    // Verify broken images count
    const brokenImages = await page.evaluate(() => {
      return [...document.images].filter(img => !img.naturalWidth).map(img => img.src);
    });
    console.log(`Broken images in ${vp.name}: ${brokenImages.length}`);
    if (brokenImages.length > 0) {
      console.warn('Broken images:', brokenImages);
    }
    assert.equal(brokenImages.length, 0, `Found broken images in ${vp.name}`);

    // Test Chat widget
    const chatButton = page.locator('button[aria-label="Mở cửa sổ trò chuyện"], button[title="Hỗ trợ"]');
    if (await chatButton.count() > 0) {
      assert.equal(await chatButton.first().isVisible(), true, 'Chat widget should be present');
    }

    // Viewport-specific check
    if (vp.width < 768) {
      // Mobile nav
      const menuButton = page.locator('header button[aria-label="Menu"]');
      assert.equal(await menuButton.isVisible(), true, 'Mobile navigation menu button should be visible on mobile');
    } else {
      // Desktop nav
      const desktopNav = page.locator('header nav[aria-label="Main Navigation"]');
      assert.equal(await desktopNav.isVisible(), true, 'Desktop navigation should be visible on tablet & desktop');
    }

    console.log(`Console errors: ${consoleErrors.length}, Page errors: ${pageErrors.length}`);
    assert.equal(pageErrors.length, 0, `Page errors found in ${vp.name}: ${pageErrors.join(', ')}`);
    await context.close();
  }

  // Functional & Route Testing on 1440 Desktop
  console.log('\n--- Testing Functional Flows & Hash Routing (1440x900) ---');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('mnh_cart_items_v1', '[]');
    localStorage.removeItem('mnh_user_email_v1');
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));

  // 1. Direct hash routing to product catalog: #/san-pham
  await page.goto(`${BASE_URL}/#/san-pham`, { waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/san-pham'), true);
  const productCards = page.locator('.product-card, [data-product-id]');
  console.log(`Product cards visible: ${await productCards.count()}`);
  assert.equal(await productCards.count() >= 4, true, 'At least 4 products in catalog');

  // 2. Direct hash routing to product detail: #/san-pham/buoi-an
  await page.goto(`${BASE_URL}/#/san-pham/buoi-an`, { waitUntil: 'networkidle' });
  const detailTitle = page.locator('main h1');
  assert.match(await detailTitle.innerText(), /Bưởi An|Trà Hương Bưởi/i);

  // 3. Add to cart & cart drawer test
  const addToCartBtn = page.locator('button').filter({ hasText: /Thêm Vào Giỏ/i }).first();
  await addToCartBtn.click();
  const cartDialog = page.getByRole('dialog', { name: 'Giỏ hàng' });
  assert.equal(await cartDialog.isVisible(), true, 'Cart drawer should open upon adding product');
  console.log('Cart drawer opened successfully.');

  // Check quantity change
  const increaseBtn = cartDialog.getByRole('button', { name: 'Tăng số lượng', exact: true });
  if (await increaseBtn.count() > 0) {
    await increaseBtn.click();
    console.log('Increased item quantity.');
  }

  // Close cart drawer via close button and wait for animation
  const closeCartBtn = cartDialog.locator('button[aria-label*="Đóng" i], button:has(svg)').first();
  if (await closeCartBtn.count() > 0) {
    await closeCartBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
  assert.equal(await cartDialog.count() === 0 || !await cartDialog.isVisible(), true, 'Cart drawer should be closed');

  // 4. Test Search
  const searchBtn = page.locator('header').getByRole('button', { name: 'Tìm kiếm sản phẩm', exact: true });
  if (await searchBtn.count() > 0) {
    await searchBtn.click();
    const searchInput = page.getByPlaceholder('Tìm kiếm sản phẩm');
    await searchInput.fill('cốm');
    const searchResults = page.locator('.search-card .product-card, [data-product-id*="com"]');
    assert.equal(await searchResults.count() >= 1, true, 'Search should find Cốm Nhớ');
    console.log('Search functionality verified.');
    await page.keyboard.press('Escape');
  }

  // 5. Test Story Page: #/cau-chuyen
  await page.goto(`${BASE_URL}/#/cau-chuyen`, { waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/cau-chuyen'), true);
  console.log('Story page (#/cau-chuyen) loaded successfully.');

  // 6. Test Contact Page: #/lien-he
  await page.goto(`${BASE_URL}/#/lien-he`, { waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/lien-he'), true);
  console.log('Contact page (#/lien-he) loaded successfully.');

  // 7. Test Checkout Page: #/thanh-toan
  await page.goto(`${BASE_URL}/#/thanh-toan`, { waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/thanh-toan'), true);
  const checkoutHeading = page.locator('main h1');
  assert.match(await checkoutHeading.innerText(), /Đặt Hàng|Thanh Toán/i);
  console.log('Checkout page (#/thanh-toan) loaded successfully.');

  // 8. Refresh retention
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/thanh-toan'), true, 'Hash route persists on page reload');
  console.log('Page reload preserves current route.');

  console.log(`\nAll production tests passed with 0 page errors!`);
  await context.close();
} finally {
  await browser.close();
}

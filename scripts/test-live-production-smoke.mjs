import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);

console.log('=== BẮT ĐẦU KIỂM THỬ LIVE SMOKE TEST TRÊN DOMAIN CHÍNH THỨC ===');
console.log('Production URL: https://mocngonhuong.com\n');

const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // 1. Kiểm thử Trang Chủ Live
  console.log('--- 1. Kiểm thử Trang Chủ Live (https://mocngonhuong.com/#/) ---');
  await page.goto('https://mocngonhuong.com/#/');
  await page.waitForTimeout(1000);

  const title = await page.title();
  assert.match(title, /Mộc Ngôn Hương/, 'Tiêu đề trang web phải chứa Mộc Ngôn Hương');
  console.log(`  ✓ [PASS] Tiêu đề trang: "${title}"`);

  const heroBrand = page.locator('text=Mộc Ngôn Hương').first();
  assert.equal(await heroBrand.isVisible(), true, 'Thương hiệu Mộc Ngôn Hương hiển thị trên trang chủ');
  console.log('  ✓ [PASS] Brand heading và nội dung trang chủ hiển thị hoàn hảo');

  // 2. Kiểm thử Màn hình Tài Khoản / Đăng Nhập Live
  console.log('\n--- 2. Kiểm thử Màn hình Tài Khoản Live (https://mocngonhuong.com/#/tai-khoan) ---');
  await page.goto('https://mocngonhuong.com/#/tai-khoan');
  await page.waitForTimeout(800);

  const loginTab = page.locator('button:has-text("Đăng nhập")').first();
  assert.equal(await loginTab.isVisible(), true, 'Nút Đăng nhập có mặt');

  const emailField = page.locator('input[type="email"]');
  const passField = page.locator('input[type="password"]');
  assert.equal((await emailField.count()) > 0, true, 'Trường nhập email có mặt');
  assert.equal((await passField.count()) > 0, true, 'Trường nhập mật khẩu có mặt');
  console.log('  ✓ [PASS] Màn hình Tài Khoản / Đăng Nhập hoạt động ổn định trên Production');

  // 3. Kiểm thử API Endpoints Live
  console.log('\n--- 3. Kiểm thử API Endpoints Live ---');
  const apiOrdersRes = await fetch('https://mocngonhuong.com/api/orders');
  assert.equal(apiOrdersRes.status, 200, '/api/orders phải trả về HTTP 200');
  const apiOrdersData = await apiOrdersRes.json();
  assert.equal(apiOrdersData.status, 'ok', 'Status phải là ok');
  assert.equal(apiOrdersData.version, '13.4.0', 'Version phải là 13.4.0');
  console.log('  ✓ [PASS] /api/orders hoạt động chính xác:', JSON.stringify(apiOrdersData));

  const apiMeOrdersRes = await fetch('https://mocngonhuong.com/api/me/orders');
  assert.equal(apiMeOrdersRes.status, 401, '/api/me/orders không có token phải trả về HTTP 401');
  const apiMeOrdersData = await apiMeOrdersRes.json();
  assert.equal(apiMeOrdersData.success, false, 'Yêu cầu không token phải bị từ chối');
  console.log('  ✓ [PASS] /api/me/orders bảo mật chuẩn xác:', JSON.stringify(apiMeOrdersData));

  // 4. Kiểm thử Responsive Viewports trên Production
  console.log('\n--- 4. Kiểm thử Responsive Viewports trên Production ---');
  const viewports = [
    { width: 360, height: 740, name: 'Mobile nhỏ (360px)' },
    { width: 390, height: 844, name: 'iPhone 14 (390px)' },
    { width: 768, height: 1024, name: 'Tablet iPad (768px)' },
    { width: 1440, height: 900, name: 'Desktop chuẩn (1440px)' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.equal(hasHorizontalScroll, false, `Không tràn layout ngang tại ${vp.name}`);
    console.log(`  ✓ [PASS] Responsive ${vp.name}: Chuẩn xác, không tràn màn hình`);
  }

  // 5. Kiểm tra lỗi trang
  if (pageErrors.length > 0) {
    console.error('Lỗi JavaScript trên trang live:', pageErrors);
  }
  assert.equal(pageErrors.length, 0, 'Không có lỗi runtime JavaScript nào trên trang live');
  console.log('\n=== TẤT CẢ CÁC BƯỚC SMOKE TEST TRÊN MOCNGONHUONG.COM ĐÃ VƯỢT QUA 100%! ===');
} finally {
  await browser.close();
}

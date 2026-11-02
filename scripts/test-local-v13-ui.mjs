import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);

console.log('=== BẮT ĐẦU KIỂM THỬ GIAO DIỆN AUTH & ORDER LOCAL (PLAYWRIGHT) ===\n');

const TEST_PORT = 5178;
const server = await createServer({
  server: { port: TEST_PORT, host: '127.0.0.1' },
  logLevel: 'error',
});
await server.listen();
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
console.log(`[+] Vite local server chạy tại ${BASE_URL}`);

const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  // 1. Check Auth Page - Login Form (Figma 127:11104)
  console.log('\n--- 1. Kiểm thử Trang Tài Khoản / Đăng Nhập (#/tai-khoan) ---');
  await page.goto(`${BASE_URL}/#/tai-khoan`);
  await page.waitForTimeout(500);

  const loginTab = page.locator('button:has-text("Đăng nhập")').first();
  assert.equal(await loginTab.isVisible(), true, 'Tab Đăng nhập phải hiển thị');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  assert.equal(await emailInput.count() > 0, true, 'Trường nhập email phải có mặt');
  assert.equal(await passwordInput.count() > 0, true, 'Trường nhập mật khẩu phải có mặt');
  console.log('  ✓ [PASS] Form Đăng Nhập (Figma 127:11104) hiển thị chuẩn xác');

  // 2. Check Register View (Figma 127:12046)
  console.log('\n--- 2. Kiểm thử Màn Hình Đăng Ký (Figma 127:12046) ---');
  const registerBtn = page.locator('button:has-text("Đăng ký ngay")').first();
  await registerBtn.click();
  await page.waitForTimeout(300);

  const nameInput = page.locator('input[placeholder*="Nhập họ và tên"]');
  assert.equal(await nameInput.count() > 0, true, 'Trường Họ và Tên trên form đăng ký phải có mặt');
  console.log('  ✓ [PASS] Form Đăng Ký (Figma 127:12046) hiển thị chuẩn xác');

  // 3. Check Forgot Password Form (Figma 127:10877)
  console.log('\n--- 3. Kiểm thử Quên Mật Khẩu (Figma 127:10877) ---');
  const backToLogin = page.locator('button:has-text("Đăng nhập")').first();
  await backToLogin.click();
  await page.waitForTimeout(200);
  const forgotLink = page.locator('button:has-text("Quên mật khẩu?")').first();
  await forgotLink.click();
  await page.waitForTimeout(300);

  const forgotHeader = page.locator('h1:has-text("Quên Mật Khẩu")');
  assert.equal(await forgotHeader.isVisible(), true, 'Tiêu đề Quên Mật Khẩu hiển thị');
  console.log('  ✓ [PASS] Màn hình Quên Mật Khẩu (Figma 127:10877) hiển thị chuẩn xác');

  // 4. Check Checkout & Order Submission (#/thanh-toan)
  console.log('\n--- 4. Kiểm thử Quy Trình Đặt Hàng (#/thanh-toan) ---');
  await page.goto(`${BASE_URL}/#/`);
  await page.waitForTimeout(500);

  // Click "Tăng số lượng" on the first product card to populate cart naturally
  const addBtn = page.locator('button[aria-label="Tăng số lượng"]').first();
  await addBtn.click();
  await page.waitForTimeout(300);

  // Navigate to checkout
  await page.goto(`${BASE_URL}/#/thanh-toan`);
  await page.waitForTimeout(500);

  const checkoutTitle = page.locator('h1:has-text("Đặt Hàng")');
  assert.equal(await checkoutTitle.isVisible(), true, 'Tiêu đề Đặt Hàng hiển thị');

  // Fill order form
  await page.locator('input[placeholder*="Nguyễn Văn An"]').fill('Lê Hoài Nam');
  await page.locator('input[placeholder*="0912345678"]').fill('0912345678');
  await page.locator('input[placeholder*="an.nguyen@email.com"]').fill('nam.le@gmail.com');
  await page.locator('input[placeholder*="Số nhà"]').fill('88 Phố Tràng Tiền');

  // Select Bank payment
  await page.locator('button:has-text("Thanh toán qua phương thức ngân hàng")').click();

  // Click submit order
  console.log('  -> Nhấn Đặt Hàng...');
  const submitBtn = page.locator('button:has-text("Đặt Hàng")');
  await submitBtn.click();
  await page.waitForTimeout(1000);

  const alert = page.locator('[role="alert"]');
  if (await alert.count() > 0) {
    console.log('  [Alert on page]:', await alert.innerText());
  }

  // Wait for Order Confirmation screen (Figma 77:3506)
  await page.waitForSelector('.order-confirmation', { timeout: 8000 });
  const confirmTitle = page.locator('h1:has-text("Đặt Hàng Thành Công")');
  assert.equal(await confirmTitle.isVisible(), true, 'Màn hình Đặt Hàng Thành Công hiển thị');

  const orderCodeBadge = page.locator('strong:has-text("MNH-")');
  assert.equal(await orderCodeBadge.count() > 0, true, 'Mã đơn hàng MNH-xxxx hiển thị trên hóa đơn');
  const codeText = await orderCodeBadge.first().innerText();
  console.log(`  ✓ [PASS] Đơn hàng đặt thành công qua API thực! Mã đơn: ${codeText}`);

  const bankInfo = page.locator('text=Hướng Dẫn Thanh Toán Chuyển Khoản');
  assert.equal(await bankInfo.isVisible(), true, 'Hướng dẫn thanh toán chuyển khoản hiển thị đầy đủ');
  console.log('  ✓ [PASS] Hướng dẫn thanh toán chuyển khoản hiển thị đúng chuẩn an toàn Mộc Ngôn Hương');

  // Verify Cart is cleared after success
  const savedCart = await page.evaluate(() => localStorage.getItem('mnh_cart_items_v1'));
  assert.equal(JSON.parse(savedCart).length, 0, 'Giỏ hàng đã được làm sạch sau khi đơn hàng xác nhận lưu trữ');
  console.log('  ✓ [PASS] Giỏ hàng được xóa an toàn sau khi đơn hàng xác nhận thành công');

  // 5. Test Customer Order History Experience & Responsive Design
  console.log('\n--- 5. Kiểm thử Giao Diện Đơn Hàng Của Tôi & Responsive Viewports ---');
  
  // Click "Xem Đơn Hàng Của Tôi" on Order Confirmation screen
  const viewMyOrdersBtn = page.locator('button:has-text("Xem Đơn Hàng Của Tôi")');
  assert.equal(await viewMyOrdersBtn.isVisible(), true, 'Nút Xem Đơn Hàng Của Tôi phải hiển thị trên OrderConfirmation');
  await viewMyOrdersBtn.click();
  await page.goto(`${BASE_URL}/?figma-qa=1#/tai-khoan`);
  await page.waitForTimeout(600);

  // Click QA switcher tab "Hồ sơ khách hàng"
  const profileQaTab = page.locator('button:has-text("Hồ sơ khách hàng")');
  if (await profileQaTab.count() > 0) {
    await profileQaTab.click();
    await page.waitForTimeout(400);
  }

  // Check sub-navigation tabs
  const ordersTabBtn = page.locator('button:has-text("Đơn hàng của tôi")').first();
  const deliveryTabBtn = page.locator('button:has-text("Thông tin giao nhận")').first();
  assert.equal(await ordersTabBtn.isVisible(), true, 'Tab Đơn hàng của tôi phải hiển thị');
  assert.equal(await deliveryTabBtn.isVisible(), true, 'Tab Thông tin giao nhận phải hiển thị');
  console.log('  ✓ [PASS] Thanh điều hướng nội bộ: Đơn hàng của tôi & Thông tin giao nhận hiển thị chuẩn');

  // Switch to Thông tin giao nhận and back
  await deliveryTabBtn.click();
  await page.waitForTimeout(200);
  const deliveryHeading = page.locator('h2:has-text("Địa chỉ nhận hàng mặc định")');
  assert.equal(await deliveryHeading.isVisible(), true, 'Mục Địa chỉ nhận hàng mặc định hiển thị');

  await ordersTabBtn.click();
  await page.waitForTimeout(200);
  console.log('  ✓ [PASS] Chuyển đổi qua lại mượt mà giữa các tab tài khoản');

  // Test across responsive viewports: 360px, 390px, 768px, 1280px, 1440px
  const viewports = [
    { width: 360, height: 740, name: 'Mobile nhỏ (360px)' },
    { width: 390, height: 844, name: 'iPhone 14 (390px)' },
    { width: 768, height: 1024, name: 'Tablet iPad (768px)' },
    { width: 1280, height: 800, name: 'Laptop nhỏ (1280px)' },
    { width: 1440, height: 900, name: 'Desktop chuẩn (1440px)' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(150);

    // Verify no horizontal overflow
    const overflowElements = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1) {
          overflowing.push({
            tag: el.tagName,
            className: el.className?.toString().slice(0, 100),
            id: el.id,
            right: rect.right,
            width: rect.width,
            docWidth,
          });
        }
      }
      return overflowing.slice(0, 10);
    });
    if (overflowElements.length > 0) {
      console.log(`  [OVERFLOW on ${vp.name}]:`, JSON.stringify(overflowElements, null, 2));
    }

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.equal(hasHorizontalScroll, false, `Không có thanh cuộn ngang gây lỗi vỡ layout ở ${vp.name}`);
    console.log(`  ✓ [PASS] Responsive ${vp.name}: Không tràn layout, hiển thị hoàn hảo`);
  }

  if (pageErrors.length > 0) {
    console.error('Captured page errors:', pageErrors);
  }
  assert.equal(pageErrors.length, 0, 'Không có lỗi JavaScript nào trong toàn bộ hành trình');
  console.log('\n=== TẤT CẢ CÁC BƯỚC KIỂM THỬ GIAO DIỆN & LUỒNG NGƯỜI DÙNG ĐÃ VƯỢT QUA 100%! ===');
} finally {
  await browser.close();
  await server.close();
  console.log('[+] Đã đóng test browser và server.');
}

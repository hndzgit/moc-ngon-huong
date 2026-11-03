// scripts/verify-production-live.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools/node_modules/playwright');

const BASE_URL = 'https://mocngonhuong.com/';

const ROUTES = [
  { name: 'Home', path: '' },
  { name: 'Story', path: '#/cau-chuyen' },
  { name: 'Product Detail (Buoi An)', path: '#/san-pham/buoi-an' },
  { name: 'Product Detail (Tam Y)', path: '#/san-pham/hop-qua-tam-y' },
  { name: 'Gift Journey', path: '#/chon-qua' },
  { name: 'Corporate Gifting', path: '#/doanh-nghiep' },
  { name: 'Contact', path: '#/lien-he' },
  { name: 'Auth Login', path: '#/tai-khoan' },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const failedRequests = [];
const consoleErrors = [];

page.on('response', (response) => {
  if (response.status() >= 400 && response.url().includes('mocngonhuong.com')) {
    failedRequests.push({ url: response.url(), status: response.status() });
  }
});

page.on('pageerror', (err) => {
  consoleErrors.push(err.message);
});

console.log(`Testing Live Production Website: ${BASE_URL}...`);

let totalImagesChecked = 0;

for (const route of ROUTES) {
  const url = BASE_URL + route.path;
  console.log(`\nNavigating to ${route.name} (${url})...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Evaluate images on page
  const imageStats = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const broken = images
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.src || img.getAttribute('src'));
    const loaded = images.filter((img) => img.complete && img.naturalWidth > 0).length;
    return {
      total: images.length,
      loaded,
      broken,
    };
  });

  totalImagesChecked += imageStats.total;
  console.log(`  Images found: ${imageStats.total}, loaded: ${imageStats.loaded}, broken: ${imageStats.broken.length}`);

  if (imageStats.broken.length > 0) {
    console.error(`  ❌ Broken images on ${route.name}:`, imageStats.broken);
  } else {
    console.log(`  ✅ All images loaded perfectly on ${route.name}`);
  }

  assert.equal(imageStats.broken.length, 0, `Broken images on ${route.name}`);
}

await browser.close();

console.log(`\n=== SUMMARY ===`);
console.log(`Total images verified: ${totalImagesChecked}`);
console.log(`Failed HTTP requests on production domain: ${failedRequests.length}`);
console.log(`Console errors: ${consoleErrors.length}`);

if (failedRequests.length > 0) {
  console.warn('Failed requests:', failedRequests);
}
if (consoleErrors.length > 0) {
  console.warn('Console errors:', consoleErrors);
}

assert.equal(failedRequests.length, 0, 'No HTTP requests should fail with 404/500');
assert.equal(consoleErrors.length, 0, 'No console errors should occur');

console.log('🎉 ALL LIVE PRODUCTION VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');

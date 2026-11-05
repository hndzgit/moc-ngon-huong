import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('MỘC NGÔN HƯƠNG — V17.5 FOOTER SOCIAL LINKS VERIFICATION SUITE');
console.log('================================================================\n');

const footerPath = path.resolve(process.cwd(), 'src/components/Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');

// 1. Verify Instagram is completely removed
console.log('1. Checking Instagram removal...');
assert(!footerContent.includes('name="instagram"'), 'Instagram icon must be removed from Footer');
assert(!footerContent.toLowerCase().includes('instagram.com'), 'Instagram links must not exist in Footer');
console.log('  ✓ Instagram icon and links are completely absent.');

// 2. Verify Facebook official link and attributes
console.log('\n2. Checking Facebook official link & accessibility...');
const expectedFacebookUrl = 'https://www.facebook.com/p/M%E1%BB%99c-Ng%C3%B4n-H%C6%B0%C6%A1ng-61590217692405/';
assert(footerContent.includes(expectedFacebookUrl), 'Must contain exact official Facebook URL');
assert(footerContent.includes('aria-label="Facebook Mộc Ngôn Hương"'), 'Must have aria-label="Facebook Mộc Ngôn Hương"');
assert(footerContent.includes('title="Facebook Mộc Ngôn Hương"'), 'Must have title="Facebook Mộc Ngôn Hương"');
assert(footerContent.includes('target="_blank"'), 'Must have target="_blank"');
assert(footerContent.includes('rel="noopener noreferrer"'), 'Must have rel="noopener noreferrer"');
assert(footerContent.includes('<FigmaIcon name="facebook" />'), 'Must use official FigmaIcon name="facebook"');
console.log('  ✓ Facebook link, accessibility labels, and official FigmaIcon verified.');

// 3. Verify TikTok official link and attributes
console.log('\n3. Checking TikTok official link & accessibility...');
const expectedTikTokUrl = 'https://www.tiktok.com/@mocngonhuong';
assert(footerContent.includes(expectedTikTokUrl), 'Must contain exact official TikTok URL');
assert(footerContent.includes('aria-label="TikTok Mộc Ngôn Hương"'), 'Must have aria-label="TikTok Mộc Ngôn Hương"');
assert(footerContent.includes('title="TikTok Mộc Ngôn Hương"'), 'Must have title="TikTok Mộc Ngôn Hương"');
assert(footerContent.includes('<FigmaIcon name="tiktok" />'), 'Must use official FigmaIcon name="tiktok"');
console.log('  ✓ TikTok link, accessibility labels, and official FigmaIcon verified.');

// 4. Verify touch target & styling
console.log('\n4. Checking mobile touch target and styling...');
assert(footerContent.includes('w-11 h-11'), 'Must have 44px (w-11 h-11) mobile tap target');
assert(footerContent.includes('focus-visible:ring-2'), 'Must have accessible focus-visible ring');
console.log('  ✓ Touch target and focus states verified.');

// 5. Verify SVG assets exist on disk
console.log('\n5. Checking underlying SVG icon assets...');
const figmaFbSvg = path.resolve(process.cwd(), 'public/assets/figma/originals/39634.svg');
const figmaTikTokSvg = path.resolve(process.cwd(), 'public/assets/figma/originals/eface.svg');
assert(fs.existsSync(figmaFbSvg), '39634.svg (Facebook) must exist');
assert(fs.existsSync(figmaTikTokSvg), 'eface.svg (TikTok) must exist');
console.log('  ✓ Official Figma SVG assets exist and are verified.');

// 6. Verify production build output contains the links
console.log('\n6. Checking built production bundle...');
const distAssets = fs.readdirSync(path.resolve(process.cwd(), 'dist/assets'));
const allJsContent = distAssets
  .filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.resolve(process.cwd(), 'dist/assets', f), 'utf-8'))
  .join('\n');
assert(allJsContent.includes('https://www.tiktok.com/@mocngonhuong'), 'Production JS bundle must include TikTok URL');
assert(allJsContent.includes('61590217692405'), 'Production JS bundle must include Facebook URL');
assert(allJsContent.includes('Facebook Mộc Ngôn Hương'), 'Production JS bundle must include Facebook aria-label');
assert(allJsContent.includes('TikTok Mộc Ngôn Hương'), 'Production JS bundle must include TikTok aria-label');
console.log('  ✓ Production JS bundle confirmed containing exact URLs and accessibility labels.');

console.log('\n================================================================');
console.log('ALL V17.5 FOOTER SOCIAL LINK TESTS PASSED (6/6)');
console.log('================================================================');

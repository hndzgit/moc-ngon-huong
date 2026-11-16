// scripts/test-contact-audit.mjs
// Automated verification for Mộc Ngôn Hương Contact Information Audit & Single-Source Centralization (V17.0.2)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import i18next from 'i18next';
import { BUSINESS_CONTACT } from '../src/lib/contact.js';
import { viResources } from '../src/locales/vi/index.js';
import { enResources } from '../src/locales/en/index.js';
import { STORE_POLICIES } from '../src/assistant/catalogKnowledge.js';
import { STORE_POLICIES_EN } from '../src/assistant/englishNlp.js';
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from '../api/_lib/authEmailTemplates.js';
import { renderEmailSupportFooterHtml } from '../api/_lib/notifications.js';

console.log('=== [TEST] Mộc Ngôn Hương Contact Information Audit & Verification ===\n');

const root = process.cwd();

async function createTranslator(locale) {
  const instance = i18next.createInstance();
  await instance.init({
    lng: locale,
    fallbackLng: 'vi',
    resources: {
      vi: viResources,
      en: enResources,
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance.t.bind(instance);
}

function collectSourceFiles(dirPath, exts = ['.ts', '.tsx']) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === 'address' || entry.name === 'node_modules') continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const tVi = await createTranslator('vi');
const tEn = await createTranslator('en');

// Validate canonical contact constants first
assert.equal(BUSINESS_CONTACT.hotlineDisplay, '0889 742 556');
assert.equal(BUSINESS_CONTACT.hotlineTelHref, 'tel:+84889742556');
assert.equal(BUSINESS_CONTACT.email, 'mocngonhuong@gmail.com');
assert.equal(BUSINESS_CONTACT.emailMailtoHref, 'mailto:mocngonhuong@gmail.com');

// 1. Check ContactPage.tsx + VI/EN translations
{
  console.log('[1/8] Verifying src/pages/ContactPage.tsx & localized contact metadata...');
  const contactContent = fs.readFileSync(path.join(root, 'src/pages/ContactPage.tsx'), 'utf-8');
  assert(!contactContent.includes('(Ms. My)'), 'ContactPage must not contain personal name "(Ms. My)"');
  assert(!contactContent.includes('098.765.4321'), 'ContactPage must not contain old phone 098.765.4321');
  assert(contactContent.includes('BUSINESS_CONTACT.hotlineDisplay'), 'ContactPage must reference BUSINESS_CONTACT.hotlineDisplay');
  assert(contactContent.includes('BUSINESS_CONTACT.hotlineTelHref'), 'ContactPage must use clickable tel href constant');
  assert(contactContent.includes('BUSINESS_CONTACT.emailMailtoHref'), 'ContactPage must use clickable mailto href constant');
  assert(Boolean(tVi('gifting:contact.hotlineTitle')), 'VI contact.hotlineTitle must resolve');
  assert(Boolean(tEn('gifting:contact.hotlineTitle')), 'EN contact.hotlineTitle must resolve');
  console.log('✓ PASS: ContactPage uses centralized clickable VI/EN business contact constants.');
}

// 2. Check ChatBox.tsx & Bilingual Assistant Knowledge (VI + EN)
{
  console.log('[2/8] Verifying src/components/ChatBox.tsx & bilingual assistant knowledge...');
  const chatContent = fs.readFileSync(path.join(root, 'src/components/ChatBox.tsx'), 'utf-8');
  const knowledgeContent = fs.readFileSync(path.join(root, 'src/assistant/catalogKnowledge.ts'), 'utf-8');
  const englishNlpContent = fs.readFileSync(path.join(root, 'src/assistant/englishNlp.ts'), 'utf-8');
  assert(!chatContent.includes('(Ms. My)'), 'ChatBox must not contain personal name "(Ms. My)"');
  assert(!knowledgeContent.includes('(Ms. My)'), 'catalogKnowledge must not contain personal name "(Ms. My)"');
  assert(!englishNlpContent.includes('(Ms. My)'), 'englishNlp must not contain personal name "(Ms. My)"');
  assert(
    !knowledgeContent.includes('taikhoan@mail.mocngonhuong.com'),
    'catalogKnowledge must use official email instead of mailer sender'
  );
  assert(STORE_POLICIES.contact.hotline.includes(BUSINESS_CONTACT.hotlineDisplay), 'VI assistant hotline must match');
  assert.equal(STORE_POLICIES.contact.email, BUSINESS_CONTACT.email, 'VI assistant email must match');
  assert(STORE_POLICIES.corporateGifting.contactMethod.includes(BUSINESS_CONTACT.hotlineDisplay), 'VI corporate gifting contact must match');
  assert(STORE_POLICIES_EN.contact.hotline.includes(BUSINESS_CONTACT.hotlineDisplay), 'EN assistant hotline must match');
  assert.equal(STORE_POLICIES_EN.contact.email, BUSINESS_CONTACT.email, 'EN assistant email must match');
  assert(STORE_POLICIES_EN.corporateGifting.contactMethod.includes(BUSINESS_CONTACT.hotlineDisplay), 'EN corporate gifting contact must match');
  console.log('✓ PASS: Bilingual assistant (VI & EN) exposes verified single-source contact info.');
}

// 3. Check CheckoutPage.tsx, OrderConfirmation.tsx & Effective VI/EN i18next Contact Output
{
  console.log('[3/8] Verifying CheckoutPage.tsx, OrderConfirmation.tsx & effective VI/EN i18n messages...');
  const checkoutContent = fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf-8');
  assert(
    checkoutContent.includes("t('cartCheckout:checkout.validation.unavailable503')"),
    'CheckoutPage must resolve maintenance fallback via i18n key cartCheckout:checkout.validation.unavailable503'
  );
  assert(
    checkoutContent.includes('BUSINESS_CONTACT.hotlineDisplay'),
    'CheckoutPage trust badge must read hotline from BUSINESS_CONTACT.hotlineDisplay'
  );

  assert.equal(tVi('common:brand.hotline'), BUSINESS_CONTACT.hotlineDisplay);
  assert.equal(tEn('common:brand.hotline'), BUSINESS_CONTACT.hotlineDisplay);
  assert.equal(tVi('common:brand.email'), BUSINESS_CONTACT.email);
  assert.equal(tEn('common:brand.email'), BUSINESS_CONTACT.email);

  const viMaintenance = tVi('cartCheckout:checkout.validation.unavailable503');
  const enMaintenance = tEn('cartCheckout:checkout.validation.unavailable503');
  assert(
    viMaintenance.includes(BUSINESS_CONTACT.hotlineDisplay),
    `VI checkout maintenance message must include hotline, got: ${viMaintenance}`
  );
  assert(
    enMaintenance.includes(BUSINESS_CONTACT.hotlineDisplay),
    `EN checkout maintenance message must include hotline, got: ${enMaintenance}`
  );
  assert(
    tVi('cartCheckout:checkout.validation.invalidPhone').includes(BUSINESS_CONTACT.hotlineDisplay) &&
      tEn('cartCheckout:checkout.validation.invalidPhone').includes(BUSINESS_CONTACT.hotlineDisplay),
    'VI & EN phone validation messages must reference standardized hotline'
  );

  const confirmContent = fs.readFileSync(path.join(root, 'src/components/OrderConfirmation.tsx'), 'utf-8');
  assert(confirmContent.includes('BUSINESS_CONTACT.hotlineTelHref'), 'OrderConfirmation must use canonical tel:+84 href');
  assert(confirmContent.includes('BUSINESS_CONTACT.hotlineDisplay'), 'OrderConfirmation must render canonical hotline');
  assert(confirmContent.includes('BUSINESS_CONTACT.emailMailtoHref'), 'OrderConfirmation must use canonical mailto href');
  console.log('✓ PASS: Checkout & OrderConfirmation resolve consistent VI/EN hotline & email without duplication.');
}

// 4. Check AuthPage.tsx & Localized Auth Account Instructions
{
  console.log('[4/8] Verifying src/pages/AuthPage.tsx & localized authAccount (VI & EN)...');
  const authContent = fs.readFileSync(path.join(root, 'src/pages/AuthPage.tsx'), 'utf-8');
  assert(!authContent.includes('0987 654 321'), 'AuthPage must not present unverified placeholder bank account 0987 654 321');
  const viBank = tVi('authAccount:orderDetailModal.bankFullValue');
  const enBank = tEn('authAccount:orderDetailModal.bankFullValue');
  assert(viBank.includes('BIDV') && viBank.includes('970418'), 'VI order modal must specify official BIDV 970418 bank');
  assert(enBank.includes('BIDV') && enBank.includes('970418'), 'EN order modal must specify official BIDV 970418 bank');
  assert(!viBank.includes('0987 654 321') && !enBank.includes('0987 654 321'));
  console.log('✓ PASS: AuthPage & authAccount VI/EN translations use official BIDV VietQR without placeholder accounts.');
}

// 5. Check api/orders.ts & Single-Source Hotline Centralization
{
  console.log('[5/8] Verifying api/orders.ts & single-source contact centralization...');
  const ordersContent = fs.readFileSync(path.join(root, 'api/orders.ts'), 'utf-8');
  assert(!ordersContent.includes('098.765.4321'), 'api/orders.ts must not contain old phone 098.765.4321');
  assert(!ordersContent.includes('(0889742556)'), 'api/orders.ts must not contain malformed parenthesized (0889742556)');
  assert(ordersContent.includes('BUSINESS_CONTACT.hotlineDisplay'), 'api/orders.ts must use BUSINESS_CONTACT.hotlineDisplay');
  assert(ordersContent.includes('BUSINESS_CONTACT.hotlineDigits'), 'api/orders.ts must use BUSINESS_CONTACT.hotlineDigits');

  const srcFiles = collectSourceFiles(path.join(root, 'src'));
  const duplicateHotlineFiles = [];
  const duplicateEmailFiles = [];
  for (const filePath of srcFiles) {
    const rel = path.relative(root, filePath);
    if (rel === 'src/lib/contact.ts') continue;
    const text = fs.readFileSync(filePath, 'utf-8');
    if (text.includes('0889 742 556')) duplicateHotlineFiles.push(rel);
    if (text.includes('mocngonhuong@gmail.com')) duplicateEmailFiles.push(rel);
  }
  assert.deepEqual(
    duplicateHotlineFiles,
    [],
    `Found duplicate hardcoded hotline literals outside src/lib/contact.ts: ${duplicateHotlineFiles.join(', ')}`
  );
  assert.deepEqual(
    duplicateEmailFiles,
    [],
    `Found duplicate hardcoded email literals outside src/lib/contact.ts: ${duplicateEmailFiles.join(', ')}`
  );
  console.log('✓ PASS: api/orders.ts and all src/ files use single-source BUSINESS_CONTACT without duplication.');
}

// 6. Check api/_lib/notifications.ts
{
  console.log('[6/8] Verifying api/_lib/notifications.ts order emails...');
  const notifContent = fs.readFileSync(path.join(root, 'api/_lib/notifications.ts'), 'utf-8');
  assert(!notifContent.includes('098.765.4321'), 'notifications.ts must not contain old phone 098.765.4321');
  assert(notifContent.includes('BUSINESS_CONTACT.hotlineTelHref'), 'notifications.ts must use BUSINESS_CONTACT clickable tel link');
  assert(notifContent.includes('BUSINESS_CONTACT.emailMailtoHref'), 'notifications.ts must use BUSINESS_CONTACT clickable mailto link');
  const footerHtml = renderEmailSupportFooterHtml(false);
  assert(footerHtml.includes('tel:+84889742556'), 'notifications footer HTML must include clickable tel link');
  assert(footerHtml.includes('mailto:mocngonhuong@gmail.com'), 'notifications footer HTML must include clickable mailto link');
  assert(footerHtml.includes('0889 742 556'), 'notifications footer HTML must include formatted hotline');
  console.log('✓ PASS: Order confirmation & recovery email templates include formatted, clickable contact info.');
}

// 7. Check api/_lib/authEmailTemplates.ts (VI & EN)
{
  console.log('[7/8] Verifying api/_lib/authEmailTemplates.ts bilingual auth emails (VI & EN)...');
  for (const locale of ['vi', 'en']) {
    const verification = renderVerificationEmail({
      customerName: locale === 'en' ? 'Valued Guest' : 'Khách Hàng',
      verificationLink: 'https://mocngonhuong.com/verify',
      locale,
    });
    assert(verification.html.includes('tel:+84889742556'), `${locale} Verification HTML must include clickable hotline`);
    assert(verification.html.includes('mailto:mocngonhuong@gmail.com'), `${locale} Verification HTML must include clickable email`);
    assert(verification.text.includes('0889 742 556'), `${locale} Verification text must include hotline`);
    assert(verification.text.includes('mocngonhuong@gmail.com'), `${locale} Verification text must include email`);

    const reset = renderPasswordResetEmail({
      customerName: locale === 'en' ? 'Valued Guest' : 'Khách Hàng',
      resetLink: 'https://mocngonhuong.com/reset',
      locale,
    });
    assert(reset.html.includes('tel:+84889742556'), `${locale} Reset HTML must include clickable hotline`);
    assert(reset.html.includes('mailto:mocngonhuong@gmail.com'), `${locale} Reset HTML must include clickable email`);
    assert(reset.text.includes('0889 742 556'), `${locale} Reset text must include hotline`);
    assert(reset.text.includes('mocngonhuong@gmail.com'), `${locale} Reset text must include email`);

    const welcome = renderWelcomeEmail({
      customerName: locale === 'en' ? 'Valued Guest' : 'Khách Hàng',
      locale,
    });
    assert(welcome.html.includes('0889 742 556'), `${locale} Welcome HTML must include hotline`);
    assert(welcome.html.includes('mocngonhuong@gmail.com'), `${locale} Welcome HTML must include email`);
  }
  console.log('✓ PASS: Bilingual (VI & EN) auth email templates include verified contact details.');
}

// 8. Overall Workspace Scan across src/, locales/, api/ & index.html
{
  console.log('[8/8] Scanning customer-facing source, locale, and API files for stray placeholders...');
  const srcAndIndexFiles = [
    ...collectSourceFiles(path.join(root, 'src')),
    path.join(root, 'index.html'),
  ];
  const apiFiles = collectSourceFiles(path.join(root, 'api'));

  for (const filePath of [...srcAndIndexFiles, ...apiFiles]) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rel = path.relative(root, filePath);
    assert(!content.includes('098.765.4321'), `${rel} contains old hotline 098.765.4321`);
    assert(!content.includes('0987 654 321'), `${rel} contains placeholder phone/bank 0987 654 321`);
    assert(!content.includes('Ms. My'), `${rel} contains personal contact name Ms. My`);
  }
  for (const filePath of srcAndIndexFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rel = path.relative(root, filePath);
    assert(
      !content.includes('taikhoan@mail.mocngonhuong.com') &&
        !content.includes('donhang@mail.mocngonhuong.com'),
      `${rel} exposes outbound mailer address instead of public contact email`
    );
  }
  console.log(
    `✓ PASS: Scanned ${srcAndIndexFiles.length + apiFiles.length} files; zero stray placeholders or personal contact leaks found.`
  );
}

console.log('\n================================================================');
console.log('ALL 8 CONTACT AUDIT & REPLACEMENT TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');

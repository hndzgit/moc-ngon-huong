// scripts/test-contact-audit.mjs
// Automated verification for Mộc Ngôn Hương V15.1 Contact Information Audit

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { renderVerificationEmail, renderPasswordResetEmail } from '../api/_lib/authEmailTemplates.js';

console.log('=== [TEST] Mộc Ngôn Hương Contact Information Audit & Verification ===\n');

const root = process.cwd();

// 1. Check ContactPage.tsx
{
  console.log('[1/8] Verifying src/pages/ContactPage.tsx...');
  const contactContent = fs.readFileSync(path.join(root, 'src/pages/ContactPage.tsx'), 'utf-8');
  assert(!contactContent.includes('(Ms. My)'), 'ContactPage must not contain personal name "(Ms. My)"');
  assert(!contactContent.includes('098.765.4321'), 'ContactPage must not contain old phone 098.765.4321');
  assert(contactContent.includes('0889 742 556'), 'ContactPage must contain formatted hotline 0889 742 556');
  assert(contactContent.includes('tel:+84889742556'), 'ContactPage must contain clickable tel:+84889742556 link');
  assert(contactContent.includes('mailto:mocngonhuong@gmail.com'), 'ContactPage must contain clickable mailto:mocngonhuong@gmail.com link');
  console.log('✓ PASS: ContactPage has standardized, clickable business contact information.');
}

// 2. Check ChatBox.tsx
{
  console.log('[2/8] Verifying src/components/ChatBox.tsx...');
  const chatContent = fs.readFileSync(path.join(root, 'src/components/ChatBox.tsx'), 'utf-8');
  assert(!chatContent.includes('(Ms. My)'), 'ChatBox must not contain personal name "(Ms. My)"');
  assert(chatContent.includes('Hotline/Zalo 0889 742 556'), 'ChatBox must contain standardized Hotline/Zalo 0889 742 556');
  console.log('✓ PASS: ChatBox has neutral, verified business contact information.');
}

// 3. Check CheckoutPage.tsx
{
  console.log('[3/8] Verifying src/pages/CheckoutPage.tsx...');
  const checkoutContent = fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf-8');
  assert(checkoutContent.includes('hotline Mộc Ngôn Hương (0889 742 556)'), 'CheckoutPage must include hotline in maintenance message');
  console.log('✓ PASS: CheckoutPage has standardized hotline in fallback message.');
}

// 4. Check AuthPage.tsx
{
  console.log('[4/8] Verifying src/pages/AuthPage.tsx...');
  const authContent = fs.readFileSync(path.join(root, 'src/pages/AuthPage.tsx'), 'utf-8');
  assert(!authContent.includes('Số tài khoản:</span> <strong>0987 654 321</strong>'), 'AuthPage must not present unverified placeholder bank account 0987 654 321');
  assert(authContent.includes('0889 742 556'), 'AuthPage bank instructions must mention official hotline');
  console.log('✓ PASS: AuthPage safely guides bank transfer without unverified placeholder account.');
}

// 5. Check api/orders.ts
{
  console.log('[5/8] Verifying api/orders.ts error responses...');
  const ordersContent = fs.readFileSync(path.join(root, 'api/orders.ts'), 'utf-8');
  assert(!ordersContent.includes('098.765.4321'), 'api/orders.ts must not contain old phone 098.765.4321');
  assert(!ordersContent.includes('(0889742556)'), 'api/orders.ts must use formatted phone (0889 742 556)');
  assert(ordersContent.includes('(0889 742 556)'), 'api/orders.ts must contain formatted phone (0889 742 556)');
  console.log('✓ PASS: api/orders.ts error messages consistently use formatted hotline 0889 742 556.');
}

// 6. Check api/_lib/notifications.ts
{
  console.log('[6/8] Verifying api/_lib/notifications.ts order emails...');
  const notifContent = fs.readFileSync(path.join(root, 'api/_lib/notifications.ts'), 'utf-8');
  assert(!notifContent.includes('098.765.4321'), 'notifications.ts must not contain old phone 098.765.4321');
  assert(notifContent.includes('tel:+84889742556'), 'notifications.ts must include clickable tel link');
  assert(notifContent.includes('mailto:mocngonhuong@gmail.com'), 'notifications.ts must include clickable mailto link');
  assert(notifContent.includes('0889 742 556'), 'notifications.ts must include formatted hotline');
  console.log('✓ PASS: Order confirmation email template includes formatted, clickable contact info.');
}

// 7. Check api/_lib/authEmailTemplates.ts
{
  console.log('[7/8] Verifying api/_lib/authEmailTemplates.ts auth emails...');
  const verification = renderVerificationEmail({
    customerName: 'Khách Hàng',
    verificationLink: 'https://mocngonhuong.com/verify',
  });
  assert(verification.html.includes('tel:+84889742556'), 'Verification HTML must include clickable hotline');
  assert(verification.html.includes('mailto:mocngonhuong@gmail.com'), 'Verification HTML must include clickable email');
  assert(verification.text.includes('0889 742 556'), 'Verification text must include hotline');
  assert(verification.text.includes('mocngonhuong@gmail.com'), 'Verification text must include business email');

  const reset = renderPasswordResetEmail({
    customerName: 'Khách Hàng',
    resetLink: 'https://mocngonhuong.com/reset',
  });
  assert(reset.html.includes('tel:+84889742556'), 'Reset HTML must include clickable hotline');
  assert(reset.html.includes('mailto:mocngonhuong@gmail.com'), 'Reset HTML must include clickable email');
  assert(reset.text.includes('0889 742 556'), 'Reset text must include hotline');
  assert(reset.text.includes('mocngonhuong@gmail.com'), 'Reset text must include business email');
  console.log('✓ PASS: Auth email templates (Verification & Password Reset) include clickable contact details.');
}

// 8. Overall Workspace Scan for Stray Old Business Placeholders
{
  console.log('[8/8] Scanning customer-facing source files for stray placeholders...');
  const filesToCheck = [
    'src/pages/ContactPage.tsx',
    'src/components/Footer.tsx',
    'src/components/Navbar.tsx',
    'src/components/ChatBox.tsx',
    'src/pages/CheckoutPage.tsx',
    'src/components/OrderConfirmation.tsx',
    'src/pages/AuthPage.tsx',
    'src/pages/AdminPage.tsx',
    'src/pages/CorporateGiftingPage.tsx',
    'api/orders.ts',
    'api/_lib/notifications.ts',
    'api/_lib/authEmailTemplates.ts',
    'index.html',
  ];

  for (const f of filesToCheck) {
    const filePath = path.join(root, f);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(!content.includes('098.765.4321'), `${f} contains old hotline 098.765.4321`);
    assert(!content.includes('Ms. My'), `${f} contains personal contact name Ms. My`);
  }
  console.log('✓ PASS: Zero stray placeholders or outdated personal names found in customer-facing files.');
}

console.log('\n================================================================');
console.log('ALL 8 CONTACT AUDIT & REPLACEMENT TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');

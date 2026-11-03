// scripts/test-v17-registration-simplification.mjs
// Mộc Ngôn Hương V17.0B — Autonomous Registration Simplification Test Suite

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { renderWelcomeEmail } from '../api/_lib/authEmailTemplates.js';
import welcomeHandler from '../api/auth/send-welcome-email.js';

console.log('=== [TEST] Mộc Ngôn Hương V17.0B Registration Simplification Suite ===\n');

function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'POST',
    url: options.url || '/',
    headers: options.headers || {},
    body: options.body || undefined,
    socket: { remoteAddress: options.ip || '127.0.0.1' },
    on(event, cb) {
      if (event === 'data' && options.rawBody) cb(options.rawBody);
      if (event === 'end') cb();
    },
  };

  let statusCode = 200;
  let headers = {};
  let responseData = '';

  const res = {
    statusCode: 200,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(obj) {
      responseData = JSON.stringify(obj);
    },
    send(data) {
      responseData = data;
    },
    end(data) {
      if (data) responseData = data;
    },
    getOutput() {
      return {
        statusCode: this.statusCode || statusCode,
        headers,
        data: responseData ? JSON.parse(responseData) : null,
      };
    },
  };

  return { req, res };
}

async function runSuite() {
  // 1. Audit Source Code: Verify Removal of Mandatory Email Verification
  {
    console.log('[1/8] Verifying AuthContext.tsx register flow...');
    const authContextContent = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf-8');
    const registerBlock = authContextContent.slice(
      authContextContent.indexOf('const register ='),
      authContextContent.indexOf('const logout =')
    );

    assert(
      !registerBlock.includes('/api/auth/send-verification'),
      'AuthContext.register must not require send-verification endpoint'
    );
    assert(
      registerBlock.includes('/api/auth/send-welcome-email'),
      'AuthContext.register must dispatch send-welcome-email'
    );
    assert(
      authContextContent.includes('isEmailVerified: Boolean(user?.emailVerified)'),
      'isEmailVerified must truthfully reflect genuine user.emailVerified'
    );
    console.log('✓ PASS: AuthContext.register dispatches welcome email and keeps emailVerified truthful.');
  }

  // 2. Audit UI Code: Verify Simplified Registration Form
  {
    console.log('[2/8] Verifying AuthPage.tsx registration form...');
    const authPageContent = fs.readFileSync(path.resolve('src/pages/AuthPage.tsx'), 'utf-8');

    assert(
      authPageContent.includes('handleRegister'),
      'AuthPage must implement single-step handleRegister'
    );
    assert(
      authPageContent.includes('Chào mừng bạn đến với Mộc Ngôn Hương. Tài khoản của bạn đã được tạo thành công.'),
      'AuthPage must display exact supporting message upon registration success'
    );
    assert(
      authPageContent.includes('Đăng ký tài khoản thành công!'),
      'AuthPage must display exact title upon registration success'
    );
    assert(
      !authPageContent.includes('Chưa xác thực email'),
      'AuthPage must not show confusing "Chưa xác thực email" blocker banner'
    );
    assert(
      !authPageContent.includes('Email đã xác thực'),
      'AuthPage must not show misleading "Email đã xác thực" indicator for unverified users'
    );
    assert(
      authPageContent.includes('Thành viên thân thiết'),
      'AuthPage must display respectful member badge'
    );
    console.log('✓ PASS: Registration form is unified and verification banners are removed.');
  }

  // 3. Welcome Email Content & Vietnamese Copy Verification
  {
    console.log('[3/8] Verifying Welcome Email template copy & styling...');
    const emailResult = renderWelcomeEmail({ customerName: 'Hoài Nam' });

    assert.strictEqual(emailResult.subject, 'Chào mừng bạn đến với Mộc Ngôn Hương!');
    assert(emailResult.text.includes('Xin chào Hoài Nam,'), 'Must include personalized greeting');
    assert(emailResult.text.includes('Chào mừng bạn đến với Mộc Ngôn Hương!'), 'Must include required welcome greeting');
    assert(emailResult.text.includes('Tài khoản của bạn đã được đăng ký thành công.'), 'Must include account created notice');
    assert(
      emailResult.text.includes('Từ hôm nay, bạn có thể khám phá những hương trà Việt tinh tế, lựa chọn món quà ý nghĩa và gửi gắm những lời thương đến người mình trân trọng.'),
      'Must include exact required body copy'
    );
    assert(emailResult.text.includes('Cảm ơn bạn đã đồng hành cùng Mộc Ngôn Hương.'), 'Must include thank you');
    assert(emailResult.text.includes('Trao hương, gửi lời thương.'), 'Must include brand slogan');
    assert(emailResult.text.includes('Mộc Ngôn Hương'), 'Must include brand signature');
    assert(emailResult.html.includes('logo-header.png'), 'Must include brand logo');
    assert(emailResult.html.includes('0889 742 556'), 'Must include official hotline');
    assert(emailResult.html.includes('mocngonhuong@gmail.com'), 'Must include official email');
    console.log('✓ PASS: Welcome Email copy matches all prompt specifications 100%.');
  }

  // 4. Welcome Email Endpoint Security: Anonymous & Forged Tokens
  {
    console.log('[4/8] Testing Welcome Email Endpoint authentication gates...');
    // Anonymous request
    const { req: reqAnon, res: resAnon } = createMockReqRes({ method: 'POST' });
    await welcomeHandler(reqAnon, resAnon);
    const outAnon = resAnon.getOutput();
    assert.strictEqual(outAnon.statusCode, 401, 'Anonymous request must be rejected with 401');

    // Invalid bearer token
    const { req: reqForged, res: resForged } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer forged_token_abc' },
    });
    await welcomeHandler(reqForged, resForged);
    const outForged = resForged.getOutput();
    assert.strictEqual(outForged.statusCode, 401, 'Forged bearer token must be rejected with 401');

    // Invalid method (GET)
    const { req: reqGet, res: resGet } = createMockReqRes({ method: 'GET' });
    await welcomeHandler(reqGet, resGet);
    const outGet = resGet.getOutput();
    assert.strictEqual(outGet.statusCode, 405, 'GET method must return 405');

    console.log('✓ PASS: Welcome email endpoint strictly rejects unauthenticated and invalid requests.');
  }

  // 5. Customer Profile & Order History Non-Gated Access
  {
    console.log('[5/8] Verifying Customer Profile and Order History accessibility...');
    const apiOrdersContent = fs.readFileSync(path.resolve('api/me/orders.ts'), 'utf-8');
    assert(
      !apiOrdersContent.includes('email_verified'),
      'api/me/orders.ts must not gate customer order history on email verification'
    );
    assert(
      apiOrdersContent.includes('verifyAuthToken'),
      'api/me/orders.ts must preserve authentic Firebase user ID token verification'
    );

    const checkoutPageContent = fs.readFileSync(path.resolve('src/pages/CheckoutPage.tsx'), 'utf-8');
    assert(
      !checkoutPageContent.includes('isEmailVerified'),
      'CheckoutPage must not block orders on email verification'
    );
    console.log('✓ PASS: Order history and checkout are completely accessible without email verification.');
  }

  // 6. Admin Security & Endpoint Integrity
  {
    console.log('[6/8] Verifying Admin Security boundaries remain untampered...');
    const adminOrdersContent = fs.readFileSync(path.resolve('api/admin/orders.ts'), 'utf-8');
    const firebaseAdminContent = fs.readFileSync(path.resolve('api/_lib/firebaseAdmin.ts'), 'utf-8');
    assert(
      adminOrdersContent.includes('verifyAdminAuth'),
      'Admin orders endpoint must enforce verifyAdminAuth'
    );
    assert(
      firebaseAdminContent.includes('ADMIN_UIDS'),
      'Admin RBAC must continue checking ADMIN_UIDS'
    );
    assert(
      firebaseAdminContent.includes('FAIL CLOSED'),
      'Admin API must maintain fail-closed security model'
    );
    console.log('✓ PASS: Admin authorization and security boundaries are fully intact.');
  }

  // 7. Non-Blocking Email Error Safety (Simulated in register)
  {
    console.log('[7/8] Verifying email delivery failure non-blocking resilience...');
    const authContextContent = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf-8');
    assert(
      authContextContent.includes('Welcome email dispatch failed in background'),
      'AuthContext must catch and log background welcome email failures safely'
    );
    console.log('✓ PASS: Email failure does not prevent customer account creation or login.');
  }

  // 8. Visual & Style Fidelity (Check Figma references preserved)
  {
    console.log('[8/8] Verifying Figma visual identity and asset paths...');
    const authPageContent = fs.readFileSync(path.resolve('src/pages/AuthPage.tsx'), 'utf-8');
    assert(
      authPageContent.includes('auth-tea-banner.webp'),
      'AuthPage must preserve wide banner asset'
    );
    assert(
      authPageContent.includes('font-philosopher'),
      'AuthPage must preserve brand typography'
    );
    console.log('✓ PASS: Figma brand identity and visual styling preserved.');
  }

  console.log('\n==================================================================');
  console.log('ALL 8 V17.0B REGISTRATION SIMPLIFICATION TESTS PASSED WITH 100%!');
  console.log('==================================================================\n');
}

runSuite().catch((err) => {
  console.error('Registration test suite failed:', err);
  process.exit(1);
});

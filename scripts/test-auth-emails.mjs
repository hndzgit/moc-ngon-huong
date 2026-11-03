// scripts/test-auth-emails.mjs
// Automated verification for Mộc Ngôn Hương Branded Authentication Emails

import assert from 'node:assert';
import { renderVerificationEmail, renderPasswordResetEmail, renderWelcomeEmail } from '../api/_lib/authEmailTemplates.js';
import verificationHandler from '../api/auth/send-verification.js';
import resetHandler from '../api/auth/send-reset-password.js';
import welcomeHandler from '../api/auth/send-welcome-email.js';

console.log('=== [TEST] Mộc Ngôn Hương Authentication Emails & Security ===\n');

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

async function runTests() {
  process.env.NODE_ENV = 'test';

  // 1. Verification Template Rendering Check
  {
    console.log('[1/7] Testing Email Verification Template rendering...');
    const result = renderVerificationEmail({
      customerName: 'Nguyễn Văn A',
      verificationLink: 'https://moc-ngon-huong.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=code123',
    });

    assert.strictEqual(result.subject, 'Xác minh tài khoản Mộc Ngôn Hương');
    assert(result.html.includes('Chào mừng bạn đến với Mộc Ngôn Hương!'), 'Must include correct headline');
    assert(result.html.includes('Nguyễn Văn A'), 'Must include customer name');
    assert(result.html.includes('Xác minh địa chỉ email'), 'Must include CTA button text');
    assert(result.html.includes('#3E5641'), 'Must include Forest green');
    assert(result.html.includes('#FAF8F3'), 'Must include Warm ivory');
    assert(result.html.includes('#C89F5D'), 'Must include Muted gold');
    assert(result.html.includes('logo-header.png'), 'Must include brand logo');
    assert(result.html.includes('Nếu bạn không đăng ký tài khoản'), 'Must include footer notice');
    assert(result.text.toLowerCase().includes('xác minh địa chỉ email'), 'Plain text must be populated');
    console.log('✓ PASS: Verification template matches all visual, copy, and brand requirements.');
  }

  // 2. Password Reset Template Rendering Check
  {
    console.log('[2/7] Testing Password Reset Template rendering...');
    const result = renderPasswordResetEmail({
      customerName: 'Trần Thị B',
      resetLink: 'https://moc-ngon-huong.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=code456',
    });

    assert.strictEqual(result.subject, 'Khôi phục mật khẩu Mộc Ngôn Hương');
    assert(result.html.includes('Đặt lại mật khẩu tài khoản của bạn'), 'Must include correct headline');
    assert(result.html.includes('Trần Thị B'), 'Must include customer name');
    assert(result.html.includes('Đặt lại mật khẩu'), 'Must include CTA text');
    assert(result.html.includes('#3E5641'), 'Must include Forest green');
    assert(result.html.includes('#C89F5D'), 'Must include Muted gold');
    assert(result.html.includes('Nếu bạn không yêu cầu thay đổi mật khẩu'), 'Must include footer notice');
    assert(result.text.includes('Đặt lại mật khẩu'), 'Plain text must be populated');
    console.log('✓ PASS: Password reset template matches all visual, copy, and brand requirements.');
  }

  // 3. Verification Endpoint: Anonymous Request -> 401
  {
    console.log('[3/7] Testing Verification Endpoint anonymous request...');
    const { req, res } = createMockReqRes({ method: 'POST' });
    await verificationHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 401, 'Anonymous request must return 401');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Verification endpoint strictly rejects unauthenticated requests with 401.');
  }

  // 4. Verification Endpoint: Invalid Bearer Token -> 401
  {
    console.log('[4/7] Testing Verification Endpoint invalid token...');
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer invalid_forged_token' },
    });
    await verificationHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 401, 'Invalid token must return 401');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Verification endpoint rejects forged tokens with 401.');
  }

  // 5. Password Reset Endpoint: Invalid Email format -> 400
  {
    console.log('[5/7] Testing Password Reset Endpoint invalid email validation...');
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    await resetHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 400, 'Invalid email must return 400');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Password reset endpoint validates email syntax with 400.');
  }

  // 6. Password Reset Endpoint: Non-enumerating response -> 200
  {
    console.log('[6/7] Testing Password Reset Endpoint non-enumerating behavior...');
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { email: 'nonexistent-user-privacy-test@mocngonhuong.com' },
    });
    await resetHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 200, 'Must return 200 generic response');
    assert.strictEqual(out.data.success, true);
    assert(out.data.message.includes('Nếu địa chỉ email tồn tại'), 'Must not enumerate accounts');
    console.log('✓ PASS: Non-enumerating response prevents user enumeration attacks.');
  }

  // 7. Password Reset Endpoint: Rate Limiting -> 429
  {
    console.log('[7/7] Testing Password Reset Endpoint rate limiting...');
    const spamIp = '198.51.100.99';
    let reachedRateLimit = false;

    for (let i = 0; i < 7; i++) {
      const { req, res } = createMockReqRes({
        method: 'POST',
        ip: spamIp,
        body: { email: 'ratelimit-test@mocngonhuong.com' },
      });
      await resetHandler(req, res);
      const out = res.getOutput();
      if (out.statusCode === 429) {
        reachedRateLimit = true;
        break;
      }
    }

    assert(reachedRateLimit, 'Rate limiter must trigger HTTP 429 after excessive requests');
    console.log('✓ PASS: Rate limiting protects against spam and open-relay abuse with HTTP 429.');
  }

  // 8. Welcome Email Template Rendering Check
  {
    console.log('[8/11] Testing Welcome Email Template rendering...');
    const result = renderWelcomeEmail({
      customerName: 'Hoài Nam',
    });

    assert.strictEqual(result.subject, 'Chào mừng bạn đến với Mộc Ngôn Hương!');
    assert(result.html.includes('Chào mừng bạn đến với Mộc Ngôn Hương!'), 'Must include correct headline');
    assert(result.html.includes('Hoài Nam'), 'Must include customer name');
    assert(result.html.includes('Tài khoản của bạn đã được đăng ký thành công.'), 'Must include registration success message');
    assert(result.html.includes('Từ hôm nay, bạn có thể khám phá những hương trà Việt tinh tế'), 'Must include brand intro');
    assert(result.html.includes('Trao hương, gửi lời thương.'), 'Must include brand slogan');
    assert(result.html.includes('Khám Phá Hương Trà'), 'Must include CTA text');
    assert(result.html.includes('#3E5641'), 'Must include Forest green');
    assert(result.html.includes('#FAF8F3'), 'Must include Warm ivory');
    assert(result.html.includes('#C89F5D'), 'Must include Muted gold');
    assert(result.html.includes('logo-header.png'), 'Must include brand logo');
    assert(result.text.includes('Chào mừng bạn đến với Mộc Ngôn Hương!'), 'Plain text must be populated');
    assert(result.text.includes('Trao hương, gửi lời thương.'), 'Plain text must include slogan');
    console.log('✓ PASS: Welcome email template matches all visual, copy, and brand requirements.');
  }

  // 9. Welcome Email Endpoint: Anonymous Request -> 401
  {
    console.log('[9/11] Testing Welcome Email Endpoint anonymous request...');
    const { req, res } = createMockReqRes({ method: 'POST' });
    await welcomeHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 401, 'Anonymous request must return 401');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Welcome email endpoint strictly rejects unauthenticated requests with 401.');
  }

  // 10. Welcome Email Endpoint: Invalid Bearer Token -> 401
  {
    console.log('[10/11] Testing Welcome Email Endpoint invalid token...');
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer invalid_forged_token' },
    });
    await welcomeHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 401, 'Invalid token must return 401');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Welcome email endpoint rejects forged tokens with 401.');
  }

  // 11. Welcome Email Endpoint: Method Not Allowed (GET) -> 405
  {
    console.log('[11/11] Testing Welcome Email Endpoint invalid HTTP method...');
    const { req, res } = createMockReqRes({ method: 'GET' });
    await welcomeHandler(req, res);
    const out = res.getOutput();
    assert.strictEqual(out.statusCode, 405, 'GET method must return 405');
    assert.strictEqual(out.data.success, false);
    console.log('✓ PASS: Welcome email endpoint enforces POST-only with HTTP 405.');
  }

  console.log('\n======================================================');
  console.log('ALL 11 AUTHENTICATION & WELCOME EMAIL TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

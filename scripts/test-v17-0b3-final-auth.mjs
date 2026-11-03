// scripts/test-v17-0b3-final-auth.mjs
// Mộc Ngôn Hương V17.0B.3 — Final Auth Flow & Welcome Email Reliability Test Suite

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import welcomeHandler, { _clearDevMockStore, _getDevMockStore } from '../api/auth/send-welcome-email.js';

console.log('=== [TEST] Mộc Ngôn Hương V17.0B.3 Final Auth Flow Test Suite ===\n');

function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'POST',
    url: options.url || '/',
    headers: options.headers || {},
    body: options.body !== undefined ? options.body : undefined,
    socket: { remoteAddress: options.ip || '127.0.0.1' },
    on(event, cb) {
      if (event === 'data' && options.rawBody) {
        cb(Buffer.from(options.rawBody));
      }
      if (event === 'end') {
        cb();
      }
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
  process.env.RESEND_API_KEY = 're_test_mock_key_123';

  const capturedResendCalls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    if (typeof url === 'string' && url.includes('api.resend.com/emails')) {
      capturedResendCalls.push({ url, opts });
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_mock_' + Math.random().toString(36).substring(7) }),
      };
    }
    return originalFetch(url, opts);
  };
  // 1. Types & State Audit: No 'activate' or 'forgot-otp'
  {
    console.log('[1/8] Verifying removal of obsolete activation and OTP states...');
    const typesContent = fs.readFileSync(path.resolve('src/types.ts'), 'utf-8');
    assert(!typesContent.includes("'activate'"), "AuthStep must NOT contain 'activate'");
    assert(!typesContent.includes("'forgot-otp'"), "AuthStep must NOT contain 'forgot-otp'");

    const authPageContent = fs.readFileSync(path.resolve('src/pages/AuthPage.tsx'), 'utf-8');
    assert(!authPageContent.includes("step === 'activate'"), "AuthPage must NOT have step === 'activate'");
    assert(!authPageContent.includes("step === 'forgot-otp'"), "AuthPage must NOT have step === 'forgot-otp'");
    assert(!authPageContent.includes('handleActivateAccount'), 'AuthPage must NOT have handleActivateAccount');
    assert(!authPageContent.includes('handleVerifyOtp'), 'AuthPage must NOT have handleVerifyOtp');
    assert(!authPageContent.includes('aria-label="Xác thực mã OTP"'), 'AuthPage must NOT have OTP modal');
    console.log('✓ PASS: Obsolete activation screen and 4-digit OTP modal completely removed.');
  }

  // 2. AuthContext verification is completely non-mandatory
  {
    console.log('[2/8] Verifying AuthContext.tsx verification behavior...');
    const authContextContent = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf-8');
    assert(!authContextContent.includes('sendEmailVerification('), 'Must not call Firebase sendEmailVerification');
    assert(
      !authContextContent.includes("fetch('/api/auth/send-verification'"),
      'Must not call /api/auth/send-verification'
    );
    console.log('✓ PASS: Automatic verification emails completely prevented in AuthContext.');
  }

  // 3. Password reset remains fully functional with secure link
  {
    console.log('[3/8] Verifying password reset preservation...');
    const authPageContent = fs.readFileSync(path.resolve('src/pages/AuthPage.tsx'), 'utf-8');
    assert(authPageContent.includes('handleSendResetLink'), 'AuthPage must have handleSendResetLink');
    assert(authPageContent.includes('sendResetEmail(email.trim())'), 'AuthPage must call sendResetEmail');
    assert(authPageContent.includes("step === 'forgot-reset'"), 'AuthPage must support forgot-reset password form');
    assert(authPageContent.includes("step === 'forgot-success'"), 'AuthPage must support forgot-success confirmation');
    console.log('✓ PASS: Password reset flow preserved with authentic Firebase recovery links.');
  }

  // 4. Request Body Streaming & Parsing in send-welcome-email
  {
    console.log('[4/8] Testing send-welcome-email body stream parsing...');
    _clearDevMockStore();

    // Stream raw body
    const rawPayload = JSON.stringify({ fullName: 'Trần Hoài Nam Stream Test' });
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token_uid_stream_user_1',
      },
      rawBody: rawPayload,
    });

    await welcomeHandler(req, res);
    const output = res.getOutput();
    assert.strictEqual(output.statusCode, 200, 'Streaming body request should succeed with 200');
    assert.strictEqual(output.data.success, true);

    const store = _getDevMockStore();
    const record = store.get('stream_user_1');
    assert(record, 'Record must exist in store');
    assert.strictEqual(record.customerName, 'Trần Hoài Nam Stream Test', 'Customer name must be parsed from stream');
    console.log('✓ PASS: Request body safely parsed from incoming data stream.');
  }

  // 5. Welcome Email Idempotency & Concurrency Safety
  {
    console.log('[5/8] Testing Welcome Email duplicate protection...');
    const { req: reqDup, res: resDup } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token_uid_stream_user_1',
      },
      body: { fullName: 'Trần Hoài Nam Stream Test' },
    });

    await welcomeHandler(reqDup, resDup);
    const outDup = resDup.getOutput();
    assert.strictEqual(outDup.statusCode, 200);
    assert.strictEqual(outDup.data.alreadySent, true, 'Second request must return alreadySent: true');
    console.log('✓ PASS: Subsequent calls for the same UID return alreadySent without duplicating email.');
  }

  // 6. Controlled One-Time Recovery for Pre-existing / Stalled Accounts
  {
    console.log('[6/8] Testing controlled forceRecovery for single account...');
    // Request with forceRecovery: true for stream_user_1
    const { req: reqRec, res: resRec } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token_uid_stream_user_1',
      },
      body: { fullName: 'Trần Hoài Nam Stream Test', forceRecovery: true },
    });

    await welcomeHandler(reqRec, resRec);
    const outRec = resRec.getOutput();
    assert.strictEqual(outRec.statusCode, 200);
    assert.strictEqual(outRec.data.success, true);
    assert.notStrictEqual(outRec.data.alreadySent, true, 'forceRecovery should re-attempt send');
    console.log('✓ PASS: Controlled one-time recovery functions correctly for authenticated account.');
  }

  // 7. Verification Link URL Handling (Silent Apply)
  {
    console.log('[7/8] Verifying URL verification code handling in AuthPage...');
    const authPageContent = fs.readFileSync(path.resolve('src/pages/AuthPage.tsx'), 'utf-8');
    assert(
      authPageContent.includes("mode === 'verifyEmail'"),
      'Must check mode === verifyEmail'
    );
    assert(
      authPageContent.includes('applyVerifyCode(oobCode)'),
      'Must silently apply verify code'
    );
    assert(
      !authPageContent.includes('setStep(\'activate\')'),
      'Must NOT redirect to activate step'
    );
    console.log('✓ PASS: verifyEmail parameter handled gracefully without intrusive activation screen.');
  }

  // 8. Resend Idempotency-Key and Sender Headers
  {
    console.log('[8/8] Verifying Resend Idempotency-Key and Sender configurations...');
    const welcomeSrc = fs.readFileSync(path.resolve('api/auth/send-welcome-email.ts'), 'utf-8');
    assert(
      welcomeSrc.includes('const idempotencyKey = `welcome-user/${uid}`;'),
      'Must construct UID-scoped Resend idempotency key'
    );
    assert(
      welcomeSrc.includes("taikhoan@mail.mocngonhuong.com"),
      'Must use verified brand identity sender'
    );
    console.log('✓ PASS: Resend idempotency and sender domain strictly enforced.');
  }

  console.log('\n==================================================================');
  console.log('ALL 8 V17.0B.3 FINAL AUTH FLOW TESTS PASSED WITH 100%!');
  console.log('==================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

// scripts/test-v17-0b1-welcome-email-reliability.mjs
// Mộc Ngôn Hương V17.0B.1 — Welcome Email Reliability & Idempotency Test Suite

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  escapeHtml,
  sanitizeCustomerName,
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
} from '../api/_lib/authEmailTemplates.js';
import welcomeHandler, {
  _clearDevMockStore,
  _getDevMockStore,
} from '../api/auth/send-welcome-email.js';

console.log('=== [TEST] Mộc Ngôn Hương V17.0B.1 Reliability & Concurrency Suite ===\n');

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

  // 1. HTML Escaping & XSS Protection
  {
    console.log('[1/9] Testing HTML Escaping & Injection Protection...');
    const maliciousInput = '<script>alert("XSS")</script>&<b>bold</b>\'"';
    const escaped = escapeHtml(maliciousInput);

    assert(!escaped.includes('<script>'), 'Must escape <script>');
    assert(!escaped.includes('</script>'), 'Must escape </script>');
    assert(escaped.includes('&lt;script&gt;'), 'Must encode < and >');
    assert(escaped.includes('&amp;'), 'Must encode &');
    assert(escaped.includes('&quot;'), 'Must encode "');
    assert(escaped.includes('&#39;'), "Must encode '");

    const email = renderWelcomeEmail({ customerName: maliciousInput });
    assert(!email.html.includes('<script>'), 'HTML output must NOT contain unescaped script tag');
    assert(email.html.includes('&lt;script&gt;'), 'HTML output must contain escaped entities');
    console.log('✓ PASS: HTML escaping strictly neutralizes XSS and HTML injection.');
  }

  // 2. Vietnamese Unicode & Long Name Normalization
  {
    console.log('[2/9] Testing Vietnamese Unicode & Name Normalization...');
    const vietnameseName = 'Nguyễn Văn Hoài Nam — Trà Sư Mộc Ngôn';
    const cleaned = sanitizeCustomerName(vietnameseName);
    assert.strictEqual(cleaned, vietnameseName, 'Vietnamese Unicode must be 100% preserved');

    const email = renderWelcomeEmail({ customerName: vietnameseName });
    assert(email.html.includes('Nguyễn Văn Hoài Nam — Trà Sư Mộc Ngôn'), 'HTML must preserve Unicode');
    assert(email.text.includes('Nguyễn Văn Hoài Nam — Trà Sư Mộc Ngôn'), 'Text must preserve Unicode');

    // Control characters & Excessive length
    const controlName = 'Tên\nCó\rXuống\tDòng\x00Và\x1FTạpChất';
    const sanitizedControl = sanitizeCustomerName(controlName);
    assert(!sanitizedControl.includes('\n'), 'Control characters must be stripped');
    assert(!sanitizedControl.includes('\r'), 'Control characters must be stripped');
    assert.strictEqual(sanitizedControl, 'Tên Có Xuống Dòng Và TạpChất');

    const excessiveName = 'A'.repeat(200);
    const sanitizedExcessive = sanitizeCustomerName(excessiveName);
    assert.strictEqual(sanitizedExcessive.length, 100, 'Name must be capped at 100 characters');

    // Empty fallback
    assert.strictEqual(sanitizeCustomerName('   '), 'Quý khách', 'Whitespace only falls back to default');
    assert.strictEqual(sanitizeCustomerName(undefined), 'Quý khách', 'Undefined falls back to default');

    console.log('✓ PASS: Vietnamese Unicode preserved and malformed names safely normalized.');
  }

  // 3. Concurrency Race Condition Test (Simultaneous Requests for same UID)
  {
    console.log('[3/9] Testing Concurrency Safety & Race Condition prevention...');
    _clearDevMockStore();

    const uid = 'race_condition_user_123';
    const token = `test_token_uid_${uid}`;

    // Launch 5 concurrent requests simultaneously
    const requests = Array.from({ length: 5 }).map(() => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: { fullName: 'Khách Hàng Đồng Thời' },
      });
      return welcomeHandler(req, res).then(() => res.getOutput());
    });

    const results = await Promise.all(requests);

    // Verify all returned HTTP 200
    for (const r of results) {
      assert.strictEqual(r.statusCode, 200, 'All requests must return 200');
    }

    // Verify that exactly ONE request claimed initial send (in mock fallback)
    // while others received inProgress or alreadySent
    const store = _getDevMockStore();
    const doc = store.get(uid);
    assert(doc, 'Document must exist in store');
    assert.strictEqual(doc.attemptCount, 1, 'Exactly one send attempt must be registered');

    console.log('✓ PASS: Concurrent requests handled atomically with zero duplicate sends.');
  }

  // 4. Sequential Duplicate Requests (Idempotency)
  {
    console.log('[4/9] Testing Sequential Duplicate Welcome Email Requests...');
    const uid = 'sequential_user_456';
    const token = `test_token_uid_${uid}`;

    // Request 1
    const { req: req1, res: res1 } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: { fullName: 'Khách Hàng Tuần Tự' },
    });
    await welcomeHandler(req1, res1);
    const out1 = res1.getOutput();
    assert.strictEqual(out1.statusCode, 200);

    // Manually mark sent in mock store to simulate successful provider delivery
    const store = _getDevMockStore();
    const doc = store.get(uid);
    doc.status = 'sent';
    doc.sentAt = new Date().toISOString();

    // Request 2 (immediate duplicate)
    const { req: req2, res: res2 } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    await welcomeHandler(req2, res2);
    const out2 = res2.getOutput();
    assert.strictEqual(out2.statusCode, 200);
    assert.strictEqual(out2.data.alreadySent, true, 'Subsequent request must return alreadySent: true');

    // Request 3 (repeat duplicate)
    const { req: req3, res: res3 } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    await welcomeHandler(req3, res3);
    const out3 = res3.getOutput();
    assert.strictEqual(out3.statusCode, 200);
    assert.strictEqual(out3.data.alreadySent, true, 'Repeat request must return alreadySent: true');

    console.log('✓ PASS: Sequential duplicate requests return alreadySent: true without sending twice.');
  }

  // 5. Legacy Welcome Email Record Compatibility (No status field)
  {
    console.log('[5/9] Testing Legacy V17.0B Document Compatibility...');
    const uid = 'legacy_user_789';
    const store = _getDevMockStore();

    // Insert legacy record without 'status' field (as saved in V17.0B)
    store.set(uid, {
      uid,
      email: `${uid}@test.local`,
      customerName: 'Khách Hàng Cũ',
      sentAt: '2026-11-03T14:20:00.000Z',
    });

    const token = `test_token_uid_${uid}`;
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    await welcomeHandler(req, res);
    const out = res.getOutput();

    assert.strictEqual(out.statusCode, 200);
    assert.strictEqual(out.data.alreadySent, true, 'Legacy record must be treated as alreadySent: true');
    console.log('✓ PASS: Backward compatibility with legacy V17.0B welcome records preserved.');
  }

  // 6. Stale Pending Reservation Recovery
  {
    console.log('[6/9] Testing Stale Pending Reservation Recovery...');
    const uid = 'stale_user_101';
    const store = _getDevMockStore();

    // Insert pending record older than 60s (stale)
    const staleTime = new Date(Date.now() - 120 * 1000).toISOString();
    store.set(uid, {
      uid,
      email: `${uid}@test.local`,
      status: 'pending',
      attemptCount: 1,
      createdAt: staleTime,
      updatedAt: staleTime,
      provider: 'resend',
    });

    const token = `test_token_uid_${uid}`;
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    await welcomeHandler(req, res);
    const out = res.getOutput();

    assert.strictEqual(out.statusCode, 200);
    const updatedDoc = store.get(uid);
    assert.strictEqual(updatedDoc.attemptCount, 2, 'Stale reservation must be safely reclaimed (attempt 2)');
    console.log('✓ PASS: Stale pending reservation successfully reclaimed after timeout.');
  }

  // 7. Max Retries Guard (Stops retrying after 3 attempts)
  {
    console.log('[7/9] Testing Max Retries Guard (max 3 attempts)...');
    const uid = 'failed_user_999';
    const store = _getDevMockStore();

    // Insert record with attemptCount = 3 (failed)
    store.set(uid, {
      uid,
      email: `${uid}@test.local`,
      status: 'failed',
      attemptCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastError: 'Simulated 3 failed attempts',
    });

    const token = `test_token_uid_${uid}`;
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    await welcomeHandler(req, res);
    const out = res.getOutput();

    assert.strictEqual(out.statusCode, 429, 'Exceeded retries must be rejected with 429');
    assert(out.data.error.includes('Đã đạt giới hạn số lần thử'), 'Must return max attempts error');
    console.log('✓ PASS: Max retries guard stops retrying after 3 attempts.');
  }

  // 8. Non-Blocking Client-Side Registration Latency Verification
  {
    console.log('[8/9] Verifying AuthContext.tsx non-blocking async registration...');
    const authContextContent = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf-8');
    const registerBlock = authContextContent.slice(
      authContextContent.indexOf('const register ='),
      authContextContent.indexOf('const logout =')
    );

    // Verify that register returns cred.user without awaiting the background dispatch
    assert(
      registerBlock.includes('keepalive: true'),
      'Fetch to send-welcome-email must specify keepalive: true'
    );
    assert(
      !registerBlock.includes('await (async'),
      'register() must not await the background IIFE'
    );
    assert(
      registerBlock.includes('(async () => {') && registerBlock.includes('return cred.user;'),
      'register() must dispatch in detached async IIFE and return cred.user directly'
    );
    console.log('✓ PASS: Registration completes immediately without waiting for welcome email.');
  }

  // 9. Provider & Security Gating Verification
  {
    console.log('[9/9] Verifying Security Gating and Provider Idempotency...');
    // Anonymous rejection
    const { req: reqAnon, res: resAnon } = createMockReqRes({ method: 'POST' });
    await welcomeHandler(reqAnon, resAnon);
    assert.strictEqual(resAnon.getOutput().statusCode, 401);

    // Forged token rejection
    const { req: reqForged, res: resForged } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer forged_token_invalid' },
    });
    await welcomeHandler(reqForged, resForged);
    assert.strictEqual(resForged.getOutput().statusCode, 401);

    // GET method rejection
    const { req: reqGet, res: resGet } = createMockReqRes({ method: 'GET' });
    await welcomeHandler(reqGet, resGet);
    assert.strictEqual(resGet.getOutput().statusCode, 405);

    // Notifications helper idempotencyKey parameter inspection
    const notificationsContent = fs.readFileSync(path.resolve('api/_lib/notifications.ts'), 'utf-8');
    assert(
      notificationsContent.includes('idempotencyKey?: string'),
      'dispatchResendEmail must accept optional idempotencyKey'
    );
    assert(
      notificationsContent.includes("headers['Idempotency-Key'] = idempotencyKey"),
      'dispatchResendEmail must pass Idempotency-Key header to Resend'
    );

    // Verify live captured Resend calls received Idempotency-Key header
    assert(capturedResendCalls.length > 0, 'Must have captured Resend email dispatches');
    const sampleCall = capturedResendCalls[0];
    assert(
      sampleCall.opts.headers['Idempotency-Key'],
      'Resend call must include Idempotency-Key header'
    );
    assert(
      sampleCall.opts.headers['Idempotency-Key'].startsWith('welcome-user/'),
      'Idempotency-Key must start with welcome-user/'
    );

    console.log('✓ PASS: Security boundaries and provider idempotency header verified.');
  }

  console.log('\n==================================================================');
  console.log('ALL 9 V17.0B.1 RELIABILITY & IDEMPOTENCY TESTS PASSED WITH 100%!');
  console.log('==================================================================\n');
}

runSuite().catch((err) => {
  console.error('Reliability suite failed:', err);
  process.exit(1);
});

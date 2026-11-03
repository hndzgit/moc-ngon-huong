// scripts/test-admin-api.mjs
// Verification test for Mộc Ngôn Hương Secure Admin Order Management API

import assert from 'node:assert';
import handler from '../api/admin/orders.js';

console.log('=== [TEST] Mộc Ngôn Hương Admin Orders Security & Functionality ===');

// Mock request/response helpers
function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'GET',
    url: options.url || '/api/admin/orders',
    headers: options.headers || {},
    body: options.body || undefined,
    query: options.query || {},
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
  const originalAdminUids = process.env.ADMIN_UIDS;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';

  try {
    // 1. Anonymous request without Auth header -> 401
    {
      const { req, res } = createMockReqRes({ method: 'GET' });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 401, 'Anonymous request must return 401');
      assert.strictEqual(out.data.code, 'UNAUTHENTICATED');
      console.log('✓ PASS 1: Anonymous request returns 401');
    }

    // 2. Invalid Bearer token -> 401
    {
      const { req, res } = createMockReqRes({
        method: 'GET',
        headers: { authorization: 'Bearer invalid_forged_token' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 401, 'Invalid token must return 401');
      console.log('✓ PASS 2: Invalid bearer token returns 401');
    }

    // 3. Valid token, but ADMIN_UIDS is NOT configured (empty) -> 403 ADMIN_NOT_CONFIGURED (Fail closed)
    {
      delete process.env.ADMIN_UIDS;
      const { req, res } = createMockReqRes({
        method: 'GET',
        headers: { authorization: 'Bearer test_token_uid_testuser123' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 403, 'Missing ADMIN_UIDS must return 403');
      assert.strictEqual(out.data.code, 'ADMIN_NOT_CONFIGURED');
      console.log('✓ PASS 3: Missing ADMIN_UIDS fails closed with 403 ADMIN_NOT_CONFIGURED');
    }

    // 4. Valid token, but UID is NOT in ADMIN_UIDS allowlist -> 403 FORBIDDEN
    {
      process.env.ADMIN_UIDS = 'shop_owner_uid_abc,another_admin_xyz';
      const { req, res } = createMockReqRes({
        method: 'GET',
        headers: { authorization: 'Bearer test_token_uid_customer_not_admin' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 403, 'Non-admin customer must return 403');
      assert.strictEqual(out.data.code, 'FORBIDDEN');
      console.log('✓ PASS 4: Authenticated customer not in ADMIN_UIDS receives 403 FORBIDDEN');
    }

    // 5. Valid admin token with matched UID -> 200 GET
    {
      process.env.ADMIN_UIDS = 'shop_owner_uid_abc,another_admin_xyz';
      const { req, res } = createMockReqRes({
        method: 'GET',
        headers: { authorization: 'Bearer test_token_uid_shop_owner_uid_abc' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 200, 'Authorized admin must receive 200');
      assert.strictEqual(out.data.success, true);
      assert(Array.isArray(out.data.orders), 'Orders should be an array');
      console.log(`✓ PASS 5: Authorized admin receives 200 with ${out.data.orders.length} orders`);
    }

    // 6. PATCH with invalid status -> 400
    {
      process.env.ADMIN_UIDS = 'shop_owner_uid_abc';
      const { req, res } = createMockReqRes({
        method: 'PATCH',
        headers: { authorization: 'Bearer test_token_uid_shop_owner_uid_abc' },
        body: { orderId: 'test_order_1', status: 'invalid_status_xyz' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 400, 'Invalid status must return 400');
      console.log('✓ PASS 6: PATCH with invalid status returns 400');
    }

    // 7. Method POST or DELETE -> 405 Method Not Allowed
    {
      process.env.ADMIN_UIDS = 'shop_owner_uid_abc';
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { authorization: 'Bearer test_token_uid_shop_owner_uid_abc' },
      });
      await handler(req, res);
      const out = res.getOutput();
      assert.strictEqual(out.statusCode, 405, 'POST must return 405 Method Not Allowed');
      console.log('✓ PASS 7: POST returns 405 Method Not Allowed');
    }

    console.log('\n========================================');
    console.log('ALL 7 ADMIN API SECURITY TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    if (originalAdminUids !== undefined) {
      process.env.ADMIN_UIDS = originalAdminUids;
    } else {
      delete process.env.ADMIN_UIDS;
    }
    process.env.NODE_ENV = originalNodeEnv;
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

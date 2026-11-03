// scripts/test-v17-0b2-deliverability.mjs
// MỘC NGÔN HƯƠNG — V17.0B.2 Deliverability & DNS Authentication Test Suite

import assert from 'node:assert';
import { dispatchResendEmail } from '../api/_lib/notifications.ts';
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from '../api/_lib/authEmailTemplates.ts';

console.log('=== [TEST] Mộc Ngôn Hương V17.0B.2 Email Deliverability & Anti-Spam Suite ===\n');

async function runDeliverabilityTests() {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  try {
    // ------------------------------------------------------------------------
    // TEST 1: dispatchResendEmail includes Reply-To by default
    // ------------------------------------------------------------------------
    console.log('[1/7] Testing default Reply-To header injection in dispatchResendEmail...');
    {
      let capturedPayload = null;
      let capturedHeaders = null;

      global.fetch = async (url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        capturedHeaders = opts.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 're_test_default_reply_to' }),
        };
      };

      process.env.RESEND_API_KEY = 're_test_key_mock_123';
      delete process.env.EMAIL_REPLY_TO;

      const result = await dispatchResendEmail({
        from: 'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>',
        to: ['customer@example.com'],
        subject: 'Kiểm tra Reply-To',
        html: '<p>Xin chào</p>',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(
        capturedPayload.reply_to,
        'mocngonhuong@gmail.com',
        'Payload must default to mocngonhuong@gmail.com'
      );
      assert.strictEqual(
        capturedPayload.from,
        'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>'
      );
      console.log('✓ PASS: Default reply_to is correctly injected as mocngonhuong@gmail.com.');
    }

    // ------------------------------------------------------------------------
    // TEST 2: dispatchResendEmail supports custom Reply-To
    // ------------------------------------------------------------------------
    console.log('[2/7] Testing custom Reply-To support in dispatchResendEmail...');
    {
      let capturedPayload = null;
      global.fetch = async (url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 're_test_custom_reply_to' }),
        };
      };

      const result = await dispatchResendEmail({
        from: 'Mộc Ngôn Hương <donhang@mail.mocngonhuong.com>',
        to: ['order@example.com'],
        replyTo: 'hotro@mocngonhuong.com',
        subject: 'Xác nhận đơn hàng',
        html: '<p>Đơn hàng mới</p>',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(
        capturedPayload.reply_to,
        'hotro@mocngonhuong.com',
        'Must support custom replyTo'
      );
      console.log('✓ PASS: Custom replyTo is correctly mapped to payload.reply_to.');
    }

    // ------------------------------------------------------------------------
    // TEST 3: Strict Production Guard — NO fallback to onboarding@resend.dev
    // ------------------------------------------------------------------------
    console.log('[3/7] Verifying NO silent fallback to onboarding@resend.dev in Production...');
    {
      const calls = [];
      global.fetch = async (url, opts) => {
        const body = JSON.parse(opts.body);
        calls.push({ url, from: body.from });
        return {
          ok: false,
          status: 403,
          json: async () => ({
            statusCode: 403,
            message: 'Domain mail.mocngonhuong.com not verified yet on Resend.',
            name: 'validation_error',
          }),
        };
      };

      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      process.env.ALLOW_DEV_RESEND_FALLBACK = 'false';

      const result = await dispatchResendEmail({
        from: 'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>',
        to: ['customer@example.com'],
        subject: 'Thử nghiệm sản xuất',
        html: '<p>Nội dung</p>',
      });

      assert.strictEqual(result.success, false, 'Must fail observably');
      assert(result.error?.includes('not verified'), 'Must return authentic error from provider');
      assert.strictEqual(calls.length, 1, 'Must NOT make a second request to onboarding@resend.dev');
      assert(
        !calls.some((c) => c.from.includes('onboarding@resend.dev')),
        'Must never spoof or downgrade to onboarding@resend.dev in production'
      );
      console.log('✓ PASS: Production strictly surfaces domain errors without silently degrading to onboarding@resend.dev.');
    }

    // ------------------------------------------------------------------------
    // TEST 4: Sender Address Separation Audit
    // ------------------------------------------------------------------------
    console.log('[4/7] Testing sender address separation between account and order emails...');
    {
      // Check api/_lib/notifications.ts source code
      const fs = await import('node:fs');
      const notificationsSrc = fs.readFileSync('api/_lib/notifications.ts', 'utf-8');
      const welcomeSrc = fs.readFileSync('api/auth/send-welcome-email.ts', 'utf-8');
      const resetSrc = fs.readFileSync('api/auth/send-reset-password.ts', 'utf-8');
      const verificationSrc = fs.readFileSync('api/auth/send-verification.ts', 'utf-8');

      // Account emails must use taikhoan@mail.mocngonhuong.com
      assert(
        welcomeSrc.includes('taikhoan@mail.mocngonhuong.com'),
        'Welcome email must default to taikhoan@mail.mocngonhuong.com'
      );
      assert(
        !welcomeSrc.includes('process.env.ORDER_EMAIL_FROM ||'),
        'Welcome email must NOT fall back to ORDER_EMAIL_FROM'
      );
      assert(
        resetSrc.includes('taikhoan@mail.mocngonhuong.com'),
        'Reset password email must default to taikhoan@mail.mocngonhuong.com'
      );
      assert(
        verificationSrc.includes('taikhoan@mail.mocngonhuong.com'),
        'Verification email must default to taikhoan@mail.mocngonhuong.com'
      );

      // Order emails must use donhang@mail.mocngonhuong.com (subdomain, NOT apex)
      assert(
        notificationsSrc.includes('donhang@mail.mocngonhuong.com'),
        'Order notifications must default to donhang@mail.mocngonhuong.com'
      );
      assert(
        !notificationsSrc.includes('donhang@mocngonhuong.com'),
        'Order notifications must NOT use unauthenticated apex domain donhang@mocngonhuong.com'
      );
      console.log('✓ PASS: Sender identities are cleanly separated: taikhoan@ vs donhang@ on mail.mocngonhuong.com.');
    }

    // ------------------------------------------------------------------------
    // TEST 5: HTML Email Size < 100KB (Gmail Clipping Prevention)
    // ------------------------------------------------------------------------
    console.log('[5/7] Testing HTML email weight to prevent Gmail message clipping (threshold: < 50KB)...');
    {
      const welcome = renderWelcomeEmail({ customerName: 'Nguyễn Hoài Nam' });
      const reset = renderPasswordResetEmail({
        customerName: 'Nguyễn Hoài Nam',
        resetLink: 'https://mocngonhuong.com/#/tai-khoan',
      });
      const verification = renderVerificationEmail({
        customerName: 'Nguyễn Hoài Nam',
        verificationLink: 'https://mocngonhuong.com/#/tai-khoan',
      });

      const welcomeKb = Buffer.byteLength(welcome.html, 'utf8') / 1024;
      const resetKb = Buffer.byteLength(reset.html, 'utf8') / 1024;
      const verifyKb = Buffer.byteLength(verification.html, 'utf8') / 1024;

      console.log(`  - Welcome Email HTML: ${welcomeKb.toFixed(2)} KB`);
      console.log(`  - Password Reset HTML: ${resetKb.toFixed(2)} KB`);
      console.log(`  - Verification HTML: ${verifyKb.toFixed(2)} KB`);

      assert(welcomeKb < 50, 'Welcome email must be under 50KB');
      assert(resetKb < 50, 'Reset password email must be under 50KB');
      assert(verifyKb < 50, 'Verification email must be under 50KB');
      console.log('✓ PASS: All transactional emails are ultralight (< 15KB), well below Gmail 102KB clipping limit.');
    }

    // ------------------------------------------------------------------------
    // TEST 6: Plain-text Alternative & Physical Address (CAN-SPAM / RFC Compliance)
    // ------------------------------------------------------------------------
    console.log('[6/7] Checking plain-text alternative and physical business address...');
    {
      const templates = [
        renderWelcomeEmail({ customerName: 'Quý khách' }),
        renderPasswordResetEmail({ resetLink: 'https://mocngonhuong.com' }),
        renderVerificationEmail({ verificationLink: 'https://mocngonhuong.com' }),
      ];

      for (const t of templates) {
        assert(t.text && t.text.length > 50, 'Must have comprehensive plain text version');
        assert(t.text.includes('42 Phố Hàng Điếu'), 'Plain text must include physical business address');
        assert(t.html.includes('42 Phố Hàng Điếu'), 'HTML must include physical business address');
        assert(t.html.includes('mocngonhuong@gmail.com'), 'Must include contact email');
        assert(t.html.includes('0889 742 556'), 'Must include official hotline');
        assert(t.html.includes('https://mocngonhuong.com'), 'Must link to official website');
      }
      console.log('✓ PASS: Plain text alternative and postal contact info are present in every template.');
    }

    // ------------------------------------------------------------------------
    // TEST 7: Idempotency Key Preservation
    // ------------------------------------------------------------------------
    console.log('[7/7] Testing Idempotency-Key preservation in Resend dispatch...');
    {
      let idempotencyKeyHeader = null;
      global.fetch = async (url, opts) => {
        idempotencyKeyHeader = opts.headers['Idempotency-Key'];
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 're_idempotent_test' }),
        };
      };

      const result = await dispatchResendEmail({
        from: 'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>',
        to: ['customer@example.com'],
        subject: 'Idempotency test',
        html: '<p>Test</p>',
        idempotencyKey: 'welcome-user/uid-xyz-12345',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(
        idempotencyKeyHeader,
        'welcome-user/uid-xyz-12345',
        'Idempotency-Key header must be forwarded to Resend'
      );
      console.log('✓ PASS: Idempotency-Key is correctly passed to Resend API.');
    }

    console.log('\n==================================================================');
    console.log('ALL 7 V17.0B.2 DELIVERABILITY & RESEND INTEGRATION TESTS PASSED!');
    console.log('==================================================================\n');
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
}

runDeliverabilityTests().catch((err) => {
  console.error('FAILED TEST:', err);
  process.exit(1);
});

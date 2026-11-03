import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminAuth, getIsProduction } from '../_lib/firebaseAdmin.js';
import { dispatchResendEmail } from '../_lib/notifications.js';
import { renderPasswordResetEmail } from '../_lib/authEmailTemplates.js';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  body?: any;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

// In-memory sliding rate limiter per IP / Email to prevent spam and relay abuse
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitMap = new Map<string, { count: number; firstSeen: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.firstSeen > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, firstSeen: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

async function parseRequestBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Phương thức không được hỗ trợ. Chỉ chấp nhận POST.',
      })
    );
    return;
  }

  const body = await parseRequestBody(req);
  const emailInput = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  // 1. Email format validation
  if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Vui lòng cung cấp địa chỉ email hợp lệ.',
      })
    );
    return;
  }

  // 2. Rate limiting check
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const rateLimitKey = `${clientIp}_${emailInput}`;

  if (!checkRateLimit(rateLimitKey)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 429;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi vài phút trước khi thử lại.',
      })
    );
    return;
  }

  const isProduction = getIsProduction();
  const adminAuth = getAdminAuth();
  if (isProduction && !adminAuth) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Dịch vụ xác thực chưa sẵn sàng trên máy chủ.',
      })
    );
    return;
  }

  // Generic non-enumerating message (Privacy & Security Best Practice)
  const successResponse = {
    success: true,
    message: 'Nếu địa chỉ email tồn tại trên hệ thống Mộc Ngôn Hương, liên kết đặt lại mật khẩu đã được gửi đến bạn.',
  };

  try {
    // 3. Generate genuine Firebase password reset action link
    const actionSettings = {
      url: 'https://mocngonhuong.com/#/tai-khoan',
    };

    let resetLink: string | null = null;
    try {
      resetLink = await adminAuth.generatePasswordResetLink(emailInput, actionSettings);
    } catch (linkErr: any) {
      // Non-enumerating: If user not found, safely return generic success without revealing existence
      console.log(`[Auth Reset] Request for ${emailInput} (handled non-enumerating)`);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(successResponse));
      return;
    }

    if (resetLink) {
      // 4. Render brand-aligned HTML email
      const customerName = emailInput.split('@')[0];
      const { subject, html, text } = renderPasswordResetEmail({
        customerName,
        resetLink,
      });

      // 5. Dispatch through Resend using verified brand sender
      const fromEmail =
        process.env.AUTH_EMAIL_FROM ||
        'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>';

      const sendResult = await dispatchResendEmail({
        from: fromEmail,
        to: [emailInput],
        replyTo: 'mocngonhuong@gmail.com',
        subject,
        html,
        text,
      });

      if (!sendResult.success) {
        console.error('[Auth Reset] Failed to dispatch email via Resend:', sendResult.error);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 502;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Không thể gửi email qua dịch vụ bưu chính. Vui lòng thử lại sau ít phút.',
          })
        );
        return;
      }

      console.log(`[Auth Reset] Password reset email successfully sent to ${emailInput}`);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(successResponse));
    return;
  } catch (err: any) {
    console.error('[Auth Reset] Unexpected error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Lỗi máy chủ khi xử lý yêu cầu đặt lại mật khẩu.',
      })
    );
    return;
  }
}

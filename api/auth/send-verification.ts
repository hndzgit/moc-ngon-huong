import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminAuth, verifyAuthToken, getIsProduction } from '../_lib/firebaseAdmin.js';
import { dispatchResendEmail } from '../_lib/notifications.js';
import { renderVerificationEmail } from '../_lib/authEmailTemplates.js';

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

  // 1. Authenticate user from Firebase ID Token (Server-Side Verification)
  const authHeader = req.headers?.authorization;
  let verifiedUser: { uid: string; email?: string } | null = null;

  try {
    verifiedUser = await verifyAuthToken(authHeader);
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      })
    );
    return;
  }

  if (!verifiedUser || !verifiedUser.uid || !verifiedUser.email) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Yêu cầu đăng nhập để gửi email xác thực tài khoản.',
      })
    );
    return;
  }

  const targetEmail = verifiedUser.email.trim().toLowerCase();
  const adminAuth = getAdminAuth();

  const isProduction = getIsProduction();
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

  try {
    // 2. Generate authentic Firebase verification action link
    const actionSettings = {
      url: 'https://mocngonhuong.com/#/tai-khoan',
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(
      targetEmail,
      actionSettings
    );

    // 3. Render brand-aligned HTML email
    const customerName = targetEmail.split('@')[0];
    const { subject, html, text } = renderVerificationEmail({
      customerName,
      verificationLink,
    });

    // 4. Dispatch through Resend using verified brand sender
    const fromEmail =
      process.env.AUTH_EMAIL_FROM ||
      'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>';

    const sendResult = await dispatchResendEmail({
      from: fromEmail,
      to: [targetEmail],
      replyTo: 'mocngonhuong@gmail.com',
      subject,
      html,
      text,
    });

    if (!sendResult.success) {
      console.error('[Auth Email] Failed to send verification email via Resend:', sendResult.error);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 502;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Không thể gửi email xác thực qua hệ thống bưu điện điện tử. Vui lòng thử lại sau ít phút.',
        })
      );
      return;
    }

    console.log(`[Auth Email] Verification email successfully sent to ${targetEmail}`);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        message: 'Email xác minh tài khoản Mộc Ngôn Hương đã được gửi thành công.',
      })
    );
    return;
  } catch (err: any) {
    console.error('[Auth Email] Error generating verification link:', err);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Lỗi máy chủ khi tạo liên kết xác thực tài khoản.',
      })
    );
    return;
  }
}

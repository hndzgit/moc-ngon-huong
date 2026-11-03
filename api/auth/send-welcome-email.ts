import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminAuth, getFirestoreDb, verifyAuthToken, getIsProduction } from '../_lib/firebaseAdmin.js';
import { dispatchResendEmail } from '../_lib/notifications.js';
import { renderWelcomeEmail } from '../_lib/authEmailTemplates.js';

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

  // 1. Authenticate caller from Firebase ID Token (Server-Side Verification)
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
        error: 'Yêu cầu đăng nhập hợp lệ để gửi email chào mừng.',
      })
    );
    return;
  }

  // Strictly target the authenticated account's email only (prevents arbitrary email abuse)
  const targetEmail = verifiedUser.email.trim().toLowerCase();
  const uid = verifiedUser.uid;

  // 2. Prevent duplicate welcome emails (Idempotency check via Firestore)
  const db = getFirestoreDb();
  if (db) {
    try {
      const existingDoc = await db.collection('welcome_emails').doc(uid).get();
      if (existingDoc.exists) {
        console.log(`[Welcome Email] Welcome email already dispatched previously for UID: ${uid}`);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            success: true,
            message: 'Email chào mừng đã được gửi trước đó.',
            alreadySent: true,
          })
        );
        return;
      }
    } catch (dbErr) {
      console.warn('[Welcome Email] Failed to check welcome email idempotency doc:', dbErr);
    }
  }

  // 3. Extract Customer Name
  let customerName = '';
  // Try body payload first if provided
  if (req.body && typeof req.body === 'object' && typeof req.body.fullName === 'string' && req.body.fullName.trim()) {
    customerName = req.body.fullName.trim();
  }
  // Fall back to Firebase Admin SDK User Record if name not in body
  if (!customerName) {
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord?.displayName?.trim()) {
          customerName = userRecord.displayName.trim();
        }
      } catch (userErr) {
        console.warn('[Welcome Email] Could not fetch user record from Admin Auth:', userErr);
      }
    }
  }
  // Ultimate fallback
  if (!customerName) {
    customerName = targetEmail.split('@')[0];
  }

  // 4. Render brand-aligned HTML welcome email
  const { subject, html, text } = renderWelcomeEmail({
    customerName,
  });

  // 5. Dispatch through Resend using verified brand sender
  const fromEmail =
    process.env.AUTH_EMAIL_FROM ||
    process.env.ORDER_EMAIL_FROM ||
    'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>';

  const sendResult = await dispatchResendEmail({
    from: fromEmail,
    to: [targetEmail],
    subject,
    html,
    text,
  });

  if (!sendResult.success) {
    console.error('[Welcome Email] Failed to send welcome email via Resend:', sendResult.error);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Không thể gửi email chào mừng qua dịch vụ gửi thư. Vui lòng thử lại sau ít phút.',
      })
    );
    return;
  }

  // 6. Record idempotency in Firestore
  if (db) {
    try {
      await db.collection('welcome_emails').doc(uid).set({
        uid,
        email: targetEmail,
        customerName,
        sentAt: new Date().toISOString(),
      });
    } catch (saveErr) {
      console.warn('[Welcome Email] Could not record welcome email tracking doc:', saveErr);
    }
  }

  console.log(`[Welcome Email] Welcome email successfully sent to ${targetEmail} (UID: ${uid})`);

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      success: true,
      message: 'Email chào mừng Mộc Ngôn Hương đã được gửi thành công.',
    })
  );
}

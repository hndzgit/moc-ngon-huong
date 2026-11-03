import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminAuth, getFirestoreDb, verifyAuthToken, getIsProduction } from '../_lib/firebaseAdmin.js';
import { dispatchResendEmail } from '../_lib/notifications.js';
import { renderWelcomeEmail, sanitizeCustomerName } from '../_lib/authEmailTemplates.js';

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

const STALE_PENDING_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

export interface WelcomeEmailRecord {
  uid: string;
  email: string;
  customerName?: string;
  status: 'pending' | 'sent' | 'failed';
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  lastError?: string;
  messageId?: string;
  provider?: string;
}

// In-memory store for dev/test mock environments when Firestore SDK connection is not configured
const devMockStore = new Map<string, WelcomeEmailRecord>();

export function _clearDevMockStore(): void {
  devMockStore.clear();
}

export function _getDevMockStore(): Map<string, WelcomeEmailRecord> {
  return devMockStore;
}

type ReservationResult =
  | { canSend: true; attempt: number }
  | { canSend: false; reason: 'ALREADY_SENT' | 'IN_PROGRESS' | 'MAX_ATTEMPTS_EXCEEDED' };

function handleMockReservation(
  uid: string,
  email: string,
  customerName: string,
  nowIso: string,
  nowMs: number
): ReservationResult {
  const existing = devMockStore.get(uid);
  if (!existing) {
    devMockStore.set(uid, {
      uid,
      email,
      customerName,
      status: 'pending',
      attemptCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      provider: 'resend',
    });
    return { canSend: true, attempt: 1 };
  }

  const isSent =
    existing.status === 'sent' ||
    (!existing.status && Boolean(existing.sentAt)) ||
    (!existing.status && !existing.lastError);

  if (isSent) {
    return { canSend: false, reason: 'ALREADY_SENT' };
  }

  if (existing.status === 'pending') {
    const lastUpdatedMs = new Date(existing.updatedAt).getTime();
    const isStale = nowMs - lastUpdatedMs > STALE_PENDING_MS;
    if (!isStale) {
      return { canSend: false, reason: 'IN_PROGRESS' };
    }
    if (existing.attemptCount >= MAX_ATTEMPTS) {
      return { canSend: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
    }
    existing.status = 'pending';
    existing.attemptCount += 1;
    existing.updatedAt = nowIso;
    existing.customerName = customerName;
    return { canSend: true, attempt: existing.attemptCount };
  }

  // existing.status === 'failed'
  if (existing.attemptCount >= MAX_ATTEMPTS) {
    return { canSend: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
  }
  existing.status = 'pending';
  existing.attemptCount += 1;
  existing.updatedAt = nowIso;
  existing.customerName = customerName;
  return { canSend: true, attempt: existing.attemptCount };
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

  // 2. Extract and sanitize Customer Name
  let rawName = '';
  if (req.body && typeof req.body === 'object' && typeof req.body.fullName === 'string') {
    rawName = req.body.fullName;
  }
  if (!rawName) {
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord?.displayName) {
          rawName = userRecord.displayName;
        }
      } catch (userErr) {
        console.warn('[Welcome Email] Could not fetch user record from Admin Auth:', userErr);
      }
    }
  }
  if (!rawName) {
    rawName = targetEmail.split('@')[0];
  }

  const customerName = sanitizeCustomerName(rawName, 'Quý khách');

  // 3. Concurrency-Safe Idempotency via Firestore Transaction
  const db = getFirestoreDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  let reservation: ReservationResult;

  if (db) {
    try {
      const docRef = db.collection('welcome_emails').doc(uid);
      reservation = await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
          transaction.set(docRef, {
            uid,
            email: targetEmail,
            customerName,
            status: 'pending',
            attemptCount: 1,
            createdAt: nowIso,
            updatedAt: nowIso,
            provider: 'resend',
          });
          return { canSend: true, attempt: 1 };
        }

        const data = docSnap.data() as any;

        // Backward compatibility with legacy records (V17.0B)
        const isSent =
          data.status === 'sent' ||
          (!data.status && Boolean(data.sentAt)) ||
          (!data.status && !data.lastError);

        if (isSent) {
          return { canSend: false, reason: 'ALREADY_SENT' };
        }

        const attemptCount = typeof data.attemptCount === 'number' ? data.attemptCount : 1;

        if (data.status === 'pending') {
          const lastUpdatedMs = data.updatedAt
            ? new Date(data.updatedAt).getTime()
            : data.createdAt
            ? new Date(data.createdAt).getTime()
            : 0;
          const isStale = nowMs - lastUpdatedMs > STALE_PENDING_MS;

          if (!isStale) {
            // Another concurrent request is actively processing this send right now
            return { canSend: false, reason: 'IN_PROGRESS' };
          }

          // Stale pending reservation: check max attempts
          if (attemptCount >= MAX_ATTEMPTS) {
            return { canSend: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
          }

          // Reclaim stale reservation
          transaction.update(docRef, {
            status: 'pending',
            attemptCount: attemptCount + 1,
            updatedAt: nowIso,
            customerName,
            lastError: 'Khôi phục phiên gửi bị gián đoạn trước đó',
          });
          return { canSend: true, attempt: attemptCount + 1 };
        }

        // status === 'failed'
        if (attemptCount >= MAX_ATTEMPTS) {
          return { canSend: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
        }

        transaction.update(docRef, {
          status: 'pending',
          attemptCount: attemptCount + 1,
          updatedAt: nowIso,
          customerName,
        });
        return { canSend: true, attempt: attemptCount + 1 };
      });
    } catch (txnErr) {
      console.error('[Welcome Email] Transaction failure for UID:', uid, txnErr);
      if (getIsProduction()) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Hệ thống cơ sở dữ liệu tạm thời bận. Vui lòng thử lại sau ít phút.',
          })
        );
        return;
      }
      // Non-production test fallback to in-memory store
      reservation = handleMockReservation(uid, targetEmail, customerName, nowIso, nowMs);
    }
  } else {
    // No Firestore DB instance available
    if (getIsProduction()) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Dịch vụ lưu trữ cơ sở dữ liệu không khả dụng.',
        })
      );
      return;
    }
    // Dev/Test in-memory fallback
    reservation = handleMockReservation(uid, targetEmail, customerName, nowIso, nowMs);
  }

  // 4. Handle non-sendable reservation reasons
  if (!reservation.canSend) {
    if (reservation.reason === 'ALREADY_SENT') {
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

    if (reservation.reason === 'IN_PROGRESS') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          message: 'Email chào mừng đang được gửi xử lý.',
          inProgress: true,
        })
      );
      return;
    }

    // MAX_ATTEMPTS_EXCEEDED
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 429;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Đã đạt giới hạn số lần thử gửi email chào mừng cho tài khoản này.',
      })
    );
    return;
  }

  // 5. Render brand-aligned HTML welcome email with safe HTML escaping
  const { subject, html, text } = renderWelcomeEmail({
    customerName,
  });

  // 6. Dispatch through Resend using verified brand sender and Idempotency-Key
  // CRITICAL: Must be called OUTSIDE the Firestore transaction!
  const fromEmail =
    process.env.AUTH_EMAIL_FROM ||
    process.env.ORDER_EMAIL_FROM ||
    'Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>';

  const idempotencyKey = `welcome-user/${uid}`;

  const sendResult = await dispatchResendEmail({
    from: fromEmail,
    to: [targetEmail],
    subject,
    html,
    text,
    idempotencyKey,
  });

  // 7. Update reservation status based on delivery outcome
  if (sendResult.success) {
    const successIso = new Date().toISOString();
    if (db) {
      try {
        await db.collection('welcome_emails').doc(uid).update({
          status: 'sent',
          sentAt: successIso,
          updatedAt: successIso,
          messageId: sendResult.id || null,
        });
      } catch (updateErr) {
        console.warn('[Welcome Email] Failed to mark welcome email sent in Firestore:', updateErr);
      }
    } else {
      const mockRecord = devMockStore.get(uid);
      if (mockRecord) {
        mockRecord.status = 'sent';
        mockRecord.sentAt = successIso;
        mockRecord.updatedAt = successIso;
        mockRecord.messageId = sendResult.id;
      }
    }

    console.log(`[Welcome Email] Welcome email successfully sent to ${targetEmail} (UID: ${uid})`);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        message: 'Email chào mừng Mộc Ngôn Hương đã được gửi thành công.',
        messageId: sendResult.id,
      })
    );
    return;
  }

  // Send failed
  const failIso = new Date().toISOString();
  if (db) {
    try {
      await db.collection('welcome_emails').doc(uid).update({
        status: 'failed',
        lastError: sendResult.error || 'Dispatch error',
        updatedAt: failIso,
      });
    } catch (updateErr) {
      console.warn('[Welcome Email] Failed to mark welcome email failed in Firestore:', updateErr);
    }
  } else {
    const mockRecord = devMockStore.get(uid);
    if (mockRecord) {
      mockRecord.status = 'failed';
      mockRecord.lastError = sendResult.error || 'Dispatch error';
      mockRecord.updatedAt = failIso;
    }
  }

  console.error('[Welcome Email] Failed to send welcome email via Resend:', sendResult.error);
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 502;
  res.end(
    JSON.stringify({
      success: false,
      error: 'Không thể gửi email chào mừng qua dịch vụ gửi thư. Vui lòng thử lại sau ít phút.',
    })
  );
}

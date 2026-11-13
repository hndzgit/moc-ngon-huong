// api/admin/orders.ts
// Secure Server-Side Admin Order Management & Manual VietQR Payment Verification API
// Security & Reliability Guarantees:
// 1. Cryptographically verifies Firebase ID token via Firebase Admin SDK
// 2. Enforces strict server-side ADMIN_UIDS allowlist (Fail-closed 403)
// 3. Concurrency-safe manual payment confirmation ("Xác nhận đã thanh toán") with audit log
// 4. Triggers Resend Email B (Payment Confirmed) idempotently only after admin confirmation

import { getAdminDb, isProductionRuntime, verifyAdminAuth } from '../_lib/firebaseAdmin.js';
import { sendPaymentConfirmedNotification } from '../_lib/notifications.js';
import {
  enrichAndSanitizeOrderForClient,
  readLocalDevOrders,
  withLocalStoreLock,
  writeLocalDevOrders,
} from '../_lib/orderRecovery.js';

export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'pending_payment'
  | 'pending'
  | 'customer_reported_paid'
  | 'paid'
  | 'completed'
  | 'payment_review'
  | 'cancelled'
  | 'failed'
  | 'refunded';

const VALID_ORDER_STATUSES = new Set<OrderStatus>([
  'pending_confirmation',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'shipping',
  'completed',
  'cancelled',
]);

const VALID_PAYMENT_STATUSES = new Set<PaymentStatus>([
  'pending_payment',
  'pending',
  'customer_reported_paid',
  'paid',
  'completed',
  'payment_review',
  'cancelled',
  'failed',
  'refunded',
]);

function getEffectiveDb() {
  if (process.env.MNH_USE_LOCAL_DEV_STORE === '1' && !isProductionRuntime()) {
    return null;
  }
  return getAdminDb();
}

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
      if (raw.length > 500_000) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: any, statusCode: number, data: Record<string, any>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

// ============================================================================
// GET /api/admin/orders
// ============================================================================
async function handleGetOrders(req: any, res: any, adminUid: string) {
  const db = getEffectiveDb();
  const isProd = isProductionRuntime();

  const query = req.query || {};
  const statusFilter = typeof query.status === 'string' ? query.status.trim() : '';
  const paymentFilter = typeof query.paymentStatus === 'string' ? query.paymentStatus.trim() : '';
  const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
  const limitRaw = parseInt(String(query.limit || '100'), 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 300) : 100;

  let orders: any[] = [];

  if (db) {
    try {
      const snapshot = await db
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      orders = snapshot.docs.map((doc) =>
        enrichAndSanitizeOrderForClient({
          id: doc.id,
          ...doc.data(),
        })
      );
    } catch (err: any) {
      console.error('[MNH Admin Orders GET] Firestore query error:', err?.message || err);
      try {
        const fallbackSnap = await db.collection('orders').limit(limit).get();
        orders = fallbackSnap.docs.map((doc) =>
          enrichAndSanitizeOrderForClient({
            id: doc.id,
            ...doc.data(),
          })
        );
        orders.sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
      } catch {
        return sendJson(res, 503, {
          success: false,
          code: 'FIRESTORE_READ_ERROR',
          error: 'Không thể truy xuất danh sách đơn hàng từ Firestore.',
        });
      }
    }
  } else {
    if (isProd) {
      return sendJson(res, 503, {
        success: false,
        code: 'DB_NOT_CONFIGURED',
        error: 'Cơ sở dữ liệu Firestore chưa sẵn sàng trên môi trường Production.',
      });
    }
    orders = readLocalDevOrders()
      .map((o) => {
        const clean = { ...o };
        delete clean._fingerprint;
        return enrichAndSanitizeOrderForClient(clean);
      })
      .sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
  }

  if (statusFilter && statusFilter !== 'all') {
    orders = orders.filter((o) => (o.orderStatus || o.status) === statusFilter);
  }

  if (paymentFilter && paymentFilter !== 'all') {
    orders = orders.filter((o) => o.paymentStatus === paymentFilter);
  }

  if (search) {
    orders = orders.filter((o) => {
      const code = String(o.orderCode || '').toLowerCase();
      const name = String(o.customer?.fullName || '').toLowerCase();
      const phone = String(o.customer?.phone || '').toLowerCase();
      const email = String(o.customer?.email || '').toLowerCase();
      return (
        code.includes(search) ||
        name.includes(search) ||
        phone.includes(search) ||
        email.includes(search)
      );
    });
  }

  return sendJson(res, 200, {
    success: true,
    adminUid,
    total: orders.length,
    orders: orders.slice(0, limit),
  });
}

// ============================================================================
// PATCH /api/admin/orders
// ============================================================================
async function handlePatchOrder(
  req: any,
  res: any,
  adminUid: string,
  adminEmail?: string
) {
  let body: any;
  try {
    body = await parseJsonBody(req);
  } catch {
    return sendJson(res, 400, {
      success: false,
      code: 'INVALID_JSON',
      error: 'Dữ liệu gửi lên không đúng định dạng JSON.',
    });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const action = typeof body.action === 'string' ? body.action.trim() : '';
  const newStatus = typeof body.status === 'string' ? (body.status.trim() as OrderStatus) : undefined;
  let newPaymentStatus =
    typeof body.paymentStatus === 'string'
      ? (body.paymentStatus.trim() as PaymentStatus)
      : undefined;
  const cleanTxRef =
    typeof body.transactionRef === 'string'
      ? body.transactionRef.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 120)
      : typeof body.bankTransactionRef === 'string'
      ? body.bankTransactionRef.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 120)
      : undefined;

  if (action === 'confirm_payment' && !newPaymentStatus) {
    newPaymentStatus = 'paid';
  }

  if (!orderId) {
    return sendJson(res, 400, {
      success: false,
      code: 'MISSING_ORDER_ID',
      error: 'Thiếu mã bản ghi đơn hàng (orderId).',
    });
  }

  if (!newStatus && !newPaymentStatus && action !== 'retry_payment_email') {
    return sendJson(res, 400, {
      success: false,
      code: 'MISSING_UPDATE_FIELDS',
      error: 'Cần cung cấp trạng thái đơn hàng hoặc trạng thái thanh toán cần cập nhật.',
    });
  }

  if (newStatus && !VALID_ORDER_STATUSES.has(newStatus)) {
    return sendJson(res, 400, {
      success: false,
      code: 'INVALID_ORDER_STATUS',
      error: `Trạng thái đơn hàng "${newStatus}" không hợp lệ.`,
    });
  }

  if (newPaymentStatus && !VALID_PAYMENT_STATUSES.has(newPaymentStatus)) {
    return sendJson(res, 400, {
      success: false,
      code: 'INVALID_PAYMENT_STATUS',
      error: `Trạng thái thanh toán "${newPaymentStatus}" không hợp lệ.`,
    });
  }

  const db = getEffectiveDb();
  const isProd = isProductionRuntime();
  const nowIso = new Date().toISOString();

  const applyAdminPatch = (existingOrder: any): {
    httpStatus: number;
    code?: string;
    error?: string;
    updatedOrder?: any;
    mutated?: boolean;
    shouldSendPaymentEmail?: boolean;
    alreadyConfirmed?: boolean;
  } => {
    if (!existingOrder) {
      return {
        httpStatus: 404,
        code: 'ORDER_NOT_FOUND',
        error: `Không tìm thấy đơn hàng có mã "${orderId}".`,
      };
    }

    const currentOrderStatus: OrderStatus =
      existingOrder.orderStatus || existingOrder.status || 'pending_confirmation';
    const currentPaymentStatus: PaymentStatus = existingOrder.paymentStatus || 'pending';

    // Handle explicit retry of payment confirmation email on an already-paid order
    if (action === 'retry_payment_email') {
      if (currentPaymentStatus !== 'paid' && currentPaymentStatus !== 'completed') {
        return {
          httpStatus: 409,
          code: 'PAYMENT_NOT_CONFIRMED',
          error: 'Chỉ có thể gửi email xác nhận thanh toán cho đơn hàng đã được duyệt thanh toán.',
        };
      }
      return {
        httpStatus: 200,
        updatedOrder: existingOrder,
        mutated: false,
        shouldSendPaymentEmail: !existingOrder.notificationDelivery?.paymentConfirmed?.sent,
        alreadyConfirmed: true,
      };
    }

    const isConfirmingPayment =
      action === 'confirm_payment' ||
      newPaymentStatus === 'paid' ||
      newPaymentStatus === 'completed';

    if (isConfirmingPayment) {
      // Prevent confirming payment directly on a cancelled order unless placed into payment_review first
      if (
        (currentOrderStatus === 'cancelled' || currentPaymentStatus === 'cancelled') &&
        currentPaymentStatus !== 'payment_review'
      ) {
        return {
          httpStatus: 409,
          code: 'ORDER_CANCELLED_PAYMENT_BLOCKED',
          error:
            'Đơn hàng đã bị hủy. Nếu khách chuyển khoản muộn, vui lòng chuyển trạng thái thanh toán sang "Kiểm tra thanh toán" (payment_review) trước khi xác nhận đã thanh toán.',
        };
      }

      // Idempotent handling if already confirmed paid
      if (
        (currentPaymentStatus === 'paid' || currentPaymentStatus === 'completed') &&
        (!newStatus || newStatus === currentOrderStatus)
      ) {
        return {
          httpStatus: 200,
          updatedOrder: existingOrder,
          mutated: false,
          shouldSendPaymentEmail: !existingOrder.notificationDelivery?.paymentConfirmed?.sent,
          alreadyConfirmed: true,
        };
      }
    }

    const updates: Record<string, any> = {
      updatedAt: nowIso,
      updatedBy: adminUid,
    };

    const existingAudit = Array.isArray(existingOrder.paymentAuditLog)
      ? [...existingOrder.paymentAuditLog]
      : [];

    if (newStatus) {
      updates.orderStatus = newStatus;
      updates.status = newStatus;
      updates.statusUpdatedAt = nowIso;

      // If cancelling an unpaid order and no explicit paymentStatus passed, mark paymentStatus appropriately
      if (newStatus === 'cancelled' && !newPaymentStatus) {
        if (currentPaymentStatus === 'pending_payment' || currentPaymentStatus === 'pending') {
          updates.paymentStatus = 'cancelled';
          existingAudit.push({
            orderId: existingOrder.id,
            orderCode: existingOrder.orderCode,
            action: 'admin_cancel_order',
            previousPaymentStatus: currentPaymentStatus,
            newPaymentStatus: 'cancelled',
            actorType: 'admin',
            actorUid: adminUid,
            actorEmail: adminEmail || null,
            timestamp: nowIso,
          });
        } else if (currentPaymentStatus === 'customer_reported_paid') {
          updates.paymentStatus = 'payment_review';
          existingAudit.push({
            orderId: existingOrder.id,
            orderCode: existingOrder.orderCode,
            action: 'admin_cancel_order_with_reported_transfer',
            previousPaymentStatus: currentPaymentStatus,
            newPaymentStatus: 'payment_review',
            actorType: 'admin',
            actorUid: adminUid,
            actorEmail: adminEmail || null,
            timestamp: nowIso,
          });
        }
      }
    }

    let shouldSendPaymentEmail = false;

    if (newPaymentStatus) {
      const normalizedTarget: PaymentStatus =
        isConfirmingPayment && existingOrder.paymentMethod === 'bank'
          ? 'paid'
          : newPaymentStatus;

      updates.paymentStatus = normalizedTarget;

      if (normalizedTarget === 'paid' || normalizedTarget === 'completed') {
        updates.paymentConfirmedAt = existingOrder.paymentConfirmedAt || nowIso;
        updates.paymentConfirmedBy = existingOrder.paymentConfirmedBy || adminUid;
        updates.paymentConfirmedByEmail =
          existingOrder.paymentConfirmedByEmail || adminEmail || null;
        if (cleanTxRef !== undefined) {
          updates.bankTransactionRef = cleanTxRef || null;
        }
        // Advance orderStatus from pending_confirmation to confirmed automatically when payment is confirmed
        if (!newStatus && currentOrderStatus === 'pending_confirmation') {
          updates.orderStatus = 'confirmed';
          updates.status = 'confirmed';
          updates.statusUpdatedAt = nowIso;
        }
        shouldSendPaymentEmail = !existingOrder.notificationDelivery?.paymentConfirmed?.sent;
      }

      if (currentPaymentStatus !== normalizedTarget || cleanTxRef) {
        existingAudit.push({
          orderId: existingOrder.id,
          orderCode: existingOrder.orderCode,
          action: isConfirmingPayment ? 'admin_confirm_payment' : 'admin_update_payment_status',
          previousPaymentStatus: currentPaymentStatus,
          newPaymentStatus: normalizedTarget,
          actorType: 'admin',
          actorUid: adminUid,
          actorEmail: adminEmail || null,
          timestamp: nowIso,
          transactionRef: cleanTxRef || null,
        });
      }
    }

    updates.paymentAuditLog = existingAudit;

    const updatedOrder = {
      ...existingOrder,
      ...updates,
    };

    return {
      httpStatus: 200,
      updatedOrder,
      mutated: true,
      shouldSendPaymentEmail,
      alreadyConfirmed: false,
    };
  };

  let patchOutcome: ReturnType<typeof applyAdminPatch>;

  if (db) {
    try {
      const docRef = db.collection('orders').doc(orderId);
      patchOutcome = await db.runTransaction(async (tx) => {
        const docSnap = await tx.get(docRef);
        const raw = docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
        const result = applyAdminPatch(raw);
        if (result.mutated && result.updatedOrder) {
          tx.set(docRef, result.updatedOrder, { merge: true });
        }
        return result;
      });
    } catch (err: any) {
      console.error('[MNH Admin Orders PATCH] Firestore update error:', err?.message || err);
      return sendJson(res, 503, {
        success: false,
        code: 'FIRESTORE_WRITE_ERROR',
        error: 'Không thể cập nhật trạng thái đơn hàng trên Firestore.',
      });
    }
  } else {
    if (isProd) {
      return sendJson(res, 503, {
        success: false,
        code: 'DB_NOT_CONFIGURED',
        error: 'Cơ sở dữ liệu Firestore chưa sẵn sàng trên môi trường Production.',
      });
    }

    patchOutcome = await withLocalStoreLock(async () => {
      const localOrders = readLocalDevOrders();
      const idx = localOrders.findIndex((o) => o.id === orderId || o.orderCode === orderId);
      const raw = idx >= 0 ? localOrders[idx] : null;
      const result = applyAdminPatch(raw);
      if (result.mutated && result.updatedOrder && idx >= 0) {
        localOrders[idx] = result.updatedOrder;
        writeLocalDevOrders(localOrders);
      }
      return result;
    });
  }

  if (patchOutcome.httpStatus !== 200 || !patchOutcome.updatedOrder) {
    return sendJson(res, patchOutcome.httpStatus, {
      success: false,
      code: patchOutcome.code,
      error: patchOutcome.error,
    });
  }

  const finalOrder = patchOutcome.updatedOrder;
  let emailSent = Boolean(finalOrder.notificationDelivery?.paymentConfirmed?.sent);
  let emailError: string | null = null;

  // Send Email B (Payment Confirmed) ONLY after admin confirmation and if not already sent
  if (patchOutcome.shouldSendPaymentEmail) {
    try {
      const emailRes = await sendPaymentConfirmedNotification(finalOrder);
      emailSent = Boolean(emailRes.customerEmailSent);
      emailError = emailRes.error || null;

      const paymentConfirmedDelivery = {
        sent: emailSent,
        sentAt: emailRes.sentAt || (emailSent ? new Date().toISOString() : null),
        messageId: emailRes.messageId || null,
        idempotencyKey: emailRes.idempotencyKey || `payment-confirmed-${finalOrder.id}`,
        lastAttemptAt: new Date().toISOString(),
        error: emailError,
      };

      finalOrder.notificationDelivery = {
        ...(finalOrder.notificationDelivery || {}),
        paymentConfirmed: paymentConfirmedDelivery,
      };

      if (db) {
        await db
          .collection('orders')
          .doc(finalOrder.id)
          .set({ notificationDelivery: finalOrder.notificationDelivery }, { merge: true })
          .catch(() => {});
      } else if (!isProd) {
        await withLocalStoreLock(async () => {
          const localOrders = readLocalDevOrders();
          const idx = localOrders.findIndex((o) => o.id === finalOrder.id);
          if (idx >= 0) {
            localOrders[idx].notificationDelivery = finalOrder.notificationDelivery;
            writeLocalDevOrders(localOrders);
          }
        });
      }
    } catch (err: any) {
      emailError = err?.message || 'Lỗi gửi email xác nhận thanh toán';
      console.warn('[MNH Admin Orders PATCH] Non-fatal Email B error:', emailError);
    }
  }

  return sendJson(res, 200, {
    success: true,
    alreadyConfirmed: Boolean(patchOutcome.alreadyConfirmed),
    emailSent,
    emailResult: { sent: emailSent, error: emailError },
    ...(emailError ? { emailError } : {}),
    order: enrichAndSanitizeOrderForClient(finalOrder),
  });
}

// ============================================================================
// MAIN ROUTER HANDLER
// ============================================================================
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return sendJson(res, 405, {
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      error: `Phương thức ${req.method} không được phép trên đường dẫn này.`,
    });
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const authOutcome = await verifyAdminAuth(authHeader);

  if (!authOutcome.authorized || !authOutcome.admin) {
    return sendJson(res, authOutcome.statusCode || 403, {
      success: false,
      code: authOutcome.errorCode || 'FORBIDDEN',
      error: authOutcome.errorMessage || 'Không có quyền truy cập khu vực quản trị.',
    });
  }

  const adminUid = authOutcome.admin.uid;
  const adminEmail = authOutcome.admin.email;

  if (req.method === 'GET') {
    return handleGetOrders(req, res, adminUid);
  }

  if (req.method === 'PATCH') {
    return handlePatchOrder(req, res, adminUid, adminEmail);
  }
}

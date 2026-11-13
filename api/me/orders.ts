// api/me/orders.ts
// Authenticated Customer Order History & Guest-to-Account Order Linking API
// Security Guarantees:
// 1. Cryptographically verifies Firebase ID token via Firebase Admin SDK
// 2. Queries ONLY orders where userId === verifiedUser.uid (or customerUid === verifiedUser.uid)
// 3. Supports safe Guest-to-Account linking (POST action: 'link_guest_order') with recoveryToken verification

import { getAdminDb, isProductionRuntime, verifyAuthToken } from '../_lib/firebaseAdmin.js';
import {
  enrichAndSanitizeOrderForClient,
  readLocalDevOrders,
  verifyRecoveryTokenHash,
  withLocalStoreLock,
  writeLocalDevOrders,
} from '../_lib/orderRecovery.js';

function getEffectiveDb() {
  if (process.env.MNH_USE_LOCAL_DEV_STORE === '1' && !isProductionRuntime()) {
    return null;
  }
  return getAdminDb();
}

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);
  let raw = '';
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: any) => {
      raw += chunk;
      if (raw.length > 5e5) reject(new Error('PAYLOAD_TOO_LARGE'));
    });
    req.on('end', () => resolve());
    req.on('error', (err: any) => reject(err));
  });
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.statusCode = 405;
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng GET hoặc POST.',
      })
    );
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.',
      })
    );
  }

  let verifiedUser: { uid: string; email?: string; isAnonymous?: boolean } | null = null;
  try {
    verifiedUser = await verifyAuthToken(authHeader);
  } catch {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({
        success: false,
        code: 'AUTH_TOKEN_INVALID',
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      })
    );
  }

  if (!verifiedUser || !verifiedUser.uid) {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Không thể xác thực tài khoản khách hàng.',
      })
    );
  }

  const customerUid = verifiedUser.uid;
  const db = getEffectiveDb();
  const isProd = isProductionRuntime();

  // ==========================================================================
  // POST /api/me/orders (Action: link_guest_order — Guest-to-Account Linking)
  // ==========================================================================
  if (req.method === 'POST') {
    if (verifiedUser.isAnonymous) {
      res.statusCode = 403;
      return res.end(
        JSON.stringify({
          success: false,
          code: 'REGISTERED_ACCOUNT_REQUIRED',
          error: 'Vui lòng đăng nhập vào tài khoản thành viên chính thức để liên kết đơn hàng.',
        })
      );
    }

    let body: any = {};
    try {
      body = await parseJsonBody(req);
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Dữ liệu JSON không hợp lệ.' }));
    }

    if (body?.action !== 'link_guest_order') {
      res.statusCode = 400;
      return res.end(
        JSON.stringify({ success: false, error: 'Hành động không hợp lệ.' })
      );
    }

    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    const recoveryToken = typeof body?.recoveryToken === 'string' ? body.recoveryToken.trim() : '';

    if (!orderId || !recoveryToken) {
      res.statusCode = 400;
      return res.end(
        JSON.stringify({
          success: false,
          code: 'MISSING_LINK_PARAMS',
          error: 'Thiếu mã đơn hàng hoặc mã xác thực khôi phục (recoveryToken) để liên kết đơn hàng.',
        })
      );
    }

    const nowIso = new Date().toISOString();
    const evaluateLink = (rawOrder: any): {
      status: number;
      code?: string;
      error?: string;
      updatedOrder?: any;
      mutated?: boolean;
    } => {
      if (!rawOrder) {
        return { status: 404, code: 'ORDER_NOT_FOUND', error: 'Không tìm thấy đơn hàng.' };
      }

      // Already linked to this same user -> idempotent 200
      if (rawOrder.userId === customerUid && !rawOrder.isGuestOrder) {
        return { status: 200, updatedOrder: rawOrder, mutated: false };
      }

      // Prevent hijacking an order that already belongs to another registered member
      if (rawOrder.userId && rawOrder.userId !== customerUid && rawOrder.isGuestOrder === false) {
        return {
          status: 403,
          code: 'ORDER_ALREADY_CLAIMED',
          error: 'Đơn hàng này đã được liên kết với một tài khoản thành viên khác.',
        };
      }

      const tokenCheck = verifyRecoveryTokenHash(
        recoveryToken,
        rawOrder.recoveryTokenHash,
        rawOrder.recoveryTokenExpiresAt
      );
      if (!tokenCheck.valid) {
        return {
          status: 403,
          code: 'INVALID_RECOVERY_TOKEN',
          error: 'Mã xác thực đơn hàng không hợp lệ hoặc đã hết hạn.',
        };
      }

      const existingAudit = Array.isArray(rawOrder.paymentAuditLog) ? rawOrder.paymentAuditLog : [];
      const updatedOrder = {
        ...rawOrder,
        userId: customerUid,
        customerUid,
        isGuestOrder: false,
        linkedAt: nowIso,
        updatedAt: nowIso,
        paymentAuditLog: [
          ...existingAudit,
          {
            orderId: rawOrder.id,
            orderCode: rawOrder.orderCode,
            action: 'guest_order_linked',
            previousPaymentStatus: rawOrder.paymentStatus,
            newPaymentStatus: rawOrder.paymentStatus,
            actorType: 'customer' as const,
            actorUid: customerUid,
            actorEmail: verifiedUser?.email || null,
            timestamp: nowIso,
          },
        ],
      };

      return { status: 200, updatedOrder, mutated: true };
    };

    if (db) {
      try {
        const orderRef = db.collection('orders').doc(orderId);
        const outcome = await db.runTransaction(async (tx) => {
          const snap = await tx.get(orderRef);
          const rawOrder = snap.exists ? { id: snap.id, ...snap.data() } : null;
          const resLogic = evaluateLink(rawOrder);
          if (resLogic.mutated && resLogic.updatedOrder) {
            tx.set(orderRef, resLogic.updatedOrder, { merge: true });
          }
          return resLogic;
        });

        if (outcome.status !== 200) {
          res.statusCode = outcome.status;
          return res.end(
            JSON.stringify({ success: false, code: outcome.code, error: outcome.error })
          );
        }

        res.statusCode = 200;
        return res.end(
          JSON.stringify({
            success: true,
            message: `Đã liên kết đơn hàng ${outcome.updatedOrder.orderCode} vào tài khoản của bạn.`,
            order: enrichAndSanitizeOrderForClient(outcome.updatedOrder, recoveryToken),
          })
        );
      } catch (err) {
        console.error('[MNH Customer Orders POST link] Error:', err);
        res.statusCode = 503;
        return res.end(
          JSON.stringify({
            success: false,
            code: 'DATABASE_UNAVAILABLE',
            error: 'Hệ thống cơ sở dữ liệu đang bảo trì.',
          })
        );
      }
    } else if (!isProd) {
      const outcome = await withLocalStoreLock(async () => {
        const localOrders = readLocalDevOrders();
        const idx = localOrders.findIndex((o) => o.id === orderId);
        const rawOrder = idx >= 0 ? localOrders[idx] : null;
        const resLogic = evaluateLink(rawOrder);
        if (resLogic.mutated && resLogic.updatedOrder && idx >= 0) {
          localOrders[idx] = resLogic.updatedOrder;
          writeLocalDevOrders(localOrders);
        }
        return resLogic;
      });

      if (outcome.status !== 200) {
        res.statusCode = outcome.status;
        return res.end(
          JSON.stringify({ success: false, code: outcome.code, error: outcome.error })
        );
      }

      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          success: true,
          message: `Đã liên kết đơn hàng ${outcome.updatedOrder.orderCode} vào tài khoản của bạn.`,
          order: enrichAndSanitizeOrderForClient(outcome.updatedOrder, recoveryToken),
        })
      );
    }

    res.statusCode = 503;
    return res.end(
      JSON.stringify({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Hệ thống cơ sở dữ liệu đang bảo trì.',
      })
    );
  }

  // ==========================================================================
  // GET /api/me/orders (Customer Order History)
  // ==========================================================================
  const urlObj = new URL(req.url || '/api/me/orders', 'http://localhost');
  const limitParam = Number(urlObj.searchParams.get('limit') || 30);
  const safeLimit = Math.min(Math.max(1, Number.isNaN(limitParam) ? 30 : limitParam), 100);
  const statusFilter = urlObj.searchParams.get('status') || '';

  if (db) {
    try {
      const [byUserIdSnap, byCustomerUidSnap] = await Promise.all([
        db.collection('orders').where('userId', '==', customerUid).limit(100).get(),
        db.collection('orders').where('customerUid', '==', customerUid).limit(100).get(),
      ]);

      const mergedMap = new Map<string, any>();
      byUserIdSnap.forEach((doc) => {
        mergedMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      byCustomerUidSnap.forEach((doc) => {
        if (!mergedMap.has(doc.id)) {
          mergedMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      let orders = Array.from(mergedMap.values()).map((o) =>
        enrichAndSanitizeOrderForClient(o)
      );

      if (statusFilter && statusFilter !== 'ALL') {
        orders = orders.filter(
          (o) => o.orderStatus === statusFilter || o.status === statusFilter
        );
      }

      orders.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      orders = orders.slice(0, safeLimit);

      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          success: true,
          count: orders.length,
          orders,
        })
      );
    } catch (err: any) {
      console.error('[MNH Customer Orders API] Firestore query failed:', err);
      res.statusCode = 503;
      return res.end(
        JSON.stringify({
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          error:
            'Hệ thống cơ sở dữ liệu đơn hàng đang bảo trì hoặc tạm thời gián đoạn. Vui lòng thử lại sau ít phút.',
        })
      );
    }
  }

  if (isProd) {
    console.error('[MNH Customer Orders API] CRITICAL: Firestore Admin DB not configured in production!');
    res.statusCode = 503;
    return res.end(
      JSON.stringify({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Hệ thống cơ sở dữ liệu đơn hàng đang bảo trì. Quý khách vui lòng thử lại sau ít phút.',
      })
    );
  }

  // Non-production local dev fallback
  try {
    let orders = readLocalDevOrders()
      .filter((o: any) => o.userId === customerUid || o.customerUid === customerUid)
      .map((o: any) => {
        const clean = { ...o };
        delete clean._fingerprint;
        return enrichAndSanitizeOrderForClient(clean);
      });

    if (statusFilter && statusFilter !== 'ALL') {
      orders = orders.filter(
        (o) => o.orderStatus === statusFilter || o.status === statusFilter
      );
    }

    orders.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    orders = orders.slice(0, safeLimit);

    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        count: orders.length,
        orders,
      })
    );
  } catch (err) {
    console.error('[MNH Customer Orders API] Local fallback error:', err);
    res.statusCode = 500;
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Không thể đọc lịch sử đơn hàng cục bộ.',
      })
    );
  }
}

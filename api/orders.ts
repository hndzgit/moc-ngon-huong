// api/orders.ts
// Backend Order Creation, Dynamic VietQR Generation, Guest Recovery & Transfer Reporting API
// Security & Reliability Guarantees:
// 1. Authoritative server-side catalog lookup and price calculation (never trusts client prices)
// 2. Sequential order code allocation (MNH000000..MNH999999) inside atomic Firestore transaction
// 3. Validated dynamic EMVCo / NAPAS 247 VietQR payload generation (BIDV 970418 / 8960826751)
// 4. Cryptographic guest order recovery token (SHA-256 hash stored, cleartext sent via response & email)
// 5. Customer "Tôi đã chuyển khoản" reporting (transitions pending_payment -> customer_reported_paid ONLY)

import crypto from 'crypto';
import { getAdminDb, isProductionRuntime, verifyAuthToken } from './_lib/firebaseAdmin.js';
import { sendOrderNotification, sendOrderRecoveryEmail } from './_lib/notifications.js';
import {
  buildOrderRecoveryUrl,
  checkRecoveryRateLimit,
  enrichAndSanitizeOrderForClient,
  generateRecoveryToken,
  getConfiguredVietQrBankDetails,
  readLocalDevOrders,
  readLocalNextSeq,
  verifyRecoveryTokenHash,
  withLocalStoreLock,
  writeLocalDevOrders,
  writeLocalNextSeq,
} from './_lib/orderRecovery.js';
import { buildOrderPaymentInstructions } from '../src/lib/vietqr.js';
import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../src/data/products.js';
import {
  validateDeliveryAddress,
  getProvinceByCode,
  getCommuneByCode,
} from '../src/data/address/index.js';

const SERVER_CATALOG: Record<string, { name: string; price: number; maxStock: number }> = {};
for (const p of [...PRODUCTS, ...LOOSE_TEA_PRODUCTS]) {
  SERVER_CATALOG[p.id] = {
    name: p.name,
    price: p.price,
    maxStock: p.stock || 50,
  };
}

const VALID_EMOTIONS = new Set(['AN', 'THUONG', 'CAM', 'NHO']);
const MAX_COUNTER_SEQ = 999999;

function stripControlChars(str: string, allowNewlines = false): string {
  if (allowNewlines) {
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }
  return str.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeGiftConfig(raw: any): any | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  if (
    typeof raw.intention !== 'string' ||
    typeof raw.emotion !== 'string' ||
    !VALID_EMOTIONS.has(raw.emotion) ||
    typeof raw.recipient !== 'string' ||
    typeof raw.message !== 'string' ||
    (raw.cardStyle !== 'botanical' && raw.cardStyle !== 'letter')
  ) {
    return undefined;
  }
  return {
    intention: stripControlChars(raw.intention, false).slice(0, 64),
    emotion: raw.emotion,
    recipient: stripControlChars(raw.recipient, false).slice(0, 80),
    message: stripControlChars(raw.message, true).slice(0, 280),
    cardStyle: raw.cardStyle,
  };
}

function computeRequestFingerprint(payload: {
  userId: string | null;
  items: Array<{ productId: string; quantity: number; giftConfiguration?: any }>;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    shippingMode: string;
    address: string;
    provinceCode: string;
    communeCode: string;
    city: string;
    district: string;
    ward: string;
    pickupStore: string;
    note: string;
  };
  paymentMethod: string;
}): string {
  const canonical = JSON.stringify({
    u: payload.userId || null,
    i: payload.items.map((item) => ({
      p: item.productId,
      q: item.quantity,
      g: item.giftConfiguration || null,
    })),
    c: {
      n: payload.customer.fullName.toLowerCase(),
      ph: payload.customer.phone,
      e: payload.customer.email.toLowerCase(),
      sm: payload.customer.shippingMode,
      a: payload.customer.address.toLowerCase(),
      pc: payload.customer.provinceCode,
      cc: payload.customer.communeCode,
      ci: payload.customer.city.toLowerCase(),
      di: payload.customer.district.toLowerCase(),
      wa: payload.customer.ward.toLowerCase(),
      ps: payload.customer.pickupStore,
      no: payload.customer.note,
    },
    pm: payload.paymentMethod,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function getEffectiveDb() {
  if (process.env.MNH_USE_LOCAL_DEV_STORE === '1' && !isProductionRuntime()) {
    return null;
  }
  return getAdminDb();
}

function getClientIp(req: any): string {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'local';
}

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  let rawBody = '';
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: any) => {
      rawBody += chunk;
      if (rawBody.length > 1e6) reject(new Error('PAYLOAD_TOO_LARGE'));
    });
    req.on('end', () => resolve());
    req.on('error', (err: any) => reject(err));
  });
  return rawBody ? JSON.parse(rawBody) : {};
}

function parseQueryParams(req: any): URLSearchParams {
  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') sp.set(k, v);
    }
    return sp;
  }
  const rawUrl = req.url || '/api/orders';
  const qIdx = rawUrl.indexOf('?');
  return new URLSearchParams(qIdx >= 0 ? rawUrl.slice(qIdx + 1) : '');
}

function sendJson(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

// ============================================================================
// GET /api/orders?orderId=... (Secure Order Recovery & Authoritative Status)
// ============================================================================
async function handleGetOrder(req: any, res: any) {
  const query = parseQueryParams(req);
  const orderId = (query.get('orderId') || '').trim();
  const orderCodeOnly = (query.get('orderCode') || '').trim();
  const recoveryToken =
    (req.headers?.['x-order-recovery-token'] as string | undefined)?.trim() ||
    (query.get('token') || '').trim() ||
    null;

  // Reject attempts to look up an order by predictable orderCode alone
  if (!orderId) {
    if (orderCodeOnly) {
      return sendJson(res, 403, {
        success: false,
        code: 'ORDER_CODE_LOOKUP_FORBIDDEN',
        error:
          'Vì lý do bảo mật, không thể tra cứu trực tiếp bằng mã đơn hàng công khai. Vui lòng sử dụng liên kết bảo mật trong email xác nhận hoặc đăng nhập tài khoản.',
      });
    }
    return sendJson(res, 400, {
      success: false,
      code: 'MISSING_ORDER_ID',
      error: 'Thiếu mã định danh đơn hàng (orderId).',
    });
  }

  const rateKey = `get_order:${getClientIp(req)}:${orderId}`;
  const rateCheck = checkRecoveryRateLimit(rateKey, 30, 60_000);
  if (!rateCheck.allowed) {
    return sendJson(res, 429, {
      success: false,
      code: 'RATE_LIMITED',
      error: 'Quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau ít giây.',
    });
  }

  let verifiedUser: { uid: string; email?: string; isAnonymous?: boolean } | null = null;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader) {
    try {
      verifiedUser = await verifyAuthToken(authHeader);
    } catch {
      verifiedUser = null;
    }
  }

  const db = getEffectiveDb();
  let rawOrder: any = null;

  if (db) {
    try {
      const snap = await db.collection('orders').doc(orderId).get();
      if (snap.exists) {
        rawOrder = { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.error('[MNH Orders GET] Firestore read error:', err);
      return sendJson(res, 503, {
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Hệ thống cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau.',
      });
    }
  } else if (!isProductionRuntime()) {
    const localOrders = readLocalDevOrders();
    rawOrder = localOrders.find((o) => o.id === orderId) || null;
  } else {
    return sendJson(res, 503, {
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      error: 'Hệ thống cơ sở dữ liệu đang bảo trì.',
    });
  }

  if (!rawOrder) {
    return sendJson(res, 404, {
      success: false,
      code: 'ORDER_NOT_FOUND',
      error: 'Không tìm thấy đơn hàng hoặc phiên thanh toán không tồn tại.',
    });
  }

  const ownsByUid =
    Boolean(verifiedUser?.uid) &&
    (rawOrder.userId === verifiedUser!.uid || rawOrder.customerUid === verifiedUser!.uid);

  const tokenVerification = verifyRecoveryTokenHash(
    recoveryToken,
    rawOrder.recoveryTokenHash,
    rawOrder.recoveryTokenExpiresAt
  );

  if (!ownsByUid && !tokenVerification.valid) {
    const isExpired = tokenVerification.reason === 'expired';
    return sendJson(res, 403, {
      success: false,
      code: isExpired ? 'RECOVERY_TOKEN_EXPIRED' : 'FORBIDDEN_ORDER_ACCESS',
      error: isExpired
        ? 'Liên kết khôi phục đơn hàng đã hết hạn. Vui lòng yêu cầu gửi lại liên kết mới qua email.'
        : 'Bạn không có quyền truy cập đơn hàng này. Vui lòng đăng nhập đúng tài khoản hoặc mở liên kết từ email xác nhận đơn hàng.',
    });
  }

  return sendJson(res, 200, {
    success: true,
    order: enrichAndSanitizeOrderForClient(rawOrder, tokenVerification.valid ? recoveryToken! : undefined),
  });
}

// ============================================================================
// POST /api/orders (Action: report_transfer — Customer clicks "Tôi đã chuyển khoản")
// ============================================================================
async function handleCustomerReportTransfer(req: any, res: any, body: any) {
  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
  const recoveryToken =
    typeof body?.recoveryToken === 'string'
      ? body.recoveryToken.trim()
      : (req.headers?.['x-order-recovery-token'] as string | undefined)?.trim() || null;

  if (!orderId) {
    return sendJson(res, 400, {
      success: false,
      code: 'MISSING_ORDER_ID',
      error: 'Thiếu mã đơn hàng cần xác nhận chuyển khoản.',
    });
  }

  const rateKey = `report_transfer:${getClientIp(req)}:${orderId}`;
  const rateCheck = checkRecoveryRateLimit(rateKey, 15, 60_000);
  if (!rateCheck.allowed) {
    return sendJson(res, 429, {
      success: false,
      code: 'RATE_LIMITED',
      error: 'Thao tác quá nhanh. Vui lòng thử lại sau ít giây.',
    });
  }

  let verifiedUser: { uid: string; email?: string; isAnonymous?: boolean } | null = null;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader) {
    try {
      verifiedUser = await verifyAuthToken(authHeader);
    } catch {
      verifiedUser = null;
    }
  }

  const nowIso = new Date().toISOString();
  const db = getEffectiveDb();

  const applyReportLogic = (rawOrder: any): {
    status: number;
    code?: string;
    error?: string;
    updatedOrder?: any;
    mutated?: boolean;
    message?: string;
  } => {
    if (!rawOrder) {
      return {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        error: 'Không tìm thấy đơn hàng.',
      };
    }

    const ownsByUid =
      Boolean(verifiedUser?.uid) &&
      (rawOrder.userId === verifiedUser!.uid || rawOrder.customerUid === verifiedUser!.uid);
    const tokenCheck = verifyRecoveryTokenHash(
      recoveryToken,
      rawOrder.recoveryTokenHash,
      rawOrder.recoveryTokenExpiresAt
    );

    if (!ownsByUid && !tokenCheck.valid) {
      return {
        status: 403,
        code: 'FORBIDDEN_ORDER_ACCESS',
        error: 'Bạn không có quyền cập nhật thông báo chuyển khoản cho đơn hàng này.',
      };
    }

    if (rawOrder.paymentMethod !== 'bank') {
      return {
        status: 400,
        code: 'INVALID_PAYMENT_METHOD',
        error: 'Đơn hàng thanh toán khi nhận hàng (COD) không áp dụng thông báo chuyển khoản VietQR.',
      };
    }

    if (rawOrder.orderStatus === 'cancelled' || rawOrder.paymentStatus === 'cancelled') {
      return {
        status: 409,
        code: 'ORDER_CANCELLED',
        error: 'Đơn hàng này đã bị hủy, không thể ghi nhận thông báo chuyển khoản.',
      };
    }

    if (rawOrder.paymentStatus === 'paid' || rawOrder.paymentStatus === 'completed') {
      return {
        status: 200,
        updatedOrder: rawOrder,
        mutated: false,
        message: 'Đơn hàng của bạn đã được Mộc Ngôn Hương xác nhận thanh toán thành công.',
      };
    }

    if (rawOrder.paymentStatus === 'customer_reported_paid') {
      return {
        status: 200,
        updatedOrder: rawOrder,
        mutated: false,
        message:
          'Đã ghi nhận thông báo chuyển khoản của bạn. Mộc Ngôn Hương sẽ kiểm tra giao dịch và xác nhận thanh toán.',
      };
    }

    if (rawOrder.paymentStatus !== 'pending_payment' && rawOrder.paymentStatus !== 'pending') {
      return {
        status: 409,
        code: 'INVALID_PAYMENT_STATE',
        error: `Trạng thái thanh toán hiện tại (${rawOrder.paymentStatus}) không thể chuyển sang báo đã chuyển khoản.`,
      };
    }

    const auditEntry = {
      orderId: rawOrder.id,
      orderCode: rawOrder.orderCode,
      action: 'customer_report_transfer',
      previousPaymentStatus: rawOrder.paymentStatus,
      newPaymentStatus: 'customer_reported_paid',
      actorType: 'customer' as const,
      actorUid: verifiedUser?.uid || null,
      timestamp: nowIso,
    };

    const existingAudit = Array.isArray(rawOrder.paymentAuditLog) ? rawOrder.paymentAuditLog : [];
    const updatedOrder = {
      ...rawOrder,
      paymentStatus: 'customer_reported_paid',
      customerReportedAt: rawOrder.customerReportedAt || nowIso,
      customerReportedByUid: verifiedUser?.uid || 'guest_recovery_token',
      updatedAt: nowIso,
      paymentAuditLog: [...existingAudit, auditEntry],
    };

    return {
      status: 200,
      updatedOrder,
      mutated: true,
      message:
        'Đã ghi nhận thông báo chuyển khoản của bạn. Mộc Ngôn Hương sẽ kiểm tra giao dịch và xác nhận thanh toán.',
    };
  };

  if (db) {
    try {
      const orderRef = db.collection('orders').doc(orderId);
      const outcome = await db.runTransaction(async (tx) => {
        const snap = await tx.get(orderRef);
        const rawOrder = snap.exists ? { id: snap.id, ...snap.data() } : null;
        const resLogic = applyReportLogic(rawOrder);
        if (resLogic.mutated && resLogic.updatedOrder) {
          tx.set(orderRef, resLogic.updatedOrder, { merge: true });
        }
        return resLogic;
      });

      if (outcome.status !== 200) {
        return sendJson(res, outcome.status, {
          success: false,
          code: outcome.code,
          error: outcome.error,
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: outcome.message,
        order: enrichAndSanitizeOrderForClient(
          outcome.updatedOrder,
          recoveryToken || undefined
        ),
      });
    } catch (err) {
      console.error('[MNH Orders report_transfer] Firestore error:', err);
      return sendJson(res, 503, {
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Hệ thống cơ sở dữ liệu đang bận. Vui lòng thử lại sau ít giây.',
      });
    }
  } else if (!isProductionRuntime()) {
    const outcome = await withLocalStoreLock(async () => {
      const localOrders = readLocalDevOrders();
      const idx = localOrders.findIndex((o) => o.id === orderId);
      const rawOrder = idx >= 0 ? localOrders[idx] : null;
      const resLogic = applyReportLogic(rawOrder);
      if (resLogic.mutated && resLogic.updatedOrder && idx >= 0) {
        localOrders[idx] = resLogic.updatedOrder;
        writeLocalDevOrders(localOrders);
      }
      return resLogic;
    });

    if (outcome.status !== 200) {
      return sendJson(res, outcome.status, {
        success: false,
        code: outcome.code,
        error: outcome.error,
      });
    }

    return sendJson(res, 200, {
      success: true,
      message: outcome.message,
      order: enrichAndSanitizeOrderForClient(
        outcome.updatedOrder,
        recoveryToken || undefined
      ),
    });
  }

  return sendJson(res, 503, {
    success: false,
    code: 'DATABASE_UNAVAILABLE',
    error: 'Hệ thống cơ sở dữ liệu đang bảo trì.',
  });
}

// ============================================================================
// POST /api/orders (Action: request_recovery_link — Non-enumerating email link)
// ============================================================================
async function handleRequestRecoveryLink(req: any, res: any, body: any) {
  const orderCode = typeof body?.orderCode === 'string' ? body.orderCode.trim().toUpperCase() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!orderCode || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, {
      success: false,
      code: 'INVALID_RECOVERY_INPUT',
      error: 'Vui lòng nhập đúng Mã đơn hàng (ví dụ: MNH000000) và địa chỉ Email đã dùng khi đặt hàng.',
    });
  }

  const rateKey = `recovery_email:${getClientIp(req)}:${orderCode}`;
  const rateCheck = checkRecoveryRateLimit(rateKey, 5, 60_000);
  if (!rateCheck.allowed) {
    return sendJson(res, 429, {
      success: false,
      code: 'RATE_LIMITED',
      error: 'Bạn đã yêu cầu gửi lại liên kết quá nhiều lần. Vui lòng thử lại sau 1 phút.',
    });
  }

  const genericMessage =
    'Nếu mã đơn hàng và địa chỉ email trùng khớp với dữ liệu hệ thống, liên kết khôi phục đơn hàng đã được gửi tới hộp thư của bạn.';

  const db = getEffectiveDb();
  let matchedOrder: any = null;

  if (db) {
    try {
      const snap = await db
        .collection('orders')
        .where('orderCode', '==', orderCode)
        .limit(5)
        .get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (String(data?.customer?.email || '').trim().toLowerCase() === email) {
          matchedOrder = { id: doc.id, ...data };
        }
      });

      if (matchedOrder) {
        const fresh = generateRecoveryToken();
        await db.collection('orders').doc(matchedOrder.id).set(
          {
            recoveryTokenHash: fresh.recoveryTokenHash,
            recoveryTokenExpiresAt: fresh.recoveryTokenExpiresAt,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        await sendOrderRecoveryEmail({
          orderId: matchedOrder.id,
          orderCode: matchedOrder.orderCode,
          customerName: matchedOrder.customer?.fullName || 'Quý khách',
          customerEmail: matchedOrder.customer.email,
          total: matchedOrder.total || 0,
          recoveryToken: fresh.recoveryToken,
        });
      }
    } catch (err) {
      console.error('[MNH Orders request_recovery_link] Error:', err);
    }
  } else if (!isProductionRuntime()) {
    await withLocalStoreLock(async () => {
      const localOrders = readLocalDevOrders();
      const idx = localOrders.findIndex(
        (o) =>
          String(o.orderCode || '').toUpperCase() === orderCode &&
          String(o?.customer?.email || '').trim().toLowerCase() === email
      );
      if (idx >= 0) {
        const fresh = generateRecoveryToken();
        localOrders[idx] = {
          ...localOrders[idx],
          recoveryTokenHash: fresh.recoveryTokenHash,
          recoveryTokenExpiresAt: fresh.recoveryTokenExpiresAt,
          updatedAt: new Date().toISOString(),
        };
        writeLocalDevOrders(localOrders);
        await sendOrderRecoveryEmail({
          orderId: localOrders[idx].id,
          orderCode: localOrders[idx].orderCode,
          customerName: localOrders[idx].customer?.fullName || 'Quý khách',
          customerEmail: localOrders[idx].customer.email,
          total: localOrders[idx].total || 0,
          recoveryToken: fresh.recoveryToken,
        });
      }
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: genericMessage,
  });
}

// ============================================================================
// MAIN HANDLER: /api/orders
// ============================================================================
export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return handleGetOrder(req, res);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, {
      success: false,
      error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng GET hoặc POST.',
    });
  }

  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch (err: any) {
    const isTooLarge = err?.message === 'PAYLOAD_TOO_LARGE';
    return sendJson(res, isTooLarge ? 413 : 400, {
      success: false,
      error: isTooLarge
        ? 'Dữ liệu đơn hàng vượt quá kích thước cho phép.'
        : 'Định dạng dữ liệu JSON không hợp lệ.',
    });
  }

  // Dispatch secondary POST actions cleanly within the same serverless function
  if (body?.action === 'report_transfer') {
    return handleCustomerReportTransfer(req, res, body);
  }
  if (body?.action === 'request_recovery_link') {
    return handleRequestRecoveryLink(req, res, body);
  }

  // ==========================================================================
  // DEFAULT POST ACTION: CREATE NEW ORDER (COD OR VIETQR BANK TRANSFER)
  // ==========================================================================
  const { items, customer, paymentMethod, idempotencyKey } = body || {};

  let verifiedCustomerUid: string | null = null;
  let isAnonymousSession = false;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader) {
    try {
      const verifiedUser = await verifyAuthToken(authHeader);
      if (verifiedUser && verifiedUser.uid) {
        verifiedCustomerUid = verifiedUser.uid;
        isAnonymousSession = Boolean(verifiedUser.isAnonymous);
      }
    } catch {
      return sendJson(res, 401, {
        success: false,
        code: 'AUTH_TOKEN_INVALID',
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại hoặc tiếp tục đặt hàng.',
      });
    }
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return sendJson(res, 400, {
      success: false,
      error: 'Giỏ hàng trống hoặc số lượng mặt hàng không hợp lệ.',
    });
  }

  if (!customer || typeof customer !== 'object') {
    return sendJson(res, 400, {
      success: false,
      error: 'Thiếu thông tin khách hàng.',
    });
  }

  const fullName =
    typeof customer.fullName === 'string'
      ? stripControlChars(customer.fullName, false).slice(0, 120)
      : '';
  const phoneRaw =
    typeof customer.phone === 'string' ? stripControlChars(customer.phone, false) : '';
  const phoneClean = phoneRaw.replace(/[\s.-]/g, '');
  const email =
    typeof customer.email === 'string'
      ? stripControlChars(customer.email, false).slice(0, 160)
      : '';
  const shippingMode = customer.shippingMode === 'pickup' ? 'pickup' : 'delivery';
  const address =
    typeof customer.address === 'string'
      ? stripControlChars(customer.address, false).slice(0, 250)
      : '';
  const provinceCode =
    typeof customer.provinceCode === 'string'
      ? stripControlChars(customer.provinceCode, false).slice(0, 10)
      : '';
  const communeCode =
    typeof customer.communeCode === 'string'
      ? stripControlChars(customer.communeCode, false).slice(0, 10)
      : '';
  const city =
    typeof customer.city === 'string'
      ? stripControlChars(customer.city, false).slice(0, 100)
      : '';
  const district =
    typeof customer.district === 'string'
      ? stripControlChars(customer.district, false).slice(0, 100)
      : '';
  const ward =
    typeof customer.ward === 'string'
      ? stripControlChars(customer.ward, false).slice(0, 100)
      : '';
  const pickupStore =
    typeof customer.pickupStore === 'string'
      ? stripControlChars(customer.pickupStore, false).slice(0, 250)
      : '';
  const note =
    typeof customer.note === 'string'
      ? stripControlChars(customer.note, true).slice(0, 500)
      : '';

  if (!fullName || fullName.length < 2) {
    return sendJson(res, 400, {
      success: false,
      error: 'Vui lòng nhập Họ và Tên hợp lệ (tối thiểu 2 ký tự).',
    });
  }

  if (!/^(0|\+84)[1-9][0-9]{8}$/.test(phoneClean)) {
    return sendJson(res, 400, {
      success: false,
      error: 'Số điện thoại không đúng định dạng Việt Nam (10 chữ số, ví dụ: 0889742556).',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return sendJson(res, 400, {
      success: false,
      error: 'Vui lòng nhập địa chỉ Email hợp lệ để nhận xác nhận đơn hàng.',
    });
  }

  let verifiedProvinceName = '';
  let verifiedCommuneName = '';
  let verifiedFormattedAddress = '';
  let addressSchemaVersion = '2';

  if (shippingMode === 'delivery') {
    if (provinceCode || communeCode) {
      const addrCheck = validateDeliveryAddress({ address, provinceCode, communeCode });
      if (!addrCheck.isValid || !addrCheck.validated) {
        return sendJson(res, 400, {
          success: false,
          error: addrCheck.error || 'Thông tin địa chỉ giao hàng chưa hợp lệ.',
        });
      }
      verifiedProvinceName = addrCheck.validated.provinceName || '';
      verifiedCommuneName = addrCheck.validated.communeName || '';
      verifiedFormattedAddress = addrCheck.validated.formattedAddress || '';
      addressSchemaVersion = addrCheck.validated.addressSchemaVersion || '2';
    } else if (city && address && address.length >= 3) {
      verifiedFormattedAddress = [address, ward, district, city].filter(Boolean).join(', ');
      addressSchemaVersion = '1';
    } else {
      return sendJson(res, 400, {
        success: false,
        error: 'Vui lòng chọn Tỉnh/Thành phố, Phường/Xã/Đặc khu và nhập địa chỉ chi tiết.',
      });
    }
  } else {
    if (!pickupStore) {
      return sendJson(res, 400, {
        success: false,
        error: 'Vui lòng chọn cơ sở nhận hàng tại tiệm.',
      });
    }
  }

  if (paymentMethod !== 'cod' && paymentMethod !== 'bank') {
    return sendJson(res, 400, {
      success: false,
      error: 'Phương thức thanh toán không hợp lệ.',
    });
  }

  let calculatedSubtotal = 0;
  const verifiedItems: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    giftConfiguration?: any;
  }> = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return sendJson(res, 400, {
        success: false,
        error: 'Dữ liệu sản phẩm trong giỏ hàng không hợp lệ.',
      });
    }

    const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
    const quantity = Number(item.quantity);
    const catalogEntry = SERVER_CATALOG[productId];

    if (!catalogEntry) {
      return sendJson(res, 400, {
        success: false,
        error: `Sản phẩm không tồn tại trong danh mục chính thức (mã: ${productId || 'trống'}).`,
      });
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > catalogEntry.maxStock) {
      return sendJson(res, 400, {
        success: false,
        error: `Số lượng sản phẩm "${catalogEntry.name}" không hợp lệ (tối đa ${catalogEntry.maxStock} sản phẩm).`,
      });
    }

    const sanitizedGift = sanitizeGiftConfig(item.giftConfiguration);
    calculatedSubtotal += catalogEntry.price * quantity;
    verifiedItems.push({
      productId,
      productName: catalogEntry.name,
      price: catalogEntry.price,
      quantity,
      ...(sanitizedGift ? { giftConfiguration: sanitizedGift } : {}),
    });
  }

  const shippingFee = 0;
  const discount = 0;
  const finalTotal = calculatedSubtotal + shippingFee - discount;

  const cleanIdempotencyKey =
    typeof idempotencyKey === 'string' && /^[a-zA-Z0-9_-]{8,96}$/.test(idempotencyKey.trim())
      ? idempotencyKey.trim()
      : undefined;

  const requestFingerprint = computeRequestFingerprint({
    userId: verifiedCustomerUid,
    items: verifiedItems,
    customer: {
      fullName,
      phone: phoneClean,
      email,
      shippingMode,
      address,
      provinceCode,
      communeCode,
      city,
      district,
      ward,
      pickupStore,
      note,
    },
    paymentMethod,
  });

  const now = Date.now();
  const timestampStr = new Date(now).toISOString();
  const initialRecovery = generateRecoveryToken();

  const initialPaymentStatus = paymentMethod === 'bank' ? 'pending_payment' : 'pending';
  const initialOrderStatus = paymentMethod === 'bank' ? 'pending_confirmation' : 'preparing';

  const buildOrderRecordWithCode = (orderCode: string) => {
    const bankCfg = getConfiguredVietQrBankDetails();
    const paymentInstructions =
      paymentMethod === 'bank'
        ? buildOrderPaymentInstructions({
            orderCode,
            amount: finalTotal,
            bankBin: bankCfg.bankBin,
            accountNo: bankCfg.accountNo,
            accountName: bankCfg.accountName,
          })
        : null;

    // Strip qrSvgDataUrl from Firestore document to keep document compact; enrichAndSanitizeOrderForClient reconstructs it
    const persistedInstructions = paymentInstructions
      ? {
          method: paymentInstructions.method,
          bankBin: paymentInstructions.bankBin,
          bankShortName: paymentInstructions.bankShortName,
          bankFullName: paymentInstructions.bankFullName,
          accountNo: paymentInstructions.accountNo,
          accountName: paymentInstructions.accountName,
          amount: paymentInstructions.amount,
          currency: paymentInstructions.currency,
          transferContent: paymentInstructions.transferContent,
          qrPayload: paymentInstructions.qrPayload,
        }
      : null;

    return {
      id: `ord_${now}_${crypto.randomBytes(4).toString('hex')}`,
      orderCode,
      userId: verifiedCustomerUid,
      customerUid: verifiedCustomerUid,
      isGuestOrder: !verifiedCustomerUid || isAnonymousSession,
      recoveryTokenHash: initialRecovery.recoveryTokenHash,
      recoveryTokenExpiresAt: initialRecovery.recoveryTokenExpiresAt,
      notificationSent: false,
      notificationDelivery: {
        orderCreated: {
          sent: false,
          sentAt: null,
          messageId: null,
          idempotencyKey: '',
          error: null,
        },
        paymentConfirmed: {
          sent: false,
          sentAt: null,
          messageId: null,
          idempotencyKey: '',
          error: null,
        },
      },
      customer: {
        fullName,
        phone: phoneClean,
        email,
        shippingMode,
        ...(shippingMode === 'delivery'
          ? {
              address,
              ...(provinceCode
                ? {
                    provinceCode,
                    provinceName: verifiedProvinceName,
                    communeCode,
                    communeName: verifiedCommuneName,
                  }
                : {}),
              ...(city ? { city, district, ward } : {}),
              formattedAddress: verifiedFormattedAddress,
              addressSchemaVersion,
            }
          : { pickupStore }),
        ...(note ? { note } : {}),
      },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shippingFee,
      discount,
      total: finalTotal,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentInstructions: persistedInstructions,
      customerReportedAt: null,
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      bankTransactionRef: null,
      paymentAuditLog: [
        {
          orderId: '',
          orderCode,
          action: 'order_created',
          previousPaymentStatus: 'none',
          newPaymentStatus: initialPaymentStatus,
          actorType: 'customer' as const,
          actorUid: verifiedCustomerUid,
          timestamp: timestampStr,
        },
      ],
      orderStatus: initialOrderStatus,
      status: initialOrderStatus,
      createdAt: timestampStr,
      statusUpdatedAt: timestampStr,
      updatedAt: timestampStr,
      ...(cleanIdempotencyKey ? { idempotencyKey: cleanIdempotencyKey } : {}),
      schemaVersion: '16.0',
    };
  };

  const db = getEffectiveDb();
  const isProd = isProductionRuntime();

  type PersistStatus = 'created' | 'duplicate' | 'conflict_key' | 'exhausted' | 'failed';
  let outcomeStatus: PersistStatus = 'failed';
  let finalOrderRecord: any = null;
  let activeRecoveryToken = initialRecovery.recoveryToken;

  if (db) {
    try {
      const counterRef = db.collection('order_counters').doc('default');
      const idempotencyRef = cleanIdempotencyKey
        ? db.collection('order_idempotency').doc(cleanIdempotencyKey)
        : null;

      await db.runTransaction(async (transaction) => {
        // 1. Read idempotency key first (all reads before writes in Firestore transactions)
        if (idempotencyRef) {
          const idempDoc = await transaction.get(idempotencyRef);
          if (idempDoc.exists) {
            const idempData = idempDoc.data() || {};
            const storedFingerprint = idempData.fingerprint;
            const existingOrderId = idempData.orderId;

            if (storedFingerprint && storedFingerprint !== requestFingerprint) {
              outcomeStatus = 'conflict_key';
              return;
            }

            if (existingOrderId) {
              const existingOrderRef = db.collection('orders').doc(existingOrderId);
              const existingOrderDoc = await transaction.get(existingOrderRef);
              if (existingOrderDoc.exists) {
                const existingData = existingOrderDoc.data() || {};
                // Rotate recovery token on idempotent retry so timeout-recovered clients get a working token
                const rotated = generateRecoveryToken();
                activeRecoveryToken = rotated.recoveryToken;
                finalOrderRecord = {
                  ...existingData,
                  id: existingOrderDoc.id,
                  recoveryTokenHash: rotated.recoveryTokenHash,
                  recoveryTokenExpiresAt: rotated.recoveryTokenExpiresAt,
                };
                transaction.set(
                  existingOrderRef,
                  {
                    recoveryTokenHash: rotated.recoveryTokenHash,
                    recoveryTokenExpiresAt: rotated.recoveryTokenExpiresAt,
                    updatedAt: timestampStr,
                  },
                  { merge: true }
                );
                outcomeStatus = 'duplicate';
                return;
              }
            }
          }
        }

        // 2. Read sequential order counter
        const counterDoc = await transaction.get(counterRef);
        const currentSeq =
          counterDoc.exists && typeof counterDoc.data()?.nextSeq === 'number'
            ? counterDoc.data()!.nextSeq
            : 0;

        if (!Number.isSafeInteger(currentSeq) || currentSeq < 0 || currentSeq > MAX_COUNTER_SEQ) {
          outcomeStatus = 'exhausted';
          return;
        }

        const allocatedOrderCode = `MNH${String(currentSeq).padStart(6, '0')}`;
        const codeIndexRef = db.collection('order_codes').doc(allocatedOrderCode);
        const codeIndexDoc = await transaction.get(codeIndexRef);
        if (codeIndexDoc.exists) {
          throw new Error(`ORDER_CODE_COLLISION:${allocatedOrderCode}`);
        }

        const newOrderRecord = buildOrderRecordWithCode(allocatedOrderCode);
        newOrderRecord.paymentAuditLog[0].orderId = newOrderRecord.id;
        const orderRef = db.collection('orders').doc(newOrderRecord.id);

        // 3. Perform atomic writes
        transaction.set(
          counterRef,
          {
            nextSeq: currentSeq + 1,
            lastOrderCode: allocatedOrderCode,
            updatedAt: timestampStr,
          },
          { merge: true }
        );
        transaction.set(codeIndexRef, {
          orderId: newOrderRecord.id,
          orderCode: allocatedOrderCode,
          createdAt: timestampStr,
        });
        transaction.set(orderRef, newOrderRecord);

        if (idempotencyRef) {
          transaction.set(idempotencyRef, {
            key: cleanIdempotencyKey,
            fingerprint: requestFingerprint,
            orderId: newOrderRecord.id,
            orderCode: allocatedOrderCode,
            createdAt: timestampStr,
          });
        }

        finalOrderRecord = newOrderRecord;
        outcomeStatus = 'created';
      });
    } catch (err: any) {
      console.error('[MNH Orders API] Firestore transaction error:', err);
      outcomeStatus = 'failed';
    }
  } else if (!isProd) {
    // Non-production atomic local fallback store
    try {
      await withLocalStoreLock(async () => {
        const localOrders = readLocalDevOrders();

        if (cleanIdempotencyKey) {
          const matchIdx = localOrders.findIndex((o) => o.idempotencyKey === cleanIdempotencyKey);
          if (matchIdx >= 0) {
            const match = localOrders[matchIdx];
            if (match._fingerprint && match._fingerprint !== requestFingerprint) {
              outcomeStatus = 'conflict_key';
              return;
            }
            const rotated = generateRecoveryToken();
            activeRecoveryToken = rotated.recoveryToken;
            localOrders[matchIdx] = {
              ...match,
              recoveryTokenHash: rotated.recoveryTokenHash,
              recoveryTokenExpiresAt: rotated.recoveryTokenExpiresAt,
              updatedAt: timestampStr,
            };
            writeLocalDevOrders(localOrders);
            finalOrderRecord = { ...localOrders[matchIdx] };
            delete finalOrderRecord._fingerprint;
            outcomeStatus = 'duplicate';
            return;
          }
        }

        const nextSeq = readLocalNextSeq(localOrders);
        if (!Number.isSafeInteger(nextSeq) || nextSeq < 0 || nextSeq > MAX_COUNTER_SEQ) {
          outcomeStatus = 'exhausted';
          return;
        }

        const allocatedOrderCode = `MNH${String(nextSeq).padStart(6, '0')}`;
        const newOrderRecord = buildOrderRecordWithCode(allocatedOrderCode);
        newOrderRecord.paymentAuditLog[0].orderId = newOrderRecord.id;

        writeLocalNextSeq(nextSeq + 1);
        localOrders.unshift({ ...newOrderRecord, _fingerprint: requestFingerprint });
        writeLocalDevOrders(localOrders.slice(0, 500));

        finalOrderRecord = newOrderRecord;
        outcomeStatus = 'created';
      });
    } catch (err) {
      console.error('[MNH Orders API] Local fallback error:', err);
      outcomeStatus = 'failed';
    }
  } else {
    outcomeStatus = 'failed';
  }

  if (outcomeStatus === 'conflict_key') {
    return sendJson(res, 409, {
      success: false,
      code: 'IDEMPOTENCY_KEY_CONFLICT',
      error:
        'Mã yêu cầu đặt hàng (Idempotency Key) này đã được sử dụng cho một đơn hàng có nội dung khác. Vui lòng làm mới giỏ hàng và đặt lại.',
    });
  }

  if (outcomeStatus === 'exhausted') {
    return sendJson(res, 503, {
      success: false,
      code: 'ORDER_CODE_EXHAUSTED',
      error:
        'Không gian mã đơn hàng 6 chữ số (MNH000000–MNH999999) đã đầy. Quý khách vui lòng liên hệ hotline 0889 742 556 để được hỗ trợ ngay.',
    });
  }

  if (outcomeStatus === 'failed' || !finalOrderRecord) {
    return sendJson(res, 503, {
      success: false,
      code: 'ORDER_PERSISTENCE_UNAVAILABLE',
      error:
        'Hệ thống lưu trữ đơn hàng hiện đang bảo trì hoặc tạm thời gián đoạn. Đơn hàng chưa được tạo và giỏ hàng của bạn vẫn được giữ nguyên an toàn. Quý khách vui lòng thử lại sau ít phút hoặc liên hệ hotline 0889 742 556.',
    });
  }

  // Send Email A (Order Created) if newly created OR if a previous attempt failed to send
  const alreadySentOrderCreated = Boolean(
    finalOrderRecord.notificationDelivery?.orderCreated?.sent || finalOrderRecord.notificationSent
  );

  if (!alreadySentOrderCreated) {
    try {
      const notifResult = await sendOrderNotification({
        ...finalOrderRecord,
        recoveryToken: activeRecoveryToken,
      });
      const sentSuccess = Boolean(notifResult.customerEmailSent || notifResult.adminEmailSent);
      const deliveryRecord = {
        sent: sentSuccess,
        sentAt: notifResult.sentAt || (sentSuccess ? new Date().toISOString() : null),
        messageId: notifResult.messageId || null,
        idempotencyKey: notifResult.idempotencyKey || `order-created-customer-${finalOrderRecord.id}`,
        lastAttemptAt: new Date().toISOString(),
        error: notifResult.error || null,
      };

      finalOrderRecord.notificationSent = sentSuccess;
      finalOrderRecord.notificationDelivery = {
        ...(finalOrderRecord.notificationDelivery || {}),
        orderCreated: deliveryRecord,
      };

      if (db) {
        await db
          .collection('orders')
          .doc(finalOrderRecord.id)
          .set(
            {
              notificationSent: sentSuccess,
              notificationDelivery: finalOrderRecord.notificationDelivery,
            },
            { merge: true }
          )
          .catch(() => {});
      } else if (!isProd) {
        await withLocalStoreLock(async () => {
          const localOrders = readLocalDevOrders();
          const idx = localOrders.findIndex((o) => o.id === finalOrderRecord.id);
          if (idx >= 0) {
            localOrders[idx].notificationSent = sentSuccess;
            localOrders[idx].notificationDelivery = finalOrderRecord.notificationDelivery;
            writeLocalDevOrders(localOrders);
          }
        });
      }
    } catch (notifErr: any) {
      console.warn('[MNH Orders API] Non-fatal notification error:', notifErr?.message || notifErr);
    }
  }

  const httpStatus = outcomeStatus === 'created' ? 201 : 200;
  return sendJson(res, httpStatus, {
    success: true,
    duplicate: outcomeStatus === 'duplicate',
    persisted: true,
    notificationSent: Boolean(finalOrderRecord.notificationSent),
    recoveryToken: activeRecoveryToken,
    recoveryUrl: buildOrderRecoveryUrl(finalOrderRecord.id, activeRecoveryToken),
    message:
      outcomeStatus === 'created'
        ? 'Đặt hàng thành công. Đơn hàng của bạn đã được lưu trữ an toàn trên hệ thống.'
        : 'Đơn hàng của bạn đã được hệ thống ghi nhận trước đó (tránh tạo trùng đơn).',
    order: enrichAndSanitizeOrderForClient(finalOrderRecord, activeRecoveryToken),
  });
}

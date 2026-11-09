import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import {
  getFirestoreDb,
  getIsProduction,
  verifyAdminAuth,
  cleanForFirestore,
} from '../_lib/firebaseAdmin.js';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../src/types';

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

const LOCAL_DEV_DIR = path.resolve(process.cwd(), '.data');
const LOCAL_DEV_FILE = path.join(LOCAL_DEV_DIR, 'orders_dev.json');

function readLocalDevOrders(): OrderRecord[] {
  if (getIsProduction()) return [];
  try {
    if (fs.existsSync(LOCAL_DEV_FILE)) {
      const data = fs.readFileSync(LOCAL_DEV_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('[MNH Admin Orders] Error reading local dev store:', err);
  }
  return [];
}

function writeLocalDevOrders(orders: OrderRecord[]): void {
  if (getIsProduction()) return;
  try {
    if (!fs.existsSync(LOCAL_DEV_DIR)) {
      fs.mkdirSync(LOCAL_DEV_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DEV_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('[MNH Admin Orders] Error writing local dev store:', err);
  }
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

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'pending_confirmation',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'shipping',
  'completed',
  'cancelled',
];

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isProduction = getIsProduction();

  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 1. Strict Method Validation
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Phương thức không được hỗ trợ. Chỉ chấp nhận GET và PATCH.',
      })
    );
    return;
  }

  // 2. Strict Server-Side Admin Authorization (Firebase ID Token + ADMIN_UIDS allowlist)
  const authHeader = req.headers?.authorization;
  const authOutcome = await verifyAdminAuth(authHeader);

  if (!authOutcome.authorized || !authOutcome.admin) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = authOutcome.statusCode || 401;
    res.end(
      JSON.stringify({
        success: false,
        code: authOutcome.errorCode || 'UNAUTHENTICATED',
        error: authOutcome.errorMessage || 'Không có quyền truy cập khu vực quản trị.',
      })
    );
    return;
  }

  const adminUid = authOutcome.admin.uid;
  const db = getFirestoreDb();

  // 3. GET /api/admin/orders — List Orders
  if (req.method === 'GET') {
    if (isProduction && !db) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          error: 'Cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau.',
        })
      );
      return;
    }

    const urlObj = new URL(req.url || '', 'http://localhost');
    const searchTerm = (
      (req.query?.search as string) ||
      urlObj.searchParams.get('search') ||
      ''
    )
      .trim()
      .toLowerCase();
    const statusFilter = (
      (req.query?.status as string) ||
      urlObj.searchParams.get('status') ||
      ''
    ).trim();
    const limitParam = parseInt(
      (req.query?.limit as string) || urlObj.searchParams.get('limit') || '50',
      10
    );
    const safeLimit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100);

    let allOrders: OrderRecord[] = [];

    if (db) {
      try {
        let snapshot;
        try {
          snapshot = await db
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        } catch {
          // If compound index or orderBy fails, fallback to unordered limit
          snapshot = await db.collection('orders').limit(100).get();
        }

        snapshot.forEach((doc) => {
          const data = doc.data() as OrderRecord;
          allOrders.push(data);
        });

        // Ensure sorted newest first
        allOrders.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      } catch (err: any) {
        console.error('[MNH Admin Orders] Firestore read error:', err);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Không thể truy vấn danh sách đơn hàng từ cơ sở dữ liệu.',
          })
        );
        return;
      }
    } else {
      // Local dev fallback
      allOrders = readLocalDevOrders();
      allOrders.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      allOrders = allOrders.filter((o) => {
        const orderSt = o.orderStatus || (o as any).status;
        if (statusFilter === 'preparing') {
          return orderSt === 'preparing' || orderSt === 'pending_confirmation' || orderSt === 'confirmed';
        }
        return orderSt === statusFilter;
      });
    }

    // Apply search filter (orderCode, customer name, phone, email)
    if (searchTerm) {
      allOrders = allOrders.filter((o) => {
        const codeMatch = (o.orderCode || '').toLowerCase().includes(searchTerm);
        const nameMatch = (o.customer?.fullName || '').toLowerCase().includes(searchTerm);
        const phoneMatch = (o.customer?.phone || '').includes(searchTerm);
        const emailMatch = (o.customer?.email || '').toLowerCase().includes(searchTerm);
        return codeMatch || nameMatch || phoneMatch || emailMatch;
      });
    }

    const boundedOrders = allOrders.slice(0, safeLimit);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        count: boundedOrders.length,
        total: allOrders.length,
        orders: boundedOrders,
      })
    );
    return;
  }

  // 4. PATCH /api/admin/orders — Update Order Status
  if (req.method === 'PATCH') {
    if (isProduction && !db) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          error: 'Cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau.',
        })
      );
      return;
    }

    const body = await parseRequestBody(req);
    const { orderId, status, paymentStatus } = body || {};

    if (!orderId || typeof orderId !== 'string') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Thiếu mã định danh đơn hàng (orderId).',
        })
      );
      return;
    }

    if (!status && !paymentStatus) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Cần cung cấp ít nhất một giá trị trạng thái cần cập nhật (status hoặc paymentStatus).',
        })
      );
      return;
    }

    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: `Trạng thái đơn hàng không hợp lệ: "${status}". Các giá trị hợp lệ: ${VALID_ORDER_STATUSES.join(', ')}.`,
        })
      );
      return;
    }

    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: `Trạng thái thanh toán không hợp lệ: "${paymentStatus}". Các giá trị hợp lệ: ${VALID_PAYMENT_STATUSES.join(', ')}.`,
        })
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updatedAt: nowIso,
      updatedBy: adminUid,
    };

    if (status) {
      updatePayload.orderStatus = status;
      updatePayload.status = status;
      updatePayload.statusUpdatedAt = nowIso;
    }

    if (paymentStatus) {
      updatePayload.paymentStatus = paymentStatus;
      updatePayload.paymentUpdatedAt = nowIso;
    }

    const cleanedUpdate = cleanForFirestore(updatePayload);

    if (db) {
      try {
        let docRef = db.collection('orders').doc(orderId);
        let docSnap = await docRef.get();

        // If not found by doc ID, search by orderCode
        if (!docSnap.exists) {
          const codeQuery = await db
            .collection('orders')
            .where('orderCode', '==', orderId)
            .limit(1)
            .get();
          if (!codeQuery.empty) {
            docRef = codeQuery.docs[0].ref;
            docSnap = codeQuery.docs[0];
          }
        }

        if (!docSnap.exists) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end(
            JSON.stringify({
              success: false,
              error: `Không tìm thấy đơn hàng với mã "${orderId}".`,
            })
          );
          return;
        }

        // Atomic update in Firestore
        await docRef.update(cleanedUpdate);

        // Fetch refreshed record
        const updatedSnap = await docRef.get();
        const updatedOrder = updatedSnap.data() as OrderRecord;

        console.log(
          `[MNH Admin Orders] Order ${updatedOrder.orderCode || orderId} status updated to "${status || updatedOrder.orderStatus}".`
        );

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công.',
            order: updatedOrder,
          })
        );
        return;
      } catch (err: any) {
        console.error('[MNH Admin Orders] Firestore update error:', err);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Không thể cập nhật trạng thái đơn hàng trong cơ sở dữ liệu.',
          })
        );
        return;
      }
    } else {
      // Local dev fallback
      const devOrders = readLocalDevOrders();
      const idx = devOrders.findIndex(
        (o) => o.id === orderId || o.orderCode === orderId
      );

      if (idx === -1) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end(
          JSON.stringify({
            success: false,
            error: `Không tìm thấy đơn hàng với mã "${orderId}".`,
          })
        );
        return;
      }

      devOrders[idx] = {
        ...devOrders[idx],
        ...cleanedUpdate,
      };

      writeLocalDevOrders(devOrders);

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          message: 'Cập nhật trạng thái đơn hàng thành công (local-dev).',
          order: devOrders[idx],
        })
      );
      return;
    }
  }
}

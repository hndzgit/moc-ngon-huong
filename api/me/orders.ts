import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { getFirestoreDb, verifyAuthToken, getIsProduction } from '../_lib/firebaseAdmin.js';
import type { OrderRecord } from '../../src/types';

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
    console.error('[MNH Me Orders] Error reading local dev store:', err);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isProduction = getIsProduction();
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Chỉ chấp nhận phương thức GET.' }));
    return;
  }

  // 1. Verify Authentication Token & Extract Authoritative UID
  let verifiedAuth: { uid: string; email?: string } | null = null;
  try {
    const authHeader = req.headers?.authorization;
    verifiedAuth = await verifyAuthToken(authHeader);
  } catch {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Phiên xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      })
    );
    return;
  }

  if (!verifiedAuth || !verifiedAuth.uid) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Yêu cầu đăng nhập để truy cập lịch sử đơn hàng của bạn.',
      })
    );
    return;
  }

  const customerUid = verifiedAuth.uid;

  // Parse query params (handles both Node IncomingMessage and VercelRequest)
  const urlObj = new URL(req.url || '', 'http://localhost');
  const targetOrderId = (req.query?.orderId as string) || urlObj.searchParams.get('orderId');
  const limitParam = parseInt(
    (req.query?.limit as string) || urlObj.searchParams.get('limit') || '30',
    10
  );
  const safeLimit = Math.min(Math.max(1, isNaN(limitParam) ? 30 : limitParam), 50);

  const db = getFirestoreDb();

  // 2. Production Fail-Closed Check
  if (isProduction && !db) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau ít phút.',
      })
    );
    return;
  }

  try {
    // A. Cloud Firestore Mode (Production & Emulator)
    if (db) {
      if (targetOrderId) {
        // Single order detail lookup
        const orderDoc = await db.collection('orders').doc(targetOrderId).get();
        if (!orderDoc.exists) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end(JSON.stringify({ success: false, error: 'Không tìm thấy đơn hàng yêu cầu.' }));
          return;
        }

        const orderData = orderDoc.data() as OrderRecord;
        // Strict ownership verification: Customer A can NEVER see Customer B's orders
        if (orderData.userId !== customerUid && orderData.customerUid !== customerUid) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 403;
          res.end(
            JSON.stringify({
              success: false,
              error: 'Bạn không có quyền truy cập thông tin đơn hàng này.',
            })
          );
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, order: orderData }));
        return;
      }

      // Order history list for authenticated user
      // Query by userId (and fallback customerUid if needed)
      const snapshot = await db
        .collection('orders')
        .where('userId', '==', customerUid)
        .limit(safeLimit)
        .get();

      const orders: OrderRecord[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as OrderRecord;
        orders.push(data);
        seenIds.add(data.id || doc.id);
      });

      // Also check customerUid in case orders only have customerUid populated
      if (orders.length < safeLimit) {
        const snapshot2 = await db
          .collection('orders')
          .where('customerUid', '==', customerUid)
          .limit(safeLimit)
          .get();
        snapshot2.forEach((doc) => {
          const data = doc.data() as OrderRecord;
          if (!seenIds.has(data.id || doc.id)) {
            orders.push(data);
            seenIds.add(data.id || doc.id);
          }
        });
      }

      // Sort newest to oldest
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          orders,
          total: orders.length,
          customerUid,
        })
      );
      return;
    }

    // B. Local Development / Test Fallback Mode (Strictly when !isProduction)
    const localOrders = readLocalDevOrders();

    if (targetOrderId) {
      const matched = localOrders.find((o) => o.id === targetOrderId || o.orderCode === targetOrderId);
      if (!matched) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Không tìm thấy đơn hàng yêu cầu.' }));
        return;
      }
      if (matched.userId !== customerUid && matched.customerUid !== customerUid) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Bạn không có quyền truy cập thông tin đơn hàng này.',
          })
        );
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, order: matched }));
      return;
    }

    // Filter user's own orders only
    const userOrders = localOrders.filter(
      (o) => o.userId === customerUid || o.customerUid === customerUid
    );
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        orders: userOrders.slice(0, safeLimit),
        total: userOrders.length,
        customerUid,
      })
    );
  } catch (err: any) {
    console.error('[MNH Me Orders Handler Error]:', err);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Lỗi truy xuất cơ sở dữ liệu đơn hàng.',
      })
    );
  }
}

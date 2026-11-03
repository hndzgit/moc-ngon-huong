import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { getFirestoreDb, verifyAuthToken, getIsProduction, getIsServerless, cleanForFirestore } from './_lib/firebaseAdmin.js';
import { sendOrderNotifications } from './_lib/notifications.js';
import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../src/data/products.js';
import type { OrderRecord, OrderItemSnapshot, PaymentStatus, OrderStatus } from '../src/types';

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

// In-process concurrency lock to reduce identical concurrent calls in a single process.
// Distributed correctness across multiple serverless instances is strictly enforced by Firestore.
const inFlightRequests = new Map<string, Promise<{ statusCode: number; payload: any }>>();

// Local development/test file store (ONLY permitted when !isProduction)
const LOCAL_DEV_DIR = path.resolve(process.cwd(), '.data');
const LOCAL_DEV_FILE = path.join(LOCAL_DEV_DIR, 'orders_dev.json');

function computePayloadFingerprint(
  items: any[],
  customer: any,
  paymentMethod: string,
  userId?: string | null
): string {
  const cleanItems = (Array.isArray(items) ? items : [])
    .map((i) => ({
      id: String(i.productId || i.product?.id || '').trim(),
      q: Number(i.quantity) || 1,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const cleanCustomer = {
    name: typeof customer?.fullName === 'string' ? customer.fullName.trim() : '',
    phone: typeof customer?.phone === 'string' ? customer.phone.replace(/[\s.-]/g, '') : '',
    email: typeof customer?.email === 'string' ? customer.email.trim().toLowerCase() : '',
    shippingMode: customer?.shippingMode === 'pickup' ? 'pickup' : 'delivery',
    address: typeof customer?.address === 'string' ? customer.address.trim() : '',
  };

  return JSON.stringify({
    userId: userId || null,
    items: cleanItems,
    customer: cleanCustomer,
    paymentMethod: paymentMethod === 'bank' ? 'bank' : 'cod',
  });
}

function readLocalDevOrders(): OrderRecord[] {
  if (getIsProduction()) return [];
  try {
    if (!fs.existsSync(LOCAL_DEV_DIR)) {
      fs.mkdirSync(LOCAL_DEV_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DEV_FILE)) {
      const data = fs.readFileSync(LOCAL_DEV_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('[MNH Dev Orders] Error reading local dev store:', err);
  }
  return [];
}

function persistLocalDevOrder(order: OrderRecord): void {
  if (getIsProduction()) return;
  try {
    if (!fs.existsSync(LOCAL_DEV_DIR)) {
      fs.mkdirSync(LOCAL_DEV_DIR, { recursive: true });
    }
    const orders = readLocalDevOrders();
    orders.unshift(order);
    fs.writeFileSync(LOCAL_DEV_FILE, JSON.stringify(orders.slice(0, 300), null, 2), 'utf-8');
  } catch (err) {
    console.error('[MNH Dev Orders] Error saving to local dev store:', err);
  }
}

// In-memory idempotency map for non-production test runs without Firestore emulator
const devIdempotencyMap = new Map<string, { order: OrderRecord; fingerprint: string }>();

// ============================================================================
// MAIN HANDLER
// ============================================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isProduction = getIsProduction();
  const isServerless = getIsServerless();

  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // GET Health / Service Verification
  if (req.method === 'GET') {
    const db = getFirestoreDb();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'Mộc Ngôn Hương Order API',
        version: '13.4.0',
        environment: isProduction ? (isServerless ? 'vercel-production' : 'production') : 'local-dev',
        persistence: db
          ? 'cloud-firestore-transactional'
          : isProduction
          ? 'fail-closed-pending-credentials'
          : 'local-dev-fallback',
        firestoreReady: Boolean(db),
      })
    );
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

  // 1. Check production database availability (FAIL CLOSED)
  const db = getFirestoreDb();
  if (isProduction && !db) {
    console.error(
      '[MNH Orders FAIL-CLOSED] Production database credentials are not configured. Rejecting order submission.'
    );
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error:
          'Hệ thống tiếp nhận đơn hàng đang bảo trì hoặc chưa sẵn sàng cơ sở dữ liệu. Quý khách vui lòng liên hệ trực tiếp hotline hoặc fanpage Mộc Ngôn Hương để được hỗ trợ đặt hàng chu đáo nhất.',
      })
    );
    return;
  }

  // 2. Parse request body safely
  let body = req.body;
  if (!body) {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawText = Buffer.concat(chunks).toString('utf-8');
      if (rawText) {
        body = JSON.parse(rawText);
      }
    } catch {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Dữ liệu JSON không hợp lệ.' }));
      return;
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Dữ liệu JSON không hợp lệ.' }));
      return;
    }
  }

  const { items, customer, paymentMethod, idempotencyKey } = body || {};

  // 3. Cryptographically Verify Authentication Token for Customer Identity
  // NEVER trust client body.userId or localStorage email!
  let verifiedCustomerUid: string | null = null;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const verified = await verifyAuthToken(authHeader);
      if (verified && verified.uid) {
        verifiedCustomerUid = verified.uid;
      }
    } catch {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        })
      );
      return;
    }
  }

  // 4. Process-level concurrency lock (Optimization for in-flight requests in the same container)
  const cleanIdempotencyKey =
    typeof idempotencyKey === 'string' && idempotencyKey.trim().length > 0
      ? idempotencyKey.trim().slice(0, 128)
      : null;

  if (cleanIdempotencyKey && inFlightRequests.has(cleanIdempotencyKey)) {
    try {
      const inFlightResult = await inFlightRequests.get(cleanIdempotencyKey)!;
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = inFlightResult.statusCode;
      res.end(JSON.stringify(inFlightResult.payload));
      return;
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err?.message || 'Lỗi xử lý yêu cầu đồng thời.' }));
      return;
    }
  }

  // 5. Validate Items against authoritative catalog
  if (!Array.isArray(items) || items.length === 0) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Giỏ hàng của bạn đang trống.' }));
    return;
  }

  const catalog = [...PRODUCTS, ...LOOSE_TEA_PRODUCTS];
  const orderSnapshots: OrderItemSnapshot[] = [];
  let calculatedSubtotal = 0;

  for (const item of items) {
    const productId = item.productId || item.product?.id;
    const quantity = Number(item.quantity);

    if (!productId || typeof productId !== 'string') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Mã sản phẩm không hợp lệ.' }));
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: `Số lượng sản phẩm "${productId}" không hợp lệ (cho phép 1-99).`,
        })
      );
      return;
    }

    const matchedProduct = catalog.find((p) => p.id === productId);
    if (!matchedProduct) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: `Sản phẩm "${productId}" không tồn tại trong danh mục chính thức của Mộc Ngôn Hương.`,
        })
      );
      return;
    }

    // Authoritative pricing from server catalog - NEVER trust client prices
    const itemTotal = matchedProduct.price * quantity;
    calculatedSubtotal += itemTotal;

    const itemSnapshot: Record<string, any> = {
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      price: matchedProduct.price,
      quantity,
      image: matchedProduct.image,
    };

    if (item.giftConfiguration && typeof item.giftConfiguration === 'object') {
      const cleanGift: Record<string, any> = {};
      if (item.giftConfiguration.recipient && typeof item.giftConfiguration.recipient === 'string') {
        cleanGift.recipient = item.giftConfiguration.recipient.trim();
      }
      if (item.giftConfiguration.message && typeof item.giftConfiguration.message === 'string') {
        cleanGift.message = item.giftConfiguration.message.trim();
      }
      if (item.giftConfiguration.giftCardTemplate && typeof item.giftConfiguration.giftCardTemplate === 'string') {
        cleanGift.giftCardTemplate = item.giftConfiguration.giftCardTemplate.trim();
      }
      if (item.giftConfiguration.boxColor && typeof item.giftConfiguration.boxColor === 'string') {
        cleanGift.boxColor = item.giftConfiguration.boxColor.trim();
      }
      if (Object.keys(cleanGift).length > 0) {
        itemSnapshot.giftConfiguration = cleanGift;
      }
    }

    orderSnapshots.push(itemSnapshot as OrderItemSnapshot);
  }

  // 6. Validate Customer Information
  if (!customer || typeof customer !== 'object') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Thiếu thông tin người mua hàng.' }));
    return;
  }

  const fullName = typeof customer.fullName === 'string' ? customer.fullName.trim() : '';
  const phone = typeof customer.phone === 'string' ? customer.phone.trim() : '';
  const email = typeof customer.email === 'string' ? customer.email.trim() : '';
  const shippingMode = customer.shippingMode === 'pickup' ? 'pickup' : 'delivery';
  const address = typeof customer.address === 'string' ? customer.address.trim() : '';
  const city = typeof customer.city === 'string' ? customer.city.trim() : '';
  const district = typeof customer.district === 'string' ? customer.district.trim() : '';
  const ward = typeof customer.ward === 'string' ? customer.ward.trim() : '';
  const pickupStore =
    typeof customer.pickupStore === 'string' ? customer.pickupStore.trim() : undefined;
  const note = typeof customer.note === 'string' ? customer.note.trim().slice(0, 500) : undefined;

  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(
      JSON.stringify({ success: false, error: 'Vui lòng nhập Họ và Tên hợp lệ (2-100 ký tự).' })
    );
    return;
  }

  // Vietnamese phone regex check (10 digits starting with 0 or +84)
  const phoneClean = phone.replace(/[\s.-]/g, '');
  if (!phoneClean || !/^(0|\+84)[1-9][0-9]{8}$/.test(phoneClean)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        error:
          'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số tại Việt Nam.',
      })
    );
    return;
  }

  // Email regex check
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Địa chỉ email không hợp lệ.' }));
    return;
  }

  if (shippingMode === 'delivery' && (!address || address.length < 5)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Vui lòng nhập địa chỉ nhận hàng chi tiết (số nhà, tên đường).',
      })
    );
    return;
  }

  // 7. Payment Method & Authoritative Calculation
  const validPaymentMethod = paymentMethod === 'bank' ? 'bank' : 'cod';
  const shippingFee = 0; // Introductory complimentary shipping policy
  const discount = 0;
  const finalTotal = calculatedSubtotal + shippingFee - discount;

  // 8. Canonical Request Fingerprint
  const currentFingerprint = computePayloadFingerprint(
    items,
    customer,
    validPaymentMethod,
    verifiedCustomerUid
  );

  // 9. Generate Order Record
  const now = new Date();
  const timestampStr = now.toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timeSuffix = now.getTime().toString().slice(-6);
  const orderCode = `MNH-${timeSuffix}-${randomSuffix}`;
  const orderId = `order_${now.getTime()}_${Math.random().toString(36).substring(2, 9)}`;

  const paymentStatus: PaymentStatus = 'pending';
  const orderStatus: OrderStatus = 'preparing';

  const customerRecord: Record<string, any> = {
    fullName,
    phone: phoneClean,
    email,
    shippingMode,
  };

  if (shippingMode === 'delivery') {
    if (address) customerRecord.address = address;
    if (city) customerRecord.city = city;
    if (district) customerRecord.district = district;
    if (ward) customerRecord.ward = ward;
  } else {
    customerRecord.pickupStore = pickupStore || '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội';
  }

  if (note) {
    customerRecord.note = note;
  }

  const rawOrderRecord: Record<string, any> = {
    id: orderId,
    orderCode,
    userId: verifiedCustomerUid || null,
    customerUid: verifiedCustomerUid || null,
    customer: customerRecord,
    items: orderSnapshots,
    subtotal: calculatedSubtotal,
    shippingFee,
    discount,
    total: finalTotal,
    paymentMethod: validPaymentMethod,
    paymentStatus,
    orderStatus,
    createdAt: timestampStr,
    notificationSent: true,
    schemaVersion: '13.4',
  };

  if (cleanIdempotencyKey) {
    rawOrderRecord.idempotencyKey = cleanIdempotencyKey;
  }

  // Deep recursive sanitization to guarantee NO undefined values reach Firestore
  const orderRecord: OrderRecord = cleanForFirestore(rawOrderRecord);

  // Execution wrapper for database-backed atomic creation & idempotency
  const executeOrderCreation = async (): Promise<{ statusCode: number; payload: any }> => {
    // A. When Firestore is available (Production & configured Staging/Emulator):
    if (db) {
      if (!cleanIdempotencyKey) {
        // Direct order without idempotency key
        await db.collection('orders').doc(orderRecord.id).set(orderRecord);
        // Await transactional email notifications in serverless lifecycle before completing response
        try {
          await sendOrderNotifications(orderRecord);
        } catch (emailErr) {
          console.error('[MNH Notification] Email dispatch error:', emailErr);
        }
        return {
          statusCode: 201,
          payload: {
            success: true,
            message: 'Đặt hàng thành công. Mộc Ngôn Hương đã tiếp nhận đơn hàng của bạn.',
            order: orderRecord,
            duplicate: false,
          },
        };
      }

      const idempotencyRef = db.collection('order_idempotency').doc(cleanIdempotencyKey);
      const orderRef = db.collection('orders').doc(orderRecord.id);

      // Firestore transaction guarantees cross-instance atomicity and race protection
      const txResult = await db.runTransaction(async (transaction) => {
        const idempDoc = await transaction.get(idempotencyRef);

        if (idempDoc.exists) {
          const existingData = idempDoc.data()!;
          if (existingData.fingerprint === currentFingerprint) {
            // Legitimate idempotent retry: Read verified order doc
            const existingOrderRef = db.collection('orders').doc(existingData.orderId);
            const existingOrderDoc = await transaction.get(existingOrderRef);
            const resolvedOrder = existingOrderDoc.exists
              ? (existingOrderDoc.data() as OrderRecord)
              : (existingData.orderSnapshot as OrderRecord);

            return {
              statusCode: 200,
              payload: {
                success: true,
                duplicate: true,
                order: resolvedOrder,
                message: 'Đơn hàng đã được ghi nhận trước đó trên hệ thống.',
              },
            };
          } else {
            // Security conflict: Idempotency key reused for different payload
            return {
              statusCode: 409,
              payload: {
                success: false,
                duplicate: false,
                error:
                  'Xung đột mã yêu cầu (Idempotency Key Conflict): Khóa này đã được sử dụng cho một đơn hàng khác với nội dung khác.',
              },
            };
          }
        }

        // New order: Atomically write order AND idempotency lock in the same transaction
        transaction.set(orderRef, orderRecord);
        transaction.set(
          idempotencyRef,
          cleanForFirestore({
            orderId: orderRecord.id,
            orderCode: orderRecord.orderCode,
            fingerprint: currentFingerprint,
            userId: orderRecord.userId || null,
            customerUid: orderRecord.customerUid || null,
            createdAt: orderRecord.createdAt,
            total: orderRecord.total,
            orderSnapshot: orderRecord,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            schemaVersion: '13.4',
          })
        );

        return {
          statusCode: 201,
          payload: {
            success: true,
            duplicate: false,
            message: 'Đặt hàng thành công. Mộc Ngôn Hương đã tiếp nhận đơn hàng của bạn.',
            order: orderRecord,
          },
        };
      });

      // If a brand new order was committed (HTTP 201), await email notifications in serverless lifecycle
      if (txResult.statusCode === 201) {
        try {
          await sendOrderNotifications(orderRecord);
        } catch (emailErr) {
          console.error('[MNH Notification] Background email dispatch error:', emailErr);
        }
      }

      return txResult;
    }

    // B. Local non-production development/test fallback (ONLY reached when !isProduction)
    if (cleanIdempotencyKey && devIdempotencyMap.has(cleanIdempotencyKey)) {
      const cached = devIdempotencyMap.get(cleanIdempotencyKey)!;
      if (cached.fingerprint === currentFingerprint) {
        return {
          statusCode: 200,
          payload: {
            success: true,
            duplicate: true,
            order: cached.order,
            message: 'Đơn hàng đã được ghi nhận trước đó trên hệ thống.',
          },
        };
      } else {
        return {
          statusCode: 409,
          payload: {
            success: false,
            duplicate: false,
            error:
              'Xung đột mã yêu cầu (Idempotency Key Conflict): Khóa này đã được sử dụng cho một đơn hàng khác với nội dung khác.',
          },
        };
      }
    }

    persistLocalDevOrder(orderRecord);
    if (cleanIdempotencyKey) {
      devIdempotencyMap.set(cleanIdempotencyKey, {
        order: orderRecord,
        fingerprint: currentFingerprint,
      });
    }

    // Trigger dev notification
    sendOrderNotifications(orderRecord).catch((err) =>
      console.error('[MNH Dev Notification Error]:', err)
    );

    return {
      statusCode: 201,
      payload: {
        success: true,
        duplicate: false,
        message: 'Đặt hàng thành công (Local Dev Mode). Mộc Ngôn Hương đã tiếp nhận đơn hàng.',
        order: orderRecord,
      },
    };
  };

  const currentPromise = executeOrderCreation();

  if (cleanIdempotencyKey) {
    inFlightRequests.set(cleanIdempotencyKey, currentPromise);
  }

  try {
    const outcome = await currentPromise;
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = outcome.statusCode;
    res.end(JSON.stringify(outcome.payload));
  } catch (err: any) {
    console.error('[MNH Orders Handler Error]:', err);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error:
          'Hệ thống gặp sự cố trong quá trình lưu trữ đơn hàng. Quý khách vui lòng thử lại hoặc liên hệ hotline Mộc Ngôn Hương (098.765.4321) để được hỗ trợ chu đáo nhất.',
      })
    );
  } finally {
    if (cleanIdempotencyKey) {
      inFlightRequests.delete(cleanIdempotencyKey);
    }
  }
}

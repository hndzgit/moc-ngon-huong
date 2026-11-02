import fs from 'fs';
import { PRODUCTS } from '../src/data/products.js';

// Setup environment for testing before importing modules
let serviceAccountPath = '/Users/hoainam/Downloads/moc-ngon-huong-firebase-adminsdk-fbsvc-5a08e425e5.json';
if (!fs.existsSync(serviceAccountPath) && process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && fs.existsSync(serviceAccountPath)) {
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = fs.readFileSync(serviceAccountPath, 'utf-8');
}
process.env.NODE_ENV = 'production';

const { getFirebaseAdminApp, getFirestoreDb, cleanForFirestore } = await import('../api/_lib/firebaseAdmin.js');

function assertNoUndefined(obj, path = '') {
  if (obj === undefined) {
    throw new Error(`Found undefined at path: "${path}"`);
  }
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => assertNoUndefined(item, `${path}[${index}]`));
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      throw new Error(`Found undefined at path: "${path}.${key}"`);
    }
    assertNoUndefined(value, `${path}.${key}`);
  }
}

async function runTests() {
  console.log('=== TEST 1: Unit Test cleanForFirestore() ===');
  const dirtyObject = {
    a: 'valid',
    b: undefined,
    c: null,
    d: 0,
    e: false,
    f: {
      nested1: 'ok',
      nested2: undefined,
      nested3: { deep: undefined, preserved: 'yes' }
    },
    items: [
      { id: '1', opt: undefined },
      { id: '2', opt: 'present' }
    ]
  };

  const cleaned = cleanForFirestore(dirtyObject);
  assertNoUndefined(cleaned, 'root');
  if ('b' in cleaned || 'nested2' in cleaned.f || 'deep' in cleaned.f.nested3 || 'opt' in cleaned.items[0]) {
    throw new Error('cleanForFirestore failed to omit undefined properties');
  }
  if (cleaned.c !== null || cleaned.d !== 0 || cleaned.e !== false) {
    throw new Error('cleanForFirestore corrupted valid falsy primitives');
  }
  console.log('✓ cleanForFirestore() strictly omitted all undefined properties while preserving null and primitives.');

  console.log('\n=== TEST 2: Multi-scenario Order Payload Sanitization ===');

  const testProduct = PRODUCTS[0];

  // Scenario A: Delivery + COD + Guest + Minimal (No note, No gift, No idempotencyKey)
  const orderA = cleanForFirestore({
    id: `test_order_A_${Date.now()}`,
    orderCode: `MNH-TEST-A`,
    userId: null,
    customerUid: null,
    customer: {
      fullName: 'Nguyễn Văn Test',
      phone: '0901234567',
      email: 'test_a@example.com',
      shippingMode: 'delivery',
      address: '123 Đường Test',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      ward: 'Hàng Trống',
      // Notice pickupStore and note are omitted
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        price: testProduct.price,
        quantity: 1,
        image: testProduct.image
      }
    ],
    subtotal: testProduct.price,
    shippingFee: 0,
    discount: 0,
    total: testProduct.price,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    notificationSent: true,
    schemaVersion: '13.4'
  });
  assertNoUndefined(orderA, 'orderA');
  console.log('✓ Scenario A (Delivery, COD, Guest, No optional fields): Verified 0 undefined properties.');

  // Scenario B: Delivery + Bank + Authenticated + Note + Gift Configuration + Idempotency
  const orderB = cleanForFirestore({
    id: `test_order_B_${Date.now()}`,
    orderCode: `MNH-TEST-B`,
    userId: 'test_uid_auth_123',
    customerUid: 'test_uid_auth_123',
    customer: {
      fullName: 'Trần Thị Auth',
      phone: '0912345678',
      email: 'auth_b@example.com',
      shippingMode: 'delivery',
      address: '456 Phố Trà',
      city: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Kim Mã',
      note: 'Giao giờ hành chính'
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        price: testProduct.price,
        quantity: 2,
        image: testProduct.image,
        giftConfiguration: {
          recipient: 'Mẹ yêu',
          message: 'Chúc mẹ luôn an vui sức khỏe',
          boxColor: 'xanh_ngoc'
        }
      }
    ],
    subtotal: testProduct.price * 2,
    shippingFee: 0,
    discount: 0,
    total: testProduct.price * 2,
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    orderStatus: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    idempotencyKey: 'test_idemp_key_b',
    notificationSent: true,
    schemaVersion: '13.4'
  });
  assertNoUndefined(orderB, 'orderB');
  console.log('✓ Scenario B (Delivery, Bank, Authenticated, Note, Gift, Idempotency): Verified 0 undefined properties.');

  // Scenario C: Pickup + COD + Authenticated + Note + Specific Pickup Store
  const orderC = cleanForFirestore({
    id: `test_order_C_${Date.now()}`,
    orderCode: `MNH-TEST-C`,
    userId: 'test_uid_auth_456',
    customerUid: 'test_uid_auth_456',
    customer: {
      fullName: 'Lê Văn C',
      phone: '0987654321',
      email: 'pickup_c@example.com',
      shippingMode: 'pickup',
      pickupStore: '42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội',
      note: 'Ghé lấy lúc 15h chiều'
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        price: testProduct.price,
        quantity: 1,
        image: testProduct.image
      }
    ],
    subtotal: testProduct.price,
    shippingFee: 0,
    discount: 0,
    total: testProduct.price,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    notificationSent: true,
    schemaVersion: '13.4'
  });
  assertNoUndefined(orderC, 'orderC');
  console.log('✓ Scenario C (Pickup, COD, Authenticated, Custom Store, Note): Verified 0 undefined properties.');

  // Scenario D: Pickup + Bank + Guest + Default Store (No note)
  const orderD = cleanForFirestore({
    id: `test_order_D_${Date.now()}`,
    orderCode: `MNH-TEST-D`,
    userId: null,
    customerUid: null,
    customer: {
      fullName: 'Phạm Thị D',
      phone: '0933445566',
      email: 'pickup_d@example.com',
      shippingMode: 'pickup',
      pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội'
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        price: testProduct.price,
        quantity: 1,
        image: testProduct.image
      }
    ],
    subtotal: testProduct.price,
    shippingFee: 0,
    discount: 0,
    total: testProduct.price,
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    orderStatus: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    notificationSent: true,
    schemaVersion: '13.4'
  });
  assertNoUndefined(orderD, 'orderD');
  console.log('✓ Scenario D (Pickup, Bank, Guest, Default Store): Verified 0 undefined properties.');

  console.log('\n=== TEST 3: Live Firestore Serialization & Immediate Cleanup ===');
  const app = getFirebaseAdminApp();
  const db = getFirestoreDb();
  if (!db) {
    console.error('Firestore not available for write test');
    process.exit(1);
  }

  const testCollection = db.collection('_test_sanitization_validation');
  
  // Test writing orderA to Firestore
  const docRefA = testCollection.doc(orderA.id);
  await docRefA.set(orderA);
  console.log('✓ Firestore SDK accepted orderA (Delivery mode) without error!');
  await docRefA.delete();
  console.log('✓ Deleted test document A cleanly.');

  // Test writing orderC to Firestore
  const docRefC = testCollection.doc(orderC.id);
  await docRefC.set(orderC);
  console.log('✓ Firestore SDK accepted orderC (Pickup mode) without error!');
  await docRefC.delete();
  console.log('✓ Deleted test document C cleanly.');

  console.log('\n=== TẤT CẢ CÁC BƯỚC KIỂM THỬ SANITIZATION VÀ FIRESTORE SERIALIZATION ĐÃ VƯỢT QUA 100%! ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

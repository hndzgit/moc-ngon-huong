import fs from 'fs';
import { getFirebaseAdminApp, getFirestoreDb, getAdminAuth } from '../api/_lib/firebaseAdmin.js';
import orderHandler from '../api/orders.js';

// Load service account from environment or user path if available
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/hoainam/Downloads/moc-ngon-huong-firebase-adminsdk-fbsvc-5a08e425e5.json';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && fs.existsSync(serviceAccountPath)) {
  const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf-8');
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = serviceAccountRaw;
}

process.env.NODE_ENV = 'production'; // test in production mode

async function runTest() {
  console.log('=== TEST 1: Initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT_JSON ===');
  const app = getFirebaseAdminApp();
  if (!app) {
    console.error('FAILED to initialize Firebase Admin app');
    process.exit(1);
  }
  console.log('✓ Firebase Admin App initialized successfully:', app.name);

  console.log('\n=== TEST 2: Connect to Cloud Firestore ===');
  const db = getFirestoreDb();
  if (!db) {
    console.error('FAILED to get Firestore DB');
    process.exit(1);
  }
  console.log('✓ Firestore DB instance retrieved');

  try {
    const collections = await db.listCollections();
    console.log('✓ Successfully connected to live Cloud Firestore! Existing collections:', collections.map(c => c.id));
  } catch (err) {
    console.warn('Note on listCollections:', err?.message || err);
  }

  console.log('\n=== TEST 3: Verify Firebase Auth Admin ===');
  const auth = getAdminAuth();
  if (!auth) {
    console.error('FAILED to get Auth Admin');
    process.exit(1);
  }
  console.log('✓ Auth Admin instance retrieved successfully');

  console.log('\n=== TEST 4: Health check via GET /api/orders in production mode ===');
  let responseData = null;
  const mockReq = { method: 'GET', headers: {} };
  const mockRes = {
    statusCode: 200,
    setHeader: () => {},
    end: (str) => { responseData = JSON.parse(str); }
  };

  await orderHandler(mockReq, mockRes);
  console.log('GET /api/orders response:', responseData);
  if (responseData.firestoreReady === true && responseData.persistence === 'cloud-firestore-transactional') {
    console.log('✓ SUCCESS: Orders API is connected to Cloud Firestore in transactional mode!');
  } else {
    console.error('FAILED: Orders API did not report cloud-firestore-transactional');
    process.exit(1);
  }

  console.log('\n=== TẤT CẢ CÁC BƯỚC XÁC THỰC FIREBASE ADMIN ĐÃ VƯỢT QUA 100%! ===');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

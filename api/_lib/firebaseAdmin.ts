import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// Strict server environment checks
export const getIsServerless = (): boolean =>
  Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

export const getIsProduction = (): boolean =>
  process.env.NODE_ENV === 'production' || getIsServerless();

export const isServerless = getIsServerless();
export const isProduction = getIsProduction();
export const isExplicitTest = process.env.NODE_ENV === 'test' || process.env.MNH_TEST_MODE === 'true';

let cachedAdminApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseAdminApp(): App | null {
  if (cachedAdminApp) return cachedAdminApp;

  const apps = getApps();
  if (apps.length > 0) {
    cachedAdminApp = apps[0];
    return cachedAdminApp;
  }

  // 1. Full JSON Service Account
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      cachedAdminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id,
      });
      return cachedAdminApp;
    } catch (err) {
      console.error('[MNH Admin] Error parsing FIREBASE_SERVICE_ACCOUNT:', err);
    }
  }

  // 2. Individual server environment credentials
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      cachedAdminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
      return cachedAdminApp;
    } catch (err) {
      console.error('[MNH Admin] Error initializing Firebase Admin with individual credentials:', err);
    }
  }

  // 3. Application Default Credentials (only if file exists on disk) or Emulator Host
  const googleCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasValidCredFile = Boolean(googleCredPath && fs.existsSync(googleCredPath));
  const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (hasValidCredFile || hasEmulator) {
    try {
      cachedAdminApp = initializeApp({
        projectId: projectId || 'moc-ngon-huong',
      });
      return cachedAdminApp;
    } catch (err) {
      console.error('[MNH Admin] Error initializing Firebase Admin with ADC/Emulator:', err);
    }
  }

  return null;
}

export function getFirestoreDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseAdminApp();
  if (app) {
    cachedDb = getFirestore(app);
    return cachedDb;
  }
  return null;
}

export function getAdminAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseAdminApp();
  if (app) {
    cachedAuth = getAuth(app);
    return cachedAuth;
  }
  return null;
}

/**
 * Extracts and cryptographically verifies Firebase ID token from Authorization header.
 * Rejects invalid or expired tokens.
 * In non-production test mode without Admin credentials, supports mock tokens (test_token_uid_xxx).
 */
export async function verifyAuthToken(
  authHeader: string | undefined
): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;

  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email };
    } catch (err) {
      console.warn('[MNH Admin Auth] Token verification failed:', err);
      throw new Error('AUTH_TOKEN_INVALID');
    }
  }

  // Non-production test/development mock token support
  if (!isProduction) {
    if (token.startsWith('test_token_uid_')) {
      const uid = token.replace('test_token_uid_', '').trim();
      return { uid, email: `${uid}@test.local` };
    }
    if (token.startsWith('mock-token-')) {
      const uid = token.replace('mock-token-', 'mock_').replace(/-/g, '_').trim();
      return { uid, email: `${uid}@test.local` };
    }
    if (token.startsWith('invalid') || token.includes('invalid') || token.includes('forged')) {
      throw new Error('AUTH_TOKEN_INVALID');
    }
    // Any other unrecognized token without Firebase Admin credentials in dev mode
    throw new Error('AUTH_TOKEN_INVALID');
  }

  return null;
}

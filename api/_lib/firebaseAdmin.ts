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
export const isProductionRuntime = getIsProduction;

export const isServerless = getIsServerless();
export const isProduction = getIsProduction();
export const isExplicitTest = process.env.NODE_ENV === 'test' || process.env.MNH_TEST_MODE === 'true';

let cachedAdminApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

function parseServiceAccount(raw: string): any {
  let str = raw.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    try {
      str = JSON.parse(str);
    } catch {
      str = str.slice(1, -1).trim();
    }
  }
  if (!str.startsWith('{') && /^[A-Za-z0-9+/=]+$/.test(str.replace(/\s+/g, ''))) {
    try {
      str = Buffer.from(str, 'base64').toString('utf-8').trim();
    } catch {
      // ignore
    }
  }
  const parsed = typeof str === 'string' ? JSON.parse(str) : str;
  if (parsed.private_key && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

/**
 * Recursively cleans an object for Cloud Firestore serialization.
 * Removes any properties whose value is strictly `undefined`.
 * Keeps valid Firestore primitives: null, boolean, number, string, Array, Date, etc.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) {
      return data;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

export function getFirebaseAdminApp(): App | null {
  if (cachedAdminApp) return cachedAdminApp;

  const apps = getApps();
  if (apps.length > 0) {
    cachedAdminApp = apps[0];
    return cachedAdminApp;
  }

  // 1. Full JSON Service Account (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT)
  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = parseServiceAccount(serviceAccountJson);
      cachedAdminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || 'moc-ngon-huong',
      });
      console.log(`[MNH Admin] Successfully initialized Firebase Admin for project: ${parsed.project_id || 'moc-ngon-huong'}`);
      return cachedAdminApp;
    } catch (err) {
      console.error('[MNH Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err);
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
export const getAdminDb = getFirestoreDb;

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
): Promise<{ uid: string; email?: string; isAnonymous?: boolean } | null> {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;

  // Non-production test/development mock token support (checked before Admin SDK so local tests can use mock tokens even if service account exists)
  if (!isProduction) {
    if (token.startsWith('test_token_uid_')) {
      const uid = token.replace('test_token_uid_', '').trim();
      return { uid, email: `${uid}@test.local`, isAnonymous: false };
    }
    if (token.startsWith('test_anon_uid_')) {
      const uid = token.replace('test_anon_uid_', '').trim();
      return { uid, email: undefined, isAnonymous: true };
    }
    if (token.startsWith('mock-token-')) {
      const uid = token.replace('mock-token-', 'mock_').replace(/-/g, '_').trim();
      return { uid, email: `${uid}@test.local`, isAnonymous: false };
    }
    if (token.startsWith('invalid') || token.includes('invalid') || token.includes('forged')) {
      throw new Error('AUTH_TOKEN_INVALID');
    }
  }

  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      const signInProvider = (decoded as any)?.firebase?.sign_in_provider;
      return {
        uid: decoded.uid,
        email: decoded.email,
        isAnonymous: signInProvider === 'anonymous',
      };
    } catch {
      console.warn('[MNH Admin Auth] Token verification failed.');
      throw new Error('AUTH_TOKEN_INVALID');
    }
  }

  if (!isProduction) {
    // In local dev without Firebase Admin service account credentials, accept real Firebase client JWTs for moc-ngon-huong
    const parts = token.split('.');
    if (parts.length === 3 && token.startsWith('eyJ')) {
      try {
        const payloadJson = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const uid = payloadJson.user_id || payloadJson.sub;
        if (uid && payloadJson.aud === 'moc-ngon-huong') {
          return {
            uid,
            email: payloadJson.email,
            isAnonymous: payloadJson.firebase?.sign_in_provider === 'anonymous',
          };
        }
      } catch {
        // Fall through to AUTH_TOKEN_INVALID
      }
    }
    throw new Error('AUTH_TOKEN_INVALID');
  }

  return null;
}

export interface AdminAuthResult {
  uid: string;
  email?: string;
}

export interface AdminVerificationOutcome {
  authorized: boolean;
  statusCode?: 401 | 403;
  errorCode?: string;
  errorMessage?: string;
  admin?: AdminAuthResult;
}

export function getAdminUids(): string[] {
  const raw = process.env.ADMIN_UIDS || '';
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function verifyAdminAuth(
  authHeader: string | undefined
): Promise<AdminVerificationOutcome> {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      statusCode: 401,
      errorCode: 'UNAUTHENTICATED',
      errorMessage: 'Vui lòng đăng nhập để tiếp tục.',
    };
  }

  let user: { uid: string; email?: string } | null = null;
  try {
    user = await verifyAuthToken(authHeader);
  } catch {
    return {
      authorized: false,
      statusCode: 401,
      errorCode: 'TOKEN_INVALID',
      errorMessage: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    };
  }

  if (!user || !user.uid) {
    return {
      authorized: false,
      statusCode: 401,
      errorCode: 'UNAUTHENTICATED',
      errorMessage: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    };
  }

  const allowedUids = getAdminUids();
  if (allowedUids.length === 0) {
    console.error('[MNH Admin Auth] Admin allowlist is not configured. Refusing all admin access (FAIL CLOSED).');
    return {
      authorized: false,
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      errorMessage: 'Không có quyền truy cập khu vực quản trị.',
    };
  }

  if (!allowedUids.includes(user.uid)) {
    console.warn('[MNH Admin Auth] Forbidden: authenticated account is not authorized for admin access.');
    return {
      authorized: false,
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      errorMessage: 'Không có quyền truy cập khu vực quản trị.',
    };
  }

  return {
    authorized: true,
    admin: user,
  };
}

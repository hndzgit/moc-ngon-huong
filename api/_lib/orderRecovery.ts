// api/_lib/orderRecovery.ts
// Cryptographic guest/order recovery token management, rate limiting, order sanitization, and local dev store helpers

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildOrderPaymentInstructions,
  DEFAULT_VIETQR_ACCOUNT_NAME,
  DEFAULT_VIETQR_ACCOUNT_NO,
  DEFAULT_VIETQR_BANK_BIN,
} from '../../src/lib/vietqr.js';

export const RECOVERY_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getLocalDevStorePath(): string {
  return process.env.MNH_LOCAL_DEV_STORE_PATH || path.resolve(process.cwd(), 'api', '.orders-dev.json');
}

export function getLocalDevCounterPath(): string {
  return process.env.MNH_LOCAL_DEV_COUNTER_PATH || `${getLocalDevStorePath()}.counter.json`;
}

export function readLocalDevOrders(): any[] {
  try {
    const p = getLocalDevStorePath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function writeLocalDevOrders(orders: any[]): void {
  const p = getLocalDevStorePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(orders, null, 2), 'utf-8');
}

export function readLocalNextSeq(existingOrders: any[]): number {
  const override = (globalThis as any).__MNH_TEST_NEXT_SEQ__;
  if (typeof override === 'number' && Number.isInteger(override) && override >= 0) {
    return override;
  }
  try {
    const cp = getLocalDevCounterPath();
    if (fs.existsSync(cp)) {
      const data = JSON.parse(fs.readFileSync(cp, 'utf-8'));
      if (typeof data?.nextSeq === 'number' && Number.isInteger(data.nextSeq) && data.nextSeq >= 0) {
        return data.nextSeq;
      }
    }
  } catch {}

  let maxFound = -1;
  for (const o of existingOrders) {
    const m = /^MNH(\d{6})$/.exec(String(o?.orderCode || ''));
    if (m) {
      const n = Number(m[1]);
      if (n > maxFound) maxFound = n;
    }
  }
  return maxFound + 1;
}

export function writeLocalNextSeq(nextSeq: number): void {
  if (typeof (globalThis as any).__MNH_TEST_NEXT_SEQ__ === 'number') {
    (globalThis as any).__MNH_TEST_NEXT_SEQ__ = nextSeq;
  }
  try {
    const cp = getLocalDevCounterPath();
    fs.mkdirSync(path.dirname(cp), { recursive: true });
    fs.writeFileSync(cp, JSON.stringify({ nextSeq, updatedAt: new Date().toISOString() }), 'utf-8');
  } catch {}
}

let localLockPromise: Promise<any> = Promise.resolve();
export function withLocalStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = localLockPromise.then(fn, fn);
  localLockPromise = next.catch(() => {});
  return next;
}

export function generateRecoveryToken(): {
  recoveryToken: string;
  recoveryTokenHash: string;
  recoveryTokenExpiresAt: string;
} {
  const recoveryToken = crypto.randomBytes(32).toString('hex');
  const recoveryTokenHash = hashRecoveryToken(recoveryToken);
  const recoveryTokenExpiresAt = new Date(Date.now() + RECOVERY_TOKEN_TTL_MS).toISOString();
  return { recoveryToken, recoveryTokenHash, recoveryTokenExpiresAt };
}

export function hashRecoveryToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function verifyRecoveryTokenHash(
  candidateToken: string | undefined | null,
  storedHash: string | undefined | null,
  expiresAtIso?: string | null
): { valid: boolean; reason?: 'missing' | 'expired' | 'mismatch' } {
  if (!candidateToken || typeof candidateToken !== 'string' || !storedHash || typeof storedHash !== 'string') {
    return { valid: false, reason: 'missing' };
  }
  const clean = candidateToken.trim();
  if (clean.length < 32 || clean.length > 128) {
    return { valid: false, reason: 'mismatch' };
  }
  if (expiresAtIso) {
    const expMs = Date.parse(expiresAtIso);
    if (!Number.isNaN(expMs) && Date.now() > expMs) {
      return { valid: false, reason: 'expired' };
    }
  }
  const candidateHash = hashRecoveryToken(clean);
  if (candidateHash.length !== storedHash.length) {
    return { valid: false, reason: 'mismatch' };
  }
  const match = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'utf8'),
    Buffer.from(storedHash, 'utf8')
  );
  return match ? { valid: true } : { valid: false, reason: 'mismatch' };
}

export function buildOrderRecoveryUrl(orderId: string, recoveryToken?: string | null): string {
  const baseUrl = (process.env.PUBLIC_SITE_URL || 'https://mocngonhuong.com').replace(/\/$/, '');
  if (recoveryToken) {
    return `${baseUrl}/#/thanh-toan?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(recoveryToken)}`;
  }
  return `${baseUrl}/#/tai-khoan`;
}

export function getConfiguredVietQrBankDetails(): {
  bankBin: string;
  accountNo: string;
  accountName: string;
} {
  return {
    bankBin: (process.env.VIETQR_BANK_BIN || DEFAULT_VIETQR_BANK_BIN).trim(),
    accountNo: (process.env.VIETQR_ACCOUNT_NO || DEFAULT_VIETQR_ACCOUNT_NO).trim(),
    accountName: (process.env.VIETQR_ACCOUNT_NAME || DEFAULT_VIETQR_ACCOUNT_NAME).trim(),
  };
}

export function enrichAndSanitizeOrderForClient(
  rawOrder: Record<string, any>,
  transientRecoveryToken?: string
): Record<string, any> {
  const clone: Record<string, any> = { ...rawOrder };
  delete clone.recoveryTokenHash;
  delete clone.recoveryTokenExpiresAt;

  // Ensure VietQR paymentInstructions are always authoritative for bank orders
  if (clone.paymentMethod === 'bank' && clone.orderCode && typeof clone.total === 'number' && clone.total > 0) {
    const bankCfg = getConfiguredVietQrBankDetails();
    try {
      clone.paymentInstructions = buildOrderPaymentInstructions({
        orderCode: clone.orderCode,
        amount: clone.total,
        bankBin: clone.paymentInstructions?.bankBin || bankCfg.bankBin,
        accountNo: clone.paymentInstructions?.accountNo || bankCfg.accountNo,
        accountName: clone.paymentInstructions?.accountName || bankCfg.accountName,
      });
    } catch {
      // Preserve existing paymentInstructions if legacy code format doesn't match
    }
  }

  if (transientRecoveryToken) {
    clone.recoveryToken = transientRecoveryToken;
  }

  return clone;
}

// Rate limiter for guest token lookup & recovery endpoints
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRecoveryRateLimit(
  key: string,
  maxAttempts = 15,
  windowMs = 60_000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);
  if (!existing || now >= existing.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  existing.count += 1;
  if (existing.count > maxAttempts) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRecoveryRateLimitsForTest(): void {
  rateLimitBuckets.clear();
}

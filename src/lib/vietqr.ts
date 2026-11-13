// src/lib/vietqr.ts
// Validated Dynamic EMVCo / NAPAS 247 VietQR Generator & Parser for Mộc Ngôn Hương
// Verified against original BIDV QR image (Mã QR Mộc Ngôn Hương.JPG):
// 00020101021138540010A00000072701240006970418011089608267510208QRIBFTTA53037045802VN63042886

import { renderQrSvgDataUrl } from './qrCodeGenerator.js';

export const DEFAULT_VIETQR_BANK_BIN = '970418';
export const DEFAULT_VIETQR_BANK_SHORT_NAME = 'BIDV';
export const DEFAULT_VIETQR_BANK_FULL_NAME = 'Ngân hàng TMCP Đầu tư & Phát triển Việt Nam';
export const DEFAULT_VIETQR_ACCOUNT_NO = '8960826751';
export const DEFAULT_VIETQR_ACCOUNT_NAME = 'NGUYEN THI VAN ANH';
export const VIETQR_NAPAS_GUID = 'A000000727';
export const VIETQR_SERVICE_CODE = 'QRIBFTTA';
export const VIETQR_CURRENCY_VND = '704';
export const VIETQR_COUNTRY_VN = 'VN';
export const ORIGINAL_STATIC_VIETQR_PAYLOAD =
  '00020101021138540010A00000072701240006970418011089608267510208QRIBFTTA53037045802VN63042886';

export interface VietQrBuildInput {
  bankBin?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  transferContent: string;
}

export interface VietQrPaymentInstructions {
  method: 'vietqr';
  bankBin: string;
  bankShortName: string;
  bankFullName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  currency: 'VND';
  transferContent: string;
  qrPayload: string;
  qrSvgDataUrl: string;
}

export interface VietQrExpectation {
  bankBin?: string;
  accountNo?: string;
  amount?: number;
  transferContent?: string;
  pointOfInitiation?: '11' | '12';
}

export interface VietQrParsedResult {
  valid: boolean;
  errors: string[];
  payloadFormatIndicator?: string;
  pointOfInitiationMethod?: string;
  guid?: string;
  bankBin?: string;
  accountNo?: string;
  serviceCode?: string;
  currencyCode?: string;
  amount?: number;
  amountRaw?: string;
  countryCode?: string;
  transferContent?: string;
  crcProvided?: string;
  crcComputed?: string;
}

function formatTlv(tag: string, value: string): string {
  if (!/^\d{2}$/.test(tag)) {
    throw new Error(`Invalid EMVCo TLV tag "${tag}".`);
  }
  if (value.length === 0 || value.length > 99) {
    throw new Error(`Invalid EMVCo TLV value length (${value.length}) for tag ${tag}.`);
  }
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

/**
 * Computes CRC-16/CCITT-FALSE (ISO/IEC 13239) over ASCII bytes:
 * Polynomial: 0x1021, Initial Value: 0xFFFF, XorOut: 0x0000, Non-reflected.
 */
export function computeCrc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code > 0x7f) {
      throw new Error('EMVCo VietQR payload must contain ASCII characters only.');
    }
    crc ^= (code & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function isValidSequentialOrderCode(code: string): boolean {
  return /^MNH\d{6}$/.test(code);
}

export function isValidOrderTransferReference(code: string): boolean {
  // New sequential format MNH000000..MNH999999 or existing legacy MNH-XXXXXX-XXXX
  return /^MNH(\d{6}|-[0-9A-Z]{4,10}-[0-9A-Z]{4,10})$/.test(code);
}

/**
 * Builds a dynamic EMVCo / NAPAS 247 VietQR payload for a specific order and exact VND amount.
 */
export function buildVietQrPayload(input: VietQrBuildInput): string {
  const bankBin = (input.bankBin || DEFAULT_VIETQR_BANK_BIN).trim();
  const accountNo = (input.accountNo || DEFAULT_VIETQR_ACCOUNT_NO).trim();
  const transferContent = (input.transferContent || '').trim();
  const amount = input.amount;

  if (!/^\d{6}$/.test(bankBin)) {
    throw new Error(`Invalid bank BIN "${bankBin}". Expected 6 digits.`);
  }
  if (!/^[0-9A-Za-z]{6,19}$/.test(accountNo)) {
    throw new Error(`Invalid bank account number "${accountNo}".`);
  }
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999999) {
    throw new Error(`Invalid VietQR integer VND amount: ${amount}.`);
  }
  if (!isValidOrderTransferReference(transferContent)) {
    throw new Error(
      `Invalid VietQR transfer reference "${transferContent}". Must be an exact Mộc Ngôn Hương order code (e.g. MNH000000).`
    );
  }

  // Tag 00: Payload Format Indicator = "01"
  const tag00 = formatTlv('00', '01');
  // Tag 01: Point of Initiation Method = "12" (Dynamic QR)
  const tag01 = formatTlv('01', '12');

  // Tag 38: Merchant Account Information (NAPAS VietQR)
  const sub38_00 = formatTlv('00', VIETQR_NAPAS_GUID);
  const sub38_01_00 = formatTlv('00', bankBin);
  const sub38_01_01 = formatTlv('01', accountNo);
  const sub38_01 = formatTlv('01', `${sub38_01_00}${sub38_01_01}`);
  const sub38_02 = formatTlv('02', VIETQR_SERVICE_CODE);
  const tag38 = formatTlv('38', `${sub38_00}${sub38_01}${sub38_02}`);

  // Tag 53: Transaction Currency = "704" (VND)
  const tag53 = formatTlv('53', VIETQR_CURRENCY_VND);
  // Tag 54: Transaction Amount (exact integer VND)
  const tag54 = formatTlv('54', String(amount));
  // Tag 58: Country Code = "VN"
  const tag58 = formatTlv('58', VIETQR_COUNTRY_VN);
  // Tag 62: Additional Data Field Template -> Subtag 08: Purpose of Transaction = orderCode
  const tag62 = formatTlv('62', formatTlv('08', transferContent));

  const bodyWithCrcPrefix = `${tag00}${tag01}${tag38}${tag53}${tag54}${tag58}${tag62}6304`;
  const crc = computeCrc16CcittFalse(bodyWithCrcPrefix);
  return `${bodyWithCrcPrefix}${crc}`;
}

function parseTlvMap(raw: string): { map: Map<string, string>; error?: string } {
  const map = new Map<string, string>();
  let idx = 0;
  while (idx < raw.length) {
    if (idx + 4 > raw.length) {
      return { map, error: `Truncated TLV header at index ${idx}.` };
    }
    const tag = raw.slice(idx, idx + 2);
    const lenStr = raw.slice(idx + 2, idx + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      return { map, error: `Malformed TLV tag/length "${tag}${lenStr}" at index ${idx}.` };
    }
    const len = Number(lenStr);
    if (len <= 0 || idx + 4 + len > raw.length) {
      return { map, error: `TLV length ${len} for tag ${tag} exceeds remaining payload at index ${idx}.` };
    }
    if (map.has(tag)) {
      return { map, error: `Duplicate TLV tag ${tag} at index ${idx}.` };
    }
    map.set(tag, raw.slice(idx + 4, idx + 4 + len));
    idx += 4 + len;
  }
  return { map };
}

/**
 * Parses and validates an EMVCo / NAPAS VietQR payload string, including CRC-16 verification.
 */
export function parseAndValidateVietQrPayload(
  payload: string,
  expected: VietQrExpectation = {}
): VietQrParsedResult {
  const errors: string[] = [];

  if (typeof payload !== 'string' || payload.length < 20) {
    return { valid: false, errors: ['Payload is empty or too short.'] };
  }

  // Must end with 6304XXXX
  const crcTagIndex = payload.length - 8;
  const crcHeader = payload.slice(crcTagIndex, crcTagIndex + 4);
  const crcProvided = payload.slice(crcTagIndex + 4);
  let crcComputed = '';

  if (crcHeader !== '6304' || !/^[0-9A-F]{4}$/.test(crcProvided)) {
    errors.push('Missing or malformed CRC tag (6304XXXX) at end of payload.');
  } else {
    try {
      crcComputed = computeCrc16CcittFalse(payload.slice(0, crcTagIndex + 4));
      if (crcComputed !== crcProvided) {
        errors.push(`CRC-16 mismatch: provided ${crcProvided}, computed ${crcComputed}.`);
      }
    } catch (e: any) {
      errors.push(e?.message || 'CRC computation failed.');
    }
  }

  const topParsed = parseTlvMap(payload);
  if (topParsed.error) {
    errors.push(topParsed.error);
  }
  const top = topParsed.map;

  const payloadFormatIndicator = top.get('00');
  const pointOfInitiationMethod = top.get('01');
  const tag38Raw = top.get('38');
  const currencyCode = top.get('53');
  const amountRaw = top.get('54');
  const countryCode = top.get('58');
  const tag62Raw = top.get('62');

  if (payloadFormatIndicator !== '01') {
    errors.push(`Invalid Payload Format Indicator (00): "${payloadFormatIndicator}".`);
  }

  const expectedPoi = expected.pointOfInitiation || '12';
  if (pointOfInitiationMethod !== expectedPoi) {
    errors.push(
      `Invalid Point of Initiation Method (01): "${pointOfInitiationMethod}", expected "${expectedPoi}".`
    );
  }

  let guid: string | undefined;
  let bankBin: string | undefined;
  let accountNo: string | undefined;
  let serviceCode: string | undefined;

  if (!tag38Raw) {
    errors.push('Missing Merchant Account Information (Tag 38).');
  } else {
    const sub38Parsed = parseTlvMap(tag38Raw);
    if (sub38Parsed.error) errors.push(`Tag 38 error: ${sub38Parsed.error}`);
    guid = sub38Parsed.map.get('00');
    const sub38_01Raw = sub38Parsed.map.get('01');
    serviceCode = sub38Parsed.map.get('02');

    if (guid !== VIETQR_NAPAS_GUID) {
      errors.push(`Invalid NAPAS GUID (38.00): "${guid}".`);
    }
    if (serviceCode !== VIETQR_SERVICE_CODE) {
      errors.push(`Invalid Service Code (38.02): "${serviceCode}".`);
    }
    if (!sub38_01Raw) {
      errors.push('Missing Beneficiary Organization block (38.01).');
    } else {
      const sub01Parsed = parseTlvMap(sub38_01Raw);
      if (sub01Parsed.error) errors.push(`Tag 38.01 error: ${sub01Parsed.error}`);
      bankBin = sub01Parsed.map.get('00');
      accountNo = sub01Parsed.map.get('01');
    }
  }

  const expectedBin = expected.bankBin || DEFAULT_VIETQR_BANK_BIN;
  if (bankBin !== expectedBin) {
    errors.push(`Bank BIN mismatch: got "${bankBin}", expected "${expectedBin}".`);
  }

  const expectedAcc = expected.accountNo || DEFAULT_VIETQR_ACCOUNT_NO;
  if (accountNo !== expectedAcc) {
    errors.push(`Account number mismatch: got "${accountNo}", expected "${expectedAcc}".`);
  }

  if (currencyCode !== VIETQR_CURRENCY_VND) {
    errors.push(`Invalid Currency Code (53): "${currencyCode}", expected "704".`);
  }

  if (countryCode !== VIETQR_COUNTRY_VN) {
    errors.push(`Invalid Country Code (58): "${countryCode}", expected "VN".`);
  }

  let amount: number | undefined;
  if (expectedPoi === '12') {
    if (!amountRaw || !/^[1-9]\d*$/.test(amountRaw)) {
      errors.push(`Invalid or missing dynamic transaction amount (Tag 54): "${amountRaw}".`);
    } else {
      amount = Number(amountRaw);
      if (expected.amount !== undefined && amount !== expected.amount) {
        errors.push(`Amount mismatch: got ${amount}, expected ${expected.amount}.`);
      }
    }
  }

  let transferContent: string | undefined;
  if (tag62Raw) {
    const sub62Parsed = parseTlvMap(tag62Raw);
    if (sub62Parsed.error) errors.push(`Tag 62 error: ${sub62Parsed.error}`);
    transferContent = sub62Parsed.map.get('08');
  }

  if (expectedPoi === '12') {
    if (!transferContent || !isValidOrderTransferReference(transferContent)) {
      errors.push(`Invalid or missing transfer reference (Tag 62.08): "${transferContent}".`);
    } else if (expected.transferContent !== undefined && transferContent !== expected.transferContent) {
      errors.push(
        `Transfer content mismatch: got "${transferContent}", expected "${expected.transferContent}".`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    payloadFormatIndicator,
    pointOfInitiationMethod,
    guid,
    bankBin,
    accountNo,
    serviceCode,
    currencyCode,
    amount,
    amountRaw,
    countryCode,
    transferContent,
    crcProvided,
    crcComputed,
  };
}

export function buildOrderPaymentInstructions(input: {
  orderCode: string;
  amount: number;
  bankBin?: string;
  accountNo?: string;
  accountName?: string;
}): VietQrPaymentInstructions {
  const bankBin = (input.bankBin || DEFAULT_VIETQR_BANK_BIN).trim();
  const accountNo = (input.accountNo || DEFAULT_VIETQR_ACCOUNT_NO).trim();
  const accountName = (input.accountName || DEFAULT_VIETQR_ACCOUNT_NAME).trim();
  const transferContent = input.orderCode.trim();
  const amount = Math.round(input.amount);

  const qrPayload = buildVietQrPayload({
    bankBin,
    accountNo,
    accountName,
    amount,
    transferContent,
  });

  const qrSvgDataUrl = renderQrSvgDataUrl(qrPayload, {
    margin: 4,
    darkColor: '#1B2A1E',
    lightColor: '#FFFFFF',
    sizePx: 360,
  });

  return {
    method: 'vietqr',
    bankBin,
    bankShortName: DEFAULT_VIETQR_BANK_SHORT_NAME,
    bankFullName: DEFAULT_VIETQR_BANK_FULL_NAME,
    accountNo,
    accountName,
    amount,
    currency: 'VND',
    transferContent,
    qrPayload,
    qrSvgDataUrl,
  };
}

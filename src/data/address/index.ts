// src/data/address/index.ts
// Mộc Ngôn Hương — Vietnam 2026 Authoritative Administrative Unit Catalog
// Legal Baseline: Decision 19/2025/QĐ-TTg (Effective from 01/07/2025)
// 34 Provinces/Centrally-Governed Cities & 3,321 Commune-Level Units

import { PROVINCES } from './provincesData.js';
import { COMMUNES_BY_PROVINCE } from './communesData.js';
import { ADMIN_CATALOG_META } from './metaData.js';
import { LEGACY_MAPPINGS } from './legacyMappingsData.js';

import type {
  Province,
  Commune,
  AddressCatalogMeta,
  ValidatedDeliveryAddress,
  LegacyAddressInput,
  ConversionProposal,
} from './types.js';

export type * from './types.js';
export { PROVINCES, COMMUNES_BY_PROVINCE, ADMIN_CATALOG_META };

// Index maps for constant-time lookups
const PROVINCE_MAP = new Map<string, Province>();
for (const p of PROVINCES) {
  PROVINCE_MAP.set(p.code, p);
}

const COMMUNE_MAP = new Map<string, Commune>();
for (const [pCode, communes] of Object.entries(COMMUNES_BY_PROVINCE)) {
  for (const c of communes) {
    COMMUNE_MAP.set(`${pCode}:${c.code}`, c);
  }
}

/**
 * Remove Vietnamese accents/diacritics and normalize for fast searching
 */
export function normalizeVietnameseSearch(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .replace(/[\s\-_,./]+/g, ' ')
    .trim();
}

/**
 * Clean common administrative prefixes to facilitate flexible search and legacy mapping
 */
export function cleanAdminPrefix(s: string): string {
  if (!s) return '';
  let str = s.trim().toLowerCase();
  const prefixes = [
    'thành phố ', 'tp. ', 'tp ', 'tỉnh ',
    'quận ', 'huyện ', 'thị xã ', 'tx. ', 'tx ',
    'phường ', 'xã ', 'đặc khu ', 'thị trấn ', 'tt. ', 'tt ',
  ];
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      str = str.slice(prefix.length).trim();
      break;
    }
  }
  return str;
}

/**
 * Retrieve all 34 verified provinces and centrally governed cities
 */
export function getProvinces(): Province[] {
  return PROVINCES;
}

/**
 * Retrieve a province by its 2-digit code
 */
export function getProvinceByCode(code?: string): Province | undefined {
  if (!code) return undefined;
  const cleanCode = code.trim().padStart(2, '0');
  return PROVINCE_MAP.get(cleanCode);
}

/**
 * Retrieve all communes belonging to a specific province
 */
export function getCommunesByProvinceCode(provinceCode?: string): Commune[] {
  if (!provinceCode) return [];
  const cleanCode = provinceCode.trim().padStart(2, '0');
  return COMMUNES_BY_PROVINCE[cleanCode] || [];
}

/**
 * Retrieve a specific commune by province code and 5-digit commune code
 */
export function getCommuneByCode(provinceCode?: string, communeCode?: string): Commune | undefined {
  if (!provinceCode || !communeCode) return undefined;
  const pCode = provinceCode.trim().padStart(2, '0');
  const cCode = communeCode.trim().padStart(5, '0');
  return COMMUNE_MAP.get(`${pCode}:${cCode}`);
}

/**
 * Search provinces with accent-insensitive search and prefix prioritization
 */
export function searchProvinces(query: string): Province[] {
  const normQuery = normalizeVietnameseSearch(query);
  if (!normQuery) return PROVINCES;

  return PROVINCES.filter((p) => {
    const normName = normalizeVietnameseSearch(p.name);
    const normFull = normalizeVietnameseSearch(p.fullName);
    const code = p.code;
    return (
      normName.includes(normQuery) ||
      normFull.includes(normQuery) ||
      code.includes(normQuery)
    );
  }).sort((a, b) => {
    const aNorm = normalizeVietnameseSearch(a.name);
    const bNorm = normalizeVietnameseSearch(b.name);
    const aStarts = aNorm.startsWith(normQuery);
    const bStarts = bNorm.startsWith(normQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.code.localeCompare(b.code);
  });
}

/**
 * Search communes within a province with accent-insensitive search
 */
export function searchCommunes(provinceCode: string, query: string): Commune[] {
  const communes = getCommunesByProvinceCode(provinceCode);
  const normQuery = normalizeVietnameseSearch(query);
  if (!normQuery) return communes;

  return communes.filter((c) => {
    const normName = normalizeVietnameseSearch(c.name);
    const code = c.code;
    return normName.includes(normQuery) || code.includes(normQuery);
  }).sort((a, b) => {
    const aNorm = normalizeVietnameseSearch(cCleanName(a.name));
    const bNorm = normalizeVietnameseSearch(cCleanName(b.name));
    const aStarts = aNorm.startsWith(normQuery);
    const bStarts = bNorm.startsWith(normQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name, 'vi');
  });
}

function cCleanName(name: string): string {
  return cleanAdminPrefix(name);
}

/**
 * Format a two-level customer address: [Số nhà/Đường], [Phường/Xã/Đặc khu], [Tỉnh/Thành phố]
 * Guarantees zero empty district separators.
 */
export function formatCustomerDeliveryAddress(params: {
  address?: string;
  communeName?: string;
  provinceName?: string;
  formattedAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  shippingMode?: 'delivery' | 'pickup';
  pickupStore?: string;
}): string {
  if (params.shippingMode === 'pickup') {
    return params.pickupStore || '42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội';
  }

  if (params.formattedAddress) {
    return params.formattedAddress;
  }

  // Two-level format (V17.4)
  if (params.communeName || params.provinceName) {
    return [params.address, params.communeName, params.provinceName]
      .filter((part) => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }

  // Legacy fallback format
  return [params.address, params.ward, params.district, params.city]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
}

/**
 * Validate customer delivery address according to Phase 5 Smart Validation rules
 */
export function validateDeliveryAddress(params: {
  address?: string;
  provinceCode?: string;
  communeCode?: string;
}): {
  isValid: boolean;
  error?: string;
  validated?: ValidatedDeliveryAddress;
} {
  const address = typeof params.address === 'string' ? params.address.trim() : '';
  const pCode = typeof params.provinceCode === 'string' ? params.provinceCode.trim().padStart(2, '0') : '';
  const cCode = typeof params.communeCode === 'string' ? params.communeCode.trim().padStart(5, '0') : '';

  if (!pCode) {
    return {
      isValid: false,
      error: 'Vui lòng chọn Tỉnh / Thành phố nhận hàng.',
    };
  }

  const province = getProvinceByCode(pCode);
  if (!province) {
    return {
      isValid: false,
      error: `Tỉnh / Thành phố với mã "${pCode}" không tồn tại trong danh mục hành chính 2026.`,
    };
  }

  if (!cCode) {
    return {
      isValid: false,
      error: 'Vui lòng chọn Phường / Xã / Đặc khu nhận hàng.',
    };
  }

  const commune = getCommuneByCode(pCode, cCode);
  if (!commune) {
    return {
      isValid: false,
      error: `Phường / Xã / Đặc khu mã "${cCode}" không thuộc "${province.fullName}". Vui lòng chọn lại.`,
    };
  }

  if (!address || address.length < 3) {
    return {
      isValid: false,
      error: 'Vui lòng nhập địa chỉ nhận hàng chi tiết (số nhà, tên đường, thôn, xóm hoặc tổ dân phố).',
    };
  }

  if (address.length > 250) {
    return {
      isValid: false,
      error: 'Địa chỉ nhận hàng chi tiết quá dài (tối đa 250 ký tự).',
    };
  }

  const formattedAddress = `${address}, ${commune.name}, ${province.fullName}`;

  return {
    isValid: true,
    validated: {
      address,
      provinceCode: province.code,
      provinceName: province.fullName,
      communeCode: commune.code,
      communeName: commune.name,
      formattedAddress,
      addressSchemaVersion: '2',
    },
  };
}

/**
 * Attempt verified mapping of legacy 3-level addresses (Phase 7)
 * Strictly adheres to rule: only return unambiguous mapping when exact match exists.
 */
export function attemptLegacyAddressConversion(legacy: LegacyAddressInput): ConversionProposal {
  const address = legacy.address?.trim() || '';
  const city = legacy.city?.trim() || '';
  const district = legacy.district?.trim() || '';
  const ward = legacy.ward?.trim() || '';

  const originalAddress = [address, ward, district, city].filter(Boolean).join(', ');

  // If district or ward is missing, automatic mapping is ambiguous
  if (!city || !district || !ward) {
    // Attempt province matching at least
    const normCity = cleanAdminPrefix(city);
    const matchedProv = PROVINCES.find((p) => {
      const pNorm = cleanAdminPrefix(p.name);
      const pFullNorm = cleanAdminPrefix(p.fullName);
      return pNorm === normCity || pFullNorm === normCity;
    });

    return {
      isUnambiguous: false,
      originalAddress,
      proposedProvinceCode: matchedProv?.code,
      proposedProvinceName: matchedProv?.fullName,
      note: 'Địa chỉ cũ chưa đủ 3 cấp hành chính để tự động quy đổi chính xác sang đơn vị xã mới.',
    };
  }

  const normCity = cleanAdminPrefix(city);
  const normDistrict = cleanAdminPrefix(district);
  const normWard = cleanAdminPrefix(ward);

  const lookupKey = `${normCity}|${normDistrict}|${normWard}`;
  const mapped = LEGACY_MAPPINGS[lookupKey];

  if (mapped) {
    const [pCode, cCode] = mapped;
    const province = getProvinceByCode(pCode);
    const commune = getCommuneByCode(pCode, cCode);

    if (province && commune) {
      const proposedFormatted = `${address ? `${address}, ` : ''}${commune.name}, ${province.fullName}`;
      return {
        isUnambiguous: true,
        originalAddress,
        proposedProvinceCode: province.code,
        proposedProvinceName: province.fullName,
        proposedCommuneCode: commune.code,
        proposedCommuneName: commune.name,
        proposedFormattedAddress: proposedFormatted,
        note: `Đã xác thực chuyển đổi toàn bộ đơn vị hành chính cũ sang ${commune.name}, ${province.fullName}.`,
      };
    }
  }

  // Check if at least province is matched
  const matchedProv = PROVINCES.find((p) => {
    const pNorm = cleanAdminPrefix(p.name);
    const pFullNorm = cleanAdminPrefix(p.fullName);
    return pNorm === normCity || pFullNorm === normCity;
  });

  return {
    isUnambiguous: false,
    originalAddress,
    proposedProvinceCode: matchedProv?.code,
    proposedProvinceName: matchedProv?.fullName,
    note: `Đơn vị hành chính cũ "${ward}, ${district}" được sắp xếp theo địa giới mới. Quý khách vui lòng xác nhận hoặc chọn lại Phường/Xã thủ công.`,
  };
}

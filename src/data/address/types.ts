// src/data/address/types.ts
// Mộc Ngôn Hương — Vietnam 2026 Administrative Structure Types
// Authority: Decision 19/2025/QĐ-TTg (Effective 01/07/2025)

export type ProvinceType = 'Thành phố' | 'Tỉnh';
export type CommuneType = 'Phường' | 'Xã' | 'Đặc khu';

export interface Province {
  code: string; // 2-digit code with leading zero, e.g. "01", "79"
  name: string; // e.g. "Hà Nội", "TP. Hồ Chí Minh"
  fullName: string; // e.g. "Thành phố Hà Nội", "Tỉnh Thái Nguyên"
  type: ProvinceType;
  communeCount: number;
}

export interface Commune {
  code: string; // 5-digit code with leading zeros, e.g. "00004"
  name: string; // e.g. "Phường Ba Đình", "Xã Tân Cương"
  type: CommuneType;
  provinceCode: string; // 2-digit parent code
}

export interface AddressCatalogMeta {
  decision: string;
  title: string;
  effectiveDate: string;
  datasetVersion: string;
  lastUpdated: string;
  baseline: {
    provincesCount: number;
    communesCount: number;
    communeTypes: {
      xa: number;
      phuong: number;
      dacKhu: number;
    };
  };
  source: string;
}

export interface ValidatedDeliveryAddress {
  address: string; // House number, street, hamlet, village
  provinceCode: string;
  provinceName: string;
  communeCode: string;
  communeName: string;
  formattedAddress: string;
  addressSchemaVersion: '2';
}

export interface LegacyAddressInput {
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
}

export interface ConversionProposal {
  isUnambiguous: boolean;
  originalAddress: string;
  proposedProvinceCode?: string;
  proposedProvinceName?: string;
  proposedCommuneCode?: string;
  proposedCommuneName?: string;
  proposedFormattedAddress?: string;
  note?: string;
}


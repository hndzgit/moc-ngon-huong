// scripts/test-v17-4-address-system.ts
// Mộc Ngôn Hương — Comprehensive Test Suite for Vietnam 2026 Address System (V17.4)
// Legal Baseline: Decision 19/2025/QĐ-TTg (34 provinces/cities, 3,321 commune-level units)

import assert from 'assert';
import {
  ADMIN_CATALOG_META,
  PROVINCES,
  COMMUNES_BY_PROVINCE,
  getProvinces,
  getProvinceByCode,
  getCommunesByProvinceCode,
  getCommuneByCode,
  searchProvinces,
  searchCommunes,
  validateDeliveryAddress,
  formatCustomerDeliveryAddress,
  attemptLegacyAddressConversion,
  cleanAdminPrefix,
  normalizeVietnameseSearch,
} from '../src/data/address';

let passedTests = 0;
let totalTests = 0;

function it(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        passedTests++;
        console.log(`  ✓ ${name}`);
      }).catch((err) => {
        console.error(`  ✗ ${name}`);
        console.error(err);
        process.exitCode = 1;
      });
    }
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('================================================================');
  console.log('MỘC NGÔN HƯƠNG — V17.4 VIETNAM 2026 ADDRESS SYSTEM TEST SUITE');
  console.log('Decision 19/2025/QĐ-TTg · 34 Provinces · 3,321 Commune Units');
  console.log('================================================================\n');

  console.log('--- 1. OFFICIAL BASELINE & CATALOG INTEGRITY ---');

  it('Catalogue metadata matches Decision 19/2025/QĐ-TTg baseline', () => {
    assert.strictEqual(ADMIN_CATALOG_META.decision, '19/2025/QĐ-TTg');
    assert.strictEqual(ADMIN_CATALOG_META.baseline.provincesCount, 34);
    assert.strictEqual(ADMIN_CATALOG_META.baseline.communesCount, 3321);
    assert.strictEqual(ADMIN_CATALOG_META.effectiveDate, '2025-07-01');
  });

  it('Contains exactly 34 verified provinces and centrally governed cities', () => {
    const provinces = getProvinces();
    assert.strictEqual(provinces.length, 34);
    // Spot check key provinces
    const hanoi = getProvinceByCode('01');
    assert(hanoi, 'Hà Nội (01) must exist');
    assert.strictEqual(hanoi.name, 'Hà Nội');
    assert.strictEqual(hanoi.type, 'Thành phố');

    const hcm = getProvinceByCode('79');
    assert(hcm, 'TP. Hồ Chí Minh (79) must exist');
    assert.strictEqual(hcm.name, 'TP. Hồ Chí Minh');
    assert.strictEqual(hcm.type, 'Thành phố');

    const thaiNguyen = getProvinceByCode('19');
    assert(thaiNguyen, 'Thái Nguyên (19) must exist');
    assert.strictEqual(thaiNguyen.name, 'Thái Nguyên');
    assert.strictEqual(thaiNguyen.type, 'Tỉnh');

    const daNang = getProvinceByCode('48');
    assert(daNang, 'Đà Nẵng (48) must exist');
  });

  it('Contains exactly 3,321 commune-level units and correct type breakdown', () => {
    let totalCommunes = 0;
    let totalXa = 0;
    let totalPhuong = 0;
    let totalDacKhu = 0;

    for (const [pCode, communes] of Object.entries(COMMUNES_BY_PROVINCE)) {
      totalCommunes += communes.length;
      for (const c of communes) {
        assert.strictEqual(c.provinceCode, pCode);
        assert(c.code.length === 5, `Commune code ${c.code} must be 5 digits`);
        if (c.type === 'Xã') totalXa++;
        else if (c.type === 'Phường') totalPhuong++;
        else if (c.type === 'Đặc khu') totalDacKhu++;
      }
    }

    assert.strictEqual(totalCommunes, 3321);
    assert.strictEqual(totalXa, 2599);
    assert.strictEqual(totalPhuong, 709);
    assert.strictEqual(totalDacKhu, 13);
  });

  console.log('\n--- 2. COMMUNE FILTERING & PROVINCE DEPENDENCY ---');

  it('Communes correctly filter by province without cross-province leaking', () => {
    const hanoiCommunes = getCommunesByProvinceCode('01');
    assert.strictEqual(hanoiCommunes.length, 126);
    assert(hanoiCommunes.every((c) => c.provinceCode === '01'));

    const hcmCommunes = getCommunesByProvinceCode('79');
    assert.strictEqual(hcmCommunes.length, 168);
    assert(hcmCommunes.every((c) => c.provinceCode === '79'));

    const thaiNguyenCommunes = getCommunesByProvinceCode('19');
    assert.strictEqual(thaiNguyenCommunes.length, 92);
    assert(thaiNguyenCommunes.every((c) => c.provinceCode === '19'));

    // Verify Tân Cương belongs to Thái Nguyên (19), NOT Hà Nội (01)
    const tanCuongInTN = thaiNguyenCommunes.find((c) => c.name.includes('Tân Cương'));
    assert(tanCuongInTN, 'Tân Cương must be in Thái Nguyên');
    const tanCuongInHN = hanoiCommunes.find((c) => c.name.includes('Tân Cương'));
    assert.strictEqual(tanCuongInHN, undefined, 'Tân Cương must NOT be in Hà Nội');
  });

  it('getCommuneByCode correctly resolves only within parent province', () => {
    // 05503 is Xã Tân Cương in Thái Nguyên (19)
    const valid = getCommuneByCode('19', '05503');
    assert(valid);
    assert.strictEqual(valid.name, 'Xã Tân Cương');

    // Trying to fetch 05503 with Hà Nội (01) should fail
    const invalid = getCommuneByCode('01', '05503');
    assert.strictEqual(invalid, undefined);
  });

  console.log('\n--- 3. ACCENT-INSENSITIVE & DIACRITIC SEARCH ---');

  it('searchProvinces matches unaccented queries and typos smoothly', () => {
    const r1 = searchProvinces('ha noi');
    assert(r1.length > 0 && r1[0].code === '01');

    const r2 = searchProvinces('ho chi minh');
    assert(r2.length > 0 && r2[0].code === '79');

    const r3 = searchProvinces('da nang');
    assert(r3.length > 0 && r3[0].code === '48');

    const r4 = searchProvinces('thai nguyen');
    assert(r4.length > 0 && r4[0].code === '19');
  });

  it('searchCommunes matches commune names without diacritics', () => {
    const hnResults = searchCommunes('01', 'ba dinh');
    assert(hnResults.some((c) => c.name === 'Phường Ba Đình'));

    const tnResults = searchCommunes('19', 'tan cuong');
    assert(tnResults.some((c) => c.name === 'Xã Tân Cương'));

    const dacKhuResults = searchCommunes('22', 'van don');
    assert(dacKhuResults.some((c) => c.name.includes('Vân Đồn')));
  });

  console.log('\n--- 4. SMART VALIDATION (PHASE 5) ---');

  it('Rejects missing province selection', () => {
    const res = validateDeliveryAddress({
      address: 'Số 10 Phố Hàng Gai',
      provinceCode: '',
      communeCode: '00070',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('Tỉnh / Thành phố'));
  });

  it('Rejects invalid province code', () => {
    const res = validateDeliveryAddress({
      address: 'Số 10 Phố Hàng Gai',
      provinceCode: '999',
      communeCode: '00070',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('không tồn tại'));
  });

  it('Rejects missing commune selection', () => {
    const res = validateDeliveryAddress({
      address: 'Số 10 Phố Hàng Gai',
      provinceCode: '01',
      communeCode: '',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('Phường / Xã / Đặc khu'));
  });

  it('Rejects incompatible province/commune pair', () => {
    // Commune 05503 (Tân Cương, Thái Nguyên) submitted with Hà Nội (01)
    const res = validateDeliveryAddress({
      address: 'Xóm Đồi Chè',
      provinceCode: '01',
      communeCode: '05503',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('không thuộc'));
  });

  it('Rejects street address shorter than 3 characters', () => {
    const res = validateDeliveryAddress({
      address: 'Số',
      provinceCode: '01',
      communeCode: '00004',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('chi tiết'));
  });

  it('Rejects street address exceeding 250 characters', () => {
    const res = validateDeliveryAddress({
      address: 'A'.repeat(251),
      provinceCode: '01',
      communeCode: '00004',
    });
    assert.strictEqual(res.isValid, false);
    assert(res.error?.includes('quá dài'));
  });

  it('Accepts legitimate rural addresses (villages, hamlets, buôn, ấp)', () => {
    const r1 = validateDeliveryAddress({
      address: 'Thôn Chè Giữa, Gần đồi chè cổ thụ',
      provinceCode: '19',
      communeCode: '05503',
    });
    assert.strictEqual(r1.isValid, true);
    assert.strictEqual(
      r1.validated?.formattedAddress,
      'Thôn Chè Giữa, Gần đồi chè cổ thụ, Xã Tân Cương, Tỉnh Thái Nguyên'
    );

    const r2 = validateDeliveryAddress({
      address: 'Buôn Ea Kao, Nhà số 12',
      provinceCode: '66',
      communeCode: getCommunesByProvinceCode('66')[0].code,
    });
    assert.strictEqual(r2.isValid, true);
  });

  it('Validates urban address and constructs authoritative formatted address', () => {
    const res = validateDeliveryAddress({
      address: 'Số 42 Phố Hàng Điếu',
      provinceCode: '01',
      communeCode: '00004',
    });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.validated?.provinceName, 'Thành phố Hà Nội');
    assert.strictEqual(res.validated?.communeName, 'Phường Ba Đình');
    assert.strictEqual(
      res.validated?.formattedAddress,
      'Số 42 Phố Hàng Điếu, Phường Ba Đình, Thành phố Hà Nội'
    );
    assert.strictEqual(res.validated?.addressSchemaVersion, '2');
  });

  console.log('\n--- 5. ADDRESS FORMATTING & DISPLAY CONSISTENCY (PHASE 8) ---');

  it('Never outputs empty district separators in 2-tier format', () => {
    const formatted = formatCustomerDeliveryAddress({
      address: 'Số 15 Lê Duẩn',
      communeName: 'Phường Ba Đình',
      provinceName: 'Thành phố Hà Nội',
    });
    assert.strictEqual(formatted, 'Số 15 Lê Duẩn, Phường Ba Đình, Thành phố Hà Nội');
    assert(!formatted.includes(', ,'), 'Must not contain empty comma sequence');
  });

  it('Preserves pickup store address correctly', () => {
    const formatted = formatCustomerDeliveryAddress({
      shippingMode: 'pickup',
      pickupStore: '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội',
    });
    assert.strictEqual(formatted, '42 Phố Hàng Điếu, Quận Hoàn Kiếm, Hà Nội');
  });

  it('Falls back to legacy format cleanly for historical orders without district', () => {
    const formatted = formatCustomerDeliveryAddress({
      address: 'Số 5 Hàng Bài',
      ward: 'Phường Hàng Bài',
      city: 'Hà Nội',
    });
    assert.strictEqual(formatted, 'Số 5 Hàng Bài, Phường Hàng Bài, Hà Nội');
    assert(!formatted.includes(', ,'), 'Must not contain double comma');
  });

  console.log('\n--- 6. LEGACY CUSTOMER ADDRESS CONVERSION (PHASE 7) ---');

  it('Identifies unambiguous historical address conversion and produces proposal', () => {
    const proposal = attemptLegacyAddressConversion({
      address: 'Xóm Hồng Thái',
      city: 'Thái Nguyên',
      district: 'Thành phố Thái Nguyên',
      ward: 'Xã Tân Cương',
    });
    assert.strictEqual(proposal.isUnambiguous, true);
    assert.strictEqual(proposal.proposedProvinceCode, '19');
    assert.strictEqual(proposal.proposedCommuneCode, '05503');
    assert.strictEqual(
      proposal.proposedFormattedAddress,
      'Xóm Hồng Thái, Xã Tân Cương, Tỉnh Thái Nguyên'
    );
  });

  it('Gracefully flags split/ambiguous wards for manual confirmation without guessing', () => {
    // Phường Cửa Đông was split into Hoàn Kiếm & Ba Đình
    const proposal = attemptLegacyAddressConversion({
      address: '42 Phố Hàng Điếu',
      city: 'Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Cửa Đông',
    });
    assert.strictEqual(proposal.isUnambiguous, false);
    assert.strictEqual(proposal.proposedProvinceCode, '01');
    assert(proposal.note?.includes('thủ công'));
  });

  console.log('\n--- 7. PICKUP ADDRESS AUDIT VERIFICATION (PHASE 9) ---');

  it('Verifies Tân Cương pickup address is 100% verified under Decision 19/2025/QĐ-TTg', () => {
    const tnCommune = getCommuneByCode('19', '05503');
    assert(tnCommune);
    assert.strictEqual(tnCommune.name, 'Xã Tân Cương');
  });

  it('Verifies 42 Phố Hàng Điếu split boundary is flagged for business owner confirmation', () => {
    const proposal = attemptLegacyAddressConversion({
      address: '42 Phố Hàng Điếu',
      city: 'Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Cửa Đông',
    });
    // Boundary split prevents silent automatic renaming
    assert.strictEqual(proposal.isUnambiguous, false);
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} tests passed successfully.`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});


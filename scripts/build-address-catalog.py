# scripts/build-address-catalog.py
# Mộc Ngôn Hương — Official Vietnam 2026 Administrative Data Generator
# Baseline: Decision 19/2025/QĐ-TTg (34 provinces/cities, 3,321 commune-level units)

import urllib.request
import json
import os

DEST_DIR = "src/data/address"
os.makedirs(DEST_DIR, exist_ok=True)

def clean_admin_prefix(s: str) -> str:
    s = s.strip().lower()
    for prefix in [
        "thành phố ", "tp. ", "tp ", "tỉnh ", "quận ", "huyện ",
        "thị xã ", "tx. ", "tx ", "phường ", "xã ", "thị trấn ", "tt. ", "tt "
    ]:
        if s.startswith(prefix):
            s = s[len(prefix):].strip()
    return s

print("1. Fetching provinces (34 provinces)...")
tinh_url = "https://raw.githubusercontent.com/HuyChuong/vietnam-administrative-units/main/data/tinh.json"
tinh_resp = urllib.request.urlopen(tinh_url, timeout=15)
tinh_data = json.loads(tinh_resp.read().decode("utf-8"))

provinces = []
for p in tinh_data["dong"]:
    provinces.append({
        "code": str(p["ma_tinh"]).zfill(2),
        "name": p["ten"],
        "fullName": p["ten_day_du"],
        "type": p["loai"],
        "communeCount": p["so_don_vi_cap_xa"]
    })

assert len(provinces) == 34, f"Expected 34 provinces, got {len(provinces)}"
print(f"-> Verified {len(provinces)} provinces.")

print("2. Fetching communes (3,321 communes)...")
xa_url = "https://raw.githubusercontent.com/HuyChuong/vietnam-administrative-units/main/data/xa.json"
xa_resp = urllib.request.urlopen(xa_url, timeout=15)
xa_data = json.loads(xa_resp.read().decode("utf-8"))

communes_by_province = {p["code"]: [] for p in provinces}
total_communes = 0

for x in xa_data["dong"]:
    p_code = str(x["ma_tinh"]).zfill(2)
    c_code = str(x["ma_xa"]).zfill(5)
    communes_by_province[p_code].append({
        "code": c_code,
        "name": x["ten"],
        "type": x["loai"],
        "provinceCode": p_code
    })
    total_communes += 1

assert total_communes == 3321, f"Expected 3321 communes, got {total_communes}"
print(f"-> Verified {total_communes} communes across 34 provinces.")

print("3. Fetching legacy mappings (xa-cu-moi)...")
cu_moi_url = "https://raw.githubusercontent.com/HuyChuong/vietnam-administrative-units/main/data/xa-cu-moi.json"
cu_moi_resp = urllib.request.urlopen(cu_moi_url, timeout=20)
cu_moi_data = json.loads(cu_moi_resp.read().decode("utf-8"))

# Store unambiguous mappings (pham_vi == "toàn bộ")
# Map: normalized "tinh|huyen|xa" -> [newProvinceCode, newCommuneCode]
unambiguous_mappings = {}
for r in cu_moi_data["dong"]:
    if r.get("pham_vi") == "toàn bộ":
        tinh_cu = clean_admin_prefix(r["tinh_cu"])
        huyen_cu = clean_admin_prefix(r["quan_huyen_cu"])
        xa_cu = clean_admin_prefix(r["ten_xa_cu"])
        key = tinh_cu + "|" + huyen_cu + "|" + xa_cu
        p_code = str(r["ma_tinh"]).zfill(2)
        c_code = str(r["ma_xa_moi"]).zfill(5)
        unambiguous_mappings[key] = [p_code, c_code]

print(f"-> Indexed {len(unambiguous_mappings)} unambiguous legacy mappings in compact representation.")

meta = {
    "decision": "19/2025/QĐ-TTg",
    "title": "Bảng danh mục và mã số các đơn vị hành chính Việt Nam",
    "effectiveDate": "2025-07-01",
    "datasetVersion": "2026.11",
    "lastUpdated": "2026-11-02",
    "baseline": {
        "provincesCount": 34,
        "communesCount": 3321,
        "communeTypes": {
            "xa": 2599,
            "phuong": 709,
            "dacKhu": 13
        }
    },
    "source": "https://chinhphu.vn/?classid=1&docid=214409&orggroupid=3&pageid=27160"
}

with open(os.path.join(DEST_DIR, "provinces.json"), "w", encoding="utf-8") as f:
    json.dump(provinces, f, ensure_ascii=False, indent=2)

with open(os.path.join(DEST_DIR, "communes.json"), "w", encoding="utf-8") as f:
    json.dump(communes_by_province, f, ensure_ascii=False)

with open(os.path.join(DEST_DIR, "meta.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

with open(os.path.join(DEST_DIR, "legacyMappings.json"), "w", encoding="utf-8") as f:
    json.dump(unambiguous_mappings, f, ensure_ascii=False)

compact_path = os.path.join(DEST_DIR, "legacyMappingsCompact.json")
if os.path.exists(compact_path):
    os.remove(compact_path)

print("✓ All address catalog files successfully generated in " + DEST_DIR)

# Mộc Ngôn Hương — Product SKU Business Reference

This static document preserves the business team's full 9-code reference table for internal commercial tracking.

## 1. Authorized Website Sellable Products (5 Active SKUs)

Only the following five products are approved for online sale and exist in the operational website runtime catalog (`src/data/products.ts` and `api/orders.ts`):

| Product ID | Product Name | Specification | Price (VND) | Official SKU | Storefront Status |
|---|---|---|---:|---|---|
| `buoi-an` | AN — Trà Hương Hoa Bưởi | Hộp quà đôi 200g | 289,000 | `MNH-A02` | Active / Published |
| `nhai-thuong` | THƯƠNG — Trà Hương Hoa Nhài | Hộp quà đôi 200g | 289,000 | `MNH-T02` | Active / Published |
| `soi-cam` | CẢM — Trà Hương Hoa Sói | Hộp quà đôi 200g | 289,000 | `MNH-C02` | Active / Published |
| `com-nho` | NHỚ — Trà Hương Cốm | Hộp quà đôi 200g | 289,000 | `MNH-N02` | Active / Published |
| `hop-qua-tam-y` | TÂM Ý — Hộp Quà Trà Đa Hương | Combo | 399,000 | `MNH-TY` | Active / Published |

## 2. Excluded External Reference Codes (Not Sold Online)

The following four 100g codes from the business team's external SKU table are intentionally excluded from the website catalog, search, cart, checkout, and API validation:

| Product Reference | Reference SKU | Reference Price (VND) | Status on Website |
|---|---|---:|---|
| AN 100g | `MNH-A01` | 100,000 | Excluded (Not available online) |
| THƯƠNG 100g | `MNH-T01` | 100,000 | Excluded (Not available online) |
| CẢM 100g | `MNH-C01` | 100,000 | Excluded (Not available online) |
| NHỚ 100g | `MNH-N01` | 100,000 | Excluded (Not available online) |

## 3. Order Code System vs Product SKU System

- **Product SKUs (`MNH-A02`, `MNH-T02`, `MNH-C02`, `MNH-N02`, `MNH-TY`)** identify products/variants across cart, checkout, order snapshots, emails, and Admin inspection.
- **Customer Order Codes (`MNH000000`–`MNH999999`)** identify individual customer orders sequentially via the atomic Firestore counter and serve as the exclusive VietQR transfer reference (`transferContent`).

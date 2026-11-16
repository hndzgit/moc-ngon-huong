# Mộc Ngôn Hương — Kế Hoạch Nâng Cấp Kiến Trúc SEO Đa Ngôn Ngữ Tương Lai (Future Migration Plan)

> **Trạng thái:** TÀI LIỆU ĐỊNH HƯỚNG TƯƠNG LAI — **KHÔNG TRIỂN KHAI TRONG V17.0.2**  
> **Bối cảnh hiện tại:** V17.0.2 sử dụng Vite SPA + `HashRouter` (`/#/...`) nên các trang con tiếng Việt và tiếng Anh đều dùng chung một file `index.html` tĩnh ở root (`/`). Các công cụ tìm kiếm (Googlebot, Bingbot) và bộ cào link mạng xã hội (Facebook/Zalo/LinkedIn crawler không chạy đầy đủ JS hoặc bỏ qua fragment `#`) không thể index độc lập từng trang con `/#/san-pham/...`.

---

## 1. Cấu trúc URL khuyến nghị (Recommended URL Structure)
Sử dụng **path-based routing** chuẩn REST/SEO với tiền tố `/en/` cho tiếng Anh và giữ nguyên root sạch cho tiếng Việt (mặc định):
- Tiếng Việt (mặc định): `/`
- Tiếng Anh: `/en`

## 2. Bảo toàn toàn bộ URL tiếng Việt hiện có
- `/` (Trang chủ)
- `/cau-chuyen`
- `/san-pham`
- `/san-pham/:id` (ví dụ: `/san-pham/buoi-an`, `/san-pham/nhai-thuong`, `/san-pham/soi-cam`, `/san-pham/com-nho`, `/san-pham/hop-qua-tam-y`)
- `/chon-qua` (kèm query `?cam-xuc=...&buoc=...`)
- `/doanh-nghiep`
- `/lien-he`
- `/thanh-toan`, `/tai-khoan`, `/admin` (`noindex, nofollow`)

## 3. URL sản phẩm & trang con tiếng Anh (English Product & Storefront URLs)
- `/en` (English Home)
- `/en/story`
- `/en/products`
- `/en/products/:id` (hoặc giữ slug đồng nhất `/en/san-pham/:id` với canonical riêng; khuyến nghị slug tiếng Anh sạch `/en/products/buoi-an`, `/en/products/nhai-thuong`, `/en/products/soi-cam`, `/en/products/com-nho`, `/en/products/hop-qua-tam-y` đi kèm bảng map 1-1 slug song ngữ)
- `/en/gift-journey`, `/en/corporate-gifting`, `/en/contact`

## 4. Tương thích ngược liên kết Hash cũ (Legacy Hash-Link Compatibility)
Mọi mã QR in trên bao bì hộp trà, bookmark người dùng và link trong email cũ vẫn dùng `#/...`:
- Khi trình duyệt tải `/` kèm `window.location.hash` bắt đầu bằng `#/...` (ví dụ `/#/san-pham/buoi-an?lang=en`), bootstrap client đọc `hash`, map sang path chuẩn mới (`/en/products/buoi-an`) bằng `history.replaceState` hoặc router redirect ngay ở lần render đầu tiên — **tuyệt đối không làm gãy QR đã in**.

## 5. Deep Links & Tham số chia sẻ
- Hỗ trợ nhận `?lang=en` / `?lang=vi` trên URL cũ và điều hướng sang `/en/...` hoặc `/...` tương ứng bằng HTTP `301` (hoặc client canonical replace nếu có hash).
- Giữ nguyên tham số chiến dịch `?utm_*` và `?figma-qa=1`.

## 6. Liên kết khôi phục đơn hàng (Guest Order Recovery Links)
- Các email cũ đã gửi link dạng `/#/thanh-toan?orderId=MNH...&token=...&lang=en`.
- Đường dẫn mới chuẩn hóa: `/thanh-toan?orderId=...&token=...` (VI) và `/en/checkout?orderId=...&token=...` (EN).
- Cần giữ handler fallback ở client tại `/` để nếu người dùng mở lại email cũ chứa `#/thanh-toan?orderId=...&token=...`, tham số `orderId` và `token` được chuyển tiếp nguyên vẹn vào `CheckoutPage` mà không bị mất token.
- Các trang `/thanh-toan`, `/en/checkout`, `/tai-khoan`, `/en/account` phải gắn `<meta name="robots" content="noindex, nofollow" />`.

## 7. Liên kết xác thực Firebase Authentication Callbacks
- Firebase Action Links sử dụng query params trên root: `/?mode=resetPassword&oobCode=...` hoặc `/?mode=verifyEmail&oobCode=...` (kèm `&lang=en` hoặc `continueUrl`).
- Vercel rewrite rule và HistoryRouter cần **ưu tiên giữ query `mode`, `oobCode`, `apiKey`, `continueUrl`** tại `/` để chuyển tới `AuthPage` đặt lại mật khẩu / xác minh email thành công trước khi xử lý redirect ngôn ngữ.

## 8. Quy tắc chuyển hướng (Redirect Requirements)
- HTTP `301` (Permanent): `/?lang=en` (khi không chứa `oobCode`/`mode` và không phục vụ hash client) -> `/en` (chú ý xử lý hash ở client vì server không nhìn thấy `#`).
- HTTP `301`: `/?lang=vi` -> `/` (xóa query dư).
- Không redirect tự động dựa trên `Accept-Language` ép buộc ở HTTP root nếu làm mất khả năng Googlebot US crawl bản mặc định `x-default` (`/`).

## 9. Bản đồ Canonical & Hreflang từng trang (Per-Page Mapping)
Mỗi cặp trang VI ↔ EN công khai xuất HTML riêng với đúng bộ thẻ:
- Trang `/san-pham/buoi-an`:
  - `<link rel="canonical" href="https://mocngonhuong.com/san-pham/buoi-an" />`
  - `<link rel="alternate" hreflang="vi" href="https://mocngonhuong.com/san-pham/buoi-an" />`
  - `<link rel="alternate" hreflang="en" href="https://mocngonhuong.com/en/products/buoi-an" />`
  - `<link rel="alternate" hreflang="x-default" href="https://mocngonhuong.com/san-pham/buoi-an" />`
- Trang `/en/products/buoi-an`: `<canonical>` trỏ chính nó, cùng 3 thẻ `hreflang` đối xứng 2 chiều, `<html lang="en">`, và thẻ `og:title`/`og:description`/`og:image` tĩnh ngay trong HTML trả về HTTP `200`.

## 10. Cấu hình Vercel (`vercel.json` / Build Pipeline)
- Hai lựa chọn an toàn trên nền Vite hiện tại (không cần viết lại React codebase):
  1. **Static Pre-rendering (SSG lúc build)** cho ~16 route tĩnh (7 trang × 2 ngôn ngữ + 5 sản phẩm × 2 ngôn ngữ) xuất thẳng các file `dist/san-pham/buoi-an/index.html`, `dist/en/products/buoi-an/index.html` kèm meta tags tĩnh + Hydration React 19, cộng rewrite fallback về `/index.html` trong `vercel.json` cho các route động (`/thanh-toan`, `/tai-khoan`, `/admin`).
  2. Hoặc **Vercel Edge Middleware / Serverless HTML injector** đọc URL path (`/en/products/...`) và inject `<html lang>`, `<title>`, `<meta description>`, `<canonical>`, `hreflang`, `og:*` trước khi trả `index.html`.
- Loại trừ `/api/(.*)` khỏi mọi SPA rewrite.

## 11. Tạo Sitemap Tự Động (Sitemap Generation)
- Sinh `dist/sitemap.xml` tại bước `postbuild` từ danh sách route tĩnh + mảng `PRODUCTS` (`src/data/products.ts`), liệt kê đầy đủ từng URL HTTP 200 VI & EN kèm `<xhtml:link rel="alternate" hreflang="..." />`.
- Loại bỏ hoàn toàn `/admin`, `/tai-khoan`, `/thanh-toan`, `/en/checkout`, `/en/account` khỏi sitemap.

## 12. Rủi ro di trú (Migration Risks)
- **Mất tương thích QR/link cũ:** nếu rewrite Vercel chuyển thẳng mọi request sang 404 hoặc đổi path làm gãy `#/...` trên QR đã in.
- **Đứt gãy Auth/Order Recovery Callback:** nếu Edge/Middleware strip nhầm query params `oobCode`, `mode`, `orderId`, hoặc `token`.
- **Duplicate Content / Canonical loop:** nếu vừa hỗ trợ `/en/products/buoi-an` vừa giữ `?lang=en` mà quên canonical hóa hoặc gán `hreflang` không đối xứng.
- **Hydration mismatch:** nếu React client render ngôn ngữ khác HTML pre-rendered trước khi `i18next` đồng bộ xong.

## 13. Chiến lược Rollback (Rollback Strategy)
1. Tạo nhánh backup Git `backup/pre-seo-history-router` trước khi hợp nhất.
2. Cấu hình Pre-rendering/Edge rewrites có thể bật/tắt tức thì qua feature flag hoặc revert `vercel.json` + build script.
3. Trong trường hợp phát sinh lỗi điều hướng Auth callback, Guest Recovery hoặc tăng 404 sau deploy: thực hiện **Vercel Instant Rollback** về deployment V17.0.2 ổn định trước đó trên dashboard/CLI (`vercel rollback`), thời gian khôi phục < 30 giây mà không ảnh hưởng dữ liệu Firestore hay đơn hàng.

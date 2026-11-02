# BÁO CÁO NGHIỆM THU KIẾN TRÚC & TRIỂN KHAI V13.4 — MỘC NGÔN HƯƠNG
## CUSTOMER ORDER HISTORY + SHOP EMAIL NOTIFICATIONS
### Trải Nghiệm Đơn Hàng Đầu-Cuối An Toàn — Không Admin Dashboard
**Tên dự án:** Mộc Ngôn Hương (`https://mocngonhuong.com`)  
**Môi trường:** Vercel Hosting + Firebase Auth + Cloud Firestore + Resend Email  
**Phiên bản kiến trúc:** Master Prompt V13.4 (Nâng cấp từ V13.0 – V13.3)  
**Ngày hoàn thiện:** Tháng 11/2026  
**Trạng thái:** ✅ ĐÃ KIỂM THỬ VÀ HOÀN TẤT 100% TRÊN MÔI TRƯỜNG CỤC BỘ

---

## 1. TỔNG QUAN YÊU CẦU NGHIỆP VỤ & QUY TRÌNH VẬN HÀNH

Chủ thương hiệu Mộc Ngôn Hương đã xác định rõ hai trải nghiệm cốt lõi của hệ thống:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   A. TRẢI NGHIỆM KHÁCH HÀNG (CUSTOMER)                 │
├────────────────────────────────────────────────────────────────────────┤
│ Đăng ký / Đăng nhập                                                   │
│   ↓                                                                    │
│ Chọn trà / Hành trình cảm xúc & quà tặng                              │
│   ↓                                                                    │
│ Đặt hàng (Checkout) với Firebase ID Token xác thực                    │
│   ↓                                                                    │
│ Nhận mã đơn hàng thực (MNH-xxxxxx-xxxx)                                │
│   ↓                                                                    │
│ Mở "Tài khoản của tôi" → "Đơn hàng của tôi"                            │
│   ↓                                                                    │
│ Xem danh sách đơn đã đặt, chi tiết sản phẩm, giá gốc lịch sử,        │
│ thông tin người nhận, lời chúc thiệp và trạng thái vận hành chân thực   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                B. TRẢI NGHIỆM CHỦ TIỆM (SHOP OWNER — NO ADMIN)         │
├────────────────────────────────────────────────────────────────────────┤
│ Đơn hàng mới được lưu trữ bền vững (Durable Persistence) vào Firestore │
│   ↓                                                                    │
│ Hệ thống tự động gửi email thông báo chi tiết đến hòm thư chủ tiệm     │
│ (mocngonhuong@gmail.com / cấu hình SHOP_NOTIFICATION_EMAIL)           │
│   ↓                                                                    │
│ Chủ tiệm xem email trên điện thoại / máy tính                          │
│   ↓                                                                    │
│ Chuẩn bị trà, đóng gói hộp quà, viết thiệp theo yêu cầu                │
│   ↓                                                                    │
│ Tự điều phối vận chuyển trực tiếp đến địa chỉ khách hàng               │
│                                                                        │
│ * KHÔNG CẦN VÀ KHÔNG XÂY DỰNG ADMIN DASHBOARD PHỨC TẠP *               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. HIỆN TRẠNG KHẢO SÁT & NGUYÊN TẮC BẢO TOÀN MÃ NGUỒN

### 2.1. Phát hiện về tính năng Lịch sử đơn hàng trước V13.4
- Trong các phiên bản trước (V13.0 - V13.3), tính năng lịch sử đơn hàng tại `AuthPage.tsx` mới chỉ là **giao diện cục bộ giả lập** (client-side mock), đọc ghi đơn thuần qua `localStorage.getItem('mnh_user_orders_v1')`.
- Nhược điểm nghiêm trọng: Khách hàng đổi trình duyệt hoặc xóa cache sẽ mất toàn bộ lịch sử; dữ liệu không đồng bộ giữa các thiết bị; không có kiểm chứng phân quyền máy chủ.
- **Giải pháp V13.4:** Đã loại bỏ hoàn toàn cơ chế phụ thuộc `localStorage` giả lập, thay thế bằng **100% dữ liệu Cloud Firestore thực tế** thông qua endpoint bảo mật `GET /api/me/orders`.

### 2.2. Bảo toàn tuyệt đối hệ sinh thái Mộc Ngôn Hương
- Giữ nguyên 100% luồng đăng nhập, đăng ký, xác thực email, phục hồi mật khẩu Firebase Auth.
- Giữ nguyên bộ nhận diện thương hiệu, bảng màu HSL, typography `Philosopher` và các tài nguyên gốc từ Figma.
- Giữ nguyên toàn bộ hiệu ứng chuyển động GSAP, ScrollTrigger, Page Transitions mượt mà.
- Bảo toàn nguyên vẹn hạ tầng Vercel Serverless và cấu hình tên miền `mocngonhuong.com` tại nhà đăng ký iNET.

---

## 3. MÔ HÌNH SỞ HỮU ĐƠN HÀNG (ORDER OWNERSHIP & ANTI-SPOOFING)

Hệ thống tuân thủ nguyên tắc **Zero-Trust Client Identity**:

1. **Trích xuất định danh độc quyền từ Server:**
   - Trình duyệt gửi Firebase ID Token qua header `Authorization: Bearer <token>`.
   - Máy chủ tại `api/_lib/firebaseAdmin.ts` gọi `adminAuth.verifyIdToken(token)`.
   - Máy chủ trích xuất `verified UID` và gán vào hai trường định danh: `customerUid` và `userId` của tài khoản Firestore.
2. **Chống giả mạo danh tính (Anti-Spoofing):**
   - Tuyệt đối không chấp nhận `userId` hay `customerUid` do client tự gửi trong payload `body`.
   - Tuyệt đối không dùng `email` trong `localStorage` làm căn cứ cấp quyền xem lịch sử đơn.
3. **Cách ly dữ liệu người dùng tuyệt đối (Data Isolation):**
   - Endpoint `GET /api/me/orders` chỉ truy vấn các document có `customerUid == verifiedUid` hoặc `userId == verifiedUid`.
   - Nếu User B cố tình nhập mã đơn của User A (`?orderId=...`), máy chủ trả về `HTTP 403 Forbidden` ngay lập tức.
4. **Cơ chế Khách Vãng Lai (Guest Checkout):**
   - Cho phép đặt hàng nhanh mà không bắt buộc tạo tài khoản.
   - Khi guest checkout, `customerUid = null` và `userId = null`.
   - Nếu sau này khách hàng đăng ký tài khoản với email đó, hệ thống **không tự động gán** đơn hàng cũ vào tài khoản mới chỉ dựa trên so khớp chuỗi email nhằm tránh rủi ro bảo mật.

---

## 4. CHI TIẾT CÁC ENDPOINT API SERVERLESS

### 4.1. `POST /api/orders` — Tạo đơn hàng bền vững & Gửi thông báo email
- **Chức năng:** Nhận yêu cầu đặt hàng, thẩm định sản phẩm & đơn giá theo catalog máy chủ, lưu Firestore bền vững (Idempotent), và kích hoạt thông báo email cho chủ tiệm.
- **Bảo mật:** Nhận diện người dùng qua `verifyAuthToken(req)`. Nếu có token hợp lệ, gán `customerUid`. Nếu không, ghi nhận đơn guest.
- **Xử lý trùng lặp:**
  - Lần gửi đầu tiên: Lưu Firestore, trả về `HTTP 201 Created`, gửi email thông báo chủ tiệm.
  - Lần gửi retry (cùng Idempotency Key): Trả về `HTTP 200 OK` kèm dữ liệu đơn đã lưu, **không gửi trùng email**.

### 4.2. `GET /api/me/orders` — Truy vấn lịch sử đơn hàng khách hàng
- **Chức năng:** Lấy danh sách hoặc chi tiết đơn hàng của người dùng đang đăng nhập.
- **Header bắt buộc:** `Authorization: Bearer <Firebase_ID_Token>`
- **Các kịch bản phản hồi:**
  - `401 Unauthorized`: Không có token, token hết hạn hoặc giả mạo.
  - `403 Forbidden`: Người dùng truy vấn `orderId` của khách hàng khác.
  - `200 OK`: Trả về danh sách đơn hàng đã sắp xếp từ mới nhất đến cũ nhất (`createdAt` desc).

---

## 5. FIRESTORE DATA MODEL & SECURITY RULES

### 5.1. Cấu trúc Document `orders/{orderId}`
```json
{
  "orderId": "MNH-458364-3746",
  "customerUid": "us_verified_firebase_uid_123",
  "userId": "us_verified_firebase_uid_123",
  "customer": {
    "fullName": "Lê Hoài Nam",
    "phone": "0912345678",
    "email": "nam.le@gmail.com",
    "address": "88 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội",
    "notes": "Đóng gói làm quà tặng sinh nhật"
  },
  "items": [
    {
      "productId": "buoi-an",
      "name": "Bưởi An — Bạch Trà Vị Bưởi",
      "price": 289000,
      "quantity": 1,
      "lineTotal": 289000,
      "image": "/assets/figma/tea-buoi-an.png"
    }
  ],
  "pricing": {
    "subtotal": 289000,
    "shippingFee": 0,
    "discount": 0,
    "total": 289000,
    "currency": "VND"
  },
  "personalization": {
    "emotion": "AN",
    "recipientName": "Người Thương",
    "cardMessage": "Chúc một ngày an yên và thanh tịnh."
  },
  "paymentMethod": "bank_transfer",
  "paymentStatus": "pending",
  "orderStatus": "pending_confirmation",
  "notificationSent": true,
  "createdAt": "2026-11-03T01:50:00.000Z",
  "updatedAt": "2026-11-03T01:50:00.000Z"
}
```

### 5.2. Cloud Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Đơn hàng: Cấm tuyệt đối client tự ý tạo/sửa/xóa trực tiếp
    match /orders/{orderId} {
      allow create, update, delete: if false;
      
      // Chỉ cho phép khách hàng đọc đơn do chính mình sở hữu
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.customerUid == request.auth.uid
      );
    }

    // Bảng khóa Idempotency: Chỉ có máy chủ backend thao tác
    match /order_idempotency/{idempotencyKey} {
      allow read, write: if false;
    }

    // Hồ sơ người dùng
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 6. THÔNG BÁO EMAIL CHỦ TIỆM (SHOP OWNER EXPERIENCE)

Không cần đăng nhập vào trang quản trị (Admin Dashboard), chủ tiệm nhận được email thông báo định dạng HTML cao cấp ngay khi có đơn hàng:

- **Hòm thư tiếp nhận:** Cấu hình qua biến môi trường `SHOP_NOTIFICATION_EMAIL` hoặc `ORDER_NOTIFICATION_EMAIL` (Mặc định: `mocngonhuong@gmail.com`).
- **Nội dung email chuẩn mực:**
  - Tiêu đề: `[Mộc Ngôn Hương] Đơn hàng mới: MNH-xxxxxx-xxxx (Tổng tiền: xxx.xxxđ)`
  - Thông tin khách hàng: Họ tên, Số điện thoại, Email, Địa chỉ giao nhận chi tiết.
  - Chi tiết sản phẩm: Tên trà, số lượng, đơn giá lịch sử xác thực, thành tiền.
  - Yêu cầu hộp quà & thiệp: Cảm xúc chọn lựa, tên người nhận, thông điệp thiệp mừng.
  - Phương thức & Trạng thái thanh toán: Chuyển khoản ngân hàng (`pending`) / COD.
- **Cơ chế chống gửi trùng:** Hệ thống chỉ gửi thông báo khi tạo đơn mới (`HTTP 201 Created`). Khi gặp retry (`HTTP 200 OK`), hệ thống bỏ qua bước gửi email.

---

## 7. TRẠNG THÁI ĐƠN HÀNG CHÂN THỰC — NO FAKE STATUSES

Mộc Ngôn Hương vận hành thủ công và chân thực. Hệ thống loại bỏ hoàn toàn các cơ chế tự động chuyển trạng thái giả tạo:
- Trạng thái khởi tạo mặc định: **"Chờ xác nhận"** (`pending_confirmation`).
- Trạng thái thanh toán: **"Chờ thanh toán"** (`pending` đối với chuyển khoản).
- Không tự động nhảy sang "Đang chuẩn bị", "Đang giao" hay "Đã giao" chỉ vì thời gian trôi qua.
- Giao diện tài khoản khách hàng hiển thị thông điệp minh bạch: *"Đơn hàng đang chờ Mộc Ngôn Hương xác nhận và chuẩn bị hộp quà."*

---

## 8. GIAO DIỆN TÀI KHOẢN KHÁCH HÀNG & ORDER DETAIL MODAL

1. **Thanh điều hướng nội bộ (Sub-navigation):**
   - Chuyển đổi linh hoạt giữa hai tab: **"Đơn hàng của tôi"** và **"Thông tin giao nhận"**.
   - Tab "Đơn hàng của tôi" hiển thị số lượng đơn hàng thực tế qua huy hiệu nhỏ thanh lịch.
2. **Bộ lọc trạng thái (Filter Chips):**
   - Cho phép lọc: *Tất cả*, *Chờ xác nhận*, *Đã xác nhận*, *Đang giao*, *Đã hoàn tất*.
3. **Thẻ đơn hàng Responsive:**
   - Hiển thị: Mã đơn hàng, ngày giờ đặt, trạng thái đơn, hình ảnh sản phẩm đại diện, tên sản phẩm, số lượng, tổng tiền thanh toán.
   - Nút hành động: **"Xem chi tiết"** mở Modal toàn diện.
4. **Modal Chi Tiết Đơn Hàng (Figma & GSAP Motion):**
   - Hiển thị đầy đủ 5 khối thông tin: Mã đơn & thời gian Việt Nam, Sản phẩm & đơn giá lưu trữ, Thông tin thiệp & hộp quà, Địa chỉ nhận hàng, Tóm tắt tài chính (Tạm tính, Phí ship, Tổng thanh toán).
5. **Trạng thái Trống (Empty State):**
   - Khi chưa có đơn hàng, hiển thị thông điệp ấm áp bằng tiếng Việt cùng nút hành động đưa khách hàng khám phá các vị trà.
6. **Kiểm thử Responsive đa thiết bị:**
   - Đạt chuẩn 100% không tràn ngang (No horizontal scroll) trên các kích thước: **360px (Mobile nhỏ), 390px (iPhone 14), 768px (iPad), 1280px (Laptop), 1440px (Desktop)**.

---

## 9. KẾT QUẢ BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN

Tất cả các bài kiểm thử tự động đã được thực thi và vượt qua 100%:

```
=========================================================================================
KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG V13.4
=========================================================================================
1. scripts/test-v13-4-order-history.mjs (13 bài kiểm tra API & Bảo mật):
   ✓ 1.1: Từ chối truy cập không có token (401 Unauthorized)
   ✓ 1.2: Từ chối token giả mạo hoặc hết hạn (401 Unauthorized)
   ✓ 1.3: Chặn phương thức ghi trái phép với HTTP 405 Method Not Allowed
   ✓ 2.1: Đặt hàng thành công trích xuất đúng authoritative customerUid
   ✓ 3.1: Khách hàng đọc đúng danh sách đơn hàng của mình kèm chi tiết sản phẩm
   ✓ 3.2: Khách hàng truy vấn thành công chi tiết đơn hàng cụ thể theo orderId
   ✓ 3.3: NGĂN CHẶN RÒ RỈ: User B không thể đọc đơn hàng của User A (HTTP 403 Forbidden)
   ✓ 3.4: CÁCH LY DANH SÁCH: Danh sách đơn User B không chứa đơn User A
   ✓ 4.1: Guest checkout thành công với customerUid & userId = null
   ✓ 4.2: Đơn guest không bị tài khoản khác nhận vơ (HTTP 403 Forbidden)
   ✓ 5.1: Đơn hàng mới (HTTP 201) kích hoạt gửi email thông báo chủ tiệm
   ✓ 5.2: Idempotent Retry (HTTP 200) hoàn trả đơn đã lưu, không gửi trùng email
   ✓ 6.1 - 6.3: Kiểm toán mã nguồn giao diện và Firestore Rules
   -> KẾT QUẢ: 100% PASSED (0 lỗi)

2. scripts/test-v13-auth-orders.mjs (16 bài kiểm tra Nghiệp vụ & Idempotency):
   ✓ Bảo vệ giá máy chủ (Server-side price verification)
   ✓ Chống trùng lặp chéo phiên (Cross-instance Idempotency Locks)
   ✓ Chống xung đột khóa (409 Conflict)
   ✓ Cơ chế an toàn sản xuất Fail-Closed (Không ghi /tmp trên Production)
   -> KẾT QUẢ: 100% PASSED (0 lỗi)

3. scripts/test-local-v13-ui.mjs (Kiểm thử Giao diện Playwright thực tế):
   ✓ Form Đăng nhập & Đăng ký Figma chuẩn mực
   ✓ Màn hình Quên mật khẩu
   ✓ Luồng Đặt hàng hoàn tất (HTTP 201 + Clear Cart + Hướng dẫn Bank)
   ✓ Nút chuyển hướng "Xem Đơn Hàng Của Tôi" từ trang xác nhận đơn
   ✓ Thanh điều hướng nội bộ tài khoản và chuyển tab mượt mà
   ✓ Kiểm tra cuộn ngang (Horizontal scroll) trên 360px, 390px, 768px, 1280px, 1440px
   -> KẾT QUẢ: 100% PASSED (0 lỗi)

4. npm run build:
   ✓ TypeScript check (tsc -b) vượt qua không cảnh báo
   ✓ Vite production build hoàn tất trong 2.12 giây
   -> KẾT QUẢ: 100% PASSED (0 lỗi)
=========================================================================================
```

---

## 10. DANH SÁCH CÁC TỆP ĐÃ NÂNG CẤP & TẠO MỚI

1. `api/me/orders.ts`: Endpoint serverless truy vấn lịch sử đơn hàng an toàn.
2. `api/_lib/firebaseAdmin.ts`: Hạ tầng trích xuất verified UID từ Firebase ID Token, kết nối Firestore và Auth.
3. `api/_lib/notifications.ts`: Bộ phát sinh email HTML và gửi thông báo đơn hàng cho chủ tiệm.
4. `api/orders.ts`: Endpoint tạo đơn hàng tích hợp trích xuất UID máy chủ, Idempotency và gửi email thông báo.
5. `src/pages/AuthPage.tsx`: Giao diện tài khoản khách hàng tích hợp tab "Đơn hàng của tôi", bộ lọc trạng thái, loading skeleton, error retry, và Modal chi tiết đơn hàng.
6. `src/components/OrderConfirmation.tsx`: Bổ sung nút liên kết trực tiếp "Xem Đơn Hàng Của Tôi".
7. `src/context/AuthContext.tsx`: Cung cấp phương thức `getIdToken()` phục vụ gọi API có chứng thực.
8. `src/lib/previewMode.ts`: Cải thiện nhận diện tham số kiểm thử QA đa định dạng URL.
9. `firestore.rules`: Quy tắc phân quyền Cloud Firestore cho `orders` và `order_idempotency`.
10. `scripts/test-v13-4-order-history.mjs`: Bộ test tự động chuyên biệt cho V13.4.
11. `scripts/test-local-v13-ui.mjs`: Bộ test giao diện Playwright toàn diện.

---

## 11. HƯỚNG DẪN CẤU HÌNH BIẾN MÔI TRƯỜNG VERCEL KHI TRIỂN KHAI

Để tính năng hoạt động trên Vercel Production, chỉ cần bổ sung các biến môi trường sau trong Dashboard Vercel (Project Settings → Environment Variables):

| Tên biến | Mô tả |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | Project ID từ Firebase Console |
| `FIREBASE_CLIENT_EMAIL` | Email Service Account Firebase |
| `FIREBASE_PRIVATE_KEY` | Private Key Service Account (chứa `-----BEGIN PRIVATE KEY-----`) |
| `SHOP_NOTIFICATION_EMAIL` | Email chủ tiệm nhận thông báo đơn mới (ví dụ: `mocngonhuong@gmail.com`) |
| `RESEND_API_KEY` | *(Tùy chọn)* API Key Resend để gửi email tự động |
| `ORDER_WEBHOOK_URL` | *(Tùy chọn)* Webhook chuyển tiếp đơn hàng sang Telegram/Zalo nếu cần |

---

## 12. CAM KẾT AN TOÀN SẢN XUẤT (PRODUCTION SAFETY)

- **Không tự ý deploy:** Mã nguồn hiện tại được kiểm thử và lưu an toàn tại local git repository, chưa tự động đẩy lên remote hoặc kích hoạt build Vercel.
- **Không thay đổi DNS:** Toàn bộ bản ghi DNS tại nhà đăng ký iNET được bảo vệ nguyên vẹn.
- **Không phá vỡ thiết kế:** Mọi thay đổi đều kế thừa nguyên mẫu thiết kế và luồng người dùng đã thống nhất.

# MỘC NGÔN HƯƠNG — BÁO CÁO TOÀN DIỆN AUDIT & CHUẨN HÓA THÔNG TIN LIÊN HỆ DOANH NGHIỆP (V15.1)

## 1. Mục Tiêu & Phạm Vi
Đợt rà soát và chuẩn hóa V15.1 giải quyết dứt điểm các thông tin liên hệ lỗi thời, thông tin cá nhân chưa xác nhận hoặc dữ liệu giả lập (placeholder) trên toàn bộ dự án **Mộc Ngôn Hương**.
Tất cả các điểm chạm khách hàng (Website, Giỏ hàng, Tài khoản, Email thông báo, Chatbot) đều được chuẩn hóa thống nhất theo thông tin doanh nghiệp chính thức:
- **Email doanh nghiệp:** `mocngonhuong@gmail.com`
- **Hotline / Zalo:** `0889 742 556` (Chuẩn quay số: `tel:+84889742556`)
- **Website chính thức:** `https://mocngonhuong.com`
- **Địa chỉ tiệm trà / điểm hẹn nhận hàng:** `42 Phố Hàng Điếu, Phường Cửa Đông, Quận Hoàn Kiếm, Hà Nội`

---

## 2. Bảng Đối Chiếu Các Thông Tin Lỗi Thời & Giá Trị Đã Thay Thế

| Vị trí (File & Dòng) | Giá trị trước sửa đổi | Giá trị sau khi chuẩn hóa | Mục đích & Rationale |
| :--- | :--- | :--- | :--- |
| [`src/pages/ContactPage.tsx:74`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/pages/ContactPage.tsx#L74) | `0889742556 (Ms. My)` | `0889 742 556` lồng trong `<a href="tel:+84889742556">` | Xóa tên cá nhân "(Ms. My)" theo nguyên tắc danh tính trung tính doanh nghiệp; chuẩn hóa định dạng số điện thoại dễ đọc; bổ sung liên kết `tel:` để mở ứng dụng gọi điện thoại trên di động/máy tính. |
| [`src/pages/ContactPage.tsx:80`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/pages/ContactPage.tsx#L80) | `mocngonhuong@gmail.com` (chữ thuần) | `mocngonhuong@gmail.com` lồng trong `<a href="mailto:mocngonhuong@gmail.com">` | Bổ sung liên kết `mailto:` cho phép khách hàng nhấp chuột để mở ngay ứng dụng gửi thư. |
| [`src/components/ChatBox.tsx:78`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/components/ChatBox.tsx#L78) | `Hotline/Zalo 0889 742 556 (Ms. My)` | `Hotline/Zalo 0889 742 556` | Loại bỏ tên cá nhân `(Ms. My)` trong tin nhắn phản hồi tự động về quà tặng doanh nghiệp của Chatbot. |
| [`src/pages/CheckoutPage.tsx:248`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/pages/CheckoutPage.tsx#L248) | `liên hệ hotline Mộc Ngôn Hương` (không có số) | `liên hệ hotline Mộc Ngôn Hương (0889 742 556)` | Cung cấp ngay số điện thoại liên hệ khẩn cấp khi hệ thống tiếp nhận đơn hàng gặp sự cố bảo trì. |
| [`src/pages/AuthPage.tsx:1012`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/pages/AuthPage.tsx#L1012) | `placeholder="0987 654 321"` | `placeholder="Ví dụ: 0912 345 678"` | Thay thế placeholder gợi ý số điện thoại khách hàng để tránh trùng lặp với định dạng hotline cũ. |
| [`src/pages/AuthPage.tsx:1814-1819`](file:///Users/hoainam/Documents/Mộc Lan Hương/src/pages/AuthPage.tsx#L1814-L1819) | `Vietcombank ... Số tài khoản: 0987 654 321` | Hướng dẫn chuyên viên Mộc Ngôn Hương sẽ trực tiếp liên hệ qua điện thoại (`0889 742 556`) để cung cấp thông tin tài khoản ngân hàng chính thức | **Bảo vệ an toàn giao dịch**: Tuyệt đối không hiển thị số tài khoản giả lập làm đích chuyển tiền; đồng bộ 100% với luồng an toàn tại `OrderConfirmation.tsx`. |
| [`api/orders.ts:160, 632`](file:///Users/hoainam/Documents/Mộc Lan Hương/api/orders.ts#L160) | `(0889742556)` hoặc `liên hệ trực tiếp hotline` | `hotline Mộc Ngôn Hương (0889 742 556)` | Định dạng hiển thị chuẩn có khoảng trắng `0889 742 556` trong mọi phản hồi lỗi API đơn hàng. |
| [`api/_lib/notifications.ts:330`](file:///Users/hoainam/Documents/Mộc Lan Hương/api/_lib/notifications.ts#L330) | `Hotline: 0889742556` | `Hotline: <a href="tel:+84889742556">0889 742 556</a> \| Email: <a href="mailto:mocngonhuong@gmail.com">mocngonhuong@gmail.com</a>` | Email xác nhận đơn hàng gửi khách hàng có liên kết hotline và email hỗ trợ bấm gọi/gửi thư ngay lập tức. |
| [`api/_lib/authEmailTemplates.ts:150, 185, 323, 358`](file:///Users/hoainam/Documents/Mộc Lan Hương/api/_lib/authEmailTemplates.ts#L150) | Chỉ hiển thị link website tiệm trà | Bổ sung đầy đủ Hotline `0889 742 556` (`tel:`) và Email `mocngonhuong@gmail.com` (`mailto:`) ở cả bản HTML và Plain text | Đảm bảo tính nhất quán và độ tin cậy trong email xác minh tài khoản và email khôi phục mật khẩu. |

---

## 3. Các Thông Tin Được Bảo Lưu Có Chủ Đích (Preserved Items)

1. **Email Kỹ Thuật Gửi Thư (Technical Senders):**
   - `donhang@mail.mocngonhuong.com`: Danh tính người gửi email thông báo đơn hàng.
   - `taikhoan@mail.mocngonhuong.com`: Danh tính người gửi email xác thực tài khoản & đặt lại mật khẩu.
   - *Lý do*: Đây là các địa chỉ đã xác thực DKIM/SPF trên hệ thống Resend và tên miền `mail.mocngonhuong.com`, không phải email tiếp nhận thư của khách hàng.
2. **Email Thông Báo Đơn Mới Cho Chủ Shop:**
   - `ORDER_NOTIFICATION_EMAIL` / `SHOP_NOTIFICATION_EMAIL`: `mocngonhuong@gmail.com`.
3. **Dữ liệu đơn hàng & khách hàng:**
   - Thông tin cá nhân, số điện thoại, địa chỉ của khách hàng trong cơ sở dữ liệu Firestore và mã đơn hàng `orderCode` được bảo toàn tuyệt đối.
4. **Địa chỉ tiệm trà thực tế:**
   - `42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội`: Được giữ nguyên làm điểm hẹn nhận hàng tại tiệm (pickup store) đã định hình trong thiết kế Figma và luồng checkout.

---

## 4. Kết Quả Kiểm Thử (Verification & Testing)

1. **Kiểm thử tự động chuyên biệt `scripts/test-contact-audit.mjs`:** Đạt **8/8 bài kiểm tra PASS 100%**.
   - Xác thực ContactPage chứa đầy đủ `tel:`, `mailto:`, không còn `(Ms. My)` hay `098.765.4321`.
   - Xác thực Chatbox dùng `Hotline/Zalo 0889 742 556`.
   - Xác thực CheckoutPage có hotline trong thông báo lỗi bảo trì.
   - Xác thực AuthPage đã loại bỏ số tài khoản giả lập `0987 654 321`.
   - Xác thực email xác nhận đơn và email xác thực tài khoản có đủ hotline và email bấm được.
   - Quét toàn bộ repository xác nhận không còn bất kỳ số điện thoại placeholder nào sót lại trong code người dùng.
2. **Kiểm thử hồi quy hệ thống:**
   - `scripts/test-auth-emails.mjs`: **7/7 PASS**
   - `scripts/test-admin-api.mjs`: **7/7 PASS**
   - `scripts/test-order-sanitization.mjs`: **3/3 PASS**
3. **Kiểm thử biên dịch Production:**
   - `npm run build` (`tsc -b && vite build`) hoàn thành thành công trong 3.46s, 0 lỗi, 0 cảnh báo.

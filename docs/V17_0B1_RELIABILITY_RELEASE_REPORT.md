# BÁO CÁO NGHIỆM THU V17.0B.1 — XỬ LÝ ĐỘ TIN CẬY & CHỐNG TRÙNG LẶP EMAIL CHÀO MỪNG

**Dự án:** Mộc Ngôn Hương  
**Website chính thức:** [https://mocngonhuong.com](https://mocngonhuong.com)  
**Mã nguồn GitHub:** `hndzgit/moc-ngon-huong`  
**Dự án Vercel:** `hndzs-projects/moc-ngon-huong`  
**Phiên bản:** V17.0B.1 (Production Bug-Fix Release)  
**Production Commit SHA:** `1c4940a`  

---

## 1. NGUYÊN NHÂN GỐC RỄ ĐƯỢC XÁC ĐỊNH (ROOT CAUSES)

1. **Đăng ký bị trễ do chờ gửi email (Registration Blocking):**  
   Hàm `AuthContext.register()` ở phiên bản V17.0B gọi `await fetch('/api/auth/send-welcome-email')` trước khi trả về `UserCredential`. Nếu mạng chậm hoặc nhà cung cấp Resend phản hồi trễ (1–3 giây), người dùng phải chờ hiệu ứng loading xoay trên màn hình đăng ký trước khi hoàn tất.
2. **Nguy cơ gửi lặp email khi có yêu cầu đồng thời (Race Condition / Concurrency):**  
   Endpoint `/api/auth/send-welcome-email` trước đây chỉ thực hiện `doc.get()`, sau đó gọi gửi thư Resend rồi mới thực hiện `doc.set()`. Nếu hai yêu cầu cùng đến trong khoảng thời gian vài mili-giây, cả hai đều vượt qua bước kiểm tra tồn tại và dẫn tới gửi trùng 2 email chào mừng.
3. **Chèn tên khách hàng trực tiếp vào HTML email (HTML Injection / XSS Risk):**  
   Hàm `renderWelcomeEmail()` chèn trực tiếp biến `customerName` vào chuỗi HTML email mà không qua bộ lọc ký tự đặc biệt (`<`, `>`, `&`, `"`, `'`), tiềm ẩn rủi ro vỡ bố cục email hoặc chèn mã độc nếu người dùng cố ý nhập tên bất thường.

---

## 2. CÁC TẬP TIN ĐÃ ĐƯỢC CHỈNH SỬA VÀ TẠO MỚI

1. `src/context/AuthContext.tsx`:
   - Tách quá trình gửi email chào mừng sang chạy ngầm không đồng bộ (Asynchronous Non-Blocking Dispatch).
   - Bổ sung tùy chọn `keepalive: true` trong cấu hình `fetch` để đảm bảo trình duyệt tiếp tục gửi trọn vẹn yêu cầu ngay cả khi khách hàng chuyển trang ngay lập tức sau đăng ký.
   - Hàm `register()` lập tức cập nhật trạng thái người dùng và trả về đối tượng `cred.user` trong vòng < 300ms, không còn phụ thuộc vào độ trễ của Resend.
   - Bọc toàn bộ quá trình gửi ngầm bằng `try/catch` an toàn, sự cố email không bao giờ làm gián đoạn hay rollback tài khoản Firebase đã tạo.
2. `api/_lib/notifications.ts`:
   - Mở rộng hàm `dispatchResendEmail` hỗ trợ tham số tùy chọn `idempotencyKey?: string`.
   - Chuyển tiếp tiêu đề HTTP chuẩn `Idempotency-Key` đến Resend API.
   - Thu thập và trả về `id` định danh tin nhắn của Resend để lưu vết kiểm toán.
3. `api/_lib/authEmailTemplates.ts`:
   - Bổ sung hàm `escapeHtml(str)` mã hóa an toàn các ký tự `&`, `<`, `>`, `"`, `'`.
   - Bổ sung hàm `sanitizeCustomerName(rawName)` chuẩn hóa tên khách hàng: loại bỏ ký tự điều khiển (`\x00-\x1F`), ký tự xuống dòng, giới hạn tối đa 100 ký tự và dự phòng mặc định an toàn ("Quý khách").
   - Bảo toàn 100% các ký tự Tiếng Việt có dấu (Unicode) cả trên bản HTML và văn bản thuần túy (Plaintext).
   - Áp dụng bộ lọc cho cả 3 mẫu email xác thực: `renderWelcomeEmail`, `renderVerificationEmail`, `renderPasswordResetEmail`.
4. `api/auth/send-welcome-email.ts`:
   - Thiết kế cơ chế đặt chỗ nguyên tử (Atomic Reservation) thông qua **Firestore Transaction**:
     - Document: `welcome_emails/{uid}`
     - Trạng thái: `pending` | `sent` | `failed`
     - Kiểm soát số lần thử tối đa (`MAX_ATTEMPTS = 3`).
     - Cơ chế phục hồi phiên treo (`STALE_PENDING_MS = 60s`): nếu một phiên `pending` bị gián đoạn quá 60 giây, hệ thống cho phép yêu cầu sau tiếp quản an toàn.
     - Tương thích ngược hoàn hảo với các bản ghi V17.0B cũ chưa có trường `status`.
   - Gọi API Resend tuyệt đối **ở bên ngoài** callback của transaction Firestore.
   - Sử dụng khóa chống trùng lặp Resend: `welcome-user/{uid}`.
5. `scripts/test-v17-0b1-welcome-email-reliability.mjs`:
   - Bộ kiểm thử độc lập 9 kịch bản kiểm tra toàn diện về chống đua lệnh, chống lặp tuần tự, phục hồi phiên treo, giới hạn số lần thử, mã hóa HTML, Unicode Tiếng Việt và bảo mật Token.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

```
=== [TEST] Mộc Ngôn Hương V17.0B.1 Reliability & Concurrency Suite ===
[1/9] Testing HTML Escaping & Injection Protection...
✓ PASS: HTML escaping strictly neutralizes XSS and HTML injection.
[2/9] Testing Vietnamese Unicode & Name Normalization...
✓ PASS: Vietnamese Unicode preserved and malformed names safely normalized.
[3/9] Testing Concurrency Safety & Race Condition prevention...
✓ PASS: Concurrent requests handled atomically with zero duplicate sends.
[4/9] Testing Sequential Duplicate Welcome Email Requests...
✓ PASS: Sequential duplicate requests return alreadySent: true without sending twice.
[5/9] Testing Legacy V17.0B Document Compatibility...
✓ PASS: Backward compatibility with legacy V17.0B welcome records preserved.
[6/9] Testing Stale Pending Reservation Recovery...
✓ PASS: Stale pending reservation successfully reclaimed after timeout.
[7/9] Testing Max Retries Guard (max 3 attempts)...
✓ PASS: Max retries guard stops retrying after 3 attempts.
[8/9] Verifying AuthContext.tsx non-blocking async registration...
✓ PASS: Registration completes immediately without waiting for welcome email.
[9/9] Verifying Security Gating and Provider Idempotency...
✓ PASS: Security boundaries and provider idempotency header verified.
==================================================================
ALL 9 V17.0B.1 RELIABILITY & IDEMPOTENCY TESTS PASSED WITH 100%!
==================================================================
```

- **Kiểm thử hồi quy toàn bộ hệ thống (`v17-regressions.mjs`):** TẤT CẢ VƯỢT QUA (Admin API, Auth Emails, Contact Audit, Order Sanitization).
- **Biên dịch Production (`tsc -b && vite build`):** Hoàn thành trong 2.96s với 0 lỗi, 0 cảnh báo.

---

## 4. THÔNG TIN PHÁT HÀNH & TRIỂN KHAI

- **Git Fix Branch:** `fix/v17-0b1-welcome-email-reliability`
- **Production Merge Commit:** `1c4940a`
- **Vercel Preview URL:** [https://moc-ngon-huong-m0ks9lxps-hndzs-projects.vercel.app](https://moc-ngon-huong-m0ks9lxps-hndzs-projects.vercel.app)
- **Vercel Production Deployment:** [https://moc-ngon-huong-po96b98nq-hndzs-projects.vercel.app](https://moc-ngon-huong-po96b98nq-hndzs-projects.vercel.app) (Status: **● Ready**)
- **Tên miền Production chính thức:** [https://mocngonhuong.com](https://mocngonhuong.com) & [https://www.mocngonhuong.com](https://www.mocngonhuong.com)

---

## 5. ĐÁNH GIÁ RỦI RO VÀ GIỚI HẠN

1. **Trường hợp đóng trình duyệt cực nhanh:** Nhờ có `keepalive: true`, trình duyệt sẽ cố gắng gửi trọn gói tin kể cả khi chuyển trang; tuy nhiên nếu người dùng tắt nguồn máy tính hoặc ngắt mạng ngay lập tức trong mili-giây đầu tiên, yêu cầu HTTP có thể chưa kịp rời khỏi máy khách. Đây là đặc tính kỹ thuật tiêu chuẩn của web và không ảnh hưởng đến tính toàn vẹn của tài khoản Firebase.
2. **Bảo toàn dữ liệu khách hàng & Đơn hàng:** Không có bất kỳ schema cơ sở dữ liệu hay mã nguồn xử lý thanh toán, giỏ hàng, hình ảnh tối ưu V16.1 hay giao diện V17.0A nào bị thay đổi ngoài phạm vi xác thực.

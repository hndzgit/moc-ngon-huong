# BÁO CÁO TRIỂN KHAI VERCEL & CẤU HÌNH TÊN MIỀN TÙY CHỈNH INET
**Dự án:** Mộc Ngôn Hương  
**Thời gian thực hiện:** 03/11/2026  
**Kỹ sư triển khai:** Deployment Engineer / DevOps Engineer  

---

## 1. THÔNG TIN DỰ ÁN & VERCEL
- **Tên dự án Vercel:** `moc-ngon-huong`
- **Mã định danh (Project ID):** `prj_vyAEvzjbUG1fioJ9iAKvMg2FF8rW`
- **Tài khoản / Team Vercel:** `hndzs-projects` (`team_yS0xQGvr8WAv6GCKGevV97p2`)
- **Vercel Project Dashboard:** [https://vercel.com/hndzs-projects/moc-ngon-huong](https://vercel.com/hndzs-projects/moc-ngon-huong)
- **Kho lưu trữ GitHub liên kết:** [https://github.com/hndzgit/moc-ngon-huong](https://github.com/hndzgit/moc-ngon-huong)
- **Nhánh triển khai chính (Production Branch):** `main`
- **Commit được triển khai:** `fcd1c4240aba92e117c2a504825f972a0cda9b7c` (*Repair Figma layouts and restore original gift imagery with motion QA*)
- **URL triển khai chính thức của Vercel:** [https://moc-ngon-huong.vercel.app](https://moc-ngon-huong.vercel.app)
- **Deployment Inspect URL:** [https://vercel.com/hndzs-projects/moc-ngon-huong/AmCgk8LmYrmHVHJ3SrSpaNuRpwpt](https://vercel.com/hndzs-projects/moc-ngon-huong/AmCgk8LmYrmHVHJ3SrSpaNuRpwpt)

---

## 2. CẤU HÌNH BUILD VERCEL
| Mục | Giá trị đã cấu hình | Ghi chú |
|---|---|---|
| **Framework Preset** | `Vite (vite)` | Nhận diện tự động và chuẩn hóa |
| **Node.js Version** | `22.x` | Khớp với GitHub Actions CI |
| **Build Command** | `npm run build` | Thực hiện `tsc -b && vite build` |
| **Install Command** | `npm ci` | Cài đặt chính xác theo `package-lock.json` |
| **Output Directory** | `dist` | Thư mục đầu ra của Vite |
| **Biến môi trường** | `VITE_BASE_PATH=/` | Cấu hình cho Production, Preview và Development |

> **Bảo vệ GitHub Pages:** Quy trình GitHub Pages (`.github/workflows/deploy.yml`) vẫn giữ nguyên cấu hình `VITE_BASE_PATH=/${{ github.event.repository.name }}/` (`/moc-ngon-huong/`), đảm bảo GitHub Pages fallback (`https://hndzgit.github.io/moc-ngon-huong/`) không bị ảnh hưởng.

---

## 3. CẤU HÌNH TÊN MIỀN TRÊN VERCEL
- **Tên miền Apex (Primary):** `mocngonhuong.com`
  - Đã thêm vào project `moc-ngon-huong`.
  - Trạng thái xác thực sở hữu: `Verified` (Hợp lệ).
- **Tên miền phụ (Secondary):** `www.mocngonhuong.com`
  - Đã thêm vào project `moc-ngon-huong`.
  - Đã cấu hình chuyển hướng vĩnh viễn: `www.mocngonhuong.com` ➔ `mocngonhuong.com` (Mã chuyển hướng HTTP `308 Permanent Redirect`, bảo toàn đường dẫn và tham số truy vấn).

---

## 4. TÌNH TRẠNG NAMESERVERS & BẢNG BẢN GHI DNS INET

### 4.1. Nameservers có thẩm quyền (Authoritative Nameservers)
Kiểm tra thực tế qua lệnh `dig NS mocngonhuong.com`:
- `danang.vclouddns.com.`
- `hoian.vclouddns.com.`

Nameservers hiện tại khớp 100% với hệ thống quản lý OneShield / OnePortal của nhà đăng ký **iNET**.

### 4.2. Bảng bản ghi DNS cần nhập tại iNET OnePortal
Do giới hạn môi trường sandbox không cho phép thao tác trực tiếp trên giao diện trình duyệt quản trị iNET và tuân thủ nguyên tắc an toàn thông tin bảo mật, chủ sở hữu vui lòng truy cập trang quản trị DNS của iNET tại [https://oneportal.inet.vn](https://oneportal.inet.vn) hoặc [https://ns.inet.vn](https://ns.inet.vn) và thêm các bản ghi sau:

| Tên bản ghi (Host) | Loại bản ghi (Type) | Giá trị đích (Value / Points to) | TTL | Mục đích |
|---|---|---|---|---|
| `@` *(hoặc để trống)* | **A** | `216.198.79.1` | `300` *(hoặc Tự động)* | Trỏ apex domain `mocngonhuong.com` về Edge IP của Vercel |
| `@` *(hoặc để trống)* | **A** | `64.29.17.1` | `300` *(hoặc Tự động)* | Bản ghi A phụ dự phòng được Vercel chỉ định |
| `www` | **CNAME** | `660930960d4bd88c.vercel-dns-017.com.` *(hoặc `cname.vercel-dns.com.`)* | `300` *(hoặc Tự động)* | Trỏ `www.mocngonhuong.com` về Vercel và kích hoạt 308 redirect |

> **Lưu ý an toàn DNS:**  
> - Không xóa hoặc thay đổi cặp Nameserver gốc của iNET.  
> - Nếu có bản ghi MX, SPF, DKIM hoặc email công ty tồn tại, giữ nguyên toàn bộ.  
> - Vercel đã xác minh quyền sở hữu dự án trực tiếp, không yêu cầu thêm bản ghi TXT xác thực riêng.

---

## 5. KẾT QUẢ KIỂM THỬ THỰC TẾ (PRODUCTION SMOKE TESTS)

Đã chạy bộ kiểm thử tự động toàn diện [test-vercel-production.mjs](file:///Users/hoainam/Documents/Mộc Lan Hương/scripts/test-vercel-production.mjs) trên URL triển khai thực tế của Vercel:

| Hạng mục kiểm thử | Kích thước / Viewport | Kết quả | Ghi chú |
|---|---|---|---|
| **Màn hình lớn** | `1920x1080` | **PASS** | 0 ảnh lỗi, 0 console error, 0 page error. Hero, Navigation, Logo, Showcase render chuẩn |
| **Laptop / Desktop chuẩn** | `1440x900` | **PASS** | 0 ảnh lỗi, 0 console error, 0 page error |
| **Tablet** | `768x1024` | **PASS** | Responsive mượt mà, menu tablet chuẩn |
| **Mobile** | `390x844` | **PASS** | Nút Hamburger Menu hoạt động, layout 1 cột tối ưu |
| **Danh mục sản phẩm** | `#/san-pham` | **PASS** | Hiển thị đủ 4 hương vị trà chính và hộp quà |
| **Chi tiết sản phẩm** | `#/san-pham/buoi-an` | **PASS** | Nạp đúng dữ liệu Trà Bưởi An, ảnh gốc, mô tả |
| **Giỏ hàng & Drawer** | Toàn trình | **PASS** | Thêm sản phẩm, mở drawer, tăng số lượng, đóng drawer thành công |
| **Tìm kiếm tiếng Việt** | Search modal | **PASS** | Tìm kiếm từ khóa không dấu/có dấu (`tra huong buoi`, `cốm`) cho kết quả chính xác |
| **Các trang thông tin** | `#/cau-chuyen`, `#/lien-he` | **PASS** | Tải đầy đủ nội dung, giữ nguyên hotline/email |
| **Trang thanh toán** | `#/thanh-toan` | **PASS** | Hiển thị đúng sản phẩm trong giỏ, form đặt hàng hợp lệ |
| **Tải lại trang (F5)** | Hash routing | **PASS** | Giữ nguyên trang hiện tại, không phát sinh lỗi 404 |

---

## 6. TÌNH TRẠNG SSL & HTTPS — ĐÃ HOÀN TẤT & XÁC MINH
- **Chứng chỉ SSL:** Đã được cấp phát thành công bởi Let's Encrypt qua Vercel (`cert_YmEDkKY8S9Gigvi8JWnwbgOh`).
- **Tên miền bảo vệ:** `mocngonhuong.com` và `www.mocngonhuong.com`.
- **Tự động gia hạn:** `autoRenew: true`.
- **Chuyển hướng tự động HTTPS:**
  - `http://mocngonhuong.com` ➔ HTTP 308 Permanent Redirect sang `https://mocngonhuong.com/`.
  - `https://www.mocngonhuong.com` ➔ HTTP 308 Permanent Redirect sang `https://mocngonhuong.com/`.
- **HSTS:** Kích hoạt `Strict-Transport-Security: max-age=63072000`.
- **Kết quả kiểm tra trực tiếp:** `curl -sI https://mocngonhuong.com` trả về **HTTP/2 200 OK**, ổ khóa bảo mật TLS hiển thị hoàn toàn bình thường.

---

## 7. CÁC HẠN CHẾ VÀ KẾ HOẠCH BÀN GIAO GIAI ĐOẠN TIẾP THEO

1. **GitHub Pages Fallback:**
   - URL: [https://hndzgit.github.io/moc-ngon-huong/](https://hndzgit.github.io/moc-ngon-huong/)
   - Trạng thái: Đang hoạt động song song để làm phương án dự phòng.
2. **Xác thực Firebase (Authentication):**
   - Đã hoãn theo yêu cầu cho tới khi tên miền chính thức hoạt động hoàn tất.
   - Khi tên miền `mocngonhuong.com` kích hoạt xong, bước tiếp theo là truy cập Firebase Console > *Authentication* > *Settings* > *Authorized domains* và thêm `mocngonhuong.com` và `www.mocngonhuong.com`.
3. **Cổng thanh toán & Đơn hàng:**
   - Hệ thống hiện tại lưu trữ giỏ hàng và đơn nháp ở phía client (localStorage / memory). Cần tích hợp backend xử lý đơn hàng và cổng thanh toán trực tuyến trong giai đoạn tiếp theo.

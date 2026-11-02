# Kiểm tra chức năng — 02/11/2026

Các kiểm tra chạy bằng Chromium trong browser context riêng, với dữ liệu giả có địa chỉ `example.invalid`; không dùng tài khoản hoặc dữ liệu khách hàng thật.

| Chức năng | Phân loại | Bằng chứng / giới hạn |
|---|---|---|
| Chọn bốn cảm xúc, đổi ảnh/copy | VERIFIED_WORKING | `functional-smoke.json`; selection phản ánh `aria-pressed` |
| QR mở/đóng, Escape, khóa scroll, trả focus | VERIFIED_WORKING | Browser assertions |
| Tìm kiếm không dấu/có dấu; có/không kết quả; mở chi tiết | VERIFIED_WORKING | Browser assertions; tìm trên danh mục sản phẩm thật đang dùng; bỏ dấu gồm cả đ/Đ, kiểm tra thêm “tra da huong” |
| Giỏ hàng, tăng/giảm, lưu localStorage | VERIFIED_WORKING | Browser assertions kiểm tra số lượng và tổng tiền |
| Chọn sản phẩm để checkout | VERIFIED_WORKING | Đã sửa việc sản phẩm bỏ chọn vẫn sang checkout; giữ sản phẩm chưa chọn trong giỏ |
| Mua ngay → checkout | VERIFIED_WORKING | Đã sửa drawer còn che checkout |
| Tab delivery/pickup, validation trường trống | VERIFIED_WORKING | Browser assertions, không gửi đơn thật |
| Ghi nhận đơn hàng / thanh toán | MOCKED | Handler hiện tạo mã ngẫu nhiên và đổi state cục bộ; không có API lưu đơn/payment. Frame `77:3506` được dựng như trang xác nhận từ snapshot local. Không coi đây là giao dịch thật |
| Contact validation / modal | UI_ONLY | Chỉ set state success; chưa có API gửi yêu cầu |
| Newsletter | UI_ONLY | Chỉ set state subscribed; chưa có API đăng ký |
| Chat | MOCKED | Rules trong `generateBotReply`, không có model/server; gửi tin và mở sản phẩm vẫn hoạt động |
| Review data / sort | UI_ONLY | Dữ liệu mẫu static; chưa nối dữ liệu review thật; nút sort/rating chưa có xử lý đầy đủ |
| Lọc review có ảnh | VERIFIED_WORKING | Đã sửa lọc danh sách hiển thị 2 → 1 → 2; chỉ xác nhận trên dữ liệu local đang có |
| Firebase login/register thật | NOT_TESTED | SDK/integration giữ nguyên. Không có cấu hình live để kiểm thử. Đã bỏ fallback báo đăng nhập/đăng ký thành công khi thiếu key hoặc có lỗi |
| Chặn đăng nhập giả | VERIFIED_WORKING | Không sinh session/email khi login không khả dụng |
| Email password-reset thật | NOT_TESTED | Gọi `sendPasswordResetEmail` nếu có cấu hình; không chuyển sang OTP giả sau lỗi |
| OTP và reset trực tiếp | BROKEN | Chưa có dịch vụ xác thực mã / token reset hợp lệ. UI giữ cho QA; bốn số bất kỳ không được đăng nhập hay đổi mật khẩu. Đã bỏ nút điền sẵn 1234 |
| Deep links / back-forward theo URL | UI_ONLY | App hiện dùng `currentPage` state, không có router URL. Không thay kiến trúc định tuyến trong lượt sửa giao diện |

`scripts/functional-smoke.mjs` có 12 assertion groups, tất cả PASS. Điều này xác nhận các hành vi được nêu trong tên kiểm thử, không xác nhận các API còn thiếu. Không gửi email, tạo tài khoản, thực hiện thanh toán hoặc đặt hàng thật trong kiểm thử.

## Cách chạy lại

Tooling QA được cài ngoài dự án tại `/tmp/mnh-visual-tools`, không sửa dependency/lockfile của ứng dụng:

```sh
npm install --prefix /tmp/mnh-visual-tools playwright sharp --no-audit --no-fund
npm run dev -- --host 127.0.0.1
node scripts/functional-smoke.mjs
node scripts/mobile-smoke.mjs
# Trong terminal khác: npm run preview -- --host 127.0.0.1 --port 4173
node scripts/production-smoke.mjs
MNH_WIDTHS=1920,1440,1280,1024,768,390,375,360 MNH_EVIDENCE_DIR=docs/evidence/final-capture node scripts/visual-audit.mjs
MNH_COMPARE_INPUT=docs/evidence/final-capture MNH_COMPARE_PREFIX=final- node scripts/compare-screens.mjs
python3 scripts/build-figma-reports.py
```

Có thể đổi `MNH_TOOLS_ROOT` nếu tooling ở vị trí khác. Bộ chuyển trạng thái tài khoản chỉ xuất hiện khi chạy DEV và có query `?figma-qa=1`; không xuất hiện trong production. Các trạng thái OTP/reset QA không bypass Firebase.

Bản production: `docs/evidence/production-smoke.json` kiểm tra homepage/asset, QA switcher bị loại, login không tạo session giả, không có console error/page error/request failure hay external write. Build log: `docs/evidence/production-build.log`. Không có script lint được cấu hình; không tắt hay nới kiểm tra nào.

Touch smoke dùng `isMobile: true`, `hasTouch: true` ở 390px và 360px: menu, product/cart stepper, search → detail, buy-now, delivery/pickup, ChatBox more/close đều PASS. ChatBox expanded được đo/chụp thêm ở cả 8 width, không có overflow/page error; emotion/attachment là artwork UI_ONLY, không có picker/upload.

Frame OTP `127:11621` được chụp đúng filled state với chuỗi mẫu `1707` do Playwright điền vào input, không submit. Mẫu này không nằm trong authentication logic và không được chấp nhận như mã thật. Functional smoke riêng vẫn xác nhận bốn số bất kỳ không chuyển sang reset/login.

Các control hiện hữu khác chưa được xem là tích hợp thật:

- `rememberMe` trong Auth chỉ là state checkbox; chưa nối Firebase persistence theo lựa chọn.
- Họ tên/địa chỉ đăng ký chưa được ghi vào profile backend; không bổ sung write dữ liệu khách hàng trong lượt sửa giao diện.
- `agreePromo`/`saveInfo` ở checkout chỉ là state, chưa có API consent hoặc lưu thông tin mua lần sau.
- City/district/ward và pickup stores là danh sách tĩnh đã có; chưa có dữ liệu địa chỉ phụ thuộc được xác minh.
- Nút sort/rating review còn UI_ONLY; không coi filter ảnh local đã pass là mọi filter hoạt động.

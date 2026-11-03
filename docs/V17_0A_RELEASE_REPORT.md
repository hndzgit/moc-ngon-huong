# V17.0A — Premium responsive motion

Ngày thực hiện: 03/11/2026. Nhánh `feat/v17-premium-responsive-motion`.

## Phạm vi và baseline

Baseline `b62fe21dbf6495fbc7cc8b66fc98cc746a3f0dd1`, working tree sạch. Đã fetch/recheck `main` trước khi sửa. Production baseline READY: `dpl_9xhbNirz3344T244gWKcTuZRVP8F`, `moc-ngon-huong-yichr5xev-hndzs-projects.vercel.app`; đây là mốc rollback, không xóa deployment cũ.

Đã xác minh đúng Vercel team `hndzs-projects`, project `prj_vyAEvzjbUG1fioJ9iAKvMg2FF8rW`, Vite/Node22 và domain `mocngonhuong.com`. Không sửa project, env, DNS, security controls hoặc retention. Không cài dependency mới.

SHA/URL/trạng thái phát hành thực tế sau khi push, Preview và merge được ghi trong [release evidence](evidence/v17/release.json). Báo cáo mã nguồn này được viết trước khi chạy Git integration; không tạo thêm deployment chỉ để cập nhật tài liệu sau phát hành.

## Cải tiến đã triển khai

| Khu vực | Nguyên nhân / sửa đổi | Bảo vệ chức năng |
|---|---|---|
| Product cards ở Home/Products/related/search | Ảnh và tên trước là div/h3 chỉ click; đổi thành button có tên truy cập. Bỏ hover zoom Tailwind áp cả touch; giữ lift/zoom nhỏ chỉ fine pointer. Hit area tăng/giảm44px trên touch | SKU, giá, callback và ảnh/crop không đổi |
| Product gallery, các MotionImage | Decode thất bại trước vẫn commit ảnh lỗi. Coalesce request, cache24URL đã decode, không giữ Image bitmap; chỉ commit ảnh tốt, giữ ảnh trước nếu lỗi; trạng thái busy/error và last-click-wins | Bảo toàn WebP/AVIF/source V16.1, preload/thumbnails/crop và React state |
| Cart/Search/Modal | Root inert khi exit có thể cho click lọt xuống trang; giữ backdrop chặn đến hết exit. Lock/focus trước paint, bù scrollbar khi khóa, khôi phục padding/focus; Tab điều khiển tường minh để WebKit không bỏ qua button | Không sửa cart math, lựa chọn checkout hoặc search matching |
| Checkout | CSS single-card Figma cũ vẫn ép typography/input/padding vào cards V16. Thêm scope `checkout-premium` để layout V16 tự quản lý; max1240, input48px/16px, label liên kết, focus-scroll margin, transition giới hạn transform/paint. FAB thu nhỏ56px ở checkout | `handlePlaceOrder`, validation, payload, ID token, idempotency, COD/bank và server confirmation không sửa |
| Tài khoản / lịch sử | Tabs wrap tại320; contact dài wrap; touch controls44px, input email/password/tel16px | Không sửa Firebase/context, profile/history fetch hay session |
| Admin | Modal có role, focus trap/Escape/scroll lock và max90dvh; touch targets44px, mã dài wrap | Không sửa getIdToken, UID guards, API fetch/PATCH, state/payment authorization |
| Xác nhận đơn | Confetti cleanup khi unmount, clear copy timer; reduced-motion không smooth-scroll; pulse/rotation hữu hạn thay loop liên tục | Không đổi thông tin đơn, trạng thái, giá hoặc bank instructions |
| Navigation/Footer/Story/Gift Journey | Audit responsive, ảnh và tương tác; mobile menu có max-height/scroll containment; giữ layout và state hiện hữu | Không thêm trang thay thế, decoration, QR payment hoặc bỏ section |

Không redesign, thay ảnh, đổi giá hoặc vẽ lại shop SVG. Không thêm payOS/SePay/VietQR/webhook.

## Bảo vệ hệ thống

[Baseline](evidence/v17/baseline.json) và [integrity](evidence/v17/integrity.json): không mất file;363 file API/data/context/services/config/assets được kiểm tra giữ nguyên. Catalog, Firebase Admin/Auth, Firestore rules, Resend templates, Vite/Vercel/hosting và package/lock không đổi. Các thay đổi Checkout/Auth/Admin chỉ ở presentation/focus; không đổi contract hay record.

V16.1 gallery `b5d74`/`191e7`, related cards, review image và responsive sources vẫn dùng optimized assets. Không phục hồi PNG lớn, không chỉnh cache header hay lưu trữ ảnh.

## Kiểm thử và bằng chứng

- TypeScript + production Vite build: PASS, [build log](evidence/v17/build.log). Không có ESLint command trong package; không nhận là đã lint.
-6 regression suites PASS: Admin API, authentication emails/security, contact audit, auth/orders, customer order history, sanitization/serialization. [Results](evidence/v17/regressions.json).
- Runner sao chép source vào checkout test cô lập, scrub Firebase/Resend credentials. Sanitization dùng **Firebase Admin SDK thật + Firestore Emulator** tại `127.0.0.1:8185`, project `demo-mnh-v17`, test credential sinh tạm. Không dùng khóa thật, không ghi DB Production, không gửi email. “SENT” trong log chế độ test không phải xác nhận giao email thật.
- Test history V13.4 cũ chờ `pending_confirmation`, nhưng commit Admin `6c9719a` đã đặt initial status=`preparing`. Sửa oracle, thêm assert creation=`preparing` rồi kiểm history giữ nguyên creation status; không thay server để làm test xanh.
- Chromium:190 case qua10 width320/360/375/390/430/768/1024/1280/1440/1920. WebKit:95 case qua320/390/768/1024/1920, motion bật. [Chromium](evidence/v17/browser/results.json), [WebKit](evidence/v17/webkit/results.json).
- Kiểm tra cuối mobile:38 Chromium +38 WebKit case tại320/390. [Chrome mobile](evidence/v17/mobile-final/results.json), [WebKit mobile](evidence/v17/mobile-webkit-final/results.json).
-8 interaction profile,2engine ×390/1920 ×motion/reduced: touch44px, keyboard product entry, rapid gallery, overlay lặp, scrollbar stability, exit click blocking, Tab trap/focus restore và đổi reduced-motion khi mở. [Interactions](evidence/v17/interactions/results.json).
- Network failure probe: giữ ảnh tốt khi target404; rapid selection kết thúc đúng ảnh decode, không commit khung trắng. [Image recovery](evidence/v17/image-failure.json).
- Account/Admin/order confirmation dùng **fixture cục bộ**, chỉ ảnh/dữ liệu QA, không truy cập đơn khách. Checkout success render nhận201 từ route interception riêng test; không phải giao dịch thật. Live guard trước sửa: health200/cloud-firestore-transactional, me/admin anonymous401.

Đã xem ảnh checkout1024 trước/sau và profile320; các ảnh khác được lưu cùng ma trận. [Before checkout](evidence/v17/before-checkout-1024.png), [after](evidence/v17/browser/checkout-chromium-1024.png), [profile320](evidence/v17/browser/profile-chromium-320.png). Screenshot baseline ban đầu cart trống, QA sau có1item; không coi hai ảnh khác data state là pixel-diff nghiệm thu.

Các số trên là case/profile theo bộ, không cộng thành số chức năng độc lập. Bộ test cuối và kiểm Preview/Production bổ sung có dữ liệu trong release evidence. Không tuyên bố mọi24frame cũ đã pixel-perfect hoặc toàn bộWCAG đã được chứng nhận.

## Hiệu năng

[Raw paired samples](evidence/v17/performance.json), [summary](evidence/v17/performance-summary.json). Chromium lab local production, CPU4×,3cặp sample ở1920/390, cùng chế độ motion, đợi font/Hero decode; không chạy browser QA đồng thời. Baseline là dist V16.1 trước sửa, không lấy dev server làm bản trước. Median; event duration không phải field INP. Không đo/claim60/120FPS.

| Width | LCP ms trước→sau | CLS trước→sau | Event duration ms | Long tasks ms |
|---|---:|---:|---:|---:|
| 1920 | 476→452 | 0.000301→0.000301 | 104→96 | 183→136 |
| 390 | 468→444 | 0.004349→0.004176 | 88→88 | 142→140 |

Số đo đầy đủ nằm trong summary. Biến động nhỏ không được coi là cải thiện có ý nghĩa thống kê với3sample. Không có benchmark thiết bị iPhone/Android thật, mobile keyboard vật lý, GPU hoặc heap dài hạn. Bounded decoded-URL cache không giữ bitmap, các GSAP context và dialog listener có cleanup; đây không phải chứng minh không leak trong mọi tình huống.

## Tái chạy

`node scripts/v17-regressions.mjs` cần Firestore Emulator localhost8185 đang chạy. Runner bundle nguyên assertion cũ bằng esbuild để resolve `.js` imports sang source TypeScript; không disable assertions. Checkout test riêng và cache riêng tránh ảnh hưởng `.data`/Vite cache của người dùng.

`node scripts/v17-fixture-server.mjs` mở QA-only frontend5191, ghi fixture vào thư mục ignored. `node scripts/v17-browser.mjs` dùng dev5190 + fixture5191; `node scripts/v17-interactions.mjs` kiểm2engine. `MNH_BASE_URL`, `MNH_SKIP_FIXTURES=1`, `MNH_WIDTHS`, `MNH_EVIDENCE` cho phép kiểm URL Preview/Production chỉ với guest/read-only flows. Các valid submit chỉ được fulfill trong origin fixture, mọi write khác bị chặn.

## Release gates và giới hạn

Chỉ phát hành sau build/regressions, visual/core flows, diff integrity, Preview READY, kiểm main mới nhất và không có capacity/protection blocker. Một Preview ứng viên; không xóa deployment, đổi retention hay tạo project khác. Merge bằng GitHub PR bình thường, expected head SHA, tôn trọng protection/checks. Production chỉ qua integration; không chạy thêm CLI prod deploy.

Nếu Preview/Production bị chặn, trạng thái được ghi đúng trong release evidence; không nhận deployment chưa kiểm là thành công. Mốc rollback V16.1 được giữ. Chỉ đọc log/error aggregate, không công khai customer records/tokens. Chưa tạo tài khoản thật hoặc gửi email/đơn thật; fixture không chứng minh nhà cung cấp email giao thành công.

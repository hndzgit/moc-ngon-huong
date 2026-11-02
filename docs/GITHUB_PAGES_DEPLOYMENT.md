# GitHub Pages — 02/11/2026

## Phạm vi và quyền

Yêu cầu deployment mới thay thế mục tiêu Vercel-only: GitHub repository + GitHub Pages. Không đổi DNS, không thêm hosting/CDN khác. Không xóa cấu hình Vercel; dự án ban đầu không có `vercel.json` hoặc liên kết `.vercel`.

Repository: https://github.com/hndzgit/moc-ngon-huong — **public**, sau xác nhận rõ ràng của chủ dự án “Cho phép chuyển public và xuất bản Pages” ngày 02/11/2026. Nhánh mặc định và phát hành: `main`; nhánh chuẩn bị `codex/github-pages` được giữ nguyên.

Website thực tế: **https://hndzgit.github.io/moc-ngon-huong/**. GitHub Pages dùng `build_type: workflow`, HTTPS được bật. Không đổi DNS hoặc tên miền riêng.

Không sử dụng remote `Focus-Pet-Pro` của Git root ở thư mục người dùng. Dự án được khởi tạo Git riêng với remote duy nhất `hndzgit/moc-ngon-huong`; nhánh chuẩn bị là `codex/github-pages`. Baseline trước sửa nằm tại `.codex-baseline/github-pages/before-20261102-105255.tar.gz`, không đưa lên Git.

## Workflow và cấu hình

`.github/workflows/deploy.yml` dùng official Actions được pin commit SHA. Node 22, `npm ci`, `npm run build` (bao gồm TypeScript), upload duy nhất `dist/`. Quyền mặc định `contents: read`; chỉ job deploy có `pages: write` và `id-token: write`.

Push nhánh `codex/**` chỉ build và upload artifact. Deploy chỉ chạy trên `main`, sau khi Pages được bật và quyền repository được giải quyết. Không tự chuyển visibility. Theo dõi kết quả thật tại tab Actions của repository; không dùng một bản local build thay cho trạng thái deploy.

Môi trường `github-pages` chỉ cho phép nhánh `main`. Khi bật Pages lúc nhánh mặc định còn là `codex/github-pages`, GitHub tự tạo policy theo nhánh đó; lần deploy đầu bị từ chối đúng quy tắc. Đã cập nhật policy thành `main` và chạy lại job lỗi thành công, giữ giới hạn nhánh thay vì bỏ bảo vệ.

Base được đặt từ `VITE_BASE_PATH`, mặc định `/`. Workflow dùng `/<repository-name>/`. Helper `assetUrl` xử lý mọi ảnh runtime, kể cả đường dẫn cũ trong giỏ hàng localStorage. CSS/font/imported assets do Vite xử lý. Không sửa hình học SVG, ảnh hay giá sản phẩm để hỗ trợ Pages.

Hash routes giữ hoạt động direct link, refresh, back/forward:

| Trang | Hash |
|---|---|
| Trang chủ | `#/` |
| Sản phẩm | `#/san-pham` |
| Chi tiết | `#/san-pham/buoi-an` và các ID catalog |
| Câu chuyện | `#/cau-chuyen` |
| Liên hệ | `#/lien-he` |
| Tài khoản | `#/tai-khoan` |
| Thanh toán | `#/thanh-toan` |

Hash không hợp lệ hiển thị thông báo không tìm thấy. URL path thuần như `/moc-ngon-huong/san-pham` không phải route được hỗ trợ trên Pages.

## Firebase và backend

Sáu biến Firebase client trong `.env.example` được đọc từ GitHub repository **Actions Variables** cùng tên khi build. Chưa cung cấp giá trị, nên đăng nhập thật chưa hoạt động; giao diện từ chối xác thực giả. Sau khi cấu hình cần build lại, kiểm tra Auth provider và thêm `hndzgit.github.io` vào Firebase Authentication Authorized domains. Không thay đổi Firebase rules từ frontend, không đưa service-account key vào biến Vite.

Không có API/serverless/Firestore/Storage service triển khai trong mã nguồn hiện tại; Firebase Auth SDK được giữ nguyên. Hosting tĩnh không bổ sung backend. Đặt hàng, liên hệ, newsletter: không báo gửi thành công trên production, không xóa giỏ hàng hoặc dữ liệu form khi backend chưa có. Modal thành công và receipt gốc vẫn có trong dev `?figma-qa=1` để đối chiếu Figma, không thể bật bằng query trên production. Chat dùng phản hồi quy tắc, không kết nối AI. Không thực hiện giao dịch, tạo tài khoản hay gửi email thật khi test.

## An toàn và chất lượng

- `.gitignore` loại `.env*` (trừ example trống), node_modules, dist, credentials, log, baseline và reference/evidence nặng; không xóa thư viện Figma cục bộ.
- Giữ 227 runtime asset Figma; hash nội dung so với bản build tĩnh khớp 227/227. Tệp lớn nhất dưới 10 MB, không có tệp đạt 100 MB.
- `src/services/firebase.ts` và `src/data/products.ts` khớp byte baseline trước chuẩn bị GitHub.
- Override transitive `@grpc/grpc-js` lên 1.14.7 sửa audit dependency; Firebase giữ 11.10.0. `npm ci`, production/full npm audit đạt 0 vulnerability tại thời điểm kiểm tra. Không coi audit bằng 0 là bảo đảm bảo mật toàn diện.
- Build root và Pages đều qua TypeScript + Vite. Không có lint/unit test script được cấu hình, không tắt kiểm tra để báo pass.
- Bằng chứng local lưu trong `docs/evidence/github-pages*`. Kết quả browser cuối phải xem `docs/evidence/github-pages/results.json`; không tính lần kiểm tra lỗi trước đó là pass.
- Kiểm tra desktop/mobile ở 1920/390/360px: assets, console/network, điều hướng, refresh/history, tìm kiếm, giỏ hàng, giao hàng/lấy tại cửa hàng và chặn gửi form giả. Script: `node scripts/github-pages-smoke.mjs` với `MNH_PAGES_URL` trỏ bản static production; công cụ Playwright ở `MNH_TOOLS_ROOT` bên ngoài dự án.

## Chưa nghiệm thu

Kết quả thực tế trước push:

| Kiểm tra | Kết quả | Bằng chứng cục bộ |
|---|---|---|
| TypeScript + build base `/` | PASS | `docs/evidence/github-pages-root-build.log` |
| TypeScript + build base `/moc-ngon-huong/` | PASS | `docs/evidence/github-pages-base-build.log` |
| Browser production static 1920/390/360 | PASS, 3 viewport; 0 console/page/network lỗi, 0 request ghi | `docs/evidence/github-pages/results.json` |
| Toàn bộ runtime asset | 227 HTTP 200; 227 hash khớp byte nguồn | cùng kết quả browser và kiểm tra hash local |
| Functional smoke dev | PASS, 12 nhóm; modal liên hệ chỉ QA | `docs/evidence/github-pages-functional.log` |
| Mobile touch dev | PASS, 390/360px | `docs/evidence/github-pages-mobile.log` |
| npm audit production và full | PASS, 0 vulnerability | `docs/evidence/github-pages-dependency-audit-after.json`, `github-pages-full-audit.json` |
| Scan các tệp sẽ commit | 317 tệp; 0 mẫu credential phát hiện, 0 tệp >=100MB | `docs/evidence/github-pages-security-scan.json` |

Một lượt browser khi tải song song với các bài test khác có ảnh tải thất bại; kiểm tra HEAD ban đầu cũng vượt backlog của static server. Đã giảm HEAD concurrency còn 4 và chạy lại trọn bộ thành công trên cùng nội dung build. Không bỏ kiểm tra ảnh để che lỗi. Cần tiếp tục kiểm tra trên URL Pages thật sau deployment.

## Kiểm chứng website công khai

Runtime commit: `f87ce3f88e38f981f84befa7314ae5bffe0815b0`, phát hành trên `main`. [GitHub Actions run 41387747865](https://github.com/hndzgit/moc-ngon-huong/actions/runs/41387747865), attempt 2: **success**, build và deploy đều thành công.

| Kiểm tra trực tiếp | Kết quả |
|---|---|
| HTTPS homepage | HTTP 200; index HTML hash khớp bản Pages đã test local |
| Browser 1920/390/360px | PASS cả 3 viewport, không horizontal overflow trong các trạng thái test |
| Trang chủ, sản phẩm, chi tiết, câu chuyện, liên hệ, login, checkout | Mở đúng route/state; screenshot bằng chứng |
| Direct hash link, refresh, back/forward, route sản phẩm không tồn tại | PASS |
| Tìm kiếm default/results, giỏ hàng, đổi số lượng và persistence | PASS |
| Giao tận nơi/lấy tại cửa hàng, validation checkout | PASS |
| Form contact/checkout/newsletter có dữ liệu hợp lệ | Báo chưa khả dụng; không xác nhận giả; giữ dữ liệu contact và giỏ hàng |
| Ảnh hiển thị, icon và đường dẫn asset | Không ảnh hỏng; đúng prefix; cả 227 asset trả HTTP 200, content-length > 0 |
| Console errors / page errors / same-origin HTTP >=400 | 0 / 0 / 0 |
| Request ghi / đơn hàng thật | 0 / không thực hiện |

Bằng chứng local không chứa credential: `docs/evidence/github-pages-live/results.json`, `http-index.json`, các screenshot trong cùng thư mục; `docs/evidence/github-pages/public-run.json` và `public-pages.json`. Kết quả này là smoke test storefront công khai, không phải chứng nhận toàn bộ Phase 4 hoặc backend thương mại.

Minion Pro gốc chưa được cung cấp; vẫn dùng fallback đã ghi trong audit Figma. 24 trạng thái có bảng theo dõi, chưa màn nào được nghiệm thu đầy đủ mọi tiêu chí visual. Đợt deployment không thay thế đo Lighthouse/CWV, audit accessibility/security toàn diện hoặc kiểm tra Firebase/backend thật của Phase 4.

Trước khi nhận đơn/xác thực thật: cung cấp Firebase client config qua Actions Variables, thêm authorized domain, kiểm tra Auth provider; triển khai và kiểm thử dịch vụ nhận đơn/liên hệ/newsletter bằng môi trường an toàn. Không coi website tĩnh đã xuất bản là backend đã hoạt động. Đợt triển khai giữ nguyên artwork, icon, giá và Firebase SDK; không thay đổi dữ liệu khách hàng.

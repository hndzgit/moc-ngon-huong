# GitHub Pages — 02/11/2026

## Phạm vi và quyền

Yêu cầu deployment mới thay thế mục tiêu Vercel-only: GitHub repository + GitHub Pages. Không đổi DNS, không thêm hosting/CDN khác. Không xóa cấu hình Vercel; dự án ban đầu không có `vercel.json` hoặc liên kết `.vercel`.

Repository đã tạo: https://github.com/hndzgit/moc-ngon-huong — **private**. Tài khoản `hndzgit` đang dùng GitHub Free. Pages cho repository private cần gói phù hợp; phải có sự đồng ý của chủ dự án trước khi chuyển public. Chưa được phép chuyển public và chưa công bố website. URL dự kiến `https://hndzgit.github.io/moc-ngon-huong/` chưa phải bằng chứng triển khai thành công.

Không sử dụng remote `Focus-Pet-Pro` của Git root ở thư mục người dùng. Dự án được khởi tạo Git riêng với remote duy nhất `hndzgit/moc-ngon-huong`; nhánh chuẩn bị là `codex/github-pages`. Baseline trước sửa nằm tại `.codex-baseline/github-pages/before-20261102-105255.tar.gz`, không đưa lên Git.

## Workflow và cấu hình

`.github/workflows/deploy.yml` dùng official Actions được pin commit SHA. Node 22, `npm ci`, `npm run build` (bao gồm TypeScript), upload duy nhất `dist/`. Quyền mặc định `contents: read`; chỉ job deploy có `pages: write` và `id-token: write`.

Push nhánh `codex/**` chỉ build và upload artifact. Deploy chỉ chạy trên `main`, sau khi Pages được bật và quyền repository được giải quyết. Không tự chuyển visibility. Theo dõi kết quả thật tại tab Actions của repository; không dùng một bản local build thay cho trạng thái deploy.

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

Minion Pro gốc chưa được cung cấp; vẫn dùng fallback đã ghi trong audit Figma. 24 trạng thái có bảng theo dõi, chưa màn nào được nghiệm thu đầy đủ mọi tiêu chí visual. Đợt deployment không thay thế đo Lighthouse/CWV, audit accessibility/security toàn diện hoặc kiểm tra Firebase/backend thật của Phase 4.

Trước công khai: chủ dự án chấp thuận chuyển public hoặc tự cung cấp gói GitHub hỗ trợ private Pages; bật Pages nguồn GitHub Actions; đẩy commit đã kiểm tra sang `main`; chờ cả build/deploy thành công; lấy URL từ deployment và chạy lại smoke trên URL đó. Không tuyên bố online trước hai kiểm chứng cuối này.

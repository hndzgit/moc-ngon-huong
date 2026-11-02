# V7 — Điều tra nguyên nhân, sửa có kiểm soát và QA

Ngày kiểm tra: 02/11/2026. Đã audit riêng **24/24 trạng thái** và chụp bản cuối **24 × 15 = 360 trường hợp**. Kiểm tra cơ học không phát hiện page error, ảnh hỏng, overflow ngoài mask hoặc nút bị cắt ngoài chủ đích. **Chưa nghiệm thu pixel-perfect toàn bộ màn: 0/24**; các giới hạn typography, dữ liệu và hover/backend được ghi bên dưới. Build thành công không được xem là bằng chứng hoàn tất chức năng.

## 1. Baseline và an toàn

- Checkout đúng origin `https://github.com/hndzgit/moc-ngon-huong.git`, nhánh `codex/phase5-motion`, HEAD `c0b8519e195e8f1b914c75b0dd444eca5257c03c`.
- Giữ 16 file tracked đã sửa và các file Phase 5 chưa commit. Snapshot **70 file** của working tree trước V7: `.codex-baseline/v7/working-tree-before.tar.gz`; [hash/status trước sửa](evidence/v7/baseline.json).
- Dev server đã xác minh PID/cwd, IPv4 `127.0.0.1:5173`. Không can thiệp server IPv6 khác của người dùng.
- Benchmark trước dùng bản production Phase 5 được sao lưu tại `/tmp/mnh-v7-before`, cổng 4178. Bản sau dùng `dist` hiện tại, cổng 4177; cùng base `/moc-ngon-huong/`. Không lấy Git HEAD cũ làm đại diện cho working tree Phase 5.
- Không reset/discard, không xóa file baseline, không sửa giá catalog, Firebase, package/lockfile hoặc cấu hình hosting. Các utility motion Phase 5 được giữ nguyên. [Kiểm tra file/asset](evidence/v7/safety-assets.json).
- **Không commit, push, publish, deploy hay thực hiện giao dịch thật.** V7 giữ GitHub Pages theo chỉ dẫn mới nhất; không thêm Vercel/Cloudflare/R2/CDN.

## 2. Đối chiếu nguồn thật và sửa số liệu cũ

A: `TKRa7opPooD1iBxlr3E0SU`; B: `jGNXZhtdoyrsEdaX3NgasR`; C: `S0TdOYTDdDR3IznouUu0cV`. Đọc trực tiếp qua Figma MCP, session `f9dea56c-7d11-4733-8541-a27501a260ea`, kết hợp export local. Không sửa file Figma.

- **250 image-fill UI trên mỗi nguồn** trùng từng hàng với snapshot trước và giữa A/B/C: hash, crop matrix, kích thước, rotation, visibility, opacity, filters. [Kết quả so sánh](evidence/v7/source-reverification.json); dữ liệu live chia hai batch để nằm trong giới hạn trả về của MCP.
- Bốn image-fill của gift carousel cũng trùng hash/crop giữa A/B/C. Ba ảnh chưa có trong local được phục hồi từ node gốc; SHA1 của file tải về bằng đúng Figma imageHash, không dùng ảnh khác cùng tên. [4 fills](evidence/v7/gift-images.json), [so nguồn B](evidence/v7/gift-images-b.json), [C](evidence/v7/gift-images-c.json), [3 export mới](evidence/v7/recovered-gift-assets.json).
- Component page live A/B/C giống nhau trong phép so sánh IDs, tên, loại node và danh sách variant: **11 COMPONENT_SET / 50 variant**, cộng **2 COMPONENT độc lập** Header và Footer. Tổng 52 component definitions, không gọi cả 52 là variant. [A](evidence/v7/live-component-page-a.json), [B](evidence/v7/live-component-page-b.json), [C](evidence/v7/live-component-page.json).
- Manifest cũ ghi 51; các báo cáo trước ghi 49. Header `92:3684` thực tế là COMPONENT; gift set `96:3135` có 4 variant; Button `119:2643` có 12; `120:7120` là variant của set `120:7121`; có thêm input set `132:4216`. Giữ nguyên thư viện tham chiếu cũ, ghi erratum thay vì sửa dữ liệu gốc để che mâu thuẫn.
- Asset manifest có **205 export gốc**; toàn bộ hash khớp. Có **32 screenshot local**: Source A 27, Source B 5. Frame manifest có 37 entry, không phải 37 màn UI; ma trận V7 dùng đúng 24 UI state.
- Đối chiếu SHA1 của mọi image-fill unique với file local: **35/35 ảnh UI** và **23/23 ảnh Component/Elements** đều có original khớp hash sau khi bổ sung3 ảnh gift. Đây là coverage file nguồn, không tự chứng minh mọi vị trí render đã nghiệm thu. [UI coverage](evidence/v7/ui-image-coverage.json), [Component/Elements coverage](evidence/v7/component-image-coverage.json).
- Không suy rộng các phép so sánh trên thành mọi text/paint/prototype trong ba file đều giống nhau. Các prototype/hover chưa có bằng chứng tại callsite vẫn để NOT_VERIFIED.

Các nhãn sai trong master prompt cũ được giữ theo nội dung thật: `120:2859` Nhài, `120:3302` Sói, `120:3541` Cốm, `120:6560` combo; `77:3506` trang xác nhận đơn; `127:12445` kích hoạt tài khoản. `119:2644` là Button variant, không phải Product Card. Homepage live không có section review độc lập; không thêm section hoặc vòng quay ngoài nguồn.

**Khác biệt reference screenshot AN:** native PNG cũ `figma-35-3068-native.png` không thể hiện artwork giống screenshot live mới, trong khi metadata live xác nhận lá/núi visible. Giữ nguyên file cũ để truy vết; sheet V7 chọn screenshot MCP hiện tại `evidence/v7/figma-detail-live.png` (479×1024) cho riêng AN. Phép diff AN hạ ảnh localhost về cùng width479, giữ tỷ lệ; không nhận đây là native1920 pixel validation. Nguyên nhân khác nhau giữa hai export chưa được xác định, không tự kết luận artwork vắng trong design.

## 3. Nguyên nhân và sửa đổi

| Issue | Nguyên nhân đã kiểm chứng | Sửa tại nguồn chịu trách nhiệm | Kết quả / giới hạn |
|---|---|---|---|
| A — 1600px | Hero 720→934px; cùng lúc bật hàng loạt desktop override | `Hero.css` dùng chiều cao fluid, các khối desktop gắn với layout `lg` hai cột hiện hữu; type/gap/padding có clamp, grid dùng tỷ lệ nguồn | Hero 1599→1600 chỉ tăng 0,266px; không chuyển chế độ tại 1600 |
| B — container | 64px padding bị xóa tại 1600 | Một container max1680 với gutter liên tục; giữ riêng contact max1394 và story detail row1639 | 1920: x120/w1680; contact x263/w1394. Hotline/email cùng cột với input, gồm tablet/mobile |
| C — ảnh hero | Dùng `object-fit:fill` với rect không theo tỷ lệ ảnh tự nhiên | Tách mask ảnh khỏi gradient; cover + object-position tính từ crop matrix; ảnh giữ tỷ lệ | Trước méo 16,7% ở1600 và33,3% ở2560; sau không kéo giãn tỷ lệ |
| D — nội dung hero | Hai bộ Tailwind/CSS thay tọa độ và wrapping tại breakpoint | Semantic `hero-copy`, typography/spacing fluid, CTA grid; bỏ các khai báo hero cạnh tranh | 1920: title x120/y433/w819/h108, copy y573/h117, CTA y730/h68, gap24 |
| E — cascade | Khai báo thắng/thua rải nhiều media block, kích thước cũ vẫn còn | Chuyển riêng Hero/artwork về CSS component; loại khai báo cũ và exact duplicate luôn thua; không gộp/reorder selector tùy ý | Exact duplicate property trong `figma-repair.css`: 35→0; `!important` 7→5. [AST audit](evidence/v7/css-audit.json) |
| F — artwork | `display:none` thắng rule desktop; section overflow-hidden không phù hợp lớp root sibling | Khôi phục 2 lá chè màu + núi, kích thước/matrix nguồn; story overflow visible, chỉ clip X tại canvas detail | 15 instance trên 5 detail frame. Núi được phép đi qua mép dưới story; mobile/tablet một cột không thêm artwork |
| G — font | Báo cáo font mâu thuẫn; glyph `*` dùng font/màu khác nguồn | Xác minh lại text styles; phục hồi Montserrat Alternates Regular cho dấu bắt buộc, màu #c8161d, label flex gap4 theo Auto Layout | Minion Pro vẫn thiếu bản web có phép nhúng; Georgia còn là fallback, chưa pixel-perfect |
| H — giỏ mặc định | Seed hai sản phẩm cho mọi khách mới | Production bắt đầu rỗng; chỉ seed khi DEV + `?figma-qa=1`; phục hồi dòng hợp lệ từ storage theo catalog | Không xóa giỏ hợp lệ đã lưu. JSON/dòng hỏng không làm crash; không tin giá lưu trong browser |

Sửa thêm từ QA:

- Selector `.rounded-full` của icon giỏ trống đã vô tình áp vào nút tiếp tục mua sắm, ép nút thành hình tròn. Giới hạn selector vào `div` icon; nút desktop trở lại 438×62.
- OTP source có hàng 392px, bốn ô86px/gap16, trong dialog460px; submit380px. Căn đúng gutter34/40, bỏ hai `!important`, giữ ô vuông ở mobile. Chuỗi1707 chỉ do tooling điền để chụp; không được chấp nhận làm mã thật.
- Gift carousel: thay3 ảnh lấy nhầm từ product gallery bằng originals `96:3129`, `96:3091`, `96:3111`; không sửa gallery/catalog. Khôi phục4 chấm12px/gap8/offset24, active#8e6746/inactive trắng; photo radius24 và hai arrow controls40px với vị trí/effect gốc. [Dots](evidence/v7/gift-dots.json), [arrows](evidence/v7/gift-arrows.json).
- Listing card cộng thừa khoảng cách ở price row. Sửa margin tại declaration gốc theo source: media550 + gap16 + copy120 + gap16 + controls40 =742. Giữ spill 5px có trong ảnh825/card820. Sửa thêm stepper container28→40 để controls không vượt khung và card đạt đúng742px ở1920.
- Fixed track của emotion, gift, philosophy, auth, detail và checkout đổi thành tỷ lệ nguồn. Row story detail riêng1639px gồm820+40+779, không ép thành1680.
- Ba ảnh Brand Story và banner đăng ký dùng crop matrix chuyển sang cover/object-position, không còn ép ảnh theo `fill` ở desktop.
- Thẻ unboxing/philosophy và các nút có nội dung xuống dòng dùng min-height/height tự nhiên để tránh cắt chữ. Nút detail thu nhỏ type hợp lý trong đoạn1024–1280, giữ24px ở desktop nguồn.
- Chat panel có max-height theo `dvh`, tính cả launcher, khoảng cách và bottom offset. Kiểm tra màn hình cao720px, không còn header chat đi ra khỏi viewport.
- Hero hover dùng màu #c59a58 đã đọc từ Button Primary/White hover variants. Đây là áp dụng palette component vào tương tác, không nhận là prototype Hero đã được Figma chỉ định. Không đổi font/layout lúc hover. [Paint gốc](evidence/v7/button-paints.json).

Bằng chứng trực quan: [Hero Figma / trước / sau](evidence/v7/hero-three-way.png), [Hotline và form sau sửa](evidence/v7/contact-alignment-after.png), [slide gift gốc đã phục hồi](evidence/v7/gift-variants-chromium-1920.png).

### Hình học Hero bắt buộc

Ảnh `61:1165` ở **y164/h918**, còn gradient ở **y148/h934**. Asset gốc4096×2731, hash SHA256 `6466713393e8374c5b44a05cfaf6e7f9f1391c59fa188d4212ca9ef469ddb6a4`.

Crop matrix `[[1,0,-0.0002598881256],[0,0.7170999646,0.2379640043]]` cho object-position Y84,115933%, offsetX≈0,499px ở1920. Chiều cao Hero934 được bảo toàn tại1920; không thay máy móc bằng720 hoặc918.

| Width | Hero trước | Hero sau | Gutter/copy X sau | Heading Y sau |
|---|---:|---:|---:|---:|
| 1536 | 720.000 | 829.328 | 93.328 | 401.047 |
| 1590 | 720.000 | 844.047 | 97.078 | 405.547 |
| 1599 | 720.000 | 846.500 | 97.703 | 406.297 |
| 1600 | 934.000 | 846.766 | 97.781 | 406.375 |
| 1601 | 934.000 | 847.047 | 97.844 | 406.453 |
| 1680 | 934.000 | 868.578 | 103.328 | 413.031 |
| 1920 | 934.000 | 934.000 | 120.000 | 433.000 |
| 2560 | 934.000 | 934.000 | 440.000 | 433.000 |

Đã đo thêm1590 ngoài15 viewport yêu cầu. [Before112 cases](evidence/v7/before-geometry/results.json), [geometry sau sửa](evidence/v7/final-geometry/results.json). Scrollbar headless WebKit chiếm6px: kiểm tra tọa độ Figma chuẩn hóa **content canvas1920**, không giả vờ viewport ngoài1920 luôn có content1920.

### Artwork được khôi phục

- Lá chè màu là `7:472`, image hash `058a33941f4475536f52a74d6eb41d7507172c57`, file `illus-lache-green.png`; không nhầm với lá đơn sắc `7:473`.
- Núi `7:474`, image hash `6d89e4d858e5e6b7da83f8834a4ee4e798212526`, file `illus-nui.png`.
- AN: lá trái `77:4832`, AABB x−311/y1087; lá phải `77:4826`, x1574/y1087; núi `85:2635`, x1460/y1413. Layer raw500×500, lá xoay ±159,9202°/20,0798° với reflection theo ma trận. Không lấy AABB641px làm kích thước ảnh500px.
- Cả năm frame visibility=true/opacity1. Combo dịch story/artwork xuống263px. Metadata từng instance: [artwork](evidence/v7/figma-detail-artwork.json), [transforms](evidence/v7/figma-transforms.json), [screenshot live](evidence/v7/figma-detail-live.png).

## 4. Icon và asset

**Không thay SVG đúng sẵn có.** Sửa hai node-ID registry arrow từ Button frame40px sang icon child24px `96:2991`/`96:2993`; path/viewBox không đổi. Xác nhận40 entry trong `FigmaIcon`, các crop `FigmaArtwork`, `BrandLogo`; 227 file public có sẵn không đổi byte so với Git; bổ sung3 original JPEG gift4096×2731, sau khi kiểm tra không có bản trùng hash trong local. Shape/path/viewBox/stroke/fill không được vẽ lại hoặc filter để giả màu. Không sinh artwork mới.

205/205 file manifest gốc khớp SHA256;3 export mới được kiểm tra SHA1 và SHA256 riêng. Hai asset lá/núi khớp trực tiếp file tham chiếu. [40 node/file/hash và kiểm tra an toàn](evidence/v7/safety-assets.json); inventory từng instance vẫn tại [FIGMA_ICON_AUDIT](FIGMA_ICON_AUDIT.md).

Giới hạn: hash đúng không tự chứng minh mọi slot/hover đúng. Menu mobile tự thích ứng và mũi tên text phụ không có bản desktop tương ứng để nhận là original Figma; giữ NOT_VERIFIED, không thay bằng icon khác chỉ vì cùng tên. Các component Lucide cũ không được mount được giữ nguyên, không dùng làm shop-icon replacement.

## 5. Responsive, motion và kiểm thử chức năng

Viewport: **360,375,390,430,768,1024,1280,1440,1536,1599,1600,1601,1680,1920,2560**. Mọi screenshot đợi font/images decode, reset scroll, cùng state, tắt motion để so resting state.

| Bộ kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| TypeScript + production build | PASS | [build.log](evidence/v7/build.log) |
| Screenshots/responsive | 360/360, 24 states ×15 width | [release-summary](evidence/v7/release-summary.json) |
| V7 regression, Chromium/WebKit | 36/36 PASS | [regression](evidence/v7/regression.json) |
| Functional smoke | 12 nhóm PASS | [functional](evidence/v7/functional-smoke.json) |
| Touch smoke | 390/360 PASS | [mobile](evidence/v7/mobile-smoke.json) |
| Motion | 8 profile, 96 nhóm PASS | [Chromium](evidence/v7/motion-smoke.json), [WebKit](evidence/v7/motion-smoke-webkit.json) |
| Contact/cart-empty/chat | 36/36 PASS,18 width ×2 height720/1080 | [component bounds](evidence/v7/components/results.json) |
| Local production dưới Pages base | 3 viewport PASS; 235 asset200 | [production](evidence/v7/production/results.json) |
| Original assets / icons | 205 source hashes +227 public files giữ nguyên;40 SVG entries | [safety](evidence/v7/safety-assets.json) |

[360 kết quả cuối](evidence/v7/release-final/results.json), [summary](evidence/v7/release-summary.json). Hai ngoại lệ có chủ đích: thumbnail crop theo source; ảnh listing tràn5px trong gutter. Không dùng body overflow-hidden làm bằng chứng hết lỗi: còn đo element bounds và scrollWidth của form/grid.

Motion: giữ nguyên các utility GSAP/context/matchMedia Phase5, engine tải sau load/idle; reduced-motion không cần tải GSAP lúc đầu. Không import ScrollTrigger, không thêm thư viện, loop, pin/scrub hay parallax. One-shot reveal dùng IntersectionObserver, cleanup/revert theo route/state. Kiểm tra rapid toggle,30 route changes, resize và đổi preference; không có assertion về FPS hoặc chứng minh tuyệt đối không rò bộ nhớ. [Motion Chromium](evidence/v7/motion-smoke.json), [WebKit](evidence/v7/motion-smoke-webkit.json).

| Tính năng | Phân loại thực tế | Phạm vi bằng chứng |
|---|---|---|
| Hash routes, refresh, back/forward | VERIFIED_WORKING | Local production với base GitHub Pages; không đổi router |
| Search có/không dấu, kết quả/rỗng, chọn sản phẩm | VERIFIED_WORKING | Danh mục đang dùng, modal/focus/keyboard |
| Bốn vị, QR, gallery, gift carousel | VERIFIED_WORKING | State/image đồng bộ, repeated/rapid clicks, không autoplay |
| Cart/quantity/selection/totals/persistence | VERIFIED_WORKING | Khách mới rỗng, QA fixture, storage hỏng, SKU trà lẻ, chọn checkout |
| Delivery/pickup và validation | VERIFIED_WORKING | Chuyển trường và lỗi form; không tạo đơn |
| Ghi đơn/thanh toán/contact/newsletter thật | UI_ONLY | Production fail-closed giữ dữ liệu; success chỉ ở DEV QA. Chưa có API dịch vụ |
| Firebase login/register/email reset thật | NOT_TESTED | SDK giữ nguyên; thiếu cấu hình test thật, không tạo tài khoản/gửi email |
| OTP/reset qua token | UI_ONLY / chưa có dịch vụ xác thực | Không chấp nhận bốn số bất kỳ, không báo thành công giả |
| Chat | MOCKED | Rules local; gửi tin/mở gợi ý hoạt động, không gọi mô hình AI |
| Reviews | UI_ONLY, filter ảnh local VERIFIED_WORKING | Nội dung static; sort/rating/pagination chưa được coi là dữ liệu thật |

Không có ESLint/unit-test script được cấu hình. Không tắt/nới check để làm xanh. Có kiểm tra keyboard/focus dialogs và reduced motion; **không nhận đây là chứng nhận WCAG hoàn chỉnh** hoặc thử trên thiết bị thật.

## 6. Hiệu năng đo được

Giữ ảnh gốc; ba ảnh gift phục hồi chỉ tải khi chọn slide tương ứng. Hai blur19,3px trên controls40px là effect tĩnh theo Figma, chỉ ở desktop; không animate filter. Thêm5 derivative WebP trong `public/assets/optimized/`. Picture có fallback original, sizes xét chiều rộng ảnh cover ở mobile, fetchPriority high cho hero. Ảnh dưới fold lazy/decode async, giữ container/aspect ratio để tránh layout shift.

- Hero1920: **9.628.039→480.032 bytes (−95,01%)**. Derivative768:113.542 bytes; Retina3840:1.919.110 bytes. Browser chọn theo viewport/DPR.
- So decoded derivative1920 với original downsample cùng size: MAE1,676/255, PSNR41,065dB; giữ màu/aspect ratio. Đây là ảnh nén có sai số nhỏ, không gọi byte-identical. [Chỉ số cả5 size](evidence/v7/hero-derivatives.json).
- Benchmark luân phiên before/after, Chromium, CPU4×, cold browser contexts, cùng viewport1920/390. Đợi ảnh đang nhìn thấy decode trước snapshot LCP, rồi thực hiện search. Lượt network ban đầu dùng chờ cố định chưa đủ decode được giữ `*-initial.json` để truy vết và **không dùng nghiệm thu LCP**.

| Profile / width | LCP trước→sau (ms) | FCP trước→sau (ms) | CLS trước→sau | Max-event median trước→sau (ms) | Long-task total median trước→sau (ms) |
|---|---:|---:|---:|---:|---:|
| Local /1920 | 868→588 | 868→588 | 0.000295→0.000295 | 224→96 | 252→63 |
| Local /390 | 768→592 | 768→592 | 0.002488→0.002485 | 184→80 | 211→115 |
| 8Mbps/80ms /1920 | 47264→2672 | 1116→820 | 0.000295→0.000295 | 556→144 | 684→176 |
| 8Mbps/80ms /390 | 1990→1692 | 1032→764 | 0.002453→0.002486 | 200→120 | 249→133 |

Local:5 mẫu/target/width,20 mẫu. Network:2 mẫu/target/width,8 mẫu, **8Mbps download /4Mbps upload /RTT80ms**, CPU4×. Event duration là lab proxy, **không phải field INP**. CLS so trong cùng profile; transfer là tài nguyên đã hoàn tất tại thời điểm snapshot, không phải toàn bộ session. [Raw local](evidence/v7/performance-local.json), [raw network](evidence/v7/performance-network.json), gồm currentSrc/complete và waterfall resources.

Desktop network LCP2,672s còn cao hơn mục tiêu2,5s; mẫu network ít, không cam kết field CWV hoặc60/120FPS. Nhiều ảnh sản phẩm gốc còn7–10MB, native lazy có thể prefetch trước khi cuộn; tiếp tục là giới hạn delivery. JS bundle không được nhận là nhỏ hơn chỉ vì LCP tốt hơn; [so bundle](evidence/v7/bundle-comparison.json) ghi riêng kích thước gzip. Benchmark đo sau tối ưu hero/lazy loading; các chỉnh carousel cuối không đổi ảnh mặc định ở màn hình đầu, và chưa phải benchmark GPU/scroll của carousel. Không benchmark GPU/thiết bị yếu hoặc heap snapshot dài hạn.

## 7. Kiểm tra từng màn

Mỗi hàng có capture riêng tại15 width. Assets VERIFIED_FILES = đúng nguồn/file, không thay thế nghiệm thu mọi crop/hover. Icon VERIFIED_FILES = SVG gốc, không đồng nghĩa mọi interaction variant đã hoàn tất. Visual REPAIRING/MISMATCH_FOUND giữ mở các khác biệt còn thật, không tô xanh toàn bộ.

Nguồn mọi hàng: A = `TKRa7opPooD1iBxlr3E0SU`. Assets/icons VERIFIED_FILES chỉ có nghĩa đã xác minh file gốc; hover/active còn được nêu riêng.

| Màn | Node | Route/state | Visual | Asset / Icon | Functional | Responsive | Evidence | Remaining |
|---|---|---|---|---|---|---|---|---|
| Homepage | `56:1033` | `/#/` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/56-1033-1920.png) · [390](evidence/v7/release-final/56-1033-390.png) | Minion Pro; giá source khác catalog; hover chưa nghiệm thu hết |
| Search mặc định | `127:12938` | `/#/ → search` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-12938-1920.png) · [390](evidence/v7/release-final/127-12938-390.png) | Recent-view fixture; row crop cố ý; hover |
| Search kết quả | `127:13466` | `/#/ → search/query` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-13466-1920.png) · [390](evidence/v7/release-final/127-13466-390.png) | Dữ liệu giá/copy mẫu khác catalog; hover |
| Search rỗng | `127:13960` | `/#/ → search/no results` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-13960-1920.png) · [390](evidence/v7/release-final/127-13960-390.png) | Text wrapping/hover chưa nghiệm thu toàn bộ |
| Product listing | `77:2583` | `/#/san-pham` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/77-2583-1920.png) · [390](evidence/v7/release-final/77-2583-390.png) | Minion Pro; giá/copy; ảnh825/card820 là source |
| Bưởi AN | `35:3068` | `/#/san-pham/buoi-an` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING UI | 15/15 mechanical PASS | [1920](evidence/v7/release-final/35-3068-1920.png) · [390](evidence/v7/release-final/35-3068-390.png) | Minion Pro giá; review static; hover |
| Nhài THƯƠNG | `120:2859` | `/#/san-pham/nhai-thuong` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING UI | 15/15 mechanical PASS | [1920](evidence/v7/release-final/120-2859-1920.png) · [390](evidence/v7/release-final/120-2859-390.png) | Minion Pro giá; review static; hover |
| Hoa Sói CẢM | `120:3302` | `/#/san-pham/soi-cam` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING UI | 15/15 mechanical PASS | [1920](evidence/v7/release-final/120-3302-1920.png) · [390](evidence/v7/release-final/120-3302-390.png) | Minion Pro giá; review static; hover |
| Cốm NHỚ | `120:3541` | `/#/san-pham/com-nho` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING UI | 15/15 mechanical PASS | [1920](evidence/v7/release-final/120-3541-1920.png) · [390](evidence/v7/release-final/120-3541-390.png) | Minion Pro giá; review static; hover |
| Hộp Quà Tâm Ý | `120:6560` | `/#/san-pham/hop-qua-tam-y` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING UI | 15/15 mechanical PASS | [1920](evidence/v7/release-final/120-6560-1920.png) · [390](evidence/v7/release-final/120-6560-390.png) | Minion Pro; lựa chọn4 vị; sample data |
| Cart có hàng | `127:8439` | `AN → cart` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-8439-1920.png) · [390](evidence/v7/release-final/127-8439-390.png) | Minion Pro; giá/mẫu khác Figma; hover |
| Cart rỗng | `127:8870` | `AN → cart empty` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-8870-1920.png) · [390](evidence/v7/release-final/127-8870-390.png) | CTA đã sửa; underlying detail font/hover |
| Brand Story | `33:2786` | `/#/cau-chuyen` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING navigation | 15/15 mechanical PASS | [1920](evidence/v7/release-final/33-2786-1920.png) · [390](evidence/v7/release-final/33-2786-390.png) | Crop/geometry kiểm tra; perceptual mọi layer/hover chưa nghiệm thu |
| Contact | `127:9562` | `/#/lien-he` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING form / UI_ONLY send | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-9562-1920.png) · [390](evidence/v7/release-final/127-9562-390.png) | Minion Pro; API gửi liên hệ chưa có |
| Contact success | `127:10079` | `contact +DEV QA` | REPAIRING | VERIFIED_FILES / hover pending | UI_ONLY | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-10079-1920.png) · [390](evidence/v7/release-final/127-10079-390.png) | Modal QA; production không báo success giả |
| Checkout | `77:3389` | `/#/thanh-toan` | REPAIRING | VERIFIED_FILES / hover pending | VERIFIED_WORKING validation / UI_ONLY submit | 15/15 mechanical PASS | [1920](evidence/v7/release-final/77-3389-1920.png) · [390](evidence/v7/release-final/77-3389-390.png) | Giá mẫu; dữ liệu địa chỉ tĩnh; chưa có order API |
| Xác nhận đơn | `77:3506` | `checkout +DEV QA` | REPAIRING | VERIFIED_FILES / hover pending | UI_ONLY | 15/15 mechanical PASS | [1920](evidence/v7/release-final/77-3506-1920.png) · [390](evidence/v7/release-final/77-3506-390.png) | Receipt fixture; không phải pickup hoặc đơn thật |
| Login | `127:11104` | `/#/tai-khoan` | REPAIRING | VERIFIED_FILES / hover pending | UI verified / Firebase NOT_TESTED | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-11104-1920.png) · [390](evidence/v7/release-final/127-11104-390.png) | Thiếu cấu hình Firebase test; hover |
| Activation | `127:12445` | `register → activate` | REPAIRING | VERIFIED_FILES / hover pending | UI verified / Firebase NOT_TESTED | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-12445-1920.png) · [390](evidence/v7/release-final/127-12445-390.png) | Profile/consent backend chưa thử; hover |
| Registration | `127:12046` | `auth → register` | REPAIRING | VERIFIED_FILES / hover pending | UI verified / Firebase NOT_TESTED | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-12046-1920.png) · [390](evidence/v7/release-final/127-12046-390.png) | Banner crop đúng; profile/consent chưa tích hợp |
| Forgot email | `127:10877` | `auth → forgot-email` | MISMATCH_FOUND | VERIFIED_FILES / hover pending | UI verified / email NOT_TESTED | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-10877-1920.png) · [390](evidence/v7/release-final/127-10877-390.png) | Email reset thật chưa thử; copy khác mẫu SMS |
| OTP modal | `127:11621` | `DEV QA forgot-otp` | MISMATCH_FOUND | VERIFIED_FILES / hover pending | UI_ONLY | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-11621-1920.png) · [390](evidence/v7/release-final/127-11621-390.png) | Không có service OTP/timer;1707 là screenshot fixture |
| Password reset | `127:11753` | `DEV QA forgot-reset` | MISMATCH_FOUND | VERIFIED_FILES / hover pending | UI_ONLY | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-11753-1920.png) · [390](evidence/v7/release-final/127-11753-390.png) | Không có verified reset token; copy/policy khác Figma |
| Success modal | `127:11871` | `DEV QA forgot-success` | MISMATCH_FOUND | VERIFIED_FILES / hover pending | UI_ONLY | 15/15 mechanical PASS | [1920](evidence/v7/release-final/127-11871-1920.png) · [390](evidence/v7/release-final/127-11871-390.png) | Chỉ QA, không được dùng làm kết quả auth thật |

[So sánh24 cặp](evidence/v7-release-comparison-sheet-1.png), [sheet2](evidence/v7-release-comparison-sheet-2.png), [sheet3](evidence/v7-release-comparison-sheet-3.png), [sheet4](evidence/v7-release-comparison-sheet-4.png), [pixel diagnostics](evidence/v7-release-visual-differences.json). Thumbnail chỉ hỗ trợ duyệt; số pixel diff có ghi kích thước reference, không kéo dãn sai tỷ lệ và không dùng làm tiêu chí duy nhất. Mobile không có bộ Figma frame riêng để nhận pixel-verified; đã kiểm tra cơ học toàn ma trận và xem các mẫu mobile/tablet/breakpoint.

## 8. File thay đổi và khả năng phát hành

| File/nhóm | Thay đổi V7 |
|---|---|
| `src/App.tsx` | Empty cart/QA fixture, storage validation theo catalog, lazy ảnh philosophy |
| `src/components/Hero.tsx`, `Hero.css` | Mask/crop/content grid, picture/source set, hover palette đã đọc từ Figma |
| `src/index.css`, `src/figma-repair.css` | Gutter, grid ratios, fluid type/spacing, cleanup exact duplicates, form glyphs, chat bounds, responsive controls |
| `src/pages/ProductDetailPage.tsx`, `ProductDetailPage.css` | Khôi phục artwork và layer clipping; lazy story/review |
| `src/pages/ContactPage.tsx` | Contact-info dùng cùng số cột/gap với form, giữ nguyên submit logic |
| `EmotionSelector.tsx`, `ProductCard.tsx`, `StoryPage.tsx` | Lazy/async decode dưới fold; không thay logic tương tác |
| `SignatureBoxSection.tsx`, `FigmaIcon.tsx` | Đúng4 ảnh carousel, dots/controls/radius từ nguồn; sửa2 node-ID icon child, giữ SVG path và callback/motion lifecycle |
| `index.html` | Montserrat Alternates Regular subset dấu*, license OFL được lưu |
| `public/assets/figma/originals/gift-96-{3129,3091,3111}.jpg` | 3 ảnh raw Figma được phục hồi, SHA1 khớp imageHash; không xóa/đổi ảnh product gallery |
| `public/assets/optimized/hero-*.webp` | 5 derivative768/1280/1920/2560/3840; bản gốc giữ nguyên |
| `scripts/optimize-hero.mjs`, `v7-*.mjs` | Tạo derivative có số đo; geometry/assets/regression/responsive evidence |
| `scripts/visual-audit.mjs`, `motion-performance.mjs`, `github-pages-smoke.mjs` | Chẩn đoán controls/grid; đợi visible-image decode, optional network throttle; test derivative URLs/empty production cart |
| `scripts/compare-screens.mjs` | Cho phép chọn reference đã kiểm chứng theo node và ghi referencePath vào metrics; giữ export cũ để điều tra |
| `docs/CODEX_FULL_REPAIR_V7.md` và các ghi chú V7 trong audit cũ | Bằng chứng, errata, giới hạn và kết quả hiện tại; giữ phần lịch sử |

Production build `VITE_BASE_PATH=/moc-ngon-huong/ npm run build`: TypeScript + Vite PASS. Production smoke3 viewport,235 asset HEAD200; console/page/network400+/external write đều0 trong phạm vi test. QA switcher không xuất hiện trong production; transaction/contact/newsletter thiếu backend không báo thành công giả. [Build](evidence/v7/build.log), [production](evidence/v7/production/results.json).

**Sẵn sàng review/preview frontend cục bộ với GitHub Pages base. Chưa sẵn sàng nhận đơn/thanh toán hoặc nghiệm thu pixel-perfect production.** Trước phát hành cần:

1. Cung cấp Minion Pro có quyền nhúng web; nghiệm thu các slot typography và hover/active chưa xác minh.
2. Xác nhận chênh lệch giá mẫu trong Figma với catalog kinh doanh; V7 không tự thay giá.
3. Nối/kiểm thử backend đơn hàng, contact/newsletter và Firebase trong môi trường test an toàn; xác minh authorized domains/rules/session/reset token phía dịch vụ. Không suy ra backend an toàn chỉ từ frontend build.
4. Review các khác biệt copy xác thực: UI email reset và điều kiện mật khẩu hiện tại không giả theo mẫu OTP/SMS hoặc timer không hoạt động để đạt screenshot.
5. Tiếp tục kiểm tra delivery/performance trên thiết bị và mạng thật; xử lý các ảnh lớn còn lại khi có derivative được nghiệm thu.
6. Chỉ push/deploy khi người dùng cho phép trong bước tiếp theo. Không sửa DNS/domain hay chuyển hosting.

Lệnh tái chạy nằm trong các script `v7-*.mjs`, `visual-audit.mjs`, `motion-smoke.mjs`, `motion-performance.mjs`, `github-pages-smoke.mjs`; Playwright/Sharp dùng tooling ngoài repo ở `/tmp/mnh-visual-tools`, không thêm dependency vào ứng dụng.

# Phase 5 — Motion audit, triển khai và QA

## Kết quả và an toàn

Đã triển khai motion tại local trên nhánh `codex/phase5-motion`. **Chưa commit, push hoặc deploy đợt này.** Website GitHub Pages vẫn là bản đã phát hành trước Phase 5. Baseline Git `c0b8519`; working tree sạch trước sửa; snapshot `.codex-baseline/phase5/before-motion.tar.gz`. Inventory/kế hoạch trước sửa được giữ trong `docs/evidence/phase5/motion-plan-before.md`.

Không sửa ảnh, SVG, shop icon, logo, crop artwork, font, màu thương hiệu, giá hoặc product data; không xóa page/component. Không đổi package/lockfile, Vite base, hash routes hoặc GitHub Actions. Có một guard cấu hình Firebase được giải thích riêng dưới đây; không thay phương thức xác thực SDK.

## Nguồn Figma và ranh giới xác minh

Nguồn A `TKRa7opPooD1iBxlr3E0SU`, B `jGNXZhtdoyrsEdaX3NgasR`, C `S0TdOYTDdDR3IznouUu0cV`. Session `88fa91be-362f-4a25-bbe9-fb78b6ffb095`. `get_motion_context(56:1033, recursive)` trên cả ba nguồn trả `nodes: []`; không coi kết quả này là toàn bộ prototype không có tương tác. Design context và screenshot gốc được dùng lại từ exports đã xác minh.

Đọc trực tiếp reactions nguồn A của homepage và các component:

- Nút `164:4225`, `164:4232`: hover CHANGE_TO, SMART_ANIMATE EASE_OUT khoảng 300ms.
- `96:3131` và instances của carousel: click qua các variant, khoảng 300ms EASE_OUT.
- Chat instance `80:5316` → `80:5095`: click CHANGE_TO, khoảng 300ms EASE_OUT.
- Thẻ `80:3647`: tám trạng thái default/click; `80:4148`: bốn vị × default/QR. CHANGE_TO cho chọn vị và QR có transition null.
- `119:2644` là Button, không phải Product Card. `80:3647` không phải accordion; showcase gốc là composition chữ/ảnh chữ nhật, không phải vòng xoay. Homepage không có reviews. Không tạo mới các cấu trúc đó theo nhãn sai.

Hạn chế codegen motion của MCP:

> Prototype interactions aren't currently supported in MCP. Keyframes on the canvas are visible, but not the smart animate interactions between frames or their transition settings. Code generated from this selection will represent the start and end states, not the transition between them.

Raw reactions vẫn đọc được qua Plugin API; không có snippet Smart Animate được xuất. Vì vậy chỉ xác nhận node/state và tham số đọc được, **không nhận việc nội suy GSAP là bản sao chính xác Smart Animate**. Reveal, micro-interaction và easing `power2.out` là enhancement được yêu cầu trong Phase 5. Không claim các hiệu ứng mới đều có trong Figma. Chưa so sánh đầy đủ prototype B/C; đối chiếu cây/image trước đây xem `FIGMA_SOURCE_RECONCILIATION.md`.

Bằng chứng: `docs/evidence/phase5/figma-motion-{0,1,2}.json`, `figma-prototypes.json`; screenshot component `figma-reference/sources/source-a/screenshots/component_80-4148_flavor-cards.png`.

## Checklist theo section — implementation cuối

| Section | Đã triển khai / trigger | Timing, easing, cost | Mobile / reduced motion |
|---|---|---|---|
| Header/nav | Entrance native CSS, hover underline, dropdown/menu enter/exit; focus opener rõ ràng | 220–300ms, ease-out; không sticky mới hoặc thay chiều cao header | Menu absolute ngay dưới header, không đẩy nội dung; reduced đổi tức thì |
| Hero | Heading và CTA entrance; giữ nguyên ảnh/crop | Native CSS 450/550ms, opacity từ 0.8, translate 6px; không chờ GSAP, không animate layer ảnh lớn | Không delay, không split text; reduced static |
| Section/product grid/story | Reveal một lần cho heading/card và image frame story phù hợp | GSAP power2.out, desktop 600ms/y14px; một IntersectionObserver theo route; không pin/scrub | Touch chỉ opacity, 350ms; reduced không observer/tween |
| Bốn thẻ cảm xúc | State React và aria-pressed; nội dung showcase đổi theo lựa chọn | GSAP 300ms, opacity/translate nhỏ; hủy tween cũ khi đổi tiếp | Tap/Enter; không mở rộng accordion hoặc xoay giao diện |
| Ảnh showcase/gallery | Giữ ảnh đã decode trong lúc tải ảnh tiếp; chỉ commit lựa chọn mới nhất; fade-in sau decode | 300ms, không nhân đôi file hoặc sửa crop; lỗi tải không bị che | Reduced đổi trực tiếp; không gesture cản scroll |
| Gift box carousel | Arrow/dot đổi slide, aria-current, không autoplay | 300ms ease-out; ảnh/source gốc; xử lý click nhanh | Touch như nút thường, không drag intercept; reduced instant |
| Product cards/quantity | Hover elevation 2px, ảnh scale 1.025 trên fine pointer; quantity/count feedback | 180–300ms; không animate số giá hoặc kích thước card | Tắt sticky hover zoom trên coarse pointer; reduced static |
| Botanical artwork | Giữ nguyên artwork, rotation, mask và stacking; không thêm floating/parallax | **Giữ tĩnh có chủ đích**, không loop hoặc animate crop/geometry gốc | Không thêm chi phí nền; không có phần motion botanical còn chờ triển khai |
| Search | Presence enter/exit; gõ/lọc không chờ timeline; card mới fade nhẹ | 180–300ms; focus trap và scroll lock qua exit | CSS fallback khi GSAP chưa tải; reduced close ngay |
| Cart | Slide-in/out, backdrop fade, quantity/empty feedback; width desktop 558px | 200–300ms; remove cập nhật state ngay, không trì hoãn giỏ để chạy animation | Clip chuyển động trong backdrop, không overflow; reduced instant |
| Chat | Panel enter/exit, message fade; chỉ cuộn message stream; Escape trả focus | Panel 300ms, message 220ms; ID message không trùng khi gửi nhanh; không fake loading | Không kéo scroll của page, không loop launcher; reduced instant |
| Reviews detail | Filter media/all có feedback; giữ nguyên review data | 250ms; không dựng carousel hoặc pagination backend giả | Controls hoạt động khi tắt motion; pagination hiện hữu UI_ONLY |
| Contact/checkout/auth | Focus/error feedback, modal presence, chuyển shipping/auth state giữ field data | 180–250ms; không fake submit loading/success, không remount form chỉ để animate | OTP tùy ý vẫn không xác thực; reduced đầy đủ chức năng |
| Page/history | Heading entrance sau route commit, hash/back/forward giữ hoạt động; khôi phục vị trí cuộn cuối theo hash trong phiên | Không trì hoãn navigation, không transform `main`, không route exit overlay | New navigation về top; đã test Back 2200px/Forward 900px trên Chromium/WebKit |

Những mục không tồn tại trong implementation/design hiện tại không được dựng mới cho animation: rotating selector, accordion expansion, homepage reviews, product-list filter backend và gift-message preview riêng. Checkout vẫn giữ note textarea hiện có. Không thay business logic để làm giả các chức năng đó.

## GSAP, fallback và lifecycle

- Dùng GSAP **3.15.0 đã có trong lockfile**, không thêm `@gsap/react`, Fancy Components, ScrollSmoother hoặc thư viện animation chồng nhau.
- `MOTION`: micro 180ms, swap 300ms, reveal 600ms, `power2.out`, stagger 55ms; các component có duration riêng theo nội dung.
- GSAP là dynamic chunk tải sau `load` + idle; header/hero dùng CSS. Phiên reduced motion không tự tải GSAP. Thay preference sẽ revert context/observer; nếu đã tải thì giữ module cache, không giữ animation chạy.
- Presence có fallback CSS ngay khi engine chưa sẵn sàng. Test cố tình giữ request chunk: cart/search vẫn mở, nhập, đóng và trả scroll/focus; sau release chunk HTTP 200, GSAP tiếp quản bình thường.
- `gsap.matchMedia()` tạo context có scope, `revert()` khi đổi state/unmount. Callback giữ root hợp lệ; không query DOM đã tháo. Timeline đảo state bị kill/revert trước lượt mới; overlay giữ mount tới cuối exit và inert trong lúc đóng.
- Reveal dùng **IntersectionObserver**, không cần ScrollTrigger cho hiệu ứng một lần. Không có plugin ScrollTrigger, pin, scrub, polling scroll hoặc listener scroll liên tục. Chỉ đọc geometry khi setup, không đo `getBoundingClientRect` mỗi frame.
- Dialog stack chỉ xử lý phím ở dialog trên cùng, giữ body lock tới overlay cuối đóng, restore focus với preventScroll. Chat là region modeless, không trap focus toàn trang.
- Không đặt will-change toàn site, không RAF loop riêng, không continuous artwork/parallax hoặc WebGL.

Tham khảo API: [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()), [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/).

## Các lỗi bắt được và sửa

1. Reduced desktop có cả hai media query cũ false, nên callback close không chạy: thêm query reduce luôn có nhánh xử lý.
2. Resize sau đóng overlay còn callback tham chiếu root null: guard root.isConnected và teardown motion theo presence.
3. WebKit không mặc định focus nút khi pointer click: focus opener search/cart/QR trước mở, giữ native keyboard trap khi đóng.
4. Menu mobile exit làm trang mới nhảy **229px**: đặt menu overlay dưới header; kiểm chứng đầu trang sản phẩm **118px → 118px**, jump 0 trên 390/375/360.
5. Chat scrollIntoView kéo cả page: chuyển sang scrollTo vùng message; thêm sequence ID chống trùng message khi gửi nhanh.
6. Baseline Firebase tạo Auth bằng placeholder key, WebKit gửi GET getProjectConfig HTTP 400: tái hiện trên baseline chưa sửa. Auth chỉ được khởi tạo khi có API key; ba guard login/register/reset kiểm tra auth khác null. Các SDK method, provider, dữ liệu và luồng khi có config giữ nguyên. Xác thực thật vẫn NOT_TESTED vì không có cấu hình. Bằng chứng `baseline-webkit-firebase.json`.
7. Router trước đây luôn kéo về top cả khi Back/Forward: bổ sung utility lưu vị trí theo hash trong phiên, không thêm router/dependency hoặc listener scroll liên tục. Deep-link refresh giữ route như trước.

## Browser và functional regression

| Browser | Width | Preference | Kết quả |
|---|---|---|---|
| Chromium | 1920 | no-preference | 12 nhóm PASS |
| Chromium | 1920 | reduce | 12 nhóm PASS |
| Chromium | 390 | no-preference | 12 nhóm PASS |
| Chromium | 390 | reduce | 12 nhóm PASS |
| WebKit | 1920 | no-preference | 12 nhóm PASS |
| WebKit | 1920 | reduce | 12 nhóm PASS |
| WebKit | 390 | no-preference | 12 nhóm PASS |
| WebKit | 390 | reduce | 12 nhóm PASS |

12 nhóm/profile: hero completion; cart reverse/resize/focus/quantity; search trong entrance và chọn trong exit; gallery last-click-wins/review filter; bốn vị + keyboard/QR; carousel không autoplay; chat không kéo page/trùng ID; shipping giữ field; contact modal QA; auth đổi state nhanh giữ email; rapid route/resize cleanup; đổi reduced motion khi overlay mở.

- **8 profile × 12 nhóm = 96 lần kiểm tra nhóm PASS**, không page/console/HTTP error ở kết quả stress cuối.
- Thêm touch/focus-trap trên Chromium và WebKit: PASS; coarse pointer không sticky image zoom; Shift+Tab/Tab giữ focus trong search.
- Responsive **8 width × 7 route = 56 lượt** ở 1920/1440/1280/1024/768/390/375/360: PASS, cart/chat vừa viewport, không root overflow.
- Regression hiện hữu: functional 12 nhóm PASS; mobile touch 390/360 PASS.
- Production preview base `/moc-ngon-huong/`: 1920/390/360 PASS, cả **227 asset HTTP 200**, không transaction thật hoặc request ghi.
- TypeScript + build root và Pages: PASS. Không có lint/unit-test script trong package; không tắt check để báo pass.
- Các lượt lỗi trước được chẩn đoán và chạy lại; không tính chúng là PASS. WebKit completion chờ computed resting state thay vì giả định sleep 800ms luôn đủ khi chạy browser song song.

## Resting-state visual regression

**24 màn × 2 width = 48 ảnh** trước/sau ở reduced motion. 48/48 kích thước screenshot và asset slot/source/object-fit khớp; geometry delta lớn nhất **0px**; không ảnh hỏng, page error hoặc element/root overflow trong matrix.

41/48 ảnh không có pixel vượt threshold 15/channel; sai khác lớn nhất **0.03039%** pixel. Đã xem các cặp lệch và homepage normal sau scroll/reveal; không thấy thay đổi composition. Đây là so sánh bảo toàn baseline, **không phải nghiệm thu pixel-perfect toàn bộ website so với Figma**. Font Minion Pro thiếu từ Phase 3 vẫn là giới hạn cũ.

Bằng chứng: `before/`, `after/`, `resting-comparison.json`, `resting-home-normal-{1920,390}.png`; frame IDs trong `scripts/visual-audit.mjs` và báo cáo Figma trước.

## Đo hiệu năng thực tế

Chromium local production, CPU **4×**, network không throttle, browser context mới mỗi mẫu. Chạy xen kẽ before/after, **5 mẫu mỗi target mỗi width**, tổng 20 mẫu. Median bên dưới; không phải dữ liệu thực địa. Event duration lớn nhất quan sát trong search flow **không phải field INP**.

| Width | Target | FCP ms | LCP ms | CLS | Event ms | Tổng long-task ms |
|---|---|---|---|---|---|---|
| 1920 | before | 712 | 712 | 0.000307 | 288 | 167 |
| 1920 | after | 664 | 668 | 0.000329 | 208 | 219 |
| 390 | before | 620 | 620 | 0.002440 | 168 | 116 |
| 390 | after | 596 | 596 | 0.002572 | 184 | 210 |

Initial JavaScript gzip đo cùng level 6 từ các script/modulepreload trong HTML: **138.96KB → 131.57KB**. GSAP chunk khoảng 27.95KB gzip được tải sau paint khi cần; tổng JS sau tải engine lớn hơn baseline. Firebase guard giúp bản chưa config bỏ phần khởi tạo Auth không cần thiết.

Bản thử đầu eager GSAP cho above-fold làm mobile LCP tăng; đã thay bằng CSS entrance và lazy engine. `performance-after.json`, `performance-optimized.json`, `performance-lazy.json` giữ các lượt trung gian; kết quả cuối dùng **performance-paired.json**. Tổng long-task trong cửa sổ đo tăng 52ms desktop và 94ms mobile; event duration mobile tăng 16ms dù LCP giảm. Đây là chi phí còn lại của engine/animation, không được coi là tất cả chỉ số đều cải thiện. Không bảo đảm mọi thiết bị đạt CWV, không claim 60/120 FPS.

Cleanup sau 30 lần đổi route/profile: observer còn tối đa 1 khi full motion (0 khi reduce), active GSAP tween 0, overlay closing thừa 0, body lock thừa 0. Heap sau GC được ghi cho Chromium; có tăng nhẹ giữa các vòng, chưa có chứng nhận leak-free dài hạn. WebKit không có CDP heap measurement trong harness này.

## Phân loại chức năng và phần còn lại

| Tính năng | Trạng thái |
|---|---|
| Navigation/hash/history, cart/search, carousel/gallery, quantity, local review filter, keyboard/touch | VERIFIED_WORKING trong test ghi trên |
| Auth thật với Firebase được cấu hình | NOT_TESTED; guard thiếu config VERIFIED_WORKING |
| Contact, checkout, newsletter backend | UI_ONLY/chưa kết nối; production không báo thành công giả |
| Modal contact/order success trong dev figma-qa | MOCKED cho QA, không phải giao dịch |
| Chat | MOCKED/local rules, không dịch vụ AI |
| Review data/pagination và các filter chưa có backend | Local data/UI_ONLY như baseline |

Chưa đo field INP, mobile network thật, thermal/GPU trên điện thoại vật lý hoặc FPS. Chưa nghiệm thu typography Minion Pro, Firebase/backend thật hoặc toàn bộ Phase 4 accessibility/security. Không có hiệu ứng bắt buộc nào chỉ mới ghi kế hoạch rồi nhận là đã triển khai; botanical giữ tĩnh và các UI không có trong nguồn được nêu rõ là quyết định phạm vi.

## File thay đổi

- `src/App.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/ChatBox.tsx`
- `src/components/EmotionSelector.tsx`
- `src/components/Hero.tsx`
- `src/components/Navbar.tsx`
- `src/components/ProductCard.tsx`
- `src/components/SearchOverlay.tsx`
- `src/components/SignatureBoxSection.tsx`
- `src/components/useDialogLifecycle.ts`
- `src/main.tsx`
- `src/pages/AuthPage.tsx`
- `src/pages/CheckoutPage.tsx`
- `src/pages/ContactPage.tsx`
- `src/pages/ProductDetailPage.tsx`
- `src/services/firebase.ts`
- `docs/PHASE5_MOTION_AUDIT.md`
- `scripts/motion-performance.mjs`
- `scripts/motion-smoke.mjs`
- `src/motion/MotionDialog.tsx`
- `src/motion/MotionImage.tsx`
- `src/motion/engine-loader.ts`
- `src/motion/motion.css`
- `src/motion/motion.ts`
- `src/motion/useRouteScroll.ts`

## Tái kiểm tra / xem local

- `npm run dev` → `http://127.0.0.1:5173/`.
- `npm run build` và `VITE_BASE_PATH=/moc-ngon-huong/ npm run build`.
- `node scripts/motion-smoke.mjs`; `MNH_BROWSER=webkit node scripts/motion-smoke.mjs`.
- `MNH_PAGES_URL=http://127.0.0.1:4177/moc-ngon-huong/ node scripts/github-pages-smoke.mjs` sau khi chạy production preview tương ứng.
- Playwright/Sharp dùng tooling đã có ngoài repo qua `MNH_TOOLS_ROOT` (mặc định `/tmp/mnh-visual-tools`); không thêm dependency vào app. Không tự giả định có lint/unit test chưa cấu hình.

Tất cả evidence local nằm trong `docs/evidence/phase5/`, bị gitignore để tránh upload ảnh/reference nặng. Report này và code sẵn để review; chưa gửi lên GitHub hoặc host.

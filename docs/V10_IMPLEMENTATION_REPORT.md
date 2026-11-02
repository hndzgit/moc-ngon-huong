# V10 — Emotion-centered Digital Tea Atelier

Ngày 02/11/2026. Bản này chạy **local**, chưa commit/push/deploy. Git HEAD vẫn `fcd1c4240aba92e117c2a504825f972a0cda9b7c` — bản V7 đã phát hành trước. GitHub Pages công khai chưa nhận V10.

## Kết quả đã xây dựng

| Khu vực | Trải nghiệm thực tế | Phân loại |
|---|---|---|
| Hero | Ảnh/crop gốc, copy định vị mới; CTA chọn quà và khám phá trà đều hoạt động | VERIFIED WORKING |
| Chuyển tiếp lá thư | 4 intention có hành động, mở đúng emotion ở bước2 | INTERACTIVE CLIENT-SIDE |
| Journey5bước | Điều muốn gửi → cảm xúc → hương trà → sản phẩm/composer → summary; quay lại sửa, deep link, reset | INTERACTIVE CLIENT-SIDE |
| Tea discovery | Giữ4vị/QR/cart cũ; thêm lối nối sang quà và so sánh hương trong journey/story | INTERACTIVE CLIENT-SIDE |
| Personalization | Tên/lời nhắn tiếng Việt và2bố cục live preview, giới hạn60/280, mobile shortcut | INTERACTIVE CLIENT-SIDE; thiệp vật lý cần tư vấn |
| Gift box | 4ảnh thật, thumb/caption/swipe/keyboard, thông tin trong hộp, preset Tâm Ý | VERIFIED WORKING |
| Story | 3chương, mục lục/progress không scroll-jacking; nội dung4vị đồng bộ | INTERACTIVE CLIENT-SIDE |
| Corporate | Form chuẩn bị quotation draft, giá catalog và preview; validation, chưa gửi | INTERACTIVE CLIENT-SIDE / REQUIRES BACKEND |
| Commerce | Add canonical SKU vào cart cũ, đúng giá, checkout thấy draft trong phiên | VERIFIED WORKING frontend; order/payment REQUIRES BACKEND |
| Authentication | Giữ nguyên SDK/screens/config, guest không cần đăng nhập | NOT TESTED production; hoãn theo V10 |
| Chat | Giữ local rules và branding, không đổi thành AI giả | UI ONLY / phản hồi định sẵn |

Không tìm thấy tài liệu học thuật gốc độc lập; dùng yêu cầu trong prompt. [ACADEMIC_BRIEF_ALIGNMENT](ACADEMIC_BRIEF_ALIGNMENT.md) đối chiếu5câu hỏi, Business Model Canvas,7Ps,IMC. [GETLAYERS_REFERENCE_ANALYSIS](GETLAYERS_REFERENCE_ANALYSIS.md) dẫn5GetLayers và5benchmark, phân biệt quan sát công khai với demo/source chưa truy cập. Không lấy premium code/ảnh hay cài template Next.js.

## Thay đổi thiết kế có lý do

V10 cho phép điều chỉnh trải nghiệm: Hero CTA/copy định hướng quà; thêm lá thư làm đầu vào quyết định; Story chuyển sang chương; Signature bổ sung thao tác và thông tin thay vì auto-carousel. Hai trang Journey/Corporate mới dùng nền giấy, type/green/ivory của thương hiệu. Không nhận các cải tiến này là prototype/motion được Figma chỉ định hoặc layout Figma cũ pixel-perfect.

Giữ logo, original shop SVG, botanical, ảnh trà/hộp gốc và tên/giá sản phẩm. Không vẽ lại SVG, sinh artwork AI, thêm chứng nhận, thêm SKU packaging, phí cá nhân hóa hay cam kết sản xuất/giao hàng. Sửa đoạn homepage cũ đang hứa đội ngũ tự viết thiệp thành mô tả bản nháp/cần tư vấn để không mâu thuẫn với tình trạng dịch vụ.

## Kiến trúc và bảo vệ dữ liệu

[INTERACTIVE_EXPERIENCE_ARCHITECTURE](INTERACTIVE_EXPERIENCE_ARCHITECTURE.md) mô tả transformation map, state, route, lifecycle và backend boundary.

App giữ draft trong bộ nhớ; cart persistent chỉ chứa product/quantity. Không lưu tên/lời nhắn vào localStorage/sessionStorage/URL. Một SKU vẫn một dòng cart: thêm lại tăng số lượng và dùng draft mới, đã thông báo trước khi thêm. Refresh giữ giỏ, xóa thông tin cá nhân; B2B rời trang mất bản nháp. Preview số chưa được gửi tới cửa hàng và không phải dịch vụ in đã xác nhận.

Checkpoint/hash trước sửa: [baseline](evidence/v10/baseline.json), `.codex-baseline/v10/working-tree-before.tar.gz`. Không xóa baseline files. Catalog, Firebase, package/lock, Vite và Pages workflow giữ nguyên; [integrity](evidence/v10/integrity.json). Không thay DNS/domain hoặc thêm hạ tầng.

## Motion, mobile, accessibility

Tái sử dụng GSAP lazy engine, controlled React state, MotionImage và dialog lifecycle. Thêm reveal intro một lần, chuyển bước/emotion khoảng300ms; Story dùng IO có disconnect. Không thêm ScrollTrigger, pin, autoplay, continuous parallax hoặc WebGL. GSAP chunk lỗi vẫn có Hero/journey dùng được trong test fallback.

Mobile chuyển một cột, điều khiển bằng tap/swipe, gallery giữ cuộn dọc; có lối chuyển tới preview và quay về textarea. Focus tới step heading, nav `aria-current`, lựa chọn `aria-pressed`, radio/label native, reduced-motion hoạt động. Không tuyên bố đạt toàn bộ WCAG hoặc chạy60/120FPS.

## Hiệu năng — số đo thật

Giữ originals; delivery derivatives không crop:

- 4ảnh gift chính: **37.570.886→1.209.432 bytes, −96,78%**;4thumbnail19.478bytes. PSNR39,3–40,1dB so với original thu nhỏ. [Mapping/quality](evidence/v10/gift-thumbnails.json).
- 5ảnh catalog preview1280: **23.593.243→642.834 bytes**. [Mapping](evidence/v10/tea-derivatives.json).
- 4ảnh card/discovery và4botanical: **40.120.262→592.780 bytes, −98,52%**. Botanical384 WebP lossless: alpha và visibleRGB trùng original đã resize; ảnh photo PSNR40,6–41,6dB. Ba nguồn có hash trùng được dùng chung derivative. [Mapping](evidence/v10/discovery-derivatives.json), [quality](evidence/v10/discovery-quality.json).

Journey/Corporate/Story là lazy chunks; network log homepage xác nhận không tải3module này trước khi mở. Gzip level9 initial JS **131.515→133.481bytes**; CSS **16.046→17.654bytes**. Không nói bundle nhỏ hơn. [Bundle](evidence/v10/bundle-comparison.json).

Benchmark Chromium local production, CPU4×,3cặp sample/width, chạy riêng sau khi các automated browser khác kết thúc; median. Baseline được dựng riêng từ HEAD trước V10. Đợi font/ảnh Hero decode. [Raw](evidence/v10/performance.json), [summary](evidence/v10/performance-summary.json).

| Width | LCP ms trước→sau | FCP ms | CLS | Event duration ms | Tổng long-task ms | Resource transfer bytes |
|---|---:|---:|---:|---:|---:|---:|
| 1920 | 652→704 | 652→552 | 0,000292→0,000270 | 200→152 | 565→700 | 51.330.977→3.250.102 |
| 390 | 556→588 | 556→588 | 0,002507→0,004351 | 104→120 | 276→287 | 42.062.752→2.269.954 |

Resource transfer giảm **93,67% desktop /94,60% mobile** trong lượt đo này. LCP tăng52/32ms; mobile event+16ms; tổng long-task chưa cải thiện. Không che các hồi quy này và không suy ra field INP hay “không hồi quy trên mọi máy” từ3sample. LCP/CLS lab dưới ngưỡng2,5s/0,1 đã đặt ở giai đoạn trước; event duration chỉ là quan sát trong test, không phải field INP. Chưa có dữ liệu người dùng thật hoặc đo network throttling cho V10. Cần profile CPU/thiết bị thật để xử lý long-task tiếp; chưa có bằng chứng FPS/GPU/heap dài hạn.

Lượt đo đầu có chạy cùng QA được giữ trong `performance-exploratory.json`, không dùng làm kết luận. Lượt trước tối ưu discovery được giữ riêng để truy vết nguyên nhân tải/giải mã ảnh lớn; bảng trên chỉ dùng lượt cuối.

## Kiểm thử và bằng chứng

Build TypeScript+Vite PASS; Journey production10width PASS; Chromium/WebKit×motion/reduced8profile PASS; homepage/story/corporate30layout case PASS; formB2B10profile PASS; Story/Gallery12profile+5touch/keyboard PASS; regression cũ12functional+8motionprofile PASS; production3viewport và **256asset200**. [Chi tiết/giới hạn](EMOTION_JOURNEY_TESTS.md).

Không có script lint/unit-test để chạy; không tắt checks. Không thực hiện order, thanh toán, tạo user hay gửi inquiry thật. [Preview desktop](evidence/v10/journey-production/summary-chromium-1920-reduce.png), [preview mobile](evidence/v10/journey-production/composer-chromium-390-reduce.png), [homepage](evidence/v10/surfaces/home-1920.png).

## File thay đổi

- `App.tsx`, `types.ts`, `lib/routes.ts`, `data/giftJourney.ts`: route/state, canonical cart + ephemeral gift configuration; lazy routes.
- `Hero.tsx`, `AtelierIntroduction.*`, `EmotionSelector.tsx`: entrance/entry,4intentions và liên kết discovery với quà.
- `GiftJourneyPage.*`, `GiftCardPreview.*`:5step/composer/preview, responsive/focus/privacy.
- `CorporateGiftingPage.*`: B2B draft interface và validation.
- `StoryPage.tsx`, `StoryChapters.css`:3chương và4vị; `SignatureBoxSection.tsx`, `SignatureAtelier.css`:gallery/swipe/inclusions.
- `Navbar.tsx`, `Footer.tsx`: navigation mới/focus; `CartDrawer.tsx`, `CheckoutPage.tsx`, `CheckoutGiftDraft.css`:draft thông tin và mapping đủ4vị.
- `motion/motion.ts`: thêm2target reveal intro, giữ lifecycle/utilities cũ.
- `public/assets/optimized/`:21derivative mới; không đổi originals.
- `scripts/optimize-{atelier,discovery,gift}-images.mjs`: generator; `scripts/v10-{journey,surface,entry}-tests.mjs`: QA mới.
-5reportV10 yêu cầu; bằng chứng trong `docs/evidence/v10/` vẫn theo ignorepolicy hiện hữu, chỉ local.

## Còn lại và phát hành

Backend quote/contact/order/payment, physical card service/pricing, domain/Firebase thật đều cần giai đoạn sau. Thiếu licensed Minion Pro; chưa có tài liệu học thuật gốc độc lập để đối chiếu thêm. Các factual claim catalog/marketing cũ vẫn cần chủ dự án duyệt, không được nhận là đã kiểm định độc lập. Chưa có acceptance của chủ dự án cho thiết kế V10, field performance hoặc thiết bị thật.

**Bản frontend dùng được để review guest flow tại local. Không nhận là shop giao dịch thật đã vận hành. Không commit/push/deploy V10.**

# V10 — Kiến trúc trải nghiệm tương tác

## Baseline và phạm vi

Working tree sạch trước V10, HEAD `fcd1c4240aba92e117c2a504825f972a0cda9b7c`, nhánh `codex/phase5-motion`. Checkpoint code/config tại `.codex-baseline/v10/working-tree-before.tar.gz`; hash342 tracked files trong [baseline](evidence/v10/baseline.json). Assets gốc được bảo vệ qua Git và hash. Build baseline benchmark được dựng riêng từ chính HEAD tại `/tmp/mnh-v10-baseline-source`, không lấy bản đang sửa làm “trước”.

V10 cho phép thay một số bố cục homepage/story để phục vụ brief mới. Đây là thay đổi được yêu cầu, không còn tuyên bố pixel-perfect cho các section V10 so với Figma cũ. Logo, ảnh thật, original SVG, botanical và dữ liệu sản phẩm vẫn là nền tảng; không cài dependency/template hoặc thay framework.

## Bản đồ chuyển đổi

| Component hiện có | Thay đổi V10 | Mục tiêu học thuật | Cách triển khai |
|---|---|---|---|
| Hero | Copy/CTA mới, giữ ảnh/crop/brand và entrance | Mở luồng quà, không chỉ catalog | CTA1 route journey; CTA2 scroll tea selector |
| Khoảng chuyển tiếp homepage | Lá thư với 4 intention chọn được | Đi từ điều muốn gửi | `AtelierIntroduction`, seed state rồi mở bước2 |
| EmotionSelector | Giữ4 trạng thái/QR/cart, thêm lối sang viết lời nhắn | Nối cảm xúc với món quà | Callback seed đúng emotion/intention |
| SignatureBoxSection | Thumb, caption, swipe ngang, thông tin hộp, CTA soạn quà | Trả lời hộp gồm gì, chọn/cá nhân hóa thế nào | Reuse MotionImage, ảnh4variant gốc/derivatives; preset Tâm Ý |
| StoryPage | 3 chương, mục lục/progress, 4vị tương tác | Trà Việt/câu chuyện/cách tặng | IO cleanup, nội dung hiện hữu, chuyển state đồng bộ; mobile stacked |
| Journey mới | 5 bước, thiệp live, summary sửa được | Trải nghiệm chọn quà có quyết định thật | React controlled state, module lazy |
| Corporate page mới | Yêu cầu tư vấn, preview chưa gửi | Quà doanh nghiệp | React form, validation, không network/storage |
| Cart/Checkout | Chỉ thêm canonical SKU; draft card trong phiên | Nối trải nghiệm mới với commerce cũ | Optional `CartItem.giftConfiguration`, preview trước checkoutform |
| Navbar/Footer | Lối vào mới dùng được chuột/touch/keyboard | Khả năng tìm thấy luồng | Hash routing hiện có; dropdown mở qua focus |

## State và ranh giới dữ liệu

`GiftDraft` do App sở hữu để không mất khi chuyển route: intention, emotion, productId, recipient, message, cardStyle. Step1–5 nằm trong hash query; không có dữ liệu cá nhân trong URL.

`INTENTIONS` là mapping biên tập: cảm ơn→CẢM, yêu thương→THƯƠNG, bình an→AN, nỗi nhớ→NHỚ. Người dùng đổi emotion được. `teaFor()` dẫn về đúng4 sản phẩm hiện có. Đổi emotion đổi hộp theo vị, nhưng giữ Tâm Ý nếu đã chọn hộp tổng hợp. Thành phần/cách pha/giá đọc từ `PRODUCTS`, không có catalog thứ hai.

`GiftConfiguration` được gắn vào dòng cart **trong bộ nhớ**, không đổi product/price. Cùng SKU vẫn là một dòng như cart cũ: thêm lại tăng quantity, bản nháp mới thay bản cũ; giao diện summary nói rõ điều đó. Không hỗ trợ nhiều lời nhắn khác nhau cho từng đơn vị cùng SKU trong phiên bản này.

Cart storage chỉ serialize `{product,quantity}`. Tải lại vẫn giữ giỏ hợp lệ, mất tên/lời nhắn/bố cục nháp. Rehydrate dùng canonical catalog, không tin giá trong browser. Không ghi PII vào localStorage, sessionStorage, query, analytics hay server. B2B draft cũng chỉ giữ trong component; rời trang sẽ mất.

Hai bố cục “Nét hoa”/“Lá thư” là **bố cục preview số**, không tạo hai SKU thiệp in. Packaging chỉ từ catalog. Tùy chỉnh vật lý và giá phải được tư vấn. Chưa có message gửi tới shop; UI nói rõ ở composer, summary và checkout.

## Route và loading

Giữ tất cả hash route cũ. Thêm `#/chon-qua?cam-xuc=CAM&buoc=2` và `#/qua-doanh-nghiep`; query whitelist4 emotion/step1–5, invalid về an toàn. Hash query không phụ thuộc DNS hoặc SPA fallback server.

Journey, Corporate và Story dùng `React.lazy`/Suspense. Home chỉ tải module tương tác khi mở; trạng thái form cập nhật ngay, không chờ GSAP. Không dùng một animation để chặn navigation, submit hay typing. Browser back/forward đổi step và route; thông tin nháp trong App được giữ tới refresh/đóng trang/reset.

## Motion và accessibility

Tái sử dụng GSAP engine lazy hiện có, `useChangeMotion`, `MotionImage`, modal/cart lifecycle. Thêm one-shot reveal cho intro bằng IntersectionObserver có cleanup; không import ScrollTrigger vì không cần pin/scrub. Story progress không hijack scroll. Chuyển bước/change emotion khoảng300ms; mobile rút dịch chuyển; reduced motion giữ cập nhật ngay.

Progress là nav/ordered list, `aria-current=step`; lựa chọn dùng button `aria-pressed`, card-style dùng radio native, input có label/maxLength. Focus tới heading khi mở/chuyển bước; trên mobile có lối “Xem lời nhắn trên thiệp” và quay về textarea. Gallery có button/thumb/keyboard, swipe chỉ khi ý định ngang rõ, `touch-action:pan-y` giữ cuộn dọc. Nội dung mặc định visible khi engine chưa tải hoặc giảm motion.

Không claim đã đạt toàn bộ WCAG. Font Minion Pro có quyền nhúng vẫn chưa có; không tải font không phép. Không thay màu/filter/SVG paths để giả originalicons.

## Backend được hoãn

Firebase/domain/authorized domains/DNS không đổi. Luồng guest hoạt động độc lập. Checkout/auth/contact/newsletter cũ giữ fail-closed khi thiếu dịch vụ; không bịa đơn thành công. B2B là giao diện yêu cầu đang chờ service, không có submit thật. Chat vẫn local rules, không được quảng cáo là AI thật.

Tích hợp backend sau này cần schema gift customization có xác nhận dịch vụ/giá phía server, retention/consent PII, quote endpoint, vận hành order và xác thực domain. Không tin giá/cart do client gửi làm nguồn thanh toán.

## Tài sản và kiểm thử

Originals không bị sửa/xóa. WebP là delivery derivative không crop, có source hash/mapping trong [tea derivatives](evidence/v10/tea-derivatives.json) và [gift derivatives](evidence/v10/gift-thumbnails.json). Không có ảnh AI hoặc source GetLayers premium trong repo.

Xem [EMOTION_JOURNEY_TESTS](EMOTION_JOURNEY_TESTS.md), [V10_IMPLEMENTATION_REPORT](V10_IMPLEMENTATION_REPORT.md) cho số đo thật và giới hạn. Không push/deploy V10 tự động.

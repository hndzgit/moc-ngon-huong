# V10 — Kiểm thử trải nghiệm chọn quà

Ngày 02/11/2026. Không tạo tài khoản, đơn hàng, inquiry thật hoặc gửi dữ liệu khách hàng. Test chỉ dùng tên/lời nhắn QA. Các con số dưới đây là số profile/trường hợp trong từng bộ, không cộng thành số chức năng duy nhất.

## Các bộ đã chạy

| Bộ kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Production TypeScript + Vite, base `/moc-ngon-huong/` | PASS | [build](evidence/v10/build.log) |
| Journey trên dev | 10/10 profile, 11 nhóm invariant/profile | [dev](evidence/v10/journey/results.json) |
| Journey trên build production | 10/10 profile, đủ5bước | [production journey](evidence/v10/journey-production/results.json) |
| Chromium/WebKit ×1920/390 ×motion/reduced motion | 8/8 profile, 11 nhóm invariant/profile | [cross-browser](evidence/v10/journey-cross-browser/results.json) |
| Homepage/Corporate/Story, 10 width | 30/30 layout/media case PASS | [surfaces](evidence/v10/surfaces/results.json) |
| Touch/keyboard/privacy/preview shortcut | 1 profile /6 nhóm kiểm tra PASS | [surfaces, dòng cuối](evidence/v10/surfaces/results.json) |
| Hero CTA2,4intention entry, Tâm Ý preset, max text, consultation/back | 5/5 nhóm PASS tại360px | [entry tests](evidence/v10/entry-tests.json) |
| Corporate form cô lập | 10/10 width PASS | [corporate](evidence/v10/corporate/results.json) |
| Story/Gift Gallery Chromium/WebKit | 12/12 profile PASS | [story/gallery](evidence/v10/story-gallery/results.json) |
| Gallery touch CDP thật, cuộn dọc, keyboard, rapid clicks fullmotion | 5/5 nhóm PASS | [touch/keyboard](evidence/v10/story-gallery/touch-keyboard.json) |
| Hồi quy chức năng cũ | 12/12 nhóm PASS | [functional](evidence/v10/functional-smoke.json) |
| Mobile touch cũ | 390/360 PASS,7nhóm/profile | [mobile](evidence/v10/mobile-smoke.json) |
| Motion lifecycle cũ Chromium/WebKit | 8/8 profile,96 nhóm PASS | [Chromium](evidence/v10/motion-smoke.json), [WebKit](evidence/v10/motion-smoke-webkit.json) |
| Optional GSAP chunk bị chặn | Hero vẫn hiện, journey chọn/tiếp tục được, không pageerror | [fallback](evidence/v10/motion-fallback.json) |
| Production Pages base, route/refresh/back-forward/cart/search/forms | 1920/390/360 PASS,256 asset HEAD200 | [production smoke](evidence/v10/production/results.json) |
| Kiểm tra whitespace/diff | `git diff --check` PASS | Chạy sau sửa cuối |

Width đầy đủ: **360,375,390,430,768,1024,1280,1440,1600,1920**. Không có ESLint/unit-test command trong package; không nhận chúng là đã chạy hoặc đạt. Build thực hiện `tsc -b && vite build`; không tắt check.

## Guest end-to-end — các invariant thực sự được kiểm tra

1. Mở Hero → “Bắt đầu chọn món quà” tới bước1; chưa chọn intention thì báo lỗi rõ ràng.
2. Lời cảm ơn gợi ý CẢM; đổi sang THƯƠNG cập nhật product facts; NHỚ vẫn chọn được.
3. Bước3 dùng thành phần/hương/vị/cách pha trong catalog, không có dữ liệu giả mới.
4. Chọn Tâm Ý, nhập tên/lời nhắn tiếng Việt, đổi hai bố cục số. Preview thay đổi thật.
5. Quay lại và chỉnh bước trước: còn người nhận, lời nhắn, gift selection. Summary hiển thị giá399.000đ và đủ4vị.
6. Add đúng SKU vào cart hiện có. Storage không chứa tên, lời nhắn hoặc `giftConfiguration`.
7. Cart checkout và direct checkout không cần đăng nhập; card draft xuất hiện trong phiên. Refresh giữ giỏ, xóa draft cá nhân.
8. Bốn campaign deep link mở đúng trà; query invalid an toàn; reset xóa lựa chọn.
9. Homepage letter4entry hoạt động; Signature CTA giữ preset Tâm Ý cả khi chọn intention mới; HeroCTA2 scroll đúng tea selector.
10. Tên tối đa60/lời nhắn280, chuỗi tiếng Việt dài không tràn/cắt; text như `<script>` được React escape. Touch preview shortcut và quay về textarea phục hồi focus.
11. Consultation sang Contact, browser back về đúng summary và giữ bản nháp trong bộ nhớ.

## Corporate inquiry

Test isolated page kiểm tra selector sản phẩm/giá/packaging, thông tin liên hệ không hợp lệ, số lượng nguyên, tổng tiền catalog, preview tiếng Việt và cảnh báo preview cũ sau chỉnh form. Không ghi local/sessionStorage hoặc gọi dịch vụ gửi. Root integration kiểm tra route dưới header/footer tại10width; ảnh delivery đổi sang derivative cùng nguồn được kiểm tra asset resolution.

CTA tạo **bản yêu cầu tại chỗ**, không gọi API và không báo “đã gửi”. Đây là **INTERACTIVE CLIENT-SIDE / REQUIRES BACKEND** cho bước chuyển yêu cầu tới cửa hàng.

## Visual evidence

- [Home1920](evidence/v10/surfaces/home-1920.png), [Home390](evidence/v10/surfaces/home-390.png).
- [Composer1920](evidence/v10/journey-production/composer-chromium-1920-reduce.png), [Composer390](evidence/v10/journey-production/composer-chromium-390-reduce.png).
- [Summary1920](evidence/v10/journey-production/summary-chromium-1920-reduce.png), [Summary390](evidence/v10/journey-production/summary-chromium-390-reduce.png).
- [Corporate1920](evidence/v10/surfaces/corporate-1920.png), [Corporate390](evidence/v10/surfaces/corporate-390.png).
- [Story1920](evidence/v10/surfaces/story-1920.png), [Story390](evidence/v10/surfaces/story-390.png).

Đã nhìn trực quan homepage desktop, composer mobile, summary desktop và Corporate mobile. Không nhận là chứng nhận WCAG hoặc nghiệm thu pixel-perfect toàn bộ24frame cũ. V10 thay có chủ đích một số section; ảnh/source gốc không bị đổi nội dung. Derivative chất lượng/alpha: [discovery quality](evidence/v10/discovery-quality.json).

## Còn chưa kiểm thử/hoãn

Firebase/domain/OTP thật, đơn hàng/thanh toán/inquiry server, fulfillment và dịch vụ in thiệp: chưa triển khai trong V10. Chưa đo field INP, FPS/GPU trên thiết bị thật hay heap leak dài hạn. Animation cleanup có bằng chứng trong phạm vi routing/rapid-click test, không phải bảo đảm không leak trong mọi tình huống.

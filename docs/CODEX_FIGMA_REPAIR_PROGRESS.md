# Tiến độ phục dựng Figma — 02/11/2026

## Trạng thái thực tế

**Đã audit metadata/context và đối chiếu desktop 24/24 màn. Số màn được nghiệm thu toàn bộ tiêu chí visual: 0/24.** Dự án đang ở trạng thái **REPAIRING**, không phải hoàn tất. Không dùng build hoặc sai số ảnh nhỏ để tự gắn VERIFIED cho một màn còn vấn đề.

- Đã chụp và kiểm tra cơ học **24 trạng thái × 8 viewport = 192 trường hợp**, các width: 1920, 1440, 1280, 1024, 768, 390, 375, 360. Không có lỗi page JavaScript, ảnh hỏng/chưa decode, root overflow hay element overflow không có vùng clip trong kết quả cuối.
- Đã xem các cặp desktop Figma/localhost cho toàn bộ 24 màn; các khác biệt còn lại ghi riêng từng hàng. Responsive screenshots là bằng chứng kiểm tra cơ học; chưa coi toàn bộ biến thể mobile là pixel-verified.
- 12 nhóm functional smoke PASS; production smoke PASS, console/page errors/request failure/external write đều 0. Không tạo tài khoản, gửi email, sửa customer data hay đặt hàng/thanh toán thật.
- Build production cuối: PASS (`tsc -b && vite build`). Không có lint script được cấu hình; không tắt kiểm tra.
- 205/205 asset hash trong manifest gốc khớp byte thực tế; các export bổ sung có manifest/hash riêng.

## Baseline và an toàn

- Snapshot: `.codex-baseline/2026-11-02/application-before-repair.tar.gz`; checkpoint cũ giữ nguyên.
- Git root thực tế `/Users/hoainam`; thư mục dự án bị `.git/info/exclude:12:/*` ignore. Không reset Git, không discard thay đổi có sẵn, không sửa Git toàn cục.
- Đối chiếu snapshot: 20 file baseline được sửa; **0 file baseline bị xóa**. Các file mới là adapter asset, style bổ sung, receipt và tooling/evidence. Danh sách máy đọc: `evidence/source-delta.json`.
- 14 giá trị price số trong catalog giữ nguyên; `src/services/firebase.ts` byte-identical; không có URL Figma tạm trong production source. Bằng chứng `evidence/safety-checks.json`.
- Không push, không deploy. `127.0.0.1` là dev/preview cục bộ.

## Nguồn và các nhãn được hiệu chỉnh

A = `TKRa7opPooD1iBxlr3E0SU`; B = `jGNXZhtdoyrsEdaX3NgasR`; C = `S0TdOYTDdDR3IznouUu0cV`. MCP truy cập được cả ba; session `9bad3bb7-7ef8-4d91-941a-3399cdb14969`.

- XML UI và Component của ba nguồn trùng; 250 UI image fill trùng hash/crop/filters/visibility/rotation; 12 Elements và screenshot Elements cũng trùng. Không suy rộng kết luận sang mọi prototype/paint chưa so sánh.
- Dùng node thực tế: `120:2859` Nhài, `120:3302` Sói, `120:3541` Cốm, `120:6560` combo; `77:3506` order success; `127:12445` activation.
- `119:2644` là Button; `80:3647` là bộ thẻ cảm xúc; `96:3131` là slide. Homepage live không có section reviews/quick-order như báo cáo cũ. Không dựng thêm section ngoài source.
- Context toàn frame `127:11871` timeout; đã đọc child success modal `127:10999`, có full frame tree và screenshot. Không tuyên bố có response context nguyên frame khi không nhận được.

## Giai đoạn

| Stage | Trạng thái | Kết quả / phần còn lại |
|---|---|---|
| 0 — Baseline | VERIFIED | Snapshot, kiến trúc, thay đổi có sẵn, build trước sửa |
| 1 — Reconcile sources | VERIFIED | Đối chiếu tree, 250 image fills, 12 Elements và screenshots trong phạm vi nêu trên |
| 2 — Icons & Elements | REPAIRING | 296 instance/frame + SVG vô danh đã kiểm kê; gốc được phục hồi; hover/override còn cần nghiệm thu từng slot |
| 3 — Shared components | REPAIRING | Header/footer/cards/search/cart/form icons/logo; ChatBox artwork khôi phục, backend chưa có |
| 4 — Homepage | REPAIRING | Ảnh/crop/gradient, geometry, fonts, icons, các section theo live source; Minion Pro và giá mẫu vẫn là giới hạn |
| 5 — 24 states | REPAIRING | Tất cả có audit/context/screenshot/reference, chưa đạt toàn bộ acceptance |
| 6 — Responsive/interactions | REPAIRING | 192 mechanical cases PASS; local flows PASS; không coi thay thế nghiệm thu perceptual toàn bộ mobile |
| 7 — Final QA/performance | REPAIRING | Build/production/asset/smoke PASS; không có active GSAP/ScrollTrigger; chưa benchmark thiết bị yếu/network thật, ảnh gốc còn nặng |

## Theo dõi từng màn

Audit VERIFIED dưới đây chỉ xác nhận đã đọc nguồn và so sánh; không phải trạng thái hoàn tất của màn. Icon/asset REPAIRING giữ mở việc nghiệm thu mọi vị trí và state. Functional dùng phân loại độc lập.

| Screen | Figma file key | Frame | Component/section | Audit | Icon | Asset | Visual comparison | Functional | Repair | Evidence | Remaining issues |
|---|---|---|---|---|---|---|---|---|---|---|
| Homepage | `TKRa7opPooD1iBxlr3E0SU` | `56:1033` | Header, hero, emotions, 4 tea cards, gift, steps, philosophy, footer | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI) | REPAIRING | [1920px](evidence/final-capture/56-1033-1920.png) | Minion Pro; giá combo source khác dữ liệu kinh doanh; hover/active chưa nghiệm thu toàn bộ |
| Search — default | `TKRa7opPooD1iBxlr3E0SU` | `127:12938` | Overlay, recent, suggestions | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-12938-1920.png) | Minion Pro; subtitle đã khôi phục; viewport chỉ hiện phần row theo thiết kế |
| Search — results | `TKRa7opPooD1iBxlr3E0SU` | `127:13466` | Input, result card, clear | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-13466-1920.png) | Nội dung/tên/giá dùng danh mục hiện hữu; typography card cần tinh chỉnh |
| Search — no results | `TKRa7opPooD1iBxlr3E0SU` | `127:13960` | Input, no-result copy | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-13960-1920.png) | Wrapping/spacing nhỏ; hover chưa nghiệm thu |
| Products | `TKRa7opPooD1iBxlr3E0SU` | `77:2583` | Signature section, 2×2 listing | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local cart/navigation) | REPAIRING | [1920px](evidence/final-capture/77-2583-1920.png) | Minion Pro; source và document cuối lệch 1px |
| Detail — Bưởi AN | `TKRa7opPooD1iBxlr3E0SU` | `35:3068` | Gallery, services, CTA, story, related, reviews | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI); review data UI_ONLY | REPAIRING | [1920px](evidence/final-capture/35-3068-1920.png) | Minion Pro; nội dung review và bộ lọc sort/rating còn khác/chưa đủ |
| Detail — Nhài THƯƠNG | `TKRa7opPooD1iBxlr3E0SU` | `120:2859` | Gallery, services, CTA, story, related, reviews | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI); review data UI_ONLY | REPAIRING | [1920px](evidence/final-capture/120-2859-1920.png) | Minion Pro; nội dung review và bộ lọc sort/rating còn khác/chưa đủ |
| Detail — Sói CẢM | `TKRa7opPooD1iBxlr3E0SU` | `120:3302` | Gallery, services, CTA, story, related, reviews | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI); review data UI_ONLY | REPAIRING | [1920px](evidence/final-capture/120-3302-1920.png) | Minion Pro; content wrapping, review data, sort/rating |
| Detail — Cốm NHỚ | `TKRa7opPooD1iBxlr3E0SU` | `120:3541` | Gallery, services, CTA, story, related, reviews | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI); review data UI_ONLY | REPAIRING | [1920px](evidence/final-capture/120-3541-1920.png) | Minion Pro; content wrapping, review data, sort/rating |
| Detail — Hộp Quà Tâm Ý | `TKRa7opPooD1iBxlr3E0SU` | `120:6560` | Gallery, four flavor selector, story, reviews | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local UI); review data UI_ONLY | REPAIRING | [1920px](evidence/final-capture/120-6560-1920.png) | Không phải expanded reviews; selector geometry/text và Minion Pro còn cần nghiệm thu |
| Cart — populated | `TKRa7opPooD1iBxlr3E0SU` | `127:8439` | Drawer, selection, stepper, subtotal, checkout | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-8439-1920.png) | Minion Pro; tổng tiền theo dữ liệu thật khác số mẫu Figma; background detail còn residual |
| Cart — empty | `TKRa7opPooD1iBxlr3E0SU` | `127:8870` | Drawer, original cart icon, CTA | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-8870-1920.png) | Typography; background detail còn residual |
| Brand story | `TKRa7opPooD1iBxlr3E0SU` | `33:2786` | Hero/overlay, story text, two photos/crops | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (navigation) | REPAIRING | [1920px](evidence/final-capture/33-2786-1920.png) | Copy/wrapping và spacing nhỏ; frame/footer cuối lệch 1px |
| Contact | `TKRa7opPooD1iBxlr3E0SU` | `127:9562` | Header override, icons, form, validation | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | UI_ONLY (validation VERIFIED_WORKING) | REPAIRING | [1920px](evidence/final-capture/127-9562-1920.png) | Minion Pro; API gửi yêu cầu chưa tồn tại |
| Contact — success | `TKRa7opPooD1iBxlr3E0SU` | `127:10079` | Local modal, original success icon | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | UI_ONLY | REPAIRING | [1920px](evidence/final-capture/127-10079-1920.png) | Text/texture khác nhẹ; chỉ confirmation local, chưa gửi yêu cầu |
| Checkout — delivery | `TKRa7opPooD1iBxlr3E0SU` | `77:3389` | Summary, buyer, delivery/pickup controls, payment, note | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | MOCKED order; local form VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/77-3389-1920.png) | Số tiền dùng dữ liệu hiện hữu; địa chỉ là danh sách ngắn có sẵn; card cao hơn source 9px; chưa có API/payment |
| Order success | `TKRa7opPooD1iBxlr3E0SU` | `77:3506` | Full receipt from local snapshot | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | MOCKED | REPAIRING | [1920px](evidence/final-capture/77-3506-1920.png) | Không phải pickup frame; không có order server/ETA thật; receipt cao hơn 16px; không đổi số tiền thành số mẫu |
| Login — empty | `TKRa7opPooD1iBxlr3E0SU` | `127:11104` | Form, original photo | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | NOT_TESTED Firebase; fail-closed VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-11104-1920.png) | Thiếu config live để xác minh Firebase; copy và secondary links cần nghiệm thu |
| Account activation | `TKRa7opPooD1iBxlr3E0SU` | `127:12445` | Password/confirmation, original photo | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | NOT_TESTED Firebase | REPAIRING | [1920px](evidence/final-capture/127-12445-1920.png) | Không phải filled login; copy/button khác source ở vài chỗ; chưa test tạo user thật |
| Registration | `TKRa7opPooD1iBxlr3E0SU` | `127:12046` | Original intro, three fields, single consent, policy, banner | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | VERIFIED_WORKING (local next-step); Firebase NOT_TESTED | REPAIRING | [1920px](evidence/final-capture/127-12046-1920.png) | Không lưu thêm profile data mới; typography/policy wrapping; thấp hơn source 7px |
| Forgot password | `TKRa7opPooD1iBxlr3E0SU` | `127:10877` | Email reset form, original photo | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | NOT_TESTED sendPasswordResetEmail | REPAIRING | [1920px](evidence/final-capture/127-10877-1920.png) | Source là phone/OTP; giữ email reset Firebase hiện hữu; không giả dịch vụ OTP |
| OTP modal | `TKRa7opPooD1iBxlr3E0SU` | `127:11621` | Original close/clock, four inputs | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | BROKEN service; fail-closed VERIFIED_WORKING | REPAIRING | [1920px](evidence/final-capture/127-11621-1920.png) | Không có challenge/server expiry; 1707 chỉ điền qua Playwright để chụp filled state Figma, không submit/xác thực; không có countdown giả; QA-only state |
| Password reset | `TKRa7opPooD1iBxlr3E0SU` | `127:11753` | Two password fields, original photo | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | BROKEN direct reset service | REPAIRING | [1920px](evidence/final-capture/127-11753-1920.png) | Thiếu verified token/action code; UI QA không đổi mật khẩu thật |
| Password reset — success | `TKRa7opPooD1iBxlr3E0SU` | `127:11871` | Original success icon, modal | VERIFIED | REPAIRING | REPAIRING | MISMATCH_FOUND | UI_ONLY QA state | REPAIRING | [1920px](evidence/final-capture/127-11871-1920.png) | Không có real reset thành công; copy/texture và background form còn khác source |

## Nhật ký sửa quan trọng

| File / nhóm | Thay đổi | Vì sao / kiểm tra |
|---|---|---|
| `FigmaIcon.tsx`, `FigmaArtwork.tsx`, `BrandLogo.tsx` | Dùng SVG/ảnh gốc, crop logo và artwork, giữ viewBox/path/màu | Thay emoji, social text, SVG cart tự vẽ, service check giả; map theo node |
| Header/Footer | Header 148px, utility 28px; footer layout 349px; override user/cart #222 ở contact | Dùng SVG riêng của slot, không recolor path |
| Hero/Home | Hero 934px, title96, gradients gốc, đúng ảnh bốn card, gift/philosophy/steps | Homepage 5925px so source5924; ảnh trước/sau riêng |
| ProductCard/Products | Icon steppers gốc28/40, listing ảnh khác gallery, title/description đúng context | Listing3059 so source3058; catalog price giữ nguyên |
| Detail | Mỗi variant dùng main/story thật; main820×500, thumbnail160²; services56px; story/reviews bố cục source | 4 trang4106 so4105, combo4369 so4368; media filter2→1→2 đã hoạt động |
| Cart/Search/App | Drawer558px, source thumbnail/crop; checked items mới sang checkout; giữ unselected; search tiếng Việt không dấu | Local browser smoke và localStorage assertions |
| Checkout/OrderConfirmation | Geometry/order table/input theo source; receipt từ snapshot local | Giữ handler mock hiện có, không nhận là đơn thật; không đổi data giá |
| Auth | Đúng ảnh; intro/policy/banner register; QA switcher DEV-only; fail closed khi Firebase thiếu/lỗi | Bỏ fallback login/register thành công giả, bỏ bypass bốn số/OTP1234; Firebase module giữ nguyên |
| Contact/Story | Icons/forms/modal gốc; photography và crop gốc | Contact1702 vs1701; Story3774 vs3773 |
| ChatBox | Logo crop, more90°, emotion/link/send SVG, source quick prompts; menu more giữ các gợi ý cũ | Logic local được giữ; artwork attachment không giả upload/backend |
| `useDialogLifecycle.ts` | Escape, scroll lock, focus trap/restore cho overlay | QR/cart/search/contact/auth browser assertions |
| CSS/responsive | Scoped overrides, mobile checkout rows, no overflow; reduced motion | 192 capture cases; không thêm animation làm đổi composition |

## Bằng chứng QA và cách đọc sai số

- `evidence/final-capture/results.json`: 192 measurement records và đường dẫn ảnh.
- `evidence/responsive-summary.json`, `evidence/functional-smoke.json`, `evidence/mobile-smoke.json`, `evidence/production-smoke.json`, `evidence/chat-responsive.json`.
- `evidence/final-comparison-sheet-1.png` … `-4.png`: cặp Figma/localhost của 24 màn.
- `evidence/before-visual-differences.json`, `evidence/final-visual-differences.json`: normalized mean absolute RGB error và % pixel vượt mức15/channel. So sánh không kéo dãn chiều dọc, có pad/crop theo reference. Đây **không phải điểm fidelity, không phải ngưỡng acceptance**; font, số tiền và dữ liệu mẫu khác làm thay đổi số đo.
- Ảnh Figma chi tiết lấy lại native1920×4105/4368 để tránh ảnh export cũ bị giới hạn4096.
- Script/cách chạy lại ở `FUNCTIONAL_AUDIT.md`. Tooling Playwright/sharp nằm ngoài package/lockfile dự án.

## Phần chưa nghiệm thu / cần tiếp tục

1. **BLOCKED — Minion Pro**: chưa tìm được font web gốc được phép nhúng. Georgia fallback vẫn được ghi rõ, không gọi là font chính xác. Đã hỏi vị trí font và chưa có thông tin bổ sung; Spotlight chỉ tìm được reverse-map JSON của Adobe, không phải font.
2. **BLOCKED — Dịch vụ thật**: Firebase live config chưa có để kiểm thử; OTP/reset challenge/action token, order/payment, contact/newsletter, review data và chat backend chưa có trong implementation hiện hữu. Không chế dịch vụ thành công để đạt screenshot.
3. **REPAIRING — visual/state**: các dòng Remaining issues ở bảng; hover/active, một số copy/trạng thái, selector combo, dialog copy/texture cần nghiệm thu tiếp. Chat giữ lời chào local và tên thương hiệu chuẩn thay cho thứ tự tên sai trong source; emotion/attachment hiện là artwork UI_ONLY.
4. **INSPECTING — performance**: không phát hiện active GSAP/ScrollTrigger trong rendered app; reduced motion có hiệu lực. Chưa có benchmark Lighthouse/CPU/network thực; không đổi format/quality ảnh gốc để tránh tổn thất nội dung khi chưa xác minh derivative.

**Không có trạng thái NOT_STARTED bị bỏ qua trong danh sách 24 màn; cũng không có màn nào được tự nâng thành hoàn tất khi còn sai khác.**

## Lượt tiếp theo — thẻ tìm kiếm và sản phẩm liên quan

- Phản hồi “được” đã được nhận; vẫn chưa xác định được đường dẫn Minion Pro. Không thay font bằng một bản tải ngẫu nhiên.
- Baseline bổ sung: `.codex-baseline/2026-11-02/cards-before-094531.tar.gz`; giữ toàn bộ kết quả trước đó.
- `FIGMA_CARD_COPY` ánh xạ tên/subtitle tại `127:13403–13454`; mô tả bốn trà dùng text source, combo dùng `103:6374`, `103:6372`. ProductCard nhận display props, không sửa catalog hay quantity/checkout callbacks.
- Search compact cards khôi phục dòng loại trà; related cards khôi phục mô tả đúng source, tối đa ba dòng và ghi chú mix của combo. Chiều cao desktop các trang chi tiết vẫn4106/4369px.
- Build mới PASS (`evidence/card-followup/build.log`); 12 nhóm functional và touch390/360 PASS. Kiểm tra80 trường hợp bị ảnh hưởng (10 frame ×8 width) không có page error, ảnh hỏng hoặc overflow; đã hợp nhất vào matrix192 hiện tại.
- Bằng chứng bổ sung: `evidence/card-followup/summary.json`, `search-review.png`, `related-review.png`. Không nâng trạng thái visual acceptance: vẫn0/24 nghiệm thu toàn bộ.

## Sai số ảnh trước / sau (không phải điểm nghiệm thu)

| Frame | NMAE trước (%) | NMAE sau (%) | Chiều cao Figma / local |
|---|---|---|---|
| `56:1033` | 27.71 | 1.84 | 5924 / 5925 |
| `127:12938` | 24.21 | 1.79 | 1080 / 1080 |
| `127:13466` | 30.10 | 1.27 | 1080 / 1080 |
| `127:13960` | 31.34 | 1.11 | 1080 / 1080 |
| `77:2583` | 22.96 | 1.75 | 3058 / 3059 |
| `35:3068` | 24.42 | 1.75 | 4105 / 4106 |
| `120:2859` | 23.75 | 1.77 | 4105 / 4106 |
| `120:3302` | 24.21 | 2.54 | 4105 / 4106 |
| `120:3541` | 24.37 | 2.86 | 4105 / 4106 |
| `120:6560` | 29.28 | 2.53 | 4368 / 4369 |
| `127:8439` | 16.45 | 0.91 | 1080 / 1080 |
| `127:8870` | 15.31 | 1.00 | 1080 / 1080 |
| `33:2786` | 33.02 | 1.22 | 3773 / 3774 |
| `127:9562` | 21.37 | 0.94 | 1701 / 1702 |
| `127:10079` | 15.22 | 2.54 | 1080 / 1080 |
| `77:3389` | 25.84 | 2.01 | 2687 / 2696 |
| `77:3506` | 36.30 | 3.93 | 1847 / 1863 |
| `127:11104` | 24.02 | 1.65 | 1271 / 1271 |
| `127:12445` | 21.32 | 2.98 | 1271 / 1271 |
| `127:12046` | 27.90 | 4.48 | 1816 / 1809 |
| `127:10877` | 23.53 | 3.60 | 1261 / 1261 |
| `127:11621` | 16.89 | 2.35 | 1080 / 1080 |
| `127:11753` | 22.73 | 1.97 | 1261 / 1261 |
| `127:11871` | 17.37 | 1.70 | 1080 / 1080 |

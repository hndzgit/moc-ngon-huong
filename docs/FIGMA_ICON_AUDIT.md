# FIGMA ICON AUDIT — 02/11/2026

## Phạm vi và bằng chứng

- Quét live UI page: **482 named nodes**, gồm **296 instance/frame** và 186 group lồng bên trong; giữ các instance lặp, không gộp theo tên. Thuộc tính chi tiết trong `figma-reference/manifests/live-icon-details-0.json` … `-8.json`.
- Các vector vô danh (sao, nút +/−, dấu xác nhận) được kiểm kê thêm ở bảng SVG; không xem bộ lọc tên là toàn bộ artwork.
- `styles` trong JSON là stroke/fill thật của các vector con, gồm opacity và binding; không suy ra từ tên icon.
- Ảnh SVG gốc được copy byte-for-byte vào `public/assets/figma/originals/`. Không sửa path, viewBox hay màu để giả tương đồng.
- Hover/active: giữ component source trong JSON. Không có reaction được trả về không có nghĩa thiết kế không có hover. Các biến thể chưa có bằng chứng được ghi **NOT_VERIFIED**.
- Cột asset bên dưới là ánh xạ theo family/size để truy vết. Những instance có override màu/geometry vẫn cần đối chiếu riêng; không coi candidate cùng tên là đã nghiệm thu.

## Các sai lệch đã sửa

| Trước | Sau | Callsite |
|---|---|---|
| Footer f / ◎ / ♪ | Facebook/Instagram/TikTok gốc 24px | `Footer.tsx` |
| Emoji túi hàng | bag / bag-2 gốc 22/24px đúng slot | `EmotionSelector`, `SignatureBoxSection`, `ProductDetailPage` |
| Cart empty SVG tự vẽ | `127:9320` bold shopping-cart gốc | `CartDrawer` |
| Header icon đúng file nhưng 20px | SVG gốc 28px | `Navbar` |
| Dấu check giống nhau cho 4 dịch vụ | group/box/dollar-circle/airplane, stroke gốc 1.5px | `ProductDetailPage` |
| Ký tự điện thoại/email | call/sms gốc | `ContactPage` |
| Sao/avartar Unicode | Vector sao, check, avatar gốc | `ProductDetailPage`, `ReviewsSection` |
| Emoji lá/muỗng/thiệp | Crop artwork chính xác từ Figma | `FigmaArtwork` |
| Checkbox/radio browser tự vẽ | 4 SVG xuất trực tiếp từ variant gốc | `figma-repair.css` |

## Inventory từng instance / frame

| Screen node | Icon node | Original name / component | Size | Stroke widths | Stroke colors | Fill colors | Visibility / opacity | React | Candidate original | Hover/active | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `33:2786` | `I92:3860;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `33:2786` | `I92:3860;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `33:2786` | `I92:3860;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `33:2786` | `I62:1551;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `33:2786` | `I62:1551;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `33:2786` | `I62:1551;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I92:3685;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I92:3685;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I92:3685;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:5889` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:5900` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:5906` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:5913` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:5919` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I103:5924;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I103:5925;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:6480` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `103:6483` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I120:7847;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I120:7847;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I120:7847;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `35:3068` | `I103:5984;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8440;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8440;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8440;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8461` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8472` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8478` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8485` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8491` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8496;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8497;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8549` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8552` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8610;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8610;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `I127:8610;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8860` | Radio box / Status=Action, type=circle | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8363` | number input / — | 98×38 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8864` | Radio box / Status=Action, type=circle | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8379` | number input / — | 98×38 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `127:8439` | `127:8386` | vuesax/linear/math / vuesax/linear/math | 24×24 | 1.5 | #222222 | none | True / 1 | CartDrawer/SearchOverlay/Auth/ChatBox | `a2171.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:8871;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:8871;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:8871;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8892` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8903` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8909` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8916` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8922` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:8927;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:8928;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8980` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:8983` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:9041;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:9041;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `I127:9041;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:9316` | vuesax/linear/math / vuesax/linear/math | 24×24 | 1.5 | #222222 | none | True / 1 | CartDrawer/SearchOverlay/Auth/ChatBox | `a2171.svg` | NOT_VERIFIED | INSPECTING |
| `127:8870` | `127:9320` | vuesax/bold/shopping-cart / vuesax/bold/shopping-cart | 40×40 | none | none | #3e5641 | True / 1 | CartDrawer | `3bc2b.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7610;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7610;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7610;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3324` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3335` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3341` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3348` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3354` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:3359;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:3360;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3412` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `120:3415` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7955;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7955;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:7955;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `120:3302` | `I120:3540;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:7686;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:7686;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:7686;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6582` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6593` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6599` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6606` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6612` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:6617;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:6618;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6670` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `120:6673` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:8063;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:8063;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:8063;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `120:6560` | `I120:7225;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7572;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7572;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7572;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2881` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2892` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2898` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2905` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2911` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:2916;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:2917;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2969` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `120:2972` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7901;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7901;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:7901;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `120:2859` | `I120:3097;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:7648;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:7648;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:7648;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3563` | number input / — | 208×54 | none | none | none | True / 1 | ProductDetailPage/CartDrawer | `COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3574` | vuesax/linear/group / vuesax/linear/group | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `c92d5.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3580` | vuesax/linear/box / vuesax/linear/box | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `a7960.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3587` | vuesax/linear/dollar-circle / vuesax/linear/dollar-circle | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `5d78b.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3593` | vuesax/linear/airplane / vuesax/linear/airplane | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `34f1f.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:3598;73:794` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | 1.5 | #3e5641 | none | True / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:3599;73:749` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `5f1e6.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3651` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `120:3654` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 24×24 | 1.5 | #292d32 | none | True / 1 | select/ProductDetailPage | `898de.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:8009;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:8009;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:8009;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `120:3541` | `I120:3779;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5577;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5577;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5577;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I80:4149;80:3599` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I80:4149;80:3603` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I80:4149;80:4307` | vuesax/linear/scan / vuesax/linear/scan | 24×24 | 1.5 | #c59a58 | none | True / 1 | EmotionSelector | `41dd0.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I96:3144;96:2991` | vuesax/linear/arrow-left / vuesax/linear/arrow-left | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `f0ea1.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I96:3144;96:2993` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `80:1924` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `80:1926` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `80:1928` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `80:1930` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5468;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5468;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I103:5468;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `56:1033` | `I80:5316;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12939;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12939;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12939;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:12949` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:12952` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12960;80:3599` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12960;80:3603` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:12960;80:4307` | vuesax/linear/scan / vuesax/linear/scan | 24×24 | 1.5 | #c59a58 | none | True / 1 | EmotionSelector | `41dd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:13113;96:2991` | vuesax/linear/arrow-left / vuesax/linear/arrow-left | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `f0ea1.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:13113;96:2993` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:13141` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:13143` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:13145` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:13147` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:13148;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:13148;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `I127:13148;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:12938` | `127:13392` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13467;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13467;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13467;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13477` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13480` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13488;80:3599` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13488;80:3603` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13488;80:4307` | vuesax/linear/scan / vuesax/linear/scan | 24×24 | 1.5 | #c59a58 | none | True / 1 | EmotionSelector | `41dd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13641;96:2991` | vuesax/linear/arrow-left / vuesax/linear/arrow-left | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `f0ea1.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13641;96:2993` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13669` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13671` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13673` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:13675` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13676;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13676;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `I127:13676;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:13466` | `127:14646` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13961;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13961;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13961;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:13971` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:13974` | vuesax/linear/bag / vuesax/linear/bag | 24×24 | none | none | none | False / 1 | ProductDetailPage | `66915.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13982;80:3599` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13982;80:3603` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:13982;80:4307` | vuesax/linear/scan / vuesax/linear/scan | 24×24 | 1.5 | #c59a58 | none | True / 1 | EmotionSelector | `41dd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:14135;96:2991` | vuesax/linear/arrow-left / vuesax/linear/arrow-left | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `f0ea1.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:14135;96:2993` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:14163` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:14165` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:14167` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:14169` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:14170;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:14170;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `I127:14170;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:13960` | `127:14673` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I92:4227;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I92:4227;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I92:4227;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `127:10739` | Radio box / Status=Default, type=circle | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `127:10742` | Radio box / Status=Default, type=circle | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I127:10545;127:10456;45:1965` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 20×20 | 1.5 | #1e261f | none | True / 1 | select/ProductDetailPage | `4f88c.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I127:10545;127:10458;45:1965` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 20×20 | 1.5 | #1e261f | none | True / 1 | select/ProductDetailPage | `4f88c.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I127:10545;127:10459;45:1965` | vuesax/linear/arrow-down / vuesax/linear/arrow-down | 20×20 | 1.5 | #1e261f | none | True / 1 | select/ProductDetailPage | `4f88c.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I127:10545;127:10729` | Radio box / Status=Default, type=square | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I127:10545;127:10732` | Radio box / Status=Default, type=square | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `33:1614` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | none | none | none | False / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `33:1616` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | none | none | none | False / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `33:1618` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | none | none | none | False / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `33:1620` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | none | none | none | False / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I62:2153;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I62:2153;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `77:3389` | `I62:2153;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I92:4262;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I92:4262;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I92:4262;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I77:3614;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I77:3614;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `77:3506` | `I77:3614;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:7735;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:7735;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:7735;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:7774;96:2991` | vuesax/linear/arrow-left / vuesax/linear/arrow-left | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `f0ea1.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:7774;96:2993` | vuesax/linear/arrow-right / vuesax/linear/arrow-right | 24×24 | 1.5 | #ffffff | none | True / 1 | SignatureBoxSection | `39da6.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `120:7802` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 22×22 | 1.5, 2 | #3e5641 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `06869.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `120:7804` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `120:7806` | vuesax/linear/empty-wallet / vuesax/linear/empty-wallet | 22×22 | 1, 1.5 | #ffffff | none | True / 1 | EmotionSelector/SignatureBoxSection/ProductDetailPage | `df75c.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `120:7808` | vuesax/linear/bag / vuesax/linear/bag | 22×22 | none | none | none | False / 1 | ProductDetailPage | `dfcd0.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:8117;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:8117;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `77:2583` | `I120:8117;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9971;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9971;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9971;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `127:9607` | vuesax/linear/call / vuesax/linear/call | 24×24 | 1.5 | #3e5641 | none | True / 1 | ContactPage | `ccb33.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `127:9613` | vuesax/linear/sms / vuesax/linear/sms | 24×24 | 1.5 | #3e5641 | none | True / 1 | ContactPage | `3eb6c.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9623;73:760` | vuesax/linear/send-2 / vuesax/linear/send-2 | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | ContactPage/ChatBox | `98dd5.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9933;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9933;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar (contact override) | `d0415.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:9933;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #222222 | none | True / 1 | Navbar (contact override) | `2dc38.svg` | NOT_VERIFIED | INSPECTING |
| `127:9562` | `I127:10025;80:5094` | vuesax/bold/messages / vuesax/bold/messages | 40×40 | none | none | #ffffff | True / 1 | ChatBox | `191f0.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10080;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10080;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10080;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `127:10090` | vuesax/linear/call / vuesax/linear/call | 24×24 | 1.5 | #3e5641 | none | True / 1 | ContactPage | `ccb33.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `127:10096` | vuesax/linear/sms / vuesax/linear/sms | 24×24 | 1.5 | #3e5641 | none | True / 1 | ContactPage | `3eb6c.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10106;73:760` | vuesax/linear/send-2 / vuesax/linear/send-2 | 24×24 | 1, 1.5 | #ffffff | none | True / 1 | ContactPage/ChatBox | `98dd5.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10107;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10107;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar (contact override) | `d0415.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `I127:10107;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #222222 | none | True / 1 | Navbar (contact override) | `2dc38.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `127:9731` | vuesax/linear/math / vuesax/linear/math | 24×24 | 1.5 | #222222 | none | True / 1 | CartDrawer/SearchOverlay/Auth/ChatBox | `a2171.svg` | NOT_VERIFIED | INSPECTING |
| `127:10079` | `127:9734` | Successmark / — | 100×100 | none | none | #3e5641, #ffffff | True / 1 | ContactPage/AuthPage | `75b73.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11529;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11529;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11529;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11583;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11583;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:10877` | `I127:11583;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11754;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11754;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11754;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11763;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11763;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:11753` | `I127:11763;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11872;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11872;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11872;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11883;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11883;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `I127:11883;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `127:11006` | vuesax/linear/math / vuesax/linear/math | 24×24 | 1.5 | #333333 | none | True / 1 | CartDrawer/SearchOverlay/Auth/ChatBox | `a2171.svg` | NOT_VERIFIED | INSPECTING |
| `127:11871` | `127:11009` | Successmark / — | 100×100 | none | none | #3e5641, #ffffff | True / 1 | ContactPage/AuthPage | `75b73.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11627;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11627;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11627;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11636;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11636;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `I127:11636;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:11621` | `127:11085` | vuesax/linear/math / vuesax/linear/math | 24×24 | 1.5 | #333333 | none | True / 1 | CartDrawer/SearchOverlay/Auth/ChatBox | `a2171.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11437;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11437;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11437;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `127:11425` | Radio box / Status=Default, type=square | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11491;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11491;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:11104` | `I127:11491;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12446;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12446;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12446;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12464;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12464;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:12445` | `I127:12464;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12390;103:3673` | Facebook / Negative / Facebook / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `39634.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12390;103:3675` | Instagram / Negative / Instagram / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `dc19d.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12390;103:3676` | TikTok / Negative / TikTok / Negative | 24×24 | none | none | #ffffff | True / 1 | Footer | `eface.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `127:12096` | Radio box / Status=Default, type=square | 24×24 | none | none | none | True / 1 | native accessible input + SVG background | `checkbox/radio exported variants` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12352;92:3664` | vuesax/linear/search-normal / vuesax/linear/search-normal | 28×28 | 1.5 | #222222 | none | True / 1 | Navbar/SearchOverlay | `5bc29.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12352;92:3665` | vuesax/linear/user / vuesax/linear/user | 28×28 | 1.5 | #292d32 | none | True / 1 | Navbar | `b685b.svg` | NOT_VERIFIED | INSPECTING |
| `127:12046` | `I127:12352;92:3666` | vuesax/linear/bag-2 / vuesax/linear/bag-2 | 28×28 | 1.5, 2 | #292d32 | none | True / 1 | Navbar/EmotionSelector/SignatureBoxSection | `64a36.svg` | NOT_VERIFIED | INSPECTING |

## SVG structure và vector vô danh

File SVG trong repo là bằng chứng geometry đầy đủ. Dưới đây kiểm kê root/viewBox và path counts, không tái vẽ từ trí nhớ.

| Original asset node | Local SVG | viewBox | paths | Stroke widths | Stroke/fill colors |
|---|---|---|---|---|---|
| `75:3742` | `figma-reference/assets/vectors/source-a_frame2077592183_75-3742_0298a.svg` | `0 0 28 28` | 1 |  | #666666, #D9D9D9 |
| `80:1923` | `figma-reference/assets/icons/source-a_vuesaxlinearbag2_80-1923_06869.svg` | `0 0 22 22` | 4 | 1.5, 2 | #3E5641 |
| `127:11085` | `figma-reference/assets/icons/source-a_vuesaxlinearmath_127-11085_0f134.svg` | `0 0 24 24` | 2 | 1.5 | #333333 |
| `77:2851` | `figma-reference/assets/vectors/source-a_frame2077592185_77-2851_17697.svg` | `0 0 40 40` | 1 |  | #666666, #D9D9D9 |
| `80:5094` | `figma-reference/assets/icons/source-a_vuesaxboldmessages_80-5094_191f0.svg` | `0 0 40 40` | 2 |  | white |
| `I80:5108;290:1688` | `figma-reference/assets/icons/source-a_more_I80-5108_290-1688_1b7a5.svg` | `0 0 32 32` | 4 | 1.5 | white |
| `96:2952` | `figma-reference/assets/vectors/source-a_ellipse7_96-2952_21f9c.svg` | `0 0 4 4` | 0 |  | #8E6746 |
| `I96:2993;80:1978` | `figma-reference/assets/icons/source-a_frame2077592254_I96-2993_80-1978_2efd9.svg` | `0 0 72 12` | 0 |  | #8E6746, white |
| `103:5919` | `figma-reference/assets/icons/source-a_vuesaxlinearairplane_103-5919_34f1f.svg` | `0 0 24 24` | 1 | 1.5 | #3E5641 |
| `9:87` | `figma-reference/assets/icons/source-a_vuesaxlinearbag1_9-87_35ba2.svg` | `0 0 24 24` | 6 | 1.5 | #3E5641 |
| `103:3672` | `figma-reference/assets/icons/source-a_facebooknegative_103-3672_39634.svg` | `0 0 24 24` | 1 |  | white |
| `96:2992` | `figma-reference/assets/icons/source-a_vuesaxlineararrowright_96-2992_39da6.svg` | `0 0 24 24` | 1 | 1.5 | white |
| `127:9320` | `figma-reference/assets/icons/source-a_vuesaxboldshoppingcart_127-9320_3bc2b.svg` | `0 0 40 40` | 4 |  | #3E5641 |
| `103:6432` | `figma-reference/assets/icons/source-a_check_103-6432_3c44d.svg` | `0 0 12 12` | 1 | 2 | white |
| `127:9613` | `figma-reference/assets/icons/source-a_vuesaxlinearsms_127-9613_3eb6c.svg` | `0 0 24 24` | 2 | 1.5 | #3E5641 |
| `unknown` | `figma-reference/assets/icons/source-a_vuesaxlinearscan_unknown_41dd0.svg` | `0 0 24 24` | 6 | 1.5 | #C59A58 |
| `80:5109` | `figma-reference/assets/icons/source-a_math_80-5109_4983f.svg` | `0 0 32 32` | 2 | 2 | white |
| `I127:10456;45:1965` | `figma-reference/assets/icons/source-a_vuesaxlineararrowdown_I127-10456_45-1965_4f88c.svg` | `0 0 20 20` | 1 | 1.5 | #1E261F |
| `127:11100` | `figma-reference/assets/icons/source-a_vuesaxlinearclock_127-11100_54997.svg` | `0 0 24 24` | 2 | 1.5 | #3E5641 |
| `127:14673` | `figma-reference/assets/icons/source-a_vuesaxlinearsearchnormal_127-14673_5bc29.svg` | `0 0 28 28` | 2 | 1.5 | #222222 |
| `103:5913` | `figma-reference/assets/icons/source-a_vuesaxlineardollarcircle_103-5913_5d78b.svg` | `0 0 24 24` | 3 | 1.5 | #3E5641 |
| `103:5925` | `figma-reference/assets/icons/source-a_vuesaxlinearemptywallet_103-5925_5f1e6.svg` | `0 0 24 24` | 5 | 1.5 | white |
| `77:3269` | `figma-reference/assets/vectors/source-a_vector1_77-3269_5f455.svg` | `0 0 26.0001 25` | 1 | 2 | #3E5641, url(#paint0_linear_0_25) |
| `I92:3685;92:3666` | `figma-reference/assets/icons/source-a_vuesaxlinearbag2_I92-3685_92-3666_64a36.svg` | `0 0 28 28` | 4 | 1.5, 2 | #292D32 |
| `103:5924` | `figma-reference/assets/icons/source-a_vuesaxlinearbag_103-5924_66915.svg` | `0 0 24 24` | 6 | 1.5 | #3E5641 |
| `127:11009` | `figma-reference/assets/icons/source-a_successmark_127-11009_75b73.svg` | `0 0 99.9977 99.9993` | 2 |  | #3E5641, white |
| `80:5118` | `figma-reference/assets/vectors/source-a_group_80-5118_7cd18.svg` | `0 0 28.6667 28.6667` | 2 | 2 | #666666 |
| `9:31` | `figma-reference/assets/icons/source-a_vuesaxlinearbag_9-31_805a2.svg` | `0 0 24 24` | 6 | 1.5 | white |
| `103:6382` | `figma-reference/assets/icons/source-a_vuesaxlineararrowdown_103-6382_898de.svg` | `0 0 24 24` | 1 | 1.5 | #292D32 |
| `I127:9623;73:760` | `figma-reference/assets/icons/source-a_vuesaxlinearsend2_I127-9623_73-760_98dd5.svg` | `0 0 24 24` | 3 | 1.5 | white |
| `127:9731` | `figma-reference/assets/icons/source-a_vuesaxlinearmath_127-9731_a2171.svg` | `0 0 24 24` | 2 | 1.5 | #222222 |
| `103:5906` | `figma-reference/assets/icons/source-a_vuesaxlinearbox_103-5906_a7960.svg` | `0 0 24 24` | 4 | 1.5 | #3E5641 |
| `I92:3685;92:3665` | `figma-reference/assets/icons/source-a_vuesaxlinearuser_I92-3685_92-3665_b685b.svg` | `0 0 28 28` | 2 | 1.5 | #292D32 |
| `80:4939` | `figma-reference/assets/icons/source-a_math_80-4939_bb316.svg` | `0 0 24 24` | 2 | 1.5 | white |
| `77:2854` | `figma-reference/assets/vectors/source-a_frame2077592183_77-2854_c2169.svg` | `0 0 40 40` | 1 |  | #666666, #D9D9D9 |
| `103:5900` | `figma-reference/assets/icons/source-a_vuesaxlineargroup_103-5900_c92d5.svg` | `0 0 24 24` | 8 | 1.5 | #3E5641 |
| `127:9607` | `figma-reference/assets/icons/source-a_vuesaxlinearcall_127-9607_ccb33.svg` | `0 0 24 24` | 1 | 1.5 | #3E5641 |
| `103:6426` | `figma-reference/assets/vectors/source-a_a_103-6426_cdae9.svg` | `0 0 60 60` | 2 | 2 | #3E5641, #F7F4D5 |
| `103:3675` | `figma-reference/assets/icons/source-a_group_103-3675_dc19d.svg` | `0 0 23.9859 23.9953` | 3 |  | white |
| `77:3262` | `figma-reference/assets/vectors/source-a_vector_77-3262_dc368.svg` | `0 0 26.0001 25` | 1 | 2 | #3E5641 |
| `80:1927` | `figma-reference/assets/icons/source-a_vuesaxlinearemptywallet_80-1927_df75c.svg` | `0 0 22 22` | 5 | 1.5 | white |
| `119:2645` | `figma-reference/assets/icons/source-a_vuesaxlinearbag_119-2645_dfcd0.svg` | `0 0 22 22` | 6 | 1.5 | white |
| `75:3745` | `figma-reference/assets/vectors/source-a_frame2077592184_75-3745_e2aae.svg` | `0 0 28 28` | 1 |  | #666666, #D9D9D9 |
| `I103:3675;769:1986` | `figma-reference/assets/icons/source-a_tiktoknegative_I103-3675_769-1986_eface.svg` | `0 0 24 24` | 1 |  | white |
| `96:2990` | `figma-reference/assets/icons/source-a_vuesaxlineararrowleft_96-2990_f0ea1.svg` | `0 0 24 24` | 1 | 1.5 | white |
| `80:5122` | `figma-reference/assets/icons/source-a_vuesaxlinearlink_80-5122_f22ce.svg` | `0 0 32 32` | 3 | 2 | #666666 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_65b4613c83.svg` | `0 0 13.5374 13.6552` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_726eaebff4.svg` | `0 0 28 28` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_8f85c7c233.svg` | `0 0 24 24` | 8 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_965f1282b2.svg` | `0 0 24 24` | 6 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_ed9a909385.svg` | `0 0 24 23.8542` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_4b0ae0dd89.svg` | `0 0 24 24` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_f76dd22d37.svg` | `0 0 24 24` | 4 | 1.5, 2 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_9197d238ba.svg` | `0 0 24 24` | 3 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_0135688431.svg` | `0 0 24 24` | 5 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_88b753955a.svg` | `0 0 18 13` | 1 | 2 | black |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_d30c149aef.svg` | `0 0 2.38038 11.5165` | 1 |  | #7D806A |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_1a5538c0e6.svg` | `0 0 26.0001 25` | 1 | 2 | #3E5641, url(#paint0_linear_0_567) |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_ccc038da23.svg` | `0 0 24 24` | 8 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_9e4b5aadef.svg` | `0 0 28 28` | 2 | 1.5 | #222222 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_f21703aa6f.svg` | `0 0 10 7.5` | 1 | 2 | #999999 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_6850084cbe.svg` | `0 0 28 28` | 4 | 1.5, 2 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_46b199c79b.svg` | `0 0 23.9859 23.9953` | 3 |  | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_c45a35ba7f.svg` | `0 0 24 24` | 4 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_59750bf460.svg` | `0 0 24 24` | 1 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_90479999df.svg` | `0 0 24 23.8542` | 1 |  | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_dd9f0c8980.svg` | `0 0 24 24` | 6 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_b3d53cfa1e.svg` | `0 0 24 24` | 2 | 1.5 | #222222 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_0ceb7632e4.svg` | `0 0 24 24` | 1 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_b463b057c4.svg` | `0 0 24 24` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e18a89c8ee.svg` | `0 0 24 19.5007` | 1 |  | #7D806A |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_4514c8b3f3.svg` | `0 0 24 24` | 4 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_5212fa25e9.svg` | `0 0 6.76884 12.8555` | 1 |  | #7D806A |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_31e6a040d0.svg` | `0 0 22 22` | 5 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_7762734ffb.svg` | `0 0 22 22` | 4 | 1.5, 2 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_2c28aa926d.svg` | `0 0 24 24` | 1 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e6528c6f3e.svg` | `0 0 24 24` | 2 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_6e811f1310.svg` | `0 0 24 24` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_65f932666e.svg` | `0 0 24 24` | 1 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_4b0a3f8cde.svg` | `0 0 24 24` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_ac34f2586e.svg` | `0 0 22 22` | 6 | 1.3 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_bda00581c4.svg` | `0 0 20.5 24` | 1 |  | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_fec6c9454c.svg` | `0 0 72 12` | 0 |  | #8E6746, white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_38a498e11a.svg` | `0 0 24 24` | 1 | 1.5 | #666666 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_3649bca52f.svg` | `0 0 23.9859 23.9953` | 3 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_192e86e7d3.svg` | `0 0 20 20` | 1 | 1.5 | #333333 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_edc5698b4c.svg` | `0 0 24 24` | 1 | 1.5 | #333333 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_a9ef8b44a5.svg` | `0 0 20 20` | 1 | 1.5 | #333333 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_3a49f2ea77.svg` | `0 0 20 20` | 1 | 1.5 | #1E261F |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_b36471cc36.svg` | `0 0 24 24` | 3 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_ee82cd678f.svg` | `0 0 13.5374 13.6552` | 1 |  | #7D806A |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_c0ec64d942.svg` | `0 0 24 24` | 1 | 1.5 | #222222 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_243e0dc39d.svg` | `0 0 24 24` | 5 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_dec6be36ab.svg` | `0 0 24 24` | 6 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e668f147d8.svg` | `0 0 24 24` | 1 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_4eb783bd76.svg` | `0 0 32 32` | 4 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_ba0c19bf5e.svg` | `0 0 28.6667 28.6667` | 2 | 2 | #666666 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_fa3c2fd87e.svg` | `0 0 28 28` | 2 | 1.5 | #222222 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_1946375dda.svg` | `0 0 24 24` | 2 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_80ba3e3650.svg` | `0 0 28 28` | 4 | 1.5, 2 | #222222 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_7849894cb1.svg` | `0 0 24 24` | 2 |  | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_dc7dc7e791.svg` | `0 0 24 24` | 1 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_65cb403f6b.svg` | `0 0 24 24` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_7cdf45e5d2.svg` | `0 0 24 19.5007` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e095570f17.svg` | `0 0 2.38038 11.5165` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_775edd1494.svg` | `0 0 22 22` | 6 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_f12ecb2d52.svg` | `0 0 20.5 24` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_1e78710dbe.svg` | `0 0 6.76884 12.8555` | 1 |  | #ABA195 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_24a31964e8.svg` | `0 0 24 24` | 2 | 1.5 | #333333 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_23b3b9b794.svg` | `0 0 99.9977 99.9993` | 2 |  | #3E5641, white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_69defe60ac.svg` | `0 0 22 22` | 6 | 1.5 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_70661c069c.svg` | `0 0 24 24` | 2 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_0693a075fd.svg` | `0 0 24 24` | 2 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_96e16d3a12.svg` | `0 0 20 20` | 6 | 1.5 | #3E5641 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_39a9284dc7.svg` | `0 0 22 22` | 6 | 1.3 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_aee792b788.svg` | `0 0 24 24` | 6 | 1.5 | #C59A58 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_c41a2b26ae.svg` | `0 0 24 24` | 6 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_918faf1475.svg` | `0 0 22 22` | 3 | 1.3 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e014d8fa3b.svg` | `0 0 24 24` | 3 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_b9734b301e.svg` | `0 0 32 32` | 3 | 2 | #666666 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_a8b89976df.svg` | `0 0 40 40` | 2 | 2 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_dc602a267a.svg` | `0 0 32 32` | 2 | 2 | white |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e18c6c2c7b.svg` | `0 0 24 24` | 3 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_07a212b97f.svg` | `0 0 8 8` | 0 |  | #00FF37 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_5f2796102c.svg` | `0 0 24 24` | 1 | 1.5 | #292D32 |
| `download_assets` | `figma-reference/assets/icons/source-a_raw-svg_e9eeb257c7.svg` | `0 0 24 24` | 1 | 1.5 | white |

## SVG controls xuất mới

| Variant | Node | File | SHA-256 |
|---|---|---|---|
| checkbox-default | `127:8845` | `public/assets/figma/originals/checkbox-default.svg` | `44823bdc4242a8781df8f395ee00753c3a39b1eaa9107b768e32e5fb9ab148fc` |
| checkbox-checked | `127:8849` | `public/assets/figma/originals/checkbox-checked.svg` | `baf4cc7f89a5de88c985d58d24d229143a3994c7665d8e887a93168321f0cd01` |
| radio-default | `127:8847` | `public/assets/figma/originals/radio-default.svg` | `196444084775def9155c595c24ff62d61108bf8d1fbc8e74d9fb89bae42f831c` |
| radio-checked | `127:8852` | `public/assets/figma/originals/radio-checked.svg` | `86723ce0b91e02be5a6277128719c169e09717366dd51a92f2d928fd21712d94` |

## Còn lại

- ChatBox: đã khôi phục launcher và close gốc, kích thước 576×700 desktop; more/emotion/link đã có SVG và rotation gốc; lời chào local, thứ tự tên thương hiệu và các trạng thái hội thoại còn khác source; emotion/attachment chỉ là artwork, chưa có picker/upload. Logic trả lời hiện là local rules, phân loại MOCKED, không phải AI backend.
- OTP: đã thêm clock và close gốc. Không dựng countdown giả khi không có challenge từ server; dấu — thể hiện không có mã đang hoạt động.
- Header contact có override #222222 riêng cho user/bag-2 (`d0415.svg`, `2dc38.svg`), đã map theo currentPage thay vì đổi màu SVG chung.
- Menu mobile không có frame Figma tương ứng: giữ thích ứng hiện hữu, không coi là original desktop asset.
- `CraftmanshipSection` dùng Lucide nhưng không được import/render trong App; được giữ nguyên theo quy tắc không sửa phần không dùng.
- Không tuyên bố đã xác minh mọi vị trí/hover của 296 icon. Các chỗ chưa map được ghi thiếu mapping; không chế icon thay thế.

Star vector có bounds 24×23; SVG export gồm stroke bleed 1px mỗi cạnh (26×25). FigmaIcon giữ path/viewBox và margin−1 để giữ layout24×23 cùng stroke2px.


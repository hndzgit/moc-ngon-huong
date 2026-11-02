<!-- V7_CURRENT -->
> **Đối chiếu lại V7 — 02/11/2026:**250 image-fill rows UI của A/B/C trùng nhau và trùng snapshot cũ trong toàn bộ trường đã so. Component page được quét trực tiếp ở cả ba file:11 set/50 variant +2 component độc lập; các IDs/tên/children giống nhau. Manifest cũ ghi51, báo cáo49 không phải inventory đầy đủ: Header là COMPONENT, gift có4 variant, Button12, set thật `120:7121`, có input set `132:4216`. [Raw UI](evidence/v7/source-reverification.json), [Component C](evidence/v7/live-component-page.json), [V7](CODEX_FULL_REPAIR_V7.md). Không suy rộng ra mọi paint/text/prototype. Các checksum XML và ghi chú dưới đây thuộc lần audit trước, không bị sửa để hợp thức hóa số liệu mới.

# Đối chiếu nguồn trực tiếp — 02/11/2026

Đã đọc cả ba file qua Figma MCP, không chỉ dùng báo cáo cũ.

| Nội dung kiểm tra | Kết quả |
|---|---|
| UI page `0:1`, XML toàn cây A/B/C | SHA-256 cùng là `2518e53c919181eb66056c6c2855751fb8b6133db5048a23d7fdbf88c6a69ab1` |
| Component page `64:2870`, XML A/B/C | SHA-256 cùng là `ecc3f245a4ffc75eccd567aa5d7ec353616873a49a2b6d6b125c99c285150257` |
| 250 lớp IMAGE trên UI page A/B/C | Hash ảnh, crop matrix, kích thước, visibility, rotation, opacity và filters trùng; SHA-256 canonical rows `b09647da3ccf38c2fdcbe6dc5b7b59df0b71a7e2547aa1863331201e97dabba8` |
| 12 lớp IMAGE trong Elements `18:105` | Image hash, crop, rotation, opacity và kích thước trùng nhau |
| Screenshot Elements live A/B/C, 3607×2622 | SHA-256 cùng là `763975cc62d013c5c41e24ee33022b2d3fa86442b623c9d6247efecb378ef942` |

Bằng chứng: `figma-reference/comparison/live-*`, `docs/evidence/figma-elements-source-{a,b,c}.png`. Kết luận này xác nhận cây, toàn bộ 250 image fill trên UI page và Elements đã kiểm tra; không suy rộng thành toàn bộ paint/prototype trong ba file giống nhau khi chưa có phép so sánh tương ứng.

## Nhãn cần sửa trong tài liệu trước và master prompt

| Node | Nhãn được báo trước | Nội dung live thực tế |
|---|---|---|
| `120:2859` | Cốm | Trà hương Nhài – THƯƠNG |
| `120:3302` | Nhài | Trà hương Sói – CẢM |
| `120:3541` | Sói | Trà hương Cốm – NHỚ |
| `120:6560` | Bưởi expanded reviews | Chi tiết Hộp Quà Tâm Ý, có bộ chọn bốn vị |
| `77:3506` | Store pickup | Trang Đặt Hàng Thành Công |
| `127:12445` | Filled login | Kích hoạt tài khoản, tạo và xác nhận mật khẩu |
| `119:2644` | Product Card | Button variant 241×62 |
| `80:3647` | Four-tea accordion | Bộ thẻ cảm xúc, tám variant 402×156 |
| `96:3131` | Toàn bộ gift section | Variant slide 789×562 thuộc Component 8 |
| `80:1906` trên Homepage | Reviews / quick order | Cột nội dung Hộp Quà Tâm Ý |

Đã theo hình, text và node thực tế khi map asset. Giữ tab pickup hiện hữu như một thích ứng chức năng bổ sung, không nhận nó là frame `77:3506`. Không thêm reviews/accordion/quick-order vào Homepage nếu chúng không có trong cây và screenshot hiện tại.

## Font

Quét text nodes của UI page trả về: Montserrat Regular/Medium/Bold/Italic, Philosopher Regular/Bold, Minion Pro Regular/Medium, Inter Regular, Roboto Regular/Light, Montserrat Alternates Regular/Medium. Không thấy BDFVn hoặc SVN-Effra trên UI page trong phép đọc này. Minion Pro chưa có font web được phép nhúng trong dự án/các thư mục font đã kiểm tra; các slot đó hiện dùng fallback Georgia và chưa đạt typography chính xác. Đã hỏi vị trí font, chưa nhận được thông tin bổ sung.

## Giá và nội dung mâu thuẫn

Figma thể hiện nhiều mức giá cho cùng nhóm sản phẩm: combo ở Homepage 229,000đ, ở chi tiết/listing 399,000đ; bảng checkout dùng giá mẫu khác; một số variant selector 75,000đ trong khi dữ liệu giỏ hàng là hộp 289,000đ. Không thay đổi giá trị số của danh mục sản phẩm. Chỉ đổi dấu phân nhóm hiển thị sang dạng dấu phẩy theo Figma.

Một số copy trong source vẫn có tên thương hiệu cũ hoặc thứ tự tên khác. Các khác biệt liên quan chức năng thật (OTP điện thoại so với Firebase email reset) được ghi riêng, không dựng luồng xác thực giả để đạt ảnh chụp.

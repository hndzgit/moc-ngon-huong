# V10 — Đối chiếu yêu cầu học thuật

Ngày 02/11/2026. Chưa tìm thấy bản độc lập của tài liệu “ĐỊNH HƯỚNG VỀ XÂY DỰNG WEB MỘC NGÔN HƯƠNG” trong repository/attachment. Phạm vi dưới đây căn cứ nội dung V10 người dùng cung cấp, không nhận là đã đọc toàn văn tài liệu gốc.

Định vị: **MỘC NGÔN HƯƠNG — TRAO HƯƠNG, GỬI LỜI THƯƠNG.**

## Từ yêu cầu đến trải nghiệm

| Câu hỏi của khách | Chức năng đã triển khai | Giới hạn thực tế |
|---|---|---|
| Tôi muốn gửi điều gì? | Hero dẫn tới `#/chon-qua`; 4 intention có state, gợi ý CẢM/THƯƠNG/AN/NHỚ | Mapping là định hướng biên tập V10, không phải chẩn đoán cảm xúc |
| Hương trà nào phù hợp? | Bước2 chọn/đổi cảm xúc; bước3 đồng bộ ảnh, tên, hương/vị, thành phần và cách pha từ catalog | Không tự thêm chứng nhận, vùng nguyên liệu hoặc công dụng sức khỏe |
| Trong hộp có gì? | Bước4 chọn hộp trà theo vị hoặc Tâm Ý; bước5 và gallery trình bày packaging/includedFlavors có sẵn | Không thêm quy cách hộp hoặc dịch vụ vật lý chưa được bán |
| Giá bao nhiêu? | Giá trực tiếp `PRODUCTS`: 289.000đ/hộp theo vị, 399.000đ/Tâm Ý | Giá catalog giữ nguyên; tùy chỉnh cần tư vấn, chưa có phụ phí xác nhận |
| Cá nhân hóa và mua thế nào? | Nhập tên/lời nhắn, 2 bố cục preview số, summary, thêm SKU vào giỏ, đi checkout hoặc liên hệ | Preview2D không phải mẫu thiệp in đã xác nhận. Order/inquiry cần backend; không báo thành công giả |

## Business Model Canvas — hỗ trợ mô hình, không tự xác nhận kế hoạch kinh doanh

| Thành phần | Phần frontend hỗ trợ | Việc kinh doanh còn cần xác nhận |
|---|---|---|
| Value propositions | Chọn quà từ lời muốn gửi; trà mang cảm xúc; lời nhắn có xem trước | Giá trị thực tế của dịch vụ in/cá nhân hóa |
| Customer segments | Luồng khách cá nhân và trang quà doanh nghiệp riêng | Quy mô phân khúc và nhu cầu thực tế |
| Channels | GitHub Pages/hash routes, liên kết chiến dịch tới từng cảm xúc, trang sản phẩm | Domain cuối, tài khoản social/analytics chính thức |
| Customer relationships | Luồng guest không buộc login; sửa lựa chọn không mất bản nháp; CTA tư vấn | Nhân sự hỗ trợ, CRM và quy trình phản hồi |
| Key resources | Original Figma assets, catalog, nội dung trà, hệ thống React/GSAP hiện có | Nguồn lực sản xuất, tồn kho và quyền nội dung |
| Cost structure | Phân biệt giá sản phẩm và tùy chỉnh cần báo giá | Giá vốn, phí dịch vụ, giao hàng, chiết khấu không được tự tạo |

## Marketing 7Ps

| P | Hiện thực trong bản V10 |
|---|---|
| Product | 4 hương trà và hộp Tâm Ý có thật trong catalog; gallery, nội dung hộp, so sánh hương |
| Price | Giá catalog thống nhất từ một nguồn; chưa gộp phí tùy chỉnh chưa được xác nhận |
| Place | Website guest trên kiến trúc Pages hiện có; không thay hosting/domain |
| Promotion | Deep link cảm xúc phục vụ landing phù hợp chiến dịch; không tự phát hành chiến dịch/ưu đãi |
| People | Trang B2B chuẩn bị thông tin cho người tư vấn; không hứa thời gian phản hồi hay năng lực sản xuất |
| Process | Điều muốn gửi → cảm xúc → hương trà → sản phẩm → món quà; quay lại sửa được |
| Physical evidence | Ảnh thật, bao bì thật, artwork gốc; preview2D được phân biệt rõ với sản phẩm vật lý |

## IMC — liên kết chiến dịch dùng được

Hash nằm sau base Pages `/moc-ngon-huong/`; không cần backend rewrite.

- Tri ân: `#/chon-qua?cam-xuc=CAM&buoc=2` → Hoa Sói/CẢM.
- Tình thân: `#/chon-qua?cam-xuc=THUONG&buoc=2` → Nhài/THƯƠNG.
- Bình an: `#/chon-qua?cam-xuc=AN&buoc=2` → Bưởi/AN.
- Nỗi nhớ: `#/chon-qua?cam-xuc=NHO&buoc=2` → Cốm/NHỚ.
- Quà tổ chức: `#/qua-doanh-nghiep`.

Campaign seed có thể đổi trong giao diện; không ghi tên người nhận/lời nhắn vào URL. Query không hợp lệ về trạng thái an toàn. Chưa thêm analytics hoặc số liệu chuyển đổi. Test bốn deep link, refresh và invalid query: [EMOTION_JOURNEY_TESTS](EMOTION_JOURNEY_TESTS.md).

## Nội dung cần chủ dự án hoàn thiện

Xác nhận quyền nhúng Minion Pro; phê duyệt copy/thuộc tính catalog hiện có; dịch vụ thiệp vật lý, khả năng cá nhân hóa, chi phí, quy trình tư vấn B2B và vận hành đơn hàng. Chưa thay các dữ liệu này bằng suy đoán. Domain/Firebase thật tiếp tục hoãn đúng V10.

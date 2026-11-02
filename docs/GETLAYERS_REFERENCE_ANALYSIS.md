# V10 — Phân tích tham chiếu và benchmark

Ngày truy cập: 02/11/2026 (Asia/Ho_Chi_Minh). Nghiên cứu phục vụ trải nghiệm mới, không thay nguồn sự thật về sản phẩm hoặc tài sản thương hiệu.

## 1. Phạm vi, giấy phép và tài liệu học thuật

- Đã mở trang công khai của cả năm GetLayers reference được yêu cầu. Không có GetLayers MCP trong danh sách công cụ hiện tại; không truy cập tài khoản trả phí, không mua dịch vụ, không tải prompt/source premium, không cài template Next.js.
- Browser Chromium nhận HTTP200 và title đúng cho5/5 URL. Các trang hiển thị thư viện/premium prompt; không có iframe demo được mount trong lượt đọc công khai. [Log browser](evidence/v10/references/getlayers-browser.json); có screenshot từng trang cùng thư mục.
- Các hành vi bên dưới được **trang giới thiệu công khai mô tả**; không nhận là đã kiểm thử đầy đủ demo, mã nguồn, thuật toán hoặc hiệu năng của chúng. Bản Mộc Ngôn Hương tự xây dựng bằng React/Vite và motion utilities hiện có.
- Tìm theo tên file và cụm tiêu đề trong repository cùng các attachment hiện có không tìm được một tài liệu học thuật độc lập mang tên **“ĐỊNH HƯỚNG VỀ XÂY DỰNG WEB MỘC NGÔN HƯƠNG”**. Chỉ thấy tên đó được nhắc trong prompt V10. Không quét nội dung tài liệu cá nhân ngoài phạm vi dự án. Vì vậy, yêu cầu học thuật được căn cứ vào nội dung người dùng cung cấp trong V10; chưa thể xác nhận toàn văn bản gốc.
- Ảnh minh họa, chứng nhận, giá và tuyên bố của các thương hiệu tham khảo không được chuyển sang catalog Mộc Ngôn Hương.

## 2. GetLayers — nguồn đã truy cập và nguyên lý chọn lọc

| Reference và nguồn trực tiếp | Nội dung công khai quan sát được | Nguyên lý phù hợp cho Mộc Ngôn Hương | Phần không đưa vào |
|---|---|---|---|
| [Herbier Blanc](https://www.getlayers.ai/layer/herbier-blanc) | Giới thiệu nhà nước hoa Lyon qua giấy, đỏ thẫm, chai trong sương, thư niêm phong và ghi chú tay | Chuyển tiếp dạng lời nhắn; thiệp và khoảng trắng tạo cảm giác thư riêng | Thương hiệu nước hoa, bố cục nguyên mẫu, màu đỏ đặc trưng và hiệu ứng sương nặng |
| [Showcase Equator](https://www.getlayers.ai/layer/showcase-equator) | Showcase chia cột; nhóm category đồng bộ với deck ảnh; trang mô tả scroll/flick/drag và pinned column | Một state kiểm soát cảm xúc, ảnh, tên trà và nội dung; đổi lựa chọn có phản hồi đồng bộ | Khóa cuộn, frosted pills và mô phỏng bộ deck nguyên bản |
| [Mirror Hall](https://www.getlayers.ai/layer/mirror-hall) | Carousel 3D kéo vô hạn, quán tính, các thẻ sáng phản chiếu trên nền tối | Gallery do người dùng điều khiển, thao tác vuốt và trạng thái ảnh rõ ràng | WebGL, hồ phản chiếu, vòng quay liên tục, sao chép code/scene |
| [Roadmap Ascent](https://www.getlayers.ai/layer/roadmap-ascent) | Timeline được pin khi cuộn, node sáng di chuyển, counter split-flap và nền lime | Bước hiện tại và tiến trình có ý nghĩa; cho quay lại sửa lựa chọn | Pin dài, counter không gắn quyết định mua, màu neon và pixel bloom |
| [Lumière](https://www.getlayers.ai/layer/lumi-re) | Trang mô tả mặt dây chuyền trong vòng ảnh chuyển động và atelier màu kem với nhẫn vàng | Đặt sản phẩm làm trọng tâm, phối hợp ảnh và chữ khi đổi state | Trang sức, hình học 3D giả, vòng ảnh quay tự động |

Các đề xuất ở cột ba là thiết kế nguyên bản dành cho dự án. Không nhận đó là motion được Figma chỉ định. Tham chiếu [thư viện GetLayers](https://www.getlayers.ai/) xác nhận tên và phân loại template/section; các trang premium yêu cầu nâng cấp để lấy prompt. Số lượt thích/số template có thể đổi nên không dùng làm bằng chứng chất lượng.

## 3. Benchmark thương hiệu trà

Nguồn là website trực tiếp của từng thương hiệu. Quan sát nội dung/đường dẫn công khai, không đặt đơn, nhập thông tin thật hoặc đánh giá thành công của backend.

| Thương hiệu / URL đã mở | Bằng chứng có thể đọc trực tiếp | Bài học áp dụng | Giới hạn |
|---|---|---|---|
| [THEN Tea](https://then.vn/), [trà và giá](https://then.vn/tra/), [quà Tết](https://then.vn/qua-tet/), [hợp tác](https://then.vn/hop-tac/) | Trang chủ tách nhu cầu uống/tặng/hợp tác, giới thiệu luồng năm câu hỏi chọn trà; bảng trà công bố giá theo quy cách | Bắt đầu từ nhu cầu, ghi giá/quy cách sát quyết định chọn; tách khách cá nhân và doanh nghiệp | Không kiểm thử kết quả của quiz hoặc xác nhận chính sách thương mại; không áp giá/ưu đãi THEN vào dự án |
| [Teapins](https://www.teapins.com/), [I Wish You](https://www.teapins.com/iwy) | Bộ sưu tập quà, nội dung Tea Wish và dấu ấn thiết kế; homepage dẫn tới Corporate Gifts/custom solutions | Lời muốn gửi là điểm vào quà tặng; có đường dẫn tư vấn doanh nghiệp riêng | Không xác nhận đã có live-preview trực tuyến hoặc gửi yêu cầu thành công |
| [WHAT’S TEA?](https://what-tea.com/en) | Có CTA thiết kế hộp trà 3D, mô tả chọn trà/nhập chữ và hình, thông số hộp; catalog có giá, nội dung đặt riêng yêu cầu xác nhận qua tư vấn | Phân biệt giá catalog với cá nhân hóa cần tư vấn; xem trước lựa chọn trước khi mua | Chỉ xác nhận công bố/CTA; không kiểm thử toàn bộ cấu hình3D, không sao chép hộp gỗ hoặc giá |
| [Tea Craft Việt Nam](https://teacraft.vn/), [quy cách hộp/túi lọc](https://teacraft.vn/hop-tra-tui-loc/) | Điều hướng quiz, sản phẩm có hương vị/giá, mục quà doanh nghiệp và thiết kế riêng; giải thích quy cách đóng gói | Cung cấp hương, vị, thành phần hộp và tuyến B2B tại đúng nơi khách cần | Tên “Tea Craft” trong brief không có domain; chọn site Việt Nam theo bối cảnh. Có thương hiệu khác tại teacraft.com.au; không gộp hai bên. Site VN tự báo đang hoàn thiện, một số ảnh là minh họa |
| [MULAN TEA STORY — Our Story](https://www.mulanteastory.com/story), [Press & Facts](https://www.mulanteastory.com/press) | Nội dung chia phần văn hóa/thủ công/câu chuyện; navigation có quà cá nhân, quà doanh nghiệp và bespoke | Storytelling có chương rõ ràng và CTA chuyển sang quà theo nhu cầu | Không xác nhận các chứng nhận/năng lực sản xuất được tự công bố; không dùng làm thông tin sản phẩm Mộc Ngôn Hương |

### So theo câu hỏi của brief

| Tiêu chí | Bằng chứng tham khảo | Chuyển thành yêu cầu kỹ thuật của V10 |
|---|---|---|
| Chọn quà theo nhu cầu | THEN nhu cầu uống/tặng; Teapins Tea Wish | Intention → emotion có state thật, không phải hộp trang trí |
| Kể chuyện sản phẩm | Tea Craft thông tin hương/vị; Mulan các chương | Chỉ dùng copy và đặc tính đang có trong dữ liệu sản phẩm |
| Cá nhân hóa | WHAT’S TEA mô tả preview chữ/hình | Live preview2D, nêu rõ cần tư vấn khi chưa có dịch vụ vật lý/giá |
| Thành phần hộp và giá | THEN giá theo quy cách; Tea Craft giải thích hộp | Giá lấy từ catalog; summary ghi đúng món đi kèm |
| B2B | Teapins Corporate Gifts, Tea Craft thiết kế riêng | Form có validation và trạng thái chưa có backend; không giả đã gửi |
| Mobile và conversion | Quan sát được CTA/điều hướng, chưa test thiết bị ngoài | Test riêng V10 ở10 viewport, touch/keyboard/reduced-motion; không mượn kết quả từ đối thủ |

## 4. Quy tắc ghi nhận ảnh hưởng

V10 dùng paper-like card preview, state ảnh/chữ đồng bộ, navigation gallery chủ động và progress5bước như **nguyên lý tương tác**. Không nhận là sao chép licensed implementation, không lấy tài sản từ website ngoài, không biến các nhận xét thành cam kết tăng chuyển đổi. Việc tương tác, hiệu năng và accessibility của bản Mộc Ngôn Hương phải được chứng minh bằng test riêng tại `EMOTION_JOURNEY_TESTS.md` và `V10_IMPLEMENTATION_REPORT.md`.

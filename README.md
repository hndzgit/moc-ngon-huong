# Mộc Ngôn Hương

Website React + TypeScript + Vite hiện có, sử dụng ảnh, SVG và icon gốc từ Figma. Không thay đổi giá sản phẩm để phục vụ triển khai.

## Chạy cục bộ

Yêu cầu Node.js 22 và npm tương thích với lockfile.

```sh
npm ci
npm run dev
npm run build
```

Build mặc định dùng base `/`, phù hợp local và Vercel. Build GitHub Pages:

```sh
VITE_BASE_PATH=/moc-ngon-huong/ npm run build
```

Điều hướng dùng hash, ví dụ `/moc-ngon-huong/#/san-pham/buoi-an`, để tải lại trực tiếp trên hosting tĩnh. Không cần proxy hay dịch vụ hosting bổ sung.

Xem [hướng dẫn triển khai](docs/GITHUB_PAGES_DEPLOYMENT.md), [audit chức năng](docs/FUNCTIONAL_AUDIT.md) và [tiến độ đối chiếu Figma](docs/CODEX_FIGMA_REPAIR_PROGRESS.md). Các báo cáo Figma trước đây là bằng chứng của đợt sửa tương ứng, không đồng nghĩa đã nghiệm thu pixel-perfect.

## Cấu hình và giới hạn

Sao chép `.env.example` thành `.env.local` khi có cấu hình Firebase hợp lệ. Các biến `VITE_*` được công khai trong JavaScript: chỉ đặt cấu hình Firebase client, tuyệt đối không đặt private key, Admin SDK hoặc token GitHub.

Hiện chưa có backend nhận đơn, liên hệ hoặc newsletter. Bản production báo chưa khả dụng và giữ dữ liệu, không tạo xác nhận thành công giả. Chatbot dùng quy tắc cục bộ. Firebase thực chưa được kiểm tra do thiếu cấu hình. Trạng thái thành công phục vụ đối chiếu Figma chỉ có trong dev với `?figma-qa=1`.

Thư viện Figma và ảnh bằng chứng dung lượng lớn được giữ ở máy, không đưa lên Git. Tất cả tài sản runtime trong `public/assets/figma/` được đưa vào repository. Không có cấu hình Vercel cũ bị xóa.

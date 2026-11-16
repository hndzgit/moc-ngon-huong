export const products = {
  collectionPage: {
    brandKicker: 'MỘC NGÔN HƯƠNG',
    title: 'Danh Sách Sản Phẩm',
    quote: '“Một tách trà, đôi khi là lý do để chúng ta ngồi lại.”',
  },
  card: {
    viewProductAria: 'Xem {{name}}',
    detailAria: 'Chi tiết {{name}}',
  },
  search: {
    dialogAria: 'Tìm kiếm sản phẩm',
    placeholder: 'Tìm kiếm sản phẩm',
    clearAria: 'Xóa từ khóa',
    closeAria: 'Đóng tìm kiếm',
    emptyPrefix: 'Không tìm thấy kết quả nào cho “',
    emptySuffix: '”. Hãy thử tìm kiếm khác',
    recentlyViewed: 'Đã xem gần đây',
    clearRecent: 'Xóa',
    allProductsHeading: 'Sản phẩm của Mộc Ngôn Hương',
  },
  detail: {
    imageFallbackAlt: 'Ảnh sản phẩm {{index}}',
    skuLabel: 'Mã sản phẩm:',
    qtyTitle: 'Số Lượng',
    stockNote: 'Còn hàng • Đóng gói thủ công',
    addToCart: 'Thêm Vào Giỏ Hàng',
    buyNow: 'Mua Ngay',
    scentLabel: 'Tầng hương:',
    giftForLabel: 'Món quà hoàn hảo cho:',
    relatedHeading: 'Các sản phẩm khác của Mộc Ngôn Hương',
    reviewsHeading: 'Đánh giá sản phẩm',
    reviewsEmptyTitle: 'Chưa có đánh giá trực tuyến cho sản phẩm này',
    reviewsEmptyBody:
      'Mộc Ngôn Hương chỉ đăng tải nhận xét xác thực từ khách hàng đã hoàn tất đơn hàng và trải nghiệm trà. Nếu bạn cần tư vấn chọn hương trà phù hợp, đội ngũ tiệm trà luôn sẵn sàng hỗ trợ.',
    reviewsContactCta: 'Liên hệ tư vấn trực tiếp',
    serviceBadges: [
      { icon: 'group' as const, title: 'Hỏa Tốc', subtitle: 'Nội thành Hà Nội' },
      { icon: 'dollar' as const, title: 'COD', subtitle: 'Thanh toán khi nhận' },
      { icon: 'box' as const, title: 'Hút Chân Không', subtitle: 'Theo yêu cầu' },
      { icon: 'airplane' as const, title: 'Giao Hàng Bay', subtitle: 'Đà Nẵng, HCM' },
    ],
  },
} as const;

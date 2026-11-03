// Slot mappings from live Source A contexts, pointing to lightweight optimized WebP derivatives.
export const FIGMA_PRODUCT_MEDIA: Record<string, { main: string; story: string }> = {
  'buoi-an': { main: '/assets/optimized/detail-buoi-an-1.webp', story: '/assets/optimized/detail-buoi-an-story.webp' },
  'nhai-thuong': { main: '/assets/optimized/detail-nhai-thuong-1.webp', story: '/assets/optimized/detail-nhai-thuong-story.webp' },
  'soi-cam': { main: '/assets/optimized/detail-soi-cam-1.webp', story: '/assets/optimized/detail-soi-cam-story.webp' },
  'com-nho': { main: '/assets/optimized/detail-com-nho-1.webp', story: '/assets/optimized/detail-com-nho-story.webp' },
  'hop-qua-tam-y': { main: '/assets/optimized/detail-hop-qua-tam-y-1.webp', story: '/assets/optimized/detail-hop-qua-tam-y-story.webp' },
};

export const figmaImage = (file: string) => file.startsWith('/') ? file : `/assets/figma/originals/${file}`;

// Listing images are separate Figma slots from the detail gallery (77:2583).
export const FIGMA_LISTING_MEDIA: Record<string, string> = {
  'buoi-an': '/assets/optimized/card-buoi-an-800.webp',
  'nhai-thuong': '/assets/optimized/card-nhai-thuong-800.webp',
  'soi-cam': '/assets/optimized/card-soi-cam-800.webp',
  'com-nho': '/assets/optimized/card-com-nho-800.webp',
  'hop-qua-tam-y': '/assets/optimized/card-hop-qua-tam-y-800.webp',
};

// Lightweight thumbnails for cart, checkout and receipt (replaces 7-9MB originals).
export const FIGMA_ORDER_MEDIA: Record<string, {image:string;position:string}> = {
  'buoi-an': {image:'/assets/optimized/order-thumb-buoi-an.webp',position:'82.31% center'},
  'nhai-thuong': {image:'/assets/optimized/order-thumb-nhai-thuong.webp',position:'center'},
  'soi-cam': {image:'/assets/optimized/order-thumb-soi-cam.webp',position:'center'},
  'com-nho': {image:'/assets/optimized/order-thumb-com-nho.webp',position:'center'},
  'hop-qua-tam-y': {image:'/assets/optimized/order-thumb-hop-qua-tam-y.webp',position:'center'},
};

export const FIGMA_PRODUCT_COPY: Record<string, {node:string;title:string;summary:string;storyTitle:string;quote:string;scent:string;giftFor:string}> = {
  "buoi-an": {
    "node": "35:3068",
    "title": "Trà hương Bưởi – AN",
    "summary": "Hương bưởi thanh mát và gần gũi, đại diện cho lòng biết ơn, sự trân trọng.",
    "storyTitle": "Trà Hương Bưởi - Gửi trọn ước nguyện Bình An",
    "quote": "\"Hương hoa bưởi La Bằng thanh tao quấn quýt cùng vị tiền chát hậu ngọt của búp chè non, tựa như một cái ôm dịu dàng xoa dịu những nhọc nhằn ngày cũ.\"",
    "scent": "Hoa bưởi đầu mùa, thanh mát dịu ngọt",
    "giftFor": "Bố mẹ, Thầy cô, Bạn tri kỷ lâu năm"
  },
  "nhai-thuong": {
    "node": "120:2859",
    "title": "Trà hương Nhài – THƯƠNG",
    "summary": "Hương nhài nhẹ nhàng, tinh tế, gợi sự yêu thương và quan tâm.",
    "storyTitle": "Trà Hương Nhài — Dịu ngọt lời yêu thương",
    "quote": "\"Từng cánh hoa nhài ủ hương đêm tinh khôi, lưu lại vị ngọt ngào bền lâu trong tâm tưởng, thay lời thương tha thiết khó cất thành tiếng.\"",
    "scent": "Hoa nhài quỳnh đêm, ngọt sâu lắng đọng",
    "giftFor": "Người yêu, Bạn gái, Phái đẹp dịu dàng"
  },
  "soi-cam": {
    "node": "120:3302",
    "title": "Trà hương Sói – CẢM",
    "summary": "Hương hoa đặc trưng, dịu nhẹ và sâu lắng, gợi cảm giác hoài niệm và nhớ thương.",
    "storyTitle": "Trà Hoa Sói — Tấm lòng Tri Ân trầm lắng",
    "quote": "\"Hoa sói cổ truyền nồng ấm, sắc sảo và mang đậm hồn xưa cũ. Món quà hoàn hảo để tỏ lòng biết ơn sâu sắc tới người thầy, người nâng đỡ mình.\"",
    "scent": "Hương hoa sói hoài niệm, trầm ấm bền lâu",
    "giftFor": "Thầy cô 20/11, Cấp trên, Người dẫn dắt"
  },
  "com-nho": {
    "node": "120:3541",
    "title": "Trà hương Cốm - NHỚ",
    "summary": "hương cốm dịu dàng, mộc mạc, mang lại cảm giác thư thái, nhẹ nhàng và bình yên.",
    "storyTitle": "Trà Cốm — Nhắc lại những ngày tháng êm đềm",
    "quote": "\"Vị thơm thoang thoảng của hương cốm non quyện trong búp chè tươi, làm sống lại những kỷ niệm ấu thơ và lời hẹn ước thời hoa niên.\"",
    "scent": "Lúa non, mật ong hoa dại & cốm mới",
    "giftFor": "Bạn học cũ, Bạn đồng hành thời sinh viên"
  },
  "hop-qua-tam-y": {
    "node": "120:6560",
    "title": "Hộp Quà Trà Đa Hương — \"TÂM Ý\"",
    "summary": "Hương hoa đặc trưng, dịu nhẹ và sâu lắng, gợi cảm giác hoài niệm và nhớ thương.",
    "storyTitle": "Hộp Quà Tâm Ý — Đong đầy mọi sắc thái yêu thương",
    "quote": "\"Khi mọi cảm xúc đều đáng trân trọng, bộ quà tặng đa hương mang đến trải nghiệm thưởng trà trọn vẹn kèm muỗng gỗ kỷ niệm và thiệp viết nắn nót.\"",
    "scent": "Đa hương vị: Bưởi, Nhài, Sói và Cốm non",
    "giftFor": "Dịp lễ lớn, Ra mắt gia đình, Quà biếu trang trọng"
  }
};

// Listing copy differs from the detail summary.
export const FIGMA_LISTING_COPY: Record<string,string> = {
  'buoi-an': 'Hương hoa bưởi thơm thanh mát, xua tan căng thẳng, mang lại cảm giác bình yên trong từng ngụm trà.',
  'nhai-thuong': 'Nốt hương nhài quyến rũ, ngọt ngào và bền lâu, là lời tỏ bày yêu thương dịu êm đến người bạn nhớ.',
  'soi-cam': 'Hương hoa sói cổ phong trầm lắng, đượm sâu, mang nặng ân tình tri ân gửi tặng thầy cô và đấng sinh thành.',
  'com-nho': 'Hương lúa nếp non ngầy ngậy, đưa tâm hồn quay về với những kỷ niệm tuổi thơ ấm áp và bình dị.',
};

// Compact subtitles: 127:13403–13454. Related copy/note: 103:6314–6374.
// These are display slots; catalog prices and cart product objects stay unchanged.
export const FIGMA_CARD_COPY: Record<string, {title:string; subtitle:string; description:string; note?:string}> = {
  'buoi-an': {title:'Trà hương Bưởi (AN)', subtitle:'Trà Bưởi', description:FIGMA_LISTING_COPY['buoi-an']},
  'nhai-thuong': {title:'Trà Nhài (THƯƠNG)', subtitle:'Trà Nhài', description:FIGMA_LISTING_COPY['nhai-thuong']},
  'soi-cam': {title:'Trà Hoa Sói (CẢM)', subtitle:'Trà Hoa Sói', description:FIGMA_LISTING_COPY['soi-cam']},
  'com-nho': {title:'Trà Cốm (NHỚ)', subtitle:'Trà Cốm', description:FIGMA_LISTING_COPY['com-nho']},
  'hop-qua-tam-y': {title:'Combo Signature "Tâm Ý"', subtitle:'Đầy đủ 4 phong vị trà', description:'Đầy đủ 4 phong vị trà, muỗng gỗ & thiệp', note:'Có thể mix theo sở thích cá nhân'},
};

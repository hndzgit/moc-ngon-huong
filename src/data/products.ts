import { Product, ReviewItem } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'buoi-an',
    name: 'Trà Hương Hoa Bưởi – AN',
    shortName: 'Trà Hương Hoa Bưởi (AN)',
    code: 'MNH-AN-01',
    emotion: 'AN',
    emotionLabel: 'AN — Bình an & Biết ơn',
    tagline: 'Gói trọn hương bưởi thanh sạch của những ngày đầu xuân',
    price: 289000,
    stock: 999,
    rating: 4.8,
    reviewsCount: 100,
    weight: '100g',
    packaging: 'Hộp trà 100g + Kẹo lạc + Muỗng gỗ + Thẻ thư pháp QR',
    image: '/assets/optimized/card-buoi-an-800.webp',
    gallery: [
      '/assets/optimized/detail-buoi-an-1.webp',
      '/assets/optimized/detail-gallery-191e7-1280.webp',
      '/assets/optimized/detail-gallery-4teas.webp',
    ],
    badge: 'Bán chạy',
    shortDesc:
      'Gói trọn hương bưởi thanh sạch của những ngày đầu xuân, vị trà chát dịu quyện cùng hậu ngọt sâu lắng. Mỗi hộp quà bao gồm: Trà hương hoa bưởi truyền thống, kẹo lạc bùi thơm, muỗng gỗ mộc mạc và thẻ thư pháp kèm QR âm thanh dẫn lối về miền ký ức yên bình.',
    fullDesc:
      'Gói trọn hương bưởi thanh sạch của những ngày đầu xuân, vị trà chát dịu quyện cùng hậu ngọt sâu lắng. Mỗi hộp quà bao gồm: Trà hương hoa bưởi truyền thống, kẹo lạc bùi thơm, muỗng gỗ mộc mạc và thẻ thư pháp kèm QR âm thanh dẫn lối về miền ký ức yên bình.',
    storyTitle: 'Trà Hương Hoa Bưởi - Gửi trọn ước nguyện Bình An',
    storyParagraphs: [
      'Mở đầu bằng mùi hương hoa bưởi tự nhiên the mát, thanh tao. Vị trà chát dịu nhẹ nơi đầu lưỡi, sau đó chuyển dần sang hậu vị ngọt sâu lắng và thanh khiết.',
      'Ông bà, cha mẹ (dịp Lễ Tết, mừng thọ); những người đang cần sự nghỉ ngơi, chữa lành; hoặc dùng trong những buổi trà chiều tĩnh lặng.'
    ],
    storyQuote:
      '"Chúc người một đời an nhiên, lòng luôn tĩnh tại như mặt hồ phẳng lặng trước những biến thiên của cuộc đời. Mượn hương hoa bưởi thanh sạch để gột rửa những âu lo, trả lại sự thư thái và nhẹ nhõm trong tâm hồn."',
    storyImage: '/assets/optimized/detail-buoi-an-story.webp',
    botanicalIllustration: '/assets/optimized/discovery-botanical-AN.webp',
    scentNotes: [
      'Mở đầu bằng mùi hương hoa bưởi tự nhiên the mát, thanh tao. Vị trà chát dịu nhẹ nơi đầu lưỡi, sau đó chuyển dần sang hậu vị ngọt sâu lắng và thanh khiết.'
    ],
    tasteNotes: 'Vị trà chát dịu nhẹ nơi đầu lưỡi, chuyển dần sang hậu vị ngọt sâu lắng và thanh khiết.',
    ingredients: ['Trà xanh Tân Cương tuyển chọn', 'Hoa bưởi tươi ướp truyền thống'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 phút',
    brewingAmount: '5g trà / 150ml nước',
    perfectGiftFor: [
      'Ông bà, cha mẹ (dịp Lễ Tết, mừng thọ); những người đang cần sự nghỉ ngơi, chữa lành; hoặc dùng trong những buổi trà chiều tĩnh lặng.'
    ]
  },
  {
    id: 'nhai-thuong',
    name: 'Trà Hương Hoa Nhài – THƯƠNG',
    shortName: 'Trà Hương Hoa Nhài (THƯƠNG)',
    code: 'MNH-THUONG-02',
    emotion: 'THUONG',
    emotionLabel: 'THƯƠNG — Dịu Ngọt & Yêu thương',
    tagline: 'Ủ từ những bông nhài quế nở rộ lúc đêm muộn',
    price: 289000,
    stock: 999,
    rating: 4.8,
    reviewsCount: 100,
    weight: '100g',
    packaging: 'Hộp trà 100g + Kẹo lạc + Muỗng gỗ + Thẻ thư pháp QR',
    image: '/assets/optimized/card-nhai-thuong-800.webp',
    gallery: [
      '/assets/optimized/detail-nhai-thuong-1.webp',
      '/assets/optimized/detail-nhai-thuong-gallery-2.webp',
      '/assets/optimized/detail-gallery-4teas.webp',
    ],
    badge: 'Yêu thích',
    shortDesc:
      'Ủ từ những bông nhài quế nở rộ lúc đêm muộn, mang hương thơm nồng nàn nhưng thanh thoát, lưu luyến mãi nơi đầu lưỡi. Set quà là sự kết hợp tinh tế giữa trà hương hoa nhài hảo hạng, kẹo lạc giòn tan, muỗng gỗ thủ công và chiếc thẻ "Thương" chứa đựng những lời tâm tình dịu ngọt nhất.',
    fullDesc:
      'Ủ từ những bông nhài quế nở rộ lúc đêm muộn, mang hương thơm nồng nàn nhưng thanh thoát, lưu luyến mãi nơi đầu lưỡi. Set quà là sự kết hợp tinh tế giữa trà hương hoa nhài hảo hạng, kẹo lạc giòn tan, muỗng gỗ thủ công và chiếc thẻ "Thương" chứa đựng những lời tâm tình dịu ngọt nhất.',
    storyTitle: 'Trà Hương Hoa Nhài — Dịu ngọt lời yêu thương',
    storyParagraphs: [
      'Hương hoa nhài đêm ngát hương, quyến rũ nhưng rất đỗi gần gũi. Khi thưởng thức, vị trà mềm mại, êm dịu, để lại cảm giác ngọt ngào vương vấn thật lâu nơi cuống họng.',
      'Nửa kia, người thương, bạn đời; hoặc gửi tặng mẹ, chị gái, những người phụ nữ dịu dàng quanh bạn vào những ngày kỷ niệm hoặc chẳng nhân dịp gì cả.'
    ],
    storyQuote:
      '"Thay cho những cái ôm siết chặt và sự vỗ về dịu dàng nhất. Gửi đến người một chút ngọt ngào để xoa dịu những ngày dài mỏi mệt, một chút hương thơm nồng ấm để biết rằng luôn có một người âm thầm dõi theo, yêu thương và trân trọng bạn vô điều kiện."',
    storyImage: '/assets/optimized/detail-nhai-thuong-story.webp',
    botanicalIllustration: '/assets/optimized/discovery-botanical-THUONG.webp',
    scentNotes: [
      'Hương hoa nhài đêm ngát hương, quyến rũ nhưng rất đỗi gần gũi. Khi thưởng thức, vị trà mềm mại, êm dịu, để lại cảm giác ngọt ngào vương vấn thật lâu nơi cuống họng.'
    ],
    tasteNotes: 'Vị trà mềm mại, êm dịu, để lại cảm giác ngọt ngào vương vấn thật lâu nơi cuống họng.',
    ingredients: ['Trà xanh búp non tuyển chọn', 'Hoa nhài quế tươi ủ hương đêm'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 phút',
    brewingAmount: '5g trà / 150ml nước',
    perfectGiftFor: [
      'Nửa kia, người thương, bạn đời; hoặc gửi tặng mẹ, chị gái, những người phụ nữ dịu dàng quanh bạn vào những ngày kỷ niệm hoặc chẳng nhân dịp gì cả.'
    ]
  },
  {
    id: 'soi-cam',
    name: 'Trà Hương Hoa Sói – CẢM',
    shortName: 'Trà Hương Hoa Sói (CẢM)',
    code: 'MNH-CAM-03',
    emotion: 'CAM',
    emotionLabel: 'CẢM — Tri ân & Hoài niệm',
    tagline: 'Một thức trà cổ truyền quý hiếm với hương thơm trầm ấm',
    price: 289000,
    stock: 999,
    rating: 4.8,
    reviewsCount: 100,
    weight: '100g',
    packaging: 'Hộp trà 100g + Kẹo lạc + Muỗng gỗ + Thẻ thư pháp QR',
    image: '/assets/optimized/card-soi-cam-800.webp',
    gallery: [
      '/assets/optimized/detail-soi-cam-1.webp',
      '/assets/optimized/detail-soi-cam-gallery-2.webp',
      '/assets/optimized/detail-gallery-4teas.webp',
    ],
    badge: 'Cổ truyền',
    shortDesc:
      'Một thức trà cổ truyền quý hiếm với hương thơm trầm ấm, mộc mạc như nắng sớm ban mai. Hộp quà "Cảm" trao tay người nhận trọn vẹn bộ trà hương hoa sói đậm vị, thức quà kẹo lạc dân dã, muỗng gỗ tự nhiên và tấm thẻ tri ân mở ra không gian âm nhạc truyền thống đầy xúc cảm.',
    fullDesc:
      'Một thức trà cổ truyền quý hiếm với hương thơm trầm ấm, mộc mạc như nắng sớm ban mai. Hộp quà "Cảm" trao tay người nhận trọn vẹn bộ trà hương hoa sói đậm vị, thức quà kẹo lạc dân dã, muỗng gỗ tự nhiên và tấm thẻ tri ân mở ra không gian âm nhạc truyền thống đầy xúc cảm.',
    storyTitle: 'Trà Hương Hoa Sói — Tấm lòng Tri Ân trầm lắng',
    storyParagraphs: [
      'Hương hoa sói mang nét trầm ấm, mộc mạc, thoang thoảng chút hương thảo mộc cổ điển và nắng ấm. Vị trà đậm đà, chát đượm nhưng hậu ngọt rất sâu và bền bỉ qua nhiều tuần nước.',
      'Thầy cô giáo, sếp, đồng nghiệp, đối tác, hoặc những vị ân nhân đã từng giúp đỡ mình trên đường đời.'
    ],
    storyQuote:
      '"Gửi ngàn lời cảm kích vì sự hiện diện của người trong cuộc đời này. Cảm ơn những sẻ chia, nâng đỡ và cả những sự thấu hiểu không cần nói thành lời. Hương trà mộc mạc nhưng bền bỉ này chính là biểu tượng cho tấm lòng tri ân sâu sắc và sự trân quý không bao giờ phai nhạt."',
    storyImage: '/assets/optimized/detail-soi-cam-story.webp',
    botanicalIllustration: '/assets/optimized/discovery-botanical-CAM.webp',
    scentNotes: [
      'Hương hoa sói mang nét trầm ấm, mộc mạc, thoang thoảng chút hương thảo mộc cổ điển và nắng ấm. Vị trà đậm đà, chát đượm nhưng hậu ngọt rất sâu và bền bỉ qua nhiều tuần nước.'
    ],
    tasteNotes: 'Vị trà đậm đà, chát đượm nhưng hậu ngọt rất sâu và bền bỉ qua nhiều tuần nước.',
    ingredients: ['Trà móc câu thượng hạng', 'Hoa sói tươi ướp thủ công nhiều lửa'],
    brewingTemp: '85°C - 90°C',
    brewingTime: '3 - 5 phút',
    brewingAmount: '5g trà / 150ml nước',
    perfectGiftFor: [
      'Thầy cô giáo, sếp, đồng nghiệp, đối tác, hoặc những vị ân nhân đã từng giúp đỡ mình trên đường đời.'
    ]
  },
  {
    id: 'com-nho',
    name: 'Trà Hương Cốm – NHỚ',
    shortName: 'Trà Hương Cốm (NHỚ)',
    code: 'MNH-NHO-04',
    emotion: 'NHO',
    emotionLabel: 'NHỚ — Ký ức & Dịu êm',
    tagline: 'Đánh thức miền ký ức dịu êm với hương cốm non thanh tao',
    price: 289000,
    stock: 999,
    rating: 4.8,
    reviewsCount: 100,
    weight: '100g',
    packaging: 'Hộp trà 100g + Kẹo lạc + Muỗng gỗ + Thẻ thư pháp QR',
    image: '/assets/optimized/card-com-nho-800.webp',
    gallery: [
      '/assets/optimized/detail-com-nho-1.webp',
      '/assets/optimized/detail-com-nho-gallery-2.webp',
      '/assets/optimized/detail-gallery-4teas.webp',
    ],
    badge: 'Độc đáo',
    shortDesc:
      'Đánh thức miền ký ức dịu êm với hương cốm non thanh tao, ngọt bùi như gói trọn cả mùa thu Hà Nội vào từng chén nước. Bên trong hộp quà là sự hội tụ của trà hương cốm đặc trưng, kẹo lạc truyền thống, muỗng gỗ nhỏ xinh và thẻ "Nhớ" lưu giữ thanh âm hoài niệm dành riêng cho những người tri kỷ.',
    fullDesc:
      'Đánh thức miền ký ức dịu êm với hương cốm non thanh tao, ngọt bùi như gói trọn cả mùa thu Hà Nội vào từng chén nước. Bên trong hộp quà là sự hội tụ của trà hương cốm đặc trưng, kẹo lạc truyền thống, muỗng gỗ nhỏ xinh và thẻ "Nhớ" lưu giữ thanh âm hoài niệm dành riêng cho những người tri kỷ.',
    storyTitle: 'Trà Hương Cốm — Nhắc lại những ngày tháng êm đềm',
    storyParagraphs: [
      'Hương cốm non mộc mạc, thơm bùi như mùi lúa mới và sắc thu Hà Nội. Vị trà thanh tao, nhẹ nhàng, mang lại cảm giác bình yên, thân thuộc như được trở về nhà.',
      'Những người bạn cũ lâu ngày chưa gặp, người thân đang ở phương xa, những người con xa quê, hoặc những tâm hồn yêu nét đẹp hoài cổ.'
    ],
    storyQuote:
      '"Gửi một chút hương xưa để gợi nhắc về những tháng năm cũ, những kỷ niệm đẹp đẽ mà chúng ta đã cùng nhau đi qua. Dù thời gian có trôi và khoảng cách có bao xa, mong người khi thưởng thức chén trà này sẽ luôn nhớ về nhau với những tình cảm trong trẻo, nguyên vẹn như thuở ban đầu."',
    storyImage: '/assets/optimized/detail-com-nho-story.webp',
    botanicalIllustration: '/assets/optimized/discovery-botanical-NHO.webp',
    scentNotes: [
      'Hương cốm non mộc mạc, thơm bùi như mùi lúa mới và sắc thu Hà Nội. Vị trà thanh tao, nhẹ nhàng, mang lại cảm giác bình yên, thân thuộc như được trở về nhà.'
    ],
    tasteNotes: 'Vị trà thanh tao, nhẹ nhàng, mang lại cảm giác bình yên, thân thuộc như được trở về nhà.',
    ingredients: ['Trà xanh tuyển chọn', 'Hương cốm nếp non & lá sen tự nhiên'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 phút',
    brewingAmount: '5g trà / 150ml nước',
    perfectGiftFor: [
      'Những người bạn cũ lâu ngày chưa gặp, người thân đang ở phương xa, những người con xa quê, hoặc những tâm hồn yêu nét đẹp hoài cổ.'
    ]
  },
  {
    id: 'hop-qua-tam-y',
    name: 'Hộp Quà Trà Đa Hương — "TÂM Ý"',
    shortName: 'Combo Signature "Tâm Ý"',
    code: 'MNH-TAMY-SIGNATURE',
    emotion: 'COMBO',
    emotionLabel: 'MÓN QUÀ ĐẶC BIỆT',
    tagline: '“Trao hương, gửi lời thương.”',
    price: 399000,
    stock: 999,
    rating: 4.8,
    reviewsCount: 100,
    weight: '4 thức trà (Bưởi, Nhài, Hoa Sói, Cốm) + Kẹo lạc + Phụ kiện trà',
    packaging: '4 hộp trà 50g + Kẹo lạc truyền thống + Túi vải đay + Muỗng gỗ + 4 Thẻ thông điệp QR',
    image: '/assets/optimized/card-hop-qua-tam-y-800.webp',
    gallery: [
      '/assets/optimized/detail-hop-qua-tam-y-1.webp',
      '/assets/optimized/detail-hop-qua-tam-y-gallery-2.webp',
      '/assets/optimized/detail-hop-qua-tam-y-gallery-3.webp',
    ],
    badge: 'Món quà đặc biệt',
    shortDesc:
      'Không cần đắn đo chọn lựa, Hộp Quà "Tâm Ý" gói trọn cả 4 thức trà tinh túy (Bưởi, Nhài, Hoa Sói, Cốm) cùng kẹo lạc truyền thống và phụ kiện thưởng trà mộc mạc. Một món quà chỉn chu, sang trọng để gửi gắm trọn vẹn mọi cung bậc tình cảm đến những người trân quý.',
    fullDesc:
      'Không cần đắn đo chọn lựa, Hộp Quà "Tâm Ý" gói trọn cả 4 thức trà tinh túy (Bưởi, Nhài, Hoa Sói, Cốm) cùng kẹo lạc truyền thống và phụ kiện thưởng trà mộc mạc. Một món quà chỉn chu, sang trọng để gửi gắm trọn vẹn mọi cung bậc tình cảm đến những người trân quý.',
    storyTitle: 'Hộp Quà Tâm Ý — Đong đầy mọi sắc thái yêu thương',
    storyParagraphs: [
      'Đa hương vị: Hoa Bưởi thanh sạch, Hoa Nhài dịu ngọt, Hoa Sói trầm ấm và Cốm non thơm bùi quyện hòa cùng vị trà xanh Tân Cương tuyển chọn.',
      'Giải pháp quà tặng trọn vẹn dành cho các dịp lễ lớn, Ngày Nhà giáo 20/11, ra mắt gia đình hay quà biếu trang trọng.'
    ],
    storyQuote:
      '"Khi mọi cảm xúc đều đáng trân trọng, bộ quà tặng đa hương mang đến trải nghiệm thưởng trà trọn vẹn kèm muỗng gỗ kỷ niệm và thiệp viết nắn nót."',
    storyImage: '/assets/optimized/detail-hop-qua-tam-y-story.webp',
    botanicalIllustration: '/assets/optimized/illus-hoasen.webp',
    scentNotes: [
      'Đa hương vị: Hoa Bưởi, Hoa Nhài, Hoa Sói và Cốm'
    ],
    tasteNotes: 'Trải nghiệm trọn vẹn 4 cung bậc hương vị trà hoa truyền thống Việt Nam.',
    ingredients: [
      '4 hộp trà 50g (đủ 4 vị: An - Thương - Cảm - Nhớ)',
      'Kẹo lạc trà xanh, túi vải đay & muỗng gỗ',
      'Bộ 4 thẻ thông điệp kèm mã QR nghe chuyện trà'
    ],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 phút',
    brewingAmount: '5g trà / 150ml nước',
    perfectGiftFor: [
      'Dịp lễ lớn, Ra mắt gia đình, Quà biếu trang trọng'
    ],
    includedFlavors: [
      {
        id: 'buoi-an',
        title: 'Bình an & Biết ơn',
        subtitle: 'Trà Hương Hoa Bưởi',
        emotion: 'AN',
        image: '/assets/optimized/discovery-botanical-AN.webp'
      },
      {
        id: 'nhai-thuong',
        title: 'Dịu Ngọt & Yêu thương',
        subtitle: 'Trà Hương Hoa Nhài',
        emotion: 'THUONG',
        image: '/assets/optimized/discovery-botanical-THUONG.webp'
      },
      {
        id: 'soi-cam',
        title: 'Tri ân & Hoài niệm',
        subtitle: 'Trà Hương Hoa Sói',
        emotion: 'CAM',
        image: '/assets/optimized/discovery-botanical-CAM.webp'
      },
      {
        id: 'com-nho',
        title: 'Ký ức & Dịu êm',
        subtitle: 'Trà Hương Cốm',
        emotion: 'NHO',
        image: '/assets/optimized/discovery-botanical-NHO.webp'
      }
    ],
    isSignature: true
  }
];

// Loose tea & accessories row (Section 3 of ProductsPage 77:2583 & Related Products on DetailPage 120:6560 & SearchOverlay 127:12938)
export const LOOSE_TEA_PRODUCTS: Product[] = [
  {
    ...PRODUCTS[0],
    id: 'buoi-an-le',
    name: 'Trà Hương Hoa Bưởi (AN)',
    shortName: 'Trà Hương Hoa Bưởi (AN)',
    price: 75000,
    image: '/assets/optimized/card-buoi-an-800.webp',
  },
  {
    ...PRODUCTS[1],
    id: 'nhai-thuong-le',
    name: 'Trà Hương Hoa Nhài (THƯƠNG)',
    shortName: 'Trà Hương Hoa Nhài (THƯƠNG)',
    price: 75000,
    image: '/assets/optimized/card-nhai-thuong-800.webp',
  },
  {
    ...PRODUCTS[2],
    id: 'soi-cam-le',
    name: 'Trà Hương Hoa Sói (CẢM)',
    shortName: 'Trà Hương Hoa Sói (CẢM)',
    price: 75000,
    image: '/assets/optimized/card-soi-cam-800.webp',
  },
  {
    ...PRODUCTS[3],
    id: 'com-nho-le',
    name: 'Trà Hương Cốm (NHỚ)',
    shortName: 'Trà Hương Cốm (NHỚ)',
    price: 75000,
    image: '/assets/optimized/card-com-nho-800.webp',
  },
  {
    ...PRODUCTS[4],
    id: 'combo-tam-y-le',
    name: 'Combo Signature "Tâm Ý"',
    shortName: 'Combo Signature "Tâm Ý"',
    price: 399000,
    image: '/assets/optimized/card-hop-qua-tam-y-800.webp',
  },
];

export const LISTING_PRODUCTS: Product[] = PRODUCTS.slice(0, 4);

export const REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Dương Nguyễn',
    avatar: '/assets/figma/reviewer-avatar.png',
    rating: 5,
    date: '3 giờ trước',
    productName: 'Trà Hương Hoa Bưởi – AN',
    title: 'Xác nhận đã mua hàng',
    comment:
      'Hộp quà rất đẹp và chỉn chu. Mở nắp hộp ra là thấy ngay mùi hoa tự nhiên rất dễ chịu. Mình mua biếu bố mẹ ai cũng khen tấm tắc!',
    verified: true,
    images: ['/assets/optimized/an-hand-800.webp', '/assets/optimized/an-hand-800.webp', '/assets/optimized/an-hand-800.webp'],
    likes: 24
  },
  {
    id: 'rev-2',
    author: 'Dương Nguyễn',
    avatar: '/assets/figma/reviewer-avatar.png',
    rating: 5,
    date: '3 giờ trước',
    productName: 'Hộp Quà Trà Đa Hương — "TÂM Ý"',
    title: 'Xác nhận đã mua hàng',
    comment:
      'Set quà đóng gói cực kỳ cẩn thận, có cả túi vải đay, muỗng gỗ và kẹo lạc ăn kèm rất hợp vị trà. Quét mã QR nghe chuyện trà buổi tối rất thư giãn.',
    verified: true,
    images: ['/assets/optimized/an-hand-800.webp', '/assets/optimized/an-hand-800.webp', '/assets/optimized/an-hand-800.webp'],
    likes: 19
  }
];

export const EMOTION_CARDS = [
  {
    key: 'AN' as const,
    cardTitle: 'Bình an & Biết ơn',
    teaName: 'Trà Hương Hoa Bưởi',
    shortPill: 'An',
    pillBg: '#ecf6fd',
    pillText: '#2b7ba1',
    suggestPill: 'Hương gợi ý: Hoa Bưởi (An)',
    heading: 'Trà Hương Hoa Bưởi - Gửi trọn ước nguyện Bình An',
    quote:
      '"Chúc người một đời an nhiên, lòng luôn tĩnh tại như mặt hồ phẳng lặng trước những biến thiên của cuộc đời. Mượn hương hoa bưởi thanh sạch để gột rửa những âu lo, trả lại sự thư thái và nhẹ nhõm trong tâm hồn."',
    scentProfile:
      'Mở đầu bằng mùi hương hoa bưởi tự nhiên the mát, thanh tao. Vị trà chát dịu nhẹ nơi đầu lưỡi, sau đó chuyển dần sang hậu vị ngọt sâu lắng và thanh khiết.',
    occasion:
      'Ông bà, cha mẹ (dịp Lễ Tết, mừng thọ); những người đang cần sự nghỉ ngơi, chữa lành; hoặc dùng trong những buổi trà chiều tĩnh lặng.',
    price: 289000,
    productId: 'buoi-an',
    image: '/assets/optimized/detail-buoi-an-2.webp',
    boxImage: '/assets/optimized/card-buoi-an-800.webp',
    illustration: '/assets/optimized/illus-hoabuoi.webp',
    accentColor: '#2B4C59'
  },
  {
    key: 'THUONG' as const,
    cardTitle: 'Dịu Ngọt & Yêu thương',
    teaName: 'Trà Hương Hoa Nhài',
    shortPill: 'Thương',
    pillBg: '#fdf2f8',
    pillText: '#c12a68',
    suggestPill: 'Hương gợi ý: Hoa Nhài (Thương)',
    heading: 'Trà Hương Hoa Nhài — Dịu ngọt lời yêu thương',
    quote:
      '"Thay cho những cái ôm siết chặt và sự vỗ về dịu dàng nhất. Gửi đến người một chút ngọt ngào để xoa dịu những ngày dài mỏi mệt, một chút hương thơm nồng ấm để biết rằng luôn có một người âm thầm dõi theo, yêu thương và trân trọng bạn vô điều kiện."',
    scentProfile:
      'Hương hoa nhài đêm ngát hương, quyến rũ nhưng rất đỗi gần gũi. Khi thưởng thức, vị trà mềm mại, êm dịu, để lại cảm giác ngọt ngào vương vấn thật lâu nơi cuống họng.',
    occasion:
      'Nửa kia, người thương, bạn đời; hoặc gửi tặng mẹ, chị gái, những người phụ nữ dịu dàng quanh bạn vào những ngày kỷ niệm hoặc chẳng nhân dịp gì cả.',
    price: 289000,
    productId: 'nhai-thuong',
    image: '/assets/optimized/detail-nhai-thuong-2.webp',
    boxImage: '/assets/optimized/card-nhai-thuong-800.webp',
    illustration: '/assets/optimized/illus-hoanhai.webp',
    accentColor: '#8B4F58'
  },
  {
    key: 'CAM' as const,
    cardTitle: 'Tri ân & Hoài niệm',
    teaName: 'Trà Hương Hoa Sói',
    shortPill: 'Cảm',
    pillBg: '#edfdec',
    pillText: '#4aa12b',
    suggestPill: 'Hương gợi ý: Hoa Sói (Cảm)',
    heading: 'Trà Hương Hoa Sói — Tấm lòng Tri Ân trầm lắng',
    quote:
      '"Gửi ngàn lời cảm kích vì sự hiện diện của người trong cuộc đời này. Cảm ơn những sẻ chia, nâng đỡ và cả những sự thấu hiểu không cần nói thành lời. Hương trà mộc mạc nhưng bền bỉ này chính là biểu tượng cho tấm lòng tri ân sâu sắc và sự trân quý không bao giờ phai nhạt."',
    scentProfile:
      'Hương hoa sói mang nét trầm ấm, mộc mạc, thoang thoảng chút hương thảo mộc cổ điển và nắng ấm. Vị trà đậm đà, chát đượm nhưng hậu ngọt rất sâu và bền bỉ qua nhiều tuần nước.',
    occasion:
      'Thầy cô giáo, sếp, đồng nghiệp, đối tác, hoặc những vị ân nhân đã từng giúp đỡ mình trên đường đời.',
    price: 289000,
    productId: 'soi-cam',
    image: '/assets/optimized/detail-soi-cam-2.webp',
    boxImage: '/assets/optimized/card-soi-cam-800.webp',
    illustration: '/assets/optimized/illus-hoasoi.webp',
    accentColor: '#4F6238'
  },
  {
    key: 'NHO' as const,
    cardTitle: 'Ký ức & Dịu êm',
    teaName: 'Trà Hương Cốm',
    shortPill: 'Nhớ',
    pillBg: '#f3ebde',
    pillText: '#1e535c',
    suggestPill: 'Hương gợi ý: Cốm (Nhớ)',
    heading: 'Trà Hương Cốm — Nhắc lại những ngày tháng êm đềm',
    quote:
      '"Gửi một chút hương xưa để gợi nhắc về những tháng năm cũ, những kỷ niệm đẹp đẽ mà chúng ta đã cùng nhau đi qua. Dù thời gian có trôi và khoảng cách có bao xa, mong người khi thưởng thức chén trà này sẽ luôn nhớ về nhau với những tình cảm trong trẻo, nguyên vẹn như thuở ban đầu."',
    scentProfile:
      'Hương cốm non mộc mạc, thơm bùi như mùi lúa mới và sắc thu Hà Nội. Vị trà thanh tao, nhẹ nhàng, mang lại cảm giác bình yên, thân thuộc như được trở về nhà.',
    occasion:
      'Những người bạn cũ lâu ngày chưa gặp, người thân đang ở phương xa, những người con xa quê, hoặc những tâm hồn yêu nét đẹp hoài cổ.',
    price: 289000,
    productId: 'com-nho',
    image: '/assets/optimized/detail-com-nho-2.webp',
    boxImage: '/assets/optimized/card-com-nho-800.webp',
    illustration: '/assets/optimized/illus-com.webp',
    accentColor: '#7D6A27'
  }
];

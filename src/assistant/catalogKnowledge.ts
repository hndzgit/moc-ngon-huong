// src/assistant/catalogKnowledge.ts
// Mộc Ngôn Hương — Structured Grounded Knowledge Base from Product Catalog

import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../data/products';
import { INTENTIONS } from '../data/giftJourney';
import { Product } from '../types';

export interface CatalogProductFact {
  id: string;
  name: string;
  shortName: string;
  emotion: string;
  emotionLabel: string;
  price: number;
  formattedPrice: string;
  weight: string;
  packaging: string;
  ingredients: string[];
  scentNotes: string[];
  tasteNotes: string;
  brewing: {
    temp: string;
    time: string;
    amount: string;
  };
  suitableRecipients: string[];
  suitableOccasions: string[];
  storyQuote: string;
  storyTitle: string;
  shortDesc: string;
  isCombo: boolean;
}

export const CATALOG_FACTS: Record<string, CatalogProductFact> = {
  'buoi-an': {
    id: 'buoi-an',
    name: 'Trà Hương Bưởi – AN',
    shortName: 'Trà hương Bưởi (AN)',
    emotion: 'AN',
    emotionLabel: 'AN — Bình an & Biết ơn',
    price: 289000,
    formattedPrice: '289.000đ',
    weight: '100g',
    packaging: 'Hộp trà 100g thủ công + Kẹo lạc + Muỗng gỗ mộc + Thẻ thư pháp kèm mã QR audio',
    ingredients: ['Trà xanh Tân Cương tuyển chọn', 'Hoa bưởi tươi La Bằng ướp truyền thống'],
    scentNotes: ['Mùi hương hoa bưởi tự nhiên the mát, thanh sạch, dịu nhẹ đầu xuân'],
    tasteNotes: 'Vị trà chát dịu nơi đầu lưỡi, chuyển dần sang hậu vị ngọt sâu lắng và thanh khiết.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 phút',
      amount: '5g trà / 150ml nước (hãm được 3-4 tuần nước)',
    },
    suitableRecipients: ['Ông bà', 'Cha mẹ', 'Thầy cô', 'Người lớn tuổi', 'Bản thân khi cần bình an thư giãn'],
    suitableOccasions: ['Lễ Tết', 'Mừng thọ', 'Lễ Vu Lan', 'Tri ân thầy cô 20/11', 'Quà thăm hỏi gia đình'],
    storyQuote: 'Chúc người một đời an nhiên, lòng luôn tĩnh tại như mặt hồ phẳng lặng trước những biến thiên của cuộc đời.',
    storyTitle: 'Trà Hương Bưởi - Gửi trọn ước nguyện Bình An',
    shortDesc: 'Gói trọn hương bưởi thanh sạch của những ngày đầu xuân, vị trà chát dịu quyện cùng hậu ngọt sâu lắng.',
    isCombo: false,
  },
  'nhai-thuong': {
    id: 'nhai-thuong',
    name: 'Trà Nhài – THƯƠNG',
    shortName: 'Trà Nhài (THƯƠNG)',
    emotion: 'THUONG',
    emotionLabel: 'THƯƠNG — Dịu Ngọt & Yêu thương',
    price: 289000,
    formattedPrice: '289.000đ',
    weight: '100g',
    packaging: 'Hộp trà 100g thủ công + Kẹo lạc + Muỗng gỗ mộc + Thẻ thư pháp kèm mã QR audio',
    ingredients: ['Trà xanh Tân Cương hảo hạng', 'Hoa nhài quế tươi nở đêm muộn'],
    scentNotes: ['Hương hoa nhài nồng nàn, thơm ngát, ngọt ngào và lưu luyến'],
    tasteNotes: 'Vị chát êm dịu, hương hoa tràn ngập vòm họng, hậu vị ngọt thanh mát kéo dài.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 phút',
      amount: '5g trà / 150ml nước',
    },
    suitableRecipients: ['Mẹ', 'Người yêu/Bạn gái', 'Vợ', 'Chị em gái', 'Người thương'],
    suitableOccasions: ['Ngày 8/3', 'Ngày 20/10', 'Sinh nhật', 'Kỷ niệm tình yêu', 'Ngày lễ tình nhân'],
    storyQuote: 'Dành cho người tôi thương nhất trần đời — mong từng ngày trôi qua đều êm đềm như một tách trà thơm.',
    storyTitle: 'Trà Nhài - Gửi lời thương dịu ngọt',
    shortDesc: 'Ủ từ những bông nhài quế nở rộ lúc đêm muộn, mang hương thơm nồng nàn nhưng thanh thoát, lưu luyến.',
    isCombo: false,
  },
  'soi-cam': {
    id: 'soi-cam',
    name: 'Trà Hoa Sói – CẢM',
    shortName: 'Trà Hoa Sói (CẢM)',
    emotion: 'CAM',
    emotionLabel: 'CẢM — Trầm Ấm & Tri ân',
    price: 289000,
    formattedPrice: '289.000đ',
    weight: '100g',
    packaging: 'Hộp trà 100g thủ công + Kẹo lạc + Muỗng gỗ mộc + Thẻ thư pháp kèm mã QR audio',
    ingredients: ['Búp chè non Tân Cương tuyển chọn', 'Hoa sói tươi cổ truyền vùng cao'],
    scentNotes: ['Hương thơm trầm ấm, thảo mộc quý phái, đượm sâu cổ kính'],
    tasteNotes: 'Tiền chát đượm, hậu ngọt thanh, hương thơm thảo mộc quý phái lưu giữ lâu bền.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 phút',
      amount: '5g trà / 150ml nước',
    },
    suitableRecipients: ['Thầy cô giáo', 'Cấp trên/Sếp', 'Đối tác', 'Khách quý', 'Người có công giúp đỡ'],
    suitableOccasions: ['Ngày Nhà giáo 20/11', 'Lễ tri ân', 'Quà gặp mặt đối tác', 'Khai trương', 'Cuối năm'],
    storyQuote: 'Biết ơn vì người đã luôn ở đó, chỉ đường dẫn lối và đồng hành qua những chặng đường gian khó.',
    storyTitle: 'Trà Hoa Sói - Lời cảm ơn và lòng tri ân sâu sắc',
    shortDesc: 'Dòng trà ướp hoa sói cổ truyền quý hiếm với hương thảo mộc trầm ấm, đại diện cho lòng tri ân sâu sắc.',
    isCombo: false,
  },
  'com-nho': {
    id: 'com-nho',
    name: 'Trà Cốm – NHỚ',
    shortName: 'Trà Cốm (NHỚ)',
    emotion: 'NHO',
    emotionLabel: 'NHỚ — Thơm Bùi & Kỷ niệm',
    price: 289000,
    formattedPrice: '289.000đ',
    weight: '100g',
    packaging: 'Hộp trà 100g thủ công + Kẹo lạc + Muỗng gỗ mộc + Thẻ thư pháp kèm mã QR audio',
    ingredients: ['Trà xanh Tân Cương', 'Cốm non mùa thu Mễ Trì truyền thống'],
    scentNotes: ['Hương cốm non thơm bùi, dịu ngọt, đậm phong vị mùa thu Hà Nội'],
    tasteNotes: 'Vị bùi béo nhẹ của nếp non hòa quyện cùng vị chát thanh thoát của búp chè tươi.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 phút',
      amount: '5g trà / 150ml nước',
    },
    suitableRecipients: ['Bạn tri kỷ', 'Bạn thân', 'Người đi xa quê hương', 'Đồng nghiệp thân thiết'],
    suitableOccasions: ['Họp mặt bạn cũ', 'Quà chia tay/quà tiễn bạn', 'Kỷ niệm tình bạn', 'Tết sum vầy'],
    storyQuote: 'Có những kỷ niệm dù qua bao năm tháng vẫn thơm lành và vẹn nguyên như hương cốm mùa thu.',
    storyTitle: 'Trà Cốm - Ký ức ngọt lành của tình bạn',
    shortDesc: 'Hương cốm non thơm bùi gói trọn ký ức mùa thu, là món quà gắn kết những tâm hồn tri kỷ.',
    isCombo: false,
  },
  'hop-qua-tam-y': {
    id: 'hop-qua-tam-y',
    name: 'Hộp Quà Trà Đa Hương — "TÂM Ý"',
    shortName: 'Combo Signature "Tâm Ý"',
    emotion: 'COMBO',
    emotionLabel: 'MÓN QUÀ ĐẶC BIỆT',
    price: 399000,
    formattedPrice: '399.000đ',
    weight: '4 vị trà (200g tổng cộng: 4 hộp 50g) + Kẹo lạc + Phụ kiện',
    packaging: 'Hộp cứng sang trọng + 4 hộp trà 50g (Bưởi, Nhài, Sói, Cốm) + Kẹo lạc + Túi vải đay + Muỗng gỗ + 4 Thẻ thông điệp QR',
    ingredients: ['4 hộp trà 50g đủ 4 vị: An, Thương, Cảm, Nhớ', 'Kẹo lạc trà xanh', 'Túi vải đay & muỗng gỗ'],
    scentNotes: ['Trọn vẹn 4 tầng hương: Hoa Bưởi thanh sạch, Hoa Nhài dịu ngọt, Hoa Sói trầm ấm, Cốm non thơm bùi'],
    tasteNotes: 'Hành trình trải nghiệm đầy đủ 4 cung bậc cảm xúc trong cùng một set quà tinh tế.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 phút',
      amount: '5g trà / 150ml nước',
    },
    suitableRecipients: ['Gia đình', 'Bố mẹ', 'Thông gia', 'Đối tác kinh doanh', 'Khách quý', 'Người quan trọng'],
    suitableOccasions: ['Lễ Tết Nguyên Đán', 'Ra mắt gia đình', 'Mừng thọ', 'Quà biếu doanh nghiệp', 'Đại lễ kỷ niệm'],
    storyQuote: 'Trao hương, gửi lời thương — một món quà, bốn sắc hương trà Việt trọn vẹn tình cảm.',
    storyTitle: 'Hộp Quà Tâm Ý - Trọn vẹn bốn phong vị trà Việt',
    shortDesc: 'Gói trọn cả 4 thức trà tinh túy cùng kẹo lạc truyền thống và phụ kiện, chỉn chu và trang trọng nhất.',
    isCombo: true,
  },
};

export const LOOSE_TEA_FACTS = {
  pricePerBox: 75000,
  formattedPrice: '75.000đ/hộp',
  weight: '50g',
  description: 'Hộp trà lẻ 50g tiện lợi để tự thưởng thức hoặc dùng thử các vị trà trước khi mua set quà lớn.',
  flavors: ['Bưởi – AN (75k)', 'Nhài – THƯƠNG (75k)', 'Hoa Sói – CẢM (75k)', 'Cốm – NHỚ (75k)'],
};

export const STORE_POLICIES = {
  shipping: {
    fee: 'Miễn phí vận chuyển toàn quốc (Chương trình Ra mắt).',
    estimatedDays: 'Giao nhanh 1–2 ngày tại nội thành Hà Nội, 2–4 ngày đối với các tỉnh thành khác.',
    inspection: 'Khách hàng được đồng kiểm (kiểm tra hàng) trước khi thanh toán.',
  },
  payment: {
    methods: [
      'Thanh toán khi nhận hàng (COD).',
      'Chuyển khoản ngân hàng trực tiếp qua QR code nhanh (Vietcombank/MBBank).',
    ],
    note: 'Không thu thêm bất kỳ phụ phí nào.',
  },
  returnPolicy: {
    time: 'Đổi mới trong vòng 7 ngày kể từ khi nhận hàng.',
    conditions: 'Áp dụng khi sản phẩm bị lỗi bao bì, móp méo do vận chuyển hoặc không đúng quy cách.',
  },
  contact: {
    hotline: '0889 742 556 (Hỗ trợ Hotline & Zalo 8:00 - 21:00)',
    address: 'Xã La Bằng, Huyện Đại Từ, Tỉnh Thái Nguyên',
    email: 'taikhoan@mail.mocngonhuong.com',
  },
  corporateGifting: {
    benefits: [
      'Chiết khấu hấp dẫn theo số lượng đơn hàng.',
      'Hỗ trợ in thiệp lời chúc thương hiệu và gắn logo doanh nghiệp.',
      'Giao hàng tận nơi theo danh sách đối tác trên toàn quốc.',
      'Xuất hóa đơn và hợp đồng đầy đủ.',
    ],
    contactMethod: 'Hotline/Zalo 0889 742 556 hoặc để lại thông tin tại trang Đối tác Doanh nghiệp.',
  },
};

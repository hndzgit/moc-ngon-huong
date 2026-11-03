// src/assistant/synonyms.ts
// Mộc Ngôn Hương — Vietnamese Synonyms & Entity Dictionaries

import { RecipientCategory, OccasionCategory, FlavorProfileCategory } from './types';

export const RECIPIENT_SYNONYMS: Record<RecipientCategory, string[]> = {
  mother: ['me', 'ma', 'u', 'bu', 'me de', 'me chong', 'me vo', 'phu huynh nu', 'me yeu'],
  father: ['bo', 'ba', 'cha', 'tia', 'phu than', 'bo de', 'bo chong', 'bo vo'],
  parents: ['bo me', 'ba me', 'cha me', 'song than', 'phu huynh', 'hai bac'],
  grandparents: ['ong ba', 'ong noi', 'ba noi', 'ong ngoai', 'ba ngoai', 'ong', 'ba'],
  teacher: ['thay co', 'co giao', 'thay giao', 'nguoi thay', 'nguoi co', 'nha giao', 'giao vien'],
  partner: ['nguoi yeu', 'ban gai', 'ban trai', 'vo', 'chong', 'crush', 'nua kia', 'nguoi thuong', 'em yeu', 'anh yeu'],
  friend: ['ban than', 'ban tri ky', 'tri ky', 'dong nghiep', 'ban cu', 'tri am', 'ban be', 'nguoi ban', 'cho ban'],
  business: ['doi tac', 'sep', 'khach hang', 'khach quy', 'giam doc', 'cong ty', 'doanh nghiep', 'chu tich'],
  self: ['cho minh', 'cho ban than', 'tu uong', 'minh uong', 'thuong thuc', 'toi uong'],
  general: ['nguoi than', 'nguoi quen', 'ai do'],
};

export const OCCASION_SYNONYMS: Record<OccasionCategory, string[]> = {
  tet: ['tet', 'nam moi', 'xuan', 'tet nguyen dan', 'chuc tet', 'bieu tet', 'qua tet', 'xuan ve'],
  teachers_day: ['20/11', '20-11', 'nha giao', 'ngay nha giao', 'tri an thay co', 'thang 11'],
  women_day: ['8/3', '8-3', '20/10', '20-10', 'phu nu', 'ngay phu nu', 'quoc te phu nu'],
  birthday: ['sinh nhat', 'mung tho', 'thoi noi', 'ky niem sinh nhat'],
  vu_lan: ['vu lan', 'bao hieu', 'mua vu lan', 'ram thang 7'],
  gratitude: ['cam on', 'tri an', 'biet on', 'den dap', 'loi cam on'],
  corporate: ['doanh nghiep', 'hoi nghi', 'su kien', 'khai truong', 'tang cong ty', 'cuoi nam', 'tong ket'],
  family_visit: ['ra mat', 've que', 'tham nha', 'tham que', 'gap bo me', 'qua tham'],
  general: ['dip le', 'ngay thuong', 'tang qua'],
};

export const FLAVOR_SYNONYMS: Record<FlavorProfileCategory, string[]> = {
  gentle: ['nhe', 'thom nhe', 'thanh', 'thanh tao', 'thoang thoang', 'diu', 'thanh mat', 'khong gat', 'de uong'],
  sweet: ['ngot', 'diu ngot', 'ngot ngao', 'thom ngat', 'nong nan', 'thom lau', 'hoa nhai', 'nhai'],
  warm: ['tram', 'tram am', 'thao moc', 'am ap', 'sau lang', 'hoa soi', 'soi'],
  nutty: ['bui', 'thom bui', 'com', 'com non', 'nep non', 'vi bui', 'huong com'],
  rich: ['dam', 'dam da', 'chat', 'chat dam', 'tien chat hau ngot', 'chat truoc ngot sau', 'hau ngot', 'ngot hau', 'ngot sau'],
  floral: ['huong hoa', 'hoa tuoi', 'uop hoa', 'hoa buoi', 'hoa nhai', 'hoa soi'],
};

export const INTENT_KEYWORDS = {
  greeting: ['chao', 'xin chao', 'hello', 'hi', 'alo', 'chao shop', 'chao ban', 'co ai khong'],
  price: ['gia', 'gia ca', 'bao nhieu', 'bao nhieu tien', 'bao tien', 'nhiu tien', 'nhieu tien', 'ton bao nhieu', 'gia sao', 'bang gia'],
  recommend: [
    'tu van',
    'goi y',
    'nen mua',
    'chon gi',
    'mua gi',
    'loai nao tot',
    'loai nao hop',
    'tang ai',
    'mua qua',
    'can tim',
    'tim mon qua',
    'mon qua',
    'dac biet',
    'mua tra',
  ],
  cheaper: ['re hon', 're hon nua', 'tiet kiem', 'vua tui tien', 'it tien hon', 'kinh te hon', 'co loai re', 're nhat'],
  cardWriting: ['viet thiep', 'viet loi chuc', 'goi y loi chuc', 'cau chuc', 'thiep mung', 'viet gi', 'loi nhan', 'thiep'],
  brewing: ['cach pha', 'pha tra', 'nhiet do', 'may phut', 'u tra', 'ham tra', 'pha the nao', 'cach dung'],
  shipping: ['ship', 'giao hang', 'van chuyen', 'phi ship', 'bao lau nhan', 'bao gio toi', 'giao tan noi'],
  payment: [
    'thanh toan',
    'chuyen khoan',
    'cod',
    'nhan hang tra tien',
    'tra tien sau',
    'tra tien',
    'tien mat',
    'stk',
    'ngan hang',
    'kiem tra hang',
    'dong kiem',
  ],
  returnPolicy: ['doi tra', 'bao hanh', 'loi bao bi', 'tra lai hang', 'doi tra hang', 'chinh sach doi tra'],
  corporate: ['doanh nghiep', 'so luong lon', 'in logo', 'chiet khau doanh nghiep', 'hop dong', 'xuat hoa don'],
  discount: ['giam gia', 'khuyen mai', 'chiet khau', 'uu dai', 'voucher', 'sale', 'mua nhieu co bot'],
  story: ['nguon goc', 'xuat xu', 'cau chuyen', 'la bang', 'sao goi la', 'y nghia', 'tam y la gi'],
  contact: ['dia chi', 'o dau', 'hotline', 'so dien thoai', 'sdt', 'zalo', 'lien he', 'tiem tra o dau', 'dia chi tiem'],
  reset: [
    'bat dau lai',
    'xoa hoi thoai',
    'xoa tin nhan',
    'xoa cuoc tro chuyen',
    'reset',
    'lam moi',
    'hoi lai tu dau',
  ],
};

// src/assistant/englishNlp.ts
// Mộc Ngôn Hương — English NLP Lexicon, Catalog Knowledge & Gift Card Templates

import {
  FlavorProfileCategory,
  OccasionCategory,
  RecipientCategory,
} from './types';
import { TeaEmotion } from '../types';
import type { CatalogProductFact } from './catalogKnowledge';

export const EN_RECIPIENT_SYNONYMS: Record<RecipientCategory, string[]> = {
  mother: ['mom', 'mother', 'mommy', 'mama', 'mum', 'for mom', 'for my mom', 'for mother'],
  father: ['dad', 'father', 'daddy', 'papa', 'for dad', 'for my dad', 'for father'],
  parents: ['parents', 'mom and dad', 'mother and father', 'elderly parents', 'for parents'],
  grandparents: ['grandparents', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'elderly'],
  teacher: ['teacher', 'teachers', 'professor', 'lecturer', 'mentor', 'tutor', 'instructor'],
  partner: [
    'girlfriend',
    'boyfriend',
    'wife',
    'husband',
    'spouse',
    'lover',
    'significant other',
    'valentine',
    'partner',
    'loved one',
    'sweetheart',
  ],
  friend: ['friend', 'best friend', 'close friend', 'classmate', 'pal', 'buddy'],
  business: [
    'business',
    'business partner',
    'corporate',
    'client',
    'customer',
    'boss',
    'manager',
    'director',
    'executive',
    'colleague',
    'coworker',
    'vip',
  ],
  self: ['myself', 'for me', 'self', 'own use', 'drink myself', 'daily tea', 'personal'],
  general: ['family', 'relative', 'someone special', 'loved ones'],
};

export const EN_OCCASION_SYNONYMS: Record<OccasionCategory, string[]> = {
  tet: ['tet', 'lunar new year', 'new year', 'spring holiday'],
  teachers_day: ['teachers day', 'teacher day', '20/11', 'appreciation day'],
  women_day: ['womens day', 'women day', '8/3', '20/10', 'mothers day'],
  vu_lan: ['vu lan', 'filial piety'],
  birthday: ['birthday', 'bday', 'anniversary'],
  gratitude: ['thank you', 'thanks', 'gratitude', 'appreciation', 'grateful'],
  corporate: ['company event', 'conference', 'corporate gifting', 'client appreciation', 'year end', 'onboarding'],
  family_visit: ['visit family', 'housewarming', 'visiting', 'homecoming', 'reunion'],
  general: ['special occasion', 'celebration', 'gathering', 'holiday'],
};

export const EN_FLAVOR_SYNONYMS: Record<FlavorProfileCategory, string[]> = {
  gentle: ['light', 'gentle', 'mild', 'soft', 'refreshing', 'delicate', 'subtle', 'calming', 'calm'],
  sweet: ['sweet', 'jasmine', 'honeyed', 'romantic', 'fragrant', 'lush'],
  warm: ['warm', 'earthy', 'herbal', 'woody', 'classic', 'ancient', 'chloranthus'],
  nutty: ['nutty', 'green rice', 'toasted rice', 'creamy', 'autumn', 'nostalgic', 'com'],
  rich: ['rich', 'strong', 'bold', 'deep', 'full-bodied', 'full bodied', 'robust', 'crisp astringent'],
  floral: ['floral', 'flower', 'blossom', 'scented tea', 'aromatic', 'scent'],
};

export const EN_INTENT_KEYWORDS = {
  reset: ['start over', 'clear chat', 'new chat', 'new conversation', 'reset chat', 'reset'],
  cheaper: ['cheaper', 'more affordable', 'less expensive', 'lower price', 'budget option', 'affordable'],
  cardWriting: [
    'write a card',
    'write card',
    'gift card message',
    'card message',
    'greeting card',
    'write message',
    'message suggestion',
    'wish suggestion',
    'card wish',
    'personal note',
  ],
  brewing: [
    'how to brew',
    'brew',
    'brewing',
    'steep',
    'steeping',
    'water temperature',
    'temperature',
    'how to make tea',
    'prepare tea',
  ],
  discount: ['discount', 'promo', 'promotion', 'coupon', 'voucher', 'wholesale', 'bulk discount'],
  shipping: [
    'shipping',
    'delivery',
    'ship',
    'shipping fee',
    'free shipping',
    'delivery time',
    'how long does delivery',
    'courier',
  ],
  payment: ['payment', 'pay', 'vietqr', 'bank transfer', 'qr code', 'cash on delivery', 'cod', 'bidv'],
  price: ['how much', 'price', 'prices', 'cost', 'pricing'],
  corporate: ['corporate', 'company gift', 'bulk order', 'logo printing', 'in bulk', 'vat invoice', 'b2b'],
  returnPolicy: ['return policy', 'exchange', 'refund', 'damaged', 'broken box', 'warranty'],
  story: ['origin', 'story', 'la bang', 'tan cuong', 'heritage', 'craft', 'artisan', 'about moc ngon huong'],
  contact: ['contact', 'address', 'store location', 'shop address', 'hotline', 'phone', 'zalo', 'visit store'],
  recommend: ['recommend', 'suggest', 'gift for', 'tea gift', 'looking for', 'which tea', 'best tea', 'help me choose'],
  greeting: ['hello', 'hi there', 'hey', 'good morning', 'good afternoon', 'good evening'],
};

export const CATALOG_FACTS_EN: Record<string, CatalogProductFact> = {
  'buoi-an': {
    id: 'buoi-an',
    name: 'Pomelo Blossom Tea – AN',
    shortName: 'Pomelo Blossom Tea (AN)',
    emotion: 'AN',
    emotionLabel: 'AN — Peace & Gratitude',
    price: 289000,
    formattedPrice: '289,000 VND',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    ingredients: ['Hand-picked Tan Cuong green tea buds', 'Fresh pomelo blossoms steeped traditionally'],
    scentNotes: ['Cool, crisp, and clean early-spring pomelo blossom aroma'],
    tasteNotes: 'Soft initial briskness on the tongue tapering smoothly into a pure, lingering sweet finish.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 minutes',
      amount: '5g tea / 150ml water (good for 3–4 infusions)',
    },
    suitableRecipients: ['Parents', 'Grandparents', 'Teachers', 'Elders', 'Quiet self-care moments'],
    suitableOccasions: ['Tet holiday', 'Longevity celebrations', 'Appreciation gifts', 'Family visits'],
    storyQuote: 'Wishing you a life of stillness and peace, with a heart calm as glassy water amidst life’s shifting tides.',
    storyTitle: 'Pomelo Blossom Tea — Sending Wishes of Serenity',
    shortDesc: 'Crisp, pure early-spring pomelo blossom aroma balanced with gentle briskness and a deep sweet finish.',
    isCombo: false,
  },
  'nhai-thuong': {
    id: 'nhai-thuong',
    name: 'Jasmine Blossom Tea – THƯƠNG',
    shortName: 'Jasmine Blossom Tea (THƯƠNG)',
    emotion: 'THUONG',
    emotionLabel: 'THƯƠNG — Affection & Tenderness',
    price: 289000,
    formattedPrice: '289,000 VND',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    ingredients: ['Fine Tan Cuong green tea', 'Night-blooming fresh jasmine buds'],
    scentNotes: ['Lush, lingering, gracefully sweet night jasmine fragrance'],
    tasteNotes: 'Silky smoothness with fragrant floral lift and an effortless, sweet finish.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 minutes',
      amount: '5g tea / 150ml water',
    },
    suitableRecipients: ['Mother', 'Partner / Spouse', 'Girlfriend', 'Sisters', 'Loved ones'],
    suitableOccasions: ['International Women’s Day', 'Birthdays', 'Anniversaries', 'Everyday care'],
    storyQuote: 'For the person cherished most — may quiet days unfold as gently as a warm cup of jasmine tea.',
    storyTitle: 'Jasmine Blossom Tea — Tender Words of Affection',
    shortDesc: 'Infused from night-blooming jasmine buds, offering a graceful, sweet-floral linger with comforting warmth.',
    isCombo: false,
  },
  'soi-cam': {
    id: 'soi-cam',
    name: 'Wild Chloranthus Tea – CẢM',
    shortName: 'Wild Chloranthus Tea (CẢM)',
    emotion: 'CAM',
    emotionLabel: 'CẢM — Gratitude & Respect',
    price: 289000,
    formattedPrice: '289,000 VND',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    ingredients: ['Selected Tan Cuong young tea buds', 'Heirloom highland wild chloranthus blossoms'],
    scentNotes: ['Warm, noble herbal fragrance with timeless depth'],
    tasteNotes: 'Distinctive brisk richness followed by a calm, sweet herbal finish across multiple infusions.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 minutes',
      amount: '5g tea / 150ml water',
    },
    suitableRecipients: ['Teachers', 'Mentors', 'Executives', 'Business Partners', 'Honored Guests'],
    suitableOccasions: ['Teachers’ Day', 'Gratitude Milestones', 'Corporate Visits', 'Grand Openings'],
    storyQuote: 'Grateful for every steady step you guided and every quiet moment you stood beside us.',
    storyTitle: 'Wild Chloranthus Tea — Quiet Heart of Gratitude',
    shortDesc: 'Rare heritage chloranthus-scented tea with a grounded herbal warmth symbolizing sincere respect.',
    isCombo: false,
  },
  'com-nho': {
    id: 'com-nho',
    name: 'Young Green Rice Tea – NHỚ',
    shortName: 'Young Green Rice Tea (NHỚ)',
    emotion: 'NHO',
    emotionLabel: 'NHỚ — Nostalgia & Gentle Calm',
    price: 289000,
    formattedPrice: '289,000 VND',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    ingredients: ['Selected green tea leaves', 'Natural young green rice aroma & lotus leaf'],
    scentNotes: ['Toasted young sticky rice aroma reminiscent of Hanoi autumn'],
    tasteNotes: 'Creamy, gentle nuttiness layered over bright green tea freshness.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 minutes',
      amount: '5g tea / 150ml water',
    },
    suitableRecipients: ['Close Friends', 'Old Classmates', 'Friends Abroad', 'Thoughtful Colleagues'],
    suitableOccasions: ['Reunions', 'Farewell Gifts', 'Friendship Milestones', 'Autumn Gatherings'],
    storyQuote: 'Some memories remain bright and fragrant across decades, just like toasted green rice in autumn.',
    storyTitle: 'Young Green Rice Tea — Whisper of Cherished Days',
    shortDesc: 'Warm, nutty young rice fragrance evoking Hanoi autumn breezes and treasured friendships.',
    isCombo: false,
  },
  'hop-qua-tam-y': {
    id: 'hop-qua-tam-y',
    name: 'Multi-Flavor Gift Box — "TÂM Ý"',
    shortName: 'Signature Gift Box "Tâm Ý"',
    emotion: 'COMBO',
    emotionLabel: 'SPECIAL GIFT',
    price: 399000,
    formattedPrice: '399,000 VND',
    weight: '4 teas (200g total: four 50g boxes) + Peanut Brittle + Accessories',
    packaging: 'Rigid Gift Box + Four 50g tea boxes (AN, THƯƠNG, CẢM, NHỚ) + Peanut Brittle + Burlap Tote + Wooden Spoon + 4 QR Cards',
    ingredients: ['Four 50g tea boxes (Pomelo, Jasmine, Chloranthus, Green Rice)', 'Green-tea peanut brittle, burlap tote & wooden spoon'],
    scentNotes: ['All 4 signature bouquets in one curated presentation'],
    tasteNotes: 'A complete journey through Vietnam’s four classic flower-scented green tea moods.',
    brewing: {
      temp: '80°C - 85°C',
      time: '3 - 4 minutes',
      amount: '5g tea / 150ml water',
    },
    suitableRecipients: ['Families', 'Parents & In-laws', 'Business Partners', 'VIP Clients', 'Major Celebrations'],
    suitableOccasions: ['Tet Celebrations', 'Executive Gifting', 'Family Introductions', 'Major Milestones'],
    storyQuote: 'Sharing aroma, sending heartfelt affection — four floral tea moods unified in one complete gift.',
    storyTitle: '"Tâm Ý" Gift Box — Holding Every Shade of Affection',
    shortDesc: 'Brings all four signature teas together with peanut brittle, wooden spoon, and four QR keepsake cards.',
    isCombo: true,
  },
};

export const STORE_POLICIES_EN = {
  shipping: {
    fee: 'Complimentary nationwide shipping.',
    estimatedDays: '1–2 days within Hanoi inner city; 2–4 days to other provinces.',
    inspection: 'Customers may inspect the parcel before completing payment on COD orders.',
  },
  payment: {
    methods: [
      'Cash on Delivery (COD).',
      'Direct VietQR Bank Transfer (BIDV • NAPAS 247).',
    ],
    note: 'Listed VND prices apply with zero hidden surcharges.',
  },
  returnPolicy: {
    time: 'Within 7 days of delivery.',
    conditions: 'Applicable if packaging is damaged in transit or items differ from your confirmed order.',
  },
  contact: {
    hotline: '0889 742 556 (Hotline & Zalo: 8:00 AM – 9:00 PM ICT)',
    address: 'Workshop: La Bang Commune, Dai Tu District, Thai Nguyen • Pickup: 42 Hang Dieu St, Hoan Kiem, Hanoi',
    email: 'mocngonhuong@gmail.com',
  },
  corporateGifting: {
    contactMethod: 'Hotline/Zalo 0889 742 556 or submit an inquiry on our Corporate Gifts page.',
  },
};

export const EN_RECIPIENT_DISPLAY_NAMES: Record<RecipientCategory, string> = {
  mother: 'Mom',
  father: 'Dad',
  parents: 'Mom & Dad',
  grandparents: 'Grandparents',
  teacher: 'Teacher',
  partner: 'My Loved One',
  friend: 'Dear Friend',
  business: 'Valued Partner',
  self: 'Myself',
  general: 'Loved One',
};

export const EN_TEMPLATES: Record<
  RecipientCategory,
  {
    warm: string[];
    formal: string[];
    short: string[];
    recommendedEmotion: TeaEmotion;
    intentionId: 'peace' | 'love' | 'thanks' | 'memory';
  }
> = {
  mother: {
    warm: [
      'Mom, sharing a cup of fragrant tea with you—wishing you peaceful mornings, light rest, and vibrant health every single day.',
      'Dear Mom, whenever your days grow busy, pause for a warm cup of blossom tea. Wishing you enduring joy and serenity.',
    ],
    formal: [
      'Wishing Mom abundant health, serenity, and peace. May this gentle tea convey gratitude words alone could never hold.',
    ],
    short: [
      'A cup of fragrant tea for Mom—wishing you lasting peace and vibrant health.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  father: {
    warm: [
      'Dad, sending you handcrafted floral tea to unwind with in quiet moments—wishing you strength, calm, and good health always.',
    ],
    formal: [
      'Wishing Dad enduring health, composure, and peaceful longevity. With deepest gratitude and respect.',
    ],
    short: [
      'A warm cup of tea for Dad—wishing you peace of mind and lasting wellness.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  parents: {
    warm: [
      'Sending Mom & Dad an aromatic pot of tea—wishing every morning brings calm, health, and warm laughter together.',
    ],
    formal: [
      'With deepest filial gratitude, wishing Mom & Dad good health, peace at heart, and joyful longevity.',
    ],
    short: [
      'Handcrafted tea sent with love—wishing Mom & Dad lasting wellness and peace.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  grandparents: {
    warm: [
      'Wishing Grandma and Grandpa radiant health, peaceful mornings over fragrant pomelo tea, and joyful family moments.',
    ],
    formal: [
      'Respectfully wishing Grandma and Grandpa longevity, serenity, and peaceful days surrounded by family.',
    ],
    short: [
      'A cup of serene pomelo tea for Grandma and Grandpa—wishing you health and joy.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  teacher: {
    warm: [
      'Sending a fragrant cup of tea with heartfelt thanks for every patient lesson, guidance, and care you shared.',
    ],
    formal: [
      'Respectfully wishing you strong health, fulfillment, and continued inspiration on your noble teaching journey.',
    ],
    short: [
      'With sincere gratitude for your wisdom and guidance—wishing you calm joy.',
    ],
    recommendedEmotion: 'CAM',
    intentionId: 'thanks',
  },
  partner: {
    warm: [
      'A quiet breath of jasmine tea for you—may every busy day soften into calm warmth whenever you sip it.',
    ],
    formal: [
      'To someone deeply cherished: thank you for walking alongside me. Wishing us endless tenderness and calm.',
    ],
    short: [
      'Fragrant jasmine tea, carrying quiet affection across every morning.',
    ],
    recommendedEmotion: 'THUONG',
    intentionId: 'love',
  },
  friend: {
    warm: [
      'Sending a taste of Hanoi autumn tea for your desk breaks—wishing you bright energy, luck, and smooth days ahead.',
    ],
    formal: [
      'Wishing a valued friend lasting vitality, smooth milestones, and cherished memories ahead.',
    ],
    short: [
      'Fragrant tea to keep warm memories close—here is to an enduring friendship.',
    ],
    recommendedEmotion: 'NHO',
    intentionId: 'memory',
  },
  business: {
    warm: [
      'Dear Partner, presenting a refined artisan tea gift with our wishes for lasting collaboration and shared prosperity.',
    ],
    formal: [
      'Respectfully gifting handcrafted La Bang green tea in sincere appreciation of your valued partnership and trust.',
    ],
    short: [
      'Thank you for your partnership—wishing your team continued success and prosperity.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'thanks',
  },
  self: {
    warm: [
      'For myself: a gentle pause amidst busy routines—breathe in calm tea steam and be kind to yourself today.',
    ],
    formal: [
      'Taking a mindful moment with clean artisan tea to restore inner calm and clarity.',
    ],
    short: [
      'Slow down, steep a cup, and honor a quiet moment just for you.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  general: {
    warm: [
      'Sharing fragrant artisan tea with wishes for peaceful days filled with warmth, gentle stillness, and care.',
    ],
    formal: [
      'Respectfully wishing you enduring health, harmony, and fulfillment in every season ahead.',
    ],
    short: [
      'Sharing aroma, sending care—wishing you a peaceful and joyful day.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
};

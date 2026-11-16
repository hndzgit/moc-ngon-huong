import type { Product, ReviewItem, TeaEmotion } from '../types';
import type { SupportedLocale } from '../lib/locale';
import {
  FIGMA_CARD_COPY,
  FIGMA_DETAIL_GALLERY,
  FIGMA_LISTING_COPY,
  FIGMA_PRODUCT_COPY,
  FigmaGalleryItem,
} from './figmaMedia';
import { EMOTION_CARDS, PRODUCTS, REVIEWS } from './products';
import { INTENTIONS } from './giftJourney';

export type EmotionCardItem = (typeof EMOTION_CARDS)[number];

export interface LocalizedProductContent {
  name: string;
  shortName: string;
  emotionLabel: string;
  tagline: string;
  weight: string;
  packaging: string;
  badge: string;
  shortDesc: string;
  fullDesc: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyQuote: string;
  scentNotes: string[];
  tasteNotes: string;
  ingredients: string[];
  brewingTemp: string;
  brewingTime: string;
  brewingAmount: string;
  perfectGiftFor: string[];
  includedFlavors?: { id: string; title: string; subtitle: string; emotion: TeaEmotion; image: string }[];
  listingCopy?: string;
  cardCopy: {
    title: string;
    subtitle: string;
    description: string;
    note?: string;
  };
  figmaCopy: {
    title: string;
    summary: string;
    storyTitle: string;
    quote: string;
    scent: string;
    giftFor: string;
  };
  galleryAlts: string[];
  searchKeywords: string;
}

export const PRODUCT_EN_CONTENT: Record<string, LocalizedProductContent> = {
  'buoi-an': {
    name: 'Pomelo Blossom Tea – AN',
    shortName: 'Pomelo Blossom Tea (AN)',
    emotionLabel: 'AN — Peace & Gratitude',
    tagline: 'Capturing the crisp, pure pomelo blossom scent of early spring',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    badge: 'Bestseller',
    shortDesc:
      'Capturing the crisp, pure aroma of early spring pomelo blossoms, balanced with gentle astringency and a deep lingering sweetness. Each gift box includes traditional pomelo-scented tea, aromatic peanut brittle, a handcrafted wooden spoon, and a calligraphy audio-QR card leading back to calm memories.',
    fullDesc:
      'Capturing the crisp, pure aroma of early spring pomelo blossoms, balanced with gentle astringency and a deep lingering sweetness. Each gift box includes traditional pomelo-scented tea, aromatic peanut brittle, a handcrafted wooden spoon, and a calligraphy audio-QR card leading back to calm memories.',
    storyTitle: 'Pomelo Blossom Tea — Sending Wishes of Serenity',
    storyParagraphs: [
      'Opens with cool, ethereal natural pomelo blossom notes. A soft briskness on the tongue flows smoothly into a clean, deeply lingering sweet aftertaste.',
      'Parents and grandparents (Tet, longevity celebrations); anyone needing rest and gentle restoration; or quiet afternoon tea moments.',
    ],
    storyQuote:
      '"Wishing you a life of stillness and peace, with a heart calm as glassy water amidst life’s shifting tides. May the crisp scent of pomelo blossoms wash away quiet worries and return ease to the soul."',
    scentNotes: [
      'Opens with cool, ethereal natural pomelo blossom notes. A soft briskness on the tongue flows smoothly into a clean, deeply lingering sweet aftertaste.',
    ],
    tasteNotes: 'Soft initial briskness on the palate tapering into a lingering, pure sweet aftertaste.',
    ingredients: ['Hand-picked Tan Cuong green tea buds', 'Fresh pomelo blossoms steeped traditionally'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 mins',
    brewingAmount: '5g tea / 150ml water',
    perfectGiftFor: [
      'Parents and grandparents (Tet, longevity celebrations); anyone needing rest and gentle restoration; or quiet afternoon tea moments.',
    ],
    listingCopy:
      'Pure, refreshing pomelo blossom aroma melts daily tension away, bringing quiet serenity to every sip.',
    cardCopy: {
      title: 'Pomelo Blossom Tea (AN)',
      subtitle: 'Pomelo Blossom Tea',
      description:
        'Pure, refreshing pomelo blossom aroma melts daily tension away, bringing quiet serenity to every sip.',
    },
    figmaCopy: {
      title: 'Pomelo Blossom Tea – AN',
      summary:
        'Clean pomelo blossom aroma, silky liquor, and a gentle sweet finish that evokes calm serenity.',
      storyTitle: 'Pomelo Blossom Tea — Wishes of Serenity',
      quote:
        '"La Bang pomelo blossom elegance entwined with the tender sweetness of young tea buds, like a gentle embrace easing away long days."',
      scent: 'Early-season pomelo blossom, crisp and gently sweet',
      giftFor: 'Parents, Teachers, Lifelong Confidants',
    },
    galleryAlts: [
      'Pomelo Blossom Tea – AN with Moc Ngon Huong gift bag',
      'Holding the Pomelo Blossom Tea – AN gift box',
      'Collection of four flavors: An, Thuong, Cam, Nho',
    ],
    searchKeywords: 'pomelo blossom buoi an peace serenity MNH-A02',
  },
  'nhai-thuong': {
    name: 'Jasmine Blossom Tea – THƯƠNG',
    shortName: 'Jasmine Blossom Tea (THƯƠNG)',
    emotionLabel: 'THƯƠNG — Tender Love & Care',
    tagline: 'Scented with night-blooming jasmine buds harvested at dusk',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    badge: 'Customer Favorite',
    shortDesc:
      'Scented with night-blooming jasmine buds picked at dusk, offering an intimate yet graceful floral perfume that lingers tenderly on the palate. Features premium jasmine tea, crisp peanut brittle, a wooden tea scoop, and the "Thuong" keepsake card carrying unspoken devotion.',
    fullDesc:
      'Scented with night-blooming jasmine buds picked at dusk, offering an intimate yet graceful floral perfume that lingers tenderly on the palate. Features premium jasmine tea, crisp peanut brittle, a wooden tea scoop, and the "Thuong" keepsake card carrying unspoken devotion.',
    storyTitle: 'Jasmine Blossom Tea — Tender Words of Affection',
    storyParagraphs: [
      'Velvety night jasmine fragrance — enchanting yet warmly familiar. Each sip feels supple and smooth, leaving an affectionate sweetness that lingers long after.',
      'Your partner, spouse, or loved one; or for mothers, sisters, and cherished women on anniversaries or spontaneous days of appreciation.',
    ],
    storyQuote:
      '"In place of a warm embrace and gentle comfort. Sending a touch of sweetness to soothe weary days, and a quiet fragrance reminding you that someone is always cherishing you."',
    scentNotes: [
      'Velvety night jasmine fragrance — enchanting yet warmly familiar. Each sip feels supple and smooth, leaving an affectionate sweetness that lingers long after.',
    ],
    tasteNotes: 'Silky smooth liquor leaving an affectionate floral sweetness lingering on the finish.',
    ingredients: ['Selected young green tea buds', 'Fresh night-blooming jasmine petals'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 mins',
    brewingAmount: '5g tea / 150ml water',
    perfectGiftFor: [
      'Your partner, spouse, or loved one; or for mothers, sisters, and cherished women on anniversaries or spontaneous days of appreciation.',
    ],
    listingCopy:
      'Alluring, sweet jasmine notes that linger effortlessly — a tender expression of love for someone dear.',
    cardCopy: {
      title: 'Jasmine Blossom Tea (THƯƠNG)',
      subtitle: 'Jasmine Blossom Tea',
      description:
        'Alluring, sweet jasmine notes that linger effortlessly — a tender expression of love for someone dear.',
    },
    figmaCopy: {
      title: 'Jasmine Blossom Tea – THƯƠNG',
      summary:
        'Delicate, refined jasmine perfume evocative of tender love and thoughtful care.',
      storyTitle: 'Jasmine Blossom Tea — Tender Words of Affection',
      quote:
        '"Each petal steeped overnight preserves a lasting sweetness in memory, speaking the devotion too tender for words."',
      scent: 'Night-blooming jasmine, deep and lingering sweetness',
      giftFor: 'Partner, Girlfriend, Cherished Women',
    },
    galleryAlts: [
      'Jasmine Blossom Tea – THUONG with Moc Ngon Huong gift bag',
      'Holding the Jasmine Blossom Tea – THUONG gift box',
      'Collection of four flavors: An, Thuong, Cam, Nho',
    ],
    searchKeywords: 'jasmine blossom nhai thuong love affection MNH-T02',
  },
  'soi-cam': {
    name: 'Wild Chloranthus Tea – CẢM',
    shortName: 'Wild Chloranthus Tea (CẢM)',
    emotionLabel: 'CẢM — Gratitude & Remembrance',
    tagline: 'A rare heritage scented tea with a warm, grounded bouquet',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    badge: 'Heritage Craft',
    shortDesc:
      'A rare heirloom Vietnamese scented tea with a warm, earthy aroma reminiscent of morning sunlight. The "Cam" gift box unites rich chloranthus tea, rustic peanut brittle, a natural wooden spoon, and a gratitude QR card opening soothing traditional music.',
    fullDesc:
      'A rare heirloom Vietnamese scented tea with a warm, earthy aroma reminiscent of morning sunlight. The "Cam" gift box unites rich chloranthus tea, rustic peanut brittle, a natural wooden spoon, and a gratitude QR card opening soothing traditional music.',
    storyTitle: 'Wild Chloranthus Tea — Quiet Heart of Gratitude',
    storyParagraphs: [
      'Earthy and understated, blending hints of classic botanical herbs and golden warmth. Full-bodied liquor with rich structure and a deep sweet finish across multiple infusions.',
      'Teachers, mentors, executives, valued clients, or anyone who kindly guided your path.',
    ],
    storyQuote:
      '"With deepest gratitude for your presence along this journey. Thank you for every guidance, encouragement, and quiet understanding. This enduring tea reflects appreciation that never fades."',
    scentNotes: [
      'Earthy and understated, blending hints of classic botanical herbs and golden warmth. Full-bodied liquor with rich structure and a deep sweet finish across multiple infusions.',
    ],
    tasteNotes: 'Rich, resonant body with a long, deeply sweet finish through repeated steeps.',
    ingredients: ['Prime hook-leaf Thai Nguyen tea', 'Fresh chloranthus blossoms multi-kiln scented'],
    brewingTemp: '85°C - 90°C',
    brewingTime: '3 - 5 mins',
    brewingAmount: '5g tea / 150ml water',
    perfectGiftFor: [
      'Teachers, mentors, executives, valued clients, or anyone who kindly guided your path.',
    ],
    listingCopy:
      'Timeless, deeply grounded chloranthus notes expressing sincere gratitude to mentors, teachers, and parents.',
    cardCopy: {
      title: 'Wild Chloranthus Tea (CẢM)',
      subtitle: 'Wild Chloranthus Tea',
      description:
        'Timeless, deeply grounded chloranthus notes expressing sincere gratitude to mentors, teachers, and parents.',
    },
    figmaCopy: {
      title: 'Wild Chloranthus Tea – CẢM',
      summary:
        'Signature heritage floral aroma, poised and reflective, evoking appreciation and fond remembrance.',
      storyTitle: 'Wild Chloranthus Tea — Quiet Heart of Gratitude',
      quote:
        '"Traditional chloranthus is warm, poised, and steeped in heritage — the fitting tribute for mentors and guiding figures."',
      scent: 'Nostalgic chloranthus aroma, warm and enduring',
      giftFor: 'Teachers on Nov 20, Executives, Mentors',
    },
    galleryAlts: [
      'Wild Chloranthus Tea – CAM with Moc Ngon Huong gift bag',
      'Holding the Wild Chloranthus Tea – CAM gift box',
      'Collection of four flavors: An, Thuong, Cam, Nho',
    ],
    searchKeywords: 'chloranthus hoa soi cam gratitude thanks mentor teacher MNH-C02',
  },
  'com-nho': {
    name: 'Young Green Rice Tea – NHỚ',
    shortName: 'Young Green Rice Tea (NHỚ)',
    emotionLabel: 'NHỚ — Nostalgia & Gentle Calm',
    tagline: 'Awakens gentle nostalgia with the nutty aroma of young green rice flakes',
    weight: '100g',
    packaging: '100g Tea Box + Peanut Brittle + Wooden Spoon + QR Calligraphy Card',
    badge: 'Signature Craft',
    shortDesc:
      'Awakens warm memories with crisp notes of toasted young rice flakes — bottling Hanoi autumn in every cup. Inside awaits nutty green rice tea, crisp peanut brittle, a charming wooden spoon, and the "Nho" QR sound card cherished among old friends.',
    fullDesc:
      'Awakens warm memories with crisp notes of toasted young rice flakes — bottling Hanoi autumn in every cup. Inside awaits nutty green rice tea, crisp peanut brittle, a charming wooden spoon, and the "Nho" QR sound card cherished among old friends.',
    storyTitle: 'Young Green Rice Tea — Whisper of Cherished Days',
    storyParagraphs: [
      'Fragrant toasted young sticky rice aroma echoing fresh harvest fields and Hanoi autumn breezes. Smooth, easy-drinking liquor bringing the comfort of returning home.',
      'Old classmates, friends afar, loved ones abroad, or kindred souls fond of quiet nostalgia.',
    ],
    storyQuote:
      '"Sending a breath of familiar autumn scent to rekindle the years we walked side by side. Wherever time or distance carries us, may each cup recall the bright simplicity of those early days."',
    scentNotes: [
      'Fragrant toasted young sticky rice aroma echoing fresh harvest fields and Hanoi autumn breezes. Smooth, easy-drinking liquor bringing the comfort of returning home.',
    ],
    tasteNotes: 'Light, smooth liquor evoking warm familiarity and the comforting stillness of home.',
    ingredients: ['Selected green tea leaves', 'Natural young green rice aroma & lotus leaf'],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 mins',
    brewingAmount: '5g tea / 150ml water',
    perfectGiftFor: [
      'Old classmates, friends afar, loved ones abroad, or kindred souls fond of quiet nostalgia.',
    ],
    listingCopy:
      'Warm, nutty young green rice fragrance carrying the heart back to sunlit childhood memories.',
    cardCopy: {
      title: 'Young Green Rice Tea (NHỚ)',
      subtitle: 'Young Green Rice Tea',
      description:
        'Warm, nutty young green rice fragrance carrying the heart back to sunlit childhood memories.',
    },
    figmaCopy: {
      title: 'Young Green Rice Tea – NHỚ',
      summary:
        'Rustic, tender young green rice aroma restoring effortless calm, warmth, and nostalgia.',
      storyTitle: 'Young Green Rice Tea — Whisper of Cherished Days',
      quote:
        '"Fresh harvest rice fragrance woven through vibrant tea buds rekindles childhood days and youthful promises."',
      scent: 'Young rice grains, wildflower honey & autumn greens',
      giftFor: 'Old Classmates, Friends from University Days',
    },
    galleryAlts: [
      'Young Green Rice Tea – NHO with Moc Ngon Huong gift bag',
      'Holding the Young Green Rice Tea – NHO gift box',
      'Collection of four flavors: An, Thuong, Cam, Nho',
    ],
    searchKeywords: 'green rice com nho nostalgia hanoi autumn MNH-N02',
  },
  'hop-qua-tam-y': {
    name: 'Multi-Flavor Gift Box — "TÂM Ý"',
    shortName: 'Signature Gift Combo "Tâm Ý"',
    emotionLabel: 'SPECIAL GIFT',
    tagline: '“Sharing aroma, sending heartfelt affection.”',
    weight: '4 teas (Pomelo, Jasmine, Chloranthus, Green Rice) + Peanut Brittle + Tea Accessories',
    packaging: 'Four 50g tea boxes + Traditional Peanut Brittle + Burlap Tote + Wooden Spoon + 4 QR Message Cards',
    badge: 'Special Gift',
    shortDesc:
      'No need to choose just one — the "Tam Y" Gift Box gathers all four signature aromas (Pomelo Blossom, Jasmine, Chloranthus, Young Green Rice) with traditional peanut brittle and rustic wooden tea accessories. Thoughtfully presented to convey every nuance of care.',
    fullDesc:
      'No need to choose just one — the "Tam Y" Gift Box gathers all four signature aromas (Pomelo Blossom, Jasmine, Chloranthus, Young Green Rice) with traditional peanut brittle and rustic wooden tea accessories. Thoughtfully presented to convey every nuance of care.',
    storyTitle: '"Tâm Ý" Gift Box — Holding Every Shade of Affection',
    storyParagraphs: [
      'Four harmonious bouquets: crisp Pomelo Blossom, velvety Jasmine, earthy Chloranthus, and nutty Young Green Rice blended over fine Tan Cuong green tea.',
      'A complete gifting solution for major holidays, Vietnamese Teachers’ Day, family visits, or formal appreciation gifts.',
    ],
    storyQuote:
      '"When every sentiment deserves honor, this multi-flavor gift collection brings a complete tea ceremony experience paired with an engraved wooden spoon and bespoke message cards."',
    scentNotes: ['Four aromas: Pomelo Blossom, Jasmine, Wild Chloranthus & Young Green Rice'],
    tasteNotes: 'Experience the full quartet of Vietnam’s cherished heritage flower-scented teas.',
    ingredients: [
      'Four 50g tea boxes (An - Thuong - Cam - Nho)',
      'Green-tea peanut brittle, woven burlap bag & wooden spoon',
      'Set of 4 keepsake message cards with tea-story QR codes',
    ],
    brewingTemp: '80°C - 85°C',
    brewingTime: '3 - 4 mins',
    brewingAmount: '5g tea / 150ml water',
    perfectGiftFor: ['Major holidays, Family gatherings, Formal & Executive Gifting'],
    includedFlavors: [
      {
        id: 'buoi-an',
        title: 'Peace & Gratitude',
        subtitle: 'Pomelo Blossom Tea',
        emotion: 'AN',
        image: '/assets/optimized/discovery-botanical-AN.webp',
      },
      {
        id: 'nhai-thuong',
        title: 'Tender Love & Care',
        subtitle: 'Jasmine Blossom Tea',
        emotion: 'THUONG',
        image: '/assets/optimized/discovery-botanical-THUONG.webp',
      },
      {
        id: 'soi-cam',
        title: 'Gratitude & Remembrance',
        subtitle: 'Wild Chloranthus Tea',
        emotion: 'CAM',
        image: '/assets/optimized/discovery-botanical-CAM.webp',
      },
      {
        id: 'com-nho',
        title: 'Nostalgia & Gentle Calm',
        subtitle: 'Young Green Rice Tea',
        emotion: 'NHO',
        image: '/assets/optimized/discovery-botanical-NHO.webp',
      },
    ],
    listingCopy: 'Complete 4-tea tasting set with artisan wooden scoop and keepsake cards',
    cardCopy: {
      title: 'Signature Combo "Tâm Ý"',
      subtitle: 'All 4 Signature Tea Blends',
      description: 'All 4 tea aromas, wooden scoop & gift cards',
      note: 'Custom assortment mix available on request',
    },
    figmaCopy: {
      title: 'Multi-Flavor Gift Box — "TÂM Ý"',
      summary:
        'A complete gifting solution for anniversaries, Teachers’ Day, or meeting the family — one box uniting all four signature teas and handcrafted keepsakes.',
      storyTitle: '"Tâm Ý" Gift Box — Holding Every Shade of Affection',
      quote:
        '"When every sentiment deserves honor, this multi-flavor gift collection delivers a complete tea ritual with wooden keepsake scoop and handwritten cards."',
      scent: 'Four aromas: Pomelo Blossom, Jasmine, Chloranthus & Green Rice',
      giftFor: 'Festive occasions, Family introductions, Formal gifting',
    },
    galleryAlts: [
      'Multi-Flavor Gift Box — TAM Y with tea ware and gift tote',
      'TAM Y Gift Box alongside four boxes of An, Thuong, Cam, Nho',
      'TAM Y Gift Collection arranged on warm timber table',
    ],
    searchKeywords: 'tam y combo gift box quartet four teas special MNH-TY',
  },
};

export function getLocalizedProduct(product: Product, locale: SupportedLocale): Product {
  if (locale === 'vi') return product;
  const en = PRODUCT_EN_CONTENT[product.id];
  if (!en) return product;
  return {
    ...product,
    name: en.name,
    shortName: en.shortName,
    emotionLabel: en.emotionLabel,
    tagline: en.tagline,
    weight: en.weight,
    packaging: en.packaging,
    badge: en.badge,
    shortDesc: en.shortDesc,
    fullDesc: en.fullDesc,
    storyTitle: en.storyTitle,
    storyParagraphs: en.storyParagraphs,
    storyQuote: en.storyQuote,
    scentNotes: en.scentNotes,
    tasteNotes: en.tasteNotes,
    ingredients: en.ingredients,
    brewingTemp: en.brewingTemp,
    brewingTime: en.brewingTime,
    brewingAmount: en.brewingAmount,
    perfectGiftFor: en.perfectGiftFor,
    includedFlavors: en.includedFlavors ?? product.includedFlavors,
  };
}

export function getLocalizedProductNameById(
  productId: string | undefined,
  fallbackName: string,
  locale: SupportedLocale
): string {
  if (locale === 'vi' || !productId) return fallbackName;
  const direct = PRODUCT_EN_CONTENT[productId];
  if (direct) return direct.name;
  const baseId =
    productId === 'combo-tam-y-le' || productId === 'tam-y-le'
      ? 'hop-qua-tam-y'
      : productId.replace(/-le$/, '');
  return PRODUCT_EN_CONTENT[baseId]?.name || fallbackName;
}

export function getLocalizedCardCopy(
  productId: string,
  locale: SupportedLocale
): { title: string; subtitle: string; description: string; note?: string } | undefined {
  if (locale === 'en') {
    return PRODUCT_EN_CONTENT[productId]?.cardCopy || FIGMA_CARD_COPY[productId];
  }
  return FIGMA_CARD_COPY[productId];
}

export function getLocalizedListingCopy(productId: string, locale: SupportedLocale): string {
  if (locale === 'en') {
    return PRODUCT_EN_CONTENT[productId]?.listingCopy || FIGMA_LISTING_COPY[productId] || '';
  }
  return FIGMA_LISTING_COPY[productId] || '';
}

export function getLocalizedFigmaProductCopy(productId: string, locale: SupportedLocale) {
  const base = FIGMA_PRODUCT_COPY[productId] || FIGMA_PRODUCT_COPY['buoi-an'];
  if (locale === 'en') {
    const en = PRODUCT_EN_CONTENT[productId]?.figmaCopy;
    if (en) {
      return { ...base, ...en };
    }
  }
  return base;
}

export function getLocalizedDetailGallery(
  productId: string,
  locale: SupportedLocale
): FigmaGalleryItem[] {
  const base = FIGMA_DETAIL_GALLERY[productId] || FIGMA_DETAIL_GALLERY['buoi-an'];
  if (locale === 'vi') return base;
  const alts = PRODUCT_EN_CONTENT[productId]?.galleryAlts;
  if (!alts) return base;
  return base.map((item, idx) => ({
    ...item,
    alt: alts[idx] || item.alt,
  }));
}

const EMOTION_CARDS_EN_MAP: Record<TeaEmotion, Partial<EmotionCardItem>> = {
  AN: {
    cardTitle: 'Peace & Gratitude',
    teaName: 'Pomelo Blossom Tea',
    shortPill: 'An',
    suggestPill: 'Suggested: Pomelo Blossom (An)',
    heading: 'Pomelo Blossom Tea — Sending Wishes of Serenity',
    quote: PRODUCT_EN_CONTENT['buoi-an'].storyQuote,
    scentProfile: PRODUCT_EN_CONTENT['buoi-an'].scentNotes[0],
    occasion: PRODUCT_EN_CONTENT['buoi-an'].perfectGiftFor[0],
  },
  THUONG: {
    cardTitle: 'Tender Love & Care',
    teaName: 'Jasmine Blossom Tea',
    shortPill: 'Thương',
    suggestPill: 'Suggested: Jasmine (Thương)',
    heading: 'Jasmine Blossom Tea — Tender Words of Affection',
    quote: PRODUCT_EN_CONTENT['nhai-thuong'].storyQuote,
    scentProfile: PRODUCT_EN_CONTENT['nhai-thuong'].scentNotes[0],
    occasion: PRODUCT_EN_CONTENT['nhai-thuong'].perfectGiftFor[0],
  },
  CAM: {
    cardTitle: 'Gratitude & Remembrance',
    teaName: 'Wild Chloranthus Tea',
    shortPill: 'Cảm',
    suggestPill: 'Suggested: Chloranthus (Cảm)',
    heading: 'Wild Chloranthus Tea — Quiet Heart of Gratitude',
    quote: PRODUCT_EN_CONTENT['soi-cam'].storyQuote,
    scentProfile: PRODUCT_EN_CONTENT['soi-cam'].scentNotes[0],
    occasion: PRODUCT_EN_CONTENT['soi-cam'].perfectGiftFor[0],
  },
  NHO: {
    cardTitle: 'Nostalgia & Gentle Calm',
    teaName: 'Young Green Rice Tea',
    shortPill: 'Nhớ',
    suggestPill: 'Suggested: Green Rice (Nhớ)',
    heading: 'Young Green Rice Tea — Whisper of Cherished Days',
    quote: PRODUCT_EN_CONTENT['com-nho'].storyQuote,
    scentProfile: PRODUCT_EN_CONTENT['com-nho'].scentNotes[0],
    occasion: PRODUCT_EN_CONTENT['com-nho'].perfectGiftFor[0],
  },
};

export function getLocalizedEmotionCards(locale: SupportedLocale): EmotionCardItem[] {
  if (locale === 'vi') return EMOTION_CARDS;
  return EMOTION_CARDS.map((card) => ({
    ...card,
    ...(EMOTION_CARDS_EN_MAP[card.key] || {}),
  }));
}

export function getLocalizedEmotionName(emotion: TeaEmotion, locale: SupportedLocale): string {
  if (locale === 'en') {
    return {
      AN: 'AN (Serenity)',
      THUONG: 'THƯƠNG (Affection)',
      CAM: 'CẢM (Gratitude)',
      NHO: 'NHỚ (Nostalgia)',
    }[emotion];
  }
  return { AN: 'AN', THUONG: 'THƯƠNG', CAM: 'CẢM', NHO: 'NHỚ' }[emotion];
}

export function getLocalizedIntentions(locale: SupportedLocale) {
  if (locale === 'vi') return INTENTIONS;
  const enMap = {
    thanks: {
      label: 'A Thank-You Note',
      sentence: 'Thank you for always being there, listening quietly and walking beside me.',
    },
    love: {
      label: 'Words of Affection',
      sentence: 'Sending a touch of tenderness for all our cherished days together.',
    },
    peace: {
      label: 'A Wish of Peace',
      sentence: 'May every single day bring a pocket of calm and gentle stillness to you.',
    },
    memory: {
      label: 'Warm Nostalgia',
      sentence: 'Even when distance settles between us, familiar fragrance keeps memories close.',
    },
  } as const;
  return INTENTIONS.map((item) => ({
    ...item,
    label: enMap[item.id].label,
    sentence: enMap[item.id].sentence,
  }));
}

export function getLocalizedReviews(locale: SupportedLocale): ReviewItem[] {
  if (locale === 'vi') return REVIEWS;
  return [
    {
      ...REVIEWS[0],
      date: '3 hours ago',
      productName: 'Pomelo Blossom Tea – AN',
      title: 'Verified Purchase',
      comment:
        'The gift box feels refined and thoughtful. The moment you lift the lid, a natural blossom aroma greets you effortlessly. Purchased for my parents and everyone loved it!',
    },
    {
      ...REVIEWS[1],
      date: '3 hours ago',
      productName: 'Multi-Flavor Gift Box — "TÂM Ý"',
      title: 'Verified Purchase',
      comment:
        'Packaged with genuine care, complete with burlap tote, wooden spoon, and crunchy peanut brittle that pairs wonderfully with tea. Scanning the QR audio story at night feels so relaxing.',
    },
  ];
}

export function getProductSearchFields(product: Product): {
  viTitle: string;
  viDesc: string;
  enTitle: string;
  enDesc: string;
} {
  const en = PRODUCT_EN_CONTENT[product.id];
  return {
    viTitle: [product.name, product.shortName, product.emotionLabel, product.sku, product.id].join(' '),
    viDesc: product.shortDesc,
    enTitle: [
      en?.name || product.name,
      en?.shortName || product.shortName,
      en?.emotionLabel || product.emotionLabel,
      en?.searchKeywords || '',
      product.sku,
      product.id,
    ].join(' '),
    enDesc: en?.shortDesc || product.shortDesc,
  };
}

export function getProductSearchCorpus(product: Product): string {
  const fields = getProductSearchFields(product);
  return `${fields.viTitle} ${fields.viDesc} ${fields.enTitle} ${fields.enDesc}`;
}

export function getCartProductTitle(product: Product, locale: SupportedLocale): string {
  if (locale === 'en') {
    if (product.id === 'hop-qua-tam-y') return '"Tâm Ý" Gift Box';
    return PRODUCT_EN_CONTENT[product.id]?.name || product.name;
  }
  return product.id === 'hop-qua-tam-y'
    ? 'Hộp Quà Tâm Ý'
    : FIGMA_PRODUCT_COPY[product.id]?.title || product.name;
}

export function getCartProductSubtitle(product: Product, locale: SupportedLocale): string {
  if (locale === 'en') {
    if (product.emotion === 'COMBO') return 'AN · THƯƠNG · CẢM · NHỚ';
    return {
      AN: 'Pomelo Blossom Tea',
      THUONG: 'Jasmine Blossom Tea',
      CAM: 'Wild Chloranthus Tea',
      NHO: 'Young Green Rice Tea',
      ALL: 'All Tea Aromas',
    }[product.emotion];
  }
  if (product.emotion === 'COMBO') return 'AN · THƯƠNG · CẢM · NHỚ';
  return {
    AN: 'Trà Hương Hoa Bưởi',
    THUONG: 'Trà Hương Hoa Nhài',
    CAM: 'Trà Hương Hoa Sói',
    NHO: 'Trà Hương Cốm',
    ALL: 'Các hương trà',
  }[product.emotion];
}

export function resolveLocalizedSkuFallbackText(locale: SupportedLocale): string {
  return locale === 'en' ? 'Legacy pre-SKU order' : 'Chưa gắn SKU (đơn cũ)';
}

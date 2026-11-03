// src/assistant/intentClassifier.ts
// Mộc Ngôn Hương — Natural Language Intent & Entity Extraction

import {
  AssistantIntent,
  ExtractedEntities,
  RecipientCategory,
  OccasionCategory,
  FlavorProfileCategory,
} from './types';
import {
  removeVietnameseDiacritics,
  tokenizeWords,
  containsPhrase,
  fuzzyContains,
} from './vietnameseUtils';
import {
  RECIPIENT_SYNONYMS,
  OCCASION_SYNONYMS,
  FLAVOR_SYNONYMS,
  INTENT_KEYWORDS,
} from './synonyms';

/**
 * Extract budget constraints from Vietnamese natural text.
 * Handles: '300k', '300 nghìn', '300.000đ', 'dưới 300k', 'khoảng 350 nghìn', 'tầm 400k', 'từ 200k đến 400k'
 */
export function extractBudget(normalizedQuery: string): { budgetMax?: number; budgetMin?: number } {
  const norm = removeVietnameseDiacritics(normalizedQuery);

  // Pattern 1: Range "tu X den Y" or "X - Y"
  const rangeMatch = norm.match(/(?:tu\s+)?(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|tr|trieu)?\s*(?:den|-|toi)\s*(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|tr|trieu)?/i);
  if (rangeMatch) {
    const rawVal1 = parseFloat(rangeMatch[1].replace(',', '.'));
    const unit1 = (rangeMatch[2] || rangeMatch[4] || 'k').toLowerCase();
    const rawVal2 = parseFloat(rangeMatch[3].replace(',', '.'));
    const unit2 = (rangeMatch[4] || rangeMatch[2] || 'k').toLowerCase();

    const mult1 = unit1.startsWith('tr') ? 1000000 : 1000;
    const mult2 = unit2.startsWith('tr') ? 1000000 : 1000;

    const val1 = rawVal1 < 100 ? rawVal1 * mult1 : rawVal1;
    const val2 = rawVal2 < 100 ? rawVal2 * mult2 : rawVal2;

    return {
      budgetMin: Math.min(val1, val2),
      budgetMax: Math.max(val1, val2),
    };
  }

  // Pattern 2: Single budget with prefix or suffix
  const singleMatch = norm.match(/(duoi|tam|khoang|toi da|tam khoang|duoi khoang|khoang tam|<|hon|tren)?\s*(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(k|nghin|ngan|ng|dong|vnd|d|tr|trieu)?/i);

  if (singleMatch && singleMatch[2]) {
    const modifier = (singleMatch[1] || '').trim().toLowerCase();
    const rawDigits = singleMatch[2].replace(/[.,]/g, '');
    const unit = (singleMatch[3] || '').trim().toLowerCase();
    let num = parseInt(rawDigits, 10);

    if (unit.startsWith('k') || unit.startsWith('nghin') || unit.startsWith('ngan') || unit === 'ng') {
      num = num * 1000;
    } else if (unit.startsWith('tr') || unit.startsWith('trieu')) {
      num = num * 1000000;
    } else if (num < 1000 && (norm.includes('k') || norm.includes('nghin') || norm.includes('ngan') || norm.includes('tram'))) {
      num = num * 1000;
    }

    if (num > 20000 && num < 10000000) {
      if (modifier.includes('tren') || modifier.includes('hon')) {
        return { budgetMin: num };
      }
      if (modifier.includes('duoi') || modifier.includes('toi da') || modifier === '<') {
        return { budgetMax: num };
      }
      if (modifier.includes('tam') || modifier.includes('khoang')) {
        return { budgetMax: Math.round(num * 1.15), budgetMin: Math.round(num * 0.85) };
      }
      return { budgetMax: num };
    }
  }

  return {};
}

/**
 * Extract recipient from query
 */
export function extractRecipient(queryNormalized: string): { recipient?: RecipientCategory; raw?: string } {
  const norm = removeVietnameseDiacritics(queryNormalized);

  // If the query is just a greeting like "hello ban", "chao ban", don't extract friend
  const isGreetingQuery = containsPhrase(norm, 'chao ban') || containsPhrase(norm, 'hello ban') || containsPhrase(norm, 'hi ban');
  if (isGreetingQuery && !norm.includes('tang') && !norm.includes('bieu') && !norm.includes('mua')) {
    return {};
  }

  const priorityRecipients: RecipientCategory[] = [
    'parents',
    'grandparents',
    'teacher',
    'business',
    'mother',
    'father',
    'partner',
    'friend',
    'self',
    'general',
  ];

  for (const cat of priorityRecipients) {
    const synonyms = RECIPIENT_SYNONYMS[cat];
    for (const syn of synonyms) {
      if (containsPhrase(norm, syn) || fuzzyContains(norm, syn, 0.88)) {
        return { recipient: cat, raw: syn };
      }
    }
  }

  return {};
}

/**
 * Extract gift occasion from query
 */
export function extractOccasion(queryNormalized: string): { occasion?: OccasionCategory; raw?: string } {
  const norm = removeVietnameseDiacritics(queryNormalized);
  const priorityOccasions: OccasionCategory[] = [
    'tet',
    'teachers_day',
    'women_day',
    'vu_lan',
    'birthday',
    'gratitude',
    'corporate',
    'family_visit',
  ];

  for (const occ of priorityOccasions) {
    const synonyms = OCCASION_SYNONYMS[occ];
    for (const syn of synonyms) {
      if (containsPhrase(norm, syn) || fuzzyContains(norm, syn, 0.88)) {
        return { occasion: occ, raw: syn };
      }
    }
  }

  return {};
}

/**
 * Extract flavor preference with weighted multi-feature scoring
 */
export function extractFlavorPreference(queryNormalized: string): { flavorPreference?: FlavorProfileCategory; raw?: string } {
  const norm = removeVietnameseDiacritics(queryNormalized);
  const categories: FlavorProfileCategory[] = ['gentle', 'sweet', 'warm', 'nutty', 'rich', 'floral'];

  let bestCat: FlavorProfileCategory | undefined;
  let bestScore = 0;
  let bestRaw = '';

  for (const cat of categories) {
    const synonyms = FLAVOR_SYNONYMS[cat];
    let score = 0;
    let matchedSyn = '';

    for (const syn of synonyms) {
      if (containsPhrase(norm, syn)) {
        const weight = syn.includes(' ') ? 3 : (syn === 'nhai' || syn === 'soi' || syn === 'com' || syn === 'dam da' ? 2 : 1);
        score += weight;
        matchedSyn = syn;
      } else if (fuzzyContains(norm, syn, 0.88)) {
        score += 1;
        matchedSyn = syn;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
      bestRaw = matchedSyn;
    }
  }

  return bestCat ? { flavorPreference: bestCat, raw: bestRaw } : {};
}

/**
 * Extract product mentions from query.
 * Must avoid false positives (e.g. 'cam on' should NOT match 'soi-cam'; 'ban' should NOT match 'buoi-an').
 */
export function extractProductMentions(queryNormalized: string): string[] {
  const norm = removeVietnameseDiacritics(queryNormalized);
  const found: string[] = [];

  // 1. Combo Hộp quà Tâm Ý
  if (
    containsPhrase(norm, 'tam y') ||
    containsPhrase(norm, 'hop qua tam y') ||
    containsPhrase(norm, 'set qua') ||
    containsPhrase(norm, 'hop qua') ||
    containsPhrase(norm, 'combo') ||
    containsPhrase(norm, 'bo qua')
  ) {
    found.push('hop-qua-tam-y');
  }

  // 2. Trà Bưởi - AN
  if (
    containsPhrase(norm, 'tra buoi') ||
    containsPhrase(norm, 'hoa buoi') ||
    containsPhrase(norm, 'huong buoi') ||
    containsPhrase(norm, 'tra an') ||
    fuzzyContains(norm, 'tra buoi', 0.85) ||
    (containsPhrase(norm, 'an') && (norm.includes('binh an') || norm.includes('tra')))
  ) {
    found.push('buoi-an');
  }

  // 3. Trà Nhài - THƯƠNG
  if (
    containsPhrase(norm, 'tra nhai') ||
    containsPhrase(norm, 'hoa nhai') ||
    containsPhrase(norm, 'huong nhai') ||
    containsPhrase(norm, 'tra thuong') ||
    fuzzyContains(norm, 'tra nhai', 0.85) ||
    (containsPhrase(norm, 'thuong') && (norm.includes('yeu thuong') || norm.includes('tra')))
  ) {
    found.push('nhai-thuong');
  }

  // 4. Trà Sói - CẢM
  const isJustCamOn = containsPhrase(norm, 'cam on') && !containsPhrase(norm, 'hoa soi') && !containsPhrase(norm, 'tra soi') && !containsPhrase(norm, 'tra cam');
  if (!isJustCamOn) {
    if (
      containsPhrase(norm, 'tra soi') ||
      containsPhrase(norm, 'hoa soi') ||
      containsPhrase(norm, 'soi cam') ||
      containsPhrase(norm, 'tra cam') ||
      containsPhrase(norm, 'cam thong') ||
      fuzzyContains(norm, 'tra soi', 0.85)
    ) {
      found.push('soi-cam');
    }
  }

  // 5. Trà Cốm - NHỚ
  if (
    containsPhrase(norm, 'tra com') ||
    containsPhrase(norm, 'huong com') ||
    containsPhrase(norm, 'tra nho') ||
    containsPhrase(norm, 'nep non') ||
    fuzzyContains(norm, 'tra com', 0.85) ||
    (containsPhrase(norm, 'nho') && (norm.includes('thuong nho') || norm.includes('noi nho') || norm.includes('tra')))
  ) {
    found.push('com-nho');
  }

  return Array.from(new Set(found));
}

export function isCheaperAlternativeRequest(queryNormalized: string): boolean {
  const norm = removeVietnameseDiacritics(queryNormalized);
  for (const kw of INTENT_KEYWORDS.cheaper) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return true;
    }
  }
  return false;
}

export function isCardWritingRequest(queryNormalized: string): boolean {
  const norm = removeVietnameseDiacritics(queryNormalized);
  for (const kw of INTENT_KEYWORDS.cardWriting) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.88)) {
      return true;
    }
  }
  return false;
}

/**
 * Classify main intent and extract entities with high-accuracy semantic routing
 */
export function classifyIntent(query: string): {
  intent: AssistantIntent;
  confidence: number;
  entities: ExtractedEntities;
} {
  const norm = removeVietnameseDiacritics(query);
  const budget = extractBudget(norm);
  const recipientRes = extractRecipient(norm);
  const occasionRes = extractOccasion(norm);
  const flavorRes = extractFlavorPreference(norm);
  const products = extractProductMentions(norm);
  const isCheaper = isCheaperAlternativeRequest(norm);
  const isCard = isCardWritingRequest(norm);

  const entities: ExtractedEntities = {
    recipient: recipientRes.recipient,
    recipientRaw: recipientRes.raw,
    occasion: occasionRes.occasion,
    occasionRaw: occasionRes.raw,
    budgetMax: budget.budgetMax,
    budgetMin: budget.budgetMin,
    flavorPreference: flavorRes.flavorPreference,
    flavorRaw: flavorRes.raw,
    productIdsMentioned: products,
    isCheaperRequest: isCheaper,
    isWritingCardRequest: isCard,
  };

  // 1. Reset / Clear Context intent
  for (const kw of INTENT_KEYWORDS.reset) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.9)) {
      return { intent: 'CLEAR_CONTEXT', confidence: 0.98, entities };
    }
  }

  // 2. Greeting (check early if query is a clear greeting, e.g. "xin chao", "chao shop", "hello ban")
  const isExplicitGreeting =
    containsPhrase(norm, 'xin chao') ||
    containsPhrase(norm, 'chao shop') ||
    containsPhrase(norm, 'chao ban') ||
    containsPhrase(norm, 'hello ban') ||
    containsPhrase(norm, 'hello shop') ||
    containsPhrase(norm, 'hi shop') ||
    norm === 'chao' ||
    norm === 'hello' ||
    norm === 'hi';
  if (isExplicitGreeting && !norm.includes('gia') && !norm.includes('tang') && !norm.includes('ship')) {
    return { intent: 'GREETING', confidence: 0.96, entities };
  }

  // 3. Gift Card Writing
  if (isCard) {
    return { intent: 'GIFT_CARD_WRITING', confidence: 0.95, entities };
  }

  // 4. Cheaper Alternative
  if (isCheaper) {
    return { intent: 'CHEAPER_ALTERNATIVE', confidence: 0.94, entities };
  }

  // 5. Brewing Guide ("cach pha", "nhiet do", "u tra", "ham tra")
  for (const kw of INTENT_KEYWORDS.brewing) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'BREWING_GUIDE', confidence: 0.93, entities };
    }
  }

  // 6. Discount & Promotion Inquiry ("giam gia", "khuyen mai", "chiet khau", "uu dai")
  for (const kw of INTENT_KEYWORDS.discount) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'DISCOUNT_INQUIRY', confidence: 0.92, entities };
    }
  }

  // 7. Shipping Policy ("ship", "phi ship", "giao hang")
  for (const kw of INTENT_KEYWORDS.shipping) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'SHIPPING_POLICY', confidence: 0.91, entities };
    }
  }

  // 8. Payment Policy ("thanh toan", "chuyen khoan", "cod", "kiem tra hang")
  for (const kw of INTENT_KEYWORDS.payment) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.9)) {
      return { intent: 'PAYMENT_POLICY', confidence: 0.91, entities };
    }
  }

  // 9. Price Inquiry ("gia", "bao nhieu", "bao nhieu tien", "nhiu tien")
  for (const kw of INTENT_KEYWORDS.price) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.88)) {
      return { intent: 'PRICE_INQUIRY', confidence: 0.95, entities };
    }
  }

  // 10. Corporate Gifting ("doanh nghiep", "so luong lon", "in logo")
  for (const kw of INTENT_KEYWORDS.corporate) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'CORPORATE_GIFTING', confidence: 0.92, entities };
    }
  }

  // 11. Return Policy (Use strict matching to avoid 'tra tang' collision)
  for (const kw of INTENT_KEYWORDS.returnPolicy) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.92)) {
      return { intent: 'RETURN_POLICY', confidence: 0.91, entities };
    }
  }

  // 12. Origin & Story
  for (const kw of INTENT_KEYWORDS.story) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'ORIGIN_STORY', confidence: 0.90, entities };
    }
  }

  // 13. Store Contact & Address
  for (const kw of INTENT_KEYWORDS.contact) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'STORE_CONTACT', confidence: 0.90, entities };
    }
  }

  // 14. Budget Filter
  if (budget.budgetMax !== undefined || budget.budgetMin !== undefined) {
    return { intent: 'BUDGET_FILTER', confidence: 0.92, entities };
  }

  // 15. Recommend / Gift inquiry with recipient or occasion or flavor
  if (entities.recipient || entities.occasion || entities.flavorPreference) {
    return { intent: 'RECOMMEND_PRODUCT', confidence: 0.92, entities };
  }

  // 16. General recommendation keywords (e.g. "mua qua", "can tim", "mon qua")
  for (const kw of INTENT_KEYWORDS.recommend) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.85)) {
      return { intent: 'RECOMMEND_PRODUCT', confidence: 0.88, entities };
    }
  }

  // 17. Product Inquiry (Direct mention of product)
  if (products.length > 0) {
    return { intent: 'PRODUCT_INQUIRY', confidence: 0.88, entities };
  }

  // 18. General Greeting fallback
  for (const kw of INTENT_KEYWORDS.greeting) {
    if (containsPhrase(norm, kw) || fuzzyContains(norm, kw, 0.9)) {
      return { intent: 'GREETING', confidence: 0.88, entities };
    }
  }

  // 19. Fallback
  return { intent: 'FALLBACK_CLARIFY', confidence: 0.35, entities };
}

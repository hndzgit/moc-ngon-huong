// src/assistant/types.ts
// Mộc Ngôn Hương — Local Intelligent Assistant Type Definitions

import { Product, TeaEmotion } from '../types';

export type AssistantIntent =
  | 'GREETING'
  | 'PRODUCT_INQUIRY'
  | 'RECOMMEND_PRODUCT'
  | 'PRICE_INQUIRY'
  | 'BUDGET_FILTER'
  | 'CHEAPER_ALTERNATIVE'
  | 'GIFT_CARD_WRITING'
  | 'BREWING_GUIDE'
  | 'SHIPPING_POLICY'
  | 'PAYMENT_POLICY'
  | 'RETURN_POLICY'
  | 'CORPORATE_GIFTING'
  | 'DISCOUNT_INQUIRY'
  | 'ORIGIN_STORY'
  | 'STORE_CONTACT'
  | 'CLEAR_CONTEXT'
  | 'FALLBACK_CLARIFY';

export type RecipientCategory =
  | 'mother'
  | 'father'
  | 'parents'
  | 'grandparents'
  | 'teacher'
  | 'partner'
  | 'friend'
  | 'business'
  | 'self'
  | 'general';

export type OccasionCategory =
  | 'tet'
  | 'teachers_day'
  | 'women_day'
  | 'birthday'
  | 'vu_lan'
  | 'gratitude'
  | 'corporate'
  | 'family_visit'
  | 'general';

export type FlavorProfileCategory =
  | 'gentle'
  | 'sweet'
  | 'warm'
  | 'rich'
  | 'nutty'
  | 'floral';

export interface ExtractedEntities {
  recipient?: RecipientCategory;
  recipientRaw?: string;
  occasion?: OccasionCategory;
  occasionRaw?: string;
  budgetMax?: number;
  budgetMin?: number;
  flavorPreference?: FlavorProfileCategory;
  flavorRaw?: string;
  productIdsMentioned: string[];
  isCheaperRequest?: boolean;
  isWritingCardRequest?: boolean;
}

export interface ConversationContext {
  recipient?: RecipientCategory;
  recipientRaw?: string;
  occasion?: OccasionCategory;
  occasionRaw?: string;
  budgetMax?: number;
  budgetMin?: number;
  flavorPreference?: FlavorProfileCategory;
  flavorRaw?: string;
  selectedProductId?: string;
  lastRecommendedProductIds: string[];
  lastIntent?: AssistantIntent;
  cardStyle?: 'warm' | 'formal' | 'short';
  turnCount: number;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface CardSuggestionItem {
  id: string;
  style: 'warm' | 'formal' | 'short';
  styleLabel: string;
  recipient: string;
  text: string;
  charCount: number;
}

export interface AssistantReply {
  text: string;
  products?: Product[];
  productRecommendationReason?: string;
  cardSuggestions?: CardSuggestionItem[];
  suggestedQuickReplies?: string[];
  action?: {
    type: 'NAVIGATE' | 'OPEN_CART' | 'OPEN_GIFT_JOURNEY';
    payload?: any;
  };
}

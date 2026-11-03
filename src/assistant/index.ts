// src/assistant/index.ts
// Mộc Ngôn Hương — Client-Side Intelligent Tea Assistant Master Entry Point

import {
  ConversationContext,
  AssistantReply,
  ExtractedEntities,
} from './types';
import { classifyIntent } from './intentClassifier';
import {
  createInitialContext,
  updateContextWithEntities,
  saveContextToStorage,
  loadContextFromStorage,
  clearContextStorage,
} from './conversationState';
import { composeResponse } from './responseEngine';
import { calculateDemoDiscount } from './discountEngine';

export * from './types';
export * from './vietnameseUtils';
export * from './catalogKnowledge';
export * from './synonyms';
export * from './intentClassifier';
export * from './conversationState';
export * from './recommendationEngine';
export * from './greetingCardEngine';
export * from './discountEngine';
export * from './responseEngine';

export interface ProcessMessageResult {
  reply: AssistantReply;
  nextContext: ConversationContext;
}

/**
 * Main conversational assistant processor.
 * Runs 100% locally in the browser with ZERO external API calls and ZERO per-message server cost.
 */
export function processUserMessage(
  userQuery: string,
  currentContext: ConversationContext,
  cartSummary?: { totalQuantity: number; subtotal: number }
): ProcessMessageResult {
  const trimmed = (userQuery || '').trim();

  // Step 1: Intent & Entity Classification
  const { intent, confidence, entities } = classifyIntent(trimmed);

  // Step 2: Handle clear context / reset
  let activeContext = currentContext;
  if (intent === 'CLEAR_CONTEXT') {
    activeContext = createInitialContext();
    clearContextStorage();
  }

  // Step 3: Update conversation context
  let nextContext = updateContextWithEntities(activeContext, entities, intent);

  // If user asked "Bao nhiêu?" without mentioning a product, use the current active product
  if (intent === 'PRICE_INQUIRY' && !nextContext.selectedProductId) {
    if (nextContext.lastRecommendedProductIds && nextContext.lastRecommendedProductIds.length > 0) {
      nextContext.selectedProductId = nextContext.lastRecommendedProductIds[0];
    } else {
      nextContext.selectedProductId = 'buoi-an';
    }
  }

  // Step 4: Compose grounded response
  const reply = composeResponse(intent, nextContext, cartSummary);

  // If products were recommended in the response, record their IDs in context
  if (reply.products && reply.products.length > 0) {
    nextContext.lastRecommendedProductIds = reply.products.map((p) => p.id);
    nextContext.selectedProductId = reply.products[0].id;
  }

  // Step 5: Always attach illustrative demo discount info
  const cartQty = cartSummary?.totalQuantity || 0;
  const cartSubtotal = cartSummary?.subtotal || 0;
  reply.discountDemoInfo = calculateDemoDiscount(cartQty, cartSubtotal);

  // Step 6: Record in history (capped at last 20 messages for memory efficiency)
  const updatedHistory = [
    ...(nextContext.history || []),
    { role: 'user' as const, text: trimmed },
    { role: 'assistant' as const, text: reply.text },
  ];
  if (updatedHistory.length > 20) {
    updatedHistory.splice(0, updatedHistory.length - 20);
  }
  nextContext.history = updatedHistory;

  // Persist in session storage
  saveContextToStorage(nextContext);

  return {
    reply,
    nextContext,
  };
}

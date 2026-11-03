// src/assistant/conversationState.ts
// Mộc Ngôn Hương — Multi-turn Conversation State Machine

import {
  ConversationContext,
  ExtractedEntities,
  AssistantIntent,
} from './types';

export function createInitialContext(): ConversationContext {
  return {
    turnCount: 0,
    lastRecommendedProductIds: [],
    history: [],
  };
}

/**
 * Merge new entities extracted from user query into the active session context.
 * Does not discard existing context unless explicitly overridden.
 */
export function updateContextWithEntities(
  prevContext: ConversationContext,
  entities: ExtractedEntities,
  currentIntent: AssistantIntent
): ConversationContext {
  const next: ConversationContext = {
    ...prevContext,
    turnCount: prevContext.turnCount + 1,
    lastIntent: currentIntent,
  };

  if (entities.recipient) {
    next.recipient = entities.recipient;
    next.recipientRaw = entities.recipientRaw || prevContext.recipientRaw;
  }

  if (entities.occasion) {
    next.occasion = entities.occasion;
    next.occasionRaw = entities.occasionRaw || prevContext.occasionRaw;
  }

  if (entities.flavorPreference) {
    next.flavorPreference = entities.flavorPreference;
    next.flavorRaw = entities.flavorRaw || prevContext.flavorRaw;
  }

  if (entities.budgetMax !== undefined) {
    next.budgetMax = entities.budgetMax;
  }

  if (entities.budgetMin !== undefined) {
    next.budgetMin = entities.budgetMin;
  }

  if (entities.productIdsMentioned && entities.productIdsMentioned.length > 0) {
    next.selectedProductId = entities.productIdsMentioned[0];
  }

  return next;
}

/**
 * Session storage key for persisting assistant conversation within the current browser tab.
 */
const SESSION_STORAGE_KEY = 'mnh_assistant_session_context';

export function loadContextFromStorage(): ConversationContext {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return createInitialContext();
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.turnCount === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse assistant session context:', err);
  }
  return createInitialContext();
}

export function saveContextToStorage(context: ConversationContext): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(context));
  } catch (err) {
    console.warn('Failed to persist assistant context:', err);
  }
}

export function clearContextStorage(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear assistant context:', err);
  }
}

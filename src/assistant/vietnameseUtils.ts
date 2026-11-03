// src/assistant/vietnameseUtils.ts
// Mộc Ngôn Hương — Vietnamese Natural Language Processing Utilities

export function normalizeUnicode(str: string): string {
  if (!str) return '';
  return str.normalize('NFC').trim();
}

/**
 * Clean common Vietnamese telex typing duplicates (e.g. 'buoii' -> 'buoi', 'diuu' -> 'diu', 'vienn' -> 'vien').
 */
export function cleanTelexTypo(text: string): string {
  if (!text) return '';
  return text
    .split(/\s+/)
    .map((word) => word.replace(/([aeiouydntrshk])\1+$/i, '$1'))
    .join(' ');
}

/**
 * Remove Vietnamese accents/diacritics while preserving spaces and letters.
 * Converts 'Trà Hương Bưởi – AN' -> 'tra huong buoi - an'
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  const cleaned = cleanTelexTypo(str);
  return cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

/**
 * Tokenize a text string into normalized lowercase words.
 */
export function tokenizeWords(str: string): string[] {
  if (!str) return [];
  const normalized = removeVietnameseDiacritics(str);
  // Match contiguous alphanumeric sequences
  const matches = normalized.match(/[a-z0-9_]+/g);
  return matches || [];
}

/**
 * Strict whole-word or phrase boundary check.
 * NEVER matches substrings inside unrelated words (e.g. 'an' inside 'ban' or 'hoan').
 */
export function containsPhrase(normalizedText: string, phrase: string): boolean {
  if (!normalizedText || !phrase) return false;
  const p = removeVietnameseDiacritics(phrase);
  // Escape regex special characters in phrase
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s|[.,!?;:()\\-"'/\\[\\]])${escaped}($|\\s|[.,!?;:()\\-"'/\\[\\]])`, 'i');
  return regex.test(` ${normalizedText} `);
}

/**
 * Calculate Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1 || '';
  const b = s2 || '';
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate normalized similarity between 0 and 1.
 */
export function stringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Checks if a target phrase closely matches any sliding window of tokens in the query.
 * Useful for catching common typos like 'tra buoi' -> 'tra buoi', 'thay co' -> 'thay co', 'tam y' -> 'tam y'.
 */
export function fuzzyContains(queryNormalized: string, targetPhrase: string, minSimilarity = 0.82): boolean {
  const normQuery = removeVietnameseDiacritics(queryNormalized);
  const normTarget = removeVietnameseDiacritics(targetPhrase);

  if (containsPhrase(normQuery, normTarget)) return true;

  const targetTokens = tokenizeWords(normTarget);
  const queryTokens = tokenizeWords(normQuery);

  if (targetTokens.length === 0 || queryTokens.length === 0) return false;

  const windowSize = targetTokens.length;
  if (queryTokens.length < windowSize) {
    const joinedQuery = queryTokens.join(' ');
    return stringSimilarity(joinedQuery, normTarget) >= minSimilarity;
  }

  for (let i = 0; i <= queryTokens.length - windowSize; i++) {
    const windowPhrase = queryTokens.slice(i, i + windowSize).join(' ');
    if (stringSimilarity(windowPhrase, normTarget) >= minSimilarity) {
      return true;
    }
  }

  return false;
}

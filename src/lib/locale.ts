export type SupportedLocale = 'vi' | 'en';

export const DEFAULT_LOCALE: SupportedLocale = 'vi';
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['vi', 'en'] as const;
export const LOCALE_STORAGE_KEY = 'mnh_language_v1';

export function normalizeLocale(input: unknown): SupportedLocale {
  if (typeof input !== 'string') return DEFAULT_LOCALE;
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'en' || trimmed.startsWith('en-') || trimmed.startsWith('en_')) {
    return 'en';
  }
  return 'vi';
}

export function isSupportedLocale(input: unknown): input is SupportedLocale {
  return input === 'vi' || input === 'en';
}

export function detectInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryLang = searchParams.get('lang');
      if (queryLang && (queryLang.trim().toLowerCase() === 'en' || queryLang.trim().toLowerCase() === 'vi')) {
        return normalizeLocale(queryLang);
      }
      const hash = window.location.hash || '';
      const qIdx = hash.indexOf('?');
      if (qIdx >= 0) {
        const hashParams = new URLSearchParams(hash.slice(qIdx + 1));
        const hashLang = hashParams.get('lang');
        if (hashLang && (hashLang.trim().toLowerCase() === 'en' || hashLang.trim().toLowerCase() === 'vi')) {
          return normalizeLocale(hashLang);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }

    try {
      const stored = window.localStorage?.getItem(LOCALE_STORAGE_KEY);
      if (stored === 'vi' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore storage access errors (private browsing, restricted frames)
    }
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage write errors
  }
}

export type ViCurrencyStyle = 'compact-en' | 'spaced-vi' | 'compact-vi' | 'symbol-vi';

/**
 * Formats VND monetary amounts without converting currency.
 * Preserves existing Vietnamese formats for VI regression safety and renders clean "289,000 VND" in EN.
 */
export function formatVnd(
  amount: number | undefined | null,
  locale: SupportedLocale = 'vi',
  viStyle: ViCurrencyStyle = 'spaced-vi'
): string {
  const safe = Math.round(Number(amount) || 0);
  if (locale === 'en') {
    return `${safe.toLocaleString('en-US')} VND`;
  }
  switch (viStyle) {
    case 'compact-en':
      return `${safe.toLocaleString('en-US')}đ`;
    case 'compact-vi':
      return `${safe.toLocaleString('vi-VN')}đ`;
    case 'symbol-vi':
      return `${safe.toLocaleString('vi-VN')} ₫`;
    case 'spaced-vi':
    default:
      return `${safe.toLocaleString('vi-VN')} đ`;
  }
}

export function formatLocaleDateTime(
  isoStr: string | number | Date | undefined | null,
  locale: SupportedLocale = 'vi',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoStr) return '';
  try {
    const date = isoStr instanceof Date ? isoStr : new Date(isoStr);
    if (Number.isNaN(date.getTime())) return String(isoStr);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      ...(options || { dateStyle: 'medium', timeStyle: 'short' }),
    }).format(date);
  } catch {
    return String(isoStr);
  }
}

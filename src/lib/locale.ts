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

export function detectExplicitUrlLocale(
  searchStr?: string,
  hashStr?: string
): SupportedLocale | null {
  try {
    const rawSearch =
      searchStr !== undefined
        ? searchStr
        : typeof window !== 'undefined'
        ? window.location.search
        : '';
    if (rawSearch) {
      const searchParams = new URLSearchParams(rawSearch);
      const queryLang = searchParams.get('lang');
      if (queryLang) {
        const lower = queryLang.trim().toLowerCase();
        if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_') || lower === 'vi' || lower.startsWith('vi-') || lower.startsWith('vi_')) {
          return normalizeLocale(queryLang);
        }
      }
    }
    const rawHash =
      hashStr !== undefined
        ? hashStr
        : typeof window !== 'undefined'
        ? window.location.hash || ''
        : '';
    const qIdx = rawHash.indexOf('?');
    if (qIdx >= 0) {
      const hashParams = new URLSearchParams(rawHash.slice(qIdx + 1));
      const hashLang = hashParams.get('lang');
      if (hashLang) {
        const lower = hashLang.trim().toLowerCase();
        if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_') || lower === 'vi' || lower.startsWith('vi-') || lower.startsWith('vi_')) {
          return normalizeLocale(hashLang);
        }
      }
    }
  } catch {
    // Ignore URL parsing errors
  }
  return null;
}

export function detectInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const explicit = detectExplicitUrlLocale();
    if (explicit) {
      persistLocale(explicit);
      return explicit;
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

export function syncUrlLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    if (locale === 'en') {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.delete('lang');
    }

    // Keep hash path clean and prevent stale ?lang= inside hash from overriding active locale on reload
    if (url.hash && url.hash.includes('?')) {
      const qIdx = url.hash.indexOf('?');
      const hashBase = url.hash.slice(0, qIdx);
      const hashParams = new URLSearchParams(url.hash.slice(qIdx + 1));
      if (hashParams.has('lang')) {
        hashParams.delete('lang');
        const nextHashQuery = hashParams.toString();
        url.hash = nextHashQuery ? `${hashBase}?${nextHashQuery}` : hashBase;
      }
    }

    const nextHref = url.toString();
    if (nextHref !== window.location.href) {
      window.history.replaceState(window.history.state, '', nextHref);
    }
  } catch {
    // Ignore history API restrictions
  }
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

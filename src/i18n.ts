import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { viResources } from './locales/vi';
import { enResources } from './locales/en';
import {
  DEFAULT_LOCALE,
  SupportedLocale,
  detectExplicitUrlLocale,
  detectInitialLocale,
  normalizeLocale,
  persistLocale,
  syncUrlLocale,
} from './lib/locale';
import type { PageRoute } from './types';
import { getLocalizedProductNameById } from './data/localizedCatalog';
import { PRODUCTS } from './data/products';

const initialLanguage: SupportedLocale = detectInitialLocale();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      vi: viResources,
      en: enResources,
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['vi', 'en'],
    defaultNS: 'common',
    ns: [
      'common',
      'navigation',
      'home',
      'story',
      'products',
      'gifting',
      'cartCheckout',
      'authAccount',
      'assistant',
    ],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  const isAdminHash = (window.location.hash || '').startsWith('#/admin');
  if (!isAdminHash && (detectExplicitUrlLocale() !== null || initialLanguage === 'en')) {
    syncUrlLocale(initialLanguage);
  }
}

export function getActiveLocale(): SupportedLocale {
  return normalizeLocale(i18n.language || initialLanguage);
}

export async function changeAppLanguage(nextLang: SupportedLocale): Promise<void> {
  const normalized = normalizeLocale(nextLang);
  persistLocale(normalized);
  if (typeof window !== 'undefined' && !(window.location.hash || '').startsWith('#/admin')) {
    syncUrlLocale(normalized);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }
  await i18n.changeLanguage(normalized);
}

/**
 * Updates `<html lang>`, `<title>`, `<meta name="description">`, `<link rel="canonical">`,
 * and `<link rel="alternate" hreflang="vi|en|x-default">` synchronously for SPA routes & locale switches.
 * Admin routes remain internal/Vietnamese and do not emit bilingual index metadata.
 */
export function updateDocumentSeo(
  locale: SupportedLocale,
  page: PageRoute,
  productId?: string
): void {
  if (typeof document === 'undefined') return;

  // Admin stays internal Vietnamese
  if (page === 'admin') {
    document.documentElement.lang = 'vi';
    document.title = 'Quản Trị Đơn Hàng — Mộc Ngôn Hương';
    return;
  }

  document.documentElement.lang = locale;
  const seo = locale === 'en' ? enResources.common.seo : viResources.common.seo;

  let title: string = seo.defaultTitle;
  let description: string = seo.defaultDescription;

  switch (page) {
    case 'home':
      title = seo.homeTitle;
      description = seo.homeDescription;
      break;
    case 'story':
      title = seo.storyTitle;
      description = seo.storyDescription;
      break;
    case 'products':
      title = seo.productsTitle;
      description = seo.productsDescription;
      break;
    case 'detail': {
      const prod = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];
      const localizedName = getLocalizedProductNameById(prod.id, prod.name, locale);
      title = `${localizedName} | ${seo.detailTitleSuffix}`;
      description = seo.productsDescription;
      break;
    }
    case 'contact':
      title = seo.contactTitle;
      description = seo.contactDescription;
      break;
    case 'gift-journey':
      title = seo.giftJourneyTitle;
      description = seo.giftJourneyDescription;
      break;
    case 'corporate':
      title = seo.corporateTitle;
      description = seo.corporateDescription;
      break;
    case 'checkout':
      title = seo.checkoutTitle;
      description = seo.checkoutDescription;
      break;
    case 'auth':
      title = seo.authTitle;
      description = seo.authDescription;
      break;
    default:
      title = seo.defaultTitle;
      description = seo.defaultDescription;
  }

  document.title = title;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  const baseOrigin = 'https://mocngonhuong.com/';
  const ensureLink = (rel: string, href: string, hreflang?: string) => {
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  ensureLink('canonical', locale === 'en' ? `${baseOrigin}?lang=en` : baseOrigin);
  ensureLink('alternate', baseOrigin, 'vi');
  ensureLink('alternate', `${baseOrigin}?lang=en`, 'en');
  ensureLink('alternate', baseOrigin, 'x-default');
}

export default i18n;

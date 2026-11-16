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
import { getLocalizedProduct, getLocalizedProductNameById } from './data/localizedCatalog';
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

  const baseOrigin = 'https://mocngonhuong.com/';
  const defaultOgImage = `${baseOrigin}assets/optimized/hero-1280.webp`;

  const setMetaTag = (attr: 'name' | 'property', key: string, value: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

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

  // Admin stays internal Vietnamese & non-indexed
  if (page === 'admin') {
    document.documentElement.lang = 'vi';
    document.title = 'Quản Trị Đơn Hàng — Mộc Ngôn Hương';
    setMetaTag('name', 'robots', 'noindex, nofollow');
    ensureLink('canonical', baseOrigin);
    return;
  }

  document.documentElement.lang = locale;
  const seo = locale === 'en' ? enResources.common.seo : viResources.common.seo;

  let title: string = seo.defaultTitle;
  let description: string = seo.defaultDescription;
  let ogImage: string = defaultOgImage;

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
      const localizedProd = getLocalizedProduct(prod, locale);
      const localizedName = getLocalizedProductNameById(prod.id, prod.name, locale);
      title = `${localizedName} | ${seo.detailTitleSuffix}`;
      description = localizedProd.shortDesc || seo.productsDescription;
      if (prod.image) {
        ogImage = prod.image.startsWith('http')
          ? prod.image
          : `${baseOrigin}${prod.image.replace(/^\//, '')}`;
      }
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
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'robots', page === 'not-found' ? 'noindex, follow' : 'index, follow');

  const canonicalUrl = locale === 'en' ? `${baseOrigin}?lang=en` : baseOrigin;
  ensureLink('canonical', canonicalUrl);
  ensureLink('alternate', baseOrigin, 'vi');
  ensureLink('alternate', `${baseOrigin}?lang=en`, 'en');
  ensureLink('alternate', baseOrigin, 'x-default');

  setMetaTag('property', 'og:type', page === 'detail' ? 'product' : 'website');
  setMetaTag('property', 'og:site_name', 'Mộc Ngôn Hương');
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage);
  setMetaTag('property', 'og:locale', locale === 'en' ? 'en_US' : 'vi_VN');
  setMetaTag('property', 'og:locale:alternate', locale === 'en' ? 'vi_VN' : 'en_US');
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);
}

export default i18n;

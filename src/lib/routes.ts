import { PRODUCTS } from '../data/products';
import type { PageRoute } from '../types';

const paths: Partial<Record<PageRoute, string>> = {
  home: '/', story: '/cau-chuyen', products: '/san-pham',
  contact: '/lien-he', checkout: '/thanh-toan', auth: '/tai-khoan',
};

export function routeHash(page: PageRoute, productId = 'buoi-an'): string {
  return `#${page === 'detail' ? `/san-pham/${encodeURIComponent(productId)}` : paths[page] || '/404'}`;
}

/** Hash routes keep refresh/deep links on the static GitHub Pages index. */
export function readRoute(): {page:PageRoute; productId?:string} {
  let path: string;
  try { path = decodeURIComponent(window.location.hash.slice(1) || '/').replace(/\/$/, '') || '/'; }
  catch { return {page:'not-found'}; }
  const page = (Object.entries(paths) as [PageRoute,string][]).find(([,value])=>value === path)?.[0];
  if (page) return {page};
  const match = /^\/san-pham\/([^/]+)$/.exec(path);
  if (match && PRODUCTS.some(product=>product.id === match[1])) return {page:'detail',productId:match[1]};
  return {page:'not-found'};
}

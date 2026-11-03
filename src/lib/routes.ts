import { PRODUCTS } from '../data/products';
import type { PageRoute } from '../types';

const paths: Partial<Record<PageRoute, string>> = {
  home: '/', story: '/cau-chuyen', products: '/san-pham',
  contact: '/lien-he', checkout: '/thanh-toan', auth: '/tai-khoan',
  'gift-journey': '/chon-qua', corporate: '/qua-doanh-nghiep',
  admin: '/admin',
};

export function routeHash(page: PageRoute, productId = 'buoi-an'): string {
  return `#${page === 'detail' ? `/san-pham/${encodeURIComponent(productId)}` : paths[page] || '/404'}`;
}

/** Hash routes keep refresh/deep links on the static GitHub Pages index. */
export function readRoute(): {page:PageRoute; productId?:string; emotion?: 'AN'|'THUONG'|'CAM'|'NHO'; step?:number} {
  let path: string;
  const [rawPath,query='']=(window.location.hash.slice(1)||'/').split('?');
  try { path = decodeURIComponent(rawPath).replace(/\/$/, '') || '/'; }
  catch { return {page:'not-found'}; }
  const page = (Object.entries(paths) as [PageRoute,string][]).find(([,value])=>value === path)?.[0];
  if (page) {
    const params=new URLSearchParams(query),emotion=params.get('cam-xuc')?.toUpperCase();
    const step=Number(params.get('buoc')||1);
    return {page, ...(['AN','THUONG','CAM','NHO'].includes(emotion||'') ? {emotion:emotion as 'AN'|'THUONG'|'CAM'|'NHO'} : {}),step:Number.isInteger(step)&&step>=1&&step<=5?step:1};
  }
  const match = /^\/san-pham\/([^/]+)$/.exec(path);
  if (match && PRODUCTS.some(product=>product.id === match[1])) return {page:'detail',productId:match[1]};
  return {page:'not-found'};
}

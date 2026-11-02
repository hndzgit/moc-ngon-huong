import { assetUrl } from '../lib/assets';
import type { CSSProperties } from 'react';

// Unmodified exports from the original Figma nodes. See docs/FIGMA_ICON_AUDIT.md.
const icons = {
  search: ['5bc29.svg', 28, 28, '127:14673'],
  user: ['b685b.svg', 28, 28, 'I92:3685;92:3665'],
  cart: ['64a36.svg', 28, 28, 'I92:3685;92:3666'],
  bag: ['dfcd0.svg', 22, 22, '119:2645'],
  detailBag: ['66915.svg', 24, 24, 'I103:5924;73:794'],
  detailWallet: ['5f1e6.svg', 24, 24, 'I103:5925;73:749'],
  giftBag: ['06869.svg', 22, 22, '80:1924'],
  wallet: ['df75c.svg', 22, 22, '80:1928'],
  close: ['bb316.svg', 24, 24, '80:4939'],
  closeModal: ['a2171.svg', 24, 24, '127:9731'],
  closeChat: ['4983f.svg', 32, 32, '80:5109'],
  emptyCart: ['3bc2b.svg', 40, 40, '127:9320'],
  group: ['c92d5.svg', 24, 24, '103:5900'],
  box: ['a7960.svg', 24, 24, '103:5906'],
  dollar: ['5d78b.svg', 24, 24, '103:5913'],
  airplane: ['34f1f.svg', 24, 24, '103:5919'],
  call: ['ccb33.svg', 24, 24, '127:9607'],
  sms: ['3eb6c.svg', 24, 24, '127:9613'],
  send: ['98dd5.svg', 24, 24, 'I127:9623;73:760'],
  messages: ['191f0.svg', 40, 40, '80:5094'],
  more: ['1b7a5.svg', 32, 32, '80:5108'],
  emotion: ['7cd18.svg', 28.6667, 28.6667, '80:5119'],
  attachment: ['f22ce.svg', 32, 32, '80:5122'],
  scan: ['41dd0.svg', 24, 24, 'I80:4149;80:4307'],
  clock: ['54997.svg', 24, 24, 'I127:11101;76:1107'],
  facebook: ['39634.svg', 24, 24, '103:3673'],
  instagram: ['dc19d.svg', 24, 24, '103:3675'],
  tiktok: ['eface.svg', 24, 24, '103:3676'],
  arrowLeft: ['f0ea1.svg', 24, 24, '96:2991'],
  arrowRight: ['39da6.svg', 24, 24, '96:2993'],
  minus: ['0298a.svg', 28, 28, '75:3742'],
  plus: ['e2aae.svg', 28, 28, '75:3745'],
  minusLarge: ['17697.svg', 40, 40, '120:8195'],
  plusLarge: ['c2169.svg', 40, 40, '120:8200'],
  star: ['dc368.svg', 24, 23, '77:3262'],
  halfStar: ['5f455.svg', 24, 23, '77:3269'],
  avatar: ['cdae9.svg', 60, 60, '103:6426'],
  check: ['3c44d.svg', 12, 12, '103:6434'],
  verifiedReview: ['review-verified.svg', 20, 20, '103:6432'],
  success: ['75b73.svg', 100, 100, '127:11009'],
} as const;

export type FigmaIconName = keyof typeof icons;

export function FigmaIcon({ name, className = '', style }: {
  name: FigmaIconName;
  className?: string;
  style?: CSSProperties;
}) {
  const [file, width, height, node] = icons[name];
  // Figma's star SVG includes a 1px stroke bleed outside its 24×23 vector bounds.
  const hasStrokeBleed = name === 'star' || name === 'halfStar';
  return <img src={assetUrl(`/assets/figma/originals/${file}`)} width={hasStrokeBleed ? width + 2 : width} height={hasStrokeBleed ? height + 2 : height}
    alt="" aria-hidden="true" data-figma-node={node}
    className={`inline-block shrink-0 align-middle ${className}`} style={{...(hasStrokeBleed ? {margin:-1} : {}),...style}} />;
}

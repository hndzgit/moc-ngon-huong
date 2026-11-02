import { assetUrl } from '../lib/assets';
export function BrandLogo({ className = '' }: { className?: string }) {
  return <span className={`brand-logo relative block w-[80px] h-[72px] overflow-hidden shrink-0 ${className}`}>
    <img src={assetUrl("/assets/figma/logo-header.png")} alt="Mộc Ngôn Hương"
      className="absolute max-w-none" style={{ width:'137.4%', height:'134.5%', left:'-14.83%', top:'-19.27%' }} />
  </span>;
}

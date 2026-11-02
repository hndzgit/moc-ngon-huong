import { assetUrl } from '../lib/assets';
// Original combined illustration, cropped exactly as the Figma image fills.
// These layers are authored artwork in Figma, irrespective of their original filename.
const crops = {
  tea: { width: '434.31%', height: '132%', left: '-23.68%', top: '-16%' },
  spoon: { width: '416.22%', height: '126.92%', left: '-158.1%', top: '-13.46%' },
  card: { width: '434.31%', height: '129.41%', left: '-310.64%', top: '-15.69%' },
  kraft: { width: '377.44%', height: '197.14%', left: '-43.95%', top: '-48.57%' },
  envelope: { width: '366.63%', height: '176.92%', left: '-221.89%', top: '-38.46%' },
};

export function FigmaArtwork({ name }: { name: keyof typeof crops }) {
  return <span className="relative inline-block w-[37px] h-[40px] overflow-hidden shrink-0" style={{width:name === 'kraft' ? 40 : name === 'envelope' ? 39 : 37,height:name === 'kraft' ? 37.714 : 40}} aria-hidden="true">
    <img src={assetUrl(name === 'kraft' || name === 'envelope' ? '/assets/figma/icons-steps-scroll-envelope.png' : '/assets/figma/icons-gold-3.png')} alt="" className="absolute max-w-none" style={crops[name]} />
  </span>;
}

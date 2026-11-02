import type { TeaEmotion } from '../types';
import { INTENTIONS } from '../data/giftJourney';
import { assetUrl } from '../lib/assets';
import { FigmaIcon } from './FigmaIcon';
import './AtelierIntroduction.css';

export function AtelierIntroduction({onStart,onCorporate}:{onStart:(emotion:TeaEmotion,intention:string)=>void;onCorporate:()=>void}) {
  return <section className="atelier-introduction" aria-labelledby="atelier-intro-title">
    <div className="figma-container atelier-intro-grid">
      <div className="atelier-intro-copy"><p className="atelier-intro-eyebrow">TỪ MỘT ĐIỀU CHƯA NÓI</p><h2 id="atelier-intro-title">Có điều gì bạn muốn gửi<br/>mà lời nói chưa thể diễn tả?</h2><p>Một lời cảm ơn. Một chút nhớ. Một mong ước bình an.<br/>Hãy để hương trà bắt đầu câu chuyện của bạn.</p><span className="atelier-intro-signature">Trao hương, gửi lời thương.</span></div>
      <div className="atelier-letter"><span className="atelier-letter-top">ĐIỀU BẠN MUỐN GỬI <span>01 / 05</span></span><p>Gửi người tôi thương,</p><div className="atelier-letter-choices">{INTENTIONS.map(item=><button key={item.id} type="button" onClick={()=>onStart(item.emotion,item.id)}><span>{item.label}</span><span className="atelier-arrow"><FigmaIcon name="arrowRight"/></span></button>)}</div><span className="atelier-letter-footer">Chọn một lời, tìm hương trà dành cho lời ấy.</span><img src={assetUrl('/assets/optimized/discovery-botanical-THUONG.webp')} data-original-asset="/assets/figma/illus-hoanhai.png" alt="" loading="lazy" decoding="async" aria-hidden="true"/></div>
    </div>
    <div className="figma-container atelier-corporate-entry"><span>Một món quà, gửi tới nhiều người.</span><button type="button" onClick={onCorporate}>Khám phá quà tặng doanh nghiệp</button></div>
  </section>;
}

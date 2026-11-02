import type { GiftConfiguration } from '../types';
import { teaFor, emotionName } from '../data/giftJourney';
import { assetUrl } from '../lib/assets';
import './GiftCardPreview.css';

export function GiftCardPreview({configuration,compact=false}:{configuration:GiftConfiguration;compact?:boolean}) {
  const tea=teaFor(configuration.emotion);
  return <figure className={`gift-card-preview gift-card-${configuration.cardStyle}${compact?' gift-card-compact':''}`} aria-label="Bản xem trước lời nhắn">
    <div className="gift-card-rule" aria-hidden="true" />
    <figcaption>MỘC NGÔN HƯƠNG <span>· {emotionName(configuration.emotion)}</span></figcaption>
    <p className="gift-card-recipient">Gửi {configuration.recipient.trim() || 'người tôi thương'},</p>
    <p className="gift-card-message">{configuration.message.trim() || 'Một hương trà. Một lời muốn gửi.'}</p>
    <p className="gift-card-signature">Trao hương, gửi lời thương.</p>
    <img src={assetUrl(`/assets/optimized/discovery-botanical-${configuration.emotion}.webp`)} data-original-asset={tea.botanicalIllustration} alt="" aria-hidden="true" loading="lazy" decoding="async" />
  </figure>;
}

import type { TeaEmotion } from '../types';
import { getLocalizedIntentions } from '../data/localizedCatalog';
import { normalizeLocale } from '../lib/locale';
import { assetUrl } from '../lib/assets';
import { FigmaIcon } from './FigmaIcon';
import { useTranslation } from 'react-i18next';
import './AtelierIntroduction.css';

export function AtelierIntroduction({onStart,onCorporate}:{onStart:(emotion:TeaEmotion,intention:string)=>void;onCorporate:()=>void}) {
  const { t, i18n } = useTranslation('home');
  const locale = normalizeLocale(i18n.language);
  const intentions = getLocalizedIntentions(locale);

  return <section className="atelier-introduction" aria-labelledby="atelier-intro-title">
    <div className="figma-container atelier-intro-grid">
      <div className="atelier-intro-copy"><p className="atelier-intro-eyebrow">{t('atelier.kicker')}</p><h2 id="atelier-intro-title">{t('atelier.titleLine1')}{' '}<br/>{t('atelier.titleLine2')}</h2><p>{t('atelier.descLine1')}{' '}<br/>{t('atelier.descLine2')}</p><span className="atelier-intro-signature">{t('atelier.signature')}</span></div>
      <div className="atelier-letter"><span className="atelier-letter-top">{t('atelier.letterTop')} <span>{t('atelier.letterCount')}</span></span><p>{t('atelier.letterSalutation')}</p><div className="atelier-letter-choices">{intentions.map(item=><button key={item.id} type="button" onClick={()=>onStart(item.emotion,item.id)}><span>{item.label}</span><span className="atelier-arrow"><FigmaIcon name="arrowRight"/></span></button>)}</div><span className="atelier-letter-footer">{t('atelier.letterFooter')}</span><img src={assetUrl('/assets/optimized/discovery-botanical-THUONG.webp')} data-original-asset="/source-assets/figma/illus-hoanhai.png" alt="" loading="lazy" decoding="async" aria-hidden="true"/></div>
    </div>
    <div className="figma-container atelier-corporate-entry"><span>{t('atelier.corporatePrompt')}</span><button type="button" onClick={onCorporate}>{t('atelier.corporateCta')}</button></div>
  </section>;
}

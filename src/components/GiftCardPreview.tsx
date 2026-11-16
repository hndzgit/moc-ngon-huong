import type { GiftConfiguration } from '../types';
import { teaFor } from '../data/giftJourney';
import { getLocalizedEmotionName } from '../data/localizedCatalog';
import { normalizeLocale } from '../lib/locale';
import { assetUrl } from '../lib/assets';
import { useTranslation } from 'react-i18next';
import './GiftCardPreview.css';

export function GiftCardPreview({configuration,compact=false}:{configuration:GiftConfiguration;compact?:boolean}) {
  const { t, i18n } = useTranslation('gifting');
  const locale = normalizeLocale(i18n.language);
  const tea=teaFor(configuration.emotion);
  return <figure className={`gift-card-preview gift-card-${configuration.cardStyle}${compact?' gift-card-compact':''}`} aria-label={t('journey.cardPreview.figureAria')}>
    <div className="gift-card-rule" aria-hidden="true" />
    <figcaption>{t('journey.cardPreview.brandTitle')} <span>· {getLocalizedEmotionName(configuration.emotion, locale)}</span></figcaption>
    <p className="gift-card-recipient">{t('journey.cardPreview.toPrefix')} {configuration.recipient.trim() || t('journey.cardPreview.defaultRecipient')},</p>
    <p className="gift-card-message">{configuration.message.trim() || t('journey.cardPreview.defaultMessage')}</p>
    <p className="gift-card-signature">{t('journey.cardPreview.signature')}</p>
    <img src={assetUrl(`/assets/optimized/discovery-botanical-${configuration.emotion}.webp`)} data-original-asset={tea.botanicalIllustration} alt="" aria-hidden="true" loading="lazy" decoding="async" />
  </figure>;
}

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PRODUCTS } from '../data/products';
import { getLocalizedProduct } from '../data/localizedCatalog';
import { formatVnd, normalizeLocale } from '../lib/locale';
import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { FigmaIcon } from '../components/FigmaIcon';
import type { PageRoute } from '../types';
import './CorporateGiftingPage.css';

interface CorporateGiftingPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

interface InquiryDraft {
  organization: string;
  name: string;
  contact: string;
  quantity: string;
  budget: string;
  occasion: string;
  requirements: string;
  productId: string;
}

const emptyDraft: InquiryDraft = {
  organization: '', name: '', contact: '', quantity: '', budget: '',
  occasion: '', requirements: '', productId: 'hop-qua-tam-y',
};

/** A guest-only local quotation draft. No customer data is stored or transmitted. */
export function CorporateGiftingPage({ onNavigate }: CorporateGiftingPageProps) {
  const { t, i18n } = useTranslation('gifting');
  const locale = normalizeLocale(i18n.language);
  const [draft, setDraft] = useState<InquiryDraft>(emptyDraft);
  const [preview, setPreview] = useState<InquiryDraft | null>(null);
  const [status, setStatus] = useState('');
  const rawProduct = PRODUCTS.find(item => item.id === draft.productId) || PRODUCTS[4];
  const product = getLocalizedProduct(rawProduct, locale);
  const rawPreviewProduct = PRODUCTS.find(item => item.id === preview?.productId) || rawProduct;
  const previewProduct = getLocalizedProduct(rawPreviewProduct, locale);
  const approachSteps = t('corporate.approach.steps', { returnObjects: true }) as ReadonlyArray<{
    num: string;
    title: string;
    desc: string;
  }>;
  const occasionOptions = t('corporate.inquiry.occasions', { returnObjects: true }) as ReadonlyArray<string>;
  const money = (value: number) => formatVnd(value, locale, 'symbol-vi');

  const setField = (field: keyof InquiryDraft, value: string) => {
    setDraft(previous => ({ ...previous, [field]: value }));
    setStatus('');
  };
  const previewIsCurrent = preview && Object.keys(draft).every(key =>
    draft[key as keyof InquiryDraft] === preview[key as keyof InquiryDraft]);

  const buildPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contact = draft.contact.trim();
    if (!draft.organization.trim() || !draft.name.trim() || !contact) {
      setStatus(t('corporate.inquiry.validation.missingRequired'));
      return;
    }
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = /^\+?[\d\s().-]{9,20}$/;
    const phoneDigits = contact.replace(/\D/g, '').length;
    if (!email.test(contact) && !(phone.test(contact) && phoneDigits >= 9 && phoneDigits <= 15)) {
      setStatus(t('corporate.inquiry.validation.invalidContact'));
      return;
    }
    const quantity = Number(draft.quantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setStatus(t('corporate.inquiry.validation.invalidQuantity'));
      return;
    }
    setPreview({ ...draft });
    setStatus(t('corporate.inquiry.validation.previewCreated'));
  };

  return (
    <div className="corporate-page">
      <section className="corporate-hero" aria-labelledby="corporate-title">
        <div className="figma-container corporate-hero-grid">
          <div className="corporate-hero-copy">
            <p className="corporate-kicker">{t('corporate.hero.kicker')}</p>
            <h1 id="corporate-title">{t('corporate.hero.titleLine1')}{' '}<br />{t('corporate.hero.titleLine2')}{' '}<br /><em>{t('corporate.hero.titleEmphasis')}</em></h1>
            <p>{t('corporate.hero.lead')}</p>
            <a className="corporate-button" href="#yeu-cau-doanh-nghiep" onClick={event => {
              event.preventDefault();
              document.getElementById('yeu-cau-doanh-nghiep')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
              document.getElementById('corporate-organization')?.focus({ preventScroll: true });
            }}>{t('corporate.hero.ctaButton')}</a>
            <span className="corporate-hero-note">{t('corporate.hero.ctaNote')}</span>
          </div>
          <figure className="corporate-hero-photo">
            <img src={assetUrl('/assets/optimized/tea-hop-qua-tam-y-1280.webp')} data-original-asset="/source-assets/figma/combo-table.png" alt={t('corporate.hero.photoAlt')} width="1536" height="1024" decoding="async" />
            <figcaption><span>{t('corporate.hero.captionLeft')}</span><span>{t('corporate.hero.captionRight')}</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="corporate-approach figma-container" aria-labelledby="corporate-approach-title">
        <div><p className="corporate-kicker">{t('corporate.approach.kicker')}</p><h2 id="corporate-approach-title">{t('corporate.approach.titleLine1')}{' '}<br />{t('corporate.approach.titleLine2')}</h2></div>
        <ol>
          {approachSteps.map((stepItem) => (
            <li key={stepItem.num}><span>{stepItem.num}</span><div><h3>{stepItem.title}</h3><p>{stepItem.desc}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="corporate-collection" aria-labelledby="corporate-collection-title">
        <div className="figma-container corporate-collection-grid">
          <div className="corporate-product-photo">
            <MotionImage src={assetUrl(`/assets/optimized/tea-${product.id}-1280.webp`)} data-original-asset={product.image} alt={product.name} loading="lazy" decoding="async" />
            <span>{t('corporate.collection.originalPhotoTag')}</span>
          </div>
          <div className="corporate-product-copy">
            <p className="corporate-kicker">{t('corporate.collection.kicker')}</p>
            <h2 id="corporate-collection-title">{t('corporate.collection.titleLine1')}{' '}<br />{t('corporate.collection.titleLine2')}</h2>
            <label htmlFor="corporate-product">{t('corporate.collection.selectLabel')}</label>
            <select id="corporate-product" value={draft.productId} onChange={event => setField('productId', event.target.value)}>
              {PRODUCTS.map(rawItem => {
                const item = getLocalizedProduct(rawItem, locale);
                return <option key={item.id} value={item.id}>{item.name}</option>;
              })}
            </select>
            <h3>{product.name}</h3>
            <p className="corporate-price">{money(product.price)} <span>{t('corporate.collection.priceUnit')}</span></p>
            <p>{product.packaging}</p>
            <button type="button" className="corporate-text-link" onClick={() => onNavigate('detail', product.id)}>{t('corporate.collection.detailLink')} <span className="corporate-link-arrow"><FigmaIcon name="arrowRight" /></span></button>
            <p className="corporate-product-note">{t('corporate.collection.disclaimer')}</p>
          </div>
        </div>
      </section>

      <section id="yeu-cau-doanh-nghiep" className="corporate-inquiry figma-container" aria-labelledby="corporate-inquiry-title">
        <div className="corporate-inquiry-heading">
          <p className="corporate-kicker">{t('corporate.inquiry.kicker')}</p>
          <h2 id="corporate-inquiry-title">{t('corporate.inquiry.titleLine1')}{' '}<br /><em>{t('corporate.inquiry.titleEmphasis')}</em></h2>
          <p>{t('corporate.inquiry.lead')}</p>
          <div className="corporate-service-note"><FigmaIcon name="sms" /><p>{t('corporate.inquiry.serviceNotePrefix')} <strong>{t('corporate.inquiry.serviceNoteStrong')}</strong>{t('corporate.inquiry.serviceNoteSuffix')}</p></div>
        </div>
        <div className="corporate-inquiry-body">
          <form onSubmit={buildPreview} className="corporate-form" aria-describedby="corporate-form-note">
            <p id="corporate-form-note">{t('corporate.inquiry.requiredNote')}</p>
            <div className="corporate-form-grid">
              <label htmlFor="corporate-organization">{t('corporate.inquiry.orgLabel')}<input id="corporate-organization" name="organization" autoComplete="organization" required maxLength={160} value={draft.organization} onChange={event => setField('organization', event.target.value)} /></label>
              <label htmlFor="corporate-name">{t('corporate.inquiry.nameLabel')}<input id="corporate-name" name="name" autoComplete="name" required maxLength={100} value={draft.name} onChange={event => setField('name', event.target.value)} /></label>
              <label className="corporate-form-wide" htmlFor="corporate-contact">{t('corporate.inquiry.contactLabel')}<input id="corporate-contact" name="contact" required maxLength={160} value={draft.contact} onChange={event => setField('contact', event.target.value)} inputMode="email" /></label>
              <label htmlFor="corporate-quantity">{t('corporate.inquiry.quantityLabel')}<input id="corporate-quantity" name="quantity" type="number" inputMode="numeric" required min="1" step="1" value={draft.quantity} onChange={event => setField('quantity', event.target.value)} /></label>
              <label htmlFor="corporate-budget">{t('corporate.inquiry.budgetLabel')}<input id="corporate-budget" name="budget" type="number" inputMode="numeric" min="0" step="1" value={draft.budget} onChange={event => setField('budget', event.target.value)} /></label>
              <label className="corporate-form-wide" htmlFor="corporate-occasion">{t('corporate.inquiry.occasionLabel')}<select id="corporate-occasion" name="occasion" value={draft.occasion} onChange={event => setField('occasion', event.target.value)}><option value="">{t('corporate.inquiry.occasionPlaceholder')}</option>{occasionOptions.map((occ) => <option key={occ} value={occ}>{occ}</option>)}</select></label>
              <label className="corporate-form-wide" htmlFor="corporate-requirements">{t('corporate.inquiry.requirementsLabel')}<textarea id="corporate-requirements" name="requirements" rows={5} maxLength={1000} value={draft.requirements} onChange={event => setField('requirements', event.target.value)} placeholder={t('corporate.inquiry.requirementsPlaceholder')} /><span className="corporate-field-hint">{t('corporate.inquiry.requirementsHint')}</span></label>
            </div>
            <button className="corporate-button" type="submit">{t('corporate.inquiry.submitBtn')}</button>
            <p className="corporate-form-status" role="status" aria-live="polite">{status}</p>
          </form>
          {preview && <aside className="corporate-draft" aria-labelledby="corporate-draft-title">
            <p className="corporate-kicker">{t('corporate.inquiry.draft.kicker')}</p>
            <h3 id="corporate-draft-title">{t('corporate.inquiry.draft.titlePrefix')} {preview.organization}</h3>
            {!previewIsCurrent && <p className="corporate-draft-warning">{t('corporate.inquiry.draft.staleWarning')}</p>}
            <dl><div><dt>{t('corporate.inquiry.draft.contactPerson')}</dt><dd>{preview.name}</dd></div><div><dt>{t('corporate.inquiry.draft.contactInfo')}</dt><dd>{preview.contact}</dd></div><div><dt>{t('corporate.inquiry.draft.product')}</dt><dd>{previewProduct.name}</dd></div><div><dt>{t('corporate.inquiry.draft.qty')}</dt><dd>{preview.quantity} {t('corporate.inquiry.draft.qtySuffix')}</dd></div><div><dt>{t('corporate.inquiry.draft.catalogSubtotal')}</dt><dd>{money(Number(preview.quantity) * previewProduct.price)}</dd></div>{preview.budget && <div><dt>{t('corporate.inquiry.draft.budgetPerBox')}</dt><dd>{money(Number(preview.budget))}</dd></div>}{preview.occasion && <div><dt>{t('corporate.inquiry.draft.occasion')}</dt><dd>{preview.occasion}</dd></div>}</dl>
            {preview.requirements && <p className="corporate-draft-message">{preview.requirements}</p>}
            <p>{t('corporate.inquiry.draft.note')}</p>
            <button type="button" className="corporate-text-link" onClick={() => onNavigate('contact')}>{t('corporate.inquiry.draft.contactLink')} <span className="corporate-link-arrow"><FigmaIcon name="arrowRight" /></span></button>
          </aside>}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GiftDraft, PageRoute, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { TEAS, changeEmotion, teaFor } from '../data/giftJourney';
import {
  getLocalizedEmotionName,
  getLocalizedIntentions,
  getLocalizedProduct,
} from '../data/localizedCatalog';
import { formatVnd, normalizeLocale } from '../lib/locale';
import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { scrollBehavior, useChangeMotion } from '../motion/motion';
import { GiftCardPreview } from '../components/GiftCardPreview';
import { FigmaIcon } from '../components/FigmaIcon';
import './GiftJourneyPage.css';

interface Props {
  draft:GiftDraft; step:number;
  onChange:(draft:GiftDraft)=>void;
  onStep:(step:number)=>void;
  onNavigate:(page:PageRoute,productId?:string)=>void;
  onAddGift:(product:Product,draft:GiftDraft,checkout?:boolean)=>void;
  onReset:()=>void;
}
export default function GiftJourneyPage({draft,step,onChange,onStep,onNavigate,onAddGift,onReset}:Props) {
  const { t, i18n } = useTranslation('gifting');
  const locale = normalizeLocale(i18n.language);
  const STEPS = t('journey.steps', { returnObjects: true }) as ReadonlyArray<string>;
  const stepTitles = t('journey.stepTitles', { returnObjects: true }) as ReadonlyArray<string>;
  const intentions = getLocalizedIntentions(locale);

  const rawTea = teaFor(draft.emotion);
  const tea = getLocalizedProduct(rawTea, locale);
  const rawProduct = PRODUCTS.find(p => p.id === draft.productId) || rawTea;
  const product = getLocalizedProduct(rawProduct, locale);
  const rawSignature = PRODUCTS.find(p => p.isSignature)!;
  const localizedTeas = TEAS.map((item) => getLocalizedProduct(item, locale));

  const [error,setError]=useState('');
  const heading=useRef<HTMLHeadingElement>(null),previousStep=useRef(step);
  const preview=useRef<HTMLElement>(null);
  const motion=useChangeMotion<HTMLDivElement>(`${step}/${draft.emotion}`,undefined,.3);
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
  useEffect(()=>{
    if(previousStep.current!==step){setError('');heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:'instant'});}
    previousStep.current=step;
  },[step]);
  const edit=(patch:Partial<GiftDraft>)=>onChange({...draft,...patch});
  const advance=()=>{if(!draft.intention){setError(t('journey.errors.selectIntentionFirst'));return;}setError('');onStep(Math.min(5,step+1));};
  const add=(checkout=false)=>{if(!draft.intention){setError(t('journey.errors.selectIntentionStep1'));return;}onAddGift(rawProduct,draft,checkout);};
  const stepLabel = String(step).padStart(2, '0');
  const emotionTitle = getLocalizedEmotionName(draft.emotion, locale);

  return <div className="gift-journey atelier-page">
    <div className="figma-container">
      <header className="journey-heading">
        <p className="atelier-eyebrow">{t('journey.eyebrow')}</p>
        <h1>{t('journey.title')}</h1>
        <p>{t('journey.subtitle')}</p>
      </header>
      <nav className="journey-progress" aria-label={t('journey.stepsAria')}>
        <ol>{STEPS.map((label,index)=><li key={label}><button type="button" aria-current={step===index+1?'step':undefined}
          disabled={index>0&&!draft.intention} onClick={()=>onStep(index+1)}><span>{String(index+1).padStart(2,'0')}</span><span>{label}</span></button></li>)}</ol>
      </nav>
      <div className="journey-layout">
        <section className="journey-workspace" aria-labelledby="journey-step-title">
          <div className="journey-chapter"><span>{t('journey.chapterBadge', { step: stepLabel })}</span><button type="button" onClick={onReset}>{t('journey.restartBtn')}</button></div>
          <div ref={motion}>
            <h2 id="journey-step-title" ref={heading} tabIndex={-1}>{stepTitles[step-1]}</h2>
            {step===1&&<>
              <p className="journey-lead">{t('journey.step1Lead')}</p>
              <div className="journey-intentions" role="group" aria-label={t('journey.step1Aria')}>{intentions.map((item,index)=><button key={item.id} type="button" aria-pressed={draft.intention===item.id}
                onClick={()=>onChange({...changeEmotion(draft,item.emotion),intention:item.id})}>
                <span className="choice-number">0{index+1}</span><span><strong>{item.label}</strong><small>{item.sentence}</small></span><span aria-hidden="true">{draft.intention===item.id?'●':'○'}</span>
              </button>)}</div>
            </>}
            {step===2&&<>
              <p className="journey-lead">{t('journey.step2Lead')}</p>
              <div className="journey-emotions" role="group" aria-label={t('journey.step2Aria')}>{localizedTeas.map(item=><button type="button" key={item.id} aria-pressed={draft.emotion===item.emotion} onClick={()=>onChange(changeEmotion(draft,item.emotion as GiftDraft['emotion']))}>
                <img src={assetUrl(`/assets/optimized/discovery-botanical-${item.emotion}.webp`)} data-original-asset={item.botanicalIllustration} alt="" loading="lazy" decoding="async"/><strong>{getLocalizedEmotionName(item.emotion as GiftDraft['emotion'], locale)}</strong><span>{item.shortName}</span>
              </button>)}</div>
              <p className="journey-emotion-quote">{tea.tagline}</p>
            </>}
            {step===3&&<>
              <p className="journey-lead">{tea.name}</p>
              <p className="journey-aroma">{tea.scentNotes[0]}</p>
              <dl className="journey-tea-facts"><div><dt>{t('journey.step3Facts.ingredients')}</dt><dd>{tea.ingredients.join(' · ')}</dd></div><div><dt>{t('journey.step3Facts.taste')}</dt><dd>{tea.tasteNotes}</dd></div><div><dt>{t('journey.step3Facts.brewing')}</dt><dd>{tea.brewingTemp} · {tea.brewingTime}{' '}<br/>{tea.brewingAmount}</dd></div></dl>
              <div className="journey-flavor-switch" role="group" aria-label={t('journey.step3Facts.compareAria')}>{localizedTeas.map(item=><button type="button" key={item.id} aria-pressed={tea.id===item.id} onClick={()=>onChange(changeEmotion(draft,item.emotion as GiftDraft['emotion']))}>{getLocalizedEmotionName(item.emotion as GiftDraft['emotion'], locale)}</button>)}</div>
              <button className="atelier-text-link" type="button" onClick={()=>onNavigate('detail',tea.id)}>{t('journey.step3Facts.viewProductCta')} <span className="atelier-arrow"><FigmaIcon name="arrowRight" /></span></button>
            </>}
            {step===4&&<>
              <p className="journey-lead">{t('journey.step4.lead')}</p>
              <div className="journey-product-options" role="group" aria-label={t('journey.step4.chooseProductAria')}>{[rawTea,rawSignature].map(rawItem=>{const item=getLocalizedProduct(rawItem,locale);return <button type="button" key={item.id} aria-pressed={product.id===item.id} onClick={()=>edit({productId:item.id})}><span><strong>{item.shortName}</strong><small>{item.packaging}</small></span><b>{formatVnd(item.price, locale, 'spaced-vi')}</b></button>;})}</div>
              <div className="journey-composer">
                <label htmlFor="gift-recipient">{t('journey.step4.recipientLabel')} <span>{t('journey.step4.recipientOptional')}</span></label>
                <input id="gift-recipient" maxLength={60} value={draft.recipient} onChange={e=>edit({recipient:e.target.value})} placeholder={t('journey.step4.recipientPlaceholder')} autoComplete="off" />
                <label htmlFor="gift-message">{t('journey.step4.messageLabel')} <span>{draft.message.length}/280</span></label>
                <textarea id="gift-message" rows={4} maxLength={280} value={draft.message} onChange={e=>edit({message:e.target.value})} placeholder={t('journey.step4.messagePlaceholder')} aria-describedby="gift-privacy" />
                <button type="button" className="atelier-text-link journey-mobile-preview-link" onClick={()=>{preview.current?.focus({preventScroll:true});preview.current?.scrollIntoView({behavior:scrollBehavior(),block:'start'});}}>{t('journey.step4.mobilePreviewBtn')}</button>
                <button type="button" className="atelier-text-link" onClick={()=>edit({message:intentions.find(i=>i.id===draft.intention)?.sentence||''})}>{t('journey.step4.useSuggestedBtn')}</button>
                <fieldset><legend>{t('journey.step4.layoutLegend')}</legend><div className="journey-card-options">{(['botanical','letter'] as const).map(style=><label key={style}><input type="radio" name="card-style" value={style} checked={draft.cardStyle===style} onChange={()=>edit({cardStyle:style})}/>{style==='botanical'?t('journey.step4.styleBotanical'):t('journey.step4.styleLetter')}</label>)}</div></fieldset>
                <p className="journey-note" id="gift-privacy">{t('journey.step4.privacyNote')}</p>
              </div>
            </>}
            {step===5&&<>
              <p className="journey-lead">{intentions.find(i=>i.id===draft.intention)?.label||t('journey.step5.noIntention')} · {emotionTitle}</p>
              <dl className="journey-summary"><div><dt>{t('journey.step5.giftBoxLabel')}</dt><dd>{product.name}</dd></div><div><dt>{t('journey.step5.teaLabel')}</dt><dd>{product.isSignature?t('journey.step5.allFlavors'):tea.shortName}</dd></div><div><dt>{t('journey.step5.insideLabel')}</dt><dd>{product.packaging}</dd></div><div><dt>{t('journey.step5.priceLabel')}</dt><dd>{formatVnd(product.price, locale, 'spaced-vi')}</dd></div><div><dt>{t('journey.step5.personalizationLabel')}</dt><dd>{t('journey.step5.personalizationLine1')} {draft.cardStyle==='botanical'?t('journey.step4.styleBotanical'):t('journey.step4.styleLetter')}{' '}<br/>{t('journey.step5.personalizationLine2')}</dd></div></dl>
              <p className="journey-note">{t('journey.step5.cartNote')}</p>
              <div className="journey-summary-actions"><button type="button" className="atelier-button" onClick={()=>add()}>{t('journey.step5.addToCartBtn')} <FigmaIcon name="giftBag" /></button><button type="button" className="atelier-button atelier-button-outline" onClick={()=>add(true)}>{t('journey.step5.checkoutBtn')}</button><button type="button" className="atelier-text-link" onClick={()=>onNavigate('contact')}>{t('journey.step5.contactStoreBtn')}</button></div>
              <button type="button" className="atelier-text-link" onClick={()=>onNavigate('products')}>{t('journey.step5.browseCollectionBtn')}</button>
            </>}
          </div>
          {error&&<p role="alert" className="journey-error">{error}</p>}
          <div className="journey-bottom"><button type="button" className="atelier-text-link" disabled={step===1} onClick={()=>onStep(step-1)}>{t('journey.nav.back')}</button><span>{stepLabel} / 05</span>{step<5?<button className="atelier-button" type="button" onClick={advance}>{t('journey.nav.continue')} <FigmaIcon name="arrowRight" /></button>:<button type="button" className="atelier-text-link" onClick={()=>onStep(4)}>{t('journey.nav.editMessage')}</button>}</div>
        </section>
        <aside ref={preview} tabIndex={-1} className="journey-preview" aria-label={t('journey.preview.asideAria')}>
          <div className="journey-photo"><MotionImage src={assetUrl(product.isSignature&&step>=4?'/assets/optimized/gift-view-1.webp':`/assets/optimized/tea-${tea.id}-1280.webp`)} alt={(product.isSignature&&step>=4?product:tea).name} decoding="async"/><span className="journey-photo-label">{emotionTitle}<small>{step>=4?product.shortName:tea.shortName}</small></span></div>
          {step>=4?<><GiftCardPreview configuration={draft}/><p className="journey-note">{t('journey.preview.disclaimer2d')}</p>{step===4&&<button type="button" className="atelier-text-link journey-mobile-preview-link" onClick={()=>document.getElementById('gift-message')?.focus()}>{t('journey.preview.focusMessageBtn')}</button>}</>:<div className="journey-preview-copy"><p>{t('journey.preview.quoteEyebrow')}</p><blockquote>{tea.storyQuote.replace(/^"|"$/g,'')}</blockquote><span>{formatVnd(tea.price, locale, 'spaced-vi')} · {tea.weight}</span></div>}
        </aside>
      </div>
    </div>
  </div>;
}

import { useEffect, useRef, useState } from 'react';
import type { GiftDraft, PageRoute, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { INTENTIONS, TEAS, changeEmotion, emotionName, money, teaFor } from '../data/giftJourney';
import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { scrollBehavior, useChangeMotion } from '../motion/motion';
import { GiftCardPreview } from '../components/GiftCardPreview';
import { FigmaIcon } from '../components/FigmaIcon';
import './GiftJourneyPage.css';

const STEPS=['Điều muốn gửi','Cảm xúc','Hương trà','Sản phẩm','Món quà'];
interface Props {
  draft:GiftDraft; step:number;
  onChange:(draft:GiftDraft)=>void;
  onStep:(step:number)=>void;
  onNavigate:(page:PageRoute,productId?:string)=>void;
  onAddGift:(product:Product,draft:GiftDraft,checkout?:boolean)=>void;
  onReset:()=>void;
}
export default function GiftJourneyPage({draft,step,onChange,onStep,onNavigate,onAddGift,onReset}:Props) {
  const tea=teaFor(draft.emotion),product=PRODUCTS.find(p=>p.id===draft.productId)||tea;
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
  const advance=()=>{if(!draft.intention){setError('Hãy chọn điều bạn muốn gửi trước khi tiếp tục.');return;}setError('');onStep(Math.min(5,step+1));};
  const add=(checkout=false)=>{if(!draft.intention){setError('Hãy chọn điều muốn gửi ở bước 1.');return;}onAddGift(product,draft,checkout);};
  return <div className="gift-journey atelier-page">
    <div className="figma-container">
      <header className="journey-heading">
        <p className="atelier-eyebrow">XƯỞNG QUÀ CỦA BẠN · MỘC NGÔN HƯƠNG</p>
        <h1>Điều bạn muốn gửi</h1>
        <p>Từ một lời chưa nói, thành một món quà mang hương trà.</p>
      </header>
      <nav className="journey-progress" aria-label="Các bước chọn quà">
        <ol>{STEPS.map((label,index)=><li key={label}><button type="button" aria-current={step===index+1?'step':undefined}
          disabled={index>0&&!draft.intention} onClick={()=>onStep(index+1)}><span>{String(index+1).padStart(2,'0')}</span><span>{label}</span></button></li>)}</ol>
      </nav>
      <div className="journey-layout">
        <section className="journey-workspace" aria-labelledby="journey-step-title">
          <div className="journey-chapter"><span>CHƯƠNG {String(step).padStart(2,'0')} / 05</span><button type="button" onClick={onReset}>Bắt đầu lại</button></div>
          <div ref={motion}>
            <h2 id="journey-step-title" ref={heading} tabIndex={-1}>{['Bạn muốn gửi điều gì?','Một cảm xúc, một hương trà.','Chậm lại, để hiểu hương trà.','Chọn hình hài cho món quà.','Món quà đã mang lời của bạn.'][step-1]}</h2>
            {step===1&&<>
              <p className="journey-lead">Không cần tìm lời thật hay. Bắt đầu bằng điều bạn thật lòng muốn nói.</p>
              <div className="journey-intentions" role="group" aria-label="Điều muốn gửi">{INTENTIONS.map((item,index)=><button key={item.id} type="button" aria-pressed={draft.intention===item.id}
                onClick={()=>onChange({...changeEmotion(draft,item.emotion),intention:item.id})}>
                <span className="choice-number">0{index+1}</span><span><strong>{item.label}</strong><small>{item.sentence}</small></span><span aria-hidden="true">{draft.intention===item.id?'●':'○'}</span>
              </button>)}</div>
            </>}
            {step===2&&<>
              <p className="journey-lead">Gợi ý từ lời muốn gửi. Bạn vẫn có thể chọn cảm xúc gần với mình hơn.</p>
              <div className="journey-emotions" role="group" aria-label="Chọn cảm xúc">{TEAS.map(item=><button type="button" key={item.id} aria-pressed={draft.emotion===item.emotion} onClick={()=>onChange(changeEmotion(draft,item.emotion as GiftDraft['emotion']))}>
                <img src={assetUrl(`/assets/optimized/discovery-botanical-${item.emotion}.webp`)} data-original-asset={item.botanicalIllustration} alt="" loading="lazy" decoding="async"/><strong>{emotionName(item.emotion as GiftDraft['emotion'])}</strong><span>{item.shortName}</span>
              </button>)}</div>
              <p className="journey-emotion-quote">{tea.tagline}</p>
            </>}
            {step===3&&<>
              <p className="journey-lead">{tea.name}</p>
              <p className="journey-aroma">{tea.scentNotes[0]}</p>
              <dl className="journey-tea-facts"><div><dt>Thành phần theo catalog</dt><dd>{tea.ingredients.join(' · ')}</dd></div><div><dt>Vị trà</dt><dd>{tea.tasteNotes}</dd></div><div><dt>Pha một chén trà</dt><dd>{tea.brewingTemp} · {tea.brewingTime}<br/>{tea.brewingAmount}</dd></div></dl>
              <div className="journey-flavor-switch" role="group" aria-label="So sánh hương trà">{TEAS.map(item=><button type="button" key={item.id} aria-pressed={tea.id===item.id} onClick={()=>onChange(changeEmotion(draft,item.emotion as GiftDraft['emotion']))}>{emotionName(item.emotion as GiftDraft['emotion'])}</button>)}</div>
              <button className="atelier-text-link" type="button" onClick={()=>onNavigate('detail',tea.id)}>Xem trang sản phẩm <span className="atelier-arrow"><FigmaIcon name="arrowRight" /></span></button>
            </>}
            {step===4&&<>
              <p className="journey-lead">Hộp và thành phần giữ theo catalog. Lời nhắn bên dưới là bản nháp để trao đổi với cửa hàng.</p>
              <div className="journey-product-options" role="group" aria-label="Chọn sản phẩm">{[tea,PRODUCTS.find(p=>p.isSignature)!].map(item=><button type="button" key={item.id} aria-pressed={product.id===item.id} onClick={()=>edit({productId:item.id})}><span><strong>{item.shortName}</strong><small>{item.packaging}</small></span><b>{money(item.price)}</b></button>)}</div>
              <div className="journey-composer">
                <label htmlFor="gift-recipient">Người nhận <span>(không bắt buộc)</span></label>
                <input id="gift-recipient" maxLength={60} value={draft.recipient} onChange={e=>edit({recipient:e.target.value})} placeholder="Ví dụ: Mẹ" autoComplete="off" />
                <label htmlFor="gift-message">Lời muốn gửi <span>{draft.message.length}/280</span></label>
                <textarea id="gift-message" rows={4} maxLength={280} value={draft.message} onChange={e=>edit({message:e.target.value})} placeholder="Viết lời của riêng bạn…" aria-describedby="gift-privacy" />
                <button type="button" className="atelier-text-link journey-mobile-preview-link" onClick={()=>{preview.current?.focus({preventScroll:true});preview.current?.scrollIntoView({behavior:scrollBehavior(),block:'start'});}}>Xem lời nhắn trên thiệp</button>
                <button type="button" className="atelier-text-link" onClick={()=>edit({message:INTENTIONS.find(i=>i.id===draft.intention)?.sentence||''})}>Dùng lời nhắn gợi ý</button>
                <fieldset><legend>Bố cục xem trước</legend><div className="journey-card-options">{(['botanical','letter'] as const).map(style=><label key={style}><input type="radio" name="card-style" value={style} checked={draft.cardStyle===style} onChange={()=>edit({cardStyle:style})}/>{style==='botanical'?'Nét hoa':'Lá thư'}</label>)}</div></fieldset>
                <p className="journey-note" id="gift-privacy">Hai bố cục là minh họa số, chưa phải mẫu thiệp in đã bán. Khả năng cá nhân hóa và chi phí cần cửa hàng xác nhận. Bản nháp chưa thêm vào giỏ chỉ giữ trong phiên mở trang.</p>
              </div>
            </>}
            {step===5&&<>
              <p className="journey-lead">{INTENTIONS.find(i=>i.id===draft.intention)?.label||'Chưa chọn lời muốn gửi'} · {emotionName(draft.emotion)}</p>
              <dl className="journey-summary"><div><dt>Hộp quà</dt><dd>{product.name}</dd></div><div><dt>Hương trà</dt><dd>{product.isSignature?'Bưởi · Nhài · Hoa Sói · Cốm':tea.shortName}</dd></div><div><dt>Bên trong</dt><dd>{product.packaging}</dd></div><div><dt>Giá sản phẩm</dt><dd>{money(product.price)}</dd></div><div><dt>Cá nhân hóa</dt><dd>Bản nháp lời nhắn · {draft.cardStyle==='botanical'?'Nét hoa':'Lá thư'}<br/>Chưa bao gồm dịch vụ tùy chỉnh; cần tư vấn.</dd></div></dl>
              <p className="journey-note">Thêm đúng sản phẩm vào giỏ với giá catalog. Bản nháp đi cùng dòng sản phẩm trong phiên này; nếu thêm lại cùng sản phẩm, bản nháp mới thay bản cũ. Chưa gửi lời nhắn hay đặt hàng.</p>
              <div className="journey-summary-actions"><button type="button" className="atelier-button" onClick={()=>add()}>Thêm món quà vào giỏ <FigmaIcon name="giftBag" /></button><button type="button" className="atelier-button atelier-button-outline" onClick={()=>add(true)}>Tiếp tục đến thanh toán</button><button type="button" className="atelier-text-link" onClick={()=>onNavigate('contact')}>Trao đổi với cửa hàng</button></div>
              <button type="button" className="atelier-text-link" onClick={()=>onNavigate('products')}>Tiếp tục khám phá bộ sưu tập</button>
            </>}
          </div>
          {error&&<p role="alert" className="journey-error">{error}</p>}
          <div className="journey-bottom"><button type="button" className="atelier-text-link" disabled={step===1} onClick={()=>onStep(step-1)}>Quay lại</button><span>{String(step).padStart(2,'0')} / 05</span>{step<5?<button className="atelier-button" type="button" onClick={advance}>Tiếp tục <FigmaIcon name="arrowRight" /></button>:<button type="button" className="atelier-text-link" onClick={()=>onStep(4)}>Sửa lời nhắn</button>}</div>
        </section>
        <aside ref={preview} tabIndex={-1} className="journey-preview" aria-label="Món quà đang chọn">
          <div className="journey-photo"><MotionImage src={assetUrl(product.isSignature&&step>=4?'/assets/optimized/gift-view-1.webp':`/assets/optimized/tea-${tea.id}-1280.webp`)} alt={(product.isSignature&&step>=4?product:tea).name} decoding="async"/><span className="journey-photo-label">{emotionName(draft.emotion)}<small>{step>=4?product.shortName:tea.shortName}</small></span></div>
          {step>=4?<><GiftCardPreview configuration={draft}/><p className="journey-note">Bản xem trước 2D · không phải mô phỏng sản phẩm vật lý.</p>{step===4&&<button type="button" className="atelier-text-link journey-mobile-preview-link" onClick={()=>document.getElementById('gift-message')?.focus()}>Tiếp tục viết lời nhắn</button>}</>:<div className="journey-preview-copy"><p>MỘT HƯƠNG TRÀ, MỘT ĐIỀU MUỐN GỬI</p><blockquote>{tea.storyQuote.replace(/^"|"$/g,'')}</blockquote><span>{money(tea.price)} · {tea.weight}</span></div>}
        </aside>
      </div>
    </div>
  </div>;
}

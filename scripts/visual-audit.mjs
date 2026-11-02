import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);
import fs from 'node:fs/promises';
const base=process.env.MNH_BASE_URL || 'http://127.0.0.1:5173';
const out=process.env.MNH_EVIDENCE_DIR || 'docs/evidence/current';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();
const results=[];
const frames=[
 ['56:1033','home'],['127:12938','search-default'],['127:13466','search-results'],['127:13960','search-empty'],
 ['77:2583','products'],['35:3068','buoi-an'],['120:2859','nhai-thuong'],['120:3302','soi-cam'],['120:3541','com-nho'],['120:6560','hop-qua-tam-y'],
 ['127:8439','cart'],['127:8870','cart-empty'],['33:2786','story'],['127:9562','contact'],['127:10079','contact-success'],
 ['77:3389','checkout'],['77:3506','order-success'],['127:11104','login'],['127:12445','activate'],['127:12046','register'],
 ['127:10877','forgot-email'],['127:11621','forgot-otp'],['127:11753','forgot-reset'],['127:11871','forgot-success']
];
async function openPage(p,state){
 const h=p.locator('header');
 if(state.startsWith('search')){
  await h.getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();
  if(state==='search-results')await p.getByPlaceholder(/Tìm kiếm/).fill('Trà hương Bưởi');
  if(state==='search-empty')await p.getByPlaceholder(/Tìm kiếm/).fill('asadasdnkasoln');
 }else if(['buoi-an','nhai-thuong','soi-cam','com-nho','hop-qua-tam-y'].includes(state)){
  const names={'buoi-an':'Trà Bưởi (AN) — Bình An','nhai-thuong':'Trà Nhài (THƯƠNG) — Yêu thương','soi-cam':'Trà Hoa Sói (CẢM) — Tri Ân','com-nho':'Trà Cốm (NHỚ) — Kỷ Niệm','hop-qua-tam-y':'Combo Hộp Quà “TÂM Ý”'};
  await p.locator('footer').getByRole('button',{name:names[state],exact:true}).click();
 }else if(state==='products')await h.getByRole('button',{name:'Sản phẩm',exact:true}).click();
 else if(state==='story')await h.getByRole('button',{name:'Về chúng tôi',exact:true}).click();
 else if(state.startsWith('contact')){
  await h.getByRole('button',{name:'Liên hệ',exact:true}).click();
  if(state==='contact-success'){
   const form=p.locator('main form');const inputs=form.locator('input');
   await inputs.nth(0).fill('Kiểm tra giao diện');await inputs.nth(1).fill('0900000000');await inputs.nth(2).fill('visual-test@example.invalid');await inputs.nth(3).fill('Kiểm tra nội bộ');await form.locator('textarea').fill('Dữ liệu kiểm tra giao diện cục bộ.');await form.getByRole('button',{name:'Gửi Yêu Cầu'}).click();
  }
 }else if(['cart','cart-empty','checkout','order-success','pickup'].includes(state)){
  if(state==='cart'||state==='cart-empty')await p.locator('footer').getByRole('button',{name:'Trà Bưởi (AN) — Bình An',exact:true}).click();
  await h.getByRole('button',{name:'Giỏ hàng',exact:true}).click();
  if(['checkout','order-success','pickup'].includes(state)){
   await p.locator('aside').getByRole('button',{name:/Thanh Toán/i}).click();
   if(state==='pickup')await p.getByRole('button',{name:/Đến lấy hàng/}).click();
   if(state==='order-success'){
    // Current checkout is a local mock, verified by source inspection. Block all external writes.
    await p.route('**/*',route=>route.request().method()==='GET'?route.continue():route.abort());
    const form=p.locator('main form');const fields=form.locator('input:not([type=checkbox]):not([type=radio])');await fields.nth(0).fill('Kiểm tra cục bộ');
    await fields.nth(1).fill('0900000000');await fields.nth(2).fill('visual-test@example.invalid');
    await fields.nth(3).fill('Địa chỉ kiểm tra cục bộ');await form.getByRole('button',{name:'Đặt Hàng',exact:true}).click();
   }
  }
 }else if(state==='login'||state==='login-filled'||state==='activate'||state==='register'||state.startsWith('forgot')){
  await h.getByRole('button',{name:'Tài khoản',exact:true}).click();
  if(state==='login-filled'){
   await p.locator('main input[type=email]').fill('visual-test@example.invalid');await p.locator('main input[type=password]').fill('visual-test-password');
  }else if(state==='activate')await p.getByRole('button',{name:'Kích hoạt (127:12445)',exact:true}).click();
  else if(state==='register')await p.getByRole('button',{name:'Đăng ký ngay',exact:true}).click();
  else if(state.startsWith('forgot')){
   const labels={'forgot-email':'Quên MK (127:10877)','forgot-otp':'Mã OTP (127:11621)','forgot-reset':'Tạo MK mới (127:11753)','forgot-success':'Hoàn tất (127:11871)'};
   await p.getByRole('button',{name:labels[state],exact:true}).click();
   if(state==='forgot-otp'){
    // Match the filled Figma input state for the screenshot only. Never submit or accept it as a real OTP.
    for(let index=0;index<4;index++)await p.locator(`#otp-input-${index}`).fill('1707'[index]);
   }
  }
 }
 const expected={'home':'.home-hero','products':'.products-page','story':'.story-page','contact':'.contact-page','contact-success':'[role=dialog]','checkout':'.checkout-page','order-success':'.order-confirmation','login':'.auth-login','activate':'.auth-activate','register':'.auth-register','forgot-email':'.auth-forgot-email','forgot-otp':'.auth-forgot-otp [role=dialog]','forgot-reset':'.auth-forgot-reset','forgot-success':'.auth-forgot-success [role=dialog]'};
 if(expected[state])await p.locator(expected[state]).waitFor({state:'visible'});
 const productWords={'buoi-an':'Bưởi','nhai-thuong':'Nhài','soi-cam':'Sói','com-nho':'Cốm','hop-qua-tam-y':'TÂM Ý'};
 if(productWords[state])await p.locator('main h1').filter({hasText:productWords[state]}).waitFor({state:'visible'});
 await p.mouse.move(p.viewportSize().width-1,1079);
 await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await p.addStyleTag({content:'.qa-state-switcher{display:none!important}*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}'});
 await p.evaluate(async()=>{
   await document.fonts.ready;
   await Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode();}catch{}}));
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
 });
 await p.waitForTimeout(100);
}
const widths=process.env.MNH_WIDTHS?process.env.MNH_WIDTHS.split(',').map(Number):[1920];
async function capture({width,id,state}){
  const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'reduce'});
  if(state==='cart-empty')await context.addInitScript(()=>localStorage.setItem('mnh_cart_items_v1','[]'));
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.goto(base+'/?figma-qa=1');
   // Open collapsed navigation when necessary; footer routes work independently.
   if(width<768 && !['home','buoi-an','nhai-thuong','soi-cam','com-nho','hop-qua-tam-y'].includes(state)){
    if(['products','story','contact','contact-success'].includes(state))await p.locator('header').getByRole('button',{name:'Menu',exact:true}).click();
   }
   await openPage(p,state);
   const measurements=await p.evaluate(()=>({height:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')),imageGeometry:[...document.images].map(i=>({src:i.getAttribute('src'),x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,objectFit:getComputedStyle(i).objectFit,figmaNode:i.getAttribute('data-figma-node')||i.closest('[data-figma-node]')?.getAttribute('data-figma-node')})),overflow:[...document.querySelectorAll('body *')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&(r.left < -1||r.right>innerWidth+1)&&!e.closest('[aria-hidden=true]')&&!(()=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const cs=getComputedStyle(a);if(['hidden','clip','auto','scroll'].includes(cs.overflowX))return true;}return false;})()}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,rect:{x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width}}))}));
   await p.screenshot({path:`${out}/${id.replace(':','-')}-${width}.png`,fullPage:!state.startsWith('search')&&!state.startsWith('cart')&&!['contact-success','forgot-success','forgot-otp'].includes(state)});
   results.push({id,state,width,...measurements,errors});console.log(id,state,width,measurements.height,errors.length);
  }catch(e){results.push({id,state,width,error:String(e),errors});console.log('FAIL',id,state,width,String(e).slice(0,250));}
  await context.close();
}
const jobs=widths.flatMap(width=>frames.filter(([id])=>!process.env.MNH_ONLY_IDS||process.env.MNH_ONLY_IDS.split(',').includes(id)).map(([id,state])=>({width,id,state})));
const workers=Array.from({length:Number(process.env.MNH_WORKERS||4)},async()=>{while(jobs.length){await capture(jobs.shift());}});
await Promise.all(workers);
await fs.writeFile(`${out}/results${process.env.MNH_ONLY_IDS ? '-subset' : ''}.json`,JSON.stringify(results,null,2));await browser.close();

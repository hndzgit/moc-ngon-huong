import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173';
const phase=process.env.MNH_CAPTURE_PHASE||'before';
const out=`docs/evidence/v7/${phase}-geometry`;
const widths=(process.env.MNH_WIDTHS||'360,375,390,430,768,1024,1280,1440,1536,1590,1599,1600,1601,1680,1920,2560').split(',').map(Number);
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const results=[];
try{for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function ready(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(async image=>{image.loading='eager';await image.decode().catch(()=>{})}));await new Promise(requestAnimationFrame)});}
 for(const [route,name,selector] of [['/','home','.home-hero'],['/san-pham','products','.products-page'],['/san-pham/buoi-an','detail','.product-detail-page'],['/cau-chuyen','story','.story-page'],['/lien-he','contact','.contact-page'],['/thanh-toan','checkout','.checkout-page'],['/tai-khoan','auth','.auth-page']]){
  await page.goto(base+'/?figma-qa=1#'+route);await page.locator(selector).waitFor();await ready();await page.mouse.move(0,0);
  const geometry=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,contentX:r.x+parseFloat(s.paddingLeft),contentWidth:r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],font:s.font,fontSize:s.fontSize,lineHeight:s.lineHeight,display:s.display,grid:s.gridTemplateColumns,gap:s.gap,objectFit:s.objectFit,objectPosition:s.objectPosition,transform:s.transform,...(e instanceof HTMLImageElement?{src:e.getAttribute('src'),natural:[e.naturalWidth,e.naturalHeight],fillDistortion:s.objectFit==='fill'?Math.abs((r.width/r.height)/(e.naturalWidth/e.naturalHeight)-1):0}:{})}};
   const selectors=['.site-header .header-main','.home-hero','.hero-photo','.home-hero h1','.home-hero p','.hero-cta','.hero-cta button','.home-emotion > .figma-container','.home-emotion .lg\\:grid-cols-12','.home-teas > .figma-container','.signature-box > .figma-container','.home-philosophy > .figma-container','.site-footer > .figma-container','.auth-layout','.contact-page form','.checkout-summary','.detail-story','.detail-leaf-left','.detail-leaf-right','.detail-mountain'];
   const boxes=Object.fromEntries(selectors.map(s=>[s,[...document.querySelectorAll(s)].map(rect)]));
   const cards=[...document.querySelectorAll('.product-card')].slice(0,6).map(e=>({card:rect(e),image:rect(e.querySelector('.relative')),body:rect(e.querySelector('.pt-3')),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}));
   const overflow=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||s.display==='none'||s.visibility==='hidden'||e.closest('[aria-hidden=true]')||r.left>=-1&&r.right<=innerWidth+1)return false;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement)if(['hidden','clip','auto','scroll'].includes(getComputedStyle(p).overflowX))return false;return true}).slice(0,20).map(e=>({tag:e.tagName,cls:e.className,rect:rect(e)}));
   return {height:document.documentElement.scrollHeight,rootOverflow:document.documentElement.scrollWidth>innerWidth,boxes,cards,overflow,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)};
  });
  if(process.env.MNH_GEOMETRY_ONLY!=='1')await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:name==='home'});results.push({width,name,route,...geometry,errors:[...errors]});console.log(phase,width,name,'overflow',geometry.overflow.length);
 }
 await context.close();
}await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));}finally{await browser.close()}

import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const playwright=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const engine=process.env.MNH_BROWSER||'chromium';
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173/';
const browser=await playwright[engine].launch();const results=[];
try{for(const width of [1920,390])for(const reducedMotion of ['no-preference','reduce']){
 const context=await browser.newContext({viewport:{width,height:1080},reducedMotion,hasTouch:width<768,isMobile:width<768});
 await context.addInitScript(()=>{
  const Native=window.IntersectionObserver;window.__motionObservers=new Set();
  window.IntersectionObserver=class extends Native{
   constructor(...args){super(...args);this.targets=new Set();window.__motionObservers.add(this)}
   observe(node){this.targets.add(node);super.observe(node)}
   unobserve(node){this.targets.delete(node);super.unobserve(node)}
   disconnect(){this.targets.clear();window.__motionObservers.delete(this);super.disconnect()}
  };
 });
 await context.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('response',response=>{if(response.status()>=400){const url=new URL(response.url());for(const key of [...url.searchParams.keys()])if(/key|token|secret/i.test(key))url.searchParams.set(key,'REDACTED');errors.push(`HTTP ${response.status()} ${url}`)}});
 const checks=[];const check=async(name,fn)=>{await fn();checks.push(name)};
 const settle=()=>page.waitForTimeout(reducedMotion==='reduce'?50:800);
 await page.goto(base+'?figma-qa=1');await page.bringToFront();await page.locator('.home-hero').waitFor();
 await page.waitForFunction(()=>{const style=getComputedStyle(document.querySelector('.home-hero h1'));return style.opacity==='1'&&style.transform==='none'},undefined,{timeout:10000});
 await settle();
 await check('Hero completes and media preference leaves no inline transform',async()=>{
  const s=await page.locator('.home-hero h1').evaluate(e=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform}));
  assert.equal(s.opacity,'1');assert.equal(s.transform,'none');
 });
 await check('Rapid cart reversals keep geometry, unlock scroll and restore focus',async()=>{
  const trigger=page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true});
  await trigger.focus();
  for(let i=0;i<5;i++){
   await trigger.click();await page.getByRole('dialog',{name:'Giỏ hàng'}).waitFor();
   await page.keyboard.press('Escape');
   if(reducedMotion==='no-preference')assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
   await trigger.click();await page.locator('.cart-drawer[data-motion-phase="open"]').waitFor();
   await page.getByRole('button',{name:'Đóng giỏ hàng',exact:true}).click();
   await page.locator('.cart-drawer').waitFor({state:'detached'});
  }
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
  assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  await trigger.click();await settle();const box=await page.locator('.cart-drawer aside').boundingBox();assert.equal(Math.round(box.width),Math.min(558,width));
  await page.getByRole('dialog',{name:'Giỏ hàng'}).getByRole('button',{name:'Tăng số lượng',exact:true}).first().click();
  await page.keyboard.press('Escape');await page.locator('.cart-drawer').waitFor({state:'detached'});
 });
 await check('Search accepts typing during entrance and navigates during exit',async()=>{
  await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();
  await page.getByPlaceholder('Tìm kiếm sản phẩm').fill('tra huong buoi');
  assert.equal(await page.locator('.search-card .product-card').count(),1);
  await page.locator('.search-card .product-card h3').click();await page.locator('.product-detail-page').waitFor();
  await page.locator('.search-overlay').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 });
 await check('Gallery last click wins; honest reviews section and quantity remain functional',async()=>{
  const thumbs=page.getByRole('button',{name:/Ảnh sản phẩm/});
  for(const i of [1,2,1,0,2])await thumbs.nth(i).click();
  const expected=await thumbs.nth(2).locator('img').getAttribute('src');
  await page.waitForFunction(src=>document.querySelector('.product-detail-page section img')?.getAttribute('src')===src,expected);
  assert.equal(await thumbs.nth(2).getAttribute('aria-pressed'),'true');
  await page.getByText('Chưa có đánh giá trực tuyến cho sản phẩm này').waitFor();
  await page.locator('main').getByRole('button',{name:'Tăng số lượng',exact:true}).first().click();
 });
 await page.goto(base+'?figma-qa=1#/');await settle();
 await check('All four flavors support rapid selection, keyboard and QR exit',async()=>{
  const cards=page.locator('.home-emotion .figma-container > .grid > button');
  for(const i of [1,2,3,0,2,1,3])await cards.nth(i).click();
  assert.equal(await cards.locator('[aria-pressed="true"]').count(),0);assert.equal(await page.locator('.home-emotion button[aria-pressed="true"]').count(),1);
  await cards.nth(0).focus();await page.keyboard.press('Enter');assert.equal(await cards.nth(0).getAttribute('aria-pressed'),'true');
  const photo=page.locator('.home-emotion .lg\\:col-span-6').last().locator('img').first();
  await page.waitForFunction(()=>document.querySelector('.home-emotion .lg\\:col-span-6:last-child img')?.getAttribute('src')?.includes('ae4e7.png'));
  await page.getByRole('button',{name:'Quét QR nghe Audio chuyện trà',exact:true}).click();await page.getByRole('dialog',{name:'Mã QR nghe chuyện trà'}).waitFor();
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Mã QR nghe chuyện trà'}).waitFor({state:'detached'});assert.ok(await photo.getAttribute('src'));
 });
 await check('Gift carousel has no autoplay; rapid controls settle on the last slide',async()=>{
  const section=page.locator('.signature-box').first();const initial=await section.locator('img').first().getAttribute('src');const dots=section.getByRole('button',{name:/^Slide /});const count=await dots.count();
  for(let i=0;i<count*2;i++)await section.getByRole('button',{name:'Ảnh tiếp',exact:true}).click();
  await page.waitForFunction(src=>document.querySelector('.signature-box img')?.getAttribute('src')===src,initial);
  assert.equal(await dots.nth(0).getAttribute('aria-current'),'true');await page.waitForTimeout(1000);assert.equal(await dots.nth(0).getAttribute('aria-current'),'true');
 });
 await check('Chat messages do not move page scroll or duplicate IDs',async()=>{
  await page.evaluate(()=>scrollTo(0,1500));const before=await page.evaluate(()=>scrollY);
  await page.getByRole('button',{name:'Mở tư vấn trực tuyến Mộc Ngôn Hương',exact:true}).click();
  const field=page.getByPlaceholder('Nhập lời nhắn của bạn...');
  for(let i=0;i<4;i++){await field.fill('nhài '+i);await field.press('Enter')}
  await settle();assert.equal(await page.locator('.chat-message').count(),9);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<=2);
  await page.keyboard.press('Escape');await page.locator('.chat-panel').waitFor({state:'detached'});
 });
 await check('Checkout tab transitions retain entered customer fields',async()=>{
  await page.goto(base+'?figma-qa=1#/thanh-toan');const name=page.locator('main input[type="text"]').first();await name.fill('QA dữ liệu cục bộ');
  for(let i=0;i<3;i++){await page.getByRole('button',{name:/Đến lấy hàng/}).click();await page.getByRole('button',{name:/Giao tận nơi/}).click()}
  assert.equal(await name.inputValue(),'QA dữ liệu cục bộ');assert.equal(await page.locator('main select').count(),3);
 });
 await check('Contact success modal remains QA-only and exits cleanly',async()=>{
  await page.goto(base+'?figma-qa=1#/lien-he');const inputs=page.locator('main form input');
  for(const [i,value] of ['QA nội bộ','0900000000','qa@example.invalid','Không gửi thật'].entries())await inputs.nth(i).fill(value);
  await page.locator('main textarea').fill('Kiểm tra animation cục bộ');await page.locator('main form button[type=submit]').click();
  await page.getByRole('dialog',{name:'Thông báo gửi yêu cầu'}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Thông báo gửi yêu cầu'}).waitFor({state:'detached'});
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 });
 await check('Auth rapid state changes preserve fields and release modal focus locks',async()=>{
  await page.goto(base+'?figma-qa=1#/tai-khoan');await page.locator('main input[type="email"]').fill('qa@example.invalid');
  const qa=page.locator('.qa-state-switcher');
  for(const node of ['127:12046','127:12445','127:10877','127:11621','127:11871','127:11104'])await qa.getByRole('button').filter({hasText:node}).click();
  await settle();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.locator('main input[type="email"]').inputValue(),'qa@example.invalid');assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 });
 await check('Rapid routing and resizing clean up observers and GSAP',async()=>{
  const routes=['/san-pham','/san-pham/buoi-an','/cau-chuyen','/lien-he','/'];
  const heap=[];const session=engine==='chromium'?await context.newCDPSession(page):null;if(session)await session.send('Performance.enable');
  for(let cycle=0;cycle<3;cycle++){
   for(const path of [...routes,...routes]){await page.evaluate(path=>{location.hash='#'+path},path);await page.waitForTimeout(25)}
   await settle();if(session){await session.send('HeapProfiler.collectGarbage');const metrics=await session.send('Performance.getMetrics');heap.push(metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value)}
  }
  await page.setViewportSize({width:width===1920?390:1920,height:1080});await settle();await page.setViewportSize({width,height:1080});await settle();
  const state=await page.evaluate(async()=>{const {getMotionDiagnostics}=await import('/src/motion/motion.ts');return {observers:window.__motionObservers.size,...getMotionDiagnostics(),ghosts:document.querySelectorAll('[data-motion-phase="closing"]').length,overflow:document.documentElement.scrollWidth>innerWidth,locked:document.body.style.overflow==='hidden'}});
  assert.equal(state.engineLoaded,reducedMotion==='no-preference');assert.ok(state.observers<=1);assert.equal(state.activeTweens,0);assert.equal(state.ghosts,0);assert.equal(state.locked,false);assert.equal(state.overflow,false);
  checks.push({cleanup:state,heapAfterCycles:heap});
 });
 await check('Changing reduced-motion preference during an overlay stays usable',async()=>{
  await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();await page.getByRole('dialog',{name:'Giỏ hàng'}).waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Escape');await page.locator('.cart-drawer').waitFor({state:'detached'});
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 });
 assert.deepEqual(errors,[]);results.push({browser:engine,width,reducedMotion,status:'PASS',checks,errors});console.log('PASS',engine,width,reducedMotion);await context.close();
}await fs.mkdir('docs/evidence/phase5',{recursive:true});await fs.writeFile(`docs/evidence/phase5/motion-smoke${engine==='chromium'?'':'-'+engine}.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}

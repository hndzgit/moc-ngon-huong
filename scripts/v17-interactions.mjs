import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const pw=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5190/';
const out=process.env.MNH_EVIDENCE||'docs/evidence/v17/interactions';await fs.mkdir(out,{recursive:true});const rows=[];
for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch();try{
 for(const width of [390,1920])for(const reducedMotion of ['reduce','no-preference']){
  const c=await browser.newContext({viewport:{width,height:844},hasTouch:width<768,reducedMotion}),p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await c.route('**/*',r=>['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  await p.goto(base+'#/san-pham');await p.locator('.products-page').waitFor();
  if(width<768){const size=await p.locator('.product-card button[aria-label="Tăng số lượng"]').first().boundingBox();assert.ok(size.width>=44&&size.height>=44);}
  await p.locator('.product-card>button').first().focus();await p.keyboard.press('Enter');await p.locator('.product-detail-page').waitFor();
  for(const n of [2,3,1,2,3])await p.getByRole('button',{name:`Ảnh sản phẩm ${n}`,exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('.product-detail-page img[fetchpriority=high]')?.getAttribute('src')?.includes('191e7'));
  assert.ok(await p.locator('.product-detail-page img[fetchpriority=high]').evaluate(i=>i.complete&&i.naturalWidth>0));
  const rect=await p.locator('.header-main').boundingBox();
  for(let i=0;i<3;i++){
   await p.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();await p.getByRole('dialog',{name:'Giỏ hàng'}).waitFor();
   const lockedRect=await p.locator('.header-main').boundingBox();assert.ok(Math.abs(lockedRect.width-rect.width)<1&&Math.abs(lockedRect.x-rect.x)<1,'scrollbar compensation');
   await p.keyboard.press('Escape');
   if(await p.locator('.cart-drawer[data-motion-phase=closing]').count()){
    assert.equal(await p.evaluate(()=>{const e=document.elementFromPoint(10,10);return Boolean(e?.closest('.cart-drawer'))}),true,'exit backdrop still blocks clicks');
   }
   await p.locator('.cart-drawer').waitFor({state:'detached'});assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden');
   assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Giỏ hàng');
  }
  await p.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();await p.getByPlaceholder('Tìm kiếm sản phẩm').fill('nhai');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>Boolean(document.activeElement?.closest('[role=dialog]'))),true);
  await p.keyboard.press('Escape');await p.locator('.search-overlay').waitFor({state:'detached'});assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden');
  await p.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();await p.emulateMedia({reducedMotion:'reduce'});await p.keyboard.press('Escape');await p.locator('.cart-drawer').waitFor({state:'detached'});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  rows.push({engine,width,reducedMotion,status:'PASS',checks:['touch44px','keyboard product navigation','last selected decoded gallery image','repeated overlays and scrollbar stability','no exit click-through','focus restoration and search trap','runtime reduced-motion change','no overflow/pageerrors']});await c.close();console.log(engine,width,reducedMotion,'PASS');
 }
}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(rows,null,2));}}

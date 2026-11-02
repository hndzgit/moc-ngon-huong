import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium,webkit}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173';
const checks=[];
const near=(actual,expected,tolerance=.8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} ≠ ${expected}`);
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{for(const width of [1920,390]){
  const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'reduce',isMobile:width<768,hasTouch:width<768});
  const page=await context.newPage();const errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>{if(['GET','HEAD'].includes(r.request().method()))return r.continue();writes.push(r.request().method());return r.abort();});
  const test=async(name,fn)=>{try{await fn();checks.push({engine,width,name,status:'PASS'});}catch(e){checks.push({engine,width,name,status:'FAIL',error:String(e)});}};
  const setContentWidth=async contentWidth=>{
   // Headless desktop WebKit reserves the custom 6px scrollbar. Match Figma's
   // content canvas rather than silently accepting a different content width.
   const gutter=await page.evaluate(()=>innerWidth-document.documentElement.clientWidth);
   await page.setViewportSize({width:contentWidth+gutter,height:1080});
  };
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  if(width===1920)await setContentWidth(1920);
  await test('Fresh storefront starts empty and empty-cart CTA remains usable',async()=>{
   assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1'))),[]);
   await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();
   const button=page.getByRole('button',{name:'Tiếp tục mua sắm',exact:true});const r=await button.boundingBox();
   assert.ok(r.width>250);assert.ok(r.height>=60&&r.height<90);
   await button.click();await page.locator('.products-page').waitFor();
  });
  await test('Saved cart quantities survive reload, invalid rows are isolated, catalogue prices retained',async()=>{
   await page.evaluate(()=>localStorage.setItem('mnh_cart_items_v1',JSON.stringify([null,{product:{id:'unknown'},quantity:1},{product:{id:'buoi-an',price:1},quantity:2},{product:{id:'com-nho-le'},quantity:1},{product:{id:'soi-cam'},quantity:-2}])));
   await page.reload();await page.waitForFunction(()=>{try{const r=JSON.parse(localStorage.getItem('mnh_cart_items_v1'));return r.length===2&&r[0].product.price===289000&&r[1].product.price===75000}catch{return false}});const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1')));
   assert.equal(saved.length,2);assert.equal(saved[0].quantity,2);assert.equal(saved[0].product.price,289000);assert.equal(saved[1].product.price,75000);
   await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();
   assert.match(await page.locator('aside').innerText(),/653,000/);await page.keyboard.press('Escape');
   await page.reload();assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1')))[0].quantity,2);
   await page.evaluate(()=>localStorage.setItem('mnh_cart_items_v1','{malformed'));await page.reload();await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('mnh_cart_items_v1')).length===0}catch{return false}});assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1'))),[]);
  });
  await test('Explicit local QA retains populated cart fixture',async()=>{
   await context.addInitScript(()=>{if(location.search.includes('figma-qa'))localStorage.removeItem('mnh_cart_items_v1')});await page.goto(base+'/?figma-qa=1');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mnh_cart_items_v1')||'[]').length===2);
   assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1'))).length,2);
  });
  await test('Hero crop is proportional, responsive derivative resolves, content remains accessible',async()=>{
   await page.locator('.hero-photo').evaluate(e=>e.decode());const photo=page.locator('.hero-photo');
   assert.equal(await photo.evaluate(e=>getComputedStyle(e).objectFit),'cover');
   assert.match(await photo.evaluate(e=>e.currentSrc),/assets\/optimized\/hero-\d+\.webp/);
   assert.equal(await page.locator('.hero-cta button').count(),2);
  });
  if(width===1920){
   await test('Hero hover paints match original Primary/White Button hover variants',async()=>{
    for(const selector of ['.hero-button-primary','.hero-button-secondary']){
     await page.locator(selector).hover();const color=await page.locator(selector).evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
     assert.equal(color.background,'rgb(197, 154, 88)');assert.equal(color.color,'rgb(255, 255, 255)');
    }
    await page.mouse.move(0,0);
   });
   await test('Gift carousel matches all four original dot variants and 40px arrow controls',async()=>{
    const gift=page.locator('.signature-box');try { await gift.scrollIntoViewIfNeeded();const photo=await gift.locator('img').first().locator('..').boundingBox();
    const left=await gift.getByRole('button',{name:'Ảnh trước',exact:true}).boundingBox();
    near(photo.width,789);near(photo.height,526);near(left.x,photo.x+16);near(left.y,photo.y+253);near(left.width,40);near(left.height,40);
    for(let selected=0;selected<4;selected++){
     await gift.getByRole('button',{name:`Slide ${selected+1}`,exact:true}).click();
     const sourceFile=['combo-slide-1.png','gift-96-3129.jpg','gift-96-3091.jpg','gift-96-3111.jpg'][selected];
     await page.waitForFunction(file=>{const image=document.querySelector('.signature-box img');return image.getAttribute('src').endsWith(file)&&image.currentSrc.endsWith(file)&&image.complete&&image.naturalWidth===4096},sourceFile);await gift.locator('img').first().evaluate(async image=>{await image.decode().catch(()=>{});await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
     const dots=gift.locator('.signature-dots button');assert.equal(await dots.count(),4);
     for(let index=0;index<4;index++){const dot=dots.nth(index),r=await dot.boundingBox();near(r.width,12);near(r.height,12);near(r.x,photo.x+358.5+index*20);near(r.y,photo.y+550);assert.equal(await dot.evaluate(e=>getComputedStyle(e).backgroundColor),index===selected?'rgb(142, 103, 70)':'rgb(255, 255, 255)');}
    }
    await gift.screenshot({path:`docs/evidence/v7/gift-variants-${engine}-${width}.png`});
    await gift.getByRole('button',{name:'Slide 1',exact:true}).click(); } finally { await page.evaluate(()=>scrollTo({top:0,behavior:'instant'})); }
   });
   await test('1920px Hero resting coordinates match live Figma layers',async()=>{
    const title=await page.locator('.home-hero h1').boundingBox(),copy=await page.locator('.home-hero p').boundingBox(),cta=await page.locator('.hero-cta').boundingBox(),mask=await page.locator('.hero-photo-mask').boundingBox();
    near(title.x,120);near(title.y,433);near(title.width,819);near(title.height,108);
    near(copy.y,573);near(copy.height,117);near(cta.y,730);near(cta.height,68);near(mask.y,164);near(mask.height,918);
   });
   await test('1599/1600/1601 resize has continuous Hero and shared gutters',async()=>{
    const rows=[];for(const w of [1599,1600,1601]){await setContentWidth(w);rows.push({hero:await page.locator('.home-hero').boundingBox(),header:await page.locator('.header-main').boundingBox()});}
    for(let i=1;i<rows.length;i++){assert.ok(Math.abs(rows[i].hero.height-rows[i-1].hero.height)<.5);assert.ok(Math.abs(rows[i].header.x-rows[i-1].header.x)<.2);}
    await setContentWidth(1920);
   });
   await test('Contact hotline and form share the original 1394px grid',async()=>{
    await page.goto(base+'/#/lien-he');const form=await page.locator('.contact-page form').boundingBox();const hotline=await page.locator('.contact-page .contact-info > div').first().boundingBox();
    near(form.x,263);near(form.width,1394);near(hotline.x,form.x);
   });
   await test('Original botanical geometry and story mask match AN frame',async()=>{
    await page.goto(base+'/#/san-pham/buoi-an');const story=await page.locator('.detail-story').boundingBox();near(story.y,1066);near(story.height,707);
    const leaf=await page.locator('.detail-leaf-left').boundingBox(),mountain=await page.locator('.detail-mountain').boundingBox();near(leaf.x,-311);near(leaf.y,1087);near(mountain.x,1460);near(mountain.y,1413);
    assert.ok(mountain.y+mountain.height>story.y+story.height);assert.equal(await page.locator('.detail-story').evaluate(e=>getComputedStyle(e).overflow),'visible');
   });
  }
  await test('OTP QA controls fit without treating sample digits as real authentication',async()=>{
   await page.goto(base+'/?figma-qa=1#/tai-khoan');await page.getByRole('button',{name:'Mã OTP (127:11621)',exact:true}).click();
   const inputs=page.locator('.auth-otp-modal input');assert.equal(await inputs.count(),4);
   for(let i=0;i<4;i++){const r=await inputs.nth(i).boundingBox();near(r.width,r.height);if(width===1920)near(r.width,86);}
   if(width===1920){const form=await page.locator('.auth-otp-modal form').boundingBox(),button=await page.locator('.auth-otp-modal button[type=submit]').boundingBox();near(form.width,392);near(button.width,380);}
   for(let i=0;i<4;i++)await inputs.nth(i).fill('1707'[i]);await page.getByRole('button',{name:'Xác Nhận',exact:true}).click();assert.equal(await page.locator('.auth-forgot-otp').count(),1);assert.equal(await page.locator('.auth-forgot-reset').count(),0);
  });
  await test('No runtime crashes, accidental overflow or external writes',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);});
  await context.close();
 }
 }finally{await browser.close();}
}
const output={checks,passed:checks.filter(x=>x.status==='PASS').length,failed:checks.filter(x=>x.status==='FAIL').length};
await fs.writeFile('docs/evidence/v7/regression.json',JSON.stringify(output,null,2));console.log(output);if(output.failed)process.exitCode=1;

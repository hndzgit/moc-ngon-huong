import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=(process.env.MNH_PAGES_URL || 'http://127.0.0.1:4175/moc-ngon-huong/').replace(/\/?$/,'/');
const site=new URL(base),prefix=site.pathname+'assets/';
const out=process.env.MNH_PAGES_EVIDENCE || 'docs/evidence/github-pages';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const results=[];
try {
 for(const width of [1920,390,360]){
  const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'reduce',hasTouch:width<768,isMobile:width<768});
  const page=await context.newPage();const errors=[],consoleErrors=[],badResponses=[],blockedWrites=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('response',r=>{if(new URL(r.url()).origin===site.origin&&r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
  await context.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method())){blockedWrites.push(r.request().method());return r.abort();}return r.continue();});
  async function ready(name){
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
   const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({url:i.currentSrc||i.src,broken:!i.naturalWidth}))}));
   assert.equal(info.overflow,false,name+' overflow');assert.deepEqual(info.images.filter(i=>i.broken),[],name+' broken images');
   for(const image of info.images){const u=new URL(image.url);if(u.origin===site.origin)assert.ok(u.pathname.startsWith(prefix),name+' unrebased image '+u.pathname);}
   await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:false});
  }
  await page.goto(base);await page.locator('.home-hero').waitFor();await ready('home');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mnh_cart_items_v1'))),[],'fresh production cart');
  await page.goto(base+'#/san-pham');await page.locator('.products-page').waitFor();await ready('products');
  await page.locator('.products-page .product-card h3').first().click();await page.locator('.product-detail-page').waitFor();
  assert.match(page.url(),/#\/san-pham\/buoi-an$/);await page.reload();await page.locator('.product-detail-page').waitFor();await ready('detail-refresh');
  await page.goBack();await page.locator('.products-page').waitFor();await page.goForward();await page.locator('.product-detail-page').waitFor();
  await page.locator('main').getByRole('button',{name:'Thêm Vào Giỏ Hàng',exact:true}).click();
  const cart=page.getByRole('dialog',{name:'Giỏ hàng'});await cart.waitFor();await ready('cart');
  await cart.getByRole('button',{name:'Tăng số lượng',exact:true}).first().click();
  const quantities=await page.evaluate(()=>JSON.parse(localStorage.getItem('mnh_cart_items_v1')).map(i=>i.quantity));
  await page.getByRole('button',{name:'Đóng giỏ hàng',exact:true}).click();await page.reload();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mnh_cart_items_v1')).map(i=>i.quantity)),quantities);
  await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();await ready('search');
  await page.getByPlaceholder('Tìm kiếm sản phẩm').fill('tra huong buoi');
  assert.equal(await page.locator('.search-card .product-card').count(),1);await ready('search-results');
  await page.locator('.search-card .product-card h3').click();await page.locator('.search-overlay').waitFor({state:'hidden'});
  for(const [path,selector,name] of [['/cau-chuyen','.story-page','story'],['/lien-he','.contact-page','contact'],['/tai-khoan','.auth-login','login'],['/thanh-toan','.checkout-page','checkout']]){
   await page.goto(base+'#'+path);await page.locator(selector).waitFor();await ready(name);
   if(name==='contact'){
    await page.getByPlaceholder('Nhập họ và tên của bạn').fill('QA không gửi dữ liệu');
    await page.getByPlaceholder('Nhập số điện thoại liên hệ').fill('0900000000');
    await page.getByPlaceholder('Nhập địa chỉ email của bạn').fill('qa@example.invalid');
    await page.getByPlaceholder('Bạn cần tư vấn về vấn đề gì?').fill('Kiểm tra cục bộ');
    await page.locator('main textarea').fill('Không gửi tới khách hàng hoặc backend');
    await page.locator('main form button[type="submit"]').click();
    assert.match(await page.locator('main').innerText(),/Gửi liên hệ trực tuyến hiện chưa khả dụng/);
    assert.equal(await page.locator('.contact-success').count(),0);
    assert.equal(await page.getByPlaceholder('Nhập họ và tên của bạn').inputValue(),'QA không gửi dữ liệu');
   }
   if(name==='checkout'){
    await page.getByRole('button',{name:/Đến lấy hàng/}).click();assert.equal(await page.locator('main select').count(),1);
    await page.getByRole('button',{name:/Giao tận nơi/}).click();assert.equal(await page.locator('main select').count(),3);
    await page.locator('main form').getByRole('button',{name:'Đặt Hàng',exact:true}).click();assert.match(await page.locator('main').innerText(),/Vui lòng điền đầy đủ/);
    await page.locator('main input[type="text"]').first().fill('QA không tạo đơn');
    await page.locator('main input[type="tel"]').fill('0900000000');
    await page.locator('main input[type="email"]').fill('qa@example.invalid');
    await page.getByRole('button',{name:/Đến lấy hàng/}).click();
    const storedCart=await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1'));
    await page.locator('main form').getByRole('button',{name:'Đặt Hàng',exact:true}).click();
    assert.match(await page.locator('main').innerText(),/Đặt hàng trực tuyến hiện chưa khả dụng/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1')),storedCart);
   }
  }
  await page.locator('footer input[type="email"]').fill('qa@example.invalid');
  await page.locator('footer form button[type="submit"]').click();
  assert.match(await page.locator('footer').innerText(),/Đăng ký nhận tin trực tuyến hiện chưa khả dụng/);
  await page.goto(base+'#/san-pham/not-a-product');assert.match(await page.locator('main h1').innerText(),/Không tìm thấy/);
  assert.equal(errors.length,0);assert.equal(badResponses.length,0);assert.equal(consoleErrors.length,0);assert.equal(blockedWrites.length,0);
  results.push({width,status:'PASS',hashRoutesAndRefresh:'PASS',backForward:'PASS',cartPersistence:'PASS',assets:'PASS',errors,consoleErrors,badResponses,blockedWrites});
  await context.close();
 }
 const files=(await Promise.all(['public/assets/figma','public/assets/optimized'].map(root=>fs.readdir(root,{recursive:true,withFileTypes:true})))).flat().filter(e=>e.isFile());const assetResponses=[];
 for(let i=0;i<files.length;i+=4)await Promise.all(files.slice(i,i+4).map(async e=>{const relative=(e.parentPath||e.path).replace('public/','')+'/'+e.name;const r=await fetch(new URL(relative,base),{method:'HEAD'});assetResponses.push({path:relative,status:r.status,bytes:Number(r.headers.get('content-length'))});}));
 assert.ok(assetResponses.every(r=>r.status===200&&r.bytes>0));
 await fs.writeFile(`${out}/results.json`,JSON.stringify({base,results,assetResponses,realOrdersSubmitted:false},null,2));console.log({base,viewports:results.length,assetChecks:assetResponses.length,status:'PASS'});
} finally {await browser.close();}

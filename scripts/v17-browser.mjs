import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const playwright=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5190/';
const fixture=process.env.MNH_FIXTURE_URL||'http://127.0.0.1:5191/';
const engine=process.env.MNH_BROWSER||'chromium',browser=await playwright[engine].launch();
const widths=JSON.parse(process.env.MNH_WIDTHS||'[320,360,375,390,430,768,1024,1280,1440,1920]');
const out=process.env.MNH_EVIDENCE||'docs/evidence/v17/browser';await fs.mkdir(out,{recursive:true});
const order={id:'v17-qa-order',orderCode:'MNH-QA-0001',customerUid:'v17_fixture_only',userId:'v17_fixture_only',customer:{fullName:'Nguyễn Trà QA',phone:'0900000000',email:'qa-v17@example.invalid',address:'Địa chỉ QA trong môi trường cô lập',shippingMode:'delivery'},items:[{productId:'buoi-an',productName:'Trà Hương Bưởi – AN',price:289000,quantity:1}],subtotal:289000,shippingFee:0,discount:0,total:289000,paymentMethod:'cod',paymentStatus:'pending',orderStatus:'preparing',createdAt:'2026-11-03T00:00:00.000Z'};
const rows=[];
try{for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:process.env.MNH_MOTION||'reduce',hasTouch:width<768});
 await context.addInitScript(()=>localStorage.setItem('mnh_cart_items_v1',JSON.stringify([{product:{id:'buoi-an'},quantity:1}])));
 const page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{
  const request=r.request(),url=new URL(request.url());
  if(url.pathname.startsWith('/api/')&&url.origin===new URL(fixture).origin){
   if(request.method()==='POST'&&url.pathname==='/api/orders')return r.fulfill({json:{success:true,order,duplicate:false},status:201});
   if(request.method()==='GET')return r.fulfill({json:{success:true,orders:[order],order,total:1}});
  }
  if(!['GET','HEAD'].includes(request.method())){writes.push(url.origin+url.pathname);return r.abort();}
  return r.continue();
 });
 async function inspect(name,shot=true){
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
  const bounds=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&r.bottom>0&&i.complete&&!i.naturalWidth}).map(i=>i.getAttribute('src'))}));
  assert.equal(bounds.overflow,false,`${name}/${width} page overflow`);assert.deepEqual(bounds.broken,[],`${name} broken images`);
  if(shot&&[320,390,1024,1920].includes(width))await page.screenshot({path:`${out}/${name}-${engine}-${width}.png`,fullPage:true});
  rows.push({name,width,engine,status:'PASS',...bounds});
 }
 for(const [name,route,selector]of [['home','/','.home-hero'],['story','/cau-chuyen','.story-page'],['products','/san-pham','.products-page'],['detail','/san-pham/buoi-an','.product-detail-page'],['gift','/chon-qua','.gift-journey'],['checkout','/thanh-toan','.checkout-page'],['login','/tai-khoan','.auth-login'],['admin-guard','/admin','main']]){
  await page.goto(base+'#'+route);await page.locator(selector).waitFor();await inspect(name);
  if(name==='products'){
   const open=page.locator('.product-card>button').first();await open.focus();await page.keyboard.press('Enter');await page.locator('.product-detail-page').waitFor();
   await page.goBack();await page.locator('.products-page').waitFor();await page.goForward();await page.locator('.product-detail-page').waitFor();
  }
  if(name==='detail'){
   for(const n of [2,3,1,3])await page.getByRole('button',{name:`Ảnh sản phẩm ${n}`,exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('.product-detail-page img[aria-busy=true]')===null);await inspect('gallery-rapid');
  }
  if(name==='gift'){
   await page.getByRole('button',{name:/Lời chúc bình an/}).click();
   for(let n=0;n<3;n++)await page.locator('.journey-bottom').getByRole('button',{name:'Tiếp tục',exact:true}).click();
   await page.getByLabel('Người nhận').fill('Người nhận QA');await page.getByLabel('Lời muốn gửi',{exact:false}).fill('Một lời bình an từ bộ kiểm thử.');
   await page.locator('.journey-bottom').getByRole('button',{name:'Tiếp tục',exact:true}).click();
   assert.match(await page.locator('.gift-card-preview').innerText(),/Người nhận QA/);await inspect('gift-summary');
   await page.getByRole('button',{name:'Thêm món quà vào giỏ',exact:false}).click();await page.getByRole('dialog',{name:'Giỏ hàng'}).waitFor();await page.keyboard.press('Escape');await page.locator('.cart-drawer').waitFor({state:'detached'});
  }
  if(name==='checkout'){
   await page.getByRole('button',{name:'Xác Nhận Đặt Hàng',exact:true}).click();await page.getByRole('alert').waitFor();
   await page.getByLabel('Họ và Tên',{exact:false}).fill('Nguyễn Trà QA');await page.getByRole('button',{name:/Đến lấy tại tiệm/}).click();await page.getByRole('button',{name:/Chuyển khoản ngân hàng/}).click();
   await page.getByRole('button',{name:/Giao tận nơi/}).click();assert.equal(await page.getByLabel('Họ và Tên',{exact:false}).inputValue(),'Nguyễn Trà QA');await inspect('checkout-options');
  }
 }
 await page.goto(base+'#/tai-khoan');await page.getByRole('button',{name:'Đăng ký ngay',exact:true}).click();await inspect('registration');
 await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();const cart=page.getByRole('dialog',{name:'Giỏ hàng'});await cart.waitFor();await inspect('cart');
 await cart.getByRole('button',{name:'Tăng số lượng',exact:true}).click();await page.keyboard.press('Escape');await page.locator('.cart-drawer').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();await page.getByPlaceholder('Tìm kiếm sản phẩm').fill('tra huong buoi');await inspect('search');await page.keyboard.press('Escape');
 if(process.env.MNH_SKIP_FIXTURES!=='1'){
  await page.goto(fixture+'#/tai-khoan');await page.locator('.profile-view').waitFor();await page.getByText('MNH-QA-0001',{exact:true}).filter({visible:true}).first().waitFor();await inspect('order-history');await page.getByRole('button',{name:'Xem chi tiết',exact:true}).first().click();await page.getByRole('dialog',{name:'Chi tiết đơn hàng',exact:true}).waitFor();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement?.closest('[role=dialog]'))),true);await inspect('customer-dialog');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Thông tin giao nhận',exact:true}).click();await inspect('profile');
  await page.goto(fixture+'#/admin');await page.locator('.admin-page').waitFor();await page.getByText('MNH-QA-0001',{exact:true}).filter({visible:true}).first().waitFor();await inspect('admin');
  await page.getByText('MNH-QA-0001',{exact:true}).filter({visible:true}).first().click();await page.getByRole('dialog',{name:'Chi tiết đơn hàng',exact:true}).waitFor();await inspect('admin-dialog');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await page.goto(fixture+'#/thanh-toan');await page.getByLabel('Họ và Tên',{exact:false}).fill('Nguyễn Trà QA');await page.getByLabel('Số Điện Thoại',{exact:false}).fill('0900000000');await page.getByLabel('Địa chỉ Email',{exact:false}).fill('qa-v17@example.invalid');await page.getByLabel('Địa chỉ nhận hàng chi tiết',{exact:false}).fill('Địa chỉ QA trong môi trường cô lập');
  await page.getByRole('button',{name:'Xác Nhận Đặt Hàng',exact:true}).click();await page.getByText('MNH-QA-0001',{exact:true}).filter({visible:true}).first().waitFor();await inspect('order-confirmation');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);await context.close();console.log(engine,width,'PASS');
}}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(rows,null,2));}

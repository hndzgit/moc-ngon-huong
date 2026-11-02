import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
await context.addInitScript(()=>{localStorage.setItem('mnh_cart_items_v1','[]');localStorage.removeItem('mnh_user_email_v1');});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
const check=async(name,fn)=>{try{await fn();checks.push({name,status:'VERIFIED_WORKING'});console.log('PASS',name);}catch(e){checks.push({name,status:'BROKEN',error:String(e)});console.log('FAIL',name,String(e).slice(0,300));}};
await page.goto('http://127.0.0.1:5173/?figma-qa=1');
await check('Emotion selection and original artwork',async()=>{
 await page.locator('.home-emotion').getByRole('button').filter({hasText:'Dịu Ngọt & Yêu thương'}).click();
 assert.equal(await page.locator('.home-emotion button[aria-pressed=true]').count(),1);
 assert.match(await page.locator('.home-emotion h3.text-\\[26px\\]').innerText(),/Trà Hương Nhài/);
});
await check('QR dialog opens and Escape closes with scroll restored',async()=>{
 await page.getByRole('button',{name:'Quét QR nghe Audio chuyện trà',exact:true}).click();
 assert.equal(await page.getByRole('dialog',{name:'Mã QR nghe chuyện trà'}).count(),1);
 assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog',{name:'Mã QR nghe chuyện trà'}).count(),0);
 assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
});
await check('Add to cart and quantity persistence',async()=>{
 await page.locator('.home-emotion').getByRole('button',{name:'Thêm Vào Giỏ Hàng',exact:true}).click();
 const cart=page.getByRole('dialog',{name:'Giỏ hàng'});await cart.getByRole('button',{name:'Tăng số lượng',exact:true}).click();
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('mnh_cart_items_v1')));
 assert.equal(data.length,1);assert.equal(data[0].product.id,'nhai-thuong');assert.equal(data[0].quantity,2);
 assert.match(await cart.innerText(),/578,000đ/);
 await page.keyboard.press('Escape');
});
await check('Vietnamese search, result routing and empty state',async()=>{
 await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();
 const field=page.getByPlaceholder('Tìm kiếm sản phẩm');await field.fill('tra huong buoi');
 assert.equal(await page.locator('.search-card .product-card').count(),1);
 await field.fill('tra da huong');
 assert.equal(await page.locator('.search-card .product-card').count(),1);
 assert.match(await page.locator('.search-card .product-card h3').innerText(),/Tâm Ý/);
 await field.fill('zzzzzzzz');assert.match(await page.locator('.search-card').innerText(),/Không tìm thấy/);
 assert.equal(await page.locator('.search-card .product-card').count(),0);
 await field.fill('tra huong buoi');await page.locator('.search-card .product-card h3').click();
 assert.match(await page.locator('main h1').innerText(),/Bưởi/);
});
await check('Review media filter changes the visible local review list',async()=>{
 const reviews=page.locator('.product-detail-page > section:nth-child(4) .divide-y > div');
 assert.equal(await reviews.count(),2);
 const filter=page.getByRole('button',{name:'Có hình ảnh / video',exact:true});
 await filter.click();assert.equal(await filter.getAttribute('aria-pressed'),'true');assert.equal(await reviews.count(),1);
 await filter.click();assert.equal(await reviews.count(),2);
});
await check('Buy now reaches checkout without leaving cart drawer open',async()=>{
 await page.locator('main').getByRole('button',{name:'Mua Ngay',exact:true}).click();
 assert.equal(await page.locator('.cart-drawer').count(),0);assert.match(await page.locator('main h1').innerText(),/Đặt Hàng/);
});
await check('Cart selection controls checkout items',async()=>{
 await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();const cart=page.getByRole('dialog',{name:'Giỏ hàng'});
 await cart.locator('input[type=checkbox]').nth(0).uncheck();await cart.getByRole('button',{name:/Thanh Toán/i}).click();
 assert.equal(await page.locator('.checkout-page .divide-y > div').count(),1);
 assert.match(await page.locator('.checkout-page .divide-y').innerText(),/Bưởi/);
});
await check('Checkout delivery and pickup tabs retain interaction',async()=>{
 await page.getByRole('button',{name:/Đến lấy hàng/}).click();assert.equal(await page.locator('select').count(),1);
 await page.getByRole('button',{name:/Giao tận nơi/}).click();assert.equal(await page.locator('select').count(),3);
 await page.locator('main form').getByRole('button',{name:'Đặt Hàng',exact:true}).click();assert.match(await page.locator('main').innerText(),/Vui lòng điền đầy đủ/);
});
await check('Auth fails closed without configured Firebase',async()=>{
 await page.locator('header').getByRole('button',{name:'Tài khoản',exact:true}).click();
 await page.locator('main input[type=email]').fill('invalid-test@example.invalid');await page.locator('main input[type=password]').fill('invalid-password');
 await page.locator('main form').getByRole('button',{name:'Đăng Nhập',exact:true}).click();
 assert.equal(await page.locator('.auth-login').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('mnh_user_email_v1')),null);
 assert.match(await page.locator('main').innerText(),/chưa khả dụng|Không thể đăng nhập/);
});
await check('Arbitrary four digits never authenticate or reset password',async()=>{
 await page.getByRole('button',{name:'Mã OTP (127:11621)',exact:true}).click();
 for(let i=0;i<4;i++)await page.locator(`#otp-input-${i}`).fill(String(i+1));
 await page.getByRole('dialog').getByRole('button',{name:'Xác Nhận',exact:true}).click();
 assert.equal(await page.locator('.auth-forgot-otp').count(),1);assert.match(await page.getByRole('dialog').innerText(),/Chưa thể xác thực/);
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
});
await check('Contact validation and local confirmation modal',async()=>{
 await page.locator('header').getByRole('button',{name:'Liên hệ',exact:true}).click();const form=page.locator('main form');
 await form.getByRole('button',{name:'Gửi Yêu Cầu'}).click();assert.match(await page.locator('main').innerText(),/Vui lòng điền đầy đủ/);
 const f=form.locator('input');await f.nth(0).fill('Kiểm tra');await f.nth(1).fill('0900000000');await f.nth(2).fill('test@example.invalid');await f.nth(3).fill('Kiểm tra nội bộ');await form.locator('textarea').fill('Kiểm tra UI cục bộ.');
 await form.getByRole('button',{name:'Gửi Yêu Cầu'}).click();assert.equal(await page.getByRole('dialog',{name:'Thông báo gửi yêu cầu'}).count(),1);
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
});
await check('Chat remains interactive (local rules, not an AI backend)',async()=>{
 await page.getByRole('button',{name:'Mở tư vấn trực tuyến Mộc Ngôn Hương'}).click();await page.getByPlaceholder('Nhập lời nhắn của bạn...').fill('Trà nhài');
 await page.getByRole('button',{name:'Gửi tin nhắn',exact:true}).click();assert.match(await page.locator('.chat-panel').innerText(),/Trà Nhài – THƯƠNG/);await page.getByRole('button',{name:'Đóng khung chat'}).click();
});
assert.equal(errors.length,0);await fs.writeFile('docs/evidence/functional-smoke.json',JSON.stringify({checks,pageErrors:errors,externalWrites:'No real purchases, user accounts or customer records created. Checkout confirmation is a local mock; no valid order submitted in this smoke suite.'},null,2));
await browser.close();if(checks.some(c=>c.status==='BROKEN'))process.exitCode=1;

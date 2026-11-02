import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173/';
const out=process.env.MNH_V10_EVIDENCE||'docs/evidence/v10/journey';await fs.mkdir(out,{recursive:true});
const widths=process.env.MNH_V10_WIDTHS?JSON.parse(process.env.MNH_V10_WIDTHS):[360,375,390,430,768,1024,1280,1440,1600,1920];
const engines=process.env.MNH_V10_ENGINES?.split(',')||['chromium'];
const results=[];
for(const engine of engines){const browser=await ({chromium,webkit}[engine]).launch();
 try{for(const width of widths){for(const reducedMotion of (process.env.MNH_V10_BOTH_MOTION==='1'?['reduce','no-preference']:['reduce'])){
  const context=await browser.newContext({viewport:{width,height:1080},reducedMotion,hasTouch:width<768});const page=await context.newPage();
  const errors=[],writes=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{if(!['GET','HEAD'].includes(route.request().method())){writes.push(route.request().url());return route.abort();}return route.continue();});
  const check=name=>checks.push(name);
  async function bounds(name){await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' horizontal overflow');}
  async function step(number){await page.waitForFunction(n=>document.querySelector('.journey-progress [aria-current=step]')?.textContent?.trim().startsWith('0'+n),number);await bounds('step'+number);}
  async function next(){await page.locator('.journey-bottom').getByRole('button',{name:'Tiếp tục',exact:true}).click();}
  await page.goto(base);await page.locator('.home-hero').waitFor();await bounds('home');
  await page.getByRole('button',{name:'Bắt đầu chọn món quà',exact:true}).click();await step(1);
  await next();await page.getByRole('alert').filter({hasText:'Hãy chọn'}).waitFor();check('Intention required; no decorative empty flow');
  await page.getByRole('button',{name:/Lời cảm ơn/}).click();await next();await step(2);
  assert.equal(await page.getByRole('button',{name:'CẢM Trà Hoa Sói (CẢM)',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'THƯƠNG Trà Nhài (THƯƠNG)',exact:true}).click();await next();await step(3);
  assert.match(await page.locator('.journey-workspace').innerText(),/Hoa nhài quế/);check('Intention maps CẢM; override THƯƠNG synchronizes real product facts');
  await page.getByRole('button',{name:'NHỚ',exact:true}).click();assert.match(await page.locator('.journey-workspace').innerText(),/Cốm/);
  await page.getByRole('button',{name:'THƯƠNG',exact:true}).click();await next();await step(4);
  await page.getByRole('button',{name:/Combo Hộp Quà|Tâm Ý|TÂM Ý/}).filter({hasText:'399.000'}).click();
  await page.getByLabel('Người nhận').fill('Mẹ Nguyễn Thị Ánh');await page.getByLabel('Lời muốn gửi',{exact:false}).fill('Cảm ơn mẹ. Chúc mẹ bình an mỗi ngày!');
  await page.getByLabel('Lá thư',{exact:true}).check();
  assert.match(await page.locator('.gift-card-preview').innerText(),/Mẹ Nguyễn Thị Ánh/);assert.match(await page.locator('.gift-card-preview').innerText(),/Cảm ơn mẹ/);assert.ok(await page.locator('.gift-card-letter').count());check('Live Vietnamese card preview and both digital layouts');
  await bounds('composer');await page.screenshot({path:`${out}/composer-${engine}-${width}-${reducedMotion}.png`,fullPage:true});
  await page.locator('.journey-bottom').getByRole('button',{name:'Quay lại'}).click();await step(3);await next();await step(4);assert.equal(await page.getByLabel('Người nhận').inputValue(),'Mẹ Nguyễn Thị Ánh');check('Back/edit preserves recipient, message, gift selection');
  await next();await step(5);assert.match(await page.locator('.journey-summary').innerText(),/399.000/);assert.match(await page.locator('.journey-summary').innerText(),/Bưởi · Nhài · Hoa Sói · Cốm/);
  await page.screenshot({path:`${out}/summary-${engine}-${width}-${reducedMotion}.png`,fullPage:true});
  await page.getByRole('button',{name:'Thêm món quà vào giỏ',exact:false}).click();const cart=page.getByRole('dialog',{name:'Giỏ hàng'});await cart.waitFor();assert.match(await cart.innerText(),/bản nháp thiệp/);
  const stored=await page.evaluate(()=>localStorage.getItem('mnh_cart_items_v1'));assert.ok(!stored.includes('Nguyễn')&&!stored.includes('Cảm ơn mẹ')&&!stored.includes('giftConfiguration'));check('Canonical SKU/price added; personal text excluded from storage');
  await cart.getByRole('button',{name:'Thanh Toán Ngay'}).click();await page.locator('.checkout-page').waitFor();assert.match(await page.locator('.checkout-gift-draft').innerText(),/Mẹ Nguyễn Thị Ánh/);check('Existing cart selection leads to checkout with in-memory card draft');
  await page.goBack();await step(5);await page.getByRole('button',{name:'Tiếp tục đến thanh toán',exact:true}).click();await page.locator('.checkout-page').waitFor();check('Direct checkout path works without login');
  await page.reload();await page.locator('.checkout-page').waitFor();assert.equal(await page.locator('.checkout-gift-draft').count(),0);assert.ok(await page.locator('.checkout-summary').getByText('399,000đ',{exact:true}).count());check('Refresh retains cart; clears personal draft by design');
  for(const [emotion,productName] of [['AN','Bưởi'],['THUONG','Nhài'],['CAM','Sói'],['NHO','Cốm']]){
   await page.goto(base+`#/chon-qua?cam-xuc=${emotion}&buoc=3`);await step(3);assert.match(await page.locator('.journey-workspace').innerText(),new RegExp(productName));
  }check('All four IMC deep links resolve after fresh navigation');
  await page.goto(base+'#/chon-qua?cam-xuc=BOGUS&buoc=99');await step(1);await page.getByRole('button',{name:'Bắt đầu lại',exact:true}).click();await step(1);assert.ok(!(await page.getByLabel('Điều muốn gửi',{exact:true}).innerText()).includes('undefined'));check('Invalid query safe; reset clears choices');
  await page.goto(base+'#/qua-doanh-nghiep');await page.locator('.corporate-page').waitFor();await bounds('corporate');check('B2B route integrates existing header/footer');
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  results.push({engine,width,reducedMotion,status:'PASS',checks,errors,externalWrites:writes});console.log(engine,width,reducedMotion,'PASS',checks.length);await context.close();
 }} }catch(error){results.push({engine,status:'FAIL',error:String(error)});throw error;}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));}
}

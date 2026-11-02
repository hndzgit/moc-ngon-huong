import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:4181/moc-ngon-huong/';
const browser=await chromium.launch();const checks=[];
try{const context=await browser.newContext({viewport:{width:360,height:844},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('button',{name:'Khám phá hương trà',exact:true}).click();await page.waitForFunction(()=>Math.abs(document.getElementById('chon-cam-xuc').getBoundingClientRect().top)<2);checks.push('Hero secondary CTA scrolls to original tea discovery');
 for(const [text,emotion] of [['Lời cảm ơn','CẢM'],['Lời yêu thương','THƯƠNG'],['Lời chúc bình an','AN'],['Một nỗi nhớ','NHỚ']]){
  await page.goto(base);await page.locator('.atelier-letter').getByRole('button',{name:text,exact:true}).click();await page.locator('.journey-emotions').waitFor();assert.ok((await page.locator('.journey-emotions [aria-pressed=true]').innerText()).startsWith(emotion));
 }checks.push('All four homepage letter choices seed correct intention/emotion');
 await page.goto(base);await page.getByRole('button',{name:'Viết lời nhắn cho món quà này',exact:true}).click();await page.getByRole('button',{name:/Lời chúc bình an/}).click();await page.getByRole('button',{name:'04 Sản phẩm',exact:true}).click();
 assert.match(await page.locator('.journey-product-options [aria-pressed=true]').innerText(),/Tâm Ý/i);checks.push('Signature CTA preserves Tâm Ý through intention changes');
 await page.getByLabel('Người nhận').fill('Người nhận Nguyễn Ánh '.repeat(4));await page.getByLabel('Lời muốn gửi',{exact:false}).fill('Thương'.repeat(80));
 assert.ok((await page.getByLabel('Người nhận').inputValue()).length<=60);assert.equal((await page.getByLabel('Lời muốn gửi',{exact:false}).inputValue()).length,280);
 const bounds=await page.locator('.gift-card-preview').evaluate(e=>{const p=e.querySelector('.gift-card-message');return {pageOverflow:document.documentElement.scrollWidth>innerWidth,messageClipped:p.scrollHeight>p.clientHeight+1||p.getBoundingClientRect().bottom>e.getBoundingClientRect().bottom};});assert.equal(bounds.pageOverflow,false);assert.equal(bounds.messageClipped,false);checks.push('Max-length Vietnamese recipient/message wraps without clipping at360');
 await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.getByRole('button',{name:'Trao đổi với cửa hàng',exact:true}).click();await page.locator('.contact-page').waitFor();await page.goBack();await page.locator('.journey-summary').waitFor();assert.ok((await page.locator('.gift-card-message').innerText()).length===280);checks.push('Consultation route and browser back preserve in-memory draft');
 assert.deepEqual(errors,[]);await fs.writeFile('docs/evidence/v10/entry-tests.json',JSON.stringify({status:'PASS',width:360,checks,errors},null,2));console.log('Entry/edge tests PASS',checks.length);
}finally{await browser.close();}

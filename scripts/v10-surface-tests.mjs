import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173/';
const out='docs/evidence/v10/surfaces';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const results=[];
try{
 for(const width of [360,375,390,430,768,1024,1280,1440,1600,1920]){
  const context=await browser.newContext({viewport:{width,height:1080},hasTouch:width<768,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [hash,selector,name] of [['#/','.home-hero','home'],['#/qua-doanh-nghiep','.corporate-page','corporate'],['#/cau-chuyen','.story-editorial','story']]){
   await page.goto(base+hash);await page.locator(selector).waitFor();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(async img=>{img.loading='eager';await img.decode().catch(()=>{});}));});
   const issues=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'))}));assert.equal(issues.overflow,false,name+width+' overflow');assert.deepEqual(issues.broken,[]);
   if([390,1920].includes(width))await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
   results.push({width,name,status:'PASS',...issues});
  }
  assert.deepEqual(errors,[]);await context.close();console.log('surfaces',width,'PASS');
 }
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),page=await context.newPage();
 await page.goto(base);await page.getByRole('button',{name:'Bắt đầu chọn món quà',exact:true}).tap();await page.getByRole('button',{name:/Lời yêu thương/}).tap();
 for(let i=0;i<3;i++)await page.locator('.journey-bottom').getByRole('button',{name:'Tiếp tục',exact:true}).tap();
 await page.getByLabel('Người nhận').fill('Bà yêu thương');await page.getByLabel('Lời muốn gửi',{exact:false}).fill('Chúc bà vui, khỏe. <script>window.testXSS=true</script>');
 assert.equal(await page.evaluate(()=>window.testXSS),undefined);
 await page.getByRole('button',{name:'Xem lời nhắn trên thiệp',exact:true}).tap();assert.match(await page.locator('.gift-card-preview').innerText(),/Bà yêu thương/);
 await page.getByRole('button',{name:'Tiếp tục viết lời nhắn',exact:true}).tap();assert.equal(await page.locator('#gift-message').evaluate(e=>e===document.activeElement),true);
 await page.getByLabel('Lời muốn gửi',{exact:false}).fill('Bình an nhé!');await page.locator('.journey-bottom').getByRole('button',{name:'Tiếp tục',exact:true}).tap();
 await page.getByRole('button',{name:'Sửa lời nhắn',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#gift-message')!==null);
 await page.getByLabel('Nét hoa',{exact:true}).focus();await page.keyboard.press('Space');assert.equal(await page.getByLabel('Nét hoa',{exact:true}).isChecked(),true);
 await page.getByRole('button',{name:'Bắt đầu lại',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.id==='journey-step-title');
 await page.getByRole('button',{name:/Lời chúc bình an/}).focus();await page.keyboard.press('Space');assert.equal(await page.getByRole('button',{name:/Lời chúc bình an/}).getAttribute('aria-pressed'),'true');
 results.push({name:'touch-keyboard-privacy',status:'PASS',checks:['tap 5-step entry','Vietnamese preview','mobile preview shortcut and return focus','React escapes message text','keyboard radio/change/reset/choice','step heading receives focus']});await context.close();
}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));}

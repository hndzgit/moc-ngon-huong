import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const widths=[360,375,390,430,640,767,768,769,1024,1280,1440,1536,1599,1600,1601,1680,1920,2560];
const base=process.env.MNH_BASE_URL||'http://127.0.0.1:5173';const out='docs/evidence/v7/components';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),results=[];
try{for(const width of widths)for(const height of [720,1080]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',isMobile:width<768,hasTouch:width<768});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/#/lien-he');await page.locator('.contact-info').waitFor();await page.evaluate(()=>document.fonts.ready);
  const cards=await page.locator('.contact-info > div').all(),fields=await page.locator('.contact-page form > .grid > div').all();
  const alignment=[];
  for(let i=0;i<2;i++){const c=await cards[i].boundingBox(),f=await fields[i].boundingBox();assert.ok(Math.abs(c.x-f.x)<.6,`contact ${i} grid`);assert.ok(Math.abs(c.width-f.width)<.6);alignment.push({card:c,field:f});}
  await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).click();const empty=page.getByRole('button',{name:'Tiếp tục mua sắm',exact:true});const eb=await empty.boundingBox();assert.ok(eb.width>250);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Mở tư vấn trực tuyến Mộc Ngôn Hương',exact:true}).click();const panel=page.locator('#chat-panel');await panel.waitFor();const bounds=await panel.boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=height,`chat bounds ${JSON.stringify(bounds)}`);
  const input=panel.locator('input');const ib=await input.boundingBox();assert.ok(ib.y>=0&&ib.y+ib.height<=height,'chat input reachable');
  await input.fill('Xin chào');await input.press('Enter');await page.waitForTimeout(700);assert.ok((await panel.innerText()).includes('Xin chào'));
  await page.screenshot({path:`${out}/chat-${width}-${height}.png`});
  await page.getByRole('button',{name:'Đóng khung chat',exact:true}).click();assert.equal(await panel.count(),0);
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push({width,height,status:'PASS',alignment,chat:bounds,emptyCartButton:eb,errors});console.log('PASS',width,height);
 }catch(e){results.push({width,height,status:'FAIL',error:String(e),errors});console.log('FAIL',width,height,String(e));}
 await context.close();
}await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));if(results.some(x=>x.status!=='PASS'))process.exitCode=1;}finally{await browser.close()}

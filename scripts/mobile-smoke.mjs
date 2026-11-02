import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);
const browser=await chromium.launch();
const results=[];
try {
  for (const width of [390,360]) {
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.MNH_BASE_URL || 'http://127.0.0.1:5173');
    await page.locator('header').getByRole('button',{name:'Menu',exact:true}).tap();
    await page.locator('header').getByRole('button',{name:'Sản phẩm',exact:true}).last().tap();
    await page.locator('.products-page .product-card').first().getByRole('button',{name:'Tăng số lượng',exact:true}).tap();
    await page.locator('header').getByRole('button',{name:'Giỏ hàng',exact:true}).tap();
    await page.getByRole('dialog',{name:'Giỏ hàng'}).getByRole('button',{name:'Tăng số lượng',exact:true}).first().tap();
    await page.getByRole('button',{name:'Đóng giỏ hàng',exact:true}).tap();
    await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).tap();
    await page.getByPlaceholder('Tìm kiếm sản phẩm').fill('tra huong buoi');
    await page.locator('.search-card .product-card h3').tap();
    await page.locator('main').getByRole('button',{name:'Mua Ngay',exact:true}).tap();
    assert.equal(await page.locator('.cart-drawer').count(),0);
    await page.getByRole('button',{name:/Đến lấy hàng/}).tap();assert.equal(await page.locator('main select').count(),1);
    await page.getByRole('button',{name:/Giao tận nơi/}).tap();assert.equal(await page.locator('main select').count(),3);
    await page.getByRole('button',{name:'Mở tư vấn trực tuyến Mộc Ngôn Hương',exact:true}).tap();
    const panel=await page.locator('.chat-panel').boundingBox();
    assert.ok(panel.x>=0&&panel.x+panel.width<=width&&panel.y>=0&&panel.y+panel.height<=844);
    await page.getByRole('button',{name:'Gợi ý tư vấn thêm',exact:true}).tap();
    assert.equal(await page.getByRole('button',{name:'Tư vấn chọn quà theo người nhận',exact:true}).count(),1);
    await page.getByRole('button',{name:'Đóng khung chat',exact:true}).tap();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(errors.length,0);
    results.push({width,status:'VERIFIED_WORKING',touch:true,checks:['menu','product stepper','cart stepper/close','search to detail','buy now','delivery/pickup','chat more/close'],pageErrors:errors});
    await context.close();
  }
  await fs.writeFile('docs/evidence/mobile-smoke.json',JSON.stringify(results,null,2));console.log(results);
} finally {await browser.close();}

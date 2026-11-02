import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
  const page = await context.newPage();
  const consoleErrors=[],pageErrors=[],failedRequests=[],blockedWrites=[];
  page.on('console',msg=>{if(msg.type()==='error') consoleErrors.push(msg.text());});
  page.on('pageerror',err=>pageErrors.push(err.message));
  page.on('requestfailed',req=>failedRequests.push({url:req.url(),failure:req.failure()}));
  await context.route('**/*',route=>{
    if (!['GET','HEAD'].includes(route.request().method())) {
      blockedWrites.push({url:route.request().url(),method:route.request().method()});
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(`${process.env.MNH_PRODUCTION_URL || 'http://127.0.0.1:4173'}/?figma-qa=1`);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image=>{image.loading='eager';try{await image.decode();}catch{}}));
  });
  assert.equal(await page.locator('.home-hero').count(),1);
  assert.equal(await page.evaluate(()=>[...document.images].filter(image=>!image.naturalWidth).length),0);
  await page.locator('header').getByRole('button',{name:'Liên hệ',exact:true}).click();
  assert.match(await page.locator('header img[alt="Tài khoản"]').getAttribute('src'),/d0415\.svg$/);
  await page.locator('header').getByRole('button',{name:'Tài khoản',exact:true}).click();
  assert.equal(await page.locator('.qa-state-switcher').count(),0);
  await page.locator('main input[type=email]').fill('production-check@example.invalid');
  await page.locator('main input[type=password]').fill('invalid-password');
  await page.locator('main form').getByRole('button',{name:'Đăng Nhập',exact:true}).click();
  assert.equal(await page.locator('.auth-login').count(),1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('mnh_user_email_v1')),null);
  const result={productionHomepage:'PASS',originalAssetsResolve:'PASS',contactIconOverride:'PASS',qaSwitcherRemovedFromProduction:'PASS',loginNeverFallsBackToFakeSuccess:'PASS',consoleErrors,pageErrors,failedRequests,blockedWrites};
  await fs.writeFile('docs/evidence/production-smoke.json',JSON.stringify(result,null,2));
  console.log(result);
  assert.equal(consoleErrors.length,0);assert.equal(pageErrors.length,0);assert.equal(blockedWrites.length,0);
} finally {
  await browser.close();
}

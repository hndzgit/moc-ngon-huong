// Repeatable local lab comparison, not field CWV or an FPS guarantee.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/playwright`);
const base=process.env.MNH_BASE_URL;
const targets=process.env.MNH_PERF_TARGETS?JSON.parse(process.env.MNH_PERF_TARGETS):{current:base};
if(!Object.values(targets).every(Boolean))throw new Error('Set MNH_BASE_URL or MNH_PERF_TARGETS to local production previews');
const network=process.env.MNH_PERF_NETWORK?JSON.parse(process.env.MNH_PERF_NETWORK):null;
const browser=await chromium.launch();const samples=[];
try{for(const width of [1920,390])for(let run=0;run<Number(process.env.MNH_PERF_RUNS||3);run++)for(const [target,url] of Object.entries(targets)){
 const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'no-preference'});
 const page=await context.newPage();const session=await context.newCDPSession(page);
 await session.send('Performance.enable');await session.send('Emulation.setCPUThrottlingRate',{rate:4});
 if(network){await session.send('Network.enable');await session.send('Network.emulateNetworkConditions',{offline:false,...network});}
 await page.addInitScript(()=>{
  window.__lab={lcp:0,cls:0,longTasks:[],interactions:[]};
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(l=>window.__lab.longTasks.push(...l.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>window.__lab.interactions.push(...l.getEntries().filter(e=>e.interactionId).map(e=>e.duration))).observe({type:'event',buffered:true,durationThreshold:16});
 });
 page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(90000);
 await page.goto(url,{waitUntil:'load'});await page.locator('.hero-photo').waitFor();
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.images].filter(image=>{const r=image.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0}).map(image=>image.decode().catch(()=>{})));
 });
 await page.waitForTimeout(1000);
 const initial=await page.evaluate(()=>({...window.__lab,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,transfer:performance.getEntriesByType('resource').reduce((n,e)=>n+e.transferSize,0),hero:{complete:document.querySelector('.hero-photo').complete,currentSrc:document.querySelector('.hero-photo').currentSrc},resources:performance.getEntriesByType('resource').map(e=>({name:e.name,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,duration:e.duration}))}));
 await page.locator('header').getByRole('button',{name:'Tìm kiếm sản phẩm',exact:true}).click();
 await page.getByPlaceholder('Tìm kiếm sản phẩm').fill('tra huong buoi');await page.keyboard.press('Escape');
 await page.waitForTimeout(500);
 const interaction=await page.evaluate(()=>({...window.__lab}));const metrics=await session.send('Performance.getMetrics');
 samples.push({target,width,run,initial,maxObservedInteractionMs:Math.max(0,...interaction.interactions),longTaskTotalMs:interaction.longTasks.reduce((a,b)=>a+b,0),metrics:Object.fromEntries(metrics.metrics.filter(m=>['JSHeapUsedSize','Nodes','LayoutCount','RecalcStyleCount','TaskDuration','ScriptDuration'].includes(m.name)).map(m=>[m.name,m.value]))});
 await context.close();
}const output={targets,cpuThrottle:4,networkThrottle:network||'none/local',coldBrowserContext:true,samples,notes:'Chromium lab only; event duration is not field INP. Alternating targets when provided. No FPS measurement.'};
 await fs.mkdir('docs/evidence/phase5',{recursive:true});await fs.writeFile(process.env.MNH_PERF_OUTPUT||'docs/evidence/phase5/performance.json',JSON.stringify(output,null,2));
 console.log(samples.map(s=>({target:s.target,width:s.width,run:s.run,lcp:s.initial.lcp,cls:s.initial.cls,event:s.maxObservedInteractionMs,heap:s.metrics.JSHeapUsedSize})));
}finally{await browser.close()}

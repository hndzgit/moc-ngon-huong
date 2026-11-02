import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/sharp`);
import fs from 'node:fs/promises';
const manifest=JSON.parse(await fs.readFile('figma-reference/manifests/frames-manifest.json','utf8'));
const ids=['56:1033','127:12938','127:13466','127:13960','77:2583','35:3068','120:2859','120:3302','120:3541','120:6560','127:8439','127:8870','33:2786','127:9562','127:10079','77:3389','77:3506','127:11104','127:12445','127:12046','127:10877','127:11621','127:11753','127:11871'];
const metrics=[];
const inputDir=process.env.MNH_COMPARE_INPUT || 'docs/evidence/current';
const prefix=process.env.MNH_COMPARE_PREFIX || '';
for(let group=0;group<4;group++){
 const entries=[];
 for(let j=0;j<6;j++){
  const id=ids[group*6+j],frame=manifest.frames.find(f=>f.nodeId===id);
  const native=`docs/evidence/figma-${id.replace(':','-')}-native.png`;
  let ref=id==='56:1033'?'docs/evidence/figma-home-1920.png':'figma-reference/'+frame.screenshotPath;
  try{await fs.access(native);ref=native;}catch{}
  const current=`${inputDir}/${id.replace(':','-')}-1920.png`;
  try{
   const rm=await sharp(ref).metadata(),cm=await sharp(current).metadata();
   for(let col=0;col<2;col++){
    const p=col?current:ref;
    const thumb=await sharp(p).resize({width:250}).toBuffer();
    entries.push({input:thumb,left:(j%2)*500+col*250,top:Math.floor(j/2)*820+35});
    const label=Buffer.from(`<svg width="250" height="32"><rect width="250" height="32" fill="white"/><text x="8" y="23" font-size="14">${id} ${col?'localhost':'Figma'}</text></svg>`);
    entries.push({input:label,left:(j%2)*500+col*250,top:Math.floor(j/2)*820});
   }
   // Compare without stretching: render screenshot to reference width, pad/crop vertical extent.
   const target=await sharp(ref).removeAlpha().raw().toBuffer();
   const resized=await sharp(current).resize({width:rm.width}).png().toBuffer();
   const resizedMeta=await sharp(resized).metadata();
   const visibleHeight=Math.min(resizedMeta.height,rm.height);
   const cur=await sharp(resized).extract({left:0,top:0,width:rm.width,height:visibleHeight}).extend({bottom:rm.height-visibleHeight,background:'#fff'}).removeAlpha().raw().toBuffer();
   let sum=0,differing=0;for(let p=0;p<target.length;p+=3){const d=Math.abs(target[p]-cur[p])+Math.abs(target[p+1]-cur[p+1])+Math.abs(target[p+2]-cur[p+2]);sum+=d;if(d>45)differing++;}
   metrics.push({id,referencePixels:[rm.width,rm.height],implementationPixels:[cm.width,cm.height],normalizedMeanAbsoluteError:sum/target.length/255,percentPixelsOver15PerChannel:differing/(target.length/3)*100});
  }catch(e){metrics.push({id,error:String(e)});}
 }
 await sharp({create:{width:1000,height:2460,channels:3,background:'#eeeeee'}}).composite(entries).png().toFile(`docs/evidence/${prefix}comparison-sheet-${group+1}.png`);
}
await fs.writeFile(`docs/evidence/${prefix}visual-differences.json`,JSON.stringify(metrics,null,2));console.log(metrics);

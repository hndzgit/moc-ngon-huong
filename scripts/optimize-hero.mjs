// Reproducible delivery derivatives only. The immutable Figma original is never overwritten.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/sharp`);
const original='public/assets/figma/hero-banner.png';
const directory='public/assets/optimized';
await fs.mkdir(directory,{recursive:true});
const originalBytes=(await fs.stat(original)).size;const results=[];
for(const width of [768,1280,1920,2560,3840]){
 const path=`${directory}/hero-${width}.webp`;
 await sharp(original).resize({width,withoutEnlargement:true}).webp({quality:92,effort:5}).toFile(path);
 const reference=await sharp(original).resize({width}).removeAlpha().raw().toBuffer();
 const actual=await sharp(path).removeAlpha().raw().toBuffer();
 let absolute=0,squared=0,over16=0;
 for(let i=0;i<reference.length;i++){const d=Math.abs(reference[i]-actual[i]);absolute+=d;squared+=d*d;if(d>16)over16++;}
 const bytes=(await fs.stat(path)).size;
 results.push({width,path,originalBytes,bytes,transferReductionPercent:100*(1-bytes/originalBytes),meanAbsoluteError:absolute/reference.length,psnrDb:10*Math.log10(255*255/(squared/reference.length)),channelsOver16Percent:over16/reference.length*100});
}
await fs.mkdir('docs/evidence/v7',{recursive:true});
await fs.writeFile('docs/evidence/v7/hero-derivatives.json',JSON.stringify(results,null,2));
console.log(results);

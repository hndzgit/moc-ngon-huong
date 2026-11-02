import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/sharp`);
const originals=[['buoi-an','an-outdoor.png'],['nhai-thuong','thuong-outdoor.png'],['soi-cam','cam-outdoor.png'],['com-nho','nho-outdoor.jpg'],['hop-qua-tam-y','combo-table.png']];
await fs.mkdir('public/assets/optimized',{recursive:true});
const rows=[];
for(const [id,file] of originals){
  const input=`public/assets/figma/${file}`,output=`public/assets/optimized/tea-${id}-1280.webp`;
  const source=await fs.readFile(input),meta=await sharp(source).metadata();
  await sharp(source).resize({width:1280,withoutEnlargement:true}).webp({quality:88,effort:6}).toFile(output);
  const encoded=await fs.readFile(output),result=await sharp(encoded).metadata();
  rows.push({id,input,output,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),outputSha256:crypto.createHash('sha256').update(encoded).digest('hex'),sourceBytes:source.length,outputBytes:encoded.length,sourceDimensions:[meta.width,meta.height],dimensions:[result.width,result.height],crop:false});
}
await fs.mkdir('docs/evidence/v10',{recursive:true});await fs.writeFile('docs/evidence/v10/tea-derivatives.json',JSON.stringify(rows,null,2));
console.log(rows.map(({id,sourceBytes,outputBytes})=>({id,sourceBytes,outputBytes})));

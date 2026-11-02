import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT||'/tmp/mnh-visual-tools'}/node_modules/sharp`);
const inputs=[
 ['card-buoi-an','originals/ae4e7.png'],['card-nhai-thuong','originals/219aa.png'],['card-soi-cam','originals/417b2.png'],['card-com-nho','originals/c759e.png'],
 ['botanical-AN','illus-hoabuoi.png'],['botanical-THUONG','illus-hoanhai.png'],['botanical-CAM','illus-hoasoi.png'],['botanical-NHO','illus-com.png'],
];
const rows=[];const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [name,file] of inputs){
 const input=`public/assets/figma/${file}`,output=`public/assets/optimized/discovery-${name}.webp`;
 const bytes=await fs.readFile(input),meta=await sharp(bytes).metadata(),botanical=name.startsWith('botanical-');
 const width=botanical?384:1280;
 await sharp(bytes).resize({width,withoutEnlargement:true}).webp(botanical?{lossless:true,effort:6}:{quality:88,effort:6}).toFile(output);
 const encoded=await fs.readFile(output),decoded=await sharp(encoded).metadata();
 const alias={'card-nhai-thuong':'thuong-tray.png','card-soi-cam':'cam-tray.png','card-com-nho':'nho-tray.png'}[name];
 if(alias&&hash(await fs.readFile(`public/assets/figma/${alias}`))!==hash(bytes))throw new Error('Source alias changed: '+alias);
 rows.push({name,input,sourceAliases:alias?[`public/assets/figma/${alias}`]:[],output,sourceSha256:hash(bytes),sha256:hash(encoded),sourceBytes:bytes.length,bytes:encoded.length,sourceDimensions:[meta.width,meta.height],dimensions:[decoded.width,decoded.height],alpha:decoded.hasAlpha,lossless:botanical,crop:false});
}
await fs.mkdir('docs/evidence/v10',{recursive:true});await fs.writeFile('docs/evidence/v10/discovery-derivatives.json',JSON.stringify(rows,null,2));console.log(rows.map(({name,sourceBytes,bytes})=>({name,sourceBytes,bytes})));

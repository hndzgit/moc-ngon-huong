import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import postcss from 'postcss';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const out='docs/evidence/v7';await fs.mkdir(out,{recursive:true});
function inspect(css){
 const root=postcss.parse(css),map=new Map(),important=[],nth=[],hiding=[];let rules=0,declarations=0;
 root.walkRules(rule=>{rules++;if(rule.selector.includes('nth-child'))nth.push({selector:rule.selector,line:rule.source.start.line});let context='',n=rule.parent;while(n&&n.type!=='root'){if(n.type==='atrule')context='@'+n.name+' '+n.params+'|'+context;n=n.parent;}
 rule.walkDecls(d=>{declarations++;if(d.important)important.push({selector:rule.selector,property:d.prop,value:d.value,line:d.source.start.line});if(d.prop==='display'&&d.value==='none')hiding.push({selector:rule.selector,context,line:d.source.start.line});const k=context+'|'+rule.selector+'|'+d.prop;const rows=map.get(k)||[];rows.push({value:d.value,line:d.source.start.line});map.set(k,rows);});});
 return {rules,declarations,important,nthChildRules:nth,displayNone:hiding,duplicateProperties:[...map].filter(([,v])=>v.length>1).map(([key,declarations])=>({key,declarations}))};
}
const before=inspect(execFileSync('tar',['-xOf','.codex-baseline/v7/working-tree-before.tar.gz','src/figma-repair.css'],{encoding:'utf8'}));
const after=inspect(await fs.readFile('src/figma-repair.css','utf8'));
await fs.writeFile(`${out}/css-audit.json`,JSON.stringify({before,after},null,2));
const baseline=JSON.parse(await fs.readFile(`${out}/baseline.json`,'utf8'));const changed=[],missing=[],unchanged=[];
for(const entry of baseline.files){try{const current=sha(await fs.readFile(entry.path));(current===entry.sha256?unchanged:changed).push(entry.path);}catch{missing.push(entry.path);}}
const assets=JSON.parse(await fs.readFile('figma-reference/manifests/assets-manifest.json','utf8')).assets;
const originalAssets=[];
for(const a of assets){const path=`figma-reference/${a.rel_path}`;const hash=sha(await fs.readFile(path));originalAssets.push({node:a.node_id,path,sha256:hash,match:hash===a.sha256});}
const publicFiles=execFileSync('git',['ls-files','public/assets/figma'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);const alteredPublic=[];
for(const path of publicFiles){const original=execFileSync('git',['rev-parse',`HEAD:${path}`],{encoding:'utf8'}).trim();const bytes=await fs.readFile(path);const gitHash=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');if(original!==gitHash)alteredPublic.push(path);}
const icons=await fs.readFile('src/components/FigmaIcon.tsx','utf8');const registry=[...icons.matchAll(/\['([^']+\.svg)', ([\d.]+), ([\d.]+), '([^']+)'\]/g)].map(m=>({file:m[1],width:Number(m[2]),height:Number(m[3]),node:m[4]}));
const iconChecks=[];for(const icon of registry){const path='public/assets/figma/originals/'+icon.file;iconChecks.push({...icon,path,sha256:sha(await fs.readFile(path))});}
const recovered=JSON.parse(await fs.readFile(`${out}/recovered-gift-assets.json`,'utf8'));
const giftPhotoChecks=[];
for(const a of [{node:'96:2989',figmaImageHash:'1c94f63d00c2276919061ce7058517227e852fca',path:'public/assets/figma/combo-slide-1.png'},...recovered]){const bytes=await fs.readFile(a.path);giftPhotoChecks.push({...a,match:crypto.createHash('sha1').update(bytes).digest('hex')===a.figmaImageHash});}
const output={recoveredOriginals:recovered.length,giftPhotoChecks,baselineHead:baseline.head,changedFromV7Snapshot:changed,missingFromV7Snapshot:missing,unchangedSnapshotFiles:unchanged.length,originalAssetManifestCount:originalAssets.length,originalAssetMismatches:originalAssets.filter(a=>!a.match),trackedPublicOriginals:publicFiles.length,alteredPublicOriginals:alteredPublic,icons:iconChecks,priceCatalogueUnchanged:unchanged.includes('src/data/products.ts'),firebaseUnchangedFromV7:unchanged.includes('src/services/firebase.ts'),hostingUnchanged:unchanged.includes('vite.config.ts')&&unchanged.includes('.github/workflows/deploy.yml')};
await fs.writeFile(`${out}/safety-assets.json`,JSON.stringify(output,null,2));
console.log({cssDuplicates:[before.duplicateProperties.length,after.duplicateProperties.length],snapshotChanges:changed,missing,originalAssets:originalAssets.length,assetMismatches:output.originalAssetMismatches.length,alteredPublic,icons:registry.length,pricesUnchanged:output.priceCatalogueUnchanged,firebaseUnchanged:output.firebaseUnchangedFromV7,hostingUnchanged:output.hostingUnchanged});
if(missing.length||output.originalAssetMismatches.length||alteredPublic.length||giftPhotoChecks.some(a=>!a.match))process.exitCode=1;

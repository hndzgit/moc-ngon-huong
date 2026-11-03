// Execute existing regression assertions in a disposable, credential-free checkout.
// Serialization tests use the real Firebase Admin SDK against a local emulator.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {generateKeyPairSync} from 'node:crypto';
import {build} from 'esbuild';
const root=process.cwd(),sandbox=path.join(root,'.codex-baseline/v17/test-project');
await fs.mkdir(sandbox,{recursive:true});
for(const file of execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n')){
 if(file.startsWith('public/')||file.startsWith('.env')||/\.(png|jpe?g|webp|avif)$/.test(file))continue;
 const target=path.join(sandbox,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,file),target);
}
await fs.symlink(path.join(root,'node_modules'),path.join(sandbox,'node_modules')).catch(e=>{if(e.code!=='EEXIST')throw e});
const config=path.join(sandbox,'vite.config.ts');
await fs.writeFile(config,(await fs.readFile(config,'utf8')).replace('defineConfig({',`defineConfig({ cacheDir: ${JSON.stringify(path.join(sandbox,'.vite-test-cache'))},`));
const env={...process.env,NODE_ENV:'test'};
for(const key of Object.keys(env))if(/^(FIREBASE_|VITE_FIREBASE_|RESEND_|GOOGLE_|VERCEL|ADMIN_UIDS|MNH_TEST_MODE|FIRESTORE_EMULATOR_HOST)/.test(key))delete env[key];
const results=[];await fs.mkdir('docs/evidence/v17',{recursive:true});
for(const test of ['test-admin-api','test-auth-emails','test-contact-audit','test-v13-auth-orders','test-v13-4-order-history','test-order-sanitization']){
 const entry=path.join(sandbox,'scripts',test+'.mjs'),output=path.join(sandbox,test+'.mjs');
 await build({entryPoints:[entry],bundle:true,packages:'external',platform:'node',format:'esm',outfile:output,logLevel:'warning'});
 const testEnv={...env};
 if(test==='test-order-sanitization'){
  const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
  testEnv.FIRESTORE_EMULATOR_HOST='127.0.0.1:8185';
  testEnv.FIREBASE_SERVICE_ACCOUNT_JSON=JSON.stringify({type:'service_account',project_id:'demo-mnh-v17',client_email:'test@demo-mnh-v17.iam.gserviceaccount.com',private_key:privateKey});
 }
 const r=spawnSync(process.execPath,[output],{cwd:sandbox,env:testEnv,encoding:'utf8',timeout:120000});
 const log=(r.stdout||'')+(r.stderr||'');await fs.writeFile(`docs/evidence/v17/${test}.log`,log);
 results.push({test,status:r.status===0?'PASS':'FAIL',exit:r.status,error:r.error?.message,environment:test==='test-order-sanitization'?'Firestore emulator demo-mnh-v17 / 127.0.0.1:8185':'isolated local checkout; no Firebase/Resend credentials'});
 console.log(test,results.at(-1).status);
}
await fs.writeFile('docs/evidence/v17/regressions.json',JSON.stringify(results,null,2));
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;

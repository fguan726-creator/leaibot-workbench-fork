#!/usr/bin/env node
// Read-only regression gate. No npm dependencies and no production mutations.
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('node:assert/strict'),cp=require('child_process');
const base='public/leaip0',manifest=JSON.parse(fs.readFileSync(base+'/assets/frontend/bundles/p0-home-manifest.json')),budget=JSON.parse(fs.readFileSync('scripts/p0-performance-budget.json'));
cp.execFileSync(process.execPath,['scripts/build-p0-home-assets.cjs','--check'],{stdio:'inherit'});
const decode=s=>s.replaceAll('&amp;','&'),read=u=>fs.readFileSync(base+decode(u).split('?')[0]),rows=[];
for(const entry of budget.pages){
 const html=fs.readFileSync(base+'/'+entry.file,'utf8'),scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)].map(m=>decode(m[1])),styles=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map(m=>decode(m[0].match(/href="([^"]+)"/)[1])),urls=[...scripts,...styles];
 let gzip=0;for(const u of urls){assert.match(u,/^\//,'Only reviewed local resources allowed');assert.match(u,/[?&]p0v=[a-f0-9]{16}(?:&|$)/,'Unversioned resource: '+u);const content=read(u),size=z.gzipSync(content).length;gzip+=size;assert.ok(size<=(u.split('?')[0].endsWith('.js')?budget.maxSingleJsGzip:budget.maxSingleCssGzip),'Single asset exceeds budget: '+u);if(u.split('?')[0].endsWith('.js'))new vm.Script(content.toString(),{filename:u});}
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/\bsrc=/.test(m[1])||/type="(?:application\/json|application\/ld\+json|module)"/.test(m[1]))continue;new vm.Script(m[2],{filename:entry.file+' inline'});}
 assert.ok(urls.length<=entry.maxRequests,'Request budget exceeded: '+entry.file);assert.ok(gzip<=entry.maxGzip,'Gzip budget exceeded: '+entry.file);assert.ok(z.gzipSync(html).length<=entry.maxHtmlGzip,'HTML/inline budget exceeded: '+entry.file);
 const config=JSON.parse(html.match(/<script id="p0-home-feature-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.ok(config.features.detail&&config.features.orders,'Missing lazy boundaries');
 for(const spec of Object.values(config.features)){assert.ok(!scripts.includes(spec.script),'Lazy feature eagerly loaded');read(spec.script);for(const s of spec.styles){read(s.url);assert.ok(html.includes('id="'+s.anchor+'"'),'Missing style anchor');assert.ok(!styles.includes(s.url),'Lazy style eagerly loaded');}}
 const initial=scripts.map(u=>read(u).toString()).join('\n');assert.ok(!initial.includes('/* '+base+'/assets/frontend/js/core/address-regions-v142.js */'),'Address dataset in initial bundle');assert.ok(!scripts.some(u=>u.includes('member-service-clean')),'Member runtime eager');assert.ok(initial.includes('__lxPageLifecycle'),'Missing bounded readiness');assert.ok(!initial.includes('try{await lxFeature}'),'Detail waits for enhancements');
 rows.push({page:entry.file,requests:urls.length,gzip,htmlGzip:z.gzipSync(html).length});
}
console.table(rows);
const smart=fs.readFileSync(base+'/assets/frontend/js/core/composer-smart-actions-v1.js','utf8');assert.ok(!smart.includes('}, 400);'),'400ms global poll restored');assert.ok(!smart.includes('observe(document.documentElement, {\n      childList'),'Whole-document subtree observer restored');
if(process.argv.includes('--origin')){
 const origin=process.argv[process.argv.indexOf('--origin')+1];assert.match(origin,/^https?:\/\//);
 (async()=>{for(const r of ['/','/shop-chat/','/b-chat/','/biz-chat/','/brand/']){const res=await fetch(new URL(r,origin),{signal:AbortSignal.timeout(15000)});assert.equal(res.status,200,r);assert.ok((await res.text()).includes('p0-home-feature-config'),r);}
 for(const sku of ['1047099','1047100','1056604']){const res=await fetch(new URL('/api/products/'+sku+'/variants',origin),{signal:AbortSignal.timeout(15000)});assert.equal(res.status,200);const data=await res.json();assert.ok(Array.isArray(data.variants)&&data.variants.length>0,'Variants empty '+sku);assert.ok(data.variants.some(v=>String(v.sku)===sku),'Requested SKU missing '+sku);assert.equal(new Set(data.variants.map(v=>String(v.sku))).size,data.variants.length,'Duplicate SKU');console.log('PASS SKU',sku,'variants',data.variants.length);}console.log('PASS five-route HTTP and SKU contract smoke');})().catch(e=>{console.error(e);process.exitCode=1;});
}else console.log('PASS static five-channel budgets and boundaries (HTTP/UI tests are separate)');

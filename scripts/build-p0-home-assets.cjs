#!/usr/bin/env node
// Canonical, non-deploying build for all five P0 entry points.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const base='public/leaip0',manifestFile=base+'/assets/frontend/bundles/p0-home-manifest.json',manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),staged=new Map(),read=f=>staged.get(f)??fs.readFileSync(f,'utf8');
const pages=manifest.pages||[base+'/index.html'];for(const f of pages)staged.set(f,read(f));
for(const e of manifest.embedded||[]){const s=read(e.source);new vm.Script(s);const t=read(e.target),a=t.indexOf(e.start),b=t.indexOf(e.end);if(a<0||b<a)throw Error('Missing module markers: '+e.target);staged.set(e.target,t.slice(0,a)+e.start+'\n'+s+'\n'+t.slice(b));}
for(const g of manifest.groups){
 const content=g.files.map(f=>{let s=read(f);if(g.type==='js'){if(/document\.currentScript|document\.write\s*\(/.test(s))throw Error('Unsafe bundle: '+f);new vm.Script(s,{filename:f});return '\n;/* '+f+' */\n'+s+'\n;\n';}
 if(/@import\b/i.test(s))throw Error('Review CSS import: '+f);s=s.replace(/@charset\s+["'][^"']+["'];?/gi,'');s=s.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi,(m,a,b,c)=>{const u=a??b??c;if(!u||/^(?:data:|https?:|\/|#)/i.test(u))return m;if(u.includes('\\'))throw Error('Escaped URL: '+f);const full=new URL(u,'https://p0.leaibot.cn'+f.slice(base.length));return 'url("'+full.pathname+full.search+full.hash+'")';});return '\n/* '+f+' */\n'+s;
 }).join('\n');if(g.type==='js')new vm.Script(content,{filename:g.label});const digest=hash(content),url=g.url.split('?')[0]+'?p0v='+digest.slice(0,16);staged.set(base+url.split('?')[0],content);
 for(const f of pages)staged.set(f,read(f).split(g.url).join(url).split(g.url.replaceAll('&','&amp;')).join(url.replaceAll('&','&amp;')));
 g.url=url;g.hash=digest;g.sourceHashes=g.files.map(f=>hash(read(f)));
}
for(const item of manifest.inlineSources||[]){const file=typeof item==='string'?item:item.source,targets=typeof item==='string'?[base+'/index.html']:item.pages;const s=read(file);new vm.Script(s);for(const f of targets){const html=read(f),start='<script data-p0-inline-source="'+file.slice(base.length)+'">',i=html.indexOf(start),end=html.indexOf('</script>',i);if(i<0||end<i)throw Error('Missing inline module '+file+' in '+f);staged.set(f,html.slice(0,i)+start+s.replace(/<\/script/gi,'<\\/script')+'</script>'+html.slice(end+9));}}
for(const e of manifest.standaloneEntrypoints||[]){const page=read(e.file),escaped=e.url.replace(/[.*+?^$()|[\]\\]/g,'\\$&'),re=new RegExp(escaped+'(?:\\?[^"<>]*)?','g');if(!re.test(page))throw Error('Missing entry '+e.url+' in '+e.file);staged.set(e.file,page.replace(re,e.url+'?p0v='+hash(read(e.source)).slice(0,16)));}
staged.set(manifestFile,JSON.stringify(manifest,null,2)+'\n');const changed=[...staged].filter(([f,s])=>!fs.existsSync(f)||hash(fs.readFileSync(f))!==hash(s));
if(process.argv[2]==='--check'){console.log(JSON.stringify({consistent:!changed.length,changed:changed.map(([f])=>f)}));process.exitCode=changed.length?1:0;}
else if(process.argv[2]==='--stage'&&process.argv[3]){const out=path.resolve(process.argv[3]);if(fs.existsSync(out))throw Error('Stage exists');for(const[f,s]of changed){const p=path.join(out,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);}console.log(JSON.stringify({output:out,files:changed.map(([f])=>f)}));}else throw Error('Use --check or --stage <new-directory>');

const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const events={};let timers=new Set();
const context={window:{},document:{addEventListener:(name,fn)=>events[name]=fn},location:{href:'https://p0.leaibot.cn/'},URL,Promise,WeakMap,Object,CustomEvent:class{},setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms);timers.add(id);return id;},clearTimeout:id=>{clearTimeout(id);timers.delete(id);},setInterval,clearInterval};
vm.runInNewContext(fs.readFileSync('public/leaip0/assets/frontend/js/core/page-lifecycle-v1.js','utf8'),context);
function frame(cross=false){const handlers={};const f={tagName:'IFRAME',src:'https://example.test/page',isConnected:true,getAttribute:()=>f.src,addEventListener:(k,fn)=>handlers[k]=fn,removeEventListener:k=>delete handlers[k],contentDocument:{readyState:'complete',body:{children:[{}]}},contentWindow:{location:{href:'https://example.test/page'}}};if(cross)Object.defineProperty(f,'contentWindow',{get(){throw Error('SecurityError');}});return{f,handlers};}
(async()=>{
 const api=context.window.__lxPageLifecycle;
 assert.equal(await api.waitFrame(frame().f,15),'ready');
 const cached=frame(true);events.load({target:cached.f});assert.equal(await api.waitFrame(cached.f,15),'load');
 const delayed=frame(true),loading=api.waitFrame(delayed.f,100);delayed.handlers.load();assert.equal(await loading,'load');assert.equal(Object.keys(delayed.handlers).length,0);
 const stalled=frame(true);assert.equal(await api.waitFrame(stalled.f,15),'timeout');assert.equal(Object.keys(stalled.handlers).length,0);
 const error=frame(true),failed=api.waitFrame(error.f,100);error.handlers.error();assert.equal(await failed,'error');
 const changed=frame(true),stale=api.waitFrame(changed.f,1000);changed.f.src='https://example.test/other';assert.equal(await stale,'stale');assert.equal(Object.keys(changed.handlers).length,0);
 console.log('PASS ready, captured cross-origin completion, later load, timeout, error, changed-navigation cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});

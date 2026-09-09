/* Incremental mirror for already-normalized assistant markup. No network or storage. */
(() => {
  'use strict';
  if(window.__lxStreamView)return;
  const active=new WeakMap();
  function key(node){return node.nodeType===1?(node.id||node.getAttribute('data-id')||''):'';}
  function patchNode(node,next){
    if(node.isEqualNode(next))return;
    if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName||key(node)!==key(next)){node.replaceWith(next.cloneNode(true));return;}
    if(node.nodeType===3||node.nodeType===8){node.data=next.data;return;}
    if(node.nodeType!==1)return;
    for(const a of [...node.attributes])if(!next.hasAttribute(a.name))node.removeAttribute(a.name);
    for(const a of [...next.attributes])if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);
    patchChildren(node,next);
  }
  function patchChildren(host,next){
    const old=[...host.childNodes],fresh=[...next.childNodes];
    for(let i=0;i<fresh.length;i++){if(old[i])patchNode(old[i],fresh[i]);else host.appendChild(fresh[i].cloneNode(true));}
    for(let i=fresh.length;i<old.length;i++)old[i].remove();
  }
  function patch(host,html){const template=document.createElement('template');template.innerHTML=html;patchChildren(host,template.content);}
  function mirror({source,target,scroll,normalize,isGenerating,onFinish,timeout=60000}){
    active.get(target)?.();let stopped=false,raf=0,poll,timer,lastRaw=null;
    function flush(){raf=0;if(stopped||!target.isConnected||!source.isConnected)return;const raw=source.innerHTML;if(raw===lastRaw)return;lastRaw=raw;const stick=!scroll||scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80;patch(target,normalize(raw));if(scroll&&stick)scroll.scrollTop=scroll.scrollHeight;}
    function stop(finish=false){if(stopped)return;if(finish)flush();stopped=true;observer.disconnect();cancelAnimationFrame(raf);clearInterval(poll);clearTimeout(timer);if(active.get(target)===stop)active.delete(target);if(finish&&target.isConnected)onFinish();}
    const observer=new MutationObserver(()=>{if(!raf&&!stopped)raf=requestAnimationFrame(flush);});
    observer.observe(source,{subtree:true,childList:true,characterData:true,attributes:true});
    poll=setInterval(()=>{if(!source.isConnected||!target.isConnected)stop();else if(!isGenerating())stop(true);},750);
    timer=setTimeout(()=>stop(true),timeout);active.set(target,stop);flush();return stop;
  }
  window.__lxStreamView=Object.freeze({patch,mirror});
})();

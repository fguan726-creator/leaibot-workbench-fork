(function(){
  "use strict";
  var selector='.assistant-panel .followups button,.assistant-panel [data-followups] button,.assistant-panel .lx-p0-suggest-chip,.lxfd-followups button,.lxfd-ai-body .followups button,.lxfd-ai-body [data-followups] button,.lxfd-ai-body .lx-p0-suggest-chip';
  var style=document.createElement('style');
  style.textContent=selector.split(',').map(function(s){return s+'::after';}).join(',')+'{content:""!important;display:inline-block!important;width:9px!important;height:5px!important;margin-left:5px!important;vertical-align:middle!important;background:currentColor!important;-webkit-mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;transform:rotate(-90deg) scale(0.6666667)!important;}';
  style.textContent+=selector+'{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;}';
  document.head.appendChild(style);
  function sync(){document.querySelectorAll(selector).forEach(function(button){
    var text = (button.textContent || '').replace(/\s/g, '').replace(/[→➜➝➞>›]+$/, '');
    if (/^对比第?1[、,，]2[、,，]3款$/.test(text)) {
      button.textContent = '帮我解读第3款商品';
      button.setAttribute('data-quick-ask', '帮我解读第3款商品');
      if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', '帮我解读第3款商品');
    }
    var walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT),nodes=[],node;
    while(node=walker.nextNode())nodes.push(node);
    nodes.forEach(function(node){if(/\s*[→➜➝➞]\s*$/.test(node.nodeValue))node.nodeValue=node.nodeValue.replace(/\s*[→➜➝➞]\s*$/,'');});
  });}
  var pending=false;new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;sync();});}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  sync();
})();

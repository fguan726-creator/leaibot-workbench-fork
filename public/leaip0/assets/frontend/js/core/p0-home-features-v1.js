/* Explicit feature boundaries: detail / orders / checkout. No eager business downloads. */
(() => {
  'use strict';
  if(window.__lxHomeFeatures?.version===2)return;
  const config=JSON.parse(document.getElementById('p0-home-feature-config').textContent);
  const resources=new Map(), features=new Map();let actionToken=0,replaying=false;
  function load(tag,url,anchor,id){
    const key=tag+':'+url;if(resources.has(key))return resources.get(key);
    const task=new Promise((resolve,reject)=>{
      const node=document.createElement(tag);let settled=false,timer;
      if(id)node.id=id;
      if(tag==='link'){node.rel='stylesheet';node.href=url;}else{node.src=url;node.async=false;}
      function finish(error){if(settled)return;settled=true;clearTimeout(timer);node.onload=node.onerror=null;if(error){node.remove();reject(error);}else resolve(node);}
      node.onload=()=>finish();node.onerror=()=>finish(new Error('功能资源加载失败，请重试'));
      timer=setTimeout(()=>finish(new Error('网络连接超时，请重试')),60000);
      try{if(anchor)anchor.before(node);else document.head.appendChild(node);}catch(error){finish(error);}
    });resources.set(key,task);task.catch(()=>{if(resources.get(key)===task)resources.delete(key);});return task;
  }
  function ensure(name){
    if(features.has(name))return features.get(name).task;
    const spec=config.features[name];if(!spec)return Promise.reject(new Error('未知功能：'+name));
    const entry={state:'loading'};features.set(name,entry);
    entry.task=Promise.all((spec.depends||[]).map(ensure)).then(()=>{
      // Start the script transfer together with CSS; execute only after CSS is ready.
      const hint=document.createElement('link');hint.rel='preload';hint.as='script';hint.href=spec.script;document.head.appendChild(hint);
      return Promise.all(spec.styles.map(s=>load('link',s.url,document.getElementById(s.anchor))))
        .then(()=>load('script',spec.script)).finally(()=>hint.remove());
    }).then(()=>{
      if(name==='orders' && document.readyState==='loading')return new Promise((resolve,reject)=>{let timer;const done=()=>{clearTimeout(timer);document.removeEventListener('DOMContentLoaded',done);resolve();};document.addEventListener('DOMContentLoaded',done,{once:true});timer=setTimeout(()=>{document.removeEventListener('DOMContentLoaded',done);reject(new Error('页面初始化超时，请重试'));},60000);});
    }).then(()=>{entry.state='ready';}).catch(error=>{entry.state='error';if(features.get(name)===entry)features.delete(name);throw error;});
    return entry.task;
  }
  const ready=name=>features.get(name)?.state==='ready';
  window.__lxHomeFeatures={version:2,detail:()=>ensure('detail'),orders:()=>ensure('orders'),commerce:()=>ensure('checkout'),get ready(){return ready('checkout');},states:()=>Object.fromEntries([...features].map(([k,v])=>[k,v.state]))};
  if(config.memberStyle)window.__lxLoadMemberStyles=()=>Promise.all((config.memberStyles||[{url:config.memberStyle,anchor:'p0-member-style-anchor'}]).map((s,n)=>load('link',s.url,document.getElementById(s.anchor),n===0?'lx-member-component-css':undefined)));
  function status(message,retry){
    document.getElementById('p0-feature-status')?.remove();const box=document.createElement('div');box.id='p0-feature-status';box.className='lx-p0-toast show';box.setAttribute('role',retry?'alert':'status');box.textContent=message;
    if(retry){const b=document.createElement('button');b.type='button';b.textContent='重试';b.onclick=retry;box.append(' ',b);}document.body.appendChild(box);
  }
  function run(name,action){const token=++actionToken;status(name==='orders'?'正在加载订单…':'正在准备商品与下单信息…');return ensure(name).then(()=>{
    if(token!==actionToken)return;document.getElementById('p0-feature-status')?.remove();return action();
  }).catch(()=>{if(token===actionToken)status('连接较慢，功能暂未加载完成',()=>run(name,action));});}
  for(const name of ['__lxOpenOrdersCenter','lxHandleCommerceQuery','lxHandleCommerceEntry']){
    const stub=(...args)=>run('orders',()=>{const fn=window[name];if(fn===stub||typeof fn!=='function')throw new Error('订单入口未准备好');return fn(...args);});window[name]=stub;
  }
  const orderSelector='.utility-btn[aria-label="订单"],[data-commerce-entry="orders"],[data-lxfd-open="orders"],[data-open-orders],[data-lx-result-id="info:orders"],[data-tab-id="info:orders"]';
  const sendSelector='.assistant-panel .send-btn,.assistant-panel [data-send],.assistant-panel button[type="submit"],.lxfd-send';
  const inputSelector='.assistant-panel .composer textarea,.lxfd-composer textarea';
  const isOrder=input=>/^(?:我要|我想|帮我)?(?:查看|查询|打开)?(?:我的)?订单(?:中心|列表|记录)?$/.test(String(input?.value||'').replace(/[\s，。！？、,.!?]/g,''));
  function intercept(event,name,action){event.preventDefault();event.stopImmediatePropagation();run(name,()=>{replaying=true;try{return action();}finally{replaying=false;}});}
  window.addEventListener('click',event=>{
    if(replaying||!(event.target instanceof Element))return;const button=event.target.closest('button,a,[role="button"]');if(!button||button.closest('.lx-tab-close'))return;
    const input=button.closest('form')?.querySelector('textarea')||document.querySelector(inputSelector);
    if(!ready('orders')&&(button.matches(orderSelector)||(button.matches(sendSelector)&&isOrder(input))))return intercept(event,'orders',()=>{if(button.isConnected)button.click();});
    const buy=!button.closest('[data-buy-modal-direct]')&&!button.dataset.bizQuote&&(button.matches('[data-buy-sku],[data-buy-now],[data-action="buy"],[data-order-action="buy"],[data-cart-checkout]')||/^(?:一键领取?优惠下单|一键领优惠下单|立即购买|立即下单|去购买|去下单|去结算|结算|提交订单)$/.test(button.textContent.replace(/\s+/g,'')));
    if(config.features.checkout&&!ready('checkout')&&buy)intercept(event,'checkout',()=>{if(button.isConnected)button.click();});
  },true);
  window.addEventListener('keydown',event=>{if(replaying||ready('orders')||event.key!=='Enter'||event.shiftKey||event.isComposing||!event.target.matches?.(inputSelector)||!isOrder(event.target))return;const input=event.target;intercept(event,'orders',()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true})));},true);
  window.addEventListener('submit',event=>{if(replaying||ready('orders')||!event.target.matches?.('.assistant-panel .composer,.lxfd-composer')||!isOrder(event.target.querySelector('textarea')))return;const form=event.target;intercept(event,'orders',()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));},true);
})();

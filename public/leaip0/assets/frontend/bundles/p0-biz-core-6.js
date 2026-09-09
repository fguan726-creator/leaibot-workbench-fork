
;/* public/leaip0/assets/frontend/js/core/product-floor-compare-v127.js */
(() => {
  if (window.__lxFloorCompareFixed) return;
  window.__lxFloorCompareFixed = true;
  const CARD_SELECTORS = ['.rank-item', '.floor-product', '.lx-floor-product', '.product-card', '.lx-floor-product-card', '[data-floor-product]'];
  const CARD_SELECTOR = CARD_SELECTORS.join(', ');
  const PICK_SELECTOR = CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn`).join(', ');
  const HOVER_SELECTOR = CARD_SELECTORS.map(selector => `${selector}:hover > .lx-pick-btn`).join(', ');
  const FOCUS_SELECTOR = CARD_SELECTORS.map(selector => `${selector}:focus-within > .lx-pick-btn`).join(', ');
  const CHECKED_SELECTOR = CARD_SELECTORS.map(selector => `${selector}.is-checked > .lx-pick-btn`).join(', ');
  const PICKED_SELECTOR = CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn.picked`).join(', ');
  const AUTO_PROMPTS = new Set(['帮我对比下这几款商品', '请帮我对比这几款商品', '对比这几款商品']);

  const style = document.createElement('style');
  style.dataset.productFloorCompare = 'v127';
  style.textContent = `
    ${CARD_SELECTOR}{position:relative}
    ${PICK_SELECTOR}{
      position:absolute;top:16px;right:16px;z-index:12;width:24px;height:24px;
      display:grid;place-items:center;padding:0;border:2px solid #b9a8ca;border-radius:6px;
      background:#fff;opacity:0;transform:scale(.9);cursor:pointer;
      transition:opacity .2s ease,transform .2s ease,background .2s ease,border-color .2s ease;
    }
    ${HOVER_SELECTOR},
    ${FOCUS_SELECTOR},
    ${CHECKED_SELECTOR},
    ${PICKED_SELECTOR}{opacity:1;transform:scale(1)}
    ${CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn:hover`).join(', ')}{border-color:#4d144a;background:#f7f1f8}
    ${PICKED_SELECTOR}{border-color:#4d144a;background:#4d144a}
    ${CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn img`).join(', ')}{display:none!important}
    ${CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn::after`).join(', ')}{
      content:'';width:6px;height:11px;border-right:2px solid transparent;border-bottom:2px solid transparent;
      transform:rotate(45deg) translate(-1px,-1px);transition:border-color .2s ease;
    }
    ${CARD_SELECTORS.map(selector => `${selector} > .lx-pick-btn.picked::after`).join(', ')}{border-color:#fff}
  `;
  style.textContent += '.rank-item > .lx-pick-btn{display:none!important;pointer-events:none!important}';
  document.head.appendChild(style);
  const roots = new Set([document]);
  window.__lxFloorFindCard = sku => {
    for (const root of roots) {
      const found = Array.from(root.querySelectorAll(CARD_SELECTOR)).find(card => cardSku(card) === String(sku));
      if (found) return found;
    }
  };
  const all = selector => Array.from(roots).flatMap(root => Array.from(root.querySelectorAll(selector)));

  const cardSku = card => String(card?.dataset?.productId || card?.dataset?.sku || card?.dataset?.openProduct || card?.dataset?.floorProduct || '').trim();

  function enhanceCard(card) {
    if (!(card instanceof HTMLElement)) return;
    const sku = cardSku(card);
    if (!sku) return;
    // 接入主应用既有商品引用状态、飞入动画和对比页，不复制业务状态。

    if (card.dataset.sku !== sku) card.dataset.sku = sku;
    // 勾选按钮由本补丁先注入时，主应用会跳过重复初始化；因此需在这里
    // 同步补齐原生商品/解决方案卡使用的 draggable 标记。
    if (!card.draggable) card.draggable = true;
    // Ranking rows retain their existing navigation/drag behavior, without selection controls.
    if (card.matches('.rank-item')) return;
    let button = Array.from(card.children).find(child => child.classList.contains('lx-pick-btn'));
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'lx-pick-btn';
      button.dataset.pickSku = sku;
      button.title = '选择商品进行对比';
      button.setAttribute('aria-label', '选择商品进行对比');
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<img src="../icons/global-check.svg" alt="" aria-hidden="true">';
      card.appendChild(button);
    }
    if (button.dataset.pickSku !== sku) button.dataset.pickSku = sku;
  }

  function enhance(root = document) {
    if (root.matches?.(CARD_SELECTOR)) enhanceCard(root);
    root.querySelectorAll?.(CARD_SELECTOR).forEach(enhanceCard);
    const hosts = [root, ...root.querySelectorAll?.('*') || []];
    hosts.forEach(host => {
      const shadow = host.shadowRoot;
      if (!shadow || roots.has(shadow)) return;
      roots.add(shadow);
      shadow.appendChild(style.cloneNode(true));
      observe(shadow);
      enhance(shadow);
    });
  }

  let previousSelected = 0;
  function normalizePrompt() {
    const textarea = document.querySelector('.assistant-panel .composer textarea, .composer textarea');
    if (!textarea) return;
    const refs = window.__lxState?.refProducts;
    if (!Array.isArray(refs)) return;
    const products = refs.filter(item => item.type !== 'solution');
    const selectedSkus = new Set(products.map(item => String(item.sku)));
    const selected = selectedSkus.size;
    all(PICK_SELECTOR).forEach(button => {
      const picked = selectedSkus.has(button.dataset.pickSku);
      if (button.classList.contains('picked') !== picked) button.classList.toggle('picked', picked);
      if (button.getAttribute('aria-pressed') !== String(picked)) button.setAttribute('aria-pressed', String(picked));
    });
    const current = textarea.value.trim();
    if (selected >= 2 && (selected !== previousSelected || !current || AUTO_PROMPTS.has(current))) {
      if (textarea.value !== '对比这几款商品') {
        textarea.value = '对比这几款商品';
        textarea.dataset.refAutoPrompt = '对比这几款商品';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (selected < 2 && AUTO_PROMPTS.has(current)) {
      textarea.value = '';
      delete textarea.dataset.refAutoPrompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    previousSelected = selected;
  }

  const observer = new MutationObserver(records => {
    for (const root of roots) if (root.host && !root.querySelector("style[data-product-floor-compare]")) root.appendChild(style.cloneNode(true));
    for (const record of records) {
      if (record.type === "attributes") enhanceCard(record.target);
      record.addedNodes.forEach(node => node.nodeType === 1 && enhance(node));
    }
    queueMicrotask(normalizePrompt);
  });
  function observe(root) {
    observer.observe(root === document ? document.body : root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-product-id', 'data-sku', 'data-open-product'] });
  }
  observe(document);
  enhance();
  window.__lxSyncFloorPicks = normalizePrompt;
  // All native card selectors must include shadow-floor cards without adding layout classes.
  // Poll only known hosts to catch shadow roots attached after insertion.
  const hostTimer = setInterval(() => {
    document.querySelectorAll('.p-shop-floor-embed').forEach(host => enhance(host));
    for (const root of roots) if (root.host && !root.host.isConnected) roots.delete(root);
  }, 1200);
  window.addEventListener('pagehide', () => { clearInterval(hostTimer); observer.disconnect(); }, {once:true});
  let pointerStart = null, suppressUntil = 0;
  window.addEventListener('pointerdown', event => {
    const card = event.composedPath().find(node => node?.matches?.(CARD_SELECTOR));
    pointerStart = card && event.button === 0 ? {x:event.clientX,y:event.clientY,moved:false} : null;
  }, true);
  window.addEventListener('pointermove', event => {
    if (pointerStart && Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6) pointerStart.moved=true;
  }, true);
  window.addEventListener('pointerup', () => {
    if (pointerStart?.moved) suppressUntil=Date.now()+400;
    pointerStart=null;
  }, true);
  window.addEventListener('click', event => {
    if (Date.now()<suppressUntil && event.composedPath().some(node=>node?.matches?.(CARD_SELECTOR))) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('click', event => {
    if (!event.composedPath().some(node=>node?.matches?.('.lx-pick-btn'))) return;
    window.setTimeout(normalizePrompt, 620);
  });
})();

;


;/* public/leaip0/assets/frontend/js/core/composer-association-popup-toggle-v106.js */
(function () {
  "use strict";

  // Composer associations use the original keyword and progressive completion flow.
  // Enabled by default for fullscreen and split-screen composers.
  window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = true;

  const SELECTOR = ".lx-suggest-panel";
  const STYLE_ID = "lx-composer-association-popup-off";

  function associationsEnabled() {
    return window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ === true;
  }

  function removePanels(root) {
    if (associationsEnabled()) return;
    if (root instanceof Element && root.matches(SELECTOR)) root.remove();
    root?.querySelectorAll?.(SELECTOR).forEach((panel) => panel.remove());
  }

  function syncStyle() {
    let style = document.getElementById(STYLE_ID);
    if (associationsEnabled()) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `${SELECTOR}{display:none!important;visibility:hidden!important;pointer-events:none!important;}`;
      document.head.appendChild(style);
    }
  }

  function disableAssociationPanels() {
    syncStyle();
    removePanels(document);
    window.__lxHideSuggest?.();
  }

  const observer = new MutationObserver((records) => {
    if (associationsEnabled()) return;
    records.forEach((record) => record.addedNodes.forEach((node) => removePanels(node)));
  });

  function start() {
    disableAssociationPanels();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__lxSetComposerAssociationsEnabled = function (enabled) {
    window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = enabled === true;
    syncStyle();
    if (!associationsEnabled()) disableAssociationPanels();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

;


;/* public/leaip0/channel-customer-service-v126.js */
(function(){
  'use strict';
  if(window.__lxCustomerServiceV126)return;
  window.__lxCustomerServiceV126=true;
  const urls={
    'shop-chat':'https://lecs.lenovo.com.cn/',
    'b-chat':'https://b.lenovo.com.cn/activity/qygzxdhym.html',
    'biz-chat':'https://biz.lenovo.com.cn/activity/zqzxfljhy.html'
  };
  window.addEventListener('click',function(event){
    const trigger=event.composedPath().find(node=>node?.matches?.('[data-customer-service-url], .shortcut-row button, .shortcut-row a, .more-menu .menu-row'));
    if(!trigger||(trigger.textContent||'').trim()!=='客服')return;
    const channel=location.pathname.split('/').find(part=>Object.hasOwn(urls,part))||({personal:'shop-chat',business:'b-chat',enterprise:'biz-chat'})[document.body.dataset.page];
    const url=urls[channel];if(!url)return;
    event.preventDefault();event.stopImmediatePropagation();
    window.open(url,'_blank','noopener,noreferrer');
  },true);
})();

;


;/* public/leaip0/assets/frontend/js/core/whitepaper-action-cards-v124.js */
/* Whitepaper reply actions: reuse compact modal-entry cards without changing actions. */
(function(){
  'use strict';
  if(window.__lxWhitepaperActionCardsV124)return;
  window.__lxWhitepaperActionCardsV124=true;
  const selector='.lx-p0-message.ai, .msg.ai';
  function update(message){
    if(!/白皮书/.test(message.textContent||''))return;
    message.querySelectorAll('button').forEach(button=>{
      if(button.classList.contains('lx-whitepaper-action-card'))return;
      const title=(button.textContent||'').trim();
      if(title!=='在线咨询'&&title!=='提交项目需求')return;
      button.classList.remove('lx-p0-btn','primary');
      button.classList.add('answer-cta','lx-answer-page','lx-auth-answer-card','lx-edu-auth-reco','lx-whitepaper-action-card');
      const label=document.createElement('span');
      label.className='answer-cta-title';label.textContent=title;
      const arrow=document.createElement('span');
      arrow.className='answer-cta-icon';arrow.setAttribute('aria-hidden','true');
      const icon=document.createElement('img');icon.src='/icons/global-next.svg';icon.alt='';
      arrow.appendChild(icon);button.replaceChildren(label,arrow);
      if(button.parentElement?.classList.contains('lx-p0-actions'))button.parentElement.classList.add('lx-whitepaper-modal-actions');
    });
  }
  const style=document.createElement('style');
  style.textContent='.lx-whitepaper-modal-actions{display:flex!important;flex-direction:column;align-items:flex-start;gap:8px!important}.lx-whitepaper-modal-actions>.lx-whitepaper-action-card{margin:0!important}';
  document.head.appendChild(style);
  document.querySelectorAll(selector).forEach(update);
  const pending=new Set();let scheduled=false;
  new MutationObserver(records=>{
    records.forEach(record=>{
      const el=record.target.nodeType===1?record.target:record.target.parentElement;
      const message=el?.closest(selector);if(message)pending.add(message);
      record.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches(selector))pending.add(node);node.querySelectorAll(selector).forEach(el=>pending.add(el));});
    });
    if(scheduled||!pending.size)return;scheduled=true;
    queueMicrotask(()=>{scheduled=false;pending.forEach(update);pending.clear();});
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
})();

;


;/* public/leaip0/assets/frontend/js/core/channel-hotline-v125.js */
(function(){
 'use strict';
 if(window.__lxChannelHotlineV125)return;window.__lxChannelHotlineV125=true;
 window.addEventListener('click',function(event){
  const button=event.composedPath().find(node=>node?.matches?.('.shortcut-row button, .shortcut-row a'));
  if(!button||(button.textContent||'').trim()!=='咨询热线')return;
  const channel=location.pathname.split('/').filter(Boolean)[0];
  const name=channel==='b-chat'?'中小企业':channel==='biz-chat'?'政教及大企业':'';
  if(!name||typeof window.__lxBridge?.sendChat!=='function')return;
  event.preventDefault();event.stopImmediatePropagation();
  window.__lxBridge.sendChat(name+'的咨询热线是多少？');
 },true);
})();

;


;/* public/leaip0/assets/frontend/js/core/reco-names-v137.js */
(function(){
'use strict';
if(window.__lxRecoNamesV139)return;window.__lxRecoNamesV139=true;
const cache=new Map(),seen=new WeakMap();
function syncMatchLabel(row){
 const label=row.querySelector('.lx-reco-poc-label');
 if(!label)return;
 let group=label.closest('.lx-reco-poc-label-group');
 if(!group){
  group=document.createElement('div');
  group.className='lx-reco-poc-label-group';
  label.parentNode.insertBefore(group,label);
  group.appendChild(label);
 }
 let match=group.querySelector('.lx-reco-match-label');
 if(!match){
  match=document.createElement('span');
  match.className='lx-reco-match-label';
  group.appendChild(match);
 }
 const value='推荐度：已有 2 项满足';
 if(match.dataset.recommendationSummary!==value){
  match.dataset.recommendationSummary=value;
  match.innerHTML='<svg class="lx-reco-match-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 5-8a3 3 0 0 1 2 4v4h5a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"/></svg><span>'+value+'</span>';
 }
 match.setAttribute('aria-label',value);
}
function detail(sku){
 if(!cache.has(sku))cache.set(sku,fetch('/api/products/'+encodeURIComponent(sku)).then(r=>{if(!r.ok)throw Error('product unavailable');return r.json();}).catch(()=>null));
 return cache.get(sku);
}
async function update(row){
 syncMatchLabel(row);
 const sku=row.getAttribute('data-open-product');
 if(!sku||seen.get(row)===sku)return;
 seen.set(row,sku);
 const product=await detail(sku);
 if(!product||!row.isConnected||row.getAttribute('data-open-product')!==sku)return;
 let specs=product.specs||{};if(typeof specs==='string'){try{specs=JSON.parse(specs);}catch(_){specs={};}}
 const name=String(product.sku_name||product.skuName||product.name||'').trim();
 const spu=String(product.spu_name||product.spuName||specs.spu_name||specs.spuName||'').trim();
 const title=row.querySelector('.lx-reco-poc-copy > strong, .reco-row-main > strong');
 const label=row.querySelector('.lx-reco-poc-label');
 if(title&&name){title.textContent=name;title.title=name;title.classList.toggle("lx-leading-cjk-bracket", /^\s*【/.test(name));}
 if(label){label.textContent=spu;label.title=spu;label.hidden=!spu;}
 const img=row.querySelector('.lx-reco-poc-thumb img');if(img&&name)img.alt=name;
}
let queued=false;
function scan(){queued=false;document.querySelectorAll('.reco-page .lx-reco-poc-row[data-open-product]').forEach(update);}
new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(scan);}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-open-product']});
scan();
})();

(() => {
  const MAX_COMPARE_ITEMS = 5;

  window.addEventListener('click', event => {
    const button = event.composedPath().find(node => node?.matches?.('[data-reco-select]'));
    if (!button || button.dataset.lxProductFlightPending === 'true') return;

    const page = button.closest('.lx-reco-poc-page');
    if (!page) return;

    const selected = button.classList.contains('active');
    const selectedCount = page.querySelectorAll('[data-reco-select].active').length;
    if (!selected && selectedCount >= MAX_COMPARE_ITEMS) return;

    const nextSelected = !selected;
    button.classList.toggle('active', nextSelected);
    button.setAttribute('aria-pressed', nextSelected ? 'true' : 'false');
    button.setAttribute('aria-label', nextSelected ? '取消选择' : '选择商品进行对比');
    button.closest('.lx-reco-poc-row')?.classList.toggle('selected', nextSelected);

    button.animate(
      [
        { transform: 'scale(.96)' },
        { transform: 'scale(1.015)' },
        { transform: 'scale(1)' }
      ],
      { duration: 180, easing: 'cubic-bezier(.22,.61,.36,1)' }
    );
  }, true);
})();

;


;/* public/leaip0/assets/frontend/js/core/compare-column-detail-v141.js */
(()=>{
 if(window.__lxCompareColumnDetailV141)return;window.__lxCompareColumnDetailV141=true;
 const selector='.lx-product-compare .lx-pc-grid > .lx-pc-cell[data-col]';
 function target(event){return event.target?.closest?.(selector);}
 function open(event,cell){
  if(!cell||event.target.closest('button,a,input,select,textarea'))return;
  const head=Array.from(cell.parentElement.querySelectorAll('.lx-pc-product-head[data-col]')).find(h=>h.dataset.col===cell.dataset.col);
  const sku=head?.getAttribute('data-cmp-recommend');
  if(!sku||typeof window.__lxAgentAPI?.openProduct!=='function')return;
  event.preventDefault();event.stopImmediatePropagation();
  window.__lxAgentAPI.openProduct(sku);
 }
 window.addEventListener('click',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;if(window.getSelection()?.toString())return;open(event,target(event));},true);
 window.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const cell=target(event);if(cell&&event.target===cell)open(event,cell);},true);
 const style=document.createElement('style');style.textContent=selector+'{cursor:pointer}'+selector+':focus-visible{outline:2px solid #4d144a;outline-offset:-2px}';document.head.appendChild(style);
 function sync(){document.querySelectorAll('.lx-product-compare .lx-pc-product-head[data-col]').forEach(head=>{const name=head.querySelector('.lx-pc-title')?.getAttribute('title')||'商品';if(head.getAttribute('role')!=='link'){head.setAttribute('role','link');head.setAttribute('aria-label','查看'+name+'详情');head.removeAttribute('aria-pressed');}});}
 new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});sync();
})();

;

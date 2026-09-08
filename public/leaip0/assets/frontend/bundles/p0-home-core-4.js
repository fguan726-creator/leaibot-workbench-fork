
;/* public/leaip0/assets/frontend/js/core/product-card-detail-loading-v139.js */
(() => {
  if (window.__lxProductCardDetailLoadingV139) return;
  window.__lxProductCardDetailLoadingV139 = true;

  const CARD_SELECTOR = [
    '.rank-item',
    '.floor-product',
    '.lx-floor-product',
    '.product-card',
    '.lx-floor-product-card',
    '[data-floor-product]',
    '.lx-sim-card',
    '.lx-p0-product-mini',
    '.reco-row'
  ].join(',');

  const productKey = card => String(
    card?.dataset?.productId ||
    card?.dataset?.sku ||
    card?.dataset?.openProduct ||
    card?.getAttribute?.('data-product-id') ||
    ''
  ).trim();

  const findProduct = (key, card) => {
    const state = window.__lxState || {};
    const pools = [
      state.officialProducts ? Object.values(state.officialProducts) : [],
      state.products,
      state.siteProducts,
      state.refProducts
    ];
    for (const pool of pools) {
      const hit = Array.isArray(pool) && pool.find(item => {
        const sku = String(item?.sku || item?.productId || item?.id || '').trim();
        return sku && sku === key;
      });
      if (hit) return hit;
    }
    const name = card?.querySelector?.('.product-name, .rank-name, .floor-product-name, h3, strong')?.textContent?.trim();
    const image = card?.querySelector?.('img')?.currentSrc || card?.querySelector?.('img')?.src || '';
    const priceText = card?.querySelector?.('.price, .product-price, .rank-price')?.textContent || '';
    const price = Number(String(priceText).replace(/[^\d.]/g, '')) || 0;
    return name ? { sku: key, name, image_url: image, price } : key;
  };

  let openSequence = 0;
  const showGeneration = (ready, sequence) => {
    let settled = false;
    Promise.resolve(ready).then(() => { settled = true; }, () => { settled = true; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const content = document.querySelector('.content');
      if (!content || settled || sequence !== openSequence) return;
      content.querySelectorAll('.lx-page-generating').forEach(node => node.remove());
      const overlay = document.createElement('div');
      overlay.className = 'lx-page-generating';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML = '<div class="lx-page-gen-card lx-page-gen-card--aurora"><div class="lx-page-gen-aurora-field" aria-hidden="true"><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--a"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--b"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--c"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--d"></i><span class="lx-page-gen-aurora-lens"></span></div><div class="lx-page-gen-head"><div class="lx-page-gen-copy"><strong>正在生成商品页</strong><em>联想乐享正在整理商品信息、优惠和推荐理由</em></div></div></div>';
      content.appendChild(overlay);
      content.scrollTop = 0;
      content.classList.add('is-generating-tab');
      requestAnimationFrame(() => overlay.classList.add('is-show'));
      Promise.resolve(ready).catch(() => {}).then(() => {
        if (sequence !== openSequence || !overlay.isConnected) { overlay.remove(); return; }
        overlay.classList.add('is-done');
        overlay.classList.remove('is-show');
        content.classList.remove('is-generating-tab');
        window.setTimeout(() => overlay.remove(), 260);
      });
    }));
  };

  const openCard = card => {
    const key = productKey(card);
    if (!key) return false;
    const api = window.__lxAgentAPI;
    if (typeof api?.openProduct !== 'function') return false;
    const sequence = ++openSequence;
    const preserveState = document.body.dataset.state;
    const ready = api.openProduct(findProduct(key, card));
    if (preserveState) document.body.dataset.state = preserveState;
    showGeneration(ready, sequence);
    return true;
  };

  document.addEventListener('click', event => {
    if (event.composedPath().some(node => node?.matches?.('[data-pick-sku], .lx-pick-btn, [data-reco-select], .lx-reco-poc-selector, [data-reco-buy], .lx-reco-poc-buy'))) return;
    const card = event.composedPath().find(node => node?.matches?.(CARD_SELECTOR));
    if (!card || card.closest?.('.product-detail, .lx-product-detail-page')) return;
    if (!openCard(card)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target?.closest?.('[data-pick-sku], .lx-pick-btn, [data-reco-select], .lx-reco-poc-selector, [data-reco-buy], .lx-reco-poc-buy')) return;
    const card = event.target?.closest?.(CARD_SELECTOR);
    if (!card || !openCard(card)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
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


;/* public/leaip0/assets/frontend/js/core/product-intent-turn-guard-v2.js */
(function () {
  "use strict";

  if (window.__lxProductIntentTurnGuardV2) return;
  window.__lxProductIntentTurnGuardV2 = true;

  var PRODUCT_INTENT = /(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i;
  var SERVICE_INTENT = /清灰|清洁|换硅脂|散热保养|整机保养|维修|保修|延保|服务商品|服务产品/;
  var PRODUCT_CARD = ".lx-answer-reco,[data-lxfd-reveal-products],[data-lx-focus-reco],[data-lxfd-reco-id]";
  var lastQuery = "";

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isProductIntent(value) {
    return PRODUCT_INTENT.test(normalize(value)) || SERVICE_INTENT.test(normalize(value));
  }

  function latestUserQuery(scope) {
    // A restored result belongs to its own turn, not the most recent question.
    var turn = scope && scope.closest && scope.closest(".lx-p0-message,.lxfd-msg,.lxfd-msg-ai");
    if (turn) {
      var previous = turn.previousElementSibling;
      while (previous) {
        if (previous.matches(".lx-p0-message.user,.lxfd-msg.user,.lxfd-msg-user")) return normalize(previous.textContent);
        previous = previous.previousElementSibling;
      }
    }
    var root = scope && scope.closest ? scope.closest(".lx-p0-messages,.lxfd-thread") : null;
    var nodes = (root || document).querySelectorAll(
      ".lx-p0-message.user .user-bubble,.lx-p0-message.msg.user .user-bubble,.lxfd-msg.user,.lxfd-msg-user"
    );
    return nodes.length ? normalize(nodes[nodes.length - 1].textContent) : lastQuery;
  }

  function clearProductTurnState() {
    var states = [window.__lxState, window.__lxfdState, window.__lxChatState];
    states.forEach(function (state) {
      if (!state) return;
      state.lastProducts = null;
      state.lastProductsMeta = null;
      state.officialProducts = null;
    });
  }

  function recordQuery(value) {
    var query = normalize(value);
    if (!query) return;
    lastQuery = query;
    window.__lxCurrentQueryProductIntent = isProductIntent(query);
    if (!window.__lxCurrentQueryProductIntent) clearProductTurnState();
  }

  function readComposer(target) {
    var form = target && target.closest ? target.closest("form,.composer,.lxfd-composer") : null;
    var input = form && form.querySelector("textarea,input:not([type=hidden])");
    return input ? input.value : "";
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".send-btn,.hero-send-btn,.lxfd-send,[data-send],[data-chat-send]")) return;
    recordQuery(readComposer(event.target));
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.shiftKey || !event.target.matches("textarea,input")) return;
    if (!event.target.closest(".composer,.lxfd-composer,.assistant-bottom,.hero-composer")) return;
    recordQuery(event.target.value);
  }, true);

  function removeInvalidProductCards(root) {
    var cards = [];
    if (root && root.matches && root.matches(PRODUCT_CARD)) cards.push(root);
    if (root && root.querySelectorAll) cards = cards.concat(Array.from(root.querySelectorAll(PRODUCT_CARD)));
    cards.forEach(function (card) {
      var query = latestUserQuery(card);
      if (query && !isProductIntent(query)) card.remove();
    });
  }

  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches(".lx-p0-message.user,.lxfd-msg.user,.lxfd-msg-user")) recordQuery(node.textContent);
        removeInvalidProductCards(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  function wrapBridge() {
    var bridge = window.__lxBridge;
    if (!bridge || bridge.__productIntentTurnGuardV2) return;
    bridge.__productIntentTurnGuardV2 = true;
    ["revealProducts", "focusReco"].forEach(function (name) {
      var original = bridge[name];
      if (typeof original !== "function") return;
      bridge[name] = function () {
        var clickedCard = document.activeElement && document.activeElement.closest(PRODUCT_CARD);
        var query = latestUserQuery(clickedCard || document.querySelector(".lx-p0-messages,.lxfd-thread"));
        if (query && !isProductIntent(query)) {
          clearProductTurnState();
          return false;
        }
        return original.apply(this, arguments);
      };
    });
  }

  wrapBridge();
  window.setTimeout(wrapBridge, 0);
  window.setTimeout(wrapBridge, 500);
  removeInvalidProductCards(document);

  window.__lxIsProductIntent = isProductIntent;
})();

;


;/* public/leaip0/assets/frontend/js/core/empty-hover-backplate-collapse-v1.js */
(function () {
  "use strict";

  if (window.__lxEmptyHoverBackplateCollapseV1) return;
  window.__lxEmptyHoverBackplateCollapseV1 = true;

  function hasVisiblePrompt(bottom) {
    var panel = bottom && bottom.querySelector(".hover-prompt-panel");
    if (!panel) return false;
    var list = panel.querySelector("[data-hover-prompt-list],.hover-prompt-list") || panel;
    return Array.from(list.children || []).some(function (child) {
      return !child.hidden && child.getAttribute("aria-hidden") !== "true" && String(child.textContent || "").trim();
    });
  }

  function collapseEmptyBackplates(root) {
    var bottoms = [];
    if (root && root.matches && root.matches(".assistant-bottom")) bottoms.push(root);
    if (root && root.querySelectorAll) bottoms = bottoms.concat(Array.from(root.querySelectorAll(".assistant-bottom")));
    if (!bottoms.length && root === document) bottoms = Array.from(document.querySelectorAll(".assistant-bottom"));

    bottoms.forEach(function (bottom) {
      if (hasVisiblePrompt(bottom)) return;
      bottom.classList.remove("has-hover-prompts");
      var panel = bottom.querySelector(".hover-prompt-panel");
      if (panel) {
        panel.style.removeProperty("height");
        panel.style.removeProperty("min-height");
      }
      var assistant = bottom.closest(".assistant-panel");
      if (assistant) assistant.classList.remove("assistant-hover-active", "assistant-glass-active");
    });
  }

  var queued = false;
  function schedule(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      collapseEmptyBackplates(root || document);
    });
  }

  new MutationObserver(function (records) {
    var relevant = records.some(function (record) {
      var target = record.target && record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return target && target.closest && target.closest(".assistant-bottom,.hover-prompt-panel");
    });
    if (relevant) schedule(document);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "aria-hidden"] });

  document.addEventListener("transitionend", function (event) {
    if (event.target && event.target.closest && event.target.closest(".assistant-bottom")) schedule(document);
  }, true);

  schedule(document);
})();

;

(function (root) {
  'use strict';
  const PAGE_SIZE = 12;
  const LABELS = { news: '新闻', cases: '案例' };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function safeURL(value, image = false) {
    try {
      const url = new URL(String(value || '').replace(/^\/\//, 'https://'));
      if (url.protocol === 'http:') url.protocol = 'https:';
      const trusted = image ? /^(?:p[1-9]|pimage)\.lefile\.cn$/.test(url.hostname)
        : ['brand.lenovo.com.cn', 'biz.lenovo.com.cn'].includes(url.hostname);
      return url.protocol === 'https:' && trusted && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }

  function requestURL(kind, filters = {}) {
    if (!LABELS[kind]) throw new Error('Unknown brand list');
    const condition = { type: kind === 'news' ? 60 : 66, startTime: filters.year || '' };
    if (kind === 'cases') condition.industryCategory = filters.industry || '';
    const query = new URLSearchParams({ id: '85', type: 'brand', page: String(Math.max(1, Math.floor(Number(filters.page) || 1))), size: String(PAGE_SIZE), keyword: String(filters.query || '').trim(), aggs: JSON.stringify(kind === 'news' ? ['startTimeAggs'] : ['startTimeAggs', 'industryCategory']), condition: JSON.stringify(condition), sort: JSON.stringify([{ field: kind === 'news' ? 'startTimeStr' : 'endTimeStr', order: 'desc' }]) });
    return `https://s.lenovo.com.cn/search/brand?${query}`;
  }

  function normalizeResponse(data) {
    if (!data || !Array.isArray(data.items) || !Number.isFinite(Number(data.totalNum)) || Number(data.totalNum) < 0) throw new Error('Invalid brand response');
    const facets = name => (data.filterV2 || []).find(f => f.name === name)?.items || [];
    const items = data.items.map(item => ({
      id: String(item.id || item.code || ''), title: String(item.title || ''),
      url: safeURL(item.pcUrl), image: safeURL(item.pcCoverImg, true),
      date: /^\d{4}-\d{2}-\d{2}/.exec(item.startTimeStr || '')?.[0] || '',
      industries: Array.isArray(item.industryCategory) ? item.industryCategory.map(String) : []
    })).filter(item => item.title && item.url);
    if (data.items.length && !items.length) throw new Error('No valid brand entries');
    return { total: Math.floor(Number(data.totalNum)), items,
      years: facets('startTimeAggs').map(f => String(f.name).split('|').pop()),
      industries: facets('industryCategory').map(f => String(f.name)) };
  }

  function pageNumbers(page, pages) {
    if (pages < 1) return [];
    const numbers = [...new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2])].filter(n => n > 0 && n <= pages).sort((a, b) => a - b);
    return numbers.flatMap((n, i) => i && n - numbers[i - 1] > 1 ? (n - numbers[i - 1] === 2 ? [n - 1, n] : ['gap', n]) : [n]);
  }

  const api = { requestURL, normalizeResponse, pageNumbers, safeURL, escapeHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root?.document) return;

  const cache = new Map();
  async function load(kind, page = 1) {
    const key=kind+':'+page;if(cache.has(key))return cache.get(key);
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{const r=await fetch(requestURL(kind,{page}),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('加载失败');const data=normalizeResponse(await r.json());cache.set(key,data);return data;}finally{clearTimeout(timer);}
  }
  function render(kind,data,page=1) {
    const pages=Math.max(1,Math.ceil(data.total/PAGE_SIZE)),esc=escapeHTML;
    return `<section class="lxbrand-all" data-brand-kind="${kind}" data-brand-current="${page}"><div class="lxbrand-all-summary">共 ${data.total.toLocaleString('zh-CN')} ${kind==='news'?'条新闻':'个案例'}</div><div class="lxbrand-all-grid">${data.items.map(x=>`<a class="lxbrand-all-card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(x.title)}">${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<div class="lxbrand-all-noimage">联想'+LABELS[kind]+'</div>'}<div><small>${esc(kind==='news'?x.date.replaceAll('-','.'):(x.industries[0]||'企业案例'))}</small><h3>${esc(x.title)}</h3></div></a>`).join('')}</div>${data.items.length?'':'<p>暂无相关内容</p>'}<nav class="lxbrand-all-pages" aria-label="${LABELS[kind]}分页"><button type="button" data-brand-pagination="${page-1}" ${page===1?'disabled':''}>上一页</button>${pageNumbers(page,pages).map(n=>n==='gap'?'<span>…</span>':`<button type="button" data-brand-pagination="${n}" ${n===page?'aria-current="page"':''}>${n}</button>`).join('')}<button type="button" data-brand-pagination="${page+1}" ${page>=pages?'disabled':''}>下一页</button></nav><p class="lxbrand-all-status" role="status" aria-live="polite"></p></section>`;
  }
  root.__lxBrandChannel={load,render};
  document.addEventListener('click',async event=>{
    const trigger=event.target.closest('.lx-brand-shortcut,.lxbrand-section-heading>a');
    if(trigger&&document.body.dataset.page==='brand'){
      event.preventDefault();event.stopImmediatePropagation();
      if(root.__lxState?.sending)return;
      const query=trigger.textContent.includes('新闻')?'查看更多新闻':'查看更多案例';
      root.__lxBridge?.sendChat(query);return;
    }
    const button=event.target.closest('[data-brand-pagination]');if(!button||button.disabled)return;
    const panel=button.closest('.lxbrand-all'),kind=panel.dataset.brandKind,page=Number(button.dataset.brandPagination);
    event.preventDefault();event.stopImmediatePropagation();
    const tabId='info:brand-'+kind;panel.querySelector('.lxbrand-all-status').textContent='正在加载第 '+page+' 页…';panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const data=await load(kind,page);if(root.__lxState?.activeTabId!==tabId)return;root.__lxBridge.openBrandList(kind,render(kind,data,page));}
    catch(_){if(!panel.isConnected)return;panel.querySelector('.lxbrand-all-status').textContent='加载失败，请点击页码重试。';panel.querySelectorAll('button').forEach(b=>{b.disabled=false;});}
  },true);
  const seen=new WeakSet(),resize=new ResizeObserver(entries=>entries.forEach(({target})=>{const w=target.clientWidth;target.style.setProperty('--brand-columns',w>=1320?6:w>=1100?5:w<600?2:4);}));
  const observe=()=>document.querySelectorAll('.lxbrand-all').forEach(el=>{if(!seen.has(el)){seen.add(el);resize.observe(el);}});
  observe();new MutationObserver(observe).observe(document.querySelector('.content')||document.body,{childList:true,subtree:true});
})(typeof window === 'undefined' ? null : window);

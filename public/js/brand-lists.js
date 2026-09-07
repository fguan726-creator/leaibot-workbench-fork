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

  const panels = new Map();
  const icon = (name, className = '') => `<img class="${className}" src="/assets/icons/${name}.svg" alt="" width="16" height="16">`;
  const bridge = root.__lxBridge;
  if (!bridge?.registerPageRenderer || !bridge?.openPage) return;

  const assistant = document.querySelector('.assistant-panel');
  const assistantBottom = document.querySelector('.assistant-bottom');
  function fitAssistantContent() {
    if (!assistant || !assistantBottom || document.body.dataset.page !== 'brand' || document.body.classList.contains('assistant-fullscreen')) return;
    const bottom = assistantBottom.getBoundingClientRect().top;
    for (const [selector, property] of [['.default-state', '--lx-brand-welcome-height'], ['.lx-p0-messages', '--lx-brand-messages-height']]) {
      const content = assistant.querySelector(selector);
      if (content?.getClientRects().length) assistant.style.setProperty(property, `${Math.max(0, bottom - content.getBoundingClientRect().top - 16)}px`);
    }
  }
  if (assistant && assistantBottom && root.ResizeObserver) {
    const observer = new ResizeObserver(fitAssistantContent);
    observer.observe(assistant);
    observer.observe(assistantBottom);
    new MutationObserver(() => requestAnimationFrame(fitAssistantContent)).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-page', 'data-state'] });
  }

  function readFilters(kind) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`lx.brand-list.${kind}`) || '{}');
      return { page: saved.query || saved.year || saved.industry ? 1 : Math.max(1, Math.floor(Number(saved.page) || 1)) };
    } catch (_) { return { query: '', year: '', industry: '', page: 1 }; }
  }

  function createPanel(kind) {
    const panel = document.createElement('section');
    panel.className = 'lxbrand-list';
    panel.dataset.brandListKind = kind;
    panel.innerHTML = `<header class="lxbrand-list-head"><button type="button" class="lxbrand-icon-button" data-brand-back aria-label="返回品牌" title="返回品牌">${icon('chevron-right', 'lxbrand-reverse')}</button><h1 tabindex="-1">${LABELS[kind]}</h1></header>
      <div class="lxbrand-list-summary" role="status" aria-live="polite"></div>
      <div class="lxbrand-list-results"></div><nav class="lxbrand-list-pagination" aria-label="${LABELS[kind]}分页"></nav>`;
    const entry = { panel, kind, filters: readFilters(kind), controller: null, loaded: false, data: null };
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-brand-back]')) {
        bridge.openPage({ id: 'site:brand', kind: 'site', page: 'brand', label: '品牌' });
        return;
      }
      const page = event.target.closest('[data-brand-page]');
      if (page && !page.disabled) {
        entry.filters.page = Number(page.dataset.brandPage);
        loadList(entry);
        panel.closest('.content')?.scrollTo({ top: 0, behavior: 'auto' });
        panel.querySelector('h1').focus({ preventScroll: true });
      }
      if (event.target.closest('[data-brand-retry]')) loadList(entry);
    });
    panel.addEventListener('error', event => {
      if (event.target.matches('.lxbrand-list-photo img')) {
        event.target.hidden = true;
        event.target.parentElement.classList.add('is-unavailable');
      }
    }, true);
    return entry;
  }

  async function loadList(entry) {
    entry.controller?.abort();
    const controller = new AbortController();
    entry.controller = controller;
    try { sessionStorage.setItem(`lx.brand-list.${entry.kind}`, JSON.stringify(entry.filters)); } catch (_) {}
    const panel = entry.panel;
    const results = panel.querySelector('.lxbrand-list-results');
    const summary = panel.querySelector('.lxbrand-list-summary');
    const pagination = panel.querySelector('.lxbrand-list-pagination');
    results.setAttribute('aria-busy', 'true');
    summary.textContent = '正在加载…';
    results.innerHTML = '<div class="lxbrand-list-state"><span class="lxbrand-list-spinner" aria-hidden="true"></span></div>';
    pagination.replaceChildren();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(requestURL(entry.kind, entry.filters), { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = normalizeResponse(await response.json());
      if (entry.controller !== controller) return;
      const pages = Math.ceil(data.total / PAGE_SIZE);
      if (entry.filters.page > Math.max(1, pages)) {
        entry.filters.page = Math.max(1, pages);
        return loadList(entry);
      }
      entry.data = data;
      entry.loaded = true;
      summary.textContent = `共 ${data.total.toLocaleString('zh-CN')} ${entry.kind === 'news' ? '条新闻' : '个案例'}`;
      results.innerHTML = data.items.length ? `<div class="lxbrand-list-grid">${data.items.map(item => `<a class="lxbrand-list-card" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer"><div class="lxbrand-list-photo${item.image ? '' : ' is-unavailable'}">${item.image ? `<img src="${escapeHTML(item.image)}" alt="" loading="lazy" width="640" height="360" referrerpolicy="no-referrer">` : ''}</div><div class="lxbrand-list-card-body"><div class="lxbrand-list-meta">${item.date ? `<time datetime="${item.date}">${item.date.replaceAll('-', '.')}</time>` : ''}${item.industries.length ? `<span>${escapeHTML(item.industries.join(' / '))}</span>` : ''}</div><h2>${escapeHTML(item.title)}</h2></div></a>`).join('')}</div>` : '<div class="lxbrand-list-state">未找到相关内容</div>';
      if (pages > 1) {
        pagination.innerHTML = `<button class="lxbrand-icon-button" type="button" data-brand-page="${entry.filters.page - 1}" aria-label="上一页" title="上一页" ${entry.filters.page === 1 ? 'disabled' : ''}>${icon('chevron-right', 'lxbrand-reverse')}</button>` + pageNumbers(entry.filters.page, pages).map(page => page === 'gap' ? '<span aria-hidden="true">…</span>' : `<button type="button" data-brand-page="${page}" aria-label="第 ${page} 页" ${page === entry.filters.page ? 'aria-current="page"' : ''}>${page}</button>`).join('') + `<button class="lxbrand-icon-button" type="button" data-brand-page="${entry.filters.page + 1}" aria-label="下一页" title="下一页" ${entry.filters.page === pages ? 'disabled' : ''}>${icon('chevron-right')}</button>`;
      }
    } catch (_) {
      if (entry.controller !== controller) return;
      entry.loaded = false;
      summary.textContent = '内容暂时无法加载';
      results.innerHTML = `<div class="lxbrand-list-state"><button type="button" class="lxbrand-retry" data-brand-retry>${icon('global-refresh')}重新加载</button></div>`;
    } finally {
      clearTimeout(timer);
      if (entry.controller === controller) results.setAttribute('aria-busy', 'false');
    }
  }

  bridge.registerPageRenderer('brand-list', (tab, host) => {
    const kind = tab.payload?.listKind;
    if (!LABELS[kind]) return;
    let entry = panels.get(kind);
    if (!entry) { entry = createPanel(kind); panels.set(kind, entry); }
    host.replaceChildren(entry.panel);
    if (!entry.loaded) loadList(entry);
  });

  document.addEventListener('click', event => {
    const prompt = event.target.closest('[data-brand-list]');
    const kind = prompt?.dataset.brandList;
    if (!LABELS[kind]) return;
    event.preventDefault();
    bridge.openPage({ id: `brand-list:${kind}`, kind: 'brand-list', label: `${LABELS[kind]}列表`, payload: { listKind: kind } });
  });
})(typeof window === 'undefined' ? null : window);

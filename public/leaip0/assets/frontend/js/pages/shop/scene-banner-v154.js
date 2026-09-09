/* Original scene-banner styles and interactions run in their own document.
 * This adapter owns only host sizing, existing mall visibility, and product routing.
 */
(function () {
  'use strict';
  function mount() {
  if (document.body?.dataset.page !== 'personal') return;
  const legacy = document.querySelector('.content > .device-scene-hall');
  if (!legacy || document.getElementById('p0OriginalSceneBanner')) return;
  const content = legacy.parentElement;
  const host = document.createElement('section');
  host.id = 'p0OriginalSceneBanner';
  host.setAttribute('aria-label', '个人及家庭场景推荐');
  const frame = document.createElement('iframe');
  frame.title = '个人及家庭场景 Banner';
  frame.src = '/assets/components/scene-banner-v154/scene-banner.html?v=20260907-campus-gradient';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('loading', 'eager');
  frame.style.cssText = 'display:block;border:0;position:absolute;left:0;top:0;transform-origin:0 0;width:1280px;height:650px;max-width:none;';
  host.style.cssText = 'position:relative;width:100%;min-width:0;height:auto;aspect-ratio:1280/624;overflow:hidden;margin:0;';
  const style = document.createElement('style');
  style.textContent = `
    #p0OriginalSceneBanner { display:none; }
    body[data-page="personal"]:not(.assistant-fullscreen) .content[data-view="list"] > #p0OriginalSceneBanner { display:block; }
    .content:has(> #p0OriginalSceneBanner) > .device-scene-hall { display:none!important; }
    body[data-page="personal"] .content:has(> .lx-tabbar .lx-tab.is-active:not([data-shop-tab-id="site:personal"]):not([data-tab-id="site:personal"])) > #p0OriginalSceneBanner { display:none!important; }
  `;
  document.head.append(style);
  host.append(frame);
  legacy.before(host);
  let frameDocument;
  let resizePending = false;
  function resize() {
    resizePending = false;
    const contentStyle = getComputedStyle(content);
    const sideInset = parseFloat(contentStyle.paddingLeft || 0);
    const width = content.clientWidth - sideInset - parseFloat(contentStyle.paddingRight || 0);
    if (!width || !frameDocument) return;
    // Keep the desktop composition on wide screens. In a narrow laptop panel,
    // render from a compact 980px canvas instead of shrinking a 1280px canvas;
    // this keeps the three product cards comfortably readable.
    const compactHost = window.innerWidth > 760 && width < 1100;
    const naturalWidth = window.innerWidth <= 760
      ? width
      : compactHost
        ? Math.max(980, width)
        : Math.max(1280, width);
    const scale = width / naturalWidth;
    frameDocument.documentElement.classList.toggle('is-compact-host', compactHost);
    // Keep enough of the first product floor visible on short laptop panels.
    // The target is expressed in host pixels and converted back to the iframe's
    // natural canvas, so compact and wide layouts land at the same visual height.
    const baseNaturalHeroHeight = compactHost ? 500 : 560;
    const baseVisibleHeroHeight = baseNaturalHeroHeight * scale;
    const targetVisibleHeroHeight = Math.max(360, Math.min(baseVisibleHeroHeight, window.innerHeight - 360));
    const shortHost = window.innerWidth > 760 && targetVisibleHeroHeight < baseVisibleHeroHeight - 1;
    frameDocument.documentElement.classList.toggle('is-short-host', shortHost);
    frameDocument.documentElement.style.setProperty('--short-hero-height', (targetVisibleHeroHeight / scale) + 'px');
    frame.style.width = naturalWidth + 'px';
    const page = frameDocument.querySelector('.page');
    if (!page) return;
    // Match the visible top inset to the parent card's side inset at every scale.
    page.style.paddingTop = (sideInset / scale) + 'px';
    const padding = parseFloat(frame.contentWindow.getComputedStyle(frameDocument.body).paddingBottom) || 0;
    const height = Math.ceil(page.getBoundingClientRect().bottom + padding);
    frame.style.height = height + 'px';
    frame.style.transform = 'scale(' + scale + ')';
    host.style.height = Math.ceil(height * scale) + 'px';
  }
  function scheduleResize() {
    if (!resizePending) { resizePending = true; requestAnimationFrame(resize); }
  }
  function initialize() {
    if (frameDocument === frame.contentDocument && host.dataset.ready) return;
    frameDocument = frame.contentDocument;
    if (!frameDocument || !frameDocument.querySelector('#bannerHero')) return;
    host.dataset.ready = 'true';
    legacy.inert = true;
    resize();
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(content);
    observer.observe(frameDocument.querySelector('.page'));
    window.addEventListener('resize', scheduleResize);
    frameDocument.fonts.ready.then(scheduleResize);
    scheduleResize();
  }
  frame.addEventListener('load', initialize);
  window.addEventListener('message', async function(event) {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'p0-scene-dom-ready-v158') {
      initialize();
      return;
    }
    if (event.data?.type === 'p0-scene-open-product' && event.data.sku) {
      const api = window.__lxAgentAPI;
      if (!api || typeof api.openProduct !== 'function') return;
      try { await api.openProduct(String(event.data.sku)); }
      catch (error) { console.error('[scene-banner] Product details could not open', error); }
    }
  });
  }
  mount();
  // Async head entry: initialize as soon as the actual mall markup is parsed.
  const mountObserver = new MutationObserver(mount);
  mountObserver.observe(document.documentElement, {childList:true,subtree:true});
})();

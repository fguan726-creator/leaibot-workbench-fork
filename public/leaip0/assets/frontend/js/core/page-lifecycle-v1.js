/* P0 page readiness: bounded waits, stale-navigation guards, progressive detail. */
(() => {
  'use strict';
  if (window.__lxPageLifecycle) return;
  const frames = new WeakMap();
  const source = frame => frame.getAttribute('src') || '';
  for (const type of ['load', 'error']) document.addEventListener(type, event => {
    const frame = event.target;
    if (frame?.tagName === 'IFRAME') frames.set(frame, {src: source(frame), status: type});
  }, true);
  function waitFrame(frame, timeout = 20000) {
    if (!frame) return Promise.resolve('ready');
    const expected = source(frame), known = frames.get(frame);
    if (known?.src === expected) return Promise.resolve(known.status);
    try {
      if (frame.contentWindow.location.href === new URL(frame.src, location.href).href && frame.contentDocument.readyState === 'complete' && frame.contentDocument.body?.children.length) return Promise.resolve('ready');
    } catch (_) {}
    return new Promise(resolve => {
      let settled = false, timer, poll;
      const finish = status => { if (settled) return; settled = true; clearTimeout(timer); clearInterval(poll); frame.removeEventListener('load', loaded); frame.removeEventListener('error', failed); resolve(status); };
      const loaded = () => finish('load'), failed = () => finish('error');
      frame.addEventListener('load', loaded, {once:true}); frame.addEventListener('error', failed, {once:true});
      timer = setTimeout(() => finish('timeout'), timeout);
      poll = setInterval(() => { if (!frame.isConnected || source(frame) !== expected) finish('stale'); }, 250);
    });
  }
  function showRetry(host, message, retry, key) {
    host.querySelector('[data-p0-retry="'+key+'"]')?.remove();
    const note = document.createElement('p'); note.className = 'lx-p0-disclaimer'; note.dataset.p0Retry = key; note.setAttribute('role','status'); note.textContent = message+' ';
    const button = document.createElement('button'); button.type='button'; button.textContent='重试'; button.onclick=()=>{ note.remove(); retry(); }; note.appendChild(button); host.appendChild(note);
  }
  function finish(token, extra) {
    if (!token || token.done) return; token.done = true;
    const content = document.querySelector('.content');
    const current = () => token.overlay.isConnected && (!token.tab?.id || window.__lxState?.activeTabId === token.tab.id);
    let timer, frame, expired=false;
    const paint = new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const minimum = new Promise(resolve=>setTimeout(resolve,Math.max((token.minVisibleMs??2000)-(Date.now()-token.startedAt),0)));
    const ready = paint.then(()=>{frame=token.tab?.kind==='info'?content?.querySelector('.info-page iframe'):null;return waitFrame(frame);});
    const deadline = new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve(['timeout']);},22000);});
    Promise.race([Promise.all([ready, minimum, Promise.resolve(extra).catch(()=>null)]),deadline]).then(result=>{
      clearTimeout(timer);
      if (!current()) { token.overlay.remove(); if (!content?.querySelector('.lx-page-generating')) content?.classList.remove('is-generating-tab'); return; }
      token.overlay.classList.add('is-done'); token.overlay.classList.remove('is-show'); content?.classList.remove('is-generating-tab');
      setTimeout(()=>token.overlay.remove(),260);
      if (frame?.isConnected && (expired || ['timeout','error'].includes(result[0]))) showRetry(content,'页面资源暂未加载完成，其他功能可以继续使用。',()=>{frame.src=frame.src;},'frame');
    });
  }
  function enhance(task, isCurrent, retry) {
    if (task == null) return;
    Promise.resolve(task).then(()=>{
      if (!isCurrent()) return;
      document.querySelector('[data-p0-retry="detail"]')?.remove();
      document.dispatchEvent(new CustomEvent('lx:product-detail-rendered'));
    }).catch(()=>{
      const host=document.querySelector('.product-detail');
      if (host && isCurrent()) showRetry(host,'扩展详情暂未加载完成，商品信息和配置仍可使用。',()=>enhance(retry(),isCurrent,retry),'detail');
    });
  }
  window.__lxPageLifecycle = Object.freeze({waitFrame,finish,enhance});
})();

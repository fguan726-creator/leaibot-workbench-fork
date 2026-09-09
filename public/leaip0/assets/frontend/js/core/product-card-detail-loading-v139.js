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

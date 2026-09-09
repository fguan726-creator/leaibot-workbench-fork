/* P0 product-data v1. Canonical source, embedded unchanged in the five entry bundles. */
(function () {
  'use strict';
  if (window.__lxProductData) return;
  const cache = new Map(), pending = new Map();
  const TTL = 15000, MAX = 256;
  function remember(key, entry) {
    cache.delete(key);
    cache.set(key, entry);
    while (cache.size > MAX) cache.delete(cache.keys().next().value);
  }
  function read(kind, sku) {
    sku = String(sku || '').trim();
    if (!sku) return Promise.reject(new Error('Missing SKU'));
    const key = kind + ':' + sku, hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
    cache.delete(key);
    if (pending.has(key)) return pending.get(key);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const task = (async function () {
      const response = await fetch('/api/products/' + encodeURIComponent(sku) + (kind === 'variants' ? '/variants' : ''), {
        cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('Product HTTP ' + response.status);
      const value = await response.json();
      if (kind === 'variants') {
        if (!Array.isArray(value.variants) || value.variants.some(row => !row || !row.sku)) throw new Error('Invalid variants');
      } else if (String(value.sku) !== sku || !value.name) throw new Error('Invalid product');
      const entry = { value, expires: Date.now() + TTL };
      remember(key, entry);
      // All SKUs in one response share the same complete SPU list and expiry.
      // Do not cache partial variant rows as full product/stock responses.
      if (kind === 'variants') value.variants.forEach(row => remember('variants:' + row.sku, entry));
      return value;
    })();
    pending.set(key, task);
    task.then(() => { clearTimeout(timeout); pending.delete(key); }, () => { clearTimeout(timeout); pending.delete(key); });
    return task;
  }
  const api = window.__lxProductData = {
    sequence: 0,
    product: sku => read('product', sku),
    variants: sku => read('variants', sku)
  };
  // Only warm the currently intended item; never fetch the entire catalogue.
  let timer;
  const selector = '[data-variant-sku], [data-open-product], [data-product-id], .product-card[data-sku], .floor-product[data-sku], .lx-floor-product[data-sku], .rank-item[data-sku]';
  function warm(event) {
    if (navigator.connection?.saveData) return;
    const card = event.target?.closest?.(selector);
    if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const sku = card.dataset.variantSku || card.dataset.openProduct || card.dataset.productId || card.dataset.sku;
      if (!sku || !card.isConnected) return;
      api.variants(sku).catch(() => {});
      if (card.dataset.variantSku) api.product(sku).catch(() => {});
    }, 120);
  }
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('pointerout', event => {
    const card = event.target?.closest?.(selector);
    if (card && !card.contains(event.relatedTarget)) clearTimeout(timer);
  }, { passive: true });
})();

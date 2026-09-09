/* Product-to-order boundary. No title scraping, demo fallback, or payment writes. */
(() => {
  'use strict';
  const clean = value => String(value ?? '').trim();
  const esc = value => clean(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalize(product) {
    if (!product || typeof product !== 'object') throw new Error('请选择具体商品后再下单');
    const sku=clean(product.sku), name=clean(product.name), price=Number(product.price);
    if (!sku || !name || !Number.isFinite(price) || price <= 0) throw new Error('商品数据不完整，请重新打开商品详情');
    let specs=product.specs || {};
    if(typeof specs==='string'){try{specs=JSON.parse(specs);}catch{specs={};}}
    if(!specs || typeof specs!=='object' || Array.isArray(specs))specs={};
    const description=clean(specs.configuration_name || product.description);
    const image=clean(product.image_url || product.image || specs.white_image_url);
    const parts=description.split(/\s*\/\s*/);
    const memory=parts.find(p=>/\d+\s*G(?:B)?\s*(?:LP|DDR|内存)/i.test(p))?.match(/\d+\s*G(?:B)?/i)?.[0];
    const storage=parts.find(p=>/固态|硬盘|SSD|PCIe/i.test(p))?.match(/^\s*\d+(?:\.\d+)?\s*(?:TB|GB)?/i)?.[0]?.trim();
    const configurationLabel=[memory,storage].filter(Boolean).join('+') || description;
    if(image && !/^(?:https?:\/\/|\/|\.\.?\/)/i.test(image)) throw new Error('商品图片地址无效');
    return Object.freeze({
      sku,name,price,originalPrice:price,discount:0,image_url:image,configurationLabel,
      category:clean(product.category),series:clean(specs.spu_name || product.category || '联想'),
      configuration:description || '以所选商品详情为准',
      size:clean(specs.screen_size || specs.display_size || description.match(/\d+(?:\.\d+)?\s*英寸/)?.[0] || '以商品详情为准'),
      color:clean(specs.color || product.color),specs:Object.freeze({...specs})
    });
  }
  function targetSku(button, state) {
    const card=button?.closest?.('[data-buy-sku],[data-open-product],[data-product-id],[data-sku]');
    const explicit=clean(card?.dataset.buySku || card?.dataset.openProduct || card?.dataset.productId || card?.dataset.sku);
    if(explicit)return explicit;
    if(button?.closest?.('.product-detail,.detail-main,.detail-page,.lx-product-detail,.lx-buybar')) {
      const active=state?.tabs?.find(t=>t.id===state.activeTabId && t.kind==='detail');
      return clean(active?.sku || state?.currentProduct?.sku);
    }
    return '';
  }
  async function read(sku) {
    if(!sku)throw new Error('未能确定所选商品，请从商品详情重新下单');
    if(!window.__lxProductData?.product)throw new Error('商品数据服务未准备好，请稍后重试');
    const product=normalize(await window.__lxProductData.product(sku));
    if(product.sku!==String(sku))throw new Error('商品配置已变化，请重新选择');
    return product;
  }
  function fromButton(button){return read(targetSku(button,window.__lxState));}
  async function options(sku){
    if(!window.__lxProductData?.variants)throw new Error('配置数据服务未准备好');
    const result=await window.__lxProductData.variants(sku);
    if(!Array.isArray(result?.variants)||!result.variants.length)throw new Error('暂时无法读取商品配置，请重试');
    return result.variants;
  }
  function renderConfig({dialog,product,quantity,onSelect,onError}) {
    dialog.className='lx-buy-direct-dialog lx-order-edit-dialog lx-config-dialog';
    dialog.innerHTML='<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-config-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>修改商品</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body"><div data-purchase-options role="status">正在读取本系列配置…</div><div class="lx-config-quantity"><div class="lx-config-quantity-copy"><h3>商品数量</h3><small>最多购买5件</small></div><div class="lx-config-stepper"><button type="button" data-config-minus aria-label="减少数量" '+(quantity<=1?'disabled':'')+'>−</button><output data-config-count>'+quantity+'</output><button type="button" data-config-plus aria-label="增加数量" '+(quantity>=5?'disabled':'')+'>＋</button></div></div></div><footer class="lx-order-edit-footer"><button type="button" data-config-save>保存修改</button></footer>';
    const host=dialog.querySelector('[data-purchase-options]');
    const current=()=>host.isConnected && dialog.contains(host);
    function fail(error){if(!current())return;host.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.onclick=()=>renderConfig({dialog,product,quantity,onSelect,onError});host.append(' ',retry);onError?.(error);}
    options(product.sku).then(rows=>{
      if(!current())return;
      const variants=rows.map(normalize);
      host.removeAttribute('role');
      host.innerHTML=[['color','颜色'],['size','尺寸'],['configuration','配置']].map(([key,label])=>{
        const values=[...new Set(variants.map(row=>row[key]).filter(Boolean))];
        if(!values.length)values.push(product[key] || '以商品详情为准');
        return '<section class="lx-config-section"><h3>'+label+'</h3><div class="lx-config-options">'+values.map(value=>{
          const selected=(product[key] || '以商品详情为准')===value;
          const matches=variants.filter(row=>row[key]===value);
          const same=matches.find(row=>['color','size','configuration'].every(k=>k===key || row[k]===product[k]));
          const next=same || matches[0];
          return '<button class="lx-config-option'+(selected && next?' is-active':'')+'" type="button" data-purchase-sku="'+esc(next?.sku || product.sku)+'" aria-pressed="'+selected+'" title="'+esc(value)+'"'+(!next?' disabled':'')+'>' + esc(key==='configuration' && next ? next.configurationLabel : value) + '</button>';
        }).join('')+'</div></section>';
      }).join('');
      host.querySelectorAll('[data-purchase-sku]').forEach(button=>button.addEventListener('click',async()=>{
        const sku=button.dataset.purchaseSku;
        host.querySelectorAll('button').forEach(b=>b.disabled=true);host.setAttribute('aria-busy','true');
        try{const selected=await read(sku);if(current())onSelect(selected);}catch(error){fail(error);}
      }));
    }).catch(fail);
  }
  window.__lxPurchaseContext=Object.freeze({normalize,targetSku,read,fromButton,options,renderConfig});
})();

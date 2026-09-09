(function () {
  'use strict';
  const groups = ['基本信息', '处理器', '内存', '存储', '显卡', '屏幕', '操作系统', '网络与连接', '接口', '电池与电源', '外观与尺寸', '摄像与音频', '服务与其他'];
  const aliases = {
    brand: ['基本信息', '品牌'], mtm: ['基本信息', 'MTM 编码'], screen_resolution: ['屏幕', '分辨率'],
    cpu: ['处理器', '处理器型号'], processor: ['处理器', '处理器型号'],
    ram: ['内存', '内存配置'], memory: ['内存', '内存配置'], memory_type: ['内存', '内存类型'],
    storage: ['存储', '硬盘配置'], disk: ['存储', '硬盘配置'], ssd: ['存储', '固态硬盘'],
    gpu: ['显卡', '显卡型号'], graphics: ['显卡', '显卡型号'],
    screen: ['屏幕', '屏幕配置'], screen_size: ['屏幕', '屏幕尺寸'], display: ['屏幕', '屏幕配置'], resolution: ['屏幕', '分辨率'], refresh_rate: ['屏幕', '刷新率'],
    os: ['操作系统', '操作系统'], operating_system: ['操作系统', '操作系统'],
    wifi: ['网络与连接', '无线网络'], bluetooth: ['网络与连接', '蓝牙'], network: ['网络与连接', '网络配置'],
    ports: ['接口', '接口配置'], interfaces: ['接口', '接口配置'],
    battery: ['电池与电源', '电池'], power: ['电池与电源', '电源'],
    color: ['外观与尺寸', '颜色'], colour: ['外观与尺寸', '颜色'], weight: ['外观与尺寸', '重量'], dimensions: ['外观与尺寸', '尺寸'],
    camera: ['摄像与音频', '摄像头'], audio: ['摄像与音频', '音频'], warranty: ['服务与其他', '保修服务']
  };
  const metadata = /^(?:catalog_source|site|package|spu_id|spu_name|source_category|configuration_id|configuration_name|configurationName|tags|url|folder|asset_mode|stock_source|.*_url|.*_images|.*_at|id|sku|price|original_price|pcDetailUrl|wapUrl|wapDetailUrl|mobileUrl|bu_ids|target_user|highlights|images|ad_picture|source|lvl[1-5]|bu)$/i;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function object(value) { if (typeof value === 'string') { try { return JSON.parse(value) || {}; } catch (_) { return {}; } } return value && typeof value === 'object' ? value : {}; }
  function category(label) {
    if (/处理器|CPU|芯片组|核心数|线程|主频|缓存/i.test(label)) return '处理器';
    if (/显卡|显存|GPU|图形/i.test(label)) return '显卡';
    if (/内存|RAM|DDR/i.test(label)) return '内存';
    if (/硬盘|存储|SSD|磁盘/i.test(label)) return '存储';
    if (/屏幕|显示|分辨率|刷新率|色域|亮度|触控/i.test(label)) return '屏幕';
    if (/系统|OS$/i.test(label)) return '操作系统';
    if (/网络|蓝牙|Wi.?Fi|蜂窝|通信/i.test(label)) return '网络与连接';
    if (/接口|端口|USB|HDMI|雷电/i.test(label)) return '接口';
    if (/电池|电源|续航|充电|适配器/i.test(label)) return '电池与电源';
    if (/颜色|尺寸|重量|厚度|材质/i.test(label)) return '外观与尺寸';
    if (/摄像|镜头|像素|音频|扬声|麦克风/i.test(label)) return '摄像与音频';
    return '服务与其他';
  }
  function build(product) {
    const specs = object(product.specs), result = new Map(groups.map(g => [g, []]));
    const add = (group, label, value) => {
      if (value == null || typeof value === 'object' || String(value).trim() === '') return;
      value = String(value).trim();
      const rows = result.get(group) || result.get('服务与其他');
      if (!rows.some(row => row[0] === label && row[1] === value)) rows.push([label, value]);
    };
    add('基本信息', '商品名称', product.name);
    add('基本信息', '产品系列', specs.spu_name);
    add('基本信息', '品类', product.category || specs.source_category);
    add('基本信息', '商品编号（SKU）', product.sku);
    function walk(source, parent = '', depth = 0) {
      if (depth > 5) return;
      for (const [key, value] of Object.entries(source)) {
        if (metadata.test(key) || value == null) continue;
        const mapped = aliases[key.toLowerCase()], label = mapped ? mapped[1] : key;
        const group = mapped ? mapped[0] : category(parent + key);
        if (Array.isArray(value)) {
          if (value.every(item => item == null || typeof item !== 'object')) add(group, label, value.filter(item => item != null).join(' / '));
          else value.forEach(item => {
            if (item && typeof item === 'object' && (item.name || item.label) && item.value != null) add(category(parent + (item.name || item.label)), item.name || item.label, item.value);
            else if (item && typeof item === 'object') walk(item, parent + key, depth + 1);
          });
        } else if (typeof value === 'object') walk(value, parent + key, depth + 1);
        else add(group, label, value);
      }
    }
    walk(specs);
    // Read configuration tokens verbatim; never infer missing capacities or hardware.
    const config = String(specs.configuration_name || specs.configurationName || product.description || '').trim();
    const known = new Set([...result].filter(([,rows]) => rows.length).map(([g]) => g));
    const rules = [
      ['操作系统', '操作系统', /Windows|Win\s*\d|Linux|Ubuntu|Android|Chrome\s*OS|Harmony|麒麟|统信/i],
      ['处理器', '处理器型号', /处理器|酷睿|锐龙|Ryzen|Intel|AMD|Ultra\s*\d|\bi[3579][-\s]|骁龙|天玑|Xeon|至强|奔腾|赛扬/i],
      ['显卡', '显卡配置', /显卡|显存|RTX|GTX|Radeon|GeForce|独显|集显/i],
      ['屏幕', '屏幕配置', /英寸|屏幕|显示屏|OLED|WUXGA|\d{3,4}\s*[x×]\s*\d{3,4}|\d+\s*Hz/i],
      ['存储', '硬盘配置', /SSD|HDD|硬盘|固态|\d\s*T(?:B)?\b|^(?:128|256|512|1024)\s*G(?:B)?$/i],
      ['内存', '内存配置', /内存|DDR|^\d{1,3}\s*G(?:B)?$/i],
      ['网络与连接', '网络配置', /Wi.?Fi|蓝牙|Bluetooth|以太网/i],
      ['电池与电源', '电池与电源', /电池|电源|mAh|Wh\b|充电/i],
      ['外观与尺寸', '外观配置', /\d\s*(?:kg|千克|mm)|^(?:\S{0,8})(?:黑|白|灰|银|紫|蓝|绿|金)色?$/i]
    ];
    const tokens = config.split(/\s*[/／|｜丨；;]\s*/).filter(Boolean);
    for (const token of tokens) {
      const combined = token.match(/^(\d{1,2}\s*GB)\s*[+＋]\s*(\d+(?:\.\d+)?\s*[GT]B)$/i);
      if (combined) {
        if (!known.has('内存')) add('内存', '内存配置', combined[1]);
        if (!known.has('存储')) add('存储', '硬盘配置', combined[2]);
        continue;
      }
      const rule = rules.find(([, ,pattern]) => pattern.test(token));
      if (rule && !known.has(rule[0])) add(rule[0], rule[1], token);
      else if (!rule && tokens.length > 1) add('服务与其他', '其他配置', token);
    }
    if (config && !/^(联想官方商品|联想商品)[，,。]?/.test(config)) add('基本信息', '完整配置说明', config);
    return [...result].filter(([,rows]) => rows.length);
  }
  function markup(product, note = '') {
    const sections = build(product);
    return sections.map(([title, rows]) => '<section class="lx-spec-section"><h3>' + escape(title) + '</h3><dl>' + rows.map(([key,value]) => '<div class="lx-spec-item"><dt>' + escape(key) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl></section>').join('') + '<p class="lx-spec-note" role="status">' + escape(note || '参数对应当前所选配置；未提供的参数不展示，购买前请以商品官方信息为准。') + '</p>';
  }
  const requests = new Map();
  const rendered = new WeakMap();
  function render(grid, product) {
    if (!grid || !product) return;
    const sku = String(product.sku || ''), token = {};
    grid._lxSpecRequest = token;
    rendered.set(grid, sku);
    grid.classList.add('lx-specs-grouped');
    grid.innerHTML = markup(product);
    if (!sku) return;
    if (!requests.has(sku)) {
      const request = fetch('/api/products/' + encodeURIComponent(sku), {cache:'no-store'})
        .then(response => { if (!response.ok) throw Error('参数加载失败'); return response.json(); })
        .then(data => { if (String(data.sku || '') !== sku) throw Error('商品不匹配'); return data; })
        .catch(error => { requests.delete(sku); throw error; });
      requests.set(sku, request);
    }
    requests.get(sku).then(data => {
      if (grid._lxSpecRequest !== token || !grid.isConnected) return;
      grid.innerHTML = markup({...product, ...data, specs:data.specs || product.specs});
    }).catch(() => {
      if (grid._lxSpecRequest === token && grid.isConnected) grid.innerHTML = markup(product, '完整参数暂时无法加载，当前展示已有商品信息，请稍后重新打开详情页。');
    });
  }
  window.__lxRenderProductSpecs = render;
  // Restored tabs can contain saved HTML without rerunning the detail renderer.
  function restoreSpecs() {
    const detail = document.querySelector('.content[data-view="detail"] .product-detail');
    const grid = detail?.querySelector('[data-detail-spec-grid]');
    if (!grid) return;
    const state = window.__lxState || {};
    const tab = (state.tabs || []).find(item => item.id === state.activeTabId && item.kind === 'detail');
    const sku = String(tab?.sku || state.currentProduct?.sku || '');
    if (!sku || rendered.get(grid) === sku) return;
    const product = String(state.currentProduct?.sku || '') === sku ? state.currentProduct : tab?.product || {};
    render(grid, {...product, sku, name:product.name || detail.querySelector('[data-detail-title], .detail-title')?.textContent || '联想商品'});
  }
  if (typeof document !== 'undefined') {
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; restoreSpecs(); });
    }).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['data-view']});
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreSpecs, {once:true});
    else restoreSpecs();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {build, markup, render};
})();

/* v60-fulfillment-subsidy-checkout-20260904 */
(function () {
  'use strict';
  var originalOpen = window.__lxOpenUnifiedDiscountOrder;
  if (typeof originalOpen !== 'function' || window.__lxFulfillmentCheckoutV60) return;

  var stores = [
    { id: 'xibeiwang', name: '联想官方体验店（西北旺万象汇店）', address: '北京市海淀区马连洼街道德政路16号院万象汇A区 F4 405', hours: '9:30-21:00', phone: '13426251637', distance: '200m' },
    { id: 'zhongguancun', name: '联想来酷智生活（中关村店）', address: '北京市海淀区中关村大街19号新中关购物中心 B1', hours: '10:00-21:30', phone: '010 6602 6688', distance: '2.6km' },
    { id: 'wukesong', name: '联想官方体验店（五棵松华熙店）', address: '北京市海淀区复兴路69号华熙LIVE南区 1F', hours: '10:00-22:00', phone: '010 5971 6888', distance: '4.1km' }
  ];
  var orderAddress = '北京市海淀区中关村软件园2期北京联想总部东区E1';
  var sessions = new WeakMap();

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function shopIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1.2-5H5.2L4 9Zm1 0v10h14V9M8 19v-6h8v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3.5 9c0 1.4 1.1 2.5 2.5 2.5S8.5 10.4 8.5 9c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  }
  function locationIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9" r="2.4" fill="currentColor"/></svg>';
  }
  function qrMarkup() {
    return '<div class="lx-demo-qr" aria-label="模拟二维码"><svg viewBox="0 0 84 84" role="img"><rect width="84" height="84" fill="#fff"/><g fill="#000"><path d="M3 3h24v24H3zm4 4v16h16V7zm4 4h8v8h-8zM57 3h24v24H57zm4 4v16h16V7zm4 4h8v8h-8zM3 57h24v24H3zm4 4v16h16V61zm4 4h8v8h-8z" fill-rule="evenodd"/><path d="M33 4h6v6h-6zm9 0h5v12h-5zm-9 15h6v6h-6zm11 2h7v7h-7zm-13 10h7v6h-7zm11 0h6v6h-6zm10 0h8v6h-8zm12 0h6v8h-6zm10 0h7v6h-7zM30 41h7v7h-7zm11-2h6v13h-6zm10 2h6v6h-6zm10 0h13v6H61zm-28 15h7v6h-7zm10 0h6v13h-6zm10-5h7v7h-7zm11 0h6v13h-6zm10-1h7v7h-7zM31 67h7v7h-7zm11 5h8v8h-8zm11-10h6v18h-6zm10 5h7v6h-7zm11-6h7v19h-7z"/></g></svg></div>';
  }

  if (!document.querySelector('[data-fulfillment-checkout-v60-style]')) {
    var style = document.createElement('style');
    style.dataset.fulfillmentCheckoutV60Style = 'true';
    style.textContent = '.lx-fulfillment-suggestion{margin:10px 0 0;color:#353037;font-size:14px;line-height:1.8}.lx-fulfillment-link{display:inline;padding:0 2px;border:0;border-bottom:1px solid currentColor;background:transparent;color:#681057;font:inherit;font-weight:700;line-height:inherit;cursor:pointer}.lx-fulfillment-link:hover,.lx-fulfillment-link:focus{color:#a51f42}.lx-order-store-kicker{grid-column:1/-1;display:flex;align-items:center;gap:6px;margin:-3px 0 8px;color:#681057;font-size:11px;font-weight:600}.lx-order-store-kicker svg{width:15px;height:15px}.lx-fulfillment-address{display:grid;gap:10px;padding:2px 0}.lx-fulfillment-address-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:start}.lx-fulfillment-address-row svg{width:20px;height:20px;color:#575258}.lx-fulfillment-address-copy{display:grid;gap:3px;min-width:0}.lx-fulfillment-address-copy strong{font-size:13px;font-weight:600;line-height:19px}.lx-fulfillment-address-copy span{overflow:hidden;color:#77717d;font-size:11px;line-height:17px;text-overflow:ellipsis;white-space:nowrap}.lx-fulfillment-address-row button{padding:1px 0;border:0;border-bottom:1px solid currentColor;background:transparent;color:#77717d;font:inherit;cursor:pointer}.lx-fulfillment-contact{display:flex;gap:14px;padding-left:32px;font-size:12px}.lx-fulfillment-contact b{font-weight:600}.lx-fulfillment-dialog{padding:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}.lx-fulfillment-head{height:64px;flex:none;display:flex;align-items:center;padding:0 26px}.lx-fulfillment-head h2{margin:0!important;background:none!important;color:#19171b!important;-webkit-text-fill-color:initial!important;font-size:20px!important}.lx-fulfillment-head h2:before{content:none!important}.lx-fulfillment-body{flex:1;min-height:0;padding:12px 26px 18px;overflow:auto}.lx-fulfillment-form{display:grid;grid-template-columns:70px 1fr 55px 1fr;gap:12px;align-items:center;margin-bottom:20px}.lx-fulfillment-form label{font-weight:600}.lx-fulfillment-form input{height:42px;box-sizing:border-box;padding:0 12px;border:1px solid #e2ddeb;border-radius:4px;background:#fbf9fc;font:inherit}.lx-fulfillment-section-title{margin:0 0 12px;font-size:14px}.lx-fulfillment-location{display:flex;align-items:center;gap:10px;min-height:52px;box-sizing:border-box;margin-bottom:14px;padding:0 14px;border:1px solid #ebe5ed;border-radius:4px;background:#fbf9fc;color:#681057}.lx-fulfillment-location svg{width:22px;flex:0 0 22px}.lx-fulfillment-location span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lx-fulfillment-location b{margin-left:auto}.lx-fulfillment-store-list{display:grid;gap:10px}.lx-fulfillment-store{position:relative;display:grid;gap:7px;min-height:104px;box-sizing:border-box;padding:17px 96px 15px 18px;border:1px solid #ebe5ed;border-radius:8px;background:#fcfbfd;color:#272329;text-align:left;cursor:pointer}.lx-fulfillment-store.is-active{border-color:#681057;box-shadow:inset 0 0 0 1px #b8252e}.lx-fulfillment-store strong{font-size:14px}.lx-fulfillment-store span{color:#77717d}.lx-fulfillment-store small{color:#5e5861}.lx-fulfillment-store em{position:absolute;right:18px;bottom:22px;color:#681057;font-size:13px;font-style:normal;font-weight:600}.lx-fulfillment-footer{height:70px;flex:none;display:flex;align-items:center;justify-content:flex-end;padding:0 26px;background:#fff}.lx-fulfillment-footer button{width:164px;height:44px;border:0;border-radius:100px;background:linear-gradient(90deg,#4d144a,#b8252e);color:#fff;font-size:14px;font-weight:600;cursor:pointer}.lx-subsidy-dialog .lx-fulfillment-body{padding-top:4px}.lx-subsidy-step{margin:0 0 16px}.lx-subsidy-step h3{margin:0 0 6px;font-size:14px}.lx-subsidy-step p{margin:0;color:#5f5863;line-height:1.7}.lx-subsidy-outline{height:34px;margin-top:8px;padding:0 18px;border:1px solid #681057;border-radius:100px;background:#fff;color:#681057;cursor:pointer}.lx-subsidy-qr-row{display:flex;align-items:center;gap:16px}.lx-subsidy-qr-copy{color:#5f5863;line-height:1.65}.lx-subsidy-code{display:grid;grid-template-columns:1fr auto;width:min(460px,100%);height:42px;border:1px solid #e3dce6;border-radius:100px;overflow:hidden}.lx-subsidy-code input{min-width:0;padding:0 16px;border:0;outline:0}.lx-subsidy-code button{margin:4px;padding:0 16px;border:0;border-radius:100px;background:#eadce6;color:#fff;cursor:pointer}.lx-demo-qr{width:86px;height:86px;flex:0 0 86px;padding:6px;box-sizing:border-box;border:1px solid #e6e1e8;background:#fff}.lx-demo-qr svg{width:100%;height:100%;display:block}.lx-realname-notice{margin:0 0 24px;padding:10px 12px;border-radius:6px;background:#fff0e9;color:#b46048}.lx-realname-grid{display:grid;grid-template-columns:55px 1fr 55px 1fr;gap:20px 12px;align-items:center}.lx-realname-grid label:before{content:"*";margin-right:4px;color:#cf2c2c}.lx-realname-grid input{height:40px;min-width:0;box-sizing:border-box;padding:0 12px;border:1px solid #e3dce6;background:#fbf9fc}.lx-realname-code{display:grid;grid-template-columns:1fr auto}.lx-realname-code button{border:0;border-left:1px solid #e3dce6;background:#fff;color:#681057}.lx-realname-consent{display:flex;align-items:center;gap:7px;margin-top:auto;color:#5f5863}.lx-realname-consent input{accent-color:#681057}.lx-realname-actions{display:flex;gap:16px}.lx-realname-actions .secondary{border:1px solid #681057;background:#fff;color:#681057}.lx-pickup-success{height:100%;display:flex;flex-direction:column;padding:12px 4px 0}.lx-pickup-success-title{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-size:21px}.lx-pickup-success-title i{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#50d5a0;color:#fff;font-style:normal}.lx-pickup-success-copy{margin:0;font-size:15px;line-height:1.8}.lx-pickup-success-copy b{font-weight:700}.lx-pickup-code{display:grid;gap:10px;margin:22px 0 16px;padding:18px;border-radius:16px;background:#fcfbfd}.lx-pickup-code-head{display:flex;align-items:center;gap:8px;font-size:17px}.lx-pickup-code-head span{padding:2px 10px;border-radius:100px;background:#faedf8;color:#681057;font-size:12px}.lx-pickup-code .lx-demo-qr{justify-self:center;width:122px;height:122px}.lx-pickup-code strong{justify-self:center;font-size:20px;letter-spacing:3px}.lx-pickup-success .lx-payment-actions{margin-top:auto}@media(max-width:620px){.lx-fulfillment-form,.lx-realname-grid{grid-template-columns:72px 1fr}.lx-fulfillment-store{padding-right:72px}.lx-fulfillment-head,.lx-fulfillment-footer{padding-right:18px;padding-left:18px}.lx-fulfillment-body{padding-right:18px;padding-left:18px}}';
    document.head.appendChild(style);
  }

  function normalizeProduct(product) {
    var copy = Object.assign({}, product);
    copy.image_url = copy.image_url || copy.image || '';
    copy.originalPrice = Number(copy.originalPrice || copy.original_price || copy.price);
    copy.discount = Math.max(0, Number(copy.discount) || 0);
    return copy;
  }
  function latestAssistantBody() {
    var messages = Array.prototype.slice.call(document.querySelectorAll('.lx-p0-messages .lx-p0-message.ai, .lx-p0-messages .msg.ai, .lxfd-thread .lxfd-msg-ai'));
    var message = messages[messages.length - 1];
    return message && (message.querySelector('.ai-body,.lxfd-ai-body') || message);
  }
  function appendSuggestion(product, attempt) {
    attempt = attempt || 0;
    var body = latestAssistantBody();
    if (!body) {
      if (attempt < 10) window.setTimeout(function () { appendSuggestion(product, attempt + 1); }, 160);
      return;
    }
    var key = String(product.sku || product.name || 'product');
    if (body.querySelector('[data-fulfillment-suggestion]')) return;
    var suggestion = document.createElement('p');
    suggestion.className = 'lx-fulfillment-suggestion';
    suggestion.dataset.fulfillmentSuggestion = key;
    suggestion.innerHTML = '查询到您附近门店存在此商品的库存，您是否想要今日就可取到商品呢，您可 <button class="lx-fulfillment-link" type="button" data-open-fulfillment="pickup">到店自提</button> <button class="lx-fulfillment-link" type="button" data-open-fulfillment="flash">门店闪送</button> 进行下单哦~';
    suggestion._lxProduct = product;
    var card = body.querySelector('.answer-cta,[data-answer-card],.lx-answer-card');
    if (card) body.insertBefore(suggestion, card);
    else body.appendChild(suggestion);
    var thread = body.closest('.lx-p0-messages,.lxfd-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  }
  function shippingMarkup(session) {
    var store = session.store;
    if (session.mode === 'pickup') {
      return '<div class="lx-fulfillment-address"><div class="lx-fulfillment-address-row">' + shopIcon() + '<span class="lx-fulfillment-address-copy"><strong>' + esc(store.name) + '</strong><span>' + esc(store.address) + '</span></span><button type="button" data-select-fulfillment-store>选择门店</button></div><div class="lx-fulfillment-contact"><b>联小想</b><span>13028280000</span></div></div>';
    }
    if (session.mode === 'flash') {
      return '<div class="lx-fulfillment-address"><div class="lx-fulfillment-address-row">' + locationIcon() + '<span class="lx-fulfillment-address-copy"><strong>联小想　13028280000</strong><span>' + orderAddress + '</span></span></div><div class="lx-fulfillment-address-row">' + shopIcon() + '<span class="lx-fulfillment-address-copy"><strong>' + esc(store.name) + '</strong></span><button type="button" data-select-fulfillment-store>选择门店</button></div></div>';
    }
    return '';
  }
  function decorateOrder(session) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var shipping = dialog && dialog.querySelector('.lx-order-shipping');
    if (!shipping || session.mode === 'delivery') return;
    if (shipping.dataset.fulfillmentMode !== session.mode) {
      shipping.innerHTML = shippingMarkup(session);
      shipping.dataset.fulfillmentMode = session.mode;
    }
    if (session.mode === 'flash') {
      var card = dialog.querySelector('.lx-order-product-card');
      if (card && !card.querySelector('.lx-order-store-kicker')) {
        card.insertAdjacentHTML('afterbegin', '<span class="lx-order-store-kicker">' + shopIcon() + '由 ' + esc(session.store.name) + ' 闪送</span>');
      }
    }
  }
  function rememberSize(session) {
    if (session.size) return;
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var rect = dialog && dialog.getBoundingClientRect();
    if (rect && rect.width && rect.height) session.size = { width: Math.round(rect.width), height: Math.round(rect.height) };
  }
  function applySize(dialog, session) {
    rememberSize(session);
    if (!session.size) return;
    dialog.style.width = session.size.width + 'px';
    dialog.style.height = session.size.height + 'px';
  }
  function renderCustom(session, className, html) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    applySize(dialog, session);
    dialog.className = 'lx-buy-direct-dialog lx-fulfillment-dialog ' + className;
    dialog.innerHTML = html;
  }
  function rerenderOrder(session) {
    return window.__lxOpenUnifiedDiscountOrder(session.product, { mode: session.mode, storeId: session.store.id, skipSuggestion: true, size: session.size });
  }
  function storeCards(session) {
    return stores.map(function (store) {
      return '<button class="lx-fulfillment-store' + (session.draftStoreId === store.id ? ' is-active' : '') + '" type="button" data-fulfillment-store="' + store.id + '"><strong>' + esc(store.name) + '</strong><span>' + esc(store.address) + '</span><small>营业时间　' + store.hours + '　　电话　' + store.phone + '</small><em>距离 ' + store.distance + '</em></button>';
    }).join('');
  }
  function showStoreSelector(session) {
    session.draftStoreId = session.store.id;
    var contact = session.mode === 'pickup' ? '<div class="lx-fulfillment-form"><label for="lxPickupName">收货人</label><input id="lxPickupName" value="联小想"><label for="lxPickupPhone">电话</label><input id="lxPickupPhone" value="13028280000"></div><h3 class="lx-fulfillment-section-title">选择地址</h3>' : '';
    renderCustom(session, 'lx-store-selector-dialog', '<header class="lx-fulfillment-head"><h2>选择门店</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-fulfillment-body">' + contact + '<div class="lx-fulfillment-location">' + locationIcon() + '<span>位置：' + orderAddress + '</span><b>›</b></div><div class="lx-fulfillment-store-list">' + storeCards(session) + '</div></div><footer class="lx-fulfillment-footer"><button type="button" data-fulfillment-store-confirm>确定</button></footer>');
  }
  function subsidyGuide(session) {
    var authText = session.authenticated ? '实名认证已完成，可继续领取国家补贴。' : '检测您还未实名认证，请先完成实名可使用国家补贴优惠';
    var authButton = session.authenticated ? '已完成认证' : '实名认证';
    var html = '<header class="lx-fulfillment-head"><h2>领取国家补贴</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-fulfillment-body">';
    html += '<section class="lx-subsidy-step"><h3>第一步：实名认证</h3><p>' + authText + '</p><button class="lx-subsidy-outline" type="button" data-national-realname>' + authButton + '</button></section>';
    html += '<section class="lx-subsidy-step"><h3>第二步：去“京通微信小程序”领取/复制国补资格码</h3><div class="lx-subsidy-qr-row">' + qrMarkup() + '<div class="lx-subsidy-qr-copy">进入“京通小程序”<br>搜索“北京政府补贴”或点击“首页京通码”<br>点击“以旧换新资格码”<br>完成认证并领取</div></div></section>';
    html += '<section class="lx-subsidy-step"><h3>第三步：粘贴国补资格码享补贴</h3><div class="lx-subsidy-code"><input type="text" data-subsidy-code placeholder="请输入资格码"><button type="button" data-subsidy-bind>绑定资格码</button></div></section>';
    html += '<section class="lx-subsidy-step"><h3>第四步：回联想下单，下单时选择符合条件的发票自动抵扣</h3></section></div><footer class="lx-fulfillment-footer"><button type="button" data-subsidy-back>返回订单</button></footer>';
    renderCustom(session, 'lx-subsidy-dialog', html);
  }
  function showRealName(session) {
    var html = '<header class="lx-fulfillment-head"><h2>实名认证</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header>';
    html += '<div class="lx-fulfillment-body" style="display:flex;flex-direction:column"><p class="lx-realname-notice">实名认证需获取您的姓名、银行卡、手机号、证件信息（支持中国身份证）</p>';
    html += '<div class="lx-realname-grid"><label for="lxRealName">姓名</label><input id="lxRealName" placeholder="请输入姓名"><label for="lxRealId">证件</label><input id="lxRealId" placeholder="请输入证件号"><label for="lxRealPhone">手机</label><input id="lxRealPhone" placeholder="请输入手机号"><label for="lxRealCode">验证码</label><span class="lx-realname-code"><input id="lxRealCode" placeholder="请输入验证码"><button type="button" data-auth-code>获取验证码</button></span></div>';
    html += '<label class="lx-realname-consent"><input type="checkbox" data-realname-consent>我同意《实名认证协议》《联想网站隐私政策》</label><small style="margin-top:6px;color:#a39da6">请填写您的真实个人信息，一经填写不支持修改。禁止通过内部额度/福利，将产品进行二次销售从中牟利。</small></div>';
    html += '<footer class="lx-fulfillment-footer lx-realname-actions"><button class="secondary" type="button" data-realname-back>返回</button><button type="button" data-realname-next>下一步</button></footer>';
    renderCustom(session, 'lx-realname-dialog', html);
  }
  function pickupSuccess(session) {
    return '<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><div class="lx-pickup-success"><h3 class="lx-pickup-success-title"><i>✓</i>支付成功</h3><p class="lx-pickup-success-copy">已成功购买' + esc(session.product.name) + '，您可前往<b>' + esc(session.store.name) + '</b>凭自提码进行核销取货。</p><div class="lx-pickup-code"><div class="lx-pickup-code-head">自提码 <span>到店出示</span></div>' + qrMarkup() + '<strong>ABCDEFJ</strong></div><div class="lx-payment-actions"><button type="button" class="primary" data-view-paid-order>查看订单</button></div></div>';
  }
  function customizeSuccess(session, dialog) {
    var title = dialog.querySelector('#lxBuyDirectTitle');
    if (!title || title.textContent.trim() !== '支付成功') return;
    var newest = window.__lxState && window.__lxState.orders && window.__lxState.orders[0];
    if (newest && session.mode !== 'delivery') {
      newest.type = session.mode;
      newest.typeLabel = session.mode === 'pickup' ? '到店自提' : '门店闪送';
      newest.status = session.mode === 'pickup' ? '待取货' : '待发货';
      newest.fulfillmentMode = session.mode;
      newest.fulfillmentStore = session.store;
      if (session.mode === 'pickup') newest.pickupStore = session.store;
      try { localStorage.setItem('lexiang.orders.v1', JSON.stringify(window.__lxState.orders)); } catch (ignore) {}
    }
    if (session.mode !== 'pickup' || dialog.dataset.pickupSuccess === 'true') return;
    dialog.dataset.pickupSuccess = 'true';
    dialog.innerHTML = pickupSuccess(session);
  }
  function observe(session) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var observer = new MutationObserver(function () {
      decorateOrder(session);
      customizeSuccess(session, dialog);
    });
    observer.observe(dialog, { childList: true, subtree: true });
    session.observer = observer;
  }
  function openWithMode(product, options) {
    options = options || {};
    var normalized = normalizeProduct(product);
    originalOpen(normalized);
    var modal = document.querySelector('[data-buy-modal-direct]');
    if (!modal) return;
    var mode = options.mode === 'pickup' || options.mode === 'flash' ? options.mode : 'delivery';
    var selectedStore = stores.filter(function (store) { return store.id === options.storeId; })[0] || stores[0];
    var session = { modal: modal, product: normalized, mode: mode, store: selectedStore, size: options.size || null, authenticated: false, draftStoreId: '' };
    sessions.set(modal, session);
    modal.dataset.fulfillmentMode = mode;
    window.requestAnimationFrame(function () { rememberSize(session); decorateOrder(session); });
    observe(session);
    if (!options.skipSuggestion && mode === 'delivery') appendSuggestion(normalized);
    return modal;
  }

  window.__lxOpenUnifiedDiscountOrder = openWithMode;
  window.__lxFulfillmentCheckoutV60 = Object.freeze({ stores: stores, open: openWithMode });

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('[data-open-fulfillment]');
    if (link) {
      var suggestion = link.closest('[data-fulfillment-suggestion]');
      if (!suggestion || !suggestion._lxProduct) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openWithMode(suggestion._lxProduct, { mode: link.dataset.openFulfillment, skipSuggestion: true });
      return;
    }
    var modal = event.target.closest && event.target.closest('[data-buy-modal-direct]');
    var session = modal && sessions.get(modal);
    if (!session) return;
    var action = event.target.closest('[data-select-fulfillment-store],[data-fulfillment-store],[data-fulfillment-store-confirm],[data-claim-national-subsidy],[data-national-realname],[data-subsidy-back],[data-realname-back],[data-realname-next],[data-auth-code],[data-subsidy-bind]');
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action.matches('[data-select-fulfillment-store]')) return showStoreSelector(session);
    if (action.matches('[data-fulfillment-store]')) {
      session.draftStoreId = action.dataset.fulfillmentStore;
      Array.prototype.forEach.call(modal.querySelectorAll('[data-fulfillment-store]'), function (card) { card.classList.toggle('is-active', card === action); });
      return;
    }
    if (action.matches('[data-fulfillment-store-confirm]')) {
      session.store = stores.filter(function (store) { return store.id === session.draftStoreId; })[0] || session.store;
      return rerenderOrder(session);
    }
    if (action.matches('[data-claim-national-subsidy]')) return subsidyGuide(session);
    if (action.matches('[data-national-realname]')) return showRealName(session);
    if (action.matches('[data-subsidy-back]')) return rerenderOrder(session);
    if (action.matches('[data-realname-back]')) return subsidyGuide(session);
    if (action.matches('[data-auth-code]')) {
      action.textContent = '60s后重试';
      action.disabled = true;
      window.setTimeout(function () {
        if (action.isConnected) { action.textContent = '获取验证码'; action.disabled = false; }
      }, 3000);
      return;
    }
    if (action.matches('[data-realname-next]')) {
      if (!modal.querySelector('[data-realname-consent]').checked) {
        window.alert('请先阅读并同意实名认证协议及隐私政策');
        return;
      }
      session.authenticated = true;
      return subsidyGuide(session);
    }
    if (action.matches('[data-subsidy-bind]')) {
      var input = modal.querySelector('[data-subsidy-code]');
      if (!input.value.trim()) { input.focus(); return; }
      action.textContent = '已绑定';
      action.disabled = true;
    }
  }, true);

  var previewMode = new URLSearchParams(location.search).get('showOrder');
  if (['pickup', 'flash', 'pickup-store', 'flash-store', 'subsidy', 'realname', 'pickup-success'].indexOf(previewMode) >= 0) {
    window.setTimeout(function () {
      var mode = previewMode.indexOf('flash') === 0 ? 'flash' : previewMode === 'subsidy' || previewMode === 'realname' ? 'delivery' : 'pickup';
      var modal = openWithMode({ sku: 'preview-y7000p', name: '联想拯救者Y7000P 2025 16英寸电竞游戏笔记本', price: 9799, originalPrice: 9999, discount: 200, image_url: '/assets/product-placeholder.svg', series: '拯救者', size: '16英寸', configuration: '16G/1T SSD', configurationLabel: '16G/1T SSD' }, { mode: mode, skipSuggestion: true });
      var session = modal && sessions.get(modal);
      if (!session) return;
      if (previewMode.indexOf('-store') > 0) showStoreSelector(session);
      if (previewMode === 'subsidy') subsidyGuide(session);
      if (previewMode === 'realname') showRealName(session);
      if (previewMode === 'pickup-success') {
        var dialog = modal.querySelector('.lx-buy-direct-dialog');
        applySize(dialog, session);
        dialog.className = 'lx-buy-direct-dialog lx-payment-dialog';
        dialog.innerHTML = pickupSuccess(session);
      }
    }, 50);
  }
})();

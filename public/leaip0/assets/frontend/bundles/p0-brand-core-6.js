
;/* public/leaip0/assets/frontend/js/core/composer-smart-actions-v1.js */
(function () {
  "use strict";
  var pageScenes = Object.create(null), currentScene = null;
  var shownScenes = new Set(), sceneCandidate = '', sceneSince = 0;
  var suppressRevealUntil = 0, lastUserMessageSignature = '', wasSending = false;
  var syncTimer = 0;
  var actions = ["推荐购买第2款商品", "我要对比1、3、4"];
  // 乐享输入框按钮展示全套：all pages share readiness, first reveal and motion.
  window.__lxComposerButtonSuite = {
    name: '乐享输入框按钮展示全套',
    register: function(name, scene) { pageScenes[name] = scene; scheduleSync(); }
  };
  function activeTabId(content) {
    var tab = content.querySelector('.lx-tab[aria-selected="true"], .lx-tab.is-active');
    return tab && (tab.getAttribute('data-shop-tab-id') || tab.getAttribute('data-tab-id')) || '';
  }
  var serviceActions = ["推荐购买第1款商品", "我要对比1、2"];
  function visibleRecommendation(content) {
    var pages = content.querySelectorAll('.reco-page, .lx-reco-poc-page');
    return Array.prototype.find.call(pages, function(page) { var rect = page.getBoundingClientRect(); return rect.width && rect.height; }) || null;
  }
  function isServiceRecommendation(content) {
    var page = visibleRecommendation(content);
    if (!page) return false;
    if (page.matches('.lx-service-reco-page, [data-member-service-page]')) return true;
    var rows = page.querySelectorAll('.reco-row, .lx-reco-poc-row');
    if (rows.length && Array.prototype.every.call(rows, function(row) { return /^SERVICE-/i.test(row.getAttribute('data-sku') || '') || row.hasAttribute('data-service-id'); })) return true;
    var heading = page.querySelector('h2, h1, .reco-head');
    return !!heading && /服务推荐|推荐服务|延保|保修/.test(heading.textContent || '');
  }
  var recommendationScene = {
    labels: function(content) {
      return isServiceRecommendation(content) ? serviceActions : actions;
    },
    source: '.reco-page, .lx-reco-poc-page',
    identity: function(content) {
      var rows = content.querySelectorAll('.reco-row, .lx-reco-poc-row');
      return activeTabId(content) || Array.prototype.map.call(rows, function(row) {
        return row.getAttribute('data-sku') || row.textContent.trim();
      }).join('|');
    },
    ready: function(content) {
      var page = content.querySelector('.reco-page, .lx-reco-poc-page');
      return page && page.querySelector('.reco-row, .lx-reco-poc-row') && /为你推荐|推荐商品|AI\s*推荐|服务推荐/.test(page.textContent || '');
    },
    invoke: function(content, label) {
      var state = window.__lxState;
      if (!isServiceRecommendation(content) && state && (label === actions[0] || label === actions[1])) {
        var tab = (state.tabs || []).find(function(tab) { return tab.id === state.activeTabId; });
        var page = visibleRecommendation(content);
        var rows = page ? Array.from(page.querySelectorAll('.reco-row[data-sku], .lx-reco-poc-row[data-sku]')) : [];
        var pool = tab && Array.isArray(tab.products) ? tab.products : [];
        var products = rows.length ? rows.map(function(row) { return pool.find(function(p) { return String(p.sku) === row.getAttribute('data-sku'); }); }) : pool;
        var indices = label === actions[0] ? [1] : [0,2,3];
        var selected = indices.map(function(index) { return products[index]; });
        if (selected.every(function(p) { return p && p.sku; })) {
          state.refProducts = label === actions[1] ? selected.map(function(p) { return Object.assign({}, p); }) : [];
          state.refProduct = null;
          state._composerRecoPurchase = label === actions[0] ? {query:label,product:Object.assign({},selected[0])} : null;
        } else { return; }
      }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  };
  window.__lxComposerButtonSuite.register('reco', recommendationScene);
  window.__lxComposerButtonSuite.register('recommendation', recommendationScene);
  window.__lxComposerButtonSuite.register('service', {
    labels: serviceActions,
    source: '[data-member-service-page]',
    identity: function(content) {
      var page = content.querySelector('[data-member-service-page]');
      return activeTabId(content) + ':' + Array.prototype.map.call(page.querySelectorAll('[data-service-id]'), function(row) { return row.getAttribute('data-service-id'); }).join('|');
    },
    ready: function(content) { return !!content.querySelector('[data-member-service-page] .reco-row[data-service-id]'); },
    invoke: recommendationScene.invoke
  });
  function storeDocument(content) {
    var frame = content.querySelector('.lx-store-exact-frame iframe');
    try { return frame && frame.contentDocument; } catch (e) { return null; }
  }
  window.__lxComposerButtonSuite.register('stores', {
    labels: function() {
      var id = window.__lxState && window.__lxState.activeTabId;
      return String(id || '').startsWith('info:store-navigation:') ? ['我要预约这个门店'] : ['我要预约这个门店', '我要导航到这个门店'];
    },
    source: '.lx-store-component-host, .lx-store-exact-frame',
    identity: function(content) { return activeTabId(content) || 'stores'; },
    ready: function(content) { var host = content.querySelector('.lx-store-component-host'); if (host && host.__lxStoreApi) return !!host.__lxStoreApi.getCurrentStore(); var doc = storeDocument(content); return !!(doc && doc.querySelector('[data-prototype-action="导航"]')); },
    invoke: function(content, label) {
      var host = content.querySelector('.lx-store-component-host');
      var api = host && host.__lxStoreApi;
      if (api) {
        var store = api.getCurrentStore(); if (!store) return;
        var isDetail = !!(window.__lxState && String(window.__lxState.activeTabId).startsWith('info:store-detail:'));
        if (label === '我要预约这个门店') {
          window.__lxPendingStoreAppointment = Object.assign({}, store, {tel:store.tel || store.phone});
          window.__lxStoreAppointmentById = window.__lxStoreAppointmentById || {};
          window.__lxStoreAppointmentById[String(store.id)] = window.__lxPendingStoreAppointment;
          if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
          if (isDetail && window.__lxOpenFeature) window.__lxOpenFeature('stores');
          if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
        }
        else if (isDetail && window.__lxOpenStoreNavigationTab) { window.__lxStoreNavigationQuery = label; window.__lxOpenStoreNavigationTab(store); }
        else api.openNavigation(store.id);
        return;
      }
      var doc = storeDocument(content); if (!doc) return;
      var action = label === '我要预约这个门店' ? '预约' : '导航';
      var detail = doc.querySelector('.lx-store-detail-page.is-active');
      var target = detail && detail.querySelector('[data-detail-action="' + action + '"]') || doc.querySelector('[data-prototype-action="' + action + '"]');
      if (target) target.click();
      else if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solution-detail', {
    labels: ['请专家联系我'],
    source: '.lx-specific-solution-detail',
    identity: function(content) { var title = content.querySelector('.lx-specific-solution-detail h1'); return (activeTabId(content) || 'solution-detail') + ':' + (title ? title.textContent.trim() : ''); },
    ready: function(content) { var title = content.querySelector('.lx-specific-solution-detail h1'); return !!title && !!title.textContent.trim(); },
    invoke: function(content, label) {
      if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solution-compare', {
    labels: ['请专家联系我'],
    source: '.lx-solution-compare-page',
    identity: function(content) { var title = content.querySelector('.lx-solution-compare-page h2'); return (activeTabId(content) || 'solution-compare') + ':' + (title ? title.textContent.trim() : ''); },
    ready: function(content) { var title = content.querySelector('.lx-solution-compare-page h2'); return !!title && content.querySelectorAll(".lx-solution-compare-page .phead").length >= 2; },
    invoke: function(content, label) {
      if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solutions', {
    labels: function(content) {
      var page = content.querySelector('.lx-solution-center-page');
      var industry = page && page.getAttribute('data-solution-selected');
      return ['请专家联系我', industry && industry !== 'all' ? '对比1、3、4方案' : '对比教育行业的2、3方案'];
    },
    source: '.lx-solution-center-page',
    identity: function(content) { var page = content.querySelector('.lx-solution-center-page'); return (activeTabId(content) || 'solutions') + ':' + (page.getAttribute('data-solution-selected') || 'all'); },
    ready: function(content) { return !!content.querySelector('.lx-solution-center-page .lx-solution-card'); },
    invoke: function(content, label) {
      if (label === '请专家联系我') {
        if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
        recommendationScene.invoke(content, label); return;
      }
      var page = content.querySelector('.lx-solution-center-page');
      var industry = page.getAttribute('data-solution-selected');
      var all = !industry || industry === 'all';
      var floor = Array.prototype.find.call(page.querySelectorAll('.lx-solution-floor'), function(node) { return node.getAttribute('data-solution-industry') === (all ? '教育' : industry); });
      if (!floor) return;
      var cards = floor.querySelectorAll('.lx-solution-card');
      var refs = (all ? [1,2] : [0,2,3]).map(function(index) {
        var card = cards[index]; if (!card) return null;
        var title = card.getAttribute('data-solution-title');
        return {type:'solution',sku:'solution:' + title,name:title,sector:card.getAttribute('data-solution-sector'),scenario:card.getAttribute('data-solution-scenario'),description:card.getAttribute('data-solution-intro'),img:card.querySelector('img') && card.querySelector('img').getAttribute('src')};
      }).filter(Boolean);
      if (refs.length < 2 || !window.__lxState) return;
      window.__lxState.refProducts = refs;
      window.__lxState.refProduct = null;
      recommendationScene.invoke(content, '对比这些解决方案：' + refs.map(function(ref) { return '「' + ref.name + '」'; }).join('、'));
    }
  });
  window.__lxComposerButtonSuite.register('devices', {
    labels: ['一键绑定', '绑定其他设备'],
    source: '.leai-device-center',
    identity: function(content) { return activeTabId(content) || 'my-devices'; },
    ready: function(content) { return !!content.querySelector('.leai-device-center [data-device-unified-list]'); },
    invoke: function(content, label) {
      var page = content.querySelector('.leai-device-center');
      if (!page) return;
      var target = label === '一键绑定' ? page.querySelector('[data-device-bind-purchased]') : page.querySelector('[data-device-add]');
      if (!target && label === '一键绑定') {
        var all = page.querySelector('[data-device-filter="all"]');
        if (all) all.click();
        page = content.querySelector('.leai-device-center');
        target = page && (page.querySelector('[data-device-bind-purchased]') || page.querySelector('[data-device-add]'));
      }
      if (target) target.click();
    }
  });
  window.__lxComposerButtonSuite.register('detail', {
    labels: function(content) {
      var enterprise = /^\/(b-chat|biz-chat)(?:\/|$)/.test(location.pathname);
      var primary = content && content.querySelector('.product-detail .detail-actions .detail-primary');
      var labels = enterprise && primary && primary.textContent.trim() === '一键领优惠下单' ? ['咨询客服'] : [];
      var skus = content ? Array.prototype.map.call(content.querySelectorAll('.lx-spu-chip[data-variant-sku]'), function(chip) { return chip.getAttribute('data-variant-sku'); }).filter(Boolean) : [];
      if (new Set(skus).size > 1) labels.unshift('对比所有系列');
      return labels;
    },
    source: '.product-detail',
    identity: function(content) {
      var product = window.__lxState && window.__lxState.currentProduct;
      var title = content.querySelector('[data-detail-title]');
      // A configuration change is still the same detail scene.
      var variants = Array.prototype.map.call(content.querySelectorAll('.lx-spu-chip[data-variant-sku]'), function(chip) { return chip.getAttribute('data-variant-sku'); }).filter(Boolean).sort();
      if (variants.length) return 'series:' + Array.from(new Set(variants)).join('|');
      return product && (product.spu_id || product.sku || product.id) || title && title.textContent || '';
    },
    ready: function(content) {
      var title = content.querySelector('[data-detail-title]');
      return title && title.textContent.trim() && content.querySelector('.lx-spu-chip');
    },
    invoke: function(content, label) {
      if (label === '咨询客服') {
        window.open('https://b.lenovo.com.cn/activity/qygzxdhym.html', '_blank', 'noopener,noreferrer');
        return;
      }
      var state = window.__lxState;
      if (!state) return;
      var seen = new Set();
      var products = Array.from(content.querySelectorAll('.lx-spu-chip[data-variant-sku]')).map(function(chip) {
        var sku = chip.getAttribute('data-variant-sku');
        if (!sku || seen.has(sku)) return null;
        seen.add(sku);
        var cached = state.officialProducts && state.officialProducts[sku];
        return Object.assign({}, cached || {}, {sku:sku,name:cached && cached.name || chip.getAttribute('title') || state.currentProduct && state.currentProduct.name || '当前系列商品'});
      }).filter(Boolean);
      if (products.length < 2) return;
      state.refProducts = products;
      state.refProduct = null;
      state._composerRecoPurchase = null;
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat('对比所有系列');
    }
  });
  function getRightContent() {
    return document.querySelector("body > .shell > .content, main.shell > .content, .shell > section.content");
  }

  function createActions(bottom) {
    if (!bottom) return;
    var labels = currentScene ? currentScene.labels : actions;
    var existing = bottom.querySelector('.lx-smart-actions');
    if (existing) {
      var actual = Array.prototype.map.call(existing.querySelectorAll('.lx-smart-action span'), function(node) { return node.textContent; });
      if (JSON.stringify(actual) === JSON.stringify(labels)) return;
      existing.remove();
    }

    var panel = document.createElement("section");
    panel.className = "lx-smart-actions";
    panel.setAttribute("aria-label", "为你选择");
    panel.innerHTML =
      '<button class="lx-smart-actions-close" type="button" aria-label="关闭为你选择">' +
        '<span aria-hidden="true"></span>' +
      '</button>' +
      '<div class="lx-smart-actions-title">' +
        '<img src="/assets/icons/global-sparkle.svg" alt="" aria-hidden="true">' +
        '<span>为你选择</span>' +
      '</div>' +
      '<div class="lx-smart-actions-list"></div>';

    var list = panel.querySelector(".lx-smart-actions-list");
    labels.forEach(function (label) {
      var button = document.createElement("button");
      button.className = "lx-smart-action";
      button.type = "button";
      button.innerHTML =
        '<span></span>' +
        '<img src="/assets/icons/arrow-down.svg" alt="" aria-hidden="true">';
      button.querySelector("span").textContent = label;
      button.addEventListener("click", function () {
        if (window.__lxState && window.__lxState.sending) return;
        collapseCurrent();
        if (currentScene) { currentScene.definition.invoke(getRightContent(), label); return; }
        if (window.__lxBridge && typeof window.__lxBridge.sendChat === "function") {
          window.__lxBridge.sendChat(label);
          return;
        }
        var textarea = bottom.querySelector(".composer textarea");
        if (!textarea) return;
        textarea.value = label;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        var sendButton = bottom.querySelector(".send-btn, .lxfd-send, #lxfdSend");
        if (sendButton) sendButton.click();
        else textarea.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true
        }));
      });
      list.appendChild(button);
    });

    panel.querySelector(".lx-smart-actions-close").addEventListener("click", function () {
      cancelMotion(bottom);
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-motion", "lx-smart-actions-compact");
      restoreCurrentShortcuts(bottom, true);
    });

    var composer = bottom.querySelector(".composer");
    bottom.insertBefore(panel, composer || null);

  }

  function runSmartActionsMotion(bottom, panel) {
    cancelMotion(bottom);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { bottom.classList.add("lx-smart-actions-arrived"); return; }
    if (!panel) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }
    var source = getRightContent();
    var target = panel.querySelector(".lx-smart-actions-list") || panel;
    if (!source || !target || !Element.prototype.animate) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }
    var sourceView = source.querySelector(currentScene ? currentScene.definition.source : ".reco-page, .lx-reco-poc-page") || source;
    var sourceRect = sourceView.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }

    bottom.classList.add("lx-smart-actions-motion");
    var guide = document.createElement("div");
    guide.className = "lx-smart-actions-guide lx-smart-actions-snapshot";
    guide.setAttribute("aria-hidden", "true");
    guide.style.left = sourceRect.left + "px";
    guide.style.top = sourceRect.top + "px";
    guide.style.width = sourceRect.width + "px";
    guide.style.height = sourceRect.height + "px";

    var snapshot = sourceView.cloneNode(true);
    if (sourceView.shadowRoot) {
      var visual = sourceView.shadowRoot.querySelector('.lx-store-page') || sourceView.shadowRoot.querySelector('main') || sourceView.shadowRoot;
      snapshot = document.createElement('div');
      var shadow = snapshot.attachShadow({mode:'open'});
      Array.prototype.forEach.call(sourceView.shadowRoot.children, function(node) { if (node.tagName !== 'SCRIPT') shadow.appendChild(node.cloneNode(true)); });
    }
    snapshot.removeAttribute("id");
    snapshot.classList.add("lx-smart-actions-snapshot-content");
    snapshot.querySelectorAll("script, iframe, video, audio").forEach(function (node) {
      node.remove();
    });
    snapshot.querySelectorAll("[id]").forEach(function (node) {
      node.removeAttribute("id");
    });
    snapshot.querySelectorAll("button, input, textarea, select, a").forEach(function (node) {
      node.setAttribute("tabindex", "-1");
    });
    snapshot.style.width = sourceRect.width + "px";
    snapshot.style.height = sourceRect.height + "px";
    guide.appendChild(snapshot);
    document.body.appendChild(guide);

    var endWidth = Math.min(targetRect.width, 270);
    var endHeight = Math.min(targetRect.height, 82);
    var endLeft = targetRect.left;
    var endTop = targetRect.top;
    var deltaX = endLeft - sourceRect.left;
    var deltaY = endTop - sourceRect.top;
    var scaleX = endWidth / sourceRect.width;
    var scaleY = endHeight / sourceRect.height;
    var motionDuration = 3050;
    var controlsRevealLead = 2000;
    var animation = guide.animate([
      {
        transform: "translate3d(0,0,0) scale(.992)",
        borderRadius: "12px",
        opacity: 1,
        offset: 0
      },
      {
        transform: "translate3d(0,0,0) scale(.985)",
        borderRadius: "12px",
        opacity: 1,
        offset: .16
      },
      {
        transform: "translate3d(" + (deltaX * .18) + "px," + (deltaY * .18) + "px,0) scale(.78)",
        borderRadius: "12px",
        opacity: .88,
        offset: .38
      },
      {
        transform: "translate3d(" + (deltaX * .72) + "px," + (deltaY * .72) + "px,0) scale(" + (scaleX * 1.45) + "," + (scaleY * 1.45) + ")",
        borderRadius: "10px",
        opacity: .68,
        offset: .72
      },
      {
        transform: "translate3d(" + deltaX + "px," + deltaY + "px,0) scale(" + scaleX + "," + scaleY + ")",
        borderRadius: "10px",
        opacity: .34,
        offset: .9
      },
      {
        transform: "translate3d(" + deltaX + "px," + deltaY + "px,0) scale(" + scaleX + "," + scaleY + ")",
        borderRadius: "10px",
        opacity: 0,
        offset: 1
      }
    ], {
      duration: motionDuration,
      easing: "cubic-bezier(.22,.78,.22,1)",
      fill: "forwards"
    });

    var motion = { animation: animation, guide: guide, timer: 0 };
    bottom._lxSmartMotion = motion;
    var controlsRevealTimer = window.setTimeout(function () {
      if (!bottom.classList.contains("lx-smart-actions-collapsing") && !bottom.classList.contains("lx-smart-actions-compact") && bottom.classList.contains("lx-smart-actions-active")) bottom.classList.add("lx-smart-actions-arrived");
    }, motionDuration - controlsRevealLead);

    motion.timer = controlsRevealTimer;
    function finish() {
      if (bottom._lxSmartMotion !== motion) return;
      bottom._lxSmartMotion = null;
      window.clearTimeout(controlsRevealTimer);
      guide.remove();
      bottom.classList.remove("lx-smart-actions-motion");
      if (!bottom.classList.contains("lx-smart-actions-collapsing") && !bottom.classList.contains("lx-smart-actions-compact") && bottom.classList.contains("lx-smart-actions-active")) bottom.classList.add("lx-smart-actions-arrived");
    }
    animation.addEventListener("finish", finish, { once: true });
    animation.addEventListener("cancel", finish, { once: true });
  }

  function revealCurrent() {
    if (Date.now() < suppressRevealUntil) return false;
    if (!currentScene) {
      hideCurrent();
      return false;
    }
    var revealed = false;
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      if (!bottom.getBoundingClientRect().width || !bottom.getBoundingClientRect().height) return;
      createActions(bottom);
      if (bottom.classList.contains("lx-smart-actions-active") && !bottom.classList.contains("lx-smart-actions-compact")) return;
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-compact", "lx-smart-actions-collapsing");
      bottom.classList.remove("lx-smart-actions-arrived", "lx-smart-actions-motion");
      bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
        currentActions.style.setProperty("display", "none", "important");
        currentActions.setAttribute("aria-hidden", "true");
      });
      bottom.classList.add("lx-smart-actions-active");
      runSmartActionsMotion(bottom, bottom.querySelector(".lx-smart-actions"));
      revealed = true;
    });
    return revealed;
  }

  function restoreCurrentShortcuts(bottom, animate) {
    bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
      currentActions.style.removeProperty("display");
      currentActions.removeAttribute("aria-hidden");
    });
    if (!animate) return;
    bottom.classList.remove("lx-shortcuts-arriving");
    void bottom.offsetWidth;
    bottom.classList.add("lx-shortcuts-arriving");
    window.setTimeout(function () {
      bottom.classList.remove("lx-shortcuts-arriving");
    }, 2750);
  }

  function hideCurrent() {
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      cancelMotion(bottom);
      var shouldAnimateShortcuts = bottom.classList.contains("lx-smart-actions-active");
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-motion", "lx-smart-actions-compact", "lx-smart-actions-collapsing");
      restoreCurrentShortcuts(bottom, shouldAnimateShortcuts);
    });
  }

  function showCompactCurrent() {
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      createActions(bottom);
      bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
        currentActions.style.setProperty("display", "none", "important");
        currentActions.setAttribute("aria-hidden", "true");
      });
      cancelMotion(bottom);
      bottom.classList.remove("lx-smart-actions-motion", "lx-smart-actions-collapsing");
      bottom.classList.add("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-compact");
    });
  }


  function scheduleSync(delay) {
    if (syncTimer) return;
    syncTimer = window.setTimeout(function() { syncTimer = 0; syncPageScene(); }, delay == null ? 60 : delay);
  }
  function userMessageSignature() {
    var nodes = document.querySelectorAll('.lx-p0-message.user, .msg.user, .message.user, .lxfd-msg-user, .lxfd-msg.user, [data-role="user"]');
    return nodes.length ? nodes.length + ':' + String(nodes[nodes.length - 1].textContent || '').trim() : '0';
  }
  function syncSendCollapse() {
    var signature = userMessageSignature();
    var sending = !!(window.__lxState && window.__lxState.sending);
    if (signature === '0' && lastUserMessageSignature && lastUserMessageSignature !== '0') {
      shownScenes.clear(); currentScene = null; sceneCandidate = ''; hideCurrent();
      document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); });
    } else if ((sending && !wasSending) || (lastUserMessageSignature && signature !== lastUserMessageSignature)) collapseCurrent();
    wasSending = sending; lastUserMessageSignature = signature;
  }
  function syncPageScene() {
    syncSendCollapse();
    var content = getRightContent();
    var servicePage = content && content.querySelector('[data-member-service-page]');
    var serviceVisible = servicePage && servicePage.getBoundingClientRect().width && servicePage.getBoundingClientRect().height;
    var devicePage = content && content.querySelector('.leai-device-center');
    var deviceVisible = devicePage && devicePage.getBoundingClientRect().width && devicePage.getBoundingClientRect().height;
    var storePage = content && content.querySelector('.lx-store-component-host, .lx-store-exact-frame');
    var storeVisible = storePage && storePage.getBoundingClientRect().width && storePage.getBoundingClientRect().height;
    var solutionDetail = content && content.querySelector('.lx-specific-solution-detail');
    var solutionDetailVisible = solutionDetail && solutionDetail.getBoundingClientRect().width && solutionDetail.getBoundingClientRect().height;
    var solutionCompare = content && content.querySelector('.lx-solution-compare-page');
    var solutionCompareVisible = solutionCompare && solutionCompare.getBoundingClientRect().width && solutionCompare.getBoundingClientRect().height;
    var solutionPage = content && content.querySelector('.lx-solution-center-page');
    var solutionVisible = solutionPage && solutionPage.getBoundingClientRect().width && solutionPage.getBoundingClientRect().height;
    var scene = content && pageScenes[solutionCompareVisible ? 'solution-compare' : solutionDetailVisible ? 'solution-detail' : solutionVisible ? 'solutions' : storeVisible ? 'stores' : deviceVisible ? 'devices' : serviceVisible ? 'service' : content.getAttribute('data-view')];
    if (!scene) {
      if (currentScene) { currentScene = null; sceneCandidate = ''; hideCurrent(); document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); }); }
      if (wasSending) scheduleSync(100);
      return;
    }
    // Wait for the answer and page-generation animation, including the first query.
    if (wasSending || content.getAttribute('aria-busy') === 'true' || content.classList.contains('is-generating-tab') || content.querySelector('.lx-page-generating') || !scene.ready(content)) {
      sceneCandidate = ''; sceneSince = 0; scheduleSync(100); return;
    }
    var key = (solutionCompareVisible ? 'solution-compare' : solutionDetailVisible ? 'solution-detail' : solutionVisible ? 'solutions' : storeVisible ? 'stores' : deviceVisible ? 'devices' : serviceVisible || scene === recommendationScene && isServiceRecommendation(content) ? 'service' : content.getAttribute('data-view')) + ':' + scene.identity(content);
    var labels = typeof scene.labels === 'function' ? scene.labels(content) : scene.labels;
    var labelKey = JSON.stringify(labels);
    if (!currentScene || currentScene.key !== key) {
      hideCurrent(); document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); });
      currentScene = { key: key, definition: scene, labels: labels.slice(), labelKey: labelKey };
      sceneCandidate = ''; sceneSince = 0;
      // Compact is only for a scene which really completed its first reveal.
      if (shownScenes.has(key) && labels.length) showCompactCurrent();
    } else if (currentScene.labelKey !== labelKey) {
      currentScene.labelKey = labelKey; currentScene.labels = labels.slice(); currentScene.definition = scene;
      document.querySelectorAll('.assistant-panel .assistant-bottom .lx-smart-actions').forEach(function(panel) { var bottom = panel.parentElement; panel.remove(); createActions(bottom); });
    }
    if (!labels.length) { if (!currentScene.empty) { hideCurrent(); currentScene.empty = true; } return; }
    currentScene.empty = false;
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(createActions);
    if (shownScenes.has(key)) return;
    var source = content.querySelector(scene.source);
    if (!source || !source.getBoundingClientRect().width || !source.getBoundingClientRect().height) { scheduleSync(100); return; }
    if (sceneCandidate !== key + labelKey) { sceneCandidate = key + labelKey; sceneSince = Date.now(); }
    if (Date.now() - sceneSince < 450 || Date.now() < suppressRevealUntil) { scheduleSync(100); return; }
    if (revealCurrent()) shownScenes.add(key);
    else scheduleSync(100);
  }
  function cancelMotion(bottom) {
    window.clearTimeout(bottom._lxSmartCollapseTimer);
    bottom._lxSmartCollapseTimer = 0;
    var motion = bottom._lxSmartMotion;
    if (!motion) return;
    bottom._lxSmartMotion = null;
    window.clearTimeout(motion.timer);
    motion.animation.cancel(); motion.guide.remove();
    bottom.classList.remove('lx-smart-actions-motion');
  }
  function collapseCurrent() {
    suppressRevealUntil = Date.now() + 1600;
    document.querySelectorAll('.assistant-panel .assistant-bottom').forEach(function(bottom) {
      if (!bottom.classList.contains('lx-smart-actions-active')) return;
      if (bottom.classList.contains('lx-smart-actions-collapsing') || bottom.classList.contains('lx-smart-actions-compact')) return;
      cancelMotion(bottom);
      bottom.classList.add('lx-smart-actions-collapsing');
      bottom._lxSmartCollapseTimer = window.setTimeout(function() {
        bottom._lxSmartCollapseTimer = 0;
        bottom.classList.remove('lx-smart-actions-arrived', 'lx-smart-actions-collapsing');
        bottom.classList.add('lx-smart-actions-compact');
      }, 720);
    });
    scheduleSync();
  }
  function activateDeviceRow(event) {
    var row = event.target.closest && event.target.closest('[data-device-unified-list] [data-device-list-item]');
    if (!row || event.target.closest('button, a, input, select, textarea')) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    var action = row.querySelector('[data-device-detail]');
    if (!action) return;
    event.preventDefault();
    action.click();
  }
  function prepareDeviceRows() {
    document.querySelectorAll('[data-device-unified-list] [data-device-list-item]').forEach(function(row) {
      if (!row.querySelector('[data-device-detail]')) return;
      if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '0');
      row.style.cursor = 'pointer';
    });
  }
  function init() {
    document.addEventListener('click', activateDeviceRow);
    document.addEventListener('keydown', activateDeviceRow);
    var deviceRowObserver = new MutationObserver(prepareDeviceRows);
    deviceRowObserver.observe(document.body, {childList:true, subtree:true});
    prepareDeviceRows();
    if (!document.getElementById('lx-solution-list-header-hidden')) {
      var solutionStyle = document.createElement('style');
      solutionStyle.id = 'lx-solution-list-header-hidden';
      solutionStyle.textContent = '.info-page:has(> .lx-solution-center-page) > .reco-head, .lx-solution-center-page > .lx-solution-tabs { display: none !important; } .lx-solution-center-page .lx-solution-card > em { display: none !important; } html body .content .lx-sd-entity-card[data-solution-product-detail] .lx-sd-entity-card-copy > em { display:none!important; } html body .content .lx-solution-center-page .lx-solution-card { border:0!important; } html body[data-page] main.shell section.content:has(.lx-solution-center-page) { background-color:#f5f5f7!important; background-image:linear-gradient(180deg,#fff 0,#fff 74px,#fefefe 96px,#fafafa 122px,#f7f7f8 164px,#f5f5f7 214px,#f5f5f7 100%)!important; background-repeat:no-repeat!important; } html body[data-page] main.shell section.content .info-page:has(.lx-solution-center-page), html body[data-page] main.shell section.content .page:has(.lx-solution-center-page), html body .content .lx-solution-center-page, html body .content .lx-solution-center-page .lx-solution-floor { background:transparent!important; }';
      document.head.appendChild(solutionStyle);
    }
    lastUserMessageSignature = userMessageSignature();
    var observer = new MutationObserver(function() { scheduleSync(); });
    document.querySelectorAll('.content, .assistant-panel, #lxfdThread').forEach(function(root) {
      observer.observe(root, {childList:true,subtree:true,attributes:true,attributeFilter:['class','data-view','aria-busy','aria-selected','data-variant-sku','data-solution-selected']});
    });
    observer.observe(document.body, {attributes:true,attributeFilter:['class']});
    observer.observe(document.documentElement, {attributes:true,attributeFilter:['class']});
    window.addEventListener('resize', function() { scheduleSync(); });
    document.addEventListener('load', function(event) { if (event.target.matches && event.target.matches('.content img')) scheduleSync(); }, true);
    window.addEventListener('click', function(event) { if (event.target.closest && event.target.closest('.send-btn, .hero-send-btn, .lxfd-send, #lxfdSend')) collapseCurrent(); }, true);
    window.addEventListener('keydown', function(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target.matches && event.target.matches('.composer textarea, .lxfd-composer textarea')) collapseCurrent(); }, true);
    window.addEventListener('submit', function(event) { if (event.target.matches && event.target.matches('.composer, .lxfd-composer')) collapseCurrent(); }, true);
    scheduleSync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

/* Shared modal-entry small card, available before checkout assets load. */
(()=>{const style=document.createElement("style");style.id="lx-enterprise-lead-small-card";style.textContent="html body .lx-p0-message.ai .lx-enterprise-lead-reco,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco { width:50%!important; min-width:190px!important; max-width:240px!important; min-height:48px!important; display:flex!important; align-items:center!important; justify-content:space-between!important; gap:16px!important; margin-top:14px!important; padding:0 14px 0 16px!important; border:1px solid var(--answer-card-border,#e2ddeb)!important; border-radius:8px!important; background:#fff!important; box-shadow:none!important; }\nhtml body .lx-p0-message.ai .lx-enterprise-lead-reco .answer-cta-title,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco .answer-cta-title { overflow:hidden!important; color:#4d144a!important; font-size:14px!important; line-height:20px!important; font-weight:600!important; white-space:nowrap!important; text-overflow:ellipsis!important; }\nhtml body .lx-p0-message.ai .lx-enterprise-lead-reco .answer-cta-icon,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco .answer-cta-icon { flex:0 0 24px!important; width:24px!important; height:24px!important; display:grid!important; place-items:center!important; }\nhtml body .lx-p0-message.ai .lx-enterprise-lead-reco .answer-cta-icon img,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco .answer-cta-icon img { width:16px!important; height:16px!important; }\nhtml body .lx-p0-message.ai .lx-enterprise-lead-reco:hover,\nhtml body .lx-p0-message.ai .lx-enterprise-lead-reco:focus-visible,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco:hover,\nhtml body .lx-p0-message.assistant .lx-enterprise-lead-reco:focus-visible { border-color:#4d144a!important; background:#fcfaff!important; outline:none!important; }\n\n/* Fullscreen assistant reuses the same authentication recommendation card. */\n.lxfd-msg-ai.lx-auth-flow-answer .lxfd-ai-body strong { font-weight:600!important; }\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco { width:50%!important; min-width:190px!important; max-width:240px!important; min-height:48px!important; display:flex!important; align-items:center!important; justify-content:space-between!important; gap:16px!important; margin-top:14px!important; padding:0 14px 0 16px!important; border:1px solid var(--answer-card-border,#e2ddeb)!important; border-radius:8px!important; background:#fff!important; box-shadow:none!important; }\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco .answer-cta-title { overflow:hidden!important; color:#4d144a!important; font-size:14px!important; line-height:20px!important; font-weight:600!important; white-space:nowrap!important; text-overflow:ellipsis!important; }\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco .answer-cta-icon { flex:0 0 24px!important; width:24px!important; height:24px!important; display:grid!important; place-items:center!important; }\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco .answer-cta-icon img { width:16px!important; height:16px!important; }\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco:hover,\nhtml body .lxfd-msg-ai .lx-enterprise-lead-reco:focus-visible { border-color:#4d144a!important; background:#fcfaff!important; outline:none!important; }\n\n";document.head.appendChild(style);})();

;


;/* public/leaip0/assets/frontend/js/core/followup-chevron-v1.js */
(function(){
  "use strict";
  var selector='.assistant-panel .followups button,.assistant-panel [data-followups] button,.assistant-panel .lx-p0-suggest-chip,.lxfd-followups button,.lxfd-ai-body .followups button,.lxfd-ai-body [data-followups] button,.lxfd-ai-body .lx-p0-suggest-chip';
  var style=document.createElement('style');
  style.textContent=selector.split(',').map(function(s){return s+'::after';}).join(',')+'{content:""!important;display:inline-block!important;width:9px!important;height:5px!important;margin-left:5px!important;vertical-align:middle!important;background:currentColor!important;-webkit-mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;transform:rotate(-90deg) scale(0.6666667)!important;}';
  style.textContent+=selector+'{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;}';
  document.head.appendChild(style);
  function sync(){document.querySelectorAll(selector).forEach(function(button){
    var text = (button.textContent || '').replace(/\s/g, '').replace(/[→➜➝➞>›]+$/, '');
    if (/^对比第?1[、,，]2[、,，]3款$/.test(text)) {
      button.textContent = '帮我解读第3款商品';
      button.setAttribute('data-quick-ask', '帮我解读第3款商品');
      if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', '帮我解读第3款商品');
    }
    var walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT),nodes=[],node;
    while(node=walker.nextNode())nodes.push(node);
    nodes.forEach(function(node){if(/\s*[→➜➝➞]\s*$/.test(node.nodeValue))node.nodeValue=node.nodeValue.replace(/\s*[→➜➝➞]\s*$/,'');});
  });}
  var pending=false;new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;sync();});}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  sync();
})();

;

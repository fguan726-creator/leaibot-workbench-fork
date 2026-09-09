// BEGIN SHOP CHAT TEMPLATE BEHAVIOR (inlined)
/* === Stable enterprise category tabs === */
(function () {
  var labels = ["推荐", "行业解决方案", "行业资料"];
  var tabs = document.querySelector(".shell > .content > .category-tabs");
  if (!tabs) {
    document.documentElement.classList.remove("lx-shop-tabs-prepaint");
    return;
  }

  var syncing = false;
  function syncTabs() {
    if (syncing) return;
    syncing = true;
    var buttons = Array.from(tabs.querySelectorAll(":scope > button"));
    labels.forEach(function (label, index) {
      var button = buttons[index];
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        tabs.appendChild(button);
      }
      if (button.textContent.trim() !== label) button.textContent = label;
      button.classList.toggle("active", index === 0);
    });
    Array.from(tabs.querySelectorAll(":scope > button")).slice(labels.length).forEach(function (button) {
      button.remove();
    });
    syncing = false;
  }

  syncTabs();
  if (window.MutationObserver) {
    new MutationObserver(syncTabs).observe(tabs, { childList: true, subtree: true, characterData: true });
  }
  window.requestAnimationFrame(function () {
    syncTabs();
    window.requestAnimationFrame(function () {
      document.documentElement.classList.remove("lx-shop-tabs-prepaint");
    });
  });
})();

/* === Personal recommendation floors === */
(function () {
  var sourceGrid = document.querySelector(".content > .product-grid[data-category-grid]");
  var existingFloors = document.querySelector(".content > .lx-site-floors.lx-personal-rec-floors");
  var recommendationHost = sourceGrid || existingFloors;
  if (!recommendationHost || recommendationHost.dataset.floorConverted) return;
  recommendationHost.dataset.floorConverted = "1";

  var catalog = [
    ["ThinkPad", "T14 2025 锐龙 AI 7 PRO AI 工程师本", "AMD 锐龙 AI 7 PRO 350｜32G｜512G", "¥ 11,799", "../img/shop-1.jpg"],
    ["ThinkPad", "P16v 2025 英特尔酷睿 Ultra 7 设计本", "酷睿 Ultra 7｜32G｜1TB｜专业显卡", "¥ 19,799", "../img/shop-2.jpg"],
    ["ThinkPad", "P16s 2025 酷睿 Ultra 7 AI 元启版", "酷睿 Ultra 7｜32G｜1TB｜16英寸", "¥ 16,299", "../img/shop-3.jpg"],
    ["ThinkPad", "P16 2026 酷睿 Ultra 7 移动工作站", "酷睿 Ultra 7｜RTX 专业显卡｜1TB", "¥ 34,799", "../img/shop-4.jpg"],
    ["拯救者", "创世 18英寸个人 AI 移动工作站", "酷睿 Ultra 9｜RTX 5090｜锻造碳", "¥ 79,999", "../img/shop-7.jpg"],
    ["拯救者", "Y9000P《黑神话：悟空》联名定制版", "i9-14900HX｜RTX 4060｜2.5K屏", "¥ 11,820", "../img/shop-8.jpg"],
    ["ThinkPad", "P1 2026 酷睿版移动工作本", "CTO 可选配置｜专业创作工作站", "¥ 28,500", "../img/shop-9.jpg"],
    ["ThinkPad", "T1g 酷睿 Ultra 7 移动工作站", "酷睿 Ultra 7｜RTX 5060｜4K屏", "¥ 30,299", "../img/shop-10.jpg"],
    ["ThinkBook", "Plus Hybrid 酷睿 Ultra 7 二合一电脑", "平板笔记本二合一｜高效协同", "¥ 17,999", "../img/shop-11.jpg"],
    ["ThinkPad", "X1 Carbon AI 2024 英特尔酷睿版", "酷睿 Ultra 7｜轻薄商务｜长续航", "¥ 13,999", "../img/shop-12.jpg"],
    ["Lenovo", "PGX 便携式 AI 开发者工作站主机", "GB10 Blackwell｜128G｜4TB", "¥ 43,999", "../img/shop-6.jpg"],
    ["拯救者", "刃7000K 超能版 5060 游戏台机", "酷睿 i7｜RTX 5060｜1TB SSD", "¥ 10,999", "../img/shop-13.jpg"],
    ["拯救者", "刃9000K 酷睿 U9 RTX 5080 台机", "酷睿 U9｜RTX 5080｜32G", "¥ 31,499", "../img/shop-14.jpg"],
    ["拯救者", "刃7000K CORE 7 高性能游戏台机", "CORE 7｜RTX 5060｜乾坤散热", "¥ 11,999", "../img/shop-5.jpg"],
    ["GeekPro", "酷睿 i7 RTX 5060 高性能台机", "酷睿 i7｜RTX 5060｜32G｜1TB", "¥ 13,999", "../img/shop-6.jpg"],
    ["拯救者", "刃7000K 酷睿 i7 5060Ti 游戏台机", "酷睿 i7｜RTX 5060Ti｜32G", "¥ 13,299", "../img/shop-13.jpg"],
    ["GeekPro", "酷睿 U9 RTX 5060 Ti 高性能台机", "Ultra 9｜RTX 5060 Ti｜1TB", "¥ 12,999", "../img/shop-14.jpg"],
    ["GeekPro", "酷睿 i7 RTX 5060Ti 高性能台机", "酷睿 i7｜RTX 5060Ti｜24G", "¥ 12,999", "../img/shop-5.jpg"],
    ["Lenovo", "ThinkCentre 商用高效办公台式机", "酷睿 i7｜双硬盘｜多接口扩展", "¥ 8,699", "../img/shop-6.jpg"],
    ["拯救者", "刃7000P 锐龙 9 专业游戏台机", "锐龙 9｜RTX 5060Ti｜1TB", "¥ 14,999", "../img/shop-13.jpg"]
  ];

  var originalCards = Array.from(recommendationHost.querySelectorAll(".product-card, .lx-floor-product"));
  while (originalCards.length < catalog.length) {
    originalCards.push(originalCards[originalCards.length % Math.max(1, originalCards.length)].cloneNode(true));
  }

  function hydrate(card, product) {
    card.classList.remove("product-card");
    card.classList.add("lx-floor-product-card");
    if (!card.querySelector(".brand-mini") ||
        !card.querySelector(".product-visual img") ||
        !card.querySelector(".product-title") ||
        !card.querySelector(".spec") ||
        !card.querySelector(".price")) {
      card.innerHTML = '<div class="brand-mini"></div>' +
        '<div class="product-visual"><img loading="lazy" src="" alt=""></div>' +
        '<h3 class="product-title"></h3>' +
        '<p class="spec"></p>' +
        '<div class="product-promos" aria-label="促销标签"></div>' +
        '<p class="price"></p>';
    }
    card.querySelector(".brand-mini").textContent = product[0];
    card.querySelector(".product-title").textContent = product[1];
    card.querySelector(".spec").textContent = product[2];
    var image = card.querySelector(".product-visual img");
    image.src = product[4];
    image.alt = product[1];
    card.querySelector(".price").innerHTML = product[3] + '<span class="price-from">起</span>';
    var promos = card.querySelector(".product-promos");
    if (!promos) {
      promos = document.createElement("div");
      promos.className = "product-promos";
      promos.setAttribute("aria-label", "促销标签");
      card.querySelector(".price").before(promos);
    }
    promos.innerHTML = '<span class="product-promo">教育特惠</span><span class="product-promo">官方优惠</span>';
    card.dataset.floorProduct = product[1];
    card.dataset.detailBrand = product[0];
    card.dataset.detailTitle = product[1];
    card.dataset.detailSummary = product[2];
    card.dataset.detailPrice = product[3];
    card.dataset.detailImage = product[4];
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "查看" + product[1] + "商品详情");
  }

  var floors = document.createElement("div");
  floors.className = "lx-site-floors lx-personal-rec-floors";
  floors.dataset.siteFloors = "";

  [["笔记本", 0, 10], ["台式机/显示器", 10, 20]].forEach(function (floorInfo) {
    var floor = document.createElement("section");
    floor.className = "lx-floor lx-personal-rec-floor lx-cat-floor";
    floor.dataset.floorCat = floorInfo[0];
    floor.innerHTML = '<div class="lx-floor-head"><h3>' + floorInfo[0] + '</h3><button class="lx-cat-shuffle-btn" type="button" title="换一批商品"><img class="lx-cat-shuffle-icon" src="../icons/global-refresh.svg?v=0.13.27-stage" alt="" aria-hidden="true">换一换</button></div><div class="lx-floor-products"></div>';
    var products = floor.querySelector(".lx-floor-products");
    originalCards.slice(floorInfo[1], floorInfo[2]).forEach(function (card, offset) {
      hydrate(card, catalog[floorInfo[1] + offset]);
      products.appendChild(card);
    });
    floor.querySelector(".lx-cat-shuffle-btn").addEventListener("click", function () {
      var refreshIcon = floor.querySelector(".lx-cat-shuffle-icon");
      if (refreshIcon) {
        refreshIcon.classList.remove("is-spinning");
        void refreshIcon.offsetWidth;
        refreshIcon.classList.add("is-spinning");
        refreshIcon.addEventListener("animationend", function () {
          refreshIcon.classList.remove("is-spinning");
        }, { once: true });
      }
      var rotated = catalog.slice(floorInfo[1] + 5, floorInfo[2]).concat(catalog.slice(floorInfo[1], floorInfo[1] + 5));
      catalog.splice.apply(catalog, [floorInfo[1], floorInfo[2] - floorInfo[1]].concat(rotated));
      Array.from(products.children).forEach(function (card, offset) {
        hydrate(card, catalog[floorInfo[1] + offset]);
      });
    });
    floors.appendChild(floor);
  });

  recommendationHost.replaceWith(floors);

  /* 上游商品接口会在首屏加载后刷新旧卡片；楼层模板在其后重新同步展示数据。 */
  function syncFloorCatalog() {
    if (window.__lxProductCatalogActive) return;
    Array.from(floors.querySelectorAll("[data-floor-product]")).forEach(function (card, index) {
      if (catalog[index]) hydrate(card, catalog[index]);
    });
  }
  window.__lxSyncShopFloorCatalog = syncFloorCatalog;
  [0, 120, 600, 1600, 3600].forEach(function (delay) {
    window.setTimeout(syncFloorCatalog, delay);
  });
  if (window.MutationObserver) {
    var syncing = false;
    var floorObserver = new MutationObserver(function () {
      if (syncing) return;
      syncing = true;
      floorObserver.disconnect();
      syncFloorCatalog();
      floorObserver.observe(floors, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "class"] });
      syncing = false;
    });
    floorObserver.observe(floors, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "class"] });
  }
})();

/* === Product detail controller === */
(function () {
  if (window.__lxBridge) return;
  var content = document.querySelector(".shell > .content");
  var detail = content && content.querySelector(".product-detail");
  if (!content || !detail || detail.dataset.shopDetailReady) return;
  detail.dataset.shopDetailReady = "1";
  var detailTabs = [];
  var activeDetailTab = "";
  var detailCards = new Map();
  var detailConversationCards = new Map();
  var detailConversationRun = 0;

  var reviews = [
    ["轻薄但接口很完整", "出差携带负担很小，键盘手感和屏幕观感都很稳，办公续航也符合预期。", ["轻薄便携", "商务办公"], "陈先生", 36],
    ["屏幕与性能兼顾", "屏幕显示细腻，日常多任务和轻度 AI 工作流都很流畅，风扇控制比较克制。", ["屏幕清晰", "性能稳定"], "林女士", 28],
    ["官方服务更放心", "到货包装完整，迁移资料和售后咨询响应都很快，适合作为长期主力机。", ["官方服务", "做工精致"], "周先生", 19],
    ["移动办公体验优秀", "机身坚固，会议、文档和远程协作切换顺畅，登录和连接外设都很方便。", ["可靠耐用", "移动办公"], "王女士", 22]
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function text(selector, value) {
    var node = detail.querySelector(selector);
    if (node) node.textContent = value;
  }

  function priceNumber(value) {
    return Number(String(value || "").replace(/[^0-9]/g, "")) || 0;
  }

  function ensureTabbar() {
    var bar = content.querySelector(":scope > .lx-tabbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "lx-tabbar";
      bar.setAttribute("role", "tablist");
      bar.setAttribute("aria-label", "已打开页面");
      content.prepend(bar);
    }
    bar.dataset.shopDetailTabs = "";
    return bar;
  }

  function moveTabInk() {
    var bar = ensureTabbar();
    var active = bar.querySelector(".lx-tab.is-active");
    var label = active && active.querySelector(".lx-tab-label");
    var ink = bar.querySelector(".lx-tab-ink");
    if (!active || !label || !ink) return;
    var width = Math.max(20, Math.min(32, label.offsetWidth));
    ink.style.left = active.offsetLeft + label.offsetLeft + (label.offsetWidth - width) / 2 + "px";
    ink.style.width = width + "px";
  }

  function renderDetailTabs() {
    var bar = ensureTabbar();
    // 单页无需呈现页面标签；从第二个页面开始才显示标签栏。
    bar.hidden = detailTabs.length <= 1;
    bar.innerHTML = detailTabs.map(function (tab) {
      var active = tab.id === activeDetailTab;
      var close = /^site:(?:personal|business|enterprise)$/.test(tab.id) ? "" : '<button class="lx-tab-close" type="button" data-shop-tab-close="' + escapeHtml(tab.id) + '" aria-label="关闭' + escapeHtml(tab.label) + '标签">×</button>';
      return '<span class="lx-tab' + (active ? " is-active" : "") + '" data-shop-tab-id="' + escapeHtml(tab.id) + '" role="tab" tabindex="' + (active ? "0" : "-1") + '" aria-selected="' + (active ? "true" : "false") + '"><span class="lx-tab-label">' + escapeHtml(tab.label) + '</span>' + close + '</span>';
    }).join("") + '<span class="lx-tab-ink" aria-hidden="true"></span>';
    syncDetailConversationSelection();
    requestAnimationFrame(moveTabInk);
  }

  function tabIdFor(product) {
    if (product.sku) return "shop-detail:sku:" + product.sku;
    var key = product.title + "|" + product.price;
    var hash = 0;
    for (var index = 0; index < key.length; index += 1) hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
    return "shop-detail:" + Math.abs(hash);
  }

  function upsertDetailTab(product, card) {
    if (!detailTabs.some(function (tab) { return tab.id === "site:enterprise"; })) {
      detailTabs.push({ id: "site:enterprise", label: "政教及大企业" });
    }
    var id = tabIdFor(product);
    var existing = detailTabs.find(function (tab) { return tab.id === id; });
    if (existing) existing.label = product.title;
    else detailTabs.push({ id: id, label: product.title });
    if (detailTabs.length > 8) {
      var removable = detailTabs.findIndex(function (tab) { return tab.id !== "site:enterprise" && tab.id !== activeDetailTab; });
      if (removable >= 0) detailTabs.splice(removable, 1);
    }
    detailCards.set(id, card);
    activeDetailTab = id;
    renderDetailTabs();
  }

  function detailProduct(card) {
    return {
      sku: card.dataset.detailSku || "",
      brand: card.dataset.detailBrand || "Lenovo",
      title: card.dataset.detailTitle || card.querySelector(".product-title")?.textContent.trim() || "联想商品",
      summary: card.dataset.detailSummary || card.querySelector(".spec")?.textContent.trim() || "联想官方商品",
      price: card.dataset.detailPrice || card.querySelector(".price")?.textContent.trim() || "¥9,799",
      image: card.dataset.detailImage || card.querySelector(".product-visual img")?.getAttribute("src") || "../img/shop-1.jpg"
    };
  }

  function openDetailInSharedTab(card) {
    var product = detailProduct(card);
    activeDetailTab = tabIdFor(product);
    detailCards.set(activeDetailTab, card);
    if (typeof window.__lxOpenProductTab !== "function") {
      openDetail(card);
      return;
    }
    var sku = product.sku || tabIdFor(product).replace("shop-detail:", "template-");
    var amount = priceNumber(product.price);
    Promise.resolve(window.__lxOpenProductTab({
      sku: sku,
      name: product.title,
      description: product.summary,
      price: amount,
      image_url: product.image,
      category: "笔记本电脑",
      specs: { brand: product.brand }
    })).then(function () {
      openDetail(card, { skipTabUpdate: true });
      syncDetailConversationSelection();
    });
  }

  function syncDetailConversationSelection() {
    var activeTab = content.querySelector(":scope > .lx-tabbar .lx-tab.is-active");
    var activeTabId = activeTab?.dataset.shopTabId || "";
    var activeTabLabel = activeTab?.querySelector(".lx-tab-label")?.textContent.trim() || "";
    document.querySelectorAll("[data-shop-chat-product]").forEach(function (button) {
      var sourceCard = detailConversationCards.get(button.dataset.shopChatProduct);
      var product = sourceCard && detailProduct(sourceCard);
      // 右侧实际激活的标签是选中态的唯一事实来源。标签被关闭后，即使
      // 内存中的 activeDetailTab 尚未被其他运行时同步，也必须立即清除高亮。
      var selected = Boolean(product && activeTab && (
        tabIdFor(product) === activeTabId ||
        activeTabLabel === product.title
      ));
      button.classList.toggle("is-active", selected);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  if (window.MutationObserver) {
    var selectionSyncFrame = 0;
    new MutationObserver(function (records) {
      if (!records.some(function (record) {
        return record.target.closest && record.target.closest(".lx-tabbar");
      })) return;
      window.cancelAnimationFrame(selectionSyncFrame);
      selectionSyncFrame = window.requestAnimationFrame(syncDetailConversationSelection);
    }).observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-selected"] });
  }

  function ensureDetailConversation() {
    document.body.dataset.state = "chat";
    var chatState = document.querySelector(".assistant-panel .chat-state");
    if (!chatState) return null;
    var list = chatState.querySelector(".lx-p0-messages");
    if (!list) {
      chatState.innerHTML = '<div class="lx-p0-messages" aria-live="polite"></div>';
      list = chatState.querySelector(".lx-p0-messages");
    }
    return list;
  }

  function scrollDetailConversation(list) {
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }

  function typeDetailConversationText(target, value, run, done) {
    var textValue = String(value || "");
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;
    var cursor = target && target.nextElementSibling && target.nextElementSibling.classList.contains("typing-cursor")
      ? target.nextElementSibling
      : null;
    target.textContent = "";

    function finish() {
      target.textContent = textValue;
      target.classList.remove("streaming");
      if (cursor) cursor.hidden = true;
      scrollDetailConversation(target.closest(".lx-p0-messages"));
      if (typeof done === "function") done();
    }

    if (reducedMotion) {
      finish();
      return;
    }

    if (cursor) cursor.hidden = false;

    if (typeof window.__lxCreateTypewriter === "function") {
      var writer = window.__lxCreateTypewriter(target, {
        charsPerTick: 1,
        interval: 24,
        scroll: function () { scrollDetailConversation(target.closest(".lx-p0-messages")); }
      });
      writer.append(textValue);
      writer.drain().then(function () {
        if (run === detailConversationRun && target.isConnected) finish();
      });
      return;
    }

    function tick() {
      if (run !== detailConversationRun || !target.isConnected) return;
      index += 1;
      target.textContent = textValue.slice(0, index);
      target.classList.add("streaming");
      scrollDetailConversation(target.closest(".lx-p0-messages"));
      if (index < textValue.length) window.setTimeout(tick, 24);
      else finish();
    }

    tick();
  }

  function openDetailThroughConversation(card) {
    var product = detailProduct(card);
    var list = ensureDetailConversation();
    if (!list) {
      openDetail(card);
      return;
    }
    var run = ++detailConversationRun;
    var conversationCardId = "detail-chat-product:" + run;
    detailConversationCards.set(conversationCardId, card);
    var query = product.title + "商品的详情页";
    if (typeof window.__lxSetConversationQuery === "function") window.__lxSetConversationQuery(query);

    var user = document.createElement("div");
    user.className = "lx-p0-message msg user";
    user.innerHTML = '<div class="user-bubble">' + escapeHtml(query) + '</div>';
    list.appendChild(user);

    var ai = document.createElement("div");
    ai.className = "lx-p0-message msg ai lx-chat-skin loading";
    ai.innerHTML = '<div class="ai-body"><div class="loading-line"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div></div>';
    list.appendChild(ai);
    scrollDetailConversation(list);

    window.setTimeout(function () {
      if (run !== detailConversationRun || !ai.isConnected) return;
      var copy = "已为你整理" + product.title + "的核心信息。该款产品兼顾性能、日常使用体验与官方服务，适合结合预算、用途和具体配置进一步查看与比较。";
      ai.classList.remove("loading");
      ai.innerHTML = '<div class="ai-body"><p class="lx-detail-chat-copy lx-msg-text"><span data-detail-chat-typed></span><span class="typing-cursor" aria-hidden="true" hidden></span></p><div class="lx-detail-chat-result" hidden><button class="answer-cta lx-answer-reco" type="button" data-shop-chat-product="' + escapeHtml(conversationCardId) + '" data-history-detail-brand="' + escapeHtml(product.brand) + '" data-history-detail-title="' + escapeHtml(product.title) + '" data-history-detail-summary="' + escapeHtml(product.summary) + '" data-history-detail-price="' + escapeHtml(product.price) + '" data-history-detail-image="' + escapeHtml(product.image) + '" aria-label="查看' + escapeHtml(product.title) + '详情" aria-pressed="false"><span class="answer-cta-copy"><span class="answer-cta-title">' + escapeHtml(product.title) + '</span><span class="answer-cta-desc">已经为您打开1款商品详情</span></span><span class="answer-cta-icon" aria-hidden="true"><img src="../icons/global-next.svg" alt=""></span></button></div></div>';
      var copyNode = ai.querySelector("[data-detail-chat-typed]");
      var resultNode = ai.querySelector(".lx-detail-chat-result");
      typeDetailConversationText(copyNode, copy, run, function () {
        if (run !== detailConversationRun || !ai.isConnected) return;
        resultNode.hidden = false;
        syncDetailConversationSelection();
        scrollDetailConversation(list);
        window.setTimeout(function () {
          if (run === detailConversationRun) openDetailInSharedTab(card);
        }, 180);
      });
    }, 420);
  }

  function renderReviews() {
    var grid = detail.querySelector("[data-detail-review-grid]");
    if (!grid) return;
    grid.innerHTML = reviews.map(function (item) {
      return '<article class="detail-review-card"><strong class="detail-review-card-title">' + escapeHtml(item[0]) + '</strong><p class="detail-review-card-content">' + escapeHtml(item[1]) + '</p><div class="detail-review-card-tags">' + item[2].map(function (tag) { return "<span>" + escapeHtml(tag) + "</span>"; }).join("") + '</div><div class="detail-review-card-foot"><span>' + escapeHtml(item[3]) + ' · 已购用户</span><button class="detail-review-like" type="button" aria-label="点赞评价">♡ ' + item[4] + "</button></div></article>";
    }).join("");
  }

  function renderVariants(product) {
    var host = detail.querySelector("[data-detail-variants]");
    if (!host) return;
    host.hidden = false;
    host.innerHTML = '<div class="lx-product-data-state" role="status">正在获取真实配置…</div>';
  }

  function setPrice(value) {
    var node = detail.querySelector("[data-detail-price]");
    if (node) node.innerHTML = '<span class="detail-price-main">' + escapeHtml(value) + '</span>';
    detail.querySelectorAll(".lx-buybar-info b").forEach(function (item) { item.textContent = value; });
  }

  function openDetail(card, options) {
    var product = detailProduct(card);
    if (!options || !options.skipTabUpdate) upsertDetailTab(product, card);
    content.dataset.view = "detail";
    text("[data-detail-title]", product.title);
    text("[data-detail-summary]", product.summary + "，适合结合预算、用途和服务需求继续比较。");

    var visual = detail.querySelector(".detail-visual");
    if (visual) visual.innerHTML = '<img class="detail-product-image" src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.title) + '" data-detail-visual>';
    var reason = detail.querySelector("[data-detail-reason]");
    if (reason) {
      reason.hidden = false;
      reason.innerHTML = '<span class="lx-fit-icon">✦</span><span class="lx-fit-text"><strong>乐享推荐</strong> 该配置兼顾性能、使用体验与官方服务，适合进一步比较后购买。<span class="lx-fit-note">乐享生成 · 仅供参考</span></span>';
    }
    renderVariants(product);
    var tags = detail.querySelector(".detail-tags");
    if (tags) tags.innerHTML = '<span class="detail-tag">' + escapeHtml(product.brand) + '</span>';
    setPrice(product.price);
    var actions = detail.querySelector(".detail-actions");
    if (actions) actions.innerHTML = '<button class="detail-primary" type="button">一键领优惠下单</button><button class="detail-secondary lx-p0-detail-compare" type="button">加入对比</button><button class="detail-secondary" type="button">加入购物车</button>';
    var services = detail.querySelector(".detail-service");
    if (services) services.innerHTML = '<div class="service-item"><strong>联想官方正品</strong><span>官方渠道与原厂保障</span></div><div class="service-item"><strong>180 天只换不修</strong><span>符合规则可享换新服务</span></div><div class="service-item"><strong>14 天无理由退换</strong><span>购买前请核对适用规则</span></div>';
    detail.querySelector(".detail-itemcode")?.remove();
    services?.insertAdjacentHTML("afterend", '<div class="detail-itemcode">商品编号：<span>' + escapeHtml(product.sku || "数据同步中") + "</span></div>");
    text("[data-review-sum]", "用户普遍认可这款产品的性能表现、使用体验与官方服务，适合结合实际用途和预算继续比较；购买前请核对具体配置与权益。");
    renderReviews();
    var imagePanel = detail.querySelector("[data-detail-images-panel]");
    if (imagePanel) imagePanel.innerHTML = '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.title) + ' 商品展示"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.title) + ' 细节展示">';
    detail.querySelector(".lx-buybar")?.remove();
    detail.insertAdjacentHTML("beforeend", '<div class="lx-buybar"><img src="' + escapeHtml(product.image) + '" alt=""><div class="lx-buybar-info"><strong>' + escapeHtml(product.title) + '</strong><b>' + escapeHtml(product.price) + '</b></div><button class="detail-primary" type="button">一键领优惠下单</button><button class="detail-secondary" type="button">加入购物车</button></div>');
    content.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(moveTabInk);
  }

  function activateDetailTab(id) {
    if (id === "site:enterprise") {
      activeDetailTab = id;
      content.dataset.view = "list";
      detail.querySelector(".lx-buybar")?.remove();
      if (typeof window.__lxSyncShopFloorCatalog === "function") window.__lxSyncShopFloorCatalog();
      renderDetailTabs();
      document.querySelector(".category-tabs")?.removeAttribute("hidden");
      content.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    var card = detailCards.get(id);
    if (!card) return;
    activeDetailTab = id;
    renderDetailTabs();
    openDetail(card, { skipTabUpdate: true });
  }

  function closeDetailTab(id) {
    var index = detailTabs.findIndex(function (tab) { return tab.id === id; });
    if (index < 0) return;
    var wasActive = activeDetailTab === id;
    detailTabs.splice(index, 1);
    detailCards.delete(id);
    if (!detailTabs.length) {
      activeDetailTab = "";
      content.dataset.view = "list";
      detail.querySelector(".lx-buybar")?.remove();
      renderDetailTabs();
      return;
    }
    if (wasActive) {
      var next = detailTabs[Math.min(index, detailTabs.length - 1)];
      activateDetailTab(next.id);
    } else {
      renderDetailTabs();
    }
  }

  document.addEventListener("click", function (event) {
    var conversationCard = event.target.closest("[data-shop-chat-product]");
    if (conversationCard) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var sourceCard = detailConversationCards.get(conversationCard.dataset.shopChatProduct);
      if (!sourceCard && conversationCard.dataset.historyDetailTitle) {
        sourceCard = document.createElement("article");
        sourceCard.dataset.detailBrand = conversationCard.dataset.historyDetailBrand || "Lenovo";
        sourceCard.dataset.detailTitle = conversationCard.dataset.historyDetailTitle;
        sourceCard.dataset.detailSummary = conversationCard.dataset.historyDetailSummary || "联想官方商品";
        sourceCard.dataset.detailPrice = conversationCard.dataset.historyDetailPrice || "";
        sourceCard.dataset.detailImage = conversationCard.dataset.historyDetailImage || "../img/shop-1.jpg";
        detailConversationCards.set(conversationCard.dataset.shopChatProduct, sourceCard);
      }
      if (sourceCard) openDetailInSharedTab(sourceCard);
      return;
    }
    var close = event.target.closest("[data-shop-tab-close]");
    if (close) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDetailTab(close.dataset.shopTabClose);
      return;
    }
    var tab = event.target.closest("[data-shop-tab-id]");
    if (tab) {
      event.preventDefault();
      event.stopImmediatePropagation();
      activateDetailTab(tab.dataset.shopTabId);
      return;
    }
    var card = event.target.closest(".lx-floor-product-card");
    if (card && content.contains(card)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDetailThroughConversation(card);
      return;
    }
    if (event.target.closest(".detail-back")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      activateDetailTab("site:enterprise");
      return;
    }
    var chip = event.target.closest(".lx-spu-chip[data-detail-price-value]");
    if (chip && detail.contains(chip)) {
      chip.parentElement.querySelectorAll(".lx-spu-chip").forEach(function (item) { item.classList.toggle("is-active", item === chip); });
      setPrice(chip.dataset.detailPriceValue);
    }
  }, true);

  document.addEventListener("keydown", function (event) {
    var conversationCard = event.target.closest("[data-shop-chat-product]");
    if (conversationCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      var sourceCard = detailConversationCards.get(conversationCard.dataset.shopChatProduct);
      if (!sourceCard && conversationCard.dataset.historyDetailTitle) {
        sourceCard = document.createElement("article");
        sourceCard.dataset.detailBrand = conversationCard.dataset.historyDetailBrand || "Lenovo";
        sourceCard.dataset.detailTitle = conversationCard.dataset.historyDetailTitle;
        sourceCard.dataset.detailSummary = conversationCard.dataset.historyDetailSummary || "联想官方商品";
        sourceCard.dataset.detailPrice = conversationCard.dataset.historyDetailPrice || "";
        sourceCard.dataset.detailImage = conversationCard.dataset.historyDetailImage || "../img/shop-1.jpg";
        detailConversationCards.set(conversationCard.dataset.shopChatProduct, sourceCard);
      }
      if (sourceCard) openDetail(sourceCard);
      return;
    }
    var tab = event.target.closest("[data-shop-tab-id]");
    if (tab && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      activateDetailTab(tab.dataset.shopTabId);
      return;
    }
    var card = event.target.closest(".lx-floor-product-card");
    if (!card || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openDetailThroughConversation(card);
  });
  window.addEventListener("resize", function () { requestAnimationFrame(moveTabInk); }, { passive: true });
})();

/* === Direct-open split layout === */
(function () {
        function enterShopSplit() {
          var hasConversation = !!document.querySelector(".chat-state .lx-p0-messages > *");
          document.documentElement.classList.remove("lx-root-lxfd-prepaint", "lx-route-prepaint");
          document.querySelector(".lx-route-loading")?.remove();
          document.body.classList.remove(
            "assistant-fullscreen",
            "assistant-collapsed",
            "assistant-right",
            "lx-auto-fs",
            "lx-root-home",
            "lxfd-chatting",
            "lxfd-entering",
            "lxfd-exiting",
            "lxfd-split-returning"
          );
          document.body.classList.add("lx-home-split");
          document.body.dataset.page = "enterprise";
          document.body.dataset.state = hasConversation ? "chat" : "default";

          document.querySelectorAll(".main-nav [data-page]").forEach(function (button) {
            button.classList.toggle("active", button.dataset.page === "enterprise");
          });

          var enterprise = document.querySelector('.main-nav [data-page="enterprise"]');
          if (enterprise && !enterprise.dataset.shopTemplateBooted) {
            enterprise.dataset.shopTemplateBooted = "1";
            enterprise.click();
          }

          // 仅首次无消息时使用欢迎态；点击快捷入口后已有消息，延迟初始化不得再清回默认态。
          document.body.dataset.state = hasConversation ? "chat" : "default";
        }

        enterShopSplit();
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", enterShopSplit, { once: true });
        }
        window.addEventListener("pageshow", enterShopSplit);
        window.setTimeout(enterShopSplit, 80);
        window.setTimeout(enterShopSplit, 320);
      })();

/* === Split top navigation === */
(function () {
        var nav = document.querySelector(".main-nav");
        if (!nav || nav.dataset.shopTopNavReady) return;
        nav.dataset.shopTopNavReady = "1";
        nav.classList.add("lx-shop-nav");
        nav.setAttribute("tabindex", "0");
        nav.setAttribute("role", "button");
        nav.setAttribute("aria-expanded", "false");

        function ensureTopicChip() {
          var chip = nav.querySelector(".lx-current-topic-chip");
          var label = nav.getAttribute("data-current-label") || "政教及大企业：新对话";
          label = label.replace(/^(?:首页|个人及家庭|中小企业|政教及大企业|品牌)：/, "政教及大企业：");
          nav.setAttribute("data-shop-current-label", label);
          if (chip) chip.remove();
          return null;
        }

        nav.id = nav.id || "shopChannelNavigation";
        var chip = ensureTopicChip();
        var closeTimer = 0;
        function setExpanded(expanded) {
          window.clearTimeout(closeTimer);
          nav.classList.toggle("is-expanded", !!expanded);
          nav.setAttribute("aria-expanded", expanded ? "true" : "false");
        }
        function scheduleClose() {
          window.clearTimeout(closeTimer);
          closeTimer = window.setTimeout(function () {
            if (!nav.matches(":hover") && !nav.contains(document.activeElement)) setExpanded(false);
          }, 160);
        }

        nav.addEventListener("pointerenter", function () { setExpanded(true); });
        nav.addEventListener("pointerleave", scheduleClose);
        nav.addEventListener("focusin", function () { setExpanded(true); });
        nav.addEventListener("focusout", scheduleClose);
        nav.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            event.preventDefault();
            setExpanded(false);
            nav.focus();
          }
        });

        var shopContent = document.querySelector(".shell > .content");
        if (shopContent) shopContent.classList.add("lx-shop-content");
        function restoreShopTopGap() {
          if (!shopContent || shopContent.scrollTop > 2) return;
          var tabs = shopContent.querySelector(":scope > .category-tabs");
          if (tabs) tabs.classList.remove("is-stuck");
        }
        function resetShopCategoryTop() {
          if (!shopContent) return;
          shopContent.scrollTop = 0;
          var tabs = shopContent.querySelector(":scope > .category-tabs");
          if (tabs) tabs.classList.remove("is-stuck");
        }
        if (shopContent) {
          shopContent.addEventListener("scroll", restoreShopTopGap, { passive: true });
          document.addEventListener("click", function (event) {
            if (!event.target.closest(".category-tabs button:not([data-cat-more])")) return;
            /* 分类内容会在原点击处理器中重绘；重绘后再次归零，避免滚动锚定造成顶部间距漂移。 */
            window.requestAnimationFrame(function () {
              resetShopCategoryTop();
              window.requestAnimationFrame(resetShopCategoryTop);
            });
            window.setTimeout(resetShopCategoryTop, 80);
          }, true);
          window.addEventListener("pageshow", restoreShopTopGap);
          window.requestAnimationFrame(restoreShopTopGap);
        }

        if (window.MutationObserver) {
          new MutationObserver(function () {
            var label = nav.getAttribute("data-current-label") || "政教及大企业：新对话";
            label = label.replace(/^(?:首页|个人及家庭|中小企业|政教及大企业|品牌)：/, "政教及大企业：");
            nav.setAttribute("data-shop-current-label", label);
            ensureTopicChip();
          }).observe(nav, { attributes: true, attributeFilter: ["data-current-label"], childList: true });
        }
      })();

/* === Local-file title sync === */
/* 2026-08-05 修复：本地文件打开时，灵动岛标题同步逻辑
         同时支持全屏灵动岛（.lxfd-nav-cluster）和分屏顶部导航（.main-nav）
         与 localhost:3002 效果保持 1:1 一致 */
      (function () {
        if (location.protocol !== "file:") return;
        document.body.classList.add("lx-template-file");
        var cluster = document.getElementById("lxfdNavCluster");
        var pill = document.getElementById("lxfdConvoPill");
        var name = document.getElementById("lxfdConvoName");
        var thread = document.getElementById("lxfdThread");
        var mainNav = document.querySelector(".main-nav");
        var lastQuery = "";

        function shortTitle(text) {
          var clean = String(text || "").replace(/\s+/g, "").replace(/[，。！？、,.!?;；:：]/g, "");
          if (!clean) return "新对话";
          if (Array.from(clean).length <= 6) return clean;
          var rules = [
            [/文档|文件|资料|PDF|白皮书|手册|文章|解读|摘要|提炼/i, "文档核心解读"],
            [/教育|学生|教师|认证/, "教育认证优惠"],
            [/国补|国家补贴|补贴/, "国家补贴商品"],
            [/以旧换新|旧机|回收|估算/, "旧机换新服务"],
            [/门店|附近|到店/, "附近门店查询"],
            [/客服|售后|维修|保修/, "售后维修服务"],
            [/订单|物流|发货/, "订单物流查询"],
            [/会员|积分|权益/, "会员积分权益"],
            [/对比|比较/, "商品对比分析"],
            [/笔记本|电脑|轻薄本|游戏本|工作站|YOGA|ThinkPad|拯救者|小新/i, "电脑选购推荐"]
          ];
          for (var i = 0; i < rules.length; i += 1) {
            if (rules[i][0].test(clean)) return rules[i][1];
          }
          return "问题内容咨询";
        }

        function syncSplitNavLabel(label) {
          if (!mainNav || !label) return;
          mainNav.setAttribute("data-current-label", label);
          mainNav.style.setProperty("--lx-personal-nav-label-half", Math.ceil(label.length * 7.5 + 14) + "px");

          var topicChip = mainNav.querySelector(".lx-current-topic-chip");
          if (topicChip) topicChip.remove();
        }

        function syncCompactTitle() {
          var firstUser = thread && thread.querySelector(".lxfd-msg-user");
          var query = firstUser ? firstUser.textContent : lastQuery;
          if (query && name) {
            var label = "政教及大企业：" + shortTitle(query);
            // 同步全屏灵动岛
            name.textContent = label;
            name.title = label;
            cluster && cluster.style.setProperty("--lxfd-nav-label-half", Math.ceil(label.length * 7.5 + 14) + "px");
            // 同步分屏顶部导航（main-nav）
            syncSplitNavLabel(label);
          }
          // 全屏灵动岛：收起状态
          cluster && cluster.classList.remove("open");
          pill && pill.setAttribute("aria-expanded", "false");
          if (pill && document.activeElement === pill) pill.blur();
        }

        document.addEventListener("submit", function (event) {
          if (!event.target || event.target.id !== "lxfdComposer") return;
          var input = document.getElementById("lxfdTa");
          lastQuery = input ? input.value.trim() : "";
          window.setTimeout(syncCompactTitle, 0);
          window.setTimeout(syncCompactTitle, 80);
        }, true);

        if (thread && window.MutationObserver) {
          new MutationObserver(function () {
            if (thread.querySelector(".lxfd-msg-user")) syncCompactTitle();
          }).observe(thread, { childList: true, subtree: true });
        }

        if (window.MutationObserver) {
          new MutationObserver(function () {
            if (!document.body.classList.contains("lx-home-split")) return;
            var label = mainNav && mainNav.getAttribute("data-current-label");
            if (label) syncSplitNavLabel(label);
          }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
        }
      })();

/* === Fullscreen force guard === */
(function(){
        try {
          if (!window.__LXFD_FORCE && !new URLSearchParams(location.search).has("lxfd")) return;
          var force = function(){
            if (!window.__LXFD_FORCE && !new URLSearchParams(location.search).has("lxfd")) return;
            // 分屏已成形/正在退全屏过渡时不得强制回全屏：资源慢时本脚本执行晚，
            // 四连定时器会落在用户已进分屏之后，把两种布局叠成花屏
            if (document.body.classList.contains("lx-home-split") || document.body.classList.contains("lxfd-exiting") || document.body.classList.contains("lxfd-split-returning")) return;
            document.body.classList.add("assistant-fullscreen", "lx-auto-fs");
            document.body.dataset.state = "chat";
            var stage = document.getElementById("lxfdStage");
            var rail = document.getElementById("lxfdRail");
            var wide = window.innerWidth >= 1280;
            if (stage) stage.classList.toggle("shift", wide);
            if (rail) rail.classList.toggle("open", wide);
          };
          force();
          [50, 300, 1000, 2000].forEach(function(delay){ window.setTimeout(force, delay); });
        } catch (err) {}
      })();

/* === Fullscreen navigation intro === */
/* 2026-08-05：首页灵动岛首次打开时展开 2 秒，随后自动收起 */
      (function () {
        var navCluster = document.getElementById("lxfdNavCluster");
        var convoPill = document.getElementById("lxfdConvoPill");
        if (!navCluster || !convoPill) return;

        // 仅在首页非聊天态时默认展开
        var isChatting = document.body.classList.contains("lxfd-chatting");
        if (isChatting) return;

        // 默认展开导航，让用户先看到完整的业务入口。
        navCluster.classList.add("open");
        convoPill.setAttribute("aria-expanded", "true");

        // 展示 2 秒后恢复为紧凑态；后续仍可通过点击、悬停或键盘焦点展开。
        window.setTimeout(function () {
          navCluster.classList.remove("open");
          convoPill.setAttribute("aria-expanded", "false");
          if (document.activeElement === convoPill) convoPill.blur();
        }, 2000);
      })();

/* === Hero carousel === */
(function () {
        var hero = document.querySelector(".shell > .content > .hero");
        if (!hero || hero.dataset.carouselReady) return;
        var slides = Array.from(hero.querySelectorAll(".hero-slide"));
        var previous = hero.querySelector(".hero-carousel-prev");
        var next = hero.querySelector(".hero-carousel-next");
        var dotsHost = hero.querySelector(".hero-carousel-dots");
        if (slides.length < 2 || !previous || !next || !dotsHost) return;
        hero.dataset.carouselReady = "1";

        var current = Math.max(0, slides.findIndex(function (slide) {
          return slide.classList.contains("is-active");
        }));
        var timer = 0;
        var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        var dots = slides.map(function (_, index) {
          var dot = document.createElement("button");
          dot.className = "hero-carousel-dot";
          dot.type = "button";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "切换到第 " + (index + 1) + " 张横幅");
          dot.addEventListener("click", function () {
            show(index, true);
          });
          dotsHost.appendChild(dot);
          return dot;
        });

        function show(index, restart) {
          current = (index + slides.length) % slides.length;
          slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === current);
          });
          dots.forEach(function (dot, dotIndex) {
            var active = dotIndex === current;
            dot.classList.toggle("is-active", active);
            dot.setAttribute("aria-selected", active ? "true" : "false");
            dot.tabIndex = active ? 0 : -1;
          });
          if (restart) startAutoplay();
        }

        function stopAutoplay() {
          window.clearInterval(timer);
          timer = 0;
        }

        function startAutoplay() {
          stopAutoplay();
          if (reducedMotion || document.hidden) return;
          timer = window.setInterval(function () { show(current + 1, false); }, 5500);
        }

        previous.addEventListener("click", function () { show(current - 1, true); });
        next.addEventListener("click", function () { show(current + 1, true); });
        hero.addEventListener("pointerenter", stopAutoplay);
        hero.addEventListener("pointerleave", startAutoplay);
        hero.addEventListener("focusin", stopAutoplay);
        hero.addEventListener("focusout", function (event) {
          if (!hero.contains(event.relatedTarget)) startAutoplay();
        });
        hero.addEventListener("keydown", function (event) {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            show(current - 1, true);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            show(current + 1, true);
          }
        });
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) stopAutoplay();
          else startAutoplay();
        });

        show(current, false);
        startAutoplay();
      })();
      // END SHOP CHAT TEMPLATE BEHAVIOR (inlined)

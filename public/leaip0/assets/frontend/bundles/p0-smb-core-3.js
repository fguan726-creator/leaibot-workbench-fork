
;/* public/leaip0/assets/frontend/js/core/model-knowledge-runtime.js */
(function (root, factory) {
  var runtime = factory();
  if (typeof module === "object" && module.exports) module.exports = runtime;
  if (root) root.LeAIModelKnowledgeRuntime = runtime;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PRODUCTS = [
    {
      official: true,
      sku: "skill-y9000p-2026",
      name: "拯救者 Y9000P 2026",
      full_name: "拯救者 Y9000P 2026",
      description: "适合 3A 游戏、视频剪辑、三维设计与高负载创作。",
      price: 15098,
      image_url: "../img/lxfd-gallery-1-1.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    },
    {
      official: true,
      sku: "skill-yoga-air-14c-2026",
      name: "YOGA Air 14c 2026",
      full_name: "YOGA Air 14c 2026",
      description: "适合移动办公、轻量创作、会议演示与日常学习。",
      price: 8999,
      image_url: "../img/lxfd-gallery-1-2.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    },
    {
      official: true,
      sku: "skill-xiaoxin-pad-pro-13",
      name: "小新 Pad Pro 13 英寸",
      full_name: "小新 Pad Pro 13 英寸",
      description: "适合影音娱乐、轻办公、移动阅读与跨设备协作。",
      price: 7299,
      image_url: "../img/lxfd-gallery-1-3.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    }
  ];

  function normalize(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function recommendProducts(query) {
    var text = normalize(query).toLowerCase();
    if (/游戏|电竞|剪辑|三维|渲染|y9000p|拯救者/.test(text)) return [PRODUCTS[0], PRODUCTS[1]];
    if (/办公|出差|便携|轻薄|会议|yoga/.test(text)) return [PRODUCTS[1], PRODUCTS[2]];
    if (/平板|阅读|影音|pad/.test(text)) return [PRODUCTS[2], PRODUCTS[1]];
    return PRODUCTS.slice();
  }

  function answerQuery(query) {
    var text = normalize(query);
    var products = recommendProducts(text);
    if (/推荐|选购|买|商品|笔记本|电脑|平板|办公|游戏|学习|设计|剪辑|便携|轻薄/i.test(text)) {
      return {
        text: "我已根据你的使用场景，从模板内置的联想乐享产品知识中整理了几款方向。重性能可优先看拯救者 Y9000P；经常移动办公可优先看 YOGA Air 14c；偏影音、阅读和轻办公可关注小新 Pad Pro。价格、库存和活动会变化，购买前请以联想官方商城实时信息为准。",
        products: products,
        status: "已调用 Skill(联想乐享模型与知识)"
      };
    }
    return {
      text: "这是联想乐享 PC 5.0 规范 Skill 内置的独立问答能力。我可以围绕联想产品选购、使用场景、服务入口和设计规范提供回答；若需要商品推荐，可以直接告诉我预算、用途和便携偏好。",
      products: [],
      status: "已调用 Skill(联想乐享模型与知识)"
    };
  }

  function followups(query) {
    var text = normalize(query);
    if (/游戏|拯救者|y9000p/i.test(text)) return ["对比一下配置", "看看当前优惠", "适合哪些游戏"];
    if (/办公|轻薄|yoga/i.test(text)) return ["续航表现怎么样", "对比一下重量", "看看当前优惠"];
    return ["按预算帮我筛选", "对比一下这几款", "看看当前优惠"];
  }

  function sseResponse(query) {
    var result = answerQuery(query);
    var events = [
      ["status", { text: "正在调用 Skill(联想乐享模型与知识)" }],
      ["status", { text: result.status }],
      ["chunk", { text: result.text }]
    ];
    if (result.products.length) events.push(["display", { title: "为你推荐", products: result.products }]);
    events.push(["suggestions", { questions: followups(query) }]);
    events.push(["done", { conv_id: "skill-local-knowledge" }]);
    var body = events.map(function (entry) {
      return "event: " + entry[0] + "\ndata:" + JSON.stringify(entry[1]) + "\n\n";
    }).join("");
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" }
    });
  }

  function jsonResponse(value, status) {
    return new Response(JSON.stringify(value), {
      status: status || 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  function parseBody(options) {
    if (!options || !options.body || typeof options.body !== "string") return {};
    try { return JSON.parse(options.body); } catch (error) { return {}; }
  }

  function localApiResponse(url, options) {
    var path = String(url || "");
    var body = parseBody(options);
    if (/\/api\/leai\/intent(?:\?|$)/.test(path)) return jsonResponse({ type: "chat" });
    if (/\/api\/leai\/followups(?:\?|$)/.test(path)) return jsonResponse({ rc: 0, questions: followups(body.q || body.message) });
    if (/\/api\/(?:leai\/stream|chat\/stream)(?:\?|$)/.test(path)) return sseResponse(body.message || body.input || "");
    if (/\/api\/chat\/upload-image(?:\?|$)/.test(path)) return jsonResponse({ error: "独立模板暂不支持图片上传" }, 501);
    if (/\/api\//.test(path)) return jsonResponse({ rc: 0, data: [], user: null });
    return null;
  }

  function installFetchAdapter(target) {
    if (!target || typeof target.fetch !== "function" || target.__LX_SKILL_FETCH_INSTALLED) return;
    target.__LX_SKILL_FETCH_INSTALLED = true;
    var nativeFetch = target.fetch.bind(target);
    target.fetch = function (input, options) {
      var rawUrl = typeof input === "string" ? input : input && input.url;
      var isApi = typeof rawUrl === "string" && (/^\/api\//.test(rawUrl) || /\/api\//.test(rawUrl));
      if (!isApi) return nativeFetch(input, options);
      if (target.location && target.location.protocol === "file:") {
        return Promise.resolve(localApiResponse(rawUrl, options));
      }
      return nativeFetch(input, options).catch(function () {
        return localApiResponse(rawUrl, options);
      });
    };
  }

  return {
    PRODUCTS: PRODUCTS,
    answerQuery: answerQuery,
    followups: followups,
    localApiResponse: localApiResponse,
    installFetchAdapter: installFetchAdapter
  };
});

;


;/* public/leaip0/assets/frontend/js/shared/inline-5faa7877c846.js */
window.__LXFD_FORCE = new URLSearchParams(location.search).has("lxfd") ||
        location.pathname.replace(/\/+$|^$/, "/") === "/" ||
        /home-fullscreen-dialog-template\.html$/.test(location.pathname);
      window.__LX_TEMPLATE_RUNTIME = Object.freeze({
        origin: location.protocol === "file:" ? "skill://local-knowledge" : location.origin,
        streamEndpoint: "/api/leai/stream",
        intentEndpoint: "/api/leai/intent",
        fallbackEndpoint: "/api/chat/stream",
        mode: location.protocol === "file:" ? "bundled-knowledge" : "model-and-knowledge",
        standalone: true
      });
      if (window.LeAIModelKnowledgeRuntime) {
        window.LeAIModelKnowledgeRuntime.installFetchAdapter(window);
      }

;


;/* public/leaip0/assets/frontend/js/core/portal.js */
      const body = document.body;
      const assistantPanel = document.querySelector(".assistant-panel");
      const assistantToggle = document.querySelector(".assistant-toggle");
      const assistantRestore = document.querySelector(".assistant-restore");
      const switchButton = document.querySelector(".switch-btn");
      const newChatButton = document.querySelector(".new-chat-button");
      const composerTextarea = document.querySelector(".composer textarea");
      const heroComposer = document.querySelector(".hero-composer");
      const heroComposerTextarea = document.querySelector(".hero-composer textarea");
      const rotatingTitle = document.querySelector(".rotating-title");
      const heroModeOptions = document.querySelectorAll(".hero-mode-option");
      const heroSuggestions = document.querySelectorAll(".hero-suggestion");
      const heroSlides = document.querySelectorAll(".hero-slide");
      const navPageButtons = document.querySelectorAll(".main-nav [data-page]");
      const pageJumpButtons = document.querySelectorAll("[data-page-jump]");
      const heroKicker = document.querySelector("[data-page-kicker]");
      const heroTitle = document.querySelector("[data-page-title]");
      const heroPanelCollapse = document.querySelector(".hero-panel-collapse");
      const categoryButtons = document.querySelectorAll(".category-tabs button");
      const productCards = document.querySelectorAll(".product-card");
      const content = document.querySelector(".content");
      const revealNodes = document.querySelectorAll(
        ".portal-section, .portal-product, .solution-card, .case-card, .news-card, .hot-card, .footer-col"
      );
      const detailBack = document.querySelector(".detail-back");
      const detailTitle = document.querySelector("[data-detail-title]");
      const detailSummary = document.querySelector("[data-detail-summary]");
      const detailPrice = document.querySelector("[data-detail-price]");
      const detailVisualWrap = document.querySelector(".detail-visual");
      const detailVisual = document.querySelector("[data-detail-visual]");
      const detailImagesPanel = document.querySelector("[data-detail-images-panel]");
      const detailHeroImage = document.querySelector("[data-detail-hero-image]");
      const detailHeroTitle = document.querySelector("[data-detail-hero-title]");
      const detailHeroDesc = document.querySelector("[data-detail-hero-desc]");
      const detailReviewOne = document.querySelector("[data-detail-review-one]");
      const detailReviewTwo = document.querySelector("[data-detail-review-two]");
      const detailReviewThree = document.querySelector("[data-detail-review-three]");
      const detailSpecGrid = document.querySelector("[data-detail-spec-grid]");
      let currentPageKey = "home";
      let rotatingTitleTimer;
      let heroSlideIndex = 0;
      const pageConfigs = {
        personal: {
          kicker: "2026 拯救者PC新品震撼来袭",
          title: "拯救驾临 执御客川",
          categories: ["推荐", "小新", "拯救者", "YOGA", "ThinkPad", "手机", "配件"],
          products: [
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-1.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-2.jpg"],
            ["Lecoo", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-3.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "国补后￥9799", "", "/assets/img/shop-4.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-5.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-7.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-8.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-9.jpg"],
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-10.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-11.jpg"],
            ["Lecoo", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-12.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "国补后￥9799", "dark", "/assets/img/shop-13.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-14.jpg"],
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-14.jpg"]
          ]
        },
        business: {
          kicker: "联想中小企业智能办公方案",
          title: "高效办公 灵活成长",
          categories: ["推荐", "ThinkCentre", "ThinkBook", "ThinkPad", "商用台式机", "显示器", "服务"],
          products: [
            ["ThinkCentre", "启天M商用台式机", "稳定高效｜企业级管理", "¥ 4999", ""],
            ["ThinkBook", "ThinkBook 14", "轻薄办公｜长效续航", "¥ 5999", ""],
            ["ThinkPad", "ThinkPad E14", "商务可靠｜安全加固", "¥ 6299", "dark"],
            ["联想服务", "企业IT服务包", "部署运维｜远程支持", "咨询报价", ""],
            ["ThinkVision", "商用显示器", "低蓝光｜多接口扩展", "¥ 1299", ""],
            ["联想小新", "办公套装方案", "电脑+显示器｜一站采购", "组合优惠", ""],
            ["ThinkCentre", "迷你主机方案", "小巧节能｜集中部署", "¥ 3999", ""],
            ["Lenovo AI", "AI办公助手方案", "会议纪要｜资料检索", "了解方案", "dark"]
          ]
        },
        enterprise: {
          kicker: "政教及大企业数字化终端方案",
          title: "安全可信 规模交付",
          categories: ["推荐", "政教采购", "大企业", "工作站", "服务器", "安全服务", "定制"],
          products: [
            ["政教方案", "昭阳商用笔记本", "国产化适配｜集中管控", "咨询报价", ""],
            ["ThinkStation", "高性能工作站", "专业图形｜稳定算力", "¥ 12999", "dark"],
            ["联想服务", "大客户运维服务", "SLA支持｜驻场保障", "定制报价", ""],
            ["教育方案", "智慧教学终端", "教室部署｜统一管理", "了解方案", ""],
            ["安全可信", "终端安全套件", "身份认证｜数据防护", "咨询报价", ""],
            ["ThinkPad", "旗舰商务终端", "高可靠｜高安全", "¥ 9999", "dark"],
            ["数据中心", "边缘服务器", "稳定扩展｜集中运维", "定制报价", "dark"],
            ["联想定制", "行业专属方案", "批量交付｜深度定制", "联系顾问", ""]
          ]
        }
      };
      const resolveAssetUrl = (url) => {
        if (!url || location.protocol !== "file:" || !url.startsWith("/assets/")) return url;
        return new URL(`../${url.slice("/assets/".length)}`, document.baseURI).href;
      };
      const params = new URLSearchParams(window.location.search);
      revealNodes.forEach((node, index) => {
        node.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
      });
      const revealObserver = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver?.unobserve(entry.target);
              });
            },
            {
              root: content,
              threshold: 0.16,
              rootMargin: "0px 0px -8% 0px"
            }
          );
      revealNodes.forEach((node) => {
        if (revealObserver) {
          revealObserver.observe(node);
        } else {
          node.classList.add("is-visible");
        }
      });
      const refreshHomeReveal = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          revealNodes.forEach((node) => node.classList.add("is-visible"));
          return;
        }
        requestAnimationFrame(() => {
          revealNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            const contentRect = content?.getBoundingClientRect();
            const viewportBottom = contentRect ? contentRect.bottom : window.innerHeight;
            if (rect.top < viewportBottom - 24) {
              node.classList.add("is-visible");
            }
          });
        });
      };
      const setupRotatingTitle = () => {
        if (!rotatingTitle) return;
        const words = Array.from(rotatingTitle.querySelectorAll(".word"));
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let activeIndex = 0;

        const updateWord = () => {
          words.forEach((word, index) => {
            word.classList.toggle("is-active", index === activeIndex);
          });
          const activeWord = words[activeIndex];
          const w = activeWord.getBoundingClientRect().width;
          // 首屏未完成布局/字体未加载时宽度为 0，写 0px 会被 overflow:hidden 把首词裁没→标题空白几秒；保留默认 3em 让首词立即显示
          if (w > 0) rotatingTitle.style.setProperty("--rotating-title-width", `${w}px`);
        };

        updateWord();
        rotatingTitle.classList.add("is-ready");
        // 布局/字体就绪后再量一次，确保首词立刻正确显示而非等到下一次 2s 轮播才出现
        requestAnimationFrame(updateWord);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateWord);
        window.addEventListener("resize", updateWord);

        if (reduceMotion || words.length < 2) return;
        rotatingTitleTimer = window.setInterval(() => {
          activeIndex = (activeIndex + 1) % words.length;
          updateWord();
        }, 2000);
      };
      const setupHeroCarousel = () => {
        if (heroSlides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        window.setInterval(() => {
          heroSlides[heroSlideIndex]?.classList.remove("is-active");
          heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
          heroSlides[heroSlideIndex]?.classList.add("is-active");
        }, 4200);
      };
      const updateStaticDetailPanels = ({ brand, title, spec, image }) => {
        if (detailImagesPanel) {
          detailImagesPanel.innerHTML = image
            ? `<img src="${image}" alt="${title} 产品详情图" loading="lazy" />`
            : `<div class="detail-images-empty">暂无详情图</div>`;
        } else if (detailHeroImage && image) {
          detailHeroImage.src = image;
          detailHeroImage.alt = `${title} 产品详情图`;
        }
        if (detailHeroTitle) detailHeroTitle.textContent = title;
        if (detailHeroDesc) detailHeroDesc.textContent = `${spec}。围绕性能、体验、服务和购买决策展示核心信息，支持继续向联想乐享咨询选型与对比。`;
        if (detailReviewOne) detailReviewOne.textContent = `${title} 在日常使用中响应稳定，适合按预算和场景做进一步选型。`;
        if (detailReviewTwo) detailReviewTwo.textContent = `外观质感和核心配置符合预期，${spec} 覆盖主要使用需求。`;
        if (detailReviewThree) detailReviewThree.textContent = "通过联想乐享可以继续确认优惠、门店服务和同类商品对比。";
        if (detailSpecGrid) {
          const specs = [
            ["品牌/系列", brand || "联想官方"],
            ["商品名称", title],
            ["核心规格", spec],
            ["服务支持", "官方保修与售后支持"],
            ["导购能力", "支持选型、优惠和对比咨询"],
            ["价格库存", "以实际下单页为准"]
          ];
          detailSpecGrid.innerHTML = specs.map(([label, value]) => `<div class="detail-spec-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
        }
      };
      const openProductDetail = (index) => {
        const config = pageConfigs[currentPageKey] || pageConfigs.personal;
        const product = config.products[index] || config.products[0];
        const [brand, title, spec, price, visual, rawImage] = product;
        const image = resolveAssetUrl(rawImage);
        if (detailTitle) detailTitle.textContent = title;
        if (detailSummary) detailSummary.textContent = `${spec}，适合按照预算、用途和服务需求进行选择，支持继续向联想乐享 AI 助手咨询对比。`;
        if (detailPrice) detailPrice.textContent = price;
        if (detailVisualWrap) {
          detailVisualWrap.innerHTML = image
            ? `<img class="detail-product-image" src="${image}" alt="${title}" data-detail-visual />`
            : `<div class="laptop${visual ? ` ${visual}` : ""}" data-detail-visual><div class="screen"></div><div class="base"></div></div>`;
        } else if (detailVisual) {
          detailVisual.className = `laptop${visual ? ` ${visual}` : ""}`;
        }
        updateStaticDetailPanels({ brand, title, spec, image });
        if (content) {
          content.dataset.view = "detail";
          content.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
      const applyPage = (pageKey) => {
        if (pageKey === "home") {
          currentPageKey = "home";
          body.dataset.page = "home";
          body.classList.remove("assistant-collapsed", "assistant-right", "assistant-fullscreen");
          switchButton?.setAttribute("aria-pressed", "false");
          assistantToggle?.setAttribute("aria-expanded", "false");
          if (content) content.dataset.view = "home";
          navPageButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.page === "home");
          });
          content?.scrollTo({ top: 0, behavior: "smooth" });
          refreshHomeReveal();
          return;
        }
        if (pageKey === "brand") {
          currentPageKey = "brand";
          body.dataset.page = "brand";
          body.classList.remove("assistant-collapsed", "assistant-right", "assistant-fullscreen");
          switchButton?.setAttribute("aria-pressed", "false");
          assistantToggle?.setAttribute("aria-expanded", "true");
          if (content) content.dataset.view = "brand";
          navPageButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.page === "brand");
          });
          content?.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const config = pageConfigs[pageKey] || pageConfigs.personal;
        currentPageKey = pageConfigs[pageKey] ? pageKey : "personal";
        body.dataset.page = currentPageKey;
        body.classList.remove("assistant-collapsed");
        assistantToggle?.setAttribute("aria-expanded", "true");
        if (content) content.dataset.view = "list";
        navPageButtons.forEach((button) => {
          button.classList.toggle("active", button.dataset.page === pageKey);
        });
        if (heroKicker) heroKicker.textContent = config.kicker;
        if (heroTitle) heroTitle.textContent = config.title;
        categoryButtons.forEach((button, index) => {
          button.textContent = config.categories[index] || "";
          button.classList.toggle("active", index === 0);
          button.hidden = !config.categories[index];
        });
        productCards.forEach((card, index) => {
          const product = config.products[index] || config.products[0];
          const [brand, title, spec, price, visual, rawImage] = product;
          const image = resolveAssetUrl(rawImage);
          const brandNode = card.querySelector(".brand-mini");
          const titleNode = card.querySelector(".product-title");
          const specNode = card.querySelector(".spec");
          const priceNode = card.querySelector(".price");
          const visualNode = card.querySelector(".product-visual");
          if (brandNode) {
            brandNode.textContent = brand;
            brandNode.classList.toggle("orange", brand === "Lecoo");
          }
          if (titleNode) titleNode.textContent = title;
          if (specNode) specNode.textContent = spec;
          if (priceNode) priceNode.textContent = price;
          if (visualNode) {
            visualNode.innerHTML = image
              ? `<img src="${image}" alt="${title}" />`
              : `<div class="laptop${visual ? ` ${visual}` : ""}"><div class="screen"></div><div class="base"></div></div>`;
          }
          card.dataset.productIndex = String(index);
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `查看${title}商品详情`);
        });
      };
      productCards.forEach((card) => {
        card.addEventListener("click", () => {
          openProductDetail(Number(card.dataset.productIndex || 0));
        });
        card.addEventListener("keydown", (event) => {
          if (!["Enter", " "].includes(event.key)) return;
          event.preventDefault();
          openProductDetail(Number(card.dataset.productIndex || 0));
        });
      });
      detailBack?.addEventListener("click", () => {
        if (content) {
          content.dataset.view = "list";
          content.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      navPageButtons.forEach((button) => {
        button.addEventListener("click", () => {
          applyPage(button.dataset.page);
        });
      });
      pageJumpButtons.forEach((button) => {
        button.addEventListener("click", () => {
          applyPage(button.dataset.pageJump);
        });
      });
      heroModeOptions.forEach((button) => {
        button.addEventListener("click", () => {
          heroModeOptions.forEach((option) => {
            const isActive = option === button;
            option.classList.toggle("is-active", isActive);
            option.setAttribute("aria-pressed", String(isActive));
          });
          // 首页「快速/思考」选择同步到对话区「深度思考」开关
          const wantThink = button.textContent.trim() === "思考";
          window.__lxThinking = wantThink;
          const thinkChip = document.querySelector('.composer .chip[data-mode-chip="think"]');
          if (thinkChip) {
            thinkChip.classList.toggle("is-active", wantThink);
            thinkChip.setAttribute("aria-pressed", String(wantThink));
          }
        });
      });
      document.querySelectorAll('.composer .chip[data-mode-chip]').forEach((chip) => {
        const toggleChip = () => {
          const active = chip.classList.toggle("is-active");
          chip.setAttribute("aria-pressed", String(active));
          if (chip.dataset.modeChip === "think") window.__lxThinking = active;
          if (chip.dataset.modeChip === "web") window.__lxWebSearch = active;
        };
        chip.addEventListener("click", toggleChip);
        chip.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggleChip();
        });
      });
      heroSuggestions.forEach((button) => {
        button.addEventListener("click", () => {
          if (!heroComposerTextarea) return;
          heroComposerTextarea.value = button.textContent.trim();
          heroComposerTextarea.focus();
        });
      });
      setupRotatingTitle();
      setupHeroCarousel();
      applyPage(params.get("page") || "home");
      if (params.has("detail")) {
        openProductDetail(Number(params.get("detail") || 0));
      }
      if (params.get("state") === "chat") {
        body.dataset.state = "chat";
      }
      if (params.get("demo") === "hover") {
        body.dataset.state = "chat";
        body.dataset.demo = "hover";
      }
      const startControls = document.querySelectorAll("[data-start-chat]");
      startControls.forEach((control) => {
        control.addEventListener("click", (event) => {
          event.preventDefault();
          body.dataset.state = "chat";
        });
      });
      const historyButton = document.querySelector(".history-button");
      const historySidebar = document.querySelector(".assistant-history-sidebar");
      const historyClose = document.querySelector(".assistant-history-close");
      const setHistorySidebar = (open) => {
        body.classList.toggle("assistant-history-open", open);
        historyButton?.classList.toggle("is-active", open);
        historyButton?.setAttribute("aria-expanded", String(open));
        historySidebar?.setAttribute("aria-hidden", String(!open));
      };
      historyButton?.addEventListener("click", () => {
        const nextOpen = !body.classList.contains("assistant-history-open");
        if (nextOpen) {
          setAssistantFullscreen(true);
        }
        setHistorySidebar(nextOpen);
      });
      historyClose?.addEventListener("click", () => {
        setHistorySidebar(false);
      });
      const resizeComposer = () => {
        if (!composerTextarea) return;
        composerTextarea.style.height = "auto";
        const maxHeight = parseFloat(getComputedStyle(composerTextarea).maxHeight) || 118;
        const nextHeight = Math.min(composerTextarea.scrollHeight, maxHeight);
        composerTextarea.style.height = `${nextHeight}px`;
        composerTextarea.style.overflowY = composerTextarea.scrollHeight > maxHeight ? "auto" : "hidden";
      };
      composerTextarea?.addEventListener("input", resizeComposer);
      resizeComposer();
      const resizeHeroComposer = () => {
        if (!heroComposerTextarea) return;
        heroComposerTextarea.style.height = "auto";
        const nextHeight = Math.min(heroComposerTextarea.scrollHeight, 132);
        heroComposerTextarea.style.height = `${nextHeight}px`;
      };
      heroComposerTextarea?.addEventListener("input", resizeHeroComposer);
      resizeHeroComposer();
      heroComposer?.addEventListener("submit", (event) => {
        event.preventDefault();
        applyPage("personal");
        body.dataset.state = "chat";
      });

      const shell = document.querySelector(".shell");
      const panelResizer = document.querySelector(".panel-resizer");
      const clampPanelWidth = (width) => {
        const minWidth = window.innerWidth <= 1280 ? 300 : 312;
        const maxWidth = Math.min(window.innerWidth * 0.42, window.innerWidth <= 1280 ? 420 : 720);
        return Math.round(Math.max(minWidth, Math.min(width, maxWidth)));
      };
      const setPanelWidth = (width) => {
        body.style.setProperty("--assistant-panel-width", `${clampPanelWidth(width)}px`);
      };
      const setAssistantFullscreen = (expanded) => {
        body.classList.toggle("assistant-fullscreen", expanded);
        if (expanded) {
          body.classList.remove("assistant-collapsed", "assistant-right");
          switchButton?.setAttribute("aria-pressed", "false");
        } else {
          setHistorySidebar(false);
        }
        assistantToggle?.setAttribute("aria-expanded", String(expanded));
        assistantToggle?.setAttribute("aria-pressed", String(expanded));
        assistantToggle?.setAttribute("aria-label", expanded ? "退出全屏对话" : "对话全屏");
        assistantToggle?.setAttribute("title", expanded ? "退出全屏对话" : "对话全屏");
      };
      const setAssistantCollapsed = (collapsed) => {
        if (collapsed) setAssistantFullscreen(false);
        body.classList.toggle("assistant-collapsed", collapsed);
        assistantToggle?.setAttribute("aria-expanded", String(!collapsed));
      };
      assistantToggle?.addEventListener("click", () => {
        setAssistantFullscreen(!body.classList.contains("assistant-fullscreen"));
      });
      heroPanelCollapse?.addEventListener("click", () => {
        setAssistantFullscreen(true);
        body.dataset.state = "default";
        composerTextarea?.focus();
      });
      assistantRestore?.addEventListener("click", () => {
        setAssistantCollapsed(false);
      });
      switchButton?.addEventListener("click", () => {
        setAssistantFullscreen(false);
        const isRight = body.classList.toggle("assistant-right");
        switchButton.setAttribute("aria-pressed", String(isRight));
      });
      panelResizer?.addEventListener("pointerdown", (event) => {
        if (body.classList.contains("assistant-collapsed") || body.classList.contains("assistant-fullscreen")) return;
        event.preventDefault();
        panelResizer.setPointerCapture(event.pointerId);
        body.classList.add("is-resizing");
      });
      panelResizer?.addEventListener("pointermove", (event) => {
        if (!body.classList.contains("is-resizing") || !shell) return;
        const shellRect = shell.getBoundingClientRect();
        const shellStyles = getComputedStyle(shell);
        const shellPaddingLeft = parseFloat(shellStyles.paddingLeft) || 0;
        const shellPaddingRight = parseFloat(shellStyles.paddingRight) || 0;
        const width = body.classList.contains("assistant-right")
          ? shellRect.right - shellPaddingRight - event.clientX
          : event.clientX - shellRect.left - shellPaddingLeft;
        setPanelWidth(width);
      });
      panelResizer?.addEventListener("pointerup", (event) => {
        panelResizer.releasePointerCapture(event.pointerId);
        body.classList.remove("is-resizing");
      });
      panelResizer?.addEventListener("pointercancel", () => {
        body.classList.remove("is-resizing");
      });
      panelResizer?.addEventListener("dblclick", () => {
        body.style.removeProperty("--assistant-panel-width");
      });
      panelResizer?.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Home") {
          body.style.removeProperty("--assistant-panel-width");
          return;
        }
        const current = assistantPanel?.getBoundingClientRect().width || 336;
        const isRight = body.classList.contains("assistant-right");
        const delta = event.key === "ArrowRight" ? (isRight ? -12 : 12) : (isRight ? 12 : -12);
        setPanelWidth(current + delta);
      });

;


;/* public/leaip0/assets/frontend/js/core/industry-solutions-v114.js */
(function(root){
"use strict";
const meta=[["教育","智慧教育","EDU"],["医疗","智慧医疗","MED"],["政府","数字政府","GOV"],["制造","智能制造","MFG"],["金融","智慧金融","FIN"],["能源","智慧能源","ENE"],["交通","智慧交通","TRA"],["服务","智能基础设施","SER"]], catalog={"教育":[["多擎云桌面解决方案","普教","多擎云桌面解决方案：融合四大架构，统一云化管理，提升教学效率。","多擎云桌面解决方案4.jpg"],["智慧教室解决方案","高校","智慧教室解决方案：打破信息壁垒，助力教育数字化转型。","智慧教室解决方案.jpg"],["职教智慧校园解决方案","职教","职教智慧校园解决方案：以1+2+3架构打造一体化数智校园，覆盖全场景。","智慧校园解决方案1.jpg"],["智慧校园解决方案","高校","智慧校园解决方案：构建数字底座，赋能教育治理现代化，实现提质减负。","智慧校园解决方案2.jpg"],["高性能计算解决方案","高校","高性能计算解决方案：低门槛HPC+AI平台，降低30%-50%成本。","高性能计算解决方案.jpg"],["教育存储解决方案","高校","教育存储解决方案：面向教学、科研与校园数据，提供稳定可靠的统一存储能力。","教育存储解决方案.jpg"]],"医疗":[["医共体/医联体解决方案","区卫-智慧区卫","医共体/医联体解决方案：统一管理协同，推动资源共享与医疗数字化转型。","医共体/医联体解决方案.jpg"],["慢病与健康管理解决方案","医院-服务","慢病与健康管理解决方案：覆盖多种慢病及肿瘤患者，助力医院高质量发展。","智慧医院整体解决方案.jpg"],["多院区/区域医疗中心基础设施解决方案","医院-智慧管理","多院区/区域医疗中心基础设施解决方案：统一管理多数据中心，提升运维服务质量。","多院区/区域医疗中心基础设施解决方案.jpg"],["医疗数据灾备与管理解决方案","医院-智慧管理","医疗数据灾备与管理解决方案：覆盖存储、备份、容灾全流程，提升数据安全与运营效率。","医疗数据灾备与管理解决方案.jpg"],["医疗云桌面解决方案","医院-智慧管理","医疗云桌面解决方案：集中管理分布式架构，支持多院区扩展。","医疗云桌面解决方案.jpg"],["医院云盘解决方案","医院-智慧服务","医院云盘解决方案：统一汇聚院内文件与协作数据，兼顾便捷共享和安全管控。","医院云盘解决方案.jpg"]],"政府":[["联想LECP存算一体化平台","政府官网","联想LECP存算一体化平台：存算管一体，开放兼容异构设备，节省30%投资，性能提升2倍。","联想LECP存算一体化平台.jpg"],["数字政府统一运维方案","政府官网","数字政府统一运维方案：四个统一提升工单解决率与满意度，降本增效。","数字政府统一运维方案.jpg"],["政务大数据解决方案","政府官网","政务大数据解决方案：构建三大中台，打破信息壁垒，实现高效协同。","政务大数据解决方案.jpg"],["政务云平台解决方案","政府官网","政务云平台解决方案：统一底座与能力平台，打造一站式政务服务平台。","政务云平台解决方案.jpg"],["智慧园区综合解决方案","政府官网","智慧园区综合解决方案：聚焦四大痛点，提供一站式服务，助力园区可持续发展。","智慧园区综合解决方案.jpg"],["政府移动电子政务解决方案","移动政务","政府移动电子政务解决方案：连接移动办公与政务应用，提升协同效率和终端安全。","政府移动电子政务解决方案.jpg"]],"制造":[["AI研发平台","智慧研发","AI研发平台：一站式MLOps平台，助力制造企业降本增效。","AI研发平台.jpg"],["数字化研发平台","智慧研发","数字化研发平台：融合仿真与设计，结合多体系，多节点产品，帮助企业提升资源利用率。","数字化研发平台.jpg"],["AR数字孪生","智慧研发","AR数字孪生：构建工业元宇宙产品体系，助力企业降本增效与智能化转型。","AR数字孪生.jpg"],["产线数字化","智慧生产","产线数字化：覆盖MES配套、自动化控制、缺陷检测，助力高效数字化转型。","产线数字化.jpg"],["Lenovo Edge AI 工业质检解决方案","智慧生产","Lenovo Edge AI 工业质检解决方案：小样本终身学习驱动边缘AI质检，提升效率与精度。","Lenovo Edge AI工业质检解决方案.jpg"],["制造执行系统","智慧生产","制造执行系统：贯通计划、生产、质量与设备数据，提升工厂透明化运营能力。","制造执行系统.jpg"]],"金融":[["金融行业DCM数据中心管理平台","数字基础设施","金融行业DCM数据中心管理平台：带内外管理赋能全流程运维，提效降本增安绿色运营。","金融行业DCM数据中心管理平台.jpg"],["联想IT设备再生服务","数字基础设施","可持续发展解决方案（ESG）IT设备再生服务：覆盖资产回收处置全环节，保障安全合规。","联想IT设备再生服务.jpg"],["智能运维解决方案","智能运维","智能运维解决方案：全渠道全天候全生命周期数字化运维，助力金融机构高效创新发展 。","智能运维解决方案.jpg"],["联想超融合解决方案","智能运维","联想超融合解决方案：整合资源一体化管理，提升利用率，支撑金融IT高效灵活升级。","联想超融合解决方案.jpg"],["联想魔方客服智能体解决方案","智能客服","联想魔方客服智能体解决方案：无缝嵌入客服系统，私有化部署，助力企业客服升级。","联想魔方客服智能体解决方案.jpg"],["智能混合云解决方案","数字基础设施","智能混合云解决方案：统一纳管多云资源，为金融业务提供弹性、安全的基础设施底座。","智能混合云解决方案.jpg"]],"能源":[["变电站智能巡检解决方案","电力","变电站智能巡检解决方案：融合机器人、AI，支持多场景智能巡检，提效降本。","变电站智能巡检解决方案.jpg"],["智慧电厂解决方案","电力","智慧电厂解决方案：构建统一数据环境，推动电厂智能化运营。","智慧电厂解决方案.jpg"],["智慧矿山数字孪生解决方案","矿产","智慧矿山数字孪生解决方案：提供建模、XR展示、仿真预测，提升矿山运营效率与安全。","智慧矿山数字孪生解决方案.jpg"],["带式输送机工业质检解决方案","矿产","带式输送机工业质检解决方案：覆盖异物、跑偏及违规识别，降低模型成本，提升安全性。","带式输送机工业质检解决方案.jpg"],["私有云建设及扩容解决方案","油气","私有云建设及扩容解决方案：依托Nutanix实现多地多中心统一管理与灵活容灾。","私有云建设及扩容解决方案.jpg"],["虚拟电厂解决方案","电力","虚拟电厂解决方案：聚合分布式能源与负荷资源，提升调度协同和能源运营效率。","虚拟电厂解决方案.jpg"]],"交通":[["高速ETC HCI解决方案","高速","高速ETC HCI解决方案：云边端架构，提升资源利用率与运维效率。","高速ETC HCI解决方案.jpg"],["高速云解决方案","高速","高速云解决方案：构建“端-边-云-网-智”架构，提升高速运营效率、安全与服务质量。","高速云解决方案.jpg"],["轨交云解决方案","轨交","轨交云解决方案：提供城轨云与大数据平台，提升运维效率，推动智能化发展。","轨交云解决方案.jpg"],["智能运维平台解决方案","轨交","智能运维平台解决方案：以边缘感知+智慧认知+人机协同架构，提升城轨智能运维能力。","智能运维平台解决方案.jpg"],["机场云平台解决方案","航空","机场云平台解决方案：统一管理异构资源，助力智慧民航数字化升级。","机场云平台解决方案.jpg"],["轨交智能运营解决方案","轨交","轨交智能运营解决方案：融合运营数据和智能分析能力，提升线网协同与服务水平。","轨交智能运营解决方案.jpg"]],"服务":[["非线编解决方案","媒体","非线编解决方案：解决超高清制作读写、并发与算力痛点，保障稳定扩展与数据安全。","非线编解决方案.jpg"],["联想智能媒资解决方案","媒体","联想智能媒资解决方案：解决扩展适配存储风险，支撑媒资全生命周期管理。","联想智能媒资解决方案.jpg"],["物流智能分拨中心解决方案","物流","物流智能分拨中心解决方案：打造四大智能场景，提升分拣效率与准确率，降低运营成本。","物流智能分拨中心解决方案.jpg"],["物流中心云解决方案","物流","物流中心云解决方案：整合云计算等技术打通数据壁垒，支撑物流降本增效与数字化升级。","物流中心云解决方案.jpg"],["智慧零售连锁门店解决方案","数字门店","智慧零售连锁门店解决方案：全链路数字化，助力快速开店与精细化管理。","智慧零售连锁门店解决方案.jpg"],["企业出海数字化解决方案","企业服务","企业出海数字化解决方案：覆盖全球办公、设备交付与持续服务，支撑业务快速拓展。","企业出海数字化解决方案.jpg"]]};
const definitions=[
 ["教育","education",/教育|学校|校园|高校|职教|普教|教学|教室|科研/,"智慧课堂、校园管理与教学科研"],
 ["医疗","healthcare",/医疗|医院|医共体|医联体|卫生|诊所|健康管理/,"诊疗协同、医院管理与医疗数据"],
 ["政府","government",/政府|政务|机关|公共事业|数字政府|政企/,"政务协同、公共服务与数据治理"],
 ["制造","manufacturing",/制造|工厂|产线|质检|工业|生产车间/,"智能工厂、生产协同与质量管理"],
 ["金融","finance",/金融|银行|证券|保险|信贷/,"金融业务、数据安全与基础设施"],
 ["能源","energy",/能源|电力|矿山|矿产|油气|电厂|变电|新能源/,"能源生产、智能运维与安全管理"],
 ["交通","transportation",/交通|高速|轨交|轨道|铁路|机场|民航|港口/,"交通运营、出行服务与协同管理"],
 ["服务","services",/服务行业|服务业|智慧服务|现代服务|物流|媒体|零售|数字门店|企业出海/,"媒体制作、物流运营与数字门店"]
];
function get(industry){return definitions.find(x=>x[0]===industry||x[1]===industry)||null;}
function detect(query){
 const text=String(query||"").trim();
 if(!text||text.length>160||/优惠|认证|学生价|维修|退货|订单|白皮书|对比|详细介绍|解读|多少钱|怎么购买/.test(text))return "";
 const hits=definitions.filter(x=>x[2].test(text));
 if(hits.length!==1)return "";
 if(!/方案|行业|数字化|信息化|智慧|智能化/.test(text)&&text.length>10)return "";
 return hits[0][0];
}
function describe(industry){
 const item=get(industry);if(!item)return null;
 const [name,key,,scenes]=item, rows=catalog[name]||[];
 return {industry:name,key,feature:"solution-industry:"+key,tabId:"info:solution-industry:"+key,
 title:name+"行业解决方案",cardTitle:"查看"+name+"行业解决方案全集",count:rows.length,
 desc:"已汇总 "+rows.length+" 个方案 · 支持查看详情、引用与对比",
 copy:"已为你汇总**"+name+"行业解决方案全集**，覆盖"+scenes+"等核心场景。\n\n你可以**查看方案详情、勾选引用或对比**，结合业务需求了解部署方式与服务范围，进一步筛选适合的建设方案。"};
}
async function run(industry){
 const result=describe(industry);if(!result||!result.count)throw new Error("行业方案目录不可用");
 return {...result,skill:"解决方案推荐",items:catalog[result.industry].map(row=>row.slice())};
}
root.__lxIndustrySolutions={meta,catalog,detect,describe,run};
})(window);

;


;/* public/leaip0/assets/frontend/js/core/app-intent.industry-v114.js */
// ── 乐享意图路由共享模块（app.js 拆分第一步）────────────────────────────────
// 主面板 IIFE 与 lxfd 全屏 IIFE 之前各维护一份本地快路径正则，改一处漏一处、还会漂移
// （全屏那份曾缺 close_other_tabs / 门店导航词）。统一收口到这里：
//   window.__lxIntent.matchControl(text) → {op, target, msg} | null   本地 0ms 秒判
//   window.__lxIntent.parseOrdinal / parseOrdinals                    序号解析
//   window.__lxIntent.opNames                                          后端意图确认话术
// 加载顺序：必须在 app.js 之前（index.html 里 script 排前面）。
(function (root) {
  "use strict";

  // 序号解析：第一/二/三…/N 个。序号必须有明确标志，严防金额/规格数字误判。范围 1-20。
  const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  function parseOrdinal(text) {
    const t = String(text || "");
    const isAmount = (numStr, idx) => {
      const after = t.slice(idx + numStr.length, idx + numStr.length + 4);
      return /^(元|块|万|千|价|G|GB|TB|寸|英寸|Hz|年|月|号机|%|度)/.test(after) || /到\d/.test(t.slice(idx, idx + numStr.length + 6));
    };
    let m = t.match(/第\s*(\d{1,2})\s*(个|款|台|件|号)?/);
    if (m && !isAmount(m[1], m.index + (m[0].indexOf(m[1])))) { const n = Number(m[1]); if (n >= 1 && n <= 20) return n; }
    m = t.match(/(?:^|[^\d.])(\d{1,2})\s*(个|款|台|件)(?![\d元])/);
    if (m) { const n = Number(m[1]); const idx = t.indexOf(m[1], m.index); if (!isAmount(m[1], idx) && n >= 1 && n <= 20) return n; }
    const cn = t.match(/第\s*([一二两三四五六七八九十]+)\s*(个|款|台|件)?/);
    if (cn) {
      const s = cn[1];
      let n = null;
      if (s === "十") n = 10;
      else if (s.length === 1) n = CN_NUM[s] || null;
      else if (s[0] === "十") n = 10 + (CN_NUM[s[1]] || 0);
      else if (s[1] === "十") n = (CN_NUM[s[0]] || 0) * 10 + (CN_NUM[s[2]] || 0);
      if (n && n >= 1 && n <= 20) return n;
    }
    return null;
  }

  // 多序号（对比场景）：「1 2 3」「第一个第二个第三个」「1和3」。连写「123」逐位拆；「两款」是量词不算。
  function parseOrdinals(text) {
    const t = String(text || "");
    const nums = [];
    const push = (n) => { if (n >= 1 && n <= 20 && !nums.includes(n)) nums.push(n); };
    const cnMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const cnRe = /第?\s*([一二三四五六七八九十])\s*(?:个|款|台|件)?/g;
    let m;
    while ((m = cnRe.exec(t))) push(cnMap[m[1]] || 0);
    const arRe = /(\d{1,2})/g;
    while ((m = arRe.exec(t))) {
      const numStr = m[1];
      const after = t.slice(m.index + numStr.length, m.index + numStr.length + 3);
      if (/^(元|块|万|千|价|G|GB|TB|寸|Hz|年|月|%|度|k|K|W)/i.test(after)) continue;
      if (/^[,，]\d/.test(after)) continue; // 千分位（8,000）的首位不是序号
      if (numStr.length === 2 && !/^(个|款|台|件)/.test(after) && t[m.index - 1] !== "第") {
        numStr.split("").forEach((d) => push(Number(d)));
      } else {
        push(Number(numStr));
      }
    }
    return nums;
  }

  // 本地快路径：高频明确操作指令 0 延迟秒回，不调后端。顺序有讲究：更具体的先判。
  function matchControl(text) {
    const _t = String(text || "").trim();
    const industry = root.__lxIndustrySolutions?.detect(_t);
    if (industry) return {op:"open_solution",industry,target:industry,msg:"已为你汇总"+industry+"行业解决方案。"};
    if (!_t || _t.length > 60) return null;
    // 关其他/留当前——必须在 close_all 之前（更具体）
    if (/(关闭?|关掉)(其他|其它|多余|别的|除当前外?的?)(标签|页面|页签)?|只留(当前|这个|一个|一排)|留(当前|这个|一个|一排)(标签|页面)?|关成(剩余|只剩)?一(排|个)|剩(余|下)一(排|个)/.test(_t)) return { op: "close_other_tabs", target: "", msg: "好的，已关闭其他标签，只留当前页面。" };
    if (/^\s*(关闭?|清空)(所有|全部|这些|当前)?(标签|页面|分页|tab|页签)\s*$/i.test(_t) || /(把|将)?(所有|全部)(标签|页面).{0,4}关(掉|闭)/.test(_t)) return { op: "close_all_tabs", target: "", msg: "好的，已为你关闭所有页面标签。" };
    if (/^\s*(进入|开启|切换?到?|变成?|开|恢复|回到?)?全屏(模式|对话|查看)?\s*$|^\s*(放大|沉浸|专注)(模式|对话|查看)?\s*$/.test(_t)) return { op: "enter_fullscreen", target: "", msg: "好的，已切换到全屏对话模式。" };
    if (/^\s*(退出|关闭|取消|结束)(全屏|沉浸|专注)|^\s*(分屏|窗口|缩小)(模式)?\s*$|^\s*恢复(分屏|窗口)(模式)?\s*$|^\s*(打开|展开)(右侧|浏览区|浏览|分屏)(面板)?\s*$|^\s*(右侧|浏览区)(展开|打开)\s*$/.test(_t)) return { op: "exit_fullscreen", target: "", msg: "好的，已展开右侧浏览区。" };
    if (/^\s*(回|返回|去|到)(首页|主页)\s*$/.test(_t)) return { op: "go_home", target: "", msg: "好的，已为你回到首页。" };
    if (/^\s*(打开|查看|看看?|去|进)?(我的)?购物车\s*$/.test(_t)) return { op: "open_cart", target: "", msg: "好的，已为你打开购物车。" };
    if (/^\s*(打开|查看|看看?|去|进)?(我的)?订单(列表|页面|中心)?\s*$/.test(_t)) return { op: "open_orders", target: "", msg: "好的，已为你打开订单页面。" };
    // 高频导航单词秒判（「门店」「会员」这类短词小模型常误判成咨询，不扔给它赌）
    if (/^\s*(打开|查看?|看看?|去|进)?(附近)?(门店|实体店|线下店|体验店|专卖店|服务网点|服务中心)(查询|页面|列表)?\s*$/.test(_t)) return { op: "open_stores", target: "", msg: "好的，已为你打开门店查询。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(我的)?(会员(中心|页面|权益)?|会员卡|乐豆|积分(中心|商城)?)\s*$/.test(_t)) return { op: "open_member", target: "", msg: "好的，已为你打开会员中心。" };
    if (/^\s*(打开|查看?|看看?|领|去|进)?(我的)?(优惠券|领券|券中心|卡券)(中心|页面)?\s*$/.test(_t)) return { op: "open_coupon", target: "", msg: "好的，已为你打开优惠券中心。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(教育(特惠|优惠|认证)?(专区|页面)?|学生(优惠|特惠)(专区)?)\s*$/.test(_t)) return { op: "open_edu_zone", target: "", msg: "好的，已为你打开教育特惠专区。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(全部|全集)?(行业)?解决方案(中心|页面|全集)?\s*$/.test(_t)) return { op: "open_solution", target: "", msg: "我已为你汇总乐享全集解决方案，覆盖八大行业。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(商品)?对比(页|页面|清单)?\s*$/.test(_t)) return { op: "open_compare", target: "", msg: "好的，已为你打开商品对比。" };
    // 切换/打开站点板块（「打开个人及家庭」「进入中小企业」「去政教及大企业」「品牌馆」）——
    // 真机反馈：这类指令原本没有本地意图，掉给官方后回"无法打开页面"。站点词序有讲究：
    // 「大企业/政教/政企」判 enterprise 必须在「企业」判 business 之前（都含"企业"）。
    {
      const siteM = _t.match(/^\s*(帮我?|给我?|我?要|我?想)?\s*(打开|进入|切换到?|切到?|去|到|看看?|查看|回到?)?\s*(个人及?家庭|个人家庭|个人|家庭|中小企业|中小企|政教及?大企业|政教大企业|政教|政企|大企业|品牌馆?|品牌)\s*(板块|页面|专区|频道|站点?)?\s*(吧|呢|哈)?\s*$/);
      if (siteM) {
        const w = siteM[3];
        const page = /政教|政企|大企业/.test(w) ? "enterprise" : /中小企|企业/.test(w) ? "business" : /品牌/.test(w) ? "brand" : "personal";
        const lab = { personal: "个人及家庭", business: "中小企业", enterprise: "政教及大企业", brand: "品牌" }[page];
        return { op: "switch_site", target: page, msg: "好的，正在为你打开" + lab + "。" };
      }
    }
    // 按序号对比：「对比下1 2 3」「把1和3对比一下」——本地取当前列表，不丢给 AI 瞎检索。
    // 收紧（真机语音长句反馈）：①「比较适合我的」这类"比较+形容词"是程度副词不是对比意图；
    // ②对比指令都是短句，长自然句（"我想买…8,000块…玩玩游戏"）里的"一个/8"是量词和价格，
    // 不收紧会被抠成"对比第1、8个"
    if (_t.length <= 24 && /对比|比一?比|比较|哪个好|哪款好/.test(_t) && !/比较(适合|喜欢|中意|在意|看重|倾向)/.test(_t)) {
      const nths = parseOrdinals(_t);
      if (nths.length >= 2) return { op: "compare_nth", target: nths.join(","), msg: "好的，正在为你对比第 " + nths.join("、") + " 个商品。" };
      // 裸对比句（「对比一下吧」「这几款对比下」）：短句无序号 = 对比当前这几款，别丢给官方
      // 反问"您想对比哪两款"（真机反馈）。长句可能带具体型号/条件，仍交给 AI。
      if (_t.length <= 14 && /^(帮我?|给我?|来|就)?(把)?(这几[款个台]|它们|全部|都)?(对比|比较|比一?比)(一下|下|看看)?吧?[!！。]?$/.test(_t)) {
        return { op: "compare_recent", target: "", msg: "好的，正在为你对比当前这几款商品。" };
      }
    }
    // 选第 N 个 + 动作
    const ord = parseOrdinal(_t);
    if (ord && /第|个|款|台|件/.test(_t) && /(下单|购买|买|加购|加入购物车|打开|看)/.test(_t)) {
      const act = /加购|加入购物车/.test(_t) ? "cart" : /(下单|购买|要买|买它|买这|买第|买下|买了)/.test(_t) ? "buy" : /打开|看/.test(_t) ? "open" : "buy";
      const actWord = act === "cart" ? "加入购物车" : act === "open" ? "打开" : "下单";
      return { op: "buy_nth", target: ord + "|" + act, msg: "好的，正在为你" + actWord + "第 " + ord + " 个商品。" };
    }
    // 下单乐享推荐的商品：例如「那就直接下单你推荐的吧」「买乐享推荐那款」「就按推荐下单」
    if (/^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不)).*(你|乐享|系统|AI|ai|刚才|最)?推荐[的得]?(那[个款台件本]?|这[个款台件本]?|商品|机器|电脑)?(.*)?(下单|购买|买|要了|就它|就这[个款台件本]?|直接下单)/.test(_t) || /^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不)).*(下单|购买|买|要了|直接下单).*(你|乐享|系统|AI|ai|刚才|最)?推荐[的得]?/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，正在为你下单乐享推荐商品。" };
    // 「最优款下单吧」「买最好的那款」「你直接帮我下单一个最适合我的吧」：成交词+最X = 下单乐享
    // 最推荐那款，本地闭环不走官方下单 Skill（官方只会回"无法直接下单"话术，真机两轮反馈）。
    // 语序不限（"最优款下单"/"下单最适合的"都算）；带疑问词的是咨询不抢。
    if (_t.length <= 22 && /(下单|购买|买)/.test(_t) && /(最优|最好|最合适|最适合|最值|最推荐)/.test(_t)
        && !/(不下单|别下单|先不|不要|不买|取消|暂不)/.test(_t) && !/什么|哪|吗|怎么|[?？]/.test(_t)) {
      return { op: "buy_recommended", target: "", msg: "好的，正在为你下单最适合你的那款。" };
    }
    // 「领取权益下单」动作 chip（推荐结果页第三个 chip）：领券 + 下单乐享最推荐那款。
    // 复用 buy_recommended（lxBuyWithIntro 本身就是"打开详情→核对优惠→领券下单"三步）。
    if (/^(领取?权益|领券|领(取)?优惠券?)(并|后)?(直接)?(下单|购买|买)吧?[!！。]?$/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，正在为你领取权益并下单推荐款。" };
    // 「就你推荐的这款吧」确认式（无成交动词也算数）：句首"就"+推荐指代 = 选定推荐款下单（真机反馈）
    if (/^(那?就)(你|乐享)?(最)?推荐的?[这那]?[款个台]?(吧|好了|行)?[!！。]?$/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，就选乐享最推荐的这款，正在为你下单。" };
    // 下单当前正在看的商品（含「这款/这台/这本不错下单吧」口语）
    if (/^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不))\s*((不错|可以|好的?|行|嗯|可|就|这[个款台件本]?|那[个款台件本]?|它|对|我?要|帮我|给我|我?想)[，,、。\s]*)*(下单|购买|下个单|买(这[个款台件本]|它|那[个款台件本])?)(吧|呀|啊|喽|咯)?(?:[，,、。\s].*?(优惠|券|领|结算).*)?$/.test(_t)) return { op: "buy_current", target: "", msg: "好的，正在为你下单当前商品。" };
    return null;
  }

  // 数量意愿：「推荐三款」「来2款」→ 2-6。「第三款」是序号不算。
  // 1 款不在这里（调用方已有"推荐一款→收敛到1"的单品逻辑）。官方固定回5-6款，前端按此截断。
  function parseWantedCount(text) {
    const t = String(text || "");
    const m = t.match(/(?:推荐|介绍|来|给我?|要|选)[^,，。;；]{0,10}?(?<!第)([两二三四五六23456])\s*[款个台]/) ||
              t.match(/(?<!第)([两二三四五六23456])\s*[款个台][^,，。;；]{0,4}(?:推荐|介绍)/);
    if (!m) return null;
    const map = { 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
    const n = map[m[1]] || Number(m[1]);
    return n >= 2 && n <= 6 ? n : null;
  }

  // 后端小模型意图命中后的确认话术（target 由调用方插值）
  const opNames = {
    close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", close_tab: "关闭了该标签",
    go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面",
    open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询",
    open_edu_zone: "打开了教育专区", open_compare: "打开了商品对比", clear_compare: "清空了对比清单",
    start_student_auth: "打开了学生认证", start_enterprise_auth: "打开了企业认证", switch_site: "切换了站点",
    enter_fullscreen: "切换到全屏对话模式", exit_fullscreen: "退出了全屏模式",
    buy_current: "正在为你下单当前商品", buy_recommended: "正在为你下单乐享推荐商品", buy_nth: "正在为你处理所选商品",
  };

  // 全权代买意图（多步任务链入口）：授权乐享自主选并下单。主面板/全屏共用这一份 = 一套机制。
  // 要求含成交动词（下单/买/搞定/拿下），避免误伤"推荐一款"这类纯咨询。
  function matchAutoBuy(text) {
    const t = String(text || "").trim();
    if (!t || t.length > 60) return null;
    // 「就你推荐的这款下单吧」是对既有推荐结果的确认（交给 buy_recommended 本地闭环），
    // 不是发起新的全权代买——对比都做完了再起一条链从头跑官方，观感翻车（真机反馈）
    if (/推荐[的得这那]/.test(t)) return null;
    if (!/(你看着|帮我|随便|你决定|你选)?\s*(选|挑|推荐|来)\s*(一款|一台|个|台)?.*(下单|买了?|购买|拿下)|直接下单吧|帮我搞定/.test(t)) return null;
    // 预算区间：「10000到20000」「1万-2万」按 min~max 双边过滤（之前只取上限，9999 的轻薄本
    // 混进"10000到20000 玩游戏"的候选，观感翻车）；单值仍按上限处理
    const rng = t.match(/(\d{3,6})\s*(?:元|块)?\s*[-~—到至]\s*(\d{3,6})/);
    let minPrice = 0, maxPrice = 0;
    if (rng) { minPrice = Math.min(Number(rng[1]), Number(rng[2])); maxPrice = Math.max(Number(rng[1]), Number(rng[2])); }
    else { const m = t.match(/(\d{3,6})\s*(元|块|以内|以下|左右)?/); maxPrice = m ? Number(m[1]) : 0; }
    return { chain: "auto_buy", params: { maxPrice: maxPrice, minPrice: minPrice, rawText: t } };
  }

  // 系列关键词提取（代买链官方超预算 fallback 用：补本地货盘时按系列词缩小范围，不带 q 就是不限系列）。
  // kw 是发给 /api/products?q= 的实际检索词，需匹配数据库商品名里的写法（中文用中文，英文系列保留常见大小写）。
  const SERIES_KEYWORDS = [
    { re: /拯救者|legion/i, kw: "拯救者" },
    { re: /thinkbook/i, kw: "ThinkBook" },
    { re: /thinkpad/i, kw: "ThinkPad" },
    { re: /小新/, kw: "小新" },
    { re: /yoga/i, kw: "YOGA" },
  ];
  // 场景关键词（没点名系列时的兜底缩圈）：kw 需匹配数据库商品名写法——游戏本商品名普遍含「游戏」
  const SCENE_KEYWORDS = [
    { re: /游戏|电竞|打机|吃鸡|3A/i, kw: "游戏" },
    { re: /轻薄|便携|出差|随身/, kw: "轻薄" },
  ];
  function extractSeriesKeyword(text) {
    const t = String(text || "");
    for (let i = 0; i < SERIES_KEYWORDS.length; i++) {
      if (SERIES_KEYWORDS[i].re.test(t)) return SERIES_KEYWORDS[i].kw;
    }
    for (let i = 0; i < SCENE_KEYWORDS.length; i++) {
      if (SCENE_KEYWORDS[i].re.test(t)) return SCENE_KEYWORDS[i].kw;
    }
    return "";
  }

  // 答后「猜你想干」动作 chips（主面板/全屏共用一份）：生成的句子必须能被 matchControl 本地接住，
  // 点击即执行零等待。LLM 咨询型追问异步补齐，不足 3 个用 FOLLOWUP_FALLBACKS 兜底。
  function actionChips(products) {
    const n = Math.min(Array.isArray(products) ? products.length : 0, 3);
    if (n >= 2) return ["对比第" + Array.from({ length: n }, (_, i) => i + 1).join("、") + "款", "打开第1款", "领取权益下单"];
    if (n === 1) return ["这款不错，下单吧"];
    return [];
  }
  const FOLLOWUP_FALLBACKS = ["现在下单有优惠吗", "线下门店能体验吗", "支持以旧换新吗"];

  // 代买句发给官方前剥掉成交短语（「直接购买/下单吧」会触发官方下单 Skill，只回「已为您生成
  // 订单」不给商品清单）。官方只负责推荐，下单由链自己执行。主面板/全屏共用一份。
  function stripPurchasePhrase(text) {
    const t = String(text || "").replace(/[，,。;；]?\s*(并且?|然后|再)?(帮我)?(挑|选|来|拿|搞定)?一?[款台个]?(比较)?(好的?|合适的?|适合我的)?[的]?[，,]?\s*(直接)?(下单|购买|买了?|拿下|搞定)吧?[!！。]?\s*$/, "").trim();
    return t + "。请推荐几款符合以上条件的商品。";
  }

  const api = { parseOrdinal: parseOrdinal, parseOrdinals: parseOrdinals, matchControl: matchControl, opNames: opNames, parseWantedCount: parseWantedCount, matchAutoBuy: matchAutoBuy, extractSeriesKeyword: extractSeriesKeyword, actionChips: actionChips, FOLLOWUP_FALLBACKS: FOLLOWUP_FALLBACKS, stripPurchasePhrase: stripPurchasePhrase };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // node 单测用
  if (root) {
    root.__lxIntent = api;
    // 兼容旧挂载名（历史代码引用）
    root.__lxParseOrdinal = parseOrdinal;
    root.__lxParseOrdinals = parseOrdinals;
  }
})(typeof window !== "undefined" ? window : null);

;


;/* public/leaip0/assets/frontend/js/core/app-conv.js */
// ── 乐享对话持久化模块（app.js 拆分第三步）──────────────────────────────────
// 保存/恢复主面板对话到 localStorage（lexiang.conversation.v1），供刷新与切站恢复。
// 该域闭包依赖重（state/ensureChat/addMessage/mdLite），采用工厂注入：
//   app.js 里 `window.__lxConvFactory({...deps})` 拿到 {save, saveNow, restore}。
// 加载顺序：必须在 app.js 之前（app.js 初始化时调工厂）。
// 注意：首页 lxfd 的 lxfdSyncToMainConvKey（app-lxfd.js）也直写同一 key，格式须保持一致。
(function (root) {
  "use strict";
  const LX_CONV_KEY = "lexiang.conversation.v1";
  const LX_NEW_CHAT_EMPTY_KEY = "lexiang.newChatEmpty.v1";

  function createConv(deps) {
    const getState = deps.getState;         // () => state（convId 读写）
    const ensureChat = deps.ensureChat;     // () => .lx-p0-messages 容器
    const addMessage = deps.addMessage;     // (role, text) 渲染用户气泡
    const lxEnsureAiBody = deps.lxEnsureAiBody;
    const mdLite = deps.mdLite;
    let saveTimer = null;

    // 立即写（不防抖）——桥接退全屏后可能马上切站，防抖 timer 会被页面卸载吞掉
    function doSave() {
      try {
        // 新建对话后的欢迎空态必须跨刷新保持；拒绝 pagehide 把旧 DOM 写回来。
        if (localStorage.getItem(LX_NEW_CHAT_EMPTY_KEY) === "1") {
          localStorage.removeItem(LX_CONV_KEY);
          return;
        }
        const listEl = document.querySelector(".chat-state .lx-p0-messages");
        if (!listEl) return;
        const messages = [];
        listEl.querySelectorAll(":scope > .lx-p0-message").forEach(function (el) {
          const isUser = el.classList.contains("user");
          // AI 消息：class 可能是 "ai" 或 "assistant"（下单成功等系统消息用 assistant），都算 AI
          const isAi = el.classList.contains("ai") || el.classList.contains("assistant");
          if (!isUser && !isAi) return;
          if (el._lxTransient || el.dataset.lxTransient === "1" || (el.querySelector(".lx-op-steps") && !el.querySelector(".lx-agent-chain-head"))) return; // 跳过临时进度卡,但agent多步卡(.lx-agent-chain-head)要存为执行记录
          // 跳过未完成的 loading 态 AI 消息，否则刷新后会卡在「生成中…」——但 _raw 已落地最终文本时例外：
          // lxAnimateAiFinal 打字动画会先塞 5s+「联想乐享正在生成中...」占位 DOM 才开始逐字显示，而
          // 下单成功/优惠领取等关键节点在 addMessage() 之后是立即同步调 saveNow()，此时动画根本没跑完、
          // DOM 还全是 loading 标记，但 _raw 早已是完整最终文本——只看 DOM 会把已确定内容整条误杀，
          // 这正是「立即存」在真机上仍然刷新即丢的根因（400ms 防抖只是另一层，两层都要治）。
          const _hasFinalRaw = isAi && typeof el._raw === "string" && el._raw.trim().length > 0;
          if (isAi && !_hasFinalRaw && (el.classList.contains("loading") || el.querySelector(".lx-generating, .loading-line, .typing-text"))) return;
          let html = isAi ? (el.querySelector(".ai-body")?.innerHTML || "") : "";
          const text = isUser ? (el.querySelector(".user-bubble")?.textContent || "").trim() : (el._raw || el.querySelector(".ai-body")?.textContent || "").trim();
          // 双保险：html 残留 loading 标记则丢弃，恢复时用 mdLite(text) 重渲染兜底（_raw 纯文本先保底，
          // 打字动画真正跑完后下一次 saveNow 会把带按钮的完整 html 补齐，不影响最终态）
          if (isAi && /正在生成中|lx-generating|loading-line|typing-text|typing-cursor/.test(html)) html = "";
          if (!text && !html) return;
          messages.push({ role: isUser ? "user" : "ai", text, html });
        });
        // 去掉末尾孤立用户提问（AI 没答完就存）——否则刷新后只剩一条没回答的提问
        while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
        if (!messages.length) return;
        localStorage.setItem(LX_CONV_KEY, JSON.stringify({
          convId: getState().convId || null,
          messages: messages.slice(-50),
          ts: Date.now()
        }));
      } catch (_e) { /* localStorage 写满等，静默 */ }
    }

    function save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(doSave, 400);
    }

    function saveNow() { clearTimeout(saveTimer); doSave(); }

    function restore() {
      try {
        if (localStorage.getItem(LX_NEW_CHAT_EMPTY_KEY) === "1") {
          localStorage.removeItem(LX_CONV_KEY);
          return;
        }
        const raw = localStorage.getItem(LX_CONV_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.messages) || !data.messages.length) return;
        if (data.ts && Date.now() - data.ts > 7 * 24 * 3600 * 1000) { localStorage.removeItem(LX_CONV_KEY); return; }
        const _msgs = data.messages.slice();
        if (!_msgs.length) { localStorage.removeItem(LX_CONV_KEY); return; }
        getState().convId = data.convId || getState().convId;
        const list = ensureChat();
        if (!list) return;
        list.innerHTML = "";
        // 顶部插「历史对话」分隔条，让用户明确这是上次的记录（而非当前出错）
        const _histDivider = document.createElement("div");
        _histDivider.className = "lx-conv-hist-divider";
        _histDivider.innerHTML = "<span>以上为历史对话</span>";
        _msgs.forEach(function (m) {
          if (m.role === "user") {
            addMessage("user", m.text || "");
          } else {
            // 注意：不含 lx-op-steps——那是 agent 多步链卡（.lx-agent-chain-head 同框）合法内容，
            // 会被 doSave 正常存档；这里若也判它「坏」会在恢复时被 mdLite(text) 拍平丢光结构。
            // 真正的临时进度卡（无 .lx-agent-chain-head）doSave 阶段就被过滤，根本不会存进来。
            const _badHtml = /正在生成中|正在处理|lx-generating|loading-line|typing-cursor|typing-text/.test(m.html || "");
            if (_badHtml && !m.text) return; // 坏 html 且无正文整条跳过
            if (!m.text && !m.html) return;
            const node = document.createElement("div");
            node.className = "lx-p0-message msg ai lx-chat-skin";
            node._raw = m.text || "";
            const body = lxEnsureAiBody(node);
            body.innerHTML = (_badHtml || !m.html) ? mdLite(m.text || "") : m.html;
            list.appendChild(node);
          }
        });
        if (list.children.length) list.appendChild(_histDivider); // 历史末尾加分隔，往下是新对话
        list.scrollTop = list.scrollHeight;
      } catch (_e) { /* 恢复失败静默，不影响首屏 */ }
    }

    return { save: save, saveNow: saveNow, restore: restore };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { createConv: createConv, LX_CONV_KEY: LX_CONV_KEY };
  if (root) root.__lxConvFactory = createConv;
})(typeof window !== "undefined" ? window : null);

;


;/* public/leaip0/assets/frontend/js/pages/smb/inline-13.js */
/* SMB 待开放快捷入口仅展示 hover；职场认证已开放并交由主业务运行时发送。 */
    (function () {
      function getSmbShortcut(event) {
        return event.target.closest?.(
          ".shortcut-row > .shortcut, " +
          ".shortcut-row > .more-wrap > .more-menu .menu-row"
        );
      }

      function getDisabledSmbShortcut(event) {
        var shortcut = getSmbShortcut(event);
        if (!shortcut) return null;

        /* “职场认证”必须继续冒泡到 app.js，由统一 sendChat 流程发送 query。 */
        if ((shortcut.textContent || "").trim() === "职场认证") return null;
        return shortcut;
      }

      document.addEventListener("click", function (event) {
        if (!getDisabledSmbShortcut(event)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);

      document.addEventListener("keydown", function (event) {
        if ((event.key !== "Enter" && event.key !== " ") || !getDisabledSmbShortcut(event)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    })();

;

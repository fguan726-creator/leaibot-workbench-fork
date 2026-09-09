(function registerComponentAssistantPreview() {
        function renderComponentAssistantPreview() {
          var previewMode = window.__LX_COMPONENT_ASSISTANT_PREVIEW || "";
          var isDefaultPreview = previewMode === "default" || window.location.hash === "#component-assistant-default";
          var isConversationPreview = previewMode === "conversation" || window.location.hash === "#component-assistant-conversation";
          if (!isDefaultPreview && !isConversationPreview) return;
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        window.scrollTo(0, 0);
        document.body.classList.add("component-assistant-preview");
        document.body.dataset.state = isDefaultPreview ? "default" : "chat";
        var shell = document.querySelector("body > .shell");
        var panel = document.querySelector("body > .shell > .assistant-panel");
        var content = document.querySelector("body > .shell > .content");
        var topbar = document.querySelector("body > .topbar");
        if (topbar) topbar.style.setProperty("display", "none", "important");
        if (content) content.style.setProperty("display", "none", "important");
        var previewWidth = isDefaultPreview ? 410 : 546;
        if (shell) {
          shell.style.setProperty("display", "block", "important");
          shell.style.setProperty("width", previewWidth + "px", "important");
          shell.style.setProperty("height", "100vh", "important");
          shell.style.setProperty("min-height", "100vh", "important");
          shell.style.setProperty("padding", "0", "important");
        }
        if (panel) {
          panel.style.setProperty("display", "block", "important");
          panel.style.setProperty("visibility", "visible", "important");
          panel.style.setProperty("opacity", "1", "important");
          panel.style.setProperty("width", previewWidth + "px", "important");
          panel.style.setProperty("height", "100vh", "important");
          panel.style.setProperty("min-height", "680px", "important");
          panel.style.setProperty("max-height", "none", "important");
        }
        var defaultState = document.querySelector(".assistant-panel .default-state");
        var chatState = document.querySelector(".assistant-panel .chat-state");
        var dots = document.querySelector(".assistant-panel .page-dots");
          if (!chatState) return;
        if (isDefaultPreview) {
          if (defaultState) defaultState.removeAttribute("hidden");
          chatState.innerHTML = "";
          chatState.setAttribute("hidden", "");
          if (dots) {
            dots.classList.add("is-empty");
            dots.innerHTML = "";
          }
          var defaultInput = document.querySelector(".assistant-panel .composer textarea");
          if (defaultInput) {
            defaultInput.value = "";
            defaultInput.placeholder = "推荐一款适合我的笔记本电脑";
            defaultInput.setAttribute("aria-label", "输入你的问题");
          }
          return;
        }
        if (defaultState) defaultState.setAttribute("hidden", "");
        chatState.removeAttribute("hidden");
        chatState.innerHTML = [
          '<div class="lx-p0-messages" aria-live="polite">',
            '<div class="lx-p0-message msg user"><div class="user-bubble">推荐一款适合办公的笔记本电脑</div></div>',
            '<div class="lx-p0-message msg ai lx-chat-skin loading"><div class="ai-body"><div class="loading-line"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div></div></div>',
            '<div class="lx-p0-message msg ai lx-chat-skin"><div class="ai-body">',
              '<p class="lx-detail-chat-copy lx-msg-text">根据你的办公需求，我建议优先关注轻薄便携、续航和多任务性能。下面这款兼顾日常办公、视频会议与移动使用。</p>',
              '<div class="lx-detail-chat-result"><button class="answer-cta lx-answer-reco" type="button" aria-label="查看推荐商品详情" aria-pressed="false">',
                '<span class="answer-cta-copy"><span class="answer-cta-title">YOGA Air 14c 2026</span><span class="answer-cta-desc">酷睿 Ultra 9｜32G｜2T｜2.8K OLED</span></span>',
                '<span class="answer-cta-icon" aria-hidden="true"><img src="../icons/global-next.svg" alt=""></span>',
              '</button></div>',
              '<div class="lx-preview-followups" aria-label="推荐追问">',
                '<button class="quick-item" type="button"><span>这款适合经常出差吗？</span><img class="arrow" src="../icons/global-next.svg" alt=""></button>',
                '<button class="quick-item" type="button"><span>对比同价位的 ThinkPad</span><img class="arrow" src="../icons/global-next.svg" alt=""></button>',
                '<button class="quick-item" type="button"><span>看看当前优惠</span><img class="arrow" src="../icons/global-next.svg" alt=""></button>',
              '</div>',
            '</div></div>',
          '</div>'
        ].join("");
          if (dots) {
          dots.classList.remove("is-empty");
          dots.innerHTML = '<i></i><i class="active"></i><div class="prompt-menu" role="menu"><div class="menu-row">推荐一款适合办公的笔记本电脑</div></div>';
          }
          var input = document.querySelector(".assistant-panel .composer textarea");
          if (input) {
            input.value = "想了解这款电脑的接口配置";
            input.setAttribute("aria-label", "继续追问");
          }
        }
        function schedulePreview() {
          window.requestAnimationFrame(function () {
            renderComponentAssistantPreview();
            window.setTimeout(function () {
              renderComponentAssistantPreview();
              window.scrollTo(0, 0);
            }, 80);
            window.setTimeout(function () {
              renderComponentAssistantPreview();
              window.scrollTo(0, 0);
            }, 320);
          });
        }
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", schedulePreview, { once: true });
        } else {
          schedulePreview();
        }
        window.addEventListener("hashchange", schedulePreview);
        window.addEventListener("message", function (event) {
          if (!event.data || event.data.type !== "component-assistant-resize") return;
          var width = Math.max(390, Math.min(720, Number(event.data.width) || 546));
          var shell = document.querySelector("body > .shell");
          var panel = document.querySelector("body > .shell > .assistant-panel");
          document.body.style.setProperty("--assistant-panel-width", width + "px");
          if (shell) shell.style.setProperty("width", width + "px", "important");
          if (panel) panel.style.setProperty("width", width + "px", "important");
        });
      })();

(function registerDeviceSceneHall() {
  var hall = document.querySelector(".device-scene-hall");
  if (!hall) return;

  var sceneProfiles = {
    personal: [
    {
      name: "电竞游戏",
      title: "沉浸竞技，性能全开",
      description: "从高帧竞技到沉浸娱乐，为你搭配流畅专注的游戏设备组合。",
      price: "11,820",
      product: "拯救者 Y9000P 2026",
      specs: "RTX 5060 · 2.5K 240Hz · 32GB",
      image: "/assets/img/game-scene.jpg",
      overlay: "linear-gradient(90deg,#101010 0%,rgba(77,20,74,.48) 44%,transparent 72%)",
      hotspotLeft: "76%",
      hotspotTop: "38%"
    },
    {
      name: "专业创作",
      title: "灵感迸发，创作全开",
      description: "从灵感创作到多任务渲染，为你搭配高效稳定的专业设备。",
      price: "8,999",
      product: "ThinkPad T14p 2026",
      specs: "酷睿 Ultra 9 · 32GB · 2TB · 2.8K OLED",
      image: "/assets/img/creation-scene.jpg",
      overlay: "linear-gradient(90deg,#101010 0%,rgba(77,20,74,.48) 44%,transparent 72%)",
      hotspotLeft: "72%",
      hotspotTop: "40%"
    },
    {
      name: "移动办公",
      title: "轻装随行，效率在线",
      description: "从移动办公到差旅协同，为你搭配轻薄持久的高效设备组合。",
      price: "1,299",
      product: "小新Pad Pro 12.7英寸",
      specs: "酷睿 Ultra 7 · 轻薄商务 · 长续航",
      image: "/assets/img/working-scene.jpg",
      overlay: "linear-gradient(90deg,rgba(12,35,66,.94) 0%,rgba(24,72,148,.78) 38%,rgba(73,126,214,.4) 68%,transparent 88%)",
      hotspotLeft: "74%",
      hotspotTop: "38%"
    }
    ],
    business: [
      {
        name: "高效办公",
        title: "高效办公 灵活成长",
        description: "助力中小企业构建高效智能办公体系",
        price: "11,799",
        product: "ThinkPad T14 2025",
        specs: "锐龙 AI 7 PRO · 32GB · 512GB",
        cards: [
          { title: "商务笔记本", product: "ThinkPad", image: "/assets/img/business/products/smb-thinkpad-t14.jpg" },
          { title: "固定工位", product: "ThinkBook", image: "/assets/img/business/products/smb-thinkbook.jpg" },
          { title: "办公保障", product: "ThinkCentre", image: "/assets/img/business/products/smb-thinkcentre.jpg" }
        ],
        image: "/assets/img/business/scenes/smb-scene-bg-1.jpg",
        overlay: "linear-gradient(90deg,rgba(24,7,33,.96) 0%,rgba(77,20,74,.58) 48%,transparent 78%)",
        hotspotLeft: "76%",
        hotspotTop: "38%"
      },
      {
        name: "移动差旅",
        title: "轻装随行，效率在线",
        description: "轻薄长续航让差旅办公高效无忧",
        price: "13,999",
        product: "ThinkPad X1 Carbon AI",
        specs: "酷睿 Ultra 7 · 轻薄商务 · 长续航",
        cards: [
          { title: "移动主机", product: "ThinkPad X", image: "/assets/img/business/products/smb-thinkpad-x.jpg" },
          { title: "随行供电", product: "充电宝", image: "/assets/img/business/products/smb-power-bank.jpg" },
          { title: "快速链接", product: "扩展坞", image: "/assets/img/business/products/smb-dock.jpg" }
        ],
        image: "/assets/img/business/scenes/smb-scene-bg-2.jpg",
        overlay: "linear-gradient(90deg,rgba(12,35,66,.94) 0%,rgba(24,72,148,.78) 42%,transparent 86%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "专业设计",
        title: "专业设计 创意高效",
        description: "稳定专业算力助力创意高效落地",
        price: "16,299",
        product: "ThinkPad P16s 2025",
        specs: "酷睿 Ultra 7 · 32GB · 1TB",
        cards: [
          { title: "移动工作站", product: "ThinkPad P系列", image: "/assets/img/business/products/smb-thinkpad-p.jpg" },
          { title: "桌面工作站", product: "ThinkStation", image: "/assets/img/business/products/smb-thinkstation.jpg" },
          { title: "专业显示", product: "ThinkVision", image: "/assets/img/business/products/smb-thinkvision.jpg" }
        ],
        image: "/assets/img/business/scenes/smb-scene-bg-3.jpg",
        overlay: "linear-gradient(90deg,rgba(24,7,33,.96) 0%,rgba(77,20,74,.55) 48%,transparent 78%)",
        hotspotLeft: "75%",
        hotspotTop: "40%"
      },
      {
        name: "会议协作",
        title: "会议协作 沟通无界",
        description: "智慧协作互联让企业沟通更高效",
        price: "16,299",
        product: "ThinkSmart 会议协作方案",
        specs: "智能会议 · 内容共享 · 远程协作",
        cards: [
          { title: "会议终端", product: "ThinkSmart", image: "/assets/img/business/products/smb-thinksmart.jpg" },
          { title: "内容显示", product: "ThinkVision", image: "/assets/img/business/products/smb-thinkvision.jpg" },
          { title: "音视频外设", product: "耳麦", image: "/assets/img/business/products/smb-headset.jpg" }
        ],
        image: "/assets/img/business/scenes/smb-scene-bg-4.jpg",
        overlay: "linear-gradient(90deg,rgba(24,7,33,.96) 0%,rgba(77,20,74,.55) 48%,transparent 78%)",
        hotspotLeft: "75%",
        hotspotTop: "40%"
      },
      {
        name: "成长型团队",
        title: "成长型团队 稳健扩展",
        description: "灵活扩展生产力陪伴成长型团队",
        price: "11,799",
        product: "ThinkPad T14 2025",
        specs: "锐龙 AI 7 PRO · 32GB · 512GB",
        cards: [
          { title: "团队笔记本", product: "ThinkBook", image: "/assets/img/business/products/smb-thinkbook.jpg" },
          { title: "商用台式机", product: "扬天", image: "/assets/img/business/products/smb-yangtian.jpg" },
          { title: "企业服务", product: "ThinkVision", image: "/assets/img/business/products/smb-thinkvision.jpg" }
        ],
        image: "/assets/img/business/scenes/smb-scene-bg-5.jpg",
        overlay: "linear-gradient(90deg,rgba(24,7,33,.96) 0%,rgba(77,20,74,.58) 48%,transparent 78%)",
        hotspotLeft: "76%",
        hotspotTop: "38%"
      }
    ],
    enterprise: [
      {
        name: "制造行业",
          title: "贯通研产 智链制造",
        description: "稳定算力底座支撑智能制造升级",
        price: "28,500",
        product: "ThinkStation P 系列工作站",
        specs: "专业算力 · 集中管理 · 安全可靠",
        image: "/assets/img/industry/produce-hero.webp",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.58) 48%,transparent 80%)",
        hotspotLeft: "76%",
        hotspotTop: "38%"
      },
      {
        name: "教育行业",
        title: "智慧教育 协同创新",
        description: "数字技术赋能教学科研协同创新",
        price: "30,299",
        product: "联想智慧教育解决方案",
        specs: "智慧教学 · 科研计算 · 校园管理",
        image: "/assets/img/enterprise-banner-2.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.58) 48%,transparent 80%)",
        hotspotLeft: "75%",
        hotspotTop: "40%"
      },
      {
        name: "政府行业",
        title: "数字政务 安全高效",
        description: "安全数字底座提升政务协同效能",
        price: "34,799",
        product: "联想数字政府解决方案",
        specs: "政务云 · 数据治理 · 统一运维",
        image: "/assets/img/anli3.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "医疗行业",
        title: "智慧医疗 稳健守护",
        description: "可靠数字能力守护智慧医疗运营",
        price: "34,799",
        product: "联想智慧医院解决方案",
        specs: "智慧诊疗 · 数据安全 · 高效运营",
        image: "/assets/img/fangan2.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "金融行业",
        title: "金融智算 安全敏捷",
        description: "安全弹性智算赋能金融业务创新",
        price: "34,799",
        product: "联想金融行业解决方案",
        specs: "核心业务 · 数据中心 · 智能应用",
        image: "/assets/img/fanan1.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "能源行业",
        title: "智慧能源 绿色发展",
        description: "数智赋能能源生产与绿色低碳转型",
        price: "34,799",
        product: "联想智慧能源解决方案",
        specs: "智能巡检 · 安全生产 · 绿色运营",
        image: "/assets/img/business-banner-2.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "交通行业",
        title: "智慧交通 畅行协同",
        description: "云智融合运营提升智慧交通效率",
        price: "34,799",
        product: "联想智慧交通解决方案",
        specs: "轨道交通 · 机场云 · 高速运营",
        image: "/assets/img/enterprise-banner-1.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      },
      {
        name: "服务行业",
        title: "智慧服务 体验升级",
        description: "智能连接服务场景提升客户体验",
        price: "34,799",
        product: "联想智慧服务解决方案",
        specs: "智慧门店 · 智能客服 · 供应链协同",
        image: "/assets/img/brand-20260626-2.jpg",
        overlay: "linear-gradient(90deg,rgba(18,7,28,.96) 0%,rgba(77,20,74,.62) 48%,transparent 82%)",
        hotspotLeft: "74%",
        hotspotTop: "38%"
      }
    ]
  };
  var profile = hall.dataset.sceneProfile || document.body.dataset.page || "personal";
  var scenes = sceneProfiles[profile] || sceneProfiles.personal;

  var currentIndex = 0;
  var title = hall.querySelector(".device-scene-copy h2");
  var industryTag = hall.querySelector("[data-device-scene-industry]");
  var description = hall.querySelector("[data-device-scene-desc]");
  var price = hall.querySelector("[data-device-scene-price]");
  var hotspot = hall.querySelector(".device-scene-hotspot");
  var product = hall.querySelector(".device-scene-product-popover strong");
  var specs = hall.querySelector(".device-scene-product-popover > span");
  var currentLabel = hall.querySelector(".device-scene-current");
  var sceneAction = hall.querySelector(".device-scene-buy");
  var sceneCount = hall.querySelector(".device-scene-count");
  var picker = hall.querySelector(".device-scene-picker");
  var menuButtons = hall.querySelectorAll("[data-device-scene]");
  var recommendationCards = hall.querySelectorAll(".enterprise-scene-card");
  var hotspotPreviewTimer = 0;

  function previewHotspot() {
    if (!hotspot) return;
    window.clearTimeout(hotspotPreviewTimer);
    hotspot.classList.remove("is-auto-open");
    void hotspot.offsetWidth;
    hotspot.classList.add("is-auto-open");
    hotspotPreviewTimer = window.setTimeout(function () {
      hotspot.classList.remove("is-auto-open");
    }, 2000);
  }

  function renderScene(index) {
    currentIndex = (index + scenes.length) % scenes.length;
    var scene = scenes[currentIndex];
    title.textContent = scene.title;
    if (industryTag) industryTag.textContent = scene.name;
    description.textContent = scene.description;
    if (price) price.textContent = scene.price;
    if (product) product.textContent = scene.product;
    if (specs) specs.textContent = scene.specs;
    currentLabel.textContent = "当前: " + scene.name;
    if (sceneAction) sceneAction.textContent = "咨询" + scene.name + "解决方案";
    sceneCount.textContent = (currentIndex + 1) + "/" + scenes.length;
    if (profile === "enterprise" && window.__lxEnterpriseBanner) {
      var entry = window.__lxEnterpriseBanner.find(function(item) { return item.sector + "行业" === scene.name; });
      if (entry) recommendationCards.forEach(function(card, cardIndex) {
        card.removeAttribute("data-brand-ask");
        card.removeAttribute("data-open-product");
        card.dataset.enterpriseBannerIndex = String(currentIndex);
        card.dataset.enterpriseBannerAction = cardIndex === 0 ? "solution" : cardIndex === 1 ? "whitepaper" : "product";
        if (cardIndex < 2) {
          card.querySelector("strong").textContent = cardIndex === 0 ? entry.solution : entry.paper;
          card.querySelector(".enterprise-scene-card-label").textContent = cardIndex === 0 ? "解决方案讲解" : "白皮书解读";
          var img = card.querySelector("img");
          img.src = new URL("/img/solution/" + (cardIndex === 1 && entry.sector === "制造" ? "联想绿色制造解决方案.jpg" : entry.image), document.baseURI).href;
          img.alt = cardIndex === 0 ? entry.solution : entry.paper;
        } else {
          card.dataset.openProduct = cardIndex === 2 ? "1047099" : "1049138";
        }
      });
    }
    if (scene.cards && recommendationCards.length) {
      recommendationCards.forEach(function (card, cardIndex) {
        var cardData = scene.cards[cardIndex];
        if (!cardData) return;
        var cardTitleText = typeof cardData === "string" ? cardData : cardData.title;
        var cardProductText = typeof cardData === "string" ? "" : cardData.product;
        var cardTitle = card.querySelector("strong");
        var cardLabel = card.querySelector(".enterprise-scene-card-label");
        var cardProduct = card.querySelector(".enterprise-scene-card-product");
        var cardImage = card.querySelector("img");
        if (cardTitle) cardTitle.textContent = cardTitleText;
        if (!cardProduct && cardTitle) {
          cardProduct = document.createElement("span");
          cardProduct.className = "enterprise-scene-card-product";
          cardTitle.insertAdjacentElement("afterend", cardProduct);
        }
        if (cardProduct) cardProduct.textContent = cardProductText;
        if (cardLabel) cardLabel.textContent = "了解详情";
        if (cardImage) {
          cardImage.alt = cardProductText || cardTitleText;
          if (typeof cardData !== "string" && cardData.image) cardImage.src = new URL(cardData.image, document.baseURI).href;
        }
        card.dataset.brandAsk = "介绍" + scene.name + "场景的" + cardTitleText + " " + cardProductText;
      });
      var cardsRegion = hall.querySelector(".enterprise-scene-cards");
      if (cardsRegion) cardsRegion.setAttribute("aria-label", scene.name + "推荐内容");
    }
    if (hotspot) {
      hotspot.setAttribute("aria-label", "查看" + scene.product + "商品信息");
      hotspot.style.left = scene.hotspotLeft;
      hotspot.style.top = scene.hotspotTop;
    }
    hall.style.backgroundImage = 'url("' + new URL(scene.image, document.baseURI).href + '")';
    hall.style.setProperty("--device-scene-overlay", scene.overlay);
    menuButtons.forEach(function (button) {
      button.classList.toggle("is-active", Number(button.dataset.deviceScene) === currentIndex);
    });
    previewHotspot();
  }

  var sceneTransitionTimer = 0;
  var sceneTransitionCleanupTimer = 0;
  var sceneTransitioning = false;

  function transitionScene(index, direction) {
    var nextIndex = (index + scenes.length) % scenes.length;
    if (nextIndex === currentIndex || sceneTransitioning) return;
    sceneTransitioning = true;
    hall.dataset.sceneDirection = direction;
    hall.classList.remove("is-scene-entering");
    hall.classList.add("is-scene-leaving");
    window.clearTimeout(sceneTransitionTimer);
    window.clearTimeout(sceneTransitionCleanupTimer);
    sceneTransitionTimer = window.setTimeout(function () {
      renderScene(nextIndex);
      hall.classList.remove("is-scene-leaving");
      hall.classList.add("is-scene-entering");
      sceneTransitionCleanupTimer = window.setTimeout(function () {
        hall.classList.remove("is-scene-entering");
        hall.removeAttribute("data-scene-direction");
        sceneTransitioning = false;
      }, 340);
    }, 140);
  }

  hall.querySelector(".device-scene-prev").addEventListener("click", function () {
    transitionScene(currentIndex - 1, "prev");
  });
  hall.querySelector(".device-scene-next").addEventListener("click", function () {
    transitionScene(currentIndex + 1, "next");
  });
  menuButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var nextIndex = Number(button.dataset.deviceScene);
      transitionScene(nextIndex, nextIndex < currentIndex ? "prev" : "next");
      picker.removeAttribute("open");
    });
  });
  document.addEventListener("click", function (event) {
    if (picker.hasAttribute("open") && !picker.contains(event.target)) {
      picker.removeAttribute("open");
    }
  });
  picker.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && picker.hasAttribute("open")) {
      picker.removeAttribute("open");
      picker.querySelector("summary").focus();
    }
  });
  // Enterprise banner uses the existing industry query and result generation pipeline.
  if (profile === "enterprise") recommendationCards.forEach(function(card) {
    card.addEventListener("click", function(event) {
      var action = card.dataset.enterpriseBannerAction;
      if (action === "product") return;
      var entry = window.__lxEnterpriseBanner[Number(card.dataset.enterpriseBannerIndex)];
      if (!entry) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (action === "solution") window.__lxAgentAPI.openSolution({title:entry.solution, industry:entry.industry, sector:entry.sector, scenario:"核心场景", intro:entry.intro, image:entry.image});
      else if (action === "whitepaper") window.__lxBridge.sendChat(entry.query);
    }, true);
  });
  if (profile === "enterprise" && sceneAction) {
    sceneAction.addEventListener("click", function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.__lxBridge?.sendChat(scenes[currentIndex].name + "解决方案");
    }, true);
  }
  renderScene(0);
})();

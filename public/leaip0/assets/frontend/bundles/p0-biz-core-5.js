
;/* public/leaip0/assets/frontend/js/core/solution-result.tabs-v120.js */
/* Shared solution-result interactions for home and every channel page. */
(function(){
  "use strict";
  if(window.__lxSolutionResultBound)return;
  window.__lxSolutionResultBound=true;
  document.addEventListener("click",function(event){
    var button=event.target.closest&&event.target.closest("[data-solution-filter]");
    if(!button)return;
    var root=button.closest(".lx-solution-center-page");
    if(!root)return;
    root.querySelectorAll("[data-solution-filter]").forEach(function(item){var selected=item===button;item.classList.toggle("active",selected);item.setAttribute("aria-pressed",selected?"true":"false")});
    var key=button.getAttribute("data-solution-filter");
    root.dataset.solutionSelected=key;
    root.querySelectorAll(".lx-solution-floor").forEach(function(floor){
      floor.style.display=key==="all"||floor.getAttribute("data-solution-industry")===key?"":"none";
    });
    var heading=root.closest(".info-page")?.querySelector(".reco-head h2");
    if(heading)heading.textContent=key==="all"?"全部解决方案":key+"行业解决方案";
    var state=window.__lxState;
    var tab=state?.tabs?.find(function(item){return item.id===state.activeTabId;});
    if(tab && /^info:solution(?::|-industry:)/.test(tab.id) || tab?.id==="info:solution"){
      tab.html=root.outerHTML;
      try{window.__lxSaveConversationNow?.();}catch(_){}
    }
    root.scrollIntoView({behavior:"smooth",block:"start"});
  });
  document.addEventListener("click",function(event){
    var button=event.target.closest&&event.target.closest("[data-solution-shuffle]");
    if(!button)return;
    var floor=button.closest(".lx-solution-floor");var grid=floor&&floor.querySelector(".lx-floor-body");
    if(!grid||grid.children.length<2)return;
    button.classList.remove("is-spinning");void button.offsetWidth;button.classList.add("is-spinning");grid.appendChild(grid.firstElementChild);
    window.setTimeout(function(){button.classList.remove("is-spinning")},500);
  });
  /* Product/solution-card dwell assistance is temporarily disabled site-wide. */
  document.querySelectorAll(".ai-arrow,.lx-template-smart-cursor").forEach(function(node){node.remove()});
  document.body.classList.remove("cursor-awake");
  document.querySelector(".assistant-bottom")?.classList.remove("has-hover-prompts");
  document.querySelector(".assistant-panel")?.classList.remove("assistant-hover-active","assistant-glass-active");
  var promptList=document.querySelector("[data-hover-prompt-list]");if(promptList)promptList.innerHTML="";
  return;
  var cursor=document.querySelector(".lx-template-smart-cursor");
  if(!cursor){cursor=document.createElement("div");cursor.className="lx-template-smart-cursor";cursor.setAttribute("aria-hidden","true");cursor.innerHTML='<img src="../icons/smart-cursor.svg" alt=""><span class="lx-template-smart-cursor-label"><img src="../img/lx-icon-0016.png" alt="">乐享正在帮你</span>';document.body.appendChild(cursor)}
  var activeCard=null,dwellTimer=0,closeTimer=0;
  function esc(value){return String(value||"").replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]})}
  function data(card){return{name:card.dataset.solutionTitle||card.querySelector("strong")?.textContent?.trim()||"这项联想解决方案",sector:card.dataset.solutionSector||card.querySelector(".lx-solution-card-tags small")?.textContent?.trim()||"行业方案",scenario:card.dataset.solutionScenario||"核心业务场景",summary:card.dataset.solutionIntro||card.querySelector(":scope > span")?.textContent?.trim()||"联想行业解决方案",image:card.dataset.solutionImage?"../img/solution/"+card.dataset.solutionImage:card.querySelector(".lx-solution-card-image")?.getAttribute("src")||""}}
  function hide(){document.querySelector(".assistant-bottom")?.classList.remove("has-hover-prompts");document.querySelector(".assistant-panel")?.classList.remove("assistant-hover-active");var list=document.querySelector("[data-hover-prompt-list]");if(list)list.innerHTML=""}
  function show(card){if(card!==activeCard)return;if(window.__lxState?.sending||document.body.classList.contains("lx-agent-generating")){hide();return}var bottom=document.querySelector(".assistant-bottom"),panel=document.querySelector(".assistant-panel"),list=document.querySelector("[data-hover-prompt-list]");if(!bottom||!panel||!list)return;var s=data(card),short=s.name.replace(/^联想\s*/i,"").slice(0,14),asks=[s.sector+"方案该如何选择？",short+"适合哪些场景？",short+"详细解读"],thumb=s.image?'<img src="'+esc(s.image)+'" alt="'+esc(s.name)+'">':"<i></i>";list.innerHTML='<div class="pop"><div class="box"><button class="pop-close hover-prompt-close" type="button" aria-label="关闭方案推荐问题">×</button><div class="ctx"><div class="thumb">'+thumb+'</div><div class="ci"><div class="nm">'+esc(s.name)+'</div><div class="pr">'+esc(s.sector+" · "+s.scenario)+'</div></div><span class="badge"><img src="../icons/global-sparkle.svg" alt="">你在看</span></div><div class="body"><div class="sum">'+esc(s.summary)+'，乐享可以继续帮你分析方案能力、适用场景和落地方式。</div><div class="divider"><span>乐享建议你问问</span></div><div class="acts">'+asks.map(function(t){return'<button class="act" type="button" data-hover-prompt="'+esc(t)+'"><span class="ic"><img src="../icons/global-sparkle.svg" alt=""></span><span>'+esc(t)+'</span><span class="ar">›</span></button>'}).join("")+'</div></div></div></div>';bottom.classList.add("has-hover-prompts");panel.classList.add("assistant-hover-active")}
  function arm(card){window.clearTimeout(dwellTimer);activeCard=card;cursor.classList.remove("is-helping");dwellTimer=window.setTimeout(function(){if(activeCard===card&&card.isConnected&&card.matches(":hover")){cursor.classList.add("is-helping");show(card)}},3000)}
  document.addEventListener("pointermove",function(event){if(event.pointerType&&event.pointerType!=="mouse"&&event.pointerType!=="pen")return;var productCard=event.target.closest?.(".content .product-card,.content .lx-floor-product-card,.content [data-floor-product],.content .lx-floor-product,.content .lx-sim-card,.content .lx-p0-product-mini,.content .reco-row,.content .lx-edu-card");if(productCard)return;var card=event.target.closest?.(".lx-pick-btn")?null:event.target.closest?.(".content .lx-solution-card");cursor.style.transform="translate3d("+(event.clientX+2)+"px,"+(event.clientY+2)+"px,0)";if(!card){cursor.classList.remove("is-visible","is-helping");window.clearTimeout(dwellTimer);if(activeCard){activeCard=null;window.clearTimeout(closeTimer);closeTimer=window.setTimeout(hide,4000)}return}window.clearTimeout(closeTimer);cursor.classList.add("is-visible");if(card!==activeCard)arm(card)},true);
  document.addEventListener("pointerleave",function(){cursor.classList.remove("is-visible","is-helping");window.clearTimeout(dwellTimer);activeCard=null});
  document.addEventListener("click",function(event){if(event.target.closest?.(".hover-prompt-close"))hide()},true);
})();

;(function(){
  function sync(){
    var root=document.querySelector(".info-page .lx-solution-center-page");
    if(!root||!root.querySelector(".lx-solution-tabs"))return;
    if(!root.hasAttribute("data-solution-selected")){
      var id=window.__lxState?.activeTabId||"";
      if(id==="info:solution"||id.startsWith("info:solution-industry:"))window.__lxOpenFeature?.(id.slice(5));
      return;
    }
    var key=root.dataset.solutionSelected,heading=root.closest(".info-page")?.querySelector(".reco-head h2");
    var text=key==="all"?"全部解决方案":key+"行业解决方案";
    if(heading&&heading.textContent!==text)heading.textContent=text;
  }
  sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
})();

;


;/* public/leaip0/assets/frontend/js/core/split-frame-composer-sync.js */
(function () {
  function syncComposer(composer) {
    var textarea = composer.querySelector("textarea");
    var send = composer.querySelector(".send-btn");
    if (!textarea || !send) return;

    send.style.setProperty("transform", "none", "important");
    send.style.setProperty("scale", "1", "important");
    send.style.setProperty("transition", "opacity .2s ease", "important");
    var sendIcon = send.querySelector(".icon");
    if (sendIcon) {
      sendIcon.style.setProperty("transform", "none", "important");
      sendIcon.style.setProperty("scale", "1", "important");
      sendIcon.style.setProperty("transition", "opacity .2s ease", "important");
    }

    function update() {
      send.disabled = !textarea.value.trim();
      textarea.style.height = "auto";
      var contentHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(Math.max(contentHeight, 21), 90) + "px";
      textarea.style.overflowY = contentHeight > 90 ? "auto" : "hidden";
    }

    textarea.addEventListener("input", update);
    update();
  }

  function syncMoreArrow(wrap) {
    var button = wrap.querySelector(":scope > .shortcut");
    var arrow = button && button.querySelector(".icon");
    if (!button || !arrow) return;

    arrow.style.setProperty("transition", "transform .2s ease", "important");
    arrow.style.setProperty("transform-origin", "50% 50%", "important");

    function setExpanded(expanded) {
      wrap.classList.toggle("sync-arrow-open", expanded);
      arrow.style.setProperty("transform", expanded ? "rotate(180deg)" : "rotate(0deg)", "important");
    }

    wrap.addEventListener("mouseenter", function () { setExpanded(true); });
    wrap.addEventListener("mouseleave", function () {
      setExpanded(wrap.classList.contains("open") || button.getAttribute("aria-expanded") === "true");
    });
    wrap.addEventListener("focusin", function () { setExpanded(true); });
    wrap.addEventListener("focusout", function (event) {
      if (!wrap.contains(event.relatedTarget)) setExpanded(wrap.classList.contains("open") || button.getAttribute("aria-expanded") === "true");
    });
    button.addEventListener("click", function () {
      setTimeout(function () {
        setExpanded(wrap.classList.contains("open") || button.getAttribute("aria-expanded") === "true");
      }, 0);
    });
    setExpanded(false);
  }

  document.querySelectorAll(".assistant-bottom .composer").forEach(syncComposer);
  document.querySelectorAll(".assistant-bottom .more-wrap").forEach(syncMoreArrow);
})();

;


;/* public/leaip0/assets/frontend/js/pages/shop/inline-22.biz-details-v122.js */
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

;


;/* public/leaip0/assets/components/biz-hero-reference-v1/carousel.js */
(function () {
  'use strict';
  function initChannelCarousel() {
    var page = document.body && document.body.dataset.page;
    if (page !== 'enterprise') return;
    var hall = document.querySelector('.content > .device-scene-hall');
    if (!hall || hall.dataset.unifiedCarouselReady === 'true') return;
    var sceneButtons = Array.from(hall.querySelectorAll('[data-device-scene]'));
    var previous = hall.querySelector('.device-scene-prev');
    var next = hall.querySelector('.device-scene-next');
    if (!sceneButtons.length || !previous || !next) return;
    hall.dataset.unifiedCarouselReady = 'true';

    var copy = hall.querySelector('.device-scene-copy');
    var productSource = hall.querySelector('.device-scene-product-popover strong');
    var description = hall.querySelector('[data-device-scene-desc]');
    var productLine = copy && copy.querySelector('.device-scene-product-name');
    if (copy && !productLine) {
      productLine = document.createElement('p');
      productLine.className = 'device-scene-product-name';
      copy.insertBefore(productLine, copy.querySelector('h2'));
    }
    var richerDescriptions = {
      '高效办公': '从日常协作到多任务处理，以稳定性能与灵活部署支撑团队高效运转。',
      '移动差旅': '兼顾轻薄、续航与可靠连接，让外出拜访、异地协作和移动办公更从容。',
      '专业设计': '以专业算力、稳定输出与高素质显示，加速设计、建模和创意交付。',
      '会议协作': '从智能会议到内容共享，打通远程沟通与团队协作的每个环节。',
      '成长型团队': '设备与服务按需扩展，帮助成长型团队降低管理压力、稳步提升生产力。',
      '制造行业': '以稳定算力、集中管理与可靠服务，贯通研发、生产和运营关键环节。',
      '教育行业': '覆盖智慧教学、科研计算与校园管理，让数字能力更好服务教育创新。',
      '政府行业': '构建安全可信、统一高效的数字底座，提升跨部门政务协同与服务效率。',
      '医疗行业': '以可靠终端、数据安全和智慧诊疗能力，支撑医疗业务稳定运行。',
      '金融行业': '兼顾核心业务安全、弹性智算与敏捷创新，服务金融场景持续升级。',
      '能源行业': '连接智能巡检、安全生产与绿色运营，助力能源体系低碳高效转型。',
      '交通行业': '贯通轨道、机场与高速运营数据，让交通管理和出行服务更加协同。',
      '服务行业': '从智慧门店到智能客服与供应链协同，持续提升服务效率和客户体验。'
    };
    var sceneProducts = {
      '高效办公': 'ThinkPad T14 2025',
      '移动差旅': 'ThinkPad X1 Carbon AI',
      '专业设计': 'ThinkPad P16s 2025',
      '会议协作': 'ThinkSmart 会议协作方案',
      '成长型团队': 'ThinkPad T14 2025',
      '制造行业': 'ThinkStation P 系列工作站',
      '教育行业': '联想智慧教育解决方案',
      '政府行业': '联想数字政府解决方案',
      '医疗行业': '联想智慧医院解决方案',
      '金融行业': '联想金融行业解决方案',
      '能源行业': '联想智慧能源解决方案',
      '交通行业': '联想智慧交通解决方案',
      '服务行业': '联想智慧服务解决方案'
    };

    var pagination = document.createElement('div');
    pagination.className = 'device-scene-pagination';
    pagination.setAttribute('role', 'tablist');
    pagination.setAttribute('aria-label', '场景轮播进度');
    var dots = sceneButtons.map(function (sceneButton, index) {
      var sceneName = (sceneButton.textContent || ('场景' + (index + 1))).trim();
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'device-scene-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', '切换到' + sceneName);
      var label = document.createElement('span');
      label.className = 'device-scene-label';
      label.textContent = sceneName;
      dot.appendChild(label);
      dot.addEventListener('click', function () {
        sceneButton.click();
        restartAfterSceneChange();
      });
      pagination.appendChild(dot);
      return dot;
    });
    hall.appendChild(pagination);

    var lastIndex = -1;
    var timer = 0;
    var settleTimer = 0;
    var autoplayDuration = 6500;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function activeIndex() {
      var index = sceneButtons.findIndex(function (button) { return button.classList.contains('is-active'); });
      return index < 0 ? 0 : index;
    }
    function syncDots(force) {
      var index = activeIndex();
      if (!force && index === lastIndex) return;
      lastIndex = index;
      dots.forEach(function (dot) {
        dot.classList.remove('is-active');
        dot.setAttribute('aria-selected', 'false');
        dot.removeAttribute('aria-current');
      });
      void pagination.offsetWidth;
      dots[index].classList.add('is-active');
      dots[index].setAttribute('aria-selected', 'true');
      dots[index].setAttribute('aria-current', 'true');
      var sceneName = (sceneButtons[index].textContent || '').trim();
      if (productLine) productLine.textContent = sceneProducts[sceneName] || (productSource && productSource.textContent.trim()) || '';
      if (description && richerDescriptions[sceneName]) description.textContent = richerDescriptions[sceneName];
    }
    function pause() {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
      timer = 0;
      settleTimer = 0;
      hall.classList.add('is-carousel-paused');
    }
    function start(forceReset) {
      if (timer && !forceReset) {
        hall.classList.remove('is-carousel-paused');
        return;
      }
      window.clearTimeout(timer);
      timer = 0;
      hall.classList.remove('is-carousel-paused');
      syncDots(true);
      if (!reducedMotion) timer = window.setTimeout(function () {
        timer = 0;
        next.click();
      }, autoplayDuration);
    }
    function restartAfterSceneChange() {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
      timer = 0;
      settleTimer = window.setTimeout(function () {
        settleTimer = 0;
        start(true);
      }, 170);
    }

    previous.addEventListener('click', function () {
      restartAfterSceneChange();
    });
    next.addEventListener('click', function () {
      restartAfterSceneChange();
    });
    var observer = new MutationObserver(function () { syncDots(false); });
    sceneButtons.forEach(function (button) {
      observer.observe(button, { attributes:true, attributeFilter:['class'] });
    });
    hall.addEventListener('mouseenter', pause);
    hall.addEventListener('mouseleave', function () { start(false); });
    hall.addEventListener('focusin', pause);
    hall.addEventListener('focusout', function (event) {
      if (!hall.contains(event.relatedTarget)) start(false);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else start(false);
    });
    syncDots(true);
    start(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChannelCarousel, {once:true});
  else initChannelCarousel();
})();

;

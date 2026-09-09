
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

(function () {
  "use strict";

  function reviewMarkup() {
    return '<section class="detail-reviews-section lx-review-b lx-review-tab-content" aria-label="商品评价">' +
      '<div class="detail-reviews-header"><h3 class="detail-reviews-title">商品评价</h3><p class="detail-reviews-note">由联想乐享 AI 总结的核心产品评价 · 仅供参考</p></div>' +
      '<div class="detail-review-ai-banner"><div class="detail-review-ai-inner">' +
        '<div class="detail-review-ai-badge"><div class="detail-review-ai-pill"><span class="detail-review-ai-dot"></span><span>乐享 AI 总结</span></div><span class="detail-review-ai-note">智能摘要 · 仅供参考</span></div>' +
        '<p class="detail-review-ai-text">大多数用户认为这款商品<span class="highlight">屏幕素质高、性能稳定、做工精致</span>，适合日常办公与移动使用；实际体验会因具体配置和使用场景而有所不同。</p>' +
        '<div class="detail-review-ai-tags" aria-label="评价标签"><span>屏幕素质高</span><span>性能稳定</span><span>做工精致</span><span>办公流畅</span></div>' +
      '</div></div>' +
      '<div class="detail-review-rating-wrap"><div class="detail-review-rating-card" aria-label="综合评分 4.9 分">' +
        '<div class="detail-review-rating-score"><strong>4.9</strong><span>/ 5 综合评分</span></div>' +
        '<div class="detail-review-rating-bars" aria-hidden="true">' +
          '<div class="detail-review-rating-row"><span>5★</span><i><b style="width:76%"></b></i><em>76%</em></div>' +
          '<div class="detail-review-rating-row"><span>4★</span><i><b style="width:18%"></b></i><em>18%</em></div>' +
          '<div class="detail-review-rating-row"><span>3★</span><i><b style="width:4%"></b></i><em>4%</em></div>' +
          '<div class="detail-review-rating-row"><span>2★</span><i><b style="width:1%"></b></i><em>1%</em></div>' +
          '<div class="detail-review-rating-row"><span>1★</span><i><b style="width:1%"></b></i><em>1%</em></div>' +
        '</div></div></div>' +
      '<div class="detail-review-grid lx-review-tab-grid">' +
        '<article class="detail-review-card"><strong class="detail-review-card-title">办公体验顺滑</strong><p class="detail-review-card-content">日常办公、网页多开和视频会议运行稳定，应用启动和多任务切换都比较流畅。</p><div class="detail-review-card-tags"><span>性能稳定</span><span>办公流畅</span></div><div class="detail-review-card-foot"><span>用户_李***8</span><span>42 人认为有用</span></div></article>' +
        '<article class="detail-review-card"><strong class="detail-review-card-title">外观和质感不错</strong><p class="detail-review-card-content">机身做工扎实，屏幕显示细腻，轻薄设计适合通勤和移动办公。</p><div class="detail-review-card-tags"><span>做工精致</span><span>屏幕好</span></div><div class="detail-review-card-foot"><span>用户_王***5</span><span>28 人认为有用</span></div></article>' +
        '<article class="detail-review-card"><strong class="detail-review-card-title">官方服务放心</strong><p class="detail-review-card-content">配置与价格说明清楚，购买流程顺畅，官方售后保障信息完整。</p><div class="detail-review-card-tags"><span>服务好</span><span>沟通清楚</span></div><div class="detail-review-card-foot"><span>用户_周***2</span><span>19 人认为有用</span></div></article>' +
      '</div></section>';
  }

  function ensureReviewTab() {
    document.querySelectorAll(".product-detail .detail-rich").forEach(function (rich) {
      var bar = rich.querySelector(".detail-tabbar");
      if (!bar) return;
      if (!bar.querySelector('[data-detail-tab="reviews"]')) {
        var tab = document.createElement("button");
        tab.className = "detail-tab";
        tab.type = "button";
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", "false");
        tab.setAttribute("data-detail-tab", "reviews");
        tab.textContent = "商品评价";
        bar.appendChild(tab);
      }
      if (!rich.querySelector('[data-detail-pane="reviews"]')) {
        var pane = document.createElement("section");
        pane.className = "detail-panel detail-tab-pane lx-review-tab-pane";
        pane.setAttribute("role", "tabpanel");
        pane.setAttribute("data-detail-pane", "reviews");
        pane.innerHTML = "";
        pane.setAttribute("aria-label", "商品评价空白面板");
        rich.appendChild(pane);
      }
    });
  }

  function activate(tab) {
    var rich = tab.closest(".detail-rich");
    if (!rich) return;
    var target = tab.getAttribute("data-detail-tab");
    rich.querySelectorAll(".detail-tab").forEach(function (item) {
      var active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });
    rich.querySelectorAll(".detail-tab-pane").forEach(function (pane) {
      pane.classList.toggle("is-active", pane.getAttribute("data-detail-pane") === target);
    });
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest && event.target.closest(".product-detail .detail-tab");
    if (!tab) return;
    window.requestAnimationFrame(function () { activate(tab); });
  });
  document.addEventListener("lx:product-detail-rendered", ensureReviewTab);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureReviewTab, { once: true });
  else ensureReviewTab();
})();

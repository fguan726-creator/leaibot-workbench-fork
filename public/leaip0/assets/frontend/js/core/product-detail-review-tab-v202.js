(function () {
  "use strict";

  function reviewMarkup() {
    var reviews = [
      ["lenovo161508778", "2026-09-03 22:35", "上手体验很好，性能强、屏幕清晰，日常办公和多任务切换都很流畅，整机表现超出预期。", ["/assets/img/shop-1.jpg", "/assets/img/shop-2.jpg", "/assets/img/shop-3.jpg"]],
      ["lenovo161822155", "2026-09-03 21:44", "电脑运行流畅，屏幕观感细腻，机身质感和便携性都不错，整体非常满意。", ["/assets/img/shop-4.jpg", "/assets/img/shop-5.jpg", "/assets/img/shop-6.jpg"]],
      ["lenovo80651593", "2026-09-03 18:19", "轻薄机身的性能释放很稳，应用启动快，散热和噪声控制符合预期，适合日常办公使用。", ["/assets/img/shop-7.jpg", "/assets/img/shop-8.jpg"]],
      ["lenovo161817808", "2026-09-03 18:18", "运行速度快，多窗口处理没有明显卡顿，键盘手感也比较舒适。", ["/assets/img/shop-2.jpg", "/assets/img/shop-5.jpg", "/assets/img/shop-8.jpg"]]
    ];
    return '<section class="lx-market-reviews" aria-label="商品评价列表">' +
      '<header class="lx-market-review-summary">' +
        '<div class="lx-market-satisfaction"><span>商品满意度</span><strong>100%</strong></div>' +
        '<div class="lx-market-review-tools"><div class="lx-market-filter-row" role="group" aria-label="评价筛选">' +
          '<button class="is-active" type="button" data-review-market-filter="all">全部(262)</button>' +
          '<button type="button" data-review-market-filter="good">好评(262)</button>' +
          '<button type="button" data-review-market-filter="media">有图/视频(90)</button>' +
          '<button type="button" data-review-market-filter="follow">追评(10)</button>' +
          '<label class="lx-market-only"><input type="checkbox" data-review-market-only><span>只看此商品</span></label>' +
        '</div><div class="lx-market-impressions"><span>买家印象：</span>' +
          '<button type="button">稳定流畅(43)</button><button type="button">性能强劲(28)</button><button type="button">运行超快(20)</button><button type="button">画质清晰(17)</button><button type="button">外观漂亮(7)</button><button type="button">方便快捷(3)</button>' +
        '</div></div>' +
      '</header>' +
      '<div class="lx-market-review-list">' + reviews.map(function (review) {
        return '<article class="lx-market-review-item">' +
          '<aside class="lx-market-review-user"><strong>' + review[0] + '</strong><span class="lx-market-stars" aria-label="5 星评价">★★★★★</span><time>' + review[1] + '</time></aside>' +
          '<div class="lx-market-review-body"><p>' + review[2] + '</p><div class="lx-market-review-media">' + review[3].map(function (src, index) { return '<button type="button" aria-label="查看评价图片 ' + (index + 1) + '"><img src="' + src + '" alt="评价图片 ' + (index + 1) + '" loading="lazy"></button>'; }).join("") + '</div></div>' +
        '</article>';
      }).join("") + '</div></section>';
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
        pane.innerHTML = reviewMarkup();
        pane.setAttribute("aria-label", "商品评价");
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
    var filter = event.target.closest && event.target.closest("[data-review-market-filter]");
    if (filter) {
      filter.parentElement.querySelectorAll("[data-review-market-filter]").forEach(function (item) { item.classList.toggle("is-active", item === filter); });
      return;
    }
    var tab = event.target.closest && event.target.closest(".product-detail .detail-tab");
    if (!tab) return;
    window.requestAnimationFrame(function () { activate(tab); });
  });
  document.addEventListener("lx:product-detail-rendered", ensureReviewTab);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureReviewTab, { once: true });
  else ensureReviewTab();
})();

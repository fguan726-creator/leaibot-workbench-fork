
;/* public/leaip0/assets/frontend/js/pages/smb/inline-20.js */
/* 占位推荐项与待定制快捷入口保留 hover 反馈，但不触发既有点击逻辑。 */
      (function () {
        function isNonInteractivePlaceholder(event) {
          return event.target.closest?.("[data-quick-placeholder], .shortcut-row [data-waiting-feature]");
        }

        document.addEventListener("click", function (event) {
          if (!isNonInteractivePlaceholder(event)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);

        document.addEventListener("keydown", function (event) {
          if ((event.key !== "Enter" && event.key !== " ") || !isNonInteractivePlaceholder(event)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);
      })();

;


;/* public/leaip0/assets/frontend/js/pages/smb/inline-21.js */
/* 公共运行时以 personal 内部站点标识创建首页标签，中小企业模板统一其展示文案。 */
      (function () {
        var content = document.querySelector(".shell > .content");
        if (!content) return;

        function syncSmbHomeTabLabel() {
          content.querySelectorAll('.lx-tab[data-tab-id="site:business"] .lx-tab-label, .lx-tab[data-shop-tab-id="site:business"] .lx-tab-label').forEach(function (label) {
            if (label.textContent.trim() !== "中小企业") label.textContent = "中小企业";
          });
        }

        if (window.MutationObserver) {
          new MutationObserver(syncSmbHomeTabLabel).observe(content, {
            childList: true,
            subtree: true
          });
        }
        syncSmbHomeTabLabel();
      })();

;

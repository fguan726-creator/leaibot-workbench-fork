
;/* public/leaip0/assets/frontend/js/shared/inline-54fe4c623706.js */
if (document.documentElement.classList.contains("lx-root-lxfd-prepaint")) {
        document.body.classList.add("assistant-fullscreen", "lx-auto-fs");
        document.body.dataset.state = "default";
      }

;


;/* public/leaip0/assets/frontend/js/shared/inline-dab1b3ae0743.js */
// 顶部频道导航仅保留 hover 预览，不响应鼠标、触控或键盘点击。
      (function () {
        function blockTopNavActivation(event) {
          if (!event.isTrusted || !event.target.closest) return;
          var item = event.target.closest(
            ".main-nav > button[data-page], .lxfd-nav-sheet > a[data-page]"
          );
          if (!item) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        document.addEventListener("click", blockTopNavActivation, true);
        document.addEventListener("auxclick", blockTopNavActivation, true);
      })();

;

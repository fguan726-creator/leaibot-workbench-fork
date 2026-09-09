(function () {
  "use strict";

  if (window.__lxProductIntentTurnGuardV2) return;
  window.__lxProductIntentTurnGuardV2 = true;

  var PRODUCT_INTENT = /(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i;
  var SERVICE_INTENT = /清灰|清洁|换硅脂|散热保养|整机保养|维修|保修|延保|服务商品|服务产品/;
  var PRODUCT_CARD = ".lx-answer-reco,[data-lxfd-reveal-products],[data-lx-focus-reco],[data-lxfd-reco-id]";
  var lastQuery = "";

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isProductIntent(value) {
    return PRODUCT_INTENT.test(normalize(value)) || SERVICE_INTENT.test(normalize(value));
  }

  function latestUserQuery(scope) {
    // A restored result belongs to its own turn, not the most recent question.
    var turn = scope && scope.closest && scope.closest(".lx-p0-message,.lxfd-msg,.lxfd-msg-ai");
    if (turn) {
      var previous = turn.previousElementSibling;
      while (previous) {
        if (previous.matches(".lx-p0-message.user,.lxfd-msg.user,.lxfd-msg-user")) return normalize(previous.textContent);
        previous = previous.previousElementSibling;
      }
    }
    var root = scope && scope.closest ? scope.closest(".lx-p0-messages,.lxfd-thread") : null;
    var nodes = (root || document).querySelectorAll(
      ".lx-p0-message.user .user-bubble,.lx-p0-message.msg.user .user-bubble,.lxfd-msg.user,.lxfd-msg-user"
    );
    return nodes.length ? normalize(nodes[nodes.length - 1].textContent) : lastQuery;
  }

  function clearProductTurnState() {
    var states = [window.__lxState, window.__lxfdState, window.__lxChatState];
    states.forEach(function (state) {
      if (!state) return;
      state.lastProducts = null;
      state.lastProductsMeta = null;
      state.officialProducts = null;
    });
  }

  function recordQuery(value) {
    var query = normalize(value);
    if (!query) return;
    lastQuery = query;
    window.__lxCurrentQueryProductIntent = isProductIntent(query);
    if (!window.__lxCurrentQueryProductIntent) clearProductTurnState();
  }

  function readComposer(target) {
    var form = target && target.closest ? target.closest("form,.composer,.lxfd-composer") : null;
    var input = form && form.querySelector("textarea,input:not([type=hidden])");
    return input ? input.value : "";
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".send-btn,.hero-send-btn,.lxfd-send,[data-send],[data-chat-send]")) return;
    recordQuery(readComposer(event.target));
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.shiftKey || !event.target.matches("textarea,input")) return;
    if (!event.target.closest(".composer,.lxfd-composer,.assistant-bottom,.hero-composer")) return;
    recordQuery(event.target.value);
  }, true);

  function removeInvalidProductCards(root) {
    var cards = [];
    if (root && root.matches && root.matches(PRODUCT_CARD)) cards.push(root);
    if (root && root.querySelectorAll) cards = cards.concat(Array.from(root.querySelectorAll(PRODUCT_CARD)));
    cards.forEach(function (card) {
      var query = latestUserQuery(card);
      if (query && !isProductIntent(query)) card.remove();
    });
  }

  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches(".lx-p0-message.user,.lxfd-msg.user,.lxfd-msg-user")) recordQuery(node.textContent);
        removeInvalidProductCards(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  function wrapBridge() {
    var bridge = window.__lxBridge;
    if (!bridge || bridge.__productIntentTurnGuardV2) return;
    bridge.__productIntentTurnGuardV2 = true;
    ["revealProducts", "focusReco"].forEach(function (name) {
      var original = bridge[name];
      if (typeof original !== "function") return;
      bridge[name] = function () {
        var clickedCard = document.activeElement && document.activeElement.closest(PRODUCT_CARD);
        var query = latestUserQuery(clickedCard || document.querySelector(".lx-p0-messages,.lxfd-thread"));
        if (query && !isProductIntent(query)) {
          clearProductTurnState();
          return false;
        }
        return original.apply(this, arguments);
      };
    });
  }

  wrapBridge();
  window.setTimeout(wrapBridge, 0);
  window.setTimeout(wrapBridge, 500);
  removeInvalidProductCards(document);

  window.__lxIsProductIntent = isProductIntent;
})();

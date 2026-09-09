
;/* public/leaip0/assets/frontend/js/core/order-modal-reference-exact-no-body-max-v58.js */
(function () {
  "use strict";

  function removeDeprecatedDetailActions(root) {
    (root || document).querySelectorAll(".product-detail button, .lx-buybar button, .detail-actions button").forEach(function (button) {
      var label = String(button.textContent || "").replace(/\s+/g, "").trim();
      if (label === "加入购物车" || label === "找相似") button.remove();
    });
  }

  function installPaymentModalStyle() {
    if (document.getElementById("lx-order-reference-style-v57")) return;
    var style = document.createElement("style");
    style.id = "lx-order-reference-style-v57";
    style.textContent = `
      .lx-p0-modal-mask.lx-order-modal-mask {
        padding:20px!important;
        background:#190e21d1!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin {
        width:min(620px,calc(100vw - 40px))!important;
        max-height:min(860px,calc(100vh - 40px))!important;
        padding:0!important;
        border:0!important;
        border-radius:20px!important;
        background:#FFFFFF!important;
        box-shadow:0 24px 70px rgba(155,142,182,.62),0 4px 14px rgba(50,29,57,.08)!important;
        overflow:auto!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal-body {
        padding:0!important;
        overflow:visible!important;
      }
      .co.lx-order-skin .order-head {
        position:sticky!important;
        top:0!important;
        z-index:3!important;
        min-height:72px!important;
        margin:0!important;
        padding:20px 28px!important;
        border-bottom:1px solid #EFE4F1!important;
        border-radius:20px 20px 0 0!important;
        background:linear-gradient(90deg,#FBE9EF 0%,#EFE9F9 100%)!important;
      }
      .co.lx-order-skin .order-head .title {
        gap:10px!important;
        font-size:18px!important;
        line-height:26px!important;
        font-weight:800!important;
        color:#B8252E!important;
      }
      .co.lx-order-skin .order-head .x {
        width:36px!important;
        height:36px!important;
        background:rgba(146,86,214,.08)!important;
      }
      .co.lx-order-skin .prod-list {
        margin:22px 28px 0!important;
        padding:0 0 18px!important;
      }
      .co.lx-order-skin .prod {
        gap:14px!important;
        min-height:68px!important;
      }
      .co.lx-order-skin .prod .pic {
        width:64px!important;
        height:64px!important;
        border-radius:12px!important;
        background:#f3edf6!important;
      }
      .co.lx-order-skin .prod .pn {
        font-size:15px!important;
        line-height:22px!important;
      }
      .co.lx-order-skin .spec-group,
      .co.lx-order-skin .addr-group,
      .co.lx-order-skin .pay-row,
      .co.lx-order-skin .pay-picker,
      .co.lx-order-skin .subsidy-bar,
      .co.lx-order-skin .price-section,
      .co.lx-order-skin .actions-row,
      .co.lx-order-skin .foot-note {
        margin-left:28px!important;
        margin-right:28px!important;
      }
      .co.lx-order-skin .spec-group {
        gap:8px 18px!important;
        padding:14px 0!important;
      }
      .co.lx-order-skin .addr-group {
        padding:16px 0!important;
      }
      .co.lx-order-skin .pay-row {
        width:calc(100% - 56px)!important;
        min-height:52px!important;
        padding:0!important;
      }
      .co.lx-order-skin .pay-picker {
        padding:0 0 14px!important;
      }
      .co.lx-order-skin .subsidy-bar {
        min-height:52px!important;
        padding:12px 16px!important;
        border-radius:12px!important;
      }
      .co.lx-order-skin .price-section {
        margin-top:16px!important;
        padding:18px!important;
        border:1px solid #EFE4F1!important;
        border-radius:14px!important;
        background:#f3edf6!important;
      }
      .co.lx-order-skin .pwait {
        align-items:baseline!important;
      }
      .co.lx-order-skin .pwait .amt {
        font-size:34px!important;
        line-height:40px!important;
      }
      .co.lx-order-skin .actions-row {
        display:grid!important;
        grid-template-columns:120px minmax(0,1fr)!important;
        gap:12px!important;
        margin-top:18px!important;
      }
      .co.lx-order-skin .occ-btn {
        height:50px!important;
        min-height:50px!important;
        border-radius:13px!important;
        font-size:16px!important;
        font-weight:800!important;
      }
      .co.lx-order-skin .occ-btn-outline {
        border:1px solid #e2ddeb!important;
        background:#FFFFFF!important;
        color:#5b1452!important;
      }
      .co.lx-order-skin .occ-btn-primary {
        border:0!important;
        background:linear-gradient(90deg,#4d144a 11.9%,#B8252E 100%)!important;
        color:#FFFFFF!important;
        box-shadow:0 12px 26px rgba(146,86,214,.16)!important;
      }
      .co.lx-order-skin .foot-note {
        margin-top:12px!important;
        margin-bottom:22px!important;
        text-align:center!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) {
        width:min(620px,calc(100vw - 40px))!important;
        max-height:min(860px,calc(100vh - 40px))!important;
        padding:0!important;
        border:0!important;
        border-radius:20px!important;
        background:#FFFFFF!important;
        box-shadow:0 24px 70px rgba(155,142,182,.62),0 4px 14px rgba(50,29,57,.08)!important;
        overflow:hidden!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) .lx-p0-modal-head {
        min-height:72px!important;
        padding:20px 28px!important;
        border-bottom:1px solid #EFE4F1!important;
        border-radius:20px 20px 0 0!important;
        background:linear-gradient(90deg,#FBE9EF 0%,#EFE9F9 100%)!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) .lx-p0-modal-title {
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        font-size:18px!important;
        line-height:26px!important;
        font-weight:800!important;
        color:#B8252E!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) .lx-p0-modal-title::before {
        content:"✦";
        color:#B8252E!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) .lx-p0-close {
        width:36px!important;
        height:36px!important;
        border:0!important;
        border-radius:50%!important;
        background:rgba(146,86,214,.08)!important;
        color:#625b68!important;
        font-size:24px!important;
      }
      .lx-p0-modal:has(.lx-mo-skin) .lx-p0-modal-body {
        padding:20px 28px 24px!important;
        overflow-y:auto!important;
      }
      .lx-mo-skin {
        display:flex!important;
        flex-direction:column!important;
        gap:18px!important;
      }
      .lx-mo-skin > div:not(.lx-mo-actions) {
        min-width:0!important;
      }
      .lx-mo-skin .lx-mo-label {
        margin-bottom:8px!important;
        color:#252525!important;
        font-size:13px!important;
        line-height:20px!important;
        font-weight:800!important;
      }
      .lx-mo-skin .lx-mo-chiprow {
        gap:8px!important;
      }
      .lx-mo-skin .lx-mo-chip {
        height:38px!important;
        padding:0 16px!important;
        border:1px solid #e2ddeb!important;
        border-radius:10px!important;
        background:#FFFFFF!important;
        color:#625b68!important;
        font-size:13px!important;
        font-weight:700!important;
        box-shadow:none!important;
      }
      .lx-mo-skin .lx-mo-chip:hover {
        border-color:#5b1452!important;
        color:#5b1452!important;
      }
      .lx-mo-skin .lx-mo-chip.is-sel {
        border-color:#5b1452!important;
        background:#f3edf6!important;
        color:#5b1452!important;
      }
      .lx-mo-skin .lx-mo-row {
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:12px!important;
      }
      .lx-mo-skin input.lx-mo-field,
      .lx-mo-skin textarea.lx-mo-field {
        width:100%!important;
        min-width:0!important;
        height:44px!important;
        padding:0 14px!important;
        border:1px solid #e2ddeb!important;
        border-radius:10px!important;
        background:#FFFFFF!important;
        color:#252525!important;
        font-size:13px!important;
        line-height:20px!important;
        box-shadow:none!important;
        outline:none!important;
      }
      .lx-mo-skin textarea.lx-mo-field {
        height:76px!important;
        padding:12px 14px!important;
        resize:none!important;
      }
      .lx-mo-skin input.lx-mo-field:focus,
      .lx-mo-skin textarea.lx-mo-field:focus {
        border-color:#5b1452!important;
        box-shadow:0 0 0 3px rgba(146,86,214,.16)!important;
      }
      .lx-mo-skin .lx-mo-actions {
        display:grid!important;
        grid-template-columns:120px minmax(0,1fr)!important;
        gap:12px!important;
        margin-top:2px!important;
        padding-top:18px!important;
        border-top:1px solid #EFE4F1!important;
      }
      .lx-mo-skin .lx-mo-actions .lx-p0-btn {
        width:100%!important;
        height:50px!important;
        min-height:50px!important;
        border:1px solid #e2ddeb!important;
        border-radius:13px!important;
        background:#FFFFFF!important;
        color:#5b1452!important;
        font-size:16px!important;
        font-weight:800!important;
      }
      .lx-mo-skin .lx-mo-actions .lx-p0-btn.primary {
        border:0!important;
        background:linear-gradient(90deg,#4d144a 11.9%,#B8252E 100%)!important;
        color:#FFFFFF!important;
        box-shadow:0 12px 26px rgba(146,86,214,.16)!important;
      }
      @media (max-width:640px) {
        .co.lx-order-skin .actions-row { grid-template-columns:1fr!important; }
        .co.lx-order-skin .prod-list,
        .co.lx-order-skin .spec-group,
        .co.lx-order-skin .addr-group,
        .co.lx-order-skin .pay-row,
        .co.lx-order-skin .pay-picker,
        .co.lx-order-skin .subsidy-bar,
        .co.lx-order-skin .price-section,
        .co.lx-order-skin .actions-row,
        .co.lx-order-skin .foot-note { margin-left:18px!important; margin-right:18px!important; }
        .co.lx-order-skin .pay-row { width:calc(100% - 36px)!important; }
        .lx-mo-skin .lx-mo-row,
        .lx-mo-skin .lx-mo-actions { grid-template-columns:1fr!important; }
      }

      /* Exact selector mapping from lenovo_order_payment_modal.html. */
      .lx-p0-modal-mask.lx-order-modal-mask {
        align-items:flex-start!important;
        padding:28px 20px!important;
        overflow:auto!important;
        background:rgba(28,19,33,.78)!important;
        backdrop-filter:blur(2px)!important;
        -webkit-backdrop-filter:blur(2px)!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin {
        width:min(992px,calc(100vw - 40px))!important;
        min-height:1088px!important;
        max-height:none!important;
        zoom:.625!important;
        padding:0!important;
        border-radius:30px!important;
        background:radial-gradient(720px 220px at 20% -2%,rgba(255,232,224,.58),transparent 65%),radial-gradient(620px 260px at 80% 0%,rgba(243,234,255,.7),transparent 70%),#fff!important;
        box-shadow:0 28px 80px rgba(32,19,42,.28)!important;
        overflow:hidden!important;
        animation:modalIn .42s cubic-bezier(.2,.86,.22,1) both!important;
      }
      .co.lx-order-skin .order-head {
        position:relative!important;
        top:auto!important;
        height:122px!important;
        min-height:122px!important;
        margin:0!important;
        padding:0 40px!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
      }
      .co.lx-order-skin .order-head .title {
        gap:14px!important;
        font-size:30px!important;
        line-height:1.2!important;
        font-weight:850!important;
        letter-spacing:-.5px!important;
        background:linear-gradient(90deg,#6a0a58 0%,#a71939 58%,#df1e28 100%)!important;
        -webkit-background-clip:text!important;
        background-clip:text!important;
        color:transparent!important;
      }
      .co.lx-order-skin .order-head .title .hic {
        width:26px!important;
        height:34px!important;
      }
      .co.lx-order-skin .order-head .title .hic .lx-approved-icon {
        width:26px!important;
        height:34px!important;
        background:linear-gradient(135deg,#76105f,#e92835)!important;
      }
      .co.lx-order-skin .order-head .x {
        width:52px!important;
        height:52px!important;
        border:1px solid rgba(89,74,100,.08)!important;
        border-radius:50%!important;
        background:rgba(255,255,255,.72)!important;
        color:#544e5c!important;
        transition:.2s ease!important;
      }
      .co.lx-order-skin .order-head .x:hover {
        transform:rotate(8deg)!important;
        background:#fff!important;
      }
      .co.lx-order-skin .order-head .x svg {
        width:30px!important;
        height:30px!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal-body {
        padding:0 40px 34px!important;
        overflow:visible!important;
      }
      .co.lx-order-skin .prod-list {
        display:flex!important;
        flex-direction:column!important;
        gap:0!important;
        margin:0!important;
        padding:24px 28px 0!important;
        border:1px solid #ece9ef!important;
        border-bottom:0!important;
        border-radius:21px 21px 0 0!important;
        background:rgba(255,255,255,.92)!important;
        box-shadow:0 8px 28px rgba(43,24,51,.045)!important;
      }
      .co.lx-order-skin .prod {
        display:grid!important;
        grid-template-columns:156px 1fr auto!important;
        gap:20px!important;
        min-height:116px!important;
        align-items:center!important;
      }
      .co.lx-order-skin .prod .pic {
        width:150px!important;
        height:116px!important;
        border-radius:12px!important;
        background:#fff!important;
      }
      .co.lx-order-skin .prod .pc {
        padding-right:0!important;
      }
      .co.lx-order-skin .prod .pn {
        font-size:24px!important;
        line-height:1.35!important;
        font-weight:820!important;
        letter-spacing:-.25px!important;
      }
      .co.lx-order-skin .prod .pqty {
        min-width:44px!important;
        height:30px!important;
        margin-top:12px!important;
        padding:0 11px!important;
        border:1px solid #e6d6ea!important;
        border-radius:10px!important;
        background:#f4edf6!important;
        color:#4e2357!important;
      }
      .co.lx-order-skin .prod .pview {
        position:static!important;
        align-self:start!important;
        margin-top:42px!important;
        color:#5a0e56!important;
        font-size:17px!important;
        font-weight:700!important;
        white-space:nowrap!important;
      }
      .co.lx-order-skin .spec-group {
        display:flex!important;
        align-items:center!important;
        gap:22px!important;
        margin:0 0 16px!important;
        padding:16px 20px 14px!important;
        border:1px solid #e9e5ec!important;
        border-top:0!important;
        border-radius:0 0 21px 21px!important;
        background:linear-gradient(180deg,#fff,#fdfcff)!important;
        font-size:18px!important;
      }
      .co.lx-order-skin .spec-group .sp {
        color:#7d7884!important;
        white-space:nowrap!important;
      }
      .co.lx-order-skin .spec-group .sp b {
        color:#17141c!important;
      }
      .co.lx-order-skin .addr-group {
        min-height:110px!important;
        margin:0 0 16px!important;
        padding:20px 26px!important;
        border:1px solid #ece9ef!important;
        border-radius:21px!important;
        background:rgba(255,255,255,.92)!important;
        box-shadow:0 8px 28px rgba(43,24,51,.045)!important;
      }
      .co.lx-order-skin .addr-group .al1 {
        font-size:20px!important;
        font-weight:820!important;
      }
      .co.lx-order-skin .addr-group .al2 {
        margin-top:8px!important;
        color:#77717c!important;
        font-size:18px!important;
      }
      .co.lx-order-skin .pay-row {
        width:100%!important;
        min-height:74px!important;
        margin:0!important;
        padding:0 26px!important;
        border:1px solid #ece9ef!important;
        border-radius:21px!important;
        background:rgba(255,255,255,.92)!important;
        box-shadow:0 8px 28px rgba(43,24,51,.045)!important;
        font-size:20px!important;
      }
      .co.lx-order-skin .pay-row .v {
        font-size:20px!important;
        font-weight:800!important;
      }
      .co.lx-order-skin .pay-picker {
        margin:0 0 16px!important;
        padding:0 26px 18px 78px!important;
        color:#6d6671!important;
      }
      .co.lx-order-skin .subsidy-bar {
        min-height:74px!important;
        margin:16px 0!important;
        padding:0 24px!important;
        border:1px solid #dfeee7!important;
        border-radius:18px!important;
        background:radial-gradient(260px 90px at 4% 50%,rgba(192,245,221,.48),transparent 76%),linear-gradient(90deg,#f6fff9 0%,#fbfffd 100%)!important;
        font-size:20px!important;
      }
      .co.lx-order-skin .subsidy-bar .slink {
        font-size:20px!important;
      }
      .co.lx-order-skin .price-section {
        min-height:188px!important;
        margin:0!important;
        padding:28px 26px!important;
        border:1px solid #efe1ee!important;
        border-radius:20px!important;
        background:radial-gradient(430px 130px at 70% 30%,rgba(255,255,255,.9),transparent 72%),linear-gradient(105deg,#f8edf8 0%,#fff6f8 55%,#f8edf8 100%)!important;
      }
      .co.lx-order-skin .pwait {
        gap:16px!important;
      }
      .co.lx-order-skin .pwait .k {
        font-size:21px!important;
        font-weight:820!important;
      }
      .co.lx-order-skin .pwait .amt {
        color:#f1262f!important;
        font-size:48px!important;
        line-height:1!important;
        font-weight:900!important;
        letter-spacing:-2px!important;
      }
      .co.lx-order-skin .psaved {
        margin-top:10px!important;
        color:#ef2b33!important;
        font-size:20px!important;
        font-weight:800!important;
      }
      .co.lx-order-skin .pdetail-row {
        margin-top:22px!important;
        gap:32px!important;
        font-size:18px!important;
      }
      .co.lx-order-skin .pdetail-hint {
        color:#77717c!important;
        font-size:18px!important;
      }
      .co.lx-order-skin .actions-row {
        display:grid!important;
        grid-template-columns:1fr 1.58fr!important;
        gap:18px!important;
        margin:18px 0 0!important;
        padding:0!important;
        border:0!important;
      }
      .co.lx-order-skin .occ-btn {
        height:80px!important;
        border-radius:18px!important;
        font-size:24px!important;
        font-weight:850!important;
        letter-spacing:.5px!important;
        transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important;
      }
      .co.lx-order-skin .occ-btn:hover {
        transform:translateY(-2px)!important;
      }
      .co.lx-order-skin .occ-btn-outline {
        border:1.5px solid #76216d!important;
        background:#fff!important;
        color:#5b0d58!important;
      }
      .co.lx-order-skin .occ-btn-primary {
        border:0!important;
        background:linear-gradient(105deg,#5a0b5c 0%,#8e164e 46%,#f51e2b 100%)!important;
        color:#fff!important;
        box-shadow:0 14px 28px rgba(183,21,56,.18)!important;
      }
      .co.lx-order-skin .occ-btn-primary:hover {
        box-shadow:0 18px 34px rgba(183,21,56,.28)!important;
        filter:saturate(1.06)!important;
      }
      .co.lx-order-skin .foot-note {
        margin:16px 0 0!important;
        color:#918b95!important;
        font-size:15px!important;
        line-height:1.5!important;
        text-align:center!important;
      }
      @media (max-width:820px) {
        .lx-p0-modal-mask.lx-order-modal-mask { padding:12px!important; }
        .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin {
          width:100%!important;
          min-height:auto!important;
          border-radius:22px!important;
          zoom:1!important;
        }
        .co.lx-order-skin .order-head { height:92px!important;min-height:92px!important;padding:0 22px!important; }
        .co.lx-order-skin .order-head .title { font-size:22px!important; }
        .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal-body { padding:0 18px 24px!important; }
        .co.lx-order-skin .prod-list { padding:18px!important; }
        .co.lx-order-skin .prod { grid-template-columns:104px 1fr!important; }
        .co.lx-order-skin .prod .pic { width:100px!important;height:78px!important; }
        .co.lx-order-skin .prod .pview { grid-column:2!important;margin:-4px 0 0!important;justify-self:start!important; }
        .co.lx-order-skin .prod .pn { font-size:18px!important; }
        .co.lx-order-skin .addr-group { padding:16px!important; }
        .co.lx-order-skin .addr-group .al1 { font-size:17px!important; }
        .co.lx-order-skin .pay-row { padding:0 16px!important; }
        .co.lx-order-skin .subsidy-bar { align-items:flex-start!important;gap:12px!important;padding:14px 16px!important; }
        .co.lx-order-skin .price-section { padding:20px 16px!important; }
        .co.lx-order-skin .pwait .amt { font-size:40px!important; }
        .co.lx-order-skin .actions-row { grid-template-columns:1fr!important; }
        .co.lx-order-skin .occ-btn { height:62px!important;font-size:20px!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function refreshPaymentModalSurface() {
    var modal = document.querySelector(".lx-p0-modal.co.lx-order-skin");
    if (!modal) return;
    modal.style.removeProperty("box-shadow");
    modal.style.removeProperty("filter");
  }

  installPaymentModalStyle();
  removeDeprecatedDetailActions(document);
  refreshPaymentModalSurface();
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) removeDeprecatedDetailActions(node);
      });
    });
    refreshPaymentModalSurface();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

;


;/* public/leaip0/assets/frontend/js/core/order-modal-reference-config-sku-v100.js */
(function () {
  "use strict";

  var STYLE_ID = "lx-order-reference-gradient-fix-style-v66";

  function removeDeprecatedDetailActions(root) {
    (root || document).querySelectorAll(".product-detail button, .lx-buybar button, .detail-actions button").forEach(function (button) {
      var label = String(button.textContent || "").replace(/\s+/g, "").trim();
      if (label === "加入购物车" || label === "找相似") button.remove();
    });
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .lx-p0-modal-mask.lx-order-modal-mask {
        align-items:center!important;
        justify-content:center!important;
        padding:28px 20px!important;
        overflow:auto!important;
        background:rgba(28,19,33,.78)!important;
        backdrop-filter:blur(2px)!important;
        -webkit-backdrop-filter:blur(2px)!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin {
        position:relative!important;
        width:min(992px,calc(100vw - 40px))!important;
        min-height:1088px!important;
        max-height:none!important;
        zoom:.625!important;
        padding:0!important;
        border:0!important;
        border-radius:30px!important;
        background:radial-gradient(720px 220px at 20% -2%,rgba(255,232,224,.58),transparent 65%),radial-gradient(620px 260px at 80% 0%,rgba(243,234,255,.7),transparent 70%),#fff!important;
        box-shadow:0 28px 80px rgba(32,19,42,.28)!important;
        overflow:hidden!important;
        animation:lxRefModalIn .42s cubic-bezier(.2,.86,.22,1) both!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin:before {
        content:""!important;
        position:absolute!important;
        z-index:0!important;
        top:0!important;
        right:0!important;
        left:0!important;
        width:100%!important;
        height:122px!important;
        border-radius:30px 30px 0 0!important;
        background:#fff!important;
        pointer-events:none!important;
      }
      @keyframes lxRefModalIn { from { opacity:0;transform:translateY(18px) scale(.985) } to { opacity:1;transform:translateY(0) scale(1) } }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal-head { display:none!important; }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal-body { position:relative!important;z-index:1!important;padding:0!important;overflow:visible!important; }
      .co.lx-order-skin .order-head {
        display:flex!important;align-items:center!important;justify-content:space-between!important;
        width:100%!important;height:122px!important;min-height:122px!important;margin:0!important;padding:0 40px!important;
        border:0!important;border-radius:30px 30px 0 0!important;background:transparent!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co[data-v="1"].lx-order-skin .order-head {
        position:relative!important;
        top:auto!important;
        z-index:2!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:16px!important;
        width:100%!important;
        height:122px!important;
        min-height:122px!important;
        margin:0!important;
        padding:0 40px!important;
        border:0!important;
        border-radius:30px 30px 0 0!important;
        background:transparent!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co[data-v="1"].lx-order-skin .order-head .title {
        flex:1 1 auto!important;
        min-width:0!important;
        margin:0!important;
      }
      .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co[data-v="1"].lx-order-skin .order-head .x {
        position:static!important;
        top:auto!important;
        right:auto!important;
        margin:0!important;
      }
      .co.lx-order-skin .order-head .title {
        display:flex!important;align-items:center!important;gap:14px!important;margin:0!important;
        font-size:30px!important;line-height:1.2!important;font-weight:600!important;letter-spacing:-.5px!important;
        background:none!important;color:#4d144a!important;
      }
      .co.lx-order-skin .order-head .title .lx-order-title-text {
        display:inline-block!important;
        background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;
        -webkit-background-clip:text!important;background-clip:text!important;
        -webkit-text-fill-color:transparent!important;color:transparent!important;
      }
      .co.lx-order-skin .order-head .hic { position:relative!important;display:block!important;width:26px!important;height:34px!important;flex:0 0 auto!important; }
      .co.lx-order-skin .order-head .hic > * { display:none!important; }
      .co.lx-order-skin .order-head .hic:before,.co.lx-order-skin .order-head .hic:after { content:"";position:absolute;clip-path:polygon(50% 0,62% 36%,100% 50%,62% 64%,50% 100%,38% 64%,0 50%,38% 36%); }
      .co.lx-order-skin .order-head .hic:before { left:4px;top:8px;width:18px;height:18px;background:linear-gradient(135deg,#76105f,#e92835); }
      .co.lx-order-skin .order-head .hic:after { right:0;top:0;width:10px;height:10px;background:#e7a4a0; }
      .co.lx-order-skin .order-head .x {
        display:grid!important;place-items:center!important;width:52px!important;height:52px!important;flex:0 0 auto!important;
        padding:0!important;border:1px solid rgba(89,74,100,.08)!important;border-radius:50%!important;
        background:rgba(255,255,255,.72)!important;color:#544e5c!important;transition:.2s ease!important;
      }
      .co.lx-order-skin .order-head .x:hover { transform:rotate(8deg)!important;background:#fff!important; }
      .co.lx-order-skin .order-head .x svg { width:30px!important;height:30px!important; }
      .co.lx-order-skin .lx-ref-content { padding:0 40px 34px!important; }
      .co.lx-order-skin .lx-ref-card { background:rgba(255,255,255,.92)!important;border:1px solid #ece9ef!important;border-radius:21px!important;box-shadow:0 8px 28px rgba(43,24,51,.045)!important; }
      .co.lx-order-skin .lx-ref-spacer { height:16px!important; }
      .co.lx-order-skin .prod-list.lx-ref-product-card { display:block!important;margin:0!important;padding:24px 28px 22px!important; }
      .co.lx-order-skin .prod-list .prod { display:grid!important;grid-template-columns:156px 1fr auto!important;gap:20px!important;align-items:center!important;min-height:116px!important;padding:0!important;border:0!important; }
      .co.lx-order-skin .prod .pic { display:flex!important;align-items:center!important;justify-content:center!important;width:150px!important;height:116px!important;border-radius:12px!important;background:#fff!important;overflow:hidden!important; }
      .co.lx-order-skin .prod .pic img { width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important; }
      .co.lx-order-skin .prod .pc { min-width:0!important;padding:0!important; }
      .co.lx-order-skin .prod .pn { display:block!important;color:#17141c!important;font-size:24px!important;line-height:1.35!important;font-weight:500!important;letter-spacing:-.25px!important; }
      .co.lx-order-skin .prod .pqty { display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:44px!important;height:30px!important;margin-top:12px!important;padding:0 11px!important;border:1px solid #e6d6ea!important;border-radius:10px!important;background:#f4edf6!important;color:#4e2357!important;font-size:16px!important;font-weight:700!important; }
      .co.lx-order-skin .prod .pview { position:static!important;align-self:start!important;margin-top:42px!important;padding:0!important;border:0!important;background:none!important;color:#5a0e56!important;font-size:20px!important;font-weight:700!important;text-decoration:none!important;white-space:nowrap!important; }
      .co.lx-order-skin .prod .pview:after { content:"  ›";font-size:25px;vertical-align:-1px; }
      .co.lx-order-skin .lx-saved-config-summary { display:flex!important;align-items:center!important;gap:22px!important;margin-top:18px!important;padding:16px 20px!important;border:1px solid #e9e5ec!important;border-radius:14px!important;background:#fff!important;flex-wrap:wrap!important; }
      .co.lx-order-skin .lx-saved-config-item { display:flex!important;align-items:center!important;gap:8px!important;color:#17141c!important;font-size:18px!important;line-height:1.45!important; }
      .co.lx-order-skin .lx-saved-config-item + .lx-saved-config-item { padding-left:20px!important;border-left:1px solid #e8e4eb!important; }
      .co.lx-order-skin .lx-saved-config-item .k { color:#77717c!important; }
      .co.lx-order-skin .lx-saved-config-item .v { color:#17141c!important;font-weight:500!important; }
      .co.lx-order-skin .spec-group.lx-ref-specs { display:flex!important;align-items:center!important;gap:22px!important;margin-top:18px!important;padding:16px 20px 14px!important;border:1px solid #e9e5ec!important;border-radius:14px!important;background:linear-gradient(180deg,#fff,#fdfcff)!important;flex-wrap:wrap!important; }
      .co.lx-order-skin .spec-group .sp { display:flex!important;align-items:center!important;gap:9px!important;color:#17141c!important;font-size:18px!important;white-space:nowrap!important; }
      .co.lx-order-skin .spec-group .sp + .sp { padding-left:20px!important;border-left:1px solid #e8e4eb!important; }
      .co.lx-order-skin .spec-group .sp b { margin-left:0!important;color:#17141c!important;font-weight:400!important; }
      .co.lx-order-skin .addr-group { display:grid!important;align-items:center!important;min-height:110px!important;margin:0!important;padding:20px 26px!important; }
      .co.lx-order-skin .addr-group .al1 { display:block!important;color:#17141c!important;font-size:20px!important;font-weight:820!important; }
      .co.lx-order-skin .addr-group .ap { margin-left:16px!important; }
      .co.lx-order-skin .addr-group .al2 { margin-top:8px!important;color:#77717c!important;font-size:18px!important;line-height:1.5!important; }
      .co.lx-order-skin .lx-ref-payment-card,
      .co.lx-order-skin .lx-ref-payment-card:has(.pay-picker.is-open) { overflow:hidden!important;background:#fff!important;background-image:none!important; }
      .co.lx-order-skin .pay-row { display:flex!important;align-items:center!important;justify-content:space-between!important;width:100%!important;min-height:74px!important;margin:0!important;padding:0 26px!important;border:0!important;background:transparent!important;font:inherit!important; }
      .co.lx-order-skin .pay-row .k { color:#17141c!important;font-size:20px!important; }
      .co.lx-order-skin .pay-row .v { flex:1!important;margin-right:16px!important;color:#17141c!important;font-size:20px!important;font-weight:500!important;text-align:right!important; }
      .co.lx-order-skin .pay-row .chev { display:inline-flex!important;align-items:center!important;justify-content:center!important;width:12px!important;height:12px!important;color:#36303a!important;transform:rotate(0deg)!important;transform-origin:center!important;transition:transform .24s cubic-bezier(.2,.8,.2,1)!important; }
      .co.lx-order-skin .pay-row .chev .lx-payment-chevron-icon { display:block!important;width:12px!important;height:7px!important; }
      .co.lx-order-skin .lx-ref-payment-card:has(.pay-picker.is-open) .pay-row .chev { transform:rotate(180deg)!important; }
      .co.lx-order-skin .pay-picker { display:none!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:0!important;padding:0 26px 18px!important;border:0!important;background:#fff!important;background-image:none!important;color:#6d6671!important; }
      .co.lx-order-skin .pay-picker.is-open { display:grid!important;background:#fff!important;background-image:none!important; }
      .co.lx-order-skin .pay-opt { display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:88px!important;padding:0 14px!important;border:1px solid #e6e0ed!important;border-radius:10px!important;background:#fff!important;color:#17141c!important;font-size:18px!important;font-weight:500!important;line-height:1!important;text-align:center!important;cursor:pointer!important;transition:background-color .18s ease,border-color .18s ease,color .18s ease!important; }
      .co.lx-order-skin .pay-opt:hover { border-color:#e6d6ea!important;background:#f4edf6!important;color:#4e2357!important; }
      .co.lx-order-skin .pay-opt.is-sel { border-color:#76216d!important;background:#f4edf6!important;color:#5b0d58!important;font-weight:600!important; }
      .co.lx-order-skin .pay-opt.is-sel:hover { border-color:#76216d!important;background:#f4edf6!important;color:#5b0d58!important; }
      .co.lx-order-skin .pay-opt:focus-visible { outline:2px solid #76216d!important;outline-offset:2px!important; }
      .co.lx-order-skin .subsidy-bar { display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;min-height:74px!important;margin:0!important;padding:0 24px!important;border:1px solid #dfeee7!important;border-radius:18px!important;background:radial-gradient(260px 90px at 4% 50%,rgba(192,245,221,.48),transparent 76%),linear-gradient(90deg,#f6fff9 0%,#fbfffd 100%)!important; }
      .co.lx-order-skin .subsidy-bar .sic { display:none!important; }
      .co.lx-order-skin .subsidy-bar .stxt { flex:1!important;color:#5d5861!important;font-size:20px!important; }
      .co.lx-order-skin .subsidy-bar .stxt b { color:#ff333b!important; }
      .co.lx-order-skin .subsidy-bar .slink { flex:0 0 auto!important;border:0!important;background:none!important;color:#5a0e56!important;font-size:20px!important;font-weight:700!important;text-decoration:none!important; }
      .co.lx-order-skin .subsidy-bar .slink:after { content:" ›"; }
      .co.lx-order-skin .price-section { display:block!important;min-height:188px!important;margin:0!important;padding:28px 26px!important;border:1px solid #efe1ee!important;border-radius:20px!important;background:radial-gradient(430px 130px at 70% 30%,rgba(255,255,255,.9),transparent 72%),linear-gradient(105deg,#f8edf8 0%,#fff6f8 55%,#f8edf8 100%)!important; }
      .co.lx-order-skin .pwait { display:flex!important;align-items:baseline!important;gap:16px!important;flex-wrap:wrap!important; }
      .co.lx-order-skin .pwait .k { color:#17141c!important;font-size:21px!important;font-weight:500!important; }
      .co.lx-order-skin .pwait .amt { color:#f1262f!important;font-size:48px!important;line-height:1!important;font-weight:600!important;letter-spacing:-2px!important; }
      .co.lx-order-skin .pwait .amt .cur { margin-right:1px!important;font-size:21px!important;font-weight:500!important;letter-spacing:0!important; }
      .co.lx-order-skin .psaved { margin-top:10px!important;color:#ef2b33!important;font-size:20px!important;font-weight:500!important; }
      .co.lx-order-skin .pdetail-row { display:flex!important;align-items:center!important;gap:32px!important;margin-top:22px!important;flex-wrap:wrap!important;font-size:18px!important; }
      .co.lx-order-skin .pdetail-link { padding:0!important;border:0!important;background:none!important;color:#5a0e56!important;font-size:18px!important;font-weight:700!important;text-decoration:none!important; }
      .co.lx-order-skin .pdetail-link:after { content:" ›"; }
      .co.lx-order-skin .pdetail-hint { color:#77717c!important;font-size:18px!important;opacity:1!important; }
      .co.lx-order-skin .price-detail-panel { display:none!important;margin-top:14px!important;padding:18px 21px!important;border-radius:14px!important;background:#fff!important;background-image:none!important; }
      .co.lx-order-skin .price-detail-panel.is-open { display:block!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-detail-list { gap:15px!important;margin-top:0!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-row { gap:15px!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-ck { width:27px!important;height:27px!important;margin-top:1px!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-ck .lx-approved-icon,
      .co.lx-order-skin .price-detail-panel .lx-discount-ck .lx-approved-icon-img { width:16px!important;height:16px!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-name { font-size:20px!important;line-height:1.4!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-desc { margin-top:4px!important;font-size:16px!important;line-height:1.4!important; }
      .co.lx-order-skin .price-detail-panel .lx-discount-amt { font-size:20px!important;line-height:1.4!important; }
      .co.lx-order-skin .actions-row { display:grid!important;grid-template-columns:1fr 1.58fr!important;gap:18px!important;margin:18px 0 0!important; }
      .co.lx-order-skin .occ-btn { width:100%!important;height:80px!important;border-radius:18px!important;font-size:24px!important;font-weight:500!important;letter-spacing:.5px!important;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important; }
      .co.lx-order-skin .occ-btn:hover { transform:translateY(-2px)!important; }
      .co.lx-order-skin .occ-btn-outline { border:1.5px solid #76216d!important;background:#fff!important;color:#5b0d58!important; }
      .co.lx-order-skin .occ-btn-primary { border:0!important;background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;color:#fff!important;box-shadow:none!important; }
      .co.lx-order-skin .occ-btn-primary:hover { box-shadow:none!important;filter:none!important; }
      .co.lx-order-skin .foot-note { margin:16px 0 0!important;color:#918b95!important;font-size:15px!important;line-height:1.5!important;text-align:center!important; }

      .lx-p0-modal-mask.lx-modify-order-modal-mask {
        align-items:center!important;justify-content:center!important;padding:28px 20px!important;overflow:auto!important;
        background:rgba(28,19,33,.78)!important;backdrop-filter:blur(2px)!important;-webkit-backdrop-filter:blur(2px)!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal.lx-modify-order-skin {
        display:flex!important;flex-direction:column!important;width:min(992px,calc(100vw - 40px))!important;
        height:1088px!important;min-height:1088px!important;max-height:1088px!important;zoom:.625!important;
        padding:0!important;border:0!important;border-radius:30px!important;background:#fff!important;
        box-shadow:0 28px 80px rgba(32,19,42,.28)!important;overflow:hidden!important;
        animation:lxRefModalIn .42s cubic-bezier(.2,.86,.22,1) both!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal-head {
        position:sticky!important;top:0!important;z-index:5!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;
        width:100%!important;height:122px!important;min-height:122px!important;margin:0!important;padding:0 40px!important;
        border:0!important;border-radius:30px 30px 0 0!important;background:#fff!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal-title {
        position:relative!important;display:inline-block!important;flex:1 1 auto!important;min-width:0!important;margin:0!important;padding-left:0!important;
        font-size:30px!important;line-height:1.2!important;font-weight:600!important;letter-spacing:-.5px!important;
        background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;
        -webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal-title:before,
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal-title:after {
        content:none!important;display:none!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-modify-order-back {
        display:grid!important;place-items:center!important;width:44px!important;height:44px!important;flex:0 0 auto!important;
        margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#fff!important;color:#5b0d58!important;
        cursor:pointer!important;transition:background-color .18s ease,transform .18s ease!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-modify-order-back:hover { background:#f4edf6!important;transform:translateX(-2px)!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-modify-order-back:focus-visible { outline:2px solid #76216d!important;outline-offset:2px!important; }
.lx-p0-modal-mask.lx-modify-order-modal-mask .lx-modify-order-back img { display:block!important;width:18px!important;height:10px!important;transform:rotate(90deg)!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-close {
        position:static!important;display:grid!important;place-items:center!important;width:52px!important;height:52px!important;flex:0 0 auto!important;
        margin:0!important;padding:0!important;border:1px solid rgba(89,74,100,.08)!important;border-radius:50%!important;
        background:rgba(255,255,255,.72)!important;color:#544e5c!important;font-size:38px!important;line-height:1!important;font-weight:300!important;transition:.2s ease!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-close:hover { transform:rotate(8deg)!important;background:#fff!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-p0-modal-body {
        flex:1 1 auto!important;min-height:0!important;padding:0 40px 34px!important;
        overflow-x:hidden!important;overflow-y:scroll!important;overscroll-behavior:contain!important;scroll-padding-bottom:34px!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-skin {
        display:flex!important;flex:0 0 auto!important;align-self:stretch!important;flex-direction:column!important;
        width:100%!important;height:auto!important;min-height:0!important;gap:16px!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-skin > div:first-child {
        display:none!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-skin > div:not(.lx-mo-actions) {
        flex:0 0 auto!important;width:auto!important;height:auto!important;min-height:0!important;
        padding:24px!important;border:1px solid #ece9ef!important;border-radius:21px!important;background:#fff!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-label { margin:0 0 14px!important;color:#17141c!important;font-size:20px!important;line-height:1.4!important;font-weight:500!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chiprow { display:flex!important;flex-wrap:wrap!important;gap:12px!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chip {
        min-width:120px!important;height:52px!important;padding:0 20px!important;border:1px solid #e6e0ed!important;border-radius:12px!important;
        background:#fff!important;color:#17141c!important;font-size:18px!important;font-weight:500!important;cursor:pointer!important;
        transition:background-color .18s ease,border-color .18s ease,color .18s ease!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chip:hover { border-color:#e6d6ea!important;background:#f4edf6!important;color:#4e2357!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chip.is-sel,
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chip.is-sel:hover { border-color:#76216d!important;background:#f4edf6!important;color:#5b0d58!important;font-weight:600!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-row { display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask input.lx-mo-field,
      .lx-p0-modal-mask.lx-modify-order-modal-mask textarea.lx-mo-field {
        display:block!important;box-sizing:border-box!important;flex:0 0 56px!important;width:100%!important;height:56px!important;min-height:56px!important;max-height:56px!important;padding:0 18px!important;border:1px solid #e6e0ed!important;border-radius:14px!important;
        background:#fff!important;color:#17141c!important;font-size:18px!important;line-height:1.5!important;font-weight:400!important;outline:none!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask textarea.lx-mo-field { flex:0 0 96px!important;height:96px!important;min-height:96px!important;max-height:96px!important;padding:14px 18px!important;resize:none!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask input.lx-mo-field::placeholder,
      .lx-p0-modal-mask.lx-modify-order-modal-mask textarea.lx-mo-field::placeholder { color:#77717c!important;opacity:1!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask input.lx-mo-field:hover,
      .lx-p0-modal-mask.lx-modify-order-modal-mask textarea.lx-mo-field:hover { border-color:#e6d6ea!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask input.lx-mo-field:focus,
      .lx-p0-modal-mask.lx-modify-order-modal-mask textarea.lx-mo-field:focus { border-color:#76216d!important; }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-actions {
        position:sticky!important;bottom:-34px!important;z-index:6!important;
        display:grid!important;flex:0 0 auto!important;grid-template-columns:1fr 1.58fr!important;
        width:100%!important;height:auto!important;gap:18px!important;margin:2px 0 -34px!important;padding:18px 0 34px!important;
        border-top:1px solid #ece9ef!important;background:#fff!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-actions .lx-p0-btn {
        width:100%!important;height:80px!important;border:1.5px solid #76216d!important;border-radius:18px!important;background:#fff!important;
        color:#5b0d58!important;font-size:24px!important;font-weight:500!important;box-shadow:none!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-actions .lx-p0-btn.primary {
        border:0!important;background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;color:#fff!important;box-shadow:none!important;
      }
      .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-actions .lx-p0-btn:hover { transform:translateY(-2px)!important;box-shadow:none!important; }
      @media (prefers-reduced-motion:reduce) {
        .co.lx-order-skin .pay-row .chev { transition:none!important; }
        .co.lx-order-skin .pay-opt { transition:none!important; }
        .lx-p0-modal-mask.lx-modify-order-modal-mask .lx-mo-chip { transition:none!important; }
      }
      @media (max-width:820px) {
        .lx-p0-modal-mask.lx-order-modal-mask { padding:12px!important; }
        .lx-p0-modal-mask.lx-order-modal-mask .lx-p0-modal.co.lx-order-skin { width:100%!important;min-height:auto!important;border-radius:22px!important;zoom:1!important; }
        .co.lx-order-skin .order-head { height:92px!important;min-height:92px!important;padding:0 22px!important; }
        .co.lx-order-skin .order-head .title { font-size:22px!important; }
        .co.lx-order-skin .lx-ref-content { padding:0 18px 24px!important; }
        .co.lx-order-skin .prod-list.lx-ref-product-card { padding:18px!important; }
        .co.lx-order-skin .prod-list .prod { grid-template-columns:104px 1fr!important; }
        .co.lx-order-skin .prod .pic { width:100px!important;height:78px!important; }
        .co.lx-order-skin .prod .pview { grid-column:2!important;margin:-4px 0 0!important;justify-self:start!important; }
        .co.lx-order-skin .prod .pn { font-size:18px!important; }
        .co.lx-order-skin .spec-group .sp + .sp { padding-left:0!important;border-left:0!important; }
        .co.lx-order-skin .addr-group { padding:16px!important; }
        .co.lx-order-skin .addr-group .al1 { font-size:17px!important; }
        .co.lx-order-skin .payment-row { padding:0 16px!important; }
        .co.lx-order-skin .subsidy-bar { align-items:flex-start!important;padding:14px 16px!important; }
        .co.lx-order-skin .price-section { padding:20px 16px!important; }
        .co.lx-order-skin .pwait .amt { font-size:40px!important; }
        .co.lx-order-skin .actions-row { grid-template-columns:1fr!important; }
        .co.lx-order-skin .occ-btn { height:62px!important;font-size:20px!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function spacer() {
    var node = document.createElement("div");
    node.className = "lx-ref-spacer";
    return node;
  }

  function syncSavedConfigSummary(products) {
    if (!products) return;
    var state = window.__lxState || {};
    var pending = state.pendingOrderProduct || {};
    var items = Array.isArray(pending.items) && pending.items.length ? pending.items : [pending];
    var item = items[0] || {};
    var stored = (window.__lxOrderConfigSelections || {})["item-0"] || {};
    var configLabel = String(item.configurationLabel || item.configLabel || stored.configurationLabel || "").trim();
    var colorLabel = String(item.colorLabel || stored.colorLabel || "").trim();
    var summary = products.querySelector(":scope > .lx-saved-config-summary");
    if (!configLabel && !colorLabel) {
      if (summary) summary.remove();
      return;
    }
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "lx-saved-config-summary";
      var specGroup = products.querySelector(":scope > .spec-group");
      products.insertBefore(summary, specGroup || null);
    }
    summary.innerHTML = (configLabel ? '<div class="lx-saved-config-item"><span class="k">已选配置：</span><span class="v">' + configLabel.replace(/[&<>"']/g, function (char) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]; }) + '</span></div>' : '') +
      (colorLabel ? '<div class="lx-saved-config-item"><span class="k">颜色：</span><span class="v">' + colorLabel.replace(/[&<>"']/g, function (char) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]; }) + '</span></div>' : '');
  }

  window.__lxSyncOrderConfigSummary = function () {
    document.querySelectorAll(".lx-order-modal-mask .prod-list").forEach(syncSavedConfigSummary);
  };

  function rebuildPaymentModal() {
    var modal = document.querySelector(".lx-p0-modal.co.lx-order-skin");
    if (!modal) return;
    var body = modal.querySelector(".lx-p0-modal-body");
    if (!body) return;
    if (body.querySelector(":scope > .order-head + .lx-ref-content")) {
      syncSavedConfigSummary(body.querySelector(".prod-list"));
      return;
    }
    var head = body.querySelector(":scope > .order-head");
    var products = body.querySelector(":scope > .prod-list");
    var specs = body.querySelector(":scope > .spec-group");
    var address = body.querySelector(":scope > .addr-group");
    var payRow = body.querySelector(":scope > .pay-row");
    var payPicker = body.querySelector(":scope > .pay-picker");
    var subsidy = body.querySelector(":scope > .subsidy-bar");
    var price = body.querySelector(":scope > .price-section");
    var actions = body.querySelector(":scope > .actions-row");
    var note = body.querySelector(":scope > .foot-note");
    if (!head || !products || !address || !payRow || !subsidy || !price || !actions || !note) return;

    var paymentChevron = payRow.querySelector(".chev img");
    if (paymentChevron) {
      paymentChevron.src = String(paymentChevron.getAttribute("src") || "").replace("global-next.svg", "global-expand.svg");
      paymentChevron.classList.add("lx-payment-chevron-icon");
    }
    if (payPicker) {
      payRow.setAttribute("aria-expanded", payPicker.classList.contains("is-open") ? "true" : "false");
      if (!payRow.dataset.lxPaymentStateBound) {
        payRow.dataset.lxPaymentStateBound = "1";
        payRow.addEventListener("click", function () {
          window.setTimeout(function () {
            payRow.setAttribute("aria-expanded", payPicker.classList.contains("is-open") ? "true" : "false");
          }, 0);
        });
      }
    }

    var title = head.querySelector(".title");
    if (title && !title.querySelector(".lx-order-title-text")) {
      Array.from(title.childNodes).forEach(function (node) {
        if (node.nodeType !== Node.TEXT_NODE || !String(node.textContent || "").trim()) return;
        var titleText = document.createElement("span");
        titleText.className = "lx-order-title-text";
        titleText.textContent = String(node.textContent || "").trim();
        node.replaceWith(titleText);
      });
    }

    products.classList.add("lx-ref-card", "lx-ref-product-card");
    if (specs) {
      specs.classList.add("lx-ref-specs");
      products.appendChild(specs);
    }
    syncSavedConfigSummary(products);
    products.querySelectorAll(".pview").forEach(function (button) {
      button.textContent = "修改配置";
      button.removeAttribute("data-occ-view-detail");
      button.setAttribute("data-occ-modify-order", "1");
    });
    address.classList.add("lx-ref-card");
    if (address.querySelector(".al2")) address.querySelector(".al2").textContent = address.querySelector(".al2").textContent.replace("收货地址:", "收货地址：");

    var paymentCard = document.createElement("section");
    paymentCard.className = "lx-ref-card lx-ref-payment-card";
    paymentCard.appendChild(payRow);
    if (payPicker) paymentCard.appendChild(payPicker);

    var content = document.createElement("div");
    content.className = "lx-ref-content";
    content.appendChild(products);
    content.appendChild(spacer());
    content.appendChild(address);
    content.appendChild(spacer());
    content.appendChild(paymentCard);
    content.appendChild(spacer());
    content.appendChild(subsidy);
    content.appendChild(spacer());
    content.appendChild(price);
    content.appendChild(actions);
    content.appendChild(note);

    body.replaceChildren(head, content);
    modal.dataset.lxReferenceStructure = "v63";
    modal.style.removeProperty("box-shadow");
    modal.style.removeProperty("filter");
  }

  function syncModifyOrderModal() {
    document.querySelectorAll(".lx-p0-modal-mask").forEach(function (mask) {
      var modifyForm = mask.querySelector(".lx-mo-skin");
      var modal = mask.querySelector(".lx-p0-modal");
      var head = mask.querySelector(".lx-p0-modal-head");
      mask.classList.toggle("lx-modify-order-modal-mask", Boolean(modifyForm));
      if (modal) modal.classList.toggle("lx-modify-order-skin", Boolean(modifyForm));
      if (modifyForm && head && !head.querySelector(".lx-modify-order-back")) {
        var back = document.createElement("button");
        back.className = "lx-modify-order-back";
        back.type = "button";
        back.dataset.moCancel = "1";
        back.setAttribute("aria-label", "返回订单弹窗");
  back.innerHTML = '<img src="../icons/global-expand.svg" alt="" aria-hidden="true">';
        head.insertBefore(back, head.firstChild);
      }
      if (!modifyForm && head) head.querySelectorAll(".lx-modify-order-back").forEach(function (back) { back.remove(); });
    });
  }

  installStyle();
  removeDeprecatedDetailActions(document);
  rebuildPaymentModal();
  syncModifyOrderModal();
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) removeDeprecatedDetailActions(node);
      });
    });
    rebuildPaymentModal();
    syncModifyOrderModal();
  }).observe(document.documentElement, { childList:true, subtree:true });
})();
(function () {
  "use strict";

  var STYLE_ID = "lx-product-config-modal-v94-style";
  var MODAL_CLASS = "lx-product-config-modal-mask";
  var DEMO_COLORS = ["日光映潮", "凝雾灰", "深空灰"];
  var selectionStore = window.__lxOrderConfigSelections = window.__lxOrderConfigSelections || {};

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function specs(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw) || {}; } catch (_error) { return {}; }
  }
  function pick(object, keys) {
    for (var i = 0; i < keys.length; i += 1) if (object[keys[i]]) return object[keys[i]];
    return "";
  }
  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
  function variantMeta(variant, index) {
    var data = specs(variant.specs);
    var source = [data.configuration_name, data.configurationName, variant.name, variant.description].filter(Boolean).join(" / ");
    var color = pick(data, ["color", "colour", "颜色", "机身颜色", "外观颜色"]);
    if (!color) {
      var tokens = source.split(/[\s｜|/，,（）()]+/).filter(Boolean);
      color = tokens.reverse().find(function (token) { return /(?:黑|白|灰|蓝|青|绿|银|金|紫|红|粉|橙|棕)$/.test(token); }) || "";
    }
    var values = [
      pick(data, ["cpu", "processor", "处理器"]),
      pick(data, ["ram", "memory", "内存"]),
      pick(data, ["storage", "disk", "硬盘", "存储"]),
      pick(data, ["gpu", "graphics", "显卡"]),
      pick(data, ["screen_size", "screenSize", "屏幕尺寸"])
    ].map(clean).filter(Boolean);
    if (!values.length) {
      var fallback = clean(data.configuration_name || data.configurationName || variant.name || "");
      if (fallback) values.push(fallback);
    }
    return {
      variant: variant,
      color: clean(color),
      label: values.join(" / ") || ("配置 " + String(index + 1).padStart(2, "0")),
      price: Number(variant.price || variant.sale_price || 0)
    };
  }
  function unique(values) {
    return values.filter(function (value, index) { return value && values.indexOf(value) === index; });
  }
  function fmt(value) { return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 }); }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${MODAL_CLASS}{position:fixed!important;inset:0!important;z-index:10040!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:28px 20px!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
      .lx-product-config-modal{position:relative!important;display:flex!important;flex-direction:column!important;width:min(992px,calc(100vw - 40px))!important;height:1088px!important;max-height:calc((100vh - 56px)/.625)!important;zoom:.625!important;border-radius:30px!important;background:#fff!important;overflow:hidden!important;animation:lxRefModalIn .42s cubic-bezier(.2,.86,.22,1) both!important;}
      .lx-product-config-head{display:flex;align-items:center;gap:18px;flex:0 0 122px;padding:0 40px;border-bottom:1px solid #f0ebf2;}
      .lx-product-config-head h2{margin:0;font-size:32px;line-height:1.25;font-weight:600;color:#57104f;}
      .lx-product-config-back,.lx-product-config-close{display:grid;place-items:center;border:0;background:transparent;cursor:pointer;color:#8b8790;transition:background .2s,color .2s,transform .2s;}
      .lx-product-config-back{width:42px;height:42px;border-radius:50%;}
      .lx-product-config-back:before{content:"";width:12px;height:12px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);}
      .lx-product-config-close{margin-left:auto;width:58px;height:58px;border:1px solid #eee8f0;border-radius:50%;background:#faf8fb;}
      .lx-product-config-close:before,.lx-product-config-close:after{content:"";position:absolute;width:24px;height:2px;border-radius:2px;background:currentColor;transform:rotate(45deg);}
      .lx-product-config-close:after{transform:rotate(-45deg);}
      .lx-product-config-back:hover,.lx-product-config-close:hover{color:#5f0b56;background:#f6eff7;}
      .lx-product-config-body{display:flex;flex:1;min-height:0;flex-direction:column;overflow:hidden;}
      .lx-product-config-scroll{flex:1;min-height:0;overflow:auto;padding:28px 40px 18px;scrollbar-width:thin;scrollbar-color:#d8cedd transparent;}
      .lx-product-config-card{margin-bottom:20px;padding:28px;border:1px solid #ebe6ed;border-radius:22px;background:#fff;}
      .lx-product-config-product{display:grid;grid-template-columns:132px minmax(0,1fr);align-items:center;gap:24px;}
      .lx-product-config-product img{width:132px;height:104px;object-fit:contain;}
      .lx-product-config-product h3{margin:0 0 10px;font-size:26px;line-height:1.45;font-weight:500;color:#201c22;}
      .lx-product-config-current{font-size:20px;color:#77717d;}
      .lx-product-config-label{margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:600;color:#211d23;}
      .lx-product-config-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
      .lx-product-config-option{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:82px;padding:16px 20px;border:1px solid #e7dfea;border-radius:14px;background:#fff;text-align:left;cursor:pointer;transition:border-color .2s,background .2s,transform .2s;}
      .lx-product-config-option:hover{border-color:#a96aa4;background:#fcf8fc;transform:translateY(-1px);}
      .lx-product-config-option.is-selected{border-color:#701166;background:#f7edf7;box-shadow:inset 0 0 0 1px #701166;}
      .lx-product-config-option .name{font-size:20px;line-height:1.45;font-weight:500;color:#211d23;}
      .lx-product-config-option .price{flex:none;font-size:20px;font-weight:600;color:#e2231a;}
      .lx-product-config-colors{display:flex;flex-wrap:wrap;gap:14px;}
      .lx-product-config-color{min-width:150px;height:64px;padding:0 24px;border:1px solid #e7dfea;border-radius:14px;background:#fff;font-size:20px;font-weight:500;color:#211d23;cursor:pointer;transition:border-color .2s,background .2s;}
      .lx-product-config-color:hover{border-color:#a96aa4;background:#fcf8fc;}
      .lx-product-config-color.is-selected{border-color:#701166;background:#f7edf7;color:#5f0b56;box-shadow:inset 0 0 0 1px #701166;}
      .lx-product-config-empty{padding:54px 20px;text-align:center;font-size:22px;color:#77717d;}
      .lx-product-config-actions{display:grid;grid-template-columns:1fr 1.58fr;gap:18px;flex:none;padding:20px 40px 30px;border-top:1px solid #eee8f0;background:#fff;}
      .lx-product-config-actions button{height:80px;border-radius:18px;font-size:26px;font-weight:500;cursor:pointer;}
      .lx-product-config-cancel{border:1px solid #7c126f;background:#fff;color:#65105d;}
      .lx-product-config-save{border:0;background:linear-gradient(90deg,#570b51 0%,#85104f 48%,#c32634 100%);color:#fff;}
      @media(max-width:900px){.lx-product-config-modal{zoom:.52!important}.lx-product-config-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function currentPendingItem(button) {
    var state = window.__lxState || {};
    var pending = state.pendingOrderProduct || {};
    var items = Array.isArray(pending.items) && pending.items.length ? pending.items : [pending];
    var index = Number(button.dataset.lxItemIndex || 0);
    return { state: state, pending: pending, items: items, index: Math.max(0, Math.min(index, items.length - 1)), item: items[index] || pending };
  }

  async function fetchVariants(item) {
    if (!item || !item.sku) return [];
    try {
      var response = await fetch("/api/products/" + encodeURIComponent(item.sku) + "/variants", { cache: "no-store" });
      if (!response.ok) throw new Error("variants " + response.status);
      var payload = await response.json();
      return Array.isArray(payload.variants) ? payload.variants : [];
    } catch (_error) {
      var cached = window.__lxState && window.__lxState.spuVariants;
      return Array.isArray(cached) ? cached : [];
    }
  }

  function closeConfig(mask, closeOrder) {
    mask.remove();
    document.documentElement.style.removeProperty("overflow");
    if (closeOrder) document.querySelector(".lx-order-modal-mask .lx-p0-close")?.click();
  }

  function renderChoices(mask, metas, selectedSku) {
    var grid = mask.querySelector("[data-lx-config-grid]");
    var colorsBox = mask.querySelector("[data-lx-color-grid]");
    if (!metas.length) {
      grid.innerHTML = '<div class="lx-product-config-empty">当前商品暂无可切换配置</div>';
      colorsBox.innerHTML = '<div class="lx-product-config-empty">暂无颜色数据</div>';
      return;
    }
    var selected = metas.find(function (meta) { return String(meta.variant.sku) === String(selectedSku); }) || metas[0];
    mask.dataset.selectedSku = selected.variant.sku || "";
    grid.innerHTML = metas.map(function (meta) {
      var active = meta === selected;
      return '<button type="button" class="lx-product-config-option' + (active ? ' is-selected' : '') + '" data-lx-config-sku="' + esc(meta.variant.sku) + '"><span class="name">' + esc(meta.label) + (meta.color ? '<br><small>' + esc(meta.color) + '</small>' : '') + '</span><span class="price">¥' + fmt(meta.price) + '</span></button>';
    }).join("");
    var colors = unique(metas.map(function (meta) { return meta.color; }));
    var selectedColor = selected.color || mask.dataset.selectedColor || DEMO_COLORS[0];
    if (!colors.length) colors = DEMO_COLORS.slice();
    mask.dataset.selectedColor = selectedColor;
    colorsBox.innerHTML = colors.map(function (color) {
      return '<button type="button" class="lx-product-config-color' + (color === selectedColor ? ' is-selected' : '') + '" data-lx-config-color="' + esc(color) + '">' + esc(color) + '</button>';
    }).join("");
  }

  async function openConfig(button) {
    installStyle();
    document.querySelector("." + MODAL_CLASS)?.remove();
    var context = currentPendingItem(button);
    var item = context.item || {};
    var storedSelection = selectionStore["item-" + context.index] || {};
    var mask = document.createElement("div");
    mask.className = MODAL_CLASS;
    mask.innerHTML = '<section class="lx-product-config-modal" role="dialog" aria-modal="true" aria-label="修改配置">' +
      '<header class="lx-product-config-head"><button type="button" class="lx-product-config-back" data-lx-config-back aria-label="返回订单弹窗"></button><h2>修改配置</h2><button type="button" class="lx-product-config-close" data-lx-config-close aria-label="关闭"></button></header>' +
      '<div class="lx-product-config-body"><div class="lx-product-config-scroll">' +
      '<section class="lx-product-config-card lx-product-config-product"><img src="' + esc(item.image_url || item.image || "") + '" alt=""><div><h3>' + esc(item.name || "当前商品") + '</h3><div class="lx-product-config-current">当前 SKU：' + esc(item.sku || "-") + '</div></div></section>' +
      '<section class="lx-product-config-card"><h3 class="lx-product-config-label">选择配置</h3><div class="lx-product-config-grid" data-lx-config-grid><div class="lx-product-config-empty">正在同步商品详情页 SKU 配置…</div></div></section>' +
      '<section class="lx-product-config-card"><h3 class="lx-product-config-label">选择颜色</h3><div class="lx-product-config-colors" data-lx-color-grid><div class="lx-product-config-empty">正在读取颜色…</div></div></section>' +
      '</div><footer class="lx-product-config-actions"><button type="button" class="lx-product-config-cancel" data-lx-config-back>取消</button><button type="button" class="lx-product-config-save" data-lx-config-save>保存配置</button></footer></div></section>';
    document.body.appendChild(mask);
    document.documentElement.style.overflow = "hidden";
    mask.dataset.selectedColor = item.colorLabel || storedSelection.colorLabel || DEMO_COLORS[0];
    var variants = await fetchVariants(item);
    if (!variants.some(function (variant) { return String(variant.sku) === String(item.sku); })) variants.unshift(item);
    var metas = variants.map(variantMeta);
    mask._lxConfigContext = context;
    mask._lxConfigMetas = metas;
    renderChoices(mask, metas, item.sku);
  }

  function syncButtons() {
    document.querySelectorAll(".lx-order-modal-mask .prod-list .prod").forEach(function (row, index) {
      var button = row.querySelector(".pview");
      if (!button) return;
      if (button.textContent !== "修改配置") button.textContent = "修改配置";
      if (button.hasAttribute("data-occ-view-detail")) button.removeAttribute("data-occ-view-detail");
      if (button.hasAttribute("data-occ-modify-order")) button.removeAttribute("data-occ-modify-order");
      if (button.dataset.lxModifyConfig !== "1") button.dataset.lxModifyConfig = "1";
      if (button.dataset.lxItemIndex !== String(index)) button.dataset.lxItemIndex = String(index);
    });
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-lx-modify-config]");
    if (trigger) { event.preventDefault(); event.stopImmediatePropagation(); openConfig(trigger); return; }
    var mask = event.target.closest("." + MODAL_CLASS);
    if (!mask) return;
    if (event.target.closest("[data-lx-config-back]")) { closeConfig(mask, false); return; }
    if (event.target.closest("[data-lx-config-close]")) { closeConfig(mask, true); return; }
    var skuButton = event.target.closest("[data-lx-config-sku]");
    if (skuButton) {
      renderChoices(mask, mask._lxConfigMetas || [], skuButton.dataset.lxConfigSku);
      return;
    }
    var colorButton = event.target.closest("[data-lx-config-color]");
    if (colorButton) {
      var metas = mask._lxConfigMetas || [];
      var current = metas.find(function (meta) { return String(meta.variant.sku) === String(mask.dataset.selectedSku); });
      var target = metas.find(function (meta) { return meta.color === colorButton.dataset.lxConfigColor && (!current || meta.label === current.label); }) || metas.find(function (meta) { return meta.color === colorButton.dataset.lxConfigColor; });
      mask.dataset.selectedColor = colorButton.dataset.lxConfigColor || "";
      if (target) {
        renderChoices(mask, metas, target.variant.sku);
      } else {
        mask.querySelectorAll("[data-lx-config-color]").forEach(function (button) {
          button.classList.toggle("is-selected", button === colorButton);
        });
      }
      return;
    }
    if (event.target.closest("[data-lx-config-save]")) {
      var context = mask._lxConfigContext;
      var selected = (mask._lxConfigMetas || []).find(function (meta) { return String(meta.variant.sku) === String(mask.dataset.selectedSku); });
      if (!context || !selected) return;
      var oldItem = context.items[context.index] || {};
      var variant = selected.variant;
      var oldDiscount = Math.max(0, Number(oldItem.original_price || oldItem.price || 0) - Number(oldItem.price || 0));
      var newOriginal = Number(variant.price || variant.sale_price || oldItem.original_price || oldItem.price || 0);
      var updated = Object.assign({}, oldItem, variant, {
        sku: variant.sku || oldItem.sku,
        name: variant.name || oldItem.name,
        image_url: variant.image_url || variant.image || oldItem.image_url,
        original_price: newOriginal,
        price: Math.max(0, newOriginal - oldDiscount),
        colorLabel: mask.dataset.selectedColor || selected.color || oldItem.colorLabel || "",
        configurationLabel: selected.label || oldItem.configurationLabel || oldItem.configLabel || "",
        specs: variant.specs || oldItem.specs
      });
      selectionStore["item-" + context.index] = {
        sku: updated.sku,
        configurationLabel: updated.configurationLabel,
        colorLabel: updated.colorLabel
      };
      var previousOrderDiscount = Math.max(0, Number(context.pending.original_price || 0) - Number(context.pending.price || 0));
      context.items[context.index] = updated;
      context.pending.items = context.items;
      context.pending.sku = context.items[0].sku;
      context.pending.name = context.items.length > 1 ? context.items[0].name + "等" + context.items.length + "件商品" : updated.name;
      context.pending.image_url = context.items[0].image_url;
      context.pending.original_price = context.items.reduce(function (sum, product) { return sum + Number(product.original_price || product.price || 0); }, 0);
      context.pending.price = Math.max(0, context.pending.original_price - previousOrderDiscount);
      context.pending.payable = Math.max(0, context.pending.price - (context.pending.subsidyClaimed ? Number(context.pending.subsidyAmount || 0) : 0));
      closeConfig(mask, false);
      if (window.__lxAgentAPI && typeof window.__lxAgentAPI.lxOpenPendingPaymentModal === "function") window.__lxAgentAPI.lxOpenPendingPaymentModal();
      [0, 40, 120, 260].forEach(function (delay) {
        window.setTimeout(function () {
          if (typeof window.__lxSyncOrderConfigSummary === "function") window.__lxSyncOrderConfigSummary();
        }, delay);
      });
    }
  }, true);

  installStyle();
  syncButtons();
  var syncQueued = false;
  new MutationObserver(function () {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(function () {
      syncQueued = false;
      syncButtons();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

;


;/* public/leaip0/assets/frontend/js/core/product-detail-benefits-v198.js */
(function () {
  "use strict";

  if (window.__lxProductDetailBenefitsV182) return;
  window.__lxProductDetailBenefitsV182 = true;

  function numberFrom(value) {
    var matches = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
    if (!matches || !matches.length) return 0;
    return Math.round(Number(matches[matches.length - 1]) || 0);
  }

  function format(value) {
    return Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  }

  function currentPrice(detail) {
    var active = detail.querySelector('.lx-spu-chip.is-active [class*="price"], .lx-spu-chip.is-active[data-detail-price-value]');
    var activeValue = active && (active.getAttribute("data-detail-price-value") || active.textContent);
    var source = activeValue || (detail.querySelector("[data-detail-price] .detail-price-main, [data-detail-price], .detail-price-main, .detail-price") || {}).textContent;
    return numberFrom(source);
  }

  function couponFor(price) {
    if (price >= 8000) return { threshold: 8000, reduction: 500 };
    if (price >= 5000) return { threshold: 5000, reduction: 300 };
    if (price >= 3000) return { threshold: 3000, reduction: 200 };
    return { threshold: 1000, reduction: 100 };
  }

  function ensureNode(detail) {
    var info = detail.querySelector(".detail-info");
    if (!info) return null;
    var node = info.querySelector(".lx-detail-benefits-v182");
    if (!node) {
      node = document.createElement("section");
      node.className = "lx-detail-benefits-v182";
      node.setAttribute("aria-label", "商品价格与优惠");
    }
    var priceNode = info.querySelector("[data-detail-price], .detail-price");
    var reason = info.querySelector(".detail-fit-reason");
    var summary = info.querySelector(".detail-summary");
    if (priceNode) priceNode.hidden = true;
    if (summary && summary.nextElementSibling !== node) summary.insertAdjacentElement("afterend", node);
    else if (!summary && reason && reason.previousElementSibling !== node) info.insertBefore(node, reason);
    else if (!summary && !reason && !node.isConnected) info.appendChild(node);
    return node;
  }

  function priceLabel(detail) {
    var path = window.location.pathname;
    if (/^\/b-chat(?:\/|$)/.test(path)) return "企业价";
    if (/^\/biz-chat(?:\/|$)/.test(path)) return "惠采价";
    if (/^\/shop-chat(?:\/|$)/.test(path) && detail) {
      var title = detail.querySelector("[data-detail-title], .detail-title");
      var name = String(title && title.textContent || "").replace(/\s+/g, "");
      if (/天逸|GeekPro|刃7000|小新27.*一体机/i.test(name)) return "预估到手";
    }
    return "国补后";
  }

  function renderBuybar(detail, finalPrice, sourcePrice) {
    var bar = detail.querySelector(".lx-buybar") || document.querySelector(".lx-buybar");
    var priceNode = bar && bar.querySelector(".lx-buybar-info b");
    if (!priceNode) return;
    var label = priceLabel(detail);
    if (priceNode.dataset.sourcePrice === String(sourcePrice) && priceNode.dataset.priceLabel === label) return;
    priceNode.dataset.priceLabel = label;
    priceNode.dataset.sourcePrice = String(sourcePrice);
    priceNode.innerHTML = '<small>' + label + '</small><span>¥' + format(finalPrice) + '</span><del class="lx-buybar-original-price" aria-label="原价 ' + format(sourcePrice) + ' 元">¥' + format(sourcePrice) + "</del>";
  }

  function placeServiceAboveActions(detail) {
    var service = detail.querySelector(".detail-service");
    var actions = detail.querySelector(".detail-actions");
    if (!service || !actions || service.parentNode !== actions.parentNode) return;
    if (service.nextElementSibling !== actions) actions.parentNode.insertBefore(service, actions);
  }

  function productSku(detail) {
    var stateProduct = window.__lxState && window.__lxState.currentProduct;
    var node = detail.querySelector("[data-product-sku], [data-sku], [data-product-id]");
    return String(
      (stateProduct && (stateProduct.sku || stateProduct.id || stateProduct.product_id)) ||
      (node && (node.dataset.productSku || node.dataset.sku || node.dataset.productId)) ||
      ""
    ).replace(/[^0-9A-Za-z_-]/g, "");
  }

  function renderProductCode(detail) {
    var actions = detail.querySelector(".detail-actions");
    if (!actions || !actions.parentNode) return;
    var sku = productSku(detail);
    if (!sku) return;
    var displaySku = /^\d+$/.test(sku) ? sku.padStart(8, "0") : sku;
    var code = detail.querySelector(".lx-detail-product-code-v188");
    if (!code) {
      code = document.createElement("p");
      code.className = "lx-detail-product-code-v188";
    }
    if (code.dataset.sku !== sku) {
      code.dataset.sku = sku;
      code.innerHTML = '<span>商品编号：</span><strong>LX-' + displaySku + "</strong>";
    }
    if (actions.nextElementSibling !== code) actions.insertAdjacentElement("afterend", code);
  }

  function syncArrivalButtonCopy(detail) {
    if (!/^\/shop-chat(?:\/|$)/.test(window.location.pathname)) return;
    var title = detail.querySelector("[data-detail-title], .detail-title");
    var name = String(title && title.textContent || "").replace(/\s+/g, "");
    var isTarget = /^(?:联想)?天逸510Pro$/i.test(name);
    detail.querySelectorAll(".detail-actions .detail-primary").forEach(function (button) {
      if (isTarget && button.textContent.trim() === "一键领优惠下单") {
        button.dataset.arrivalOriginalCopy = button.textContent;
        button.textContent = "到货通知";
        if (button.hasAttribute("aria-label")) {
          button.dataset.arrivalOriginalAria = button.getAttribute("aria-label");
          button.setAttribute("aria-label", "到货通知");
        }
      } else if (!isTarget && button.dataset.arrivalOriginalCopy) {
        if (button.textContent.trim() === "到货通知") button.textContent = button.dataset.arrivalOriginalCopy;
        if (button.dataset.arrivalOriginalAria) button.setAttribute("aria-label", button.dataset.arrivalOriginalAria);
        delete button.dataset.arrivalOriginalCopy;
        delete button.dataset.arrivalOriginalAria;
      }
    });
  }

  function syncT14SupportCopy(detail) {
    var path = String(window.__LX_TEMPLATE_PATH || location.pathname || "").replace(/\/+$/, "");
    var title = detail.querySelector("[data-detail-title], .detail-title");
    var name = String(title && title.textContent || "").replace(/\s+/g, "");
    var isTarget = path === "/b-chat" && /^(?:联想)?ThinkPadT14$/i.test(name);
    detail.querySelectorAll(".detail-actions .detail-primary").forEach(function(button) {
      if (isTarget && button.textContent.trim() === "一键领优惠下单") {
        button.dataset.t14OriginalCopy = button.textContent;
        button.textContent = "咨询客服";
        if (button.hasAttribute("aria-label")) {
          button.dataset.t14OriginalAria = button.getAttribute("aria-label");
          button.setAttribute("aria-label", "咨询客服");
        }
      } else if (!isTarget && button.dataset.t14OriginalCopy) {
        if (button.textContent.trim() === "咨询客服") button.textContent = button.dataset.t14OriginalCopy;
        if (button.dataset.t14OriginalAria) button.setAttribute("aria-label", button.dataset.t14OriginalAria);
        delete button.dataset.t14OriginalCopy;
        delete button.dataset.t14OriginalAria;
      }
    });
  }

  function render(detail) {
    if (!detail || !detail.isConnected) return;
    syncArrivalButtonCopy(detail);
    syncT14SupportCopy(detail);
    placeServiceAboveActions(detail);
    renderProductCode(detail);
    var price = currentPrice(detail);
    if (!price) return;
    var node = ensureNode(detail);
    if (!node) return;
    var subsidy = Math.min(2000, Math.round(price * 0.15));
    var finalPrice = Math.max(0, price - subsidy);
    renderBuybar(detail, finalPrice, price);
    var label = priceLabel(detail);
    if (node.dataset.sourcePrice === String(price) && node.dataset.priceLabel === label && node.childElementCount) return;
    node.dataset.priceLabel = label;
    node.dataset.sourcePrice = String(price);
    node.innerHTML =
      '<div class="lx-detail-benefits-price"><span class="lx-detail-benefits-label">' + label + '</span>' +
      '<strong><span>¥</span>' + format(finalPrice) + '</strong>' +
      '<del class="lx-detail-benefits-original-price" aria-label="原价 ' + format(price) + ' 元">¥' + format(price) + '</del></div>';
  }

  var pending = false;
  function sync() {
    pending = false;
    document.querySelectorAll(".product-detail").forEach(render);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener("lx:product-detail-rendered", schedule);
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest(".lx-spu-chip, [data-detail-price-value]")) {
      setTimeout(schedule, 0);
      setTimeout(schedule, 120);
    }
  }, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();

;


;/* public/leaip0/assets/frontend/js/core/product-detail-review-tab-v203.js */
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
    // Repair old homepage detail snapshots without replacing product or conversation state.
    if (/^\/$/.test(location.pathname)) document.querySelectorAll('.product-detail').forEach(function(detail) {
      detail.querySelectorAll('.detail-badges, .detail-service, .detail-reviews-section').forEach(function(node) { node.remove(); });
      var gallery = detail.querySelector('.detail-gallery');
      var visual = gallery && gallery.querySelector('.detail-visual');
      if (visual && !gallery.querySelector('.detail-trustline')) {
        var trust = document.createElement('p');
        trust.className = 'detail-trustline';
        trust.innerHTML = '<strong>「放心购」</strong><span>官方正品 · 14天无忧退换 · 180天只换不修</span>';
        visual.insertAdjacentElement('afterend', trust);
      }
    });
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
  if (location.pathname === '/') {
    var pending = false;
    new MutationObserver(function() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function() { pending = false; ensureReviewTab(); });
    }).observe(document.documentElement, {childList:true, subtree:true});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureReviewTab, { once: true });
  else ensureReviewTab();
})();

;

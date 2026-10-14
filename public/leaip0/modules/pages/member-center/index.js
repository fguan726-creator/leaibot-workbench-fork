/* 我的会员中心 — P0 business implementations. */
if (!window.__p0Modules.installed["pages/member-center"]) {
window.__p0Modules.installed["pages/member-center"]=true;

/* public/leaip0/assets/frontend/js/components/member-service-clean-v45.js */
window.__p0Modules.sources["uf6422dbb0508c86d"]=function(){
(function () {
  "use strict";

  var memberRuntimeScriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  var memberAssetsBaseUrl = new URL("../../../", memberRuntimeScriptUrl);

  function resolveMemberAssetUrl(value) {
    return typeof value === "string" && value.indexOf("/assets/") === 0
      ? new URL(value.slice("/assets/".length), memberAssetsBaseUrl).href
      : value;
  }

  function repairMemberAssetUrls(root) {
    if (!root || root.nodeType !== 1) return;
    var nodes = root.matches && root.matches("img[src], source[src], source[srcset]") ? [root] : [];
    if (root.querySelectorAll) nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll("img[src], source[src], source[srcset]")));
    nodes.forEach(function (node) {
      ["src", "srcset"].forEach(function (attribute) {
        var value = node.getAttribute(attribute);
        var resolved = resolveMemberAssetUrl(value);
        if (resolved !== value) node.setAttribute(attribute, resolved);
      });
    });
  }

  var memberAssetObserver = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "attributes") repairMemberAssetUrls(record.target);
      Array.prototype.forEach.call(record.addedNodes || [], repairMemberAssetUrls);
    });
  });
  if (document.body) memberAssetObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset"] });

  var icons = {
    next: "/assets/icons/global-next.svg",
    compactChevron: "/assets/icons/global-expand.svg",
    expand: "/assets/icons/global-expand.svg",
    check: "/assets/icons/global-check.svg",
    calendar: "/assets/icons/member-checkin-calendar-v36.svg",
    edit: "/assets/icons/member-edit-figma-v36.svg",
    sparkle: "/assets/icons/global-sparkle.svg",
    memberSparkle: "/assets/icons/member-sparkle-gradient-v36.svg",
    account: "/assets/icons/mall-account.svg",
    membership: "/assets/icons/shortcut-membership.svg",
    rewards: "/assets/icons/shortcut-rewards.svg",
    customization: "/assets/icons/shortcut-customization.svg",
    trial: "/assets/icons/shortcut-trial.svg",
    referrals: "/assets/icons/shortcut-referrals.svg",
    support: "/assets/icons/shortcut-support.svg",
    crown: "/assets/icons/member-level-crown-v36.svg"
  };

  var state = {
    modalType: "",
    rightView: "",
    rightTabs: [],
    rightViewDisplayMode: {},
    sugKey: "",
    serviceCompare: [],
    serviceRecommended: "",
    serviceMode: "cleaning",
    serviceDeviceId: "",
    serviceSelectedId: "thermal",
    serviceDetailContext: {},
    serviceBuyRunning: false,
    pendingServiceOrder: null,
    serviceOrder: null,
    servicePurchaseStatus: "未购买",
    serviceAppointmentStatus: "未预约",
    requestSequence: 0,
    educationAudience: "college",
    educationMethod: "edu",
    educationPath: "",
    memberCheckedIn: false,
    pendingDeviceBound: false,
    recentDeviceId: "",
    deviceFilter: "all",
    assetFilters: { points: "all", coupons: "all", vouchers: "all", redpacket: "all" },
    assetPeriods: { points: "6m", coupons: "all", vouchers: "all", redpacket: "all" },
    deviceFocusId: "",
    deviceListScrollTop: 0,
    warrantyDevicePickerOpen: false,
    couponDetailsOpen: {},
    assetRuleOpen: {},
    profileTarget: "",
    profilePhoneStatus: "",
    profile: { nickname: "联小想", gender: "secret", birthday: "1998-05-18", phone: "182****4919", customAvatar: "", avatar: "membership" },
    serviceContext: { device: "拯救者游戏本", region: "北京" },
    identityStatus: { student: "unverified" },
    submitted: { student: false, purchase: false, appointment: false }
  };
  var embeddedHost = null;
  var embeddedListenersBound = false;
  var labListenersBound = false;
  var benefitPointsUrl = "https://activity.lenovo.com.cn/sales/quanyidian.html";
  var educationHomeUrl = "https://shop.lenovo.com.cn/page/xs/jyth.html";
  var educationRecommendationQuery = "推荐教育优惠商品";

  var studentAuthStorageKey = "lexiang.student.v2";
  var studentAuthReviewMs = 12000;

  function syncStudentAuthState() {
    var stored;
    try {
      stored = JSON.parse(window.localStorage.getItem(studentAuthStorageKey) || "null");
    } catch (error) {
      return false;
    }
    if (!stored || typeof stored !== "object") return false;
    if (stored.status === "pending" && !stored.demo && stored.submittedAt && Date.now() - Number(stored.submittedAt) >= studentAuthReviewMs) {
      stored.status = "verified";
      try { window.localStorage.setItem(studentAuthStorageKey, JSON.stringify(stored)); } catch (error) {}
    }
    var nextStatus = stored.status === "verified" ? "verified" : stored.status === "pending" ? "reviewing" : "unverified";
    if (state.identityStatus.student === nextStatus) return false;
    state.identityStatus.student = nextStatus;
    return true;
  }

  function refreshStudentAuthState() {
    if (!syncStudentAuthState()) return;
    if (state.rightView === "member") refreshRightView();
  }

  var serviceCatalog = {
    clean: { id: "clean", name: "笔记本深度清灰", tag: "深度清灰", description: "拆机深度清洁，包含风扇、主板、键盘与机身表面等部位。", price: "¥169起", image: "/assets/img/shop-8.jpg", scope: "适用于多数联想笔记本；使用超过 5 年或存在进液、异物、磕碰时需先检测。" },
    thermal: { id: "thermal", name: "深度清灰 + 更换硅脂", tag: "清灰换硅", description: "在深度清灰基础上更换散热硅脂，并完成清洁后开机检测。", price: "¥299起", image: "/assets/img/shop-1.jpg", scope: "适合游戏本或散热压力较高的设备；具体可用性以设备型号和门店能力为准。" },
    care: { id: "care", name: "整机清洁保养服务", tag: "日常保养", description: "完成外观、键盘、接口和散热风道基础清洁，并提供设备健康检查。", price: "¥129起", image: "/assets/img/shop-13.jpg", scope: "适用于日常清洁保养；拆机项目、配件更换和故障维修需根据设备检测结果另行确认。" },
    appointment: { id: "appointment", name: "深度清灰预约", tag: "购买后服务", description: "已购买对应服务的用户，可按订单与设备进入预约与履约查询。", price: "需先校验订单", image: "/assets/img/shop-13.jpg", scope: "仅对已购买且仍可履约的服务订单开放，需选择可服务门店和时段。" }
  };
  var warrantyCatalog = {
    warrantyYear1: { id: "warrantyYear1", name: "一年整机延保", tag: "整机延保", description: "在当前基础保修到期后，延长 1 年整机保修服务。", price: "¥399起", image: "/assets/img/shop-7.jpg", scope: "适用于当前账号已绑定且尚在可购买期内的拯救者 Y7000P；以实时 SKU 校验为准。" },
    warrantyYear2: { id: "warrantyYear2", name: "两年整机延保", tag: "长期保障", description: "连续延长 2 年整机保修，适合计划长期使用的设备。", price: "¥699起", image: "/assets/img/thinkbook.jpg", scope: "需同时满足设备型号、购买时间与当前保障状态条件；以服务商品系统结果为准。" },
    warrantyDoor: { id: "warrantyDoor", name: "延保 + 上门服务升级", tag: "延保升级", description: "延长保修期，并增加指定地区上门服务权益。", price: "¥899起", image: "/assets/img/shop-8.jpg", scope: "上门范围、服务次数与可购买性需根据设备所在地区再次校验。" }
  };

  var memberAssets = {
    points: {
      pattern: /乐豆/,
      label: "乐豆",
      answer: "你当前有<strong>2,580 乐豆</strong>。近 30 天获得 860、使用 300；明细已在右侧打开。",
      cardDescription: "余额 2,580 · 近 30 天 +860 / -300"
    },
    coupons: {
      pattern: /优惠券/,
      label: "优惠券",
      answer: "你当前有<strong>3 张优惠券</strong>，其中 1 张将在 7 天后到期；可用券详情已在右侧打开。",
      cardDescription: "3 张可用 · 1 张即将到期"
    },
    vouchers: {
      pattern: /代金券/,
      label: "代金券",
      answer: "你当前有<strong>2 张代金券</strong>，分别为教育认证代金券和以旧换新补贴券；详情已在右侧打开。",
      cardDescription: "2 张可用 · 教育/换新场景"
    },
    redpacket: {
      pattern: /红包/,
      label: "限时红包",
      answer: "你当前有<strong>2 个限时红包</strong>，最近 1 个将在明日到期；详情已在右侧打开。",
      cardDescription: "2 个可用 · 最近 1 个明日到期"
    },
    benefitpoints: {
      pattern: /权益点/,
      label: "权益点",
      answer: "你当前有<strong>1,200 权益点</strong>，可用于兑换指定会员服务；明细已在右侧打开。",
      cardDescription: "1,200 权益点 · 可兑换会员服务"
    }
  };

  var couponCatalog = [
    { id: "service-clean-30", value: "¥30", title: "会员专享清洁保养券", validFrom: "2026.08.01 00:00", validTo: "2026.09.01 23:59", description: "指定笔记本清灰、清洁保养服务商品满 299 元可用。", status: "available", productSkus: ["SERVICE-PASTE-299", "SERVICE-CLEAN-169"] },
    { id: "education-300", value: "¥300", title: "教育认证专享代金券", validFrom: "2026.08.01 00:00", validTo: "2026.09.30 23:59", description: "已完成教育认证的用户购买指定教育优惠商品时可用。", status: "available", productSkus: ["EDU-XIAOXIN-5499", "EDU-YOGA-6999"] },
    { id: "accessory-20", value: "¥20", title: "会员配件满 199 减 20", validFrom: "2026.08.10 00:00", validTo: "2026.09.10 23:59", description: "购买指定联想原装配件，订单金额满 199 元可用。", status: "available", productSkus: ["EDU-THINKPLUS-399"] },
    { id: "member-day-50", value: "¥50", title: "会员日满 999 减 50", validFrom: "2026.08.01 00:00", validTo: "2026.08.18 23:59", description: "会员日指定商品订单满 999 元可用。", status: "used", productSkus: [] },
    { id: "new-product-100", value: "¥100", title: "新品首发满 3000 减 100", validFrom: "2026.07.01 00:00", validTo: "2026.07.31 23:59", description: "指定新品首发活动订单满 3000 元可用。", status: "expired", productSkus: [] }
  ];

  var couponProductCatalog = {
    "SERVICE-CLEAN-169": { sku: "SERVICE-CLEAN-169", name: "笔记本深度清灰", price: 169, image_url: "/assets/img/shop-1.jpg", description: "拆机深度清洁风扇、主板、键盘与机身表面。", promotion_tags: ["服务商品"], official: true, type: "product", commerceType: "service-product", category: "服务产品" },
    "SERVICE-PASTE-299": { sku: "SERVICE-PASTE-299", name: "深度清灰 + 更换硅脂", price: 299, image_url: "/assets/img/shop-2.jpg", description: "完成深度清灰、更换散热硅脂与开机检测。", promotion_tags: ["服务商品"], official: true, type: "product", commerceType: "service-product", category: "服务产品" },
    "EDU-XIAOXIN-5499": { sku: "EDU-XIAOXIN-5499", name: "小新 Pro 14 教育优惠款", price: 5499, image_url: "/assets/img/shop-2.jpg", description: "适合学习、创作与日常办公的轻薄性能本。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "笔记本" },
    "EDU-YOGA-6999": { sku: "EDU-YOGA-6999", name: "YOGA Air 14s 教育优惠款", price: 6999, image_url: "/assets/img/shop-8.jpg", description: "兼顾便携、屏幕表现与 AI 学习场景。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "笔记本" },
    "EDU-THINKPLUS-399": { sku: "EDU-THINKPLUS-399", name: "ThinkPlus 教育办公配件套装", price: 399, image_url: "/assets/img/shop-10.jpg", description: "键鼠与扩展配件组合，适合宿舍和课堂使用。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "配件" }
  };

  var deviceCatalog = {
    thinkbook16p: {
      id: "thinkbook16p",
      name: "ThinkBook 16p",
      product: "ThinkBook 16p Gen 5",
      sn: "PF4X****",
      image: "/assets/img/thinkbook.jpg",
      warranty: "基础保修至 2027-08-30",
      purchased: "2025-03-25",
      service: "保障中"
    },
    legiony7000p: {
      id: "legiony7000p",
      name: "拯救者 Y7000P",
      product: "Legion Y7000P 2025",
      sn: "MP2G****",
      image: "/assets/img/shop-7.jpg",
      warranty: "基础保修至 2027-05-18",
      purchased: "2025-05-18",
      service: "可购买延保服务",
      maintenanceReason: "购机保障节点",
      extensionEligible: true
    },
    yogaair14s: {
      id: "yogaair14s",
      name: "YOGA Air 14s",
      product: "YOGA Air 14s AI 元启",
      sn: "YN3A****",
      image: "/assets/img/shop-8.jpg",
      warranty: "基础保修至 2026-11-06",
      purchased: "2024-11-06",
      service: "保障中"
    },
    thinkpadt14: {
      id: "thinkpadt14",
      name: "ThinkPad T14",
      product: "ThinkPad T14 Gen 6",
      sn: "PC3K****",
      image: "/assets/img/thinkpad.jpg",
      warranty: "基础保修至 2027-02-16",
      purchased: "2025-02-16",
      service: "企业服务可用"
    },
    xiaoxinpro14: {
      id: "xiaoxinpro14",
      name: "小新 Pro 14",
      product: "小新 Pro 14 2025",
      sn: "PF6N****",
      image: "/assets/img/shop-2.jpg",
      warranty: "基础保修至 2026-10-08",
      purchased: "2024-10-08",
      service: "保障中"
    },
    tianyi510s: {
      id: "tianyi510s",
      name: "天逸 510S",
      product: "天逸 510S 台式电脑",
      sn: "MJ0A****",
      image: "/assets/img/shop-4.jpg",
      warranty: "基础保修至 2026-08-22",
      purchased: "2023-08-22",
      service: "可购买延保服务",
      maintenanceReason: "临近保修到期",
      extensionEligible: true
    },
    motorazr60: {
      id: "motorazr60",
      name: "moto razr 60",
      product: "moto razr 60 折叠屏",
      sn: "ZY2K****",
      image: "/assets/img/shop-13.jpg",
      warranty: "基础保修至 2027-06-02",
      purchased: "2026-06-02",
      service: "保障中"
    },
    xiaoxinpadpro: {
      id: "xiaoxinpadpro",
      name: "小新 Pad Pro",
      product: "小新 Pad Pro 12.7",
      sn: "HA1D****",
      image: "/assets/img/shop-10.jpg",
      warranty: "基础保修至 2027-01-12",
      purchased: "2025-01-12",
      service: "保障中"
    }
  };
  var devicePreviewLimit = 6;
  var deviceAliases = {
    thinkbook16p: ["thinkbook16p", "thinkbook 16p", "think book 16p"],
    legiony7000p: ["拯救者y7000p", "拯救者 y7000p", "legiony7000p", "legion y7000p", "y7000p"],
    yogaair14s: ["yogaair14s", "yoga air 14s", "air14s", "air 14s"],
    thinkpadt14: ["thinkpadt14", "thinkpad t14", "think pad t14"],
    xiaoxinpro14: ["小新pro14", "小新 pro 14"],
    tianyi510s: ["天逸510s", "天逸 510s"],
    motorazr60: ["motorazr60", "moto razr 60", "razr60", "razr 60"],
    xiaoxinpadpro: ["小新padpro", "小新 pad pro", "padpro", "pad pro"]
  };
  var pendingPurchasedDevice = {
    id: "xiaoxinpro16",
    name: "小新 Pro 16",
    product: "小新 Pro 16 2026",
    sn: "PF8Q****",
    image: "/assets/img/shop-2.jpg",
    warranty: "基础保修至 2028-08-12",
    purchased: "2026-08-12",
    service: "保障中"
  };

  var ledouCatalog = [
    { id: "organizer", name: "乐享桌面收纳套装", price: "¥19.9 + 1,000 乐豆", icon: icons.rewards, description: "桌面线材与小物分类收纳，适合家庭和办公桌面。" },
    { id: "nightlight", name: "便携氛围小夜灯", price: "¥13.9 + 600 乐豆", icon: icons.customization, description: "便携柔光照明，适合床头、桌面和差旅使用。" },
    { id: "mouse", name: "无线静音鼠标", price: "¥113 + 600 乐豆", icon: icons.trial, description: "静音按键与无线连接，适合日常移动办公。" }
  ];

  var copy = {
    student: {
      title: "教育认证",
      description: "选择身份与认证方式，补齐对应材料后提交。审核结果以教育认证服务回执为准。",
      button: "立即认证",
      query: "我想办理学生教育认证"
    },
    purchase: {
      title: "确认购买服务",
      description: "请核对服务、设备、地区与价格。提交后以服务商品系统回执为准。",
      submitLabel: "确认购买",
      fields: [
        ["服务商品", "select", ["深度清灰 + 更换硅脂"]],
        ["服务设备", "select", ["拯救者游戏本"]],
        ["服务地区", "select", ["北京"]],
        ["参考价格", "select", ["¥299起"]]
      ]
    },
    appointment: {
      title: "确认服务预约",
      description: "请核对已购服务、服务门店与到店时段。预约结果以履约系统回执为准。",
      submitLabel: "确认预约",
      fields: [
        ["已购服务", "select", ["深度清灰 + 更换硅脂"]],
        ["服务门店", "select", ["联想智生活北京中关村店", "联想智生活北京国贸店"]],
        ["到店时段", "select", ["8 月 16 日 10:00–12:00", "8 月 16 日 14:00–16:00"]]
      ]
    },
    deviceBind: {
      title: "绑定新设备",
      description: "填写设备序列号与名称。绑定结果以设备资产服务回执为准。",
      submitLabel: "确认绑定",
      fields: [
        ["设备序列号（SN）", "input", "请输入设备 SN"],
        ["设备名称", "input", "例如：工作用 ThinkPad"],
        ["购买渠道", "select", ["联想官网", "联想官方商城", "线下门店", "其他渠道"]]
      ]
    }
  };

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function el(selector) {
    if (embeddedHost) {
      if (embeddedHost.matches && embeddedHost.matches(selector)) return embeddedHost;
      var scoped = embeddedHost.querySelector(selector);
      if (scoped) return scoped;
    }
    return document.querySelector(selector);
  }

  function ensureShell() {
    var composer = el(".assistant-panel .composer");
    var textarea = composer && composer.querySelector("textarea");
    var chat = el(".assistant-panel .chat-state");
    var content = el(".shell > .content");
    if (!composer || !textarea || !chat || !content) return null;

    if (!el("#leaiSug")) {
      var sug = document.createElement("section");
      sug.id = "leaiSug";
      sug.className = "leai-sug";
      sug.setAttribute("aria-live", "polite");
      composer.parentNode.insertBefore(sug, composer);
    }
    if (!el("#leaiThread")) chat.innerHTML = '<div class="leai-thread" id="leaiThread"></div>';
    if (!el("#leaiAuiTabs")) {
      content.insertAdjacentHTML("beforeend", '<div class="leai-aui-tabs" id="leaiAuiTabs" hidden></div><div class="leai-aui-view" id="leaiAuiView" hidden></div>');
    }
    if (!el("#leaiModal")) document.body.insertAdjacentHTML("beforeend", modalHtml());
    if (!el("#leaiLab")) document.body.insertAdjacentHTML("beforeend", labHtml());
    return { composer: composer, textarea: textarea, chat: chat, content: content };
  }

  function modalHtml() {
    return '<div class="leai-modal-mask" id="leaiModal" aria-hidden="true">' +
      '<section class="leai-modal" role="dialog" aria-modal="true" aria-labelledby="leaiModalTitle">' +
      '<header class="leai-modal-head"><div><h2 class="leai-modal-title" id="leaiModalTitle"></h2><p class="leai-modal-desc" id="leaiModalDesc"></p></div>' +
      '<button class="leai-modal-close" type="button" data-modal-close>关闭</button></header>' +
      '<form class="leai-modal-body" id="leaiModalForm"></form></section></div>';
  }

  function labHtml() {
    return '<button class="leai-lab-trigger" type="button" id="leaiLabTrigger"><img src="' + icons.sparkle + '" alt="">演示场景</button>' +
      '<aside class="leai-lab" id="leaiLab" aria-hidden="true" aria-label="POC 演示场景与依赖说明">' +
      '<div class="leai-lab-head"><h2 class="leai-lab-title">演示场景</h2><button class="leai-lab-close" type="button" data-lab-close>关闭</button></div>' +
      '<p class="leai-lab-copy">选择场景会回填或发送一条演示 query。SUG 选择本身不发送，办理弹窗仍需用户点击左侧按钮。</p>' +
      '<div class="leai-lab-scenarios">' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="认证" data-demo-mode="draft">输入中 SUG：认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我想打开会员中心" data-demo-mode="send">会员中心右页</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我的设备" data-demo-mode="send">我的设备：会员中心定位</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="points">资产：乐豆筛选</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="coupons">资产：优惠券筛选</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="vouchers">资产：代金券明细</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="redpacket">资产：限时红包明细</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="unverified">教育优惠：未认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="reviewing">教育优惠：认证中</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="verified">教育优惠：已认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我想办理学生教育认证" data-demo-mode="send">学生认证：先按钮后弹窗</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="电脑清灰换硅脂" data-demo-mode="send">清灰换硅脂：直接推荐</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-warranty="single">延保：单设备直接推荐</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-warranty="multiple">延保：多设备先选择</button>' +
      '</div>' +
      '<section class="leai-dependency"><h3>Mock 依赖</h3><dl>' +
      '<dt>会员数据</dt><dd>会员中心服务；权限：登录+用户授权；兜底：不生成个人数据。</dd>' +
      '<dt>设备数据</dt><dd>设备资产服务；依赖 Lenovo ID 与设备绑定关系；SN 仅脱敏展示。</dd>' +
      '<dt>认证状态</dt><dd>教育认证权威服务；弹窗展示前和按钮点击时二次校验。</dd>' +
      '<dt>服务商品</dt><dd>商品/服务系统；清灰、换硅脂直接返回服务商品，延保按可用设备数分流；无结果时转官方入口或人工。</dd>' +
      '<dt>预约渠道</dt><dd>订单仅展示微信小程序衔接；太阳码、门店、时段与预约结果当前均为 Mock。</dd>' +
      '<dt>完成口径</dt><dd>申请、购买、预约与履约均以下游权威回执为准。</dd>' +
      '</dl></section></aside>';
  }

  function boot() {
    var shell = ensureShell();
    if (!shell) return;
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "assistant-collapsed");
    document.body.dataset.state = "default";
    shell.textarea.placeholder = "输入会员或服务问题";
    var replacement = shell.composer.cloneNode(true);
    shell.composer.replaceWith(replacement);
    shell.composer = replacement;
    shell.textarea = replacement.querySelector("textarea");
    shell.textarea.placeholder = "输入会员或服务问题";
    replacement.querySelectorAll(".lx-suggest-panel").forEach(function (node) { node.remove(); });
    new MutationObserver(function () {
      replacement.querySelectorAll(".lx-suggest-panel").forEach(function (node) { node.remove(); });
    }).observe(replacement, { childList: true, subtree: true });

    document.querySelectorAll("[data-quick-placeholder]").forEach(function (button) {
      button.removeAttribute("aria-disabled");
      button.removeAttribute("tabindex");
    });
    var quicks = ["打开会员中心，查看我的会员权益", "我想办理学生教育认证", "我想给拯救者游戏本清灰换硅脂", "教育认证需要准备哪些材料？", "如何预约深度清灰服务？"];
    document.querySelectorAll("[data-quick-placeholder] span").forEach(function (node, index) { node.textContent = quicks[index]; });

    shell.textarea.addEventListener("input", function () { renderSug(shell.textarea.value); });
    shell.composer.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var query = shell.textarea.value.trim();
      if (!query) return;
      shell.textarea.value = "";
      hideSug();
      runQuery(query);
    });
    shell.textarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        shell.composer.requestSubmit();
      }
    });

    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("change", handlePageChange, true);
    document.addEventListener("submit", handlePageSubmit);
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var payload = event.data;
      if (!payload) return;
      if (payload.type === "lexiang:profile-updated" && payload.profile) { Object.assign(state.profile, payload.profile); refreshRightView(); return; }
      if (payload.type === "lexiang:device-bind-success" && payload.deviceId === pendingPurchasedDevice.id) {
        completePurchasedDeviceBindTransition(); return;
      }
      if (payload.type === "lexiang:device-warranty-success" && payload.deviceId) {
        state.serviceMode = "warranty"; state.serviceDeviceId = payload.deviceId; state.warrantyDevicePickerOpen = false;
        state.serviceCompare = []; state.serviceRecommended = "warrantyYear1"; openRightView("service");
      }
    });
    window.__lxCompleteDeviceBind = completePurchasedDeviceBindTransition;
    renderSug("");
  }

  function completePurchasedDeviceBindTransition(){return window.__p0Modules.invoke("modals/device-bind#completePurchasedDeviceBindTransition:0360ede52ebd7b888014bff3",{get ["state"](){return state},get ["pendingPurchasedDevice"](){return pendingPurchasedDevice},get ["deviceCatalog"](){return deviceCatalog},get ["refreshRightView"](){return refreshRightView}},this,arguments);}

  function submitComposerQuery(query, context) {
    var composer = document.querySelector(".assistant-panel .composer");
    var input = composer && composer.querySelector("textarea");
    if (!composer || !input || !query) return false;
    if (context) {
      window.__lxPendingMemberInsight = {
        query: query,
        type: context.type || "",
        source: String(context.source || "").trim()
      };
    }
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    composer.requestSubmit();
    return true;
  }

  function setEducationDemoStatus(status) {
    var next = ["unverified", "reviewing", "verified"].indexOf(status) >= 0 ? status : "unverified";
    state.identityStatus.student = next;
    state.submitted.student = false;
    try {
      if (next === "unverified") window.localStorage.removeItem(studentAuthStorageKey);
      else window.localStorage.setItem(studentAuthStorageKey, JSON.stringify({ status: next === "reviewing" ? "pending" : "verified", submittedAt: Date.now(), demo: true }));
    } catch (error) {}
  }

  function handleClick(event) {
    document.querySelectorAll("[data-ledou-period-menu]").forEach(function (menu) {
      if (!event.target.closest("[data-ledou-period-picker]")) {
        menu.hidden = true;
        var trigger = menu.parentElement.querySelector("[data-ledou-period-trigger]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      }
    });
    if (!event.target.closest("[data-asset-rule-trigger], [data-asset-rule-tooltip]")) {
      document.querySelectorAll("[data-asset-rule-tooltip]:not([hidden])").forEach(function (tooltip) {
        tooltip.hidden = true;
        tooltip.setAttribute("aria-hidden", "true");
      });
      document.querySelectorAll("[data-asset-rule-trigger][aria-expanded=true]").forEach(function (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        state.assetRuleOpen[trigger.dataset.assetRuleTrigger] = false;
      });
    }
    var benefit = event.target.closest("[data-member-benefit]");
    document.querySelectorAll(".leai-benefit-detail-tooltip[data-benefit-portal-owner]").forEach(function (tip) {
      var ownerKey = tip.getAttribute("data-benefit-portal-owner");
      var owner = document.querySelector('[data-member-benefit="' + ownerKey + '"]');
      if (!benefit || benefit.getAttribute("data-member-benefit") !== ownerKey) {
        tip.classList.remove("is-portal-open");
        tip.removeAttribute("data-benefit-portal-owner");
        tip.setAttribute("aria-hidden", "true");
        if (owner) owner.appendChild(tip);
        else tip.remove();
      }
    });
    document.querySelectorAll("[data-member-benefit].is-tooltip-open").forEach(function (item) {
      if (item !== benefit) {
        item.classList.remove("is-tooltip-open");
        item.setAttribute("aria-expanded", "false");
      }
    });
    if (benefit) {
      var willOpen = !benefit.classList.contains("is-tooltip-open");
      benefit.classList.toggle("is-tooltip-open", willOpen);
      benefit.setAttribute("aria-expanded", String(willOpen));
      var benefitKey = benefit.getAttribute("data-member-benefit");
      var benefitTip = benefit.querySelector("[role=tooltip]") || document.querySelector('.leai-benefit-detail-tooltip[data-benefit-portal-owner="' + benefitKey + '"]');
      if (benefitTip) {
        benefitTip.setAttribute("aria-hidden", String(!willOpen));
        if (willOpen) {
          var benefitRect = benefit.getBoundingClientRect();
          var tooltipWidth = Math.min(220, window.innerWidth - 24);
          var tooltipLeft = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, benefitRect.left + benefitRect.width / 2 - tooltipWidth / 2));
          var tooltipTop = benefitRect.bottom + 8;
          if (tooltipTop + 132 > window.innerHeight) tooltipTop = Math.max(12, benefitRect.top - 140);
          benefitTip.setAttribute("data-benefit-portal-owner", benefitKey);
          benefitTip.classList.add("is-portal-open");
          document.body.appendChild(benefitTip);
          benefitTip.style.setProperty("--leai-benefit-tooltip-left", tooltipLeft + "px");
          benefitTip.style.setProperty("--leai-benefit-tooltip-top", tooltipTop + "px");
        } else {
          benefitTip.classList.remove("is-portal-open");
          benefitTip.removeAttribute("data-benefit-portal-owner");
          benefit.appendChild(benefitTip);
        }
      }
      return;
    }
    var quick = event.target.closest("[data-quick-placeholder]");
    if (quick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var text = quick.querySelector("span").textContent.trim();
      el(".assistant-panel .composer textarea").value = text;
      el(".assistant-panel .composer").requestSubmit();
      return;
    }
    var sugOption = event.target.closest("[data-sug-value]");
    if (sugOption) { applySug(sugOption.dataset.sugValue, sugOption.dataset.sugNext || ""); return; }
    if (event.target.closest("[data-sug-close]")) { hideSug(); return; }
    var closeTab = event.target.closest("[data-aui-close-view]");
    if (closeTab) { closeRightView(false, closeTab.dataset.auiCloseView); return; }
    var auiTab = event.target.closest("[data-aui-tab]");
    if (auiTab) { activateRightTab(auiTab.dataset.auiTab); return; }
    var profileOpen = event.target.closest("[data-member-profile-open]");
    if (profileOpen) { openProfileEditorModal(profileOpen); return; }
    var profilePhone = event.target.closest("[data-profile-phone-rebind]");
    if (profilePhone) { openPhoneRebindModal(profilePhone); return; }
    var profileAvatar = event.target.closest("[data-profile-avatar]");
    if (profileAvatar) {
      var profileForm = profileAvatar.closest("[data-member-profile-form]");
      profileForm.querySelector("#leaiProfileAvatarValue").value = profileAvatar.dataset.profileAvatar;
      profileForm.querySelectorAll("[data-profile-avatar]").forEach(function (item) {
        var selected = item === profileAvatar;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      return;
    }
    if (event.target.closest("[data-ledou-more]")) { openRightView("ledou"); return; }
    var ledouProduct = event.target.closest("[data-ledou-product]");
    if (ledouProduct) { state.ledouProductOrigin = state.rightView === "ledou" ? "ledou" : "member"; openRightView("ledou-product:" + ledouProduct.dataset.ledouProduct); return; }
    var memberInsight = event.target.closest("[data-member-insight]");
    if (memberInsight) {
      submitComposerQuery(memberInsight.dataset.memberInsightQuery, {
        type: memberInsight.dataset.memberInsight,
        source: (memberInsight.querySelector("[data-member-insight-source]") || {}).textContent || ""
      });
      return;
    }
    var assetRuleTrigger = event.target.closest("[data-asset-rule-trigger]");
    if (assetRuleTrigger) {
      var assetRuleType = assetRuleTrigger.dataset.assetRuleTrigger;
      state.assetRuleOpen[assetRuleType] = !state.assetRuleOpen[assetRuleType];
      refreshRightView();
      return;
    }
    var assetFilter = event.target.closest("[data-asset-filter]");
    if (assetFilter) {
      state.assetFilters[assetFilter.dataset.assetType] = assetFilter.dataset.assetFilter;
      refreshRightView();
      return;
    }
    var ledouPeriodTrigger = event.target.closest("[data-ledou-period-trigger]");
    if (ledouPeriodTrigger) {
      var ledouPeriodMenu = ledouPeriodTrigger.parentElement.querySelector("[data-ledou-period-menu]");
      var ledouPeriodOpen = ledouPeriodMenu.hidden;
      ledouPeriodMenu.hidden = !ledouPeriodOpen;
      ledouPeriodTrigger.setAttribute("aria-expanded", String(ledouPeriodOpen));
      return;
    }
    var ledouPeriodOption = event.target.closest("[data-ledou-period-option]");
    if (ledouPeriodOption) {
      state.assetPeriods.points = ledouPeriodOption.dataset.ledouPeriodOption;
      refreshRightView();
      return;
    }
    var couponDetail = event.target.closest("[data-coupon-detail-toggle]");
    if (couponDetail) {
      var couponDetailId = couponDetail.dataset.couponDetailToggle;
      state.couponDetailsOpen[couponDetailId] = !state.couponDetailsOpen[couponDetailId];
      refreshRightView();
      return;
    }
    var couponProducts = event.target.closest("[data-coupon-products]");
    if (couponProducts) {
      openRightView("coupon-products:" + couponProducts.dataset.couponProducts);
      return;
    }
    var couponProductOpen = event.target.closest("[data-coupon-product-open]");
    if (couponProductOpen) {
      var couponDetailProduct = couponProductCatalog[couponProductOpen.dataset.couponProductOpen];
      if (couponDetailProduct && typeof window.__lxOpenProductFromMember === "function") window.__lxOpenProductFromMember(couponDetailProduct);
      return;
    }
    var couponProductBuy = event.target.closest("[data-coupon-product-buy]");
    if (couponProductBuy) {
      var couponBuyProduct = couponProductCatalog[couponProductBuy.dataset.couponProductBuy];
      if (couponBuyProduct && typeof window.__lxBuyProductFromMember === "function") window.__lxBuyProductFromMember(couponBuyProduct);
      return;
    }
    var memberAsset = event.target.closest("[data-member-asset]");
    if (memberAsset) {
      if (memberAsset.dataset.memberAsset === "benefitpoints") window.open(benefitPointsUrl, "_blank", "noopener,noreferrer");
      else openMemberAsset(memberAsset.dataset.memberAsset, memberAsset);
      return;
    }
    var secondaryBack = event.target.closest("[data-secondary-back]");
    if (secondaryBack) {
      returnFromSecondary(secondaryBack.dataset.secondaryBack || secondaryParentView(state.rightView));
      return;
    }
    var educationBenefit = event.target.closest("[data-education-benefit]");
    if (educationBenefit) {
      if (educationBenefit.dataset.educationBenefit === "coupons") openMemberAsset("coupons", educationBenefit);
      else focusEducationCard();
      return;
    }
    if (event.target.closest("[data-education-recommend]")) {
      submitComposerQuery(educationRecommendationQuery);
      return;
    }
    var selectionOpen = event.target.closest("[data-selection-open]");
    if (selectionOpen) { openRightView("selection:" + selectionOpen.dataset.selectionOpen); return; }
    var deviceFilter = event.target.closest("[data-device-filter]");
    if (deviceFilter) {
      state.deviceFilter = deviceFilter.dataset.deviceFilter;
      state.deviceFocusId = "";
      refreshRightView();
      return;
    }
    var deviceScroll = event.target.closest("[data-device-scroll]");
    if (deviceScroll) { scrollDeviceBrowser(Number(deviceScroll.dataset.deviceScroll)); return; }
    var benefitScroll = event.target.closest("[data-benefit-scroll]");
    if (benefitScroll) { scrollBenefitBrowser(Number(benefitScroll.dataset.benefitScroll)); return; }
    var deviceMore = event.target.closest("[data-device-more]");
    if (deviceMore) { openRightView("devices"); return; }
    var purchasedDeviceBind = event.target.closest("[data-device-bind-purchased]");
    if (purchasedDeviceBind) { runPurchasedDeviceBind(purchasedDeviceBind); return; }
    var deviceWarranty = event.target.closest("[data-device-warranty]");
    if (deviceWarranty) { runWarrantyRecommendation(deviceWarranty.dataset.deviceWarranty); return; }
    var deviceDetail = event.target.closest("[data-device-detail]");
    if (deviceDetail) { openDeviceDetail(deviceDetail.dataset.deviceDetail); return; }
    var memberCheckin = event.target.closest("[data-member-checkin]");
    if (memberCheckin) { runMemberCheckin(memberCheckin); return; }
    var deviceAdd = event.target.closest("[data-device-add]");
    if (deviceAdd) { openModal("deviceBind", deviceAdd); return; }
    var memberTask = event.target.closest("[data-member-task]");
    if (memberTask) { runMemberTask(memberTask.dataset.memberTask, memberTask); return; }
    var serviceDetailResult = event.target.closest("[data-service-detail-result]");
    if (serviceDetailResult) { openServiceDetailView(serviceDetailResult.dataset.serviceDetailResult); return; }
    var serviceDetail = event.target.closest("[data-service-detail]");
    if (serviceDetail) { runServiceDetail(serviceDetail.dataset.serviceDetail); return; }
    var serviceBuy = event.target.closest("[data-service-buy]");
    if (serviceBuy) { startServiceDiscountOrder(serviceBuy.dataset.serviceBuy, serviceBuy); return; }
    var serviceOrderAppointment = event.target.closest("[data-service-order-appointment]");
    if (serviceOrderAppointment) { openRightView("appointment-code"); return; }
    var warrantyDeviceOption = event.target.closest("[data-warranty-device-option]");
    if (warrantyDeviceOption) {
      state.serviceDeviceId = warrantyDeviceOption.dataset.warrantyDeviceOption;
      state.warrantyDevicePickerOpen = false;
      state.serviceCompare = [];
      state.serviceRecommended = "warrantyYear1";
      refreshRightView();
      return;
    }
    if (event.target.closest("[data-warranty-bind-device]")) {
      state.warrantyDevicePickerOpen = false;
      refreshRightView();
      openModal("deviceBind", event.target.closest("[data-warranty-bind-device]"));
      return;
    }
    if (event.target.closest("[data-warranty-open-devices]")) {
      state.warrantyDevicePickerOpen = false;
      if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
      else openRightView("devices");
      return;
    }
    if (event.target.closest("[data-warranty-device-trigger]")) {
      state.warrantyDevicePickerOpen = !state.warrantyDevicePickerOpen;
      refreshRightView();
      return;
    }
    var contextOption = event.target.closest("[data-service-context-option]");
    if (contextOption) {
      state.serviceContext[contextOption.dataset.serviceContextOption] = contextOption.dataset.serviceContextValue;
      openRightView("service");
      return;
    }
    var compare = event.target.closest("[data-service-compare]");
    if (compare) { toggleServiceCompare(compare.dataset.serviceCompare); return; }
    var compareRemove = event.target.closest("[data-compare-remove]");
    if (compareRemove) { toggleServiceCompare(compareRemove.dataset.compareRemove); return; }
    if (event.target.closest("[data-compare-clear]")) { state.serviceCompare = []; refreshRightView(); return; }
    var serviceTask = event.target.closest("[data-service-task]");
    if (serviceTask) { runServiceTask(serviceTask.dataset.serviceTask, serviceTask.dataset.serviceId || ""); return; }
    var studentAudience = event.target.closest("[data-student-audience]");
    if (studentAudience) {
      state.educationAudience = studentAudience.dataset.studentAudience;
      state.educationMethod = state.educationAudience === "exam" ? "verified" : state.educationAudience === "teacher" ? "certificate" : "edu";
      renderStudentModal();
      return;
    }
    var studentMethod = event.target.closest("[data-student-method]");
    if (studentMethod) {
      state.educationMethod = studentMethod.dataset.studentMethod;
      renderStudentModal();
      return;
    }
    var action = event.target.closest("[data-leai-action]");
    if (action) { handleAction(action); return; }
    if (event.target.closest("[data-modal-close]")) { closeModal(); return; }
    if (event.target.id === "leaiModal") { closeModal(); return; }
    if (event.target.closest("#leaiLabTrigger")) { toggleLab(true); return; }
    if (event.target.closest("[data-lab-close]")) { toggleLab(false); return; }
    var assetDemo = event.target.closest("[data-demo-asset]");
    if (assetDemo) {
      var demoAssetType = assetDemo.dataset.demoAsset;
      var demoAssetQueries = { points: "查看我的乐豆明细", coupons: "查看我的优惠券", vouchers: "查看我的代金券", redpacket: "查看我的限时红包" };
      toggleLab(false);
      if (embeddedHost || document.querySelector("#leaiAuiView")) openRightView("asset:" + demoAssetType);
      else submitComposerQuery(demoAssetQueries[demoAssetType]);
      return;
    }
    var educationDemo = event.target.closest("[data-demo-education-status]");
    if (educationDemo) {
      toggleLab(false);
      setEducationDemoStatus(educationDemo.dataset.demoEducationStatus);
      if (embeddedHost || document.querySelector("#leaiAuiView")) focusEducationCard();
      else submitComposerQuery("我想打开会员中心");
      return;
    }
    var warrantyDemo = event.target.closest("[data-demo-warranty]");
    if (warrantyDemo) {
      toggleLab(false);
      window.__lxWarrantyDemoMode = warrantyDemo.dataset.demoWarranty;
      if (embeddedHost || !document.querySelector("#leaiThread")) submitComposerQuery("我想购买延保服务");
      else { resetConversation(); runQuery("我想购买延保服务"); }
      return;
    }
    var demo = event.target.closest("[data-demo-query]");
    if (demo) {
      toggleLab(false);
      if (demo.dataset.demoMode === "draft") {
        var input = el(".assistant-panel .composer textarea");
        input.value = demo.dataset.demoQuery;
        input.focus();
        if (!embeddedHost) renderSug(input.value);
        else input.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (embeddedHost || !document.querySelector("#leaiThread")) submitComposerQuery(demo.dataset.demoQuery);
      else { resetConversation(); runQuery(demo.dataset.demoQuery); }
      return;
    }
    var filter = event.target.closest("[data-service-filter]");
    if (filter) {
      document.querySelectorAll("[data-service-filter]").forEach(function (item) { item.classList.toggle("is-active", item === filter); });
      el("#leaiServiceHint").textContent = filter.dataset.serviceFilter === "fulfillment" ? "已切换到预约/履约视图，请先选择已购服务商品。" : "结果已按“" + filter.textContent.trim() + "”更新。";
      return;
    }
  }

  function handlePageChange(event) {
    var assetPeriod = event.target.closest && event.target.closest("[data-asset-period]");
    if (assetPeriod) {
      state.assetPeriods[assetPeriod.dataset.assetType] = assetPeriod.value;
      refreshRightView();
      return;
    }
    if (event.target.id !== "leaiProfileAvatarFile") return;
    var input = event.target;
    var file = input.files && input.files[0];
    var form = input.closest("[data-member-profile-form]");
    var error = form.querySelector("[data-profile-avatar-error]");
    if (!file) return;
    if (["image/jpeg", "image/png"].indexOf(file.type) < 0) {
      error.textContent = "仅支持 JPG、JPEG、PNG 图片";
      input.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      error.textContent = "图片不能超过 4MB";
      input.value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var source = String(reader.result || "");
      form.querySelector("#leaiProfileCustomAvatarValue").value = source;
      form.querySelectorAll("[data-profile-avatar-preview]").forEach(function (image) { image.src = source; });
      error.textContent = "头像已载入，保存后同步到会员中心（Mock）";
    };
    reader.onerror = function () { error.textContent = "图片读取失败，请重新选择"; };
    reader.readAsDataURL(file);
  }

  function handlePageSubmit(event) {
    var profileForm = event.target.closest && event.target.closest("[data-member-profile-form]");
    if (!profileForm) return;
    event.preventDefault();
    var nickname = profileForm.querySelector("#leaiProfileNickname").value.trim();
    if (!nickname) {
      profileForm.querySelector("#leaiProfileNickname").setCustomValidity("请输入会员昵称");
      profileForm.reportValidity();
      return;
    }
    profileForm.querySelector("#leaiProfileNickname").setCustomValidity("");
    state.profile.nickname = nickname;
    state.profile.gender = profileForm.querySelector("#leaiProfileGender").value;
    state.profile.birthday = profileForm.querySelector("#leaiProfileBirthday").value;
    var avatarPreset = profileForm.querySelector("#leaiProfileAvatarValue");
    if (avatarPreset) state.profile.avatar = avatarPreset.value;
    var customAvatar = profileForm.querySelector("#leaiProfileCustomAvatarValue");
    if (customAvatar) state.profile.customAvatar = customAvatar.value;
    profileForm.querySelector("[data-profile-save-status]").textContent = "个人信息已保存";
    if (profileForm.closest(".is-profile-editor")) { closeModal(); refreshRightView(); }
  }

  function handleKeydown(event) {
    var activeTab = event.target.closest && event.target.closest("[data-aui-tab]");
    if (activeTab && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-aui-tab]"));
      var current = tabs.indexOf(activeTab);
      var next = event.key === "ArrowRight" ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      activateRightTab(tabs[next].dataset.auiTab);
      return;
    }
    var deviceTrack = event.target.closest && event.target.closest("[data-device-track]");
    if (deviceTrack && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      scrollDeviceBrowser(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    var benefitTrack = event.target.closest && event.target.closest("[data-benefit-track]");
    if (benefitTrack && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      scrollBenefitBrowser(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key !== "Escape") return;
    if (el("#leaiModal").classList.contains("is-open")) closeModal();
    else if (el("#leaiLab").classList.contains("is-open")) toggleLab(false);
  }

  function renderSug(raw) {
    var text = String(raw || "").trim();
    if (!text) { hideSug(); return; }
    var config = sugConfig(text);
    if (!config) { hideSug(); return; }
    state.sugKey = config.key;
    var options = config.options.map(function (option, index) {
      return '<button class="leai-sug-option" type="button" data-sug-value="' + escapeHtml(option.value) + '" data-sug-next="' + escapeHtml(option.next || "") + '"><span class="leai-sug-index">' + (index + 1) + '.</span><span>' + escapeHtml(option.label) + '</span></button>';
    }).join("");
    var host = el("#leaiSug");
    host.innerHTML = '<div class="leai-sug-head"><div><p class="leai-sug-kicker">输入中预判</p><p class="leai-sug-question">' + escapeHtml(config.question) + '</p></div><button class="leai-sug-close" type="button" data-sug-close>继续输入</button></div><div class="leai-sug-options">' + options + '</div>';
    host.classList.add("is-visible");
  }

  function sugConfig(text) {
    if (/冒烟|起火|鼓包|进液/.test(text)) return { key: "safety", question: "是否立即查看安全处置建议？", options: [{ label: "查看安全处置建议", value: "我需要查看设备安全处置建议" }, { label: "联系人工客服", value: "我需要联系人工客服" }] };
    if (/认证/.test(text) && !/(学生|教育).*(办理|查询|申请|材料)/.test(text)) return { key: "cert", question: "想先处理哪项教育认证事项？", options: [
      { label: "学生/教育认证", value: "学生教育认证", next: "student" },
      { label: "查询认证状态", value: "我想查询学生教育认证状态" },
      { label: "查看认证材料", value: "教育认证需要哪些材料" }
    ] };
    if (/会员/.test(text) && !/(打开|查看|查询|申请|办理|升级).{0,8}(会员|权益|认证|乐豆|优惠券)/.test(text)) return { key: "member", question: "想处理哪类会员事项？", options: [
      { label: "查会员等级与权益", value: "我想打开会员中心，查看会员等级与权益" },
      { label: "教育优惠/学生认证", value: "学生教育认证", next: "student" },
      { label: "乐豆/优惠券", value: "我想查看乐豆和可用优惠券" }
    ] };
    if (/清灰|保养|换硅脂|服务商品/.test(text) && !/(价格|适用|比较|预约|购买|门店|北京|上海|广州|深圳)/.test(text)) return { key: "clean", question: "想先了解哪项信息？", options: [
      { label: "查看价格", value: "我想查看笔记本深度清灰的价格" },
      { label: "查看适用设备", value: "我想查看深度清灰适用哪些设备" },
      { label: "比较服务内容", value: "我想比较清灰和清灰换硅脂的服务内容" },
      { label: "预约/购买", value: "我想购买并预约笔记本深度清灰服务" },
      { label: "查询可服务门店", value: "我想查询可以做深度清灰的门店" }
    ] };
    if (/服务|售后/.test(text) && text.length < 8) return { key: "service", question: "要处理哪类服务？", options: [
      { label: "设备管理", value: "我想管理已绑定设备" }, { label: "维修服务", value: "我想预约维修" },
      { label: "驱动下载", value: "我想查找并下载驱动" }, { label: "保修/延保", value: "我想查询保修或购买延保" },
      { label: "清灰等服务商品", value: "清灰服务商品" }, { label: "人工客服/留言", value: "我需要联系人工客服" }
    ] };
    return null;
  }

  function applySug(value, next) {
    var input = el(".assistant-panel .composer textarea");
    if (next === "student") { input.value = "学生认证"; renderSecondSug("student"); }
    else { input.value = value; hideSug(); }
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function renderSecondSug(type) {
    var configs = {
      student: ["想先处理什么？", [["了解优惠政策", "我想了解学生教育优惠政策"], ["办理认证", copy.student.query], ["查询认证状态", "我想查询学生教育认证状态"], ["查看适用商品", "我想查看教育特惠适用商品"]]]
    };
    var config = configs[type];
    var host = el("#leaiSug");
    host.innerHTML = '<div class="leai-sug-head"><div><p class="leai-sug-kicker">输入中预判</p><p class="leai-sug-question">' + config[0] + '</p></div><button class="leai-sug-close" type="button" data-sug-close>继续输入</button></div><div class="leai-sug-options">' + config[1].map(function (item, index) {
      return '<button class="leai-sug-option" type="button" data-sug-value="' + escapeHtml(item[1]) + '"><span class="leai-sug-index">' + (index + 1) + '.</span><span>' + escapeHtml(item[0]) + '</span></button>';
    }).join("") + '</div>';
    host.classList.add("is-visible");
  }

  function hideSug() { var host = el("#leaiSug"); if (host) host.classList.remove("is-visible"); }

  function isVerifiedEducationOfferQuery(query) {
    if (state.identityStatus.student !== "verified") return false;
    var normalized = String(query || "").trim().replace(/[\s，。！？、,.!?]/g, "");
    return /^(?:我想|我要|帮我|请帮我|想要)?(?:查看|看看|了解|咨询)?(?:教育优惠|教育认证|学生认证)$/.test(normalized);
  }

  async function runQuery(query) {
    enterChat();
    var turn = appendTurn(query);
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    if (/冒烟|起火|鼓包|进液/.test(query)) return safetyFlow(turn);
    var compositeTasks = detectCompositeTasks(query);
    if (compositeTasks.length > 1) return compositePageFlow(turn, compositeTasks);
    if (/个人信息|修改头像|更换头像|换头像|修改电话|更换电话|修改手机号|更换手机号|手机号换绑|电话换绑/.test(query)) return profileFlow(turn, query);
    if (/会员签到|签到记录|签到进度/.test(query)) return memberFlow(turn);
    if (isVerifiedEducationOfferQuery(query)) return verifiedEducationOfferFlow(turn);
    if (/教育特惠|教育优惠|学生特惠/.test(query) && !/认证|办理|申请/.test(query)) return informationPageFlow(turn, "education", "教育特惠", "查看教育身份适用商品与优惠说明");
    if (/我的订单|服务订单|订单列表/.test(query) && !/购买|下单/.test(query)) return informationPageFlow(turn, "orders", "我的订单", "查看服务订单、状态与预约入口");
    var matchedDevice = deviceFromQuery(query);
    if (matchedDevice) return memberDeviceDetailFlow(turn, matchedDevice);
    if (isDeviceWarrantyQuery(query)) return memberWarrantyFlow(turn);
    if (/我的设备|我的电脑|我的资产|设备资产|已绑定设备|设备管理/.test(query)) return memberDeviceFlow(turn);
    var asset = memberAssetIntent(query);
    if (asset && !/企业|钻石|教育|学生/.test(query)) return memberAssetFlow(turn, asset);
    if (/会员中心|会员权益|乐豆|优惠券|代金券|红包|权益点/.test(query) && !/企业|钻石|教育|学生/.test(query)) return memberFlow(turn);
    if (/学生|教育/.test(query) && /认证|办理|申请/.test(query)) return authFlow(turn);
    if (/详情/.test(query) && /清灰|换硅脂|清洁保养|延保/.test(query)) return serviceDetailQueryFlow(turn, serviceIdFromQuery(query));
    if (/清灰|换硅脂|延保|服务商品/.test(query)) return serviceFlow(turn, query);
    return genericFlow(turn, query);
  }

  function enterChat() {
    document.body.dataset.state = "chat";
    el(".assistant-panel .default-state").style.display = "none";
    el(".assistant-panel .chat-state").style.display = "block";
  }

  function appendTurn(query) {
    var turn = document.createElement("section");
    turn.className = "leai-turn";
    turn.innerHTML = '<div class="leai-user">' + escapeHtml(query) + '</div>';
    el("#leaiThread").appendChild(turn);
    return turn;
  }

  async function streamAnswer(turn, html) {
    var host = document.createElement("div");
    host.className = "leai-ai";
    turn.appendChild(host);
    var plain = String(html).replace(/<[^>]*>/g, "");
    var cursor = document.createElement("span");
    cursor.className = "leai-cursor";
    host.appendChild(cursor);
    if (prefersReduced()) { host.innerHTML = html; return host; }
    var rendered = "";
    for (var i = 0; i < plain.length; i += 1) {
      rendered += plain[i];
      host.textContent = rendered;
      host.appendChild(cursor);
      if (i % 4 === 0) await delay(12);
    }
    host.innerHTML = html;
    return host;
  }

  function appendFixedAnswer(turn, html) {
    var host = document.createElement("div");
    host.className = "leai-ai";
    host.innerHTML = html;
    turn.appendChild(host);
    return host;
  }

  function appendTrace(turn, label) {
    turn.insertAdjacentHTML("beforeend", '<div class="leai-trace"><img src="' + icons.check + '" alt=""><span>' + escapeHtml(label) + '</span></div>');
  }

  function appendDisclaimer(turn) { turn.insertAdjacentHTML("beforeend", '<div class="leai-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</div>'); }

  function actionCard(type, title, description) {
    return '<button class="leai-action-card" type="button" data-leai-action="' + escapeHtml(type) + '" aria-pressed="false"><span><span class="leai-card-title">' + escapeHtml(title) + '</span><span class="leai-card-desc">' + escapeHtml(description) + '</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
  }

  function memberAssetIntent(query) {
    var matches = Object.keys(memberAssets).filter(function (key) { return memberAssets[key].pattern.test(query); });
    return matches.length === 1 ? matches[0] : "";
  }

  function deviceFromQuery(query) {
    var normalized = String(query || "").toLowerCase().replace(/[\s\-_·]/g, "");
    var id = Object.keys(deviceAliases).find(function (deviceId) {
      return deviceAliases[deviceId].some(function (alias) {
        return normalized.indexOf(alias.toLowerCase().replace(/[\s\-_·]/g, "")) >= 0;
      });
    });
    return id ? deviceCatalog[id] : null;
  }

  function isDeviceWarrantyQuery(query) {
    return /保修|设备保障/.test(query) || (/延保/.test(query) && !/购买|推荐|方案|商品|下单/.test(query));
  }

  async function memberAssetFlow(turn, type) {
    var asset = memberAssets[type];
    await streamAnswer(turn, '<p>' + asset.answer + '</p>');
    appendTrace(turn, "已完成登录、授权与会员资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-asset:" + type, "查看" + asset.label + "详情", asset.cardDescription));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberAsset(type, null);
  }

  async function memberDeviceFlow(turn) {
    var keys = orderedDeviceKeys();
    var recentNames = keys.slice(0, 3).map(function (key) { return deviceCatalog[key].name; }).join("、");
    state.deviceFilter = "all";
    state.deviceFocusId = "";
    await streamAnswer(turn, '<p>当前账号共有<strong>' + keys.length + ' 台已绑定设备</strong>，另有<strong>' + (state.pendingDeviceBound ? "0" : "1") + ' 台待绑定</strong>。最近使用的是 ' + escapeHtml(recentNames) + '；右侧已打开设备列表。</p>');
    appendTrace(turn, "已完成登录、授权与设备资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看我的设备", keys.length + " 台已绑定 · " + (state.pendingDeviceBound ? "无待绑定" : "1 台待绑定")));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function memberWarrantyFlow(turn) {
    state.deviceFilter = "attention";
    state.deviceFocusId = "";
    var pendingCount = state.pendingDeviceBound ? 0 : 1;
    await streamAnswer(turn, '<p>已查询当前账号的设备保障信息：<strong>2 台设备命中延保推荐节点</strong>，其中天逸 510S 的基础保修将于 2026-08-22 到期；另有<strong>' + pendingCount + ' 台设备待绑定</strong>。</p>');
    appendTrace(turn, "已完成设备资产、购买时间与保障节点查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看设备保障", "2 台命中延保推荐 · " + pendingCount + " 台待绑定"));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function memberDeviceDetailFlow(turn, device) {
    state.deviceFilter = "all";
    state.deviceFocusId = device.id;
    await streamAnswer(turn, '<p>已定位到<strong>' + escapeHtml(device.name) + '</strong>（设备编号 ' + escapeHtml(device.sn) + '）。' + escapeHtml(device.warranty) + '，当前保障信息已在右侧打开。</p>');
    appendTrace(turn, "已完成设备型号匹配与资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看 " + device.name + " 设备详情", device.product + " · " + device.warranty));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function profileFlow(turn, query) {
    state.profileTarget = /电话|手机|换绑/.test(query) ? "phone" : /头像/.test(query) ? "avatar" : "overview";
    await streamAnswer(turn, '<p>已为你打开<strong>个人信息</strong>。头像、昵称等基础资料可在右侧维护；手机号换绑会进入独立安全确认流程。</p>');
    appendTrace(turn, "已完成登录与会员资料权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard("profile", "查看个人信息", "头像、基础资料与手机号安全设置"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("profile");
  }

  async function informationPageFlow(turn, view, label, description) {
    var inlineEducation = view === "education";
    await streamAnswer(turn, inlineEducation ? '<p>已在<strong>会员中心</strong>定位到教育优惠卡片，可直接查看当前认证状态。</p>' : '<p>已为你打开<strong>' + escapeHtml(label) + '</strong>，可以在右侧查看当前信息与后续入口。</p>');
    appendTrace(turn, "已完成页面意图识别与权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard(inlineEducation ? "member" : view, inlineEducation ? "查看教育优惠状态" : "查看" + label, inlineEducation ? "会员中心卡片 · 认证状态与权益说明" : description));
    appendDisclaimer(turn);
    await nextFrame();
    if (inlineEducation) focusEducationCard();
    else openRightView(view);
  }

  async function verifiedEducationOfferFlow(turn) {
    await streamAnswer(turn, '<p>你的<strong>教育认证已通过</strong>，教育优惠权益已生效。当前状态已在会员中心教育优惠卡片内展示。</p>');
    appendTrace(turn, "已完成教育身份与活动资格查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member", "查看教育优惠状态", "会员中心卡片 · 已认证"));
    appendDisclaimer(turn);
    await nextFrame();
    focusEducationCard();
  }

  function detectCompositeTasks(query) {
    var tasks = [];
    function add(key, pattern, view, label, description) {
      var match = query.match(pattern);
      if (!match || tasks.some(function (task) { return task.key === key || (view && task.view === view); })) return;
      tasks.push({ key: key, view: view, label: label, description: description, index: match.index || 0 });
    }
    add("member", /会员中心|会员权益/, "member", "会员中心", "会员资料与权益信息");
    add("profile", /个人信息|修改头像|更换头像|换头像|修改电话|更换电话|修改手机号|更换手机号|手机号换绑|电话换绑/, "profile", "个人信息", "头像、基础资料与手机号安全设置");
    var profileTask = tasks.find(function (task) { return task.key === "profile"; });
    if (profileTask) profileTask.target = /电话|手机|换绑/.test(query) ? "phone" : /头像/.test(query) ? "avatar" : "overview";
    Object.keys(memberAssets).forEach(function (key) {
      var asset = memberAssets[key];
      add("asset:" + key, asset.pattern, "asset:" + key, asset.label, asset.cardDescription);
    });
    if (!/认证|办理|申请/.test(query)) add("education", /教育特惠|教育优惠|学生特惠/, "education", "教育特惠", "教育身份适用商品与优惠说明");
    if (!/下单|购买/.test(query)) add("orders", /我的订单|服务订单|订单列表/, "orders", "我的订单", "服务订单、状态与预约入口");
    var serviceMatch = query.match(/清灰|换硅脂|清洁保养|服务商品|延保/);
    if (serviceMatch) {
      var detail = /详情/.test(query);
      var serviceView = detail ? "service-detail:" + serviceIdFromQuery(query) : "service";
      tasks.push({ key: detail ? serviceView : "service", view: serviceView, label: detail ? rightViewLabel(serviceView) : "服务商品推荐", description: detail ? "服务内容、适用范围与预约说明" : "匹配设备的服务商品与购买入口", index: serviceMatch.index || 0 });
    }
    if (/下单|购买/.test(query) && !serviceMatch) {
      var purchaseMatch = query.match(/下单|购买/);
      tasks.push({ key: "pending-purchase", view: "", label: "下单", description: "待补充商品或服务", index: purchaseMatch ? purchaseMatch.index : query.length });
    }
    return tasks.sort(function (left, right) { return left.index - right.index; });
  }

  async function compositePageFlow(turn, tasks) {
    var labels = tasks.map(function (task) { return task.label; });
    var hasPending = tasks.some(function (task) { return !task.view; });
    await streamAnswer(turn, '<p>我将需求拆成<strong>' + tasks.length + ' 项任务</strong>：' + escapeHtml(labels.join("、")) + '。' + (hasPending ? "可以先打开已明确的信息页；下单还需要补充具体商品或服务。" : "右侧会保留对应标签，并聚焦当前需要继续处理的页面。涉及购买的动作仍需你明确选择并确认。") + '</p>');
    appendTrace(turn, "已完成多意图拆解与执行顺序判断");
    turn.insertAdjacentHTML("beforeend", '<div class="leai-card-grid" data-aui-plan aria-label="复合任务计划">' + tasks.map(function (task, index) {
      var action = actionForView(task.view);
      var disabled = !action;
      return '<button class="leai-action-card" type="button" data-aui-plan-step data-leai-action="' + escapeHtml(action || "pending") + '" aria-pressed="false"' + (disabled ? " disabled" : "") + '><span><span class="leai-card-title">' + (index + 1) + '. ' + escapeHtml(task.label) + '</span><span class="leai-card-desc">' + escapeHtml(task.description) + '</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
    }).join("") + '</div>');
    appendDisclaimer(turn);
    await nextFrame();
    tasks.forEach(function (task) {
      if (!task.view) return;
      if (task.view === "profile") state.profileTarget = task.target || "overview";
      if (task.view === "service") {
        state.serviceMode = "cleaning";
        state.serviceDeviceId = "";
        state.serviceCompare = [];
        state.serviceRecommended = "";
      }
      if (task.view.indexOf("service-detail:") === 0) {
        var serviceId = task.view.split(":")[1];
        state.serviceSelectedId = serviceId;
        state.serviceDetailContext[serviceId] = serviceDeviceContext(serviceId);
      }
      openRightView(task.view);
    });
  }

  function actionForView(view) {
    if (!view) return "";
    if (view.indexOf("asset:") === 0) return "member-asset:" + view.split(":")[1];
    if (view.indexOf("service-detail:") === 0) return "service-detail:" + view.split(":")[1];
    return view;
  }

  async function memberFlow(turn) {
    await streamAnswer(turn, '<p>已识别为综合会员资产查看。我会在登录与授权校验后，为你打开会员中心，并定位到会员权益。</p>');
    appendTrace(turn, "已完成登录与会员权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard("member", "查看会员中心", "会员等级、乐豆、优惠券与认证状态"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("member");
  }

  async function authFlow(turn) {
    var item = copy.student;
    var status = state.identityStatus.student;
    if (status === "reviewing") {
      await streamAnswer(turn, '<p>当前' + item.title + '申请正在<strong>审核中</strong>，暂时不需要重复提交。我已打开会员中心展示当前进度。</p>');
      appendTrace(turn, "已完成当前身份状态查询");
      appendDisclaimer(turn);
      await nextFrame();
      openRightView("member");
      return;
    }
    if (status === "verified") {
      await streamAnswer(turn, '<p>当前账号已完成<strong>' + item.title + '</strong>。我已打开会员中心，你可以直接查看已生效的专属权益。</p>');
      appendTrace(turn, "已完成当前身份与权益查询");
      appendDisclaimer(turn);
      await nextFrame();
      openRightView("member");
      return;
    }
    await streamAnswer(turn, '<p>我会先核验登录态、当前认证/等级状态与办理资格。当前演示账号未提交该申请，可以继续办理。</p>');
    appendTrace(turn, "已完成状态与资格校验");
    turn.insertAdjacentHTML("beforeend", actionCard("modal:student", item.button, "打开办理弹窗"));
    appendDisclaimer(turn);
  }

  async function serviceFlow(turn, query) {
    state.serviceMode = "cleaning";
    state.serviceDeviceId = "";
    state.serviceCompare = [];
    state.serviceRecommended = "";
    await streamAnswer(turn, '<p>已按“拯救者游戏本 + 北京 + 深度清灰/换硅脂”匹配服务商品。你可以比较服务内容、适用性与预约方式。</p>');
    appendTrace(turn, "已完成设备、地区与服务适用性校验");
    turn.insertAdjacentHTML("beforeend", actionCard("service", "查看推荐服务商品", "已为你推荐 3 款服务商品"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("service");
  }

  async function safetyFlow(turn) {
    await streamAnswer(turn, '<p><strong>请立即停止使用设备并断开电源。</strong>请勿继续充电、开机或尝试清灰。优先联系联想官方服务或人工客服检查。</p>');
    turn.insertAdjacentHTML("beforeend", actionCard("support", "联系官方服务", "危险情形不进入服务商品推荐"));
    appendDisclaimer(turn);
  }

  async function genericFlow(turn, query) {
    var isConsult = /材料|条件|有效期|流程|需要多久/.test(query);
    await streamAnswer(turn, isConsult ? '<p>这属于政策或流程咨询。我会先在对话中说明条件、材料与处理方式，不会因为出现“认证”等关键词直接弹出表单。</p>' : '<p>已收到你的问题。当前 POC 重点演示个人会员中心、教育认证和服务商品编排。你也可以继续输入更明确的会员或服务任务。</p>');
    appendDisclaimer(turn);
  }

  function taskEnvelope(intent, context) {
    state.requestSequence += 1;
    return {
      source: "right-aui",
      intent: intent,
      context: context || {},
      requestId: "aui-" + state.requestSequence,
      state: "checking"
    };
  }

  function runMemberTask(type, trigger) {
    if (type !== "student") return;
    if (embeddedHost) {
      openStudentModal(trigger);
      return;
    }
    runRightIdentityTask(trigger);
  }

  async function runRightIdentityTask(trigger) {
    var item = copy.student;
    if (!trigger) return;
    var task = taskEnvelope("member-student", { memberType: "student" });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn(item.query);
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    appendFixedAnswer(turn, "<p>已为你打开教育认证。请选择身份与认证方式，并补齐对应材料。</p>");
    appendTrace(turn, "已读取当前身份状态并进入固定办理流程");
    task.state = "ready_to_submit";
    await nextFrame();
    openModal("student", trigger);
  }

  async function runMemberCheckin(button) {
    if (state.memberCheckedIn || button.disabled) return;
    button.disabled = true;
    var task = taskEnvelope("member-checkin", { source: "member-task-center" });
    document.body.dataset.activeRequest = task.requestId;
    if (embeddedHost) {
      task.state = "checking";
      button.setAttribute("aria-busy", "true");
      var sent = submitComposerQuery("我要签到", { type: "member-checkin", source: "会员中心签到卡片" });
      if (!sent) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        task.state = "failed";
        return;
      }
      await new Promise(function (resolve) { window.setTimeout(resolve, 700); });
      state.memberCheckedIn = true;
      task.state = "success";
      button.removeAttribute("aria-busy");
      refreshRightView();
      return;
    }
    enterChat();
    var turn = appendTurn("我要签到");
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p><strong>签到成功！10 乐豆已到账</strong>，已连续签到 7 天。会员中心已同步最新状态。</p>');
    appendTrace(turn, "已收到会员任务服务签到回执");
    appendDisclaimer(turn);
    await nextFrame();
    state.memberCheckedIn = true;
    task.state = "success";
    refreshRightView();
  }

  async function runPurchasedDeviceBind(button){return window.__p0Modules.invoke("modals/device-bind#runPurchasedDeviceBind:01401bd39d188c5c51968329",{get ["state"](){return state},get ["pendingPurchasedDevice"](){return pendingPurchasedDevice},get ["taskEnvelope"](){return taskEnvelope},get ["enterChat"](){return enterChat},get ["appendTurn"](){return appendTurn},get ["nextFrame"](){return nextFrame},get ["prefersReduced"](){return prefersReduced},get ["streamAnswer"](){return streamAnswer},get ["appendTrace"](){return appendTrace},get ["appendDisclaimer"](){return appendDisclaimer},get ["deviceCatalog"](){return deviceCatalog},get ["refreshRightView"](){return refreshRightView},get ["completePurchasedDeviceBindTransition"](){return completePurchasedDeviceBindTransition}},this,arguments);}

  async function runWarrantyRecommendation(deviceId) {
    var device = deviceCatalog[deviceId];
    if (!device || !device.extensionEligible) return;
    var warrantyButton = document.querySelector('[data-device-warranty="' + device.id + '"]');
    if (warrantyButton) { warrantyButton.disabled = true; warrantyButton.textContent = "正在调用 Skill"; }
    var warrantyDevice = { id: device.id, name: device.name, product: device.product, sn: device.sn, warranty: device.warranty, maintenanceReason: device.maintenanceReason || "保障节点推荐" };
    if (typeof window.__lxSubmitDeviceActionQuery === "function") {
      window.__lxSubmitDeviceActionQuery("warranty", "为" + device.name + "推荐可购买的保修商品", warrantyDevice);
      return;
    }
    var task = taskEnvelope("service-warranty-recommend", { deviceId: device.id, source: "member-device-card" });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn("为" + device.name + " 推荐可购买的延保服务");
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p>已根据<strong>' + escapeHtml(device.name) + '</strong>的设备型号、购买时间和当前保障信息，匹配到 3 项可购买的延保方案。建议先对比保障年限与上门服务范围。</p>');
    appendTrace(turn, "已完成设备、购买时间、保障节点与延保 SKU 适用性校验");
    turn.insertAdjacentHTML("beforeend", actionCard("service", "查看延保服务推荐", "3 项可购买方案 · 价格以服务系统为准"));
    appendDisclaimer(turn);
    await nextFrame();
    state.serviceMode = "warranty";
    state.serviceDeviceId = device.id;
    state.warrantyDevicePickerOpen = false;
    state.serviceCompare = [];
    state.serviceRecommended = "warrantyYear1";
    task.state = "ready_to_select";
    openRightView("service");
  }

  async function runAddDeviceTask(){return window.__p0Modules.invoke("modals/device-bind#runAddDeviceTask:b1ed2c41fd2ba8dd07009321",{get ["embeddedHost"](){return embeddedHost},get ["taskEnvelope"](){return taskEnvelope},get ["enterChat"](){return enterChat},get ["appendTurn"](){return appendTurn},get ["nextFrame"](){return nextFrame},get ["prefersReduced"](){return prefersReduced},get ["streamAnswer"](){return streamAnswer},get ["appendTrace"](){return appendTrace},get ["actionCard"](){return actionCard},get ["appendDisclaimer"](){return appendDisclaimer}},this,arguments);}

  async function openMemberAsset(type, trigger) {
    if (!memberAssets[type]) return;
    var displayMode = !trigger || trigger.matches(".leai-action-card") ? "tab" : "secondary";
    openRightView("asset:" + type, displayMode);
    if (trigger && trigger.matches(".leai-action-card")) setSelected(trigger);
  }

  async function openMemberDevices(trigger){return window.__p0Modules.invoke("pages/device-list#openMemberDevices:1f0f795c118123c7f203f163",{get ["openRightView"](){return openRightView},get ["setSelected"](){return setSelected}},this,arguments);}

  function openDeviceDetail(deviceId){return window.__p0Modules.invoke("pages/device-detail#openDeviceDetail:692f3ed207d398a38d66c481",{get ["deviceCatalog"](){return deviceCatalog},get ["embeddedHost"](){return embeddedHost},get ["el"](){return el},get ["state"](){return state},get ["openRightView"](){return openRightView}},this,arguments);}

  function setupDeviceBrowser(initialScroll) {
    var track = el("[data-device-track]");
    if (!track) return;
    if (typeof initialScroll === "number") track.scrollLeft = initialScroll;
    var scheduled = false;
    track.addEventListener("scroll", function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        syncDeviceBrowser(track);
      });
    });
    window.requestAnimationFrame(function () { syncDeviceBrowser(track); });
  }

  function syncDeviceBrowser(track) {
    var cards = Array.prototype.slice.call(track.querySelectorAll("[data-device-slide]"));
    if (!cards.length) return;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap) || 0;
    var step = cards[0].getBoundingClientRect().width + gap;
    var first = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step)));
    var visible = Math.max(1, Math.floor((track.clientWidth + gap) / step));
    var range = el("[data-device-range]");
    if (range) range.textContent = deviceRangeLabel(first + 1, Math.min(cards.length, first + visible));
    var previous = el('[data-device-scroll="-1"]');
    var next = el('[data-device-scroll="1"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function scrollDeviceBrowser(direction) {
    var track = el("[data-device-track]");
    if (!track || !direction) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReduced() ? "auto" : "smooth" });
    window.setTimeout(function () { syncDeviceBrowser(track); }, prefersReduced() ? 0 : 320);
  }

  function setupBenefitBrowser(initialScroll) {
    var track = el("[data-benefit-track]");
    if (!track) return;
    if (typeof initialScroll === "number") track.scrollLeft = initialScroll;
    var scheduled = false;
    track.addEventListener("scroll", function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        syncBenefitBrowser(track);
      });
    });
    window.requestAnimationFrame(function () { syncBenefitBrowser(track); });
  }

  function syncBenefitBrowser(track) {
    var previous = el('[data-benefit-scroll="-1"]');
    var next = el('[data-benefit-scroll="1"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function scrollBenefitBrowser(direction) {
    var track = el("[data-benefit-track]");
    if (!track || !direction) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReduced() ? "auto" : "smooth" });
    window.setTimeout(function () { syncBenefitBrowser(track); }, prefersReduced() ? 0 : 320);
  }

  function toggleServiceCompare(id) {
    if (!findService(id) || id === "appointment") return;
    var index = state.serviceCompare.indexOf(id);
    if (index >= 0) state.serviceCompare.splice(index, 1);
    else if (state.serviceCompare.length < 2) state.serviceCompare.push(id);
    refreshRightView();
  }

  async function runServiceDetail(serviceId) {
    var service = findService(serviceId);
    if (!service) return;
    state.serviceSelectedId = service.id;
    state.serviceDetailContext[service.id] = serviceDeviceContext(service.id);
    enterChat();
    var turn = appendTurn("查看" + service.name + "详情");
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await presentServiceDetail(turn, service);
  }

  async function serviceDetailQueryFlow(turn, serviceId) {
    var service = findService(serviceId);
    if (!service) return genericFlow(turn, "服务详情");
    state.serviceSelectedId = service.id;
    state.serviceDetailContext[service.id] = serviceDeviceContext(service.id);
    await presentServiceDetail(turn, service);
  }

  async function presentServiceDetail(turn, service) {
    await streamAnswer(turn, '<p>已经为你打开<strong>' + escapeHtml(service.name) + '</strong>的服务商品详情，可继续查看服务内容、适用范围与预约说明。</p>');
    appendTrace(turn, "已完成服务商品与关联设备校验");
    turn.insertAdjacentHTML("beforeend", serviceDetailResultCard(service));
    appendDisclaimer(turn);
    await nextFrame();
    openServiceDetailView(service.id);
  }

  function serviceIdFromQuery(query) {
    if (/两年/.test(query)) return "warrantyYear2";
    if (/上门/.test(query) && /延保/.test(query)) return "warrantyDoor";
    if (/一年|延保/.test(query)) return "warrantyYear1";
    if (/换硅脂/.test(query)) return "thermal";
    if (/清洁保养|整机清洁/.test(query)) return "care";
    return "clean";
  }

  function serviceDetailResultCard(service) {
    return '<button class="leai-action-card" type="button" data-service-detail-result="' + escapeHtml(service.id) + '" aria-pressed="false"><span><span class="leai-card-title">' + escapeHtml(service.name) + '</span><span class="leai-card-desc">已经为您打开1款商品详情</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
  }

  function openServiceDetailView(serviceId) {
    if (!findService(serviceId)) return;
    state.serviceSelectedId = serviceId;
    if (!state.serviceDetailContext[serviceId]) state.serviceDetailContext[serviceId] = serviceDeviceContext(serviceId);
    openRightView("service-detail:" + serviceId);
  }

  function serviceDeviceContext(serviceId) {
    if (warrantyCatalog[serviceId]) {
      var warrantyDevice = deviceCatalog[state.serviceDeviceId] || deviceCatalog.legiony7000p;
      return { name: warrantyDevice.name, product: warrantyDevice.product, sn: warrantyDevice.sn };
    }
    return { name: "拯救者游戏本", product: "Legion 游戏本", sn: "设备型号待结算校验" };
  }

  function servicePriceNumber(service) {
    var value = String(service && service.price || "").replace(/[^0-9.]/g, "");
    return Number(value) || 0;
  }

  function claimServiceDiscounts(service) {
    var price = servicePriceNumber(service);
    var platform = price >= 600 ? 50 : price >= 250 ? 30 : 20;
    var member = price >= 600 ? 30 : price >= 250 ? 20 : 10;
    var offers = [
      { label: "商品平台满减券", reason: "联想商城专属，已自动领取", amount: platform },
      { label: "联想会员折扣券", reason: "乐享会员专享，已自动使用", amount: member }
    ];
    return { offers: offers, saved: platform + member, finalPrice: Math.max(0, price - platform - member) };
  }

  async function startServiceDiscountOrder(serviceId, trigger) {
    var service = findService(serviceId);
    if (!service || state.serviceBuyRunning) return;
    state.serviceBuyRunning = true;
    state.serviceSelectedId = service.id;
    var device = state.serviceDetailContext[service.id] || serviceDeviceContext(service.id);
    state.serviceDetailContext[service.id] = device;
    if (embeddedHost && typeof window.__lxBuyProductFromMember === "function") {
      state.serviceBuyRunning = false;
      window.__lxBuyProductFromMember({
        sku: service.id,
        name: service.name,
        price: servicePriceNumber(service),
        image_url: service.image,
        category: warrantyCatalog[service.id] ? "延保服务" : "服务商品",
        promotion_tags: ["会员服务"],
        official: true,
        type: "product",
        commerceType: "service-product"
      });
      return;
    }
    var discount = claimServiceDiscounts(service);
    enterChat();
    var turn = appendTurn("购买" + service.name + "，帮我领取所有可用优惠");
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p>好的！为你自动领取 ' + discount.offers.length + ' 项专属优惠：</p>');
    turn.insertAdjacentHTML("beforeend", serviceDiscountCard(service, discount));
    appendDisclaimer(turn);
    var card = turn.querySelector(".leai-discount-card");
    await runServiceDiscountCard(card, discount.offers.length);
    state.serviceBuyRunning = false;
    state.pendingServiceOrder = { service: service, device: device, discount: discount };
    openServiceOrderConfirm(trigger);
  }

  function serviceDiscountCard(service, discount) {
    return '<section class="leai-discount-card" data-state="claiming" aria-live="polite"><div class="leai-discount-card-head"><span class="leai-discount-icon"><img src="' + icons.membership + '" alt=""></span><div><strong data-discount-title>正在为你自动领取优惠</strong><small>' + escapeHtml(service.name) + '</small></div><em data-discount-count>0/' + discount.offers.length + '</em><b>已省 ¥' + discount.saved + '</b></div><div class="leai-discount-progress"><span data-discount-progress></span></div><div class="leai-discount-chips">' + discount.offers.map(function (offer) { return '<span data-discount-chip><img src="' + icons.check + '" alt="">' + escapeHtml(offer.label) + ' <b>¥' + offer.amount + '</b></span>'; }).join("") + '</div></section>';
  }

  async function runServiceDiscountCard(card, total) {
    if (!card) return;
    var count = card.querySelector("[data-discount-count]");
    var progress = card.querySelector("[data-discount-progress]");
    var chips = Array.prototype.slice.call(card.querySelectorAll("[data-discount-chip]"));
    for (var index = 0; index < total; index += 1) {
      if (!prefersReduced()) await delay(320);
      chips[index].classList.add("is-claimed");
      count.textContent = index + 1 + "/" + total;
      progress.style.width = Math.round(((index + 1) / total) * 100) + "%";
    }
    card.querySelector("[data-discount-title]").textContent = "已为你领取 " + total + " 项优惠";
    if (!prefersReduced()) await delay(180);
    card.dataset.state = "done";
  }

  function openServiceOrderConfirm(trigger) {
    var pending = state.pendingServiceOrder;
    if (!pending) return;
    var service = pending.service;
    var device = pending.device;
    var discount = pending.discount;
    var mask = el("#leaiModal");
    var modal = mask.querySelector(".leai-modal");
    modal.classList.remove("is-student", "is-wechat");
    modal.classList.add("is-service-order");
    el("#leaiModalTitle").textContent = "确认订单";
    el("#leaiModalDesc").textContent = "";
    el("#leaiModalForm").innerHTML = '<div class="leai-order-confirm-badge"><img src="' + icons.check + '" alt="">已领取 ' + discount.offers.length + ' 项优惠</div><div class="leai-order-confirm-product"><img src="' + service.image + '" alt=""><div><strong>' + escapeHtml(service.name) + '</strong><span>标价 <s>¥' + servicePriceNumber(service) + '</s></span></div></div><div class="leai-order-confirm-offers">' + discount.offers.map(function (offer) { return '<div><img src="' + icons.check + '" alt=""><span><strong>' + escapeHtml(offer.label) + '</strong><small>' + escapeHtml(offer.reason) + '</small></span><b>-¥' + offer.amount + '</b></div>'; }).join("") + '</div><div class="leai-order-confirm-total"><span><strong>到手价</strong><small>已为你省 ¥' + discount.saved + '</small></span><b>¥' + discount.finalPrice + '</b></div><div class="leai-order-confirm-device"><img src="' + icons.membership + '" alt=""><span><strong>关联设备：' + escapeHtml(device.name) + '</strong><small>下单后可在订单中预约服务</small></span></div><button class="leai-primary leai-order-confirm-submit" type="submit">确认下单 · ¥' + discount.finalPrice + '</button><p class="leai-form-note">演示环境：优惠与订单仅保存在当前页面，不会真实扣款或发起履约。</p>';
    el("#leaiModalForm").onsubmit = function (event) { event.preventDefault(); submitDiscountServiceOrder(); };
    mask.classList.add("is-open");
    mask.setAttribute("aria-hidden", "false");
    if (trigger) trigger.dataset.modalTrigger = "active";
    window.setTimeout(function () { el(".leai-order-confirm-submit").focus(); }, 0);
  }

  async function submitDiscountServiceOrder() {
    var pending = state.pendingServiceOrder;
    if (!pending) return;
    var service = pending.service;
    var device = pending.device;
    var discount = pending.discount;
    closeModal();
    state.pendingServiceOrder = null;
    var turn = appendTurn("确认下单" + service.name);
    await streamAnswer(turn, '<p>已下单成功（演示）：<strong>' + escapeHtml(service.name) + '</strong>，实付 ¥' + discount.finalPrice + '。可在“我的订单”中继续预约服务。</p>');
    appendTrace(turn, "已收到 Mock 服务商品订单回执");
    state.servicePurchaseStatus = "已购买";
    state.serviceAppointmentStatus = "未预约";
    state.serviceOrder = {
      orderId: "FW20260819001",
      name: service.name,
      price: "¥" + discount.finalPrice,
      originalPrice: service.price,
      saved: discount.saved,
      offers: discount.offers,
      image: service.image,
      status: "待预约",
      createdAt: "2026/8/19 10:30:00",
      device: device.name === "拯救者游戏本" ? "拯救者 Y7000P" : device.name,
      sn: device.sn === "设备型号待结算校验" ? "MP2G****" : device.sn
    };
    turn.insertAdjacentHTML("beforeend", actionCard("orders", "查看服务订单", "订单 " + state.serviceOrder.orderId + " · 待预约服务"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("orders");
  }

  async function runServiceTask(type, serviceId) {
    var selected = state.serviceCompare.map(function (id) { return findService(id).name; });
    var service = findService(serviceId || state.serviceSelectedId) || serviceCatalog.thermal;
    var query = "";
    if (type === "recommend") {
      if (selected.length < 2) return;
      query = "帮我比较" + selected.join("和") + "，为拯救者游戏本选一个，北京地区";
    } else if (type === "purchase") {
      state.serviceSelectedId = service.id;
      query = "我想购买" + service.name + "服务，设备是拯救者游戏本，北京地区";
    }
    else if (type === "appointment") query = "我想预约深度清灰服务，设备是拯救者游戏本，北京地区";
    else return;
    var task = taskEnvelope("service-" + type, { device: "拯救者游戏本", region: "北京", services: type === "purchase" ? [service.name] : selected });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn(query);
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    serviceTaskFlow(turn, type, task);
  }

  async function serviceTaskFlow(turn, type, task) {
    if (type === "recommend") {
      await streamAnswer(turn, '<p>两项服务都适用于当前设备。考虑到拯救者游戏本的散热压力，我更建议<strong>深度清灰 + 更换硅脂</strong>，它在清洁之外还覆盖散热介质更换。</p>');
      appendTrace(turn, "已完成服务内容与设备适用性比较");
      turn.insertAdjacentHTML("beforeend", actionCard("service-adopt", "采用推荐方案", "深度清灰 + 更换硅脂 · ¥299起"));
      appendDisclaimer(turn);
      await nextFrame();
      task.state = "ready_to_confirm";
      state.serviceRecommended = "thermal";
      refreshRightView();
      return;
    }
    if (type === "purchase") {
      var purchaseService = findService(state.serviceSelectedId) || serviceCatalog.thermal;
      await streamAnswer(turn, '<p>已校验登录状态、拯救者游戏本适用性、北京地区和服务 SKU。当前可继续购买<strong>' + escapeHtml(purchaseService.name) + '</strong>。</p>');
      appendTrace(turn, "已完成设备、地区与服务 SKU 校验");
      turn.insertAdjacentHTML("beforeend", actionCard("modal:purchase", "确认购买", escapeHtml(purchaseService.name) + " · " + escapeHtml(purchaseService.price)));
      appendDisclaimer(turn);
      await nextFrame();
      task.state = "ready_to_confirm";
      state.servicePurchaseStatus = "待确认";
      refreshRightView();
      return;
    }
    if (state.servicePurchaseStatus !== "已购买") {
      await streamAnswer(turn, '<p>暂未查询到可预约的已购服务订单。请先完成服务商品购买，再选择门店与到店时间。</p>');
      appendDisclaimer(turn);
      task.state = "error";
      return;
    }
    await streamAnswer(turn, '<p>已找到对应服务订单，并确认北京地区存在可预约门店与时段。请核对门店和到店时间。</p>');
    appendTrace(turn, "已完成订单、设备、门店与时段校验");
    turn.insertAdjacentHTML("beforeend", actionCard("modal:appointment", "确认预约", "中关村店 · 8 月 16 日 10:00–12:00"));
    appendDisclaimer(turn);
    await nextFrame();
    task.state = "ready_to_confirm";
    state.serviceAppointmentStatus = "待确认";
    refreshRightView();
  }

  function handleAction(button) {
    var action = button.dataset.leaiAction;
    if (action.indexOf("modal:") === 0) { openModal(action.split(":")[1], button); return; }
    if (action.indexOf("member-asset:") === 0) { openMemberAsset(action.split(":")[1], button); setSelected(button); return; }
    if (action === "member-devices") { openMemberDevices(button); return; }
    if (action === "member") { openRightView("member"); setSelected(button); return; }
    if (action === "service") { openRightView("service"); setSelected(button); return; }
    if (action === "orders") { openRightView("orders"); setSelected(button); return; }
    if (action === "education") { focusEducationCard(); setSelected(button); return; }
    if (action === "service-context") {
      var turn = appendTurn("拯救者游戏本，北京地区");
      serviceFlow(turn, "我想给拯救者游戏本清灰换硅脂，北京地区");
      return;
    }
    if (action === "service-other") { el(".assistant-panel .composer textarea").value = "我想为其他笔记本查询清灰服务，设备是"; el(".assistant-panel .composer textarea").focus(); return; }
    if (action === "service-adopt") {
      button.disabled = true;
      button.querySelector(".leai-card-title").textContent = "已采用推荐方案";
      button.querySelector(".leai-card-desc").textContent = "右侧已定位到深度清灰 + 更换硅脂";
      state.serviceRecommended = "thermal";
      refreshRightView();
      return;
    }
    if (action === "support") { button.disabled = true; button.querySelector(".leai-card-title").textContent = "已打开官方服务入口"; }
  }

  function setSelected(button) {
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); });
  }

  function openModal(type, trigger) {
    var item = type === "purchase" ? servicePurchaseModalCopy() : copy[type];
    if (!item) return;
    if (type === "student") {
      openStudentModal(trigger);
      return;
    }
    state.modalType = type;
    var mask = el("#leaiModal");
    mask.querySelector(".leai-modal").classList.remove("is-student", "is-profile-editor", "is-service-order", "is-wechat");
    if (type === "deviceBind") {
      var deviceBindClose = mask.querySelector(".leai-modal-close");
      deviceBindClose.textContent = "×";
      deviceBindClose.setAttribute("aria-label", "关闭绑定新设备");
    }
    el("#leaiModalTitle").textContent = item.title;
    el("#leaiModalDesc").textContent = item.description;
    var fields = item.fields.map(function (field, index) {
      var control = field[1] === "select" ? '<select id="leaiField' + index + '" required>' + field[2].map(function (option) { return '<option>' + escapeHtml(option) + '</option>'; }).join("") + '</select>' : '<input id="leaiField' + index + '" required placeholder="' + escapeHtml(field[2]) + '">';
      return '<div class="leai-field"><label for="leaiField' + index + '">' + escapeHtml(field[0]) + '</label>' + control + '</div>';
    }).join("");
    if (type === "deviceBind") {
      fields = '<fieldset class="leai-device-bind-kinds"><legend>设备类型</legend><label><input type="radio" name="leaiDeviceKind" value="电脑" checked><span>电脑</span></label><label><input type="radio" name="leaiDeviceKind" value="手机"><span>手机</span></label><label><input type="radio" name="leaiDeviceKind" value="平板"><span>平板</span></label></fieldset>' + fields + '<section class="leai-device-bind-help" aria-label="设备序列号查询说明"><strong>如何查询您的 SN / IMEI / IMID 号？</strong><span>方法一</span><p>查看主机底部或机身标识牌，S/N 后面的字母与数字即为设备序列号。</p><small>笔记本、一体机与 ThinkPad 通常可在机身底部标识牌找到；手机与平板可在系统设置的“关于设备”中查询。</small></section>';
    }
    el("#leaiModalForm").innerHTML = fields + '<p class="leai-form-note">表单仅用于交互演示。关闭弹窗视为取消，不表述为失败或完成。</p><div class="leai-modal-actions"><button class="leai-secondary" type="button" data-modal-close>取消</button><button class="leai-primary" type="submit">' + escapeHtml(item.submitLabel || "提交申请") + '</button></div>';
    el("#leaiModalForm").onsubmit = function (event) { event.preventDefault(); submitModal(type, trigger); };
    mask.classList.add("is-open");
    mask.setAttribute("aria-hidden", "false");
    if (trigger) trigger.dataset.modalTrigger = "active";
    window.setTimeout(function () { el(type === "deviceBind" ? "#leaiField0" : "#leaiModalForm input, #leaiModalForm select").focus(); }, 0);
  }

  function clearPhoneCodeCountdown(){return window.__p0Modules.invoke("modals/profile-edit#clearPhoneCodeCountdown:98854fe4f355ce1c7341d0f5",{get ["el"](){return el}},this,arguments);}

  function openProfileEditorModal(trigger){return window.__p0Modules.invoke("modals/profile-edit#openProfileEditorModal:5de6a94ce7e31011e11cc2f6",{get ["clearPhoneCodeCountdown"](){return clearPhoneCodeCountdown},get ["state"](){return state},get ["el"](){return el},get ["memberProfilePage"](){return memberProfilePage}},this,arguments);}

  function openPhoneRebindModal(trigger){return window.__p0Modules.invoke("modals/profile-edit#openPhoneRebindModal:f3e657c72864bf5910205ec4",{get ["clearPhoneCodeCountdown"](){return clearPhoneCodeCountdown},get ["state"](){return state},get ["el"](){return el},get ["escapeHtml"](){return escapeHtml},get ["maskPhone"](){return maskPhone},get ["closeModal"](){return closeModal},get ["refreshRightView"](){return refreshRightView}},this,arguments);}

  function maskPhone(phone) {
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }

  function servicePurchaseModalCopy() {
    var service = findService(state.serviceSelectedId) || serviceCatalog.thermal;
    return {
      title: copy.purchase.title,
      description: copy.purchase.description,
      submitLabel: copy.purchase.submitLabel,
      fields: [
        ["服务商品", "select", [service.name]],
        ["服务设备", "select", ["拯救者游戏本"]],
        ["服务地区", "select", ["北京"]],
        ["参考价格", "select", [service.price]]
      ]
    };
  }

  function mockSunCodeCells() {
    var cells = [];
    for (var row = 0; row < 21; row += 1) {
      for (var column = 0; column < 21; column += 1) {
        var center = row >= 7 && row <= 13 && column >= 7 && column <= 13;
        var edge = row < 3 || row > 17 || column < 3 || column > 17;
        var dark = !center && ((row * 7 + column * 11 + row * column) % 5 < 2 || (edge && (row + column) % 3 === 0));
        cells.push('<span' + (dark ? ' class="is-dark"' : "") + '></span>');
      }
    }
    return cells.join("");
  }

  function openStudentModal(trigger){return window.__p0Modules.invoke("modals/education-auth#openStudentModal:d5d85ee982b28bf4ffad0787",{get ["embeddedHost"](){return embeddedHost},get ["state"](){return state},get ["el"](){return el},get ["renderStudentModal"](){return renderStudentModal}},this,arguments);}

  function renderStudentModal(){return window.__p0Modules.invoke("modals/education-auth#renderStudentModal:c66252804aeb3f326f79b527",{get ["state"](){return state},get ["el"](){return el},get ["studentChoice"](){return studentChoice},get ["studentNotice"](){return studentNotice},get ["studentFields"](){return studentFields},get ["updateStudentSubmit"](){return updateStudentSubmit},get ["submitModal"](){return submitModal}},this,arguments);}

  function studentChoice(value, label, active, type) {
    var data = type === "audience" ? ' data-student-audience="' + value + '"' : ' data-student-method="' + value + '"';
    return '<button class="' + (active ? "is-active" : "") + '" type="button" role="tab" aria-selected="' + active + '"' + data + '>' + label + '</button>';
  }

  function studentNotice(audienceType, method) {
    if (audienceType === "exam") return method === "skip" ? "无需提交姓名和身份证号；请提供准考证号与清晰的准考证照片。" : "提交实名信息、准考证号与准考证照片，预计 1 个工作日内完成审核。";
    if (audienceType === "teacher") return method === "employment" ? "请提供学校或教育机构出具的在职证明，证明需处于有效期内。" : "请提供教师资格证编号与清晰证件照片，最终结果以认证服务回执为准。";
    if (method === "card") return "请提供学生证号和学生证照片；照片需清晰展示姓名与学生证号。";
    if (method === "wechat") return "通过微信学籍完成授权后提交；最终结果以教育认证服务回执为准。";
    return "使用学校 edu 邮箱接收验证邮件，完成邮箱所有权与在校身份校验。";
  }

  function studentFields(audienceType, method) {
    var fields = [];
    if (audienceType === "exam") {
      if (method === "verified") fields.push(studentInput("真实姓名", "leaiStudentName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiStudentId", "请输入身份证号", "text"));
      fields.push(studentInput("考生号 / 准考证号", "leaiExamNumber", "请输入考生号或准考证号", "text"), studentUpload("准考证照片", "leaiExamPhoto", "支持 png/jpg，单张不超过 5MB"));
    } else if (audienceType === "teacher") {
      fields.push(studentInput("真实姓名", "leaiTeacherName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiTeacherId", "请输入身份证号", "text"), studentInput("任教学校 / 机构", "leaiTeacherSchool", "请输入任教学校或教育机构", "text"), studentSelect("任教学段", "leaiTeacherStage", [["", "请选择"], ["primary", "小学"], ["middle", "中学"], ["college", "高校"], ["other", "其他教育机构"]]));
      if (method === "employment") fields.push(studentInput("教职工号", "leaiTeacherNumber", "请输入教职工号", "text"), studentUpload("教职证明", "leaiTeacherEmployment", "支持 png/jpg，单张不超过 5MB"));
      else fields.push(studentInput("教师资格证编号", "leaiTeacherCertificate", "请输入教师资格证编号", "text"), studentUpload("教师资格证照片", "leaiTeacherPhoto", "支持 png/jpg，单张不超过 5MB"));
    } else if (method === "wechat") {
      fields.push('<div class="leai-auth-connect"><strong>微信学籍授权</strong><span>完成授权后，认证服务将返回可提交状态。</span><label><input type="checkbox" required>我已完成微信学籍授权</label></div>');
    } else {
      fields.push(studentInput("真实姓名", "leaiStudentName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiStudentId", "请输入身份证号", "text"), studentInput("学校名称", "leaiStudentSchool", "请输入学校名称", "text"), studentSelect("毕业时间", "leaiGraduateDate", [["", "请选择"], ["2026-07", "2026 年 7 月"], ["2027-07", "2027 年 7 月"], ["2028-07", "2028 年 7 月"], ["2029-07", "2029 年 7 月"]]), studentSelect("教育阶段", "leaiEducationLevel", [["", "请选择"], ["专科", "专科"], ["本科", "本科"], ["研究生", "研究生"]]));
      if (method === "card") fields.push(studentInput("学生证号", "leaiStudentNumber", "请输入学生证号", "text"), studentUpload("学生证照片", "leaiStudentPhoto", "支持 png/jpg，单张不超过 5MB"));
      else fields.push(studentInput("edu 邮箱", "leaiEduEmail", "请输入学校 edu 邮箱", "email"));
    }
    fields.push(studentInput("邀请码（选填）", "leaiInviteCode", "有邀请码可填写", "text", false));
    return fields.join("");
  }

  function studentInput(label, id, placeholder, type, required) {
    return '<div class="leai-field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '"' + (required === false ? "" : " required") + '></div>';
  }

  function studentSelect(label, id, options) {
    return '<div class="leai-field"><label for="' + id + '">' + label + '</label><select id="' + id + '" required>' + options.map(function (option) { return '<option value="' + option[0] + '">' + option[1] + '</option>'; }).join("") + '</select></div>';
  }

  function studentUpload(label, id, help) {
    return '<div class="leai-field leai-auth-upload"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="file" accept="image/png,image/jpeg" required><span>' + help + '</span></div>';
  }

  function updateStudentSubmit() {
    var form = el("#leaiModalForm");
    var submit = el("#leaiStudentSubmit");
    if (!form || !submit) return;
    submit.disabled = !form.checkValidity();
  }

  function closeModal() {
    clearPhoneCodeCountdown();
    var mask = el("#leaiModal");
    mask.classList.remove("is-open");
    delete mask.dataset.profileParity;
    mask.querySelector(".leai-modal").classList.remove("is-student", "is-service-order", "is-profile-editor");
    mask.setAttribute("aria-hidden", "true");
    var trigger = el('[data-modal-trigger="active"]');
    if (trigger) { delete trigger.dataset.modalTrigger; trigger.focus(); }
    state.modalType = "";
  }

  async function submitModal(type, trigger) {
    state.submitted[type] = true;
    if (type === "deviceBind") {
      await submitDeviceBindModal(trigger);
      return;
    }
    if (type === "purchase" || type === "appointment") {
      await submitServiceModal(type, trigger);
      return;
    }
    state.identityStatus.student = "reviewing";
    closeModal();
    var cardTitle = trigger && trigger.querySelector(".leai-card-title");
    var cardDescription = trigger && trigger.querySelector(".leai-card-desc");
    if (cardTitle && cardDescription) {
      trigger.disabled = true;
      cardTitle.textContent = "已提交认证申请";
      cardDescription.textContent = "当前状态：审核中";
    }
    if (type === "student") {
      var pathLabels = { edu: "edu 邮箱", card: "学生证", wechat: "微信学籍", verified: "实名认证", skip: "跳过实名", certificate: "教师资格证", employment: "教职证明" };
      var audienceLabels = { college: "在校生", exam: "高考生", teacher: "教师" };
      state.educationPath = audienceLabels[state.educationAudience] + " · " + pathLabels[state.educationMethod];
    }
    var turn = appendTurn("提交" + state.educationPath + "认证申请");
    await streamAnswer(turn, '<p>申请已提交，当前状态为<strong>审核中</strong>。我会保留本次结果；只有权威服务返回通过后，才会表述为“已认证/已升级”。</p>');
    appendTrace(turn, "已收到业务服务提交回执");
    if (type === "student") turn.insertAdjacentHTML("beforeend", actionCard("member", "查看教育优惠状态", "会员中心卡片 · 当前状态：认证中"));
    appendDisclaimer(turn);
    if (type === "student") focusEducationCard();
    else refreshRightView();
  }

  async function submitDeviceBindModal(trigger){return window.__p0Modules.invoke("modals/device-bind#submitDeviceBindModal:653a761139f8012a56e3a4d3",{get ["el"](){return el},get ["closeModal"](){return closeModal},get ["state"](){return state},get ["deviceCatalog"](){return deviceCatalog},get ["embeddedHost"](){return embeddedHost},get ["openRightView"](){return openRightView},get ["appendTurn"](){return appendTurn},get ["streamAnswer"](){return streamAnswer},get ["escapeHtml"](){return escapeHtml},get ["appendTrace"](){return appendTrace},get ["appendDisclaimer"](){return appendDisclaimer}},this,arguments);}

  async function submitServiceModal(type, trigger) {
    closeModal();
    trigger.disabled = true;
    trigger.querySelector(".leai-card-title").textContent = type === "purchase" ? "已确认购买" : "已确认预约";
    trigger.querySelector(".leai-card-desc").textContent = type === "purchase" ? "服务系统已受理购买" : "履约系统已受理预约";
    var purchaseService = findService(state.serviceSelectedId) || serviceCatalog.thermal;
    var query = type === "purchase" ? "确认购买" + purchaseService.name + "服务" : "确认预约 8 月 16 日中关村店清灰服务";
    var turn = appendTurn(query);
    if (type === "purchase") {
      await streamAnswer(turn, '<p>服务商品系统已返回演示购买成功回执。<strong>' + escapeHtml(purchaseService.name) + '</strong>已加入“我的订单”，可从订单继续前往微信小程序预约。</p>');
      appendTrace(turn, "已收到 Mock 服务商品购买回执");
      state.servicePurchaseStatus = "已购买";
      state.serviceAppointmentStatus = "未预约";
      state.serviceOrder = {
        orderId: "FW20260818001",
        name: purchaseService.name,
        price: purchaseService.price.replace("起", ""),
        image: purchaseService.image,
        status: "待预约",
        createdAt: "2026/8/18 20:18:00",
        device: "拯救者 Y7000P",
        sn: "MP2G****"
      };
      turn.insertAdjacentHTML("beforeend", actionCard("orders", "查看服务订单", "订单 " + state.serviceOrder.orderId + " · 待预约服务"));
    } else {
      await streamAnswer(turn, '<p>履约系统已返回预约成功回执。已预约<strong>8 月 16 日 10:00–12:00 · 中关村店</strong>，可在服务订单中查看。</p>');
      appendTrace(turn, "已收到服务预约回执");
      state.serviceAppointmentStatus = "已预约";
    }
    appendDisclaimer(turn);
    if (type === "purchase") {
      await nextFrame();
      openRightView("orders");
    } else refreshRightView();
  }

  function openRightView(view, displayMode) {
    if (view === "asset:coupons" && typeof window.__lxOpenCouponCenter === "function") {
      window.__lxOpenCouponCenter("product");
      return;
    }
    if (embeddedHost) {
      if (state.rightTabs.indexOf(view) < 0) state.rightTabs.push(view);
      state.rightViewDisplayMode[view] = displayMode || "secondary";
      state.rightView = view;
      embeddedHost.innerHTML = rightViewHtml(view);
      embeddedHost.scrollTop = 0;
      if (view === "member" || view === "devices") setupDeviceBrowser(0);
      if (view === "member") setupBenefitBrowser(0);
      return;
    }
    var content = el(".shell > .content");
    var tabs = el("#leaiAuiTabs");
    var host = el("#leaiAuiView");
    if (state.rightTabs.indexOf(view) < 0) state.rightTabs.push(view);
    state.rightViewDisplayMode[view] = displayMode || "secondary";
    state.rightView = view;
    content.classList.add("leai-aui-active");
    tabs.hidden = false;
    host.hidden = false;
    renderRightTabs();
    host.innerHTML = rightViewHtml(view);
    host.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    syncResultCardSelection(view);
  }

  function focusEducationCard() {
    if (embeddedHost && typeof window.openMemberCenter === "function") {
      window.openMemberCenter();
      focusEducationCardWhenReady(16);
      return;
    }
    state.rightTabs = state.rightTabs.filter(function (view) { return view !== "education"; });
    delete state.rightViewDisplayMode.education;
    openRightView("member");
    focusEducationCardWhenReady(1);
  }

  function focusEducationCardWhenReady(attempts) {
    window.setTimeout(function () {
      var host = document.querySelector('[data-member-component-view="member"]') || embeddedHost || el("#leaiAuiView");
      var card = host && host.querySelector('[data-identity-track="education"]');
      if (card) {
        card.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "center" });
        return;
      }
      if (attempts > 1) focusEducationCardWhenReady(attempts - 1);
    }, attempts > 1 ? 60 : 0);
  }

  function activateRightTab(view) {
    if (state.rightTabs.indexOf(view) < 0 || view === state.rightView) return;
    state.rightView = view;
    renderRightTabs();
    var host = el("#leaiAuiView");
    host.innerHTML = rightViewHtml(view);
    host.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    syncResultCardSelection(view);
  }

  function secondaryParentView(view) {
    if (!view) return "";
    if (view.indexOf("asset:") === 0 || view === "profile" || view === "devices" || view === "ledou") return "member";
    if (view.indexOf("coupon-products:") === 0) return "asset:coupons";
    if (view === "education-products") return "member";
    if (view.indexOf("device:") === 0) return "devices";
    if (view.indexOf("ledou-product:") === 0) return state.ledouProductOrigin === "member" ? "member" : "ledou";
    if (view.indexOf("service-detail:") === 0 || view.indexOf("selection:") === 0) return "service";
    if (view === "appointment-code") return "orders";
    return "";
  }

  function returnFromSecondary(parentView) {
    var parent = parentView || secondaryParentView(state.rightView);
    if (!parent) return;
    if (state.deviceFocusId && (parent === "devices" || parent === "member")) state.deviceFocusId = "";
    var current = state.rightView;
    state.rightTabs = state.rightTabs.filter(function (view) { return view !== current; });
    delete state.rightViewDisplayMode[current];
    if (state.rightTabs.indexOf(parent) < 0) state.rightTabs.push(parent);
    state.rightView = parent;
    renderRightTabs();
    var host = el("#leaiAuiView");
    host.innerHTML = rightViewHtml(parent);
    host.scrollTop = 0;
    if (parent === "member" || parent === "devices") setupDeviceBrowser(0);
    if (parent === "member") setupBenefitBrowser(0);
    syncResultCardSelection(parent);
  }

  function renderRightTabs() {
    if (embeddedHost) return;
    var tabs = el("#leaiAuiTabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "已打开页面");
    tabs.innerHTML = state.rightTabs.map(function (view) {
      var active = view === state.rightView;
      var label = rightViewLabel(view);
      return '<div class="leai-aui-tab-item' + (active ? ' is-active' : '') + '" role="presentation" data-aui-tab-item="' + escapeHtml(view) + '"><button class="leai-aui-tab" type="button" role="tab" data-aui-tab="' + escapeHtml(view) + '" aria-selected="' + (active ? "true" : "false") + '" aria-controls="leaiAuiView"' + (active ? ' tabindex="0"' : ' tabindex="-1"') + '>' + escapeHtml(label) + '</button><button class="leai-aui-tab-x" type="button" data-aui-close-view="' + escapeHtml(view) + '" aria-label="关闭' + escapeHtml(label) + '">×</button></div>';
    }).join("");
  }

  function rightViewLabel(view) {
    if (view.indexOf("asset:") === 0) {
      var asset = memberAssets[view.split(":")[1]];
      return asset ? asset.label : "会员资产";
    }
    if (view.indexOf("device:") === 0) {
      var device = deviceCatalog[view.split(":")[1]];
      return device ? device.name : "设备详情";
    }
    if (view.indexOf("service-detail:") === 0) {
      var service = findService(view.split(":")[1]);
      return service ? service.name : "服务详情";
    }
    if (view.indexOf("ledou-product:") === 0) {
      var product = findLedouProduct(view.split(":")[1]);
      return product ? product.name : "好物详情";
    }
    if (view.indexOf("coupon-products:") === 0) return "可用商品";
    if (view === "education-products") return "教育优惠推荐";
    if (view.indexOf("selection:") === 0) return view.split(":")[1] === "device" ? "选择设备" : "选择地区";
    return { member: "会员中心", profile: "个人信息", devices: "我的设备", ledou: "乐豆好物", service: "服务商品推荐", orders: "我的订单", "appointment-code": "预约服务" }[view] || "页面";
  }

  function rightViewHtml(view) {
    if (view === "asset:coupons" && window.__lxCouponCenter) {
      return window.__lxCouponCenter.pageHtml("product");
    }
    var html = "";
    if (view.indexOf("asset:") === 0) html = memberAssetPage(view.split(":")[1]);
    else if (view.indexOf("device:") === 0) html = memberDeviceDetailPage(view.split(":")[1]);
    else if (view.indexOf("service-detail:") === 0) html = serviceDetailPage(view.split(":")[1]);
    else if (view.indexOf("ledou-product:") === 0) html = ledouProductPage(view.split(":")[1]);
    else if (view.indexOf("coupon-products:") === 0) html = couponProductsPage(view.split(":")[1]);
    else if (view === "education-products") html = educationProductsPage();
    else if (view.indexOf("selection:") === 0) html = selectionPage(view.split(":")[1]);
    else if (view === "member") html = memberPage();
    else if (view === "profile") html = memberProfilePage();
    else if (view === "devices") html = memberDevicesPage();
    else if (view === "ledou") html = ledouPage();
    else if (view === "service") html = servicePage();
    else if (view === "orders") html = serviceOrdersPage();
    else if (view === "appointment-code") html = appointmentCodePage();
    else html = memberPage();
    return decorateSecondaryPage(view, html);
  }

  function decorateSecondaryPage(view, html) {
    var parent = secondaryParentView(view);
    if (!parent) return html;
    var openedAsIndependentTab = state.rightViewDisplayMode[view] === "tab";
    if (openedAsIndependentTab) {
      var pageLabel = rightViewLabel(view);
      html = html.replace(/(<section\b[^>]*?)\s+aria-labelledby="[^"]*"([^>]*>)/, '$1 aria-label="' + escapeHtml(pageLabel) + '"$2');
      return html.replace(/<header class="[^"]*\bleai-page-header\b[^"]*">[\s\S]*?<\/header>/, "");
    }
    if (/data-secondary-back/.test(html)) return html;
    var parentLabel = rightViewLabel(parent);
    return html.replace(/<h1 class="([^"]*\bleai-page-title\b[^"]*)"([^>]*)>([\s\S]*?)<\/h1>/, function (_, classes, attributes, title) {
      return '<div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="' + escapeHtml(parent) + '" aria-label="返回' + escapeHtml(parentLabel) + '"><img src="' + icons.next + '" alt=""></button><h1 class="' + classes + '"' + attributes + '>' + title + '</h1></div>';
    });
  }

  function refreshRightView() {
    if (!state.rightView) return;
    var host = el("#leaiAuiView");
    var scrollTop = host.scrollTop;
    var deviceTrack = host.querySelector("[data-device-track]");
    var deviceScroll = deviceTrack ? deviceTrack.scrollLeft : 0;
    var benefitTrack = host.querySelector("[data-benefit-track]");
    var benefitScroll = benefitTrack ? benefitTrack.scrollLeft : 0;
    host.innerHTML = rightViewHtml(state.rightView);
    host.scrollTop = scrollTop;
    if (state.rightView === "member" || state.rightView === "devices") setupDeviceBrowser(deviceScroll);
    if (state.rightView === "member") setupBenefitBrowser(benefitScroll);
  }

  function closeRightView(closeAll, viewToClose) {
    var content = el(".shell > .content");
    var closingView = viewToClose || state.rightView;
    if (!closeAll && state.rightTabs.length > 1) {
      var closingIndex = state.rightTabs.indexOf(closingView);
      var closingActive = closingView === state.rightView;
      state.rightTabs = state.rightTabs.filter(function (view) { return view !== closingView; });
      delete state.rightViewDisplayMode[closingView];
      if (closingActive) state.rightView = state.rightTabs[Math.max(0, closingIndex - 1)] || state.rightTabs[0];
      renderRightTabs();
      if (closingActive) {
        var remainingHost = el("#leaiAuiView");
        remainingHost.innerHTML = rightViewHtml(state.rightView);
        remainingHost.scrollTop = 0;
        if (state.rightView === "member" || state.rightView === "devices") setupDeviceBrowser(0);
        if (state.rightView === "member") setupBenefitBrowser(0);
      }
      syncResultCardSelection(state.rightView);
      return;
    }
    content.classList.remove("leai-aui-active");
    el("#leaiAuiTabs").hidden = true;
    el("#leaiAuiView").hidden = true;
    state.rightView = "";
    state.rightTabs = [];
    state.rightViewDisplayMode = {};
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
  }

  function syncResultCardSelection(view) {
    var action = view.indexOf("asset:") === 0 ? "member-asset:" + view.split(":")[1] : { member: "member", devices: "member-devices", service: "service", orders: "orders" }[view];
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) {
      item.setAttribute("aria-pressed", item.dataset.leaiAction === action ? "true" : "false");
    });
  }

  function assetRecordStatus(record) {
    return record && !Array.isArray(record) ? record.status : record[3];
  }

  function renderLedouRecords(records){return window.__p0Modules.invoke("pages/ledou-center#renderLedouRecords:1dfed6f16d2b758ed58eb833",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function renderRedpacketRecords(records){return window.__p0Modules.invoke("pages/red-envelope#renderRedpacketRecords:299dc3c32aa8e91058ba3787",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function renderCouponRecords(records){return window.__p0Modules.invoke("pages/coupon-center#renderCouponRecords:de9224aeaed9bcbda9bea8dd",{get ["state"](){return state},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons}},this,arguments);}

  function renderDefaultAssetRecords(records, type) {
    return '<div class="leai-asset-ledger"' + (type === "vouchers" ? ' data-voucher-ledger' : '') + '>' + records.map(function (record) { return '<div data-asset-record-status="' + record[3] + '"><span><strong>' + record[0] + '</strong><small>' + record[2] + '</small></span><em>' + record[1] + '</em></div>'; }).join("") + '</div>';
  }


  function memberAssetPage(type) {
    var pages = {
      points: {
        label: "乐豆", value: "2,580", unit: "可用乐豆", description: "查看乐豆余额、获取与使用记录，以及当前适用规则。",
        metrics: [["近 30 天获得", "+860"], ["近 30 天使用", "-300"], ["即将到期", "0"]],
        filters: [["all", "全部"], ["earned", "获得"], ["used", "使用"]],
        periodOptions: [["30d", "30天内"], ["3m", "3个月内"], ["6m", "6个月内"], ["1y", "一年内"], ["custom", "自定义"]],
        records: [
          { title: "购买服务商品奖励", amount: "+500", sourceDescription: "完成笔记本深度清灰服务订单后获得乐豆奖励", sourceChannel: "联想商城", acquiredAt: "2026.08.16 14:32", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "会员签到奖励", amount: "+360", sourceDescription: "连续签到与会员任务累计奖励", sourceChannel: "会员任务中心", acquiredAt: "2026.08.12 09:05", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换清洁套装", amount: "-300", sourceDescription: "使用乐豆兑换会员清洁套装", sourceChannel: "乐豆商城", acquiredAt: "2026.08.03 18:20", expiresAt: "—", status: "used" },
          { title: "会员日浏览任务", amount: "+120", sourceDescription: "完成会员日指定页面浏览任务", sourceChannel: "会员任务中心", acquiredAt: "2026.07.28 10:18", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "评价服务订单", amount: "+80", sourceDescription: "完成服务订单评价并通过审核", sourceChannel: "联想商城", acquiredAt: "2026.07.22 16:46", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换无线鼠标", amount: "-500", sourceDescription: "使用乐豆兑换 ThinkPlus 无线鼠标", sourceChannel: "乐豆商城", acquiredAt: "2026.07.15 11:30", expiresAt: "—", status: "used" },
          { title: "完善会员资料", amount: "+100", sourceDescription: "首次完善头像与基础会员资料", sourceChannel: "会员中心", acquiredAt: "2026.06.30 09:22", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换延保抵扣券", amount: "-200", sourceDescription: "使用乐豆兑换指定延保服务抵扣券", sourceChannel: "会员权益中心", acquiredAt: "2026.06.18 14:08", expiresAt: "—", status: "used" }
        ],
        rule: "乐豆获取、有效期、抵扣比例与适用商品以实时会员规则和结算页为准。"
      },
      coupons: {
        label: "优惠券", value: "3 张", unit: "当前可用", description: "集中查看可用优惠券、适用范围和有效期。",
        metrics: [["即将到期", "1 张"], ["服务商品券", "1 张"], ["购物优惠券", "2 张"]],
        filters: [["available", "已领取(3)"], ["used", "已使用(1)"], ["expired", "已过期(1)"]],
        records: couponCatalog,
        rule: "优惠券门槛、叠加规则和适用商品以券详情及结算页为准。"
      },
      vouchers: {
        label: "代金券", value: "2 张", unit: "当前可用", description: "查看认证、换新等场景获得的代金券。",
        metrics: [["教育场景", "1 张"], ["以旧换新", "1 张"], ["即将到期", "0 张"]],
        filters: [["all", "全部"], ["available", "可使用"], ["used", "已使用"], ["expired", "已失效"]],
        periodOptions: [["all", "全部来源"], ["education", "教育优惠"], ["tradein", "以旧换新"]],
        records: [["教育认证代金券", "¥300", "教育特惠订单可用", "available"], ["以旧换新补贴券", "¥100", "指定换新订单可用", "available"], ["会员回馈代金券", "¥50", "8 月 1 日已使用", "used"], ["新品预约代金券", "¥80", "7 月 31 日已失效", "expired"]],
        rule: "代金券发放资格、使用门槛和有效期以对应活动规则为准。"
      },
      redpacket: {
        label: "限时红包", value: "¥84", unit: "当前可用", description: "查看限时红包余额、获得与使用记录和到期提醒。",
        metrics: [["红包金额", "¥84"], ["明日到期", "¥18"], ["本月获得", "+¥102"]],
        filters: [["all", "全部"], ["available", "可用"], ["used", "已使用"], ["expired", "已过期"]],
        periodOptions: [["all", "全部时间"], ["1m", "近 1 个月"], ["6m", "近 6 个月"]],
        records: [
          { title: "作废", time: "2026-06-22 00:01:57", amount: "−54.00", status: "expired" },
          { title: "作废", time: "2026-06-22 00:01:54", amount: "−92.00", status: "expired" },
          { title: "作废", time: "2026-06-22 00:01:49", amount: "−18.00", status: "expired" },
          { title: "大转盘抽奖", time: "2026-05-26 15:11:16", amount: "+18.00", status: "available" },
          { title: "大转盘抽奖", time: "2026-05-26 15:10:55", amount: "+18.00", status: "available" },
          { title: "大转盘抽奖", time: "2026-05-26 15:10:35", amount: "+18.00", status: "available" }
        ],
        rule: "红包不能兑换现金，使用范围、叠加方式与有效期以活动页面为准。"
      },
      benefitpoints: {
        label: "权益点", value: "1,200", unit: "可用权益点", description: "查看权益点来源、兑换记录和可兑换服务。",
        metrics: [["累计获得", "1,500"], ["累计使用", "300"], ["可兑换服务", "3 项"]],
        records: [["购买 ThinkPad 商品", "+1,200", "8 月 10 日", "all"], ["会员活动奖励", "+300", "7 月 28 日", "all"], ["兑换延保服务", "-300", "7 月 15 日", "all"]],
        rule: "权益点来源、兑换门槛和适用服务以会员权益中心实时展示为准。"
      }
    };
    var page = pages[type] || pages.points;
    var activeFilter = state.assetFilters[type] || "all";
    if (type === "coupons" && activeFilter === "all") activeFilter = "available";
    var records = page.records.filter(function (record) { return activeFilter === "all" || assetRecordStatus(record) === activeFilter; });
    var periodFilter = "";
    if (page.periodOptions) {
      if (type === "points") {
        var selectedPeriod = page.periodOptions.find(function (option) { return option[0] === state.assetPeriods[type]; }) || page.periodOptions[2];
        periodFilter = '<div class="leai-ledou-period-filter"><span>筛选时间</span><div class="leai-ledou-period-picker" data-ledou-period-picker><button type="button" data-ledou-period-trigger aria-haspopup="listbox" aria-expanded="false">' + selectedPeriod[1] + '<i aria-hidden="true"></i></button><div class="leai-ledou-period-menu" data-ledou-period-menu role="listbox" hidden>' + page.periodOptions.map(function (option) { var selected = option[0] === selectedPeriod[0]; return '<button class="' + (selected ? 'is-selected' : '') + '" type="button" role="option" aria-selected="' + selected + '" data-ledou-period-option="' + option[0] + '"><span>' + (selected ? '✓' : '') + '</span>' + option[1] + '</button>'; }).join("") + '</div></div></div>';
      } else {
        periodFilter = '<label><span>筛选范围</span><select data-asset-period data-asset-type="' + type + '">' + page.periodOptions.map(function (option) { return '<option value="' + option[0] + '"' + (option[0] === state.assetPeriods[type] ? ' selected' : '') + '>' + option[1] + '</option>'; }).join("") + '</select></label>';
      }
    }
    var filters = page.filters ? '<div class="leai-asset-filterbar" data-asset-filterbar="' + type + '"><div class="leai-asset-filter-tabs" role="group" aria-label="筛选' + page.label + '明细">' + page.filters.map(function (filter) { return '<button class="' + (filter[0] === activeFilter ? 'is-active' : '') + '" type="button" data-asset-filter="' + filter[0] + '" data-asset-type="' + type + '" aria-pressed="' + (filter[0] === activeFilter) + '">' + filter[1] + '</button>'; }).join("") + '</div>' + periodFilter + '</div>' : "";
    var recordList = type === "points" ? renderLedouRecords(records) : type === "coupons" ? renderCouponRecords(records) : type === "redpacket" ? renderRedpacketRecords(records) : renderDefaultAssetRecords(records, type);
    var ruleOpened = Boolean(state.assetRuleOpen[type]);
    var assetRuleTooltip = '<div class="leai-asset-rule-tooltip" id="leaiAssetRule-' + type + '" data-asset-rule-tooltip role="tooltip" aria-hidden="' + (!ruleOpened) + '"' + (ruleOpened ? '' : ' hidden') + '><strong>规则说明</strong><p>' + page.rule + '</p><small>当前页面数据为 Mock，实际余额、资产状态和规则以会员服务实时结果为准。</small></div>';
    var assetRuleInfo = '<div class="leai-asset-rule-info"><button class="leai-asset-rule-trigger" type="button" data-asset-rule-trigger="' + type + '" aria-label="查看' + page.label + '规则说明" aria-expanded="' + ruleOpened + '" aria-controls="leaiAssetRule-' + type + '"><span aria-hidden="true">!</span></button>' + assetRuleTooltip + '</div>';
    var summaryRuleButton = '<button class="leai-summary-usage" type="button" data-asset-rule-trigger="' + type + '" aria-expanded="' + ruleOpened + '" aria-controls="leaiAssetRule-' + type + '">使用说明 <span aria-hidden="true">?</span></button>' + assetRuleTooltip;
    var showRuleInHeader = type === "coupons";
    var assetHeader = '<header class="leai-page-header leai-asset-sticky-header"><div><div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="member" aria-label="返回会员中心"><img src="' + icons.next + '" alt=""></button><h1 class="leai-page-title" id="leaiAssetTitle-' + type + '">' + page.label + '</h1></div><p class="leai-page-desc">' + page.description + '</p></div>' + (showRuleInHeader ? assetRuleInfo : '') + '</header>';
    if (type === "points") {
      var pointsHeader = '<header class="leai-page-header leai-ledou-sticky-header"><div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="member" aria-label="返回会员中心"><img src="' + icons.next + '" alt=""></button><h1 class="leai-page-title">乐豆明细</h1></div></header>';
      var pointsMetrics = '<div class="leai-ledou-metrics">' + page.metrics.map(function (metric) { return '<article><span>' + metric[0] + '</span><strong>' + metric[1] + '</strong><small>以账户实时资产为准</small></article>'; }).join("") + '</div>';
      return '<section class="leai-page leai-member-asset-page leai-ledou-ledger-page" data-member-asset-page="points" aria-label="乐豆明细">' + pointsHeader +
        '<div class="leai-ledou-overview-row"><section class="leai-ledou-balance-banner"><div><span>可用乐豆</span><strong>' + page.value + '</strong><small>未来 30 天无过期乐豆</small><a class="leai-ledou-shop-link" href="https://shop.lenovo.com.cn/page/jf/jfsc.html" target="_blank" rel="noopener noreferrer">去乐豆商城</a></div><button class="leai-ledou-rule-link" type="button" data-asset-rule-trigger="points" aria-expanded="' + ruleOpened + '">ⓘ 乐豆规则</button>' + (ruleOpened ? '<div class="leai-asset-rule-tooltip leai-ledou-rule-popover" data-asset-rule-tooltip role="tooltip"><strong>规则说明</strong><p>' + page.rule + '</p></div>' : '') + '</section>' + pointsMetrics + '</div>' +
        filters + '<section class="leai-ledou-ledger-panel">' + recordList + '</section></section>';
    }
    if (type === "coupons") {
      return '<section class="leai-page leai-member-asset-page leai-coupon-page" data-member-asset-page="coupons" aria-labelledby="leaiAssetTitle-coupons">' + assetHeader +
        filters + '<section class="leai-coupon-grid-section" aria-label="优惠券列表">' + recordList + '</section></section>';
    }
    if (type === "vouchers") {
      var availableVoucherCents = page.records.reduce(function (total, record) {
        return record[3] === "available" ? total + Math.round(Number(record[1].replace(/[^0-9.-]/g, "")) * 100) : total;
      }, 0);
      var voucherAmount = (availableVoucherCents / 100).toFixed(2).split(".");
      return '<section class="leai-page leai-member-asset-page leai-voucher-page" data-member-asset-page="vouchers" aria-labelledby="leaiAssetTitle-vouchers">' + assetHeader +
        '<div class="leai-summary-grid leai-voucher-summary"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">当前可用代金券金额</span><strong class="leai-summary-value">' + voucherAmount[0] + '<small>.' + voucherAmount[1] + '</small></strong>' + summaryRuleButton + '</article></div>' +
        filters + '<section class="leai-voucher-ledger-panel" aria-label="代金券列表">' + recordList + '</section></section>';
    }
    var defaultSummary = type === "redpacket"
      ? '<div class="leai-summary-grid leai-redpacket-summary"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">当前可用限时红包</span><strong class="leai-summary-value">0<small>.00</small></strong>' + summaryRuleButton + '</article></div>'
      : '<div class="leai-summary-grid"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">' + page.unit + '</span><strong class="leai-summary-value">' + page.value + '</strong>' + summaryRuleButton + '</article>' + page.metrics.map(function (metric) { return '<article class="leai-summary-card"><span class="leai-summary-label">' + metric[0] + '</span><strong class="leai-summary-value">' + metric[1] + '</strong><span class="leai-summary-sub">以账户实时资产为准</span></article>'; }).join("") + '</div>';
    if (type === "redpacket") {
      return '<section class="leai-page leai-member-asset-page leai-redpacket-page" data-member-asset-page="redpacket" aria-labelledby="leaiAssetTitle-redpacket">' + assetHeader + defaultSummary + filters + '<section class="leai-redpacket-ledger-panel" aria-label="限时红包明细列表">' + recordList + '</section></section>';
    }
    return '<section class="leai-page leai-member-asset-page" data-member-asset-page="' + type + '" aria-labelledby="leaiAssetTitle-' + type + '">' + assetHeader +
      defaultSummary +
      filters + '<section class="leai-panel"><div class="leai-panel-head"><div><h2 class="leai-panel-title">最近明细</h2><p>展示当前账户最近的资产变动与可用状态。</p></div><span class="leai-section-meta">会员资产服务</span></div>' + recordList + '</section>' +
      '</section>';
  }

  function couponProductsPage(couponId){return window.__p0Modules.invoke("pages/coupon-center#couponProductsPage:afcd78f414362ab3a3e1f8ee",{get ["couponCatalog"](){return couponCatalog},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons},get ["couponProductCatalog"](){return couponProductCatalog}},this,arguments);}

  function educationProductsPage() {
    var products = ["EDU-XIAOXIN-5499", "EDU-YOGA-6999", "EDU-THINKPLUS-399"].map(function (sku) { return couponProductCatalog[sku]; }).filter(Boolean);
    var cards = products.map(function (product) {
      return '<article class="leai-education-product" data-education-product="' + escapeHtml(product.sku) + '"><span class="leai-education-product-image"><img src="' + product.image_url + '" alt=""></span><div class="leai-education-product-copy"><small>教育认证专享</small><h2>' + escapeHtml(product.name) + '</h2><p>' + escapeHtml(product.description) + '</p><strong>¥' + product.price.toLocaleString() + '</strong></div><div class="leai-education-product-actions"><button class="lx-p0-btn" type="button" data-coupon-product-open="' + escapeHtml(product.sku) + '">查看详情</button><button class="lx-p0-btn primary" type="button" data-coupon-product-buy="' + escapeHtml(product.sku) + '">立即购买</button></div></article>';
    }).join("");
    return '<section class="leai-page leai-education-products-page" data-education-products-page aria-labelledby="leaiEducationProductsTitle"><header class="leai-page-header"><div><h1 class="leai-page-title" id="leaiEducationProductsTitle">教育优惠推荐</h1><p class="leai-page-desc">教育认证已通过，以下商品可享专属优惠，实际价格以结算页为准。</p></div></header><div class="leai-education-product-grid">' + cards + '</div><p class="leai-member-disclaimer">商品、价格、库存及教育优惠范围以商城实时页面与结算结果为准。</p></section>';
  }


  function memberPage() {
    return '<section class="leai-page leai-member-page" aria-labelledby="leaiMemberTitle">' +
          '<header class="leai-member-main-header"><div class="leai-member-main-copy"><div class="leai-member-title-row"><h1 class="leai-page-title" id="leaiMemberTitle">会员中心</h1></div>' + memberProfileHeader() + '</div></header>' +
      '<section class="leai-member-overview-group" aria-label="会员概览与乐享建议">' +
        '<section class="leai-panel leai-member-overview leai-member-suggestions-panel" data-member-section="insights">' + memberInsights() + '</section>' +
        '<section class="leai-panel leai-member-overview" data-member-overview data-member-identities data-member-section="overview">' + memberIdentityHub() + '</section>' +
      '</section>' +
      identityBenefits() +
      '<section class="leai-member-education-slot" aria-label="教育特惠">' + educationIdentityTrack() + '</section>' +
      memberDevicesSection() +
      memberLedouShowcase() +
      '</section>';
  }

  function memberCheckinPrompt() {
    var checkedIn = state.memberCheckedIn;
    return '<button class="leai-member-checkin-prompt' + (checkedIn ? ' is-checked' : '') + '" type="button" data-member-checkin aria-label="' + (checkedIn ? '今日已签到' : '发送我要签到') + '"' + (checkedIn ? ' disabled' : '') + '><span class="leai-member-checkin-icon"><img src="' + icons.calendar + '" alt=""></span><span class="leai-member-checkin-copy"><strong>' + (checkedIn ? '<span>今日已签到</span><b>+10 乐豆</b>' : '今日尚未签到') + '</strong><em>' + (checkedIn ? '已连续签到 7 天，里程碑奖励已解锁' : '已连续 6 天 · 再签 1 天解锁 +50 乐豆') + '</em></span><span class="leai-member-checkin-action">' + (checkedIn ? '' : '去签到<img src="' + icons.next + '" alt="">') + '</span></button>';
  }

  function memberProfileHeader() {
    return '<button class="leai-member-profile-entry leai-member-profile-entry--header" type="button" data-member-profile-open aria-label="编辑' + escapeHtml(state.profile.nickname) + '的个人信息"><span class="leai-member-avatar"><img src="' + profileAvatarIcon(state.profile.avatar) + '" alt=""></span><span class="leai-member-profile"><span class="leai-member-profile-title-line"><strong>' + escapeHtml(state.profile.nickname) + '</strong><span class="leai-member-tier-badge" aria-label="当前会员等级：铂金会员"><img src="' + icons.crown + '" alt="">铂金会员</span></span><small>已陪伴 2679 天</small><span class="leai-member-profile-edit"><img class="leai-member-profile-edit-icon" src="' + icons.edit + '" alt="">编辑资料</span></span></button>';
  }

  function memberIdentityHub() {
    return '<div class="leai-member-identity" data-member-identity-hub><div class="leai-identity-content"><div class="leai-identity-pane" data-identity-pane="personal">' + personalIdentityTrack() + memberAssetSummary() + '</div></div></div>';
  }

  function memberAssetSummary() {
    return '<section class="leai-member-assets-panel" aria-labelledby="leaiMemberAssetsTitle"><div class="leai-member-assets-head"><h2 id="leaiMemberAssetsTitle">我的资产</h2><span>5 类资产</span></div><div class="leai-member-assets">' +
      memberAssetButton("points", "2,580", "", "乐豆", "近 30 天 +860") + memberAssetButton("coupons", "3", "张", "优惠券", "1 张即将到期") + memberAssetButton("vouchers", "2", "张", "代金券", "教育/换新可用") + memberAssetButton("redpacket", "2", "个", "限时红包", "明日到期 1 个") + memberAssetButton("benefitpoints", "1,200", "", "权益点", "可兑换会员服务") + '</div></section>';
  }

  function identityBenefits() {
    return '<div class="leai-member-level-panel" data-member-level-panel><div class="leai-benefit-block"><div class="leai-benefit-block-head"><strong>我的权益</strong><span>11 项权益</span></div><div class="leai-benefit-browser"><button class="leai-device-nav leai-benefit-nav is-previous" type="button" data-benefit-scroll="-1" aria-label="浏览上一组会员权益" disabled><img src="' + icons.next + '" alt=""></button><div class="leai-benefit-grid leai-benefit-grid-compact" data-benefit-track tabindex="0" role="region" aria-label="会员权益，可横向浏览">' +
      benefitTooltip("member-price", icons.rewards, "购物积分 3 倍", "消费积分加速", "积分倍率和适用商品以实时会员规则为准。") +
      benefitTooltip("coupon-pack", icons.membership, "专属券包", "会员优惠集中领", "券包内容、领取时间和使用门槛以会员服务为准。") +
      benefitTooltip("monthly-benefit", icons.customization, "月月福利", "会员日限时领取", "活动内容与领取资格以当月会员活动为准。") +
      benefitTooltip("new-trial", icons.trial, "新品试用", "指定新品优先体验", "试用范围、名额和参与条件以活动页面为准。") +
      benefitTooltip("birthday", icons.referrals, "生日礼包", "生日月专属优惠", "礼包内容与发放时间以会员服务为准。") +
      benefitTooltip("support", icons.support, "优先客服", "优先接入人工客服", "实际排队时间以服务繁忙程度为准。") +
      benefitTooltip("exclusive-price", icons.membership, "会员专享价", "指定商品会员价", "适用商品和实时价格以商城结算页为准。") +
      benefitTooltip("shipping-coupon", icons.rewards, "运费券", "指定订单减免运费", "领取资格、面额和可用订单以券规则为准。") +
      benefitTooltip("tradein-bonus", icons.customization, "换新加码", "以旧换新额外补贴", "参与机型、补贴额度和有效期以活动规则为准。") +
      benefitTooltip("service-discount", icons.support, "服务折扣", "指定服务会员优惠", "适用服务、设备和优惠额度以服务商品实时结果为准。") +
      benefitTooltip("event-priority", icons.trial, "活动优先报名", "热门活动优先参与", "活动名额、报名时间和参与资格以活动页面为准。") + '</div><button class="leai-device-nav leai-benefit-nav is-next" type="button" data-benefit-scroll="1" aria-label="浏览下一组会员权益"><img src="' + icons.next + '" alt=""></button></div></div></div>';
  }

  function memberInsights() {
    return '<section class="leai-member-insights" data-member-insights data-member-section="insights" aria-labelledby="leaiMemberInsightsTitle"><div class="leai-member-insights-head"><span><img src="' + icons.memberSparkle + '" alt=""></span><div><h2 id="leaiMemberInsightsTitle">乐享建议</h2></div></div><div class="leai-member-insight-grid">' +
      memberInsightButton("coupons", icons.membership, "会员资产", "1 张优惠券即将到期", "查看可用范围与有效期", "帮我查看即将到期的优惠券，并告诉我优先使用哪一张", true) +
      memberInsightButton("service", icons.support, "对话历史", "继续查看 Y7000P 散热服务", "承接近期设备服务咨询", "继续帮我查看适合拯救者 Y7000P 的清灰换硅脂服务") +
      memberInsightButton("ledou", icons.rewards, "用户行为", "近 30 天获得 860 乐豆", "查看当前乐豆明细", "帮我查看近 30 天乐豆的获得和使用明细") +
      '</div><p>当前建议基于 Mock 行为、对话与资产数据生成，实际内容需以授权后的实时信息为准。</p></section>';
  }

  function memberInsightButton(type, icon, source, title, description, query, hasAlert) {
    var alertDot = hasAlert ? '<i class="leai-member-insight-alert-dot" aria-hidden="true"></i>' : "";
    var alertLabel = hasAlert ? ' aria-label="' + escapeHtml(title) + '，有到期提醒"' : "";
    return '<button class="leai-member-insight" type="button" data-member-insight="' + type + '" data-member-insight-query="' + escapeHtml(query) + '"' + alertLabel + '><img src="' + icon + '" alt=""><span><small data-member-insight-source>' + source + '</small><span class="leai-member-insight-title-row"><strong>' + title + '</strong>' + alertDot + '</span><em>' + description + '</em></span><i class="leai-member-insight-chevron" aria-hidden="true">›</i></button>';
  }

  function memberLedouShowcase(){return window.__p0Modules.invoke("pages/ledou-center#memberLedouShowcase:5efbcd1c2a01303de0d1f8c3",{get ["icons"](){return icons},get ["ledouCatalog"](){return ledouCatalog},get ["ledouProductCard"](){return ledouProductCard}},this,arguments);}

  function ledouProductCard(product){return window.__p0Modules.invoke("pages/ledou-center#ledouProductCard:b3327362141d7b7cecf2b51f",{get ["icons"](){return icons}},this,arguments);}

  function findLedouProduct(id) {
    return ledouCatalog.find(function (product) { return product.id === id; }) || ledouCatalog[0];
  }

  function ledouPage(){return window.__p0Modules.invoke("pages/ledou-center#ledouPage:93ae8b8fc2ed36b1041ac398",{get ["icons"](){return icons},get ["ledouCatalog"](){return ledouCatalog},get ["ledouProductCard"](){return ledouProductCard}},this,arguments);}

  function ledouProductPage(id){return window.__p0Modules.invoke("pages/ledou-center#ledouProductPage:7159c945c3c3b597b0df49a3",{get ["findLedouProduct"](){return findLedouProduct},get ["icons"](){return icons}},this,arguments);}

  function profileAvatarIcon() {
    return state.profile.customAvatar || icons.membership;
  }

  function memberProfilePage(){return window.__p0Modules.invoke("modals/profile-edit#memberProfilePage:5cb2617defcd53fe504c9649",{get ["profileAvatarIcon"](){return profileAvatarIcon},get ["icons"](){return icons},get ["state"](){return state},get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function memberDevicesPage(){return window.__p0Modules.invoke("pages/device-list#memberDevicesPage:3dde0544d1e4b5c66331bb54",{get ["orderedDeviceKeys"](){return orderedDeviceKeys},get ["state"](){return state},get ["deviceCatalog"](){return deviceCatalog},get ["memberDeviceDetailPage"](){return memberDeviceDetailPage},get ["pendingDeviceListRow"](){return pendingDeviceListRow},get ["icons"](){return icons},get ["memberDeviceListRow"](){return memberDeviceListRow},get ["deviceFilterButton"](){return deviceFilterButton}},this,arguments);}

  // Per-model P0 demonstration specifications; not a live hardware probe.
  var memberDeviceSpecifications = {
  "groups": [
    [
      "处理器",
      [
        "CPU型号",
        "主频",
        "最大频率",
        "缓存",
        "硬件核心数",
        "虚拟线程数",
        "芯片组"
      ]
    ],
    [
      "内存与存储",
      [
        "标配内存",
        "出厂最大内存",
        "支持最大内存",
        "硬盘",
        "存储容量",
        "存储扩展",
        "光驱",
        "内存接口数量",
        "硬盘接口数量"
      ]
    ],
    [
      "接口与扩展",
      [
        "USB接口",
        "视频接口",
        "音频接口",
        "读卡器"
      ]
    ],
    [
      "屏幕与显示",
      [
        "屏幕尺寸",
        "屏幕显示比例",
        "分辨率",
        "屏幕类型",
        "刷新率"
      ]
    ],
    [
      "显卡",
      [
        "集成显卡",
        "独立显卡",
        "显存类型",
        "显存容量",
        "图形处理器",
        "支持功能"
      ]
    ],
    [
      "音视频与输入",
      [
        "麦克风",
        "音箱",
        "声卡",
        "摄像头",
        "键盘",
        "触控笔",
        "指纹识别",
        "鼠标"
      ]
    ],
    [
      "电源与网络",
      [
        "电源",
        "电池",
        "适配器",
        "充电",
        "网卡",
        "移动网络",
        "无线网卡",
        "蓝牙"
      ]
    ],
    [
      "外观与软件",
      [
        "外壳材质",
        "颜色",
        "操作系统",
        "Office 软件"
      ]
    ]
  ],
  "profiles": {
    "thinkbook16p": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "3.5mm 耳机 / 麦克风二合一接口",
        "独立显卡": "NVIDIA GeForce RTX 4060 Laptop GPU",
        "显存类型": "GDDR6",
        "显存容量": "8GB",
        "支持功能": "DirectX 12 Ultimate、DLSS 3",
        "麦克风": "双麦克风阵列",
        "音箱": "哈曼卡顿四扬声器，支持 Dolby Atmos",
        "电源": "外接电源适配器供电",
        "网卡": "无板载有线网卡",
        "声卡": "内置高清声卡",
        "键盘": "背光键盘",
        "鼠标": "多点触控触摸板",
        "外壳材质": "铝合金顶盖及底盖",
        "颜色": "深空灰",
        "操作系统": "Windows 11 家庭中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 i9-14900HX",
        "主频": "性能核 2.2GHz / 能效核 1.6GHz",
        "最大频率": "5.8GHz",
        "缓存": "36MB 智能缓存",
        "硬件核心数": "24 核（8 性能核 + 16 能效核）",
        "虚拟线程数": "32",
        "芯片组": "Intel HM770",
        "标配内存": "32GB（16GB × 2）DDR5-5600",
        "出厂最大内存": "32GB",
        "支持最大内存": "32GB（官方验证配置）",
        "硬盘": "M.2 2280 1TB PCIe 4.0 NVMe 固态硬盘",
        "内存接口数量": "2 个 SO-DIMM 插槽",
        "硬盘接口数量": "2 个 M.2 2280 插槽",
        "USB接口": "USB-A 3.2 Gen 1 × 2；USB-A 3.2 Gen 2 × 1；USB-C 雷电 4 × 2",
        "视频接口": "HDMI 2.1；USB-C（DisplayPort 1.4）",
        "读卡器": "SD 读卡器",
        "屏幕尺寸": "16 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "3200 × 2000",
        "屏幕类型": "IPS 显示屏，165Hz",
        "集成显卡": "Intel UHD Graphics",
        "电池": "80Wh 锂电池",
        "适配器": "300W 方口电源适配器",
        "无线网卡": "Wi-Fi 6E（802.11ax，2 × 2）",
        "蓝牙": "Bluetooth 5.3",
        "摄像头": "1080p 高清 + 红外摄像头，带隐私挡板",
        "指纹识别": "支持，集成于电源键"
      }
    },
    "legiony7000p": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "3.5mm 耳机 / 麦克风二合一接口",
        "独立显卡": "NVIDIA GeForce RTX 5060 Laptop GPU",
        "显存类型": "GDDR7",
        "显存容量": "8GB",
        "支持功能": "DirectX 12",
        "麦克风": "双麦克风阵列",
        "音箱": "内置立体声扬声器",
        "电源": "外接电源适配器供电",
        "网卡": "千兆以太网卡，RJ-45 接口",
        "声卡": "内置高清声卡",
        "键盘": "背光键盘",
        "鼠标": "多点触控触摸板",
        "外壳材质": "金属机身",
        "颜色": "灰色",
        "操作系统": "Windows 11 家庭中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 Ultra 7 255HX",
        "主频": "性能核 2.4GHz / 能效核 1.8GHz",
        "最大频率": "5.2GHz",
        "缓存": "30MB 智能缓存",
        "硬件核心数": "20 核（8 性能核 + 12 能效核）",
        "虚拟线程数": "20",
        "芯片组": "Intel 移动平台",
        "标配内存": "32GB（16GB × 2）DDR5",
        "出厂最大内存": "32GB",
        "支持最大内存": "64GB（演示配置）",
        "硬盘": "M.2 2280 1TB PCIe NVMe 固态硬盘",
        "内存接口数量": "2 个 SO-DIMM 插槽",
        "硬盘接口数量": "2 个 M.2 插槽",
        "USB接口": "USB-A × 3；USB-C × 2",
        "视频接口": "HDMI；USB-C（支持视频输出）",
        "读卡器": "无",
        "屏幕尺寸": "16 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "2560 × 1600",
        "屏幕类型": "IPS 高刷新率显示屏",
        "集成显卡": "Intel Graphics",
        "电池": "80Wh 锂电池",
        "适配器": "245W 电源适配器（演示配置）",
        "无线网卡": "Wi-Fi 6",
        "蓝牙": "支持 Bluetooth",
        "摄像头": "1080p 高清摄像头",
        "指纹识别": "无"
      }
    },
    "yogaair14s": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "USB-C 数字音频",
        "独立显卡": "无",
        "显存类型": "共享系统内存",
        "显存容量": "共享",
        "支持功能": "DirectX 12",
        "麦克风": "双麦克风阵列",
        "音箱": "内置立体声扬声器",
        "电源": "外接电源适配器供电",
        "网卡": "无板载有线网卡",
        "声卡": "内置高清声卡",
        "键盘": "背光键盘",
        "鼠标": "多点触控触摸板",
        "外壳材质": "金属机身",
        "颜色": "蓝色",
        "操作系统": "Windows 11 家庭中文版（ARM 64 位）",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "高通骁龙 X Elite X1E-78-100",
        "主频": "3.4GHz",
        "最大频率": "3.4GHz",
        "缓存": "42MB 总缓存",
        "硬件核心数": "12",
        "虚拟线程数": "12",
        "芯片组": "高通骁龙 X Elite 集成平台",
        "标配内存": "32GB LPDDR5X 板载内存",
        "出厂最大内存": "32GB",
        "支持最大内存": "32GB，板载不可扩展",
        "硬盘": "1TB PCIe NVMe 固态硬盘",
        "内存接口数量": "0，板载内存",
        "硬盘接口数量": "1 个 M.2 插槽",
        "USB接口": "USB-C（USB4）× 3",
        "视频接口": "USB-C（DisplayPort）",
        "读卡器": "无",
        "屏幕尺寸": "14.5 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "2944 × 1840",
        "屏幕类型": "OLED 触控显示屏，90Hz",
        "集成显卡": "Qualcomm Adreno GPU",
        "电池": "70Wh 锂电池",
        "适配器": "65W USB-C 电源适配器",
        "无线网卡": "Wi-Fi 7",
        "蓝牙": "Bluetooth 5.4",
        "摄像头": "1080p 高清 + 红外摄像头",
        "指纹识别": "无，支持红外人脸识别"
      }
    },
    "thinkpadt14": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "3.5mm 耳机 / 麦克风二合一接口",
        "独立显卡": "无",
        "显存类型": "共享系统内存",
        "显存容量": "共享",
        "支持功能": "DirectX 12",
        "麦克风": "双麦克风阵列",
        "音箱": "内置立体声扬声器",
        "电源": "外接电源适配器供电",
        "网卡": "千兆以太网卡，RJ-45 接口",
        "声卡": "内置高清声卡",
        "键盘": "背光防泼溅键盘，含 TrackPoint",
        "鼠标": "多点触控触摸板",
        "外壳材质": "金属机身",
        "颜色": "黑色",
        "操作系统": "Windows 11 专业中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 Ultra 7 255U",
        "主频": "性能核 2.0GHz / 能效核 1.5GHz",
        "最大频率": "5.2GHz",
        "缓存": "12MB 智能缓存",
        "硬件核心数": "12 核",
        "虚拟线程数": "14",
        "芯片组": "Intel SoC 集成平台",
        "标配内存": "32GB DDR5-5600",
        "出厂最大内存": "64GB",
        "支持最大内存": "64GB",
        "硬盘": "M.2 2280 1TB PCIe NVMe 固态硬盘",
        "内存接口数量": "2 个 SO-DIMM 插槽",
        "硬盘接口数量": "1 个 M.2 2280 插槽",
        "USB接口": "USB-A × 2；USB-C 雷电 4 × 2",
        "视频接口": "HDMI 2.1；USB-C（DisplayPort）",
        "读卡器": "无",
        "屏幕尺寸": "14 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "1920 × 1200",
        "屏幕类型": "IPS 防眩光显示屏",
        "集成显卡": "Intel Graphics",
        "电池": "57Wh 锂电池",
        "适配器": "65W USB-C 电源适配器",
        "无线网卡": "Wi-Fi 6E",
        "蓝牙": "Bluetooth 5.3",
        "摄像头": "500 万像素 + 红外摄像头（演示配置）",
        "指纹识别": "支持，集成于电源键"
      }
    },
    "xiaoxinpro14": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "3.5mm 耳机 / 麦克风二合一接口",
        "独立显卡": "无",
        "显存类型": "共享系统内存",
        "显存容量": "共享",
        "支持功能": "DirectX 12",
        "麦克风": "双麦克风阵列",
        "音箱": "内置立体声扬声器",
        "电源": "外接电源适配器供电",
        "网卡": "无板载有线网卡",
        "声卡": "内置高清声卡",
        "键盘": "背光键盘",
        "鼠标": "多点触控触摸板",
        "外壳材质": "金属机身",
        "颜色": "银色",
        "操作系统": "Windows 11 家庭中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 5 220H",
        "主频": "性能核 2.7GHz / 能效核 2.1GHz",
        "最大频率": "4.9GHz",
        "缓存": "18MB 智能缓存",
        "硬件核心数": "12 核",
        "虚拟线程数": "16",
        "芯片组": "Intel SoC 集成平台",
        "标配内存": "32GB（16GB × 2）DDR5",
        "出厂最大内存": "32GB",
        "支持最大内存": "96GB（演示配置）",
        "硬盘": "M.2 2280 1TB PCIe NVMe 固态硬盘",
        "内存接口数量": "2 个 SO-DIMM 插槽",
        "硬盘接口数量": "2 个 M.2 插槽",
        "USB接口": "USB-A × 2；USB-C × 2",
        "视频接口": "HDMI；USB-C（支持视频输出）",
        "读卡器": "SD 读卡器",
        "屏幕尺寸": "14 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "2880 × 1800",
        "屏幕类型": "OLED 显示屏，120Hz",
        "集成显卡": "Intel Graphics",
        "电池": "60Wh 锂电池",
        "适配器": "100W USB-C 电源适配器",
        "无线网卡": "Wi-Fi 6",
        "蓝牙": "Bluetooth 5.2",
        "摄像头": "1080p 高清摄像头",
        "指纹识别": "无"
      }
    },
    "tianyi510s": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "耳机 / 麦克风接口；音频输出接口",
        "独立显卡": "无",
        "显存类型": "共享系统内存",
        "显存容量": "共享",
        "支持功能": "DirectX 12",
        "麦克风": "无，支持外接",
        "音箱": "需外接扬声器",
        "电源": "内置电源，交流供电",
        "网卡": "千兆以太网卡，RJ-45 接口",
        "声卡": "内置高清声卡",
        "键盘": "USB 有线键盘",
        "鼠标": "USB 有线鼠标",
        "外壳材质": "金属机箱 / 塑料面板",
        "颜色": "灰色",
        "操作系统": "Windows 11 家庭中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 i5-13400",
        "主频": "性能核 2.5GHz / 能效核 1.8GHz",
        "最大频率": "4.6GHz",
        "缓存": "20MB 智能缓存",
        "硬件核心数": "10 核（6 性能核 + 4 能效核）",
        "虚拟线程数": "16",
        "芯片组": "Intel B660（演示配置）",
        "标配内存": "16GB DDR4-3200",
        "出厂最大内存": "32GB",
        "支持最大内存": "32GB（演示配置）",
        "硬盘": "512GB PCIe NVMe 固态硬盘",
        "内存接口数量": "2 个内存插槽",
        "硬盘接口数量": "1 个 M.2 插槽；1 个 SATA 硬盘位",
        "USB接口": "USB-A 3.2 × 4；USB-A 2.0 × 2",
        "视频接口": "HDMI；VGA",
        "读卡器": "无",
        "屏幕尺寸": "主机不含显示器",
        "屏幕显示比例": "由外接显示器决定",
        "分辨率": "由外接显示器决定",
        "屏幕类型": "外接显示器",
        "集成显卡": "Intel UHD Graphics 730",
        "电池": "不适用（台式主机）",
        "适配器": "不适用（内置电源）",
        "无线网卡": "Wi-Fi 6（演示配置）",
        "蓝牙": "支持 Bluetooth（演示配置）",
        "摄像头": "无，支持外接",
        "指纹识别": "无"
      }
    },
    "xiaoxinpro16": {
      "kind": "computer",
      "values": {
        "光驱": "无",
        "音频接口": "3.5mm 耳机 / 麦克风二合一接口",
        "独立显卡": "无",
        "显存类型": "共享系统内存",
        "显存容量": "共享",
        "支持功能": "DirectX 12",
        "麦克风": "双麦克风阵列",
        "音箱": "内置立体声扬声器",
        "电源": "外接电源适配器供电",
        "网卡": "无板载有线网卡",
        "声卡": "内置高清声卡",
        "键盘": "背光键盘，含数字小键盘",
        "鼠标": "多点触控触摸板",
        "外壳材质": "金属机身",
        "颜色": "银色",
        "操作系统": "Windows 11 家庭中文版 64 位",
        "Office 软件": "Office 家庭和学生版（演示配置）",
        "CPU型号": "英特尔酷睿 Ultra 7（演示配置）",
        "主频": "动态调节",
        "最大频率": "以所选处理器配置为准",
        "缓存": "处理器集成缓存",
        "硬件核心数": "16 核（演示配置）",
        "虚拟线程数": "16（演示配置）",
        "芯片组": "Intel SoC 集成平台",
        "标配内存": "32GB DDR5",
        "出厂最大内存": "32GB",
        "支持最大内存": "64GB（演示配置）",
        "硬盘": "M.2 2280 1TB PCIe NVMe 固态硬盘",
        "内存接口数量": "2 个 SO-DIMM 插槽",
        "硬盘接口数量": "2 个 M.2 插槽",
        "USB接口": "USB-A × 2；USB-C × 2",
        "视频接口": "HDMI；USB-C（支持视频输出）",
        "读卡器": "SD 读卡器",
        "屏幕尺寸": "16 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "2560 × 1600",
        "屏幕类型": "高刷新率显示屏（演示配置）",
        "集成显卡": "Intel 集成显卡",
        "电池": "80Wh 锂电池（演示配置）",
        "适配器": "100W USB-C 电源适配器",
        "无线网卡": "Wi-Fi 6",
        "蓝牙": "支持 Bluetooth",
        "摄像头": "1080p 高清摄像头",
        "指纹识别": "无"
      }
    },
    "motorazr60": {
      "kind": "phone",
      "values": {
        "CPU型号": "联发科天玑 7400X",
        "最大频率": "2.6GHz",
        "硬件核心数": "8",
        "芯片组": "MediaTek Dimensity 7400X",
        "标配内存": "12GB 运行内存（演示配置）",
        "存储容量": "256GB",
        "存储扩展": "不支持存储卡扩展",
        "USB接口": "USB-C",
        "音频接口": "USB-C 数字音频",
        "屏幕尺寸": "内屏 6.9 英寸 / 外屏 3.6 英寸",
        "分辨率": "内屏 2640 × 1080 / 外屏 1066 × 1056",
        "屏幕类型": "折叠式 pOLED 显示屏",
        "刷新率": "内屏 120Hz / 外屏 90Hz",
        "图形处理器": "Arm Mali-G615 MC2",
        "麦克风": "内置麦克风",
        "音箱": "立体声扬声器，支持 Dolby Atmos",
        "电池": "4500mAh",
        "充电": "30W 有线充电 / 15W 无线充电",
        "移动网络": "5G / 4G",
        "无线网卡": "Wi-Fi 6E",
        "蓝牙": "Bluetooth 5.4",
        "摄像头": "后置 5000 万 + 1300 万像素 / 前置 3200 万像素",
        "指纹识别": "侧边指纹识别",
        "外壳材质": "金属中框 / 纹理背盖（演示配置）",
        "颜色": "蓝色（演示配置）",
        "操作系统": "Android 15"
      }
    },
    "xiaoxinpadpro": {
      "kind": "tablet",
      "values": {
        "CPU型号": "联发科天玑 8300（演示配置）",
        "最大频率": "3.35GHz",
        "硬件核心数": "8",
        "芯片组": "MediaTek 集成平台",
        "标配内存": "8GB LPDDR5X",
        "存储容量": "256GB",
        "存储扩展": "支持 microSD 存储卡（演示配置）",
        "USB接口": "USB-C",
        "音频接口": "USB-C 数字音频",
        "读卡器": "microSD 卡槽",
        "屏幕尺寸": "12.7 英寸",
        "屏幕显示比例": "16:10",
        "分辨率": "2944 × 1840",
        "屏幕类型": "LCD 显示屏",
        "刷新率": "144Hz",
        "图形处理器": "Arm Mali-G615",
        "麦克风": "内置麦克风阵列",
        "音箱": "JBL 四扬声器（演示配置）",
        "电池": "10200mAh（演示配置）",
        "充电": "45W USB-C 充电（演示配置）",
        "移动网络": "Wi-Fi 版，无蜂窝网络",
        "无线网卡": "Wi-Fi 6",
        "蓝牙": "Bluetooth 5.3",
        "摄像头": "后置 1300 万像素 / 前置 800 万像素（演示配置）",
        "键盘": "支持外接键盘",
        "触控笔": "支持联想触控笔（需另购）",
        "指纹识别": "侧边指纹识别（演示配置）",
        "外壳材质": "金属机身",
        "颜色": "灰色",
        "操作系统": "ZUI（基于 Android）"
      }
    }
  }
};

  function memberDeviceSpecificationsHtml(device){return window.__p0Modules.invoke("pages/device-detail#memberDeviceSpecificationsHtml:cf4b96b7063d7eb3b6369db7",{get ["memberDeviceSpecifications"](){return memberDeviceSpecifications},get ["escapeHtml"](){return escapeHtml}},this,arguments);}


  function memberDeviceDetailPage(id){return window.__p0Modules.invoke("pages/device-detail#memberDeviceDetailPage:6869c20a588e262ac9e1e1e7",{get ["deviceCatalog"](){return deviceCatalog},get ["state"](){return state},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons},get ["embeddedHost"](){return embeddedHost},get ["memberDeviceSpecificationsHtml"](){return memberDeviceSpecificationsHtml}},this,arguments);}

  function deviceFilterButton(key, label, count, activeFilter) {
    var active = key === activeFilter;
    return '<button class="leai-device-filter' + (active ? ' is-active' : '') + '" type="button" data-device-filter="' + key + '" aria-pressed="' + active + '"><span>' + label + '</span><strong>' + count + '</strong></button>';
  }

  function selectionPage(type) {
    var isDevice = type === "device";
    var values = isDevice ? ["拯救者游戏本", "ThinkBook 16p", "YOGA Air 14s"] : ["北京", "上海", "深圳"];
    var current = state.serviceContext[type];
    return '<section class="leai-page" data-selection-page="' + type + '"><header class="leai-page-header"><div><p class="leai-page-kicker">服务筛选</p><h1 class="leai-page-title">' + (isDevice ? "选择服务设备" : "选择服务地区") + '</h1><p class="leai-page-desc">选择后返回服务推荐页，不发送新消息。</p></div><span class="leai-status-pill">当前：' + escapeHtml(current) + '</span></header><section class="leai-panel"><div class="leai-selection-list">' + values.map(function (value) { return '<button class="leai-selection-option' + (value === current ? ' is-selected' : '') + '" type="button" data-service-context-option="' + type + '" data-service-context-value="' + value + '"><span><strong>' + value + '</strong><small>' + (value === current ? "当前已选" : "选择并返回服务推荐") + '</small></span><img src="' + icons.next + '" alt=""></button>'; }).join("") + '</div></section></section>';
  }

  function serviceDetailPage(serviceId) {
    var service = findService(serviceId) || serviceCatalog.thermal;
    var device = state.serviceDetailContext[service.id] || serviceDeviceContext(service.id);
    var isWarranty = Boolean(warrantyCatalog[service.id]);
    var guarantees = isWarranty ? [
      ["官方保障", "权益以服务系统实时结果为准"],
      ["保障续接", "生效时间以原保障到期日为准"],
      ["订单预约", "购买后可在订单查看服务权益"]
    ] : [
      ["官方服务", "由联想官方服务体系承接"],
      ["设备校验", "下单前核对型号与服务适用性"],
      ["预约到店", "购买后在订单中选择门店与时间"]
    ];
    return '<section class="leai-page leai-service-detail-page" data-service-detail-page aria-labelledby="leaiServiceDetailTitle"><div class="detail-main"><div class="detail-gallery"><div class="detail-badges"><span class="detail-badge-ai">乐享推荐</span><span class="detail-badge-hot">服务商品</span></div><div class="detail-visual"><img class="detail-product-image" src="' + service.image + '" alt="' + escapeHtml(service.name) + '"></div></div><div class="detail-info"><h1 class="leai-page-title detail-title" id="leaiServiceDetailTitle">' + escapeHtml(service.name) + '</h1><p class="detail-summary">' + escapeHtml(service.description) + '</p><div class="detail-fit-reason"><span><strong>适合你</strong> 已关联' + escapeHtml(device.name) + '，购买前仍会校验设备与服务适用性。<small>由联想乐享 AI 生成 · 仅供参考</small></span></div><div class="detail-tags"><span class="detail-tag">' + escapeHtml(service.tag) + '</span><span class="detail-tag">官方服务</span><span class="detail-tag">购买后预约</span></div><p class="detail-price">' + escapeHtml(service.price) + '</p><div class="detail-actions"><button class="detail-primary" type="button" data-service-buy="' + escapeHtml(service.id) + '">一键领优惠下单</button></div><div class="leai-service-detail-device"><strong>关联设备：' + escapeHtml(device.name) + '</strong><small>' + escapeHtml(device.product) + ' · ' + escapeHtml(device.sn) + '</small></div><div class="detail-service">' + guarantees.map(function (item) { return '<div class="service-item"><strong>' + item[0] + '</strong><span>' + item[1] + '</span></div>'; }).join("") + '</div></div></div><section class="leai-service-detail-section"><h2>服务内容</h2><p>' + escapeHtml(service.description) + '</p></section><section class="leai-service-detail-section"><h2>适用范围</h2><p>' + escapeHtml(service.scope) + '</p></section><section class="leai-service-detail-section"><h2>预约说明</h2><p>下单后可在订单中预约服务；实际门店、时间、价格与履约结果以服务系统及微信小程序回执为准。</p></section><p class="leai-member-disclaimer">当前服务商品、关联设备、价格与适用性均为 Mock 评审数据，请在购买前核对关键信息。</p></section>';
  }

  function appointmentCodePage() {
    var order = state.serviceOrder;
    if (!order) return '<section class="leai-page" data-appointment-code-page><header class="leai-page-header"><div><p class="leai-page-kicker">服务履约</p><h1 class="leai-page-title">预约服务</h1><p class="leai-page-desc">暂无可预约的服务订单。</p></div></header></section>';
    return '<section class="leai-page" data-appointment-code-page aria-labelledby="leaiAppointmentTitle"><header class="leai-page-header"><div><p class="leai-page-kicker">微信小程序衔接</p><h1 class="leai-page-title" id="leaiAppointmentTitle">微信扫码预约服务</h1><p class="leai-page-desc">打开微信扫一扫，进入联想服务小程序后选择门店与时间。</p></div><span class="leai-status-pill">订单待预约</span></header><section class="leai-panel"><div class="leai-wechat-handoff"><div class="leai-wechat-code" role="img" aria-label="微信小程序太阳码演示图"><div class="leai-wechat-code-grid">' + mockSunCodeCells() + '</div><span class="leai-wechat-code-mark"><img src="' + icons.membership + '" alt=""></span></div><div class="leai-wechat-guide"><strong>打开微信扫一扫</strong><p>扫描太阳码进入联想服务小程序，在订单中继续选择服务门店与预约时段。</p><dl><div><dt>服务订单</dt><dd>' + escapeHtml(order.orderId) + '</dd></div><div><dt>服务商品</dt><dd>' + escapeHtml(order.name) + '</dd></div><div><dt>服务设备</dt><dd>' + escapeHtml(order.device) + ' · ' + escapeHtml(order.sn) + '</dd></div></dl></div></div><p class="leai-member-disclaimer">演示太阳码，仅用于交互评审，当前不可真实扫描或预约；实际结果以微信小程序和履约服务回执为准。</p></section></section>';
  }

  function memberDevicesSection() {
    var keys = orderedDeviceKeys();
    var previewKeys = keys.slice(0, state.pendingDeviceBound ? devicePreviewLimit : devicePreviewLimit - 1);
    var pending = state.pendingDeviceBound ? "" : pendingDeviceCard();
    return '<section class="leai-panel leai-member-devices" id="leaiMemberDevices" data-member-devices><div class="leai-panel-head"><div><h2 class="leai-panel-title">我的设备</h2><p>' + keys.length + ' 台已绑定 · 1 台待绑定</p></div><div class="leai-device-section-actions"><button class="leai-secondary" type="button" data-device-add>绑定新设备 <span aria-hidden="true">+</span></button></div></div>' +
      '<div class="leai-device-browser"><button class="leai-device-nav is-previous" type="button" data-device-scroll="-1" aria-label="浏览上一组设备" disabled><img src="' + icons.next + '" alt=""></button>' +
      '<div class="leai-device-grid" data-device-track tabindex="0" role="region" aria-label="最近使用的设备，可横向浏览">' + pending + previewKeys.map(function (key) { return memberDeviceCard(deviceCatalog[key]); }).join("") + '</div><button class="leai-device-nav is-next" type="button" data-device-scroll="1" aria-label="浏览下一组设备"><img src="' + icons.next + '" alt=""></button></div>' +
      '</section>';
  }

  function orderedDeviceKeys() {
    var keys = Object.keys(deviceCatalog);
    if (!state.recentDeviceId || keys.indexOf(state.recentDeviceId) < 0) return keys;
    return [state.recentDeviceId].concat(keys.filter(function (key) { return key !== state.recentDeviceId; }));
  }

  function pendingDeviceCard() {
    return '<article class="leai-device-card leai-device-card-pending" data-device-slide data-member-device-pending="xiaoxinpro16"><div class="leai-device-visual"><img src="' + pendingPurchasedDevice.image + '" alt=""></div><div class="leai-device-body"><div class="leai-device-title-row"><h3>' + pendingPurchasedDevice.name + '</h3><em class="leai-device-status-tag is-pending">已购买·待绑定</em></div><dl><div><dt>购买时间</dt><dd>' + pendingPurchasedDevice.purchased + '</dd></div></dl><div class="leai-device-card-actions"><button class="leai-primary" type="button" data-device-bind-purchased>一键绑定</button></div></div></article>';
  }

  function memberDeviceCard(device) {
    return '<article class="leai-device-card" data-device-slide data-member-device="' + device.id + '"><div class="leai-device-visual"><img src="' + device.image + '" alt=""></div><div class="leai-device-body"><div class="leai-device-title-row"><h3>' + escapeHtml(device.name) + '</h3><span class="leai-device-status-tag' + (device.service === "保障中" ? ' is-covered' : '') + '">' + escapeHtml(device.service) + '</span></div><dl><div><dt>设备编号</dt><dd>' + escapeHtml(device.sn) + '</dd></div><div><dt>保障</dt><dd>' + escapeHtml(device.warranty.replace("基础保修至 ", "至 ")) + '</dd></div></dl><div class="leai-device-card-actions"><button class="leai-secondary" type="button" data-device-detail="' + device.id + '">查看详情</button>' + (device.extensionEligible ? '<button class="leai-primary" type="button" data-device-warranty="' + device.id + '">推荐延保方案</button>' : '') + '</div></div></article>';
  }

  function deviceRangeLabel(first, last) {
    var total = Object.keys(deviceCatalog).length;
    return "当前 " + first + "–" + last + " / " + total;
  }

  function pendingDeviceListRow() {
    return '<article class="leai-device-list-row is-pending" data-device-list-item data-member-device-pending="' + pendingPurchasedDevice.id + '"><img src="' + pendingPurchasedDevice.image + '" alt=""><span class="leai-device-list-copy"><small>已识别官方订单 · 待绑定</small><strong>' + pendingPurchasedDevice.name + '</strong><em>' + pendingPurchasedDevice.product + ' · ' + pendingPurchasedDevice.sn + '</em></span><span class="leai-device-row-warranty"><small>购买于</small><strong>' + pendingPurchasedDevice.purchased + '</strong></span><span class="leai-device-row-actions"><button class="leai-primary" type="button" data-device-bind-purchased>一键绑定</button></span></article>';
  }

  function memberDeviceListRow(device){return window.__p0Modules.invoke("pages/device-list#memberDeviceListRow:1f681012d610f9029463277b",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function personalIdentityTrack() {
    return '<section class="leai-identity-card leai-identity-track leai-personal-track" data-identity-card="personal-member" data-identity-track="personal" data-membership-system="personal"><div class="leai-identity-track-head"><span class="leai-member-level-title"><strong>铂金会员</strong></span><em>已生效</em></div><div class="leai-growth-journey"><div><span>铂金</span><span>钻石</span></div><i></i></div><div class="leai-growth-meta"><span>成长值 3,680 / 10,000</span><span>还差 6,320 成长值</span></div><p class="leai-growth-unlocks"><span class="leai-growth-unlock-label"><img src="' + icons.crown + '" alt="">升级可获得</span><span class="leai-growth-unlock-item"><img src="' + icons.rewards + '" alt="">新品优先购</span><span class="leai-growth-unlock-item"><img src="' + icons.referrals + '" alt="">延保专享</span><span class="leai-growth-unlock-item"><img src="' + icons.support + '" alt="">专属客服</span></p></section>';
  }

  function educationIdentityTrack() {
    syncStudentAuthState();
    var status = state.identityStatus.student;
    var reviewing = status === "reviewing";
    var verified = status === "verified";
    var title = verified ? "教育特惠" : reviewing ? "认证审核中" : "教育特惠";
    var description = verified ? "教育专享价与活动资格已生效" : reviewing ? (state.educationPath ? state.educationPath + "申请已提交，预计 1–3 个工作日完成" : "申请已提交，预计 1–3 个工作日完成") : "认证后解锁教育特惠";
    var action = verified ? '<div class="leai-education-actions"><a class="leai-secondary" href="' + educationHomeUrl + '" target="_blank" rel="noopener noreferrer" data-education-home>教育优惠活动主页</a><button class="leai-primary" type="button" data-education-recommend>推荐教育优惠商品</button></div>' : reviewing ? '<button class="leai-identity-track-action is-reviewing" type="button" disabled aria-disabled="true">认证审核中</button>' : identityTrackAction("student", "办理学生认证", "");
    return '<section class="leai-identity-card leai-identity-track leai-education-track is-' + status + '" data-identity-track="education" data-identity-card="student" data-identity-status="' + status + '"><div class="leai-education-title-line"><h3>' + title + '</h3><em>' + (verified ? "已认证" : reviewing ? "认证中" : "未认证") + '</em></div><p>' + description + '</p>' + action + '</section>';
  }

  function identityTrackAction(type, title, className) {
    return '<button class="leai-identity-track-action' + (className ? " " + className : "") + '" type="button" data-member-task="' + type + '">' + title + ' <img src="' + icons.next + '" alt=""></button>';
  }

  function memberAssetButton(type, value, unit, label, description) {
    var content = '<span>' + label + '<i aria-hidden="true">›</i></span><strong><b>' + value + '</b>' + (unit ? '<em>' + unit + '</em>' : '') + '</strong>';
    if (type === "benefitpoints") return '<a class="leai-member-asset" href="' + benefitPointsUrl + '" target="_blank" rel="noopener noreferrer">' + content + '</a>';
    return '<button class="leai-member-asset" type="button" data-member-asset="' + type + '">' + content + '</button>';
  }

  function memberBenefitItem(title, description) {
    return '<article class="leai-locked-benefit"><strong>' + title + '</strong><span>' + description + '</span></article>';
  }

  function benefitTooltip(key, icon, title, description, tooltip) {
    return '<button class="leai-benefit leai-tooltip-trigger" type="button" data-benefit-slide data-member-benefit="' + key + '" data-tooltip="' + key + '" aria-expanded="false"><span class="leai-benefit-icon"><img src="' + icon + '" alt=""></span><strong>' + title + '</strong><small>' + description + '</small><span class="leai-tooltip leai-benefit-detail-tooltip" role="tooltip" aria-hidden="true"><strong>' + title + '</strong><span>' + description + '</span><small>' + tooltip + '</small></span></button>';
  }

  function memberTaskButton(type, title, description) {
    return '<button class="leai-task-button" type="button" data-member-task="' + type + '"><span><strong>' + title + '</strong><small>' + description + '</small></span><img src="' + icons.next + '" alt=""></button>';
  }

  function servicePage() {
    if (state.serviceMode === "warranty") return warrantyServicePage();
    return '<section class="leai-page" data-member-service-page aria-labelledby="leaiServiceTitle">' + recommendationBrief("拯救者游戏本") +
      '<div class="leai-service-list" aria-label="推荐服务商品列表">' +
      serviceCard(serviceCatalog.clean, false, 1) + serviceCard(serviceCatalog.thermal, false, 2) + serviceCard(serviceCatalog.care, false, 3) +
      '</div><p class="leai-member-disclaimer">推荐由联想乐享基于当前 Mock 设备与地区条件生成；价格、适用性、库存与履约范围以服务商品详情页和结算页为准。</p>' +
      compareBar() + '</section>';
  }

  function warrantyServicePage() {
    var device = deviceCatalog[state.serviceDeviceId] || deviceCatalog.legiony7000p;
    var services = Object.keys(warrantyCatalog).map(function (key, index) { return serviceCard(warrantyCatalog[key], true, index + 1); }).join("");
    return '<section class="leai-page leai-warranty-page" data-member-service-page data-warranty-service-page aria-labelledby="leaiServiceTitle">' + warrantyRecommendationBrief(device) +
      '<div class="leai-service-list" aria-label="推荐延保服务商品列表">' + services + '</div><p class="leai-member-disclaimer">具体可购买性、价格与服务范围以服务商品系统实时校验结果为准。</p>' + compareBar() + '</section>';
  }

  function warrantyRecommendationBrief(device) {
    var eligibleKeys = orderedDeviceKeys().filter(function (key) { return Boolean(deviceCatalog[key].extensionEligible); });
    var options = eligibleKeys.map(function (key) {
      return warrantyDeviceOption(deviceCatalog[key], device.id === key);
    }).join("");
    var eligibleCount = Number(window.__lxWarrantyEligibleDeviceCount || eligibleKeys.length);
    var pickerActions = '<div class="leai-warranty-device-actions"><button type="button" data-warranty-open-devices>管理我的设备</button><button type="button" data-warranty-bind-device>绑定新设备</button></div>';
    var deviceControl = eligibleCount > 1 ? '<div class="leai-warranty-device-selector"><button class="leai-associated-device leai-warranty-device-trigger" type="button" data-warranty-device-trigger aria-expanded="' + state.warrantyDevicePickerOpen + '" aria-controls="leaiWarrantyDeviceOptions"><span>适用设备：' + escapeHtml(device.name) + ' · ' + escapeHtml(device.sn) + '</span><img src="' + icons.expand + '" alt=""></button>' + (state.warrantyDevicePickerOpen ? '<div class="leai-warranty-device-options" id="leaiWarrantyDeviceOptions" role="listbox" aria-label="选择适用设备">' + options + pickerActions + '</div>' : "") + '</div>' : '<div class="leai-warranty-single-device"><p class="leai-associated-device" data-warranty-single-device>适用设备：' + escapeHtml(device.name) + ' · ' + escapeHtml(device.sn) + '</p>' + pickerActions + '</div>';
    return '<header class="leai-recommendation-brief leai-warranty-brief"><div><h1 class="leai-page-title" id="leaiServiceTitle">延保服务推荐</h1><p>已根据设备型号、购买时间和保障节点完成适用性筛选。</p></div>' + deviceControl + '</header>';
  }

  function warrantyDeviceOption(device, selected) {
    return '<button class="leai-warranty-device-card' + (selected ? ' is-selected' : '') + '" type="button" role="option" data-warranty-device-option="' + device.id + '" aria-selected="' + selected + '"><img src="' + device.image + '" alt=""><span><strong>' + escapeHtml(device.name) + '</strong><small>' + escapeHtml(device.product) + ' · ' + escapeHtml(device.sn) + '</small><em>' + escapeHtml(device.warranty) + '</em></span><b>' + escapeHtml(device.maintenanceReason || "保障节点推荐") + '</b></button>';
  }

  function recommendationBrief(deviceName) {
    return '<header class="leai-recommendation-brief"><h1 class="leai-page-title" id="leaiServiceTitle">乐享推荐</h1><p class="leai-associated-device">关联设备：' + escapeHtml(deviceName) + '</p></header>';
  }

  function serviceCard(service, isWarranty, index) {
    var selected = state.serviceCompare.indexOf(service.id) >= 0;
    var recommended = state.serviceRecommended === service.id;
    var rank = '';
    var detail = '';
    var purchase = isWarranty ? '<button class="lx-p0-btn primary" type="button" data-service-buy="' + service.id + '">立即购买</button>' : '';
    return '<article class="reco-row' + (recommended ? " is-recommended" : "") + '" data-service-id="' + service.id + '"' + (isWarranty ? ' data-warranty-service' : '') + '>' + rank + '<img src="' + service.image + '" alt=""><div class="reco-row-main"><div class="leai-service-labels"><button class="leai-service-tag leai-tooltip-trigger" type="button" data-tooltip-trigger><span>' + service.tag + '</span><span class="leai-tooltip" role="tooltip">' + service.scope + '</span></button>' + (recommended ? '<span class="leai-recommended-badge">乐享推荐</span>' : "") + '</div><h2>' + service.name + '</h2><p class="reco-row-desc">' + service.description + '</p><button class="leai-service-compare-link" type="button" data-service-compare="' + service.id + '" aria-pressed="' + selected + '">' + (selected ? "已加入比较" : "加入比较") + '</button></div><div class="reco-row-side"><div class="reco-row-actions"><strong class="reco-row-price">' + service.price + '</strong>' + detail + purchase + '</div></div></article>';
  }

  function serviceOrdersPage() {
    var order = state.serviceOrder;
    if (!order) return '<section class="leai-page leai-orders-page"><div class="lx-orders-wrap"><div class="ohead"><h2><span class="bar"></span>我的订单</h2><span class="cnt">共 0 笔订单</span></div><section class="leai-order-empty"><strong>暂无服务订单</strong><p>购买服务商品后，可从这里继续预约和查看履约状态。</p></section></div></section>';
    return '<section class="leai-page leai-orders-page" aria-labelledby="leaiOrdersTitle"><div class="lx-orders-wrap"><div class="ohead"><h2 id="leaiOrdersTitle"><span class="bar"></span>我的订单</h2><span class="cnt">共 1 笔订单</span></div><div class="ol lx-order-skin"><article class="ord" data-service-order><div class="shot"><img src="' + order.image + '" alt=""></div><div class="mid"><div class="pn"><span class="nm">' + escapeHtml(order.name) + '</span><span class="ost done"><span class="d"></span>' + escapeHtml(order.status) + '</span></div><div class="meta"><span>服务订单</span><span class="sn">' + escapeHtml(order.orderId) + '</span><span class="dot"></span><span>' + escapeHtml(order.createdAt) + '</span><span class="amt">' + escapeHtml(order.price) + '</span></div><div class="recv">设备：' + escapeHtml(order.device) + ' · ' + escapeHtml(order.sn) + '　预约门店与时段请前往微信小程序选择</div></div><div class="acts"><button class="obtn order-ghost" type="button" data-service-detail="' + escapeHtml(state.serviceSelectedId) + '">订单详情</button><button class="obtn solid" type="button" data-service-order-appointment>预约服务</button></div><span class="leai-order-sync" data-service-status="purchase">' + escapeHtml(state.servicePurchaseStatus) + '</span></article></div><p class="leai-member-disclaimer">当前订单号、价格和状态均为 Mock 演示数据；预约入口仅展示渠道衔接，实际订单与履约结果以服务系统和微信小程序回执为准。</p></div></section>';
  }

  function compareBar() {
    var visible = state.serviceCompare.length > 0;
    var items = state.serviceCompare.map(function (id) {
      var service = findService(id);
      return '<span class="leai-compare-item" data-compare-item><span>' + service.name + '</span><button type="button" data-compare-remove="' + id + '" aria-label="移除' + service.name + '">移除</button></span>';
    }).join("");
    return '<aside class="leai-compare-bar' + (visible ? " is-visible" : "") + '" id="leaiCompareBar" aria-live="polite"><div><strong>服务比较</strong><span>' + state.serviceCompare.length + '/2</span></div><div class="leai-compare-items">' + items + '</div><div class="leai-compare-actions"><button class="leai-secondary" type="button" data-compare-clear>清空</button><button class="leai-primary" type="button" data-service-task="recommend"' + (state.serviceCompare.length < 2 ? " disabled" : "") + '>让乐享帮我选</button></div></aside>';
  }

  function findService(id) {
    return serviceCatalog[id] || warrantyCatalog[id] || null;
  }

  function toggleLab(open) { var lab = el("#leaiLab"); lab.classList.toggle("is-open", open); lab.setAttribute("aria-hidden", open ? "false" : "true"); }

  function resetConversation() {
    closeRightView(true);
    el("#leaiThread").innerHTML = "";
    document.body.dataset.state = "default";
    el(".assistant-panel .default-state").style.display = "block";
    el(".assistant-panel .chat-state").style.display = "none";
    hideSug();
  }

  function prefersReduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function delay(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  function nextFrame() { return new Promise(function (resolve) { window.requestAnimationFrame(function () { window.requestAnimationFrame(resolve); }); }); }

  function memberEventBelongsHere(event) {
    if (!embeddedHost || !event || !event.target) return false;
    var modal = document.querySelector("#leaiModal");
    return embeddedHost.contains(event.target) || Boolean(modal && modal.contains(event.target));
  }

  function installDemoPanel() {
    if (!document.body) return false;
    if (!document.querySelector("#leaiLab")) document.body.insertAdjacentHTML("beforeend", labHtml());
    if (!labListenersBound) {
      labListenersBound = true;
      document.addEventListener("click", function (event) {
        if (event.target.closest("#leaiLabTrigger, #leaiLab")) handleClick(event);
      }, true);
    }
    return true;
  }

  function bindTransientScrollbar(container) {
    if (!container || container.dataset.lxTransientScrollbarBound === "true") return;
    container.dataset.lxTransientScrollbarBound = "true";
    container.addEventListener("scroll", function () {
      if (container.scrollHeight <= container.clientHeight + 1) {
        container.classList.remove("is-scroll-active");
        return;
      }
      container.classList.add("is-scroll-active");
      window.clearTimeout(container.__lxScrollbarTimer);
      container.__lxScrollbarTimer = window.setTimeout(function () {
        container.classList.remove("is-scroll-active");
      }, 700);
    }, { passive: true });
  }

  function bindEmbeddedListeners() {
    if (embeddedListenersBound) return;
    embeddedListenersBound = true;
    document.addEventListener("click", function (event) {
      if (memberEventBelongsHere(event)) handleClick(event);
    }, true);
    document.addEventListener("keydown", function (event) {
      if (memberEventBelongsHere(event) || event.key === "Escape") handleKeydown(event);
    });
    document.addEventListener("change", function (event) {
      if (memberEventBelongsHere(event)) handlePageChange(event);
    }, true);
    document.addEventListener("submit", function (event) {
      if (memberEventBelongsHere(event)) handlePageSubmit(event);
    });
    window.addEventListener("storage", function (event) {
      if (event.key === studentAuthStorageKey) refreshStudentAuthState();
    });
    window.addEventListener("focus", refreshStudentAuthState);
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var payload = event.data;
      if (!payload) return;
      if (payload.type === "lexiang:device-bind-success" && payload.deviceId === pendingPurchasedDevice.id) {
        completePurchasedDeviceBindTransition();
      }
    });
  }

  function mountMemberComponent(host, view, options) {
    if (!host) return false;
    syncStudentAuthState();
    if (view === "devices") {
      state.deviceFocusId = options && options.deviceDetailId && deviceCatalog[options.deviceDetailId] ? options.deviceDetailId : "";
      state.deviceDetailOrigin = "devices";
    }
    embeddedHost = host;
    embeddedHost.id = "leaiAuiView";
    embeddedHost.classList.add("leai-aui-view", "leai-aui-embedded");
    embeddedHost.classList.toggle("lx-device-detail-tab", !!(options && options.deviceDetailId));
    if (!document.getElementById("lx-device-detail-tab-style")) {
      var detailTabStyle = document.createElement("style");
      detailTabStyle.id = "lx-device-detail-tab-style";
      detailTabStyle.textContent = window.__p0Modules.styleText("/@script-style/ea385d66fae33c13a9fc0613.css");
      document.head.appendChild(detailTabStyle);
    }
    embeddedHost.hidden = false;
    if (view === "service" && window.__lxPendingWarrantyDeviceId) {
      state.serviceMode = "warranty";
      state.serviceDeviceId = window.__lxPendingWarrantyDeviceId;
      state.warrantyDevicePickerOpen = false;
      state.serviceCompare = [];
      state.serviceRecommended = "warrantyYear1";
    }
    if (!document.querySelector("#leaiModal")) document.body.insertAdjacentHTML("beforeend", modalHtml());
    installDemoPanel();
    bindEmbeddedListeners();
    window.__lxCompleteDeviceBind = completePurchasedDeviceBindTransition;
    bindTransientScrollbar(embeddedHost);
    bindTransientScrollbar(document.querySelector(".assistant-panel .chat-state"));
    state.rightTabs = [view];
    state.rightView = view;
    state.rightViewDisplayMode = {};
    state.rightViewDisplayMode[view] = options && options.displayMode ? options.displayMode : "secondary";
    embeddedHost.innerHTML = rightViewHtml(view);
    embeddedHost.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    return true;
  }

  window.LXMemberService = Object.freeze({
    mount: mountMemberComponent,
    recommendDeviceWarranty: runWarrantyRecommendation,
    installDemoPanel: installDemoPanel,
    openDeviceBind: function (trigger) { openModal("deviceBind", trigger); },
    completeCheckin: function () {
      if (state.memberCheckedIn) return false;
      state.memberCheckedIn = true;
      if (state.rightView === "member") refreshRightView();
      return true;
    },
    version: "20260827-checkin-chat-v7"
  });
})();

};

/* public/leaip0/assets/frontend/js/core/education-member-state-sync-v1.js */
window.__p0Modules.sources["u642a431b6eaf7aa2"]=function(){
/* Synchronize the existing education result with the member-center presentation. */
(() => {
  if (window.__lxEducationMemberStateSyncV1) return;
  window.__lxEducationMemberStateSyncV1 = true;
  const legacyKey = 'lexiang.student.v1';
  const currentKey = 'lexiang.student.v2';
  const get = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const parse = raw => { try { const value = JSON.parse(raw); return value && typeof value === 'object' && !Array.isArray(value) ? value : null; } catch { return null; } };
  const status = value => value?.status === 'verified' ? 'verified' : ['pending', 'reviewing'].includes(value?.status) ? 'pending' : 'unverified';
  // One-time reset requested for the P0 education demonstration. Later certifications persist.
  const resetKey = 'lexiang.education.demo-reset.v1';
  const resetVersion = '2026-10-14-unverified-2';
  if (get(resetKey) !== resetVersion) {
    try {
      localStorage.setItem(legacyKey, JSON.stringify({ status: 'none' }));
      localStorage.setItem(currentKey, JSON.stringify({ status: 'unverified' }));
      localStorage.setItem(resetKey, resetVersion);
    } catch { /* Keep the page usable when browser storage is unavailable. */ }
  }
  let lastLegacy = get(legacyKey), lastCurrent = get(currentKey);
  const remember = () => { lastLegacy = get(legacyKey); lastCurrent = get(currentKey); };
  function sync(sourceKey) {
    const raw = get(sourceKey), source = parse(raw);
    if (raw !== null && !source) { remember(); return; }
    if (source && !['verified', 'pending', 'reviewing', 'none', 'unverified'].includes(source.status)) { remember(); return; }
    const targetKey = sourceKey === legacyKey ? currentKey : legacyKey;
    const before = get(targetKey);
    const target = parse(before) || {};
    const nextStatus = status(source);
    const next = { ...target, ...(source || {}), status: nextStatus === 'unverified' && targetKey === legacyKey ? 'none' : nextStatus };
    if (!source && !before) { remember(); return; }
    try {
      const after = JSON.stringify(next);
      if (after !== before) localStorage.setItem(targetKey, after);
    } catch { remember(); return; }
    remember();
    if (targetKey === currentKey && lastCurrent !== before) {
      window.dispatchEvent(new StorageEvent('storage', { key: currentKey, oldValue: before, newValue: lastCurrent, storageArea: localStorage, url: location.href }));
    }
  }
  function check() {
    if (get(legacyKey) !== lastLegacy) sync(legacyKey);
    else if (get(currentKey) !== lastCurrent) sync(currentKey);
  }
  // Preserve existing completed results when installing the bridge for the first time.
  const legacy = parse(lastLegacy), current = parse(lastCurrent);
  if (legacy || current) {
    const legacyTime = Number(legacy?.submittedAt) || 0;
    const currentTime = Number(current?.submittedAt) || 0;
    const legacyWins = !current || (legacy && (legacyTime > currentTime || (legacyTime === currentTime && status(legacy) === 'verified' && status(current) !== 'verified')));
    sync(legacyWins ? legacyKey : currentKey);
  }
  // Flush same-tab updates before routing a new query, including the existing demo review timer.
  window.__lxReadEducationState = () => {
    check();
    const state = parse(get(legacyKey)) || { status: 'none' };
    if (state.status === 'pending' && state.submittedAt && Date.now() - Number(state.submittedAt) > 12000) {
      state.status = 'verified';
      try { localStorage.setItem(legacyKey, JSON.stringify(state)); sync(legacyKey); } catch {}
    }
    return state;
  };
  window.addEventListener('storage', event => { if (!event.key || event.key === legacyKey || event.key === currentKey) check(); });
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  window.setInterval(check, 400);
})();

};

/* public/leaip0/assets/frontend/js/core/member-service-checkin-v135.js */
window.__p0Modules.sources["u9f15dc235f518932"]=function(){
(function () {
  "use strict";

  var memberRuntimeScriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  var memberAssetsBaseUrl = new URL("../../../", memberRuntimeScriptUrl);

  function resolveMemberAssetUrl(value) {
    return typeof value === "string" && value.indexOf("/assets/") === 0
      ? new URL(value.slice("/assets/".length), memberAssetsBaseUrl).href
      : value;
  }

  function repairMemberAssetUrls(root) {
    if (!root || root.nodeType !== 1) return;
    var nodes = root.matches && root.matches("img[src], source[src], source[srcset]") ? [root] : [];
    if (root.querySelectorAll) nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll("img[src], source[src], source[srcset]")));
    nodes.forEach(function (node) {
      ["src", "srcset"].forEach(function (attribute) {
        var value = node.getAttribute(attribute);
        var resolved = resolveMemberAssetUrl(value);
        if (resolved !== value) node.setAttribute(attribute, resolved);
      });
    });
  }

  var memberAssetObserver = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "attributes") repairMemberAssetUrls(record.target);
      Array.prototype.forEach.call(record.addedNodes || [], repairMemberAssetUrls);
    });
  });
  if (document.body) memberAssetObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset"] });

  var icons = {
    next: "/assets/icons/global-next.svg",
    compactChevron: "/assets/icons/global-expand.svg",
    expand: "/assets/icons/global-expand.svg",
    check: "/assets/icons/global-check.svg",
    calendar: "/assets/icons/member-checkin-calendar-v36.svg",
    edit: "/assets/icons/member-edit-figma-v36.svg",
    sparkle: "/assets/icons/global-sparkle.svg",
    memberSparkle: "/assets/icons/member-sparkle-gradient-v36.svg",
    account: "/assets/icons/mall-account.svg",
    membership: "/assets/icons/shortcut-membership.svg",
    rewards: "/assets/icons/shortcut-rewards.svg",
    customization: "/assets/icons/shortcut-customization.svg",
    trial: "/assets/icons/shortcut-trial.svg",
    referrals: "/assets/icons/shortcut-referrals.svg",
    support: "/assets/icons/shortcut-support.svg",
    crown: "/assets/icons/member-level-crown-v36.svg"
  };

  var state = {
    modalType: "",
    rightView: "",
    rightTabs: [],
    rightViewDisplayMode: {},
    sugKey: "",
    serviceCompare: [],
    serviceRecommended: "",
    serviceMode: "cleaning",
    serviceDeviceId: "",
    serviceSelectedId: "thermal",
    serviceDetailContext: {},
    serviceBuyRunning: false,
    pendingServiceOrder: null,
    serviceOrder: null,
    servicePurchaseStatus: "未购买",
    serviceAppointmentStatus: "未预约",
    requestSequence: 0,
    educationAudience: "college",
    educationMethod: "edu",
    educationPath: "",
    memberCheckedIn: false,
    pendingDeviceBound: false,
    recentDeviceId: "",
    deviceFilter: "all",
    assetFilters: { points: "all", coupons: "all", vouchers: "all", redpacket: "all" },
    assetPeriods: { points: "6m", coupons: "all", vouchers: "all", redpacket: "all" },
    deviceFocusId: "",
    deviceListScrollTop: 0,
    warrantyDevicePickerOpen: false,
    couponDetailsOpen: {},
    assetRuleOpen: {},
    profileTarget: "",
    profilePhoneStatus: "",
    profile: { nickname: "联小想", gender: "secret", birthday: "1998-05-18", phone: "182****4919", customAvatar: "", avatar: "membership" },
    serviceContext: { device: "拯救者游戏本", region: "北京" },
    identityStatus: { student: "unverified" },
    submitted: { student: false, purchase: false, appointment: false }
  };
  var embeddedHost = null;
  var embeddedListenersBound = false;
  var labListenersBound = false;
  var benefitPointsUrl = "https://activity.lenovo.com.cn/sales/quanyidian.html";
  var educationHomeUrl = "https://shop.lenovo.com.cn/page/xs/jyth.html";
  var educationRecommendationQuery = "推荐教育优惠商品";

  var studentAuthStorageKey = "lexiang.student.v2";
  var studentAuthReviewMs = 12000;

  function syncStudentAuthState() {
    var stored;
    try {
      stored = JSON.parse(window.localStorage.getItem(studentAuthStorageKey) || "null");
    } catch (error) {
      return false;
    }
    if (!stored || typeof stored !== "object") return false;
    if (stored.status === "pending" && !stored.demo && stored.submittedAt && Date.now() - Number(stored.submittedAt) >= studentAuthReviewMs) {
      stored.status = "verified";
      try { window.localStorage.setItem(studentAuthStorageKey, JSON.stringify(stored)); } catch (error) {}
    }
    var nextStatus = stored.status === "verified" ? "verified" : stored.status === "pending" ? "reviewing" : "unverified";
    if (state.identityStatus.student === nextStatus) return false;
    state.identityStatus.student = nextStatus;
    return true;
  }

  function refreshStudentAuthState() {
    if (!syncStudentAuthState()) return;
    if (state.rightView === "member") refreshRightView();
  }

  var serviceCatalog = {
    clean: { id: "clean", name: "笔记本深度清灰", tag: "深度清灰", description: "拆机深度清洁，包含风扇、主板、键盘与机身表面等部位。", price: "¥169起", image: "/assets/img/shop-8.jpg", scope: "适用于多数联想笔记本；使用超过 5 年或存在进液、异物、磕碰时需先检测。" },
    thermal: { id: "thermal", name: "深度清灰 + 更换硅脂", tag: "清灰换硅", description: "在深度清灰基础上更换散热硅脂，并完成清洁后开机检测。", price: "¥299起", image: "/assets/img/shop-1.jpg", scope: "适合游戏本或散热压力较高的设备；具体可用性以设备型号和门店能力为准。" },
    care: { id: "care", name: "整机清洁保养服务", tag: "日常保养", description: "完成外观、键盘、接口和散热风道基础清洁，并提供设备健康检查。", price: "¥129起", image: "/assets/img/shop-13.jpg", scope: "适用于日常清洁保养；拆机项目、配件更换和故障维修需根据设备检测结果另行确认。" },
    appointment: { id: "appointment", name: "深度清灰预约", tag: "购买后服务", description: "已购买对应服务的用户，可按订单与设备进入预约与履约查询。", price: "需先校验订单", image: "/assets/img/shop-13.jpg", scope: "仅对已购买且仍可履约的服务订单开放，需选择可服务门店和时段。" }
  };
  var warrantyCatalog = {
    warrantyYear1: { id: "warrantyYear1", name: "一年整机延保", tag: "整机延保", description: "在当前基础保修到期后，延长 1 年整机保修服务。", price: "¥399起", image: "/assets/img/shop-7.jpg", scope: "适用于当前账号已绑定且尚在可购买期内的拯救者 Y7000P；以实时 SKU 校验为准。" },
    warrantyYear2: { id: "warrantyYear2", name: "两年整机延保", tag: "长期保障", description: "连续延长 2 年整机保修，适合计划长期使用的设备。", price: "¥699起", image: "/assets/img/thinkbook.jpg", scope: "需同时满足设备型号、购买时间与当前保障状态条件；以服务商品系统结果为准。" },
    warrantyDoor: { id: "warrantyDoor", name: "延保 + 上门服务升级", tag: "延保升级", description: "延长保修期，并增加指定地区上门服务权益。", price: "¥899起", image: "/assets/img/shop-8.jpg", scope: "上门范围、服务次数与可购买性需根据设备所在地区再次校验。" }
  };

  var memberAssets = {
    points: {
      pattern: /乐豆/,
      label: "乐豆",
      answer: "你当前有<strong>2,580 乐豆</strong>。近 30 天获得 860、使用 300；明细已在右侧打开。",
      cardDescription: "余额 2,580 · 近 30 天 +860 / -300"
    },
    coupons: {
      pattern: /优惠券/,
      label: "优惠券",
      answer: "你当前有<strong>3 张优惠券</strong>，其中 1 张将在 7 天后到期；可用券详情已在右侧打开。",
      cardDescription: "3 张可用 · 1 张即将到期"
    },
    vouchers: {
      pattern: /代金券/,
      label: "代金券",
      answer: "你当前有<strong>2 张代金券</strong>，分别为教育认证代金券和以旧换新补贴券；详情已在右侧打开。",
      cardDescription: "2 张可用 · 教育/换新场景"
    },
    redpacket: {
      pattern: /红包/,
      label: "限时红包",
      answer: "你当前有<strong>2 个限时红包</strong>，最近 1 个将在明日到期；详情已在右侧打开。",
      cardDescription: "2 个可用 · 最近 1 个明日到期"
    },
    benefitpoints: {
      pattern: /权益点/,
      label: "权益点",
      answer: "你当前有<strong>1,200 权益点</strong>，可用于兑换指定会员服务；明细已在右侧打开。",
      cardDescription: "1,200 权益点 · 可兑换会员服务"
    }
  };

  var couponCatalog = [
    { id: "service-clean-30", value: "¥30", title: "会员专享清洁保养券", validFrom: "2026.08.01 00:00", validTo: "2026.09.01 23:59", description: "指定笔记本清灰、清洁保养服务商品满 299 元可用。", status: "available", productSkus: ["SERVICE-PASTE-299", "SERVICE-CLEAN-169"] },
    { id: "education-300", value: "¥300", title: "教育认证专享代金券", validFrom: "2026.08.01 00:00", validTo: "2026.09.30 23:59", description: "已完成教育认证的用户购买指定教育优惠商品时可用。", status: "available", productSkus: ["EDU-XIAOXIN-5499", "EDU-YOGA-6999"] },
    { id: "accessory-20", value: "¥20", title: "会员配件满 199 减 20", validFrom: "2026.08.10 00:00", validTo: "2026.09.10 23:59", description: "购买指定联想原装配件，订单金额满 199 元可用。", status: "available", productSkus: ["EDU-THINKPLUS-399"] },
    { id: "member-day-50", value: "¥50", title: "会员日满 999 减 50", validFrom: "2026.08.01 00:00", validTo: "2026.08.18 23:59", description: "会员日指定商品订单满 999 元可用。", status: "used", productSkus: [] },
    { id: "new-product-100", value: "¥100", title: "新品首发满 3000 减 100", validFrom: "2026.07.01 00:00", validTo: "2026.07.31 23:59", description: "指定新品首发活动订单满 3000 元可用。", status: "expired", productSkus: [] }
  ];

  var couponProductCatalog = {
    "SERVICE-CLEAN-169": { sku: "SERVICE-CLEAN-169", name: "笔记本深度清灰", price: 169, image_url: "/assets/img/shop-1.jpg", description: "拆机深度清洁风扇、主板、键盘与机身表面。", promotion_tags: ["服务商品"], official: true, type: "product", commerceType: "service-product", category: "服务产品" },
    "SERVICE-PASTE-299": { sku: "SERVICE-PASTE-299", name: "深度清灰 + 更换硅脂", price: 299, image_url: "/assets/img/shop-2.jpg", description: "完成深度清灰、更换散热硅脂与开机检测。", promotion_tags: ["服务商品"], official: true, type: "product", commerceType: "service-product", category: "服务产品" },
    "EDU-XIAOXIN-5499": { sku: "EDU-XIAOXIN-5499", name: "小新 Pro 14 教育优惠款", price: 5499, image_url: "/assets/img/shop-2.jpg", description: "适合学习、创作与日常办公的轻薄性能本。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "笔记本" },
    "EDU-YOGA-6999": { sku: "EDU-YOGA-6999", name: "YOGA Air 14s 教育优惠款", price: 6999, image_url: "/assets/img/shop-8.jpg", description: "兼顾便携、屏幕表现与 AI 学习场景。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "笔记本" },
    "EDU-THINKPLUS-399": { sku: "EDU-THINKPLUS-399", name: "ThinkPlus 教育办公配件套装", price: 399, image_url: "/assets/img/shop-10.jpg", description: "键鼠与扩展配件组合，适合宿舍和课堂使用。", promotion_tags: ["教育特惠"], official: true, type: "product", commerceType: "retail-product", category: "配件" }
  };

  var deviceCatalog = {
    thinkbook16p: {
      id: "thinkbook16p",
      name: "ThinkBook 16p",
      product: "ThinkBook 16p Gen 5",
      sn: "PF4X****",
      image: "/assets/img/thinkbook.jpg",
      warranty: "基础保修至 2027-08-30",
      purchased: "2025-03-25",
      service: "保障中"
    },
    legiony7000p: {
      id: "legiony7000p",
      name: "拯救者 Y7000P",
      product: "Legion Y7000P 2025",
      sn: "MP2G****",
      image: "/assets/img/shop-7.jpg",
      warranty: "基础保修至 2027-05-18",
      purchased: "2025-05-18",
      service: "可购买延保服务",
      maintenanceReason: "购机保障节点",
      extensionEligible: true
    },
    yogaair14s: {
      id: "yogaair14s",
      name: "YOGA Air 14s",
      product: "YOGA Air 14s AI 元启",
      sn: "YN3A****",
      image: "/assets/img/shop-8.jpg",
      warranty: "基础保修至 2026-11-06",
      purchased: "2024-11-06",
      service: "保障中"
    },
    thinkpadt14: {
      id: "thinkpadt14",
      name: "ThinkPad T14",
      product: "ThinkPad T14 Gen 6",
      sn: "PC3K****",
      image: "/assets/img/thinkpad.jpg",
      warranty: "基础保修至 2027-02-16",
      purchased: "2025-02-16",
      service: "企业服务可用"
    },
    xiaoxinpro14: {
      id: "xiaoxinpro14",
      name: "小新 Pro 14",
      product: "小新 Pro 14 2025",
      sn: "PF6N****",
      image: "/assets/img/shop-2.jpg",
      warranty: "基础保修至 2026-10-08",
      purchased: "2024-10-08",
      service: "保障中"
    },
    tianyi510s: {
      id: "tianyi510s",
      name: "天逸 510S",
      product: "天逸 510S 台式电脑",
      sn: "MJ0A****",
      image: "/assets/img/shop-4.jpg",
      warranty: "基础保修至 2026-08-22",
      purchased: "2023-08-22",
      service: "可购买延保服务",
      maintenanceReason: "临近保修到期",
      extensionEligible: true
    },
    motorazr60: {
      id: "motorazr60",
      name: "moto razr 60",
      product: "moto razr 60 折叠屏",
      sn: "ZY2K****",
      image: "/assets/img/shop-13.jpg",
      warranty: "基础保修至 2027-06-02",
      purchased: "2026-06-02",
      service: "保障中"
    },
    xiaoxinpadpro: {
      id: "xiaoxinpadpro",
      name: "小新 Pad Pro",
      product: "小新 Pad Pro 12.7",
      sn: "HA1D****",
      image: "/assets/img/shop-10.jpg",
      warranty: "基础保修至 2027-01-12",
      purchased: "2025-01-12",
      service: "保障中"
    }
  };
  var devicePreviewLimit = 6;
  var deviceAliases = {
    thinkbook16p: ["thinkbook16p", "thinkbook 16p", "think book 16p"],
    legiony7000p: ["拯救者y7000p", "拯救者 y7000p", "legiony7000p", "legion y7000p", "y7000p"],
    yogaair14s: ["yogaair14s", "yoga air 14s", "air14s", "air 14s"],
    thinkpadt14: ["thinkpadt14", "thinkpad t14", "think pad t14"],
    xiaoxinpro14: ["小新pro14", "小新 pro 14"],
    tianyi510s: ["天逸510s", "天逸 510s"],
    motorazr60: ["motorazr60", "moto razr 60", "razr60", "razr 60"],
    xiaoxinpadpro: ["小新padpro", "小新 pad pro", "padpro", "pad pro"]
  };
  var pendingPurchasedDevice = {
    id: "xiaoxinpro16",
    name: "小新 Pro 16",
    product: "小新 Pro 16 2026",
    sn: "PF8Q****",
    image: "/assets/img/shop-2.jpg",
    warranty: "基础保修至 2028-08-12",
    purchased: "2026-08-12",
    service: "保障中"
  };

  var ledouCatalog = [
    { id: "organizer", name: "乐享桌面收纳套装", price: "¥19.9 + 1,000 乐豆", icon: icons.rewards, description: "桌面线材与小物分类收纳，适合家庭和办公桌面。" },
    { id: "nightlight", name: "便携氛围小夜灯", price: "¥13.9 + 600 乐豆", icon: icons.customization, description: "便携柔光照明，适合床头、桌面和差旅使用。" },
    { id: "mouse", name: "无线静音鼠标", price: "¥113 + 600 乐豆", icon: icons.trial, description: "静音按键与无线连接，适合日常移动办公。" }
  ];

  var copy = {
    student: {
      title: "教育认证",
      description: "选择身份与认证方式，补齐对应材料后提交。审核结果以教育认证服务回执为准。",
      button: "立即认证",
      query: "我想办理学生教育认证"
    },
    purchase: {
      title: "确认购买服务",
      description: "请核对服务、设备、地区与价格。提交后以服务商品系统回执为准。",
      submitLabel: "确认购买",
      fields: [
        ["服务商品", "select", ["深度清灰 + 更换硅脂"]],
        ["服务设备", "select", ["拯救者游戏本"]],
        ["服务地区", "select", ["北京"]],
        ["参考价格", "select", ["¥299起"]]
      ]
    },
    appointment: {
      title: "确认服务预约",
      description: "请核对已购服务、服务门店与到店时段。预约结果以履约系统回执为准。",
      submitLabel: "确认预约",
      fields: [
        ["已购服务", "select", ["深度清灰 + 更换硅脂"]],
        ["服务门店", "select", ["联想智生活北京中关村店", "联想智生活北京国贸店"]],
        ["到店时段", "select", ["8 月 16 日 10:00–12:00", "8 月 16 日 14:00–16:00"]]
      ]
    },
    deviceBind: {
      title: "绑定新设备",
      description: "填写设备序列号与名称。绑定结果以设备资产服务回执为准。",
      submitLabel: "确认绑定",
      fields: [
        ["设备序列号（SN）", "input", "请输入设备 SN"],
        ["设备名称", "input", "例如：工作用 ThinkPad"],
        ["购买渠道", "select", ["联想官网", "联想官方商城", "线下门店", "其他渠道"]]
      ]
    }
  };

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function el(selector) {
    if (embeddedHost) {
      if (embeddedHost.matches && embeddedHost.matches(selector)) return embeddedHost;
      var scoped = embeddedHost.querySelector(selector);
      if (scoped) return scoped;
    }
    return document.querySelector(selector);
  }

  function ensureShell() {
    var composer = el(".assistant-panel .composer");
    var textarea = composer && composer.querySelector("textarea");
    var chat = el(".assistant-panel .chat-state");
    var content = el(".shell > .content");
    if (!composer || !textarea || !chat || !content) return null;

    if (!el("#leaiSug")) {
      var sug = document.createElement("section");
      sug.id = "leaiSug";
      sug.className = "leai-sug";
      sug.setAttribute("aria-live", "polite");
      composer.parentNode.insertBefore(sug, composer);
    }
    if (!el("#leaiThread")) chat.innerHTML = '<div class="leai-thread" id="leaiThread"></div>';
    if (!el("#leaiAuiTabs")) {
      content.insertAdjacentHTML("beforeend", '<div class="leai-aui-tabs" id="leaiAuiTabs" hidden></div><div class="leai-aui-view" id="leaiAuiView" hidden></div>');
    }
    if (!el("#leaiModal")) document.body.insertAdjacentHTML("beforeend", modalHtml());
    if (!el("#leaiLab")) document.body.insertAdjacentHTML("beforeend", labHtml());
    return { composer: composer, textarea: textarea, chat: chat, content: content };
  }

  function modalHtml() {
    return '<div class="leai-modal-mask" id="leaiModal" aria-hidden="true">' +
      '<section class="leai-modal" role="dialog" aria-modal="true" aria-labelledby="leaiModalTitle">' +
      '<header class="leai-modal-head"><div><h2 class="leai-modal-title" id="leaiModalTitle"></h2><p class="leai-modal-desc" id="leaiModalDesc"></p></div>' +
      '<button class="leai-modal-close" type="button" data-modal-close>关闭</button></header>' +
      '<form class="leai-modal-body" id="leaiModalForm"></form></section></div>';
  }

  function labHtml() {
    return '<button class="leai-lab-trigger" type="button" id="leaiLabTrigger"><img src="' + icons.sparkle + '" alt="">演示场景</button>' +
      '<aside class="leai-lab" id="leaiLab" aria-hidden="true" aria-label="POC 演示场景与依赖说明">' +
      '<div class="leai-lab-head"><h2 class="leai-lab-title">演示场景</h2><button class="leai-lab-close" type="button" data-lab-close>关闭</button></div>' +
      '<p class="leai-lab-copy">选择场景会回填或发送一条演示 query。SUG 选择本身不发送，办理弹窗仍需用户点击左侧按钮。</p>' +
      '<div class="leai-lab-scenarios">' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="认证" data-demo-mode="draft">输入中 SUG：认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我想打开会员中心" data-demo-mode="send">会员中心右页</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我的设备" data-demo-mode="send">我的设备：会员中心定位</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="points">资产：乐豆筛选</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="coupons">资产：优惠券筛选</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="vouchers">资产：代金券明细</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-asset="redpacket">资产：限时红包明细</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="unverified">教育优惠：未认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="reviewing">教育优惠：认证中</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-education-status="verified">教育优惠：已认证</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="我想办理学生教育认证" data-demo-mode="send">学生认证：先按钮后弹窗</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-query="电脑清灰换硅脂" data-demo-mode="send">清灰换硅脂：直接推荐</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-warranty="single">延保：单设备直接推荐</button>' +
      '<button class="leai-lab-scenario" type="button" data-demo-warranty="multiple">延保：多设备先选择</button>' +
      '</div>' +
      '<section class="leai-dependency"><h3>Mock 依赖</h3><dl>' +
      '<dt>会员数据</dt><dd>会员中心服务；权限：登录+用户授权；兜底：不生成个人数据。</dd>' +
      '<dt>设备数据</dt><dd>设备资产服务；依赖 Lenovo ID 与设备绑定关系；SN 仅脱敏展示。</dd>' +
      '<dt>认证状态</dt><dd>教育认证权威服务；弹窗展示前和按钮点击时二次校验。</dd>' +
      '<dt>服务商品</dt><dd>商品/服务系统；清灰、换硅脂直接返回服务商品，延保按可用设备数分流；无结果时转官方入口或人工。</dd>' +
      '<dt>预约渠道</dt><dd>订单仅展示微信小程序衔接；太阳码、门店、时段与预约结果当前均为 Mock。</dd>' +
      '<dt>完成口径</dt><dd>申请、购买、预约与履约均以下游权威回执为准。</dd>' +
      '</dl></section></aside>';
  }

  function boot() {
    var shell = ensureShell();
    if (!shell) return;
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "assistant-collapsed");
    document.body.dataset.state = "default";
    shell.textarea.placeholder = "输入会员或服务问题";
    var replacement = shell.composer.cloneNode(true);
    shell.composer.replaceWith(replacement);
    shell.composer = replacement;
    shell.textarea = replacement.querySelector("textarea");
    shell.textarea.placeholder = "输入会员或服务问题";
    replacement.querySelectorAll(".lx-suggest-panel").forEach(function (node) { node.remove(); });
    new MutationObserver(function () {
      replacement.querySelectorAll(".lx-suggest-panel").forEach(function (node) { node.remove(); });
    }).observe(replacement, { childList: true, subtree: true });

    document.querySelectorAll("[data-quick-placeholder]").forEach(function (button) {
      button.removeAttribute("aria-disabled");
      button.removeAttribute("tabindex");
    });
    var quicks = ["打开会员中心，查看我的会员权益", "我想办理学生教育认证", "我想给拯救者游戏本清灰换硅脂", "教育认证需要准备哪些材料？", "如何预约深度清灰服务？"];
    document.querySelectorAll("[data-quick-placeholder] span").forEach(function (node, index) { node.textContent = quicks[index]; });

    shell.textarea.addEventListener("input", function () { renderSug(shell.textarea.value); });
    shell.composer.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var query = shell.textarea.value.trim();
      if (!query) return;
      shell.textarea.value = "";
      hideSug();
      runQuery(query);
    });
    shell.textarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        shell.composer.requestSubmit();
      }
    });

    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("change", handlePageChange, true);
    document.addEventListener("submit", handlePageSubmit);
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var payload = event.data;
      if (!payload) return;
      if (payload.type === "lexiang:profile-updated" && payload.profile) { Object.assign(state.profile, payload.profile); refreshRightView(); return; }
      if (payload.type === "lexiang:device-bind-success" && payload.deviceId === pendingPurchasedDevice.id) {
        completePurchasedDeviceBindTransition(); return;
      }
      if (payload.type === "lexiang:device-warranty-success" && payload.deviceId) {
        state.serviceMode = "warranty"; state.serviceDeviceId = payload.deviceId; state.warrantyDevicePickerOpen = false;
        state.serviceCompare = []; state.serviceRecommended = "warrantyYear1"; openRightView("service");
      }
    });
    window.__lxCompleteDeviceBind = completePurchasedDeviceBindTransition;
    renderSug("");
  }

  function completePurchasedDeviceBindTransition(){return window.__p0Modules.invoke("modals/device-bind#completePurchasedDeviceBindTransition:0360ede52ebd7b888014bff3",{get ["state"](){return state},get ["pendingPurchasedDevice"](){return pendingPurchasedDevice},get ["deviceCatalog"](){return deviceCatalog},get ["refreshRightView"](){return refreshRightView}},this,arguments);}

  function submitComposerQuery(query, context) {
    var composer = document.querySelector(".assistant-panel .composer");
    var input = composer && composer.querySelector("textarea");
    if (!composer || !input || !query) return false;
    if (context) {
      window.__lxPendingMemberInsight = {
        query: query,
        type: context.type || "",
        source: String(context.source || "").trim()
      };
    }
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    composer.requestSubmit();
    return true;
  }

  function setEducationDemoStatus(status) {
    var next = ["unverified", "reviewing", "verified"].indexOf(status) >= 0 ? status : "unverified";
    state.identityStatus.student = next;
    state.submitted.student = false;
    try {
      if (next === "unverified") window.localStorage.removeItem(studentAuthStorageKey);
      else window.localStorage.setItem(studentAuthStorageKey, JSON.stringify({ status: next === "reviewing" ? "pending" : "verified", submittedAt: Date.now(), demo: true }));
    } catch (error) {}
  }

  function handleClick(event) {
    document.querySelectorAll("[data-ledou-period-menu]").forEach(function (menu) {
      if (!event.target.closest("[data-ledou-period-picker]")) {
        menu.hidden = true;
        var trigger = menu.parentElement.querySelector("[data-ledou-period-trigger]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      }
    });
    if (!event.target.closest("[data-asset-rule-trigger], [data-asset-rule-tooltip]")) {
      document.querySelectorAll("[data-asset-rule-tooltip]:not([hidden])").forEach(function (tooltip) {
        tooltip.hidden = true;
        tooltip.setAttribute("aria-hidden", "true");
      });
      document.querySelectorAll("[data-asset-rule-trigger][aria-expanded=true]").forEach(function (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        state.assetRuleOpen[trigger.dataset.assetRuleTrigger] = false;
      });
    }
    var benefit = event.target.closest("[data-member-benefit]");
    document.querySelectorAll(".leai-benefit-detail-tooltip[data-benefit-portal-owner]").forEach(function (tip) {
      var ownerKey = tip.getAttribute("data-benefit-portal-owner");
      var owner = document.querySelector('[data-member-benefit="' + ownerKey + '"]');
      if (!benefit || benefit.getAttribute("data-member-benefit") !== ownerKey) {
        tip.classList.remove("is-portal-open");
        tip.removeAttribute("data-benefit-portal-owner");
        tip.setAttribute("aria-hidden", "true");
        if (owner) owner.appendChild(tip);
        else tip.remove();
      }
    });
    document.querySelectorAll("[data-member-benefit].is-tooltip-open").forEach(function (item) {
      if (item !== benefit) {
        item.classList.remove("is-tooltip-open");
        item.setAttribute("aria-expanded", "false");
      }
    });
    if (benefit) {
      var willOpen = !benefit.classList.contains("is-tooltip-open");
      benefit.classList.toggle("is-tooltip-open", willOpen);
      benefit.setAttribute("aria-expanded", String(willOpen));
      var benefitKey = benefit.getAttribute("data-member-benefit");
      var benefitTip = benefit.querySelector("[role=tooltip]") || document.querySelector('.leai-benefit-detail-tooltip[data-benefit-portal-owner="' + benefitKey + '"]');
      if (benefitTip) {
        benefitTip.setAttribute("aria-hidden", String(!willOpen));
        if (willOpen) {
          var benefitRect = benefit.getBoundingClientRect();
          var tooltipWidth = Math.min(220, window.innerWidth - 24);
          var tooltipLeft = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, benefitRect.left + benefitRect.width / 2 - tooltipWidth / 2));
          var tooltipTop = benefitRect.bottom + 8;
          if (tooltipTop + 132 > window.innerHeight) tooltipTop = Math.max(12, benefitRect.top - 140);
          benefitTip.setAttribute("data-benefit-portal-owner", benefitKey);
          benefitTip.classList.add("is-portal-open");
          document.body.appendChild(benefitTip);
          benefitTip.style.setProperty("--leai-benefit-tooltip-left", tooltipLeft + "px");
          benefitTip.style.setProperty("--leai-benefit-tooltip-top", tooltipTop + "px");
        } else {
          benefitTip.classList.remove("is-portal-open");
          benefitTip.removeAttribute("data-benefit-portal-owner");
          benefit.appendChild(benefitTip);
        }
      }
      return;
    }
    var quick = event.target.closest("[data-quick-placeholder]");
    if (quick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var text = quick.querySelector("span").textContent.trim();
      el(".assistant-panel .composer textarea").value = text;
      el(".assistant-panel .composer").requestSubmit();
      return;
    }
    var sugOption = event.target.closest("[data-sug-value]");
    if (sugOption) { applySug(sugOption.dataset.sugValue, sugOption.dataset.sugNext || ""); return; }
    if (event.target.closest("[data-sug-close]")) { hideSug(); return; }
    var closeTab = event.target.closest("[data-aui-close-view]");
    if (closeTab) { closeRightView(false, closeTab.dataset.auiCloseView); return; }
    var auiTab = event.target.closest("[data-aui-tab]");
    if (auiTab) { activateRightTab(auiTab.dataset.auiTab); return; }
    var profileOpen = event.target.closest("[data-member-profile-open]");
    if (profileOpen) { openProfileEditorModal(profileOpen); return; }
    var profilePhone = event.target.closest("[data-profile-phone-rebind]");
    if (profilePhone) { openPhoneRebindModal(profilePhone); return; }
    var profileAvatar = event.target.closest("[data-profile-avatar]");
    if (profileAvatar) {
      var profileForm = profileAvatar.closest("[data-member-profile-form]");
      profileForm.querySelector("#leaiProfileAvatarValue").value = profileAvatar.dataset.profileAvatar;
      profileForm.querySelectorAll("[data-profile-avatar]").forEach(function (item) {
        var selected = item === profileAvatar;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      return;
    }
    if (event.target.closest("[data-ledou-more]")) { openRightView("ledou"); return; }
    var ledouProduct = event.target.closest("[data-ledou-product]");
    if (ledouProduct) { state.ledouProductOrigin = state.rightView === "ledou" ? "ledou" : "member"; openRightView("ledou-product:" + ledouProduct.dataset.ledouProduct); return; }
    var memberInsight = event.target.closest("[data-member-insight]");
    if (memberInsight) {
      submitComposerQuery(memberInsight.dataset.memberInsightQuery, {
        type: memberInsight.dataset.memberInsight,
        source: (memberInsight.querySelector("[data-member-insight-source]") || {}).textContent || ""
      });
      return;
    }
    var assetRuleTrigger = event.target.closest("[data-asset-rule-trigger]");
    if (assetRuleTrigger) {
      var assetRuleType = assetRuleTrigger.dataset.assetRuleTrigger;
      state.assetRuleOpen[assetRuleType] = !state.assetRuleOpen[assetRuleType];
      refreshRightView();
      return;
    }
    var assetFilter = event.target.closest("[data-asset-filter]");
    if (assetFilter) {
      state.assetFilters[assetFilter.dataset.assetType] = assetFilter.dataset.assetFilter;
      refreshRightView();
      return;
    }
    var ledouPeriodTrigger = event.target.closest("[data-ledou-period-trigger]");
    if (ledouPeriodTrigger) {
      var ledouPeriodMenu = ledouPeriodTrigger.parentElement.querySelector("[data-ledou-period-menu]");
      var ledouPeriodOpen = ledouPeriodMenu.hidden;
      ledouPeriodMenu.hidden = !ledouPeriodOpen;
      ledouPeriodTrigger.setAttribute("aria-expanded", String(ledouPeriodOpen));
      return;
    }
    var ledouPeriodOption = event.target.closest("[data-ledou-period-option]");
    if (ledouPeriodOption) {
      state.assetPeriods.points = ledouPeriodOption.dataset.ledouPeriodOption;
      refreshRightView();
      return;
    }
    var couponDetail = event.target.closest("[data-coupon-detail-toggle]");
    if (couponDetail) {
      var couponDetailId = couponDetail.dataset.couponDetailToggle;
      state.couponDetailsOpen[couponDetailId] = !state.couponDetailsOpen[couponDetailId];
      refreshRightView();
      return;
    }
    var couponProducts = event.target.closest("[data-coupon-products]");
    if (couponProducts) {
      openRightView("coupon-products:" + couponProducts.dataset.couponProducts);
      return;
    }
    var couponProductOpen = event.target.closest("[data-coupon-product-open]");
    if (couponProductOpen) {
      var couponDetailProduct = couponProductCatalog[couponProductOpen.dataset.couponProductOpen];
      if (couponDetailProduct && typeof window.__lxOpenProductFromMember === "function") window.__lxOpenProductFromMember(couponDetailProduct);
      return;
    }
    var couponProductBuy = event.target.closest("[data-coupon-product-buy]");
    if (couponProductBuy) {
      var couponBuyProduct = couponProductCatalog[couponProductBuy.dataset.couponProductBuy];
      if (couponBuyProduct && typeof window.__lxBuyProductFromMember === "function") window.__lxBuyProductFromMember(couponBuyProduct);
      return;
    }
    var memberAsset = event.target.closest("[data-member-asset]");
    if (memberAsset) {
      if (memberAsset.dataset.memberAsset === "benefitpoints") window.open(benefitPointsUrl, "_blank", "noopener,noreferrer");
      else openMemberAsset(memberAsset.dataset.memberAsset, memberAsset);
      return;
    }
    var secondaryBack = event.target.closest("[data-secondary-back]");
    if (secondaryBack) {
      returnFromSecondary(secondaryBack.dataset.secondaryBack || secondaryParentView(state.rightView));
      return;
    }
    var educationBenefit = event.target.closest("[data-education-benefit]");
    if (educationBenefit) {
      if (educationBenefit.dataset.educationBenefit === "coupons") openMemberAsset("coupons", educationBenefit);
      else focusEducationCard();
      return;
    }
    if (event.target.closest("[data-education-recommend]")) {
      submitComposerQuery(educationRecommendationQuery, { type: "education-products", source: "教育认证已通过" });
      return;
    }
    var selectionOpen = event.target.closest("[data-selection-open]");
    if (selectionOpen) { openRightView("selection:" + selectionOpen.dataset.selectionOpen); return; }
    var deviceFilter = event.target.closest("[data-device-filter]");
    if (deviceFilter) {
      state.deviceFilter = deviceFilter.dataset.deviceFilter;
      state.deviceFocusId = "";
      refreshRightView();
      return;
    }
    var deviceScroll = event.target.closest("[data-device-scroll]");
    if (deviceScroll) { scrollDeviceBrowser(Number(deviceScroll.dataset.deviceScroll)); return; }
    var benefitScroll = event.target.closest("[data-benefit-scroll]");
    if (benefitScroll) { scrollBenefitBrowser(Number(benefitScroll.dataset.benefitScroll)); return; }
    var deviceMore = event.target.closest("[data-device-more]");
    if (deviceMore) { openRightView("devices"); return; }
    var purchasedDeviceBind = event.target.closest("[data-device-bind-purchased]");
    if (purchasedDeviceBind) { runPurchasedDeviceBind(purchasedDeviceBind); return; }
    var deviceWarranty = event.target.closest("[data-device-warranty]");
    if (deviceWarranty) { runWarrantyRecommendation(deviceWarranty.dataset.deviceWarranty); return; }
    var deviceDetail = event.target.closest("[data-device-detail]");
    if (deviceDetail) { openDeviceDetail(deviceDetail.dataset.deviceDetail); return; }
    var memberCheckin = event.target.closest("[data-member-checkin]");
    if (memberCheckin) { runMemberCheckin(memberCheckin); return; }
    var deviceAdd = event.target.closest("[data-device-add]");
    if (deviceAdd) { openModal("deviceBind", deviceAdd); return; }
    var memberTask = event.target.closest("[data-member-task]");
    if (memberTask) { runMemberTask(memberTask.dataset.memberTask, memberTask); return; }
    var serviceDetailResult = event.target.closest("[data-service-detail-result]");
    if (serviceDetailResult) { openServiceDetailView(serviceDetailResult.dataset.serviceDetailResult); return; }
    var serviceDetail = event.target.closest("[data-service-detail]");
    if (serviceDetail) { runServiceDetail(serviceDetail.dataset.serviceDetail); return; }
    var serviceBuy = event.target.closest("[data-service-buy]");
    if (serviceBuy) { startServiceDiscountOrder(serviceBuy.dataset.serviceBuy, serviceBuy); return; }
    var serviceOrderAppointment = event.target.closest("[data-service-order-appointment]");
    if (serviceOrderAppointment) { openRightView("appointment-code"); return; }
    var warrantyDeviceOption = event.target.closest("[data-warranty-device-option]");
    if (warrantyDeviceOption) {
      state.serviceDeviceId = warrantyDeviceOption.dataset.warrantyDeviceOption;
      state.warrantyDevicePickerOpen = false;
      state.serviceCompare = [];
      state.serviceRecommended = "warrantyYear1";
      refreshRightView();
      return;
    }
    if (event.target.closest("[data-warranty-bind-device]")) {
      state.warrantyDevicePickerOpen = false;
      refreshRightView();
      openModal("deviceBind", event.target.closest("[data-warranty-bind-device]"));
      return;
    }
    if (event.target.closest("[data-warranty-open-devices]")) {
      state.warrantyDevicePickerOpen = false;
      if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
      else openRightView("devices");
      return;
    }
    if (event.target.closest("[data-warranty-device-trigger]")) {
      state.warrantyDevicePickerOpen = !state.warrantyDevicePickerOpen;
      refreshRightView();
      return;
    }
    var contextOption = event.target.closest("[data-service-context-option]");
    if (contextOption) {
      state.serviceContext[contextOption.dataset.serviceContextOption] = contextOption.dataset.serviceContextValue;
      openRightView("service");
      return;
    }
    var compare = event.target.closest("[data-service-compare]");
    if (compare) { toggleServiceCompare(compare.dataset.serviceCompare); return; }
    var compareRemove = event.target.closest("[data-compare-remove]");
    if (compareRemove) { toggleServiceCompare(compareRemove.dataset.compareRemove); return; }
    if (event.target.closest("[data-compare-clear]")) { state.serviceCompare = []; refreshRightView(); return; }
    var serviceTask = event.target.closest("[data-service-task]");
    if (serviceTask) { runServiceTask(serviceTask.dataset.serviceTask, serviceTask.dataset.serviceId || ""); return; }
    var studentAudience = event.target.closest("[data-student-audience]");
    if (studentAudience) {
      state.educationAudience = studentAudience.dataset.studentAudience;
      state.educationMethod = state.educationAudience === "exam" ? "verified" : state.educationAudience === "teacher" ? "certificate" : "edu";
      renderStudentModal();
      return;
    }
    var studentMethod = event.target.closest("[data-student-method]");
    if (studentMethod) {
      state.educationMethod = studentMethod.dataset.studentMethod;
      renderStudentModal();
      return;
    }
    var action = event.target.closest("[data-leai-action]");
    if (action) { handleAction(action); return; }
    if (event.target.closest("[data-modal-close]")) { closeModal(); return; }
    if (event.target.id === "leaiModal") { closeModal(); return; }
    if (event.target.closest("#leaiLabTrigger")) { toggleLab(true); return; }
    if (event.target.closest("[data-lab-close]")) { toggleLab(false); return; }
    var assetDemo = event.target.closest("[data-demo-asset]");
    if (assetDemo) {
      var demoAssetType = assetDemo.dataset.demoAsset;
      var demoAssetQueries = { points: "查看我的乐豆明细", coupons: "查看我的优惠券", vouchers: "查看我的代金券", redpacket: "查看我的限时红包" };
      toggleLab(false);
      if (embeddedHost || document.querySelector("#leaiAuiView")) openRightView("asset:" + demoAssetType);
      else submitComposerQuery(demoAssetQueries[demoAssetType]);
      return;
    }
    var educationDemo = event.target.closest("[data-demo-education-status]");
    if (educationDemo) {
      toggleLab(false);
      setEducationDemoStatus(educationDemo.dataset.demoEducationStatus);
      if (embeddedHost || document.querySelector("#leaiAuiView")) focusEducationCard();
      else submitComposerQuery("我想打开会员中心");
      return;
    }
    var warrantyDemo = event.target.closest("[data-demo-warranty]");
    if (warrantyDemo) {
      toggleLab(false);
      window.__lxWarrantyDemoMode = warrantyDemo.dataset.demoWarranty;
      if (embeddedHost || !document.querySelector("#leaiThread")) submitComposerQuery("我想购买延保服务");
      else { resetConversation(); runQuery("我想购买延保服务"); }
      return;
    }
    var demo = event.target.closest("[data-demo-query]");
    if (demo) {
      toggleLab(false);
      if (demo.dataset.demoMode === "draft") {
        var input = el(".assistant-panel .composer textarea");
        input.value = demo.dataset.demoQuery;
        input.focus();
        if (!embeddedHost) renderSug(input.value);
        else input.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (embeddedHost || !document.querySelector("#leaiThread")) submitComposerQuery(demo.dataset.demoQuery);
      else { resetConversation(); runQuery(demo.dataset.demoQuery); }
      return;
    }
    var filter = event.target.closest("[data-service-filter]");
    if (filter) {
      document.querySelectorAll("[data-service-filter]").forEach(function (item) { item.classList.toggle("is-active", item === filter); });
      el("#leaiServiceHint").textContent = filter.dataset.serviceFilter === "fulfillment" ? "已切换到预约/履约视图，请先选择已购服务商品。" : "结果已按“" + filter.textContent.trim() + "”更新。";
      return;
    }
  }

  function handlePageChange(event) {
    var assetPeriod = event.target.closest && event.target.closest("[data-asset-period]");
    if (assetPeriod) {
      state.assetPeriods[assetPeriod.dataset.assetType] = assetPeriod.value;
      refreshRightView();
      return;
    }
    if (event.target.id !== "leaiProfileAvatarFile") return;
    var input = event.target;
    var file = input.files && input.files[0];
    var form = input.closest("[data-member-profile-form]");
    var error = form.querySelector("[data-profile-avatar-error]");
    if (!file) return;
    if (["image/jpeg", "image/png"].indexOf(file.type) < 0) {
      error.textContent = "仅支持 JPG、JPEG、PNG 图片";
      input.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      error.textContent = "图片不能超过 4MB";
      input.value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var source = String(reader.result || "");
      form.querySelector("#leaiProfileCustomAvatarValue").value = source;
      form.querySelectorAll("[data-profile-avatar-preview]").forEach(function (image) { image.src = source; });
      error.textContent = "头像已载入，保存后同步到会员中心（Mock）";
    };
    reader.onerror = function () { error.textContent = "图片读取失败，请重新选择"; };
    reader.readAsDataURL(file);
  }

  function handlePageSubmit(event) {
    var profileForm = event.target.closest && event.target.closest("[data-member-profile-form]");
    if (!profileForm) return;
    event.preventDefault();
    var nickname = profileForm.querySelector("#leaiProfileNickname").value.trim();
    if (!nickname) {
      profileForm.querySelector("#leaiProfileNickname").setCustomValidity("请输入会员昵称");
      profileForm.reportValidity();
      return;
    }
    profileForm.querySelector("#leaiProfileNickname").setCustomValidity("");
    state.profile.nickname = nickname;
    state.profile.gender = profileForm.querySelector("#leaiProfileGender").value;
    state.profile.birthday = profileForm.querySelector("#leaiProfileBirthday").value;
    var avatarPreset = profileForm.querySelector("#leaiProfileAvatarValue");
    if (avatarPreset) state.profile.avatar = avatarPreset.value;
    var customAvatar = profileForm.querySelector("#leaiProfileCustomAvatarValue");
    if (customAvatar) state.profile.customAvatar = customAvatar.value;
    profileForm.querySelector("[data-profile-save-status]").textContent = "个人信息已保存";
    if (profileForm.closest(".is-profile-editor")) { closeModal(); refreshRightView(); }
  }

  function handleKeydown(event) {
    var activeTab = event.target.closest && event.target.closest("[data-aui-tab]");
    if (activeTab && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-aui-tab]"));
      var current = tabs.indexOf(activeTab);
      var next = event.key === "ArrowRight" ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      activateRightTab(tabs[next].dataset.auiTab);
      return;
    }
    var deviceTrack = event.target.closest && event.target.closest("[data-device-track]");
    if (deviceTrack && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      scrollDeviceBrowser(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    var benefitTrack = event.target.closest && event.target.closest("[data-benefit-track]");
    if (benefitTrack && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      scrollBenefitBrowser(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key !== "Escape") return;
    if (el("#leaiModal").classList.contains("is-open")) closeModal();
    else if (el("#leaiLab").classList.contains("is-open")) toggleLab(false);
  }

  function renderSug(raw) {
    var text = String(raw || "").trim();
    if (!text) { hideSug(); return; }
    var config = sugConfig(text);
    if (!config) { hideSug(); return; }
    state.sugKey = config.key;
    var options = config.options.map(function (option, index) {
      return '<button class="leai-sug-option" type="button" data-sug-value="' + escapeHtml(option.value) + '" data-sug-next="' + escapeHtml(option.next || "") + '"><span class="leai-sug-index">' + (index + 1) + '.</span><span>' + escapeHtml(option.label) + '</span></button>';
    }).join("");
    var host = el("#leaiSug");
    host.innerHTML = '<div class="leai-sug-head"><div><p class="leai-sug-kicker">输入中预判</p><p class="leai-sug-question">' + escapeHtml(config.question) + '</p></div><button class="leai-sug-close" type="button" data-sug-close>继续输入</button></div><div class="leai-sug-options">' + options + '</div>';
    host.classList.add("is-visible");
  }

  function sugConfig(text) {
    if (/冒烟|起火|鼓包|进液/.test(text)) return { key: "safety", question: "是否立即查看安全处置建议？", options: [{ label: "查看安全处置建议", value: "我需要查看设备安全处置建议" }, { label: "联系人工客服", value: "我需要联系人工客服" }] };
    if (/认证/.test(text) && !/(学生|教育).*(办理|查询|申请|材料)/.test(text)) return { key: "cert", question: "想先处理哪项教育认证事项？", options: [
      { label: "学生/教育认证", value: "学生教育认证", next: "student" },
      { label: "查询认证状态", value: "我想查询学生教育认证状态" },
      { label: "查看认证材料", value: "教育认证需要哪些材料" }
    ] };
    if (/会员/.test(text) && !/(打开|查看|查询|申请|办理|升级).{0,8}(会员|权益|认证|乐豆|优惠券)/.test(text)) return { key: "member", question: "想处理哪类会员事项？", options: [
      { label: "查会员等级与权益", value: "我想打开会员中心，查看会员等级与权益" },
      { label: "教育优惠/学生认证", value: "学生教育认证", next: "student" },
      { label: "乐豆/优惠券", value: "我想查看乐豆和可用优惠券" }
    ] };
    if (/清灰|保养|换硅脂|服务商品/.test(text) && !/(价格|适用|比较|预约|购买|门店|北京|上海|广州|深圳)/.test(text)) return { key: "clean", question: "想先了解哪项信息？", options: [
      { label: "查看价格", value: "我想查看笔记本深度清灰的价格" },
      { label: "查看适用设备", value: "我想查看深度清灰适用哪些设备" },
      { label: "比较服务内容", value: "我想比较清灰和清灰换硅脂的服务内容" },
      { label: "预约/购买", value: "我想购买并预约笔记本深度清灰服务" },
      { label: "查询可服务门店", value: "我想查询可以做深度清灰的门店" }
    ] };
    if (/服务|售后/.test(text) && text.length < 8) return { key: "service", question: "要处理哪类服务？", options: [
      { label: "设备管理", value: "我想管理已绑定设备" }, { label: "维修服务", value: "我想预约维修" },
      { label: "驱动下载", value: "我想查找并下载驱动" }, { label: "保修/延保", value: "我想查询保修或购买延保" },
      { label: "清灰等服务商品", value: "清灰服务商品" }, { label: "人工客服/留言", value: "我需要联系人工客服" }
    ] };
    return null;
  }

  function applySug(value, next) {
    var input = el(".assistant-panel .composer textarea");
    if (next === "student") { input.value = "学生认证"; renderSecondSug("student"); }
    else { input.value = value; hideSug(); }
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function renderSecondSug(type) {
    var configs = {
      student: ["想先处理什么？", [["了解优惠政策", "我想了解学生教育优惠政策"], ["办理认证", copy.student.query], ["查询认证状态", "我想查询学生教育认证状态"], ["查看适用商品", "我想查看教育特惠适用商品"]]]
    };
    var config = configs[type];
    var host = el("#leaiSug");
    host.innerHTML = '<div class="leai-sug-head"><div><p class="leai-sug-kicker">输入中预判</p><p class="leai-sug-question">' + config[0] + '</p></div><button class="leai-sug-close" type="button" data-sug-close>继续输入</button></div><div class="leai-sug-options">' + config[1].map(function (item, index) {
      return '<button class="leai-sug-option" type="button" data-sug-value="' + escapeHtml(item[1]) + '"><span class="leai-sug-index">' + (index + 1) + '.</span><span>' + escapeHtml(item[0]) + '</span></button>';
    }).join("") + '</div>';
    host.classList.add("is-visible");
  }

  function hideSug() { var host = el("#leaiSug"); if (host) host.classList.remove("is-visible"); }

  function isVerifiedEducationOfferQuery(query) {
    if (state.identityStatus.student !== "verified") return false;
    var normalized = String(query || "").trim().replace(/[\s，。！？、,.!?]/g, "");
    return /^(?:我想|我要|帮我|请帮我|想要)?(?:查看|看看|了解|咨询)?(?:教育优惠|教育认证|学生认证)$/.test(normalized);
  }

  async function runQuery(query) {
    enterChat();
    var turn = appendTurn(query);
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    if (/冒烟|起火|鼓包|进液/.test(query)) return safetyFlow(turn);
    var compositeTasks = detectCompositeTasks(query);
    if (compositeTasks.length > 1) return compositePageFlow(turn, compositeTasks);
    if (/个人信息|修改头像|更换头像|换头像|修改电话|更换电话|修改手机号|更换手机号|手机号换绑|电话换绑/.test(query)) return profileFlow(turn, query);
    if (/会员签到|签到记录|签到进度/.test(query)) return memberFlow(turn);
    if (isVerifiedEducationOfferQuery(query)) return verifiedEducationOfferFlow(turn);
    if (/教育特惠|教育优惠|学生特惠/.test(query) && !/认证|办理|申请/.test(query)) return informationPageFlow(turn, "education", "教育特惠", "查看教育身份适用商品与优惠说明");
    if (/我的订单|服务订单|订单列表/.test(query) && !/购买|下单/.test(query)) return informationPageFlow(turn, "orders", "我的订单", "查看服务订单、状态与预约入口");
    var matchedDevice = deviceFromQuery(query);
    if (matchedDevice) return memberDeviceDetailFlow(turn, matchedDevice);
    if (isDeviceWarrantyQuery(query)) return memberWarrantyFlow(turn);
    if (/我的设备|我的电脑|我的资产|设备资产|已绑定设备|设备管理/.test(query)) return memberDeviceFlow(turn);
    var asset = memberAssetIntent(query);
    if (asset && !/企业|钻石|教育|学生/.test(query)) return memberAssetFlow(turn, asset);
    if (/会员中心|会员权益|乐豆|优惠券|代金券|红包|权益点/.test(query) && !/企业|钻石|教育|学生/.test(query)) return memberFlow(turn);
    if (/学生|教育/.test(query) && /认证|办理|申请/.test(query)) return authFlow(turn);
    if (/详情/.test(query) && /清灰|换硅脂|清洁保养|延保/.test(query)) return serviceDetailQueryFlow(turn, serviceIdFromQuery(query));
    if (/清灰|换硅脂|延保|服务商品/.test(query)) return serviceFlow(turn, query);
    return genericFlow(turn, query);
  }

  function enterChat() {
    document.body.dataset.state = "chat";
    el(".assistant-panel .default-state").style.display = "none";
    el(".assistant-panel .chat-state").style.display = "block";
  }

  function appendTurn(query) {
    var turn = document.createElement("section");
    turn.className = "leai-turn";
    turn.innerHTML = '<div class="leai-user">' + escapeHtml(query) + '</div>';
    el("#leaiThread").appendChild(turn);
    return turn;
  }

  async function streamAnswer(turn, html) {
    var host = document.createElement("div");
    host.className = "leai-ai";
    turn.appendChild(host);
    var plain = String(html).replace(/<[^>]*>/g, "");
    var cursor = document.createElement("span");
    cursor.className = "leai-cursor";
    host.appendChild(cursor);
    if (prefersReduced()) { host.innerHTML = html; return host; }
    var rendered = "";
    for (var i = 0; i < plain.length; i += 1) {
      rendered += plain[i];
      host.textContent = rendered;
      host.appendChild(cursor);
      if (i % 4 === 0) await delay(12);
    }
    host.innerHTML = html;
    return host;
  }

  function appendFixedAnswer(turn, html) {
    var host = document.createElement("div");
    host.className = "leai-ai";
    host.innerHTML = html;
    turn.appendChild(host);
    return host;
  }

  function appendTrace(turn, label) {
    turn.insertAdjacentHTML("beforeend", '<div class="leai-trace"><img src="' + icons.check + '" alt=""><span>' + escapeHtml(label) + '</span></div>');
  }

  function appendDisclaimer(turn) { turn.insertAdjacentHTML("beforeend", '<div class="leai-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</div>'); }

  function actionCard(type, title, description) {
    return '<button class="leai-action-card" type="button" data-leai-action="' + escapeHtml(type) + '" aria-pressed="false"><span><span class="leai-card-title">' + escapeHtml(title) + '</span><span class="leai-card-desc">' + escapeHtml(description) + '</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
  }

  function memberAssetIntent(query) {
    var matches = Object.keys(memberAssets).filter(function (key) { return memberAssets[key].pattern.test(query); });
    return matches.length === 1 ? matches[0] : "";
  }

  function deviceFromQuery(query) {
    var normalized = String(query || "").toLowerCase().replace(/[\s\-_·]/g, "");
    var id = Object.keys(deviceAliases).find(function (deviceId) {
      return deviceAliases[deviceId].some(function (alias) {
        return normalized.indexOf(alias.toLowerCase().replace(/[\s\-_·]/g, "")) >= 0;
      });
    });
    return id ? deviceCatalog[id] : null;
  }

  function isDeviceWarrantyQuery(query) {
    return /保修|设备保障/.test(query) || (/延保/.test(query) && !/购买|推荐|方案|商品|下单/.test(query));
  }

  async function memberAssetFlow(turn, type) {
    var asset = memberAssets[type];
    await streamAnswer(turn, '<p>' + asset.answer + '</p>');
    appendTrace(turn, "已完成登录、授权与会员资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-asset:" + type, "查看" + asset.label + "详情", asset.cardDescription));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberAsset(type, null);
  }

  async function memberDeviceFlow(turn) {
    var keys = orderedDeviceKeys();
    var recentNames = keys.slice(0, 3).map(function (key) { return deviceCatalog[key].name; }).join("、");
    state.deviceFilter = "all";
    state.deviceFocusId = "";
    await streamAnswer(turn, '<p>当前账号共有<strong>' + keys.length + ' 台已绑定设备</strong>，另有<strong>' + (state.pendingDeviceBound ? "0" : "1") + ' 台待绑定</strong>。最近使用的是 ' + escapeHtml(recentNames) + '；右侧已打开设备列表。</p>');
    appendTrace(turn, "已完成登录、授权与设备资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看我的设备", keys.length + " 台已绑定 · " + (state.pendingDeviceBound ? "无待绑定" : "1 台待绑定")));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function memberWarrantyFlow(turn) {
    state.deviceFilter = "attention";
    state.deviceFocusId = "";
    var pendingCount = state.pendingDeviceBound ? 0 : 1;
    await streamAnswer(turn, '<p>已查询当前账号的设备保障信息：<strong>2 台设备命中延保推荐节点</strong>，其中天逸 510S 的基础保修将于 2026-08-22 到期；另有<strong>' + pendingCount + ' 台设备待绑定</strong>。</p>');
    appendTrace(turn, "已完成设备资产、购买时间与保障节点查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看设备保障", "2 台命中延保推荐 · " + pendingCount + " 台待绑定"));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function memberDeviceDetailFlow(turn, device) {
    state.deviceFilter = "all";
    state.deviceFocusId = device.id;
    await streamAnswer(turn, '<p>已定位到<strong>' + escapeHtml(device.name) + '</strong>（设备编号 ' + escapeHtml(device.sn) + '）。' + escapeHtml(device.warranty) + '，当前保障信息已在右侧打开。</p>');
    appendTrace(turn, "已完成设备型号匹配与资产查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member-devices", "查看 " + device.name + " 设备详情", device.product + " · " + device.warranty));
    appendDisclaimer(turn);
    await nextFrame();
    openMemberDevices(null);
  }

  async function profileFlow(turn, query) {
    state.profileTarget = /电话|手机|换绑/.test(query) ? "phone" : /头像/.test(query) ? "avatar" : "overview";
    await streamAnswer(turn, '<p>已为你打开<strong>个人信息</strong>。头像、昵称等基础资料可在右侧维护；手机号换绑会进入独立安全确认流程。</p>');
    appendTrace(turn, "已完成登录与会员资料权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard("profile", "查看个人信息", "头像、基础资料与手机号安全设置"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("profile");
  }

  async function informationPageFlow(turn, view, label, description) {
    var inlineEducation = view === "education";
    await streamAnswer(turn, inlineEducation ? '<p>已在<strong>会员中心</strong>定位到教育优惠卡片，可直接查看当前认证状态。</p>' : '<p>已为你打开<strong>' + escapeHtml(label) + '</strong>，可以在右侧查看当前信息与后续入口。</p>');
    appendTrace(turn, "已完成页面意图识别与权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard(inlineEducation ? "member" : view, inlineEducation ? "查看教育优惠状态" : "查看" + label, inlineEducation ? "会员中心卡片 · 认证状态与权益说明" : description));
    appendDisclaimer(turn);
    await nextFrame();
    if (inlineEducation) focusEducationCard();
    else openRightView(view);
  }

  async function verifiedEducationOfferFlow(turn) {
    await streamAnswer(turn, '<p>你的<strong>教育认证已通过</strong>，教育优惠权益已生效。当前状态已在会员中心教育优惠卡片内展示。</p>');
    appendTrace(turn, "已完成教育身份与活动资格查询");
    turn.insertAdjacentHTML("beforeend", actionCard("member", "查看教育优惠状态", "会员中心卡片 · 已认证"));
    appendDisclaimer(turn);
    await nextFrame();
    focusEducationCard();
  }

  function detectCompositeTasks(query) {
    var tasks = [];
    function add(key, pattern, view, label, description) {
      var match = query.match(pattern);
      if (!match || tasks.some(function (task) { return task.key === key || (view && task.view === view); })) return;
      tasks.push({ key: key, view: view, label: label, description: description, index: match.index || 0 });
    }
    add("member", /会员中心|会员权益/, "member", "会员中心", "会员资料与权益信息");
    add("profile", /个人信息|修改头像|更换头像|换头像|修改电话|更换电话|修改手机号|更换手机号|手机号换绑|电话换绑/, "profile", "个人信息", "头像、基础资料与手机号安全设置");
    var profileTask = tasks.find(function (task) { return task.key === "profile"; });
    if (profileTask) profileTask.target = /电话|手机|换绑/.test(query) ? "phone" : /头像/.test(query) ? "avatar" : "overview";
    Object.keys(memberAssets).forEach(function (key) {
      var asset = memberAssets[key];
      add("asset:" + key, asset.pattern, "asset:" + key, asset.label, asset.cardDescription);
    });
    if (!/认证|办理|申请/.test(query)) add("education", /教育特惠|教育优惠|学生特惠/, "education", "教育特惠", "教育身份适用商品与优惠说明");
    if (!/下单|购买/.test(query)) add("orders", /我的订单|服务订单|订单列表/, "orders", "我的订单", "服务订单、状态与预约入口");
    var serviceMatch = query.match(/清灰|换硅脂|清洁保养|服务商品|延保/);
    if (serviceMatch) {
      var detail = /详情/.test(query);
      var serviceView = detail ? "service-detail:" + serviceIdFromQuery(query) : "service";
      tasks.push({ key: detail ? serviceView : "service", view: serviceView, label: detail ? rightViewLabel(serviceView) : "服务商品推荐", description: detail ? "服务内容、适用范围与预约说明" : "匹配设备的服务商品与购买入口", index: serviceMatch.index || 0 });
    }
    if (/下单|购买/.test(query) && !serviceMatch) {
      var purchaseMatch = query.match(/下单|购买/);
      tasks.push({ key: "pending-purchase", view: "", label: "下单", description: "待补充商品或服务", index: purchaseMatch ? purchaseMatch.index : query.length });
    }
    return tasks.sort(function (left, right) { return left.index - right.index; });
  }

  async function compositePageFlow(turn, tasks) {
    var labels = tasks.map(function (task) { return task.label; });
    var hasPending = tasks.some(function (task) { return !task.view; });
    await streamAnswer(turn, '<p>我将需求拆成<strong>' + tasks.length + ' 项任务</strong>：' + escapeHtml(labels.join("、")) + '。' + (hasPending ? "可以先打开已明确的信息页；下单还需要补充具体商品或服务。" : "右侧会保留对应标签，并聚焦当前需要继续处理的页面。涉及购买的动作仍需你明确选择并确认。") + '</p>');
    appendTrace(turn, "已完成多意图拆解与执行顺序判断");
    turn.insertAdjacentHTML("beforeend", '<div class="leai-card-grid" data-aui-plan aria-label="复合任务计划">' + tasks.map(function (task, index) {
      var action = actionForView(task.view);
      var disabled = !action;
      return '<button class="leai-action-card" type="button" data-aui-plan-step data-leai-action="' + escapeHtml(action || "pending") + '" aria-pressed="false"' + (disabled ? " disabled" : "") + '><span><span class="leai-card-title">' + (index + 1) + '. ' + escapeHtml(task.label) + '</span><span class="leai-card-desc">' + escapeHtml(task.description) + '</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
    }).join("") + '</div>');
    appendDisclaimer(turn);
    await nextFrame();
    tasks.forEach(function (task) {
      if (!task.view) return;
      if (task.view === "profile") state.profileTarget = task.target || "overview";
      if (task.view === "service") {
        state.serviceMode = "cleaning";
        state.serviceDeviceId = "";
        state.serviceCompare = [];
        state.serviceRecommended = "";
      }
      if (task.view.indexOf("service-detail:") === 0) {
        var serviceId = task.view.split(":")[1];
        state.serviceSelectedId = serviceId;
        state.serviceDetailContext[serviceId] = serviceDeviceContext(serviceId);
      }
      openRightView(task.view);
    });
  }

  function actionForView(view) {
    if (!view) return "";
    if (view.indexOf("asset:") === 0) return "member-asset:" + view.split(":")[1];
    if (view.indexOf("service-detail:") === 0) return "service-detail:" + view.split(":")[1];
    return view;
  }

  async function memberFlow(turn) {
    await streamAnswer(turn, '<p>已识别为综合会员资产查看。我会在登录与授权校验后，为你打开会员中心，并定位到会员权益。</p>');
    appendTrace(turn, "已完成登录与会员权限校验");
    turn.insertAdjacentHTML("beforeend", actionCard("member", "查看会员中心", "会员等级、乐豆、优惠券与认证状态"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("member");
  }

  async function authFlow(turn) {
    var item = copy.student;
    var status = state.identityStatus.student;
    if (status === "reviewing") {
      await streamAnswer(turn, '<p>当前' + item.title + '申请正在<strong>审核中</strong>，暂时不需要重复提交。我已打开会员中心展示当前进度。</p>');
      appendTrace(turn, "已完成当前身份状态查询");
      appendDisclaimer(turn);
      await nextFrame();
      openRightView("member");
      return;
    }
    if (status === "verified") {
      await streamAnswer(turn, '<p>当前账号已完成<strong>' + item.title + '</strong>。我已打开会员中心，你可以直接查看已生效的专属权益。</p>');
      appendTrace(turn, "已完成当前身份与权益查询");
      appendDisclaimer(turn);
      await nextFrame();
      openRightView("member");
      return;
    }
    await streamAnswer(turn, '<p>我会先核验登录态、当前认证/等级状态与办理资格。当前演示账号未提交该申请，可以继续办理。</p>');
    appendTrace(turn, "已完成状态与资格校验");
    turn.insertAdjacentHTML("beforeend", actionCard("modal:student", item.button, "打开办理弹窗"));
    appendDisclaimer(turn);
  }

  async function serviceFlow(turn, query) {
    state.serviceMode = "cleaning";
    state.serviceDeviceId = "";
    state.serviceCompare = [];
    state.serviceRecommended = "";
    await streamAnswer(turn, '<p>已按“拯救者游戏本 + 北京 + 深度清灰/换硅脂”匹配服务商品。你可以比较服务内容、适用性与预约方式。</p>');
    appendTrace(turn, "已完成设备、地区与服务适用性校验");
    turn.insertAdjacentHTML("beforeend", actionCard("service", "查看推荐服务商品", "已为你推荐 3 款服务商品"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("service");
  }

  async function safetyFlow(turn) {
    await streamAnswer(turn, '<p><strong>请立即停止使用设备并断开电源。</strong>请勿继续充电、开机或尝试清灰。优先联系联想官方服务或人工客服检查。</p>');
    turn.insertAdjacentHTML("beforeend", actionCard("support", "联系官方服务", "危险情形不进入服务商品推荐"));
    appendDisclaimer(turn);
  }

  async function genericFlow(turn, query) {
    var isConsult = /材料|条件|有效期|流程|需要多久/.test(query);
    await streamAnswer(turn, isConsult ? '<p>这属于政策或流程咨询。我会先在对话中说明条件、材料与处理方式，不会因为出现“认证”等关键词直接弹出表单。</p>' : '<p>已收到你的问题。当前 POC 重点演示个人会员中心、教育认证和服务商品编排。你也可以继续输入更明确的会员或服务任务。</p>');
    appendDisclaimer(turn);
  }

  function taskEnvelope(intent, context) {
    state.requestSequence += 1;
    return {
      source: "right-aui",
      intent: intent,
      context: context || {},
      requestId: "aui-" + state.requestSequence,
      state: "checking"
    };
  }

  function runMemberTask(type, trigger) {
    if (type !== "student") return;
    if (embeddedHost) {
      openStudentModal(trigger);
      return;
    }
    runRightIdentityTask(trigger);
  }

  async function runRightIdentityTask(trigger) {
    var item = copy.student;
    if (!trigger) return;
    var task = taskEnvelope("member-student", { memberType: "student" });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn(item.query);
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    appendFixedAnswer(turn, "<p>已为你打开教育认证。请选择身份与认证方式，并补齐对应材料。</p>");
    appendTrace(turn, "已读取当前身份状态并进入固定办理流程");
    task.state = "ready_to_submit";
    await nextFrame();
    openModal("student", trigger);
  }

  // This prototype owns the same local member state as the existing member page.
  window.__lxCompleteMemberCheckin = function () {
    var already = state.memberCheckedIn;
    state.memberCheckedIn = true;
    refreshRightView();
    return { success: true, already: already };
  };

  async function runMemberCheckin(button) {
    if (state.memberCheckedIn || button.disabled) return;
    button.disabled = true;
    var task = taskEnvelope("member-checkin", { source: "member-task-center" });
    document.body.dataset.activeRequest = task.requestId;
    if (embeddedHost) {
      task.state = "checking";
      button.setAttribute("aria-busy", "true");
      try {
        if (typeof window.__lxBridge?.sendChat !== "function") throw new Error("chat unavailable");
        var completed = await window.__lxBridge.sendChat("我要签到");
        if (completed !== true) throw new Error("checkin not completed");
        task.state = "success";
      } catch (error) {
        task.state = "failed";
        button.disabled = false;
      } finally { button.removeAttribute("aria-busy"); }
      return;
    }
    enterChat();
    var turn = appendTurn("我要签到");
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p><strong>签到成功！10 乐豆已到账</strong>，已连续签到 7 天。会员中心已同步最新状态。</p>');
    appendTrace(turn, "已收到会员任务服务签到回执");
    appendDisclaimer(turn);
    await nextFrame();
    state.memberCheckedIn = true;
    task.state = "success";
    refreshRightView();
  }

  async function runPurchasedDeviceBind(button){return window.__p0Modules.invoke("modals/device-bind#runPurchasedDeviceBind:01401bd39d188c5c51968329",{get ["state"](){return state},get ["pendingPurchasedDevice"](){return pendingPurchasedDevice},get ["taskEnvelope"](){return taskEnvelope},get ["enterChat"](){return enterChat},get ["appendTurn"](){return appendTurn},get ["nextFrame"](){return nextFrame},get ["prefersReduced"](){return prefersReduced},get ["streamAnswer"](){return streamAnswer},get ["appendTrace"](){return appendTrace},get ["appendDisclaimer"](){return appendDisclaimer},get ["deviceCatalog"](){return deviceCatalog},get ["refreshRightView"](){return refreshRightView},get ["completePurchasedDeviceBindTransition"](){return completePurchasedDeviceBindTransition}},this,arguments);}

  async function runWarrantyRecommendation(deviceId) {
    var device = deviceCatalog[deviceId];
    if (!device || !device.extensionEligible) return;
    var warrantyButton = document.querySelector('[data-device-warranty="' + device.id + '"]');
    if (warrantyButton) { warrantyButton.disabled = true; warrantyButton.textContent = "正在调用 Skill"; }
    var warrantyDevice = { id: device.id, name: device.name, product: device.product, sn: device.sn, warranty: device.warranty, maintenanceReason: device.maintenanceReason || "保障节点推荐" };
    if (typeof window.__lxSubmitDeviceActionQuery === "function") {
      window.__lxSubmitDeviceActionQuery("warranty", "为" + device.name + "推荐可购买的保修商品", warrantyDevice);
      return;
    }
    var task = taskEnvelope("service-warranty-recommend", { deviceId: device.id, source: "member-device-card" });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn("为" + device.name + " 推荐可购买的延保服务");
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p>已根据<strong>' + escapeHtml(device.name) + '</strong>的设备型号、购买时间和当前保障信息，匹配到 3 项可购买的延保方案。建议先对比保障年限与上门服务范围。</p>');
    appendTrace(turn, "已完成设备、购买时间、保障节点与延保 SKU 适用性校验");
    turn.insertAdjacentHTML("beforeend", actionCard("service", "查看延保服务推荐", "3 项可购买方案 · 价格以服务系统为准"));
    appendDisclaimer(turn);
    await nextFrame();
    state.serviceMode = "warranty";
    state.serviceDeviceId = device.id;
    state.warrantyDevicePickerOpen = false;
    state.serviceCompare = [];
    state.serviceRecommended = "warrantyYear1";
    task.state = "ready_to_select";
    openRightView("service");
  }

  async function runAddDeviceTask(){return window.__p0Modules.invoke("modals/device-bind#runAddDeviceTask:b1ed2c41fd2ba8dd07009321",{get ["embeddedHost"](){return embeddedHost},get ["taskEnvelope"](){return taskEnvelope},get ["enterChat"](){return enterChat},get ["appendTurn"](){return appendTurn},get ["nextFrame"](){return nextFrame},get ["prefersReduced"](){return prefersReduced},get ["streamAnswer"](){return streamAnswer},get ["appendTrace"](){return appendTrace},get ["actionCard"](){return actionCard},get ["appendDisclaimer"](){return appendDisclaimer}},this,arguments);}

  async function openMemberAsset(type, trigger) {
    if (!memberAssets[type]) return;
    var displayMode = !trigger || trigger.matches(".leai-action-card") ? "tab" : "secondary";
    openRightView("asset:" + type, displayMode);
    if (trigger && trigger.matches(".leai-action-card")) setSelected(trigger);
  }

  async function openMemberDevices(trigger){return window.__p0Modules.invoke("pages/device-list#openMemberDevices:1f0f795c118123c7f203f163",{get ["openRightView"](){return openRightView},get ["setSelected"](){return setSelected}},this,arguments);}

  function openDeviceDetail(deviceId){return window.__p0Modules.invoke("pages/device-detail#openDeviceDetail:5291eef28637ae3d97b6e839",{get ["deviceCatalog"](){return deviceCatalog},get ["el"](){return el},get ["state"](){return state},get ["openRightView"](){return openRightView}},this,arguments);}

  function setupDeviceBrowser(initialScroll) {
    var track = el("[data-device-track]");
    if (!track) return;
    if (typeof initialScroll === "number") track.scrollLeft = initialScroll;
    var scheduled = false;
    track.addEventListener("scroll", function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        syncDeviceBrowser(track);
      });
    });
    window.requestAnimationFrame(function () { syncDeviceBrowser(track); });
  }

  function syncDeviceBrowser(track) {
    var cards = Array.prototype.slice.call(track.querySelectorAll("[data-device-slide]"));
    if (!cards.length) return;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap) || 0;
    var step = cards[0].getBoundingClientRect().width + gap;
    var first = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step)));
    var visible = Math.max(1, Math.floor((track.clientWidth + gap) / step));
    var range = el("[data-device-range]");
    if (range) range.textContent = deviceRangeLabel(first + 1, Math.min(cards.length, first + visible));
    var previous = el('[data-device-scroll="-1"]');
    var next = el('[data-device-scroll="1"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function scrollDeviceBrowser(direction) {
    var track = el("[data-device-track]");
    if (!track || !direction) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReduced() ? "auto" : "smooth" });
    window.setTimeout(function () { syncDeviceBrowser(track); }, prefersReduced() ? 0 : 320);
  }

  function setupBenefitBrowser(initialScroll) {
    var track = el("[data-benefit-track]");
    if (!track) return;
    if (typeof initialScroll === "number") track.scrollLeft = initialScroll;
    var scheduled = false;
    track.addEventListener("scroll", function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        syncBenefitBrowser(track);
      });
    });
    window.requestAnimationFrame(function () { syncBenefitBrowser(track); });
  }

  function syncBenefitBrowser(track) {
    var previous = el('[data-benefit-scroll="-1"]');
    var next = el('[data-benefit-scroll="1"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function scrollBenefitBrowser(direction) {
    var track = el("[data-benefit-track]");
    if (!track || !direction) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReduced() ? "auto" : "smooth" });
    window.setTimeout(function () { syncBenefitBrowser(track); }, prefersReduced() ? 0 : 320);
  }

  function toggleServiceCompare(id) {
    if (!findService(id) || id === "appointment") return;
    var index = state.serviceCompare.indexOf(id);
    if (index >= 0) state.serviceCompare.splice(index, 1);
    else if (state.serviceCompare.length < 2) state.serviceCompare.push(id);
    refreshRightView();
  }

  async function runServiceDetail(serviceId) {
    var service = findService(serviceId);
    if (!service) return;
    state.serviceSelectedId = service.id;
    state.serviceDetailContext[service.id] = serviceDeviceContext(service.id);
    enterChat();
    var turn = appendTurn("查看" + service.name + "详情");
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await presentServiceDetail(turn, service);
  }

  async function serviceDetailQueryFlow(turn, serviceId) {
    var service = findService(serviceId);
    if (!service) return genericFlow(turn, "服务详情");
    state.serviceSelectedId = service.id;
    state.serviceDetailContext[service.id] = serviceDeviceContext(service.id);
    await presentServiceDetail(turn, service);
  }

  async function presentServiceDetail(turn, service) {
    await streamAnswer(turn, '<p>已经为你打开<strong>' + escapeHtml(service.name) + '</strong>的服务商品详情，可继续查看服务内容、适用范围与预约说明。</p>');
    appendTrace(turn, "已完成服务商品与关联设备校验");
    turn.insertAdjacentHTML("beforeend", serviceDetailResultCard(service));
    appendDisclaimer(turn);
    await nextFrame();
    openServiceDetailView(service.id);
  }

  function serviceIdFromQuery(query) {
    if (/两年/.test(query)) return "warrantyYear2";
    if (/上门/.test(query) && /延保/.test(query)) return "warrantyDoor";
    if (/一年|延保/.test(query)) return "warrantyYear1";
    if (/换硅脂/.test(query)) return "thermal";
    if (/清洁保养|整机清洁/.test(query)) return "care";
    return "clean";
  }

  function serviceDetailResultCard(service) {
    return '<button class="leai-action-card" type="button" data-service-detail-result="' + escapeHtml(service.id) + '" aria-pressed="false"><span><span class="leai-card-title">' + escapeHtml(service.name) + '</span><span class="leai-card-desc">已经为您打开1款商品详情</span></span><span class="leai-card-next"><img src="' + icons.next + '" alt=""></span></button>';
  }

  function openServiceDetailView(serviceId) {
    if (!findService(serviceId)) return;
    state.serviceSelectedId = serviceId;
    if (!state.serviceDetailContext[serviceId]) state.serviceDetailContext[serviceId] = serviceDeviceContext(serviceId);
    openRightView("service-detail:" + serviceId);
  }

  function serviceDeviceContext(serviceId) {
    if (warrantyCatalog[serviceId]) {
      var warrantyDevice = deviceCatalog[state.serviceDeviceId] || deviceCatalog.legiony7000p;
      return { name: warrantyDevice.name, product: warrantyDevice.product, sn: warrantyDevice.sn };
    }
    return { name: "拯救者游戏本", product: "Legion 游戏本", sn: "设备型号待结算校验" };
  }

  function servicePriceNumber(service) {
    var value = String(service && service.price || "").replace(/[^0-9.]/g, "");
    return Number(value) || 0;
  }

  function claimServiceDiscounts(service) {
    var price = servicePriceNumber(service);
    var platform = price >= 600 ? 50 : price >= 250 ? 30 : 20;
    var member = price >= 600 ? 30 : price >= 250 ? 20 : 10;
    var offers = [
      { label: "商品平台满减券", reason: "联想商城专属，已自动领取", amount: platform },
      { label: "联想会员折扣券", reason: "乐享会员专享，已自动使用", amount: member }
    ];
    return { offers: offers, saved: platform + member, finalPrice: Math.max(0, price - platform - member) };
  }

  async function startServiceDiscountOrder(serviceId, trigger) {
    var service = findService(serviceId);
    if (!service || state.serviceBuyRunning) return;
    state.serviceBuyRunning = true;
    state.serviceSelectedId = service.id;
    var device = state.serviceDetailContext[service.id] || serviceDeviceContext(service.id);
    state.serviceDetailContext[service.id] = device;
    if (embeddedHost && typeof window.__lxBuyProductFromMember === "function") {
      state.serviceBuyRunning = false;
      window.__lxBuyProductFromMember({
        sku: service.id,
        name: service.name,
        price: servicePriceNumber(service),
        image_url: service.image,
        category: warrantyCatalog[service.id] ? "延保服务" : "服务商品",
        promotion_tags: ["会员服务"],
        official: true,
        type: "product",
        commerceType: "service-product"
      });
      return;
    }
    var discount = claimServiceDiscounts(service);
    enterChat();
    var turn = appendTurn("购买" + service.name + "，帮我领取所有可用优惠");
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    await streamAnswer(turn, '<p>好的！为你自动领取 ' + discount.offers.length + ' 项专属优惠：</p>');
    turn.insertAdjacentHTML("beforeend", serviceDiscountCard(service, discount));
    appendDisclaimer(turn);
    var card = turn.querySelector(".leai-discount-card");
    await runServiceDiscountCard(card, discount.offers.length);
    state.serviceBuyRunning = false;
    state.pendingServiceOrder = { service: service, device: device, discount: discount };
    openServiceOrderConfirm(trigger);
  }

  function serviceDiscountCard(service, discount) {
    return '<section class="leai-discount-card" data-state="claiming" aria-live="polite"><div class="leai-discount-card-head"><span class="leai-discount-icon"><img src="' + icons.membership + '" alt=""></span><div><strong data-discount-title>正在为你自动领取优惠</strong><small>' + escapeHtml(service.name) + '</small></div><em data-discount-count>0/' + discount.offers.length + '</em><b>已省 ¥' + discount.saved + '</b></div><div class="leai-discount-progress"><span data-discount-progress></span></div><div class="leai-discount-chips">' + discount.offers.map(function (offer) { return '<span data-discount-chip><img src="' + icons.check + '" alt="">' + escapeHtml(offer.label) + ' <b>¥' + offer.amount + '</b></span>'; }).join("") + '</div></section>';
  }

  async function runServiceDiscountCard(card, total) {
    if (!card) return;
    var count = card.querySelector("[data-discount-count]");
    var progress = card.querySelector("[data-discount-progress]");
    var chips = Array.prototype.slice.call(card.querySelectorAll("[data-discount-chip]"));
    for (var index = 0; index < total; index += 1) {
      if (!prefersReduced()) await delay(320);
      chips[index].classList.add("is-claimed");
      count.textContent = index + 1 + "/" + total;
      progress.style.width = Math.round(((index + 1) / total) * 100) + "%";
    }
    card.querySelector("[data-discount-title]").textContent = "已为你领取 " + total + " 项优惠";
    if (!prefersReduced()) await delay(180);
    card.dataset.state = "done";
  }

  function openServiceOrderConfirm(trigger) {
    var pending = state.pendingServiceOrder;
    if (!pending) return;
    var service = pending.service;
    var device = pending.device;
    var discount = pending.discount;
    var mask = el("#leaiModal");
    var modal = mask.querySelector(".leai-modal");
    modal.classList.remove("is-student", "is-wechat");
    modal.classList.add("is-service-order");
    el("#leaiModalTitle").textContent = "确认订单";
    el("#leaiModalDesc").textContent = "";
    el("#leaiModalForm").innerHTML = '<div class="leai-order-confirm-badge"><img src="' + icons.check + '" alt="">已领取 ' + discount.offers.length + ' 项优惠</div><div class="leai-order-confirm-product"><img src="' + service.image + '" alt=""><div><strong>' + escapeHtml(service.name) + '</strong><span>标价 <s>¥' + servicePriceNumber(service) + '</s></span></div></div><div class="leai-order-confirm-offers">' + discount.offers.map(function (offer) { return '<div><img src="' + icons.check + '" alt=""><span><strong>' + escapeHtml(offer.label) + '</strong><small>' + escapeHtml(offer.reason) + '</small></span><b>-¥' + offer.amount + '</b></div>'; }).join("") + '</div><div class="leai-order-confirm-total"><span><strong>到手价</strong><small>已为你省 ¥' + discount.saved + '</small></span><b>¥' + discount.finalPrice + '</b></div><div class="leai-order-confirm-device"><img src="' + icons.membership + '" alt=""><span><strong>关联设备：' + escapeHtml(device.name) + '</strong><small>下单后可在订单中预约服务</small></span></div><button class="leai-primary leai-order-confirm-submit" type="submit">确认下单 · ¥' + discount.finalPrice + '</button><p class="leai-form-note">演示环境：优惠与订单仅保存在当前页面，不会真实扣款或发起履约。</p>';
    el("#leaiModalForm").onsubmit = function (event) { event.preventDefault(); submitDiscountServiceOrder(); };
    mask.classList.add("is-open");
    mask.setAttribute("aria-hidden", "false");
    if (trigger) trigger.dataset.modalTrigger = "active";
    window.setTimeout(function () { el(".leai-order-confirm-submit").focus(); }, 0);
  }

  async function submitDiscountServiceOrder() {
    var pending = state.pendingServiceOrder;
    if (!pending) return;
    var service = pending.service;
    var device = pending.device;
    var discount = pending.discount;
    closeModal();
    state.pendingServiceOrder = null;
    var turn = appendTurn("确认下单" + service.name);
    await streamAnswer(turn, '<p>已下单成功（演示）：<strong>' + escapeHtml(service.name) + '</strong>，实付 ¥' + discount.finalPrice + '。可在“我的订单”中继续预约服务。</p>');
    appendTrace(turn, "已收到 Mock 服务商品订单回执");
    state.servicePurchaseStatus = "已购买";
    state.serviceAppointmentStatus = "未预约";
    state.serviceOrder = {
      orderId: "FW20260819001",
      name: service.name,
      price: "¥" + discount.finalPrice,
      originalPrice: service.price,
      saved: discount.saved,
      offers: discount.offers,
      image: service.image,
      status: "待预约",
      createdAt: "2026/8/19 10:30:00",
      device: device.name === "拯救者游戏本" ? "拯救者 Y7000P" : device.name,
      sn: device.sn === "设备型号待结算校验" ? "MP2G****" : device.sn
    };
    turn.insertAdjacentHTML("beforeend", actionCard("orders", "查看服务订单", "订单 " + state.serviceOrder.orderId + " · 待预约服务"));
    appendDisclaimer(turn);
    await nextFrame();
    openRightView("orders");
  }

  async function runServiceTask(type, serviceId) {
    var selected = state.serviceCompare.map(function (id) { return findService(id).name; });
    var service = findService(serviceId || state.serviceSelectedId) || serviceCatalog.thermal;
    var query = "";
    if (type === "recommend") {
      if (selected.length < 2) return;
      query = "帮我比较" + selected.join("和") + "，为拯救者游戏本选一个，北京地区";
    } else if (type === "purchase") {
      state.serviceSelectedId = service.id;
      query = "我想购买" + service.name + "服务，设备是拯救者游戏本，北京地区";
    }
    else if (type === "appointment") query = "我想预约深度清灰服务，设备是拯救者游戏本，北京地区";
    else return;
    var task = taskEnvelope("service-" + type, { device: "拯救者游戏本", region: "北京", services: type === "purchase" ? [service.name] : selected });
    document.body.dataset.activeRequest = task.requestId;
    enterChat();
    var turn = appendTurn(query);
    turn.dataset.requestId = task.requestId;
    await nextFrame();
    turn.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    serviceTaskFlow(turn, type, task);
  }

  async function serviceTaskFlow(turn, type, task) {
    if (type === "recommend") {
      await streamAnswer(turn, '<p>两项服务都适用于当前设备。考虑到拯救者游戏本的散热压力，我更建议<strong>深度清灰 + 更换硅脂</strong>，它在清洁之外还覆盖散热介质更换。</p>');
      appendTrace(turn, "已完成服务内容与设备适用性比较");
      turn.insertAdjacentHTML("beforeend", actionCard("service-adopt", "采用推荐方案", "深度清灰 + 更换硅脂 · ¥299起"));
      appendDisclaimer(turn);
      await nextFrame();
      task.state = "ready_to_confirm";
      state.serviceRecommended = "thermal";
      refreshRightView();
      return;
    }
    if (type === "purchase") {
      var purchaseService = findService(state.serviceSelectedId) || serviceCatalog.thermal;
      await streamAnswer(turn, '<p>已校验登录状态、拯救者游戏本适用性、北京地区和服务 SKU。当前可继续购买<strong>' + escapeHtml(purchaseService.name) + '</strong>。</p>');
      appendTrace(turn, "已完成设备、地区与服务 SKU 校验");
      turn.insertAdjacentHTML("beforeend", actionCard("modal:purchase", "确认购买", escapeHtml(purchaseService.name) + " · " + escapeHtml(purchaseService.price)));
      appendDisclaimer(turn);
      await nextFrame();
      task.state = "ready_to_confirm";
      state.servicePurchaseStatus = "待确认";
      refreshRightView();
      return;
    }
    if (state.servicePurchaseStatus !== "已购买") {
      await streamAnswer(turn, '<p>暂未查询到可预约的已购服务订单。请先完成服务商品购买，再选择门店与到店时间。</p>');
      appendDisclaimer(turn);
      task.state = "error";
      return;
    }
    await streamAnswer(turn, '<p>已找到对应服务订单，并确认北京地区存在可预约门店与时段。请核对门店和到店时间。</p>');
    appendTrace(turn, "已完成订单、设备、门店与时段校验");
    turn.insertAdjacentHTML("beforeend", actionCard("modal:appointment", "确认预约", "中关村店 · 8 月 16 日 10:00–12:00"));
    appendDisclaimer(turn);
    await nextFrame();
    task.state = "ready_to_confirm";
    state.serviceAppointmentStatus = "待确认";
    refreshRightView();
  }

  function handleAction(button) {
    var action = button.dataset.leaiAction;
    if (action.indexOf("modal:") === 0) { openModal(action.split(":")[1], button); return; }
    if (action.indexOf("member-asset:") === 0) { openMemberAsset(action.split(":")[1], button); setSelected(button); return; }
    if (action === "member-devices") { openMemberDevices(button); return; }
    if (action === "member") { openRightView("member"); setSelected(button); return; }
    if (action === "service") { openRightView("service"); setSelected(button); return; }
    if (action === "orders") { openRightView("orders"); setSelected(button); return; }
    if (action === "education") { focusEducationCard(); setSelected(button); return; }
    if (action === "service-context") {
      var turn = appendTurn("拯救者游戏本，北京地区");
      serviceFlow(turn, "我想给拯救者游戏本清灰换硅脂，北京地区");
      return;
    }
    if (action === "service-other") { el(".assistant-panel .composer textarea").value = "我想为其他笔记本查询清灰服务，设备是"; el(".assistant-panel .composer textarea").focus(); return; }
    if (action === "service-adopt") {
      button.disabled = true;
      button.querySelector(".leai-card-title").textContent = "已采用推荐方案";
      button.querySelector(".leai-card-desc").textContent = "右侧已定位到深度清灰 + 更换硅脂";
      state.serviceRecommended = "thermal";
      refreshRightView();
      return;
    }
    if (action === "support") { button.disabled = true; button.querySelector(".leai-card-title").textContent = "已打开官方服务入口"; }
  }

  function setSelected(button) {
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); });
  }

  function openModal(type, trigger) {
    var item = type === "purchase" ? servicePurchaseModalCopy() : copy[type];
    if (!item) return;
    if (type === "student") {
      openStudentModal(trigger);
      return;
    }
    state.modalType = type;
    var mask = el("#leaiModal");
    mask.querySelector(".leai-modal").classList.remove("is-student", "is-profile-editor", "is-service-order", "is-wechat");
    if (type === "deviceBind") {
      var deviceBindClose = mask.querySelector(".leai-modal-close");
      deviceBindClose.textContent = "×";
      deviceBindClose.setAttribute("aria-label", "关闭绑定新设备");
    }
    el("#leaiModalTitle").textContent = item.title;
    el("#leaiModalDesc").textContent = item.description;
    var fields = item.fields.map(function (field, index) {
      var control = field[1] === "select" ? '<select id="leaiField' + index + '" required>' + field[2].map(function (option) { return '<option>' + escapeHtml(option) + '</option>'; }).join("") + '</select>' : '<input id="leaiField' + index + '" required placeholder="' + escapeHtml(field[2]) + '">';
      return '<div class="leai-field"><label for="leaiField' + index + '">' + escapeHtml(field[0]) + '</label>' + control + '</div>';
    }).join("");
    if (type === "deviceBind") {
      fields = '<fieldset class="leai-device-bind-kinds"><legend>设备类型</legend><label><input type="radio" name="leaiDeviceKind" value="电脑" checked><span>电脑</span></label><label><input type="radio" name="leaiDeviceKind" value="手机"><span>手机</span></label><label><input type="radio" name="leaiDeviceKind" value="平板"><span>平板</span></label></fieldset>' + fields + '<section class="leai-device-bind-help" aria-label="设备序列号查询说明"><strong>如何查询您的 SN / IMEI / IMID 号？</strong><span>方法一</span><p>查看主机底部或机身标识牌，S/N 后面的字母与数字即为设备序列号。</p><small>笔记本、一体机与 ThinkPad 通常可在机身底部标识牌找到；手机与平板可在系统设置的“关于设备”中查询。</small></section>';
    }
    el("#leaiModalForm").innerHTML = fields + '<p class="leai-form-note">表单仅用于交互演示。关闭弹窗视为取消，不表述为失败或完成。</p><div class="leai-modal-actions"><button class="leai-secondary" type="button" data-modal-close>取消</button><button class="leai-primary" type="submit">' + escapeHtml(item.submitLabel || "提交申请") + '</button></div>';
    el("#leaiModalForm").onsubmit = function (event) { event.preventDefault(); submitModal(type, trigger); };
    mask.classList.add("is-open");
    mask.setAttribute("aria-hidden", "false");
    if (trigger) trigger.dataset.modalTrigger = "active";
    window.setTimeout(function () { el(type === "deviceBind" ? "#leaiField0" : "#leaiModalForm input, #leaiModalForm select").focus(); }, 0);
  }

  function clearPhoneCodeCountdown(){return window.__p0Modules.invoke("modals/profile-edit#clearPhoneCodeCountdown:98854fe4f355ce1c7341d0f5",{get ["el"](){return el}},this,arguments);}

  function openProfileEditorModal(trigger){return window.__p0Modules.invoke("modals/profile-edit#openProfileEditorModal:5de6a94ce7e31011e11cc2f6",{get ["clearPhoneCodeCountdown"](){return clearPhoneCodeCountdown},get ["state"](){return state},get ["el"](){return el},get ["memberProfilePage"](){return memberProfilePage}},this,arguments);}

  function openPhoneRebindModal(trigger){return window.__p0Modules.invoke("modals/profile-edit#openPhoneRebindModal:f3e657c72864bf5910205ec4",{get ["clearPhoneCodeCountdown"](){return clearPhoneCodeCountdown},get ["state"](){return state},get ["el"](){return el},get ["escapeHtml"](){return escapeHtml},get ["maskPhone"](){return maskPhone},get ["closeModal"](){return closeModal},get ["refreshRightView"](){return refreshRightView}},this,arguments);}

  function maskPhone(phone) {
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }

  function servicePurchaseModalCopy() {
    var service = findService(state.serviceSelectedId) || serviceCatalog.thermal;
    return {
      title: copy.purchase.title,
      description: copy.purchase.description,
      submitLabel: copy.purchase.submitLabel,
      fields: [
        ["服务商品", "select", [service.name]],
        ["服务设备", "select", ["拯救者游戏本"]],
        ["服务地区", "select", ["北京"]],
        ["参考价格", "select", [service.price]]
      ]
    };
  }

  function mockSunCodeCells() {
    var cells = [];
    for (var row = 0; row < 21; row += 1) {
      for (var column = 0; column < 21; column += 1) {
        var center = row >= 7 && row <= 13 && column >= 7 && column <= 13;
        var edge = row < 3 || row > 17 || column < 3 || column > 17;
        var dark = !center && ((row * 7 + column * 11 + row * column) % 5 < 2 || (edge && (row + column) % 3 === 0));
        cells.push('<span' + (dark ? ' class="is-dark"' : "") + '></span>');
      }
    }
    return cells.join("");
  }

  function openStudentModal(trigger){return window.__p0Modules.invoke("modals/education-auth#openStudentModal:d5d85ee982b28bf4ffad0787",{get ["embeddedHost"](){return embeddedHost},get ["state"](){return state},get ["el"](){return el},get ["renderStudentModal"](){return renderStudentModal}},this,arguments);}

  function renderStudentModal(){return window.__p0Modules.invoke("modals/education-auth#renderStudentModal:c66252804aeb3f326f79b527",{get ["state"](){return state},get ["el"](){return el},get ["studentChoice"](){return studentChoice},get ["studentNotice"](){return studentNotice},get ["studentFields"](){return studentFields},get ["updateStudentSubmit"](){return updateStudentSubmit},get ["submitModal"](){return submitModal}},this,arguments);}

  function studentChoice(value, label, active, type) {
    var data = type === "audience" ? ' data-student-audience="' + value + '"' : ' data-student-method="' + value + '"';
    return '<button class="' + (active ? "is-active" : "") + '" type="button" role="tab" aria-selected="' + active + '"' + data + '>' + label + '</button>';
  }

  function studentNotice(audienceType, method) {
    if (audienceType === "exam") return method === "skip" ? "无需提交姓名和身份证号；请提供准考证号与清晰的准考证照片。" : "提交实名信息、准考证号与准考证照片，预计 1 个工作日内完成审核。";
    if (audienceType === "teacher") return method === "employment" ? "请提供学校或教育机构出具的在职证明，证明需处于有效期内。" : "请提供教师资格证编号与清晰证件照片，最终结果以认证服务回执为准。";
    if (method === "card") return "请提供学生证号和学生证照片；照片需清晰展示姓名与学生证号。";
    if (method === "wechat") return "通过微信学籍完成授权后提交；最终结果以教育认证服务回执为准。";
    return "使用学校 edu 邮箱接收验证邮件，完成邮箱所有权与在校身份校验。";
  }

  function studentFields(audienceType, method) {
    var fields = [];
    if (audienceType === "exam") {
      if (method === "verified") fields.push(studentInput("真实姓名", "leaiStudentName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiStudentId", "请输入身份证号", "text"));
      fields.push(studentInput("考生号 / 准考证号", "leaiExamNumber", "请输入考生号或准考证号", "text"), studentUpload("准考证照片", "leaiExamPhoto", "支持 png/jpg，单张不超过 5MB"));
    } else if (audienceType === "teacher") {
      fields.push(studentInput("真实姓名", "leaiTeacherName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiTeacherId", "请输入身份证号", "text"), studentInput("任教学校 / 机构", "leaiTeacherSchool", "请输入任教学校或教育机构", "text"), studentSelect("任教学段", "leaiTeacherStage", [["", "请选择"], ["primary", "小学"], ["middle", "中学"], ["college", "高校"], ["other", "其他教育机构"]]));
      if (method === "employment") fields.push(studentInput("教职工号", "leaiTeacherNumber", "请输入教职工号", "text"), studentUpload("教职证明", "leaiTeacherEmployment", "支持 png/jpg，单张不超过 5MB"));
      else fields.push(studentInput("教师资格证编号", "leaiTeacherCertificate", "请输入教师资格证编号", "text"), studentUpload("教师资格证照片", "leaiTeacherPhoto", "支持 png/jpg，单张不超过 5MB"));
    } else if (method === "wechat") {
      fields.push('<div class="leai-auth-connect"><strong>微信学籍授权</strong><span>完成授权后，认证服务将返回可提交状态。</span><label><input type="checkbox" required>我已完成微信学籍授权</label></div>');
    } else {
      fields.push(studentInput("真实姓名", "leaiStudentName", "请输入真实姓名", "text"), studentInput("身份证号", "leaiStudentId", "请输入身份证号", "text"), studentInput("学校名称", "leaiStudentSchool", "请输入学校名称", "text"), studentSelect("毕业时间", "leaiGraduateDate", [["", "请选择"], ["2026-07", "2026 年 7 月"], ["2027-07", "2027 年 7 月"], ["2028-07", "2028 年 7 月"], ["2029-07", "2029 年 7 月"]]), studentSelect("教育阶段", "leaiEducationLevel", [["", "请选择"], ["专科", "专科"], ["本科", "本科"], ["研究生", "研究生"]]));
      if (method === "card") fields.push(studentInput("学生证号", "leaiStudentNumber", "请输入学生证号", "text"), studentUpload("学生证照片", "leaiStudentPhoto", "支持 png/jpg，单张不超过 5MB"));
      else fields.push(studentInput("edu 邮箱", "leaiEduEmail", "请输入学校 edu 邮箱", "email"));
    }
    fields.push(studentInput("邀请码（选填）", "leaiInviteCode", "有邀请码可填写", "text", false));
    return fields.join("");
  }

  function studentInput(label, id, placeholder, type, required) {
    return '<div class="leai-field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '"' + (required === false ? "" : " required") + '></div>';
  }

  function studentSelect(label, id, options) {
    return '<div class="leai-field"><label for="' + id + '">' + label + '</label><select id="' + id + '" required>' + options.map(function (option) { return '<option value="' + option[0] + '">' + option[1] + '</option>'; }).join("") + '</select></div>';
  }

  function studentUpload(label, id, help) {
    return '<div class="leai-field leai-auth-upload"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="file" accept="image/png,image/jpeg" required><span>' + help + '</span></div>';
  }

  function updateStudentSubmit() {
    var form = el("#leaiModalForm");
    var submit = el("#leaiStudentSubmit");
    if (!form || !submit) return;
    submit.disabled = !form.checkValidity();
  }

  function closeModal() {
    clearPhoneCodeCountdown();
    var mask = el("#leaiModal");
    mask.classList.remove("is-open");
    delete mask.dataset.profileParity;
    mask.querySelector(".leai-modal").classList.remove("is-student", "is-service-order", "is-profile-editor");
    mask.setAttribute("aria-hidden", "true");
    var trigger = el('[data-modal-trigger="active"]');
    if (trigger) { delete trigger.dataset.modalTrigger; trigger.focus(); }
    state.modalType = "";
  }

  async function submitModal(type, trigger) {
    state.submitted[type] = true;
    if (type === "deviceBind") {
      await submitDeviceBindModal(trigger);
      return;
    }
    if (type === "purchase" || type === "appointment") {
      await submitServiceModal(type, trigger);
      return;
    }
    state.identityStatus.student = "reviewing";
    closeModal();
    var cardTitle = trigger && trigger.querySelector(".leai-card-title");
    var cardDescription = trigger && trigger.querySelector(".leai-card-desc");
    if (cardTitle && cardDescription) {
      trigger.disabled = true;
      cardTitle.textContent = "已提交认证申请";
      cardDescription.textContent = "当前状态：审核中";
    }
    if (type === "student") {
      var pathLabels = { edu: "edu 邮箱", card: "学生证", wechat: "微信学籍", verified: "实名认证", skip: "跳过实名", certificate: "教师资格证", employment: "教职证明" };
      var audienceLabels = { college: "在校生", exam: "高考生", teacher: "教师" };
      state.educationPath = audienceLabels[state.educationAudience] + " · " + pathLabels[state.educationMethod];
    }
    var turn = appendTurn("提交" + state.educationPath + "认证申请");
    await streamAnswer(turn, '<p>申请已提交，当前状态为<strong>审核中</strong>。我会保留本次结果；只有权威服务返回通过后，才会表述为“已认证/已升级”。</p>');
    appendTrace(turn, "已收到业务服务提交回执");
    if (type === "student") turn.insertAdjacentHTML("beforeend", actionCard("member", "查看教育优惠状态", "会员中心卡片 · 当前状态：认证中"));
    appendDisclaimer(turn);
    if (type === "student") focusEducationCard();
    else refreshRightView();
  }

  async function submitDeviceBindModal(trigger){return window.__p0Modules.invoke("modals/device-bind#submitDeviceBindModal:653a761139f8012a56e3a4d3",{get ["el"](){return el},get ["closeModal"](){return closeModal},get ["state"](){return state},get ["deviceCatalog"](){return deviceCatalog},get ["embeddedHost"](){return embeddedHost},get ["openRightView"](){return openRightView},get ["appendTurn"](){return appendTurn},get ["streamAnswer"](){return streamAnswer},get ["escapeHtml"](){return escapeHtml},get ["appendTrace"](){return appendTrace},get ["appendDisclaimer"](){return appendDisclaimer}},this,arguments);}

  async function submitServiceModal(type, trigger) {
    closeModal();
    trigger.disabled = true;
    trigger.querySelector(".leai-card-title").textContent = type === "purchase" ? "已确认购买" : "已确认预约";
    trigger.querySelector(".leai-card-desc").textContent = type === "purchase" ? "服务系统已受理购买" : "履约系统已受理预约";
    var purchaseService = findService(state.serviceSelectedId) || serviceCatalog.thermal;
    var query = type === "purchase" ? "确认购买" + purchaseService.name + "服务" : "确认预约 8 月 16 日中关村店清灰服务";
    var turn = appendTurn(query);
    if (type === "purchase") {
      await streamAnswer(turn, '<p>服务商品系统已返回演示购买成功回执。<strong>' + escapeHtml(purchaseService.name) + '</strong>已加入“我的订单”，可从订单继续前往微信小程序预约。</p>');
      appendTrace(turn, "已收到 Mock 服务商品购买回执");
      state.servicePurchaseStatus = "已购买";
      state.serviceAppointmentStatus = "未预约";
      state.serviceOrder = {
        orderId: "FW20260818001",
        name: purchaseService.name,
        price: purchaseService.price.replace("起", ""),
        image: purchaseService.image,
        status: "待预约",
        createdAt: "2026/8/18 20:18:00",
        device: "拯救者 Y7000P",
        sn: "MP2G****"
      };
      turn.insertAdjacentHTML("beforeend", actionCard("orders", "查看服务订单", "订单 " + state.serviceOrder.orderId + " · 待预约服务"));
    } else {
      await streamAnswer(turn, '<p>履约系统已返回预约成功回执。已预约<strong>8 月 16 日 10:00–12:00 · 中关村店</strong>，可在服务订单中查看。</p>');
      appendTrace(turn, "已收到服务预约回执");
      state.serviceAppointmentStatus = "已预约";
    }
    appendDisclaimer(turn);
    if (type === "purchase") {
      await nextFrame();
      openRightView("orders");
    } else refreshRightView();
  }

  function openRightView(view, displayMode) {
    if (embeddedHost) {
      if (state.rightTabs.indexOf(view) < 0) state.rightTabs.push(view);
      state.rightViewDisplayMode[view] = displayMode || "secondary";
      state.rightView = view;
      embeddedHost.innerHTML = rightViewHtml(view);
      embeddedHost.scrollTop = 0;
      if (view === "member" || view === "devices") setupDeviceBrowser(0);
      if (view === "member") setupBenefitBrowser(0);
      return;
    }
    var content = el(".shell > .content");
    var tabs = el("#leaiAuiTabs");
    var host = el("#leaiAuiView");
    if (state.rightTabs.indexOf(view) < 0) state.rightTabs.push(view);
    state.rightViewDisplayMode[view] = displayMode || "secondary";
    state.rightView = view;
    content.classList.add("leai-aui-active");
    tabs.hidden = false;
    host.hidden = false;
    renderRightTabs();
    host.innerHTML = rightViewHtml(view);
    host.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    syncResultCardSelection(view);
  }

  function focusEducationCard() {
    if (embeddedHost && typeof window.openMemberCenter === "function") {
      window.openMemberCenter();
      focusEducationCardWhenReady(16);
      return;
    }
    state.rightTabs = state.rightTabs.filter(function (view) { return view !== "education"; });
    delete state.rightViewDisplayMode.education;
    openRightView("member");
    focusEducationCardWhenReady(1);
  }

  function focusEducationCardWhenReady(attempts) {
    window.setTimeout(function () {
      var host = document.querySelector('[data-member-component-view="member"]') || embeddedHost || el("#leaiAuiView");
      var card = host && host.querySelector('[data-identity-track="education"]');
      if (card) {
        card.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "center" });
        return;
      }
      if (attempts > 1) focusEducationCardWhenReady(attempts - 1);
    }, attempts > 1 ? 60 : 0);
  }

  function activateRightTab(view) {
    if (state.rightTabs.indexOf(view) < 0 || view === state.rightView) return;
    state.rightView = view;
    renderRightTabs();
    var host = el("#leaiAuiView");
    host.innerHTML = rightViewHtml(view);
    host.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    syncResultCardSelection(view);
  }

  function secondaryParentView(view) {
    if (!view) return "";
    if (view.indexOf("asset:") === 0 || view === "profile" || view === "devices" || view === "ledou") return "member";
    if (view.indexOf("coupon-products:") === 0) return "asset:coupons";
    if (view.indexOf("device:") === 0) return "devices";
    if (view.indexOf("ledou-product:") === 0) return state.ledouProductOrigin === "member" ? "member" : "ledou";
    if (view.indexOf("service-detail:") === 0 || view.indexOf("selection:") === 0) return "service";
    if (view === "appointment-code") return "orders";
    return "";
  }

  function returnFromSecondary(parentView) {
    var parent = parentView || secondaryParentView(state.rightView);
    if (!parent) return;
    if (state.deviceFocusId && (parent === "devices" || parent === "member")) state.deviceFocusId = "";
    var current = state.rightView;
    state.rightTabs = state.rightTabs.filter(function (view) { return view !== current; });
    delete state.rightViewDisplayMode[current];
    if (state.rightTabs.indexOf(parent) < 0) state.rightTabs.push(parent);
    state.rightView = parent;
    renderRightTabs();
    var host = el("#leaiAuiView");
    host.innerHTML = rightViewHtml(parent);
    host.scrollTop = 0;
    if (parent === "member" || parent === "devices") setupDeviceBrowser(0);
    if (parent === "member") setupBenefitBrowser(0);
    syncResultCardSelection(parent);
  }

  function renderRightTabs() {
    if (embeddedHost) return;
    var tabs = el("#leaiAuiTabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "已打开页面");
    tabs.innerHTML = state.rightTabs.map(function (view) {
      var active = view === state.rightView;
      var label = rightViewLabel(view);
      return '<div class="leai-aui-tab-item' + (active ? ' is-active' : '') + '" role="presentation" data-aui-tab-item="' + escapeHtml(view) + '"><button class="leai-aui-tab" type="button" role="tab" data-aui-tab="' + escapeHtml(view) + '" aria-selected="' + (active ? "true" : "false") + '" aria-controls="leaiAuiView"' + (active ? ' tabindex="0"' : ' tabindex="-1"') + '>' + escapeHtml(label) + '</button><button class="leai-aui-tab-x" type="button" data-aui-close-view="' + escapeHtml(view) + '" aria-label="关闭' + escapeHtml(label) + '">×</button></div>';
    }).join("");
  }

  function rightViewLabel(view) {
    if (view.indexOf("asset:") === 0) {
      var asset = memberAssets[view.split(":")[1]];
      return asset ? asset.label : "会员资产";
    }
    if (view.indexOf("device:") === 0) {
      var device = deviceCatalog[view.split(":")[1]];
      return device ? device.name : "设备详情";
    }
    if (view.indexOf("service-detail:") === 0) {
      var service = findService(view.split(":")[1]);
      return service ? service.name : "服务详情";
    }
    if (view.indexOf("ledou-product:") === 0) {
      var product = findLedouProduct(view.split(":")[1]);
      return product ? product.name : "好物详情";
    }
    if (view.indexOf("coupon-products:") === 0) return "可用商品";
    if (view.indexOf("selection:") === 0) return view.split(":")[1] === "device" ? "选择设备" : "选择地区";
    return { member: "会员中心", profile: "个人信息", devices: "我的设备", ledou: "乐豆好物", service: "服务商品推荐", orders: "我的订单", "appointment-code": "预约服务" }[view] || "页面";
  }

  function rightViewHtml(view) {
    var html = "";
    if (view.indexOf("asset:") === 0) html = memberAssetPage(view.split(":")[1]);
    else if (view.indexOf("device:") === 0) html = memberDeviceDetailPage(view.split(":")[1]);
    else if (view.indexOf("service-detail:") === 0) html = serviceDetailPage(view.split(":")[1]);
    else if (view.indexOf("ledou-product:") === 0) html = ledouProductPage(view.split(":")[1]);
    else if (view.indexOf("coupon-products:") === 0) html = couponProductsPage(view.split(":")[1]);
    else if (view.indexOf("selection:") === 0) html = selectionPage(view.split(":")[1]);
    else if (view === "member") html = memberPage();
    else if (view === "profile") html = memberProfilePage();
    else if (view === "devices") html = memberDevicesPage();
    else if (view === "ledou") html = ledouPage();
    else if (view === "service") html = servicePage();
    else if (view === "orders") html = serviceOrdersPage();
    else if (view === "appointment-code") html = appointmentCodePage();
    else html = memberPage();
    return decorateSecondaryPage(view, html);
  }

  function decorateSecondaryPage(view, html) {
    var parent = secondaryParentView(view);
    if (!parent) return html;
    var openedAsIndependentTab = state.rightViewDisplayMode[view] === "tab";
    if (openedAsIndependentTab) {
      var pageLabel = rightViewLabel(view);
      html = html.replace(/(<section\b[^>]*?)\s+aria-labelledby="[^"]*"([^>]*>)/, '$1 aria-label="' + escapeHtml(pageLabel) + '"$2');
      return html.replace(/<header class="[^"]*\bleai-page-header\b[^"]*">[\s\S]*?<\/header>/, "");
    }
    if (/data-secondary-back/.test(html)) return html;
    var parentLabel = rightViewLabel(parent);
    return html.replace(/<h1 class="([^"]*\bleai-page-title\b[^"]*)"([^>]*)>([\s\S]*?)<\/h1>/, function (_, classes, attributes, title) {
      return '<div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="' + escapeHtml(parent) + '" aria-label="返回' + escapeHtml(parentLabel) + '"><img src="' + icons.next + '" alt=""></button><h1 class="' + classes + '"' + attributes + '>' + title + '</h1></div>';
    });
  }

  function refreshRightView() {
    if (!state.rightView) return;
    var host = el("#leaiAuiView");
    var scrollTop = host.scrollTop;
    var deviceTrack = host.querySelector("[data-device-track]");
    var deviceScroll = deviceTrack ? deviceTrack.scrollLeft : 0;
    var benefitTrack = host.querySelector("[data-benefit-track]");
    var benefitScroll = benefitTrack ? benefitTrack.scrollLeft : 0;
    host.innerHTML = rightViewHtml(state.rightView);
    host.scrollTop = scrollTop;
    if (state.rightView === "member" || state.rightView === "devices") setupDeviceBrowser(deviceScroll);
    if (state.rightView === "member") setupBenefitBrowser(benefitScroll);
  }

  function closeRightView(closeAll, viewToClose) {
    var content = el(".shell > .content");
    var closingView = viewToClose || state.rightView;
    if (!closeAll && state.rightTabs.length > 1) {
      var closingIndex = state.rightTabs.indexOf(closingView);
      var closingActive = closingView === state.rightView;
      state.rightTabs = state.rightTabs.filter(function (view) { return view !== closingView; });
      delete state.rightViewDisplayMode[closingView];
      if (closingActive) state.rightView = state.rightTabs[Math.max(0, closingIndex - 1)] || state.rightTabs[0];
      renderRightTabs();
      if (closingActive) {
        var remainingHost = el("#leaiAuiView");
        remainingHost.innerHTML = rightViewHtml(state.rightView);
        remainingHost.scrollTop = 0;
        if (state.rightView === "member" || state.rightView === "devices") setupDeviceBrowser(0);
        if (state.rightView === "member") setupBenefitBrowser(0);
      }
      syncResultCardSelection(state.rightView);
      return;
    }
    content.classList.remove("leai-aui-active");
    el("#leaiAuiTabs").hidden = true;
    el("#leaiAuiView").hidden = true;
    state.rightView = "";
    state.rightTabs = [];
    state.rightViewDisplayMode = {};
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
  }

  function syncResultCardSelection(view) {
    var action = view.indexOf("asset:") === 0 ? "member-asset:" + view.split(":")[1] : { member: "member", devices: "member-devices", service: "service", orders: "orders" }[view];
    document.querySelectorAll(".leai-action-card[aria-pressed]").forEach(function (item) {
      item.setAttribute("aria-pressed", item.dataset.leaiAction === action ? "true" : "false");
    });
  }

  function assetRecordStatus(record) {
    return record && !Array.isArray(record) ? record.status : record[3];
  }

  function renderLedouRecords(records){return window.__p0Modules.invoke("pages/ledou-center#renderLedouRecords:1dfed6f16d2b758ed58eb833",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function renderRedpacketRecords(records){return window.__p0Modules.invoke("pages/red-envelope#renderRedpacketRecords:299dc3c32aa8e91058ba3787",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function renderCouponRecords(records){return window.__p0Modules.invoke("pages/coupon-center#renderCouponRecords:de9224aeaed9bcbda9bea8dd",{get ["state"](){return state},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons}},this,arguments);}

  function renderDefaultAssetRecords(records, type) {
    return '<div class="leai-asset-ledger"' + (type === "vouchers" ? ' data-voucher-ledger' : '') + '>' + records.map(function (record) { return '<div data-asset-record-status="' + record[3] + '"><span><strong>' + record[0] + '</strong><small>' + record[2] + '</small></span><em>' + record[1] + '</em></div>'; }).join("") + '</div>';
  }

  function memberAssetPage(type) {
    var pages = {
      points: {
        label: "乐豆", value: "2,580", unit: "可用乐豆", description: "查看乐豆余额、获取与使用记录，以及当前适用规则。",
        metrics: [["近 30 天获得", "+860"], ["近 30 天使用", "-300"], ["即将到期", "0"]],
        filters: [["all", "全部"], ["earned", "获得"], ["used", "使用"]],
        periodOptions: [["30d", "30天内"], ["3m", "3个月内"], ["6m", "6个月内"], ["1y", "一年内"], ["custom", "自定义"]],
        records: [
          { title: "购买服务商品奖励", amount: "+500", sourceDescription: "完成笔记本深度清灰服务订单后获得乐豆奖励", sourceChannel: "联想商城", acquiredAt: "2026.08.16 14:32", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "会员签到奖励", amount: "+360", sourceDescription: "连续签到与会员任务累计奖励", sourceChannel: "会员任务中心", acquiredAt: "2026.08.12 09:05", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换清洁套装", amount: "-300", sourceDescription: "使用乐豆兑换会员清洁套装", sourceChannel: "乐豆商城", acquiredAt: "2026.08.03 18:20", expiresAt: "—", status: "used" },
          { title: "会员日浏览任务", amount: "+120", sourceDescription: "完成会员日指定页面浏览任务", sourceChannel: "会员任务中心", acquiredAt: "2026.07.28 10:18", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "评价服务订单", amount: "+80", sourceDescription: "完成服务订单评价并通过审核", sourceChannel: "联想商城", acquiredAt: "2026.07.22 16:46", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换无线鼠标", amount: "-500", sourceDescription: "使用乐豆兑换 ThinkPlus 无线鼠标", sourceChannel: "乐豆商城", acquiredAt: "2026.07.15 11:30", expiresAt: "—", status: "used" },
          { title: "完善会员资料", amount: "+100", sourceDescription: "首次完善头像与基础会员资料", sourceChannel: "会员中心", acquiredAt: "2026.06.30 09:22", expiresAt: "2027.12.31 23:59", status: "earned" },
          { title: "兑换延保抵扣券", amount: "-200", sourceDescription: "使用乐豆兑换指定延保服务抵扣券", sourceChannel: "会员权益中心", acquiredAt: "2026.06.18 14:08", expiresAt: "—", status: "used" }
        ],
        rule: "乐豆获取、有效期、抵扣比例与适用商品以实时会员规则和结算页为准。"
      },
      coupons: {
        label: "优惠券", value: "3 张", unit: "当前可用", description: "集中查看可用优惠券、适用范围和有效期。",
        metrics: [["即将到期", "1 张"], ["服务商品券", "1 张"], ["购物优惠券", "2 张"]],
        filters: [["available", "已领取(3)"], ["used", "已使用(1)"], ["expired", "已过期(1)"]],
        records: couponCatalog,
        rule: "优惠券门槛、叠加规则和适用商品以券详情及结算页为准。"
      },
      vouchers: {
        label: "代金券", value: "2 张", unit: "当前可用", description: "查看认证、换新等场景获得的代金券。",
        metrics: [["教育场景", "1 张"], ["以旧换新", "1 张"], ["即将到期", "0 张"]],
        filters: [["all", "全部"], ["available", "可使用"], ["used", "已使用"], ["expired", "已失效"]],
        periodOptions: [["all", "全部来源"], ["education", "教育优惠"], ["tradein", "以旧换新"]],
        records: [["教育认证代金券", "¥300", "教育特惠订单可用", "available"], ["以旧换新补贴券", "¥100", "指定换新订单可用", "available"], ["会员回馈代金券", "¥50", "8 月 1 日已使用", "used"], ["新品预约代金券", "¥80", "7 月 31 日已失效", "expired"]],
        rule: "代金券发放资格、使用门槛和有效期以对应活动规则为准。"
      },
      redpacket: {
        label: "限时红包", value: "¥84", unit: "当前可用", description: "查看限时红包余额、获得与使用记录和到期提醒。",
        metrics: [["红包金额", "¥84"], ["明日到期", "¥18"], ["本月获得", "+¥102"]],
        filters: [["all", "全部"], ["available", "可用"], ["used", "已使用"], ["expired", "已过期"]],
        periodOptions: [["all", "全部时间"], ["1m", "近 1 个月"], ["6m", "近 6 个月"]],
        records: [
          { title: "作废", time: "2026-06-22 00:01:57", amount: "−54.00", status: "expired" },
          { title: "作废", time: "2026-06-22 00:01:54", amount: "−92.00", status: "expired" },
          { title: "作废", time: "2026-06-22 00:01:49", amount: "−18.00", status: "expired" },
          { title: "大转盘抽奖", time: "2026-05-26 15:11:16", amount: "+18.00", status: "available" },
          { title: "大转盘抽奖", time: "2026-05-26 15:10:55", amount: "+18.00", status: "available" },
          { title: "大转盘抽奖", time: "2026-05-26 15:10:35", amount: "+18.00", status: "available" }
        ],
        rule: "红包不能兑换现金，使用范围、叠加方式与有效期以活动页面为准。"
      },
      benefitpoints: {
        label: "权益点", value: "1,200", unit: "可用权益点", description: "查看权益点来源、兑换记录和可兑换服务。",
        metrics: [["累计获得", "1,500"], ["累计使用", "300"], ["可兑换服务", "3 项"]],
        records: [["购买 ThinkPad 商品", "+1,200", "8 月 10 日", "all"], ["会员活动奖励", "+300", "7 月 28 日", "all"], ["兑换延保服务", "-300", "7 月 15 日", "all"]],
        rule: "权益点来源、兑换门槛和适用服务以会员权益中心实时展示为准。"
      }
    };
    var page = pages[type] || pages.points;
    var activeFilter = state.assetFilters[type] || "all";
    if (type === "coupons" && activeFilter === "all") activeFilter = "available";
    var records = page.records.filter(function (record) { return activeFilter === "all" || assetRecordStatus(record) === activeFilter; });
    var periodFilter = "";
    if (page.periodOptions) {
      if (type === "points") {
        var selectedPeriod = page.periodOptions.find(function (option) { return option[0] === state.assetPeriods[type]; }) || page.periodOptions[2];
        periodFilter = '<div class="leai-ledou-period-filter"><span>筛选时间</span><div class="leai-ledou-period-picker" data-ledou-period-picker><button type="button" data-ledou-period-trigger aria-haspopup="listbox" aria-expanded="false">' + selectedPeriod[1] + '<i aria-hidden="true"></i></button><div class="leai-ledou-period-menu" data-ledou-period-menu role="listbox" hidden>' + page.periodOptions.map(function (option) { var selected = option[0] === selectedPeriod[0]; return '<button class="' + (selected ? 'is-selected' : '') + '" type="button" role="option" aria-selected="' + selected + '" data-ledou-period-option="' + option[0] + '"><span>' + (selected ? '✓' : '') + '</span>' + option[1] + '</button>'; }).join("") + '</div></div></div>';
      } else {
        periodFilter = '<label><span>筛选范围</span><select data-asset-period data-asset-type="' + type + '">' + page.periodOptions.map(function (option) { return '<option value="' + option[0] + '"' + (option[0] === state.assetPeriods[type] ? ' selected' : '') + '>' + option[1] + '</option>'; }).join("") + '</select></label>';
      }
    }
    var filters = page.filters ? '<div class="leai-asset-filterbar" data-asset-filterbar="' + type + '"><div class="leai-asset-filter-tabs" role="group" aria-label="筛选' + page.label + '明细">' + page.filters.map(function (filter) { return '<button class="' + (filter[0] === activeFilter ? 'is-active' : '') + '" type="button" data-asset-filter="' + filter[0] + '" data-asset-type="' + type + '" aria-pressed="' + (filter[0] === activeFilter) + '">' + filter[1] + '</button>'; }).join("") + '</div>' + periodFilter + '</div>' : "";
    var recordList = type === "points" ? renderLedouRecords(records) : type === "coupons" ? renderCouponRecords(records) : type === "redpacket" ? renderRedpacketRecords(records) : renderDefaultAssetRecords(records, type);
    var ruleOpened = Boolean(state.assetRuleOpen[type]);
    var assetRuleTooltip = '<div class="leai-asset-rule-tooltip" id="leaiAssetRule-' + type + '" data-asset-rule-tooltip role="tooltip" aria-hidden="' + (!ruleOpened) + '"' + (ruleOpened ? '' : ' hidden') + '><strong>规则说明</strong><p>' + page.rule + '</p><small>当前页面数据为 Mock，实际余额、资产状态和规则以会员服务实时结果为准。</small></div>';
    var assetRuleInfo = '<div class="leai-asset-rule-info"><button class="leai-asset-rule-trigger" type="button" data-asset-rule-trigger="' + type + '" aria-label="查看' + page.label + '规则说明" aria-expanded="' + ruleOpened + '" aria-controls="leaiAssetRule-' + type + '"><span aria-hidden="true">!</span></button>' + assetRuleTooltip + '</div>';
    var summaryRuleButton = '<button class="leai-summary-usage" type="button" data-asset-rule-trigger="' + type + '" aria-expanded="' + ruleOpened + '" aria-controls="leaiAssetRule-' + type + '">使用说明 <span aria-hidden="true">?</span></button>' + assetRuleTooltip;
    var showRuleInHeader = type === "coupons";
    var assetHeader = '<header class="leai-page-header leai-asset-sticky-header"><div><div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="member" aria-label="返回会员中心"><img src="' + icons.next + '" alt=""></button><h1 class="leai-page-title" id="leaiAssetTitle-' + type + '">' + page.label + '</h1></div><p class="leai-page-desc">' + page.description + '</p></div>' + (showRuleInHeader ? assetRuleInfo : '') + '</header>';
    if (type === "points") {
      var pointsHeader = '<header class="leai-page-header leai-ledou-sticky-header"><div class="leai-page-title-row"><button class="leai-page-back" type="button" data-secondary-back="member" aria-label="返回会员中心"><img src="' + icons.next + '" alt=""></button><h1 class="leai-page-title">乐豆明细</h1></div></header>';
      var pointsMetrics = '<div class="leai-ledou-metrics">' + page.metrics.map(function (metric) { return '<article><span>' + metric[0] + '</span><strong>' + metric[1] + '</strong><small>以账户实时资产为准</small></article>'; }).join("") + '</div>';
      return '<section class="leai-page leai-member-asset-page leai-ledou-ledger-page" data-member-asset-page="points" aria-label="乐豆明细">' + pointsHeader +
        '<div class="leai-ledou-overview-row"><section class="leai-ledou-balance-banner"><div><span>可用乐豆</span><strong>' + page.value + '</strong><small>未来 30 天无过期乐豆</small><a class="leai-ledou-shop-link" href="https://shop.lenovo.com.cn/page/jf/jfsc.html" target="_blank" rel="noopener noreferrer">去乐豆商城</a></div><button class="leai-ledou-rule-link" type="button" data-asset-rule-trigger="points" aria-expanded="' + ruleOpened + '">ⓘ 乐豆规则</button>' + (ruleOpened ? '<div class="leai-asset-rule-tooltip leai-ledou-rule-popover" data-asset-rule-tooltip role="tooltip"><strong>规则说明</strong><p>' + page.rule + '</p></div>' : '') + '</section>' + pointsMetrics + '</div>' +
        filters + '<section class="leai-ledou-ledger-panel">' + recordList + '</section></section>';
    }
    if (type === "coupons") {
      return '<section class="leai-page leai-member-asset-page leai-coupon-page" data-member-asset-page="coupons" aria-labelledby="leaiAssetTitle-coupons">' + assetHeader +
        filters + '<section class="leai-coupon-grid-section" aria-label="优惠券列表">' + recordList + '</section></section>';
    }
    if (type === "vouchers") {
      var availableVoucherCents = page.records.reduce(function (total, record) {
        return record[3] === "available" ? total + Math.round(Number(record[1].replace(/[^0-9.-]/g, "")) * 100) : total;
      }, 0);
      var voucherAmount = (availableVoucherCents / 100).toFixed(2).split(".");
      return '<section class="leai-page leai-member-asset-page leai-voucher-page" data-member-asset-page="vouchers" aria-labelledby="leaiAssetTitle-vouchers">' + assetHeader +
        '<div class="leai-summary-grid leai-voucher-summary"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">当前可用代金券金额</span><strong class="leai-summary-value">' + voucherAmount[0] + '<small>.' + voucherAmount[1] + '</small></strong>' + summaryRuleButton + '</article></div>' +
        filters + '<section class="leai-voucher-ledger-panel" aria-label="代金券列表">' + recordList + '</section></section>';
    }
    var defaultSummary = type === "redpacket"
      ? '<div class="leai-summary-grid leai-redpacket-summary"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">当前可用限时红包</span><strong class="leai-summary-value">0<small>.00</small></strong>' + summaryRuleButton + '</article></div>'
      : '<div class="leai-summary-grid"><article class="leai-summary-card leai-member-main"><span class="leai-summary-label">' + page.unit + '</span><strong class="leai-summary-value">' + page.value + '</strong>' + summaryRuleButton + '</article>' + page.metrics.map(function (metric) { return '<article class="leai-summary-card"><span class="leai-summary-label">' + metric[0] + '</span><strong class="leai-summary-value">' + metric[1] + '</strong><span class="leai-summary-sub">以账户实时资产为准</span></article>'; }).join("") + '</div>';
    if (type === "redpacket") {
      return '<section class="leai-page leai-member-asset-page leai-redpacket-page" data-member-asset-page="redpacket" aria-labelledby="leaiAssetTitle-redpacket">' + assetHeader + defaultSummary + filters + '<section class="leai-redpacket-ledger-panel" aria-label="限时红包明细列表">' + recordList + '</section></section>';
    }
    return '<section class="leai-page leai-member-asset-page" data-member-asset-page="' + type + '" aria-labelledby="leaiAssetTitle-' + type + '">' + assetHeader +
      defaultSummary +
      filters + '<section class="leai-panel"><div class="leai-panel-head"><div><h2 class="leai-panel-title">最近明细</h2><p>展示当前账户最近的资产变动与可用状态。</p></div><span class="leai-section-meta">会员资产服务</span></div>' + recordList + '</section>' +
      '</section>';
  }

  function couponProductsPage(couponId){return window.__p0Modules.invoke("pages/coupon-center#couponProductsPage:afcd78f414362ab3a3e1f8ee",{get ["couponCatalog"](){return couponCatalog},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons},get ["couponProductCatalog"](){return couponProductCatalog}},this,arguments);}

  function memberPage() {
    return '<section class="leai-page leai-member-page" aria-labelledby="leaiMemberTitle">' +
          '<header class="leai-member-main-header"><div class="leai-member-main-copy"><div class="leai-member-title-row"><h1 class="leai-page-title" id="leaiMemberTitle">会员中心</h1></div>' + memberProfileHeader() + '</div></header>' +
      '<section class="leai-member-overview-group" aria-label="会员概览与乐享建议">' +
        '<section class="leai-panel leai-member-overview leai-member-suggestions-panel" data-member-section="insights">' + memberInsights() + '</section>' +
        '<section class="leai-panel leai-member-overview" data-member-overview data-member-identities data-member-section="overview">' + memberIdentityHub() + '</section>' +
      '</section>' +
      identityBenefits() +
      '<section class="leai-member-education-slot" aria-label="教育特惠">' + educationIdentityTrack() + '</section>' +
      memberDevicesSection() +
      memberLedouShowcase() +
      '</section>';
  }

  function memberCheckinPrompt() {
    var checkedIn = state.memberCheckedIn;
    return '<button class="leai-member-checkin-prompt' + (checkedIn ? ' is-checked' : '') + '" type="button" data-member-checkin aria-label="' + (checkedIn ? '今日已签到' : '发送我要签到') + '"' + (checkedIn ? ' disabled' : '') + '><span class="leai-member-checkin-icon"><img src="' + icons.calendar + '" alt=""></span><span class="leai-member-checkin-copy"><strong>' + (checkedIn ? '<span>今日已签到</span><b>+10 乐豆</b>' : '今日尚未签到') + '</strong><em>' + (checkedIn ? '已连续签到 7 天，里程碑奖励已解锁' : '已连续 6 天 · 再签 1 天解锁 +50 乐豆') + '</em></span><span class="leai-member-checkin-action">' + (checkedIn ? '' : '去签到<img src="' + icons.next + '" alt="">') + '</span></button>';
  }

  function memberProfileHeader() {
    return '<button class="leai-member-profile-entry leai-member-profile-entry--header" type="button" data-member-profile-open aria-label="编辑' + escapeHtml(state.profile.nickname) + '的个人信息"><span class="leai-member-avatar"><img src="' + profileAvatarIcon(state.profile.avatar) + '" alt=""></span><span class="leai-member-profile"><span class="leai-member-profile-title-line"><strong>' + escapeHtml(state.profile.nickname) + '</strong><span class="leai-member-tier-badge" aria-label="当前会员等级：铂金会员"><img src="' + icons.crown + '" alt="">铂金会员</span></span><small>已陪伴 2679 天</small><span class="leai-member-profile-edit"><img class="leai-member-profile-edit-icon" src="' + icons.edit + '" alt="">编辑资料</span></span></button>';
  }

  function memberIdentityHub() {
    return '<div class="leai-member-identity" data-member-identity-hub><div class="leai-identity-content"><div class="leai-identity-pane" data-identity-pane="personal">' + personalIdentityTrack() + memberAssetSummary() + '</div></div></div>';
  }

  function memberAssetSummary() {
    return '<section class="leai-member-assets-panel" aria-labelledby="leaiMemberAssetsTitle"><div class="leai-member-assets-head"><h2 id="leaiMemberAssetsTitle">我的资产</h2><span>5 类资产</span></div><div class="leai-member-assets">' +
      memberAssetButton("points", "2,580", "", "乐豆", "近 30 天 +860") + memberAssetButton("coupons", "3", "张", "优惠券", "1 张即将到期") + memberAssetButton("vouchers", "2", "张", "代金券", "教育/换新可用") + memberAssetButton("redpacket", "2", "个", "限时红包", "明日到期 1 个") + memberAssetButton("benefitpoints", "1,200", "", "权益点", "可兑换会员服务") + '</div></section>';
  }

  function identityBenefits() {
    return '<div class="leai-member-level-panel" data-member-level-panel><div class="leai-benefit-block"><div class="leai-benefit-block-head"><strong>我的权益</strong><span>11 项权益</span></div><div class="leai-benefit-browser"><button class="leai-device-nav leai-benefit-nav is-previous" type="button" data-benefit-scroll="-1" aria-label="浏览上一组会员权益" disabled><img src="' + icons.next + '" alt=""></button><div class="leai-benefit-grid leai-benefit-grid-compact" data-benefit-track tabindex="0" role="region" aria-label="会员权益，可横向浏览">' +
      benefitTooltip("member-price", icons.rewards, "购物积分 3 倍", "消费积分加速", "积分倍率和适用商品以实时会员规则为准。") +
      benefitTooltip("coupon-pack", icons.membership, "专属券包", "会员优惠集中领", "券包内容、领取时间和使用门槛以会员服务为准。") +
      benefitTooltip("monthly-benefit", icons.customization, "月月福利", "会员日限时领取", "活动内容与领取资格以当月会员活动为准。") +
      benefitTooltip("new-trial", icons.trial, "新品试用", "指定新品优先体验", "试用范围、名额和参与条件以活动页面为准。") +
      benefitTooltip("birthday", icons.referrals, "生日礼包", "生日月专属优惠", "礼包内容与发放时间以会员服务为准。") +
      benefitTooltip("support", icons.support, "优先客服", "优先接入人工客服", "实际排队时间以服务繁忙程度为准。") +
      benefitTooltip("exclusive-price", icons.membership, "会员专享价", "指定商品会员价", "适用商品和实时价格以商城结算页为准。") +
      benefitTooltip("shipping-coupon", icons.rewards, "运费券", "指定订单减免运费", "领取资格、面额和可用订单以券规则为准。") +
      benefitTooltip("tradein-bonus", icons.customization, "换新加码", "以旧换新额外补贴", "参与机型、补贴额度和有效期以活动规则为准。") +
      benefitTooltip("service-discount", icons.support, "服务折扣", "指定服务会员优惠", "适用服务、设备和优惠额度以服务商品实时结果为准。") +
      benefitTooltip("event-priority", icons.trial, "活动优先报名", "热门活动优先参与", "活动名额、报名时间和参与资格以活动页面为准。") + '</div><button class="leai-device-nav leai-benefit-nav is-next" type="button" data-benefit-scroll="1" aria-label="浏览下一组会员权益"><img src="' + icons.next + '" alt=""></button></div></div></div>';
  }

  function memberInsights() {
    return '<section class="leai-member-insights" data-member-insights data-member-section="insights" aria-labelledby="leaiMemberInsightsTitle"><div class="leai-member-insights-head"><span><img src="' + icons.memberSparkle + '" alt=""></span><div><h2 id="leaiMemberInsightsTitle">乐享建议</h2></div></div><div class="leai-member-insight-grid">' +
      memberInsightButton("coupons", icons.membership, "会员资产", "1 张优惠券即将到期", "查看可用范围与有效期", "帮我查看即将到期的优惠券，并告诉我优先使用哪一张", true) +
      memberInsightButton("service", icons.support, "对话历史", "继续查看 Y7000P 散热服务", "承接近期设备服务咨询", "继续帮我查看适合拯救者 Y7000P 的清灰换硅脂服务") +
      memberInsightButton("ledou", icons.rewards, "用户行为", "近 30 天获得 860 乐豆", "查看当前乐豆明细", "帮我查看近 30 天乐豆的获得和使用明细") +
      '</div><p>当前建议基于 Mock 行为、对话与资产数据生成，实际内容需以授权后的实时信息为准。</p></section>';
  }

  function memberInsightButton(type, icon, source, title, description, query, hasAlert) {
    var alertDot = hasAlert ? '<i class="leai-member-insight-alert-dot" aria-hidden="true"></i>' : "";
    var alertLabel = hasAlert ? ' aria-label="' + escapeHtml(title) + '，有到期提醒"' : "";
    return '<button class="leai-member-insight" type="button" data-member-insight="' + type + '" data-member-insight-query="' + escapeHtml(query) + '"' + alertLabel + '><img src="' + icon + '" alt=""><span><small data-member-insight-source>' + source + '</small><span class="leai-member-insight-title-row"><strong>' + title + '</strong>' + alertDot + '</span><em>' + description + '</em></span><i class="leai-member-insight-chevron" aria-hidden="true">›</i></button>';
  }

  function memberLedouShowcase(){return window.__p0Modules.invoke("pages/ledou-center#memberLedouShowcase:5efbcd1c2a01303de0d1f8c3",{get ["icons"](){return icons},get ["ledouCatalog"](){return ledouCatalog},get ["ledouProductCard"](){return ledouProductCard}},this,arguments);}

  function ledouProductCard(product){return window.__p0Modules.invoke("pages/ledou-center#ledouProductCard:b3327362141d7b7cecf2b51f",{get ["icons"](){return icons}},this,arguments);}

  function findLedouProduct(id) {
    return ledouCatalog.find(function (product) { return product.id === id; }) || ledouCatalog[0];
  }

  function ledouPage(){return window.__p0Modules.invoke("pages/ledou-center#ledouPage:93ae8b8fc2ed36b1041ac398",{get ["icons"](){return icons},get ["ledouCatalog"](){return ledouCatalog},get ["ledouProductCard"](){return ledouProductCard}},this,arguments);}

  function ledouProductPage(id){return window.__p0Modules.invoke("pages/ledou-center#ledouProductPage:7159c945c3c3b597b0df49a3",{get ["findLedouProduct"](){return findLedouProduct},get ["icons"](){return icons}},this,arguments);}

  function profileAvatarIcon() {
    return state.profile.customAvatar || icons.membership;
  }

  function memberProfilePage(){return window.__p0Modules.invoke("modals/profile-edit#memberProfilePage:5cb2617defcd53fe504c9649",{get ["profileAvatarIcon"](){return profileAvatarIcon},get ["icons"](){return icons},get ["state"](){return state},get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function memberDevicesPage(){return window.__p0Modules.invoke("pages/device-list#memberDevicesPage:3dde0544d1e4b5c66331bb54",{get ["orderedDeviceKeys"](){return orderedDeviceKeys},get ["state"](){return state},get ["deviceCatalog"](){return deviceCatalog},get ["memberDeviceDetailPage"](){return memberDeviceDetailPage},get ["pendingDeviceListRow"](){return pendingDeviceListRow},get ["icons"](){return icons},get ["memberDeviceListRow"](){return memberDeviceListRow},get ["deviceFilterButton"](){return deviceFilterButton}},this,arguments);}

  function memberDeviceDetailPage(id){return window.__p0Modules.invoke("pages/device-detail#memberDeviceDetailPage:90fca015decbe9591fc1b42b",{get ["deviceCatalog"](){return deviceCatalog},get ["state"](){return state},get ["escapeHtml"](){return escapeHtml},get ["icons"](){return icons}},this,arguments);}

  function deviceFilterButton(key, label, count, activeFilter) {
    var active = key === activeFilter;
    return '<button class="leai-device-filter' + (active ? ' is-active' : '') + '" type="button" data-device-filter="' + key + '" aria-pressed="' + active + '"><span>' + label + '</span><strong>' + count + '</strong></button>';
  }

  function selectionPage(type) {
    var isDevice = type === "device";
    var values = isDevice ? ["拯救者游戏本", "ThinkBook 16p", "YOGA Air 14s"] : ["北京", "上海", "深圳"];
    var current = state.serviceContext[type];
    return '<section class="leai-page" data-selection-page="' + type + '"><header class="leai-page-header"><div><p class="leai-page-kicker">服务筛选</p><h1 class="leai-page-title">' + (isDevice ? "选择服务设备" : "选择服务地区") + '</h1><p class="leai-page-desc">选择后返回服务推荐页，不发送新消息。</p></div><span class="leai-status-pill">当前：' + escapeHtml(current) + '</span></header><section class="leai-panel"><div class="leai-selection-list">' + values.map(function (value) { return '<button class="leai-selection-option' + (value === current ? ' is-selected' : '') + '" type="button" data-service-context-option="' + type + '" data-service-context-value="' + value + '"><span><strong>' + value + '</strong><small>' + (value === current ? "当前已选" : "选择并返回服务推荐") + '</small></span><img src="' + icons.next + '" alt=""></button>'; }).join("") + '</div></section></section>';
  }

  function serviceDetailPage(serviceId) {
    var service = findService(serviceId) || serviceCatalog.thermal;
    var device = state.serviceDetailContext[service.id] || serviceDeviceContext(service.id);
    var isWarranty = Boolean(warrantyCatalog[service.id]);
    var guarantees = isWarranty ? [
      ["官方保障", "权益以服务系统实时结果为准"],
      ["保障续接", "生效时间以原保障到期日为准"],
      ["订单预约", "购买后可在订单查看服务权益"]
    ] : [
      ["官方服务", "由联想官方服务体系承接"],
      ["设备校验", "下单前核对型号与服务适用性"],
      ["预约到店", "购买后在订单中选择门店与时间"]
    ];
    return '<section class="leai-page leai-service-detail-page" data-service-detail-page aria-labelledby="leaiServiceDetailTitle"><div class="detail-main"><div class="detail-gallery"><div class="detail-badges"><span class="detail-badge-ai">乐享推荐</span><span class="detail-badge-hot">服务商品</span></div><div class="detail-visual"><img class="detail-product-image" src="' + service.image + '" alt="' + escapeHtml(service.name) + '"></div></div><div class="detail-info"><h1 class="leai-page-title detail-title" id="leaiServiceDetailTitle">' + escapeHtml(service.name) + '</h1><p class="detail-summary">' + escapeHtml(service.description) + '</p><div class="detail-fit-reason"><span><strong>适合你</strong> 已关联' + escapeHtml(device.name) + '，购买前仍会校验设备与服务适用性。<small>由联想乐享 AI 生成 · 仅供参考</small></span></div><div class="detail-tags"><span class="detail-tag">' + escapeHtml(service.tag) + '</span><span class="detail-tag">官方服务</span><span class="detail-tag">购买后预约</span></div><p class="detail-price">' + escapeHtml(service.price) + '</p><div class="detail-actions"><button class="detail-primary" type="button" data-service-buy="' + escapeHtml(service.id) + '">一键领优惠下单</button></div><div class="leai-service-detail-device"><strong>关联设备：' + escapeHtml(device.name) + '</strong><small>' + escapeHtml(device.product) + ' · ' + escapeHtml(device.sn) + '</small></div><div class="detail-service">' + guarantees.map(function (item) { return '<div class="service-item"><strong>' + item[0] + '</strong><span>' + item[1] + '</span></div>'; }).join("") + '</div></div></div><section class="leai-service-detail-section"><h2>服务内容</h2><p>' + escapeHtml(service.description) + '</p></section><section class="leai-service-detail-section"><h2>适用范围</h2><p>' + escapeHtml(service.scope) + '</p></section><section class="leai-service-detail-section"><h2>预约说明</h2><p>下单后可在订单中预约服务；实际门店、时间、价格与履约结果以服务系统及微信小程序回执为准。</p></section><p class="leai-member-disclaimer">当前服务商品、关联设备、价格与适用性均为 Mock 评审数据，请在购买前核对关键信息。</p></section>';
  }

  function appointmentCodePage() {
    var order = state.serviceOrder;
    if (!order) return '<section class="leai-page" data-appointment-code-page><header class="leai-page-header"><div><p class="leai-page-kicker">服务履约</p><h1 class="leai-page-title">预约服务</h1><p class="leai-page-desc">暂无可预约的服务订单。</p></div></header></section>';
    return '<section class="leai-page" data-appointment-code-page aria-labelledby="leaiAppointmentTitle"><header class="leai-page-header"><div><p class="leai-page-kicker">微信小程序衔接</p><h1 class="leai-page-title" id="leaiAppointmentTitle">微信扫码预约服务</h1><p class="leai-page-desc">打开微信扫一扫，进入联想服务小程序后选择门店与时间。</p></div><span class="leai-status-pill">订单待预约</span></header><section class="leai-panel"><div class="leai-wechat-handoff"><div class="leai-wechat-code" role="img" aria-label="微信小程序太阳码演示图"><div class="leai-wechat-code-grid">' + mockSunCodeCells() + '</div><span class="leai-wechat-code-mark"><img src="' + icons.membership + '" alt=""></span></div><div class="leai-wechat-guide"><strong>打开微信扫一扫</strong><p>扫描太阳码进入联想服务小程序，在订单中继续选择服务门店与预约时段。</p><dl><div><dt>服务订单</dt><dd>' + escapeHtml(order.orderId) + '</dd></div><div><dt>服务商品</dt><dd>' + escapeHtml(order.name) + '</dd></div><div><dt>服务设备</dt><dd>' + escapeHtml(order.device) + ' · ' + escapeHtml(order.sn) + '</dd></div></dl></div></div><p class="leai-member-disclaimer">演示太阳码，仅用于交互评审，当前不可真实扫描或预约；实际结果以微信小程序和履约服务回执为准。</p></section></section>';
  }

  function memberDevicesSection() {
    var keys = orderedDeviceKeys();
    var previewKeys = keys.slice(0, state.pendingDeviceBound ? devicePreviewLimit : devicePreviewLimit - 1);
    var pending = state.pendingDeviceBound ? "" : pendingDeviceCard();
    return '<section class="leai-panel leai-member-devices" id="leaiMemberDevices" data-member-devices><div class="leai-panel-head"><div><h2 class="leai-panel-title">我的设备</h2><p>' + keys.length + ' 台已绑定 · 1 台待绑定</p></div><div class="leai-device-section-actions"><button class="leai-secondary" type="button" data-device-add>绑定新设备 <span aria-hidden="true">+</span></button></div></div>' +
      '<div class="leai-device-browser"><button class="leai-device-nav is-previous" type="button" data-device-scroll="-1" aria-label="浏览上一组设备" disabled><img src="' + icons.next + '" alt=""></button>' +
      '<div class="leai-device-grid" data-device-track tabindex="0" role="region" aria-label="最近使用的设备，可横向浏览">' + pending + previewKeys.map(function (key) { return memberDeviceCard(deviceCatalog[key]); }).join("") + '</div><button class="leai-device-nav is-next" type="button" data-device-scroll="1" aria-label="浏览下一组设备"><img src="' + icons.next + '" alt=""></button></div>' +
      '</section>';
  }

  function orderedDeviceKeys() {
    var keys = Object.keys(deviceCatalog);
    if (!state.recentDeviceId || keys.indexOf(state.recentDeviceId) < 0) return keys;
    return [state.recentDeviceId].concat(keys.filter(function (key) { return key !== state.recentDeviceId; }));
  }

  function pendingDeviceCard() {
    return '<article class="leai-device-card leai-device-card-pending" data-device-slide data-member-device-pending="xiaoxinpro16"><div class="leai-device-visual"><img src="' + pendingPurchasedDevice.image + '" alt=""></div><div class="leai-device-body"><div class="leai-device-title-row"><h3>' + pendingPurchasedDevice.name + '</h3><em class="leai-device-status-tag is-pending">已购买·待绑定</em></div><dl><div><dt>购买时间</dt><dd>' + pendingPurchasedDevice.purchased + '</dd></div></dl><div class="leai-device-card-actions"><button class="leai-primary" type="button" data-device-bind-purchased>一键绑定</button></div></div></article>';
  }

  function memberDeviceCard(device) {
    return '<article class="leai-device-card" data-device-slide data-member-device="' + device.id + '"><div class="leai-device-visual"><img src="' + device.image + '" alt=""></div><div class="leai-device-body"><div class="leai-device-title-row"><h3>' + escapeHtml(device.name) + '</h3><span class="leai-device-status-tag' + (device.service === "保障中" ? ' is-covered' : '') + '">' + escapeHtml(device.service) + '</span></div><dl><div><dt>设备编号</dt><dd>' + escapeHtml(device.sn) + '</dd></div><div><dt>保障</dt><dd>' + escapeHtml(device.warranty.replace("基础保修至 ", "至 ")) + '</dd></div></dl><div class="leai-device-card-actions"><button class="leai-secondary" type="button" data-device-detail="' + device.id + '">查看详情</button>' + (device.extensionEligible ? '<button class="leai-primary" type="button" data-device-warranty="' + device.id + '">推荐延保方案</button>' : '') + '</div></div></article>';
  }

  function deviceRangeLabel(first, last) {
    var total = Object.keys(deviceCatalog).length;
    return "当前 " + first + "–" + last + " / " + total;
  }

  function pendingDeviceListRow() {
    return '<article class="leai-device-list-row is-pending" data-device-list-item data-member-device-pending="' + pendingPurchasedDevice.id + '"><img src="' + pendingPurchasedDevice.image + '" alt=""><span class="leai-device-list-copy"><small>已识别官方订单 · 待绑定</small><strong>' + pendingPurchasedDevice.name + '</strong><em>' + pendingPurchasedDevice.product + ' · ' + pendingPurchasedDevice.sn + '</em></span><span class="leai-device-row-warranty"><small>购买于</small><strong>' + pendingPurchasedDevice.purchased + '</strong></span><span class="leai-device-row-actions"><button class="leai-primary" type="button" data-device-bind-purchased>一键绑定</button></span></article>';
  }

  function memberDeviceListRow(device){return window.__p0Modules.invoke("pages/device-list#memberDeviceListRow:1f681012d610f9029463277b",{get ["escapeHtml"](){return escapeHtml}},this,arguments);}

  function personalIdentityTrack() {
    return '<section class="leai-identity-card leai-identity-track leai-personal-track" data-identity-card="personal-member" data-identity-track="personal" data-membership-system="personal"><div class="leai-identity-track-head"><span class="leai-member-level-title"><strong>铂金会员</strong></span><em>已生效</em></div><div class="leai-growth-journey"><div><span>铂金</span><span>钻石</span></div><i></i></div><div class="leai-growth-meta"><span>成长值 3,680 / 10,000</span><span>还差 6,320 成长值</span></div><p class="leai-growth-unlocks"><span class="leai-growth-unlock-label"><img src="' + icons.crown + '" alt="">升级可获得</span><span class="leai-growth-unlock-item"><img src="' + icons.rewards + '" alt="">新品优先购</span><span class="leai-growth-unlock-item"><img src="' + icons.referrals + '" alt="">延保专享</span><span class="leai-growth-unlock-item"><img src="' + icons.support + '" alt="">专属客服</span></p></section>';
  }

  function educationIdentityTrack() {
    syncStudentAuthState();
    var status = state.identityStatus.student;
    var reviewing = status === "reviewing";
    var verified = status === "verified";
    var title = verified ? "教育特惠" : reviewing ? "认证审核中" : "教育特惠";
    var description = verified ? "教育专享价与活动资格已生效" : reviewing ? (state.educationPath ? state.educationPath + "申请已提交，预计 1–3 个工作日完成" : "申请已提交，预计 1–3 个工作日完成") : "认证后解锁教育特惠";
    var action = verified ? '<div class="leai-education-actions"><a class="leai-secondary" href="' + educationHomeUrl + '" target="_blank" rel="noopener noreferrer" data-education-home>教育优惠活动主页</a><button class="leai-primary" type="button" data-education-recommend>推荐教育优惠商品</button></div>' : reviewing ? '<button class="leai-identity-track-action is-reviewing" type="button" disabled aria-disabled="true">认证审核中</button>' : identityTrackAction("student", "办理学生认证", "");
    return '<section class="leai-identity-card leai-identity-track leai-education-track is-' + status + '" data-identity-track="education" data-identity-card="student" data-identity-status="' + status + '"><div class="leai-education-title-line"><h3>' + title + '</h3><em>' + (verified ? "已认证" : reviewing ? "认证中" : "未认证") + '</em></div><p>' + description + '</p>' + action + '</section>';
  }

  function identityTrackAction(type, title, className) {
    return '<button class="leai-identity-track-action' + (className ? " " + className : "") + '" type="button" data-member-task="' + type + '">' + title + ' <img src="' + icons.next + '" alt=""></button>';
  }

  function memberAssetButton(type, value, unit, label, description) {
    var content = '<span>' + label + '<i aria-hidden="true">›</i></span><strong><b>' + value + '</b>' + (unit ? '<em>' + unit + '</em>' : '') + '</strong>';
    if (type === "benefitpoints") return '<a class="leai-member-asset" href="' + benefitPointsUrl + '" target="_blank" rel="noopener noreferrer">' + content + '</a>';
    return '<button class="leai-member-asset" type="button" data-member-asset="' + type + '">' + content + '</button>';
  }

  function memberBenefitItem(title, description) {
    return '<article class="leai-locked-benefit"><strong>' + title + '</strong><span>' + description + '</span></article>';
  }

  function benefitTooltip(key, icon, title, description, tooltip) {
    return '<button class="leai-benefit leai-tooltip-trigger" type="button" data-benefit-slide data-member-benefit="' + key + '" data-tooltip="' + key + '" aria-expanded="false"><span class="leai-benefit-icon"><img src="' + icon + '" alt=""></span><strong>' + title + '</strong><small>' + description + '</small><span class="leai-tooltip leai-benefit-detail-tooltip" role="tooltip" aria-hidden="true"><strong>' + title + '</strong><span>' + description + '</span><small>' + tooltip + '</small></span></button>';
  }

  function memberTaskButton(type, title, description) {
    return '<button class="leai-task-button" type="button" data-member-task="' + type + '"><span><strong>' + title + '</strong><small>' + description + '</small></span><img src="' + icons.next + '" alt=""></button>';
  }

  function servicePage() {
    if (state.serviceMode === "warranty") return warrantyServicePage();
    return '<section class="leai-page" data-member-service-page aria-labelledby="leaiServiceTitle">' + recommendationBrief("拯救者游戏本") +
      '<div class="leai-service-list" aria-label="推荐服务商品列表">' +
      serviceCard(serviceCatalog.clean, false, 1) + serviceCard(serviceCatalog.thermal, false, 2) + serviceCard(serviceCatalog.care, false, 3) +
      '</div><p class="leai-member-disclaimer">推荐由联想乐享基于当前 Mock 设备与地区条件生成；价格、适用性、库存与履约范围以服务商品详情页和结算页为准。</p>' +
      compareBar() + '</section>';
  }

  function warrantyServicePage() {
    var device = deviceCatalog[state.serviceDeviceId] || deviceCatalog.legiony7000p;
    var services = Object.keys(warrantyCatalog).map(function (key, index) { return serviceCard(warrantyCatalog[key], true, index + 1); }).join("");
    return '<section class="leai-page leai-warranty-page" data-member-service-page data-warranty-service-page aria-labelledby="leaiServiceTitle">' + warrantyRecommendationBrief(device) +
      '<div class="leai-service-list" aria-label="推荐延保服务商品列表">' + services + '</div><p class="leai-member-disclaimer">具体可购买性、价格与服务范围以服务商品系统实时校验结果为准。</p>' + compareBar() + '</section>';
  }

  function warrantyRecommendationBrief(device) {
    var eligibleKeys = orderedDeviceKeys().filter(function (key) { return Boolean(deviceCatalog[key].extensionEligible); });
    var options = eligibleKeys.map(function (key) {
      return warrantyDeviceOption(deviceCatalog[key], device.id === key);
    }).join("");
    var eligibleCount = Number(window.__lxWarrantyEligibleDeviceCount || eligibleKeys.length);
    var pickerActions = '<div class="leai-warranty-device-actions"><button type="button" data-warranty-open-devices>管理我的设备</button><button type="button" data-warranty-bind-device>绑定新设备</button></div>';
    var deviceControl = eligibleCount > 1 ? '<div class="leai-warranty-device-selector"><button class="leai-associated-device leai-warranty-device-trigger" type="button" data-warranty-device-trigger aria-expanded="' + state.warrantyDevicePickerOpen + '" aria-controls="leaiWarrantyDeviceOptions"><span>适用设备：' + escapeHtml(device.name) + ' · ' + escapeHtml(device.sn) + '</span><img src="' + icons.expand + '" alt=""></button>' + (state.warrantyDevicePickerOpen ? '<div class="leai-warranty-device-options" id="leaiWarrantyDeviceOptions" role="listbox" aria-label="选择适用设备">' + options + pickerActions + '</div>' : "") + '</div>' : '<div class="leai-warranty-single-device"><p class="leai-associated-device" data-warranty-single-device>适用设备：' + escapeHtml(device.name) + ' · ' + escapeHtml(device.sn) + '</p>' + pickerActions + '</div>';
    return '<header class="leai-recommendation-brief leai-warranty-brief"><div><h1 class="leai-page-title" id="leaiServiceTitle">延保服务推荐</h1><p>已根据设备型号、购买时间和保障节点完成适用性筛选。</p></div>' + deviceControl + '</header>';
  }

  function warrantyDeviceOption(device, selected) {
    return '<button class="leai-warranty-device-card' + (selected ? ' is-selected' : '') + '" type="button" role="option" data-warranty-device-option="' + device.id + '" aria-selected="' + selected + '"><img src="' + device.image + '" alt=""><span><strong>' + escapeHtml(device.name) + '</strong><small>' + escapeHtml(device.product) + ' · ' + escapeHtml(device.sn) + '</small><em>' + escapeHtml(device.warranty) + '</em></span><b>' + escapeHtml(device.maintenanceReason || "保障节点推荐") + '</b></button>';
  }

  function recommendationBrief(deviceName) {
    return '<header class="leai-recommendation-brief"><h1 class="leai-page-title" id="leaiServiceTitle">乐享推荐</h1><p class="leai-associated-device">关联设备：' + escapeHtml(deviceName) + '</p></header>';
  }

  function serviceCard(service, isWarranty, index) {
    var selected = state.serviceCompare.indexOf(service.id) >= 0;
    var recommended = state.serviceRecommended === service.id;
    return '<article class="reco-row' + (recommended ? " is-recommended" : "") + '" data-service-id="' + service.id + '"' + (isWarranty ? ' data-warranty-service' : '') + '><img src="' + service.image + '" alt=""><div class="reco-row-main"><div class="leai-service-labels"><button class="leai-service-tag leai-tooltip-trigger" type="button" data-tooltip-trigger><span>' + service.tag + '</span><span class="leai-tooltip" role="tooltip">' + service.scope + '</span></button>' + (recommended ? '<span class="leai-recommended-badge">乐享推荐</span>' : "") + '</div><h2>' + service.name + '</h2><p class="reco-row-desc">' + service.description + '</p><button class="leai-service-compare-link" type="button" data-service-compare="' + service.id + '" aria-pressed="' + selected + '">' + (selected ? "已加入比较" : "加入比较") + '</button></div><div class="reco-row-side"><div class="reco-row-actions"><strong class="reco-row-price">' + service.price + '</strong><button class="lx-p0-btn primary" type="button" data-service-buy="' + service.id + '">立即购买</button></div></div></article>';
  }

  function serviceOrdersPage() {
    var order = state.serviceOrder;
    if (!order) return '<section class="leai-page leai-orders-page"><div class="lx-orders-wrap"><div class="ohead"><h2><span class="bar"></span>我的订单</h2><span class="cnt">共 0 笔订单</span></div><section class="leai-order-empty"><strong>暂无服务订单</strong><p>购买服务商品后，可从这里继续预约和查看履约状态。</p></section></div></section>';
    return '<section class="leai-page leai-orders-page" aria-labelledby="leaiOrdersTitle"><div class="lx-orders-wrap"><div class="ohead"><h2 id="leaiOrdersTitle"><span class="bar"></span>我的订单</h2><span class="cnt">共 1 笔订单</span></div><div class="ol lx-order-skin"><article class="ord" data-service-order><div class="shot"><img src="' + order.image + '" alt=""></div><div class="mid"><div class="pn"><span class="nm">' + escapeHtml(order.name) + '</span><span class="ost done"><span class="d"></span>' + escapeHtml(order.status) + '</span></div><div class="meta"><span>服务订单</span><span class="sn">' + escapeHtml(order.orderId) + '</span><span class="dot"></span><span>' + escapeHtml(order.createdAt) + '</span><span class="amt">' + escapeHtml(order.price) + '</span></div><div class="recv">设备：' + escapeHtml(order.device) + ' · ' + escapeHtml(order.sn) + '　预约门店与时段请前往微信小程序选择</div></div><div class="acts"><button class="obtn order-ghost" type="button" data-service-detail="' + escapeHtml(state.serviceSelectedId) + '">订单详情</button><button class="obtn solid" type="button" data-service-order-appointment>预约服务</button></div><span class="leai-order-sync" data-service-status="purchase">' + escapeHtml(state.servicePurchaseStatus) + '</span></article></div><p class="leai-member-disclaimer">当前订单号、价格和状态均为 Mock 演示数据；预约入口仅展示渠道衔接，实际订单与履约结果以服务系统和微信小程序回执为准。</p></div></section>';
  }

  function compareBar() {
    var visible = state.serviceCompare.length > 0;
    var items = state.serviceCompare.map(function (id) {
      var service = findService(id);
      return '<span class="leai-compare-item" data-compare-item><span>' + service.name + '</span><button type="button" data-compare-remove="' + id + '" aria-label="移除' + service.name + '">移除</button></span>';
    }).join("");
    return '<aside class="leai-compare-bar' + (visible ? " is-visible" : "") + '" id="leaiCompareBar" aria-live="polite"><div><strong>服务比较</strong><span>' + state.serviceCompare.length + '/2</span></div><div class="leai-compare-items">' + items + '</div><div class="leai-compare-actions"><button class="leai-secondary" type="button" data-compare-clear>清空</button><button class="leai-primary" type="button" data-service-task="recommend"' + (state.serviceCompare.length < 2 ? " disabled" : "") + '>让乐享帮我选</button></div></aside>';
  }

  function findService(id) {
    return serviceCatalog[id] || warrantyCatalog[id] || null;
  }

  function toggleLab(open) { var lab = el("#leaiLab"); lab.classList.toggle("is-open", open); lab.setAttribute("aria-hidden", open ? "false" : "true"); }

  function resetConversation() {
    closeRightView(true);
    el("#leaiThread").innerHTML = "";
    document.body.dataset.state = "default";
    el(".assistant-panel .default-state").style.display = "block";
    el(".assistant-panel .chat-state").style.display = "none";
    hideSug();
  }

  function prefersReduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function delay(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  function nextFrame() { return new Promise(function (resolve) { window.requestAnimationFrame(function () { window.requestAnimationFrame(resolve); }); }); }

  function memberEventBelongsHere(event) {
    if (!embeddedHost || !event || !event.target) return false;
    var modal = document.querySelector("#leaiModal");
    return embeddedHost.contains(event.target) || Boolean(modal && modal.contains(event.target));
  }

  function installDemoPanel() {
    if (!document.body) return false;
    if (!document.querySelector("#leaiLab")) document.body.insertAdjacentHTML("beforeend", labHtml());
    if (!labListenersBound) {
      labListenersBound = true;
      document.addEventListener("click", function (event) {
        if (event.target.closest("#leaiLabTrigger, #leaiLab")) handleClick(event);
      }, true);
    }
    return true;
  }

  function bindTransientScrollbar(container) {
    if (!container || container.dataset.lxTransientScrollbarBound === "true") return;
    container.dataset.lxTransientScrollbarBound = "true";
    container.addEventListener("scroll", function () {
      if (container.scrollHeight <= container.clientHeight + 1) {
        container.classList.remove("is-scroll-active");
        return;
      }
      container.classList.add("is-scroll-active");
      window.clearTimeout(container.__lxScrollbarTimer);
      container.__lxScrollbarTimer = window.setTimeout(function () {
        container.classList.remove("is-scroll-active");
      }, 700);
    }, { passive: true });
  }

  function bindEmbeddedListeners() {
    if (embeddedListenersBound) return;
    embeddedListenersBound = true;
    document.addEventListener("click", function (event) {
      if (memberEventBelongsHere(event)) handleClick(event);
    }, true);
    document.addEventListener("keydown", function (event) {
      if (memberEventBelongsHere(event) || event.key === "Escape") handleKeydown(event);
    });
    document.addEventListener("change", function (event) {
      if (memberEventBelongsHere(event)) handlePageChange(event);
    }, true);
    document.addEventListener("submit", function (event) {
      if (memberEventBelongsHere(event)) handlePageSubmit(event);
    });
    window.addEventListener("storage", function (event) {
      if (event.key === studentAuthStorageKey) refreshStudentAuthState();
    });
    window.addEventListener("focus", refreshStudentAuthState);
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var payload = event.data;
      if (!payload) return;
      if (payload.type === "lexiang:device-bind-success" && payload.deviceId === pendingPurchasedDevice.id) {
        completePurchasedDeviceBindTransition();
      }
    });
  }

  function mountMemberComponent(host, view, options) {
    if (!host) return false;
    syncStudentAuthState();
    embeddedHost = host;
    embeddedHost.id = "leaiAuiView";
    embeddedHost.classList.add("leai-aui-view", "leai-aui-embedded");
    embeddedHost.hidden = false;
    if (view === "service" && window.__lxPendingWarrantyDeviceId) {
      state.serviceMode = "warranty";
      state.serviceDeviceId = window.__lxPendingWarrantyDeviceId;
      state.warrantyDevicePickerOpen = false;
      state.serviceCompare = [];
      state.serviceRecommended = "warrantyYear1";
    }
    if (!document.querySelector("#leaiModal")) document.body.insertAdjacentHTML("beforeend", modalHtml());
    installDemoPanel();
    bindEmbeddedListeners();
    window.__lxCompleteDeviceBind = completePurchasedDeviceBindTransition;
    bindTransientScrollbar(embeddedHost);
    bindTransientScrollbar(document.querySelector(".assistant-panel .chat-state"));
    state.rightTabs = [view];
    state.rightView = view;
    state.rightViewDisplayMode = {};
    state.rightViewDisplayMode[view] = options && options.displayMode ? options.displayMode : "secondary";
    embeddedHost.innerHTML = rightViewHtml(view);
    embeddedHost.scrollTop = 0;
    if (view === "member" || view === "devices") setupDeviceBrowser(0);
    if (view === "member") setupBenefitBrowser(0);
    return true;
  }

  window.LXMemberService = Object.freeze({
    mount: mountMemberComponent,
    installDemoPanel: installDemoPanel,
    openDeviceBind: function (trigger) { openModal("deviceBind", trigger); },
    completeCheckin: function () {
      if (state.memberCheckedIn) return false;
      state.memberCheckedIn = true;
      if (state.rightView === "member") refreshRightView();
      return true;
    },
    version: "20260827-checkin-chat-v7"
  });
})();

};

/* Business: as */
window.__p0Modules.factories["pages/member-center#as:834c820d92f63db68f50ee1b"]=function(__p0Scope){"use strict";return (function as(){"business"===__p0Scope.d.page||"enterprise"===__p0Scope.d.page?(0,__p0Scope.Zt)("member","会员中心",`<style>\n              .content[data-view="info"]:has(.lx-enterprise-member-center){display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;height:100%!important;min-height:0!important;overflow:hidden!important;padding-bottom:0!important}\n              .content[data-view="info"]:has(.lx-enterprise-member-center)>.lx-tabbar{grid-row:1!important;position:relative!important;top:auto!important;min-height:0!important}\n              .content[data-view="info"] .info-page:has(.lx-enterprise-member-center){display:block!important;grid-row:2!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;max-height:100%!important;padding:0!important;margin:0!important;overflow-x:hidden!important;overflow-y:scroll!important;overscroll-behavior:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;touch-action:pan-y}\n              .content[data-view="info"] .info-page:has(.lx-enterprise-member-center)::before,.content[data-view="info"] .info-page:has(.lx-enterprise-member-center)::after{display:none!important;content:none!important}\n              .lx-enterprise-member-center{width:100%!important;min-height:max-content;box-sizing:border-box}\n            </style><div class="lx-enterprise-member-center">${(0,__p0Scope.Nn)()}${(0,__p0Scope.Pn)()}</div>`):(0,__p0Scope.Qt)("member","会员中心","member","secondary")}); };
}
window.__p0Modules.dispatch(document.currentScript);

// 品牌页卡片「乐享摘要」：点击带 data-lx-brand-query 的新闻/案例卡，原外链照常在新标签打开，
// 同时左侧对话发出该 query，回答为预置摘要（不经后端）。
// 挂在 app.js 既有的 __lxArrivalNotice 拦截点上（xn 先画用户气泡再调 matches/run），不改 app.js 产物。
// 本脚本必须先于 p0-brand-core-4（内含 arrival-notice-flow-v1 + app.js）加载。
(function (w) {
  'use strict';
  if (!w || w.__lxBrandSummaryLoaded) return;
  w.__lxBrandSummaryLoaded = true;

  const SUMMARY = {
    '联想乐享×千问，围绕四大场景提供AI主动服务 内容摘要':
      '8 月 10 日，联想自研企业超级智能体 “联想乐享” 登陆千问开放平台，实现从品牌私域向公域 AI 生态拓展。用户可在千问唤醒智能体，以对话形式完成咨询、比价、领券、下单闭环服务。\n\n' +
      '双方聚焦四大核心场景，面向多类客户提供 7×24 小时智能服务。未来将围绕线上线下一体化、全链路 AI 购物等方向迭代，探索多模态交互能力。\n\n' +
      '联想乐享 4.0 已对接二十余个业务系统，月活超 700 万，带动销售额超 50 亿元，推动 AI 赋能实体消费升级。',
    '打造卓越HPC平台，联想携手吉利汽车展开绿色创新 案例摘要':
      '吉利汽车研发原有公有云 HPC 平台，随车型迭代出现负载复杂、成本高企问题，选用联想建设本地化 HPC 平台。联想提供交钥匙方案，部署服务器、存储硬件，搭配 Neptune 液冷技术，PUE 达 1.1。新平台整体计算性能提升 35%，年节电 100 万千瓦时，支撑 CAE 仿真，助力电机、自动驾驶等汽车研发，配套五年硬件保修与两年现场技术支持服务。'
  };
  const key = q => String(q || '').trim().replace(/[。！!]$/, '');

  // ponytail: app.js 只把内部函数交给 __lxInstallArrivalNotice；这里在它被赋值/调用时截获同一份 api，
  // 再给 __lxArrivalNotice 追加两条摘要 query。若日后 app.js 暴露通用 query 钩子，改挂那里。
  let api = null, real = null;
  Object.defineProperty(w, '__lxInstallArrivalNotice', {
    configurable: true, enumerable: true,
    get() { return function (a) { api = a; const r = typeof real === 'function' ? real.apply(this, arguments) : undefined; patch(); return r; }; },
    set(fn) { real = fn; }
  });
  function patch() {
    const base = w.__lxArrivalNotice || { matches: () => false, run: async () => {} };
    w.__lxArrivalNotice = {
      matches: q => !!SUMMARY[key(q)] || base.matches(q),
      run: q => SUMMARY[key(q)] ? runSummary(SUMMARY[key(q)]) : base.run(q)
    };
  }
  async function runSummary(text) {
    const { d, ot, nt, ye, ke, Ne, Uo, xe } = api;
    const nonce = d.conversationNonce;
    d.sending = true; ot(); nt();
    const reply = ye('ai loading', '', ke(['正在整理内容摘要'], { collapsed: false, foldable: false, skillCount: 0 }));
    try {
      reply._raw = text;
      await Ne(reply, Uo(text));
      xe().scrollTop = xe().scrollHeight;
    } finally {
      if (nonce === d.conversationNonce) {
        d.sending = false; ot(); nt();
        try { w.__lxSaveConversationNow && w.__lxSaveConversationNow(); } catch (_) {}
      }
    }
  }

  // 不 preventDefault：外链跳转逻辑不变，只是顺带把 query 发到左侧。
  document.addEventListener('click', event => {
    const card = event.target.closest('.lxbrand-card[data-lx-brand-query]');
    if (!card || !w.__lxBridge || w.__lxState?.sending) return;
    w.__lxBridge.sendChat(card.dataset.lxBrandQuery);
  });
})(typeof window === 'undefined' ? null : window);

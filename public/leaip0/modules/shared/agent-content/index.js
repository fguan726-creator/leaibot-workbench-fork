/* 智能体生成内容 — P0 business implementations. */
if (!window.__p0Modules.installed["shared/agent-content"]) {
window.__p0Modules.installed["shared/agent-content"]=true;

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/app-intent.industry-v114.js */
window.__p0Modules.sources["u477664e569dd9618"]=function(){
// ── 乐享意图路由共享模块（app.js 拆分第一步）────────────────────────────────
// 主面板 IIFE 与 lxfd 全屏 IIFE 之前各维护一份本地快路径正则，改一处漏一处、还会漂移
// （全屏那份曾缺 close_other_tabs / 门店导航词）。统一收口到这里：
//   window.__lxIntent.matchControl(text) → {op, target, msg} | null   本地 0ms 秒判
//   window.__lxIntent.parseOrdinal / parseOrdinals                    序号解析
//   window.__lxIntent.opNames                                          后端意图确认话术
// 加载顺序：必须在 app.js 之前（index.html 里 script 排前面）。
(function (root) {
  "use strict";

  // 序号解析：第一/二/三…/N 个。序号必须有明确标志，严防金额/规格数字误判。范围 1-20。
  const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  function parseOrdinal(text) {
    const t = String(text || "");
    const isAmount = (numStr, idx) => {
      const after = t.slice(idx + numStr.length, idx + numStr.length + 4);
      return /^(元|块|万|千|价|G|GB|TB|寸|英寸|Hz|年|月|号机|%|度)/.test(after) || /到\d/.test(t.slice(idx, idx + numStr.length + 6));
    };
    let m = t.match(/第\s*(\d{1,2})\s*(个|款|台|件|号)?/);
    if (m && !isAmount(m[1], m.index + (m[0].indexOf(m[1])))) { const n = Number(m[1]); if (n >= 1 && n <= 20) return n; }
    m = t.match(/(?:^|[^\d.])(\d{1,2})\s*(个|款|台|件)(?![\d元])/);
    if (m) { const n = Number(m[1]); const idx = t.indexOf(m[1], m.index); if (!isAmount(m[1], idx) && n >= 1 && n <= 20) return n; }
    const cn = t.match(/第\s*([一二两三四五六七八九十]+)\s*(个|款|台|件)?/);
    if (cn) {
      const s = cn[1];
      let n = null;
      if (s === "十") n = 10;
      else if (s.length === 1) n = CN_NUM[s] || null;
      else if (s[0] === "十") n = 10 + (CN_NUM[s[1]] || 0);
      else if (s[1] === "十") n = (CN_NUM[s[0]] || 0) * 10 + (CN_NUM[s[2]] || 0);
      if (n && n >= 1 && n <= 20) return n;
    }
    return null;
  }

  // 多序号（对比场景）：「1 2 3」「第一个第二个第三个」「1和3」。连写「123」逐位拆；「两款」是量词不算。
  function parseOrdinals(text) {
    const t = String(text || "");
    const nums = [];
    const push = (n) => { if (n >= 1 && n <= 20 && !nums.includes(n)) nums.push(n); };
    const cnMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const cnRe = /第?\s*([一二三四五六七八九十])\s*(?:个|款|台|件)?/g;
    let m;
    while ((m = cnRe.exec(t))) push(cnMap[m[1]] || 0);
    const arRe = /(\d{1,2})/g;
    while ((m = arRe.exec(t))) {
      const numStr = m[1];
      const after = t.slice(m.index + numStr.length, m.index + numStr.length + 3);
      if (/^(元|块|万|千|价|G|GB|TB|寸|Hz|年|月|%|度|k|K|W)/i.test(after)) continue;
      if (/^[,，]\d/.test(after)) continue; // 千分位（8,000）的首位不是序号
      if (numStr.length === 2 && !/^(个|款|台|件)/.test(after) && t[m.index - 1] !== "第") {
        numStr.split("").forEach((d) => push(Number(d)));
      } else {
        push(Number(numStr));
      }
    }
    return nums;
  }

  // 方案列表意图优先于商品推荐；方案详情、对比和售后服务保留原有入口。
  function matchSolution(text) {
    const value = String(text || "").trim().replace(/\s+/g, "");
    if (!value || value.length > 160 || !/方案/.test(value)) return null;
    if (/(?:不要|不用|无需|不想|别|取消|停止|关闭|删除)(?:再|继续|帮我|给我|为我|打开|查看|看|推荐|查找|提供|这些|这个|全部|所有|的){0,5}(?:解决方案|方案)/.test(value)) return null;
    if (/延保|保修|维修|清灰|换硅脂|退货|退款|售后|支付|分期|优惠|补贴|认证|黑屏|蓝屏|死机|报错|无法开机|开不了机/.test(value)) return null;
    if (/详情|详细|解读|介绍|白皮书|引用|对比|比较|多少钱|怎么购买|第[一二三四五六七八九十\d]+[个款]?方案/.test(value)) return null;
    const catalog = /解决方案|行业方案|方案(?:推荐|列表|清单|全集|中心|大全|库)|(?:全部|全集|所有|数字化|信息化|智能化|智慧|企业|行业)(?:的)?方案/.test(value);
    const browse = /(?:推荐|查找|搜索|查|找|查看|看看|看|打开|浏览|提供|给我|来).{0,30}方案|方案.{0,20}(?:推荐|有哪些|有什么|看看|列表|清单|全集)/.test(value);
    if (!catalog && !browse && !/^方案[。！!？?吧呢]*$/.test(value)) return null;
    const industry = root.__lxIndustrySolutions?.detect(value) || "";
    return { op: "open_solution", industry, target: industry,
      msg: industry ? "已为你汇总" + industry + "行业解决方案。" : "我已为你汇总乐享全集解决方案，覆盖八大行业。" };
  }

  // 本地快路径：高频明确操作指令 0 延迟秒回，不调后端。顺序有讲究：更具体的先判。
  function matchControl(text) {
    const _t = String(text || "").trim();
    const solution = matchSolution(_t);
    if (solution) return solution;
    const industry = root.__lxIndustrySolutions?.detect(_t);
    if (industry) return {op:"open_solution",industry,target:industry,msg:"已为你汇总"+industry+"行业解决方案。"};
    if (!_t || _t.length > 60) return null;
    // 关其他/留当前——必须在 close_all 之前（更具体）
    if (/(关闭?|关掉)(其他|其它|多余|别的|除当前外?的?)(标签|页面|页签)?|只留(当前|这个|一个|一排)|留(当前|这个|一个|一排)(标签|页面)?|关成(剩余|只剩)?一(排|个)|剩(余|下)一(排|个)/.test(_t)) return { op: "close_other_tabs", target: "", msg: "好的，已关闭其他标签，只留当前页面。" };
    if (/^\s*(关闭?|清空)(所有|全部|这些|当前)?(标签|页面|分页|tab|页签)\s*$/i.test(_t) || /(把|将)?(所有|全部)(标签|页面).{0,4}关(掉|闭)/.test(_t)) return { op: "close_all_tabs", target: "", msg: "好的，已为你关闭所有页面标签。" };
    if (/^\s*(进入|开启|切换?到?|变成?|开|恢复|回到?)?全屏(模式|对话|查看)?\s*$|^\s*(放大|沉浸|专注)(模式|对话|查看)?\s*$/.test(_t)) return { op: "enter_fullscreen", target: "", msg: "好的，已切换到全屏对话模式。" };
    if (/^\s*(退出|关闭|取消|结束)(全屏|沉浸|专注)|^\s*(分屏|窗口|缩小)(模式)?\s*$|^\s*恢复(分屏|窗口)(模式)?\s*$|^\s*(打开|展开)(右侧|浏览区|浏览|分屏)(面板)?\s*$|^\s*(右侧|浏览区)(展开|打开)\s*$/.test(_t)) return { op: "exit_fullscreen", target: "", msg: "好的，已展开右侧浏览区。" };
    if (/^\s*(回|返回|去|到)(首页|主页)\s*$/.test(_t)) return { op: "go_home", target: "", msg: "好的，已为你回到首页。" };
    if (/^\s*(打开|查看|看看?|去|进)?(我的)?购物车\s*$/.test(_t)) return { op: "open_cart", target: "", msg: "好的，已为你打开购物车。" };
    if (/^\s*(打开|查看|看看?|去|进)?(我的)?订单(列表|页面|中心)?\s*$/.test(_t)) return { op: "open_orders", target: "", msg: "好的，已为你打开订单页面。" };
    // 高频导航单词秒判（「门店」「会员」这类短词小模型常误判成咨询，不扔给它赌）
    if (/^\s*(打开|查看?|看看?|去|进)?(附近)?(门店|实体店|线下店|体验店|专卖店|服务网点|服务中心)(查询|页面|列表)?\s*$/.test(_t)) return { op: "open_stores", target: "", msg: "好的，已为你打开门店查询。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(我的)?(会员(中心|页面|权益)?|会员卡|乐豆|积分(中心|商城)?)\s*$/.test(_t)) return { op: "open_member", target: "", msg: "好的，已为你打开会员中心。" };
    if (/^\s*(打开|查看?|看看?|领|去|进)?(我的)?(优惠券|领券|券中心|卡券)(中心|页面)?\s*$/.test(_t)) return { op: "open_coupon", target: "", msg: "好的，已为你打开优惠券中心。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(教育(特惠|优惠|认证)?(专区|页面)?|学生(优惠|特惠)(专区)?)\s*$/.test(_t)) return { op: "open_edu_zone", target: "", msg: "好的，已为你打开教育特惠专区。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(全部|全集)?(行业)?解决方案(中心|页面|全集)?\s*$/.test(_t)) return { op: "open_solution", target: "", msg: "我已为你汇总乐享全集解决方案，覆盖八大行业。" };
    if (/^\s*(打开|查看?|看看?|去|进)?(商品)?对比(页|页面|清单)?\s*$/.test(_t)) return { op: "open_compare", target: "", msg: "好的，已为你打开商品对比。" };
    // 切换/打开站点板块（「打开个人及家庭」「进入中小企业」「去政教及大企业」「品牌馆」）——
    // 真机反馈：这类指令原本没有本地意图，掉给官方后回"无法打开页面"。站点词序有讲究：
    // 「大企业/政教/政企」判 enterprise 必须在「企业」判 business 之前（都含"企业"）。
    {
      const siteM = _t.match(/^\s*(帮我?|给我?|我?要|我?想)?\s*(打开|进入|切换到?|切到?|去|到|看看?|查看|回到?)?\s*(个人及?家庭|个人家庭|个人|家庭|中小企业|中小企|政教及?大企业|政教大企业|政教|政企|大企业|品牌馆?|品牌)\s*(板块|页面|专区|频道|站点?)?\s*(吧|呢|哈)?\s*$/);
      if (siteM) {
        const w = siteM[3];
        const page = /政教|政企|大企业/.test(w) ? "enterprise" : /中小企|企业/.test(w) ? "business" : /品牌/.test(w) ? "brand" : "personal";
        const lab = { personal: "个人及家庭", business: "中小企业", enterprise: "政教及大企业", brand: "品牌" }[page];
        return { op: "switch_site", target: page, msg: "好的，正在为你打开" + lab + "。" };
      }
    }
    // 按序号对比：「对比下1 2 3」「把1和3对比一下」——本地取当前列表，不丢给 AI 瞎检索。
    // 收紧（真机语音长句反馈）：①「比较适合我的」这类"比较+形容词"是程度副词不是对比意图；
    // ②对比指令都是短句，长自然句（"我想买…8,000块…玩玩游戏"）里的"一个/8"是量词和价格，
    // 不收紧会被抠成"对比第1、8个"
    if (_t.length <= 24 && /对比|比一?比|比较|哪个好|哪款好/.test(_t) && !/比较(适合|喜欢|中意|在意|看重|倾向)/.test(_t)) {
      const nths = parseOrdinals(_t);
      if (nths.length >= 2) return { op: "compare_nth", target: nths.join(","), msg: "好的，正在为你对比第 " + nths.join("、") + " 个商品。" };
      // 裸对比句（「对比一下吧」「这几款对比下」）：短句无序号 = 对比当前这几款，别丢给官方
      // 反问"您想对比哪两款"（真机反馈）。长句可能带具体型号/条件，仍交给 AI。
      if (_t.length <= 14 && /^(帮我?|给我?|来|就)?(把)?(这几[款个台]|它们|全部|都)?(对比|比较|比一?比)(一下|下|看看)?吧?[!！。]?$/.test(_t)) {
        return { op: "compare_recent", target: "", msg: "好的，正在为你对比当前这几款商品。" };
      }
    }
    // 选第 N 个 + 动作
    const ord = parseOrdinal(_t);
    if (ord && /第|个|款|台|件/.test(_t) && /(下单|购买|买|加购|加入购物车|打开|看)/.test(_t)) {
      const act = /加购|加入购物车/.test(_t) ? "cart" : /(下单|购买|要买|买它|买这|买第|买下|买了)/.test(_t) ? "buy" : /打开|看/.test(_t) ? "open" : "buy";
      const actWord = act === "cart" ? "加入购物车" : act === "open" ? "打开" : "下单";
      return { op: "buy_nth", target: ord + "|" + act, msg: "好的，正在为你" + actWord + "第 " + ord + " 个商品。" };
    }
    // 下单乐享推荐的商品：例如「那就直接下单你推荐的吧」「买乐享推荐那款」「就按推荐下单」
    if (/^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不)).*(你|乐享|系统|AI|ai|刚才|最)?推荐[的得]?(那[个款台件本]?|这[个款台件本]?|商品|机器|电脑)?(.*)?(下单|购买|买|要了|就它|就这[个款台件本]?|直接下单)/.test(_t) || /^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不)).*(下单|购买|买|要了|直接下单).*(你|乐享|系统|AI|ai|刚才|最)?推荐[的得]?/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，正在为你下单乐享推荐商品。" };
    // 「最优款下单吧」「买最好的那款」「你直接帮我下单一个最适合我的吧」：成交词+最X = 下单乐享
    // 最推荐那款，本地闭环不走官方下单 Skill（官方只会回"无法直接下单"话术，真机两轮反馈）。
    // 语序不限（"最优款下单"/"下单最适合的"都算）；带疑问词的是咨询不抢。
    if (_t.length <= 22 && /(下单|购买|买)/.test(_t) && /(最优|最好|最合适|最适合|最值|最推荐)/.test(_t)
        && !/(不下单|别下单|先不|不要|不买|取消|暂不)/.test(_t) && !/什么|哪|吗|怎么|[?？]/.test(_t)) {
      return { op: "buy_recommended", target: "", msg: "好的，正在为你下单最适合你的那款。" };
    }
    // 「领取权益下单」动作 chip（推荐结果页第三个 chip）：领券 + 下单乐享最推荐那款。
    // 复用 buy_recommended（lxBuyWithIntro 本身就是"打开详情→核对优惠→领券下单"三步）。
    if (/^(领取?权益|领券|领(取)?优惠券?)(并|后)?(直接)?(下单|购买|买)吧?[!！。]?$/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，正在为你领取权益并下单推荐款。" };
    // 「就你推荐的这款吧」确认式（无成交动词也算数）：句首"就"+推荐指代 = 选定推荐款下单（真机反馈）
    if (/^(那?就)(你|乐享)?(最)?推荐的?[这那]?[款个台]?(吧|好了|行)?[!！。]?$/.test(_t)) return { op: "buy_recommended", target: "", msg: "好的，就选乐享最推荐的这款，正在为你下单。" };
    // 下单当前正在看的商品（含「这款/这台/这本不错下单吧」口语）
    if (/^(?!.*(不下单|别下单|先不|不要|不买|取消|暂不))\s*((不错|可以|好的?|行|嗯|可|就|这[个款台件本]?|那[个款台件本]?|它|对|我?要|帮我|给我|我?想)[，,、。\s]*)*(下单|购买|下个单|买(这[个款台件本]|它|那[个款台件本])?)(吧|呀|啊|喽|咯)?(?:[，,、。\s].*?(优惠|券|领|结算).*)?$/.test(_t)) return { op: "buy_current", target: "", msg: "好的，正在为你下单当前商品。" };
    return null;
  }

  // 数量意愿：「推荐三款」「来2款」→ 2-6。「第三款」是序号不算。
  // 1 款不在这里（调用方已有"推荐一款→收敛到1"的单品逻辑）。官方固定回5-6款，前端按此截断。
  function parseWantedCount(text) {
    const t = String(text || "");
    const m = t.match(/(?:推荐|介绍|来|给我?|要|选)[^,，。;；]{0,10}?(?<!第)([两二三四五六23456])\s*[款个台]/) ||
              t.match(/(?<!第)([两二三四五六23456])\s*[款个台][^,，。;；]{0,4}(?:推荐|介绍)/);
    if (!m) return null;
    const map = { 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
    const n = map[m[1]] || Number(m[1]);
    return n >= 2 && n <= 6 ? n : null;
  }

  // 后端小模型意图命中后的确认话术（target 由调用方插值）
  const opNames = {
    close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", close_tab: "关闭了该标签",
    go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面",
    open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询",
    open_edu_zone: "打开了教育专区", open_compare: "打开了商品对比", clear_compare: "清空了对比清单",
    start_student_auth: "打开了学生认证", start_enterprise_auth: "打开了企业认证", switch_site: "切换了站点",
    enter_fullscreen: "切换到全屏对话模式", exit_fullscreen: "退出了全屏模式",
    buy_current: "正在为你下单当前商品", buy_recommended: "正在为你下单乐享推荐商品", buy_nth: "正在为你处理所选商品",
  };

  // 全权代买意图（多步任务链入口）：授权乐享自主选并下单。主面板/全屏共用这一份 = 一套机制。
  // 要求含成交动词（下单/买/搞定/拿下），避免误伤"推荐一款"这类纯咨询。
  function matchAutoBuy(text) {
    const t = String(text || "").trim();
    if (!t || t.length > 60) return null;
    // 「就你推荐的这款下单吧」是对既有推荐结果的确认（交给 buy_recommended 本地闭环），
    // 不是发起新的全权代买——对比都做完了再起一条链从头跑官方，观感翻车（真机反馈）
    if (/推荐[的得这那]/.test(t)) return null;
    if (!/(你看着|帮我|随便|你决定|你选)?\s*(选|挑|推荐|来)\s*(一款|一台|个|台)?.*(下单|买了?|购买|拿下)|直接下单吧|帮我搞定/.test(t)) return null;
    // 预算区间：「10000到20000」「1万-2万」按 min~max 双边过滤（之前只取上限，9999 的轻薄本
    // 混进"10000到20000 玩游戏"的候选，观感翻车）；单值仍按上限处理
    const rng = t.match(/(\d{3,6})\s*(?:元|块)?\s*[-~—到至]\s*(\d{3,6})/);
    let minPrice = 0, maxPrice = 0;
    if (rng) { minPrice = Math.min(Number(rng[1]), Number(rng[2])); maxPrice = Math.max(Number(rng[1]), Number(rng[2])); }
    else { const m = t.match(/(\d{3,6})\s*(元|块|以内|以下|左右)?/); maxPrice = m ? Number(m[1]) : 0; }
    return { chain: "auto_buy", params: { maxPrice: maxPrice, minPrice: minPrice, rawText: t } };
  }

  // 系列关键词提取（代买链官方超预算 fallback 用：补本地货盘时按系列词缩小范围，不带 q 就是不限系列）。
  // kw 是发给 /api/products?q= 的实际检索词，需匹配数据库商品名里的写法（中文用中文，英文系列保留常见大小写）。
  const SERIES_KEYWORDS = [
    { re: /拯救者|legion/i, kw: "拯救者" },
    { re: /thinkbook/i, kw: "ThinkBook" },
    { re: /thinkpad/i, kw: "ThinkPad" },
    { re: /小新/, kw: "小新" },
    { re: /yoga/i, kw: "YOGA" },
  ];
  // 场景关键词（没点名系列时的兜底缩圈）：kw 需匹配数据库商品名写法——游戏本商品名普遍含「游戏」
  const SCENE_KEYWORDS = [
    { re: /游戏|电竞|打机|吃鸡|3A/i, kw: "游戏" },
    { re: /轻薄|便携|出差|随身/, kw: "轻薄" },
  ];
  function extractSeriesKeyword(text) {
    const t = String(text || "");
    for (let i = 0; i < SERIES_KEYWORDS.length; i++) {
      if (SERIES_KEYWORDS[i].re.test(t)) return SERIES_KEYWORDS[i].kw;
    }
    for (let i = 0; i < SCENE_KEYWORDS.length; i++) {
      if (SCENE_KEYWORDS[i].re.test(t)) return SCENE_KEYWORDS[i].kw;
    }
    return "";
  }

  // 答后「猜你想干」动作 chips（主面板/全屏共用一份）：生成的句子必须能被 matchControl 本地接住，
  // 点击即执行零等待。LLM 咨询型追问异步补齐，不足 3 个用 FOLLOWUP_FALLBACKS 兜底。
  function actionChips(products) {
    const n = Math.min(Array.isArray(products) ? products.length : 0, 3);
    if (n >= 2) return ["对比第" + Array.from({ length: n }, (_, i) => i + 1).join("、") + "款", "打开第1款", "领取权益下单"];
    if (n === 1) return ["这款不错，下单吧"];
    return [];
  }
  const FOLLOWUP_FALLBACKS = ["现在下单有优惠吗", "线下门店能体验吗", "支持以旧换新吗"];

  // 代买句发给官方前剥掉成交短语（「直接购买/下单吧」会触发官方下单 Skill，只回「已为您生成
  // 订单」不给商品清单）。官方只负责推荐，下单由链自己执行。主面板/全屏共用一份。
  function stripPurchasePhrase(text) {
    const t = String(text || "").replace(/[，,。;；]?\s*(并且?|然后|再)?(帮我)?(挑|选|来|拿|搞定)?一?[款台个]?(比较)?(好的?|合适的?|适合我的)?[的]?[，,]?\s*(直接)?(下单|购买|买了?|拿下|搞定)吧?[!！。]?\s*$/, "").trim();
    return t + "。请推荐几款符合以上条件的商品。";
  }

  const api = { parseOrdinal: parseOrdinal, parseOrdinals: parseOrdinals, matchControl: matchControl, matchSolution: matchSolution, opNames: opNames, parseWantedCount: parseWantedCount, matchAutoBuy: matchAutoBuy, extractSeriesKeyword: extractSeriesKeyword, actionChips: actionChips, FOLLOWUP_FALLBACKS: FOLLOWUP_FALLBACKS, stripPurchasePhrase: stripPurchasePhrase };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // node 单测用
  if (root) {
    root.__lxIntent = api;
    // 兼容旧挂载名（历史代码引用）
    root.__lxParseOrdinal = parseOrdinal;
    root.__lxParseOrdinals = parseOrdinals;
  }
})(typeof window !== "undefined" ? window : null);

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/app-conv.js */
window.__p0Modules.sources["uf3195eadf93530ba"]=function(){
// ── 乐享对话持久化模块（app.js 拆分第三步）──────────────────────────────────
// 保存/恢复主面板对话到 localStorage（lexiang.conversation.v1），供刷新与切站恢复。
// 该域闭包依赖重（state/ensureChat/addMessage/mdLite），采用工厂注入：
//   app.js 里 `window.__lxConvFactory({...deps})` 拿到 {save, saveNow, restore}。
// 加载顺序：必须在 app.js 之前（app.js 初始化时调工厂）。
// 注意：首页 lxfd 的 lxfdSyncToMainConvKey（app-lxfd.js）也直写同一 key，格式须保持一致。
(function (root) {
  "use strict";
  const LX_CONV_KEY = "lexiang.conversation.v1";
  const LX_NEW_CHAT_EMPTY_KEY = "lexiang.newChatEmpty.v1";

  function createConv(deps) {
    const getState = deps.getState;         // () => state（convId 读写）
    const ensureChat = deps.ensureChat;     // () => .lx-p0-messages 容器
    const addMessage = deps.addMessage;     // (role, text) 渲染用户气泡
    const lxEnsureAiBody = deps.lxEnsureAiBody;
    const mdLite = deps.mdLite;
    let saveTimer = null;

    // 立即写（不防抖）——桥接退全屏后可能马上切站，防抖 timer 会被页面卸载吞掉
    function doSave() {
      try {
        // 新建对话后的欢迎空态必须跨刷新保持；拒绝 pagehide 把旧 DOM 写回来。
        if (localStorage.getItem(LX_NEW_CHAT_EMPTY_KEY) === "1") {
          localStorage.removeItem(LX_CONV_KEY);
          return;
        }
        const listEl = document.querySelector(".chat-state .lx-p0-messages");
        if (!listEl) return;
        const messages = [];
        listEl.querySelectorAll(":scope > .lx-p0-message").forEach(function (el) {
          const isUser = el.classList.contains("user");
          // AI 消息：class 可能是 "ai" 或 "assistant"（下单成功等系统消息用 assistant），都算 AI
          const isAi = el.classList.contains("ai") || el.classList.contains("assistant");
          if (!isUser && !isAi) return;
          if (el._lxTransient || el.dataset.lxTransient === "1" || (el.querySelector(".lx-op-steps") && !el.querySelector(".lx-agent-chain-head"))) return; // 跳过临时进度卡,但agent多步卡(.lx-agent-chain-head)要存为执行记录
          // 跳过未完成的 loading 态 AI 消息，否则刷新后会卡在「生成中…」——但 _raw 已落地最终文本时例外：
          // lxAnimateAiFinal 打字动画会先塞 5s+「联想乐享正在生成中...」占位 DOM 才开始逐字显示，而
          // 下单成功/优惠领取等关键节点在 addMessage() 之后是立即同步调 saveNow()，此时动画根本没跑完、
          // DOM 还全是 loading 标记，但 _raw 早已是完整最终文本——只看 DOM 会把已确定内容整条误杀，
          // 这正是「立即存」在真机上仍然刷新即丢的根因（400ms 防抖只是另一层，两层都要治）。
          const _hasFinalRaw = isAi && typeof el._raw === "string" && el._raw.trim().length > 0;
          if (isAi && !_hasFinalRaw && (el.classList.contains("loading") || el.querySelector(".lx-generating, .loading-line, .typing-text"))) return;
          let html = isAi ? (el.querySelector(".ai-body")?.innerHTML || "") : "";
          const text = isUser ? (el.querySelector(".user-bubble")?.textContent || "").trim() : (el._raw || el.querySelector(".ai-body")?.textContent || "").trim();
          // 双保险：html 残留 loading 标记则丢弃，恢复时用 mdLite(text) 重渲染兜底（_raw 纯文本先保底，
          // 打字动画真正跑完后下一次 saveNow 会把带按钮的完整 html 补齐，不影响最终态）
          if (isAi && /正在生成中|lx-generating|loading-line|typing-text|typing-cursor/.test(html)) html = "";
          if (!text && !html) return;
          messages.push({ role: isUser ? "user" : "ai", text, html });
        });
        // 去掉末尾孤立用户提问（AI 没答完就存）——否则刷新后只剩一条没回答的提问
        while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
        if (!messages.length) return;
        localStorage.setItem(LX_CONV_KEY, JSON.stringify({
          convId: getState().convId || null,
          messages: messages.slice(-50),
          ts: Date.now()
        }));
      } catch (_e) { /* localStorage 写满等，静默 */ }
    }

    function save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(doSave, 400);
    }

    function saveNow() { clearTimeout(saveTimer); doSave(); }

    function restore() {
      try {
        if (localStorage.getItem(LX_NEW_CHAT_EMPTY_KEY) === "1") {
          localStorage.removeItem(LX_CONV_KEY);
          return;
        }
        const raw = localStorage.getItem(LX_CONV_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.messages) || !data.messages.length) return;
        if (data.ts && Date.now() - data.ts > 7 * 24 * 3600 * 1000) { localStorage.removeItem(LX_CONV_KEY); return; }
        const _msgs = data.messages.slice();
        if (!_msgs.length) { localStorage.removeItem(LX_CONV_KEY); return; }
        getState().convId = data.convId || getState().convId;
        const list = ensureChat();
        if (!list) return;
        list.innerHTML = "";
        // 顶部插「历史对话」分隔条，让用户明确这是上次的记录（而非当前出错）
        const _histDivider = document.createElement("div");
        _histDivider.className = "lx-conv-hist-divider";
        _histDivider.innerHTML = "<span>以上为历史对话</span>";
        _msgs.forEach(function (m) {
          if (m.role === "user") {
            addMessage("user", m.text || "");
          } else {
            // 注意：不含 lx-op-steps——那是 agent 多步链卡（.lx-agent-chain-head 同框）合法内容，
            // 会被 doSave 正常存档；这里若也判它「坏」会在恢复时被 mdLite(text) 拍平丢光结构。
            // 真正的临时进度卡（无 .lx-agent-chain-head）doSave 阶段就被过滤，根本不会存进来。
            const _badHtml = /正在生成中|正在处理|lx-generating|loading-line|typing-cursor|typing-text/.test(m.html || "");
            if (_badHtml && !m.text) return; // 坏 html 且无正文整条跳过
            if (!m.text && !m.html) return;
            const node = document.createElement("div");
            node.className = "lx-p0-message msg ai lx-chat-skin";
            node._raw = m.text || "";
            const body = lxEnsureAiBody(node);
            body.innerHTML = (_badHtml || !m.html) ? mdLite(m.text || "") : m.html;
            list.appendChild(node);
          }
        });
        if (list.children.length) list.appendChild(_histDivider); // 历史末尾加分隔，往下是新对话
        list.scrollTop = list.scrollHeight;
      } catch (_e) { /* 恢复失败静默，不影响首屏 */ }
    }

    return { save: save, saveNow: saveNow, restore: restore };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { createConv: createConv, LX_CONV_KEY: LX_CONV_KEY };
  if (root) root.__lxConvFactory = createConv;
})(typeof window !== "undefined" ? window : null);

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/app-lxfd.industry-v114.controls-v150.js */
window.__p0Modules.sources["uc7d8102785209270"]=function(){
/* p0-stream-view:start */
/* Incremental mirror for already-normalized assistant markup. No network or storage. */
(() => {
  'use strict';
  if(window.__lxStreamView)return;
  const active=new WeakMap();
  function key(node){return node.nodeType===1?(node.id||node.getAttribute('data-id')||''):'';}
  function patchNode(node,next){
    if(node.isEqualNode(next))return;
    if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName||key(node)!==key(next)){node.replaceWith(next.cloneNode(true));return;}
    if(node.nodeType===3||node.nodeType===8){node.data=next.data;return;}
    if(node.nodeType!==1)return;
    for(const a of [...node.attributes])if(!next.hasAttribute(a.name))node.removeAttribute(a.name);
    for(const a of [...next.attributes])if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);
    patchChildren(node,next);
  }
  function patchChildren(host,next){
    const old=[...host.childNodes],fresh=[...next.childNodes];
    for(let i=0;i<fresh.length;i++){if(old[i])patchNode(old[i],fresh[i]);else host.appendChild(fresh[i].cloneNode(true));}
    for(let i=fresh.length;i<old.length;i++)old[i].remove();
  }
  function patch(host,html){const template=document.createElement('template');template.innerHTML=html;patchChildren(host,template.content);}
  function mirror({source,target,scroll,normalize,isGenerating,onFinish,timeout=60000}){
    active.get(target)?.();let stopped=false,raf=0,poll,timer,lastRaw=null;
    function flush(){raf=0;if(stopped||!target.isConnected||!source.isConnected)return;const raw=source.innerHTML;if(raw===lastRaw)return;lastRaw=raw;const stick=!scroll||scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80;patch(target,normalize(raw));if(scroll&&stick)scroll.scrollTop=scroll.scrollHeight;}
    function stop(finish=false){if(stopped)return;if(finish)flush();stopped=true;observer.disconnect();cancelAnimationFrame(raf);clearInterval(poll);clearTimeout(timer);if(active.get(target)===stop)active.delete(target);if(finish&&target.isConnected)onFinish();}
    const observer=new MutationObserver(()=>{if(!raf&&!stopped)raf=requestAnimationFrame(flush);});
    observer.observe(source,{subtree:true,childList:true,characterData:true,attributes:true});
    poll=setInterval(()=>{if(!source.isConnected||!target.isConnected)stop();else if(!isGenerating())stop(true);},750);
    timer=setTimeout(()=>stop(true),timeout);active.set(target,stop);flush();return stop;
  }
  window.__lxStreamView=Object.freeze({patch,mirror});
})();

/* p0-stream-view:end */
// ── 乐享全屏对话（lxfd）独立模块 ─────────────────────────────────────────────
// 从 app.js 拆出（原 L7746-L9426，天然 IIFE 边界，行为零变化）。
// 与主面板通过 window.__lxBridge / window.lxfdSubmit / window.__lxIntent 通信。
// 加载顺序：app-intent.js → app.js → app-lxfd.js（index.html 里排最后）。
// Lexiang fullscreen dialog replacement behavior
(function(){
  "use strict";
  if (window.__lxfdInstalled) return;
  window.__lxfdInstalled = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $(".lxfd");
  if (!root) return;

  const navCluster = $("#lxfdNavCluster");
  const convoPill = $("#lxfdConvoPill");
  const convoName = $("#lxfdConvoName");
  const rail = $("#lxfdRail");
  const railFab = $("#lxfdRailFab");
  const railNewFab = $("#lxfdRailNewFab");
  const historySearch = $("#lxfdHistorySearch");
  const scrim = $("#lxfdScrim");
  const stage = $("#lxfdStage");
  const welcome = $("#lxfdWelcome");
  const thread = $("#lxfdThread");
  const ta = $("#lxfdTa");
  const send = $("#lxfdSend");
  const chips = $("#lxfdChips");
  const quick = $("#lxfdQuick");
  const turnIndex = $("#lxfdTurnIndex");
  const turnDots = $("#lxfdTurnDots");
  const turnList = $("#lxfdTurnList");
  const helloTitle = $("#lxfdHelloTitle");
  const isWindowsRuntime = (() => {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    return /Win/i.test(platform) || /Windows/i.test(ua);
  })();
  const forceFullscreenMotion = isWindowsRuntime;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceFullscreenMotion;
  document.body.classList.toggle("lxfd-force-motion", forceFullscreenMotion);
  let hoverTimer = null;
  let turns = [];
  let helloIndex = 0;
  let helloAnimating = false;
  let helloTimer = null;
  let railManuallyCollapsed = true;
  const chatState = { convId: null, sending: false, conversationNonce: 0, localId: null };;window.__lxGeneration.register(chatState,"fullscreen");window.__lxPersistStoppedFullscreen=()=>{lxfdPersistCurrent();};
  const navPaths = { home: "/", personal: "/shop-chat/", business: "/b-chat/", enterprise: "/biz-chat/", brand: "/brand/" };
  const LXFD_DEFAULT_HELLO_WORDS = ["找商品", "找门店", "找服务", "职场认证", "教育优惠", "找解决方案"];
  let helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
  const questions = ["想买游戏本，预算8000怎么选？", "学生买轻薄本，国补和教育优惠能省多少？", "小新和YOGA系列怎么选？", "旧电脑换新能抵多少钱？", "哪里有卖ThinkPad笔记本电脑门店"];
  const quicks = ["教育特惠", "以旧换新", "乐豆商城", "0元试用", "私人订制", "会员中心", "拉新返利"];
  const arrow = '<span class="arrow">' + window.__lxApprovedIcon("global-next") + '</span>';
  // actionbar 按钮 label → 有意义的 query 示例（避免直接发 label 体验差）
  const LXFD_ACTION_Q = {
    "文档解读": "请帮我解读这份文档，提炼核心结论、关键数据和待确认风险",
    "商品导购": "帮我推荐一款适合我的笔记本电脑",
    "解决方案": "解决方案",
    "门店查询": "帮我查询附近的联想门店",
    "职场认证": "职场人群认证怎么做，能享哪些专属优惠？",
    "服务预约": "我想预约售后维修或上门服务",
    "我的订单": "帮我查最近的订单状态和物流",
    "售后服务": "我的设备保修和售后服务怎么办理？",
    "评价服务": "给本次客服服务打个五星好评",
    "需求清单": "我整理一份采购需求清单发你确认",
  };
  const answer = '<p>我是联想官方AI助手，主要可以帮您完成以下事情：</p>'
    + '<h4>产品选购</h4><ul><li>推荐最适合的联想产品&lt;笔记本、台式机、平板、手机、配件等&gt;</li><li>产品参数对比、性价比分析</li></ul>'
    + '<h4>优惠查询</h4><ul><li>最新优惠政策:国补、教育优惠、企业补贴、学生价等</li><li>计算到手价、叠加各种优惠</li><li>推荐最适合您身份的优惠券</li></ul>'
    + '<h4>服务支持</h4><ul><li>查询保修状态、推荐延保方案</li><li>售后流程:退换货、维修、清洁保养、以旧换新估价</li><li>服务站地址和技术支持联系方式</li></ul>'
    + '<h4>订单辅助</h4><ul><li>处理订单、发货物流、发票等</li><li>会员权益、乐豆积分的使用</li></ul>'
    + '<p>有什么具体需求，随时可以和我说~</p>'
    + '<div class="lxfd-followups"><button type="button">可以推荐适合学生的笔记本吗？</button><button type="button">怎么查询我的产品保修状态？</button><button type="button">现在有哪些可以叠加的优惠政策？</button></div>'
    + '<p class="lxfd-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</p>';

  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
  function escapeAttr(text) { return escapeHtml(text).replace(/`/g, "&#96;"); }
  function lxfdDetectPage() {
    const path = location.pathname;
    for (const [page, p] of Object.entries(navPaths)) {
      if (path === p || path === p.replace(/\/$/, "") || path.startsWith(p === "/" ? "/_" : p)) {
        if (p !== "/" || path === "/") return page;
      }
    }
    // 精确匹配
    for (const [page, p] of Object.entries(navPaths)) {
      const normalized = p.endsWith("/") ? p : p + "/";
      const pathNorm = path.endsWith("/") ? path : path + "/";
      if (pathNorm === normalized) return page;
    }
    return "home";
  }
  function lxfdApplySite() {
    const prompts = window.__lxSitePrompts;
    if (!prompts) {
      // 兜底：用写死默认值渲染
      if (chips) chips.innerHTML = questions.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
      if (quick) quick.innerHTML = quicks.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
      return;
    }
    const page = (window.__lxState && window.__lxState.page) || lxfdDetectPage();
    const cfg = prompts[page] || prompts.home;
    if (!cfg) return;
    // 欢迎 chips
    const welcomeList = cfg.welcome || questions;
    if (chips) chips.innerHTML = welcomeList.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
    // 底部 actionbar
    const actionbarList = cfg.actionbar || quicks;
    if (quick) quick.innerHTML = actionbarList.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
    // 滚动标题词固定使用默认词组，不随频道话术重新读取。
    helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
    helloIndex = helloIndex % helloWords.length;
    // 输入框 placeholder
    if (ta && cfg.placeholder) ta.placeholder = cfg.placeholder;
  }
  lxfdApplySite();
  if (ta) ta.placeholder = "文档解读";
  function shortText(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }

  // ── 能力 B：localStorage 多会话历史 ──────────────────────────────────────
  function lxfdLoadStore() { try { return JSON.parse(localStorage.getItem("lexiang.lxfd.convs.v1") || "[]"); } catch (_) { return []; } }
  function lxfdSaveStore(a) { try { localStorage.setItem("lexiang.lxfd.convs.v1", JSON.stringify(a.slice(0, 20))); } catch (_) {} }
  function lxfdNewLocalConv() { chatState.localId = "lc" + Date.now() + Math.random().toString(36).slice(2, 6); }
  function lxfdPersistCurrent() {
    if (!thread || !thread.children.length) return;
    if (!chatState.localId) lxfdNewLocalConv();
    const firstUser = thread.querySelector(".lxfd-msg-user");
    const title = (firstUser ? firstUser.textContent : "新对话").trim().slice(0, 24) || "新对话";
    const snapshot = lxfdLoadStore();
    const previous = snapshot.find(c => c.id === chatState.localId);
    const threadHtml = thread.innerHTML, convId = chatState.convId || null;
    if (previous?.threadHtml === threadHtml && previous.title === title && previous.convId === convId) { lxfdSyncToMainConvKey(); return; }
    const store = snapshot.filter(c => c.id !== chatState.localId);
    store.unshift({ id: chatState.localId, title, convId, threadHtml, ts: Date.now(), pinned: !!previous?.pinned });
    lxfdSaveStore(store);
    // 同步一份到子站切换/刷新恢复用的 key（lexiang.conversation.v1）——否则首页对话切子站后丢失
    lxfdSyncToMainConvKey();
  }
  window.__lxfdPersistCurrentNow = lxfdPersistCurrent;
  // 首页 lxfd 对话 → 写进主对话持久化 key，让切子站(整页重载)后能恢复到同一段历史
  function lxfdSyncToMainConvKey() {
    try {
      if (localStorage.getItem("lexiang.newChatEmpty.v1") === "1") {
        localStorage.removeItem("lexiang.conversation.v1");
        return;
      }
      if (!thread) return;
      const nodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai"));
      const messages = [];
      nodes.forEach(function (el) {
        if (el.classList.contains("lxfd-msg-user")) {
          const text = (el.textContent || "").trim();
          if (text) messages.push({ role: "user", text: text, html: "" });
        } else {
          const body = el.querySelector(".lxfd-ai-body");
          let html = body ? body.innerHTML : "";
          const text = body ? (body.textContent || "").trim() : "";
          // 完成态正文会保留 hidden typing-cursor，不能仅凭类名把整条回复当成生成中。
          // 真正未完成的消息仍以可见 loading/typing 节点或占位文案为准；已有正文时保留
          // text，并清空不安全的中间态 HTML，让目标栏目用统一 markdown 渲染恢复。
          const hasVisiblePending = !!(body && Array.from(body.querySelectorAll(".lx-generating, .loading-line, .typing-text, .typing-cursor")).some(function (node) {
            return !node.hidden && node.getAttribute("aria-hidden") !== "true";
          }));
          const hasPlaceholderOnly = /联想乐享正在生成中|正在生成中/.test(text) && text.length < 40;
          if ((hasVisiblePending || hasPlaceholderOnly) && !text.replace(/联想乐享正在生成中|正在生成中/g, "").trim()) return;
          if (hasVisiblePending || hasPlaceholderOnly) html = "";
          if (html || text) messages.push({ role: "ai", text: text, html: html });
        }
      });
      while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      if (!messages.length) return;
      const payload = {convId: chatState.convId || null, messages: messages.slice(-50)};
      const saved = JSON.parse(localStorage.getItem("lexiang.conversation.v1") || "null");
      if (saved && saved.convId === payload.convId && JSON.stringify(saved.messages) === JSON.stringify(payload.messages)) return;
      localStorage.setItem("lexiang.conversation.v1", JSON.stringify({...payload, ts: Date.now()}));
    } catch (_e) {}
  }
  function lxfdRenderHist(query) {
    const normalizedQuery = String(query ?? historySearch?.value ?? "").trim().toLocaleLowerCase("zh-CN");
    const store = lxfdLoadStore()
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Number(b.ts || 0) - Number(a.ts || 0))
      .filter(c => !normalizedQuery || String(c.title || "").toLocaleLowerCase("zh-CN").includes(normalizedQuery));
    const hist = $("#lxfdHist");
    if (!hist) return;
    if (!store.length) {
      hist.innerHTML = '<div class="lxfd-hist-empty" role="status">' + (normalizedQuery ? "没有找到相关对话" : "暂无历史记录") + '</div>';
      return;
    }
    hist.innerHTML = store.map(c => '<div class="lxfd-hist-item' + (c.pinned ? " is-pinned" : "") + '" data-conv-item="' + escapeAttr(c.id) + '">' +
      '<a href="#" data-conv="' + escapeAttr(c.id) + '" class="lxfd-hist-link ' + (c.id === chatState.localId ? "active" : "") + '" title="' + escapeAttr(c.title) + '"><span class="lxfd-hist-title">' + escapeHtml(c.title) + '</span></a>' +
      '<button class="lxfd-hist-more" type="button" aria-label="' + escapeAttr(c.title) + '的更多操作" aria-haspopup="menu" aria-expanded="false"><img src="../icons/global-more.svg" alt="" aria-hidden="true" /></button>' +
      '<div class="lxfd-hist-menu" role="menu"><button class="lxfd-hist-action" type="button" role="menuitem" data-action="pin"><img src="../icons/' + (c.pinned ? 'global-unpin.svg' : 'global-pin.svg') + '" alt="" aria-hidden="true" /><span>' + (c.pinned ? "取消置顶" : "置顶") + '</span></button><button class="lxfd-hist-action" type="button" role="menuitem" data-action="delete"><img src="../icons/global-delete.svg" alt="" aria-hidden="true" /><span>删除</span></button></div></div>').join("");
    hist.querySelectorAll(".lxfd-hist-more").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const item = button.closest(".lxfd-hist-item");
        if (!item) return;
        const open = !item.classList.contains("menu-open");
        $$(".lxfd-hist-item.menu-open").forEach(node => {
          node.classList.remove("menu-open");
          node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false");
        });
        item.classList.toggle("menu-open", open);
        button.setAttribute("aria-expanded", String(open));
        if (open) item.querySelector(".lxfd-hist-action")?.focus();
      });
    });
  }

  function lxfdUpdateConversation(id, action) {
    const store = lxfdLoadStore();
    const index = store.findIndex(item => item.id === id);
    if (index < 0) return;
    if (action === "pin") store[index].pinned = !store[index].pinned;
    if (action === "delete") store.splice(index, 1);
    lxfdSaveStore(store);
    if (action === "delete" && id === chatState.localId) resetConversation(false);
    else lxfdRenderHist();
  }
  function lxfdLoadConv(id) {
    const c = lxfdLoadStore().find(x => x.id === id);
    if (!c) return;
    window.__lxRecommendationFollowups?.clear();
    lxfdPersistCurrent();
    chatState.localId = c.id;
    chatState.convId = c.convId || null;
    chatState.conversationNonce += 1;
    if (thread) { thread.innerHTML = c.threadHtml; thread.classList.add("show"); }
    if (welcome) welcome.style.display = "none";
    lxfdSetGalleryChatting(true);
    if (convoName) { convoName.textContent = shortText(c.title, 15); convoName.title = c.title; }
    turns = [];
    renderTurnIndex("");
    lxfdRenderHist();
  }

  // ── 能力 A：从主面板导入已有对话 ─────────────────────────────────────────
  // 查主面板消息必须排除过渡动画层里的克隆：动画层整块克隆 .assistant-panel（类名原样保留），
  // 存活的 760ms 内全局 querySelectorAll 会真身+克隆各抓一份 → 导入翻倍
  function lxfdMainMsgs(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel), function(el) { return !el.closest(".lxfd-motion-panel"); });
  }
  function lxfdMainGenerating() {
    // 主面板是否仍在流式生成（state.sending 或最后一条 AI 消息里还挂着生成骨架）
    return !!((window.__lxState && window.__lxState.sending) ||
      lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai .lx-generating").length);
  }
  function lxfdNormalizeImportedAiHtml(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("[data-lx-focus-reco]").forEach((node) => {
      node.removeAttribute("data-lx-focus-reco");
      node.setAttribute("data-lxfd-reveal-products", "1");
    });
    return box.innerHTML;
  }
  function lxfdDoImport() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const importedConvId = (window.__lxState && window.__lxState.convId) || null;
    // 重复展开同一段分屏会话时覆盖同步现有全屏线程，不额外制造一条历史记录；
    // 只有确实切换到了另一段后端会话时才建立新的本地会话身份。
    if (!chatState.localId || (chatState.convId && importedConvId && chatState.convId !== importedConvId)) {
      lxfdNewLocalConv();
    }
    thread.innerHTML = "";
    turns = [];
    msgs.forEach(function(el) {
      const isUser = el.classList.contains("user");
      if (isUser) {
        const text = el.textContent.trim();
        const turnId = "turn-" + Date.now() + "-" + turns.length;
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-user" id="' + turnId + '">' + escapeHtml(text) + '</div>');
        turns.push({ id: turnId, text: text });
      } else {
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">' + lxfdNormalizeImportedAiHtml(el.innerHTML) + '</div></div>');
      }
    });
    renderTurnIndex("");
    chatState.convId = importedConvId;
    if (welcome) welcome.style.display = "none";
    thread.classList.add("show");
    chatState.started = true;
    lxfdSetGalleryChatting(true);
    if (quick) quick.style.display = "none";
    const lastUser = thread.querySelector(".lxfd-msg-user:last-of-type");
    const titleText = lastUser ? lastUser.textContent.trim() : "导入的对话";
    if (convoName) { convoName.textContent = shortText(titleText, 15); convoName.title = titleText; }
    lxfdPersistCurrent();
    lxfdRenderHist();
    return true;
  }
  function lxfdImportFromMain() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const generating = lxfdMainGenerating();
    // 先把当前所有消息（含那条还在生成、内容只有一半的 AI）原样克隆过来——带一半过来
    lxfdDoImport();
    if (generating) {
      // 主面板仍在流式输出：实时把最后一条 AI 消息镜像到全屏，主面板每蹦一段、全屏跟着更新，
      // 直到生成结束——边进边继续往外输出，不再干等（流式 SSE 只发给主面板 DOM，这里做镜像）。
      const aiNodes = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai");
      const mainAi = aiNodes[aiNodes.length - 1];
      const fsBodies = thread.querySelectorAll(".lxfd-msg-ai .lxfd-ai-body");
      const fsAiBody = fsBodies[fsBodies.length - 1];
      if (mainAi && fsAiBody) {
        window.__lxStreamView.mirror({source:mainAi,target:fsAiBody,scroll:thread,normalize:lxfdNormalizeImportedAiHtml,isGenerating:lxfdMainGenerating,onFinish:()=>{lfxdPersistCurrent();lfxdRenderHist();}});
      }
    }
    return true;
  }
  // ── 能力 C：把 lxfd 当前对话导出到主面板 ──────────────────────────────────
  // excludeEls：这一轮临时展示、不该进历史的节点（件2代买桥接用——过渡态用户气泡/提示条
  // 只在全屏展示做视觉过渡，真正的一条由桥接后 sendChat(value) 在主面板重新生成，
  // 带过去导出会变成重复两条）。
  function lxfdExportToMain(excludeEls) {
    if (!thread || !window.__lxBridge) return;
    const skip = excludeEls && excludeEls.length ? new Set(excludeEls) : null;
    const messages = [];
    const allNodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai")).filter(function(el) { return !skip || !skip.has(el); });
    const lastAi = allNodes.filter(function(el) { return el.classList.contains("lxfd-msg-ai"); }).pop();
    allNodes.forEach(function(el) {
      if (el.classList.contains("lxfd-msg-user")) {
        messages.push({ role: "user", text: el.textContent.trim(), html: "" });
      } else {
        const body = el.querySelector(".lxfd-ai-body");
        let html;
        if (body) {
          // 剥掉 lxfd 专属商品区和免责；追问需要保留，并转成主对话可点击的链接样式。
          // 商品已在右侧 reco 页正常展示，左侧对话保留文字答案 + 最新追问。
          const clone = body.cloneNode(true);
          clone.querySelectorAll(".lxfd-products, .lxfd-disclaimer").forEach(function(n) { n.remove(); });
          if (el !== lastAi) clone.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach(function(n) { n.remove(); });
          clone.querySelectorAll(".lxfd-followups").forEach(function(n) {
            n.classList.remove("lxfd-followups");
            n.classList.add("followups");
            n.setAttribute("data-followups", "1");
            n.querySelectorAll("button").forEach(function(btn) {
              const text = (btn.textContent || "").replace(/→\s*$/, "").trim();
              if (text) btn.setAttribute("data-quick-ask", text);
            });
          });
          html = clone.innerHTML;
        } else {
          html = el.innerHTML;
        }
        messages.push({ role: "ai", text: "", html: html });
      }
    });
    if (!messages.length) return;
    window.__lxBridge.importConversation(messages, chatState.convId, { localId: chatState.localId });
  }
  function parseJson(data) {
    try { return JSON.parse(data); } catch (_) { return {}; }
  }
  function money(value) {
    const n = Number(value || 0);
    return n ? "¥" + n.toLocaleString("zh-CN") : "咨询价";
  }
  function imgUrl(src) {
    const value = String(src || "").trim();
    if (!value) return "/assets/product-placeholder.svg";
    return value.startsWith("http") || value.startsWith("/") ? value : "/" + value;
  }
  function mdLite(text) {
    // 官方文本常自带 HTML 实体（「我的」&gt;「设置」），不先解码会被 escapeHtml 二次转义显示成字面（同主面板 mdLite）
    const src = String(text || "").replace(/<br\s*\/?>/gi, "\n").replace(/[ \t]*_\._[ \t]*/g, " ")
      .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    let html = escapeHtml(src);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?:^|\n)####?\s*(.+)/g, "\n<h4>$1</h4>");
    html = html.replace(/(?:^|\n)-\s+(.+)/g, "\n<ul><li>$1</li></ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    return html.split(/\n{2,}/).map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (/^<(h4|ul)/.test(clean)) return clean;
      return `<p>${clean.replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }
  async function readSse(response, handlers) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() || "";
      blocks.forEach((block) => {
        let event = "message";
        const data = [];
        block.split(/\n/).forEach((line) => {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        });
        const payload = data.join("\n");
        if (payload && handlers[event]) handlers[event](payload);
      });
    }
    if (buffer.trim()) {
      let event = "message";
      const data = [];
      buffer.split(/\n/).forEach((line) => {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      });
      const payload = data.join("\n");
      if (payload && handlers[event]) handlers[event](payload);
    }
  }
  function wide() { return window.innerWidth >= 1280; }
  function finishMotionClass(name, delay = 520) {
    window.setTimeout(() => document.body.classList.remove(name), reduceMotion ? 0 : delay);
  }
  function runMotionPanel(layer) {
    if (!layer) return;
    const runCssMotion = () => {
      if (forceFullscreenMotion) {
        layer.getBoundingClientRect();
        requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("run")));
      } else {
        requestAnimationFrame(() => layer.classList.add("run"));
      }
    };
    // Windows 11 + Chromium 149 may skip the left/top/size transition when the
    // fullscreen layer is inserted and the body class changes in the same frame.
    // Drive that environment with WAAPI, while leaving the existing CSS path
    // untouched for systems where the original animation already works.
    if (!forceFullscreenMotion || typeof layer.animate !== "function") {
      runCssMotion();
      return;
    }
    const isExit = layer.classList.contains("lxfd-motion-panel-exit");
    const ease = "cubic-bezier(.22,.61,.36,1)";
    const start = layer.getBoundingClientRect();
    const toPx = (value, fallback) => {
      const n = parseFloat(String(value || ""));
      return Number.isFinite(n) ? n : fallback;
    };
    const target = isExit
      ? {
          left: toPx(layer.style.getPropertyValue("--lxfd-target-left"), start.left),
          top: toPx(layer.style.getPropertyValue("--lxfd-target-top"), start.top),
          width: toPx(layer.style.getPropertyValue("--lxfd-target-width"), start.width),
          height: toPx(layer.style.getPropertyValue("--lxfd-target-height"), start.height),
          radius: 8,
          opacity: 0,
      }
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, radius: 0, opacity: 0 };
    if (isExit) {
      const scaleX = target.width > 0 && start.width > 0 ? target.width / start.width : 1;
      const scaleY = target.height > 0 && start.height > 0 ? target.height / start.height : 1;
      const moveX = target.left - start.left;
      const moveY = target.top - start.top;
      layer.style.transformOrigin = "top left";
      layer.style.backfaceVisibility = "hidden";
      layer.style.transform = "translate3d(0,0,0) scale(1,1)";
      const first = {
        transform: "translate3d(0,0,0) scale(1,1)",
        borderRadius: "0px",
        opacity: "1",
      };
      const last = {
        transform: `translate3d(${moveX}px,${moveY}px,0) scale(${scaleX},${scaleY})`,
        borderRadius: `${target.radius}px`,
        opacity: `${target.opacity}`,
      };
      const anim = layer.animate([
        first,
        { ...first, offset: 0.08 },
        { ...last, opacity: "1", offset: 0.72 },
        last
      ], { duration: 720, easing: ease, fill: "forwards" });
      anim.addEventListener("finish", () => {
        layer.style.left = `${target.left}px`;
        layer.style.top = `${target.top}px`;
        layer.style.width = `${target.width}px`;
        layer.style.height = `${target.height}px`;
        layer.style.borderRadius = `${target.radius}px`;
        layer.style.opacity = `${target.opacity}`;
        layer.style.transform = "translate3d(0,0,0) scale(1,1)";
        layer.classList.add("run");
      }, { once: true });
      return;
    }
    const first = {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      borderRadius: isExit ? "0px" : "8px",
      opacity: "1",
    };
    const hold = { ...first, offset: isExit ? 0.72 : 0.67 };
    const last = {
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      borderRadius: `${target.radius}px`,
      opacity: `${target.opacity}`,
    };
    const anim = layer.animate([first, hold, last], { duration: 720, easing: ease, fill: "forwards" });
    anim.addEventListener("finish", () => {
      Object.assign(layer.style, last);
      layer.classList.add("run");
    }, { once: true });
  }
  function createPanelStretchLayer() {
    const source = document.querySelector(".assistant-panel");
    if (!source || reduceMotion) return null;
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function getSplitPanelRect() {
    // 全屏态可能只剩 lx-auto-fs：exitFullscreen 里先跑的 focusReco→lxRevealContent 会摘掉
    // assistant-fullscreen 但留 lx-auto-fs（它单独也藏着 .shell）。只认一个类会误判"不在全屏"，
    // 不摘类就去量 → 量到 display:none 的面板 → null → 退出动画整个消失
    const wasFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (wasFullscreen) setFullscreen(false);
    const source = document.querySelector(".assistant-panel");
    const rect = source?.getBoundingClientRect();
    if (wasFullscreen) setFullscreen(true);
    if (!rect || !rect.width || !rect.height) return null;
    return rect;
  }
  function createFullscreenShrinkLayer(targetRect) {
    const source = document.querySelector(".lxfd");
    if (!source || !targetRect || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function createFullscreenExitLayer() {
    const source = document.querySelector(".lxfd");
    if (!source || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    return layer;
  }
  function setFullscreenExitLayerTarget(layer, targetRect) {
    if (!layer || !targetRect || !targetRect.width || !targetRect.height) return false;
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    runMotionPanel(layer);
    return true;
  }
  function normalizeFullscreenEntryState() {
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    document.body.classList.remove("lxfd-exiting", "lxfd-split-returning");
    if (document.body.classList.contains("lx-home-split")) {
      document.body.dataset.page = "home";
      const content = document.querySelector(".content");
      if (content) content.setAttribute("data-view", "home");
      document.body.classList.remove("lx-home-split");
    }
    stage?.classList.remove("shift");
    openRail(false);
  }
  function enterFullscreen() {
    // 动画层必须在 normalize 之前截取：normalize 会拆掉分屏布局，之后 .assistant-panel
    // 量出 0×0 → 拿不到起点 → 退化成 CSS 兜底的「从下面冒出」而不是面板拉伸过渡
    const motionLayer = createPanelStretchLayer();
    normalizeFullscreenEntryState();
    lxfdApplySite();
    // 每次展开都重新读取分屏当前会话。不能以全屏 thread 是否为空作为判断，
    // 否则 thread 中残留的旧首轮内容会阻止后续问答和推荐卡片被带入。
    if (lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) lxfdImportFromMain();
    document.body.classList.remove("lxfd-exiting");
    document.body.classList.remove("lxfd-split-returning");
    document.body.classList.add("lxfd-entering");
    document.body.classList.add("lxfd-split-entered");
    setFullscreen(true);
    window.setTimeout(() => motionLayer?.remove(), reduceMotion ? 0 : 760);
    finishMotionClass("lxfd-entering", 760);
  }
  function exitFullscreen(afterExit, options) {
    const onAfterExit = typeof afterExit === "function" ? afterExit : null;
    const skipGenericFocus = !!(options && options.skipGenericFocus);
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterExit?.();
      return;
    }
    // 有对话时回「分屏」而不是裸首页：enterFullscreen 的 normalize 把页面态抹成了 home，
    // 不对称恢复的话对话会藏在隐藏的 lxfd thread 里，用户看到 hero 首页以为对话丢了。
    // 先恢复分屏布局（复用 focusReco 配方）再量收缩动画落点，动画才有真实目标矩形。
    const hasConvo = !!(thread && thread.classList.contains("show") && thread.children.length && window.__lxBridge);
    // 带回调退出只用于“结果卡打开右侧内容”，即使历史 thread 的 show 标记在恢复时
    // 暂时缺失，也必须强制回左右框架，不能依赖 hasConvo 这一项视觉标记。
    const returnToSplit = hasConvo || !!onAfterExit;
    if (hasConvo) {
      lxfdExportToMain();
      try {
        if (skipGenericFocus) window.__lxBridge.prepareRootSplitState?.();
        else window.__lxBridge.focusReco();
      } catch {}
    }
    const targetRect = getSplitPanelRect();
    const motionLayer = createFullscreenShrinkLayer(targetRect);
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    // 全屏类清理/主应用退出钩子都可能重算页面态。必须在它们之后再次落定分屏，
    // 否则会出现既无 assistant-fullscreen、也无 lx-home-split 的半退出页面。
    if (returnToSplit) lxfdEnsureRootSplitState();
    document.body.dataset.state = hasConvo ? "chat" : "default";
    if (hasConvo && thread) thread.innerHTML = "";
    if (onAfterExit) requestAnimationFrame(() => {
      if (returnToSplit) lxfdEnsureRootSplitState();
      onAfterExit();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      if (returnToSplit) lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  // 结果卡需要从全屏对话直接落到“左对话 + 右结果”。
  // 这里不走通用退出动画：通用动画会在两帧之间暴露裸商城和
  // 全屏层/商城混合态。所有布局类、页面态和目标内容在同一个点击任务内提交，
  // 浏览器下一次绘制只能看到最终左右框架。
  function lxfdExitToResultAtomically(commitResult) {
    const hasConversation = !!(thread && thread.children.length && window.__lxBridge);
    if (hasConversation) lxfdExportToMain();
    document.body.classList.remove(
      "assistant-fullscreen", "lx-auto-fs", "lx-root-home", "lxfd-entering",
      "lxfd-exiting", "lxfd-split-returning"
    );
    document.querySelectorAll(".lxfd-motion-panel").forEach((node) => node.remove());
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    lxfdEnsureRootSplitState();
    document.body.dataset.state = "chat";
    if (typeof commitResult === "function") commitResult();
    lxfdEnsureRootSplitState();
    lxfdAssertSplitEndState();
    if (hasConversation && thread) thread.innerHTML = "";
    const stabilizeSplit = () => {
      lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
    };
    requestAnimationFrame(stabilizeSplit);
    // Restored history cards can start an asynchronous result-page generator.
    // Root-home guards may run again during that window and remove the split
    // class after the first frame. Keep asserting the shared two-column end
    // state until the result page has replaced its generation overlay.
    [80, 240, 520, 900].forEach((delay) => window.setTimeout(stabilizeSplit, reduceMotion ? 0 : delay));
  }
  // 退出动画收尾断言：分屏已成形则全屏类必须不在。防御外部"回全屏"钩子在动画窗口内
  // (补分屏类之前的一瞬守卫失效)把全屏类加回来，造成两态共存的混合花屏
  function lxfdAssertSplitEndState() {
    if (!document.body.classList.contains("lx-home-split")) return;
    window.__LXFD_FORCE = false; // 已进分屏,关掉"URL=/强制全屏"开关,否则内联force定时器会把全屏盖回来
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lx-root-home");
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    if (document.body.dataset.page === "home" || !document.body.dataset.page) document.body.dataset.page = "personal";
    // forceRootFullscreen 曾给 .lxfd 写内联 display:block/visibility:visible——内联样式压过
    // 分屏 CSS 的隐藏规则,全屏层会叠在分屏上(消息裸排+hero输入框+画廊混显)。清掉还权给 CSS
    const lxfdLayer = document.querySelector(".lxfd");
    if (lxfdLayer) { lxfdLayer.style.display = ""; lxfdLayer.style.visibility = ""; }
  }
  function exitFullscreenWithReveal(afterReveal) {
    const onAfterReveal = typeof afterReveal === "function" ? afterReveal : null;
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterReveal?.();
      return;
    }
    const motionLayer = createFullscreenExitLayer();
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    document.body.dataset.state = thread?.classList.contains("show") ? "chat" : "default";
    onAfterReveal?.();
    requestAnimationFrame(() => {
      const rect = document.querySelector(".assistant-panel")?.getBoundingClientRect();
      if (!setFullscreenExitLayerTarget(motionLayer, rect)) motionLayer?.remove();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  window.__lxfdExitWithReveal = exitFullscreenWithReveal;
  function setFullscreen(on) {
    document.body.classList.toggle("assistant-fullscreen", !!on);
    document.body.classList.toggle("lx-auto-fs", !!on);
    if (!on) document.body.classList.remove("lxfd-split-entered");
    if (on) document.body.dataset.state = "chat";
    if (on) {
      const currentTitle = convoName?.textContent?.trim();
      if (convoName && !currentTitle) {
        const splitTitle = document.querySelector(".main-nav")?.getAttribute("data-current-label")?.trim();
        const lastMainUser = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.user").pop()?.textContent?.trim();
        const fallbackTitle = splitTitle || (lastMainUser ? shortText(lastMainUser, 15) : "新对话");
        convoName.textContent = fallbackTitle;
        convoName.title = fallbackTitle;
      }
      const hasThread = !!(thread && (thread.classList.contains("show") || thread.children.length));
      if (hasThread || chatState.started) {
        if (welcome) welcome.style.display = "none";
        if (thread) thread.classList.add("show");
        if (quick) quick.style.display = "none";
        lxfdSetGalleryChatting(true);
      }
      requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); ta?.focus(); });
    }
  }
  function setNav(open) {
    navCluster?.classList.toggle("open", open);
    convoPill?.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function syncRailNewFabVisibility() {
    const chatting = !!stage?.classList.contains("is-chatting");
    const railOpen = !!rail?.classList.contains("open");
    document.body.classList.toggle("lxfd-chatting", chatting);
    railNewFab?.classList.toggle("hide", railOpen || !chatting);
  }
  function openRail(open) {
    if (open && !window.__lxState?.user) open = false;
    rail?.classList.toggle("open", open);
    railFab?.classList.toggle("hide", open);
    syncRailNewFabVisibility();
    stage?.classList.toggle("shift", open && wide());
    scrim?.classList.remove("show");
    // 侧栏一露出就重读 localStorage 重渲染——store 是主面板(app.js lxArchiveCurrentConversation)
    // 和本文件(lxfdPersistCurrent)共用的同一个 key，但 #lxfdHist 只在启动时渲染过一次；
    // 主面板那边新归档的对话（含多步 agent 卡）不会自动反映到这里，用户点开旧快照里的
    // 条目会踩到过期/不完整数据，恢复出来就只剩用户那句话。开一次刷一次，零额外触发面。
    if (open) lxfdRenderHist();
  }
  function setRailManual(open) {
    railManuallyCollapsed = !open;
    document.body.classList.toggle("lxfd-rail-user-open", !!open);
    openRail(open);
  }
  function syncRailForViewport() {
    openRail(Boolean(window.__lxState?.user) && wide() && !railManuallyCollapsed);
  }
  window.__lxfdSyncHistoryAuth = function(authenticated) {
    if (!authenticated) {
      railManuallyCollapsed = true;
      document.body.classList.remove("lxfd-rail-user-open");
      openRail(false);
      return;
    }
    syncRailForViewport();
  };
  function fit() {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 148) + "px";
  }
  function syncSend() {
    const empty = !ta?.value.trim() && !window.__lxRecommendationFollowups?.hasSelection();
    send?.classList.toggle("idle", empty);
    if (send) send.disabled = empty;
  }
  function setRotatingTitle(word) { if (helloTitle) helloTitle.innerHTML = `<span>联想乐享帮你</span><span class="rotating-word">${escapeHtml(word)}</span>`; }
  async function rotateTitleWordForWindows(word) {
    if (helloAnimating || !word || typeof word.animate !== "function") return;
    helloAnimating = true;
    const ease = "cubic-bezier(.16,.72,.22,1)";
    try {
      // 位移用 top（布局属性，主线程绘制）不用 transform/blur/will-change——那些会把词提成
      // 合成层，配合父级 background-clip:text 渐变字在 Chrome 留旧帧残影（真机两轮反馈）；
      // top 动画不产生层缓存，动效在、残影无。word 的 position:relative 由 CSS 提供。
      await word.animate([
        { opacity: 1, top: "0px" },
        { opacity: 0, top: "-6px" }
      ], { duration: 300, easing: ease, fill: "forwards" }).finished;
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      await word.animate([
        { opacity: 0, top: "6px" },
        { opacity: 1, top: "0px" }
      ], { duration: 320, easing: ease, fill: "forwards" }).finished;
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } catch (_) {
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } finally {
      helloAnimating = false;
    }
  }
  function rotateTitleWord() {
    if (!helloTitle || welcome.style.display === "none") return;
    const word = helloTitle.querySelector(".rotating-word");
    if (!word) { setRotatingTitle(helloWords[helloIndex]); return; }
    if (forceFullscreenMotion && typeof word.animate === "function") {
      rotateTitleWordForWindows(word);
      return;
    }
    word.classList.add("out");
    window.setTimeout(() => {
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      word.classList.remove("out");
      word.classList.add("in");
      requestAnimationFrame(() => word.classList.remove("in"));
    }, reduceMotion ? 0 : 300);
  }
  function startRotatingTitle() {
    setRotatingTitle(helloWords[helloIndex]);
    if (reduceMotion) return;
    if (helloTimer) window.clearTimeout(helloTimer);
    if (!forceFullscreenMotion) {
      helloTimer = window.setInterval(rotateTitleWord, 2000);
      return;
    }
    const tick = () => {
      rotateTitleWord();
      helloTimer = window.setTimeout(tick, 2000);
    };
    helloTimer = window.setTimeout(tick, 2000);
  }
  function renderTurnIndex(activeId) {
    turnIndex?.classList.toggle("show", turns.length > 0);
    if (turnDots) turnDots.innerHTML = turns.map(t => `<i class="${t.id === activeId ? "active" : ""}"></i>`).join("");
    if (turnList) turnList.innerHTML = turns.map(t => `<button type="button" class="${t.id === activeId ? "active" : ""}" data-target="${escapeAttr(t.id)}" title="${escapeAttr(t.text)}">${escapeHtml(shortText(t.text, 18))}</button>`).join("");
  }
  function lxfdEnterHuman() {
    chatState.human = true;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body"><b>专属客服小联</b> 已为您接入人工服务，下方已切换为客服快捷入口。订单、售后、发票问题可直接发我。（演示：由乐享 AI 以专属客服身份接待）</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    if (quick) { quick.innerHTML = ["退出人工", "我的订单", "售后服务", "评价服务", "需求清单"].map(t => '<button type="button">' + escapeHtml(t) + '</button>').join(""); quick.style.display = ""; }
    if (ta) { if (!ta.dataset.origPh) ta.dataset.origPh = ta.placeholder; ta.placeholder = "向专属客服小联提问..."; }
  }

  function lxfdExitHuman() {
    chatState.human = false;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">已退出人工服务，继续由联想乐享 AI 为您服务。</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    lxfdApplySite();
    // 退出客服后若仍在聊天态则继续隐藏 actionbar
    if (chatState.started && quick) quick.style.display = "none";
    if (ta && ta.dataset.origPh) ta.placeholder = ta.dataset.origPh;
  }

  function lxfdSetGalleryChatting(on) {
    stage?.classList.toggle("is-chatting", !!on);
    syncRailNewFabVisibility();
  }

  function resetConversation(collapseRail) {
    window.__lxRecommendationFollowups?.clear();
    lxfdPersistCurrent();
    // 先归档旧会话，再锁定当前会话为空；刷新/卸载期间不得由旧 DOM 回写。
    try {
      localStorage.setItem("lexiang.newChatEmpty.v1", "1");
      localStorage.removeItem("lexiang.conversation.v1");
    } catch (_e) {}
    chatState.conversationNonce += 1;
    chatState.convId = null;
    chatState.localId = null;
    chatState.sending = false;
    chatState.human = false;
    chatState.started = false; // 新建对话回到欢迎态，恢复 actionbar
    // 当前会话已重置，避免顶部标题从上一轮共享缓存中恢复。
    try { localStorage.removeItem("lexiang.conversation.v1"); } catch (_e) {}
    if (thread) { thread.innerHTML = ""; thread.classList.remove("show"); }
    turns = [];
    renderTurnIndex("");
    if (welcome) welcome.style.display = "flex";
    // 根路径新建对话=回到初始首页态：把 prepaint 标记类加回来（分屏桥接时被摘掉），
    // 否则整套「空白态」规则失效——topbar 露出、左侧 fab 复现、右上冒出「收起」按钮（真机反馈）
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    if (logicalPath === "/") {
      document.documentElement.classList.add("lx-root-lxfd-prepaint");
      document.body.classList.remove("lx-home-split", "lxfd-split-entered", "assistant-fullscreen", "lx-auto-fs");
      window.__LXFD_FORCE = true;
    }
    lxfdSetGalleryChatting(false);
    if (convoName) { convoName.textContent = "新对话"; convoName.title = "新对话"; }
    if (window.__lxSyncTopNavTitle) window.__lxSyncTopNavTitle();
    if (ta) { if (ta.dataset.origPh) ta.placeholder = ta.dataset.origPh; ta.value = ""; fit(); syncSend(); }
    // 从历史侧栏点击“新建对话”后，无论当前 PC 视口宽度，都收起历史目录；
    // 同步写入手动收起状态，避免随后的 resize / viewport 同步再次自动展开。
    if (collapseRail) setRailManual(false);
    // 恢复 actionbar（lxfdApplySite 会重渲内容）
    if (quick) { quick.style.display = ""; lxfdApplySite(); }
    ta?.focus();
    lxfdRenderHist();
  }
  function renderLxfdProducts(products, options = {}) {
    if (!Array.isArray(products) || !products.length) return "";
    const couponProduct = window.__lxCouponCenter?.productsCoupon(products);
    const educationProduct = window.__lxEducationOffers?.isProducts(products);
    const first = products[0] || {};
    const recoId = "lxfd-reco-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    window.__lxRecoPayloads = window.__lxRecoPayloads || {};
    window.__lxRecoPayloads[recoId] = products;
    // 同步持久化（与主面板 lxReadRecoPayload 同一 key）：桥接导出的历史恢复后 CTA 仍可取回商品
    try {
      const key = "lexiang.recoPayloads.v1";
      const store = JSON.parse(localStorage.getItem(key) || "[]");
      store.push({ id: recoId, products: products.slice(0, educationProduct || couponProduct ? 12 : 8).map((p) => ({ sku: p.sku, name: p.name, price: p.price, image_url: p.image_url || p.image, specs: p.specs, description: (p.description || "").slice(0, 400) })) });
      localStorage.setItem(key, JSON.stringify(store.slice(-8)));
    } catch (_e) {}
    const isServiceProduct = !!options.serviceProduct;
    const desc = couponProduct
      ? `已按券面范围整理 ${products.length} 款对应商品`
      : educationProduct
      ? `已为你整理 ${products.length} 款教育优惠商品`
      : isServiceProduct
      ? `已为你推荐 ${products.length} 款服务商品`
      : products.length === 1
      ? `${escapeHtml(first.name || "按你的需求筛选出的商品")}${first.price ? ` · ${money(first.price)}` : ""}`
      : `已为你筛选 ${products.length} 款候选商品`;
    return `<button class="answer-cta lx-answer-reco" type="button" data-lxfd-reveal-products="1" data-lxfd-reco-id="${escapeHtml(recoId)}">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${couponProduct ? "查看优惠券可用商品" : educationProduct ? "查看教育优惠商品" : isServiceProduct ? "查看推荐服务商品" : "查看推荐商品"}</span>
        <span class="answer-cta-desc">${desc}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>${!couponProduct&&!educationProduct&&!isServiceProduct?(window.__lxRecommendationFollowups?.render(recoId)||""):""}`;
  }

  function lxfdPageCtaMeta(op) {
    const key = String(op || "");
    const map = {
      edu: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      open_edu_zone: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      open_solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      open_stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      open_member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      open_coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      points: { feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" },
      vouchers: { feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" },
      redpacket: { feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" },
      cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      open_cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_documents: { feature: "documents", title: "查看文档解读", desc: "已为你打开资料中心与文档列表" }
    };
    return map[key] || null;
  }

  function renderLxfdPageCta(meta) {
    if (!meta) return "";
    const resultIds = { solution: "info:solution", member: "info:member", devices: "info:devices", coupon: "info:coupon", points: "info:points", vouchers: "info:vouchers", redpacket: "info:redpacket", documents: "documents", edu: "info:edu", cart: "info:cart", orders: "info:orders" };
    const resultId = meta.resultId || resultIds[meta.feature] || "";
    const resultAttr = resultId ? ` data-lx-result-id="${escapeAttr(resultId)}" data-lx-open-tab="${escapeAttr(resultId)}" aria-pressed="false"` : "";
    return `<button class="answer-cta lx-answer-page" type="button" data-lx-focus-active="1" data-lxfd-open-feature="${escapeHtml(meta.feature || "")}"${resultAttr} aria-label="${escapeAttr(meta.title || "查看页面")}，展开左右框架" title="展开左右框架">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${escapeHtml(meta.title || "查看页面")}</span>
        <span class="answer-cta-desc">${escapeHtml(meta.desc || "已在右侧为你打开相关内容")}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function renderLxfdLeadCta() {
    return '<div class="lx-p0-actions answer-actions"><button class="lx-p0-btn primary" type="button" data-floor-action="lead">提交项目需求</button></div>';
  }

  // 只看 page==="home" 会漏：上一轮分屏残留 page="personal" 时再进全屏、退出走到这里，
  // 分屏类没补上 → 无全屏类也无分屏类的中间态（topbar 露出、lxfd 消息裸奔黑三角，或者背景
  // 停在首页欢迎态门户，聊天消息虽已在DOM里但不可见——件2代买桥接真机截图就踩到了这个）。
  // 无论根首页还是四个频道，从全屏卡片收起前都必须先恢复左右结构。
  // 旧逻辑只处理 URL=/：当目标 Tab 已被关闭或缓存中尚未登记时，卡片会走
  // lxfdRevealFeature 兜底；子频道因没有补分屏类，最终只剩右侧独立页面。
  function lxfdEnsureRootSplitState() {
    // 这是“最终态提交”而不是仅缺类时补一次。全屏进入/首页守卫可能在动画窗口内
    // 写回 lx-root-home 或移除 split；每次调用都重放主应用唯一的分屏归一化函数。
    if (typeof window.__lxBridge?.prepareRootSplitState === "function") {
      window.__lxBridge.prepareRootSplitState();
    } else if (!document.body.classList.contains("lx-home-split")) {
        document.documentElement.classList.remove("lx-root-lxfd-prepaint");
        document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lxfd-entering", "lx-root-home");
        document.body.classList.add("lx-home-split", "lxfd-split-entered");
        document.body.dataset.page = "personal";
        document.body.dataset.state = "chat";
        window.__LXFD_FORCE = false;
        const _lxfdLayer = document.querySelector(".lxfd");
        if (_lxfdLayer) { _lxfdLayer.style.display = ""; _lxfdLayer.style.visibility = ""; }
    }
  }

  // 全屏消息会先导回主面板。结果卡收起后优先点击导回的同一张卡，
  // 让主面板唯一的结果路由器负责 Tab 激活、关闭后重建和内容恢复。
  function lxfdReplayImportedResultCard(target) {
    const cards = Array.from(document.querySelectorAll(".lx-p0-messages .answer-cta"));
    const hit = cards.slice().reverse().find((card) => {
      if (target.resultId && card.getAttribute("data-lx-result-id") === target.resultId) return true;
      if (target.boundTabId && card.getAttribute("data-lx-open-tab") === target.boundTabId) return true;
      if (target.solutionTitle && card.getAttribute("data-specific-solution-cta") === target.solutionTitle) return true;
      if (target.recoId && card.getAttribute("data-lxfd-reco-id") === target.recoId) return true;
      if (target.openProduct && card.getAttribute("data-open-product") === target.openProduct) return true;
      return !!target.feature && card.getAttribute("data-lxfd-open-feature") === target.feature;
    });
    if (!hit) return false;
    hit.click();
    return true;
  }

  function lxfdRevealFeature(feature) {
    lxfdEnsureRootSplitState();
    if (String(feature).startsWith("member-coupon-center:")) {
      window.__lxOpenCouponCenter?.(String(feature).split(":")[1]);
      return;
    }

    if (typeof window.__lxOpenFeature === "function") window.__lxOpenFeature(feature);
  }

  function lxfdOpenFeatureInSplit(feature) {
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (!inFullscreen) {
      lxfdRevealFeature(feature);
      return;
    }
    lxfdExportToMain();
    exitFullscreen(() => {
      lxfdRevealFeature(feature);
      if (thread) thread.innerHTML = "";
    });
  }

  async function lxfdRunHomeCommerceEntry(kind) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    // 这条“全屏生成 → 结果卡 → 左右结构”链路只属于根首页。
    // 子频道即使误调用，也立即回退到其原有商务入口，不改变频道交互。
    if (logicalPath !== "/") {
      return window.lxOpenCommerceEntry?.(kind, { sendQuery: true });
    }
    if (chatState.sending) return;

    const isOrders = kind === "orders";
    const query = isOrders ? "查看我的订单" : "查看我的购物车";
    const feature = isOrders ? "orders" : "cart";
    const reply = isOrders
      ? "已为你整理近期**订单状态**、商品与服务信息，可继续查看物流、详情及售后入口。"
      : "已为你整理**购物车商品**、优惠与结算信息，可继续核对选中商品并完成结算。";
    const meta = lxfdPageCtaMeta(isOrders ? "open_orders" : "open_cart");

    chatState.sending = true;
    chatState.started = true;
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    if (quick) quick.style.display = "none";
    thread?.classList.add("show");

    const turnId = `turn-home-${feature}-${Date.now()}`;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = query;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: query });
    renderTurnIndex(turnId);

    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

    try {
      // 严格串行：正文逐字完成后才挂结果卡；结果卡完成布局后才退出全屏并创建右页。
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, reply)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body && meta) body.insertAdjacentHTML("beforeend", renderLxfdPageCta(meta));
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
      lxfdPersistCurrent();
      lxfdExportToMain();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
      exitFullscreenWithReveal(() => lxfdRevealFeature(feature));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}
  window.__lxfdRunHomeCommerceEntry = lxfdRunHomeCommerceEntry;

  function appendLxfdSuggestions(ai, suggestions) {
    const list = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    if (!list.length) return;
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => {
      if (!ai.contains(el)) el.remove();
    });
    ai.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    const host = ai.querySelector(".lxfd-ai-body") || ai;
    host.insertAdjacentHTML("beforeend", `<div class="lxfd-followups">${list.map((sug) => `<button type="button">${escapeHtml(sug)}</button>`).join("")}</div>`);
    // 件2 F1：追问chip常在答案打字动画收尾之后才异步插入，插入前 thread 已经滚到"答案末尾"，
    // 新增内容会落在可视区之下点不到——插入后补一次滚底（对称主面板的 lxAppendAiHtml 滚动逻辑）
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdClaimTicketSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4 2 2 0 0 0 0-4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 2"/></svg>';
  }

  function lxfdClaimCheckSvg(width) {
    return window.__lxApprovedIcon("global-check", width ? "ck" : "");
  }

  function lxfdClaimInfoFromCard(card) {
    const productName = (card && card.dataset && card.dataset.claimProduct) || (card && card.querySelector(".t2") && card.querySelector(".t2").textContent.trim()) || "商品";
    const chips = Array.prototype.slice.call(card ? card.querySelectorAll(".chip") : []);
    const claimed = chips.map(function(chip) {
      const amount = Number((chip.dataset && chip.dataset.claimAmount) || String((chip.querySelector(".cv") || {}).textContent || "").replace(/[^0-9.]/g, "")) || 0;
      const label = (chip.dataset && chip.dataset.claimName) || String(chip.textContent || "").replace(/¥\s?[\d,]+(?:\.\d+)?/g, "").trim() || "优惠券";
      return { label: label, amount: amount };
    });
    const domTotal = String((card && card.querySelector(".done-amt") || {}).textContent || "").replace(/[^0-9.]/g, "");
    const totalSaved = Number((card && card.dataset && card.dataset.claimTotal) || domTotal) || claimed.reduce(function(sum, item) { return sum + Math.abs(Number(item.amount || 0)); }, 0);
    return { productName: productName, claimed: claimed, totalSaved: totalSaved };
  }

  function lxfdRenderClaimedStaticCard(info) {
    const offers = Array.isArray(info.claimed) ? info.claimed : [];
    const chips = offers.map(function(coupon) {
      const amount = Math.abs(Number(coupon.amount || 0));
      return '<span class="chip">' + lxfdClaimCheckSvg("3.2") + escapeHtml(coupon.label || "优惠券") + ' <span class="cv">¥' + amount.toLocaleString("zh-CN") + '</span></span>';
    }).join("");
    return '<div class="gc lx-claimed-skin" data-v="I" aria-disabled="true">'
      + '<div class="irow"><span class="ic">' + lxfdClaimTicketSvg() + '</span>'
      + '<span class="mid"><div class="t1">已领取 ' + offers.length + ' 项优惠 <span class="doneflag df">' + lxfdClaimCheckSvg("2.6") + '已领取</span></div>'
      + '<div class="t2">' + escapeHtml(info.productName || "商品") + ' · 已收进卡包</div></span>'
      + '<span class="sa">已省 ¥' + Math.abs(Number(info.totalSaved || 0)).toLocaleString("zh-CN") + '</span></div>'
      + '<div class="chips">' + chips + '</div></div>';
  }

  function lxfdArchiveClaimProgressCards(root) {
    (root || document).querySelectorAll('.cl[data-v="D"].lx-claim-skin').forEach(function(card) {
      card.outerHTML = lxfdRenderClaimedStaticCard(lxfdClaimInfoFromCard(card));
    });
  }

  function lxfdTypeNodes(sourceParent, targetParent, speed, done) {const __lxGenerationToken=window.__lxGeneration.capture();
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    const scroll = () => { if (thread) thread.scrollTop = thread.scrollHeight; };
    const moveCursor = (parent) => { cursor.remove(); parent.appendChild(cursor); scroll(); };
    const typeTextNode = (text, parent, next) => {
      const textNode = document.createTextNode("");
      let index = 0;
      parent.appendChild(textNode);
      moveCursor(parent);
      const tick = () => {
        textNode.nodeValue = String(text).slice(0, index);
        index += 1;
        if (index <= String(text).length) window.__lxGeneration.timeout(__lxGenerationToken,tick, speed);
        else next();
      };
      tick();
    };
    const typeChildList = (children, parent, next) => {
      let index = 0;
      const step = () => {
        if (index >= children.length) { next(); return; }
        typeNode(children[index], parent, () => { index += 1; step(); });
      };
      step();
    };
    const typeNode = (node, parent, next) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.nodeValue) { next(); return; }
        typeTextNode(node.nodeValue, parent, next);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) { next(); return; }
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      moveCursor(clone);
      typeChildList(Array.from(node.childNodes), clone, next);
    };
    targetParent.innerHTML = "";
    typeChildList(Array.from(sourceParent.childNodes), targetParent, () => {
      cursor.remove();
      scroll();
      if (done) done();
    });
  }

  // 生成阶段实时刷新时间线（件2，同 app.js lxRenderTraceLive 逻辑）：此时 .lxfd-ai-body
  // 里只有这一个结构，全量重绘最简单；lxfdAnimateFinal 收尾时会把 ai-body 整体替换掉，
  // 折叠态 HTML 随 finalHtml 一起进去，不依赖这里的实时 DOM。
  function lxfdRenderTraceLive(ai) {
    const body = ai && ai.querySelector && ai.querySelector(".lxfd-ai-body");
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    if (!body || !renderTrace) return;
    body.innerHTML = renderTrace(ai._traceLines, { collapsed: ai._traceCollapsed, foldable: ai._traceCollapsed, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 });
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdAnimateFinal(ai, rawText) {const __lxGenerationToken=window.__lxGeneration.capture();
    const body = ai?.querySelector(".lxfd-ai-body");
    if (!body) return Promise.resolve();
    // 收尾把时间线折叠态 HTML 拼进最终正文——本函数会整体替换 ai-body，生成阶段的实时 DOM
    // 保不住，得随最终 html 一起进去才能存档/恢复时保持折叠（同 app.js sendChat done 收尾）。
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const traceHtml = (ai && ai._traceLines && ai._traceLines.length && renderTrace)
      ? renderTrace(ai._traceLines, { collapsed: true, foldable: true, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 })
      : "";
    const html = traceHtml + mdLite(String(rawText || "").trim() || "我先为你整理好了相关内容。");
    ai.classList.add("lx-chat-skin");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      body.innerHTML = html;
      return Promise.resolve();
    }
    const loadingStarted = ai._loadingStarted || Date.now();
    if (!body.querySelector(".loading-line")) {
      body.innerHTML = '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div>';
    } else {
      const typing = body.querySelector(".loading-line .typing-text");
      if (typing) typing.textContent = "联想乐享正在生成中...";
    }
    return new Promise((resolve) => {
      const waitTime = Math.max(0, 5000 - (Date.now() - loadingStarted));
      window.__lxGeneration.timeout(__lxGenerationToken,() => {
        const source = document.createElement("div");
        source.innerHTML = html;
        lxfdTypeNodes(source, body, 18, () => {
          window.__lxGeneration.timeout(__lxGenerationToken,() => {
            body.innerHTML = html;
            if (thread) thread.scrollTop = thread.scrollHeight;
            resolve();
          }, 140);
        });
      }, waitTime);
    });
  }

  function lxfdFetchFollowups(question, answer) {
    const q = String(question || "").trim();
    const a = String(answer || "").trim().slice(0, 300);
    if (!q || !a) return Promise.resolve([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2200);
    return fetch("/api/leai/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, a }),
      signal: controller.signal
    }).then((r) => r.json()).then((d) => {
      window.clearTimeout(timer);
      return Array.isArray(d && d.questions) ? d.questions.filter(Boolean).slice(0, 3) : [];
    }).catch(() => {
      window.clearTimeout(timer);
      return [];
    });
  }

  // 答后「猜你想干」动作 chips：生成器收口 app-intent.actionChips（主/全屏共用一份，
  // 生成的句子被本地正则秒接闭环）；lxfdFill3 保证无论 LLM 追问成败都凑满 3 个（静态兜底）
  function lxfdActionChips(products) {
    return (window.__lxIntent && window.__lxIntent.actionChips) ? window.__lxIntent.actionChips(products) : [];
  }
  function lxfdFill3(arr) {
    const fb = (window.__lxIntent && window.__lxIntent.FOLLOWUP_FALLBACKS) || [];
    const out = [];
    (arr || []).concat(fb).forEach((x) => { if (x && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }

  const lxfdWait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const lxfdIsDocumentInsight = (text) => /(文档解读|解读.*文档|分析.*(?:文档|文件|PDF)|提炼.*(?:文档|文件)|核心结论.*关键数据)/i.test(String(text || ""));

  async function lxfdRunDocumentInsight() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._traceLines = [];
    ai._traceSkills = new Set(["Skill(文档解读)"]);
    ai.innerHTML = '<div class="lxfd-ai-body"><div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div></div>';
    thread?.appendChild(ai);
    chatState.sending = true;

    const body = ai.querySelector(".lxfd-ai-body");
    let showGenerating = true;
    const paintTrace = () => {
      if (!body) return;
      const trace = renderTrace
        ? renderTrace(ai._traceLines, { collapsed: false, foldable: false, skillCount: ai._traceSkills.size })
        : ai._traceLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
      const generating = showGenerating
        ? '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div>'
        : "";
      body.innerHTML = trace + generating;
      thread.scrollTop = thread.scrollHeight;
    };
    const pushTrace = async (line, delay, hideGenerating) => {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : delay)));
      if (hideGenerating) showGenerating = false;
      ai._traceLines.push(line);
      paintTrace();
    };

    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享正在判断", 1240, true)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("已判断：文档解读任务", 840)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享官方 SKILL：正在调用 Skill(文档解读)", 1040)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("正在读取文档结构与正文", 1240)));

    const traceHtml = renderTrace
      ? renderTrace(ai._traceLines.concat(["已完成文档内容提取"]), { collapsed: true, foldable: true, skillCount: ai._traceSkills.size })
      : "";
    body.innerHTML = traceHtml;
    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 3000)));

    const answerHtml = '<p>我已读取文档内容，下面是重点解读。</p>'
      + '<h4>核心结论</h4><ul><li>文档围绕当前业务目标、实施路径与结果要求展开，主线清晰。</li><li>重点任务已拆分为可执行阶段，需继续确认责任人、时间节点和验收口径。</li></ul>'
      + '<h4>关键信息</h4><ul><li><strong>目标：</strong>统一信息口径，提升执行与协作效率。</li><li><strong>路径：</strong>按“准备—执行—验收—复盘”分阶段推进。</li><li><strong>交付：</strong>关键数据、任务清单与结果说明需保持可追溯。</li></ul>'
      + '<h4>待确认项</h4><ul><li>部分时间节点和负责人尚未明确，建议在正式执行前补齐。</li><li>涉及外部数据或政策的内容，建议再核对最新来源。</li></ul>';
    const extrasHtml = renderLxfdPageCta(lxfdPageCtaMeta("open_documents"))
      + '<div class="lxfd-followups"><button type="button">继续提取文档中的关键数据</button><button type="button">按章节生成详细摘要</button><button type="button">整理成可执行任务清单</button></div>';
    body.innerHTML = traceHtml;
    const answerSource = document.createElement("div");
    answerSource.innerHTML = answerHtml;
    const answerHost = document.createElement("div");
    answerHost.className = "lxfd-ai-text";
    body.appendChild(answerHost);
    if (reduceMotion) {
      answerHost.innerHTML = answerHtml;
    } else {
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => lxfdTypeNodes(answerSource, answerHost, 18, resolve))));
    }
    answerHost.insertAdjacentHTML("afterend", extrasHtml);
    chatState.sending = false;
    thread.scrollTop = thread.scrollHeight;
    lxfdPersistCurrent();
    lxfdRenderHist();
    window.__lxGeneration.timeout(__lxGenerationToken,() => lxfdOpenFeatureInSplit("documents"), reduceMotion ? 0 : 600);
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}



  function lxfdIsNearbyStoreQuery(text) {
    const value = String(text || "").trim();
    return value.length <= 24 && !/预约|库存|营业|电话|服务权益|导航/.test(value) && /附近门店|联想门店|门店查询|查.{0,4}门店|找.{0,4}门店|推荐.{0,4}门店|^(门店|实体店|体验店|专卖店)$/.test(value);
  }

  async function lxfdRunUnifiedStoreAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的门店需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(420)));
    ai._traceLines.push("已判断：需要查询当前位置附近的联想授权门店");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(520)));
    ai._traceSkills.add("Skill(附近门店查询)");
    ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(附近门店查询)");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(760)));
    ai._traceLines[ai._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(附近门店查询) 已完成";
    lxfdRenderTraceLive(ai);
    const copy = "我已结合**当前位置**为你整理附近的**联想授权门店**，优先推荐距离较近、营业时间明确且支持产品体验、库存咨询和到店服务的门店。你可以先查看下方推荐，再到右侧比较**地址、营业状态与联系方式**，并按需发起**导航或预约**。";
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
    const body = ai.querySelector(".lxfd-ai-body");
    if (body) body.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "stores", title: "查看附近门店", desc: "已为你整理附近授权门店、距离与营业状态" }));
    lxfdPersistCurrent();
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
    chatState.sending = false;
    lxfdExportToMain();
    exitFullscreenWithReveal(() => lxfdRevealFeature("stores"));
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdEducationAuthKind(text) {
    const value = String(text || "").trim().replace(/[\s，,。.!！?？：:“”"'‘’]/g, "");
    if (!value || value.length > 160) return "";
    // Keep explicit opt-outs and product purchase/recommendation requests in their existing flows.
    if (/(?:不要|不用|无需|不想|不需要|取消|停止).{0,8}(?:教育|学生|教师|老师|师生|高考)/.test(value)) return "";
    if (/(?:推荐|对比|购买|选购|下单).{0,20}(?:商品|产品|机型|电脑|笔记本|平板)|待支付|生成订单/.test(value)) return "";
    const audience = /教育|学生|在校生|大学生|师生|教师|老师|高考/.test(value);
    const auth = /认证|认定|核验|教育认$/.test(value);
    const offer = /(?:教育|学生|在校生|大学生|师生|教师|老师|高考).{0,16}(?:特惠|优惠|折扣|打折|福利|权益|补贴)|(?:教育|学生|教师|师生)(?:专享|专属)?价/.test(value);
    if (!audience || (!auth && !offer)) return "";
    if (/高考/.test(value)) return "gaokao";
    if (/教师|老师/.test(value)) return "teacher";
    return "college";
  }

  function lxfdIsWorkplaceAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 36 && /职场|职场人|在职|工作|员工|企业职工/.test(value) && /认证|认定|核验|职场认$/.test(value);
  }

  function lxfdIsEnterpriseMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 48
      && /企业会员|企业身份|企业账户|企业采购负责人|企业认证/.test(value)
      && /认证|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseDiamondMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 56
      && /企业钻石会员|钻石企业会员|企业会员.{0,6}钻石/.test(value)
      && /认证|升级|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseLeadQuery(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 48) return false;
    const directLead = /^(?:我要|我想|帮我|现在)?(?:进行|提交|填写|办理|发起)?(?:企业|采购|项目)?留资(?:申请|信息|表单)?$/.test(value);
    const enterpriseIntent = /企业留资|企业咨询|采购留资|项目留资|提交(?:企业|采购|项目)需求|联系企业顾问|企业合作咨询/.test(value);
    return directLead || enterpriseIntent;
  }

  function lxfdEnterpriseLeadCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-enterprise-lead-reco" type="button" data-open-enterprise-lead data-lx-result-id="modal:enterprise-lead" aria-label="打开企业留资弹窗" aria-pressed="false"><span class="answer-cta-title">提交企业留资</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedEnterpriseLeadAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-auth-flow-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的企业留资需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push("已判断：需要进入企业采购需求留资流程");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = "Skill(企业采购需求留资)";
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = "提交**企业采购需求**后，联想企业顾问可结合采购规模、预算、应用场景与交付周期提供进一步支持。请准备**联系人、联系方式及需求说明**，提交前核对关键信息，后续沟通以企业顾问联系为准。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdEnterpriseLeadCard());
      const card = body?.querySelector(".lx-enterprise-lead-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.openLeadPanel?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdAuthRecommendationCard(type, kind) {
    if (type === "enterprise" || type === "enterprise-diamond") {
      const label = type === "enterprise-diamond" ? "认证企业钻石会员" : "立即认证企业会员";
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-enterprise-auth-reco" type="button" data-open-enterprise-auth-modal ${type === "enterprise-diamond" ? 'data-enterprise-auth-kind="diamond"' : ""} data-lx-result-id="modal:enterprise-member-auth" aria-label="打开企业会员认证弹窗" aria-pressed="false"><span><span class="answer-cta-title">${label}</span></span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    if (type === "workplace") {
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-workplace-auth-reco" type="button" data-open-wpa data-lx-result-id="modal:workplace-auth" aria-label="打开职场身份认证弹窗" aria-pressed="false"><span class="answer-cta-title">职场认证</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    const label = kind === "gaokao" ? "高考生教育认证" : (kind === "teacher" ? "教师教育认证" : "教育认证");
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco" type="button" data-open-stuauth="${escapeAttr(kind)}" data-lx-result-id="modal:education-auth:${escapeAttr(kind)}" aria-label="打开${escapeAttr(label)}弹窗" aria-pressed="false"><span class="answer-cta-title">${escapeHtml(label)}</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  function lxfdIsDiscountOrderQuery(text) {
    const value = String(text || "").trim();
    return /(?:领取|使用).{0,8}(?:全部|所有|可用)?.{0,8}优惠|(?:全部|所有|可用).{0,8}优惠.{0,8}(?:下单|订单)|待支付订单/.test(value) && /购买|下单|订单|支付/.test(value);
  }

  function lxfdPaymentRecommendationCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-payment-confirm-reco" type="button" data-open-payment-confirm data-lx-result-id="modal:pending-payment" aria-label="打开待支付订单弹窗" aria-pressed="false"><span class="answer-cta-title">待支付订单</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedDiscountOrderAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const product = window.__lxState?._pendingDiscountOrderProduct || window.__lxState?.currentProduct;
    if (!product || !window.__lxAgentAPI?.lxPreparePendingPayment) {
      const ai = document.createElement("div");
      ai.className = "lxfd-msg-ai lx-chat-skin";
      ai.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, "请先打开一款商品详情，我再为你领取全部可用优惠并生成待支付订单。")));
      return;
    }
    chatState.sending = true;
    const prepared = window.__lxAgentAPI.lxPreparePendingPayment(product);
    const claimed = Array.isArray(prepared?.claimed) ? prepared.claimed : [];
    const item = prepared?.item || product;
    const saved = Math.abs(Number(prepared?.discount) || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-payment-confirm-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的优惠下单需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(`已判断：需要核对${item.name || "当前商品"}与当前账户可用优惠`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      ai._traceSkills.add("Skill(优惠领取与订单生成)");
      ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(优惠领取与订单生成)");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：已自动领取全部 ${claimed.length} 项可用优惠`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = claimed.length
        ? `已为你自动领取**${claimed.length}项可用优惠**，共节省¥${saved}。商品、优惠与收货信息已核对，请在**待支付订单**中确认后继续。`
        : "当前商品暂无可叠加优惠，已按现价生成订单。商品与收货信息已核对，请在**待支付订单**中确认后继续。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdPaymentRecommendationCard());
      const card = body?.querySelector(".lx-payment-confirm-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunUnifiedAuthAnswer(type, kind = "college") {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const isWorkplace = type === "workplace";
    const isDiamond = type === "enterprise-diamond";
    const isEnterprise = type === "enterprise" || isDiamond;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now();
    ai._traceLines = [isDiamond ? "联想乐享正在判断你的企业钻石会员升级需求" : (isEnterprise ? "联想乐享正在判断你的企业会员认证需求" : (isWorkplace ? "联想乐享正在判断你的职场认证需求" : "联想乐享正在判断你的教育认证需求"))];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(isDiamond ? "已判断：需要进入企业钻石会员升级认证流程" : (isEnterprise ? "已判断：需要进入企业采购负责人认证流程" : (isWorkplace ? "已判断：需要进入企业在职身份认证流程" : "已判断：需要进入教育身份认证流程")));
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = isDiamond ? "Skill(企业钻石会员升级认证)" : (isEnterprise ? "Skill(企业会员身份认证)" : (isWorkplace ? "Skill(职场身份认证)" : "Skill(教育身份认证)"));
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = isDiamond
        ? "完成**企业钻石会员升级认证**后，可进一步解锁企业专享采购权益、专属服务与会员支持。请准备**企业名称、统一社会信用代码及企业邮箱**，提交后以正式核验结果为准。"
        : isEnterprise
        ? "完成**企业会员认证**后，可解锁企业专享价、采购补贴、对公付款及专票账期等权益。请准备企业名称、统一社会信用代码及企业邮箱，提交后以正式核验结果为准。"
        : isWorkplace
        ? "**职场认证**可用于核验企业在职身份，并解锁员工购机优惠、会员权益及相关服务。请按真实情况填写个人与企业资料，提交前核对**企业信息与在职材料**，认证结果以正式身份核验信息为准。"
        : "**教育特惠**面向在校生、教师及高考生，完成**教育身份认证**后，可解锁教育专属价格与相关会员权益。\n\n请在弹窗中选择真实身份与认证方式，填写学校等资料，核对**材料与有效期**后提交。你也可点击下方小卡重新打开认证，结果以正式核验为准。";
      ai.classList.add("lx-auth-flow-answer");
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard(type, kind));
      const card = body?.querySelector(".lx-edu-auth-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      if (isDiamond) window.__lxOpenEnterpriseDiamondUpgradeModal?.();
      else if (isEnterprise) window.__lxOpenEnterpriseAuthModal?.();
      else if (isWorkplace) window.openWorkplaceAuth?.();
      else window.__lxAgentAPI?.openStudentAuth?.(kind);
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunEnterpriseAuthQuery(value) {
    const token = window.__lxGeneration.capture();
    const generation = window.__lxGeneration;
    const data = {copy:window.__lxEnterpriseAuthQuery.copy};
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now() - 5000;
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    try {
      await generation.wait(token, lxfdAnimateFinal(ai, data.copy));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) {
        body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard("enterprise"));
        body.querySelector('[data-open-enterprise-auth-modal]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await generation.wait(token, lxfdWait(reduceMotion ? 0 : 720));
      if (!generation.current(token)) return;
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        if (!generation.current(token)) return;
        lxfdEnsureRootSplitState();
        window.__lxOpenEnterpriseAuthModal();
      });
    } finally {
      if (generation.current(token)) {
        chatState.sending = false;
        syncSend();
      }
    }
  }

  async function lxfdRunMemberCouponCenter(value) {
    const token = window.__lxGeneration.capture();
    const generation = window.__lxGeneration;
    const data = window.__lxCouponCenter.describe(value);
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now() - 5000;
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    try {
      await generation.wait(token, lxfdAnimateFinal(ai, data.copy));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) {
        body.insertAdjacentHTML("beforeend", renderLxfdPageCta({
          feature: "member-coupon-center:" + data.category,
          resultId: "info:member-coupon-center",
          title: "查看会员领券中心",
          desc: data.desc
        }));
        body.querySelector('[data-lx-result-id="info:member-coupon-center"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await generation.wait(token, lxfdWait(reduceMotion ? 0 : 720));
      if (!generation.current(token)) return;
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        if (!generation.current(token)) return;
        lxfdEnsureRootSplitState();
        window.__lxOpenCouponCenter(data.category);
      });
    } finally {
      if (generation.current(token)) {
        chatState.sending = false;
        syncSend();
      }
    }
  }

  async function lxfdRunSolutionAnswer(industry = "") {
    const __lxGenerationToken = window.__lxGeneration.capture();
        let scoped = industry ? window.__lxIndustrySolutions.describe(industry) : null;
        const solutionNonce = chatState.conversationNonce;
        chatState.sending = true;
        try {
        const solutionAi = document.createElement("div");
        solutionAi.className = "lxfd-msg-ai";
        solutionAi._loadingStarted = Date.now();
        solutionAi._traceLines = ["联想乐享正在判断"];
        solutionAi._traceSkills = new Set();
        solutionAi._traceCollapsed = false;
        solutionAi.innerHTML = '<div class="lxfd-ai-body"></div>';
        thread?.appendChild(solutionAi);
        lxfdRenderTraceLive(solutionAi);
        solutionAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
        solutionAi._traceLines.push("已判断："+(scoped?scoped.title:"全集解决方案")+"检索任务");
        lxfdRenderTraceLive(solutionAi);
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
        solutionAi._traceSkills.add("Skill(解决方案推荐)");
        solutionAi._traceLines.push(scoped?"正在调用 Skill(解决方案推荐)":"联想乐享官方 SKILL：正在调用 Skill(解决方案推荐)");
        lxfdRenderTraceLive(solutionAi);
        if (scoped) scoped = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxIndustrySolutions.run(industry)));
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
        if (solutionNonce !== chatState.conversationNonce) { solutionAi.remove(); return; }
        solutionAi._traceLines.push("已完成：行业方案全集与分类楼层已生成");
        solutionAi._traceCollapsed = true;
        lxfdRenderTraceLive(solutionAi);

        const solutionCopy = scoped ? scoped.copy : [
          "我已为你汇总**乐享全集解决方案**，覆盖教育、医疗、政府、制造、金融、能源、交通和服务八大行业。",
          "每个行业都按照**独立楼层**组织，并结合核心业务场景、终端部署、基础设施与持续服务，方便你快速浏览和比较。",
          "你可以进入全集后**按行业标签定位**；当前视口会在每个楼层单排自适应展示 4–6 个方案。"
        ].join("\n\n");
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(solutionAi, solutionCopy)));
        if (solutionNonce !== chatState.conversationNonce) return;
        const solutionMeta = scoped ? {feature:scoped.feature,resultId:scoped.tabId,title:scoped.cardTitle,desc:scoped.desc} : lxfdPageCtaMeta("open_solution");
        const solutionBody = solutionAi.querySelector(".lxfd-ai-body");
        if (solutionBody && solutionMeta) {
          solutionBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(solutionMeta));
          const solutionCard = solutionBody.querySelector('.answer-cta');
          if (solutionCard) {
            solutionCard.classList.add("is-active");
            solutionCard.setAttribute("aria-pressed", "true");
          }
        }
        lxfdPersistCurrent();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
        lxfdExportToMain();
        if (solutionNonce !== chatState.conversationNonce) return;
        exitFullscreenWithReveal(() => { if (solutionNonce === chatState.conversationNonce) lxfdRevealFeature(scoped ? scoped.feature : "solution"); });
        } finally {if(window.__lxGeneration.current(__lxGenerationToken)){ if (solutionNonce === chatState.conversationNonce) chatState.sending = false; }}
  }

  async function lxfdRunCouponProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxCouponCenter.runProducts({query,token,

      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(优惠券解读与可用商品)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'优惠券可用商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function lxfdRunCompareDisplayQuery(query) {
  const token=window.__lxGeneration.capture();let ai;
  return window.__lxComparisonDisplay.run(query,{token,
    busy:active=>{chatState.sending=active;syncSend();},
    answer:async text=>{
      if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
      await lxfdAnimateFinal(ai,text);
    },
    save:()=>window.__lxfdPersistCurrentNow?.()
  });
}
async function lxfdRunServiceProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxServiceProducts.run({query,token,
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(服务商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products,{serviceProduct:true}));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.setAttribute('data-lx-service-products-card','1');card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'推荐服务商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

async function lxfdRunEducationOfferQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxEducationOffers.run({query,token,
      authenticate:kind=>lfxdRunUnifiedAuthAnswer('education',kind),
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(教育优惠商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'教育优惠商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function submit(text) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const value = String(text || "").trim();
    if (!value || chatState.sending) return;
    if (window.__lxPageCommandV150 && await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxPageCommandV150(value, {
      reset: () => { resetConversation(true); window.__lxBridge?.resetConversationContext(); },
      reply: async (message) => {
        setNav(false);chatState.started=true;setFullscreen(true);lxfdSetGalleryChatting(true);
        if(welcome)welcome.style.display='none';thread?.classList.add('show');
        const user=document.createElement('div');user.className='lxfd-msg-user';user.id='turn-'+Date.now();user.textContent=value;thread?.appendChild(user);
        turns.push({id:user.id,text:value});renderTurnIndex(user.id);
        if(ta){ta.value='';fit();syncSend();}
        const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai,message)));lxfdPersistCurrent();lxfdExportToMain();
      }
    })))) return;

    if (typeof window.__lxRequireQueryAccess === "function" && !window.__lxRequireQueryAccess()) return;
    // 用户真正发出下一条消息后，新会话成立，恢复正常持久化。
    try { localStorage.removeItem("lexiang.newChatEmpty.v1"); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}
    // 发送问题时强制收起顶部灵动岛，保持与首页项目一致的紧凑标题态：
    // 「首页：当前问题 + 下拉箭头」。避免用户刚操作过导航时把整排频道带进对话态。
    setNav(false);
    convoPill?.blur();
    // 本轮桥接状态（全屏→分屏）
    let turnProducts = null;
    let turnTitle = "";
    let turnGrouped = false;
    let turnActions = []; // 本轮意图操作（action 事件带来的 op）——多意图一轮可能来多个（门店+优惠+会员），全记录，桥接后全开
    let pendingExtras = "";
    let pendingFollowups = [];
    let finalized = false;
    let finalizePromise = null;
    lxfdArchiveClaimProgressCards(thread);
    try { window.__lxHideSuggest && window.__lxHideSuggest(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');} // 发送即收起输入联想浮层（程序性清空不触发 input，不收会残留）
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    // 开始聊天后隐藏 actionbar（对齐官方；客服模式下 enterHuman 会恢复）
    if (!chatState.started && !chatState.human) {
      chatState.started = true;
      if (quick) quick.style.display = "none";
    }
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    thread?.classList.add("show");
    if (convoName) { convoName.textContent = shortText(value, 15); convoName.title = value; }
    // 全屏欢迎态首问=新对话：thread 还没有任何消息（非历史恢复/非分屏回流）说明用户从初始
    // 首页重新开聊，清掉主面板 boot 时 restore 的旧对话上下文，首问不背"以上为历史对话"的
    // 旧账（真机反馈）；旧对话在侧栏历史归档里可找回。
    if (thread && !thread.querySelector(".lxfd-msg-user, .lxfd-msg-ai")) {
      chatState.convId = null;
      if (window.__lxBridge && typeof window.__lxBridge.resetConversationContext === "function") window.__lxBridge.resetConversationContext();
    }
    const turnId = "turn-" + Date.now() + "-" + turns.length;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = value;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: value });
    renderTurnIndex(turnId);
    window.__lxRecommendationFollowups?.consume(value);
    if (ta) { ta.value = ""; fit(); syncSend(); }
    // 发出提问就先存一次（含 lxfd key + 同步子站 key），AI 答完再存完整——避免答得慢时切站啥都没存
    try { lxfdPersistCurrent(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}

    if (window.__lxEnterpriseMemberText?.matches(value)) {
      chatState.sending = true;
      syncSend();
      const memberAi = document.createElement("div");
      memberAi.className = "lxfd-msg-ai lx-chat-skin";
      memberAi._loadingStarted = Date.now() - 5000;
      memberAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(memberAi);
      memberAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      try {
        await window.__lxGeneration.wait(__lxGenerationToken, lxfdAnimateFinal(memberAi, window.__lxEnterpriseMemberText.profile().copy));
      } finally {
        if (window.__lxGeneration.current(__lxGenerationToken)) {
          chatState.sending = false;
          syncSend();
          lxfdPersistCurrent();
        }
      }
      return;
    }

    if (window.__lxEnterpriseAuthQuery?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,lxfdRunEnterpriseAuthQuery(value));
      return;
    }

    if (window.__lxComparisonDisplay?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCompareDisplayQuery(value));
      return;
    }

    if (window.__lxServiceProducts?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunServiceProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matchCouponQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCouponProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunMemberCouponCenter(value));
      return;
    }

    if (window.__lxEducationOffers?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunEducationOfferQuery(value));
      return;
    }

    const educationAuthKind = lxfdEducationAuthKind(value);
    if (educationAuthKind) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunUnifiedAuthAnswer("education", educationAuthKind));
      return;
    }

    const solutionQuery = window.__lxIntent?.matchSolution(value);
    if (solutionQuery) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(solutionQuery.industry || ""));
      return;
    }

    if (window.__lxCustomerServiceQuery?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxCustomerServiceQuery.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{
          const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';
          ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';
          thread?.appendChild(ai);await lxfdAnimateFinal(ai,text);return ai;
        },
        card:(ai,html)=>{ai.querySelector('.lxfd-ai-body')?.insertAdjacentHTML('beforeend',html);ai.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'end'});},
        save:()=>lxfdPersistCurrent()
      }));
      return;
    }

    if (window.__lxQueryResults?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,window.__lxQueryResults.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        create:skill=>{const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now();ai.innerHTML='<div class="lxfd-ai-body"></div>';ai._traceLines=['正在调用 Skill('+skill+')'];ai._traceSkills=new Set();ai._traceCollapsed=false;thread?.appendChild(ai);lxfdRenderTraceLive(ai);return ai;},
        answer:async(ai,text,skill,status,success=true)=>{ai._traceLines=[status];ai._traceSkills=success?new Set([skill]):new Set();ai._traceCollapsed=true;await lxfdAnimateFinal(ai,text);},
        card:(ai,meta)=>{const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdPageCta({resultId:meta.resultId,title:meta.title,desc:meta.desc}));return body.querySelector('[data-lx-result-id="'+meta.resultId+'"]');},
        reveal:commit=>{lxfdPersistCurrent();lxfdExitToResultAtomically(commit);},
        save:()=>{if(thread?.querySelector('.lxfd-msg-ai'))lxfdPersistCurrent();else window.__lxSaveConversationNow?.();}
      }));
      return;
    }

    if (window.__lxGamingQuery?.matches(value)) {
      let gamingAi;
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxGamingQuery.run({
        token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{gamingAi=document.createElement('div');gamingAi.className='lxfd-msg-ai lx-chat-skin';gamingAi._loadingStarted=Date.now()-5000;gamingAi.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(gamingAi);await lxfdAnimateFinal(gamingAi,text);},
        card:products=>{chatState.lastProducts=products;const body=gamingAi.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
        open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'为你推荐',recoId}));},
        save:()=>window.__lxfdPersistCurrentNow?.()
      }));
      return;
    }

    if (lxfdIsDiscountOrderQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedDiscountOrderAnswer()));
      return;
    }
    if (lxfdIsEnterpriseLeadQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedEnterpriseLeadAnswer()));
      return;
    }
    if (lxfdIsWorkplaceAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("workplace")));
      return;
    }
    if (lxfdIsEnterpriseDiamondMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise-diamond")));
      return;
    }
    if (lxfdIsEnterpriseMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise")));
      return;
    }

    const serviceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    if (serviceProductFollowup) {
      chatState.sending = true;
      const products = typeof window.__lxServiceRecommendationProducts === "function" ? window.__lxServiceRecommendationProducts() : [];
      const region = (value.match(/所在地区是(.+?)，请推荐/) || [])[1] || "当前地区";
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      try {
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, `已按“拯救者游戏本 + **${region}** + **深度清灰/换硅脂**”匹配服务商品。你可以比较服务内容、适用性与预约方式。`)));
        const body = serviceAi.querySelector(".lxfd-ai-body");
        if (body) body.insertAdjacentHTML("beforeend", renderLxfdProducts(products, { serviceProduct: true }));
        const card = body?.querySelector("[data-lxfd-reco-id]");
        const recoId = card?.getAttribute("data-lxfd-reco-id") || "";
        await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
        lxfdPersistCurrent();
        lxfdExportToMain();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
        exitFullscreenWithReveal(() => window.__lxBridge?.revealProducts?.(products, { title: "推荐服务产品", recoId }));
      } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
        chatState.sending = false;
      }}
      return;
    }

    if (/^我的设备[。！!]?$/.test(value)) {
      chatState.sending = true;
      const deviceAi = document.createElement("div");
      deviceAi.className = "lxfd-msg-ai lx-chat-skin lx-device-query-answer";
      deviceAi._loadingStarted = Date.now();
      deviceAi._traceLines = ["联想乐享正在判断你的设备资产需求"];
      deviceAi._traceSkills = new Set();
      deviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(deviceAi);
      lxfdRenderTraceLive(deviceAi);
      deviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      deviceAi._traceLines.push("已判断：需要查询当前 Lenovo ID 下的设备资产");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      deviceAi._traceSkills.add("Skill(设备资产查询)");
      deviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(设备资产查询)");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      deviceAi._traceLines[deviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(设备资产查询) 已完成";
      deviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(deviceAi, "当前账号共有**8 台已绑定设备**，另有**1 台待绑定**。最近使用的是 ThinkBook 16p、拯救者 Y7000P、YOGA Air 14s；右侧已打开设备列表。")));
      const deviceBody = deviceAi.querySelector(".lxfd-ai-body");
      if (deviceBody) deviceBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "devices", title: "查看我的设备", desc: "8 台已绑定 · 1 台待绑定" }));
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        lxfdEnsureRootSplitState();
        if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
        else lxfdRevealFeature("devices");
      });
      return;
    }

    if (lxfdIsNearbyStoreQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedStoreAnswer()));
      return;
    }

    if (typeof window.__lxIsServiceIntakeQuery === "function" ? window.__lxIsServiceIntakeQuery(value) : /清灰|除尘|换硅脂|散热保养/.test(value)) {
      chatState.sending = true;
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi._loadingStarted = Date.now();
      serviceAi._traceLines = ["联想乐享正在判断你的设备服务需求"];
      serviceAi._traceSkills = new Set();
      serviceAi._traceCollapsed = false;
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      lxfdRenderTraceLive(serviceAi);
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      serviceAi._traceLines.push("已判断：清灰/换硅脂服务商品匹配");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      serviceAi._traceSkills.add("Skill(服务产品推荐)");
      serviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(服务产品推荐)");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      serviceAi._traceLines[serviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(服务产品推荐) 已完成";
      serviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, "已经明确是**清灰/换硅脂服务**。还需要确认**目标设备和所在地区**，才能匹配可购买、可预约的服务商品。")));
      const serviceBody = serviceAi.querySelector(".lxfd-ai-body");
      const choices = window.__lxServiceIntake && window.__lxServiceIntake.renderChoices ? window.__lxServiceIntake.renderChoices() : "";
      if (serviceBody && choices) serviceBody.insertAdjacentHTML("beforeend", choices);
      lxfdPersistCurrent();
      lxfdRenderHist();
      chatState.sending = false;
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      return;
    }

    if (/代金券/.test(value)) {
      chatState.sending = true;
      const voucherAi = document.createElement("div");
      voucherAi.className = "lxfd-msg-ai";
      voucherAi._loadingStarted = Date.now() - 5000;
      voucherAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(voucherAi);
      voucherAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(voucherAi, "已为你查询当前账户的**代金券资产**：共有 2 张可用券，分别适用于教育认证与以旧换新场景。你可以继续查看券面金额、适用范围和使用条件。")));
      const voucherBody = voucherAi.querySelector(".lxfd-ai-body");
      if (voucherBody) {
        voucherBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" }));
        voucherBody.querySelector('[data-lx-result-id="info:vouchers"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("vouchers"));
      return;
    }

    if (/限时红包|会员日红包|首发红包/.test(value)) {
      chatState.sending = true;
      const redPacketAi = document.createElement("div");
      redPacketAi.className = "lxfd-msg-ai";
      redPacketAi._loadingStarted = Date.now() - 5000;
      redPacketAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(redPacketAi);
      redPacketAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(redPacketAi, "已为你查询当前账户的**限时红包资产**：现有 2 个红包，合计 ¥84，其中 1 个将在明日到期。你可以继续查看适用活动、有效期与使用范围。")));
      const redPacketBody = redPacketAi.querySelector(".lxfd-ai-body");
      if (redPacketBody) {
        redPacketBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" }));
        redPacketBody.querySelector('[data-lx-result-id="info:redpacket"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("redpacket"));
      return;
    }

    if (/优惠券/.test(value)) {
      chatState.sending = true;
      const couponAi = document.createElement("div");
      couponAi.className = "lxfd-msg-ai";
      couponAi._loadingStarted = Date.now() - 5000;
      couponAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(couponAi);
      couponAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(couponAi, "已为你查询当前账户的**优惠券资产**：共有 3 张可用券，其中 1 张将在 7 天后到期。你可以查看每张券的使用门槛、适用范围和有效期。")));
      const couponBody = couponAi.querySelector(".lxfd-ai-body");
      if (couponBody) {
        couponBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" }));
        couponBody.querySelector('[data-lx-result-id="info:coupon"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("coupon"));
      return;
    }

    if (/乐豆|积分余额|乐豆余额/.test(value)) {
      chatState.sending = true;
      const pointsAi = document.createElement("div");
      pointsAi.className = "lxfd-msg-ai";
      pointsAi._loadingStarted = Date.now() - 5000;
      pointsAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(pointsAi);
      pointsAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(pointsAi, "已为你查询当前账户的**乐豆资产**：现有 2,580 乐豆，近 30 天获得 860、使用 300。你可以继续查看获取与使用记录，以及当前适用规则。")));
      const pointsBody = pointsAi.querySelector(".lxfd-ai-body");
      if (pointsBody) {
        pointsBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" }));
        pointsBody.querySelector('[data-lx-result-id="info:points"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("points"));
      return;
    }

    if (/会员/.test(value)) {
      chatState.sending = true;
      const profile = typeof window.__lxMemberQueryProfile === "function"
        ? window.__lxMemberQueryProfile()
        : { copy: "当前为**铂金会员**，乐豆余额**8,860豆**，可用于抵现和兑换好礼；等级权益、任务与会员活动已为你整理。", cardDesc: "会员等级 · 乐豆 · 权益与任务" };
      const memberAi = document.createElement("div");
      memberAi.className = "lxfd-msg-ai";
      memberAi._loadingStarted = Date.now() - 5000;
      memberAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(memberAi);
      memberAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(memberAi, profile.copy)));
      if (profile.enterprise) {
        chatState.sending = false;
        syncSend();
        lxfdPersistCurrent();
        return;
      }
      const memberBody = memberAi.querySelector(".lxfd-ai-body");
      if (memberBody) {
        memberBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "member", title: "查看会员中心", desc: profile.cardDesc }));
        memberBody.querySelector('[data-lx-result-id="info:member"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("member"));
      return;
    }

    // 文档解读是全屏对话内的生成任务，不走 open_documents 页面跳转快路径。
    if (lxfdIsDocumentInsight(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunDocumentInsight()));
      return;
    }

    // ── lxfd 意图路由分流 ──────────────────────────────────────────────
    // 0. 全权代买（多步任务链）意图：只做标记，不再立即退全屏（真机反馈：还没开始推流就切左右
    //    结构，右侧只有个光秃秃商城首页很突兀）。改为和普通提问一致——留在全屏走官方流式，
    //    用户看完整推荐回答；done 桥接分屏时才起链（officialWait 直接给已到手的商品，链 step1
    //    秒过），「对比→选款→下单」的执行视图在有内容可看时才出现。
    const _lxfdServiceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    const _lxfdAutoBuy = !_lxfdServiceProductFollowup && window.__lxIntent && window.__lxIntent.matchAutoBuy ? window.__lxIntent.matchAutoBuy(value) : null;

    // 1. 本地快路径（正则统一收口 app-intent.js，主面板/全屏共用一份，改一处两边同时生效）
    // 代买时跳过：句里"对比/下单"字样会被误判成 control 操作抢断官方推荐流（同主面板 _autoBuy 防护）
    const _lxfdLocalCtrl = !_lxfdAutoBuy && window.__lxIntent ? window.__lxIntent.matchControl(value) : null;
    if (_lxfdLocalCtrl) {
      if (_lxfdLocalCtrl.op === "open_solution") {
        await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(_lxfdLocalCtrl.industry || ""));
        return;
      }
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      _lxfdCtrlText.textContent = _lxfdLocalCtrl.msg;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      // 执行操作：通过 __lxExecControl 桥（全屏态 lxExecControl 不在此作用域）
      const _execOp = _lxfdLocalCtrl.op;
      const _execTarget = _lxfdLocalCtrl.target;
      const _execPageMeta = lxfdPageCtaMeta(_execOp);
      if (_execPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_execPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_execPageMeta.feature);
        });
        return;
      }
      if (_execOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_execOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_execOp, _execTarget);
      }
      return;
    }

    // 思考过程时间线（件2）：气泡必须在远程意图路由 fetch **之前**上屏——路由最长 4.5s，
    // 放在后面用户盯着空白（真机反馈）。首行"正在判断"发送瞬间出现，"已判断"等路由分流
    // 落定再追加（走 control 分支时整个气泡移除）。渲染复用主面板 renderSkillTrace 桥接。
    const _traceLines = ["联想乐享正在判断"]; // 省略号由 .current::after 三点循环动画补，文本不写死
    const _renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = `<div class="lxfd-ai-body">${_renderTrace ? _renderTrace(_traceLines, { collapsed: false, foldable: false, skillCount: 0 }) : ""}</div>`;
    ai._raw = "";
    ai._loadingStarted = Date.now();
    ai._traceLines = _traceLines;
    ai._traceSkills = new Set();
    ai._traceCollapsed = false;
    ai._traceLastRaw = "";
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    const _lxfdPushJudged = () => {
      if (ai._judgedPushed) return;
      ai._judgedPushed = true;
      _traceLines.push(_lxfdAutoBuy ? "已判断：多步代买任务，推荐完成后进入执行视图" : "已判断：商品咨询 → 调用联想乐享官方 SKILL");
      lxfdRenderTraceLive(ai);
    };

    // 2. 远程意图路由器（代买时跳过：分类器可能把"选/下单"误判成 control 操作抢断推荐流，同主面板）
    let _lxfdIntentResult = null;
    if (!_lxfdAutoBuy) try {
      const _lxfdIntentAbort = new AbortController();
      const _lxfdIntentTimer = window.__lxGeneration.timeout(__lxGenerationToken,() => _lxfdIntentAbort.abort(), 4500);
      const _lxfdIntentRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: _lxfdIntentAbort.signal
      })));
      clearTimeout(_lxfdIntentTimer);
      if (_lxfdIntentRes.ok) _lxfdIntentResult = await window.__lxGeneration.wait(__lxGenerationToken,(_lxfdIntentRes.json()));
    } catch (_lxfdIntentErr) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError'); /* 超时/失败 → 降级 chat */ }
    if (_lxfdIntentResult && _lxfdIntentResult.type === "control" && _lxfdIntentResult.op) {
      ai.remove(); // 操作指令：撤掉"正在判断"时间线气泡，走操作确认消息（同主面板做法）
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      const _lxfdOpNames = { close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面", open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询", open_edu_zone: "打开了教育专区", open_documents: "打开了文档解读与资料中心", open_product: `正在帮你打开「${_lxfdIntentResult.target || "该商品"}」`, enter_fullscreen: "切换到全屏对话模式（当前已在全屏）", exit_fullscreen: "退出了全屏模式" };
      _lxfdCtrlText.textContent = `好的，已为你${_lxfdOpNames[_lxfdIntentResult.op] || "执行了操作"}。`;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      const _lxfdExecOp = _lxfdIntentResult.op;
      const _lxfdExecTarget = _lxfdIntentResult.target || "";
      const _lxfdPageMeta = lxfdPageCtaMeta(_lxfdExecOp);
      if (_lxfdPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_lxfdPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_lxfdPageMeta.feature);
        });
        return;
      }
      if (_lxfdExecOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_lxfdExecOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_lxfdExecOp, _lxfdExecTarget);
      }
      return;
    }
    // ── lxfd 意图路由分流结束 ─────────────────────────────────────────

    // 走到这里说明不是操作指令：补"已判断"行——意图路由刚落定，天然有 0.5~4.5s 节奏，
    // 不和首行同帧蹦出；代买跳过了意图路由没有天然节奏，给 500ms 微延迟（同主面板做法）。
    if (_lxfdAutoBuy) window.__lxGeneration.timeout(__lxGenerationToken,_lxfdPushJudged, 500); else _lxfdPushJudged();
    const body = ai.querySelector(".lxfd-ai-body");
    const nonce = chatState.conversationNonce;
    chatState.sending = true;
    let hasContent = false;
    const revealAi = () => {
      if (hasContent) return;
      hasContent = true;
      body?.querySelector(".lxfd-typing, .loading-line")?.remove();
      ai._textBox = document.createElement("div");
      ai._textBox.className = "lxfd-ai-text";
      if (body) body.insertBefore(ai._textBox, body.firstChild);
      ai._raw = "";
      ai._writer = window.__lxCreateTypewriter(ai._textBox, {
        charsPerTick: 1,
        interval: 24,
        scroll: () => {
          if (thread) thread.scrollTop = thread.scrollHeight;
        }
      });
    };
    // lxfd 前端兜底超时：50秒后强制解锁
    const _lxfdSendTimeout = window.__lxGeneration.timeout(__lxGenerationToken,() => {
      if (chatState.sending && chatState.conversationNonce === nonce) {
        chatState.sending = false;
        ai._raw = "响应超时，请重试。";
        lxfdAnimateFinal(ai, ai._raw);
      }
    }, 50000);
    try {
      chatState._fallbackFired = false;
      // 代买句剥成交短语再发官方（「直接下单」会触发官方下单 Skill 不回商品清单），收口 app-intent 与主面板共用
      const _lxfdAskText = _lxfdAutoBuy && window.__lxIntent && window.__lxIntent.stripPurchasePhrase
        ? window.__lxIntent.stripPurchasePhrase(value)
        : value;
      const sendMsg = chatState.human
        ? ('[系统提示: 请以"专属客服小联"身份回复, 像人工客服一样亲切自然简短直接, 不用 markdown/列表/标题, 不暴露 AI 身份, 严禁输出"QA对""知识库""参考资料"等内部字样或📎等标记。]\n\n用户问: ' + value)
        : _lxfdAskText;
      const lxfdImgUrl = window.__lxfdPendingImage || undefined;
      window.__lxfdPendingImage = null;
      const imgTipEl = document.querySelector('.lxfd-img-tip');
      if (imgTipEl) imgTipEl.remove();
      const lxfdUseHuoshan = !!lxfdImgUrl || !!window.__lxWebSearch;
      const response = lxfdUseHuoshan
        ? await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              image_url: lxfdImgUrl,
              web_search: !!window.__lxWebSearch,
              thinking_mode: !!window.__lxThinking,
              conv_id: chatState.convId || undefined
            })
          })))
        : await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              sessionId: chatState.convId || undefined,
              site: document.body.dataset.page || 'personal',
              enableThinking: !!window.__lxThinking,
              ...(window.__lxGeo || {})
            })
          })));
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const lxfdHandlers = {
        chunk: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          const content = payload.text || data || "";
          if (/^\s*params\s*error\.?\s*$/i.test(content)) return;
          if (!content) return;
          // 首个 chunk 到达：思考过程时间线收起成一行摘要条，把舞台让给正文（同主面板）
          if (!ai._traceCollapsed) { ai._traceCollapsed = true; lxfdRenderTraceLive(ai); }
          hasContent = true;
          ai._raw += content;
        },
        status: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
          if (payload.text) {
            const raw = String(payload.text);
            if (raw !== ai._traceLastRaw) { // 去重相邻重复（官方 status 流常见连续重复 ping）
              ai._traceLastRaw = raw;
              const skillMatch = raw.match(/^(正在获取数据|已获取数据):(Skill\(.+\))$/);
              let line = raw;
              if (skillMatch) {
                ai._traceSkills.add(skillMatch[2]);
                line = skillMatch[1] === "正在获取数据"
                  ? `联想乐享官方 SKILL：正在调用 ${skillMatch[2]}`
                  : `联想乐享官方 SKILL：${skillMatch[2]} 已完成`;
              }
              ai._traceLines.push(line);
              lxfdRenderTraceLive(ai);
            }
          }
        },
        products: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (!/(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i.test(String(value || ""))) return;
          const payload = parseJson(data);
          let products = payload.products || [];
          // 用户点名要N款(2-6)而官方固定回5-6款 → 按要求截断
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (!products.length) return;
          hasContent = true;
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品以便 done 时桥接到主面板
          turnProducts = products;
          chatState.lastProducts = products;
          chatState.lastProductsMeta = { title: "AI 推荐", grouped: false };
        },
        display: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (!/(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i.test(String(value || ""))) return;
          const payload = parseJson(data);
          let products = payload.products || payload.items || [];
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (products.length || payload.title) hasContent = true;
          if (payload.title && !ai._raw) {
            ai._raw = payload.title;
          }
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品及展示元信息以便 done 时桥接到主面板
          if (products.length) {
            turnProducts = products;
            turnTitle = payload.title || "";
            turnGrouped = !!payload.grouped;
            chatState.lastProducts = products;
            chatState.lastProductsMeta = { title: turnTitle, grouped: turnGrouped };
          }
        },
        clicks: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const list = (parseJson(data).clicks) || [];
          if (!list.length || !body) return;
          pendingExtras += '<div class="leai-clicks" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + list.map((c) =>
            `<button type="button" class="leai-click-btn" data-leai-url="${escapeAttr(c.link_url || "")}" data-leai-cb="${escapeAttr(c.callback_data || "")}" data-leai-event="${escapeAttr(c.event_type || "")}">${escapeHtml(c.display_text)}</button>`
          ).join("") + "</div>";
        },
        suggestions: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          pendingFollowups = (payload.suggestions || []).filter(Boolean).slice(0, 3);
        },
        action: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const { op } = parseJson(data) || {};
          const pageMeta = lxfdPageCtaMeta(op);
          if (pageMeta) {
            if (pageMeta.feature === "solution") pendingExtras += renderLxfdLeadCta();
            pendingExtras += renderLxfdPageCta(pageMeta);
            if (turnActions.indexOf(pageMeta.feature) < 0) turnActions.push(pageMeta.feature);
          } else if (op === 'auth') {
            // 职场认证与教育认证统一使用标准结果卡，点击后直接打开认证弹窗。
            pendingExtras += `<button class="answer-cta lx-answer-page lx-auth-answer-card" type="button" data-open-wpa aria-label="打开职场身份认证弹窗">
              <span class="answer-cta-copy">
                <span class="answer-cta-title">职场身份认证</span>
                <span class="answer-cta-desc">认证后享购机优惠、AI 资源与专属权益</span>
              </span>
              <span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span>
            </button>`;
          } else if (op) {
            if (turnActions.indexOf(op) < 0) turnActions.push(op); // 记录意图，done 时桥接后再执行（全屏下直接开标签会被遮盖）
          }
        },
        control: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data) || {};
          // 页面操作（关标签/回首页/开订单等）：桥接到主面板执行
          if (payload.op && typeof window.__lxExecControl === 'function') window.__lxExecControl(payload.op, payload.target);
        },
        done: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (finalized) return;
          finalized = true;
          finalizePromise = (async () => {
            window.clearTimeout(_lxfdSendTimeout);
            const payload = parseJson(data);
            if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
            await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
            const finalBody = ai.querySelector(".lxfd-ai-body");
            if (pendingExtras && finalBody) { finalBody.insertAdjacentHTML("beforeend", pendingExtras); if (thread) thread.scrollTop = thread.scrollHeight; }
            if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
            pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
            if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
            lxfdPersistCurrent();
            lxfdRenderHist();
            const isFullscreen = document.body.classList.contains("assistant-fullscreen");
            // 代买任务：推荐回答已在全屏展示完，此刻才切执行视图起链（真机反馈：不能一发问就分屏）。
            // officialWait 直接给已到手的商品，链 step1 秒过进入「对比→选款→下单」。
            if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // 链卡走裸 addMessage，需先补分屏布局（老坑：不补则背景停在欢迎门户，链卡在 DOM 里看不见）
                if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
                window.__lxRunChain("auto_buy_official", {
                  maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
                  minPrice: _lxfdAutoBuy.params.minPrice || 0,
                  officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
                  rawText: value
                });
                if (thread) thread.innerHTML = "";
              });
            } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
              // 官方带回商品 → 自动桥接分屏右侧展示（所推即所见）；只有纯 action 无商品才走功能页桥接
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
                turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：门店/优惠/会员标签全开
                if (thread) thread.innerHTML = "";
              });
            } else if (turnActions.length && isFullscreen && window.__lxBridge) {
              // 本轮只有意图无商品：同样桥接退全屏，再开功能标签
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // lxfdRevealFeature 内部会先 lxfdEnsureRootSplitState 补首页分屏布局
                // （不做这步 .shell 仍 display:none → 功能标签渲染了但主面板隐藏=空白）
                turnActions.forEach((op) => lxfdRevealFeature(op));
                if (thread) thread.innerHTML = "";
              });
            }
          })();
        },
        fallback: async () => {
          if (nonce !== chatState.conversationNonce) return;
          if (chatState._fallbackFired) return;
          chatState._fallbackFired = true;
          try {
            const huoRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,'/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: sendMsg, conv_id: chatState.convId || undefined })
            })));
            if (!huoRes.ok || !huoRes.body) throw new Error('fallback upstream ' + huoRes.status);
            await window.__lxGeneration.wait(__lxGenerationToken,(readSse(huoRes, lxfdHandlers)));
          } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
            ai._raw = '当前服务暂时不可用，请稍后再试。';
            if (!finalized) {
              finalized = true;
              finalizePromise = lxfdAnimateFinal(ai, ai._raw);
            }
          }
        }
      };
      await window.__lxGeneration.wait(__lxGenerationToken,(readSse(response, lxfdHandlers)));
      if (nonce !== chatState.conversationNonce) return;
      if (finalizePromise) {
        await window.__lxGeneration.wait(__lxGenerationToken,(finalizePromise));
      } else if (!finalized) {
        finalized = true;
        if (!hasContent && !ai._raw && !pendingExtras) {
          ai._raw = "我已经收到请求，可以继续补充预算、用途或偏好的机型。";
        }
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
        const finalBody = ai.querySelector(".lxfd-ai-body");
        if (pendingExtras && finalBody) finalBody.insertAdjacentHTML("beforeend", pendingExtras);
        if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
        pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
        if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
        lxfdPersistCurrent();
        lxfdRenderHist();
        const isFullscreen = document.body.classList.contains("assistant-fullscreen");
        // 与上方 done 分支同一条规则：代买起链 > 有商品分屏展示 > 纯 action 功能页桥接。
        if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
            window.__lxRunChain("auto_buy_official", {
              maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
              minPrice: _lxfdAutoBuy.params.minPrice || 0,
              officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
              rawText: value
            });
            if (thread) thread.innerHTML = "";
          });
        } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
            turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：标签全开（同 done 分支）
            if (thread) thread.innerHTML = "";
          });
        } else if (turnActions.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            turnActions.forEach((op) => lxfdRevealFeature(op));
            if (thread) thread.innerHTML = "";
          });
        }
      }
    } catch (error) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
      console.error("[lxfd] submit 流程异常（此前静默吞掉，排障困难）:", error);
      if (nonce !== chatState.conversationNonce) return;
      ai._raw = "当前 AI 服务暂时不可用，请稍后重试。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      clearTimeout(_lxfdSendTimeout);
      if (nonce === chatState.conversationNonce) chatState.sending = false;
      ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  window.lxfdSubmit = submit;
  window.lxfdReset = resetConversation;
  // 分屏→全屏回退：关空右侧 tab 时带入主面板对话回全屏
  window.__lxfdEnterFromSplit = function() {
    if (thread) thread.innerHTML = "";
    enterFullscreen();  // enterFullscreen 内检测到 thread 空会自动 lxfdImportFromMain
  };
  // 新建对话回全屏欢迎态
  window.__lxfdNewFullscreen = function() {
    resetConversation(true);
    enterFullscreen();
  };

  convoPill?.addEventListener("click", () => setNav(!navCluster.classList.contains("open")));
  navCluster?.addEventListener("mouseenter", () => { clearTimeout(hoverTimer); });
  navCluster?.addEventListener("mouseleave", () => { clearTimeout(hoverTimer); setNav(false); });
  $$("#lxfdNavSheet a").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    $$("#lxfdNavSheet a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    setNav(false);
    const path = navPaths[a.dataset.page] || "/";
    const currentPath = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
    const targetPath = path.endsWith("/") ? path : `${path}/`;
    if (currentPath === targetPath) location.reload();
    else location.assign(path);
  }));
  document.addEventListener("click", (e) => { if (navCluster && !navCluster.contains(e.target)) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setNav(false); if (!wide()) setRailManual(false); } });
  railFab?.addEventListener("click", () => setRailManual(true));
  $("#lxfdRailClose")?.addEventListener("click", () => setRailManual(false));
  $(".lxfd-actions")?.addEventListener("click", (e) => {
    const accountAction = e.target.closest(".lxfd-account-menu [data-account-action]");
    if (accountAction) {
      const action = accountAction.dataset.accountAction || "";
      accountAction.closest(".lxfd-account-wrap")?.classList.remove("open");
      if (action === "member") {
        e.preventDefault();
        e.stopPropagation();
        submit("会员中心");
        return;
      }
    }
    const button = e.target.closest(".lxfd-ic");
    if (!button) return;
    const label = button.getAttribute("aria-label") || "";
    if (button.dataset.lxfdOpen === "cart" || label.includes("购物车")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("cart", { sendQuery: true });
      return;
    }
    if (button.dataset.lxfdOpen === "orders" || label.includes("订单")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("orders", { sendQuery: true });
      return;
    }
    // 首页空白态胶囊里的历史入口（必须在兜底 exitFullscreen 之前拦下）：
    // 开「历史记录」弹窗（与分屏同款），不拉左侧 rail（真机反馈）
    if (button.id === "lxfdTopHistBtn" || label.includes("历史")) {
      e.preventDefault();
      if (window.__lxBridge && typeof window.__lxBridge.openHistoryModal === "function") window.__lxBridge.openHistoryModal();
      else setRailManual(true);
      return;
    }
    e.preventDefault();
    exitFullscreen();
  });
  scrim?.addEventListener("click", () => setRailManual(false));
  function lxfdStartNewConversation(collapseRail) {
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    resetConversation(!!collapseRail);
    if (logicalPath !== "/") {
      // 子频道的全屏新建对话是“收起回当前频道新对话”，
      // 不是停留在全屏欢迎态。复用同一收起动画与主面板 reset 链路。
      exitFullscreenWithReveal(() => window.__lxBridge?.newConversationInCurrentChannel?.());
    }
  }
  $("#lxfdNewChat")?.addEventListener("click", () => lxfdStartNewConversation(true));
  // 全屏左侧悬浮“＋”与历史栏内“新建对话”必须是同一语义；此前这里只清空
  // lxfd thread，导致用户仍停在全屏而没有回到当前频道首页。
  railNewFab?.addEventListener("click", () => lxfdStartNewConversation(false));
  historySearch?.addEventListener("input", () => lxfdRenderHist(historySearch.value));
  $("#lxfdHist")?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-conv-item]");
    const action = e.target.closest(".lxfd-hist-action");
    if (action && item) {
      e.preventDefault();
      e.stopPropagation();
      const id = item.dataset.convItem;
      if (action.dataset.action === "delete" && !window.confirm("确认删除这条历史对话吗？")) return;
      lxfdUpdateConversation(id, action.dataset.action);
      return;
    }
    const a = e.target.closest("a[data-conv]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.conv) lxfdLoadConv(a.dataset.conv);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lxfd-hist-item")) return;
    $$(".lxfd-hist-item.menu-open").forEach(node => { node.classList.remove("menu-open"); node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openItem = $(".lxfd-hist-item.menu-open");
    if (!openItem) return;
    openItem.classList.remove("menu-open");
    const trigger = openItem.querySelector(".lxfd-hist-more");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  });
  $$(".lxfd-comp-left .lxfd-toggle").forEach(btn => btn.addEventListener("click", () => { const on = btn.classList.toggle("on"); btn.setAttribute("aria-pressed", on ? "true" : "false"); if (btn.textContent.includes("深度思考")) window.__lxThinking = on; if (btn.textContent.includes("联网")) window.__lxWebSearch = on; }));
  // lxfd 图片上传
  const lxfdImgBtn = document.querySelector('.lxfd-img-btn');
  if (lxfdImgBtn) {
    const lxfdFileInput = document.createElement('input');
    lxfdFileInput.type = 'file';
    lxfdFileInput.accept = 'image/*';
    lxfdFileInput.style.display = 'none';
    lxfdFileInput.id = 'lxfdFileInput';
    document.body.appendChild(lxfdFileInput);
    lxfdImgBtn.addEventListener('click', () => lxfdFileInput.click());
    lxfdFileInput.addEventListener('change', async () => {
      const file = lxfdFileInput.files && lxfdFileInput.files[0];
      if (!file) return;
      lxfdFileInput.value = '';
      try {
        lxfdImgBtn.disabled = true;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data && data.url) {
          window.__lxfdPendingImage = data.url;
          const dock = document.querySelector('.lxfd-dock');
          let imgTip = dock && dock.querySelector('.lxfd-img-tip');
          if (!imgTip && dock) {
            imgTip = document.createElement('div');
            imgTip.className = 'lxfd-img-tip';
            imgTip.style.cssText = 'font-size:12px;color:#979797;padding:4px 12px;display:flex;align-items:center;gap:6px';
            dock.insertBefore(imgTip, dock.querySelector('.lxfd-composer'));
          }
          if (imgTip) {
            imgTip.innerHTML = '<span>已添加图片</span><button type="button" style="border:none;background:none;cursor:pointer;color:#b8252e;font-size:12px" id="lxfdImgClear">×</button>';
            const clearBtn = imgTip.querySelector('#lxfdImgClear');
            if (clearBtn) clearBtn.addEventListener('click', () => { window.__lxfdPendingImage = null; imgTip.remove(); });
          }
        }
      } catch (_e) {
        // 上传失败静默处理
      } finally {
        lxfdImgBtn.disabled = false;
      }
    });
  }

  (function initLxfdHomeGallery() {
    const data = {
      new: [
        { nm: "拯救者 Y9000P 2026", ds: "i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏", price: "15,098", badge: "新品首发", wm: "LEGION Y9000P", img: "../img/lxfd-gallery-1-1.jpg", g: "linear-gradient(135deg,#252525,#4d144a 58%,#625b68)", q: "请解读这款商品：拯救者 Y9000P 2026，配置是 i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏，价格约 ¥15,098，适合什么人买？" },
        { nm: "YOGA Air 14c 2026", ds: "酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控", price: "8,999", badge: "轻薄旗舰", wm: "YOGA Air 14c", img: "../img/lxfd-gallery-1-2.jpg", g: "linear-gradient(135deg,#252525,#625b68 58%,#979797)", q: "请解读这款商品：YOGA Air 14c 2026，配置是酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控，价格约 ¥8,999，适合什么人买？" },
        { nm: "小新Pad Pro 13英寸", ds: "酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄", price: "7,299", badge: "全能之选", wm: "Xiaoxin Pro16", img: "../img/lxfd-gallery-1-3.jpg", g: "linear-gradient(135deg,#0c2342,#252525 58%,#48d39e)", q: "请解读这款商品：小新Pad Pro 13英寸，配置是酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄，价格约 ¥7,299，适合什么人买？" }
      ],
      act: [
        { nm: "618 年中钜惠", ds: "全场至高省 2000，下单再享 12 期免息", price: "省 2000", isText: true, badge: "限时", wm: "618 SALE", g: "linear-gradient(135deg,#252525,#b8252e 56%,#e42b20)", q: "618 年中钜惠有什么优惠？怎么参加？" },
        { nm: "教育优惠季", ds: "学生 / 教师认证，专属机型至高 9 折", price: "享 9 折", isText: true, badge: "进行中", wm: "EDU SEASON", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育优惠季怎么参加？学生认证有哪些优惠？" },
        { nm: "以旧换新", ds: "旧机抵扣 + 平台补贴，至高补 800 元", price: "补 800", isText: true, badge: "可叠加", wm: "TRADE-IN", g: "linear-gradient(135deg,#252525,#625b68 58%,#48d39e)", q: "以旧换新怎么操作？旧机能抵多少钱？" }
      ],
      news: [
        { nm: "联想 2026 拯救者全系发布", ds: "搭载新一代 AI 引擎与超频引擎，性能再进阶", price: "查看全文", isText: true, badge: "官方", wm: "PRESS", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#625b68)", q: "联想 2026 拯救者全系发布了哪些新品？有什么亮点？" },
        { nm: "联想 AI PC 出货领跑行业", ds: "IDC 最新报告：中国 AI PC 市场份额持续第一", price: "查看全文", isText: true, badge: "行业", wm: "INSIGHT", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "联想 AI PC 有哪些优势？为什么市场份额第一？" },
        { nm: "联想乐享门店破 5000 家", ds: "线下服务网络全面升级，到店体验更进一步", price: "查看全文", isText: true, badge: "动态", wm: "RETAIL", g: "linear-gradient(135deg,#252525,#625b68 58%,#bcb4c1)", q: "联想门店能提供哪些服务？帮我找附近门店。" }
      ],
      case: [
        { nm: "某重点高校机房方案", ds: "1200 台统一部署与运维，开机即用，集中管理", price: "教育行业", isText: true, badge: "已交付", wm: "CAMPUS", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育行业的机房统一部署方案是怎么做的？" },
        { nm: "设计工作室创作方案", ds: "ThinkStation + 校色屏整体方案，效率提升 40%", price: "创意设计", isText: true, badge: "标杆", wm: "STUDIO", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#a262d7)", q: "设计创作行业有什么整体方案？ThinkStation 怎么配？" },
        { nm: "连锁零售 POS 升级", ds: "300+ 门店终端统一焕新，稳定支撑高峰交易", price: "零售行业", isText: true, badge: "规模化", wm: "RETAIL POS", g: "linear-gradient(135deg,#252525,#5b1452 58%,#e42b20)", q: "连锁零售门店终端怎么统一升级？有什么方案？" }
      ]
    };
    const root = document.querySelector(".lxfd-home-gallery");
    const grid = document.getElementById("lxfdGalleryGrid");
    const tabs = Array.from(document.querySelectorAll("[data-gallery-tab]"));
    const ink = document.getElementById("lxfdGalleryInk");
    if (!root || !grid || !tabs.length) return;
    const price = (item) => item.isText ? escapeHtml(item.price) : "¥" + escapeHtml(item.price);
    const card = (item) => {
      const shotClass = item.img ? "gallery-shot has-image" : "gallery-shot";
      const inner = item.img
        ? '<img class="gallery-img" src="' + escapeAttr(item.img) + '" alt="" loading="eager" />'
        : '<span class="gallery-lid"></span><span class="gallery-wm">' + escapeHtml(item.wm) + '</span>';
      return '<article class="gallery-card is-preview-only" aria-disabled="true"><div class="' + shotClass + '" style="background:' + escapeAttr(item.g) + '">' + inner + '</div>'
        + '<div class="gallery-meta"><span class="gallery-badge">' + escapeHtml(item.badge) + '</span><strong class="gallery-name">' + escapeHtml(item.nm) + '</strong><span class="gallery-desc">' + escapeHtml(item.ds) + '</span>'
        + '<div class="gallery-foot"><span class="gallery-price">' + price(item) + '</span><span class="gallery-go" aria-hidden="true">了解 →</span></div></div></article>';
    };
    // 首页内容卡当前仅作预览：保留 CSS hover，点击与键盘操作均不发送对话。
    grid.addEventListener("click", (e) => {
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    const moveInk = () => {
      const active = root.querySelector(".gallery-tab.is-active");
      if (active && ink) {
        ink.style.left = active.offsetLeft + "px";
        ink.style.width = active.offsetWidth + "px";
      }
    };
    const render = (key, animate) => {
      if (!data[key]) key = "new";
      if (!animate) {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
        return;
      }
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
      }, 120);
    };
    const activateTab = (tab) => {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      moveInk();
      render(tab.dataset.galleryTab, true);
    };
    tabs.forEach((tab) => {
      tab.addEventListener("pointerenter", () => activateTab(tab));
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("focus", () => activateTab(tab));
    });
    render("new", false);
    requestAnimationFrame(moveInk);
    window.addEventListener("resize", moveInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  })();

  (function initLxfdScopeActions() {
    const scope = document.getElementById("lxfdScopeActions");
    const more = document.getElementById("lxfdScopeMore");
    const moreBtn = more?.querySelector(".lxfd-scope-more-btn");
    const close = () => {
      more?.classList.remove("open");
      moreBtn?.setAttribute("aria-expanded", "false");
    };
    if (scope) {
      scope.addEventListener("click", (event) => {
        const chip = event.target.closest(".lxfd-scope-chip");
        if (!chip) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        const label = chip.textContent.trim();
        if (!label) return;
        submit(LXFD_ACTION_Q[label] || label);
      });
    }
    if (more && moreBtn) {
      const open = () => {
        more.classList.add("open");
        moreBtn.setAttribute("aria-expanded", "true");
      };
      more.addEventListener("pointerenter", open);
      more.addEventListener("pointerleave", close);
      moreBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = !more.classList.contains("open");
        if (shouldOpen) open(); else close();
      });
      document.addEventListener("click", (event) => { if (!more.contains(event.target)) close(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }
  })();

  ta?.addEventListener("input", () => { fit(); syncSend(); });
  ta?.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(window.__lxRecommendationFollowups?.prepare(ta.value,ta) ?? ta.value); } });
  $("#lxfdComposer")?.addEventListener("submit", (e) => { e.preventDefault(); submit(window.__lxRecommendationFollowups?.prepare(ta.value,ta) ?? ta.value); });
  chips?.addEventListener("click", (e) => {
    const b = e.target.closest(".lxfd-chip-q");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    submit(b.dataset.q || b.textContent);
  });
  quick?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (b.textContent.trim() === "退出人工") { lxfdExitHuman(); return; }
    submit(LXFD_ACTION_Q[b.textContent.trim()] || b.textContent);
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd .answer-cta, .lxfd [data-lx-result-id], .lxfd [data-lxfd-reveal-products], .lxfd [data-lx-focus-reco], .lxfd [data-lxfd-open-feature], .lxfd [data-lx-focus-active], .lxfd [data-lx-open-tab], .lxfd [data-specific-solution-cta]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (btn.hasAttribute("data-open-enterprise-auth-modal") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-member-auth") {
      window.__lxOpenEnterpriseAuthModal?.();
      return;
    }
    if (btn.hasAttribute("data-open-enterprise-lead") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-lead") {
      window.openLeadPanel?.();
      return;
    }
    const studentAuthKind = btn.getAttribute("data-open-stuauth");
    if (studentAuthKind) {
      window.__lxAgentAPI?.openStudentAuth?.(studentAuthKind);
      return;
    }
    if (btn.hasAttribute("data-open-wpa")) {
      window.openWorkplaceAuth?.();
      return;
    }
    if (btn.hasAttribute("data-open-payment-confirm")) {
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
      return;
    }
    const feature = btn.getAttribute("data-lxfd-open-feature") || "";
    const boundTabId = btn.getAttribute("data-lx-open-tab") || "";
    const resultId = btn.getAttribute("data-lx-result-id") || "";
    const solutionTitle = btn.getAttribute("data-specific-solution-cta") || "";
    const recoId = btn.getAttribute("data-lxfd-reco-id") || "";
    const openProduct = btn.getAttribute("data-open-product") || "";
    const targetTabId = resultId || (solutionTitle
      ? `info:solution-detail:${solutionTitle}`
      : (boundTabId || (feature === "solution" ? "info:solution" : "")));
    const storedProducts = recoId && window.__lxRecoPayloads && Array.isArray(window.__lxRecoPayloads[recoId])
      ? window.__lxRecoPayloads[recoId]
      : [];
    const recoTab = (window.__lxState?.tabs || []).find((item) => item && (item.kind === "reco" || item.id === "reco") && Array.isArray(item.products) && item.products.length);
    const products = storedProducts.length
      ? storedProducts
      : ((chatState.lastProducts && chatState.lastProducts.length) ? chatState.lastProducts : (recoTab?.products || []));
    // 收起前先锁定卡片目标。分屏恢复后精确激活对应标签，不能再由 focusReco 猜测当前页。
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (inFullscreen) {
      const commitCapturedResult = () => {
        lxfdEnsureRootSplitState();
        if (window.__lxBridge?.restoreResultCard?.(btn)) return;
        if (targetTabId && window.__lxBridge?.restoreResultTab?.(targetTabId)) return;
        if (lfxdReplayImportedResultCard({ resultId, boundTabId, solutionTitle, recoId, openProduct, feature })) return;
        if (targetTabId && window.__lxBridge?.activateTab?.(targetTabId)) return;
        if (feature) lxfdRevealFeature(feature);
        else if (products.length) window.__lxBridge?.revealProducts?.(products, { title: "AI 推荐", recoId });
      };
      lxfdExitToResultAtomically(commitCapturedResult);
      return;
    }
    // 功能卡片在全屏态与左右分栏态都走同一入口；标签关闭后可重新创建。
    if (feature) {
      lxfdOpenFeatureInSplit(feature);
      return;
    }
    if (btn.hasAttribute("data-lx-focus-active") && !btn.hasAttribute("data-lx-focus-reco")) return;
  }, true);
  thread?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd-followups button, .lxfd-ai-body .followups button, .lxfd-ai-body .lx-p0-suggest[data-followups] button, .lxfd-ai-body [data-quick-ask]");
    if (!btn) return;
    e.preventDefault();
    const text = btn.getAttribute("data-quick-ask") || btn.textContent.replace(/→\s*$/, "").trim();
    if (text) submit(text);
  });
  turnList?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const target = document.getElementById(b.dataset.target); if (!target) return; renderTurnIndex(target.id); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); });
  window.addEventListener("resize", () => { if (document.body.classList.contains("assistant-fullscreen")) syncRailForViewport(); });

  // 职场认证按钮（lxfd 内的 data-open-wpa 委托）
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-wpa]")) {
      if (typeof window.openWorkplaceAuth === "function") window.openWorkplaceAuth();
    }
  });

  // 官方动作按钮（转人工/在线客服等）点击：human_access→进客服模式，有链接开新窗口，否则把 callback_data 当问题继续问
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-leai-url], [data-leai-cb]");
    if (!btn) return;
    e.preventDefault();
    const ev = btn.getAttribute("data-leai-event");
    if (ev === "human_access") {
      if (document.body.classList.contains("assistant-fullscreen")) {
        lxfdEnterHuman();
      } else if (typeof window.__lxSetHuman === "function") {
        window.__lxSetHuman(true);
      }
      return;
    }
    const url = btn.getAttribute("data-leai-url");
    const cb = btn.getAttribute("data-leai-cb");
    if (url) { window.open(url, "_blank", "noopener"); return; }
    if (cb && typeof window.lxfdSubmit === "function" && document.body.classList.contains("assistant-fullscreen")) window.lxfdSubmit(cb);
  });

  setTimeout(startRotatingTitle, reduceMotion ? 0 : 2000);
  syncSend();
  lxfdRenderHist();
  // P0 多频道会话互通：首页重新进入时，把共享主面板已恢复的完整会话导入全屏线程。
  if (window.__LX_TEMPLATE_PAGE === "home") {
    window.setTimeout(function () {
      if (!lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) return;
      lxfdImportFromMain();
      setFullscreen(true);
    }, 0);
  }

  document.addEventListener("click", (e) => {
    const fsToggle = e.target.closest(".assistant-toggle");
    if (fsToggle) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      enterFullscreen();
      return;
    }
    const heroChip = e.target.closest(".hero-suggestion");
    const fullPrompt = e.target.closest(".fullscreen-prompt");
    if (heroChip || fullPrompt) {
      const target = heroChip || fullPrompt;
      const text = (target.querySelector("span")?.textContent || target.textContent).trim();
      if (text) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(text); }
    }
  }, true);
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.(".hero-composer");
    if (!form) return;
    const txt = form.querySelector("textarea")?.value.trim() || form.querySelector("textarea")?.placeholder || "最近有什么优惠活动？";
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(txt);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("assistant-fullscreen")) requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/split-frame-composer-sync.js */
window.__p0Modules.sources["u926ad1389ae82d55"]=function(){
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
      send.disabled = !textarea.value.trim() && !window.__lxRecommendationFollowups?.hasSelection();
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

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/composer-association-popup-toggle-v106.js */
window.__p0Modules.sources["ue9442aa8c670f435"]=function(){
(function () {
  "use strict";

  // Composer associations use the original keyword and progressive completion flow.
  // Enabled by default for fullscreen and split-screen composers.
  window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = true;

  const SELECTOR = ".lx-suggest-panel";
  const STYLE_ID = "lx-composer-association-popup-off";

  function associationsEnabled() {
    return window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ === true;
  }

  function removePanels(root) {
    if (associationsEnabled()) return;
    if (root instanceof Element && root.matches(SELECTOR)) root.remove();
    root?.querySelectorAll?.(SELECTOR).forEach((panel) => panel.remove());
  }

  function syncStyle() {
    let style = document.getElementById(STYLE_ID);
    if (associationsEnabled()) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = window.__p0Modules.styleText("/@script-style/4fd209db9c845d79e6004da4.css");
      document.head.appendChild(style);
    }
  }

  function disableAssociationPanels() {
    syncStyle();
    removePanels(document);
    window.__lxHideSuggest?.();
  }

  const observer = new MutationObserver((records) => {
    if (associationsEnabled()) return;
    records.forEach((record) => record.addedNodes.forEach((node) => removePanels(node)));
  });

  function start() {
    disableAssociationPanels();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__lxSetComposerAssociationsEnabled = function (enabled) {
    window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = enabled === true;
    syncStyle();
    if (!associationsEnabled()) disableAssociationPanels();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/app-lxfd.industry-v114.js */
window.__p0Modules.sources["uf1395f77f2f04caa"]=function(){
/* p0-stream-view:start */
/* Incremental mirror for already-normalized assistant markup. No network or storage. */
(() => {
  'use strict';
  if(window.__lxStreamView)return;
  const active=new WeakMap();
  function key(node){return node.nodeType===1?(node.id||node.getAttribute('data-id')||''):'';}
  function patchNode(node,next){
    if(node.isEqualNode(next))return;
    if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName||key(node)!==key(next)){node.replaceWith(next.cloneNode(true));return;}
    if(node.nodeType===3||node.nodeType===8){node.data=next.data;return;}
    if(node.nodeType!==1)return;
    for(const a of [...node.attributes])if(!next.hasAttribute(a.name))node.removeAttribute(a.name);
    for(const a of [...next.attributes])if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);
    patchChildren(node,next);
  }
  function patchChildren(host,next){
    const old=[...host.childNodes],fresh=[...next.childNodes];
    for(let i=0;i<fresh.length;i++){if(old[i])patchNode(old[i],fresh[i]);else host.appendChild(fresh[i].cloneNode(true));}
    for(let i=fresh.length;i<old.length;i++)old[i].remove();
  }
  function patch(host,html){const template=document.createElement('template');template.innerHTML=html;patchChildren(host,template.content);}
  function mirror({source,target,scroll,normalize,isGenerating,onFinish,timeout=60000}){
    active.get(target)?.();let stopped=false,raf=0,poll,timer,lastRaw=null;
    function flush(){raf=0;if(stopped||!target.isConnected||!source.isConnected)return;const raw=source.innerHTML;if(raw===lastRaw)return;lastRaw=raw;const stick=!scroll||scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80;patch(target,normalize(raw));if(scroll&&stick)scroll.scrollTop=scroll.scrollHeight;}
    function stop(finish=false){if(stopped)return;if(finish)flush();stopped=true;observer.disconnect();cancelAnimationFrame(raf);clearInterval(poll);clearTimeout(timer);if(active.get(target)===stop)active.delete(target);if(finish&&target.isConnected)onFinish();}
    const observer=new MutationObserver(()=>{if(!raf&&!stopped)raf=requestAnimationFrame(flush);});
    observer.observe(source,{subtree:true,childList:true,characterData:true,attributes:true});
    poll=setInterval(()=>{if(!source.isConnected||!target.isConnected)stop();else if(!isGenerating())stop(true);},750);
    timer=setTimeout(()=>stop(true),timeout);active.set(target,stop);flush();return stop;
  }
  window.__lxStreamView=Object.freeze({patch,mirror});
})();

/* p0-stream-view:end */
// ── 乐享全屏对话（lxfd）独立模块 ─────────────────────────────────────────────
// 从 app.js 拆出（原 L7746-L9426，天然 IIFE 边界，行为零变化）。
// 与主面板通过 window.__lxBridge / window.lxfdSubmit / window.__lxIntent 通信。
// 加载顺序：app-intent.js → app.js → app-lxfd.js（index.html 里排最后）。
// Lexiang fullscreen dialog replacement behavior
(function(){
  "use strict";
  if (window.__lxfdInstalled) return;
  window.__lxfdInstalled = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $(".lxfd");
  if (!root) return;

  const navCluster = $("#lxfdNavCluster");
  const convoPill = $("#lxfdConvoPill");
  const convoName = $("#lxfdConvoName");
  const rail = $("#lxfdRail");
  const railFab = $("#lxfdRailFab");
  const railNewFab = $("#lxfdRailNewFab");
  const historySearch = $("#lxfdHistorySearch");
  const scrim = $("#lxfdScrim");
  const stage = $("#lxfdStage");
  const welcome = $("#lxfdWelcome");
  const thread = $("#lxfdThread");
  const ta = $("#lxfdTa");
  const send = $("#lxfdSend");
  const chips = $("#lxfdChips");
  const quick = $("#lxfdQuick");
  const turnIndex = $("#lxfdTurnIndex");
  const turnDots = $("#lxfdTurnDots");
  const turnList = $("#lxfdTurnList");
  const helloTitle = $("#lxfdHelloTitle");
  const isWindowsRuntime = (() => {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    return /Win/i.test(platform) || /Windows/i.test(ua);
  })();
  const forceFullscreenMotion = isWindowsRuntime;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceFullscreenMotion;
  document.body.classList.toggle("lxfd-force-motion", forceFullscreenMotion);
  let hoverTimer = null;
  let turns = [];
  let helloIndex = 0;
  let helloAnimating = false;
  let helloTimer = null;
  let railManuallyCollapsed = true;
  const chatState = { convId: null, sending: false, conversationNonce: 0, localId: null };;window.__lxGeneration.register(chatState,"fullscreen");window.__lxPersistStoppedFullscreen=()=>{lxfdPersistCurrent();};
  const navPaths = { home: "/", personal: "/shop-chat/", business: "/b-chat/", enterprise: "/biz-chat/", brand: "/brand/" };
  const LXFD_DEFAULT_HELLO_WORDS = ["找商品", "找门店", "找服务", "职场认证", "教育优惠", "找解决方案"];
  let helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
  const questions = ["想买游戏本，预算8000怎么选？", "学生买轻薄本，国补和教育优惠能省多少？", "小新和YOGA系列怎么选？", "旧电脑换新能抵多少钱？", "哪里有卖ThinkPad笔记本电脑门店"];
  const quicks = ["教育特惠", "以旧换新", "乐豆商城", "0元试用", "私人订制", "会员中心", "拉新返利"];
  const arrow = '<span class="arrow">' + window.__lxApprovedIcon("global-next") + '</span>';
  // actionbar 按钮 label → 有意义的 query 示例（避免直接发 label 体验差）
  const LXFD_ACTION_Q = {
    "文档解读": "请帮我解读这份文档，提炼核心结论、关键数据和待确认风险",
    "商品导购": "帮我推荐一款适合我的笔记本电脑",
    "解决方案": "解决方案",
    "门店查询": "帮我查询附近的联想门店",
    "职场认证": "职场人群认证怎么做，能享哪些专属优惠？",
    "服务预约": "我想预约售后维修或上门服务",
    "我的订单": "帮我查最近的订单状态和物流",
    "售后服务": "我的设备保修和售后服务怎么办理？",
    "评价服务": "给本次客服服务打个五星好评",
    "需求清单": "我整理一份采购需求清单发你确认",
  };
  const answer = '<p>我是联想官方AI助手，主要可以帮您完成以下事情：</p>'
    + '<h4>产品选购</h4><ul><li>推荐最适合的联想产品&lt;笔记本、台式机、平板、手机、配件等&gt;</li><li>产品参数对比、性价比分析</li></ul>'
    + '<h4>优惠查询</h4><ul><li>最新优惠政策:国补、教育优惠、企业补贴、学生价等</li><li>计算到手价、叠加各种优惠</li><li>推荐最适合您身份的优惠券</li></ul>'
    + '<h4>服务支持</h4><ul><li>查询保修状态、推荐延保方案</li><li>售后流程:退换货、维修、清洁保养、以旧换新估价</li><li>服务站地址和技术支持联系方式</li></ul>'
    + '<h4>订单辅助</h4><ul><li>处理订单、发货物流、发票等</li><li>会员权益、乐豆积分的使用</li></ul>'
    + '<p>有什么具体需求，随时可以和我说~</p>'
    + '<div class="lxfd-followups"><button type="button">可以推荐适合学生的笔记本吗？</button><button type="button">怎么查询我的产品保修状态？</button><button type="button">现在有哪些可以叠加的优惠政策？</button></div>'
    + '<p class="lxfd-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</p>';

  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
  function escapeAttr(text) { return escapeHtml(text).replace(/`/g, "&#96;"); }
  function lxfdDetectPage() {
    const path = location.pathname;
    for (const [page, p] of Object.entries(navPaths)) {
      if (path === p || path === p.replace(/\/$/, "") || path.startsWith(p === "/" ? "/_" : p)) {
        if (p !== "/" || path === "/") return page;
      }
    }
    // 精确匹配
    for (const [page, p] of Object.entries(navPaths)) {
      const normalized = p.endsWith("/") ? p : p + "/";
      const pathNorm = path.endsWith("/") ? path : path + "/";
      if (pathNorm === normalized) return page;
    }
    return "home";
  }
  function lxfdApplySite() {
    const prompts = window.__lxSitePrompts;
    if (!prompts) {
      // 兜底：用写死默认值渲染
      if (chips) chips.innerHTML = questions.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
      if (quick) quick.innerHTML = quicks.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
      return;
    }
    const page = (window.__lxState && window.__lxState.page) || lxfdDetectPage();
    const cfg = prompts[page] || prompts.home;
    if (!cfg) return;
    // 欢迎 chips
    const welcomeList = cfg.welcome || questions;
    if (chips) chips.innerHTML = welcomeList.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
    // 底部 actionbar
    const actionbarList = cfg.actionbar || quicks;
    if (quick) quick.innerHTML = actionbarList.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
    // 滚动标题词固定使用默认词组，不随频道话术重新读取。
    helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
    helloIndex = helloIndex % helloWords.length;
    // 输入框 placeholder
    if (ta && cfg.placeholder) ta.placeholder = cfg.placeholder;
  }
  lxfdApplySite();
  if (ta) ta.placeholder = "文档解读";
  function shortText(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }

  // ── 能力 B：localStorage 多会话历史 ──────────────────────────────────────
  function lxfdLoadStore() { try { return JSON.parse(localStorage.getItem("lexiang.lxfd.convs.v1") || "[]"); } catch (_) { return []; } }
  function lxfdSaveStore(a) { try { localStorage.setItem("lexiang.lxfd.convs.v1", JSON.stringify(a.slice(0, 20))); } catch (_) {} }
  function lxfdNewLocalConv() { chatState.localId = "lc" + Date.now() + Math.random().toString(36).slice(2, 6); }
  function lxfdPersistCurrent() {
    if (!thread || !thread.children.length) return;
    if (!chatState.localId) lxfdNewLocalConv();
    const firstUser = thread.querySelector(".lxfd-msg-user");
    const title = (firstUser ? firstUser.textContent : "新对话").trim().slice(0, 24) || "新对话";
    const snapshot = lxfdLoadStore();
    const previous = snapshot.find(c => c.id === chatState.localId);
    const threadHtml = thread.innerHTML, convId = chatState.convId || null;
    if (previous?.threadHtml === threadHtml && previous.title === title && previous.convId === convId) { lxfdSyncToMainConvKey(); return; }
    const store = snapshot.filter(c => c.id !== chatState.localId);
    store.unshift({ id: chatState.localId, title, convId, threadHtml, ts: Date.now(), pinned: !!previous?.pinned });
    lxfdSaveStore(store);
    // 同步一份到子站切换/刷新恢复用的 key（lexiang.conversation.v1）——否则首页对话切子站后丢失
    lxfdSyncToMainConvKey();
  }
  window.__lxfdPersistCurrentNow = lxfdPersistCurrent;
  // 首页 lxfd 对话 → 写进主对话持久化 key，让切子站(整页重载)后能恢复到同一段历史
  function lxfdSyncToMainConvKey() {
    try {
      if (localStorage.getItem("lexiang.newChatEmpty.v1") === "1") {
        localStorage.removeItem("lexiang.conversation.v1");
        return;
      }
      if (!thread) return;
      const nodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai"));
      const messages = [];
      nodes.forEach(function (el) {
        if (el.classList.contains("lxfd-msg-user")) {
          const text = (el.textContent || "").trim();
          if (text) messages.push({ role: "user", text: text, html: "" });
        } else {
          const body = el.querySelector(".lxfd-ai-body");
          let html = body ? body.innerHTML : "";
          const text = body ? (body.textContent || "").trim() : "";
          // 完成态正文会保留 hidden typing-cursor，不能仅凭类名把整条回复当成生成中。
          // 真正未完成的消息仍以可见 loading/typing 节点或占位文案为准；已有正文时保留
          // text，并清空不安全的中间态 HTML，让目标栏目用统一 markdown 渲染恢复。
          const hasVisiblePending = !!(body && Array.from(body.querySelectorAll(".lx-generating, .loading-line, .typing-text, .typing-cursor")).some(function (node) {
            return !node.hidden && node.getAttribute("aria-hidden") !== "true";
          }));
          const hasPlaceholderOnly = /联想乐享正在生成中|正在生成中/.test(text) && text.length < 40;
          if ((hasVisiblePending || hasPlaceholderOnly) && !text.replace(/联想乐享正在生成中|正在生成中/g, "").trim()) return;
          if (hasVisiblePending || hasPlaceholderOnly) html = "";
          if (html || text) messages.push({ role: "ai", text: text, html: html });
        }
      });
      while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      if (!messages.length) return;
      const payload = {convId: chatState.convId || null, messages: messages.slice(-50)};
      const saved = JSON.parse(localStorage.getItem("lexiang.conversation.v1") || "null");
      if (saved && saved.convId === payload.convId && JSON.stringify(saved.messages) === JSON.stringify(payload.messages)) return;
      localStorage.setItem("lexiang.conversation.v1", JSON.stringify({...payload, ts: Date.now()}));
    } catch (_e) {}
  }
  function lxfdRenderHist(query) {
    const normalizedQuery = String(query ?? historySearch?.value ?? "").trim().toLocaleLowerCase("zh-CN");
    const store = lxfdLoadStore()
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Number(b.ts || 0) - Number(a.ts || 0))
      .filter(c => !normalizedQuery || String(c.title || "").toLocaleLowerCase("zh-CN").includes(normalizedQuery));
    const hist = $("#lxfdHist");
    if (!hist) return;
    if (!store.length) {
      hist.innerHTML = '<div class="lxfd-hist-empty" role="status">' + (normalizedQuery ? "没有找到相关对话" : "暂无历史记录") + '</div>';
      return;
    }
    hist.innerHTML = store.map(c => '<div class="lxfd-hist-item' + (c.pinned ? " is-pinned" : "") + '" data-conv-item="' + escapeAttr(c.id) + '">' +
      '<a href="#" data-conv="' + escapeAttr(c.id) + '" class="lxfd-hist-link ' + (c.id === chatState.localId ? "active" : "") + '" title="' + escapeAttr(c.title) + '"><span class="lxfd-hist-title">' + escapeHtml(c.title) + '</span></a>' +
      '<button class="lxfd-hist-more" type="button" aria-label="' + escapeAttr(c.title) + '的更多操作" aria-haspopup="menu" aria-expanded="false"><img src="../icons/global-more.svg" alt="" aria-hidden="true" /></button>' +
      '<div class="lxfd-hist-menu" role="menu"><button class="lxfd-hist-action" type="button" role="menuitem" data-action="pin"><img src="../icons/' + (c.pinned ? 'global-unpin.svg' : 'global-pin.svg') + '" alt="" aria-hidden="true" /><span>' + (c.pinned ? "取消置顶" : "置顶") + '</span></button><button class="lxfd-hist-action" type="button" role="menuitem" data-action="delete"><img src="../icons/global-delete.svg" alt="" aria-hidden="true" /><span>删除</span></button></div></div>').join("");
    hist.querySelectorAll(".lxfd-hist-more").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const item = button.closest(".lxfd-hist-item");
        if (!item) return;
        const open = !item.classList.contains("menu-open");
        $$(".lxfd-hist-item.menu-open").forEach(node => {
          node.classList.remove("menu-open");
          node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false");
        });
        item.classList.toggle("menu-open", open);
        button.setAttribute("aria-expanded", String(open));
        if (open) item.querySelector(".lxfd-hist-action")?.focus();
      });
    });
  }

  function lxfdUpdateConversation(id, action) {
    const store = lxfdLoadStore();
    const index = store.findIndex(item => item.id === id);
    if (index < 0) return;
    if (action === "pin") store[index].pinned = !store[index].pinned;
    if (action === "delete") store.splice(index, 1);
    lxfdSaveStore(store);
    if (action === "delete" && id === chatState.localId) resetConversation(false);
    else lxfdRenderHist();
  }
  function lxfdLoadConv(id) {
    const c = lxfdLoadStore().find(x => x.id === id);
    if (!c) return;
    lxfdPersistCurrent();
    chatState.localId = c.id;
    chatState.convId = c.convId || null;
    chatState.conversationNonce += 1;
    if (thread) { thread.innerHTML = c.threadHtml; thread.classList.add("show"); }
    if (welcome) welcome.style.display = "none";
    lxfdSetGalleryChatting(true);
    if (convoName) { convoName.textContent = shortText(c.title, 15); convoName.title = c.title; }
    turns = [];
    renderTurnIndex("");
    lxfdRenderHist();
  }

  // ── 能力 A：从主面板导入已有对话 ─────────────────────────────────────────
  // 查主面板消息必须排除过渡动画层里的克隆：动画层整块克隆 .assistant-panel（类名原样保留），
  // 存活的 760ms 内全局 querySelectorAll 会真身+克隆各抓一份 → 导入翻倍
  function lxfdMainMsgs(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel), function(el) { return !el.closest(".lxfd-motion-panel"); });
  }
  function lxfdMainGenerating() {
    // 主面板是否仍在流式生成（state.sending 或最后一条 AI 消息里还挂着生成骨架）
    return !!((window.__lxState && window.__lxState.sending) ||
      lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai .lx-generating").length);
  }
  function lxfdNormalizeImportedAiHtml(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("[data-lx-focus-reco]").forEach((node) => {
      node.removeAttribute("data-lx-focus-reco");
      node.setAttribute("data-lxfd-reveal-products", "1");
    });
    return box.innerHTML;
  }
  function lxfdDoImport() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const importedConvId = (window.__lxState && window.__lxState.convId) || null;
    // 重复展开同一段分屏会话时覆盖同步现有全屏线程，不额外制造一条历史记录；
    // 只有确实切换到了另一段后端会话时才建立新的本地会话身份。
    if (!chatState.localId || (chatState.convId && importedConvId && chatState.convId !== importedConvId)) {
      lxfdNewLocalConv();
    }
    thread.innerHTML = "";
    turns = [];
    msgs.forEach(function(el) {
      const isUser = el.classList.contains("user");
      if (isUser) {
        const text = el.textContent.trim();
        const turnId = "turn-" + Date.now() + "-" + turns.length;
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-user" id="' + turnId + '">' + escapeHtml(text) + '</div>');
        turns.push({ id: turnId, text: text });
      } else {
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">' + lxfdNormalizeImportedAiHtml(el.innerHTML) + '</div></div>');
      }
    });
    renderTurnIndex("");
    chatState.convId = importedConvId;
    if (welcome) welcome.style.display = "none";
    thread.classList.add("show");
    chatState.started = true;
    lxfdSetGalleryChatting(true);
    if (quick) quick.style.display = "none";
    const lastUser = thread.querySelector(".lxfd-msg-user:last-of-type");
    const titleText = lastUser ? lastUser.textContent.trim() : "导入的对话";
    if (convoName) { convoName.textContent = shortText(titleText, 15); convoName.title = titleText; }
    lxfdPersistCurrent();
    lxfdRenderHist();
    return true;
  }
  function lxfdImportFromMain() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const generating = lxfdMainGenerating();
    // 先把当前所有消息（含那条还在生成、内容只有一半的 AI）原样克隆过来——带一半过来
    lxfdDoImport();
    if (generating) {
      // 主面板仍在流式输出：实时把最后一条 AI 消息镜像到全屏，主面板每蹦一段、全屏跟着更新，
      // 直到生成结束——边进边继续往外输出，不再干等（流式 SSE 只发给主面板 DOM，这里做镜像）。
      const aiNodes = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai");
      const mainAi = aiNodes[aiNodes.length - 1];
      const fsBodies = thread.querySelectorAll(".lxfd-msg-ai .lxfd-ai-body");
      const fsAiBody = fsBodies[fsBodies.length - 1];
      if (mainAi && fsAiBody) {
        window.__lxStreamView.mirror({source:mainAi,target:fsAiBody,scroll:thread,normalize:lxfdNormalizeImportedAiHtml,isGenerating:lxfdMainGenerating,onFinish:()=>{lfxdPersistCurrent();lfxdRenderHist();}});
      }
    }
    return true;
  }
  // ── 能力 C：把 lxfd 当前对话导出到主面板 ──────────────────────────────────
  // excludeEls：这一轮临时展示、不该进历史的节点（件2代买桥接用——过渡态用户气泡/提示条
  // 只在全屏展示做视觉过渡，真正的一条由桥接后 sendChat(value) 在主面板重新生成，
  // 带过去导出会变成重复两条）。
  function lxfdExportToMain(excludeEls) {
    if (!thread || !window.__lxBridge) return;
    const skip = excludeEls && excludeEls.length ? new Set(excludeEls) : null;
    const messages = [];
    const allNodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai")).filter(function(el) { return !skip || !skip.has(el); });
    const lastAi = allNodes.filter(function(el) { return el.classList.contains("lxfd-msg-ai"); }).pop();
    allNodes.forEach(function(el) {
      if (el.classList.contains("lxfd-msg-user")) {
        messages.push({ role: "user", text: el.textContent.trim(), html: "" });
      } else {
        const body = el.querySelector(".lxfd-ai-body");
        let html;
        if (body) {
          // 剥掉 lxfd 专属商品区和免责；追问需要保留，并转成主对话可点击的链接样式。
          // 商品已在右侧 reco 页正常展示，左侧对话保留文字答案 + 最新追问。
          const clone = body.cloneNode(true);
          clone.querySelectorAll(".lxfd-products, .lxfd-disclaimer").forEach(function(n) { n.remove(); });
          if (el !== lastAi) clone.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach(function(n) { n.remove(); });
          clone.querySelectorAll(".lxfd-followups").forEach(function(n) {
            n.classList.remove("lxfd-followups");
            n.classList.add("followups");
            n.setAttribute("data-followups", "1");
            n.querySelectorAll("button").forEach(function(btn) {
              const text = (btn.textContent || "").replace(/→\s*$/, "").trim();
              if (text) btn.setAttribute("data-quick-ask", text);
            });
          });
          html = clone.innerHTML;
        } else {
          html = el.innerHTML;
        }
        messages.push({ role: "ai", text: "", html: html });
      }
    });
    if (!messages.length) return;
    window.__lxBridge.importConversation(messages, chatState.convId, { localId: chatState.localId });
  }
  function parseJson(data) {
    try { return JSON.parse(data); } catch (_) { return {}; }
  }
  function money(value) {
    const n = Number(value || 0);
    return n ? "¥" + n.toLocaleString("zh-CN") : "咨询价";
  }
  function imgUrl(src) {
    const value = String(src || "").trim();
    if (!value) return "/assets/product-placeholder.svg";
    return value.startsWith("http") || value.startsWith("/") ? value : "/" + value;
  }
  function mdLite(text) {
    // 官方文本常自带 HTML 实体（「我的」&gt;「设置」），不先解码会被 escapeHtml 二次转义显示成字面（同主面板 mdLite）
    const src = String(text || "").replace(/<br\s*\/?>/gi, "\n").replace(/[ \t]*_\._[ \t]*/g, " ")
      .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    let html = escapeHtml(src);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?:^|\n)####?\s*(.+)/g, "\n<h4>$1</h4>");
    html = html.replace(/(?:^|\n)-\s+(.+)/g, "\n<ul><li>$1</li></ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    return html.split(/\n{2,}/).map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (/^<(h4|ul)/.test(clean)) return clean;
      return `<p>${clean.replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }
  async function readSse(response, handlers) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() || "";
      blocks.forEach((block) => {
        let event = "message";
        const data = [];
        block.split(/\n/).forEach((line) => {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        });
        const payload = data.join("\n");
        if (payload && handlers[event]) handlers[event](payload);
      });
    }
    if (buffer.trim()) {
      let event = "message";
      const data = [];
      buffer.split(/\n/).forEach((line) => {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      });
      const payload = data.join("\n");
      if (payload && handlers[event]) handlers[event](payload);
    }
  }
  function wide() { return window.innerWidth >= 1280; }
  function finishMotionClass(name, delay = 520) {
    window.setTimeout(() => document.body.classList.remove(name), reduceMotion ? 0 : delay);
  }
  function runMotionPanel(layer) {
    if (!layer) return;
    const runCssMotion = () => {
      if (forceFullscreenMotion) {
        layer.getBoundingClientRect();
        requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("run")));
      } else {
        requestAnimationFrame(() => layer.classList.add("run"));
      }
    };
    // Windows 11 + Chromium 149 may skip the left/top/size transition when the
    // fullscreen layer is inserted and the body class changes in the same frame.
    // Drive that environment with WAAPI, while leaving the existing CSS path
    // untouched for systems where the original animation already works.
    if (!forceFullscreenMotion || typeof layer.animate !== "function") {
      runCssMotion();
      return;
    }
    const isExit = layer.classList.contains("lxfd-motion-panel-exit");
    const ease = "cubic-bezier(.22,.61,.36,1)";
    const start = layer.getBoundingClientRect();
    const toPx = (value, fallback) => {
      const n = parseFloat(String(value || ""));
      return Number.isFinite(n) ? n : fallback;
    };
    const target = isExit
      ? {
          left: toPx(layer.style.getPropertyValue("--lxfd-target-left"), start.left),
          top: toPx(layer.style.getPropertyValue("--lxfd-target-top"), start.top),
          width: toPx(layer.style.getPropertyValue("--lxfd-target-width"), start.width),
          height: toPx(layer.style.getPropertyValue("--lxfd-target-height"), start.height),
          radius: 8,
          opacity: 0,
      }
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, radius: 0, opacity: 0 };
    if (isExit) {
      const scaleX = target.width > 0 && start.width > 0 ? target.width / start.width : 1;
      const scaleY = target.height > 0 && start.height > 0 ? target.height / start.height : 1;
      const moveX = target.left - start.left;
      const moveY = target.top - start.top;
      layer.style.transformOrigin = "top left";
      layer.style.backfaceVisibility = "hidden";
      layer.style.transform = "translate3d(0,0,0) scale(1,1)";
      const first = {
        transform: "translate3d(0,0,0) scale(1,1)",
        borderRadius: "0px",
        opacity: "1",
      };
      const last = {
        transform: `translate3d(${moveX}px,${moveY}px,0) scale(${scaleX},${scaleY})`,
        borderRadius: `${target.radius}px`,
        opacity: `${target.opacity}`,
      };
      const anim = layer.animate([
        first,
        { ...first, offset: 0.08 },
        { ...last, opacity: "1", offset: 0.72 },
        last
      ], { duration: 720, easing: ease, fill: "forwards" });
      anim.addEventListener("finish", () => {
        layer.style.left = `${target.left}px`;
        layer.style.top = `${target.top}px`;
        layer.style.width = `${target.width}px`;
        layer.style.height = `${target.height}px`;
        layer.style.borderRadius = `${target.radius}px`;
        layer.style.opacity = `${target.opacity}`;
        layer.style.transform = "translate3d(0,0,0) scale(1,1)";
        layer.classList.add("run");
      }, { once: true });
      return;
    }
    const first = {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      borderRadius: isExit ? "0px" : "8px",
      opacity: "1",
    };
    const hold = { ...first, offset: isExit ? 0.72 : 0.67 };
    const last = {
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      borderRadius: `${target.radius}px`,
      opacity: `${target.opacity}`,
    };
    const anim = layer.animate([first, hold, last], { duration: 720, easing: ease, fill: "forwards" });
    anim.addEventListener("finish", () => {
      Object.assign(layer.style, last);
      layer.classList.add("run");
    }, { once: true });
  }
  function createPanelStretchLayer() {
    const source = document.querySelector(".assistant-panel");
    if (!source || reduceMotion) return null;
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function getSplitPanelRect() {
    // 全屏态可能只剩 lx-auto-fs：exitFullscreen 里先跑的 focusReco→lxRevealContent 会摘掉
    // assistant-fullscreen 但留 lx-auto-fs（它单独也藏着 .shell）。只认一个类会误判"不在全屏"，
    // 不摘类就去量 → 量到 display:none 的面板 → null → 退出动画整个消失
    const wasFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (wasFullscreen) setFullscreen(false);
    const source = document.querySelector(".assistant-panel");
    const rect = source?.getBoundingClientRect();
    if (wasFullscreen) setFullscreen(true);
    if (!rect || !rect.width || !rect.height) return null;
    return rect;
  }
  function createFullscreenShrinkLayer(targetRect) {
    const source = document.querySelector(".lxfd");
    if (!source || !targetRect || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function createFullscreenExitLayer() {
    const source = document.querySelector(".lxfd");
    if (!source || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    return layer;
  }
  function setFullscreenExitLayerTarget(layer, targetRect) {
    if (!layer || !targetRect || !targetRect.width || !targetRect.height) return false;
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    runMotionPanel(layer);
    return true;
  }
  function normalizeFullscreenEntryState() {
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    document.body.classList.remove("lxfd-exiting", "lxfd-split-returning");
    if (document.body.classList.contains("lx-home-split")) {
      document.body.dataset.page = "home";
      const content = document.querySelector(".content");
      if (content) content.setAttribute("data-view", "home");
      document.body.classList.remove("lx-home-split");
    }
    stage?.classList.remove("shift");
    openRail(false);
  }
  function enterFullscreen() {
    // 动画层必须在 normalize 之前截取：normalize 会拆掉分屏布局，之后 .assistant-panel
    // 量出 0×0 → 拿不到起点 → 退化成 CSS 兜底的「从下面冒出」而不是面板拉伸过渡
    const motionLayer = createPanelStretchLayer();
    normalizeFullscreenEntryState();
    lxfdApplySite();
    // 每次展开都重新读取分屏当前会话。不能以全屏 thread 是否为空作为判断，
    // 否则 thread 中残留的旧首轮内容会阻止后续问答和推荐卡片被带入。
    if (lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) lxfdImportFromMain();
    document.body.classList.remove("lxfd-exiting");
    document.body.classList.remove("lxfd-split-returning");
    document.body.classList.add("lxfd-entering");
    document.body.classList.add("lxfd-split-entered");
    setFullscreen(true);
    window.setTimeout(() => motionLayer?.remove(), reduceMotion ? 0 : 760);
    finishMotionClass("lxfd-entering", 760);
  }
  function exitFullscreen(afterExit, options) {
    const onAfterExit = typeof afterExit === "function" ? afterExit : null;
    const skipGenericFocus = !!(options && options.skipGenericFocus);
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterExit?.();
      return;
    }
    // 有对话时回「分屏」而不是裸首页：enterFullscreen 的 normalize 把页面态抹成了 home，
    // 不对称恢复的话对话会藏在隐藏的 lxfd thread 里，用户看到 hero 首页以为对话丢了。
    // 先恢复分屏布局（复用 focusReco 配方）再量收缩动画落点，动画才有真实目标矩形。
    const hasConvo = !!(thread && thread.classList.contains("show") && thread.children.length && window.__lxBridge);
    // 带回调退出只用于“结果卡打开右侧内容”，即使历史 thread 的 show 标记在恢复时
    // 暂时缺失，也必须强制回左右框架，不能依赖 hasConvo 这一项视觉标记。
    const returnToSplit = hasConvo || !!onAfterExit;
    if (hasConvo) {
      lxfdExportToMain();
      try {
        if (skipGenericFocus) window.__lxBridge.prepareRootSplitState?.();
        else window.__lxBridge.focusReco();
      } catch {}
    }
    const targetRect = getSplitPanelRect();
    const motionLayer = createFullscreenShrinkLayer(targetRect);
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    // 全屏类清理/主应用退出钩子都可能重算页面态。必须在它们之后再次落定分屏，
    // 否则会出现既无 assistant-fullscreen、也无 lx-home-split 的半退出页面。
    if (returnToSplit) lxfdEnsureRootSplitState();
    document.body.dataset.state = hasConvo ? "chat" : "default";
    if (hasConvo && thread) thread.innerHTML = "";
    if (onAfterExit) requestAnimationFrame(() => {
      if (returnToSplit) lxfdEnsureRootSplitState();
      onAfterExit();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      if (returnToSplit) lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  // 结果卡需要从全屏对话直接落到“左对话 + 右结果”。
  // 这里不走通用退出动画：通用动画会在两帧之间暴露裸商城和
  // 全屏层/商城混合态。所有布局类、页面态和目标内容在同一个点击任务内提交，
  // 浏览器下一次绘制只能看到最终左右框架。
  function lxfdExitToResultAtomically(commitResult) {
    const hasConversation = !!(thread && thread.children.length && window.__lxBridge);
    if (hasConversation) lxfdExportToMain();
    document.body.classList.remove(
      "assistant-fullscreen", "lx-auto-fs", "lx-root-home", "lxfd-entering",
      "lxfd-exiting", "lxfd-split-returning"
    );
    document.querySelectorAll(".lxfd-motion-panel").forEach((node) => node.remove());
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    lxfdEnsureRootSplitState();
    document.body.dataset.state = "chat";
    if (typeof commitResult === "function") commitResult();
    lxfdEnsureRootSplitState();
    lxfdAssertSplitEndState();
    if (hasConversation && thread) thread.innerHTML = "";
    const stabilizeSplit = () => {
      lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
    };
    requestAnimationFrame(stabilizeSplit);
    // Restored history cards can start an asynchronous result-page generator.
    // Root-home guards may run again during that window and remove the split
    // class after the first frame. Keep asserting the shared two-column end
    // state until the result page has replaced its generation overlay.
    [80, 240, 520, 900].forEach((delay) => window.setTimeout(stabilizeSplit, reduceMotion ? 0 : delay));
  }
  // 退出动画收尾断言：分屏已成形则全屏类必须不在。防御外部"回全屏"钩子在动画窗口内
  // (补分屏类之前的一瞬守卫失效)把全屏类加回来，造成两态共存的混合花屏
  function lxfdAssertSplitEndState() {
    if (!document.body.classList.contains("lx-home-split")) return;
    window.__LXFD_FORCE = false; // 已进分屏,关掉"URL=/强制全屏"开关,否则内联force定时器会把全屏盖回来
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lx-root-home");
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    if (document.body.dataset.page === "home" || !document.body.dataset.page) document.body.dataset.page = "personal";
    // forceRootFullscreen 曾给 .lxfd 写内联 display:block/visibility:visible——内联样式压过
    // 分屏 CSS 的隐藏规则,全屏层会叠在分屏上(消息裸排+hero输入框+画廊混显)。清掉还权给 CSS
    const lxfdLayer = document.querySelector(".lxfd");
    if (lxfdLayer) { lxfdLayer.style.display = ""; lxfdLayer.style.visibility = ""; }
  }
  function exitFullscreenWithReveal(afterReveal) {
    const onAfterReveal = typeof afterReveal === "function" ? afterReveal : null;
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterReveal?.();
      return;
    }
    const motionLayer = createFullscreenExitLayer();
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    document.body.dataset.state = thread?.classList.contains("show") ? "chat" : "default";
    onAfterReveal?.();
    requestAnimationFrame(() => {
      const rect = document.querySelector(".assistant-panel")?.getBoundingClientRect();
      if (!setFullscreenExitLayerTarget(motionLayer, rect)) motionLayer?.remove();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  window.__lxfdExitWithReveal = exitFullscreenWithReveal;
  function setFullscreen(on) {
    document.body.classList.toggle("assistant-fullscreen", !!on);
    document.body.classList.toggle("lx-auto-fs", !!on);
    if (!on) document.body.classList.remove("lxfd-split-entered");
    if (on) document.body.dataset.state = "chat";
    if (on) {
      const currentTitle = convoName?.textContent?.trim();
      if (convoName && !currentTitle) {
        const splitTitle = document.querySelector(".main-nav")?.getAttribute("data-current-label")?.trim();
        const lastMainUser = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.user").pop()?.textContent?.trim();
        const fallbackTitle = splitTitle || (lastMainUser ? shortText(lastMainUser, 15) : "新对话");
        convoName.textContent = fallbackTitle;
        convoName.title = fallbackTitle;
      }
      const hasThread = !!(thread && (thread.classList.contains("show") || thread.children.length));
      if (hasThread || chatState.started) {
        if (welcome) welcome.style.display = "none";
        if (thread) thread.classList.add("show");
        if (quick) quick.style.display = "none";
        lxfdSetGalleryChatting(true);
      }
      requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); ta?.focus(); });
    }
  }
  function setNav(open) {
    navCluster?.classList.toggle("open", open);
    convoPill?.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function syncRailNewFabVisibility() {
    const chatting = !!stage?.classList.contains("is-chatting");
    const railOpen = !!rail?.classList.contains("open");
    document.body.classList.toggle("lxfd-chatting", chatting);
    railNewFab?.classList.toggle("hide", railOpen || !chatting);
  }
  function openRail(open) {
    if (open && !window.__lxState?.user) open = false;
    rail?.classList.toggle("open", open);
    railFab?.classList.toggle("hide", open);
    syncRailNewFabVisibility();
    stage?.classList.toggle("shift", open && wide());
    scrim?.classList.remove("show");
    // 侧栏一露出就重读 localStorage 重渲染——store 是主面板(app.js lxArchiveCurrentConversation)
    // 和本文件(lxfdPersistCurrent)共用的同一个 key，但 #lxfdHist 只在启动时渲染过一次；
    // 主面板那边新归档的对话（含多步 agent 卡）不会自动反映到这里，用户点开旧快照里的
    // 条目会踩到过期/不完整数据，恢复出来就只剩用户那句话。开一次刷一次，零额外触发面。
    if (open) lxfdRenderHist();
  }
  function setRailManual(open) {
    railManuallyCollapsed = !open;
    document.body.classList.toggle("lxfd-rail-user-open", !!open);
    openRail(open);
  }
  function syncRailForViewport() {
    openRail(Boolean(window.__lxState?.user) && wide() && !railManuallyCollapsed);
  }
  window.__lxfdSyncHistoryAuth = function(authenticated) {
    if (!authenticated) {
      railManuallyCollapsed = true;
      document.body.classList.remove("lxfd-rail-user-open");
      openRail(false);
      return;
    }
    syncRailForViewport();
  };
  function fit() {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 148) + "px";
  }
  function syncSend() {
    const empty = !ta?.value.trim();
    send?.classList.toggle("idle", empty);
    if (send) send.disabled = empty;
  }
  function setRotatingTitle(word) { if (helloTitle) helloTitle.innerHTML = `<span>联想乐享帮你</span><span class="rotating-word">${escapeHtml(word)}</span>`; }
  async function rotateTitleWordForWindows(word) {
    if (helloAnimating || !word || typeof word.animate !== "function") return;
    helloAnimating = true;
    const ease = "cubic-bezier(.16,.72,.22,1)";
    try {
      // 位移用 top（布局属性，主线程绘制）不用 transform/blur/will-change——那些会把词提成
      // 合成层，配合父级 background-clip:text 渐变字在 Chrome 留旧帧残影（真机两轮反馈）；
      // top 动画不产生层缓存，动效在、残影无。word 的 position:relative 由 CSS 提供。
      await word.animate([
        { opacity: 1, top: "0px" },
        { opacity: 0, top: "-6px" }
      ], { duration: 300, easing: ease, fill: "forwards" }).finished;
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      await word.animate([
        { opacity: 0, top: "6px" },
        { opacity: 1, top: "0px" }
      ], { duration: 320, easing: ease, fill: "forwards" }).finished;
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } catch (_) {
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } finally {
      helloAnimating = false;
    }
  }
  function rotateTitleWord() {
    if (!helloTitle || welcome.style.display === "none") return;
    const word = helloTitle.querySelector(".rotating-word");
    if (!word) { setRotatingTitle(helloWords[helloIndex]); return; }
    if (forceFullscreenMotion && typeof word.animate === "function") {
      rotateTitleWordForWindows(word);
      return;
    }
    word.classList.add("out");
    window.setTimeout(() => {
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      word.classList.remove("out");
      word.classList.add("in");
      requestAnimationFrame(() => word.classList.remove("in"));
    }, reduceMotion ? 0 : 300);
  }
  function startRotatingTitle() {
    setRotatingTitle(helloWords[helloIndex]);
    if (reduceMotion) return;
    if (helloTimer) window.clearTimeout(helloTimer);
    if (!forceFullscreenMotion) {
      helloTimer = window.setInterval(rotateTitleWord, 2000);
      return;
    }
    const tick = () => {
      rotateTitleWord();
      helloTimer = window.setTimeout(tick, 2000);
    };
    helloTimer = window.setTimeout(tick, 2000);
  }
  function renderTurnIndex(activeId) {
    turnIndex?.classList.toggle("show", turns.length > 0);
    if (turnDots) turnDots.innerHTML = turns.map(t => `<i class="${t.id === activeId ? "active" : ""}"></i>`).join("");
    if (turnList) turnList.innerHTML = turns.map(t => `<button type="button" class="${t.id === activeId ? "active" : ""}" data-target="${escapeAttr(t.id)}" title="${escapeAttr(t.text)}">${escapeHtml(shortText(t.text, 18))}</button>`).join("");
  }
  function lxfdEnterHuman() {
    chatState.human = true;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body"><b>专属客服小联</b> 已为您接入人工服务，下方已切换为客服快捷入口。订单、售后、发票问题可直接发我。（演示：由乐享 AI 以专属客服身份接待）</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    if (quick) { quick.innerHTML = ["退出人工", "我的订单", "售后服务", "评价服务", "需求清单"].map(t => '<button type="button">' + escapeHtml(t) + '</button>').join(""); quick.style.display = ""; }
    if (ta) { if (!ta.dataset.origPh) ta.dataset.origPh = ta.placeholder; ta.placeholder = "向专属客服小联提问..."; }
  }

  function lxfdExitHuman() {
    chatState.human = false;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">已退出人工服务，继续由联想乐享 AI 为您服务。</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    lxfdApplySite();
    // 退出客服后若仍在聊天态则继续隐藏 actionbar
    if (chatState.started && quick) quick.style.display = "none";
    if (ta && ta.dataset.origPh) ta.placeholder = ta.dataset.origPh;
  }

  function lxfdSetGalleryChatting(on) {
    stage?.classList.toggle("is-chatting", !!on);
    syncRailNewFabVisibility();
  }

  function resetConversation(collapseRail) {
    lxfdPersistCurrent();
    // 先归档旧会话，再锁定当前会话为空；刷新/卸载期间不得由旧 DOM 回写。
    try {
      localStorage.setItem("lexiang.newChatEmpty.v1", "1");
      localStorage.removeItem("lexiang.conversation.v1");
    } catch (_e) {}
    chatState.conversationNonce += 1;
    chatState.convId = null;
    chatState.localId = null;
    chatState.sending = false;
    chatState.human = false;
    chatState.started = false; // 新建对话回到欢迎态，恢复 actionbar
    // 当前会话已重置，避免顶部标题从上一轮共享缓存中恢复。
    try { localStorage.removeItem("lexiang.conversation.v1"); } catch (_e) {}
    if (thread) { thread.innerHTML = ""; thread.classList.remove("show"); }
    turns = [];
    renderTurnIndex("");
    if (welcome) welcome.style.display = "flex";
    // 根路径新建对话=回到初始首页态：把 prepaint 标记类加回来（分屏桥接时被摘掉），
    // 否则整套「空白态」规则失效——topbar 露出、左侧 fab 复现、右上冒出「收起」按钮（真机反馈）
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    if (logicalPath === "/") {
      document.documentElement.classList.add("lx-root-lxfd-prepaint");
      document.body.classList.remove("lx-home-split", "lxfd-split-entered", "assistant-fullscreen", "lx-auto-fs");
      window.__LXFD_FORCE = true;
    }
    lxfdSetGalleryChatting(false);
    if (convoName) { convoName.textContent = "新对话"; convoName.title = "新对话"; }
    if (window.__lxSyncTopNavTitle) window.__lxSyncTopNavTitle();
    if (ta) { if (ta.dataset.origPh) ta.placeholder = ta.dataset.origPh; ta.value = ""; fit(); syncSend(); }
    // 从历史侧栏点击“新建对话”后，无论当前 PC 视口宽度，都收起历史目录；
    // 同步写入手动收起状态，避免随后的 resize / viewport 同步再次自动展开。
    if (collapseRail) setRailManual(false);
    // 恢复 actionbar（lxfdApplySite 会重渲内容）
    if (quick) { quick.style.display = ""; lxfdApplySite(); }
    ta?.focus();
    lxfdRenderHist();
  }
  function renderLxfdProducts(products, options = {}) {
    if (!Array.isArray(products) || !products.length) return "";
    const couponProduct = window.__lxCouponCenter?.productsCoupon(products);
    const educationProduct = window.__lxEducationOffers?.isProducts(products);
    const first = products[0] || {};
    const recoId = "lxfd-reco-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    window.__lxRecoPayloads = window.__lxRecoPayloads || {};
    window.__lxRecoPayloads[recoId] = products;
    // 同步持久化（与主面板 lxReadRecoPayload 同一 key）：桥接导出的历史恢复后 CTA 仍可取回商品
    try {
      const key = "lexiang.recoPayloads.v1";
      const store = JSON.parse(localStorage.getItem(key) || "[]");
      store.push({ id: recoId, products: products.slice(0, educationProduct || couponProduct ? 12 : 8).map((p) => ({ sku: p.sku, name: p.name, price: p.price, image_url: p.image_url || p.image, specs: p.specs, description: (p.description || "").slice(0, 400) })) });
      localStorage.setItem(key, JSON.stringify(store.slice(-8)));
    } catch (_e) {}
    const isServiceProduct = !!options.serviceProduct;
    const desc = couponProduct
      ? `已按券面范围整理 ${products.length} 款对应商品`
      : educationProduct
      ? `已为你整理 ${products.length} 款教育优惠商品`
      : isServiceProduct
      ? `已为你推荐 ${products.length} 款服务商品`
      : products.length === 1
      ? `${escapeHtml(first.name || "按你的需求筛选出的商品")}${first.price ? ` · ${money(first.price)}` : ""}`
      : `已为你筛选 ${products.length} 款候选商品`;
    return `<button class="answer-cta lx-answer-reco" type="button" data-lxfd-reveal-products="1" data-lxfd-reco-id="${escapeHtml(recoId)}">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${couponProduct ? "查看优惠券可用商品" : educationProduct ? "查看教育优惠商品" : isServiceProduct ? "查看推荐服务商品" : "查看推荐商品"}</span>
        <span class="answer-cta-desc">${desc}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function lxfdPageCtaMeta(op) {
    const key = String(op || "");
    const map = {
      edu: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      open_edu_zone: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      open_solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      open_stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      open_member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      open_coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      points: { feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" },
      vouchers: { feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" },
      redpacket: { feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" },
      cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      open_cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_documents: { feature: "documents", title: "查看文档解读", desc: "已为你打开资料中心与文档列表" }
    };
    return map[key] || null;
  }

  function renderLxfdPageCta(meta) {
    if (!meta) return "";
    const resultIds = { solution: "info:solution", member: "info:member", devices: "info:devices", coupon: "info:coupon", points: "info:points", vouchers: "info:vouchers", redpacket: "info:redpacket", documents: "documents", edu: "info:edu", cart: "info:cart", orders: "info:orders" };
    const resultId = meta.resultId || resultIds[meta.feature] || "";
    const resultAttr = resultId ? ` data-lx-result-id="${escapeAttr(resultId)}" data-lx-open-tab="${escapeAttr(resultId)}" aria-pressed="false"` : "";
    return `<button class="answer-cta lx-answer-page" type="button" data-lx-focus-active="1" data-lxfd-open-feature="${escapeHtml(meta.feature || "")}"${resultAttr} aria-label="${escapeAttr(meta.title || "查看页面")}，展开左右框架" title="展开左右框架">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${escapeHtml(meta.title || "查看页面")}</span>
        <span class="answer-cta-desc">${escapeHtml(meta.desc || "已在右侧为你打开相关内容")}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function renderLxfdLeadCta() {
    return '<div class="lx-p0-actions answer-actions"><button class="lx-p0-btn primary" type="button" data-floor-action="lead">提交项目需求</button></div>';
  }

  // 只看 page==="home" 会漏：上一轮分屏残留 page="personal" 时再进全屏、退出走到这里，
  // 分屏类没补上 → 无全屏类也无分屏类的中间态（topbar 露出、lxfd 消息裸奔黑三角，或者背景
  // 停在首页欢迎态门户，聊天消息虽已在DOM里但不可见——件2代买桥接真机截图就踩到了这个）。
  // 无论根首页还是四个频道，从全屏卡片收起前都必须先恢复左右结构。
  // 旧逻辑只处理 URL=/：当目标 Tab 已被关闭或缓存中尚未登记时，卡片会走
  // lxfdRevealFeature 兜底；子频道因没有补分屏类，最终只剩右侧独立页面。
  function lxfdEnsureRootSplitState() {
    // 这是“最终态提交”而不是仅缺类时补一次。全屏进入/首页守卫可能在动画窗口内
    // 写回 lx-root-home 或移除 split；每次调用都重放主应用唯一的分屏归一化函数。
    if (typeof window.__lxBridge?.prepareRootSplitState === "function") {
      window.__lxBridge.prepareRootSplitState();
    } else if (!document.body.classList.contains("lx-home-split")) {
        document.documentElement.classList.remove("lx-root-lxfd-prepaint");
        document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lxfd-entering", "lx-root-home");
        document.body.classList.add("lx-home-split", "lxfd-split-entered");
        document.body.dataset.page = "personal";
        document.body.dataset.state = "chat";
        window.__LXFD_FORCE = false;
        const _lxfdLayer = document.querySelector(".lxfd");
        if (_lxfdLayer) { _lxfdLayer.style.display = ""; _lxfdLayer.style.visibility = ""; }
    }
  }

  // 全屏消息会先导回主面板。结果卡收起后优先点击导回的同一张卡，
  // 让主面板唯一的结果路由器负责 Tab 激活、关闭后重建和内容恢复。
  function lxfdReplayImportedResultCard(target) {
    const cards = Array.from(document.querySelectorAll(".lx-p0-messages .answer-cta"));
    const hit = cards.slice().reverse().find((card) => {
      if (target.resultId && card.getAttribute("data-lx-result-id") === target.resultId) return true;
      if (target.boundTabId && card.getAttribute("data-lx-open-tab") === target.boundTabId) return true;
      if (target.solutionTitle && card.getAttribute("data-specific-solution-cta") === target.solutionTitle) return true;
      if (target.recoId && card.getAttribute("data-lxfd-reco-id") === target.recoId) return true;
      if (target.openProduct && card.getAttribute("data-open-product") === target.openProduct) return true;
      return !!target.feature && card.getAttribute("data-lxfd-open-feature") === target.feature;
    });
    if (!hit) return false;
    hit.click();
    return true;
  }

  function lxfdRevealFeature(feature) {
    lxfdEnsureRootSplitState();
    if (String(feature).startsWith("member-coupon-center:")) {
      window.__lxOpenCouponCenter?.(String(feature).split(":")[1]);
      return;
    }

    if (typeof window.__lxOpenFeature === "function") window.__lxOpenFeature(feature);
  }

  function lxfdOpenFeatureInSplit(feature) {
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (!inFullscreen) {
      lxfdRevealFeature(feature);
      return;
    }
    lxfdExportToMain();
    exitFullscreen(() => {
      lxfdRevealFeature(feature);
      if (thread) thread.innerHTML = "";
    });
  }

  async function lxfdRunHomeCommerceEntry(kind) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    // 这条“全屏生成 → 结果卡 → 左右结构”链路只属于根首页。
    // 子频道即使误调用，也立即回退到其原有商务入口，不改变频道交互。
    if (logicalPath !== "/") {
      return window.lxOpenCommerceEntry?.(kind, { sendQuery: true });
    }
    if (chatState.sending) return;

    const isOrders = kind === "orders";
    const query = isOrders ? "查看我的订单" : "查看我的购物车";
    const feature = isOrders ? "orders" : "cart";
    const reply = isOrders
      ? "已为你整理近期**订单状态**、商品与服务信息，可继续查看物流、详情及售后入口。"
      : "已为你整理**购物车商品**、优惠与结算信息，可继续核对选中商品并完成结算。";
    const meta = lxfdPageCtaMeta(isOrders ? "open_orders" : "open_cart");

    chatState.sending = true;
    chatState.started = true;
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    if (quick) quick.style.display = "none";
    thread?.classList.add("show");

    const turnId = `turn-home-${feature}-${Date.now()}`;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = query;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: query });
    renderTurnIndex(turnId);

    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

    try {
      // 严格串行：正文逐字完成后才挂结果卡；结果卡完成布局后才退出全屏并创建右页。
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, reply)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body && meta) body.insertAdjacentHTML("beforeend", renderLxfdPageCta(meta));
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
      lxfdPersistCurrent();
      lxfdExportToMain();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
      exitFullscreenWithReveal(() => lxfdRevealFeature(feature));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}
  window.__lxfdRunHomeCommerceEntry = lxfdRunHomeCommerceEntry;

  function appendLxfdSuggestions(ai, suggestions) {
    const list = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    if (!list.length) return;
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => {
      if (!ai.contains(el)) el.remove();
    });
    ai.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    const host = ai.querySelector(".lxfd-ai-body") || ai;
    host.insertAdjacentHTML("beforeend", `<div class="lxfd-followups">${list.map((sug) => `<button type="button">${escapeHtml(sug)}</button>`).join("")}</div>`);
    // 件2 F1：追问chip常在答案打字动画收尾之后才异步插入，插入前 thread 已经滚到"答案末尾"，
    // 新增内容会落在可视区之下点不到——插入后补一次滚底（对称主面板的 lxAppendAiHtml 滚动逻辑）
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdClaimTicketSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4 2 2 0 0 0 0-4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 2"/></svg>';
  }

  function lxfdClaimCheckSvg(width) {
    return window.__lxApprovedIcon("global-check", width ? "ck" : "");
  }

  function lxfdClaimInfoFromCard(card) {
    const productName = (card && card.dataset && card.dataset.claimProduct) || (card && card.querySelector(".t2") && card.querySelector(".t2").textContent.trim()) || "商品";
    const chips = Array.prototype.slice.call(card ? card.querySelectorAll(".chip") : []);
    const claimed = chips.map(function(chip) {
      const amount = Number((chip.dataset && chip.dataset.claimAmount) || String((chip.querySelector(".cv") || {}).textContent || "").replace(/[^0-9.]/g, "")) || 0;
      const label = (chip.dataset && chip.dataset.claimName) || String(chip.textContent || "").replace(/¥\s?[\d,]+(?:\.\d+)?/g, "").trim() || "优惠券";
      return { label: label, amount: amount };
    });
    const domTotal = String((card && card.querySelector(".done-amt") || {}).textContent || "").replace(/[^0-9.]/g, "");
    const totalSaved = Number((card && card.dataset && card.dataset.claimTotal) || domTotal) || claimed.reduce(function(sum, item) { return sum + Math.abs(Number(item.amount || 0)); }, 0);
    return { productName: productName, claimed: claimed, totalSaved: totalSaved };
  }

  function lxfdRenderClaimedStaticCard(info) {
    const offers = Array.isArray(info.claimed) ? info.claimed : [];
    const chips = offers.map(function(coupon) {
      const amount = Math.abs(Number(coupon.amount || 0));
      return '<span class="chip">' + lxfdClaimCheckSvg("3.2") + escapeHtml(coupon.label || "优惠券") + ' <span class="cv">¥' + amount.toLocaleString("zh-CN") + '</span></span>';
    }).join("");
    return '<div class="gc lx-claimed-skin" data-v="I" aria-disabled="true">'
      + '<div class="irow"><span class="ic">' + lxfdClaimTicketSvg() + '</span>'
      + '<span class="mid"><div class="t1">已领取 ' + offers.length + ' 项优惠 <span class="doneflag df">' + lxfdClaimCheckSvg("2.6") + '已领取</span></div>'
      + '<div class="t2">' + escapeHtml(info.productName || "商品") + ' · 已收进卡包</div></span>'
      + '<span class="sa">已省 ¥' + Math.abs(Number(info.totalSaved || 0)).toLocaleString("zh-CN") + '</span></div>'
      + '<div class="chips">' + chips + '</div></div>';
  }

  function lxfdArchiveClaimProgressCards(root) {
    (root || document).querySelectorAll('.cl[data-v="D"].lx-claim-skin').forEach(function(card) {
      card.outerHTML = lxfdRenderClaimedStaticCard(lxfdClaimInfoFromCard(card));
    });
  }

  function lxfdTypeNodes(sourceParent, targetParent, speed, done) {const __lxGenerationToken=window.__lxGeneration.capture();
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    const scroll = () => { if (thread) thread.scrollTop = thread.scrollHeight; };
    const moveCursor = (parent) => { cursor.remove(); parent.appendChild(cursor); scroll(); };
    const typeTextNode = (text, parent, next) => {
      const textNode = document.createTextNode("");
      let index = 0;
      parent.appendChild(textNode);
      moveCursor(parent);
      const tick = () => {
        textNode.nodeValue = String(text).slice(0, index);
        index += 1;
        if (index <= String(text).length) window.__lxGeneration.timeout(__lxGenerationToken,tick, speed);
        else next();
      };
      tick();
    };
    const typeChildList = (children, parent, next) => {
      let index = 0;
      const step = () => {
        if (index >= children.length) { next(); return; }
        typeNode(children[index], parent, () => { index += 1; step(); });
      };
      step();
    };
    const typeNode = (node, parent, next) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.nodeValue) { next(); return; }
        typeTextNode(node.nodeValue, parent, next);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) { next(); return; }
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      moveCursor(clone);
      typeChildList(Array.from(node.childNodes), clone, next);
    };
    targetParent.innerHTML = "";
    typeChildList(Array.from(sourceParent.childNodes), targetParent, () => {
      cursor.remove();
      scroll();
      if (done) done();
    });
  }

  // 生成阶段实时刷新时间线（件2，同 app.js lxRenderTraceLive 逻辑）：此时 .lxfd-ai-body
  // 里只有这一个结构，全量重绘最简单；lxfdAnimateFinal 收尾时会把 ai-body 整体替换掉，
  // 折叠态 HTML 随 finalHtml 一起进去，不依赖这里的实时 DOM。
  function lxfdRenderTraceLive(ai) {
    const body = ai && ai.querySelector && ai.querySelector(".lxfd-ai-body");
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    if (!body || !renderTrace) return;
    body.innerHTML = renderTrace(ai._traceLines, { collapsed: ai._traceCollapsed, foldable: ai._traceCollapsed, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 });
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdAnimateFinal(ai, rawText) {const __lxGenerationToken=window.__lxGeneration.capture();
    const body = ai?.querySelector(".lxfd-ai-body");
    if (!body) return Promise.resolve();
    // 收尾把时间线折叠态 HTML 拼进最终正文——本函数会整体替换 ai-body，生成阶段的实时 DOM
    // 保不住，得随最终 html 一起进去才能存档/恢复时保持折叠（同 app.js sendChat done 收尾）。
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const traceHtml = (ai && ai._traceLines && ai._traceLines.length && renderTrace)
      ? renderTrace(ai._traceLines, { collapsed: true, foldable: true, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 })
      : "";
    const html = traceHtml + mdLite(String(rawText || "").trim() || "我先为你整理好了相关内容。");
    ai.classList.add("lx-chat-skin");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      body.innerHTML = html;
      return Promise.resolve();
    }
    const loadingStarted = ai._loadingStarted || Date.now();
    if (!body.querySelector(".loading-line")) {
      body.innerHTML = '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div>';
    } else {
      const typing = body.querySelector(".loading-line .typing-text");
      if (typing) typing.textContent = "联想乐享正在生成中...";
    }
    return new Promise((resolve) => {
      const waitTime = Math.max(0, 5000 - (Date.now() - loadingStarted));
      window.__lxGeneration.timeout(__lxGenerationToken,() => {
        const source = document.createElement("div");
        source.innerHTML = html;
        lxfdTypeNodes(source, body, 18, () => {
          window.__lxGeneration.timeout(__lxGenerationToken,() => {
            body.innerHTML = html;
            if (thread) thread.scrollTop = thread.scrollHeight;
            resolve();
          }, 140);
        });
      }, waitTime);
    });
  }

  function lxfdFetchFollowups(question, answer) {
    const q = String(question || "").trim();
    const a = String(answer || "").trim().slice(0, 300);
    if (!q || !a) return Promise.resolve([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2200);
    return fetch("/api/leai/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, a }),
      signal: controller.signal
    }).then((r) => r.json()).then((d) => {
      window.clearTimeout(timer);
      return Array.isArray(d && d.questions) ? d.questions.filter(Boolean).slice(0, 3) : [];
    }).catch(() => {
      window.clearTimeout(timer);
      return [];
    });
  }

  // 答后「猜你想干」动作 chips：生成器收口 app-intent.actionChips（主/全屏共用一份，
  // 生成的句子被本地正则秒接闭环）；lxfdFill3 保证无论 LLM 追问成败都凑满 3 个（静态兜底）
  function lxfdActionChips(products) {
    return (window.__lxIntent && window.__lxIntent.actionChips) ? window.__lxIntent.actionChips(products) : [];
  }
  function lxfdFill3(arr) {
    const fb = (window.__lxIntent && window.__lxIntent.FOLLOWUP_FALLBACKS) || [];
    const out = [];
    (arr || []).concat(fb).forEach((x) => { if (x && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }

  const lxfdWait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const lxfdIsDocumentInsight = (text) => /(文档解读|解读.*文档|分析.*(?:文档|文件|PDF)|提炼.*(?:文档|文件)|核心结论.*关键数据)/i.test(String(text || ""));

  async function lxfdRunDocumentInsight() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._traceLines = [];
    ai._traceSkills = new Set(["Skill(文档解读)"]);
    ai.innerHTML = '<div class="lxfd-ai-body"><div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div></div>';
    thread?.appendChild(ai);
    chatState.sending = true;

    const body = ai.querySelector(".lxfd-ai-body");
    let showGenerating = true;
    const paintTrace = () => {
      if (!body) return;
      const trace = renderTrace
        ? renderTrace(ai._traceLines, { collapsed: false, foldable: false, skillCount: ai._traceSkills.size })
        : ai._traceLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
      const generating = showGenerating
        ? '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div>'
        : "";
      body.innerHTML = trace + generating;
      thread.scrollTop = thread.scrollHeight;
    };
    const pushTrace = async (line, delay, hideGenerating) => {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : delay)));
      if (hideGenerating) showGenerating = false;
      ai._traceLines.push(line);
      paintTrace();
    };

    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享正在判断", 1240, true)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("已判断：文档解读任务", 840)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享官方 SKILL：正在调用 Skill(文档解读)", 1040)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("正在读取文档结构与正文", 1240)));

    const traceHtml = renderTrace
      ? renderTrace(ai._traceLines.concat(["已完成文档内容提取"]), { collapsed: true, foldable: true, skillCount: ai._traceSkills.size })
      : "";
    body.innerHTML = traceHtml;
    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 3000)));

    const answerHtml = '<p>我已读取文档内容，下面是重点解读。</p>'
      + '<h4>核心结论</h4><ul><li>文档围绕当前业务目标、实施路径与结果要求展开，主线清晰。</li><li>重点任务已拆分为可执行阶段，需继续确认责任人、时间节点和验收口径。</li></ul>'
      + '<h4>关键信息</h4><ul><li><strong>目标：</strong>统一信息口径，提升执行与协作效率。</li><li><strong>路径：</strong>按“准备—执行—验收—复盘”分阶段推进。</li><li><strong>交付：</strong>关键数据、任务清单与结果说明需保持可追溯。</li></ul>'
      + '<h4>待确认项</h4><ul><li>部分时间节点和负责人尚未明确，建议在正式执行前补齐。</li><li>涉及外部数据或政策的内容，建议再核对最新来源。</li></ul>';
    const extrasHtml = renderLxfdPageCta(lxfdPageCtaMeta("open_documents"))
      + '<div class="lxfd-followups"><button type="button">继续提取文档中的关键数据</button><button type="button">按章节生成详细摘要</button><button type="button">整理成可执行任务清单</button></div>';
    body.innerHTML = traceHtml;
    const answerSource = document.createElement("div");
    answerSource.innerHTML = answerHtml;
    const answerHost = document.createElement("div");
    answerHost.className = "lxfd-ai-text";
    body.appendChild(answerHost);
    if (reduceMotion) {
      answerHost.innerHTML = answerHtml;
    } else {
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => lxfdTypeNodes(answerSource, answerHost, 18, resolve))));
    }
    answerHost.insertAdjacentHTML("afterend", extrasHtml);
    chatState.sending = false;
    thread.scrollTop = thread.scrollHeight;
    lxfdPersistCurrent();
    lxfdRenderHist();
    window.__lxGeneration.timeout(__lxGenerationToken,() => lxfdOpenFeatureInSplit("documents"), reduceMotion ? 0 : 600);
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}



  function lxfdIsNearbyStoreQuery(text) {
    const value = String(text || "").trim();
    return value.length <= 24 && !/预约|库存|营业|电话|服务权益|导航/.test(value) && /附近门店|联想门店|门店查询|查.{0,4}门店|找.{0,4}门店|推荐.{0,4}门店|^(门店|实体店|体验店|专卖店)$/.test(value);
  }

  async function lxfdRunUnifiedStoreAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的门店需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(420)));
    ai._traceLines.push("已判断：需要查询当前位置附近的联想授权门店");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(520)));
    ai._traceSkills.add("Skill(附近门店查询)");
    ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(附近门店查询)");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(760)));
    ai._traceLines[ai._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(附近门店查询) 已完成";
    lxfdRenderTraceLive(ai);
    const copy = "我已结合**当前位置**为你整理附近的**联想授权门店**，优先推荐距离较近、营业时间明确且支持产品体验、库存咨询和到店服务的门店。你可以先查看下方推荐，再到右侧比较**地址、营业状态与联系方式**，并按需发起**导航或预约**。";
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
    const body = ai.querySelector(".lxfd-ai-body");
    if (body) body.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "stores", title: "查看附近门店", desc: "已为你整理附近授权门店、距离与营业状态" }));
    lxfdPersistCurrent();
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
    chatState.sending = false;
    lxfdExportToMain();
    exitFullscreenWithReveal(() => lxfdRevealFeature("stores"));
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdEducationAuthKind(text) {
    const value = String(text || "").trim().replace(/[\s，,。.!！?？：:“”"'‘’]/g, "");
    if (!value || value.length > 160) return "";
    // Keep explicit opt-outs and product purchase/recommendation requests in their existing flows.
    if (/(?:不要|不用|无需|不想|不需要|取消|停止).{0,8}(?:教育|学生|教师|老师|师生|高考)/.test(value)) return "";
    if (/(?:推荐|对比|购买|选购|下单).{0,20}(?:商品|产品|机型|电脑|笔记本|平板)|待支付|生成订单/.test(value)) return "";
    const audience = /教育|学生|在校生|大学生|师生|教师|老师|高考/.test(value);
    const auth = /认证|认定|核验|教育认$/.test(value);
    const offer = /(?:教育|学生|在校生|大学生|师生|教师|老师|高考).{0,16}(?:特惠|优惠|折扣|打折|福利|权益|补贴)|(?:教育|学生|教师|师生)(?:专享|专属)?价/.test(value);
    if (!audience || (!auth && !offer)) return "";
    if (/高考/.test(value)) return "gaokao";
    if (/教师|老师/.test(value)) return "teacher";
    return "college";
  }

  function lxfdIsWorkplaceAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 36 && /职场|职场人|在职|工作|员工|企业职工/.test(value) && /认证|认定|核验|职场认$/.test(value);
  }

  function lxfdIsEnterpriseMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 48
      && /企业会员|企业身份|企业账户|企业采购负责人|企业认证/.test(value)
      && /认证|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseDiamondMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 56
      && /企业钻石会员|钻石企业会员|企业会员.{0,6}钻石/.test(value)
      && /认证|升级|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseLeadQuery(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 48) return false;
    const directLead = /^(?:我要|我想|帮我|现在)?(?:进行|提交|填写|办理|发起)?(?:企业|采购|项目)?留资(?:申请|信息|表单)?$/.test(value);
    const enterpriseIntent = /企业留资|企业咨询|采购留资|项目留资|提交(?:企业|采购|项目)需求|联系企业顾问|企业合作咨询/.test(value);
    return directLead || enterpriseIntent;
  }

  function lxfdEnterpriseLeadCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-enterprise-lead-reco" type="button" data-open-enterprise-lead data-lx-result-id="modal:enterprise-lead" aria-label="打开企业留资弹窗" aria-pressed="false"><span class="answer-cta-title">提交企业留资</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedEnterpriseLeadAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-auth-flow-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的企业留资需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push("已判断：需要进入企业采购需求留资流程");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = "Skill(企业采购需求留资)";
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = "提交**企业采购需求**后，联想企业顾问可结合采购规模、预算、应用场景与交付周期提供进一步支持。请准备**联系人、联系方式及需求说明**，提交前核对关键信息，后续沟通以企业顾问联系为准。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdEnterpriseLeadCard());
      const card = body?.querySelector(".lx-enterprise-lead-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.openLeadPanel?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdAuthRecommendationCard(type, kind) {
    if (type === "enterprise" || type === "enterprise-diamond") {
      const label = type === "enterprise-diamond" ? "认证企业钻石会员" : "立即认证企业会员";
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-enterprise-auth-reco" type="button" data-open-enterprise-auth-modal data-lx-result-id="modal:enterprise-member-auth" aria-label="打开企业会员认证弹窗" aria-pressed="false"><span><span class="answer-cta-title">${label}</span></span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    if (type === "workplace") {
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-workplace-auth-reco" type="button" data-open-wpa data-lx-result-id="modal:workplace-auth" aria-label="打开职场身份认证弹窗" aria-pressed="false"><span class="answer-cta-title">职场认证</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    const label = kind === "gaokao" ? "高考生教育认证" : (kind === "teacher" ? "教师教育认证" : "教育认证");
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco" type="button" data-open-stuauth="${escapeAttr(kind)}" data-lx-result-id="modal:education-auth:${escapeAttr(kind)}" aria-label="打开${escapeAttr(label)}弹窗" aria-pressed="false"><span class="answer-cta-title">${escapeHtml(label)}</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  function lxfdIsDiscountOrderQuery(text) {
    const value = String(text || "").trim();
    return /(?:领取|使用).{0,8}(?:全部|所有|可用)?.{0,8}优惠|(?:全部|所有|可用).{0,8}优惠.{0,8}(?:下单|订单)|待支付订单/.test(value) && /购买|下单|订单|支付/.test(value);
  }

  function lxfdPaymentRecommendationCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-payment-confirm-reco" type="button" data-open-payment-confirm data-lx-result-id="modal:pending-payment" aria-label="打开待支付订单弹窗" aria-pressed="false"><span class="answer-cta-title">待支付订单</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedDiscountOrderAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const product = window.__lxState?._pendingDiscountOrderProduct || window.__lxState?.currentProduct;
    if (!product || !window.__lxAgentAPI?.lxPreparePendingPayment) {
      const ai = document.createElement("div");
      ai.className = "lxfd-msg-ai lx-chat-skin";
      ai.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, "请先打开一款商品详情，我再为你领取全部可用优惠并生成待支付订单。")));
      return;
    }
    chatState.sending = true;
    const prepared = window.__lxAgentAPI.lxPreparePendingPayment(product);
    const claimed = Array.isArray(prepared?.claimed) ? prepared.claimed : [];
    const item = prepared?.item || product;
    const saved = Math.abs(Number(prepared?.discount) || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-payment-confirm-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的优惠下单需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(`已判断：需要核对${item.name || "当前商品"}与当前账户可用优惠`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      ai._traceSkills.add("Skill(优惠领取与订单生成)");
      ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(优惠领取与订单生成)");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：已自动领取全部 ${claimed.length} 项可用优惠`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = claimed.length
        ? `已为你自动领取**${claimed.length}项可用优惠**，共节省¥${saved}。商品、优惠与收货信息已核对，请在**待支付订单**中确认后继续。`
        : "当前商品暂无可叠加优惠，已按现价生成订单。商品与收货信息已核对，请在**待支付订单**中确认后继续。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdPaymentRecommendationCard());
      const card = body?.querySelector(".lx-payment-confirm-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunUnifiedAuthAnswer(type, kind = "college") {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const isWorkplace = type === "workplace";
    const isDiamond = type === "enterprise-diamond";
    const isEnterprise = type === "enterprise" || isDiamond;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now();
    ai._traceLines = [isDiamond ? "联想乐享正在判断你的企业钻石会员升级需求" : (isEnterprise ? "联想乐享正在判断你的企业会员认证需求" : (isWorkplace ? "联想乐享正在判断你的职场认证需求" : "联想乐享正在判断你的教育认证需求"))];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(isDiamond ? "已判断：需要进入企业钻石会员升级认证流程" : (isEnterprise ? "已判断：需要进入企业采购负责人认证流程" : (isWorkplace ? "已判断：需要进入企业在职身份认证流程" : "已判断：需要进入教育身份认证流程")));
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = isDiamond ? "Skill(企业钻石会员升级认证)" : (isEnterprise ? "Skill(企业会员身份认证)" : (isWorkplace ? "Skill(职场身份认证)" : "Skill(教育身份认证)"));
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = isDiamond
        ? "完成**企业钻石会员升级认证**后，可进一步解锁企业专享采购权益、专属服务与会员支持。请准备**企业名称、统一社会信用代码及企业邮箱**，提交后以正式核验结果为准。"
        : isEnterprise
        ? "完成**企业会员认证**后，可解锁企业专享价、采购补贴、对公付款及专票账期等权益。请准备企业名称与采购负责人信息，提交后以正式核验结果为准。"
        : isWorkplace
        ? "**职场认证**可用于核验企业在职身份，并解锁员工购机优惠、会员权益及相关服务。请按真实情况填写个人与企业资料，提交前核对**企业信息与在职材料**，认证结果以正式身份核验信息为准。"
        : "**教育特惠**面向在校生、教师及高考生，完成**教育身份认证**后，可解锁教育专属价格与相关会员权益。\n\n请在弹窗中选择真实身份与认证方式，填写学校等资料，核对**材料与有效期**后提交。你也可点击下方小卡重新打开认证，结果以正式核验为准。";
      ai.classList.add("lx-auth-flow-answer");
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard(type, kind));
      const card = body?.querySelector(".lx-edu-auth-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      if (isEnterprise) window.__lxOpenEnterpriseAuthModal?.();
      else if (isWorkplace) window.openWorkplaceAuth?.();
      else window.__lxAgentAPI?.openStudentAuth?.(kind);
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunMemberCouponCenter(value) {
    const token = window.__lxGeneration.capture();
    const generation = window.__lxGeneration;
    const data = window.__lxCouponCenter.describe(value);
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now() - 5000;
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    try {
      await generation.wait(token, lxfdAnimateFinal(ai, data.copy));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) {
        body.insertAdjacentHTML("beforeend", renderLxfdPageCta({
          feature: "member-coupon-center:" + data.category,
          resultId: "info:member-coupon-center",
          title: "查看会员领券中心",
          desc: data.desc
        }));
        body.querySelector('[data-lx-result-id="info:member-coupon-center"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await generation.wait(token, lxfdWait(reduceMotion ? 0 : 720));
      if (!generation.current(token)) return;
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        if (!generation.current(token)) return;
        lxfdEnsureRootSplitState();
        window.__lxOpenCouponCenter(data.category);
      });
    } finally {
      if (generation.current(token)) {
        chatState.sending = false;
        syncSend();
      }
    }
  }

  async function lxfdRunSolutionAnswer(industry = "") {
    const __lxGenerationToken = window.__lxGeneration.capture();
        let scoped = industry ? window.__lxIndustrySolutions.describe(industry) : null;
        const solutionNonce = chatState.conversationNonce;
        chatState.sending = true;
        try {
        const solutionAi = document.createElement("div");
        solutionAi.className = "lxfd-msg-ai";
        solutionAi._loadingStarted = Date.now();
        solutionAi._traceLines = ["联想乐享正在判断"];
        solutionAi._traceSkills = new Set();
        solutionAi._traceCollapsed = false;
        solutionAi.innerHTML = '<div class="lxfd-ai-body"></div>';
        thread?.appendChild(solutionAi);
        lxfdRenderTraceLive(solutionAi);
        solutionAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
        solutionAi._traceLines.push("已判断："+(scoped?scoped.title:"全集解决方案")+"检索任务");
        lxfdRenderTraceLive(solutionAi);
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
        solutionAi._traceSkills.add("Skill(解决方案推荐)");
        solutionAi._traceLines.push(scoped?"正在调用 Skill(解决方案推荐)":"联想乐享官方 SKILL：正在调用 Skill(解决方案推荐)");
        lxfdRenderTraceLive(solutionAi);
        if (scoped) scoped = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxIndustrySolutions.run(industry)));
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
        if (solutionNonce !== chatState.conversationNonce) { solutionAi.remove(); return; }
        solutionAi._traceLines.push("已完成：行业方案全集与分类楼层已生成");
        solutionAi._traceCollapsed = true;
        lxfdRenderTraceLive(solutionAi);

        const solutionCopy = scoped ? scoped.copy : [
          "我已为你汇总**乐享全集解决方案**，覆盖教育、医疗、政府、制造、金融、能源、交通和服务八大行业。",
          "每个行业都按照**独立楼层**组织，并结合核心业务场景、终端部署、基础设施与持续服务，方便你快速浏览和比较。",
          "你可以进入全集后**按行业标签定位**；当前视口会在每个楼层单排自适应展示 4–6 个方案。"
        ].join("\n\n");
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(solutionAi, solutionCopy)));
        if (solutionNonce !== chatState.conversationNonce) return;
        const solutionMeta = scoped ? {feature:scoped.feature,resultId:scoped.tabId,title:scoped.cardTitle,desc:scoped.desc} : lxfdPageCtaMeta("open_solution");
        const solutionBody = solutionAi.querySelector(".lxfd-ai-body");
        if (solutionBody && solutionMeta) {
          solutionBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(solutionMeta));
          const solutionCard = solutionBody.querySelector('.answer-cta');
          if (solutionCard) {
            solutionCard.classList.add("is-active");
            solutionCard.setAttribute("aria-pressed", "true");
          }
        }
        lxfdPersistCurrent();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
        lxfdExportToMain();
        if (solutionNonce !== chatState.conversationNonce) return;
        exitFullscreenWithReveal(() => { if (solutionNonce === chatState.conversationNonce) lxfdRevealFeature(scoped ? scoped.feature : "solution"); });
        } finally {if(window.__lxGeneration.current(__lxGenerationToken)){ if (solutionNonce === chatState.conversationNonce) chatState.sending = false; }}
  }

  async function lxfdRunCouponProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxCouponCenter.runProducts({query,token,
      
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(优惠券解读与可用商品)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'优惠券可用商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function lxfdRunCompareDisplayQuery(query) {
  const token=window.__lxGeneration.capture();let ai;
  return window.__lxComparisonDisplay.run(query,{token,
    busy:active=>{chatState.sending=active;syncSend();},
    answer:async text=>{
      if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
      await lxfdAnimateFinal(ai,text);
    },
    save:()=>window.__lxfdPersistCurrentNow?.()
  });
}
async function lxfdRunServiceProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxServiceProducts.run({query,token,
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(服务商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products,{serviceProduct:true}));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.setAttribute('data-lx-service-products-card','1');card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'推荐服务商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

async function lxfdRunEducationOfferQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxEducationOffers.run({query,token,
      authenticate:kind=>lfxdRunUnifiedAuthAnswer('education',kind),
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(教育优惠商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'教育优惠商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function submit(text) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const value = String(text || "").trim();
    if (!value || chatState.sending) return;
    if (typeof window.__lxRequireQueryAccess === "function" && !window.__lxRequireQueryAccess()) return;
    // 用户真正发出下一条消息后，新会话成立，恢复正常持久化。
    try { localStorage.removeItem("lexiang.newChatEmpty.v1"); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}
    // 发送问题时强制收起顶部灵动岛，保持与首页项目一致的紧凑标题态：
    // 「首页：当前问题 + 下拉箭头」。避免用户刚操作过导航时把整排频道带进对话态。
    setNav(false);
    convoPill?.blur();
    // 本轮桥接状态（全屏→分屏）
    let turnProducts = null;
    let turnTitle = "";
    let turnGrouped = false;
    let turnActions = []; // 本轮意图操作（action 事件带来的 op）——多意图一轮可能来多个（门店+优惠+会员），全记录，桥接后全开
    let pendingExtras = "";
    let pendingFollowups = [];
    let finalized = false;
    let finalizePromise = null;
    lxfdArchiveClaimProgressCards(thread);
    try { window.__lxHideSuggest && window.__lxHideSuggest(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');} // 发送即收起输入联想浮层（程序性清空不触发 input，不收会残留）
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    // 开始聊天后隐藏 actionbar（对齐官方；客服模式下 enterHuman 会恢复）
    if (!chatState.started && !chatState.human) {
      chatState.started = true;
      if (quick) quick.style.display = "none";
    }
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    thread?.classList.add("show");
    if (convoName) { convoName.textContent = shortText(value, 15); convoName.title = value; }
    // 全屏欢迎态首问=新对话：thread 还没有任何消息（非历史恢复/非分屏回流）说明用户从初始
    // 首页重新开聊，清掉主面板 boot 时 restore 的旧对话上下文，首问不背"以上为历史对话"的
    // 旧账（真机反馈）；旧对话在侧栏历史归档里可找回。
    if (thread && !thread.querySelector(".lxfd-msg-user, .lxfd-msg-ai")) {
      chatState.convId = null;
      if (window.__lxBridge && typeof window.__lxBridge.resetConversationContext === "function") window.__lxBridge.resetConversationContext();
    }
    const turnId = "turn-" + Date.now() + "-" + turns.length;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = value;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: value });
    renderTurnIndex(turnId);
    if (ta) { ta.value = ""; fit(); syncSend(); }
    // 发出提问就先存一次（含 lxfd key + 同步子站 key），AI 答完再存完整——避免答得慢时切站啥都没存
    try { lxfdPersistCurrent(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}

    if (window.__lxComparisonDisplay?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCompareDisplayQuery(value));
      return;
    }

    if (window.__lxServiceProducts?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunServiceProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matchCouponQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCouponProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunMemberCouponCenter(value));
      return;
    }

    if (window.__lxEducationOffers?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunEducationOfferQuery(value));
      return;
    }

    const educationAuthKind = lxfdEducationAuthKind(value);
    if (educationAuthKind) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunUnifiedAuthAnswer("education", educationAuthKind));
      return;
    }

    const solutionQuery = window.__lxIntent?.matchSolution(value);
    if (solutionQuery) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(solutionQuery.industry || ""));
      return;
    }

    if (window.__lxCustomerServiceQuery?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxCustomerServiceQuery.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{
          const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';
          ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';
          thread?.appendChild(ai);await lxfdAnimateFinal(ai,text);return ai;
        },
        card:(ai,html)=>{ai.querySelector('.lxfd-ai-body')?.insertAdjacentHTML('beforeend',html);ai.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'end'});},
        save:()=>lxfdPersistCurrent()
      }));
      return;
    }

    if (window.__lxQueryResults?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,window.__lxQueryResults.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        create:skill=>{const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now();ai.innerHTML='<div class="lxfd-ai-body"></div>';ai._traceLines=['正在调用 Skill('+skill+')'];ai._traceSkills=new Set();ai._traceCollapsed=false;thread?.appendChild(ai);lxfdRenderTraceLive(ai);return ai;},
        answer:async(ai,text,skill,status,success=true)=>{ai._traceLines=[status];ai._traceSkills=success?new Set([skill]):new Set();ai._traceCollapsed=true;await lxfdAnimateFinal(ai,text);},
        card:(ai,meta)=>{const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdPageCta({resultId:meta.resultId,title:meta.title,desc:meta.desc}));return body.querySelector('[data-lx-result-id="'+meta.resultId+'"]');},
        reveal:commit=>{lxfdPersistCurrent();lxfdExitToResultAtomically(commit);},
        save:()=>{if(thread?.querySelector('.lxfd-msg-ai'))lxfdPersistCurrent();else window.__lxSaveConversationNow?.();}
      }));
      return;
    }

    if (window.__lxGamingQuery?.matches(value)) {
      let gamingAi;
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxGamingQuery.run({
        token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{gamingAi=document.createElement('div');gamingAi.className='lxfd-msg-ai lx-chat-skin';gamingAi._loadingStarted=Date.now()-5000;gamingAi.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(gamingAi);await lxfdAnimateFinal(gamingAi,text);},
        card:products=>{chatState.lastProducts=products;const body=gamingAi.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
        open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'为你推荐',recoId}));},
        save:()=>window.__lxfdPersistCurrentNow?.()
      }));
      return;
    }

    if (lxfdIsDiscountOrderQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedDiscountOrderAnswer()));
      return;
    }
    if (lxfdIsEnterpriseLeadQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedEnterpriseLeadAnswer()));
      return;
    }
    if (lxfdIsWorkplaceAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("workplace")));
      return;
    }
    if (lxfdIsEnterpriseDiamondMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise-diamond")));
      return;
    }
    if (lxfdIsEnterpriseMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise")));
      return;
    }

    const serviceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    if (serviceProductFollowup) {
      chatState.sending = true;
      const products = typeof window.__lxServiceRecommendationProducts === "function" ? window.__lxServiceRecommendationProducts() : [];
      const region = (value.match(/所在地区是(.+?)，请推荐/) || [])[1] || "当前地区";
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      try {
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, `已按“拯救者游戏本 + **${region}** + **深度清灰/换硅脂**”匹配服务商品。你可以比较服务内容、适用性与预约方式。`)));
        const body = serviceAi.querySelector(".lxfd-ai-body");
        if (body) body.insertAdjacentHTML("beforeend", renderLxfdProducts(products, { serviceProduct: true }));
        const card = body?.querySelector("[data-lxfd-reco-id]");
        const recoId = card?.getAttribute("data-lxfd-reco-id") || "";
        await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
        lxfdPersistCurrent();
        lxfdExportToMain();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
        exitFullscreenWithReveal(() => window.__lxBridge?.revealProducts?.(products, { title: "推荐服务产品", recoId }));
      } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
        chatState.sending = false;
      }}
      return;
    }

    if (/^我的设备[。！!]?$/.test(value)) {
      chatState.sending = true;
      const deviceAi = document.createElement("div");
      deviceAi.className = "lxfd-msg-ai lx-chat-skin lx-device-query-answer";
      deviceAi._loadingStarted = Date.now();
      deviceAi._traceLines = ["联想乐享正在判断你的设备资产需求"];
      deviceAi._traceSkills = new Set();
      deviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(deviceAi);
      lxfdRenderTraceLive(deviceAi);
      deviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      deviceAi._traceLines.push("已判断：需要查询当前 Lenovo ID 下的设备资产");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      deviceAi._traceSkills.add("Skill(设备资产查询)");
      deviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(设备资产查询)");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      deviceAi._traceLines[deviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(设备资产查询) 已完成";
      deviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(deviceAi, "当前账号共有**8 台已绑定设备**，另有**1 台待绑定**。最近使用的是 ThinkBook 16p、拯救者 Y7000P、YOGA Air 14s；右侧已打开设备列表。")));
      const deviceBody = deviceAi.querySelector(".lxfd-ai-body");
      if (deviceBody) deviceBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "devices", title: "查看我的设备", desc: "8 台已绑定 · 1 台待绑定" }));
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        lxfdEnsureRootSplitState();
        if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
        else lxfdRevealFeature("devices");
      });
      return;
    }

    if (lxfdIsNearbyStoreQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedStoreAnswer()));
      return;
    }

    if (typeof window.__lxIsServiceIntakeQuery === "function" ? window.__lxIsServiceIntakeQuery(value) : /清灰|除尘|换硅脂|散热保养/.test(value)) {
      chatState.sending = true;
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi._loadingStarted = Date.now();
      serviceAi._traceLines = ["联想乐享正在判断你的设备服务需求"];
      serviceAi._traceSkills = new Set();
      serviceAi._traceCollapsed = false;
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      lxfdRenderTraceLive(serviceAi);
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      serviceAi._traceLines.push("已判断：清灰/换硅脂服务商品匹配");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      serviceAi._traceSkills.add("Skill(服务产品推荐)");
      serviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(服务产品推荐)");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      serviceAi._traceLines[serviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(服务产品推荐) 已完成";
      serviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, "已经明确是**清灰/换硅脂服务**。还需要确认**目标设备和所在地区**，才能匹配可购买、可预约的服务商品。")));
      const serviceBody = serviceAi.querySelector(".lxfd-ai-body");
      const choices = window.__lxServiceIntake && window.__lxServiceIntake.renderChoices ? window.__lxServiceIntake.renderChoices() : "";
      if (serviceBody && choices) serviceBody.insertAdjacentHTML("beforeend", choices);
      lxfdPersistCurrent();
      lxfdRenderHist();
      chatState.sending = false;
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      return;
    }

    if (/代金券/.test(value)) {
      chatState.sending = true;
      const voucherAi = document.createElement("div");
      voucherAi.className = "lxfd-msg-ai";
      voucherAi._loadingStarted = Date.now() - 5000;
      voucherAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(voucherAi);
      voucherAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(voucherAi, "已为你查询当前账户的**代金券资产**：共有 2 张可用券，分别适用于教育认证与以旧换新场景。你可以继续查看券面金额、适用范围和使用条件。")));
      const voucherBody = voucherAi.querySelector(".lxfd-ai-body");
      if (voucherBody) {
        voucherBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" }));
        voucherBody.querySelector('[data-lx-result-id="info:vouchers"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("vouchers"));
      return;
    }

    if (/限时红包|会员日红包|首发红包/.test(value)) {
      chatState.sending = true;
      const redPacketAi = document.createElement("div");
      redPacketAi.className = "lxfd-msg-ai";
      redPacketAi._loadingStarted = Date.now() - 5000;
      redPacketAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(redPacketAi);
      redPacketAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(redPacketAi, "已为你查询当前账户的**限时红包资产**：现有 2 个红包，合计 ¥84，其中 1 个将在明日到期。你可以继续查看适用活动、有效期与使用范围。")));
      const redPacketBody = redPacketAi.querySelector(".lxfd-ai-body");
      if (redPacketBody) {
        redPacketBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" }));
        redPacketBody.querySelector('[data-lx-result-id="info:redpacket"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("redpacket"));
      return;
    }

    if (/优惠券/.test(value)) {
      chatState.sending = true;
      const couponAi = document.createElement("div");
      couponAi.className = "lxfd-msg-ai";
      couponAi._loadingStarted = Date.now() - 5000;
      couponAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(couponAi);
      couponAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(couponAi, "已为你查询当前账户的**优惠券资产**：共有 3 张可用券，其中 1 张将在 7 天后到期。你可以查看每张券的使用门槛、适用范围和有效期。")));
      const couponBody = couponAi.querySelector(".lxfd-ai-body");
      if (couponBody) {
        couponBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" }));
        couponBody.querySelector('[data-lx-result-id="info:coupon"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("coupon"));
      return;
    }

    if (/乐豆|积分余额|乐豆余额/.test(value)) {
      chatState.sending = true;
      const pointsAi = document.createElement("div");
      pointsAi.className = "lxfd-msg-ai";
      pointsAi._loadingStarted = Date.now() - 5000;
      pointsAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(pointsAi);
      pointsAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(pointsAi, "已为你查询当前账户的**乐豆资产**：现有 2,580 乐豆，近 30 天获得 860、使用 300。你可以继续查看获取与使用记录，以及当前适用规则。")));
      const pointsBody = pointsAi.querySelector(".lxfd-ai-body");
      if (pointsBody) {
        pointsBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" }));
        pointsBody.querySelector('[data-lx-result-id="info:points"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("points"));
      return;
    }

    if (/会员/.test(value)) {
      chatState.sending = true;
      const profile = typeof window.__lxMemberQueryProfile === "function"
        ? window.__lxMemberQueryProfile()
        : { copy: "当前为**铂金会员**，乐豆余额**8,860豆**，可用于抵现和兑换好礼；等级权益、任务与会员活动已为你整理。", cardDesc: "会员等级 · 乐豆 · 权益与任务" };
      const memberAi = document.createElement("div");
      memberAi.className = "lxfd-msg-ai";
      memberAi._loadingStarted = Date.now() - 5000;
      memberAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(memberAi);
      memberAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(memberAi, profile.copy)));
      const memberBody = memberAi.querySelector(".lxfd-ai-body");
      if (memberBody) {
        memberBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "member", title: "查看会员中心", desc: profile.cardDesc }));
        memberBody.querySelector('[data-lx-result-id="info:member"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("member"));
      return;
    }

    // 文档解读是全屏对话内的生成任务，不走 open_documents 页面跳转快路径。
    if (lxfdIsDocumentInsight(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunDocumentInsight()));
      return;
    }

    // ── lxfd 意图路由分流 ──────────────────────────────────────────────
    // 0. 全权代买（多步任务链）意图：只做标记，不再立即退全屏（真机反馈：还没开始推流就切左右
    //    结构，右侧只有个光秃秃商城首页很突兀）。改为和普通提问一致——留在全屏走官方流式，
    //    用户看完整推荐回答；done 桥接分屏时才起链（officialWait 直接给已到手的商品，链 step1
    //    秒过），「对比→选款→下单」的执行视图在有内容可看时才出现。
    const _lxfdServiceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    const _lxfdAutoBuy = !_lxfdServiceProductFollowup && window.__lxIntent && window.__lxIntent.matchAutoBuy ? window.__lxIntent.matchAutoBuy(value) : null;

    // 1. 本地快路径（正则统一收口 app-intent.js，主面板/全屏共用一份，改一处两边同时生效）
    // 代买时跳过：句里"对比/下单"字样会被误判成 control 操作抢断官方推荐流（同主面板 _autoBuy 防护）
    const _lxfdLocalCtrl = !_lxfdAutoBuy && window.__lxIntent ? window.__lxIntent.matchControl(value) : null;
    if (_lxfdLocalCtrl) {
      if (_lxfdLocalCtrl.op === "open_solution") {
        await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(_lxfdLocalCtrl.industry || ""));
        return;
      }
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      _lxfdCtrlText.textContent = _lxfdLocalCtrl.msg;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      // 执行操作：通过 __lxExecControl 桥（全屏态 lxExecControl 不在此作用域）
      const _execOp = _lxfdLocalCtrl.op;
      const _execTarget = _lxfdLocalCtrl.target;
      const _execPageMeta = lxfdPageCtaMeta(_execOp);
      if (_execPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_execPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_execPageMeta.feature);
        });
        return;
      }
      if (_execOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_execOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_execOp, _execTarget);
      }
      return;
    }

    // 思考过程时间线（件2）：气泡必须在远程意图路由 fetch **之前**上屏——路由最长 4.5s，
    // 放在后面用户盯着空白（真机反馈）。首行"正在判断"发送瞬间出现，"已判断"等路由分流
    // 落定再追加（走 control 分支时整个气泡移除）。渲染复用主面板 renderSkillTrace 桥接。
    const _traceLines = ["联想乐享正在判断"]; // 省略号由 .current::after 三点循环动画补，文本不写死
    const _renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = `<div class="lxfd-ai-body">${_renderTrace ? _renderTrace(_traceLines, { collapsed: false, foldable: false, skillCount: 0 }) : ""}</div>`;
    ai._raw = "";
    ai._loadingStarted = Date.now();
    ai._traceLines = _traceLines;
    ai._traceSkills = new Set();
    ai._traceCollapsed = false;
    ai._traceLastRaw = "";
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    const _lxfdPushJudged = () => {
      if (ai._judgedPushed) return;
      ai._judgedPushed = true;
      _traceLines.push(_lxfdAutoBuy ? "已判断：多步代买任务，推荐完成后进入执行视图" : "已判断：商品咨询 → 调用联想乐享官方 SKILL");
      lxfdRenderTraceLive(ai);
    };

    // 2. 远程意图路由器（代买时跳过：分类器可能把"选/下单"误判成 control 操作抢断推荐流，同主面板）
    let _lxfdIntentResult = null;
    if (!_lxfdAutoBuy) try {
      const _lxfdIntentAbort = new AbortController();
      const _lxfdIntentTimer = window.__lxGeneration.timeout(__lxGenerationToken,() => _lxfdIntentAbort.abort(), 4500);
      const _lxfdIntentRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: _lxfdIntentAbort.signal
      })));
      clearTimeout(_lxfdIntentTimer);
      if (_lxfdIntentRes.ok) _lxfdIntentResult = await window.__lxGeneration.wait(__lxGenerationToken,(_lxfdIntentRes.json()));
    } catch (_lxfdIntentErr) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError'); /* 超时/失败 → 降级 chat */ }
    if (_lxfdIntentResult && _lxfdIntentResult.type === "control" && _lxfdIntentResult.op) {
      ai.remove(); // 操作指令：撤掉"正在判断"时间线气泡，走操作确认消息（同主面板做法）
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      const _lxfdOpNames = { close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面", open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询", open_edu_zone: "打开了教育专区", open_documents: "打开了文档解读与资料中心", open_product: `正在帮你打开「${_lxfdIntentResult.target || "该商品"}」`, enter_fullscreen: "切换到全屏对话模式（当前已在全屏）", exit_fullscreen: "退出了全屏模式" };
      _lxfdCtrlText.textContent = `好的，已为你${_lxfdOpNames[_lxfdIntentResult.op] || "执行了操作"}。`;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      const _lxfdExecOp = _lxfdIntentResult.op;
      const _lxfdExecTarget = _lxfdIntentResult.target || "";
      const _lxfdPageMeta = lxfdPageCtaMeta(_lxfdExecOp);
      if (_lxfdPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_lxfdPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_lxfdPageMeta.feature);
        });
        return;
      }
      if (_lxfdExecOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_lxfdExecOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_lxfdExecOp, _lxfdExecTarget);
      }
      return;
    }
    // ── lxfd 意图路由分流结束 ─────────────────────────────────────────

    // 走到这里说明不是操作指令：补"已判断"行——意图路由刚落定，天然有 0.5~4.5s 节奏，
    // 不和首行同帧蹦出；代买跳过了意图路由没有天然节奏，给 500ms 微延迟（同主面板做法）。
    if (_lxfdAutoBuy) window.__lxGeneration.timeout(__lxGenerationToken,_lxfdPushJudged, 500); else _lxfdPushJudged();
    const body = ai.querySelector(".lxfd-ai-body");
    const nonce = chatState.conversationNonce;
    chatState.sending = true;
    let hasContent = false;
    const revealAi = () => {
      if (hasContent) return;
      hasContent = true;
      body?.querySelector(".lxfd-typing, .loading-line")?.remove();
      ai._textBox = document.createElement("div");
      ai._textBox.className = "lxfd-ai-text";
      if (body) body.insertBefore(ai._textBox, body.firstChild);
      ai._raw = "";
      ai._writer = window.__lxCreateTypewriter(ai._textBox, {
        charsPerTick: 1,
        interval: 24,
        scroll: () => {
          if (thread) thread.scrollTop = thread.scrollHeight;
        }
      });
    };
    // lxfd 前端兜底超时：50秒后强制解锁
    const _lxfdSendTimeout = window.__lxGeneration.timeout(__lxGenerationToken,() => {
      if (chatState.sending && chatState.conversationNonce === nonce) {
        chatState.sending = false;
        ai._raw = "响应超时，请重试。";
        lxfdAnimateFinal(ai, ai._raw);
      }
    }, 50000);
    try {
      chatState._fallbackFired = false;
      // 代买句剥成交短语再发官方（「直接下单」会触发官方下单 Skill 不回商品清单），收口 app-intent 与主面板共用
      const _lxfdAskText = _lxfdAutoBuy && window.__lxIntent && window.__lxIntent.stripPurchasePhrase
        ? window.__lxIntent.stripPurchasePhrase(value)
        : value;
      const sendMsg = chatState.human
        ? ('[系统提示: 请以"专属客服小联"身份回复, 像人工客服一样亲切自然简短直接, 不用 markdown/列表/标题, 不暴露 AI 身份, 严禁输出"QA对""知识库""参考资料"等内部字样或📎等标记。]\n\n用户问: ' + value)
        : _lxfdAskText;
      const lxfdImgUrl = window.__lxfdPendingImage || undefined;
      window.__lxfdPendingImage = null;
      const imgTipEl = document.querySelector('.lxfd-img-tip');
      if (imgTipEl) imgTipEl.remove();
      const lxfdUseHuoshan = !!lxfdImgUrl || !!window.__lxWebSearch;
      const response = lxfdUseHuoshan
        ? await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              image_url: lxfdImgUrl,
              web_search: !!window.__lxWebSearch,
              thinking_mode: !!window.__lxThinking,
              conv_id: chatState.convId || undefined
            })
          })))
        : await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              sessionId: chatState.convId || undefined,
              site: document.body.dataset.page || 'personal',
              enableThinking: !!window.__lxThinking,
              ...(window.__lxGeo || {})
            })
          })));
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const lxfdHandlers = {
        chunk: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          const content = payload.text || data || "";
          if (/^\s*params\s*error\.?\s*$/i.test(content)) return;
          if (!content) return;
          // 首个 chunk 到达：思考过程时间线收起成一行摘要条，把舞台让给正文（同主面板）
          if (!ai._traceCollapsed) { ai._traceCollapsed = true; lxfdRenderTraceLive(ai); }
          hasContent = true;
          ai._raw += content;
        },
        status: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
          if (payload.text) {
            const raw = String(payload.text);
            if (raw !== ai._traceLastRaw) { // 去重相邻重复（官方 status 流常见连续重复 ping）
              ai._traceLastRaw = raw;
              const skillMatch = raw.match(/^(正在获取数据|已获取数据):(Skill\(.+\))$/);
              let line = raw;
              if (skillMatch) {
                ai._traceSkills.add(skillMatch[2]);
                line = skillMatch[1] === "正在获取数据"
                  ? `联想乐享官方 SKILL：正在调用 ${skillMatch[2]}`
                  : `联想乐享官方 SKILL：${skillMatch[2]} 已完成`;
              }
              ai._traceLines.push(line);
              lxfdRenderTraceLive(ai);
            }
          }
        },
        products: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          let products = payload.products || [];
          // 用户点名要N款(2-6)而官方固定回5-6款 → 按要求截断
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (!products.length) return;
          hasContent = true;
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品以便 done 时桥接到主面板
          turnProducts = products;
          chatState.lastProducts = products;
          chatState.lastProductsMeta = { title: "AI 推荐", grouped: false };
        },
        display: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          let products = payload.products || payload.items || [];
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (products.length || payload.title) hasContent = true;
          if (payload.title && !ai._raw) {
            ai._raw = payload.title;
          }
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品及展示元信息以便 done 时桥接到主面板
          if (products.length) {
            turnProducts = products;
            turnTitle = payload.title || "";
            turnGrouped = !!payload.grouped;
            chatState.lastProducts = products;
            chatState.lastProductsMeta = { title: turnTitle, grouped: turnGrouped };
          }
        },
        clicks: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const list = (parseJson(data).clicks) || [];
          if (!list.length || !body) return;
          pendingExtras += '<div class="leai-clicks" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + list.map((c) =>
            `<button type="button" class="leai-click-btn" data-leai-url="${escapeAttr(c.link_url || "")}" data-leai-cb="${escapeAttr(c.callback_data || "")}" data-leai-event="${escapeAttr(c.event_type || "")}">${escapeHtml(c.display_text)}</button>`
          ).join("") + "</div>";
        },
        suggestions: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          pendingFollowups = (payload.suggestions || []).filter(Boolean).slice(0, 3);
        },
        action: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const { op } = parseJson(data) || {};
          const pageMeta = lxfdPageCtaMeta(op);
          if (pageMeta) {
            if (pageMeta.feature === "solution") pendingExtras += renderLxfdLeadCta();
            pendingExtras += renderLxfdPageCta(pageMeta);
            if (turnActions.indexOf(pageMeta.feature) < 0) turnActions.push(pageMeta.feature);
          } else if (op === 'auth') {
            // 职场认证与教育认证统一使用标准结果卡，点击后直接打开认证弹窗。
            pendingExtras += `<button class="answer-cta lx-answer-page lx-auth-answer-card" type="button" data-open-wpa aria-label="打开职场身份认证弹窗">
              <span class="answer-cta-copy">
                <span class="answer-cta-title">职场身份认证</span>
                <span class="answer-cta-desc">认证后享购机优惠、AI 资源与专属权益</span>
              </span>
              <span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span>
            </button>`;
          } else if (op) {
            if (turnActions.indexOf(op) < 0) turnActions.push(op); // 记录意图，done 时桥接后再执行（全屏下直接开标签会被遮盖）
          }
        },
        control: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data) || {};
          // 页面操作（关标签/回首页/开订单等）：桥接到主面板执行
          if (payload.op && typeof window.__lxExecControl === 'function') window.__lxExecControl(payload.op, payload.target);
        },
        done: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (finalized) return;
          finalized = true;
          finalizePromise = (async () => {
            window.clearTimeout(_lxfdSendTimeout);
            const payload = parseJson(data);
            if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
            await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
            const finalBody = ai.querySelector(".lxfd-ai-body");
            if (pendingExtras && finalBody) { finalBody.insertAdjacentHTML("beforeend", pendingExtras); if (thread) thread.scrollTop = thread.scrollHeight; }
            if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
            pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
            if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
            lxfdPersistCurrent();
            lxfdRenderHist();
            const isFullscreen = document.body.classList.contains("assistant-fullscreen");
            // 代买任务：推荐回答已在全屏展示完，此刻才切执行视图起链（真机反馈：不能一发问就分屏）。
            // officialWait 直接给已到手的商品，链 step1 秒过进入「对比→选款→下单」。
            if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // 链卡走裸 addMessage，需先补分屏布局（老坑：不补则背景停在欢迎门户，链卡在 DOM 里看不见）
                if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
                window.__lxRunChain("auto_buy_official", {
                  maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
                  minPrice: _lxfdAutoBuy.params.minPrice || 0,
                  officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
                  rawText: value
                });
                if (thread) thread.innerHTML = "";
              });
            } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
              // 官方带回商品 → 自动桥接分屏右侧展示（所推即所见）；只有纯 action 无商品才走功能页桥接
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
                turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：门店/优惠/会员标签全开
                if (thread) thread.innerHTML = "";
              });
            } else if (turnActions.length && isFullscreen && window.__lxBridge) {
              // 本轮只有意图无商品：同样桥接退全屏，再开功能标签
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // lxfdRevealFeature 内部会先 lxfdEnsureRootSplitState 补首页分屏布局
                // （不做这步 .shell 仍 display:none → 功能标签渲染了但主面板隐藏=空白）
                turnActions.forEach((op) => lxfdRevealFeature(op));
                if (thread) thread.innerHTML = "";
              });
            }
          })();
        },
        fallback: async () => {
          if (nonce !== chatState.conversationNonce) return;
          if (chatState._fallbackFired) return;
          chatState._fallbackFired = true;
          try {
            const huoRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,'/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: sendMsg, conv_id: chatState.convId || undefined })
            })));
            if (!huoRes.ok || !huoRes.body) throw new Error('fallback upstream ' + huoRes.status);
            await window.__lxGeneration.wait(__lxGenerationToken,(readSse(huoRes, lxfdHandlers)));
          } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
            ai._raw = '当前服务暂时不可用，请稍后再试。';
            if (!finalized) {
              finalized = true;
              finalizePromise = lxfdAnimateFinal(ai, ai._raw);
            }
          }
        }
      };
      await window.__lxGeneration.wait(__lxGenerationToken,(readSse(response, lxfdHandlers)));
      if (nonce !== chatState.conversationNonce) return;
      if (finalizePromise) {
        await window.__lxGeneration.wait(__lxGenerationToken,(finalizePromise));
      } else if (!finalized) {
        finalized = true;
        if (!hasContent && !ai._raw && !pendingExtras) {
          ai._raw = "我已经收到请求，可以继续补充预算、用途或偏好的机型。";
        }
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
        const finalBody = ai.querySelector(".lxfd-ai-body");
        if (pendingExtras && finalBody) finalBody.insertAdjacentHTML("beforeend", pendingExtras);
        if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
        pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
        if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
        lxfdPersistCurrent();
        lxfdRenderHist();
        const isFullscreen = document.body.classList.contains("assistant-fullscreen");
        // 与上方 done 分支同一条规则：代买起链 > 有商品分屏展示 > 纯 action 功能页桥接。
        if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
            window.__lxRunChain("auto_buy_official", {
              maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
              minPrice: _lxfdAutoBuy.params.minPrice || 0,
              officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
              rawText: value
            });
            if (thread) thread.innerHTML = "";
          });
        } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
            turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：标签全开（同 done 分支）
            if (thread) thread.innerHTML = "";
          });
        } else if (turnActions.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            turnActions.forEach((op) => lxfdRevealFeature(op));
            if (thread) thread.innerHTML = "";
          });
        }
      }
    } catch (error) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
      console.error("[lxfd] submit 流程异常（此前静默吞掉，排障困难）:", error);
      if (nonce !== chatState.conversationNonce) return;
      ai._raw = "当前 AI 服务暂时不可用，请稍后重试。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      clearTimeout(_lxfdSendTimeout);
      if (nonce === chatState.conversationNonce) chatState.sending = false;
      ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  window.lxfdSubmit = submit;
  window.lxfdReset = resetConversation;
  // 分屏→全屏回退：关空右侧 tab 时带入主面板对话回全屏
  window.__lxfdEnterFromSplit = function() {
    if (thread) thread.innerHTML = "";
    enterFullscreen();  // enterFullscreen 内检测到 thread 空会自动 lxfdImportFromMain
  };
  // 新建对话回全屏欢迎态
  window.__lxfdNewFullscreen = function() {
    resetConversation(true);
    enterFullscreen();
  };

  convoPill?.addEventListener("click", () => setNav(!navCluster.classList.contains("open")));
  navCluster?.addEventListener("mouseenter", () => { clearTimeout(hoverTimer); });
  navCluster?.addEventListener("mouseleave", () => { clearTimeout(hoverTimer); setNav(false); });
  $$("#lxfdNavSheet a").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    $$("#lxfdNavSheet a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    setNav(false);
    const path = navPaths[a.dataset.page] || "/";
    const currentPath = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
    const targetPath = path.endsWith("/") ? path : `${path}/`;
    if (currentPath === targetPath) location.reload();
    else location.assign(path);
  }));
  document.addEventListener("click", (e) => { if (navCluster && !navCluster.contains(e.target)) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setNav(false); if (!wide()) setRailManual(false); } });
  railFab?.addEventListener("click", () => setRailManual(true));
  $("#lxfdRailClose")?.addEventListener("click", () => setRailManual(false));
  $(".lxfd-actions")?.addEventListener("click", (e) => {
    const accountAction = e.target.closest(".lxfd-account-menu [data-account-action]");
    if (accountAction) {
      const action = accountAction.dataset.accountAction || "";
      accountAction.closest(".lxfd-account-wrap")?.classList.remove("open");
      if (action === "member") {
        e.preventDefault();
        e.stopPropagation();
        submit("会员中心");
        return;
      }
    }
    const button = e.target.closest(".lxfd-ic");
    if (!button) return;
    const label = button.getAttribute("aria-label") || "";
    if (button.dataset.lxfdOpen === "cart" || label.includes("购物车")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("cart", { sendQuery: true });
      return;
    }
    if (button.dataset.lxfdOpen === "orders" || label.includes("订单")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("orders", { sendQuery: true });
      return;
    }
    // 首页空白态胶囊里的历史入口（必须在兜底 exitFullscreen 之前拦下）：
    // 开「历史记录」弹窗（与分屏同款），不拉左侧 rail（真机反馈）
    if (button.id === "lxfdTopHistBtn" || label.includes("历史")) {
      e.preventDefault();
      if (window.__lxBridge && typeof window.__lxBridge.openHistoryModal === "function") window.__lxBridge.openHistoryModal();
      else setRailManual(true);
      return;
    }
    e.preventDefault();
    exitFullscreen();
  });
  scrim?.addEventListener("click", () => setRailManual(false));
  function lxfdStartNewConversation(collapseRail) {
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    resetConversation(!!collapseRail);
    if (logicalPath !== "/") {
      // 子频道的全屏新建对话是“收起回当前频道新对话”，
      // 不是停留在全屏欢迎态。复用同一收起动画与主面板 reset 链路。
      exitFullscreenWithReveal(() => window.__lxBridge?.newConversationInCurrentChannel?.());
    }
  }
  $("#lxfdNewChat")?.addEventListener("click", () => lxfdStartNewConversation(true));
  // 全屏左侧悬浮“＋”与历史栏内“新建对话”必须是同一语义；此前这里只清空
  // lxfd thread，导致用户仍停在全屏而没有回到当前频道首页。
  railNewFab?.addEventListener("click", () => lxfdStartNewConversation(false));
  historySearch?.addEventListener("input", () => lxfdRenderHist(historySearch.value));
  $("#lxfdHist")?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-conv-item]");
    const action = e.target.closest(".lxfd-hist-action");
    if (action && item) {
      e.preventDefault();
      e.stopPropagation();
      const id = item.dataset.convItem;
      if (action.dataset.action === "delete" && !window.confirm("确认删除这条历史对话吗？")) return;
      lxfdUpdateConversation(id, action.dataset.action);
      return;
    }
    const a = e.target.closest("a[data-conv]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.conv) lxfdLoadConv(a.dataset.conv);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lxfd-hist-item")) return;
    $$(".lxfd-hist-item.menu-open").forEach(node => { node.classList.remove("menu-open"); node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openItem = $(".lxfd-hist-item.menu-open");
    if (!openItem) return;
    openItem.classList.remove("menu-open");
    const trigger = openItem.querySelector(".lxfd-hist-more");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  });
  $$(".lxfd-comp-left .lxfd-toggle").forEach(btn => btn.addEventListener("click", () => { const on = btn.classList.toggle("on"); btn.setAttribute("aria-pressed", on ? "true" : "false"); if (btn.textContent.includes("深度思考")) window.__lxThinking = on; if (btn.textContent.includes("联网")) window.__lxWebSearch = on; }));
  // lxfd 图片上传
  const lxfdImgBtn = document.querySelector('.lxfd-img-btn');
  if (lxfdImgBtn) {
    const lxfdFileInput = document.createElement('input');
    lxfdFileInput.type = 'file';
    lxfdFileInput.accept = 'image/*';
    lxfdFileInput.style.display = 'none';
    lxfdFileInput.id = 'lxfdFileInput';
    document.body.appendChild(lxfdFileInput);
    lxfdImgBtn.addEventListener('click', () => lxfdFileInput.click());
    lxfdFileInput.addEventListener('change', async () => {
      const file = lxfdFileInput.files && lxfdFileInput.files[0];
      if (!file) return;
      lxfdFileInput.value = '';
      try {
        lxfdImgBtn.disabled = true;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data && data.url) {
          window.__lxfdPendingImage = data.url;
          const dock = document.querySelector('.lxfd-dock');
          let imgTip = dock && dock.querySelector('.lxfd-img-tip');
          if (!imgTip && dock) {
            imgTip = document.createElement('div');
            imgTip.className = 'lxfd-img-tip';
            imgTip.style.cssText = 'font-size:12px;color:#979797;padding:4px 12px;display:flex;align-items:center;gap:6px';
            dock.insertBefore(imgTip, dock.querySelector('.lxfd-composer'));
          }
          if (imgTip) {
            imgTip.innerHTML = '<span>已添加图片</span><button type="button" style="border:none;background:none;cursor:pointer;color:#b8252e;font-size:12px" id="lxfdImgClear">×</button>';
            const clearBtn = imgTip.querySelector('#lxfdImgClear');
            if (clearBtn) clearBtn.addEventListener('click', () => { window.__lxfdPendingImage = null; imgTip.remove(); });
          }
        }
      } catch (_e) {
        // 上传失败静默处理
      } finally {
        lxfdImgBtn.disabled = false;
      }
    });
  }

  (function initLxfdHomeGallery() {
    const data = {
      new: [
        { nm: "拯救者 Y9000P 2026", ds: "i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏", price: "15,098", badge: "新品首发", wm: "LEGION Y9000P", img: "../img/lxfd-gallery-1-1.jpg", g: "linear-gradient(135deg,#252525,#4d144a 58%,#625b68)", q: "请解读这款商品：拯救者 Y9000P 2026，配置是 i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏，价格约 ¥15,098，适合什么人买？" },
        { nm: "YOGA Air 14c 2026", ds: "酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控", price: "8,999", badge: "轻薄旗舰", wm: "YOGA Air 14c", img: "../img/lxfd-gallery-1-2.jpg", g: "linear-gradient(135deg,#252525,#625b68 58%,#979797)", q: "请解读这款商品：YOGA Air 14c 2026，配置是酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控，价格约 ¥8,999，适合什么人买？" },
        { nm: "小新Pad Pro 13英寸", ds: "酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄", price: "7,299", badge: "全能之选", wm: "Xiaoxin Pro16", img: "../img/lxfd-gallery-1-3.jpg", g: "linear-gradient(135deg,#0c2342,#252525 58%,#48d39e)", q: "请解读这款商品：小新Pad Pro 13英寸，配置是酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄，价格约 ¥7,299，适合什么人买？" }
      ],
      act: [
        { nm: "618 年中钜惠", ds: "全场至高省 2000，下单再享 12 期免息", price: "省 2000", isText: true, badge: "限时", wm: "618 SALE", g: "linear-gradient(135deg,#252525,#b8252e 56%,#e42b20)", q: "618 年中钜惠有什么优惠？怎么参加？" },
        { nm: "教育优惠季", ds: "学生 / 教师认证，专属机型至高 9 折", price: "享 9 折", isText: true, badge: "进行中", wm: "EDU SEASON", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育优惠季怎么参加？学生认证有哪些优惠？" },
        { nm: "以旧换新", ds: "旧机抵扣 + 平台补贴，至高补 800 元", price: "补 800", isText: true, badge: "可叠加", wm: "TRADE-IN", g: "linear-gradient(135deg,#252525,#625b68 58%,#48d39e)", q: "以旧换新怎么操作？旧机能抵多少钱？" }
      ],
      news: [
        { nm: "联想 2026 拯救者全系发布", ds: "搭载新一代 AI 引擎与超频引擎，性能再进阶", price: "查看全文", isText: true, badge: "官方", wm: "PRESS", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#625b68)", q: "联想 2026 拯救者全系发布了哪些新品？有什么亮点？" },
        { nm: "联想 AI PC 出货领跑行业", ds: "IDC 最新报告：中国 AI PC 市场份额持续第一", price: "查看全文", isText: true, badge: "行业", wm: "INSIGHT", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "联想 AI PC 有哪些优势？为什么市场份额第一？" },
        { nm: "联想乐享门店破 5000 家", ds: "线下服务网络全面升级，到店体验更进一步", price: "查看全文", isText: true, badge: "动态", wm: "RETAIL", g: "linear-gradient(135deg,#252525,#625b68 58%,#bcb4c1)", q: "联想门店能提供哪些服务？帮我找附近门店。" }
      ],
      case: [
        { nm: "某重点高校机房方案", ds: "1200 台统一部署与运维，开机即用，集中管理", price: "教育行业", isText: true, badge: "已交付", wm: "CAMPUS", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育行业的机房统一部署方案是怎么做的？" },
        { nm: "设计工作室创作方案", ds: "ThinkStation + 校色屏整体方案，效率提升 40%", price: "创意设计", isText: true, badge: "标杆", wm: "STUDIO", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#a262d7)", q: "设计创作行业有什么整体方案？ThinkStation 怎么配？" },
        { nm: "连锁零售 POS 升级", ds: "300+ 门店终端统一焕新，稳定支撑高峰交易", price: "零售行业", isText: true, badge: "规模化", wm: "RETAIL POS", g: "linear-gradient(135deg,#252525,#5b1452 58%,#e42b20)", q: "连锁零售门店终端怎么统一升级？有什么方案？" }
      ]
    };
    const root = document.querySelector(".lxfd-home-gallery");
    const grid = document.getElementById("lxfdGalleryGrid");
    const tabs = Array.from(document.querySelectorAll("[data-gallery-tab]"));
    const ink = document.getElementById("lxfdGalleryInk");
    if (!root || !grid || !tabs.length) return;
    const price = (item) => item.isText ? escapeHtml(item.price) : "¥" + escapeHtml(item.price);
    const card = (item) => {
      const shotClass = item.img ? "gallery-shot has-image" : "gallery-shot";
      const inner = item.img
        ? '<img class="gallery-img" src="' + escapeAttr(item.img) + '" alt="" loading="eager" />'
        : '<span class="gallery-lid"></span><span class="gallery-wm">' + escapeHtml(item.wm) + '</span>';
      return '<article class="gallery-card is-preview-only" aria-disabled="true"><div class="' + shotClass + '" style="background:' + escapeAttr(item.g) + '">' + inner + '</div>'
        + '<div class="gallery-meta"><span class="gallery-badge">' + escapeHtml(item.badge) + '</span><strong class="gallery-name">' + escapeHtml(item.nm) + '</strong><span class="gallery-desc">' + escapeHtml(item.ds) + '</span>'
        + '<div class="gallery-foot"><span class="gallery-price">' + price(item) + '</span><span class="gallery-go" aria-hidden="true">了解 →</span></div></div></article>';
    };
    // 首页内容卡当前仅作预览：保留 CSS hover，点击与键盘操作均不发送对话。
    grid.addEventListener("click", (e) => {
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    const moveInk = () => {
      const active = root.querySelector(".gallery-tab.is-active");
      if (active && ink) {
        ink.style.left = active.offsetLeft + "px";
        ink.style.width = active.offsetWidth + "px";
      }
    };
    const render = (key, animate) => {
      if (!data[key]) key = "new";
      if (!animate) {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
        return;
      }
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
      }, 120);
    };
    const activateTab = (tab) => {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      moveInk();
      render(tab.dataset.galleryTab, true);
    };
    tabs.forEach((tab) => {
      tab.addEventListener("pointerenter", () => activateTab(tab));
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("focus", () => activateTab(tab));
    });
    render("new", false);
    requestAnimationFrame(moveInk);
    window.addEventListener("resize", moveInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  })();

  (function initLxfdScopeActions() {
    const scope = document.getElementById("lxfdScopeActions");
    const more = document.getElementById("lxfdScopeMore");
    const moreBtn = more?.querySelector(".lxfd-scope-more-btn");
    const close = () => {
      more?.classList.remove("open");
      moreBtn?.setAttribute("aria-expanded", "false");
    };
    if (scope) {
      scope.addEventListener("click", (event) => {
        const chip = event.target.closest(".lxfd-scope-chip");
        if (!chip) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        const label = chip.textContent.trim();
        if (!label) return;
        submit(LXFD_ACTION_Q[label] || label);
      });
    }
    if (more && moreBtn) {
      const open = () => {
        more.classList.add("open");
        moreBtn.setAttribute("aria-expanded", "true");
      };
      more.addEventListener("pointerenter", open);
      more.addEventListener("pointerleave", close);
      moreBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = !more.classList.contains("open");
        if (shouldOpen) open(); else close();
      });
      document.addEventListener("click", (event) => { if (!more.contains(event.target)) close(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }
  })();

  ta?.addEventListener("input", () => { fit(); syncSend(); });
  ta?.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(ta.value); } });
  $("#lxfdComposer")?.addEventListener("submit", (e) => { e.preventDefault(); submit(ta.value); });
  chips?.addEventListener("click", (e) => {
    const b = e.target.closest(".lxfd-chip-q");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    submit(b.dataset.q || b.textContent);
  });
  quick?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (b.textContent.trim() === "退出人工") { lxfdExitHuman(); return; }
    submit(LXFD_ACTION_Q[b.textContent.trim()] || b.textContent);
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd .answer-cta, .lxfd [data-lx-result-id], .lxfd [data-lxfd-reveal-products], .lxfd [data-lx-focus-reco], .lxfd [data-lxfd-open-feature], .lxfd [data-lx-focus-active], .lxfd [data-lx-open-tab], .lxfd [data-specific-solution-cta]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (btn.hasAttribute("data-open-enterprise-auth-modal") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-member-auth") {
      window.__lxOpenEnterpriseAuthModal?.();
      return;
    }
    if (btn.hasAttribute("data-open-enterprise-lead") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-lead") {
      window.openLeadPanel?.();
      return;
    }
    const studentAuthKind = btn.getAttribute("data-open-stuauth");
    if (studentAuthKind) {
      window.__lxAgentAPI?.openStudentAuth?.(studentAuthKind);
      return;
    }
    if (btn.hasAttribute("data-open-wpa")) {
      window.openWorkplaceAuth?.();
      return;
    }
    if (btn.hasAttribute("data-open-payment-confirm")) {
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
      return;
    }
    const feature = btn.getAttribute("data-lxfd-open-feature") || "";
    const boundTabId = btn.getAttribute("data-lx-open-tab") || "";
    const resultId = btn.getAttribute("data-lx-result-id") || "";
    const solutionTitle = btn.getAttribute("data-specific-solution-cta") || "";
    const recoId = btn.getAttribute("data-lxfd-reco-id") || "";
    const openProduct = btn.getAttribute("data-open-product") || "";
    const targetTabId = resultId || (solutionTitle
      ? `info:solution-detail:${solutionTitle}`
      : (boundTabId || (feature === "solution" ? "info:solution" : "")));
    const storedProducts = recoId && window.__lxRecoPayloads && Array.isArray(window.__lxRecoPayloads[recoId])
      ? window.__lxRecoPayloads[recoId]
      : [];
    const recoTab = (window.__lxState?.tabs || []).find((item) => item && (item.kind === "reco" || item.id === "reco") && Array.isArray(item.products) && item.products.length);
    const products = storedProducts.length
      ? storedProducts
      : ((chatState.lastProducts && chatState.lastProducts.length) ? chatState.lastProducts : (recoTab?.products || []));
    // 收起前先锁定卡片目标。分屏恢复后精确激活对应标签，不能再由 focusReco 猜测当前页。
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (inFullscreen) {
      const commitCapturedResult = () => {
        lxfdEnsureRootSplitState();
        if (window.__lxBridge?.restoreResultCard?.(btn)) return;
        if (targetTabId && window.__lxBridge?.restoreResultTab?.(targetTabId)) return;
        if (lfxdReplayImportedResultCard({ resultId, boundTabId, solutionTitle, recoId, openProduct, feature })) return;
        if (targetTabId && window.__lxBridge?.activateTab?.(targetTabId)) return;
        if (feature) lxfdRevealFeature(feature);
        else if (products.length) window.__lxBridge?.revealProducts?.(products, { title: "AI 推荐", recoId });
      };
      lxfdExitToResultAtomically(commitCapturedResult);
      return;
    }
    // 功能卡片在全屏态与左右分栏态都走同一入口；标签关闭后可重新创建。
    if (feature) {
      lxfdOpenFeatureInSplit(feature);
      return;
    }
    if (btn.hasAttribute("data-lx-focus-active") && !btn.hasAttribute("data-lx-focus-reco")) return;
  }, true);
  thread?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd-followups button, .lxfd-ai-body .followups button, .lxfd-ai-body .lx-p0-suggest[data-followups] button, .lxfd-ai-body [data-quick-ask]");
    if (!btn) return;
    e.preventDefault();
    const text = btn.getAttribute("data-quick-ask") || btn.textContent.replace(/→\s*$/, "").trim();
    if (text) submit(text);
  });
  turnList?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const target = document.getElementById(b.dataset.target); if (!target) return; renderTurnIndex(target.id); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); });
  window.addEventListener("resize", () => { if (document.body.classList.contains("assistant-fullscreen")) syncRailForViewport(); });

  // 职场认证按钮（lxfd 内的 data-open-wpa 委托）
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-wpa]")) {
      if (typeof window.openWorkplaceAuth === "function") window.openWorkplaceAuth();
    }
  });

  // 官方动作按钮（转人工/在线客服等）点击：human_access→进客服模式，有链接开新窗口，否则把 callback_data 当问题继续问
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-leai-url], [data-leai-cb]");
    if (!btn) return;
    e.preventDefault();
    const ev = btn.getAttribute("data-leai-event");
    if (ev === "human_access") {
      if (document.body.classList.contains("assistant-fullscreen")) {
        lxfdEnterHuman();
      } else if (typeof window.__lxSetHuman === "function") {
        window.__lxSetHuman(true);
      }
      return;
    }
    const url = btn.getAttribute("data-leai-url");
    const cb = btn.getAttribute("data-leai-cb");
    if (url) { window.open(url, "_blank", "noopener"); return; }
    if (cb && typeof window.lxfdSubmit === "function" && document.body.classList.contains("assistant-fullscreen")) window.lxfdSubmit(cb);
  });

  setTimeout(startRotatingTitle, reduceMotion ? 0 : 2000);
  syncSend();
  lxfdRenderHist();
  // P0 多频道会话互通：首页重新进入时，把共享主面板已恢复的完整会话导入全屏线程。
  if (window.__LX_TEMPLATE_PAGE === "home") {
    window.setTimeout(function () {
      if (!lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) return;
      lxfdImportFromMain();
      setFullscreen(true);
    }, 0);
  }

  document.addEventListener("click", (e) => {
    const fsToggle = e.target.closest(".assistant-toggle");
    if (fsToggle) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      enterFullscreen();
      return;
    }
    const heroChip = e.target.closest(".hero-suggestion");
    const fullPrompt = e.target.closest(".fullscreen-prompt");
    if (heroChip || fullPrompt) {
      const target = heroChip || fullPrompt;
      const text = (target.querySelector("span")?.textContent || target.textContent).trim();
      if (text) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(text); }
    }
  }, true);
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.(".hero-composer");
    if (!form) return;
    const txt = form.querySelector("textarea")?.value.trim() || form.querySelector("textarea")?.placeholder || "最近有什么优惠活动？";
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(txt);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("assistant-fullscreen")) requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();

};

/* public/leaip0/assets/frontend/js/core/composer-smart-actions-v1.js */
window.__p0Modules.sources["u599570cc1c6608b6"]=function(){
(function () {
  "use strict";
  var pageScenes = Object.create(null), currentScene = null;
  var shownScenes = new Set(), sceneCandidate = '', sceneSince = 0;
  var suppressRevealUntil = 0, lastUserMessageSignature = '', wasSending = false;
  var syncTimer = 0;
  var actions = ["推荐购买第2款商品", "我要对比1、3、4"];
  // 乐享输入框按钮展示全套：all pages share readiness, first reveal and motion.
  window.__lxComposerButtonSuite = {
    name: '乐享输入框按钮展示全套',
    register: function(name, scene) { pageScenes[name] = scene; scheduleSync(); }
  };
  function activeTabId(content) {
    var tab = content.querySelector('.lx-tab[aria-selected="true"], .lx-tab.is-active');
    return tab && (tab.getAttribute('data-shop-tab-id') || tab.getAttribute('data-tab-id')) || '';
  }
  var serviceActions = ["推荐购买第1款商品", "我要对比1、2"];
  function visibleRecommendation(content) {
    var pages = content.querySelectorAll('.reco-page, .lx-reco-poc-page');
    return Array.prototype.find.call(pages, function(page) { var rect = page.getBoundingClientRect(); return rect.width && rect.height; }) || null;
  }
  function isServiceRecommendation(content) {
    var page = visibleRecommendation(content);
    if (!page) return false;
    if (page.matches('.lx-service-reco-page, [data-member-service-page]')) return true;
    var rows = page.querySelectorAll('.reco-row, .lx-reco-poc-row');
    if (rows.length && Array.prototype.every.call(rows, function(row) { return /^SERVICE-/i.test(row.getAttribute('data-sku') || '') || row.hasAttribute('data-service-id'); })) return true;
    var heading = page.querySelector('h2, h1, .reco-head');
    return !!heading && /服务推荐|推荐服务|延保|保修/.test(heading.textContent || '');
  }
  var recommendationScene = {
    labels: function(content) {
      return isServiceRecommendation(content) ? serviceActions : actions;
    },
    source: '.reco-page, .lx-reco-poc-page',
    identity: function(content) {
      var rows = content.querySelectorAll('.reco-row, .lx-reco-poc-row');
      return activeTabId(content) || Array.prototype.map.call(rows, function(row) {
        return row.getAttribute('data-sku') || row.textContent.trim();
      }).join('|');
    },
    ready: function(content) {
      var page = content.querySelector('.reco-page, .lx-reco-poc-page');
      return page && page.querySelector('.reco-row, .lx-reco-poc-row') && /为你推荐|推荐商品|AI\s*推荐|服务推荐/.test(page.textContent || '');
    },
    invoke: function(content, label) {
      var state = window.__lxState;
      if (!isServiceRecommendation(content) && state && (label === actions[0] || label === actions[1])) {
        var tab = (state.tabs || []).find(function(tab) { return tab.id === state.activeTabId; });
        var page = visibleRecommendation(content);
        var rows = page ? Array.from(page.querySelectorAll('.reco-row[data-sku], .lx-reco-poc-row[data-sku]')) : [];
        var pool = tab && Array.isArray(tab.products) ? tab.products : [];
        var products = rows.length ? rows.map(function(row) { return pool.find(function(p) { return String(p.sku) === row.getAttribute('data-sku'); }); }) : pool;
        var indices = label === actions[0] ? [1] : [0,2,3];
        var selected = indices.map(function(index) { return products[index]; });
        if (selected.every(function(p) { return p && p.sku; })) {
          state.refProducts = label === actions[1] ? selected.map(function(p) { return Object.assign({}, p); }) : [];
          state.refProduct = null;
          state._composerRecoPurchase = label === actions[0] ? {query:label,product:Object.assign({},selected[0])} : null;
        } else { return; }
      }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  };
  // Coupon results reuse the complete suite, with actions bound to the visible list.
  var couponActions = ['对比前两款商品', '我要购买第2款'];
  function couponRecommendationProducts(content) {
    var state = window.__lxState, page = visibleRecommendation(content);
    var tab = state && (state.tabs || []).find(function(item) { return item.id === state.activeTabId; });
    var pool = tab && Array.isArray(tab.products) ? tab.products : [];
    if (!page || !window.__lxCouponCenter || !window.__lxCouponCenter.productsCoupon(pool)) return null;
    return Array.from(page.querySelectorAll('.reco-row, .lx-reco-poc-row')).map(function(row) {
      var sku = row.getAttribute('data-open-product') || row.getAttribute('data-sku');
      return pool.find(function(product) { return String(product.sku) === sku; });
    });
  }
  window.__lxComposerButtonSuite.register('coupon-recommendation', {
    labels: function(content) {
      var products = couponRecommendationProducts(content);
      return products && products.length >= 2 && products[0] && products[1] ? couponActions : [];
    },
    source: recommendationScene.source,
    identity: recommendationScene.identity,
    ready: function(content) {
      var products = couponRecommendationProducts(content);
      return !!(products && products.length && products.every(function(product) { return product && product.sku; }));
    },
    invoke: function(content, label) {
      var products = couponRecommendationProducts(content), state = window.__lxState;
      if (!state || state.sending || !products || !products[0] || !products[1]) return;
      if (label !== couponActions[0] && label !== couponActions[1]) return;
      var compare = label === couponActions[0];
      state.refProducts = compare ? products.slice(0, 2).map(function(product) { return Object.assign({}, product); }) : [];
      state.refProduct = null;
      state._composerRecoPurchase = compare ? null : { query: label, product: Object.assign({}, products[1]) };
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('compare', {
    labels: function() { return window.__lxComparisonDisplay?.labels() || []; },
    source: '.compare-page .lx-product-compare',
    identity: function(content) { return activeTabId(content) || 'product-compare'; },
    ready: function() { return !!window.__lxCompareDisplayView?.snapshot(); },
    invoke: function(content,label) {
      if(window.__lxState?.sending||!window.__lxComparisonDisplay?.labels().includes(label))return;
      window.__lxBridge?.sendChat?.(label);
    }
  });
  window.__lxComposerButtonSuite.register('reco', recommendationScene);
  window.__lxComposerButtonSuite.register('recommendation', recommendationScene);
  window.__lxComposerButtonSuite.register('service', {
    labels: serviceActions,
    source: '[data-member-service-page]',
    identity: function(content) {
      var page = content.querySelector('[data-member-service-page]');
      return activeTabId(content) + ':' + Array.prototype.map.call(page.querySelectorAll('[data-service-id]'), function(row) { return row.getAttribute('data-service-id'); }).join('|');
    },
    ready: function(content) { return !!content.querySelector('[data-member-service-page] .reco-row[data-service-id]'); },
    invoke: recommendationScene.invoke
  });
  function storeDocument(content) {
    var frame = content.querySelector('.lx-store-exact-frame iframe');
    try { return frame && frame.contentDocument; } catch (e) { return null; }
  }
  window.__lxComposerButtonSuite.register('stores', {
    labels: function() {
      var id = window.__lxState && window.__lxState.activeTabId;
      return String(id || '').startsWith('info:store-navigation:') ? ['我要预约这个门店'] : ['我要预约这个门店', '我要导航到这个门店'];
    },
    source: '.lx-store-component-host, .lx-store-exact-frame',
    identity: function(content) { return activeTabId(content) || 'stores'; },
    ready: function(content) { var host = content.querySelector('.lx-store-component-host'); if (host && host.__lxStoreApi) return !!host.__lxStoreApi.getCurrentStore(); var doc = storeDocument(content); return !!(doc && doc.querySelector('[data-prototype-action="导航"]')); },
    invoke: function(content, label) {
      var host = content.querySelector('.lx-store-component-host');
      var api = host && host.__lxStoreApi;
      if (api) {
        var store = api.getCurrentStore(); if (!store) return;
        var isDetail = !!(window.__lxState && String(window.__lxState.activeTabId).startsWith('info:store-detail:'));
        if (label === '我要预约这个门店') {
          window.__lxPendingStoreAppointment = Object.assign({}, store, {tel:store.tel || store.phone});
          window.__lxStoreAppointmentById = window.__lxStoreAppointmentById || {};
          window.__lxStoreAppointmentById[String(store.id)] = window.__lxPendingStoreAppointment;
          if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
          if (isDetail && window.__lxOpenFeature) window.__lxOpenFeature('stores');
          if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
        }
        else if (isDetail && window.__lxOpenStoreNavigationTab) { window.__lxStoreNavigationQuery = label; window.__lxOpenStoreNavigationTab(store); }
        else api.openNavigation(store.id);
        return;
      }
      var doc = storeDocument(content); if (!doc) return;
      var action = label === '我要预约这个门店' ? '预约' : '导航';
      var detail = doc.querySelector('.lx-store-detail-page.is-active');
      var target = detail && detail.querySelector('[data-detail-action="' + action + '"]') || doc.querySelector('[data-prototype-action="' + action + '"]');
      if (target) target.click();
      else if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solution-detail', {
    labels: ['请专家联系我'],
    source: '.lx-specific-solution-detail',
    identity: function(content) { var title = content.querySelector('.lx-specific-solution-detail h1'); return (activeTabId(content) || 'solution-detail') + ':' + (title ? title.textContent.trim() : ''); },
    ready: function(content) { var title = content.querySelector('.lx-specific-solution-detail h1'); return !!title && !!title.textContent.trim(); },
    invoke: function(content, label) {
      if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solution-compare', {
    labels: ['请专家联系我'],
    source: '.lx-solution-compare-page',
    identity: function(content) { var title = content.querySelector('.lx-solution-compare-page h2'); return (activeTabId(content) || 'solution-compare') + ':' + (title ? title.textContent.trim() : ''); },
    ready: function(content) { var title = content.querySelector('.lx-solution-compare-page h2'); return !!title && content.querySelectorAll(".lx-solution-compare-page .phead").length >= 2; },
    invoke: function(content, label) {
      if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat(label);
    }
  });
  window.__lxComposerButtonSuite.register('solutions', {
    labels: function(content) {
      var page = content.querySelector('.lx-solution-center-page');
      var industry = page && page.getAttribute('data-solution-selected');
      return ['请专家联系我', industry && industry !== 'all' ? '对比1、3、4方案' : '对比教育行业的2、3方案'];
    },
    source: '.lx-solution-center-page',
    identity: function(content) { var page = content.querySelector('.lx-solution-center-page'); return (activeTabId(content) || 'solutions') + ':' + (page.getAttribute('data-solution-selected') || 'all'); },
    ready: function(content) { return !!content.querySelector('.lx-solution-center-page .lx-solution-card'); },
    invoke: function(content, label) {
      if (label === '请专家联系我') {
        if (window.__lxState) { window.__lxState.refProducts = []; window.__lxState.refProduct = null; }
        recommendationScene.invoke(content, label); return;
      }
      var page = content.querySelector('.lx-solution-center-page');
      var industry = page.getAttribute('data-solution-selected');
      var all = !industry || industry === 'all';
      var floor = Array.prototype.find.call(page.querySelectorAll('.lx-solution-floor'), function(node) { return node.getAttribute('data-solution-industry') === (all ? '教育' : industry); });
      if (!floor) return;
      var cards = floor.querySelectorAll('.lx-solution-card');
      var refs = (all ? [1,2] : [0,2,3]).map(function(index) {
        var card = cards[index]; if (!card) return null;
        var title = card.getAttribute('data-solution-title');
        return {type:'solution',sku:'solution:' + title,name:title,sector:card.getAttribute('data-solution-sector'),scenario:card.getAttribute('data-solution-scenario'),description:card.getAttribute('data-solution-intro'),img:card.querySelector('img') && card.querySelector('img').getAttribute('src')};
      }).filter(Boolean);
      if (refs.length < 2 || !window.__lxState) return;
      window.__lxState.refProducts = refs;
      window.__lxState.refProduct = null;
      recommendationScene.invoke(content, '对比这些解决方案：' + refs.map(function(ref) { return '「' + ref.name + '」'; }).join('、'));
    }
  });
  window.__lxComposerButtonSuite.register('devices', {
    labels: ['一键绑定', '绑定其他设备'],
    source: '.leai-device-center',
    identity: function(content) { return activeTabId(content) || 'my-devices'; },
    ready: function(content) { return !!content.querySelector('.leai-device-center [data-device-unified-list]'); },
    invoke: function(content, label) {
      var page = content.querySelector('.leai-device-center');
      if (!page) return;
      var target = label === '一键绑定' ? page.querySelector('[data-device-bind-purchased]') : page.querySelector('[data-device-add]');
      if (!target && label === '一键绑定') {
        var all = page.querySelector('[data-device-filter="all"]');
        if (all) all.click();
        page = content.querySelector('.leai-device-center');
        target = page && (page.querySelector('[data-device-bind-purchased]') || page.querySelector('[data-device-add]'));
      }
      if (target) target.click();
    }
  });
  window.__lxComposerButtonSuite.register('device-detail', {
    labels: function(content) {
      var page = content.querySelector('[data-member-device-detail-page]');
      return page && page.getAttribute('data-device-warranty-eligible') === 'true' ? ['查看维保方案'] : [];
    },
    source: '[data-member-device-detail-page] .leai-device-detail-hero',
    identity: function(content) {
      var page = content.querySelector('[data-member-device-detail-page]');
      return page && page.getAttribute('data-device-detail-id') || '';
    },
    ready: function(content) {
      return !!content.querySelector('[data-member-device-detail-page] .leai-device-detail-hero') &&
        !!window.LXMemberService && typeof window.LXMemberService.recommendDeviceWarranty === 'function';
    },
    invoke: function(content, label) {
      var page = content && content.querySelector('[data-member-device-detail-page]');
      if (label !== '查看维保方案' || !page || page.getAttribute('data-device-warranty-eligible') !== 'true') return;
      if (window.__lxState && window.__lxState.sending) return;
      if (window.LXMemberService && typeof window.LXMemberService.recommendDeviceWarranty === 'function') {
        window.LXMemberService.recommendDeviceWarranty(page.getAttribute('data-device-detail-id'));
      }
    }
  });
  window.__lxComposerButtonSuite.register('detail', {
    labels: function(content) {
      var enterprise = /^\/(b-chat|biz-chat)(?:\/|$)/.test(location.pathname);
      var primary = content && content.querySelector('.product-detail .detail-actions .detail-primary');
      var labels = enterprise && primary && primary.textContent.trim() === '一键领优惠下单' ? ['咨询客服'] : [];
      var skus = content ? Array.prototype.map.call(content.querySelectorAll('.lx-spu-chip[data-variant-sku]'), function(chip) { return chip.getAttribute('data-variant-sku'); }).filter(Boolean) : [];
      if (new Set(skus).size > 1) labels.unshift('对比所有系列');
      return labels;
    },
    source: '.product-detail',
    identity: function(content) {
      var product = window.__lxState && window.__lxState.currentProduct;
      var title = content.querySelector('[data-detail-title]');
      // A configuration change is still the same detail scene.
      var variants = Array.prototype.map.call(content.querySelectorAll('.lx-spu-chip[data-variant-sku]'), function(chip) { return chip.getAttribute('data-variant-sku'); }).filter(Boolean).sort();
      if (variants.length) return 'series:' + Array.from(new Set(variants)).join('|');
      return product && (product.spu_id || product.sku || product.id) || title && title.textContent || '';
    },
    ready: function(content) {
      var title = content.querySelector('[data-detail-title]');
      return title && title.textContent.trim() && content.querySelector('.lx-spu-chip');
    },
    invoke: function(content, label) {
      if (label === '咨询客服') {
        window.open('https://b.lenovo.com.cn/activity/qygzxdhym.html', '_blank', 'noopener,noreferrer');
        return;
      }
      var state = window.__lxState;
      if (!state) return;
      var seen = new Set();
      var products = Array.from(content.querySelectorAll('.lx-spu-chip[data-variant-sku]')).map(function(chip) {
        var sku = chip.getAttribute('data-variant-sku');
        if (!sku || seen.has(sku)) return null;
        seen.add(sku);
        var cached = state.officialProducts && state.officialProducts[sku];
        return Object.assign({}, cached || {}, {sku:sku,name:cached && cached.name || chip.getAttribute('title') || state.currentProduct && state.currentProduct.name || '当前系列商品'});
      }).filter(Boolean);
      if (products.length < 2) return;
      state.refProducts = products;
      state.refProduct = null;
      state._composerRecoPurchase = null;
      if (window.__lxBridge && window.__lxBridge.sendChat) window.__lxBridge.sendChat('对比所有系列');
    }
  });
  function getRightContent() {
    return document.querySelector("body > .shell > .content, main.shell > .content, .shell > section.content");
  }

  function createActions(bottom) {
    if (!bottom) return;
    var labels = currentScene ? currentScene.labels : actions;
    var existing = bottom.querySelector('.lx-smart-actions');
    if (existing) {
      var actual = Array.prototype.map.call(existing.querySelectorAll('.lx-smart-action span'), function(node) { return node.textContent; });
      if (JSON.stringify(actual) === JSON.stringify(labels)) return;
      existing.remove();
    }

    var panel = document.createElement("section");
    panel.className = "lx-smart-actions";
    panel.setAttribute("aria-label", "为你选择");
    panel.innerHTML =
      '<button class="lx-smart-actions-close" type="button" aria-label="关闭为你选择">' +
        '<span aria-hidden="true"></span>' +
      '</button>' +
      '<div class="lx-smart-actions-title">' +
        '<img src="/assets/icons/global-sparkle.svg" alt="" aria-hidden="true">' +
        '<span>为你选择</span>' +
      '</div>' +
      '<div class="lx-smart-actions-list"></div>';

    var list = panel.querySelector(".lx-smart-actions-list");
    labels.forEach(function (label) {
      var button = document.createElement("button");
      button.className = "lx-smart-action";
      button.type = "button";
      button.innerHTML =
        '<span></span>' +
        '<img src="/assets/icons/arrow-down.svg" alt="" aria-hidden="true">';
      button.querySelector("span").textContent = label;
      button.addEventListener("click", function () {
        if (window.__lxState && window.__lxState.sending) return;
        collapseCurrent();
        if (currentScene) { currentScene.definition.invoke(getRightContent(), label); return; }
        if (window.__lxBridge && typeof window.__lxBridge.sendChat === "function") {
          window.__lxBridge.sendChat(label);
          return;
        }
        var textarea = bottom.querySelector(".composer textarea");
        if (!textarea) return;
        textarea.value = label;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        var sendButton = bottom.querySelector(".send-btn, .lxfd-send, #lxfdSend");
        if (sendButton) sendButton.click();
        else textarea.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true
        }));
      });
      list.appendChild(button);
    });

    panel.querySelector(".lx-smart-actions-close").addEventListener("click", function () {
      cancelMotion(bottom);
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-motion", "lx-smart-actions-compact");
      restoreCurrentShortcuts(bottom, true);
    });

    var composer = bottom.querySelector(".composer");
    bottom.insertBefore(panel, composer || null);

  }

  function runSmartActionsMotion(bottom, panel) {
    cancelMotion(bottom);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { bottom.classList.add("lx-smart-actions-arrived"); return; }
    if (!panel) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }
    var source = getRightContent();
    var target = panel.querySelector(".lx-smart-actions-list") || panel;
    if (!source || !target || !Element.prototype.animate) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }
    var sourceView = source.querySelector(currentScene ? currentScene.definition.source : ".reco-page, .lx-reco-poc-page") || source;
    var sourceRect = sourceView.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
      bottom.classList.add("lx-smart-actions-arrived");
      return;
    }

    bottom.classList.add("lx-smart-actions-motion");
    var guide = document.createElement("div");
    guide.className = "lx-smart-actions-guide lx-smart-actions-snapshot";
    guide.setAttribute("aria-hidden", "true");
    guide.style.left = sourceRect.left + "px";
    guide.style.top = sourceRect.top + "px";
    guide.style.width = sourceRect.width + "px";
    guide.style.height = sourceRect.height + "px";

    var snapshot = sourceView.cloneNode(true);
    if (sourceView.shadowRoot) {
      var visual = sourceView.shadowRoot.querySelector('.lx-store-page') || sourceView.shadowRoot.querySelector('main') || sourceView.shadowRoot;
      snapshot = document.createElement('div');
      var shadow = snapshot.attachShadow({mode:'open'});
      Array.prototype.forEach.call(sourceView.shadowRoot.children, function(node) { if (node.tagName !== 'SCRIPT') shadow.appendChild(node.cloneNode(true)); });
    }
    snapshot.removeAttribute("id");
    snapshot.classList.add("lx-smart-actions-snapshot-content");
    snapshot.querySelectorAll("script, iframe, video, audio").forEach(function (node) {
      node.remove();
    });
    snapshot.querySelectorAll("[id]").forEach(function (node) {
      node.removeAttribute("id");
    });
    snapshot.querySelectorAll("button, input, textarea, select, a").forEach(function (node) {
      node.setAttribute("tabindex", "-1");
    });
    snapshot.style.width = sourceRect.width + "px";
    snapshot.style.height = sourceRect.height + "px";
    guide.appendChild(snapshot);
    document.body.appendChild(guide);

    var endWidth = Math.min(targetRect.width, 270);
    var endHeight = Math.min(targetRect.height, 82);
    var endLeft = targetRect.left;
    var endTop = targetRect.top;
    var deltaX = endLeft - sourceRect.left;
    var deltaY = endTop - sourceRect.top;
    var scaleX = endWidth / sourceRect.width;
    var scaleY = endHeight / sourceRect.height;
    var motionDuration = 3050;
    var controlsRevealLead = 2000;
    var animation = guide.animate([
      {
        transform: "translate3d(0,0,0) scale(.992)",
        borderRadius: "12px",
        opacity: 1,
        offset: 0
      },
      {
        transform: "translate3d(0,0,0) scale(.985)",
        borderRadius: "12px",
        opacity: 1,
        offset: .16
      },
      {
        transform: "translate3d(" + (deltaX * .18) + "px," + (deltaY * .18) + "px,0) scale(.78)",
        borderRadius: "12px",
        opacity: .88,
        offset: .38
      },
      {
        transform: "translate3d(" + (deltaX * .72) + "px," + (deltaY * .72) + "px,0) scale(" + (scaleX * 1.45) + "," + (scaleY * 1.45) + ")",
        borderRadius: "10px",
        opacity: .68,
        offset: .72
      },
      {
        transform: "translate3d(" + deltaX + "px," + deltaY + "px,0) scale(" + scaleX + "," + scaleY + ")",
        borderRadius: "10px",
        opacity: .34,
        offset: .9
      },
      {
        transform: "translate3d(" + deltaX + "px," + deltaY + "px,0) scale(" + scaleX + "," + scaleY + ")",
        borderRadius: "10px",
        opacity: 0,
        offset: 1
      }
    ], {
      duration: motionDuration,
      easing: "cubic-bezier(.22,.78,.22,1)",
      fill: "forwards"
    });

    var motion = { animation: animation, guide: guide, timer: 0 };
    bottom._lxSmartMotion = motion;
    var controlsRevealTimer = window.setTimeout(function () {
      if (!bottom.classList.contains("lx-smart-actions-collapsing") && !bottom.classList.contains("lx-smart-actions-compact") && bottom.classList.contains("lx-smart-actions-active")) bottom.classList.add("lx-smart-actions-arrived");
    }, motionDuration - controlsRevealLead);

    motion.timer = controlsRevealTimer;
    function finish() {
      if (bottom._lxSmartMotion !== motion) return;
      bottom._lxSmartMotion = null;
      window.clearTimeout(controlsRevealTimer);
      guide.remove();
      bottom.classList.remove("lx-smart-actions-motion");
      if (!bottom.classList.contains("lx-smart-actions-collapsing") && !bottom.classList.contains("lx-smart-actions-compact") && bottom.classList.contains("lx-smart-actions-active")) bottom.classList.add("lx-smart-actions-arrived");
    }
    animation.addEventListener("finish", finish, { once: true });
    animation.addEventListener("cancel", finish, { once: true });
  }

  function revealCurrent() {
    if (Date.now() < suppressRevealUntil) return false;
    if (!currentScene) {
      hideCurrent();
      return false;
    }
    var revealed = false;
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      if (!bottom.getBoundingClientRect().width || !bottom.getBoundingClientRect().height) return;
      createActions(bottom);
      if (bottom.classList.contains("lx-smart-actions-active") && !bottom.classList.contains("lx-smart-actions-compact")) return;
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-compact", "lx-smart-actions-collapsing");
      bottom.classList.remove("lx-smart-actions-arrived", "lx-smart-actions-motion");
      bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
        currentActions.style.setProperty("display", "none", "important");
        currentActions.setAttribute("aria-hidden", "true");
      });
      bottom.classList.add("lx-smart-actions-active");
      runSmartActionsMotion(bottom, bottom.querySelector(".lx-smart-actions"));
      revealed = true;
    });
    return revealed;
  }

  function restoreCurrentShortcuts(bottom, animate) {
    bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
      currentActions.style.removeProperty("display");
      currentActions.removeAttribute("aria-hidden");
    });
    if (!animate) return;
    bottom.classList.remove("lx-shortcuts-arriving");
    void bottom.offsetWidth;
    bottom.classList.add("lx-shortcuts-arriving");
    window.setTimeout(function () {
      bottom.classList.remove("lx-shortcuts-arriving");
    }, 2750);
  }

  function hideCurrent() {
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      cancelMotion(bottom);
      var shouldAnimateShortcuts = bottom.classList.contains("lx-smart-actions-active");
      bottom.classList.remove("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-motion", "lx-smart-actions-compact", "lx-smart-actions-collapsing");
      restoreCurrentShortcuts(bottom, shouldAnimateShortcuts);
    });
  }

  function showCompactCurrent() {
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(function (bottom) {
      createActions(bottom);
      bottom.querySelectorAll(".shortcut-row, .lx-personal-quick-actions, [data-lx-personal-quick-count]").forEach(function (currentActions) {
        currentActions.style.setProperty("display", "none", "important");
        currentActions.setAttribute("aria-hidden", "true");
      });
      cancelMotion(bottom);
      bottom.classList.remove("lx-smart-actions-motion", "lx-smart-actions-collapsing");
      bottom.classList.add("lx-smart-actions-active", "lx-smart-actions-arrived", "lx-smart-actions-compact");
    });
  }


  function scheduleSync(delay) {
    if (syncTimer) return;
    syncTimer = window.setTimeout(function() { syncTimer = 0; syncPageScene(); }, delay == null ? 60 : delay);
  }
  function userMessageSignature() {
    var nodes = document.querySelectorAll('.lx-p0-message.user, .msg.user, .message.user, .lxfd-msg-user, .lxfd-msg.user, [data-role="user"]');
    return nodes.length ? nodes.length + ':' + String(nodes[nodes.length - 1].textContent || '').trim() : '0';
  }
  function syncSendCollapse() {
    var signature = userMessageSignature();
    var sending = !!(window.__lxState && window.__lxState.sending);
    if (signature === '0' && lastUserMessageSignature && lastUserMessageSignature !== '0') {
      shownScenes.clear(); currentScene = null; sceneCandidate = ''; hideCurrent();
      document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); });
    } else if ((sending && !wasSending) || (lastUserMessageSignature && signature !== lastUserMessageSignature)) collapseCurrent();
    wasSending = sending; lastUserMessageSignature = signature;
  }
  function syncPageScene() {
    syncSendCollapse();
    var content = getRightContent();
    var servicePage = content && content.querySelector('[data-member-service-page]');
    var serviceVisible = servicePage && servicePage.getBoundingClientRect().width && servicePage.getBoundingClientRect().height;
    var deviceDetailPage = content && content.querySelector('[data-member-device-detail-page]');
    var deviceDetailVisible = deviceDetailPage && deviceDetailPage.getBoundingClientRect().width && deviceDetailPage.getBoundingClientRect().height;
    var devicePage = content && content.querySelector('.leai-device-center');
    var deviceVisible = devicePage && devicePage.getBoundingClientRect().width && devicePage.getBoundingClientRect().height;
    var storePage = content && content.querySelector('.lx-store-component-host, .lx-store-exact-frame');
    var storeVisible = storePage && storePage.getBoundingClientRect().width && storePage.getBoundingClientRect().height;
    var solutionDetail = content && content.querySelector('.lx-specific-solution-detail');
    var solutionDetailVisible = solutionDetail && solutionDetail.getBoundingClientRect().width && solutionDetail.getBoundingClientRect().height;
    var solutionCompare = content && content.querySelector('.lx-solution-compare-page');
    var solutionCompareVisible = solutionCompare && solutionCompare.getBoundingClientRect().width && solutionCompare.getBoundingClientRect().height;
    var solutionPage = content && content.querySelector('.lx-solution-center-page');
    var solutionVisible = solutionPage && solutionPage.getBoundingClientRect().width && solutionPage.getBoundingClientRect().height;
    var couponVisible = content && couponRecommendationProducts(content);
    var scene = content && pageScenes[couponVisible ? 'coupon-recommendation' : solutionCompareVisible ? 'solution-compare' : solutionDetailVisible ? 'solution-detail' : solutionVisible ? 'solutions' : storeVisible ? 'stores' : deviceDetailVisible ? 'device-detail' : deviceVisible ? 'devices' : serviceVisible ? 'service' : content.getAttribute('data-view')];
    if (!scene) {
      if (currentScene) { currentScene = null; sceneCandidate = ''; hideCurrent(); document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); }); }
      if (wasSending) scheduleSync(100);
      return;
    }
    // Wait for the answer and page-generation animation, including the first query.
    if (wasSending || content.getAttribute('aria-busy') === 'true' || content.classList.contains('is-generating-tab') || content.querySelector('.lx-page-generating') || !scene.ready(content)) {
      sceneCandidate = ''; sceneSince = 0; scheduleSync(100); return;
    }
    var key = (couponVisible ? 'coupon-recommendation' : solutionCompareVisible ? 'solution-compare' : solutionDetailVisible ? 'solution-detail' : solutionVisible ? 'solutions' : storeVisible ? 'stores' : deviceDetailVisible ? 'device-detail' : deviceVisible ? 'devices' : serviceVisible || scene === recommendationScene && isServiceRecommendation(content) ? 'service' : content.getAttribute('data-view')) + ':' + scene.identity(content);
    var labels = typeof scene.labels === 'function' ? scene.labels(content) : scene.labels;
    var labelKey = JSON.stringify(labels);
    if (!currentScene || currentScene.key !== key) {
      hideCurrent(); document.querySelectorAll('.lx-smart-actions').forEach(function(panel) { panel.remove(); });
      currentScene = { key: key, definition: scene, labels: labels.slice(), labelKey: labelKey };
      sceneCandidate = ''; sceneSince = 0;
      // Compact is only for a scene which really completed its first reveal.
      if (shownScenes.has(key) && labels.length) showCompactCurrent();
    } else if (currentScene.labelKey !== labelKey) {
      currentScene.labelKey = labelKey; currentScene.labels = labels.slice(); currentScene.definition = scene;
      document.querySelectorAll('.assistant-panel .assistant-bottom .lx-smart-actions').forEach(function(panel) { var bottom = panel.parentElement; panel.remove(); createActions(bottom); });
    }
    if (!labels.length) { if (!currentScene.empty) { hideCurrent(); currentScene.empty = true; } return; }
    currentScene.empty = false;
    document.querySelectorAll(".assistant-panel .assistant-bottom").forEach(createActions);
    if (shownScenes.has(key)) return;
    var source = content.querySelector(scene.source);
    if (!source || !source.getBoundingClientRect().width || !source.getBoundingClientRect().height) { scheduleSync(100); return; }
    if (sceneCandidate !== key + labelKey) { sceneCandidate = key + labelKey; sceneSince = Date.now(); }
    if (Date.now() - sceneSince < 450 || Date.now() < suppressRevealUntil) { scheduleSync(100); return; }
    if (revealCurrent()) shownScenes.add(key);
    else scheduleSync(100);
  }
  function cancelMotion(bottom) {
    window.clearTimeout(bottom._lxSmartCollapseTimer);
    bottom._lxSmartCollapseTimer = 0;
    var motion = bottom._lxSmartMotion;
    if (!motion) return;
    bottom._lxSmartMotion = null;
    window.clearTimeout(motion.timer);
    motion.animation.cancel(); motion.guide.remove();
    bottom.classList.remove('lx-smart-actions-motion');
  }
  function collapseCurrent() {
    suppressRevealUntil = Date.now() + 1600;
    document.querySelectorAll('.assistant-panel .assistant-bottom').forEach(function(bottom) {
      if (!bottom.classList.contains('lx-smart-actions-active')) return;
      if (bottom.classList.contains('lx-smart-actions-collapsing') || bottom.classList.contains('lx-smart-actions-compact')) return;
      cancelMotion(bottom);
      bottom.classList.add('lx-smart-actions-collapsing');
      bottom._lxSmartCollapseTimer = window.setTimeout(function() {
        bottom._lxSmartCollapseTimer = 0;
        bottom.classList.remove('lx-smart-actions-arrived', 'lx-smart-actions-collapsing');
        bottom.classList.add('lx-smart-actions-compact');
      }, 720);
    });
    scheduleSync();
  }
  function activateDeviceRow(event) {
    var row = event.target.closest && event.target.closest('[data-device-unified-list] [data-device-list-item]');
    if (!row || event.target.closest('button, a, input, select, textarea')) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    var action = row.querySelector('[data-device-detail]');
    if (!action) return;
    event.preventDefault();
    action.click();
  }
  function prepareDeviceRows() {
    document.querySelectorAll('[data-device-unified-list] [data-device-list-item]').forEach(function(row) {
      if (!row.querySelector('[data-device-detail]')) return;
      if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '0');
      row.style.cursor = 'pointer';
    });
  }
  function init() {
    document.addEventListener('click', activateDeviceRow);
    document.addEventListener('keydown', activateDeviceRow);
    var deviceRowObserver = new MutationObserver(prepareDeviceRows);
    deviceRowObserver.observe(document.body, {childList:true, subtree:true});
    prepareDeviceRows();
    if (!document.getElementById('lx-solution-list-header-hidden')) {
      var solutionStyle = document.createElement('style');
      solutionStyle.id = 'lx-solution-list-header-hidden';
      solutionStyle.textContent = window.__p0Modules.styleText("/@script-style/250f475bf7ccbac25eadf714.css");
      document.head.appendChild(solutionStyle);
    }
    lastUserMessageSignature = userMessageSignature();
    var observer = new MutationObserver(function() { scheduleSync(); });
    document.querySelectorAll('.content, .assistant-panel, #lxfdThread').forEach(function(root) {
      observer.observe(root, {childList:true,subtree:true,attributes:true,attributeFilter:['class','data-view','aria-busy','aria-selected','data-variant-sku','data-solution-selected']});
    });
    observer.observe(document.body, {attributes:true,attributeFilter:['class']});
    observer.observe(document.documentElement, {attributes:true,attributeFilter:['class']});
    window.addEventListener('resize', function() { scheduleSync(); });
    document.addEventListener('load', function(event) { if (event.target.matches && event.target.matches('.content img')) scheduleSync(); }, true);
    window.addEventListener('click', function(event) { if (event.target.closest && event.target.closest('.send-btn, .hero-send-btn, .lxfd-send, #lxfdSend')) collapseCurrent(); }, true);
    window.addEventListener('keydown', function(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target.matches && event.target.matches('.composer textarea, .lxfd-composer textarea')) collapseCurrent(); }, true);
    window.addEventListener('submit', function(event) { if (event.target.matches && event.target.matches('.composer, .lxfd-composer')) collapseCurrent(); }, true);
    scheduleSync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

/* Shared modal-entry small card, available before checkout assets load. */
(()=>{const style=document.createElement("style");style.id="lx-enterprise-lead-small-card";style.textContent=window.__p0Modules.styleText("/@script-style/5b005de43434f719f5250325.css");document.head.appendChild(style);})();

};

/* public/leaip0/assets/frontend/js/core/followup-chevron-v1.js */
window.__p0Modules.sources["u845b3e54e80e4b4a"]=function(){
(function(){
  "use strict";
  var selector='.assistant-panel .followups button,.assistant-panel [data-followups] button,.assistant-panel .lx-p0-suggest-chip,.lxfd-followups button,.lxfd-ai-body .followups button,.lxfd-ai-body [data-followups] button,.lxfd-ai-body .lx-p0-suggest-chip';
  var style=document.createElement('style');
  style.textContent=selector.split(',').map(function(s){return s+'::after';}).join(',')+'{content:""!important;display:inline-block!important;width:9px!important;height:5px!important;margin-left:5px!important;vertical-align:middle!important;background:currentColor!important;-webkit-mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;mask:url(/assets/icons/arrow-down.svg) center/contain no-repeat!important;transform:rotate(-90deg) scale(0.6666667)!important;}';
  style.textContent+=window.__p0Modules.styleText("/@script-style/ef2a484a234eb8c98fd55f97.css");
  document.head.appendChild(style);
  function sync(){document.querySelectorAll(selector).forEach(function(button){
    var text = (button.textContent || '').replace(/\s/g, '').replace(/[→➜➝➞>›]+$/, '');
    if (/^对比第?1[、,，]2[、,，]3款$/.test(text)) {
      button.textContent = '帮我解读第3款商品';
      button.setAttribute('data-quick-ask', '帮我解读第3款商品');
      if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', '帮我解读第3款商品');
    }
    var walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT),nodes=[],node;
    while(node=walker.nextNode())nodes.push(node);
    nodes.forEach(function(node){if(/\s*[→➜➝➞]\s*$/.test(node.nodeValue))node.nodeValue=node.nodeValue.replace(/\s*[→➜➝➞]\s*$/,'');});
  });}
  var pending=false;new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;sync();});}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  sync();
})();

};

/* public/leaip0/assets/frontend/js/core/answer-actions-v1.js */
window.__p0Modules.sources["ucc3f7487fbe1651b"]=function(){
/* P0 answer tools: shared by fullscreen, split view and restored answers. */
(() => {
  'use strict';
  if(window.__lxAnswerActions)return;
  const ROOTS='.lx-p0-messages,.lxfd-thread',AI='.lx-p0-message.ai,.lx-p0-message.assistant,.lxfd-msg-ai,.lxfd-msg.ai';
  const FOLLOWUPS='.followups,.lxfd-followups,.lx-p0-suggest[data-followups]';
  const LABELS=[['regenerate','重新生成','global-refresh'],['copy','复制','answer-copy'],['speak','语音播报','answer-speak'],['share','分享','answer-share'],['like','点赞','answer-like'],['dislike','点踩','answer-dislike']];
  const NEWS_REFERENCE_QUERY='最新新闻';
  const NEWS_REFERENCES=[{title:'联想一周丨创新科技大会将亮相明年CES；合肥市委书记覃卫国与杨元庆会谈',url:'https://m.lenovo.com.cn/wiki/article-50122.html',date:'2026-10-10',domain:'m.lenovo.com.cn',summary:'联想宣布2027联想创新科技大会将于2027年1月7日在CES全球直播；文章还汇总了全球PC市场表现、TianxiCode进展和行业合作等动态。',tags:'Wiki · 联想 · 品牌/新闻 · CES · AI · PC行业'},{title:'联想集团出任语料创新生态联盟共建单位',url:'https://www.lenovo.com.cn/wiki/article-50087.html',date:'2026-09-30',domain:'www.lenovo.com.cn',summary:'联想集团出任首批共建单位，参与由中国科学院文献情报中心发起的语料创新生态联盟，支持科技语料资源与AI应用协同建设。',tags:'Wiki · 联想 · 品牌/新闻 · 科技语料 · AI · 生态合作'}];
  const cache=new WeakMap(),dirty=new WeakSet();let queued=false,speechId='',utterance=null,toastTimer=0;
  let votes={};try{votes=JSON.parse(localStorage.getItem('lexiang.answerFeedback.v1')||'{}');}catch(_){}
  const hash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0).toString(36);};
  const busy=()=>!!document.querySelector('.lx-stop-generation')||!!window.__lxState?.sending;
  function queryOf(message){let node=message.previousElementSibling;while(node){if(node.matches('.user,.lxfd-msg-user'))return(node.querySelector('.user-bubble')||node).textContent.trim();node=node.previousElementSibling;}return '';}
  function answerOf(message){const source=message.querySelector('.ai-body')||message.querySelector('.lxfd-ai-body')||message,copy=source.cloneNode(true);copy.querySelectorAll('.lx-answer-tools,.lx-skill-trace,.message-actions,.answer-actions,.lx-p0-actions,.followups,.lxfd-followups,[data-followups],.lx-p0-disclaimer,.lxfd-disclaimer,[data-lx-generation-stopped],button,style,script,.loading-line,.typing-cursor,.lx-generating').forEach(n=>n.remove());copy.querySelectorAll('p,li,h1,h2,h3,h4,div').forEach(n=>n.append(document.createTextNode('\n')));return copy.textContent.replace(/[ \t]+/g,' ').replace(/\n\s*\n\s*\n/g,'\n\n').trim();}
  function fallbacks(query){
    if(/设备|保修|绑定/.test(query))return ['这些设备的保修情况如何？','如何绑定我的其他设备？','为我的设备推荐保养服务'];
    if(/门店|到店|附近/.test(query))return ['哪家门店离我最近？','到店前需要预约吗？','附近门店能提供哪些服务？'];
    if(/方案|行业/.test(query))return ['有哪些适合我行业的解决方案？','帮我对比推荐的解决方案','如何预约方案咨询？'];
    if(/电脑|商品|笔记本|推荐|YOGA|Think|拯救者|小新|价格/i.test(query))return ['这几款商品的主要区别是什么？','哪款更适合我的使用场景？','有哪些可以享受的优惠？'];
    return ['请进一步解释关键内容','能给我一个具体例子吗？','接下来我可以怎么做？'];
  }
  function questions(message,query){const seeds=Array.isArray(message._chipsQs)?message._chipsQs:[];const native=[...message.querySelectorAll(FOLLOWUPS)].flatMap(n=>[...n.querySelectorAll('button')].map(b=>b.getAttribute('data-quick-ask')||b.textContent.trim()));return [...new Set([...seeds,...native,...fallbacks(query)].map(s=>String(s).trim()).filter(s=>s&&s!==query))].slice(0,3);}
  function tell(text){let node=document.getElementById('lx-answer-feedback');if(!node){node=document.createElement('div');node.id='lx-answer-feedback';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);}node.textContent=text;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true;},2200);}
  let activeReferenceDialog=null;
  function openReferencesDialog(trigger){
    if(activeReferenceDialog?.isConnected)return;
    const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const cards=NEWS_REFERENCES.map(ref=>'<article class="lx-answer-reference-card" role="listitem"><h3 class="lx-answer-reference-card-title"><a href="'+esc(ref.url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.title)+'</a></h3><p class="lx-answer-reference-summary">'+esc(ref.summary)+'</p><p class="lx-answer-reference-tags">'+esc(ref.tags)+'</p><div class="lx-answer-reference-meta"><span>发布日期：'+esc(ref.date)+'</span><a href="'+esc(ref.url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.domain)+'</a></div></article>').join('');
    const mask=document.createElement('div');mask.className='lx-p0-modal-mask show lx-answer-reference-modal-mask';
    mask.innerHTML='<section class="lx-p0-modal lx-answer-reference-modal" role="dialog" aria-modal="true" aria-labelledby="lx-answer-reference-title"><header class="lx-p0-modal-head lx-answer-reference-head"><h2 id="lx-answer-reference-title" class="lx-p0-modal-title lx-answer-reference-title">相关参考资料</h2><button type="button" class="lx-p0-close lx-answer-reference-close" aria-label="关闭相关参考资料">×</button></header><div class="lx-p0-modal-body lx-answer-reference-body"><p class="lx-answer-reference-intro">回答结果内容来源：内部知识库和以下联网检索内容</p><div class="lx-answer-reference-cards" role="list">'+cards+'</div></div></section>';
    const panel=mask.querySelector('.lx-answer-reference-modal'),close=mask.querySelector('.lx-answer-reference-close');document.body.append(mask);activeReferenceDialog=mask;
    const cleanup=()=>{if(activeReferenceDialog!==mask)return;activeReferenceDialog=null;mask.remove();if(trigger?.isConnected)trigger.focus();};
    close.addEventListener('click',cleanup);mask.addEventListener('click',event=>{if(event.target===mask)cleanup();});
    mask.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();cleanup();return;}if(event.key!=='Tab')return;const f=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>node.getClientRects().length);if(!f.length)return;if(event.shiftKey&&document.activeElement===f[0]){event.preventDefault();f[f.length-1].focus();}else if(!event.shiftKey&&document.activeElement===f[f.length-1]){event.preventDefault();f[0].focus();}});
    close.focus();
  }

  function saveVotes(){try{const keys=Object.keys(votes);for(const k of keys.slice(0,Math.max(0,keys.length-300)))delete votes[k];localStorage.setItem('lexiang.answerFeedback.v1',JSON.stringify(votes));}catch(_){}}
  function stopSpeech(){speechId='';utterance=null;window.speechSynthesis?.cancel();schedule();}
  function speak(text,id){if(speechId===id){stopSpeech();return;}if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){tell('当前浏览器暂不支持语音播报');return;}stopSpeech();speechId=id;const chunks=text.match(/[^。！？\n]{1,150}[。！？\n]?/g)||[text];let index=0;function next(){if(speechId!==id)return;if(index>=chunks.length){speechId='';utterance=null;schedule();return;}utterance=new SpeechSynthesisUtterance(chunks[index++]);utterance.lang='zh-CN';const voice=speechSynthesis.getVoices().find(v=>/^zh[-_]CN/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^zh/i.test(v.lang));if(voice)utterance.voice=voice;utterance.onend=next;utterance.onerror=event=>{if(speechId!==id)return;speechId='';utterance=null;schedule();if(!['canceled','interrupted'].includes(event.error))tell('语音播报暂不可用，请重试');};speechSynthesis.speak(utterance);}next();schedule();}
  async function copy(text){try{await navigator.clipboard.writeText(text);}catch(error){const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.left='-9999px';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw error;}}
  function shareDialog(query,text,trigger){let dialog=document.getElementById('lx-answer-share-dialog');if(dialog)dialog.remove();dialog=document.createElement('dialog');dialog.id='lx-answer-share-dialog';dialog.setAttribute('aria-labelledby','lx-answer-share-title');dialog.innerHTML='<form method="dialog"><div class="lx-answer-share-head"><h2 id="lx-answer-share-title">分享回答</h2><button type="submit" aria-label="关闭分享">关闭</button></div></form><label for="lx-answer-share-content">分享内容</label><textarea id="lx-answer-share-content" readonly></textarea><div class="lx-answer-share-bottom"><button type="button" data-answer-copy-share>复制分享内容</button></div>';const content='我问：'+query+'\n\n联想乐享：\n'+text+'\n\n内容由 AI 生成，仅供参考。\n'+location.origin+'/';dialog.querySelector('textarea').value=content;dialog.querySelector('[data-answer-copy-share]').addEventListener('click',async()=>{try{await copy(content);tell('已复制分享内容');}catch(_){tell('复制失败，请选中文字手动复制');}});dialog.addEventListener('close',()=>{dialog.remove();trigger?.focus();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});document.body.append(dialog);dialog.showModal();}
  function submit(query,message){if(busy()){tell('请先停止或等待当前回答完成');return;}stopSpeech();const full=!!message.closest('.lxfd-thread')&&document.body.classList.contains('assistant-fullscreen');const send=full?window.lxfdSubmit:window.__lxBridge?.sendChat;if(typeof send!=='function'){tell('对话尚未准备好，请稍后重试');return;}Promise.resolve(send(query)).catch(()=>tell('生成暂未完成，请重试'));}
  function sync(){queued=false;
    for(const root of document.querySelectorAll(ROOTS)){
      const messages=[...root.children].filter(n=>n.matches(AI)),latest=messages.at(-1),pending=busy();
      for(const message of messages){
        const isLast=message===latest&&!message.nextElementSibling?.matches('.user,.lxfd-msg-user');
        if(isLast&&pending&&!message.querySelector('[data-lx-generation-stopped]')){const old=message.querySelector('.lx-answer-tools');if(old&&!old.hidden)old.hidden=true;continue;}
        if(message.querySelector('.loading-line,.typing-cursor,.streaming,.lx-generating')&&!message.querySelector('[data-lx-generation-stopped]'))continue;
        const body=message.querySelector('.ai-body')||message.querySelector('.lxfd-ai-body')||message,query=queryOf(message);if(!query)continue;
        let footer=message.querySelector('.lx-answer-tools');
        message.querySelectorAll('.lx-answer-tools').forEach(node=>{if(node!==footer)node.remove();});
        if(footer&&footer.parentElement!==body)body.append(footer);
        if(!footer){footer=document.createElement('div');footer.className='lx-answer-tools';const toolbar=document.createElement('div');toolbar.className='lx-answer-toolbar';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','回答操作');for(const [action,label,icon]of LABELS){const button=document.createElement('button');button.type='button';button.dataset.answerAction=action;button.title=label;button.setAttribute('aria-label',label);const glyph=document.createElement('span');glyph.className='lx-answer-icon';glyph.style.setProperty('--answer-icon',`url('/assets/icons/${icon}.svg')`);glyph.setAttribute('aria-hidden','true');button.append(glyph);toolbar.append(button);}footer.append(toolbar);const followups=document.createElement('div');followups.className='lx-answer-followups';followups.setAttribute('aria-label','猜你想问');const label=document.createElement('div');label.className='lx-answer-followups-title';label.textContent='猜你想问';followups.append(label);const list=document.createElement('div');list.className='lx-answer-questions';followups.append(list);footer.append(followups);body.append(footer);}
        let referenceToggle=footer.querySelector('[data-answer-references-toggle]');footer.querySelectorAll('.lx-answer-reference-panel').forEach(node=>node.remove());
        if(query===NEWS_REFERENCE_QUERY){
          const toolbar=footer.querySelector('.lx-answer-toolbar');
          if(!referenceToggle){referenceToggle=document.createElement('button');referenceToggle.type='button';referenceToggle.className='lx-answer-references-toggle';referenceToggle.dataset.answerReferencesToggle='';referenceToggle.setAttribute('aria-label','相关参考资料（2）');referenceToggle.setAttribute('aria-haspopup','dialog');referenceToggle.textContent='相关参考资料 (2)';toolbar.append(referenceToggle);}
        }else{referenceToggle?.remove();}
        if(footer.hidden)footer.hidden=false;
        if(!body.classList.contains('lx-answer-managed'))body.classList.add('lx-answer-managed');
        const last=isLast&&!pending;if(footer.classList.contains('is-latest')!==last)footer.classList.toggle('is-latest',last);
        let data=cache.get(message);if(!data||dirty.has(message)){const text=answerOf(message);data={query,text,id:hash(query+'\n'+text+'\n'+messages.indexOf(message)),suggestions:questions(message,query)};cache.set(message,data);dirty.delete(message);}const {text,id,suggestions}=data,signature=JSON.stringify(suggestions);
        if(footer.dataset.answerId!==id)footer.dataset.answerId=id;
        if(footer.dataset.questions!==signature){footer.dataset.questions=signature;const list=footer.querySelector('.lx-answer-questions');list.replaceChildren();for(const q of suggestions){const b=document.createElement('button');b.type='button';b.className='lx-answer-question';b.dataset.answerQuestion=q;b.textContent=q;list.append(b);}}
        for(const button of footer.querySelectorAll('[data-answer-action]')){const a=button.dataset.answerAction,pressed=(a==='like'||a==='dislike')?votes[id]===a:a==='speak'?speechId===id:null;if(pressed!==null&&button.getAttribute('aria-pressed')!==String(pressed))button.setAttribute('aria-pressed',String(pressed));const disabled=(a==='regenerate'&&pending)||(['copy','speak','share'].includes(a)&&!text);if(button.disabled!==disabled)button.disabled=disabled;const label=a==='speak'&&speechId===id?'停止播报':LABELS.find(row=>row[0]===a)[1];if(button.title!==label){button.title=label;button.setAttribute('aria-label',label);}}
      }
    }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(sync);}}
  document.addEventListener('click',async event=>{const button=event.target.closest?.('[data-answer-action],[data-answer-question],[data-answer-references-toggle]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const message=button.closest(AI);if(button.hasAttribute('data-answer-references-toggle')){openReferencesDialog(button);return;}const data=message&&(cache.get(message)||{query:queryOf(message),text:answerOf(message),id:button.closest('.lx-answer-tools').dataset.answerId});if(!data)return;const {query,text,id}=data,action=button.dataset.answerAction;if(button.dataset.answerQuestion){submit(button.dataset.answerQuestion,message);return;}if(action==='regenerate'){submit(query,message);return;}if(action==='copy'){try{await copy(text);tell('已复制回答');}catch(_){tell('复制失败，请重试');}return;}if(action==='speak'){speak(text,id);return;}if(action==='share'){if(navigator.share){try{await navigator.share({title:'联想乐享回答',text:'我问：'+query+'\n\n'+text+'\n\n内容由 AI 生成，仅供参考。'});}catch(error){if(error.name!=='AbortError')shareDialog(query,text,button);}}else shareDialog(query,text,button);return;}if(action==='like'||action==='dislike'){if(votes[id]===action)delete votes[id];else votes[id]=action;saveVotes();schedule();tell(votes[id]?(action==='like'?'已点赞':'已点踩'):'已取消反馈');}},true);
  const style=document.createElement('style');style.id='lx-answer-tools-style';style.textContent=window.__p0Modules.styleText("/@script-style/30434c8be5e4f8e356cd5cce.css");(document.head||document.documentElement).append(style);
  new MutationObserver(records=>{let relevant=false;for(const record of records){const target=record.target.nodeType===1?record.target:record.target.parentElement;if(target?.closest('.lx-answer-tools'))continue;const message=target?.closest(AI);if(message)dirty.add(message);relevant=true;}if(relevant)schedule();}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  window.addEventListener('pagehide',stopSpeech);window.addEventListener('storage',event=>{if(event.key==='lexiang.answerFeedback.v1'){try{votes=JSON.parse(event.newValue||'{}');}catch(_){votes={};}schedule();}});
  window.__lxAnswerActions={sync:schedule};schedule();
})();

};

/* public/leaip0/assets/frontend/js/core/app-agent.js */
window.__p0Modules.sources["u2533e1dec0d991d4"]=function(){
// ── 多步任务链框架（脚本化编排，不是 LLM agent loop）───────────────────────
// 一句话意图（"9000以内你看着选一款直接下单"）→ 按预定义链顺序调用已有「操作原子」
// （app.js 里的 openProduct/addCart/lxBuyWithIntro 等真实函数），配合左侧步骤卡
// UI（wait→doing→done 逐步刷新）制造「AI 在自主执行」的观感。右侧画面随每步操作
// 原子自然联动（openProduct 开商详、lxBuyWithIntro 弹下单确认），不额外画路由。
//
// 零侵入设计：本文件不 import app.js，只通过 window.__lxAgentAPI（app.js 里暴露的
// 操作原子桥接）通信；app.js 检测到用户表达代买意图时调用 window.__lxRunChain 转发
// 过来。删除整个功能 = 删这一个文件 + index.html 里那行 script + app.js 里两处引用。
//
// 可扩展：window.__lxRegisterAgentChain(id, def) 注册新链（compare_buy/claim_buy/
// auth_buy 等后续按同样套路加，这次只落地 auto_buy 一条）。
(function (root) {
  "use strict";
  if (!root || root.__lxAgentInstalled) return;
  root.__lxAgentInstalled = true;

  const STYLE = "" /* styles owned by P0 CSS modules */;
  const styleEl = document.createElement("style");
  styleEl.textContent = window.__p0Modules.styleText("/@script-style/1050edccec8d00044d13bfec.css");
  (document.head || document.documentElement).appendChild(styleEl);

  // 极简 HTML 转义（本文件是独立 IIFE，拿不到 app.js 内部的 esc()，自备一份防 XSS/破版）
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  const STEP_DELAY_MS = 1600; // 两步之间的节奏，让人看清每步（真机反馈 1100 偏赶）

  // 复用 main.css 已有的 .lx-op-steps/.lx-op-step/.lx-op-step-ic/.lx-op-spin（lxBuyWithIntro 同款），
  // 不重复定义那套规则；本文件只加链标题栏和步骤详情行两个新 class，避免规则打架。
  function renderCard(title, steps) {
    const stepsHtml = steps.map((s) => {
      const icon = s.state === "done" ? "✓" : s.state === "doing" ? '<span class="lx-op-spin"></span>' : "";
      const detail = s.detail ? `<span class="lx-agent-step-detail">${esc(s.detail)}</span>` : "";
      return `<div class="lx-op-step ${s.state}"><span class="lx-op-step-ic">${icon}</span><span class="lx-agent-step-text"><span>${esc(s.label)}</span>${detail}</span></div>`;
    }).join("");
    return `<div class="lx-agent-chain-head">🔧 多步任务：${esc(title)}</div><div class="lx-op-steps">${stepsHtml}</div>`;
  }

  const CHAINS = {};
  function registerChain(id, def) { CHAINS[id] = def; }
  root.__lxRegisterAgentChain = registerChain;

  // ── auto_buy：全权代买（第一条链）─────────────────────────────────────────
  // 商品推荐 → 智能选款 → 提交订单，三步都是调用已有操作原子，不新造下单逻辑
  registerChain("auto_buy", {
    title: "全权代买",
    steps: [
      {
        label: "商品推荐",
        async run(ctx, api, stepState) {
          const maxPrice = Number(ctx.params.maxPrice) || 0;
          let list = [];
          try {
            // site=shop 保证候选商品只在个人/家庭消费站货盘内，不会混进企业/政企专供 SKU
            const resp = await fetch("/api/products?site=shop&limit=40");
            if (resp.ok) list = await resp.json();
          } catch (_e) {}
          const candidates = (Array.isArray(list) ? list : []).filter(
            (p) => Number(p.price) > 0 && (!maxPrice || Number(p.price) <= maxPrice)
          );
          ctx.candidates = candidates;
          if (!candidates.length) {
            api.addAiMessage(`<div class="lx-agent-note">没找到符合预算的商品，换个预算或换个品类再试试。</div>`);
            return { stop: true };
          }
          stepState.detail = `按预算 ¥${maxPrice || "不限"} 内筛选商品，找到 ${candidates.length} 款`;
        },
      },
      {
        label: "智能选款",
        async run(ctx, api, stepState) {
          const candidates = ctx.candidates || [];
          const sorted = candidates.slice().sort((a, b) => Number(a.price) - Number(b.price));
          const pool = sorted.length >= 3 ? sorted.slice(1) : sorted; // 排除最低档（够3款才排除，避免样本太少排空）
          const picked = pool[pool.length - 1]; // 池内价格最高的，即"最接近预算上限、非最低档"
          ctx.picked = picked;
          stepState.detail = `选中「${picked.name}」，¥${picked.price} 价位配置最均衡，预算内非最低配置`;
          await api.openProduct(picked.sku);
        },
      },
      {
        label: "提交订单",
        async run(ctx, api, stepState) {
          const picked = ctx.picked;
          if (!picked) return;
          // lxBuyWithIntro 自带分步进度卡（打开详情→核对优惠→生成清单领券），内部是
          // fire-and-forget（setTimeout 序列，最长 1900ms 后弹出确认下单弹窗），不重复实现；
          // 这里多等 2200ms 再把本链的「提交订单」标记 done，确保弹窗已经真的弹出来了。
          api.lxBuyWithIntro(picked);
          await delay(2200);
          stepState.detail = "下单清单已生成，确认弹窗已弹出，请核对后确认支付";
        },
      },
    ],
  });

  // ── auto_buy_official：全权代买·官方推荐版（件2）───────────────────────────
  // 商品推荐环节交给官方对话流（app.js sendChat 的 /api/leai/stream）。件2改动：链在 sendChat
  // 一开始（用户气泡之后、官方答案气泡之前）就同步插卡起跑，step1 await 官方 promise
  // （ctx.params.officialWait，app.js done 回调 resolve/error+50s 超时 reject），拿到结果后
  // 按预算走 fallback 阶梯——官方超预算/超时/为空都不会让链静默死，兜底到本地货盘，实在没有
  // 候选才 stop（且必须说明原因+给可点建议）。step1 之后「对比→选款→下单」逻辑不变。
  registerChain("auto_buy_official", {
    title: "全权代买（官方推荐）",
    steps: [
      {
        label: "调用联想乐享官方 SKILL",
        async run(ctx, api, stepState, refresh) {
          const maxPrice = Number(ctx.params.maxPrice) || 0;
          const minPrice = Number(ctx.params.minPrice) || 0;
          const budgetLabel = minPrice ? `¥${minPrice}~${maxPrice || "不限"}` : `¥${maxPrice || "不限"}`;
          const inBudget = (p) => { const pr = Number(p.price); return pr > 0 && (!maxPrice || pr <= maxPrice) && (!minPrice || pr >= minPrice); };
          stepState.detail = "等待官方推荐结果…";
          if (typeof refresh === "function") refresh();

          let officialProducts = [];
          let officialFailReason = "";
          try {
            const waited = await ctx.params.officialWait;
            officialProducts = Array.isArray(waited) ? waited : [];
            // 数据到位 ≠ 视觉到位：正文打字动画/商品卡可能还在渲染。等回答展示稳定再推进，
            // 否则「上面还在输出、下面已开始领券」两线打架（真机反馈）
            stepState.detail = "官方推荐已返回，等待回答展示完成…";
            if (typeof refresh === "function") refresh();
            if (typeof api.waitAnswerSettled === "function") await api.waitAnswerSettled();
          } catch (_e) {
            officialFailReason = "官方超时，已切换乐享自营货盘";
          }

          // 阶梯 1：官方推荐里直接有预算内候选，最优路径
          let candidates = officialProducts.filter(inBudget);
          if (candidates.length) {
            ctx.candidates = candidates;
            stepState.detail = `官方推荐 ${officialProducts.length} 款，预算 ${budgetLabel} 内 ${candidates.length} 款`;
            return;
          }

          // 阶梯 2：官方无预算内候选（超预算/超时/为空）→ 本地乐享自营货盘按系列词补候选
          const kw = (typeof window !== "undefined" && window.__lxIntent && window.__lxIntent.extractSeriesKeyword)
            ? window.__lxIntent.extractSeriesKeyword(ctx.params.rawText || "") : "";
          let localPool = [];
          try {
            const qs = kw ? `&q=${encodeURIComponent(kw)}` : "";
            const resp = await fetch(`/api/products?site=shop${qs}&limit=40`);
            if (resp.ok) {
              const list = await resp.json();
              localPool = Array.isArray(list) ? list : [];
            }
          } catch (_e) { /* 网络异常，localPool 留空，走阶梯3/4兜底 */ }

          const localCandidates = localPool.filter(inBudget);
          if (localCandidates.length) {
            ctx.candidates = localCandidates;
            stepState.detail = officialFailReason
              ? `${officialFailReason}，预算 ${budgetLabel} 内找到 ${localCandidates.length} 款`
              : officialProducts.length
                ? `官方 ${officialProducts.length} 款均不在预算 ${budgetLabel} 内，已从乐享自营货盘补充 ${localCandidates.length} 款`
                : `官方暂未返回商品，已从乐享自营货盘找到预算内 ${localCandidates.length} 款`;
            return;
          }

          // 阶梯 3：官方 + 本地合并候选都超预算 → 取离预算最近的一款，继续往下走（下单前人工确认，安全）
          const pool = officialProducts.concat(localPool).filter((p) => Number(p.price) > 0);
          if (pool.length) {
            const closest = pool.slice().sort((a, b) => Math.abs(Number(a.price) - maxPrice) - Math.abs(Number(b.price) - maxPrice))[0];
            ctx.candidates = [closest];
            const over = Math.max(0, Math.round(Number(closest.price) - maxPrice));
            stepState.detail = `均超预算，已选最接近的「${closest.name}」，超出 ¥${over}，请下单时确认`;
            return;
          }

          // 阶梯 4：官方 0 款且本地也 0 款（极端情况）→ 才允许 stop，但要说明原因 + 给可点建议
          api.addAiMessage(
            `<div class="lx-agent-note">官方和乐享自营货盘暂时都没有返回可用商品，换个预算或换个品类再试试。</div>` +
            `<div class="lx-p0-suggest"><button class="lx-p0-suggest-chip" type="button" data-quick-ask="换个预算，你帮我重新选一款直接下单">换个预算试试</button></div>`
          );
          return { stop: true };
        },
      },
      {
        label: "商品对比 SKILL",
        async run(ctx, api, stepState) {
          const state = api.getState();
          // 清掉可能残留的上一轮「乐享最推荐」标记，避免选款步骤误取到旧对比的结果
          state._compareRecommendedProduct = null;
          state._compareRecommendedSku = "";
          api.lxUpsertCompareTab(ctx.candidates, "官方推荐对比");
          stepState.detail = `已打开 ${ctx.candidates.length} 款候选商品的对比页`;
        },
      },
      {
        label: "智能选款 SKILL",
        async run(ctx, api, stepState, refresh) {
          // 对比页停留 5s：①让人看清对比表和差异高亮（真机反馈"一闪就到详情页"）；
          // ②compare-advice 是异步接口，多等这几秒「乐享最推荐」大概率已算出并高亮，选款更准
          stepState.detail = "正在阅读对比结果与 AI 建议…";
          if (typeof refresh === "function") refresh();
          await delay(5000);
          const picked = (typeof api.lxResolveRecommendedProduct === "function" && api.lxResolveRecommendedProduct()) || ctx.candidates[0];
          ctx.picked = picked;
          stepState.detail = `选中「${picked.name}」，¥${picked.price}`;
          if (typeof refresh === "function") refresh();
          if (picked.sku) await api.openProduct(picked.sku);
          // 商详页也留 2.5s 再进下单，节奏可跟
          await delay(2500);
        },
      },
      {
        label: "下单 SKILL",
        async run(ctx, api, stepState) {
          const picked = ctx.picked;
          if (!picked) return;
          // lxBuyWithIntro 自带分步进度卡（打开详情→核对优惠→生成清单领券），内部是
          // fire-and-forget（setTimeout 序列，最长 1900ms 后弹出确认下单弹窗），不重复实现；
          // 这里多等 2200ms 再把本链的「提交订单」标记 done，确保弹窗已经真的弹出来了。
          api.lxBuyWithIntro(picked);
          await delay(2200);
          stepState.detail = "下单清单已生成，确认弹窗已弹出，请核对后确认支付";
        },
      },
    ],
  });

  // ── 核心执行器 ───────────────────────────────────────────────────────────
  async function runChain(chainId, params) {
    const api = root.__lxAgentAPI;
    if (!api) return;
    const chain = CHAINS[chainId];
    if (!chain) return;

    // 首页与四个频道共用同一个联想乐享智能体。频道只决定右侧页面身份，
    // 不得限制、替换或降级左侧智能体的任务链与执行能力。
    const state = api.getState();

    const steps = chain.steps.map((s) => ({ label: s.label, state: "wait", detail: "" }));
    const node = api.addAiMessage(renderCard(chain.title, steps));
    const refresh = () => {
      const body = node && node.querySelector(".ai-body");
      if (body) body.innerHTML = renderCard(chain.title, steps);
    };
    const ctx = { params: params || {} };

    for (let i = 0; i < chain.steps.length; i++) {
      steps[i].state = "doing";
      refresh();
      let result;
      try {
        result = await chain.steps[i].run(ctx, api, steps[i], refresh);
      } catch (_e) {
        api.addAiMessage(`<div class="lx-agent-note">执行「${esc(chain.steps[i].label)}」时出错，已停止。</div>`);
        return;
      }
      if (result && result.stop) return;
      steps[i].state = "done";
      refresh();
      if (i < chain.steps.length - 1) await delay(STEP_DELAY_MS);
      // 每步 done 后存一次，链跑到哪存到哪——中途刷新/切走也留得住执行记录
      try { window.__lxSaveConversationNow && window.__lxSaveConversationNow(); } catch (_e) {}
    }
  }

  root.__lxRunChain = runChain;
})(typeof window !== "undefined" ? window : null);

};

/* public/leaip0/assets/frontend/js/core/app-lxfd.home-conversation-v122.placeholder-v147.controls-v150.js */
window.__p0Modules.sources["ucfd257a885af82b6"]=function(){
/* p0-stream-view:start */
/* Incremental mirror for already-normalized assistant markup. No network or storage. */
(() => {
  'use strict';
  if(window.__lxStreamView)return;
  const active=new WeakMap();
  function key(node){return node.nodeType===1?(node.id||node.getAttribute('data-id')||''):'';}
  function patchNode(node,next){
    if(node.isEqualNode(next))return;
    if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName||key(node)!==key(next)){node.replaceWith(next.cloneNode(true));return;}
    if(node.nodeType===3||node.nodeType===8){node.data=next.data;return;}
    if(node.nodeType!==1)return;
    for(const a of [...node.attributes])if(!next.hasAttribute(a.name))node.removeAttribute(a.name);
    for(const a of [...next.attributes])if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);
    patchChildren(node,next);
  }
  function patchChildren(host,next){
    const old=[...host.childNodes],fresh=[...next.childNodes];
    for(let i=0;i<fresh.length;i++){if(old[i])patchNode(old[i],fresh[i]);else host.appendChild(fresh[i].cloneNode(true));}
    for(let i=fresh.length;i<old.length;i++)old[i].remove();
  }
  function patch(host,html){const template=document.createElement('template');template.innerHTML=html;patchChildren(host,template.content);}
  function mirror({source,target,scroll,normalize,isGenerating,onFinish,timeout=60000}){
    active.get(target)?.();let stopped=false,raf=0,poll,timer,lastRaw=null;
    function flush(){raf=0;if(stopped||!target.isConnected||!source.isConnected)return;const raw=source.innerHTML;if(raw===lastRaw)return;lastRaw=raw;const stick=!scroll||scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80;patch(target,normalize(raw));if(scroll&&stick)scroll.scrollTop=scroll.scrollHeight;}
    function stop(finish=false){if(stopped)return;if(finish)flush();stopped=true;observer.disconnect();cancelAnimationFrame(raf);clearInterval(poll);clearTimeout(timer);if(active.get(target)===stop)active.delete(target);if(finish&&target.isConnected)onFinish();}
    const observer=new MutationObserver(()=>{if(!raf&&!stopped)raf=requestAnimationFrame(flush);});
    observer.observe(source,{subtree:true,childList:true,characterData:true,attributes:true});
    poll=setInterval(()=>{if(!source.isConnected||!target.isConnected)stop();else if(!isGenerating())stop(true);},750);
    timer=setTimeout(()=>stop(true),timeout);active.set(target,stop);flush();return stop;
  }
  window.__lxStreamView=Object.freeze({patch,mirror});
})();

/* p0-stream-view:end */
// ── 乐享全屏对话（lxfd）独立模块 ─────────────────────────────────────────────
// 从 app.js 拆出（原 L7746-L9426，天然 IIFE 边界，行为零变化）。
// 与主面板通过 window.__lxBridge / window.lxfdSubmit / window.__lxIntent 通信。
// 加载顺序：app-intent.js → app.js → app-lxfd.js（index.html 里排最后）。
// Lexiang fullscreen dialog replacement behavior
(function(){
  "use strict";
  if (window.__lxfdInstalled) return;
  window.__lxfdInstalled = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $(".lxfd");
  if (!root) return;

  const navCluster = $("#lxfdNavCluster");
  const convoPill = $("#lxfdConvoPill");
  const convoName = $("#lxfdConvoName");
  const rail = $("#lxfdRail");
  const railFab = $("#lxfdRailFab");
  const railNewFab = $("#lxfdRailNewFab");
  const historySearch = $("#lxfdHistorySearch");
  const scrim = $("#lxfdScrim");
  const stage = $("#lxfdStage");
  const welcome = $("#lxfdWelcome");
  const thread = $("#lxfdThread");
  const ta = $("#lxfdTa");
  const send = $("#lxfdSend");
  const chips = $("#lxfdChips");
  const quick = $("#lxfdQuick");
  const turnIndex = $("#lxfdTurnIndex");
  const turnDots = $("#lxfdTurnDots");
  const turnList = $("#lxfdTurnList");
  const helloTitle = $("#lxfdHelloTitle");
  const isWindowsRuntime = (() => {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    return /Win/i.test(platform) || /Windows/i.test(ua);
  })();
  const forceFullscreenMotion = isWindowsRuntime;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceFullscreenMotion;
  document.body.classList.toggle("lxfd-force-motion", forceFullscreenMotion);
  let hoverTimer = null;
  let turns = [];
  let helloIndex = 0;
  let helloAnimating = false;
  let helloTimer = null;
  let railManuallyCollapsed = true;
  const chatState = { convId: null, sending: false, conversationNonce: 0, localId: null };;window.__lxGeneration.register(chatState,"fullscreen");window.__lxPersistStoppedFullscreen=()=>{lxfdPersistCurrent();};
  const navPaths = { home: "/", personal: "/shop-chat/", business: "/b-chat/", enterprise: "/biz-chat/", brand: "/brand/" };
  const LXFD_DEFAULT_HELLO_WORDS = ["找商品", "找门店", "找服务", "职场认证", "教育优惠", "找解决方案"];
  let helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
  const questions = ["想买游戏本，预算8000怎么选？", "学生买轻薄本，国补和教育优惠能省多少？", "小新和YOGA系列怎么选？", "旧电脑换新能抵多少钱？", "哪里有卖ThinkPad笔记本电脑门店"];
  const quicks = ["教育特惠", "以旧换新", "乐豆商城", "0元试用", "私人订制", "会员中心", "拉新返利"];
  const arrow = '<span class="arrow">' + window.__lxApprovedIcon("global-next") + '</span>';
  // actionbar 按钮 label → 有意义的 query 示例（避免直接发 label 体验差）
  const LXFD_ACTION_Q = {
    "文档解读": "请帮我解读这份文档，提炼核心结论、关键数据和待确认风险",
    "商品导购": "帮我推荐一款适合我的笔记本电脑",
    "解决方案": "解决方案",
    "门店查询": "帮我查询附近的联想门店",
    "职场认证": "职场人群认证怎么做，能享哪些专属优惠？",
    "服务预约": "我想预约售后维修或上门服务",
    "我的订单": "帮我查最近的订单状态和物流",
    "售后服务": "我的设备保修和售后服务怎么办理？",
    "评价服务": "给本次客服服务打个五星好评",
    "需求清单": "我整理一份采购需求清单发你确认",
  };
  const answer = '<p>我是联想官方AI助手，主要可以帮您完成以下事情：</p>'
    + '<h4>产品选购</h4><ul><li>推荐最适合的联想产品&lt;笔记本、台式机、平板、手机、配件等&gt;</li><li>产品参数对比、性价比分析</li></ul>'
    + '<h4>优惠查询</h4><ul><li>最新优惠政策:国补、教育优惠、企业补贴、学生价等</li><li>计算到手价、叠加各种优惠</li><li>推荐最适合您身份的优惠券</li></ul>'
    + '<h4>服务支持</h4><ul><li>查询保修状态、推荐延保方案</li><li>售后流程:退换货、维修、清洁保养、以旧换新估价</li><li>服务站地址和技术支持联系方式</li></ul>'
    + '<h4>订单辅助</h4><ul><li>处理订单、发货物流、发票等</li><li>会员权益、乐豆积分的使用</li></ul>'
    + '<p>有什么具体需求，随时可以和我说~</p>'
    + '<div class="lxfd-followups"><button type="button">可以推荐适合学生的笔记本吗？</button><button type="button">怎么查询我的产品保修状态？</button><button type="button">现在有哪些可以叠加的优惠政策？</button></div>'
    + '<p class="lxfd-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</p>';

  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
  function escapeAttr(text) { return escapeHtml(text).replace(/`/g, "&#96;"); }
  function lxfdDetectPage() {
    const path = location.pathname;
    for (const [page, p] of Object.entries(navPaths)) {
      if (path === p || path === p.replace(/\/$/, "") || path.startsWith(p === "/" ? "/_" : p)) {
        if (p !== "/" || path === "/") return page;
      }
    }
    // 精确匹配
    for (const [page, p] of Object.entries(navPaths)) {
      const normalized = p.endsWith("/") ? p : p + "/";
      const pathNorm = path.endsWith("/") ? path : path + "/";
      if (pathNorm === normalized) return page;
    }
    return "home";
  }
  function lxfdApplySite() {
    const prompts = window.__lxSitePrompts;
    if (!prompts) {
      // 兜底：用写死默认值渲染
      if (chips) chips.innerHTML = questions.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
      if (quick) quick.innerHTML = quicks.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
      return;
    }
    const page = (window.__lxState && window.__lxState.page) || lxfdDetectPage();
    const cfg = prompts[page] || prompts.home;
    if (!cfg) return;
    // 欢迎 chips
    const welcomeList = cfg.welcome || questions;
    if (chips) chips.innerHTML = welcomeList.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
    // 底部 actionbar
    const actionbarList = cfg.actionbar || quicks;
    if (quick) quick.innerHTML = actionbarList.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
    // 滚动标题词固定使用默认词组，不随频道话术重新读取。
    helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
    helloIndex = helloIndex % helloWords.length;
    // 输入框 placeholder
    if (ta && cfg.placeholder) ta.placeholder = cfg.placeholder;
  }
  lxfdApplySite();
  if (ta) ta.placeholder = "推荐笔记本电脑";
  function shortText(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }

  // ── 能力 B：localStorage 多会话历史 ──────────────────────────────────────
  function lxfdLoadStore() { try { return JSON.parse(localStorage.getItem("lexiang.lxfd.convs.v1") || "[]"); } catch (_) { return []; } }
  function lxfdSaveStore(a) { try { localStorage.setItem("lexiang.lxfd.convs.v1", JSON.stringify(a.slice(0, 20))); } catch (_) {} }
  function lxfdNewLocalConv() { chatState.localId = "lc" + Date.now() + Math.random().toString(36).slice(2, 6); }
  function lxfdPersistCurrent() {
    if (!thread || !thread.children.length) return;
    if (!chatState.localId) lxfdNewLocalConv();
    const firstUser = thread.querySelector(".lxfd-msg-user");
    const title = (firstUser ? firstUser.textContent : "新对话").trim().slice(0, 24) || "新对话";
    const snapshot = lxfdLoadStore();
    const previous = snapshot.find(c => c.id === chatState.localId);
    const threadHtml = thread.innerHTML, convId = chatState.convId || null;
    if (previous?.threadHtml === threadHtml && previous.title === title && previous.convId === convId) { lxfdSyncToMainConvKey(); return; }
    const store = snapshot.filter(c => c.id !== chatState.localId);
    store.unshift({ id: chatState.localId, title, convId, threadHtml, ts: Date.now(), pinned: !!previous?.pinned });
    lxfdSaveStore(store);
    // 同步一份到子站切换/刷新恢复用的 key（lexiang.conversation.v1）——否则首页对话切子站后丢失
    lxfdSyncToMainConvKey();
  }
  window.__lxfdPersistCurrentNow = lxfdPersistCurrent;
  // 首页 lxfd 对话 → 写进主对话持久化 key，让切子站(整页重载)后能恢复到同一段历史
  function lxfdSyncToMainConvKey() {
    try {
      if (localStorage.getItem("lexiang.newChatEmpty.v1") === "1") {
        localStorage.removeItem("lexiang.conversation.v1");
        return;
      }
      if (!thread) return;
      const nodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai"));
      const messages = [];
      nodes.forEach(function (el) {
        if (el.classList.contains("lxfd-msg-user")) {
          const text = (el.textContent || "").trim();
          if (text) messages.push({ role: "user", text: text, html: "" });
        } else {
          const body = el.querySelector(".lxfd-ai-body");
          let html = body ? body.innerHTML : "";
          const text = body ? (body.textContent || "").trim() : "";
          // 完成态正文会保留 hidden typing-cursor，不能仅凭类名把整条回复当成生成中。
          // 真正未完成的消息仍以可见 loading/typing 节点或占位文案为准；已有正文时保留
          // text，并清空不安全的中间态 HTML，让目标栏目用统一 markdown 渲染恢复。
          const hasVisiblePending = !!(body && Array.from(body.querySelectorAll(".lx-generating, .loading-line, .typing-text, .typing-cursor")).some(function (node) {
            return !node.hidden && node.getAttribute("aria-hidden") !== "true";
          }));
          const hasPlaceholderOnly = /联想乐享正在生成中|正在生成中/.test(text) && text.length < 40;
          if ((hasVisiblePending || hasPlaceholderOnly) && !text.replace(/联想乐享正在生成中|正在生成中/g, "").trim()) return;
          if (hasVisiblePending || hasPlaceholderOnly) html = "";
          if (html || text) messages.push({ role: "ai", text: text, html: html });
        }
      });
      while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      if (!messages.length) return;
      const payload = {convId: chatState.convId || null, messages: messages.slice(-50)};
      const saved = JSON.parse(localStorage.getItem("lexiang.conversation.v1") || "null");
      if (saved && saved.convId === payload.convId && JSON.stringify(saved.messages) === JSON.stringify(payload.messages)) return;
      localStorage.setItem("lexiang.conversation.v1", JSON.stringify({...payload, ts: Date.now()}));
    } catch (_e) {}
  }
  function lxfdRenderHist(query) {
    const normalizedQuery = String(query ?? historySearch?.value ?? "").trim().toLocaleLowerCase("zh-CN");
    const store = lxfdLoadStore()
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Number(b.ts || 0) - Number(a.ts || 0))
      .filter(c => !normalizedQuery || String(c.title || "").toLocaleLowerCase("zh-CN").includes(normalizedQuery));
    const hist = $("#lxfdHist");
    if (!hist) return;
    if (!store.length) {
      hist.innerHTML = '<div class="lxfd-hist-empty" role="status">' + (normalizedQuery ? "没有找到相关对话" : "暂无历史记录") + '</div>';
      return;
    }
    hist.innerHTML = store.map(c => '<div class="lxfd-hist-item' + (c.pinned ? " is-pinned" : "") + '" data-conv-item="' + escapeAttr(c.id) + '">' +
      '<a href="#" data-conv="' + escapeAttr(c.id) + '" class="lxfd-hist-link ' + (c.id === chatState.localId ? "active" : "") + '" title="' + escapeAttr(c.title) + '"><span class="lxfd-hist-title">' + escapeHtml(c.title) + '</span></a>' +
      '<button class="lxfd-hist-more" type="button" aria-label="' + escapeAttr(c.title) + '的更多操作" aria-haspopup="menu" aria-expanded="false"><img src="../icons/global-more.svg" alt="" aria-hidden="true" /></button>' +
      '<div class="lxfd-hist-menu" role="menu"><button class="lxfd-hist-action" type="button" role="menuitem" data-action="pin"><img src="../icons/' + (c.pinned ? 'global-unpin.svg' : 'global-pin.svg') + '" alt="" aria-hidden="true" /><span>' + (c.pinned ? "取消置顶" : "置顶") + '</span></button><button class="lxfd-hist-action" type="button" role="menuitem" data-action="delete"><img src="../icons/global-delete.svg" alt="" aria-hidden="true" /><span>删除</span></button></div></div>').join("");
    hist.querySelectorAll(".lxfd-hist-more").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const item = button.closest(".lxfd-hist-item");
        if (!item) return;
        const open = !item.classList.contains("menu-open");
        $$(".lxfd-hist-item.menu-open").forEach(node => {
          node.classList.remove("menu-open");
          node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false");
        });
        item.classList.toggle("menu-open", open);
        button.setAttribute("aria-expanded", String(open));
        if (open) item.querySelector(".lxfd-hist-action")?.focus();
      });
    });
  }

  function lxfdUpdateConversation(id, action) {
    const store = lxfdLoadStore();
    const index = store.findIndex(item => item.id === id);
    if (index < 0) return;
    if (action === "pin") store[index].pinned = !store[index].pinned;
    if (action === "delete") store.splice(index, 1);
    lxfdSaveStore(store);
    if (action === "delete" && id === chatState.localId) resetConversation(false);
    else lxfdRenderHist();
  }
  function lxfdLoadConv(id) {
    const c = lxfdLoadStore().find(x => x.id === id);
    if (!c) return;
    window.__lxRecommendationFollowups?.clear();
    lxfdPersistCurrent();
    chatState.localId = c.id;
    chatState.convId = c.convId || null;
    chatState.conversationNonce += 1;
    if (thread) { thread.innerHTML = c.threadHtml; thread.classList.add("show"); }
    if (welcome) welcome.style.display = "none";
    lxfdSetGalleryChatting(true);
    if (convoName) { convoName.textContent = shortText(c.title, 15); convoName.title = c.title; }
    turns = [];
    renderTurnIndex("");
    lxfdRenderHist();
  }

  // ── 能力 A：从主面板导入已有对话 ─────────────────────────────────────────
  // 查主面板消息必须排除过渡动画层里的克隆：动画层整块克隆 .assistant-panel（类名原样保留），
  // 存活的 760ms 内全局 querySelectorAll 会真身+克隆各抓一份 → 导入翻倍
  function lxfdMainMsgs(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel), function(el) { return !el.closest(".lxfd-motion-panel"); });
  }
  function lxfdMainGenerating() {
    // 主面板是否仍在流式生成（state.sending 或最后一条 AI 消息里还挂着生成骨架）
    return !!((window.__lxState && window.__lxState.sending) ||
      lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai .lx-generating").length);
  }
  function lxfdNormalizeImportedAiHtml(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("[data-lx-focus-reco]").forEach((node) => {
      node.removeAttribute("data-lx-focus-reco");
      node.setAttribute("data-lxfd-reveal-products", "1");
    });
    return box.innerHTML;
  }
  function lxfdDoImport() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const importedConvId = (window.__lxState && window.__lxState.convId) || null;
    // 重复展开同一段分屏会话时覆盖同步现有全屏线程，不额外制造一条历史记录；
    // 只有确实切换到了另一段后端会话时才建立新的本地会话身份。
    if (!chatState.localId || (chatState.convId && importedConvId && chatState.convId !== importedConvId)) {
      lxfdNewLocalConv();
    }
    thread.innerHTML = "";
    turns = [];
    msgs.forEach(function(el) {
      const isUser = el.classList.contains("user");
      if (isUser) {
        const text = el.textContent.trim();
        const turnId = "turn-" + Date.now() + "-" + turns.length;
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-user" id="' + turnId + '">' + escapeHtml(text) + '</div>');
        turns.push({ id: turnId, text: text });
      } else {
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">' + lxfdNormalizeImportedAiHtml(el.innerHTML) + '</div></div>');
      }
    });
    renderTurnIndex("");
    chatState.convId = importedConvId;
    if (welcome) welcome.style.display = "none";
    thread.classList.add("show");
    chatState.started = true;
    lxfdSetGalleryChatting(true);
    if (quick) quick.style.display = "none";
    const lastUser = thread.querySelector(".lxfd-msg-user:last-of-type");
    const titleText = lastUser ? lastUser.textContent.trim() : "导入的对话";
    if (convoName) { convoName.textContent = shortText(titleText, 15); convoName.title = titleText; }
    lxfdPersistCurrent();
    lxfdRenderHist();
    return true;
  }
  function lxfdImportFromMain() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const generating = lxfdMainGenerating();
    // 先把当前所有消息（含那条还在生成、内容只有一半的 AI）原样克隆过来——带一半过来
    lxfdDoImport();
    if (generating) {
      // 主面板仍在流式输出：实时把最后一条 AI 消息镜像到全屏，主面板每蹦一段、全屏跟着更新，
      // 直到生成结束——边进边继续往外输出，不再干等（流式 SSE 只发给主面板 DOM，这里做镜像）。
      const aiNodes = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai");
      const mainAi = aiNodes[aiNodes.length - 1];
      const fsBodies = thread.querySelectorAll(".lxfd-msg-ai .lxfd-ai-body");
      const fsAiBody = fsBodies[fsBodies.length - 1];
      if (mainAi && fsAiBody) {
        window.__lxStreamView.mirror({source:mainAi,target:fsAiBody,scroll:thread,normalize:lxfdNormalizeImportedAiHtml,isGenerating:lxfdMainGenerating,onFinish:()=>{lfxdPersistCurrent();lfxdRenderHist();}});
      }
    }
    return true;
  }
  // ── 能力 C：把 lxfd 当前对话导出到主面板 ──────────────────────────────────
  // excludeEls：这一轮临时展示、不该进历史的节点（件2代买桥接用——过渡态用户气泡/提示条
  // 只在全屏展示做视觉过渡，真正的一条由桥接后 sendChat(value) 在主面板重新生成，
  // 带过去导出会变成重复两条）。
  function lxfdExportToMain(excludeEls) {
    if (!thread || !window.__lxBridge) return;
    const skip = excludeEls && excludeEls.length ? new Set(excludeEls) : null;
    const messages = [];
    const allNodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai")).filter(function(el) { return !skip || !skip.has(el); });
    const lastAi = allNodes.filter(function(el) { return el.classList.contains("lxfd-msg-ai"); }).pop();
    allNodes.forEach(function(el) {
      if (el.classList.contains("lxfd-msg-user")) {
        messages.push({ role: "user", text: el.textContent.trim(), html: "" });
      } else {
        const body = el.querySelector(".lxfd-ai-body");
        let html;
        if (body) {
          // 剥掉 lxfd 专属商品区和免责；追问需要保留，并转成主对话可点击的链接样式。
          // 商品已在右侧 reco 页正常展示，左侧对话保留文字答案 + 最新追问。
          const clone = body.cloneNode(true);
          clone.querySelectorAll(".lxfd-products, .lxfd-disclaimer").forEach(function(n) { n.remove(); });
          if (el !== lastAi) clone.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach(function(n) { n.remove(); });
          clone.querySelectorAll(".lxfd-followups").forEach(function(n) {
            n.classList.remove("lxfd-followups");
            n.classList.add("followups");
            n.setAttribute("data-followups", "1");
            n.querySelectorAll("button").forEach(function(btn) {
              const text = (btn.textContent || "").replace(/→\s*$/, "").trim();
              if (text) btn.setAttribute("data-quick-ask", text);
            });
          });
          html = clone.innerHTML;
        } else {
          html = el.innerHTML;
        }
        messages.push({ role: "ai", text: "", html: html });
      }
    });
    if (!messages.length) return;
    window.__lxBridge.importConversation(messages, chatState.convId, { localId: chatState.localId });
  }
  function parseJson(data) {
    try { return JSON.parse(data); } catch (_) { return {}; }
  }
  function money(value) {
    const n = Number(value || 0);
    return n ? "¥" + n.toLocaleString("zh-CN") : "咨询价";
  }
  function imgUrl(src) {
    const value = String(src || "").trim();
    if (!value) return "/assets/product-placeholder.svg";
    return value.startsWith("http") || value.startsWith("/") ? value : "/" + value;
  }
  function mdLite(text) {
    // 官方文本常自带 HTML 实体（「我的」&gt;「设置」），不先解码会被 escapeHtml 二次转义显示成字面（同主面板 mdLite）
    const src = String(text || "").replace(/<br\s*\/?>/gi, "\n").replace(/[ \t]*_\._[ \t]*/g, " ")
      .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    let html = escapeHtml(src);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?:^|\n)####?\s*(.+)/g, "\n<h4>$1</h4>");
    html = html.replace(/(?:^|\n)-\s+(.+)/g, "\n<ul><li>$1</li></ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    return html.split(/\n{2,}/).map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (/^<(h4|ul)/.test(clean)) return clean;
      return `<p>${clean.replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }
  async function readSse(response, handlers) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() || "";
      blocks.forEach((block) => {
        let event = "message";
        const data = [];
        block.split(/\n/).forEach((line) => {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        });
        const payload = data.join("\n");
        if (payload && handlers[event]) handlers[event](payload);
      });
    }
    if (buffer.trim()) {
      let event = "message";
      const data = [];
      buffer.split(/\n/).forEach((line) => {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      });
      const payload = data.join("\n");
      if (payload && handlers[event]) handlers[event](payload);
    }
  }
  function wide() { return window.innerWidth >= 1280; }
  function finishMotionClass(name, delay = 520) {
    window.setTimeout(() => document.body.classList.remove(name), reduceMotion ? 0 : delay);
  }
  function runMotionPanel(layer) {
    if (!layer) return;
    const runCssMotion = () => {
      if (forceFullscreenMotion) {
        layer.getBoundingClientRect();
        requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("run")));
      } else {
        requestAnimationFrame(() => layer.classList.add("run"));
      }
    };
    // Windows 11 + Chromium 149 may skip the left/top/size transition when the
    // fullscreen layer is inserted and the body class changes in the same frame.
    // Drive that environment with WAAPI, while leaving the existing CSS path
    // untouched for systems where the original animation already works.
    if (!forceFullscreenMotion || typeof layer.animate !== "function") {
      runCssMotion();
      return;
    }
    const isExit = layer.classList.contains("lxfd-motion-panel-exit");
    const ease = "cubic-bezier(.22,.61,.36,1)";
    const start = layer.getBoundingClientRect();
    const toPx = (value, fallback) => {
      const n = parseFloat(String(value || ""));
      return Number.isFinite(n) ? n : fallback;
    };
    const target = isExit
      ? {
          left: toPx(layer.style.getPropertyValue("--lxfd-target-left"), start.left),
          top: toPx(layer.style.getPropertyValue("--lxfd-target-top"), start.top),
          width: toPx(layer.style.getPropertyValue("--lxfd-target-width"), start.width),
          height: toPx(layer.style.getPropertyValue("--lxfd-target-height"), start.height),
          radius: 8,
          opacity: 0,
      }
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, radius: 0, opacity: 0 };
    if (isExit) {
      const scaleX = target.width > 0 && start.width > 0 ? target.width / start.width : 1;
      const scaleY = target.height > 0 && start.height > 0 ? target.height / start.height : 1;
      const moveX = target.left - start.left;
      const moveY = target.top - start.top;
      layer.style.transformOrigin = "top left";
      layer.style.backfaceVisibility = "hidden";
      layer.style.transform = "translate3d(0,0,0) scale(1,1)";
      const first = {
        transform: "translate3d(0,0,0) scale(1,1)",
        borderRadius: "0px",
        opacity: "1",
      };
      const last = {
        transform: `translate3d(${moveX}px,${moveY}px,0) scale(${scaleX},${scaleY})`,
        borderRadius: `${target.radius}px`,
        opacity: `${target.opacity}`,
      };
      const anim = layer.animate([
        first,
        { ...first, offset: 0.08 },
        { ...last, opacity: "1", offset: 0.72 },
        last
      ], { duration: 720, easing: ease, fill: "forwards" });
      anim.addEventListener("finish", () => {
        layer.style.left = `${target.left}px`;
        layer.style.top = `${target.top}px`;
        layer.style.width = `${target.width}px`;
        layer.style.height = `${target.height}px`;
        layer.style.borderRadius = `${target.radius}px`;
        layer.style.opacity = `${target.opacity}`;
        layer.style.transform = "translate3d(0,0,0) scale(1,1)";
        layer.classList.add("run");
      }, { once: true });
      return;
    }
    const first = {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      borderRadius: isExit ? "0px" : "8px",
      opacity: "1",
    };
    const hold = { ...first, offset: isExit ? 0.72 : 0.67 };
    const last = {
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      borderRadius: `${target.radius}px`,
      opacity: `${target.opacity}`,
    };
    const anim = layer.animate([first, hold, last], { duration: 720, easing: ease, fill: "forwards" });
    anim.addEventListener("finish", () => {
      Object.assign(layer.style, last);
      layer.classList.add("run");
    }, { once: true });
  }
  function createPanelStretchLayer() {
    const source = document.querySelector(".assistant-panel");
    if (!source || reduceMotion) return null;
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function getSplitPanelRect() {
    // 全屏态可能只剩 lx-auto-fs：exitFullscreen 里先跑的 focusReco→lxRevealContent 会摘掉
    // assistant-fullscreen 但留 lx-auto-fs（它单独也藏着 .shell）。只认一个类会误判"不在全屏"，
    // 不摘类就去量 → 量到 display:none 的面板 → null → 退出动画整个消失
    const wasFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (wasFullscreen) setFullscreen(false);
    const source = document.querySelector(".assistant-panel");
    const rect = source?.getBoundingClientRect();
    if (wasFullscreen) setFullscreen(true);
    if (!rect || !rect.width || !rect.height) return null;
    return rect;
  }
  function createFullscreenShrinkLayer(targetRect) {
    const source = document.querySelector(".lxfd");
    if (!source || !targetRect || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function createFullscreenExitLayer() {
    const source = document.querySelector(".lxfd");
    if (!source || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    return layer;
  }
  function setFullscreenExitLayerTarget(layer, targetRect) {
    if (!layer || !targetRect || !targetRect.width || !targetRect.height) return false;
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    runMotionPanel(layer);
    return true;
  }
  function normalizeFullscreenEntryState() {
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    document.body.classList.remove("lxfd-exiting", "lxfd-split-returning");
    if (document.body.classList.contains("lx-home-split")) {
      document.body.dataset.page = "home";
      const content = document.querySelector(".content");
      if (content) content.setAttribute("data-view", "home");
      document.body.classList.remove("lx-home-split");
    }
    stage?.classList.remove("shift");
    openRail(false);
  }
  function enterFullscreen() {
    // 动画层必须在 normalize 之前截取：normalize 会拆掉分屏布局，之后 .assistant-panel
    // 量出 0×0 → 拿不到起点 → 退化成 CSS 兜底的「从下面冒出」而不是面板拉伸过渡
    const motionLayer = createPanelStretchLayer();
    normalizeFullscreenEntryState();
    lxfdApplySite();
    // 每次展开都重新读取分屏当前会话。不能以全屏 thread 是否为空作为判断，
    // 否则 thread 中残留的旧首轮内容会阻止后续问答和推荐卡片被带入。
    if (lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) lxfdImportFromMain();
    document.body.classList.remove("lxfd-exiting");
    document.body.classList.remove("lxfd-split-returning");
    document.body.classList.add("lxfd-entering");
    document.body.classList.add("lxfd-split-entered");
    setFullscreen(true);
    window.setTimeout(() => motionLayer?.remove(), reduceMotion ? 0 : 760);
    finishMotionClass("lxfd-entering", 760);
  }
  function exitFullscreen(afterExit, options) {
    const onAfterExit = typeof afterExit === "function" ? afterExit : null;
    const skipGenericFocus = !!(options && options.skipGenericFocus);
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterExit?.();
      return;
    }
    // 有对话时回「分屏」而不是裸首页：enterFullscreen 的 normalize 把页面态抹成了 home，
    // 不对称恢复的话对话会藏在隐藏的 lxfd thread 里，用户看到 hero 首页以为对话丢了。
    // 先恢复分屏布局（复用 focusReco 配方）再量收缩动画落点，动画才有真实目标矩形。
    const hasConvo = !!(thread?.querySelector(".lxfd-msg-user, .lxfd-msg-ai") && window.__lxBridge);
    // 带回调退出只用于“结果卡打开右侧内容”，即使历史 thread 的 show 标记在恢复时
    // 暂时缺失，也必须强制回左右框架，不能依赖 hasConvo 这一项视觉标记。
    const returnToSplit = hasConvo || !!onAfterExit;
    if (hasConvo) {
      lxfdExportToMain();
      try {
        if (skipGenericFocus) window.__lxBridge.prepareRootSplitState?.();
        else window.__lxBridge.focusReco();
      } catch {}
    }
    const targetRect = getSplitPanelRect();
    const motionLayer = createFullscreenShrinkLayer(targetRect);
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    // 全屏类清理/主应用退出钩子都可能重算页面态。必须在它们之后再次落定分屏，
    // 否则会出现既无 assistant-fullscreen、也无 lx-home-split 的半退出页面。
    if (returnToSplit) lxfdEnsureRootSplitState();
    document.body.dataset.state = hasConvo ? "chat" : "default";
    if (hasConvo && thread) thread.innerHTML = "";
    if (onAfterExit) requestAnimationFrame(() => {
      if (returnToSplit) lxfdEnsureRootSplitState();
      onAfterExit();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      if (returnToSplit) lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  // 结果卡需要从全屏对话直接落到“左对话 + 右结果”。
  // 这里不走通用退出动画：通用动画会在两帧之间暴露裸商城和
  // 全屏层/商城混合态。所有布局类、页面态和目标内容在同一个点击任务内提交，
  // 浏览器下一次绘制只能看到最终左右框架。
  function lxfdExitToResultAtomically(commitResult) {
    const hasConversation = !!(thread && thread.children.length && window.__lxBridge);
    if (hasConversation) lxfdExportToMain();
    document.body.classList.remove(
      "assistant-fullscreen", "lx-auto-fs", "lx-root-home", "lxfd-entering",
      "lxfd-exiting", "lxfd-split-returning"
    );
    document.querySelectorAll(".lxfd-motion-panel").forEach((node) => node.remove());
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    lxfdEnsureRootSplitState();
    document.body.dataset.state = "chat";
    if (typeof commitResult === "function") commitResult();
    lxfdEnsureRootSplitState();
    lxfdAssertSplitEndState();
    if (hasConversation && thread) thread.innerHTML = "";
    const stabilizeSplit = () => {
      lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
    };
    requestAnimationFrame(stabilizeSplit);
    // Restored history cards can start an asynchronous result-page generator.
    // Root-home guards may run again during that window and remove the split
    // class after the first frame. Keep asserting the shared two-column end
    // state until the result page has replaced its generation overlay.
    [80, 240, 520, 900].forEach((delay) => window.setTimeout(stabilizeSplit, reduceMotion ? 0 : delay));
  }
  // 退出动画收尾断言：分屏已成形则全屏类必须不在。防御外部"回全屏"钩子在动画窗口内
  // (补分屏类之前的一瞬守卫失效)把全屏类加回来，造成两态共存的混合花屏
  function lxfdAssertSplitEndState() {
    if (!document.body.classList.contains("lx-home-split")) return;
    // A layout transition must not hide an already imported conversation.
    const splitMessages = document.querySelector(".shell > .assistant-panel > .chat-state > .lx-p0-messages");
    if (splitMessages?.querySelector(".lx-p0-message")) document.body.dataset.state = "chat";
    window.__LXFD_FORCE = false; // 已进分屏,关掉"URL=/强制全屏"开关,否则内联force定时器会把全屏盖回来
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lx-root-home");
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    if (document.body.dataset.page === "home" || !document.body.dataset.page) document.body.dataset.page = "personal";
    // forceRootFullscreen 曾给 .lxfd 写内联 display:block/visibility:visible——内联样式压过
    // 分屏 CSS 的隐藏规则,全屏层会叠在分屏上(消息裸排+hero输入框+画廊混显)。清掉还权给 CSS
    const lxfdLayer = document.querySelector(".lxfd");
    if (lxfdLayer) { lxfdLayer.style.display = ""; lxfdLayer.style.visibility = ""; }
  }
  function exitFullscreenWithReveal(afterReveal) {
    const onAfterReveal = typeof afterReveal === "function" ? afterReveal : null;
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterReveal?.();
      return;
    }
    // Own the conversation handoff here, before layout hooks or result callbacks
    // can hide/clear the fullscreen thread. Business callers need not pre-export.
    const hasConversation = !!(thread?.querySelector(".lxfd-msg-user, .lxfd-msg-ai") && window.__lxBridge);
    if (hasConversation) lxfdExportToMain();
    const motionLayer = createFullscreenExitLayer();
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    if (hasConversation) lxfdEnsureRootSplitState();
    else document.body.dataset.state = thread?.classList.contains("show") ? "chat" : "default";
    onAfterReveal?.();
    lxfdAssertSplitEndState();
    requestAnimationFrame(() => {
      lxfdAssertSplitEndState();
      // Export runs while the split panel is hidden; restore its scroll position
      // only once it has measurable geometry, rather than scrolling a hidden list.
      const chat = document.querySelector(".shell > .assistant-panel > .chat-state");
      const messages = chat?.querySelector(":scope > .lx-p0-messages");
      if (messages?.children.length) {
        chat.scrollTop = 0;
        messages.scrollTop = messages.scrollHeight;
      }
      const rect = document.querySelector(".assistant-panel")?.getBoundingClientRect();
      if (!setFullscreenExitLayerTarget(motionLayer, rect)) motionLayer?.remove();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  window.__lxfdExitWithReveal = exitFullscreenWithReveal;
  function setFullscreen(on) {
    document.body.classList.toggle("assistant-fullscreen", !!on);
    document.body.classList.toggle("lx-auto-fs", !!on);
    if (!on) document.body.classList.remove("lxfd-split-entered");
    if (on) document.body.dataset.state = "chat";
    if (on) {
      const currentTitle = convoName?.textContent?.trim();
      if (convoName && !currentTitle) {
        const splitTitle = document.querySelector(".main-nav")?.getAttribute("data-current-label")?.trim();
        const lastMainUser = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.user").pop()?.textContent?.trim();
        const fallbackTitle = splitTitle || (lastMainUser ? shortText(lastMainUser, 15) : "新对话");
        convoName.textContent = fallbackTitle;
        convoName.title = fallbackTitle;
      }
      const hasThread = !!(thread && (thread.classList.contains("show") || thread.children.length));
      if (hasThread || chatState.started) {
        if (welcome) welcome.style.display = "none";
        if (thread) thread.classList.add("show");
        if (quick) quick.style.display = "none";
        lxfdSetGalleryChatting(true);
      }
      requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); ta?.focus(); });
    }
  }
  function setNav(open) {
    navCluster?.classList.toggle("open", open);
    convoPill?.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function syncRailNewFabVisibility() {
    const chatting = !!stage?.classList.contains("is-chatting");
    const railOpen = !!rail?.classList.contains("open");
    document.body.classList.toggle("lxfd-chatting", chatting);
    railNewFab?.classList.toggle("hide", railOpen || !chatting);
  }
  function openRail(open) {
    if (open && !window.__lxState?.user) open = false;
    rail?.classList.toggle("open", open);
    railFab?.classList.toggle("hide", open);
    syncRailNewFabVisibility();
    stage?.classList.toggle("shift", open && wide());
    scrim?.classList.remove("show");
    // 侧栏一露出就重读 localStorage 重渲染——store 是主面板(app.js lxArchiveCurrentConversation)
    // 和本文件(lxfdPersistCurrent)共用的同一个 key，但 #lxfdHist 只在启动时渲染过一次；
    // 主面板那边新归档的对话（含多步 agent 卡）不会自动反映到这里，用户点开旧快照里的
    // 条目会踩到过期/不完整数据，恢复出来就只剩用户那句话。开一次刷一次，零额外触发面。
    if (open) lxfdRenderHist();
  }
  function setRailManual(open) {
    railManuallyCollapsed = !open;
    document.body.classList.toggle("lxfd-rail-user-open", !!open);
    openRail(open);
  }
  function syncRailForViewport() {
    openRail(Boolean(window.__lxState?.user) && wide() && !railManuallyCollapsed);
  }
  window.__lxfdSyncHistoryAuth = function(authenticated) {
    if (!authenticated) {
      railManuallyCollapsed = true;
      document.body.classList.remove("lxfd-rail-user-open");
      openRail(false);
      return;
    }
    syncRailForViewport();
  };
  function fit() {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 148) + "px";
  }
  function syncSend() {
    const empty = !ta?.value.trim() && !window.__lxRecommendationFollowups?.hasSelection();
    send?.classList.toggle("idle", empty);
    if (send) send.disabled = empty;
  }
  function setRotatingTitle(word) { if (helloTitle) helloTitle.innerHTML = `<span>联想乐享帮你</span><span class="rotating-word">${escapeHtml(word)}</span>`; }
  async function rotateTitleWordForWindows(word) {
    if (helloAnimating || !word || typeof word.animate !== "function") return;
    helloAnimating = true;
    const ease = "cubic-bezier(.16,.72,.22,1)";
    try {
      // 位移用 top（布局属性，主线程绘制）不用 transform/blur/will-change——那些会把词提成
      // 合成层，配合父级 background-clip:text 渐变字在 Chrome 留旧帧残影（真机两轮反馈）；
      // top 动画不产生层缓存，动效在、残影无。word 的 position:relative 由 CSS 提供。
      await word.animate([
        { opacity: 1, top: "0px" },
        { opacity: 0, top: "-6px" }
      ], { duration: 300, easing: ease, fill: "forwards" }).finished;
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      await word.animate([
        { opacity: 0, top: "6px" },
        { opacity: 1, top: "0px" }
      ], { duration: 320, easing: ease, fill: "forwards" }).finished;
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } catch (_) {
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } finally {
      helloAnimating = false;
    }
  }
  function rotateTitleWord() {
    if (!helloTitle || welcome.style.display === "none") return;
    const word = helloTitle.querySelector(".rotating-word");
    if (!word) { setRotatingTitle(helloWords[helloIndex]); return; }
    if (forceFullscreenMotion && typeof word.animate === "function") {
      rotateTitleWordForWindows(word);
      return;
    }
    word.classList.add("out");
    window.setTimeout(() => {
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      word.classList.remove("out");
      word.classList.add("in");
      requestAnimationFrame(() => word.classList.remove("in"));
    }, reduceMotion ? 0 : 300);
  }
  function startRotatingTitle() {
    setRotatingTitle(helloWords[helloIndex]);
    if (reduceMotion) return;
    if (helloTimer) window.clearTimeout(helloTimer);
    if (!forceFullscreenMotion) {
      helloTimer = window.setInterval(rotateTitleWord, 2000);
      return;
    }
    const tick = () => {
      rotateTitleWord();
      helloTimer = window.setTimeout(tick, 2000);
    };
    helloTimer = window.setTimeout(tick, 2000);
  }
  function renderTurnIndex(activeId) {
    turnIndex?.classList.toggle("show", turns.length > 0);
    if (turnDots) turnDots.innerHTML = turns.map(t => `<i class="${t.id === activeId ? "active" : ""}"></i>`).join("");
    if (turnList) turnList.innerHTML = turns.map(t => `<button type="button" class="${t.id === activeId ? "active" : ""}" data-target="${escapeAttr(t.id)}" title="${escapeAttr(t.text)}">${escapeHtml(shortText(t.text, 18))}</button>`).join("");
  }
  function lxfdEnterHuman() {
    chatState.human = true;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body"><b>专属客服小联</b> 已为您接入人工服务，下方已切换为客服快捷入口。订单、售后、发票问题可直接发我。（演示：由乐享 AI 以专属客服身份接待）</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    if (quick) { quick.innerHTML = ["退出人工", "我的订单", "售后服务", "评价服务", "需求清单"].map(t => '<button type="button">' + escapeHtml(t) + '</button>').join(""); quick.style.display = ""; }
    if (ta) { if (!ta.dataset.origPh) ta.dataset.origPh = ta.placeholder; ta.placeholder = "向专属客服小联提问..."; }
  }

  function lxfdExitHuman() {
    chatState.human = false;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">已退出人工服务，继续由联想乐享 AI 为您服务。</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    lxfdApplySite();
    // 退出客服后若仍在聊天态则继续隐藏 actionbar
    if (chatState.started && quick) quick.style.display = "none";
    if (ta && ta.dataset.origPh) ta.placeholder = ta.dataset.origPh;
  }

  function lxfdSetGalleryChatting(on) {
    stage?.classList.toggle("is-chatting", !!on);
    syncRailNewFabVisibility();
  }

  function resetConversation(collapseRail) {
    window.__lxRecommendationFollowups?.clear();
    lxfdPersistCurrent();
    // 先归档旧会话，再锁定当前会话为空；刷新/卸载期间不得由旧 DOM 回写。
    try {
      localStorage.setItem("lexiang.newChatEmpty.v1", "1");
      localStorage.removeItem("lexiang.conversation.v1");
    } catch (_e) {}
    chatState.conversationNonce += 1;
    chatState.convId = null;
    chatState.localId = null;
    chatState.sending = false;
    chatState.human = false;
    chatState.started = false; // 新建对话回到欢迎态，恢复 actionbar
    // 当前会话已重置，避免顶部标题从上一轮共享缓存中恢复。
    try { localStorage.removeItem("lexiang.conversation.v1"); } catch (_e) {}
    if (thread) { thread.innerHTML = ""; thread.classList.remove("show"); }
    turns = [];
    renderTurnIndex("");
    if (welcome) welcome.style.display = "flex";
    // 根路径新建对话=回到初始首页态：把 prepaint 标记类加回来（分屏桥接时被摘掉），
    // 否则整套「空白态」规则失效——topbar 露出、左侧 fab 复现、右上冒出「收起」按钮（真机反馈）
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    if (logicalPath === "/") {
      document.documentElement.classList.add("lx-root-lxfd-prepaint");
      document.body.classList.remove("lx-home-split", "lxfd-split-entered", "assistant-fullscreen", "lx-auto-fs");
      window.__LXFD_FORCE = true;
    }
    lxfdSetGalleryChatting(false);
    if (convoName) { convoName.textContent = "新对话"; convoName.title = "新对话"; }
    if (window.__lxSyncTopNavTitle) window.__lxSyncTopNavTitle();
    if (ta) { if (ta.dataset.origPh) ta.placeholder = ta.dataset.origPh; ta.value = ""; fit(); syncSend(); }
    // 从历史侧栏点击“新建对话”后，无论当前 PC 视口宽度，都收起历史目录；
    // 同步写入手动收起状态，避免随后的 resize / viewport 同步再次自动展开。
    if (collapseRail) setRailManual(false);
    // 恢复 actionbar（lxfdApplySite 会重渲内容）
    if (quick) { quick.style.display = ""; lxfdApplySite(); }
    ta?.focus();
    lxfdRenderHist();
  }
  function renderLxfdProducts(products, options = {}) {
    if (!Array.isArray(products) || !products.length) return "";
    const couponProduct = window.__lxCouponCenter?.productsCoupon(products);
    const educationProduct = window.__lxEducationOffers?.isProducts(products);
    const first = products[0] || {};
    const recoId = "lxfd-reco-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    window.__lxRecoPayloads = window.__lxRecoPayloads || {};
    window.__lxRecoPayloads[recoId] = products;
    // 同步持久化（与主面板 lxReadRecoPayload 同一 key）：桥接导出的历史恢复后 CTA 仍可取回商品
    try {
      const key = "lexiang.recoPayloads.v1";
      const store = JSON.parse(localStorage.getItem(key) || "[]");
      store.push({ id: recoId, products: products.slice(0, educationProduct || couponProduct ? 12 : 8).map((p) => ({ sku: p.sku, name: p.name, price: p.price, image_url: p.image_url || p.image, specs: p.specs, description: (p.description || "").slice(0, 400) })) });
      localStorage.setItem(key, JSON.stringify(store.slice(-8)));
    } catch (_e) {}
    const isServiceProduct = !!options.serviceProduct;
    const desc = couponProduct
      ? `已按券面范围整理 ${products.length} 款对应商品`
      : educationProduct
      ? `已为你整理 ${products.length} 款教育优惠商品`
      : isServiceProduct
      ? `已为你推荐 ${products.length} 款服务商品`
      : products.length === 1
      ? `${escapeHtml(first.name || "按你的需求筛选出的商品")}${first.price ? ` · ${money(first.price)}` : ""}`
      : `已为你筛选 ${products.length} 款候选商品`;
    return `<button class="answer-cta lx-answer-reco" type="button" data-lxfd-reveal-products="1" data-lxfd-reco-id="${escapeHtml(recoId)}">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${couponProduct ? "查看优惠券可用商品" : educationProduct ? "查看教育优惠商品" : isServiceProduct ? "查看推荐服务商品" : "查看推荐商品"}</span>
        <span class="answer-cta-desc">${desc}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>${!couponProduct&&!educationProduct&&!isServiceProduct?(window.__lxRecommendationFollowups?.render(recoId)||""):""}`;
  }

  function lxfdPageCtaMeta(op) {
    const key = String(op || "");
    const map = {
      edu: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      open_edu_zone: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      open_solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      open_stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      open_member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      open_coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      points: { feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" },
      vouchers: { feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" },
      redpacket: { feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" },
      cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      open_cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_documents: { feature: "documents", title: "查看文档解读", desc: "已为你打开资料中心与文档列表" }
    };
    return map[key] || null;
  }

  function renderLxfdPageCta(meta) {
    if (!meta) return "";
    const resultIds = { solution: "info:solution", member: "info:member", devices: "info:devices", coupon: "info:coupon", points: "info:points", vouchers: "info:vouchers", redpacket: "info:redpacket", documents: "documents", edu: "info:edu", cart: "info:cart", orders: "info:orders" };
    const resultId = meta.resultId || resultIds[meta.feature] || "";
    const resultAttr = resultId ? ` data-lx-result-id="${escapeAttr(resultId)}" data-lx-open-tab="${escapeAttr(resultId)}" aria-pressed="false"` : "";
    return `<button class="answer-cta lx-answer-page" type="button" data-lx-focus-active="1" data-lxfd-open-feature="${escapeHtml(meta.feature || "")}"${resultAttr} aria-label="${escapeAttr(meta.title || "查看页面")}，展开左右框架" title="展开左右框架">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${escapeHtml(meta.title || "查看页面")}</span>
        <span class="answer-cta-desc">${escapeHtml(meta.desc || "已在右侧为你打开相关内容")}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function renderLxfdLeadCta() {
    return '<div class="lx-p0-actions answer-actions"><button class="lx-p0-btn primary" type="button" data-floor-action="lead">提交项目需求</button></div>';
  }

  // 只看 page==="home" 会漏：上一轮分屏残留 page="personal" 时再进全屏、退出走到这里，
  // 分屏类没补上 → 无全屏类也无分屏类的中间态（topbar 露出、lxfd 消息裸奔黑三角，或者背景
  // 停在首页欢迎态门户，聊天消息虽已在DOM里但不可见——件2代买桥接真机截图就踩到了这个）。
  // 无论根首页还是四个频道，从全屏卡片收起前都必须先恢复左右结构。
  // 旧逻辑只处理 URL=/：当目标 Tab 已被关闭或缓存中尚未登记时，卡片会走
  // lxfdRevealFeature 兜底；子频道因没有补分屏类，最终只剩右侧独立页面。
  function lxfdEnsureRootSplitState() {
    // 这是“最终态提交”而不是仅缺类时补一次。全屏进入/首页守卫可能在动画窗口内
    // 写回 lx-root-home 或移除 split；每次调用都重放主应用唯一的分屏归一化函数。
    if (typeof window.__lxBridge?.prepareRootSplitState === "function") {
      window.__lxBridge.prepareRootSplitState();
    } else if (!document.body.classList.contains("lx-home-split")) {
        document.documentElement.classList.remove("lx-root-lxfd-prepaint");
        document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lxfd-entering", "lx-root-home");
        document.body.classList.add("lx-home-split", "lxfd-split-entered");
        document.body.dataset.page = "personal";
        document.body.dataset.state = "chat";
        window.__LXFD_FORCE = false;
        const _lxfdLayer = document.querySelector(".lxfd");
        if (_lxfdLayer) { _lxfdLayer.style.display = ""; _lxfdLayer.style.visibility = ""; }
    }
  }

  // 全屏消息会先导回主面板。结果卡收起后优先点击导回的同一张卡，
  // 让主面板唯一的结果路由器负责 Tab 激活、关闭后重建和内容恢复。
  function lxfdReplayImportedResultCard(target) {
    const cards = Array.from(document.querySelectorAll(".lx-p0-messages .answer-cta"));
    const hit = cards.slice().reverse().find((card) => {
      if (target.resultId && card.getAttribute("data-lx-result-id") === target.resultId) return true;
      if (target.boundTabId && card.getAttribute("data-lx-open-tab") === target.boundTabId) return true;
      if (target.solutionTitle && card.getAttribute("data-specific-solution-cta") === target.solutionTitle) return true;
      if (target.recoId && card.getAttribute("data-lxfd-reco-id") === target.recoId) return true;
      if (target.openProduct && card.getAttribute("data-open-product") === target.openProduct) return true;
      return !!target.feature && card.getAttribute("data-lxfd-open-feature") === target.feature;
    });
    if (!hit) return false;
    hit.click();
    return true;
  }

  function lxfdRevealFeature(feature) {
    lxfdEnsureRootSplitState();
    if (String(feature).startsWith("member-coupon-center:")) {
      window.__lxOpenCouponCenter?.(String(feature).split(":")[1]);
      return;
    }

    if (typeof window.__lxOpenFeature === "function") window.__lxOpenFeature(feature);
  }

  function lxfdOpenFeatureInSplit(feature) {
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (!inFullscreen) {
      lxfdRevealFeature(feature);
      return;
    }
    lxfdExportToMain();
    exitFullscreen(() => {
      lxfdRevealFeature(feature);
      if (thread) thread.innerHTML = "";
    });
  }

  async function lxfdRunHomeCommerceEntry(kind) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    // 这条“全屏生成 → 结果卡 → 左右结构”链路只属于根首页。
    // 子频道即使误调用，也立即回退到其原有商务入口，不改变频道交互。
    if (logicalPath !== "/") {
      return window.lxOpenCommerceEntry?.(kind, { sendQuery: true });
    }
    if (chatState.sending) return;

    const isOrders = kind === "orders";
    const query = isOrders ? "查看我的订单" : "查看我的购物车";
    const feature = isOrders ? "orders" : "cart";
    const reply = isOrders
      ? "已为你整理近期**订单状态**、商品与服务信息，可继续查看物流、详情及售后入口。"
      : "已为你整理**购物车商品**、优惠与结算信息，可继续核对选中商品并完成结算。";
    const meta = lxfdPageCtaMeta(isOrders ? "open_orders" : "open_cart");

    chatState.sending = true;
    chatState.started = true;
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    if (quick) quick.style.display = "none";
    thread?.classList.add("show");

    const turnId = `turn-home-${feature}-${Date.now()}`;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = query;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: query });
    renderTurnIndex(turnId);

    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

    try {
      // 严格串行：正文逐字完成后才挂结果卡；结果卡完成布局后才退出全屏并创建右页。
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, reply)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body && meta) body.insertAdjacentHTML("beforeend", renderLxfdPageCta(meta));
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
      lxfdPersistCurrent();
      lxfdExportToMain();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
      exitFullscreenWithReveal(() => lxfdRevealFeature(feature));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}
  window.__lxfdRunHomeCommerceEntry = lxfdRunHomeCommerceEntry;

  function appendLxfdSuggestions(ai, suggestions) {
    const list = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    if (!list.length) return;
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => {
      if (!ai.contains(el)) el.remove();
    });
    ai.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    const host = ai.querySelector(".lxfd-ai-body") || ai;
    host.insertAdjacentHTML("beforeend", `<div class="lxfd-followups">${list.map((sug) => `<button type="button">${escapeHtml(sug)}</button>`).join("")}</div>`);
    // 件2 F1：追问chip常在答案打字动画收尾之后才异步插入，插入前 thread 已经滚到"答案末尾"，
    // 新增内容会落在可视区之下点不到——插入后补一次滚底（对称主面板的 lxAppendAiHtml 滚动逻辑）
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdClaimTicketSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4 2 2 0 0 0 0-4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 2"/></svg>';
  }

  function lxfdClaimCheckSvg(width) {
    return window.__lxApprovedIcon("global-check", width ? "ck" : "");
  }

  function lxfdClaimInfoFromCard(card) {
    const productName = (card && card.dataset && card.dataset.claimProduct) || (card && card.querySelector(".t2") && card.querySelector(".t2").textContent.trim()) || "商品";
    const chips = Array.prototype.slice.call(card ? card.querySelectorAll(".chip") : []);
    const claimed = chips.map(function(chip) {
      const amount = Number((chip.dataset && chip.dataset.claimAmount) || String((chip.querySelector(".cv") || {}).textContent || "").replace(/[^0-9.]/g, "")) || 0;
      const label = (chip.dataset && chip.dataset.claimName) || String(chip.textContent || "").replace(/¥\s?[\d,]+(?:\.\d+)?/g, "").trim() || "优惠券";
      return { label: label, amount: amount };
    });
    const domTotal = String((card && card.querySelector(".done-amt") || {}).textContent || "").replace(/[^0-9.]/g, "");
    const totalSaved = Number((card && card.dataset && card.dataset.claimTotal) || domTotal) || claimed.reduce(function(sum, item) { return sum + Math.abs(Number(item.amount || 0)); }, 0);
    return { productName: productName, claimed: claimed, totalSaved: totalSaved };
  }

  function lxfdRenderClaimedStaticCard(info) {
    const offers = Array.isArray(info.claimed) ? info.claimed : [];
    const chips = offers.map(function(coupon) {
      const amount = Math.abs(Number(coupon.amount || 0));
      return '<span class="chip">' + lxfdClaimCheckSvg("3.2") + escapeHtml(coupon.label || "优惠券") + ' <span class="cv">¥' + amount.toLocaleString("zh-CN") + '</span></span>';
    }).join("");
    return '<div class="gc lx-claimed-skin" data-v="I" aria-disabled="true">'
      + '<div class="irow"><span class="ic">' + lxfdClaimTicketSvg() + '</span>'
      + '<span class="mid"><div class="t1">已领取 ' + offers.length + ' 项优惠 <span class="doneflag df">' + lxfdClaimCheckSvg("2.6") + '已领取</span></div>'
      + '<div class="t2">' + escapeHtml(info.productName || "商品") + ' · 已收进卡包</div></span>'
      + '<span class="sa">已省 ¥' + Math.abs(Number(info.totalSaved || 0)).toLocaleString("zh-CN") + '</span></div>'
      + '<div class="chips">' + chips + '</div></div>';
  }

  function lxfdArchiveClaimProgressCards(root) {
    (root || document).querySelectorAll('.cl[data-v="D"].lx-claim-skin').forEach(function(card) {
      card.outerHTML = lxfdRenderClaimedStaticCard(lxfdClaimInfoFromCard(card));
    });
  }

  function lxfdTypeNodes(sourceParent, targetParent, speed, done) {const __lxGenerationToken=window.__lxGeneration.capture();
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    const scroll = () => { if (thread) thread.scrollTop = thread.scrollHeight; };
    const moveCursor = (parent) => { cursor.remove(); parent.appendChild(cursor); scroll(); };
    const typeTextNode = (text, parent, next) => {
      const textNode = document.createTextNode("");
      let index = 0;
      parent.appendChild(textNode);
      moveCursor(parent);
      const tick = () => {
        textNode.nodeValue = String(text).slice(0, index);
        index += 1;
        if (index <= String(text).length) window.__lxGeneration.timeout(__lxGenerationToken,tick, speed);
        else next();
      };
      tick();
    };
    const typeChildList = (children, parent, next) => {
      let index = 0;
      const step = () => {
        if (index >= children.length) { next(); return; }
        typeNode(children[index], parent, () => { index += 1; step(); });
      };
      step();
    };
    const typeNode = (node, parent, next) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.nodeValue) { next(); return; }
        typeTextNode(node.nodeValue, parent, next);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) { next(); return; }
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      moveCursor(clone);
      typeChildList(Array.from(node.childNodes), clone, next);
    };
    targetParent.innerHTML = "";
    typeChildList(Array.from(sourceParent.childNodes), targetParent, () => {
      cursor.remove();
      scroll();
      if (done) done();
    });
  }

  // 生成阶段实时刷新时间线（件2，同 app.js lxRenderTraceLive 逻辑）：此时 .lxfd-ai-body
  // 里只有这一个结构，全量重绘最简单；lxfdAnimateFinal 收尾时会把 ai-body 整体替换掉，
  // 折叠态 HTML 随 finalHtml 一起进去，不依赖这里的实时 DOM。
  function lxfdRenderTraceLive(ai) {
    const body = ai && ai.querySelector && ai.querySelector(".lxfd-ai-body");
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    if (!body || !renderTrace) return;
    body.innerHTML = renderTrace(ai._traceLines, { collapsed: ai._traceCollapsed, foldable: ai._traceCollapsed, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 });
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdAnimateFinal(ai, rawText) {const __lxGenerationToken=window.__lxGeneration.capture();
    const body = ai?.querySelector(".lxfd-ai-body");
    if (!body) return Promise.resolve();
    // 收尾把时间线折叠态 HTML 拼进最终正文——本函数会整体替换 ai-body，生成阶段的实时 DOM
    // 保不住，得随最终 html 一起进去才能存档/恢复时保持折叠（同 app.js sendChat done 收尾）。
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const traceHtml = (ai && ai._traceLines && ai._traceLines.length && renderTrace)
      ? renderTrace(ai._traceLines, { collapsed: true, foldable: true, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 })
      : "";
    const html = traceHtml + mdLite(String(rawText || "").trim() || "我先为你整理好了相关内容。");
    ai.classList.add("lx-chat-skin");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      body.innerHTML = html;
      return Promise.resolve();
    }
    const loadingStarted = ai._loadingStarted || Date.now();
    if (!body.querySelector(".loading-line")) {
      body.innerHTML = '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div>';
    } else {
      const typing = body.querySelector(".loading-line .typing-text");
      if (typing) typing.textContent = "联想乐享正在生成中...";
    }
    return new Promise((resolve) => {
      const waitTime = Math.max(0, 5000 - (Date.now() - loadingStarted));
      window.__lxGeneration.timeout(__lxGenerationToken,() => {
        const source = document.createElement("div");
        source.innerHTML = html;
        lxfdTypeNodes(source, body, 18, () => {
          window.__lxGeneration.timeout(__lxGenerationToken,() => {
            body.innerHTML = html;
            if (thread) thread.scrollTop = thread.scrollHeight;
            resolve();
          }, 140);
        });
      }, waitTime);
    });
  }

  function lxfdFetchFollowups(question, answer) {
    const q = String(question || "").trim();
    const a = String(answer || "").trim().slice(0, 300);
    if (!q || !a) return Promise.resolve([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2200);
    return fetch("/api/leai/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, a }),
      signal: controller.signal
    }).then((r) => r.json()).then((d) => {
      window.clearTimeout(timer);
      return Array.isArray(d && d.questions) ? d.questions.filter(Boolean).slice(0, 3) : [];
    }).catch(() => {
      window.clearTimeout(timer);
      return [];
    });
  }

  // 答后「猜你想干」动作 chips：生成器收口 app-intent.actionChips（主/全屏共用一份，
  // 生成的句子被本地正则秒接闭环）；lxfdFill3 保证无论 LLM 追问成败都凑满 3 个（静态兜底）
  function lxfdActionChips(products) {
    return (window.__lxIntent && window.__lxIntent.actionChips) ? window.__lxIntent.actionChips(products) : [];
  }
  function lxfdFill3(arr) {
    const fb = (window.__lxIntent && window.__lxIntent.FOLLOWUP_FALLBACKS) || [];
    const out = [];
    (arr || []).concat(fb).forEach((x) => { if (x && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }

  const lxfdWait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const lxfdIsDocumentInsight = (text) => /(文档解读|解读.*文档|分析.*(?:文档|文件|PDF)|提炼.*(?:文档|文件)|核心结论.*关键数据)/i.test(String(text || ""));

  async function lxfdRunDocumentInsight() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._traceLines = [];
    ai._traceSkills = new Set(["Skill(文档解读)"]);
    ai.innerHTML = '<div class="lxfd-ai-body"><div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div></div>';
    thread?.appendChild(ai);
    chatState.sending = true;

    const body = ai.querySelector(".lxfd-ai-body");
    let showGenerating = true;
    const paintTrace = () => {
      if (!body) return;
      const trace = renderTrace
        ? renderTrace(ai._traceLines, { collapsed: false, foldable: false, skillCount: ai._traceSkills.size })
        : ai._traceLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
      const generating = showGenerating
        ? '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div>'
        : "";
      body.innerHTML = trace + generating;
      thread.scrollTop = thread.scrollHeight;
    };
    const pushTrace = async (line, delay, hideGenerating) => {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : delay)));
      if (hideGenerating) showGenerating = false;
      ai._traceLines.push(line);
      paintTrace();
    };

    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享正在判断", 1240, true)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("已判断：文档解读任务", 840)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("联想乐享官方 SKILL：正在调用 Skill(文档解读)", 1040)));
    await window.__lxGeneration.wait(__lxGenerationToken,(pushTrace("正在读取文档结构与正文", 1240)));

    const traceHtml = renderTrace
      ? renderTrace(ai._traceLines.concat(["已完成文档内容提取"]), { collapsed: true, foldable: true, skillCount: ai._traceSkills.size })
      : "";
    body.innerHTML = traceHtml;
    thread.scrollTop = thread.scrollHeight;
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 3000)));

    const answerHtml = '<p>我已读取文档内容，下面是重点解读。</p>'
      + '<h4>核心结论</h4><ul><li>文档围绕当前业务目标、实施路径与结果要求展开，主线清晰。</li><li>重点任务已拆分为可执行阶段，需继续确认责任人、时间节点和验收口径。</li></ul>'
      + '<h4>关键信息</h4><ul><li><strong>目标：</strong>统一信息口径，提升执行与协作效率。</li><li><strong>路径：</strong>按“准备—执行—验收—复盘”分阶段推进。</li><li><strong>交付：</strong>关键数据、任务清单与结果说明需保持可追溯。</li></ul>'
      + '<h4>待确认项</h4><ul><li>部分时间节点和负责人尚未明确，建议在正式执行前补齐。</li><li>涉及外部数据或政策的内容，建议再核对最新来源。</li></ul>';
    const extrasHtml = renderLxfdPageCta(lxfdPageCtaMeta("open_documents"))
      + '<div class="lxfd-followups"><button type="button">继续提取文档中的关键数据</button><button type="button">按章节生成详细摘要</button><button type="button">整理成可执行任务清单</button></div>';
    body.innerHTML = traceHtml;
    const answerSource = document.createElement("div");
    answerSource.innerHTML = answerHtml;
    const answerHost = document.createElement("div");
    answerHost.className = "lxfd-ai-text";
    body.appendChild(answerHost);
    if (reduceMotion) {
      answerHost.innerHTML = answerHtml;
    } else {
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => lxfdTypeNodes(answerSource, answerHost, 18, resolve))));
    }
    answerHost.insertAdjacentHTML("afterend", extrasHtml);
    chatState.sending = false;
    thread.scrollTop = thread.scrollHeight;
    lxfdPersistCurrent();
    lxfdRenderHist();
    window.__lxGeneration.timeout(__lxGenerationToken,() => lxfdOpenFeatureInSplit("documents"), reduceMotion ? 0 : 600);
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}



  function lxfdIsNearbyStoreQuery(text) {
    const value = String(text || "").trim();
    return value.length <= 24 && !/预约|库存|营业|电话|服务权益|导航/.test(value) && /附近门店|联想门店|门店查询|查.{0,4}门店|找.{0,4}门店|推荐.{0,4}门店|^(门店|实体店|体验店|专卖店)$/.test(value);
  }

  async function lxfdRunUnifiedStoreAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的门店需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(420)));
    ai._traceLines.push("已判断：需要查询当前位置附近的联想授权门店");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(520)));
    ai._traceSkills.add("Skill(附近门店查询)");
    ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(附近门店查询)");
    lxfdRenderTraceLive(ai);
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(760)));
    ai._traceLines[ai._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(附近门店查询) 已完成";
    lxfdRenderTraceLive(ai);
    const copy = "我已结合**当前位置**为你整理附近的**联想授权门店**，优先推荐距离较近、营业时间明确且支持产品体验、库存咨询和到店服务的门店。你可以先查看下方推荐，再到右侧比较**地址、营业状态与联系方式**，并按需发起**导航或预约**。";
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
    const body = ai.querySelector(".lxfd-ai-body");
    if (body) body.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "stores", title: "查看附近门店", desc: "已为你整理附近授权门店、距离与营业状态" }));
    lxfdPersistCurrent();
    await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
    chatState.sending = false;
    lxfdExportToMain();
    exitFullscreenWithReveal(() => lxfdRevealFeature("stores"));
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdEducationAuthKind(text) {
    const value = String(text || "").trim().replace(/[\s，,。.!！?？：:“”"'‘’]/g, "");
    if (!value || value.length > 160) return "";
    // Keep explicit opt-outs and product purchase/recommendation requests in their existing flows.
    if (/(?:不要|不用|无需|不想|不需要|取消|停止).{0,8}(?:教育|学生|教师|老师|师生|高考)/.test(value)) return "";
    if (/(?:推荐|对比|购买|选购|下单).{0,20}(?:商品|产品|机型|电脑|笔记本|平板)|待支付|生成订单/.test(value)) return "";
    const audience = /教育|学生|在校生|大学生|师生|教师|老师|高考/.test(value);
    const auth = /认证|认定|核验|教育认$/.test(value);
    const offer = /(?:教育|学生|在校生|大学生|师生|教师|老师|高考).{0,16}(?:特惠|优惠|折扣|打折|福利|权益|补贴)|(?:教育|学生|教师|师生)(?:专享|专属)?价/.test(value);
    if (!audience || (!auth && !offer)) return "";
    if (/高考/.test(value)) return "gaokao";
    if (/教师|老师/.test(value)) return "teacher";
    return "college";
  }

  function lxfdIsWorkplaceAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 36 && /职场|职场人|在职|工作|员工|企业职工/.test(value) && /认证|认定|核验|职场认$/.test(value);
  }

  function lxfdIsEnterpriseMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 48
      && /企业会员|企业身份|企业账户|企业采购负责人|企业认证/.test(value)
      && /认证|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseDiamondMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 56
      && /企业钻石会员|钻石企业会员|企业会员.{0,6}钻石/.test(value)
      && /认证|升级|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseLeadQuery(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 48) return false;
    const directLead = /^(?:我要|我想|帮我|现在)?(?:进行|提交|填写|办理|发起)?(?:企业|采购|项目)?留资(?:申请|信息|表单)?$/.test(value);
    const enterpriseIntent = /企业留资|企业咨询|采购留资|项目留资|提交(?:企业|采购|项目)需求|联系企业顾问|企业合作咨询/.test(value);
    return directLead || enterpriseIntent;
  }

  function lxfdEnterpriseLeadCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-enterprise-lead-reco" type="button" data-open-enterprise-lead data-lx-result-id="modal:enterprise-lead" aria-label="打开企业留资弹窗" aria-pressed="false"><span class="answer-cta-title">提交企业留资</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedEnterpriseLeadAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-auth-flow-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的企业留资需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push("已判断：需要进入企业采购需求留资流程");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = "Skill(企业采购需求留资)";
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = "提交**企业采购需求**后，联想企业顾问可结合采购规模、预算、应用场景与交付周期提供进一步支持。请准备**联系人、联系方式及需求说明**，提交前核对关键信息，后续沟通以企业顾问联系为准。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdEnterpriseLeadCard());
      const card = body?.querySelector(".lx-enterprise-lead-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.openLeadPanel?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  function lxfdAuthRecommendationCard(type, kind) {
    if (type === "enterprise" || type === "enterprise-diamond") {
      const label = type === "enterprise-diamond" ? "认证企业钻石会员" : "立即认证企业会员";
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-enterprise-auth-reco" type="button" data-open-enterprise-auth-modal ${type === "enterprise-diamond" ? 'data-enterprise-auth-kind="diamond"' : ""} data-lx-result-id="modal:enterprise-member-auth" aria-label="打开企业会员认证弹窗" aria-pressed="false"><span><span class="answer-cta-title">${label}</span></span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    if (type === "workplace") {
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-workplace-auth-reco" type="button" data-open-wpa data-lx-result-id="modal:workplace-auth" aria-label="打开职场身份认证弹窗" aria-pressed="false"><span class="answer-cta-title">职场认证</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    const label = kind === "gaokao" ? "高考生教育认证" : (kind === "teacher" ? "教师教育认证" : "教育认证");
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco" type="button" data-open-stuauth="${escapeAttr(kind)}" data-lx-result-id="modal:education-auth:${escapeAttr(kind)}" aria-label="打开${escapeAttr(label)}弹窗" aria-pressed="false"><span class="answer-cta-title">${escapeHtml(label)}</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  function lxfdIsDiscountOrderQuery(text) {
    const value = String(text || "").trim();
    return /(?:领取|使用).{0,8}(?:全部|所有|可用)?.{0,8}优惠|(?:全部|所有|可用).{0,8}优惠.{0,8}(?:下单|订单)|待支付订单/.test(value) && /购买|下单|订单|支付/.test(value);
  }

  function lxfdPaymentRecommendationCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-payment-confirm-reco" type="button" data-open-payment-confirm data-lx-result-id="modal:pending-payment" aria-label="打开待支付订单弹窗" aria-pressed="false"><span class="answer-cta-title">待支付订单</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedDiscountOrderAnswer() {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const product = window.__lxState?._pendingDiscountOrderProduct || window.__lxState?.currentProduct;
    if (!product || !window.__lxAgentAPI?.lxPreparePendingPayment) {
      const ai = document.createElement("div");
      ai.className = "lxfd-msg-ai lx-chat-skin";
      ai.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, "请先打开一款商品详情，我再为你领取全部可用优惠并生成待支付订单。")));
      return;
    }
    chatState.sending = true;
    const prepared = window.__lxAgentAPI.lxPreparePendingPayment(product);
    const claimed = Array.isArray(prepared?.claimed) ? prepared.claimed : [];
    const item = prepared?.item || product;
    const saved = Math.abs(Number(prepared?.discount) || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-payment-confirm-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的优惠下单需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(`已判断：需要核对${item.name || "当前商品"}与当前账户可用优惠`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      ai._traceSkills.add("Skill(优惠领取与订单生成)");
      ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(优惠领取与订单生成)");
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：已自动领取全部 ${claimed.length} 项可用优惠`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = claimed.length
        ? `已为你自动领取**${claimed.length}项可用优惠**，共节省¥${saved}。商品、优惠与收货信息已核对，请在**待支付订单**中确认后继续。`
        : "当前商品暂无可叠加优惠，已按现价生成订单。商品与收货信息已核对，请在**待支付订单**中确认后继续。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdPaymentRecommendationCard());
      const card = body?.querySelector(".lx-payment-confirm-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunUnifiedAuthAnswer(type, kind = "college") {const __lxGenerationToken=window.__lxGeneration.capture();try{
    chatState.sending = true;
    const isWorkplace = type === "workplace";
    const isDiamond = type === "enterprise-diamond";
    const isEnterprise = type === "enterprise" || isDiamond;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now();
    ai._traceLines = [isDiamond ? "联想乐享正在判断你的企业钻石会员升级需求" : (isEnterprise ? "联想乐享正在判断你的企业会员认证需求" : (isWorkplace ? "联想乐享正在判断你的职场认证需求" : "联想乐享正在判断你的教育认证需求"))];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      ai._traceLines.push(isDiamond ? "已判断：需要进入企业钻石会员升级认证流程" : (isEnterprise ? "已判断：需要进入企业采购负责人认证流程" : (isWorkplace ? "已判断：需要进入企业在职身份认证流程" : "已判断：需要进入教育身份认证流程")));
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      const skillName = isDiamond ? "Skill(企业钻石会员升级认证)" : (isEnterprise ? "Skill(企业会员身份认证)" : (isWorkplace ? "Skill(职场身份认证)" : "Skill(教育身份认证)"));
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = isDiamond
        ? "完成**企业钻石会员升级认证**后，可进一步解锁企业专享采购权益、专属服务与会员支持。请准备**企业名称、统一社会信用代码及企业邮箱**，提交后以正式核验结果为准。"
        : isEnterprise
        ? "完成**企业会员认证**后，可解锁企业专享价、采购补贴、对公付款及专票账期等权益。请准备企业名称、统一社会信用代码及企业邮箱，提交后以正式核验结果为准。"
        : isWorkplace
        ? "**职场认证**可用于核验企业在职身份，并解锁员工购机优惠、会员权益及相关服务。请按真实情况填写个人与企业资料，提交前核对**企业信息与在职材料**，认证结果以正式身份核验信息为准。"
        : "**教育特惠**面向在校生、教师及高考生，完成**教育身份认证**后，可解锁教育专属价格与相关会员权益。\n\n请在弹窗中选择真实身份与认证方式，填写学校等资料，核对**材料与有效期**后提交。你也可点击下方小卡重新打开认证，结果以正式核验为准。";
      ai.classList.add("lx-auth-flow-answer");
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, copy)));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard(type, kind));
      const card = body?.querySelector(".lx-edu-auth-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => {
        if (!card || reduceMotion) { window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.__lxGeneration.timeout(__lxGenerationToken,done, 700);
      })));
      if (isDiamond) window.__lxOpenEnterpriseDiamondUpgradeModal?.();
      else if (isEnterprise) window.__lxOpenEnterpriseAuthModal?.();
      else if (isWorkplace) window.openWorkplaceAuth?.();
      else window.__lxAgentAPI?.openStudentAuth?.(kind);
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      chatState.sending = false;
      lxfdPersistCurrent();
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  async function lxfdRunEnterpriseAuthQuery(value) {
    const token = window.__lxGeneration.capture();
    const generation = window.__lxGeneration;
    const data = {copy:window.__lxEnterpriseAuthQuery.copy};
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now() - 5000;
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    try {
      await generation.wait(token, lxfdAnimateFinal(ai, data.copy));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) {
        body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard("enterprise"));
        body.querySelector('[data-open-enterprise-auth-modal]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await generation.wait(token, lxfdWait(reduceMotion ? 0 : 720));
      if (!generation.current(token)) return;
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        if (!generation.current(token)) return;
        lxfdEnsureRootSplitState();
        window.__lxOpenEnterpriseAuthModal();
      });
    } finally {
      if (generation.current(token)) {
        chatState.sending = false;
        syncSend();
      }
    }
  }

  async function lxfdRunMemberCouponCenter(value) {
    const token = window.__lxGeneration.capture();
    const generation = window.__lxGeneration;
    const data = window.__lxCouponCenter.describe(value);
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now() - 5000;
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    try {
      await generation.wait(token, lxfdAnimateFinal(ai, data.copy));
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) {
        body.insertAdjacentHTML("beforeend", renderLxfdPageCta({
          feature: "member-coupon-center:" + data.category,
          resultId: "info:member-coupon-center",
          title: "查看会员领券中心",
          desc: data.desc
        }));
        body.querySelector('[data-lx-result-id="info:member-coupon-center"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await generation.wait(token, lxfdWait(reduceMotion ? 0 : 720));
      if (!generation.current(token)) return;
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        if (!generation.current(token)) return;
        lxfdEnsureRootSplitState();
        window.__lxOpenCouponCenter(data.category);
      });
    } finally {
      if (generation.current(token)) {
        chatState.sending = false;
        syncSend();
      }
    }
  }

  async function lxfdRunSolutionAnswer(industry = "") {
    const __lxGenerationToken = window.__lxGeneration.capture();
        let scoped = industry ? window.__lxIndustrySolutions.describe(industry) : null;
        const solutionNonce = chatState.conversationNonce;
        chatState.sending = true;
        try {
        const solutionAi = document.createElement("div");
        solutionAi.className = "lxfd-msg-ai";
        solutionAi._loadingStarted = Date.now();
        solutionAi._traceLines = ["联想乐享正在判断"];
        solutionAi._traceSkills = new Set();
        solutionAi._traceCollapsed = false;
        solutionAi.innerHTML = '<div class="lxfd-ai-body"></div>';
        thread?.appendChild(solutionAi);
        lxfdRenderTraceLive(solutionAi);
        solutionAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
        solutionAi._traceLines.push("已判断："+(scoped?scoped.title:"全集解决方案")+"检索任务");
        lxfdRenderTraceLive(solutionAi);
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 680)));
        solutionAi._traceSkills.add("Skill(解决方案推荐)");
        solutionAi._traceLines.push(scoped?"正在调用 Skill(解决方案推荐)":"联想乐享官方 SKILL：正在调用 Skill(解决方案推荐)");
        lxfdRenderTraceLive(solutionAi);
        if (scoped) scoped = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxIndustrySolutions.run(industry)));
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
        if (solutionNonce !== chatState.conversationNonce) { solutionAi.remove(); return; }
        solutionAi._traceLines.push("已完成：行业方案全集与分类楼层已生成");
        solutionAi._traceCollapsed = true;
        lxfdRenderTraceLive(solutionAi);

        const solutionCopy = scoped ? scoped.copy : [
          "我已为你汇总**乐享全集解决方案**，覆盖教育、医疗、政府、制造、金融、能源、交通和服务八大行业。",
          "每个行业都按照**独立楼层**组织，并结合核心业务场景、终端部署、基础设施与持续服务，方便你快速浏览和比较。",
          "你可以进入全集后**按行业标签定位**；当前视口会在每个楼层单排自适应展示 4–6 个方案。"
        ].join("\n\n");
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(solutionAi, solutionCopy)));
        if (solutionNonce !== chatState.conversationNonce) return;
        const solutionMeta = scoped ? {feature:scoped.feature,resultId:scoped.tabId,title:scoped.cardTitle,desc:scoped.desc} : lxfdPageCtaMeta("open_solution");
        const solutionBody = solutionAi.querySelector(".lxfd-ai-body");
        if (solutionBody && solutionMeta) {
          solutionBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(solutionMeta));
          const solutionCard = solutionBody.querySelector('.answer-cta');
          if (solutionCard) {
            solutionCard.classList.add("is-active");
            solutionCard.setAttribute("aria-pressed", "true");
          }
        }
        lxfdPersistCurrent();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
        lxfdExportToMain();
        if (solutionNonce !== chatState.conversationNonce) return;
        exitFullscreenWithReveal(() => { if (solutionNonce === chatState.conversationNonce) lxfdRevealFeature(scoped ? scoped.feature : "solution"); });
        } finally {if(window.__lxGeneration.current(__lxGenerationToken)){ if (solutionNonce === chatState.conversationNonce) chatState.sending = false; }}
  }

  async function lxfdRunCouponProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxCouponCenter.runProducts({query,token,
      
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(优惠券解读与可用商品)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'优惠券可用商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function lxfdRunCompareDisplayQuery(query) {
  const token=window.__lxGeneration.capture();let ai;
  return window.__lxComparisonDisplay.run(query,{token,
    busy:active=>{chatState.sending=active;syncSend();},
    answer:async text=>{
      if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
      await lxfdAnimateFinal(ai,text);
    },
    save:()=>window.__lxfdPersistCurrentNow?.()
  });
}
async function lxfdRunServiceProductsQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxServiceProducts.run({query,token,
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(服务商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products,{serviceProduct:true}));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.setAttribute('data-lx-service-products-card','1');card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'推荐服务商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

async function lxfdRunEducationOfferQuery(query) {
    const token = window.__lxGeneration.capture(); let ai;
    return window.__lxEducationOffers.run({query,token,
      authenticate:kind=>lfxdRunUnifiedAuthAnswer('education',kind),
      busy:active=>{chatState.sending=active;syncSend();},
      trace:(lines,complete)=>{
        if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}
        ai._traceLines=lines;ai._traceSkills=new Set(['Skill(教育优惠商品推荐)']);ai._traceCollapsed=complete;lxfdRenderTraceLive(ai);
      },
      answer:async text=>{if(!ai){ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);}await lxfdAnimateFinal(ai,text);},
      card:products=>{chatState.lastProducts=products;const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
      open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'教育优惠商品',recoId}));},
      save:()=>window.__lxfdPersistCurrentNow?.()
    });
  }

  async function submit(text) {const __lxGenerationToken=window.__lxGeneration.capture();try{
    const value = String(text || "").trim();
    if (!value || chatState.sending) return;
    if (window.__lxPageCommandV150 && await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxPageCommandV150(value, {
      reset: () => { resetConversation(true); window.__lxBridge?.resetConversationContext(); },
      reply: async (message) => {
        setNav(false);chatState.started=true;setFullscreen(true);lxfdSetGalleryChatting(true);
        if(welcome)welcome.style.display='none';thread?.classList.add('show');
        const user=document.createElement('div');user.className='lxfd-msg-user';user.id='turn-'+Date.now();user.textContent=value;thread?.appendChild(user);
        turns.push({id:user.id,text:value});renderTurnIndex(user.id);
        if(ta){ta.value='';fit();syncSend();}
        const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(ai);
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai,message)));lxfdPersistCurrent();lxfdExportToMain();
      }
    })))) return;

    if (typeof window.__lxRequireQueryAccess === "function" && !window.__lxRequireQueryAccess()) return;
    // 用户真正发出下一条消息后，新会话成立，恢复正常持久化。
    try { localStorage.removeItem("lexiang.newChatEmpty.v1"); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}
    // 发送问题时强制收起顶部灵动岛，保持与首页项目一致的紧凑标题态：
    // 「首页：当前问题 + 下拉箭头」。避免用户刚操作过导航时把整排频道带进对话态。
    setNav(false);
    convoPill?.blur();
    // 本轮桥接状态（全屏→分屏）
    let turnProducts = null;
    let turnTitle = "";
    let turnGrouped = false;
    let turnActions = []; // 本轮意图操作（action 事件带来的 op）——多意图一轮可能来多个（门店+优惠+会员），全记录，桥接后全开
    let pendingExtras = "";
    let pendingFollowups = [];
    let finalized = false;
    let finalizePromise = null;
    lxfdArchiveClaimProgressCards(thread);
    try { window.__lxHideSuggest && window.__lxHideSuggest(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');} // 发送即收起输入联想浮层（程序性清空不触发 input，不收会残留）
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    // 开始聊天后隐藏 actionbar（对齐官方；客服模式下 enterHuman 会恢复）
    if (!chatState.started && !chatState.human) {
      chatState.started = true;
      if (quick) quick.style.display = "none";
    }
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    thread?.classList.add("show");
    if (convoName) { convoName.textContent = shortText(value, 15); convoName.title = value; }
    // 全屏欢迎态首问=新对话：thread 还没有任何消息（非历史恢复/非分屏回流）说明用户从初始
    // 首页重新开聊，清掉主面板 boot 时 restore 的旧对话上下文，首问不背"以上为历史对话"的
    // 旧账（真机反馈）；旧对话在侧栏历史归档里可找回。
    if (thread && !thread.querySelector(".lxfd-msg-user, .lxfd-msg-ai")) {
      chatState.convId = null;
      if (window.__lxBridge && typeof window.__lxBridge.resetConversationContext === "function") window.__lxBridge.resetConversationContext();
    }
    const turnId = "turn-" + Date.now() + "-" + turns.length;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = value;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: value });
    renderTurnIndex(turnId);
    window.__lxRecommendationFollowups?.consume(value);
    if (ta) { ta.value = ""; fit(); syncSend(); }
    // 发出提问就先存一次（含 lxfd key + 同步子站 key），AI 答完再存完整——避免答得慢时切站啥都没存
    try { lxfdPersistCurrent(); } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');}

    if (window.__lxEnterpriseAuthQuery?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,lxfdRunEnterpriseAuthQuery(value));
      return;
    }

    if (window.__lxComparisonDisplay?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCompareDisplayQuery(value));
      return;
    }

    if (window.__lxServiceProducts?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunServiceProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matchCouponQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunCouponProductsQuery(value));
      return;
    }

    if (window.__lxCouponCenter?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunMemberCouponCenter(value));
      return;
    }

    if (window.__lxEducationOffers?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunEducationOfferQuery(value));
      return;
    }

    const educationAuthKind = lxfdEducationAuthKind(value);
    if (educationAuthKind) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunUnifiedAuthAnswer("education", educationAuthKind));
      return;
    }

    const solutionQuery = window.__lxIntent?.matchSolution(value);
    if (solutionQuery) {
      await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(solutionQuery.industry || ""));
      return;
    }

    if (window.__lxCustomerServiceQuery?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxCustomerServiceQuery.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{
          const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';
          ai._loadingStarted=Date.now()-5000;ai.innerHTML='<div class="lxfd-ai-body"></div>';
          thread?.appendChild(ai);await lxfdAnimateFinal(ai,text);return ai;
        },
        card:(ai,html)=>{ai.querySelector('.lxfd-ai-body')?.insertAdjacentHTML('beforeend',html);ai.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'end'});},
        save:()=>lxfdPersistCurrent()
      }));
      return;
    }

    if (window.__lxQueryResults?.matches(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,window.__lxQueryResults.run({
        query:value,token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        create:skill=>{const ai=document.createElement('div');ai.className='lxfd-msg-ai lx-chat-skin';ai._loadingStarted=Date.now();ai.innerHTML='<div class="lxfd-ai-body"></div>';ai._traceLines=['正在调用 Skill('+skill+')'];ai._traceSkills=new Set();ai._traceCollapsed=false;thread?.appendChild(ai);lxfdRenderTraceLive(ai);return ai;},
        answer:async(ai,text,skill,status,success=true)=>{ai._traceLines=[status];ai._traceSkills=success?new Set([skill]):new Set();ai._traceCollapsed=true;await lxfdAnimateFinal(ai,text);},
        card:(ai,meta)=>{const body=ai.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdPageCta({resultId:meta.resultId,title:meta.title,desc:meta.desc}));return body.querySelector('[data-lx-result-id="'+meta.resultId+'"]');},
        reveal:commit=>{lxfdPersistCurrent();lxfdExitToResultAtomically(commit);},
        save:()=>{if(thread?.querySelector('.lxfd-msg-ai'))lxfdPersistCurrent();else window.__lxSaveConversationNow?.();}
      }));
      return;
    }

    if (window.__lxGamingQuery?.matches(value)) {
      let gamingAi;
      await window.__lxGeneration.wait(__lxGenerationToken, window.__lxGamingQuery.run({
        token:__lxGenerationToken,
        busy:active=>{chatState.sending=active;syncSend();},
        answer:async text=>{gamingAi=document.createElement('div');gamingAi.className='lxfd-msg-ai lx-chat-skin';gamingAi._loadingStarted=Date.now()-5000;gamingAi.innerHTML='<div class="lxfd-ai-body"></div>';thread?.appendChild(gamingAi);await lxfdAnimateFinal(gamingAi,text);},
        card:products=>{chatState.lastProducts=products;const body=gamingAi.querySelector('.lxfd-ai-body');body.insertAdjacentHTML('beforeend',renderLxfdProducts(products));const card=body.querySelector('[data-lxfd-reco-id]');const id=card?.getAttribute('data-lxfd-reco-id')||'';card?.setAttribute('data-lx-result-id','reco:'+id);card?.classList.add('lx-document-card-enter');return id;},
        open:(products,recoId)=>{window.__lxfdPersistCurrentNow?.();window.__lxfdExitWithReveal(()=>window.__lxBridge?.revealProducts?.(products,{title:'为你推荐',recoId}));},
        save:()=>window.__lxfdPersistCurrentNow?.()
      }));
      return;
    }

    if (lxfdIsDiscountOrderQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedDiscountOrderAnswer()));
      return;
    }
    if (lxfdIsEnterpriseLeadQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedEnterpriseLeadAnswer()));
      return;
    }
    if (lxfdIsWorkplaceAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("workplace")));
      return;
    }
    if (lxfdIsEnterpriseDiamondMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise-diamond")));
      return;
    }
    if (lxfdIsEnterpriseMemberAuthQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedAuthAnswer("enterprise")));
      return;
    }

    const serviceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    if (serviceProductFollowup) {
      chatState.sending = true;
      const products = typeof window.__lxServiceRecommendationProducts === "function" ? window.__lxServiceRecommendationProducts() : [];
      const region = (value.match(/所在地区是(.+?)，请推荐/) || [])[1] || "当前地区";
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      try {
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, `已按“拯救者游戏本 + **${region}** + **深度清灰/换硅脂**”匹配服务商品。你可以比较服务内容、适用性与预约方式。`)));
        const body = serviceAi.querySelector(".lxfd-ai-body");
        if (body) body.insertAdjacentHTML("beforeend", renderLxfdProducts(products, { serviceProduct: true }));
        const card = body?.querySelector("[data-lxfd-reco-id]");
        const recoId = card?.getAttribute("data-lxfd-reco-id") || "";
        await window.__lxGeneration.wait(__lxGenerationToken,(new Promise((resolve) => window.__lxGeneration.frame(__lxGenerationToken,() => window.__lxGeneration.frame(__lxGenerationToken,resolve)))));
        lxfdPersistCurrent();
        lxfdExportToMain();
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 560)));
        exitFullscreenWithReveal(() => window.__lxBridge?.revealProducts?.(products, { title: "推荐服务产品", recoId }));
      } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
        chatState.sending = false;
      }}
      return;
    }

    if (/^我的设备[。！!]?$/.test(value)) {
      chatState.sending = true;
      const deviceAi = document.createElement("div");
      deviceAi.className = "lxfd-msg-ai lx-chat-skin lx-device-query-answer";
      deviceAi._loadingStarted = Date.now();
      deviceAi._traceLines = ["联想乐享正在判断你的设备资产需求"];
      deviceAi._traceSkills = new Set();
      deviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(deviceAi);
      lxfdRenderTraceLive(deviceAi);
      deviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      deviceAi._traceLines.push("已判断：需要查询当前 Lenovo ID 下的设备资产");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      deviceAi._traceSkills.add("Skill(设备资产查询)");
      deviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(设备资产查询)");
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      deviceAi._traceLines[deviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(设备资产查询) 已完成";
      deviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(deviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(deviceAi, "当前账号共有**8 台已绑定设备**，另有**1 台待绑定**。最近使用的是 ThinkBook 16p、拯救者 Y7000P、YOGA Air 14s；右侧已打开设备列表。")));
      const deviceBody = deviceAi.querySelector(".lxfd-ai-body");
      if (deviceBody) deviceBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "devices", title: "查看我的设备", desc: "8 台已绑定 · 1 台待绑定" }));
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        lxfdEnsureRootSplitState();
        if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
        else lxfdRevealFeature("devices");
      });
      return;
    }

    if (lxfdIsNearbyStoreQuery(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunUnifiedStoreAnswer()));
      return;
    }

    if (typeof window.__lxIsServiceIntakeQuery === "function" ? window.__lxIsServiceIntakeQuery(value) : /清灰|除尘|换硅脂|散热保养/.test(value)) {
      chatState.sending = true;
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi._loadingStarted = Date.now();
      serviceAi._traceLines = ["联想乐享正在判断你的设备服务需求"];
      serviceAi._traceSkills = new Set();
      serviceAi._traceCollapsed = false;
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      lxfdRenderTraceLive(serviceAi);
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 420)));
      serviceAi._traceLines.push("已判断：清灰/换硅脂服务商品匹配");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 520)));
      serviceAi._traceSkills.add("Skill(服务产品推荐)");
      serviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(服务产品推荐)");
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 760)));
      serviceAi._traceLines[serviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(服务产品推荐) 已完成";
      serviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(serviceAi);
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(serviceAi, "已经明确是**清灰/换硅脂服务**。还需要确认**目标设备和所在地区**，才能匹配可购买、可预约的服务商品。")));
      const serviceBody = serviceAi.querySelector(".lxfd-ai-body");
      const choices = window.__lxServiceIntake && window.__lxServiceIntake.renderChoices ? window.__lxServiceIntake.renderChoices() : "";
      if (serviceBody && choices) serviceBody.insertAdjacentHTML("beforeend", choices);
      lxfdPersistCurrent();
      lxfdRenderHist();
      chatState.sending = false;
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      return;
    }

    if (/代金券/.test(value)) {
      chatState.sending = true;
      const voucherAi = document.createElement("div");
      voucherAi.className = "lxfd-msg-ai";
      voucherAi._loadingStarted = Date.now() - 5000;
      voucherAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(voucherAi);
      voucherAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(voucherAi, "已为你查询当前账户的**代金券资产**：共有 2 张可用券，分别适用于教育认证与以旧换新场景。你可以继续查看券面金额、适用范围和使用条件。")));
      const voucherBody = voucherAi.querySelector(".lxfd-ai-body");
      if (voucherBody) {
        voucherBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" }));
        voucherBody.querySelector('[data-lx-result-id="info:vouchers"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("vouchers"));
      return;
    }

    if (/限时红包|会员日红包|首发红包/.test(value)) {
      chatState.sending = true;
      const redPacketAi = document.createElement("div");
      redPacketAi.className = "lxfd-msg-ai";
      redPacketAi._loadingStarted = Date.now() - 5000;
      redPacketAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(redPacketAi);
      redPacketAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(redPacketAi, "已为你查询当前账户的**限时红包资产**：现有 2 个红包，合计 ¥84，其中 1 个将在明日到期。你可以继续查看适用活动、有效期与使用范围。")));
      const redPacketBody = redPacketAi.querySelector(".lxfd-ai-body");
      if (redPacketBody) {
        redPacketBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" }));
        redPacketBody.querySelector('[data-lx-result-id="info:redpacket"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("redpacket"));
      return;
    }

    if (/优惠券/.test(value)) {
      chatState.sending = true;
      const couponAi = document.createElement("div");
      couponAi.className = "lxfd-msg-ai";
      couponAi._loadingStarted = Date.now() - 5000;
      couponAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(couponAi);
      couponAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(couponAi, "已为你查询当前账户的**优惠券资产**：共有 3 张可用券，其中 1 张将在 7 天后到期。你可以查看每张券的使用门槛、适用范围和有效期。")));
      const couponBody = couponAi.querySelector(".lxfd-ai-body");
      if (couponBody) {
        couponBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" }));
        couponBody.querySelector('[data-lx-result-id="info:coupon"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("coupon"));
      return;
    }

    if (/乐豆|积分余额|乐豆余额/.test(value)) {
      chatState.sending = true;
      const pointsAi = document.createElement("div");
      pointsAi.className = "lxfd-msg-ai";
      pointsAi._loadingStarted = Date.now() - 5000;
      pointsAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(pointsAi);
      pointsAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(pointsAi, "已为你查询当前账户的**乐豆资产**：现有 2,580 乐豆，近 30 天获得 860、使用 300。你可以继续查看获取与使用记录，以及当前适用规则。")));
      const pointsBody = pointsAi.querySelector(".lxfd-ai-body");
      if (pointsBody) {
        pointsBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" }));
        pointsBody.querySelector('[data-lx-result-id="info:points"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("points"));
      return;
    }

    if (/会员/.test(value)) {
      chatState.sending = true;
      const profile = typeof window.__lxMemberQueryProfile === "function"
        ? window.__lxMemberQueryProfile()
        : { copy: "当前为**铂金会员**，乐豆余额**8,860豆**，可用于抵现和兑换好礼；等级权益、任务与会员活动已为你整理。", cardDesc: "会员等级 · 乐豆 · 权益与任务" };
      const memberAi = document.createElement("div");
      memberAi.className = "lxfd-msg-ai";
      memberAi._loadingStarted = Date.now() - 5000;
      memberAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(memberAi);
      memberAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(memberAi, profile.copy)));
      const memberBody = memberAi.querySelector(".lxfd-ai-body");
      if (memberBody) {
        memberBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "member", title: "查看会员中心", desc: profile.cardDesc }));
        memberBody.querySelector('[data-lx-result-id="info:member"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdWait(reduceMotion ? 0 : 720)));
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("member"));
      return;
    }

    // 文档解读是全屏对话内的生成任务，不走 open_documents 页面跳转快路径。
    if (lxfdIsDocumentInsight(value)) {
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdRunDocumentInsight()));
      return;
    }

    // ── lxfd 意图路由分流 ──────────────────────────────────────────────
    // 0. 全权代买（多步任务链）意图：只做标记，不再立即退全屏（真机反馈：还没开始推流就切左右
    //    结构，右侧只有个光秃秃商城首页很突兀）。改为和普通提问一致——留在全屏走官方流式，
    //    用户看完整推荐回答；done 桥接分屏时才起链（officialWait 直接给已到手的商品，链 step1
    //    秒过），「对比→选款→下单」的执行视图在有内容可看时才出现。
    const _lxfdServiceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    const _lxfdAutoBuy = !_lxfdServiceProductFollowup && window.__lxIntent && window.__lxIntent.matchAutoBuy ? window.__lxIntent.matchAutoBuy(value) : null;

    // 1. 本地快路径（正则统一收口 app-intent.js，主面板/全屏共用一份，改一处两边同时生效）
    // 代买时跳过：句里"对比/下单"字样会被误判成 control 操作抢断官方推荐流（同主面板 _autoBuy 防护）
    const _lxfdLocalCtrl = !_lxfdAutoBuy && window.__lxIntent ? window.__lxIntent.matchControl(value) : null;
    if (_lxfdLocalCtrl) {
      if (_lxfdLocalCtrl.op === "open_solution") {
        await window.__lxGeneration.wait(__lxGenerationToken, lxfdRunSolutionAnswer(_lxfdLocalCtrl.industry || ""));
        return;
      }
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      _lxfdCtrlText.textContent = _lxfdLocalCtrl.msg;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      // 执行操作：通过 __lxExecControl 桥（全屏态 lxExecControl 不在此作用域）
      const _execOp = _lxfdLocalCtrl.op;
      const _execTarget = _lxfdLocalCtrl.target;
      const _execPageMeta = lxfdPageCtaMeta(_execOp);
      if (_execPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_execPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_execPageMeta.feature);
        });
        return;
      }
      if (_execOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_execOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_execOp, _execTarget);
      }
      return;
    }

    // 思考过程时间线（件2）：气泡必须在远程意图路由 fetch **之前**上屏——路由最长 4.5s，
    // 放在后面用户盯着空白（真机反馈）。首行"正在判断"发送瞬间出现，"已判断"等路由分流
    // 落定再追加（走 control 分支时整个气泡移除）。渲染复用主面板 renderSkillTrace 桥接。
    const _traceLines = ["联想乐享正在判断"]; // 省略号由 .current::after 三点循环动画补，文本不写死
    const _renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = `<div class="lxfd-ai-body">${_renderTrace ? _renderTrace(_traceLines, { collapsed: false, foldable: false, skillCount: 0 }) : ""}</div>`;
    ai._raw = "";
    ai._loadingStarted = Date.now();
    ai._traceLines = _traceLines;
    ai._traceSkills = new Set();
    ai._traceCollapsed = false;
    ai._traceLastRaw = "";
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    const _lxfdPushJudged = () => {
      if (ai._judgedPushed) return;
      ai._judgedPushed = true;
      _traceLines.push(_lxfdAutoBuy ? "已判断：多步代买任务，推荐完成后进入执行视图" : "已判断：商品咨询 → 调用联想乐享官方 SKILL");
      lxfdRenderTraceLive(ai);
    };

    // 2. 远程意图路由器（代买时跳过：分类器可能把"选/下单"误判成 control 操作抢断推荐流，同主面板）
    let _lxfdIntentResult = null;
    if (!_lxfdAutoBuy) try {
      const _lxfdIntentAbort = new AbortController();
      const _lxfdIntentTimer = window.__lxGeneration.timeout(__lxGenerationToken,() => _lxfdIntentAbort.abort(), 4500);
      const _lxfdIntentRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: _lxfdIntentAbort.signal
      })));
      clearTimeout(_lxfdIntentTimer);
      if (_lxfdIntentRes.ok) _lxfdIntentResult = await window.__lxGeneration.wait(__lxGenerationToken,(_lxfdIntentRes.json()));
    } catch (_lxfdIntentErr) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError'); /* 超时/失败 → 降级 chat */ }
    if (_lxfdIntentResult && _lxfdIntentResult.type === "control" && _lxfdIntentResult.op) {
      ai.remove(); // 操作指令：撤掉"正在判断"时间线气泡，走操作确认消息（同主面板做法）
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      const _lxfdOpNames = { close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面", open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询", open_edu_zone: "打开了教育专区", open_documents: "打开了文档解读与资料中心", open_product: `正在帮你打开「${_lxfdIntentResult.target || "该商品"}」`, enter_fullscreen: "切换到全屏对话模式（当前已在全屏）", exit_fullscreen: "退出了全屏模式" };
      _lxfdCtrlText.textContent = `好的，已为你${_lxfdOpNames[_lxfdIntentResult.op] || "执行了操作"}。`;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      const _lxfdExecOp = _lxfdIntentResult.op;
      const _lxfdExecTarget = _lxfdIntentResult.target || "";
      const _lxfdPageMeta = lxfdPageCtaMeta(_lxfdExecOp);
      if (_lxfdPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_lxfdPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_lxfdPageMeta.feature);
        });
        return;
      }
      if (_lxfdExecOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_lxfdExecOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_lxfdExecOp, _lxfdExecTarget);
      }
      return;
    }
    // ── lxfd 意图路由分流结束 ─────────────────────────────────────────

    // 走到这里说明不是操作指令：补"已判断"行——意图路由刚落定，天然有 0.5~4.5s 节奏，
    // 不和首行同帧蹦出；代买跳过了意图路由没有天然节奏，给 500ms 微延迟（同主面板做法）。
    if (_lxfdAutoBuy) window.__lxGeneration.timeout(__lxGenerationToken,_lxfdPushJudged, 500); else _lxfdPushJudged();
    const body = ai.querySelector(".lxfd-ai-body");
    const nonce = chatState.conversationNonce;
    chatState.sending = true;
    let hasContent = false;
    const revealAi = () => {
      if (hasContent) return;
      hasContent = true;
      body?.querySelector(".lxfd-typing, .loading-line")?.remove();
      ai._textBox = document.createElement("div");
      ai._textBox.className = "lxfd-ai-text";
      if (body) body.insertBefore(ai._textBox, body.firstChild);
      ai._raw = "";
      ai._writer = window.__lxCreateTypewriter(ai._textBox, {
        charsPerTick: 1,
        interval: 24,
        scroll: () => {
          if (thread) thread.scrollTop = thread.scrollHeight;
        }
      });
    };
    // lxfd 前端兜底超时：50秒后强制解锁
    const _lxfdSendTimeout = window.__lxGeneration.timeout(__lxGenerationToken,() => {
      if (chatState.sending && chatState.conversationNonce === nonce) {
        chatState.sending = false;
        ai._raw = "响应超时，请重试。";
        lxfdAnimateFinal(ai, ai._raw);
      }
    }, 50000);
    try {
      chatState._fallbackFired = false;
      // 代买句剥成交短语再发官方（「直接下单」会触发官方下单 Skill 不回商品清单），收口 app-intent 与主面板共用
      const _lxfdAskText = _lxfdAutoBuy && window.__lxIntent && window.__lxIntent.stripPurchasePhrase
        ? window.__lxIntent.stripPurchasePhrase(value)
        : value;
      const sendMsg = chatState.human
        ? ('[系统提示: 请以"专属客服小联"身份回复, 像人工客服一样亲切自然简短直接, 不用 markdown/列表/标题, 不暴露 AI 身份, 严禁输出"QA对""知识库""参考资料"等内部字样或📎等标记。]\n\n用户问: ' + value)
        : _lxfdAskText;
      const lxfdImgUrl = window.__lxfdPendingImage || undefined;
      window.__lxfdPendingImage = null;
      const imgTipEl = document.querySelector('.lxfd-img-tip');
      if (imgTipEl) imgTipEl.remove();
      const lxfdUseHuoshan = !!lxfdImgUrl || !!window.__lxWebSearch;
      const response = lxfdUseHuoshan
        ? await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              image_url: lxfdImgUrl,
              web_search: !!window.__lxWebSearch,
              thinking_mode: !!window.__lxThinking,
              conv_id: chatState.convId || undefined
            })
          })))
        : await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,"/api/leai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              sessionId: chatState.convId || undefined,
              site: document.body.dataset.page || 'personal',
              enableThinking: !!window.__lxThinking,
              ...(window.__lxGeo || {})
            })
          })));
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      // 首页全屏对话兜底：官方流偶发只回文字、缺少 products/display 事件。
      // 仅商品推荐意图补齐 6 款，避免普通问答误开商品页；服务商品仍走专用事件与数据源。
      const lxfdEnsureProductFallback = async () => {
        if ((turnProducts && turnProducts.length) || _lxfdServiceProductFollowup) return;
        const isProductRecommendation = /(?:推荐|想买|购买|选购|挑选|换一台|换个).*(?:商品|电脑|笔记本|台式机|工作站|一体机|主机|游戏本)|(?:商品|电脑|笔记本|台式机|工作站|一体机|主机|游戏本).*(?:推荐|怎么选|选哪|买哪|哪个好)/i.test(value);
        if (!isProductRecommendation) return;
        try {
          const res = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,`/api/products?site=${encodeURIComponent(document.body.dataset.page || 'personal')}`, { cache: 'no-store' })));
          const payload = res.ok ? await window.__lxGeneration.wait(__lxGenerationToken,(res.json())) : [];
          const products = Array.isArray(payload) ? payload.slice(0, 6) : [];
          if (!products.length) return;
          turnProducts = products;
          turnTitle = 'AI 推荐';
          turnGrouped = false;
          chatState.lastProducts = products;
          chatState.lastProductsMeta = { title: turnTitle, grouped: turnGrouped };
          pendingExtras += renderLxfdProducts(products);
        } catch (error) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
          console.error('[lxfd] 商品推荐兜底失败:', error);
        }
      };
      const lxfdHandlers = {
        chunk: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          const content = payload.text || data || "";
          if (/^\s*params\s*error\.?\s*$/i.test(content)) return;
          if (!content) return;
          // 首个 chunk 到达：思考过程时间线收起成一行摘要条，把舞台让给正文（同主面板）
          if (!ai._traceCollapsed) { ai._traceCollapsed = true; lxfdRenderTraceLive(ai); }
          hasContent = true;
          ai._raw += content;
        },
        status: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
          if (payload.text) {
            const raw = String(payload.text);
            if (raw !== ai._traceLastRaw) { // 去重相邻重复（官方 status 流常见连续重复 ping）
              ai._traceLastRaw = raw;
              const skillMatch = raw.match(/^(正在获取数据|已获取数据):(Skill\(.+\))$/);
              let line = raw;
              if (skillMatch) {
                ai._traceSkills.add(skillMatch[2]);
                line = skillMatch[1] === "正在获取数据"
                  ? `联想乐享官方 SKILL：正在调用 ${skillMatch[2]}`
                  : `联想乐享官方 SKILL：${skillMatch[2]} 已完成`;
              }
              ai._traceLines.push(line);
              lxfdRenderTraceLive(ai);
            }
          }
        },
        products: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (!/(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i.test(String(value || ""))) return;
          const payload = parseJson(data);
          let products = payload.products || [];
          // 用户点名要N款(2-6)而官方固定回5-6款 → 按要求截断
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (!products.length) return;
          hasContent = true;
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品以便 done 时桥接到主面板
          turnProducts = products;
          chatState.lastProducts = products;
          chatState.lastProductsMeta = { title: "AI 推荐", grouped: false };
        },
        display: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (!/(?:商品|产品|电脑|笔记本|轻薄本|游戏本|台式机|一体机|平板|主机|工作站|服务器|显示器|打印机|手机|耳机|鼠标|键盘|YOGA|ThinkPad|ThinkBook|拯救者|小新|昭阳|开天|问天|机型|型号|配置|显卡|处理器|内存|硬盘|购机|选购|购买|下单|买一|买台|买个|价格|价位|以旧换新|国补|对比.*(?:商品|产品|电脑|笔记本|机型|型号)|比较.*(?:商品|产品|电脑|笔记本|机型|型号)|推荐.*(?:商品|产品|电脑|笔记本|机型|型号)|(?:商品|产品|电脑|笔记本|机型|型号).*推荐|哪[个款台部].*(?:好|值得|适合)|(?:电脑|笔记本|商品|产品).*(?:怎么选|如何选))/i.test(String(value || ""))) return;
          const payload = parseJson(data);
          let products = payload.products || payload.items || [];
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (products.length || payload.title) hasContent = true;
          if (payload.title && !ai._raw) {
            ai._raw = payload.title;
          }
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品及展示元信息以便 done 时桥接到主面板
          if (products.length) {
            turnProducts = products;
            turnTitle = payload.title || "";
            turnGrouped = !!payload.grouped;
            chatState.lastProducts = products;
            chatState.lastProductsMeta = { title: turnTitle, grouped: turnGrouped };
          }
        },
        clicks: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const list = (parseJson(data).clicks) || [];
          if (!list.length || !body) return;
          pendingExtras += '<div class="leai-clicks" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + list.map((c) =>
            `<button type="button" class="leai-click-btn" data-leai-url="${escapeAttr(c.link_url || "")}" data-leai-cb="${escapeAttr(c.callback_data || "")}" data-leai-event="${escapeAttr(c.event_type || "")}">${escapeHtml(c.display_text)}</button>`
          ).join("") + "</div>";
        },
        suggestions: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          pendingFollowups = (payload.suggestions || []).filter(Boolean).slice(0, 3);
        },
        action: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const { op } = parseJson(data) || {};
          const pageMeta = lxfdPageCtaMeta(op);
          if (pageMeta) {
            if (pageMeta.feature === "solution") pendingExtras += renderLxfdLeadCta();
            pendingExtras += renderLxfdPageCta(pageMeta);
            if (turnActions.indexOf(pageMeta.feature) < 0) turnActions.push(pageMeta.feature);
          } else if (op === 'auth') {
            // 职场认证与教育认证统一使用标准结果卡，点击后直接打开认证弹窗。
            pendingExtras += `<button class="answer-cta lx-answer-page lx-auth-answer-card" type="button" data-open-wpa aria-label="打开职场身份认证弹窗">
              <span class="answer-cta-copy">
                <span class="answer-cta-title">职场身份认证</span>
                <span class="answer-cta-desc">认证后享购机优惠、AI 资源与专属权益</span>
              </span>
              <span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span>
            </button>`;
          } else if (op) {
            if (turnActions.indexOf(op) < 0) turnActions.push(op); // 记录意图，done 时桥接后再执行（全屏下直接开标签会被遮盖）
          }
        },
        control: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data) || {};
          // 页面操作（关标签/回首页/开订单等）：桥接到主面板执行
          if (payload.op && typeof window.__lxExecControl === 'function') window.__lxExecControl(payload.op, payload.target);
        },
        done: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (finalized) return;
          finalized = true;
          finalizePromise = (async () => {
            window.clearTimeout(_lxfdSendTimeout);
            await window.__lxGeneration.wait(__lxGenerationToken,(lxfdEnsureProductFallback()));
            const payload = parseJson(data);
            if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
            await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
            const finalBody = ai.querySelector(".lxfd-ai-body");
            if (pendingExtras && finalBody) { finalBody.insertAdjacentHTML("beforeend", pendingExtras); if (thread) thread.scrollTop = thread.scrollHeight; }
            if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
            pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
            if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
            lxfdPersistCurrent();
            lxfdRenderHist();
            const isFullscreen = document.body.classList.contains("assistant-fullscreen");
            // 代买任务：推荐回答已在全屏展示完，此刻才切执行视图起链（真机反馈：不能一发问就分屏）。
            // officialWait 直接给已到手的商品，链 step1 秒过进入「对比→选款→下单」。
            if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // 链卡走裸 addMessage，需先补分屏布局（老坑：不补则背景停在欢迎门户，链卡在 DOM 里看不见）
                if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
                window.__lxRunChain("auto_buy_official", {
                  maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
                  minPrice: _lxfdAutoBuy.params.minPrice || 0,
                  officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
                  rawText: value
                });
                if (thread) thread.innerHTML = "";
              });
            } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
              // 官方带回商品 → 自动桥接分屏右侧展示（所推即所见）；只有纯 action 无商品才走功能页桥接
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
                turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：门店/优惠/会员标签全开
                if (thread) thread.innerHTML = "";
              });
            } else if (turnActions.length && isFullscreen && window.__lxBridge) {
              // 本轮只有意图无商品：同样桥接退全屏，再开功能标签
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // lxfdRevealFeature 内部会先 lxfdEnsureRootSplitState 补首页分屏布局
                // （不做这步 .shell 仍 display:none → 功能标签渲染了但主面板隐藏=空白）
                turnActions.forEach((op) => lxfdRevealFeature(op));
                if (thread) thread.innerHTML = "";
              });
            }
          })();
        },
        fallback: async () => {
          if (nonce !== chatState.conversationNonce) return;
          if (chatState._fallbackFired) return;
          chatState._fallbackFired = true;
          try {
            const huoRes = await window.__lxGeneration.wait(__lxGenerationToken,(window.__lxGeneration.fetch(__lxGenerationToken,'/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: sendMsg, conv_id: chatState.convId || undefined })
            })));
            if (!huoRes.ok || !huoRes.body) throw new Error('fallback upstream ' + huoRes.status);
            await window.__lxGeneration.wait(__lxGenerationToken,(readSse(huoRes, lxfdHandlers)));
          } catch (_e) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
            ai._raw = '当前服务暂时不可用，请稍后再试。';
            if (!finalized) {
              finalized = true;
              finalizePromise = lxfdAnimateFinal(ai, ai._raw);
            }
          }
        }
      };
      await window.__lxGeneration.wait(__lxGenerationToken,(readSse(response, lxfdHandlers)));
      if (nonce !== chatState.conversationNonce) return;
      if (finalizePromise) {
        await window.__lxGeneration.wait(__lxGenerationToken,(finalizePromise));
      } else if (!finalized) {
        finalized = true;
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdEnsureProductFallback()));
        if (!hasContent && !ai._raw && !pendingExtras) {
          ai._raw = "我已经收到请求，可以继续补充预算、用途或偏好的机型。";
        }
        await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
        const finalBody = ai.querySelector(".lxfd-ai-body");
        if (pendingExtras && finalBody) finalBody.insertAdjacentHTML("beforeend", pendingExtras);
        if (!pendingFollowups.length) pendingFollowups = await window.__lxGeneration.wait(__lxGenerationToken,(lxfdFetchFollowups(value, ai._raw)));
        pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
        if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
        lxfdPersistCurrent();
        lxfdRenderHist();
        const isFullscreen = document.body.classList.contains("assistant-fullscreen");
        // 与上方 done 分支同一条规则：代买起链 > 有商品分屏展示 > 纯 action 功能页桥接。
        if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
            window.__lxRunChain("auto_buy_official", {
              maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
              minPrice: _lxfdAutoBuy.params.minPrice || 0,
              officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
              rawText: value
            });
            if (thread) thread.innerHTML = "";
          });
        } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
            turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：标签全开（同 done 分支）
            if (thread) thread.innerHTML = "";
          });
        } else if (turnActions.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            turnActions.forEach((op) => lxfdRevealFeature(op));
            if (thread) thread.innerHTML = "";
          });
        }
      }
    } catch (error) {if(!window.__lxGeneration.current(__lxGenerationToken))throw new DOMException('已停止生成','AbortError');
      console.error("[lxfd] submit 流程异常（此前静默吞掉，排障困难）:", error);
      if (nonce !== chatState.conversationNonce) return;
      ai._raw = "当前 AI 服务暂时不可用，请稍后重试。";
      await window.__lxGeneration.wait(__lxGenerationToken,(lxfdAnimateFinal(ai, ai._raw)));
    } finally {if(window.__lxGeneration.current(__lxGenerationToken)){
      clearTimeout(_lxfdSendTimeout);
      if (nonce === chatState.conversationNonce) chatState.sending = false;
      ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    }}
  }catch(__lxStopError){if(!window.__lxGeneration.current(__lxGenerationToken))return;throw __lxStopError;}}

  window.lxfdSubmit = submit;
  window.lxfdReset = resetConversation;
  // 分屏→全屏回退：关空右侧 tab 时带入主面板对话回全屏
  window.__lxfdEnterFromSplit = function() {
    if (thread) thread.innerHTML = "";
    enterFullscreen();  // enterFullscreen 内检测到 thread 空会自动 lxfdImportFromMain
  };
  // 新建对话回全屏欢迎态
  window.__lxfdNewFullscreen = function() {
    resetConversation(true);
    enterFullscreen();
  };

  convoPill?.addEventListener("click", () => setNav(!navCluster.classList.contains("open")));
  navCluster?.addEventListener("mouseenter", () => { clearTimeout(hoverTimer); });
  navCluster?.addEventListener("mouseleave", () => { clearTimeout(hoverTimer); setNav(false); });
  $$("#lxfdNavSheet a").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    $$("#lxfdNavSheet a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    setNav(false);
    const path = navPaths[a.dataset.page] || "/";
    const currentPath = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
    const targetPath = path.endsWith("/") ? path : `${path}/`;
    if (currentPath === targetPath) location.reload();
    else location.assign(path);
  }));
  document.addEventListener("click", (e) => { if (navCluster && !navCluster.contains(e.target)) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setNav(false); if (!wide()) setRailManual(false); } });
  railFab?.addEventListener("click", () => setRailManual(true));
  $("#lxfdRailClose")?.addEventListener("click", () => setRailManual(false));
  $(".lxfd-actions")?.addEventListener("click", (e) => {
    const accountAction = e.target.closest(".lxfd-account-menu [data-account-action]");
    if (accountAction) {
      const action = accountAction.dataset.accountAction || "";
      accountAction.closest(".lxfd-account-wrap")?.classList.remove("open");
      if (action === "member") {
        e.preventDefault();
        e.stopPropagation();
        submit("会员中心");
        return;
      }
    }
    const button = e.target.closest(".lxfd-ic");
    if (!button) return;
    const label = button.getAttribute("aria-label") || "";
    if (button.dataset.lxfdOpen === "cart" || label.includes("购物车")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("cart", { sendQuery: true });
      return;
    }
    if (button.dataset.lxfdOpen === "orders" || label.includes("订单")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("orders", { sendQuery: true });
      return;
    }
    // 首页空白态胶囊里的历史入口（必须在兜底 exitFullscreen 之前拦下）：
    // 开「历史记录」弹窗（与分屏同款），不拉左侧 rail（真机反馈）
    if (button.id === "lxfdTopHistBtn" || label.includes("历史")) {
      e.preventDefault();
      if (window.__lxBridge && typeof window.__lxBridge.openHistoryModal === "function") window.__lxBridge.openHistoryModal();
      else setRailManual(true);
      return;
    }
    e.preventDefault();
    exitFullscreen();
  });
  scrim?.addEventListener("click", () => setRailManual(false));
  function lxfdStartNewConversation(collapseRail) {
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    resetConversation(!!collapseRail);
    if (logicalPath !== "/") {
      // 子频道的全屏新建对话是“收起回当前频道新对话”，
      // 不是停留在全屏欢迎态。复用同一收起动画与主面板 reset 链路。
      exitFullscreenWithReveal(() => window.__lxBridge?.newConversationInCurrentChannel?.());
    }
  }
  $("#lxfdNewChat")?.addEventListener("click", () => lxfdStartNewConversation(true));
  // 全屏左侧悬浮“＋”与历史栏内“新建对话”必须是同一语义；此前这里只清空
  // lxfd thread，导致用户仍停在全屏而没有回到当前频道首页。
  railNewFab?.addEventListener("click", () => lxfdStartNewConversation(false));
  historySearch?.addEventListener("input", () => lxfdRenderHist(historySearch.value));
  $("#lxfdHist")?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-conv-item]");
    const action = e.target.closest(".lxfd-hist-action");
    if (action && item) {
      e.preventDefault();
      e.stopPropagation();
      const id = item.dataset.convItem;
      if (action.dataset.action === "delete" && !window.confirm("确认删除这条历史对话吗？")) return;
      lxfdUpdateConversation(id, action.dataset.action);
      return;
    }
    const a = e.target.closest("a[data-conv]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.conv) lxfdLoadConv(a.dataset.conv);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lxfd-hist-item")) return;
    $$(".lxfd-hist-item.menu-open").forEach(node => { node.classList.remove("menu-open"); node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openItem = $(".lxfd-hist-item.menu-open");
    if (!openItem) return;
    openItem.classList.remove("menu-open");
    const trigger = openItem.querySelector(".lxfd-hist-more");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  });
  $$(".lxfd-comp-left .lxfd-toggle").forEach(btn => btn.addEventListener("click", () => { const on = btn.classList.toggle("on"); btn.setAttribute("aria-pressed", on ? "true" : "false"); if (btn.textContent.includes("深度思考")) window.__lxThinking = on; if (btn.textContent.includes("联网")) window.__lxWebSearch = on; }));
  // lxfd 图片上传
  const lxfdImgBtn = document.querySelector('.lxfd-img-btn');
  if (lxfdImgBtn) {
    const lxfdFileInput = document.createElement('input');
    lxfdFileInput.type = 'file';
    lxfdFileInput.accept = 'image/*';
    lxfdFileInput.style.display = 'none';
    lxfdFileInput.id = 'lxfdFileInput';
    document.body.appendChild(lxfdFileInput);
    lxfdImgBtn.addEventListener('click', () => lxfdFileInput.click());
    lxfdFileInput.addEventListener('change', async () => {
      const file = lxfdFileInput.files && lxfdFileInput.files[0];
      if (!file) return;
      lxfdFileInput.value = '';
      try {
        lxfdImgBtn.disabled = true;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data && data.url) {
          window.__lxfdPendingImage = data.url;
          const dock = document.querySelector('.lxfd-dock');
          let imgTip = dock && dock.querySelector('.lxfd-img-tip');
          if (!imgTip && dock) {
            imgTip = document.createElement('div');
            imgTip.className = 'lxfd-img-tip';
            imgTip.style.cssText = 'font-size:12px;color:#979797;padding:4px 12px;display:flex;align-items:center;gap:6px';
            dock.insertBefore(imgTip, dock.querySelector('.lxfd-composer'));
          }
          if (imgTip) {
            imgTip.innerHTML = '<span>已添加图片</span><button type="button" style="border:none;background:none;cursor:pointer;color:#b8252e;font-size:12px" id="lxfdImgClear">×</button>';
            const clearBtn = imgTip.querySelector('#lxfdImgClear');
            if (clearBtn) clearBtn.addEventListener('click', () => { window.__lxfdPendingImage = null; imgTip.remove(); });
          }
        }
      } catch (_e) {
        // 上传失败静默处理
      } finally {
        lxfdImgBtn.disabled = false;
      }
    });
  }

  (function initLxfdHomeGallery() {
    const data = {
      new: [
        { nm: "拯救者 Y9000P 2026", ds: "i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏", price: "15,098", badge: "新品首发", wm: "LEGION Y9000P", img: "../img/lxfd-gallery-1-1.jpg", g: "linear-gradient(135deg,#252525,#4d144a 58%,#625b68)", q: "请解读这款商品：拯救者 Y9000P 2026，配置是 i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏，价格约 ¥15,098，适合什么人买？" },
        { nm: "YOGA Air 14c 2026", ds: "酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控", price: "8,999", badge: "轻薄旗舰", wm: "YOGA Air 14c", img: "../img/lxfd-gallery-1-2.jpg", g: "linear-gradient(135deg,#252525,#625b68 58%,#979797)", q: "请解读这款商品：YOGA Air 14c 2026，配置是酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控，价格约 ¥8,999，适合什么人买？" },
        { nm: "小新Pad Pro 13英寸", ds: "酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄", price: "7,299", badge: "全能之选", wm: "Xiaoxin Pro16", img: "../img/lxfd-gallery-1-3.jpg", g: "linear-gradient(135deg,#0c2342,#252525 58%,#48d39e)", q: "请解读这款商品：小新Pad Pro 13英寸，配置是酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄，价格约 ¥7,299，适合什么人买？" }
      ],
      act: [
        { nm: "618 年中钜惠", ds: "全场至高省 2000，下单再享 12 期免息", price: "省 2000", isText: true, badge: "限时", wm: "618 SALE", g: "linear-gradient(135deg,#252525,#b8252e 56%,#e42b20)", q: "618 年中钜惠有什么优惠？怎么参加？" },
        { nm: "教育优惠季", ds: "学生 / 教师认证，专属机型至高 9 折", price: "享 9 折", isText: true, badge: "进行中", wm: "EDU SEASON", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育优惠季怎么参加？学生认证有哪些优惠？" },
        { nm: "以旧换新", ds: "旧机抵扣 + 平台补贴，至高补 800 元", price: "补 800", isText: true, badge: "可叠加", wm: "TRADE-IN", g: "linear-gradient(135deg,#252525,#625b68 58%,#48d39e)", q: "以旧换新怎么操作？旧机能抵多少钱？" }
      ],
      news: [
        { nm: "联想 2026 拯救者全系发布", ds: "搭载新一代 AI 引擎与超频引擎，性能再进阶", price: "查看全文", isText: true, badge: "官方", wm: "PRESS", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#625b68)", q: "联想 2026 拯救者全系发布了哪些新品？有什么亮点？" },
        { nm: "联想 AI PC 出货领跑行业", ds: "IDC 最新报告：中国 AI PC 市场份额持续第一", price: "查看全文", isText: true, badge: "行业", wm: "INSIGHT", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "联想 AI PC 有哪些优势？为什么市场份额第一？" },
        { nm: "联想乐享门店破 5000 家", ds: "线下服务网络全面升级，到店体验更进一步", price: "查看全文", isText: true, badge: "动态", wm: "RETAIL", g: "linear-gradient(135deg,#252525,#625b68 58%,#bcb4c1)", q: "联想门店能提供哪些服务？帮我找附近门店。" }
      ],
      case: [
        { nm: "某重点高校机房方案", ds: "1200 台统一部署与运维，开机即用，集中管理", price: "教育行业", isText: true, badge: "已交付", wm: "CAMPUS", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育行业的机房统一部署方案是怎么做的？" },
        { nm: "设计工作室创作方案", ds: "ThinkStation + 校色屏整体方案，效率提升 40%", price: "创意设计", isText: true, badge: "标杆", wm: "STUDIO", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#a262d7)", q: "设计创作行业有什么整体方案？ThinkStation 怎么配？" },
        { nm: "连锁零售 POS 升级", ds: "300+ 门店终端统一焕新，稳定支撑高峰交易", price: "零售行业", isText: true, badge: "规模化", wm: "RETAIL POS", g: "linear-gradient(135deg,#252525,#5b1452 58%,#e42b20)", q: "连锁零售门店终端怎么统一升级？有什么方案？" }
      ]
    };
    const root = document.querySelector(".lxfd-home-gallery");
    const grid = document.getElementById("lxfdGalleryGrid");
    const tabs = Array.from(document.querySelectorAll("[data-gallery-tab]"));
    const ink = document.getElementById("lxfdGalleryInk");
    if (!root || !grid || !tabs.length) return;
    const price = (item) => item.isText ? escapeHtml(item.price) : "¥" + escapeHtml(item.price);
    const card = (item) => {
      const shotClass = item.img ? "gallery-shot has-image" : "gallery-shot";
      const inner = item.img
        ? '<img class="gallery-img" src="' + escapeAttr(item.img) + '" alt="" loading="eager" />'
        : '<span class="gallery-lid"></span><span class="gallery-wm">' + escapeHtml(item.wm) + '</span>';
      return '<article class="gallery-card is-preview-only" aria-disabled="true"><div class="' + shotClass + '" style="background:' + escapeAttr(item.g) + '">' + inner + '</div>'
        + '<div class="gallery-meta"><span class="gallery-badge">' + escapeHtml(item.badge) + '</span><strong class="gallery-name">' + escapeHtml(item.nm) + '</strong><span class="gallery-desc">' + escapeHtml(item.ds) + '</span>'
        + '<div class="gallery-foot"><span class="gallery-price">' + price(item) + '</span><span class="gallery-go" aria-hidden="true">了解 →</span></div></div></article>';
    };
    // 首页内容卡当前仅作预览：保留 CSS hover，点击与键盘操作均不发送对话。
    grid.addEventListener("click", (e) => {
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    const moveInk = () => {
      const active = root.querySelector(".gallery-tab.is-active");
      if (active && ink) {
        ink.style.left = active.offsetLeft + "px";
        ink.style.width = active.offsetWidth + "px";
      }
    };
    const render = (key, animate) => {
      if (!data[key]) key = "new";
      if (!animate) {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
        return;
      }
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
      }, 120);
    };
    const activateTab = (tab) => {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      moveInk();
      render(tab.dataset.galleryTab, true);
    };
    tabs.forEach((tab) => {
      tab.addEventListener("pointerenter", () => activateTab(tab));
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("focus", () => activateTab(tab));
    });
    render("new", false);
    requestAnimationFrame(moveInk);
    window.addEventListener("resize", moveInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  })();

  (function initLxfdScopeActions() {
    const scope = document.getElementById("lxfdScopeActions");
    const more = document.getElementById("lxfdScopeMore");
    const moreBtn = more?.querySelector(".lxfd-scope-more-btn");
    const close = () => {
      more?.classList.remove("open");
      moreBtn?.setAttribute("aria-expanded", "false");
    };
    if (scope) {
      scope.addEventListener("click", (event) => {
        const chip = event.target.closest(".lxfd-scope-chip");
        if (!chip) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        const label = chip.textContent.trim();
        if (!label) return;
        submit(LXFD_ACTION_Q[label] || label);
      });
    }
    if (more && moreBtn) {
      const open = () => {
        more.classList.add("open");
        moreBtn.setAttribute("aria-expanded", "true");
      };
      more.addEventListener("pointerenter", open);
      more.addEventListener("pointerleave", close);
      moreBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = !more.classList.contains("open");
        if (shouldOpen) open(); else close();
      });
      document.addEventListener("click", (event) => { if (!more.contains(event.target)) close(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }
  })();

  ta?.addEventListener("input", () => { fit(); syncSend(); });
  ta?.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(window.__lxRecommendationFollowups?.prepare(ta.value,ta) ?? ta.value); } });
  $("#lxfdComposer")?.addEventListener("submit", (e) => { e.preventDefault(); submit(window.__lxRecommendationFollowups?.prepare(ta.value,ta) ?? ta.value); });
  chips?.addEventListener("click", (e) => {
    const b = e.target.closest(".lxfd-chip-q");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    submit(b.dataset.q || b.textContent);
  });
  quick?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (b.textContent.trim() === "退出人工") { lxfdExitHuman(); return; }
    submit(LXFD_ACTION_Q[b.textContent.trim()] || b.textContent);
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd .answer-cta, .lxfd [data-lx-result-id], .lxfd [data-lxfd-reveal-products], .lxfd [data-lx-focus-reco], .lxfd [data-lxfd-open-feature], .lxfd [data-lx-focus-active], .lxfd [data-lx-open-tab], .lxfd [data-specific-solution-cta]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (btn.hasAttribute("data-open-enterprise-auth-modal") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-member-auth") {
      window.__lxOpenEnterpriseAuthModal?.();
      return;
    }
    if (btn.hasAttribute("data-open-enterprise-lead") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-lead") {
      window.openLeadPanel?.();
      return;
    }
    const studentAuthKind = btn.getAttribute("data-open-stuauth");
    if (studentAuthKind) {
      window.__lxAgentAPI?.openStudentAuth?.(studentAuthKind);
      return;
    }
    if (btn.hasAttribute("data-open-wpa")) {
      window.openWorkplaceAuth?.();
      return;
    }
    if (btn.hasAttribute("data-open-payment-confirm")) {
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
      return;
    }
    const feature = btn.getAttribute("data-lxfd-open-feature") || "";
    const boundTabId = btn.getAttribute("data-lx-open-tab") || "";
    const resultId = btn.getAttribute("data-lx-result-id") || "";
    const solutionTitle = btn.getAttribute("data-specific-solution-cta") || "";
    const recoId = btn.getAttribute("data-lxfd-reco-id") || "";
    const openProduct = btn.getAttribute("data-open-product") || "";
    const targetTabId = resultId || (solutionTitle
      ? `info:solution-detail:${solutionTitle}`
      : (boundTabId || (feature === "solution" ? "info:solution" : "")));
    const storedProducts = recoId && window.__lxRecoPayloads && Array.isArray(window.__lxRecoPayloads[recoId])
      ? window.__lxRecoPayloads[recoId]
      : [];
    const recoTab = (window.__lxState?.tabs || []).find((item) => item && (item.kind === "reco" || item.id === "reco") && Array.isArray(item.products) && item.products.length);
    const products = storedProducts.length
      ? storedProducts
      : ((chatState.lastProducts && chatState.lastProducts.length) ? chatState.lastProducts : (recoTab?.products || []));
    // 收起前先锁定卡片目标。分屏恢复后精确激活对应标签，不能再由 focusReco 猜测当前页。
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (inFullscreen) {
      const commitCapturedResult = () => {
        lxfdEnsureRootSplitState();
        if (window.__lxBridge?.restoreResultCard?.(btn)) return;
        if (targetTabId && window.__lxBridge?.restoreResultTab?.(targetTabId)) return;
        if (lfxdReplayImportedResultCard({ resultId, boundTabId, solutionTitle, recoId, openProduct, feature })) return;
        if (targetTabId && window.__lxBridge?.activateTab?.(targetTabId)) return;
        if (feature) lxfdRevealFeature(feature);
        else if (products.length) window.__lxBridge?.revealProducts?.(products, { title: "AI 推荐", recoId });
      };
      lxfdExitToResultAtomically(commitCapturedResult);
      return;
    }
    // 功能卡片在全屏态与左右分栏态都走同一入口；标签关闭后可重新创建。
    if (feature) {
      lxfdOpenFeatureInSplit(feature);
      return;
    }
    if (btn.hasAttribute("data-lx-focus-active") && !btn.hasAttribute("data-lx-focus-reco")) return;
  }, true);
  thread?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd-followups button, .lxfd-ai-body .followups button, .lxfd-ai-body .lx-p0-suggest[data-followups] button, .lxfd-ai-body [data-quick-ask]");
    if (!btn) return;
    e.preventDefault();
    const text = btn.getAttribute("data-quick-ask") || btn.textContent.replace(/→\s*$/, "").trim();
    if (text) submit(text);
  });
  turnList?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const target = document.getElementById(b.dataset.target); if (!target) return; renderTurnIndex(target.id); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); });
  window.addEventListener("resize", () => { if (document.body.classList.contains("assistant-fullscreen")) syncRailForViewport(); });

  // 职场认证按钮（lxfd 内的 data-open-wpa 委托）
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-wpa]")) {
      if (typeof window.openWorkplaceAuth === "function") window.openWorkplaceAuth();
    }
  });

  // 官方动作按钮（转人工/在线客服等）点击：human_access→进客服模式，有链接开新窗口，否则把 callback_data 当问题继续问
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-leai-url], [data-leai-cb]");
    if (!btn) return;
    e.preventDefault();
    const ev = btn.getAttribute("data-leai-event");
    if (ev === "human_access") {
      if (document.body.classList.contains("assistant-fullscreen")) {
        lxfdEnterHuman();
      } else if (typeof window.__lxSetHuman === "function") {
        window.__lxSetHuman(true);
      }
      return;
    }
    const url = btn.getAttribute("data-leai-url");
    const cb = btn.getAttribute("data-leai-cb");
    if (url) { window.open(url, "_blank", "noopener"); return; }
    if (cb && typeof window.lxfdSubmit === "function" && document.body.classList.contains("assistant-fullscreen")) window.lxfdSubmit(cb);
  });

  setTimeout(startRotatingTitle, reduceMotion ? 0 : 2000);
  syncSend();
  lxfdRenderHist();
  // P0 多频道会话互通：首页重新进入时，把共享主面板已恢复的完整会话导入全屏线程。
  if (window.__LX_TEMPLATE_PAGE === "home") {
    window.setTimeout(function () {
      if (!lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) return;
      lxfdImportFromMain();
      setFullscreen(true);
    }, 0);
  }

  document.addEventListener("click", (e) => {
    const fsToggle = e.target.closest(".assistant-toggle");
    if (fsToggle) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      enterFullscreen();
      return;
    }
    const heroChip = e.target.closest(".hero-suggestion");
    const fullPrompt = e.target.closest(".fullscreen-prompt");
    if (heroChip || fullPrompt) {
      const target = heroChip || fullPrompt;
      const text = (target.querySelector("span")?.textContent || target.textContent).trim();
      if (text) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(text); }
    }
  }, true);
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.(".hero-composer");
    if (!form) return;
    const txt = form.querySelector("textarea")?.value.trim() || form.querySelector("textarea")?.placeholder || "最近有什么优惠活动？";
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(txt);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("assistant-fullscreen")) requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();

};

/* public/leaip0/assets/frontend/js/core/app-lxfd.js */
window.__p0Modules.sources["u0b3c115072cbfa90"]=function(){
// ── 乐享全屏对话（lxfd）独立模块 ─────────────────────────────────────────────
// 从 app.js 拆出（原 L7746-L9426，天然 IIFE 边界，行为零变化）。
// 与主面板通过 window.__lxBridge / window.lxfdSubmit / window.__lxIntent 通信。
// 加载顺序：app-intent.js → app.js → app-lxfd.js（index.html 里排最后）。
// Lexiang fullscreen dialog replacement behavior
(function(){
  "use strict";
  if (window.__lxfdInstalled) return;
  window.__lxfdInstalled = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $(".lxfd");
  if (!root) return;

  const navCluster = $("#lxfdNavCluster");
  const convoPill = $("#lxfdConvoPill");
  const convoName = $("#lxfdConvoName");
  const rail = $("#lxfdRail");
  const railFab = $("#lxfdRailFab");
  const railNewFab = $("#lxfdRailNewFab");
  const historySearch = $("#lxfdHistorySearch");
  const scrim = $("#lxfdScrim");
  const stage = $("#lxfdStage");
  const welcome = $("#lxfdWelcome");
  const thread = $("#lxfdThread");
  const ta = $("#lxfdTa");
  const send = $("#lxfdSend");
  const chips = $("#lxfdChips");
  const quick = $("#lxfdQuick");
  const turnIndex = $("#lxfdTurnIndex");
  const turnDots = $("#lxfdTurnDots");
  const turnList = $("#lxfdTurnList");
  const helloTitle = $("#lxfdHelloTitle");
  const isWindowsRuntime = (() => {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    return /Win/i.test(platform) || /Windows/i.test(ua);
  })();
  const forceFullscreenMotion = isWindowsRuntime;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceFullscreenMotion;
  document.body.classList.toggle("lxfd-force-motion", forceFullscreenMotion);
  let hoverTimer = null;
  let turns = [];
  let helloIndex = 0;
  let helloAnimating = false;
  let helloTimer = null;
  let railManuallyCollapsed = true;
  const chatState = { convId: null, sending: false, conversationNonce: 0, localId: null };
  const navPaths = { home: "/", personal: "/shop-chat/", business: "/b-chat/", enterprise: "/biz-chat/", brand: "/brand/" };
  const LXFD_DEFAULT_HELLO_WORDS = ["找商品", "找门店", "找服务", "职场认证", "教育优惠", "找解决方案"];
  let helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
  const questions = ["想买游戏本，预算8000怎么选？", "学生买轻薄本，国补和教育优惠能省多少？", "小新和YOGA系列怎么选？", "旧电脑换新能抵多少钱？", "哪里有卖ThinkPad笔记本电脑门店"];
  const quicks = ["教育特惠", "以旧换新", "乐豆商城", "0元试用", "私人订制", "会员中心", "拉新返利"];
  const arrow = '<span class="arrow">' + window.__lxApprovedIcon("global-next") + '</span>';
  // actionbar 按钮 label → 有意义的 query 示例（避免直接发 label 体验差）
  const LXFD_ACTION_Q = {
    "文档解读": "请帮我解读这份文档，提炼核心结论、关键数据和待确认风险",
    "商品导购": "帮我推荐一款适合我的笔记本电脑",
    "解决方案": "解决方案",
    "门店查询": "帮我查询附近的联想门店",
    "职场认证": "职场人群认证怎么做，能享哪些专属优惠？",
    "服务预约": "我想预约售后维修或上门服务",
    "我的订单": "帮我查最近的订单状态和物流",
    "售后服务": "我的设备保修和售后服务怎么办理？",
    "评价服务": "给本次客服服务打个五星好评",
    "需求清单": "我整理一份采购需求清单发你确认",
  };
  const answer = '<p>我是联想官方AI助手，主要可以帮您完成以下事情：</p>'
    + '<h4>产品选购</h4><ul><li>推荐最适合的联想产品&lt;笔记本、台式机、平板、手机、配件等&gt;</li><li>产品参数对比、性价比分析</li></ul>'
    + '<h4>优惠查询</h4><ul><li>最新优惠政策:国补、教育优惠、企业补贴、学生价等</li><li>计算到手价、叠加各种优惠</li><li>推荐最适合您身份的优惠券</li></ul>'
    + '<h4>服务支持</h4><ul><li>查询保修状态、推荐延保方案</li><li>售后流程:退换货、维修、清洁保养、以旧换新估价</li><li>服务站地址和技术支持联系方式</li></ul>'
    + '<h4>订单辅助</h4><ul><li>处理订单、发货物流、发票等</li><li>会员权益、乐豆积分的使用</li></ul>'
    + '<p>有什么具体需求，随时可以和我说~</p>'
    + '<div class="lxfd-followups"><button type="button">可以推荐适合学生的笔记本吗？</button><button type="button">怎么查询我的产品保修状态？</button><button type="button">现在有哪些可以叠加的优惠政策？</button></div>'
    + '<p class="lxfd-disclaimer">内容由联想乐享基于当前信息生成，请在使用前核对关键信息。</p>';

  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
  function escapeAttr(text) { return escapeHtml(text).replace(/`/g, "&#96;"); }
  function lxfdDetectPage() {
    const path = location.pathname;
    for (const [page, p] of Object.entries(navPaths)) {
      if (path === p || path === p.replace(/\/$/, "") || path.startsWith(p === "/" ? "/_" : p)) {
        if (p !== "/" || path === "/") return page;
      }
    }
    // 精确匹配
    for (const [page, p] of Object.entries(navPaths)) {
      const normalized = p.endsWith("/") ? p : p + "/";
      const pathNorm = path.endsWith("/") ? path : path + "/";
      if (pathNorm === normalized) return page;
    }
    return "home";
  }
  function lxfdApplySite() {
    const prompts = window.__lxSitePrompts;
    if (!prompts) {
      // 兜底：用写死默认值渲染
      if (chips) chips.innerHTML = questions.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
      if (quick) quick.innerHTML = quicks.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
      return;
    }
    const page = (window.__lxState && window.__lxState.page) || lxfdDetectPage();
    const cfg = prompts[page] || prompts.home;
    if (!cfg) return;
    // 欢迎 chips
    const welcomeList = cfg.welcome || questions;
    if (chips) chips.innerHTML = welcomeList.map((q, i) => `<button class="lxfd-chip-q anim-rise" style="animation-delay:${0.3 + i * 0.07}s" type="button" data-q="${escapeAttr(q)}">${escapeHtml(q)}${arrow}</button>`).join("");
    // 底部 actionbar
    const actionbarList = cfg.actionbar || quicks;
    if (quick) quick.innerHTML = actionbarList.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("");
    // 滚动标题词固定使用默认词组，不随频道话术重新读取。
    helloWords = LXFD_DEFAULT_HELLO_WORDS.slice();
    helloIndex = helloIndex % helloWords.length;
    // 输入框 placeholder
    if (ta && cfg.placeholder) ta.placeholder = cfg.placeholder;
  }
  lxfdApplySite();
  if (ta) ta.placeholder = "文档解读";
  function shortText(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }

  // ── 能力 B：localStorage 多会话历史 ──────────────────────────────────────
  function lxfdLoadStore() { try { return JSON.parse(localStorage.getItem("lexiang.lxfd.convs.v1") || "[]"); } catch (_) { return []; } }
  function lxfdSaveStore(a) { try { localStorage.setItem("lexiang.lxfd.convs.v1", JSON.stringify(a.slice(0, 20))); } catch (_) {} }
  function lxfdNewLocalConv() { chatState.localId = "lc" + Date.now() + Math.random().toString(36).slice(2, 6); }
  function lxfdPersistCurrent() {
    if (!thread || !thread.children.length) return;
    if (!chatState.localId) lxfdNewLocalConv();
    const firstUser = thread.querySelector(".lxfd-msg-user");
    const title = (firstUser ? firstUser.textContent : "新对话").trim().slice(0, 24) || "新对话";
    const previous = lxfdLoadStore().find(c => c.id === chatState.localId);
    const store = lxfdLoadStore().filter(c => c.id !== chatState.localId);
    store.unshift({ id: chatState.localId, title, convId: chatState.convId || null, threadHtml: thread.innerHTML, ts: Date.now(), pinned: !!previous?.pinned });
    lxfdSaveStore(store);
    // 同步一份到子站切换/刷新恢复用的 key（lexiang.conversation.v1）——否则首页对话切子站后丢失
    lxfdSyncToMainConvKey();
  }
  window.__lxfdPersistCurrentNow = lxfdPersistCurrent;
  // 首页 lxfd 对话 → 写进主对话持久化 key，让切子站(整页重载)后能恢复到同一段历史
  function lxfdSyncToMainConvKey() {
    try {
      if (localStorage.getItem("lexiang.newChatEmpty.v1") === "1") {
        localStorage.removeItem("lexiang.conversation.v1");
        return;
      }
      if (!thread) return;
      const nodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai"));
      const messages = [];
      nodes.forEach(function (el) {
        if (el.classList.contains("lxfd-msg-user")) {
          const text = (el.textContent || "").trim();
          if (text) messages.push({ role: "user", text: text, html: "" });
        } else {
          const body = el.querySelector(".lxfd-ai-body");
          let html = body ? body.innerHTML : "";
          const text = body ? (body.textContent || "").trim() : "";
          // 完成态正文会保留 hidden typing-cursor，不能仅凭类名把整条回复当成生成中。
          // 真正未完成的消息仍以可见 loading/typing 节点或占位文案为准；已有正文时保留
          // text，并清空不安全的中间态 HTML，让目标栏目用统一 markdown 渲染恢复。
          const hasVisiblePending = !!(body && Array.from(body.querySelectorAll(".lx-generating, .loading-line, .typing-text, .typing-cursor")).some(function (node) {
            return !node.hidden && node.getAttribute("aria-hidden") !== "true";
          }));
          const hasPlaceholderOnly = /联想乐享正在生成中|正在生成中/.test(text) && text.length < 40;
          if ((hasVisiblePending || hasPlaceholderOnly) && !text.replace(/联想乐享正在生成中|正在生成中/g, "").trim()) return;
          if (hasVisiblePending || hasPlaceholderOnly) html = "";
          if (html || text) messages.push({ role: "ai", text: text, html: html });
        }
      });
      while (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      if (!messages.length) return;
      localStorage.setItem("lexiang.conversation.v1", JSON.stringify({
        convId: chatState.convId || null,
        messages: messages.slice(-50),
        ts: Date.now()
      }));
    } catch (_e) {}
  }
  function lxfdRenderHist(query) {
    const normalizedQuery = String(query ?? historySearch?.value ?? "").trim().toLocaleLowerCase("zh-CN");
    const store = lxfdLoadStore()
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Number(b.ts || 0) - Number(a.ts || 0))
      .filter(c => !normalizedQuery || String(c.title || "").toLocaleLowerCase("zh-CN").includes(normalizedQuery));
    const hist = $("#lxfdHist");
    if (!hist) return;
    if (!store.length) {
      hist.innerHTML = '<div class="lxfd-hist-empty" role="status">' + (normalizedQuery ? "没有找到相关对话" : "暂无历史记录") + '</div>';
      return;
    }
    hist.innerHTML = store.map(c => '<div class="lxfd-hist-item' + (c.pinned ? " is-pinned" : "") + '" data-conv-item="' + escapeAttr(c.id) + '">' +
      '<a href="#" data-conv="' + escapeAttr(c.id) + '" class="lxfd-hist-link ' + (c.id === chatState.localId ? "active" : "") + '" title="' + escapeAttr(c.title) + '"><span class="lxfd-hist-title">' + escapeHtml(c.title) + '</span></a>' +
      '<button class="lxfd-hist-more" type="button" aria-label="' + escapeAttr(c.title) + '的更多操作" aria-haspopup="menu" aria-expanded="false"><img src="../icons/global-more.svg" alt="" aria-hidden="true" /></button>' +
      '<div class="lxfd-hist-menu" role="menu"><button class="lxfd-hist-action" type="button" role="menuitem" data-action="pin"><img src="../icons/' + (c.pinned ? 'global-unpin.svg' : 'global-pin.svg') + '" alt="" aria-hidden="true" /><span>' + (c.pinned ? "取消置顶" : "置顶") + '</span></button><button class="lxfd-hist-action" type="button" role="menuitem" data-action="delete"><img src="../icons/global-delete.svg" alt="" aria-hidden="true" /><span>删除</span></button></div></div>').join("");
    hist.querySelectorAll(".lxfd-hist-more").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const item = button.closest(".lxfd-hist-item");
        if (!item) return;
        const open = !item.classList.contains("menu-open");
        $$(".lxfd-hist-item.menu-open").forEach(node => {
          node.classList.remove("menu-open");
          node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false");
        });
        item.classList.toggle("menu-open", open);
        button.setAttribute("aria-expanded", String(open));
        if (open) item.querySelector(".lxfd-hist-action")?.focus();
      });
    });
  }

  function lxfdUpdateConversation(id, action) {
    const store = lxfdLoadStore();
    const index = store.findIndex(item => item.id === id);
    if (index < 0) return;
    if (action === "pin") store[index].pinned = !store[index].pinned;
    if (action === "delete") store.splice(index, 1);
    lxfdSaveStore(store);
    if (action === "delete" && id === chatState.localId) resetConversation(false);
    else lxfdRenderHist();
  }
  function lxfdLoadConv(id) {
    const c = lxfdLoadStore().find(x => x.id === id);
    if (!c) return;
    lxfdPersistCurrent();
    chatState.localId = c.id;
    chatState.convId = c.convId || null;
    chatState.conversationNonce += 1;
    if (thread) { thread.innerHTML = c.threadHtml; thread.classList.add("show"); }
    if (welcome) welcome.style.display = "none";
    lxfdSetGalleryChatting(true);
    if (convoName) { convoName.textContent = shortText(c.title, 15); convoName.title = c.title; }
    turns = [];
    renderTurnIndex("");
    lxfdRenderHist();
  }

  // ── 能力 A：从主面板导入已有对话 ─────────────────────────────────────────
  // 查主面板消息必须排除过渡动画层里的克隆：动画层整块克隆 .assistant-panel（类名原样保留），
  // 存活的 760ms 内全局 querySelectorAll 会真身+克隆各抓一份 → 导入翻倍
  function lxfdMainMsgs(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel), function(el) { return !el.closest(".lxfd-motion-panel"); });
  }
  function lxfdMainGenerating() {
    // 主面板是否仍在流式生成（state.sending 或最后一条 AI 消息里还挂着生成骨架）
    return !!((window.__lxState && window.__lxState.sending) ||
      lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai .lx-generating").length);
  }
  function lxfdNormalizeImportedAiHtml(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("[data-lx-focus-reco]").forEach((node) => {
      node.removeAttribute("data-lx-focus-reco");
      node.setAttribute("data-lxfd-reveal-products", "1");
    });
    return box.innerHTML;
  }
  function lxfdDoImport() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const importedConvId = (window.__lxState && window.__lxState.convId) || null;
    // 重复展开同一段分屏会话时覆盖同步现有全屏线程，不额外制造一条历史记录；
    // 只有确实切换到了另一段后端会话时才建立新的本地会话身份。
    if (!chatState.localId || (chatState.convId && importedConvId && chatState.convId !== importedConvId)) {
      lxfdNewLocalConv();
    }
    thread.innerHTML = "";
    turns = [];
    msgs.forEach(function(el) {
      const isUser = el.classList.contains("user");
      if (isUser) {
        const text = el.textContent.trim();
        const turnId = "turn-" + Date.now() + "-" + turns.length;
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-user" id="' + turnId + '">' + escapeHtml(text) + '</div>');
        turns.push({ id: turnId, text: text });
      } else {
        thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">' + lxfdNormalizeImportedAiHtml(el.innerHTML) + '</div></div>');
      }
    });
    renderTurnIndex("");
    chatState.convId = importedConvId;
    if (welcome) welcome.style.display = "none";
    thread.classList.add("show");
    chatState.started = true;
    lxfdSetGalleryChatting(true);
    if (quick) quick.style.display = "none";
    const lastUser = thread.querySelector(".lxfd-msg-user:last-of-type");
    const titleText = lastUser ? lastUser.textContent.trim() : "导入的对话";
    if (convoName) { convoName.textContent = shortText(titleText, 15); convoName.title = titleText; }
    lxfdPersistCurrent();
    lxfdRenderHist();
    return true;
  }
  function lxfdImportFromMain() {
    const msgs = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message");
    if (!msgs.length) return false;
    const generating = lxfdMainGenerating();
    // 先把当前所有消息（含那条还在生成、内容只有一半的 AI）原样克隆过来——带一半过来
    lxfdDoImport();
    if (generating) {
      // 主面板仍在流式输出：实时把最后一条 AI 消息镜像到全屏，主面板每蹦一段、全屏跟着更新，
      // 直到生成结束——边进边继续往外输出，不再干等（流式 SSE 只发给主面板 DOM，这里做镜像）。
      const aiNodes = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.ai");
      const mainAi = aiNodes[aiNodes.length - 1];
      const fsBodies = thread.querySelectorAll(".lxfd-msg-ai .lxfd-ai-body");
      const fsAiBody = fsBodies[fsBodies.length - 1];
      if (mainAi && fsAiBody) {
        let tries = 0;
        const iv = setInterval(function() {
          tries++;
          fsAiBody.innerHTML = lxfdNormalizeImportedAiHtml(mainAi.innerHTML);          // 镜像最新流式内容
          thread.scrollTop = thread.scrollHeight;
          if (!lxfdMainGenerating() || tries > 400) {     // 60s 上限兜底
            clearInterval(iv);
            fsAiBody.innerHTML = lxfdNormalizeImportedAiHtml(mainAi.innerHTML);          // 收尾再同步最终一帧
            lxfdPersistCurrent();
            lxfdRenderHist();
          }
        }, 150);
      }
    }
    return true;
  }
  // ── 能力 C：把 lxfd 当前对话导出到主面板 ──────────────────────────────────
  // excludeEls：这一轮临时展示、不该进历史的节点（件2代买桥接用——过渡态用户气泡/提示条
  // 只在全屏展示做视觉过渡，真正的一条由桥接后 sendChat(value) 在主面板重新生成，
  // 带过去导出会变成重复两条）。
  function lxfdExportToMain(excludeEls) {
    if (!thread || !window.__lxBridge) return;
    const skip = excludeEls && excludeEls.length ? new Set(excludeEls) : null;
    const messages = [];
    const allNodes = Array.from(thread.querySelectorAll(".lxfd-msg-user, .lxfd-msg-ai")).filter(function(el) { return !skip || !skip.has(el); });
    const lastAi = allNodes.filter(function(el) { return el.classList.contains("lxfd-msg-ai"); }).pop();
    allNodes.forEach(function(el) {
      if (el.classList.contains("lxfd-msg-user")) {
        messages.push({ role: "user", text: el.textContent.trim(), html: "" });
      } else {
        const body = el.querySelector(".lxfd-ai-body");
        let html;
        if (body) {
          // 剥掉 lxfd 专属商品区和免责；追问需要保留，并转成主对话可点击的链接样式。
          // 商品已在右侧 reco 页正常展示，左侧对话保留文字答案 + 最新追问。
          const clone = body.cloneNode(true);
          clone.querySelectorAll(".lxfd-products, .lxfd-disclaimer").forEach(function(n) { n.remove(); });
          if (el !== lastAi) clone.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach(function(n) { n.remove(); });
          clone.querySelectorAll(".lxfd-followups").forEach(function(n) {
            n.classList.remove("lxfd-followups");
            n.classList.add("followups");
            n.setAttribute("data-followups", "1");
            n.querySelectorAll("button").forEach(function(btn) {
              const text = (btn.textContent || "").replace(/→\s*$/, "").trim();
              if (text) btn.setAttribute("data-quick-ask", text);
            });
          });
          html = clone.innerHTML;
        } else {
          html = el.innerHTML;
        }
        messages.push({ role: "ai", text: "", html: html });
      }
    });
    if (!messages.length) return;
    window.__lxBridge.importConversation(messages, chatState.convId, { localId: chatState.localId });
  }
  function parseJson(data) {
    try { return JSON.parse(data); } catch (_) { return {}; }
  }
  function money(value) {
    const n = Number(value || 0);
    return n ? "¥" + n.toLocaleString("zh-CN") : "咨询价";
  }
  function imgUrl(src) {
    const value = String(src || "").trim();
    if (!value) return "/assets/product-placeholder.svg";
    return value.startsWith("http") || value.startsWith("/") ? value : "/" + value;
  }
  function mdLite(text) {
    // 官方文本常自带 HTML 实体（「我的」&gt;「设置」），不先解码会被 escapeHtml 二次转义显示成字面（同主面板 mdLite）
    const src = String(text || "").replace(/<br\s*\/?>/gi, "\n").replace(/[ \t]*_\._[ \t]*/g, " ")
      .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    let html = escapeHtml(src);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?:^|\n)####?\s*(.+)/g, "\n<h4>$1</h4>");
    html = html.replace(/(?:^|\n)-\s+(.+)/g, "\n<ul><li>$1</li></ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    return html.split(/\n{2,}/).map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (/^<(h4|ul)/.test(clean)) return clean;
      return `<p>${clean.replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }
  async function readSse(response, handlers) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() || "";
      blocks.forEach((block) => {
        let event = "message";
        const data = [];
        block.split(/\n/).forEach((line) => {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        });
        const payload = data.join("\n");
        if (payload && handlers[event]) handlers[event](payload);
      });
    }
    if (buffer.trim()) {
      let event = "message";
      const data = [];
      buffer.split(/\n/).forEach((line) => {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      });
      const payload = data.join("\n");
      if (payload && handlers[event]) handlers[event](payload);
    }
  }
  function wide() { return window.innerWidth >= 1280; }
  function finishMotionClass(name, delay = 520) {
    window.setTimeout(() => document.body.classList.remove(name), reduceMotion ? 0 : delay);
  }
  function runMotionPanel(layer) {
    if (!layer) return;
    const runCssMotion = () => {
      if (forceFullscreenMotion) {
        layer.getBoundingClientRect();
        requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("run")));
      } else {
        requestAnimationFrame(() => layer.classList.add("run"));
      }
    };
    // Windows 11 + Chromium 149 may skip the left/top/size transition when the
    // fullscreen layer is inserted and the body class changes in the same frame.
    // Drive that environment with WAAPI, while leaving the existing CSS path
    // untouched for systems where the original animation already works.
    if (!forceFullscreenMotion || typeof layer.animate !== "function") {
      runCssMotion();
      return;
    }
    const isExit = layer.classList.contains("lxfd-motion-panel-exit");
    const ease = "cubic-bezier(.22,.61,.36,1)";
    const start = layer.getBoundingClientRect();
    const toPx = (value, fallback) => {
      const n = parseFloat(String(value || ""));
      return Number.isFinite(n) ? n : fallback;
    };
    const target = isExit
      ? {
          left: toPx(layer.style.getPropertyValue("--lxfd-target-left"), start.left),
          top: toPx(layer.style.getPropertyValue("--lxfd-target-top"), start.top),
          width: toPx(layer.style.getPropertyValue("--lxfd-target-width"), start.width),
          height: toPx(layer.style.getPropertyValue("--lxfd-target-height"), start.height),
          radius: 8,
          opacity: 0,
      }
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, radius: 0, opacity: 0 };
    if (isExit) {
      const scaleX = target.width > 0 && start.width > 0 ? target.width / start.width : 1;
      const scaleY = target.height > 0 && start.height > 0 ? target.height / start.height : 1;
      const moveX = target.left - start.left;
      const moveY = target.top - start.top;
      layer.style.transformOrigin = "top left";
      layer.style.backfaceVisibility = "hidden";
      layer.style.transform = "translate3d(0,0,0) scale(1,1)";
      const first = {
        transform: "translate3d(0,0,0) scale(1,1)",
        borderRadius: "0px",
        opacity: "1",
      };
      const last = {
        transform: `translate3d(${moveX}px,${moveY}px,0) scale(${scaleX},${scaleY})`,
        borderRadius: `${target.radius}px`,
        opacity: `${target.opacity}`,
      };
      const anim = layer.animate([
        first,
        { ...first, offset: 0.08 },
        { ...last, opacity: "1", offset: 0.72 },
        last
      ], { duration: 720, easing: ease, fill: "forwards" });
      anim.addEventListener("finish", () => {
        layer.style.left = `${target.left}px`;
        layer.style.top = `${target.top}px`;
        layer.style.width = `${target.width}px`;
        layer.style.height = `${target.height}px`;
        layer.style.borderRadius = `${target.radius}px`;
        layer.style.opacity = `${target.opacity}`;
        layer.style.transform = "translate3d(0,0,0) scale(1,1)";
        layer.classList.add("run");
      }, { once: true });
      return;
    }
    const first = {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      borderRadius: isExit ? "0px" : "8px",
      opacity: "1",
    };
    const hold = { ...first, offset: isExit ? 0.72 : 0.67 };
    const last = {
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      borderRadius: `${target.radius}px`,
      opacity: `${target.opacity}`,
    };
    const anim = layer.animate([first, hold, last], { duration: 720, easing: ease, fill: "forwards" });
    anim.addEventListener("finish", () => {
      Object.assign(layer.style, last);
      layer.classList.add("run");
    }, { once: true });
  }
  function createPanelStretchLayer() {
    const source = document.querySelector(".assistant-panel");
    if (!source || reduceMotion) return null;
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function getSplitPanelRect() {
    // 全屏态可能只剩 lx-auto-fs：exitFullscreen 里先跑的 focusReco→lxRevealContent 会摘掉
    // assistant-fullscreen 但留 lx-auto-fs（它单独也藏着 .shell）。只认一个类会误判"不在全屏"，
    // 不摘类就去量 → 量到 display:none 的面板 → null → 退出动画整个消失
    const wasFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (wasFullscreen) setFullscreen(false);
    const source = document.querySelector(".assistant-panel");
    const rect = source?.getBoundingClientRect();
    if (wasFullscreen) setFullscreen(true);
    if (!rect || !rect.width || !rect.height) return null;
    return rect;
  }
  function createFullscreenShrinkLayer(targetRect) {
    const source = document.querySelector(".lxfd");
    if (!source || !targetRect || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    runMotionPanel(layer);
    return layer;
  }
  function createFullscreenExitLayer() {
    const source = document.querySelector(".lxfd");
    if (!source || reduceMotion) return null;
    const layer = document.createElement("div");
    layer.className = "lxfd-motion-panel lxfd-motion-panel-exit";
    layer.setAttribute("aria-hidden", "true");
    const clone = source.cloneNode(true);
    clone.classList.add("lxfd-motion-clone");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    layer.appendChild(clone);
    document.body.appendChild(layer);
    return layer;
  }
  function setFullscreenExitLayerTarget(layer, targetRect) {
    if (!layer || !targetRect || !targetRect.width || !targetRect.height) return false;
    layer.style.setProperty("--lxfd-target-left", `${targetRect.left}px`);
    layer.style.setProperty("--lxfd-target-top", `${targetRect.top}px`);
    layer.style.setProperty("--lxfd-target-width", `${targetRect.width}px`);
    layer.style.setProperty("--lxfd-target-height", `${targetRect.height}px`);
    runMotionPanel(layer);
    return true;
  }
  function normalizeFullscreenEntryState() {
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    document.body.classList.remove("lxfd-exiting", "lxfd-split-returning");
    if (document.body.classList.contains("lx-home-split")) {
      document.body.dataset.page = "home";
      const content = document.querySelector(".content");
      if (content) content.setAttribute("data-view", "home");
      document.body.classList.remove("lx-home-split");
    }
    stage?.classList.remove("shift");
    openRail(false);
  }
  function enterFullscreen() {
    // 动画层必须在 normalize 之前截取：normalize 会拆掉分屏布局，之后 .assistant-panel
    // 量出 0×0 → 拿不到起点 → 退化成 CSS 兜底的「从下面冒出」而不是面板拉伸过渡
    const motionLayer = createPanelStretchLayer();
    normalizeFullscreenEntryState();
    lxfdApplySite();
    // 每次展开都重新读取分屏当前会话。不能以全屏 thread 是否为空作为判断，
    // 否则 thread 中残留的旧首轮内容会阻止后续问答和推荐卡片被带入。
    if (lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) lxfdImportFromMain();
    document.body.classList.remove("lxfd-exiting");
    document.body.classList.remove("lxfd-split-returning");
    document.body.classList.add("lxfd-entering");
    document.body.classList.add("lxfd-split-entered");
    setFullscreen(true);
    window.setTimeout(() => motionLayer?.remove(), reduceMotion ? 0 : 760);
    finishMotionClass("lxfd-entering", 760);
  }
  function exitFullscreen(afterExit, options) {
    const onAfterExit = typeof afterExit === "function" ? afterExit : null;
    const skipGenericFocus = !!(options && options.skipGenericFocus);
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterExit?.();
      return;
    }
    // 有对话时回「分屏」而不是裸首页：enterFullscreen 的 normalize 把页面态抹成了 home，
    // 不对称恢复的话对话会藏在隐藏的 lxfd thread 里，用户看到 hero 首页以为对话丢了。
    // 先恢复分屏布局（复用 focusReco 配方）再量收缩动画落点，动画才有真实目标矩形。
    const hasConvo = !!(thread && thread.classList.contains("show") && thread.children.length && window.__lxBridge);
    // 带回调退出只用于“结果卡打开右侧内容”，即使历史 thread 的 show 标记在恢复时
    // 暂时缺失，也必须强制回左右框架，不能依赖 hasConvo 这一项视觉标记。
    const returnToSplit = hasConvo || !!onAfterExit;
    if (hasConvo) {
      lxfdExportToMain();
      try {
        if (skipGenericFocus) window.__lxBridge.prepareRootSplitState?.();
        else window.__lxBridge.focusReco();
      } catch {}
    }
    const targetRect = getSplitPanelRect();
    const motionLayer = createFullscreenShrinkLayer(targetRect);
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    // 全屏类清理/主应用退出钩子都可能重算页面态。必须在它们之后再次落定分屏，
    // 否则会出现既无 assistant-fullscreen、也无 lx-home-split 的半退出页面。
    if (returnToSplit) lxfdEnsureRootSplitState();
    document.body.dataset.state = hasConvo ? "chat" : "default";
    if (hasConvo && thread) thread.innerHTML = "";
    if (onAfterExit) requestAnimationFrame(() => {
      if (returnToSplit) lxfdEnsureRootSplitState();
      onAfterExit();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      if (returnToSplit) lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  // 结果卡需要从全屏对话直接落到“左对话 + 右结果”。
  // 这里不走通用退出动画：通用动画会在两帧之间暴露裸商城和
  // 全屏层/商城混合态。所有布局类、页面态和目标内容在同一个点击任务内提交，
  // 浏览器下一次绘制只能看到最终左右框架。
  function lxfdExitToResultAtomically(commitResult) {
    const hasConversation = !!(thread && thread.children.length && window.__lxBridge);
    if (hasConversation) lxfdExportToMain();
    document.body.classList.remove(
      "assistant-fullscreen", "lx-auto-fs", "lx-root-home", "lxfd-entering",
      "lxfd-exiting", "lxfd-split-returning"
    );
    document.querySelectorAll(".lxfd-motion-panel").forEach((node) => node.remove());
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    lxfdEnsureRootSplitState();
    document.body.dataset.state = "chat";
    if (typeof commitResult === "function") commitResult();
    lxfdEnsureRootSplitState();
    lxfdAssertSplitEndState();
    if (hasConversation && thread) thread.innerHTML = "";
    const stabilizeSplit = () => {
      lxfdEnsureRootSplitState();
      lxfdAssertSplitEndState();
    };
    requestAnimationFrame(stabilizeSplit);
    // Restored history cards can start an asynchronous result-page generator.
    // Root-home guards may run again during that window and remove the split
    // class after the first frame. Keep asserting the shared two-column end
    // state until the result page has replaced its generation overlay.
    [80, 240, 520, 900].forEach((delay) => window.setTimeout(stabilizeSplit, reduceMotion ? 0 : delay));
  }
  // 退出动画收尾断言：分屏已成形则全屏类必须不在。防御外部"回全屏"钩子在动画窗口内
  // (补分屏类之前的一瞬守卫失效)把全屏类加回来，造成两态共存的混合花屏
  function lxfdAssertSplitEndState() {
    if (!document.body.classList.contains("lx-home-split")) return;
    window.__LXFD_FORCE = false; // 已进分屏,关掉"URL=/强制全屏"开关,否则内联force定时器会把全屏盖回来
    document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lx-root-home");
    document.documentElement.classList.remove("lx-root-lxfd-prepaint");
    if (document.body.dataset.page === "home" || !document.body.dataset.page) document.body.dataset.page = "personal";
    // forceRootFullscreen 曾给 .lxfd 写内联 display:block/visibility:visible——内联样式压过
    // 分屏 CSS 的隐藏规则,全屏层会叠在分屏上(消息裸排+hero输入框+画廊混显)。清掉还权给 CSS
    const lxfdLayer = document.querySelector(".lxfd");
    if (lxfdLayer) { lxfdLayer.style.display = ""; lxfdLayer.style.visibility = ""; }
  }
  function exitFullscreenWithReveal(afterReveal) {
    const onAfterReveal = typeof afterReveal === "function" ? afterReveal : null;
    if (!document.body.classList.contains("assistant-fullscreen") && !document.body.classList.contains("lx-auto-fs")) {
      onAfterReveal?.();
      return;
    }
    const motionLayer = createFullscreenExitLayer();
    document.body.classList.remove("lxfd-entering");
    document.body.classList.add("lxfd-exiting");
    setFullscreen(false);
    try { window.__lxBridge?.exitFullscreen?.(); } catch {}
    document.body.dataset.state = thread?.classList.contains("show") ? "chat" : "default";
    onAfterReveal?.();
    requestAnimationFrame(() => {
      const rect = document.querySelector(".assistant-panel")?.getBoundingClientRect();
      if (!setFullscreenExitLayerTarget(motionLayer, rect)) motionLayer?.remove();
    });
    window.setTimeout(() => document.body.classList.add("lxfd-split-returning"), reduceMotion ? 0 : 320);
    window.setTimeout(() => {
      document.body.classList.remove("lxfd-exiting");
      document.body.classList.remove("lxfd-split-returning");
      lxfdAssertSplitEndState();
      motionLayer?.remove();
    }, reduceMotion ? 0 : 760);
  }
  window.__lxfdExitWithReveal = exitFullscreenWithReveal;
  function setFullscreen(on) {
    document.body.classList.toggle("assistant-fullscreen", !!on);
    document.body.classList.toggle("lx-auto-fs", !!on);
    if (!on) document.body.classList.remove("lxfd-split-entered");
    if (on) document.body.dataset.state = "chat";
    if (on) {
      const currentTitle = convoName?.textContent?.trim();
      if (convoName && !currentTitle) {
        const splitTitle = document.querySelector(".main-nav")?.getAttribute("data-current-label")?.trim();
        const lastMainUser = lxfdMainMsgs(".lx-p0-messages > .lx-p0-message.user").pop()?.textContent?.trim();
        const fallbackTitle = splitTitle || (lastMainUser ? shortText(lastMainUser, 15) : "新对话");
        convoName.textContent = fallbackTitle;
        convoName.title = fallbackTitle;
      }
      const hasThread = !!(thread && (thread.classList.contains("show") || thread.children.length));
      if (hasThread || chatState.started) {
        if (welcome) welcome.style.display = "none";
        if (thread) thread.classList.add("show");
        if (quick) quick.style.display = "none";
        lxfdSetGalleryChatting(true);
      }
      requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); ta?.focus(); });
    }
  }
  function setNav(open) {
    navCluster?.classList.toggle("open", open);
    convoPill?.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function syncRailNewFabVisibility() {
    const chatting = !!stage?.classList.contains("is-chatting");
    const railOpen = !!rail?.classList.contains("open");
    document.body.classList.toggle("lxfd-chatting", chatting);
    railNewFab?.classList.toggle("hide", railOpen || !chatting);
  }
  function openRail(open) {
    if (open && !window.__lxState?.user) open = false;
    rail?.classList.toggle("open", open);
    railFab?.classList.toggle("hide", open);
    syncRailNewFabVisibility();
    stage?.classList.toggle("shift", open && wide());
    scrim?.classList.remove("show");
    // 侧栏一露出就重读 localStorage 重渲染——store 是主面板(app.js lxArchiveCurrentConversation)
    // 和本文件(lxfdPersistCurrent)共用的同一个 key，但 #lxfdHist 只在启动时渲染过一次；
    // 主面板那边新归档的对话（含多步 agent 卡）不会自动反映到这里，用户点开旧快照里的
    // 条目会踩到过期/不完整数据，恢复出来就只剩用户那句话。开一次刷一次，零额外触发面。
    if (open) lxfdRenderHist();
  }
  function setRailManual(open) {
    railManuallyCollapsed = !open;
    document.body.classList.toggle("lxfd-rail-user-open", !!open);
    openRail(open);
  }
  function syncRailForViewport() {
    openRail(Boolean(window.__lxState?.user) && wide() && !railManuallyCollapsed);
  }
  window.__lxfdSyncHistoryAuth = function(authenticated) {
    if (!authenticated) {
      railManuallyCollapsed = true;
      document.body.classList.remove("lxfd-rail-user-open");
      openRail(false);
      return;
    }
    syncRailForViewport();
  };
  function fit() {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 148) + "px";
  }
  function syncSend() {
    const empty = !ta?.value.trim();
    send?.classList.toggle("idle", empty);
    if (send) send.disabled = empty;
  }
  function setRotatingTitle(word) { if (helloTitle) helloTitle.innerHTML = `<span>联想乐享帮你</span><span class="rotating-word">${escapeHtml(word)}</span>`; }
  async function rotateTitleWordForWindows(word) {
    if (helloAnimating || !word || typeof word.animate !== "function") return;
    helloAnimating = true;
    const ease = "cubic-bezier(.16,.72,.22,1)";
    try {
      // 位移用 top（布局属性，主线程绘制）不用 transform/blur/will-change——那些会把词提成
      // 合成层，配合父级 background-clip:text 渐变字在 Chrome 留旧帧残影（真机两轮反馈）；
      // top 动画不产生层缓存，动效在、残影无。word 的 position:relative 由 CSS 提供。
      await word.animate([
        { opacity: 1, top: "0px" },
        { opacity: 0, top: "-6px" }
      ], { duration: 300, easing: ease, fill: "forwards" }).finished;
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      await word.animate([
        { opacity: 0, top: "6px" },
        { opacity: 1, top: "0px" }
      ], { duration: 320, easing: ease, fill: "forwards" }).finished;
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } catch (_) {
      word.style.opacity = "";
      word.style.transform = "";
      word.style.filter = "";
      word.style.willChange = "";
    } finally {
      helloAnimating = false;
    }
  }
  function rotateTitleWord() {
    if (!helloTitle || welcome.style.display === "none") return;
    const word = helloTitle.querySelector(".rotating-word");
    if (!word) { setRotatingTitle(helloWords[helloIndex]); return; }
    if (forceFullscreenMotion && typeof word.animate === "function") {
      rotateTitleWordForWindows(word);
      return;
    }
    word.classList.add("out");
    window.setTimeout(() => {
      helloIndex = (helloIndex + 1) % helloWords.length;
      word.textContent = helloWords[helloIndex];
      word.classList.remove("out");
      word.classList.add("in");
      requestAnimationFrame(() => word.classList.remove("in"));
    }, reduceMotion ? 0 : 300);
  }
  function startRotatingTitle() {
    setRotatingTitle(helloWords[helloIndex]);
    if (reduceMotion) return;
    if (helloTimer) window.clearTimeout(helloTimer);
    if (!forceFullscreenMotion) {
      helloTimer = window.setInterval(rotateTitleWord, 2000);
      return;
    }
    const tick = () => {
      rotateTitleWord();
      helloTimer = window.setTimeout(tick, 2000);
    };
    helloTimer = window.setTimeout(tick, 2000);
  }
  function renderTurnIndex(activeId) {
    turnIndex?.classList.toggle("show", turns.length > 0);
    if (turnDots) turnDots.innerHTML = turns.map(t => `<i class="${t.id === activeId ? "active" : ""}"></i>`).join("");
    if (turnList) turnList.innerHTML = turns.map(t => `<button type="button" class="${t.id === activeId ? "active" : ""}" data-target="${escapeAttr(t.id)}" title="${escapeAttr(t.text)}">${escapeHtml(shortText(t.text, 18))}</button>`).join("");
  }
  function lxfdEnterHuman() {
    chatState.human = true;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body"><b>专属客服小联</b> 已为您接入人工服务，下方已切换为客服快捷入口。订单、售后、发票问题可直接发我。（演示：由乐享 AI 以专属客服身份接待）</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    if (quick) { quick.innerHTML = ["退出人工", "我的订单", "售后服务", "评价服务", "需求清单"].map(t => '<button type="button">' + escapeHtml(t) + '</button>').join(""); quick.style.display = ""; }
    if (ta) { if (!ta.dataset.origPh) ta.dataset.origPh = ta.placeholder; ta.placeholder = "向专属客服小联提问..."; }
  }

  function lxfdExitHuman() {
    chatState.human = false;
    if (thread) {
      thread.insertAdjacentHTML("beforeend", '<div class="lxfd-msg-ai"><div class="lxfd-ai-body">已退出人工服务，继续由联想乐享 AI 为您服务。</div></div>');
      thread.scrollTop = thread.scrollHeight;
    }
    lxfdApplySite();
    // 退出客服后若仍在聊天态则继续隐藏 actionbar
    if (chatState.started && quick) quick.style.display = "none";
    if (ta && ta.dataset.origPh) ta.placeholder = ta.dataset.origPh;
  }

  function lxfdSetGalleryChatting(on) {
    stage?.classList.toggle("is-chatting", !!on);
    syncRailNewFabVisibility();
  }

  function resetConversation(collapseRail) {
    lxfdPersistCurrent();
    // 先归档旧会话，再锁定当前会话为空；刷新/卸载期间不得由旧 DOM 回写。
    try {
      localStorage.setItem("lexiang.newChatEmpty.v1", "1");
      localStorage.removeItem("lexiang.conversation.v1");
    } catch (_e) {}
    chatState.conversationNonce += 1;
    chatState.convId = null;
    chatState.localId = null;
    chatState.sending = false;
    chatState.human = false;
    chatState.started = false; // 新建对话回到欢迎态，恢复 actionbar
    // 当前会话已重置，避免顶部标题从上一轮共享缓存中恢复。
    try { localStorage.removeItem("lexiang.conversation.v1"); } catch (_e) {}
    if (thread) { thread.innerHTML = ""; thread.classList.remove("show"); }
    turns = [];
    renderTurnIndex("");
    if (welcome) welcome.style.display = "flex";
    // 根路径新建对话=回到初始首页态：把 prepaint 标记类加回来（分屏桥接时被摘掉），
    // 否则整套「空白态」规则失效——topbar 露出、左侧 fab 复现、右上冒出「收起」按钮（真机反馈）
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    if (logicalPath === "/") {
      document.documentElement.classList.add("lx-root-lxfd-prepaint");
      document.body.classList.remove("lx-home-split", "lxfd-split-entered", "assistant-fullscreen", "lx-auto-fs");
      window.__LXFD_FORCE = true;
    }
    lxfdSetGalleryChatting(false);
    if (convoName) { convoName.textContent = "新对话"; convoName.title = "新对话"; }
    if (window.__lxSyncTopNavTitle) window.__lxSyncTopNavTitle();
    if (ta) { if (ta.dataset.origPh) ta.placeholder = ta.dataset.origPh; ta.value = ""; fit(); syncSend(); }
    // 从历史侧栏点击“新建对话”后，无论当前 PC 视口宽度，都收起历史目录；
    // 同步写入手动收起状态，避免随后的 resize / viewport 同步再次自动展开。
    if (collapseRail) setRailManual(false);
    // 恢复 actionbar（lxfdApplySite 会重渲内容）
    if (quick) { quick.style.display = ""; lxfdApplySite(); }
    ta?.focus();
    lxfdRenderHist();
  }
  function renderLxfdProducts(products, options = {}) {
    if (!Array.isArray(products) || !products.length) return "";
    const first = products[0] || {};
    const recoId = "lxfd-reco-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    window.__lxRecoPayloads = window.__lxRecoPayloads || {};
    window.__lxRecoPayloads[recoId] = products;
    // 同步持久化（与主面板 lxReadRecoPayload 同一 key）：桥接导出的历史恢复后 CTA 仍可取回商品
    try {
      const key = "lexiang.recoPayloads.v1";
      const store = JSON.parse(localStorage.getItem(key) || "[]");
      store.push({ id: recoId, products: products.slice(0, 8).map((p) => ({ sku: p.sku, name: p.name, price: p.price, image_url: p.image_url || p.image, specs: p.specs, description: (p.description || "").slice(0, 400) })) });
      localStorage.setItem(key, JSON.stringify(store.slice(-8)));
    } catch (_e) {}
    const isServiceProduct = !!options.serviceProduct;
    const desc = isServiceProduct
      ? `已为你推荐 ${products.length} 款服务商品`
      : products.length === 1
      ? `${escapeHtml(first.name || "按你的需求筛选出的商品")}${first.price ? ` · ${money(first.price)}` : ""}`
      : `已为你筛选 ${products.length} 款候选商品`;
    return `<button class="answer-cta lx-answer-reco" type="button" data-lxfd-reveal-products="1" data-lxfd-reco-id="${escapeHtml(recoId)}">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${isServiceProduct ? "查看推荐服务商品" : "查看推荐商品"}</span>
        <span class="answer-cta-desc">${desc}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function lxfdPageCtaMeta(op) {
    const key = String(op || "");
    const map = {
      edu: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      open_edu_zone: { feature: "edu", title: "查看教育特惠专区", desc: "已为你打开认证权益和专享商品" },
      solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      open_solution: { feature: "solution", title: "查看全集解决方案", desc: "覆盖教育、医疗、政府、制造、金融、能源、交通、服务" },
      stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      open_stores: { feature: "stores", title: "查看附近门店", desc: "已为你打开门店查询页面" },
      member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      open_member: { feature: "member", title: "查看会员中心", desc: "已为你打开会员权益与资产" },
      coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      open_coupon: { feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" },
      points: { feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" },
      vouchers: { feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" },
      redpacket: { feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" },
      cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      open_cart: { feature: "cart", title: "查看购物车", desc: "已为你打开购物车" },
      orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_orders: { feature: "orders", title: "查看我的订单", desc: "已为你打开订单页面" },
      open_documents: { feature: "documents", title: "查看文档解读", desc: "已为你打开资料中心与文档列表" }
    };
    return map[key] || null;
  }

  function renderLxfdPageCta(meta) {
    if (!meta) return "";
    const resultIds = { solution: "info:solution", member: "info:member", devices: "info:devices", coupon: "info:coupon", points: "info:points", vouchers: "info:vouchers", redpacket: "info:redpacket", documents: "documents", edu: "info:edu", cart: "info:cart", orders: "info:orders" };
    const resultId = resultIds[meta.feature] || "";
    const resultAttr = resultId ? ` data-lx-result-id="${escapeAttr(resultId)}" data-lx-open-tab="${escapeAttr(resultId)}" aria-pressed="false"` : "";
    return `<button class="answer-cta lx-answer-page" type="button" data-lx-focus-active="1" data-lxfd-open-feature="${escapeHtml(meta.feature || "")}"${resultAttr} aria-label="${escapeAttr(meta.title || "查看页面")}，展开左右框架" title="展开左右框架">
      <span class="answer-cta-copy">
        <span class="answer-cta-title">${escapeHtml(meta.title || "查看页面")}</span>
        <span class="answer-cta-desc">${escapeHtml(meta.desc || "已在右侧为你打开相关内容")}</span>
      </span>
      <span class="answer-cta-icon" aria-hidden="true">
        ${window.__lxApprovedIcon("global-next")}
      </span>
    </button>`;
  }

  function renderLxfdLeadCta() {
    return '<div class="lx-p0-actions answer-actions"><button class="lx-p0-btn primary" type="button" data-floor-action="lead">提交项目需求</button></div>';
  }

  // 只看 page==="home" 会漏：上一轮分屏残留 page="personal" 时再进全屏、退出走到这里，
  // 分屏类没补上 → 无全屏类也无分屏类的中间态（topbar 露出、lxfd 消息裸奔黑三角，或者背景
  // 停在首页欢迎态门户，聊天消息虽已在DOM里但不可见——件2代买桥接真机截图就踩到了这个）。
  // 无论根首页还是四个频道，从全屏卡片收起前都必须先恢复左右结构。
  // 旧逻辑只处理 URL=/：当目标 Tab 已被关闭或缓存中尚未登记时，卡片会走
  // lxfdRevealFeature 兜底；子频道因没有补分屏类，最终只剩右侧独立页面。
  function lxfdEnsureRootSplitState() {
    // 这是“最终态提交”而不是仅缺类时补一次。全屏进入/首页守卫可能在动画窗口内
    // 写回 lx-root-home 或移除 split；每次调用都重放主应用唯一的分屏归一化函数。
    if (typeof window.__lxBridge?.prepareRootSplitState === "function") {
      window.__lxBridge.prepareRootSplitState();
    } else if (!document.body.classList.contains("lx-home-split")) {
        document.documentElement.classList.remove("lx-root-lxfd-prepaint");
        document.body.classList.remove("assistant-fullscreen", "lx-auto-fs", "lxfd-entering", "lx-root-home");
        document.body.classList.add("lx-home-split", "lxfd-split-entered");
        document.body.dataset.page = "personal";
        document.body.dataset.state = "chat";
        window.__LXFD_FORCE = false;
        const _lxfdLayer = document.querySelector(".lxfd");
        if (_lxfdLayer) { _lxfdLayer.style.display = ""; _lxfdLayer.style.visibility = ""; }
    }
  }

  // 全屏消息会先导回主面板。结果卡收起后优先点击导回的同一张卡，
  // 让主面板唯一的结果路由器负责 Tab 激活、关闭后重建和内容恢复。
  function lxfdReplayImportedResultCard(target) {
    const cards = Array.from(document.querySelectorAll(".lx-p0-messages .answer-cta"));
    const hit = cards.slice().reverse().find((card) => {
      if (target.resultId && card.getAttribute("data-lx-result-id") === target.resultId) return true;
      if (target.boundTabId && card.getAttribute("data-lx-open-tab") === target.boundTabId) return true;
      if (target.solutionTitle && card.getAttribute("data-specific-solution-cta") === target.solutionTitle) return true;
      if (target.recoId && card.getAttribute("data-lxfd-reco-id") === target.recoId) return true;
      if (target.openProduct && card.getAttribute("data-open-product") === target.openProduct) return true;
      return !!target.feature && card.getAttribute("data-lxfd-open-feature") === target.feature;
    });
    if (!hit) return false;
    hit.click();
    return true;
  }

  function lxfdRevealFeature(feature) {
    lxfdEnsureRootSplitState();
    if (typeof window.__lxOpenFeature === "function") window.__lxOpenFeature(feature);
  }

  function lxfdOpenFeatureInSplit(feature) {
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (!inFullscreen) {
      lxfdRevealFeature(feature);
      return;
    }
    lxfdExportToMain();
    exitFullscreen(() => {
      lxfdRevealFeature(feature);
      if (thread) thread.innerHTML = "";
    });
  }

  async function lxfdRunHomeCommerceEntry(kind) {
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    // 这条“全屏生成 → 结果卡 → 左右结构”链路只属于根首页。
    // 子频道即使误调用，也立即回退到其原有商务入口，不改变频道交互。
    if (logicalPath !== "/") {
      return window.lxOpenCommerceEntry?.(kind, { sendQuery: true });
    }
    if (chatState.sending) return;

    const isOrders = kind === "orders";
    const query = isOrders ? "查看我的订单" : "查看我的购物车";
    const feature = isOrders ? "orders" : "cart";
    const reply = isOrders
      ? "已为你整理近期**订单状态**、商品与服务信息，可继续查看物流、详情及售后入口。"
      : "已为你整理**购物车商品**、优惠与结算信息，可继续核对选中商品并完成结算。";
    const meta = lxfdPageCtaMeta(isOrders ? "open_orders" : "open_cart");

    chatState.sending = true;
    chatState.started = true;
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    if (quick) quick.style.display = "none";
    thread?.classList.add("show");

    const turnId = `turn-home-${feature}-${Date.now()}`;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = query;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: query });
    renderTurnIndex(turnId);

    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

    try {
      // 严格串行：正文逐字完成后才挂结果卡；结果卡完成布局后才退出全屏并创建右页。
      await lxfdAnimateFinal(ai, reply);
      const body = ai.querySelector(".lxfd-ai-body");
      if (body && meta) body.insertAdjacentHTML("beforeend", renderLxfdPageCta(meta));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      lxfdPersistCurrent();
      lxfdExportToMain();
      await lxfdWait(reduceMotion ? 0 : 560);
      exitFullscreenWithReveal(() => lxfdRevealFeature(feature));
    } finally {
      chatState.sending = false;
    }
  }
  window.__lxfdRunHomeCommerceEntry = lxfdRunHomeCommerceEntry;

  function appendLxfdSuggestions(ai, suggestions) {
    const list = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    if (!list.length) return;
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => {
      if (!ai.contains(el)) el.remove();
    });
    ai.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    const host = ai.querySelector(".lxfd-ai-body") || ai;
    host.insertAdjacentHTML("beforeend", `<div class="lxfd-followups">${list.map((sug) => `<button type="button">${escapeHtml(sug)}</button>`).join("")}</div>`);
    // 件2 F1：追问chip常在答案打字动画收尾之后才异步插入，插入前 thread 已经滚到"答案末尾"，
    // 新增内容会落在可视区之下点不到——插入后补一次滚底（对称主面板的 lxAppendAiHtml 滚动逻辑）
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdClaimTicketSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4 2 2 0 0 0 0-4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 2"/></svg>';
  }

  function lxfdClaimCheckSvg(width) {
    return window.__lxApprovedIcon("global-check", width ? "ck" : "");
  }

  function lxfdClaimInfoFromCard(card) {
    const productName = (card && card.dataset && card.dataset.claimProduct) || (card && card.querySelector(".t2") && card.querySelector(".t2").textContent.trim()) || "商品";
    const chips = Array.prototype.slice.call(card ? card.querySelectorAll(".chip") : []);
    const claimed = chips.map(function(chip) {
      const amount = Number((chip.dataset && chip.dataset.claimAmount) || String((chip.querySelector(".cv") || {}).textContent || "").replace(/[^0-9.]/g, "")) || 0;
      const label = (chip.dataset && chip.dataset.claimName) || String(chip.textContent || "").replace(/¥\s?[\d,]+(?:\.\d+)?/g, "").trim() || "优惠券";
      return { label: label, amount: amount };
    });
    const domTotal = String((card && card.querySelector(".done-amt") || {}).textContent || "").replace(/[^0-9.]/g, "");
    const totalSaved = Number((card && card.dataset && card.dataset.claimTotal) || domTotal) || claimed.reduce(function(sum, item) { return sum + Math.abs(Number(item.amount || 0)); }, 0);
    return { productName: productName, claimed: claimed, totalSaved: totalSaved };
  }

  function lxfdRenderClaimedStaticCard(info) {
    const offers = Array.isArray(info.claimed) ? info.claimed : [];
    const chips = offers.map(function(coupon) {
      const amount = Math.abs(Number(coupon.amount || 0));
      return '<span class="chip">' + lxfdClaimCheckSvg("3.2") + escapeHtml(coupon.label || "优惠券") + ' <span class="cv">¥' + amount.toLocaleString("zh-CN") + '</span></span>';
    }).join("");
    return '<div class="gc lx-claimed-skin" data-v="I" aria-disabled="true">'
      + '<div class="irow"><span class="ic">' + lxfdClaimTicketSvg() + '</span>'
      + '<span class="mid"><div class="t1">已领取 ' + offers.length + ' 项优惠 <span class="doneflag df">' + lxfdClaimCheckSvg("2.6") + '已领取</span></div>'
      + '<div class="t2">' + escapeHtml(info.productName || "商品") + ' · 已收进卡包</div></span>'
      + '<span class="sa">已省 ¥' + Math.abs(Number(info.totalSaved || 0)).toLocaleString("zh-CN") + '</span></div>'
      + '<div class="chips">' + chips + '</div></div>';
  }

  function lxfdArchiveClaimProgressCards(root) {
    (root || document).querySelectorAll('.cl[data-v="D"].lx-claim-skin').forEach(function(card) {
      card.outerHTML = lxfdRenderClaimedStaticCard(lxfdClaimInfoFromCard(card));
    });
  }

  function lxfdTypeNodes(sourceParent, targetParent, speed, done) {
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    const scroll = () => { if (thread) thread.scrollTop = thread.scrollHeight; };
    const moveCursor = (parent) => { cursor.remove(); parent.appendChild(cursor); scroll(); };
    const typeTextNode = (text, parent, next) => {
      const textNode = document.createTextNode("");
      let index = 0;
      parent.appendChild(textNode);
      moveCursor(parent);
      const tick = () => {
        textNode.nodeValue = String(text).slice(0, index);
        index += 1;
        if (index <= String(text).length) window.setTimeout(tick, speed);
        else next();
      };
      tick();
    };
    const typeChildList = (children, parent, next) => {
      let index = 0;
      const step = () => {
        if (index >= children.length) { next(); return; }
        typeNode(children[index], parent, () => { index += 1; step(); });
      };
      step();
    };
    const typeNode = (node, parent, next) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.nodeValue) { next(); return; }
        typeTextNode(node.nodeValue, parent, next);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) { next(); return; }
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      moveCursor(clone);
      typeChildList(Array.from(node.childNodes), clone, next);
    };
    targetParent.innerHTML = "";
    typeChildList(Array.from(sourceParent.childNodes), targetParent, () => {
      cursor.remove();
      scroll();
      if (done) done();
    });
  }

  // 生成阶段实时刷新时间线（件2，同 app.js lxRenderTraceLive 逻辑）：此时 .lxfd-ai-body
  // 里只有这一个结构，全量重绘最简单；lxfdAnimateFinal 收尾时会把 ai-body 整体替换掉，
  // 折叠态 HTML 随 finalHtml 一起进去，不依赖这里的实时 DOM。
  function lxfdRenderTraceLive(ai) {
    const body = ai && ai.querySelector && ai.querySelector(".lxfd-ai-body");
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    if (!body || !renderTrace) return;
    body.innerHTML = renderTrace(ai._traceLines, { collapsed: ai._traceCollapsed, foldable: ai._traceCollapsed, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 });
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function lxfdAnimateFinal(ai, rawText) {
    const body = ai?.querySelector(".lxfd-ai-body");
    if (!body) return Promise.resolve();
    // 收尾把时间线折叠态 HTML 拼进最终正文——本函数会整体替换 ai-body，生成阶段的实时 DOM
    // 保不住，得随最终 html 一起进去才能存档/恢复时保持折叠（同 app.js sendChat done 收尾）。
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const traceHtml = (ai && ai._traceLines && ai._traceLines.length && renderTrace)
      ? renderTrace(ai._traceLines, { collapsed: true, foldable: true, skillCount: ai._traceSkills ? ai._traceSkills.size : 0 })
      : "";
    const html = traceHtml + mdLite(String(rawText || "").trim() || "我先为你整理好了相关内容。");
    ai.classList.add("lx-chat-skin");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      body.innerHTML = html;
      return Promise.resolve();
    }
    const loadingStarted = ai._loadingStarted || Date.now();
    if (!body.querySelector(".loading-line")) {
      body.innerHTML = '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在生成中...</span><span class="typing-cursor"></span></div>';
    } else {
      const typing = body.querySelector(".loading-line .typing-text");
      if (typing) typing.textContent = "联想乐享正在生成中...";
    }
    return new Promise((resolve) => {
      const waitTime = Math.max(0, 5000 - (Date.now() - loadingStarted));
      window.setTimeout(() => {
        const source = document.createElement("div");
        source.innerHTML = html;
        lxfdTypeNodes(source, body, 18, () => {
          window.setTimeout(() => {
            body.innerHTML = html;
            if (thread) thread.scrollTop = thread.scrollHeight;
            resolve();
          }, 140);
        });
      }, waitTime);
    });
  }

  function lxfdFetchFollowups(question, answer) {
    const q = String(question || "").trim();
    const a = String(answer || "").trim().slice(0, 300);
    if (!q || !a) return Promise.resolve([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2200);
    return fetch("/api/leai/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, a }),
      signal: controller.signal
    }).then((r) => r.json()).then((d) => {
      window.clearTimeout(timer);
      return Array.isArray(d && d.questions) ? d.questions.filter(Boolean).slice(0, 3) : [];
    }).catch(() => {
      window.clearTimeout(timer);
      return [];
    });
  }

  // 答后「猜你想干」动作 chips：生成器收口 app-intent.actionChips（主/全屏共用一份，
  // 生成的句子被本地正则秒接闭环）；lxfdFill3 保证无论 LLM 追问成败都凑满 3 个（静态兜底）
  function lxfdActionChips(products) {
    return (window.__lxIntent && window.__lxIntent.actionChips) ? window.__lxIntent.actionChips(products) : [];
  }
  function lxfdFill3(arr) {
    const fb = (window.__lxIntent && window.__lxIntent.FOLLOWUP_FALLBACKS) || [];
    const out = [];
    (arr || []).concat(fb).forEach((x) => { if (x && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }

  const lxfdWait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const lxfdIsDocumentInsight = (text) => /(文档解读|解读.*文档|分析.*(?:文档|文件|PDF)|提炼.*(?:文档|文件)|核心结论.*关键数据)/i.test(String(text || ""));

  async function lxfdRunDocumentInsight() {
    const renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._traceLines = [];
    ai._traceSkills = new Set(["Skill(文档解读)"]);
    ai.innerHTML = '<div class="lxfd-ai-body"><div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div></div>';
    thread?.appendChild(ai);
    chatState.sending = true;

    const body = ai.querySelector(".lxfd-ai-body");
    let showGenerating = true;
    const paintTrace = () => {
      if (!body) return;
      const trace = renderTrace
        ? renderTrace(ai._traceLines, { collapsed: false, foldable: false, skillCount: ai._traceSkills.size })
        : ai._traceLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
      const generating = showGenerating
        ? '<div class="loading-line lx-generating" role="status" aria-live="polite"><span class="typing-text">联想乐享正在分析文档并生成解读...</span><span class="typing-cursor"></span></div>'
        : "";
      body.innerHTML = trace + generating;
      thread.scrollTop = thread.scrollHeight;
    };
    const pushTrace = async (line, delay, hideGenerating) => {
      await lxfdWait(reduceMotion ? 0 : delay);
      if (hideGenerating) showGenerating = false;
      ai._traceLines.push(line);
      paintTrace();
    };

    thread.scrollTop = thread.scrollHeight;
    await pushTrace("联想乐享正在判断", 1240, true);
    await pushTrace("已判断：文档解读任务", 840);
    await pushTrace("联想乐享官方 SKILL：正在调用 Skill(文档解读)", 1040);
    await pushTrace("正在读取文档结构与正文", 1240);

    const traceHtml = renderTrace
      ? renderTrace(ai._traceLines.concat(["已完成文档内容提取"]), { collapsed: true, foldable: true, skillCount: ai._traceSkills.size })
      : "";
    body.innerHTML = traceHtml;
    thread.scrollTop = thread.scrollHeight;
    await lxfdWait(reduceMotion ? 0 : 3000);

    const answerHtml = '<p>我已读取文档内容，下面是重点解读。</p>'
      + '<h4>核心结论</h4><ul><li>文档围绕当前业务目标、实施路径与结果要求展开，主线清晰。</li><li>重点任务已拆分为可执行阶段，需继续确认责任人、时间节点和验收口径。</li></ul>'
      + '<h4>关键信息</h4><ul><li><strong>目标：</strong>统一信息口径，提升执行与协作效率。</li><li><strong>路径：</strong>按“准备—执行—验收—复盘”分阶段推进。</li><li><strong>交付：</strong>关键数据、任务清单与结果说明需保持可追溯。</li></ul>'
      + '<h4>待确认项</h4><ul><li>部分时间节点和负责人尚未明确，建议在正式执行前补齐。</li><li>涉及外部数据或政策的内容，建议再核对最新来源。</li></ul>';
    const extrasHtml = renderLxfdPageCta(lxfdPageCtaMeta("open_documents"))
      + '<div class="lxfd-followups"><button type="button">继续提取文档中的关键数据</button><button type="button">按章节生成详细摘要</button><button type="button">整理成可执行任务清单</button></div>';
    body.innerHTML = traceHtml;
    const answerSource = document.createElement("div");
    answerSource.innerHTML = answerHtml;
    const answerHost = document.createElement("div");
    answerHost.className = "lxfd-ai-text";
    body.appendChild(answerHost);
    if (reduceMotion) {
      answerHost.innerHTML = answerHtml;
    } else {
      await new Promise((resolve) => lxfdTypeNodes(answerSource, answerHost, 18, resolve));
    }
    answerHost.insertAdjacentHTML("afterend", extrasHtml);
    chatState.sending = false;
    thread.scrollTop = thread.scrollHeight;
    lxfdPersistCurrent();
    lxfdRenderHist();
    window.setTimeout(() => lxfdOpenFeatureInSplit("documents"), reduceMotion ? 0 : 600);
  }



  function lxfdIsNearbyStoreQuery(text) {
    const value = String(text || "").trim();
    return value.length <= 24 && !/预约|库存|营业|电话|服务权益|导航/.test(value) && /附近门店|联想门店|门店查询|查.{0,4}门店|找.{0,4}门店|推荐.{0,4}门店|^(门店|实体店|体验店|专卖店)$/.test(value);
  }

  async function lxfdRunUnifiedStoreAnswer() {
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的门店需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    await lxfdWait(420);
    ai._traceLines.push("已判断：需要查询当前位置附近的联想授权门店");
    lxfdRenderTraceLive(ai);
    await lxfdWait(520);
    ai._traceSkills.add("Skill(附近门店查询)");
    ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(附近门店查询)");
    lxfdRenderTraceLive(ai);
    await lxfdWait(760);
    ai._traceLines[ai._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(附近门店查询) 已完成";
    lxfdRenderTraceLive(ai);
    const copy = "我已结合**当前位置**为你整理附近的**联想授权门店**，优先推荐距离较近、营业时间明确且支持产品体验、库存咨询和到店服务的门店。你可以先查看下方推荐，再到右侧比较**地址、营业状态与联系方式**，并按需发起**导航或预约**。";
    await lxfdAnimateFinal(ai, copy);
    const body = ai.querySelector(".lxfd-ai-body");
    if (body) body.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "stores", title: "查看附近门店", desc: "已为你整理附近授权门店、距离与营业状态" }));
    lxfdPersistCurrent();
    await lxfdWait(reduceMotion ? 0 : 680);
    chatState.sending = false;
    lxfdExportToMain();
    exitFullscreenWithReveal(() => lxfdRevealFeature("stores"));
  }

  function lxfdEducationAuthKind(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 36) return "";
    if (!/教育|学生|在校生|教师|高考生/.test(value) || !/认证|认定|核验|教育认$/.test(value)) return "";
    if (/高考生/.test(value)) return "gaokao";
    if (/教师/.test(value)) return "teacher";
    return "college";
  }

  function lxfdIsWorkplaceAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 36 && /职场|职场人|在职|工作|员工|企业职工/.test(value) && /认证|认定|核验|职场认$/.test(value);
  }

  function lxfdIsEnterpriseMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 48
      && /企业会员|企业身份|企业账户|企业采购负责人|企业认证/.test(value)
      && /认证|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseDiamondMemberAuthQuery(text) {
    const value = String(text || "").trim();
    return !!value && value.length <= 56
      && /企业钻石会员|钻石企业会员|企业会员.{0,6}钻石/.test(value)
      && /认证|升级|申请|开通|办理|核验|加入/.test(value);
  }

  function lxfdIsEnterpriseLeadQuery(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 48) return false;
    const directLead = /^(?:我要|我想|帮我|现在)?(?:进行|提交|填写|办理|发起)?(?:企业|采购|项目)?留资(?:申请|信息|表单)?$/.test(value);
    const enterpriseIntent = /企业留资|企业咨询|采购留资|项目留资|提交(?:企业|采购|项目)需求|联系企业顾问|企业合作咨询/.test(value);
    return directLead || enterpriseIntent;
  }

  function lxfdEnterpriseLeadCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-enterprise-lead-reco" type="button" data-open-enterprise-lead data-lx-result-id="modal:enterprise-lead" aria-label="打开企业留资弹窗" aria-pressed="false"><span class="answer-cta-title">提交企业留资</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedEnterpriseLeadAnswer() {
    chatState.sending = true;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-auth-flow-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的企业留资需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await lxfdWait(reduceMotion ? 0 : 420);
      ai._traceLines.push("已判断：需要进入企业采购需求留资流程");
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 520);
      const skillName = "Skill(企业采购需求留资)";
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 760);
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = "提交**企业采购需求**后，联想企业顾问可结合采购规模、预算、应用场景与交付周期提供进一步支持。请准备**联系人、联系方式及需求说明**，提交前核对关键信息，后续沟通以企业顾问联系为准。";
      await lxfdAnimateFinal(ai, copy);
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdEnterpriseLeadCard());
      const card = body?.querySelector(".lx-enterprise-lead-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await new Promise((resolve) => {
        if (!card || reduceMotion) { requestAnimationFrame(() => requestAnimationFrame(resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.setTimeout(done, 700);
      });
      window.openLeadPanel?.();
    } finally {
      chatState.sending = false;
      lxfdPersistCurrent();
    }
  }

  function lxfdAuthRecommendationCard(type, kind) {
    if (type === "enterprise" || type === "enterprise-diamond") {
      const label = type === "enterprise-diamond" ? "认证企业钻石会员" : "立即认证企业会员";
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-enterprise-auth-reco" type="button" data-open-enterprise-auth-modal data-lx-result-id="modal:enterprise-member-auth" aria-label="打开企业会员认证弹窗" aria-pressed="false"><span><span class="answer-cta-title">${label}</span></span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    if (type === "workplace") {
      return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-workplace-auth-reco" type="button" data-open-wpa data-lx-result-id="modal:workplace-auth" aria-label="打开职场身份认证弹窗" aria-pressed="false"><span class="answer-cta-title">职场认证</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
    }
    const label = kind === "gaokao" ? "高考生教育认证" : (kind === "teacher" ? "教师教育认证" : "教育认证");
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco" type="button" data-open-stuauth="${escapeAttr(kind)}" data-lx-result-id="modal:education-auth:${escapeAttr(kind)}" aria-label="打开${escapeAttr(label)}弹窗" aria-pressed="false"><span class="answer-cta-title">${escapeHtml(label)}</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  function lxfdIsDiscountOrderQuery(text) {
    const value = String(text || "").trim();
    return /(?:领取|使用).{0,8}(?:全部|所有|可用)?.{0,8}优惠|(?:全部|所有|可用).{0,8}优惠.{0,8}(?:下单|订单)|待支付订单/.test(value) && /购买|下单|订单|支付/.test(value);
  }

  function lxfdPaymentRecommendationCard() {
    return `<button class="answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-payment-confirm-reco" type="button" data-open-payment-confirm data-lx-result-id="modal:pending-payment" aria-label="打开待支付订单弹窗" aria-pressed="false"><span class="answer-cta-title">待支付订单</span><span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span></button>`;
  }

  async function lxfdRunUnifiedDiscountOrderAnswer() {
    const product = window.__lxState?._pendingDiscountOrderProduct || window.__lxState?.currentProduct;
    if (!product || !window.__lxAgentAPI?.lxPreparePendingPayment) {
      const ai = document.createElement("div");
      ai.className = "lxfd-msg-ai lx-chat-skin";
      ai.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(ai);
      await lxfdAnimateFinal(ai, "请先打开一款商品详情，我再为你领取全部可用优惠并生成待支付订单。");
      return;
    }
    chatState.sending = true;
    const prepared = window.__lxAgentAPI.lxPreparePendingPayment(product);
    const claimed = Array.isArray(prepared?.claimed) ? prepared.claimed : [];
    const item = prepared?.item || product;
    const saved = Math.abs(Number(prepared?.discount) || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin lx-payment-confirm-answer";
    ai._loadingStarted = Date.now();
    ai._traceLines = ["联想乐享正在判断你的优惠下单需求"];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await lxfdWait(reduceMotion ? 0 : 420);
      ai._traceLines.push(`已判断：需要核对${item.name || "当前商品"}与当前账户可用优惠`);
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 520);
      ai._traceSkills.add("Skill(优惠领取与订单生成)");
      ai._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(优惠领取与订单生成)");
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 760);
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：已自动领取全部 ${claimed.length} 项可用优惠`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = claimed.length
        ? `已为你自动领取**${claimed.length}项可用优惠**，共节省¥${saved}。商品、优惠与收货信息已核对，请在**待支付订单**中确认后继续。`
        : "当前商品暂无可叠加优惠，已按现价生成订单。商品与收货信息已核对，请在**待支付订单**中确认后继续。";
      await lxfdAnimateFinal(ai, copy);
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdPaymentRecommendationCard());
      const card = body?.querySelector(".lx-payment-confirm-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await new Promise((resolve) => {
        if (!card || reduceMotion) { requestAnimationFrame(() => requestAnimationFrame(resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.setTimeout(done, 700);
      });
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
    } finally {
      chatState.sending = false;
      lxfdPersistCurrent();
    }
  }

  async function lxfdRunUnifiedAuthAnswer(type, kind = "college") {
    chatState.sending = true;
    const isWorkplace = type === "workplace";
    const isDiamond = type === "enterprise-diamond";
    const isEnterprise = type === "enterprise" || isDiamond;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai lx-chat-skin";
    ai._loadingStarted = Date.now();
    ai._traceLines = [isDiamond ? "联想乐享正在判断你的企业钻石会员升级需求" : (isEnterprise ? "联想乐享正在判断你的企业会员认证需求" : (isWorkplace ? "联想乐享正在判断你的职场认证需求" : "联想乐享正在判断你的教育认证需求"))];
    ai._traceSkills = new Set();
    ai.innerHTML = '<div class="lxfd-ai-body"></div>';
    thread?.appendChild(ai);
    lxfdRenderTraceLive(ai);
    try {
      await lxfdWait(reduceMotion ? 0 : 420);
      ai._traceLines.push(isDiamond ? "已判断：需要进入企业钻石会员升级认证流程" : (isEnterprise ? "已判断：需要进入企业采购负责人认证流程" : (isWorkplace ? "已判断：需要进入企业在职身份认证流程" : "已判断：需要进入教育身份认证流程")));
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 520);
      const skillName = isDiamond ? "Skill(企业钻石会员升级认证)" : (isEnterprise ? "Skill(企业会员身份认证)" : (isWorkplace ? "Skill(职场身份认证)" : "Skill(教育身份认证)"));
      ai._traceSkills.add(skillName);
      ai._traceLines.push(`联想乐享官方 SKILL：正在调用 ${skillName}`);
      lxfdRenderTraceLive(ai);
      await lxfdWait(reduceMotion ? 0 : 760);
      ai._traceLines[ai._traceLines.length - 1] = `联想乐享官方 SKILL：${skillName} 已完成`;
      ai._traceCollapsed = true;
      lxfdRenderTraceLive(ai);
      const copy = isDiamond
        ? "完成**企业钻石会员升级认证**后，可进一步解锁企业专享采购权益、专属服务与会员支持。请准备**企业名称、统一社会信用代码及企业邮箱**，提交后以正式核验结果为准。"
        : isEnterprise
        ? "完成**企业会员认证**后，可解锁企业专享价、采购补贴、对公付款及专票账期等权益。请准备企业名称与采购负责人信息，提交后以正式核验结果为准。"
        : isWorkplace
        ? "**职场认证**可用于核验企业在职身份，并解锁员工购机优惠、会员权益及相关服务。请按真实情况填写个人与企业资料，提交前核对**企业信息与在职材料**，认证结果以正式身份核验信息为准。"
        : "**教育认证**可用于核验在校生、教师或高考生身份，并解锁教育专享价格与会员权益。请按真实身份选择认证方式并填写资料，提交前核对**适用范围、有效期和材料**，结果以正式核验信息为准。";
      ai.classList.add("lx-auth-flow-answer");
      await lxfdAnimateFinal(ai, copy);
      const body = ai.querySelector(".lxfd-ai-body");
      if (body) body.insertAdjacentHTML("beforeend", lxfdAuthRecommendationCard(type, kind));
      const card = body?.querySelector(".lx-edu-auth-reco");
      card?.classList.add("lx-document-card-enter");
      lxfdPersistCurrent();
      await new Promise((resolve) => {
        if (!card || reduceMotion) { requestAnimationFrame(() => requestAnimationFrame(resolve)); return; }
        const done = () => resolve();
        card.addEventListener("animationend", done, { once: true });
        window.setTimeout(done, 700);
      });
      if (isEnterprise) window.__lxOpenEnterpriseAuthModal?.();
      else if (isWorkplace) window.openWorkplaceAuth?.();
      else window.__lxAgentAPI?.openStudentAuth?.(kind);
    } finally {
      chatState.sending = false;
      lxfdPersistCurrent();
    }
  }

  async function submit(text) {
    const value = String(text || "").trim();
    if (!value || chatState.sending) return;
    if (typeof window.__lxRequireQueryAccess === "function" && !window.__lxRequireQueryAccess()) return;
    // 用户真正发出下一条消息后，新会话成立，恢复正常持久化。
    try { localStorage.removeItem("lexiang.newChatEmpty.v1"); } catch (_e) {}
    // 发送问题时强制收起顶部灵动岛，保持与首页项目一致的紧凑标题态：
    // 「首页：当前问题 + 下拉箭头」。避免用户刚操作过导航时把整排频道带进对话态。
    setNav(false);
    convoPill?.blur();
    // 本轮桥接状态（全屏→分屏）
    let turnProducts = null;
    let turnTitle = "";
    let turnGrouped = false;
    let turnActions = []; // 本轮意图操作（action 事件带来的 op）——多意图一轮可能来多个（门店+优惠+会员），全记录，桥接后全开
    let pendingExtras = "";
    let pendingFollowups = [];
    let finalized = false;
    let finalizePromise = null;
    lxfdArchiveClaimProgressCards(thread);
    try { window.__lxHideSuggest && window.__lxHideSuggest(); } catch (_e) {} // 发送即收起输入联想浮层（程序性清空不触发 input，不收会残留）
    thread?.querySelectorAll(".lxfd-followups, .followups, .lx-p0-suggest[data-followups]").forEach((el) => el.remove());
    // 开始聊天后隐藏 actionbar（对齐官方；客服模式下 enterHuman 会恢复）
    if (!chatState.started && !chatState.human) {
      chatState.started = true;
      if (quick) quick.style.display = "none";
    }
    setFullscreen(true);
    lxfdSetGalleryChatting(true);
    if (welcome) welcome.style.display = "none";
    thread?.classList.add("show");
    if (convoName) { convoName.textContent = shortText(value, 15); convoName.title = value; }
    // 全屏欢迎态首问=新对话：thread 还没有任何消息（非历史恢复/非分屏回流）说明用户从初始
    // 首页重新开聊，清掉主面板 boot 时 restore 的旧对话上下文，首问不背"以上为历史对话"的
    // 旧账（真机反馈）；旧对话在侧栏历史归档里可找回。
    if (thread && !thread.querySelector(".lxfd-msg-user, .lxfd-msg-ai")) {
      chatState.convId = null;
      if (window.__lxBridge && typeof window.__lxBridge.resetConversationContext === "function") window.__lxBridge.resetConversationContext();
    }
    const turnId = "turn-" + Date.now() + "-" + turns.length;
    const user = document.createElement("div");
    user.className = "lxfd-msg-user";
    user.id = turnId;
    user.textContent = value;
    thread?.appendChild(user);
    turns.push({ id: turnId, text: value });
    renderTurnIndex(turnId);
    if (ta) { ta.value = ""; fit(); syncSend(); }
    // 发出提问就先存一次（含 lxfd key + 同步子站 key），AI 答完再存完整——避免答得慢时切站啥都没存
    try { lxfdPersistCurrent(); } catch (_e) {}

    const educationAuthKind = lxfdEducationAuthKind(value);
    if (lxfdIsDiscountOrderQuery(value)) {
      await lxfdRunUnifiedDiscountOrderAnswer();
      return;
    }
    if (educationAuthKind) {
      await lxfdRunUnifiedAuthAnswer("education", educationAuthKind);
      return;
    }
    if (lxfdIsEnterpriseLeadQuery(value)) {
      await lxfdRunUnifiedEnterpriseLeadAnswer();
      return;
    }
    if (lxfdIsWorkplaceAuthQuery(value)) {
      await lxfdRunUnifiedAuthAnswer("workplace");
      return;
    }
    if (lxfdIsEnterpriseDiamondMemberAuthQuery(value)) {
      await lxfdRunUnifiedAuthAnswer("enterprise-diamond");
      return;
    }
    if (lxfdIsEnterpriseMemberAuthQuery(value)) {
      await lxfdRunUnifiedAuthAnswer("enterprise");
      return;
    }

    const serviceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    if (serviceProductFollowup) {
      chatState.sending = true;
      const products = typeof window.__lxServiceRecommendationProducts === "function" ? window.__lxServiceRecommendationProducts() : [];
      const region = (value.match(/所在地区是(.+?)，请推荐/) || [])[1] || "当前地区";
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      try {
        await lxfdAnimateFinal(serviceAi, `已按“拯救者游戏本 + **${region}** + **深度清灰/换硅脂**”匹配服务商品。你可以比较服务内容、适用性与预约方式。`);
        const body = serviceAi.querySelector(".lxfd-ai-body");
        if (body) body.insertAdjacentHTML("beforeend", renderLxfdProducts(products, { serviceProduct: true }));
        const card = body?.querySelector("[data-lxfd-reco-id]");
        const recoId = card?.getAttribute("data-lxfd-reco-id") || "";
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        lxfdPersistCurrent();
        lxfdExportToMain();
        await lxfdWait(reduceMotion ? 0 : 560);
        exitFullscreenWithReveal(() => window.__lxBridge?.revealProducts?.(products, { title: "推荐服务产品", recoId }));
      } finally {
        chatState.sending = false;
      }
      return;
    }

    if (/^我的设备[。！!]?$/.test(value)) {
      chatState.sending = true;
      const deviceAi = document.createElement("div");
      deviceAi.className = "lxfd-msg-ai lx-chat-skin lx-device-query-answer";
      deviceAi._loadingStarted = Date.now();
      deviceAi._traceLines = ["联想乐享正在判断你的设备资产需求"];
      deviceAi._traceSkills = new Set();
      deviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(deviceAi);
      lxfdRenderTraceLive(deviceAi);
      deviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdWait(reduceMotion ? 0 : 420);
      deviceAi._traceLines.push("已判断：需要查询当前 Lenovo ID 下的设备资产");
      lxfdRenderTraceLive(deviceAi);
      await lxfdWait(reduceMotion ? 0 : 520);
      deviceAi._traceSkills.add("Skill(设备资产查询)");
      deviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(设备资产查询)");
      lxfdRenderTraceLive(deviceAi);
      await lxfdWait(reduceMotion ? 0 : 760);
      deviceAi._traceLines[deviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(设备资产查询) 已完成";
      deviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(deviceAi);
      await lxfdAnimateFinal(deviceAi, "当前账号共有**8 台已绑定设备**，另有**1 台待绑定**。最近使用的是 ThinkBook 16p、拯救者 Y7000P、YOGA Air 14s；右侧已打开设备列表。");
      const deviceBody = deviceAi.querySelector(".lxfd-ai-body");
      if (deviceBody) deviceBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "devices", title: "查看我的设备", desc: "8 台已绑定 · 1 台待绑定" }));
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      lxfdExitToResultAtomically(() => {
        lxfdEnsureRootSplitState();
        if (typeof window.__lxOpenDevicesResult === "function") window.__lxOpenDevicesResult();
        else lxfdRevealFeature("devices");
      });
      return;
    }

    if (lxfdIsNearbyStoreQuery(value)) {
      await lxfdRunUnifiedStoreAnswer();
      return;
    }

    if (typeof window.__lxIsServiceIntakeQuery === "function" ? window.__lxIsServiceIntakeQuery(value) : /清灰|除尘|换硅脂|散热保养/.test(value)) {
      chatState.sending = true;
      const serviceAi = document.createElement("div");
      serviceAi.className = "lxfd-msg-ai lx-chat-skin";
      serviceAi._loadingStarted = Date.now();
      serviceAi._traceLines = ["联想乐享正在判断你的设备服务需求"];
      serviceAi._traceSkills = new Set();
      serviceAi._traceCollapsed = false;
      serviceAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(serviceAi);
      lxfdRenderTraceLive(serviceAi);
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdWait(reduceMotion ? 0 : 420);
      serviceAi._traceLines.push("已判断：清灰/换硅脂服务商品匹配");
      lxfdRenderTraceLive(serviceAi);
      await lxfdWait(reduceMotion ? 0 : 520);
      serviceAi._traceSkills.add("Skill(服务产品推荐)");
      serviceAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(服务产品推荐)");
      lxfdRenderTraceLive(serviceAi);
      await lxfdWait(reduceMotion ? 0 : 760);
      serviceAi._traceLines[serviceAi._traceLines.length - 1] = "联想乐享官方 SKILL：Skill(服务产品推荐) 已完成";
      serviceAi._traceCollapsed = true;
      lxfdRenderTraceLive(serviceAi);
      await lxfdAnimateFinal(serviceAi, "已经明确是**清灰/换硅脂服务**。还需要确认**目标设备和所在地区**，才能匹配可购买、可预约的服务商品。");
      const serviceBody = serviceAi.querySelector(".lxfd-ai-body");
      const choices = window.__lxServiceIntake && window.__lxServiceIntake.renderChoices ? window.__lxServiceIntake.renderChoices() : "";
      if (serviceBody && choices) serviceBody.insertAdjacentHTML("beforeend", choices);
      lxfdPersistCurrent();
      lxfdRenderHist();
      chatState.sending = false;
      serviceAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      return;
    }

    if (/代金券/.test(value)) {
      chatState.sending = true;
      const voucherAi = document.createElement("div");
      voucherAi.className = "lxfd-msg-ai";
      voucherAi._loadingStarted = Date.now() - 5000;
      voucherAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(voucherAi);
      voucherAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdAnimateFinal(voucherAi, "已为你查询当前账户的**代金券资产**：共有 2 张可用券，分别适用于教育认证与以旧换新场景。你可以继续查看券面金额、适用范围和使用条件。");
      const voucherBody = voucherAi.querySelector(".lxfd-ai-body");
      if (voucherBody) {
        voucherBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "vouchers", title: "查看代金券详情", desc: "2 张可用 · 教育认证 / 以旧换新" }));
        voucherBody.querySelector('[data-lx-result-id="info:vouchers"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("vouchers"));
      return;
    }

    if (/限时红包|会员日红包|首发红包/.test(value)) {
      chatState.sending = true;
      const redPacketAi = document.createElement("div");
      redPacketAi.className = "lxfd-msg-ai";
      redPacketAi._loadingStarted = Date.now() - 5000;
      redPacketAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(redPacketAi);
      redPacketAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdAnimateFinal(redPacketAi, "已为你查询当前账户的**限时红包资产**：现有 2 个红包，合计 ¥84，其中 1 个将在明日到期。你可以继续查看适用活动、有效期与使用范围。");
      const redPacketBody = redPacketAi.querySelector(".lxfd-ai-body");
      if (redPacketBody) {
        redPacketBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "redpacket", title: "查看限时红包详情", desc: "2 个可用 · 合计 ¥84 · 1 个明日到期" }));
        redPacketBody.querySelector('[data-lx-result-id="info:redpacket"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("redpacket"));
      return;
    }

    if (/优惠券/.test(value)) {
      chatState.sending = true;
      const couponAi = document.createElement("div");
      couponAi.className = "lxfd-msg-ai";
      couponAi._loadingStarted = Date.now() - 5000;
      couponAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(couponAi);
      couponAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdAnimateFinal(couponAi, "已为你查询当前账户的**优惠券资产**：共有 3 张可用券，其中 1 张将在 7 天后到期。你可以查看每张券的使用门槛、适用范围和有效期。");
      const couponBody = couponAi.querySelector(".lxfd-ai-body");
      if (couponBody) {
        couponBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "coupon", title: "查看优惠券详情", desc: "3 张可用 · 1 张即将到期" }));
        couponBody.querySelector('[data-lx-result-id="info:coupon"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("coupon"));
      return;
    }

    if (/乐豆|积分余额|乐豆余额/.test(value)) {
      chatState.sending = true;
      const pointsAi = document.createElement("div");
      pointsAi.className = "lxfd-msg-ai";
      pointsAi._loadingStarted = Date.now() - 5000;
      pointsAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(pointsAi);
      pointsAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdAnimateFinal(pointsAi, "已为你查询当前账户的**乐豆资产**：现有 2,580 乐豆，近 30 天获得 860、使用 300。你可以继续查看获取与使用记录，以及当前适用规则。");
      const pointsBody = pointsAi.querySelector(".lxfd-ai-body");
      if (pointsBody) {
        pointsBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "points", title: "查看乐豆详情", desc: "可用 2,580 · 近 30 天 +860 / -300" }));
        pointsBody.querySelector('[data-lx-result-id="info:points"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("points"));
      return;
    }

    if (/会员/.test(value)) {
      chatState.sending = true;
      const profile = typeof window.__lxMemberQueryProfile === "function"
        ? window.__lxMemberQueryProfile()
        : { copy: "当前为**铂金会员**，乐豆余额**8,860豆**，可用于抵现和兑换好礼；等级权益、任务与会员活动已为你整理。", cardDesc: "会员等级 · 乐豆 · 权益与任务" };
      const memberAi = document.createElement("div");
      memberAi.className = "lxfd-msg-ai";
      memberAi._loadingStarted = Date.now() - 5000;
      memberAi.innerHTML = '<div class="lxfd-ai-body"></div>';
      thread?.appendChild(memberAi);
      memberAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      await lxfdAnimateFinal(memberAi, profile.copy);
      const memberBody = memberAi.querySelector(".lxfd-ai-body");
      if (memberBody) {
        memberBody.insertAdjacentHTML("beforeend", renderLxfdPageCta({ feature: "member", title: "查看会员中心", desc: profile.cardDesc }));
        memberBody.querySelector('[data-lx-result-id="info:member"]')?.classList.add("lx-document-card-enter");
      }
      lxfdPersistCurrent();
      await lxfdWait(reduceMotion ? 0 : 720);
      chatState.sending = false;
      lxfdExportToMain();
      exitFullscreenWithReveal(() => lxfdRevealFeature("member"));
      return;
    }

    // 文档解读是全屏对话内的生成任务，不走 open_documents 页面跳转快路径。
    if (lxfdIsDocumentInsight(value)) {
      await lxfdRunDocumentInsight();
      return;
    }

    // ── lxfd 意图路由分流 ──────────────────────────────────────────────
    // 0. 全权代买（多步任务链）意图：只做标记，不再立即退全屏（真机反馈：还没开始推流就切左右
    //    结构，右侧只有个光秃秃商城首页很突兀）。改为和普通提问一致——留在全屏走官方流式，
    //    用户看完整推荐回答；done 桥接分屏时才起链（officialWait 直接给已到手的商品，链 step1
    //    秒过），「对比→选款→下单」的执行视图在有内容可看时才出现。
    const _lxfdServiceProductFollowup = /^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(value);
    const _lxfdAutoBuy = !_lxfdServiceProductFollowup && window.__lxIntent && window.__lxIntent.matchAutoBuy ? window.__lxIntent.matchAutoBuy(value) : null;

    // 1. 本地快路径（正则统一收口 app-intent.js，主面板/全屏共用一份，改一处两边同时生效）
    // 代买时跳过：句里"对比/下单"字样会被误判成 control 操作抢断官方推荐流（同主面板 _autoBuy 防护）
    const _lxfdLocalCtrl = !_lxfdAutoBuy && window.__lxIntent ? window.__lxIntent.matchControl(value) : null;
    if (_lxfdLocalCtrl) {
      if (_lxfdLocalCtrl.op === "open_solution") {
        const solutionAi = document.createElement("div");
        solutionAi.className = "lxfd-msg-ai";
        solutionAi._loadingStarted = Date.now();
        solutionAi._traceLines = ["联想乐享正在判断"];
        solutionAi._traceSkills = new Set();
        solutionAi._traceCollapsed = false;
        solutionAi.innerHTML = '<div class="lxfd-ai-body"></div>';
        thread?.appendChild(solutionAi);
        lxfdRenderTraceLive(solutionAi);
        solutionAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });

        await lxfdWait(reduceMotion ? 0 : 520);
        solutionAi._traceLines.push("已判断：全集解决方案检索任务");
        lxfdRenderTraceLive(solutionAi);
        await lxfdWait(reduceMotion ? 0 : 680);
        solutionAi._traceSkills.add("Skill(解决方案推荐)");
        solutionAi._traceLines.push("联想乐享官方 SKILL：正在调用 Skill(解决方案推荐)");
        lxfdRenderTraceLive(solutionAi);
        await lxfdWait(reduceMotion ? 0 : 760);
        solutionAi._traceLines.push("已完成：行业方案全集与分类楼层已生成");
        solutionAi._traceCollapsed = true;
        lxfdRenderTraceLive(solutionAi);

        const solutionCopy = [
          "我已为你汇总**乐享全集解决方案**，覆盖教育、医疗、政府、制造、金融、能源、交通和服务八大行业。",
          "每个行业都按照**独立楼层**组织，并结合核心业务场景、终端部署、基础设施与持续服务，方便你快速浏览和比较。",
          "你可以进入全集后**按行业标签定位**；当前视口会在每个楼层单排自适应展示 4–6 个方案。"
        ].join("\n\n");
        await lxfdAnimateFinal(solutionAi, solutionCopy);
        const solutionMeta = lxfdPageCtaMeta("open_solution");
        const solutionBody = solutionAi.querySelector(".lxfd-ai-body");
        if (solutionBody && solutionMeta) {
          solutionBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(solutionMeta));
          const solutionCard = solutionBody.querySelector('[data-lxfd-open-feature="solution"]');
          if (solutionCard) {
            solutionCard.classList.add("is-active");
            solutionCard.setAttribute("aria-pressed", "true");
          }
        }
        lxfdPersistCurrent();
        await lxfdWait(reduceMotion ? 0 : 720);
        lxfdExportToMain();
        exitFullscreenWithReveal(() => lxfdRevealFeature("solution"));
        return;
      }
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      _lxfdCtrlText.textContent = _lxfdLocalCtrl.msg;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      // 执行操作：通过 __lxExecControl 桥（全屏态 lxExecControl 不在此作用域）
      const _execOp = _lxfdLocalCtrl.op;
      const _execTarget = _lxfdLocalCtrl.target;
      const _execPageMeta = lxfdPageCtaMeta(_execOp);
      if (_execPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_execPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_execPageMeta.feature);
        });
        return;
      }
      if (_execOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_execOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_execOp, _execTarget);
      }
      return;
    }

    // 思考过程时间线（件2）：气泡必须在远程意图路由 fetch **之前**上屏——路由最长 4.5s，
    // 放在后面用户盯着空白（真机反馈）。首行"正在判断"发送瞬间出现，"已判断"等路由分流
    // 落定再追加（走 control 分支时整个气泡移除）。渲染复用主面板 renderSkillTrace 桥接。
    const _traceLines = ["联想乐享正在判断"]; // 省略号由 .current::after 三点循环动画补，文本不写死
    const _renderTrace = window.__lxBridge && window.__lxBridge.renderSkillTrace;
    const ai = document.createElement("div");
    ai.className = "lxfd-msg-ai";
    ai.innerHTML = `<div class="lxfd-ai-body">${_renderTrace ? _renderTrace(_traceLines, { collapsed: false, foldable: false, skillCount: 0 }) : ""}</div>`;
    ai._raw = "";
    ai._loadingStarted = Date.now();
    ai._traceLines = _traceLines;
    ai._traceSkills = new Set();
    ai._traceCollapsed = false;
    ai._traceLastRaw = "";
    thread?.appendChild(ai);
    ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    const _lxfdPushJudged = () => {
      if (ai._judgedPushed) return;
      ai._judgedPushed = true;
      _traceLines.push(_lxfdAutoBuy ? "已判断：多步代买任务，推荐完成后进入执行视图" : "已判断：商品咨询 → 调用联想乐享官方 SKILL");
      lxfdRenderTraceLive(ai);
    };

    // 2. 远程意图路由器（代买时跳过：分类器可能把"选/下单"误判成 control 操作抢断推荐流，同主面板）
    let _lxfdIntentResult = null;
    if (!_lxfdAutoBuy) try {
      const _lxfdIntentAbort = new AbortController();
      const _lxfdIntentTimer = setTimeout(() => _lxfdIntentAbort.abort(), 4500);
      const _lxfdIntentRes = await fetch("/api/leai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: _lxfdIntentAbort.signal
      });
      clearTimeout(_lxfdIntentTimer);
      if (_lxfdIntentRes.ok) _lxfdIntentResult = await _lxfdIntentRes.json();
    } catch (_lxfdIntentErr) { /* 超时/失败 → 降级 chat */ }
    if (_lxfdIntentResult && _lxfdIntentResult.type === "control" && _lxfdIntentResult.op) {
      ai.remove(); // 操作指令：撤掉"正在判断"时间线气泡，走操作确认消息（同主面板做法）
      const _lxfdCtrlAi = document.createElement("div");
      _lxfdCtrlAi.className = "lxfd-msg-ai";
      const _lxfdCtrlBody = document.createElement("div");
      _lxfdCtrlBody.className = "lxfd-ai-body";
      const _lxfdCtrlText = document.createElement("div");
      _lxfdCtrlText.className = "lxfd-ai-text";
      const _lxfdOpNames = { close_all_tabs: "关闭了所有页面标签", close_other_tabs: "关闭了其他标签，只留当前", go_home: "回到了首页", open_cart: "打开了购物车", open_orders: "打开了订单页面", open_member: "打开了会员中心", open_coupon: "打开了优惠券中心", open_stores: "打开了门店查询", open_edu_zone: "打开了教育专区", open_documents: "打开了文档解读与资料中心", open_product: `正在帮你打开「${_lxfdIntentResult.target || "该商品"}」`, enter_fullscreen: "切换到全屏对话模式（当前已在全屏）", exit_fullscreen: "退出了全屏模式" };
      _lxfdCtrlText.textContent = `好的，已为你${_lxfdOpNames[_lxfdIntentResult.op] || "执行了操作"}。`;
      _lxfdCtrlBody.appendChild(_lxfdCtrlText);
      _lxfdCtrlAi.appendChild(_lxfdCtrlBody);
      thread?.appendChild(_lxfdCtrlAi);
      _lxfdCtrlAi.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
      const _lxfdExecOp = _lxfdIntentResult.op;
      const _lxfdExecTarget = _lxfdIntentResult.target || "";
      const _lxfdPageMeta = lxfdPageCtaMeta(_lxfdExecOp);
      if (_lxfdPageMeta) {
        _lxfdCtrlBody.insertAdjacentHTML("beforeend", renderLxfdPageCta(_lxfdPageMeta));
        lxfdExportToMain();
        exitFullscreenWithReveal(() => {
          lxfdRevealFeature(_lxfdPageMeta.feature);
        });
        return;
      }
      if (_lxfdExecOp === "enter_fullscreen") { /* 全屏态已全屏，无需操作 */ }
      else if (_lxfdExecOp === "exit_fullscreen") {
        if (typeof window.__lxBridge?.exitFullscreen === "function") window.__lxBridge.exitFullscreen();
      } else if (typeof window.__lxBridge?.execControl === "function") {
        window.__lxBridge.execControl(_lxfdExecOp, _lxfdExecTarget);
      }
      return;
    }
    // ── lxfd 意图路由分流结束 ─────────────────────────────────────────

    // 走到这里说明不是操作指令：补"已判断"行——意图路由刚落定，天然有 0.5~4.5s 节奏，
    // 不和首行同帧蹦出；代买跳过了意图路由没有天然节奏，给 500ms 微延迟（同主面板做法）。
    if (_lxfdAutoBuy) setTimeout(_lxfdPushJudged, 500); else _lxfdPushJudged();
    const body = ai.querySelector(".lxfd-ai-body");
    const nonce = chatState.conversationNonce;
    chatState.sending = true;
    let hasContent = false;
    const revealAi = () => {
      if (hasContent) return;
      hasContent = true;
      body?.querySelector(".lxfd-typing, .loading-line")?.remove();
      ai._textBox = document.createElement("div");
      ai._textBox.className = "lxfd-ai-text";
      if (body) body.insertBefore(ai._textBox, body.firstChild);
      ai._raw = "";
      ai._writer = window.__lxCreateTypewriter(ai._textBox, {
        charsPerTick: 1,
        interval: 24,
        scroll: () => {
          if (thread) thread.scrollTop = thread.scrollHeight;
        }
      });
    };
    // lxfd 前端兜底超时：50秒后强制解锁
    const _lxfdSendTimeout = setTimeout(() => {
      if (chatState.sending && chatState.conversationNonce === nonce) {
        chatState.sending = false;
        ai._raw = "响应超时，请重试。";
        lxfdAnimateFinal(ai, ai._raw);
      }
    }, 50000);
    try {
      chatState._fallbackFired = false;
      // 代买句剥成交短语再发官方（「直接下单」会触发官方下单 Skill 不回商品清单），收口 app-intent 与主面板共用
      const _lxfdAskText = _lxfdAutoBuy && window.__lxIntent && window.__lxIntent.stripPurchasePhrase
        ? window.__lxIntent.stripPurchasePhrase(value)
        : value;
      const sendMsg = chatState.human
        ? ('[系统提示: 请以"专属客服小联"身份回复, 像人工客服一样亲切自然简短直接, 不用 markdown/列表/标题, 不暴露 AI 身份, 严禁输出"QA对""知识库""参考资料"等内部字样或📎等标记。]\n\n用户问: ' + value)
        : _lxfdAskText;
      const lxfdImgUrl = window.__lxfdPendingImage || undefined;
      window.__lxfdPendingImage = null;
      const imgTipEl = document.querySelector('.lxfd-img-tip');
      if (imgTipEl) imgTipEl.remove();
      const lxfdUseHuoshan = !!lxfdImgUrl || !!window.__lxWebSearch;
      const response = lxfdUseHuoshan
        ? await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              image_url: lxfdImgUrl,
              web_search: !!window.__lxWebSearch,
              thinking_mode: !!window.__lxThinking,
              conv_id: chatState.convId || undefined
            })
          })
        : await fetch("/api/leai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: sendMsg,
              sessionId: chatState.convId || undefined,
              site: document.body.dataset.page || 'personal',
              enableThinking: !!window.__lxThinking,
              ...(window.__lxGeo || {})
            })
          });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const lxfdHandlers = {
        chunk: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          const content = payload.text || data || "";
          if (/^\s*params\s*error\.?\s*$/i.test(content)) return;
          if (!content) return;
          // 首个 chunk 到达：思考过程时间线收起成一行摘要条，把舞台让给正文（同主面板）
          if (!ai._traceCollapsed) { ai._traceCollapsed = true; lxfdRenderTraceLive(ai); }
          hasContent = true;
          ai._raw += content;
        },
        status: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
          if (payload.text) {
            const raw = String(payload.text);
            if (raw !== ai._traceLastRaw) { // 去重相邻重复（官方 status 流常见连续重复 ping）
              ai._traceLastRaw = raw;
              const skillMatch = raw.match(/^(正在获取数据|已获取数据):(Skill\(.+\))$/);
              let line = raw;
              if (skillMatch) {
                ai._traceSkills.add(skillMatch[2]);
                line = skillMatch[1] === "正在获取数据"
                  ? `联想乐享官方 SKILL：正在调用 ${skillMatch[2]}`
                  : `联想乐享官方 SKILL：${skillMatch[2]} 已完成`;
              }
              ai._traceLines.push(line);
              lxfdRenderTraceLive(ai);
            }
          }
        },
        products: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          let products = payload.products || [];
          // 用户点名要N款(2-6)而官方固定回5-6款 → 按要求截断
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (!products.length) return;
          hasContent = true;
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品以便 done 时桥接到主面板
          turnProducts = products;
          chatState.lastProducts = products;
          chatState.lastProductsMeta = { title: "AI 推荐", grouped: false };
        },
        display: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          let products = payload.products || payload.items || [];
          const _wantN = window.__lxIntent && window.__lxIntent.parseWantedCount ? window.__lxIntent.parseWantedCount(value) : null;
          if (_wantN && products.length > _wantN) products = products.slice(0, _wantN);
          if (products.length || payload.title) hasContent = true;
          if (payload.title && !ai._raw) {
            ai._raw = payload.title;
          }
          pendingExtras += renderLxfdProducts(products, { serviceProduct: _lxfdServiceProductFollowup });
          // 记录本轮商品及展示元信息以便 done 时桥接到主面板
          if (products.length) {
            turnProducts = products;
            turnTitle = payload.title || "";
            turnGrouped = !!payload.grouped;
            chatState.lastProducts = products;
            chatState.lastProductsMeta = { title: turnTitle, grouped: turnGrouped };
          }
        },
        clicks: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const list = (parseJson(data).clicks) || [];
          if (!list.length || !body) return;
          pendingExtras += '<div class="leai-clicks" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + list.map((c) =>
            `<button type="button" class="leai-click-btn" data-leai-url="${escapeAttr(c.link_url || "")}" data-leai-cb="${escapeAttr(c.callback_data || "")}" data-leai-event="${escapeAttr(c.event_type || "")}">${escapeHtml(c.display_text)}</button>`
          ).join("") + "</div>";
        },
        suggestions: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data);
          pendingFollowups = (payload.suggestions || []).filter(Boolean).slice(0, 3);
        },
        action: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const { op } = parseJson(data) || {};
          const pageMeta = lxfdPageCtaMeta(op);
          if (pageMeta) {
            if (pageMeta.feature === "solution") pendingExtras += renderLxfdLeadCta();
            pendingExtras += renderLxfdPageCta(pageMeta);
            if (turnActions.indexOf(pageMeta.feature) < 0) turnActions.push(pageMeta.feature);
          } else if (op === 'auth') {
            // 职场认证与教育认证统一使用标准结果卡，点击后直接打开认证弹窗。
            pendingExtras += `<button class="answer-cta lx-answer-page lx-auth-answer-card" type="button" data-open-wpa aria-label="打开职场身份认证弹窗">
              <span class="answer-cta-copy">
                <span class="answer-cta-title">职场身份认证</span>
                <span class="answer-cta-desc">认证后享购机优惠、AI 资源与专属权益</span>
              </span>
              <span class="answer-cta-icon" aria-hidden="true">${window.__lxApprovedIcon("global-next")}</span>
            </button>`;
          } else if (op) {
            if (turnActions.indexOf(op) < 0) turnActions.push(op); // 记录意图，done 时桥接后再执行（全屏下直接开标签会被遮盖）
          }
        },
        control: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          const payload = parseJson(data) || {};
          // 页面操作（关标签/回首页/开订单等）：桥接到主面板执行
          if (payload.op && typeof window.__lxExecControl === 'function') window.__lxExecControl(payload.op, payload.target);
        },
        done: (data) => {
          if (nonce !== chatState.conversationNonce) return;
          if (finalized) return;
          finalized = true;
          finalizePromise = (async () => {
            window.clearTimeout(_lxfdSendTimeout);
            const payload = parseJson(data);
            if (payload.conv_id || payload.convId) chatState.convId = payload.conv_id || payload.convId;
            await lxfdAnimateFinal(ai, ai._raw);
            const finalBody = ai.querySelector(".lxfd-ai-body");
            if (pendingExtras && finalBody) { finalBody.insertAdjacentHTML("beforeend", pendingExtras); if (thread) thread.scrollTop = thread.scrollHeight; }
            if (!pendingFollowups.length) pendingFollowups = await lxfdFetchFollowups(value, ai._raw);
            pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
            if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
            lxfdPersistCurrent();
            lxfdRenderHist();
            const isFullscreen = document.body.classList.contains("assistant-fullscreen");
            // 代买任务：推荐回答已在全屏展示完，此刻才切执行视图起链（真机反馈：不能一发问就分屏）。
            // officialWait 直接给已到手的商品，链 step1 秒过进入「对比→选款→下单」。
            if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // 链卡走裸 addMessage，需先补分屏布局（老坑：不补则背景停在欢迎门户，链卡在 DOM 里看不见）
                if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
                window.__lxRunChain("auto_buy_official", {
                  maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
                  minPrice: _lxfdAutoBuy.params.minPrice || 0,
                  officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
                  rawText: value
                });
                if (thread) thread.innerHTML = "";
              });
            } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
              // 官方带回商品 → 自动桥接分屏右侧展示（所推即所见）；只有纯 action 无商品才走功能页桥接
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
                turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：门店/优惠/会员标签全开
                if (thread) thread.innerHTML = "";
              });
            } else if (turnActions.length && isFullscreen && window.__lxBridge) {
              // 本轮只有意图无商品：同样桥接退全屏，再开功能标签
              lxfdExportToMain();
              exitFullscreenWithReveal(() => {
                // lxfdRevealFeature 内部会先 lxfdEnsureRootSplitState 补首页分屏布局
                // （不做这步 .shell 仍 display:none → 功能标签渲染了但主面板隐藏=空白）
                turnActions.forEach((op) => lxfdRevealFeature(op));
                if (thread) thread.innerHTML = "";
              });
            }
          })();
        },
        fallback: async () => {
          if (nonce !== chatState.conversationNonce) return;
          if (chatState._fallbackFired) return;
          chatState._fallbackFired = true;
          try {
            const huoRes = await fetch('/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: sendMsg, conv_id: chatState.convId || undefined })
            });
            if (!huoRes.ok || !huoRes.body) throw new Error('fallback upstream ' + huoRes.status);
            await readSse(huoRes, lxfdHandlers);
          } catch (_e) {
            ai._raw = '当前服务暂时不可用，请稍后再试。';
            if (!finalized) {
              finalized = true;
              finalizePromise = lxfdAnimateFinal(ai, ai._raw);
            }
          }
        }
      };
      await readSse(response, lxfdHandlers);
      if (nonce !== chatState.conversationNonce) return;
      if (finalizePromise) {
        await finalizePromise;
      } else if (!finalized) {
        finalized = true;
        if (!hasContent && !ai._raw && !pendingExtras) {
          ai._raw = "我已经收到请求，可以继续补充预算、用途或偏好的机型。";
        }
        await lxfdAnimateFinal(ai, ai._raw);
        const finalBody = ai.querySelector(".lxfd-ai-body");
        if (pendingExtras && finalBody) finalBody.insertAdjacentHTML("beforeend", pendingExtras);
        if (!pendingFollowups.length) pendingFollowups = await lxfdFetchFollowups(value, ai._raw);
        pendingFollowups = lxfdFill3(lxfdActionChips(turnProducts).concat(pendingFollowups));
        if (pendingFollowups.length) appendLxfdSuggestions(ai, pendingFollowups);
        lxfdPersistCurrent();
        lxfdRenderHist();
        const isFullscreen = document.body.classList.contains("assistant-fullscreen");
        // 与上方 done 分支同一条规则：代买起链 > 有商品分屏展示 > 纯 action 功能页桥接。
        if (_lxfdAutoBuy && isFullscreen && window.__lxBridge && window.__lxRunChain) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            if (typeof window.__lxBridge.prepareRootSplitState === "function") window.__lxBridge.prepareRootSplitState();
            window.__lxRunChain("auto_buy_official", {
              maxPrice: _lxfdAutoBuy.params.maxPrice || 0,
              minPrice: _lxfdAutoBuy.params.minPrice || 0,
              officialWait: Promise.resolve(Array.isArray(turnProducts) ? turnProducts : []),
              rawText: value
            });
            if (thread) thread.innerHTML = "";
          });
        } else if (turnProducts && turnProducts.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            window.__lxBridge.revealProducts(turnProducts, { title: turnTitle, grouped: turnGrouped });
            turnActions.forEach((op) => lxfdRevealFeature(op)); // 多意图：标签全开（同 done 分支）
            if (thread) thread.innerHTML = "";
          });
        } else if (turnActions.length && isFullscreen && window.__lxBridge) {
          lxfdExportToMain();
          exitFullscreenWithReveal(() => {
            turnActions.forEach((op) => lxfdRevealFeature(op));
            if (thread) thread.innerHTML = "";
          });
        }
      }
    } catch (error) {
      console.error("[lxfd] submit 流程异常（此前静默吞掉，排障困难）:", error);
      if (nonce !== chatState.conversationNonce) return;
      ai._raw = "当前 AI 服务暂时不可用，请稍后重试。";
      await lxfdAnimateFinal(ai, ai._raw);
    } finally {
      clearTimeout(_lxfdSendTimeout);
      if (nonce === chatState.conversationNonce) chatState.sending = false;
      ai.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
    }
  }

  window.lxfdSubmit = submit;
  window.lxfdReset = resetConversation;
  // 分屏→全屏回退：关空右侧 tab 时带入主面板对话回全屏
  window.__lxfdEnterFromSplit = function() {
    if (thread) thread.innerHTML = "";
    enterFullscreen();  // enterFullscreen 内检测到 thread 空会自动 lxfdImportFromMain
  };
  // 新建对话回全屏欢迎态
  window.__lxfdNewFullscreen = function() {
    resetConversation(true);
    enterFullscreen();
  };

  convoPill?.addEventListener("click", () => setNav(!navCluster.classList.contains("open")));
  navCluster?.addEventListener("mouseenter", () => { clearTimeout(hoverTimer); });
  navCluster?.addEventListener("mouseleave", () => { clearTimeout(hoverTimer); setNav(false); });
  $$("#lxfdNavSheet a").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    $$("#lxfdNavSheet a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    setNav(false);
    const path = navPaths[a.dataset.page] || "/";
    const currentPath = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
    const targetPath = path.endsWith("/") ? path : `${path}/`;
    if (currentPath === targetPath) location.reload();
    else location.assign(path);
  }));
  document.addEventListener("click", (e) => { if (navCluster && !navCluster.contains(e.target)) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setNav(false); if (!wide()) setRailManual(false); } });
  railFab?.addEventListener("click", () => setRailManual(true));
  $("#lxfdRailClose")?.addEventListener("click", () => setRailManual(false));
  $(".lxfd-actions")?.addEventListener("click", (e) => {
    const accountAction = e.target.closest(".lxfd-account-menu [data-account-action]");
    if (accountAction) {
      const action = accountAction.dataset.accountAction || "";
      accountAction.closest(".lxfd-account-wrap")?.classList.remove("open");
      if (action === "member") {
        e.preventDefault();
        e.stopPropagation();
        submit("会员中心");
        return;
      }
    }
    const button = e.target.closest(".lxfd-ic");
    if (!button) return;
    const label = button.getAttribute("aria-label") || "";
    if (button.dataset.lxfdOpen === "cart" || label.includes("购物车")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("cart", { sendQuery: true });
      return;
    }
    if (button.dataset.lxfdOpen === "orders" || label.includes("订单")) {
      e.preventDefault();
      e.stopPropagation();
      window.lxOpenCommerceEntry?.("orders", { sendQuery: true });
      return;
    }
    // 首页空白态胶囊里的历史入口（必须在兜底 exitFullscreen 之前拦下）：
    // 开「历史记录」弹窗（与分屏同款），不拉左侧 rail（真机反馈）
    if (button.id === "lxfdTopHistBtn" || label.includes("历史")) {
      e.preventDefault();
      if (window.__lxBridge && typeof window.__lxBridge.openHistoryModal === "function") window.__lxBridge.openHistoryModal();
      else setRailManual(true);
      return;
    }
    e.preventDefault();
    exitFullscreen();
  });
  scrim?.addEventListener("click", () => setRailManual(false));
  function lxfdStartNewConversation(collapseRail) {
    const logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
    resetConversation(!!collapseRail);
    if (logicalPath !== "/") {
      // 子频道的全屏新建对话是“收起回当前频道新对话”，
      // 不是停留在全屏欢迎态。复用同一收起动画与主面板 reset 链路。
      exitFullscreenWithReveal(() => window.__lxBridge?.newConversationInCurrentChannel?.());
    }
  }
  $("#lxfdNewChat")?.addEventListener("click", () => lxfdStartNewConversation(true));
  // 全屏左侧悬浮“＋”与历史栏内“新建对话”必须是同一语义；此前这里只清空
  // lxfd thread，导致用户仍停在全屏而没有回到当前频道首页。
  railNewFab?.addEventListener("click", () => lxfdStartNewConversation(false));
  historySearch?.addEventListener("input", () => lxfdRenderHist(historySearch.value));
  $("#lxfdHist")?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-conv-item]");
    const action = e.target.closest(".lxfd-hist-action");
    if (action && item) {
      e.preventDefault();
      e.stopPropagation();
      const id = item.dataset.convItem;
      if (action.dataset.action === "delete" && !window.confirm("确认删除这条历史对话吗？")) return;
      lxfdUpdateConversation(id, action.dataset.action);
      return;
    }
    const a = e.target.closest("a[data-conv]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.conv) lxfdLoadConv(a.dataset.conv);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lxfd-hist-item")) return;
    $$(".lxfd-hist-item.menu-open").forEach(node => { node.classList.remove("menu-open"); node.querySelector(".lxfd-hist-more")?.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openItem = $(".lxfd-hist-item.menu-open");
    if (!openItem) return;
    openItem.classList.remove("menu-open");
    const trigger = openItem.querySelector(".lxfd-hist-more");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
  });
  $$(".lxfd-comp-left .lxfd-toggle").forEach(btn => btn.addEventListener("click", () => { const on = btn.classList.toggle("on"); btn.setAttribute("aria-pressed", on ? "true" : "false"); if (btn.textContent.includes("深度思考")) window.__lxThinking = on; if (btn.textContent.includes("联网")) window.__lxWebSearch = on; }));
  // lxfd 图片上传
  const lxfdImgBtn = document.querySelector('.lxfd-img-btn');
  if (lxfdImgBtn) {
    const lxfdFileInput = document.createElement('input');
    lxfdFileInput.type = 'file';
    lxfdFileInput.accept = 'image/*';
    lxfdFileInput.style.display = 'none';
    lxfdFileInput.id = 'lxfdFileInput';
    document.body.appendChild(lxfdFileInput);
    lxfdImgBtn.addEventListener('click', () => lxfdFileInput.click());
    lxfdFileInput.addEventListener('change', async () => {
      const file = lxfdFileInput.files && lxfdFileInput.files[0];
      if (!file) return;
      lxfdFileInput.value = '';
      try {
        lxfdImgBtn.disabled = true;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data && data.url) {
          window.__lxfdPendingImage = data.url;
          const dock = document.querySelector('.lxfd-dock');
          let imgTip = dock && dock.querySelector('.lxfd-img-tip');
          if (!imgTip && dock) {
            imgTip = document.createElement('div');
            imgTip.className = 'lxfd-img-tip';
            imgTip.style.cssText = 'font-size:12px;color:#979797;padding:4px 12px;display:flex;align-items:center;gap:6px';
            dock.insertBefore(imgTip, dock.querySelector('.lxfd-composer'));
          }
          if (imgTip) {
            imgTip.innerHTML = '<span>已添加图片</span><button type="button" style="border:none;background:none;cursor:pointer;color:#b8252e;font-size:12px" id="lxfdImgClear">×</button>';
            const clearBtn = imgTip.querySelector('#lxfdImgClear');
            if (clearBtn) clearBtn.addEventListener('click', () => { window.__lxfdPendingImage = null; imgTip.remove(); });
          }
        }
      } catch (_e) {
        // 上传失败静默处理
      } finally {
        lxfdImgBtn.disabled = false;
      }
    });
  }

  (function initLxfdHomeGallery() {
    const data = {
      new: [
        { nm: "拯救者 Y9000P 2026", ds: "i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏", price: "15,098", badge: "新品首发", wm: "LEGION Y9000P", img: "../img/lxfd-gallery-1-1.jpg", g: "linear-gradient(135deg,#252525,#4d144a 58%,#625b68)", q: "请解读这款商品：拯救者 Y9000P 2026，配置是 i9-14900HX ｜ RTX 5060 ｜ 2.5K 240Hz 电竞屏，价格约 ¥15,098，适合什么人买？" },
        { nm: "YOGA Air 14c 2026", ds: "酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控", price: "8,999", badge: "轻薄旗舰", wm: "YOGA Air 14c", img: "../img/lxfd-gallery-1-2.jpg", g: "linear-gradient(135deg,#252525,#625b68 58%,#979797)", q: "请解读这款商品：YOGA Air 14c 2026，配置是酷睿 Ultra9 ｜ 32G/2T ｜ 2.8K OLED 触控，价格约 ¥8,999，适合什么人买？" },
        { nm: "小新Pad Pro 13英寸", ds: "酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄", price: "7,299", badge: "全能之选", wm: "Xiaoxin Pro16", img: "../img/lxfd-gallery-1-3.jpg", g: "linear-gradient(135deg,#0c2342,#252525 58%,#48d39e)", q: "请解读这款商品：小新Pad Pro 13英寸，配置是酷睿 Ultra5 225H ｜ 32G/1T ｜ 全能轻薄，价格约 ¥7,299，适合什么人买？" }
      ],
      act: [
        { nm: "618 年中钜惠", ds: "全场至高省 2000，下单再享 12 期免息", price: "省 2000", isText: true, badge: "限时", wm: "618 SALE", g: "linear-gradient(135deg,#252525,#b8252e 56%,#e42b20)", q: "618 年中钜惠有什么优惠？怎么参加？" },
        { nm: "教育优惠季", ds: "学生 / 教师认证，专属机型至高 9 折", price: "享 9 折", isText: true, badge: "进行中", wm: "EDU SEASON", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育优惠季怎么参加？学生认证有哪些优惠？" },
        { nm: "以旧换新", ds: "旧机抵扣 + 平台补贴，至高补 800 元", price: "补 800", isText: true, badge: "可叠加", wm: "TRADE-IN", g: "linear-gradient(135deg,#252525,#625b68 58%,#48d39e)", q: "以旧换新怎么操作？旧机能抵多少钱？" }
      ],
      news: [
        { nm: "联想 2026 拯救者全系发布", ds: "搭载新一代 AI 引擎与超频引擎，性能再进阶", price: "查看全文", isText: true, badge: "官方", wm: "PRESS", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#625b68)", q: "联想 2026 拯救者全系发布了哪些新品？有什么亮点？" },
        { nm: "联想 AI PC 出货领跑行业", ds: "IDC 最新报告：中国 AI PC 市场份额持续第一", price: "查看全文", isText: true, badge: "行业", wm: "INSIGHT", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "联想 AI PC 有哪些优势？为什么市场份额第一？" },
        { nm: "联想乐享门店破 5000 家", ds: "线下服务网络全面升级，到店体验更进一步", price: "查看全文", isText: true, badge: "动态", wm: "RETAIL", g: "linear-gradient(135deg,#252525,#625b68 58%,#bcb4c1)", q: "联想门店能提供哪些服务？帮我找附近门店。" }
      ],
      case: [
        { nm: "某重点高校机房方案", ds: "1200 台统一部署与运维，开机即用，集中管理", price: "教育行业", isText: true, badge: "已交付", wm: "CAMPUS", g: "linear-gradient(135deg,#0c2342,#625b68 58%,#979797)", q: "教育行业的机房统一部署方案是怎么做的？" },
        { nm: "设计工作室创作方案", ds: "ThinkStation + 校色屏整体方案，效率提升 40%", price: "创意设计", isText: true, badge: "标杆", wm: "STUDIO", g: "linear-gradient(135deg,#0c2342,#5b1452 58%,#a262d7)", q: "设计创作行业有什么整体方案？ThinkStation 怎么配？" },
        { nm: "连锁零售 POS 升级", ds: "300+ 门店终端统一焕新，稳定支撑高峰交易", price: "零售行业", isText: true, badge: "规模化", wm: "RETAIL POS", g: "linear-gradient(135deg,#252525,#5b1452 58%,#e42b20)", q: "连锁零售门店终端怎么统一升级？有什么方案？" }
      ]
    };
    const root = document.querySelector(".lxfd-home-gallery");
    const grid = document.getElementById("lxfdGalleryGrid");
    const tabs = Array.from(document.querySelectorAll("[data-gallery-tab]"));
    const ink = document.getElementById("lxfdGalleryInk");
    if (!root || !grid || !tabs.length) return;
    const price = (item) => item.isText ? escapeHtml(item.price) : "¥" + escapeHtml(item.price);
    const card = (item) => {
      const shotClass = item.img ? "gallery-shot has-image" : "gallery-shot";
      const inner = item.img
        ? '<img class="gallery-img" src="' + escapeAttr(item.img) + '" alt="" loading="eager" />'
        : '<span class="gallery-lid"></span><span class="gallery-wm">' + escapeHtml(item.wm) + '</span>';
      return '<article class="gallery-card is-preview-only" aria-disabled="true"><div class="' + shotClass + '" style="background:' + escapeAttr(item.g) + '">' + inner + '</div>'
        + '<div class="gallery-meta"><span class="gallery-badge">' + escapeHtml(item.badge) + '</span><strong class="gallery-name">' + escapeHtml(item.nm) + '</strong><span class="gallery-desc">' + escapeHtml(item.ds) + '</span>'
        + '<div class="gallery-foot"><span class="gallery-price">' + price(item) + '</span><span class="gallery-go" aria-hidden="true">了解 →</span></div></div></article>';
    };
    // 首页内容卡当前仅作预览：保留 CSS hover，点击与键盘操作均不发送对话。
    grid.addEventListener("click", (e) => {
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cardEl = e.target.closest(".gallery-card");
      if (cardEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    const moveInk = () => {
      const active = root.querySelector(".gallery-tab.is-active");
      if (active && ink) {
        ink.style.left = active.offsetLeft + "px";
        ink.style.width = active.offsetWidth + "px";
      }
    };
    const render = (key, animate) => {
      if (!data[key]) key = "new";
      if (!animate) {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
        return;
      }
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.innerHTML = data[key].map(card).join("");
        grid.classList.remove("is-loading");
        grid.classList.remove("is-switching");
      }, 120);
    };
    const activateTab = (tab) => {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      moveInk();
      render(tab.dataset.galleryTab, true);
    };
    tabs.forEach((tab) => {
      tab.addEventListener("pointerenter", () => activateTab(tab));
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("focus", () => activateTab(tab));
    });
    render("new", false);
    requestAnimationFrame(moveInk);
    window.addEventListener("resize", moveInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  })();

  (function initLxfdScopeActions() {
    const scope = document.getElementById("lxfdScopeActions");
    const more = document.getElementById("lxfdScopeMore");
    const moreBtn = more?.querySelector(".lxfd-scope-more-btn");
    const close = () => {
      more?.classList.remove("open");
      moreBtn?.setAttribute("aria-expanded", "false");
    };
    if (scope) {
      scope.addEventListener("click", (event) => {
        const chip = event.target.closest(".lxfd-scope-chip");
        if (!chip) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        const label = chip.textContent.trim();
        if (!label) return;
        submit(LXFD_ACTION_Q[label] || label);
      });
    }
    if (more && moreBtn) {
      const open = () => {
        more.classList.add("open");
        moreBtn.setAttribute("aria-expanded", "true");
      };
      more.addEventListener("pointerenter", open);
      more.addEventListener("pointerleave", close);
      moreBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = !more.classList.contains("open");
        if (shouldOpen) open(); else close();
      });
      document.addEventListener("click", (event) => { if (!more.contains(event.target)) close(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }
  })();

  ta?.addEventListener("input", () => { fit(); syncSend(); });
  ta?.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(ta.value); } });
  $("#lxfdComposer")?.addEventListener("submit", (e) => { e.preventDefault(); submit(ta.value); });
  chips?.addEventListener("click", (e) => {
    const b = e.target.closest(".lxfd-chip-q");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    submit(b.dataset.q || b.textContent);
  });
  quick?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (b.textContent.trim() === "退出人工") { lxfdExitHuman(); return; }
    submit(LXFD_ACTION_Q[b.textContent.trim()] || b.textContent);
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd .answer-cta, .lxfd [data-lx-result-id], .lxfd [data-lxfd-reveal-products], .lxfd [data-lx-focus-reco], .lxfd [data-lxfd-open-feature], .lxfd [data-lx-focus-active], .lxfd [data-lx-open-tab], .lxfd [data-specific-solution-cta]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (btn.hasAttribute("data-open-enterprise-auth-modal") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-member-auth") {
      window.__lxOpenEnterpriseAuthModal?.();
      return;
    }
    if (btn.hasAttribute("data-open-enterprise-lead") || btn.getAttribute("data-lx-result-id") === "modal:enterprise-lead") {
      window.openLeadPanel?.();
      return;
    }
    const studentAuthKind = btn.getAttribute("data-open-stuauth");
    if (studentAuthKind) {
      window.__lxAgentAPI?.openStudentAuth?.(studentAuthKind);
      return;
    }
    if (btn.hasAttribute("data-open-wpa")) {
      window.openWorkplaceAuth?.();
      return;
    }
    if (btn.hasAttribute("data-open-payment-confirm")) {
      window.__lxAgentAPI?.lxOpenPendingPaymentModal?.();
      return;
    }
    const feature = btn.getAttribute("data-lxfd-open-feature") || "";
    const boundTabId = btn.getAttribute("data-lx-open-tab") || "";
    const resultId = btn.getAttribute("data-lx-result-id") || "";
    const solutionTitle = btn.getAttribute("data-specific-solution-cta") || "";
    const recoId = btn.getAttribute("data-lxfd-reco-id") || "";
    const openProduct = btn.getAttribute("data-open-product") || "";
    const targetTabId = resultId || (solutionTitle
      ? `info:solution-detail:${solutionTitle}`
      : (boundTabId || (feature === "solution" ? "info:solution" : "")));
    const storedProducts = recoId && window.__lxRecoPayloads && Array.isArray(window.__lxRecoPayloads[recoId])
      ? window.__lxRecoPayloads[recoId]
      : [];
    const recoTab = (window.__lxState?.tabs || []).find((item) => item && (item.kind === "reco" || item.id === "reco") && Array.isArray(item.products) && item.products.length);
    const products = storedProducts.length
      ? storedProducts
      : ((chatState.lastProducts && chatState.lastProducts.length) ? chatState.lastProducts : (recoTab?.products || []));
    // 收起前先锁定卡片目标。分屏恢复后精确激活对应标签，不能再由 focusReco 猜测当前页。
    const inFullscreen = document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs");
    if (inFullscreen) {
      const commitCapturedResult = () => {
        lxfdEnsureRootSplitState();
        if (window.__lxBridge?.restoreResultCard?.(btn)) return;
        if (targetTabId && window.__lxBridge?.restoreResultTab?.(targetTabId)) return;
        if (lfxdReplayImportedResultCard({ resultId, boundTabId, solutionTitle, recoId, openProduct, feature })) return;
        if (targetTabId && window.__lxBridge?.activateTab?.(targetTabId)) return;
        if (feature) lxfdRevealFeature(feature);
        else if (products.length) window.__lxBridge?.revealProducts?.(products, { title: "AI 推荐", recoId });
      };
      lxfdExitToResultAtomically(commitCapturedResult);
      return;
    }
    // 功能卡片在全屏态与左右分栏态都走同一入口；标签关闭后可重新创建。
    if (feature) {
      lxfdOpenFeatureInSplit(feature);
      return;
    }
    if (btn.hasAttribute("data-lx-focus-active") && !btn.hasAttribute("data-lx-focus-reco")) return;
  }, true);
  thread?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lxfd-followups button, .lxfd-ai-body .followups button, .lxfd-ai-body .lx-p0-suggest[data-followups] button, .lxfd-ai-body [data-quick-ask]");
    if (!btn) return;
    e.preventDefault();
    const text = btn.getAttribute("data-quick-ask") || btn.textContent.replace(/→\s*$/, "").trim();
    if (text) submit(text);
  });
  turnList?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const target = document.getElementById(b.dataset.target); if (!target) return; renderTurnIndex(target.id); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); });
  window.addEventListener("resize", () => { if (document.body.classList.contains("assistant-fullscreen")) syncRailForViewport(); });

  // 职场认证按钮（lxfd 内的 data-open-wpa 委托）
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-wpa]")) {
      if (typeof window.openWorkplaceAuth === "function") window.openWorkplaceAuth();
    }
  });

  // 官方动作按钮（转人工/在线客服等）点击：human_access→进客服模式，有链接开新窗口，否则把 callback_data 当问题继续问
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-leai-url], [data-leai-cb]");
    if (!btn) return;
    e.preventDefault();
    const ev = btn.getAttribute("data-leai-event");
    if (ev === "human_access") {
      if (document.body.classList.contains("assistant-fullscreen")) {
        lxfdEnterHuman();
      } else if (typeof window.__lxSetHuman === "function") {
        window.__lxSetHuman(true);
      }
      return;
    }
    const url = btn.getAttribute("data-leai-url");
    const cb = btn.getAttribute("data-leai-cb");
    if (url) { window.open(url, "_blank", "noopener"); return; }
    if (cb && typeof window.lxfdSubmit === "function" && document.body.classList.contains("assistant-fullscreen")) window.lxfdSubmit(cb);
  });

  setTimeout(startRotatingTitle, reduceMotion ? 0 : 2000);
  syncSend();
  lxfdRenderHist();
  // P0 多频道会话互通：首页重新进入时，把共享主面板已恢复的完整会话导入全屏线程。
  if (window.__LX_TEMPLATE_PAGE === "home") {
    window.setTimeout(function () {
      if (!lxfdMainMsgs(".lx-p0-messages > .lx-p0-message").length) return;
      lxfdImportFromMain();
      setFullscreen(true);
    }, 0);
  }

  document.addEventListener("click", (e) => {
    const fsToggle = e.target.closest(".assistant-toggle");
    if (fsToggle) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      enterFullscreen();
      return;
    }
    const heroChip = e.target.closest(".hero-suggestion");
    const fullPrompt = e.target.closest(".fullscreen-prompt");
    if (heroChip || fullPrompt) {
      const target = heroChip || fullPrompt;
      const text = (target.querySelector("span")?.textContent || target.textContent).trim();
      if (text) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(text); }
    }
  }, true);
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.(".hero-composer");
    if (!form) return;
    const txt = form.querySelector("textarea")?.value.trim() || form.querySelector("textarea")?.placeholder || "最近有什么优惠活动？";
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); submit(txt);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("assistant-fullscreen")) requestAnimationFrame(() => { syncRailForViewport(); fit(); syncSend(); });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();

};

/* public/leaip0/assets/frontend/js/core/composer-autogrow-v1.js */
window.__p0Modules.sources["ud1a6c0e55b76afc6"]=function(){
(function () {
  "use strict";

  var SELECTOR = ".assistant-panel .assistant-bottom .composer textarea";
  var MIN_HEIGHT = 21;
  var MAX_HEIGHT = 90;

  function resize(textarea) {
    if (!textarea || !textarea.matches(SELECTOR)) return;

    textarea.style.setProperty("height", MIN_HEIGHT + "px", "important");
    var nextHeight = Math.max(MIN_HEIGHT, Math.min(textarea.scrollHeight, MAX_HEIGHT));
    textarea.style.setProperty("height", nextHeight + "px", "important");
    textarea.style.setProperty(
      "overflow-y",
      textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden",
      "important"
    );
  }

  function resizeCurrent() {
    document.querySelectorAll(SELECTOR).forEach(resize);
  }

  document.addEventListener("input", function (event) {
    resize(event.target);
  });

  document.addEventListener("focusin", function (event) {
    resize(event.target);
  });

  document.addEventListener(
    "submit",
    function (event) {
      if (!event.target.matches(".assistant-panel .assistant-bottom .composer")) return;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resizeCurrent);
      });
    },
    true
  );

  window.addEventListener("resize", resizeCurrent, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resizeCurrent, { once: true });
  } else {
    resizeCurrent();
  }
})();

};

/* public/leaip0/assets/frontend/js/core/generation-control-v1.js */
window.__p0Modules.sources["uecf34ea3f3d35b9e"]=function(){
/* Shared cancellation for the P0 assistant, fullscreen and split composer. */
(() => {
  'use strict';
  if (window.__lxGeneration) return;
  let epoch = 0;
  const scopes = new Map();
  const states = new Set(), pending = new Set(), timers = new Map(), requests = new Set();
  const buttons = '#lxfdSend,.assistant-panel .send-btn,.hero-send-btn';
  const inputs = '.composer textarea,.lxfd-composer textarea,.hero-composer textarea';
  // Only actual suggested queries are sendable. Instructional placeholders stay empty.
  const defaultQueries = new Set([
    '推荐一款适合我的笔记本电脑', '推荐笔记本电脑',
    '公司要配办公电脑，帮我推荐', '我们单位要采购信创设备，帮我推荐'
  ]);
  const composing = new WeakSet();
  function queryFor(input) {
    if (!input || input.disabled || input.readOnly) return '';
    if (input.matches('#lxfdTa, .assistant-panel .composer textarea') && window.__lxRecommendationFollowups?.hasSelection()) return '推荐商品';
    const value = input.value || '';
    const placeholder = input.placeholder.trim();
    return value.trim() || (!value && defaultQueries.has(placeholder) ? placeholder : '');
  }
  function inputFor(button) {
    return button.closest('form,.composer,.hero-composer')?.querySelector('textarea');
  }
  function materializeDefault(input) {
    if (!input || input.value || composing.has(input)) return;
    if (input.matches('#lxfdTa, .assistant-panel .composer textarea') && window.__lxRecommendationFollowups?.hasSelection()) return;
    const query = queryFor(input);
    if (!query) return;
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    sync();
  }
  const markers = '.lx-p0-messages .loading-line,.lx-p0-messages .typing-cursor,.lx-p0-messages .streaming,.lxfd-thread .loading-line,.lxfd-thread .typing-cursor,.lxfd-thread .streaming';
  const abortError = () => new DOMException('已停止生成', 'AbortError');
  const current = token => token === epoch;
  const busy = () => [...states].some(state => state.sending) || !!document.querySelector(markers);
  function sync() {
    const running = busy();
    if (!running) requests.clear();
    document.querySelectorAll(buttons).forEach(button => {
      if (!button.dataset.lxSendLabel) button.dataset.lxSendLabel = button.getAttribute('aria-label') || '发送';
      if (button.classList.contains('lx-stop-generation') !== running) button.classList.toggle('lx-stop-generation', running);
      const label = running ? '停止生成' : button.dataset.lxSendLabel;
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
      if (button.title !== label) button.title = label;
      const ready = !running && !!queryFor(inputFor(button));
      const disabled = !running && !ready;
      if (button.disabled !== disabled) button.disabled = disabled;
      button.classList.toggle('lx-send-ready', ready);
      button.classList.toggle('idle', disabled);
    });
  }
  function register(state, scope) {
    if (!state || states.has(state)) return;
    states.add(state);
    scopes.set(scope,state);
    const descriptor = Object.getOwnPropertyDescriptor(state, 'sending');
    let value = state.sending;
    Object.defineProperty(state, 'sending', {configurable:true,enumerable:true,
      get(){return descriptor?.get ? descriptor.get.call(state) : value;},
      set(next){if(descriptor?.set) descriptor.set.call(state,next);else value=!!next;sync();}
    });
    sync();
  }
  function wait(token, task) {
    return new Promise((resolve,reject) => {
      const cancel = () => {pending.delete(cancel);reject(abortError());};
      if (!current(token)) {Promise.resolve(task).catch(()=>{});cancel();return;}
      pending.add(cancel);
      Promise.resolve(task).then(value=>{pending.delete(cancel);current(token)?resolve(value):reject(abortError());},error=>{pending.delete(cancel);reject(current(token)?error:abortError());});
    });
  }
  function schedule(kind, token, callback, delay, ...args) {
    if (!current(token)) return 0;
    let id;
    const invoke = (...values) => {if(kind==='timeout')timers.delete(id);if(current(token))callback(...values);else clear(id);};
    id = kind==='interval'?window.setInterval(invoke,delay,...args):kind==='frame'?window.requestAnimationFrame(invoke):window.setTimeout(invoke,delay,...args);
    timers.set(id,kind);return id;
  }
  function clear(id) {const kind=timers.get(id);timers.delete(id);if(kind==='frame')window.cancelAnimationFrame(id);else {window.clearTimeout(id);window.clearInterval(id);}}
  function request(token, input, options={}) {
    const controller = new AbortController();
    const upstream = options.signal;
    const signal = upstream ? AbortSignal.any([controller.signal, upstream]) : controller.signal;
    if(!current(token))controller.abort();
    requests.add(controller);
    return fetch(input,{...options,signal}).then(response=>{
      if(response.body){
        const getReader=response.body.getReader.bind(response.body);
        response.body.getReader=(...args)=>{
          const reader=getReader(...args),read=reader.read.bind(reader),cancel=reader.cancel.bind(reader);
          reader.read=(...values)=>read(...values).then(result=>{if(result.done)requests.delete(controller);return result;},error=>{requests.delete(controller);throw error;});
          reader.cancel=(...values)=>{requests.delete(controller);return cancel(...values);};
          return reader;
        };
      }
      return response;
    },error=>{requests.delete(controller);throw error;});
  }

  function stop() {
    if(!busy())return false;
    const active = [];
    for(const selector of ['.lx-p0-messages','.lxfd-thread']) {
      const root=document.querySelector(selector), node=root?.lastElementChild;
      if(node && !node.matches('.user,.lxfd-msg-user') && (node.querySelector('.loading-line,.typing-cursor,.streaming') || scopes.get(selector==='.lxfd-thread'?'fullscreen':'split')?.sending)) active.push(node);
    }
    epoch++;
    for(const controller of requests)controller.abort();requests.clear();
    for(const id of [...timers.keys()])clear(id);
    for(const cancel of [...pending])cancel();
    for(const state of states){state.conversationNonce=(state.conversationNonce||0)+1;state.sending=false;state._buyFlowRunning=false;state._buyEntryLoading=false;clearTimeout(state._sendTimeout);}
    active.forEach(node=>{
      node._pendingExtras=null;node._afterAnswer=[];node.classList.remove('loading');
      node.querySelectorAll('.loading-line,.lx-generating,.typing-cursor,.lxfd-typing').forEach(el=>el.remove());
      node.querySelectorAll('.streaming').forEach(el=>el.classList.remove('streaming'));
      node.querySelectorAll('.lx-skill-trace-item.current').forEach(el=>el.classList.remove('current'));
      const body=node.querySelector('.ai-body,.lxfd-ai-body')||node;
      node._raw=(body.querySelector('.lxfd-ai-text,.lx-msg-text')||body).textContent.trim();
      if(!body.querySelector('[data-lx-generation-stopped]')){const status=document.createElement('p');status.dataset.lxGenerationStopped='true';status.className='lx-p0-disclaimer';status.setAttribute('role','status');status.textContent='已停止生成';body.append(status);}
    });
    document.body.classList.remove('lx-agent-generating');
    sync();window.__lxSaveConversationNow?.();window.__lxPersistStoppedFullscreen?.();
    return true;
  }
  window.__lxGeneration=Object.freeze({capture:()=>epoch,current,register,wait,fetch:request,stop,sync,
    timeout:(token,fn,delay,...args)=>schedule('timeout',token,fn,delay,...args),
    interval:(token,fn,delay,...args)=>schedule('interval',token,fn,delay,...args),
    frame:(token,fn)=>schedule('frame',token,fn),clear});
  const style=document.createElement('style');style.id='lx-stop-generation-style';
  const stopSelector='html body #lxfdSend.lx-stop-generation,html body .assistant-panel button.send-btn.lx-stop-generation,html body .hero-send-btn.lx-stop-generation';
  style.textContent=window.__p0Modules.styleText("/@script-style/b83aeafddfc21b18fe70fb99.css");
  const readySelector='html body #lxfdSend.lx-send-ready,html body .assistant-panel button.send-btn.lx-send-ready,html body .hero-send-btn.lx-send-ready';
  style.textContent += window.__p0Modules.styleText("/@script-style/136dd27abdd2ca9a737c3409.css");
  style.textContent += window.__p0Modules.styleText("/@script-style/0224557a4a2c157257e0401d.css");
  (document.head||document.documentElement).append(style);
  window.addEventListener('click', event => {
    const button = event.target.closest?.(buttons);
    if (!button) return;
    if (busy()) { event.preventDefault(); event.stopImmediatePropagation(); stop(); return; }
    materializeDefault(inputFor(button));
  }, true);
  window.addEventListener('submit', event => {
    if (!event.target.matches?.('.composer,.lxfd-composer,.hero-composer')) return;
    if (busy()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    materializeDefault(event.target.querySelector('textarea'));
  }, true);
  window.addEventListener('compositionstart', event => {
    if (event.target.matches?.(inputs)) composing.add(event.target);
  }, true);
  window.addEventListener('compositionend', event => composing.delete(event.target), true);
  window.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || !event.target.matches?.(inputs)) return;
    // IME confirmation must reach the browser but not legacy Enter-to-send handlers.
    if (event.isComposing || event.keyCode === 229 || composing.has(event.target)) {
      event.stopImmediatePropagation(); return;
    }
    if (event.repeat || busy()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    materializeDefault(event.target);
  }, true);
  let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;sync();});}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class','placeholder','readonly']});
  document.addEventListener('input',sync);
})();

};

/* public/leaip0/assets/frontend/js/core/prompt-menu-height-v1.js */
window.__p0Modules.sources["ud360d6b8c137a088"]=function(){
(()=>{'use strict';if(window.__lxPromptMenuFit)return;window.__lxPromptMenuFit=true;let queued=false;const observed=new WeakSet(),ro=new ResizeObserver(schedule);
function visible(el){return el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'}
function fit(){queued=false;document.querySelectorAll('.assistant-panel').forEach(panel=>{const menu=panel.querySelector('.page-dots .prompt-menu'),dots=menu?.closest('.page-dots');if(!menu||!visible(panel))return;[panel,...panel.querySelectorAll('.assistant-bottom,.composer,.tool-row')].forEach(el=>{if(!observed.has(el)){observed.add(el);ro.observe(el)}});if(!visible(menu))return;const pr=panel.getBoundingClientRect();let top=Math.max(8,pr.top+8),bottom=Math.min(innerHeight-8,pr.bottom-8);const toolbar=panel.querySelector('.tool-row');if(visible(toolbar))top=Math.max(top,toolbar.getBoundingClientRect().bottom+8);panel.querySelectorAll('.assistant-bottom,.composer,.quick-services,.quick-actions').forEach(el=>{if(!visible(el))return;const r=el.getBoundingClientRect();if(r.height>0&&r.top>top)bottom=Math.min(bottom,r.top-10)});const max=Math.max(0,Math.floor(bottom-top));menu.style.setProperty('max-height',max+'px','important');menu.style.setProperty('box-sizing','border-box','important');menu.style.setProperty('overflow-y','auto','important');menu.style.setProperty('overflow-x','hidden','important');menu.style.setProperty('transform','none','important');const h=Math.min(menu.getBoundingClientRect().height,max),dr=dots.getBoundingClientRect(),y=Math.max(top,Math.min(dr.top+dr.height/2-h/2,bottom-h)),parent=menu.offsetParent,origin=parent?parent.getBoundingClientRect().top+parent.clientTop-parent.scrollTop:0;menu.style.setProperty('top',(y-origin)+'px','important')})}
function schedule(){if(!queued){queued=true;requestAnimationFrame(fit)}}document.addEventListener('pointerover',e=>{if(e.target.closest?.('.page-dots'))schedule()},true);document.addEventListener('focusin',schedule);window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,true);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();
})();

};

/* public/leaip0/assets/frontend/js/core/query-result-runtime-v1.js */
window.__p0Modules.sources["u9c24218ee1c973f5"]=function(){
/* Shared query-result protocol. Shell adapters own typing, trace, history and fullscreen handoff. */
(function () {
  'use strict';
  if (window.__lxQueryResults) return;
  const definitions = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function register(type, definition) { definitions.set(type, definition); }
  function find(query) { return [...definitions.values()].find(item => item.matches(query)); }
  function page(type, id, label, payload) {
    const definition = definitions.get(type);
    if (!definition) throw new Error('结果类型未注册');
    return {id,kind:'info',label,resultType:type,payload,html:definition.render(payload)};
  }
  function remember(result) {
    if (!window.__lxBridge?.registerResultPage) throw new Error('结果页尚未就绪');
    window.__lxBridge.registerResultPage(result);
    return result;
  }
  function open(result) { remember(result); return window.__lxBridge.openResultPage(result); }
  function waitForCard(card, token) {
    const generation = window.__lxGeneration;
    return generation.wait(token,new Promise(resolve => {
      if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        generation.frame(token,()=>generation.frame(token,resolve)); return;
      }
      let finished = false;
      const finish = event => { if (event && event.target !== card) return; if (finished) return; finished = true; card.removeEventListener('animationend',finish); resolve(); };
      card.addEventListener('animationend',finish);
      // Single animation completion fallback; the sequence remains awaited.
      generation.timeout(token,finish,720);
    }));
  }
  async function run(host) {
    const definition = find(host.query);
    if (!definition) return false;
    const generation = window.__lxGeneration, token = host.token;
    host.busy(true);
    let message;
    try {
      message = host.create(definition.skill);
      const data = await generation.wait(token,definition.load(host.query));
      if (!generation.current(token)) return true;
      const result = definition.responseOnly ? null : remember(definition.result(data,host.query));
      const copy = definition.answer(data,host.query);
      await generation.wait(token,host.answer(message,copy,definition.skill,definition.complete(data)));
      if (!generation.current(token)) return true;
      // Execution feedback stays in the current conversation and detail page.
      if (definition.responseOnly) return true;
      const card = host.card(message,{resultId:result.id,title:definition.cardTitle,desc:definition.cardDescription(data)});
      card?.classList.add('lx-document-card-enter');
      host.save();
      await waitForCard(card,token);
      if (!generation.current(token)) return true;
      host.reveal(()=>{ if (generation.current(token)) open(result); });
      host.save();
    } catch (error) {
      if (!generation.current(token) || error?.name === 'AbortError') throw error;
      await generation.wait(token,host.answer(message,definition.errorAnswer || '招聘信息暂时未能加载，请稍后重新发送“**联想最新的招聘信息**”。你也可以访问联想招聘官网查看公开职位。',definition.skill,definition.errorStatus || '本次未完成，招聘信息加载失败',false));
    } finally {
      if (generation.current(token)) { host.busy(false); host.save(); }
    }
    return true;
  }
  window.__lxQueryResults = {register,matches:query=>!!find(query),run,page,remember,open,escape};
})();

};

/* public/leaip0/assets/frontend/js/core/recommendation-followups-v1.js */
window.__p0Modules.sources["ud15577c643e30a5e"]=function(){
/* PC-对话-商品推荐追问：choices remain a draft until the composer is submitted. */
(() => {
  'use strict';
  if (window.__lxRecommendationFollowups) return;
  const groups = [
    { key: 'device', label: '设备类型', question: '您好！为了给您推荐最合适的联想产品，请问您主要想选购哪一类设备呢？', options: ['笔记本', '台式机', '平板', '手机'] },
    { key: 'usage', label: '使用场景', multiple: true, question: '另外，您购买这台设备主要是用于什么场景呢？比如办公、游戏、设计还是日常娱乐？', options: ['日常办公/学习', '大型游戏/高性能需求', '创意设计/专业绘图', '影音娱乐/便携出行'] },
    { key: 'budget', label: '预算', question: '您对设备的预算范围有初步的规划吗？这样我可以帮您锁定性价比最高的型号。', options: ['3000元以下', '3000-5000元', '5000-8000元', '8000元以上', '暂时没具体预算，看推荐'] }
  ];
  const selected = new Set();
  let source = '', prepared = null, scheduled = false;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = (group, index) => group.key + ':' + index;
  const items = () => groups.flatMap(group => group.options.flatMap((label, index) => selected.has(key(group, index)) ? [{id:key(group,index), label, group:group.label}] : []));
  const composers = () => Array.from(document.querySelectorAll('#lxfdComposer, .assistant-panel .composer')).filter(el => !el.closest('[aria-hidden="true"], .lx-transition-clone'));
  function refresh() {
    scheduled = false;
    const choices = items();
    for (const panel of document.querySelectorAll('.lx-recommendation-followups')) {
      for (const button of panel.querySelectorAll('[data-lx-reco-choice]')) {
        const active = panel.dataset.lxRecoFollowup === source && selected.has(button.dataset.lxRecoChoice);
        button.setAttribute('aria-pressed', String(active));
      }
    }
    for (const form of composers()) {
      const input = form.querySelector('textarea');
      if (!input) continue;
      let tags = form.querySelector(':scope > .lx-reco-draft-tags');
      if (choices.length && !tags) {
        tags = document.createElement('div');
        tags.className = 'lx-reco-draft-tags';
        tags.setAttribute('role', 'group');
        tags.setAttribute('aria-label', '已选择的商品需求');
        form.insertBefore(tags, input);
      }
      if (tags) {
        const html = choices.map(item => `<span class="lx-reco-draft-tag"><span>${escape(item.label)}</span><button type="button" data-lx-reco-remove="${item.id}" aria-label="移除${escape(item.group)}：${escape(item.label)}"><span aria-hidden="true">×</span></button></span>`).join('');
        if (tags.innerHTML !== html) tags.innerHTML = html;
        tags.hidden = !choices.length;
      }
      form.classList.toggle('has-reco-draft', !!choices.length);

    }
    window.__lxGeneration?.sync();
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); }
  }
  function clear() { selected.clear(); source = ''; prepared = null; refresh(); }
  function render(id) {
    return `<section class="lx-recommendation-followups" data-lx-reco-followup="${escape(id)}" aria-label="完善商品推荐需求"><p class="lx-reco-followup-intro">为了能更精准地为你推荐符合需求的商品，还想进一步了解相关具体情况</p><div class="lx-reco-followup-panel">${groups.map(group => `<fieldset><legend>${group.question}</legend><div class="lx-reco-followup-options">${group.options.map((label, index) => `<button type="button" data-lx-reco-choice="${key(group,index)}" aria-pressed="false">${label}</button>`).join('')}</div></fieldset>`).join('')}</div></section>`;
  }
  function prepare(text, input) {
    const value = String(text || '').trim();
    if (!input?.matches('#lxfdTa, .assistant-panel .composer textarea') || !selected.size) return value;
    const requirements = groups.map(group => {
      const values = group.options.filter((_, index) => selected.has(key(group,index)));
      return values.length ? `${group.label}：${values.join('、')}` : '';
    }).filter(Boolean).join('；');
    const query = `请根据以下需求推荐商品：${requirements}。${value ? '\n' + value : ''}`;
    prepared = {query, signature: Array.from(selected).join('|')};
    return query;
  }
  function consume(query) {
    // Called only after the normal access/busy checks accept this exact composer query.
    if (prepared?.query === query && prepared.signature === Array.from(selected).join('|')) clear();
  }
  document.addEventListener('click', event => {
    const choice = event.target.closest?.('[data-lx-reco-choice]');
    const remove = event.target.closest?.('[data-lx-reco-remove]');
    if (!choice && !remove) return;
    event.preventDefault(); event.stopPropagation();
    if (choice) {
      const panel = choice.closest('.lx-recommendation-followups');
      if (!panel) return;
      const [groupKey, index] = choice.dataset.lxRecoChoice.split(':');
      const group = groups.find(item => item.key === groupKey);
      if (!group || !group.options[Number(index)]) return;
      source = panel.dataset.lxRecoFollowup;
      const id = choice.dataset.lxRecoChoice, wasSelected = selected.has(id);
      if (!group.multiple) for (const item of Array.from(selected)) if (item.startsWith(groupKey + ':')) selected.delete(item);
      if (wasSelected) selected.delete(id); else selected.add(id);
    } else selected.delete(remove.dataset.lxRecoRemove);
    prepared = null;
    refresh();
    const input = document.body.classList.contains('assistant-fullscreen') ? document.querySelector('#lxfdTa') : document.querySelector('.assistant-panel .composer textarea');
    input?.focus({preventScroll:true});
  });
  document.addEventListener('input', event => {
    if (event.target.matches?.('#lxfdTa, .assistant-panel .composer textarea')) schedule();
  });
  window.__lxRecommendationFollowups = {render, prepare, consume, clear, refresh, hasSelection: () => selected.size > 0};
  function init() {
    // Streaming text does not trigger a rescan. Only newly mounted panels/composers/history do.
    const relevant = '.lx-recommendation-followups, #lxfdComposer, .assistant-panel .composer';
    new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && (node.matches(relevant) || node.querySelector(relevant))))) schedule();
    }).observe(document.body, {childList:true, subtree:true});
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();

};

/* public/leaip0/assets/frontend/js/core/tab-reorder-v1.js */
window.__p0Modules.sources["u8dc5ecbb5c5b9ed3"]=function(){
(()=>{'use strict';if(window.__lxTabReorder)return;window.__lxTabReorder=true;
const barSelector='.lx-tabbar',tabSelector='.lx-tab[data-tab-id]',key='lexiang.tabOrder.v1:'+location.pathname;let order=[],drag=null,suppressUntil=0;try{order=JSON.parse(sessionStorage.getItem(key)||'[]');if(!Array.isArray(order))order=[]}catch(_){}
const state=()=>window.__lxAgentAPI?.getState?.()||window.__lxState||{};
const id=e=>e.dataset.tabId;
function fixed(el){const t=(state().tabs||[]).find(t=>t.id===id(el));return t?.kind==='site'||String(id(el)).startsWith('site:')||/^(个人及家庭|个人及家庭：.*|个人及家庭:.*|中小企业|政教及大企业|品牌)$/.test(el.querySelector('.lx-tab-label')?.textContent.trim()||'')}
function tabs(bar){return [...bar.querySelectorAll(tabSelector)]}function movable(bar){return tabs(bar).filter(t=>!fixed(t))}
const css=document.createElement('style');css.textContent=window.__p0Modules.styleText("/@script-style/242307c9433770fd2ddc38b1.css");document.head.append(css);
function paintInk(bar){const active=bar.querySelector('.lx-tab.is-active'),ink=bar.querySelector('.lx-tab-ink');if(active&&ink){const label=active.querySelector('.lx-tab-label')||active;const w=Math.min(50,label.offsetWidth||active.offsetWidth);ink.style.left=active.offsetLeft+label.offsetLeft+(label.offsetWidth-w)/2+'px';ink.style.width=w+'px'}}
function apply(bar,ids){const all=tabs(bar),free=all.filter(t=>!fixed(t)),rank=new Map(ids.map((x,i)=>[x,i]));const sorted=free.slice().sort((a,b)=>(rank.get(id(a))??1e6)-(rank.get(id(b))??1e6));let n=0;const next=all.map(t=>fixed(t)?t:sorted[n++]);if(next.some((e,i)=>e!==all[i])){const anchor=bar.querySelector('.lx-tab-ink');next.forEach(el=>bar.insertBefore(el,anchor))}const s=state(),map=new Map(next.map((el,i)=>[id(el),i]));if(Array.isArray(s.tabs))s.tabs.sort((a,b)=>(map.get(a.id)??1e6)-(map.get(b.id)??1e6));paintInk(bar)}
function sync(){document.querySelectorAll(barSelector).forEach(bar=>{tabs(bar).forEach(el=>{const allowed=!fixed(el);if(el.draggable!==allowed)el.draggable=allowed;if(el.dataset.tabSortable!==String(allowed))el.dataset.tabSortable=String(allowed);if(allowed){if(!el.hasAttribute('tabindex'))el.tabIndex=0;if(!el.hasAttribute('aria-description'))el.setAttribute('aria-description','拖动可调整标签顺序，也可按 Alt 加左右方向键移动')}});if(order.length&&!drag)apply(bar,order)})}
function commit(bar,ids){order=ids;apply(bar,ids);try{sessionStorage.setItem(key,JSON.stringify(order));window.__lxSaveConversationNow?.()}catch(_){}}
function clear(){document.querySelectorAll('.lx-tab-dragging,.lx-tab-drop-before,.lx-tab-drop-after').forEach(e=>e.classList.remove('lx-tab-dragging','lx-tab-drop-before','lx-tab-drop-after'));drag=null}
window.addEventListener('pointerdown',e=>{const close=e.target.closest?.('.lx-tab-close');if(close){const t=close.closest(tabSelector);if(t)t.draggable=false}},true);
window.addEventListener('pointerup',()=>{if(!drag)sync()},true);
window.addEventListener('dragstart',e=>{const el=e.target.closest?.(tabSelector);if(!el||!el.closest(barSelector))return;if(fixed(el)||e.target.closest('.lx-tab-close')){e.preventDefault();return}drag={el,bar:el.closest(barSelector),target:null,after:false};el.classList.add('lx-tab-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id(el));e.stopPropagation()},true);
window.addEventListener('dragover',e=>{if(!drag)return;const bar=e.target.closest?.(barSelector);if(bar!==drag.bar)return;e.preventDefault();e.dataTransfer.dropEffect='move';const target=e.target.closest(tabSelector);bar.querySelectorAll('.lx-tab-drop-before,.lx-tab-drop-after').forEach(t=>t.classList.remove('lx-tab-drop-before','lx-tab-drop-after'));drag.target=null;if(target&&target!==drag.el&&!fixed(target)){const r=target.getBoundingClientRect();drag.after=e.clientX>r.left+r.width/2;drag.target=target;target.classList.add(drag.after?'lx-tab-drop-after':'lx-tab-drop-before')}const r=bar.getBoundingClientRect();if(e.clientX>r.right-24)bar.scrollLeft+=14;else if(e.clientX<r.left+24)bar.scrollLeft-=14;e.stopPropagation()},true);
window.addEventListener('drop',e=>{if(!drag)return;const current=drag;if(e.target.closest?.(barSelector)!==current.bar){clear();return}e.preventDefault();e.stopImmediatePropagation();if(current.target){const ids=movable(current.bar).map(id).filter(x=>x!==id(current.el)),at=ids.indexOf(id(current.target))+(current.after?1:0);ids.splice(at,0,id(current.el));clear();commit(current.bar,ids)}else clear();suppressUntil=Date.now()+350;sync()},true);
window.addEventListener('dragend',()=>{if(drag)suppressUntil=Date.now()+350;clear();sync()},true);
window.addEventListener('click',e=>{if(Date.now()<suppressUntil&&e.target.closest?.(tabSelector)){e.preventDefault();e.stopImmediatePropagation()}},true);
window.addEventListener('keydown',e=>{const el=e.target.closest?.(tabSelector);if(!el||fixed(el)||!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest('.lx-tab-close'))return;const bar=el.closest(barSelector),ids=movable(bar).map(id),from=ids.indexOf(id(el)),to=from+(e.key==='ArrowLeft'?-1:1);if(to<0||to>=ids.length)return;e.preventDefault();e.stopImmediatePropagation();[ids[from],ids[to]]=[ids[to],ids[from]];commit(bar,ids);el.focus()},true);
new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});sync();
})();

};

/* public/leaip0/assets/frontend/js/core/tabbar-compression-v1.js */
window.__p0Modules.sources["u3d614472748a0996"]=function(){
/* Migrated from the 8783 reference's shop-tabbar-chrome-v171.js.
 * Keep its natural-width / equal-compression layout across all five entries.
 * Every tab remains in the row; page identity, activation and closing stay
 * owned by the existing tab manager.
 */
(() => {
  'use strict';
  if (window.__lxTabbarCompression) return;
  window.__lxTabbarCompression = true;
  const selector = '.content > .lx-tabbar';
  const bars = new Map();
  let scheduled = false;

  let stickyScheduled = false;

  function updateSticky(bar) {
    const content = bar.parentElement;
    if (!bar.isConnected || !content) return;
    const style = getComputedStyle(bar);
    const rect = bar.getBoundingClientRect();
    const viewport = content.getBoundingClientRect();
    const stuck = !bar.hidden && bar.clientWidth > 0 && style.position === 'sticky'
      && content.scrollTop > 1
      && rect.top <= viewport.top + content.clientTop + (Number.parseFloat(style.top) || 0) + 1;
    if (stuck) {
      const start = viewport.left + content.clientLeft;
      const insets = {
        '--lx-tabbar-bleed-left': Math.max(0, rect.left - start),
        '--lx-tabbar-bleed-right': Math.max(0, start + content.clientWidth - rect.right)
      };
      for (const [property, value] of Object.entries(insets)) {
        const pixels = value + 'px';
        if (bar.style.getPropertyValue(property) !== pixels) bar.style.setProperty(property, pixels);
      }
    }
    bar.classList.toggle('lx-tabbar-stuck', stuck);
  }

  function scheduleSticky() {
    if (stickyScheduled) return;
    stickyScheduled = true;
    requestAnimationFrame(() => {
      stickyScheduled = false;
      bars.forEach((observers, bar) => updateSticky(bar));
    });
  }

  function layout(bar) {
    updateSticky(bar);
    if (!bar.isConnected || bar.hidden || !bar.clientWidth) return;
    bar.classList.remove('lx-tabbar-overflowing');
    const tabs = [...bar.querySelectorAll(':scope > .lx-tab')];
    tabs.forEach(tab => {
      const title = tab.querySelector('.lx-tab-label')?.textContent?.trim() || '';
      if (tab.title !== title) tab.title = title;
    });
    if (tabs.length <= 1) return;
    const style = getComputedStyle(bar);
    const gap = Number.parseFloat(style.columnGap) || 6;
    const available = bar.clientWidth - (Number.parseFloat(style.paddingLeft) || 0) - (Number.parseFloat(style.paddingRight) || 0);
    const naturalRequired = tabs.reduce((width, tab) => width + tab.getBoundingClientRect().width, 0) + (tabs.length - 1) * gap;
    if (naturalRequired <= available) return;
    bar.classList.add('lx-tabbar-overflowing');
    bar.scrollLeft = 0;
  }

  function refresh() {
    scheduled = false;
    for (const [bar, observers] of bars) {
      if (!bar.isConnected) {
        observers.forEach(observer => observer.disconnect());
        bars.delete(bar);
      }
    }
    document.querySelectorAll(selector).forEach(bar => {
      if (!bars.has(bar)) {
        bar.setAttribute('data-lx-tab-compression', '');
        const mutation = new MutationObserver(scheduleLayout);
        mutation.observe(bar, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
        mutation.observe(bar.parentElement, { attributes: true, attributeFilter: ['data-view', 'class'] });
        const resize = new ResizeObserver(scheduleLayout);
        resize.observe(bar);
        resize.observe(bar.parentElement);
        bars.set(bar, [mutation, resize]);
      }
      layout(bar);
    });
  }

  function scheduleLayout() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  function attach() {
    new MutationObserver(records => {
      const containsBar = node => node.nodeType === 1 && (node.matches('.lx-tabbar') || node.querySelector('.lx-tabbar'));
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(containsBar))) scheduleLayout();
    }).observe(document.body, { childList: true, subtree: true });
    scheduleLayout();
    document.fonts?.ready.then(scheduleLayout);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();
  window.addEventListener('resize', scheduleLayout);
  document.addEventListener('scroll', event => {
    if (event.target?.matches?.('.content')) scheduleSticky();
  }, true);
})();

};

/* public/leaip0/assets/frontend/js/core/thinking-auto-v1.js */
window.__p0Modules.sources["u8ee2a897a3409390"]=function(){
/* Unified thinking switch across fullscreen and split composers. */
(()=>{'use strict';if(window.__lxThinkingAuto)return;const KEY='lexiang.deepThink.v1',SELECTOR='.composer [data-mode-chip="think"],.hero-composer [data-mode-chip="think"],.lxfd-comp-left .lxfd-toggle';let pending=false;
function read(){try{return localStorage.getItem(KEY)!=='0';}catch{return true;}}let enabled=read();
function buttons(){return [...document.querySelectorAll(SELECTOR)].filter(n=>n.dataset.modeChip==='think'||n.textContent.includes('深度思考'));}
function sync(){pending=false;window.__lxThinking=enabled;for(const n of buttons()){const split=n.dataset.modeChip==='think',text=enabled?'深度思考(自动)':'深度思考';for(const cls of split?['primary','is-active']:['on'])if(n.classList.contains(cls)!==enabled)n.classList.toggle(cls,enabled);if(n.getAttribute('aria-pressed')!==String(enabled))n.setAttribute('aria-pressed',String(enabled));if(n.getAttribute('aria-label')!==text)n.setAttribute('aria-label',text);const title=enabled?'点击关闭深度思考':'点击开启深度思考(自动)';if(n.title!==title)n.title=title;const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.nodeValue.includes('深度思考')&&node.nodeValue!==text)node.nodeValue=text;}}}
function schedule(){if(!pending){pending=true;requestAnimationFrame(sync);}}
function toggle(e){const n=e.target.closest?.(SELECTOR);if(!n||!(n.dataset.modeChip==='think'||n.textContent.includes('深度思考')))return;if(e.type==='keydown'&&(n.tagName==='BUTTON'||!['Enter',' '].includes(e.key)||e.repeat))return;e.preventDefault();e.stopImmediatePropagation();enabled=!enabled;try{localStorage.setItem(KEY,enabled?'1':'0');}catch{}sync();}
window.addEventListener('click',toggle,true);window.addEventListener('keydown',toggle,true);window.addEventListener('storage',e=>{if(e.key===KEY){enabled=read();sync();}});new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','aria-pressed']});const style=document.createElement('style');style.textContent=window.__p0Modules.styleText("/@script-style/4449b4d9be6e30cfa9bfda28.css");document.head.append(style);window.__lxThinkingAuto={sync:schedule};sync();})();

};
}
window.__p0Modules.dispatch(document.currentScript);

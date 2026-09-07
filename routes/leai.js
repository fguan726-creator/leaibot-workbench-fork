const express = require('express');
const router = express.Router();
const { getAuth, getFaq, mapProductList } = require('../core/leai_client');
const db = require('../db/schema');
const useLeaiProductCatalog = process.env.LEAI_PRODUCT_CATALOG_ENABLED === '1';
const { authoritativeRecommendations, siteFromRequest } = require('../core/p0-authoritative-recommendations');

const AIGC_BASE = 'https://aigc.lenovo.com.cn/v3';
const HEADERS = {
  'Origin': 'https://leai.lenovo.com.cn',
  'Referer': 'https://leai.lenovo.com.cn/'
};

// GET /api/leai/auth — 获取 guest session token
router.get('/auth', async (req, res) => {
  try {
    const resp = await fetch(`${AIGC_BASE}/api/user/auth?${Date.now()}&device=1`, { headers: HEADERS });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leai/faq — FAQ热门问题
router.get('/faq', async (req, res) => {
  try {
    // 用带 token 的 getFaq（官方 faq 需 Authorization，否则 data 为 null）
    const data = await getFaq();
    res.json({ rc: 0, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ error: e.message, data: [] });
  }
});

// POST /api/leai/chat — SSE流式对话代理
router.post('/chat', async (req, res) => {
  const { sessionId, token, input, questionType = '1' } = req.body;
  if (!sessionId || !token || !input) return res.status(400).json({ error: '缺少参数' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const resp = await fetch(`${AIGC_BASE}/api/chat/qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        ...HEADERS
      },
      body: JSON.stringify({ sessionId, input, questionType, timestamp: Date.now(), device: 1 })
    });

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ── 会话槽位保底 ─────────────────────────────────────────────────────────────
// 官方模型多轮拆解会概率性丢数字条件（说了"7000左右"，追问"要结合学习"后预算没了）。
// per-session 记住用户提过的预算，追问没提新预算时替他拼回提醒。内存态，重启即清（POC 够用）。
const SESSION_SLOTS = new Map(); // sessionId → { budget: '7000', ts }
function slotExtractBudget(msg) {
  const m = String(msg || '').match(/(?:预算|价位)\s*(?:大概|大约|约|在)?\s*(?<![a-zA-Z0-9])(\d{3,6})|(?<![a-zA-Z0-9])(\d{3,6})\s*(?:块钱|块|元)?\s*(?:左右|以内|以下|上下|之内)|(?<![a-zA-Z0-9])(\d{3,6})\s*(?:块钱|块|元)(?![a-zA-Z0-9])/);
  const n = Number(m && (m[1] || m[2] || m[3]));
  return n >= 500 && n <= 200000 ? String(n) : null;
}

// ── 商品槽位保底（件2 F2）─────────────────────────────────────────────────
// 真机诊断（puppeteer 抓包，见 f2Diagnosis）：sessionId 前端确实带对了、值是 32hex、和上一轮
// status/done 返回的 conv_id 完全一致——前端链路没断。问题在官方端：同一 sessionId 下"对比一下/
// 第二款怎么样"这类不点名具体商品的短追问，官方经常调用错误的 Skill（如「商品知识技能」而非
// 「商品推荐服务」）、答非所问，等同于"失忆"。这里 per-session 记住上一轮官方实际返回的商品名，
// 短追问且自己没点名具体商品时拼回提醒，让官方能对齐"我说的对比是指这几款"。
const SESSION_PRODUCTS = new Map(); // sessionId → { names: string[], ts }
function isShortFollowupNeedingProductContext(msg) {
  const t = String(msg || '').trim();
  if (!t || t.length > 20) return false;
  // 已经点名具体商品/型号（含数字型号如 Y9000P/R7000）的不算"没头没脑的追问"，官方自己接得住
  if (/[a-zA-Z]{2,}\d|拯救者|小新|thinkpad|thinkbook|yoga|legion/i.test(t)) return false;
  return /^(对比|比较|比一比|比一下)(一下)?(它们|这些)?$|^第?[一二三四五六1-9]\s*[个款台]?(怎么样|如何|好吗|好不好)?$|^(这|那|哪)[个款台](怎么样|好|更好|好一些|如何)?[吗呢]?$|^(还有)?(别的|其他)(推荐|选择|款)?[吗呢]?$|^哪(个|款)(更?好|更?值)/.test(t);
}

// POST /api/leai/stream — 翻译官方 SSE 为前端 chunk/status/display/done 格式
router.post('/stream', async (req, res) => {
  const { message, sessionId: bodySessionId, lng, lat, enableThinking } = req.body;
  if (!message) return res.status(400).json({ error: '缺少 message 参数' });
  const safeBodySessionId = /^[a-f0-9]{32}$/i.test(String(bodySessionId || '')) ? String(bodySessionId) : '';

  // 门店查询官方需定位，否则卡在 get_position 等死。前端传真实经纬度则用，否则默认北京(演示)。
  const extendParams = {
    longitude: String(lng || '116.404'),
    latitude: String(lat || '39.915'),
  };

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // 页面操作短路：纯操作指令（关标签/回首页/切站/开订单等）不走官方大模型——
  // 官方 LLM 不懂我们的标签/分页概念，会答"我是文字助手没有浏览器"。直接发 control 事件让前端执行 + 简短确认。
  const controlIntents = [
    { op: 'close_all_tabs', re: /关闭(所有|全部|这些|当前)?(标签|页面|分页|tab|页签).*|(把|将)?(所有|全部|这些)(标签|页面|分页|页签).{0,4}关(掉|闭)?|关(掉|闭)(所有|全部)?(标签|页面|分页|页签)|清空(标签|页面|分页|页签)/i, text: '好的，已为你关闭所有打开的页面标签。' },
    { op: 'go_home', re: /回(到)?首页|返回首页|去首页|回主页/, text: '好的，已为你回到首页。' },
    { op: 'open_orders', re: /(我的|查看?|打开|看看?)订单|订单(列表|页面|中心)/, text: '好的，已为你打开订单页面。' },
    { op: 'open_cart', re: /(我的|查看?|打开|看看?)购物车|购物车(里|有什么)?/, text: '好的，已为你打开购物车。' },
    { op: 'clear_compare', re: /清(空|除)对比|清(空|除)(对比)?清单|删(掉|除)对比/, text: '好的，已为你清空对比清单。' },
  ];
  const ctrl = controlIntents.find(({ re }) => re.test(message));
  if (ctrl) {
    res.write('event: chunk\ndata:' + JSON.stringify({ text: ctrl.text }) + '\n\n');
    res.write('event: control\ndata:' + JSON.stringify({ op: ctrl.op }) + '\n\n');
    res.write('event: done\ndata:' + JSON.stringify({ conv_id: safeBodySessionId || null }) + '\n\n');
    return res.end();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    let auth = await getAuth();
    let sessionId = safeBodySessionId || auth.sessionId;

    // 槽位保底：本轮提了预算→记住；没提且是延续会话的选购类短追问→拼回预算提醒
    let qaInput = message;
    const _newBudget = slotExtractBudget(message);
    if (_newBudget) {
      SESSION_SLOTS.set(sessionId, { budget: _newBudget, ts: Date.now() });
    } else if (safeBodySessionId) {
      const _slot = SESSION_SLOTS.get(safeBodySessionId);
      if (_slot && Date.now() - _slot.ts < 30 * 60 * 1000 && String(message).length <= 40 &&
          /学习|办公|游戏|轻薄|便携|大屏|续航|学生|上学|设计|剪辑|编程|推荐|适合|换个?|再来?|还是|要|买|选/.test(message)) {
        qaInput = message + '（补充：预算仍是之前说的' + _slot.budget + '元左右，推荐请继续满足）';
      }
    }
    if (SESSION_SLOTS.size > 1000) SESSION_SLOTS.clear(); // ponytail: 简单上限防内存涨,够POC用

    // 商品槽位保底：短追问（对比一下/第N款/这个怎么样）没点名具体商品 → 拼回上一轮官方实际
    // 推荐过的商品名，防官方反问"想对比什么"（诊断见上方注释）。budget 槽位和这条互不冲突，
    // 都是在 qaInput 后面追加说明，官方模型能一起读到。
    if (safeBodySessionId && isShortFollowupNeedingProductContext(message)) {
      const _prodSlot = SESSION_PRODUCTS.get(safeBodySessionId);
      if (_prodSlot && Date.now() - _prodSlot.ts < 30 * 60 * 1000 && _prodSlot.names.length) {
        qaInput = qaInput + '（补充：你上一轮给我推荐的是：' + _prodSlot.names.join('、') + '，我这句就是针对这几款说的）';
      }
    }
    if (SESSION_PRODUCTS.size > 1000) SESSION_PRODUCTS.clear();

    const callQa = (token, sid) => fetch(`${AIGC_BASE}/api/chat/qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
        ...HEADERS,
      },
      body: JSON.stringify({
        input: qaInput,
        sessionId: sid,
        entrySource: 'pc',
        timestamp: Date.now(),
        questionType: '1',
        extendParams,
        enableThinking: !!enableThinking,
      }),
      signal: controller.signal,
    });

    let upstream = await callQa(auth.token, sessionId);
    // 缓存的 guest token 可能比 20min 缓存先过期 → 401/403 时强制重新鉴权并重试一次
    if (upstream.status === 401 || upstream.status === 403) {
      auth = await getAuth(true);
      sessionId = safeBodySessionId || auth.sessionId;
      upstream = await callQa(auth.token, sessionId);
    }

    if (!upstream.ok || !upstream.body) {
      throw new Error('upstream http ' + upstream.status);
    }

    // 读流翻译 + session 失效("参数有误")自动重试一次
    let buf = '';
    let lastLen = 0;
    let sentProducts = false;
    let sentClicks = false;
    let retried = false;
    // 多意图补缺：官方跑了门店/权益 skill 但只回文本不发前端组件（实测多意图一轮只带 1 个
    // action + 1 个 display），从 thinking_trace 嗅探到对应 skill 就代发 action，前端现成
    // handler 开门店/优惠 tab。member/商品官方自己会发，不代发防重复。
    let sentStoresAction = false;
    let sentCouponAction = false;

    // 首次进入前先回传当前 sessionId（重试时在重试分支里更新并重发）
    res.write('event: status\ndata:' + JSON.stringify({ conv_id: sessionId, sessionId }) + '\n\n');

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let needRetry = false;
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      streamLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // 保留不完整行

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          let d;
          try { d = JSON.parse(line.slice(5)); } catch { continue; }
          const r = d.response || {};

          // session 失效检测：正文未开始 + response_text 是"参数有误"/"params error" → 丢弃并重试
          if (!retried && lastLen === 0 && typeof r.response_text === 'string') {
            const trimmed = r.response_text.replace(/\s/g, '');
            const lower = trimmed.toLowerCase();
            if (trimmed === '参数有误' || trimmed.startsWith('参数有误') || lower === 'paramserror.' || lower === 'paramserror' || lower.startsWith('paramserror')) {
              needRetry = true;
              break streamLoop;
            }
          }

          // 限流检测：正文还没开始 + response_text 含「访问用户过多」或「稍后再试」→ 发 fallback（重试无用）
          if (lastLen === 0 && typeof r.response_text === 'string') {
            const txt = r.response_text;
            if (txt.includes('访问用户过多') || txt.includes('稍后再试')) {
              res.write('event: fallback\ndata:' + JSON.stringify({}) + '\n\n');
              res.write('event: done\ndata:' + JSON.stringify({ conv_id: null }) + '\n\n');
              res.end();
              clearTimeout(timer);
              return;
            }
          }

          // 思考/调用过程（官方 thinking_trace：分析意图 / 调用 skill / 查知识库）→ 翻成 status 让前端展示
          // 只在正文还没开始流式时展示（正文一来就被覆盖，符合"思考中→出答案"的官方体验）
          if (!lastLen && d.thinking_trace && Array.isArray(d.thinking_trace.trace) && d.thinking_trace.trace.length) {
            const steps = d.thinking_trace.trace;
            const last = steps[steps.length - 1];
            const tip = last && last.thinking ? String(last.thinking).slice(0, 60) : '';
            if (tip) res.write('event: status\ndata:' + JSON.stringify({ text: tip }) + '\n\n');
            const allThinking = steps.map((s) => s && s.thinking ? String(s.thinking) : '').join('\n');
            if (!sentStoresAction && allThinking.indexOf('Skill(联想门店服务)') >= 0) {
              sentStoresAction = true;
              res.write('event: action\ndata:' + JSON.stringify({ op: 'stores' }) + '\n\n');
            }
            if (!sentCouponAction && allThinking.indexOf('Skill(会员权益服务)') >= 0) {
              sentCouponAction = true;
              res.write('event: action\ndata:' + JSON.stringify({ op: 'coupon' }) + '\n\n');
            }
          }

          // 文本增量（官方是全量累积，必须切 delta）
          if (typeof r.response_text === 'string' && r.response_text.length > lastLen) {
            const delta = r.response_text.slice(lastLen);
            lastLen = r.response_text.length;
            res.write('event: chunk\ndata:' + JSON.stringify({ text: delta }) + '\n\n');
          }

          // 商品（只发一次）
          if (!sentProducts && Array.isArray(r.product_list) && r.product_list.length) {
            const recommendationLimit = useLeaiProductCatalog ? 12 : 6;
            const upstreamProducts = mapProductList(r.product_list, recommendationLimit);
            const products = useLeaiProductCatalog
              ? authoritativeRecommendations(db, upstreamProducts, { site: siteFromRequest(req), limit: recommendationLimit })
              : upstreamProducts;
            if (products.length) {
              sentProducts = true;
              const _names = products.map((p) => p && p.name).filter(Boolean);
              if (_names.length) SESSION_PRODUCTS.set(sessionId, { names: _names, ts: Date.now() });
              res.write('event: display\ndata:' + JSON.stringify({ products, title: '为你推荐' }) + '\n\n');
            }
          }

          // 官方动作按钮 click_list（转人工 human_access / 在线客服等）→ 翻成 clicks 事件，前端渲染成按钮
          if (!sentClicks && Array.isArray(r.click_list) && r.click_list.length) {
            const clicks = r.click_list.map((c) => ({
              event_type: c.event_type || '',
              display_text: c.display_text || '',
              link_url: c.link_url || '',
              callback_data: c.callback_data || '',
            })).filter((c) => c.display_text);
            if (clicks.length) {
              sentClicks = true;
              res.write('event: clicks\ndata:' + JSON.stringify({ clicks }) + '\n\n');
            }
          }
        }
      }

      if (needRetry && !retried) {
        retried = true;
        // session 失效：重新鉴权，拿全新 sessionId（忽略 bodySessionId）
        auth = await getAuth(true);
        sessionId = auth.sessionId;
        // 重置流状态
        buf = '';
        lastLen = 0;
        sentProducts = false;
        sentClicks = false;
        // 回传新 sessionId 让前端更新 conv_id
        res.write('event: status\ndata:' + JSON.stringify({ conv_id: sessionId, sessionId }) + '\n\n');
        upstream = await callQa(auth.token, sessionId);
        if (!upstream.ok || !upstream.body) throw new Error('upstream http ' + upstream.status + ' (retry)');
        continue; // 重新走流式循环
      }

      break; // 正常结束
    }

    // 意图检测：在 done 前发 action 事件（正文已流完再开功能标签，体验顺）
    // 保守匹配：宁可少触发，不误伤商品问题
    const intentPatterns = [
      { op: 'member',   re: /我的?会员|会员权益|会员中心|我的积分|乐豆|我的权益/ },
      { op: 'coupon',   re: /优惠券|领券|我的券|有什么券|卡券/ },
      { op: 'solution', re: /解决方案|行业方案|(企业|政教|金融|教育|医疗|制造).{0,4}方案/ },
      { op: 'edu',      re: /教育优惠|学生优惠|校园优惠|教育特惠|学生认证|教育商店/ },
      { op: 'stores',   re: /门店|实体店|线下店|体验店|专卖店|服务网点|服务中心|到店|附近.{0,4}店/ },
      { op: 'auth',     re: /职场.{0,2}认证|职场人群|在职.{0,2}认证|工牌认证|职场身份|员工认证/ },
    ];
    const matchedIntent = intentPatterns.find(({ re }) => re.test(message));
    if (matchedIntent) {
      res.write('event: action\ndata:' + JSON.stringify({ op: matchedIntent.op }) + '\n\n');
    }

    res.write('event: done\ndata:' + JSON.stringify({ conv_id: sessionId }) + '\n\n');
    res.end();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[leai/stream] error:', err && err.message, err && err.name);
      res.write('event: fallback\ndata:' + JSON.stringify({}) + '\n\n');
    }
    res.write('event: done\ndata:' + JSON.stringify({ conv_id: null }) + '\n\n');
    res.end();
  } finally {
    clearTimeout(timer);
  }
});

// POST /api/leai/followups — 火山 lite 生成追问 chips（非流式）
const https = require('https');
router.post('/followups', (req, res) => {
  const q = String((req.body && req.body.q) || '').trim().slice(0, 300);
  const a = String((req.body && req.body.a) || '').trim().slice(0, 300);
  if (!q) return res.json({ rc: 0, questions: [] });

  const sys = '你是联想乐享购物助手的「猜你想干」生成器。基于问答生成3个用户下一步最可能想做或想问的事，每个≤15字、口语化、不重复原问题。优先生成可直接执行的操作句（如"帮我算到手价""看看有什么优惠""支持分期吗""对比一下这几款"），其次才是咨询问题。只围绕联想自家产品、政策、服务、优惠、门店、认证等，绝不提及苹果/小米/华为/华硕/戴尔等任何竞品品牌。只返回JSON数组如["句1","句2","句3"]，不要其它文字。';
  const userContent = `问:${q}\n答:${a}`;
  const body = JSON.stringify({
    model: 'doubao-seed-2.0-lite',
    messages: [{ role: 'system', content: sys }, { role: 'user', content: userContent }],
    max_tokens: 200, temperature: 0.7, stream: false, thinking: { type: 'disabled' }
  });

  try {
    const ar = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/coding/v3/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.DASHSCOPE_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (r) => {
      let buf = '';
      r.on('data', chunk => { buf += chunk.toString(); });
      r.on('end', () => {
        try {
          const j = JSON.parse(buf);
          const raw = j.choices?.[0]?.message?.content || '';
          // 容错：找 JSON 数组
          const m = raw.match(/\[[\s\S]*\]/);
          const arr = m ? JSON.parse(m[0]) : [];
          const questions = Array.isArray(arr) ? arr.slice(0, 3).map(String) : [];
          res.json({ rc: 0, questions });
        } catch (_) {
          res.json({ rc: 0, questions: [] });
        }
      });
      r.on('error', () => res.json({ rc: 0, questions: [] }));
    });
    ar.on('error', () => { try { res.json({ rc: 0, questions: [] }); } catch (_) {} });
    ar.setTimeout(10000, () => { ar.destroy(); try { res.json({ rc: 0, questions: [] }); } catch (_) {} });
    ar.write(body);
    ar.end();
  } catch (_) {
    res.json({ rc: 0, questions: [] });
  }
});

// POST /api/leai/compare-advice — 火山 lite 对比推荐（非流式）
router.post('/compare-advice', (req, res) => {
  const { products, q } = req.body || {};
  if (!Array.isArray(products) || products.length < 2) return res.json({ pick: '', reason: '' });
  const sys = '你是导购，从这几款里结合用户需求推荐最合适的一款，输出JSON {"pick":"商品名","reason":"≤40字理由"}。只返回JSON。';
  const summary = products.map(p => `${p.name || ''}（¥${p.price || ''}，${p.cpu || ''}，${p.ram || p.memory || ''}）`).join('；');
  const userContent = `商品：${summary}\n用户需求：${String(q || '').slice(0, 200)}`;
  const body = JSON.stringify({
    model: 'doubao-seed-2.0-lite',
    messages: [{ role: 'system', content: sys }, { role: 'user', content: userContent }],
    max_tokens: 200, temperature: 0.3, stream: false, thinking: { type: 'disabled' }
  });
  try {
    const ar = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/coding/v3/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.DASHSCOPE_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (r) => {
      let buf = '';
      r.on('data', chunk => { buf += chunk.toString(); });
      r.on('end', () => {
        try {
          const j = JSON.parse(buf);
          const raw = (j.choices?.[0]?.message?.content || '').trim();
          const m = raw.match(/\{[\s\S]*\}/);
          const obj = m ? JSON.parse(m[0]) : {};
          res.json({ pick: String(obj.pick || ''), reason: String(obj.reason || '') });
        } catch (_) { res.json({ pick: '', reason: '' }); }
      });
      r.on('error', () => { try { res.json({ pick: '', reason: '' }); } catch (_) {} });
    });
    ar.on('error', () => { try { res.json({ pick: '', reason: '' }); } catch (_) {} });
    ar.setTimeout(12000, () => { ar.destroy(); try { res.json({ pick: '', reason: '' }); } catch (_) {} });
    ar.write(body);
    ar.end();
  } catch (_) { res.json({ pick: '', reason: '' }); }
});

// POST /api/leai/intent — 火山 lite 意图路由（control vs chat）
// 意图路由：function calling 强制结构化输出（比 prompt 列枚举+正则抠 JSON 稳），网关/模型不支持 tools 时自动降级老路
const INTENT_OPS = ['close_all_tabs', 'close_other_tabs', 'close_tab', 'go_home', 'switch_site', 'open_member', 'open_coupon', 'open_orders', 'open_cart', 'open_stores', 'open_edu_zone', 'open_compare', 'clear_compare', 'start_student_auth', 'start_enterprise_auth', 'open_product', 'enter_fullscreen', 'exit_fullscreen', 'buy_current', 'buy_nth', 'compare_nth'];
const INTENT_RULES = `你是联想乐享 PC 助手的意图路由器，判断用户输入是"页面操作指令"(control)还是"问答/咨询"(chat)，调用 route_intent 上报。
判断规则：
1. 只有明确要求"操作界面/页面/标签/全屏"或"明确要下单/购买当前/某序号商品"才是 control。
2. 商品咨询、推荐、参数、价格、政策、闲聊，以及"我想买X、预算多少、帮我推荐"这类【表达购买需求但没指定具体某款下单】的，一律 chat（要推荐，不是下单）。
3. 打开具体商品是 control："打开XX/帮我打开XX/看下XX/帮我看看XX"且XX是具体商品名或型号（如"帮我打开拯救者Y9000P"→op=open_product,target="拯救者Y9000P"；"看下小新Pro16"→op=open_product,target="小新Pro16"）。注意与咨询区分："XX怎么样/XX多少钱"是 chat。
4. "全屏/放大/沉浸" → enter_fullscreen；"退出全屏/分屏/缩小/展开右侧/边聊边逛" → exit_fullscreen。
5. "关所有标签/清空标签" → close_all_tabs；"只留当前/关其他/留一排" → close_other_tabs；"关这个/关闭XX标签" → close_tab，target=标签名。
6. 下单重点区分：
   - "下单/就买它/买这个/这个不错下单吧/嗯那就这台吧帮我领券" 等【确认购买当前在看的】 → buy_current。
   - "第三个下单/买第二个/第3个加购/打开第二个" 等【按序号操作】 → buy_nth，target="序号|动作"（buy/cart/open），如"3|buy"。序号限1-20。
   - "对比下1 2 3/把1和3对比/1和2哪个好" → compare_nth，target="1,3" 逗号分隔，至少2个序号。
   - "我想买笔记本预算1万到2万" → chat！金额不是序号，没指定具体某款绝不判 buy_*。
7. 拿不准一律 chat（下单是重操作，不确定绝不误触发）。`;
const INTENT_TOOLS = [{
  type: 'function',
  function: {
    name: 'route_intent',
    description: '上报用户输入的意图路由结果',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['control', 'chat'], description: '页面操作=control，问答咨询=chat' },
        op: { type: 'string', enum: INTENT_OPS.concat(['']), description: 'control 时的操作码，chat 时为空字符串' },
        target: { type: 'string', description: '操作目标：open_product=商品名；buy_nth="序号|动作"；compare_nth="1,2,3"；close_tab=标签名；其余留空' }
      },
      required: ['type']
    }
  }
}];
function normalizeIntent(obj) {
  const type = obj && obj.type === 'control' ? 'control' : 'chat';
  const op = String((obj && obj.op) || '');
  // 服务端白名单校验：模型自造的 op 一律不认，宁可降级 chat 也不误执行
  if (type === 'control' && !INTENT_OPS.includes(op)) return { type: 'chat', op: '', target: '' };
  return { type, op: type === 'control' ? op : '', target: String((obj && obj.target) || '') };
}
// 快速通道：不含任何 control 触发词的输入（绝大多数商品咨询/推荐/闲聊）直接判 chat，
// 省掉一次 ~3s 的模型往返；命中词表才交给模型精判（宁多调不漏判，规则第 7 条拿不准=chat）
const INTENT_CONTROL_HINT = /关闭|关掉|关所有|关其他|只留|清空|全屏|分屏|沉浸|放大|缩小|展开|收起|打开|看下|看看|查看|下单|买|购|加购|领券|对比|比较|哪个好|第\s*[一二三四五六七八九十\d]+\s*[个台款]|序号|标签|首页|回到|返回|切换|会员|优惠券|券|订单|购物车|门店|教育|认证|升级|边聊边逛|退出|\b(open|close|buy|compare|tab|cart|order|store)\b/i;
router.post('/intent', (req, res) => {
  const { message } = req.body || {};
  const fallback = { type: 'chat', op: '', target: '' };
  if (!message) return res.json(fallback);
  if (!INTENT_CONTROL_HINT.test(String(message))) return res.json(fallback);
  const body = JSON.stringify({
    model: 'doubao-seed-2.0-lite',
    messages: [{ role: 'system', content: INTENT_RULES }, { role: 'user', content: String(message).slice(0, 500) }],
    tools: INTENT_TOOLS,
    tool_choice: { type: 'function', function: { name: 'route_intent' } },
    max_tokens: 150, temperature: 0, stream: false, thinking: { type: 'disabled' }
  });
  try {
    const ar = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/coding/v3/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.DASHSCOPE_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (r) => {
      let buf = '';
      r.on('data', chunk => { buf += chunk.toString(); });
      r.on('end', () => {
        try {
          const j = JSON.parse(buf);
          const msg = j.choices?.[0]?.message || {};
          // 首选 tool_calls 结构化参数；网关/模型不支持 tools 时降级解析 content 里的 JSON
          const tc = msg.tool_calls?.[0]?.function?.arguments;
          if (tc) return res.json(normalizeIntent(JSON.parse(tc)));
          const raw = (msg.content || '').trim();
          const m = raw.match(/\{[\s\S]*?\}/);
          return res.json(normalizeIntent(m ? JSON.parse(m[0]) : null));
        } catch (_) { try { res.json(fallback); } catch (__) {} }
      });
      r.on('error', () => { try { res.json(fallback); } catch (_) {} });
    });
    ar.on('error', () => { try { res.json(fallback); } catch (_) {} });
    ar.setTimeout(6000, () => { ar.destroy(); try { res.json(fallback); } catch (_) {} });
    ar.write(body);
    ar.end();
  } catch (_) { res.json(fallback); }
});

// GET /api/leai/member — 透传官方登录态会员信息（guest/memberLevel/loginName）
router.get('/member', async (req, res) => {
  try {
    const a = await getAuth();
    res.json({
      guest: !!a.guest,
      memberLevel: a.memberLevel || '',
      memberLevelCode: a.memberLevelCode || '',
      loginName: a.loginName || '',
    });
  } catch (_) {
    res.json({ guest: true });
  }
});

module.exports = router;

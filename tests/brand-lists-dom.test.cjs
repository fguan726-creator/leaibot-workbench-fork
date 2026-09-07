const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(require('node:path').resolve(__dirname, '../public/js/brand-lists.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(fetcher, storedFilters) {
  const dom = new JSDOM('<body><div class="content"></div><button data-brand-list="news">查看更多新闻</button><button data-brand-list="cases">查看更多案例</button></body>', { url: 'https://new.leaibot.cn/brand/', runScripts: 'outside-only' });
  const window = dom.window;
  const opened = [];
  const renderers = new Map();
  const host = window.document.querySelector('.content');
  host.scrollTo = () => {};
  window.fetch = fetcher;
  if (storedFilters) window.sessionStorage.setItem('lx.brand-list.cases', JSON.stringify(storedFilters));
  window.__lxBridge = {
    registerPageRenderer(kind, render) { renderers.set(kind, render); },
    openPage(tab) { opened.push(tab); renderers.get(tab.kind)?.(tab, host); }
  };
  window.eval(source);
  return { window, dom, opened, host, open: kind => window.document.querySelector(`[data-brand-list="${kind}"]`).click() };
}
const response = (total = 25, title = '测试新闻') => ({ ok: true, json: async () => ({ totalNum: total, items: total ? [{ id: 'a', title, pcUrl: '//brand.lenovo.com.cn/brand/a.html', pcCoverImg: '//p1.lefile.cn/a.jpg', startTimeStr: '2026-09-05' }] : [], filterV2: [{ name: 'startTimeAggs', items: [{ name: '1|2026' }] }] }) });

test('lists have no search controls; stable tabs, pagination and return work', async () => {
  const requests = [];
  const env = setup(async url => { requests.push(new URL(url)); return response(); });
  env.open('news'); await tick();
  assert.equal(env.opened[0].id, 'brand-list:news');
  assert.equal(env.host.querySelector('h1').textContent, '新闻');
  assert.equal(env.host.querySelectorAll('.lxbrand-list-card').length, 1);
  assert.equal(env.host.querySelector('form, input, select, [type="reset"]'), null);
  env.host.querySelector('[aria-label="下一页"]').click(); await tick();
  assert.equal(requests.at(-1).searchParams.get('page'), '2');
  const panel = env.host.firstElementChild;
  env.open('cases'); await tick();
  assert.equal(env.host.querySelector('form, input, select, [type="reset"]'), null);
  env.open('news');
  assert.equal(env.host.firstElementChild, panel);
  assert.equal(env.host.querySelector('[aria-current="page"]').textContent, '2');
  env.host.querySelector('[data-brand-back]').click();
  assert.equal(env.opened.at(-1).id, 'site:brand');
  env.dom.window.close();
});

test('failed requests leave retry; recovery and empty results are distinct', async () => {
  let fail = true;
  const env = setup(async () => { if (fail) throw new Error('offline'); return response(0); });
  env.open('news'); await tick();
  assert.equal(env.host.querySelector('.lxbrand-list-summary').textContent, '内容暂时无法加载');
  assert.equal(env.host.querySelector('.lxbrand-list-results').getAttribute('aria-busy'), 'false');
  fail = false; env.host.querySelector('[data-brand-retry]').click(); await tick();
  assert.match(env.host.textContent, /未找到相关内容/);
  assert.equal(env.host.querySelectorAll('[data-brand-page]').length, 0);
  env.dom.window.close();
});

test('out-of-order responses cannot replace the latest list request', async () => {
  const pending = [];
  const env = setup(() => new Promise(resolve => pending.push(resolve)));
  env.open('news');
  env.open('news');
  pending[1](response(1, '最新结果')); await tick();
  pending[0](response(1, '旧结果')); await tick();
  assert.equal(env.host.querySelector('h2').textContent, '最新结果');
  env.dom.window.close();
});

test('legacy search conditions are discarded so no invisible filter remains', async () => {
  const requests = [];
  const env = setup(async url => { requests.push(new URL(url)); throw new Error('offline'); }, { query: '科研', year: '2025', industry: '教育行业', page: 2 });
  env.open('cases'); await tick();
  assert.equal(requests.at(-1).searchParams.get('keyword'), '');
  assert.equal(requests.at(-1).searchParams.get('page'), '1');
  assert.deepEqual(JSON.parse(requests.at(-1).searchParams.get('condition')), { type: 66, startTime: '', industryCategory: '' });
  env.dom.window.close();
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.resolve(__dirname, '../public/js/brand-lists.js');
const api = fs.existsSync(modulePath) ? require(modulePath) : {};

test('official list request preserves search text and selects correct content type', () => {
  assert.equal(typeof api.requestURL, 'function', 'brand list request builder is missing');
  const url = new URL(api.requestURL('cases', { query: '高校 & AI', year: '2026', industry: '教育行业', page: 2 }));
  assert.equal(url.origin, 'https://s.lenovo.com.cn');
  assert.equal(url.searchParams.get('keyword'), '高校 & AI');
  assert.equal(url.searchParams.get('page'), '2');
  assert.deepEqual(JSON.parse(url.searchParams.get('condition')), { type: 66, startTime: '2026', industryCategory: '教育行业' });
  assert.equal(JSON.parse(new URL(api.requestURL('news', {})).searchParams.get('condition')).type, 60);
});

test('only trusted HTTPS official article and image URLs are accepted', () => {
  assert.equal(typeof api.safeURL, 'function', 'URL validation is missing');
  assert.equal(api.safeURL('//brand.lenovo.com.cn/brand/test.html'), 'https://brand.lenovo.com.cn/brand/test.html');
  assert.equal(api.safeURL('javascript:alert(1)'), '');
  assert.equal(api.safeURL('https://brand.lenovo.com.cn.evil.test/a'), '');
  assert.equal(api.safeURL('https://evil.test/a'), '');
  assert.equal(api.safeURL('//p1.lefile.cn/image.jpg', true), 'https://p1.lefile.cn/image.jpg');
});

test('normalization retains official title, date, counts and industry filters', () => {
  assert.equal(typeof api.normalizeResponse, 'function', 'response normalization is missing');
  const result = api.normalizeResponse({ totalNum: '25', items: [{ id: 'a', title: '科研案例', pcUrl: '//biz.lenovo.com.cn/case/a.html', pcCoverImg: '//p1.lefile.cn/a.jpg', startTimeStr: '2026-08-06 18:00:00', industryCategory: ['教育行业'] }], filterV2: [{ name: 'startTimeAggs', items: [{ name: '1|2026' }, { name: '9|更早' }] }, { name: 'industryCategory', items: [{ name: '教育行业' }] }] });
  assert.equal(result.total, 25);
  assert.equal(result.items[0].date, '2026-08-06');
  assert.deepEqual(result.years, ['2026', '更早']);
  assert.deepEqual(result.industries, ['教育行业']);
  assert.throws(() => api.normalizeResponse({ message: 'failure' }));
  assert.deepEqual(api.normalizeResponse({ totalNum: 0, items: [] }).items, []);
});

test('page controls stay bounded for first, middle, last and empty results', () => {
  assert.equal(typeof api.pageNumbers, 'function', 'pagination helper is missing');
  assert.deepEqual(api.pageNumbers(1, 0), []);
  assert.deepEqual(api.pageNumbers(1, 2), [1, 2]);
  assert.deepEqual(api.pageNumbers(7, 20), [1, 'gap', 5, 6, 7, 8, 9, 'gap', 20]);
  assert.deepEqual(api.pageNumbers(20, 20), [1, 'gap', 18, 19, 20]);
});

test('escapes official content instead of interpolating markup', () => {
  assert.equal(typeof api.escapeHTML, 'function', 'HTML escaping is missing');
  assert.equal(api.escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});

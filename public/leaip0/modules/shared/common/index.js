/* 全站公共基础 — P0 business implementations. */
/* Compatibility scheduler for the 48 P0 business modules.
 * Preserve classic-script global bindings and the established CSS insertion order.
 * Package libraries register implementations without starting page interactions.
 */
(function () {
  if (window.__p0Modules) return;
  const sources = Object.create(null), factories = Object.create(null);
  const styles = new Map(), mounts = new WeakMap();
  const api = window.__p0Modules = {
    version: 1, sources, factories, installed: Object.create(null), scripts: {}, css: {},
    invoke(id, scope, receiver, args) {
      const factory = factories[id];
      if (!factory) throw new Error('P0 business implementation missing: ' + id);
      return factory(scope).apply(receiver, args);
    },
    collectStyles() {
      for (const sheet of document.styleSheets) {
        if (!sheet.ownerNode?.hasAttribute('data-p0-style-library')) continue;
        for (const rule of sheet.cssRules) {
          const match = rule.conditionText?.match(/^\(-p0-part:\s*([a-zA-Z0-9_-]+)\)$/);
          if (match) styles.set(match[1], Array.from(rule.cssRules, r => r.cssText).join('\n'));
        }
      }
    },
    styleText(key) {
      if (key.startsWith('/modules/')) key = decodeURIComponent(new URL(key, location.href).hash.slice(10));
      if (!styles.size) api.collectStyles();
      const parts = api.css[key];
      if (!parts) throw new Error('P0 style slot missing: ' + key);
      return parts.map(part => {
        if (!styles.has(part.part)) throw new Error('P0 style part missing: ' + part.part);
        return styles.get(part.part);
      }).join('\n');
    },
    mountStyle(link, key) {
      if (!link || mounts.has(link)) return;
      if (key.startsWith('/modules/')) key = decodeURIComponent(new URL(key, location.href).hash.slice(10));
      if (!styles.size) api.collectStyles();
      const node = document.createElement('style');
      node.dataset.p0Style = key;
      if (link.media) node.media = link.media;
      node.textContent = api.styleText(key);
      link.before(node);
      node.disabled = link.disabled;
      mounts.set(link, node);
    },
    run(key, originalNode) {
      const units = api.scripts[key];
      if (!units) throw new Error('P0 script slot missing: ' + key);
      const code = units.map(id => {
        const fn = sources[id];
        if (!fn) throw new Error('P0 script implementation missing: ' + id);
        const body = Function.prototype.toString.call(fn);
        return body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'));
      }).join('\n;\n');
      const node = document.createElement('script');
      node.dataset.p0Execution = key;
      // JavaScript readers retain their historical asset base; no src attribute
      // is set, so the browser executes the registered code without an old URL.
      Object.defineProperty(node, 'src', {value: new URL(key, location.href).href});
      if (originalNode?.nonce) node.nonce = originalNode.nonce;
      node.textContent = code + '\n//# sourceURL=p0-module:' + key;
      if (originalNode?.parentNode) originalNode.after(node);
      else (document.head || document.documentElement).appendChild(node);
    },
    dispatch(node) {
      if (!node || node.hasAttribute('data-p0-library')) return;
      const hash = new URL(node.src, location.href).hash;
      if (hash.startsWith('#p0-script=')) api.run(decodeURIComponent(hash.slice(11)), node);
    }
  };
  document.addEventListener('load', event => {
    const node = event.target;
    if (node?.tagName !== 'LINK' || node.hasAttribute('data-p0-style-library')) return;
    const hash = new URL(node.href, location.href).hash;
    if (hash.startsWith('#p0-style=')) api.mountStyle(node, decodeURIComponent(hash.slice(10)));
  }, true);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') {
        const mounted = mounts.get(record.target);
        if (mounted) { mounted.media = record.target.media; mounted.disabled = record.target.disabled; }
      }
      for (const node of record.removedNodes) {
        const mounted = mounts.get(node);
        if (mounted && !node.isConnected) { mounted.remove(); mounts.delete(node); }
      }
    }
  }).observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['media','disabled']});
})();

window.__p0Modules.scripts={"/assets/frontend/bundles/p0-biz-core-1.js":["u70ac31fc278c2823","u31e5f3c1e54fbcbe"],"/assets/frontend/bundles/p0-biz-core-3.js":["u90ffe4a3cdbaa0c3","u4f355a113335dd9f","uc1505fdb78a9b295","u494b4df1164a187a","u477664e569dd9618","uf3195eadf93530ba","u68f9cd8769040aca"],"/assets/frontend/bundles/p0-biz-core-4.js":["ud5d096a7151b8f98","ue82d0a7c768928f9","uc7d8102785209270"],"/assets/frontend/bundles/p0-biz-core-5.js":["u6faaa8786b71f994","u926ad1389ae82d55","u01975edb721bfc32","u6887261366f10e55"],"/assets/frontend/bundles/p0-biz-core-6.js":["u64813aef9b5d08c7","ue9442aa8c670f435","u6663a15bf799c69e","u69895e7f6ebbbcf6","u1e03e65e1d10c612","ua4f3c95b34cb4458","u59832b42649cf67f"],"/assets/frontend/bundles/p0-brand-core-1.js":["u70ac31fc278c2823","ucd856ec3e45d03ed"],"/assets/frontend/bundles/p0-brand-core-4.js":["ud5d096a7151b8f98","u6a6c58fc6d2c65b4","uf1395f77f2f04caa"],"/assets/frontend/bundles/p0-brand-core-6.js":["u599570cc1c6608b6","u845b3e54e80e4b4a"],"/assets/frontend/bundles/p0-brand-detail.js":["u55a37e2dc06d5ada","u3856c842123f47d1"],"/assets/frontend/bundles/p0-brand-orders.js":["u964d5c5f0a92784e","ub6f48396e439846b"],"/assets/frontend/bundles/p0-home-core-2.js":["ud5d096a7151b8f98","uc3149669caba07fc"],"/assets/frontend/bundles/p0-home-core-4.js":["ua8d7c44567b25eb5","ue9442aa8c670f435","ua4f3c95b34cb4458","u59832b42649cf67f","u6d7e20c85f4c0e59","u76ac0b7ce1e510c8"],"/assets/frontend/bundles/p0-shared-2193a72921a1.js":["u6d7e20c85f4c0e59","u76ac0b7ce1e510c8"],"/assets/frontend/bundles/p0-shared-4c83dffe8380.js":["u19f95e6c832cf15a","u8aeada2454e576fe"],"/assets/frontend/bundles/p0-shared-68e249410c86.js":["u90ffe4a3cdbaa0c3","u4f355a113335dd9f","uc1505fdb78a9b295","u494b4df1164a187a","u477664e569dd9618","uf3195eadf93530ba"],"/assets/frontend/bundles/p0-shared-8491f3cdf2b3.js":["u6faaa8786b71f994","u926ad1389ae82d55"],"/assets/frontend/bundles/p0-shared-ad829c58dcc0.js":["u437d17a3e5194a98","u73a4a641432fdfe4","u8e0a493b90c9abe6","u3856c842123f47d1"],"/assets/frontend/bundles/p0-shared-ddfb481cbe66.js":["ub3d8e5924a68b3bd","u2f17c5238459aa66","u0a201502b72b569f","u165ded9a2bb7aa2e","u3cee9c8f14299a30","uf6e1801495ea2ec0","u40fb7a01ecc3a735"],"/assets/frontend/bundles/p0-shared-ed8f45144e8f.js":["u964d5c5f0a92784e","ufac3b596c3b40014","u496f54a3def87082"],"/assets/frontend/bundles/p0-shop-core-1.js":["u70ac31fc278c2823","ua1bb1478a1a3e572"],"/assets/frontend/bundles/p0-shop-core-4-appointment-v71.js":["ud5d096a7151b8f98","u6c996dde0b33f40f","uc7d8102785209270"],"/assets/frontend/bundles/p0-shop-core-6.js":["u64813aef9b5d08c7","ue9442aa8c670f435","u6663a15bf799c69e","ua4f3c95b34cb4458","u59832b42649cf67f"],"/assets/frontend/bundles/p0-smb-core-1.js":["u70ac31fc278c2823","u1572d37322936b59"],"/assets/frontend/bundles/p0-smb-core-3.js":["u90ffe4a3cdbaa0c3","u4f355a113335dd9f","uc1505fdb78a9b295","u494b4df1164a187a","u477664e569dd9618","uf3195eadf93530ba","u1fe6b0daf91105ae"],"/assets/frontend/bundles/p0-smb-core-4.js":["ud5d096a7151b8f98","u221d77ff691ec8d4","uc7d8102785209270"],"/assets/frontend/bundles/p0-smb-core-5.js":["ufa03d62c0b757af3","ufaec1781d6a7bcdc"],"/assets/frontend/bundles/p0-smb-core-6.js":["u6faaa8786b71f994","u926ad1389ae82d55","udc9953c868626edb","ua07e3d67803a6b75"],"/assets/frontend/bundles/p0-smb-core-7.js":["u64813aef9b5d08c7","ue9442aa8c670f435","u6663a15bf799c69e","u40fc223dfc9c2a65","u1e03e65e1d10c612","u10d1f471be512c8e","ua4f3c95b34cb4458","u59832b42649cf67f"],"/assets/frontend/js/components/member-service-clean-v45.js":["uf6422dbb0508c86d"],"/assets/frontend/js/core/answer-actions-v1.js":["ucc3f7487fbe1651b"],"/assets/frontend/js/core/app-agent.js":["u2533e1dec0d991d4"],"/assets/frontend/js/core/app-lxfd.home-conversation-v122.placeholder-v147.controls-v150.js":["ucfd257a885af82b6"],"/assets/frontend/js/core/app-lxfd.js":["u0b3c115072cbfa90"],"/assets/frontend/js/core/brand-ai-hero-v1.js":["u8d33f720fb06477b"],"/assets/frontend/js/core/channel-home-hero-height-v1.js":["u3ff26218b4cda204"],"/assets/frontend/js/core/comparison-display-actions-v1.js":["u0eef0e297ad3b765"],"/assets/frontend/js/core/composer-autogrow-v1.js":["ud1a6c0e55b76afc6"],"/assets/frontend/js/core/composer-smart-actions-v1.js":["u599570cc1c6608b6"],"/assets/frontend/js/core/detail-operating-system-v1.js":["u6bb29bcc43fff595"],"/assets/frontend/js/core/education-auth-accessibility-v1.js":["u214a3172388c51d8"],"/assets/frontend/js/core/education-member-state-sync-v1.js":["u642a431b6eaf7aa2"],"/assets/frontend/js/core/education-offer-query-v1.js":["ub21e263c0b382cd8"],"/assets/frontend/js/core/enterprise-auth-original-v1.js":["u6fa7a08121402d64"],"/assets/frontend/js/core/followup-chevron-v1.js":["u845b3e54e80e4b4a"],"/assets/frontend/js/core/gaming-query-v1.js":["u9b9dcc5b93b2fdcd"],"/assets/frontend/js/core/generation-control-v1.js":["uecf34ea3f3d35b9e"],"/assets/frontend/js/core/manufacturing-solution-rows-v1.js":["ufbd06926b932b879"],"/assets/frontend/js/core/member-coupon-center-v1.js":["u0940425517a453a5"],"/assets/frontend/js/core/member-service-checkin-v135.js":["u9f15dc235f518932"],"/assets/frontend/js/core/notification-toast-v1.js":["u20c3cef677d1a7ca"],"/assets/frontend/js/core/order-login-v1.js":["uac02d9bf296f0fc2"],"/assets/frontend/js/core/p0-direct-entry.js":["u3da97aba1824eaa7"],"/assets/frontend/js/core/product-card-detail-loading-v139.js":["ua8d7c44567b25eb5"],"/assets/frontend/js/core/product-detail-navigation-v1.js":["u34b3bcacde0c016f"],"/assets/frontend/js/core/product-specs-grouped-v1.js":["ue4edbdcfb53c4d7c"],"/assets/frontend/js/core/prompt-menu-height-v1.js":["ud360d6b8c137a088"],"/assets/frontend/js/core/query-result-runtime-v1.js":["u9c24218ee1c973f5"],"/assets/frontend/js/core/reco-match-v1.js":["u9a56eae55aad4bea"],"/assets/frontend/js/core/recommendation-followups-v1.js":["ud15577c643e30a5e"],"/assets/frontend/js/core/recruitment-v1.js":["u177ee9fe5b2d4e25"],"/assets/frontend/js/core/review-media-v1.js":["uaf95f5cdffda1d1e"],"/assets/frontend/js/core/service-products-query-v1.js":["ud0b6fc0181529458"],"/assets/frontend/js/core/tab-reorder-v1.js":["u8dc5ecbb5c5b9ed3"],"/assets/frontend/js/core/tabbar-compression-v1.js":["u3d614472748a0996"],"/assets/frontend/js/core/thinking-auto-v1.js":["u8ee2a897a3409390"],"/assets/frontend/js/pages/biz/inline-13.js":["u344d02d8044058b2"],"/assets/frontend/js/pages/biz/inline-17.js":["u6ec95a192a89da74"],"/assets/frontend/js/pages/brand/brand-query-v1.js":["u1243637abf86a7ad"],"/assets/frontend/js/pages/brand/brand-summary-v1.js":["ua2918bf0b0c03289"],"/assets/frontend/js/pages/brand/inline-13.js":["u0e49fb7a83fb30aa"],"/assets/frontend/js/pages/brand/inline-17.js":["u3b6ed5f2d41b46ba"],"/assets/frontend/js/pages/home/inline-01.js":["uf6f4ebf15fd068e6"],"/assets/frontend/js/pages/home/inline-02.js":["u376451b45c8d0894"],"/assets/frontend/js/pages/home/inline-08.js":["ud3b52a578997a9fa"],"/assets/frontend/js/pages/home/inline-14.js":["ub999d5bad4a1ed8a"],"/assets/frontend/js/pages/home/inline-15.js":["u638df9a970495484"],"/assets/frontend/js/pages/home/inline-16.js":["u1b0475066f47365d"],"/assets/frontend/js/pages/shop/inline-13.js":["u1b8538dec3f56439"],"/assets/frontend/js/pages/shop/inline-17.js":["ue0662dcc0554705c"],"/assets/frontend/js/pages/shop/inline-22.banner-detail-v111.js":["u468a061bdb41f88b"],"/assets/frontend/js/pages/shop/scene-banner-v154.js":["u88751115a1d6b6d6"],"/assets/frontend/js/pages/smb/inline-14.js":["ub9b2b95854389660"],"/assets/frontend/js/pages/smb/inline-18.js":["u0ea6add83460b5e1"],"/assets/frontend/js/shared/inline-1cbc376bb123.js":["u6b7b2946a7296fd1"],"/assets/frontend/js/shared/inline-6495b30fa986.js":["u7da36c0b14856c77"],"/assets/frontend/js/shared/inline-f6883bac7348.js":["u68b904105831909e"],"/assets/pages/store-shop-appointment-context-v70.js":["uee40d2b3eeb47a8e"],"/assets/pages/store-v5-detail-surface-v27.js":["u40a2a59bfe5a4c6a"],"/channel-customer-service-v126.js":["u6663a15bf799c69e"],"/@inline/b-chat/index.html/12001.js":["ue64cc0754ed6cac8"],"/@inline/b-chat/index.html/57456.js":["uc66bf9fbe77903ae"],"/@inline/b-chat/index.html/147440.js":["u280e73d3f6d600c3"],"/@inline/biz-chat/index.html/11977.js":["ue64cc0754ed6cac8"],"/@inline/biz-chat/index.html/57957.js":["u4cba4562874bddbc"],"/@inline/biz-chat/index.html/111218.js":["u280e73d3f6d600c3"],"/@inline/biz-chat/index.html/113273.js":["u910c1cf99965734b"],"/@inline/brand/index.html/6813.js":["ue64cc0754ed6cac8"],"/@inline/brand/index.html/68477.js":["u75e7a52d1166f090"],"/@inline/index.html/4390.js":["u0fcb95a911f65e50"],"/@inline/index.html/12576.js":["u31974110bc45bb78"],"/@inline/index.html/14198.js":["u8b531c06bfbe50f0"],"/@inline/index.html/27205.js":["ue64cc0754ed6cac8"],"/@inline/index.html/44122.js":["ufe05f828491096bc"],"/@inline/index.html/44420.js":["ud99096106395a61f"],"/@inline/index.html/80702.js":["ud1a6c0e55b76afc6"],"/@inline/index.html/82214.js":["u599570cc1c6608b6"],"/@inline/shop-chat/index.html/11660.js":["ue64cc0754ed6cac8"],"/@inline/shop-chat/index.html/63896.js":["u5b3e36f1268be62a"],"/@inline/shop-chat/index.html/105246.js":["u280e73d3f6d600c3"],"/@inline/shop-chat/index.html/107302.js":["u4fd5d36f7ed4db77"]};
window.__p0Modules.css={"/assets/components/biz-hero-reference-v1/reference-font.css":[{"owner":"pages/enterprise-home","part":"p14be3562cf32e538aa8b"}],"/assets/components/smb-hero-reference-v1/channel-home-carousel-bottom-v1.css":[{"owner":"pages/smb-home","part":"p5f9a5f4e1f7e1c8e72da"}],"/assets/components/smb-hero-reference-v1/channel-home-copy5-portrait-cards-v1.css":[{"owner":"pages/smb-home","part":"p13124f6c2f2b5cfe02ae"},{"owner":"pages/product-list","part":"p44fa335e8500f0ad2e1c"},{"owner":"pages/smb-home","part":"p2ceaa872662dadbbddab"},{"owner":"shared/common","part":"p341974b010fd92443390"},{"owner":"pages/smb-home","part":"p7ee08ef2462c515b78a7"},{"owner":"shared/common","part":"p9b3c1c682804040f477c"},{"owner":"pages/smb-home","part":"pfeac4ad4af212b041389"}],"/assets/components/smb-hero-reference-v1/channel-home-hero-unified-v161.css":[{"owner":"shared/agent-content","part":"pd4357b1b7a8b219615a7"},{"owner":"pages/smb-home","part":"p17bc74f765be8b86ad77"},{"owner":"shared/agent-content","part":"pef74785b07cd7a47f63e"},{"owner":"shared/common","part":"p0dfbdf57c83d85b128e5"},{"owner":"pages/smb-home","part":"p1cf047f2a16b3ba11521"}],"/assets/components/smb-hero-reference-v1/channel-home-product-cards-large-v1.css":[{"owner":"pages/product-list","part":"pae78054fd08c646012a5"}],"/assets/components/smb-hero-reference-v1/reference-font.css":[{"owner":"pages/smb-home","part":"p65193ae33932e4d01a0a"}],"/assets/frontend/bundles/p0-home-member.css":[{"owner":"pages/member-center","part":"pd1a137068a54d1e640a8"},{"owner":"pages/device-list","part":"pebf836a65162a8d1ef31"},{"owner":"pages/member-center","part":"p26815f27f8d703b868a6"},{"owner":"pages/device-list","part":"p20ec12c618343060d955"},{"owner":"pages/member-center","part":"p8d0ad6d7728eada91f8f"},{"owner":"shared/agent-content","part":"p6841a5015c3aa61b48d9"},{"owner":"pages/member-center","part":"p0facfaad98c49e79b296"},{"owner":"shared/agent-content","part":"p7f1e663317cc3c829a5d"},{"owner":"pages/member-center","part":"paa053c753de6343162c8"},{"owner":"modals/profile-edit","part":"p3c77cd1c0b1c8a8966bf"},{"owner":"pages/member-center","part":"p1027ea8a7041dea2e121"},{"owner":"pages/device-list","part":"p38979a14e1da26903045"},{"owner":"pages/member-center","part":"pedb84f11dc034315cfb5"},{"owner":"pages/device-list","part":"p798d5c78d98fa6328e08"},{"owner":"pages/device-detail","part":"p4295435a6e39415f65bb"},{"owner":"pages/device-list","part":"p7014c95b6d6b48b65143"},{"owner":"pages/member-center","part":"pe271bfc926abecc70484"},{"owner":"pages/device-list","part":"p613ef4cd98820b445b9c"},{"owner":"pages/member-center","part":"peb44ceb125b4131609a3"},{"owner":"pages/ledou-center","part":"pb67154893abbb4e4fb1a"},{"owner":"shared/common","part":"p4c42851e8daa46507001"},{"owner":"pages/ledou-center","part":"pdd7546cd0e72fb88c05f"},{"owner":"shared/common","part":"p814b47c3c70a6d7df52a"},{"owner":"modals/profile-edit","part":"pc0bed0e5411f1a7890a8"},{"owner":"pages/member-center","part":"p621d24c8489799980860"},{"owner":"modals/profile-edit","part":"peaa7d4a9d0935d8d6f18"},{"owner":"pages/member-center","part":"p493c63220aed1cc50a9a"},{"owner":"modals/profile-edit","part":"pfe53ac4824ff9bc2b67e"},{"owner":"pages/device-detail","part":"p1487ebc533e135ef07d9"},{"owner":"pages/member-center","part":"pdc62c64b218b032f097c"},{"owner":"pages/product-list","part":"pe894a8d0ed12a174ab1b"},{"owner":"pages/member-center","part":"p6e5a579be550b8f2f7ed"},{"owner":"pages/order-list","part":"peac2be49441236aa426f"},{"owner":"pages/member-center","part":"pb6995e72d1d008d66efa"},{"owner":"pages/order-list","part":"p1c4cd2776b013fc49e44"},{"owner":"pages/member-center","part":"p0e88609342a759758863"},{"owner":"pages/device-list","part":"p169c684128fc574275d3"},{"owner":"pages/member-center","part":"pf7879d982abfb67434b8"},{"owner":"pages/product-detail","part":"p31bea9173e4ce2953702"},{"owner":"pages/member-center","part":"p64468b176fed831fb777"},{"owner":"pages/product-detail","part":"pfa8dfd30f220df4758d6"},{"owner":"pages/member-center","part":"p0e17cbd7c1510208c7ba"},{"owner":"shared/common","part":"p3bbfd06b3c05981be50d"},{"owner":"pages/member-center","part":"p37a6216268cbb4a33a95"},{"owner":"modals/profile-edit","part":"pdaf23baf0dd02b590d98"},{"owner":"shared/common","part":"pf8a50d01acb5ab6ec12b"},{"owner":"modals/profile-edit","part":"pdfe74d0aed1890e5ea53"},{"owner":"pages/member-center","part":"pd27d7f14cff39ff03121"},{"owner":"shared/common","part":"pa4d79d3e054dcb0a0828"},{"owner":"pages/member-center","part":"p42c067de78792d6c17c4"},{"owner":"shared/common","part":"pda84c474455df94bbfa9"},{"owner":"pages/ledou-center","part":"p868f016d2af7f3f48466"},{"owner":"pages/member-center","part":"p3a71cb234d5765329fed"},{"owner":"shared/common","part":"p53a402f27c38eba8904c"},{"owner":"modals/profile-edit","part":"p78497984beb1ea64ccbf"},{"owner":"pages/member-center","part":"pdf648e81d81a9f42b9ed"},{"owner":"modals/profile-edit","part":"p30003adf03bc4a3e3a74"},{"owner":"pages/member-center","part":"pcb714b5cf0aa1e99e38f"},{"owner":"pages/device-list","part":"p4c57b23919563da207b6"},{"owner":"shared/common","part":"p33709e7a08331c92f535"},{"owner":"modals/profile-edit","part":"pd5b8f02562cf095b340c"},{"owner":"pages/member-center","part":"p512f0c4ddbafc31c6feb"},{"owner":"pages/device-list","part":"pbd1236dd2c698afd15be"},{"owner":"pages/member-center","part":"p932ea8015443be241c2b"},{"owner":"pages/device-list","part":"p0df359a25597f28da291"},{"owner":"pages/member-center","part":"p659b6afb89d5b2445322"},{"owner":"pages/ledou-center","part":"p82ab8cfd73687a316d8c"},{"owner":"pages/coupon-center","part":"p1a41cc23f3c8a023c544"},{"owner":"pages/member-center","part":"p78ffbcee7819e6f679c5"},{"owner":"pages/coupon-center","part":"p7df7a0d21e0c7fc98b60"},{"owner":"pages/member-center","part":"p7e21d822c30c562bb0fd"},{"owner":"pages/device-list","part":"pce42a3746b92b08088f6"},{"owner":"pages/member-center","part":"pf5762f09502b7e746b41"},{"owner":"pages/device-list","part":"p35a464ed6a7b2357f3e3"},{"owner":"pages/member-center","part":"p38bde3b469629303df66"},{"owner":"pages/device-list","part":"p8078b84dbab9f6475ae5"},{"owner":"pages/member-center","part":"p1a10ef67077ca25c343d"},{"owner":"pages/device-list","part":"p4c57b23919563da207b6"},{"owner":"shared/common","part":"p33709e7a08331c92f535"},{"owner":"pages/member-center","part":"p8827262600388ae5e1a5"},{"owner":"pages/device-list","part":"pd3409b6f46d270cb3429"},{"owner":"pages/member-center","part":"p783b30b34400b2cdfe5c"},{"owner":"shared/common","part":"p4942e93e71bb6452218a"},{"owner":"pages/ledou-center","part":"p881a1b08e3bcc3f00aaa"},{"owner":"pages/member-center","part":"p6902dbb1f4cdc1857208"},{"owner":"pages/device-list","part":"p29c3105189abc97b4248"},{"owner":"pages/member-center","part":"p6ace6c21d1d9c3f8a827"},{"owner":"shared/common","part":"p45a9a0305f09ba5f110b"},{"owner":"pages/member-center","part":"p6aa4452215829d6fab08"},{"owner":"pages/device-list","part":"p3e09cd865286e4bf79ec"},{"owner":"pages/member-center","part":"p13ea955673104b457def"},{"owner":"pages/device-list","part":"p35a464ed6a7b2357f3e3"},{"owner":"pages/member-center","part":"pb2eed635b53bb9c24f52"},{"owner":"modals/profile-edit","part":"p0c839db2e6f335519dcd"},{"owner":"pages/member-center","part":"pe0bea76e11d9874d6208"},{"owner":"modals/profile-edit","part":"p4e71394254b5de3bb0a6"},{"owner":"pages/member-center","part":"p787c106a27bb3ccfd39c"},{"owner":"modals/profile-edit","part":"p47a04d5f1195ebcba1c0"},{"owner":"pages/member-center","part":"p8183510b6884df2d07cc"},{"owner":"modals/profile-edit","part":"pacb11fc211baf823b5a1"},{"owner":"pages/member-center","part":"p433055c239c51ddc7091"},{"owner":"modals/profile-edit","part":"p3413ee568cac4f891dcd"},{"owner":"pages/member-center","part":"p5c3d897214693c4f8805"},{"owner":"shared/common","part":"pdea0f73e08f136303bb3"},{"owner":"pages/member-center","part":"p660fec3577e8f068b6f8"},{"owner":"pages/device-list","part":"p8ddac0543121fa5be02d"},{"owner":"pages/member-center","part":"pa59b9e57f3b41ad45012"},{"owner":"modals/profile-edit","part":"p042a56e473ad4c368cac"},{"owner":"pages/member-center","part":"p059bc9df39170df15525"},{"owner":"modals/profile-edit","part":"pd7be457f26cbdbf8868c"},{"owner":"pages/member-center","part":"p2d596d6a7a0089855a1c"},{"owner":"shared/common","part":"pec7d6768099f1b32d107"},{"owner":"pages/member-center","part":"pa10a24fad56083fb5cbb"},{"owner":"pages/device-list","part":"p0eadcb4018ad7f6a186e"},{"owner":"pages/member-center","part":"p9ae46e0c6ab6ea0b960c"},{"owner":"modals/profile-edit","part":"p3b57ee51aa4e2a695513"},{"owner":"pages/member-center","part":"p28ea6628ffc1e48d7ba0"},{"owner":"modals/profile-edit","part":"p725fb6c01cc618ffbb79"},{"owner":"pages/member-center","part":"p00a4e6c8e27e092eb51c"},{"owner":"shared/common","part":"p1b20dc50d63cfc368c31"},{"owner":"pages/member-center","part":"p5656eafad3e3ce0ce015"},{"owner":"modals/profile-edit","part":"pd4b4706c1dd42a8955db"},{"owner":"pages/member-center","part":"pf02ea5087dbcbd8d3386"},{"owner":"pages/device-list","part":"p832f95fd95a0383ba003"},{"owner":"pages/member-center","part":"pe0c21622f5e55c7fd0fd"},{"owner":"modals/profile-edit","part":"pb7ca9da584af51c72ea1"},{"owner":"pages/member-center","part":"paf277b434a8fe1e00df0"},{"owner":"pages/device-list","part":"p682009830b39fec8268e"},{"owner":"pages/member-center","part":"p523104f08dd3a9715632"},{"owner":"shared/common","part":"p4d1e18894398132023d2"},{"owner":"pages/member-center","part":"p0ab5ab7b8a3a46253e5a"},{"owner":"shared/common","part":"p412646121f0a597d784e"},{"owner":"pages/device-list","part":"p2653c2d7d068a654234e"},{"owner":"pages/member-center","part":"p540c78d81b7bc7805a32"},{"owner":"pages/device-list","part":"pf9c601eb3f44cf48298a"},{"owner":"pages/member-center","part":"p825a9b9183aaae64e747"},{"owner":"pages/coupon-center","part":"pe74308cec4f3468ac81c"},{"owner":"pages/member-center","part":"p7a3e01dd28cd6545aec7"},{"owner":"pages/device-list","part":"p2bbb4887820ba031b628"},{"owner":"pages/member-center","part":"p8e96470ac74eb4a9dd8b"},{"owner":"pages/device-list","part":"p3d413d65f346b70c2b37"},{"owner":"pages/ledou-center","part":"p8fd273b75fa11f617011"},{"owner":"pages/member-center","part":"p0e0ffbbe83a36cc7d2da"},{"owner":"shared/agent-content","part":"p06e4e95dd56bd390de98"},{"owner":"pages/member-center","part":"p04a6798407bb2bd0dfdb"},{"owner":"modals/device-bind","part":"p0d9d32b04633dda987f8"},{"owner":"pages/member-center","part":"p5b90bbaa1868910b2f15"},{"owner":"pages/device-list","part":"p4360d2892efc7e9c2f86"},{"owner":"pages/member-center","part":"p3c9dbf704a6780d5a0ba"},{"owner":"pages/ledou-center","part":"p6723f5c4f82e5e7b8258"},{"owner":"pages/member-center","part":"p9594df58f154b76d305f"},{"owner":"pages/ledou-center","part":"p86a38f01b0563815fd1a"},{"owner":"pages/coupon-center","part":"p97c1a55165634fcec83b"},{"owner":"pages/member-center","part":"p3d5cb29dccb58d0bd69d"},{"owner":"pages/coupon-center","part":"pc1e55a530a30c13ebc3b"},{"owner":"pages/member-center","part":"p22933701e5d1b74786b6"},{"owner":"pages/coupon-center","part":"pe8d421212c60dac1690d"},{"owner":"shared/common","part":"pd6b23a472e46de165330"},{"owner":"pages/member-center","part":"p9f70716b265b9f578804"},{"owner":"shared/common","part":"p1e1f65357e514e1601e8"},{"owner":"pages/member-center","part":"p434fce3f81c104532dd0"},{"owner":"shared/common","part":"pd3eceddbf0dba528060e"},{"owner":"pages/coupon-center","part":"p37ff1f573f2dfd82079c"},{"owner":"pages/ledou-center","part":"pe9d17e94e9132f7dd541"},{"owner":"pages/coupon-center","part":"pb087fba75bc02f943233"},{"owner":"pages/member-center","part":"p2479586fd70eee870a7e"},{"owner":"pages/coupon-center","part":"p787fdd22497c68ba44bd"},{"owner":"shared/common","part":"p45390bb0b4512ea8846d"},{"owner":"pages/coupon-center","part":"p37685e2d330502eb2437"},{"owner":"pages/member-center","part":"pdd8e5a91ab2ce8cf45f1"},{"owner":"modals/profile-edit","part":"p207812d15d78ad6a13a5"},{"owner":"pages/member-center","part":"p153d54ab47fbf20c0c59"},{"owner":"pages/ledou-center","part":"p77a18a73c2ab6662fc55"},{"owner":"pages/member-center","part":"p3c5224d082856a0a40ff"},{"owner":"shared/agent-content","part":"p2ffba1b0185332967770"},{"owner":"pages/member-center","part":"p33ebf751e501908fb2b5"},{"owner":"pages/coupon-center","part":"pb2d69d4d7872a0642edd"},{"owner":"pages/voucher-center","part":"p7eeec4a1be721ee5b5a8"},{"owner":"pages/red-envelope","part":"pc8b9d7912357a96dce90"},{"owner":"pages/member-center","part":"p6fe6ad39034c8799bda9"},{"owner":"shared/agent-content","part":"p8c0962d10fbf8e5c0f8f"},{"owner":"pages/member-center","part":"pc6a0cdadeda5ef0adb5f"},{"owner":"pages/red-envelope","part":"p1c4c18d83cf9900f7ae5"},{"owner":"pages/device-list","part":"p294331ec63639afe2a58"},{"owner":"pages/member-center","part":"p06bd97b9022acd0c6ac5"},{"owner":"pages/coupon-center","part":"pf160cf24dc85a47156d0"},{"owner":"shared/common","part":"pb7a1627e1849d7d32112"},{"owner":"pages/member-center","part":"p8f88e7a9ea70d1568953"},{"owner":"pages/red-envelope","part":"p3d1adec7d17aa0afe946"},{"owner":"pages/member-center","part":"p7378f560f0c099d7f95e"},{"owner":"pages/coupon-center","part":"pd78182706b25a810e397"},{"owner":"pages/member-center","part":"p7abdbb45b175dfc92f30"},{"owner":"shared/agent-content","part":"p3143a57d2185f2099d85"},{"owner":"pages/member-center","part":"p1bfedbb1657df38dcad5"},{"owner":"pages/device-list","part":"p9f8e364686e04557e7fb"},{"owner":"pages/member-center","part":"p7c86f9ceefffcc43007e"},{"owner":"shared/common","part":"p2fca40e63cbd1b5e9b75"},{"owner":"pages/red-envelope","part":"pfa720d3a5c414ff61093"},{"owner":"pages/member-center","part":"pfdb5e992056d735e4428"},{"owner":"modals/device-bind","part":"p6d136d735d9a2d57a44e"},{"owner":"pages/device-list","part":"pa695b8de4d358f9a8df1"},{"owner":"pages/member-center","part":"p22e34071e96f90ba4c5d"},{"owner":"pages/device-list","part":"p97589569b3a665f62028"},{"owner":"shared/common","part":"pb9a972b16a07e0bafbff"},{"owner":"pages/device-list","part":"p333686008af43d335a25"},{"owner":"pages/ledou-center","part":"p619d24e07f0c4030c023"},{"owner":"pages/voucher-center","part":"pe97d634e481b1f8f5ae1"},{"owner":"modals/profile-edit","part":"p060cf65d96842fb48542"},{"owner":"modals/workplace-auth","part":"p2650dcb5433886408add"},{"owner":"modals/profile-edit","part":"p9fd9be98d135a14b9646"},{"owner":"modals/workplace-auth","part":"p5c57645f6cbe430e9046"},{"owner":"modals/profile-edit","part":"p08b077b300b31cc5e983"},{"owner":"modals/workplace-auth","part":"pf24b91187a489d32996f"},{"owner":"modals/profile-edit","part":"p1b7b3a452e0ebc7b42e2"},{"owner":"modals/workplace-auth","part":"p730144131d55cdde1318"},{"owner":"modals/profile-edit","part":"p32ba107571ef8e39b79c"},{"owner":"pages/device-detail","part":"p40fc5d154ffe6765f815"},{"owner":"pages/device-list","part":"pc8e1573ebff4c26f2188"},{"owner":"pages/device-detail","part":"pa198b1b3e0328cc6c144"},{"owner":"pages/device-list","part":"pb41d143515e752af6457"},{"owner":"pages/device-detail","part":"pf5b55f08d743ea2ee7fa"},{"owner":"pages/device-list","part":"pf57e951abc357e3896f5"}],"/assets/frontend/bundles/p0-p0-brand-detail-0.css":[{"owner":"pages/product-detail","part":"p54e59e626fb9d922eb6b"}],"/assets/frontend/bundles/p0-shared-08dd25b63874.css":[{"owner":"pages/product-detail","part":"p6294af423c5b5f386bf7"}],"/assets/frontend/bundles/p0-shared-12c7b4eac601.css":[{"owner":"pages/product-detail","part":"pc0b84f78816d2df4245a"}],"/assets/frontend/bundles/p0-shared-179757fc33ab.css":[{"owner":"shared/common","part":"p3584c937e46b1929e9df"},{"owner":"pages/device-list","part":"pebf836a65162a8d1ef31"},{"owner":"pages/member-center","part":"p26815f27f8d703b868a6"},{"owner":"pages/device-list","part":"p20ec12c618343060d955"},{"owner":"shared/common","part":"pfebc8276f86d7bb30a2e"},{"owner":"shared/agent-content","part":"p6841a5015c3aa61b48d9"},{"owner":"shared/common","part":"pf496facc9543e9b19735"},{"owner":"shared/agent-content","part":"p7f1e663317cc3c829a5d"},{"owner":"shared/common","part":"pa537c4c6f0c8b009b403"},{"owner":"pages/member-center","part":"pfcba3f6a6a3fcb4de9d0"},{"owner":"shared/common","part":"p76624e5fdac77100e0e9"},{"owner":"pages/member-center","part":"pc71668b4f91b5104477e"},{"owner":"shared/common","part":"p165e7dc15a81f0d6e809"},{"owner":"pages/member-center","part":"pd152c35f0ce21559215d"},{"owner":"modals/profile-edit","part":"p3c77cd1c0b1c8a8966bf"},{"owner":"pages/member-center","part":"p8531275af727c57c8c5d"},{"owner":"shared/common","part":"p5b8ec14f66a60f0f4a17"},{"owner":"pages/member-center","part":"p3ff07f999a35b0065d45"},{"owner":"shared/common","part":"pa3b84472dfa120635a7f"},{"owner":"pages/device-list","part":"p38979a14e1da26903045"},{"owner":"shared/common","part":"pd9a43ae6fa1d3be5e18b"},{"owner":"pages/device-list","part":"p798d5c78d98fa6328e08"},{"owner":"pages/device-detail","part":"p4295435a6e39415f65bb"},{"owner":"pages/device-list","part":"p7014c95b6d6b48b65143"},{"owner":"shared/common","part":"p8dda5ab46b8da4476a26"},{"owner":"pages/device-list","part":"p613ef4cd98820b445b9c"},{"owner":"shared/common","part":"p8428e057cf9edf6123bb"},{"owner":"pages/member-center","part":"p6ad2add4cbff5bb8d138"},{"owner":"shared/common","part":"p163c7ee14f8bb082a4dd"},{"owner":"pages/member-center","part":"pb67f0f9e031803b2acd2"},{"owner":"pages/ledou-center","part":"pb67154893abbb4e4fb1a"},{"owner":"shared/common","part":"p4c42851e8daa46507001"},{"owner":"pages/ledou-center","part":"pdd7546cd0e72fb88c05f"},{"owner":"shared/common","part":"p814b47c3c70a6d7df52a"},{"owner":"modals/profile-edit","part":"pc0bed0e5411f1a7890a8"},{"owner":"shared/common","part":"pc8d64d2d409a509c6b9f"},{"owner":"modals/profile-edit","part":"peaa7d4a9d0935d8d6f18"},{"owner":"shared/common","part":"pce628ba2b4ef34b3c44b"},{"owner":"modals/profile-edit","part":"pfe53ac4824ff9bc2b67e"},{"owner":"pages/device-detail","part":"p1487ebc533e135ef07d9"},{"owner":"shared/common","part":"pf3cf36955a81f67db8d4"},{"owner":"pages/product-list","part":"pe894a8d0ed12a174ab1b"},{"owner":"shared/common","part":"p8cd659214d0e59cff297"},{"owner":"pages/member-center","part":"p1480af5a7e6d457574f2"},{"owner":"shared/common","part":"p8cabef09757be683bdfe"},{"owner":"pages/order-list","part":"peac2be49441236aa426f"},{"owner":"shared/common","part":"p194d1a38857cbd853a9a"},{"owner":"pages/order-list","part":"p1c4cd2776b013fc49e44"},{"owner":"shared/common","part":"p9be2312273475a4f26eb"},{"owner":"pages/device-list","part":"p169c684128fc574275d3"},{"owner":"shared/common","part":"p868471b57c04db99f5f1"},{"owner":"pages/product-detail","part":"p31bea9173e4ce2953702"},{"owner":"shared/common","part":"pb025476225dbeb1c28a3"},{"owner":"pages/product-detail","part":"pfa8dfd30f220df4758d6"},{"owner":"shared/common","part":"p92907e19fb577bdc1c9e"},{"owner":"pages/member-center","part":"p42ee89190dfa65a2c47a"},{"owner":"shared/common","part":"p015282849d5a24147521"},{"owner":"pages/member-center","part":"p6ae743da5e437865fa9e"},{"owner":"shared/common","part":"pb93d62c8f8a243b5f512"},{"owner":"modals/profile-edit","part":"pdaf23baf0dd02b590d98"},{"owner":"shared/common","part":"pf8a50d01acb5ab6ec12b"},{"owner":"modals/profile-edit","part":"pdfe74d0aed1890e5ea53"},{"owner":"shared/common","part":"pb4f2b55800e4dd3190d2"},{"owner":"pages/member-center","part":"p56c31cae4a0587a2af1b"},{"owner":"shared/common","part":"pa4d79d3e054dcb0a0828"},{"owner":"pages/member-center","part":"p42c067de78792d6c17c4"},{"owner":"shared/common","part":"pda84c474455df94bbfa9"},{"owner":"pages/ledou-center","part":"p868f016d2af7f3f48466"},{"owner":"pages/member-center","part":"p3a71cb234d5765329fed"},{"owner":"shared/common","part":"p53a402f27c38eba8904c"},{"owner":"modals/profile-edit","part":"p78497984beb1ea64ccbf"},{"owner":"pages/member-center","part":"pdf648e81d81a9f42b9ed"},{"owner":"modals/profile-edit","part":"p30003adf03bc4a3e3a74"},{"owner":"pages/member-center","part":"pcb714b5cf0aa1e99e38f"},{"owner":"pages/device-list","part":"p4c57b23919563da207b6"},{"owner":"shared/common","part":"p33709e7a08331c92f535"},{"owner":"modals/profile-edit","part":"pd5b8f02562cf095b340c"},{"owner":"pages/member-center","part":"p512f0c4ddbafc31c6feb"},{"owner":"pages/device-list","part":"pbd1236dd2c698afd15be"},{"owner":"pages/member-center","part":"p932ea8015443be241c2b"},{"owner":"pages/device-list","part":"p0df359a25597f28da291"},{"owner":"pages/member-center","part":"p659b6afb89d5b2445322"},{"owner":"pages/ledou-center","part":"p82ab8cfd73687a316d8c"},{"owner":"pages/coupon-center","part":"p1a41cc23f3c8a023c544"},{"owner":"shared/common","part":"pa9d2939413b8d3933d24"},{"owner":"pages/coupon-center","part":"p7df7a0d21e0c7fc98b60"},{"owner":"pages/member-center","part":"p7e21d822c30c562bb0fd"},{"owner":"pages/device-list","part":"pce42a3746b92b08088f6"},{"owner":"pages/member-center","part":"pf5762f09502b7e746b41"},{"owner":"pages/device-list","part":"p35a464ed6a7b2357f3e3"},{"owner":"pages/member-center","part":"p38bde3b469629303df66"},{"owner":"pages/device-list","part":"p8078b84dbab9f6475ae5"},{"owner":"pages/member-center","part":"p184533a63c9456592599"},{"owner":"shared/common","part":"pe1bd1622556922cddfb8"},{"owner":"pages/member-center","part":"p55dd14aaaecdf4f9e507"},{"owner":"pages/device-list","part":"p4c57b23919563da207b6"},{"owner":"shared/common","part":"p33709e7a08331c92f535"},{"owner":"pages/member-center","part":"p8827262600388ae5e1a5"},{"owner":"pages/device-list","part":"pd3409b6f46d270cb3429"},{"owner":"pages/member-center","part":"pd479999d7e7141ffc8a4"},{"owner":"shared/common","part":"p446176035835e4e522e1"},{"owner":"pages/member-center","part":"pcfc28736cc11f0e88a7a"},{"owner":"shared/common","part":"p4942e93e71bb6452218a"},{"owner":"pages/ledou-center","part":"p881a1b08e3bcc3f00aaa"},{"owner":"pages/member-center","part":"p6902dbb1f4cdc1857208"},{"owner":"pages/device-list","part":"p29c3105189abc97b4248"},{"owner":"pages/member-center","part":"p184533a63c9456592599"},{"owner":"shared/common","part":"p4a4a43bc79b84747a1bd"},{"owner":"pages/member-center","part":"p6aa4452215829d6fab08"},{"owner":"pages/device-list","part":"p3e09cd865286e4bf79ec"},{"owner":"pages/member-center","part":"p13ea955673104b457def"},{"owner":"pages/device-list","part":"p35a464ed6a7b2357f3e3"},{"owner":"pages/member-center","part":"pb2eed635b53bb9c24f52"},{"owner":"modals/profile-edit","part":"p0c839db2e6f335519dcd"},{"owner":"pages/member-center","part":"pe0bea76e11d9874d6208"},{"owner":"modals/profile-edit","part":"p4e71394254b5de3bb0a6"},{"owner":"pages/member-center","part":"p787c106a27bb3ccfd39c"},{"owner":"modals/profile-edit","part":"p47a04d5f1195ebcba1c0"},{"owner":"pages/member-center","part":"p8183510b6884df2d07cc"},{"owner":"modals/profile-edit","part":"pacb11fc211baf823b5a1"},{"owner":"pages/member-center","part":"p433055c239c51ddc7091"},{"owner":"modals/profile-edit","part":"p3413ee568cac4f891dcd"},{"owner":"pages/member-center","part":"p5c3d897214693c4f8805"},{"owner":"shared/common","part":"pdea0f73e08f136303bb3"},{"owner":"pages/member-center","part":"pe386f08688a813c528f9"},{"owner":"shared/common","part":"p847757a6a292117fc15b"},{"owner":"pages/member-center","part":"p6516d6f90db27dce78f4"},{"owner":"shared/common","part":"pd7bab4383ec97233f621"},{"owner":"pages/member-center","part":"p7efad3174047d4e28ba1"},{"owner":"pages/device-list","part":"p8ddac0543121fa5be02d"},{"owner":"pages/member-center","part":"pa59b9e57f3b41ad45012"},{"owner":"modals/profile-edit","part":"p042a56e473ad4c368cac"},{"owner":"pages/member-center","part":"p059bc9df39170df15525"},{"owner":"modals/profile-edit","part":"pd7be457f26cbdbf8868c"},{"owner":"pages/member-center","part":"p2d596d6a7a0089855a1c"},{"owner":"shared/common","part":"pec7d6768099f1b32d107"},{"owner":"pages/member-center","part":"pa10a24fad56083fb5cbb"},{"owner":"pages/device-list","part":"p0eadcb4018ad7f6a186e"},{"owner":"pages/member-center","part":"p9ae46e0c6ab6ea0b960c"},{"owner":"modals/profile-edit","part":"p3b57ee51aa4e2a695513"},{"owner":"pages/member-center","part":"p28ea6628ffc1e48d7ba0"},{"owner":"modals/profile-edit","part":"p725fb6c01cc618ffbb79"},{"owner":"shared/common","part":"p3f06807574c8abbb2419"},{"owner":"pages/member-center","part":"p5656eafad3e3ce0ce015"},{"owner":"modals/profile-edit","part":"pd4b4706c1dd42a8955db"},{"owner":"pages/member-center","part":"pf02ea5087dbcbd8d3386"},{"owner":"pages/device-list","part":"p832f95fd95a0383ba003"},{"owner":"pages/member-center","part":"pe0c21622f5e55c7fd0fd"},{"owner":"modals/profile-edit","part":"pb7ca9da584af51c72ea1"},{"owner":"pages/member-center","part":"paf277b434a8fe1e00df0"},{"owner":"pages/device-list","part":"p682009830b39fec8268e"},{"owner":"shared/common","part":"p810b7112d3b7b74611ea"},{"owner":"pages/member-center","part":"pa3b80551467129003fe6"},{"owner":"shared/common","part":"p3618e7b0a118452945a5"},{"owner":"pages/member-center","part":"p0ab5ab7b8a3a46253e5a"},{"owner":"shared/common","part":"p412646121f0a597d784e"},{"owner":"pages/device-list","part":"p2653c2d7d068a654234e"},{"owner":"pages/member-center","part":"p95bc108416e582cf60c4"},{"owner":"shared/common","part":"p822e4d6f578f1699eb6e"},{"owner":"pages/member-center","part":"p385eb17ae7a25d747f38"},{"owner":"pages/device-list","part":"pf9c601eb3f44cf48298a"},{"owner":"pages/member-center","part":"p825a9b9183aaae64e747"},{"owner":"pages/coupon-center","part":"pe74308cec4f3468ac81c"},{"owner":"pages/member-center","part":"p7a3e01dd28cd6545aec7"},{"owner":"pages/device-list","part":"p2bbb4887820ba031b628"},{"owner":"pages/member-center","part":"p93ac23119d2b458a27c9"},{"owner":"shared/common","part":"pa7553b25621903da27d8"},{"owner":"pages/member-center","part":"pba6b9c75b971bf0e3aca"},{"owner":"shared/common","part":"p759de25b23577831ca03"},{"owner":"pages/member-center","part":"p30a75fa95168025938b7"},{"owner":"shared/common","part":"p8fecdd2ea326e1aab0ee"},{"owner":"pages/member-center","part":"pcfbc75c7837f95ae2f59"},{"owner":"shared/common","part":"p1b353e3ce6c56b2e57bb"},{"owner":"pages/device-list","part":"p3d413d65f346b70c2b37"},{"owner":"pages/ledou-center","part":"p8fd273b75fa11f617011"},{"owner":"pages/member-center","part":"p6df463dac37c52d1ee50"},{"owner":"shared/common","part":"pd9e5039034b844d186d0"},{"owner":"pages/member-center","part":"p634cd4f07e68768bc462"},{"owner":"shared/agent-content","part":"p06e4e95dd56bd390de98"},{"owner":"pages/member-center","part":"p04a6798407bb2bd0dfdb"},{"owner":"modals/device-bind","part":"p0d9d32b04633dda987f8"},{"owner":"shared/common","part":"p51df7337cf5926d9c589"},{"owner":"pages/member-center","part":"pade720a15801ff0d5241"},{"owner":"shared/common","part":"p6f3347bd450bc028ba21"},{"owner":"pages/member-center","part":"pce3340853862f298141a"},{"owner":"pages/device-list","part":"p4360d2892efc7e9c2f86"},{"owner":"pages/member-center","part":"p3c9dbf704a6780d5a0ba"},{"owner":"pages/ledou-center","part":"p6723f5c4f82e5e7b8258"},{"owner":"pages/member-center","part":"p9594df58f154b76d305f"},{"owner":"pages/ledou-center","part":"p86a38f01b0563815fd1a"},{"owner":"pages/coupon-center","part":"p97c1a55165634fcec83b"},{"owner":"pages/member-center","part":"p3d5cb29dccb58d0bd69d"},{"owner":"pages/coupon-center","part":"pc1e55a530a30c13ebc3b"},{"owner":"pages/member-center","part":"p22933701e5d1b74786b6"},{"owner":"pages/coupon-center","part":"pe8d421212c60dac1690d"},{"owner":"shared/common","part":"pd6b23a472e46de165330"},{"owner":"pages/member-center","part":"p9f70716b265b9f578804"},{"owner":"shared/common","part":"p1e1f65357e514e1601e8"},{"owner":"pages/member-center","part":"p434fce3f81c104532dd0"},{"owner":"shared/common","part":"pd3eceddbf0dba528060e"},{"owner":"pages/coupon-center","part":"p37ff1f573f2dfd82079c"},{"owner":"pages/ledou-center","part":"pe9d17e94e9132f7dd541"},{"owner":"pages/coupon-center","part":"pb087fba75bc02f943233"},{"owner":"pages/member-center","part":"p2479586fd70eee870a7e"},{"owner":"pages/coupon-center","part":"p787fdd22497c68ba44bd"},{"owner":"shared/common","part":"p45390bb0b4512ea8846d"},{"owner":"pages/coupon-center","part":"p37685e2d330502eb2437"},{"owner":"pages/member-center","part":"pdd8e5a91ab2ce8cf45f1"},{"owner":"modals/profile-edit","part":"p207812d15d78ad6a13a5"},{"owner":"pages/member-center","part":"p153d54ab47fbf20c0c59"},{"owner":"pages/ledou-center","part":"p77a18a73c2ab6662fc55"},{"owner":"shared/common","part":"pffe2eaae59c279bd9c46"},{"owner":"pages/member-center","part":"pc999880387a8d39dbc47"},{"owner":"shared/agent-content","part":"p2ffba1b0185332967770"},{"owner":"pages/member-center","part":"p33ebf751e501908fb2b5"},{"owner":"pages/coupon-center","part":"pb2d69d4d7872a0642edd"},{"owner":"pages/voucher-center","part":"p7eeec4a1be721ee5b5a8"},{"owner":"pages/red-envelope","part":"pc8b9d7912357a96dce90"},{"owner":"shared/common","part":"pd6dec94cf841cd6f21ac"},{"owner":"shared/agent-content","part":"p8c0962d10fbf8e5c0f8f"},{"owner":"pages/member-center","part":"p7ce4ceafc44d156ed9f4"},{"owner":"shared/common","part":"pd1900d211c1a31417d30"},{"owner":"pages/member-center","part":"pd267f267b9158ac56bb1"},{"owner":"shared/common","part":"p3714a444cbb1e5aa2469"},{"owner":"pages/red-envelope","part":"p1c4c18d83cf9900f7ae5"},{"owner":"pages/device-list","part":"p294331ec63639afe2a58"},{"owner":"pages/member-center","part":"p06bd97b9022acd0c6ac5"},{"owner":"pages/coupon-center","part":"pf160cf24dc85a47156d0"},{"owner":"shared/common","part":"pb7a1627e1849d7d32112"},{"owner":"pages/member-center","part":"p8f88e7a9ea70d1568953"},{"owner":"pages/red-envelope","part":"p3d1adec7d17aa0afe946"},{"owner":"shared/common","part":"p3bc3b7fbdc8f253e92eb"},{"owner":"pages/member-center","part":"p5f90bed9453d820b1e9d"},{"owner":"pages/coupon-center","part":"pd78182706b25a810e397"},{"owner":"shared/common","part":"p53890a80ff50d8df3318"},{"owner":"shared/agent-content","part":"p3143a57d2185f2099d85"},{"owner":"pages/member-center","part":"p1bfedbb1657df38dcad5"},{"owner":"pages/device-list","part":"p9f8e364686e04557e7fb"},{"owner":"pages/member-center","part":"p22e34071e96f90ba4c5d"},{"owner":"pages/device-list","part":"p97589569b3a665f62028"},{"owner":"shared/common","part":"pb9a972b16a07e0bafbff"},{"owner":"pages/device-list","part":"p333686008af43d335a25"},{"owner":"pages/ledou-center","part":"p619d24e07f0c4030c023"},{"owner":"pages/voucher-center","part":"pe97d634e481b1f8f5ae1"},{"owner":"modals/profile-edit","part":"p060cf65d96842fb48542"},{"owner":"modals/workplace-auth","part":"p2650dcb5433886408add"},{"owner":"modals/profile-edit","part":"p9fd9be98d135a14b9646"},{"owner":"modals/workplace-auth","part":"p5c57645f6cbe430e9046"},{"owner":"modals/profile-edit","part":"p08b077b300b31cc5e983"},{"owner":"modals/workplace-auth","part":"pf24b91187a489d32996f"},{"owner":"modals/profile-edit","part":"p1b7b3a452e0ebc7b42e2"},{"owner":"modals/workplace-auth","part":"p730144131d55cdde1318"},{"owner":"modals/profile-edit","part":"p32ba107571ef8e39b79c"},{"owner":"pages/device-detail","part":"p40fc5d154ffe6765f815"},{"owner":"pages/device-list","part":"pc8e1573ebff4c26f2188"},{"owner":"pages/device-detail","part":"pa198b1b3e0328cc6c144"},{"owner":"pages/device-list","part":"pb41d143515e752af6457"},{"owner":"pages/device-detail","part":"pf5b55f08d743ea2ee7fa"},{"owner":"pages/device-list","part":"pf57e951abc357e3896f5"}],"/assets/frontend/bundles/p0-shared-1897ffc493bf.css":[{"owner":"pages/product-detail","part":"p09ea05008788dcec7f42"}],"/assets/frontend/bundles/p0-shared-2abd72502c25.css":[{"owner":"pages/product-detail","part":"p6c558fbdbef2529f5585"}],"/assets/frontend/bundles/p0-shared-3260b6cadb01.css":[{"owner":"shared/common","part":"p9c57aa862ee6f2295e71"}],"/assets/frontend/bundles/p0-shared-378fe0bdc91e.css":[{"owner":"pages/device-list","part":"p67da8c2db4c6f92427bd"}],"/assets/frontend/bundles/p0-shared-4cd8a5a5d35a.css":[{"owner":"shared/common","part":"pb5847ff9e9306c3fac28"}],"/assets/frontend/bundles/p0-shared-5378bfc37780.css":[{"owner":"modals/device-bind","part":"p5c5f967d0a65fc4adaeb"}],"/assets/frontend/bundles/p0-shared-93a36541f7de.css":[{"owner":"pages/member-center","part":"p57f57989bcd646e9938a"},{"owner":"shared/common","part":"p2fca40e63cbd1b5e9b75"},{"owner":"pages/red-envelope","part":"pfa720d3a5c414ff61093"}],"/assets/frontend/bundles/p0-shared-99b30c17aaa7.css":[{"owner":"pages/member-center","part":"p54bb49cc75e2b8f24080"}],"/assets/frontend/bundles/p0-shared-9db657ec5be8.css":[{"owner":"pages/member-center","part":"pb34452103a1c21d30d22"}],"/assets/frontend/bundles/p0-shared-cb8e2ca3f9d5.css":[{"owner":"pages/product-detail","part":"p568b7c3f6b7ea739252c"}],"/assets/frontend/bundles/p0-shared-e0e9c414dedb.css":[{"owner":"pages/order-list","part":"p6315c3d81b5c3c4a3640"},{"owner":"shared/common","part":"pe45c7657d66dc759ed2f"},{"owner":"pages/order-list","part":"pe7b6ced22fabcf9bf00c"},{"owner":"shared/common","part":"p38dfde4127be2544c019"},{"owner":"pages/order-list","part":"pb116b5cdf1e6ff72056e"},{"owner":"shared/common","part":"p0bd94238c2128f627c1e"},{"owner":"pages/order-list","part":"p5b566a8a80d39fcb90cd"},{"owner":"shared/common","part":"pf81bff95c895145e1bd0"},{"owner":"pages/order-list","part":"p81a42b749627dfde2ca0"},{"owner":"shared/common","part":"p8188aef6c6f29edf52c3"},{"owner":"shared/agent-content","part":"pc3f24212d0dc819b9e2b"},{"owner":"shared/common","part":"p1ecabb391fb47e49e94c"},{"owner":"shared/agent-content","part":"pc68276b69253723722ff"},{"owner":"shared/common","part":"p145be0a8ea63bdb50bda"},{"owner":"shared/agent-content","part":"p9a36e0ee01687ef4c945"},{"owner":"pages/order-detail","part":"p111cea30029c296cf61c"},{"owner":"shared/common","part":"p94605dfbda0910cb666b"},{"owner":"pages/order-list","part":"pf984b5fa2c1c9df4ce06"},{"owner":"shared/common","part":"pf110c7844388d35b4a0b"},{"owner":"pages/order-list","part":"pc2f079b7ea272bbe5763"},{"owner":"pages/order-detail","part":"p6a36f4b42bcbbf519589"},{"owner":"shared/common","part":"p4e671fdff51c5a9ad21d"},{"owner":"pages/order-detail","part":"p87307b3f41464e5cd31c"},{"owner":"pages/product-detail","part":"p2248b84651dd6d0f02ff"},{"owner":"shared/common","part":"p28a2d55814be6fdd728a"},{"owner":"pages/order-list","part":"pbf97545dd6bdc9abe3ab"},{"owner":"modals/order-payment-confirm","part":"pa6e612c8dc24babb58a2"},{"owner":"modals/payment-processing","part":"pe6857377275ea6010a86"},{"owner":"modals/payment-success","part":"pe3c9a4a5cbbd8205c7db"},{"owner":"modals/order-payment-confirm","part":"p5b3c6f401748f2657202"},{"owner":"shared/common","part":"pc1bbc9953aed11d7d9c7"},{"owner":"modals/order-payment-confirm","part":"p3b0690e289a272546686"},{"owner":"modals/invoice-edit","part":"pd431211bb1e56edf62e6"},{"owner":"modals/order-payment-confirm","part":"p9fd6fb7b3f313215a580"},{"owner":"modals/invoice-edit","part":"pd3731841b9ae8970e6e4"},{"owner":"shared/common","part":"p244da1be5ebded291abc"},{"owner":"modals/payment-processing","part":"p080602bc2498722b226f"},{"owner":"modals/order-payment-confirm","part":"p943191558bf99566ec60"},{"owner":"modals/payment-processing","part":"p5a438ef5917ccdca01d6"},{"owner":"modals/order-payment-confirm","part":"pe84728ceeca8b624883f"},{"owner":"modals/payment-processing","part":"p519c91374ca6a2b346a7"},{"owner":"shared/common","part":"pa7648a3f263f73365d47"},{"owner":"modals/payment-processing","part":"p09fabce42c10d7d8138b"},{"owner":"modals/payment-success","part":"p76e93839a1c1ca138d90"},{"owner":"modals/order-payment-confirm","part":"p3c3beb64bfee2e80a9d4"},{"owner":"shared/common","part":"p30bed3126abcdc2e43cd"},{"owner":"modals/order-payment-confirm","part":"pd0dc2d4e7e391b49d2f6"},{"owner":"shared/common","part":"pcfa0e948bdda911642f0"},{"owner":"pages/order-list","part":"p8239518c5fcd0d067129"},{"owner":"shared/common","part":"p2276503e75d6ad7f4223"},{"owner":"pages/order-list","part":"p7daeeb155fb6d33cbbd0"},{"owner":"pages/order-detail","part":"p83a2d21a70c0bdf50b76"},{"owner":"pages/product-detail","part":"p6113a9a2323bce2c3298"},{"owner":"shared/common","part":"pee2351eff00cece058de"},{"owner":"pages/product-detail","part":"pd454f6af8cf0581cac60"},{"owner":"pages/order-list","part":"p48828c7735d4530a1ece"},{"owner":"shared/common","part":"p5d7bf41f9a40063aca96"},{"owner":"pages/order-list","part":"p94779eeadbe2b4e11c80"},{"owner":"pages/order-detail","part":"p47d2ca863a99a0e3a27e"},{"owner":"shared/common","part":"p9eadf9726edc07e5c0ad"},{"owner":"pages/order-detail","part":"p3a7650219690a82d5b44"},{"owner":"shared/common","part":"pc08ed38a5781df73e165"},{"owner":"pages/order-detail","part":"pfc016fbdd99a640b5a8c"},{"owner":"pages/product-detail","part":"p40486a2be46c274d4446"},{"owner":"shared/common","part":"pc97aa2097eea1a2d88f7"},{"owner":"pages/order-list","part":"p06ab5c284dd7ac346e1f"},{"owner":"shared/common","part":"pe503db7b3265c0308986"},{"owner":"pages/order-list","part":"pbb02ddeb1fade0744655"},{"owner":"shared/common","part":"pc6e69324c02081720081"},{"owner":"pages/order-list","part":"p6654a4444fe9fc18dcf7"},{"owner":"shared/common","part":"paf20f03b818fc2b74ed4"},{"owner":"pages/order-list","part":"p96a66f22130f84dc0761"},{"owner":"shared/common","part":"pb023a7d1e728af9bdc2e"},{"owner":"pages/order-list","part":"p3607c3decc00fea65cfe"},{"owner":"shared/common","part":"pe8bcfcefd58960825c93"},{"owner":"pages/order-list","part":"p67c24d07edf2f829a6a3"},{"owner":"shared/common","part":"pd707281ecb358348baa4"},{"owner":"pages/order-list","part":"pfdb129c20943fcfa1aaa"},{"owner":"pages/order-detail","part":"p70d83d19cbc81e19cfaa"},{"owner":"pages/order-list","part":"p3dc5d1332a52d96752d8"}],"/assets/frontend/bundles/p0-shared-f054b000c8c6.css":[{"owner":"pages/product-detail","part":"pde571d9c7295f0ef1cd3"}],"/assets/frontend/css/components/education-member-products-v1.css":[{"owner":"pages/product-list","part":"pb73a69b4ad2737c318c3"},{"owner":"pages/member-center","part":"p29f4e95d05d9cc4bb122"},{"owner":"pages/product-list","part":"p453eca2fd7971ebde0e3"},{"owner":"pages/member-center","part":"p152fa51f2a5f52af73c8"}],"/assets/frontend/css/core/arrival-notice-v1.css":[{"owner":"shared/common","part":"p157a721b5252c71221e7"},{"owner":"modals/toast","part":"p2d2f05376e2a534bb9bb"}],"/assets/frontend/css/core/assistant-scrollbar-hidden-v1.css":[{"owner":"shared/agent-content","part":"p9316918d22f81f6b8a3f"}],"/assets/frontend/css/core/auth-dialog.css":[{"owner":"modals/login","part":"p6d83c598f97e4a23b36f"},{"owner":"modals/register","part":"p49fbc6e2caf5ab8987d9"},{"owner":"modals/login","part":"p28aea106a42704370b88"},{"owner":"modals/login-success","part":"pfcdb71ff41519e7308d4"},{"owner":"modals/login","part":"p82fa5b781461a1ac04b7"},{"owner":"modals/login-success","part":"pcd347bba3352d4bc32ed"},{"owner":"modals/login","part":"p12585e3336cfebb3c569"}],"/assets/frontend/css/core/business-product-hover-v1.css":[{"owner":"shared/common","part":"pc121246c4f97391d5cab"},{"owner":"pages/product-list","part":"p426fa62abc693d09f182"}],"/assets/frontend/css/core/business-product-title-v2.css":[{"owner":"pages/product-list","part":"p8ae3b9f85df14b27a129"}],"/assets/frontend/css/core/channel-home-hero-unified-v161.css":[{"owner":"shared/agent-content","part":"p2235ea8733ee4d1dee63"},{"owner":"pages/consumer-home","part":"pc96efa7b70e391a57719"},{"owner":"shared/agent-content","part":"p79b9bea1b63d96818396"},{"owner":"pages/consumer-home","part":"p2e856b38a5fbfb7de8f1"}],"/assets/frontend/css/core/channel-home-surface.css":[{"owner":"shared/agent-content","part":"p5f88a604af482bdabe29"}],"/assets/frontend/css/core/composer-reference-font-v130.css":[{"owner":"shared/agent-content","part":"p37a1b55aa7b8080ee44c"}],"/assets/frontend/css/core/composer-smart-actions-v1.css":[{"owner":"shared/agent-content","part":"p9b2c378602e6fee389e6"}],"/assets/frontend/css/core/conversation-location-navigation-v1.css":[{"owner":"shared/agent-content","part":"p40229e7b6765bcbb7287"}],"/assets/frontend/css/core/education-auth-original-v1.css":[{"owner":"modals/education-auth","part":"p5d3aa8feadbb7a432987"},{"owner":"shared/common","part":"pe10ffe1fbbf6b16c6dd5"},{"owner":"modals/education-auth","part":"pb6292e48b06600dd85ef"},{"owner":"shared/common","part":"p529b0fe25202b3bfd005"},{"owner":"modals/education-auth","part":"pc6f993ffe4d055063441"},{"owner":"modals/workplace-auth","part":"p7f9337954a9fddf90c82"},{"owner":"modals/education-auth","part":"p8cfeb97075fbb439a7c9"},{"owner":"shared/common","part":"pfc8253ce66adc07f2355"},{"owner":"modals/education-auth","part":"pa0c59e72ea5391acf3d1"},{"owner":"modals/workplace-auth","part":"pf4ea0c0647fe77c5a056"},{"owner":"modals/education-auth","part":"p24f484d327d20561630d"},{"owner":"modals/workplace-auth","part":"p3b7d011a38e5f2ea2539"},{"owner":"modals/education-auth","part":"p32c60a10a71866589cf8"},{"owner":"modals/diamond-upgrade","part":"pc4df10213094e43594cf"},{"owner":"modals/education-auth","part":"pc9376c37145af30c0de8"}],"/assets/frontend/css/core/empty-hover-backplate-collapse-v1.css":[{"owner":"shared/agent-content","part":"p2aeb5000a950a4340233"}],"/assets/frontend/css/core/enterprise-auth-footer-v134.css":[{"owner":"modals/lead-form","part":"p980969a38cd294836985"}],"/assets/frontend/css/core/enterprise-auth-original-v1.css":[{"owner":"modals/enterprise-auth","part":"pf56c9055e6875b56eec0"},{"owner":"modals/diamond-upgrade","part":"p9b910f584428b31ca7ec"},{"owner":"modals/enterprise-auth","part":"p21300c2f4b63537d2e06"},{"owner":"modals/diamond-upgrade","part":"p84d6c571c6ae58f11858"},{"owner":"modals/enterprise-auth","part":"p72c689134f5a96cff7a6"},{"owner":"modals/diamond-upgrade","part":"pc7ec7d9906f47603d2e6"},{"owner":"modals/enterprise-auth","part":"p69478d586f58783c41b4"}],"/assets/frontend/css/core/enterprise-lead-card-v133.css":[{"owner":"modals/lead-form","part":"p5f98c3f85069060ef5d0"}],"/assets/frontend/css/core/enterprise-member-auth-modal.css":[{"owner":"modals/lead-form","part":"pdb06161f8eb6acc78a8e"}],"/assets/frontend/css/core/history-standard.css":[{"owner":"modals/conversation-history","part":"pee7c8917918ef6287747"},{"owner":"shared/agent-content","part":"p8ea3f53765c7322d52b5"},{"owner":"modals/conversation-history","part":"p65babf7f2e0d202fe7f1"}],"/assets/frontend/css/core/hover-ai-disabled.css":[{"owner":"shared/common","part":"paed12e452a1dd9c598b1"},{"owner":"shared/agent-content","part":"pb119c10b58d42ded1618"},{"owner":"pages/solution-list","part":"pb0f8b1c4671aad087f80"}],"/assets/frontend/css/core/manufacturing-solution-rows-v1.css":[],"/assets/frontend/css/core/member-coupon-center-v1.css":[{"owner":"pages/coupon-center","part":"pba18aaa62d4d727c8cee"},{"owner":"pages/ledou-center","part":"p1987d2cd2be86c9e0cb4"},{"owner":"pages/coupon-center","part":"p6a862716f2f9ef88c780"},{"owner":"shared/common","part":"pb3786d4dc32d2d3fb41d"},{"owner":"pages/coupon-center","part":"p79df4a77c691e8335cc4"},{"owner":"shared/common","part":"p51b8abf2265d493d229f"},{"owner":"pages/coupon-center","part":"p3dac25b792b9daac3922"},{"owner":"shared/common","part":"p974b25305f8b4b07fa21"},{"owner":"pages/coupon-center","part":"p6d5cd30088419ba58a43"},{"owner":"shared/common","part":"p1479d8d1c8338dfbbd7f"},{"owner":"pages/coupon-center","part":"p0f5090f16d6e182ad2c5"},{"owner":"shared/common","part":"pbfdfbdb4e87c495f8355"},{"owner":"pages/coupon-center","part":"p89a02475c0dac9d4b064"},{"owner":"pages/ledou-center","part":"p1987d2cd2be86c9e0cb4"},{"owner":"pages/coupon-center","part":"p6a862716f2f9ef88c780"},{"owner":"shared/common","part":"pb3786d4dc32d2d3fb41d"},{"owner":"pages/coupon-center","part":"p79df4a77c691e8335cc4"},{"owner":"shared/common","part":"p51b8abf2265d493d229f"},{"owner":"pages/coupon-center","part":"p3dac25b792b9daac3922"},{"owner":"shared/common","part":"p974b25305f8b4b07fa21"},{"owner":"pages/coupon-center","part":"p6d5cd30088419ba58a43"},{"owner":"shared/common","part":"p1479d8d1c8338dfbbd7f"},{"owner":"pages/coupon-center","part":"p0f5090f16d6e182ad2c5"},{"owner":"shared/common","part":"pbfdfbdb4e87c495f8355"},{"owner":"pages/coupon-center","part":"p7208c1953afedb415047"},{"owner":"shared/common","part":"p3b35f6859976664b8e68"},{"owner":"pages/coupon-center","part":"p7cdd5a87d71801407c48"},{"owner":"shared/common","part":"pea96b4e60e84b87e072c"},{"owner":"pages/coupon-center","part":"pffdc12d7e8e21ec102d9"}],"/assets/frontend/css/core/modal-overlay-unified.css":[{"owner":"shared/common","part":"p737a308bed8fb0faeb14"},{"owner":"modals/education-auth","part":"p29f2b5a85a01b72c2946"},{"owner":"shared/agent-content","part":"pa2c8223e3b27ddb1b2e4"},{"owner":"modals/education-auth","part":"p8310b9990fae8fb0b4cf"},{"owner":"modals/login","part":"p71966477116c281aaa52"},{"owner":"modals/education-auth","part":"p93e7a12a21a8f26619d2"},{"owner":"modals/order-payment-confirm","part":"p1531a80145dfac1a4b00"},{"owner":"shared/common","part":"p9ce4a3d4e05bc31ddff0"},{"owner":"modals/order-payment-confirm","part":"pe8a55212d789c03ca78f"},{"owner":"modals/lead-form","part":"p422d38d5b3f552ae6e6d"},{"owner":"shared/common","part":"pe43ed65323499825eb71"},{"owner":"modals/lead-form","part":"pf7f2c1f9ffae01546e11"},{"owner":"shared/common","part":"p8c7e38f9a9b107cc9774"},{"owner":"modals/workplace-auth","part":"pf1b36883c1fd14602e73"},{"owner":"modals/lead-form","part":"p1e58911d4b97e33d6d48"},{"owner":"modals/workplace-auth","part":"pc8ea027dd37663550da2"}],"/assets/frontend/css/core/notification-toast-v1.css":[{"owner":"modals/toast","part":"p1799841f923fadfd7189"}],"/assets/frontend/css/core/product-card-borderless-v3.css":[{"owner":"pages/product-list","part":"pf6ce9df35b58d1c80d2c"}],"/assets/frontend/css/core/product-specs-grouped-v1.css":[{"owner":"pages/product-detail","part":"pc5be26bc912286bfba26"}],"/assets/frontend/css/core/recommendation-card-arrow-v1.css":[{"owner":"shared/agent-content","part":"p953e02680f887e3af320"},{"owner":"shared/common","part":"p0760662824eaf7e5985d"}],"/assets/frontend/css/core/recommendation-followups-v1.css":[{"owner":"shared/agent-content","part":"pfc638eb210234466851b"}],"/assets/frontend/css/core/recruitment-v1.css":[{"owner":"pages/product-list","part":"pea0ea9a9df25cc17d7e2"},{"owner":"shared/agent-content","part":"p4ff16945545251831523"},{"owner":"pages/product-list","part":"p726089e29eff26b573e5"}],"/assets/frontend/css/core/right-generation-aurora.css":[{"owner":"shared/agent-content","part":"pfa06e16188dfbf0fa8f1"}],"/assets/frontend/css/core/solution-result.css":[{"owner":"shared/agent-content","part":"p13c97d4f512fb75a3646"},{"owner":"pages/solution-list","part":"paa1a494ff5f03b7d2fcb"},{"owner":"shared/agent-content","part":"p935086f2937d57fbfd91"},{"owner":"shared/common","part":"paa9845e120d644d9cc13"},{"owner":"pages/solution-list","part":"p94f04284da6363cd0471"},{"owner":"pages/product-list","part":"p33f7d4540427d9fec911"},{"owner":"pages/solution-list","part":"pf1c4aed0ef8d5619eec9"},{"owner":"pages/product-list","part":"p6bc0b983c31e69ba3c9c"},{"owner":"pages/solution-list","part":"pf88038109f778052aa5b"},{"owner":"shared/agent-content","part":"pa7b6567a2985fb631752"},{"owner":"pages/solution-list","part":"pde77b17c0b9c8caf2627"},{"owner":"shared/agent-content","part":"pa682760e7440f005455b"},{"owner":"pages/solution-list","part":"pb02298d0f571a49e2f74"},{"owner":"shared/agent-content","part":"pbe036963ebe9bdec6275"},{"owner":"pages/solution-list","part":"p209cf059aee667c6b34d"},{"owner":"shared/agent-content","part":"p69101fbd2bc9c3cc69f9"},{"owner":"pages/solution-list","part":"p2a4c542c036d6cb96c10"},{"owner":"modals/product-match","part":"p64ae6e194b4fa0f2f55b"},{"owner":"pages/solution-list","part":"pc6761dcccfe1225cc024"},{"owner":"shared/agent-content","part":"pf40ab06ca04438b773b4"},{"owner":"pages/solution-list","part":"p817f618146527e558501"},{"owner":"shared/agent-content","part":"p7a98804ff28886e8f9c9"},{"owner":"pages/solution-list","part":"p8ed02ca13fd09239fb6c"},{"owner":"shared/agent-content","part":"pdd16e3b615ea63a5926b"},{"owner":"pages/solution-list","part":"p80b3fd557a146b4fdb65"},{"owner":"shared/common","part":"p19dbea94b7fcf7b10d32"},{"owner":"shared/agent-content","part":"p3e350cd3a03e309c2709"},{"owner":"pages/solution-list","part":"pf1b62f364a4f6e65a0ab"},{"owner":"pages/solution-compare","part":"p665b90b8cc797c44d23b"},{"owner":"pages/solution-list","part":"pe6c7018aee2309f1164e"},{"owner":"shared/common","part":"pdaa26940cd532d87bd90"},{"owner":"shared/agent-content","part":"pa7493192f572bff64fd1"},{"owner":"pages/solution-list","part":"p44b1ffdb36e8365010fb"},{"owner":"pages/solution-compare","part":"pfcc5f88f9a73668c5a2b"},{"owner":"pages/product-compare","part":"pde9f7e39b05045e471b4"},{"owner":"pages/solution-list","part":"p1495fd47dad03510a95f"},{"owner":"pages/product-compare","part":"ped73ea271c64af1d4458"},{"owner":"pages/solution-list","part":"pcf481d294e7a350b6465"},{"owner":"pages/product-compare","part":"p2c355e76c6d2b9d98aab"},{"owner":"pages/solution-list","part":"p2c707a12a32e687aba6a"},{"owner":"pages/product-compare","part":"p6295bc48c00c1404034e"},{"owner":"pages/solution-list","part":"p4aeed53f217e636ed86e"},{"owner":"pages/product-compare","part":"p57dd227a70e9374baa2a"},{"owner":"pages/solution-list","part":"pc9458bbfc22713572ed0"},{"owner":"pages/product-compare","part":"pb4668a79638f7817ceea"},{"owner":"pages/solution-list","part":"peb778d909f79df893d7f"},{"owner":"shared/common","part":"p7446e1e2121a59a2535c"},{"owner":"pages/solution-list","part":"p4da3b173bb7ef58fb1df"},{"owner":"shared/agent-content","part":"pee577f5c8a464650df30"},{"owner":"pages/solution-list","part":"p45054f79ecc84df899a0"},{"owner":"shared/agent-content","part":"p685ab61079744bc812a5"},{"owner":"modals/lead-form","part":"pd2aef59898accb0c0b4e"},{"owner":"pages/solution-list","part":"pee1c5220b19d5a77d196"},{"owner":"shared/common","part":"p9fd975bb048190afa5ec"},{"owner":"shared/agent-content","part":"p7948ae86e071013ebbb2"},{"owner":"pages/solution-list","part":"p51b2e388753bf50930c8"},{"owner":"shared/agent-content","part":"p81ce5a9e86a9490d5add"},{"owner":"pages/solution-list","part":"p55aae9d87d0c48b09a1a"},{"owner":"shared/agent-content","part":"pb444b39b16c812276a72"},{"owner":"pages/member-center","part":"p3c2fc4c5366be6fc8f51"},{"owner":"shared/agent-content","part":"p513c66910c324a065bbd"},{"owner":"pages/member-center","part":"pfe9c9b4ef8e6e7691ab2"},{"owner":"shared/agent-content","part":"p337747f7fe5ea89c1ca9"},{"owner":"pages/device-list","part":"p52b0cfb21ded93338bad"},{"owner":"shared/agent-content","part":"p04048cfdeac824136732"},{"owner":"pages/product-detail","part":"p7c559d75a9bd8bcedbb3"}],"/assets/frontend/css/core/split-frame-composer-sync.css":[{"owner":"shared/agent-content","part":"p0bec709364be89b09309"},{"owner":"pages/product-detail","part":"p4e8a16fd6371f4cccfc5"},{"owner":"shared/agent-content","part":"p2121dd3c3e231ca6ed57"}],"/assets/frontend/css/core/tabbar-compression-v1.css":[{"owner":"shared/agent-content","part":"p74e63f1e98019551b909"}],"/assets/frontend/css/core/voucher-rule-arrow-v136.css":[{"owner":"pages/voucher-center","part":"p99ab84f47bd8853bbcbe"}],"/assets/frontend/css/core/workplace-auth-modal.css":[{"owner":"modals/workplace-auth","part":"pe96a224fbfe26aa91d38"}],"/assets/frontend/css/pages/brand/brand-about-layout-v1.css":[{"owner":"pages/brand-home","part":"p3fd91b693774cb671ecd"}],"/assets/frontend/css/pages/brand/brand-ai-hero-v1.css":[{"owner":"pages/brand-home","part":"p3c276d623842a0a0588b"}],"/assets/frontend/css/pages/brand/brand-news-covers-v1.css":[{"owner":"pages/brand-home","part":"p212d81e47d0ed650b3f7"}],"/assets/frontend/css/pages/brand/channel-list-v1.css":[{"owner":"pages/brand-home","part":"paaf6ceb990b2a8aa895b"},{"owner":"shared/agent-content","part":"p504bd7fa9dc51fe5a629"},{"owner":"pages/brand-home","part":"p34d1ba18a81cde189c70"},{"owner":"shared/agent-content","part":"pd1c08838b825bf822fff"},{"owner":"pages/brand-home","part":"pdcfc5ef3275c6f21b8dc"},{"owner":"shared/agent-content","part":"p0801c1242da8de9e2c8d"},{"owner":"pages/brand-home","part":"p8786dea2c838140b907b"},{"owner":"shared/agent-content","part":"p48032859b90050486cab"},{"owner":"pages/brand-home","part":"p8726972c694587425e4b"}],"/assets/frontend/css/pages/brand/inline-19.css":[{"owner":"shared/agent-content","part":"pe1c61f5aaccc63a8b5ac"},{"owner":"pages/brand-home","part":"p6e728d971cbd9670a42f"},{"owner":"shared/agent-content","part":"pb1a56231fbd5fd7cbff3"}],"/assets/frontend/css/pages/home/inline-03.css":[{"owner":"shared/agent-content","part":"p7b540317c412bf92bb57"},{"owner":"pages/home","part":"p65cef0a7ed07f0856ac8"},{"owner":"shared/common","part":"p325a67122c38d6567fb1"}],"/assets/frontend/css/pages/home/inline-04.css":[{"owner":"pages/home","part":"p94618a608fb497d68d51"},{"owner":"shared/agent-content","part":"pc4cff1683c1aa35ca880"},{"owner":"shared/common","part":"pd802002e760697db5755"},{"owner":"shared/agent-content","part":"pfd1cf9c9ca5b4293a5d3"},{"owner":"pages/home","part":"pa240c84fc19c61fad508"},{"owner":"shared/agent-content","part":"pe55955948f8eb005ff1d"},{"owner":"pages/home","part":"p6d8b4c0a708b9a29a101"},{"owner":"shared/agent-content","part":"p0082c7d0906301d84ef3"},{"owner":"modals/conversation-history","part":"p84150c2cd477c5f789be"},{"owner":"shared/agent-content","part":"p9900b08948806520b6b8"},{"owner":"pages/home","part":"p73f40d43e9a331aa0f4b"},{"owner":"shared/agent-content","part":"p57c0900e81738b2a1433"},{"owner":"pages/home","part":"p809e56fcf22fc206f4fd"},{"owner":"shared/agent-content","part":"p2cb3c93d5fbeb89dfd14"},{"owner":"modals/conversation-history","part":"p1e075decb5a2537d0e11"},{"owner":"pages/home","part":"p139bbe7227152f3a6237"},{"owner":"shared/agent-content","part":"p23abe320b65bc3030623"},{"owner":"pages/home","part":"pdd49ae245ae0b05ff0b7"},{"owner":"shared/agent-content","part":"p9852438c747e902b75c4"},{"owner":"pages/home","part":"p7f978e28fba997be1bd6"},{"owner":"shared/agent-content","part":"p88e182cc39761916a07e"},{"owner":"pages/home","part":"pd2f877232e526cfd683b"},{"owner":"shared/common","part":"p600661e0445d17177344"},{"owner":"pages/home","part":"p48b0fe0b39155407eaca"},{"owner":"shared/agent-content","part":"p5d52d99ded09a34d3a32"},{"owner":"pages/home","part":"pc73594523ece7abeb824"},{"owner":"pages/product-list","part":"pd492eccb54e6135c0f7b"},{"owner":"pages/home","part":"p1494ef68f0df3ed04c07"},{"owner":"pages/product-detail","part":"p2cdbe63374ee3e55ebc9"},{"owner":"pages/home","part":"p29105b8b7af18ff530c7"},{"owner":"shared/common","part":"p0fe9b038e110d0474344"},{"owner":"pages/home","part":"p7d981a3cc61e8d95731f"},{"owner":"pages/product-list","part":"pf74abe47dcea1f609d6a"},{"owner":"pages/home","part":"pe6ea87512032af7f47d8"},{"owner":"pages/product-compare","part":"pafa4bec381b3abf2e171"},{"owner":"shared/common","part":"p6d3f4b948e32d525648a"},{"owner":"pages/product-compare","part":"p08f002e3cf9a32aa04f9"},{"owner":"pages/home","part":"pc83602539bd97833f007"},{"owner":"shared/common","part":"p96bb5752864378faac9d"},{"owner":"pages/home","part":"p8155e3b61b562dad892f"},{"owner":"pages/product-detail","part":"p1c0c67454797ee6aa8ba"},{"owner":"shared/common","part":"p411fb4cb02077f36a17d"},{"owner":"pages/home","part":"p6d3ef4f80ae77d251480"},{"owner":"shared/common","part":"p0cc70e25f1fdff0149dd"},{"owner":"pages/home","part":"p2dadcb4ad4e2393afa97"},{"owner":"shared/agent-content","part":"p7059996691c1a1333f94"},{"owner":"pages/home","part":"p9ea09a5bc19c64bc42ec"},{"owner":"shared/common","part":"pa6697649235237ba0bf4"},{"owner":"pages/home","part":"p7d14f5c01fb54a6d6475"},{"owner":"shared/agent-content","part":"p0498f510ca51ccb26b69"},{"owner":"pages/home","part":"p8769cb682f8e5009378a"},{"owner":"shared/agent-content","part":"p2b20e40ee858b698bbb1"},{"owner":"pages/home","part":"p29260c5114b57f9173ea"},{"owner":"shared/common","part":"pba32e6cf382f9cdb9939"},{"owner":"pages/home","part":"p0231ca9f68db7b595fb8"},{"owner":"shared/common","part":"p35a4d45bcd8c241b5c73"},{"owner":"pages/home","part":"p59d4aea2547011deb855"},{"owner":"shared/common","part":"p366433b957a7536df30b"},{"owner":"pages/home","part":"p8942f3e66b0b1fd15e6e"},{"owner":"shared/common","part":"p713f3eeb176b784899d0"},{"owner":"pages/home","part":"pd441cdaeaeee365eb38f"},{"owner":"pages/solution-list","part":"p19ff8a7fc2d1cc6ba040"},{"owner":"pages/home","part":"pc620d827c42fab95c171"},{"owner":"pages/solution-list","part":"p199b46e9ddc2fa5cbab5"},{"owner":"pages/home","part":"pcad7bd6b41dd3580d160"},{"owner":"pages/solution-list","part":"pbd5cbe232fc18f72d2b7"},{"owner":"pages/home","part":"p2d0cccdc4213504711cb"},{"owner":"shared/agent-content","part":"p8974fce0bc2e8d7b0c78"},{"owner":"pages/home","part":"pbdf93f3098dde526e59d"},{"owner":"shared/common","part":"pca860e4a52bd93d4eccc"},{"owner":"pages/home","part":"pe03e49ef4953f5dcb0b2"},{"owner":"shared/common","part":"pa060e2d770cd10af0d3a"},{"owner":"pages/solution-list","part":"pf67ce0233a87c71a077b"},{"owner":"pages/home","part":"p1f543af6bc7bed42566c"},{"owner":"pages/product-detail","part":"pc965d5ea3ac6a5060712"},{"owner":"pages/home","part":"p0eb1b30a920978917d45"},{"owner":"pages/product-detail","part":"p761be4584a7a6fa3376a"},{"owner":"pages/home","part":"pe8425f10a4b462eb8d11"},{"owner":"shared/common","part":"p08e3d1e764fc0810d9f7"},{"owner":"pages/home","part":"pb93bd4706ab479248fda"},{"owner":"shared/agent-content","part":"p2e1fa37a9d0c36c37bf5"},{"owner":"pages/home","part":"pbbfb656dac23d2a8bb1b"},{"owner":"shared/agent-content","part":"p7af20b94e5e0054833c1"},{"owner":"pages/home","part":"p3102c512f14fabe1409c"},{"owner":"shared/agent-content","part":"p7d3bb6f7646e08054a64"},{"owner":"pages/home","part":"pfe96a110f54b24a5cc29"},{"owner":"shared/agent-content","part":"padec31cdfec5748a24ba"},{"owner":"pages/home","part":"p70110b6189221b0c5d3d"},{"owner":"pages/product-list","part":"p619f3eb6cf136b58293d"},{"owner":"pages/home","part":"pc81f2855c38ca2ceabf1"},{"owner":"shared/common","part":"pc58630b8f1c61388c62f"},{"owner":"pages/home","part":"p13c93aaa6e7af914fc79"},{"owner":"shared/agent-content","part":"p2ad2a5a3897c6a140bd8"},{"owner":"pages/home","part":"p895938c5b9c7f396d73f"},{"owner":"pages/product-list","part":"pe9c0cfd7e3228e038179"},{"owner":"pages/home","part":"p8b34579b195bda9e9f34"},{"owner":"shared/agent-content","part":"pdd74b1fbfffa68783840"},{"owner":"pages/home","part":"p9cbe90fff2b5ddb0c7ec"},{"owner":"shared/agent-content","part":"pa2009f09a928c6cc27b9"},{"owner":"pages/home","part":"p98c27f8d9d89c85bcee6"},{"owner":"shared/agent-content","part":"pbb972fbdcacc21eee04a"},{"owner":"pages/home","part":"pc9f0d589ef832ec6ee31"},{"owner":"shared/agent-content","part":"pa4df2b8f17bed4da8ba4"},{"owner":"pages/home","part":"pa2a8badb5b900dc0fd63"},{"owner":"shared/agent-content","part":"p3c39877748834ab873fa"},{"owner":"modals/store-appointment-confirm","part":"p1a551f02e27a01b30184"},{"owner":"pages/home","part":"pbe5fac9f8a417a0350c7"},{"owner":"shared/agent-content","part":"p029e1f7f087f741fcb81"},{"owner":"pages/home","part":"p7058377893b3e6806e56"},{"owner":"modals/lead-form","part":"p68a977ff99f4bfee065a"},{"owner":"pages/home","part":"p772464db475323c813ad"},{"owner":"modals/order-payment-confirm","part":"p4e8a27567080a26144be"},{"owner":"pages/home","part":"pf82af05ff09092566735"},{"owner":"shared/agent-content","part":"p2dda2b6f01684fbbb10b"},{"owner":"pages/home","part":"p1d00f2edd5435c1be507"},{"owner":"modals/toast","part":"pd0f3693fbe18f0476c99"},{"owner":"pages/home","part":"pdbc1bb1f91993c81e0aa"},{"owner":"pages/product-detail","part":"p12da9a426493261d72c5"},{"owner":"pages/home","part":"p287579b89b15249e9160"},{"owner":"pages/store-list","part":"p6c6c2e0294a84fe85d4f"},{"owner":"pages/home","part":"pcf2501a5e2b8d7c6f58a"},{"owner":"modals/invoice-edit","part":"p80eb824c401be8f1eb3f"},{"owner":"pages/home","part":"p908b71b0d36a2673864b"},{"owner":"shared/agent-content","part":"pe832ffdfb4b3c1470916"},{"owner":"shared/common","part":"p19d9beb58fb9a9fa80e2"},{"owner":"pages/product-detail","part":"p062c3d460c3758bc9a94"},{"owner":"pages/home","part":"p4b5657302f05dff518b8"},{"owner":"pages/product-list","part":"p5226af9b2272e3340de4"},{"owner":"shared/common","part":"p367516ceafe63c715966"},{"owner":"pages/home","part":"p4b41fa09b7a5791bef5e"},{"owner":"shared/agent-content","part":"p0cea5336fad11fd4ef29"},{"owner":"shared/common","part":"p68b976182c9a706f3c3f"},{"owner":"shared/agent-content","part":"pa0bb682825f51ed8c8b7"},{"owner":"pages/home","part":"pfe879b69e3a93bdfda30"},{"owner":"shared/agent-content","part":"p30e348006bbd2c5047ae"},{"owner":"pages/home","part":"p5cc555de53a72cafcc87"},{"owner":"pages/product-list","part":"p840391f585f202627508"},{"owner":"pages/home","part":"p6613a592c46332f68207"},{"owner":"pages/product-detail","part":"p2f91b8cd7110a7462a7d"},{"owner":"pages/home","part":"p7fa05239dfc777d4ee01"},{"owner":"pages/member-center","part":"pa6a3dff160f3b3c48c14"},{"owner":"pages/home","part":"p5ec78819e8f7f59bbaad"},{"owner":"shared/common","part":"pca4b6f097283cf50df36"},{"owner":"pages/solution-list","part":"p960b0d42024ff5e51947"},{"owner":"pages/home","part":"pac1e8add235ed522ae93"},{"owner":"shared/agent-content","part":"p3591789eea33230620c9"},{"owner":"pages/home","part":"pcd628986d2502bc4bbc8"},{"owner":"pages/product-detail","part":"p7663e39452826aec2fab"},{"owner":"pages/home","part":"pd7458e870ca6c7280421"},{"owner":"pages/product-detail","part":"pafd0ba0248252bafa229"},{"owner":"pages/home","part":"p924a03eefea919a293eb"},{"owner":"pages/product-detail","part":"pb16e4f18308f0663ab98"},{"owner":"pages/home","part":"pda57c2ab4c4d7f6269ae"},{"owner":"pages/product-detail","part":"p856fb1702a03c457ab90"},{"owner":"pages/home","part":"p3d3c0a4300b0bb66ce3b"},{"owner":"pages/product-detail","part":"pa1be509c356820b9bed0"},{"owner":"pages/home","part":"ped246dda766da6bcea6b"},{"owner":"shared/common","part":"p18ff7ff61307ed5bf5b5"},{"owner":"pages/home","part":"p627294425ad731f45b85"},{"owner":"shared/agent-content","part":"p864e19e88aaf7264ba96"},{"owner":"pages/home","part":"p459f8d823c38047419b8"},{"owner":"pages/product-detail","part":"p87d8e8839467f5755ca2"},{"owner":"pages/home","part":"p41fa0c15ac7f5312161e"},{"owner":"shared/common","part":"p0b0813b522d8326621d3"},{"owner":"pages/home","part":"p7681132b42bb2869f3fe"},{"owner":"shared/agent-content","part":"p6363f5444b41e1f1a4f9"},{"owner":"pages/home","part":"p84a7f1dc0d95f090001f"},{"owner":"shared/agent-content","part":"p9f46596cc72f6f93cb21"},{"owner":"pages/home","part":"p9bff5e873e43383ae628"},{"owner":"shared/agent-content","part":"p145558f233fdbe5bdf0e"},{"owner":"shared/common","part":"p1cda1f276a69d1041469"},{"owner":"shared/agent-content","part":"p46ecf9beb2cf0a9679ef"},{"owner":"modals/conversation-history","part":"p4b3545f314a3c61a0460"},{"owner":"shared/agent-content","part":"p1f79f1b640c74dbd7c24"},{"owner":"pages/home","part":"p4ee3d78a40d6f0b97a08"},{"owner":"shared/agent-content","part":"pe9e12f7881894c4054a3"},{"owner":"pages/home","part":"p8eeaaf8f6dc0a28d5ca0"},{"owner":"shared/agent-content","part":"p60221e5feea28760ec85"},{"owner":"pages/home","part":"pcf1a2c69c0930691224f"},{"owner":"shared/common","part":"p22317f9f51af2e0ec2a4"},{"owner":"pages/home","part":"p35d708e0e1e801cb9c33"},{"owner":"shared/agent-content","part":"pdadb1c4c7d6612845f10"},{"owner":"pages/home","part":"p81230ff46a58d35f9a34"},{"owner":"shared/agent-content","part":"p5cbd91bf5374ad64d8a0"},{"owner":"pages/home","part":"pc5766398cf460bd8b197"},{"owner":"shared/agent-content","part":"pb32a9274af410d06f7c3"},{"owner":"pages/home","part":"p43951a0a4514bc0745ad"},{"owner":"shared/common","part":"pc0a93c6abaf72a22fd4e"},{"owner":"shared/agent-content","part":"pc93ce2765a72454c22c4"},{"owner":"pages/home","part":"p5e8c0167622140afcff5"},{"owner":"shared/agent-content","part":"p0702b7df888bdf2b3b2e"},{"owner":"shared/common","part":"p97c3167eec0d17d78e2e"},{"owner":"pages/product-detail","part":"p71e581cf0a9c29a76d5c"},{"owner":"shared/common","part":"pb2b7d5b39ad7ca4e61a5"},{"owner":"pages/product-detail","part":"p18c8636938ab7c594638"},{"owner":"shared/agent-content","part":"pa3dc7d8777aec61c629d"},{"owner":"modals/workplace-auth","part":"pc04a234f44b385faf16d"},{"owner":"pages/home","part":"p0e4b960bee52661b0eac"},{"owner":"pages/ledou-center","part":"p85d1b45bc6cbc7566ff1"},{"owner":"pages/home","part":"pb483b9c3e52fa7c782fc"},{"owner":"shared/agent-content","part":"pe1fb70b57a181b557fbd"},{"owner":"pages/home","part":"pd9229c15d38672f751ff"},{"owner":"modals/education-auth","part":"pe8d76f9e769362e96ecf"},{"owner":"shared/agent-content","part":"p53203c243a861ac5115d"},{"owner":"pages/product-detail","part":"p941b5b0b2472b9b6e0fc"},{"owner":"pages/home","part":"pdd831f7e2e61b87fd912"},{"owner":"pages/product-detail","part":"pcbbb0963a81f017d4c64"},{"owner":"pages/home","part":"p12528395a52328d568fc"},{"owner":"shared/agent-content","part":"p455e6191186ed98b64c5"},{"owner":"pages/home","part":"pdf35167975332dc37ca5"},{"owner":"shared/agent-content","part":"p19b794fc51c2ffbcb806"},{"owner":"pages/home","part":"pa9b108754a793879d5b1"},{"owner":"shared/common","part":"p70431c6fe89edf2215ac"},{"owner":"pages/home","part":"pa52db4898e7f32974ed7"},{"owner":"shared/agent-content","part":"p39764c2cad727079edf0"},{"owner":"pages/home","part":"pe83f1c22de2480330674"},{"owner":"pages/product-detail","part":"pf2d917a30b102f65a226"},{"owner":"shared/agent-content","part":"p848a320336c3a281534d"},{"owner":"pages/home","part":"p546d7fff68854afaa36e"},{"owner":"pages/product-detail","part":"p95524f7cab2117fc112c"},{"owner":"pages/home","part":"pb0834ebdfe905b1237d9"},{"owner":"shared/agent-content","part":"p78c73701156fc793b23d"},{"owner":"pages/store-list","part":"p041838b40333ad14d183"},{"owner":"pages/store-detail","part":"p1eab89b56968da4b7e7e"},{"owner":"pages/store-list","part":"pd6f86d2127053254ecd9"},{"owner":"pages/home","part":"p25888df78d3867868b25"},{"owner":"shared/agent-content","part":"p2c28a2666c222a6ab14f"},{"owner":"pages/home","part":"pe965e66bdbc87c6ae683"},{"owner":"modals/login","part":"p711d984edcf7653089e7"},{"owner":"pages/home","part":"p2a8c1cfa1b07a9ed2882"},{"owner":"pages/order-list","part":"p4c0b0182fb77995a1812"},{"owner":"modals/invoice-edit","part":"p14319f28085176014950"},{"owner":"modals/order-payment-confirm","part":"pcae25d1865715b0c39e1"},{"owner":"shared/common","part":"p1e62637d8ecfadbfbd89"},{"owner":"pages/home","part":"pd8c3f79425685e09a070"},{"owner":"pages/store-list","part":"pa1eeb088d59e5ca49cc8"},{"owner":"pages/home","part":"pfbbf8f6b1feb30929bd5"},{"owner":"shared/agent-content","part":"p93e28f3b43ebbd670bee"},{"owner":"pages/home","part":"p5deb3440008dd2f319e3"},{"owner":"modals/login","part":"pe1d82316deb0b4a171dc"},{"owner":"pages/home","part":"paa995288b5c5afb0daaa"},{"owner":"shared/agent-content","part":"p5b6f5a45501b9acca51d"},{"owner":"pages/home","part":"p5baa70a772f7c158e3dc"},{"owner":"shared/agent-content","part":"p199d503a4c0dee102bfe"},{"owner":"pages/home","part":"pbc71eec04cf77f6ddf8d"},{"owner":"pages/solution-list","part":"p007322612b9e15413f4d"},{"owner":"pages/home","part":"p1a541aff2791db4de282"},{"owner":"pages/solution-list","part":"p44f3b7db8cc611124253"},{"owner":"pages/home","part":"p393498ef93c02e9763ba"},{"owner":"pages/product-list","part":"p53faf9a497b3bcb933e5"},{"owner":"shared/common","part":"p238b92ebc900ce43a264"},{"owner":"pages/home","part":"pd988457fda5d9c9caa03"},{"owner":"modals/conversation-history","part":"pd4ac0b0d8bb35651ea04"},{"owner":"modals/education-auth","part":"p286db208bcccb8454268"},{"owner":"pages/home","part":"p710334c2fdf0f9a363cc"},{"owner":"modals/education-auth","part":"p59338c18fa3dcb59d025"},{"owner":"pages/home","part":"p26e3b9f118c8bbb72188"},{"owner":"modals/lead-form","part":"pe656889747d08240cdeb"},{"owner":"shared/common","part":"p594de931560b0754d069"},{"owner":"modals/lead-form","part":"p69026c4ea06f49e6d385"},{"owner":"pages/solution-detail","part":"p5cdbf0ae3cdb51311466"},{"owner":"pages/home","part":"pcad4f8ea1882715e135b"},{"owner":"pages/solution-detail","part":"pecb612c0eb241b7a90d8"},{"owner":"pages/home","part":"pbf7e157da8e85f99f6a0"},{"owner":"modals/lead-form","part":"p64ae437358100556a8ea"},{"owner":"pages/home","part":"pfd2da618a800dfde6d1c"},{"owner":"shared/common","part":"pd8b6d12957f3cad61622"},{"owner":"pages/home","part":"p09e14b4f23ec01e9ada3"},{"owner":"pages/product-list","part":"p472a9b00364552f7f0bd"},{"owner":"pages/home","part":"p2554a865b8f549534b44"},{"owner":"shared/agent-content","part":"p1ad56ca46e38661d89f6"},{"owner":"pages/home","part":"p24b67f3c2a4c9124431a"},{"owner":"modals/education-auth","part":"pe04c1cb46eec5cb71a39"},{"owner":"pages/home","part":"p0ab85cb04966d4f40cbd"},{"owner":"shared/agent-content","part":"p0f30a07daf65c96d8a46"},{"owner":"pages/home","part":"p2c04a3eb4c28f4222165"},{"owner":"modals/login","part":"p669722a6c08bdf321e83"},{"owner":"pages/home","part":"p2b8c2634a0eedc878bc4"},{"owner":"modals/education-auth","part":"p63c2f7cdfdc792211f7d"},{"owner":"pages/home","part":"p425cc3a9f1bd269defe8"},{"owner":"modals/education-auth","part":"p2cddf4993d5d031bace7"},{"owner":"pages/home","part":"pb380e187d6a71188ad87"},{"owner":"shared/common","part":"p3ecdf2e283a962b4e3e6"},{"owner":"pages/home","part":"p9d00c418a7ff45ee136b"},{"owner":"shared/agent-content","part":"p2d3348dec352e396f0c5"},{"owner":"pages/home","part":"p5b4166e7f263ff2235f8"},{"owner":"shared/agent-content","part":"p6b1ed3f219f7757b428a"},{"owner":"shared/common","part":"pa725a47627fce09388c1"},{"owner":"pages/home","part":"p730c939a904bbd8686a2"},{"owner":"shared/agent-content","part":"p95abf86fd036a6ac55b2"},{"owner":"shared/common","part":"p7dc4322af3dccd534131"},{"owner":"shared/agent-content","part":"p98373ce46826f1833c98"},{"owner":"pages/home","part":"pf46e778c8dae709a6278"},{"owner":"shared/agent-content","part":"p73518ddd8a0906196844"},{"owner":"shared/common","part":"p46ebde620ca6f0da7832"},{"owner":"shared/agent-content","part":"p34080d36fd721b0fb96a"},{"owner":"pages/home","part":"p7be3ec5fa7880bd86742"},{"owner":"shared/agent-content","part":"p24ee3fb046b2b803040a"},{"owner":"pages/home","part":"pffc70a515a79cedc6577"},{"owner":"shared/agent-content","part":"p032367070d90a94f05b1"},{"owner":"pages/home","part":"pfec42610d79cc2074f03"},{"owner":"pages/solution-compare","part":"p665b90b8cc797c44d23b"},{"owner":"pages/home","part":"p333361e8d7eb63cb1d3e"},{"owner":"shared/common","part":"pdaa26940cd532d87bd90"},{"owner":"shared/agent-content","part":"pa7493192f572bff64fd1"},{"owner":"pages/home","part":"p6d75e21c591dbb2ea79d"},{"owner":"pages/solution-compare","part":"pfcc5f88f9a73668c5a2b"},{"owner":"modals/education-auth","part":"p753a6802b197a628600e"},{"owner":"modals/profile-edit","part":"p2f84e081710312e81f5d"},{"owner":"shared/agent-content","part":"p1ace71e8851ed84539de"},{"owner":"pages/store-list","part":"p361e2c3a1ccb05a88aca"},{"owner":"pages/home","part":"pbd217335f44ab5f22017"},{"owner":"pages/store-list","part":"p1469b8f2e1224c901d1a"},{"owner":"shared/common","part":"pb3362fdff32084e634ff"},{"owner":"pages/store-list","part":"pb8efede4f8d9313c17e6"},{"owner":"shared/common","part":"pf3247e4bbe709a59e20c"},{"owner":"pages/store-list","part":"p91dafb0eb98889a980f9"},{"owner":"pages/store-detail","part":"p766517c7dcf5226ccccc"},{"owner":"pages/store-list","part":"p88dd0aa49dc30e776a52"},{"owner":"pages/store-detail","part":"pbc0d8a78c858d6ea4751"},{"owner":"modals/store-appointment-confirm","part":"p60f1df749b355568abf5"},{"owner":"pages/store-list","part":"pd189da7cfd3833f4aa00"},{"owner":"shared/common","part":"p2c80ad47944ff9d1eccf"},{"owner":"modals/store-appointment-confirm","part":"pf7a96056eb3ef10beea4"},{"owner":"shared/common","part":"p8d09ba6e1fabc6b03e41"},{"owner":"pages/store-list","part":"padb0be73b449b6ad14ff"},{"owner":"shared/common","part":"p42c50e5363fe35e3a5dd"},{"owner":"modals/toast","part":"p5bf2f6111b8675d6abea"}],"/assets/frontend/css/pages/home/inline-05.css":[{"owner":"shared/agent-content","part":"pc20960f83e80802d61eb"},{"owner":"pages/home","part":"pfc871c3d9066b2aa3421"},{"owner":"shared/agent-content","part":"p1028bacc938be9ec2d0c"}],"/assets/frontend/css/pages/home/inline-07.css":[{"owner":"modals/conversation-history","part":"p845902309485266b0545"}],"/assets/frontend/css/pages/home/inline-10.css":[{"owner":"shared/agent-content","part":"p957a1a211f244e87b8c6"},{"owner":"pages/home","part":"p1bc7f50ad5623dfd51e4"}],"/assets/frontend/css/pages/home/inline-12.css":[{"owner":"pages/home","part":"p5500c95da0b55d916a73"},{"owner":"pages/product-list","part":"p4472370c529e8b29486d"},{"owner":"pages/home","part":"p80d9d0d431cc70e53b00"}],"/assets/frontend/css/pages/home/inline-13.css":[{"owner":"shared/agent-content","part":"p4860f0bc4ee7ae7a5020"}],"/assets/frontend/css/pages/home/inline-17.css":[{"owner":"pages/home","part":"p10b2dc62044897b955d3"},{"owner":"shared/common","part":"p35d0be9e276fb9461e31"}],"/assets/frontend/css/pages/home/inline-18.css":[{"owner":"shared/agent-content","part":"pfe4d33922255e5126901"}],"/assets/frontend/css/pages/home/inline-19.css":[{"owner":"shared/agent-content","part":"p5b70cbf57f0a203eefe3"}],"/assets/frontend/css/pages/shop/inline-06.css":[{"owner":"pages/consumer-home","part":"p6fc8816f8775384ca147"},{"owner":"shared/agent-content","part":"p3a78196cf53d7fd6223f"},{"owner":"pages/product-list","part":"pb1db2d52dc8f0ecddb38"},{"owner":"pages/consumer-home","part":"pe904db1bba7c7b1a017a"},{"owner":"shared/common","part":"pe8079bef7ae99007255a"},{"owner":"pages/consumer-home","part":"pd7f903a9a639f29b1dad"},{"owner":"shared/agent-content","part":"pd41e5952d6383cb91712"},{"owner":"pages/consumer-home","part":"pd0df4045f10521383126"},{"owner":"pages/product-list","part":"p4472370c529e8b29486d"},{"owner":"pages/consumer-home","part":"p8644fcedd0e4ef8ed8e7"},{"owner":"pages/product-detail","part":"p1d0b4605e320a89c6732"},{"owner":"shared/agent-content","part":"p9d138b65772a36e42b14"},{"owner":"pages/product-detail","part":"p306bc04b25363010fd88"},{"owner":"shared/agent-content","part":"p16a2a14144ab79aa660e"},{"owner":"pages/consumer-home","part":"p5f320584a92a40dbcbbe"},{"owner":"modals/order-payment-confirm","part":"p7533de93e28f2e23af46"},{"owner":"modals/lead-form","part":"p33aaff54c24d4758adc4"},{"owner":"pages/consumer-home","part":"p06d7df68e635fb4d998b"},{"owner":"shared/agent-content","part":"p0070143b51e24ab2d0b8"},{"owner":"modals/order-payment-confirm","part":"pdd3c8bc204bd20a2203c"},{"owner":"pages/consumer-home","part":"pa388ccd526a70cc07d59"},{"owner":"modals/payment-processing","part":"p31075332f045910067cf"},{"owner":"shared/common","part":"p3160e904e630c529ac8b"},{"owner":"pages/consumer-home","part":"p20eb3f974b1dc7a01016"},{"owner":"shared/agent-content","part":"p32ee833b485c6dc48d54"},{"owner":"pages/consumer-home","part":"pf737e92a6157a5b25c7b"},{"owner":"shared/common","part":"p22ade65a6d29c10a8a3c"},{"owner":"pages/consumer-home","part":"p7c7402c6656d69a256c4"}],"/assets/frontend/css/pages/shop/inline-21.css":[{"owner":"shared/agent-content","part":"pa383bd6b709ccc4fd318"}],"/assets/frontend/css/pages/shop/inline-22.css":[{"owner":"pages/consumer-home","part":"pe82c2e696a99d67c20eb"},{"owner":"shared/agent-content","part":"pd84feb686c26ef8fd51e"},{"owner":"shared/common","part":"pc120e5c3def4c4858013"},{"owner":"pages/consumer-home","part":"pd1e2b37d4c5cf8ff1890"},{"owner":"shared/common","part":"pe7e893461abe8072ad8f"},{"owner":"shared/agent-content","part":"pa5cdae56777fc8ecbf9f"},{"owner":"pages/consumer-home","part":"p6cb1238c8ee8dd473673"},{"owner":"pages/product-list","part":"p691e87074a15fcad23c7"},{"owner":"shared/common","part":"p241f6d9ec0dd12257703"}],"/assets/frontend/css/shared/inline-2104d0ed7dd2.css":[{"owner":"shared/common","part":"p9853870d8dca4dbafcbd"},{"owner":"shared/agent-content","part":"p5b616a4ac057cf4c6ac7"}],"/assets/frontend/css/shared/inline-3bc2eb74f360.css":[{"owner":"shared/common","part":"pbcc386a2e835b110b0c3"},{"owner":"shared/agent-content","part":"pc1ecff016e0086d5ad70"},{"owner":"shared/common","part":"p5dcb2e2a696407cbcb53"},{"owner":"shared/agent-content","part":"pea246b112e838b77a63d"},{"owner":"shared/common","part":"p1f0f2338f199f2e723c3"},{"owner":"shared/agent-content","part":"pc081b2309e7278d1d75c"},{"owner":"shared/common","part":"p0795a905989894dece03"},{"owner":"shared/agent-content","part":"p416b9f950c0931e3eecb"},{"owner":"modals/conversation-history","part":"pff7af3fbaf6b563bdf14"},{"owner":"shared/agent-content","part":"p0e79fce6cecae9a0a5da"},{"owner":"shared/common","part":"p5cbfa3aea527c6a6f12a"},{"owner":"shared/agent-content","part":"p5ae38fc553f1379b6918"},{"owner":"shared/common","part":"p7468f446dcc432d43c5b"},{"owner":"shared/agent-content","part":"pf0784696274f77daf882"},{"owner":"modals/conversation-history","part":"p1a791c37f71cd0c438df"},{"owner":"shared/common","part":"p046801070d946446590a"},{"owner":"shared/agent-content","part":"p0f65c38c26ae9ac10c3a"},{"owner":"shared/common","part":"pc44d4d14783b1d7db8c7"},{"owner":"shared/agent-content","part":"padce22c6ce446cd7dbd6"},{"owner":"shared/common","part":"p04f4c58ea50b0dd8dc3a"},{"owner":"shared/agent-content","part":"p8e1eef26029479a3ef43"},{"owner":"shared/common","part":"p7013b99fc04ed6ae9b88"},{"owner":"shared/agent-content","part":"p71167054b41455288788"},{"owner":"shared/common","part":"p94bff2dd432add6cecfa"},{"owner":"pages/product-list","part":"p0c87e5ae6b4d5906b7e7"},{"owner":"shared/common","part":"pafd539f0750ad1359122"},{"owner":"pages/product-detail","part":"p137ed5bfbc879c401785"},{"owner":"shared/common","part":"p6387f23e3b5b92a23386"},{"owner":"pages/product-list","part":"p9addbaadd06661368bf0"},{"owner":"shared/common","part":"pb52df1158bd89774598d"},{"owner":"pages/product-compare","part":"p651e6d92511ca4924f32"},{"owner":"shared/common","part":"pdd05074812dc7c2059f4"},{"owner":"pages/product-compare","part":"pecf76a40c8136ad28f81"},{"owner":"shared/common","part":"pbf8f489b4cd1b7067066"},{"owner":"pages/product-detail","part":"p39c4cfdaef5a70bc0883"},{"owner":"shared/common","part":"p294d47ceefd171451117"},{"owner":"shared/agent-content","part":"p07b7e579b0618be7d690"},{"owner":"shared/common","part":"p4908d501d3420a66eb76"},{"owner":"shared/agent-content","part":"p1cec8ac9bf2268a73d3b"},{"owner":"shared/common","part":"pa8580011902346f12853"},{"owner":"shared/agent-content","part":"p5969a4715068eea04620"},{"owner":"shared/common","part":"paca0b2ebef7463c87456"},{"owner":"pages/solution-list","part":"p467e0d6ac4552da7cc21"},{"owner":"shared/common","part":"pf54863b4834a98f1abe5"},{"owner":"pages/solution-list","part":"p0ce473fc0524900bd146"},{"owner":"shared/common","part":"p5f5e6f015cf4347e20ca"},{"owner":"pages/solution-list","part":"pfd71236ebf0d9f103144"},{"owner":"shared/common","part":"p3d19774a98babcea3809"},{"owner":"shared/agent-content","part":"pb8dc6d378da9ed764935"},{"owner":"shared/common","part":"pabd4befec2e6329b0383"},{"owner":"pages/solution-list","part":"p7e0211b51437df8414c9"},{"owner":"shared/common","part":"pac3c1abfa02b6a63e340"},{"owner":"pages/product-detail","part":"p8a145e2da2619e233fbf"},{"owner":"shared/common","part":"p171be4557bd37e2fc6ee"},{"owner":"pages/product-detail","part":"p5ced635159cb9032df0b"},{"owner":"shared/common","part":"pb62e5256b55eab8039be"},{"owner":"shared/agent-content","part":"p9f7cf192e5f4ba1e8c75"},{"owner":"shared/common","part":"pfbf0680f9babd126be2a"},{"owner":"shared/agent-content","part":"p0610749e98608c77a957"},{"owner":"shared/common","part":"p608d33585ffcbf9cf68e"},{"owner":"shared/agent-content","part":"p14cf9193e7101f15c939"},{"owner":"shared/common","part":"p8dc8fbba949113390589"},{"owner":"shared/agent-content","part":"pc6a65174f8a14e1b2d57"},{"owner":"shared/common","part":"pa6d5226fd6666942f8c8"},{"owner":"pages/product-list","part":"p4944304c912c87923ca2"},{"owner":"shared/common","part":"p905250917550636a84f6"},{"owner":"shared/agent-content","part":"p54351bf6a1393f2bc0cd"},{"owner":"shared/common","part":"pe30e53edcf05d995adbb"},{"owner":"pages/product-list","part":"p2bfaf4fdda0c067d167d"},{"owner":"shared/common","part":"p1e7b3ba8738f9de3818a"},{"owner":"shared/agent-content","part":"p1d1e3e2cc7858c041753"},{"owner":"shared/common","part":"p9dacd38a2492fc72b9df"},{"owner":"shared/agent-content","part":"pe489a1a358b190649d90"},{"owner":"shared/common","part":"p8ad49534b70aa5c845c7"},{"owner":"shared/agent-content","part":"p3ba8d3b18b650738320c"},{"owner":"shared/common","part":"p4d70e0e6b4d067e4f707"},{"owner":"shared/agent-content","part":"p1cf883b55acd5c17a587"},{"owner":"shared/common","part":"pecb99438dc8e377d1586"},{"owner":"shared/agent-content","part":"p7f2b416095f23555afb6"},{"owner":"shared/common","part":"p30c6ada461bf214f4a9a"},{"owner":"shared/agent-content","part":"p90bb0ec31b7164501b68"},{"owner":"shared/common","part":"p12af48310bd4aca586f7"},{"owner":"modals/order-payment-confirm","part":"p0544ba5d73152fb14ee2"},{"owner":"shared/common","part":"p7b9e46dc50d25f071f0a"},{"owner":"shared/agent-content","part":"p730e0007b197f2725e7c"},{"owner":"shared/common","part":"p0e9054170383ca33137a"},{"owner":"modals/toast","part":"p046332e38351977257d8"},{"owner":"shared/common","part":"pdaca01b4591e86f1a6f6"},{"owner":"pages/product-detail","part":"pb46f8457946ef8c7e01d"},{"owner":"shared/common","part":"p6aca58293fa4f7282809"},{"owner":"pages/store-list","part":"p9bb5e903210a877c0eff"},{"owner":"shared/common","part":"pc2f19016cdb48f35e86d"},{"owner":"modals/invoice-edit","part":"p04cca2680af1e3f02c44"},{"owner":"shared/common","part":"p6532879b6ba7724cf376"},{"owner":"shared/agent-content","part":"p1916eefb74149d48b4d7"},{"owner":"shared/common","part":"p74607839ee7aa65b4c1a"},{"owner":"pages/product-detail","part":"p178f3634c2310deeb5d1"},{"owner":"shared/common","part":"p09c16bdf4a37f706cf90"},{"owner":"pages/product-list","part":"p11b7d3481a393da6d97a"},{"owner":"shared/common","part":"p257c10efce433038201e"},{"owner":"shared/agent-content","part":"p9ebdf06bcff02cb780cd"},{"owner":"shared/common","part":"p77f23eeb20227cf9a72a"},{"owner":"shared/agent-content","part":"p722716e38590cdee8eb8"},{"owner":"shared/common","part":"pb8d8879ce0e53486114d"},{"owner":"shared/agent-content","part":"pcc44a521a5da455a0c0d"},{"owner":"shared/common","part":"p66d777aae36643609dfc"},{"owner":"pages/product-list","part":"p30e2030b51f2c71d844c"},{"owner":"shared/common","part":"pdd29f161a39a63a16fce"},{"owner":"pages/product-detail","part":"pf4ce96f666885009a1fb"},{"owner":"shared/common","part":"p2e6d0a0733372257ee7d"},{"owner":"pages/member-center","part":"pc634c149a5a05ae2ba36"},{"owner":"shared/common","part":"pb226a616b7b421a6b500"},{"owner":"shared/agent-content","part":"p8ab4816fd06e19829fbe"},{"owner":"shared/common","part":"p12d5e96997b0209d695a"},{"owner":"pages/product-detail","part":"pbec4a9d759f5db7d28e1"},{"owner":"shared/common","part":"p1a2eb8b681801f9976d3"},{"owner":"pages/product-detail","part":"p1c5fb5238ef15452d6d4"},{"owner":"shared/common","part":"p6e26838652a1a0f9aed6"},{"owner":"pages/product-detail","part":"paf92819ad225cb680203"},{"owner":"shared/common","part":"p3c2b56ab7e7e862c511c"},{"owner":"pages/product-detail","part":"p89a3f3fba96c6fb298eb"},{"owner":"shared/common","part":"paa0785087e888952163b"},{"owner":"pages/product-detail","part":"p79756aab4834d84fa131"},{"owner":"shared/common","part":"p03cddf2d9a5e9db73ece"},{"owner":"shared/agent-content","part":"p48ebd33399359e073885"},{"owner":"shared/common","part":"p2207801ecbbd035600c6"},{"owner":"pages/product-detail","part":"p6fec8d03d0bc7c08df9b"},{"owner":"shared/common","part":"p534de20ff7c30bfe9955"},{"owner":"shared/agent-content","part":"p6363f5444b41e1f1a4f9"},{"owner":"shared/common","part":"p94f81ac7daf7a11b701a"},{"owner":"shared/agent-content","part":"p5bcde3364dc495eaabc9"},{"owner":"shared/common","part":"p1afed2a108550f1c859c"},{"owner":"shared/agent-content","part":"p5c1c0830a6fca4254fd7"},{"owner":"shared/common","part":"p1cda1f276a69d1041469"},{"owner":"shared/agent-content","part":"p72ba3c1935adeb10340e"},{"owner":"shared/common","part":"p03b9bdb26d50ed03ce48"},{"owner":"shared/agent-content","part":"p880cd48386fbdd3535eb"},{"owner":"shared/common","part":"pdf0dc022968d2cc0436a"},{"owner":"shared/agent-content","part":"pfaa798f12adebe101198"},{"owner":"shared/common","part":"pe08a22991cefb61d8b68"},{"owner":"shared/agent-content","part":"p4a7e5145c24c318b2a4a"},{"owner":"shared/common","part":"p715c4b68784c41bbdf0d"},{"owner":"shared/agent-content","part":"pcc20dda0fa15bb0320f3"},{"owner":"shared/common","part":"p3bbe537e705f3fc46e6e"},{"owner":"shared/agent-content","part":"p20a6a62b75e8a8d5144b"},{"owner":"shared/common","part":"pe94ec3cb11ba35dee8e8"},{"owner":"shared/agent-content","part":"padd55986584f73638234"},{"owner":"shared/common","part":"p8fb3acde448353746f8e"},{"owner":"shared/agent-content","part":"p8aceff62d53609f189c9"},{"owner":"shared/common","part":"paea9ce345a191953e019"},{"owner":"shared/agent-content","part":"pb529cbe8827c8b72a899"},{"owner":"shared/common","part":"pba5b12cb733b693d605d"},{"owner":"pages/product-detail","part":"p75940f11d761901e4685"},{"owner":"shared/common","part":"pcdecdcfa0dd177314a8c"},{"owner":"pages/product-detail","part":"pdc4a49b5a08694a63491"},{"owner":"shared/agent-content","part":"p79b6e16e5778c525e433"},{"owner":"modals/workplace-auth","part":"p81a38c33293bcb0c6388"},{"owner":"shared/common","part":"p6c737d5331b84686cabe"},{"owner":"pages/ledou-center","part":"p8425ae92e76fcf136f37"},{"owner":"shared/common","part":"p5df488e07a51f11ca6e1"},{"owner":"shared/agent-content","part":"p864ba6bd2e230e9671b8"},{"owner":"shared/common","part":"p004ab3b2b3ba42c64609"},{"owner":"modals/education-auth","part":"p393e45e01d0d0bf30d38"},{"owner":"shared/agent-content","part":"p04a05b25e1df3a30f078"},{"owner":"pages/product-detail","part":"p23c69075343e0a7ffd6c"},{"owner":"shared/common","part":"p849e8e3168397fca73ca"},{"owner":"pages/product-detail","part":"p094eba5eac2ac9558ac6"},{"owner":"shared/common","part":"peb9a1c9c2727d841e034"},{"owner":"shared/agent-content","part":"p6da62a5b31cba274dd1d"},{"owner":"shared/common","part":"p48b2136298ddac83e4a8"},{"owner":"shared/agent-content","part":"p242a6b85dce75a80671c"},{"owner":"shared/common","part":"pe9aa166f2b7eb94956a2"},{"owner":"shared/agent-content","part":"pbe70edd0a20064f892cb"},{"owner":"shared/common","part":"pcb7d9cafea989c00ccdf"},{"owner":"pages/product-detail","part":"p5d5a6646fedd337d97c1"},{"owner":"shared/agent-content","part":"pab4cbc3efc0641b254c6"},{"owner":"shared/common","part":"p09e8a0ebf903b07fbccd"},{"owner":"pages/product-detail","part":"p8e6be70aa47fc36be4ef"},{"owner":"shared/common","part":"p613f92a2ee2ab607b7ab"},{"owner":"shared/agent-content","part":"p78132516e2c7af72549f"},{"owner":"pages/store-list","part":"p9e80c703d8bbc7235daf"},{"owner":"pages/store-detail","part":"p307b1e9f9e79a0ef3fc9"},{"owner":"pages/store-list","part":"p9ebc90094608775fcadb"},{"owner":"shared/common","part":"p7abf423c5d03f1472c66"},{"owner":"shared/agent-content","part":"p54d2af9cbfe4ec92b652"},{"owner":"shared/common","part":"pb76d3706d92ae560c191"},{"owner":"modals/login","part":"p19159b13472313c43abb"},{"owner":"shared/common","part":"pb9d50265d09a81b61349"},{"owner":"pages/order-list","part":"p53487d7d68d491a204f6"},{"owner":"modals/invoice-edit","part":"p91f1e0fe5010cb5b9421"},{"owner":"modals/order-payment-confirm","part":"p5f03d0e07d0bad1fbcb6"},{"owner":"shared/common","part":"p1a6515cc023df66d259e"},{"owner":"pages/store-list","part":"p410f5e2f990b66df751d"},{"owner":"shared/common","part":"pb57ad0f4c580e0786aa4"},{"owner":"shared/agent-content","part":"p1d154308c951969801c4"},{"owner":"shared/common","part":"p140a3b7345924d365622"},{"owner":"modals/login","part":"p82d6abac58f899630e7c"},{"owner":"shared/common","part":"pe46fa6f1dc663ef34f01"},{"owner":"shared/agent-content","part":"p045e4417906c10a3fb57"},{"owner":"shared/common","part":"p2163fc3606437913b6fb"},{"owner":"shared/agent-content","part":"pc717d5e2a0a79f8c6ce2"},{"owner":"shared/common","part":"pf41993fa26290aa377c7"},{"owner":"pages/solution-list","part":"pe11a06196c86c5e6d1fb"},{"owner":"shared/common","part":"pb0a4a004d6c1d19f4cd2"},{"owner":"pages/solution-list","part":"p9810db9f3d2bab9b35b6"},{"owner":"shared/common","part":"pf8838de43bea8e66d95c"},{"owner":"pages/product-list","part":"pf486cdf079ef80ffc7dc"},{"owner":"shared/common","part":"p73eb7afbffea31aed51e"},{"owner":"modals/conversation-history","part":"p005600fd8a87ab2e218a"},{"owner":"modals/education-auth","part":"pc8ae1366643b18a2df44"},{"owner":"shared/common","part":"pc56566bbe7bfb0515575"},{"owner":"modals/education-auth","part":"p5250301e80e99272520f"},{"owner":"shared/common","part":"p4c00d96d1c50108d42b3"},{"owner":"modals/lead-form","part":"p433989822b02ab41cbc6"},{"owner":"shared/common","part":"p161f1a20c1d388788676"},{"owner":"modals/lead-form","part":"pc5c52efa9cd2e2490647"},{"owner":"pages/solution-detail","part":"p8029b8bbbac30c5f5bb4"},{"owner":"shared/common","part":"p63f531aaa3ab0abb06c1"},{"owner":"modals/lead-form","part":"pafd66c787c8290b3dc25"},{"owner":"shared/common","part":"p5fca636b339488e154e2"},{"owner":"pages/product-list","part":"p17bdb03017cb7f95d7b7"},{"owner":"shared/common","part":"p963349d4e7fc4ce681c6"},{"owner":"shared/agent-content","part":"p2083271dc69f97737cc0"},{"owner":"shared/common","part":"p417874dda42419ea3794"},{"owner":"modals/education-auth","part":"pccd211189ebbfe520593"},{"owner":"shared/common","part":"p49b02db99a1c41cb3b25"},{"owner":"shared/agent-content","part":"p1e109622b0a296fd4f9c"},{"owner":"shared/common","part":"pc0e8e67585a1afc3ee52"},{"owner":"modals/login","part":"p8cec2f52796995c7bde8"},{"owner":"shared/common","part":"p70cb737dac5e1c17de57"},{"owner":"modals/education-auth","part":"pdaa18672a35f4f14a221"},{"owner":"shared/common","part":"p560b9477fd92eada647d"},{"owner":"modals/education-auth","part":"p3491cdeedf09ea92b275"},{"owner":"shared/common","part":"p41542c86de8aec5e0b31"},{"owner":"shared/agent-content","part":"pe616790d582b3af9ac01"},{"owner":"shared/common","part":"p9837568f9c9e35a9b84e"},{"owner":"shared/agent-content","part":"p77a021366fdf90478906"},{"owner":"shared/common","part":"p912a189aa912103c8b60"},{"owner":"shared/agent-content","part":"p21c357c814cff2711e23"},{"owner":"shared/common","part":"p02c44d61e286e82b74b1"},{"owner":"shared/agent-content","part":"p814eedcab1e8506bf18b"},{"owner":"shared/common","part":"p013da4b4c9d332a1af6d"},{"owner":"shared/agent-content","part":"p8a75f8bec8d8a1a7462e"},{"owner":"shared/common","part":"p8a7569edb8d33a13ffd7"},{"owner":"shared/agent-content","part":"p86cb0aff9bbd8202f374"},{"owner":"shared/common","part":"pcbbbd19852a9a42326e4"},{"owner":"shared/agent-content","part":"pca02a6661a4a1a455b73"},{"owner":"shared/common","part":"p5308373f93d7903f0899"},{"owner":"shared/agent-content","part":"p7276ecdda7a54f557fd3"},{"owner":"shared/common","part":"pb49df6c697a277152ee5"}],"/assets/frontend/css/shared/inline-592f8f851e1f.css":[{"owner":"shared/common","part":"p6077fd46885883e24ef5"},{"owner":"pages/product-list","part":"p46c5e1fce96ff0383275"},{"owner":"shared/common","part":"p07a61efc259830a54103"}],"/assets/frontend/css/shared/inline-642ec9aa4eee.css":[{"owner":"shared/common","part":"pf40697dd16daf9c491d8"},{"owner":"shared/agent-content","part":"p3a78196cf53d7fd6223f"},{"owner":"pages/product-list","part":"pb1db2d52dc8f0ecddb38"},{"owner":"shared/common","part":"pbc8685b028bed7a65919"},{"owner":"shared/agent-content","part":"pd41e5952d6383cb91712"},{"owner":"shared/common","part":"pd2889331062179ae7e2a"},{"owner":"pages/product-list","part":"p4472370c529e8b29486d"},{"owner":"shared/common","part":"p23ec566902eab99913c4"},{"owner":"pages/product-detail","part":"p1d0b4605e320a89c6732"},{"owner":"shared/agent-content","part":"p9d138b65772a36e42b14"},{"owner":"pages/product-detail","part":"p306bc04b25363010fd88"},{"owner":"shared/agent-content","part":"p16a2a14144ab79aa660e"},{"owner":"shared/common","part":"p4ee43c3e47c316f1a782"},{"owner":"modals/order-payment-confirm","part":"p7533de93e28f2e23af46"},{"owner":"modals/lead-form","part":"p33aaff54c24d4758adc4"},{"owner":"shared/common","part":"pfa82a33c23cd22ae3c85"},{"owner":"shared/agent-content","part":"p0070143b51e24ab2d0b8"},{"owner":"modals/order-payment-confirm","part":"pdaadb8bac73826873dc2"},{"owner":"shared/common","part":"pb3af04b7266d0bc16682"}],"/assets/frontend/css/shared/inline-77378062a204.css":[{"owner":"shared/agent-content","part":"p72bb136c8ceebd6a5c4a"}],"/assets/frontend/css/shared/inline-91661584194a.css":[{"owner":"shared/agent-content","part":"p82dd36cc6d934bda5305"},{"owner":"shared/common","part":"p49fa829dabc259a933ea"}],"/assets/frontend/css/shared/inline-935e2224afac.css":[{"owner":"shared/common","part":"pb04717c3a98e6f07f9e5"}],"/assets/frontend/css/shared/inline-a6719541b94f.css":[{"owner":"shared/agent-content","part":"p2ead0afc6c112cd65d93"}],"/assets/frontend/css/shared/inline-c7bce3f5e8ce.css":[{"owner":"shared/common","part":"p518c020bbf84029b993d"},{"owner":"shared/agent-content","part":"p9918a55ac4b6508bb872"}],"/assets/frontend/css/shared/inline-d52d38244aa9.css":[{"owner":"shared/agent-content","part":"pe23f8adeeeae015fb64e"},{"owner":"shared/common","part":"p9239c3b5424d50cb772c"},{"owner":"shared/agent-content","part":"pfe727807a6fabebe9c57"}],"/assets/frontend/css/shared/inline-e75ae5be9405.css":[{"owner":"shared/agent-content","part":"p03cf3a55a30c632542dc"}],"/@inline/b-chat/index.html/8222.css":[{"owner":"pages/member-center","part":"p794c04dd3262cfffd783"}],"/@inline/b-chat/index.html/8518.css":[{"owner":"pages/smb-home","part":"pe3339b6f4987fecd09a8"}],"/@inline/b-chat/index.html/18736.css":[{"owner":"pages/product-detail","part":"p78767597077367b94c23"}],"/@inline/b-chat/index.html/19298.css":[{"owner":"pages/product-detail","part":"p6482f3647e30141d7a8f"}],"/@inline/b-chat/index.html/19892.css":[{"owner":"pages/member-center","part":"p3da78b8372ddaa302abb"}],"/@inline/b-chat/index.html/20145.css":[{"owner":"pages/smb-home","part":"pf44cef7abefe71d23c81"}],"/@inline/b-chat/index.html/20750.css":[{"owner":"pages/smb-home","part":"p156d71eaad267110d398"}],"/@inline/b-chat/index.html/21252.css":[{"owner":"shared/agent-content","part":"p1ba606105d5a00d7085b"}],"/@inline/b-chat/index.html/21571.css":[{"owner":"modals/product-match","part":"pf26202f540ad0dc4f752"}],"/@inline/b-chat/index.html/24383.css":[{"owner":"modals/product-match","part":"p0010ce2a538f9bb609cc"}],"/@inline/b-chat/index.html/24611.css":[{"owner":"shared/common","part":"p04613eb3dbfb31db45f5"},{"owner":"pages/smb-home","part":"pf6d0d5d1c9efd4987318"},{"owner":"shared/agent-content","part":"pc78bd8c94c7df5d9ae00"}],"/@inline/b-chat/index.html/25390.css":[{"owner":"pages/smb-home","part":"p25361ce190380c7c8235"}],"/@inline/b-chat/index.html/26082.css":[{"owner":"pages/product-detail","part":"p4b17936f427c49379ca2"}],"/@inline/biz-chat/index.html/8198.css":[{"owner":"pages/member-center","part":"p794c04dd3262cfffd783"}],"/@inline/biz-chat/index.html/8494.css":[{"owner":"pages/enterprise-home","part":"pd9de80ccf46a3f56e028"}],"/@inline/biz-chat/index.html/18712.css":[{"owner":"pages/product-detail","part":"p78767597077367b94c23"}],"/@inline/biz-chat/index.html/19274.css":[{"owner":"pages/product-detail","part":"p6482f3647e30141d7a8f"}],"/@inline/biz-chat/index.html/19868.css":[{"owner":"pages/member-center","part":"p3da78b8372ddaa302abb"}],"/@inline/biz-chat/index.html/20121.css":[{"owner":"pages/enterprise-home","part":"pff621312819348c7d7a6"}],"/@inline/biz-chat/index.html/20726.css":[{"owner":"pages/enterprise-home","part":"pf441a8d93feca93d5e2a"}],"/@inline/biz-chat/index.html/21228.css":[{"owner":"shared/agent-content","part":"p1ba606105d5a00d7085b"}],"/@inline/biz-chat/index.html/21547.css":[{"owner":"modals/product-match","part":"pf26202f540ad0dc4f752"}],"/@inline/biz-chat/index.html/24359.css":[{"owner":"modals/product-match","part":"p0010ce2a538f9bb609cc"}],"/@inline/biz-chat/index.html/24587.css":[{"owner":"shared/common","part":"p04613eb3dbfb31db45f5"},{"owner":"pages/enterprise-home","part":"p03b58ac9a6fa26b4bf48"},{"owner":"shared/agent-content","part":"pc78bd8c94c7df5d9ae00"}],"/@inline/biz-chat/index.html/25366.css":[{"owner":"pages/enterprise-home","part":"pd6777754a8c03f61cc9b"}],"/@inline/biz-chat/index.html/26058.css":[{"owner":"pages/product-detail","part":"p4b17936f427c49379ca2"}],"/@inline/brand/index.html/13548.css":[{"owner":"pages/brand-home","part":"p4c6500b3877f4571c5da"}],"/@inline/brand/index.html/15051.css":[{"owner":"pages/product-detail","part":"p78767597077367b94c23"}],"/@inline/brand/index.html/15613.css":[{"owner":"pages/product-detail","part":"p6482f3647e30141d7a8f"}],"/@inline/brand/index.html/16207.css":[{"owner":"pages/member-center","part":"p3da78b8372ddaa302abb"}],"/@inline/brand/index.html/16460.css":[{"owner":"pages/brand-home","part":"pf10218ae8becad6dcedd"}],"/@inline/brand/index.html/17065.css":[{"owner":"pages/brand-home","part":"pd85a33b7a57d4f1e3c5b"}],"/@inline/brand/index.html/17567.css":[{"owner":"shared/agent-content","part":"p1ba606105d5a00d7085b"}],"/@inline/brand/index.html/17886.css":[{"owner":"modals/product-match","part":"pf26202f540ad0dc4f752"}],"/@inline/brand/index.html/20698.css":[{"owner":"modals/product-match","part":"p0010ce2a538f9bb609cc"}],"/@inline/brand/index.html/20926.css":[{"owner":"shared/common","part":"p04613eb3dbfb31db45f5"},{"owner":"pages/brand-home","part":"p84dd5c3f1e46d47660b7"},{"owner":"shared/agent-content","part":"pc78bd8c94c7df5d9ae00"}],"/@inline/brand/index.html/21705.css":[{"owner":"pages/brand-home","part":"p7f30175da3c786db418d"}],"/@inline/brand/index.html/22397.css":[{"owner":"pages/product-detail","part":"p4b17936f427c49379ca2"}],"/@inline/index.html/14668.css":[{"owner":"shared/agent-content","part":"p5d5d7998f36e0bbc1f8c"},{"owner":"pages/home","part":"p65cef0a7ed07f0856ac8"},{"owner":"shared/common","part":"p325a67122c38d6567fb1"}],"/@inline/index.html/34250.css":[{"owner":"pages/home","part":"p1863e16550329769ae00"}],"/@inline/index.html/34891.css":[{"owner":"pages/product-detail","part":"p78767597077367b94c23"}],"/@inline/index.html/35453.css":[{"owner":"pages/product-detail","part":"p6482f3647e30141d7a8f"}],"/@inline/index.html/36047.css":[{"owner":"pages/member-center","part":"p3da78b8372ddaa302abb"}],"/@inline/index.html/36300.css":[{"owner":"pages/home","part":"p22d6c93c0fcc82773d97"}],"/@inline/index.html/36905.css":[{"owner":"pages/home","part":"pd67a0fceb074764ccc9f"}],"/@inline/index.html/37407.css":[{"owner":"shared/agent-content","part":"p1ba606105d5a00d7085b"}],"/@inline/index.html/37726.css":[{"owner":"modals/product-match","part":"pf26202f540ad0dc4f752"}],"/@inline/index.html/40538.css":[{"owner":"modals/product-match","part":"p0010ce2a538f9bb609cc"}],"/@inline/index.html/40766.css":[{"owner":"shared/common","part":"p04613eb3dbfb31db45f5"},{"owner":"pages/home","part":"pd9f035ba25fab15d4ff2"},{"owner":"shared/agent-content","part":"pc78bd8c94c7df5d9ae00"}],"/@inline/index.html/41545.css":[{"owner":"pages/home","part":"pb122d0406187055d3f85"}],"/@inline/index.html/42237.css":[{"owner":"pages/product-detail","part":"p4b17936f427c49379ca2"}],"/@inline/index.html/80021.css":[{"owner":"pages/product-detail","part":"p921f3d9377ff2ca7f74b"}],"/@inline/shop-chat/index.html/7871.css":[{"owner":"pages/member-center","part":"p794c04dd3262cfffd783"}],"/@inline/shop-chat/index.html/8167.css":[{"owner":"pages/consumer-home","part":"p598489bb7c1846950485"}],"/@inline/shop-chat/index.html/18395.css":[{"owner":"pages/product-detail","part":"p78767597077367b94c23"}],"/@inline/shop-chat/index.html/18957.css":[{"owner":"pages/product-detail","part":"p6482f3647e30141d7a8f"}],"/@inline/shop-chat/index.html/19551.css":[{"owner":"pages/member-center","part":"p3da78b8372ddaa302abb"}],"/@inline/shop-chat/index.html/19804.css":[{"owner":"pages/consumer-home","part":"p05b6f2346f6a385493e1"}],"/@inline/shop-chat/index.html/20409.css":[{"owner":"pages/consumer-home","part":"pd74db50917cd88516f0d"}],"/@inline/shop-chat/index.html/20911.css":[{"owner":"shared/agent-content","part":"p1ba606105d5a00d7085b"}],"/@inline/shop-chat/index.html/21230.css":[{"owner":"modals/product-match","part":"pf26202f540ad0dc4f752"}],"/@inline/shop-chat/index.html/24042.css":[{"owner":"modals/product-match","part":"p0010ce2a538f9bb609cc"}],"/@inline/shop-chat/index.html/24270.css":[{"owner":"shared/common","part":"p04613eb3dbfb31db45f5"},{"owner":"pages/consumer-home","part":"pf9a7cd84c07e976c0f1e"},{"owner":"shared/agent-content","part":"pc78bd8c94c7df5d9ae00"}],"/@inline/shop-chat/index.html/25049.css":[{"owner":"pages/consumer-home","part":"p78871aeb54618d6ae5aa"}],"/@inline/shop-chat/index.html/25741.css":[{"owner":"pages/product-detail","part":"p4b17936f427c49379ca2"}],"/@script-style/bcfd70201473272b2917ec65.css":[{"owner":"pages/enterprise-home","part":"pb3d96cfd5a8c92e2deae"},{"owner":"shared/agent-content","part":"pd8271a475c748fe86de4"},{"owner":"pages/enterprise-home","part":"pf4cdb5b8b50ad2640011"},{"owner":"modals/workplace-auth","part":"p7f6c4578945ae5f92308"},{"owner":"pages/enterprise-home","part":"p4ac853cad0c101ab20fa"}],"/@script-style/6c4be8f040e19da93cda0166.css":[{"owner":"pages/enterprise-home","part":"pe471aaf7b7ca58a665e5"},{"owner":"modals/order-payment-confirm","part":"p3ccdc436b0c218aa493d"},{"owner":"pages/enterprise-home","part":"p6404867492637e0ee8a7"},{"owner":"modals/payment-processing","part":"pd95b025cab0010aa55f1"},{"owner":"shared/common","part":"pd02dd2f79e036d6b2875"}],"/@script-style/d12ea632c37e5196133694ce.css":[{"owner":"modals/login","part":"paffc74723189c5307833"},{"owner":"modals/register","part":"pacc400aa321c4f479197"},{"owner":"modals/login","part":"pa3bd96ae61edc513c1df"}],"/@script-style/7412ed6bea845ad172cd8911.css":[{"owner":"pages/enterprise-home","part":"p6da05ab07dcc462ad62b"},{"owner":"shared/agent-content","part":"p5b3ceeab73f82cfd7902"},{"owner":"pages/enterprise-home","part":"p547b97459181f4a418f1"},{"owner":"shared/agent-content","part":"p24f4c071ebdff8d91160"}],"/@script-style/be4db110f19218da6cf55af3.css":[{"owner":"pages/enterprise-home","part":"p713185d78c792a02a14e"}],"/@script-style/15f3412fa14d1b9db69b15a1.css":[{"owner":"pages/product-list","part":"p7a1d9aa933f02b296828"}],"/@script-style/4fd209db9c845d79e6004da4.css":[{"owner":"shared/agent-content","part":"pc51c2c888674c2055a92"}],"/@script-style/585f25a91fce02fa42c317c6.css":[{"owner":"pages/solution-detail","part":"p9b31e06606ae39640860"}],"/@script-style/a52125fe48f3347b54369553.css":[{"owner":"pages/product-compare","part":"p43f133e671a005417f60"}],"/@script-style/bc996a90079bce8cb42db530.css":[{"owner":"pages/brand-home","part":"pbc3d8f975fef28cc565b"},{"owner":"shared/agent-content","part":"pd8271a475c748fe86de4"},{"owner":"pages/brand-home","part":"p0e4add09bca5ef17a49b"},{"owner":"modals/workplace-auth","part":"p7f6c4578945ae5f92308"},{"owner":"pages/brand-home","part":"p099fb95a6c0aadcbc535"}],"/@script-style/4269bcea22597b68efb9f026.css":[{"owner":"pages/brand-home","part":"p70b3b47f6a6be9c0e46c"},{"owner":"modals/order-payment-confirm","part":"p3ccdc436b0c218aa493d"},{"owner":"pages/brand-home","part":"pc5cf0d201a1d9bafd610"},{"owner":"modals/payment-processing","part":"pd95b025cab0010aa55f1"},{"owner":"shared/common","part":"pd02dd2f79e036d6b2875"}],"/@script-style/358b7537064e30d8f84aef6b.css":[{"owner":"modals/login","part":"paffc74723189c5307833"},{"owner":"modals/register","part":"pacc400aa321c4f479197"},{"owner":"modals/login","part":"pa3bd96ae61edc513c1df"}],"/@script-style/ba3c41a4ae7cdb58bc61828f.css":[{"owner":"pages/brand-home","part":"p3055e0c414b8f612c9f0"},{"owner":"shared/agent-content","part":"p5b3ceeab73f82cfd7902"},{"owner":"pages/brand-home","part":"pe0d1b8e72436b13ddda1"},{"owner":"shared/agent-content","part":"p24f4c071ebdff8d91160"}],"/@script-style/09efb5e0d515d801150ddd2e.css":[{"owner":"pages/brand-home","part":"p9130cf34cf9eea9d163d"}],"/@script-style/250f475bf7ccbac25eadf714.css":[{"owner":"shared/common","part":"pd84dc58ae4731bf18fff"},{"owner":"pages/solution-list","part":"pf7a64528204ea377d9f1"},{"owner":"pages/product-detail","part":"p36b0e9d2b4cbaa9ee0fb"},{"owner":"pages/solution-list","part":"pb8e043d443ac3ef5775e"},{"owner":"shared/agent-content","part":"pf30a5e2b38c476c3dcc9"}],"/@script-style/5b005de43434f719f5250325.css":[{"owner":"modals/lead-form","part":"pcfa94f022fda651ed9f5"},{"owner":"modals/login","part":"p71966477116c281aaa52"},{"owner":"modals/lead-form","part":"p5e37376a6078c58e9ad3"}],"/@script-style/ef2a484a234eb8c98fd55f97.css":[{"owner":"shared/agent-content","part":"p99ba49971bce1f4b8550"}],"/@script-style/0119c1f6c10af24d9e67343b.css":[{"owner":"pages/home","part":"pc3227de4bdd3c581aec9"},{"owner":"shared/agent-content","part":"pd8271a475c748fe86de4"},{"owner":"pages/home","part":"pda4854698427e4fdeaec"},{"owner":"modals/workplace-auth","part":"p7f6c4578945ae5f92308"},{"owner":"pages/home","part":"p620710aad3042a102418"}],"/@script-style/855cce78d66aa2ab84122bf6.css":[{"owner":"pages/home","part":"p510b9357abf64e4d8eb5"},{"owner":"modals/order-payment-confirm","part":"p3ccdc436b0c218aa493d"},{"owner":"pages/home","part":"p1eba28c7fbde230b83fc"},{"owner":"modals/payment-processing","part":"pd95b025cab0010aa55f1"},{"owner":"shared/common","part":"pd02dd2f79e036d6b2875"}],"/@script-style/d4c6ccd877d298f57ed49e31.css":[{"owner":"modals/login","part":"paffc74723189c5307833"},{"owner":"modals/register","part":"pacc400aa321c4f479197"},{"owner":"modals/login","part":"pa3bd96ae61edc513c1df"}],"/@script-style/aff9f385b05021219cf696d1.css":[{"owner":"pages/home","part":"p0c497912b10df0d432a4"},{"owner":"shared/agent-content","part":"p5b3ceeab73f82cfd7902"},{"owner":"pages/home","part":"p2986757048c8fe102981"},{"owner":"shared/agent-content","part":"p24f4c071ebdff8d91160"}],"/@script-style/5354c6abd156176d19f7e7b6.css":[{"owner":"pages/home","part":"p875a2d5bd02713da08d8"}],"/@script-style/8e9c2fb15aa227b2fcac7e06.css":[{"owner":"modals/order-payment-confirm","part":"pc9c4e996673991afea3e"}],"/@script-style/80d6cc6e273850a09d77f504.css":[{"owner":"modals/order-payment-confirm","part":"p30a7bb1bf7fe908dfe81"}],"/@script-style/0b77ab3eb520cd86ac138e4f.css":[{"owner":"modals/configuration-edit","part":"p2806c79e3aa096b08742"},{"owner":"modals/order-payment-confirm","part":"p0b1de472a3ac2cb82d97"},{"owner":"shared/common","part":"p45863997daa5b14e80c4"}],"/@script-style/fc527e3797f80c6d61b20d86.css":[{"owner":"modals/payment-processing","part":"p8c2e543c067894efd576"}],"/@script-style/2419c0245975cfd45f5134f8.css":[{"owner":"pages/order-list","part":"p90bb63718fc5680c1473"}],"/@script-style/afa02ca5b71c2ea384130a6a.css":[{"owner":"modals/order-payment-confirm","part":"pefd1b32c624d1d71aae9"},{"owner":"pages/coupon-center","part":"pc25ac919286ce5f1a5c5"},{"owner":"modals/order-payment-confirm","part":"pa9e7a51904fb9a43d95b"},{"owner":"pages/coupon-center","part":"p191a82961341d730b5f3"},{"owner":"modals/order-payment-confirm","part":"pc044011cbf1b1034c5e4"},{"owner":"modals/invoice-edit","part":"p1591dd09546674ead475"},{"owner":"modals/order-edit","part":"p1c343c975d1287f936a4"},{"owner":"shared/common","part":"pe71c5650c7c719f3bdd5"}],"/@script-style/d8e015cf967f795d342f57cf.css":[{"owner":"modals/order-payment-confirm","part":"p8fe0661e96dbbc75b56d"}],"/@script-style/71127f896ad1058afb3416e8.css":[{"owner":"modals/order-payment-confirm","part":"pacef15749e770215bfd3"},{"owner":"modals/payment-success","part":"p807ebed211012d753669"}],"/@script-style/9c81010d08d6b4723521eb7a.css":[{"owner":"modals/order-payment-confirm","part":"p627385557fe18880184e"},{"owner":"modals/configuration-edit","part":"p457191f4bac09866688f"},{"owner":"modals/order-payment-confirm","part":"p5dafb7108cb28dcff669"}],"/@script-style/3001561f396ce35a0ecb01b8.css":[{"owner":"shared/common","part":"p4309f190fe28ee9f0f0c"},{"owner":"modals/order-payment-confirm","part":"p8b62c263909d2212d92e"},{"owner":"shared/common","part":"pd2fe54f11c4fad3959c6"},{"owner":"modals/order-payment-confirm","part":"p14c9536029fb7cc4a1a0"},{"owner":"shared/common","part":"p4762a37145bd5d029f7e"},{"owner":"modals/order-payment-confirm","part":"p4931e71ceea6738162a2"},{"owner":"pages/coupon-center","part":"pcffdd6fecbd8055a59bd"},{"owner":"modals/order-payment-confirm","part":"p6f9e51bbc966f2bdb612"}],"/@script-style/8c23758e65c9a254b3cfb0ad.css":[{"owner":"modals/order-edit","part":"p8d60bafc12cf1a297a82"},{"owner":"modals/order-payment-confirm","part":"p066d1e90f21162e6e08b"},{"owner":"modals/order-edit","part":"pb5e2600cb32f144a6c99"},{"owner":"modals/order-payment-confirm","part":"p2828b30ee1e2d54f589d"},{"owner":"modals/invoice-edit","part":"pc254329d56c01a10256f"},{"owner":"modals/order-edit","part":"p03d03ed3aca7342234c3"},{"owner":"shared/common","part":"pd0893dee78ca295e7e1f"}],"/@script-style/09b0f98ed869eca9c7ccec19.css":[{"owner":"modals/order-payment-confirm","part":"p7c43ba15ccd0c3ff70d8"},{"owner":"modals/order-edit","part":"p4b1ce6fcf28e74085f08"},{"owner":"shared/common","part":"pbeb1f75d5e4703486248"},{"owner":"modals/order-edit","part":"paa8b7f12396e3ddb4a35"}],"/@script-style/7742932f39b2594ea542aad6.css":[{"owner":"modals/order-edit","part":"p127cc4efdcebe5380499"},{"owner":"modals/order-payment-confirm","part":"p88942eafbeb726b41839"},{"owner":"modals/order-edit","part":"p9b43a73c9f20b6074626"},{"owner":"modals/order-payment-confirm","part":"pdd08790e0492cb9d9400"},{"owner":"modals/order-edit","part":"peffe7a6323c77931762e"},{"owner":"modals/order-payment-confirm","part":"pf0a375f3eecf846af0a3"}],"/@script-style/5eab199889e33e1c7bd2080c.css":[{"owner":"modals/order-edit","part":"p4384762d095db5951d40"},{"owner":"modals/order-payment-confirm","part":"pb703be2504a21c356cb4"}],"/@script-style/0d931860717e4e58ad2d5314.css":[{"owner":"shared/common","part":"pb207911bc82441c90fc0"}],"/@script-style/fd01bbc30befcc1619d21b8e.css":[{"owner":"modals/order-payment-confirm","part":"p9f7f228dea93bdb0dd88"}],"/@script-style/156e3d2657d77015a8ab44c0.css":[{"owner":"modals/order-payment-confirm","part":"p509febc0f19b03a001ef"}],"/@script-style/6a306911c98842326779deb7.css":[{"owner":"modals/order-payment-confirm","part":"p6d6aba484bb1929b7c15"}],"/@script-style/7f760958ebcbcf7a4adcbb74.css":[{"owner":"modals/order-edit","part":"p6212d7e0bbf78ffd5b3b"},{"owner":"modals/order-payment-confirm","part":"p4d2b4aa0af3d764b74c3"}],"/@script-style/012a6b2dbdd58b38db523741.css":[{"owner":"modals/order-payment-confirm","part":"p4181000abcab4099e3c2"},{"owner":"modals/configuration-edit","part":"pe13cc8b040779219ac00"}],"/@script-style/41cc5e357ec5a055d9c85ef3.css":[{"owner":"modals/order-payment-confirm","part":"pbc8097454f0654a21f3c"}],"/@script-style/7c78b09ff13169f4cef345cc.css":[{"owner":"modals/toast","part":"p8bf1731d07fcfc1c1711"}],"/@script-style/5cdabca2f5ba95cf6d7af105.css":[{"owner":"modals/order-payment-confirm","part":"p3d083d62a51afb33942c"},{"owner":"modals/order-edit","part":"p30d6d535d07c61ef252e"},{"owner":"modals/invoice-edit","part":"p4d2f03049372185a77fa"}],"/@script-style/3ec85ad103da7d1fb4a8b30f.css":[{"owner":"modals/order-payment-confirm","part":"p4bf4752f7d3a2ca896e4"},{"owner":"modals/order-edit","part":"p8ade5c04790d9e07178e"}],"/@script-style/c31e4ef11eb0c7e521a3712d.css":[{"owner":"modals/order-payment-confirm","part":"p0a94b4e652e754a3b2ce"}],"/@script-style/ffbe2f48e2cab09318126629.css":[{"owner":"modals/order-edit","part":"pedfa414084de2d0bbf29"}],"/@script-style/0e2a0b412f5257415d42cd9d.css":[{"owner":"modals/order-edit","part":"pbe93d0577712cb09d07c"},{"owner":"modals/configuration-edit","part":"pf4f99fb28b6119b7abbd"}],"/@script-style/061465e452d4a8aaa9479e85.css":[{"owner":"modals/order-payment-confirm","part":"pf8ea8c9d95608b4d85c2"}],"/@script-style/9aa442dbc5cc93ec42f27101.css":[{"owner":"modals/configuration-edit","part":"p97f34d76d08142e44039"},{"owner":"modals/order-payment-confirm","part":"p01f99df098cd75ff0131"}],"/@script-style/20bb671d34ef1de1bed728c3.css":[{"owner":"modals/order-payment-confirm","part":"p13e785bf0bd37e5555cd"},{"owner":"modals/order-edit","part":"p3d32746e46696530b00b"}],"/@script-style/a7a7af065c5d3af0877442c5.css":[{"owner":"modals/order-edit","part":"pbeb49c92ea8e76d2784a"},{"owner":"modals/order-payment-confirm","part":"p908f149a962597cf923f"}],"/@script-style/17ce92b58432eb8135a40038.css":[{"owner":"shared/common","part":"pc791e90c072f9c5793f6"}],"/@script-style/7255576d38d2d859ce96df6d.css":[{"owner":"modals/order-payment-confirm","part":"p3e343bdc6346faac7458"}],"/@script-style/5f2307a1e3f51d08429eb47f.css":[{"owner":"modals/order-edit","part":"p46637f0745d25cb021d5"},{"owner":"modals/order-payment-confirm","part":"p70bcf58730387825dce7"},{"owner":"modals/order-edit","part":"pcd6746c858d35416a50f"}],"/@script-style/025506a3bb8ddbc79b0ee95c.css":[{"owner":"modals/order-edit","part":"p8e450948f76123054624"}],"/@script-style/7d90e7e0db646f6c59e297bf.css":[{"owner":"modals/order-edit","part":"pe2c2635e5b1aee3cc11f"},{"owner":"modals/order-payment-confirm","part":"p85e46252fcf7b436a833"}],"/@script-style/419f5d55bcceb3bd7d8f7fef.css":[{"owner":"modals/order-edit","part":"p1c56cccfe0082c2580b4"}],"/@script-style/58d6ec0d3e016a46228d6479.css":[{"owner":"modals/order-payment-confirm","part":"p6d113aa8fd734ce984ca"}],"/@script-style/6059e6afb1be00d26838cfd5.css":[{"owner":"modals/payment-success","part":"p5787517ef34a4b605546"}],"/@script-style/fe152295dfde3bd6a438ffcf.css":[{"owner":"modals/order-edit","part":"p4f7195d53040fb66a6e2"}],"/@script-style/e8f67f1625136eaaf23fc924.css":[{"owner":"modals/order-edit","part":"pedaf51b227b4cee43a96"}],"/@script-style/739c3b267846c4298d70faba.css":[{"owner":"modals/order-edit","part":"pc59d6199214b7218fe2a"}],"/@script-style/5b89db8016c92a99246accaa.css":[{"owner":"modals/order-edit","part":"p39b3cfac904f18edb397"},{"owner":"modals/order-payment-confirm","part":"p17f882340da0e120083e"}],"/@script-style/c1afda81d2411d1ca14623ef.css":[{"owner":"modals/order-edit","part":"p8ec2f0b90129ed250625"},{"owner":"modals/configuration-edit","part":"p3869dd38a7e82c077468"},{"owner":"modals/order-edit","part":"pf27cb211834c57207c36"},{"owner":"shared/common","part":"p48eebe393fc309c0fd93"}],"/@script-style/16dd96c0a6f587c7e4b5ee7f.css":[{"owner":"modals/order-edit","part":"p49820f5733ee1cd86e41"}],"/@script-style/ab755601b3abed1078e9adb7.css":[{"owner":"modals/order-payment-confirm","part":"pbb693477a93cc969dd1d"}],"/@script-style/b6df2307291df3b4cbc4ae17.css":[{"owner":"modals/order-payment-confirm","part":"p168b71cb394e0e151555"}],"/@script-style/15774b4ae2eec07c2288fc7e.css":[{"owner":"modals/order-edit","part":"p6d6121082c6392e597f3"},{"owner":"modals/order-payment-confirm","part":"pdab6f1f518d709694c88"}],"/@script-style/725b3e1a75d7e23b95ec4946.css":[{"owner":"modals/order-edit","part":"pb536a407104561aab886"}],"/@script-style/c7169d596e00f299b971429a.css":[{"owner":"modals/order-payment-confirm","part":"pec833631299298043f53"}],"/@script-style/685c0dd1bdbf4bb28b9d64bf.css":[{"owner":"shared/common","part":"p1b19c2757d07b4a79940"},{"owner":"modals/configuration-edit","part":"pdccec82e0ef9be492f90"}],"/@script-style/94a69d2fd397ef35eb5fa309.css":[{"owner":"modals/configuration-edit","part":"p355468c8353089d07f57"}],"/@script-style/2ad6dc66d390677061f26194.css":[{"owner":"modals/order-edit","part":"p9aab31ef74ca8fb058d8"},{"owner":"modals/configuration-edit","part":"pa993f44ea5d4b5c34256"},{"owner":"shared/common","part":"p1f5f4d734422809ad8e2"},{"owner":"modals/configuration-edit","part":"p515a6de3b43280ca7752"}],"/@script-style/6a4e429b1649183b40cc9e49.css":[{"owner":"modals/configuration-edit","part":"pdb8c0c8318130f07c5d3"}],"/@script-style/fb73d90bc5bd966b628e2533.css":[{"owner":"modals/order-payment-confirm","part":"p8c5f6472d11518859bf2"}],"/@script-style/087f3f85089896ae4f8333a5.css":[{"owner":"modals/invoice-edit","part":"p1c6f210656fdd2e9c289"}],"/@script-style/98a9da121bcb1fa121ce0b07.css":[{"owner":"modals/order-edit","part":"pc44d55113acdbeb2e299"},{"owner":"modals/order-payment-confirm","part":"p39031887431ab3922f4d"}],"/@script-style/a4253da7da4958cbd9d84f24.css":[{"owner":"modals/order-payment-confirm","part":"p87f8b5f149a625bdcd1c"},{"owner":"shared/common","part":"p5134c666f7720a3dced1"},{"owner":"modals/configuration-edit","part":"pfae8ba6ab5c2f6a821e8"}],"/@script-style/f7caad1be1feb58766b865f6.css":[{"owner":"modals/order-payment-confirm","part":"pa6b0f39e8fdf4de404ae"}],"/@script-style/17de49d66714fc2781d9be26.css":[{"owner":"modals/configuration-edit","part":"p1f2ac2606b083a50f5e1"},{"owner":"modals/invoice-edit","part":"pd49844815556498eae95"},{"owner":"modals/configuration-edit","part":"p6e14f1b8cc69a08ba07b"}],"/@script-style/1f678ed1490de7a2eb68c323.css":[{"owner":"modals/configuration-edit","part":"pea41bf815f03cb59d7cc"}],"/@script-style/c13452f6b462f919753dba2e.css":[{"owner":"modals/configuration-edit","part":"paff71ced7eca23ead104"},{"owner":"modals/invoice-edit","part":"p04d2f9daaea23b932790"}],"/@script-style/6a26b2a0cf99f8d20c52ee8d.css":[{"owner":"modals/configuration-edit","part":"p62cbebe4fc09dc00ba5c"}],"/@script-style/a69d4ff0fcf18ab1f43008a4.css":[{"owner":"modals/configuration-edit","part":"pa1e4c06148e541e50918"},{"owner":"modals/order-edit","part":"pbd6efc3fe33a0cdf09c4"},{"owner":"shared/common","part":"p4022cfa198967f396838"}],"/@script-style/92669f197f5a1f6b8a8525e7.css":[{"owner":"modals/order-payment-confirm","part":"pb8e27d65d71b2a4b16c7"}],"/@script-style/1f66fce7c5b6366b1add7751.css":[{"owner":"modals/order-payment-confirm","part":"p120332c73452c8e28934"}],"/@script-style/6977494f0b0fecbc3ee89224.css":[{"owner":"modals/configuration-edit","part":"pa46e9da0fbe27668240d"},{"owner":"shared/common","part":"p00b62d8458a654cd9d3a"},{"owner":"modals/configuration-edit","part":"pcb718d4bfb58b42c7009"},{"owner":"modals/invoice-edit","part":"pa16ab170967040b3eff0"}],"/@script-style/11350e01589075d773110a47.css":[{"owner":"modals/order-edit","part":"pf2f0b261f2b8433cfd42"}],"/@script-style/2eb672ae8f13f409749f71ad.css":[{"owner":"modals/order-edit","part":"pf272cf67d5362cdb1d6b"}],"/@script-style/fdcdd745ad452456cddfe145.css":[{"owner":"modals/configuration-edit","part":"p85018a4960964031dcb0"}],"/@script-style/b3963f98f9822c8d45d89af9.css":[{"owner":"modals/configuration-edit","part":"p9b2505deb22808da1369"}],"/@script-style/ddc4038015428a41109f38a5.css":[{"owner":"modals/order-edit","part":"p46b7e3e722fc2325b839"}],"/@script-style/f9c947886b11d23aebf73431.css":[{"owner":"modals/configuration-edit","part":"p6312d474c7cec97eb10d"}],"/@script-style/06127cab96934bd36aa99e0b.css":[{"owner":"modals/order-edit","part":"pe8f925dd726e68528869"}],"/@script-style/4960510781be0070d11bac57.css":[{"owner":"modals/order-edit","part":"p585531cb172db3908f1e"}],"/@script-style/59e953e1a163bafa87fecd88.css":[{"owner":"modals/order-edit","part":"p01203e22af95244f5a96"},{"owner":"modals/configuration-edit","part":"p22b3494e908c715ea596"},{"owner":"modals/order-edit","part":"pda6162fc2f1a5b4377c1"}],"/@script-style/f3e9581c683554bafa8465a6.css":[{"owner":"modals/order-edit","part":"pd317c1b06be50933a84a"}],"/@script-style/a7d7259d921cda6ac349fb99.css":[{"owner":"modals/order-edit","part":"pe5979a352e4b048672da"}],"/@script-style/511b62247c7c426b268d91d3.css":[{"owner":"modals/order-edit","part":"p2a5c12576a8579037ff2"}],"/@script-style/3dd16cf10f973be483577b6f.css":[{"owner":"modals/order-edit","part":"p7e04c4d19ab6f0b6649b"}],"/@script-style/4c5d702d0db22482d1804809.css":[{"owner":"modals/order-edit","part":"pb56e249375726577cd86"},{"owner":"modals/configuration-edit","part":"p57988df668063ae54caa"},{"owner":"modals/order-edit","part":"pb19f2144796fa7f57c56"}],"/@script-style/c6f49b6c7116aa5fc1d15f4b.css":[{"owner":"modals/order-edit","part":"pe1b7585ae05ba4b1723a"}],"/@script-style/4d9d4e2fda719fa2d0a4b336.css":[{"owner":"modals/order-edit","part":"p6b45d16804121975e4e9"}],"/@script-style/06aababcb965edc1b28e6838.css":[{"owner":"modals/order-edit","part":"p53b5c8c8846e0a1f3bc4"},{"owner":"modals/configuration-edit","part":"p925ffcf4d2f55a49a2c4"}],"/@script-style/f152c51b79b5d7d715233223.css":[{"owner":"modals/order-edit","part":"p4696179e4234356aa498"}],"/@script-style/3a0ed7f6c9cf221c2b9f6e3c.css":[{"owner":"modals/order-edit","part":"p6c50623254ab118f8fb5"}],"/@script-style/94ad4ac4e5aa0f2f1e4d9b4e.css":[{"owner":"modals/order-edit","part":"p9a532b2e6bef991a837b"}],"/@script-style/a728197bdba742c0b1704570.css":[{"owner":"modals/order-edit","part":"p962cad12080af9d5d266"}],"/@script-style/f7de2989dcae46e5dbcafe1c.css":[{"owner":"modals/order-edit","part":"pce0a0244016bc303881f"}],"/@script-style/4d945b2943c76907cde0e361.css":[{"owner":"modals/order-payment-confirm","part":"pa29ff68a60e817772d37"}],"/@script-style/49fe044e4e5ccd1a71742fb4.css":[{"owner":"modals/order-edit","part":"pa3e7314ff8f723312bf8"}],"/@script-style/05dc592fe784470a5cf9e394.css":[{"owner":"modals/order-edit","part":"p706afceed6829e86a98c"},{"owner":"modals/order-payment-confirm","part":"pd165f4194d0e1634fcec"}],"/@script-style/b7d9ba724aefde42e176f4d0.css":[{"owner":"modals/order-edit","part":"p9d50bb6d7b1fa8c882f5"}],"/@script-style/f816d4ff4359d8b04d840c23.css":[{"owner":"modals/invoice-edit","part":"p3d9fc657cf2bf8435c70"}],"/@script-style/975e5d8151ca1ff70b9e1fdc.css":[{"owner":"modals/invoice-edit","part":"p3c3d3b2620ab7d5c772c"}],"/@script-style/e30b9df65506fa19157d3939.css":[{"owner":"pages/coupon-center","part":"pdd571f5ea45b365fc1e0"}],"/@script-style/7a552c8d987425aa04ca00bb.css":[{"owner":"modals/configuration-edit","part":"pac24f1e90ab1766a0a65"}],"/@script-style/d3571eb1d316541a67ee9b0b.css":[{"owner":"modals/order-edit","part":"pedfea92cfaae8249b3e1"}],"/@script-style/37da2b31398df96578849a24.css":[{"owner":"modals/order-edit","part":"p336dc1130bcf02f26429"}],"/@script-style/2f840399765f496b986ff07b.css":[{"owner":"modals/order-edit","part":"p3702bfb2fd4e942a84f6"}],"/@script-style/648bd99a6a348d901282b806.css":[{"owner":"modals/order-edit","part":"p1407bcfe92ccb09e54f9"}],"/@script-style/59b588c9bb4ccdf904dc0114.css":[{"owner":"shared/common","part":"pbf8d01c5eced0837b06b"},{"owner":"modals/order-edit","part":"pcdf4c2063281329d77de"}],"/@script-style/ba10470287bd93634e59820a.css":[{"owner":"modals/order-edit","part":"p6bfb7330ee852edcd404"},{"owner":"shared/common","part":"p075eba19b1dc12f4f89b"}],"/@script-style/0c3ab070fb69cbdfaefcb5d1.css":[{"owner":"modals/order-edit","part":"pc74634a21bbec18595cc"}],"/@script-style/fa4507372ff154c13635376d.css":[{"owner":"modals/order-edit","part":"p2829045ec94e4c797083"}],"/@script-style/be4e41839ea7f53b6b1b1b37.css":[{"owner":"modals/order-edit","part":"pb741335d69647e52925d"}],"/@script-style/df570e4566d4ec4f1f9c3ad6.css":[{"owner":"modals/order-edit","part":"p12b098fc1de7156777c5"}],"/@script-style/4a24200a3a2089f0626d24a2.css":[{"owner":"modals/order-edit","part":"p034444d3678e1685e84f"}],"/@script-style/16eb6364932d3cdce52c60c2.css":[{"owner":"modals/order-edit","part":"pb907810b1152e0b5dfab"}],"/@script-style/c2143a3ad34e592fe414d04a.css":[{"owner":"modals/order-edit","part":"p03ab9526047a6ed12275"}],"/@script-style/3222ef851c0805fd27af82a2.css":[{"owner":"modals/order-edit","part":"p036ab3c4809022f1192d"}],"/@script-style/41a1d61a4d05ea6fb45697b8.css":[{"owner":"modals/order-edit","part":"p6971c438bdec1c1f003e"}],"/@script-style/72d0ecf558e2ead36d36c4ac.css":[{"owner":"modals/order-edit","part":"pb13426b3d6ea819b3a62"}],"/@script-style/7a095e819201078083bd1221.css":[{"owner":"modals/order-edit","part":"p5b1ffa3730d419e9a899"}],"/@script-style/af0e31accb3c4b2f5f24a2cf.css":[{"owner":"modals/order-edit","part":"pf18fe2f8a0c539765647"}],"/@script-style/4d238d617eee9238738bac90.css":[{"owner":"modals/order-edit","part":"pb137fff72cdc54cc1667"}],"/@script-style/df680ee3a2f7113171bf64e0.css":[{"owner":"modals/order-edit","part":"p79299e393cff3ff8bc6d"}],"/@script-style/1293ad11bc360864927becaa.css":[{"owner":"modals/configuration-edit","part":"p709bc013c6e5e80a9f52"}],"/@script-style/9b2fb43a52aa2298763afb27.css":[{"owner":"modals/order-edit","part":"p97e82c96b84a6a074bfa"}],"/@script-style/8338bdb599dfcb0150b99468.css":[{"owner":"shared/common","part":"pe321bcbb64f345fd94d3"}],"/@script-style/855731fc62b69b6593ded9ff.css":[{"owner":"modals/order-edit","part":"p10cca26b2407c03e8be5"}],"/@script-style/d32d1ee37f104cc4688388a2.css":[{"owner":"modals/order-edit","part":"pfd67ad90fba394777b69"}],"/@script-style/fbf3268ba403ae1c0b25d0f5.css":[{"owner":"modals/order-edit","part":"pe43d8ab4746704074305"}],"/@script-style/19a848429ee7910675e780ea.css":[{"owner":"modals/order-edit","part":"pafcb6960269a14ec9c9e"}],"/@script-style/cb9348dcd8726bc66b66ada8.css":[{"owner":"modals/configuration-edit","part":"p888332dbee7cdaa8abfe"}],"/@script-style/8eebfe04270ba2af6cd98282.css":[{"owner":"modals/order-edit","part":"p0bcfd0800ca3eb272d71"}],"/@script-style/e0f6e681aef45ffedb78aa5b.css":[{"owner":"modals/configuration-edit","part":"p273be7833ac579e7174b"}],"/@script-style/c72286284209f42dccadd144.css":[{"owner":"modals/order-edit","part":"p0bd41ef48772b406db01"}],"/@script-style/5023bd756c7f1e6ec2e0bb26.css":[{"owner":"modals/order-edit","part":"p7d2e84c36cbdb7f58faf"}],"/@script-style/6acdf0f35d44bacfb4274484.css":[{"owner":"modals/order-edit","part":"pf289d05f0f25ad8972e9"}],"/@script-style/130aad2a232d43995a441e18.css":[{"owner":"modals/order-edit","part":"p1cba50614743e0e14872"}],"/@script-style/0d5aefcac9ea1b4ab07c0e59.css":[{"owner":"modals/configuration-edit","part":"p5e1fe7e84ca4809ab07e"}],"/@script-style/b060aaa3dc0cdd26067b0eb9.css":[{"owner":"modals/configuration-edit","part":"p4e24ce43c21932c8066a"},{"owner":"modals/order-edit","part":"p1cfc4c38b4ef6b3e67b0"}],"/@script-style/38c4bf2b0d6ef9f2e88cbf24.css":[{"owner":"modals/invoice-edit","part":"pf490d20974932060b7e5"}],"/@script-style/8a7ba67693d4a339852f0474.css":[{"owner":"modals/configuration-edit","part":"p0ce295b305e1c41aa292"}],"/@script-style/3279527e0065fcb667d3660e.css":[{"owner":"modals/invoice-edit","part":"p54568890a5773cd70f87"},{"owner":"modals/order-edit","part":"pb2aa60be2970fd067d89"},{"owner":"modals/invoice-edit","part":"p4a0fe0a771443f4f1d16"}],"/@script-style/d12e479d1055ee45d932ca41.css":[{"owner":"modals/configuration-edit","part":"pa995e854307deeb3636b"}],"/@script-style/5df1a4901f3b1314ba3501ac.css":[{"owner":"modals/order-edit","part":"pf4183c26edb194b7130d"}],"/@script-style/5cc21e1b2dad4f817fd72704.css":[{"owner":"shared/common","part":"p5de1954129453b88186f"}],"/@script-style/fda6413de6852d67ac045fc2.css":[{"owner":"modals/order-edit","part":"pf04dfd5f1c06d6e8c24d"}],"/@script-style/f186de5f04d19d324dacc42f.css":[{"owner":"modals/order-edit","part":"p1ee15c5c76e69f0c083e"}],"/@script-style/5d62955b013571f9dc73fefb.css":[{"owner":"modals/order-edit","part":"pe0be5494343788c339e2"}],"/@script-style/43e42ac7eafcda85d8a2dbd6.css":[{"owner":"modals/invoice-edit","part":"p3fd666a5428790e48456"},{"owner":"modals/order-edit","part":"pa888a142c8c0f666ef6b"}],"/@script-style/f9a727b66639f1ea65a8c27e.css":[{"owner":"modals/order-edit","part":"p6a6d5dfef7eb02ae472c"}],"/@script-style/2995592f6c849cc574c0e3f5.css":[{"owner":"modals/configuration-edit","part":"p675d8e52e052016f0150"},{"owner":"shared/common","part":"pe90aba2409007252f186"},{"owner":"modals/invoice-edit","part":"p22dc5143264ab7adfbd4"}],"/@script-style/727c439b9a87cd9e4323b7e4.css":[{"owner":"modals/order-edit","part":"p800d1cf36f6d50415deb"}],"/@script-style/218a2fe0cb44ebcda396d39f.css":[{"owner":"modals/order-edit","part":"pffb4d93da3353b8ad6d6"}],"/@script-style/044cec88bc5c00449731ce09.css":[{"owner":"modals/configuration-edit","part":"pea23a3fd1a8d6ec7ecc2"},{"owner":"shared/common","part":"p0991ed19bd3c737e1ab6"}],"/@script-style/164c1b4abc31e49dce015070.css":[{"owner":"modals/configuration-edit","part":"pd8423bb2a93029b278f7"}],"/@script-style/57dffeff7c64e3d409ed6a7c.css":[{"owner":"modals/order-edit","part":"pda9613ca6fc4f10e8577"},{"owner":"modals/configuration-edit","part":"p7be4ad16b3a5ec55acf3"}],"/@script-style/fb569c5069aca5a2db4c9e39.css":[{"owner":"modals/order-edit","part":"p605384c332ea65e4e9db"},{"owner":"modals/configuration-edit","part":"p14b9848c3ee3ce1d2bb9"}],"/@script-style/83e397f4dffbd70f00dc8280.css":[{"owner":"modals/order-edit","part":"p0b47dc59ec35b6087bd8"},{"owner":"modals/configuration-edit","part":"pebafed2d0b9fa89d34dd"}],"/@script-style/8f2f44273fde8bf5743db014.css":[{"owner":"modals/configuration-edit","part":"p18ab05c557652acdd974"}],"/@script-style/5a2bc66b104c1d5bd25607d9.css":[{"owner":"modals/order-edit","part":"p1bac633aa287d53ee15d"}],"/@script-style/a4860353af2d6a05a264c26d.css":[{"owner":"modals/configuration-edit","part":"p04290a46801454d89a0d"}],"/@script-style/27360e4fbb61103d9fa41f9f.css":[{"owner":"modals/configuration-edit","part":"pb05451bee744d961bc21"}],"/@script-style/3a6a91271ce2cefdc89034cd.css":[{"owner":"modals/order-edit","part":"p2500e373f6aa6773dfcd"}],"/@script-style/ad13cb8b49a49bdb80e248cd.css":[{"owner":"modals/order-edit","part":"pca35d621b2f288973f11"}],"/@script-style/f5ce9f229e0b10ec2e70fcce.css":[{"owner":"modals/order-edit","part":"pa797bccb99e2673a177a"},{"owner":"modals/configuration-edit","part":"p9bd505204a8eefb03483"}],"/@script-style/a68b2ad5cb1776c921fc9d88.css":[{"owner":"modals/configuration-edit","part":"p78b40d2243d15261593c"},{"owner":"shared/common","part":"p339c21c7cd1abaa8e2ee"},{"owner":"modals/configuration-edit","part":"p1a3c06a9303ca08c24b0"},{"owner":"modals/invoice-edit","part":"p84e93f60259c1aef8e7f"},{"owner":"modals/configuration-edit","part":"p1cec015a7646ce6d5b8b"}],"/@script-style/3743aaf77b43f021c6860096.css":[{"owner":"modals/order-edit","part":"pe898cab2b7afbd3f0577"}],"/@script-style/aa3f20fdbb56b9df3a93d85c.css":[{"owner":"modals/order-edit","part":"pcc6b279ff4377846d38b"}],"/@script-style/a98b28489463b209dcf562ce.css":[{"owner":"modals/invoice-edit","part":"pde80cd7465536bc7c1db"}],"/@script-style/ec443d081fbe0c6d91e1be73.css":[{"owner":"shared/common","part":"p70e40116fa054160fef3"},{"owner":"modals/configuration-edit","part":"p4e4cf58a2cb6afde2c08"}],"/@script-style/3d1209661986366a54de5aeb.css":[{"owner":"modals/invoice-edit","part":"p48c2dba66eaad39070c9"},{"owner":"modals/configuration-edit","part":"p163bbc3be2914846e731"}],"/@script-style/f61959dd5966b5e78e9a204f.css":[{"owner":"modals/invoice-edit","part":"p2bf4d1f64836e60c2a07"},{"owner":"modals/configuration-edit","part":"p6d06834dcf811e7b8cec"}],"/@script-style/df3ba6a72562a3ae923ad36a.css":[{"owner":"modals/invoice-edit","part":"pda3d3c05cd85f49d25ed"}],"/@script-style/2554187d7901f9a84976d03d.css":[{"owner":"modals/configuration-edit","part":"p14ede4c2c2d2210d0103"}],"/@script-style/b6279a792f0ee195092546e4.css":[{"owner":"modals/invoice-edit","part":"pd8a7483152c13f1650da"}],"/@script-style/a09bbcc8c246a0def84089f5.css":[{"owner":"modals/invoice-edit","part":"p1c9735485ebb6ff80333"}],"/@script-style/c7260a88c962264039a9fa1d.css":[{"owner":"modals/configuration-edit","part":"pe9cdbe4af2346b5aaa84"},{"owner":"modals/order-edit","part":"p9a88ff23b694415242ac"}],"/@script-style/636960b461e4542511ed98d0.css":[{"owner":"modals/invoice-edit","part":"pae4e0d92cecb59da7e7d"},{"owner":"modals/order-payment-confirm","part":"p448790b25744f96681b6"},{"owner":"shared/common","part":"p3751c04570ea1f61ff56"}],"/@script-style/b6d2439b2538b853b7fc3ccd.css":[{"owner":"modals/order-edit","part":"pdae4908b180848b4f288"},{"owner":"modals/invoice-edit","part":"p31a65e2307b7acfc4ecb"}],"/@script-style/f92423914a76f206d3e52e49.css":[{"owner":"modals/configuration-edit","part":"p198d0c2c518c35935a60"},{"owner":"modals/order-edit","part":"p495bb1ba5d9a5b15d3bb"}],"/@script-style/ea33e1aa172f5d0e94562c03.css":[{"owner":"modals/order-edit","part":"pf7f1e326e22b3d9c45a4"},{"owner":"modals/order-payment-confirm","part":"pe0024dbb165cd9ce53fc"},{"owner":"modals/order-edit","part":"p5bbb831c310f5d4f6be3"},{"owner":"modals/order-payment-confirm","part":"p2c1846a1a6fbaa470a2b"},{"owner":"shared/common","part":"pc375222e33f217499a3d"}],"/@script-style/72bfff19d48d225d5c86f81b.css":[{"owner":"modals/order-edit","part":"p3e67cfbfeeb88ed1e9e0"},{"owner":"modals/order-payment-confirm","part":"p34832e0ea6dad516c846"}],"/@script-style/cbada9f6d23615b37f7aabe8.css":[{"owner":"modals/order-edit","part":"p784135edf074afff1af0"},{"owner":"modals/configuration-edit","part":"pc662c9a9c7260e227148"},{"owner":"modals/order-edit","part":"p561de9399385efadd8d7"}],"/@script-style/5b58409bb78234455ce9b7c3.css":[{"owner":"modals/order-edit","part":"p3e850846613ca74f26a4"}],"/@script-style/bc68dc6102447f2a7c9d5d3c.css":[{"owner":"modals/order-edit","part":"p12d507bcc82ceba42036"},{"owner":"modals/order-payment-confirm","part":"p54d6abe0f28e9ed695c7"}],"/@script-style/9318f530a4a0118dfb8d34da.css":[{"owner":"modals/order-edit","part":"p7c4e0e625a46470f5562"}],"/@script-style/0c3ff5ea509c44373c0c62db.css":[{"owner":"modals/invoice-edit","part":"pd36c38350099b0bea221"},{"owner":"modals/order-edit","part":"pa6f002a07f5d64a172d4"}],"/@script-style/b2bfced12cdca33f4af0a689.css":[{"owner":"shared/common","part":"pf13e82f397afa4a8012e"},{"owner":"modals/invoice-edit","part":"p419e1974e3d3f23ae731"}],"/@script-style/c26aa7b98b36ef2c4a639348.css":[{"owner":"modals/order-edit","part":"paca07c9f31588e2c2353"}],"/@script-style/70022385b8e749bbf7c048ae.css":[{"owner":"modals/order-edit","part":"pbde5d02157389b4eab9d"},{"owner":"modals/configuration-edit","part":"pbdd3386ff2e57f241408"}],"/@script-style/64654aca9c221d8314321578.css":[{"owner":"modals/configuration-edit","part":"pb766aeae133d51e1207d"},{"owner":"shared/common","part":"pd801fcbc42a1800600b3"}],"/@script-style/f3bfc1161456a3fb0b1a0d9b.css":[{"owner":"modals/payment-success","part":"p5c8300dae4197b427c42"}],"/@script-style/081b85b70410c7de4964e2fe.css":[{"owner":"modals/invoice-edit","part":"p93f64c4d9aa8135b3fdb"},{"owner":"shared/agent-content","part":"pdb93ba8d53ca2ebe53a3"},{"owner":"modals/order-payment-confirm","part":"p42e2c65669fca9c6f164"},{"owner":"modals/invoice-edit","part":"p2010c293d4997e27843d"}],"/@script-style/c0c08d10670d958be2822a6b.css":[{"owner":"modals/order-payment-confirm","part":"p8e12ba477165a1a71844"},{"owner":"shared/common","part":"p09a6dd09e3c7fc81462d"},{"owner":"modals/order-payment-confirm","part":"pe27e895de94bfa0677ab"},{"owner":"modals/order-edit","part":"pc39248a10b9e4fe3f7ed"},{"owner":"modals/order-payment-confirm","part":"p630890915598a218484e"},{"owner":"shared/common","part":"p57d500b6e3484e761946"},{"owner":"modals/invoice-edit","part":"pbf3c2cbdc7b93a79b1e1"},{"owner":"shared/common","part":"p02c9aecefdb6f7ade0d2"}],"/@script-style/598401a0c450f354368ef343.css":[{"owner":"modals/order-payment-confirm","part":"peeca280161f2e55c5d62"}],"/@script-style/270b376a919b136b31e8b810.css":[{"owner":"modals/order-payment-confirm","part":"pfba6a6a37538c0a9f56c"}],"/@script-style/75ff095e565a86d3becb8d66.css":[{"owner":"modals/order-payment-confirm","part":"p7e169f0097f4cc3103fa"},{"owner":"pages/order-detail","part":"p54f1e37901bcece362ca"},{"owner":"modals/order-payment-confirm","part":"pf49b72260ec991b2c975"}],"/@script-style/b2cf3126f8a55320b9ba587b.css":[{"owner":"modals/order-payment-confirm","part":"p0178e448eb8d92683d2d"}],"/@script-style/0346549ba993d1d4e1b2929e.css":[{"owner":"modals/order-payment-confirm","part":"p25efba02c19575ba2f9a"},{"owner":"modals/order-edit","part":"p9d58afd012397d5e6189"},{"owner":"modals/order-payment-confirm","part":"p851ba72da1e1809ddfc0"},{"owner":"pages/store-list","part":"p9e4c736bf372e7a91cef"},{"owner":"modals/order-payment-confirm","part":"pfa109a53277bb1e71684"}],"/@script-style/ed31b2d72ede3961056a03b9.css":[{"owner":"modals/order-payment-confirm","part":"p0e8a2a17607bff05ea6f"},{"owner":"shared/agent-content","part":"pd72f7f8ae3b2279f8920"}],"/@script-style/285d9bec492fb1358c4f84d2.css":[{"owner":"pages/order-list","part":"pc3e914c4567a383946e0"}],"/@script-style/2c72a2af3a42de2a32bbf994.css":[{"owner":"pages/consumer-home","part":"p38279842548e20540535"},{"owner":"shared/agent-content","part":"pd8271a475c748fe86de4"},{"owner":"pages/consumer-home","part":"pecd99c5b14fc3f2832a4"},{"owner":"modals/workplace-auth","part":"p7f6c4578945ae5f92308"},{"owner":"pages/consumer-home","part":"p5f07bf1d4928b97145a4"}],"/@script-style/1379db12373141703516be56.css":[{"owner":"pages/consumer-home","part":"pe88e38e0b34fc6def662"},{"owner":"modals/order-payment-confirm","part":"p3ccdc436b0c218aa493d"},{"owner":"pages/consumer-home","part":"pa9b7d225272ba469677d"},{"owner":"modals/payment-processing","part":"pd95b025cab0010aa55f1"},{"owner":"shared/common","part":"pd02dd2f79e036d6b2875"}],"/@script-style/f64d1fbcecd56294dca7b505.css":[{"owner":"modals/login","part":"paffc74723189c5307833"},{"owner":"modals/register","part":"pacc400aa321c4f479197"},{"owner":"modals/login","part":"pa3bd96ae61edc513c1df"}],"/@script-style/9acf0e604f12612844bca2bc.css":[{"owner":"pages/consumer-home","part":"p309ef7eb6cb5c094396d"},{"owner":"shared/agent-content","part":"p5b3ceeab73f82cfd7902"},{"owner":"pages/consumer-home","part":"pa851e4089b6a0ec5fa24"},{"owner":"shared/agent-content","part":"p24f4c071ebdff8d91160"}],"/@script-style/d5fda0ad84b756e3e7089fc5.css":[{"owner":"pages/consumer-home","part":"pdc681aea1f47baead43a"}],"/@script-style/c9877190e7c1ab39c91d557a.css":[{"owner":"pages/smb-home","part":"paef7d3760ad6c310390c"},{"owner":"shared/agent-content","part":"pd8271a475c748fe86de4"},{"owner":"pages/smb-home","part":"p122a58066cd60def2c17"},{"owner":"modals/workplace-auth","part":"p7f6c4578945ae5f92308"},{"owner":"pages/smb-home","part":"pa00698a3753cfec1c8ee"}],"/@script-style/ab5f5c1ef3d0bd19be2afcf2.css":[{"owner":"pages/smb-home","part":"pb6fa5cd9c88dec50b844"},{"owner":"modals/order-payment-confirm","part":"p3ccdc436b0c218aa493d"},{"owner":"pages/smb-home","part":"p1847315150b5f8ef9c9b"},{"owner":"modals/payment-processing","part":"pd95b025cab0010aa55f1"},{"owner":"shared/common","part":"pd02dd2f79e036d6b2875"}],"/@script-style/31b567a639ebd17d3851eaf9.css":[{"owner":"modals/login","part":"paffc74723189c5307833"},{"owner":"modals/register","part":"pacc400aa321c4f479197"},{"owner":"modals/login","part":"pa3bd96ae61edc513c1df"}],"/@script-style/64870d89793b939d04227661.css":[{"owner":"pages/smb-home","part":"p5d570837a72da3bb0256"},{"owner":"shared/agent-content","part":"p5b3ceeab73f82cfd7902"},{"owner":"pages/smb-home","part":"p7d3073d1331c876777d6"},{"owner":"shared/agent-content","part":"p24f4c071ebdff8d91160"}],"/@script-style/c0477cd74d59c36880a74ce7.css":[{"owner":"pages/smb-home","part":"p99b88990a47e16dd28b3"}],"/@script-style/ea385d66fae33c13a9fc0613.css":[{"owner":"pages/device-detail","part":"pcf4a9dfb5501c95ac791"}],"/@script-style/30434c8be5e4f8e356cd5cce.css":[{"owner":"shared/agent-content","part":"p3c13644b4356ffb467a2"}],"/@script-style/1050edccec8d00044d13bfec.css":[{"owner":"shared/agent-content","part":"p98c5d855d64ecb73c9ae"}],"/@script-style/b83aeafddfc21b18fe70fb99.css":[{"owner":"shared/agent-content","part":"p13528085f8f3f150088a"}],"/@script-style/136dd27abdd2ca9a737c3409.css":[{"owner":"shared/agent-content","part":"pe3faf572c36a0554f98d"}],"/@script-style/0224557a4a2c157257e0401d.css":[{"owner":"shared/agent-content","part":"p0290550ecaf9ab76343b"}],"/@script-style/94fb3f10343a081ef9345ae2.css":[{"owner":"modals/product-match","part":"pd76cd229e07bf20b2920"}],"/@script-style/48bcec1c1ef7f570e4b12c50.css":[{"owner":"pages/product-detail","part":"p140d4833d3d345c2dead"}],"/@script-style/242307c9433770fd2ddc38b1.css":[{"owner":"shared/agent-content","part":"pa33f30ab4bc0e50f2acf"}],"/@script-style/4449b4d9be6e30cfa9bfda28.css":[{"owner":"shared/agent-content","part":"p4c8fa4247e09b93f7c35"}],"/@script-style/48efdbc89ffd0d3b65a1f8a2.css":[{"owner":"pages/consumer-home","part":"pb79cb8c8b97f6dbeb198"},{"owner":"shared/agent-content","part":"p54793e111b3a77858799"},{"owner":"pages/consumer-home","part":"pc49ed077b3c8a68a2b10"}],"/@script-style/84e431ce1ae60c90e8f1a626.css":[{"owner":"pages/store-detail","part":"p7e18cc00a6d4b8f4fb9b"},{"owner":"pages/store-list","part":"pdbee8cd4a57a01636329"},{"owner":"modals/conversation-history","part":"p6326859190adf2a10b2d"},{"owner":"pages/store-list","part":"pff71a43233ea187f0962"},{"owner":"modals/store-appointment-confirm","part":"p487383e2d2a94a89cd10"},{"owner":"pages/store-detail","part":"p0e2da6ee0ab00c6d3510"},{"owner":"modals/store-appointment-confirm","part":"p2a18633ea2388160cbf2"},{"owner":"pages/store-list","part":"p51a2606a35de65d84337"},{"owner":"pages/store-detail","part":"p77deb28229b3934b4c40"},{"owner":"pages/store-list","part":"p2d794da81458875860a2"},{"owner":"shared/common","part":"pb1dc093db92fa0389b68"},{"owner":"pages/store-detail","part":"p8b007ab8f6d33f712001"},{"owner":"pages/store-list","part":"p36cae2ff25ddc831fad3"},{"owner":"pages/store-detail","part":"pb950fc0fec8ea06f14c9"},{"owner":"shared/common","part":"pd5b8ea3632f5412c71fc"},{"owner":"pages/store-list","part":"p35920a07bef58d803dc7"},{"owner":"pages/store-detail","part":"p1bdd7b3febfa253d5480"},{"owner":"pages/store-list","part":"pb2e18f62e82e22e51926"},{"owner":"pages/store-detail","part":"pe4010c958c6d8e96b131"},{"owner":"pages/store-list","part":"p7836e82c8704613bd36a"},{"owner":"pages/store-detail","part":"p3825462036962b5514b8"},{"owner":"pages/store-list","part":"p0bce749e79a5919464ee"},{"owner":"modals/store-coupon-verify","part":"p913961de5e5f66c8918e"},{"owner":"pages/store-list","part":"p7b4e616413a243f27edc"},{"owner":"pages/store-detail","part":"pdf985374b4aed2224dc8"},{"owner":"pages/store-list","part":"p4a42698d9a0c6fa8dd82"},{"owner":"pages/store-detail","part":"p62a76ab899a0ffeca7a5"},{"owner":"pages/store-list","part":"pdba11e004b54d054db63"},{"owner":"pages/store-detail","part":"peb607542b1e3efae25da"},{"owner":"modals/store-coupon-verify","part":"p8b7592a008b0e7f81d1a"},{"owner":"pages/coupon-center","part":"p7b16056263a895f56922"},{"owner":"pages/store-detail","part":"pb1e78064c3bc4ac5c56d"},{"owner":"pages/store-list","part":"p4b2f2500223febc90803"},{"owner":"pages/store-detail","part":"pf3e7f6f01b143193e79f"},{"owner":"pages/store-list","part":"p794c4c0bdb370fe3d1a8"},{"owner":"modals/store-appointment-confirm","part":"pedaaa77422c1f13c0083"},{"owner":"modals/arrival-time","part":"p51fd4b48f13397be9c2d"},{"owner":"modals/store-select","part":"p35865a0aa6c1908c70f1"},{"owner":"modals/store-purpose","part":"p057085809da476384094"},{"owner":"modals/store-appointment-confirm","part":"pbfacc9bffbbb60ba84cf"},{"owner":"pages/store-detail","part":"pa55be28e0b615380e081"},{"owner":"modals/store-appointment-confirm","part":"p26c94d44568c2e7b48d1"},{"owner":"pages/store-list","part":"pd2fa19cb4a49f3391e24"},{"owner":"shared/common","part":"p40c42070f97e8437f14c"},{"owner":"pages/store-list","part":"pa4eaffb94ad254f35ddb"},{"owner":"modals/store-appointment-confirm","part":"pf3da436445fb4b6dd711"},{"owner":"pages/store-detail","part":"pff1e6da7b34b21f90e08"},{"owner":"pages/store-list","part":"p9cdc34a93095d03f0813"},{"owner":"pages/store-detail","part":"p7c656007431768c2bb4b"},{"owner":"pages/product-list","part":"pd1bf6744339ca07f5ba7"},{"owner":"pages/store-list","part":"p218c7ecde6d585447fa3"},{"owner":"pages/store-detail","part":"pa3b731b5ff8a45ffed2a"},{"owner":"pages/store-list","part":"p998fa058a56d04c2d2b6"},{"owner":"pages/store-detail","part":"p073e021944457e17e3b7"},{"owner":"pages/store-list","part":"p0187aaee05eff8dbbaf2"},{"owner":"pages/store-detail","part":"p5f57929f26aa9390f406"},{"owner":"pages/store-list","part":"p618d45ed9021e90a3c6a"},{"owner":"pages/store-detail","part":"pf216f332d9b790a8f15e"},{"owner":"pages/store-list","part":"pa87ef9c8879a4c8ebd97"},{"owner":"shared/common","part":"p57dbe3a11fa30658ff7d"},{"owner":"pages/store-detail","part":"p5d8d8d922322a225ae1f"},{"owner":"pages/store-list","part":"p32601c149be8840f16e1"},{"owner":"pages/store-detail","part":"p425650098d97a1244814"},{"owner":"pages/store-list","part":"pfa02a9eb9697de284296"},{"owner":"pages/store-detail","part":"pc2995698fc90d6281397"},{"owner":"modals/store-appointment-confirm","part":"pb7e2b3660503c1377f91"},{"owner":"pages/store-list","part":"p45136ebb93d838100b98"},{"owner":"pages/store-detail","part":"p102c02b7a4ea67306423"},{"owner":"shared/common","part":"pe6d4cf965510742bcd37"},{"owner":"pages/store-detail","part":"pad5e51cb16e0dce78c06"},{"owner":"modals/store-coupon-verify","part":"pfb5443d7c51c3cff62b4"},{"owner":"pages/store-detail","part":"pad89886756387354476a"},{"owner":"pages/store-list","part":"pb57ba6e6a6caac8d99d2"},{"owner":"pages/store-detail","part":"pca8af994a87273ccb740"},{"owner":"pages/store-list","part":"p2f9a31fe7f6d0e15251f"},{"owner":"pages/store-detail","part":"p5b7a3a6533d12ad8095d"},{"owner":"modals/device-bind","part":"pd2d44f2b7ca422221760"},{"owner":"modals/store-appointment-confirm","part":"p186aa063b604f21a4677"},{"owner":"pages/store-detail","part":"p606b80e38b4143e702cd"},{"owner":"modals/store-appointment-confirm","part":"pfbae7cb292598f5a517d"},{"owner":"shared/common","part":"pc5468e31fa5c03a7b319"}],"/@script-style/760c8f5d68039c76e0178d5b.css":[{"owner":"pages/store-list","part":"p64f70cdaf3a87a281d6d"},{"owner":"modals/store-appointment-confirm","part":"p967a5aabdf1b08dd3ea7"},{"owner":"modals/arrival-time","part":"p51fd4b48f13397be9c2d"},{"owner":"modals/store-select","part":"p35865a0aa6c1908c70f1"},{"owner":"modals/store-purpose","part":"p057085809da476384094"},{"owner":"modals/store-appointment-confirm","part":"pbfacc9bffbbb60ba84cf"},{"owner":"pages/store-detail","part":"pa55be28e0b615380e081"},{"owner":"modals/store-appointment-confirm","part":"p26c94d44568c2e7b48d1"},{"owner":"pages/store-detail","part":"p4b2c2e70e68fe02f6a71"},{"owner":"modals/store-coupon-verify","part":"pfb5443d7c51c3cff62b4"},{"owner":"pages/store-detail","part":"pad89886756387354476a"},{"owner":"modals/device-bind","part":"pd2d44f2b7ca422221760"},{"owner":"modals/store-appointment-confirm","part":"p186aa063b604f21a4677"},{"owner":"pages/store-detail","part":"p606b80e38b4143e702cd"},{"owner":"modals/store-appointment-confirm","part":"pfbae7cb292598f5a517d"},{"owner":"shared/common","part":"pc5468e31fa5c03a7b319"}],"/@script-style/d35a74e9317b3685191c6e64.css":[{"owner":"pages/store-detail","part":"p7e18cc00a6d4b8f4fb9b"},{"owner":"pages/store-list","part":"pdbee8cd4a57a01636329"},{"owner":"modals/conversation-history","part":"p6326859190adf2a10b2d"},{"owner":"pages/store-list","part":"pff71a43233ea187f0962"},{"owner":"modals/store-appointment-confirm","part":"p487383e2d2a94a89cd10"},{"owner":"pages/store-detail","part":"p0e2da6ee0ab00c6d3510"},{"owner":"modals/store-appointment-confirm","part":"p2a18633ea2388160cbf2"},{"owner":"pages/store-list","part":"p51a2606a35de65d84337"},{"owner":"pages/store-detail","part":"p77deb28229b3934b4c40"},{"owner":"pages/store-list","part":"p2d794da81458875860a2"},{"owner":"shared/common","part":"pb1dc093db92fa0389b68"},{"owner":"pages/store-detail","part":"p8b007ab8f6d33f712001"},{"owner":"pages/store-list","part":"p36cae2ff25ddc831fad3"},{"owner":"pages/store-detail","part":"pb950fc0fec8ea06f14c9"},{"owner":"shared/common","part":"pd5b8ea3632f5412c71fc"},{"owner":"pages/store-list","part":"p35920a07bef58d803dc7"},{"owner":"pages/store-detail","part":"p1bdd7b3febfa253d5480"},{"owner":"pages/store-list","part":"pb2e18f62e82e22e51926"},{"owner":"pages/store-detail","part":"pe4010c958c6d8e96b131"},{"owner":"pages/store-list","part":"p7836e82c8704613bd36a"},{"owner":"pages/store-detail","part":"p3825462036962b5514b8"},{"owner":"pages/store-list","part":"p0bce749e79a5919464ee"},{"owner":"modals/store-coupon-verify","part":"p913961de5e5f66c8918e"},{"owner":"pages/store-list","part":"p7b4e616413a243f27edc"},{"owner":"pages/store-detail","part":"pdf985374b4aed2224dc8"},{"owner":"pages/store-list","part":"p4a42698d9a0c6fa8dd82"},{"owner":"pages/store-detail","part":"p62a76ab899a0ffeca7a5"},{"owner":"pages/store-list","part":"pdba11e004b54d054db63"},{"owner":"pages/store-detail","part":"peb607542b1e3efae25da"},{"owner":"modals/store-coupon-verify","part":"p8b7592a008b0e7f81d1a"},{"owner":"pages/coupon-center","part":"p7b16056263a895f56922"},{"owner":"pages/store-detail","part":"pb1e78064c3bc4ac5c56d"},{"owner":"pages/store-list","part":"p4b2f2500223febc90803"},{"owner":"pages/store-detail","part":"pf3e7f6f01b143193e79f"},{"owner":"pages/store-list","part":"p794c4c0bdb370fe3d1a8"},{"owner":"modals/store-appointment-confirm","part":"pedaaa77422c1f13c0083"},{"owner":"modals/arrival-time","part":"p51fd4b48f13397be9c2d"},{"owner":"modals/store-select","part":"p35865a0aa6c1908c70f1"},{"owner":"modals/store-purpose","part":"p057085809da476384094"},{"owner":"modals/store-appointment-confirm","part":"pbfacc9bffbbb60ba84cf"},{"owner":"pages/store-detail","part":"pa55be28e0b615380e081"},{"owner":"modals/store-appointment-confirm","part":"p26c94d44568c2e7b48d1"},{"owner":"pages/store-list","part":"pd2fa19cb4a49f3391e24"},{"owner":"shared/common","part":"p40c42070f97e8437f14c"},{"owner":"pages/store-list","part":"pa4eaffb94ad254f35ddb"},{"owner":"modals/store-appointment-confirm","part":"pf3da436445fb4b6dd711"},{"owner":"pages/store-detail","part":"pff1e6da7b34b21f90e08"},{"owner":"pages/store-list","part":"p9cdc34a93095d03f0813"},{"owner":"pages/store-detail","part":"p7c656007431768c2bb4b"},{"owner":"pages/product-list","part":"pd1bf6744339ca07f5ba7"},{"owner":"pages/store-list","part":"p218c7ecde6d585447fa3"},{"owner":"pages/store-detail","part":"pa3b731b5ff8a45ffed2a"},{"owner":"pages/store-list","part":"p998fa058a56d04c2d2b6"},{"owner":"pages/store-detail","part":"p073e021944457e17e3b7"},{"owner":"pages/store-list","part":"p0187aaee05eff8dbbaf2"},{"owner":"pages/store-detail","part":"p5f57929f26aa9390f406"},{"owner":"pages/store-list","part":"p618d45ed9021e90a3c6a"},{"owner":"pages/store-detail","part":"pf216f332d9b790a8f15e"},{"owner":"pages/store-list","part":"pa87ef9c8879a4c8ebd97"},{"owner":"shared/common","part":"p57dbe3a11fa30658ff7d"},{"owner":"pages/store-detail","part":"p5d8d8d922322a225ae1f"},{"owner":"pages/store-list","part":"p32601c149be8840f16e1"},{"owner":"pages/store-detail","part":"p425650098d97a1244814"},{"owner":"pages/store-list","part":"pfa02a9eb9697de284296"},{"owner":"pages/store-detail","part":"pc2995698fc90d6281397"},{"owner":"modals/store-appointment-confirm","part":"pb7e2b3660503c1377f91"},{"owner":"pages/store-list","part":"p45136ebb93d838100b98"},{"owner":"pages/store-detail","part":"p102c02b7a4ea67306423"},{"owner":"shared/common","part":"pe6d4cf965510742bcd37"},{"owner":"pages/store-detail","part":"pad5e51cb16e0dce78c06"},{"owner":"modals/store-coupon-verify","part":"pfb5443d7c51c3cff62b4"},{"owner":"pages/store-detail","part":"pad89886756387354476a"},{"owner":"pages/store-list","part":"pb57ba6e6a6caac8d99d2"},{"owner":"pages/store-detail","part":"pca8af994a87273ccb740"},{"owner":"pages/store-list","part":"p2f9a31fe7f6d0e15251f"},{"owner":"pages/store-detail","part":"p5b7a3a6533d12ad8095d"},{"owner":"modals/device-bind","part":"pd2d44f2b7ca422221760"},{"owner":"modals/store-appointment-confirm","part":"p186aa063b604f21a4677"},{"owner":"pages/store-detail","part":"p606b80e38b4143e702cd"},{"owner":"modals/store-appointment-confirm","part":"pfbae7cb292598f5a517d"},{"owner":"shared/common","part":"pc5468e31fa5c03a7b319"}],"/@script-style/6af959b743dfe75368e68667.css":[{"owner":"pages/store-list","part":"p64f70cdaf3a87a281d6d"},{"owner":"modals/store-appointment-confirm","part":"p967a5aabdf1b08dd3ea7"},{"owner":"modals/arrival-time","part":"p51fd4b48f13397be9c2d"},{"owner":"modals/store-select","part":"p35865a0aa6c1908c70f1"},{"owner":"modals/store-purpose","part":"p057085809da476384094"},{"owner":"modals/store-appointment-confirm","part":"pbfacc9bffbbb60ba84cf"},{"owner":"pages/store-detail","part":"pa55be28e0b615380e081"},{"owner":"modals/store-appointment-confirm","part":"p26c94d44568c2e7b48d1"},{"owner":"pages/store-detail","part":"p4b2c2e70e68fe02f6a71"},{"owner":"modals/store-coupon-verify","part":"pfb5443d7c51c3cff62b4"},{"owner":"pages/store-detail","part":"pad89886756387354476a"},{"owner":"modals/device-bind","part":"pd2d44f2b7ca422221760"},{"owner":"modals/store-appointment-confirm","part":"p186aa063b604f21a4677"},{"owner":"pages/store-detail","part":"p606b80e38b4143e702cd"},{"owner":"modals/store-appointment-confirm","part":"pfbae7cb292598f5a517d"},{"owner":"shared/common","part":"pc5468e31fa5c03a7b319"}],"/@script-style/1686e8afbabbd25a4c9c01da.css":[{"owner":"modals/store-appointment-confirm","part":"p2120ff3b8511931d07db"}],"/@script-style/13a18e6b07aff840b41dde11.css":[{"owner":"pages/store-list","part":"p21cf9c970da094e9a732"}],"/@native/consumer-home/scene.css":[{"owner":"pages/consumer-home","part":"p0-personal-native-scene"}]};
if (!window.__p0Modules.installed["shared/common"]) {
window.__p0Modules.installed["shared/common"]=true;

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/p0-root-nav.js */
window.__p0Modules.sources["u70ac31fc278c2823"]=function(){
(function () {
  "use strict";

  var routes = {
    home: "index.html",
    personal: "shop-chat/index.html",
    business: "b-chat/index.html",
    enterprise: "biz-chat/index.html",
    brand: "brand/index.html"
  };
  var rootBase = new URL("../../", document.baseURI).href;
  var currentByPath = {
    "": "home",
    "index.html": "home",
    "shop-chat": "personal",
    "shop-chat/index.html": "personal",
    "b-chat": "business",
    "b-chat/index.html": "business",
    "biz-chat": "enterprise",
    "biz-chat/index.html": "enterprise",
    "brand": "brand",
    "brand/index.html": "brand"
  };
  var bridgePrefix = "leaip0-conversation:";
  var sharedKeys = [
    "lexiang.conversation.v1",
    "lexiang.lxfd.convs.v1",
    "lexiang.conversation.sourcePage.v1",
    "lexiang.recoPayloads.v1",
    "lexiang.cart.v1",
    "lexiang.orders.v1",
    "lexiang.compare.v1",
    "lexiang.coupons.v1"
  ];

  function restoreNavigationBridge() {
    if (typeof window.name !== "string" || window.name.indexOf(bridgePrefix) !== 0) return;
    try {
      var payload = JSON.parse(decodeURIComponent(window.name.slice(bridgePrefix.length)));
      sharedKeys.forEach(function (key) {
        if (typeof payload[key] === "string") localStorage.setItem(key, payload[key]);
      });
      window.name = "";
    } catch (_e) {}
  }

  function saveNavigationBridge() {
    try {
      var payload = {};
      sharedKeys.forEach(function (key) {
        var value = localStorage.getItem(key);
        if (value !== null) payload[key] = value;
      });
      window.name = bridgePrefix + encodeURIComponent(JSON.stringify(payload));
    } catch (_e) {}
  }

  function snapshotVisibleConversation() {
    try {
      if (localStorage.getItem("lexiang.newChatEmpty.v1") === "1") {
        localStorage.removeItem("lexiang.conversation.v1");
        return;
      }
      var fullscreenNodes = Array.from(document.querySelectorAll(".lxfd-thread > .lxfd-msg-user, .lxfd-thread > .lxfd-msg-ai"));
      var splitNodes = Array.from(document.querySelectorAll(".chat-state .lx-p0-messages > .lx-p0-message"));
      var fullscreenActive = currentPage() === "home" &&
        (document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs"));
      var splitHasConversation = splitNodes.some(function (node) {
        return node.classList.contains("user");
      });
      var fullscreenHasConversation = fullscreenNodes.some(function (node) {
        return node.classList.contains("lxfd-msg-user");
      });
      // 五个频道共用同一个智能体会话。子站/分屏页面中仍会保留一份隐藏的全屏 DOM，
      // 它可能只同步了首轮。不能因为这份旧 DOM 里“存在用户消息”就覆盖当前分屏的完整多轮。
      // 只有首页真正处于全屏对话态时才以全屏为准；其余情况分屏会话优先。
      var nodes = fullscreenActive && fullscreenHasConversation
        ? fullscreenNodes
        : (splitHasConversation ? splitNodes : fullscreenNodes);
      var messages = [];

      nodes.forEach(function (node) {
        var isFullscreenUser = node.classList.contains("lxfd-msg-user");
        var isSplitUser = node.classList.contains("user");
        var isUser = isFullscreenUser || isSplitUser;
        var isAi = node.classList.contains("lxfd-msg-ai") || node.classList.contains("ai") || node.classList.contains("assistant");
        if (!isUser && !isAi) return;

        if (isUser) {
          var userBubble = node.querySelector(".user-bubble");
          var userText = ((userBubble || node).textContent || "").trim();
          if (userText) messages.push({ role: "user", text: userText, html: "" });
          return;
        }

        var aiBody = node.querySelector(".lxfd-ai-body, .ai-body") || node;
        var aiText = (aiBody.textContent || "").trim();
        var aiHtml = aiBody.innerHTML || "";
        var hasVisiblePending = Array.from(aiBody.querySelectorAll(".lx-generating, .loading-line, .typing-text, .typing-cursor")).some(function (pending) {
          return !pending.hidden && pending.getAttribute("aria-hidden") !== "true";
        });
        var hasPlaceholderOnly = /联想乐享正在生成中|正在生成中/.test(aiText) && aiText.length < 40;
        if ((hasVisiblePending || hasPlaceholderOnly) && !aiText.replace(/联想乐享正在生成中|正在生成中/g, "").trim()) return;
        if (hasVisiblePending || hasPlaceholderOnly) aiHtml = "";
        if (aiText || aiHtml) messages.push({ role: "ai", text: aiText, html: aiHtml });
      });

      if (!messages.length) return;
      localStorage.setItem("lexiang.conversation.v1", JSON.stringify({
        convId: (window.__lxState && window.__lxState.convId) || null,
        messages: messages.slice(-50),
        ts: Date.now()
      }));
    } catch (_e) {}
  }

  restoreNavigationBridge();

  function currentPage() {
    if (window.__LX_TEMPLATE_PAGE && routes[window.__LX_TEMPLATE_PAGE]) return window.__LX_TEMPLATE_PAGE;
    try {
      var relativePath = decodeURIComponent(location.pathname).replace(decodeURIComponent(new URL(rootBase).pathname), "").replace(/^\/+|\/+$/g, "");
      return currentByPath[relativePath] || "home";
    } catch (_e) {
      return "home";
    }
  }

  function syncActiveState() {
    var page = currentPage();
    document.querySelectorAll(".main-nav [data-page], .lxfd-nav-sheet [data-page]").forEach(function (item) {
      var active = item.dataset.page === page;
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function isFullscreenConversationActive() {
    return currentPage() === "home" &&
      (document.body.classList.contains("assistant-fullscreen") || document.body.classList.contains("lx-auto-fs"));
  }

  function resetConversationAndReturnHome() {
    var fullscreenVisible = document.body.classList.contains("assistant-fullscreen") ||
      document.body.classList.contains("lx-auto-fs");
    // 当前可见会话先走各自已有的“新建对话”归档链路，历史记录继续保留；
    // 随后只清当前会话缓存，确保回首页后是全新的欢迎态。
    try {
      if (fullscreenVisible && typeof window.lxfdReset === "function") window.lxfdReset(true);
      else if (window.__lxBridge && typeof window.__lxBridge.newConversationInCurrentChannel === "function") {
        window.__lxBridge.newConversationInCurrentChannel();
      }
    } catch (_e) {}
    try {
      localStorage.setItem("lexiang.newChatEmpty.v1", "1");
      localStorage.removeItem("lexiang.conversation.v1");
      localStorage.removeItem("lexiang.conversation.sourcePage.v1");
    } catch (_e) {}
    window.name = "";
    location.assign(new URL(routes.home, rootBase).href);
  }

  document.addEventListener("click", function (event) {
    if (!event.isTrusted) return;
    var item = event.target.closest && event.target.closest(".main-nav [data-page], .lxfd-nav-sheet [data-page], .brand, .lxfd-logo-pill");
    if (!item) return;
    var isLogo = item.matches(".brand, .lxfd-logo-pill");
    var page = item.dataset.page || "home";
    if (!routes[page]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isLogo) {
      resetConversationAndReturnHome();
      return;
    }
    // 隐藏的 lxfd 线程不是当前会话源；让它持久化会把分屏的多轮快照回退成首轮。
    if (isFullscreenConversationActive()) {
      try { window.__lxfdPersistCurrentNow && window.__lxfdPersistCurrentNow(); } catch (_e) {}
    }
    try { window.__lxSaveConversationNow && window.__lxSaveConversationNow(); } catch (_e) {}
    snapshotVisibleConversation();
    saveNavigationBridge();
    location.assign(new URL(routes[page], rootBase).href);
  }, true);

  document.addEventListener("DOMContentLoaded", syncActiveState);
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".brand, .lxfd-logo-pill").forEach(function (logo) {
      logo.setAttribute("aria-label", "新建对话并返回首页");
      logo.setAttribute("title", "新建对话并返回首页");
    });
  });
  window.setTimeout(syncActiveState, 0);
  new MutationObserver(function (_records, observer) {
    if (!document.querySelector(".main-nav [data-page], .lxfd-nav-sheet [data-page]")) return;
    syncActiveState();
    observer.disconnect();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/model-knowledge-runtime.js */
window.__p0Modules.sources["u90ffe4a3cdbaa0c3"]=function(){
(function (root, factory) {
  var runtime = factory();
  if (typeof module === "object" && module.exports) module.exports = runtime;
  if (root) root.LeAIModelKnowledgeRuntime = runtime;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PRODUCTS = [
    {
      official: true,
      sku: "skill-y9000p-2026",
      name: "拯救者 Y9000P 2026",
      full_name: "拯救者 Y9000P 2026",
      description: "适合 3A 游戏、视频剪辑、三维设计与高负载创作。",
      price: 15098,
      image_url: "../img/lxfd-gallery-1-1.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    },
    {
      official: true,
      sku: "skill-yoga-air-14c-2026",
      name: "YOGA Air 14c 2026",
      full_name: "YOGA Air 14c 2026",
      description: "适合移动办公、轻量创作、会议演示与日常学习。",
      price: 8999,
      image_url: "../img/lxfd-gallery-1-2.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    },
    {
      official: true,
      sku: "skill-xiaoxin-pad-pro-13",
      name: "小新 Pad Pro 13 英寸",
      full_name: "小新 Pad Pro 13 英寸",
      description: "适合影音娱乐、轻办公、移动阅读与跨设备协作。",
      price: 7299,
      image_url: "../img/lxfd-gallery-1-3.jpg",
      url: "https://www.lenovo.com.cn/",
      variants: 1
    }
  ];

  function normalize(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function recommendProducts(query) {
    var text = normalize(query).toLowerCase();
    if (/游戏|电竞|剪辑|三维|渲染|y9000p|拯救者/.test(text)) return [PRODUCTS[0], PRODUCTS[1]];
    if (/办公|出差|便携|轻薄|会议|yoga/.test(text)) return [PRODUCTS[1], PRODUCTS[2]];
    if (/平板|阅读|影音|pad/.test(text)) return [PRODUCTS[2], PRODUCTS[1]];
    return PRODUCTS.slice();
  }

  function answerQuery(query) {
    var text = normalize(query);
    var products = recommendProducts(text);
    if (/推荐|选购|买|商品|笔记本|电脑|平板|办公|游戏|学习|设计|剪辑|便携|轻薄/i.test(text)) {
      return {
        text: "我已根据你的使用场景，从模板内置的联想乐享产品知识中整理了几款方向。重性能可优先看拯救者 Y9000P；经常移动办公可优先看 YOGA Air 14c；偏影音、阅读和轻办公可关注小新 Pad Pro。价格、库存和活动会变化，购买前请以联想官方商城实时信息为准。",
        products: products,
        status: "已调用 Skill(联想乐享模型与知识)"
      };
    }
    return {
      text: "这是联想乐享 PC 5.0 规范 Skill 内置的独立问答能力。我可以围绕联想产品选购、使用场景、服务入口和设计规范提供回答；若需要商品推荐，可以直接告诉我预算、用途和便携偏好。",
      products: [],
      status: "已调用 Skill(联想乐享模型与知识)"
    };
  }

  function followups(query) {
    var text = normalize(query);
    if (/游戏|拯救者|y9000p/i.test(text)) return ["对比一下配置", "看看当前优惠", "适合哪些游戏"];
    if (/办公|轻薄|yoga/i.test(text)) return ["续航表现怎么样", "对比一下重量", "看看当前优惠"];
    return ["按预算帮我筛选", "对比一下这几款", "看看当前优惠"];
  }

  function sseResponse(query) {
    var result = answerQuery(query);
    var events = [
      ["status", { text: "正在调用 Skill(联想乐享模型与知识)" }],
      ["status", { text: result.status }],
      ["chunk", { text: result.text }]
    ];
    if (result.products.length) events.push(["display", { title: "为你推荐", products: result.products }]);
    events.push(["suggestions", { questions: followups(query) }]);
    events.push(["done", { conv_id: "skill-local-knowledge" }]);
    var body = events.map(function (entry) {
      return "event: " + entry[0] + "\ndata:" + JSON.stringify(entry[1]) + "\n\n";
    }).join("");
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" }
    });
  }

  function jsonResponse(value, status) {
    return new Response(JSON.stringify(value), {
      status: status || 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  function parseBody(options) {
    if (!options || !options.body || typeof options.body !== "string") return {};
    try { return JSON.parse(options.body); } catch (error) { return {}; }
  }

  function localApiResponse(url, options) {
    var path = String(url || "");
    var body = parseBody(options);
    if (/\/api\/leai\/intent(?:\?|$)/.test(path)) return jsonResponse({ type: "chat" });
    if (/\/api\/leai\/followups(?:\?|$)/.test(path)) return jsonResponse({ rc: 0, questions: followups(body.q || body.message) });
    if (/\/api\/(?:leai\/stream|chat\/stream)(?:\?|$)/.test(path)) return sseResponse(body.message || body.input || "");
    if (/\/api\/chat\/upload-image(?:\?|$)/.test(path)) return jsonResponse({ error: "独立模板暂不支持图片上传" }, 501);
    if (/\/api\//.test(path)) return jsonResponse({ rc: 0, data: [], user: null });
    return null;
  }

  function installFetchAdapter(target) {
    if (!target || typeof target.fetch !== "function" || target.__LX_SKILL_FETCH_INSTALLED) return;
    target.__LX_SKILL_FETCH_INSTALLED = true;
    var nativeFetch = target.fetch.bind(target);
    target.fetch = function (input, options) {
      var rawUrl = typeof input === "string" ? input : input && input.url;
      var isApi = typeof rawUrl === "string" && (/^\/api\//.test(rawUrl) || /\/api\//.test(rawUrl));
      if (!isApi) return nativeFetch(input, options);
      if (target.location && target.location.protocol === "file:") {
        return Promise.resolve(localApiResponse(rawUrl, options));
      }
      return nativeFetch(input, options).catch(function () {
        return localApiResponse(rawUrl, options);
      });
    };
  }

  return {
    PRODUCTS: PRODUCTS,
    answerQuery: answerQuery,
    followups: followups,
    localApiResponse: localApiResponse,
    installFetchAdapter: installFetchAdapter
  };
});

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/shared/inline-5faa7877c846.js */
window.__p0Modules.sources["u4f355a113335dd9f"]=function(){
window.__LXFD_FORCE = new URLSearchParams(location.search).has("lxfd") ||
        location.pathname.replace(/\/+$|^$/, "/") === "/" ||
        /home-fullscreen-dialog-template\.html$/.test(location.pathname);
      window.__LX_TEMPLATE_RUNTIME = Object.freeze({
        origin: location.protocol === "file:" ? "skill://local-knowledge" : location.origin,
        streamEndpoint: "/api/leai/stream",
        intentEndpoint: "/api/leai/intent",
        fallbackEndpoint: "/api/chat/stream",
        mode: location.protocol === "file:" ? "bundled-knowledge" : "model-and-knowledge",
        standalone: true
      });
      if (window.LeAIModelKnowledgeRuntime) {
        window.LeAIModelKnowledgeRuntime.installFetchAdapter(window);
      }

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/portal.js */
window.__p0Modules.sources["uc1505fdb78a9b295"]=function(){
      const body = document.body;
      const assistantPanel = document.querySelector(".assistant-panel");
      const assistantToggle = document.querySelector(".assistant-toggle");
      const assistantRestore = document.querySelector(".assistant-restore");
      const switchButton = document.querySelector(".switch-btn");
      const newChatButton = document.querySelector(".new-chat-button");
      const composerTextarea = document.querySelector(".composer textarea");
      const heroComposer = document.querySelector(".hero-composer");
      const heroComposerTextarea = document.querySelector(".hero-composer textarea");
      const rotatingTitle = document.querySelector(".rotating-title");
      const heroModeOptions = document.querySelectorAll(".hero-mode-option");
      const heroSuggestions = document.querySelectorAll(".hero-suggestion");
      const heroSlides = document.querySelectorAll(".hero-slide");
      const navPageButtons = document.querySelectorAll(".main-nav [data-page]");
      const pageJumpButtons = document.querySelectorAll("[data-page-jump]");
      const heroKicker = document.querySelector("[data-page-kicker]");
      const heroTitle = document.querySelector("[data-page-title]");
      const heroPanelCollapse = document.querySelector(".hero-panel-collapse");
      const categoryButtons = document.querySelectorAll(".category-tabs button");
      const productCards = document.querySelectorAll(".product-card");
      const content = document.querySelector(".content");
      const revealNodes = document.querySelectorAll(
        ".portal-section, .portal-product, .solution-card, .case-card, .news-card, .hot-card, .footer-col"
      );
      const detailBack = document.querySelector(".detail-back");
      const detailTitle = document.querySelector("[data-detail-title]");
      const detailSummary = document.querySelector("[data-detail-summary]");
      const detailPrice = document.querySelector("[data-detail-price]");
      const detailVisualWrap = document.querySelector(".detail-visual");
      const detailVisual = document.querySelector("[data-detail-visual]");
      const detailImagesPanel = document.querySelector("[data-detail-images-panel]");
      const detailHeroImage = document.querySelector("[data-detail-hero-image]");
      const detailHeroTitle = document.querySelector("[data-detail-hero-title]");
      const detailHeroDesc = document.querySelector("[data-detail-hero-desc]");
      const detailReviewOne = document.querySelector("[data-detail-review-one]");
      const detailReviewTwo = document.querySelector("[data-detail-review-two]");
      const detailReviewThree = document.querySelector("[data-detail-review-three]");
      const detailSpecGrid = document.querySelector("[data-detail-spec-grid]");
      let currentPageKey = "home";
      let rotatingTitleTimer;
      let heroSlideIndex = 0;
      const pageConfigs = {
        personal: {
          kicker: "2026 拯救者PC新品震撼来袭",
          title: "拯救驾临 执御客川",
          categories: ["推荐", "小新", "拯救者", "YOGA", "ThinkPad", "手机", "配件"],
          products: [
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-1.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-2.jpg"],
            ["Lecoo", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-3.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "国补后￥9799", "", "/assets/img/shop-4.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-5.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-7.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-8.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-9.jpg"],
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-10.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "dark", "/assets/img/shop-11.jpg"],
            ["Lecoo", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-12.jpg"],
            ["拯救者 LEGION", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "国补后￥9799", "dark", "/assets/img/shop-13.jpg"],
            ["", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "side", "/assets/img/shop-14.jpg"],
            ["联想小新", "小新AIR13", "2.5K 120Hz｜轻至1.1kg", "¥ 9799", "", "/assets/img/shop-14.jpg"]
          ]
        },
        business: {
          kicker: "联想中小企业智能办公方案",
          title: "高效办公 灵活成长",
          categories: ["推荐", "ThinkCentre", "ThinkBook", "ThinkPad", "商用台式机", "显示器", "服务"],
          products: [
            ["ThinkCentre", "启天M商用台式机", "稳定高效｜企业级管理", "¥ 4999", ""],
            ["ThinkBook", "ThinkBook 14", "轻薄办公｜长效续航", "¥ 5999", ""],
            ["ThinkPad", "ThinkPad E14", "商务可靠｜安全加固", "¥ 6299", "dark"],
            ["联想服务", "企业IT服务包", "部署运维｜远程支持", "咨询报价", ""],
            ["ThinkVision", "商用显示器", "低蓝光｜多接口扩展", "¥ 1299", ""],
            ["联想小新", "办公套装方案", "电脑+显示器｜一站采购", "组合优惠", ""],
            ["ThinkCentre", "迷你主机方案", "小巧节能｜集中部署", "¥ 3999", ""],
            ["Lenovo AI", "AI办公助手方案", "会议纪要｜资料检索", "了解方案", "dark"]
          ]
        },
        enterprise: {
          kicker: "政教及大企业数字化终端方案",
          title: "安全可信 规模交付",
          categories: ["推荐", "政教采购", "大企业", "工作站", "服务器", "安全服务", "定制"],
          products: [
            ["政教方案", "昭阳商用笔记本", "国产化适配｜集中管控", "咨询报价", ""],
            ["ThinkStation", "高性能工作站", "专业图形｜稳定算力", "¥ 12999", "dark"],
            ["联想服务", "大客户运维服务", "SLA支持｜驻场保障", "定制报价", ""],
            ["教育方案", "智慧教学终端", "教室部署｜统一管理", "了解方案", ""],
            ["安全可信", "终端安全套件", "身份认证｜数据防护", "咨询报价", ""],
            ["ThinkPad", "旗舰商务终端", "高可靠｜高安全", "¥ 9999", "dark"],
            ["数据中心", "边缘服务器", "稳定扩展｜集中运维", "定制报价", "dark"],
            ["联想定制", "行业专属方案", "批量交付｜深度定制", "联系顾问", ""]
          ]
        }
      };
      const resolveAssetUrl = (url) => {
        if (!url || location.protocol !== "file:" || !url.startsWith("/assets/")) return url;
        return new URL(`../${url.slice("/assets/".length)}`, document.baseURI).href;
      };
      const params = new URLSearchParams(window.location.search);
      revealNodes.forEach((node, index) => {
        node.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
      });
      const revealObserver = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver?.unobserve(entry.target);
              });
            },
            {
              root: content,
              threshold: 0.16,
              rootMargin: "0px 0px -8% 0px"
            }
          );
      revealNodes.forEach((node) => {
        if (revealObserver) {
          revealObserver.observe(node);
        } else {
          node.classList.add("is-visible");
        }
      });
      const refreshHomeReveal = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          revealNodes.forEach((node) => node.classList.add("is-visible"));
          return;
        }
        requestAnimationFrame(() => {
          revealNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            const contentRect = content?.getBoundingClientRect();
            const viewportBottom = contentRect ? contentRect.bottom : window.innerHeight;
            if (rect.top < viewportBottom - 24) {
              node.classList.add("is-visible");
            }
          });
        });
      };
      const setupRotatingTitle = () => {
        if (!rotatingTitle) return;
        const words = Array.from(rotatingTitle.querySelectorAll(".word"));
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let activeIndex = 0;

        const updateWord = () => {
          words.forEach((word, index) => {
            word.classList.toggle("is-active", index === activeIndex);
          });
          const activeWord = words[activeIndex];
          const w = activeWord.getBoundingClientRect().width;
          // 首屏未完成布局/字体未加载时宽度为 0，写 0px 会被 overflow:hidden 把首词裁没→标题空白几秒；保留默认 3em 让首词立即显示
          if (w > 0) rotatingTitle.style.setProperty("--rotating-title-width", `${w}px`);
        };

        updateWord();
        rotatingTitle.classList.add("is-ready");
        // 布局/字体就绪后再量一次，确保首词立刻正确显示而非等到下一次 2s 轮播才出现
        requestAnimationFrame(updateWord);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateWord);
        window.addEventListener("resize", updateWord);

        if (reduceMotion || words.length < 2) return;
        rotatingTitleTimer = window.setInterval(() => {
          activeIndex = (activeIndex + 1) % words.length;
          updateWord();
        }, 2000);
      };
      const setupHeroCarousel = () => {
        if (heroSlides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        window.setInterval(() => {
          heroSlides[heroSlideIndex]?.classList.remove("is-active");
          heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
          heroSlides[heroSlideIndex]?.classList.add("is-active");
        }, 4200);
      };
      const updateStaticDetailPanels = ({ brand, title, spec, image }) => {
        if (detailImagesPanel) {
          detailImagesPanel.innerHTML = image
            ? `<img src="${image}" alt="${title} 产品详情图" loading="lazy" />`
            : `<div class="detail-images-empty">暂无详情图</div>`;
        } else if (detailHeroImage && image) {
          detailHeroImage.src = image;
          detailHeroImage.alt = `${title} 产品详情图`;
        }
        if (detailHeroTitle) detailHeroTitle.textContent = title;
        if (detailHeroDesc) detailHeroDesc.textContent = `${spec}。围绕性能、体验、服务和购买决策展示核心信息，支持继续向联想乐享咨询选型与对比。`;
        if (detailReviewOne) detailReviewOne.textContent = `${title} 在日常使用中响应稳定，适合按预算和场景做进一步选型。`;
        if (detailReviewTwo) detailReviewTwo.textContent = `外观质感和核心配置符合预期，${spec} 覆盖主要使用需求。`;
        if (detailReviewThree) detailReviewThree.textContent = "通过联想乐享可以继续确认优惠、门店服务和同类商品对比。";
        if (detailSpecGrid) {
          const specs = [
            ["品牌/系列", brand || "联想官方"],
            ["商品名称", title],
            ["核心规格", spec],
            ["服务支持", "官方保修与售后支持"],
            ["导购能力", "支持选型、优惠和对比咨询"],
            ["价格库存", "以实际下单页为准"]
          ];
          detailSpecGrid.innerHTML = specs.map(([label, value]) => `<div class="detail-spec-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
        }
      };
      const openProductDetail = (index) => {
        const config = pageConfigs[currentPageKey] || pageConfigs.personal;
        const product = config.products[index] || config.products[0];
        const [brand, title, spec, price, visual, rawImage] = product;
        const image = resolveAssetUrl(rawImage);
        if (detailTitle) detailTitle.textContent = title;
        if (detailSummary) detailSummary.textContent = `${spec}，适合按照预算、用途和服务需求进行选择，支持继续向联想乐享 AI 助手咨询对比。`;
        if (detailPrice) detailPrice.textContent = price;
        if (detailVisualWrap) {
          detailVisualWrap.innerHTML = image
            ? `<img class="detail-product-image" src="${image}" alt="${title}" data-detail-visual />`
            : `<div class="laptop${visual ? ` ${visual}` : ""}" data-detail-visual><div class="screen"></div><div class="base"></div></div>`;
        } else if (detailVisual) {
          detailVisual.className = `laptop${visual ? ` ${visual}` : ""}`;
        }
        updateStaticDetailPanels({ brand, title, spec, image });
        if (content) {
          content.dataset.view = "detail";
          content.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
      const applyPage = (pageKey) => {
        if (pageKey === "home") {
          currentPageKey = "home";
          body.dataset.page = "home";
          body.classList.remove("assistant-collapsed", "assistant-right", "assistant-fullscreen");
          switchButton?.setAttribute("aria-pressed", "false");
          assistantToggle?.setAttribute("aria-expanded", "false");
          if (content) content.dataset.view = "home";
          navPageButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.page === "home");
          });
          content?.scrollTo({ top: 0, behavior: "smooth" });
          refreshHomeReveal();
          return;
        }
        if (pageKey === "brand") {
          currentPageKey = "brand";
          body.dataset.page = "brand";
          body.classList.remove("assistant-collapsed", "assistant-right", "assistant-fullscreen");
          switchButton?.setAttribute("aria-pressed", "false");
          assistantToggle?.setAttribute("aria-expanded", "true");
          if (content) content.dataset.view = "brand";
          navPageButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.page === "brand");
          });
          content?.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const config = pageConfigs[pageKey] || pageConfigs.personal;
        currentPageKey = pageConfigs[pageKey] ? pageKey : "personal";
        body.dataset.page = currentPageKey;
        body.classList.remove("assistant-collapsed");
        assistantToggle?.setAttribute("aria-expanded", "true");
        if (content) content.dataset.view = "list";
        navPageButtons.forEach((button) => {
          button.classList.toggle("active", button.dataset.page === pageKey);
        });
        if (heroKicker) heroKicker.textContent = config.kicker;
        if (heroTitle) heroTitle.textContent = config.title;
        categoryButtons.forEach((button, index) => {
          button.textContent = config.categories[index] || "";
          button.classList.toggle("active", index === 0);
          button.hidden = !config.categories[index];
        });
        productCards.forEach((card, index) => {
          const product = config.products[index] || config.products[0];
          const [brand, title, spec, price, visual, rawImage] = product;
          const image = resolveAssetUrl(rawImage);
          const brandNode = card.querySelector(".brand-mini");
          const titleNode = card.querySelector(".product-title");
          const specNode = card.querySelector(".spec");
          const priceNode = card.querySelector(".price");
          const visualNode = card.querySelector(".product-visual");
          if (brandNode) {
            brandNode.textContent = brand;
            brandNode.classList.toggle("orange", brand === "Lecoo");
          }
          if (titleNode) titleNode.textContent = title;
          if (specNode) specNode.textContent = spec;
          if (priceNode) priceNode.textContent = price;
          if (visualNode) {
            visualNode.innerHTML = image
              ? `<img src="${image}" alt="${title}" />`
              : `<div class="laptop${visual ? ` ${visual}` : ""}"><div class="screen"></div><div class="base"></div></div>`;
          }
          card.dataset.productIndex = String(index);
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `查看${title}商品详情`);
        });
      };
      productCards.forEach((card) => {
        card.addEventListener("click", () => {
          openProductDetail(Number(card.dataset.productIndex || 0));
        });
        card.addEventListener("keydown", (event) => {
          if (!["Enter", " "].includes(event.key)) return;
          event.preventDefault();
          openProductDetail(Number(card.dataset.productIndex || 0));
        });
      });
      detailBack?.addEventListener("click", () => {
        if (content) {
          content.dataset.view = "list";
          content.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      navPageButtons.forEach((button) => {
        button.addEventListener("click", () => {
          applyPage(button.dataset.page);
        });
      });
      pageJumpButtons.forEach((button) => {
        button.addEventListener("click", () => {
          applyPage(button.dataset.pageJump);
        });
      });
      heroModeOptions.forEach((button) => {
        button.addEventListener("click", () => {
          heroModeOptions.forEach((option) => {
            const isActive = option === button;
            option.classList.toggle("is-active", isActive);
            option.setAttribute("aria-pressed", String(isActive));
          });
          // 首页「快速/思考」选择同步到对话区「深度思考」开关
          const wantThink = button.textContent.trim() === "思考";
          window.__lxThinking = wantThink;
          const thinkChip = document.querySelector('.composer .chip[data-mode-chip="think"]');
          if (thinkChip) {
            thinkChip.classList.toggle("is-active", wantThink);
            thinkChip.setAttribute("aria-pressed", String(wantThink));
          }
        });
      });
      document.querySelectorAll('.composer .chip[data-mode-chip]').forEach((chip) => {
        const toggleChip = () => {
          const active = chip.classList.toggle("is-active");
          chip.setAttribute("aria-pressed", String(active));
          if (chip.dataset.modeChip === "think") window.__lxThinking = active;
          if (chip.dataset.modeChip === "web") window.__lxWebSearch = active;
        };
        chip.addEventListener("click", toggleChip);
        chip.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggleChip();
        });
      });
      heroSuggestions.forEach((button) => {
        button.addEventListener("click", () => {
          if (!heroComposerTextarea) return;
          heroComposerTextarea.value = button.textContent.trim();
          heroComposerTextarea.focus();
        });
      });
      setupRotatingTitle();
      setupHeroCarousel();
      applyPage(params.get("page") || "home");
      if (params.has("detail")) {
        openProductDetail(Number(params.get("detail") || 0));
      }
      if (params.get("state") === "chat") {
        body.dataset.state = "chat";
      }
      if (params.get("demo") === "hover") {
        body.dataset.state = "chat";
        body.dataset.demo = "hover";
      }
      const startControls = document.querySelectorAll("[data-start-chat]");
      startControls.forEach((control) => {
        control.addEventListener("click", (event) => {
          event.preventDefault();
          body.dataset.state = "chat";
        });
      });
      const historyButton = document.querySelector(".history-button");
      const historySidebar = document.querySelector(".assistant-history-sidebar");
      const historyClose = document.querySelector(".assistant-history-close");
      const setHistorySidebar = (open) => {
        body.classList.toggle("assistant-history-open", open);
        historyButton?.classList.toggle("is-active", open);
        historyButton?.setAttribute("aria-expanded", String(open));
        historySidebar?.setAttribute("aria-hidden", String(!open));
      };
      historyButton?.addEventListener("click", () => {
        const nextOpen = !body.classList.contains("assistant-history-open");
        if (nextOpen) {
          setAssistantFullscreen(true);
        }
        setHistorySidebar(nextOpen);
      });
      historyClose?.addEventListener("click", () => {
        setHistorySidebar(false);
      });
      const resizeComposer = () => {
        if (!composerTextarea) return;
        composerTextarea.style.height = "auto";
        const maxHeight = parseFloat(getComputedStyle(composerTextarea).maxHeight) || 118;
        const nextHeight = Math.min(composerTextarea.scrollHeight, maxHeight);
        composerTextarea.style.height = `${nextHeight}px`;
        composerTextarea.style.overflowY = composerTextarea.scrollHeight > maxHeight ? "auto" : "hidden";
      };
      composerTextarea?.addEventListener("input", resizeComposer);
      resizeComposer();
      const resizeHeroComposer = () => {
        if (!heroComposerTextarea) return;
        heroComposerTextarea.style.height = "auto";
        const nextHeight = Math.min(heroComposerTextarea.scrollHeight, 132);
        heroComposerTextarea.style.height = `${nextHeight}px`;
      };
      heroComposerTextarea?.addEventListener("input", resizeHeroComposer);
      resizeHeroComposer();
      heroComposer?.addEventListener("submit", (event) => {
        event.preventDefault();
        applyPage("personal");
        body.dataset.state = "chat";
      });

      const shell = document.querySelector(".shell");
      const panelResizer = document.querySelector(".panel-resizer");
      const clampPanelWidth = (width) => {
        const minWidth = window.innerWidth <= 1280 ? 300 : 312;
        const maxWidth = Math.min(window.innerWidth * 0.42, window.innerWidth <= 1280 ? 420 : 720);
        return Math.round(Math.max(minWidth, Math.min(width, maxWidth)));
      };
      const setPanelWidth = (width) => {
        body.style.setProperty("--assistant-panel-width", `${clampPanelWidth(width)}px`);
      };
      const setAssistantFullscreen = (expanded) => {
        body.classList.toggle("assistant-fullscreen", expanded);
        if (expanded) {
          body.classList.remove("assistant-collapsed", "assistant-right");
          switchButton?.setAttribute("aria-pressed", "false");
        } else {
          setHistorySidebar(false);
        }
        assistantToggle?.setAttribute("aria-expanded", String(expanded));
        assistantToggle?.setAttribute("aria-pressed", String(expanded));
        assistantToggle?.setAttribute("aria-label", expanded ? "退出全屏对话" : "对话全屏");
        assistantToggle?.setAttribute("title", expanded ? "退出全屏对话" : "对话全屏");
      };
      const setAssistantCollapsed = (collapsed) => {
        if (collapsed) setAssistantFullscreen(false);
        body.classList.toggle("assistant-collapsed", collapsed);
        assistantToggle?.setAttribute("aria-expanded", String(!collapsed));
      };
      assistantToggle?.addEventListener("click", () => {
        setAssistantFullscreen(!body.classList.contains("assistant-fullscreen"));
      });
      heroPanelCollapse?.addEventListener("click", () => {
        setAssistantFullscreen(true);
        body.dataset.state = "default";
        composerTextarea?.focus();
      });
      assistantRestore?.addEventListener("click", () => {
        setAssistantCollapsed(false);
      });
      switchButton?.addEventListener("click", () => {
        setAssistantFullscreen(false);
        const isRight = body.classList.toggle("assistant-right");
        switchButton.setAttribute("aria-pressed", String(isRight));
      });
      panelResizer?.addEventListener("pointerdown", (event) => {
        if (body.classList.contains("assistant-collapsed") || body.classList.contains("assistant-fullscreen")) return;
        event.preventDefault();
        panelResizer.setPointerCapture(event.pointerId);
        body.classList.add("is-resizing");
      });
      panelResizer?.addEventListener("pointermove", (event) => {
        if (!body.classList.contains("is-resizing") || !shell) return;
        const shellRect = shell.getBoundingClientRect();
        const shellStyles = getComputedStyle(shell);
        const shellPaddingLeft = parseFloat(shellStyles.paddingLeft) || 0;
        const shellPaddingRight = parseFloat(shellStyles.paddingRight) || 0;
        const width = body.classList.contains("assistant-right")
          ? shellRect.right - shellPaddingRight - event.clientX
          : event.clientX - shellRect.left - shellPaddingLeft;
        setPanelWidth(width);
      });
      panelResizer?.addEventListener("pointerup", (event) => {
        panelResizer.releasePointerCapture(event.pointerId);
        body.classList.remove("is-resizing");
      });
      panelResizer?.addEventListener("pointercancel", () => {
        body.classList.remove("is-resizing");
      });
      panelResizer?.addEventListener("dblclick", () => {
        body.style.removeProperty("--assistant-panel-width");
      });
      panelResizer?.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Home") {
          body.style.removeProperty("--assistant-panel-width");
          return;
        }
        const current = assistantPanel?.getBoundingClientRect().width || 336;
        const isRight = body.classList.contains("assistant-right");
        const delta = event.key === "ArrowRight" ? (isRight ? -12 : 12) : (isRight ? 12 : -12);
        setPanelWidth(current + delta);
      });

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/arrival-notice-flow-v1.js */
window.__p0Modules.sources["ud5d096a7151b8f98"]=function(){
// POC only: no phone number is transmitted or persisted.
window.__lxInstallArrivalNotice = function(api) {
const {d,j,I,N,O,z,ot,nt,Qe,xe,ye,ke,Ne,Uo,qe,bindDialog} = api;
function lxIsArrivalQuery(query) {
  return /^(?:请)?(?:为)?(?:联想)?天逸\s*510\s*Pro(?:开启|设置|订阅)?到货通知[。！!]?$/i.test(String(query || '').trim());
}
async function lxArrivalNoticeSkill() {
  return {
    text: '已为你准备这款商品的**到货通知**，请确认弹窗中的手机号后提交。本次为**演示流程**，不会实际订阅或发送短信。',
    id: 'modal:arrival-notice:1056661'
  };
}
let centerToastTimer = null;
// Compact centered feedback shared by subscription and solution selection.
function lxShowCenterToast(message) {
  let toast = document.querySelector('.lx-arrival-success-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'lx-arrival-success-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toast);
  }
  window.clearTimeout(centerToastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  centerToastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
    toast.textContent = '';
    centerToastTimer = null;
  }, 2400);
}
let activeArrivalCleanup = null;
function lxOpenArrivalNotice() {
  activeArrivalCleanup?.();
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  j('到货通知', `<div class="lx-arrival-content">
    <p class="lx-arrival-tip"><strong>温馨提示：</strong>当商品到货后，我们会通过短信第一时间通知您，请注意查收短信。手机号可使用浏览器已保存的资料自动填充，请核对后提交。</p>
    <form class="lx-arrival-form" novalidate>
      <div class="lx-arrival-input-wrap"><input id="lx-arrival-phone" aria-label="手机号码" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="请输入11位手机号码" aria-describedby="lx-arrival-error" required><button type="button" data-arrival-clear aria-label="清空手机号码">清空</button></div>
      <p id="lx-arrival-error" class="lx-arrival-error" role="alert"></p>
      <button class="detail-primary lx-arrival-confirm" type="submit">提交</button>
    </form>
  </div>`);
  const mask = I(), panel = mask.querySelector('.lx-p0-modal'), form = mask.querySelector('.lx-arrival-form');
  panel.classList.add('lx-arrival-dialog');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', '到货通知');
  const phone = form.querySelector('#lx-arrival-phone');
  const error = form.querySelector('.lx-arrival-error');
  let disposed = false;
  const clearError = () => {
    error.textContent = '';
    phone.removeAttribute('aria-invalid');
  };
  const fail = message => {
    clearError(); error.textContent = message; phone.setAttribute('aria-invalid', 'true'); phone.focus(); return false;
  };
  const validatePhone = () => /^1[3-9]\d{9}$/.test(phone.value.trim()) || fail('请输入有效的11位手机号码');
  form.querySelector('[data-arrival-clear]').addEventListener('click', () => { phone.value = ''; clearError(); phone.focus(); });
  phone.addEventListener('input', clearError);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (disposed) return;
    clearError();
    if (!validatePhone()) return;
    cleanup();
    N();
    lxShowCenterToast('订阅成功');
  });
  const onClose = event => { if (event.target === mask || event.target.closest('.lx-p0-close')) cleanup(); };
  const lifecycle = new MutationObserver(() => { if (!mask.classList.contains('show') || !form.isConnected) cleanup(); });
  const cleanup = () => {
    if (disposed) return;
    disposed = true; lifecycle.disconnect(); mask.removeEventListener('click', onClose, true);
    phone.value = '';
    if (form.isConnected && panel.classList.contains('lx-arrival-dialog')) panel.removeAttribute('aria-label');
    if (activeArrivalCleanup === cleanup) activeArrivalCleanup = null;
  };
  activeArrivalCleanup = cleanup;
  mask.addEventListener('click', onClose, true);
  lifecycle.observe(mask, {attributes:true, attributeFilter:['class']});
  lifecycle.observe(form.parentElement.parentElement, {childList:true});
  const keyHandler = event => {
    if (event.key === 'Escape') { event.preventDefault(); cleanup(); N(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  bindDialog(returnFocus, keyHandler);
  requestAnimationFrame(() => phone.focus());
}
O('arrival-notice', lxOpenArrivalNotice);
async function lxArrivalNoticeQuery(query) {
  const nonce = d.conversationNonce;
  d.sending = true; ot(); nt();
  d.queryHistory.push(query);
  (d.queryAnchors || (d.queryAnchors = [])).push(Math.max(0, xe().children.length - 1));
  Qe();
  const reply = ye('ai loading', '', ke(['正在调用 Skill（到货通知 · 演示）'], {collapsed:false, foldable:false, skillCount:0}));
  try {
    const result = await lxArrivalNoticeSkill();
    reply._raw = result.text;
    await Ne(reply, Uo(result.text));
    if (nonce !== d.conversationNonce || !reply.isConnected || !d.sending) return;
    const body = qe(reply);
    body.insertAdjacentHTML('afterbegin', ke(['Skill（到货通知 · 演示）已完成：准备手机号确认表单，未提交订阅'], {collapsed:true, foldable:true, skillCount:1}));
    body.insertAdjacentHTML('beforeend', '<button class="answer-cta lx-store-appointment-cta lx-edu-auth-reco" type="button" data-lx-recommended-modal="arrival-notice" data-lx-recommended-modal-payload="1056661" data-lx-result-id="modal:arrival-notice:1056661" aria-label="打开到货通知弹窗"><span class="answer-cta-title">到货通知待确认</span><span class="answer-cta-icon" aria-hidden="true"><img src="/assets/icons/global-next.svg" alt=""></span></button>');
    xe().scrollTop = xe().scrollHeight;
    const card = body.querySelector('[data-lx-recommended-modal="arrival-notice"]');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all((card.getAnimations?.() || []).map(animation => animation.finished.catch(() => {})));
    if (nonce === d.conversationNonce && reply.isConnected && d.sending) z('arrival-notice', '1056661');
  } catch (error) {
    if (nonce === d.conversationNonce && reply.isConnected) await Ne(reply, Uo('到货通知演示暂未打开，请稍后重试。未提交任何订阅。'));
  } finally {
    if (nonce === d.conversationNonce) { d.sending = false; try { window.__lxSaveConversationNow?.(); } catch (error) {} }
  }
}
// Window capture runs before the existing document-level purchase handler.
window.addEventListener('click', event => {
  const button = event.target.closest?.('.product-detail .detail-actions .detail-primary');
  if (!button || button.textContent.trim() !== '到货通知') return;
  const title = button.closest('.product-detail').querySelector('[data-detail-title], .detail-title');
  if (!/^(?:联想)?天逸510Pro$/i.test(String(title?.textContent || '').replace(/\s+/g, ''))) return;
  event.preventDefault(); event.stopImmediatePropagation();
  z('arrival-notice', '1056661');
}, true);
window.__lxArrivalNotice = {matches:lxIsArrivalQuery, run:lxArrivalNoticeQuery, showToast:lxShowCenterToast};
};

};

/* public/leaip0/channel-customer-service-v126.js */
window.__p0Modules.sources["u6663a15bf799c69e"]=function(){
(function(){
  'use strict';
  if(window.__lxCustomerServiceV126)return;
  window.__lxCustomerServiceV126=true;
  const urls={
    'shop-chat':'https://lecs.lenovo.com.cn/',
    'b-chat':'https://b.lenovo.com.cn/activity/qygzxdhym.html',
    'biz-chat':'https://biz.lenovo.com.cn/activity/zqzxfljhy.html'
  };
  const labels={'shop-chat':'联想官方客服','b-chat':'中小企业客服','biz-chat':'政教及大企业客服'};
  function channel(){
    return location.pathname.split('/').find(part=>Object.hasOwn(urls,part))||
      ({personal:'shop-chat',business:'b-chat',enterprise:'biz-chat'})[document.body?.dataset.page]||'shop-chat';
  }
  function isHumanQuery(query){
    return /^(?:(?:请|麻烦)?(?:帮我|给我)?(?:我要|我想|我需要)?(?:找|联系|咨询|接入|转接|转|打开|呼叫)?)?(?:人工|真人)(?:客服|服务)?(?:一下|吧|呢|吗)?$/.test(String(query||'').trim().replace(/[\s，,。.!！?？：:“”"'‘’]/g,''));
  }
  function matches(query){
    if(isHumanQuery(query))return true;
    const text=String(query||'').trim().replace(/[\s，,。.!！?？：:“”"'‘’]/g,'');
    return /^(?:(?:请|麻烦)?(?:帮我|给我)?(?:我要|我想|我需要)?(?:找|联系|咨询|接入|转接|转|打开|进入|选择|呼叫|找一下|联系一下)?)?(?:联想|官方|在线|人工|真人|专属)?客服(?:页面|入口|中心)?(?:一下|吧|呢|吗)?$/.test(text)||/^(人工|转人工|找人工|转接人工|人工服务)$/.test(text);
  }
  const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function cardHtml(url,label){
    return '<button class="answer-cta lx-answer-page" type="button" data-customer-service-url="'+escape(url)+'" aria-label="选择客服，在新窗口打开官方客服页面">'+
      '<span class="answer-cta-copy"><span class="answer-cta-title">选择客服</span><span class="answer-cta-desc">'+escape(label)+' · 官方客服页面</span></span>'+
      '<span class="answer-cta-icon" aria-hidden="true">'+window.__lxApprovedIcon('global-next')+'</span></button>';
  }
  async function run(api){
    const gen=window.__lxGeneration,token=api.token,key=channel(),human=isHumanQuery(api.query),url=human?urls['shop-chat']:urls[key],label=labels[key];
    const copy=human?'您可以点击下方 **在线客服咨询**，在新页面联系联想官方客服。':'如需咨询产品、订单或服务问题，请点击下方 **「选择客服」**，进入'+label+'页面，再根据你的咨询内容选择对应服务。';
    api.busy(true);
    try{
      const reply=await gen.wait(token,api.answer(copy));
      if(!gen.current(token)||!reply?.isConnected)return false;
      api.card(reply,human?'<div class="lx-human-service-action"><button type="button" class="lx-human-service-link" data-customer-service-url="'+escape(url)+'" aria-label="在线客服咨询，在新页面打开">在线客服咨询</button></div>':cardHtml(url,label));
      api.save();
      return true;
    }finally{
      if(gen.current(token))api.busy(false);
    }
  }
  window.__lxCustomerServiceQuery={matches,run};
  window.addEventListener('click',function(event){
    const trigger=event.composedPath().find(node=>node?.matches?.('[data-customer-service-url], .shortcut-row button, .shortcut-row a, .more-menu .menu-row'));
    if(!trigger)return;
    const requested=trigger.getAttribute('data-customer-service-url');
    const shortcut=(trigger.textContent||'').trim()==='客服';
    if(!requested&&!shortcut)return;
    const url=requested||urls[channel()];
    if(!Object.values(urls).includes(url))return;
    event.preventDefault();event.stopImmediatePropagation();
    window.open(url,'_blank','noopener,noreferrer');
  },true);
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/channel-hotline-v125.js */
window.__p0Modules.sources["u1e03e65e1d10c612"]=function(){
(function(){
 'use strict';
 if(window.__lxChannelHotlineV125)return;window.__lxChannelHotlineV125=true;
 window.addEventListener('click',function(event){
  const button=event.composedPath().find(node=>node?.matches?.('.shortcut-row button, .shortcut-row a'));
  if(!button||(button.textContent||'').trim()!=='咨询热线')return;
  const channel=location.pathname.split('/').filter(Boolean)[0];
  const name=channel==='b-chat'?'中小企业':channel==='biz-chat'?'政教及大企业':'';
  if(!name||typeof window.__lxBridge?.sendChat!=='function')return;
  event.preventDefault();event.stopImmediatePropagation();
  window.__lxBridge.sendChat(name+'的咨询热线是多少？');
 },true);
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/core/empty-hover-backplate-collapse-v1.js */
window.__p0Modules.sources["u76ac0b7ce1e510c8"]=function(){
(function () {
  "use strict";

  if (window.__lxEmptyHoverBackplateCollapseV1) return;
  window.__lxEmptyHoverBackplateCollapseV1 = true;

  function hasVisiblePrompt(bottom) {
    var panel = bottom && bottom.querySelector(".hover-prompt-panel");
    if (!panel) return false;
    var list = panel.querySelector("[data-hover-prompt-list],.hover-prompt-list") || panel;
    return Array.from(list.children || []).some(function (child) {
      return !child.hidden && child.getAttribute("aria-hidden") !== "true" && String(child.textContent || "").trim();
    });
  }

  function collapseEmptyBackplates(root) {
    var bottoms = [];
    if (root && root.matches && root.matches(".assistant-bottom")) bottoms.push(root);
    if (root && root.querySelectorAll) bottoms = bottoms.concat(Array.from(root.querySelectorAll(".assistant-bottom")));
    if (!bottoms.length && root === document) bottoms = Array.from(document.querySelectorAll(".assistant-bottom"));

    bottoms.forEach(function (bottom) {
      if (hasVisiblePrompt(bottom)) return;
      bottom.classList.remove("has-hover-prompts");
      var panel = bottom.querySelector(".hover-prompt-panel");
      if (panel) {
        panel.style.removeProperty("height");
        panel.style.removeProperty("min-height");
      }
      var assistant = bottom.closest(".assistant-panel");
      if (assistant) assistant.classList.remove("assistant-hover-active", "assistant-glass-active");
    });
  }

  var queued = false;
  function schedule(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      collapseEmptyBackplates(root || document);
    });
  }

  new MutationObserver(function (records) {
    var relevant = records.some(function (record) {
      var target = record.target && record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return target && target.closest && target.closest(".assistant-bottom,.hover-prompt-panel");
    });
    if (relevant) schedule(document);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "aria-hidden"] });

  document.addEventListener("transitionend", function (event) {
    if (event.target && event.target.closest && event.target.closest(".assistant-bottom")) schedule(document);
  }, true);

  schedule(document);
})();

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/shared/inline-54fe4c623706.js */
window.__p0Modules.sources["u19f95e6c832cf15a"]=function(){
if (document.documentElement.classList.contains("lx-root-lxfd-prepaint")) {
        document.body.classList.add("assistant-fullscreen", "lx-auto-fs");
        document.body.dataset.state = "default";
      }

};

/* scripts/p0-source-runtime/leaip0/assets/frontend/js/shared/inline-dab1b3ae0743.js */
window.__p0Modules.sources["u8aeada2454e576fe"]=function(){
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

};

/* public/leaip0/assets/frontend/js/core/detail-operating-system-v1.js */
window.__p0Modules.sources["u6bb29bcc43fff595"]=function(){
/* The fixed operating-system option shares the product configuration styling. */
(() => {
  'use strict';
  function isComputer(product) {
    if (!product) return false;
    let specs=product.specs||{};
    if (typeof specs==='string') {try {specs=JSON.parse(specs);} catch (_) {specs={};}}
    const categories=[product.category,product.product_type,specs?.source_category,specs?.category].filter(Boolean).join(' ');
    if (/手机|平板|服务器|服务|配件|选件|外设|办公|显示器|打印|耗材|phone|tablet|server|service|accessor|monitor/i.test(categories)) return false;
    if (/笔记本|台式|一体机|工作站|ThinkPad|ThinkBook|扬天|电脑|laptop|notebook|desktop|workstation/i.test(categories)) return true;
    const name=String(product.name||'');
    if (/手机|平板|服务器|服务|清灰|保养|延保|配件|显示器|键盘|鼠标|耳机|支架|适配器|扩展坞|打印机|保护套|电脑包|笔记本包/i.test(name)) return false;
    return /笔记本|台式(?:机|电脑)|一体(?:机|电脑)|工作站|ThinkPad|ThinkBook|ThinkStation|昭阳|启天|扬天|天逸|GeekPro|YOGA\s+(?:Air|Pro)|拯救者\s*[YＲR]\d/i.test(name);
  }
  function render(product,anchor) {
    if (!anchor?.parentElement) return;
    const previous=anchor.parentElement.querySelector('[data-detail-os]');
    if (!isComputer(product)) {previous?.remove();return;}
    if (previous) return;
    const group=document.createElement('div');
    group.className='detail-variants lx-detail-os';
    group.setAttribute('data-detail-os','');
    group.innerHTML='<div class="lx-spu-head"><span>操作系统</span></div><div class="lx-spu-chips"><button class="lx-spu-chip is-active" type="button" aria-pressed="true" disabled><span class="lx-spu-chip-label">Windows 11 家庭中文版</span></button></div>';
    anchor.before(group);
  }
  window.__lxDetailOperatingSystem={isComputer,render};
})();

};

/* public/leaip0/assets/frontend/js/core/education-offer-query-v1.js */
window.__p0Modules.sources["ub21e263c0b382cd8"]=function(){
/* Education benefits use the existing authentication and product-result surfaces. */
(() => {
  'use strict';
  const marker = 'education-offer-20260915';
  const specsOf = p => { try { return typeof p?.specs === 'string' ? JSON.parse(p.specs) : p?.specs || {}; } catch { return {}; } };
  function matches(text) {
    const value = String(text || '').trim().replace(/\s+/g, '');
    if (!value || value.length > 160) return false;
    if (/(?:不要|不用|无需|不想|不需要|取消|停止|关闭).{0,10}(?:教育|学生|教师|老师|师生|高考)/.test(value)) return false;
    if (/对比|比较|下单|待支付|生成订单|支付订单|取消订单|订单详情|退款|退货/.test(value)) return false;
    if (/(?:购买|选购).{0,6}第[一二三四五六七八九十\d]+/.test(value)) return false;
    const offer = /(?:教育|学生|在校生|大学生|师生|教师|老师|高考).{0,16}(?:特惠|优惠|折扣|打折|福利|权益|补贴)|(?:教育|学生|教师|师生)(?:专享|专属)?价/.test(value);
    const authentication = /(?:教育|学生|在校生|大学生|师生|教师|老师|高考|学籍|学校邮箱|edu邮箱).{0,12}(?:认证|认定|核验)|(?:认证|认定|核验).{0,12}(?:教育身份|学生身份|教师身份|学籍)|教育认$/i.test(value);
    return offer || authentication;
  }
  const kind = text => /高考/.test(text) ? 'gaokao' : /教师|老师/.test(text) ? 'teacher' : 'college';
  const verified = () => window.__lxReadEducationState?.()?.status === 'verified';
  const isProducts = products => Array.isArray(products) && products.length > 0 && products.every(p => specsOf(p).lx_education_offer === marker);
  async function load(token, query) {
    const gen = window.__lxGeneration;
    const response = await gen.fetch(token, '/api/products?site=shop&limit=96', { cache:'no-store' });
    if (!response.ok) throw new Error('教育优惠商品加载失败');
    const payload = await gen.wait(token, response.json());
    if (!Array.isArray(payload)) throw new Error('商品数据不可用');
    // Keep the education zone's notebook/tablet selection and original catalog prices.
    // Eligibility and final education prices are confirmed by the activity and product detail.
    const seen = new Set();
    let products = payload.filter(p => {
      const sku = String(p?.sku || '');
      if (!sku || seen.has(sku) || !(Number(p.price) > 0) || !p.image_url || (p.status && p.status !== 'active')) return false;
      if (!/笔记本|平板/.test(p.category || '')) return false;
      seen.add(sku); return true;
    });
    if (/平板|pad/i.test(query)) products = products.filter(p => /平板/.test(p.category));
    else if (/笔记本|电脑|轻薄本|游戏本/.test(query)) products = products.filter(p => /笔记本/.test(p.category));
    const family = String(query).match(/YOGA|小新|拯救者|来酷/i)?.[0];
    if (family) products = products.filter(p => p.name.toLowerCase().includes(family.toLowerCase()));
    return products.slice(0, 12).map(p => ({...p, specs:{...specsOf(p), lx_education_offer:marker}}));
  }
  const copy = count => `发现你已经完成**教育优惠认证**，无需重复认证。已为你整理 **${count} 款教育优惠商品**，可结合学习、办公需求挑选。\n\n点击下方**查看教育优惠商品**，了解配置与价格，也可继续咨询或对比。具体优惠、适用资格及最终价格，以商品详情和活动规则为准。`;
  async function run(host) {
    const gen = window.__lxGeneration, token = host.token;
    if (!verified()) return await gen.wait(token, host.authenticate(kind(host.query)));
    host.busy(true);
    try {
      host.trace(['已识别教育优惠需求，正在读取认证状态', '教育身份已认证，正在调用 Skill(教育优惠商品推荐)'], false);
      const products = await gen.wait(token, load(token, host.query));
      if (!verified()) {
        await gen.wait(token, host.answer('教育认证状态已更新，请先完成**教育身份认证**后查看优惠商品。'));
        return await gen.wait(token, host.authenticate(kind(host.query)));
      }
      host.trace(['教育身份已认证，无需重复认证', 'Skill(教育优惠商品推荐) 已完成'], true);
      if (!products.length) {
        await gen.wait(token, host.answer('发现你已经完成**教育优惠认证**。暂时没有找到符合这次需求的商品，可换一个品牌或品类，或发送“教育特惠”查看当前商品。'));
        return;
      }
      await gen.wait(token, host.answer(copy(products.length)));
      const result = host.card(products);
      await gen.wait(token, new Promise(resolve => gen.timeout(token, resolve, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 720)));
      if (gen.current(token) && verified()) host.open(products, result);
    } catch (error) {
      if (gen.current(token)) await gen.wait(token, host.answer('你已完成**教育优惠认证**，商品暂时加载失败。请稍后重新发送“教育特惠”重试。'));
    } finally { if (gen.current(token)) { host.busy(false); host.save(); } }
  }
  window.__lxEducationOffers = { matches, kind, verified, isProducts, load, run };
})();

};

/* public/leaip0/assets/frontend/js/core/p0-direct-entry.js */
window.__p0Modules.sources["u3da97aba1824eaa7"]=function(){
/* Open existing read-only feature entrypoints; never submit an appointment or member action. */
(function () {
  if (!/^\/shop-chat\/(?:index\.html)?$/.test(location.pathname)) return;
  var feature = new URLSearchParams(location.search).get('p0entry');
  if (feature !== 'stores' && feature !== 'member') return;
  var opened = false;
  var deadline;
  function open() {
    if (opened) return;
    if (typeof window.__lxOpenFeature === 'function') {
      opened = true;
      window.__lxOpenFeature(feature);
      return;
    }
    if (Date.now() < deadline) window.setTimeout(open, 50);
  }
  function start() {
    deadline = Date.now() + 8000;
    window.requestAnimationFrame(open);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

};

/* public/leaip0/assets/frontend/js/core/service-products-query-v1.js */
window.__p0Modules.sources["ud0b6fc0181529458"]=function(){
/* Share the existing cleaning-service catalog across all recommendation entrypoints. */
(() => {
  'use strict';
  function matches(query) {
    const text = String(query || '').trim().replace(/\s+/g, '');
    if (!text || text.length > 180) return false;
    // Device-specific warranty requests use their existing eligibility and plan flow.
    if (/^为.+推荐可购买的(?:保修|延保)商品[。！!]?$/.test(text)) return false;
    if (/^我的设备是.+所在地区是.+请推荐可购买、可预约的清灰换硅脂服务商品$/.test(text)) return false;
    if (/(?:不要|不用|无需|不想|不需要|取消|停止|关闭).{0,10}(?:推荐|服务|清灰|保养|维修)/.test(text)) return false;
    if (/订单|退款|退货|联系客服|人工客服|优惠券|领券|对比|比较|支付|立即下单|预约时间|预约进度|是什么|什么意思/.test(text)) return false;
    const catalog = /服务(?:类)?(?:商品|产品|套餐|项目)|(?:清灰|清洁|除尘|保养|换硅脂|维修|延保|保修)(?:类)?(?:服务|商品|产品|套餐)/.test(text);
    const request = /推荐|看看|查看|有哪些|有什么|有啥|选购|想买|想购买|挑选|找|列表|清单/.test(text);
    const bare = /^(?:服务(?:类)?(?:商品|产品|套餐|项目))(?:推荐|列表|清单)?[。！!？?]?$/.test(text);
    const general = /(?:推荐|挑选|看看|查看|找).{0,8}服务[。！!？?]?$|服务(?:有哪些|有什么|有啥|推荐)(?:可以|值得)?(?:推荐)?[。！!？?]?$/.test(text);
    return bare || catalog && request || general;
  }
  function load() {
    const catalog = window.__lxServiceRecommendationProducts?.();
    if (!Array.isArray(catalog)) return [];
    return catalog.filter(product => /^SERVICE-/.test(String(product?.sku || '')) && /^(服务产品|服务商品)$/.test(product?.category || '')).map(product => ({...product}));
  }
  const copy = count => `已为你整理 **${count} 款服务商品**，包括**笔记本深度清灰、清灰换硅脂和整机清洁保养**。可结合设备型号、使用状况和所在地区，比较服务内容、价格与预约方式。下方推荐均为服务商品，具体适用机型、服务范围和可预约时间，以商品详情及实际确认为准。`;
  async function run(host) {
    const gen = window.__lxGeneration, token = host.token;
    host.busy(true);
    try {
      host.trace(['已识别服务商品推荐需求', '正在调用 Skill(服务商品推荐)'], false);
      const products = await gen.wait(token, Promise.resolve().then(load));
      await gen.wait(token, new Promise(resolve => gen.timeout(token, resolve, 600)));
      if (!products.length) {
        host.trace(['Skill(服务商品推荐) 未找到可用服务商品'], true);
        await gen.wait(token, host.answer('暂时没有找到可推荐的**服务商品**，请稍后重试。'));
        return;
      }
      host.trace(['已匹配清灰、换硅脂与清洁保养服务商品', 'Skill(服务商品推荐) 已完成'], true);
      await gen.wait(token, host.answer(copy(products.length)));
      const result = host.card(products);
      await gen.wait(token, new Promise(resolve => gen.timeout(token, resolve, window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 0 : 720)));
      if (gen.current(token)) host.open(products, result);
    } catch (error) {
      if (gen.current(token)) {
        host.trace(['Skill(服务商品推荐) 暂未完成'], true);
        await gen.wait(token, host.answer('**服务商品推荐**暂时未完成，请稍后重试。'));
      }
    } finally {
      if (gen.current(token)) { host.busy(false); host.save(); }
    }
  }
  window.__lxServiceProducts = {matches, load, copy, run};
})();

};

/* public/leaip0/assets/frontend/js/shared/inline-1cbc376bb123.js */
window.__p0Modules.sources["u6b7b2946a7296fd1"]=function(){
(function(){
        var rawPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/");
        var path = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "");
        if (path === "/") document.documentElement.classList.add("lx-root-lxfd-prepaint");
        if (["/shop-chat", "/b-chat", "/biz-chat", "/brand"].indexOf(path) >= 0) {
          document.documentElement.classList.add("lx-route-prepaint", "lx-shop-tabs-prepaint");
        }
      })();

};

/* public/leaip0/assets/frontend/js/shared/inline-6495b30fa986.js */
window.__p0Modules.sources["u7da36c0b14856c77"]=function(){
/* 商品卡智能光标独立兜底：不依赖商城主运行时的初始化结果。 */
      (function () {
        "use strict";
        /* The product dwell assistant is disabled site-wide. Keep the real
           assistant content intact and remove any state left by an old cache. */
        document.querySelectorAll(".ai-arrow,.lx-template-smart-cursor").forEach(function (node) { node.remove(); });
        document.querySelector(".assistant-bottom")?.classList.remove("has-hover-prompts");
        document.querySelector(".assistant-panel")?.classList.remove("assistant-hover-active", "assistant-glass-active");
        var stalePromptList = document.querySelector("[data-hover-prompt-list]");
        if (stalePromptList) stalePromptList.innerHTML = "";
        document.body.classList.remove("cursor-awake");
        return;
        var selector = ".content .product-card,.content .lx-floor-product-card,.content [data-floor-product],.content .lx-floor-product,.content .lx-sim-card,.content .lx-p0-product-mini,.content .reco-row,.content .lx-edu-card";
        var cursor = document.createElement("div");
        cursor.className = "lx-template-smart-cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.innerHTML = '<img src="../icons/smart-cursor.svg" alt=""><span class="lx-template-smart-cursor-label"><img src="../img/lx-icon-0016.png" alt="">乐享正在帮你</span>';
        document.body.appendChild(cursor);

        var activeCard = null;
        var dwellTimer = 0;
        var closeTimer = 0;

        function escapeHtml(value) {
          return String(value || "").replace(/[&<>\"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" }[char];
          });
        }

        function cardData(card) {
          return {
            name: card.dataset.detailTitle || card.dataset.floorProduct || card.querySelector(".product-title")?.textContent?.trim() || "这款联想商品",
            brand: card.dataset.detailBrand || card.querySelector(".brand-mini")?.textContent?.trim() || "联想",
            summary: card.dataset.detailSummary || card.querySelector(".spec")?.textContent?.trim() || "联想官方商品",
            price: card.dataset.detailPrice || card.querySelector(".price")?.textContent?.replace(/起\s*$/, "").trim() || "价格以页面为准",
            image: card.dataset.detailImage || card.querySelector(".product-visual img")?.getAttribute("src") || ""
          };
        }

        function questions(product) {
          var series = /拯救者/i.test(product.name) ? "拯救者" : /ThinkPad/i.test(product.name) ? "ThinkPad" : product.brand;
          var shortName = product.name.replace(/^联想\s*/i, "").slice(0, 12);
          return [series + "该如何选择？", shortName + "值得买吗？", shortName + "详细解读"];
        }

        function showAssistantPrompt(card) {
          if (card !== activeCard) return;
          var bottom = document.querySelector(".assistant-bottom");
          var panel = document.querySelector(".assistant-panel");
          var list = document.querySelector("[data-hover-prompt-list]");
          if (!bottom || !panel || !list) return;
          var product = cardData(card);
          var asks = questions(product);
          var thumb = product.image ? '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' : "<i></i>";
          list.innerHTML = '<div class="pop"><div class="box">' +
        '<button class="pop-close hover-prompt-close" type="button" aria-label="关闭商品推荐问题">×</button>' +
            '<div class="ctx"><div class="thumb">' + thumb + '</div><div class="ci"><div class="nm">' + escapeHtml(product.name) + '</div><div class="pr">' + escapeHtml(product.price) + '</div></div><span class="badge"><img src="../icons/global-sparkle.svg" alt="">你在看</span></div>' +
            '<div class="body"><div class="sum">' + escapeHtml(product.summary) + '，乐享可以继续帮你分析配置、价格和适用场景。</div><div class="divider"><span>乐享建议你问问</span></div><div class="acts">' +
            asks.map(function (text) { return '<button class="act" type="button" data-hover-prompt="' + escapeHtml(text) + '"><span class="ic"><img src="../icons/global-sparkle.svg" alt=""></span><span>' + escapeHtml(text) + '</span><span class="ar">›</span></button>'; }).join("") +
            '</div></div></div></div>';
          bottom.classList.add("has-hover-prompts");
          panel.classList.add("assistant-hover-active");
        }

        function hideAssistantPrompt() {
          document.querySelector(".assistant-bottom")?.classList.remove("has-hover-prompts");
          document.querySelector(".assistant-panel")?.classList.remove("assistant-hover-active");
          var list = document.querySelector("[data-hover-prompt-list]");
          if (list) list.innerHTML = "";
        }

        function arm(card) {
          window.clearTimeout(dwellTimer);
          activeCard = card;
          cursor.classList.remove("is-helping");
          dwellTimer = window.setTimeout(function () {
            if (activeCard !== card) return;
            cursor.classList.add("is-helping");
            showAssistantPrompt(card);
          }, 3000);
        }

        document.addEventListener("pointermove", function (event) {
          if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
          var card = event.target.closest?.(selector);
          cursor.style.transform = "translate3d(" + (event.clientX + 2) + "px," + (event.clientY + 2) + "px,0)";
          if (!card) {
            cursor.classList.remove("is-visible", "is-helping");
            window.clearTimeout(dwellTimer);
            if (activeCard) {
              activeCard = null;
              window.clearTimeout(closeTimer);
              closeTimer = window.setTimeout(hideAssistantPrompt, 4000);
            }
            return;
          }
          window.clearTimeout(closeTimer);
          cursor.classList.add("is-visible");
          if (card !== activeCard) arm(card);
        }, true);

        document.addEventListener("pointerleave", function () {
          cursor.classList.remove("is-visible", "is-helping");
          window.clearTimeout(dwellTimer);
          activeCard = null;
        });

        document.addEventListener("click", function (event) {
          if (event.target.closest?.(".hover-prompt-close")) hideAssistantPrompt();
        }, true);
      })();

};

/* public/leaip0/assets/frontend/js/shared/inline-f6883bac7348.js */
window.__p0Modules.sources["u68b904105831909e"]=function(){
/*
         * 必须早于运行时脚本注册：优先隔离顶栏购物车/订单点击，避免旧的通用
         * 新会话或商品推荐委托先处理同一次点击。
         */
        document.addEventListener("click", function (event) {
          var trigger = event.target.closest && event.target.closest("[data-commerce-entry]");
          if (!trigger || typeof window.lxOpenCommerceEntry !== "function") return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          Promise.resolve(window.lxOpenCommerceEntry(trigger.getAttribute("data-commerce-entry"), { sendQuery: true }))
            .catch(function (error) { console.error("[commerce-entry] failed", error); });
        }, true);

};
}
window.__p0Modules.dispatch(document.currentScript);

;
(function () {
  if (window.__lxAccountFeedbackInstalled) return;
  window.__lxAccountFeedbackInstalled = true;
  var style = document.createElement("style");
  style.textContent = `
    .account-menu .menu-row, .lxfd-account-menu .menu-row { width:100%; border:0; background:transparent; text-decoration:none; text-align:left; cursor:pointer; }
    .account-menu button.menu-row, .lxfd-account-menu button.menu-row { box-sizing:border-box; padding:0 14px; font:inherit; }
    .lx-feedback-mask { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(38,26,41,.62); }
    .lx-feedback-dialog { position:relative; box-sizing:border-box; width:min(616px, calc(81vw - 32px)); max-height:min(583px, calc(81vh - 32px)); overflow:auto; padding:28px 32px 24px; border-radius:18px; background:#fff; box-shadow:0 24px 70px rgba(45,18,52,.28),0 4px 14px rgba(45,18,52,.12); color:#17131a; }
    .lx-feedback-header { margin-bottom:12px; }
    .lx-feedback-title { margin:0; font-size:24px; line-height:1.35; font-weight:700; }
    .lx-feedback-subtitle { margin:4px 0 0; color:#999; font-size:16px; }
    .lx-feedback-close { position:absolute; top:26px; right:30px; width:30px; height:30px; border:0; background:transparent; color:#444; font-size:24px; line-height:1; cursor:pointer; }
    .lx-feedback-row { display:grid; grid-template-columns:112px minmax(0,1fr); gap:16px; align-items:start; margin-top:16px; }
    .lx-feedback-label { padding-top:8px; font-size:16px; font-weight:600; }
    .lx-feedback-field { min-width:0; }
    .lx-feedback-textarea, .lx-feedback-phone { width:100%; border:1px solid #e7e0ed; border-radius:9px; background:#fcfaff; color:#25212a; font-size:16px; outline:none; }
    .lx-feedback-textarea { min-height:140px; resize:vertical; padding:14px 16px 34px; }
    .lx-feedback-phone { max-width:320px; height:52px; padding:0 16px; }
    .lx-feedback-textarea:focus, .lx-feedback-phone:focus { border-color:#a262d7; box-shadow:0 0 0 2px rgba(162,98,215,.12); }
    .lx-feedback-textarea::placeholder, .lx-feedback-phone::placeholder { color:#c7c4cb; }
    .lx-feedback-counter { margin-top:-30px; padding-right:14px; text-align:right; color:#b6b2bb; font-size:14px; pointer-events:none; }
    .lx-feedback-images { display:flex; flex-wrap:wrap; gap:10px; }
    .lx-feedback-add { width:112px; height:112px; border:1px solid #eee8f2; border-radius:12px; background:#fcfaff; color:#b7b3bc; font-size:14px; cursor:pointer; }
    .lx-feedback-add span { display:block; font-size:26px; line-height:1.2; }
    .lx-feedback-preview { width:112px; height:112px; border-radius:10px; border:1px solid #eee8f2; object-fit:cover; }
    .lx-feedback-image-wrap { position:relative; }
    .lx-feedback-remove { position:absolute; top:5px; right:5px; width:26px; height:26px; border:0; border-radius:50%; color:#fff; background:rgba(0,0,0,.58); cursor:pointer; }
    .lx-feedback-error { min-height:16px; margin:6px 0 0; color:#c52a32; font-size:12px; }
    .lx-feedback-actions { display:flex; justify-content:flex-end; margin-top:12px; }
    .lx-feedback-submit { min-width:142px; height:50px; border:0; border-radius:28px; color:#fff; background:linear-gradient(100deg,#541451,#ba202d); font-size:16px; font-weight:600; cursor:pointer; }
    .lx-feedback-submit:hover { filter:brightness(1.04); }
    .lx-feedback-notice { position:fixed; z-index:10001; left:50%; bottom:28px; transform:translateX(-50%); padding:12px 20px; border-radius:8px; color:#fff; background:#342638; font-size:15px; }
    @media(max-height:760px) and (min-width:701px) { .lx-feedback-dialog{max-height:calc(100vh - 32px);padding:20px 24px 18px}.lx-feedback-header{margin-bottom:8px}.lx-feedback-title{font-size:22px}.lx-feedback-subtitle{font-size:14px}.lx-feedback-row{margin-top:12px}.lx-feedback-textarea{min-height:96px}.lx-feedback-add,.lx-feedback-preview{width:88px;height:88px}.lx-feedback-phone{height:44px}.lx-feedback-actions{margin-top:8px}.lx-feedback-submit{height:44px} }
    @media(max-width:700px) { .lx-feedback-mask{padding:12px}.lx-feedback-dialog{width:100%;max-height:calc(100vh - 24px);padding:24px 18px 20px;border-radius:16px}.lx-feedback-title{font-size:21px}.lx-feedback-subtitle{font-size:15px}.lx-feedback-close{top:20px;right:16px;width:28px;height:28px}.lx-feedback-row{grid-template-columns:1fr;gap:8px;margin-top:16px}.lx-feedback-label{padding-top:0;font-size:15px}.lx-feedback-textarea{min-height:120px;font-size:15px}.lx-feedback-phone{height:50px;font-size:15px}.lx-feedback-add,.lx-feedback-preview{width:96px;height:96px}.lx-feedback-submit{min-width:128px;height:46px;font-size:16px} }
  `;
  document.head.appendChild(style);
  var activeDialog = null;
  function showNotice(text) {
    var node = document.createElement("div");
    node.className = "lx-feedback-notice";
    node.setAttribute("role", "status");
    node.textContent = text;
    document.body.appendChild(node);
    window.setTimeout(function () { node.remove(); }, 2800);
  }
  function openFeedback(trigger) {
    document.querySelectorAll(".lx-p0-modal-mask.show").forEach(function (legacyMask) {
      var title = legacyMask.querySelector(".lx-p0-modal-title");
      if (title && title.textContent.trim() === "类目名称") legacyMask.classList.remove("show");
    });
    if (activeDialog) return;
    var previousFocus = trigger;
    var mask = document.createElement("div");
    mask.className = "lx-feedback-mask";
    mask.innerHTML = '<section class="lx-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="lxFeedbackTitle"><header class="lx-feedback-header"><h2 class="lx-feedback-title" id="lxFeedbackTitle">意见反馈</h2><p class="lx-feedback-subtitle">您的建议，帮助我们做得更好</p></header><button class="lx-feedback-close" type="button" aria-label="关闭">×</button><form novalidate><div class="lx-feedback-row"><label class="lx-feedback-label" for="lxFeedbackContent">反馈内容</label><div class="lx-feedback-field"><textarea class="lx-feedback-textarea" id="lxFeedbackContent" maxlength="500" placeholder="我们用心倾听来自您的声音（10-500字）" required></textarea><div class="lx-feedback-counter" aria-live="polite">0 / 500</div><p class="lx-feedback-error" data-error="content" role="alert"></p></div></div><div class="lx-feedback-row"><div class="lx-feedback-label">上传图片</div><div class="lx-feedback-field"><div class="lx-feedback-images"><button class="lx-feedback-add" type="button"><span aria-hidden="true">＋</span>添加图片<br>(0/3)</button></div><input class="lx-feedback-file" type="file" accept="image/*" multiple hidden><p class="lx-feedback-error" data-error="images" role="alert"></p></div></div><div class="lx-feedback-row"><label class="lx-feedback-label" for="lxFeedbackPhone"><span style="color:#e44b52">＊</span> 联系方式</label><div class="lx-feedback-field"><input class="lx-feedback-phone" id="lxFeedbackPhone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="请输入手机号" required><p class="lx-feedback-error" data-error="phone" role="alert"></p></div></div><div class="lx-feedback-actions"><button class="lx-feedback-submit" type="submit">提交</button></div></form></section>';
    document.body.appendChild(mask);
    activeDialog = mask;
    var dialog = mask.querySelector(".lx-feedback-dialog"), form = mask.querySelector("form");
    var content = mask.querySelector("#lxFeedbackContent"), counter = mask.querySelector(".lx-feedback-counter");
    var phone = mask.querySelector("#lxFeedbackPhone"), picker = mask.querySelector(".lx-feedback-file");
    var add = mask.querySelector(".lx-feedback-add"), imageList = mask.querySelector(".lx-feedback-images");
    var files = [];
    function cleanup() {
      if (!activeDialog) return;
      files.forEach(function (file) { if (file.url) URL.revokeObjectURL(file.url); });
      mask.remove(); activeDialog = null;
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }
    function clearErrors() { mask.querySelectorAll(".lx-feedback-error").forEach(function (node) { node.textContent = ""; }); }
    function renderImages() {
      imageList.querySelectorAll(".lx-feedback-image-wrap").forEach(function (node) { node.remove(); });
      files.forEach(function (file, index) {
        var wrap = document.createElement("div"); wrap.className = "lx-feedback-image-wrap";
        var image = document.createElement("img"); image.className = "lx-feedback-preview"; image.src = file.url; image.alt = "反馈图片";
        var remove = document.createElement("button"); remove.className = "lx-feedback-remove"; remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", "移除图片");
        remove.addEventListener("click", function () { URL.revokeObjectURL(file.url); files.splice(index, 1); renderImages(); });
        wrap.append(image, remove); imageList.insertBefore(wrap, add);
      });
      add.hidden = files.length >= 3;
      add.innerHTML = "<span aria-hidden=\"true\">＋</span>添加图片<br>(" + files.length + "/3)";
    }
    mask.querySelector(".lx-feedback-close").addEventListener("click", cleanup);
    mask.addEventListener("click", function (event) { if (event.target === mask) cleanup(); });
    add.addEventListener("click", function () { picker.click(); });
    picker.addEventListener("change", function () {
      Array.from(picker.files || []).forEach(function (file) {
        if (files.length >= 3 || !file.type.startsWith("image/")) return;
        files.push({ file: file, url: URL.createObjectURL(file) });
      });
      picker.value = ""; renderImages();
    });
    content.addEventListener("input", function () { counter.textContent = content.value.length + " / 500"; });
    form.addEventListener("submit", function (event) {
      event.preventDefault(); clearErrors();
      if (content.value.trim().length < 10) { mask.querySelector('[data-error="content"]').textContent = "请至少填写10个字"; content.focus(); return; }
      if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) { mask.querySelector('[data-error="phone"]').textContent = "请输入有效的手机号"; phone.focus(); return; }
      showNotice("当前反馈提交服务暂不可用，内容尚未发送");
    });
    mask.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); cleanup(); }
      if (event.key !== "Tab") return;
      var focusable = Array.from(dialog.querySelectorAll("button:not([hidden]), textarea, input:not([hidden])")).filter(function (node) { return node.getClientRects().length && !node.disabled; });
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
    });
    content.focus();
  }
  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-account-action=feedback]");
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openFeedback(trigger);
  }, true);
})();

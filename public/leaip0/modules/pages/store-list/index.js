/* 推荐门店列表 — P0 business implementations. */
if (!window.__p0Modules.installed["pages/store-list"]) {
window.__p0Modules.installed["pages/store-list"]=true;

/* store-business-status-v72-20261015 */
window.__p0StoreBusinessState = function (hours) {
  var match = String(hours || "").match(/(\d{1,2}):(\d{2})\s*[-–—~至]\s*(\d{1,2}):(\d{2})/);
  if (!match) return { open: true, label: "营业中" };
  var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  var minute = Number(parts.find(function (part) { return part.type === "hour"; }).value) * 60 + Number(parts.find(function (part) { return part.type === "minute"; }).value);
  var start = Number(match[1]) * 60 + Number(match[2]);
  var end = Number(match[3]) * 60 + Number(match[4]);
  var open = start <= end ? minute >= start && minute < end : minute >= start || minute < end;
  return { open: open, label: open ? "营业中" : "已打烊" };
};
window.__p0StoreBusinessBadge = function (hours) {
  var state = window.__p0StoreBusinessState(hours);
  return '<span class="lx-store-status ' + (state.open ? 'is-open' : 'is-closed') + '">' + state.label + '</span>';
};

/* Business: storeListItem */
window.__p0Modules.factories["pages/store-list#storeListItem:6c9eb8de266f0472d3514f34"]=function(__p0Scope){"use strict";return (function storeListItem(store, activeId, displayIndex) {
          return '<button class="lx-store-list-item' + (store.id === activeId ? ' is-active' : '') + '" type="button" data-store-id="' + store.id + '" aria-pressed="' + (store.id === activeId) + '">' +
            '<span class="lx-store-list-name"><span class="lx-store-list-index">' + (displayIndex || store.id) + '</span><b>' + store.name + '</b><span class="lx-store-distance">' + store.distance + '</span></span>' +
            '<span class="lx-store-list-meta">' + window.__p0StoreBusinessBadge(store.hours) + '<span>' + store.hours + '</span><span class="lx-store-type-badge">' + store.type + '</span><span class="lx-store-badge">' + store.tag + '</span></span>' +
          '</button>';
        }); };

/* Business: renderStoreResults */
window.__p0Modules.factories["pages/store-list#renderStoreResults:602b895c4b16ae7ba7ddfdb6"]=function(__p0Scope){"use strict";return (function renderStoreResults() {
            var results = (0,__p0Scope.getFilteredStores)();
            __p0Scope.visibleStores = results.slice();
            var list = __p0Scope.page.querySelector("[data-store-list]");
            __p0Scope.page.querySelector("[data-store-list-count]").textContent = results.length;
            list.innerHTML = results.length ? results.map(function (store, index) { return (0,__p0Scope.storeListItem)(store, __p0Scope.activeStore.id, index + 1); }).join("") : '<div class="lx-store-empty">暂未找到符合条件的门店<br>请调整业务、门店类型、地区或门店名称</div>';
            var resultIds = results.map(function (store) { return store.id; });
            __p0Scope.page.querySelectorAll(".lx-store-pin").forEach(function (pin) {
              var resultIndex = resultIds.indexOf(pin.dataset.id);
              pin.hidden = resultIndex < 0;
              var label = pin.querySelector("span");
              if (label && resultIndex >= 0) label.textContent = String(resultIndex + 1);
            });
            (0,__p0Scope.rebuildBaiduStoreMarkers)(results);
            if (!results.length) {
              __p0Scope.page.querySelector(".lx-map-card").hidden = true;
              return results;
            }
            if (!resultIds.includes(__p0Scope.activeStore.id)) __p0Scope.activeStore = results[0];
            (0,__p0Scope.selectStore)(__p0Scope.activeStore.id);
            return results;
          }); };
}
window.__p0Modules.dispatch(document.currentScript);

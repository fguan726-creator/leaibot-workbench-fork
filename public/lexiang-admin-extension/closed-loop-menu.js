(function () {
  'use strict';

  const BASE_PATH = '/admin-vue';
  const PENDING_KEY = 'lexiang.closedLoopDashboard.pending';
  const HOST_ID = 'lexiang-closed-loop-dashboard-host';
  const STYLE_ID = 'lexiang-closed-loop-dashboard-extension-style';
  const ROUTES = [
    {
      key: 'closed-loop',
      path: `${BASE_PATH}/ops/closed-loop-dashboard`,
      label: '\u95ed\u73af\u4ea4\u6613',
      src: '/lexiang-dashboard/lenovo-joy-closed-loop-dashboard.html?embedded=1',
    },
    {
      key: 'internal-closed-loop',
      path: `${BASE_PATH}/ops/internal-closed-loop-dashboard`,
      label: '\u3010\u5185\u90e8\u3011\u95ed\u73af\u4ea4\u6613',
      src: '/lexiang-dashboard/index.html?embedded=1',
    },
  ];

  const routeByPath = (path) => ROUTES.find((route) => route.path === path.replace(/\/$/, '')) || null;
  const routeByKey = (key) => ROUTES.find((route) => route.key === key) || null;
  const nativePushState = history.pushState.bind(history);
  const nativeReplaceState = history.replaceState.bind(history);
  const initialRoute = routeByPath(location.pathname);
  let activeRoute = initialRoute || routeByKey(sessionStorage.getItem(PENDING_KEY));
  let hasRenderedDashboard = false;
  let observer = null;
  let scheduled = false;

  function emitLocationChange() {
    window.dispatchEvent(new Event('lexiang:locationchange'));
  }

  history.pushState = function patchedPushState() {
    const result = nativePushState.apply(history, arguments);
    emitLocationChange();
    return result;
  };

  history.replaceState = function patchedReplaceState() {
    const result = nativeReplaceState.apply(history, arguments);
    emitLocationChange();
    return result;
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${HOST_ID} {
        width: 100%;
        height: calc(100dvh - 126px);
        min-height: 480px;
        overflow: hidden;
        border: 1px solid #dee0e3;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(31, 35, 41, .06);
      }
      #${HOST_ID} iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: #fff;
      }
      #breadcrumb.lexiang-closed-loop-active {
        position: relative;
      }
      #breadcrumb.lexiang-closed-loop-active > * {
        visibility: hidden;
      }
      #breadcrumb.lexiang-closed-loop-active::before,
      #breadcrumb.lexiang-closed-loop-active::after {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        white-space: nowrap;
      }
      #breadcrumb.lexiang-closed-loop-active::before {
        left: 0;
        content: '\\4e50\\4eab\\8fd0\\8425  /';
        color: #5f5a64;
      }
      #breadcrumb.lexiang-closed-loop-active::after {
        left: 82px;
        content: attr(data-lexiang-dashboard-title);
        color: #101010;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  function createMenuItem(route) {
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.dataset.lexiangDashboardKey = route.key;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const label = document.createElement('span');
    label.textContent = route.label;
    item.appendChild(label);
    const open = () => activate(route, true);
    item.addEventListener('click', open);
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
    });
    return item;
  }

  function findNativeMenuItem(submenu, route) {
    return [...submenu.children].find((item) => (
      item.classList?.contains('nav-item')
      && !item.dataset.lexiangDashboardKey
      && item.textContent.trim() === route.label
    )) || null;
  }

  function isNativeRouteAvailable(route) {
    const group = document.querySelector('.nav-group[data-group="dashboard"]');
    const submenu = group && group.querySelector('.nav-sub');
    return Boolean(submenu && findNativeMenuItem(submenu, route));
  }

  function ensureMenuItems() {
    const group = document.querySelector('.nav-group[data-group="dashboard"]');
    const submenu = group && group.querySelector('.nav-sub');
    if (!group || !submenu) return false;

    ROUTES.forEach((route) => {
      let item = submenu.querySelector(`[data-lexiang-dashboard-key="${route.key}"]`);
      if (findNativeMenuItem(submenu, route)) {
        item?.remove();
        return;
      }
      if (!item) {
        item = createMenuItem(route);
        submenu.appendChild(item);
      }
      item.classList.toggle('active', Boolean(activeRoute && activeRoute.key === route.key));
      item.setAttribute('aria-current', activeRoute && activeRoute.key === route.key ? 'page' : 'false');
    });

    if (activeRoute) {
      group.querySelector(':scope > .nav-item')?.classList.add('active');
      submenu.classList.add('open');
      group.querySelector(':scope > .nav-item')?.setAttribute('aria-expanded', 'true');
      group.querySelector(':scope > .nav-item .arrow')?.classList.add('open');
    }
    return true;
  }

  function hideUnderlyingContent(pageContent) {
    [...pageContent.children].forEach((child) => {
      if (child.id === HOST_ID || child.dataset.lexiangDashboardHidden === '1') return;
      child.dataset.lexiangDashboardHidden = '1';
      child.dataset.lexiangDashboardPreviousDisplay = child.style.display || '';
      child.style.display = 'none';
    });
  }

  function restoreUnderlyingContent() {
    document.querySelectorAll('[data-lexiang-dashboard-hidden="1"]').forEach((child) => {
      child.style.display = child.dataset.lexiangDashboardPreviousDisplay || '';
      delete child.dataset.lexiangDashboardHidden;
      delete child.dataset.lexiangDashboardPreviousDisplay;
    });
  }

  function updateBreadcrumb(route) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    if (!route) {
      breadcrumb.classList.remove('lexiang-closed-loop-active');
      breadcrumb.removeAttribute('data-lexiang-dashboard-title');
      return;
    }
    breadcrumb.classList.add('lexiang-closed-loop-active');
    breadcrumb.dataset.lexiangDashboardTitle = route.label;
  }

  function renderDashboard() {
    if (!activeRoute || location.pathname.endsWith('/login')) return false;
    const pageContent = document.getElementById('page-content');
    const group = document.querySelector('.nav-group[data-group="dashboard"]');
    if (!pageContent || !group) return false;

    injectStyles();
    hideUnderlyingContent(pageContent);
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement('section');
      host.id = HOST_ID;
      host.setAttribute('aria-label', activeRoute.label);
      const iframe = document.createElement('iframe');
      iframe.loading = 'eager';
      host.appendChild(iframe);
      pageContent.appendChild(host);
    }
    const iframe = host.querySelector('iframe');
    if (iframe.src !== new URL(activeRoute.src, location.origin).href) iframe.src = activeRoute.src;
    iframe.title = activeRoute.label;
    host.setAttribute('aria-label', activeRoute.label);
    updateBreadcrumb(activeRoute);
    hasRenderedDashboard = true;
    sessionStorage.setItem(PENDING_KEY, activeRoute.key);
    if (location.pathname !== activeRoute.path) {
      nativeReplaceState(history.state, '', activeRoute.path);
    }
    return true;
  }

  function removeDashboard() {
    document.getElementById(HOST_ID)?.remove();
    restoreUnderlyingContent();
    updateBreadcrumb(null);
    document.querySelectorAll('[data-lexiang-dashboard-key]').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-current', 'false');
    });
  }

  function activate(route, pushUrl) {
    activeRoute = route;
    hasRenderedDashboard = false;
    sessionStorage.setItem(PENDING_KEY, route.key);
    if (pushUrl && location.pathname !== route.path) nativePushState(history.state, '', route.path);
    scheduleSync();
  }

  function deactivate() {
    activeRoute = null;
    hasRenderedDashboard = false;
    sessionStorage.removeItem(PENDING_KEY);
    removeDashboard();
    scheduleSync();
  }

  function syncFromLocation() {
    const route = routeByPath(location.pathname);
    if (route) {
      activeRoute = route;
      sessionStorage.setItem(PENDING_KEY, route.key);
    } else if (hasRenderedDashboard) {
      deactivate();
      return;
    } else if (!activeRoute) {
      activeRoute = routeByKey(sessionStorage.getItem(PENDING_KEY));
    }
    scheduleSync();
  }

  function sync() {
    scheduled = false;
    ensureMenuItems();
    if (activeRoute && isNativeRouteAvailable(activeRoute)) {
      activeRoute = null;
      hasRenderedDashboard = false;
      sessionStorage.removeItem(PENDING_KEY);
      removeDashboard();
      return;
    }
    if (activeRoute) renderDashboard();
    else removeDashboard();
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click', (event) => {
    const navItem = event.target.closest('.nav-item');
    const isExistingChildItem = navItem && navItem.closest('.nav-sub') && !navItem.dataset.lexiangDashboardKey;
    if (isExistingChildItem && hasRenderedDashboard) deactivate();
    if (event.target.closest('.user-logout') && activeRoute) deactivate();
  }, true);

  window.addEventListener('popstate', syncFromLocation);
  window.addEventListener('lexiang:locationchange', syncFromLocation);

  function start() {
    observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

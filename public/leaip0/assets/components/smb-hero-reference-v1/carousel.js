(function () {
  'use strict';
  function initChannelCarousel() {
    var page = document.body && document.body.dataset.page;
    if (page !== 'business') return;
    var hall = document.querySelector('.content > .device-scene-hall');
    if (!hall || hall.dataset.unifiedCarouselReady === 'true') return;
    var sceneButtons = Array.from(hall.querySelectorAll('[data-device-scene]'));
    var previous = hall.querySelector('.device-scene-prev');
    var next = hall.querySelector('.device-scene-next');
    if (!sceneButtons.length || !previous || !next) return;
    hall.dataset.unifiedCarouselReady = 'true';

    var copy = hall.querySelector('.device-scene-copy');
    var productSource = hall.querySelector('.device-scene-product-popover strong');
    var description = hall.querySelector('[data-device-scene-desc]');
    var productLine = copy && copy.querySelector('.device-scene-product-name');
    if (copy && !productLine) {
      productLine = document.createElement('p');
      productLine.className = 'device-scene-product-name';
      copy.insertBefore(productLine, copy.querySelector('h2'));
    }
    var richerDescriptions = {
      '高效办公': '从日常协作到多任务处理，以稳定性能与灵活部署支撑团队高效运转。',
      '移动差旅': '兼顾轻薄、续航与可靠连接，让外出拜访、异地协作和移动办公更从容。',
      '专业设计': '以专业算力、稳定输出与高素质显示，加速设计、建模和创意交付。',
      '会议协作': '从智能会议到内容共享，打通远程沟通与团队协作的每个环节。',
      '成长型团队': '设备与服务按需扩展，帮助成长型团队降低管理压力、稳步提升生产力。',
      '制造行业': '以稳定算力、集中管理与可靠服务，贯通研发、生产和运营关键环节。',
      '教育行业': '覆盖智慧教学、科研计算与校园管理，让数字能力更好服务教育创新。',
      '政府行业': '构建安全可信、统一高效的数字底座，提升跨部门政务协同与服务效率。',
      '医疗行业': '以可靠终端、数据安全和智慧诊疗能力，支撑医疗业务稳定运行。',
      '金融行业': '兼顾核心业务安全、弹性智算与敏捷创新，服务金融场景持续升级。',
      '能源行业': '连接智能巡检、安全生产与绿色运营，助力能源体系低碳高效转型。',
      '交通行业': '贯通轨道、机场与高速运营数据，让交通管理和出行服务更加协同。',
      '服务行业': '从智慧门店到智能客服与供应链协同，持续提升服务效率和客户体验。'
    };
    var sceneProducts = {
      '高效办公': 'ThinkPad T14 2025',
      '移动差旅': 'ThinkPad X1 Carbon AI',
      '专业设计': 'ThinkPad P16s 2025',
      '会议协作': 'ThinkSmart 会议协作方案',
      '成长型团队': 'ThinkPad T14 2025',
      '制造行业': 'ThinkStation P 系列工作站',
      '教育行业': '联想智慧教育解决方案',
      '政府行业': '联想数字政府解决方案',
      '医疗行业': '联想智慧医院解决方案',
      '金融行业': '联想金融行业解决方案',
      '能源行业': '联想智慧能源解决方案',
      '交通行业': '联想智慧交通解决方案',
      '服务行业': '联想智慧服务解决方案'
    };

    var pagination = document.createElement('div');
    pagination.className = 'device-scene-pagination';
    pagination.setAttribute('role', 'tablist');
    pagination.setAttribute('aria-label', '场景轮播进度');
    var dots = sceneButtons.map(function (sceneButton, index) {
      var sceneName = (sceneButton.textContent || ('场景' + (index + 1))).trim();
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'device-scene-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', '切换到' + sceneName);
      var label = document.createElement('span');
      label.className = 'device-scene-label';
      label.textContent = sceneName;
      dot.appendChild(label);
      dot.addEventListener('click', function () {
        sceneButton.click();
        restartAfterSceneChange();
      });
      pagination.appendChild(dot);
      return dot;
    });
    hall.appendChild(pagination);

    var lastIndex = -1;
    var timer = 0;
    var settleTimer = 0;
    var autoplayDuration = 6500;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function activeIndex() {
      var index = sceneButtons.findIndex(function (button) { return button.classList.contains('is-active'); });
      return index < 0 ? 0 : index;
    }
    function syncDots(force) {
      var index = activeIndex();
      if (!force && index === lastIndex) return;
      lastIndex = index;
      dots.forEach(function (dot) {
        dot.classList.remove('is-active');
        dot.setAttribute('aria-selected', 'false');
        dot.removeAttribute('aria-current');
      });
      void pagination.offsetWidth;
      dots[index].classList.add('is-active');
      dots[index].setAttribute('aria-selected', 'true');
      dots[index].setAttribute('aria-current', 'true');
      var sceneName = (sceneButtons[index].textContent || '').trim();
      if (productLine) productLine.textContent = sceneProducts[sceneName] || (productSource && productSource.textContent.trim()) || '';
      if (description && richerDescriptions[sceneName]) description.textContent = richerDescriptions[sceneName];
    }
    function pause() {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
      timer = 0;
      settleTimer = 0;
      hall.classList.add('is-carousel-paused');
    }
    function start(forceReset) {
      if (timer && !forceReset) {
        hall.classList.remove('is-carousel-paused');
        return;
      }
      window.clearTimeout(timer);
      timer = 0;
      hall.classList.remove('is-carousel-paused');
      syncDots(true);
      if (!reducedMotion) timer = window.setTimeout(function () {
        timer = 0;
        next.click();
      }, autoplayDuration);
    }
    function restartAfterSceneChange() {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
      timer = 0;
      settleTimer = window.setTimeout(function () {
        settleTimer = 0;
        start(true);
      }, 170);
    }

    previous.addEventListener('click', function () {
      restartAfterSceneChange();
    });
    next.addEventListener('click', function () {
      restartAfterSceneChange();
    });
    var observer = new MutationObserver(function () { syncDots(false); });
    sceneButtons.forEach(function (button) {
      observer.observe(button, { attributes:true, attributeFilter:['class'] });
    });
    hall.addEventListener('mouseenter', pause);
    hall.addEventListener('mouseleave', function () { start(false); });
    hall.addEventListener('focusin', pause);
    hall.addEventListener('focusout', function (event) {
      if (!hall.contains(event.relatedTarget)) start(false);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else start(false);
    });
    syncDots(true);
    start(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChannelCarousel, {once:true});
  else initChannelCarousel();
})();

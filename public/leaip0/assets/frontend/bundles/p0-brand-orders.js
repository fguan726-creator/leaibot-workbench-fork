
;/* public/leaip0/assets/frontend/js/core/order-demo-data.js */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OrderDemoData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SERVICE_NOTICE = '此商品交付请查看商品详情页面服务说明为准，如有疑问可点击产品页下方在线客服咨询';
  var DEFAULT_RECIPIENT = {
    name: '王小明',
    phone: '181 0102 4147',
    address: '北京市海淀区上地西路 6 号联想北研大厦'
  };
  var DEFAULT_INVOICE = {
    type: '电子普通发票',
    title: '个人',
    taxpayerId: '不适用',
    content: '商品明细'
  };
  var DEFAULT_STORE = {
    method: '到店自提',
    name: '联想来酷智生活北京五彩城店',
    phone: '010-6291 8888',
    address: '北京市海淀区清河中街 68 号五彩城购物中心一层',
    hours: '10:00–22:00'
  };
  var PHYSICAL_STEPS = ['已下单', '仓库处理中', '已揽收', '运输中', '派送中', '已签收'];

  var products = {
    yoga: {
      name: 'YOGA Air 14 Aura AI 元启版',
      description: '酷睿 Ultra 7｜32GB｜1TB｜月光白',
      image: '/assets/img/shop-1.jpg',
      price: 7499
    },
    legion: {
      name: '拯救者 Y9000P 2026',
      description: '酷睿 Ultra 9｜RTX 5070｜冰魄白',
      image: '/assets/img/shop-2.jpg',
      price: 12999
    },
    thinkpad: {
      name: 'ThinkPad X1 Carbon Aura',
      description: '14 英寸商务旗舰｜32GB｜1TB',
      image: '/assets/img/shop-3.jpg',
      price: 10999
    },
    tablet: {
      name: '小新 Pad Pro 12.7',
      description: '3K 高刷屏｜12GB｜256GB｜深空灰',
      image: '/assets/img/shop-4.jpg',
      price: 2199
    },
    service: {
      name: '联想延长保修服务 2 年',
      description: '适用于指定笔记本｜电子服务凭证',
      image: '/assets/img/shop-5.jpg',
      price: 399
    },
    install: {
      name: '联想上门安装与数据迁移',
      description: '工程师上门｜系统设置｜数据迁移',
      image: '/assets/img/shop-6.jpg',
      price: 299
    },
    recharge: {
      name: '联想乐豆充值卡 500 元',
      description: '充值后可用于乐享商城指定商品',
      image: '/assets/img/shop-7.jpg',
      price: 500
    },
    option: {
      name: '联想小新 Air 蓝牙无线鼠标',
      description: '蓝牙 5.0｜轻音按键｜云墨灰',
      image: '/assets/img/shop-8.jpg',
      price: 99
    },
    customization: {
      name: 'A 面喷绘 · 仲夏星月',
      description: '个性化图案｜专属定制｜随主机交付',
      image: '/assets/img/shop-9.jpg',
      price: 69
    },
    gift: {
      name: '联想都市简约双肩包',
      description: '随主品赠送｜深空灰｜数量有限',
      image: '/assets/img/shop-10.jpg',
      price: 0
    },
    beanLaptop: {
      name: 'ThinkBook 15p 英特尔酷睿版',
      description: '酷睿 i5｜16GB｜512GB｜深空灰',
      image: '/assets/img/shop-11.jpg',
      price: 6499
    }
  };

  function item(product, quantity, role, beans) {
    return {
      role: role || '',
      name: product.name,
      description: product.description,
      image: product.image,
      quantity: quantity || 1,
      amount: product.price * (quantity || 1),
      beans: Number(beans || 0)
    };
  }

  function payment(goods, freight, discount, actual) {
    var payable = goods + freight - discount;
    return {
      goods: goods,
      freight: freight,
      discount: discount,
      payable: payable,
      actual: typeof actual === 'number' ? actual : payable
    };
  }

  function timeline(labels, currentIndex, times, canceled) {
    return labels.map(function (label, index) {
      var state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
      if (canceled && index > 0) state = 'upcoming';
      return {
        label: label,
        state: state,
        time: times[index] || ''
      };
    });
  }

  function trackingPackage(name, company, number, progress, route) {
    return {
      name: name,
      company: company,
      number: number,
      progress: progress,
      route: route,
      steps: PHYSICAL_STEPS.map(function (label, index) {
        return {
          label: label,
          state: index < progress ? 'complete' : index === progress ? 'current' : 'upcoming',
          time: index <= progress ? '2026-08-' + String(14 + index).padStart(2, '0') + ' ' + String(9 + index).padStart(2, '0') + ':20:18' : ''
        };
      })
    };
  }

  function normalOrder(config) {
    var labels = ['提交订单', '支付成功', '等待收货', '交易完成'];
    var times = [config.createdAt, config.paidAt || '', config.receivedAt || '', config.completedAt || ''];
    return Object.assign({
      type: 'normal',
      typeLabel: '普通订单',
      paymentMethod: config.paidAt ? '支付宝' : '待支付',
      items: [item(config.product || products.yoga, config.quantity || 1)],
      recipient: DEFAULT_RECIPIENT,
      invoice: DEFAULT_INVOICE,
      remark: '工作日送货，配送前请电话联系。',
      expectedDelivery: '2026-08-21 18:00:00',
      shipping: {
        mode: 'physical',
        packages: config.packages || [trackingPackage('包裹 1', '顺丰速运', 'SF1495827362014', config.shippingProgress == null ? 3 : config.shippingProgress, ['北京仓', '济南中转场', '北京海淀'])]
      }
    }, config, {
      timeline: timeline(labels, config.currentIndex, times, config.status === '已取消')
    });
  }

  function serviceOrder(config) {
    var labels = ['提交订单', '支付成功', '服务中', '服务完成'];
    var times = [config.createdAt, config.paidAt || '', config.serviceAt || '', config.completedAt || ''];
    return Object.assign({
      type: 'service',
      typeLabel: '服务订单',
      paymentMethod: config.paidAt ? '微信支付' : '待支付',
      items: [item(config.product || products.service, 1)],
      recipient: DEFAULT_RECIPIENT,
      invoice: DEFAULT_INVOICE,
      remark: '请安排在周六上午联系。',
      shipping: { mode: 'notice', notice: SERVICE_NOTICE }
    }, config, {
      timeline: timeline(labels, config.currentIndex, times, config.status === '已取消')
    });
  }

  function basePaymentFor(product, actual) {
    return payment(product.price, 0, 0, actual);
  }

  var orders = [
    normalOrder({
      id: '300000101', status: '待付款', createdAt: '2026-08-18 09:12:36', currentIndex: 0,
      countdownTarget: '2026-08-19T23:59:00+08:00', product: products.yoga,
      payment: basePaymentFor(products.yoga, 0)
    }),
    normalOrder({
      id: '300000102', status: '待发货', createdAt: '2026-08-17 14:26:08', paidAt: '2026-08-17 14:28:19', currentIndex: 1,
      product: products.legion, payment: payment(12999, 0, 500, 12499), shippingProgress: 1
    }),
    normalOrder({
      id: '300000103', status: '待收货', createdAt: '2026-08-15 10:03:42', paidAt: '2026-08-15 10:05:11', receivedAt: '2026-08-16 19:42:07', currentIndex: 2,
      product: products.thinkpad, payment: payment(10999, 0, 300, 10699),
      packages: [
        trackingPackage('包裹 1 · 电脑主机', '顺丰速运', 'SF1495827362014', 4, ['北京仓', '济南中转场', '北京海淀']),
        trackingPackage('包裹 2 · 配件赠品', '京东物流', 'JDVA00372958102', 3, ['上海仓', '天津分拣中心', '北京海淀'])
      ]
    }),
    normalOrder({
      id: '300000104', status: '交易完成', createdAt: '2026-08-09 16:18:25', paidAt: '2026-08-09 16:20:02', receivedAt: '2026-08-11 10:13:44', completedAt: '2026-08-12 18:06:19', currentIndex: 3,
      product: products.tablet, payment: payment(2199, 0, 200, 1999), shippingProgress: 5
    }),
    normalOrder({
      id: '300000105', status: '已取消', createdAt: '2026-08-12 11:07:59', currentIndex: 0,
      product: products.yoga, payment: basePaymentFor(products.yoga, 0), remark: '订单已由用户取消。'
    }),
    normalOrder({
      id: '300000106', status: '待发货', createdAt: '2026-08-18 08:33:15', paidAt: '2026-08-18 08:36:02', currentIndex: 1,
      product: products.yoga, payment: payment(7499, 0, 0, 7499), isExchange: true,
      remark: '原订单商品换货，新商品将优先发出。'
    }),
    normalOrder({
      id: '300000107', status: '待收货', createdAt: '2026-08-18 16:20:00', paidAt: '2026-08-18 16:22:18', receivedAt: '2026-08-20 10:18:36', currentIndex: 2,
      items: [item(products.yoga, 1, '主品'), item(products.option, 1, '选件')],
      payment: payment(7598, 0, 99, 7499),
      packages: [
        trackingPackage('包裹 1 · YOGA Air 14', '顺丰速运', 'SF1495827362107', 4, ['北京仓', '济南中转场', '北京海淀']),
        trackingPackage('包裹 2 · 蓝牙无线鼠标', '京东物流', 'JDVA00372958107', 3, ['上海仓', '天津分拣中心', '北京海淀'])
      ],
      remark: '主品与选件可能分包裹送达。'
    }),
    normalOrder({
      id: '300000108', status: '待发货', createdAt: '2026-08-18 17:02:11', paidAt: '2026-08-18 17:04:26', currentIndex: 1,
      items: [item(products.legion, 1, '主品'), item(products.service, 1, '服务')],
      payment: payment(13398, 0, 399, 12999),
      packages: [trackingPackage('包裹 1 · 拯救者 Y9000P', '顺丰速运', 'SF1495827362108', 1, ['北京仓', '济南中转场', '北京海淀'])],
      remark: '延长保修服务不单独生成物流包裹。'
    }),
    normalOrder({
      id: '300000109', status: '待发货', createdAt: '2026-08-18 17:16:45', paidAt: '2026-08-18 17:18:02', currentIndex: 1,
      items: [item(products.thinkpad, 1, '主品'), item(products.customization, 1, '私定')],
      payment: payment(11068, 0, 69, 10999),
      packages: [trackingPackage('包裹 1 · ThinkPad 私定版', '顺丰速运', 'SF1495827362109', 1, ['深圳仓', '武汉中转场', '北京海淀'])],
      remark: '私定图案将随主品制作并一同交付。'
    }),
    normalOrder({
      id: '300000110', status: '待收货', createdAt: '2026-08-18 17:31:08', paidAt: '2026-08-18 17:32:41', receivedAt: '2026-08-20 12:06:12', currentIndex: 2,
      items: [item(products.tablet, 1, '主品'), item(products.gift, 1, '赠品')],
      payment: payment(2199, 0, 0, 2199),
      packages: [trackingPackage('包裹 1 · 小新 Pad Pro 与赠品', '京东物流', 'JDVA00372958110', 4, ['上海仓', '天津分拣中心', '北京海淀'])],
      remark: '赠品随主品一同发出，不单独计价。'
    }),
    normalOrder({
      id: '300000111', status: '待付款', createdAt: '2026-08-18 18:06:33', currentIndex: 0,
      countdownTarget: '2026-08-19T23:59:00+08:00', isBeanRedemption: true,
      paymentMethod: '在线支付 + 乐豆',
      items: [item(products.beanLaptop, 1, '', 200)],
      payment: Object.assign(payment(6499, 0, 0, 0), { beans: 200 }),
      remark: '订单使用 200 乐豆抵扣，请在倒计时结束前完成现金部分支付。'
    }),
    serviceOrder({
      id: '300000201', status: '待付款', createdAt: '2026-08-18 11:18:20', currentIndex: 0,
      countdownTarget: '2026-08-19T23:59:00+08:00', payment: basePaymentFor(products.service, 0)
    }),
    serviceOrder({
      id: '300000202', status: '待服务', createdAt: '2026-08-17 09:05:31', paidAt: '2026-08-17 09:06:02', currentIndex: 1,
      product: products.install, payment: basePaymentFor(products.install, 299)
    }),
    serviceOrder({
      id: '300000203', status: '服务中', createdAt: '2026-08-16 13:11:44', paidAt: '2026-08-16 13:12:07', serviceAt: '2026-08-18 10:00:00', currentIndex: 2,
      product: products.install, payment: basePaymentFor(products.install, 299)
    }),
    serviceOrder({
      id: '300000204', status: '服务完成', createdAt: '2026-08-10 12:20:19', paidAt: '2026-08-10 12:21:06', serviceAt: '2026-08-12 09:30:00', completedAt: '2026-08-12 11:48:32', currentIndex: 3,
      payment: basePaymentFor(products.service, 399)
    }),
    serviceOrder({
      id: '300000205', status: '已取消', createdAt: '2026-08-11 08:20:10', currentIndex: 0,
      payment: basePaymentFor(products.service, 0), remark: '服务预约已取消。'
    }),
    {
      id: '300000301', type: 'presale', typeLabel: '预售订单', status: '待付定金',
      createdAt: '2026-08-18 00:00:00', paidAt: '', paymentMethod: '待支付', currentIndex: 0,
      countdownTarget: '2026-08-18T23:59:00+08:00', expectedDelivery: '2026-09-12 18:00:00',
      items: [item(products.legion, 1)], recipient: DEFAULT_RECIPIENT, invoice: DEFAULT_INVOICE,
      remark: '预售商品按尾款支付顺序发货。', payment: payment(12999, 0, 900, 0),
      presale: { deposit: 500, tailAmount: '待公布', tailPaymentAt: '2026-09-01 00:00:00' },
      timeline: timeline(['提交订单', '支付成功', '等待收货', '交易完成'], 0, ['2026-08-18 00:00:00', '', '', '']),
      shipping: { mode: 'physical', packages: [trackingPackage('包裹 1', '顺丰速运', '待生成', 0, ['预售准备中', '待出库', '待收货'])] }
    },
    {
      id: '300000302', type: 'presale', typeLabel: '预售订单', status: '待付尾款',
      createdAt: '2026-08-12 00:00:00', paidAt: '2026-08-12 00:02:31', paymentMethod: '支付宝', currentIndex: 0,
      countdownTarget: '2026-09-03T23:59:00+08:00', expectedDelivery: '2026-09-12 18:00:00',
      items: [item(products.legion, 1)], recipient: DEFAULT_RECIPIENT, invoice: DEFAULT_INVOICE,
      remark: '已支付定金，尾款开放后请及时完成支付。', payment: payment(12999, 0, 900, 500),
      presale: { deposit: 500, tailAmount: 11599, tailPaymentAt: '2026-09-01 00:00:00' },
      timeline: timeline(['提交订单', '支付成功', '等待收货', '交易完成'], 0, ['2026-08-12 00:00:00', '', '', '']),
      shipping: { mode: 'physical', packages: [trackingPackage('包裹 1', '顺丰速运', '待生成', 0, ['预售准备中', '待出库', '待收货'])] }
    },
    {
      id: '300000401', type: 'recharge', typeLabel: '充值订单', status: '交易完成',
      createdAt: '2026-08-13 17:42:06', paidAt: '2026-08-13 17:42:49', paymentMethod: '微信支付', currentIndex: 3,
      items: [item(products.recharge, 1)], recipient: DEFAULT_RECIPIENT,
      invoice: { text: '不开发票' }, remark: '卡密仅限充值账号本人使用。', payment: basePaymentFor(products.recharge, 500),
      recharge: { account: '18101024147', cardNumber: 'LX5A-9M2P-6Q8K', cardSecret: '7N4R-2W9X' },
      timeline: timeline(['提交订单', '支付成功', '等待收货', '交易完成'], 3, ['2026-08-13 17:42:06', '2026-08-13 17:42:49', '2026-08-13 17:43:08', '2026-08-13 17:43:22']),
      shipping: { mode: 'notice', notice: SERVICE_NOTICE }
    },
    {
      id: '300000402', type: 'recharge', typeLabel: '充值订单', status: '待发货',
      createdAt: '2026-08-18 13:03:12', paidAt: '2026-08-18 13:04:01', paymentMethod: '支付宝', currentIndex: 1,
      expectedDelivery: '2026-08-19 18:00:00',
      items: [item(products.recharge, 1)], recipient: DEFAULT_RECIPIENT,
      invoice: { text: '不开发票' }, remark: '充值预计在 10 分钟内到账。', payment: basePaymentFor(products.recharge, 500),
      recharge: { account: '18101024147' },
      timeline: timeline(['提交订单', '支付成功', '等待收货', '交易完成'], 1, ['2026-08-18 13:03:12', '2026-08-18 13:04:01', '', '']),
      shipping: { mode: 'notice', notice: SERVICE_NOTICE }
    },
    {
      id: '300000501', type: 'omoPickup', typeLabel: 'OMO 订单', status: '等待自提',
      createdAt: '2026-08-17 15:28:44', paidAt: '2026-08-17 15:29:20', paymentMethod: '微信支付', currentIndex: 2,
      items: [item(products.tablet, 1)], recipient: { name: '李晓琳', phone: '186 1038 5521', address: '' },
      store: DEFAULT_STORE, pickupCode: '726 419', invoice: { text: '请联系发货门店开具发票' },
      remark: '到店后请出示自提码和手机号。', payment: payment(2199, 0, 100, 2099),
      timeline: timeline(['提交订单', '支付成功', '到店自提', '交易完成'], 2, ['2026-08-17 15:28:44', '2026-08-17 15:29:20', '2026-08-18 11:16:02', '']),
      shipping: { mode: 'pickup', notice: '商品已备妥，请在门店营业时间内到店自提。' }
    },
    {
      id: '300000502', type: 'omoDelivery', typeLabel: 'OMO 订单', status: '待收货',
      createdAt: '2026-08-18 14:05:32', paidAt: '2026-08-18 14:06:04', paymentMethod: '支付宝', currentIndex: 2,
      expectedDelivery: '预计 3 小时送达', items: [item(products.yoga, 1)], recipient: DEFAULT_RECIPIENT,
      store: Object.assign({}, DEFAULT_STORE, { method: '门店闪送' }), invoice: { text: '请联系发货门店开具发票' },
      remark: '闪送配送前请电话联系。', payment: payment(7499, 18, 300, 7217),
      timeline: timeline(['提交订单', '支付成功', '等待收货', '交易完成'], 2, ['2026-08-18 14:05:32', '2026-08-18 14:06:04', '2026-08-18 14:38:19', '']),
      shipping: { mode: 'storeDelivery', packages: [trackingPackage('闪送订单', '门店闪送', 'LKS202608180052', 4, ['五彩城门店', '清河中街', '上地西路'])] }
    }
  ];

  var filters = {
    types: [
      { value: 'all', label: '全部类型' },
      { value: 'normal', label: '普通订单' },
      { value: 'presale', label: '预售订单' },
      { value: 'service', label: '服务订单' },
      { value: 'recharge', label: '充值订单' },
      { value: 'omo', label: 'OMO 订单' }
    ],
    statuses: ['全部', '待付款', '待发货', '待收货', '待服务', '服务中', '待付定金', '待付尾款', '等待自提', '交易完成', '服务完成', '已取消']
  };

  function validateTimestamp(value) {
    return !value || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  }

  function validateOrders(source) {
    var errors = [];
    var seen = new Set();
    source.forEach(function (order) {
      if (!/^3\d{8}$/.test(order.id)) errors.push(order.id + ': invalid id');
      if (seen.has(order.id)) errors.push(order.id + ': duplicate id');
      seen.add(order.id);
      if (!validateTimestamp(order.createdAt) || !validateTimestamp(order.paidAt)) errors.push(order.id + ': invalid timestamp');
      if (!Array.isArray(order.timeline) || order.timeline.length !== 4) errors.push(order.id + ': timeline must have four nodes');
      else if (order.timeline.some(function (node) { return !validateTimestamp(node.time); })) errors.push(order.id + ': invalid timeline timestamp');
      if (!Array.isArray(order.items) || order.items.length === 0) errors.push(order.id + ': missing items');
      if (!order.payment || order.payment.payable !== order.payment.goods + order.payment.freight - order.payment.discount) errors.push(order.id + ': payment total mismatch');
      if (!order.status || !order.type) errors.push(order.id + ': missing status or type');
    });
    return errors;
  }

  return {
    orders: orders,
    filters: filters,
    products: products,
    serviceNotice: SERVICE_NOTICE,
    validateOrders: validateOrders
  };
});

;


;/* public/leaip0/assets/frontend/js/core/order-center.js */
/* order-card-entry-v32-20260903 */
(function () {
        var body;
        var content;
        var chat;
        var commerceMounted = false;
        var ordersTabObserver = null;
        var assistantQueryObserver = null;
        var workspaceHandoffTimer = 0;
        var orderGenerationOverlay = null;
        var homeWorkspace = null;
        var orderData = window.OrderDemoData || { orders: [] };
        var orders = Array.isArray(orderData.orders) ? orderData.orders.slice() : [];
        var demoOrders = orders.slice();
        var liveOrderKey = "lexiang.orders.v1";

        function readLiveOrders() {
          try {
            var value = JSON.parse(localStorage.getItem(liveOrderKey) || "[]");
            return Array.isArray(value) ? value : [];
          } catch (error) {
            return [];
          }
        }

        function normalizeOrderTime(value) {
          if (!value) return "";
          var date = new Date(value);
          if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 19);
          var pad = function (number) { return String(number).padStart(2, "0"); };
          return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
        }

        function normalizeLiveOrder(source) {
          source = source || {};
          var id = source.orderId || source.id;
          if (!id) return null;
          var paid = Boolean(source.paidAt || source.paymentStatus === "paid" || source.payStatus === "paid" || source.status === "paid" || source.status === "已支付" || source.status === "已完成");
          var amount = Number(source.paidAmount ?? source.payable ?? source.price ?? source.payment?.actual ?? source.payment?.payable ?? 0);
          var original = Number(source.originalPrice ?? amount);
          var discount = Number(source.discountAmount ?? Math.max(0, original - amount));
          var config = source.configurationLabel || source.configLabel || source.specs || source.configuration || "";
          var color = source.colorLabel || source.color || "";
          var description = [config, color].filter(Boolean).join("｜") || "已同步订单配置";
          var address = source.address || source.shippingAddress || "";
          var recipient = source.recipient || {};
          if (typeof recipient !== "object" || Array.isArray(recipient)) recipient = {};
          return {
            id: String(id),
            type: source.type || "normal",
            typeLabel: source.typeLabel || "普通订单",
            status: paid ? "待发货" : "待付款",
            createdAt: normalizeOrderTime(source.createdAt || source.created_at || source.paidAt || Date.now()),
            paidAt: paid ? normalizeOrderTime(source.paidAt || source.updatedAt || Date.now()) : "",
            paymentMethod: source.paymentMethodLabel || source.paymentMethod || source.payMethod || "支付宝",
            items: [{
              role: "主品",
              name: source.name || source.productName || "联想商品",
              description: description,
              image: source.image_url || source.image || "/assets/img/shop-1.jpg",
              quantity: Number(source.quantity || 1),
              amount: amount,
              beans: 0
            }],
            recipient: {
              name: recipient.name || source.recipientName || "演示用户",
              phone: recipient.phone || source.phone || "138****0000",
              address: recipient.address || address || "北京市海淀区西北旺地区联想总部-东区"
            },
            invoice: source.invoice || { text: source.invoiceText || "不开发票" },
            remark: source.note || source.remark || "无",
            payment: {
              goods: original || amount,
              freight: Number(source.freight || 0),
              discount: discount,
              payable: amount,
              actual: paid ? amount : 0,
              beans: Number(source.beans || 0)
            },
            shipping: { mode: "physical", packages: [] },
            timeline: [
              { label: "提交订单", state: "complete", time: normalizeOrderTime(source.createdAt || source.paidAt || Date.now()) },
              { label: "支付成功", state: paid ? "complete" : "current", time: paid ? normalizeOrderTime(source.paidAt || Date.now()) : "" },
              { label: "等待发货", state: paid ? "current" : "upcoming", time: "" },
              { label: "交易完成", state: "upcoming", time: "" }
            ],
            __lxLiveOrder: true
          };
        }

        function syncLiveOrders() {
          var live = readLiveOrders().map(normalizeLiveOrder).filter(Boolean);
          var liveIds = new Set(live.map(function (order) { return String(order.id); }));
          orders = live.concat(demoOrders.filter(function (order) { return !liveIds.has(String(order.id)); }));
          if (commerceMounted) renderOrderList();
        }

        syncLiveOrders();

        var orderListState = { query: "", type: "all", status: "全部" };
        var orderTypeOptions = [
          ["all", "全部类型"],
          ["normal", "普通订单"],
          ["presale", "预售订单"],
          ["service", "服务订单"],
          ["recharge", "充值订单"],
          ["omo", "OMO 订单"],
          ["comboOption", "主品 + 选件"],
          ["comboService", "主品 + 服务"],
          ["comboCustomization", "主品 + 私定"],
          ["comboGift", "主品 + 赠品"],
          ["beanRedemption", "乐豆兑换"]
        ];
        var orderStatusOptions = ["全部", "待付款", "待发货", "待收货"];

        function escapeHtml(value) {
          return String(value).replace(/[&<>'\"]/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char];
          });
        }

        function matchesOrderType(order, type) {
          if (type === "all") return true;
          var orderType = order.type || "normal";
          if (type === "omo") return orderType === "omoPickup" || orderType === "omoDelivery";
          if (type === "beanRedemption") return order.isBeanRedemption === true;
          var scenarioRoles = {
            comboOption: "选件",
            comboService: "服务",
            comboCustomization: "私定",
            comboGift: "赠品"
          };
          if (scenarioRoles[type]) {
            var roles = (order.items || []).map(function (item) { return item.role; });
            return roles.includes("主品") && roles.includes(scenarioRoles[type]);
          }
          return type === orderType;
        }

        function formatCurrency(value) {
          return "¥" + Math.round(Number(value || 0)).toLocaleString("zh-CN");
        }

        function formatMixedAmount(value, beans) {
          var cash = formatCurrency(value);
          return Number(beans || 0) > 0 ? cash + " + " + Number(beans) + "乐豆" : cash;
        }

        function primaryItem(order) {
          return (order.items || [])[0] || {};
        }

        function orderAmount(order) {
          var payment = order.payment || {};
          return formatMixedAmount(payment.payable, payment.beans);
        }

        function orderBadges(order) {
          // 订单类型仍保留在数据层和详情页，列表卡片暂不展示类型标签。
          return [];
        }

        function statusExtra(order) {
          if (!order.countdownTarget) return "";
          var label = order.status === "待付定金" ? "定金支付截止" : order.status === "待付尾款" ? "尾款支付截止" : "付款截止";
          return label + " " + String(order.countdownTarget).replace("T", " ").replace("+08:00", "");
        }

        function filterOrders(query, type, status) {
          var needle = String(query || "").trim().toLocaleLowerCase("zh-CN");
          return orders.filter(function (order) {
            var searchable = [order.id].concat((order.items || []).map(function (item) { return item.name; })).join(" ").toLocaleLowerCase("zh-CN");
            var typeMatch = matchesOrderType(order, type);
            var statusMatch = status === "全部" || status === "all" || status === order.status;
            return typeMatch && statusMatch && (!needle || searchable.includes(needle));
          }).sort(function (a, b) {
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
          });
        }

        function orderCard(order) {
          var paidClass = ["待付款", "待付定金", "待付尾款"].includes(order.status) ? " is-paid" : "";
          var productRows = (order.items || []).map(function (item) {
            var role = item.role && item.role !== "主品" ? '<span class="lx-order-item-role">' + escapeHtml(item.role) + '</span>' : "";
            return '<div class="lx-order-card-product-row"><span class="lx-order-thumb"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '"></span><div class="lx-order-product">' + role + '<h2>' + escapeHtml(item.name) + '</h2><p>' + escapeHtml(item.description) + '</p><span>数量 × ' + escapeHtml(item.quantity) + '</span></div></div>';
          }).join("");
          var extra = statusExtra(order);
          var mixedClass = Number(order.payment && order.payment.beans || 0) > 0 ? " lx-order-mixed-amount" : "";
          return '<article class="lx-order-card" role="button" tabindex="0" aria-label="查看订单 ' + escapeHtml(order.id) + ' 详情" data-order-id="' + escapeHtml(order.id) + '" data-order-card="' + escapeHtml(order.id) + '" data-order-detail-id="' + escapeHtml(order.id) + '">' +
            '<header class="lx-order-card-head"><div><span>订单号 ' + escapeHtml(order.id) + '</span><span>' + escapeHtml(order.createdAt) + '</span></div><div class="lx-order-card-head-right"><strong class="lx-order-card-status' + paidClass + '">' + escapeHtml(order.status) + '</strong></div></header>' +
            '<div class="lx-order-card-body"><div class="lx-order-card-products">' + productRows + '</div>' +
            '<div class="lx-order-card-money"><span>应付金额</span><strong class="' + mixedClass.trim() + '">' + escapeHtml(orderAmount(order)) + '</strong></div>' +
            '<div class="lx-order-card-state"><strong>' + escapeHtml(order.status) + '</strong>' + (extra ? '<small>' + escapeHtml(extra) + '</small>' : '') + '</div></div>' +
          '</article>';
        }

        function renderOrderList() {
          if (!content) return;
          var list = content.querySelector("[data-orders-list]");
          if (!list) return;
          var filtered = filterOrders(orderListState.query, orderListState.type, orderListState.status);
          var grid = list.querySelector("[data-order-grid]");
          var empty = list.querySelector("[data-order-empty]");
          var count = list.querySelector("[data-order-count]");
          if (grid) {
            grid.innerHTML = filtered.map(orderCard).join("");
            grid.hidden = filtered.length === 0;
          }
          if (empty) empty.classList.toggle("is-active", filtered.length === 0);
          if (count) count.textContent = String(filtered.length);
          list.querySelectorAll("[data-order-status]").forEach(function (button) {
            var active = button.dataset.orderStatus === orderListState.status;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
          });
          var typeLabel = (orderTypeOptions.find(function (item) { return item[0] === orderListState.type; }) || orderTypeOptions[0])[1];
          var typeValue = list.querySelector("[data-order-type-value]");
          if (typeValue) typeValue.textContent = typeLabel;
          list.querySelectorAll("[data-order-type-option]").forEach(function (button) {
            var selected = button.dataset.orderTypeOption === orderListState.type;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-selected", String(selected));
          });
          var searchInput = list.querySelector("[data-order-search]");
          if (searchInput && searchInput.value !== orderListState.query) searchInput.value = orderListState.query;
        }

        function setOrderTypeMenu(open) {
          if (!content) return;
          var picker = content.querySelector("[data-order-type-picker]");
          if (!picker) return;
          var trigger = picker.querySelector("[data-order-type-trigger]");
          var menu = picker.querySelector("[data-order-type-menu]");
          picker.classList.toggle("is-open", open);
          if (trigger) trigger.setAttribute("aria-expanded", String(open));
          if (menu) menu.hidden = !open;
        }

        function streamSkillAnswer(question, skillName, paragraphs, options) {
          options = options || {};
          if (body) body.dataset.state = "chat";
          var oldFollowup = document.getElementById("lx-order-live-followup");
          if (oldFollowup) oldFollowup.hidden = true;
          var liveChat = document.querySelector(".assistant-panel .chat-state");
          var messages = liveChat.querySelector(".lx-p0-messages");
          if (!messages) {
            messages = document.createElement("div");
            messages.className = "lx-p0-messages";
            messages.setAttribute("aria-live", "polite");
            liveChat.appendChild(messages);
          }
          var userLine = document.createElement("div");
          userLine.className = "lx-p0-message msg user";
          userLine.innerHTML = '<div class="user-bubble">' + escapeHtml(question) + '</div>';
          var aiBlock = document.createElement("div");
          aiBlock.className = "lx-p0-message msg ai lx-chat-skin";
          aiBlock.id = "lx-order-live-followup";
          aiBlock.setAttribute("data-order-followup", "");
          var aiBody = document.createElement("div");
          aiBody.className = "ai-body";
          var trace = document.createElement("div");
          trace.className = "lx-skill-trace is-foldable";
          var skill = document.createElement("button");
          skill.type = "button";
          skill.className = "lx-skill-trace-fold";
          skill.setAttribute("data-lx-trace-toggle", "");
          skill.setAttribute("aria-expanded", "true");
          var label = document.createElement("span");
          label.className = "lx-skill-trace-fold-text";
          label.textContent = "正在调用 1 个 Skill";
          var caret = document.createElement("span");
          caret.className = "lx-skill-trace-fold-caret";
          caret.innerHTML = '<img src="../icons/global-collapse.svg" alt="" aria-hidden="true">';
          skill.appendChild(label);
          skill.appendChild(caret);
          var region = document.createElement("div");
          region.className = "lx-skill-trace-list";
          var detail = document.createElement("span");
          detail.className = "lx-skill-trace-item current";
          detail.textContent = "Skill（" + skillName + "）调用中";
          region.appendChild(detail);
          var answer = document.createElement("div");
          answer.className = "lx-order-standard-answer";
          answer.hidden = true;
          trace.appendChild(skill);
          trace.appendChild(region);
          aiBody.appendChild(trace);
          aiBody.appendChild(answer);
          aiBlock.appendChild(aiBody);
          messages.appendChild(userLine);
          messages.appendChild(aiBlock);
          liveChat.scrollTop = liveChat.scrollHeight;
          skill.addEventListener("click", function () {
            var collapsed = trace.classList.toggle("is-collapsed");
            skill.setAttribute("aria-expanded", String(!collapsed));
          });
          return new Promise(function (resolve) {
          setTimeout(function () {
            label.textContent = "正在获取数据";
            detail.textContent = "Skill（" + skillName + "）正在获取订单数据";
          }, 320);
          setTimeout(function () {
            label.textContent = "已完成 1 个 Skill 调用";
            detail.classList.remove("current");
            detail.textContent = "Skill（" + skillName + "）已调用";
            trace.classList.add("is-collapsed");
            skill.setAttribute("aria-expanded", "false");
            answer.hidden = false;
            answer.classList.add("lx-stream-cursor");
            var paragraphIndex = 0;
            var charIndex = 0;
            function writeNext() {
              if (paragraphIndex >= paragraphs.length) {
                answer.classList.remove("lx-stream-cursor");
                if (options.finalHtml) answer.innerHTML = options.finalHtml;
                if (options.cardHtml) answer.insertAdjacentHTML("beforeend", options.cardHtml);
                if (options.disclaimer) answer.insertAdjacentHTML("beforeend", '<p class="lx-p0-disclaimer">' + escapeHtml(options.disclaimer) + '</p>');
                liveChat.scrollTop = liveChat.scrollHeight;
                requestAnimationFrame(function () { requestAnimationFrame(function () { resolve(aiBlock); }); });
                return;
              }
              var source = paragraphs[paragraphIndex];
              var p = answer.children[paragraphIndex];
              if (!p) { p = document.createElement("p"); answer.appendChild(p); }
              p.textContent = source.slice(0, charIndex + 1);
              charIndex += 1;
              liveChat.scrollTop = liveChat.scrollHeight;
              if (charIndex >= source.length) { paragraphIndex += 1; charIndex = 0; setTimeout(writeNext, 70); }
              else setTimeout(writeNext, 13);
            }
            writeNext();
          }, 980);
          });
        }

        function buildThread() {
          return '<div class="lx-orders-thread">' +
            '<p class="lx-order-user">我有哪些订单？</p>' +
            '<div class="lx-order-ai"><div class="lx-order-skill"><img src="../icons/mall-orders.svg" alt=""><span>已完成 1 个 Skill 调用 · 订单查询</span></div>' +
              '<p>我为你查到 <strong>22 笔订单</strong>，其中 17 笔正在进行中，最近一笔下单时间为 2026-08-18。</p>' +
              '<p>订单列表已展示在右侧。点击任一订单卡片即可查看完整订单信息与物流轨迹。</p>' +
              '<button class="lx-order-result-card" type="button" data-open-orders><span class="lx-order-result-icon"><img src="../icons/global-next.svg" alt=""></span><span><strong>查看我的订单</strong><small>共 22 笔 · 17 笔进行中</small></span><img src="../icons/arrow-left.svg" alt=""></button>' +
            '</div>' +
          '</div>';
        }

        function buildOrdersPage() {
          return '<div class="lx-orders-page">' +
            '<nav class="lx-orders-tabs lx-tabbar" aria-label="已打开页面" hidden><button class="lx-orders-tab lx-tab is-active" type="button" data-workspace-view="orders" aria-current="page"><span class="lx-tab-label">我的订单</span><span class="lx-orders-tab-close lx-tab-close">×</span></button></nav>' +
            '<section class="lx-orders-list is-active" data-orders-list>' +
              '<header class="lx-orders-head"><div class="lx-orders-title-wrap"><h1>我的订单</h1><p>查看并管理你的联想乐享订单</p></div></header>' +
              '<div class="lx-order-result-meta"><strong data-order-count>' + orders.length + '</strong><span>笔订单</span></div>' +
              '<div class="lx-order-grid" data-order-grid>' + orders.map(orderCard).join("") + '</div>' +
              '<div class="lx-order-empty" data-order-empty><strong>暂无订单</strong><p>完成下单后，可以在这里查看订单信息。</p></div>' +
            '</section>' +
            '<section class="lx-order-detail" data-order-detail></section>' +
          '</div>';
        }

        function mountCommerceWorkspace() {
          removeWorkspaceHandoffSnapshot();
          if (commerceMounted || !content) return;
          var fragment = document.createDocumentFragment();
          while (content.firstChild) fragment.appendChild(content.firstChild);
          homeWorkspace = {
            fragment: fragment,
            className: content.className,
            ariaLabel: content.getAttribute("aria-label"),
            navLabel: document.querySelector(".main-nav")?.dataset.shopCurrentLabel || "",
            conversationName: document.querySelector(".lxfd-convo-name")?.textContent || ""
          };
          body.classList.add("lx-orders-poc", "lx-template-file");
          // Keep the page template's original workspace classes. Replacing the
          // complete className here made the right-hand frame jump as soon as
          // the generated order content was mounted.
          content.classList.add("lx-orders-content");
          content.setAttribute("aria-label", "我的订单");
          content.innerHTML = buildOrdersPage();
          // Shared result tabs are direct children of the right workspace.
          // Keeping the order rail inside .lx-orders-page bypassed the global
          // :has(> .lx-tabbar) spacing contract and left a second top inset.
          var mountedOrdersPage = content.querySelector(".lx-orders-page");
          var mountedOrdersTabbar = mountedOrdersPage && mountedOrdersPage.querySelector(":scope > .lx-orders-tabs");
          if (mountedOrdersPage && mountedOrdersTabbar) content.insertBefore(mountedOrdersTabbar, mountedOrdersPage);
          commerceMounted = true;
          renderOrderList();
          removeLegacyTabs();
          syncOrdersTabVisibility();
          var ordersTabbar = content.querySelector(".lx-orders-tabs");
          if (ordersTabbar && window.MutationObserver) {
            ordersTabObserver = new MutationObserver(syncOrdersTabVisibility);
            ordersTabObserver.observe(ordersTabbar, { childList: true });
          }
        }

        function removeWorkspaceHandoffSnapshot() {
          window.clearTimeout(workspaceHandoffTimer);
          workspaceHandoffTimer = 0;
          document.querySelectorAll(".lx-order-handoff-snapshot").forEach(function (node) { node.remove(); });
          if (body) body.classList.remove("lx-order-handoff-pending");
        }

        function finishWorkspaceHandoffAfterResultCard() {
          if (!document.querySelector(".lx-order-handoff-snapshot")) return;
          window.clearTimeout(workspaceHandoffTimer);
          workspaceHandoffTimer = window.setTimeout(removeWorkspaceHandoffSnapshot, 760);
        }

        function restoreHomeWorkspace(preserveCurrentView) {
          if (!commerceMounted || !homeWorkspace || !content) return;
          var snapshot = null;
          if (preserveCurrentView) {
            var currentOrdersPage = content.querySelector(".lx-orders-page");
            if (currentOrdersPage) {
              snapshot = document.createElement("div");
              snapshot.className = "lx-order-handoff-snapshot";
              snapshot.setAttribute("aria-hidden", "true");
              snapshot.appendChild(currentOrdersPage.cloneNode(true));
            }
          }
          content.replaceChildren(homeWorkspace.fragment);
          content.className = homeWorkspace.className;
          if (homeWorkspace.ariaLabel == null) content.removeAttribute("aria-label");
          else content.setAttribute("aria-label", homeWorkspace.ariaLabel);
          body.classList.remove("lx-orders-poc");
          if (ordersTabObserver) ordersTabObserver.disconnect();
          ordersTabObserver = null;
          commerceMounted = false;
          content.scrollTop = 0;
          var mainNav = document.querySelector(".main-nav");
          if (mainNav) mainNav.dataset.shopCurrentLabel = homeWorkspace.navLabel;
          var fullscreenName = document.querySelector(".lxfd-convo-name");
          if (fullscreenName && homeWorkspace.conversationName) fullscreenName.textContent = homeWorkspace.conversationName;
          if (snapshot) {
            content.appendChild(snapshot);
            body.classList.add("lx-order-handoff-pending");
          }
        }

        function isOrderQuery(text) {
          return /订单|物流|发货/.test(String(text || ""));
        }

        function isDirectOrderCenterQuery(text) {
          var normalized = String(text || "").replace(/[\s，。！？、,.!?]/g, "");
          return /^(?:我要|我想|帮我)?(?:查看|查询|打开)?(?:我的)?订单(?:中心|列表|记录)?$/.test(normalized);
        }

        function restoreSharedWorkspaceForQuery(node) {
          if (!node || node.nodeType !== 1) return;
          var resultCard = node.matches("[data-lx-result-id]") ? node : node.querySelector("[data-lx-result-id]");
          if (resultCard) finishWorkspaceHandoffAfterResultCard();
          if (!commerceMounted || orderIconFlowRunning) return;
          var userMessage = node.matches(".lx-p0-message.user, .msg.user") ? node : node.querySelector(".lx-p0-message.user, .msg.user");
          if (!userMessage) return;
          var bubble = userMessage.querySelector(".user-bubble");
          var query = (bubble || userMessage).textContent || "";
          if (!isOrderQuery(query)) restoreHomeWorkspace(false);
        }

        function setWorkspaceView(view) {
          if (view === "home") {
            restoreHomeWorkspace();
            return;
          }
          mountCommerceWorkspace();
          content.querySelectorAll("[data-workspace-view]").forEach(function(tab){
            var active = tab.dataset.workspaceView === "orders";
            tab.classList.toggle("is-active", active);
            tab.toggleAttribute("aria-current", active);
          });
          var ordersPage = content.querySelector(".lx-orders-page");
          if (ordersPage) ordersPage.hidden = false;
          content.setAttribute("aria-label", "我的订单");
          renderOrderList();
          content.scrollTop = 0;
          syncOrdersTabVisibility();
        }

        function syncOrdersTabVisibility() {
          if (!content) return;
          var tabbar = content.querySelector(".lx-orders-tabs");
          if (!tabbar) return;
          var sharedTabs = window.__lxState && Array.isArray(window.__lxState.tabs) ? window.__lxState.tabs : [];
          var desiredTabs = sharedTabs.filter(function (tab) { return tab && tab.id && tab.id !== "info:orders"; });
          var currentIds = Array.from(tabbar.querySelectorAll("[data-order-global-tab]")).map(function (tab) { return tab.dataset.orderGlobalTab; }).join("|");
          var desiredIds = desiredTabs.map(function (tab) { return tab.id; }).join("|");
          if (currentIds !== desiredIds) {
            tabbar.querySelectorAll("[data-order-global-tab]").forEach(function (tab) { tab.remove(); });
            desiredTabs.forEach(function (tab) {
              var button = document.createElement("button");
              var isChannelTab = /^site:(?:personal|business|enterprise)$/.test(tab.id);
              button.className = "lx-orders-tab lx-tab";
              button.type = "button";
              button.dataset.orderGlobalTab = tab.id;
              button.innerHTML = '<span class="lx-tab-label">' + escapeHtml(tab.label || "页面") + '</span>' + (isChannelTab ? "" : '<span class="lx-orders-tab-close lx-tab-close">×</span>');
              tabbar.appendChild(button);
            });
          }
          // Activating the order workspace must not promote its tab to the
          // first position. Reapply the authoritative shared-tab sequence
          // after creating the order-specific mirror buttons.
          var desiredVisualIds = sharedTabs.filter(function (tab) { return tab && tab.id; }).map(function (tab) { return tab.id; });
          var currentVisualIds = Array.from(tabbar.querySelectorAll(".lx-orders-tab")).map(function (tab) {
            return tab.dataset.workspaceView === "orders" ? "info:orders" : tab.dataset.orderGlobalTab;
          });
          if (currentVisualIds.join("|") !== desiredVisualIds.join("|")) {
            desiredVisualIds.forEach(function (tabId) {
              var node = tabId === "info:orders"
                ? tabbar.querySelector("[data-workspace-view='orders']")
                : Array.from(tabbar.querySelectorAll("[data-order-global-tab]")).find(function (tab) { return tab.dataset.orderGlobalTab === tabId; });
              if (node) tabbar.appendChild(node);
            });
          }
          var realTabs = tabbar.querySelectorAll(".lx-orders-tab:not([hidden])");
          tabbar.hidden = realTabs.length <= 1;
        }

        function registerOrdersResultTab() {
          var state = window.__lxState;
          if (!state) return;
          state.tabs = Array.isArray(state.tabs) ? state.tabs : [];
          var existing = state.tabs.find(function (tab) { return tab && tab.id === "info:orders"; });
          if (existing) {
            existing.kind = "info";
            existing.label = "我的订单";
          } else {
            state.tabs.push({ id: "info:orders", kind: "info", label: "我的订单" });
          }
          state.activeTabId = "info:orders";
        }

        function removeLegacyTabs() {
          var legacyBars = content.querySelectorAll(":scope > .lx-tabbar:not(.lx-orders-tabs), :scope > [data-shop-detail-tabs]:not(.lx-orders-tabs), :scope > [aria-label='已打开页面']:not(.lx-orders-tabs)");
          for (var index = 0; index < legacyBars.length; index += 1) legacyBars[index].hidden = true;
        }

        function openOrdersFromChat(question) {
          registerOrdersResultTab();
          if (window.__lxBridge && typeof window.__lxBridge.prepareRootSplitState === "function") {
            window.__lxBridge.prepareRootSplitState();
          }
          mountCommerceWorkspace();
          setWorkspaceView("orders");
          var detail = content.querySelector("[data-order-detail]");
          var list = content.querySelector("[data-orders-list]");
          if (detail) detail.classList.remove("is-active");
          if (list) list.classList.add("is-active");
          removeLegacyTabs();
          if (question) streamSkillAnswer(question, "订单查询", ["已为你打开我的订单页面，共查询到 22 笔订单。", "你可以在右侧查看每笔订单的状态、实付款和下单时间；点击“详情”可继续查看订单信息与物流轨迹。"]);
        }

        function clearFreshHomeConversationBeforeOrders() {
          var logicalPath = String(window.__LX_TEMPLATE_PATH || location.pathname || "/").replace(/\/+$/, "") || "/";
          var isFullscreenHome = logicalPath === "/" && (body.classList.contains("assistant-fullscreen") || body.classList.contains("lx-auto-fs"));
          var hasCurrentFullscreenQuery = !!document.querySelector(".lxfd-thread .lxfd-msg-user");
          if (!isFullscreenHome || hasCurrentFullscreenQuery) return;
          if (window.__lxBridge && typeof window.__lxBridge.resetConversationContext === "function") {
            window.__lxBridge.resetConversationContext();
          }
          chat.replaceChildren();
        }

        function showOrderGeneration() {
          if (!content) return;
          if (orderGenerationOverlay) orderGenerationOverlay.remove();
          orderGenerationOverlay = document.createElement("div");
          orderGenerationOverlay.className = "lx-page-generating";
          orderGenerationOverlay.setAttribute("role", "status");
          orderGenerationOverlay.setAttribute("aria-live", "polite");
          orderGenerationOverlay.innerHTML = '<div class="lx-page-gen-card lx-page-gen-card--aurora"><div class="lx-page-gen-aurora-field" aria-hidden="true"><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--a"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--b"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--c"></i><i class="lx-page-gen-aurora-wave lx-page-gen-aurora-wave--d"></i><span class="lx-page-gen-aurora-lens"></span></div><div class="lx-page-gen-head"><div class="lx-page-gen-copy"><strong>正在生成订单列表</strong><em>正在加载订单状态、商品、金额与物流信息</em></div></div></div>';
          content.appendChild(orderGenerationOverlay);
          content.classList.add("is-generating-tab");
          content.scrollTop = 0;
          requestAnimationFrame(function () { orderGenerationOverlay?.classList.add("is-show"); });
        }

        function hideOrderGeneration() {
          if (content) content.classList.remove("is-generating-tab");
          if (!orderGenerationOverlay) return;
          var overlay = orderGenerationOverlay;
          orderGenerationOverlay = null;
          if (!overlay.isConnected) return;
          overlay.classList.add("is-done");
          window.setTimeout(function () { overlay.remove(); }, 240);
        }

        var orderIconFlowRunning = false;
        async function runOrderIconFlow(question) {
          if (orderIconFlowRunning) return;
          orderIconFlowRunning = true;
          try {
            clearFreshHomeConversationBeforeOrders();
            if (window.__lxBridge && typeof window.__lxBridge.prepareRootSplitState === "function") {
              window.__lxBridge.prepareRootSplitState();
            }
            showOrderGeneration();
            await streamSkillAnswer(question || "我要查看订单", "订单查询", ["已为你查询到 22 笔订单，包含待付款、待发货和待收货状态。点击右侧订单卡片即可查看商品、金额与物流详情。"], {
              finalHtml: '<p>已为你查询到 <strong>22 笔订单</strong>，包含待付款、待发货和待收货状态。点击右侧订单卡片即可查看商品、金额与<strong>物流详情</strong>。</p>',
              cardHtml: '<button class="answer-cta lx-answer-page" type="button" data-open-orders data-lx-result-id="info:orders" aria-pressed="false"><span class="answer-cta-copy"><span class="answer-cta-title">查看我的订单</span><span class="answer-cta-desc">共 22 笔 · 17 笔进行中</span></span><span class="answer-cta-icon" aria-hidden="true"><img class="lx-approved-icon-img" src="../icons/global-next.svg" alt=""></span></button>'
            });
            openOrdersFromChat("");
          } finally {
            hideOrderGeneration();
            orderIconFlowRunning = false;
          }
        }

        function infoRows(rows) {
          var visible = rows.filter(function (row) { return row[1] !== undefined && row[1] !== null && row[1] !== ""; });
          return '<div class="lx-detail-kv">' + visible.map(function (row) { return '<div><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>'; }).join("") + '</div>';
        }

        function renderTimeline(order) {
          return '<div class="lx-detail-status-grid">' + (order.timeline || []).map(function (node) {
            return '<div class="lx-detail-status-node is-' + escapeHtml(node.state || "upcoming") + '"><strong>' + escapeHtml(node.label) + '</strong><span>' + escapeHtml(node.time || "待完成") + '</span></div>';
          }).join("") + '</div>';
        }

        function renderDetailProducts(order) {
          return '<div class="lx-order-detail-products">' + (order.items || []).map(function (item, index) {
            var role = item.role && item.role !== "主品" ? '<span class="lx-order-item-role">' + escapeHtml(item.role) + '</span>' : "";
            var mixed = Number(item.beans || 0) > 0 ? " lx-order-mixed-amount" : "";
            var orderMeta = index === 0 ? '<div class="lx-order-detail-meta"><span>订单编号 ' + escapeHtml(order.id) + ' · ' + escapeHtml(order.typeLabel) + '</span><span class="lx-order-detail-status">' + escapeHtml(order.status) + '</span></div>' : "";
            return '<section class="lx-order-detail-summary' + (index === 0 ? ' has-order-meta' : '') + '">' + orderMeta + '<span class="lx-order-thumb"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '"></span><div class="lx-order-detail-product">' + role + '<h2>' + escapeHtml(item.name) + '</h2><p>' + escapeHtml(item.description) + '</p><p>数量 ×' + escapeHtml(item.quantity) + '</p></div><strong class="lx-order-detail-price' + mixed + '">' + escapeHtml(formatMixedAmount(item.amount, item.beans)) + '</strong></section>';
          }).join("") + '</div>';
        }

        function renderInvoice(invoice) {
          invoice = invoice || { text: "不开发票" };
          if (invoice.text) return '<p class="lx-detail-note">' + escapeHtml(invoice.text) + '</p>';
          return infoRows([["发票类型", invoice.type], ["发票抬头", invoice.title], ["纳税人识别号", invoice.taxpayerId], ["发票内容", invoice.content]]);
        }

        function renderSpecialSections(order) {
          var html = "";
          if (order.presale) {
            html += '<section class="lx-detail-section"><h3>预售信息</h3><div class="lx-detail-special"><div><span>定金</span><strong>' + escapeHtml(formatCurrency(order.presale.deposit)) + '</strong></div><div><span>尾款</span><strong>' + escapeHtml(typeof order.presale.tailAmount === "number" ? formatCurrency(order.presale.tailAmount) : order.presale.tailAmount) + '</strong></div><div><span>尾款支付时间</span><strong>' + escapeHtml(order.presale.tailPaymentAt) + '</strong></div><div><span>预计交付</span><strong>' + escapeHtml(order.expectedDelivery || "待确认") + '</strong></div></div></section>';
          }
          if (order.recharge) {
            html += '<section class="lx-detail-section"><h3>充值信息</h3>' + infoRows([["充值账号", order.recharge.account], ["卡号", order.recharge.cardNumber], ["卡密", order.recharge.cardSecret || "待发放"]]) + '</section>';
          }
          if (order.pickupCode) {
            html += '<section class="lx-detail-section"><h3>到店自提</h3><div class="lx-detail-special"><div><span>自提码</span><strong>' + escapeHtml(order.pickupCode) + '</strong></div><div><span>取货提示</span><strong>到店后请出示自提码和收货手机号</strong></div></div></section>';
          }
          return html;
        }

        function renderLogistics(order) {
          var shipping = order.shipping || {};
          var packages = shipping.packages || [];
          if (!packages.length) {
            return '<section class="lx-detail-section lx-logistics"><h3>交付说明</h3><p class="lx-detail-note">' + escapeHtml(shipping.notice || "当前订单暂无物流信息") + '</p></section>';
          }
          return packages.map(function (item) {
            var steps = (item.steps || []).slice().reverse();
            return '<section class="lx-detail-section lx-logistics lx-logistics-package"><h3 class="lx-logistics-package-name"><span>' + escapeHtml(item.name) + '</span><small>进度 ' + escapeHtml(item.progress) + '/' + escapeHtml((item.steps || []).length) + '</small></h3><div class="lx-logistics-meta"><div><span>物流公司</span><strong>' + escapeHtml(item.company) + '</strong></div><div><span>物流单号</span><strong>' + escapeHtml(item.number) + ' <button class="lx-logistics-copy" type="button" data-copy-tracking="' + escapeHtml(item.number) + '">复制</button></strong></div><div><span>运输路线</span><strong>' + escapeHtml((item.route || []).join(" → ") || "待更新") + '</strong></div></div>' + steps.map(function (step) { return '<div class="lx-logistics-step is-' + escapeHtml(step.state || "upcoming") + '"><div><strong>' + escapeHtml(step.label) + '</strong><span>' + escapeHtml(step.time || "待更新") + '</span></div></div>'; }).join("") + '</section>';
          }).join("");
        }

        function detailMarkup(order) {
          var recipient = order.recipient || {};
          var store = order.store || {};
          var payment = order.payment || {};
          var shippingLabels = { physical: "快递配送", notice: "服务/虚拟交付", pickup: "到店自提", storeDelivery: "门店闪送" };
          var storeSection = order.store ? '<section class="lx-detail-section"><h3>门店信息</h3>' + infoRows([["交付方式", store.method], ["门店名称", store.name], ["门店电话", store.phone], ["门店地址", store.address], ["营业时间", store.hours]]) + '</section>' : "";
          return '<header class="lx-order-detail-head"><div class="lx-order-detail-title"><div class="lx-order-detail-title-row"><button class="lx-order-back" type="button" data-order-back aria-label="返回订单列表"><img src="../icons/global-next.svg" alt=""></button><h1>订单详情</h1></div></div></header>' +
            renderDetailProducts(order) +
            '<nav class="lx-detail-tabs" role="tablist" aria-label="订单详情内容切换"><button class="lx-detail-tab is-active" type="button" role="tab" aria-selected="true" data-detail-tab="info">订单信息</button><button class="lx-detail-tab" type="button" role="tab" aria-selected="false" data-detail-tab="logistics">物流信息</button></nav>' +
            '<div class="lx-detail-pane is-active" data-detail-pane="info"><section class="lx-detail-section"><h3>订单状态</h3>' + renderTimeline(order) + '</section>' + renderSpecialSections(order) + '<section class="lx-detail-section"><h3>收货信息</h3>' + infoRows([["收货人", recipient.name], ["联系电话", recipient.phone], ["收货地址", recipient.address || (order.type === "omoPickup" ? "到店自提" : "未填写")]]) + '</section>' + storeSection + '<section class="lx-detail-section"><h3>订单信息</h3>' + infoRows([["订单编号", order.id], ["订单类型", order.typeLabel], ["下单时间", order.createdAt], ["支付时间", order.paidAt || "未支付"], ["支付方式", order.paymentMethod], ["订单状态", order.status], ["配送方式", shippingLabels[order.shipping && order.shipping.mode] || "待确认"], ["预计送达", order.expectedDelivery]]) + '</section><section class="lx-detail-section"><h3>发票信息</h3>' + renderInvoice(order.invoice) + '</section><section class="lx-detail-section"><h3>订单备注</h3><p class="lx-detail-note">' + escapeHtml(order.remark || "无") + '</p></section><section class="lx-detail-section lx-price-panel"><h3>价格明细</h3><div class="lx-price-row"><span>商品金额</span><strong>' + escapeHtml(formatMixedAmount(payment.goods, payment.beans)) + '</strong></div><div class="lx-price-row"><span>运费</span><strong>' + escapeHtml(formatCurrency(payment.freight)) + '</strong></div><div class="lx-price-row"><span>优惠</span><strong>-' + escapeHtml(formatCurrency(payment.discount)) + '</strong></div><div class="lx-price-row"><span>应付金额</span><strong>' + escapeHtml(formatMixedAmount(payment.payable, payment.beans)) + '</strong></div><div class="lx-price-row is-total"><span>实付款</span><strong>' + escapeHtml(formatCurrency(payment.actual)) + '</strong></div></section></div>' +
            '<div class="lx-detail-pane" data-detail-pane="logistics">' + renderLogistics(order) + '</div>';
        }

        function boot() {
          body = document.body;
          content = document.querySelector(".shell > .content");
          chat = document.querySelector(".assistant-panel .chat-state");
          if (!body || !content || !chat) return;

          document.documentElement.classList.remove("lx-route-prepaint", "lx-shop-tabs-prepaint", "lx-root-lxfd-prepaint");
          body.classList.remove("lx-orders-poc");
          body.classList.add("lx-template-file");
          var brandHome = document.querySelector(".brand");
          if (brandHome) brandHome.href = location.pathname + "?v=home-entry-fix2";

          window.lxHandleCommerceQuery = function (query, intent) {
            if (intent === "orders") openOrdersFromChat(query);
          };
          window.lxHandleCommerceEntry = function (entry) {
            if (entry === "orders") openOrdersFromChat("");
          };
          window.__lxOpenOrdersCenter = function (options) {
            var question = options && typeof options.question === "string" ? options.question : "";
            openOrdersFromChat(question);
          };

          window.addEventListener("lx:orders-updated", syncLiveOrders);
          window.addEventListener("storage", function (event) {
            if (!event || event.key === liveOrderKey) syncLiveOrders();
          });
          window.addEventListener("pageshow", syncLiveOrders);

          var textarea = document.querySelector(".assistant-panel .composer textarea");

          function interceptDirectOrderQuery(event, input) {
            input = input || textarea;
            var query = input && input.value ? input.value.trim() : "";
            if (!isDirectOrderCenterQuery(query)) return false;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            runOrderIconFlow(query);
            return true;
          }

          function restoreBeforeSharedQuery(input) {
            if (!commerceMounted || orderIconFlowRunning || !input) return;
            var query = String(input.value || "").trim();
            if (query && !isOrderQuery(query)) restoreHomeWorkspace(false);
          }

          window.addEventListener("click", function (event) {
            var sendButton = event.target.closest(".assistant-panel .send-btn, .assistant-panel [data-send], .assistant-panel button[type='submit'], .lxfd-send");
            var sendInput = sendButton && sendButton.closest("form") ? sendButton.closest("form").querySelector("textarea") : textarea;
            if (sendButton && interceptDirectOrderQuery(event, sendInput)) return;
            if (sendButton) restoreBeforeSharedQuery(sendInput);
            var orderResultCard = event.target.closest("[data-open-orders], [data-lx-result-id='info:orders'], [data-tab-id='info:orders']");
            if (orderResultCard && !event.target.closest(".lx-tab-close")) {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              openOrdersFromChat("");
              return;
            }
            var sharedResultCard = event.target.closest("[data-lx-result-id], [data-lx-open-tab], [data-lxfd-reco-id], [data-open-product], [data-lxfd-open-feature]");
            if (commerceMounted && sharedResultCard && !sharedResultCard.matches("[data-open-orders], [data-lx-result-id='info:orders']")) {
              restoreHomeWorkspace(false);
            }
            var commerceEntry = event.target.closest(".utility-btn[aria-label='订单'], [data-commerce-entry='orders'], [data-lxfd-open='orders']");
            if (!commerceEntry) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            runOrderIconFlow();
          }, true);

          window.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" || event.shiftKey || event.isComposing || !event.target.matches(".assistant-panel .composer textarea, .lxfd-composer textarea")) return;
            if (!interceptDirectOrderQuery(event, event.target)) restoreBeforeSharedQuery(event.target);
          }, true);

          window.addEventListener("submit", function (event) {
            var form = event.target;
            if (!form || !form.matches(".assistant-panel .composer, .lxfd-composer")) return;
            var formInput = form.querySelector("textarea");
            if (!interceptDirectOrderQuery(event, formInput)) restoreBeforeSharedQuery(formInput);
          }, true);

          document.addEventListener("click", function (event) {
            var commerceEntry = event.target.closest("[data-commerce-entry='orders'], [data-lxfd-open='orders']");
            if (commerceEntry) {
              event.preventDefault();
              event.stopImmediatePropagation();
              openOrdersFromChat("");
              return;
            }
            var sharedWorkspaceTab = event.target.closest("[data-order-global-tab]");
            if (sharedWorkspaceTab) {
              event.preventDefault();
              event.stopImmediatePropagation();
              var sharedTabId = sharedWorkspaceTab.dataset.orderGlobalTab;
              if (event.target.closest(".lx-tab-close")) {
                if (window.__lxState && Array.isArray(window.__lxState.tabs)) {
                  window.__lxState.tabs = window.__lxState.tabs.filter(function (tab) { return tab && tab.id !== sharedTabId; });
                }
                syncOrdersTabVisibility();
                return;
              }
              restoreHomeWorkspace(false);
              requestAnimationFrame(function () {
                if (window.__lxBridge && typeof window.__lxBridge.activateTab === "function" && window.__lxBridge.activateTab(sharedTabId)) return;
                if (window.__lxBridge && typeof window.__lxBridge.restoreResultTab === "function") window.__lxBridge.restoreResultTab(sharedTabId);
              });
              return;
            }
            var workspaceTab = event.target.closest("[data-workspace-view]");
            var orderStatus = event.target.closest("[data-order-status]");
            var orderClear = event.target.closest("[data-order-clear]");
            var card = event.target.closest("[data-order-card]");
            var detailButton = event.target.closest("[data-order-detail-id]");
            var back = event.target.closest("[data-order-back]");
            var tab = event.target.closest("[data-order-detail] [data-detail-tab]");
            var copyTracking = event.target.closest("[data-copy-tracking]");
            var typeTrigger = event.target.closest("[data-order-type-trigger]");
            var typeOption = event.target.closest("[data-order-type-option]");
            if (!event.target.closest("[data-order-type-picker]")) setOrderTypeMenu(false);
            if (commerceMounted && event.target.closest(".brand a, .main-nav [data-page]")) restoreHomeWorkspace();
            if (workspaceTab || orderStatus || orderClear || card || detailButton || back || tab || copyTracking || typeTrigger || typeOption) event.stopPropagation();
            if (typeTrigger) {
              var picker = typeTrigger.closest("[data-order-type-picker]");
              var open = !picker.classList.contains("is-open");
              setOrderTypeMenu(open);
              if (open) picker.querySelector('[data-order-type-option][aria-selected="true"]')?.focus();
              return;
            }
            if (typeOption) {
              orderListState.type = typeOption.dataset.orderTypeOption;
              setOrderTypeMenu(false);
              renderOrderList();
              content.querySelector("[data-order-type-trigger]")?.focus();
              return;
            }
            if (orderStatus) {
              orderListState.status = orderStatus.dataset.orderStatus;
              renderOrderList();
              return;
            }
            if (orderClear) {
              orderListState.query = "";
              orderListState.type = "all";
              orderListState.status = "全部";
              renderOrderList();
              return;
            }
            if (workspaceTab) {
              var targetView = workspaceTab.dataset.workspaceView;
              if (targetView === "home") restoreHomeWorkspace();
              else if (targetView === "orders") openOrdersFromChat("");
              return;
            }
            if (detailButton || card) {
              var orderId = detailButton ? detailButton.dataset.orderDetailId : card.dataset.orderCard;
              var order = orders.find(function (item) { return item.id === orderId; });
              if (!order) return;
              var mainItem = primaryItem(order);
              streamSkillAnswer("查看这笔订单的详细信息", "订单详情查询", ["已查询到“" + mainItem.name + "”的订单详情。", "这是一笔“" + order.typeLabel + "”，当前状态为“" + order.status + "”，下单时间是 " + order.createdAt + "，应付金额 " + orderAmount(order) + "。右侧可查看商品清单、付款信息、交付信息和订单状态轨迹。"]);
              content.querySelector("[data-orders-list]").classList.remove("is-active");
              var detail = content.querySelector("[data-order-detail]");
              detail.innerHTML = detailMarkup(order);
              detail.classList.add("is-active");
              content.scrollTop = 0;
              requestAnimationFrame(function () { content.scrollTop = 0; });
              return;
            }
            if (back) {
              content.querySelector("[data-order-detail]").classList.remove("is-active");
              content.querySelector("[data-orders-list]").classList.add("is-active");
              content.scrollTop = 0;
              return;
            }
            if (tab) {
              var name = tab.dataset.detailTab;
              content.querySelectorAll("[data-detail-tab]").forEach(function (item) {
                var active = item === tab;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
              });
              content.querySelectorAll("[data-detail-pane]").forEach(function (pane) {
                pane.classList.toggle("is-active", pane.dataset.detailPane === name);
              });
              content.scrollTop = 0;
              return;
            }
            if (copyTracking) {
              navigator.clipboard?.writeText(copyTracking.dataset.copyTracking || "");
              copyTracking.textContent = "已复制";
              setTimeout(function () { copyTracking.textContent = "复制"; }, 1200);
              return;
            }
          }, true);

          content.addEventListener("input", function (event) {
            if (event.target.matches("[data-order-search]")) {
              orderListState.query = event.target.value;
              renderOrderList();
              return;
            }
          });

          content.addEventListener("change", function (event) {
            if (!event.target.matches("[data-order-type]")) return;
            orderListState.type = event.target.value;
            renderOrderList();
          });

          content.addEventListener("keydown", function (event) {
            var orderCard = event.target.closest(".lx-order-card[data-order-detail-id]");
            if (orderCard && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              orderCard.click();
              return;
            }
            var trigger = event.target.closest("[data-order-type-trigger]");
            var option = event.target.closest("[data-order-type-option]");
            if (trigger && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
              event.preventDefault();
              setOrderTypeMenu(true);
              var options = Array.from(content.querySelectorAll("[data-order-type-option]"));
              (event.key === "ArrowUp" ? options[options.length - 1] : options.find(function (item) { return item.getAttribute("aria-selected") === "true"; }) || options[0])?.focus();
              return;
            }
            if (!option) return;
            var options = Array.from(content.querySelectorAll("[data-order-type-option]"));
            var index = options.indexOf(option);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length].focus();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOrderTypeMenu(false);
              content.querySelector("[data-order-type-trigger]")?.focus();
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              options[event.key === "Home" ? 0 : options.length - 1].focus();
            }
          });

          chat.addEventListener("click", function (event) {
            if (!event.target.closest("[data-open-orders]")) return;
            event.stopPropagation();
            openOrdersFromChat("");
          });

          if (window.MutationObserver) {
            assistantQueryObserver = new MutationObserver(function (records) {
              records.forEach(function (record) {
                record.addedNodes.forEach(restoreSharedWorkspaceForQuery);
              });
            });
            assistantQueryObserver.observe(chat, { childList: true, subtree: true });
          }

          document.querySelectorAll("[data-commerce-entry='orders']").forEach(function (button) {
            button.addEventListener("click", function (event) {
              event.preventDefault();
              event.stopImmediatePropagation();
              openOrdersFromChat("");
            }, true);
          });
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        } else {
          boot();
        }
      })();

;

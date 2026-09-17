import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { allowPreviewAuth } from '@/config/runtimeMode'
import { aiInspectRoutes } from '@/views/aiinspect/routes'
import { canUseActivityPoints } from '@/services/activityPointsAccess'
import { showWorkbenchToast } from '@/services/toast'

// 布局
const AppLayout = () => import('@/components/AppLayout.vue')

// 页面组件（懒加载，首屏不打包进去）
const PortalHome      = () => import('@/views/PortalHomeView.vue')
const NativeWorkbenchPage = () => import('@/views/NativeWorkbenchPage.vue')
const WIPView           = () => import('@/views/WIPView.vue')  // 开发中占位页
const DashboardOverview = () => import('@/views/dashboard/DashboardOverviewView.vue')
const PipelineAnnotate = () => import('@/views/dashboard/PipelineAnnotateView.vue')
const PipelineQuality = () => import('@/views/dashboard/PipelineQualityView.vue')
const OpsTraffic = () => import('@/views/dashboard/OpsTrafficView.vue')
const OpsGmv = () => import('@/views/dashboard/OpsGmvView.vue')
const GeoOverview = () => import('@/views/geo/GeoOverviewView.vue')
const GeoSource = () => import('@/views/geo/GeoSourceView.vue')
const GeoIntent = () => import('@/views/geo/GeoIntentView.vue')
const GeoConversion = () => import('@/views/geo/GeoConversionView.vue')
const GeoKnowledge = () => import('@/views/geo/GeoKnowledgeView.vue')
const EmployeeOverview = () => import('@/views/employee/EmployeeOverviewView.vue')
const EmployeeCert = () => import('@/views/employee/EmployeeCertView.vue')
const LeadDashboard = () => import('@/views/lead/LeadDashboardView.vue')
const LeadPool = () => import('@/views/lead/LeadPoolView.vue')
const LeadGovernmentPool = () => import('@/views/lead/LeadGovernmentPoolView.vue')
const LeadScore = () => import('@/views/lead/LeadScoreView.vue')
const OrderPurchaseOrders = () => import('@/views/order/OrderPurchaseOrdersView.vue')
const AgreementOrder = () => import('@/views/order/AgreementOrderView.vue')
const ProductVideoConfig = () => import('@/views/advertising/ProductVideoConfigView.vue')
const ActivityPoints = () => import('@/views/points/ActivityPointsView.vue')
const ActivityPointsStatistics = () => import('@/views/points/ActivityPointsStatisticsView.vue')
const AgentSkills = () => import('@/views/agent/AgentSkillsView.vue')
const AgentSkillCreate = () => import('@/views/agent/AgentSkillCreateView.vue')
const AgentPermissions = () => import('@/views/agent/AgentPermissionsView.vue')
const AdminCleanupEmailMock = () => import('@/views/agent/AdminCleanupEmailMockView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/adfs-login',
    component: () => import('@/views/AdfsLoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/access-denied',
    component: () => import('@/views/AccessDeniedView.vue'),
    meta: { public: true }
  },
  {
    path: '/account-request/status',
    component: () => import('@/views/AccountRequestStatusView.vue'),
    meta: { public: true }
  },
  {
    path: '/mail-approval/action',
    component: () => import('@/views/MailApprovalActionView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: AppLayout,
    // 所有业务路由都需要登录（在 beforeEach 中统一拦截）
    children: [
      { path: '',              redirect: '/portal/home' },
      { path: 'portal/home',  component: PortalHome, meta: { pageId: 'portal.home' } },

      // 乐享运营
      { path: 'dashboard/overview',   component: DashboardOverview, meta: { pageId: 'dashboard.overview',  group: 'dashboard' } },
      { path: 'pipeline/annotate',    component: PipelineAnnotate, meta: { pageId: 'pipeline.annotate',   group: 'dashboard' } },
      { path: 'pipeline/quality',     component: PipelineQuality, meta: { pageId: 'pipeline.quality',    group: 'dashboard' } },
      { path: 'ops/traffic',          component: OpsTraffic, meta: { pageId: 'ops.traffic',         group: 'dashboard' } },
      { path: 'ops/gmv',              component: OpsGmv, meta: { pageId: 'ops.gmv',             group: 'dashboard' } },

      // GEO 看板
      { path: 'geo/overview',         component: GeoOverview, meta: { pageId: 'dashboard.geo',       group: 'geo' } },
      { path: 'geo/source',           component: GeoSource, meta: { pageId: 'dashboard.geoSource', group: 'geo' } },
      { path: 'geo/intent',           component: GeoIntent, meta: { pageId: 'dashboard.geoIntent', group: 'geo' } },
      { path: 'geo/conversion',       component: GeoConversion, meta: { pageId: 'dashboard.geoConversion', group: 'geo' } },
      { path: 'geo/knowledge',        component: GeoKnowledge, meta: { pageId: 'dashboard.geoKnowledge', group: 'geo' } },

      // 在职员工
      { path: 'employee/overview',    component: EmployeeOverview, meta: { pageId: 'employee.overview',   group: 'employee' } },
      { path: 'employee/cert',        component: EmployeeCert, meta: { pageId: 'employee.certification', group: 'employee' } },

      // 企业客户
      { path: 'lead/dashboard',       component: LeadDashboard, meta: { pageId: 'lead.dashboard', group: 'lead' } },
      { path: 'lead/pool',            component: LeadPool, meta: { pageId: 'lead.pool',      group: 'lead' } },
      { path: 'lead/government-pool', component: LeadGovernmentPool, meta: { pageId: 'lead.governmentPool', group: 'lead' } },
      { path: 'lead/score',           component: LeadScore, meta: { pageId: 'lead.score',     group: 'lead' } },

      // 订单管理
      { path: 'order/purchase-orders',     component: OrderPurchaseOrders, meta: { pageId: 'order.purchaseOrders', group: 'order' } },
      { path: 'order/purchase-orders/:id', component: OrderPurchaseOrders, meta: { pageId: 'order.purchaseOrders', group: 'order' } },
      { path: 'order/agreement',            component: AgreementOrder, meta: { pageId: 'order.agreement', group: 'order' } },

      // 营销中心 / 广告管理
      { path: 'advertising/product-videos', component: ProductVideoConfig, meta: { pageId: 'advertising.productVideo', group: 'advertising' } },

      ...aiInspectRoutes,

      // 促销中心 / 积分管理：保留现有积分页面直链与权限标识。
      { path: 'points/activity', component: ActivityPoints, meta: { pageId: 'points.activity', group: 'promotion' } },
      { path: 'points/activity-details', component: ActivityPointsStatistics, meta: { pageId: 'points.activityDetails', group: 'promotion' } },

      // Agent 入口（从用户菜单进入，不在侧栏显示）
      { path: 'agent/skills',         component: AgentSkills, meta: { pageId: 'agent.skills' } },
      { path: 'agent/skill-create',   component: AgentSkillCreate, meta: { pageId: 'agent.skillCreate' } },
      { path: 'agent/permissions',    component: AgentPermissions, meta: { pageId: 'agent.permissions' } },
      { path: 'agent/permissions/admin-cleanup-email', component: AdminCleanupEmailMock, meta: { pageId: 'agent.permissions' } },

      // 封板项目中的隐藏/详情/二级流程页：不进左导航，但需要支持 switchPage 内部跳转
      { path: 'hidden/dashboard/query',      component: NativeWorkbenchPage, meta: { pageId: 'dashboard.query' } },
      { path: 'hidden/dashboard/behavior',   component: NativeWorkbenchPage, meta: { pageId: 'dashboard.behavior' } },
      { path: 'hidden/ops/query-biz',        component: NativeWorkbenchPage, meta: { pageId: 'ops.queryBiz' } },
      { path: 'hidden/ops/keywords',         component: NativeWorkbenchPage, meta: { pageId: 'ops.keywords' } },
      { path: 'hidden/pipeline/task',        component: NativeWorkbenchPage, meta: { pageId: 'pipeline.task' } },
      { path: 'hidden/pipeline/stats',       component: NativeWorkbenchPage, meta: { pageId: 'pipeline.stats' } },
      { path: 'hidden/pipeline/filter',      component: NativeWorkbenchPage, meta: { pageId: 'pipeline.filter' } },
      { path: 'hidden/pipeline/monitor',     component: NativeWorkbenchPage, meta: { pageId: 'pipeline.monitor' } },
      { path: 'hidden/employee/list',        component: NativeWorkbenchPage, meta: { pageId: 'employee.list' } },
      { path: 'hidden/employee/detail',      component: NativeWorkbenchPage, meta: { pageId: 'employee.detail' } },
      { path: 'hidden/employee/cert-detail', component: NativeWorkbenchPage, meta: { pageId: 'employee.cert-detail' } },
      { path: 'hidden/lead/detail',          component: NativeWorkbenchPage, meta: { pageId: 'lead.detail' } },
      { path: 'hidden/order/agreement-detail', component: NativeWorkbenchPage, meta: { pageId: 'order.agreement.detail' } },
      { path: 'hidden/report/overview',      component: NativeWorkbenchPage, meta: { pageId: 'report.overview' } },
      { path: 'hidden/report/quality',       component: NativeWorkbenchPage, meta: { pageId: 'report.quality' } },
      { path: 'hidden/report/detail',        component: NativeWorkbenchPage, meta: { pageId: 'report.detail' } },

      // 兜底
      { path: ':pathMatch(.*)*',      component: WIPView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局导航守卫：未登录跳转 /login
router.beforeEach(async (to) => {
  const appStore = useAppStore()

  if (to.path === '/login' || to.path === '/adfs-login') {
    if (appStore.user) return '/portal/home'
    const previewUser = localStorage.getItem('preview_user')
    if (allowPreviewAuth && previewUser) {
      appStore.usePreviewSession(previewUser)
      return '/portal/home'
    }
    return true
  }

  if (to.meta.public) return true

  if (!appStore.user) {
    // 尝试静默恢复会话（对应原页面刷新时的自动登录恢复）
    try {
      await appStore.loadUserContext()
    } catch {
      if (allowPreviewAuth) appStore.usePreviewSession('demo')
    }
    if (!appStore.user && allowPreviewAuth) appStore.usePreviewSession('demo')
    if (!appStore.user) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
  if (['points.activity', 'points.activityDetails'].includes(String(to.meta.pageId)) && !canUseActivityPoints(appStore.user, appStore.role, appStore.permissions)) {
    showWorkbenchToast('当前账号没有活动积分查看权限，请联系管理员开通。')
    return { path: '/portal/home' }
  }
  return true
})

export default router

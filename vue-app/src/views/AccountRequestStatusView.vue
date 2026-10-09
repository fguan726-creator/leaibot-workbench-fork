<template>
  <main class="account-status-page" :class="{ 'enable-status-page': isEnable }">
    <section class="account-status-card">
      <div class="status-brand">
        <div class="status-logo">L</div>
        <span>联想乐享</span>
        <RouterLink v-if="isEnable" class="status-login-link" :to="loginTarget">返回登录页</RouterLink>
      </div>

      <div v-if="request" class="status-content" :class="{ 'enable-status-content': isEnable }">
        <ApplicationProgressSummary v-if="isEnable" :title="enableTitle" :status="enableStatus" :tone="enableState === 'rejected' ? 'danger' : 'success'" :steps="enableSteps">
          申请单号：<b>{{ request.id }}</b>。{{ enableDescription }}
        </ApplicationProgressSummary>
        <div v-else class="status-head">
          <div>
            <span class="status-eyebrow">{{ request.type }}申请进度</span>
            <h1>{{ request.id }}</h1>
            <p>该页面为免登录只读查询入口，用于查看账号申请状态和处理记录。</p>
          </div>
          <span :class="['status-pill', statusClass]">{{ displayStatus }}</span>
        </div>

        <component :is="isEnable ? 'details' : 'div'" :key="request.id" class="status-details">
          <summary v-if="isEnable">查看申请详情与处理记录</summary>
          <dl class="status-summary">
            <div>
              <dt>申请类型</dt>
              <dd>{{ request.type }}</dd>
            </div>
            <div>
              <dt>申请人</dt>
              <dd>{{ request.applicant }}（{{ request.applicantItcode }}）</dd>
            </div>
            <div>
              <dt>{{ request.typeKey === 'enable' ? '申请启用账号' : '申请对象' }}</dt>
              <dd>{{ request.target }}</dd>
            </div>
            <div>
              <dt>当前节点</dt>
              <dd>{{ request.node }}</dd>
            </div>
            <div>
              <dt>提交时间</dt>
              <dd>{{ request.time }}</dd>
            </div>
            <div>
              <dt>结果说明</dt>
              <dd>{{ request.result || '申请已受理，请等待审批和系统执行结果。' }}</dd>
            </div>
          </dl>

          <section class="status-section">
            <div class="status-section-head">
              <b>申请内容</b>
              <span v-if="request.typeKey === 'enable'">仅申请启用账号，原有权限保持不变。</span>
              <span v-else>{{ request.roleNames || '未选择角色' }} · {{ request.dataScopeNames || '默认无额外数据权限' }}</span>
            </div>
            <p>{{ request.reason || '暂无补充说明。' }}</p>
          </section>

          <section class="status-section">
            <div class="status-section-head">
              <b>处理记录</b>
              <span>{{ timeline.length }} 条</span>
            </div>
            <ol class="status-timeline">
              <li v-for="log in timeline" :key="log.time + log.node">
                <i></i>
                <div>
                  <b>{{ log.node }}</b>
                  <p>{{ log.detail }}</p>
                  <small>{{ log.time }}</small>
                </div>
              </li>
            </ol>
          </section>
        </component>
        <div v-if="isEnable" class="status-actions">
          <RouterLink class="btn btn-secondary" :to="loginTarget">返回登录页</RouterLink>
        </div>
      </div>

      <div v-else class="status-empty">
        <span class="status-eyebrow">未找到申请</span>
        <h1>无法查询该申请进度</h1>
        <p>请确认邮件中的申请单号和查询链接是否完整。该 POC 页面只展示当前浏览器本地生成的 mock 申请。</p>
        <a href="/admin-vue/login">返回登录页</a>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ApplicationProgressSummary, { type ApplicationProgressStep } from '@/components/auth/ApplicationProgressSummary.vue'

const STORAGE_KEY = 'leaibot-account-request-status-rows'
const route = useRoute()

function readRequests() {
  if (typeof window === 'undefined') return [] as any[]
  try {
    const rows = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch {
    return [] as any[]
  }
}

const requests = ref(readRequests())
function refreshRequests() {
  requests.value = readRequests()
}
function handleStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) refreshRequests()
}
onMounted(() => {
  document.documentElement.classList.add('account-status-route')
  document.body.classList.add('account-status-route')
  window.addEventListener('storage', handleStorage)
  window.addEventListener('focus', refreshRequests)
})
onUnmounted(() => {
  document.documentElement.classList.remove('account-status-route')
  document.body.classList.remove('account-status-route')
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('focus', refreshRequests)
})
const ticket = computed(() => String(route.query.ticket || ''))
const token = computed(() => String(route.query.token || ''))
const request = computed(() => requests.value.find((item: any) => item.id === ticket.value && item.token === token.value) || null)
const displayStatus = computed(() => request.value?.status === '待我审批' ? '审核中' : request.value?.status || '')
const statusClass = computed(() => {
  if (displayStatus.value === '执行完成' || displayStatus.value === '已完成') return 'done'
  if (displayStatus.value === '已驳回') return 'rejected'
  return 'pending'
})
const timeline = computed(() => request.value?.logs || [])
const isEnable = computed(() => request.value?.typeKey === 'enable')
const loginTarget = computed(() => ({ path: '/login', query: { loginType: request.value?.personType === 'external' ? 'external' : 'internal' } }))
const enableState = computed(() => {
  const row = request.value
  if (row?.statusKey === 'rejected' || statusClass.value === 'rejected') return 'rejected'
  if (row?.statusKey === 'done' && row?.nodeType === 'done') return 'done'
  return 'pending'
})
const enableStatus = computed(() => ({ pending: '申请已提交', done: '已完成', rejected: '已驳回' })[enableState.value])
const enableTitle = computed(() => ({ pending: '账号启用申请已进入审批', done: '账号已启用', rejected: '账号启用申请已驳回' })[enableState.value])
const enableDescription = computed(() => ({
  pending: '审批通过并执行后启用账号，原有权限保持不变。',
  done: '请返回登录页重新登录，使用原有权限访问工作台。',
  rejected: '请查看处理记录中的原因。账号状态以已生效的审批结果为准。'
})[enableState.value])
const enableSteps = computed<ApplicationProgressStep[]>(() => [
  { title: '申请人提交', detail: request.value?.applicantItcode || request.value?.applicant || '', state: 'done' },
  { title: '系统管理员审批', detail: request.value?.systemApprover || request.value?.approverItcode || '系统管理员', state: enableState.value === 'pending' ? 'current' : enableState.value }
])
</script>

<style scoped>
:global(html.account-status-route),
:global(html.account-status-route body.account-status-route) { min-width: 0; overflow: hidden; }
:global(body.account-status-route) { display: block; }
:global(body.account-status-route #app) { display: block; width: 100%; min-width: 0; }
.account-status-page {
  width: 100%;
  height: 100vh;
  overflow: auto;
  min-height: 100vh;
  padding: 48px 24px;
  background: #f3f6fb;
  color: #172033;
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

.account-status-card {
  width: min(960px, 100%);
  margin: 0 auto;
  border: 1px solid #dfe7f2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.10);
  overflow: hidden;
}

.status-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e6edf5;
  padding: 18px 28px;
  font-size: 16px;
  font-weight: 800;
}

.status-logo {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #e2231a;
  color: #fff;
}

.status-content,
.status-empty {
  padding: 30px 34px 36px;
}

.status-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.status-eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #316dff;
  font-size: 13px;
  font-weight: 800;
}

.status-head h1,
.status-empty h1 {
  margin: 0;
  color: #101828;
  font-size: 28px;
  line-height: 1.3;
}

.status-head p,
.status-empty p,
.status-section p {
  margin: 10px 0 0;
  color: #5f6b7a;
  font-size: 14px;
  line-height: 1.7;
}

.status-pill {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 800;
}

.status-pill.pending {
  background: #fff4df;
  color: #d97706;
}

.status-pill.done {
  background: #eafaf0;
  color: #18a058;
}

.status-pill.rejected {
  background: #fff1f1;
  color: #e53935;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 28px 0;
}

.status-summary div,
.status-section {
  border: 1px solid #e6edf5;
  border-radius: 8px;
  background: #f8fafc;
}

.status-summary div {
  padding: 14px;
}

.status-summary dt {
  margin-bottom: 6px;
  color: #8a96a8;
  font-size: 12px;
  font-weight: 800;
}

.status-summary dd {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.status-section {
  margin-top: 14px;
  padding: 18px;
}

.status-section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.status-section-head b {
  font-size: 15px;
}

.status-section-head span {
  color: #667085;
  font-size: 13px;
  text-align: right;
}

.status-timeline {
  display: grid;
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.status-timeline li {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 12px;
}

.status-timeline i {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: #316dff;
}

.status-timeline b {
  font-size: 14px;
}

.status-timeline p {
  margin: 4px 0;
}

.status-timeline small {
  color: #8a96a8;
  font-size: 12px;
}

.status-empty a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  margin-top: 20px;
  border-radius: 6px;
  padding: 0 16px;
  background: #316dff;
  color: #fff;
  font-weight: 800;
  text-decoration: none;
}

/* Authentication result layout follows the existing first-access result page.
   Other account request types retain their original detail layout. */
.enable-status-page { box-sizing: border-box; padding: var(--space-8, 32px) var(--space-5, 20px); }
.enable-status-page .account-status-card { width: min(980px, 100%); }
.enable-status-page .status-brand { padding: var(--space-4, 16px) var(--space-7, 28px); font-size: var(--text-base, 14px); }
.status-login-link { margin-left: auto; color: var(--color-primary); font-size: var(--text-sm, 13px); font-weight: var(--font-weight-normal, 400); text-decoration: none; }
.enable-status-content { box-sizing: border-box; width: min(860px, 100%); margin: 0 auto; padding: var(--space-14, 56px) var(--space-9, 36px); }
.enable-status-content .status-details { margin-top: var(--space-6, 24px); text-align: left; overflow-wrap: anywhere; }
.status-details summary { color: var(--color-text-secondary); font-size: var(--text-sm, 13px); cursor: pointer; }
.status-details summary:hover { color: var(--color-primary); }
.status-details summary:focus-visible, .status-login-link:focus-visible, .status-actions a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: var(--space-1, 4px); }
.status-actions { display: flex; justify-content: flex-end; margin-top: var(--space-6, 24px); border-top: 1px solid var(--color-border-subtle); padding-top: var(--space-5, 20px); }
.status-actions a { text-decoration: none; }

@media (max-width: 760px) {
  .enable-status-page { padding: 0; }
  .enable-status-page .account-status-card { border: 0; border-radius: 0; box-shadow: none; }
  .enable-status-page .status-brand, .enable-status-content { padding-inline: var(--space-5, 20px); }
}

@media (max-width: 720px) {
  .account-status-page {
    padding: 20px 12px;
  }

  .status-content,
  .status-empty {
    padding: 22px 18px 26px;
  }

  .status-head {
    display: grid;
  }

  .status-summary {
    grid-template-columns: 1fr;
  }

  .status-section-head {
    display: grid;
  }

  .status-section-head span {
    text-align: left;
  }
}
</style>

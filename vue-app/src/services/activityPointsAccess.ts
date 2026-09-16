/** Activity points extends the existing session; it never creates or grants roles. */
export type ActivityPointsAction = 'view' | 'configure' | 'extend' | 'export' | 'settle'

// This page currently operates only on synthetic local data. Preview access is
// not a role grant and must never authorize a real ledger or business API.
export function isActivityPointsDemoPreview(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'new.leaibot.cn'
}

export interface PointsMenuGroup {
  icon: string
  label: string
  children: Record<string, { label: string; path: string }>
}

export const ACTIVITY_POINTS_MENU: PointsMenuGroup = {
  icon: '<svg class="menu-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.6"/><path d="m10 5 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3L5.2 8.5 8.5 8z"/></svg>',
  label: '积分管理',
  children: {
    'points.activity': { label: '活动积分配置', path: '/points/activity' }
  }
}

export function canUseActivityPoints(
  user: string | null,
  role: string | null,
  permissions: readonly string[],
  action: ActivityPointsAction = 'view',
  previewDemo = isActivityPointsDemoPreview()
): boolean {
  if (!user) return false
  if (previewDemo) return true
  if (role === '平台管理员' || permissions.includes('*')) return true
  if (!permissions.includes('points.activity.view')) return false
  return action === 'view' || permissions.includes(`points.activity.${action}`)
}

export function withActivityPointsMenu(
  existing: Record<string, PointsMenuGroup>,
  user: string | null,
  role: string | null,
  permissions: readonly string[],
  previewDemo = isActivityPointsDemoPreview()
): Record<string, PointsMenuGroup> {
  const result = { ...existing }
  if (canUseActivityPoints(user, role, permissions, 'view', previewDemo))
    result.points = ACTIVITY_POINTS_MENU
  else delete result.points
  return result
}

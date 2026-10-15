// Small monochrome outlines adapted to the project's existing SVG language.
// Keep the runtime, SVG handoff and design overview generated from this source.
export const AGENT_ACTIVITY_ICONS = Object.freeze({
  search: { label: '搜索', paths: ['M13 8.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z', 'm12 12 4 4'] },
  read: { label: '读取', paths: ['M6 3h6l3 3v11H6Z', 'M12 3v3h3M8.5 10h4M8.5 13h4'] },
  terminal: { label: '命令', paths: ['M3 4h14v12H3Z', 'm6 8 2 2-2 2M10.5 12.5H14'] },
  skill: { label: '技能', paths: ['m12.8 4.2 3 3-3.5 3.5-3-3 3.5-3.5Z', 'm9.3 7.7-5.1 5.1a2.1 2.1 0 0 0 3 3l5.1-5.1'] },
  analysis: { label: '分析', paths: ['M4 16V9M10 16V4M16 16v-6M3 17h14'] },
  write: { label: '输出', paths: ['m12.5 3.5 4 4-8.5 8.5-4.5.5.5-4.5 8.5-8.5Z', 'm10.5 5.5 4 4'] },
  network: { label: '联网', paths: ['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z', 'M3 10h14M10 3c-4 4-4 10 0 14M10 3c4 4 4 10 0 14'] },
  wait: { label: '等待', paths: ['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z', 'M10 6v4l2.5 2.5'] },
  export: { label: '导出', paths: ['M10 3v9m-4-4 4 4 4-4M4 13v4h12v-4'] },
  navigate: { label: '跳转', paths: ['M9 4H3v13h13v-6M10 10l7-7M12 3h5v5'] }
})

// Classify public action metadata only; do not inspect prompts or private details.
export function agentActivityIcon(title = '', kind = '') {
  const action = String(title)
  if (kind === 'tool_result' || /等待|待执行/.test(action)) return 'wait'
  if (/导出|下载/.test(action)) return 'export'
  if (/查询|搜索|检索|知识库/.test(action)) return 'search'
  if (/命令|脚本|终端|python|shell/i.test(action)) return 'terminal'
  if (/跳转|切换|导航|打开.*(?:页|工作区|Skill|Hub)/i.test(action)) return 'navigate'
  if (/读取|参考内容|文件|附件/.test(action)) return 'read'
  if (/接口|浏览器|网页|联网|会话服务/.test(action)) return 'network'
  if (/执行技能|Skill|技能/i.test(action)) return 'skill'
  if (kind === 'streaming' || /生成|输出|回复|报告/.test(action)) return 'write'
  if (/分析|汇总|统计|计算/.test(action)) return 'analysis'
  return kind === 'tool_call' ? 'skill' : 'wait'
}

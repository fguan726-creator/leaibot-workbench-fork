<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import SectionHeader from '../../components/content/SectionHeader.vue'
import { createPinnedScenarioStep, resolveScenarioChain } from '../../domain/scenarioSkillPackages.js'
import { getScenarioNodeContract } from '../../domain/scenarioNodeContracts.js'
import type { ScenarioPinnedStep, ScenarioSelectableSkill, ScenarioStepKind } from '../../stores/scenarioSkillPackages'

const props = defineProps<{ focused?: boolean; skills: ScenarioSelectableSkill[]; modelValue: ScenarioPinnedStep[]; trialErrors?: Record<string, string[]>; trialSuggestions?: Record<string, string[]>; trialStale?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [steps: ScenarioPinnedStep[]]; 'toggle-focus': [] }>()
type Point = { x: number; y: number }
type CanvasStep = ScenarioPinnedStep & { predecessorId?: string | null; position?: Point }
type StepConfiguration = Pick<ScenarioPinnedStep, 'condition' | 'task' | 'fixedRequirements' | 'expectedOutput'>
type NodeGesture = { id: string; pointerId: number; offset: Point; position: Point; moved: boolean; start: Point }
type WireGesture = { sourceId: string; pointerId: number; start: Point; moved: boolean }
const NODE_WIDTH = 264
const NODE_HEIGHT = 164
const NODE_CONDITION_HEIGHT = 216
const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const collapsedMenus = ref(new Set<string>())
const selectedStepId = ref<string | null>(null)
const selectedConnectionId = ref<string | null>(null)
const draggedSkillId = ref<string | null>(null)
const isDropOver = ref(false)
const pendingSourceId = ref<string | null>(null)
const wirePoint = ref<Point | null>(null)
const nodeGesture = ref<NodeGesture | null>(null)
const wireGesture = ref<WireGesture | null>(null)
const notice = ref('')
const noticeIsError = ref(false)
const zoom = ref(1)
const viewport = ref<HTMLDivElement | null>(null)
const stage = ref<HTMLDivElement | null>(null)
const configurationBody = ref<HTMLDivElement | null>(null)
const nodeButtons = new Map<string, HTMLButtonElement>()
const markerId = `scenario-canvas-arrow-${getCurrentInstance()?.uid ?? 'local'}`
let ignorePortClickUntil = 0
const hoveredWireTarget = ref<string | null>(null)

const catalog = computed(() => new Map(props.skills.map(skill => [skill.id, skill])))
const selectedSkillIds = computed(() => new Set(props.modelValue.map(step => step.skillId)))
const menuCount = computed(() => new Set(props.modelValue.map(step => step.menu)).size)
const displaySteps = computed(editableSteps)
const selectedStep = computed(() => displaySteps.value.find(step => step.id === selectedStepId.value))
const selectedTrialErrors = computed(() => props.trialErrors?.[selectedStepId.value || ''] || [])
const selectedTrialSuggestions = computed(() => {
  const suggestions = props.trialSuggestions?.[selectedStepId.value || ''] || []
  return suggestions.length ? suggestions : ['根据报错检查本节点与上游配置，修改后到下一步重新试运行。']
})
const selectedNodeContract = computed(() => selectedStep.value ? getScenarioNodeContract(selectedStep.value) : null)
const selectedPublishedSkill = computed(() => {
  const step = selectedStep.value
  const skill = step ? catalog.value.get(step.skillId) : undefined
  return skill?.onlineStatus === 'published' && skill.online === step?.pinnedVersion ? skill : undefined
})
const nodeExamples: Record<string, { task: string; requirements: string; output: string; condition: string }> = {
  'product-knowledge': {
    task: '对比机型 A 与机型 B 的配置差异，说明哪款更适合办公和视频会议。',
    requirements: '仅使用已核实的产品资料；缺失参数标注“待核实”，不自行推测。',
    output: '输出配置对比表，并附各机型的适用场景与选择理由。',
    condition: '当本次任务需要查询产品规格或比较机型时。'
  },
  'voucher-recommend': {
    task: '根据视频会员充值需求，筛选可选券包并说明适用范围。',
    requirements: '依据已提供的权益说明推荐；有效期或适用范围不明确时注明待核实。',
    output: '输出包含券包名称、适用范围和推荐理由的权益卡片。',
    condition: '当本次任务明确需要充值或券包权益推荐时。'
  },
  'gmv-daily-summary': {
    task: '汇总昨日各渠道的 GMV、订单量和渠道贡献，整理运营日报。',
    requirements: '注明统计周期和金额口径；缺失数据说明原因，不直接填为零。',
    output: '输出包含统计范围、GMV、订单量及渠道贡献的日报表格。',
    condition: '当本次任务需要查看指定日期的经营汇总时。'
  },
  'employee-certification-insight': {
    task: '查询本周待处理的认证记录，按原因汇总并列出可跟进对象。',
    requirements: '仅查询授权范围内记录；名单使用脱敏标识，原因不明时注明待核实。',
    output: '输出按原因分类的数量统计，以及脱敏的待跟进名单。',
    condition: '当本次任务需要查询职场认证状态时。'
  },
  'workplace-segment-operations': {
    task: '分析近 30 天已认证人群的规模和转化表现，提出运营建议。',
    requirements: '保持人群范围和统计周期一致；区分数据事实与建议。',
    output: '输出人群规模、转化表现及有数据依据的运营建议。',
    condition: '当认证人群范围已明确，且本次任务需要经营分析时。'
  },
  'enterprise-customer-followup': {
    task: '针对首次采购咨询，整理下一步跟进建议、重点事项和沟通要点。',
    requirements: '依据已提供的信息给出建议；未知意向、预算和需求列为待确认事项。',
    output: '输出分步骤跟进建议、待确认事项和首次沟通提纲。',
    condition: '当企业客户与跟进目标已明确，且需要进一步沟通建议时。'
  }
}
const selectedNodeExamples = computed(() => nodeExamples[selectedStep.value?.skillId || ''] || {
  task: `根据本次任务要求执行“${selectedStep.value?.name || '当前 Skill'}”，说明处理结果。`,
  requirements: '仅使用有权限且可核实的数据；信息不足时说明缺失项。',
  output: '列出本节点的处理结果、依据和未完成事项。',
  condition: `当本次任务需要“${selectedStep.value?.name || '当前 Skill'}”时。`
})
const chainResolution = computed(() => resolveScenarioChain(displaySteps.value))
const executionIndex = computed(() => new Map(chainResolution.value.ok
  ? chainResolution.value.steps.map((step, index) => [step.id, index + 1]) : []))
const connections = computed(() => displaySteps.value.flatMap(target => {
  const source = displaySteps.value.find(step => step.id === target.predecessorId)
  return source ? [{ source, target }] : []
}))
const selectedConnection = computed(() => connections.value.find(edge => edge.target.id === selectedConnectionId.value))
const groups = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  const grouped = new Map<string, ScenarioSelectableSkill[]>()
  for (const skill of props.skills) {
    if (query && !`${skill.name} ${skill.id} ${skill.menu} ${skill.online}`.toLocaleLowerCase().includes(query)) continue
    const menu = skill.menu || '其他'
    const items = grouped.get(menu) || []
    items.push(skill)
    grouped.set(menu, items)
  }
  return Array.from(grouped, ([menu, skills]) => ({ menu, skills }))
})
const canvasSize = computed(() => ({
  width: Math.max(1120, ...displaySteps.value.map(step => positionOf(step).x + NODE_WIDTH + 160)),
  height: Math.max(600, ...displaySteps.value.map(step => positionOf(step).y + heightOf(step) + 160))
}))
const temporaryPath = computed(() => {
  const source = displaySteps.value.find(step => step.id === pendingSourceId.value)
  return source && wirePoint.value ? pathBetween(portPoint(source, 'output'), wirePoint.value) : ''
})

watch(() => props.modelValue.map(step => step.id), (ids, previousIds = []) => {
  if (selectedStepId.value && ids.includes(selectedStepId.value)) return
  if (selectedConnectionId.value && ids.includes(selectedConnectionId.value)) return
  const previousIndex = previousIds.indexOf(selectedStepId.value || '')
  selectedStepId.value = ids[Math.min(Math.max(previousIndex, 0), ids.length - 1)] || null
}, { immediate: true })
watch(search, () => { collapsedMenus.value = new Set() })
watch(connections, edges => {
  if (selectedConnectionId.value && !edges.some(edge => edge.target.id === selectedConnectionId.value)) selectedConnectionId.value = null
})

function defaultPosition(index: number): Point {
  return { x: 48 + (index % 3) * 360, y: 72 + Math.floor(index / 3) * 280 }
}
function safePosition(position: Point): Point {
  return { x: Math.max(24, Math.round(Number.isFinite(position.x) ? position.x : 48)), y: Math.max(24, Math.round(Number.isFinite(position.y) ? position.y : 72)) }
}
function editableSteps(): CanvasStep[] {
  const current = props.modelValue as CanvasStep[]
  const legacy = current.length > 0 && current.every(step => step.predecessorId === undefined)
  return current.map((step, index) => ({
    ...step,
    predecessorId: legacy ? current[index - 1]?.id || null : step.predecessorId,
    position: step.position ? safePosition(step.position) : defaultPosition(index)
  }))
}
function positionOf(step: CanvasStep): Point {
  return nodeGesture.value?.id === step.id ? nodeGesture.value.position : step.position || defaultPosition(0)
}
function heightOf(step: CanvasStep) { return step.kind === 'conditional' ? NODE_CONDITION_HEIGHT : NODE_HEIGHT }
function portPoint(step: CanvasStep, side: 'input' | 'output'): Point {
  const p = positionOf(step)
  return { x: p.x + (side === 'output' ? NODE_WIDTH : 0), y: p.y + heightOf(step) / 2 }
}
function pathBetween(from: Point, to: Point): string {
  if (to.x >= from.x + 32) {
    const bend = Math.max(56, (to.x - from.x) / 2)
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`
  }
  const top = Math.max(12, Math.min(from.y, to.y) - 140)
  return `M ${from.x} ${from.y} C ${from.x + 80} ${from.y}, ${from.x + 80} ${top}, ${from.x + 32} ${top} L ${to.x - 32} ${top} C ${to.x - 80} ${top}, ${to.x - 80} ${to.y}, ${to.x} ${to.y}`
}
function edgePath(source: CanvasStep, target: CanvasStep) { return pathBetween(portPoint(source, 'output'), portPoint(target, 'input')) }
function tell(message: string, isError = false) { notice.value = message; noticeIsError.value = isError }
function toggleMenu(menu: string) {
  const next = new Set(collapsedMenus.value)
  if (next.has(menu)) next.delete(menu)
  else next.add(menu)
  collapsedMenus.value = next
}
function rememberNodeButton(id: string, element: unknown) {
  if (element instanceof HTMLButtonElement) nodeButtons.set(id, element)
  else nodeButtons.delete(id)
}
function revealNode(id: string) {
  const step = displaySteps.value.find(item => item.id === id)
  const view = viewport.value
  if (!step || !view) return
  const p = positionOf(step)
  const left = (p.x - 24) * zoom.value
  const top = (p.y - 24) * zoom.value
  const right = (p.x + NODE_WIDTH + 24) * zoom.value
  const bottom = (p.y + heightOf(step) + 24) * zoom.value
  if (left < view.scrollLeft) view.scrollLeft = left
  else if (right > view.scrollLeft + view.clientWidth) view.scrollLeft = right - view.clientWidth
  if (top < view.scrollTop) view.scrollTop = top
  else if (bottom > view.scrollTop + view.clientHeight) view.scrollTop = bottom - view.clientHeight
}
function selectStep(id: string, focus = false) {
  selectedStepId.value = id
  selectedConnectionId.value = null
  if (focus) void nextTick(() => { nodeButtons.get(id)?.focus({ preventScroll: true }); revealNode(id) })
}
defineExpose({
  focusNode: (id: string) => {
    if (!props.modelValue.some(step => step.id === id)) return
    selectStep(id, true)
    void nextTick(() => {
      nodeButtons.get(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      configurationBody.value?.scrollTo({ top: 0 })
    })
  }
})

function selectConnection(targetId: string) {
  selectedConnectionId.value = targetId
  selectedStepId.value = null
  cancelGestures()
}
function addSkill(skillId: string, point?: Point) {
  const skill = catalog.value.get(skillId)
  if (!skill) return tell('该 Skill 已不在可用目录中，请选择其他 Skill。', true)
  const existing = props.modelValue.find(step => step.skillId === skill.id)
  if (existing) { selectStep(existing.id, true); tell(`“${existing.name}”已加入，已定位对应节点。`); return }
  try {
    const step = { ...createPinnedScenarioStep(skill, { required: true, task: '', expectedOutput: '' }), predecessorId: null, position: safePosition(point || defaultPosition(props.modelValue.length)) } as CanvasStep
    emit('update:modelValue', [...editableSteps(), step])
    selectStep(step.id, true)
    tell(`已加入“${step.name}”。连接输入与输出端口，将它接入执行链路。`)
  } catch { tell('该 Skill 当前不可加入，请刷新可用目录后重试。', true) }
}
function updateSelectedStep(patch: StepConfiguration) {
  if (!selectedStepId.value) return
  emit('update:modelValue', editableSteps().map(step => step.id === selectedStepId.value ? { ...step, ...patch } : step))
}
function setSelectedKind(kind: ScenarioStepKind) {
  if (!selectedStepId.value || !['required', 'conditional'].includes(kind)) return
  emit('update:modelValue', editableSteps().map(step => step.id === selectedStepId.value
    ? { ...step, kind, required: kind === 'required', condition: kind === 'required' ? undefined : step.condition } : step))
}
function removeStep(id: string) {
  const current = editableSteps()
  const index = current.findIndex(step => step.id === id)
  const removed = current[index]
  if (!removed) return
  const restoreFocus = selectedStepId.value === id || (typeof document !== 'undefined'
    && nodeButtons.get(id)?.closest('.composer-node')?.contains(document.activeElement))
  const next = current.filter(step => step.id !== id).map(step => step.predecessorId === id ? { ...step, predecessorId: null } : step)
  emit('update:modelValue', next)
  if (selectedStepId.value === id) selectedStepId.value = next[Math.min(index, next.length - 1)]?.id || null
  if (selectedConnectionId.value === id || current.find(step => step.id === selectedConnectionId.value)?.predecessorId === id) selectedConnectionId.value = null
  if (pendingSourceId.value === id) cancelGestures()
  if (restoreFocus) {
    if (selectedStepId.value) selectStep(selectedStepId.value, true)
    else void nextTick(() => searchInput.value?.focus({ preventScroll: true }))
  }
  tell(`已移除“${removed.name}”及其连线，其他节点的位置保持不变。`)
}
function connectionProblem(sourceId: string, targetId: string): string | null {
  const steps = editableSteps()
  if (sourceId === targetId) return '不能将节点连接到自身。'
  const source = steps.find(step => step.id === sourceId)
  const target = steps.find(step => step.id === targetId)
  if (!source || !target) return '连接的节点已不存在，请重新选择。'
  if (target.predecessorId && target.predecessorId !== sourceId) return '此节点已有前序，请在画布中选中原连线并删除，再拖拽连接。'
  if (steps.some(step => step.predecessorId === sourceId && step.id !== targetId)) return '一个节点只能连接一个后续步骤，请先断开已有输出连线。'
  const visited = new Set<string>()
  let cursor: CanvasStep | undefined = source
  while (cursor) {
    if (cursor.id === targetId) return '这条连接会形成循环，请选择其他节点。'
    if (visited.has(cursor.id)) return '当前链路包含循环，请先删除相关连线。'
    visited.add(cursor.id)
    cursor = steps.find(step => step.id === cursor?.predecessorId)
  }
  return null
}
function connectNodes(sourceId: string, targetId: string) {
  const problem = connectionProblem(sourceId, targetId)
  if (problem) { tell(problem, true); return false }
  emit('update:modelValue', editableSteps().map(step => step.id === targetId ? { ...step, predecessorId: sourceId } : step))
  pendingSourceId.value = null
  wirePoint.value = null
  selectStep(targetId)
  tell('已连接。执行顺序由箭头方向决定，节点位置可自由调整。')
  return true
}
function disconnectNode(targetId: string) {
  const target = displaySteps.value.find(step => step.id === targetId)
  if (!target?.predecessorId) return
  emit('update:modelValue', editableSteps().map(step => step.id === targetId ? { ...step, predecessorId: null } : step))
  selectedConnectionId.value = null
  selectStep(targetId, true)
  tell('已删除连线。节点与属性保持不变，可重新连接。')
}
function armConnection(event: MouseEvent, id: string) {
  hoveredWireTarget.value = null
  if (event.detail > 0 && Date.now() < ignorePortClickUntil) return
  pendingSourceId.value = pendingSourceId.value === id ? null : id
  wirePoint.value = null
  tell(pendingSourceId.value ? '已选择输出端口，可点击目标输入圆点完成连接；拖线时在目标卡片上松开即可连接。' : '已取消连接。')
}
function finishInput(id: string) {
  if (!pendingSourceId.value) return tell('请先选择上一步节点的输出端口。')
  connectNodes(pendingSourceId.value, id)
}
function pointAt(clientX: number, clientY: number): Point {
  const rect = stage.value?.getBoundingClientRect()
  return rect ? { x: (clientX - rect.left) / zoom.value, y: (clientY - rect.top) / zoom.value } : { x: 48, y: 72 }
}
function startNodeMove(event: PointerEvent, id: string) {
  if (event.button !== 0) return
  const step = displaySteps.value.find(item => item.id === id)
  if (!step) return
  cancelGestures()
  selectStep(id)
  const point = pointAt(event.clientX, event.clientY)
  const position = positionOf(step)
  nodeGesture.value = { id, pointerId: event.pointerId, offset: { x: point.x - position.x, y: point.y - position.y }, position, moved: false, start: { x: event.clientX, y: event.clientY } }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function startWireMove(event: PointerEvent, sourceId: string) {
  if (event.button !== 0) return
  hoveredWireTarget.value = null
  event.stopPropagation()
  wireGesture.value = { sourceId, pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, moved: false }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function autoScroll(event: PointerEvent) {
  const view = viewport.value
  if (!view) return
  const rect = view.getBoundingClientRect()
  if (event.clientX < rect.left + 24) view.scrollLeft -= 12
  else if (event.clientX > rect.right - 24) view.scrollLeft += 12
  if (event.clientY < rect.top + 24) view.scrollTop -= 12
  else if (event.clientY > rect.bottom - 24) view.scrollTop += 12
}
function cardTargetAt(event: PointerEvent) {
  const card = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-step-id]')
  return card && viewport.value?.contains(card) ? card.dataset.stepId : undefined
}
function previewHoveredCard(event: PointerEvent) {
  const source = pendingSourceId.value
  const target = source && !nodeGesture.value ? cardTargetAt(event) : undefined
  hoveredWireTarget.value = source && target && !connectionProblem(source, target) ? target : null
}
function movePointer(event: PointerEvent) {
  const node = nodeGesture.value
  const wire = wireGesture.value
  if (node && node.pointerId === event.pointerId) {
    if (!node.moved && Math.hypot(event.clientX - node.start.x, event.clientY - node.start.y) < 4) return
    autoScroll(event)
    const point = pointAt(event.clientX, event.clientY)
    nodeGesture.value = { ...node, moved: true, position: safePosition({ x: point.x - node.offset.x, y: point.y - node.offset.y }) }
  } else if (wire && wire.pointerId === event.pointerId) {
    if (!wire.moved && Math.hypot(event.clientX - wire.start.x, event.clientY - wire.start.y) < 4) return
    wireGesture.value = { ...wire, moved: true }
    pendingSourceId.value = wire.sourceId
    autoScroll(event)
    wirePoint.value = pointAt(event.clientX, event.clientY)
  } else if (pendingSourceId.value) wirePoint.value = pointAt(event.clientX, event.clientY)
  previewHoveredCard(event)
}
function endPointer(event: PointerEvent) {
  const node = nodeGesture.value
  const wire = wireGesture.value
  if (node?.pointerId === event.pointerId) {
    if (node.moved) emit('update:modelValue', editableSteps().map(step => step.id === node.id ? { ...step, position: node.position } : step))
    nodeGesture.value = null
  }
  if (wire?.pointerId === event.pointerId) {
    if (wire.moved) {
      ignorePortClickUntil = Date.now() + 200
      const target = cardTargetAt(event)
      if (target) connectNodes(wire.sourceId, target)
      else tell('拖到目标卡片后松开即可连接，或按 Esc 取消。')
    }
    wireGesture.value = null
    hoveredWireTarget.value = null
  }
}
function cancelGestures() { hoveredWireTarget.value = null; nodeGesture.value = null; wireGesture.value = null; pendingSourceId.value = null; wirePoint.value = null }
function nudgeNode(event: KeyboardEvent, id: string) {
  const offsets: Record<string, Point> = { ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 }, ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 } }
  const delta = offsets[event.key]
  if (!delta) return
  event.preventDefault()
  emit('update:modelValue', editableSteps().map(step => {
    if (step.id !== id) return step
    const position = positionOf(step)
    return { ...step, position: safePosition({ x: position.x + delta.x, y: position.y + delta.y }) }
  }))
  void nextTick(() => revealNode(id))
}
function startSkillDrag(event: DragEvent, id: string) {
  if (!event.dataTransfer) return
  draggedSkillId.value = id
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/x-scenario-skill', id)
}
function finishSkillDrag() { draggedSkillId.value = null; isDropOver.value = false }
function dragOverCanvas(event: DragEvent) {
  if (!draggedSkillId.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  isDropOver.value = true
}
function dropOnCanvas(event: DragEvent) {
  if (!draggedSkillId.value) return
  event.preventDefault()
  const point = pointAt(event.clientX, event.clientY)
  addSkill(draggedSkillId.value, { x: point.x - NODE_WIDTH / 2, y: point.y - 40 })
  finishSkillDrag()
}
function handleCanvasWheel(event: WheelEvent) {
  // Chromium reports trackpad pinch as Ctrl+wheel; ordinary scrolling remains native.
  if (!event.ctrlKey || !viewport.value) return
  event.preventDefault()
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.value.clientHeight : 1)
  changeZoom(zoom.value * Math.exp(-delta * 0.01), { x: event.clientX, y: event.clientY })
}
function changeZoom(value: number, pointer?: Point) {
  const view = viewport.value
  const oldZoom = zoom.value
  const bounds = view?.getBoundingClientRect()
  const anchor = view && bounds && pointer ? { x: pointer.x - bounds.left - view.clientLeft, y: pointer.y - bounds.top - view.clientTop } : { x: (view?.clientWidth || 0) / 2, y: (view?.clientHeight || 0) / 2 }
  const center = view ? { x: (view.scrollLeft + anchor.x) / oldZoom, y: (view.scrollTop + anchor.y) / oldZoom } : null
  zoom.value = Math.min(1.5, Math.max(0.4, Math.round(value * 100) / 100))
  if (view && center) void nextTick(() => { view.scrollLeft = center.x * zoom.value - anchor.x; view.scrollTop = center.y * zoom.value - anchor.y })
}
function fitCanvas() {
  const view = viewport.value
  if (!view || !displaySteps.value.length) { changeZoom(1); return }
  const points = displaySteps.value.map(step => ({ ...positionOf(step), height: heightOf(step) }))
  const minX = Math.min(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  const maxX = Math.max(...points.map(p => p.x + NODE_WIDTH))
  const maxY = Math.max(...points.map(p => p.y + p.height))
  zoom.value = Math.max(0.4, Math.min(1, (view.clientWidth - 64) / (maxX - minX), (view.clientHeight - 64) / (maxY - minY)))
  void nextTick(() => { view.scrollLeft = minX * zoom.value - 32; view.scrollTop = minY * zoom.value - 32 })
}
function arrangeLayout() {
  const current = editableSteps()
  const resolution = resolveScenarioChain(current)
  const ordered = resolution.ok ? resolution.steps : current
  const positions = new Map(ordered.map((step, index) => [step.id, { x: 48 + index * 376, y: 96 }]))
  emit('update:modelValue', current.map(step => ({ ...step, position: positions.get(step.id) || step.position })))
  void nextTick(fitCanvas)
  tell('已整理节点位置，连线与执行顺序保持不变。')
}
function isUnavailable(step: CanvasStep) { return !catalog.value.has(step.skillId) || ['expired', 'unavailable', 'emergency_disabled'].includes(step.dependencyState) }
function hasVersionChange(step: CanvasStep) { return Boolean(catalog.value.get(step.skillId) && catalog.value.get(step.skillId)?.online !== step.pinnedVersion) || step.dependencyState === 'update_available' }
</script>

<template>
  <div class="scenario-composer" @dragend="finishSkillDrag" @keydown.esc="cancelGestures">
    <SectionHeader title="Skill 链路编排" description="拖入 Skill 自由摆放，拖拽输出端口到输入端口设置执行顺序，点击节点设置属性。">
      <template #meta>已加入 {{ modelValue.length }} 个 · 涉及 {{ menuCount }} 个菜单</template>
    </SectionHeader>
    <div class="scenario-composer-layout" tabindex="0" role="group" aria-label="Skill 编排区域">
      <section class="composer-panel composer-library" aria-label="已发布 Skill 分类库">
        <header class="composer-panel-head"><h3>Skill 分类库</h3><span>{{ skills.length }} 个可用</span></header>
        <label class="composer-field composer-search"><input aria-label="搜索 Skill" ref="searchInput" v-model="search" type="search" placeholder="搜索 Skill：名称、分类或版本" autocomplete="off"></label>
        <p class="composer-help">拖到画布任意位置，或点击“加入”。</p>
        <div v-if="groups.length" class="composer-library-groups" tabindex="0" role="group" aria-label="可滚动的 Skill 列表">
          <section v-for="group in groups" :key="group.menu" class="composer-library-group">
            <h4><button type="button" class="composer-group-toggle" :aria-expanded="!collapsedMenus.has(group.menu)" @click="toggleMenu(group.menu)"><span class="composer-chevron" :class="{ 'is-open': !collapsedMenus.has(group.menu) }" aria-hidden="true">›</span><span>{{ group.menu }}</span><small>{{ group.skills.length }}</small></button></h4>
            <ul v-show="!collapsedMenus.has(group.menu)" class="composer-library-list">
              <li v-for="skill in group.skills" :key="skill.id" class="composer-library-skill" :class="{ 'is-added': selectedSkillIds.has(skill.id) }" draggable="true" :data-skill-id="skill.id" @dragstart="startSkillDrag($event, skill.id)">
                <span class="composer-grip" aria-hidden="true">⠿</span><div class="composer-skill-summary"><strong>{{ skill.name }}</strong><small>版本 {{ skill.online }}</small></div>
                <button type="button" class="composer-text-button" :aria-label="`${selectedSkillIds.has(skill.id) ? '定位已加入的' : '加入'} ${skill.name}`" draggable="false" @click="addSkill(skill.id)">{{ selectedSkillIds.has(skill.id) ? '已加入' : '加入' }}</button>
              </li>
            </ul>
          </section>
        </div>
        <div v-else class="composer-empty" role="status"><strong>{{ skills.length ? '没有找到匹配的 Skill' : '暂无可选 Skill' }}</strong><p>{{ skills.length ? '尝试其他名称或分类。' : '先在 Skill Hub 发布可用 Skill，再回来编排。' }}</p></div>
      </section>

      <section class="composer-panel composer-workspace" aria-label="Skill 自由编排画布">
        <header class="composer-canvas-toolbar" :class="{ 'is-focused': focused }">
          <div class="composer-canvas-title"><h3>编排画布</h3><span>{{ connections.length }} 条连线</span><span class="composer-toolbar-state" :class="{ 'has-connection': pendingSourceId }">
            <span v-if="pendingSourceId">拖到目标卡片后松开即可连接，Esc 取消</span>
            <span v-else-if="modelValue.length && chainResolution.ok">已连接为 {{ modelValue.length }} 步执行链路</span>
            <span v-else-if="modelValue.length">将所有节点连接为一条完整链路</span>
            <span v-else>从左侧拖入 Skill，开始连接业务链路</span>
          </span></div>
          <div class="composer-canvas-tools" role="toolbar" aria-label="画布工具">
            <div v-if="focused" class="composer-focus-exit-group">
              <span id="composer-focus-exit-help" class="composer-focus-exit-help">退出全屏后可保存草稿、切换步骤</span>
              <button type="button" class="composer-tool-button composer-focus-exit" aria-describedby="composer-focus-exit-help" aria-label="退出专注编排" @click="emit('toggle-focus')">退出全屏</button>
            </div>
            <button v-if="!focused" type="button" class="composer-tool-button" aria-label="全屏编排" @click="emit('toggle-focus')">全屏</button>
            <button type="button" class="composer-tool-button" aria-label="缩小画布" :disabled="zoom <= 0.4" @click="changeZoom(zoom - 0.1)">−</button>
            <button type="button" class="composer-tool-button composer-zoom" aria-label="还原画布缩放至百分之百" @click="changeZoom(1)">{{ Math.round(zoom * 100) }}%</button>
            <button type="button" class="composer-tool-button" aria-label="放大画布" :disabled="zoom >= 1.5" @click="changeZoom(zoom + 0.1)">＋</button>
            <button type="button" class="composer-tool-button" @click="fitCanvas">适应</button>
            <button type="button" class="composer-tool-button" :disabled="!modelValue.length" @click="arrangeLayout">整理布局</button>
          </div>
        </header>
        <div
          ref="viewport" class="composer-canvas-viewport" :class="{ 'is-drop-over': isDropOver, 'is-connecting': pendingSourceId }" tabindex="0" aria-label="可滚动的编排画布" data-canvas-drop
          @wheel="handleCanvasWheel" @dragover="dragOverCanvas" @dragleave.self="isDropOver = false" @drop="dropOnCanvas" @pointermove="movePointer" @pointerup="endPointer" @pointercancel="cancelGestures" @pointerleave="cancelGestures"
        >
          <div class="composer-canvas-frame" :style="{ width: `${canvasSize.width * zoom}px`, height: `${canvasSize.height * zoom}px` }">
            <div ref="stage" class="composer-canvas-stage" :style="{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, transform: `scale(${zoom})` }" @pointerdown.self="selectedStepId = null; selectedConnectionId = null">
              <svg class="composer-connections" :width="canvasSize.width" :height="canvasSize.height" aria-label="执行链路连线">
                <defs><marker :id="markerId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="composer-arrow" /></marker></defs>
                <g v-for="edge in connections" :key="edge.target.id" :data-edge-id="`${edge.source.id}->${edge.target.id}`" :data-source-id="edge.source.id" :data-target-id="edge.target.id">
                  <path class="composer-edge" :class="{ 'is-selected': selectedConnectionId === edge.target.id }" :d="edgePath(edge.source, edge.target)" :marker-end="`url(#${markerId})`" />
                  <path
                    class="composer-edge-hit" :d="edgePath(edge.source, edge.target)" tabindex="0" role="button" :aria-label="`选择连线 ${edge.source.name} 至 ${edge.target.name}`" :aria-pressed="selectedConnectionId === edge.target.id"
                    @pointerdown.stop @click.stop="selectConnection(edge.target.id)" @keydown.enter.prevent="selectConnection(edge.target.id)" @keydown.space.prevent="selectConnection(edge.target.id)" @keydown.delete.prevent="disconnectNode(edge.target.id)"
                  />
                </g>
                <path v-if="temporaryPath" class="composer-edge composer-edge-pending" :d="temporaryPath" :marker-end="`url(#${markerId})`" />
              </svg>
              <article
                v-for="step in displaySteps" :key="step.id" class="composer-node" :class="{ 'is-wire-target': hoveredWireTarget === step.id, 'is-selected': selectedStepId === step.id, 'is-unavailable': isUnavailable(step), 'is-moving': nodeGesture?.id === step.id, 'has-trial-error': trialErrors?.[step.id]?.length }" :data-step-id="step.id"
                :style="{ left: `${positionOf(step).x}px`, top: `${positionOf(step).y}px`, width: `${NODE_WIDTH}px`, height: `${heightOf(step)}px` }"
              >
                <button type="button" class="composer-port composer-port-input" :class="{ 'is-connected': step.predecessorId, 'is-target': pendingSourceId && pendingSourceId !== step.id }" :data-input-port="step.id" :aria-label="`${step.name} 输入端口`" title="输入端口：连接上一步" @pointerdown.stop @click.stop="finishInput(step.id)"><span></span></button>
                <button :ref="element => rememberNodeButton(step.id, element)" type="button" class="composer-node-select" :aria-pressed="selectedStepId === step.id" :aria-label="`配置节点 ${step.name}`" @pointerdown="startNodeMove($event, step.id)" @click="selectStep(step.id)" @keydown="nudgeNode($event, step.id)">
                  <span class="composer-node-top"><span class="composer-node-icon" aria-hidden="true">S</span><strong :title="step.name">{{ step.name }}</strong><span class="composer-grip" aria-hidden="true">⠿</span></span>
                  <span class="composer-node-badges"><span class="composer-kind">{{ step.kind === 'required' ? '核心链路' : '条件链路' }}</span><span class="composer-node-order">{{ executionIndex.get(step.id) ? `执行第 ${executionIndex.get(step.id)} 步` : step.predecessorId ? '已接入前序' : '未设置前序' }}</span></span>
                  <span v-if="trialErrors?.[step.id]?.length" class="composer-trial-badge">{{ trialStale ? '上次报错 · 待重试' : '试运行报错 · 查看节点提示' }}</span>
                  <span v-else class="composer-node-meta" :title="`${step.menu} · 固定版本 ${step.pinnedVersion}`">{{ step.menu }} · 固定版本 {{ step.pinnedVersion }}</span>
                  <span v-if="step.kind === 'conditional'" class="composer-node-condition"><strong>◇ 判断条件</strong><span :title="step.condition || '待设置判断条件'">{{ step.condition?.trim() || '待设置判断条件' }}</span></span>
                  <span v-if="isUnavailable(step)" class="composer-node-warning">Skill 已失效，请移除后重新选择</span><span v-else-if="hasVersionChange(step)" class="composer-node-warning composer-version-warning">线上版本已变化，固定版本保持不变</span>
                </button>
                <div class="composer-node-footer"><span>{{ step.kind === 'conditional' ? '不满足条件时跳过，继续下一步' : '连接端口设置前后顺序' }}</span><button type="button" class="composer-text-button composer-remove" :aria-label="`移除 ${step.name}`" @click="removeStep(step.id)">移除</button></div>
                <button type="button" class="composer-port composer-port-output" :class="{ 'is-connected': connections.some(edge => edge.source.id === step.id), 'is-armed': pendingSourceId === step.id }" :data-output-port="step.id" :aria-label="`${step.name} 输出端口`" title="输出端口：连接下一步" @pointerdown="startWireMove($event, step.id)" @click.stop="armConnection($event, step.id)"><span></span></button>
              </article>
            </div>
          </div>
          <div v-if="!modelValue.length" class="composer-canvas-empty">
            <span class="composer-empty-symbol" aria-hidden="true">＋</span><strong>将 Skill 拖到这里</strong><p>自由摆放节点，连接端口建立执行顺序。</p>
          </div>
        </div>
        <footer class="composer-canvas-footer">
          <span role="status" aria-live="polite" :class="{ 'is-error': noticeIsError }">{{ notice || '拖动节点 · 端口连线 · 双指捏合缩放' }}</span>
          <button type="button" class="composer-help-button" data-tooltip="从左侧拖入 Skill；拖动节点调整位置；从输出端口发起连线，拖到目标卡片后松开即可连接；方向键移动选中节点；触控板双指捏合缩放，双指滑动平移。" aria-label="画布操作说明">操作说明</button>
        </footer>
      </section>

      <section class="composer-panel composer-configuration" aria-label="节点配置">
        <header class="composer-panel-head"><h3>{{ selectedConnection ? '连线配置' : '节点配置' }}</h3><span v-if="selectedStep && executionIndex.get(selectedStep.id)">第 {{ executionIndex.get(selectedStep.id) }} 步</span></header>
        <div v-if="selectedConnection" class="composer-configuration-body" tabindex="0" role="group" aria-label="可滚动的连线属性">
          <div class="composer-selected-summary"><strong>执行连接</strong><p>依次执行前后两个节点。</p></div>
          <div class="composer-edge-detail"><span>前序节点</span><strong>{{ selectedConnection.source.name }}</strong><span aria-hidden="true">↓</span><span>后续节点</span><strong>{{ selectedConnection.target.name }}</strong></div>
          <p class="composer-help">删除连线会保留两个节点与各自属性，后续可重新连接。</p>
          <button type="button" class="composer-delete-connection" @click="disconnectNode(selectedConnection.target.id)">删除连线</button>
        </div>
        <div v-else-if="selectedStep" ref="configurationBody" class="composer-configuration-body" tabindex="0" role="group" aria-label="可滚动的节点属性">
          <div class="composer-selected-summary"><strong>{{ selectedStep.name }}</strong><p>{{ selectedStep.menu }}</p><span class="composer-version-tag" tabindex="0" data-tooltip="加入时固定版本，Skill 发布新版后不会自动切换。">固定版本 {{ selectedStep.pinnedVersion }}</span></div>
          <aside v-if="selectedTrialErrors.length" class="composer-trial-errors" aria-label="节点试运行提示">
            <strong>{{ trialStale ? '上次试运行提示' : '试运行错误' }}</strong>
            <p class="composer-trial-label">报错原因</p>
            <ul><li v-for="message in selectedTrialErrors" :key="message">{{ message }}</li></ul>
            <p class="composer-trial-label">修改建议</p>
            <ul><li v-for="suggestion in selectedTrialSuggestions" :key="suggestion">{{ suggestion }}</li></ul>
            <p>{{ trialStale ? '配置已修改，以上提示保留供参考；修改后请到下一步重新试运行。' : '请根据提示修改节点，再到下一步重新试运行；没有节点错误后才能提交。' }}</p>
          </aside>
          <p v-if="isUnavailable(selectedStep)" class="composer-warning" role="alert">此 Skill 已失效，请在操作区移除后重新选择。</p>
          <div class="composer-node-contract" :data-node-contract="selectedStep.id">
            <div class="composer-config-field-group"><label class="composer-field">
              <span>本节点任务 <b v-if="!selectedPublishedSkill?.description?.trim()">必填</b></span>
              <textarea :value="selectedNodeContract?.task || ''" rows="3" :required="!selectedPublishedSkill?.description?.trim()" :placeholder="selectedPublishedSkill?.description || `例如：${selectedNodeExamples.task}`" @input="updateSelectedStep({ task: ($event.target as HTMLTextAreaElement).value })"></textarea>
              <small v-if="selectedPublishedSkill?.description?.trim()">未填写时按当前固定版本 Skill 的任务说明执行，也可填写本场景的具体任务。</small>
              <small v-else>填写本节点要处理的对象和具体动作；当前固定版本未提供任务说明，需补充后试运行。</small>
            </label><details :key="selectedStep.id + 'task'" class="composer-field-example"><summary>查看填写示例</summary><p>{{ selectedNodeExamples.task }}</p></details></div>
            <div class="composer-config-field-group"><label class="composer-field">
              <span>固定要求 <small class="composer-optional-tag">选填</small></span>
              <textarea :value="selectedNodeContract?.fixedRequirements || ''" rows="3" :placeholder="`例如：${selectedNodeExamples.requirements}`" @input="updateSelectedStep({ fixedRequirements: ($event.target as HTMLTextAreaElement).value })"></textarea>
            </label><details :key="selectedStep.id + 'requirements'" class="composer-field-example"><summary>查看填写示例</summary><p>{{ selectedNodeExamples.requirements }}</p></details></div>
            <div class="composer-config-field-group"><label class="composer-field">
              <span>预期输出</span>
              <textarea :value="selectedNodeContract?.expectedOutput || ''" rows="3" :placeholder="selectedPublishedSkill?.outputDescription || `例如：${selectedNodeExamples.output}`" @input="updateSelectedStep({ expectedOutput: ($event.target as HTMLTextAreaElement).value })"></textarea>
              <small>可参考 Skill 的输出说明填写预期结果；提示文字不会作为已填内容保存。</small>
            </label><details :key="selectedStep.id + 'output'" class="composer-field-example"><summary>查看填写示例</summary><p>{{ selectedNodeExamples.output }}</p></details></div>
          </div>
          <section class="composer-execution-settings" aria-label="执行设置"><h4>执行设置</h4>

            <label class="composer-field"><span>所属链路</span><select :value="selectedStep.kind" @change="setSelectedKind(($event.target as HTMLSelectElement).value as ScenarioStepKind)"><option value="required">核心链路（必需执行）</option><option value="conditional">条件链路（满足条件执行）</option></select><small>选择示例：每次都要执行选“核心链路”；仅在特定需求下执行选“条件链路”。</small></label>
            <div v-if="selectedStep.kind === 'conditional'" class="composer-condition-editor"><label class="composer-field"><span>判断条件 <b>必填</b></span><textarea :value="selectedStep.condition || ''" rows="3" required :placeholder="`例如：${selectedNodeExamples.condition}`" @input="updateSelectedStep({ condition: ($event.target as HTMLTextAreaElement).value })"></textarea><small>条件满足才执行此步；不满足则继续下一步。</small><small>填写示例：{{ selectedNodeExamples.condition }}</small></label><button type="button" class="composer-condition-example" @click="updateSelectedStep({ condition: selectedNodeExamples.condition })">使用此条件示例</button></div>
            <p v-else class="composer-help">此步骤属于核心链路；依赖过期或不可用时，整个技能包暂停。</p>
          </section>
          <details :key="selectedStep.id" class="composer-node-advanced">
            <summary>高级信息</summary>
            <dl><div><dt>节点 ID</dt><dd>{{ selectedStep.id }}</dd></div><div><dt>Skill ID</dt><dd>{{ selectedStep.skillId }}</dd></div></dl>
          </details>
        </div>
        <div v-else class="composer-empty"><strong>请选择节点或连线</strong><p>点击节点设置属性；点击连线查看或删除连接。</p></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.composer-node.has-trial-error { border-color: var(--color-danger); }
.composer-trial-badge { color: var(--color-danger); font-size: var(--text-xs); line-height: 1.6; }
.composer-trial-errors { margin-bottom: 16px; padding: 12px; border: 1px solid var(--color-danger); border-radius: var(--radius-md); background: var(--color-danger-subtle); font-size: var(--text-sm); line-height: 1.6; overflow-wrap: anywhere; }
.composer-trial-errors strong { color: var(--color-danger); }
.composer-trial-errors ul { margin: 8px 0; padding-left: 20px; }
.composer-trial-errors p { margin: 0; color: var(--color-text-secondary); }
.composer-trial-errors .composer-trial-label { margin-top: 8px; color: var(--color-text); font-weight: 500; }
.scenario-composer { container: scenario-composer / inline-size; display: flex; flex: 1 1 auto; flex-direction: column; width: 100%; min-width: 0; min-height: 0; }
.scenario-composer :deep(.content-section-header) { flex: 0 0 auto; }
.scenario-composer :deep(.content-section-header__heading) { flex-basis: auto; }
.scenario-composer-layout { display: grid; flex: 1 1 auto; grid-template-columns: 240px minmax(0, 1fr) 288px; grid-template-rows: minmax(360px, 1fr); gap: 16px; min-width: 0; min-height: 0; margin-top: 16px; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.scenario-composer-layout * { box-sizing: border-box; }
.composer-panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 16px; overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
.composer-panel > :not(.composer-library-groups, .composer-canvas-viewport, .composer-configuration-body, .composer-empty) { flex-shrink: 0; }
.composer-panel-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; margin-bottom: 16px; }
.composer-panel-head h3, .composer-canvas-title h3 { margin: 0; font-size: 14px; color: var(--color-text); }
.composer-panel-head > span, .composer-help, .composer-field small { color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-help { margin: 8px 0 16px; }
.composer-field { display: grid; gap: 8px; min-width: 0; color: var(--color-text); font-size: 13px; }
.composer-field > span { font-weight: 500; }
.composer-field b { color: var(--color-danger); font-size: 12px; font-weight: 400; }
.composer-field input, .composer-field select, .composer-field textarea { width: 100%; min-width: 0; max-width: 100%; min-height: var(--control-height-md); padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; }
.composer-static-field, .composer-static-field dd { margin: 0; }
.composer-static-field dt { font-weight: 500; }
.composer-static-value { font-family: var(--font-mono); line-height: 1.6; overflow-wrap: anywhere; }
.composer-field textarea { resize: vertical; line-height: 1.6; }
.composer-field input:hover, .composer-field select:hover, .composer-field textarea:hover { border-color: var(--color-border-strong); }
.scenario-composer :is(button, input, select, textarea, [tabindex]):focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.composer-library-groups { display: grid; flex: 1 1 auto; align-content: start; gap: 12px; min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 4px; }
.composer-library-group, .composer-library-group h4 { min-width: 0; margin: 0; }
.composer-group-toggle { display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0; padding: 8px 0; border: 0; background: transparent; color: var(--color-text); text-align: left; font: inherit; font-size: 13px; cursor: pointer; }
.composer-group-toggle > span:not(.composer-chevron) { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.composer-group-toggle small { color: var(--color-text-secondary); font-size: 12px; font-weight: 400; }
.composer-chevron { flex: 0 0 auto; color: var(--color-text-secondary); font-size: 18px; line-height: 1; }
.composer-chevron.is-open { transform: rotate(90deg); }
.composer-library-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.composer-library-skill { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; padding: 12px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); cursor: grab; }
.composer-library-skill:hover { border-color: var(--color-primary-border); }
.composer-library-skill.is-added { background: var(--color-warning-subtle); border-color: var(--color-warning); }
.composer-library-skill.is-added .composer-text-button { color: var(--color-warning); font-weight: 600; }
.composer-grip { flex: 0 0 auto; color: var(--color-text-tertiary); font-size: 18px; line-height: 1; cursor: grab; }
.composer-skill-summary { flex: 1 1 72px; display: grid; gap: 4px; min-width: 0; }
.composer-skill-summary strong, .composer-selected-summary strong { color: var(--color-text); font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.composer-skill-summary small { color: var(--color-text-secondary); font-size: 12px; overflow-wrap: anywhere; }
.composer-text-button { flex-shrink: 0; min-height: var(--control-height-sm); padding: 4px; border: 0; border-radius: 4px; background: transparent; color: var(--color-primary); font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer; }
.composer-text-button:hover { background: var(--color-primary-subtle); }
.composer-text-button:disabled { color: var(--color-text-disabled); cursor: not-allowed; background: transparent; }
.composer-remove { color: var(--color-danger); }
.composer-workspace { padding: 0; overflow: hidden; }
.composer-canvas-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; padding: 16px; }
.composer-canvas-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.composer-canvas-title > span { color: var(--color-text-secondary); font-size: 12px; }
.composer-canvas-tools { display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
.composer-tool-button { min-width: 28px; min-height: var(--control-height-sm); padding: 4px 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); color: var(--color-text-secondary); font: inherit; font-size: 12px; cursor: pointer; }
.composer-tool-button:hover { border-color: var(--color-primary-border); color: var(--color-primary); }
.composer-tool-button:disabled { color: var(--color-text-disabled); cursor: not-allowed; }
.composer-zoom { min-width: 52px; font-family: var(--font-mono); }
.composer-canvas-state { padding: 8px 16px; border-top: 1px solid var(--color-border-subtle); color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-canvas-state.has-connection { color: var(--color-primary); background: var(--color-primary-subtle); }
.composer-canvas-viewport { position: relative; flex: 1 1 auto; width: 100%; min-width: 0; min-height: 0; overflow: auto; overscroll-behavior: contain; border-block: 1px solid var(--color-border); background-color: var(--color-bg-subtle); background-image: radial-gradient(var(--color-border-strong) 1px, transparent 1px); background-size: 20px 20px; }
.composer-canvas-viewport.is-drop-over { box-shadow: inset 0 0 0 2px var(--color-primary); }
.composer-canvas-viewport.is-connecting { cursor: crosshair; }
.composer-canvas-frame { position: relative; min-width: 0; }
.composer-canvas-stage { position: relative; transform-origin: top left; }
.composer-connections { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.composer-edge { fill: none; stroke: var(--color-primary); stroke-width: 2; opacity: 0.65; }
.composer-edge.is-selected { stroke-width: 3; opacity: 1; }
.composer-arrow { fill: var(--color-primary); }
.composer-edge-hit { fill: none; stroke: transparent; stroke-width: 16; pointer-events: stroke; cursor: pointer; }
.composer-edge-hit:focus-visible { stroke: var(--color-primary-border); outline: none; }
.composer-edge-pending { stroke-dasharray: 6 4; opacity: 0.8; }
.composer-node { position: absolute; min-width: 0; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-surface); }
.composer-node.is-selected { z-index: 2; border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-border); }
.composer-node.is-unavailable { border-style: dashed; }
.composer-node.is-moving { z-index: 3; }
.composer-node-select { display: flex; flex-direction: column; gap: 4px; width: 100%; height: calc(100% - 32px); min-width: 0; padding: 12px; border: 0; border-radius: var(--radius-md); background: transparent; text-align: left; color: var(--color-text); font: inherit; cursor: grab; touch-action: none; user-select: none; }
.composer-node.is-moving .composer-node-select { cursor: grabbing; }
.composer-node-top { display: flex; align-items: center; gap: 8px; min-width: 0; width: 100%; min-height: 32px; }
.composer-node-icon { display: flex; align-items: center; justify-content: center; flex: 0 0 28px; height: 28px; border: 1px solid var(--color-primary-border); border-radius: 4px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: 14px; font-weight: 600; }
.composer-node-top > strong { display: -webkit-box; flex: 1; min-width: 0; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--color-text); font-size: 13px; line-height: 1.4; overflow-wrap: anywhere; }
.composer-node-badges { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; }
.composer-kind { padding: 0 4px; border: 1px solid var(--color-primary-border); border-radius: 4px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: 12px; line-height: 1.7; white-space: nowrap; }
.composer-node-order { color: var(--color-text-secondary); font-size: 12px; line-height: 1.5; }
.composer-node-meta { max-width: 100%; overflow: hidden; color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; text-overflow: ellipsis; white-space: nowrap; }
.composer-node-condition { display: grid; gap: 4px; width: 100%; min-width: 0; margin-top: 4px; padding: 8px; border-radius: 4px; background: var(--color-primary-subtle); font-size: 12px; line-height: 1.5; }
.composer-node-condition strong { color: var(--color-primary); font-weight: 500; }
.composer-node-condition > span { overflow: hidden; color: var(--color-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.composer-node-warning { max-width: 100%; overflow: hidden; color: var(--color-danger); font-size: 12px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.composer-node-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 32px; min-width: 0; padding: 0 12px; border-top: 1px solid var(--color-border-subtle); }
.composer-node-footer > span { min-width: 0; overflow: hidden; color: var(--color-text-secondary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.composer-port { position: absolute; z-index: 4; top: 50%; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 9999px; background: transparent; transform: translateY(-50%); cursor: crosshair; touch-action: none; }
.composer-port-input { left: -16px; }
.composer-port-output { right: -16px; }
.composer-port > span { width: 12px; height: 12px; border: 2px solid var(--color-primary); border-radius: 9999px; background: var(--color-surface); }
.composer-port.is-connected > span { background: var(--color-primary); }
.composer-port:hover > span, .composer-port.is-armed > span, .composer-port.is-target > span { box-shadow: 0 0 0 4px var(--color-primary-border); }
.composer-canvas-empty { position: absolute; top: 140px; left: 24px; right: 24px; display: grid; justify-items: center; gap: 12px; min-width: 0; color: var(--color-text); text-align: center; pointer-events: none; }
.composer-empty-symbol { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border: 1px dashed var(--color-primary-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-primary); font-size: 24px; }
.composer-canvas-empty strong { font-size: 14px; font-weight: 500; }
.composer-canvas-empty p { margin: 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-canvas-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; min-width: 0; padding: 12px 16px; color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; }
.composer-canvas-footer > span { min-width: 0; overflow-wrap: anywhere; }
.composer-notice { margin: 0; padding: 12px 16px; border-top: 1px solid var(--color-border-subtle); color: var(--color-primary); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-notice.is-error { color: var(--color-danger); }
.composer-empty { display: grid; align-content: start; gap: 8px; min-width: 0; min-height: 0; padding: 24px 0; overflow-y: auto; overscroll-behavior: contain; text-align: center; }
.composer-empty strong { color: var(--color-text); font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.composer-empty p { margin: 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.composer-configuration-body { display: grid; flex: 1 1 auto; align-content: start; gap: 16px; min-width: 0; min-height: 0; padding: 4px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.composer-node-contract { display: grid; grid-column: 1 / -1; gap: 16px; min-width: 0; }
.scenario-composer .composer-node-contract .composer-field textarea { min-height: 88px; background: var(--color-surface); }
.composer-node-advanced { grid-column: 1 / -1; min-width: 0; border-top: 1px solid var(--color-border-subtle); }
.composer-node-advanced summary { padding: 12px 0; color: var(--color-text-secondary); font-size: 13px; cursor: pointer; }
.composer-node-advanced summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.composer-node-advanced dl { display: grid; gap: 12px; min-width: 0; margin: 0; }
.composer-node-advanced dl > div { display: grid; gap: 4px; min-width: 0; }
.composer-node-advanced dt { color: var(--color-text-secondary); font-size: 12px; }
.composer-node-advanced dd { min-width: 0; margin: 0; color: var(--color-text); font-family: var(--font-mono); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-selected-summary { min-width: 0; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-subtle); }
.composer-selected-summary p { margin: 4px 0 0; color: var(--color-text-secondary); font-size: 12px; overflow-wrap: anywhere; }
.composer-configuration-body > .composer-help { margin: 0; }
.composer-warning { margin: 0; color: var(--color-danger); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.composer-version-warning { color: var(--color-warning); }
.composer-condition-editor { display: grid; gap: 8px; min-width: 0; }
.composer-condition-example { min-width: 0; padding: 8px; border: 1px dashed var(--color-primary-border); border-radius: var(--radius-md); background: var(--color-primary-subtle); color: var(--color-primary); text-align: left; font: inherit; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; cursor: pointer; }
.composer-edge-detail { display: grid; gap: 8px; min-width: 0; }
.composer-edge-detail > span { color: var(--color-text-secondary); font-size: 12px; }
.composer-edge-detail strong { color: var(--color-text); font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.composer-delete-connection { width: fit-content; max-width: 100%; min-height: var(--control-height-md); padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-danger); font: inherit; font-size: 13px; cursor: pointer; }
/* Keep the library, canvas and inspector available together for drag and configuration. */
@container scenario-composer (max-width: 1199px) {
  .scenario-composer-layout { grid-template-columns: minmax(140px, 0.7fr) minmax(260px, 1.6fr) minmax(180px, 0.85fr); gap: 12px; }
  .composer-library, .composer-configuration { padding: 12px; }
  .composer-canvas-toolbar { flex-wrap: wrap; gap: 8px; padding: 12px; }
  .composer-canvas-tools { flex-wrap: wrap; }
}
@container scenario-composer (max-width: 619px) {
  .scenario-composer-layout { grid-template-columns: 140px minmax(260px, 1fr) 180px; overflow-x: auto; }
}

.composer-field input:focus-visible, .composer-field textarea:focus-visible, .composer-field select:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: var(--focus-ring); }
.composer-tool-button, .composer-text-button { border-radius: var(--radius-md); }
.composer-panel-head h3, .composer-canvas-title h3 { font-size: var(--text-base); font-weight: 600; line-height: 1.4; }
.composer-canvas-title { flex-wrap: wrap; }
.composer-toolbar-state { color: var(--color-text-secondary); font-size: 12px; font-weight: 400; }
.composer-toolbar-state.has-connection { color: var(--color-primary); }
.composer-canvas-footer { align-items: center; padding: 8px 12px; flex-wrap: nowrap; }
.composer-canvas-footer > span { flex: 1; }
.composer-canvas-footer .is-error { color: var(--color-danger); }
.composer-help-button { flex: 0 0 auto; padding: 4px 8px; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--color-text-secondary); font: inherit; font-size: 12px; cursor: help; }
.composer-focus-exit-help { font-size: 12px; line-height: 1.5; color: var(--color-text-secondary); }
.composer-focus-exit-group .composer-tool-button.composer-focus-exit { color: var(--color-surface); background: var(--color-primary); border-color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm); }
.composer-focus-exit-group .composer-tool-button.composer-focus-exit:hover { background: var(--color-primary-hover, var(--color-primary)); }
.composer-node.is-wire-target { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-border); }
.composer-workspace { container: composer-workspace / inline-size; }
.composer-canvas-toolbar.is-focused > .composer-canvas-tools { margin-left: auto; align-items: center; justify-content: flex-end; }
.composer-focus-exit-group { display: flex; align-items: center; gap: 8px; min-width: 0; margin-right: 4px; }
.composer-focus-exit-group > .composer-focus-exit { flex-shrink: 0; }
.composer-configuration .composer-selected-summary { padding: 12px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-surface-subtle); }
.composer-selected-summary > strong { display: block; color: var(--color-text); font-size: 14px; line-height: 1.5; font-weight: 600; }
.composer-version-tag { display: inline-flex; margin-top: 8px; padding: 4px 8px; border-radius: 4px; background: var(--color-surface); color: var(--color-text-secondary); font-size: 12px; }
.composer-config-field-group { display: grid; gap: 8px; min-width: 0; }
.composer-config-field-group .composer-field > span { font-size: 13px; font-weight: 600; color: var(--color-text); }
.composer-config-field-group .composer-field > small { font-size: 12px; line-height: 1.6; color: var(--color-text-tertiary); }
.composer-optional-tag { margin-left: 4px; font-weight: 400; color: var(--color-text-tertiary); }
.composer-field-example { min-width: 0; font-size: 12px; line-height: 1.6; color: var(--color-text-secondary); }
.composer-field-example > summary { cursor: pointer; width: fit-content; color: var(--color-text-secondary); }
.composer-field-example > p { margin: 8px 0 0; padding: 8px 12px; background: var(--color-surface-subtle); border-radius: var(--radius-md); }
.composer-execution-settings { display: grid; gap: 12px; min-width: 0; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--color-border-subtle); }
.composer-execution-settings > h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; color: var(--color-text); }
.composer-execution-settings > .composer-help { margin: 0; font-size: 12px; color: var(--color-text-tertiary); }
</style>

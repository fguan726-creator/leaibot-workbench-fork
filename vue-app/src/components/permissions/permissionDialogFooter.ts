import type { ObjectDirective } from 'vue'

// Permission-domain overlays only. This directive never changes approval or form state.
const disposers = new WeakMap<HTMLElement, () => void>()
const refreshers = new WeakMap<HTMLElement, () => void>()
const panelSelector = '.modal-panel, .picker-dialog'
const footerSelector = '.modal-actions, .picker-actions'

export const vPermissionDialogFooter: ObjectDirective<HTMLElement> = {
  mounted(root) {
    let frame = 0
    let stopped = false
    const observed = new Set<Element>()
    const resize = new ResizeObserver(schedule)
    const mutation = new MutationObserver(schedule)

    function schedule() {
      if (!stopped && !frame) frame = requestAnimationFrame(measure)
    }

    function measure() {
      frame = 0
      const panels = [ ...(root.matches(panelSelector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(panelSelector) ]
      const nextObserved = new Set<Element>()
      for (const panel of panels) {
        const footer = [...panel.querySelectorAll<HTMLElement>(footerSelector)]
          .find(node => node.parentElement === panel)
        if (!footer || !panel.getClientRects().length) continue
        let overflow = false
        let remaining = false
        for (const node of [panel, ...panel.querySelectorAll<HTMLElement>('*')]) {
          if (node === footer || footer.contains(node) || node.closest(panelSelector) !== panel) continue
          if (node.scrollHeight <= node.clientHeight + 1 || !node.clientHeight) continue
          if (!/auto|scroll/.test(getComputedStyle(node).overflowY)) continue
          overflow = true
          remaining ||= node.scrollHeight - node.clientHeight - node.scrollTop > 2
        }
        const state = !overflow ? 'static' : remaining ? 'more' : 'end'
        if (footer.dataset.scrollState !== state) footer.dataset.scrollState = state
        nextObserved.add(panel)
        for (const child of panel.children) nextObserved.add(child)
      }
      for (const node of observed) if (!nextObserved.has(node)) { resize.unobserve(node); observed.delete(node) }
      for (const node of nextObserved) if (!observed.has(node)) { resize.observe(node); observed.add(node) }
    }

    mutation.observe(root, { childList: true, subtree: true, characterData: true })
    root.addEventListener('scroll', schedule, true)
    root.addEventListener('input', schedule, true)
    root.addEventListener('transitionend', schedule, true)
    window.addEventListener('resize', schedule)
    refreshers.set(root, schedule)
    disposers.set(root, () => {
      stopped = true
      cancelAnimationFrame(frame)
      mutation.disconnect()
      resize.disconnect()
      root.removeEventListener('scroll', schedule, true)
      root.removeEventListener('input', schedule, true)
      root.removeEventListener('transitionend', schedule, true)
      window.removeEventListener('resize', schedule)
      disposers.delete(root)
      refreshers.delete(root)
    })
    schedule()
  },
  updated(root) { refreshers.get(root)?.() },
  beforeUnmount(root) { disposers.get(root)?.() }
}

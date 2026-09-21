/**
 * @typedef {{ id: string, kind: string, title: string, detail: string }} ClarificationStep
 * @typedef {'pending' | 'running' | 'done'} ClarificationStepStatus
 * @typedef {ClarificationStep & { status: ClarificationStepStatus }} ClarificationState
 * @typedef {(states: ClarificationState[]) => void} ClarificationStatesCallback
 * @typedef {(text: string) => void} ClarificationTextCallback
 * @typedef {ReturnType<typeof setTimeout> | number} PlaybackTimerHandle
 *
 * @typedef {object} ClarificationPlaybackOptions
 * @property {number} [stepMs]
 * @property {number} [chunkMs]
 * @property {number} [chunkSize]
 * @property {(callback: () => void, delay: number) => PlaybackTimerHandle} [setTimer]
 * @property {(timer: PlaybackTimerHandle) => void} [clearTimer]
 *
 * @typedef {object} ClarificationRunOptions
 * @property {ClarificationStep[]} [steps]
 * @property {string} [text]
 * @property {ClarificationStatesCallback} [onStates]
 * @property {ClarificationTextCallback} [onText]
 * @property {boolean} [reducedMotion]
 *
 * @typedef {object} ClarificationPlayback
 * @property {(options?: ClarificationRunOptions) => Promise<boolean>} run
 * @property {() => void} cancel
 * @property {boolean} isRunning
 */

/**
 * @param {ClarificationPlaybackOptions} [options]
 * @returns {ClarificationPlayback}
 */
export function createClarificationPlayback({
  stepMs = 600,
  chunkMs = 24,
  chunkSize = 8,
  setTimer = setTimeout,
  clearTimer = clearTimeout
} = {}) {
  if (!Number.isFinite(stepMs) || stepMs < 0 || !Number.isFinite(chunkMs) || chunkMs < 0) {
    throw new RangeError('Playback delays must be finite and non-negative')
  }
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError('Playback chunkSize must be a positive integer')
  }

  let active = null
  const isCurrent = job => active === job && !job.cancelled && !job.settled

  function clearJobTimer(job) {
    if (job.timer !== null) clearTimer(job.timer)
    job.timer = null
  }

  function finish(job, value, failed = false) {
    if (job.settled) return
    clearJobTimer(job)
    job.settled = true
    if (active === job) active = null
    if (failed) job.reject(value)
    else job.resolve(value)
  }

  function emit(job, callback, value) {
    if (!isCurrent(job)) return false
    job.inCallback = true
    try {
      callback(value)
    } catch (error) {
      finish(job, error, true)
    } finally {
      job.inCallback = false
      // A callback may cancel and then throw: report the error before settling cancellation.
      if (job.cancelled && !job.settled) finish(job, false)
    }
    return isCurrent(job)
  }

  function cancel() {
    const job = active
    if (!job) return
    active = null
    job.cancelled = true
    clearJobTimer(job)
    if (!job.inCallback) finish(job, false)
  }

  /**
   * @param {ClarificationRunOptions} [options]
   * @returns {Promise<boolean>}
   */
  function run({ steps = [], text = '', onStates = () => {}, onText = () => {}, reducedMotion = false } = {}) {
    if (active) return Promise.resolve(false)
    const job = { timer: null, cancelled: false, settled: false, inCallback: false }
    /** @type {Promise<boolean>} */
    const result = new Promise((resolve, reject) => Object.assign(job, { resolve, reject }))
    active = job

    try {
      /** @type {ClarificationState[]} */
      const states = steps.map(step => ({ ...step, status: 'pending' }))
      const characters = Array.from(String(text))
      const publishStates = () => emit(job, onStates, states.map(step => ({ ...step })))

      function schedule(callback, delay) {
        if (!isCurrent(job)) return
        try {
          job.timer = setTimer(() => {
            if (!isCurrent(job)) return
            job.timer = null
            callback()
          }, delay)
        } catch (error) {
          finish(job, error, true)
        }
      }

      function completeStep(index) {
        states[index].status = 'done'
        if (publishStates()) playStep(index + 1)
      }

      function streamText(done) {
        if (reducedMotion || !characters.length) {
          if (emit(job, onText, characters.join(''))) done()
          return
        }
        if (!emit(job, onText, '')) return
        let cursor = 0
        function nextChunk() {
          cursor = Math.min(cursor + chunkSize, characters.length)
          if (!emit(job, onText, characters.slice(0, cursor).join(''))) return
          if (cursor === characters.length) done()
          else schedule(nextChunk, chunkMs)
        }
        schedule(nextChunk, chunkMs)
      }

      function playStep(index) {
        if (!isCurrent(job)) return
        if (index === states.length) {
          finish(job, true)
          return
        }
        states[index].status = 'running'
        if (!publishStates()) return
        if (index === states.length - 1) streamText(() => completeStep(index))
        else if (reducedMotion) completeStep(index)
        else schedule(() => completeStep(index), stepMs)
      }

      if (publishStates()) {
        if (states.length) playStep(0)
        else streamText(() => finish(job, true))
      }
    } catch (error) {
      finish(job, error, true)
    }
    return result
  }

  return { run, cancel, get isRunning() { return active !== null } }
}

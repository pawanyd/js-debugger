export function createTracer() {
  const steps = []
  const callStack = []
  const scopes = [{ name: 'Global', variables: {}, type: 'global' }]
  const consoleOutput = []
  const webApis = []
  const callbackQueue = []
  const microtaskQueue = []
  const memoryHeap = new Map()
  let heapIdCounter = 1
  let eventLoopPhase = 'executing'

  function snapshot() {
    return {
      callStack: callStack.map(f => ({ ...f })),
      scopes: scopes.map(s => ({ ...s, variables: { ...s.variables } })),
      consoleOutput: [...consoleOutput],
      webApis: webApis.map(w => ({ ...w })),
      callbackQueue: callbackQueue.map(c => ({ ...c })),
      microtaskQueue: microtaskQueue.map(m => ({ ...m })),
      memoryHeap: serializeHeap(),
      eventLoopPhase,
    }
  }

  function serializeHeap() {
    const result = []
    memoryHeap.forEach((val, id) => {
      result.push({ id, ...val })
    })
    return result
  }

  function addStep(line, type, description, extra = {}) {
    steps.push({
      line,
      type,
      description,
      ...snapshot(),
      ...extra,
    })
  }

  function pushCall(name, line) {
    callStack.push({ name, line })
  }

  function popCall() {
    return callStack.pop()
  }

  function enterScope(name, type = 'function') {
    scopes.push({ name, variables: {}, type })
  }

  function exitScope() {
    if (scopes.length > 1) scopes.pop()
  }

  function setVariable(name, value, scopeIndex) {
    const idx = scopeIndex !== undefined ? scopeIndex : scopes.length - 1
    if (idx >= 0 && idx < scopes.length) {
      scopes[idx].variables[name] = formatValue(value)
    }
  }

  function logConsole(...args) {
    const formatted = args.map(a => formatValue(a)).join(' ')
    consoleOutput.push(formatted)
  }

  function addWebApi(id, type, label, delay) {
    webApis.push({ id, type, label, delay, startStep: steps.length })
  }

  function removeWebApi(id) {
    const idx = webApis.findIndex(w => w.id === id)
    if (idx !== -1) webApis.splice(idx, 1)
  }

  function addToCallbackQueue(label, callback) {
    callbackQueue.push({ label, callback })
  }

  function removeFromCallbackQueue() {
    return callbackQueue.shift()
  }

  function addToMicrotaskQueue(label, callback) {
    microtaskQueue.push({ label, callback })
  }

  function removeFromMicrotaskQueue() {
    return microtaskQueue.shift()
  }

  function setEventLoopPhase(phase) {
    eventLoopPhase = phase
  }

  function allocateHeap(value, label) {
    const id = heapIdCounter++
    memoryHeap.set(id, { label, value: formatValue(value), type: typeof value === 'object' && Array.isArray(value) ? 'array' : 'object' })
    return id
  }

  function formatValue(val) {
    if (val === undefined) return 'undefined'
    if (val === null) return 'null'
    if (typeof val === 'string') return `"${val}"`
    if (typeof val === 'function') return `ƒ ${val.name || 'anonymous'}()`
    if (Array.isArray(val)) return `[${val.map(v => formatValue(v)).join(', ')}]`
    if (typeof val === 'object') {
      try {
        const keys = Object.keys(val)
        if (keys.length <= 3) {
          return `{${keys.map(k => `${k}: ${formatValue(val[k])}`).join(', ')}}`
        }
        return `{${keys.slice(0, 3).map(k => `${k}: ${formatValue(val[k])}`).join(', ')}, ...}`
      } catch {
        return String(val)
      }
    }
    return String(val)
  }

  return {
    steps,
    addStep,
    pushCall,
    popCall,
    enterScope,
    exitScope,
    setVariable,
    logConsole,
    addWebApi,
    removeWebApi,
    addToCallbackQueue,
    removeFromCallbackQueue,
    addToMicrotaskQueue,
    removeFromMicrotaskQueue,
    setEventLoopPhase,
    allocateHeap,
    formatValue,
    snapshot,
  }
}

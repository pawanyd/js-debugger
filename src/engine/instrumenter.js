import { parseCode } from './parser.js'
import { createTracer } from './tracer.js'

const MAX_STEPS = 2000

/**
 * Generate an execution trace for the given JavaScript code.
 * Uses an AST-walking interpreter approach for full control over execution tracking.
 *
 * @param {string} code - JavaScript source code to trace
 * @returns {Array} Array of trace step objects
 */
export function generateTrace(code) {
  const tracer = createTracer()
  let stepCount = 0
  let webApiIdCounter = 1

  // Pending async work
  const pendingTimers = []    // { id, label, delay, callbackNode, closureEnv }
  const pendingMicrotasks = [] // { label, callbackNode, closureEnv }

  function checkStepLimit() {
    if (stepCount >= MAX_STEPS) {
      throw new StepLimitError(`Execution limit reached (${MAX_STEPS} steps). Possible infinite loop or code too complex.`)
    }
    stepCount++
  }

  // ─── Environment (scope chain) ────────────────────────────────────

  function createEnv(parent = null, name = 'Global', type = 'global') {
    return {
      name,
      type,
      vars: Object.create(null), // name → { value, kind }
      parent,
    }
  }

  function envDefine(env, name, value, kind = 'let') {
    env.vars[name] = { value, kind }
  }

  function envSet(env, name, value) {
    let current = env
    while (current) {
      if (name in current.vars) {
        current.vars[name] = { ...current.vars[name], value }
        return
      }
      current = current.parent
    }
    // If not found, define in global (like var in sloppy mode)
    env.vars[name] = { value, kind: 'var' }
  }

  function envGet(env, name) {
    let current = env
    while (current) {
      if (name in current.vars) {
        return current.vars[name].value
      }
      current = current.parent
    }
    // Check for built-in globals
    if (name === 'undefined') return undefined
    if (name === 'null') return null
    if (name === 'true') return true
    if (name === 'false') return false
    if (name === 'NaN') return NaN
    if (name === 'Infinity') return Infinity
    if (name === 'Math') return Math
    if (name === 'parseInt') return parseInt
    if (name === 'parseFloat') return parseFloat
    if (name === 'isNaN') return isNaN
    if (name === 'isFinite') return isFinite
    if (name === 'String') return String
    if (name === 'Number') return Number
    if (name === 'Boolean') return Boolean
    if (name === 'Array') return Array
    if (name === 'Object') return Object
    if (name === 'JSON') return JSON
    throw new Error(`${name} is not defined`)
  }

  function envHas(env, name) {
    let current = env
    while (current) {
      if (name in current.vars) return true
      current = current.parent
    }
    return false
  }

  // Sync tracer scopes with our environment chain
  function syncScopes(env) {
    // Rebuild tracer scopes from env chain
    const chain = []
    let current = env
    while (current) {
      chain.unshift(current)
      current = current.parent
    }
    // Update tracer — clear and re-set all scopes
    // We use the tracer's internal API to maintain consistency
    // First, reset scopes by exiting all non-global
    while (tracer.snapshot().scopes.length > 1) {
      tracer.exitScope()
    }
    // Set global scope variables
    if (chain.length > 0) {
      const globalEnv = chain[0]
      for (const key of Object.keys(globalEnv.vars)) {
        tracer.setVariable(key, globalEnv.vars[key].value, 0)
      }
    }
    // Enter additional scopes
    for (let i = 1; i < chain.length; i++) {
      tracer.enterScope(chain[i].name, chain[i].type)
      for (const key of Object.keys(chain[i].vars)) {
        tracer.setVariable(key, chain[i].vars[key].value, i)
      }
    }
  }

  // ─── Interpreter helpers ──────────────────────────────────────────

  /** Represent a traced function value (user-defined) */
  class TracedFunction {
    constructor(name, params, body, closureEnv) {
      this.name = name || 'anonymous'
      this.params = params       // AST param nodes
      this.body = body           // AST body node (BlockStatement)
      this.closureEnv = closureEnv
      // Make it look like a function to formatValue
      this._isTracedFunction = true
    }
  }

  // Make TracedFunction toString work
  TracedFunction.prototype.toString = function () {
    return `function ${this.name}() { [user code] }`
  }

  /** Special sentinel for return values */
  class ReturnSignal {
    constructor(value) {
      this.value = value
    }
  }

  /** Special sentinel for break */
  class BreakSignal {}

  /** Special sentinel for continue */
  class ContinueSignal {}

  class StepLimitError extends Error {
    constructor(msg) {
      super(msg)
      this.name = 'StepLimitError'
    }
  }

  // Format a value for display in step descriptions
  function fmt(val) {
    if (val instanceof TracedFunction) return `ƒ ${val.name}()`
    return tracer.formatValue(val)
  }

  // ─── AST Node Evaluators ──────────────────────────────────────────

  function execProgram(node, env) {
    // First pass: hoist function declarations and var declarations
    hoistDeclarations(node.body, env)
    syncScopes(env)

    tracer.pushCall('main()', 1)
    tracer.addStep(1, 'start', 'Program execution started')

    let result
    for (const stmt of node.body) {
      result = execStatement(stmt, env)
      if (result instanceof ReturnSignal) break
    }

    tracer.popCall()
    syncScopes(env)
    tracer.addStep(null, 'end', 'Program execution completed')

    return result
  }

  function hoistDeclarations(body, env) {
    for (const node of body) {
      if (node.type === 'FunctionDeclaration' && node.id) {
        const fn = new TracedFunction(
          node.id.name,
          node.params,
          node.body,
          env
        )
        envDefine(env, node.id.name, fn, 'function')
      }
      if (node.type === 'VariableDeclaration' && node.kind === 'var') {
        for (const decl of node.declarations) {
          if (decl.id && decl.id.type === 'Identifier') {
            // Check if variable already exists in THIS scope (not parent scopes)
            if (!(decl.id.name in env.vars)) {
              envDefine(env, decl.id.name, undefined, 'var')
            }
          }
        }
      }
    }
  }

  function execStatement(node, env) {
    if (!node) return undefined
    checkStepLimit()

    switch (node.type) {
      case 'VariableDeclaration':
        return execVariableDeclaration(node, env)
      case 'ExpressionStatement':
        return execExpressionStatement(node, env)
      case 'FunctionDeclaration':
        return execFunctionDeclaration(node, env)
      case 'ReturnStatement':
        return execReturnStatement(node, env)
      case 'IfStatement':
        return execIfStatement(node, env)
      case 'ForStatement':
        return execForStatement(node, env)
      case 'WhileStatement':
        return execWhileStatement(node, env)
      case 'DoWhileStatement':
        return execDoWhileStatement(node, env)
      case 'BlockStatement':
        return execBlockStatement(node, env)
      case 'SwitchStatement':
        return execSwitchStatement(node, env)
      case 'BreakStatement':
        return new BreakSignal()
      case 'ContinueStatement':
        return new ContinueSignal()
      case 'ForOfStatement':
      case 'ForInStatement':
        return execForOfInStatement(node, env)
      case 'ThrowStatement':
        return execThrowStatement(node, env)
      case 'TryStatement':
        return execTryStatement(node, env)
      case 'EmptyStatement':
        return undefined
      default:
        // Try to evaluate as expression
        return evalExpression(node, env)
    }
  }

  function execVariableDeclaration(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const kind = node.kind // let, const, var

    for (const decl of node.declarations) {
      const name = decl.id.type === 'Identifier' ? decl.id.name : '?'
      const value = decl.init ? evalExpression(decl.init, env) : undefined

      if (kind === 'var') {
        // var was already hoisted, just assign
        envSet(env, name, value)
      } else {
        envDefine(env, name, value, kind)
      }

      // Allocate heap for objects/arrays
      if (value !== null && typeof value === 'object' && !(value instanceof TracedFunction)) {
        tracer.allocateHeap(value, name)
      }

      syncScopes(env)
      tracer.addStep(line, 'variable', `Declared ${kind} ${name} = ${fmt(value)}`)
    }
    return undefined
  }

  function execExpressionStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const value = evalExpression(node.expression, env)
    return value
  }

  function execFunctionDeclaration(node, env) {
    // Already hoisted, but record the step
    const line = node.loc ? node.loc.start.line : null
    const name = node.id ? node.id.name : 'anonymous'
    syncScopes(env)
    tracer.addStep(line, 'function', `Function ${name} declared (hoisted)`)
    return undefined
  }

  function execReturnStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const value = node.argument ? evalExpression(node.argument, env) : undefined
    syncScopes(env)
    tracer.addStep(line, 'return', `Return ${fmt(value)}`)
    return new ReturnSignal(value)
  }

  function execIfStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const test = evalExpression(node.test, env)

    syncScopes(env)
    tracer.addStep(line, 'conditional', `if (${fmt(test)}) → ${test ? 'true' : 'false'}`)

    if (test) {
      const result = execStatement(node.consequent, env)
      if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) return result
    } else if (node.alternate) {
      const altLine = node.alternate.loc ? node.alternate.loc.start.line : line
      tracer.addStep(altLine, 'conditional', 'Entering else branch')
      const result = execStatement(node.alternate, env)
      if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) return result
    }
    return undefined
  }

  function execForStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const loopEnv = createEnv(env, 'for-block', 'block')

    // Init
    if (node.init) {
      if (node.init.type === 'VariableDeclaration') {
        execVariableDeclaration(node.init, loopEnv)
      } else {
        evalExpression(node.init, loopEnv)
      }
    }

    syncScopes(loopEnv)
    tracer.addStep(line, 'loop', 'for loop started')

    while (true) {
      checkStepLimit()

      // Test
      if (node.test) {
        const test = evalExpression(node.test, loopEnv)
        syncScopes(loopEnv)
        tracer.addStep(line, 'loop', `for condition: ${fmt(test)} → ${test ? 'true' : 'false'}`)
        if (!test) break
      }

      // Body
      const result = execStatement(node.body, loopEnv)
      if (result instanceof ReturnSignal) return result
      if (result instanceof BreakSignal) break
      // ContinueSignal — just continue

      // Update
      if (node.update) {
        evalExpression(node.update, loopEnv)
        syncScopes(loopEnv)
      }
    }

    // Restore scopes
    syncScopes(env)
    return undefined
  }

  function execWhileStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null

    syncScopes(env)
    tracer.addStep(line, 'loop', 'while loop started')

    while (true) {
      checkStepLimit()
      const test = evalExpression(node.test, env)
      syncScopes(env)
      tracer.addStep(line, 'loop', `while condition: ${fmt(test)} → ${test ? 'true' : 'false'}`)
      if (!test) break

      const result = execStatement(node.body, env)
      if (result instanceof ReturnSignal) return result
      if (result instanceof BreakSignal) break
    }
    return undefined
  }

  function execDoWhileStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null

    syncScopes(env)
    tracer.addStep(line, 'loop', 'do-while loop started')

    while (true) {
      checkStepLimit()
      const result = execStatement(node.body, env)
      if (result instanceof ReturnSignal) return result
      if (result instanceof BreakSignal) break

      const test = evalExpression(node.test, env)
      syncScopes(env)
      tracer.addStep(line, 'loop', `do-while condition: ${fmt(test)} → ${test ? 'true' : 'false'}`)
      if (!test) break
    }
    return undefined
  }

  function execBlockStatement(node, env) {
    const blockEnv = createEnv(env, 'block', 'block')
    hoistDeclarations(node.body, blockEnv)

    for (const stmt of node.body) {
      const result = execStatement(stmt, blockEnv)
      if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) {
        syncScopes(env)
        return result
      }
    }
    syncScopes(env)
    return undefined
  }

  function execSwitchStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const disc = evalExpression(node.discriminant, env)

    syncScopes(env)
    tracer.addStep(line, 'conditional', `switch (${fmt(disc)})`)

    let matched = false
    for (const c of node.cases) {
      if (!matched && c.test) {
        const testVal = evalExpression(c.test, env)
        if (disc !== testVal) continue
      }
      if (c.test || matched) matched = true
      if (!c.test) matched = true // default

      for (const stmt of c.consequent) {
        const result = execStatement(stmt, env)
        if (result instanceof BreakSignal) return undefined
        if (result instanceof ReturnSignal) return result
      }
    }
    return undefined
  }

  function execForOfInStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const isOf = node.type === 'ForOfStatement'
    const right = evalExpression(node.right, env)
    const iterable = isOf ? right : Object.keys(right)

    syncScopes(env)
    tracer.addStep(line, 'loop', `for-${isOf ? 'of' : 'in'} loop started`)

    for (const item of iterable) {
      checkStepLimit()
      const loopEnv = createEnv(env, 'for-block', 'block')
      const varName = node.left.type === 'VariableDeclaration'
        ? node.left.declarations[0].id.name
        : node.left.name

      envDefine(loopEnv, varName, item, node.left.kind || 'let')
      syncScopes(loopEnv)
      tracer.addStep(line, 'loop', `${varName} = ${fmt(item)}`)

      const result = execStatement(node.body, loopEnv)
      if (result instanceof ReturnSignal) return result
      if (result instanceof BreakSignal) break
    }
    syncScopes(env)
    return undefined
  }

  function execThrowStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const value = evalExpression(node.argument, env)
    syncScopes(env)
    tracer.addStep(line, 'error', `throw ${fmt(value)}`)
    throw value
  }

  function execTryStatement(node, env) {
    const line = node.loc ? node.loc.start.line : null
    syncScopes(env)
    tracer.addStep(line, 'trycatch', 'Entering try block')

    try {
      const result = execStatement(node.block, env)
      if (result instanceof ReturnSignal) return result
    } catch (err) {
      if (node.handler) {
        const catchEnv = createEnv(env, 'catch', 'block')
        if (node.handler.param) {
          const paramName = node.handler.param.name
          envDefine(catchEnv, paramName, err, 'let')
        }
        const catchLine = node.handler.loc ? node.handler.loc.start.line : line
        syncScopes(catchEnv)
        tracer.addStep(catchLine, 'trycatch', `Caught error: ${fmt(err)}`)
        const result = execStatement(node.handler.body, catchEnv)
        syncScopes(env)
        if (result instanceof ReturnSignal) return result
      } else {
        throw err
      }
    } finally {
      if (node.finalizer) {
        syncScopes(env)
        tracer.addStep(line, 'trycatch', 'Entering finally block')
        const result = execStatement(node.finalizer, env)
        if (result instanceof ReturnSignal) return result
      }
    }
    return undefined
  }

  // ─── Expression Evaluator ─────────────────────────────────────────

  function evalExpression(node, env) {
    if (!node) return undefined

    switch (node.type) {
      case 'Literal':
        return node.value

      case 'Identifier':
        return envGet(env, node.name)

      case 'TemplateLiteral':
        return evalTemplateLiteral(node, env)

      case 'TaggedTemplateExpression':
        return evalExpression(node.quasi, env)

      case 'BinaryExpression':
        return evalBinaryExpression(node, env)

      case 'LogicalExpression':
        return evalLogicalExpression(node, env)

      case 'UnaryExpression':
        return evalUnaryExpression(node, env)

      case 'UpdateExpression':
        return evalUpdateExpression(node, env)

      case 'AssignmentExpression':
        return evalAssignmentExpression(node, env)

      case 'CallExpression':
        return evalCallExpression(node, env)

      case 'MemberExpression':
        return evalMemberExpression(node, env)

      case 'ArrayExpression':
        return node.elements.map(el => el ? evalExpression(el, env) : undefined)

      case 'ObjectExpression':
        return evalObjectExpression(node, env)

      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return evalFunctionExpression(node, env)

      case 'ConditionalExpression':
        return evalExpression(node.test, env)
          ? evalExpression(node.consequent, env)
          : evalExpression(node.alternate, env)

      case 'SequenceExpression': {
        let val
        for (const expr of node.expressions) {
          val = evalExpression(expr, env)
        }
        return val
      }

      case 'SpreadElement':
        return evalExpression(node.argument, env)

      case 'NewExpression':
        return evalNewExpression(node, env)

      case 'ThisExpression':
        return envHas(env, 'this') ? envGet(env, 'this') : undefined

      default:
        return undefined
    }
  }

  function evalTemplateLiteral(node, env) {
    let result = ''
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked
      if (i < node.expressions.length) {
        result += String(evalExpression(node.expressions[i], env))
      }
    }
    return result
  }

  function evalBinaryExpression(node, env) {
    const left = evalExpression(node.left, env)
    const right = evalExpression(node.right, env)

    switch (node.operator) {
      case '+': return left + right
      case '-': return left - right
      case '*': return left * right
      case '/': return left / right
      case '%': return left % right
      case '**': return left ** right
      case '==': return left == right
      case '!=': return left != right
      case '===': return left === right
      case '!==': return left !== right
      case '<': return left < right
      case '>': return left > right
      case '<=': return left <= right
      case '>=': return left >= right
      case '&': return left & right
      case '|': return left | right
      case '^': return left ^ right
      case '<<': return left << right
      case '>>': return left >> right
      case '>>>': return left >>> right
      case 'instanceof': return left instanceof right
      case 'in': return left in right
      default: return undefined
    }
  }

  function evalLogicalExpression(node, env) {
    const left = evalExpression(node.left, env)
    switch (node.operator) {
      case '&&': return left ? evalExpression(node.right, env) : left
      case '||': return left ? left : evalExpression(node.right, env)
      case '??': return left != null ? left : evalExpression(node.right, env)
      default: return undefined
    }
  }

  function evalUnaryExpression(node, env) {
    if (node.operator === 'typeof') {
      try {
        const val = evalExpression(node.argument, env)
        return typeof val
      } catch {
        return 'undefined'
      }
    }

    if (node.operator === 'delete') {
      const line = node.loc ? node.loc.start.line : null
      
      // delete obj.prop or delete obj[prop]
      if (node.argument.type === 'MemberExpression') {
        const obj = evalExpression(node.argument.object, env)
        const prop = node.argument.computed
          ? evalExpression(node.argument.property, env)
          : node.argument.property.name
        
        const result = delete obj[prop]
        syncScopes(env)
        tracer.addStep(line, 'assignment', `delete ${fmt(obj)}.${prop} → ${result}`)
        return result
      }
      
      // delete identifier (always returns true in non-strict mode)
      return true
    }

    const arg = evalExpression(node.argument, env)
    switch (node.operator) {
      case '-': return -arg
      case '+': return +arg
      case '!': return !arg
      case '~': return ~arg
      case 'void': return undefined
      default: return undefined
    }
  }

  function evalUpdateExpression(node, env) {
    const name = node.argument.name
    const oldVal = envGet(env, name)
    const newVal = node.operator === '++' ? oldVal + 1 : oldVal - 1

    envSet(env, name, newVal)
    const line = node.loc ? node.loc.start.line : null
    syncScopes(env)
    tracer.addStep(line, 'variable', `Updated ${name}: ${fmt(oldVal)} → ${fmt(newVal)}`)

    return node.prefix ? newVal : oldVal
  }

  function evalAssignmentExpression(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const right = evalExpression(node.right, env)

    // Handle member expression assignment: obj.prop = val / arr[i] = val
    if (node.left.type === 'MemberExpression') {
      const obj = evalExpression(node.left.object, env)
      const prop = node.left.computed
        ? evalExpression(node.left.property, env)
        : node.left.property.name

      const oldVal = obj[prop]
      let newVal = right

      switch (node.operator) {
        case '=': newVal = right; break
        case '+=': newVal = oldVal + right; break
        case '-=': newVal = oldVal - right; break
        case '*=': newVal = oldVal * right; break
        case '/=': newVal = oldVal / right; break
        case '%=': newVal = oldVal % right; break
        default: newVal = right
      }

      obj[prop] = newVal
      syncScopes(env)
      tracer.addStep(line, 'assignment', `Set property ${prop} = ${fmt(newVal)}`)
      return newVal
    }

    // Simple identifier assignment
    if (node.left.type === 'Identifier') {
      const name = node.left.name
      let newVal = right

      if (node.operator !== '=') {
        const oldVal = envGet(env, name)
        switch (node.operator) {
          case '+=': newVal = oldVal + right; break
          case '-=': newVal = oldVal - right; break
          case '*=': newVal = oldVal * right; break
          case '/=': newVal = oldVal / right; break
          case '%=': newVal = oldVal % right; break
          case '**=': newVal = oldVal ** right; break
          case '&&=': newVal = oldVal && right; break
          case '||=': newVal = oldVal || right; break
          case '??=': newVal = oldVal ?? right; break
          default: break
        }
      }

      envSet(env, name, newVal)
      syncScopes(env)
      tracer.addStep(line, 'assignment', `${name} = ${fmt(newVal)}`)
      return newVal
    }

    // Destructuring assignment - basic support
    return right
  }

  function evalCallExpression(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const args = node.arguments.map(a => evalExpression(a, env))

    // ── console.log / console.warn / console.error ──
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'console'
    ) {
      const method = node.callee.property.name || node.callee.property.value
      tracer.logConsole(...args)
      syncScopes(env)
      tracer.addStep(line, 'console', `console.${method}(${args.map(a => fmt(a)).join(', ')})`)
      return undefined
    }

    // ── setTimeout ──
    if (
      node.callee.type === 'Identifier' &&
      node.callee.name === 'setTimeout'
    ) {
      return handleSetTimeout(node, args, env, line)
    }

    // ── setInterval ──
    if (
      node.callee.type === 'Identifier' &&
      node.callee.name === 'setInterval'
    ) {
      // Treat as single setTimeout for visualization
      return handleSetTimeout(node, args, env, line)
    }

    // ── Promise.resolve().then() or new Promise() patterns are handled in member call ──

    // ── .then() on a promise-like ──
    if (
      node.callee.type === 'MemberExpression' &&
      (node.callee.property.name === 'then' || node.callee.property.value === 'then')
    ) {
      return handlePromiseThen(node, args, env, line)
    }

    // ── .catch() on a promise-like ──
    if (
      node.callee.type === 'MemberExpression' &&
      (node.callee.property.name === 'catch' || node.callee.property.value === 'catch')
    ) {
      // Evaluate the object (the promise), return it for chaining
      const obj = evalExpression(node.callee.object, env)
      return obj // simplified: just pass through the promise
    }

    // ── Regular method calls: obj.method(args) ──
    if (node.callee.type === 'MemberExpression') {
      return evalMethodCall(node, args, env, line)
    }

    // ── Regular function calls ──
    const callee = evalExpression(node.callee, env)
    const calleeName = node.callee.type === 'Identifier'
      ? node.callee.name
      : (callee && callee.name) || 'anonymous'

    return invokeFunction(callee, calleeName, args, env, line)
  }

  function handleSetTimeout(node, args, env, line) {
    const callback = args[0]
    const delay = args[1] || 0
    const id = webApiIdCounter++
    const label = `setTimeout(${delay}ms)`

    tracer.addWebApi(id, 'timer', label, delay)
    syncScopes(env)
    tracer.addStep(line, 'webapi', `${label} — added to Web APIs`)

    // Store the callback AST node for later execution
    // If callback is a TracedFunction, we have the AST
    if (callback instanceof TracedFunction) {
      pendingTimers.push({
        id,
        label,
        delay,
        tracedFn: callback,
        closureEnv: callback.closureEnv,
      })
    } else {
      // For arrow functions passed inline, we need the AST node
      // The callback was already evaluated to a TracedFunction above
      pendingTimers.push({
        id,
        label,
        delay,
        tracedFn: callback,
        closureEnv: env,
      })
    }

    return id
  }

  function handlePromiseThen(node, args, env, line) {
    // Evaluate the promise/object the .then() is called on
    const promiseObj = evalExpression(node.callee.object, env)
    const callback = args[0]
    const label = '.then() callback'

    if (callback instanceof TracedFunction) {
      pendingMicrotasks.push({
        label,
        tracedFn: callback,
        closureEnv: callback.closureEnv,
        resolvedValue: promiseObj && promiseObj.__resolvedValue,
      })
    }

    tracer.addToMicrotaskQueue(label, null)
    syncScopes(env)
    tracer.addStep(line, 'microtask', `Promise.then() — callback added to Microtask Queue`)

    // Return the promise for chaining
    return { __isPromise: true, __resolvedValue: promiseObj && promiseObj.__resolvedValue }
  }

  function evalMethodCall(node, args, env, line) {
    const obj = evalExpression(node.callee.object, env)
    const prop = node.callee.computed
      ? evalExpression(node.callee.property, env)
      : node.callee.property.name

    // Promise.resolve()
    if (obj && obj.__isPromiseConstructor && prop === 'resolve') {
      syncScopes(env)
      tracer.addStep(line, 'promise', `Promise.resolve(${args.map(a => fmt(a)).join(', ')})`)
      return { __isPromise: true, __resolvedValue: args[0] }
    }

    // Promise.reject()
    if (obj && obj.__isPromiseConstructor && prop === 'reject') {
      syncScopes(env)
      tracer.addStep(line, 'promise', `Promise.reject(${args.map(a => fmt(a)).join(', ')})`)
      return { __isPromise: true, __rejectedValue: args[0] }
    }

    // Function.call(thisArg, ...args)
    if ((typeof obj === 'function' || obj instanceof TracedFunction) && prop === 'call') {
      const thisArg = args[0]
      const fnArgs = args.slice(1)
      
      if (obj instanceof TracedFunction) {
        syncScopes(env)
        tracer.addStep(line, 'call', `${obj.name}.call(${fmt(thisArg)}, ${fnArgs.map(a => fmt(a)).join(', ')})`)
        
        // Create function scope with custom 'this'
        const fnEnv = createEnv(obj.closureEnv, obj.name, 'function')
        envDefine(fnEnv, 'this', thisArg, 'const')
        
        // Bind parameters
        for (let i = 0; i < obj.params.length; i++) {
          const param = obj.params[i]
          const paramName = param.type === 'Identifier' ? param.name : `arg${i}`
          envDefine(fnEnv, paramName, fnArgs[i], 'let')
        }
        
        // Hoist declarations
        if (obj.body.type === 'BlockStatement') {
          hoistDeclarations(obj.body.body, fnEnv)
        }
        
        tracer.pushCall(`${obj.name}()`, line)
        tracer.enterScope(obj.name, 'function')
        syncScopes(fnEnv)
        
        // Execute function body
        let result
        if (obj.body.type === 'BlockStatement') {
          for (const stmt of obj.body.body) {
            result = execStatement(stmt, fnEnv)
            if (result instanceof ReturnSignal) {
              result = result.value
              break
            }
          }
        } else {
          result = evalExpression(obj.body, fnEnv)
        }
        
        if (result instanceof ReturnSignal) {
          result = result.value
        }
        
        tracer.exitScope()
        tracer.popCall()
        syncScopes(env)
        tracer.addStep(line, 'return', `${obj.name}.call() returned ${fmt(result)}`)
        
        return result
      } else if (typeof obj === 'function') {
        // Native function
        syncScopes(env)
        const result = obj.call(thisArg, ...fnArgs)
        tracer.addStep(line, 'call', `function.call(${fmt(thisArg)}, ${fnArgs.map(a => fmt(a)).join(', ')}) → ${fmt(result)}`)
        return result
      }
    }

    // Function.apply(thisArg, argsArray)
    if ((typeof obj === 'function' || obj instanceof TracedFunction) && prop === 'apply') {
      const thisArg = args[0]
      const argsArray = args[1] || []
      const fnArgs = Array.isArray(argsArray) ? argsArray : []
      
      if (obj instanceof TracedFunction) {
        syncScopes(env)
        tracer.addStep(line, 'call', `${obj.name}.apply(${fmt(thisArg)}, ${fmt(argsArray)})`)
        
        // Create function scope with custom 'this'
        const fnEnv = createEnv(obj.closureEnv, obj.name, 'function')
        envDefine(fnEnv, 'this', thisArg, 'const')
        
        // Bind parameters
        for (let i = 0; i < obj.params.length; i++) {
          const param = obj.params[i]
          const paramName = param.type === 'Identifier' ? param.name : `arg${i}`
          envDefine(fnEnv, paramName, fnArgs[i], 'let')
        }
        
        // Hoist declarations
        if (obj.body.type === 'BlockStatement') {
          hoistDeclarations(obj.body.body, fnEnv)
        }
        
        tracer.pushCall(`${obj.name}()`, line)
        tracer.enterScope(obj.name, 'function')
        syncScopes(fnEnv)
        
        // Execute function body
        let result
        if (obj.body.type === 'BlockStatement') {
          for (const stmt of obj.body.body) {
            result = execStatement(stmt, fnEnv)
            if (result instanceof ReturnSignal) {
              result = result.value
              break
            }
          }
        } else {
          result = evalExpression(obj.body, fnEnv)
        }
        
        if (result instanceof ReturnSignal) {
          result = result.value
        }
        
        tracer.exitScope()
        tracer.popCall()
        syncScopes(env)
        tracer.addStep(line, 'return', `${obj.name}.apply() returned ${fmt(result)}`)
        
        return result
      } else if (typeof obj === 'function') {
        // Native function
        syncScopes(env)
        const result = obj.apply(thisArg, fnArgs)
        tracer.addStep(line, 'call', `function.apply(${fmt(thisArg)}, ${fmt(argsArray)}) → ${fmt(result)}`)
        return result
      }
    }

    // Array/Object native methods
    if (typeof obj === 'object' && obj !== null && typeof obj[prop] === 'function') {
      const result = obj[prop](...args)
      syncScopes(env)
      return result
    }

    // String methods
    if (typeof obj === 'string' && typeof String.prototype[prop] === 'function') {
      return String.prototype[prop].apply(obj, args)
    }

    // Number methods
    if (typeof obj === 'number' && typeof Number.prototype[prop] === 'function') {
      return Number.prototype[prop].apply(obj, args)
    }

    // Method is a TracedFunction on the object
    if (obj && obj[prop] instanceof TracedFunction) {
      return invokeFunction(obj[prop], prop, args, env, line, obj)
    }

    // Native function
    if (typeof obj[prop] === 'function') {
      return obj[prop](...args)
    }

    throw new Error(`${prop} is not a function`)
  }

  function getPromiseStub() {
    return { __isPromiseConstructor: true }
  }

  function evalNewExpression(node, env) {
    const line = node.loc ? node.loc.start.line : null
    const args = node.arguments.map(a => evalExpression(a, env))

    // new Promise(executor)
    if (node.callee.type === 'Identifier' && node.callee.name === 'Promise') {
      return handleNewPromise(node, args, env, line)
    }

    // new Array(), new Object(), etc - native constructors
    const Ctor = evalExpression(node.callee, env)
    if (typeof Ctor === 'function' && !(Ctor instanceof TracedFunction)) {
      const result = new Ctor(...args)
      syncScopes(env)
      tracer.addStep(line, 'call', `new ${node.callee.name || 'Constructor'}(${args.map(a => fmt(a)).join(', ')})`)
      return result
    }

    // TracedFunction as constructor
    if (Ctor instanceof TracedFunction) {
      const obj = {}
      const ctorEnv = createEnv(Ctor.closureEnv, Ctor.name, 'function')
      envDefine(ctorEnv, 'this', obj, 'const')
      
      // Bind parameters
      for (let i = 0; i < Ctor.params.length; i++) {
        const param = Ctor.params[i]
        const paramName = param.type === 'Identifier' ? param.name : `arg${i}`
        envDefine(ctorEnv, paramName, args[i], 'let')
      }
      
      // Hoist declarations
      if (Ctor.body.type === 'BlockStatement') {
        hoistDeclarations(Ctor.body.body, ctorEnv)
      }
      
      tracer.pushCall(`new ${Ctor.name}()`, line)
      tracer.enterScope(Ctor.name, 'function')
      syncScopes(ctorEnv)
      tracer.addStep(line, 'call', `new ${Ctor.name}(${args.map(a => fmt(a)).join(', ')})`)
      
      // Execute constructor body
      let result
      if (Ctor.body.type === 'BlockStatement') {
        for (const stmt of Ctor.body.body) {
          result = execStatement(stmt, ctorEnv)
          if (result instanceof ReturnSignal) {
            result = result.value
            break
          }
        }
      } else {
        result = evalExpression(Ctor.body, ctorEnv)
      }
      
      tracer.exitScope()
      tracer.popCall()
      syncScopes(env)
      
      // If constructor explicitly returns an object, use that; otherwise use 'this'
      if (result && typeof result === 'object' && result !== null) {
        tracer.addStep(line, 'return', `Constructor returned ${fmt(result)}`)
        return result
      } else {
        tracer.addStep(line, 'return', `Constructor returned this: ${fmt(obj)}`)
        return obj
      }
    }

    return {}
  }

  function handleNewPromise(node, args, env, line) {
    const executor = args[0] // should be TracedFunction
    const promiseObj = { __isPromise: true, __resolvedValue: undefined }

    syncScopes(env)
    tracer.addStep(line, 'promise', 'new Promise() — executor runs synchronously')

    if (executor instanceof TracedFunction) {
      // Create resolve/reject functions as native functions
      const resolveFn = function resolve(val) {
        promiseObj.__resolvedValue = val
      }
      const rejectFn = function reject(reason) {
        promiseObj.__rejectedValue = reason
      }

      // Call the executor with resolve and reject
      tracer.pushCall('Promise(executor)', line)
      invokeFunction(executor, 'Promise-executor', [resolveFn, rejectFn], env, line)
      tracer.popCall()
      syncScopes(env)
    }

    return promiseObj
  }

  function execBlockOrStatement(node, env) {
    if (node.type === 'BlockStatement') {
      hoistDeclarations(node.body, env)
      for (const stmt of node.body) {
        const result = execStatement(stmt, env)
        if (result instanceof ReturnSignal) return result
      }
    } else {
      return execStatement(node, env)
    }
    return undefined
  }

  function invokeFunction(callee, calleeName, args, env, line, thisArg = null) {
    // Native JS functions
    if (typeof callee === 'function') {
      try {
        const result = callee(...args)
        syncScopes(env)
        tracer.addStep(line, 'call', `${calleeName}(${args.map(a => fmt(a)).join(', ')}) → ${fmt(result)}`)
        return result
      } catch (err) {
        throw new Error(`Error calling ${calleeName}: ${err.message}`)
      }
    }

    // User-defined traced function
    if (callee instanceof TracedFunction) {
      tracer.pushCall(`${callee.name}()`, line)
      syncScopes(env)
      tracer.addStep(line, 'call', `Calling ${callee.name}(${args.map(a => fmt(a)).join(', ')})`)

      // Create function scope
      const fnEnv = createEnv(callee.closureEnv, callee.name, 'function')

      // Set 'this' - if thisArg is null/undefined, use global object (non-strict mode)
      // Find the global environment (the one with no parent)
      let globalEnv = env
      while (globalEnv.parent) {
        globalEnv = globalEnv.parent
      }
      
      // Create a global object that references global variables
      const globalThis = thisArg !== null && thisArg !== undefined ? thisArg : createGlobalThisProxy(globalEnv)
      envDefine(fnEnv, 'this', globalThis, 'const')

      // Bind parameters
      for (let i = 0; i < callee.params.length; i++) {
        const param = callee.params[i]
        let paramName = 'arg' + i
        let paramVal = args[i]

        if (param.type === 'Identifier') {
          paramName = param.name
        } else if (param.type === 'AssignmentPattern') {
          // Default parameter
          paramName = param.left.name
          if (paramVal === undefined) {
            paramVal = evalExpression(param.right, fnEnv)
          }
        } else if (param.type === 'RestElement') {
          paramName = param.argument.name
          paramVal = args.slice(i)
        }

        envDefine(fnEnv, paramName, paramVal, 'let')
      }

      // Hoist declarations inside function body
      if (callee.body.type === 'BlockStatement') {
        hoistDeclarations(callee.body.body, fnEnv)
      }

      tracer.enterScope(callee.name, 'function')
      syncScopes(fnEnv)

      // Execute function body
      let result
      if (callee.body.type === 'BlockStatement') {
        for (const stmt of callee.body.body) {
          result = execStatement(stmt, fnEnv)
          if (result instanceof ReturnSignal) {
            result = result.value
            break
          }
        }
      } else {
        // Arrow function with expression body
        result = evalExpression(callee.body, fnEnv)
        syncScopes(fnEnv)
        tracer.addStep(line, 'return', `Return ${fmt(result)}`)
      }

      if (result instanceof ReturnSignal) {
        result = result.value
      }

      tracer.exitScope()
      tracer.popCall()
      syncScopes(env)
      tracer.addStep(line, 'return', `${callee.name}() returned ${fmt(result)}`)

      return result
    }

    if (callee === undefined || callee === null) {
      throw new Error(`${calleeName} is not a function`)
    }

    // Fallback: try to call it
    if (typeof callee === 'object' && callee.__isPromiseConstructor) {
      return { __isPromise: true }
    }

    throw new Error(`${calleeName} is not a function`)
  }

  // Create a proxy object that accesses global environment variables
  function createGlobalThisProxy(globalEnv) {
    const proxy = {}
    // Copy all global variables to the proxy object
    for (const key in globalEnv.vars) {
      Object.defineProperty(proxy, key, {
        get() {
          return globalEnv.vars[key].value
        },
        set(val) {
          globalEnv.vars[key] = { ...globalEnv.vars[key], value: val }
        },
        enumerable: true,
        configurable: true
      })
    }
    return proxy
  }

  function evalFunctionExpression(node, env) {
    const name = node.id ? node.id.name : 'anonymous'
    return new TracedFunction(name, node.params, node.body, env)
  }

  function evalObjectExpression(node, env) {
    const obj = {}
    for (const prop of node.properties) {
      if (prop.type === 'SpreadElement') {
        const spread = evalExpression(prop.argument, env)
        Object.assign(obj, spread)
      } else {
        const key = prop.key.type === 'Identifier'
          ? prop.key.name
          : evalExpression(prop.key, env)
        const val = evalExpression(prop.value, env)

        if (val instanceof TracedFunction && val.name === 'anonymous') {
          val.name = String(key)
        }
        obj[key] = val
      }
    }
    return obj
  }

  function evalMemberExpression(node, env) {
    const obj = evalExpression(node.object, env)
    const prop = node.computed
      ? evalExpression(node.property, env)
      : node.property.name

    // Special case: Promise constructor accessed as identifier
    if (node.object.type === 'Identifier' && node.object.name === 'Promise') {
      if (prop === 'resolve') {
        return function PromiseResolve(val) {
          return { __isPromise: true, __resolvedValue: val }
        }
      }
      if (prop === 'reject') {
        return function PromiseReject(val) {
          return { __isPromise: true, __rejectedValue: val }
        }
      }
    }

    if (obj === null || obj === undefined) {
      // In non-strict mode, accessing properties on undefined returns undefined
      // instead of throwing an error (for educational purposes)
      return undefined
    }
    return obj[prop]
  }

  // ─── Event Loop Simulation ────────────────────────────────────────

  function processAsyncQueues(globalEnv) {
    // Phase 1: Process all microtasks first
    while (pendingMicrotasks.length > 0) {
      checkStepLimit()
      const task = pendingMicrotasks.shift()

      tracer.removeFromMicrotaskQueue()
      tracer.setEventLoopPhase('microtask')
      syncScopes(globalEnv)
      tracer.addStep(null, 'eventloop', `Event Loop: Processing microtask — ${task.label}`)

      if (task.tracedFn instanceof TracedFunction) {
        const callbackArgs = task.resolvedValue !== undefined ? [task.resolvedValue] : []
        invokeFunction(task.tracedFn, task.tracedFn.name, callbackArgs, globalEnv, null)
      }
    }

    // Phase 2: Move timers from Web APIs to Callback Queue
    const timersToProcess = [...pendingTimers]
    pendingTimers.length = 0

    for (const timer of timersToProcess) {
      checkStepLimit()
      tracer.removeWebApi(timer.id)
      tracer.addToCallbackQueue(timer.label, null)
      tracer.setEventLoopPhase('timer-complete')
      syncScopes(globalEnv)
      tracer.addStep(null, 'eventloop', `Timer done: ${timer.label} — callback moved from Web APIs → Callback Queue`)
    }

    // Phase 3: Process callback queue (macrotasks) one at a time
    // (with microtask drain between each)
    while (tracer.snapshot().callbackQueue.length > 0) {
      checkStepLimit()
      tracer.removeFromCallbackQueue()
      const timer = timersToProcess.shift()
      if (!timer) break

      tracer.setEventLoopPhase('callback')
      syncScopes(globalEnv)
      tracer.addStep(null, 'eventloop', `Event Loop: Call stack is empty — processing callback from queue`)

      if (timer.tracedFn instanceof TracedFunction) {
        invokeFunction(timer.tracedFn, timer.tracedFn.name, [], globalEnv, null)
      }

      // Drain microtasks after each macrotask
      while (pendingMicrotasks.length > 0) {
        checkStepLimit()
        const task = pendingMicrotasks.shift()
        tracer.removeFromMicrotaskQueue()
        tracer.setEventLoopPhase('microtask')
        syncScopes(globalEnv)
        tracer.addStep(null, 'eventloop', `Event Loop: Processing microtask — ${task.label}`)

        if (task.tracedFn instanceof TracedFunction) {
          const callbackArgs = task.resolvedValue !== undefined ? [task.resolvedValue] : []
          invokeFunction(task.tracedFn, task.tracedFn.name, callbackArgs, globalEnv, null)
        }
      }
    }

    if (timersToProcess.length > 0 || pendingMicrotasks.length > 0) {
      tracer.setEventLoopPhase('idle')
      syncScopes(globalEnv)
      tracer.addStep(null, 'eventloop', 'Event Loop: All queues processed')
    }
  }

  // ─── Main Entry Point ─────────────────────────────────────────────

  try {
    const ast = parseCode(code)
    const globalEnv = createEnv(null, 'Global', 'global')

    // Make Promise accessible as a stub so we can intercept it
    envDefine(globalEnv, 'Promise', getPromiseStub(), 'const')

    execProgram(ast, globalEnv)

    // After synchronous execution, simulate event loop for async work
    if (pendingTimers.length > 0 || pendingMicrotasks.length > 0) {
      tracer.setEventLoopPhase('checking-queues')
      syncScopes(globalEnv)
      tracer.addStep(null, 'eventloop', 'Synchronous code completed — Event Loop checking queues')
      processAsyncQueues(globalEnv)
    }
  } catch (err) {
    if (err instanceof StepLimitError) {
      tracer.addStep(null, 'error', err.message)
    } else {
      tracer.addStep(null, 'error', `Runtime Error: ${err.message || String(err)}`)
    }
  }

  return tracer.steps
}

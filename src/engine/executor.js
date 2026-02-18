import { generateTrace } from './instrumenter.js'

/**
 * Execute JavaScript code and return the full execution trace.
 *
 * This is the main entry point for the visualization engine.
 * It parses, instruments, and executes the code, collecting a
 * step-by-step trace of everything that happens at runtime.
 *
 * @param {string} code - JavaScript source code to execute and trace
 * @returns {{ steps: Array, error: string|null }}
 *   - steps: Array of trace step objects, each containing:
 *       { line, type, description, callStack, scopes, consoleOutput,
 *         webApis, callbackQueue, microtaskQueue, memoryHeap, eventLoopPhase }
 *   - error: Error message string if execution failed, null otherwise
 */
export function executeCode(code) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return {
      steps: [],
      error: null,
    }
  }

  try {
    const steps = generateTrace(code)

    // Safety check: if too many steps, truncate and warn
    if (steps.length > 1500) {
      console.warn(`Generated ${steps.length} steps, truncating to 1500 for performance`)
      steps.length = 1500
      steps.push({
        line: null,
        type: 'warning',
        description: 'Trace truncated at 1500 steps for performance. Code may be too complex for visualization.',
        callStack: [],
        scopes: [],
        consoleOutput: [],
        webApis: [],
        callbackQueue: [],
        microtaskQueue: [],
        memoryHeap: [],
        eventLoopPhase: 'idle'
      })
    }

    // Check if the last step is an error
    const lastStep = steps[steps.length - 1]
    const hasError = lastStep && lastStep.type === 'error'

    return {
      steps,
      error: hasError ? lastStep.description : null,
    }
  } catch (err) {
    // Unexpected errors that weren't caught by the instrumenter
    console.error('Execution error:', err)
    return {
      steps: [],
      error: err.message || 'An unexpected error occurred during execution.',
    }
  }
}

import * as acorn from 'acorn'

/**
 * Parse JavaScript source code into an AST using Acorn.
 * Returns a standard ESTree-compliant AST with location info.
 *
 * @param {string} code - JavaScript source code
 * @returns {import('acorn').Node} AST root node (Program)
 * @throws {Error} Friendly parse error with line/column info
 */
export function parseCode(code) {
  try {
    return acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'script',
      locations: true,
      ranges: true,
    })
  } catch (err) {
    // Acorn throws a SyntaxError with pos, loc, raisedAt
    const line = err.loc ? err.loc.line : '?'
    const col = err.loc ? err.loc.column + 1 : '?'
    const msg = err.message
      .replace(/\s*\(\d+:\d+\)\s*$/, '') // strip acorn's own (line:col) suffix
      .trim()

    const friendly = new Error(`Syntax Error on line ${line}, column ${col}: ${msg}`)
    friendly.line = typeof line === 'number' ? line : undefined
    friendly.column = typeof col === 'number' ? col : undefined
    friendly.originalError = err
    throw friendly
  }
}

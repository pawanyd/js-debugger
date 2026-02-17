import { motion, AnimatePresence } from 'framer-motion';
import { Target, Globe, FunctionSquare } from 'lucide-react';

export default function ExecutionContext({ scopes = [], callStack = [] }) {
  const currentFrame = callStack.length > 0 ? callStack[callStack.length - 1] : null;
  const isGlobal = !currentFrame || currentFrame.name === 'main' || currentFrame.name === '<global>';
  const contextType = isGlobal ? 'Global' : 'Function';
  const contextName = currentFrame?.name || 'Global';
  const currentScope = scopes.length > 0 ? scopes[0] : null;
  const thisBinding = isGlobal ? 'window (global)' : `${contextName} context`;

  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <Target className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Execution Context
        </h3>
      </div>

      {/* Context details */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={contextName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Context Type */}
            <div className={`rounded-lg border-2 p-3 ${
              isGlobal
                ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isGlobal ? (
                  <Globe className="w-4 h-4 text-blue-500" />
                ) : (
                  <FunctionSquare className="w-4 h-4 text-purple-500" />
                )}
                <span className={`text-xs font-bold ${
                  isGlobal ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'
                }`}>
                  {contextType} Execution Context
                </span>
              </div>

              {currentFrame && (
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 ml-6">
                  {contextName}()
                </p>
              )}
            </div>

            {/* Details rows */}
            <div className="space-y-2">
              {/* this binding */}
              <div className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-slate-700/40">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">
                  this
                </span>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  {thisBinding}
                </span>
              </div>

              {/* Variable Environment */}
              <div className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-slate-700/40">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">
                  Vars
                </span>
                <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {currentScope && currentScope.variables ? (
                    Object.keys(currentScope.variables).length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {Object.keys(currentScope.variables).map((name) => (
                          <span
                            key={name}
                            className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded text-[11px] border border-gray-200 dark:border-gray-600"
                          >
                            {name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">none</span>
                    )
                  ) : (
                    <span className="text-gray-400 italic">none</span>
                  )}
                </div>
              </div>

              {/* Outer Reference */}
              <div className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-slate-700/40">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">
                  Outer
                </span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {scopes.length > 1 ? scopes[1].name || scopes[1].type : isGlobal ? 'null' : 'Global'}
                </span>
              </div>

              {/* Call Stack Depth */}
              <div className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-slate-700/40">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">
                  Depth
                </span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {callStack.length} frame{callStack.length !== 1 ? 's' : ''} deep
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

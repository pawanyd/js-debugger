import { motion, AnimatePresence } from 'framer-motion';
import { Link, Globe, FunctionSquare, Braces } from 'lucide-react';

const scopeConfig = {
  global: { icon: Globe, color: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500' },
  function: { icon: FunctionSquare, color: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-500' },
  block: { icon: Braces, color: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-500' },
};

export default function ScopeChain({ scopes = [] }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <Link className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Scope Chain
        </h3>
      </div>

      {/* Chain */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {scopes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No active scopes
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-0">
              {scopes.map((scope, index) => {
                const config = scopeConfig[scope.type] || scopeConfig.global;
                const Icon = config.icon;
                const isCurrent = index === 0;

                return (
                  <motion.div
                    key={`${scope.name}-${index}`}
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.05 }}
                    layout
                    className="flex flex-col items-center w-full"
                  >
                    {/* Scope box */}
                    <div
                      className={`relative w-full max-w-[200px] rounded-lg border-2 ${config.color} ${config.bg} px-3 py-2 shadow-sm ${
                        isCurrent ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-yellow-400' : ''
                      }`}
                    >
                      {/* Current indicator */}
                      {isCurrent && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${config.text} shrink-0`} />
                        <span className={`text-xs font-semibold ${config.text} truncate`}>
                          {scope.name || scope.type}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 block">
                          current scope
                        </span>
                      )}
                    </div>

                    {/* Arrow connector */}
                    {index < scopes.length - 1 && (
                      <div className="flex flex-col items-center py-0.5">
                        <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                        <svg width="10" height="8" viewBox="0 0 10 8" className="text-gray-300 dark:text-gray-600">
                          <path d="M5 8L0 0h10z" fill="currentColor" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

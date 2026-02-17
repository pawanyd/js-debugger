import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';

const scopeColors = {
  global: { accent: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  function: { accent: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  block: { accent: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

function getValueColor(value) {
  if (value === undefined) return 'text-gray-400 dark:text-gray-500';
  if (value === null) return 'text-gray-400 dark:text-gray-500';
  if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
  if (typeof value === 'string') return 'text-emerald-600 dark:text-emerald-400';
  if (typeof value === 'boolean') return 'text-amber-600 dark:text-amber-400';
  if (typeof value === 'function') return 'text-purple-600 dark:text-purple-400';
  if (Array.isArray(value)) return 'text-pink-600 dark:text-pink-400';
  if (typeof value === 'object') return 'text-cyan-600 dark:text-cyan-400';
  return 'text-gray-700 dark:text-gray-300';
}

function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return 'ƒ()';
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const inner = entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ');
    return `{${inner}}`;
  }
  return String(value);
}

function ScopeSection({ scope, defaultOpen = true, previousVariables }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = scopeColors[scope.type] || scopeColors.global;
  const variables = scope.variables || {};
  const varEntries = Object.entries(variables);

  return (
    <div className={`border-l-2 ${colors.accent} rounded-r-lg bg-gray-50 dark:bg-slate-700/40 overflow-hidden`}>
      {/* Scope Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        )}
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {scope.name || scope.type}
        </span>
        <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.badge}`}>
          {scope.type}
        </span>
      </button>

      {/* Variables */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2">
              {varEntries.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic py-1">
                  No variables
                </p>
              ) : (
                <div className="space-y-0.5">
                  {varEntries.map(([name, value]) => {
                    const prevValue = previousVariables?.[name];
                    const hasChanged = previousVariables != null && prevValue !== value;

                    return (
                      <motion.div
                        key={name}
                        layout
                        className={`flex items-baseline gap-1.5 py-0.5 px-2 rounded text-xs font-mono transition-colors ${
                          hasChanged
                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-600/30'
                        }`}
                      >
                        <span className="text-gray-600 dark:text-gray-400 shrink-0">
                          {name}
                        </span>
                        <span className="text-gray-400">=</span>
                        <motion.span
                          key={String(value)}
                          initial={hasChanged ? { scale: 1.2, backgroundColor: 'rgba(250, 204, 21, 0.3)' } : false}
                          animate={{ scale: 1, backgroundColor: 'rgba(250, 204, 21, 0)' }}
                          transition={{ duration: 0.5 }}
                          className={`${getValueColor(value)} truncate`}
                        >
                          {formatValue(value)}
                        </motion.span>
                        {hasChanged && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-yellow-500 text-[10px] ml-auto shrink-0"
                          >
                            ●
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VariablePanel({ scopes = [], previousScopes }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Variables
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {scopes.length} scope{scopes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scopes */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {scopes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              No active scopes
            </p>
          </div>
        ) : (
          scopes.map((scope, index) => {
            const prevScope = previousScopes?.[index];
            return (
              <ScopeSection
                key={`${scope.name || scope.type}-${index}`}
                scope={scope}
                defaultOpen={index === 0}
                previousVariables={prevScope?.variables}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

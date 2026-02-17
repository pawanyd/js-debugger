import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Box, List } from 'lucide-react';

function formatHeapValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return 'ƒ()';
  return String(value);
}

function HeapCard({ item }) {
  const isArray = item.type === 'array';
  const isFunction = item.type === 'function';

  const colorClasses = isArray
    ? 'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20'
    : isFunction
    ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
    : 'border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20';

  const headerColor = isArray
    ? 'bg-pink-500'
    : isFunction
    ? 'bg-purple-500'
    : 'bg-cyan-500';

  const Icon = isArray ? List : Box;

  const entries = item.value != null
    ? typeof item.value === 'object'
      ? Object.entries(item.value)
      : [[null, item.value]]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
      className={`rounded-lg border ${colorClasses} shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className={`${headerColor} px-2.5 py-1 flex items-center gap-1.5`}>
        <Icon className="w-3 h-3 text-white" />
        <span className="text-[11px] font-semibold text-white truncate">
          {item.label || item.id}
        </span>
        <span className="ml-auto text-[9px] text-white/70 font-mono">
          {isArray ? 'Array' : isFunction ? 'Function' : 'Object'}
        </span>
      </div>

      {/* Properties */}
      <div className="px-2.5 py-1.5">
        {entries.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic">empty</p>
        ) : isArray && Array.isArray(item.value) ? (
          <div className="flex flex-wrap gap-1">
            {item.value.map((el, i) => (
              <span
                key={i}
                className="text-[11px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              >
                {formatHeapValue(el)}
              </span>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries.slice(0, 6).map(([key, val]) => (
              <div key={key} className="flex items-baseline gap-1 text-[11px] font-mono">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">{key}:</span>
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {formatHeapValue(val)}
                </span>
              </div>
            ))}
            {entries.length > 6 && (
              <p className="text-[9px] text-gray-400">
                +{entries.length - 6} more...
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MemoryHeap({ heap = [] }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <HardDrive className="w-4 h-4 text-rose-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Memory Heap
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {heap.length} object{heap.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Heap objects */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {heap.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No heap objects
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {heap.map((item) => (
                <HeapCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

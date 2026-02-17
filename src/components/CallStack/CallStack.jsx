import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';

const frameColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-rose-500 to-rose-600',
  'from-indigo-500 to-indigo-600',
];

export default function CallStack({ stack = [] }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <Layers className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Call Stack
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {stack.length} frame{stack.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stack frames */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col-reverse gap-1.5">
        <AnimatePresence mode="popLayout">
          {stack.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                (empty)
              </p>
            </motion.div>
          ) : (
            stack.map((frame, index) => (
              <motion.div
                key={`${frame.name}-${index}-${stack.length}`}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                layout
                className={`relative rounded-md bg-gradient-to-r ${frameColors[index % frameColors.length]} px-3 py-2 shadow-sm`}
              >
                {/* Top-of-stack indicator */}
                {index === stack.length - 1 && (
                  <motion.div
                    layoutId="stack-indicator"
                    className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                  />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-semibold text-white truncate">
                    {frame.name}()
                  </span>
                  {frame.line != null && (
                    <span className="text-xs text-white/70 ml-2 shrink-0">
                      line {frame.line}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

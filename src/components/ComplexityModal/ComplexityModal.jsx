import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Database, TrendingUp, Info } from 'lucide-react';

export default function ComplexityModal({ isOpen, onClose, complexity }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complexity Analysis
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Time and Space Complexity
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Time Complexity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Time Complexity
                </h3>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {complexity.time.notation}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {complexity.time.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {complexity.time.description}
                </p>
              </div>
              
              {/* Time Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Total Steps
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {complexity.time.steps}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Function Calls
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {complexity.time.functionCalls}
                  </div>
                </div>
              </div>
            </div>

            {/* Space Complexity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Space Complexity
                </h3>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {complexity.space.notation}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {complexity.space.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {complexity.space.description}
                </p>
              </div>

              {/* Space Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Max Call Stack
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {complexity.space.maxCallStack}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Variables Created
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {complexity.space.variablesCreated}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Note about complexity analysis:
                </p>
                <p>
                  This is an estimated analysis based on the execution trace. 
                  Actual complexity may vary depending on input size and code structure.
                  The analysis counts operations during this specific execution.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

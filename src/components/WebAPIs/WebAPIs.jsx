import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Timer, Wifi, MousePointer, Bell } from 'lucide-react';

const typeConfig = {
  setTimeout: { icon: Timer, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  setInterval: { icon: Timer, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  fetch: { icon: Wifi, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  event: { icon: MousePointer, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  default: { icon: Globe, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/50', border: 'border-gray-200 dark:border-gray-700' },
};

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.default;
}

export default function WebAPIs({ apis = [] }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <Globe className="w-4 h-4 text-teal-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Web APIs
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {apis.length} active
        </span>
      </div>

      {/* API Cards */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {apis.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No active Web APIs
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              {apis.map((api) => {
                const config = getTypeConfig(api.type);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={api.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 40 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    layout
                    className={`rounded-lg border ${config.border} ${config.bg} p-2.5 shadow-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                          {api.label || api.type}
                        </p>
                        {api.delay != null && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-gray-400">
                                {api.delay}ms
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: api.delay / 1000, ease: 'linear' }}
                                className={`h-full rounded-full ${
                                  api.type === 'fetch' ? 'bg-blue-500' : 'bg-orange-500'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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

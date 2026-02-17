import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Clock, CircleDot } from 'lucide-react';

const phaseConfig = {
  idle: { label: 'Idle', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', ring: 'ring-gray-300 dark:ring-gray-600' },
  executing: { label: 'Executing', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-400' },
  microtasks: { label: 'Microtasks', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', ring: 'ring-purple-400' },
  macrotasks: { label: 'Macrotasks', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30', ring: 'ring-orange-400' },
};

function QueueItem({ item, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium text-white shadow-sm whitespace-nowrap ${color}`}
    >
      {typeof item === 'string' ? item : item.label || item.name || 'task'}
    </motion.div>
  );
}

export default function EventLoop({ phase = 'idle', microtaskQueue = [], callbackQueue = [] }) {
  const currentPhase = phaseConfig[phase] || phaseConfig.idle;
  const isActive = phase !== 'idle';

  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <RefreshCw className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Event Loop
        </h3>
        <motion.span
          animate={{ opacity: isActive ? 1 : 0.5 }}
          className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${currentPhase.bg} ${currentPhase.color}`}
        >
          {currentPhase.label}
        </motion.span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
        {/* Central Loop Indicator */}
        <div className="flex justify-center py-2">
          <div className="relative">
            {/* Outer pulsing ring */}
            <motion.div
              animate={isActive ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              } : { scale: 1, opacity: 0.1 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full ${currentPhase.bg}`}
              style={{ margin: '-8px' }}
            />

            {/* Main loop circle */}
            <motion.div
              animate={isActive ? { rotate: 360 } : { rotate: 0 }}
              transition={isActive ? { repeat: Infinity, duration: 3, ease: 'linear' } : { duration: 0.5 }}
              className={`relative w-16 h-16 rounded-full ring-3 ${currentPhase.ring} flex items-center justify-center ${currentPhase.bg}`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <RefreshCw className={`w-6 h-6 ${currentPhase.color}`} />
              </motion.div>
            </motion.div>

            {/* Phase arrows */}
            {phase === 'microtasks' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute -left-20 top-1/2 -translate-y-1/2 text-purple-500"
              >
                <span className="text-lg">←</span>
              </motion.div>
            )}
            {phase === 'macrotasks' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute -right-20 top-1/2 -translate-y-1/2 text-orange-500"
              >
                <span className="text-lg">→</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Queues */}
        <div className="grid grid-cols-2 gap-3">
          {/* Microtask Queue */}
          <div className={`rounded-lg border p-2 transition-colors ${
            phase === 'microtasks'
              ? 'border-purple-400 dark:border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Microtasks
              </span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">
                {microtaskQueue.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[28px]">
              <AnimatePresence mode="popLayout">
                {microtaskQueue.length === 0 ? (
                  <motion.p
                    key="empty-micro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-gray-400 italic w-full text-center py-1"
                  >
                    empty
                  </motion.p>
                ) : (
                  microtaskQueue.map((item, i) => (
                    <QueueItem key={`micro-${i}-${typeof item === 'string' ? item : item.id || i}`} item={item} color="bg-purple-500" />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Callback Queue (Macrotask) */}
          <div className={`rounded-lg border p-2 transition-colors ${
            phase === 'macrotasks'
              ? 'border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                Callbacks
              </span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">
                {callbackQueue.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[28px]">
              <AnimatePresence mode="popLayout">
                {callbackQueue.length === 0 ? (
                  <motion.p
                    key="empty-macro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-gray-400 italic w-full text-center py-1"
                  >
                    empty
                  </motion.p>
                ) : (
                  callbackQueue.map((item, i) => (
                    <QueueItem key={`macro-${i}-${typeof item === 'string' ? item : item.id || i}`} item={item} color="bg-orange-500" />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Flow Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {phase === 'idle' && 'Waiting for tasks...'}
              {phase === 'executing' && 'Running code on the call stack'}
              {phase === 'microtasks' && 'Processing microtask queue (Promises)'}
              {phase === 'macrotasks' && 'Processing callback queue (setTimeout, etc.)'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Variable,
  FunctionSquare,
  Repeat,
  ArrowRight,
  Zap,
  Clock,
  AlertCircle,
  PlayCircle,
  Info,
} from 'lucide-react';

const typeConfig = {
  variable: { icon: Variable, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'function-call': { icon: FunctionSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  'function-return': { icon: ArrowRight, color: 'text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  loop: { icon: Repeat, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  conditional: { icon: ArrowRight, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'console-log': { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  promise: { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  timeout: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  start: { icon: PlayCircle, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  default: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/50' },
};

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.default;
}

export default function StepDescription({ step }) {
  const config = step ? getTypeConfig(step.type) : typeConfig.default;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={step?.description || 'empty'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 px-4 py-3 ${config.bg}`}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
          </motion.div>
          <div className="min-w-0 flex-1">
            {step ? (
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
                >
                  {step.description || 'Executing...'}
                </motion.p>
                {step.type && (
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${config.color} opacity-70`}>
                    {step.type.replace('-', ' ')}
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                Click "Run" or step through the code to see what happens...
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

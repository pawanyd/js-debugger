import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Zap,
  RotateCcw,
} from 'lucide-react';

function ControlButton({ icon: Icon, onClick, disabled, label, variant = 'default', size = 'default' }) {
  const base = 'inline-flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variants = {
    default: 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 focus:ring-gray-400',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 focus:ring-blue-400',
    accent: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 focus:ring-emerald-400',
  };

  const sizes = {
    sm: 'w-8 h-8',
    default: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`${base} ${variants[variant]} ${sizes[size]}`}
    >
      <Icon className={iconSizes[size]} />
    </motion.button>
  );
}

export default function ExecutionControls({
  isPlaying = false,
  currentStep = 0,
  totalSteps = 0,
  speed = 1,
  onStepForward,
  onStepBackward,
  onGoToStart,
  onGoToEnd,
  onTogglePlay,
  onSpeedChange,
  onRun,
}) {
  const progress = totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const atStart = currentStep <= 0;
  const atEnd = totalSteps === 0 || currentStep >= totalSteps - 1;
  const hasSteps = totalSteps > 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-3">
      <div className="flex flex-col gap-3">
        {/* Top row: Run button + Transport Controls + Speed */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Run Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRun}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
          >
            <Zap className="w-4 h-4" />
            Run
          </motion.button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Transport controls */}
          <div className="flex items-center gap-1.5">
            <ControlButton
              icon={SkipBack}
              onClick={onGoToStart}
              disabled={!hasSteps || atStart}
              label="Go to start"
              size="sm"
            />
            <ControlButton
              icon={ChevronLeft}
              onClick={onStepBackward}
              disabled={!hasSteps || atStart}
              label="Step backward"
            />
            <ControlButton
              icon={isPlaying ? Pause : Play}
              onClick={onTogglePlay}
              disabled={!hasSteps || (!isPlaying && atEnd)}
              label={isPlaying ? 'Pause' : 'Play'}
              variant="primary"
              size="lg"
            />
            <ControlButton
              icon={ChevronRight}
              onClick={onStepForward}
              disabled={!hasSteps || atEnd}
              label="Step forward"
            />
            <ControlButton
              icon={SkipForward}
              onClick={onGoToEnd}
              disabled={!hasSteps || atEnd}
              label="Go to end"
              size="sm"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Speed control */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Speed
            </span>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={speed}
              onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
              {speed}x
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={false}
                animate={{ width: `${Math.max(progress, 0)}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>

            {/* Clickable overlay for scrubbing */}
            {hasSteps && (
              <input
                type="range"
                min="0"
                max={Math.max(totalSteps - 1, 0)}
                value={currentStep}
                onChange={(e) => {
                  const target = parseInt(e.target.value);
                  if (target > currentStep && onStepForward) {
                    // Seek forward to target
                    for (let i = currentStep; i < target; i++) onStepForward();
                  } else if (target < currentStep && onStepBackward) {
                    for (let i = currentStep; i > target; i--) onStepBackward();
                  }
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            )}
          </div>

          {/* Step counter */}
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[80px] text-right">
            {hasSteps ? (
              <>
                Step{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {currentStep + 1}
                </span>
                {' '}of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {totalSteps}
                </span>
              </>
            ) : (
              'No steps'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

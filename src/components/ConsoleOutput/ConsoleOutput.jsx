import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function ConsoleOutput({ output = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80">
        <Terminal className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Console
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {output.length} line{output.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Console body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gray-900 dark:bg-slate-950 p-3 font-mono text-sm"
      >
        {output.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-500 text-xs italic">
            Console output will appear here...
          </p>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {output.map((line, index) => {
                const isError = typeof line === 'string' && (line.startsWith('Error') || line.startsWith('TypeError') || line.startsWith('ReferenceError'));
                const isWarning = typeof line === 'string' && line.startsWith('Warning');

                return (
                  <motion.div
                    key={`${index}-${line}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-start gap-2 py-0.5 ${
                      isError
                        ? 'text-red-400'
                        : isWarning
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    <span className="text-gray-600 select-none shrink-0">{'>'}</span>
                    <span className="break-all">{String(line)}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'steps(2)' }}
          className="inline-block w-2 h-4 bg-green-500 mt-1 ml-5"
        />
      </div>
    </div>
  );
}

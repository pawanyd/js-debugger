import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Sun, Moon, Github, AlertTriangle, User, TrendingUp } from 'lucide-react';

import CodeEditor from '../CodeEditor/CodeEditor';
import CallStack from '../CallStack/CallStack';
import EventLoop from '../EventLoop/EventLoop';
import WebAPIs from '../WebAPIs/WebAPIs';
import VariablePanel from '../VariablePanel/VariablePanel';
import ScopeChain from '../ScopeChain/ScopeChain';
import MemoryHeap from '../MemoryHeap/MemoryHeap';
import ExecutionContext from '../ExecutionContext/ExecutionContext';
import ConsoleOutput from '../ConsoleOutput/ConsoleOutput';
import StepDescription from '../StepDescription/StepDescription';
import ExecutionControls from '../ExecutionControls/ExecutionControls';
import ExampleSelector from '../ExampleSelector/ExampleSelector';
import ComplexityModal from '../ComplexityModal/ComplexityModal';
import { analyzeComplexity } from '../../utils/complexityAnalyzer';

export default function Layout({
  // Code editor
  code = '',
  onCodeChange,
  activeLine,
  readOnly = false,
  error = null,

  // Execution state
  callStack = [],
  eventLoopPhase = 'idle',
  microtaskQueue = [],
  callbackQueue = [],
  webApis = [],
  scopes = [],
  previousScopes,
  scopeChain = [],
  heap = [],
  consoleOutput = [],
  currentStep = null,
  trace = [], // Add trace prop for complexity analysis

  // Controls
  isPlaying = false,
  currentStepIndex = 0,
  totalSteps = 0,
  speed = 1,
  onStepForward,
  onStepBackward,
  onGoToStart,
  onGoToEnd,
  onTogglePlay,
  onSpeedChange,
  onRun,

  // Examples
  examples = [],
  currentExampleId,
  onExampleSelect,

  // Theme
  isDark = false,
  onToggleTheme,
}) {
  const [activeTab, setActiveTab] = useState('runtime');
  const [showComplexityModal, setShowComplexityModal] = useState(false);
  
  // Calculate complexity from trace
  const complexity = analyzeComplexity(trace);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-sm z-10">
        {/* Left: Logo */}
        <a 
          href="https://pawanyd.github.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <motion.div
            whileHover={{ rotate: 10 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <Code2 className="w-5 h-5 text-white" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
              JS Code Visualizer
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
              See how JavaScript works behind the scenes
            </p>
          </div>
        </a>

        {/* Center: Example selector */}
        <div className="hidden md:block">
          <ExampleSelector
            examples={examples}
            onSelect={onExampleSelect}
            currentId={currentExampleId}
          />
        </div>

        {/* Right: Complexity, Theme toggle & links */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowComplexityModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium transition-all shadow-sm"
            aria-label="Show complexity analysis"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Complexity</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </motion.button>
          <a
            href="https://pawanyd.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Portfolio"
          >
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </a>
          <a
            href="https://github.com/pawanyd"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </a>
        </div>
      </header>

      {/* Mobile example selector */}
      <div className="md:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
        <ExampleSelector
          examples={examples}
          onSelect={onExampleSelect}
          currentId={currentExampleId}
        />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0">
        {/* LEFT PANEL: Code Editor + Variables */}
        <div className="lg:w-[38%] xl:w-[35%] flex flex-col border-r border-gray-200 dark:border-gray-700 min-h-0">
          {/* Code Editor */}
          <div className="flex-1 min-h-0 p-2">
            <CodeEditor
              code={code}
              onChange={onCodeChange}
              activeLine={activeLine}
              readOnly={readOnly}
            />
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-2 mb-1 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs text-red-700 dark:text-red-300 truncate">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Variables + Console (stacked beneath editor on desktop) */}
          <div className="hidden lg:flex h-[35%] min-h-0 gap-2 p-2 pt-0">
            <div className="flex-1 min-w-0">
              <VariablePanel scopes={scopes} previousScopes={previousScopes} />
            </div>
            <div className="flex-1 min-w-0">
              <ConsoleOutput output={consoleOutput} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Runtime visualization panels */}
        <div className="lg:flex-1 min-h-0 flex flex-col">
          {/* Mobile tab switcher */}
          <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
            {['runtime', 'variables', 'console'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mobile variable/console panels */}
          <div className="lg:hidden min-h-0">
            {activeTab === 'variables' && (
              <div className="h-48 p-2">
                <VariablePanel scopes={scopes} previousScopes={previousScopes} />
              </div>
            )}
            {activeTab === 'console' && (
              <div className="h-48 p-2">
                <ConsoleOutput output={consoleOutput} />
              </div>
            )}
          </div>

          {/* Runtime panels grid */}
          <div className={`flex-1 min-h-0 overflow-y-auto p-2 ${
            activeTab !== 'runtime' ? 'hidden lg:block' : ''
          }`}>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 h-full auto-rows-fr"
                 style={{ gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
              {/* Row 1 */}
              <div className="min-h-[140px]">
                <CallStack stack={callStack} />
              </div>
              <div className="min-h-[140px]">
                <WebAPIs apis={webApis} />
              </div>
              <div className="min-h-[140px] col-span-2 xl:col-span-1">
                <ExecutionContext scopes={scopes} callStack={callStack} />
              </div>

              {/* Row 2: Event Loop spans wider */}
              <div className="min-h-[160px] col-span-2 xl:col-span-2">
                <EventLoop
                  phase={eventLoopPhase}
                  microtaskQueue={microtaskQueue}
                  callbackQueue={callbackQueue}
                />
              </div>
              <div className="min-h-[160px] col-span-2 xl:col-span-1">
                <ScopeChain scopes={scopeChain} />
              </div>

              {/* Row 3 */}
              <div className="min-h-[140px] col-span-2 xl:col-span-3">
                <MemoryHeap heap={heap} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== BOTTOM BAR: Step Description + Controls ===== */}
      <footer className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-2 space-y-2">
        <StepDescription step={currentStep} />
        <ExecutionControls
          isPlaying={isPlaying}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          speed={speed}
          onStepForward={onStepForward}
          onStepBackward={onStepBackward}
          onGoToStart={onGoToStart}
          onGoToEnd={onGoToEnd}
          onTogglePlay={onTogglePlay}
          onSpeedChange={onSpeedChange}
          onRun={onRun}
        />
      </footer>

      {/* Complexity Modal */}
      <ComplexityModal
        isOpen={showComplexityModal}
        onClose={() => setShowComplexityModal(false)}
        complexity={complexity}
      />
    </div>
  );
}

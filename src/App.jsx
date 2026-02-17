import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout/Layout';
import { executeCode } from './engine/executor';
import examples from './examples/index';

const defaultCode = examples[0]?.code || '// Write your JavaScript code here\nconsole.log("Hello, world!");';

export default function App() {
  // Theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('js-visualizer-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('js-visualizer-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Code
  const [code, setCode] = useState(defaultCode);
  const [currentExampleId, setCurrentExampleId] = useState(examples[0]?.id || null);

  // Execution state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [trace, setTrace] = useState([]);
  const [error, setError] = useState(null);
  const playIntervalRef = useRef(null);

  // Derive current step state
  const totalSteps = trace.length;
  const currentStep = trace[currentStepIndex] || null;
  const activeLine = currentStep?.line || null;

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && currentStepIndex < totalSteps - 1) {
      playIntervalRef.current = setTimeout(() => {
        setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
      }, 800 / speed);
    } else if (isPlaying && currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(playIntervalRef.current);
  }, [isPlaying, currentStepIndex, totalSteps, speed]);

  // Run code through the real engine
  const handleRun = useCallback(() => {
    setIsPlaying(false);
    setError(null);
    try {
      const result = executeCode(code);
      setTrace(result.steps || []);
      setError(result.error || null);
      setCurrentStepIndex(0);
    } catch (err) {
      setTrace([]);
      setError(err.message || 'An unexpected error occurred');
      setCurrentStepIndex(0);
    }
  }, [code]);

  const handleExampleSelect = useCallback((example) => {
    setCode(example.code);
    setCurrentExampleId(example.id);
    setTrace([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setError(null);
  }, []);

  // Derive previous scopes for change highlighting
  const previousStep = currentStepIndex > 0 ? trace[currentStepIndex - 1] : null;

  return (
    <Layout
      code={code}
      onCodeChange={(newCode) => { setCode(newCode); setError(null); }}
      activeLine={activeLine}
      readOnly={isPlaying}
      error={error}
      callStack={currentStep?.callStack || []}
      eventLoopPhase={currentStep?.eventLoopPhase || 'idle'}
      microtaskQueue={currentStep?.microtaskQueue || []}
      callbackQueue={currentStep?.callbackQueue || []}
      webApis={currentStep?.webApis || []}
      scopes={currentStep?.scopes || []}
      previousScopes={previousStep?.scopes}
      scopeChain={currentStep?.scopes || []}
      heap={currentStep?.memoryHeap || []}
      consoleOutput={currentStep?.consoleOutput || []}
      currentStep={currentStep ? { type: currentStep.type, description: currentStep.description } : null}
      isPlaying={isPlaying}
      currentStepIndex={currentStepIndex}
      totalSteps={totalSteps}
      speed={speed}
      onStepForward={() => setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1))}
      onStepBackward={() => setCurrentStepIndex((i) => Math.max(i - 1, 0))}
      onGoToStart={() => { setCurrentStepIndex(0); setIsPlaying(false); }}
      onGoToEnd={() => { setCurrentStepIndex(Math.max(totalSteps - 1, 0)); setIsPlaying(false); }}
      onTogglePlay={() => {
        if (!isPlaying && currentStepIndex >= totalSteps - 1 && totalSteps > 0) {
          setCurrentStepIndex(0);
        }
        setIsPlaying((p) => !p);
      }}
      onSpeedChange={setSpeed}
      onRun={handleRun}
      examples={examples}
      currentExampleId={currentExampleId}
      onExampleSelect={handleExampleSelect}
      isDark={isDark}
      onToggleTheme={() => setIsDark((d) => !d)}
    />
  );
}

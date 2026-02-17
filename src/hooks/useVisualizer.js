import { useState, useEffect, useCallback, useRef } from 'react';
import { executeCode } from '../engine/executor';

const DEFAULT_SPEED = 1000; // ms between steps during auto-play

/**
 * Main hook for the JS Code Visualizer.
 * Manages execution trace, step navigation, auto-play, and speed.
 *
 * @param {string} initialCode - Optional initial code to load
 * @returns {object} Visualizer state and control functions
 */
export function useVisualizer(initialCode = '') {
  // ─── State ──────────────────────────────────────────────
  const [code, setCode] = useState(initialCode);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [error, setError] = useState(null);

  // Ref to always have latest values in the interval callback
  const stepsRef = useRef(steps);
  const currentStepRef = useRef(currentStep);
  const speedRef = useRef(speed);
  const isPlayingRef = useRef(isPlaying);

  // Keep refs in sync
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ─── Derived data ───────────────────────────────────────
  const currentStepData = steps.length > 0 && currentStep < steps.length
    ? steps[currentStep]
    : null;

  const totalSteps = steps.length;
  const isAtStart = currentStep === 0;
  const isAtEnd = steps.length === 0 || currentStep >= steps.length - 1;
  const hasSteps = steps.length > 0;

  // ─── Core: run code through the engine ──────────────────
  const run = useCallback((codeToRun) => {
    // Stop any ongoing playback
    setIsPlaying(false);
    setError(null);

    if (codeToRun !== undefined) {
      setCode(codeToRun);
    }

    const source = codeToRun !== undefined ? codeToRun : code;

    try {
      const result = executeCode(source);
      setSteps(result.steps || []);
      setCurrentStep(0);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setSteps([]);
      setCurrentStep(0);
      setError(err.message || 'An unexpected error occurred');
    }
  }, [code]);

  // ─── Step navigation ────────────────────────────────────
  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < stepsRef.current.length - 1) {
        return prev + 1;
      }
      // Auto-pause when reaching the end
      setIsPlaying(false);
      return prev;
    });
  }, []);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStart = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const goToEnd = useCallback(() => {
    if (stepsRef.current.length > 0) {
      setCurrentStep(stepsRef.current.length - 1);
    }
    setIsPlaying(false);
  }, []);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < stepsRef.current.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  // ─── Playback controls ─────────────────────────────────
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      // If at end and pressing play, restart from beginning
      if (!prev && currentStepRef.current >= stepsRef.current.length - 1 && stepsRef.current.length > 0) {
        setCurrentStep(0);
      }
      return !prev;
    });
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // ─── Reset ──────────────────────────────────────────────
  const reset = useCallback(() => {
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setError(null);
  }, []);

  // ─── Auto-play effect ──────────────────────────────────
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;

    const intervalId = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= stepsRef.current.length - 1) {
          // Reached the end — stop playing
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(intervalId);
  }, [isPlaying, speed, steps.length]);

  // ─── Return everything ─────────────────────────────────
  return {
    // State
    code,
    setCode,
    steps,
    currentStep,
    currentStepData,
    totalSteps,
    isPlaying,
    speed,
    error,

    // Derived booleans
    isAtStart,
    isAtEnd,
    hasSteps,

    // Actions
    run,
    stepForward,
    stepBackward,
    goToStart,
    goToEnd,
    goToStep,
    togglePlay,
    pause,
    setSpeed,
    reset,
  };
}

export default useVisualizer;

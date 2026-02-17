import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'js-visualizer-theme';

/**
 * Hook to manage dark/light theme.
 * - Reads initial preference from localStorage, then prefers-color-scheme.
 * - Toggles the 'dark' class on <html> (document.documentElement).
 * - Persists the choice to localStorage.
 *
 * @returns {{ isDark: boolean, toggleTheme: () => void }}
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // 1. Check localStorage first
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }

    // 2. Fall back to OS / browser preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // 3. Default to light
    return false;
  });

  // Sync the 'dark' class on <html> whenever isDark changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // silently ignore storage errors
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggleTheme };
}

export default useTheme;

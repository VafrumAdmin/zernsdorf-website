'use client';

import { useState, useEffect, useCallback } from 'react';
import { themes, defaultTheme, type Theme } from '@/lib/theme';

const THEME_STORAGE_KEY = 'zernsdorf-theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && themes[saved]) {
      setCurrentTheme(saved);
    }
    setIsLoaded(true);
  }, []);

  const setTheme = useCallback((themeId: string) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  }, []);

  const theme: Theme = themes[currentTheme] || themes[defaultTheme];

  return {
    theme,
    currentTheme,
    setTheme,
    themes,
    isLoaded,
  };
}

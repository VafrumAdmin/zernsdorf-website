'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WasteSettings } from '@/types';
import { getWasteSettings, setWasteSettings, clearWasteSettings } from '@/lib/storage';

export function useWasteSettings() {
  const [settings, setSettings] = useState<WasteSettings | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getWasteSettings();
    setSettings(stored);
    setIsLoading(false);
  }, []);

  const saveSettings = useCallback((newSettings: WasteSettings) => {
    setWasteSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const clearSettings = useCallback(() => {
    clearWasteSettings();
    setSettings(undefined);
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<WasteSettings>) => {
      if (settings) {
        const updated = { ...settings, ...updates };
        saveSettings(updated);
      }
    },
    [settings, saveSettings]
  );

  return {
    settings,
    isLoading,
    isConfigured: !!settings?.icsUrl,
    saveSettings,
    clearSettings,
    updateSettings,
  };
}

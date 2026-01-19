import type { LocalSettings, WasteSettings } from '@/types';

const STORAGE_KEY = 'zernsdorf_settings';

const defaultSettings: LocalSettings = {
  language: 'de',
  theme: 'system',
};

export function getLocalSettings(): LocalSettings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
}

export function setLocalSettings(settings: Partial<LocalSettings>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getLocalSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function getWasteSettings(): WasteSettings | undefined {
  const settings = getLocalSettings();
  return settings.wasteSettings;
}

export function setWasteSettings(wasteSettings: WasteSettings): void {
  setLocalSettings({ wasteSettings });
}

export function clearWasteSettings(): void {
  const settings = getLocalSettings();
  delete settings.wasteSettings;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

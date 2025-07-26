// src/utils/settings.ts

export interface GeneralSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  wordsPerSession: number;
  srsMethod: string;
}

export interface AISettings {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

export interface AdvancedSettings {
  debugMode: boolean;
}

export interface Settings {
  general: GeneralSettings;
  ai: AISettings;
  advanced: AdvancedSettings;
}

const SETTINGS_KEY = 'app_settings';

export function getSettings(): Settings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Settings;
  } catch {
    return null;
  }
}

export function setSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function updateSettings(partial: Partial<Settings>): void {
  const current = getSettings() || getDefaultSettings();
  const updated = { ...current, ...partial };
  setSettings(updated);
}

export function getDefaultSettings(): Settings {
  return {
    general: {
      theme: 'system',
      language: 'en',
      wordsPerSession: 10,
      srsMethod: 'default',
    },
    ai: {
      apiUrl: 'https://api.openai.com/v1/',
      apiKey: '',
      modelName: 'gpt-4o-mini',
    },
    advanced: {
      debugMode: false,
    },
  };
}

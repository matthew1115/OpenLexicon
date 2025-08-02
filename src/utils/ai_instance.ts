import AIConnect from './ai_connect';
import { getSettings } from './settings';

/**
 * Create and initialize an AI instance with current settings
 * @returns Initialized AI instance or null if no API key is configured
 */
export function createAIInstance(): AIConnect | null {
  const settings = getSettings();
  
  if (!settings?.ai.apiKey) {
    console.warn('No AI API key configured. Please set up your API key in settings.');
    return null;
  }

  const ai = new AIConnect();
  
  try {
    ai.initialize(
      settings.ai.apiKey,
      settings.ai.apiUrl,
      settings.ai.modelName
    );
    return ai;
  } catch (error) {
    console.error('Failed to initialize AI:', error);
    return null;
  }
}

/**
 * Check if AI is properly configured
 * @returns True if API key is set in settings
 */
export function isAIConfigured(): boolean {
  const settings = getSettings();
  return !!(settings?.ai.apiKey);
}

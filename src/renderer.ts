/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import 'mdui/mdui.css';
import 'mdui';

import { createWelcomePage } from './components/welcome';

// Apply mdui theme from settings
function applyTheme() {
  let theme = 'auto';
  try {
    // @ts-ignore
    const settingsManager = window.SettingsManager ? new window.SettingsManager() : null;
    if (settingsManager) {
      const settings = settingsManager.getCurrentSettings();
      theme = settings.theme || 'auto';
    }
  } catch (e) {
    // fallback to auto
  }
  const html = document.documentElement;
  html.classList.remove('mdui-theme-dark', 'mdui-theme-light', 'mdui-theme-auto');
  html.classList.add(`mdui-theme-${theme}`);
}
applyTheme();

function setCardContent(element: HTMLElement) {
  const cardContent = document.getElementById('card-content');
  if (cardContent) {
    cardContent.innerHTML = '';
    cardContent.appendChild(element);
  }
}

// IPC handlers removed - settings and about now open in separate windows

// Place welcome page inside the card
setCardContent(createWelcomePage());


export { setCardContent };

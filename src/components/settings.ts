// Settings page component using MDUI and Tailwind CSS, with innerHTML for readability

import { SettingsManager } from "../utils/settings";

export function createSettingsPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mdui-container mx-auto p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800';
  container.innerHTML = `
    <h2 class="mdui-typo-title text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h2>
    <div class="mdui-row flex items-center mb-4">
      <label class="mdui-col text-gray-700 dark:text-gray-300 mr-4" for="settings-darkmode">Dark Mode</label>
      <input type="checkbox" class="mdui-switch" id="settings-darkmode">
    </div>
    <div class="mdui-row flex items-center mb-4">
      <label class="mdui-col text-gray-700 dark:text-gray-300 mr-4" for="settings-language">Language</label>
      <select class="mdui-select px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" id="settings-language">
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
    <button class="mdui-btn mdui-color-theme px-6 py-2 rounded text-white font-semibold mt-6" id="settings-save">Save Settings</button>
  `;

  // Hook up with SettingsManager
  const manager = new (window as any).SettingsManager();

  // Load current settings and update UI
  manager.loadSettings().then(() => {
    const settings = manager.getCurrentSettings();
    const darkMode = container.querySelector<HTMLInputElement>("#settings-darkmode");
    const language = container.querySelector<HTMLSelectElement>("#settings-language");
    if (darkMode) darkMode.checked = settings.theme === "dark";
    if (language) language.value = settings.language || "en";
  });

  // Save button handler
  container.querySelector('#settings-save')?.addEventListener('click', async () => {
    const darkMode = container.querySelector<HTMLInputElement>("#settings-darkmode");
    const language = container.querySelector<HTMLSelectElement>("#settings-language");
    const theme = darkMode?.checked ? "dark" : "light";
    await manager.set({ ...manager.getCurrentSettings(), theme, language: language?.value });
    alert("Settings saved!");
  });

  return container;
}

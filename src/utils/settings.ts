import { ipcRenderer } from 'electron';

interface Settings {
    apiKey: string;
    apiUrl: string;
    modelName: string;
    theme?: string;
    language?: string;
    difficultyAlgorithm?: string;
    maxWords?: number;
    debugMode?: boolean;
    cacheSize?: number;
    requestTimeout?: number;
}

interface DOMElements {
    apiUrlInput: HTMLInputElement;
    modelNameInput: HTMLInputElement;
    apiKeyInput: HTMLInputElement;
    themeSelect?: HTMLSelectElement;
    languageSelect?: HTMLSelectElement;
    difficultyAlgorithmSelect?: HTMLSelectElement;
    maxWordsInput?: HTMLInputElement;
    debugModeSelect?: HTMLSelectElement;
    cacheSizeInput?: HTMLInputElement;
    requestTimeoutInput?: HTMLInputElement;
    testConnectionBtn: HTMLButtonElement;
    saveSettingsBtn: HTMLButtonElement;
    connectionStatus: HTMLElement;
    statusIndicator?: HTMLElement;
    statusText?: HTMLElement;
}

class SettingsManager {
    private currentSettings: Settings;
    private dom: DOMElements;
    private isInitialized: boolean;

    constructor() {
        this.currentSettings = {} as Settings;
        this.dom = {} as DOMElements;
        this.isInitialized = false;
    }

    // Initialize the settings manager
    init(): void {
        if (this.isInitialized) return;
        
        this.cacheDOMElements();
        this.setupEventHandlers();
        this.loadSettings();
        this.setupIPCHandlers();
        
        this.isInitialized = true;
        console.log('Settings manager initialized');
    }

    // Cache DOM elements for better performance
    cacheDOMElements(): void {
        this.dom = {
            // AI Configuration elements
            apiUrlInput: document.getElementById('apiUrl') as HTMLInputElement,
            modelNameInput: document.getElementById('modelName') as HTMLInputElement,
            apiKeyInput: document.getElementById('apiKey') as HTMLInputElement,
            
            // General settings elements
            themeSelect: document.getElementById('theme') as HTMLSelectElement,
            languageSelect: document.getElementById('language') as HTMLSelectElement,
            difficultyAlgorithmSelect: document.getElementById('difficultyAlgorithm') as HTMLSelectElement,
            maxWordsInput: document.getElementById('maxWords') as HTMLInputElement,
            
            // Advanced settings elements
            debugModeSelect: document.getElementById('debugMode') as HTMLSelectElement,
            cacheSizeInput: document.getElementById('cacheSize') as HTMLInputElement,
            requestTimeoutInput: document.getElementById('requestTimeout') as HTMLInputElement,
            
            // Button elements
            testConnectionBtn: document.getElementById('testConnection') as HTMLButtonElement,
            saveSettingsBtn: document.getElementById('saveSettings') as HTMLButtonElement,
            
            // Status elements
            connectionStatus: document.getElementById('connectionStatus') as HTMLElement,
            statusIndicator: document.querySelector('.status-indicator') as HTMLElement,
            statusText: document.querySelector('.status-text') as HTMLElement
        };
    }

    // Set up event handlers
    setupEventHandlers(): void {
        // Save settings button handler
        this.dom.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
        });

        // Test connection button handler
        this.dom.testConnectionBtn.addEventListener('click', () => {
            this.testAPIConnection();
        });

        // Auto-save on input changes (with debounce)
        const inputs = [this.dom.apiUrlInput, this.dom.modelNameInput, this.dom.apiKeyInput];
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                this.validateInputs();
            }, 300) as EventListener);
        });
    }

    // Set up IPC handlers for communication with main process
    setupIPCHandlers(): void {
        // Handle settings data from main process
        ipcRenderer.on('settings-data', (event, settings: Settings) => {
            this.currentSettings = settings;
            this.populateForm(settings);
        });

        // Handle settings saved confirmation
        ipcRenderer.on('settings-saved', () => {
            this.showConnectionStatus('Settings saved successfully!', 'success');
        });

        // Handle AI connection test results
        ipcRenderer.on('ai-connection-result', (event, result: { success: boolean; error?: string }) => {
            this.dom.testConnectionBtn.disabled = false;
            if (result.success) {
                this.showConnectionStatus('Connection successful!', 'success');
            } else {
                this.showConnectionStatus(result.error || 'Connection failed', 'error');
            }
        });

        // Handle show settings event from main process (no longer needed but kept for compatibility)
        ipcRenderer.on('show-settings', () => {
            // Settings window is now handled by main process
            console.log('Settings window should be opened by main process');
        });
    }

    // Load settings from main process
    loadSettings(): void {
        ipcRenderer.send('get-settings');
    }

    // Save settings to main process
    saveSettings(): void {
        const settings = this.getFormData();
        
        if (!this.validateSettings(settings)) {
            this.showConnectionStatus('Please fill in all required fields', 'error');
            return;
        }

        ipcRenderer.send('save-settings', settings);
        this.currentSettings = settings;
    }

    // Get form data as settings object
    getFormData(): Settings {
        return {
            // AI Configuration
            apiKey: this.dom.apiKeyInput.value.trim(),
            apiUrl: this.dom.apiUrlInput.value.trim() || 'https://api.openai.com/v1',
            modelName: this.dom.modelNameInput.value.trim() || 'gpt-4o-mini',
            
            // General Settings
            theme: this.dom.themeSelect?.value || 'auto',
            language: this.dom.languageSelect?.value || 'en',
            difficultyAlgorithm: this.dom.difficultyAlgorithmSelect?.value || 'spaced',
            maxWords: parseInt(this.dom.maxWordsInput?.value) || 20,
            
            // Advanced Settings
            debugMode: this.dom.debugModeSelect?.value === 'true',
            cacheSize: parseInt(this.dom.cacheSizeInput?.value) || 100,
            requestTimeout: parseInt(this.dom.requestTimeoutInput?.value) || 30
        };
    }

    // Populate form with settings data
    populateForm(settings: Settings): void {
        // AI Configuration
        this.dom.apiKeyInput.value = settings.apiKey || '';
        this.dom.apiUrlInput.value = settings.apiUrl || 'https://api.openai.com/v1';
        this.dom.modelNameInput.value = settings.modelName || 'gpt-4o-mini';
        
        // General Settings
        if (this.dom.themeSelect) this.dom.themeSelect.value = settings.theme || 'auto';
        if (this.dom.languageSelect) this.dom.languageSelect.value = settings.language || 'en';
        if (this.dom.difficultyAlgorithmSelect) this.dom.difficultyAlgorithmSelect.value = settings.difficultyAlgorithm || 'spaced';
        if (this.dom.maxWordsInput) this.dom.maxWordsInput.value = String(settings.maxWords || 20);
        
        // Advanced Settings
        if (this.dom.debugModeSelect) this.dom.debugModeSelect.value = settings.debugMode ? 'true' : 'false';
        if (this.dom.cacheSizeInput) this.dom.cacheSizeInput.value = String(settings.cacheSize || 100);
        if (this.dom.requestTimeoutInput) this.dom.requestTimeoutInput.value = String(settings.requestTimeout || 30);
    }

    // Validate settings object
    validateSettings(settings: Settings): boolean {
        return !!(settings.apiKey && settings.apiKey.length > 0 &&
               settings.apiUrl && settings.apiUrl.length > 0 &&
               settings.modelName && settings.modelName.length > 0);
    }

    // Validate inputs and update UI accordingly
    validateInputs(): void {
        const settings = this.getFormData();
        const isValid = this.validateSettings(settings);
        
        // Enable/disable buttons based on validation
        this.dom.saveSettingsBtn.disabled = !isValid;
        this.dom.testConnectionBtn.disabled = !settings.apiKey;
        
        // Update input styling
        this.updateInputValidation();
    }

    // Update input validation styling
    updateInputValidation(): void {
        const inputs = [
            { element: this.dom.apiKeyInput, required: true },
            { element: this.dom.apiUrlInput, required: true },
            { element: this.dom.modelNameInput, required: true }
        ];

        inputs.forEach(({ element, required }) => {
            if (required && !element.value.trim()) {
                element.classList.add('error');
            } else {
                element.classList.remove('error');
            }
        });
    }

    // Test API connection
    testAPIConnection(): void {
        const settings = this.getFormData();

        if (!settings.apiKey) {
            this.showConnectionStatus('Please enter an API key first', 'error');
            return;
        }

        this.showConnectionStatus('Testing connection...', 'loading');
        this.dom.testConnectionBtn.disabled = true;

        // Test the actual API connection
        ipcRenderer.send('test-ai-connection', settings);
    }

    // Show connection status message
    showConnectionStatus(message: string, type: string): void {
        const statusText = this.dom.connectionStatus.querySelector('.status-text') as HTMLElement;
        
        statusText.textContent = message;
        this.dom.connectionStatus.className = `connection-status ${type}`;
        this.dom.connectionStatus.classList.remove('hidden');

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.dom.connectionStatus.classList.add('hidden');
            }, 3000);
        }
    }

    // Show settings screen (simplified for dedicated window)
    show(): void {
        // Focus on first input
        this.dom.apiUrlInput.focus();
        
        // Load current settings
        this.loadSettings();
    }

    // Hide settings screen (simplified for dedicated window)
    hide(): void {
        // Clear any status messages
        this.dom.connectionStatus.classList.add('hidden');
        
        // In a dedicated window, we would typically close the window
        // This method is kept for compatibility
    }

    // Check if settings are configured
    isConfigured(): boolean {
        return !!(this.currentSettings.apiKey && 
               this.currentSettings.apiKey.length > 0);
    }

    // Get current settings
    getCurrentSettings(): Settings {
        return { ...this.currentSettings };
    }

    // Reset settings to defaults
    resetToDefaults(): void {
        const defaultSettings: Settings = {
            apiKey: '',
            apiUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4o-mini'
        };
        
        this.populateForm(defaultSettings);
        this.validateInputs();
    }

    // Import settings from JSON
    importSettings(settingsJson: string): void {
        try {
            const settings = JSON.parse(settingsJson);
            this.populateForm(settings);
            this.validateInputs();
            this.showConnectionStatus('Settings imported successfully', 'success');
        } catch (error) {
            this.showConnectionStatus('Invalid settings format', 'error');
        }
    }

    // Export settings to JSON
    exportSettings(): string {
        const settings = this.getFormData();
        // Don't export API key for security
        const exportSettings = {
            apiUrl: settings.apiUrl,
            modelName: settings.modelName
        };
        return JSON.stringify(exportSettings, null, 2);
    }

    // Utility: Debounce function
    debounce(func: Function, wait: number): Function {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cleanup method
    destroy(): void {
        if (this.isInitialized) {
            // Remove event listeners
            this.dom.saveSettingsBtn.removeEventListener('click', this.saveSettings);
            this.dom.testConnectionBtn.removeEventListener('click', this.testAPIConnection);
            
            // Remove IPC listeners
            ipcRenderer.removeAllListeners('settings-data');
            ipcRenderer.removeAllListeners('settings-saved');
            ipcRenderer.removeAllListeners('ai-connection-result');
            ipcRenderer.removeAllListeners('show-settings');
            
            this.isInitialized = false;
            console.log('Settings manager destroyed');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}

// Global instance for direct use
declare global {
    interface Window {
        SettingsManager: typeof SettingsManager;
    }
}

window.SettingsManager = SettingsManager;

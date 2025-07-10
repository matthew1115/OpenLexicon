const { ipcRenderer } = require('electron');

class SettingsManager {
    constructor() {
        this.currentSettings = {};
        this.dom = {};
        this.isInitialized = false;
    }

    // Initialize the settings manager
    init() {
        if (this.isInitialized) return;
        
        this.cacheDOMElements();
        this.setupEventHandlers();
        this.loadSettings();
        this.setupIPCHandlers();
        
        this.isInitialized = true;
        console.log('Settings manager initialized');
    }

    // Cache DOM elements for better performance
    cacheDOMElements() {
        this.dom = {
            // Input elements
            apiUrlInput: document.getElementById('apiUrl'),
            modelNameInput: document.getElementById('modelName'),
            apiKeyInput: document.getElementById('apiKey'),
            
            // Button elements
            testConnectionBtn: document.getElementById('testConnection'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            
            // Status elements
            connectionStatus: document.getElementById('connectionStatus'),
            statusIndicator: document.querySelector('.status-indicator'),
            statusText: document.querySelector('.status-text')
        };
    }

    // Set up event handlers
    setupEventHandlers() {
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
            }, 300));
        });
    }

    // Set up IPC handlers for communication with main process
    setupIPCHandlers() {
        // Handle settings data from main process
        ipcRenderer.on('settings-data', (event, settings) => {
            this.currentSettings = settings;
            this.populateForm(settings);
        });

        // Handle settings saved confirmation
        ipcRenderer.on('settings-saved', () => {
            this.showConnectionStatus('Settings saved successfully!', 'success');
        });

        // Handle AI connection test results
        ipcRenderer.on('ai-connection-result', (event, result) => {
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
    loadSettings() {
        ipcRenderer.send('get-settings');
    }

    // Save settings to main process
    saveSettings() {
        const settings = this.getFormData();
        
        if (!this.validateSettings(settings)) {
            this.showConnectionStatus('Please fill in all required fields', 'error');
            return;
        }

        ipcRenderer.send('save-settings', settings);
        this.currentSettings = settings;
    }

    // Get form data as settings object
    getFormData() {
        return {
            apiKey: this.dom.apiKeyInput.value.trim(),
            apiUrl: this.dom.apiUrlInput.value.trim() || 'https://api.openai.com/v1',
            modelName: this.dom.modelNameInput.value.trim() || 'gpt-4o-mini'
        };
    }

    // Populate form with settings data
    populateForm(settings) {
        this.dom.apiKeyInput.value = settings.apiKey || '';
        this.dom.apiUrlInput.value = settings.apiUrl || 'https://api.openai.com/v1';
        this.dom.modelNameInput.value = settings.modelName || 'gpt-4o-mini';
    }

    // Validate settings object
    validateSettings(settings) {
        return settings.apiKey && settings.apiKey.length > 0 &&
               settings.apiUrl && settings.apiUrl.length > 0 &&
               settings.modelName && settings.modelName.length > 0;
    }

    // Validate inputs and update UI accordingly
    validateInputs() {
        const settings = this.getFormData();
        const isValid = this.validateSettings(settings);
        
        // Enable/disable buttons based on validation
        this.dom.saveSettingsBtn.disabled = !isValid;
        this.dom.testConnectionBtn.disabled = !settings.apiKey;
        
        // Update input styling
        this.updateInputValidation();
    }

    // Update input validation styling
    updateInputValidation() {
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
    testAPIConnection() {
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
    showConnectionStatus(message, type) {
        const statusText = this.dom.connectionStatus.querySelector('.status-text');
        
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
    show() {
        // Focus on first input
        this.dom.apiUrlInput.focus();
        
        // Load current settings
        this.loadSettings();
    }

    // Hide settings screen (simplified for dedicated window)
    hide() {
        // Clear any status messages
        this.dom.connectionStatus.classList.add('hidden');
        
        // In a dedicated window, we would typically close the window
        // This method is kept for compatibility
    }

    // Check if settings are configured
    isConfigured() {
        return this.currentSettings.apiKey && 
               this.currentSettings.apiKey.length > 0;
    }

    // Get current settings
    getCurrentSettings() {
        return { ...this.currentSettings };
    }

    // Reset settings to defaults
    resetToDefaults() {
        const defaultSettings = {
            apiKey: '',
            apiUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4o-mini'
        };
        
        this.populateForm(defaultSettings);
        this.validateInputs();
    }

    // Import settings from JSON
    importSettings(settingsJson) {
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
    exportSettings() {
        const settings = this.getFormData();
        // Don't export API key for security
        const exportSettings = {
            apiUrl: settings.apiUrl,
            modelName: settings.modelName
        };
        return JSON.stringify(exportSettings, null, 2);
    }

    // Utility: Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cleanup method
    destroy() {
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
window.SettingsManager = SettingsManager;

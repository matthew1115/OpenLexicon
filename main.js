const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const FileLoader = require('./load_file');
const Store = require('electron-store');
const AIConnect = require('./ai_connect');

// Initialize settings store
const store = new Store();

// Initialize AI connection
const aiConnect = new AIConnect();

// Keep a global reference of the window object
let mainWindow;
let settingsWindow;
let fileLoader;

function createMenu() {
    const template = [
        fileLoader.getFilesMenuTemplate(),
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Preferences',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        // Open settings in a new window
                        createSettingsWindow();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Initialize the file loader with the main window
    fileLoader = new FileLoader(mainWindow);    // Initialize AI connection with saved settings
    const savedApiKey = store.get('apiKey');
    const savedApiUrl = store.get('apiUrl', 'https://api.openai.com/v1');
    const savedModelName = store.get('modelName', 'gpt-4o-mini');
    
    if (savedApiKey) {
        try {
            aiConnect.initialize(savedApiKey, savedApiUrl, savedModelName);
            console.log('AI connection initialized with saved settings');
        } catch (error) {
            console.error('Failed to initialize AI connection:', error);
        }
    }

    // Set up IPC handlers
    setupIpcHandlers();
    setupSettingsIpcHandlers();

    mainWindow.loadFile('index.html');

    // Create the application menu
    createMenu();

    // Open DevTools for development (remove in production)
    //   mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        // Dereference the window object and file loader
        mainWindow = null;
        fileLoader = null;
    });
}

function createSettingsWindow() {
    // Don't create multiple settings windows
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        parent: mainWindow,
        modal: false,
        title: 'OpenLexicon Settings',
        resizable: true,
        minimizable: false,
        maximizable: false
    });

    settingsWindow.loadFile('settings.html');

    // Set up IPC handlers for settings window
    setupSettingsIpcHandlers();

    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });
}

function setupIpcHandlers() {
    // Handle open wordbank request
    ipcMain.on('open-wordbank', async () => {
        try {
            await fileLoader.openWordbank();
        } catch (error) {
            console.error('Error opening wordbank:', error);
            mainWindow.webContents.send('wordbank-error', error.message);
        }
    });

    // Handle resume wordbank request
    ipcMain.on('resume-wordbank', async () => {
        try {
            await fileLoader.resumeLastWordbank();
        } catch (error) {
            console.error('Error resuming wordbank:', error);
            mainWindow.webContents.send('wordbank-error', error.message);
        }
    });

    // Handle check previous wordbank request
    ipcMain.on('check-previous-wordbank', async () => {
        try {
            const isValid = await fileLoader.isLastWordbankValid();
            if (isValid) {
                mainWindow.webContents.send('previous-wordbank-available');
            } else {
                mainWindow.webContents.send('no-previous-wordbank');
            }
        } catch (error) {
            console.error('Error checking previous wordbank:', error);
            mainWindow.webContents.send('no-previous-wordbank');
        }
    });
}

function setupSettingsIpcHandlers() {
    // Settings handlers
    ipcMain.on('get-settings', (event) => {
        const settings = {
            apiKey: store.get('apiKey', ''),
            apiUrl: store.get('apiUrl', 'https://api.openai.com/v1'),
            modelName: store.get('modelName', 'gpt-4o-mini')
        };
        
        // Send to settings window if it exists, otherwise to main window
        if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.webContents.send('settings-data', settings);
        } else {
            event.reply('settings-data', settings);
        }
    });

    ipcMain.on('save-settings', (event, settings) => {
        store.set('apiKey', settings.apiKey);
        store.set('apiUrl', settings.apiUrl);
        store.set('modelName', settings.modelName);
        
        // Reinitialize AI connection with new settings
        if (settings.apiKey) {
            try {
                aiConnect.initialize(settings.apiKey, settings.apiUrl, settings.modelName);
            } catch (error) {
                console.error('Failed to initialize AI connection:', error);
            }
        }
        
        // Send confirmation to settings window if it exists, otherwise to main window
        if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.webContents.send('settings-saved');
        } else {
            event.reply('settings-saved');
        }
    });

    // AI functionality handlers
    ipcMain.on('test-ai-connection', async (event, settings) => {
        try {
            if (!settings.apiKey) {
                const result = { success: false, error: 'API key is required' };
                if (settingsWindow && !settingsWindow.isDestroyed()) {
                    settingsWindow.webContents.send('ai-connection-result', result);
                } else {
                    event.reply('ai-connection-result', result);
                }
                return;
            }

            aiConnect.initialize(settings.apiKey, settings.apiUrl, settings.modelName);
            const isConnected = await aiConnect.testConnection();

            const result = {
                success: isConnected,
                error: isConnected ? null : 'Connection failed'
            };

            if (settingsWindow && !settingsWindow.isDestroyed()) {
                settingsWindow.webContents.send('ai-connection-result', result);
            } else {
                event.reply('ai-connection-result', result);
            }
        } catch (error) {
            const result = {
                success: false,
                error: error.message
            };

            if (settingsWindow && !settingsWindow.isDestroyed()) {
                settingsWindow.webContents.send('ai-connection-result', result);
            } else {
                event.reply('ai-connection-result', result);
            }
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    // Re-create a window when the app is activated
    if (mainWindow === null) {
        createWindow();
    }
});
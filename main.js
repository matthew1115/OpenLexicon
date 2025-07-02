const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const FileLoader = require('./load_file');

// Keep a global reference of the window object
let mainWindow;
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
    fileLoader = new FileLoader(mainWindow);

    // Set up IPC handlers
    setupIpcHandlers();

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
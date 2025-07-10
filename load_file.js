const { dialog, app } = require('electron');
const Database = require('better-sqlite3');
const Store = require('electron-store');

class FileLoader {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.db = null;
        this.store = new Store({
            name: 'lexicon_data',
            cwd: app.getPath('userData'),
        });
    }

    // Open sqlite database
    async openDatabase(dbPath) {
        try {
            this.db = new Database(dbPath, { 
                readonly: false,
                fileMustExist: false,
                timeout: 5000,
                verbose: console.log
            });
            console.log('Database opened successfully');
        } catch (err) {
            console.error('Error opening database:', err);
            throw err;
        }
    }

    // Save the wordbank path to electron-store
    async saveWordbankPath(filePath) {
        try {
            this.store.set('lastWordbankPath', filePath);
            console.log('Saved wordbank path:', filePath);
        } catch (error) {
            console.error('Error saving wordbank path:', error);
        }
    }

    // Get the last used wordbank path from electron-store
    async getLastWordbankPath() {
        try {
            const lastPath = this.store.get('lastWordbankPath', null);
            return lastPath || null;
        } catch (error) {
            console.log('No previous wordbank path found');
            return null;
        }
    }

    // Check if the last wordbank file still exists
    async isLastWordbankValid() {
        const lastPath = await this.getLastWordbankPath();
        if (!lastPath) return false;
        const fs = require('fs').promises;
        try {
            await fs.access(lastPath);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Open sqlite database file (wordbank) dialog
    async openWordbank() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'SQLite Database Files', extensions: ['db', 'sqlite', 'sqlite3'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            title: 'Select Wordbank Database'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('Selected wordbank db:', filePath);
            // Attempt to open the sqlite database
            try {
                await this.openDatabase(filePath);
                console.log('Wordbank database opened successfully');
            } catch (err) {
                console.error('Error opening wordbank db:', err);
                this.mainWindow.webContents.send('wordbank-error', err.message);
                return null;
            }
            // Save this path for future use
            await this.saveWordbankPath(filePath);
            // Notify renderer
            this.mainWindow.webContents.send('wordbank-selected', filePath);
            return filePath;
        }
        return null;
    }

    // Resume with last wordbank
    async resumeLastWordbank() {
        const lastPath = await this.getLastWordbankPath();
        if (lastPath && await this.isLastWordbankValid()) {
            console.log('Resuming with wordbank:', lastPath);
            // Open the sqlite database
            try {
                await this.openDatabase(lastPath);
                console.log('Wordbank database resumed successfully');
            } catch (err) {
                console.error('Error opening wordbank db:', err);
                this.mainWindow.webContents.send('wordbank-error', err.message);
                return null;
            }
            this.mainWindow.webContents.send('wordbank-selected', lastPath);
            return lastPath;
        } else {
            console.log('No valid previous wordbank found');
            this.mainWindow.webContents.send('no-previous-wordbank');
            return null;
        }
    }

    async openFile() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'Text Files', extensions: ['txt', 'md'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('Selected file:', filePath);

            // Send the file path to the renderer process
            this.mainWindow.webContents.send('file-selected', filePath);
            return filePath;
        }
        return null;
    }

    // Method to create the Files menu template
    getFilesMenuTemplate() {
        return {
            label: 'Files',
            submenu: [
                {
                    label: 'Open Wordbank...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        await this.openWordbank();
                    }
                },
                {
                    label: 'Resume Last Wordbank',
                    accelerator: 'CmdOrCtrl+R',
                    click: async () => {
                        await this.resumeLastWordbank();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'Ctrl+Q',
                    click: () => {
                        const { app } = require('electron');
                        app.quit();
                    }
                }
            ]
        };
    }
}

module.exports = FileLoader;

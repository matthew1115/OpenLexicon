const { dialog, app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

class FileLoader {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.configDir = path.join(app.getPath('userData'), '.config');
        this.configFile = path.join(this.configDir, '.lexicon_data');
    }

    // Ensure config directory exists
    async ensureConfigDir() {
        try {
            await fs.mkdir(this.configDir, { recursive: true });
        } catch (error) {
            console.error('Error creating config directory:', error);
        }
    }

    // Save the wordbank path to config file
    async saveWordbankPath(filePath) {
        try {
            await this.ensureConfigDir();
            const config = { lastWordbankPath: filePath };
            await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
            console.log('Saved wordbank path:', filePath);
        } catch (error) {
            console.error('Error saving wordbank path:', error);
        }
    }

    // Get the last used wordbank path
    async getLastWordbankPath() {
        try {
            const configData = await fs.readFile(this.configFile, 'utf8');
            const config = JSON.parse(configData);
            return config.lastWordbankPath || null;
        } catch (error) {
            console.log('No previous wordbank path found');
            return null;
        }
    }

    // Check if the last wordbank file still exists
    async isLastWordbankValid() {
        const lastPath = await this.getLastWordbankPath();
        if (!lastPath) return false;
        
        try {
            await fs.access(lastPath);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Open wordbank file dialog
    async openWordbank() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            title: 'Select Wordbank File'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('Selected wordbank:', filePath);
            
            // Save this path for future use
            await this.saveWordbankPath(filePath);
            
            // Send the file path to the renderer process
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

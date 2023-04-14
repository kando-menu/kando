// Modules to control application life and create native browser window
const electron = require('electron');
const path = require('path');

const gotTheLock = electron.app.requestSingleInstanceLock();

let mainWindow;

if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on('second-instance', (event, commandLine, workingDirectory) => {
    mainWindow.show();
  });


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electron.app.whenReady().then(() => {
    let mainScreen = electron.screen.getPrimaryDisplay();

    mainWindow = new electron.BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js')
      },
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      width: mainScreen.workAreaSize.width,
      height: mainScreen.workAreaSize.height,
      type: 'dock',
      show: false
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');

    // mainWindow.webContents.openDevTools()
  });

  electron.app.on('will-quit', () => {});

  electron.ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });
}

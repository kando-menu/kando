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
    // electron.globalShortcut.register('Alt+CommandOrControl+I', () => {
    //   mainWindow.show();
    // });

    let mainScreen = electron.screen.getPrimaryDisplay();

    console.log(mainScreen.workAreaSize);


    mainWindow = new electron.BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js')
      },
      transparent: true,
      resizable: false,
      frame: false,
      alwaysOnTop: true,
      width: mainScreen.workAreaSize.width,
      height: mainScreen.workAreaSize.height,
      type: 'dock',
      show: false
    });

    mainWindow.once('ready-to-show', () => {
      let pos = electron.screen.getCursorScreenPoint();
      mainWindow.webContents.send('show-menu', pos);
      mainWindow.show();
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');
  });


  // electron.app.on('window-all-closed', function() {
  //   app.quit();
  // });

  electron.ipcMain.on('show-dev-tools', () => {
    mainWindow.webContents.openDevTools();
  });

  electron.ipcMain.on('hide-window', () => {
    electron.app.quit();
    // mainWindow.hide();
  });

  electron.ipcMain.on('item-selected', () => {
    console.log('foo');
  });

  electron.app.on('will-quit', () => {
    console.log('Bye!');
  });
}

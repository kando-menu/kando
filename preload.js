const {ipcRenderer, contextBridge} = require('electron');

// Expose protected methods off of window (ie.
// window.api.sendToA) in order to use ipcRenderer
// without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  hideWindow: function() {
    ipcRenderer.send('hide-window');
  },
  // receiveFromD: function(func) {
  //   { ipcRenderer.on('D', (event, ...args) => func(event, ...args)); }
  // }
});
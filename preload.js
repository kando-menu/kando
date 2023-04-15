const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
  hideWindow: function() {
    ipcRenderer.send('hide-window');
  },
  showDevTools: function() {
    ipcRenderer.send('show-dev-tools');
  },
  itemSelected: function() {
    ipcRenderer.send('item-selected');
  },
  showMenu: function(func) {
    ipcRenderer.on('show-menu', (event, ...args) => func(event, ...args));
  }
});
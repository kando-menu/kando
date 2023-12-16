//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, BrowserWindow, ipcMain, shell, Tray, Menu, app } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { Notification } from 'electron';

import { Backend, getBackend } from './backends';
import { INode, IMenu, IMenuSettings, IAppSettings, IKeySequence } from '../common';
import { Settings, DeepReadonly } from './settings';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

/**
 * This class contains the main host process logic of Kando. It is responsible for
 * creating the transparent window and for handling IPC communication with the renderer
 * process. It also creates the backend which is responsible for all low-level system
 * interaction.
 */
export class KandoApp {
  // The backend is responsible for all the system interaction. It is implemented
  // differently for each platform.
  private backend: Backend = getBackend();

  // The window is the main window of the application. It is a transparent window
  // which covers the whole screen. It is always on top and has no frame. It is used
  // to display the pie menu.
  private window: BrowserWindow;

  // This timeout is used to hide the window after the fade-out animation.
  private hideTimeout: NodeJS.Timeout;

  // This is the tray icon which is displayed in the system tray. In the future it
  // will be possible to disable this icon.
  private tray: Tray;

  // This contains the last menu which was shown. It is used to execute the selected
  // action.
  private lastVisibleMenu?: DeepReadonly<IMenu>;

  private appSettings = new Settings<IAppSettings>({
    file: 'config.json',
    directory: app.getPath('userData'),
    defaults: {
      menuTheme: 'none',
      editorTheme: 'none',
    },
  });

  // This is the settings object which is used to store the settings in the
  // user's home directory.
  private menuSettings = new Settings<IMenuSettings>({
    file: 'menus.json',
    directory: app.getPath('userData'),
    defaults: {
      menus: [this.createExampleMenu()],
    },
  });

  /** This is called when the app is started. It initializes the backend and the window. */
  public async init() {
    // Bail out if the backend is not available.
    if (this.backend === null) {
      throw new Error('No backend found.');
    }

    // Initialize the backend, the window and the IPC communication to the renderer
    // process.
    await this.backend.init();
    await this.initWindow();
    this.initRendererIPC();

    // Bind the shortcuts for all menus.
    await this.bindShortcuts();

    // Add a tray icon to the system tray. This icon can be used to open the pie menu
    // and to quit the application.
    this.tray = new Tray(path.join(__dirname, require('../../assets/icons/icon.png')));
    this.tray.setToolTip('Kando');
    this.updateTrayMenu();

    // When the menu settings change, we need to rebind the shortcuts and update the
    // tray menu.
    this.menuSettings.onChange('menus', async () => {
      await this.bindShortcuts();
      this.updateTrayMenu();
    });
  }

  /** This is called when the app is closed. It will unbind all shortcuts. */
  public async quit() {
    if (this.backend != null) {
      await this.backend.unbindAllShortcuts();
    }

    this.appSettings.close();
    this.menuSettings.close();
  }

  /**
   * This is usually called when the user presses the shortcut. However, it can also be
   * called for other reasons, e.g. when the user runs the app a second time. It will get
   * the current window and pointer position and send them to the renderer process.
   */
  public showMenu(menu: DeepReadonly<IMenu>) {
    this.backend
      .getWMInfo()
      .then((info) => {
        // Abort any ongoing hide animation.
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }

        // Move the window to the monitor which contains the pointer.
        const workarea = screen.getDisplayNearestPoint({
          x: info.pointerX,
          y: info.pointerY,
        }).workArea;

        this.window.setBounds({
          x: workarea.x,
          y: workarea.y,
          width: workarea.width + 1,
          height: workarea.height + 1,
        });

        if (info.windowClass) {
          console.log('Currently focused window: ' + info.windowClass);
        } else {
          console.log('Currently no window is focused.');
        }

        // Store a reference to the menu so that we can execute the selected action
        // later. Then send the menu to the renderer process.
        this.lastVisibleMenu = menu;
        this.window.webContents.send('show-menu', this.lastVisibleMenu.nodes, {
          x: info.pointerX - workarea.x,
          y: info.pointerY - workarea.y,
        });

        this.window.show();

        // There seems to be an issue with GNOME Shell 44.1 where the window does not
        // get focus when it is shown. This is a workaround for that issue.
        setTimeout(() => {
          this.window.focus();
        }, 100);
      })
      .catch((err) => {
        console.error('Failed to show menu: ' + err);
      });
  }

  /**
   * This creates the main window. It is a transparent window which covers the whole
   * screen. It is not shown in any task bar and has no frame. It is used to display the
   * pie menu and potentially other UI elements such as the menu editor.
   */
  private async initWindow() {
    const display = screen.getPrimaryDisplay();

    const window = new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      frame: false,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width + 1,
      height: display.workArea.height + 1,
      type: this.backend.getWindowType(),
      show: false,
    });

    await window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    this.window = window;
  }

  /**
   * Setup IPC communication with the renderer process. See ../renderer/preload.ts for
   * more information on the exposed functionality.
   */
  private initRendererIPC() {
    // Show the web developer tools if requested.
    ipcMain.on('show-dev-tools', () => {
      this.window.webContents.openDevTools();
    });

    // Print a message to the console of the host process.
    ipcMain.on('log', (event, message) => {
      console.log(message);
    });

    // Simulate a key press.
    ipcMain.on('simulate-keys', (event, keys) => {
      this.window.hide();
      this.backend.simulateKeys(keys);
    });

    // Move the mouse pointer.
    ipcMain.on('move-pointer', (event, dist) => {
      this.backend.movePointer(Math.floor(dist.x), Math.floor(dist.y));
    });

    // Open an URI with the default application.
    ipcMain.on('open-uri', (event, uri) => {
      this.window.hide();
      shell.openExternal(uri);
    });

    // Run a shell command.
    ipcMain.on('run-command', (event, command) => {
      this.window.hide();
      this.exec(command);
    });

    // Print some messages when the user hovers or selects an item.
    ipcMain.on('hover-item', (event, path) => {
      console.log('Hover item: ' + path);
    });

    // We do not hide the window immediately when the user selects an item. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('select-item', (event, path) => {
      // Also wait with the execution of the selected action until the fade-out
      // animation is finished to make sure that any resulting events (such as virtual key
      // presses) are not captured by the window.
      this.hideTimeout = setTimeout(() => {
        console.log('Select item: ' + path);

        this.window.hide();
        this.hideTimeout = null;

        // Find the selected item.
        const node = this.getNodeAtPath(this.lastVisibleMenu.nodes, path);

        // We hard-code some actions here. In the future, we will have a more
        // sophisticated action system.

        // If the node is a command action, we execute the command.
        if (node.type === 'command') {
          interface INodeData {
            command: string;
          }
          this.exec((node.data as INodeData).command);
        }

        // If the node is an URI action, we open the URI.
        if (node.type === 'uri') {
          interface INodeData {
            uri: string;
          }
          shell.openExternal((node.data as INodeData).uri);
        }

        // If the node is a hotkey action, we simulate the key press. For now, the
        // hotkey is a string which is composed of key names separated by a plus sign.
        // All keys will be pressed and then released again.
        if (node.type === 'hotkey') {
          interface INodeData {
            hotkey: string;
          }

          // We convert some common key names to the corresponding left key names.
          const keyNames = (node.data as INodeData).hotkey.split('+').map((name) => {
            // There are many different names for the Control key. We convert them all
            // to "ControlLeft".
            if (
              name === 'CommandOrControl' ||
              name === 'CmdOrCtrl' ||
              name === 'Command' ||
              name === 'Control' ||
              name === 'Cmd' ||
              name === 'Ctrl'
            ) {
              return 'ControlLeft';
            }

            if (name === 'Shift') return 'ShiftLeft';
            if (name === 'Meta' || name === 'Super') return 'MetaLeft';
            if (name === 'Alt') return 'AltLeft';

            // If the key name is only one character long, we assume that it is a
            // single character which should be pressed. In this case, we prefix it
            // with "Key".
            if (name.length === 1) return 'Key' + name.toUpperCase();

            return name;
          });

          // We simulate the key press by first pressing all keys and then releasing
          // them again. We add a small delay between the key presses to make sure
          // that the keys are pressed in the correct order.
          const keys: IKeySequence = [];

          // First press all keys.
          for (const key of keyNames) {
            keys.push({ name: key, down: true, delay: 10 });
          }

          // Then release all keys.
          for (const key of keyNames) {
            keys.push({ name: key, down: false, delay: 10 });
          }

          // Finally, we simulate the key presses using the backend.
          this.backend.simulateKeys(keys);
        }
      }, 400);
    });

    // We do not hide the window immediately when the user aborts a selection. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('cancel-selection', () => {
      this.hideTimeout = setTimeout(() => {
        console.log('Cancel selection.');
        this.window.hide();
        this.hideTimeout = null;
      }, 300);
    });

    // Send the current settings to the renderer process when the editor is opened.
    ipcMain.handle('get-editor-data', () => {
      return {
        menuSettings: this.menuSettings.get(),
        appSettings: this.appSettings.get(),
        currentMenu: 0,
      };
    });
  }

  /**
   * This binds the shortcuts for all menus. It will unbind all shortcuts first. This
   * method is called when the menu settings change.
   */
  private async bindShortcuts() {
    // First, we unbind all shortcuts.
    await this.backend.unbindAllShortcuts();

    // Then, we bind the shortcuts for all menus.
    for (const menu of this.menuSettings.get('menus')) {
      await this.backend.bindShortcut({
        id: menu.nodes.name.replace(/\s/g, '_').toLowerCase(),
        description: `Trigger the Kando's ${menu.nodes.name} menu`,
        accelerator: menu.shortcut,
        action: () => {
          this.showMenu(menu);
        },
      });
    }
  }

  /** This updates the menu of the tray icon. It is called when the menu settings change. */
  private updateTrayMenu() {
    const template: Array<Electron.MenuItemConstructorOptions> = [];

    // Add an entry for each menu.
    for (const menu of this.menuSettings.get('menus')) {
      template.push({
        label: `${menu.nodes.name} (${menu.shortcut})`,
        click: () => this.showMenu(menu),
      });
    }

    template.push({ type: 'separator' });

    // Add an entry to quit the application.
    template.push({
      label: 'Quit',
      role: 'quit',
    });

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * This returns the node at the given path from the given root node. The path is a
   * string of numbers separated by slashes. Each number is the index of the child node to
   * select. For example, the path "0/2/1" would select the second child of the third
   * child of the first child of the root node.
   */
  private getNodeAtPath(root: DeepReadonly<INode>, path: string) {
    let node = root;
    const indices = path
      .substring(1)
      .split('/')
      .map((x: string) => parseInt(x));

    for (const index of indices) {
      node = node.children[index];
    }

    return node;
  }

  /**
   * A small helper function to execute a shell command. It will show a notification if
   * the command fails to start.
   */
  private exec(command: string) {
    exec(command, (error) => {
      // Print an error if the command fails to start.
      if (error) {
        console.error('Failed to execute command: ' + error);

        // Show a notification if possible.
        if (Notification.isSupported()) {
          const notification = new Notification({
            title: 'Failed to execute command.',
            body: error.message,
            icon: path.join(__dirname, require('../../assets/icons/icon.png')),
          });

          notification.show();
        }
      }
    });
  }

  /** This creates an example menu which can be used for testing. */
  private createExampleMenu() {
    const root: INode = {
      type: 'submenu',
      name: 'Prototype Menu',
      icon: 'open_with',
      iconTheme: 'material-symbols-rounded',
      children: [],
    };

    // This is currently used to create the test menu. It defines the number of children
    // per level. The first number is the number of children of the root node, the second
    // number is the number of children of each child node and so on.
    const CHILDREN_PER_LEVEL = [8, 7, 7];

    const TEST_ICONS = [
      'play_circle',
      'public',
      'arrow_circle_right',
      'terminal',
      'settings',
      'apps',
      'arrow_circle_left',
      'fullscreen',
    ];

    const addChildren = (parent: INode, name: string, level: number) => {
      if (level < CHILDREN_PER_LEVEL.length) {
        parent.children = [];
        for (let i = 0; i < CHILDREN_PER_LEVEL[level]; ++i) {
          const node: INode = {
            type: level < CHILDREN_PER_LEVEL.length - 1 ? 'submenu' : 'item',
            name: `${name} ${i}`,
            icon: TEST_ICONS[i % TEST_ICONS.length],
            iconTheme: 'material-symbols-rounded',
            children: [],
          };
          parent.children.push(node);
          addChildren(node, node.name, level + 1);
        }
      }
    };

    addChildren(root, 'Node', 0);

    return {
      nodes: root,
      shortcut: 'Control+Space',
      centered: false,
    };
  }
}

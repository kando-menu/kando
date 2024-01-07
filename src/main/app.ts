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
  private lastMenu?: DeepReadonly<IMenu>;

  private appSettings = new Settings<IAppSettings>({
    file: 'config.json',
    directory: app.getPath('userData'),
    defaults: {
      menuTheme: 'none',
      editorTheme: 'none',
      sidebarVisible: true,
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

    await this.backend.init();

    // Initialize the IPC communication to the renderer process.
    this.initRendererIPC();

    // Create and load the main window.
    await this.initWindow();

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
   *
   * @param menu The menu to show or the name of the menu to show.
   */
  public showMenu(menu: DeepReadonly<IMenu> | string) {
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

        // Later, we will support application-specific menus. For now, we just print
        // the currently focused window.
        if (info.appName) {
          console.log('Currently focused window: ' + info.appName);
        } else {
          console.log('Currently no window is focused.');
        }

        // If the menu is a string, we need to find the corresponding menu in the
        // settings.
        if (typeof menu === 'string') {
          this.lastMenu = this.menuSettings
            .get('menus')
            .find((m) => m.nodes.name === menu);
          if (!this.lastMenu) {
            throw new Error(`Menu "${menu}" not found.`);
          }
        } else {
          this.lastMenu = menu;
        }

        // Usually, the menu is shown at the pointer position. However, if the menu is
        // centered, we show it in the center of the screen.
        const pos = {
          x: this.lastMenu.centered ? workarea.width / 2 : info.pointerX - workarea.x,
          y: this.lastMenu.centered ? workarea.height / 2 : info.pointerY - workarea.y,
        };

        // Send the menu to the renderer process.
        this.window.webContents.send('show-menu', this.lastMenu.nodes, pos);
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

    this.window = new BrowserWindow({
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

    await this.window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  }

  /**
   * Setup IPC communication with the renderer process. See ../renderer/preload.ts for
   * more information on the exposed functionality.
   */
  private initRendererIPC() {
    // Allow the renderer to access the app settings. We do this by exposing the
    // a setter, a getter, and an on-change event for each key in the settings object.
    for (const k of Object.keys(this.appSettings.defaults)) {
      const key = k as keyof IAppSettings;

      // Allow the renderer process to read the value of this setting.
      ipcMain.handle(`app-settings-get-${key}`, () => this.appSettings.get(key));

      // Allow the renderer process to set the value of this setting.
      ipcMain.on(`app-settings-set-${key}`, (event, value) =>
        this.appSettings.set({ [key]: value } as Partial<IAppSettings>)
      );

      // Notify the renderer process when a setting changes.
      this.appSettings.onChange(
        key,
        (newValue: IAppSettings[typeof key], oldValue: IAppSettings[typeof key]) => {
          if (this.window) {
            this.window.webContents.send(
              `app-settings-changed-${key}`,
              newValue,
              oldValue
            );
          }
        }
      );
    }

    // Show the web developer tools if requested.
    ipcMain.on('show-dev-tools', () => {
      this.window.webContents.openDevTools();
    });

    // Print a message to the console of the host process.
    ipcMain.on('log', (event, message) => {
      console.log(message);
    });

    // Move the mouse pointer. This is used to move the pointer to the center of the
    // menu when the menu is opened too close to the screen edge.
    ipcMain.on('move-pointer', (event, dist) => {
      this.backend.movePointer(Math.floor(dist.x), Math.floor(dist.y));
    });

    // Print some messages when the user hovers or selects an item.
    ipcMain.on('hover-item', (event, path) => {
      console.log('Hover item: ' + path);
    });

    // When the user selects an item, we execute the corresponding action. Depending on
    // the action, we might need to wait for the fade-out animation to finish before we
    // execute the action.
    ipcMain.on('select-item', (event, path) => {
      try {
        // Find the selected item.
        const node = this.getNodeAtPath(this.lastMenu.nodes, path);

        // We hard-code some actions here. In the future, we will have a more
        // sophisticated and more modular action system.

        // For now, the hotkey action is the only action which may have to be executed
        // after the fade-out animation is finished. This is because the hotkey action
        // might trigger a virtual key press which should not be captured by the window.
        let executeDelayed = false;
        if (node.type === 'hotkey') {
          interface INodeData {
            hotkey: string;
            delayed: boolean;
          }

          executeDelayed = (node.data as INodeData).delayed;
        }

        const actions = {
          empty: () => {},
          submenu: () => {},
          // If the node is an URI action, we open the URI with the default application.
          uri: (data: unknown) => {
            interface INodeData {
              uri: string;
            }
            shell.openExternal((data as INodeData).uri);
          },
          // If the node is a command action, we execute the command.
          command: (data: unknown) => {
            interface INodeData {
              command: string;
            }
            this.exec((data as INodeData).command);
          },
          // If the node is a hotkey action, we simulate the key press. For now, the
          // hotkey is a string which is composed of key names separated by a plus sign.
          // All keys will be pressed and then released again.
          hotkey: (data: unknown) => {
            interface INodeData {
              hotkey: string;
              delayed: boolean;
            }

            // We convert some common key names to the corresponding left key names.
            const keyNames = (data as INodeData).hotkey.split('+').map((name) => {
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
          },
        };

        // Get the node type. If the type is unknown, we fall back to the empty action.
        const type = node.type in actions ? node.type : 'empty';

        // If the action is not delayed, we execute it immediately.
        if (!executeDelayed) {
          actions[type](node.data);
        }

        // Also wait with the execution of the selected action until the fade-out
        // animation is finished to make sure that any resulting events (such as virtual
        // key presses) are not captured by the window.
        this.hideTimeout = setTimeout(() => {
          console.log('Select item: ' + path);

          this.hideWindow();
          this.hideTimeout = null;

          // If the action is delayed, we execute it after the window is hidden.
          if (executeDelayed) {
            actions[type](node.data);
          }
        }, 400);
      } catch (err) {
        console.error('Failed to select item: ' + err);
      }
    });

    // We do not hide the window immediately when the user aborts a selection. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('cancel-selection', () => {
      this.hideTimeout = setTimeout(() => {
        console.log('Cancel selection.');
        this.hideWindow();
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

    // The callbacks below are only used for the example actions. They will be removed
    // in the future.

    // Open an URI with the default application.
    ipcMain.on('open-uri', (event, uri) => {
      this.hideWindow();
      shell.openExternal(uri);
    });

    // Run a shell command.
    ipcMain.on('run-command', (event, command) => {
      this.hideWindow();
      this.exec(command);
    });

    // Simulate a key press.
    ipcMain.on('simulate-keys', (event, keys) => {
      this.hideWindow();
      this.backend.simulateKeys(keys);
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
   *
   * @param root The root node of the menu.
   * @param path The path to the node to select.
   * @returns The node at the given path.
   * @throws If the path is invalid.
   */
  private getNodeAtPath(root: DeepReadonly<INode>, path: string) {
    let node = root;
    const indices = path
      .substring(1)
      .split('/')
      .map((x: string) => parseInt(x));

    for (const index of indices) {
      if (!node.children || index >= node.children.length) {
        throw new Error(`Invalid path "${path}".`);
      }

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

  /**
   * This hides the window. When Electron windows are hidden, input focus is not
   * necessarily returned to the topmost window on Windows and macOS. There we have to
   * minimize the window or hide the app respectively.
   *
   * See: https://stackoverflow.com/questions/50642126/previous-window-focus-electron
   */
  private hideWindow() {
    if (process.platform === 'win32') {
      this.window.minimize();
    } else if (process.platform === 'darwin') {
      app.hide();
    } else {
      this.window.hide();
    }
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
            type: level < CHILDREN_PER_LEVEL.length - 1 ? 'submenu' : 'empty',
            name: `${name} ${i}`,
            icon: TEST_ICONS[i % TEST_ICONS.length],
            iconTheme: 'material-symbols-rounded',
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

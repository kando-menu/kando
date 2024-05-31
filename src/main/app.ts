//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { screen, BrowserWindow, ipcMain, shell, Tray, Menu, app } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { Notification } from 'electron';

import { Backend, getBackend } from './backends';
import { IMenuItem, IMenu, IMenuSettings, IAppSettings } from '../common';
import { Settings, DeepReadonly } from './settings';
import { ItemActionRegistry } from '../common/item-action-registry';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

/**
 * This class contains the main host process logic of Kando. It is responsible for
 * creating the transparent window and for handling IPC communication with the renderer
 * process. It also creates the backend which is responsible for all low-level system
 * interaction.
 */
export class KandoApp {
  /**
   * The backend is responsible for all the system interaction. It is implemented
   * differently for each platform.
   */
  private backend: Backend = getBackend();

  /**
   * The window is the main window of the application. It is a transparent window which
   * covers the whole screen. It is always on top and has no frame. It is used to display
   * the pie menu.
   */
  private window: BrowserWindow;

  /** This timeout is used to hide the window after the fade-out animation. */
  private hideTimeout: NodeJS.Timeout;

  /**
   * This is the tray icon which is displayed in the system tray. In the future it will be
   * possible to disable this icon.
   */
  private tray: Tray;

  /**
   * This contains the last menu which was shown. It is used to execute the selected
   * action.
   */
  private lastMenu?: DeepReadonly<IMenu>;

  /**
   * This is the settings object which is used to store the general application settings
   * in the user's home directory.
   */
  private appSettings = new Settings<IAppSettings>({
    file: 'config.json',
    directory: app.getPath('userData'),
    defaults: {
      menuTheme: 'none',
      editorTheme: 'none',
      sidebarVisible: true,
    },
  });

  /**
   * This is the settings object which is used to store the configured menus in the user's
   * home directory.
   */
  private menuSettings = new Settings<IMenuSettings>({
    file: 'menus.json',
    directory: app.getPath('userData'),
    defaults: {
      menus: [this.createExampleMenu()],
      stash: [],
    },
  });

  /** This is called when the app is started. It initializes the backend and the window. */
  public async init() {
    // Bail out if the backend is not available.
    if (this.backend === null) {
      throw new Error('No backend found.');
    }

    await this.backend.init();

    // We ensure that there is always a menu avaliable. If the user deletes all menus,
    // we create a new example menu when Kando is started the next time.
    if (this.menuSettings.get('menus').length === 0) {
      this.menuSettings.set({
        menus: [this.createExampleMenu()],
      });
    }

    // When the menu settings change, we need to rebind the shortcuts and update the
    // tray menu.
    this.menuSettings.onChange('menus', async () => {
      await this.bindShortcuts();
      this.updateTrayMenu();
    });

    // Initialize the IPC communication to the renderer process.
    this.initRendererIPC();

    // Create and load the main window.
    await this.initWindow();

    // Bind the shortcuts for all menus.
    await this.bindShortcuts();

    // Add a tray icon to the system tray. This icon can be used to open the pie menu
    // and to quit the application.
    this.updateTrayMenu();
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

        // Later, we will support application-specific menus. For now, we just print
        // the currently focused window.
        if (info.appName) {
          console.log(`Currently focused: ${info.appName} (${info.windowName})`);
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

        // On Windows, we have to show the window before we can move it. Otherwise, the
        // window will not be moved to the correct monitor.
        if (process.platform === 'win32') {
          this.showWindow();
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

        // Usually, the menu is shown at the pointer position. However, if the menu is
        // centered, we show it in the center of the screen.
        const pos = {
          x: this.lastMenu.centered ? workarea.width / 2 : info.pointerX - workarea.x,
          y: this.lastMenu.centered ? workarea.height / 2 : info.pointerY - workarea.y,
        };

        // Send the menu to the renderer process.
        this.window.webContents.send('show-menu', this.lastMenu.nodes, pos);

        // On all platforms except Windows, we show the window after we moved it.
        if (process.platform !== 'win32') {
          this.showWindow();
        }
      })
      .catch((err) => {
        console.error('Failed to show menu: ' + err);
      });
  }

  /**
   * This is called when the user wants to open the menu editor. This can be either
   * triggered by the tray icon or runned a second instance of the app.
   */
  public showEditor() {
    this.window.webContents.send('show-editor');
    this.showWindow();
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
      hasShadow: false,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width + 1,
      height: display.workArea.height + 1,
      type: this.backend.getBackendInfo().windowType,
      show: false,
    });

    // We set the window to be always on top. This way, Kando will be visible even on
    // fullscreen applications.
    this.window.setAlwaysOnTop(true, 'screen-saver');

    // If the user clicks on a link, we close Kando's window and open the link in the
    // default browser.
    this.window.webContents.setWindowOpenHandler(({ url }) => {
      this.hideWindow();
      shell.openExternal(url);
      return { action: 'deny' };
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

    // Allow the renderer to retrieve the menu settings.
    ipcMain.handle('menu-settings-get', () => {
      return this.menuSettings.get();
    });

    // Allow the renderer to alter the menu settings.
    ipcMain.on('menu-settings-set', (event, settings) => {
      this.menuSettings.set(settings);
    });

    // This should return the index of the currently selected menu. For now, we just
    // return the index of a menu with the same name as the last menu. If the user uses
    // the same name for multiple menus, this will not work as expected.
    ipcMain.handle('menu-settings-get-current-menu', () => {
      if (!this.lastMenu) {
        return 0;
      }

      const index = this.menuSettings
        .get('menus')
        .findIndex((m) => m.nodes.name === this.lastMenu.nodes.name);

      return Math.max(index, 0);
    });

    // Allow the renderer to retrieve information about the backend.
    ipcMain.handle('get-backend-info', () => {
      return this.backend.getBackendInfo();
    });

    // Unbind all shortcuts. This is used when selecting shortcuts in the editor.
    ipcMain.on('inhibit-shortcuts', async () => {
      await this.backend.unbindAllShortcuts();
    });

    // Rebind all shortcuts. This is used when the user is done selecting shortcuts in
    // the editor.
    ipcMain.on('uninhibit-shortcuts', async () => {
      await this.bindShortcuts();
    });

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
      const execute = (item: DeepReadonly<IMenuItem>) => {
        ItemActionRegistry.getInstance()
          .execute(item, this.backend)
          .catch((error) => {
            KandoApp.showError('Failed to execute action', error.message);
          });
      };

      let item: DeepReadonly<IMenuItem>;
      let executeDelayed = false;

      try {
        // Find the selected item.
        item = this.getMenuItemAtPath(this.lastMenu.nodes, path);

        // If the action is not delayed, we execute it immediately.
        executeDelayed = ItemActionRegistry.getInstance().delayedExecution(item);
        if (!executeDelayed) {
          execute(item);
        }
      } catch (error) {
        KandoApp.showError('Failed to select item', error.message);
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
          execute(item);
        }
      }, 400);
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
  }

  /**
   * This binds the shortcuts for all menus. It will unbind all shortcuts first. This
   * method is called once initially and then whenever the menu settings change.
   */
  private async bindShortcuts() {
    // First, we unbind all shortcuts.
    await this.backend.unbindAllShortcuts();

    // Then, we collect all unique shortcuts and the corresponding menus.
    const triggers = new Map<string, DeepReadonly<IMenu>[]>();
    for (const menu of this.menuSettings.get('menus')) {
      const trigger = this.backend.getBackendInfo().supportsShortcuts
        ? menu.shortcut
        : menu.shortcutID;

      if (trigger) {
        if (!triggers.has(trigger)) {
          triggers.set(trigger, []);
        }
        triggers.get(trigger).push(menu);
      }
    }

    // Finally, we bind the shortcuts. If there are multiple menus with the same
    // shortcut, the shortcut will open the first menu for now.
    for (const [trigger, menus] of triggers) {
      try {
        const menu = menus[0];
        await this.backend.bindShortcut({
          trigger,
          action: () => {
            this.showMenu(menu);
          },
        });
      } catch (error) {
        KandoApp.showError('Failed to bind shortcut ' + trigger, error.message);
      }
    }
  }

  /** This updates the menu of the tray icon. It is called when the menu settings change. */
  private updateTrayMenu() {
    if (!this.tray) {
      if (os.platform() === 'darwin') {
        this.tray = new Tray(
          path.join(__dirname, require('../../assets/icons/trayTemplate.png'))
        );
      } else {
        this.tray = new Tray(
          path.join(__dirname, require('../../assets/icons/icon.png'))
        );
      }
      this.tray.setToolTip('Kando');
    }

    const template: Array<Electron.MenuItemConstructorOptions> = [];

    // Add an entry for each menu.
    for (const menu of this.menuSettings.get('menus')) {
      const trigger =
        (this.backend.getBackendInfo().supportsShortcuts
          ? menu.shortcut
          : menu.shortcutID) || 'Not Bound';
      template.push({
        label: `${menu.nodes.name} (${trigger})`,
        click: () => this.showMenu(menu),
      });
    }

    template.push({ type: 'separator' });

    // Add an entry to show the editor.
    template.push({
      label: 'Show Settings',
      click: () => this.showEditor(),
    });

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
   * This returns the menu item at the given path from the given root menu. The path is a
   * string of numbers separated by slashes. Each number is the index of the child menu
   * item to select. For example, the path "0/2/1" would select the second child of the
   * third child of the first child of the root menu item.
   *
   * @param root The root item of the menu.
   * @param path The path to the menu item to select.
   * @returns The menu item at the given path.
   * @throws If the path is invalid.
   */
  private getMenuItemAtPath(root: DeepReadonly<IMenuItem>, path: string) {
    let item = root;
    const indices = path
      .substring(1)
      .split('/')
      .map((x: string) => parseInt(x));

    for (const index of indices) {
      if (!item.children || index >= item.children.length) {
        throw new Error(`Invalid path "${path}".`);
      }

      item = item.children[index];
    }

    return item;
  }

  /**
   * A small helper function to execute a shell command. It will show a notification if
   * the command fails to start.
   */
  private exec(command: string) {
    exec(command, (error) => {
      // Print an error if the command fails to start.
      if (error) {
        KandoApp.showError('Failed to execute command', error.message);
      }
    });
  }

  /** This shows the window. */
  private showWindow() {
    // On Windows, we have to remove the ignore-mouse-events property when
    // un-minimizing the window. See the hideWindow() method for more information on
    // this workaround
    if (process.platform === 'win32') {
      this.window.setIgnoreMouseEvents(false);
    }

    this.window.show();

    // There seems to be an issue with GNOME Shell 44.1 where the window does not
    // get focus when it is shown. This is a workaround for that issue.
    setTimeout(() => {
      this.window.focus();
    }, 100);
  }

  /**
   * This hides the window. When Electron windows are hidden, input focus is not
   * necessarily returned to the topmost window below the hidden window. This is a problem
   * if we want to simulate key presses.
   *
   * - On Windows, we have to minimize the window instead. This leads to another issue:
   *   https://github.com/kando-menu/kando/issues/375. To make this weird little window
   *   really imperceptible, we make it ignore any mouse events.
   * - On macOS, we have to "hide the app" in order to properly restore input focus.
   * - On Linux, it seems to work with a simple window.hide().
   *
   * See also: https://stackoverflow.com/questions/50642126/previous-window-focus-electron
   */
  private hideWindow() {
    if (process.platform === 'win32') {
      this.window.setIgnoreMouseEvents(true);
      this.window.minimize();
    } else if (process.platform === 'darwin') {
      app.hide();
    } else {
      this.window.hide();
    }
  }

  /**
   * Depending on the operating system, we create a different example menu. The structure
   * of the menu is similar on all platforms, but the shortcuts and commands are
   * different.
   *
   * All menu configurations are stored in the `example-menus` directory.
   */
  private createExampleMenu(): IMenu {
    if (process.platform === 'win32') {
      return require('./example-menus/windows.json');
    }

    if (process.platform === 'darwin') {
      return require('./example-menus/macos.json');
    }

    return require('./example-menus/linux.json');
  }

  /**
   * This prints an error message to the console and shows a notification if possible.
   *
   * @param message The message to show.
   * @param error The error to show.
   */
  public static showError(message: string, error: string) {
    console.error(message + ': ' + error);

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: message + '.',
        body: error,
        icon: path.join(__dirname, require('../../assets/icons/icon.png')),
      });

      notification.show();
    }
  }
}

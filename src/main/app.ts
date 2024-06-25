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
import { Notification } from 'electron';

import { Backend, getBackend } from './backends';
import {
  IMenuItem,
  IMenu,
  IMenuSettings,
  IAppSettings,
  IShowMenuRequest,
} from '../common';
import { Settings, DeepReadonly } from './settings';
import { ItemActionRegistry } from '../common/item-action-registry';
import { WMInfo } from './backends/backend';

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

  /** This flag is used to determine if the bindShortcuts() method is currently running. */
  private bindingShortcuts = false;

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
      zoomFactor: 1,
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

    // Try migrating settings from an old version of Kando.
    this.migrateSettings();

    // We ensure that there is always a menu avaliable. If the user deletes all menus,
    // we create a new example menu when Kando is started the next time.
    if (this.menuSettings.get('menus').length === 0) {
      this.menuSettings.set({
        menus: [this.createExampleMenu()],
      });
    }

    // When the menu settings change, we need to rebind the shortcuts and update the
    // tray menu. Rebinding the shortcuts is only necessary when the window is currently
    // not shown. If the window is shown, the shortcuts are already unbound and will be
    // rebound when the window is hidden.
    this.menuSettings.onChange('menus', async () => {
      if (!this.window.isVisible()) {
        await this.bindShortcuts();
      }
      this.updateTrayMenu();
    });

    // When the app settings change, we need to apply the zoom factor to the window.
    this.appSettings.onChange('zoomFactor', (newValue) => {
      this.window.webContents.setZoomFactor(newValue);
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

  /**
   * This is called when the app is about to close. It will save some settings before
   * quitting.
   */
  public saveSettings() {
    // Save the current zoom factor to the settings.
    if (this.window) {
      this.appSettings.set(
        {
          zoomFactor: this.window.webContents.getZoomFactor(),
        },
        false
      );
    }
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
   * This chooses the correct menu depending on environment.
   *
   * @param request Required information to select correct menu.
   * @param info Informations about current desktop environment.
   * @returns The selected menu or null if no menu was found.
   */
  public chooseMenu(request: IShowMenuRequest, info: WMInfo) {
    // Score of currently selected menu
    let currentScore = 0;
    // Temporary selected menu
    let selectedMenu: DeepReadonly<IMenu>;
    // Get list of current menus.
    const menus = this.menuSettings.get('menus');

    for (const menu of menus) {
      let menuScore = 0;
      // We check if request has menu name, and if it matches checked menu.
      // If that's the case we return it as chosen menu, there's no need to check rest.
      if (request.name && request.name == menu.root.name) {
        return menu;
      }

      // Then we check if menu trigger matches our request, if not we skip this menu.
      if (request.trigger != menu.shortcut && request.trigger != menu.shortcutID) {
        continue;
      }

      // If no other menu matches, we will choose the first one with no conditions set.
      if (!menu.conditions) {
        if (!selectedMenu) {
          selectedMenu = menu;
        }

        // As we don't have any conditions to check we continue with next menu.
        continue;
      }

      // If the conditions starts with / we treat it as regex, otherwise we treat it as
      // string. We also ignore case for string conditions.
      const testStringCondition = (condition: string, value: string) => {
        // If condition starts with / we treat it as regex. For this we need to extract
        // the flags from the end of the string and the pattern from the middle.
        if (condition.startsWith('/')) {
          const flags = condition.replace(/.*\/([gimy]*)$/, '$1');
          const pattern = condition.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
          return new RegExp(pattern, flags).test(value);
        }

        return value.toLowerCase().includes(condition.toLowerCase());
      };

      // And we start with appName condition check (we know conditions is not null).
      // If appName condition does not exists we skip it.
      if (menu.conditions.appName) {
        if (testStringCondition(menu.conditions.appName, info.appName)) {
          menuScore += 1;
        } else {
          continue;
        }
      }

      // We do the same for windowName condition.
      if (menu.conditions.windowName) {
        if (testStringCondition(menu.conditions.windowName, info.windowName)) {
          menuScore += 1;
        } else {
          continue;
        }
      }

      // And for screenArea condition.
      if (
        menu.conditions.screenArea?.xMin != null ||
        menu.conditions.screenArea?.xMax != null ||
        menu.conditions.screenArea?.yMin != null ||
        menu.conditions.screenArea?.yMax != null
      ) {
        const condition = menu.conditions.screenArea;

        // We check if cursor is in the specified range.
        if (
          (condition.xMin == null || info.pointerX >= condition.xMin) &&
          (condition.xMax == null || info.pointerX <= condition.xMax) &&
          (condition.yMin == null || info.pointerY >= condition.yMin) &&
          (condition.yMax == null || info.pointerY <= condition.yMax)
        ) {
          menuScore += 1;
        } else {
          continue;
        }
      }

      // If our menuScore is higher than currentScore we need to select this menu
      // As it matches more conditions than previous selection
      if (menuScore > currentScore) {
        selectedMenu = menu;
        currentScore = menuScore;
      }
    }

    // We finally return our last selected menu as choosen.
    return selectedMenu;
  }

  /**
   * This is usually called when the user presses the shortcut. However, it can also be
   * called for other reasons, e.g. when the user runs the app a second time. It will get
   * the current window and pointer position and send them to the renderer process.
   *
   * @param request Required information to select correct menu.
   */
  public showMenu(request: IShowMenuRequest) {
    this.backend
      .getWMInfo()
      .then((info) => {
        // Select correct menu before showing it to user.
        const menu = this.chooseMenu(request, info);

        // If no menu was found, we can stop here.
        if (!menu) {
          console.log('No menu was found for the current conditions: ', info);
          return;
        }

        // Store the last menu to be able to execute the selected action later.
        this.lastMenu = menu;

        // Abort any ongoing hide animation.
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }

        // Get the work area of the screen where the pointer is located. We will move the
        // window to this screen and show the menu at the pointer position.
        const workarea = screen.getDisplayNearestPoint({
          x: info.pointerX,
          y: info.pointerY,
        }).workArea;

        // On Windows, we have to show the window before we can move it. Otherwise, the
        // window will not be moved to the correct monitor.
        if (process.platform === 'win32') {
          this.showWindow();

          // Also, there is this long-standing issue with Windows where the window is not
          // scaled correctly when it is moved to another monitor with a different DPI
          // scale: https://github.com/electron/electron/issues/10862
          // To work around this, we first move the window to the top-left corner of the
          // screen and make sure that it is only on this monitor by reducing its size to
          // 1x1 pixel. This seems to apply the correct DPI scaling. Afterward, we can
          // scale the window to the correct size.
          this.window.setBounds({
            x: workarea.x,
            y: workarea.y,
            width: 1,
            height: 1,
          });
        }

        // Some platforms require the window to be one pixel larger than the work area.
        // Else there will be a small gap between the window and the screen edge.
        this.window.setBounds({
          x: workarea.x,
          y: workarea.y,
          width: workarea.width + 1,
          height: workarea.height + 1,
        });

        // On all platforms except Windows, we show the window after we moved it.
        if (process.platform !== 'win32') {
          this.showWindow();
        }

        // Usually, the menu is shown at the pointer position. However, if the menu is
        // centered, we show it in the center of the screen.
        const mousePosition = {
          x: (info.pointerX - workarea.x) / this.window.webContents.getZoomFactor(),
          y: (info.pointerY - workarea.y) / this.window.webContents.getZoomFactor(),
        };

        // We have to pass the size of the window to the renderer because window.innerWidth
        // and window.innerHeight are not reliable when the window has just been resized.
        const windowSize = {
          x: workarea.width,
          y: workarea.height,
        };

        // Send the menu to the renderer process. If the menu is centered, we delay the
        // turbo mode. This way, a key has to be pressed first before the turbo mode is
        // activated. Else, the turbo mode would be activated immediately when the menu is
        // opened which is not nice if it is not opened at the pointer position.
        // We also send the name of the current application and window to the renderer.
        // It will be used as an example in the condition picker of the menu editor.
        this.window.webContents.send(
          'show-menu',
          this.lastMenu.root,
          {
            mousePosition,
            windowSize,
            zoomFactor: this.window.webContents.getZoomFactor(),
            centeredMode: this.lastMenu.centered,
            anchoredMode: this.lastMenu.anchored,
          },
          {
            appName: info.appName,
            windowName: info.windowName,
            windowPosition: {
              x: workarea.x,
              y: workarea.y,
            },
          }
        );
      })
      .catch((err) => {
        console.error('Failed to show menu: ' + err);
      });
  }

  /**
   * This is called when the user wants to open the menu editor. This can be either
   * triggered by the tray icon or by running a second instance of the app. We send the
   * name of the current application and window to the renderer. It will be used as an
   * example in the condition picker of the menu editor.
   */
  public showEditor() {
    this.backend
      .getWMInfo()
      .then((info) => {
        this.window.webContents.send('show-editor', {
          appName: info.appName,
          windowName: info.windowName,
          windowPosition: {
            x: this.window.getPosition()[0],
            y: this.window.getPosition()[1],
          },
        });
        this.showWindow();
      })
      .catch((err) => {
        console.error('Failed to settings: ' + err);
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

    // Apply the stored zoom factor to the window.
    this.window.webContents.setZoomFactor(this.appSettings.get('zoomFactor'));
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
        .findIndex((m) => m.root.name === this.lastMenu.root.name);

      return Math.max(index, 0);
    });

    // Allow the renderer to retrieve information about the backend.
    ipcMain.handle('get-backend-info', () => {
      return this.backend.getBackendInfo();
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
      let scale = 1;

      // On macOS, the pointer movement seems to be scaled automatically. We have to
      // scale the movement manually on other platforms.
      if (os.platform() !== 'darwin') {
        const bounds = this.window.getBounds();
        const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
        scale = display.scaleFactor;
      }

      this.backend.movePointer(Math.floor(dist.x * scale), Math.floor(dist.y * scale));
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
        item = this.getMenuItemAtPath(this.lastMenu.root, path);

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
      this.hideWindow(400).then(() => {
        // If the action is delayed, we execute it after the window is hidden.
        if (executeDelayed) {
          execute(item);
        }
      });
    });

    // We do not hide the window immediately when the user aborts a selection. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('cancel-selection', () => {
      this.hideWindow(300);
    });
  }

  /**
   * This binds the shortcuts for all menus. It will unbind all shortcuts first. This
   * method is called once initially and then whenever the menu settings change.
   */
  private async bindShortcuts() {
    // This async function should not be run twice at the same time.
    if (this.bindingShortcuts) {
      return;
    }

    this.bindingShortcuts = true;

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
    for (const [trigger] of triggers) {
      try {
        await this.backend.bindShortcut({
          trigger,
          action: () => {
            this.showMenu({
              trigger: trigger,
              name: '',
            });
          },
        });
      } catch (error) {
        KandoApp.showError('Failed to bind shortcut ' + trigger, error.message);
      }
    }

    this.bindingShortcuts = false;
  }

  /** This updates the menu of the tray icon. It is called when the menu settings change. */
  private updateTrayMenu() {
    if (!this.tray) {
      if (os.platform() === 'darwin') {
        // On macOS, the tray icons are not bundled via webpack, as the different
        // resolutions for HiDPI displays are loaded at runtime. Instead, the tray icons
        // are copied to the assets directory during the build process.
        // See webpack.plugins.ts for more information.
        this.tray = new Tray(path.join(__dirname, '../renderer/assets/trayTemplate.png'));
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
        label: `${menu.root.name} (${trigger})`,
        click: () => {
          this.showMenu({
            trigger: '',
            name: menu.root.name,
          });
        },
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

  /** This shows the window. */
  private showWindow() {
    // On Windows, we have to remove the ignore-mouse-events property when
    // un-minimizing the window. See the hideWindow() method for more information on
    // this workaround
    if (process.platform === 'win32') {
      this.window.setIgnoreMouseEvents(false);
    }

    // Once Kando's window is shown, we unbind all shortcuts to make sure that the
    // user can select the bound shortcuts in the menu editor.
    this.backend.unbindAllShortcuts();

    this.window.show();

    // There seems to be an issue with GNOME Shell 44.1 where the window does not
    // get focus when it is shown. This is a workaround for that issue.
    setTimeout(() => {
      this.window.focus();
    }, 100);
  }

  /**
   * This hides the window. As shortcuts are unbound when the window is shown, we have to
   * rebind them when the window is hidden. This method also accepts a delay parameter
   * which can be used to delay the hiding of the window. This is useful when we want to
   * show a fade-out animation.
   *
   * When Electron windows are hidden, input focus is not necessarily returned to the
   * topmost window below the hidden window. This is a problem if we want to simulate key
   * presses.
   *
   * - On Windows, we have to minimize the window instead. This leads to another issue:
   *   https://github.com/kando-menu/kando/issues/375. To make this weird little window
   *   really imperceptible, we make it ignore any mouse events.
   * - On macOS, we have to "hide the app" in order to properly restore input focus.
   * - On Linux, it seems to work with a simple window.hide().
   *
   * See also: https://stackoverflow.com/questions/50642126/previous-window-focus-electron
   */
  private async hideWindow(delay = 0) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    return new Promise<void>((resolve) => {
      this.bindShortcuts();

      this.hideTimeout = setTimeout(() => {
        if (process.platform === 'win32') {
          this.window.setIgnoreMouseEvents(true);
          this.window.minimize();
        } else if (process.platform === 'darwin') {
          app.hide();
        } else {
          this.window.hide();
        }

        this.hideTimeout = null;

        resolve();
      }, delay);
    });
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

  /**
   * This migrates settings from an old version of Kando to the current version. This
   * method is called when the app is started.
   */
  private migrateSettings() {
    // Up to Kando 0.9.0, the `root` property of the menu was called `nodes`.
    const menus = this.menuSettings.getMutable('menus');
    for (const menu of menus) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oldMenu = menu as any;
      if (oldMenu.nodes) {
        menu.root = oldMenu.nodes as IMenuItem;
        delete oldMenu.nodes;
      }
    }
  }
}

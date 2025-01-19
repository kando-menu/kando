//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import json5 from 'json5';
import {
  screen,
  BrowserWindow,
  ipcMain,
  shell,
  Tray,
  Menu,
  app,
  nativeTheme,
} from 'electron';
import { Notification } from 'electron';
import i18next from 'i18next';

import { Backend, getBackend } from './backends';
import {
  IMenuItem,
  IMenu,
  IMenuSettings,
  IAppSettings,
  IShowMenuRequest,
  IIconThemesInfo,
  ISoundThemeDescription,
  IMenuThemeDescription,
} from '../common';
import { Settings, DeepReadonly } from './settings';
import { ItemActionRegistry } from '../common/item-action-registry';
import { WMInfo } from './backends/backend';
import { UpdateChecker } from './update-checker';

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

  /** This is used to check for updates. */
  private updateChecker = new UpdateChecker();

  /**
   * The window is the main window of the application. It is a transparent window which
   * covers the whole screen. It is always on top and has no frame. It is used to display
   * the pie menu.
   */
  private window?: BrowserWindow;

  /** This timeout is used to hide the window after the fade-out animation. */
  private hideTimeout: NodeJS.Timeout;

  /** This flag is used to determine if the bindShortcuts() method is currently running. */
  private bindingShortcuts = false;

  /** True if shortcuts are currently inhibited. */
  private inhibitShortcuts = false;

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

  /** This contains the last WMInfo which was received. */
  private lastWMInfo?: WMInfo;

  /**
   * This is the settings object which is used to store the general application settings
   * in the user's home directory.
   */
  private appSettings: Settings<IAppSettings>;

  /**
   * This is the settings object which is used to store the configured menus in the user's
   * home directory.
   */
  private menuSettings: Settings<IMenuSettings>;

  /** This is called when the app is started. It initializes the backend and the window. */
  public async init() {
    // Bail out if the backend is not available.
    if (this.backend === null) {
      throw new Error('No backend found.');
    }

    await this.backend.init();

    // We load the settings from the user's home directory. If the settings file does not
    // exist, it will be created with the default values.
    this.appSettings = new Settings<IAppSettings>({
      file: 'config.json',
      directory: app.getPath('userData'),
      defaults: {
        locale: 'auto',
        menuTheme: 'default',
        darkMenuTheme: 'default',
        menuThemeColors: {},
        darkMenuThemeColors: {},
        enableDarkModeForMenuThemes: false,
        soundTheme: 'none',
        soundVolume: 0.5,
        sidebarVisible: true,
        ignoreWriteProtectedConfigFiles: false,
        trayIconFlavor: 'color',
        enableVersionCheck: true,
        zoomFactor: 1,
        menuOptions: {
          centerDeadZone: 50,
          minParentDistance: 150,
          dragThreshold: 15,
          fadeInDuration: 150,
          fadeOutDuration: 200,
          enableMarkingMode: true,
          enableTurboMode: true,
          gestureMinStrokeLength: 150,
          gestureMinStrokeAngle: 20,
          gestureJitterThreshold: 10,
          gesturePauseTimeout: 100,
          fixedStrokeLength: 0,
          rmbSelectsParent: false,
          gamepadBackButton: 1,
          gamepadCloseButton: 2,
        },
        editorOptions: {
          showSidebarButtonVisible: true,
          showEditorButtonVisible: true,
        },
      },
    });

    // We load the menu settings from the user's home directory. If the settings file does
    // not exist, it will be created with the default values.
    this.menuSettings = new Settings<IMenuSettings>({
      file: 'menus.json',
      directory: app.getPath('userData'),
      defaults: {
        menus: [],
        templates: [],
      },
    });

    // Tell i18next to use a specific locale if it is set in the settings.
    const locale = this.appSettings.get('locale');
    if (locale !== 'auto') {
      i18next.changeLanguage(locale);
    }

    // Try migrating settings from an old version of Kando.
    this.migrateSettings();

    // We ensure that there is always a menu available. If the user deletes all menus,
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
      if (!this.window?.isVisible()) {
        await this.bindShortcuts();
      }
      this.updateTrayMenu();
    });

    // When the app settings change, we need to apply the zoom factor to the window.
    this.appSettings.onChange('zoomFactor', (newValue) => {
      this.window?.webContents.setZoomFactor(newValue);
    });

    // Check if we want to silently handle read-only config files
    this.appSettings.ignoreWriteProtectedConfigFiles = this.appSettings.get(
      'ignoreWriteProtectedConfigFiles'
    );
    this.menuSettings.ignoreWriteProtectedConfigFiles = this.appSettings.get(
      'ignoreWriteProtectedConfigFiles'
    );

    // When ignoreWriteProtectedConfigFiles becomes true we want to apply this immediately.
    this.appSettings.onChange('ignoreWriteProtectedConfigFiles', (newValue) => {
      this.appSettings.ignoreWriteProtectedConfigFiles = newValue;
      this.menuSettings.ignoreWriteProtectedConfigFiles = newValue;
    });

    // Update the tray icon if the tray icon flavor changes.
    this.appSettings.onChange('trayIconFlavor', () => {
      this.updateTrayMenu(true);
    });

    // Initialize the IPC communication to the renderer process.
    this.initRendererIPC();

    // Bind the shortcuts for all menus.
    await this.bindShortcuts();

    // Add a tray icon to the system tray. This icon can be used to open the pie menu
    // and to quit the application.
    this.updateTrayMenu();

    // Show a notification if a new version of Kando is available.
    this.updateChecker.enabled = this.appSettings.get('enableVersionCheck');

    this.appSettings.onChange('enableVersionCheck', (newValue) => {
      this.updateChecker.enabled = newValue;
    });

    this.updateChecker.on('update-available', () => {
      console.log(
        'A new version of Kando is available! Get it from https://github.com/kando-menu/kando/releases.'
      );

      // Show the update-available button in the sidebar.
      this.window?.webContents.send('show-update-available-button');

      // Show the sidebar if it is hidden.
      this.appSettings.set({ sidebarVisible: true });

      // Show a notification if possible.
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: 'A new version of Kando is available!',
          body: 'Get it from https://github.com/kando-menu/kando/releases.',
          icon: path.join(__dirname, require('../../assets/icons/icon.png')),
        });

        notification.on('click', () => {
          shell.openExternal('https://github.com/kando-menu/kando/releases');
        });

        notification.show();
      }
    });
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
    Promise.all([this.backend.getWMInfo(), this.initWindow()])
      .then(([info]) => {
        // Select correct menu before showing it to user.
        const menu = this.chooseMenu(request, info);

        // If no menu was found, we can stop here.
        if (!menu) {
          console.log('No menu was found for the current conditions: ', info);
          return;
        }

        // We unbind the shortcut of the menu (if any) so that key-repeat events can be
        // received by the renderer. These are necessary for the turbo-mode to work for
        // single-key shortcuts. The shortcuts are rebound when the window is hidden.
        // It is possible to open a menu while another one is already shown. If this
        // happens, we will replace it without closing and opening the window. As the
        // shortcut for the previous menu had been unbound when showing it, we have to
        // rebind it here (if it was a different one).
        const useID = !this.backend.getBackendInfo().supportsShortcuts;
        const newTrigger = useID ? menu.shortcutID : menu.shortcut;
        const oldTrigger = useID ? this.lastMenu?.shortcutID : this.lastMenu?.shortcut;

        // First, unbind the trigger for the new menu.
        if (newTrigger) {
          this.backend.unbindShortcut(newTrigger);
        }

        // If old and new trigger are the same, we don't need to rebind it. If the
        // hideTimeout is set, the window is about to be hidden and the shortcuts have
        // been rebound already.
        if (
          oldTrigger &&
          oldTrigger != newTrigger &&
          this.window.isVisible() &&
          !this.hideTimeout
        ) {
          this.backend.bindShortcut({
            trigger: oldTrigger,
            action: () => {
              this.showMenu({
                trigger: oldTrigger,
                name: '',
              });
            },
          });
        }

        // Store the last menu to be able to execute the selected action later. The WMInfo
        // will be passed to the action as well.
        this.lastMenu = menu;
        this.lastWMInfo = info;

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

        // Move and resize the window to the work area of the screen where the pointer is.
        this.window.setBounds({
          x: workarea.x,
          y: workarea.y,
          width: workarea.width,
          height: workarea.height,
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
            warpMouse: this.lastMenu.warpMouse,
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

        // We use the opportunity to check for updates. If an update is available, we show
        // a notification to the user. This notification is only shown once per app start.
        this.updateChecker.checkForUpdates();
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
    Promise.all([this.backend.getWMInfo(), this.initWindow()])
      .then(([info]) => {
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

  /** This is called when the --reload-menu-theme command line option is passed. */
  public reloadMenuTheme() {
    this.window.webContents.send(
      `app-settings-changed-menuTheme`,
      this.appSettings.get('menuTheme'),
      this.appSettings.get('menuTheme')
    );
  }

  /** This is called when the --reload-sound-theme command line option is passed. */
  public reloadSoundTheme() {
    this.window.webContents.send(
      `app-settings-changed-soundTheme`,
      this.appSettings.get('soundTheme'),
      this.appSettings.get('soundTheme')
    );
  }

  /**
   * This creates the main window. It is a transparent window which covers the whole
   * screen. It is not shown in any task bar and has no frame. It is used to display the
   * pie menu and potentially other UI elements such as the menu editor.
   */
  private async initWindow() {
    // Bail out if the window is already created.
    if (this.window) {
      return;
    }

    const display = screen.getPrimaryDisplay();

    this.window = new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        // Electron only allows loading local resources from apps loaded from the file
        // system. In development mode, the app is loaded from the webpack dev server.
        // Hence, we have to disable webSecurity in development mode.
        webSecurity: process.env.NODE_ENV !== 'development',
        // Background throttling is disabled to make sure that the menu is properly
        // hidden. Else it can happen that the last frame of a previous menu is still
        // visible when the new menu is shown. For now, I have not seen any issues with
        // background throttling disabled.
        backgroundThrottling: false,
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

    // Remove the default menu. This disables all default shortcuts like CMD+W which are
    // not needed in Kando.
    this.window.setMenu(null);

    // However, we still want to allow the user to zoom the menu using Ctrl+, Ctrl-, and
    // Ctrl+0. We have to handle these shortcuts manually.
    this.window.webContents.on('before-input-event', (event, input) => {
      if (input.control && (input.key === '+' || input.key === '-')) {
        let zoomFactor = this.window.webContents.getZoomFactor();
        zoomFactor = input.key === '+' ? zoomFactor + 0.1 : zoomFactor - 0.1;
        this.appSettings.set({ zoomFactor });
        event.preventDefault();
      }

      if (input.control && input.key === '0') {
        this.appSettings.set({ zoomFactor: 1 });
        event.preventDefault();
      }

      // We prevent CMD+W to close the window.
      if (input.meta && input.key === 'w') {
        event.preventDefault();
      }
    });

    // We set the window to be always on top. This way, Kando will be visible even on
    // fullscreen applications.
    this.window.setAlwaysOnTop(true, 'screen-saver');

    // We set the Activation Policy to Accessory so that Kando doesn't show in dock
    // or the CMD Tab App Switcher. This is only for MacOS.
    if (process.platform === 'darwin') {
      app.setActivationPolicy('accessory');
    }

    // If the user clicks on a link, we close Kando's window and open the link in the
    // default browser.
    this.window.webContents.setWindowOpenHandler(({ url }) => {
      this.window.webContents.send('hide-editor');
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // We return a promise which resolves when the renderer process is ready.
    const promise = new Promise<void>((resolve) => {
      ipcMain.on('renderer-ready', () => resolve());
    });

    await this.window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Apply the stored zoom factor to the window.
    this.window.webContents.setZoomFactor(this.appSettings.get('zoomFactor'));

    return promise;
  }

  /**
   * Setup IPC communication with the renderer process. See ../renderer/preload.ts for
   * more information on the exposed functionality.
   */
  private initRendererIPC() {
    // Allow the renderer to retrieve the i18next locales.
    ipcMain.handle('get-locales', () => {
      return {
        current: i18next.language,
        data: i18next.store.data,
        fallbackLng: i18next.options.fallbackLng,
      };
    });

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

    // We also allow getting the entire app settings object.
    ipcMain.handle('app-settings-get', () => this.appSettings.get());

    // Allow the renderer to retrieve the menu settings.
    ipcMain.handle('menu-settings-get', () => this.menuSettings.get());

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

    // Allow the renderer to retrieve information about the current app version.
    ipcMain.handle('get-version', () => {
      return {
        kandoVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        nodeVersion: process.versions.node,
      };
    });

    // Allow the renderer to retrieve information about the backend.
    ipcMain.handle('get-backend-info', () => {
      return this.backend.getBackendInfo();
    });

    // Allow the renderer to retrieve all icons of all file icon themes.
    ipcMain.handle('get-icon-themes', async () => {
      const info: IIconThemesInfo = {
        userIconDirectory: path.join(app.getPath('userData'), 'icon-themes'),
        fileIconThemes: [],
      };

      const themes = await this.listSubdirectories([
        path.join(app.getPath('userData'), 'icon-themes'),
        path.join(__dirname, '../renderer/assets/icon-themes'),
      ]);

      await Promise.all(
        themes.map(async (theme) => {
          const directory = await this.findIconThemePath(theme);
          const icons = await this.listIconsRecursively(directory);

          info.fileIconThemes.push({
            name: theme,
            directory,
            icons,
          });
        })
      );

      return info;
    });

    // Allow the renderer to retrieve the description of the current menu theme. We also
    // return the path to the CSS file of the theme, so that the renderer can load it.
    ipcMain.handle('get-menu-theme', async () => {
      const useDarkVariant =
        this.appSettings.get('enableDarkModeForMenuThemes') &&
        nativeTheme.shouldUseDarkColors;
      return this.loadMenuThemeDescription(
        this.appSettings.get(useDarkVariant ? 'darkMenuTheme' : 'menuTheme')
      );
    });

    // Allow the renderer to retrieve all available menu themes.
    ipcMain.handle('get-all-menu-themes', async () => {
      const themes = await this.listSubdirectories([
        path.join(app.getPath('userData'), 'menu-themes'),
        path.join(__dirname, '../renderer/assets/menu-themes'),
      ]);

      // Load all descriptions in parallel.
      const descriptions = await Promise.all(
        themes.map((theme) => this.loadMenuThemeDescription(theme))
      );

      // Sort by the name property of the description.
      return descriptions.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Allow the renderer to retrieve the current menu theme override colors. We return
    // the colors for the current theme and for the dark theme if the user enabled dark
    // mode for menu themes and if the system is currently in dark mode.
    ipcMain.handle('get-current-menu-theme-colors', async () => {
      const useDarkVariant =
        this.appSettings.get('enableDarkModeForMenuThemes') &&
        nativeTheme.shouldUseDarkColors;

      const theme = this.appSettings.get(useDarkVariant ? 'darkMenuTheme' : 'menuTheme');
      const colorOverrides = this.appSettings.get(
        useDarkVariant ? 'darkMenuThemeColors' : 'menuThemeColors'
      );

      return colorOverrides[theme] || {};
    });

    // Allow the renderer to retrieve the current system theme.
    ipcMain.handle('get-is-dark-mode', () => {
      return nativeTheme.shouldUseDarkColors;
    });

    // Allow the renderer to be notified when the system theme changes.
    let darkMode = nativeTheme.shouldUseDarkColors;
    nativeTheme.on('updated', () => {
      if (this.window && darkMode !== nativeTheme.shouldUseDarkColors) {
        darkMode = nativeTheme.shouldUseDarkColors;
        this.window.webContents.send('dark-mode-changed', darkMode);
      }
    });

    // Allow the renderer to retrieve the description of the current sound theme.
    ipcMain.handle('get-sound-theme', async () => {
      return this.loadSoundThemeDescription(this.appSettings.get('soundTheme'));
    });

    // Once the editor is shown, we unbind all shortcuts to make sure that the
    // user can select the bound shortcuts in the menu editor.
    ipcMain.on('unbind-shortcuts', () => {
      this.backend.unbindAllShortcuts();
    });

    // Show the web developer tools if requested.
    ipcMain.on('show-dev-tools', () => {
      this.window.webContents.openDevTools();
    });

    // Reload the current menu theme if requested.
    ipcMain.on('reload-menu-theme', async () => {
      this.reloadMenuTheme();
    });

    // Reload the current sound theme if requested.
    ipcMain.on('reload-sound-theme', async () => {
      this.reloadSoundTheme();
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
          .execute(item, this.backend, this.lastWMInfo)
          .catch((error) => {
            KandoApp.showError('Failed to execute action', error.message || error);
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
      this.hideWindow().then(() => {
        // If the action is delayed, we execute it after the window is hidden.
        if (executeDelayed) {
          execute(item);
        }
      });
    });

    // We do not hide the window immediately when the user aborts a selection. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('cancel-selection', () => {
      this.hideWindow();
    });
  }

  /**
   * This binds the shortcuts for all menus. It will unbind all shortcuts first. This
   * method is called once initially and then whenever the menu settings change.
   */
  private async bindShortcuts() {
    // This async function should not be run twice at the same time.
    if (this.bindingShortcuts || this.inhibitShortcuts) {
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

  /**
   * This updates the menu of the tray icon. It is called when the menu settings change or
   * when the tray icon flavor changes.
   */
  private updateTrayMenu(flavorChanged = false) {
    // If the flavor of the tray icon has changed, we have to destroy the old tray icon
    // and create a new one.
    if (flavorChanged) {
      this.tray?.destroy();
      this.tray = null;
    }

    // If the tray icon flavor is set to 'none', we do not show a tray icon.
    let flavor = this.appSettings.get('trayIconFlavor');
    if (flavor === 'none') {
      return;
    }

    // The tray icons are not bundled via webpack, as the different resolutions for HiDPI
    // displays on macOS or the flavors on Linux and Windows are loaded at runtime.
    // Instead, the tray icons are copied to the assets directory during the build
    // process. See webpack.plugins.ts for more information.
    if (!this.tray) {
      if (os.platform() === 'darwin') {
        this.tray = new Tray(path.join(__dirname, '../renderer/assets/trayTemplate.png'));
      } else {
        if (
          flavor !== 'light' &&
          flavor !== 'dark' &&
          flavor !== 'color' &&
          flavor !== 'black' &&
          flavor !== 'white'
        ) {
          console.warn(`Unknown tray icon flavor: '${flavor}'. Using 'color' instead.`);
          flavor = 'color';
        }

        let iconPath;

        switch (flavor) {
          case 'light':
            iconPath = path.join(__dirname, require('../../assets/icons/trayLight.png'));
            break;
          case 'dark':
            iconPath = path.join(__dirname, require('../../assets/icons/trayDark.png'));
            break;
          case 'color':
            iconPath = path.join(__dirname, require('../../assets/icons/trayColor.png'));
            break;
          case 'black':
            iconPath = path.join(__dirname, require('../../assets/icons/trayBlack.png'));
            break;
          case 'white':
            iconPath = path.join(__dirname, require('../../assets/icons/trayWhite.png'));
            break;
        }

        this.tray = new Tray(iconPath);
      }

      this.tray.setToolTip('Kando');
    }

    const template: Array<Electron.MenuItemConstructorOptions> = [];

    // Add an entry for each menu.
    for (const menu of this.menuSettings.get('menus')) {
      const trigger =
        (this.backend.getBackendInfo().supportsShortcuts
          ? menu.shortcut
          : menu.shortcutID) || i18next.t('properties.common.not-bound');
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

    // Add an entry to pause or unpause the shortcuts.
    if (this.inhibitShortcuts) {
      template.push({
        label: i18next.t('main.un-inhibit-shortcuts'),
        click: () => {
          this.inhibitShortcuts = false;
          this.bindShortcuts();
          this.updateTrayMenu();
        },
      });
    } else {
      template.push({
        label: i18next.t('main.inhibit-shortcuts'),
        click: () => {
          this.inhibitShortcuts = true;
          this.backend.unbindAllShortcuts();
          this.updateTrayMenu();
        },
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
    // Cancel any ongoing window-hiding.
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    // On Windows, we have to remove the ignore-mouse-events property when
    // un-minimizing the window. See the hideWindow() method for more information on
    // this workaround
    if (process.platform === 'win32') {
      this.window.setIgnoreMouseEvents(false);
    }

    // On MacOS we need to ensure the window is on the current workspace before showing.
    // This is the fix to issue #461: https://github.com/kando-menu/kando/issues/461
    if (process.platform === 'darwin') {
      this.window.setVisibleOnAllWorkspaces(true, { skipTransformProcessType: true });
      setTimeout(() => {
        this.window.setVisibleOnAllWorkspaces(false, {
          skipTransformProcessType: true,
        });
      }, 100);
    }

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
  private async hideWindow() {
    return new Promise<void>((resolve) => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

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
      }, this.appSettings.get().menuOptions.fadeOutDuration);
    });
  }

  /**
   * This finds the path to a menu or sound theme's JSON or JSON5 file with the given
   * directory names. So this searches for a "directory/theme.json(5)" file. It will first
   * look for the theme in the user's data directory. If it is not found there, it will
   * look in the app's assets directory.
   *
   * If the theme is not found, an empty string is returned.
   *
   * @param directory The name of the directory where the theme is located. For now, this
   *   should be either "menu-themes" or "sound-themes".
   * @param theme The name of the theme's subdirectory.
   * @returns The absolute path to the menu theme's directory.
   */
  private async findThemePath(directory: string, theme: string) {
    const testPaths = [
      path.join(app.getPath('userData'), `${directory}/${theme}`),
      path.join(__dirname, `../renderer/assets/${directory}/${theme}`),
    ];

    const testFiles = ['theme.json', 'theme.json5'];

    for (const testPath of testPaths) {
      for (const testFile of testFiles) {
        const metaPath = path.join(testPath, testFile);
        const exists = await fs.promises
          .access(metaPath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          return metaPath;
        }
      }
    }

    return '';
  }

  /**
   * This finds the path to the given icon-theme directory name. If the theme is not
   * found, an empty string is returned. Kando will first look for the theme in the user's
   * data directory. If it is not found there, it will look in the app's assets
   * directory.
   *
   * @param theme The name of the icon theme's directory.
   * @returns The absolute path to the icon-theme directory.
   */
  private async findIconThemePath(theme: string) {
    const testPaths = [
      path.join(app.getPath('userData'), 'icon-themes'),
      path.join(__dirname, '../renderer/assets/icon-themes'),
    ];

    for (const testPath of testPaths) {
      const themePath = path.join(testPath, theme);
      const exists = await fs.promises
        .access(themePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        return themePath;
      }
    }

    console.error(`Icon theme "${theme}" not found. Will look ugly.`);

    return '';
  }

  /**
   * This returns a list of all image files in the given directory and its subdirectories.
   * The paths are relative to the icon theme directory.
   *
   * @param directory The directory to search for image files.
   * @returns A list of all image files in the directory.
   */
  private async listIconsRecursively(directory: string) {
    return new Promise<string[]>((resolve) => {
      fs.readdir(directory, { withFileTypes: true, recursive: true }, (err, files) => {
        if (err) {
          console.error(err);
          resolve([]);
          return;
        }

        // Filter by mimetype to only return image files.
        files = files.filter((file) => {
          if (!file.isFile()) {
            return false;
          }

          const mimeType = mime.lookup(file.name);
          return mimeType && mimeType.startsWith('image/');
        });

        // We return the relative path of the files to the icon theme directory.
        resolve(
          files.map((file) => path.relative(directory, path.join(file.path, file.name)))
        );
      });
    });
  }

  /**
   * This returns a list of all unique subdirectory names in the given directories. This
   * is used to find all available menu and icon themes.
   *
   * @returns A list of all unique subdirectory names.
   */
  private async listSubdirectories(paths: string[]) {
    const subdirectories = new Set<string>();

    for (const testPath of paths) {
      const exists = await fs.promises
        .access(testPath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const files = await fs.promises.readdir(testPath);
        for (const file of files) {
          const fileInfo = await fs.promises.stat(path.join(testPath, file));
          if (fileInfo.isDirectory()) {
            subdirectories.add(file);
          }
        }
      }
    }

    return Array.from(subdirectories);
  }

  /**
   * This loads the description of the menu theme with the given name. The description
   * includes the path to the CSS file of the theme. If the theme is not found, the
   * default theme is used instead.
   *
   * @param theme The name of the menu theme.
   * @returns The description of the menu theme.
   */
  private async loadMenuThemeDescription(theme: string) {
    let metaFile = await this.findThemePath('menu-themes', theme);

    if (!metaFile) {
      console.error(`Menu theme "${theme}" not found. Using default theme instead.`);
      metaFile = path.join(
        __dirname,
        `../renderer/assets/menu-themes/default/theme.json5`
      );
    }

    const content = await fs.promises.readFile(metaFile);
    const description = json5.parse(content.toString()) as IMenuThemeDescription;
    const directory = path.dirname(metaFile);
    description.id = path.basename(directory);
    description.directory = path.dirname(directory);
    return description;
  }

  /**
   * This loads the description of the sound theme with the given name. If the theme is
   * not found, an empty theme is used instead. In this case, an error message is printed
   * to the console except for the 'none' theme.
   *
   * @param theme The name of the sound theme.
   * @returns The description of the sound theme.
   */
  private async loadSoundThemeDescription(theme: string) {
    const metaFile = await this.findThemePath('sound-themes', theme);

    if (!metaFile) {
      if (theme !== 'none') {
        console.error(`Sound theme "${theme}" not found. No sounds will be played.`);
      }

      const description: ISoundThemeDescription = {
        id: 'none',
        name: 'None',
        directory: '',
        engineVersion: 1,
        themeVersion: '',
        author: '',
        license: '',
        sounds: {},
      };

      return description;
    }

    const content = await fs.promises.readFile(metaFile);
    const description = json5.parse(content.toString()) as ISoundThemeDescription;
    const directory = path.dirname(metaFile);
    description.id = path.basename(directory);
    description.directory = path.dirname(directory);
    return description;
  }

  /**
   * Depending on the operating system, we create a different example menu. The structure
   * of the menu is similar on all platforms, but the shortcuts and commands are
   * different.
   *
   * All menu configurations are stored in the `example-menus` directory.
   */
  private createExampleMenu(): IMenu {
    // To enable localization of the example menus, we need to lookup the strings with
    // i18next after loading the menu structure from JSON. i18next-parser cannot extract
    // the strings from JSON files, therefore we have to specify all strings from the
    // example menus here in a comment. This way, the parser will find them.
    /*
    i18next.t('example-menu.name')
    i18next.t('example-menu.apps.submenu')
    i18next.t('example-menu.apps.safari')
    i18next.t('example-menu.apps.web-browser')
    i18next.t('example-menu.apps.email')
    i18next.t('example-menu.apps.apple-music')
    i18next.t('example-menu.apps.gimp')
    i18next.t('example-menu.apps.paint')
    i18next.t('example-menu.apps.finder')
    i18next.t('example-menu.apps.file-browser')
    i18next.t('example-menu.apps.terminal')
    i18next.t('example-menu.web-links.submenu')
    i18next.t('example-menu.web-links.google')
    i18next.t('example-menu.web-links.kando-on-github')
    i18next.t('example-menu.web-links.kando-on-kofi')
    i18next.t('example-menu.web-links.kando-on-youtube')
    i18next.t('example-menu.web-links.kando-on-discord')
    i18next.t('example-menu.next-workspace')
    i18next.t('example-menu.clipboard.submenu')
    i18next.t('example-menu.clipboard.paste')
    i18next.t('example-menu.clipboard.copy')
    i18next.t('example-menu.clipboard.cut')
    i18next.t('example-menu.audio.submenu')
    i18next.t('example-menu.audio.next-track')
    i18next.t('example-menu.audio.play-pause')
    i18next.t('example-menu.audio.mute')
    i18next.t('example-menu.audio.previous-track')
    i18next.t('example-menu.windows.submenu')
    i18next.t('example-menu.windows.mission-control')
    i18next.t('example-menu.windows.toggle-maximize')
    i18next.t('example-menu.windows.tile-right')
    i18next.t('example-menu.windows.close-window')
    i18next.t('example-menu.windows.tile-left')
    i18next.t('example-menu.previous-workspace')
    i18next.t('example-menu.bookmarks.submenu')
    i18next.t('example-menu.bookmarks.downloads')
    i18next.t('example-menu.bookmarks.videos')
    i18next.t('example-menu.bookmarks.pictures')
    i18next.t('example-menu.bookmarks.documents')
    i18next.t('example-menu.bookmarks.desktop')
    i18next.t('example-menu.bookmarks.home')
    i18next.t('example-menu.bookmarks.music')
    */

    let menu: IMenu;

    if (process.platform === 'win32') {
      menu = require('./example-menus/windows.json');
    } else if (process.platform === 'darwin') {
      menu = require('./example-menus/macos.json');
    } else {
      menu = require('./example-menus/linux.json');
    }

    const translate = (item: IMenuItem) => {
      item.name = i18next.t(item.name);
      if (item.children) {
        for (const child of item.children) {
          translate(child);
        }
      }
    };

    translate(menu.root);

    return menu;
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

    // Up to Kando 1.1.0, there was a `stash` property in the menu settings. This was
    // changed to `templates` in Kando 1.2.0.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = this.menuSettings.getMutable() as any;
    if (settings.stash) {
      settings.templates = settings.stash;
      delete settings.stash;
    }
  }
}

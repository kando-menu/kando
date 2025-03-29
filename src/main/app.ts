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
import { ipcMain, shell, Tray, Menu, app, nativeTheme } from 'electron';
import i18next from 'i18next';

import { MenuWindow } from './menu-window';
import { SettingsWindow } from './settings-window';
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
  getDefaultAppSettings,
  getDefaultMenuSettings,
} from '../common';
import { Settings, DeepReadonly } from './utils/settings';
import { Notification } from './utils/notification';
import { UpdateChecker } from './utils/update-checker';
import { WMInfo } from './backends/backend';

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
  private menuWindow?: MenuWindow;
  private settingsWindow?: SettingsWindow;

  /** True if shortcuts are currently inhibited. */
  private inhibitShortcuts = false;

  /** This flag is used to determine if the bindShortcuts() method is currently running. */
  private bindingShortcuts = false;

  /**
   * This is the tray icon which is displayed in the system tray. In the future it will be
   * possible to disable this icon.
   */
  private tray: Tray;

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

  /** This contains the last WMInfo which was received. */
  private lastWMInfo?: WMInfo;

  /** This is called when the app is started. It initializes the backend and the window. */
  public async init() {
    // Bail out if the backend is not available.
    if (this.backend === null) {
      throw new Error('No backend found.');
    }

    await this.backend.init();

    // We load the settings from the user's home directory. If the settings file does not
    // exist, it will be created with the default values. The only special setting is the
    // transparentSettingsWindow setting which is set to true if the backend supports
    // transparent windows.
    this.appSettings = new Settings<IAppSettings>({
      file: 'config.json',
      directory: app.getPath('userData'),
      defaults: {
        ...getDefaultAppSettings(),
        transparentSettingsWindow:
          this.backend.getBackendInfo().shouldUseTransparentSettingsWindow,
      },
    });

    // We load the settings from the user's home directory. If the settings file does
    // not exist, it will be created with the default values.
    this.menuSettings = new Settings<IMenuSettings>({
      file: 'menus.json',
      directory: app.getPath('userData'),
      defaults: getDefaultMenuSettings(),
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

    // When the settings change, we need to rebind the shortcuts and update the
    // tray menu. Rebinding the shortcuts is only necessary when the window is currently
    // not shown. If the window is shown, the shortcuts are already unbound and will be
    // rebound when the window is hidden.
    this.menuSettings.onChange('menus', async () => {
      if (!this.menuWindow?.isVisible()) {
        await this.bindShortcuts();
      }
      this.updateTrayMenu();
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

    // We set the Activation Policy to Accessory so that Kando doesn't show in dock
    // or the CMD Tab App Switcher. This is only for MacOS.
    if (process.platform === 'darwin') {
      app.setActivationPolicy('accessory');
    }

    // Initialize the common IPC communication to the renderer process. This will be
    // available in both the menu window and the settings window.
    this.initCommonRendererAPI();

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

      // Show a notification if possible.
      Notification.show(
        'A new version of Kando is available!',
        'Get it from https://github.com/kando-menu/kando/releases.',
        () => {
          shell.openExternal('https://github.com/kando-menu/kando/releases');
        }
      );
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
   * Allow access to the app settings object.
   *
   * @returns The app settings object.
   */
  public getAppSettings() {
    return this.appSettings;
  }

  /**
   * Allow access to the menu settings object.
   *
   * @returns The menu settings object.
   */
  public getMenuSettings() {
    return this.menuSettings;
  }

  /**
   * Allow access to the backend object.
   *
   * @returns The backend object.
   */
  public getBackend() {
    return this.backend;
  }

  /**
   * Allow access to the last WMInfo object.
   *
   * @returns The last WMInfo object.
   */
  public getLastWMInfo() {
    return this.lastWMInfo;
  }

  /**
   * This is usually called when the user presses the shortcut. However, it can also be
   * called for other reasons, e.g. when the user runs the app a second time. It will get
   * the current window and pointer position and send them to the renderer process.
   *
   * @param request Required information to select correct menu.
   */
  public async showMenu(request: Partial<IShowMenuRequest>) {
    // Create and load the main window if it does not exist yet.
    if (!this.menuWindow) {
      this.menuWindow = new MenuWindow(this);
      await this.menuWindow.load();
    }

    this.backend
      .getWMInfo()
      .then((info) => {
        this.lastWMInfo = info;
        this.menuWindow.showMenu(request, info);
      })
      .catch((error) =>
        Notification.showError('Failed to show menu', error.message || error)
      );
  }

  /**
   * This is called when the user wants to open the settings. This can be either triggered
   * by the tray icon or by running a second instance of the app. We send the name of the
   * current application and window to the renderer. It will be used as an example in the
   * condition picker of the settings.
   */
  public showSettings() {
    // Focus the settings window if it is already open.
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new SettingsWindow(this.backend, this.appSettings);

    // Reset the member variable when the window is closed.
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = undefined;
    });
  }

  /** This is called when the --reload-menu-theme command line option is passed. */
  public reloadMenuTheme() {
    this.menuWindow?.webContents.send(
      `app-settings-changed-menuTheme`,
      this.appSettings.get('menuTheme'),
      this.appSettings.get('menuTheme')
    );
  }

  /** This is called when the --reload-sound-theme command line option is passed. */
  public reloadSoundTheme() {
    this.menuWindow?.webContents.send(
      `app-settings-changed-soundTheme`,
      this.appSettings.get('soundTheme'),
      this.appSettings.get('soundTheme')
    );
  }

  /**
   * Setup IPC communication with the renderer process. See ../renderer/preload.ts for
   * more information on the exposed functionality.
   */
  private initCommonRendererAPI() {
    // Allow the renderer to retrieve information about the backend.
    ipcMain.handle('settings-window.get-backend-info', () => {
      return this.backend.getBackendInfo();
    });

    // Allow the renderer to retrieve information about the current app version.
    ipcMain.handle('settings-window.get-version', () => {
      return {
        kandoVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        nodeVersion: process.versions.node,
      };
    });

    // This should return the index of the currently selected menu. For now, we just
    // return the index of a menu with the same name as the last menu. If the user uses
    // the same name for multiple menus, this will not work as expected.
    ipcMain.handle('settings-window.get-current-menu', () => {
      if (!this.menuWindow?.lastMenu) {
        return 0;
      }

      const index = this.menuSettings
        .get('menus')
        .findIndex((m) => m.root.name === this.menuWindow.lastMenu.root.name);

      return Math.max(index, 0);
    });

    // Allow the renderer to retrieve the path to the config directory.
    ipcMain.handle('settings-window.get-config-directory', () => {
      return app.getPath('userData');
    });

    // Allow the renderer to retrieve the path to the menu themes directory.
    ipcMain.handle('settings-window.get-menu-themes-directory', () => {
      return path.join(app.getPath('userData'), 'menu-themes');
    });

    // Allow the renderer to retrieve all available menu themes.
    ipcMain.handle('settings-window.get-all-menu-themes', async () => {
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

    // Show the web developer tools if requested.
    ipcMain.on('settings-window.show-dev-tools', () => {
      this.settingsWindow.webContents.openDevTools();
      this.menuWindow?.webContents.openDevTools();
    });

    // Reload the current menu theme if requested.
    ipcMain.on('settings-window.reload-menu-theme', async () => {
      this.reloadMenuTheme();
    });

    // Reload the current sound theme if requested.
    ipcMain.on('settings-window.reload-sound-theme', async () => {
      this.reloadSoundTheme();
    });
    // Once the settings is shown, we unbind all shortcuts to make sure that the
    // user can select the bound shortcuts in the settings.
    ipcMain.on('settings-window.unbind-shortcuts', () => {
      this.backend.unbindAllShortcuts();
    });

    // Print a message to the console of the host process.
    ipcMain.on('common.log', (event, message) => {
      console.log(message);
    });

    // We also allow getting the entire app settings object.
    ipcMain.handle('common.app-settings-get', () => this.appSettings.get());

    // Allow the renderer to alter the settings.
    ipcMain.on('common.app-settings-set', (event, settings) => {
      this.appSettings.set(settings);
    });

    // Tell the renderers when the app settings change.
    this.appSettings.onAnyChange((newSettings, oldSettings) => {
      this.menuWindow?.webContents.send(
        'common.app-settings-changed',
        newSettings,
        oldSettings
      );
      this.settingsWindow?.webContents.send(
        'common.app-settings-changed',
        newSettings,
        oldSettings
      );
    });

    // Allow the renderer to retrieve the settings.
    ipcMain.handle('common.menu-settings-get', () => this.menuSettings.get());

    // When there comes a menu-settings-set event from the renderer, we do not want to
    // trigger the menu-settings-changed event in the settings window again. This is
    // because the renderer already knows about the change. We have to send the change to
    // the menu window, though.
    let ignoreNextMenuSettingsChange = false;

    // Allow the renderer to alter the menu settings.
    ipcMain.on('common.menu-settings-set', (event, settings) => {
      ignoreNextMenuSettingsChange = true;
      this.menuSettings.set(settings);
    });

    // Tell the renderers when the menu settings change.
    this.menuSettings.onAnyChange((newSettings, oldSettings) => {
      this.menuWindow?.webContents.send(
        'common.menu-settings-changed',
        newSettings,
        oldSettings
      );

      if (ignoreNextMenuSettingsChange) {
        ignoreNextMenuSettingsChange = false;
        return;
      }

      this.settingsWindow?.webContents.send(
        'common.menu-settings-changed',
        newSettings,
        oldSettings
      );
    });

    // Allow the renderer to retrieve the i18next locales.
    ipcMain.handle('common.get-locales', () => {
      return {
        current: i18next.language,
        data: i18next.store.data,
        fallbackLng: i18next.options.fallbackLng,
      };
    });

    // Allow the renderer to retrieve all icons of all file icon themes.
    ipcMain.handle('common.get-icon-themes', async () => {
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
    ipcMain.handle('common.get-menu-theme', async () => {
      const useDarkVariant =
        this.appSettings.get('enableDarkModeForMenuThemes') &&
        nativeTheme.shouldUseDarkColors;
      return this.loadMenuThemeDescription(
        this.appSettings.get(useDarkVariant ? 'darkMenuTheme' : 'menuTheme')
      );
    });

    // Allow the renderer to retrieve the current menu theme override colors. We return
    // the colors for the current theme and for the dark theme if the user enabled dark
    // mode for menu themes and if the system is currently in dark mode.
    ipcMain.handle('common.get-current-menu-theme-colors', async () => {
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
    ipcMain.handle('common.get-is-dark-mode', () => {
      return nativeTheme.shouldUseDarkColors;
    });

    // Allow the renderer to be notified when the system theme changes.
    let darkMode = nativeTheme.shouldUseDarkColors;
    nativeTheme.on('updated', () => {
      if (darkMode !== nativeTheme.shouldUseDarkColors) {
        darkMode = nativeTheme.shouldUseDarkColors;
        this.menuWindow?.webContents.send('common.dark-mode-changed', darkMode);
        this.settingsWindow?.webContents.send('common.dark-mode-changed', darkMode);
      }
    });

    // Allow the renderer to retrieve the description of the current sound theme.
    ipcMain.handle('common.get-sound-theme', async () => {
      return this.loadSoundThemeDescription(this.appSettings.get('soundTheme'));
    });
  }

  /**
   * This updates the menu of the tray icon. It is called when the settings change or when
   * the tray icon flavor changes.
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
          this.showMenu({ name: menu.root.name });

          // We use the opportunity to check for updates. If an update is available, we show
          // a notification to the user. This notification is only shown once per app start.
          this.updateChecker.checkForUpdates();
        },
      });
    }

    template.push({ type: 'separator' });

    // Add an entry to show the settings.
    template.push({
      label: i18next.t('main.show-settings'),
      click: () => this.showSettings(),
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
      label: i18next.t('main.quit'),
      role: 'quit',
    });

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * This binds the shortcuts for all menus. It will unbind all shortcuts first. This
   * method is called once initially and then whenever the settings change.
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
            this.showMenu({ trigger: trigger });

            // We use the opportunity to check for updates. If an update is available, we show
            // a notification to the user. This notification is only shown once per app start.
            this.updateChecker.checkForUpdates();
          },
        });
      } catch (error) {
        Notification.showError(
          'Failed to bind shortcut ' + trigger,
          error.message || error
        );
      }
    }

    this.bindingShortcuts = false;
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
   * This migrates settings from an old version of Kando to the current version. This
   * method is called when the app is started.
   */
  private migrateSettings() {
    // Up to Kando 0.9.0, the `root` property of the menu was called `nodes`.
    {
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

    // Up to Kando 1.1.0, there was a `stash` property in the settings. This was
    // changed to `templates` in Kando 1.2.0 - 1.7.0. Later, the `stash` property was
    // re-introduced in Kando 1.8.0 but could only contain menu items (no entire menus).
    // So if there is any `stash` property, we remove all menus from it.
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = this.menuSettings.getMutable() as any;
      if (settings.stash) {
        settings.stash = settings.stash.filter(
          (item: IMenuItem | IMenu) => 'type' in item
        );
      }
    }

    // Up to Kando 1.8.0, there was a `templates` property in the menu settings. This was
    // removed. We we add all template menus as ordinary menus with a template tag. All
    // template menus items are moved to the `stash` property.
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = this.menuSettings.getMutable() as any;
      if (settings.templates) {
        for (const itemOrMenu of settings.templates) {
          // If there is a type property, it is a menu item. We move it to the stash.
          if (itemOrMenu.type) {
            if (!settings.stash) {
              settings.stash = [];
            }

            settings.stash.push(itemOrMenu);
          } else {
            // Else, it is a menu template. We add it as a menu with a template tag. Also
            // remove any bindings, so that the menu is not opened by a shortcut.
            itemOrMenu.tags = ['template'];
            itemOrMenu.shortcut = '';
            itemOrMenu.shortcutID = '';
            settings.menus.push(itemOrMenu);
          }
        }

        delete settings.templates;
      }
    }

    // Up to Kando 1.8.0, there was a settings.editorOptions.showEditorButtonVisible
    // property. This was changed to settings.hideSettingsButton.
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = this.appSettings.getMutable() as any;
      if (settings.editorOptions?.showEditorButtonVisible === false) {
        settings.hideSettingsButton = true;
        delete settings.editorOptions;
      }
    }

    // Up to Kando 1.8.0, there was a settings.sidebarVisible property. This was removed.
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = this.appSettings.getMutable() as any;
      if ('sidebarVisible' in settings) {
        delete settings.sidebarVisible;
      }
    }

    // Up to Kando 1.8.0, the following properties were stored in a settings.menuOptions
    // object. Later they became top-level properties.
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = this.appSettings.getMutable() as any;
      if (settings.menuOptions) {
        settings.centerDeadZone = settings.menuOptions.centerDeadZone;
        settings.minParentDistance = settings.menuOptions.minParentDistance;
        settings.dragThreshold = settings.menuOptions.dragThreshold;
        settings.fadeInDuration = settings.menuOptions.fadeInDuration;
        settings.fadeOutDuration = settings.menuOptions.fadeOutDuration;
        settings.enableMarkingMode = settings.menuOptions.enableMarkingMode;
        settings.enableTurboMode = settings.menuOptions.enableTurboMode;
        settings.hoverModeNeedsConfirmation =
          settings.menuOptions.hoverModeNeedsConfirmation;
        settings.gestureMinStrokeLength = settings.menuOptions.gestureMinStrokeLength;
        settings.gestureMinStrokeAngle = settings.menuOptions.gestureMinStrokeAngle;
        settings.gestureJitterThreshold = settings.menuOptions.gestureJitterThreshold;
        settings.gesturePauseTimeout = settings.menuOptions.gesturePauseTimeout;
        settings.fixedStrokeLength = settings.menuOptions.fixedStrokeLength;
        settings.rmbSelectsParent = settings.menuOptions.rmbSelectsParent;
        settings.enableGamepad = settings.menuOptions.enableGamepad;
        settings.gamepadBackButton = settings.menuOptions.gamepadBackButton;
        settings.gamepadCloseButton = settings.menuOptions.gamepadCloseButton;
        delete settings.menuOptions;
      }
    }
  }
}

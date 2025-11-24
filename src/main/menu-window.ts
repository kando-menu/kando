//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { BrowserWindow, screen, ipcMain, app } from 'electron';

import { DeepReadonly } from './settings';
import { ShowMenuRequest, Menu, MenuItem, WMInfo } from '../common';
import { ItemActionRegistry } from './item-actions/item-action-registry';
import { Notification } from './utils/notification';
import { KandoApp } from './app';

declare const MENU_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MENU_WINDOW_WEBPACK_ENTRY: string;

/**
 * This is the window which contains the pie menu. It is a transparent window which covers
 * the whole screen. It is not shown in any task bar and has no frame.
 */
export class MenuWindow extends BrowserWindow {
  /**
   * This contains the last menu which was shown. It is used to execute the selected
   * action.
   */
  public lastMenu?: DeepReadonly<Menu>;

  /**
   * This index is used to select the next menu from the list of menus which would match
   * the current request. If the sameShortcutBehavior is set to 'cycle', this index is
   * incremented each time the user presses the same shortcut again.
   */
  private menuIndex = 0;

  /** This is true if the window is currently visible. */
  private visible = false;

  /** This will resolve once the window has fully loaded. */
  private windowLoaded = new Promise<void>((resolve) => {
    ipcMain.on('menu-window.ready', () => {
      resolve();
    });
  });

  /** This timeout is used to hide the window after the fade-out animation. */
  private hideTimeout: NodeJS.Timeout = null;

  constructor(private kando: KandoApp) {
    const display = screen.getPrimaryDisplay();

    super({
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
        preload: MENU_WINDOW_PRELOAD_WEBPACK_ENTRY,
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
      type: kando.getBackend().getBackendInfo().menuWindowType,
      show: false,
    });

    // When the general settings change, we need to apply the zoom factor to the window.
    this.kando.getGeneralSettings().onChange('zoomFactor', (newValue) => {
      this.webContents.setZoomFactor(newValue);
    });

    // We set the focusable property of the window depending on the 'keepInputFocus'
    // setting. If this setting is true, the window will not take input focus when it is
    // shown. This will disable Turbo Mode but make interaction with other applications
    // easier.
    if (kando.getGeneralSettings().get('keepInputFocus')) {
      this.setFocusable(false);
    }

    this.kando.getGeneralSettings().onChange('keepInputFocus', (newValue) => {
      this.setFocusable(!newValue);
    });

    // We set the window to be always on top. This way, Kando will be visible even on
    // fullscreen applications.
    this.setAlwaysOnTop(true, 'screen-saver');
  }

  /**
   * This loads the menu window. It will load the menu renderer and set up the IPC
   * communication with it.
   *
   * @returns A promise which resolves once the window has fully loaded.
   */
  async load() {
    this.initMenuRendererAPI();

    await this.loadURL(MENU_WINDOW_WEBPACK_ENTRY);

    // Apply the stored zoom factor to the window.
    this.webContents.setZoomFactor(this.kando.getGeneralSettings().get('zoomFactor'));

    return this.windowLoaded;
  }

  /**
   * This is usually called when the user presses the shortcut. However, it can also be
   * called for other reasons, e.g. when the user runs the app a second time. It will get
   * the current window and pointer position and send them to the renderer process.
   *
   * @param request Required information to select correct menu.
   * @param info Information about current desktop environment.
   * @param systemIconsChanged True if the system icon theme has changed since the last
   *   time the menu was shown.
   */
  public showMenu(
    request: Partial<ShowMenuRequest>,
    info: WMInfo,
    systemIconsChanged: boolean
  ) {
    const sameShortcutBehavior = this.kando
      .getGeneralSettings()
      .get('sameShortcutBehavior');

    // If a menu is currently shown and the user presses the same shortcut again we will
    // either close the menu or show the next one with the same shortcut. There is also
    // the option to do nothing in this case, but in this case the menu's shortcut will be
    // inhibited and thus this method will not be called in the first place.
    if (this.isVisible()) {
      const useID = !this.kando.getBackend().getBackendInfo().supportsShortcuts;
      const lastTrigger = useID ? this.lastMenu.shortcutID : this.lastMenu.shortcut;

      if (lastTrigger && request.trigger === lastTrigger) {
        // If the 'sameShortcutBehavior' is set to 'close', we hide the menu.
        if (sameShortcutBehavior === 'close') {
          this.webContents.send('menu-window.hide-menu');
          return;
        }

        // If the 'sameShortcutBehavior' is set to 'cycle', we will show the next menu which
        // matches the current request.
        if (
          sameShortcutBehavior === 'cycle-from-first' ||
          sameShortcutBehavior === 'cycle-from-recent'
        ) {
          this.menuIndex += 1;
        }
      }
    } else if (sameShortcutBehavior === 'cycle-from-first') {
      // If the menu is not visible and the 'sameShortcutBehavior' is set to 'cycle-from-first',
      // we reset the menu index to 0. This way, the first menu will be shown again.
      this.menuIndex = 0;
    }

    // Select correct menu before showing it to user.
    const menu = this.chooseMenu(request, info);

    // If no menu was found, we can stop here.
    if (!menu) {
      console.log('No menu was found for the current conditions: ', info);
      return;
    }

    // We inhibit the shortcut of the menu (if any) so that key-repeat events can be
    // received by the renderer. These are necessary for the turbo-mode to work for
    // single-key shortcuts. The shortcut is restored when the window is hidden.
    //
    // If 'sameShortcutBehavior' is set to anything but 'nothing', we have to keep the
    // shortcut active so that we know when the user presses the shortcut again.
    if (!this.kando.allShortcutsInhibited() && sameShortcutBehavior === 'nothing') {
      const useID = !this.kando.getBackend().getBackendInfo().supportsShortcuts;
      const shortcut = useID ? menu.shortcutID : menu.shortcut;
      this.kando.getBackend().inhibitShortcuts([shortcut]);
    }

    // Store the last menu to be able to execute the selected action later. The WMInfo
    // will be passed to the action as well.
    this.lastMenu = menu;

    // On Windows, we have to show the window before we can move it. Otherwise, the
    // window will not be moved to the correct monitor.
    if (process.platform === 'win32') {
      this.show();

      // Also, there is this long-standing issue with Windows where the window is not
      // scaled correctly when it is moved to another monitor with a different DPI
      // scale: https://github.com/electron/electron/issues/10862
      // To work around this, we first move the window to the top-left corner of the
      // screen and make sure that it is only on this monitor by reducing its size to
      // 1x1 pixel. This seems to apply the correct DPI scaling. Afterward, we can
      // scale the window to the correct size.
      this.setBounds({
        x: info.workArea.x,
        y: info.workArea.y,
        width: 1,
        height: 1,
      });
    }

    // Move and resize the window to the work area of the screen where the pointer is.
    this.setBounds(info.workArea);

    // On all platforms except Windows, we show the window after we moved it.
    if (process.platform !== 'win32') {
      this.show();
    }

    // Usually, the menu is shown at the pointer position. However, if the menu is
    // centered, we show it in the center of the screen.
    const mousePosition = {
      x: (info.pointerX - info.workArea.x) / this.webContents.getZoomFactor(),
      y: (info.pointerY - info.workArea.y) / this.webContents.getZoomFactor(),
    };

    // We have to pass the size of the window to the renderer because window.innerWidth
    // and window.innerHeight are not reliable when the window has just been resized.
    // Also, we incorporate the zoom factor of the window so that the clamping to the
    // work area is done correctly.
    const windowSize = {
      x: info.workArea.width / this.webContents.getZoomFactor(),
      y: info.workArea.height / this.webContents.getZoomFactor(),
    };

    // Send the menu to the renderer process. If the menu is centered, we delay the
    // turbo mode. This way, a key has to be pressed first before the turbo mode is
    // activated. Else, the turbo mode would be activated immediately when the menu is
    // opened which is not nice if it is not opened at the pointer position.
    // We also send the name of the current application and window to the renderer.
    // It will be used as an example in the condition picker of the settings.
    this.webContents.send(
      'menu-window.show-menu',
      this.lastMenu.root,
      {
        mousePosition,
        windowSize,
        zoomFactor: this.webContents.getZoomFactor(),
        centeredMode: this.lastMenu.centered,
        anchoredMode: this.lastMenu.anchored,
        hoverMode: this.lastMenu.hoverMode,
        systemIconsChanged,
      },
      {
        appName: info.appName,
        windowName: info.windowName,
        windowPosition: {
          x: info.workArea.x,
          y: info.workArea.y,
        },
      }
    );
  }

  /** This shows the window. */
  public override show() {
    // Cancel any ongoing window-hiding.
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    // On Windows, we have to remove the ignore-mouse-events property when un-minimizing
    // the window. See the hide() method for more information on this workaround.
    if (process.platform === 'win32') {
      this.setIgnoreMouseEvents(false);
    }

    // On MacOS we need to ensure the window is on the current workspace before showing.
    // This is the fix to issue #461: https://github.com/kando-menu/kando/issues/461
    if (process.platform === 'darwin') {
      this.setVisibleOnAllWorkspaces(true, { skipTransformProcessType: true });
      setTimeout(() => {
        this.setVisibleOnAllWorkspaces(false, {
          skipTransformProcessType: true,
        });
      }, 100);
    }

    super.show();

    // There seems to be an issue with GNOME Shell 44.1 where the window does not
    // get focus when it is shown. This is a workaround for that issue.
    setTimeout(() => {
      this.focus();
    }, 100);

    this.visible = true;
  }

  /**
   * This hides the window. It will wait for the fade-out animation to finish before
   * actually hiding the window.
   */
  public override hide() {
    if (this.isVisible()) {
      this.webContents.send('menu-window.hide-menu');
      this.visible = false;
    }
  }

  /**
   * If the fade-out animation is currently running, this already returns false.
   *
   * @returns Returns true if the menu window is currently visible and not fading out.
   */
  public override isVisible() {
    return this.visible;
  }

  /**
   * This hides the window. This method also accepts a delay parameter which can be used
   * to delay the hiding of the window. This is useful when we want to show a fade-out
   * animation.
   *
   * When Electron windows are hidden, input focus is not necessarily returned to the
   * topmost window below the hidden window. This is a problem if we want to simulate key
   * presses.
   *
   * - On Windows, we have to minimize the window instead. This leads to another issue:
   *   https://github.com/kando-menu/kando/issues/375. To make this weird little window
   *   really imperceptible, we make it ignore any mouse events.
   * - On macOS, we have to "hide the app" in order to properly restore input focus. We
   *   cannot do this when the settings are visible because this would hide them as well.
   *   So we only do this if the settings are not visible. Kind of bad, but seems to be
   *   the best solution...
   * - On Linux, it seems to work with a simple window.hide().
   *
   * See also: https://stackoverflow.com/questions/50642126/previous-window-focus-electron
   */
  private async hideWindow() {
    this.visible = false;

    return new Promise<void>((resolve) => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

      // Restore any shortcuts which were inhibited when the menu was shown. If the
      // shortcuts are inhibited globally (via the tray icon for instance), we do not
      // restore them here.
      if (!this.kando.allShortcutsInhibited()) {
        this.kando.getBackend().inhibitShortcuts([]);
      }

      this.hideTimeout = setTimeout(() => {
        if (process.platform === 'win32') {
          this.setIgnoreMouseEvents(true);
          this.minimize();
        } else if (process.platform === 'darwin') {
          super.hide();
          if (!this.kando.isSettingsDialogVisible()) {
            app.hide();
          }
        } else {
          super.hide();
        }

        this.hideTimeout = null;

        resolve();
      }, this.kando.getGeneralSettings().get().fadeOutDuration);
    });
  }

  /**
   * This chooses the correct menu depending on the environment.
   *
   * If the request contains a menu name, this menu is chosen. If no menu with the given
   * name is found, an exception is thrown. If there are multiple menus with the same
   * name, the first one is chosen. No other conditions are checked in this case.
   *
   * If the request contains a trigger (shortcut or shortcutID), a list of menus bound to
   * this trigger is assembled and the menu with the best matching conditions is chosen.
   * If no menu with the given trigger is found, null is returned.
   *
   * If neither a menu name nor a trigger is given, null is returned.
   *
   * @param request Required information to select correct menu.
   * @param info Information about current desktop environment.
   * @returns The selected menu or null if no menu was found.
   */
  public chooseMenu(request: Partial<ShowMenuRequest>, info: WMInfo) {
    // Get list of current menus.
    const menus = this.kando.getMenuSettings().get('menus');

    // We check if the request has a menu name. If that's the case we return it as chosen
    // menu, there's no need to check the rest.
    if (request.name != null) {
      const menu = menus.find((m) => m.root.name === request.name);
      if (menu) {
        return menu;
      }

      throw new Error(`Menu with name "${request.name}" not found.`);
    }

    // If no trigger is given, we can stop here.
    if (request.trigger == null) {
      return null;
    }

    // Store scores for all menus which match the trigger.
    const scores: number[] = [];

    const useID = !this.kando.getBackend().getBackendInfo().supportsShortcuts;

    menus.forEach((menu, index) => {
      scores[index] = 0;

      // If the trigger matches, we set the score to 1. Else we skip this menu.
      const trigger = useID ? menu.shortcutID : menu.shortcut;
      if (request.trigger === trigger) {
        scores[index] += 1;
      } else {
        return;
      }

      // If no conditions are given, we can stop here. The menu is a solid candidate.
      if (!menu.conditions) {
        return;
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
          scores[index] += 1;
        } else {
          scores[index] = 0;
          return;
        }
      }

      // We do the same for windowName condition.
      if (menu.conditions.windowName) {
        if (testStringCondition(menu.conditions.windowName, info.windowName)) {
          scores[index] += 1;
        } else {
          scores[index] = 0;
          return;
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
          scores[index] += 1;
        } else {
          scores[index] = 0;
          return;
        }
      }
    });

    // Find the highest score.
    let maxScore = 0;
    for (const score of scores) {
      if (score > maxScore) {
        maxScore = score;
      }
    }

    // If no menu has a score greater than 0, we return null.
    if (maxScore === 0) {
      return null;
    }

    // Assemble a list of all menus which have the highest score.
    const bestMenus: DeepReadonly<Menu>[] = [];
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] === maxScore) {
        bestMenus.push(menus[i]);
      }
    }

    // If the sameShortcutBehavior is set to 'cycle', we select the menu at the current
    // index. If the index is out of bounds, we wrap around to the first menu.
    const behavior = this.kando.getGeneralSettings().get('sameShortcutBehavior');
    if (behavior === 'cycle-from-first' || behavior === 'cycle-from-recent') {
      return bestMenus[this.menuIndex % bestMenus.length];
    }

    // Else, we select the first menu from the list of best menus.
    return bestMenus[0];
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
  private getMenuItemAtPath(root: DeepReadonly<MenuItem>, path: string) {
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
   * Setup IPC communication with the renderer process. See
   * ../menu-renderer/menu-window-api.ts for the corresponding renderer API.
   */
  private initMenuRendererAPI() {
    // Move the mouse pointer. This is used to move the pointer to the center of the
    // menu when the menu is opened too close to the screen edge.
    ipcMain.on('menu-window.move-pointer', (event, dist) => {
      let scale = 1;

      // On macOS, the pointer movement seems to be scaled automatically. We have to
      // scale the movement manually on other platforms.
      if (os.platform() !== 'darwin') {
        const bounds = this.getBounds();
        const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
        scale = display.scaleFactor;
      }

      // Regardless of the platform, we have to scale the movement to the zoom factor of
      // the window.
      scale *= this.webContents.getZoomFactor();

      this.kando
        .getBackend()
        .movePointer(Math.floor(dist.x * scale), Math.floor(dist.y * scale));
    });

    // When the user selects an item, we execute the corresponding action. Depending on
    // the action, we might need to wait for the fade-out animation to finish before we
    // execute the action.
    ipcMain.on('menu-window.select-item', (event, path) => {
      const execute = (item: DeepReadonly<MenuItem>) => {
        ItemActionRegistry.getInstance()
          .execute(item, this.kando)
          .catch((error) => {
            Notification.show({
              title: 'Failed to execute action',
              message: error instanceof Error ? error.message : error,
              type: 'error',
            });
          });
      };

      let item: DeepReadonly<MenuItem>;
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
        Notification.show({
          title: 'Failed to select item',
          message: error instanceof Error ? error.message : error,
          type: 'error',
        });
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

    // When the user hovers a menu item, we report this to the main process.
    ipcMain.on('menu-window.hover-item', (/*event, path*/) => {
      // Nothing to do here yet.
    });

    // When the user unhovers a menu item, we report this to the main process.
    ipcMain.on('menu-window.unhover-item', (/*event, path*/) => {
      // Nothing to do here yet.
    });

    // We do not hide the window immediately when the user aborts a selection. Instead, we
    // wait for the fade-out animation to finish.
    ipcMain.on('menu-window.cancel-selection', () => {
      this.hideWindow();
    });

    // Show the settings window when the user clicks on the settings button in the menu.
    ipcMain.on('menu-window.show-settings', () => {
      this.kando.showSettings();
    });
  }
}

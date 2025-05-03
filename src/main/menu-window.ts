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

import { DeepReadonly } from './utils/settings';
import { IShowMenuRequest, IMenu, IMenuItem, IWMInfo } from '../common';
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
  public lastMenu?: DeepReadonly<IMenu>;

  /**
   * This contains the request for the current menu. It is used to save the current menu
   * request when the 'cycle' sameShortcutBehavior is enabled.
   */
  private lastRequest?: IShowMenuRequest;

  /** This will resolve once the window has fully loaded. */
  private windowLoaded = new Promise<void>((resolve) => {
    ipcMain.on('menu-window.ready', () => {
      resolve();
    });
  });

  /** This timeout is used to hide the window after the fade-out animation. */
  private hideTimeout: NodeJS.Timeout;
  sameShortcutBehavior: string;

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

    // Save some settings when the app is closed.
    app.on('before-quit', () => {
      // Save the current zoom factor to the settings.
      this.kando.getGeneralSettings().set(
        {
          zoomFactor: this.webContents.getZoomFactor(),
        },
        false
      );
    });

    // Remove the default menu. This disables all default shortcuts like CMD+W which are
    // not needed in Kando.
    this.setMenu(null);

    // However, we still want to allow the user to zoom the menu using Ctrl+, Ctrl-, and
    // Ctrl+0. We have to handle these shortcuts manually.
    this.webContents.on('before-input-event', (event, input) => {
      if (input.control && (input.key === '+' || input.key === '-')) {
        let zoomFactor = this.webContents.getZoomFactor();
        zoomFactor = input.key === '+' ? zoomFactor + 0.1 : zoomFactor - 0.1;
        this.kando.getGeneralSettings().set({ zoomFactor });
        event.preventDefault();
      }

      if (input.control && input.key === '0') {
        this.kando.getGeneralSettings().set({ zoomFactor: 1 });
        event.preventDefault();
      }

      // We prevent CMD+W to close the window.
      if (input.meta && input.key === 'w') {
        event.preventDefault();
      }
    });

    // We set the window to be always on top. This way, Kando will be visible even on
    // fullscreen applications.
    this.setAlwaysOnTop(true, 'screen-saver');
  }

  async load() {
    this.initMenuRendererAPI();

    await this.loadURL(MENU_WINDOW_WEBPACK_ENTRY);

    // Apply the stored zoom factor to the window.
    this.webContents.setZoomFactor(this.kando.getGeneralSettings().get('zoomFactor'));

    return this.windowLoaded;
  }

  /**
   * Gets the next menu from an array of menus using the current menu.
   *
   * @param menus A list of menus.
   * @param menu The current menu.
   * @returns A menu or undefined.
   */
  async getNextMenu(
    menus: readonly DeepReadonly<IMenu>[],
    menu: DeepReadonly<IMenu>
  ): Promise<DeepReadonly<IMenu> | undefined> {
    if (!menus || menus.length === 0) {
      return undefined;
    }

    const currentIndex = menus.indexOf(menu);

    if (currentIndex === -1) {
      return undefined;
    }

    const nextIndex = (currentIndex + 1) % menus.length;
    return menus[nextIndex];
  }

  /**
   * This is usually called when the user presses the shortcut. However, it can also be
   * called for other reasons, e.g. when the user runs the app a second time. It will get
   * the current window and pointer position and send them to the renderer process.
   *
   * @param request Required information to select correct menu.
   * @param info Information about current desktop environment.
   */
  public async showMenu(request: Partial<IShowMenuRequest>, info: IWMInfo) {
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
    const useID = !this.kando.getBackend().getBackendInfo().supportsShortcuts;
    const newTrigger = useID ? menu.shortcutID : menu.shortcut;
    const oldTrigger = useID ? this.lastMenu?.shortcutID : this.lastMenu?.shortcut;

    // First, unbind the trigger for the new menu.
    if (newTrigger) {
      this.kando.getBackend().unbindShortcut(newTrigger);
    }

    this.sameShortcutBehavior = this.kando
      .getGeneralSettings()
      .get('sameShortcutBehavior');

    if (this.sameShortcutBehavior == 'cycle') {
      this.lastRequest = { trigger: newTrigger, name: menu.root.name };

      const menus = this.kando
        .getMenuSettings()
        .get('menus')
        .filter((menu) => {
          return menu.shortcut == newTrigger || menu.shortcutID == newTrigger;
        });

      const nextMenu = await this.getNextMenu(menus, menu);

      if (nextMenu) {
        const newRequest = { trigger: newTrigger, name: nextMenu.root.name };

        try {
          await this.kando.getBackend().bindShortcut({
            trigger: newTrigger,
            action: () => {
              this.kando.showMenu(newRequest);
            },
          });
        } catch (error) {
          Notification.showError(
            'Failed to bind shortcut ' + newTrigger,
            error.message || error
          );
        }
      }
    } else if (this.sameShortcutBehavior == 'close') {
      try {
        await this.kando.getBackend().bindShortcut({
          trigger: newTrigger,
          action: async () => {
            await this.hide();
          },
        });
      } catch (error) {
        Notification.showError(
          'Failed to bind shortcut ' + newTrigger,
          error.message || error
        );
      }
    }
    // If old and new trigger are the same, we don't need to rebind it. If the
    // hideTimeout is set, the window is about to be hidden and the shortcuts have
    // been rebound already.
    else if (this.sameShortcutBehavior == 'nothing') {
      if (
        oldTrigger &&
        oldTrigger != newTrigger &&
        this.isVisible() &&
        !this.hideTimeout
      ) {
        this.kando.getBackend().bindShortcut({
          trigger: oldTrigger,
          action: () => {
            this.kando.showMenu({ trigger: oldTrigger });
          },
        });
      }
    }

    // Store the last menu to be able to execute the selected action later. The IWMInfo
    // will be passed to the action as well.
    this.lastMenu = menu;

    // Get the work area of the screen where the pointer is located. We will move the
    // window to this screen and show the menu at the pointer position.
    const workarea = screen.getDisplayNearestPoint({
      x: info.pointerX,
      y: info.pointerY,
    }).workArea;

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
        x: workarea.x,
        y: workarea.y,
        width: 1,
        height: 1,
      });
    }

    // Move and resize the window to the work area of the screen where the pointer is.
    this.setBounds({
      x: workarea.x,
      y: workarea.y,
      width: workarea.width,
      height: workarea.height,
    });

    // On all platforms except Windows, we show the window after we moved it.
    if (process.platform !== 'win32') {
      this.show();
    }

    // Usually, the menu is shown at the pointer position. However, if the menu is
    // centered, we show it in the center of the screen.
    const mousePosition = {
      x: (info.pointerX - workarea.x) / this.webContents.getZoomFactor(),
      y: (info.pointerY - workarea.y) / this.webContents.getZoomFactor(),
    };

    // We have to pass the size of the window to the renderer because window.innerWidth
    // and window.innerHeight are not reliable when the window has just been resized.
    // Also, we incorporate the zoom factor of the window so that the clamping to the
    // work area is done correctly.
    const windowSize = {
      x: workarea.width / this.webContents.getZoomFactor(),
      y: workarea.height / this.webContents.getZoomFactor(),
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
  }

  /** This shows the window. */
  public show() {
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
  public async hide() {
    return new Promise<void>((resolve) => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

      this.hideTimeout = setTimeout(() => {
        if (process.platform === 'win32') {
          this.setIgnoreMouseEvents(true);
          this.minimize();
        } else if (process.platform === 'darwin') {
          app.hide();
        } else {
          super.hide();
        }

        this.hideTimeout = null;

        // Need to set the next shortcut after the menu is hidden to ensure it doesn't re-open
        // if the sameShortcutBehavior is set to 'close'.
        const useID = !this.kando.getBackend().getBackendInfo().supportsShortcuts;
        const lastTrigger = useID ? this.lastMenu.shortcutID : this.lastMenu.shortcut;

        this.kando.getBackend().unbindShortcut(lastTrigger);

        if (lastTrigger) {
          this.kando.getBackend().bindShortcut({
            trigger: lastTrigger,
            action: () => {
              this.kando.showMenu(this.lastRequest ?? { trigger: lastTrigger });
            },
          });
        }

        resolve();
      }, this.kando.getGeneralSettings().get().fadeOutDuration);
    });
  }

  /**
   * This chooses the correct menu depending on the environment.
   *
   * If the request contains a menu name, this menu is chosen. If no menu with the given
   * name is found, an exception is thrown. No other conditions are checked in this case.
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
  public chooseMenu(request: Partial<IShowMenuRequest>, info: IWMInfo) {
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

    // Score of currently selected menu.
    let currentScore = 0;

    // Currently best matching menu.
    let selectedMenu: DeepReadonly<IMenu>;

    for (const menu of menus) {
      let menuScore = 0;

      // Then we check if menu trigger matches our request, if not we skip this menu.
      if (request.trigger != menu.shortcut && request.trigger != menu.shortcutID) {
        continue;
      }

      // If no other menu matches, we will choose the first one with no conditions set.
      if (!menu.conditions || Object.keys(menu.conditions).length === 0) {
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
      // as it matches more conditions than the previous selection.
      if (menuScore > currentScore) {
        selectedMenu = menu;
        currentScore = menuScore;
      }
    }

    // We finally return our last selected menu as chosen.
    return selectedMenu;
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
      const execute = (item: DeepReadonly<IMenuItem>) => {
        ItemActionRegistry.getInstance()
          .execute(item, this.kando)
          .catch((error) => {
            Notification.showError('Failed to execute action', error.message || error);
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
        Notification.showError('Failed to select item', error.message);
      }

      // Also wait with the execution of the selected action until the fade-out
      // animation is finished to make sure that any resulting events (such as virtual
      // key presses) are not captured by the window.
      this.hide().then(() => {
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
      this.hide();
    });

    // Show the settings window when the user clicks on the settings button in the menu.
    ipcMain.on('menu-window.show-settings', () => {
      this.kando.showSettings();
    });
  }
}

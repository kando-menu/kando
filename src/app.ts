//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, BrowserWindow, ipcMain } from "electron";
import os from "node:os";
import { Backend, getBackend } from "./backend";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

export class KenDoApp {
  // The backend is responsible for all the system interaction. It is implemented
  // differently for each platform.
  private backend: Backend = getBackend();
  private window: BrowserWindow = null;

  public async init() {
    await this.backend.init();
    await this.backend.bindShortcut("Shift+CommandOrControl+K", () => {
      this.showMenu();
    });

    this.window = await this.initWindow();

    this.initRenderer();
  }

  // This is called when the app is closed. It will unbind all shortcuts.
  public async quit() {
    await this.backend.unbindAllShortcuts();
  }

  // This creates the main window. It is a transparent window which covers the whole
  // screen. It is always on top and has no frame. It is used to display the pie menu.
  private async initWindow() {
    const display = screen.getPrimaryDisplay();

    const windowTypes = new Map<string, string>([
      ["linux", "dock"],
      ["win32", "toolbar"],
      ["darwin", "panel"],
    ]);

    const window = new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      transparent: true,
      resizable: false,
      frame: false,
      alwaysOnTop: true,
      x: 0,
      y: 0,
      width: display.workAreaSize.width + 1,
      height: display.workAreaSize.height + 1,
      type: windowTypes.get(os.platform()),
      show: false,
    });

    await window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    return window;
  }

  // Setup IPC communication with the renderer process.
  private initRenderer() {
    ipcMain.on("show-dev-tools", () => {
      this.window.webContents.openDevTools();
    });

    ipcMain.on("hide-window", () => {
      this.window.hide();
    });

    ipcMain.on("item-selected", () => {
      console.log("Red circle was clicked!");
    });

    ipcMain.on("log", (event, message) => {
      console.log(message);
    });

    ipcMain.on("simulate-shortcut", () => {
      this.window.hide();

      if (os.platform() === "win32") {
        this.backend.simulateShortcut("Ctrl+Alt+Tab");
      } else {
        this.backend.simulateShortcut("Ctrl+Alt+Right");
      }
    });
  }

  // This is called when the user presses the shortcut. It will get the current
  // window and pointer position and send them to the renderer process.
  private showMenu() {
    Promise.all([this.backend.getFocusedWindow(), this.backend.getPointer()])
      .then(([window, pointer]) => {
        this.window.webContents.send("set-window-info", window);
        this.window.webContents.send("show-menu", pointer);
        this.window.show();
      })
      .catch((err) => {
        console.error("Failed to show menu: " + err);
      });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/** A display work area used to position and size the menu window. */
export type MenuWindowWorkArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Builds the BrowserWindow constructor options for the fullscreen transparent pie-menu
 * window.
 *
 * @param workArea The display work area the menu should cover.
 * @param menuWindowType Backend-specific Electron window type.
 * @param preload Path to the menu-window preload script.
 * @returns Options passed to the MenuWindow BrowserWindow constructor.
 */
export function buildMenuWindowOptions(
  workArea: MenuWindowWorkArea,
  menuWindowType: string,
  preload: string
) {
  return {
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
      preload,
      spellcheck: false,
    },
    transparent: true,
    skipTaskbar: true,
    frame: false,
    hasShadow: false,
    x: workArea.x,
    y: workArea.y,
    width: workArea.width + 1,
    height: workArea.height + 1,
    type: menuWindowType,
    show: false,
    // A resizable frameless window still shows the macOS resize cursor at its edges.
    // The menu covers the work area, so those edges sit on the screen edges.
    resizable: false,
    movable: false,
  };
}

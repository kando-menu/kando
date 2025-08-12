//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export * from './menu-settings';
export * from './general-settings';
export * from './sound-theme-description';
export * from './menu-theme-description';

/** This interface is used to pass command line arguments to the app. */
export interface ICommandlineOptions {
  // This optional parameter is specified using the --menu option. It is used to show a
  // menu when the app or a second instance of the app is started.
  menu?: string;

  // This optional parameter is specified using the --settings option. It is used to show
  // the settings when the app or a second instance of the app is started.
  settings?: boolean;

  // This optional parameter is specified using the --reload-menu-theme option. It is used
  // to reload the current menu theme from disk.
  reloadMenuTheme?: boolean;

  // This optional parameter is specified using the --reload-sound-theme option. It is
  // used to reload the current sound theme from disk.
  reloadSoundTheme?: boolean;
}

/**
 * A simple 2D vector.
 *
 * You can find some vector math in the `src/renderer/math` directory.
 */
export interface IVec2 {
  x: number;
  y: number;
}

/** This interface describes some information about the currently used backend. */
export interface IBackendInfo {
  /**
   * The name of the backend. This is shown in the user interface so that users can see
   * which backend is currently active.
   */
  name: string;

  /**
   * Each backend should return a suitable window type here. The window type determines
   * how Kando's menu window is drawn. The most suitable type is dependent on the
   * operating system and the window manager. For example, on GNOME, the window type
   * "dock" seems to work best, on KDE "toolbar" provides a better experience. On Windows,
   * "toolbar" is the only type that works.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * @returns The window type to use for the pie menu window.
   */
  menuWindowType: string;

  /**
   * There are some backends which do not support custom shortcuts. In this case, the user
   * will not be able to change the shortcuts in the settings. Instead, the user will set
   * a shortcut ID and then assign a shortcut in the operating system.
   */
  supportsShortcuts: boolean;

  /**
   * This hint is shown in the settings next to the shortcut-id input field if
   * supportsShortcuts is false. It should very briefly explain how to change the
   * shortcuts in the operating system. If supportsShortcuts is true, this is not
   * required.
   */
  shortcutHint?: string;

  /** This determines whether the settings window should use transparency per default. */
  shouldUseTransparentSettingsWindow: boolean;
}

/** This interface describes some information about the current version of Kando. */
export interface IVersionInfo {
  kandoVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

/**
 * This interface is used to transfer information required from the window manager when
 * opening the pie menu. It contains the name of the currently focused app / window, the
 * current pointer position, and the screen area where a maximized window can be placed.
 * That is the screen resolution minus the taskbar and other panels.
 */
export interface IWMInfo {
  windowName: string;
  appName: string;
  pointerX: number;
  pointerY: number;
  workArea: Electron.Rectangle;
}

/**
 * This interface is used to transfer information about the system to the renderer
 * process. It will determine the visibility of some UI elements and the availability of
 * some features.
 */
export interface ISystemInfo {
  /** Whether the system supports launching isolated processes. */
  supportsIsolatedProcesses: boolean;
}

/** This interface describes a icon theme consisting of a collection of icon files. */
export interface IFileIconThemeDescription {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the icon theme.
   */
  name: string;

  /**
   * The absolute path to the directory where the theme is stored, including the name as
   * the last part of the path.
   */
  directory: string;

  /**
   * A list of all available icons in this theme. These are the filenames of the icons
   * relative to the theme directory. In case of nested directories, the filenames can
   * actually be paths.
   */
  icons: string[];
}

/**
 * This interface is used to pass information about all available icon themes to the
 * renderer process.
 */
export interface IIconThemesInfo {
  /** The absolute path to the directory where the user may store custom icon themes. */
  userIconDirectory: string;

  /** All available file icon themes. */
  fileIconThemes: IFileIconThemeDescription[];
}

/**
 * This interface is used to describe an element of a key sequence. It contains the DOM
 * name of the key, a boolean indicating whether the key is pressed or released and a
 * delay in milliseconds.
 */
export interface IKeyStroke {
  name: string;
  down: boolean;
  delay: number;
}

/**
 * This type is used to describe a sequence of key strokes. It is used to simulate
 * keyboard shortcuts.
 */
export type IKeySequence = Array<IKeyStroke>;

/**
 * There are different reasons why a menu should be shown. This interface is used to
 * describe the request to show a menu. A menu can be shown because a shortcut was pressed
 * (in this case `trigger` will be the shortcut or the shortcut ID) or because a menu was
 * requested by name.
 */
export interface IShowMenuRequest {
  trigger: string;
  name: string;
}

/**
 * This interface is used to describe the additional information that is passed to the
 * Menu's `show()` method from the main to the renderer process.
 */
export interface IShowMenuOptions {
  /**
   * The position of the mouse cursor when the menu was opened. Relative to the top left
   * corner of the window.
   */
  mousePosition: IVec2;

  /**
   * The size of the window. Usually, this is the same as window.innerWidth and
   * window.innerHeight. However, when the window was just resized, this can be different.
   * Therefore, we need to pass it from the main process.
   */
  windowSize: IVec2;

  /**
   * The scale factor of the menu. This is required to compute the correct position of the
   * menu.
   */
  zoomFactor: number;

  /**
   * If this is set, the menu will be opened in the screen's center. Else it will be
   * opened at the mouse pointer.
   */
  centeredMode: boolean;

  /**
   * If this is set, the menu will be "anchored". This means that any submenus will be
   * opened at the same position as the parent menu.
   */
  anchoredMode: boolean;

  /**
   * If this is set, the menu will be in "hover mode". This means that the menu items can
   * be selected by only hovering over them.
   */
  hoverMode: boolean;

  /**
   * If this is set, the system-icon theme has changed since the last time the menu was
   * opened. This is used to determine if the menu needs to be reloaded.
   */
  systemIconsChanged: boolean;
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export * from './settings-schemata/menu-settings-v1';
export * from './settings-schemata';

/** This type is used to pass command line arguments to the app. */
export type CommandlineOptions = {
  // This optional parameter is specified using the --menu option. It is used to show a
  // menu when the app or a second instance of the app is started.
  readonly menu?: string;

  // This optional parameter is specified using the --settings option. It is used to show
  // the settings when the app or a second instance of the app is started.
  readonly settings?: boolean;

  // This optional parameter is specified using the --reload-menu-theme option. It is used
  // to reload the current menu theme from disk.
  readonly reloadMenuTheme?: boolean;

  // This optional parameter is specified using the --reload-sound-theme option. It is
  // used to reload the current sound theme from disk.
  readonly reloadSoundTheme?: boolean;

  // This optional parameter is specified using the --reload-icon-themes option. It is
  // used to reload the available icon themes from disk.
  readonly reloadIconThemes?: boolean;
};

/**
 * A simple 2D vector.
 *
 * You can find some vector math in the `src/renderer/math` directory.
 */
export type Vec2 = {
  x: number;
  y: number;
};

/** This type describes some information about the currently used backend. */
export type BackendInfo = {
  /**
   * The name of the backend. This is shown in the user interface so that users can see
   * which backend is currently active.
   */
  readonly name: string;

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
  readonly menuWindowType: string;

  /**
   * There are some backends which do not support custom shortcuts. In this case, the user
   * will not be able to change the shortcuts in the settings. Instead, the user will set
   * a shortcut ID and then assign a shortcut in the operating system.
   */
  readonly supportsShortcuts: boolean;

  /**
   * This hint is shown in the settings next to the shortcut-id input field if
   * supportsShortcuts is false. It should very briefly explain how to change the
   * shortcuts in the operating system. If supportsShortcuts is true, this is not
   * required.
   */
  readonly shortcutHint?: string;

  /** This determines whether the settings window should use transparency per default. */
  readonly shouldUseTransparentSettingsWindow: boolean;
};

/** This type describes some information about the current version of Kando. */
export type VersionInfo = {
  readonly kandoVersion: string;
  readonly electronVersion: string;
  readonly chromeVersion: string;
  readonly nodeVersion: string;
};

/**
 * This type is used to transfer information required from the window manager when opening
 * the pie menu. It contains the name of the currently focused app / window, the current
 * pointer position, and the screen area where a maximized window can be placed. That is
 * the screen resolution minus the taskbar and other panels.
 */
export type WMInfo = {
  readonly windowName: string;
  readonly appName: string;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly workArea: Electron.Rectangle;
};

/**
 * This type is used to transfer information about the system to the renderer process. It
 * will determine the visibility of some UI elements and the availability of some
 * features.
 */
export type SystemInfo = {
  /** Whether the system supports launching isolated processes. */
  readonly supportsIsolatedProcesses: boolean;
};

/** This type describes a icon theme consisting of a collection of icon files. */
export type FileIconThemeDescription = {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the icon theme.
   */
  readonly name: string;

  /**
   * The absolute path to the directory where the theme is stored, including the name as
   * the last part of the path.
   */
  readonly directory: string;

  /**
   * A list of all available icons in this theme. These are the filenames of the icons
   * relative to the theme directory. In case of nested directories, the filenames can
   * actually be paths.
   */
  readonly icons: string[];
};

/**
 * This type is used to pass information about all available icon themes to the renderer
 * process.
 */
export type IconThemesInfo = {
  /** The absolute path to the directory where the user may store custom icon themes. */
  readonly userIconDirectory: string;

  /** All available file icon themes. */
  readonly fileIconThemes: FileIconThemeDescription[];
};

/**
 * This type is used to describe an element of a key sequence. It contains the DOM name of
 * the key, a boolean indicating whether the key is pressed or released and a delay in
 * milliseconds.
 */
export type KeyStroke = {
  name: string;
  down: boolean;
  delay: number;
};

/**
 * This type is used to describe a sequence of key strokes. It is used to simulate
 * keyboard shortcuts.
 */
export type KeySequence = Array<KeyStroke>;

/**
 * There are different reasons why a menu should be shown. This type is used to describe
 * the request to show a menu. A menu can be shown because a shortcut was pressed (in this
 * case `trigger` will be the shortcut or the shortcut ID) or because a menu was requested
 * by name.
 */
export type ShowMenuRequest = {
  readonly trigger: string;
  readonly name: string;
};

/**
 * This type is used to describe the additional information that is passed to the Menu's
 * `show()` method from the main to the renderer process.
 */
export type ShowMenuOptions = {
  /**
   * The position of the mouse cursor when the menu was opened. Relative to the top left
   * corner of the window.
   */
  readonly mousePosition: Vec2;

  /**
   * The size of the window. Usually, this is the same as window.innerWidth and
   * window.innerHeight. However, when the window was just resized, this can be different.
   * Therefore, we need to pass it from the main process.
   */
  readonly windowSize: Vec2;

  /**
   * The scale factor of the menu. This is required to compute the correct position of the
   * menu.
   */
  readonly zoomFactor: number;

  /**
   * If this is set, the menu will be opened in the screen's center. Else it will be
   * opened at the mouse pointer.
   */
  readonly centeredMode: boolean;

  /**
   * If this is set, the menu will be "anchored". This means that any submenus will be
   * opened at the same position as the parent menu.
   */
  readonly anchoredMode: boolean;

  /**
   * If this is set, the menu will be in "hover mode". This means that the menu items can
   * be selected by only hovering over them.
   */
  readonly hoverMode: boolean;

  /**
   * If this is set, the system-icon theme has changed since the last time the menu was
   * opened. This is used to determine if the menu needs to be reloaded.
   */
  readonly systemIconsChanged: boolean;
};

/**
 * The description of a menu theme. These are the properties which can be defined in the
 * JSON file of a menu theme.
 */
export type MenuThemeDescription = {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the theme and is set by Kando when loading the theme.json
   * file. So the path to the theme.json file is this.directory/this.id/theme.json.
   */
  id: string;

  /**
   * The absolute path to the directory where the theme is stored. This is set by Kando
   * when loading the theme.json file.
   */
  directory: string;

  /** A human readable name of the theme. */
  readonly name: string;

  /** The author of the theme. */
  readonly author: string;

  /** The version of the theme. Should be a semantic version string like "1.0.0". */
  readonly themeVersion: string;

  /** The version of the Kando theme engine this theme is compatible with. */
  readonly engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  readonly license: string;

  /**
   * The maximum radius in pixels of a menu when using this theme. This is used to move
   * the menu away from the screen edges when it's opened too close to them. Default is
   * 150px.
   */
  readonly maxMenuRadius: number;

  /** The width of the text wrap in the center of the menu in pixels. Default is 90px. */
  readonly centerTextWrapWidth: number;

  /**
   * If this is true, children of a menu item will be drawn below the parent. Otherwise
   * they will be drawn above. Default is true.
   */
  readonly drawChildrenBelow: boolean;

  /**
   * If this is set to true, the center text of the menu will be drawn. This is the text
   * that is displayed in the center of the menu when it is opened. Default is true.
   */
  readonly drawCenterText: boolean;

  /**
   * If this is set to true, a full-screen div will be drawn below the menu with the CSS
   * class "selection-wedges". If any menu item is hovered, it will also receive the class
   * "hovered" and the "--start-angle" and "--end-angle" CSS properties will indicate
   * where the selected child is. Default is false.
   */
  readonly drawSelectionWedges: boolean;

  /**
   * If this is set to true, a full-screen div will be drawn below the menu with the CSS
   * class "wedge-separators". It will contain a div for each separator line between
   * adjacent wedges. They will have the "separator" class. Default is false.
   */
  readonly drawWedgeSeparators: boolean;

  /**
   * These colors will be available as var(--name) in the CSS file and can be adjusted by
   * the user in the settings. The map assigns a default CSS color to each name.
   */
  readonly colors: Record<string, string>;

  /**
   * The layers which are drawn on top of each other for each menu item. Each layer will
   * be a html div element with a class defined in the theme file. Also, each layer can
   * have a `content` property which can be used to make the layer contain the item's icon
   * or name.
   */
  readonly layers: {
    readonly class: string;
    readonly content: 'none' | 'name' | 'icon';
  }[];
};

/**
 * Sound themes can define different sounds for different actions. This enum is used to
 * identify the different sounds.
 */
export enum SoundType {
  eOpenMenu = 'openMenu',
  eCloseMenu = 'closeMenu',
  eSelectItem = 'selectItem',
  eSelectSubmenu = 'selectSubmenu',
  eSelectParent = 'selectParent',
  eHoverItem = 'hoverItem',
  eHoverSubmenu = 'hoverSubmenu',
  eHoverParent = 'hoverParent',
}

/**
 * This type is used to describe a sound effect. It contains the path to the sound file
 * and some optional properties like the volume and pitch shift.
 */
export type SoundEffect = {
  /** The path to the sound file. */
  readonly file: string;

  /** The volume of the sound. */
  readonly volume?: number;

  /** The maximum pitch shift. */
  readonly maxPitch?: number;

  /** The minimum pitch shift. */
  readonly minPitch?: number;
};

/**
 * This type is used to describe a sound theme. It contains the properties which can be
 * defined in the JSON file of a sound theme. All paths are relative to the theme
 * directory.
 */
export type SoundThemeDescription = {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the theme and is set by Kando when loading the theme.json
   * file. So the path to the theme.json file is this.directory/this.id/theme.json.
   */
  id: string;

  /**
   * The absolute path to the directory where the theme is stored. This is set by Kando
   * when loading the theme.json file.
   */
  directory: string;

  /** A human readable name of the theme. */
  readonly name: string;

  /** The author of the theme. */
  readonly author: string;

  /** The version of the theme. Should be a semantic version string like "1.0.0". */
  readonly themeVersion: string;

  /** The version of the Kando sound theme engine this theme is compatible with. */
  readonly engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  readonly license: string;

  /**
   * All available sound effects. If a given sound is not defined here, no sound will be
   * played for the corresponding action.
   */
  readonly sounds: Record<SoundType, SoundEffect>;
};

/**
 * This type is used to describe an installed application. When the settings window is
 * opened, it will query the host process for a list of all installed applications.
 */
export type AppDescription = {
  /**
   * Some unique identifier for the application. What that is depends on the backend.
   * Could be for instance the UWP app ID. If the backend is not able to provide a unique
   * ID, it may fall back to using the application command.
   */
  readonly id: string;

  /** The name of the application. */
  readonly name: string;

  /** The command to launch the application. */
  readonly command: string;

  /** The icon used for the application. */
  readonly icon: string;

  /** The icon theme used for the above icon. */
  readonly iconTheme: string;
};

/**
 * Each achievement can have one of three states. If it's 'locked', it will not be shown
 * in the user interface. Once some specific requirements are fulfilled, it will become
 * 'active' and eventually 'completed'.
 */
export enum AchievementState {
  eLocked = 0,
  eActive = 1,
  eCompleted = 2,
}

/**
 * An achievement represents a specific goal that the user can accomplish while using
 * Kando. Achievements are tracked based on specific statistics stored in the settings.
 */
export type Achievement = {
  /**
   * The name. Most achievements have multiple tiers. A {{tier}} in the localization will
   * be replaced by a corresponding roman number (e.g. I, II, III, IV or V), {{attribute}}
   * by a corresponding attribute like 'Novice' or 'Master'.
   */
  name: string;

  /** The explanation string. */
  description: string;

  /** A number between 0 and 1. */
  progress: number;

  /** One of the State values above. */
  state: AchievementState;

  /** If the achievement was completed, this contains the completion date as a string. */
  date: string;

  /** Absolute path to the background image for the badge. */
  badge: string;

  /** The icon drawn for the achievement. */
  icon: string;
};

/** This type is used to transfer the user's current level progress. */
export type LevelProgress = {
  /** The current level. */
  level: number;

  /** The current experience points. */
  xp: number;

  /** The total experience points required to reach the next level. */
  maxXp: number;

  /** All active achievements. */
  activeAchievements: Achievement[];

  /** All completed achievements. */
  completedAchievements: Achievement[];
};

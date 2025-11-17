//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { version } from '../../../package.json';

/**
 * Starting with Kando 2.1.0, we use zod to define the schema of the general settings.
 * This allows us to better validate the settings file.
 */
export const GENERAL_SETTINGS_SCHEMA_V1 = z.object({
  /**
   * The last version of Kando. This is used to determine whether the settings file needs
   * to be backed up and potentially migrated to a newer version.
   */
  version: z.string().default(version),

  /**
   * The locale to use. If set to 'auto', the system's locale will be used. If the locale
   * is not available, english will be used.
   */
  locale: z.string().default('auto'),

  /** If true, the introduction dialog will be shown when the settings window is opened. */
  showIntroductionDialog: z.boolean().default(true),

  /** The name of the theme to use for the menu. */
  menuTheme: z.string().default('default'),

  /** The name of the theme which should be used for the dark mode. */
  darkMenuTheme: z.string().default('default'),

  /**
   * The accent color overrides to use for menu themes. The outer key is the theme's ID,
   * the inner key is the color's name. The final value is the CSS color.
   */
  menuThemeColors: z.record(z.string(), z.record(z.string(), z.string())).default({}),

  /**
   * The accent color overrides to use for the dark mode. The outer key is the theme's ID,
   * the inner key is the color's name. The final value is the CSS color.
   */
  darkMenuThemeColors: z.record(z.string(), z.record(z.string(), z.string())).default({}),

  /**
   * If enabled, the dark menu theme and dark color variants will be used if the system is
   * in dark mode.
   */
  enableDarkModeForMenuThemes: z.boolean().default(false),

  /** The name of the current sound theme. */
  soundTheme: z.string().default('none'),

  /** The overall volume of the sound effects. */
  soundVolume: z.number().min(0).default(0.5),

  /** Set this to false to disable the check for new versions. */
  enableVersionCheck: z.boolean().default(true),

  /** Whether to silently handle read-only config files. */
  ignoreWriteProtectedConfigFiles: z.boolean().default(false),

  /** The color scheme of the settings window. */
  settingsWindowColorScheme: z.enum(['light', 'dark', 'system']).default('system'),

  /**
   * If set to a transparent style, the settings window will attempt to use some sort of
   * transparency. What that means exactly depends on the OS.
   */
  settingsWindowFlavor: z
    .enum([
      'auto',
      'sakura-light',
      'sakura-dark',
      'sakura-system',
      'transparent-light',
      'transparent-dark',
      'transparent-system',
    ])
    .default('auto'),

  /** The tray icon flavor. */
  trayIconFlavor: z
    .enum(['light', 'dark', 'color', 'black', 'white', 'none'])
    .default('color'),

  /** Enable GPU acceleration. */
  hardwareAcceleration: z.boolean().default(true),

  /** Whether to initialize the menu window when it is opened for the first time. */
  lazyInitialization: z.boolean().default(false),

  /** A scale factor for the menu. */
  zoomFactor: z.number().min(0.5).default(1),

  /** If true, the settings button will be hidden if not hovered. */
  hideSettingsButton: z.boolean().default(false),

  /** The position of the settings button. */
  settingsButtonPosition: z
    .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
    .default('bottom-right'),

  /** Clicking inside this radius will select the parent element. */
  centerDeadZone: z.number().min(0).default(50),

  /**
   * The distance in pixels at which the parent menu item is placed if a submenu is
   * selected close to the parent.
   */
  minParentDistance: z.number().min(0).default(150),

  /**
   * This is the threshold in pixels which is used to differentiate between a click and a
   * drag. If the mouse is moved more than this threshold before the mouse button is
   * released, an item is dragged.
   */
  dragThreshold: z.number().min(0).default(15),

  /** The time in milliseconds it takes to fade in the menu. */
  fadeInDuration: z.number().min(0).default(150),

  /** The time in milliseconds it takes to fade out the menu. */
  fadeOutDuration: z.number().min(0).default(200),

  /**
   * If enabled, the menu will not take the input focus when opened. This will disable
   * turbo mode.
   */
  keepInputFocus: z.boolean().default(false),

  /** If enabled, items can be selected by dragging the mouse over them. */
  enableMarkingMode: z.boolean().default(true),

  /**
   * If enabled, items can be selected by hovering over them while holding down a keyboard
   * key.
   */
  enableTurboMode: z.boolean().default(true),

  /** If true, the mouse pointer will be warped to the center of the menu when necessary. */
  warpMouse: z.boolean().default(true),

  /** If enabled, menus using the hover mode require a final click for selecting items. */
  hoverModeNeedsConfirmation: z.boolean().default(false),

  /** Shorter gestures will not lead to selections. */
  gestureMinStrokeLength: z.number().min(0).default(150),

  /** Smaller turns will not lead to selections. */
  gestureMinStrokeAngle: z.number().min(0).default(20),

  /** Smaller movements will not be considered. */
  gestureJitterThreshold: z.number().min(0).default(10),

  /**
   * If the pointer is stationary for this many milliseconds, the current item will be
   * selected.
   */
  gesturePauseTimeout: z.number().min(0).default(100),

  /**
   * If set to a value greater than 0, items will be instantly selected if the mouse
   * travelled more than centerDeadZone + fixedStrokeLength pixels in marking or turbo
   * mode. Any other gesture detection based on angles or motion speed will be disabled in
   * this case.
   */
  fixedStrokeLength: z.number().min(0).default(0),

  /**
   * If enabled, the parent of a selected item will be selected on a right mouse button
   * click. Else the menu will be closed directly.
   */
  rmbSelectsParent: z.boolean().default(false),
  /**
   * If disabled, gamepad input will be ignored. This can be useful if the gamepad is not
   * connected or if the user prefers to use the mouse.
   */
  enableGamepad: z.boolean().default(true),

  /**
   * This button will select the parent item when using a gamepad. Set to -1 to disable.
   * See https://w3c.github.io/gamepad/#remapping for the mapping of numbers to buttons.
   */
  gamepadBackButton: z.number().min(-1).default(1),

  /**
   * This button will close the menu when using a gamepad. Set to -1 to disable. See
   * https://w3c.github.io/gamepad/#remapping for the mapping of numbers to buttons.
   */
  gamepadCloseButton: z.number().min(-1).default(2),

  /** Determines the behavior of pressing the trigger shortcut once the menu is open. */
  sameShortcutBehavior: z
    .enum(['cycle-from-first', 'cycle-from-recent', 'close', 'nothing'])
    .default('nothing'),

  /**
   * If enabled, pressing 'cmd + ,' on macOS or 'ctrl + ,' on Linux or Windows will open
   * the settings window. If disabled, the default hotkey will be ignored.
   */
  useDefaultOsShowSettingsHotkey: z.boolean().default(true),
});

export type GeneralSettingsV1 = z.infer<typeof GENERAL_SETTINGS_SCHEMA_V1>;

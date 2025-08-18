//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * Until Kando 2.0.0, the general settings looked like this. There were also several
 * changes to the format before, therefore the migrateToGeneralSettingsV1 function below
 * tries to read even older settings files and to migrate them to this format.
 */
export interface IGeneralSettingsV1 {
  locale: string;
  showIntroductionDialog: boolean;
  menuTheme: string;
  darkMenuTheme: string;
  menuThemeColors: Record<string, Record<string, string>>;
  darkMenuThemeColors: Record<string, Record<string, string>>;
  enableDarkModeForMenuThemes: boolean;
  soundTheme: string;
  soundVolume: number;
  enableVersionCheck: boolean;
  ignoreWriteProtectedConfigFiles: boolean;
  settingsWindowColorScheme: 'light' | 'dark' | 'system';
  settingsWindowFlavor:
    | 'sakura-light'
    | 'sakura-dark'
    | 'sakura-system'
    | 'transparent-light'
    | 'transparent-dark'
    | 'transparent-system';
  trayIconFlavor: 'light' | 'dark' | 'color' | 'black' | 'white' | 'none';
  lazyInitialization: boolean;
  hardwareAcceleration: boolean;
  zoomFactor: number;
  hideSettingsButton: boolean;
  settingsButtonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  centerDeadZone: number;
  minParentDistance: number;
  dragThreshold: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  keepInputFocus: boolean;
  enableMarkingMode: boolean;
  enableTurboMode: boolean;
  warpMouse: boolean;
  hoverModeNeedsConfirmation: boolean;
  gestureMinStrokeLength: number;
  gestureMinStrokeAngle: number;
  gestureJitterThreshold: number;
  gesturePauseTimeout: number;
  fixedStrokeLength: number;
  rmbSelectsParent: boolean;
  enableGamepad: true;
  gamepadBackButton: number;
  gamepadCloseButton: number;
  sameShortcutBehavior: 'cycle-from-first' | 'cycle-from-recent' | 'close' | 'nothing';
  useDefaultOsShowSettingsHotkey: boolean;
}

/**
 * Migrates the given settings object to the IGeneralSettingsV1 format.
 *
 * @param oldSettings The old settings object to migrate.
 * @returns The migrated settings object in the IGeneralSettingsV1 format.
 */
export function migrateToGeneralSettingsV1(oldSettings: object): IGeneralSettingsV1 {
  console.log('Migrating potentially old settings to IGeneralSettingsV1 format...');

  let migrated = oldSettings as IGeneralSettingsV1;

  migrated = {
    locale: migrated.locale ?? 'auto',
    showIntroductionDialog: migrated.showIntroductionDialog ?? true,
    menuTheme: migrated.menuTheme ?? 'default',
    darkMenuTheme: migrated.darkMenuTheme ?? 'default',
    menuThemeColors: migrated.menuThemeColors ?? {},
    darkMenuThemeColors: migrated.darkMenuThemeColors ?? {},
    enableDarkModeForMenuThemes: migrated.enableDarkModeForMenuThemes ?? false,
    soundTheme: migrated.soundTheme ?? 'none',
    soundVolume: migrated.soundVolume ?? 0.5,
    ignoreWriteProtectedConfigFiles: migrated.ignoreWriteProtectedConfigFiles ?? false,
    settingsWindowColorScheme: migrated.settingsWindowColorScheme ?? 'system',
    settingsWindowFlavor: migrated.settingsWindowFlavor ?? 'sakura-system',
    trayIconFlavor: migrated.trayIconFlavor ?? 'color',
    lazyInitialization: migrated.lazyInitialization ?? false,
    hardwareAcceleration: migrated.hardwareAcceleration ?? true,
    enableVersionCheck: migrated.enableVersionCheck ?? true,
    zoomFactor: migrated.zoomFactor ?? 1,
    centerDeadZone: migrated.centerDeadZone ?? 50,
    minParentDistance: migrated.minParentDistance ?? 150,
    dragThreshold: migrated.dragThreshold ?? 15,
    fadeInDuration: migrated.fadeInDuration ?? 150,
    fadeOutDuration: migrated.fadeOutDuration ?? 200,
    keepInputFocus: migrated.keepInputFocus ?? false,
    enableMarkingMode: migrated.enableMarkingMode ?? true,
    enableTurboMode: migrated.enableTurboMode ?? true,
    warpMouse: migrated.warpMouse ?? true,
    hoverModeNeedsConfirmation: migrated.hoverModeNeedsConfirmation ?? false,
    gestureMinStrokeLength: migrated.gestureMinStrokeLength ?? 150,
    gestureMinStrokeAngle: migrated.gestureMinStrokeAngle ?? 20,
    gestureJitterThreshold: migrated.gestureJitterThreshold ?? 10,
    gesturePauseTimeout: migrated.gesturePauseTimeout ?? 100,
    fixedStrokeLength: migrated.fixedStrokeLength ?? 0,
    rmbSelectsParent: migrated.rmbSelectsParent ?? false,
    enableGamepad: migrated.enableGamepad ?? true,
    gamepadBackButton: migrated.gamepadBackButton ?? 1,
    gamepadCloseButton: migrated.gamepadCloseButton ?? 2,
    sameShortcutBehavior: migrated.sameShortcutBehavior ?? 'nothing',
    useDefaultOsShowSettingsHotkey: migrated.useDefaultOsShowSettingsHotkey ?? true,
    hideSettingsButton: migrated.hideSettingsButton ?? false,
    settingsButtonPosition: migrated.settingsButtonPosition ?? 'bottom-right',
  };

  // Up to Kando 1.8.0, there was a settings.editorOptions.showEditorButtonVisible
  // property. This was changed to settings.hideSettingsButton.
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = oldSettings as any;
    if (raw.editorOptions?.showEditorButtonVisible === false) {
      migrated.hideSettingsButton = true;
    }
  }

  // Up to Kando 1.8.0, the following properties were stored in a settings.menuOptions
  // object. Later they became top-level properties.
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = oldSettings as any;
    if (raw.menuOptions) {
      migrated.centerDeadZone = raw.menuOptions.centerDeadZone;
      migrated.minParentDistance = raw.menuOptions.minParentDistance;
      migrated.dragThreshold = raw.menuOptions.dragThreshold;
      migrated.fadeInDuration = raw.menuOptions.fadeInDuration;
      migrated.fadeOutDuration = raw.menuOptions.fadeOutDuration;
      migrated.enableMarkingMode = raw.menuOptions.enableMarkingMode;
      migrated.enableTurboMode = raw.menuOptions.enableTurboMode;
      migrated.hoverModeNeedsConfirmation = raw.menuOptions.hoverModeNeedsConfirmation;
      migrated.gestureMinStrokeLength = raw.menuOptions.gestureMinStrokeLength;
      migrated.gestureMinStrokeAngle = raw.menuOptions.gestureMinStrokeAngle;
      migrated.gestureJitterThreshold = raw.menuOptions.gestureJitterThreshold;
      migrated.gesturePauseTimeout = raw.menuOptions.gesturePauseTimeout;
      migrated.fixedStrokeLength = raw.menuOptions.fixedStrokeLength;
      migrated.rmbSelectsParent = raw.menuOptions.rmbSelectsParent;
      migrated.enableGamepad = raw.menuOptions.enableGamepad;
      migrated.gamepadBackButton = raw.menuOptions.gamepadBackButton;
      migrated.gamepadCloseButton = raw.menuOptions.gamepadCloseButton;
    }
  }

  return migrated;
}

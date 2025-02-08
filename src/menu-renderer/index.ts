//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import { WindowWithAPIs } from './menu-window-api';
declare const window: WindowWithAPIs;

import { Menu } from './menu';
import { MenuTheme } from './menu-theme';
import { SoundTheme } from './sound-theme';

/**
 * This file is the main entry point for Kando's menu renderer process. It is responsible
 * for drawing the menu and handling user input. It is created when Kando starts and stays
 * hidden until the user requests a menu. So the code below is executed only once.
 */

// Wire up the menu ----------------------------------------------------------------------

// We need some information from the main process before we can start. This includes the
// backend info, the menu theme, and the menu theme colors.
Promise.all([
  window.commonAPI.getMenuTheme(),
  window.commonAPI.getCurrentMenuThemeColors(),
  window.commonAPI.getSoundTheme(),
  window.commonAPI.appSettings.get(),
]).then(async ([themeDescription, colors, soundThemeDescription, settings]) => {
  // First, we create a new menu theme and load the description we got from the main
  // process.
  const menuTheme = new MenuTheme();
  menuTheme.loadDescription(themeDescription);
  menuTheme.setColors(colors);

  // This will be called below whenever the menu theme should be reloaded.
  const reloadMenuTheme = async () => {
    Promise.all([
      window.commonAPI.getMenuTheme(),
      window.commonAPI.getCurrentMenuThemeColors(),
    ]).then(([themeDescription, colors]) => {
      menuTheme.loadDescription(themeDescription);
      menuTheme.setColors(colors);
    });
  };

  window.commonAPI.appSettings.onChange('menuThemeColors', () => reloadMenuTheme());
  window.commonAPI.appSettings.onChange('darkMenuThemeColors', () => reloadMenuTheme());
  window.commonAPI.appSettings.onChange('menuTheme', () => reloadMenuTheme());
  window.commonAPI.appSettings.onChange('darkMenuTheme', () => reloadMenuTheme());
  window.commonAPI.appSettings.onChange('enableDarkModeForMenuThemes', () =>
    reloadMenuTheme()
  );
  window.commonAPI.darkModeChanged(() => reloadMenuTheme());

  // We also create a new sound theme and load the description we got from the main
  // process.
  const soundTheme = new SoundTheme();
  soundTheme.loadDescription(soundThemeDescription);
  soundTheme.setVolume(settings.soundVolume);

  window.commonAPI.appSettings.onChange('soundTheme', () => {
    window.commonAPI.getSoundTheme().then((description) => {
      soundTheme.loadDescription(description);
    });
  });

  window.commonAPI.appSettings.onChange('soundVolume', (volume) => {
    soundTheme.setVolume(volume);
  });

  // Now, we create the menu. It will be responsible for drawing the menu and handling
  // user input. It is re-used for every menu that is shown.
  const menu = new Menu(
    document.getElementById('kando-menu'),
    menuTheme,
    soundTheme,
    settings
  );

  // Show the menu when the main process requests it.
  window.menuAPI.showMenu((root, menuOptions) => {
    menu.show(root, menuOptions);
  });

  // Tell the menu about settings changes.
  const updateSettings = () => {
    window.commonAPI.appSettings.get().then((settings) => {
      menu.updateSettings(settings);
    });
  };

  window.commonAPI.appSettings.onChange('centerDeadZone', updateSettings);
  window.commonAPI.appSettings.onChange('minParentDistance', updateSettings);
  window.commonAPI.appSettings.onChange('dragThreshold', updateSettings);
  window.commonAPI.appSettings.onChange('fadeInDuration', updateSettings);
  window.commonAPI.appSettings.onChange('fadeOutDuration', updateSettings);
  window.commonAPI.appSettings.onChange('enableMarkingMode', updateSettings);
  window.commonAPI.appSettings.onChange('enableTurboMode', updateSettings);
  window.commonAPI.appSettings.onChange('hoverModeNeedsConfirmation', updateSettings);
  window.commonAPI.appSettings.onChange('gestureMinStrokeLength', updateSettings);
  window.commonAPI.appSettings.onChange('gestureMinStrokeAngle', updateSettings);
  window.commonAPI.appSettings.onChange('gestureJitterThreshold', updateSettings);
  window.commonAPI.appSettings.onChange('gesturePauseTimeout', updateSettings);
  window.commonAPI.appSettings.onChange('fixedStrokeLength', updateSettings);
  window.commonAPI.appSettings.onChange('rmbSelectsParent', updateSettings);
  window.commonAPI.appSettings.onChange('gamepadBackButton', updateSettings);
  window.commonAPI.appSettings.onChange('gamepadCloseButton', updateSettings);

  // Sometimes, the user may select an item too close to the edge of the screen. In this
  // case, we can not open the menu directly under the pointer. To make sure that the
  // menu is still exactly under the pointer, we move the pointer a little bit.
  menu.on('move-pointer', (dist) => {
    window.menuAPI.movePointer(dist);
  });

  // Hide Kando's window when the user aborts a selection.
  menu.on('cancel', () => {
    menu.hide();
    window.menuAPI.cancelSelection();
  });

  // Hide Kando's window when the user selects an item and notify the main process.
  menu.on('select', (path) => {
    menu.hide();
    window.menuAPI.selectItem(path);
  });

  // Report hover events to the main process.
  menu.on('hover', (path) => {
    window.menuAPI.hoverItem(path);
  });

  // Report unhover events to the main process.
  menu.on('unhover', (path) => window.menuAPI.unhoverItem(path));

  // Hide the menu or the settings when the user presses escape.
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      menu.hide();
      window.menuAPI.cancelSelection();
    }
  });

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.commonAPI.log("Successfully loaded Kando's Menu process.");

  // Notify the main process that we are ready.
  window.menuAPI.menuWindowReady();
});

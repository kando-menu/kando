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
import { SettingsButton } from './settings-button';
import { MenuTheme } from './menu-theme';
import { SoundTheme } from './sound-theme';
import { IconThemeRegistry } from '../common/icon-themes/icon-theme-registry';

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
  window.commonAPI.generalSettings.get(),
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

      // Reload the menu if it is currently shown.
      const [root, menuOptions] = menu.getCurrentRequest();
      if (root) {
        menu.show(root, menuOptions);
      }
    });
  };

  window.commonAPI.darkModeChanged(reloadMenuTheme);
  window.menuAPI.onReloadMenuTheme(reloadMenuTheme);

  // We also create a new sound theme and load the description we got from the main
  // process.
  const soundTheme = new SoundTheme();
  soundTheme.loadDescription(soundThemeDescription);
  soundTheme.setVolume(settings.soundVolume);

  // This will be called below whenever the sound theme should be reloaded.
  const reloadSoundTheme = async () => {
    const description = await window.commonAPI.getSoundTheme();
    soundTheme.loadDescription(description);
  };

  window.menuAPI.onReloadSoundTheme(reloadSoundTheme);

  // Initialize the icon theme registry.
  await IconThemeRegistry.getInstance().init();

  // Create the settings button. This is the button that is shown in one corner of the
  // screen. It is used to open the settings dialog.
  const settingsButton = new SettingsButton(
    document.getElementById('settings-button') as HTMLButtonElement,
    settings
  );

  // Helper function to group and re-use function calls
  // associated with showing the settings window.
  const showSettings = () => {
    menu.cancel();
    window.menuAPI.showSettings();
  };

  // Show the settings dialog when the button is clicked.
  settingsButton.on('click', () => {
    showSettings();
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
  window.menuAPI.onShowMenu((root, menuOptions) => {
    menu.show(root, menuOptions);
    settingsButton.show();
  });

  // Hide the menu when the main process requests it.
  window.menuAPI.onHideMenu(() => {
    menu.cancel();
  });

  // Tell the menu about settings changes. This could check more detailed which setting
  // has changed and only update the necessary parts. But for now, we just reload the
  // whole menu theme.
  window.commonAPI.generalSettings.onChange((newSettings, oldSettings) => {
    reloadMenuTheme();
    menu.updateSettings(newSettings);
    settingsButton.updateSettings(newSettings);

    if (newSettings.soundTheme !== oldSettings.soundTheme) {
      window.commonAPI.getSoundTheme().then((description) => {
        soundTheme.loadDescription(description);
      });
    }

    if (newSettings.soundVolume !== oldSettings.soundVolume) {
      soundTheme.setVolume(newSettings.soundVolume);
    }
  });

  // Sometimes, the user may select an item too close to the edge of the screen. In this
  // case, we can not open the menu directly under the pointer. To make sure that the
  // menu is still exactly under the pointer, we move the pointer a little bit.
  menu.on('move-pointer', (dist) => {
    window.menuAPI.movePointer(dist);
  });

  // Hide Kando's window when the user aborts a selection.
  menu.on('cancel', () => {
    menu.hide();
    settingsButton.hide();
    window.menuAPI.cancelSelection();
  });

  // Hide Kando's window when the user selects an item and notify the main process.
  menu.on('select', (path) => {
    menu.hide();
    settingsButton.hide();
    window.menuAPI.selectItem(path);
  });

  // Report hover events to the main process.
  menu.on('hover', (path) => {
    window.menuAPI.hoverItem(path);
  });

  // Report unhover events to the main process.
  menu.on('unhover', (path) => window.menuAPI.unhoverItem(path));

  document.body.addEventListener('keydown', async (ev) => {
    // Hide the menu when the user presses escape.
    if (ev.key === 'Escape') {
      menu.hide();
      settingsButton.hide();
      window.menuAPI.cancelSelection();
    }

    // Show the settings window if 'cmd + ,' hotkey is pressed on macOS
    // or 'ctrl + ,' is pressed on non macOS systems.
    const keyIsComma = ev.key === ',';
    if ((ev.metaKey && keyIsComma && cIsMac) || (ev.ctrlKey && keyIsComma && !cIsMac)) {
      if ((await window.commonAPI.generalSettings.get()).useDefaultOsShowSettingsHotkey) {
        showSettings();
      }
    }
  });

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.commonAPI.log("Successfully loaded Kando's Menu process.");

  // Notify the main process that we are ready.
  window.menuAPI.menuWindowReady();
});

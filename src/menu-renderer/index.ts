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
import { CenterText } from './center-text';
import { MenuInteractionType } from '../common';

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

  // The center text is not directly shown by the menu, but handled by a separate class.
  const centerText = new CenterText(document.getElementById('kando-menu'));
  centerText.setDiameter(menuTheme.centerTextWrapWidth);

  // This will be called below whenever the menu theme should be reloaded.
  const reloadMenuTheme = async () => {
    Promise.all([
      window.commonAPI.getMenuTheme(),
      window.commonAPI.getCurrentMenuThemeColors(),
    ]).then(([themeDescription, colors]) => {
      menuTheme.loadDescription(themeDescription);
      menuTheme.setColors(colors);

      centerText.setDiameter(menuTheme.centerTextWrapWidth);
      centerText.setEnabled(menuTheme.drawCenterText);

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

  // This will be called whenever the sound theme should be reloaded.
  window.menuAPI.onReloadSoundTheme(async () => {
    const description = await window.commonAPI.getSoundTheme();
    soundTheme.loadDescription(description);
  });

  // This will be called whenever the icons should be reloaded.
  window.menuAPI.onReloadIconThemes(async () => {
    await IconThemeRegistry.getInstance().init();
  });

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
    menu.triggerInteraction(MenuInteractionType.eCloseMenu);
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
    centerText,
    settings
  );

  // Show the menu when the main process requests it.
  window.menuAPI.onShowMenu(async (root, menuOptions) => {
    if (menuOptions.systemIconsChanged) {
      await IconThemeRegistry.getInstance().reloadSystemIcons();
    }
    menu.show(root, menuOptions);
    settingsButton.show();
  });

  // Tell the menu about interactions triggered by the host process. This includes closing
  // the menu or closing the current submenu.
  window.menuAPI.onTriggerInteraction((type) => {
    menu.triggerInteraction(type);
  });

  // Tell the host process about interactions triggered by the user or also by the host
  // process itself via the onTriggerInteraction function.
  menu.on('interaction', (type, path, time, source) => {
    window.menuAPI.finalizeInteraction(type, path, time, source);

    // If the menu was closed, we also hide the settings button.
    if (type === 'closeMenu') {
      settingsButton.hide();
    }

    // Play the corresponding sound for the interaction.
    soundTheme.playSound(type);
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

  document.body.addEventListener('keydown', async (ev) => {
    // Hide the menu when the user presses escape.
    if (ev.key === 'Escape') {
      menu.triggerInteraction(MenuInteractionType.eCloseMenu);
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

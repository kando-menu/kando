//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import i18next from 'i18next';

import { WindowWithAPIs } from './settings-window-api';
declare const window: WindowWithAPIs;

import { Settings } from './settings';

/**
 * This file is the main entry point for Kando's settings renderer process. It is
 * responsible for drawing the settings window. The window is created when the the user
 * wants to open the settings and destroyed when the user closes it. So the code below is
 * executed whenever the user opens the settings.
 */

// Wire up the the settings --------------------------------------------------------------

// We need some information from the main process before we can start.
Promise.all([
  window.commonAPI.getLocales(),
  window.commonAPI.getVersion(),
  window.settingsAPI.getBackendInfo(),
]).then(async ([locales, version, info]) => {
  // Initialize i18next with the current locale and the english fallback locale.
  await i18next.init({
    lng: locales.current,
    fallbackLng: locales.fallbackLng,
  });

  Object.keys(locales.data).forEach((key) => {
    i18next.addResourceBundle(
      key,
      'translation',
      locales.data[key].translation,
      true,
      true
    );
  });

  // Create the settings object. This will handle the rendering of the settings window.
  const settings = new Settings(document.getElementById('kando-settings'), info, version);

  // Show the update available button when the main process requests it.
  window.settingsAPI.showUpdateAvailableButton(() => {
    document.getElementById('sidebar-show-new-version-button').classList.remove('d-none');
  });

  // Hide the menu or the settings when the user presses escape.
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      settings.hide();
    }
  });

  settings.show({ appName: 'foo', windowName: 'bar', windowPosition: { x: 0, y: 0 } });

  /*
   // Send the settings to the main process.
   if (this.menuSettings) {
    // Before sending the settings back to the main process, we have to make sure
    // that the menu items are converted back to IMenuItem objects. This is because
    // ISettingsMenuItem objects contain properties (such as DOM nodes) which neither need to
    // be saved to disc nor can they be cloned using the structured clone algorithm
    // which is used by Electron for IPC.
    this.menuSettings.menus.forEach((menu) => {
      menu.root = deepCopyMenuItem(menu.root);
    });

    // Also the templates needs to be converted back to IMenu and IMenuItem objects.
    this.menuSettings.templates = this.menuSettings.templates.map((thing) => {
      if ((thing as IMenu).root) {
        return deepCopyMenu(thing as IMenu);
      } else {
        return deepCopyMenuItem(thing as IMenuItem);
      }
    });

    window.commonAPI.menuSettings.set(this.menuSettings);
    this.menuSettings = null;
  }*/

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.commonAPI.log("Successfully loaded Kando's Settings process.");

  // Notify the main process that we are ready.
  window.settingsAPI.settingsWindowReady();
});

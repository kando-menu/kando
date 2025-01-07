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

import { Settings } from './settings';

/**
 * This file is the main entry point for Kando's renderer process. It is responsible for
 * drawing the menu and the settings, as well as handling user input.
 */

// Wire up the menu and the settings -------------------------------------------------------

// We need some information from the main process before we can start. This includes the
// backend info, the menu theme, and the menu theme colors.
Promise.all([
  window.api.getLocales(),
  window.api.getVersion(),
  window.api.getBackendInfo(),
  window.api.appSettings.get(),
]).then(async ([locales, version, info, appSettings]) => {
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

  const settings = new Settings(
    document.getElementById('kando-settings'),
    info,
    version,
    appSettings.settingsOptions
  );

  // Show the menu when the main process requests it.
  window.api.showMenu((root, menuOptions, settingsOptions) => {
    settings.show(settingsOptions);
  });

  window.api.showSettings((settingsOptions) => {
    settings.show(settingsOptions);
    settings.enterEditMode();
  });

  // Hide the settings when the main process requests it.
  window.api.hideSettings(() => {
    settings.hide();
    window.api.cancelSelection();
  });

  // Show the update available button when the main process requests it.
  window.api.showUpdateAvailableButton(() => {
    document.getElementById('sidebar-show-new-version-button').classList.remove('d-none');
  });

  // Tell the menu and the settings about settings changes.
  window.api.appSettings.onChange('settingsOptions', (o) => settings.setOptions(o));

  // Hide the menu when the user enters edit mode.
  settings.on('enter-edit-mode', () => {
    window.api.unbindShortcuts();
  });

  // Hide Kando's window when the user leaves edit mode.
  settings.on('leave-edit-mode', () => {
    settings.hide();
    window.api.cancelSelection();
  });

  // Hide the menu or the settings when the user presses escape.
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      settings.hide();
      window.api.cancelSelection();
    }
  });

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.api.log("Successfully loaded Kando's Settings process.");

  // Notify the main process that we are ready.
  window.api.settingsWindowReady();
});

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import React from 'react';
import { createRoot } from 'react-dom/client';
import i18next from 'i18next';

import { WindowWithAPIs } from './settings-window-api';
declare const window: WindowWithAPIs;

import App from './components/App';
import { useAppSettings, useMenuSettings, useAppState } from './state';

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
  window.commonAPI.appSettings.get(),
  window.commonAPI.menuSettings.get(),
  window.commonAPI.getIsDarkMode(),
  window.settingsAPI.getBackendInfo(),
  window.settingsAPI.getVersionInfo(),
  window.settingsAPI.getAllMenuThemes(),
  window.settingsAPI.getCurrentMenu(),
]).then(
  async ([
    locales,
    appSettings,
    menuSettings,
    darkMode,
    backendInfo,
    versionInfo,
    menuThemes,
    selectedMenu,
  ]) => {
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

    // Initialize the global state objects. Make sure to not record the initial state of
    // the menu settings in the undo history.
    useAppSettings.setState(appSettings);

    useMenuSettings.temporal.getState().pause();
    useMenuSettings.setState(menuSettings);
    useMenuSettings.temporal.getState().resume();

    useAppState.setState({
      backendInfo,
      versionInfo,
      darkMode,
      menuThemes,
      selectedMenu,
    });

    window.commonAPI.appSettings.onChange((newSettings) => {
      useAppSettings.setState(newSettings);
    });

    window.commonAPI.menuSettings.onChange((newSettings) => {
      useMenuSettings.setState(newSettings);
    });

    window.commonAPI.darkModeChanged((darkMode) => {
      useAppState.setState({ darkMode });
    });

    useAppSettings.subscribe((newSettings) => {
      window.commonAPI.appSettings.set(newSettings);
    });

    useMenuSettings.subscribe((newSettings) => {
      window.commonAPI.menuSettings.set({
        menus: newSettings.menus,
        stash: newSettings.stash,
        collections: newSettings.collections,
      });
    });

    // Create the settings object. This will handle the rendering of the settings window.
    const root = createRoot(document.body);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Save the settings when the user closes the settings window.
    /*window.addEventListener('unload', function () {
    // Before sending the settings back to the main process, we have to make sure
    // that the menu items are converted back to IMenuItem objects. This is because
    // ISettingsMenuItem objects contain properties (such as DOM nodes) which neither need to
    // be saved to disc nor can they be cloned using the structured clone algorithm
    // which is used by Electron for IPC.
    menuSettings.menus.forEach((menu) => {
      menu.root = deepCopyMenuItem(menu.root);
    });

    // Also the stash needs to be converted back to ordinary IMenuItem objects.
    menuSettings.stash = menuSettings.stash.map((item) => deepCopyMenuItem(item));

    window.commonAPI.menuSettings.set(menuSettings);
  });*/

    // This is helpful during development as it shows us when the renderer process has
    // finished reloading.
    window.commonAPI.log("Successfully loaded Kando's Settings process.");

    // Notify the main process that we are ready.
    window.settingsAPI.settingsWindowReady();
  }
);

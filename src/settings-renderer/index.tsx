//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import { WindowWithAPIs } from './settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';
import { createRoot } from 'react-dom/client';
import i18next from 'i18next';
import { enableDragDropTouch } from 'drag-drop-touch';

import App from './components/App';
import { useAppState, useGeneralSettings, useMenuSettings } from './state';
import { IconThemeRegistry } from '../common/icon-themes/icon-theme-registry';

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
  window.commonAPI.generalSettings.get(),
  window.commonAPI.menuSettings.get(),
  window.commonAPI.getIsDarkMode(),
  window.settingsAPI.getBackendInfo(),
  window.settingsAPI.getVersionInfo(),
  window.settingsAPI.getSystemInfo(),
  window.settingsAPI.getAllMenuThemes(),
  window.settingsAPI.getAllSoundThemes(),
  window.settingsAPI.getCurrentMenu(),
]).then(
  async ([
    locales,
    generalSettings,
    menuSettings,
    darkMode,
    backendInfo,
    versionInfo,
    systemInfo,
    menuThemes,
    soundThemes,
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

    // Initialize the icon theme registry.
    await IconThemeRegistry.getInstance().init();

    // Validate State --------------------------------------------------------------------

    // This function is called whenever the app state or the menu settings change. It
    // makes sure that the current state is valid. For instance, if a menu is deleted, the
    // selected menu might be invalid.
    const validateState = () => {
      const { menus, collections } = useMenuSettings.getState();
      const {
        selectedMenu,
        selectMenu,
        selectedCollection,
        selectCollection,
        selectedChildPath,
        selectParent,
      } = useAppState.getState();

      // Make sure that the selected menu is valid. This could for instance happen if the
      // currently selected menu is deleted by an external event (e.g. by editing the
      // settings file) or by re-doing a previously undone deletion :).
      if (selectedMenu >= menus.length) {
        selectMenu(menus.length - 1);
        return;
      }

      // Also make sure that the selected collection is valid.
      if (selectedCollection >= collections.length) {
        selectCollection(collections.length - 1);
        return;
      }

      // Make sure that the selected child path is valid.
      if (selectedMenu >= 0) {
        let selectedItem = menus[selectedMenu].root;
        for (let i = 0; i < selectedChildPath.length; i++) {
          selectedItem = selectedItem.children[selectedChildPath[i]];
          if (selectedItem === undefined) {
            selectParent();
            return;
          }
        }
      }
    };

    useAppState.subscribe(validateState);
    useMenuSettings.subscribe(validateState);

    // Initialize the global state objects -----------------------------------------------

    // Make sure to not record the initial state of the menu settings in the undo history.
    useGeneralSettings.setState(generalSettings);

    useMenuSettings.temporal.getState().pause();
    useMenuSettings.setState(menuSettings);
    useMenuSettings.temporal.getState().resume();

    useAppState.setState({
      backendInfo,
      versionInfo,
      systemInfo,
      darkMode,
      menuThemes,
      soundThemes,
      selectedMenu,
    });

    // Update the state whenever the settings change in the main process.
    window.commonAPI.generalSettings.onChange((newSettings) => {
      useGeneralSettings.setState(newSettings);
    });

    window.commonAPI.menuSettings.onChange((newSettings) => {
      useMenuSettings.setState(newSettings);
    });

    window.commonAPI.darkModeChanged((darkMode) => {
      useAppState.setState({ darkMode });
    });

    useGeneralSettings.subscribe((newSettings) => {
      window.commonAPI.generalSettings.set(newSettings);
    });

    useMenuSettings.subscribe((newSettings) => {
      window.commonAPI.menuSettings.set({
        menus: newSettings.menus,
        collections: newSettings.collections,
      });
    });

    // HTML5 drag and drop support is not available on touch devices. So we use a
    // polyfill which translates touch events to drag and drop events. This is not
    // perfect as it for instance does not support drag and drop to the desktop, but it
    // works for most use cases.
    enableDragDropTouch(document.body, document.body, {
      forceListen: true,
      allowDragScroll: false,
    });

    // Create the settings dialog app object.
    const root = createRoot(document.body);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
);

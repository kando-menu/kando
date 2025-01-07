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

import { Editor } from './editor';

/**
 * This file is the main entry point for Kando's renderer process. It is responsible for
 * drawing the menu and the editor, as well as handling user input.
 */

// Wire up the menu and the editor -------------------------------------------------------

// We need some information from the main process before we can start. This includes the
// backend info, the menu theme, and the menu theme colors.
Promise.all([
  window.api.getLocales(),
  window.api.getVersion(),
  window.api.getBackendInfo(),
  window.api.appSettings.get(),
]).then(async ([locales, version, info, settings]) => {
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

  const editor = new Editor(
    document.getElementById('kando-editor'),
    info,
    version,
    settings.editorOptions
  );

  // Show the menu when the main process requests it.
  window.api.showMenu((root, menuOptions, editorOptions) => {
    editor.show(editorOptions);
  });

  window.api.showEditor((editorOptions) => {
    editor.show(editorOptions);
    editor.enterEditMode();
  });

  // Hide the editor when the main process requests it.
  window.api.hideEditor(() => {
    editor.hide();
    window.api.cancelSelection();
  });

  // Show the update available button when the main process requests it.
  window.api.showUpdateAvailableButton(() => {
    document.getElementById('sidebar-show-new-version-button').classList.remove('d-none');
  });

  // Tell the menu and the editor about settings changes.
  window.api.appSettings.onChange('editorOptions', (o) => editor.setOptions(o));

  // Hide the menu when the user enters edit mode.
  editor.on('enter-edit-mode', () => {
    window.api.unbindShortcuts();
  });

  // Hide Kando's window when the user leaves edit mode.
  editor.on('leave-edit-mode', () => {
    editor.hide();
    window.api.cancelSelection();
  });

  // Hide the menu or the editor when the user presses escape.
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      editor.hide();
      window.api.cancelSelection();
    }
  });

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.api.log("Successfully loaded Kando's Editor process.");

  // Notify the main process that we are ready.
  window.api.editorWindowReady();
});

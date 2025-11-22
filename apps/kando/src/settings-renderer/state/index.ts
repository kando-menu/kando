//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// We have three global state objects: one for the general settings stored in the
// user's config.json, one for the menu settings stored in the user's menu.json, and one
// for the current state of the settings dialog itself. The latter includes for instance
// the currently selected menu.
// In ../index.tsx we initialize these objects with information from the main process.
// The main process will also notify the renderer process whenever a setting changes on
// disk, which will lead automatically to a re-render of the components which use slices
// of these objects.

export { useGeneralSettings, useGeneralSetting } from './general-settings';
export {
  useMenuSettings,
  useMappedMenuProperties,
  useMappedCollectionProperties,
} from './menu-settings';
export { useAppState, getSelectedChild } from './app-state';

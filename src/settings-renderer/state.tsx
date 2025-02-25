//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { create } from 'zustand';

import {
  IAppSettings,
  IMenuSettings,
  getDefaultAppSettings,
  getDefaultMenuSettings,
} from '../common';

// We have two global state objects: one for the applications settings stored in the
// user's config.json and one for the menu settings stored in the user's menu.json.
// In index.tsx we initialize these objects with the current settings from the main
// process.
// The main process will notify the renderer process whenever a setting changes on disk.
// This is also wired up in index.tsx.

/**
 * Use this hook to access the entire app settings object. Usually you will only need a
 * single setting. In this case, use useAppSetting instead.
 */
export const useAppSettings = create<IAppSettings>(() => ({
  ...getDefaultAppSettings(),
}));

/**
 * Use this hook to access a single setting from the app settings. This is a convenience
 * wrapper around useAppSettings. It returns the value and a setter function.
 */
export const useAppSetting = <T extends keyof IAppSettings>(key: T) => {
  const value = useAppSettings((state) => state[key]);
  const setValue = (newValue: IAppSettings[T]) =>
    useAppSettings.setState((state) => ({ ...state, [key]: newValue }));
  return [value, setValue] as const;
};

/**
 * Use this hook to access the entire menu settings object. Usually you will only need the
 * menus or the stash. In this case, use the methods below.
 */
export const useMenuSettings = create<IMenuSettings>(() => ({
  ...getDefaultMenuSettings(),
}));

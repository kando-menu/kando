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
  IMenu,
  IMenuItem,
  IAppSettings,
  IMenuSettings,
  getDefaultAppSettings,
  getDefaultMenuSettings,
  IBackendInfo,
  IVersionInfo,
  IMenuThemeDescription,
  IMenuCollection,
} from '../common';

// We have three global state objects: one for the applications settings stored in the
// user's config.json, one for the menu settings stored in the user's menu.json, and one
// for the current state of the settings dialog itself. The latter includes for instance
// the currently selected menu.
// In index.tsx we initialize these objects with information from the main process.
// The main process will also notify the renderer process whenever a setting changes on
// disk, which will lead automatically to a re-render of the components which use slices
// of these objects.

// App Settings State --------------------------------------------------------------------

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

// Menu Settings State -------------------------------------------------------------------

/**
 * Use this hook to access the entire menu settings object. Usually you will only need the
 * menus or the stash. In this case, use the methods below.
 */
export const useMenuSettings = create<IMenuSettings>(() => ({
  ...getDefaultMenuSettings(),
}));

/** Use this hook to access the menus from the menu settings. */
export const useMenus = () => {
  const menus = useMenuSettings((state) => state.menus);
  const setMenus = (newMenus: Array<IMenu>) =>
    useMenuSettings.setState((state) => ({ ...state, menus: newMenus }));
  return [menus, setMenus] as const;
};

/** Use this hook to access the stash from the menu settings. */
export const useStash = () => {
  const stash = useMenuSettings((state) => state.stash);
  const setStash = (newStash: Array<IMenuItem>) =>
    useMenuSettings.setState((state) => ({ ...state, stash: newStash }));
  return [stash, setStash] as const;
};

/** Use this hook to access the menu collections from the menu settings. */
export const useCollections = () => {
  const collections = useMenuSettings((state) => state.collections);
  const setCollections = (newCollections: Array<IMenuCollection>) =>
    useMenuSettings.setState((state) => ({ ...state, collections: newCollections }));
  return [collections, setCollections] as const;
};

// App State -----------------------------------------------------------------------------

type State = {
  /**
   * The index of the currently selected menu. This is the index in the entire list of
   * unfiltered menus as specified in the menu settings.
   */
  selectedMenu: number;

  /**
   * The index of the currently selected menu collection. The special value of -1 means
   * that no collection is selected and all menus are shown.
   */
  selectedCollection: number;

  /** Whether the app is in dark mode. */
  darkMode: boolean;

  /** Information about the backend. */
  backendInfo: IBackendInfo | null;

  /** Information about the current version of Kando and some libraries. */
  versionInfo: IVersionInfo | null;

  /** Descriptions of all available menu themes. */
  menuThemes: Array<IMenuThemeDescription>;
};

type Action = {
  selectMenu: (which: number) => void;
  selectCollection: (which: number) => void;
};

/** This is the state of the settings dialog itself. */
export const useAppState = create<State & Action>((set) => ({
  selectedMenu: 0,
  selectedCollection: -1,
  darkMode: false,
  backendInfo: null,
  versionInfo: null,
  menuThemes: [],
  selectMenu: (which: number) => set({ selectedMenu: which }),
  selectCollection: (which: number) => set({ selectedCollection: which }),
}));

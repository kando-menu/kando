//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { create } from 'zustand';
import { temporal } from 'zundo';
import lodash from 'lodash';

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

type MenuStateActions = {
  setMenus: (newMenus: Array<IMenu>) => void;
  setStash: (newStash: Array<IMenuItem>) => void;
  setCollections: (newCollections: Array<IMenuCollection>) => void;
  addMenu: (tags: string[]) => void;
  deleteMenu: (index: number) => void;
  duplicateMenu: (index: number) => void;
  addCollection: () => void;
};

/**
 * Use this hook to access the entire menu settings object. Usually you will only need the
 * menus or the stash. In this case, use the methods below.
 */
export const useMenuSettings = create(
  temporal<IMenuSettings & MenuStateActions>(
    (set) => ({
      ...getDefaultMenuSettings(),
      setMenus: (menus: Array<IMenu>) => set(() => ({ menus })),
      setStash: (stash: Array<IMenuItem>) => set(() => ({ stash })),
      setCollections: (collections: Array<IMenuCollection>) =>
        set(() => ({ collections })),
      addMenu: (tags: string[]) =>
        set((state) => ({
          menus: [
            ...state.menus,
            {
              shortcut: '',
              shortcutID: '',
              centered: false,
              warpMouse: false,
              anchored: false,
              hoverMode: false,
              tags,
              root: {
                type: 'submenu',
                name: 'New Menu',
                icon: 'apps',
                iconTheme: 'material-symbols-rounded',
                children: [],
              },
            },
          ],
        })),
      deleteMenu: (index: number) =>
        set((state) => ({
          menus: state.menus.filter((_, i) => i !== index),
        })),
      duplicateMenu: (index: number) =>
        set((state) => ({
          menus: [
            ...state.menus.slice(0, index + 1),
            lodash.cloneDeep(state.menus[index]),
            ...state.menus.slice(index + 1),
          ],
        })),
      addCollection: () =>
        set((state) => ({
          collections: [
            ...state.collections,
            {
              name: 'New Collection',
              icon: 'sell',
              iconTheme: 'material-symbols-rounded',
              tags: [],
            },
          ],
        })),
    }),
    {
      equality: lodash.isEqual,
    }
  )
);

// App State -----------------------------------------------------------------------------

type AppState = {
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

  /** Whether the about dialog is visible. */
  aboutDialogVisible: boolean;

  /** Whether the themes dialog is visible. */
  themesDialogVisible: boolean;

  /** Whether the settings dialog is visible. */
  settingsDialogVisible: boolean;

  /** Whether the app is in dark mode. */
  darkMode: boolean;

  /** Information about the backend. */
  backendInfo: IBackendInfo | null;

  /** Information about the current version of Kando and some libraries. */
  versionInfo: IVersionInfo | null;

  /** Descriptions of all available menu themes. */
  menuThemes: Array<IMenuThemeDescription>;
};

type AppStateActions = {
  selectMenu: (which: number) => void;
  selectCollection: (which: number) => void;
  setAboutDialogVisible: (aboutDialogVisible: boolean) => void;
  setThemesDialogVisible: (themesDialogVisible: boolean) => void;
  setSettingsDialogVisible: (settingsDialogVisible: boolean) => void;
};

/** This is the state of the settings dialog itself. */
export const useAppState = create<AppState & AppStateActions>((set) => ({
  selectedMenu: 0,
  selectedCollection: -1,
  aboutDialogVisible: false,
  themesDialogVisible: false,
  settingsDialogVisible: false,
  darkMode: false,
  backendInfo: null,
  versionInfo: null,
  menuThemes: [],
  selectMenu: (selectedMenu: number) => set({ selectedMenu }),
  selectCollection: (selectedCollection: number) => set({ selectedCollection }),
  setAboutDialogVisible: (aboutDialogVisible: boolean) => set({ aboutDialogVisible }),
  setThemesDialogVisible: (themesDialogVisible: boolean) => set({ themesDialogVisible }),
  setSettingsDialogVisible: (settingsDialogVisible: boolean) =>
    set({ settingsDialogVisible }),
}));

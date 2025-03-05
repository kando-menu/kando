//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { create } from 'zustand';
import { produce } from 'immer';
import { temporal } from 'zundo';
import lodash from 'lodash';

import {
  IAppSettings,
  IMenuSettings,
  getDefaultAppSettings,
  getDefaultMenuSettings,
  IBackendInfo,
  IVersionInfo,
  IMenuThemeDescription,
  IMenuCollection,
  IMenu,
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
  addMenu: (tags: string[]) => void;
  moveMenu: (from: number, to: number) => void;
  deleteMenu: (index: number) => void;
  duplicateMenu: (index: number) => void;
  editMenu: (index: number, menu: Partial<IMenu>) => void;

  addCollection: () => void;
  moveCollection: (from: number, to: number) => void;
  deleteCollection: (index: number) => void;
  editCollection: (index: number, collection: Partial<IMenuCollection>) => void;
};

/**
 * Use this hook to access the entire menu settings object. Usually you will only need the
 * menus or the stash. In this case, use the methods below.
 */
export const useMenuSettings = create<IMenuSettings & MenuStateActions>()(
  temporal(
    (set) => ({
      ...getDefaultMenuSettings(),

      addMenu: (tags: string[]) =>
        set(
          produce((state) => {
            state.menus.push({
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
            });
          })
        ),

      moveMenu: (from: number, to: number) => {
        if (from === to) {
          return;
        }

        set(
          produce((state) => {
            if (
              from < 0 ||
              from >= state.menus.length ||
              to < 0 ||
              to >= state.menus.length
            ) {
              return;
            }

            const [item] = state.menus.splice(from, 1);
            state.menus.splice(to, 0, item);
          })
        );
      },

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

      editMenu: (index: number, menu: Partial<IMenu>) =>
        set(
          produce((state) => {
            state.menus[index] = { ...state.menus[index], ...menu };
          })
        ),

      addCollection: () =>
        set(
          produce((state) => {
            state.collections.push({
              name: 'New Collection',
              icon: 'sell',
              iconTheme: 'material-symbols-rounded',
              tags: [],
            });
          })
        ),

      moveCollection: (from: number, to: number) => {
        if (from === to) {
          return;
        }

        set(
          produce((state) => {
            if (
              from < 0 ||
              from >= state.collections.length ||
              to < 0 ||
              to >= state.collections.length
            ) {
              return;
            }
            const [item] = state.collections.splice(from, 1);
            state.collections.splice(to, 0, item);
          })
        );
      },

      deleteCollection: (index: number) =>
        set((state) => ({
          collections: state.collections.filter((_, i) => i !== index),
        })),

      editCollection: (index: number, collection: Partial<IMenuCollection>) =>
        set(
          produce((state) => {
            state.collections[index] = { ...state.collections[index], ...collection };
          })
        ),
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

  /** Whether the search bar or the collection editor above the menu list is visible. */
  collectionDetailsVisible: boolean;

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

  /** The current state of the drag and drop system. */
  dnd: {
    draggedType: 'menu' | 'collection' | 'none';
    draggedIndex: number;
  };
};

type AppStateActions = {
  selectMenu: (which: number) => void;
  selectCollection: (which: number) => void;
  setAboutDialogVisible: (aboutDialogVisible: boolean) => void;
  setThemesDialogVisible: (themesDialogVisible: boolean) => void;
  setSettingsDialogVisible: (settingsDialogVisible: boolean) => void;
  setCollectionDetailsVisible: (collectionDetailsVisible: boolean) => void;

  startDrag: (type: 'menu' | 'collection', index: number) => void;
  endDrag: () => void;
};

/** This is the state of the settings dialog itself. */
export const useAppState = create<AppState & AppStateActions>((set) => ({
  selectedMenu: 0,
  selectedCollection: -1,
  collectionDetailsVisible: false,
  aboutDialogVisible: false,
  themesDialogVisible: false,
  settingsDialogVisible: false,
  darkMode: false,
  backendInfo: null,
  versionInfo: null,
  menuThemes: [],
  dnd: {
    draggedType: 'none',
    draggedIndex: -1,
  },
  selectMenu: (selectedMenu: number) => set({ selectedMenu }),
  selectCollection: (selectedCollection: number) => set({ selectedCollection }),
  setAboutDialogVisible: (aboutDialogVisible: boolean) => set({ aboutDialogVisible }),
  setThemesDialogVisible: (themesDialogVisible: boolean) => set({ themesDialogVisible }),
  setSettingsDialogVisible: (settingsDialogVisible: boolean) =>
    set({ settingsDialogVisible }),
  setCollectionDetailsVisible: (collectionDetailsVisible: boolean) =>
    set({ collectionDetailsVisible }),
  startDrag: (draggedType: 'menu' | 'collection', draggedIndex: number) =>
    set({ dnd: { draggedType, draggedIndex } }),
  endDrag: () => set({ dnd: { draggedType: 'none', draggedIndex: -1 } }),
}));

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
// The menu settings state object uses a temporal store. That means that every
// modification to the state is stored in a history stack. The user can undo and redo
// these changes.

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

/** These actions can be performed on the menu state. */
type MenuStateActions = {
  /**
   * Appends a new menu to the list of menus. The given tags are given to the new menu.
   *
   * @param tags The tags of the new menu.
   */
  addMenu: (tags: string[]) => void;

  /**
   * Moves a menu from one position to another.
   *
   * @param from The index of the menu to move.
   * @param to The index to move the menu to.
   */
  moveMenu: (from: number, to: number) => void;

  /**
   * Deletes a menu from the list of menus.
   *
   * @param index The index of the menu to delete.
   */
  deleteMenu: (index: number) => void;

  /**
   * Duplicates a menu at the given index. The new menu is inserted after the original
   * one.
   *
   * @param index The index of the menu to duplicate.
   */
  duplicateMenu: (index: number) => void;

  /**
   * Edits the menu at the given index. The callback is called with the menu object and
   * should return the modified menu object.
   *
   * @param index The index of the menu to edit.
   * @param callback The callback to call with the menu object.
   */
  editMenu: (index: number, callback: (menu: IMenu) => IMenu) => void;

  /** Appends a new collection to the list of collections. */
  addCollection: () => void;

  /**
   * Moves a collection from one position to another.
   *
   * @param from The index of the collection to move.
   * @param to The index to move the collection to.
   */
  moveCollection: (from: number, to: number) => void;

  /**
   * Deletes a collection from the list of collections.
   *
   * @param index The index of the collection to delete.
   */
  deleteCollection: (index: number) => void;

  /**
   * Edits the collection at the given index. The callback is called with the collection
   * object and should return the modified collection object.
   *
   * @param index The index of the collection to edit.
   * @param callback The callback to call with the collection object.
   */
  editCollection: (
    index: number,
    callback: (collection: IMenuCollection) => IMenuCollection
  ) => void;
};

/** Use this hook to access a slice from the settings object. */
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

      editMenu: (index: number, callback: (menu: IMenu) => IMenu) =>
        set(
          produce((state) => {
            state.menus[index] = callback(state.menus[index]);
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

      editCollection: (
        index: number,
        callback: (collection: IMenuCollection) => IMenuCollection
      ) =>
        set(
          produce((state) => {
            state.collections[index] = callback(state.collections[index]);
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

  /** Whether the collection editor above the menu list is visible. */
  collectionDetailsVisible: boolean;

  /** Whether the search bar above the menu list is visible. */
  menuSearchBarVisible: boolean;

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
    draggedType: 'menu' | 'item' | 'collection' | 'none';
    draggedIndex: number;
  };
};

/** These actions can be performed on the app state. */
type AppStateActions = {
  /**
   * Selects the given menu. This is the index in the entire list of unfiltered menus.
   *
   * @param which The index of the menu to select.
   */
  selectMenu: (which: number) => void;

  /**
   * Selects the given collection. The special value of -1 means that no collection is
   * selected and all menus are shown.
   *
   * @param which The index of the collection to select. -1 means all menus.
   */
  selectCollection: (which: number) => void;

  /**
   * Shows or hides the about dialog.
   *
   * @param aboutDialogVisible Whether the about dialog is visible.
   */
  setAboutDialogVisible: (aboutDialogVisible: boolean) => void;

  /**
   * Shows or hides the themes dialog.
   *
   * @param themesDialogVisible Whether the themes dialog is visible.
   */
  setThemesDialogVisible: (themesDialogVisible: boolean) => void;

  /**
   * Shows or hides the general-settings dialog.
   *
   * @param settingsDialogVisible Whether the settings dialog is visible.
   */
  setSettingsDialogVisible: (settingsDialogVisible: boolean) => void;

  /**
   * Shows or hides the collection editor above the menu list.
   *
   * @param collectionDetailsVisible Whether the collection editor is visible.
   */
  setCollectionDetailsVisible: (collectionDetailsVisible: boolean) => void;

  /**
   * Shows or hides the search bar above the menu list.
   *
   * @param menuSearchBarVisible Whether the search bar is visible.
   */
  setMenuSearchBarVisible: (menuSearchBarVisible: boolean) => void;

  /**
   * The currently dragged thing is stored in the app state. Calling this indicates that a
   * drag operation just started.
   *
   * @param type The type of the dragged thing.
   * @param index The index of the thing in it respective list.
   */
  startDrag: (type: 'menu' | 'item' | 'collection', index: number) => void;

  /**
   * This should be called when the drag operation ended. It resets the dragged thing in
   * the app state.
   */
  endDrag: () => void;
};

/** This is the state of the settings dialog itself. */
export const useAppState = create<AppState & AppStateActions>((set) => ({
  selectedMenu: 0,
  selectedCollection: -1,
  collectionDetailsVisible: false,
  menuSearchBarVisible: false,
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
  setMenuSearchBarVisible: (menuSearchBarVisible: boolean) =>
    set({ menuSearchBarVisible }),
  startDrag: (draggedType: 'menu' | 'item' | 'collection', draggedIndex: number) =>
    set({ dnd: { draggedType, draggedIndex } }),
  endDrag: () => set({ dnd: { draggedType: 'none', draggedIndex: -1 } }),
}));

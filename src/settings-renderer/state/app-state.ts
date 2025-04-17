//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { create } from 'zustand';

import { IBackendInfo, IVersionInfo, IMenuThemeDescription } from '../../common';

type AppState = {
  /**
   * The index of the currently selected menu. This is the index in the entire list of
   * unfiltered menus as specified in the menu settings.
   */
  selectedMenu: number;

  /**
   * A list of indices that represent the path to the currently selected menu. The first
   * number is the index among the root's children. If empty, the root menu is selected.
   * All indices should refer to submenus, except the last one which can be a submenu or
   * an item.
   */
  selectedChildPath: number[];

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
};

/** These actions can be performed on the app state. */
type AppStateActions = {
  /**
   * Selects the given menu. This is the index in the entire list of unfiltered menus.
   *
   * @param selectedMenu The index of the menu to select.
   */
  selectMenu: (selectedMenu: number) => void;

  /**
   * Selects a (sub)child of the currently selected menu. The argument is a list of
   * indices that represent the path to the currently selected child. The first number is
   * the index among the root's children. If empty, the root menu is selected. All indices
   * should refer to submenus, except the last one which can be a submenu or another
   * item.
   *
   * @param selectedChildPath The path to the selected child.
   */
  selectChildPath: (selectedChildPath: number[]) => void;

  /**
   * Selects the parent of the currently selected child. This is a convenience function
   * which could also be implemented with selectChildPath.
   */
  selectParent: () => void;

  /**
   * Selects the given collection. The special value of -1 means that no collection is
   * selected and all menus are shown.
   *
   * @param selectedCollection The index of the collection to select. -1 means all menus.
   */
  selectCollection: (selectedCollection: number) => void;

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
};

/** This is the state of the settings dialog itself. */
export const useAppState = create<AppState & AppStateActions>((set) => ({
  selectedMenu: 0,
  selectedChildPath: [],
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
  selectMenu: (selectedMenu: number) => set({ selectedMenu, selectedChildPath: [] }),
  selectChildPath: (selectedChildPath: number[]) => set({ selectedChildPath }),
  selectParent: () =>
    set((state) => ({
      selectedChildPath: state.selectedChildPath.slice(0, -1),
    })),
  selectCollection: (selectedCollection: number) => set({ selectedCollection }),
  setAboutDialogVisible: (aboutDialogVisible: boolean) => set({ aboutDialogVisible }),
  setThemesDialogVisible: (themesDialogVisible: boolean) => set({ themesDialogVisible }),
  setSettingsDialogVisible: (settingsDialogVisible: boolean) =>
    set({ settingsDialogVisible }),
  setCollectionDetailsVisible: (collectionDetailsVisible: boolean) =>
    set({ collectionDetailsVisible }),
  setMenuSearchBarVisible: (menuSearchBarVisible: boolean) =>
    set({ menuSearchBarVisible }),
}));

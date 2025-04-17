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
  IMenuSettings,
  getDefaultMenuSettings,
  IMenuCollection,
  IMenu,
  IMenuItem,
} from '../../common';

// The menu settings state object allows access, modification, and change notification of
// the settings stored in the user's menus.json. It uses a temporal store. That means that
// every modification to the state is stored in a history stack. The user can undo and
// redo these changes.

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

  /**
   * Edits a specific menu item. The callback is called with the menu item object and
   * should return the modified menu item object.
   *
   * @param menuIndex The index of the menu to edit.
   * @param itemPath The path to the item to edit. This is a list of indices that
   *   represent the path to the item.
   * @param callback The callback to call with the menu item object.
   */
  editMenuItem: (
    menuIndex: number,
    itemPath: number[],
    callback: (item: IMenuItem) => IMenuItem
  ) => void;

  /**
   * Deletes a menu item. The item is identified by its path in the menu tree.
   *
   * @param menuIndex The index of the menu to delete the item from.
   * @param itemPath The path to the item to delete. This is a list of indices that
   *   represent the path to the item.
   */
  deleteMenuItem: (menuIndex: number, itemPath: number[]) => void;

  /**
   * Duplicates a menu item. The item is identified by its path in the menu tree.
   *
   * @param menuIndex The index of the menu to duplicate the item from.
   * @param itemPath The path to the item to duplicate. This is a list of indices that
   *   represent the path to the item.
   */
  duplicateMenuItem: (menuIndex: number, itemPath: number[]) => void;

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

      editMenuItem: (
        menuIndex: number,
        itemPath: number[],
        callback: (item: IMenuItem) => IMenuItem
      ) =>
        set(
          produce((state) => {
            const { parent, item } = getMenuItem(state.menus[menuIndex].root, itemPath);
            const updatedItem = callback(item);

            // If the parent is null, we are editing the root item.
            if (parent === null) {
              state.menus[menuIndex].root = updatedItem;
            } else {
              parent.children[itemPath[itemPath.length - 1]] = updatedItem;
            }
          })
        ),

      deleteMenuItem: (menuIndex: number, itemPath: number[]) =>
        set(
          produce((state) => {
            const { parent } = getMenuItem(state.menus[menuIndex].root, itemPath);

            // If the parent is null, we are attempting to delete the root item. This
            // should not happen for now.
            if (parent === null) {
              console.warn(
                'Deleting the root item is not supported. This should not happen.'
              );
            } else {
              parent.children.splice(itemPath[itemPath.length - 1], 1);
            }
          })
        ),

      duplicateMenuItem: (menuIndex: number, itemPath: number[]) =>
        set(
          produce((state) => {
            const { parent, item } = getMenuItem(state.menus[menuIndex].root, itemPath);

            // If the parent is null, we are attempting to duplicate the root item. This
            // should not happen for now.
            if (parent === null) {
              console.warn(
                'Duplicating the root item is not supported. This should not happen.'
              );
            } else {
              parent.children.splice(
                itemPath[itemPath.length - 1],
                0,
                lodash.cloneDeep(item)
              );
            }
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

// Helpers -------------------------------------------------------------------------------

/**
 * This function returns the menu item at the given path. The path is a list of indices.
 *
 * @param root The root menu item.
 * @param itemPath The path to the item. This is a list of indices that represent the path
 *   to the item.
 * @returns The item and its parent. If the parent is null, the root item was selected.
 */
function getMenuItem(
  root: IMenuItem,
  itemPath: number[]
): {
  item: IMenuItem;
  parent: IMenuItem | null;
} {
  let item = root;
  let parent = null;
  for (let i = 0; i < itemPath.length; i++) {
    parent = item;
    item = item.children[itemPath[i]];
  }

  // If the parent was not changed above, we are editing the root item.
  if (parent === null) {
    return { item: root, parent: null };
  } else {
    return { item, parent };
  }
}

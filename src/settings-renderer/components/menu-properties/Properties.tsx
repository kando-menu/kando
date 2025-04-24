//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Properties.module.scss';
import { TbCopy, TbTrash } from 'react-icons/tb';

import { useAppState, useMenuSettings, getSelectedChild } from '../../state';
import {
  Headerbar,
  Button,
  IconChooserButton,
  TagInput,
  InfoItem,
  ShortcutPicker,
  Swirl,
  Scrollbox,
  TextInput,
} from '../common';
import { getConfigComponent } from './item-configs';
import MenuConditions from './MenuConditions';
import MenuBehavior from './MenuBehavior';

/**
 * This component shows the properties of the currently selected menu or menu item on the
 * right side of the settings dialog.
 */
export default () => {
  const backend = useAppState((state) => state.backendInfo);
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const selectParent = useAppState((state) => state.selectParent);
  const duplicateMenu = useMenuSettings((state) => state.duplicateMenu);
  const duplicateMenuItem = useMenuSettings((state) => state.duplicateMenuItem);
  const deleteMenu = useMenuSettings((state) => state.deleteMenu);
  const deleteMenuItem = useMenuSettings((state) => state.deleteMenuItem);
  const editMenu = useMenuSettings((state) => state.editMenu);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const menuCollections = useMenuSettings((state) => state.collections);
  const [menuTags, setMenuTags] = React.useState([]);

  // Update the tag editor whenever the selected menu changes.
  React.useEffect(() => {
    setMenuTags(menus[selectedMenu]?.tags || []);
  }, [selectedMenu, menus]);

  if (selectedMenu === -1 || selectedMenu >= menus.length) {
    return (
      <>
        <Headerbar />
        <div className={classes.properties}></div>
      </>
    );
  }

  // Accumulate a list of all tags which are currently used in our collections and menus.
  let allAvailableTags = menuCollections
    .map((collection) => collection.tags)
    .concat(menus.map((menu) => menu.tags))
    .filter((tag) => tag)
    .reduce((acc, tags) => acc.concat(tags), []);

  // Remove duplicates.
  allAvailableTags = Array.from(new Set(allAvailableTags));

  // Get the currently selected menu item and whether it is the root item or not.
  const { selectedItem, isRoot } = getSelectedChild(
    menus,
    selectedMenu,
    selectedChildPath
  );

  // Returns a shortcut picker if the current backend supports shortcuts, else it will
  // return a text input for the shortcut ID.
  const getShortcutPicker = () => {
    if (backend.supportsShortcuts) {
      return (
        <div className={classes.row}>
          <div>
            Shortcut
            <InfoItem info="The shortcut to open this menu. A shortcut must contain one normal key and any number of modifiers such as Ctrl, Alt, or Shift." />
          </div>
          <ShortcutPicker
            initialValue={menus[selectedMenu].shortcut}
            onChange={(shortcut) => {
              editMenu(selectedMenu, (menu) => {
                menu.shortcut = shortcut;
                return menu;
              });
            }}
          />
        </div>
      );
    } else {
      return (
        <TextInput
          initialValue={menus[selectedMenu].shortcutID}
          label="Shortcut ID"
          placeholder="Not bound"
          info={backend.shortcutHint}
          onChange={(shortcutID) => {
            editMenu(selectedMenu, (menu) => {
              menu.shortcutID = shortcutID;
              return menu;
            });
          }}
        />
      );
    }
  };

  return (
    <>
      <Headerbar />
      <div className={classes.container}>
        <div className={classes.icon}>
          <IconChooserButton
            iconSize="4em"
            variant="flat"
            buttonSize="large"
            icon={selectedItem.icon}
            theme={selectedItem.iconTheme}
            onChange={(icon, theme) => {
              editMenuItem(selectedMenu, selectedChildPath, (item) => {
                item.icon = icon;
                item.iconTheme = theme;
                return item;
              });
            }}
          />
        </div>
        <div className={classes.name}>
          <TextInput
            initialValue={selectedItem.name}
            variant="flat"
            onChange={(name) => {
              editMenuItem(selectedMenu, selectedChildPath, (item) => {
                item.name = name;
                return item;
              });
            }}
          />
        </div>
        <Swirl variant="3" width="min(250px, 80%)" marginBottom={10} marginTop={10} />
        <Scrollbox>
          <div className={classes.properties}>
            {
              // Show the hotkey selector for the root menu.
              isRoot && getShortcutPicker()
            }
            {
              // If the selected item is the root of the menu, we show the tag editor.
              isRoot && (
                <div className={classes.row} style={{ alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2 }}>
                    Tags
                    <InfoItem info="Tags can be used to group menus in menu collections." />
                  </div>
                  <TagInput
                    tags={menuTags}
                    onChange={(newTags) => {
                      editMenu(selectedMenu, (menu) => {
                        menu.tags = newTags;
                        return menu;
                      });
                      setMenuTags(newTags);
                    }}
                    suggestions={allAvailableTags}
                  />
                </div>
              )
            }
            {
              // We also show the sections for the menu behavior and conditions.
              isRoot && (
                <>
                  <MenuBehavior />
                  <MenuConditions />
                </>
              )
            }
            {!isRoot && selectedItem && getConfigComponent(selectedItem.type)}
          </div>
        </Scrollbox>
        <div className={classes.floatingButton}>
          <Button
            icon={<TbCopy />}
            tooltip={isRoot ? 'Duplicate menu' : 'Duplicate menu item'}
            variant="floating"
            size="large"
            grouped
            onClick={() => {
              if (isRoot) {
                duplicateMenu(selectedMenu);
              } else {
                duplicateMenuItem(selectedMenu, selectedChildPath);
              }
            }}
          />
          <Button
            icon={<TbTrash />}
            tooltip={isRoot ? 'Delete menu' : 'Delete menu item'}
            variant="floating"
            size="large"
            grouped
            onClick={() => {
              if (isRoot) {
                deleteMenu(selectedMenu);
              } else {
                deleteMenuItem(selectedMenu, selectedChildPath);
                selectParent();
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

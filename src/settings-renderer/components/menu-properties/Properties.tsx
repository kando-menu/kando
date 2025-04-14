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

import { useAppState, useMenuSettings } from '../../state';

import Headerbar from '../common/Headerbar';
import Button from '../common/Button';
import IconChooserButton from '../common/IconChooserButton';
import TagInput from '../common/TagInput';
import Swirl from '../common/Swirl';

/**
 * This component shows the properties of the currently selected menu or menu item on the
 * right side of the settings dialog.
 */
export default () => {
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

  let selectedItem = menus[selectedMenu].root;
  let isRoot = true;
  for (let i = 0; i < selectedChildPath.length; i++) {
    selectedItem = selectedItem.children[selectedChildPath[i]];
    isRoot = false;
  }

  return (
    <>
      <Headerbar />
      <div className={classes.properties}>
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
        <div className={classes.name}>{selectedItem.name}</div>
        <Swirl variant="2" width="min(250px, 80%)" marginBottom={20} />
        {
          // If the selected item is the root of the menu, we show the tag editor.
          isRoot && (
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
          )
        }
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

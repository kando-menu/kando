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
import {
  Headerbar,
  Button,
  IconChooserButton,
  TagInput,
  Swirl,
  TextInput,
  Checkbox,
  Note,
} from '../common';
import { ItemConfigRegistry } from '../../../common/item-config-registry';

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
        {
          // We also show the section for the menu behavior.
          isRoot && (
            <>
              <h1>Menu Behavior</h1>
              <Note marginTop={-8}>
                Before you enable these options, we recommend learning Kando's default
                behavior and why we like it{' '}
                <a href="https://www.youtube.com/watch?v=elHUCarOiXQ" target="_blank">
                  here
                </a>
                !
              </Note>
              <Checkbox
                label="Centered Mode"
                info="Open the menu in the screen's center instead of at the cursor."
                initialValue={menus[selectedMenu].centered}
                onChange={(centered) => {
                  editMenu(selectedMenu, (menu) => {
                    menu.centered = centered;
                    return menu;
                  });
                }}
              />
              <Checkbox
                label="Anchored Mode"
                info="Open submenus at the same position as the parent menu."
                initialValue={menus[selectedMenu].anchored}
                onChange={(anchored) => {
                  editMenu(selectedMenu, (menu) => {
                    menu.anchored = anchored;
                    return menu;
                  });
                }}
              />
              <Checkbox
                label="Hover Mode"
                info="For power users only! Select items by hovering over them."
                initialValue={menus[selectedMenu].hoverMode}
                onChange={(hoverMode) => {
                  editMenu(selectedMenu, (menu) => {
                    menu.hoverMode = hoverMode;
                    return menu;
                  });
                }}
              />
            </>
          )
        }
        {
          // And the section for the menu conditions.
          isRoot && (
            <>
              <h1>Menu Conditions</h1>
              <Note marginTop={-8}>
                You can bind multiple menus to the same shortcut and then choose under
                which conditions each menu should be shown.
              </Note>
            </>
          )
        }
        <Swirl variant="2" width="min(250px, 80%)" marginBottom={20} />
        <Note center marginLeft={'10%'} marginRight={'10%'}>
          {selectedItem &&
            ItemConfigRegistry.getInstance().getTipOfTheDay(selectedItem.type)}
        </Note>
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

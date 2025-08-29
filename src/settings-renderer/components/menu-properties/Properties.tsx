//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import * as classes from './Properties.module.scss';
import { TbCopy, TbTrash } from 'react-icons/tb';

import { useAppState, useMenuSettings, getSelectedChild } from '../../state';
import {
  Headerbar,
  Button,
  IconChooserButton,
  TagInput,
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
export default function Properties() {
  const backend = useAppState((state) => state.backendInfo);
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const selectParent = useAppState((state) => state.selectParent);
  const duplicateMenuItem = useMenuSettings((state) => state.duplicateMenuItem);
  const deleteMenuItem = useMenuSettings((state) => state.deleteMenuItem);
  const editMenu = useMenuSettings((state) => state.editMenu);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const [menuTags, setMenuTags] = React.useState([]);

  // Update the tag editor whenever the selected menu changes.
  React.useEffect(() => {
    setMenuTags(menus[selectedMenu]?.tags || []);
  }, [selectedMenu, menus]);

  if (selectedMenu === -1 || selectedMenu >= menus.length) {
    return (
      <>
        <Headerbar />
        <div className={classes.properties} />
      </>
    );
  }

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
        <ShortcutPicker
          info={i18next.t('settings.shortcut-info')}
          initialValue={menus[selectedMenu].shortcut}
          label={i18next.t('settings.shortcut-label')}
          mode="key-names"
          recordingPlaceholder={i18next.t('settings.shortcut-recording')}
          onChange={(shortcut) => {
            editMenu(selectedMenu, (menu) => {
              menu.shortcut = shortcut;
              return menu;
            });
          }}
        />
      );
    }
    return (
      <TextInput
        info={backend.shortcutHint}
        initialValue={menus[selectedMenu].shortcutID}
        label={i18next.t('settings.shortcut-id-label')}
        placeholder={i18next.t('settings.not-bound')}
        onChange={(shortcutID) => {
          editMenu(selectedMenu, (menu) => {
            menu.shortcutID = shortcutID;
            return menu;
          });
        }}
      />
    );
  };

  return (
    <>
      <Headerbar />
      <div className={classes.container}>
        <div className={classes.icon}>
          <IconChooserButton
            buttonSize="large"
            icon={selectedItem.icon}
            iconSize="4em"
            theme={selectedItem.iconTheme}
            variant="flat"
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
        <Swirl marginBottom={10} marginTop={10} variant="2" width="min(250px, 80%)" />
        <Scrollbox>
          <div className={classes.properties}>
            {
              // Show the hotkey selector for the root menu.
              isRoot ? getShortcutPicker() : null
            }
            {
              // If the selected item is the root of the menu, we show the tag editor.
              isRoot ? (
                <TagInput
                  info={i18next.t('settings.tags-info')}
                  label={i18next.t('settings.tags')}
                  tags={menuTags}
                  onChange={(newTags) => {
                    editMenu(selectedMenu, (menu) => {
                      menu.tags = newTags;
                      return menu;
                    });
                    setMenuTags(newTags);
                  }}
                />
              ) : null
            }
            {
              // We also show the sections for the menu behavior and conditions.
              isRoot ? (
                <>
                  <MenuBehavior />
                  <MenuConditions />
                </>
              ) : null
            }
            {!isRoot && selectedItem ? getConfigComponent(selectedItem.type) : null}
          </div>
        </Scrollbox>
        {!isRoot && (
          <div className={classes.floatingButton}>
            <Button
              grouped
              icon={<TbCopy />}
              size="large"
              tooltip={i18next.t('settings.duplicate-menu-item')}
              variant="floating"
              onClick={() => {
                duplicateMenuItem(selectedMenu, selectedChildPath);
              }}
            />
            <Button
              grouped
              icon={<TbTrash />}
              size="large"
              tooltip={i18next.t('settings.delete-menu-item')}
              variant="floating"
              onClick={() => {
                deleteMenuItem(selectedMenu, selectedChildPath);
                selectParent();
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

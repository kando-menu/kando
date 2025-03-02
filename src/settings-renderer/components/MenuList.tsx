//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import { TbPlus } from 'react-icons/tb';

import * as classes from './MenuList.module.scss';

import { useMenuSettings, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';
import Button from './widgets/Button';

export default () => {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);

  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const addMenu = useMenuSettings((state) => state.addMenu);

  // Make sure that the selected menu is valid. This could for instance happen if
  // the currently selected menu is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  if (selectedMenu >= menus.length) {
    selectMenu(menus.length - 1);
  }

  const backend = useAppState((state) => state.backendInfo);

  const [animatedList] = useAutoAnimate();

  const visibleMenus = menus
    .map((menu, index) => {
      return { menu, index };
    })
    .filter((menu) => {
      // If the user has not selected a collection, all menus are visible.
      if (selectedCollection === -1) {
        return true;
      }

      // Else, a menu must have all tags of the selected collection to be visible.
      return menuCollections[selectedCollection].tags.every((tag) =>
        menu.menu.tags?.includes(tag)
      );
    });

  return (
    <div className={classes.menuList}>
      <div className={classes.menuListHeader}>
        {menuCollections[selectedCollection]?.name || 'All Menus'}
      </div>
      <div className={classes.menuListContent}>
        <Scrollbox>
          <div ref={animatedList}>
            {visibleMenus.map(({ menu, index }) => {
              const shortcut = backend.supportsShortcuts
                ? menu.shortcut
                : menu.shortcutID;
              const className =
                classes.menu + ' ' + (index === selectedMenu ? classes.selected : '');

              return (
                <button
                  key={index}
                  draggable={true}
                  className={className}
                  onClick={() => selectMenu(index)}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flexShrink: 0, width: 32, marginRight: 10 }}>
                      <ThemedIcon name={menu.root.icon} theme={menu.root.iconTheme} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={classes.menuTitle}>{menu.root.name}</div>
                      <div className={classes.menuSubtitle}>
                        {shortcut || 'Not bound.'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Scrollbox>
        <div className={classes.floatingButton}>
          <Button
            icon={<TbPlus />}
            label="New Menu"
            variant="floating"
            size="medium"
            onClick={() => {
              addMenu(menuCollections[selectedCollection]?.tags);
              selectMenu(menus.length);
            }}
          />
        </div>
      </div>
    </div>
  );
};

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

import * as classes from './MenuList.module.scss';

import { useMenus, useAppSetting, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  const [menus, setMenus] = useMenus();
  const [menuCollections] = useAppSetting('menuCollections');

  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);

  const selectedCollection = useAppState((state) => state.selectedCollection);

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

      // Do not show any menus if the selected collection has no tags.
      if (menuCollections[selectedCollection].tags.length === 0) {
        return false;
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
      </div>
    </div>
  );
};

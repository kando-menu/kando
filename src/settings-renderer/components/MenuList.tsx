//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './MenuList.module.scss';

import { useMenus, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  const [menus, setMenus] = useMenus();
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const backend = useAppState((state) => state.backendInfo);

  return (
    <div className={classes.menuList}>
      <Scrollbox>
        {menus.map((menu, index) => {
          const shortcut = backend.supportsShortcuts ? menu.shortcut : menu.shortcutID;
          let className = classes.menu;

          if (index === selectedMenu) {
            className += ` ${classes.selected}`;
          }

          return (
            <button key={index} className={className} onClick={() => selectMenu(index)}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: 32, marginRight: 10 }}>
                  <ThemedIcon name={menu.root.icon} theme={menu.root.iconTheme} />
                </div>
                <div>
                  <div className={classes.menuTitle}>{menu.root.name}</div>
                  <div className={classes.menuSubtitle}>{shortcut || 'Not bound.'}</div>
                </div>
              </div>
            </button>
          );
        })}
      </Scrollbox>
    </div>
  );
};

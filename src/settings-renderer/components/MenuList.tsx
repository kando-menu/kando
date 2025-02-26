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

export default () => {
  const [menus, setMenus] = useMenus();
  const backend = useAppState((state) => state.backendInfo);

  return (
    <div className={classes.menuList}>
      {menus.map((menu, index) => {
        const shortcut = backend.supportsShortcuts ? menu.shortcut : menu.shortcutID;
        return (
          <div key={index} className={classes.menu}>
            <div className={classes.menuTitle}>{menu.root.name}</div>
            <div className={classes.menuSubtitle}>{shortcut || 'Not bound.'}</div>
          </div>
        );
      })}
    </div>
  );
};

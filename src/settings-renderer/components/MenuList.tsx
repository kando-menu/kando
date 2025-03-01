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

import { useMenus, useAppSetting, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  const [menus, setMenus] = useMenus();
  const [menuCollections] = useAppSetting('menuCollections');

  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);

  const selectedCollection = useAppState((state) => state.selectedCollection);
  const selectCollection = useAppState((state) => state.selectCollection);

  const backend = useAppState((state) => state.backendInfo);

  return (
    <div className={classes.container}>
      <div className={classes.collectionsList}>
        <button
          className={
            classes.collection + ' ' + (selectedCollection == -1 ? classes.selected : '')
          }
          onClick={() => selectCollection(-1)}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Show all menus">
          <ThemedIcon name="sell" theme="material-symbols-rounded" />
        </button>
        {menuCollections.map((collection, index) => {
          const className =
            classes.collection +
            ' ' +
            (index === selectedCollection ? classes.selected : '');

          return (
            <button
              key={index}
              className={className}
              onClick={() => selectCollection(index)}
              data-tooltip-id="main-tooltip"
              data-tooltip-content={collection.name}>
              <ThemedIcon name={collection.icon} theme={collection.iconTheme} />
            </button>
          );
        })}
        <button
          className={classes.collection + ' ' + classes.transparent}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Create a new collection">
          <ThemedIcon name="add" theme="material-symbols-rounded" />
        </button>
      </div>
      <div className={classes.menuList}>
        <Scrollbox>
          {menus.map((menu, index) => {
            const shortcut = backend.supportsShortcuts ? menu.shortcut : menu.shortcutID;
            const className =
              classes.menu + ' ' + (index === selectedMenu ? classes.selected : '');

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
    </div>
  );
};

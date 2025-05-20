//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { useAppState, useMenuSettings, getSelectedChild } from '../../../state';
import { Dropdown } from '../../common';
import { IItemData } from '../../../../common/item-types/redirect-item-type';

/**
 * The configuration component for redirect items is primarily a text input field for the
 * redirect.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'redirect') {
    return <></>;
  }

  // Assemble a list of all existing menu names.
  const menuNames = menus.map((menu) => menu.root.name);
  const options = Array.from(new Set(menuNames)).map((name) => {
    return { value: name, label: name };
  });

  const data = selectedItem.data as IItemData;

  return (
    <>
      <Dropdown
        options={options}
        initialValue={data.menu}
        onChange={(menuName) => {
          const menu = menus.find((menu) => menu.root.name === menuName);
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            item.name = menu?.root.name || '';
            item.icon = menu?.root.icon || '';
            item.iconTheme = menu?.root.iconTheme || '';
            (item.data as IItemData).menu = menuName;
            return item;
          });
        }}
      />
    </>
  );
};

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import { useMenuSettings, useAppState, getSelectedChild } from '../../../state';
import { Dropdown } from '../../common';

/**
 * The configuration component for submenu items allows configuring the center action.
 */
export default function SubmenuItemConfig() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);

  // Get the currently selected menu item
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  if (!selectedItem) {
    return null;
  }

  // Center action options
  const childOptions = (selectedItem.children || []).map((child) => ({
    value: `child:${child.name}`,
    label: child.name,
  }));

  const centerActionOptions = [
    {
      value: 'default',
      label:
        selectedChildPath.length === 0
          ? i18next.t('settings.centerAction.closeMenu')
          : i18next.t('settings.centerAction.goToParent'),
    },
    {
      value: 'repeat-global',
      label: i18next.t('settings.centerAction.repeatGlobal'),
    },
    {
      value: 'repeat-menu',
      label: i18next.t('settings.centerAction.repeatMenu'),
    },
    {
      value: 'repeat-submenu',
      label: i18next.t('settings.centerAction.repeatSubmenu'),
    },
    ...childOptions,
  ];

  // Get/set centerAction from item.data
  const centerAction =
    selectedItem.data && typeof selectedItem.data === 'object' && 'centerAction' in selectedItem.data
      ? (selectedItem.data.centerAction as string)
      : 'default';

  const handleChange = (value: string) => {
    editMenuItem(selectedMenu, selectedChildPath, (oldItem) => {
      const newData = { ...(typeof oldItem.data === 'object' && oldItem.data !== null ? oldItem.data : {}), centerAction: value };
      return { ...oldItem, data: newData };
    });
  };

  return (
    <Dropdown
      label={i18next.t('settings.centerAction.label')}
      info={i18next.t('settings.centerAction.tip')}
      initialValue={centerAction}
      options={centerActionOptions}
      onChange={handleChange}
    />
  );
}

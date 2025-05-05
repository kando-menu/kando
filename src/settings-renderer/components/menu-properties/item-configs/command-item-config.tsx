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

import { useAppState, useMenuSettings, getSelectedChild } from '../../../state';
import { RandomTip, TextInput, Checkbox } from '../../common';
import { IItemData } from '../../../../common/item-types/command-item-type';

/**
 * The configuration component for command items is primarily a text input field for the
 * command.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'command') {
    return <></>;
  }

  const data = selectedItem.data as IItemData;

  return (
    <>
      <TextInput
        label={i18next.t('menu-items.command.command')}
        info={i18next.t('menu-items.command.command-hint')}
        initialValue={data.command}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as IItemData).command = value;
            return item;
          });
        }}
      />
      <Checkbox
        label={i18next.t('menu-items.common.delayed-option')}
        info={i18next.t('menu-items.common.delayed-option-hint')}
        initialValue={data.delayed}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as IItemData).delayed = value;
            return item;
          });
        }}
      />
      <RandomTip
        marginTop={50}
        tips={[
          i18next.t('menu-items.command.tip-1'),
          i18next.t('menu-items.command.tip-2'),
          i18next.t('menu-items.command.tip-3'),
          i18next.t('menu-items.command.tip-4'),
          i18next.t('menu-items.command.tip-5'),
        ]}
      />
    </>
  );
};

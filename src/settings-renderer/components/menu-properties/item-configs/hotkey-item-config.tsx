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
import { RandomTip, ShortcutPicker, Checkbox } from '../../common';
import { IItemData } from '../../../../common/item-types/hotkey-item-type';

/** The configuration component for hotkey items is a shortcut picker. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'hotkey') {
    return <></>;
  }

  const data = selectedItem.data as IItemData;

  return (
    <>
      <ShortcutPicker
        label={i18next.t('menu-items.hotkey.hotkey')}
        info={i18next.t('menu-items.hotkey.hotkey-info')}
        recordingPlaceholder={i18next.t('menu-items.hotkey.recording-placeholder')}
        mode="key-codes"
        initialValue={data.hotkey}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as IItemData).hotkey = value;
            return item;
          });
        }}
      />
      <Checkbox
        label={i18next.t('menu-items.common.delayed-option')}
        info={i18next.t('menu-items.common.delayed-option-info')}
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
          i18next.t('menu-items.hotkey.tip-1'),
          i18next.t('menu-items.hotkey.tip-2'),
          i18next.t('menu-items.hotkey.tip-3', {
            link: 'https://kando.menu/valid-keynames/',
          }),
        ]}
      />
    </>
  );
};

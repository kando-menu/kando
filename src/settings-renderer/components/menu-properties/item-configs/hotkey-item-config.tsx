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
import { ItemData } from '../../../../common/item-types/hotkey-item-type';

/** The configuration component for hotkey items is a shortcut picker. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'hotkey') {
    return null;
  }

  const data = selectedItem.data as ItemData;

  return (
    <>
      <ShortcutPicker
        info={i18next.t('menu-items.hotkey.hotkey-info')}
        initialValue={data.hotkey}
        label={i18next.t('menu-items.hotkey.hotkey')}
        mode="key-codes"
        recordingPlaceholder={i18next.t('menu-items.hotkey.recording-placeholder')}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).hotkey = value;
            return item;
          });
        }}
      />
      <Checkbox
        info={i18next.t('menu-items.common.delayed-option-info')}
        initialValue={data.delayed}
        label={i18next.t('menu-items.common.delayed-option')}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).delayed = value;
            return item;
          });
        }}
      />
      <Checkbox
        info={i18next.t('menu-items.common.inhibit-shortcuts-info')}
        initialValue={data.inhibitShortcuts}
        label={i18next.t('menu-items.common.inhibit-shortcuts')}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).inhibitShortcuts = value;
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

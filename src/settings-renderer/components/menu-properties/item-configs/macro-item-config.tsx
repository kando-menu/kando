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
import { RandomTip, MacroPicker, Checkbox } from '../../common';
import { ItemData } from '../../../../common/item-types/macro-item-type';

/**
 * The configuration component for macro items is text area with a record button next to
 * it.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'macro') {
    return <></>;
  }

  const data = selectedItem.data as ItemData;

  return (
    <>
      <MacroPicker
        placeholder={i18next.t('menu-items.macro.placeholder')}
        recordingPlaceholder={i18next.t('menu-items.macro.recording-placeholder')}
        initialValue={data.macro}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).macro = value;
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
            (item.data as ItemData).delayed = value;
            return item;
          });
        }}
      />
      <RandomTip
        marginTop={50}
        tips={[
          i18next.t('menu-items.macro.tip-1'),
          i18next.t('menu-items.macro.tip-2'),
          i18next.t('menu-items.hotkey.tip-3', {
            link: 'https://kando.menu/valid-keynames/',
          }),
        ]}
      />
    </>
  );
};

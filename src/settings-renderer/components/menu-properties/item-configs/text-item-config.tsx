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
import { RandomTip, TextInput } from '../../common';
import { ItemData } from '../../../../common/item-types/text-item-type';

/** The configuration component for text items is primarily a text area. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'text') {
    return <></>;
  }

  const data = selectedItem.data as ItemData;

  return (
    <>
      <TextInput
        placeholder={i18next.t('menu-items.text.placeholder')}
        multiline
        initialValue={data.text}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).text = value;
            return item;
          });
        }}
      />
      <RandomTip marginTop={50} tips={[i18next.t('menu-items.text.tip-1')]} />
    </>
  );
};

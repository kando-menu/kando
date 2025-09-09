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
import { ItemData } from '../../../../common/item-types/uri-item-type';

/** The configuration component for uri items is primarily a text input field for the URI. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'uri') {
    return null;
  }

  const data = selectedItem.data as ItemData;

  return (
    <>
      <TextInput
        isMultiline
        initialValue={data.uri}
        placeholder={i18next.t('menu-items.uri.placeholder')}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).uri = value;
            return item;
          });
        }}
      />
      <RandomTip
        marginTop={50}
        tips={[
          i18next.t('menu-items.uri.tip-1'),
          i18next.t('menu-items.uri.tip-2'),
          i18next.t('menu-items.uri.tip-3'),
          i18next.t('menu-items.uri.tip-4'),
          i18next.t('menu-items.uri.tip-5'),
          i18next.t('menu-items.uri.tip-6'),
        ]}
      />
    </>
  );
};

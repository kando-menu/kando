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
import { RandomTip, FilePicker } from '../../common';
import { IItemData } from '../../../../common/item-types/file-item-type';

/**
 * The configuration component for file items is primarily a text input field for the file
 * path.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'file') {
    return <></>;
  }

  const data = selectedItem.data as IItemData;

  return (
    <>
      <FilePicker
        placeholder={i18next.t('menu-items.file.placeholder')}
        initialValue={data.path}
        onChange={(path) => {
          const parts = path.split(/[/\\]/);
          const name = parts[parts.length - 1];

          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            item.name = name;
            (item.data as IItemData).path = path;
            return item;
          });
        }}
      />
      <RandomTip marginTop={50} tips={[i18next.t('menu-items.file.tip-1')]} />
    </>
  );
};

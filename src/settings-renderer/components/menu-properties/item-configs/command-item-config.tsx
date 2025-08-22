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
import { TbApps } from 'react-icons/tb';

import { useAppState, useMenuSettings, getSelectedChild } from '../../../state';
import { RandomTip, TextInput, Checkbox, Button } from '../../common';
import { ItemData } from '../../../../common/item-types/command-item-type';
import AppPicker from '../AppPicker';

/**
 * The configuration component for command items is primarily a text input field for the
 * command.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const supportsIsolatedProcesses = useAppState(
    (state) => state.systemInfo.supportsIsolatedProcesses
  );
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  const [appPickerVisible, setAppPickerVisible] = React.useState(false);

  // Sanity check. Should never happen, but just in case.
  if (!selectedItem || selectedItem.type !== 'command') {
    return <></>;
  }

  const data = selectedItem.data as ItemData;

  return (
    <>
      <Button
        variant="secondary"
        label={i18next.t('menu-items.command.choose-app')}
        icon={<TbApps />}
        onClick={() => {
          setAppPickerVisible(true);
        }}
      />
      <TextInput
        placeholder={i18next.t('menu-items.command.placeholder')}
        multiline
        initialValue={data.command}
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).command = value;
            return item;
          });
        }}
      />
      {supportsIsolatedProcesses && (
        <Checkbox
          label={i18next.t('menu-items.command.isolated')}
          info={i18next.t('menu-items.command.isolated-info')}
          initialValue={data.isolated}
          onChange={(value) => {
            editMenuItem(selectedMenu, selectedChildPath, (item) => {
              (item.data as ItemData).isolated = value;
              return item;
            });
          }}
        />
      )}
      <Checkbox
        label={i18next.t('menu-items.command.detached')}
        info={i18next.t('menu-items.command.detached-info')}
        initialValue={data.detached !== false} // explicitly check because undefined should mean true
        onChange={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            (item.data as ItemData).detached = value;
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
          i18next.t('menu-items.command.tip-1'),
          i18next.t('menu-items.command.tip-2'),
          i18next.t('menu-items.command.tip-3'),
          i18next.t('menu-items.command.tip-4'),
          i18next.t('menu-items.command.tip-5'),
          i18next.t('menu-items.command.tip-6', {
            link: 'https://kando.menu/item-run-command/',
          }),
        ]}
      />
      <AppPicker
        visible={appPickerVisible}
        onSelect={(value) => {
          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            item.name = value.name;
            item.icon = value.icon;
            item.iconTheme = value.iconTheme;
            (item.data as ItemData).command = value.command;
            return item;
          });
        }}
        onClose={() => setAppPickerVisible(false)}
      />
    </>
  );
};

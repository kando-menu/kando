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

import { useAppState } from '../../../state';
import { TextInput, Checkbox, Button } from '../../common';
import { ExecuteCommandAction } from '../../../../common';
import AppPicker from '../AppPicker';

type Props = {
  /** The action to configure. */
  readonly action: ExecuteCommandAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: ExecuteCommandAction) => void;

  /** Function to call when the container menu item should be modified. */
  readonly onUpdateItem: (info: {
    name?: string;
    icon?: string;
    iconTheme?: string;
  }) => void;
};

/**
 * The configuration component for command actions is primarily a text input field for the
 * command.
 */
export function ExecuteCommandActionConfig(props: Props) {
  const supportsIsolatedProcesses = useAppState(
    (state) => state.systemInfo.supportsIsolatedProcesses
  );

  const [appPickerVisible, setAppPickerVisible] = React.useState(false);

  return (
    <>
      <div style={{ display: 'flex', gap: '2px' }}>
        <TextInput
          isGrouped
          initialValue={props.action.command}
          placeholder={i18next.t('menu-actions.execute-command.placeholder')}
          onChange={(value) => {
            props.onUpdateAction({
              ...props.action,
              command: value,
            });
          }}
        />
        <Button
          isGrouped
          icon={<TbApps />}
          tooltip={i18next.t('menu-actions.execute-command.choose-app')}
          variant="secondary"
          onClick={() => {
            setAppPickerVisible(true);
          }}
        />
      </div>
      {supportsIsolatedProcesses ? (
        <Checkbox
          info={i18next.t('menu-actions.execute-command.isolated-info')}
          initialValue={props.action.isolated}
          label={i18next.t('menu-actions.execute-command.isolated')}
          onChange={(value) => {
            props.onUpdateAction({
              ...props.action,
              isolated: value,
            });
          }}
        />
      ) : null}
      <Checkbox
        info={i18next.t('menu-actions.execute-command.detached-info')}
        initialValue={props.action.detached !== false} // explicitly check because undefined should mean true
        label={i18next.t('menu-actions.execute-command.detached')}
        onChange={(value) => {
          props.onUpdateAction({
            ...props.action,
            detached: value,
          });
        }}
      />

      <AppPicker
        isVisible={appPickerVisible}
        onClose={() => setAppPickerVisible(false)}
        onSelect={(value) => {
          props.onUpdateAction({
            ...props.action,
            command: value.command,
          });

          props.onUpdateItem({
            name: value.name,
            icon: value.icon,
            iconTheme: value.iconTheme,
          });
        }}
      />
    </>
  );
}

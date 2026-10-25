//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Bharat Kaurav <117659673+TheNetherWatcher@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import { Checkbox, SettingsRow, Spinbutton, TextInput } from '../../common';
import { SendTCPMessageAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: SendTCPMessageAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: SendTCPMessageAction) => void;
};

/**
 * The configuration component for TCP message actions provides fields for the server host
 * and port, the message to send, and whether a line break should be appended.
 */
export function SendTCPMessageActionConfig(props: Props) {
  return (
    <>
      <SettingsRow isGrowing>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TextInput
            initialValue={props.action.host}
            placeholder="127.0.0.1"
            tooltip={i18next.t('menu-actions.send-tcp-message.host-tooltip')}
            onChange={(value) => {
              props.onUpdateAction({ ...props.action, host: value });
            }}
          />
          <Spinbutton
            initialValue={props.action.port}
            max={65535}
            min={1}
            step={1}
            tooltip={i18next.t('menu-actions.send-tcp-message.port-tooltip')}
            onChange={(value) => {
              props.onUpdateAction({ ...props.action, port: Math.round(value) });
            }}
          />
        </div>
      </SettingsRow>

      <TextInput
        isMultiline
        initialValue={props.action.message}
        placeholder={i18next.t('menu-actions.send-tcp-message.message-placeholder')}
        onChange={(value) => {
          props.onUpdateAction({ ...props.action, message: value });
        }}
      />
      <Checkbox
        info={i18next.t('menu-actions.send-tcp-message.append-newline-info')}
        initialValue={props.action.appendNewline}
        label={i18next.t('menu-actions.send-tcp-message.append-newline-label')}
        onChange={(value) => {
          props.onUpdateAction({ ...props.action, appendNewline: value });
        }}
      />
    </>
  );
}

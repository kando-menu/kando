//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: dvd233 <111864431+dvd233@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import { SettingsRow, TextInput } from '../../common';
import { SendWebSocketMessageAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: SendWebSocketMessageAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: SendWebSocketMessageAction) => void;
};

/**
 * The configuration component for WebSocket message actions provides fields for the
 * server URL and the message to send.
 */
export function SendWebSocketMessageActionConfig(props: Props) {
  return (
    <>
      <SettingsRow
        isGrowing
        label={i18next.t('menu-actions.send-websocket-message.url-label')}>
        <TextInput
          initialValue={props.action.url}
          placeholder="ws://127.0.0.1:1234"
          onChange={(value) => {
            props.onUpdateAction({ ...props.action, url: value });
          }}
        />
      </SettingsRow>
      <SettingsRow
        isGrowing
        label={i18next.t('menu-actions.send-websocket-message.message-label')}>
        <TextInput
          isMultiline
          initialValue={props.action.message}
          placeholder={i18next.t(
            'menu-actions.send-websocket-message.message-placeholder'
          )}
          onChange={(value) => {
            props.onUpdateAction({ ...props.action, message: value });
          }}
        />
      </SettingsRow>
    </>
  );
}

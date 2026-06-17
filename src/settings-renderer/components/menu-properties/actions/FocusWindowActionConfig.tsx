//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import { BiTargetLock } from 'react-icons/bi';

import { Button, TextInput, Note } from '../../common';
import WindowPicker from '../WindowPicker';
import { FocusWindowAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: FocusWindowAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: FocusWindowAction) => void;
};

/**
 * The configuration component for focus window actions allows the user to specify the
 * application and window names to focus.
 */
export function FocusWindowActionConfig(props: Props) {
  const [appPickerVisible, setAppPickerVisible] = React.useState(false);
  const [windowPickerVisible, setWindowPickerVisible] = React.useState(false);

  return (
    <>
      <Note>{i18next.t('menu-actions.focus-window.hint')}</Note>
      <div style={{ display: 'flex', gap: '2px' }}>
        <TextInput
          isGrouped
          placeholder={i18next.t('settings.app-condition-placeholder')}
          initialValue={props.action.appName}
          onChange={(value) => {
            props.onUpdateAction({
              ...props.action,
              appName: value,
            });
          }}
        />
        <Button
          isGrouped
          icon={<BiTargetLock />}
          tooltip={i18next.t('settings.app-condition-tooltip')}
          variant="secondary"
          onClick={() => {
            setAppPickerVisible(true);
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        <TextInput
          isGrouped
          placeholder={i18next.t('settings.window-condition-placeholder')}
          initialValue={props.action.windowName}
          onChange={(value) => {
            props.onUpdateAction({
              ...props.action,
              windowName: value,
            });
          }}
        />
        <Button
          isGrouped
          icon={<BiTargetLock />}
          tooltip={i18next.t('settings.window-condition-tooltip')}
          variant="secondary"
          onClick={() => {
            setWindowPickerVisible(true);
          }}
        />
      </div>

      <WindowPicker
        isVisible={appPickerVisible}
        mode="application"
        onClose={() => setAppPickerVisible(false)}
        onSelect={(value) => {
          props.onUpdateAction({
            ...props.action,
            appName: value,
          });
        }}
      />

      <WindowPicker
        isVisible={windowPickerVisible}
        mode="title"
        onClose={() => setWindowPickerVisible(false)}
        onSelect={(value) => {
          props.onUpdateAction({
            ...props.action,
            windowName: value,
          });
        }}
      />
    </>
  );
}

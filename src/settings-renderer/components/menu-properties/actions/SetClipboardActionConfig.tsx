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

import { TextInput } from '../../common';
import { SetClipboardAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: SetClipboardAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: SetClipboardAction) => void;
};

/**
 * The configuration component for clipboard actions is primarily a text input field for
 * the clipboard content.
 */
export function SetClipboardActionConfig(props: Props) {
  return (
    <TextInput
      isMultiline
      initialValue={props.action.text}
      placeholder={i18next.t('menu-actions.set-clipboard.placeholder')}
      onChange={(value) => {
        props.onUpdateAction({ ...props.action, text: value });
      }}
    />
  );
}

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

import { TextInput } from '../../common';
import { SetClipboardAction } from '../../../../common';

type Props = {
  /**
   * The set-clipboard action to configure. If not provided, the component will use the
   * selected menu item from the state.
   */
  readonly action?: SetClipboardAction;

  /**
   * Function to call when the action changes. If not provided, the component will use
   * editMenuItem from state.
   */
  readonly onChange?: (action: SetClipboardAction) => void;
};

/**
 * The configuration component for set-clipboard actions is a text input field for the
 * text to be set to the clipboard.
 */
export function SetClipboardActionConfig({ action, onChange }: Props) {
  // If action and onChange are provided, use them directly (workflow context)
  const finalAction = action || ({} as SetClipboardAction);
  const finalOnChange =
    onChange ||
    (() => {
      // No-op fallback
    });

  return (
    <TextInput
      isMultiline
      initialValue={finalAction.text || ''}
      placeholder={i18next.t('menu-items.set-clipboard.placeholder')}
      onChange={(value) => {
        finalOnChange({
          ...finalAction,
          text: value,
        });
      }}
    />
  );
}

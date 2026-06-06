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
import { OpenURIAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: OpenURIAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: OpenURIAction) => void;
};

/**
 * The configuration component for uri actions is primarily a text input field for the
 * URI.
 */
export function OpenURIActionConfig(props: Props) {
  return (
    <TextInput
      isMultiline
      initialValue={props.action.uri}
      placeholder={i18next.t('menu-actions.open-uri.placeholder')}
      onChange={(value) => {
        props.onUpdateAction({ ...props.action, uri: value });
      }}
    />
  );
}

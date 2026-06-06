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

import { FilePicker } from '../../common';
import { OpenFileAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: OpenFileAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: OpenFileAction) => void;

  /** Function to call when the container menu item should be modified. */
  readonly onUpdateItem: (info: {
    name?: string;
    icon?: string;
    iconTheme?: string;
  }) => void;
};

/**
 * The configuration component for file actions is primarily a text input field for the
 * file path.
 */
export function OpenFileActionConfig(props: Props) {
  return (
    <FilePicker
      initialValue={props.action.path}
      placeholder={i18next.t('menu-actions.open-file.placeholder')}
      onChange={(path) => {
        const parts = path.split(/[/\\]/);
        const name = parts[parts.length - 1];

        props.onUpdateAction({
          ...props.action,
          path,
        });

        props.onUpdateItem({ name });
      }}
    />
  );
}

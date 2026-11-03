//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   |  \ |__| | \| |__/ |__|    Read more on github.com/kando-menu/kando               //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import { IconChooserButton, SettingsRow } from '../../common';
import { TemporaryIconAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: TemporaryIconAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: TemporaryIconAction) => void;
};

/** Allows choosing the icon shown temporarily during scrolling. */
export function TemporaryIconActionConfig(props: Props) {
  return (
    <SettingsRow label={i18next.t('menu-actions.temporary-icon.icon-label')}>
      <IconChooserButton
        icon={props.action.icon}
        theme={props.action.iconTheme}
        onChange={(icon, iconTheme) => {
          props.onUpdateAction({ ...props.action, icon, iconTheme });
        }}
      />
    </SettingsRow>
  );
}

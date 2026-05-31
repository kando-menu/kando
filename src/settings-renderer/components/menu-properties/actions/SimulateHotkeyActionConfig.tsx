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

import { ShortcutPicker } from '../../common';
import { SimulateHotkeyAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: SimulateHotkeyAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: SimulateHotkeyAction) => void;
};

/** The configuration component for hotkey items is a shortcut picker. */
export function SimulateHotkeyActionConfig(props: Props) {
  return (
    <ShortcutPicker
      isGrowing
      useModifiers
      info={i18next.t('menu-actions.simulate-hotkey.hotkey-info')}
      initialValue={props.action.hotkey}
      label={i18next.t('menu-actions.simulate-hotkey.hotkey')}
      mode="key-codes"
      recordingPlaceholder={i18next.t('menu-actions.simulate-hotkey.recording-placeholder')}
      onChange={(value) => {
        props.onUpdateAction({
          ...props.action,
          hotkey: value,
        });
      }}
    />
  );
}

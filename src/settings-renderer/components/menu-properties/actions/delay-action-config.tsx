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

import { Spinbutton } from '../../common';
import { DelayAction } from '../../../../common';

type Props = {
  /**
   * The delay action to configure. If not provided, the component will use the selected
   * menu item from the state.
   */
  readonly action?: DelayAction;

  /**
   * Function to call when the action changes. If not provided, the component will use
   * editMenuItem from state.
   */
  readonly onChange?: (action: DelayAction) => void;
};

/**
 * The configuration component for delay actions is a spinbutton to set the duration in
 * seconds.
 */
export function DelayActionConfig({ action, onChange }: Props) {
  // If action and onChange are provided, use them directly (workflow context)
  const finalAction = action || ({} as DelayAction);
  const finalOnChange =
    onChange ||
    (() => {
      // No-op fallback
    });

  return (
    <Spinbutton
      info={i18next.t('menu-items.delay.duration-info')}
      initialValue={finalAction.duration || 1}
      label={i18next.t('menu-items.delay.duration-label')}
      min={0}
      step={0.1}
      onChange={(value) => {
        finalOnChange({
          ...finalAction,
          duration: value,
        });
      }}
    />
  );
}

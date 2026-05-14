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
  /** The action to configure. */
  readonly action: DelayAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: DelayAction) => void;
};

/**
 * The configuration component for delay actions is a spinbutton to set the duration in
 * seconds.
 */
export function DelayActionConfig(props: Props) {
  return (
    <Spinbutton
      info={i18next.t('menu-items.delay.duration-info')}
      initialValue={props.action.duration}
      label={i18next.t('menu-items.delay.duration-label')}
      max={60}
      min={0}
      step={0.1}
      onChange={(value) => {
        props.onUpdateAction({
          ...props.action,
          duration: value,
        });
      }}
    />
  );
}

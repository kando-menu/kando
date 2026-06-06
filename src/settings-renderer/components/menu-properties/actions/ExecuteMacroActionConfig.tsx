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

import { MacroPicker } from '../../common';
import { ExecuteMacroAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: ExecuteMacroAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: ExecuteMacroAction) => void;
};

/**
 * The configuration component for macro actions is text area with a record button next to
 * it.
 */
export function ExecuteMacroActionConfig(props: Props) {
  return (
    <MacroPicker
      initialValue={props.action.macro}
      placeholder={i18next.t('menu-actions.execute-macro.placeholder')}
      recordingPlaceholder={i18next.t('menu-actions.execute-macro.recording-placeholder')}
      onChange={(value) => {
        props.onUpdateAction({ ...props.action, macro: value });
      }}
    />
  );
}

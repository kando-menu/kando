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

import { Note } from '../../common';

type Props = {
  /** The open-settings action. This action has no configuration options. */
  readonly action?: OpenSettingsAction;

  /**
   * Callback when action is updated. For open-settings, this is typically not called as
   * there are no configurable fields.
   */
  readonly onChange?: (action: OpenSettingsAction) => void;
};

/**
 * The configuration component for open-settings actions shows an info message since there
 * are no configuration options for this action type.
 */
export function OpenSettingsActionConfig({ action, onChange }: Props) {
  return (
    <Note noteStyle="small">{i18next.t('menu-items.open-settings.description')}</Note>
  );
}

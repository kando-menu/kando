//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import SettingsRow from './SettingsRow';

import * as classes from './Checkbox.module.scss';

type Props = {
  /** Function to call when the checkbox is toggled. */
  readonly onChange?: (value: boolean) => void;

  /** Initial value of the checkbox. Defaults to false. */
  readonly isInitialValue?: boolean;

  /** Optional label text to display next to the checkbox. */
  readonly label?: string;

  /** Optional information to display next to the label. */
  readonly info?: string;

  /** Whether the checkbox is disabled. Defaults to false. */
  readonly isDisabled?: boolean;
};

/**
 * A customizable checkbox component.
 *
 * @param props - The properties for the checkbox component.
 * @returns A checkbox element.
 */
export default function Checkbox(props: Props) {
  return (
    <SettingsRow
      isLabelClickable
      info={props.info}
      isDisabled={props.isDisabled}
      label={props.label}>
      <input
        checked={props.isInitialValue || false}
        className={classes.checkbox}
        disabled={props.isDisabled}
        type="checkbox"
        onChange={(event) => props.onChange && props.onChange(event.target.checked)}
      />
    </SettingsRow>
  );
}

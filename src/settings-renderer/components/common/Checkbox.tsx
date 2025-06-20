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

interface IProps {
  /** Function to call when the checkbox is toggled. */
  onChange?: (value: boolean) => void;

  /** Initial value of the checkbox. Defaults to false. */
  initialValue?: boolean;

  /** Optional label text to display next to the checkbox. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the checkbox is disabled. Defaults to false. */
  disabled?: boolean;
}

/**
 * A customizable checkbox component.
 *
 * @param props - The properties for the checkbox component.
 * @returns A checkbox element.
 */
export default function Checkbox(props: IProps) {
  return (
    <SettingsRow
      label={props.label}
      info={props.info}
      labelClickable
      disabled={props.disabled}>
      <input
        type="checkbox"
        className={classes.checkbox}
        disabled={props.disabled}
        checked={props.initialValue || false}
        onChange={(event) => props.onChange && props.onChange(event.target.checked)}
      />
    </SettingsRow>
  );
}

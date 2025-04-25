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

import * as classes from './Dropdown.module.scss';

interface IProps<T extends string> {
  /** Function to call when the selected option changes. */
  onChange?: (value: T) => void;

  /**
   * Array of options to display in the dropdown. Each option has a value and a label.
   * Both the values here and the initialValue of the component must use the same type.
   */
  options: { value: T; label: string }[];

  /** Initial value of the dropdown. */
  initialValue: T;

  /** Optional label text to display next to the dropdown. */
  label?: string;

  /** Optional additional information to display next to the label. */
  info?: string;

  /** Whether the dropdown is disabled. Defaults to false. */
  disabled?: boolean;

  /** Optional minimum width of the dropdown. */
  minWidth?: number;
}

/**
 * A customizable dropdown component.
 *
 * @param props - The properties for the dropdown component.
 * @returns A dropdown element.
 */
export default <T extends string>(props: IProps<T>) => {
  const invalidSelection =
    props.options.find((option) => option.value === props.initialValue) === undefined;

  return (
    <SettingsRow label={props.label} info={props.info} grow maxWidth={200}>
      <select
        className={classes.select}
        disabled={props.disabled}
        style={{ minWidth: props.minWidth }}
        value={invalidSelection ? '__invalid__' : props.initialValue}
        onChange={(event) => props.onChange && props.onChange(event.target.value as T)}>
        {
          // If the initial value is invalid, we add a placeholder option.
          invalidSelection && (
            <option hidden disabled value="__invalid__">
              Select an option...
            </option>
          )
        }
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingsRow>
  );
};

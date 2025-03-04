//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';

import InfoItem from './InfoItem';

import * as classes from './Dropdown.module.scss';
const cx = classNames.bind(classes);

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
}

/**
 * A customizable dropdown component.
 *
 * @param props - The properties for the dropdown component.
 * @returns A dropdown element.
 */
export default <T extends string>(props: IProps<T>) => {
  return (
    <label
      className={cx({
        dropdown: true,
        disabled: props.disabled,
      })}>
      <div>
        {props.label}
        {props.info && <InfoItem info={props.info} />}
      </div>
      <select
        disabled={props.disabled}
        value={props.initialValue}
        onChange={(event) => props.onChange && props.onChange(event.target.value as T)}>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

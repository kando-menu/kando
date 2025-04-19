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

import * as classes from './TextInput.module.scss';
const cx = classNames.bind(classes);

interface IProps {
  /**
   * Function to call when the value changes. This will be called when the user presses
   * Enter after typing a value, or when the user clicks outside of the text field.
   */
  onChange?: (value: string) => void;

  /** Initial value of the spinbutton. */
  initialValue: string;

  /** Optional label text to display next to the spinbutton. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the spinbutton is disabled. Defaults to false. */
  disabled?: boolean;

  /** The flat variant has no background color and shows the text centered. */
  variant?: 'normal' | 'flat';
}

/**
 * This component is an input field that allows the user to enter some text.
 *
 * @param props - The properties for the text-input component.
 * @returns A text-input element.
 */
export default (props: IProps) => {
  const [value, setValue] = React.useState(props.initialValue);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setValue(props.initialValue), [props.initialValue]);

  return (
    <div
      className={cx({
        row: true,
        flat: props.variant === 'flat',
        disabled: props.disabled,
      })}>
      {(props.label || props.info) && (
        <div className={classes.label}>
          {props.label}
          {props.info && <InfoItem info={props.info} />}
        </div>
      )}
      <input
        type="text"
        disabled={props.disabled}
        value={value}
        onBlur={() => props.onChange?.(value)}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
};

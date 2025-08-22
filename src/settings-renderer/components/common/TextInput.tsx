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

import SettingsRow from './SettingsRow';

import * as classes from './TextInput.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /**
   * Function to call when the value changes. This will be called when the user presses
   * Enter after typing a value, or when the user clicks outside of the text field.
   */
  onChange?: (value: string) => void;

  /** Initial value of the text input. */
  initialValue: string;

  /** Optional placeholder text to display when the text input is empty. */
  placeholder?: string;

  /** Optional label text to display next to the text input. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the text input is disabled. Defaults to false. */
  disabled?: boolean;

  /** The flat variant has no background color and shows the text centered. */
  variant?: 'normal' | 'flat';

  /**
   * Whether the text input should support multiple lines. In this case, the label will be
   * displayed above the text input.
   */
  multiline?: boolean;
};

/**
 * This component is an input field that allows the user to enter some text.
 *
 * @param props - The properties for the text-input component.
 * @returns A text-input element.
 */
export default function TextInput(props: Props) {
  const [value, setValue] = React.useState(props.initialValue);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setValue(props.initialValue), [props.initialValue]);

  return (
    <>
      <SettingsRow label={props.label} info={props.info} grow>
        {!props.multiline && (
          <input
            className={cx({
              input: true,
              flat: props.variant === 'flat',
            })}
            type="text"
            spellCheck="false"
            disabled={props.disabled}
            value={value}
            placeholder={props.placeholder}
            onBlur={() => props.onChange?.(value)}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                (event.target as HTMLInputElement).blur();
              }
            }}
          />
        )}
      </SettingsRow>
      {props.multiline && (
        <textarea
          className={cx({
            input: true,
            flat: props.variant === 'flat',
          })}
          spellCheck="false"
          disabled={props.disabled}
          value={value}
          placeholder={props.placeholder}
          onBlur={() => props.onChange?.(value)}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
    </>
  );
}

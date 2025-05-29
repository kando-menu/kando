//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { TbPlus, TbMinus } from 'react-icons/tb';

import { Button, SettingsRow } from '.';

import * as classes from './Spinbutton.module.scss';

interface IProps {
  /**
   * Function to call when the value changes. This will be called when the user uses one
   * of the plus or minus buttons, when the user presses Enter after typing a value, or
   * when the user clicks outside of the button.
   */
  onChange?: (value: number) => void;

  /** Initial value of the spinbutton. */
  initialValue: number;

  /** Optional label text to display next to the spinbutton. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the spinbutton is disabled. Defaults to false. */
  disabled?: boolean;

  /** Optional minimum width of the spinbutton. Useful to align multiple spinbuttons. */
  width?: number;

  /** Optional minimum value of the spinbutton. */
  min?: number;

  /** Optional maximum value of the spinbutton. */
  max?: number;

  /** Step size for the spinbutton. Defaults to 1. */
  step?: number;
}

/**
 * This component is a spinbutton that allows the user to increase or decrease a number by
 * a certain step size. The user can also enter a number manually.
 *
 * @param props - The properties for the spinbutton component.
 * @returns A spinbutton element.
 */
export default function Spinbutton(props: IProps) {
  // We store the value of the spin button internally as a string. This way we can properly
  // handle empty strings when the user deletes the value.
  const [value, setValue] = React.useState(props.initialValue.toString());

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setValue(props.initialValue.toString()), [props.initialValue]);

  // Commit the value change, ensuring it stays within the min and max bounds. This function
  // is called when the user presses Enter after typing a value, when the user clicks outside
  // of the button, or when the user uses one of the plus or minus buttons.
  const emitChange = (change: number) => {
    let newValue = props.min || 0;

    if (value !== '') {
      newValue = parseFloat((parseFloat(value) + change).toFixed(10));
    }

    if (props.min !== undefined && newValue < props.min) {
      newValue = props.min;
    }

    if (props.max !== undefined && newValue > props.max) {
      newValue = props.max;
    }

    // There is the case where the user types a value that is smaller or larger than the
    // min or max value. The value will be clamped to the min or max and if it is then equal
    // to the initial value, emitting the change would not trigger a re-render. In this case
    // we have to manually set the value to the new value.
    if (newValue === props.initialValue) {
      setValue(newValue.toString());
    } else {
      props.onChange(newValue);
    }
  };

  return (
    <SettingsRow label={props.label} info={props.info}>
      <div className={classes.spinbutton}>
        {/* Button to decrease the value. */}
        <Button
          onClick={() => emitChange(-(props.step || 1))}
          icon={<TbMinus />}
          size="small"
          grouped
          disabled={
            props.disabled ||
            parseFloat(value) <= (props.min === undefined ? -Infinity : props.min)
          }
        />
        <input
          type="number"
          disabled={props.disabled}
          value={value}
          min={props.min}
          style={{ width: props.width }}
          title="" // Remove the tooltip that is shown when a value is not a multiple of the step.
          max={props.max}
          step={props.step}
          onBlur={() => emitChange(0)}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              (event.target as HTMLInputElement).blur();
            }
          }}
        />
        {/* Button to increase the value. */}
        <Button
          onClick={() => emitChange(props.step || 1)}
          icon={<TbPlus />}
          size="small"
          grouped
          disabled={
            props.disabled ||
            parseFloat(value) >= (props.max === undefined ? Infinity : props.max)
          }
        />
      </div>
    </SettingsRow>
  );
}

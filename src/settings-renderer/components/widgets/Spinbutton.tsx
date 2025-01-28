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

import InfoItem from './InfoItem';
import Button from './Button';

import * as classes from './Spinbutton.module.scss';

interface IProps {
  onChange?: (value: number) => void;
  initialValue?: number;
  label?: string;
  info?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * This component is a spinbutton that allows the user to increase or decrease a number by
 * a certain step size. The user can also enter a number manually.
 */
export default (props: IProps) => {
  const getInitialValueString = () => {
    return props.initialValue?.toString() || '0';
  };

  const [value, setValue] = React.useState(getInitialValueString());

  React.useEffect(() => setValue(getInitialValueString()), [props.initialValue]);

  const commit = (change: number) => {
    let newValue = props.min || 0;

    if (value !== '') {
      newValue = parseFloat(value) + change;
    }

    if (props.min !== undefined && newValue < props.min) {
      newValue = props.min;
    }

    if (props.max !== undefined && newValue > props.max) {
      newValue = props.max;
    }

    props.onChange(newValue);
  };

  return (
    <div className={classes.row + ' ' + (props.disabled ? classes.disabled : '')}>
      <div>
        {props.label}
        {props.info && <InfoItem info={props.info} />}
      </div>
      <div className={classes.spinbutton}>
        <Button
          onClick={() => commit(-(props.step || 1))}
          icon={<TbMinus />}
          size="small"
          grouped
          disabled={parseFloat(value) <= (props.min || 0)}
        />
        <input
          type="number"
          disabled={props.disabled}
          value={value}
          min={props.min}
          title="" // Remove the tooltip that is shown when a value is not a multiple of the step
          max={props.max}
          step={props.step}
          onBlur={() => commit(0)}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              (event.target as HTMLInputElement).blur();
            }
          }}
        />
        <Button
          onClick={() => commit(props.step || 1)}
          icon={<TbPlus />}
          size="small"
          grouped
          disabled={parseFloat(value) >= (props.max || Infinity)}
        />
      </div>
    </div>
  );
};

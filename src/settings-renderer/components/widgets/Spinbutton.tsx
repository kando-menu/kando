//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import InfoItem from './InfoItem';

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

export default (props: IProps) => {
  const className = classes.spinbutton + ' ' + (props.disabled ? classes.disabled : '');

  return (
    <label className={className}>
      <div>
        {props.label}
        {props.info && <InfoItem info={props.info} />}
      </div>
      <input
        type="number"
        disabled={props.disabled}
        value={props.initialValue || 0}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={(event) => props.onChange && props.onChange(Number(event.target.value))}
      />
    </label>
  );
};

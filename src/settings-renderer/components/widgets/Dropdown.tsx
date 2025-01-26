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

import * as classes from './Dropdown.module.scss';

interface IProps {
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  initialValue?: string;
  label?: string;
  info?: string;
  disabled?: boolean;
}

export default (props: IProps) => {
  const className = classes.dropdown + ' ' + (props.disabled ? classes.disabled : '');

  return (
    <label className={className}>
      <div>
        {props.label}
        {props.info && <InfoItem info={props.info} />}
      </div>
      <select
        disabled={props.disabled}
        value={props.initialValue || ''}
        onChange={(event) => props.onChange && props.onChange(event.target.value)}>
        {props.options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            selected={option.value === props.initialValue}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

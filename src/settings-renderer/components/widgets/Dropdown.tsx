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

interface IProps<T extends string> {
  onChange?: (value: T) => void;
  options: { value: T; label: string }[];
  initialValue?: T;
  label?: string;
  info?: string;
  disabled?: boolean;
}

export default <T extends string>(props: IProps<T>) => {
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

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

import * as classes from './Checkbox.module.scss';

interface IProps {
  onToggle?: (value: boolean) => void;
  initialValue?: boolean;
  label?: string;
  info?: string;
  disabled?: boolean;
}

export default (props: IProps) => {
  const className = classes.row + ' ' + (props.disabled ? classes.disabled : '');

  return (
    <label className={className}>
      <div>
        {props.label}
        {props.info && <InfoItem info={props.info} />}
      </div>
      <input
        type="checkbox"
        disabled={props.disabled}
        checked={props.initialValue || false}
        onChange={(event) => props.onToggle && props.onToggle(event.target.checked)}
      />
    </label>
  );
};

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { RiInformation2Fill } from 'react-icons/ri';

import * as classes from './Checkbox.module.scss';

interface IProps {
  onToggle?: (value: boolean) => void;
  initialValue?: boolean;
  label?: string;
  info?: string;
  disabled?: boolean;
}

export default (props: IProps) => {
  const className = classes.checkbox + ' ' + (props.disabled ? classes.disabled : '');

  return (
    <label className={className}>
      <div>
        {props.label}

        {props.info && (
          <span
            className={classes.info}
            data-tooltip-id="main-tooltip"
            data-tooltip-content={props.info}>
            <RiInformation2Fill />
          </span>
        )}
      </div>
      <input type="checkbox" disabled={props.disabled} />
    </label>
  );
};

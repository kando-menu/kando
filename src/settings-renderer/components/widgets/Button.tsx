//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Button.module.scss';

interface IProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  variant?: 'secondary' | 'flat' | 'primary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  block?: boolean;
  grow?: boolean;
  grouped?: boolean;
}

export default (props: IProps) => {
  const className =
    classes.button +
    ' ' +
    classes[props.variant || 'secondary'] +
    ' ' +
    classes[props.size || 'medium'] +
    ' ' +
    (props.disabled ? classes.disabled : '') +
    ' ' +
    (props.grouped ? classes.grouped : '') +
    ' ' +
    (props.block ? classes.block : '') +
    ' ' +
    (props.grow ? classes.grow : '');

  return (
    <button
      onClick={props.onClick}
      className={className}
      disabled={props.disabled}
      data-tooltip-id="main-tooltip"
      data-tooltip-content={props.tooltip}>
      {props.icon}
      {props.label}
    </button>
  );
};

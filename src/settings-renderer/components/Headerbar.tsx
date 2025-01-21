//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React, { ReactNode } from 'react';

import * as classes from './Headerbar.module.scss';

interface IProps {
  left?: string | ReactNode;
  center?: string | ReactNode;
  right?: string | ReactNode;
  paddingLeft?: number;
  paddingRight?: number;
  transparent?: boolean;
}

export default (props: IProps) => {
  return (
    <div className={classes.headerbar + (props.transparent ? ' ' + classes.transparent : '')}>
      <div
        className={typeof props.left === 'string' ? '' : classes.noDrag}
        style={{ paddingLeft: props.paddingLeft || 0 }}>
        {props.left}
      </div>
      <div className={typeof props.center === 'string' ? '' : classes.noDrag}>
        {props.center}
      </div>
      <div
        className={typeof props.right === 'string' ? '' : classes.noDrag}
        style={{ paddingRight: props.paddingRight || 0 }}>
        {props.right}
      </div>
    </div>
  );
};

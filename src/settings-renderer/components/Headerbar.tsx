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
  right?: string | ReactNode;
}

export default (props: IProps) => {
  return (
    <div className={classes.headerbar}>
      <div className={typeof props.left === 'string' ? '' : classes.noDrag}>
        {props.left}
      </div>
      <div className={typeof props.right === 'string' ? '' : classes.noDrag}>
        {props.right}
      </div>
    </div>
  );
};

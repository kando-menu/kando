//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Scrollbox.module.scss';

interface IProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export default (props: IProps) => {
  return (
    <div className={classes.scrollbox} style={{ maxHeight: props.maxHeight }}>
      <div className={classes.content}>{props.children}</div>
    </div>
  );
};

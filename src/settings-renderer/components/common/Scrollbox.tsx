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
  maxHeight?: string | number;
  width?: string | number;
  hideScrollbar?: boolean;
}

export default (props: IProps) => {
  return (
    <div
      className={
        classes.scrollbox + (props.hideScrollbar ? ' ' + classes.hideScrollbar : '')
      }
      style={{ maxHeight: props.maxHeight, height: '100%', width: props.width }}>
      <div className={classes.content}>{props.children}</div>
    </div>
  );
};

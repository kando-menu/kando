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

type Props = {
  children: React.ReactNode;
  maxHeight?: string | number;
  width?: string | number;
  hideScrollbar?: boolean;
  paddingLeft?: string | number;
  paddingRight?: string | number;
};

/**
 * Wraps its children in a scrollable box. The scrollbox has a maximum height and a fixed
 * width. If the content exceeds the maximum height, a scrollbar will appear.
 *
 * @param props - The properties for the scrollbox component.
 * @returns A scrollbox element.
 */
export default function Scrollbox(props: Props) {
  return (
    <div
      className={
        classes.scrollbox + (props.hideScrollbar ? ' ' + classes.hideScrollbar : '')
      }
      style={{ maxHeight: props.maxHeight, height: '100%', width: props.width }}>
      <div
        className={classes.content}
        style={{ paddingLeft: props.paddingLeft, paddingRight: props.paddingRight }}>
        {props.children}
      </div>
    </div>
  );
}

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

type Props = {
  /** Content to display on the left side of the header bar. */
  left?: string | ReactNode;

  /** Content to display in the center of the header bar. */
  center?: string | ReactNode;

  /** Content to display on the right side of the header bar. */
  right?: string | ReactNode;

  /** Padding to apply to the left side of the header bar. Defaults to 0. */
  paddingLeft?: number;

  /** Padding to apply to the right side of the header bar. Defaults to 0. */
  paddingRight?: number;
};

/**
 * A customizable header bar component. This is used both in modal dialogs and in the main
 * application window.
 *
 * @param props - The properties for the header bar component.
 * @returns A header bar element.
 */
export default function Headerbar(props: Props) {
  return (
    <div className={classes.headerbar}>
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
}

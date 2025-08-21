//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { TbInfoSquareRoundedFilled } from 'react-icons/tb';

import * as classes from './InfoItem.module.scss';

type Props = {
  /** Text to display in the tooltip. */
  info: string;
};

/**
 * A component that displays an information icon with a tooltip.
 *
 * @param props - The properties for the info item component.
 * @returns An info item element.
 */
export default function InfoItem(props: Props) {
  return (
    <span
      className={classes.info}
      data-tooltip-id="main-tooltip"
      data-tooltip-content={props.info}>
      <TbInfoSquareRoundedFilled />
    </span>
  );
}

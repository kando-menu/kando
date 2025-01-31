//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { RgbaStringColorPicker } from 'react-colorful';

import * as classes from './ColorButton.module.scss';

interface IProps {
  /** Function to call when the color is changed. */
  onChange?: (color: string) => void;

  /** Name of the color. Will be shown in the popover. */
  name?: string;

  /** Initial color. */
  color: string;
}

/**
 * A customizable color button component.
 *
 * @param props - The properties for the color button component.
 * @returns A color button element.
 */
export default (props: IProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [color, setColor] = React.useState(props.color);

  React.useEffect(() => {
    setColor(props.color);
  }, [props.color]);

  return (
    <div
      className={classes.colorButton}
      data-tooltip-id="main-tooltip"
      data-tooltip-content={props.name}
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
      <div className={classes.color} style={{ backgroundColor: color }} />
    </div>
  );
};

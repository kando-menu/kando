//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Tag.module.scss';

interface IProps {
  /** The name of the tag. */
  name: string;

  /** Function to call when the tag is clicked. */
  onClick?: () => void;

  /** An optional icon to show before the tag name. It will only be shown on hover. */
  icon?: React.ReactNode;
}

/**
 * A simple tag which can be clicked (usually to remove it).
 *
 * @param props - The properties for the tag component.
 * @returns A tag element.
 */
export default function Tag(props: IProps) {
  return (
    <button onClick={props.onClick} className={classes.tag}>
      {props.icon}
      {props.name}
    </button>
  );
}

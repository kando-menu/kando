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

type Props = {
  /** The name of the tag. */
  readonly name: string;

  /** Function to call when the tag is clicked. */
  readonly onClick?: () => void;

  /** An optional icon to show before the tag name. It will only be shown on hover. */
  readonly icon?: React.ReactNode;
};

/**
 * A simple tag which can be clicked (usually to remove it).
 *
 * @param props - The properties for the tag component.
 * @returns A tag element.
 */
export default function Tag(props: Props) {
  return (
    <button className={classes.tag} type="button" onClick={props.onClick}>
      {props.icon}
      {props.name}
    </button>
  );
}

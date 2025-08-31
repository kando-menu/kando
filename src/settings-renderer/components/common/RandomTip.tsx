//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Note from './Note';

type Props = {
  /** One of these will be displayed. */
  readonly tips: string[];

  /** Margin to apply to the top of the note. Defaults to 0. */
  readonly marginTop?: number | string;

  /** Margin to apply to the bottom of the note. Defaults to 0. */
  readonly marginBottom?: number | string;
};

/**
 * Shows a random tip of the day. The tip is chosen from the given list of tips.
 *
 * @param props - The properties for the tip component.
 * @returns A note element.
 */
export default function RandomTip(props: Props) {
  return (
    <Note
      isCentered
      useMarkdown
      marginBottom={props.marginBottom}
      marginLeft="10%"
      marginRight="10%"
      marginTop={props.marginTop}>
      {props.tips[Math.floor(Math.random() * props.tips.length)]}
    </Note>
  );
}

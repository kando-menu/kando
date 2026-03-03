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

function getRandomTipIndex(tipCount: number) {
  if (tipCount <= 0) {
    return 0;
  }

  return Math.floor(Math.random() * tipCount);
}

/**
 * Shows a random tip of the day. The tip is chosen from the given list of tips. The tip
 * is randomly selected on component mount and re-selected whenever the list of tips
 * changes.
 *
 * @param props - The properties for the tip component.
 * @returns A note element.
 */
export default function RandomTip(props: Props) {
  const selectedTipIndex = getRandomTipIndex(props.tips.length);

  return (
    <Note
      isCentered
      useMarkdown
      marginBottom={props.marginBottom}
      marginLeft="10%"
      marginRight="10%"
      marginTop={props.marginTop}>
      {props.tips[selectedTipIndex] ?? ''}
    </Note>
  );
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import {
  formatShortcutForDisplay,
  isShortcutModifier,
  splitModifierSide,
} from '../../../common/shortcut';

import * as classes from './ShortcutLabel.module.scss';

type Props = {
  /** The shortcut to display. */
  readonly shortcut: string;

  /** Optional formatter for an individual shortcut part. */
  readonly formatPart?: (part: string) => string;

  /** Optional modifier predicate for non-accelerator shortcut formats. */
  readonly isModifier?: (part: string) => boolean;

  /** Whether separators between shortcut parts should be omitted. */
  readonly isCompact?: boolean;
};

/** Displays a shortcut and renders left/right modifier selectors as small corner marks. */
export default function ShortcutLabel(props: Props) {
  const formatPart =
    props.formatPart || ((part: string) => formatShortcutForDisplay(part, cIsMac));
  const isModifier = props.isModifier || isShortcutModifier;
  const isCompact = props.isCompact ?? cIsMac;
  const occurrences = new Map<string, number>();
  const parts = props.shortcut.split('+').map((part) => {
    const occurrence = occurrences.get(part) || 0;
    occurrences.set(part, occurrence + 1);
    return { part, key: `${part}-${occurrence}` };
  });

  return (
    <span className={classes.shortcutLabel}>
      {parts.map(({ part, key }, index) => {
        const { base, side } = isModifier(part)
          ? splitModifierSide(part)
          : { base: part, side: 'any' as const };
        const sideLabel = side === 'left' ? 'L' : side === 'right' ? 'R' : null;

        return (
          <React.Fragment key={key}>
            {index > 0 && !isCompact ? '+' : null}
            <span className={classes.shortcutPart}>
              {sideLabel ? <span className={classes.sideMarker}>{sideLabel}</span> : null}
              <span>{formatPart(base)}</span>
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

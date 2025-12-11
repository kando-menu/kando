//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';

import * as classes from './Button.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** Function to call when the button is clicked. */
  readonly onClick?: () => void;

  /** Optional icon to display inside the button. */
  readonly icon?: React.ReactNode;

  /** Optional label text to display inside the button. */
  readonly label?: string;

  /** Optional tooltip text to display when hovering over the button. */
  readonly tooltip?: string;

  /**
   * Variant style of the button. Primary uses a more prominent color, flat has only a
   * background when hovered, tool has no background at all. Defaults to 'secondary'.
   * Floating has a dark background and more rounded corners.
   */
  readonly variant?: 'primary' | 'secondary' | 'flat' | 'tool' | 'floating';

  /** Size of the button. Defaults to 'medium'. */
  readonly size?: 'small' | 'medium' | 'large';

  /** Alignment of icon and text. Defaults to 'center'. */
  readonly align?: 'left' | 'right' | 'center';

  /** Whether the button is disabled. Defaults to false. */
  readonly isDisabled?: boolean;

  /** Whether the button should take the full width of its container. Defaults to false. */
  readonly isBlock?: boolean;

  /**
   * Whether the button should grow to fill available space. Uses flex-grow and defaults
   * to false.
   */
  readonly isGrowing?: boolean;

  /**
   * Whether the button is part of a group of buttons. This will make the corners of only
   * the first and last button in the group round. Defaults to false.
   */
  readonly isGrouped?: boolean;

  /** Whether to display the button in a pressed state. */
  readonly isPressed?: boolean;

  /** Whether to display a tiny indicator dot on the button. */
  readonly hasIndicator?: boolean;

  /** Whether to add a counter badge to the button. */
  readonly badgeCount?: number;

  readonly paddingTop?: number;
  readonly paddingBottom?: number;
  readonly paddingLeft?: number;
  readonly paddingRight?: number;
};

/**
 * A customizable button component.
 *
 * @param props - The properties for the button component.
 * @returns A button element.
 */
export default function Button(props: Props) {
  const className = cx({
    button: true,
    [props.variant || 'secondary']: true,
    [props.size || 'medium']: true,
    [props.align || 'center']: true,
    disabled: props.isDisabled,
    grouped: props.isGrouped,
    block: props.isBlock,
    grow: props.isGrowing,
    pressed: props.isPressed,
  });

  return (
    <button
      className={className}
      data-tooltip-content={props.tooltip}
      data-tooltip-id="main-tooltip"
      disabled={props.isDisabled}
      style={{
        paddingTop: props.paddingTop,
        paddingBottom: props.paddingBottom,
        paddingLeft: props.paddingLeft,
        paddingRight: props.paddingRight,
      }}
      type="button"
      onClick={props.onClick}>
      {props.icon}
      {props.hasIndicator ? <span className={classes.indicator} /> : null}
      {props.label ? <span className={classes.text}>{props.label}</span> : null}
      {props.badgeCount !== undefined ? (
        <span className={classes.badge}>{props.badgeCount}</span>
      ) : null}
    </button>
  );
}

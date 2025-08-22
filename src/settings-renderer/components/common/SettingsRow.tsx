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

import InfoItem from './InfoItem';

import * as classes from './SettingsRow.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** The widget on the right side. */
  children?: React.ReactNode;

  /** Optional label text to display on the left hand side. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /**
   * If set to true, the settings row will be wrapped inside a label element so that
   * clicking the label will focus the widget. Defaults to false.
   */
  labelClickable?: boolean;

  /** If set to true, the widget will grow if there is space available. Defaults to false. */
  grow?: boolean;

  /** The maximum width the widget can grow to. */
  maxWidth?: number;

  /** Whether the widget is disabled. Defaults to false. */
  disabled?: boolean;
};

/**
 * This component is used quite often in the settings dialog. It shows a text label on the
 * left side, an optional info icon, and some widget on the right side.
 *
 * @param props - The properties for the settings-row component.
 * @returns A settings-row element.
 */
export default function SettingsRow(props: Props) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const Element = props.labelClickable ? 'label' : 'div';

  return (
    <Element
      className={cx({
        row: true,
        clickable: props.labelClickable,
        disabled: props.disabled,
      })}>
      {(props.label || props.info) && (
        <div className={classes.labelContainer}>
          <span className={classes.label}>{props.label}</span>&nbsp;
          {props.info && <InfoItem info={props.info} />}
        </div>
      )}
      <div
        className={cx({
          widget: true,
          grow: props.grow,
        })}
        style={{
          maxWidth: props.maxWidth ? `${props.maxWidth}px` : 'undefined',
        }}>
        {props.children}
      </div>
    </Element>
  );
}

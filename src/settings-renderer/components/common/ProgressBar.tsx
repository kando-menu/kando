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

import * as classes from './ProgressBar.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** How the progress bar should be styled. Default is 'normal'. */
  readonly barStyle?: 'big' | 'normal';

  /** The current value of the progress bar. From 0 to 100. */
  readonly value: number;
};

/**
 * Shows a progress bar indicating some progress.
 *
 * @param props - The properties for the progress bar component.
 * @returns A progress bar element.
 */
export default function ProgressBar(props: Props) {
  return (
    <div className={cx({ progressBar: true, [props.barStyle]: true })}>
      <span className={cx({ bar: true })}>
        <span
          className={cx({ progress: true })}
          style={{ width: `${Math.min(Math.max(props.value, 0), 100)}%` }}
        />
      </span>
    </div>
  );
}

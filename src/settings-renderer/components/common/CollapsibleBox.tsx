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
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TbChevronDown } from 'react-icons/tb';

import * as classes from './CollapsibleBox.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** Title shown in the header on the left side. */
  readonly title: string;

  /** Optional icon shown left to the title. */
  readonly icon?: React.ReactNode;

  /** The content shown in the collapsible area. */
  readonly children?: React.ReactNode;

  /** Whether the content should be expanded initially. Defaults to true. */
  readonly isInitiallyExpanded?: boolean;

  /** Whether toggling should be disabled. Defaults to false. */
  readonly isDisabled?: boolean;

  /** Optional callback called when the expanded state changes. */
  readonly onToggle?: (isExpanded: boolean) => void;
};

/**
 * Shows a titled box with a collapsible content area.
 *
 * @param props - The properties for the collapsible-box component.
 * @returns A collapsible box element.
 */
export default function CollapsibleBox(props: Props) {
  const [isExpanded, setIsExpanded] = React.useState(props.isInitiallyExpanded ?? true);
  const [contentRef] = useAutoAnimate({ duration: 250 });

  const toggle = () => {
    if (props.isDisabled) {
      return;
    }

    const newState = !isExpanded;
    setIsExpanded(newState);
    props.onToggle?.(newState);
  };

  return (
    <div
      className={cx({
        box: true,
        disabled: props.isDisabled,
      })}>
      <div className={classes.header} onClick={toggle}>
        <div className={classes.info}>
          {props.icon ? <span className={classes.icon}>{props.icon}</span> : null}
          <span className={classes.title}>{props.title}</span>
        </div>
        <TbChevronDown
          className={cx({
            caret: true,
            expanded: isExpanded,
          })}
        />
      </div>
      <div ref={contentRef} className={classes.content}>
        {isExpanded ? props.children : null}
      </div>
    </div>
  );
}

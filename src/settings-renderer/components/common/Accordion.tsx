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

import * as classes from './Accordion.module.scss';
const cx = classNames.bind(classes);

export type AccordionItemProps = {
  /** Title shown in the header on the left side. */
  readonly title: string;

  /** The content shown in the collapsible area. */
  readonly children?: React.ReactNode;

  /** Optional callback called when the expanded state changes. */
  readonly onToggle?: (isExpanded: boolean) => void;
};

type AccordionItemElement = React.ReactElement<AccordionItemProps>;

type Props = {
  /** Accordion items whose expansion should be mutually exclusive. */
  readonly children: AccordionItemElement | AccordionItemElement[];

  /** Index of the currently expanded item. */
  readonly expandedIndex: number | null;

  /** Callback called when the expanded item changes. */
  readonly onExpandedIndexChange: (expandedIndex: number | null) => void;
};

type AccordionPanelProps = {
  readonly title: string;
  readonly children?: React.ReactNode;
  readonly isExpanded: boolean;
  readonly onToggle: (isExpanded: boolean) => void;
};

export function AccordionItem(props: AccordionItemProps) {
  return props.children;
}

function AccordionPanel(props: AccordionPanelProps) {
  const [contentRef] = useAutoAnimate({ duration: 250 });

  const toggle = () => {
    props.onToggle?.(!props.isExpanded);
  };

  return (
    <div>
      <div className={classes.header} onClick={toggle}>
        <span className={classes.title}>{props.title}</span>
        <TbChevronDown
          className={cx({
            caret: true,
            expanded: props.isExpanded,
          })}
        />
      </div>
      <div ref={contentRef} className={classes.content}>
        {props.isExpanded ? props.children : null}
      </div>
    </div>
  );
}

/** Shows multiple collapsible boxes while allowing at most one open panel at a time. */
export default function Accordion(props: Props) {
  const children = React.Children.toArray(props.children).filter(
    React.isValidElement
  ) as AccordionItemElement[];

  return children.map((child, index) => (
    <AccordionPanel
      key={child.key ?? `accordion-item-${String(index)}`}
      isExpanded={props.expandedIndex === index}
      title={child.props.title}
      onToggle={(isExpanded: boolean) => {
        props.onExpandedIndexChange(isExpanded ? index : null);
        child.props.onToggle?.(isExpanded);
      }}>
      {child.props.children}
    </AccordionPanel>
  ));
}

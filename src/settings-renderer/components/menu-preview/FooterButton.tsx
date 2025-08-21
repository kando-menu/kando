//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import classNames from 'classnames/bind';

import * as classes from './FooterButton.module.scss';
const cx = classNames.bind(classes);

import { ThemedIcon, Popover, Note } from '../common';

type Props = {
  /** A unique ID for the menu-item type. */
  id: string;

  /** The name of the menu-item type. */
  name: string;

  /** A short description of the menu-item type. */
  description: string;

  /** The icon to display for the menu-item type. */
  icon: string;

  /** The theme of the icon to display for the menu-item type. */
  iconTheme: string;
};

/**
 * This component encapsules a single menu-item type which can be dragged to the menu
 * preview.
 *
 * @param props - The properties for the footer button component.
 * @returns A footer button element.
 */
export default function FooterButton(props: Props) {
  const [dragging, setDragging] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  return (
    <Popover
      visible={isPopoverOpen}
      onClose={() => {
        setIsPopoverOpen(false);
      }}
      position="top"
      content={
        <>
          <div className={classes.popoverContent}>
            <p>{props.description}</p>
            <Note>{i18next.t('settings.add-menu-item-hint')}</Note>
          </div>
        </>
      }>
      <div
        className={cx({
          menuItem: true,
          dragging,
        })}
        data-tooltip-id="main-tooltip"
        data-tooltip-html={isPopoverOpen || dragging ? undefined : props.name}
        draggable
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        onDragStart={(event) => {
          event.dataTransfer.setData('kando/item-type', props.id);
          setDragging(true);
          setIsPopoverOpen(false);
        }}
        onDragEnd={() => setDragging(false)}>
        <ThemedIcon size={'100%'} name={props.icon} theme={props.iconTheme} />
      </div>
    </Popover>
  );
}

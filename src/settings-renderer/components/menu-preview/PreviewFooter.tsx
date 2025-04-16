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

import * as classes from './PreviewFooter.module.scss';
const cx = classNames.bind(classes);

import { ItemTypeRegistry } from '../../../common/item-type-registry';

import ThemedIcon from '../common/ThemedIcon';

/**
 * This component encapsules the list of item types which can be dragged to the menu
 * preview.
 */
export default () => {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const allItemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());

  return (
    <div className={classes.itemArea}>
      <div className={classes.header}>
        <div className={classes.leftLine}></div>
        <div className={classes.title}>Add Menu Items</div>
        <div className={classes.rightLine}></div>
      </div>
      <div className={classes.shadow}></div>
      <div className={classes.newItems}>
        {allItemTypes.map(([name, type], index) => (
          <div
            key={name}
            className={cx({
              newItem: true,
              dragging: dragIndex === index,
            })}
            data-tooltip-id="click-to-show-tooltip"
            data-tooltip-html={
              '<strong>' + type.defaultName + '</strong><br>' + type.genericDescription
            }
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('kando/item-type', name);
              setDragIndex(index);
            }}
            onDragEnd={() => setDragIndex(null)}>
            <ThemedIcon
              size={'100%'}
              name={type.defaultIcon}
              theme={type.defaultIconTheme}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

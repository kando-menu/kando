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
import { TbChevronLeft } from 'react-icons/tb';

import * as classes from './MenuPreview.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../state';
import * as math from '../../common/math';

import ThemedIcon from './widgets/ThemedIcon';
import { ItemTypeRegistry } from '../../common/item-type-registry';

/**
 * This component encapsules the center area of the settings dialog. It contains the
 * preview of the currently selected menu where the user can reorder and select menu
 * items.
 */
export default () => {
  const dnd = useAppState((state) => state.dnd);
  const startDrag = useAppState((state) => state.startDrag);
  const endDrag = useAppState((state) => state.endDrag);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const selectChildPath = useAppState((state) => state.selectChildPath);

  const menus = useMenuSettings((state) => state.menus);
  const menu = menus[selectedMenu];

  if (!menu) {
    return null;
  }

  // First, we traverses the children of the current menu according to the selection path
  // and store the final (sub)menu. This is the menu which should be shown in the center.
  // This could either be the last item of the path (if a submenu is selected) or the
  // last-but-one item (if a menu item is selected).
  // If the selection path is empty, the root menu is returned.
  // We also store the index of the selected child if it is not a submenu. If a submenu
  // or the root menu is selected, the index is -1.
  let centerItem = menu.root;
  let selectedChild = -1;
  let isRoot = true;
  let parentAngle = 0;
  let childAngles = math.computeItemAngles(centerItem.children);

  for (let i = 0; i < selectedChildPath.length; i++) {
    const childIndex = selectedChildPath[i];
    const child = centerItem.children[childIndex];
    const type = ItemTypeRegistry.getInstance().getType(child.type);
    if (type?.hasChildren) {
      isRoot = false;
      parentAngle = (childAngles[childIndex] + 180) % 360;
      centerItem = child;
      childAngles = math.computeItemAngles(centerItem.children, parentAngle);
    } else {
      selectedChild = childIndex;
      break;
    }
  }

  // Adds the given index to the selected menu path if the center is currently selected.
  // Else a child was selected and the hence the last index of the path is replaced.
  const selectChild = (which: number) => {
    if (selectedChild === -1) {
      selectChildPath([...selectedChildPath, which]);
    } else {
      selectChildPath([...selectedChildPath.slice(0, -1), which]);
    }
  };

  // Selects the center item. This is done by removing the last element from the selection
  // path. If the center is already selected, nothing is done.
  const selectCenter = () => {
    if (selectedChild !== -1) {
      selectChildPath(selectedChildPath.slice(0, -1));
    }
  };

  // Removes the last index from the selected menu path if it refers to a submenu. If it
  // refers to an item, the last two indices are removed so that the parent submenu is
  // selected.
  const selectParent = () => {
    if (selectedChild === -1) {
      selectChildPath(selectedChildPath.slice(0, -1));
    } else {
      selectChildPath(selectedChildPath.slice(0, -2));
    }
  };

  const childDirections = childAngles.map((angle) => math.getDirection(angle, 1));
  const parentDirection = math.getDirection(parentAngle, 1);

  return (
    <div className={classes.previewArea}>
      <div className={classes.preview}>
        {!isRoot && (
          <div
            className={classes.backLink}
            onClick={() => selectParent()}
            style={
              {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                '--dir-x': parentDirection.x,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                '--dir-y': parentDirection.y,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                '--angle': `${parentAngle - 90}deg`,
              } as React.CSSProperties
            }>
            <ThemedIcon
              size="100%"
              theme="material-symbols-rounded"
              name="chevron_right"
            />
          </div>
        )}
        <div
          className={cx({
            center: true,
            selected: selectedChild === -1,
          })}
          onClick={() => selectCenter()}>
          <ThemedIcon size={'100%'} theme={centerItem.iconTheme} name={centerItem.icon} />
        </div>
        {centerItem.children.map((child, index) => {
          return (
            <div
              key={index}
              className={cx({
                child: true,
                selected: selectedChild === index,
                dragging: dnd.draggedType === 'item' && dnd.draggedIndex === index,
              })}
              draggable
              onDragStart={() => startDrag('item', index)}
              onDragEnd={() => endDrag()}
              onClick={() => selectChild(index)}
              style={
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  '--dir-x': childDirections[index].x,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  '--dir-y': childDirections[index].y,
                } as React.CSSProperties
              }>
              <ThemedIcon size={'100%'} theme={child.iconTheme} name={child.icon} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

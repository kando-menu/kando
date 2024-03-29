//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as math from '../../math';
import * as themedIcon from '../common/themed-icon';
import { IEditorNode } from '../common/editor-node';

/**
 * This function returns the direction towards the parent of the given node. If the node
 * has no parent (e.g. it is the root menu), it returns undefined.
 *
 * @param node The node for which to compute the parent angle.
 * @returns The angle towards the parent of the given node.
 */
export function getParentAngle(node: IEditorNode) {
  if (node.computedAngle === undefined) {
    return undefined;
  }

  return (node.computedAngle + 180) % 360;
}

/**
 * This function computes the center position of the given div. It is used to compute the
 * angles of the menu items during drag'n'drop in the menu preview.
 */
export function computeCenter(div: HTMLElement) {
  const rect = div.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * This function returns the closest parent div which has the given class name. If no
 * parent div has the given class name, it returns null.
 *
 * @param div The HTML element for which to find the parent.
 * @param className The class name of the parent to find.
 * @returns The closest parent div with the given class name or null.
 */
export function getParentWithClass(div: HTMLElement, className: string) {
  let parent = div.parentElement;
  while (parent) {
    if (parent.classList.contains(className)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * This is used to compute the drop target during drag-and-drop operations in the menu
 * preview. It computes the drop index by testing all possible indices and choosing the
 * one which results in the smallest angle between the dragged item and the drop
 * position.
 *
 * It is also possible to drop the dragged item into a submenu. In this case, the drop
 * target will be the submenu and the drop index will be 0.
 *
 * Finally, if the dragged item is about to be dropped into the back-navigation link, the
 * drop target will be null and drop index will 0.
 *
 * @param centerItem The menu item into which the dragged item is about to be dropped.
 * @param dragAngle The angle of the dragged item.
 * @returns The node to drop the item into and the index where to drop it.
 */
export function computeDropTarget(
  centerItem: IEditorNode,
  dragAngle: number
): {
  dropTarget: IEditorNode;
  dropIndex: number;
} {
  // There are a few special cases when there are only a few items in the menu.
  // If there are no other children, it's easy: We simply drop at index zero.
  if (!centerItem.children || centerItem.children.length === 0) {
    return { dropTarget: centerItem, dropIndex: 0 };
  }

  // First, we iterate over all possible drop indices and compute the angle between the
  // dragged item and the drop position candidate. We choose the index which results in
  // the smallest angle.
  const parentAngle = getParentAngle(centerItem);
  let bestIndex = 0;
  let bestDiff = 180;
  let dropTarget = centerItem;

  for (let i = 0; i <= centerItem.children.length; i++) {
    const { dropAngle } = computeItemAnglesWithDropIndex(
      centerItem.children,
      i,
      parentAngle
    );

    const diff = math.getAngularDifference(dragAngle, dropAngle);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  // We check whether the back-navigation link is closer.
  if (math.getAngularDifference(dragAngle, parentAngle) < bestDiff) {
    return { dropTarget: null, dropIndex: 0 };
  }

  // Finally, we check whether a submenu is closer. There are some weird edge cases where
  // it's not possible to drop something into a submenu (e.g. when the submenu is at the
  // top of the menu). As a workaround, we add a small 5 degree region around each
  // submenu. If the dragged item is within this region, we consider the submenu as the
  // drop target.
  const itemAngles = math.computeItemAngles(centerItem.children, parentAngle);
  for (let i = 0; i < centerItem.children.length; i++) {
    const child = centerItem.children[i] as IEditorNode;
    if (child.type === 'submenu') {
      const diff = math.getAngularDifference(dragAngle, itemAngles[i]);
      if (diff < bestDiff || diff < 5) {
        dropTarget = child;
        bestDiff = diff;
        bestIndex = 0;
      }
    }
  }

  return { dropTarget, dropIndex: bestIndex };
}

/**
 * This is basically a variant of the math.computeItemAngles() function which is used
 * during drag-and-drop operations. It behaves similar to the computeItemAngles function,
 * but it allows to pass an additional drop index. The computed item angles will leave a
 * gap for the to-be-dropped item.
 *
 * @param items The Items for which the angles should be computed. They may already have
 *   an angle property. If so, this is considered a fixed angle.
 * @param dropIndex The index of the location where something is about to be dropped.
 * @param parentAngle The angle of the parent item. If given, there will be some reserved
 *   space.
 * @returns An array of angles in degrees and the angle for the to-be-dropped item.
 */
export function computeItemAnglesWithDropIndex(
  items: { angle?: number }[],
  dropIndex: number,
  parentAngle?: number
): { itemAngles: number[]; dropAngle: number } {
  // Create a copy of the items array.
  const itemsCopy = items.slice();

  // Add an artificial item at the position where something is about to be dropped.
  itemsCopy.splice(dropIndex, 0, {});

  // Now compute the angles as usual.
  const itemAngles = math.computeItemAngles(itemsCopy, parentAngle);

  // We added an artificial item to leave an angular gap for the to-be-dropped item. We
  // have to remove this again from the list of item angles as there is no real item at
  // this position. We only wanted to affect the angles for the adjacent items.
  // We will also return the angle for the to-be-dropped item (if given).
  const dropAngle = itemAngles.splice(dropIndex, 1)[0];

  return { itemAngles, dropAngle };
}

/**
 * This method creates the big center div which shows the icon of the currently selected
 * menu.
 *
 * @param node The node for which to create the center div.
 */
export function createCenterDiv(node: IEditorNode) {
  const div = document.createElement('div');
  div.classList.add('kando-menu-preview-center');
  div.appendChild(themedIcon.createDiv(node.icon, node.iconTheme));
  return div;
}

/**
 * This method creates a div visualizing a child node. It contains an icon, potentially
 * grandchildren, and a label.
 *
 * @param node The node for which to create the child div.
 */
export function createChildDiv(node: IEditorNode) {
  const div = document.createElement('div');
  div.classList.add('kando-menu-preview-child');

  // Add the icon of the child.
  div.appendChild(themedIcon.createDiv(node.icon, node.iconTheme));

  // If the child can have children, we add container for the grandchildren. The actual
  // grandchildren divs are added on demand as their number may change if items are
  // dropped into the menu.
  if (node.type === 'submenu') {
    const grandChildContainer = document.createElement('div');
    grandChildContainer.classList.add('kando-menu-preview-grandchild-container');
    div.appendChild(grandChildContainer);
  }

  // Add a label to the child div. This is used to display the name of the menu
  // item. The label shows a connector line to the child div.
  const labelDivContainer = document.createElement('div');
  labelDivContainer.classList.add('kando-menu-preview-label-container');
  div.appendChild(labelDivContainer);

  // The actual label is in a nested div. This is used to ellipsize the text if
  // it is too long.
  const labelDiv = document.createElement('div');
  labelDiv.classList.add('kando-menu-preview-label');
  labelDiv.classList.add('kando-font');
  labelDiv.classList.add('fs-3');
  labelDiv.textContent = node.name;
  labelDivContainer.appendChild(labelDiv);

  return div;
}

/**
 * This method creates a div which contains a lock icon. This is used to fix the angle of
 * the child.
 *
 * @returns A div which contains a lock icon.
 */
export function createLockDiv(
  initiallyLocked: boolean,
  onChange: (locked: boolean) => void
) {
  const div = document.createElement('div');
  div.classList.add('kando-menu-preview-lock');

  if (initiallyLocked) {
    div.classList.add('locked');
  }

  const icon = themedIcon.createDiv(
    initiallyLocked ? 'lock' : 'lock_open',
    'material-symbols-rounded'
  );
  div.appendChild(icon);

  div.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  div.addEventListener('mouseup', () => {
    const i = icon.querySelector('i');
    const wasLocked = i.textContent === 'lock';
    i.innerHTML = wasLocked ? 'lock_open' : 'lock';

    if (wasLocked) {
      div.classList.remove('locked');
    } else {
      div.classList.add('locked');
    }

    onChange(!wasLocked);
  });

  return div;
}

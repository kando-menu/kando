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

import * as classes from './PreviewFooter.module.scss';

import FooterButton from './FooterButton';

import { ActionTypeRegistry } from '../../../common';
import { useAppState, useMenuSettings } from '../../state';

/**
 * This component encapsules the list of item types which can be dragged to the menu
 * preview.
 */

export default function PreviewFooter() {
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const deleteMenuItem = useMenuSettings((state) => state.deleteMenuItem);

  const [isDeleteDropActive, setIsDeleteDropActive] = React.useState(false);
  const dragDepth = React.useRef(0);

  const workflowItemTypes = [
    ...ActionTypeRegistry.getInstance().getAllMetadata().entries(),
  ].map(([key, meta]) => ({ key, ...meta }));

  const isMenuItemDrag = (event: React.DragEvent<HTMLDivElement>) => {
    return event.dataTransfer.types.includes('kando/child-path');
  };

  const allItemTypes = [
    {
      key: 'submenu',
      name: i18next.t('menu-items.submenu.name'),
      icon: 'submenu-item.svg',
      iconTheme: 'kando',
      description: i18next.t('menu-items.submenu.description'),
    },
    ...workflowItemTypes.filter(
      (type) =>
        type.key !== 'delay' &&
        type.key !== 'close-menu' &&
        type.key !== 'close-submenu' &&
        type.key !== 'inhibit-shortcuts'
    ),
  ];

  return (
    <div
      className={classes.itemArea}
      onDragEnter={(event) => {
        if (!isMenuItemDrag(event)) {
          return;
        }

        dragDepth.current += 1;

        setIsDeleteDropActive(true);
        event.preventDefault();
      }}
      onDragOver={(event) => {
        if (!isMenuItemDrag(event)) {
          return;
        }

        event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (!isMenuItemDrag(event)) {
          return;
        }

        dragDepth.current = Math.max(0, dragDepth.current - 1);

        if (dragDepth.current === 0) {
          setIsDeleteDropActive(false);
        }

        event.preventDefault();
      }}
      onDrop={(event) => {
        const childPathData = event.dataTransfer.getData('kando/child-path');
        if (!childPathData) {
          return;
        }

        deleteMenuItem(selectedMenu, JSON.parse(childPathData));

        // This is kind of ugly: We Reset drag-state in the preview as its local drop
        // handlers will not fire when the item is deleted.
        window.dispatchEvent(new CustomEvent('kando/menu-item-drag-end'));

        dragDepth.current = 0;
        setIsDeleteDropActive(false);

        event.preventDefault();
      }}>
      <div
        className={classes.deleteDropOverlay}
        style={{ opacity: isDeleteDropActive ? 1 : 0 }}>
        {i18next.t('settings.drop-here-to-delete')}
      </div>
      <div className={classes.header}>
        <div className={classes.leftLine} />
        <div className={classes.title}>{i18next.t('settings.add-menu-items')}</div>
        <div className={classes.rightLine} />
      </div>
      <div className={classes.shadow} />
      <div className={classes.newItems}>
        {allItemTypes.map((type) => (
          <FooterButton
            key={type.key}
            description={type.description}
            icon={type.icon}
            iconTheme={type.iconTheme}
            id={type.key}
            name={type.name}
          />
        ))}
      </div>
    </div>
  );
}

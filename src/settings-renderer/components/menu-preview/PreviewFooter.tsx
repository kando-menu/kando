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

/**
 * This component encapsules the list of item types which can be dragged to the menu
 * preview.
 */

export default function PreviewFooter() {
  const workflowItemTypes = [
    ...ActionTypeRegistry.getInstance().getAllMetadata().entries(),
  ].map(([key, meta]) => ({ key, ...meta }));

  const allItemTypes = [
    {
      key: 'submenu',
      name: i18next.t('menu-items.submenu.name'),
      icon: 'submenu-item.svg',
      iconTheme: 'kando',
      description: i18next.t('menu-items.submenu.description'),
    },
    ...workflowItemTypes.filter((type) => type.key !== 'delay'),
  ];

  return (
    <div className={classes.itemArea}>
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
            id={type.name}
            name={type.name}
          />
        ))}
      </div>
    </div>
  );
}

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

import { ItemTypeRegistry } from '../../../common/item-types/item-type-registry';

import FooterButton from './FooterButton';

/**
 * This component encapsules the list of item types which can be dragged to the menu
 * preview.
 */
export default function PreviewFooter() {
  const allItemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());

  return (
    <div className={classes.itemArea}>
      <div className={classes.header}>
        <div className={classes.leftLine} />
        <div className={classes.title}>{i18next.t('settings.add-menu-items')}</div>
        <div className={classes.rightLine} />
      </div>
      <div className={classes.shadow} />
      <div className={classes.newItems}>
        {allItemTypes
          .filter(([, type]) => type.isUserSelectable)
          .map(([name, type]) => (
            <FooterButton
              key={name}
              description={type.genericDescription}
              icon={type.defaultIcon}
              iconTheme={type.defaultIconTheme}
              id={name}
              name={type.defaultName}
            />
          ))}
      </div>
    </div>
  );
}

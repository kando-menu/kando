//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import * as classes from './CollectionList.module.scss';

import { useAppSetting, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  const [menuCollections, setMenuCollections] = useAppSetting('menuCollections');

  const selectedCollection = useAppState((state) => state.selectedCollection);
  const selectCollection = useAppState((state) => state.selectCollection);

  const [animatedList] = useAutoAnimate();

  return (
    <Scrollbox hideScrollbar>
      <div className={classes.collectionsList} ref={animatedList}>
        <button
          className={
            classes.collection + ' ' + (selectedCollection == -1 ? classes.selected : '')
          }
          onClick={() => selectCollection(-1)}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="All Menus">
          <ThemedIcon name="apps" theme="material-symbols-rounded" />
        </button>
        {menuCollections.map((collection, index) => {
          const className =
            classes.collection +
            ' ' +
            (index === selectedCollection ? classes.selected : '');

          return (
            <button
              key={index}
              className={className}
              onClick={() => selectCollection(index)}
              data-tooltip-id="main-tooltip"
              data-tooltip-content={collection.name}>
              <ThemedIcon name={collection.icon} theme={collection.iconTheme} />
            </button>
          );
        })}
        <button
          className={classes.collection + ' ' + classes.transparent}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Create a new collection"
          onClick={() => {
            setMenuCollections([
              ...menuCollections,
              {
                name: 'New Collection',
                icon: 'sell',
                iconTheme: 'material-symbols-rounded',
                tags: [],
              },
            ]);
            selectCollection(menuCollections.length);
          }}>
          <ThemedIcon name="add" theme="material-symbols-rounded" />
        </button>
      </div>
    </Scrollbox>
  );
};

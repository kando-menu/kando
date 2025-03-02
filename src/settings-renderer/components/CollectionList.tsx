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

import { useAppState, useMenuSettings } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  const collections = useMenuSettings((state) => state.collections);
  const setCollections = useMenuSettings((state) => state.setCollections);

  const selectedCollection = useAppState((state) => state.selectedCollection);
  const selectCollection = useAppState((state) => state.selectCollection);

  const [animatedList] = useAutoAnimate();

  // Make sure that the selected collection is valid. This could for instance happen if
  // the currently selected collection is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  if (selectedCollection >= collections.length) {
    selectCollection(collections.length - 1);
  }

  return (
    <Scrollbox hideScrollbar>
      <div className={classes.collectionsList} ref={animatedList}>
        <button
          className={
            classes.collection + ' ' + (selectedCollection == -1 ? classes.selected : '')
          }
          onClick={() => selectCollection(-1)}
          data-tooltip-id="main-tooltip"
          data-tooltip-content={selectedCollection === -1 ? '' : 'All Menus'}>
          <ThemedIcon name="apps" theme="material-symbols-rounded" />
        </button>
        {collections.map((collection, index) => {
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
              data-tooltip-content={index === selectedCollection ? '' : collection.name}>
              <ThemedIcon name={collection.icon} theme={collection.iconTheme} />
              <div
                className={classes.deleteButton}
                data-tooltip-id="main-tooltip"
                data-tooltip-content="Delete collection"
                onClick={(event) => {
                  event.stopPropagation();
                  setCollections(collections.filter((_, i) => i !== index));
                  selectCollection(selectedCollection - 1);
                }}>
                <ThemedIcon name="delete" theme="material-symbols-rounded" />
              </div>
            </button>
          );
        })}
        <button
          className={classes.collection + ' ' + classes.transparent}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Create a new collection"
          onClick={() => {
            setCollections([
              ...collections,
              {
                name: 'New Collection',
                icon: 'sell',
                iconTheme: 'material-symbols-rounded',
                tags: [],
              },
            ]);
            selectCollection(collections.length);
          }}>
          <ThemedIcon name="add" theme="material-symbols-rounded" />
        </button>
      </div>
    </Scrollbox>
  );
};

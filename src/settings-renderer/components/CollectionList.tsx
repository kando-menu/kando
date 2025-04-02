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
import { TbTrash, TbApps } from 'react-icons/tb';

import * as classes from './CollectionList.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';

/**
 * This is a vertical list of buttons, one for each configured menu collection. They can
 * be reordered via drag and drop and deleted with a little trash icon.
 *
 * In addition, there is show-all-menus button at the top, and an add-new-collection
 * button at the bottom. They are always there, even if no collection is configured.
 */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const editMenu = useMenuSettings((state) => state.editMenu);
  const collections = useMenuSettings((state) => state.collections);
  const deleteCollection = useMenuSettings((state) => state.deleteCollection);
  const addCollection = useMenuSettings((state) => state.addCollection);
  const setCollectionDetailsVisible = useAppState(
    (state) => state.setCollectionDetailsVisible
  );

  const selectedCollection = useAppState((state) => state.selectedCollection);
  const selectCollection = useAppState((state) => state.selectCollection);

  const dnd = useAppState((state) => state.dnd);
  const startDrag = useAppState((state) => state.startDrag);
  const endDrag = useAppState((state) => state.endDrag);
  const moveCollection = useMenuSettings((state) => state.moveCollection);

  // Animate the addition and removal of collections.
  const [animatedList] = useAutoAnimate();

  // Make sure that the selected collection is valid. This could for instance happen if
  // the currently selected collection is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  React.useEffect(() => {
    if (selectedCollection >= collections.length) {
      selectCollection(collections.length - 1);
    }
  }, [collections, selectedCollection]);

  return (
    <div
      className={cx({
        collectionsList: true,
        safeAreaTop: cIsMac,
      })}>
      <Scrollbox hideScrollbar>
        <div ref={animatedList}>
          <button
            className={cx({ collection: true, selected: selectedCollection === -1 })}
            onClick={() => selectCollection(-1)}
            data-tooltip-id="main-tooltip"
            data-tooltip-content={selectedCollection === -1 ? '' : 'All Menus'}>
            <TbApps />
          </button>
          {collections.map((collection, index) => (
            <button
              key={index}
              className={cx({
                collection: true,
                selected: index === selectedCollection,
                dragging: dnd.draggedType === 'collection' && dnd.draggedIndex === index,
              })}
              onClick={() => selectCollection(index)}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                startDrag('collection', index);
              }}
              onDragEnd={endDrag}
              onDragOver={(event) => {
                if (dnd.draggedType === 'collection' || dnd.draggedType === 'menu') {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                if (dnd.draggedType === 'menu') {
                  const currentTags = menus[dnd.draggedIndex]?.tags || [];
                  const newTags = [...new Set([...currentTags, ...collection.tags])];
                  editMenu(dnd.draggedIndex, (menu) => {
                    menu.tags = newTags;
                    return menu;
                  });
                  (event.target as HTMLElement).classList.remove(classes.dragOver);
                }
              }}
              onDragEnter={(event) => {
                if (dnd.draggedType === 'collection') {
                  // If we swap with the selected collection, we need to update the
                  // selection.
                  if (index === selectedCollection) {
                    selectCollection(dnd.draggedIndex);
                  } else if (dnd.draggedIndex === selectedCollection) {
                    selectCollection(index);
                  }

                  // Also, if we swap with a collection on the other side of the selection,
                  // we need to update the selection.
                  if (
                    index < selectedCollection &&
                    selectedCollection < dnd.draggedIndex
                  ) {
                    selectCollection(selectedCollection + 1);
                  } else if (
                    index > selectedCollection &&
                    selectedCollection > dnd.draggedIndex
                  ) {
                    selectCollection(selectedCollection - 1);
                  }

                  // Swap the dragged collection with the collection we are currently
                  // hovering over.
                  moveCollection(dnd.draggedIndex, index);

                  // We are now dragging the collection which we just hovered over (it is
                  // the same as before, but the index has changed).
                  startDrag('collection', index);
                } else if (dnd.draggedType === 'menu') {
                  (event.target as HTMLElement).classList.add(classes.dragOver);
                }
              }}
              onDragLeave={(event) => {
                if (dnd.draggedType === 'menu') {
                  (event.target as HTMLElement).classList.remove(classes.dragOver);
                }
              }}
              data-tooltip-id="main-tooltip"
              data-tooltip-content={index === selectedCollection ? '' : collection.name}
              data-tooltip-place="right">
              <ThemedIcon name={collection.icon} theme={collection.iconTheme} />
              <div
                className={classes.deleteButton}
                data-tooltip-id="main-tooltip"
                data-tooltip-content="Delete collection"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteCollection(index);
                  selectCollection(selectedCollection - 1);
                }}>
                <TbTrash />
              </div>
            </button>
          ))}
          <button
            className={classes.collection + ' ' + classes.transparent}
            data-tooltip-id="main-tooltip"
            data-tooltip-content="Create a new collection. Use collections to group your menus by tags!"
            onClick={() => {
              addCollection();
              selectCollection(collections.length);
              setCollectionDetailsVisible(true);
            }}>
            <ThemedIcon name="add" theme="material-symbols-rounded" />
          </button>
        </div>
      </Scrollbox>
    </div>
  );
};

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

import { useAppState, useMenuSettings } from '../../state';
import Scrollbox from '../common/Scrollbox';
import ThemedIcon from '../common/ThemedIcon';
import { ensureUniqueKeys } from '../../utils';

/** For rendering the collections, a list of these objects is created. */
interface IRenderedCollection {
  /** A unique key for react. */
  key: string;

  /** The original index in the list of menu. */
  index: number;
}

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

  // When a collection is dragged over another collection, we store the index of that
  // collection as drop index. The dragged collection will be drawn there.
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  // Animate the addition and removal of collections.
  const [animatedList] = useAutoAnimate({ duration: 200 });

  // Make sure that the selected collection is valid. This could for instance happen if
  // the currently selected collection is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  React.useEffect(() => {
    if (selectedCollection >= collections.length) {
      selectCollection(collections.length - 1);
    }
  }, [collections, selectedCollection]);

  // Let's compile a list of all collections which are about to be rendered. If one
  // collection is dragged currently around, we will have to reorder the list.
  const renderedCollections = collections.map((collection, index) => {
    const renderedCollection: IRenderedCollection = {
      key: collection.name + collection.icon + collection.iconTheme,
      index: index,
    };

    return renderedCollection;
  });

  // Ensure that all keys are unique.
  ensureUniqueKeys(renderedCollections);

  // If a drag is in progress, we need to move the dragged collection to the position of
  // the collection we are currently hovering over. This is done by removing the dragged
  // collection from the list and inserting it at the position of the hovered collection.
  if (dnd.draggedType === 'collection' && dropIndex !== null) {
    const draggedCollection = renderedCollections.splice(dnd.draggedIndex, 1)[0];
    renderedCollections.splice(dropIndex, 0, draggedCollection);
  }

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
          {renderedCollections.map((collection) => (
            <button
              key={collection.key}
              className={cx({
                collection: true,
                selected: collection.index === selectedCollection,
                dragging:
                  dnd.draggedType === 'collection' &&
                  dnd.draggedIndex === collection.index,
              })}
              onClick={() => selectCollection(collection.index)}
              draggable
              onDragStart={() => {
                startDrag('collection', collection.index);
                setDropIndex(collection.index);
              }}
              onDragEnd={() => {
                moveCollection(dnd.draggedIndex, dropIndex);

                // If the selected menu was dragged, we need to update the selected index.
                if (dnd.draggedIndex === selectedCollection) {
                  selectCollection(dropIndex);
                }

                // If the dragged menu was dropped on the other side of the selected menu,
                // we need to update the selected index as well.
                if (
                  dnd.draggedIndex < selectedCollection &&
                  dropIndex >= selectedCollection
                ) {
                  selectCollection(selectedCollection - 1);
                } else if (
                  dnd.draggedIndex > selectedCollection &&
                  dropIndex <= selectedCollection
                ) {
                  selectCollection(selectedCollection + 1);
                }

                endDrag();
                setDropIndex(null);
              }}
              onDragOver={(event) => {
                if (dnd.draggedType === 'collection' || dnd.draggedType === 'menu') {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                if (dnd.draggedType === 'menu') {
                  const currentTags = menus[dnd.draggedIndex]?.tags || [];
                  const newTags = [
                    ...new Set([...currentTags, ...collections[collection.index].tags]),
                  ];
                  editMenu(dnd.draggedIndex, (menu) => {
                    menu.tags = newTags;
                    return menu;
                  });
                  (event.target as HTMLElement).classList.remove(classes.dragOver);
                }
              }}
              onDragEnter={(event) => {
                if (
                  dnd.draggedType === 'collection' &&
                  dnd.draggedIndex !== collection.index
                ) {
                  if (dnd.draggedIndex < collection.index) {
                    setDropIndex(
                      dropIndex >= collection.index
                        ? collection.index - 1
                        : collection.index
                    );
                  } else {
                    setDropIndex(
                      dropIndex <= collection.index
                        ? collection.index + 1
                        : collection.index
                    );
                  }
                  event.preventDefault();
                } else if (dnd.draggedType === 'menu') {
                  (event.target as HTMLElement).classList.add(classes.dragOver);
                  event.preventDefault();
                }
              }}
              onDragLeave={(event) => {
                if (dnd.draggedType === 'menu') {
                  (event.target as HTMLElement).classList.remove(classes.dragOver);
                }
              }}
              data-tooltip-id="main-tooltip"
              data-tooltip-content={
                collection.index === selectedCollection
                  ? ''
                  : collections[collection.index].name
              }
              data-tooltip-place="right">
              <ThemedIcon
                name={collections[collection.index].icon}
                theme={collections[collection.index].iconTheme}
              />
              <div
                className={classes.deleteButton}
                data-tooltip-id="main-tooltip"
                data-tooltip-content="Delete collection"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteCollection(collection.index);
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

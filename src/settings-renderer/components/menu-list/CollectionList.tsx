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
  const moveCollection = useMenuSettings((state) => state.moveCollection);

  // When a collection is dragged over another collection, we store the index of that
  // collection as drop index. The dragged collection will be drawn there.
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  // Animate the addition and removal of collections.
  const [animatedList] = useAutoAnimate({ duration: 200 });

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
  if (dragIndex !== null && dropIndex !== null) {
    const draggedCollection = renderedCollections.splice(dragIndex, 1)[0];
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
                dragging: dragIndex === collection.index,
              })}
              onClick={() => selectCollection(collection.index)}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  'kando/collection-index',
                  collection.index.toString()
                );
                setDragIndex(collection.index);
                setDropIndex(collection.index);
              }}
              onDragEnd={() => {
                moveCollection(dragIndex, dropIndex);

                // If the selected menu was dragged, we need to update the selected index.
                if (dragIndex === selectedCollection) {
                  selectCollection(dropIndex);
                }

                // If the dragged menu was dropped on the other side of the selected menu,
                // we need to update the selected index as well.
                if (dragIndex < selectedCollection && dropIndex >= selectedCollection) {
                  selectCollection(selectedCollection - 1);
                } else if (
                  dragIndex > selectedCollection &&
                  dropIndex <= selectedCollection
                ) {
                  selectCollection(selectedCollection + 1);
                }

                setDragIndex(null);
                setDropIndex(null);
              }}
              onDragOver={(event) => {
                if (
                  event.dataTransfer.types.includes('kando/menu-index') ||
                  event.dataTransfer.types.includes('kando/collection-index')
                ) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                if (event.dataTransfer.types.includes('kando/menu-index')) {
                  const menuIndex = parseInt(
                    event.dataTransfer.getData('kando/menu-index')
                  );
                  const currentTags = menus[menuIndex]?.tags || [];
                  const newTags = [
                    ...new Set([...currentTags, ...collections[collection.index].tags]),
                  ];
                  editMenu(menuIndex, (menu) => {
                    menu.tags = newTags;
                    return menu;
                  });
                  (event.target as HTMLElement).classList.remove(classes.dragOver);
                }
              }}
              onDragEnter={(event) => {
                if (
                  event.dataTransfer.types.includes('kando/collection-index') &&
                  dragIndex !== collection.index
                ) {
                  if (dragIndex < collection.index) {
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
                } else if (event.dataTransfer.types.includes('kando/menu-index')) {
                  (event.target as HTMLElement).classList.add(classes.dragOver);
                  event.preventDefault();
                }
              }}
              onDragLeave={(event) => {
                if (event.dataTransfer.types.includes('kando/menu-index')) {
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

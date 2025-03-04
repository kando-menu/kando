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
import { TbPlus, TbPencilCog, TbSearch, TbBackspaceFilled } from 'react-icons/tb';

import * as classes from './MenuList.module.scss';
const cx = classNames.bind(classes);

import { useMenuSettings, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';
import Button from './widgets/Button';
import TagInput from './widgets/TagInput';

export default () => {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);

  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const addMenu = useMenuSettings((state) => state.addMenu);
  const editCollection = useMenuSettings((state) => state.editCollection);

  const [collectionDetailsVisible, setCollectionDetailsVisible] = React.useState(false);
  const [filterTerm, setFilterTerm] = React.useState('');
  const [filterTags, setFilterTags] = React.useState([]);

  // Update the tag editor whenever the selected menu collection changes.
  React.useEffect(() => {
    if (selectedCollection !== -1) {
      setFilterTags(menuCollections[selectedCollection].tags);
    }
  }, [selectedCollection, menuCollections]);

  // Make sure that the selected menu is valid. This could for instance happen if
  // the currently selected menu is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  if (selectedMenu >= menus.length) {
    selectMenu(menus.length - 1);
  }

  const backend = useAppState((state) => state.backendInfo);

  const [animatedList, enableAnimatedList] = useAutoAnimate({ duration: 300 });
  const [animatedEditor] = useAutoAnimate({ duration: 300 });

  const dnd = useAppState((state) => state.dnd);
  const startDrag = useAppState((state) => state.startDrag);
  const endDrag = useAppState((state) => state.endDrag);
  const moveMenu = useMenuSettings((state) => state.moveMenu);

  const visibleMenus = menus
    .map((menu, index) => {
      return { menu, index };
    })
    .filter((menu) => {
      // If the user has not selected a collection, all menus are visible.
      if (selectedCollection === -1) {
        return true;
      }

      // Else, a menu must have all tags of the selected collection to be visible.
      return menuCollections[selectedCollection].tags.every((tag) =>
        menu.menu.tags?.includes(tag)
      );
    })
    .filter((menu) => {
      // If the user has not entered a filter term or if the filter bar is not visible,
      // all menus are visible.
      if (!filterTerm || !collectionDetailsVisible || selectedCollection !== -1) {
        return true;
      }

      // Else, a menu must contain the filter term to be visible.
      return menu.menu.root.name.toLowerCase().includes(filterTerm.toLowerCase());
    });

  // Accumulate a list of all tags which are currently used in our collections and menus.
  let allAvailableTags = menuCollections
    .map((collection) => collection.tags)
    .concat(menus.map((menu) => menu.tags))
    .filter((tag) => tag)
    .reduce((acc, tags) => acc.concat(tags), []);

  // Remove duplicates.
  allAvailableTags = Array.from(new Set(allAvailableTags));

  return (
    <div className={classes.menuList}>
      <div
        className={
          classes.menuListHeader +
          ' ' +
          (collectionDetailsVisible && selectedCollection !== -1
            ? classes.editCollection
            : ' ')
        }>
        <input
          type="text"
          className={classes.collectionName}
          value={menuCollections[selectedCollection]?.name || 'All Menus'}
        />
        {selectedCollection === -1 && (
          <Button
            icon={<TbSearch />}
            variant="flat"
            onClick={() => setCollectionDetailsVisible(!collectionDetailsVisible)}
          />
        )}
        {selectedCollection !== -1 && (
          <Button
            icon={<TbPencilCog />}
            variant="flat"
            onClick={() => setCollectionDetailsVisible(!collectionDetailsVisible)}
          />
        )}
      </div>
      <div ref={animatedEditor}>
        {collectionDetailsVisible && (
          <div className={classes.collectionEditor}>
            {selectedCollection === -1 && (
              <div className={classes.searchInput}>
                <input
                  type="text"
                  placeholder="Search menus..."
                  value={filterTerm}
                  onChange={(event) => setFilterTerm(event.target.value)}
                />
                <Button
                  grouped
                  icon={<TbBackspaceFilled />}
                  onClick={() => setFilterTerm('')}
                />
              </div>
            )}
            {selectedCollection !== -1 && (
              <TagInput
                tags={filterTags}
                onChange={(newTags) => {
                  editCollection(selectedCollection, { tags: newTags });
                  setFilterTags(newTags);
                }}
                suggestions={allAvailableTags}
              />
            )}
          </div>
        )}
      </div>
      <div className={classes.menuListContent}>
        <Scrollbox>
          <div ref={animatedList}>
            {visibleMenus.map(({ menu, index }) => {
              const shortcut = backend.supportsShortcuts
                ? menu.shortcut
                : menu.shortcutID;

              const className = cx({
                menu: true,
                selected: index === selectedMenu,
                dragging: dnd.draggedType === 'menu' && dnd.draggedIndex === index,
              });

              return (
                <button
                  key={index}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    startDrag('menu', index);
                    enableAnimatedList(false);
                  }}
                  onDragEnd={() => {
                    console.log('onDragEnd');
                    endDrag();
                    console.log('endDrag');
                    enableAnimatedList(true);
                    console.log('enableAnimatedList');
                  }}
                  onDrop={(event) => {
                    console.log('onDrop');
                    event.preventDefault();
                  }}
                  onDragOver={(event) => {
                    if (dnd.draggedType === 'menu') {
                      event.preventDefault();
                    }
                  }}
                  onDragEnter={() => {
                    if (dnd.draggedType === 'menu') {
                      // If we swap with the selected menu, we need to update the
                      // selection.
                      if (index === selectedMenu) {
                        selectMenu(dnd.draggedIndex);
                      } else if (dnd.draggedIndex === selectedMenu) {
                        selectMenu(index);
                      }

                      // Also, if we swap with a menu on the other side of the selection,
                      // we need to update the selection.
                      if (index < selectedMenu && selectedMenu < dnd.draggedIndex) {
                        selectMenu(selectedMenu + 1);
                      } else if (
                        index > selectedMenu &&
                        selectedMenu > dnd.draggedIndex
                      ) {
                        selectMenu(selectedMenu - 1);
                      }

                      // Swap the dragged menu with the menu we are currently hovering over.
                      moveMenu(dnd.draggedIndex, index);

                      // We are now dragging the menu which we just hovered over (it is
                      // the same as before, but the index has changed).
                      startDrag('menu', index);
                    }
                  }}
                  className={className}
                  onClick={() => selectMenu(index)}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flexShrink: 0, width: 32, marginRight: 10 }}>
                      <ThemedIcon name={menu.root.icon} theme={menu.root.iconTheme} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={classes.menuTitle}>{menu.root.name}</div>
                      <div className={classes.menuSubtitle}>
                        {shortcut || 'Not bound.'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Scrollbox>
        <div className={classes.floatingButton}>
          <Button
            icon={<TbPlus />}
            label="New Menu"
            variant="floating"
            size="medium"
            onClick={() => {
              addMenu(menuCollections[selectedCollection]?.tags);
              selectMenu(menus.length);
            }}
          />
        </div>
      </div>
    </div>
  );
};

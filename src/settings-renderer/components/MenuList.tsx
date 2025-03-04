//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import AnimateHeight from 'react-animate-height';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import { TbPlus, TbPencilCog, TbSearch, TbBackspaceFilled } from 'react-icons/tb';

import * as classes from './MenuList.module.scss';

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

  const [animatedList] = useAutoAnimate();

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
      <AnimateHeight
        height={collectionDetailsVisible ? 'auto' : 0}
        duration={300}
        easing="ease-in-out">
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
      </AnimateHeight>
      <div className={classes.menuListContent}>
        <Scrollbox>
          <div ref={animatedList}>
            {visibleMenus.map(({ menu, index }) => {
              const shortcut = backend.supportsShortcuts
                ? menu.shortcut
                : menu.shortcutID;
              const className =
                classes.menu + ' ' + (index === selectedMenu ? classes.selected : '');

              return (
                <button
                  key={index}
                  draggable={true}
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

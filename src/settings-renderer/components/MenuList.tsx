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
import { TbPlus } from 'react-icons/tb';

import * as classes from './MenuList.module.scss';
const cx = classNames.bind(classes);

import { useMenuSettings, useAppState } from '../state';
import Scrollbox from './widgets/Scrollbox';
import ThemedIcon from './widgets/ThemedIcon';
import Swirl from './widgets/Swirl';
import Note from './widgets/Note';
import Button from './widgets/Button';
import CollectionDetails from './CollectionDetails';

export default () => {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);

  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const addMenu = useMenuSettings((state) => state.addMenu);

  const [filterTerm, setFilterTerm] = React.useState('');

  // Make sure that the selected menu is valid. This could for instance happen if
  // the currently selected menu is deleted by an external event (e.g. by editing
  // the settings file) or by re-doing a previously undone deletion :).
  if (selectedMenu >= menus.length) {
    selectMenu(menus.length - 1);
  }

  const backend = useAppState((state) => state.backendInfo);

  const [animatedList, enableAnimatedList] = useAutoAnimate({ duration: 250 });

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
      if (!filterTerm || selectedCollection !== -1) {
        return true;
      }

      // Else, a menu must contain the filter term to be visible.
      return menu.menu.root.name.toLowerCase().includes(filterTerm.toLowerCase());
    });

  return (
    <div className={classes.menuList}>
      <CollectionDetails onSearch={setFilterTerm} />
      <div className={classes.menuListContent}>
        <Scrollbox>
          <div ref={animatedList}>
            {menus.length === 0 && (
              <div key="-1" className={classes.message}>
                <h1>You have no menus!</h1>
                <Note>
                  You currently have no menus. Click the button below to create a first
                  menu!
                </Note>
                <Swirl variant="3" marginTop={10} />
              </div>
            )}
            {menus.length > 0 &&
              visibleMenus.length === 0 &&
              selectedCollection === -1 && (
                <div key="-1" className={classes.message}>
                  <h1>No Matching Menus</h1>
                  <Note>Maybe try a different search term?</Note>
                  <Swirl variant="3" marginTop={10} />
                </div>
              )}
            {menus.length > 0 &&
              visibleMenus.length === 0 &&
              selectedCollection !== -1 && (
                <div key="-1" className={classes.message}>
                  <h1>No Matching Menus</h1>
                  <Note>
                    Edit the tags above or add a completely new menu to this collection
                    with the button below.
                  </Note>
                  <Swirl variant="3" marginTop={10} />
                </div>
              )}

            {visibleMenus.map(({ menu, index }) => {
              const shortcut = backend.supportsShortcuts
                ? menu.shortcut
                : menu.shortcutID;

              return (
                <button
                  key={index}
                  className={cx({
                    menu: true,
                    selected: index === selectedMenu,
                    dragging: dnd.draggedType === 'menu' && dnd.draggedIndex === index,
                  })}
                  onClick={() => selectMenu(index)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    startDrag('menu', index);
                    enableAnimatedList(false);
                  }}
                  onDragEnd={() => {
                    endDrag();
                    enableAnimatedList(true);
                  }}
                  onDrop={() => {
                    endDrag();
                    enableAnimatedList(true);
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
                  }}>
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
              addMenu(menuCollections[selectedCollection]?.tags || []);
              selectMenu(menus.length);
            }}
          />
        </div>
      </div>
    </div>
  );
};

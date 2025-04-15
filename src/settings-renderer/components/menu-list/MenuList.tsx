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

import { useMenuSettings, useAppState } from '../../state';
import Scrollbox from '../common/Scrollbox';
import ThemedIcon from '../common/ThemedIcon';
import Swirl from '../common/Swirl';
import Note from '../common/Note';
import Button from '../common/Button';
import CollectionDetails from './CollectionDetails';
import { ensureUniqueKeys } from '../../utils';

/** For rendering the menus, a list of these objects is created. */
interface IRenderedMenu {
  /** A unique key for react. */
  key: string;

  /** The original index in the list of menu. */
  index: number;

  /** The name of the menu. */
  name: string;

  /** The shortcut of the menu. */
  shortcut: string;

  /** The icon of the menu. */
  icon: string;

  /** The theme from which the above icon should be used. */
  iconTheme: string;
}

/**
 * This is a vertical list of buttons, one for each configured menu. They can be reordered
 * via drag and drop. Clicking one of the buttons will make the corresponding menu the
 * currently selected menu. The menu list only shows menus matching the currently selected
 * collection or the currently selected filter term. If no collection is selected, all
 * menus are shown.
 *
 * In addition, there is a floating button at the bottom which allows to add a new menu.
 */
export default () => {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);
  const backend = useAppState((state) => state.backendInfo);

  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const addMenu = useMenuSettings((state) => state.addMenu);

  // This is set by the search bar in the collection details.
  const [filterTerm, setFilterTerm] = React.useState('');

  // Animate the filtering, addition, and removal of menus.
  const [animatedList] = useAutoAnimate({ duration: 200 });

  const dnd = useAppState((state) => state.dnd);
  const startDrag = useAppState((state) => state.startDrag);
  const endDrag = useAppState((state) => state.endDrag);
  const moveMenu = useMenuSettings((state) => state.moveMenu);

  // When a menu is dragged over another menu, we store the index of that menu as drop
  // index. The dragged menu will be drawn there.
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  // We will compile a list of all menus which are currently visible. We will use a list
  // of IRenderedMenu objects for this.
  let renderedMenus = menus.map((menu, index) => {
    const shortcut =
      (backend.supportsShortcuts ? menu.shortcut : menu.shortcutID) || 'Not bound.';
    const renderedMenu: IRenderedMenu = {
      key: menu.root.name + menu.root.icon + menu.root.iconTheme + shortcut,
      index,
      name: menu.root.name,
      shortcut,
      icon: menu.root.icon,
      iconTheme: menu.root.iconTheme,
    };

    return renderedMenu;
  });

  // Ensure that all keys are unique.
  ensureUniqueKeys(renderedMenus);

  // If a drag is in progress, we need to move the dragged menu to the position of the
  // menu we are currently hovering over. This is done by removing the dragged menu
  // from the list and inserting it at the position of the hovered menu.
  if (dnd.draggedType === 'menu' && dropIndex !== null) {
    const draggedMenu = renderedMenus.splice(dnd.draggedIndex, 1)[0];
    renderedMenus.splice(dropIndex, 0, draggedMenu);
  }

  // filtering the menus by the selected collection and then by the filter term. The
  // result is a list of IRenderedMenu objects.
  renderedMenus = renderedMenus
    .filter((menu) => {
      // If the user has not selected a collection, all menus are visible.
      if (selectedCollection === -1) {
        return true;
      }

      // Else, a menu must have all tags of the selected collection to be visible.
      return menuCollections[selectedCollection].tags.every((tag) =>
        menus[menu.index].tags?.includes(tag)
      );
    })
    .filter((menu) => {
      // If the user has not entered a filter term or if the filter bar is not visible,
      // all menus are visible.
      if (!filterTerm || selectedCollection !== -1) {
        return true;
      }

      // Else, a menu must contain the filter term to be visible.
      return menu.name.toLowerCase().includes(filterTerm.toLowerCase());
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
              renderedMenus.length === 0 &&
              selectedCollection === -1 && (
                <div key="-1" className={classes.message}>
                  <h1>No Matching Menus</h1>
                  <Note>Maybe try a different search term?</Note>
                  <Swirl variant="3" marginTop={10} />
                </div>
              )}
            {menus.length > 0 &&
              renderedMenus.length === 0 &&
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

            {renderedMenus.map((menu) => {
              return (
                <button
                  key={menu.key}
                  className={cx({
                    menu: true,
                    selected: menu.index === selectedMenu,
                    dragging:
                      dnd.draggedType === 'menu' && dnd.draggedIndex === menu.index,
                  })}
                  onClick={() => selectMenu(menu.index)}
                  draggable
                  onDragStart={() => {
                    startDrag('menu', menu.index);
                    setDropIndex(menu.index);
                  }}
                  onDragEnd={() => {
                    moveMenu(dnd.draggedIndex, dropIndex);

                    // If the selected menu was dragged, we need to update the selected index.
                    if (dnd.draggedIndex === selectedMenu) {
                      selectMenu(dropIndex);
                    }

                    // If the dragged menu was dropped on the other side of the selected menu,
                    // we need to update the selected index as well.
                    if (dnd.draggedIndex < selectedMenu && dropIndex >= selectedMenu) {
                      selectMenu(selectedMenu - 1);
                    } else if (
                      dnd.draggedIndex > selectedMenu &&
                      dropIndex <= selectedMenu
                    ) {
                      selectMenu(selectedMenu + 1);
                    }

                    endDrag();
                    setDropIndex(null);
                  }}
                  onDragOver={(event) => {
                    if (dnd.draggedType === 'menu') {
                      event.preventDefault();
                    }
                  }}
                  onDragEnter={() => {
                    if (dnd.draggedType === 'menu' && dnd.draggedIndex !== menu.index) {
                      if (dnd.draggedIndex < menu.index) {
                        setDropIndex(
                          dropIndex >= menu.index ? menu.index - 1 : menu.index
                        );
                      } else {
                        setDropIndex(
                          dropIndex <= menu.index ? menu.index + 1 : menu.index
                        );
                      }
                    }
                  }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flexShrink: 0, width: 32, marginRight: 10 }}>
                      <ThemedIcon name={menu.icon} theme={menu.iconTheme} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={classes.menuTitle}>{menu.name}</div>
                      <div className={classes.menuSubtitle}>{menu.shortcut}</div>
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

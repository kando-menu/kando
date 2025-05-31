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
import classNames from 'classnames/bind';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TbPlus, TbCopy, TbTrash } from 'react-icons/tb';

import * as classes from './MenuList.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings, useMappedMenuProperties } from '../../state';

import { Scrollbox, ThemedIcon, Swirl, Note, Button } from '../common';
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
export default function MenuList() {
  const menus = useMappedMenuProperties((menu) => ({
    name: menu.root.name,
    icon: menu.root.icon,
    iconTheme: menu.root.iconTheme,
    shortcut: menu.shortcut,
    shortcutID: menu.shortcutID,
    tags: menu.tags,
  }));
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);
  const backend = useAppState((state) => state.backendInfo);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectMenu = useAppState((state) => state.selectMenu);
  const addMenu = useMenuSettings((state) => state.addMenu);
  const deleteMenu = useMenuSettings((state) => state.deleteMenu);
  const duplicateMenu = useMenuSettings((state) => state.duplicateMenu);
  const moveMenu = useMenuSettings((state) => state.moveMenu);
  const moveMenuItem = useMenuSettings((state) => state.moveMenuItem);

  // This is set by the search bar in the collection details.
  const [filterTerm, setFilterTerm] = React.useState('');

  // Animate the filtering, addition, and removal of menus.
  const [animatedList] = useAutoAnimate({ duration: 200 });

  // When a menu is dragged over another menu, we store the index of that menu as drop
  // index. The dragged menu will be drawn there.
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  // We will compile a list of all menus which are currently visible. We will use a list
  // of IRenderedMenu objects for this.
  let renderedMenus = menus.map((menu, index) => {
    const shortcut =
      (backend.supportsShortcuts ? menu.shortcut : menu.shortcutID) ||
      i18next.t('settings.not-bound');
    const renderedMenu: IRenderedMenu = {
      key: menu.name + menu.icon + menu.iconTheme + shortcut,
      index,
      name: menu.name,
      shortcut,
      icon: menu.icon,
      iconTheme: menu.iconTheme,
    };

    return renderedMenu;
  });

  // Ensure that all keys are unique.
  ensureUniqueKeys(renderedMenus);

  // If a drag is in progress, we need to move the dragged menu to the position of the
  // menu we are currently hovering over. This is done by removing the dragged menu
  // from the list and inserting it at the position of the hovered menu.
  if (dragIndex !== null && dropIndex !== null) {
    const draggedMenu = renderedMenus.splice(dragIndex, 1)[0];
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
          <div ref={animatedList} style={{ padding: 8 }}>
            {menus.length === 0 && (
              <div key="-1" className={classes.message}>
                <h1>{i18next.t('settings.no-menus')}</h1>
                <Note>{i18next.t('settings.no-menus-note')}</Note>
                <Swirl variant="2" marginTop={10} />
              </div>
            )}
            {menus.length > 0 &&
              renderedMenus.length === 0 &&
              selectedCollection === -1 && (
                <div key="-1" className={classes.message}>
                  <h1>{i18next.t('settings.no-matching-menus')}</h1>
                  <Note>{i18next.t('settings.no-matching-menus-note')}</Note>
                  <Swirl variant="2" marginTop={10} />
                </div>
              )}
            {menus.length > 0 &&
              renderedMenus.length === 0 &&
              selectedCollection !== -1 && (
                <div key="-1" className={classes.message}>
                  <h1>{i18next.t('settings.empty-collection')}</h1>
                  <Note>{i18next.t('settings.empty-collection-note')}</Note>
                  <Swirl variant="2" marginTop={10} />
                </div>
              )}

            {renderedMenus.map((menu) => {
              return (
                <button
                  key={menu.key}
                  className={cx({
                    menu: true,
                    selected: menu.index === selectedMenu,
                    dragging: dragIndex === menu.index,
                  })}
                  onClick={() => selectMenu(menu.index)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('kando/menu-index', menu.index.toString());
                    event.dataTransfer.setData('kando/menu', JSON.stringify(menu));
                    setDragIndex(menu.index);
                    setDropIndex(menu.index);
                  }}
                  onDragEnd={() => {
                    moveMenu(dragIndex, dropIndex);

                    // If the selected menu was dragged, we need to update the selected index.
                    if (dragIndex === selectedMenu) {
                      selectMenu(dropIndex);
                    }

                    // If the dragged menu was dropped on the other side of the selected menu,
                    // we need to update the selected index as well.
                    if (dragIndex < selectedMenu && dropIndex >= selectedMenu) {
                      selectMenu(selectedMenu - 1);
                    } else if (dragIndex > selectedMenu && dropIndex <= selectedMenu) {
                      selectMenu(selectedMenu + 1);
                    }

                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  onDragOver={(event) => {
                    if (
                      event.dataTransfer.types.includes('kando/menu-index') ||
                      event.dataTransfer.types.includes('kando/child-path')
                    ) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    // If a menu item is dropped on a menu, we need to remove the menu
                    // item from its current menu and add it to the new menu.
                    if (
                      event.dataTransfer.types.includes('kando/child-path') &&
                      menu.index !== selectedMenu
                    ) {
                      const fromPath = JSON.parse(
                        event.dataTransfer.getData('kando/child-path')
                      );

                      const toPath = [0];

                      // We have to make sure that the menu item is moved in the drag-end
                      // event, because else the drag-end event of the dragged menu item
                      // will not be triggered as it's removed by the moveMenuItem state
                      // update.
                      const handleDragEnd = () => {
                        moveMenuItem(selectedMenu, fromPath, menu.index, toPath);
                        window.removeEventListener('dragend', handleDragEnd);
                      };

                      // Attach a one-time event listener for the dragend event.
                      window.addEventListener('dragend', handleDragEnd);

                      (event.target as HTMLElement).classList.remove(classes.dropping);
                    }
                  }}
                  onDragEnter={(event) => {
                    // If we are dragging a menu over another menu, we need to set the
                    // drop index to the index of the hovered menu. We need to check if
                    // we are dropping before or after the dragged menu.
                    if (
                      event.dataTransfer.types.includes('kando/menu-index') &&
                      dragIndex !== menu.index
                    ) {
                      if (dragIndex < menu.index) {
                        setDropIndex(
                          dropIndex >= menu.index ? menu.index - 1 : menu.index
                        );
                      } else {
                        setDropIndex(
                          dropIndex <= menu.index ? menu.index + 1 : menu.index
                        );
                      }
                    }

                    // If we are dragging a menu item over a child item, we need to set
                    // the drop index to the menu index as well, but no need to check
                    // the drag index. We cannot drop a menu item into the current menu.
                    if (
                      event.dataTransfer.types.includes('kando/child-path') &&
                      menu.index !== selectedMenu
                    ) {
                      (event.target as HTMLElement).classList.add(classes.dropping);
                      setDropIndex(menu.index);
                    }
                  }}
                  onDragLeave={(event) => {
                    if (
                      event.dataTransfer.types.includes('kando/child-path') &&
                      menu.index !== selectedMenu
                    ) {
                      (event.target as HTMLElement).classList.remove(classes.dropping);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Delete' || event.key === 'Backspace') {
                      deleteMenu(menu.index);
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
            tooltip={i18next.t('settings.create-menu-button')}
            variant="floating"
            size="large"
            grouped
            onClick={() => {
              addMenu(menuCollections[selectedCollection]?.tags || []);
              selectMenu(menus.length);
            }}
          />
          <Button
            icon={<TbCopy />}
            tooltip={i18next.t('settings.duplicate-menu')}
            variant="floating"
            size="large"
            grouped
            onClick={() => {
              duplicateMenu(selectedMenu);
            }}
          />
          <Button
            icon={<TbTrash />}
            tooltip={i18next.t('settings.delete-menu')}
            variant="floating"
            size="large"
            grouped
            onClick={() => {
              deleteMenu(selectedMenu);
            }}
          />
        </div>
      </div>
    </div>
  );
}

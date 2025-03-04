//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Properties.module.scss';
import { TbCopy, TbTrash } from 'react-icons/tb';

import { useAppState, useMenuSettings } from '../state';

import Headerbar from './widgets/Headerbar';
import Button from './widgets/Button';
import TagInput from './widgets/TagInput';

export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const duplicateMenu = useMenuSettings((state) => state.duplicateMenu);
  const deleteMenu = useMenuSettings((state) => state.deleteMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);
  const menuCollections = useMenuSettings((state) => state.collections);

  const [menuTags, setMenuTags] = React.useState([]);

  // Update the tag editor whenever the selected menu changes.
  React.useEffect(() => {
    setMenuTags(menus[selectedMenu].tags || []);
  }, [selectedMenu, menus]);

  // Accumulate a list of all tags which are currently used in our collections and menus.
  let allAvailableTags = menuCollections
    .map((collection) => collection.tags)
    .concat(menus.map((menu) => menu.tags))
    .filter((tag) => tag)
    .reduce((acc, tags) => acc.concat(tags), []);

  // Remove duplicates.
  allAvailableTags = Array.from(new Set(allAvailableTags));

  return (
    <>
      <Headerbar />
      <div className={classes.properties}>
        {menus[selectedMenu]?.root.name || 'No Menu Selected'}
        <TagInput
          tags={menuTags}
          onChange={(newTags) => {
            editMenu(selectedMenu, { tags: newTags });
            setMenuTags(newTags);
          }}
          suggestions={allAvailableTags}
        />
        <div className={classes.floatingButton}>
          <Button
            icon={<TbCopy />}
            tooltip="Duplicate menu"
            variant="floating"
            size="large"
            grouped
            onClick={() => duplicateMenu(selectedMenu)}
          />
          <Button
            icon={<TbTrash />}
            tooltip="Delete menu"
            variant="floating"
            size="large"
            grouped
            onClick={() => deleteMenu(selectedMenu)}
          />
        </div>
      </div>
    </>
  );
};

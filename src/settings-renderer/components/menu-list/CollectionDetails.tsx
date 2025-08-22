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
import MouseTrap from 'mousetrap';
import classNames from 'classnames/bind';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TbCheck, TbSearch, TbSearchOff, TbBackspaceFilled } from 'react-icons/tb';
import { RiPencilFill } from 'react-icons/ri';

import * as classes from './CollectionDetails.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../../state';
import { Button, IconChooserButton, TagInput } from '../common';

type Props = {
  /** When the search term changes. */
  onSearch: (term: string) => void;
};

/**
 * This component encapsulates the widgets above the menu list. These widgets have several
 * modi: If the show-all-menus button at the top of the collection list is selected, the
 * details will show a search bar which can be shown or hidden with a button. If a
 * collection is selected, the details will show the collection name and a set of widgets
 * for editing the collection's name, icon, and tags.
 */
export default function CollectionDetails(props: Props) {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);
  const selectCollection = useAppState((state) => state.selectCollection);

  const collectionDetailsVisible = useAppState((state) => state.collectionDetailsVisible);
  const setCollectionDetailsVisible = useAppState(
    (state) => state.setCollectionDetailsVisible
  );

  const menuSearchBarVisible = useAppState((state) => state.menuSearchBarVisible);
  const setMenuSearchBarVisible = useAppState((state) => state.setMenuSearchBarVisible);
  const editCollection = useMenuSettings((state) => state.editCollection);

  const [filterTerm, setFilterTerm] = React.useState('');
  const [filterTags, setFilterTags] = React.useState([]);
  const [collectionName, setCollectionName] = React.useState('');
  const searchbarRef = React.useRef<HTMLInputElement>(null);

  // Show the search bar when the user presses Ctrl+F.
  React.useEffect(() => {
    MouseTrap.bind('mod+f', () => {
      if (!menuSearchBarVisible || selectedCollection !== -1) {
        selectCollection(-1);
        setMenuSearchBarVisible(true);
        setTimeout(() => {
          if (searchbarRef.current) {
            searchbarRef.current.focus();
          }
        }, 0);
      }
    });

    return () => {
      MouseTrap.unbind('mod+f');
    };
  }, []);

  // Update the tag editor whenever the selected menu collection changes.
  React.useEffect(() => {
    if (selectedCollection !== -1) {
      setFilterTags(menuCollections[selectedCollection].tags);
      setCollectionName(menuCollections[selectedCollection].name);
    } else {
      setCollectionName(i18next.t('settings.all-menus'));
    }
  }, [selectedCollection, menuCollections]);

  // This is used to animate the height of the collection details when the user shows or
  // hides the search bar or the collection details.
  const [animatedRef] = useAutoAnimate({ duration: 250 });

  const showingCollection = selectedCollection !== -1;
  const editingCollection = showingCollection && collectionDetailsVisible;

  return (
    <div
      ref={animatedRef}
      className={cx({
        editingCollection,
        showingCollection,
      })}>
      <div className={classes.collectionHeader}>
        {showingCollection && (
          <IconChooserButton
            grouped
            iconSize="1.5em"
            icon={menuCollections[selectedCollection]?.icon}
            theme={menuCollections[selectedCollection]?.iconTheme}
            onChange={(icon, theme) => {
              editCollection(selectedCollection, (collection) => {
                collection.icon = icon;
                collection.iconTheme = theme;
                return collection;
              });
            }}
          />
        )}
        <input
          type="text"
          className={classes.collectionName}
          value={collectionName}
          tabIndex={editingCollection ? undefined : -1}
          onChange={(event) => {
            setCollectionName(event.target.value);
          }}
          onBlur={() => {
            editCollection(selectedCollection, (collection) => {
              collection.name = collectionName;
              return collection;
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
              setCollectionDetailsVisible(false);
            }
          }}
        />
        {!showingCollection && menuSearchBarVisible && (
          <Button
            icon={<TbSearchOff />}
            variant="tool"
            onClick={() => {
              setMenuSearchBarVisible(false);
              setFilterTerm('');
              props.onSearch('');
            }}
          />
        )}
        {!showingCollection && !menuSearchBarVisible && (
          <Button
            icon={<TbSearch />}
            variant="tool"
            onClick={() => setMenuSearchBarVisible(true)}
          />
        )}
        {showingCollection && collectionDetailsVisible && (
          <Button
            icon={<TbCheck />}
            variant="secondary"
            grouped
            onClick={() => setCollectionDetailsVisible(false)}
          />
        )}
        {showingCollection && !collectionDetailsVisible && (
          <Button
            icon={<RiPencilFill />}
            variant="tool"
            onClick={() => setCollectionDetailsVisible(true)}
          />
        )}
      </div>
      {menuSearchBarVisible && !showingCollection && (
        <div className={classes.collectionDetails}>
          <div className={classes.searchInput}>
            <input
              ref={searchbarRef}
              type="text"
              placeholder={i18next.t('settings.search-menus-placeholder')}
              value={filterTerm}
              onChange={(event) => {
                setFilterTerm(event.target.value);
                props.onSearch(event.target.value);
              }}
            />
            <Button
              grouped
              icon={<TbBackspaceFilled />}
              onClick={() => {
                setFilterTerm('');
                props.onSearch('');
              }}
            />
          </div>
        </div>
      )}
      {editingCollection && (
        <div className={classes.collectionDetails}>
          <TagInput
            tags={filterTags}
            onChange={(newTags) => {
              editCollection(selectedCollection, (collection) => {
                collection.tags = newTags;
                return collection;
              });
              setFilterTags(newTags);
            }}
          />
        </div>
      )}
    </div>
  );
}

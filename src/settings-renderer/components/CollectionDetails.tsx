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
import { TbCheck, TbSearch, TbSearchOff, TbBackspaceFilled } from 'react-icons/tb';
import { RiPencilFill } from 'react-icons/ri';

import * as classes from './CollectionDetails.module.scss';
const cx = classNames.bind(classes);

import { useMenuSettings, useAppState } from '../state';
import Button from './widgets/Button';
import IconChooserButton from './widgets/IconChooserButton';
import TagInput from './widgets/TagInput';

interface IProps {
  /** When the search term changes. */
  onSearch: (term: string) => void;
}

export default (props: IProps) => {
  const menuCollections = useMenuSettings((state) => state.collections);
  const selectedCollection = useAppState((state) => state.selectedCollection);

  const collectionDetailsVisible = useAppState((state) => state.collectionDetailsVisible);
  const setCollectionDetailsVisible = useAppState(
    (state) => state.setCollectionDetailsVisible
  );

  const menus = useMenuSettings((state) => state.menus);
  const editCollection = useMenuSettings((state) => state.editCollection);

  const [filterTerm, setFilterTerm] = React.useState('');
  const [filterTags, setFilterTags] = React.useState([]);

  const [collectionName, setCollectionName] = React.useState('');

  // Update the tag editor whenever the selected menu collection changes.
  React.useEffect(() => {
    if (selectedCollection !== -1) {
      setFilterTags(menuCollections[selectedCollection].tags);
      setCollectionName(menuCollections[selectedCollection].name);
    } else {
      setCollectionName('All Menus');
    }
  }, [selectedCollection, menuCollections]);

  const [animatedEditor] = useAutoAnimate({ duration: 250 });

  // Accumulate a list of all tags which are currently used in our collections and menus.
  let allAvailableTags = menuCollections
    .map((collection) => collection.tags)
    .concat(menus.map((menu) => menu.tags))
    .filter((tag) => tag)
    .reduce((acc, tags) => acc.concat(tags), []);

  // Remove duplicates.
  allAvailableTags = Array.from(new Set(allAvailableTags));

  return (
    <div
      ref={animatedEditor}
      className={cx({
        editingCollection: collectionDetailsVisible && selectedCollection !== -1,
        showingCollection: selectedCollection !== -1,
      })}>
      <div className={classes.collectionHeader}>
        {selectedCollection !== -1 && (
          <IconChooserButton
            grouped
            iconSize="1.5em"
            icon={menuCollections[selectedCollection]?.icon}
            theme={menuCollections[selectedCollection]?.iconTheme}
          />
        )}
        <input
          type="text"
          className={classes.collectionName}
          value={collectionName}
          onChange={(event) => {
            setCollectionName(event.target.value);
          }}
          onBlur={() => {
            editCollection(selectedCollection, { name: collectionName });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
              setCollectionDetailsVisible(false);
            }
          }}
        />
        {selectedCollection === -1 && collectionDetailsVisible && (
          <Button
            icon={<TbSearchOff />}
            variant="tool"
            onClick={() => {
              setCollectionDetailsVisible(false);
              setFilterTerm('');
              props.onSearch('');
            }}
          />
        )}
        {selectedCollection === -1 && !collectionDetailsVisible && (
          <Button
            icon={<TbSearch />}
            variant="tool"
            onClick={() => setCollectionDetailsVisible(true)}
          />
        )}
        {selectedCollection !== -1 && collectionDetailsVisible && (
          <Button
            icon={<TbCheck />}
            variant="secondary"
            grouped
            onClick={() => setCollectionDetailsVisible(false)}
          />
        )}
        {selectedCollection !== -1 && !collectionDetailsVisible && (
          <Button
            icon={<RiPencilFill />}
            variant="tool"
            onClick={() => setCollectionDetailsVisible(true)}
          />
        )}
      </div>
      {collectionDetailsVisible && (
        <div className={classes.collectionDetails}>
          {selectedCollection === -1 && (
            <div className={classes.searchInput}>
              <input
                type="text"
                placeholder="Search menus..."
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
  );
};

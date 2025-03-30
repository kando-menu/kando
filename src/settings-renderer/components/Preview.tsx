//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import {
  TbSettingsFilled,
  TbInfoSquareRoundedFilled,
  TbPaletteFilled,
} from 'react-icons/tb';
import { IoArrowUndo, IoArrowRedo } from 'react-icons/io5';

import * as classes from './Preview.module.scss';

import { useAppState, useMenuSettings } from '../state';
import { ItemTypeRegistry } from '../../common/item-type-registry';
import Headerbar from './widgets/Headerbar';
import Button from './widgets/Button';
import ThemedIcon from './widgets/ThemedIcon';

export default () => {
  // This will force a re-render whenever the menu settings change. For now, this is
  // necessary to update the undo/redo buttons. In the future, we might want to make
  // this more fine-grained, maybe by directly subscribing to the past and future states
  // of the temporal state.
  useMenuSettings();

  const setAboutDialogVisible = useAppState((state) => state.setAboutDialogVisible);
  const setThemesDialogVisible = useAppState((state) => state.setThemesDialogVisible);
  const setSettingsDialogVisible = useAppState((state) => state.setSettingsDialogVisible);

  const { futureStates, pastStates } = useMenuSettings.temporal.getState();

  const headerButtons = (
    <>
      <span>
        <Button
          tooltip="About Kando"
          icon={<TbInfoSquareRoundedFilled />}
          onClick={() => setAboutDialogVisible(true)}
          variant="tool"
          grouped
        />
        <Button
          tooltip="Menu Themes"
          icon={<TbPaletteFilled />}
          onClick={() => setThemesDialogVisible(true)}
          variant="tool"
          grouped
        />
        <Button
          tooltip="General Settings"
          icon={<TbSettingsFilled />}
          onClick={() => setSettingsDialogVisible(true)}
          variant="tool"
          grouped
        />
      </span>
      <span>
        <Button
          tooltip="Undo"
          icon={<IoArrowUndo />}
          disabled={pastStates.length === 0}
          onClick={() => useMenuSettings.temporal.getState().undo()}
          variant="tool"
          grouped
        />
        <Button
          tooltip="Redo"
          icon={<IoArrowRedo />}
          disabled={futureStates.length === 0}
          onClick={() => useMenuSettings.temporal.getState().redo()}
          variant="tool"
          grouped
        />
      </span>
    </>
  );

  const itemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());

  return (
    <div className={classes.container}>
      <Headerbar center={headerButtons} />
      <div className={classes.previewArea}>
        <div className={classes.preview}></div>
      </div>
      <div className={classes.itemArea}>
        <div className={classes.header}>
          <div className={classes.leftLine}></div>
          <div className={classes.title}>Add Menu Items</div>
          <div className={classes.rightLine}></div>
        </div>
        <div className={classes.shadow}></div>
        <div className={classes.items}>
          {itemTypes.map(([name, type]) => (
            <div
              key={name}
              className={classes.item}
              data-tooltip-id="click-to-show-tooltip"
              data-tooltip-html={
                '<strong>' + type.defaultName + '</strong><br>' + type.genericDescription
              }
              draggable>
              <ThemedIcon
                size={'100%'}
                name={type.defaultIcon}
                theme={type.defaultIconTheme}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

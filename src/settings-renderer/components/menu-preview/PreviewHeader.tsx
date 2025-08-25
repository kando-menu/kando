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
import { TbSettingsFilled, TbHeartFilled, TbPaletteFilled } from 'react-icons/tb';
import { IoArrowUndo, IoArrowRedo, IoSchool } from 'react-icons/io5';

import { useAppState, useMenuSettings } from '../../state';
import { Headerbar, Button } from '../common';

/**
 * This is the toolbar at the top of the menu-preview area. It contains some buttons for
 * undo/redo, and for opening the settings dialogs.
 */
export default function PreviewHeader() {
  const setAboutDialogVisible = useAppState((state) => state.setAboutDialogVisible);
  const setIntroDialogVisible = useAppState((state) => state.setIntroDialogVisible);
  const setThemesDialogVisible = useAppState((state) => state.setThemesDialogVisible);
  const setSettingsDialogVisible = useAppState((state) => state.setSettingsDialogVisible);

  // Undo/Redo buttons that only re-render when undo/redo state changes.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const UndoRedoButtons = React.memo(() => {
    const { futureStates, pastStates } = useMenuSettings.temporal.getState();
    // Subscribe to any menu change to update buttons.
    useMenuSettings();

    return (
      <>
        <Button
          grouped
          disabled={pastStates.length === 0}
          icon={<IoArrowUndo />}
          tooltip={i18next.t('settings.undo')}
          variant="tool"
          onClick={() => useMenuSettings.temporal.getState().undo()}
        />
        <Button
          grouped
          disabled={futureStates.length === 0}
          icon={<IoArrowRedo />}
          tooltip={i18next.t('settings.redo')}
          variant="tool"
          onClick={() => useMenuSettings.temporal.getState().redo()}
        />
      </>
    );
  });

  const headerButtons = (
    <>
      <span style={{ marginRight: '8px' }}>
        <Button
          grouped
          icon={<IoSchool />}
          tooltip={i18next.t('settings.introduction-dialog.title')}
          variant="tool"
          onClick={() => setIntroDialogVisible(true)}
        />
        <Button
          grouped
          icon={<TbHeartFilled />}
          tooltip={i18next.t('settings.about-dialog.title')}
          variant="tool"
          onClick={() => setAboutDialogVisible(true)}
        />
      </span>
      <span style={{ marginRight: '8px' }}>
        <Button
          grouped
          icon={<TbPaletteFilled />}
          tooltip={i18next.t('settings.menu-themes-dialog.title')}
          variant="tool"
          onClick={() => setThemesDialogVisible(true)}
        />
        <Button
          grouped
          icon={<TbSettingsFilled />}
          tooltip={i18next.t('settings.general-settings-dialog.title')}
          variant="tool"
          onClick={() => setSettingsDialogVisible(true)}
        />
      </span>
      <span>
        <UndoRedoButtons />
      </span>
    </>
  );
  return <Headerbar center={headerButtons} />;
}

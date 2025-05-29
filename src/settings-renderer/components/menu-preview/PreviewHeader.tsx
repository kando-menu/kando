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
          tooltip={i18next.t('settings.undo')}
          icon={<IoArrowUndo />}
          disabled={pastStates.length === 0}
          onClick={() => useMenuSettings.temporal.getState().undo()}
          variant="tool"
          grouped
        />
        <Button
          tooltip={i18next.t('settings.redo')}
          icon={<IoArrowRedo />}
          disabled={futureStates.length === 0}
          onClick={() => useMenuSettings.temporal.getState().redo()}
          variant="tool"
          grouped
        />
      </>
    );
  });

  const headerButtons = (
    <>
      <span style={{ marginRight: '8px' }}>
        <Button
          tooltip={i18next.t('settings.introduction-dialog.title')}
          icon={<IoSchool />}
          onClick={() => setIntroDialogVisible(true)}
          variant="tool"
          grouped
        />
        <Button
          tooltip={i18next.t('settings.about-dialog.title')}
          icon={<TbHeartFilled />}
          onClick={() => setAboutDialogVisible(true)}
          variant="tool"
          grouped
        />
      </span>
      <span style={{ marginRight: '8px' }}>
        <Button
          tooltip={i18next.t('settings.menu-themes-dialog.title')}
          icon={<TbPaletteFilled />}
          onClick={() => setThemesDialogVisible(true)}
          variant="tool"
          grouped
        />
        <Button
          tooltip={i18next.t('settings.general-settings-dialog.title')}
          icon={<TbSettingsFilled />}
          onClick={() => setSettingsDialogVisible(true)}
          variant="tool"
          grouped
        />
      </span>
      <span>
        <UndoRedoButtons />
      </span>
    </>
  );
  return <Headerbar center={headerButtons} />;
}

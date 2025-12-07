//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';
import i18next from 'i18next';

import { TbTrophyFilled } from 'react-icons/tb';
import { useAppState } from '../../state';

import { Modal, Scrollbox } from '../common';

/** This dialog allows the user to configure some general settings of Kando. */
export default function AchievementsDialog() {
  const achievementsDialogVisible = useAppState(
    (state) => state.achievementsDialogVisible
  );
  const setAchievementsDialogVisible = useAppState(
    (state) => state.setAchievementsDialogVisible
  );

  return (
    <Modal
      icon={<TbTrophyFilled />}
      isVisible={achievementsDialogVisible}
      maxWidth={700}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}
      paddingTop={0}
      title={i18next.t('settings.achievements-dialog.title')}
      onClose={() => setAchievementsDialogVisible(false)}>
      <Scrollbox maxHeight="min(80vh, 800px)">
        <div />
      </Scrollbox>
    </Modal>
  );
}

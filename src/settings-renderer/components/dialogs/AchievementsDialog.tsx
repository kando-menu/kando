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

import * as classes from './AchievementsDialog.module.scss';
const cx = classNames.bind(classes);

import { TbTrophyFilled } from 'react-icons/tb';
import { useAppState } from '../../state';

import { SettingsCheckbox, Modal, Scrollbox, ProgressBar } from '../common';

const LEVEL_BADGES = [
  require('../../../../assets/images/levels/level1.png'),
  require('../../../../assets/images/levels/level2.png'),
  require('../../../../assets/images/levels/level3.png'),
  require('../../../../assets/images/levels/level4.png'),
  require('../../../../assets/images/levels/level5.png'),
  require('../../../../assets/images/levels/level6.png'),
  require('../../../../assets/images/levels/level7.png'),
  require('../../../../assets/images/levels/level8.png'),
  require('../../../../assets/images/levels/level9.png'),
  require('../../../../assets/images/levels/level10.png'),
];

/** This dialog allows the user to configure some general settings of Kando. */
export default function AchievementsDialog() {
  const achievementsDialogVisible = useAppState(
    (state) => state.achievementsDialogVisible
  );
  const setAchievementsDialogVisible = useAppState(
    (state) => state.setAchievementsDialogVisible
  );
  const levelProgress = useAppState((state) => state.levelProgress);

  return (
    <Modal
      icon={<TbTrophyFilled />}
      isVisible={achievementsDialogVisible}
      maxWidth={800}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}
      paddingTop={0}
      title={i18next.t('settings.achievements-dialog.title')}
      onClose={() => setAchievementsDialogVisible(false)}>
      <div className={cx('levelContainer')}>
        <img src={LEVEL_BADGES[levelProgress.level - 1]} />
        {levelProgress.xp} / {levelProgress.maxXp} XP
        <ProgressBar
          barStyle="big"
          value={(levelProgress.xp / levelProgress.maxXp) * 100}
        />
      </div>
      <Scrollbox maxHeight="min(40vh, 500px)">
        <h3>Active Achievements</h3>
        {levelProgress.activeAchievements.length === 0 && <p>No active achievements.</p>}
        <ul>
          {levelProgress.activeAchievements.map((achievement) => (
            <li key={achievement.id}>
              {achievement.name} - {achievement.description} ({achievement.statValue} /{' '}
              {achievement.statRange[1]})
            </li>
          ))}
        </ul>
        <h3>Completed Achievements</h3>
        {levelProgress.completedAchievements.length === 0 && (
          <p>No completed achievements.</p>
        )}
        <ul>
          {levelProgress.completedAchievements.map((achievement) => (
            <li key={achievement.id}>
              {achievement.name} - {achievement.description} ({achievement.date})
            </li>
          ))}
        </ul>
      </Scrollbox>
      <div className={cx('footer')}>
        <SettingsCheckbox
          isFlipped
          label={i18next.t('settings.achievements-dialog.enable-achievements')}
          settingsKey="enableAchievements"
        />
        <div>Toogle</div>
        <div>Clear</div>
      </div>
    </Modal>
  );
}

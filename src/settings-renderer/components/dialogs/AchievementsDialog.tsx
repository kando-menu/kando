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

import { TbTrophyFilled, TbRestore } from 'react-icons/tb';
import { useAppState } from '../../state';

import { Modal, Scrollbox, ProgressBar, Button } from '../common';

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
  const [showCompleted, setShowCompleted] = React.useState(false);

  return (
    <Modal
      icon={<TbTrophyFilled />}
      isVisible={achievementsDialogVisible}
      maxWidth={800}
      paddingBottom={0}
      paddingLeft={0}
      paddingRight={0}
      paddingTop={0}
      title={i18next.t('settings.achievements-dialog.title')}
      onClose={() => setAchievementsDialogVisible(false)}>
      <div className={classes.levelContainer}>
        <img src={LEVEL_BADGES[levelProgress.level - 1]} />
        {levelProgress.xp} / {levelProgress.maxXp} XP
        <ProgressBar
          barStyle="big"
          value={(levelProgress.xp / levelProgress.maxXp) * 100}
        />
      </div>
      <div className={classes.achievementContainer}>
        <div className={cx({ achievementSlider: true, showCompleted })}>
          <div className={classes.achievementListWrapper}>
            <Scrollbox maxHeight="min(45vh, 500px)" paddingRight={8}>
              <div className={classes.achievementList}>
                {levelProgress.activeAchievements.map((achievement) => (
                  <div key={achievement.id} className={classes.achievement}>
                    <div className={classes.row}>
                      <div className={classes.achievementName}>{achievement.name}</div>
                      <div className={classes.achievementStat}>{achievement.xp} XP</div>
                    </div>
                    <div className={classes.row} style={{ marginBottom: '4px' }}>
                      <div>{achievement.description}</div>
                      <div className={classes.achievementStat}>
                        {achievement.statValue} / {achievement.statRange[1]}
                      </div>
                    </div>
                    <ProgressBar
                      barStyle="normal"
                      value={(achievement.statValue / achievement.statRange[1]) * 100}
                    />
                  </div>
                ))}
              </div>
            </Scrollbox>
          </div>
          <div className={classes.achievementListWrapper}>
            <Scrollbox maxHeight="min(45vh, 500px)">
              <div className={classes.achievementList}>
                {levelProgress.completedAchievements.map((achievement) => (
                  <div key={achievement.id} className={classes.achievement}>
                    <div className={classes.row}>
                      <div className={classes.achievementName}>{achievement.name}</div>
                      <div className={classes.achievementStat}>{achievement.xp} XP</div>
                    </div>
                    <div className={classes.row}>
                      <div>{achievement.description}</div>
                      <div className={classes.achievementStat}>
                        {new Date(achievement.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Scrollbox>
          </div>
        </div>
      </div>
      <div className={classes.footerContainer}>
        <div className={classes.viewButtons}>
          <Button
            isGrouped
            isPressed={!showCompleted}
            label="In Progress"
            variant="secondary"
            onClick={() => setShowCompleted(false)}
          />
          <Button
            isGrouped
            isPressed={showCompleted}
            label="Completed"
            variant="secondary"
            onClick={() => setShowCompleted(true)}
          />
        </div>
        <Button icon={<TbRestore />} tooltip="Reset all achievements" variant="primary" />
      </div>
    </Modal>
  );
}

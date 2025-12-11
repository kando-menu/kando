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
import classNames from 'classnames/bind';

import * as classes from './AchievementsDialog.module.scss';
const cx = classNames.bind(classes);

import { TbTrophyFilled, TbRestore } from 'react-icons/tb';
import { useAppState } from '../../state';

import { AchievementBadgeType, AchievementBadgeIcon } from '../../../common';
import { Modal, Scrollbox, ProgressBar, Button } from '../common';

const LEVEL_BADGES = [
  require('../../../../assets/images/achievements/levels/level1.png'),
  require('../../../../assets/images/achievements/levels/level2.png'),
  require('../../../../assets/images/achievements/levels/level3.png'),
  require('../../../../assets/images/achievements/levels/level4.png'),
  require('../../../../assets/images/achievements/levels/level5.png'),
  require('../../../../assets/images/achievements/levels/level6.png'),
  require('../../../../assets/images/achievements/levels/level7.png'),
  require('../../../../assets/images/achievements/levels/level8.png'),
  require('../../../../assets/images/achievements/levels/level9.png'),
  require('../../../../assets/images/achievements/levels/level10.png'),
];

// Type-safe record that ensures every badge type has a corresponding image.
const ACHIEVEMENT_BADGES: Record<AchievementBadgeType, string> = {
  [AchievementBadgeType.eCopper]: require('../../../../assets/images/achievements/badges/copper.png'),
  [AchievementBadgeType.eBronze]: require('../../../../assets/images/achievements/badges/bronze.png'),
  [AchievementBadgeType.eSilver]: require('../../../../assets/images/achievements/badges/silver.png'),
  [AchievementBadgeType.eGold]: require('../../../../assets/images/achievements/badges/gold.png'),
  [AchievementBadgeType.ePlatinum]: require('../../../../assets/images/achievements/badges/platinum.png'),
  [AchievementBadgeType.eSpecial1]: require('../../../../assets/images/achievements/badges/special1.png'),
  [AchievementBadgeType.eSpecial2]: require('../../../../assets/images/achievements/badges/special2.png'),
  [AchievementBadgeType.eSpecial3]: require('../../../../assets/images/achievements/badges/special3.png'),
} as const;

// Type-safe record that ensures every icon type has a corresponding image.
const ACHIEVEMENT_ICONS: Record<AchievementBadgeIcon, string> = {
  [AchievementBadgeIcon.eCancelor1]: require('../../../../assets/images/achievements/icons/cancelor1.svg'),
  [AchievementBadgeIcon.eCancelor2]: require('../../../../assets/images/achievements/icons/cancelor2.svg'),
  [AchievementBadgeIcon.eCancelor3]: require('../../../../assets/images/achievements/icons/cancelor3.svg'),
  [AchievementBadgeIcon.eCancelor4]: require('../../../../assets/images/achievements/icons/cancelor4.svg'),
  [AchievementBadgeIcon.eCancelor5]: require('../../../../assets/images/achievements/icons/cancelor5.svg'),
  [AchievementBadgeIcon.ePielot1]: require('../../../../assets/images/achievements/icons/pielot1.svg'),
  [AchievementBadgeIcon.ePielot2]: require('../../../../assets/images/achievements/icons/pielot2.svg'),
  [AchievementBadgeIcon.ePielot3]: require('../../../../assets/images/achievements/icons/pielot3.svg'),
  [AchievementBadgeIcon.ePielot4]: require('../../../../assets/images/achievements/icons/pielot4.svg'),
  [AchievementBadgeIcon.ePielot5]: require('../../../../assets/images/achievements/icons/pielot5.svg'),
  [AchievementBadgeIcon.eGestureSelector1]: require('../../../../assets/images/achievements/icons/gestureSelector1.svg'),
  [AchievementBadgeIcon.eGestureSelector2]: require('../../../../assets/images/achievements/icons/gestureSelector2.svg'),
  [AchievementBadgeIcon.eGestureSelector3]: require('../../../../assets/images/achievements/icons/gestureSelector3.svg'),
  [AchievementBadgeIcon.eClickSelector1]: require('../../../../assets/images/achievements/icons/clickSelector1.svg'),
  [AchievementBadgeIcon.eClickSelector2]: require('../../../../assets/images/achievements/icons/clickSelector2.svg'),
  [AchievementBadgeIcon.eClickSelector3]: require('../../../../assets/images/achievements/icons/clickSelector3.svg'),
  [AchievementBadgeIcon.eJourney]: require('../../../../assets/images/achievements/icons/journey.svg'),
  [AchievementBadgeIcon.eSponsors]: require('../../../../assets/images/achievements/icons/sponsors.svg'),
  [AchievementBadgeIcon.eFallback]: require('../../../../assets/images/achievements/icons/fallback.svg'),
} as const;

// Gloss overlay for achievement badges.
const ACHIEVEMENT_BADGE_GLOSS = require('../../../../assets/images/achievements/badges/gloss.png');

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
        <img height={256} src={LEVEL_BADGES[levelProgress.level - 1]} width={256} />
        <div className={classes.levelText}>
          {levelProgress.xp} / {levelProgress.maxXp} XP
        </div>
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
                    <div className={classes.achievementBadge}>
                      <img src={ACHIEVEMENT_BADGES[achievement.badge]} />
                      <img src={ACHIEVEMENT_ICONS[achievement.icon]} />
                      <img src={ACHIEVEMENT_BADGE_GLOSS} />
                    </div>
                    <div className={classes.achievementData}>
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
                  </div>
                ))}
              </div>
            </Scrollbox>
          </div>
          <div className={classes.achievementListWrapper}>
            <Scrollbox maxHeight="min(45vh, 500px)">
              <div className={cx({ achievementList: true, completed: true })}>
                {levelProgress.completedAchievements.map((achievement) => (
                  <div key={achievement.id} className={classes.achievement}>
                    <div className={classes.achievementBadge}>
                      <img src={ACHIEVEMENT_BADGES[achievement.badge]} />
                      <img src={ACHIEVEMENT_ICONS[achievement.icon]} />
                      <img src={ACHIEVEMENT_BADGE_GLOSS} />
                    </div>
                    <div className={classes.achievementData}>
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
            label={i18next.t('settings.achievements-dialog.in-progress-button')}
            variant="secondary"
            onClick={() => setShowCompleted(false)}
          />
          <Button
            isGrouped
            badgeCount={
              levelProgress.newAchievementsCount > 0
                ? levelProgress.newAchievementsCount
                : undefined
            }
            isPressed={showCompleted}
            label={i18next.t('settings.achievements-dialog.completed-button')}
            variant="secondary"
            onClick={() => {
              setShowCompleted(true);
              window.settingsAPI.markAchievementsAsViewed();
            }}
          />
        </div>
        <Button
          icon={<TbRestore />}
          tooltip={i18next.t('settings.achievements-dialog.reset-button-tooltip')}
          variant="primary"
          onClick={() => window.settingsAPI.resetLevelProgress()}
        />
      </div>
    </Modal>
  );
}

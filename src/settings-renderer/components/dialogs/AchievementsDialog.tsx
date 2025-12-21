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

import { useAutoAnimate } from '@formkit/auto-animate/react';
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
  [AchievementBadgeType.eSpecial4]: require('../../../../assets/images/achievements/badges/special4.png'),
  [AchievementBadgeType.eSpecial5]: require('../../../../assets/images/achievements/badges/special5.png'),
  [AchievementBadgeType.eSpecial6]: require('../../../../assets/images/achievements/badges/special6.png'),
} as const;

// Type-safe record that ensures every icon type has a corresponding image.
const ACHIEVEMENT_ICONS: Record<AchievementBadgeIcon, string> = {
  [AchievementBadgeIcon.eAddedItems]: require('../../../../assets/images/achievements/icons/addedItems.svg'),
  [AchievementBadgeIcon.eBackedUp]: require('../../../../assets/images/achievements/icons/backedUp.svg'),
  [AchievementBadgeIcon.eCancelor1]: require('../../../../assets/images/achievements/icons/cancelor1.svg'),
  [AchievementBadgeIcon.eCancelor2]: require('../../../../assets/images/achievements/icons/cancelor2.svg'),
  [AchievementBadgeIcon.eCancelor3]: require('../../../../assets/images/achievements/icons/cancelor3.svg'),
  [AchievementBadgeIcon.eCancelor4]: require('../../../../assets/images/achievements/icons/cancelor4.svg'),
  [AchievementBadgeIcon.eCancelor5]: require('../../../../assets/images/achievements/icons/cancelor5.svg'),
  [AchievementBadgeIcon.eClickSelector]: require('../../../../assets/images/achievements/icons/clickSelector.svg'),
  [AchievementBadgeIcon.eDeepMenu]: require('../../../../assets/images/achievements/icons/deepMenu.svg'),
  [AchievementBadgeIcon.eDeletedAllMenus]: require('../../../../assets/images/achievements/icons/deletedAllMenus.svg'),
  [AchievementBadgeIcon.eDepthSelector1]: require('../../../../assets/images/achievements/icons/depthSelector1.svg'),
  [AchievementBadgeIcon.eDepthSelector2]: require('../../../../assets/images/achievements/icons/depthSelector2.svg'),
  [AchievementBadgeIcon.eDepthSelector3]: require('../../../../assets/images/achievements/icons/depthSelector3.svg'),
  [AchievementBadgeIcon.eFullMenu]: require('../../../../assets/images/achievements/icons/fullMenu.svg'),
  [AchievementBadgeIcon.eGamepadSelector]: require('../../../../assets/images/achievements/icons/gamepadSelector.svg'),
  [AchievementBadgeIcon.eGestureSelector]: require('../../../../assets/images/achievements/icons/gestureSelector.svg'),
  [AchievementBadgeIcon.eKeyboardSelector]: require('../../../../assets/images/achievements/icons/keyboardSelector.svg'),
  [AchievementBadgeIcon.eManySelectionsStreak]: require('../../../../assets/images/achievements/icons/manySelectionsStreak.svg'),
  [AchievementBadgeIcon.eMenuThemesSelected]: require('../../../../assets/images/achievements/icons/menuThemesSelected.svg'),
  [AchievementBadgeIcon.eRestored]: require('../../../../assets/images/achievements/icons/restored.svg'),
  [AchievementBadgeIcon.eSelector1]: require('../../../../assets/images/achievements/icons/selector1.svg'),
  [AchievementBadgeIcon.eSelector2]: require('../../../../assets/images/achievements/icons/selector2.svg'),
  [AchievementBadgeIcon.eSelector3]: require('../../../../assets/images/achievements/icons/selector3.svg'),
  [AchievementBadgeIcon.eSelector4]: require('../../../../assets/images/achievements/icons/selector4.svg'),
  [AchievementBadgeIcon.eSelector5]: require('../../../../assets/images/achievements/icons/selector5.svg'),
  [AchievementBadgeIcon.eSettingsOpened]: require('../../../../assets/images/achievements/icons/settingsOpened.svg'),
  [AchievementBadgeIcon.eSpeedySelectionsStreak]: require('../../../../assets/images/achievements/icons/speedySelectionsStreak.svg'),
  [AchievementBadgeIcon.eSponsors]: require('../../../../assets/images/achievements/icons/sponsors.svg'),
  [AchievementBadgeIcon.eTutorialViewed]: require('../../../../assets/images/achievements/icons/tutorialViewed.svg'),
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

  // Animate the sorting, addition, and removal of achievements.
  const [animatedInProgressList] = useAutoAnimate({ duration: 200 });
  const [animatedCompletedList] = useAutoAnimate({ duration: 200 });

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
      onClose={() => {
        setAchievementsDialogVisible(false);
        window.settingsAPI.markAchievementsAsViewed();
      }}>
      <div className={classes.levelContainer}>
        <img height={256} src={LEVEL_BADGES[levelProgress.level - 1]} width={256} />
        <div className={classes.levelText}>
          {levelProgress.maxXp === Infinity
            ? `${levelProgress.xp} ${i18next.t('settings.achievements-dialog.xp')}`
            : `${levelProgress.xp} / ${levelProgress.maxXp} ${i18next.t('settings.achievements-dialog.xp')}`}
        </div>
        <ProgressBar
          barStyle="big"
          value={(levelProgress.xp / levelProgress.maxXp) * 100}
        />
      </div>
      <div className={classes.achievementContainer}>
        <div className={cx({ achievementSlider: true, showCompleted })}>
          <div className={classes.achievementListWrapper}>
            <Scrollbox maxHeight="min(40vh, 500px)" paddingRight={8}>
              <div ref={animatedInProgressList} className={classes.achievementList}>
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
                        <div className={classes.achievementStat}>
                          {achievement.xp} {i18next.t('settings.achievements-dialog.xp')}
                        </div>
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
            <Scrollbox maxHeight="min(40vh, 500px)">
              <div
                ref={animatedCompletedList}
                className={cx({ achievementList: true, completed: true })}>
                {levelProgress.completedAchievements.map((achievement, i) => (
                  <div
                    key={achievement.id}
                    className={cx({
                      achievement: true,
                      new: i < levelProgress.newAchievementsCount,
                    })}>
                    <div className={classes.achievementBadge}>
                      <img src={ACHIEVEMENT_BADGES[achievement.badge]} />
                      <img src={ACHIEVEMENT_ICONS[achievement.icon]} />
                      <img src={ACHIEVEMENT_BADGE_GLOSS} />
                    </div>
                    <div className={classes.achievementData}>
                      <div className={classes.row}>
                        <div className={classes.achievementName}>{achievement.name}</div>
                        <div className={classes.achievementStat}>
                          {achievement.xp} {i18next.t('settings.achievements-dialog.xp')}
                        </div>
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
            onClick={() => {
              setShowCompleted(false);
              window.settingsAPI.markAchievementsAsViewed();
            }}
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
            onClick={() => setShowCompleted(true)}
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

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import i18next from 'i18next';

import {
  AchievementStats,
  AchievementStatsNumberKeys,
  Achievement,
  AchievementState,
  LevelProgress,
  AchievementBadgeIcon,
  AchievementBadgeType,
  ACHIEVEMENT_STATS_SCHEMA,
  GeneralSettings,
  SelectionSource,
} from '../../common';
import { Settings } from '../settings';
import { getAchievementStats } from './achievement-stats';

/**
 * The constants below are the main balancing tools. These can be tweaked in order to
 * control the levelling speed.
 *
 * This is the amount of experience required to advance to the next level.
 */
const LEVEL_XP = [500, 750, 1000, 1500, 2000, 3500, 5000, 7500, 10000, Infinity];

/**
 * Most achievements have five tiers. The experience gained for each tier is defined in
 * this array. Some achievements use multipliers, so it's a good idea to use numbers which
 * are divisible by 10.
 */
const BASE_XP = [100, 250, 500, 750, 1000];

/**
 * Most achievements have five tiers. The amount of whatever is required to complete the
 * achievement is usually based on the values below. So tier 1 will be unlocked at
 * BASE_RANGES[0] and completed at BASE_RANGES[1], tier 2 will then be completed at
 * BASE_RANGES[2] and so on. Some achievements use multipliers, so it's a good idea to use
 * numbers which are divisible by 10.
 */
const BASE_RANGES = [0, 10, 30, 100, 300, 1000];

/**
 * There's a set of achievements which are triggered when a certain number of selections
 * was made at a certain depth within a certain time limit. The time limits for each depth
 * and tier are defined in the array below.
 */
const SELECTION_TIME_LIMITS = [
  [1000, 750, 500, 250, 150],
  [2000, 1000, 750, 500, 250],
  [3000, 2000, 1000, 750, 500],
];

/**
 * This class can be instantiated to track the progress of all achievements. Once
 * constructed, you can use getAchievements() to retrieve a map of all available
 * achievements.
 *
 * There are some public methods to get the current level, experience and individual
 * achievement progress.
 *
 * The following events are emitted:
 *
 * - 'progress-changed': This is called whenever the experience progress changed.
 * - 'completed': This is called whenever an achievement is completed. The Achievement
 *   object is passed as an argument.
 */
export class AchievementTracker extends EventEmitter {
  /** This will contain the accumulated experience gained by all completed achievements. */
  private totalXP = 0;

  /** The current level in the range [1...10]. */
  public currentLevel = 1;

  /** The list of all available achievements. */
  private achievements: Array<Achievement>;

  /** The settings object containing the achievement statistics. */
  private stats: Settings<AchievementStats>;

  constructor(private generalSettings: Settings<GeneralSettings>) {
    super();

    // Store a reference to the settings object containing the achievement statistics.
    this.stats = getAchievementStats();

    // Create our main achievements map.
    this.achievements = this.createAchievements();

    // Now initialize the state and progress of each achievement based on the statistics.
    this.achievements.forEach((achievement) => {
      this.updateAchievement(achievement);
    });

    // Compute our initial experience and level.
    this.updateExperience();

    // If any of the statistics change, we have to update the corresponding achievements.
    this.stats.onAnyChange((_old, _new, changedKeys) => {
      let anyProgressChanged = false;
      let anyStateChanged = false;

      // First update all relevant achievements.
      this.achievements.forEach((achievement) => {
        if (changedKeys.includes(achievement.statKey)) {
          const oldValue = achievement.statValue;
          const oldState = achievement.state;

          this.updateAchievement(achievement);

          if (achievement.statValue != oldValue) {
            anyProgressChanged = true;
          }
          if (achievement.state != oldState) {
            anyStateChanged = true;

            // If the achievement is now completed, we emit the completed signal.
            if (achievement.state == AchievementState.eCompleted) {
              this.emit('completed', achievement);
            }
          }
        }
      });

      // If any achievement state changed, we have to recompute our total experience. We
      // also update the list of unlocked achievement dates in this case.
      if (anyStateChanged) {
        this.updateExperience();

        const dates: Record<string, string> = {};
        this.achievements.forEach((achievement) => {
          if (achievement.state == AchievementState.eCompleted) {
            dates[achievement.id] = achievement.date;
          }
        });
        this.stats.set({ achievementDates: dates }, false);
      }

      // If the lastViewed statistic changed, we also consider this a progress change,
      // since the progress returns also the number of new achievements.
      if (!anyProgressChanged && changedKeys.includes('lastViewed')) {
        anyProgressChanged = true;
      }

      // Finally, emit the progress-changed signal if necessary.
      if (anyProgressChanged || anyStateChanged) {
        this.emit('progress-changed');
      }
    });
  }

  /** Retrieves the current progress of all achievements. */
  public getProgress(): LevelProgress {
    // Compile a list of all active achievements sorted by their current progress.
    const activeAchievements = Array.from(this.achievements.values())
      .filter((a) => a.state === AchievementState.eActive)
      .sort((a, b) => {
        const aProgress = a.statValue / a.statRange[1];
        const bProgress = b.statValue / b.statRange[1];
        return bProgress - aProgress;
      });

    // Compile a list of all completed achievements sorted by completion date.
    const completedAchievements = Array.from(this.achievements.values())
      .filter((a) => a.state === AchievementState.eCompleted)
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    // Get the experience points indicating the progress of the current level. This is
    // computed by the total XP minus the XP required to unlock each of the previous
    // levels.
    let xp = this.totalXP;
    for (let i = 0; i < this.currentLevel - 1; i++) {
      xp -= LEVEL_XP[i];
    }

    // Count the number of new achievements.
    let newAchievementsCount = 0;
    const lastViewed = this.stats.get('lastViewed') || new Date(0).toISOString();

    while (
      completedAchievements.length > newAchievementsCount &&
      completedAchievements[newAchievementsCount].date > lastViewed
    ) {
      newAchievementsCount++;
    }

    return {
      level: this.currentLevel,
      xp,
      maxXp: LEVEL_XP[this.currentLevel - 1],
      activeAchievements,
      completedAchievements,
      newAchievementsCount,
    };
  }

  /** Resets the level progress and achievements. */
  public resetProgress() {
    this.stats.set(ACHIEVEMENT_STATS_SCHEMA.parse({}));
  }

  /** Should be called when the achievements are viewed by the user. */
  public onAchievementsViewed() {
    this.stats.set({ lastViewed: new Date().toISOString() });
  }

  /**
   * Should be called when a selection is made. Depending on the speed and depth,
   * different stats are incremented.
   *
   * @param depth The depth at which the selection was made (1, 2, or 3). For deeper
   *   selections, it should be clamped to 3.
   * @param time The time in milliseconds it took to make the selection.
   * @param source The source used to make the selection.
   */
  public onSelectionMade(depth: 1 | 2 | 3, time: number, source: SelectionSource) {
    const keys: AchievementStatsNumberKeys[] = [];

    // Increment the source-based selection stats.
    keys.push(`${source}Selections`);

    // Increment the time-based selection stats.
    let tier = 0;
    for (; tier < 5; tier++) {
      if (time <= SELECTION_TIME_LIMITS[depth - 1][tier]) {
        keys.push(
          `selectionsSpeed${tier + 1}Depth${depth}` as AchievementStatsNumberKeys
        );
      }
    }

    // With this stat, all selections are counted.
    keys.push('selections');

    this.incrementStats(keys);
  }

  /** Adds one to the given statistic. */
  public incrementStat(key: AchievementStatsNumberKeys) {
    if (this.generalSettings.get('enableAchievements')) {
      this.stats.set({ [key]: ((this.stats.get(key) as number) || 0) + 1 });
    }
  }

  /**
   * Use this to increment multiple statistics at once. Prefer this over multiple calls to
   * incrementStat.
   */
  public incrementStats(keys: AchievementStatsNumberKeys[]) {
    if (this.generalSettings.get('enableAchievements')) {
      const updates: Partial<AchievementStats> = {};
      keys.forEach((key) => {
        updates[key] = ((this.stats.get(key) as number) || 0) + 1;
      });
      this.stats.set(updates);
    }
  }

  /**
   * This computes the current level and total experience by iterating through all
   * achievements and accumulating the experience of the completed ones.
   */
  private updateExperience() {
    // Accumulate XP of completed achievements.
    this.totalXP = 0;
    this.achievements.forEach((achievement) => {
      if (achievement.state == AchievementState.eCompleted) {
        this.totalXP += achievement.xp;
      }
    });

    // Compute the current level based on the total XP.
    this.currentLevel = 1;
    let levelXP = LEVEL_XP[0];
    while (this.totalXP >= levelXP && this.currentLevel < LEVEL_XP.length) {
      levelXP += LEVEL_XP[this.currentLevel];
      ++this.currentLevel;
    }
  }

  /**
   * Updates the state and progress of a specific achievement.
   *
   * @param achievement The achievement to update.
   * @returns True if the progress changed, false otherwise.
   */
  private updateAchievement(achievement: Achievement) {
    // Retrieve the achievement's statistics value.
    const statValue = this.stats.get(achievement.statKey) as number;

    // First compute the state based on the value range of the achievement.
    let newState = AchievementState.eActive;
    if (statValue >= achievement.statRange[1]) {
      newState = AchievementState.eCompleted;
    } else if (statValue < achievement.statRange[0] || achievement.hidden) {
      newState = AchievementState.eLocked;
    }

    // If the state changed, we may have to emit some signals.
    if (newState != achievement.state) {
      achievement.state = newState;

      // Get all current achievement dates to initialize the achievement's date.
      const dates = this.stats.get('achievementDates');

      // If the achievement changed from or to the eCompleted state, we have to update the
      // settings value storing all the timestamps for completing achievements.
      if (newState == AchievementState.eCompleted) {
        // Create or store the completion timestamp.
        if (achievement.id in dates) {
          achievement.date = dates[achievement.id];
        } else {
          achievement.date = new Date().toISOString();
        }

        // If the completed achievement is supposed to reveal another hidden achievement,
        // we do this now.
        if (achievement.reveals) {
          const revealedAchievement = this.achievements.find(
            (a) => a.id === achievement.reveals
          );
          if (revealedAchievement) {
            revealedAchievement.hidden = false;
            this.updateAchievement(revealedAchievement);
          }
        }
      } else {
        // Delete the completion timestamp if the achievement got 'uncompleted'.
        achievement.date = '';

        // Also hide any achievements we may have revealed before.
        if (achievement.reveals) {
          const revealedAchievement = this.achievements.find(
            (a) => a.id === achievement.reveals
          );
          if (revealedAchievement) {
            revealedAchievement.hidden = true;
            this.updateAchievement(revealedAchievement);
          }
        }
      }
    }

    // Now we update the progress of the achievement. This is a value clamped to the
    // minimum and maximum value range of the achievement.
    achievement.statValue = Math.min(
      Math.max(statValue, achievement.statRange[0]),
      achievement.statRange[1]
    );
  }

  /**
   * Creates all available achievements.
   *
   * @returns A map of achievement IDs to achievement objects.
   */
  private createAchievements() {
    const attributes = [
      i18next.t('achievements.attributes.novice'),
      i18next.t('achievements.attributes.capable'),
      i18next.t('achievements.attributes.skilled'),
      i18next.t('achievements.attributes.expert'),
      i18next.t('achievements.attributes.master'),
    ];

    const numbers = [
      i18next.t('achievements.tier.I'),
      i18next.t('achievements.tier.II'),
      i18next.t('achievements.tier.III'),
      i18next.t('achievements.tier.IV'),
      i18next.t('achievements.tier.V'),
    ];

    const standardBadges = [
      AchievementBadgeType.eCopper,
      AchievementBadgeType.eBronze,
      AchievementBadgeType.eSilver,
      AchievementBadgeType.eGold,
      AchievementBadgeType.ePlatinum,
    ];

    const achievements = new Array<Achievement>();

    const addAchievement = (partial: Partial<Achievement>) => {
      const achievement = {
        hidden: false,
        state: AchievementState.eLocked,
        statValue: 0,
        date: '',
        ...partial,
      } as Achievement;
      achievements.push(achievement);
    };

    // Add the five tiers of the cancel-many-selections achievements.
    let icons = [
      AchievementBadgeIcon.eCancelor1,
      AchievementBadgeIcon.eCancelor2,
      AchievementBadgeIcon.eCancelor3,
      AchievementBadgeIcon.eCancelor4,
      AchievementBadgeIcon.eCancelor5,
    ];

    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'cancelor' + tier,
        name: i18next.t('achievements.cancelor.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.cancelor.description', {
          n: BASE_RANGES[tier + 1] * 2,
        }),
        badge: standardBadges[tier],
        icon: icons[tier],
        statKey: 'cancels',
        statRange: [BASE_RANGES[tier] * 2, BASE_RANGES[tier + 1] * 2],
        xp: BASE_XP[tier],
      });
    }

    // Add the five tiers of the select-many-items achievements.
    icons = [
      AchievementBadgeIcon.eSelector1,
      AchievementBadgeIcon.eSelector2,
      AchievementBadgeIcon.eSelector3,
      AchievementBadgeIcon.eSelector4,
      AchievementBadgeIcon.eSelector5,
    ];

    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'selector' + tier,
        name: i18next.t('achievements.selector.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.selector.description', {
          n: BASE_RANGES[tier + 1] * 20,
        }),
        badge: standardBadges[tier],
        icon: icons[tier],
        statKey: 'selections',
        statRange: [BASE_RANGES[tier] * 20, BASE_RANGES[tier + 1] * 20],
        xp: BASE_XP[tier] * 2,
      });
    }

    // Add the fifteen tiers of the time-based selection achievements.
    icons = [
      AchievementBadgeIcon.eDepthSelector1,
      AchievementBadgeIcon.eDepthSelector2,
      AchievementBadgeIcon.eDepthSelector3,
    ];

    for (let depth = 1; depth <= 3; depth++) {
      for (let tier = 0; tier < 5; tier++) {
        const names = [
          i18next.t('achievements.depth-selector.name1', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.depth-selector.name2', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.depth-selector.name3', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
        ];

        addAchievement({
          id: `depth${depth}-selector${tier}`,
          name: names[depth - 1],
          description: i18next.t('achievements.depth-selector.description', {
            n: BASE_RANGES[tier + 1] * 2,
            depth,
            time: SELECTION_TIME_LIMITS[depth - 1][tier],
          }),
          badge: standardBadges[tier],
          icon: icons[depth - 1],
          state: AchievementState.eLocked,
          statKey: `selectionsSpeed${tier + 1}Depth${depth}` as keyof AchievementStats,
          statRange: [0, BASE_RANGES[tier + 1] * 2],
          xp: BASE_XP[tier],
          hidden: tier > 0,
          reveals: tier < 5 ? `depth${depth}-selector${tier + 1}` : null,
        });
      }
    }

    // Add the five tiers of the mouse-click-selections achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'click-selector' + tier,
        name: i18next.t('achievements.click-selector.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.click-selector.description', {
          n: BASE_RANGES[tier + 1] * 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eClickSelector,
        statKey: 'clickSelections',
        statRange: [BASE_RANGES[tier] * 5, BASE_RANGES[tier + 1] * 5],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the five tiers of the keyboard-selections achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'keyboard-selector' + tier,
        name: i18next.t('achievements.keyboard-selector.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.keyboard-selector.description', {
          n: BASE_RANGES[tier + 1] * 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eKeyboardSelector,
        statKey: 'keyboardSelections',
        statRange: [BASE_RANGES[tier] * 5, BASE_RANGES[tier + 1] * 5],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the five tiers of the gamepad-selections achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'gamepad-selector' + tier,
        name: i18next.t('achievements.gamepad-selector.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.gamepad-selector.description', {
          n: BASE_RANGES[tier + 1] * 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eGamepadSelector,
        statKey: 'gamepadSelections',
        statRange: [BASE_RANGES[tier] * 5, BASE_RANGES[tier + 1] * 5],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the five tiers of the marking-mode-selections achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'gesture-selector' + tier,
        name: i18next.t('achievements.gesture-selector.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.gesture-selector.description', {
          n: BASE_RANGES[tier + 1] * 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eGestureSelector,
        statKey: 'gestureSelections',
        statRange: [BASE_RANGES[tier] * 5, BASE_RANGES[tier + 1] * 5],
        xp: BASE_XP[tier],
      });
    }

    // Add the five tiers of the settings-opened achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'settings-opened' + tier,
        name: i18next.t('achievements.settings-opened.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.settings-opened.description', {
          n: BASE_RANGES[tier + 1] / 2,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eSettingsOpened,
        statKey: 'settingsOpened',
        statRange: [BASE_RANGES[tier] / 2, BASE_RANGES[tier + 1] / 2],
        xp: BASE_XP[tier],
      });
    }

    // Add the five tiers of the backup settings achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'backed-up' + tier,
        name: i18next.t('achievements.backup.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.backup.description', {
          n: BASE_RANGES[tier + 1] / 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eBackedUp,
        statKey: 'settingsBackedUp',
        statRange: [BASE_RANGES[tier] / 5, BASE_RANGES[tier + 1] / 5],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the five tiers of the restore settings achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'restored' + tier,
        name: i18next.t('achievements.restore.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.restore.description', {
          n: BASE_RANGES[tier + 1] / 5,
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eRestored,
        statKey: 'settingsRestored',
        statRange: [BASE_RANGES[tier] / 5, BASE_RANGES[tier + 1] / 5],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the five tiers of the create-many-items-in-menus achievements.
    for (let tier = 0; tier < 5; tier++) {
      addAchievement({
        id: 'added-items' + tier,
        name: i18next.t('achievements.added-items.name', {
          attribute: attributes[tier],
          tier: numbers[tier],
        }),
        description: i18next.t('achievements.added-items.description', {
          n: BASE_RANGES[tier + 1],
        }),
        badge: standardBadges[tier],
        icon: AchievementBadgeIcon.eAddedItems,
        statKey: 'addedItems',
        statRange: [BASE_RANGES[tier], BASE_RANGES[tier + 1]],
        xp: BASE_XP[tier] / 2,
      });
    }

    // Add the delete-all-menus achievement.
    addAchievement({
      id: 'deleted-all-menus',
      name: i18next.t('achievements.deleted-all-menus.name'),
      description: i18next.t('achievements.deleted-all-menus.description'),
      badge: AchievementBadgeType.eSpecial2,
      icon: AchievementBadgeIcon.eDeletedAllMenus,
      statKey: 'deletedAllMenus',
      statRange: [0, 1],
      xp: BASE_XP[1],
      hidden: true,
    });

    // Add the full-menu achievement.
    addAchievement({
      id: 'full-menu',
      name: i18next.t('achievements.full-menu.name'),
      description: i18next.t('achievements.full-menu.description'),
      badge: AchievementBadgeType.eSpecial3,
      icon: AchievementBadgeIcon.eFullMenu,
      statKey: 'addedItemsToFullMenu',
      statRange: [0, 1],
      xp: BASE_XP[1],
      hidden: true,
    });

    // Add the deep-menu achievement.
    addAchievement({
      id: 'deep-menu',
      name: i18next.t('achievements.deep-menu.name'),
      description: i18next.t('achievements.deep-menu.description'),
      badge: AchievementBadgeType.eSpecial3,
      icon: AchievementBadgeIcon.eDeepMenu,
      statKey: 'addedItemsToDeepMenu',
      statRange: [0, 1],
      xp: BASE_XP[1],
      hidden: true,
    });

    // Add the click-on-sponsor achievement.
    addAchievement({
      id: 'sponsors-viewed',
      name: i18next.t('achievements.sponsors-viewed.name'),
      description: i18next.t('achievements.sponsors-viewed.description'),
      badge: AchievementBadgeType.eSpecial4,
      icon: AchievementBadgeIcon.eSponsors,
      statKey: 'sponsorsViewed',
      statRange: [0, 1],
      xp: BASE_XP[2],
      hidden: true,
    });

    // Add the select-menu-theme achievement.
    addAchievement({
      id: 'menu-themes-selected',
      name: i18next.t('achievements.menu-themes-selected.name'),
      description: i18next.t('achievements.menu-themes-selected.description', {
        n: 25,
      }),
      badge: AchievementBadgeType.eSpecial5,
      icon: AchievementBadgeIcon.eMenuThemesSelected,
      statKey: 'menuThemesSelected',
      statRange: [0, 25],
      xp: BASE_XP[1],
      hidden: true,
    });

    // Add the tutorial-viewed achievement.
    addAchievement({
      id: 'tutorial-viewed',
      name: i18next.t('achievements.tutorial-viewed.name'),
      description: i18next.t('achievements.tutorial-viewed.description'),
      badge: AchievementBadgeType.eSpecial1,
      icon: AchievementBadgeIcon.eTutorialViewed,
      statKey: 'tutorialViewed',
      statRange: [0, 1],
      xp: BASE_XP[1],
      hidden: true,
    });

    return achievements;
  }
}

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
  Achievement,
  AchievementState,
  LevelProgress,
} from '../../common';
import { Settings } from '../settings';
import { getAchievementStats } from './achievement-stats';

/** The meta information for a specific achievement. */
type AchievementMeta = {
  /** The settings key this achievement is tracking. */
  statKey: keyof AchievementStats;

  /** A value for the statKey value for which this achievement is active. */
  statRange: [number, number];

  /** The amount of experience gained by completion. */
  xp: number;

  /** If set, it's not shown in the UI until revealed by another achievement. */
  hidden: boolean;

  /** The ID of a hidden achievement. */
  reveals?: string;
};

/**
 * The structure of an achievement in the achievement tracker. The 'common' part is
 * visible outside of the achievement tracker, the 'meta' part is only used internally.
 */
type AchievementDescription = {
  common: Achievement;
  meta: AchievementMeta;
};

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
  private achievements: Map<string, AchievementDescription>;

  /** The settings object containing the achievement statistics. */
  private stats: Settings<AchievementStats>;

  constructor() {
    super();

    // Store a reference to the settings object containing the achievement statistics.
    this.stats = getAchievementStats();

    // Create our main achievements map.
    this.achievements = this.createAchievements();

    // Now initialize the state and progress of each achievement based on the statistics.
    this.achievements.forEach((achievement, id) => {
      this.updateAchievement(achievement, id);
    });

    // Compute our initial experience and level.
    this.updateExperience();

    // If any of the statistics change, we have to update the corresponding achievements.
    this.stats.onAnyChange((_old, _new, changedKeys) => {
      let anyProgressChanged = false;
      let anyStateChanged = false;

      // First update all relevant achievements.
      this.achievements.forEach((achievement, id) => {
        if (changedKeys.includes(achievement.meta.statKey)) {
          const oldProgress = achievement.common.progress;
          const oldState = achievement.common.state;

          this.updateAchievement(achievement, id);

          if (achievement.common.progress != oldProgress) {
            anyProgressChanged = true;
          }
          if (achievement.common.state != oldState) {
            anyStateChanged = true;

            // If the achievement is now completed, we emit the completed signal.
            if (achievement.common.state == AchievementState.eCompleted) {
              this.emit('completed', achievement.common);
            }
          }
        }
      });

      // If any achievement state changed, we have to recompute our total experience. We
      // also update the list of unlocked achievement dates in this case.
      if (anyStateChanged) {
        this.updateExperience();

        const dates: Record<string, string> = {};
        this.achievements.forEach((achievement, id) => {
          if (achievement.common.state == AchievementState.eCompleted) {
            dates[id] = achievement.common.date;
          }
        });
        this.stats.set({ achievementDates: dates }, false);
      }

      // Finally, emit the progress-changed signal if necessary.
      if (anyProgressChanged || anyStateChanged) {
        this.emit('progress-changed');
      }
    });
  }

  /** Retrieves the current progress of all achievements. */
  public getProgress(): LevelProgress {
    const activeAchievements = Array.from(this.achievements.values())
      .filter((a) => a.common.state === AchievementState.eActive)
      .map((a) => a.common);
    const completedAchievements = Array.from(this.achievements.values())
      .filter((a) => a.common.state === AchievementState.eCompleted)
      .map((a) => a.common);

    // Get the experience points indicating the progress of the current level. This is
    // computed by the total XP minus the XP required to unlock each of the previous
    // levels.
    let xp = this.totalXP;
    for (let i = 0; i < this.currentLevel - 1; i++) {
      xp -= LEVEL_XP[i];
    }

    return {
      level: this.currentLevel,
      xp,
      maxXp: LEVEL_XP[this.currentLevel - 1],
      activeAchievements,
      completedAchievements,
    };
  }

  /** Should be called when the settings are opened. */
  public onSettingsOpened() {
    this.incrementStat('settingsOpened');
  }

  /** Adds one to the given statistic. */
  private incrementStat(key: keyof AchievementStats) {
    this.stats.set({ [key]: ((this.stats.get(key) as number) || 0) + 1 });
  }

  /**
   * This computes the current level and total experience by iterating through all
   * achievements and accumulating the experience of the completed ones.
   */
  private updateExperience() {
    // Accumulate XP of completed achievements.
    this.totalXP = 0;
    this.achievements.forEach((achievement) => {
      if (achievement.common.state == AchievementState.eCompleted) {
        this.totalXP += achievement.meta.xp;
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
   * @param id The ID of the achievement. This is the key in the achievements map.
   * @returns True if the progress changed, false otherwise.
   */
  private updateAchievement(achievement: AchievementDescription, id: string) {
    // Retrieve the achievement's statistics value.
    const statValue = this.stats.get(achievement.meta.statKey) as number;

    // First compute the state based on the value range of the achievement.
    let newState = AchievementState.eActive;
    if (statValue >= achievement.meta.statRange[1]) {
      newState = AchievementState.eCompleted;
    } else if (statValue < achievement.meta.statRange[0] || achievement.meta.hidden) {
      newState = AchievementState.eLocked;
    }

    // If the state changed, we may have to emit some signals.
    if (newState != achievement.common.state) {
      achievement.common.state = newState;

      // Get all current achievement dates to initialize the achievement's date.
      const dates = this.stats.get('achievementDates');

      // If the achievement changed from or to the eCompleted state, we have to update the
      // settings value storing all the timestamps for completing achievements.
      if (newState == AchievementState.eCompleted) {
        // Create or store the completion timestamp.
        if (id in dates) {
          achievement.common.date = dates[id];
        } else {
          achievement.common.date = new Date().toISOString();
        }

        // If the completed achievement is supposed to reveal another hidden achievement,
        // we do this now.
        if (achievement.meta.reveals && this.achievements.has(achievement.meta.reveals)) {
          const revealedAchievement = this.achievements.get(achievement.meta.reveals);
          revealedAchievement.meta.hidden = false;
          this.updateAchievement(revealedAchievement, achievement.meta.reveals);
        }
      } else {
        // Delete the completion timestamp if the achievement got 'uncompleted'.
        achievement.common.date = '';

        // Also hide any achievements we may have revealed before.
        if (achievement.meta.reveals && this.achievements.has(achievement.meta.reveals)) {
          const revealedAchievement = this.achievements.get(achievement.meta.reveals);
          revealedAchievement.meta.hidden = true;
          this.updateAchievement(revealedAchievement, achievement.meta.reveals);
        }
      }
    }

    // Now we update the progress of the achievement. This is a value clamped to the
    // minimum and maximum value range of the achievement.
    achievement.common.progress = Math.min(
      Math.max(
        (statValue - achievement.meta.statRange[0]) /
          (achievement.meta.statRange[1] - achievement.meta.statRange[0]),
        0.0
      ),
      1.0
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

    // These are the icon background images used by the five tiers.
    const bgImages = [
      'copper.png',
      'bronze.png',
      'silver.png',
      'gold.png',
      'platinum.png',
    ];

    const achievements = new Map<string, AchievementDescription>();

    // Helper function to create the common part of an achievement.
    const getCommonHelper = (
      name: string,
      description: string,
      badge: string,
      icon: string
    ) => {
      return {
        name,
        description,
        badge,
        icon,
        date: '',
        progress: 0,
        state: AchievementState.eLocked,
      };
    };

    // Helper function to create the meta part of an achievement.
    const getMetaHelper = (
      statKey: keyof AchievementStats,
      tier: number,
      statMultiplier: number = 1,
      xpMultiplier: number = 1
    ): AchievementMeta => {
      return {
        statKey: statKey,
        statRange: [
          BASE_RANGES[tier] * statMultiplier,
          BASE_RANGES[tier + 1] * statMultiplier,
        ],
        xp: BASE_XP[tier] * xpMultiplier,
        hidden: false,
      };
    };

    // Add the five tiers of the cancel-many-selections achievements.
    for (let tier = 0; tier < 5; tier++) {
      achievements.set('cancelor' + tier, {
        common: getCommonHelper(
          i18next.t('achievements.cancelor.name', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.cancelor.description', {
            n: BASE_RANGES[tier + 1] * 2,
          }),
          bgImages[tier],
          'cancel.svg'
        ),
        meta: getMetaHelper('cancels', tier, 2),
      });
    }

    // Add the five tiers of the select-many-items achievements.
    for (let tier = 0; tier < 5; tier++) {
      achievements.set('pielot' + tier, {
        common: getCommonHelper(
          i18next.t('achievements.pielot.name', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.pielot.description', {
            n: BASE_RANGES[tier + 1] * 5,
          }),
          bgImages[tier],
          `award${tier}.svg`
        ),
        meta: getMetaHelper('selections', tier, 5, 2),
      });
    }

    // Add the 15 achievements for selecting many things at different depths in marking
    // mode.
    for (let depth = 1; depth <= 3; depth++) {
      for (let tier = 0; tier < 5; tier++) {
        const names = [
          i18next.t('achievements.gesture-selector.name1', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.gesture-selector.name2', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.gesture-selector.name3', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
        ];

        const keys: Array<keyof AchievementStats> = [
          'gestureSelectionsDepth1',
          'gestureSelectionsDepth2',
          'gestureSelectionsDepth3',
        ];

        achievements.set(`depth${depth}-gesture-selector${tier}`, {
          common: getCommonHelper(
            names[depth - 1],
            i18next.t('achievements.gesture-selector.description', {
              n: BASE_RANGES[tier + 1] * 2,
              depth,
            }),
            bgImages[tier],
            `gesture${depth}.svg`
          ),
          meta: getMetaHelper(keys[depth - 1], tier, 2),
        });
      }
    }

    // Add the 15 achievements for selecting many things at different depths with
    // mouse clicks.
    for (let depth = 1; depth <= 3; depth++) {
      for (let tier = 0; tier < 5; tier++) {
        const names = [
          i18next.t('achievements.click-selector.name1', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.click-selector.name2', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.click-selector.name3', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
        ];

        const keys: Array<keyof AchievementStats> = [
          'clickSelectionsDepth1',
          'clickSelectionsDepth2',
          'clickSelectionsDepth3',
        ];

        achievements.set(`depth${depth}-click-selector${tier}`, {
          common: getCommonHelper(
            names[depth - 1],
            i18next.t('achievements.click-selector.description', {
              n: BASE_RANGES[tier + 1] * 2,
              depth,
            }),
            bgImages[tier],
            `click${depth}.svg`
          ),
          meta: getMetaHelper(keys[depth - 1], tier, 2),
        });
      }
    }

    for (let depth = 1; depth <= 3; depth++) {
      for (let tier = 0; tier < 5; tier++) {
        const timeLimits = [
          [1000, 750, 500, 250, 150],
          [2000, 1000, 750, 500, 250],
          [3000, 2000, 1000, 750, 500],
        ];

        const counts = [50, 100, 150, 200, 250];

        const names = [
          i18next.t('achievements.time-selector.name1', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.time-selector.name2', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.time-selector.name3', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
        ];

        const keys: Array<keyof AchievementStats> = [
          'selections1000msDepth1',
          'selections750msDepth1',
          'selections500msDepth1',
          'selections250msDepth1',
          'selections150msDepth1',
          'selections2000msDepth2',
          'selections1000msDepth2',
          'selections750msDepth2',
          'selections500msDepth2',
          'selections250msDepth2',
          'selections3000msDepth3',
          'selections2000msDepth3',
          'selections1000msDepth3',
          'selections750msDepth3',
          'selections500msDepth3',
        ];

        achievements.set(`depth${depth}-selector${tier}`, {
          common: getCommonHelper(
            names[depth - 1],
            i18next.t('achievements.time-selector.description', {
              n: counts[tier],
              depth,
              time: timeLimits[depth - 1][tier],
            }),
            bgImages[tier],
            `timer.svg`
          ),
          meta: {
            statKey: keys[(depth - 1) * 5 + tier],
            xp: BASE_XP[tier],
            statRange: [0, counts[tier]],
            hidden: tier > 0,
            reveals: tier < 5 ? `depth${depth}-selector${tier + 1}` : null,
          },
        });
      }
    }

    // Add the five tiers of the settings-opened achievements.
    for (let tier = 0; tier < 5; tier++) {
      achievements.set('journey' + tier, {
        common: getCommonHelper(
          i18next.t('achievements.journey.name', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.journey.description', {
            n: BASE_RANGES[tier + 1] / 2,
          }),
          bgImages[tier],
          'gear.svg'
        ),
        meta: getMetaHelper('settingsOpened', tier, 0.5),
      });
    }

    // Add the five tiers of the create-many-items-in-menus achievements.
    for (let tier = 0; tier < 5; tier++) {
      achievements.set('manyitems' + tier, {
        common: getCommonHelper(
          i18next.t('achievements.manyitems.name', {
            attribute: attributes[tier],
            tier: numbers[tier],
          }),
          i18next.t('achievements.manyitems.description', {
            n: BASE_RANGES[tier + 1] / 2,
          }),
          bgImages[tier],
          'dots.svg'
        ),
        meta: getMetaHelper('addedItems', tier, 0.5),
      });
    }

    // Add the delete-all-menus achievement.
    achievements.set('goodpie', {
      common: getCommonHelper(
        i18next.t('achievements.goodpie.name'),
        i18next.t('achievements.goodpie.description'),
        'special2.png',
        'fire.svg'
      ),
      meta: {
        statKey: 'deletedAllMenus',
        xp: BASE_XP[2],
        statRange: [0, 1],
        hidden: true,
      },
    });

    // Add the click-on-sponsor achievement.
    achievements.set('sponsors', {
      common: getCommonHelper(
        i18next.t('achievements.sponsors.name'),
        i18next.t('achievements.sponsors.description'),
        'special3.png',
        'heart.svg'
      ),
      meta: {
        statKey: 'sponsorsViewed',
        xp: BASE_XP[1],
        statRange: [0, 1],
        hidden: true,
      },
    });

    return achievements;
  }
}

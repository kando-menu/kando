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

import { AchievementStats } from '../../common';
import { Settings } from '../settings';
import { getAchievementStats } from './achievement-stats';

/**
 * Each achievement can have one of three states. If it's 'locked', it will not be shown
 * in the user interface. Once some specific requirements are fulfilled, it will become
 * 'active' and eventually 'completed'.
 */
export enum State {
  eLocked = 0,
  eActive = 1,
  eCompleted = 2,
}

export class Achievement {
  /**
   * The name. Most achievements have multiple tiers. A {{tier}} in the name will be
   * replaced by a corresponding roman number (e.g. I, II, III, IV or V), {{attribute}} by
   * a corresponding attribute like 'Novice' or 'Master'.
   */
  name: string;

  /** The explanation string. */
  description: string;

  /** A number between range[0] and range[1]. */
  progress: number;

  /** One of the State values above. */
  state: State;

  /** Something like 'copper.png'. */
  bgImage: string;

  /** Something like 'depth1.svg'. */
  fgImage: string;

  /** The settings key this achievement is tracking. */
  statsKey: keyof AchievementStats;

  /** The amount of experience gained by completion. */
  xp: number;

  /** A value for the statsKey value for which this achievement is active. */
  range: [number, number];

  /** If set, it's not shown in the UI until revealed by another achievement. */
  hidden: boolean;

  /** The ID of a hidden achievement. */
  reveals?: string;
}

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
 * - 'level-changed': This is called whenever the users levels up (or down...). The
 *   parameter provides the new level.
 * - 'experience-changed': This is usually called whenever an achievement is completed. The
 *   first parameter contains the current experience points; the second contains the total
 *   experience points required to level up.
 * - 'progress-changed': This is called whenever the progress of an active achievement
 *   changes. The passed string is the key of the achievement in the getAchievements() map
 *   of this; the second and third parameter are the new progress and maximum progress.
 * - 'completed': This is called whenever an achievement is completed. The passed string is
 *   the key of the completed achievement in the getAchievements() map.
 * - 'unlocked': This is called whenever a new achievement becomes available. The passed
 *   string is the key of the completed achievement in the getAchievements() map. The
 *   completed achievement in the getAchievements() map.
 * - 'locked': This is called whenever an active achievement becomes unavailable. This is
 *   quite unlikely but may happen when the user resets the statistics. The passed string
 *   is the key of the completed achievement in the getAchievements() map.
 */
export class AchievementTracker extends EventEmitter {
  /** This will contain the accumulated experience gained by all completed achievements. */
  private totalXP = 0;

  /** The current level in the range [1...10]. */
  public currentLevel = 1;

  /** The list of all available achievements. */
  private achievements: Map<string, Achievement>;

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
      // Call the update whenever the corresponding settings key changes.
      this.stats.onChange(achievement.statsKey, () => {
        this.updateAchievement(true, id);
      });

      // Call the initial update.
      this.updateAchievement(false, id);
    });

    // Calculate the initial experience values.
    this.updateExperience();
  }

  /**
   * Retrieves a map of all achievements. This maps achievement IDs to achievement
   * objects. The structure of these objects is explained at the top of this file.
   */
  public getAchievements() {
    return this.achievements;
  }

  /** Retrieves the current level. This is in the range [1...10] for now. */
  public getCurrentLevel() {
    return this.currentLevel;
  }

  /**
   * Get the experience points indicating the progress of the current level. This is
   * computed by the total XP minus the XP required to unlock each of the previous
   * levels.
   */
  public getLevelXP() {
    let levelXP = this.totalXP;
    for (let i = 0; i < this.currentLevel - 1; i++) {
      levelXP -= LEVEL_XP[i];
    }

    return levelXP;
  }

  /** Returns the XP required to unlock the next level. */
  public getLevelMaxXP() {
    return LEVEL_XP[this.currentLevel - 1];
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
    let totalXP = 0;
    this.achievements.forEach((achievement) => {
      if (achievement.state == State.eCompleted) {
        totalXP += achievement.xp;
      }
    });

    // We will emit a signal if the XP changed.
    let emitXPChange = false;
    if (totalXP != this.totalXP) {
      this.totalXP = totalXP;
      emitXPChange = true;
    }

    // Compute the current level based on the total XP.
    let level = 1;
    let levelXP = LEVEL_XP[0];
    while (this.totalXP >= levelXP && level < LEVEL_XP.length) {
      levelXP += LEVEL_XP[level];
      ++level;
    }

    // We will emit a signal if the level changed.
    let emitLevelChange = false;
    if (level != this.currentLevel) {
      this.currentLevel = level;
      emitLevelChange = true;
    }

    // Now that the complete internal state is updated, we can safely emit the
    // signals.
    if (emitXPChange) {
      this.emit('experience-changed', this.getLevelXP(), this.getLevelMaxXP());
    }

    if (emitLevelChange) {
      this.emit('level-changed', this.currentLevel);
    }
  }

  /**
   * Updates the state and progress of a specific achievement. If the state or progress
   * changed, the corresponding signals are emitted.
   *
   * @param emitSignals Whether to emit change signals.
   * @param id The ID of the achievement to update.
   */
  private updateAchievement(emitSignals: boolean, id: string) {
    const achievement = this.achievements.get(id);

    // Retrieve the current value. For now, all statistics values are numbers.
    const val = this.stats.get(achievement.statsKey) as number;

    // First compute the state based on the value range of the achievement.
    let newState = State.eActive;
    if (val >= achievement.range[1]) {
      newState = State.eCompleted;
    } else if (val < achievement.range[0] || achievement.hidden) {
      newState = State.eLocked;
    }

    // If the state changed, we may have to emit some signals.
    if (newState != achievement.state) {
      achievement.state = newState;

      // Get a mutable copy of the achievement dates.
      const dates = structuredClone(this.stats.get('achievementDates')) as Record<
        string,
        string
      >;

      // If the achievement changed from or to the COMPLETED state, we have to update the
      // settings value storing all the timestamps for completing achievements.
      if (newState == State.eCompleted) {
        // Store the completion timestamp.
        dates[id] = new Date().toISOString();

        // If the completed achievement is supposed to reveal another hidden achievement,
        // we do this now.
        if (achievement.reveals && this.achievements.has(achievement.reveals)) {
          const revealedAchievement = this.achievements.get(achievement.reveals);
          revealedAchievement.hidden = false;
          this.updateAchievement(emitSignals, achievement.reveals);
        }
      } else {
        // Delete the completion timestamp if the achievement got 'uncompleted' for some
        // reason.
        if (id in dates) {
          delete dates[id];
        }

        // Also hide any achievements we may have revealed before.
        if (achievement.reveals && this.achievements.has(achievement.reveals)) {
          const revealedAchievement = this.achievements.get(achievement.reveals);
          revealedAchievement.hidden = true;
          this.updateAchievement(emitSignals, achievement.reveals);
        }
      }

      // Store the updated dates back to the settings.
      this.stats.set({ achievementDates: dates });

      // If the state changed, we may have to recompute our total experience. We do not do
      // this for the initial update as it's called once at the end of the constructor.
      if (emitSignals) {
        this.updateExperience();
      }

      // We do not want to emit signals for the first update() call. In this case, the
      // state member is not yet set.
      if (emitSignals) {
        if (newState == State.eActive) {
          this.emit('unlocked', id);
        } else if (newState == State.eCompleted) {
          this.emit('completed', id);
        } else {
          this.emit('locked', id);
        }
      }
    }

    // Now we update the progress of the achievement. This is a value clamped to the
    // minimum and maximum value range of the achievement.
    const newProgress = Math.min(
      Math.max(val, achievement.range[0]),
      achievement.range[1]
    );

    // Emit a signal if the value changed.
    if (newProgress != achievement.progress) {
      achievement.progress = newProgress;

      if (emitSignals) {
        this.emit('progress-changed', id, newProgress, achievement.range[1]);
      }
    }
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

    const achievements = new Map<string, Achievement>();

    // Add the five tiers of the cancel-many-selections achievements.
    for (let i = 0; i < 5; i++) {
      achievements.set('cancelor' + i, {
        name: i18next.t('achievements.cancelor.name', {
          attribute: attributes[i],
          tier: numbers[i],
        }),
        description: i18next.t('achievements.cancelor.description', {
          n: BASE_RANGES[i + 1] * 2,
        }),
        bgImage: bgImages[i],
        fgImage: 'cancel.svg',
        statsKey: 'cancels',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
        hidden: false,
        progress: 0,
        state: State.eLocked,
      });
    }

    // Add the five tiers of the select-many-items achievements.
    for (let i = 0; i < 5; i++) {
      achievements.set('pielot' + i, {
        name: i18next.t('achievements.pielot.name', {
          attribute: attributes[i],
          tier: numbers[i],
        }),
        description: i18next.t('achievements.pielot.description', {
          n: BASE_RANGES[i + 1] * 5,
        }),
        bgImage: bgImages[i],
        fgImage: `award${i}.svg`,
        statsKey: 'selections',
        xp: BASE_XP[i] * 2,
        range: [BASE_RANGES[i] * 5, BASE_RANGES[i + 1] * 5],
        hidden: false,
        progress: 0,
        state: State.eLocked,
      });
    }

    // Add the 15 achievements for selecting many things at different depths in marking
    // mode.
    for (let depth = 1; depth <= 3; depth++) {
      for (let i = 0; i < 5; i++) {
        const names = [
          i18next.t('achievements.gesture-selector.name1', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.gesture-selector.name2', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.gesture-selector.name3', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
        ];

        const keys: Array<keyof AchievementStats> = [
          'gestureSelectionsDepth1',
          'gestureSelectionsDepth2',
          'gestureSelectionsDepth3',
        ];

        achievements.set(`depth${depth}-gesture-selector${i}`, {
          name: names[depth - 1],
          description: i18next.t('achievements.gesture-selector.description', {
            n: BASE_RANGES[i + 1] * 2,
            depth,
          }),
          bgImage: bgImages[i],
          fgImage: `gesture${depth}.svg`,
          statsKey: keys[depth - 1],
          xp: BASE_XP[i],
          range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
          hidden: false,
          progress: 0,
          state: State.eLocked,
        });
      }
    }

    // Add the 15 achievements for selecting many things at different depths with
    // mouse clicks.
    for (let depth = 1; depth <= 3; depth++) {
      for (let i = 0; i < 5; i++) {
        const names = [
          i18next.t('achievements.click-selector.name1', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.click-selector.name2', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.click-selector.name3', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
        ];

        const keys: Array<keyof AchievementStats> = [
          'clickSelectionsDepth1',
          'clickSelectionsDepth2',
          'clickSelectionsDepth3',
        ];

        achievements.set(`depth${depth}-click-selector${i}`, {
          name: names[depth - 1],
          description: i18next.t('achievements.click-selector.description', {
            n: BASE_RANGES[i + 1] * 2,
            depth,
          }),
          bgImage: bgImages[i],
          fgImage: `click${depth}.svg`,
          statsKey: keys[depth - 1],
          xp: BASE_XP[i],
          range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
          hidden: false,
          progress: 0,
          state: State.eLocked,
        });
      }
    }

    for (let depth = 1; depth <= 3; depth++) {
      for (let i = 0; i < 5; i++) {
        const timeLimits = [
          [1000, 750, 500, 250, 150],
          [2000, 1000, 750, 500, 250],
          [3000, 2000, 1000, 750, 500],
        ];

        const counts = [50, 100, 150, 200, 250];

        const names = [
          i18next.t('achievements.time-selector.name1', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.time-selector.name2', {
            attribute: attributes[i],
            tier: numbers[i],
          }),
          i18next.t('achievements.time-selector.name3', {
            attribute: attributes[i],
            tier: numbers[i],
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

        achievements.set(`depth${depth}-selector${i}`, {
          name: names[depth - 1],
          description: i18next.t('achievements.time-selector.description', {
            n: counts[i],
            depth,
            time: timeLimits[depth - 1][i],
          }),
          bgImage: bgImages[i],
          fgImage: `timer.svg`,
          statsKey: keys[(depth - 1) * 5 + i],
          xp: BASE_XP[i],
          range: [0, counts[i]],
          hidden: i > 0,
          reveals: i < 5 ? `depth${depth}-selector${i + 1}` : null,
          progress: 0,
          state: State.eLocked,
        });
      }
    }

    // Add the five tiers of the settings-opened achievements.
    for (let i = 0; i < 5; i++) {
      achievements.set('journey' + i, {
        name: i18next.t('achievements.journey.name', {
          attribute: attributes[i],
          tier: numbers[i],
        }),
        description: i18next.t('achievements.journey.description', {
          n: BASE_RANGES[i + 1] / 2,
        }),
        bgImage: bgImages[i],
        fgImage: 'gear.svg',
        statsKey: 'settingsOpened',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
        progress: 0,
        state: State.eLocked,
      });
    }

    // Add the five tiers of the create-many-items-in-menus achievements.
    for (let i = 0; i < 5; i++) {
      achievements.set('manyitems' + i, {
        name: i18next.t('achievements.manyitems.name', {
          attribute: attributes[i],
          tier: numbers[i],
        }),
        description: i18next.t('achievements.manyitems.description', {
          n: BASE_RANGES[i + 1] / 2,
        }),
        bgImage: bgImages[i],
        fgImage: 'dots.svg',
        statsKey: 'addedItems',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
        progress: 0,
        state: State.eLocked,
      });
    }

    // Add the delete-all-menus achievement.
    achievements.set('goodpie', {
      name: i18next.t('achievements.goodpie.name'),
      description: i18next.t('achievements.goodpie.description'),
      bgImage: 'special2.png',
      fgImage: 'fire.svg',
      statsKey: 'deletedAllMenus',
      xp: BASE_XP[2],
      range: [0, 1],
      hidden: true,
      progress: 0,
      state: State.eLocked,
    });

    // Add the click-on-sponsor achievement.
    achievements.set('sponsors', {
      name: i18next.t('achievements.sponsors.name'),
      description: i18next.t('achievements.sponsors.description'),
      bgImage: 'special3.png',
      fgImage: 'heart.svg',
      statsKey: 'sponsorsViewed',
      xp: BASE_XP[1],
      range: [0, 1],
      hidden: true,
      progress: 0,
      state: State.eLocked,
    });

    return achievements;
  }
}

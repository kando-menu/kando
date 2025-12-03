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

import { AchievementStats } from './settings-schemata';

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
   * The name. Most achievements have multiple tiers. A %i in the name will be replaced by
   * a corresponding roman number (e.g. I, II, III, IV or V), %s by a corresponding
   * attribute like 'Novice' or 'Master'.
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
  statsKey: string;

  /** The amount of experience gained by completion. */
  xp: number;

  /** A value for the statsKey value for which this achievement is active. */
  range: [number, number];

  /** If set, it's not shown in the UI until revealed by another achievement. */
  hidden: boolean;

  /** The ID of a hidden achievement. */
  reveals: string | null;
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

 * There are some public methods to get the current level, experience and individual
 * achievement progress.
 *
 * The following events are emitted:
 * 
 * level-changed:       This is called whenever the users levels up (or down...). The
 *                      parameter provides the new level.
 * experience-changed:  This is usually called whenever an achievement is completed. The
 *                      first parameter contains the current experience points; the second
 *                      contains the total experience points required to level up.
 * progress-changed:    This is called whenever the progress of an active achievement
 *                      changes. The passed string is the key of the achievement in the
 *                      getAchievements() map of this; the second and third parameter are
 *                      the new progress and maximum progress.
 * completed:           This is called whenever an achievement is completed. The passed
 *                      string is the key of the completed achievement in the
 *                      getAchievements() map.
 * unlocked:            This is called whenever a new achievement becomes available. The
 *                      passed string is the key of the completed achievement in the
 *                      getAchievements() map.
 * locked:              This is called whenever an active achievement becomes unavailable.
 *                      This is quite unlikely but may happen when the user resets the
 *                      statistics. The passed string is the key of the completed
 *                      achievement in the getAchievements() map.
 */
export class AchievementTracker extends EventEmitter {
  /**
   * This will contain the accumulated experience gained by all completed achievements.
   */
  private totalXP: number;

  constructor(private stats: AchievementStats) {
    super();

    // Create our main achievements map.
    this._achievements = this.createAchievements();

    // Now initialize the state and progress of each achievement based on the
    // statistics.
    this._achievements.forEach((achievement, id) => {
      // This is called once initially and whenever the statistics value for the
      // achievement changes.
      const update = (emitSignals, achievement, id) => {
        // Retrieve the current value.
        let val = this._settings.get_uint(achievement.statsKey);

        // The tutorial time is handled differently. The number of unlocked medals is
        // not directly stored in the settings, so we calculate it here in a
        // hard-coded manner.
        if (achievement.statsKey == 'stats-best-tutorial-time') {
          if (val <= 500) {
            val = 6;
          } else if (val <= 750) {
            val = 5;
          } else if (val <= 1000) {
            val = 4;
          } else if (val <= 2000) {
            val = 2;
          } else if (val <= 3000) {
            val = 1;
          } else {
            val = 0;
          }
        }
        // Also the DBus-Menus-Achievement needs special treatment as we do not want
        // to include the tutorial and preview menu openings (which are also triggered
        // over the D-Bus).
        else if (achievement.statsKey == 'stats-dbus-menus') {
          val -= this._settings.get_uint('stats-tutorial-menus');
          val -= this._settings.get_uint('stats-preview-menus');
        }

        // First compute the state based on the value range of the achievement.
        let newState = State.ACTIVE;
        if (val >= achievement.range[1]) {
          newState = State.COMPLETED;
        } else if (val < achievement.range[0] || achievement.hidden) {
          newState = State.LOCKED;
        }

        // If the state changed, we may have to emit some signals.
        if (newState != achievement.state) {
          achievement.state = newState;

          // If the achievement changed from or to the COMPLETED state, we have to
          // update the settings value storing all the timestamps for completing
          // achievements.
          const key = 'stats-achievement-dates';
          const dates = this._settings.get_value(key).deep_unpack();
          if (newState == State.COMPLETED) {
            // Store the completion timestamp.
            if (!dates.hasOwnProperty(id)) {
              dates[id] = Date.now();
              this._settings.set_value(key, new GLib.Variant('a{sx}', dates));
            }

            // If the completed achievement is supposed to reveal another hidden
            // achievement, we do this now.
            if (achievement.reveals && this._achievements.has(achievement.reveals)) {
              const revealedAchievement = this._achievements.get(achievement.reveals);
              revealedAchievement.hidden = false;
              update(emitSignals, revealedAchievement, achievement.reveals);
            }
          } else {
            // Delete the completion timestamp if the achievement got 'uncompleted'
            // for some reason.
            if (dates.hasOwnProperty(id)) {
              delete dates[id];
              this._settings.set_value(key, new GLib.Variant('a{sx}', dates));
            }

            // Also hide any achievements we may have revealed before.
            if (achievement.reveals && this._achievements.has(achievement.reveals)) {
              const revealedAchievement = this._achievements.get(achievement.reveals);
              revealedAchievement.hidden = true;
              update(emitSignals, revealedAchievement, achievement.reveals);
            }
          }

          // If the state changed, we may have to recompute our total experience. We
          // do not do this for the initial update as it's called once at the end of
          // the constructor.
          if (emitSignals) {
            this._updateExperience();
          }

          // We do not want to emit signals for the first update() call. In this case,
          // the state member is not yet set.
          if (emitSignals) {
            if (newState == State.ACTIVE) {
              this.emit('unlocked', id);
            } else if (newState == State.COMPLETED) {
              this.emit('completed', id);
            } else {
              this.emit('locked', id);
            }
          }
        }

        // Now we update the progress of the achievement. This is a value clamped to
        // the minimum and maximum value range of the achievement.
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
      };

      // Call the update whenever the corresponding settings key changes.
      this._settingsConnections.push(
        this._settings.connect('changed::' + achievement.statsKey, () =>
          update(true, achievement, id)
        )
      );

      // Call the initial update.
      update(false, achievement, id);
    });

    // Calculate the initial experience values.
    this._updateExperience();
  }

  // This should be called when the settings dialog is closed. It disconnects handlers
  // registered with the Gio.Settings object.
  destroy() {
    this._settingsConnections.forEach((connection) => {
      this._settings.disconnect(connection);
    });
  }

  // ---------------------------------------------------------------- public interface

  // Retrieves a map of all achievements. This maps achievement IDs to achievement
  // objects. The structure of these objects is explained at the top of this file.
  getAchievements() {
    return this._achievements;
  }

  // Retrieves the current level. This is in the range [1...10] for now.
  getCurrentLevel() {
    return this._currentLevel;
  }

  // Get the experience points indicating the progress of the current level. This is
  // computed by the total XP minus the XP required to unlock each of the previous
  // levels.
  getLevelXP() {
    let levelXP = this._totalXP;
    for (let i = 0; i < this._currentLevel - 1; i++) {
      levelXP -= LEVEL_XP[i];
    }

    return levelXP;
  }

  // Returns the XP required to unlock the next level.
  getLevelMaxXP() {
    return LEVEL_XP[this._currentLevel - 1];
  }

  // Paints an icon for the given achievement to a Cairo.Context.
  static paintAchievementIcon(ctx, achievement) {
    const background = GdkPixbuf.Pixbuf.new_from_resource(
      '/img/achievements/' + achievement.bgImage
    );
    const foreground = GdkPixbuf.Pixbuf.new_from_resource(
      '/img/achievements/' + achievement.fgImage
    );
    const gloss = GdkPixbuf.Pixbuf.new_from_resource('/img/achievements/gloss.png');

    Gdk.cairo_set_source_pixbuf(ctx, background, 0, 0);
    ctx.paint();

    Gdk.cairo_set_source_pixbuf(ctx, foreground, 0, 0);
    ctx.paint();

    Gdk.cairo_set_source_pixbuf(ctx, gloss, 0, 0);
    ctx.paint();
  }

  // ------------------------------------------------------------------- private stuff

  // This computes the current level and total experience by iterating through all
  // achievements and accumulating the experience of the completed ones.
  _updateExperience() {
    // Accumulate XP of completed achievements.
    let totalXP = 0;
    this._achievements.forEach((achievement) => {
      if (achievement.state == State.COMPLETED) {
        totalXP += achievement.xp;
      }
    });

    // We will emit a signal if the XP changed.
    let emitXPChange = false;
    if (totalXP != this._totalXP) {
      this._totalXP = totalXP;
      emitXPChange = true;
    }

    // Compute the current level based on the total XP.
    let level = 1;
    let levelXP = LEVEL_XP[0];
    while (this._totalXP >= levelXP && level < LEVEL_XP.length) {
      levelXP += LEVEL_XP[level];
      ++level;
    }

    // We will emit a signal if the level changed.
    let emitLevelChange = false;
    if (level != this._currentLevel) {
      this._currentLevel = level;
      emitLevelChange = true;
    }

    // Now that the complete internal state is updated, we can safely emit the
    // signals.
    if (emitXPChange) {
      this.emit('experience-changed', this.getLevelXP(), this.getLevelMaxXP());
    }

    if (emitLevelChange) {
      this.emit('level-changed', this._currentLevel);
    }
  }

  /**
   * Creates all available achievements.
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

    const formatName = (name, i) => {
      return name.replace('%s', attributes[i]).replace('%i', numbers[i]);
    };

    const achievements = new Map();

    for (let i = 0; i < 5; i++) {
      achievements.set('cancellor' + i, {
        // Translators: The name of the 'Abort a selection %x times.' achievement.
        name: formatName(i18next.t('achievements.%s Cancellor'), i),
        description:
          // Translators: The description of the '%s Cancellor' achievement.
          i18next
            .t('achievements.Abort a selection %x times.')
            .replace('%x', BASE_RANGES[i + 1] * 2),
        bgImage: bgImages[i],
        fgImage: 'cancel.svg',
        statsKey: 'stats-abortions',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('master' + i, {
        // Translators: The name of the 'Select %x items.' achievement.
        name: formatName(i18next.t('achievements.%s Pielot'), i),
        // Translators: The description of the '%s Pielot' achievement.
        description: i18next
          .t('achievements.Select %x items.')
          .replace('%x', BASE_RANGES[i + 1] * 5),
        bgImage: bgImages[i],
        fgImage: `award${i}.svg`,
        statsKey: 'stats-selections',
        xp: BASE_XP[i] * 2,
        range: [BASE_RANGES[i] * 5, BASE_RANGES[i + 1] * 5],
        hidden: false,
      });
    }

    for (let depth = 1; depth <= 3; depth++) {
      const names = [
        // Translators: The name of the 'Select %x items at depth 1 in marking mode.'
        // achievement.
        i18next.t('achievements.%s Toplevel Gesture-Selector'),
        // Translators: The name of the 'Select %x items at depth 2 in marking mode.'
        // achievement.
        i18next.t('achievements.%s Submenu Gesture-Selector'),
        // Translators: The name of the 'Select %x items at depth 3 in marking mode.'
        // achievement.
        i18next.t('achievements.%s Subsubmenu Gesture-Selector'),
      ];

      for (let i = 0; i < 5; i++) {
        achievements.set(`depth${depth}-gesture-selector${i}`, {
          name: formatName(names[depth - 1], i),
          // Translators: The description of the 'Gesture-Selector' achievement.
          description: i18next
            .t('Select %x items at depth %d in marking mode.')
            .replace('%x', BASE_RANGES[i + 1] * 2)
            .replace('%d', depth),
          bgImage: bgImages[i],
          fgImage: `gesture${depth}.svg`,
          statsKey: `stats-gesture-selections-depth${depth}`,
          xp: BASE_XP[i],
          range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
          hidden: false,
        });
      }
    }

    for (let depth = 1; depth <= 3; depth++) {
      const names = [
        // Translators: The name of the 'Select %x items at depth 1 with mouse
        // clicks.' achievement.
        i18next.t('achievements.%s Toplevel Click-Selector'),
        // Translators: The name of the 'Select %x items at depth 2 with mouse
        // clicks.' achievement.
        i18next.t('achievements.%s Submenu Click-Selector'),
        // Translators: The name of the 'Select %x items at depth 3 with mouse
        // clicks.' achievement.
        i18next.t('achievements.%s Subsubmenu Click-Selector'),
      ];

      for (let i = 0; i < 5; i++) {
        achievements.set(`depth${depth}-click-selector${i}`, {
          name: formatName(names[depth - 1], i),
          // Translators: The description of the 'Click-Selector' achievement.
          description: i18next
            .t('Select %x items at depth %d with mouse clicks.')
            .replace('%x', BASE_RANGES[i + 1] * 2)
            .replace('%d', depth),
          bgImage: bgImages[i],
          fgImage: `click${depth}.svg`,
          statsKey: `stats-click-selections-depth${depth}`,
          xp: BASE_XP[i],
          range: [BASE_RANGES[i] * 2, BASE_RANGES[i + 1] * 2],
          hidden: false,
        });
      }
    }

    {
      const timeLimits = [
        [1000, 750, 500, 250, 150],
        [2000, 1000, 750, 500, 250],
        [3000, 2000, 1000, 750, 500],
      ];

      const names = [
        // Translators: The name of the 'Select %x items at depth 1 in less than %t
        // milliseconds.' achievement.
        i18next.t('achievements.%s Toplevel Selector'),
        // Translators: The name of the 'Select %x items at depth 2 in less than %t
        // milliseconds.' achievement.
        i18next.t('achievements.%s Submenu Selector'),
        // Translators: The name of the 'Select %x items at depth 3 in less than %t
        // milliseconds.' achievement.
        i18next.t('achievements.%s Subsubmenu Selector'),
      ];

      const counts = [50, 100, 150, 200, 250];

      for (let depth = 1; depth <= 3; depth++) {
        for (let i = 0; i < 5; i++) {
          achievements.set(`depth${depth}-selector${i}`, {
            name: formatName(names[depth - 1], i),
            description:
              // Translators: The description of the 'Selector' achievement.
              i18next
                .t('Select %x items at depth %d in less than %t milliseconds.')
                .replace('%x', counts[i])
                .replace('%t', timeLimits[depth - 1][i])
                .replace('%d', depth),
            bgImage: bgImages[i],
            fgImage: `timer.svg`,
            statsKey: `stats-selections-${timeLimits[depth - 1][i]}ms-depth${depth}`,
            xp: BASE_XP[i],
            range: [0, counts[i]],
            hidden: i > 0,
            reveals: i < 5 ? `depth${depth}-selector${i + 1}` : null,
          });
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('journey' + i, {
        // Translators: The name of the 'Open the settings dialog %x times.'
        // achievement.
        name: formatName(i18next.t('achievements.The Journey Is The Reward %i'), i),
        // Translators: The description of the 'The Journey Is The Reward %i'
        // achievement.
        description: i18next
          .t('Open the settings dialog %x times.')
          .replace('%x', BASE_RANGES[i + 1] / 2),
        bgImage: bgImages[i],
        fgImage: 'gear.svg',
        statsKey: 'stats-settings-opened',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('nerd' + i, {
        // Translators: The name of the 'Open %x menus with the D-Bus interface.'
        // achievement.
        name: formatName(i18next.t('achievements.Nerd Alert %i'), i),
        // Translators: The description of the 'Nerd Alert %i' achievement.
        description: i18next
          .t('Open %x menus with the D-Bus interface.')
          .replace('%x', BASE_RANGES[i + 1]),
        bgImage: bgImages[i],
        fgImage: 'nerd.svg',
        statsKey: 'stats-dbus-menus',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i], BASE_RANGES[i + 1]],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('entropie' + i, {
        // Translators: The name of the 'Generate %x random presets.' achievement.
        name: formatName(i18next.t('achievements.Entropie %i'), i),
        // Translators: The description of the 'Generate %x random presets.'
        // achievement.
        description: i18next
          .t('Generate %x random presets.')
          .replace('%x', BASE_RANGES[i + 1] / 2),
        bgImage: bgImages[i],
        fgImage: 'chaos.svg',
        statsKey: 'stats-random-presets',
        xp: BASE_XP[i] / 2,
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('preset-exporter' + i, {
        // Translators: The name of the 'Export %x custom presets.' achievement.
        name: formatName(i18next.t('achievements.%s Preset Exporter'), i),
        description:
          BASE_RANGES[i + 1] / 10 == 1
            ? // Translators: The description of the '%s Preset Exporter' achievement if
              // only one preset needs to be exported.
              i18next.t('achievements.Export a custom preset.')
            : // Translators: The description of the '%s Preset Exporter' achievement.
              i18next
                .t('Export %x custom presets.')
                .replace('%x', BASE_RANGES[i + 1] / 10),
        bgImage: bgImages[i],
        fgImage: 'export.svg',
        statsKey: 'stats-presets-exported',
        xp: BASE_XP[i] / 2,
        range: [BASE_RANGES[i] / 10, BASE_RANGES[i + 1] / 10],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('preset-importer' + i, {
        // Translators: The name of the 'Import %x custom presets.' achievement.
        name: formatName(i18next.t('achievements.%s Preset Importer'), i),
        description:
          BASE_RANGES[i + 1] / 10 == 1
            ? // Translators: The description of the '%s Preset Importer' achievement if
              // only one preset needs to be imported.
              i18next.t('achievements.Import a custom preset.')
            : // Translators: The description of the '%s Preset Importer' achievement.
              i18next
                .t('Import %x custom presets.')
                .replace('%x', BASE_RANGES[i + 1] / 10),
        bgImage: bgImages[i],
        fgImage: 'import.svg',
        statsKey: 'stats-presets-imported',
        xp: BASE_XP[i] / 2,
        range: [BASE_RANGES[i] / 10, BASE_RANGES[i + 1] / 10],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('menu-importer' + i, {
        // Translators: The name of the 'Import %x menu configurations.' achievement.
        name: formatName(i18next.t('achievements.%s Menu Importer'), i),
        description:
          BASE_RANGES[i + 1] / 10 == 1
            ? // Translators: The description of the '%s Menu Importer' achievement if
              // only one menu needs to be imported.
              i18next.t('achievements.Import a menu configuration.')
            : // Translators: The description of the '%s Menu Importer' achievement.
              i18next
                .t('Import %x menu configurations.')
                .replace('%x', BASE_RANGES[i + 1] / 10),
        bgImage: bgImages[i],
        fgImage: 'export.svg',
        statsKey: 'stats-menus-imported',
        xp: BASE_XP[i] / 2,
        range: [BASE_RANGES[i] / 10, BASE_RANGES[i + 1] / 10],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('menu-exporter' + i, {
        // Translators: The name of the 'Export %x menu configurations.' achievement.
        name: formatName(i18next.t('achievements.%s Menu Exporter'), i),
        description:
          BASE_RANGES[i + 1] / 10 == 1
            ? // Translators: The description of the '%s Menu Exporter' achievement if
              // only one menu needs to be exported.
              i18next.t('achievements.Export a menu configuration.')
            : // Translators: The description of the '%s Menu Exporter' achievement.
              i18next
                .t('Export %x menu configurations.')
                .replace('%x', BASE_RANGES[i + 1] / 10),
        bgImage: bgImages[i],
        fgImage: 'import.svg',
        statsKey: 'stats-menus-exported',
        xp: BASE_XP[i] / 2,
        range: [BASE_RANGES[i] / 10, BASE_RANGES[i + 1] / 10],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('bigmenus' + i, {
        // Translators: The name of the 'Create %x items in the menu editor.'
        // achievement.
        name: formatName(
          i18next.t('achievements.There Should Be No More Than Twelve Items…? %i'),
          i
        ),
        // Translators: The description of the 'There Should Be No More Than Twelve
        // Items…? %i' achievement.
        description: i18next
          .t('Create %x items in the menu editor.')
          .replace('%x', BASE_RANGES[i + 1] / 2),
        bgImage: bgImages[i],
        fgImage: 'dots.svg',
        statsKey: 'stats-added-items',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
      });
    }

    for (let i = 0; i < 5; i++) {
      achievements.set('previewmenus' + i, {
        // Translators: The name of the 'Open a preview menu %x times.' achievement.
        name: formatName(i18next.t('achievements.%s Menu Designer'), i),
        description:
          // Translators: The description of the '%s Menu Designer' achievement.
          i18next
            .t('Open a preview menu %x times.')
            .replace('%x', BASE_RANGES[i + 1] / 2),
        bgImage: bgImages[i],
        fgImage: 'eye.svg',
        statsKey: 'stats-preview-menus',
        xp: BASE_XP[i],
        range: [BASE_RANGES[i] / 2, BASE_RANGES[i + 1] / 2],
        hidden: false,
      });
    }

    achievements.set('rookie', {
      // Translators: The name of the 'Open the tutorial menu %x times.' achievement.
      // This does not support %s and %i.
      name: i18next.t('achievements.Grumpie Rookie'),
      // Translators: The description of the 'Grumpie Rookie' achievement.
      description: i18next
        .t('achievements.Open the tutorial menu %x times.')
        .replace('%x', 50),
      bgImage: 'special3.png',
      fgImage: 'grumpie.svg',
      statsKey: 'stats-tutorial-menus',
      xp: BASE_XP[0],
      range: [0, 50],
      hidden: false,
    });

    achievements.set('bachelor', {
      // Translators: The name of the 'Get all medals of the tutorial.' achievement.
      // This does not support %s and %i.
      name: i18next.t('achievements.Bachelor Pielot'),
      // Translators: The description of the 'Bachelor Pielot' achievement.
      description: i18next.t('achievements.Get all medals of the tutorial.'),
      bgImage: 'special1.png',
      fgImage: 'scholar.svg',
      statsKey: 'stats-best-tutorial-time',
      xp: BASE_XP[1],
      range: [0, 6],
      hidden: false,
    });

    achievements.set('goodpie', {
      // Translators: The name of the hidden 'Delete all of your menus.' achievement.
      // This does not support %s and %i.
      name: i18next.t('achievements.Say Good-Pie!'),
      // Translators: The description of the 'Say Good-Pie!' achievement.
      description: i18next.t('achievements.Delete all of your menus.'),
      bgImage: 'special2.png',
      fgImage: 'fire.svg',
      statsKey: 'stats-deleted-all-menus',
      xp: BASE_XP[2],
      range: [0, 1],
      hidden: true,
    });

    achievements.set('sponsors', {
      // Translators: The name of the hidden 'Consider becoming a sponsor of Fly-Pie.'
      // This does not support %s and %i.
      // achievement.
      name: i18next.t("That's Philanthropie!"),
      // Translators: The description of the 'That's Philanthropie!' achievement.
      description: i18next.t('achievements.Consider becoming a sponsor of Fly-Pie.'),
      bgImage: 'special3.png',
      fgImage: 'heart.svg',
      statsKey: 'stats-sponsors-viewed',
      xp: BASE_XP[1],
      range: [0, 1],
      hidden: true,
    });

    return achievements;
  }
}

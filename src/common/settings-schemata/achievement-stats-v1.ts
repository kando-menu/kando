//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { version } from '../../../package.json';

/** Statistics are tracked for the achievements. */
export const ACHIEVEMENT_STATS_SCHEMA_V1 = z.object({
  /**
   * The last version of Kando. This is used to determine whether the statistics file
   * needs to be backed up and potentially migrated to a newer version.
   */
  version: z.string().default(version),

  /** A map of achievement IDs to the timestamps when they were unlocked. */
  achievementDates: z.record(z.string(), z.iso.datetime()).default({}),

  /**
   * The timestamp when the user last viewed the achievements screen. Used to compute the
   * new achievements since last view.
   */
  lastViewed: z.iso.datetime().optional(),

  /** The total number of selections. */
  selections: z.number().default(0),

  /** The total number of mouse-click selections. */
  clickSelections: z.number().default(0),

  /** The total number of keyboard selections. */
  keyboardSelections: z.number().default(0),

  /** The total number of marking-mode or turbo-mode selections. */
  gestureSelections: z.number().default(0),

  /** The total number of gamepad selections. */
  gamepadSelections: z.number().default(0),

  /** The number of selections at depth 1 faster than 1000ms. */
  selectionsSpeed1Depth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 750ms. */
  selectionsSpeed2Depth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 500ms. */
  selectionsSpeed3Depth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 250ms. */
  selectionsSpeed4Depth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 150ms. */
  selectionsSpeed5Depth1: z.number().default(0),

  /** The number of selections at depth 2 faster than 2000ms. */
  selectionsSpeed1Depth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 1000ms. */
  selectionsSpeed2Depth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 750ms. */
  selectionsSpeed3Depth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 500ms. */
  selectionsSpeed4Depth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 250ms. */
  selectionsSpeed5Depth2: z.number().default(0),

  /** The number of selections at depth 3 faster than 3000ms. */
  selectionsSpeed1Depth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 2000ms. */
  selectionsSpeed2Depth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 1000ms. */
  selectionsSpeed3Depth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 750ms. */
  selectionsSpeed4Depth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 500ms. */
  selectionsSpeed5Depth3: z.number().default(0),

  /** The number of canceled selections. */
  cancels: z.number().default(0),

  /** The number of times the settings dialog has been opened. */
  settingsOpened: z.number().default(0),

  /** The number of times the settings were restored. */
  settingsRestored: z.number().default(0),

  /** The number of times the settings were backed up. */
  settingsBackedUp: z.number().default(0),

  /** The number of items added to menus. */
  addedItems: z.number().default(0),

  /** The number of times all menus have been deleted. */
  deletedAllMenus: z.number().default(0),

  /** The number of times the user has selected a menu theme. */
  menuThemesSelected: z.number().default(0),

  /** The number of times the sponsor button has been pressed. */
  sponsorsViewed: z.number().default(0),

  /** The number of times the tutorial slides have been viewed. */
  tutorialViewed: z.number().default(0),

  /**
   * Increased every time the user adds an item to a menu where there are already twelve
   * items.
   */
  addedItemsToFullMenu: z.number().default(0),

  /** Increased every time the user adds an item to a menu at level four or deeper. */
  addedItemsToDeepMenu: z.number().default(0),

  /**
   * Increased every time a selection is made when the previous 9 selections were made
   * within 30s.
   */
  manySelectionsStreaks: z.number().default(0),

  /**
   * Increased every time a selection is made and this combined with the previous 9
   * selections were all made faster than 500ms.
   */
  speedySelectionsStreaks: z.number().default(0),
});

export type AchievementStatsV1 = z.infer<typeof ACHIEVEMENT_STATS_SCHEMA_V1>;

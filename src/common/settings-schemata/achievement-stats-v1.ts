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

  /** The total number of gesture selections at depth 1. */
  gestureSelectionsDepth1: z.number().default(0),

  /** The total number of gesture selections at depth 2. */
  gestureSelectionsDepth2: z.number().default(0),

  /** The total number of gesture selections at depth 3. */
  gestureSelectionsDepth3: z.number().default(0),

  /** The total number of click selections at depth 1. */
  clickSelectionsDepth1: z.number().default(0),

  /** The total number of click selections at depth 2. */
  clickSelectionsDepth2: z.number().default(0),

  /** The total number of click selections at depth 3. */
  clickSelectionsDepth3: z.number().default(0),

  /** The number of selections at depth 1 faster than 1000ms. */
  selections1000msDepth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 750ms. */
  selections750msDepth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 500ms. */
  selections500msDepth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 250ms. */
  selections250msDepth1: z.number().default(0),

  /** The number of selections at depth 1 faster than 150ms. */
  selections150msDepth1: z.number().default(0),

  /** The number of selections at depth 2 faster than 2000ms. */
  selections2000msDepth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 1000ms. */
  selections1000msDepth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 750ms. */
  selections750msDepth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 500ms. */
  selections500msDepth2: z.number().default(0),

  /** The number of selections at depth 2 faster than 250ms. */
  selections250msDepth2: z.number().default(0),

  /** The number of selections at depth 3 faster than 3000ms. */
  selections3000msDepth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 2000ms. */
  selections2000msDepth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 1000ms. */
  selections1000msDepth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 750ms. */
  selections750msDepth3: z.number().default(0),

  /** The number of selections at depth 3 faster than 500ms. */
  selections500msDepth3: z.number().default(0),

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

  /** The number of times the sponsor button has been pressed. */
  sponsorsViewed: z.number().default(0),
});

export type AchievementStatsV1 = z.infer<typeof ACHIEVEMENT_STATS_SCHEMA_V1>;

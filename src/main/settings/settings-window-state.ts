//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Morax <james20081204@gmail.com>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';
import path from 'node:path';
import type { Rectangle } from 'electron';
import * as z from 'zod';

const SETTINGS_WINDOW_STATE_SCHEMA = z.object({
  bounds: z
    .object({
      x: z.number().int(),
      y: z.number().int(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  maximized: z.boolean().default(false),
  sidebarWidths: z
    .object({
      left: z.number().int().positive().optional(),
      right: z.number().int().positive().optional(),
    })
    .optional(),
});

/** The machine-local state of the settings window. */
export type SettingsWindowState = z.infer<typeof SETTINGS_WINDOW_STATE_SCHEMA>;

/**
 * Fits the given window bounds into a display's work area. This keeps a restored window
 * reachable after a display was disconnected or its resolution changed.
 *
 * @param bounds The bounds which were persisted for the window.
 * @param workArea The work area of the display which best matches the persisted bounds.
 * @returns Bounds which fit entirely inside the work area.
 */
export function fitWindowBoundsToWorkArea(
  bounds: Rectangle,
  workArea: Rectangle
): Rectangle {
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);

  return {
    x: Math.max(workArea.x, Math.min(bounds.x, workArea.x + workArea.width - width)),
    y: Math.max(workArea.y, Math.min(bounds.y, workArea.y + workArea.height - height)),
    width,
    height,
  };
}

/** Loads and stores the machine-local state of the settings window. */
export class SettingsWindowStateStore {
  /** The absolute path of the state file. */
  public readonly filePath: string;

  constructor(directory: string) {
    this.filePath = path.join(directory, 'settings-window-state.json');
  }

  /**
   * Loads the state from disk. Missing or invalid files fall back to defaults so that UI
   * state can never prevent Kando from starting.
   *
   * @returns The validated settings-window state.
   */
  public load(): SettingsWindowState {
    try {
      return SETTINGS_WINDOW_STATE_SCHEMA.parse(fs.readJSONSync(this.filePath));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load settings-window state:', error);
      }

      return SETTINGS_WINDOW_STATE_SCHEMA.parse({});
    }
  }

  /**
   * Persists the state to disk. A failure is logged but deliberately kept non-fatal since
   * window geometry is optional UI state.
   *
   * @param state The settings-window state to persist.
   */
  public save(state: SettingsWindowState) {
    try {
      fs.ensureDirSync(path.dirname(this.filePath));
      fs.writeJSONSync(this.filePath, SETTINGS_WINDOW_STATE_SCHEMA.parse(state), {
        spaces: 2,
      });
    } catch (error) {
      console.error('Failed to save settings-window state:', error);
    }
  }
}

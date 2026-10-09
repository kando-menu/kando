//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: hippi345 <13539685+hippi345@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import path from 'path';
import json5 from 'json5';

import type {
  MenuThemeDescription,
  SoundThemeDescription,
  MenuInteractionType,
  SoundEffect,
} from '../../common';

/**
 * Attempts to parse a JSON5 theme file. Returns the parsed value on success, or `null`
 * when parsing fails. The error is logged to the console with the file path so the user
 * has enough context to fix the problem.
 *
 * @param filePath The absolute path of the file (used only for the log message).
 * @param content The raw file contents to parse.
 * @returns The parsed object, or `null` if parsing failed.
 */
export function safeParseThemeFile(filePath: string, content: string): unknown {
  try {
    return json5.parse(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to parse theme file "${filePath}": ${message}`);
    return null;
  }
}

/**
 * Reads and parses the menu theme descriptor at the given path. On any read or parse
 * error a stub `MenuThemeDescription` with `loadFailed: true` is returned instead of
 * throwing, so callers can use this inside `Promise.all` without risk of rejecting the
 * whole batch when a single theme is broken.
 *
 * This function is intentionally Electron-free so that it can be called from unit tests
 * without mocking Electron APIs. Notification display and fallback-to-default logic live
 * in `app.ts`.
 *
 * @param metaFilePath Absolute path to the `theme.json` or `theme.json5` file.
 * @returns The parsed `MenuThemeDescription`, or a stub with `loadFailed: true`.
 */
export async function parseMenuThemeFile(
  metaFilePath: string
): Promise<MenuThemeDescription> {
  const themeId = path.basename(path.dirname(metaFilePath));
  const themeDirectory = path.dirname(path.dirname(metaFilePath));

  const brokenStub = (): MenuThemeDescription => ({
    id: themeId,
    name: themeId,
    author: '',
    themeVersion: '',
    engineVersion: 0,
    license: '',
    maxMenuRadius: 150,
    centerTextWrapWidth: 90,
    drawChildrenBelow: true,
    drawCenterText: true,
    drawSelectionWedges: false,
    drawWedgeSeparators: false,
    colors: {},
    layers: [],
    directory: themeDirectory,
    loadFailed: true,
  });

  let content: string;
  try {
    content = (await fs.promises.readFile(metaFilePath)).toString();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read menu theme file "${metaFilePath}": ${message}`);
    return brokenStub();
  }

  const parsed = safeParseThemeFile(metaFilePath, content);
  if (!parsed) {
    return brokenStub();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;
  return {
    ...p,
    id: themeId,
    directory: themeDirectory,
    maxMenuRadius: p.maxMenuRadius ?? 150,
    centerTextWrapWidth: p.centerTextWrapWidth ?? 90,
    drawChildrenBelow: p.drawChildrenBelow ?? true,
    drawCenterText: p.drawCenterText ?? true,
    drawSelectionWedges: p.drawSelectionWedges ?? false,
    drawWedgeSeparators: p.drawWedgeSeparators ?? false,
  };
}

/**
 * Reads and parses the sound theme descriptor at the given path. On any read or parse
 * error a stub `SoundThemeDescription` with `loadFailed: true` is returned instead of
 * throwing. Engine-version validation is left to the caller.
 *
 * Like `parseMenuThemeFile`, this function is Electron-free.
 *
 * @param metaFilePath Absolute path to the `theme.json` or `theme.json5` file.
 * @returns The parsed `SoundThemeDescription`, or a stub with `loadFailed: true`.
 */
export async function parseSoundThemeFile(
  metaFilePath: string
): Promise<SoundThemeDescription> {
  const themeId = path.basename(path.dirname(metaFilePath));
  const themeDirectory = path.dirname(path.dirname(metaFilePath));

  const failedStub = (): SoundThemeDescription => ({
    id: themeId,
    name: themeId,
    directory: themeDirectory,
    engineVersion: 0,
    themeVersion: '',
    author: '',
    license: '',
    sounds: {} as Record<MenuInteractionType, SoundEffect>,
    loadFailed: true,
  });

  let content: string;
  try {
    content = (await fs.promises.readFile(metaFilePath)).toString();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read sound theme file "${metaFilePath}": ${message}`);
    return failedStub();
  }

  const parsed = safeParseThemeFile(metaFilePath, content);
  if (!parsed) {
    return failedStub();
  }

  const description = parsed as SoundThemeDescription;
  return {
    ...description,
    id: themeId,
    directory: themeDirectory,
  };
}

/**
 * Returns `true` the first time a broken theme `id` is seen, `false` on every subsequent
 * call with the same `id` and the same `notified` set. Call `notified.clear()` when the
 * user switches to a different theme so the notification rearms.
 *
 * Extracted as an electron-free helper so the deduplication logic can be unit-tested
 * independently.
 *
 * @param id The theme identifier (e.g. `'my-theme'`).
 * @param notified The per-instance set that tracks which IDs have already been reported.
 * @returns `true` if the caller should show a notification; `false` if already shown.
 */
export function shouldNotifyBrokenTheme(id: string, notified: Set<string>): boolean {
  if (notified.has(id)) {
    return false;
  }
  notified.add(id);
  return true;
}

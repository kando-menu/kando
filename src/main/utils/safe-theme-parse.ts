//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: hippi345 <13539685+hippi345@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import json5 from 'json5';

/**
 * Attempts to parse a JSON5 theme file. Returns the parsed value on success, or `null`
 * when parsing fails. The error is logged to the console with the file path so the user
 * has enough context to fix the problem.
 *
 * Extracting this into its own function makes it straightforward to unit-test the
 * error-handling path without needing a full Electron environment.
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

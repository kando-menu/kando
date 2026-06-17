//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { FocusWindowAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * Tests if a given value matches a given condition. If the condition is empty, it always
 * matches. Otherwise, the condition can be either a string or a regex. If it's a string,
 * we check if the value includes the condition (ignoring case). If it's a regex, we test
 * the value against the regex.
 *
 * @param condition The condition to test against.
 * @param value The value to test.
 * @returns True if the value matches the condition, false otherwise.
 */
function testStringCondition(condition: string, value: string) {
  if (!condition) {
    return true;
  }

  // If condition starts with / we treat it as regex. For this we need to extract
  // the flags from the end of the string and the pattern from the middle.
  if (condition.startsWith('/')) {
    const flags = condition.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = condition.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    return new RegExp(pattern, flags).test(value);
  }

  return value.toLowerCase().includes(condition.toLowerCase());
}

/**
 * This action will focus a matching application window.
 *
 * @param action The action for which the focus should be applied.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the focus has been successfully applied.
 */
export async function execute(action: DeepReadonly<FocusWindowAction>, app: KandoApp) {
  const openWindows = await app.getBackend().getOpenWindows();

  for (const window of openWindows) {
    if (
      testStringCondition(action.appName, window.appName) &&
      testStringCondition(action.windowName, window.windowName)
    ) {
      await app.getBackend().focusWindow(window);
      return;
    }
  }

  console.warn(`No window found for action ${JSON.stringify(action)}`);
}

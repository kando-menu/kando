//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-FileCopyrightText: emirmrkaljevic <93012621+emirmrkaljevic@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import JSON5 from 'json5';

import { MacroEvent } from '../../common';

/**
 * This method converts the given macro to a string as displayed in the macro picker. It
 * removes all line breaks and spaces, and formats the JSON string to be more readable.
 *
 * @param macro The macro to convert.
 * @returns The string representation of the macro.
 */
export function convertMacroToString(macro: MacroEvent[]): string {
  return JSON5.stringify(macro, null, 1)
    .replace(/\n/g, '')
    .replace(/ /g, '')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\},/g, '},\n')
    .replace(/:/g, ': ')
    .replace(/,/g, ', ');
}

/**
 * Returns the index of the macro event at the given text position. This is the number of
 * events which are completely before the given position. If the position is inside an
 * event, the index of this event is returned.
 *
 * @param text The string representation of the macro.
 * @param position A character position in the text, e.g. the caret position.
 * @returns The index at which new events should be inserted.
 */
export function getMacroEventIndexAt(text: string, position: number): number {
  return text.slice(0, position).split('}').length - 1;
}

/**
 * Inserts the given event into the macro at the given index. The macro is given as its
 * string representation and the result is returned in the same format.
 *
 * @param text The string representation of the macro.
 * @param index The index at which the event should be inserted.
 * @param event The event to insert.
 * @returns The string representation of the new macro.
 */
export function insertMacroEvent(text: string, index: number, event: MacroEvent): string {
  const macro: MacroEvent[] = JSON5.parse('[' + text + ']');
  macro.splice(index, 0, event);
  return convertMacroToString(macro);
}

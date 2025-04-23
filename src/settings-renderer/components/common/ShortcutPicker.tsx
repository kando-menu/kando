//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { TbPlayerRecordFilled } from 'react-icons/tb';
import classNames from 'classnames/bind';

import Button from './Button';

import * as classes from './ShortcutPicker.module.scss';
const cx = classNames.bind(classes);

interface IProps {
  /**
   * Function to call when the shortcut changes. This will be called when the user presses
   * Enter after typing a value, or when the user clicks outside of the text field. But
   * only if the shortcut is valid.
   */
  onChange?: (value: string) => void;

  /** Initial shortcut. */
  initialValue: string;
}

/**
 * This component is an input field that allows the user to enter a shortcut. The user can
 * either type the shortcut directly into the input field or click the record button to
 * record a shortcut. The component will automatically validate the shortcut and call the
 * onChange function when the shortcut changes.
 *
 * @param props - The properties for the component.
 * @returns A React component that allows the user to enter a shortcut.
 */
export default (props: IProps) => {
  const [shortcut, setShortcut] = React.useState(props.initialValue);
  const [recording, setRecording] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setShortcut(props.initialValue), [props.initialValue]);

  // Retrieve the keymap from the system.
  let keymap = new Map<string, string>();

  // @ts-expect-error The navigator is indeed available in Electron.
  window.navigator.keyboard.getLayoutMap().then((map) => {
    keymap = map;
  });

  // This function is called when the user clicks outside of the input field.
  const cancelRecording = () => {
    setRecording(false);
    setShortcut(props.initialValue);
    props.onChange?.(props.initialValue);
  };

  // This function is called when the user has selected a valid shortcut.
  const finishRecording = (value: string) => {
    setRecording(false);
    setShortcut(value);
    props.onChange?.(value);
  };

  return (
    <div className={classes.container}>
      <input
        ref={inputRef}
        type="text"
        className={cx({ recording, invalid: !isValid(shortcut) })}
        value={shortcut}
        placeholder={recording ? 'Type a shortcut...' : 'Not bound'}
        onChange={(event) => {
          if (!recording) {
            setShortcut(normalizeInput(event.target.value));
          }
        }}
        onKeyDown={(event) => {
          if (recording) {
            const isComplete = recordInput(event, keymap);
            if (isComplete) {
              finishRecording(event.currentTarget.value);
            }
            event.preventDefault();
          } else if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        onBlur={() => {
          if (recording) {
            cancelRecording();
          } else if (isValid(shortcut)) {
            props.onChange?.(shortcut);
          } else {
            setShortcut(props.initialValue);
            props.onChange?.(props.initialValue);
          }
        }}
      />
      <Button
        variant="secondary"
        grouped
        tooltip="Record a shortcut. You do not have to press all keys at once, you can also press them one after another. This is useful if a shortcut is already bound to another menu!"
        icon={<TbPlayerRecordFilled />}
        onClick={() => {
          if (!recording) {
            setShortcut('');
            inputRef.current?.focus();
          } else {
            props.onChange?.(props.initialValue);
          }
          setRecording(!recording);
        }}
      />
    </div>
  );
};

/**
 * This method checks if the given modifier is valid. A modifier is valid if it is one of
 * the strings listed in https://www.electronjs.org/docs/latest/api/accelerator.
 *
 * @param modifier The modifier to validate.
 * @returns True if the modifier is valid, false otherwise.
 */
function isValidModifier(modifier: string): boolean {
  const isModifier =
    /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)$/;
  return isModifier.test(modifier);
}

/**
 * This method checks if the given key is valid. A key is valid if it is one of the
 * strings listed in https://www.electronjs.org/docs/latest/api/accelerator.
 *
 * @param key The key to validate.
 * @returns True if the key is valid, false otherwise.
 */
function isValidKey(key: string): boolean {
  const isKey =
    /^([0-9A-Z)!@#$%^&*(:;+=<,_\->.?/~`{\][|\\}"']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Capslock|Numlock|Scrolllock|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen|num(?:[0-9]|dec|add|sub|mult|div))$/;
  return isKey.test(key);
}

/**
 * This method normalizes the given shortcut. It removes all whitespace and transforms the
 * shortcut to proper CamelCase. Again, we follow this list of valid keys:
 * https://www.electronjs.org/docs/latest/api/accelerator
 *
 * @param shortcut The shortcut to normalize.
 * @returns The normalized shortcut.
 */
function normalizeInput(shortcut: string): string {
  // We first remove any whitespace and transform the shortcut to lowercase.
  shortcut = shortcut.replace(/\s/g, '').toLowerCase();

  // We then selectively capitalize the parts of the shortcut. The first character of
  // each part is capitalized, except for the num* keys.
  let parts = shortcut.split('+');
  parts.forEach((part, index) => {
    if (part.startsWith('num')) {
      parts[index] = part;
    } else {
      parts[index] = part.charAt(0).toUpperCase() + part.slice(1);
    }
  });

  // Then there are a few names which contain multiple capital letters.
  const multipleCapitals = new Map([
    ['Commandorcontrol', 'CommandOrControl'],
    ['Cmdorctrl', 'CmdOrCtrl'],
    ['Altgr', 'AltGr'],
    ['Pageup', 'PageUp'],
    ['Pagedown', 'PageDown'],
    ['Volumedown', 'VolumeDown'],
    ['Volumeup', 'VolumeUp'],
    ['Volumemute', 'VolumeMute'],
    ['Medianexttrack', 'MediaNextTrack'],
    ['Mediaprevioustrack', 'MediaPreviousTrack'],
    ['Mediastop', 'MediaStop'],
    ['Mediaplaypause', 'MediaPlayPause'],
    ['Printscreen', 'PrintScreen'],
  ]);

  parts = parts.map((part) => multipleCapitals.get(part) || part);

  // There are also some shorthands we want to resolve.
  const shorthands = new Map([
    ['Ctrl', 'Control'],
    ['Cmd', 'Command'],
    ['Esc', 'Escape'],
  ]);

  parts = parts.map((part) => shorthands.get(part) || part);

  return parts.join('+');
}

/**
 * This method appends a key according to the given KeyboardEvent to the input field. The
 * method returns true if the shortcut is complete.
 *
 * The key is determined by the KeyboardEvent.code property and the modifier state. The
 * shortcut is formatted according to the rules outlined in
 * https://www.electronjs.org/docs/latest/api/accelerator.
 *
 * @param event The KeyboardEvent to process.
 * @param keymap The keymap to use for the current system.
 * @returns True if the shortcut is complete, false otherwise.
 */
function recordInput(
  event: React.KeyboardEvent<HTMLInputElement>,
  keymap: Map<string, string>
) {
  const parts = event.currentTarget.value.split('+').filter((part) => part !== '');

  const push = (part: string) => {
    if (!parts.includes(part)) {
      parts.push(part);
    }
  };

  if (event.ctrlKey) {
    push('Control');
  }

  if (event.shiftKey) {
    push('Shift');
  }

  if (event.altKey) {
    push('Alt');
  }

  if (event.metaKey) {
    push('Meta');
  }

  let key = keymap.get(event.code) || event.key;

  // Some DOM names differ from the names used by Electron. We need to map them.
  const nameMap = new Map([
    ['+', 'Plus'],
    [' ', 'Space'],
    ['Enter', 'Return'],
    ['ArrowUp', 'Up'],
    ['ArrowDown', 'Down'],
    ['ArrowLeft', 'Left'],
    ['ArrowRight', 'Right'],
  ]);

  key = nameMap.get(key) || key;

  // Fix the case of the key.
  key = normalizeInput(key);

  // We can explicitly bind to numpad keys. We check location property to determine
  // if the key is on the numpad.
  if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
    const nameMap = new Map([
      ['0', 'num0'],
      ['1', 'num1'],
      ['2', 'num2'],
      ['3', 'num3'],
      ['4', 'num4'],
      ['5', 'num5'],
      ['6', 'num6'],
      ['7', 'num7'],
      ['8', 'num8'],
      ['9', 'num9'],
      [',', 'numdec'],
      ['+', 'numadd'],
      ['-', 'numsub'],
      ['*', 'nummult'],
      ['/', 'numdiv'],
    ]);

    key = nameMap.get(key) || key;
  }

  const isComplete = isValidKey(key);

  if (isComplete) {
    parts.push(key);
  }

  event.currentTarget.value = parts.join('+');

  return isComplete;
}

/**
 * This method checks if the given shortcut is valid. A shortcut is valid if it follows
 * the rules outlined in https://www.electronjs.org/docs/latest/api/accelerator. An empty
 * shortcut is also considered valid.
 *
 * @param shortcut The normalized shortcut to validate.
 * @returns True if the shortcut is valid, false otherwise.
 */
function isValid(shortcut: string): boolean {
  // If the shortcut is empty, it is valid.
  if (shortcut === '') {
    return true;
  }

  // Make sure the shortcut does not start or end with a '+'.
  if (shortcut.startsWith('+') || shortcut.endsWith('+')) {
    return false;
  }

  // Split the shortcut into its parts.
  const parts = shortcut.split('+');

  // A valid shortcut must contain exactly one key and can contain any number of
  // modifiers.
  let hasKey = false;
  for (const part of parts) {
    if (isValidKey(part)) {
      if (hasKey) {
        return false;
      }
      hasKey = true;
    } else if (!isValidModifier(part)) {
      return false;
    }
  }

  return hasKey;
}

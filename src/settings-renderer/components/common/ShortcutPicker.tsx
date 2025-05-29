//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import { TbPlayerRecordFilled, TbPlayerStopFilled } from 'react-icons/tb';
import classNames from 'classnames/bind';

import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';
import { Button, SettingsRow } from '.';

import * as classes from './ShortcutPicker.module.scss';
const cx = classNames.bind(classes);

interface IProps {
  /**
   * Function to call when the shortcut changes. This will be called when the user presses
   * Enter after typing a value, or when the user clicks outside of the text field. But
   * only if the shortcut is valid.
   */
  onChange?: (shortcut: string) => void;

  /** Initial shortcut. */
  initialValue: string;

  /** Placeholder text to display when the shortcut picker is recording. */
  recordingPlaceholder: string;

  /** Optional label text to display next to the shortcut picker. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /**
   * Whether to record and validate the shortcut as key names or key codes. See the
   * component documentation below for more details.
   */
  mode: 'key-names' | 'key-codes';
}

/**
 * This component is an input field that allows the user to enter a shortcut. The user can
 * either type the shortcut directly into the input field or click the record button to
 * record a shortcut. The component will automatically validate the shortcut and call the
 * onChange function when the shortcut changes.
 *
 * There are two modes for the shortcut picker: key-names and key-codes. Shortcuts using
 * _key names_ are affected by the keyboard layout. Electron's global shortcut module
 * expects key names, so they are used for binding shortcuts. _key codes_ on the other
 * hand are independent of the keyboard layout. We use them when simulating hotkeys in
 * Kando. For instance, pressing a shortcut like "Control+Z" may require different keys
 * depending on the keyboard layout. When simulating "Control+Z" on the other hand will
 * invoke pressing the physical key "Z" which may be labeled differently on different
 * keyboards for example "Y" on a German keyboard.
 *
 * @param props - The properties for the component.
 * @returns A React component that allows the user to enter a shortcut.
 */
export default function ShortcutPicker(props: IProps) {
  const [shortcut, setShortcut] = React.useState(props.initialValue);
  const [recording, setRecording] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setShortcut(props.initialValue), [props.initialValue]);

  // Depending on the mode, we use different implementations for recording the input.
  const impl = React.useMemo(() => {
    return props.mode === 'key-names' ? new KeyNameImpl() : new KeyCodeImpl();
  }, [props.mode]);

  // This method checks if the given hotkey is valid. A hotkey is valid if it contains
  // exactly one key and any number of modifier keys. The key and modifier keys must be
  // valid key codes as defined by the impl.isValidKey and isValidModifier methods.
  const isValid = (shortcut: string) => {
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
      if (impl.isValidKey(part)) {
        if (hasKey) {
          return false;
        }
        hasKey = true;
      } else if (!impl.isValidModifier(part)) {
        return false;
      }
    }

    return hasKey;
  };

  return (
    <SettingsRow label={props.label} info={props.info} grow>
      <div className={classes.shortcutPicker}>
        <input
          ref={inputRef}
          type="text"
          spellCheck="false"
          className={cx({ recording, invalid: !isValid(shortcut) })}
          value={shortcut}
          placeholder={
            recording ? props.recordingPlaceholder : i18next.t('settings.not-bound')
          }
          onChange={(event) => {
            if (!recording) {
              const start = event.target.selectionStart;
              const end = event.target.selectionEnd;

              const normalizedValue = impl.normalizeInput(event.target.value);
              setShortcut(
                isValid(normalizedValue) ? normalizedValue : event.target.value
              );

              // We restore the cursor position.
              setTimeout(() => {
                event.target.setSelectionRange(start, end);
              }, 0);
            }
          }}
          onKeyDown={(event) => {
            if (recording) {
              const isComplete = impl.recordInput(event);
              if (isComplete) {
                setRecording(false);
                setShortcut(event.currentTarget.value);
                event.currentTarget.blur();
              }
              event.preventDefault();
            } else if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          onBlur={(event) => {
            // If the user clicked the record button, the next focused element is the
            // button. In this case, we ignore this event and handle stopping the
            // recording in the button's onClick handler.
            if (event.relatedTarget) {
              return;
            }

            const newShortcut = event.currentTarget.value;

            // If we were not recording, it is allowed that the shortcut is empty. In this
            // case the shortcut was unbound.
            if ((newShortcut || !recording) && isValid(newShortcut)) {
              props.onChange?.(newShortcut);
            } else {
              setShortcut(props.initialValue);
              props.onChange?.(props.initialValue);
            }

            if (recording) {
              setRecording(false);
            }
          }}
        />
        <Button
          variant="secondary"
          grouped
          icon={recording ? <TbPlayerStopFilled /> : <TbPlayerRecordFilled />}
          onClick={() => {
            if (!recording) {
              setShortcut('');
              inputRef.current?.focus();
            } else {
              if (shortcut && isValid(shortcut)) {
                props.onChange?.(shortcut);
              } else {
                setShortcut(props.initialValue);
                props.onChange?.(props.initialValue);
              }
            }
            setRecording(!recording);
          }}
        />
      </div>
    </SettingsRow>
  );
}

/**
 * This class is used to record and validate shortcuts using key names. It uses the
 * navigator.keyboard.getLayoutMap() method to get the current keyboard layout and
 * determines the key names based on the KeyboardEvent.code property and the modifier
 * state. The shortcut is formatted according to the rules outlined in
 * https://www.electronjs.org/docs/latest/api/accelerator.
 */
class KeyNameImpl {
  private keymap: Map<string, string>;

  constructor() {
    // @ts-expect-error The navigator is indeed available in Electron.
    window.navigator.keyboard.getLayoutMap().then((map) => {
      this.keymap = map;
    });
  }

  /**
   * This method appends a key according to the given KeyboardEvent to the input field.
   * The method returns true if the shortcut is complete.
   *
   * The key is determined by the KeyboardEvent.code property and the modifier state. The
   * shortcut is formatted according to the rules outlined in
   * https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param event The KeyboardEvent to process.
   * @returns True if the shortcut is complete, false otherwise.
   */
  public recordInput(event: React.KeyboardEvent<HTMLInputElement>) {
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

    let key = this.keymap.get(event.code) || event.key;

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
    key = this.normalizeInput(key);

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

    const isComplete = this.isValidKey(key);

    if (isComplete) {
      parts.push(key);
    }

    event.currentTarget.value = parts.join('+');

    return isComplete;
  }

  /**
   * This method normalizes the given shortcut. It removes all whitespace and transforms
   * the shortcut to proper CamelCase. Again, we follow this list of valid keys:
   * https://www.electronjs.org/docs/latest/api/accelerator
   *
   * @param shortcut The shortcut to normalize.
   * @returns The normalized shortcut.
   */
  public normalizeInput(shortcut: string): string {
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
   * This method checks if the given modifier is valid. A modifier is valid if it is one
   * of the strings listed in https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param modifier The modifier to validate.
   * @returns True if the modifier is valid, false otherwise.
   */
  public isValidModifier(modifier: string): boolean {
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
  public isValidKey(key: string): boolean {
    const isKey =
      /^([0-9A-Z)!@#$%^&*(:;+=<,_\->.?/~`{\][|\\}"']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Capslock|Numlock|Scrolllock|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen|num(?:[0-9]|dec|add|sub|mult|div))$/;
    return isKey.test(key);
  }
}

/**
 * This class is used to record and validate shortcuts using key codes. It uses the
 * KeyboardEvent.code property to determine the key codes. See common/key-codes.ts for a
 * list of valid key codes.
 */
class KeyCodeImpl {
  /**
   * This method appends the key code of the given KeyboardEvent to the input field. If
   * the input field contains a valid shortcut after appending the key code, the method
   * returns true to indicate that the shortcut is complete.
   *
   * @param event The KeyboardEvent to get the shortcut for.
   * @returns True if the shortcut is complete, false otherwise.
   */
  public recordInput(event: React.KeyboardEvent<HTMLInputElement>) {
    // Ignore key up events.
    if (event.type === 'keyup') {
      return false;
    }

    const parts = event.currentTarget.value.split('+').filter((part) => part !== '');

    // Only add the key code if it is not in the list already.
    if (parts.includes(event.code)) {
      return false;
    }

    parts.push(event.code);

    event.currentTarget.value = parts.join('+');

    return this.isValidKey(event.code);
  }

  /**
   * This method normalizes the given shortcut. It removes all whitespace and transforms
   * the shortcut to proper CamelCase. All components of the shortcut are matched against
   * the available key codes in common/key-codes.ts.
   *
   * @param shortcut The shortcut to normalize.
   * @returns The normalized shortcut.
   */
  public normalizeInput(shortcut: string): string {
    // We first remove any whitespace and transform the shortcut to lowercase.
    shortcut = shortcut.replace(/\s/g, '').toLowerCase();

    // We then split the shortcut into its parts and normalize each part.
    let parts = shortcut.split('+');
    parts = parts.map(fixKeyCodeCase);

    return parts.join('+');
  }

  /**
   * This method checks if the given modifier is valid. A modifier is valid if it is one
   * of the modifier keys of the key codes listed in common/key-codes.ts.
   *
   * @param modifier The modifier to validate.
   * @returns True if the modifier is valid, false otherwise.
   */
  public isValidModifier(modifier: string): boolean {
    const isModifier =
      /^(AltLeft|AltRight|ControlLeft|ControlRight|MetaLeft|MetaRight|ShiftLeft|ShiftRight)$/;
    return isModifier.test(modifier);
  }

  /**
   * This method checks if the given key is valid. A key is valid if it is one of the key
   * codes listed in common/key-codes.ts and is not a modifier key.
   *
   * @param key The key to validate.
   * @returns True if the key is valid, false otherwise.
   */
  public isValidKey(key: string): boolean {
    return isKnownKeyCode(key) && !this.isValidModifier(key);
  }
}

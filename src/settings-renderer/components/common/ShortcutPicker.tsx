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

import type { WindowWithAPIs } from '../../settings-window-api';
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';
import KeyMapper from '../../../common/key-mapper';
import {
  cycleModifierSide,
  DOUBLE_MODIFIER_SHORTCUT_INTERVAL_MS,
  formatShortcutForDisplay,
  getModifierShortcutTapCount,
} from '../../../common/shortcut';
import { Button, Popover, SettingsRow, ShortcutLabel } from '.';

import * as classes from './ShortcutPicker.module.scss';
const cx = classNames.bind(classes);

declare const window: WindowWithAPIs;

const MAC_MODIFIER_NAMES = new Map([
  ['⌘', 'Command'],
  ['⌥', 'Option'],
  ['⌃', 'Control'],
  ['⇧', 'Shift'],
]);

/** Returns a useful KeyboardEvent.key fallback for a captured DOM code. */
function getKeyValueFromCode(code: string): string {
  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3).toLowerCase();
  }
  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5);
  }

  const values = new Map([
    ['MetaLeft', 'Meta'],
    ['MetaRight', 'Meta'],
    ['AltLeft', 'Alt'],
    ['AltRight', 'Alt'],
    ['ControlLeft', 'Control'],
    ['ControlRight', 'Control'],
    ['ShiftLeft', 'Shift'],
    ['ShiftRight', 'Shift'],
    ['Space', ' '],
    ['Enter', 'Enter'],
    ['NumpadEnter', 'Enter'],
  ]);

  return values.get(code) || code;
}

type Props = {
  /**
   * Function to call when the shortcut changes. This will be called when the user presses
   * Enter after typing a value, or when the user clicks outside of the text field. But
   * only if the shortcut is valid.
   */
  readonly onChange?: (shortcut: string) => void;

  /** Initial shortcut. */
  readonly initialValue: string;

  /**
   * Placeholder text to display when the shortcut picker is not bound. Defaults to a
   * localized "Not bound" string.
   */
  readonly placeholder?: string;

  /** Placeholder text to display when the shortcut picker is recording. */
  readonly recordingPlaceholder: string;

  /** If set to true, the widget will grow if there is space available. Defaults to false. */
  readonly isGrowing?: boolean;

  /** Optional label text to display next to the shortcut picker. */
  readonly label?: string;

  /** Optional information to display next to the label. */
  readonly info?: string;

  /**
   * Whether to record and validate the shortcut as key names or key codes. See the
   * component documentation below for more details.
   */
  readonly mode: 'key-names' | 'key-codes';

  /**
   * If set, no modifiers are allowed in the shortcut. This is used for example for the
   * item hotkeys for navigating the menu.
   */
  readonly useModifiers: boolean;

  /** Whether key-name modifiers can be limited to the left or right physical key. */
  readonly isModifierSideSelectionAllowed?: boolean;

  /** Whether a shortcut may consist of one or two presses of a modifier key. */
  readonly isStandaloneModifierAllowed?: boolean;
};

/**
 * This component displays a shortcut and allows the user to record a new one. Clicking
 * the shortcut opens a popover which displays each key separately. For key-name
 * shortcuts, modifier keys can be clicked to select the left key, the right key, or
 * either key.
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
 * See also https://kando.menu/valid-keynames/ for more information on this topic.
 *
 * @param props - The properties for the component.
 * @returns A React component that allows the user to enter a shortcut.
 */
export default function ShortcutPicker(props: Props) {
  // Depending on the mode, we use different implementations for recording the input.
  const impl = React.useMemo(() => {
    const shouldRecordModifiers =
      props.useModifiers || Boolean(props.isStandaloneModifierAllowed);
    return props.mode === 'key-names'
      ? new KeyNameImpl(shouldRecordModifiers)
      : new KeyCodeImpl(shouldRecordModifiers);
  }, [props.isStandaloneModifierAllowed, props.mode, props.useModifiers]);

  const [shortcut, setShortcut] = React.useState(() =>
    impl.normalizeInput(props.initialValue)
  );
  const [recording, setRecording] = React.useState(false);
  const [isStartingRecording, setIsStartingRecording] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const shortcutRef = React.useRef<HTMLDivElement>(null);
  const recordingRef = React.useRef(false);
  const capturedPressedKeysRef = React.useRef<Set<string>>(new Set());
  const recordingInhibitionRef = React.useRef<number | null>(null);
  const modifierRecordingPressedAtRef = React.useRef<number | null>(null);
  const pendingModifierRecordingRef = React.useRef<{
    shortcut: string;
    pressedAt: number;
    timeout: ReturnType<typeof setTimeout>;
  } | null>(null);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      recordingRef.current = false;
      if (pendingModifierRecordingRef.current) {
        clearTimeout(pendingModifierRecordingRef.current.timeout);
        pendingModifierRecordingRef.current = null;
      }
      modifierRecordingPressedAtRef.current = null;
      const inhibitionID = recordingInhibitionRef.current;
      recordingInhibitionRef.current = null;

      if (inhibitionID !== null) {
        void window.settingsAPI.endShortcutRecording(inhibitionID);
      }
    };
  }, []);

  React.useEffect(() => {
    return window.settingsAPI.onShortcutRecordingEvent((input) => {
      if (!recordingRef.current || !shortcutRef.current) {
        return;
      }

      const pressedKeys = capturedPressedKeysRef.current;
      const repeat = input.type === 'keydown' && pressedKeys.has(input.code);

      if (input.type === 'keydown') {
        pressedKeys.add(input.code);
      } else {
        pressedKeys.delete(input.code);
      }

      const hasPressed = (prefix: string) =>
        Array.from(pressedKeys).some((code) => code.startsWith(prefix));
      const location = input.code.startsWith('Numpad')
        ? KeyboardEvent.DOM_KEY_LOCATION_NUMPAD
        : input.code.endsWith('Left')
          ? KeyboardEvent.DOM_KEY_LOCATION_LEFT
          : input.code.endsWith('Right')
            ? KeyboardEvent.DOM_KEY_LOCATION_RIGHT
            : KeyboardEvent.DOM_KEY_LOCATION_STANDARD;

      shortcutRef.current.dispatchEvent(
        new KeyboardEvent(input.type, {
          altKey: hasPressed('Alt'),
          bubbles: true,
          cancelable: true,
          code: input.code,
          ctrlKey: hasPressed('Control'),
          key: getKeyValueFromCode(input.code),
          location,
          metaKey: hasPressed('Meta'),
          repeat,
          shiftKey: hasPressed('Shift'),
        })
      );
    });
  }, []);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(
    () => setShortcut(impl.normalizeInput(props.initialValue)),
    [impl, props.initialValue]
  );

  // This method checks if the given hotkey is valid. A hotkey is valid if it contains
  // exactly one key and any number of modifier keys. If explicitly allowed, a standalone
  // modifier may occur once or twice.
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
    // modifiers. A standalone modifier may occur once or twice when explicitly allowed.
    let hasKey = false;
    let hasModifier = false;
    for (const part of parts) {
      if (impl.isValidKey(part)) {
        if (hasKey) {
          return false;
        }
        hasKey = true;
      } else if (!impl.isValidModifier(part)) {
        return false;
      } else {
        hasModifier = true;
      }
    }

    return (
      (hasKey && (props.useModifiers || !hasModifier)) ||
      (props.isStandaloneModifierAllowed && getModifierShortcutTapCount(shortcut) > 0)
    );
  };

  const commitShortcut = (newShortcut: string) => {
    setShortcut(newShortcut);
    props.onChange?.(newShortcut);
  };

  const endRecordingInhibition = () => {
    const inhibitionID = recordingInhibitionRef.current;
    recordingInhibitionRef.current = null;

    if (inhibitionID !== null) {
      void window.settingsAPI.endShortcutRecording(inhibitionID);
    }
  };

  const clearPendingModifierRecording = () => {
    if (pendingModifierRecordingRef.current) {
      clearTimeout(pendingModifierRecordingRef.current.timeout);
      pendingModifierRecordingRef.current = null;
    }
    modifierRecordingPressedAtRef.current = null;
  };

  const finishRecording = (newShortcut: string) => {
    clearPendingModifierRecording();
    recordingRef.current = false;
    capturedPressedKeysRef.current.clear();
    setRecording(false);
    endRecordingInhibition();
    commitShortcut(newShortcut);
  };

  const startRecording = async () => {
    clearPendingModifierRecording();
    setIsStartingRecording(true);

    try {
      const inhibitionID = await window.settingsAPI.beginShortcutRecording();

      if (!isMountedRef.current) {
        if (inhibitionID > 0) {
          await window.settingsAPI.endShortcutRecording(inhibitionID);
        }
        return;
      }

      if (inhibitionID <= 0) {
        return;
      }

      recordingInhibitionRef.current = inhibitionID;
      setIsPopoverOpen(false);
      setShortcut('');
      recordingRef.current = true;
      capturedPressedKeysRef.current.clear();
      setRecording(true);
      requestAnimationFrame(() => shortcutRef.current?.focus());
    } catch (error) {
      console.error('Failed to inhibit shortcuts for recording:', error);
    } finally {
      if (isMountedRef.current) {
        setIsStartingRecording(false);
      }
    }
  };

  const cycleModifierAt = (index: number) => {
    const parts = shortcut.split('+');
    const tapCount = getModifierShortcutTapCount(shortcut);

    if (tapCount === 2) {
      const modifier = cycleModifierSide(parts[index]);
      parts.fill(modifier);
    } else {
      parts[index] = cycleModifierSide(parts[index]);
    }
    const newShortcut = impl.normalizeInput(parts.join('+'));

    if (isValid(newShortcut)) {
      commitShortcut(newShortcut);
    }
  };

  const canSelectModifierSides =
    props.mode === 'key-names' && props.isModifierSideSelectionAllowed;

  const renderShortcut = (value: string) => (
    <ShortcutLabel
      formatPart={(part) => impl.formatInput(part)}
      isCompact={props.mode === 'key-names' && cIsMac}
      isModifier={(part) => impl.isValidModifier(part)}
      shortcut={value}
    />
  );

  const recordInput = (event: React.KeyboardEvent<HTMLElement>) => {
    const pendingModifier = pendingModifierRecordingRef.current;

    // If the same modifier is pressed a second time before the single-press timeout,
    // record it twice. We wait for the corresponding key-up event before committing it
    // so that global shortcuts are not restored while the key is still held down.
    if (event.type === 'keydown' && !event.repeat && pendingModifier) {
      const secondPress = impl.recordInput(event, '').shortcut;

      if (
        secondPress === pendingModifier.shortcut &&
        performance.now() - pendingModifier.pressedAt <=
          DOUBLE_MODIFIER_SHORTCUT_INTERVAL_MS
      ) {
        clearPendingModifierRecording();
        setShortcut(`${secondPress}+${secondPress}`);
        event.preventDefault();
        return;
      }
    }

    const result = impl.recordInput(event, shortcut);
    setShortcut(result.shortcut);

    if (
      event.type === 'keydown' &&
      !event.repeat &&
      getModifierShortcutTapCount(result.shortcut) === 1
    ) {
      modifierRecordingPressedAtRef.current = performance.now();
    }

    if (result.isComplete && isValid(result.shortcut)) {
      const tapCount = getModifierShortcutTapCount(result.shortcut);

      if (tapCount === 1 && props.isStandaloneModifierAllowed) {
        const pressedAt = modifierRecordingPressedAtRef.current || performance.now();
        const remainingTime = Math.max(
          0,
          DOUBLE_MODIFIER_SHORTCUT_INTERVAL_MS - (performance.now() - pressedAt)
        );

        if (pendingModifierRecordingRef.current) {
          clearTimeout(pendingModifierRecordingRef.current.timeout);
        }
        const timeout = setTimeout(() => finishRecording(result.shortcut), remainingTime);
        pendingModifierRecordingRef.current = {
          shortcut: result.shortcut,
          pressedAt,
          timeout,
        };
      } else {
        finishRecording(result.shortcut);
      }
    }

    event.preventDefault();
  };

  const popoverContent = (
    <div
      aria-label={i18next.t('settings.shortcut-keys')}
      className={classes.popoverContent}
      role="dialog">
      {canSelectModifierSides ? <p>{i18next.t('settings.shortcut-side-hint')}</p> : null}
      <div className={classes.shortcutKeys} role="group">
        {(() => {
          const occurrences = new Map<string, number>();
          return shortcut.split('+').map((part) => {
            const occurrence = occurrences.get(part) || 0;
            occurrences.set(part, occurrence + 1);
            return { part, key: `${part}-${occurrence}` };
          });
        })().map(({ part, key }, index) => {
          const canSelectSide = canSelectModifierSides && impl.isValidModifier(part);
          const keyCap = <kbd>{renderShortcut(part)}</kbd>;

          if (canSelectSide) {
            return (
              <button
                key={key}
                aria-label={i18next.t('settings.shortcut-change-modifier-side', {
                  modifier: impl.formatInput(part),
                })}
                className={classes.shortcutKey}
                type="button"
                onClick={() => cycleModifierAt(index)}>
                {keyCap}
              </button>
            );
          }

          return (
            <span key={key} className={classes.shortcutKey}>
              {keyCap}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <SettingsRow info={props.info} isGrowing={props.isGrowing} label={props.label}>
      <div className={classes.shortcutPicker}>
        <Popover
          content={popoverContent}
          isVisible={isPopoverOpen ? shortcut.length > 0 : false}
          position="bottom"
          onClose={() => setIsPopoverOpen(false)}>
          <div
            ref={shortcutRef}
            aria-label={
              recording
                ? props.recordingPlaceholder
                : shortcut || props.placeholder || i18next.t('settings.not-bound')
            }
            aria-expanded={isPopoverOpen}
            aria-haspopup="dialog"
            className={cx({ shortcutDisplay: true, recording })}
            role="button"
            style={!props.isGrowing ? { maxWidth: '100px' } : undefined}
            tabIndex={0}
            onClick={() => {
              if (!recording && shortcut) {
                setIsPopoverOpen(!isPopoverOpen);
              }
            }}
            onKeyDown={(event) => {
              if (recording) {
                recordInput(event);
              } else if ((event.key === 'Enter' || event.key === ' ') && shortcut) {
                setIsPopoverOpen(!isPopoverOpen);
                event.preventDefault();
              }
            }}
            onKeyUp={(event) => {
              if (recording) {
                recordInput(event);
              }
            }}>
            <kbd className={cx({ shortcutSummary: true, placeholder: !shortcut })}>
              {recording
                ? props.recordingPlaceholder
                : shortcut
                  ? renderShortcut(shortcut)
                  : props.placeholder || i18next.t('settings.not-bound')}
            </kbd>
          </div>
        </Popover>
        <Button
          isGrouped
          isDisabled={isStartingRecording}
          icon={recording ? <TbPlayerStopFilled /> : <TbPlayerRecordFilled />}
          variant="secondary"
          onClick={() => {
            if (!recording) {
              void startRecording();
            } else {
              if (shortcut && isValid(shortcut)) {
                finishRecording(shortcut);
              } else {
                finishRecording(impl.normalizeInput(props.initialValue));
              }
            }
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
  /**
   * Creates a new KeyNameImpl instance. If useModifiers is set, modifiers will be allowed
   * in the shortcuts recorded by this instance.
   */
  constructor(private useModifiers: boolean) {}

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
  public recordInput(event: React.KeyboardEvent<HTMLElement>, shortcut: string) {
    const parts = this.normalizeInput(shortcut)
      .split('+')
      .filter((part) => part !== '');

    if (event.type === 'keyup') {
      return {
        shortcut: parts.join('+'),
        isComplete: parts.length > 0,
      };
    }

    const push = (part: string) => {
      if (!parts.includes(part)) {
        parts.push(part);
      }
    };

    if (this.useModifiers) {
      if (event.ctrlKey) {
        push('Control');
      }

      if (event.shiftKey) {
        push('Shift');
      }

      if (event.altKey) {
        push(cIsMac ? 'Option' : 'Alt');
      }

      if (event.metaKey) {
        push(cIsMac ? 'Command' : 'Meta');
      }
    }

    let key = KeyMapper.getName(event.nativeEvent);

    // Fix the case of the key.
    key = this.normalizeInput(key);

    const isKey = this.isValidKey(key);

    if (isKey) {
      parts.push(key);
    }

    return {
      shortcut: this.normalizeInput(parts.join('+')),
      isComplete: false,
    };
  }

  /**
   * This method formats a shortcut for display. On macOS, modifier names are replaced
   * with the standard keyboard symbols while the stored accelerator remains unchanged.
   *
   * @param shortcut The normalized shortcut to format.
   * @returns The shortcut as it should be displayed in the input field.
   */
  public formatInput(shortcut: string): string {
    if (!cIsMac) {
      return shortcut;
    }

    const parts = shortcut.split('+');
    const keyCount = parts.filter((part) => this.isValidKey(part)).length;
    const canUseSymbols =
      keyCount <= 1 &&
      parts.every((part) => this.isValidModifier(part) || this.isValidKey(part));

    if (!canUseSymbols) {
      return shortcut;
    }

    return formatShortcutForDisplay(shortcut, true);
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
    // Accept the standard macOS keyboard symbols used by formatInput().
    if (cIsMac) {
      for (const [symbol, name] of MAC_MODIFIER_NAMES) {
        shortcut = shortcut.split(symbol).join(`${name}+`);
      }

      // A user may type a separator after a symbol even though the formatted value does
      // not contain one.
      shortcut = shortcut.replace(/\++/g, '+');
    }

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

    // Resolve shorthand modifier names and normalize optional side suffixes. Use native
    // macOS modifier names in the settings UI as they are less confusing on that system.
    parts = parts.map((part) => {
      const lowerPart = part.toLowerCase();
      const side = lowerPart.endsWith('left')
        ? 'Left'
        : lowerPart.endsWith('right')
          ? 'Right'
          : '';
      const base = side ? part.slice(0, -side.length) : part;

      const modifierNames = new Map([
        ['Ctrl', 'Control'],
        ['Cmd', 'Command'],
        ['Commandorcontrol', 'CommandOrControl'],
        ['Cmdorctrl', 'CmdOrCtrl'],
        ['Altgr', 'AltGr'],
      ]);
      let normalizedBase = modifierNames.get(base) || base;

      if (cIsMac) {
        const macModifiers = new Map([
          ['Alt', 'Option'],
          ['Meta', 'Command'],
        ]);
        normalizedBase = macModifiers.get(normalizedBase) || normalizedBase;
      }

      if (normalizedBase === 'Esc') {
        normalizedBase = 'Escape';
      }

      return `${normalizedBase}${side}`;
    });

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
      /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)(Left|Right)?$/;
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
   * Creates a new KeyCodeImpl instance. If useModifiers is set, modifiers will be allowed
   * in the shortcuts recorded by this instance.
   */
  constructor(private useModifiers: boolean) {}

  /**
   * This method appends the key code of the given KeyboardEvent to the input field. If
   * the input field contains a valid shortcut after appending the key code, the method
   * returns true to indicate that the shortcut is complete.
   *
   * @param event The KeyboardEvent to get the shortcut for.
   * @returns True if the shortcut is complete, false otherwise.
   */
  public recordInput(event: React.KeyboardEvent<HTMLElement>, shortcut: string) {
    if (event.type === 'keyup') {
      const parts = shortcut.split('+').filter((part) => part !== '');
      return {
        shortcut,
        isComplete: parts.length > 0,
      };
    }

    const parts = shortcut.split('+').filter((part) => part !== '');

    // Only add the key code if it is not in the list already.
    if (parts.includes(event.code)) {
      return { shortcut, isComplete: false };
    }

    if (
      this.useModifiers ||
      (!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey)
    ) {
      parts.push(event.code);
    }

    return {
      shortcut: parts.join('+'),
      isComplete: false,
    };
  }

  /**
   * Key codes describe physical keys, so they should be displayed without
   * platform-specific substitutions.
   *
   * @param shortcut The shortcut to format.
   * @returns The unchanged shortcut.
   */
  public formatInput(shortcut: string): string {
    return shortcut;
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

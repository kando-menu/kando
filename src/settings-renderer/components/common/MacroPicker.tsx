//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import JSON5 from 'json5';
import { TbPlayerRecordFilled, TbPlayerStopFilled } from 'react-icons/tb';
import classNames from 'classnames/bind';

import { IMacroEvent } from '../../../common/item-types/macro-item-type';
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';
import { Button } from '.';

import * as classes from './MacroPicker.module.scss';
const cx = classNames.bind(classes);

interface IProps {
  /**
   * Function to call when the value changes. This will be called when the user recorded a
   * new macro or clicked outside of the text field.
   */
  onChange?: (events: IMacroEvent[]) => void;

  /** Initial value of the macro picker. */
  initialValue: IMacroEvent[];

  /** Placeholder text to display when the macro picker is not recording. */
  placeholder?: string;

  /** Placeholder text to display when the macro picker is recording. */
  recordingPlaceholder?: string;
}

/**
 * This component is an input field that allows the user to record a keyboard macro.
 *
 * @param props - The properties for the macro-picker component.
 * @returns A macro-picker element.
 */
export default function MacroPicker(props: IProps) {
  const [textValue, setTextValue] = React.useState(convertToString(props.initialValue));
  const [recording, setRecording] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(
    () => setTextValue(convertToString(props.initialValue)),
    [props.initialValue]
  );

  return (
    <div className={classes.macroPicker}>
      <textarea
        ref={inputRef}
        spellCheck="false"
        className={cx({ recording, invalid: !convertToMacro(textValue) })}
        value={textValue}
        placeholder={recording ? props.recordingPlaceholder : props.placeholder}
        onChange={(event) => {
          if (!recording) {
            const start = event.target.selectionStart;
            const end = event.target.selectionEnd;

            setTextValue(normalizeInput(event.target.value));

            // We restore the cursor position.
            setTimeout(() => {
              event.target.setSelectionRange(start, end);
            }, 0);
          }
        }}
        onKeyDown={(event) => {
          if (recording) {
            recordInput(event);
            setTextValue(event.currentTarget.value);
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          if (recording) {
            recordInput(event);
            setTextValue(event.currentTarget.value);
            event.preventDefault();
          }
        }}
        onBlur={(event) => {
          // If the user clicked the record button, the next focused element is the
          // button. In this case, we ignore this event and handle stopping the
          // recording in the button's onClick handler.
          if (event.relatedTarget) {
            return;
          }

          if (recording) {
            setRecording(false);
          }

          const macro = convertToMacro(textValue);
          if (macro) {
            props.onChange?.(macro);
          }
        }}
      />
      <Button
        variant="secondary"
        grouped
        icon={recording ? <TbPlayerStopFilled /> : <TbPlayerRecordFilled />}
        onClick={() => {
          if (recording) {
            const macro = convertToMacro(textValue);
            if (macro) {
              props.onChange?.(macro);
            }
          } else {
            setTextValue('');
            inputRef.current?.focus();
          }
          setRecording(!recording);
        }}
      />
    </div>
  );
}

/**
 * This method normalizes the given macro. It properly formats the JSON input and turns
 * the key codes to proper CamelCase. All key codes are matched against the available key
 * codes in common/key-codes.ts.
 *
 * @param input The input to normalize.
 * @returns The normalized macro.
 */
function normalizeInput(input: string): string {
  let macro;

  // Try to parse the input as JSON. If this fails, return the input as is.
  try {
    macro = JSON5.parse('[' + input + ']');
  } catch (error) {
    return input;
  }

  // Each element must be an object with a type and a key.
  macro.forEach((event: IMacroEvent) => {
    if (event.key) {
      event.key = fixKeyCodeCase(event.key);
    }

    // If a delay is given, it must be a number.
    if (event.delay && typeof event.delay === 'string') {
      event.delay = parseInt(event.delay);
    }

    // The type must be spelled either 'keyDown' or 'keyUp'. We fix the case here.
    if (event.type && typeof event.type === 'string') {
      if (event.type.toLowerCase() === 'keydown') {
        event.type = 'keyDown';
      } else if (event.type.toLowerCase() === 'keyup') {
        event.type = 'keyUp';
      }
    }
  });

  return convertToString(macro);
}

/**
 * This method appends the key code of the given KeyboardEvent to the input field.
 *
 * @param event The KeyboardEvent to get the macro for.
 */
function recordInput(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const macro = JSON5.parse('[' + event.currentTarget.value + ']' || '[]');

  macro.push({
    type: event.type === 'keydown' ? 'keyDown' : 'keyUp',
    key: event.code,
    delay: 10,
  });

  event.currentTarget.value = convertToString(macro);
}

/**
 * This method converts the given macro to a string as displayed in the input field. It
 * removes all line breaks and spaces, and formats the JSON string to be more readable.
 *
 * @param macro The macro to convert.
 * @returns The string representation of the macro.
 */
function convertToString(macro: IMacroEvent[]): string {
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
 * This method checks if the given macro is valid. A macro is valid if it is an array of
 * IMacroEvent objects. Each IMacroEvent object must have a type and a key. The key must
 * be a valid key code. There can be an optional delay, and there must be no other
 * properties. I t returns the parsed macro if it is valid, or null if it is not.
 *
 * @param input The normalized input to validate and convert.
 * @returns The parsed macro if it is valid, or null if it is not.
 */
function convertToMacro(input: string): IMacroEvent[] | null {
  let macro;

  // Try to parse the input as JSON. If this fails, return false.
  try {
    macro = JSON5.parse('[' + input + ']');
  } catch (error) {
    return null;
  }

  // Each element must be an object with a type and a key.
  const valid = macro.every((event: IMacroEvent) => {
    // There must be a key property.
    if (
      event.key === undefined ||
      typeof event.key !== 'string' ||
      !isKnownKeyCode(event.key)
    ) {
      return false;
    }

    // There must be a type property.
    if (
      event.type === undefined ||
      typeof event.type !== 'string' ||
      (event.type !== 'keyDown' && event.type !== 'keyUp')
    ) {
      return false;
    }

    // If a delay is given, it must be a number.
    if (event.delay !== undefined && typeof event.delay !== 'number') {
      return false;
    }

    // There must be no other properties.
    for (const key of Object.keys(event)) {
      if (key !== 'type' && key !== 'key' && key !== 'delay') {
        return false;
      }
    }

    return true;
  });

  // If the macro is valid, return it. Otherwise, return null.
  if (valid) {
    return macro;
  }

  return null;
}

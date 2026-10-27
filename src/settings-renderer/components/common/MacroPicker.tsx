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

import { MacroEvent } from '../../../common/';
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';
import {
  convertMacroToString as convertToString,
  getMacroEventIndexAt,
  insertMacroEvent,
} from '../../utils/macro-utils';
import { Button } from '.';

import * as classes from './MacroPicker.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /**
   * Function to call when the value changes. This will be called when the user recorded a
   * new macro or clicked outside of the text field.
   */
  readonly onChange?: (events: MacroEvent[]) => void;

  /** Initial value of the macro picker. */
  readonly initialValue: MacroEvent[];

  /** Placeholder text to display when the macro picker is not recording. */
  readonly placeholder?: string;

  /** Placeholder text to display when the macro picker is recording. */
  readonly recordingPlaceholder?: string;
};

/**
 * This component is an input field that allows the user to record a keyboard macro.
 *
 * @param props - The properties for the macro-picker component.
 * @returns A macro-picker element.
 */
export default function MacroPicker(props: Props) {
  const [textValue, setTextValue] = React.useState(() =>
    convertToString(props.initialValue)
  );
  const [recording, setRecording] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // The index at which the next recorded event will be inserted into the macro.
  const insertIndexRef = React.useRef(0);

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
        className={cx({ recording, invalid: !convertToMacro(textValue) })}
        placeholder={recording ? props.recordingPlaceholder : props.placeholder}
        spellCheck="false"
        value={textValue}
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
            recordInput(event, insertIndexRef.current++);
            setTextValue(event.currentTarget.value);
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          if (recording) {
            recordInput(event, insertIndexRef.current++);
            setTextValue(event.currentTarget.value);
            event.preventDefault();
          }
        }}
      />
      <Button
        isGrouped
        icon={recording ? <TbPlayerStopFilled /> : <TbPlayerRecordFilled />}
        variant="secondary"
        onClick={() => {
          if (recording) {
            const macro = convertToMacro(textValue);
            if (macro) {
              props.onChange?.(macro);
            }
          } else {
            // New events are inserted at the caret position. If the current text is not
            // a valid macro, we start from scratch.
            if (convertToMacro(textValue)) {
              const caret = inputRef.current?.selectionStart ?? textValue.length;
              insertIndexRef.current = getMacroEventIndexAt(textValue, caret);
            } else {
              setTextValue('');
              insertIndexRef.current = 0;
            }
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
  macro.forEach((event: MacroEvent) => {
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
 * This method inserts the key code of the given KeyboardEvent into the input field.
 *
 * @param event The KeyboardEvent to get the macro for.
 * @param index The index at which the new macro event is inserted.
 */
function recordInput(event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) {
  event.currentTarget.value = insertMacroEvent(event.currentTarget.value, index, {
    type: event.type === 'keydown' ? 'keyDown' : 'keyUp',
    key: event.code,
    delay: 10,
  });
}

/**
 * This method checks if the given macro is valid. A macro is valid if it is an array of
 * MacroEvent objects. Each MacroEvent object must have a type and a key. The key must be
 * a valid key code. There can be an optional delay, and there must be no other
 * properties. I t returns the parsed macro if it is valid, or null if it is not.
 *
 * @param input The normalized input to validate and convert.
 * @returns The parsed macro if it is valid, or null if it is not.
 */
function convertToMacro(input: string): MacroEvent[] | null {
  let macro;

  // Try to parse the input as JSON. If this fails, return false.
  try {
    macro = JSON5.parse('[' + input + ']');
  } catch (error) {
    return null;
  }

  // Each element must be an object with a type and a key.
  const valid = macro.every((event: MacroEvent) => {
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

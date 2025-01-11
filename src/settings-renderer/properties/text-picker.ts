//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

/**
 * This class displays a text input field with an optional button next to it which allows
 * the user to type or "record" any text. This is useful for recording key combinations,
 * macros, or other text-based input.
 *
 * This class does not implement the normalization and validation of the input. This
 * should be done by derived classes.
 *
 * @fires change - When the user selects a valid new input. The event contains the new and
 *   validated input text.
 */
export class TextPicker extends EventEmitter {
  /** The div which contains the input field. */
  private container: HTMLElement = null;

  /** The input field for directly editing the shortcut. */
  protected input: HTMLTextAreaElement = null;

  /**
   * Creates a new TextPicker. You must call getContainer() to get the container which
   * contains the picker.
   *
   * @param options - The options for the text picker.
   */
  constructor(options: {
    label: string;
    hint: string;
    lines: number;
    placeholder: string;
    recordingPlaceholder: string;
    enableRecording: boolean;
    resetOnBlur: boolean;
  }) {
    super();

    // Create the container.
    this.container = document.createElement('div');

    // Render the template.
    const template = require('./templates/text-picker-option.hbs');
    this.container.innerHTML = template({
      label: options.label,
      hint: options.hint,
      placeholder: options.placeholder,
      recordButton: options.enableRecording,
      lines: options.lines,
    });

    // Validate the input field when the user types something. If the input is valid, we
    // emit a 'change' event.
    this.input = this.container.querySelector('textarea');
    this.input.addEventListener('input', () => {
      const value = this.normalizeInput(this.input.value);
      if (this.isValid(value)) {
        this.input.classList.remove('invalid');

        const start = this.input.selectionStart;
        const end = this.input.selectionEnd;

        this.input.value = value;
        this.emit('change', this.input.value);

        // We restore the cursor position.
        this.input.setSelectionRange(start, end);
      } else {
        this.input.classList.add('invalid');
      }
    });

    // Set up the recording functionality. If the user clicks the button, we enter a mode
    // where the next key presses are recorded and transformed into a value for the input
    // field.
    if (options.enableRecording) {
      let originalValue = '';
      let recording = false;

      // Reverts the input field to its original state.
      const reset = () => {
        recording = false;
        this.input.placeholder = options.placeholder;
        this.container.querySelector('.input-group').classList.remove('recording');
        window.removeEventListener('click', abortHandler);
        window.removeEventListener('blur', abortHandler);
        window.removeEventListener('keydown', keyHandler, true);
        window.removeEventListener('keyup', keyHandler, true);
      };

      // Reset the input field to the original state when the user clicks anywhere on
      // the screen.
      const abortHandler = (event: MouseEvent) => {
        event.stopPropagation();
        if (options.resetOnBlur) {
          this.input.value = originalValue;
        }
        reset();
      };

      // Update the input field when the user presses a key. If the key is a valid part
      // of a shortcut, we update the input field accordingly. If the shortcut is
      // complete, we reset the input field to its original state and emit a 'change'
      // event.
      const keyHandler = (event: KeyboardEvent) => {
        event.stopPropagation();
        event.preventDefault();

        // recordInput returns true if we should stop recording. If so, we reset the
        // input field to its original state and emit a 'change' event.
        const complete = this.recordInput(event);

        if (this.isValid(this.input.value)) {
          this.input.classList.remove('invalid');
          this.emit('change', this.input.value);
        }

        if (complete) {
          reset();
          this.input.classList.remove('invalid');
        }
      };

      // The recording mode is aborted when...
      // ... the user clicks anywhere on the screen
      // ... the user entered a valid key combination
      const recordButton = this.container.querySelector('button');
      recordButton.addEventListener('click', (event) => {
        event.stopPropagation();

        if (recording) {
          abortHandler(event);
          return;
        }

        recording = true;
        originalValue = this.input.value;
        this.input.placeholder = options.recordingPlaceholder;
        this.input.value = '';

        this.container.querySelector('.input-group').classList.add('recording');

        window.addEventListener('click', abortHandler);
        window.addEventListener('blur', abortHandler);
        window.addEventListener('keydown', keyHandler, true);
        window.addEventListener('keyup', keyHandler, true);
      });
    }
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * This method sets the value of the picker. The value is normalized and validated
   * before it is set. If the value is invalid, the input field is marked as invalid.
   *
   * @param value The value to set.
   */
  public setValue(value: string) {
    value = this.normalizeInput(value);
    this.input.value = value;
    if (this.isValid(value)) {
      this.input.classList.remove('invalid');
    } else {
      this.input.classList.add('invalid');
    }
  }

  /**
   * This method should "normalize" the given user input. For instance, it could convert
   * all characters to uppercase or remove trailing and leading whitespace.
   *
   * @param value The input to normalize.
   * @returns The normalized value.
   */
  protected normalizeInput(value: string): string {
    return value;
  }

  /**
   * Derived methods should check if the given input is valid.
   *
   * @param value The normalized value to validate.
   * @returns True if the value is valid, false otherwise.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isValid(value: string): boolean {
    return true;
  }

  /**
   * During recording, this method is called for each KeyboardEvent. Derived classes
   * should implement this method to transform the KeyboardEvent into a string
   * representation of the input. Derived classes should directly modify the input field
   * even if the input is not yet complete or valid. The input field will be reset to its
   * original state when the recording is aborted.
   *
   * The method should return true if the recording should be stopped after the event.
   *
   * @param event The KeyboardEvent to get the shortcut for.
   * @returns False if the recording should be continued, true otherwise.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected recordInput(event: KeyboardEvent): boolean {
    return false;
  }
}

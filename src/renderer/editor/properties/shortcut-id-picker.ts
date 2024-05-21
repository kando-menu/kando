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
 * This shortcut picker is used if the backend does not support custom shortcuts but only
 * global bindings which need to be set in the operation system settings.
 *
 * The picker only accepts lowercase ascii characters and no whitespace.
 *
 * @fires changed - When the user selects a new valid shortcut ID. The event contains the
 *   new ID as an argument.
 */
export class ShortcutIDPicker extends EventEmitter {
  /** The input field for editing the ID. */
  private input: HTMLInputElement = null;

  /**
   * Creates a new ShortcutIDPicker and appends it to the given container.
   *
   * @param container - The container to which the icon picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    // Render the template.
    const template = require('./templates/shortcut-picker.hbs');
    container.innerHTML = template({
      placeholder: 'Not Bound',
      recordButton: false,
    });

    // Validate the input field when the user types something. If the input is valid, we
    // emit a 'changed' event.
    this.input = container.querySelector('input');
    this.input.addEventListener('input', () => {
      const start = this.input.selectionStart;
      const end = this.input.selectionEnd;

      const shortcut = this.normalizeShortcut(this.input.value);
      this.input.value = shortcut;
      this.emit('changed', this.input.value);

      // We restore the cursor position.
      this.input.setSelectionRange(start, end);
    });
  }

  /**
   * This method sets the shortcut ID. The shortcut is normalized before it is set.
   *
   * @param id The id to set.
   */
  public setValue(id: string) {
    id = this.normalizeShortcut(id);
    this.input.value = id;
  }

  /**
   * This method normalizes the given shortcut ID. It replaces all whitespace with '-' and
   * transforms it to lowercase. All non-ascii characters are removed.
   *
   * @param id The shortcut ID to normalize.
   * @returns The normalized shortcut ID.
   */
  private normalizeShortcut(id: string) {
    // We first remove any whitespace and transform the shortcut to lowercase.
    id = id.replace(/\s/g, '-').toLowerCase();

    // We only allow lowercase ascii characters.
    return id.replace(/[^a-z0-9-]/g, '');
  }
}

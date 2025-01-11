//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { TextPicker } from './text-picker';

/**
 * This shortcut picker is used if the backend does not support custom shortcuts but only
 * global bindings which need to be set in the operation system settings.
 *
 * The picker only accepts lowercase ascii characters and no whitespace.
 */
export class ShortcutIDPicker extends TextPicker {
  /**
   * Creates a new ShortcutIDPicker and appends it to the given container. You must call
   * getContainer() of the parent class to get the container which contains the picker.
   */
  constructor(hint: string) {
    super({
      label: i18next.t('properties.shortcut-id-picker.label'),
      hint,
      lines: 1,
      placeholder: i18next.t('properties.common.not-bound'),
      recordingPlaceholder: '',
      enableRecording: false,
      resetOnBlur: false,
    });
  }

  /**
   * This method normalizes the given shortcut ID. It replaces all whitespace with '-' and
   * transforms it to lowercase. All non-ascii characters are removed.
   *
   * @param id The shortcut ID to normalize.
   * @returns The normalized shortcut ID.
   */
  protected override normalizeInput(id: string) {
    // We first remove any whitespace and transform the shortcut to lowercase.
    id = id.replace(/\s/g, '-').toLowerCase();

    // We only allow lowercase ascii characters.
    return id.replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Any normalize shortcut id is valid.
   *
   * @returns True.
   */
  protected override isValid() {
    return true;
  }

  /**
   * This picker does not support recording.
   *
   * @returns False.
   */
  protected override recordInput() {
    return false;
  }
}

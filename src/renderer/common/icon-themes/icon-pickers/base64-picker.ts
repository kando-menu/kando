//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IIconPicker } from '../icon-theme-registry';

/**
 * An icon picker which is only a text area. The user can enter a base64 encoded image
 * directly.
 */
export class Base64Picker implements IIconPicker {
  /** The container to which the icon picker is appended. */
  private fragment: DocumentFragment = null;

  /** The textarea where the user can enter a base64 encoded image. */
  private textArea: HTMLTextAreaElement = null;

  /** This callback is called when the user enters a valid base64 encoded image. */
  private onSelectCallback: (icon: string) => void = null;

  /** Creates a new IconPicker and appends it to the given container. */
  constructor() {
    this.fragment = document.createDocumentFragment();

    this.textArea = document.createElement('textarea');
    this.textArea.placeholder = 'data:image/svg;base64,...';
    this.textArea.classList.add('base64-picker');
    this.textArea.classList.add('form-control');
    this.textArea.classList.add('my-3');

    // Validate the input when the user types something.
    this.textArea.addEventListener('input', async () => {
      const img = new Image();
      img.src = this.textArea.value;
      const valid = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

      if (valid) {
        this.textArea.classList.remove('invalid');
        this.onSelectCallback(this.textArea.value);
      } else {
        this.textArea.classList.add('invalid');
      }
    });

    this.fragment.appendChild(this.textArea);
  }

  /** Returns the HTML fragment of the icon picker. */
  public getFragment() {
    return this.fragment;
  }

  /** Registers a callback that is called when the user selects an icon. */
  public onSelect(callback: (icon: string) => void) {
    this.onSelectCallback = callback;
  }

  /** Not used in this implementation. */
  public onClose() {}

  /**
   * Initializes the icon picker. This method will be called after the icon picker is
   * appended to the DOM.
   *
   * @param selectedIcon The icon that is currently selected.
   */
  public init(selectedIcon: string) {
    this.textArea.value = selectedIcon;
  }

  /** Not used in this implementation. */
  public deinit() {}
}

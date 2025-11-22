//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Vec2 } from '../common';

/**
 * The WedgeSeparators class is responsible for rendering the separators between the
 * wedges. The separators are thin and long divs that are rotated to point towards the
 * center of the pie menu.
 */
export class WedgeSeparators {
  /** The div that contains the separators. It covers the entire screen. */
  private div: HTMLDivElement;

  /**
   * The constructor creates the separators container and appends it to the given parent
   * container.
   *
   * @param container The parent element of the wedges container.
   */
  constructor(container: HTMLElement) {
    this.div = document.createElement('div');
    this.div.classList.add('wedge-separators');
    container.appendChild(this.div);
  }

  /**
   * Sets a new set of angles for the separators.
   *
   * @param angles An array of angles in degrees where the separators should be placed.
   * @param position The position of the center of the pie menu in pixels.
   */
  public setSeparators(angles: number[], position: Vec2) {
    const fragment = document.createDocumentFragment();

    // We do not want a separator if there is only one wedge.
    if (angles.length > 1) {
      angles.forEach((angle) => {
        const div = document.createElement('div');
        div.className = 'separator';
        div.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${angle - 90}deg)`;
        div.style.setProperty('--angle', `${angle}deg`);
        fragment.appendChild(div);
      });
    }

    this.div.innerHTML = '';
    this.div.appendChild(fragment);
  }
}

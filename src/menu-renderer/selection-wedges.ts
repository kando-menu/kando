//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../common';

/**
 * The SelectionWedges class is responsible for rendering the background sections of the
 * pie menu. It highlights the section that is currently hovered over and shows separators
 * between the wedges.
 *
 * The separators are thin and long divs that are rotated to point towards the center of
 * the pie menu. The highlighted wedge is drawn using a conic gradient in CSS.
 */
export class SelectionWedges {
  /**
   * The div that contains the separators and which also contains the conic gradient. It
   * covers the entire screen.
   */
  private div: HTMLDivElement;

  /**
   * The constructor creates the wedges container and appends it to the given parent
   * container.
   *
   * @param container The parent element of the wedges container.
   */
  constructor(container: HTMLElement) {
    this.div = document.createElement('div');
    this.div.classList.add('wedges');
    container.appendChild(this.div);
  }

  /**
   * Sets a new set of angles for the separators.
   *
   * @param angles An array of angles in degrees where the separators should be placed.
   * @param position The position of the center of the pie menu in pixels.
   */
  public setSeparators(angles: number[], position: IVec2) {
    const fragment = document.createDocumentFragment();

    // We do not want a separator if there is only one wedge.
    if (angles.length > 1) {
      angles.forEach((angle) => {
        const div = document.createElement('div');
        div.className = 'separator';
        div.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${angle - 90}deg)`;
        fragment.appendChild(div);
      });
    }

    this.div.innerHTML = '';
    this.div.style.setProperty('--center-x', `${position.x}px`);
    this.div.style.setProperty('--center-y', `${position.y}px`);
    this.div.appendChild(fragment);
  }

  /**
   * Highlights a wedge by applying a conic gradient to the wedges container. The wedge is
   * defined by its start and end angle in degrees.
   *
   * @param wedge An object containing the start and end angle of the wedge in degrees.
   */
  public hover(wedge: { start: number; end: number }) {
    this.div.classList.add('hovered');
    this.div.style.setProperty('--start-angle', `${wedge.start}deg`);
    this.div.style.setProperty('--end-angle', `${wedge.end}deg`);
  }

  /** Removes the highlight from the currently hovered wedge. */
  public unhover() {
    this.div.classList.remove('hovered');
  }
}

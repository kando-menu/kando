//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../common';

export class SelectionWedges {
  /**
   * The div that contains the wedges. It covers the entire screen and contains a div for
   * each separator between the wedges and a div for each wedge.
   */
  private div: HTMLDivElement;

  /**
   * The constructor creates the wedges container and appends it to the given parent
   * container.
   *
   * @param container The parent element of the wedges container.
   */
  constructor(private container: HTMLElement) {
    this.div = document.createElement('div');
    this.div.classList.add('wedges');
    this.container.appendChild(this.div);
  }

  /** This method shows the text element by removing the `hidden` class. */
  public setSeparators(angles: number[], position: IVec2) {
    this.div.innerHTML = '';
    this.div.style.setProperty('--center-x', `${position.x}px`);
    this.div.style.setProperty('--center-y', `${position.y}px`);

    // We do not want a angle if there is only one wedge.
    if (angles.length > 1) {
      angles.forEach((angle) => {
        const div = document.createElement('div');
        div.className = 'separator';
        div.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${angle - 90}deg)`;
        this.div.appendChild(div);
      });
    }
  }

  public hover(wedge: { start: number; end: number }) {
    this.div.classList.add('hovered');
    this.div.style.setProperty('--start-angle', `${wedge.start}deg`);
    this.div.style.setProperty('--end-angle', `${wedge.end}deg`);
  }

  public unhover() {
    this.div.classList.remove('hovered');
  }
}

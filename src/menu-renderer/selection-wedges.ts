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

  private wedges: HTMLDivElement[] = [];

  /**
   * The constructor creates the wedges container and appends it to the given parent
   * container.
   *
   * @param container The parent element of the wedges container.
   */
  constructor(private container: HTMLElement) {
    this.div = document.createElement('div');
    this.div.classList.add('wedges-container');
    this.div.classList.add('hidden');
    this.container.appendChild(this.div);
  }

  /** This method shows the text element by removing the `hidden` class. */
  public show(wedges: { start: number; end: number }[], position: IVec2) {
    this.div.innerHTML = '';
    this.wedges = [];

    wedges.forEach((wedge) => {
      // We do not want a separator if there is only one wedge.
      if (wedges.length > 1) {
        const separatorDiv = document.createElement('div');
        separatorDiv.className = 'separator';
        separatorDiv.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${wedge.start - 90}deg)`;
        this.div.appendChild(separatorDiv);
      }

      const wedgeDiv = document.createElement('div');
      wedgeDiv.className = 'wedge';

      // Add start and end angles as CSS variables
      wedgeDiv.style.setProperty('--center-x', `${position.x}px`);
      wedgeDiv.style.setProperty('--center-y', `${position.y}px`);
      wedgeDiv.style.setProperty('--start-angle', `${wedge.start}deg`);
      wedgeDiv.style.setProperty('--end-angle', `${wedge.end}deg`);
      this.wedges.push(wedgeDiv);
      this.div.appendChild(wedgeDiv);
    });
  }

  public hoverChildWedge(index: number) {
    this.wedges.forEach((wedge, i) => {
      if (i === index) {
        wedge.classList.add('hovered');
      } else {
        wedge.classList.remove('hovered');
      }
    });
  }

  public hoverParentWedge() {
    this.hoverChildWedge(this.wedges.length - 1);
  }

  /** This method hides the text element by adding the `hidden` class. */
  public hide() {}
}

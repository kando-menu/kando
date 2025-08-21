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
 * The SelectionWedges class is responsible for rendering the background sections of the
 * pie menu. The wedges are styled by the menu theme, but usually they will use conic
 * gradients to do this.
 */
export class SelectionWedges {
  /** The div that contains the conic gradients. It covers the entire screen. */
  private div: HTMLDivElement;

  /**
   * The constructor creates the wedges container and appends it to the given parent
   * container.
   *
   * @param container The parent element of the wedges container.
   */
  constructor(container: HTMLElement) {
    this.div = document.createElement('div');
    this.div.classList.add('selection-wedges');
    container.appendChild(this.div);
  }

  /**
   * This should be called when a (sub)menu is opened..
   *
   * @param center The position of the center of the pie menu in pixels.
   */
  public setCenter(center: Vec2) {
    this.div.style.setProperty('--center-x', `${center.x}px`);
    this.div.style.setProperty('--center-y', `${center.y}px`);
  }

  /**
   * Highlights a wedge. Menu themes will use the CSS properties to apply a conic gradient
   * to the wedges container. The wedge is defined by its start and end angle in degrees.
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

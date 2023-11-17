//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export class Properties {
  // The container is the HTML element which contains the currently edited menu's
  // properties. It is created in the constructor and returned by the getContainer()
  // method.
  private container: HTMLElement = null;

  /**
   * This constructor creates the HTML elements for the menu properties view and wires up
   * all the functionality.
   */
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'kando-menu-properties';
  }

  /** This method returns the container of the menu preview. */
  public getContainer(): HTMLElement {
    return this.container;
  }
}

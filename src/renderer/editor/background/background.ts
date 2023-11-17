//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/** This is the opaque background which is shown when the editor tools are open. */
export class Background {
  // The container is the HTML element which contains the background. It is created in the
  // constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

  /** This constructor creates the HTML div for the background. */
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'kando-editor-background';
  }

  /** This method returns the background container. */
  public getContainer(): HTMLElement {
    return this.container;
  }
}

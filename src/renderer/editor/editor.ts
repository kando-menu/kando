//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Tooltip } from 'bootstrap';

import { Sidebar } from './sidebar/sidebar';
import { Toolbar } from './toolbar/toolbar';
import { Background } from './background/background';

export class Editor {
  // The container is the HTML element which contains the menu editor.
  private container: HTMLElement = null;

  // The background is an opaque div which is shown when the editor is open. It effectively
  // hides the normal menu.
  private background: Background = null;

  // The sidebar is displayed on the left screen edge. It contains some information
  // about Kando in general.
  private sidebar: Sidebar = null;

  // The toolbar is displayed on the bottom of the screen. It allows the user to
  // switch between different menus, add new items, etc.
  private toolbar: Toolbar = null;

  /**
   * This constructor creates the HTML elements for the menu editor and wires up all the
   * functionality.
   */
  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize the background.
    this.background = new Background();
    this.container.appendChild(this.background.getContainer());

    // Initialize the sidebar.
    this.sidebar = new Sidebar();
    this.sidebar.on('show', () => this.container.classList.add('sidebar-visible'));
    this.sidebar.on('hide', () => this.container.classList.remove('sidebar-visible'));
    this.container.appendChild(this.sidebar.getContainer());

    // Initialize the toolbar.
    this.toolbar = new Toolbar();
    this.toolbar.on('show', () => this.container.classList.add('toolbar-visible'));
    this.toolbar.on('show', () => this.container.classList.remove('sidebar-visible'));
    this.toolbar.on('hide', () => this.container.classList.remove('toolbar-visible'));
    this.container.appendChild(this.toolbar.getContainer());

    // Initialize all tooltips.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((elem) => {
      new Tooltip(elem, {
        delay: { show: 500, hide: 0 },
      });
    });
  }

  public show() {
    this.container.classList.add('visible');
  }

  public hide() {
    this.container.classList.remove('visible', 'toolbar-visible');
  }

  public hideToolbar() {
    this.container.classList.remove('toolbar-visible');
  }

  public isToolbarVisible(): boolean {
    return this.container.classList.contains('toolbar-visible');
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import { IEditorNode } from './editor-node';
import { Sidebar } from './sidebar/sidebar';
import { Toolbar } from './toolbar/toolbar';
import { Background } from './background/background';

export class Editor extends EventEmitter {
  // The container is the HTML element which contains the menu editor.
  private container: HTMLElement = null;

  // The root node is the node which is placed at the center of the menu. It is the
  // parent of all other nodes. It will be created when the menu is shown and destroyed
  // when the menu is hidden.
  private root: IEditorNode = null;

  // The background is an opaque div which is shown when the editor is open. It effectively
  // hides the normal menu.
  private background: Background = null;

  // The sidebar is displayed on the left screen edge. It contains some information
  // about Kando in general.
  private sidebar: Sidebar = null;

  // The toolbar is displayed on the bottom of the screen. It allows the user to
  // switch between different menus, add new items, etc.
  private toolbar: Toolbar = null;

  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // Initialize the background.
    this.background = new Background();
    this.container.appendChild(this.background.getContainer());

    // Initialize the sidebar.
    this.sidebar = new Sidebar();
    this.container.appendChild(this.sidebar.getContainer());

    // Initialize the toolbar.
    this.toolbar = new Toolbar();
    this.container.appendChild(this.toolbar.getContainer());
  }

  public setMenu(root: IEditorNode) {
    this.root = root;
  }

  public show() {}

  public hide() {
    this.root = null;
  }
}

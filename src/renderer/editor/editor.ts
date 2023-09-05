//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './editor.scss';
import './theme.scss';

import { EventEmitter } from 'events';

import { IEditorNode } from './editor-node';

export class Editor extends EventEmitter {
  // The container is the HTML element which contains the menu editor.
  private container: HTMLElement = null;

  // The root node is the node which is placed at the center of the menu. It is the
  // parent of all other nodes. It will be created when the menu is shown and destroyed
  // when the menu is hidden.
  private root: IEditorNode = null;

  constructor(container: HTMLElement) {
    super();

    this.container = container;
  }

  public setMenu(root: IEditorNode) {
    this.root = root;
  }

  public show() {}

  public hide() {
    this.root = null;
  }
}

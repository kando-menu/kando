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

    const tabs = [
      { id: 'kando-editor-themes-tab', large: true },
      { id: 'kando-menu-themes-tab', large: true },
      { id: 'kando-menus-tab', large: false },
      { id: 'kando-add-items-tab', large: false },
      { id: 'kando-stash-tab', large: false },
      { id: 'kando-trash-tab', large: false },
    ];

    for (const tab of tabs) {
      const element = document.querySelector(`button[data-bs-target="#${tab.id}"]`);
      element.addEventListener('shown.bs.tab', () => {
        if (tab.large) {
          document.querySelector('#kando-editor-toolbar').classList.add('large');
        } else {
          document.querySelector('#kando-editor-toolbar').classList.remove('large');
        }
      });
    }
  }

  public setMenu(root: IEditorNode) {
    this.root = root;
  }

  public show() {}

  public hide() {
    this.root = null;
  }
}

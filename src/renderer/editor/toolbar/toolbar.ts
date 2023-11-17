//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';

/** This class is responsible for the toolbar on the bottom of the editor screen. */
export class Toolbar {
  // The container is the HTML element which contains the toolbar. It is created in the
  // constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

  /**
   * This constructor creates the HTML elements for the toolbar and wires up all the
   * functionality.
   */
  constructor() {
    // Load all the required templates.
    const empty = Handlebars.compile(require('./templates/empty-tab.hbs').default);
    const toolbar = Handlebars.compile(require('./templates/toolbar.hbs').default);

    this.container = document.createElement('div');
    this.container.innerHTML = toolbar({
      tabs: [
        {
          id: 'kando-menus-tab',
          icon: 'apps',
          title: 'Menus',
          active: true,
          content: empty({
            heading: 'Here will be a list of all of your menus!',
            subheading: 'You can add new menus or delete existing ones.',
          }),
        },
        {
          id: 'kando-add-items-tab',
          icon: 'add',
          title: 'Menu Items',
          content: empty({
            heading: 'Here will be a list of things which you can add to your menus!',
            subheading: 'In the future, you can simply drag them to the editor above.',
          }),
        },
        {
          id: 'kando-stash-tab',
          icon: 'content_paste',
          title: 'Stash',
          hasCounter: true,
          content: empty({
            heading: 'In the future, you can temporarily store menu items here!',
            subheading: 'This is especially useful if you want to reorganize your menus.',
          }),
        },
        {
          id: 'kando-trash-tab',
          icon: 'delete',
          title: 'Trash',
          hasCounter: true,
          content: empty({
            heading: 'In the future, you can delete items by dropping them here!',
            subheading: 'When you start Kando the next time, they will be gone.',
          }),
        },
        {
          id: 'kando-menu-themes-tab',
          icon: 'palette',
          title: 'Menu Themes',
          gapBefore: true,
          content: empty({
            heading: 'Here will be a list of available menu themes!',
            subheading:
              'There will be preview images and the possibility to download new themes from the web.',
          }),
        },
        {
          id: 'kando-editor-themes-tab',
          icon: 'palette',
          title: 'Editor Themes',
          content: empty({
            heading: 'Here will be a list of available editor themes!',
            subheading:
              'In the future, it will be possible to theme the entire menu editor.',
          }),
        },
      ],
    });

    this.container.querySelector('#show-editor-button').addEventListener('click', () => {
      // menu.enterEditMode();
      document.querySelector('#kando').classList.add('editor-visible');
      document.querySelector('#kando').classList.remove('sidebar-visible');
    });

    this.container.querySelector('#hide-editor-button').addEventListener('click', () => {
      // menu.exitEditMode();
      document.querySelector('#kando').classList.remove('editor-visible');
    });

    const tabs = [
      { id: 'kando-menus-tab', large: false },
      { id: 'kando-add-items-tab', large: false },
      { id: 'kando-stash-tab', large: false },
      { id: 'kando-trash-tab', large: false },
      { id: 'kando-editor-themes-tab', large: true },
      { id: 'kando-menu-themes-tab', large: true },
    ];

    for (const tab of tabs) {
      const element = this.container.querySelector(`button[data-bs-target="#${tab.id}"]`);
      element.addEventListener('shown.bs.tab', () => {
        if (tab.large) {
          this.container.querySelector('#kando-editor-toolbar').classList.add('large');
        } else {
          this.container.querySelector('#kando-editor-toolbar').classList.remove('large');
        }
      });
    }
  }

  /** This method returns the container of the sidebar. */
  public getContainer(): HTMLElement {
    return this.container;
  }
}

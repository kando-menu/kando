//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';

/**
 * This class is responsible for the sidebar on the left screen edge. It contains some
 * information about Kando in general.
 */
export class Sidebar {
  // The container is the HTML element which contains the sidebar. It is created in the
  // constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

  // The videos are the tutorial videos which are shown in the tutorial tab. We store
  // them here so that we can pause and play them when the tab is shown and hidden.
  private videos: HTMLVideoElement[] = [];

  // This variable stores the index of the last visible video. We use it to pause the
  // video when the tab is hidden.
  private lastVisibleVideo = 0;

  /**
   * This constructor creates the HTML elements for the sidebar and wires up all the
   * functionality.
   */
  constructor() {
    // Load all the required templates.
    const tutorial = Handlebars.compile(require('./templates/tutorial-tab.hbs').default);
    const buttonTab = Handlebars.compile(require('./templates/button-tab.hbs').default);
    const sidebar = Handlebars.compile(require('./templates/sidebar.hbs').default);

    this.container = document.createElement('div');
    this.container.innerHTML = sidebar({
      items: [
        {
          id: 'sidebar-tab-tutorial',
          icon: 'school',
          title: 'Tutorial',
          content: tutorial({ id: 'tutorial-slides' }),
        },
        {
          id: 'sidebar-tab-example-actions',
          icon: 'bug_report',
          title: 'Example Actions',
          content: buttonTab({
            intro:
              "Here are some action buttons which show what the menu could do in the future. Check out the button's tooltips for more information!",
            buttons: [
              {
                id: 'shortcut-button-1',
                class: 'col-6',
                icon: 'keyboard',
                title: 'Ctrl+Alt+Right',
                tooltip:
                  'This shortcut changes to the next virtual workspace on some Linux desktops.',
              },
              {
                id: 'shortcut-button-2',
                class: 'col-6',
                icon: 'keyboard',
                title: 'Alt+Tab',
                tooltip:
                  'On most desktops this will change the active window. This action uses delays between the individual key press events.',
              },
              {
                id: 'shortcut-button-3',
                class: 'col-6',
                icon: 'keyboard',
                title: 'Ctrl+C Ctrl+V',
                tooltip:
                  'This will duplicate any selected text. For this, it copies the currently selected text, moves the cursor to the right and finally pastes the text.',
              },
              {
                id: 'shortcut-button-4',
                class: 'col-6',
                icon: 'keyboard',
                title: 'Meta',
                tooltip: 'This will a main menu on many desktop environments.',
              },
              {
                id: 'url-button',
                class: 'col-6',
                icon: 'public',
                title: 'Open URL',
                tooltip: 'This opens the homepage of Kando.',
              },
              {
                id: 'uri-button',
                class: 'col-6',
                icon: 'folder_open',
                title: 'Open Folder',
                tooltip: 'This opens a file explorer.',
              },
            ],
          }),
        },
        {
          id: 'sidebar-tab-debugging',
          icon: 'ads_click',
          title: 'Debugging',
          content: buttonTab({
            buttons: [
              {
                id: 'dev-tools-button',
                icon: 'code',
                title: 'Show Developer Tools',
                tooltip: 'Open the web developer tools for inspecting the UI.',
              },
            ],
          }),
        },
      ],
    });

    // Add functionality to show and hide the sidebar.
    this.container.querySelector('#show-sidebar-button').addEventListener('click', () => {
      document.querySelector('#kando').classList.add('sidebar-visible');
    });

    this.container.querySelector('#hide-sidebar-button').addEventListener('click', () => {
      document.querySelector('#kando').classList.remove('sidebar-visible');
    });

    // Add the tutorial videos.
    this.container.querySelector('#sidebar-tab-tutorial').addEventListener(
      'show.bs.collapse',
      () => {
        for (let i = 0; i < 5; ++i) {
          this.videos[i] = this.container.querySelector(
            `#tutorial-slides-video-${i + 1}`
          ) as HTMLVideoElement;
          this.videos[i].src = require(`../../../../assets/videos/tutorial-${i + 1}.mp4`);
          this.videos[i].loop = true;
        }
      },
      { once: true }
    );

    // Start playing a video when the tutorial tab is shown.
    this.container
      .querySelector('#sidebar-tab-tutorial')
      .addEventListener('shown.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].currentTime = 0;
        this.videos[this.lastVisibleVideo].play();
      });

    // Pause the last visible video when the tutorial tab is hidden.
    this.container
      .querySelector('#sidebar-tab-tutorial')
      .addEventListener('hidden.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].pause();
      });

    // Start playing a video when its slide is shown and pause the last visible video.
    this.container
      .querySelector('#sidebar-tab-tutorial-content')
      .addEventListener('slide.bs.carousel', (e) => {
        this.videos[this.lastVisibleVideo].pause();
        this.videos[e.to].currentTime = 0;
        this.videos[e.to].play();

        this.lastVisibleVideo = e.to;
      });

    // Show the dev tools if the button is clicked.
    this.container.querySelector('#dev-tools-button').addEventListener('click', () => {
      window.api.showDevTools();
    });

    // Initialize all the example action buttons.
    this.container.querySelector('#shortcut-button-1').addEventListener('click', () => {
      window.api.simulateKeys([
        {
          name: 'ControlLeft',
          down: true,
          delay: 100,
        },
        {
          name: 'AltLeft',
          down: true,
          delay: 0,
        },
        {
          name: 'ArrowRight',
          down: true,
          delay: 0,
        },
        {
          name: 'ArrowRight',
          down: false,
          delay: 0,
        },
        {
          name: 'AltLeft',
          down: false,
          delay: 0,
        },
        {
          name: 'ControlLeft',
          down: false,
          delay: 0,
        },
      ]);
    });

    this.container.querySelector('#shortcut-button-2').addEventListener('click', () => {
      window.api.simulateKeys([
        {
          name: 'AltLeft',
          down: true,
          delay: 0,
        },
        {
          name: 'Tab',
          down: true,
          delay: 0,
        },
        {
          name: 'Tab',
          down: false,
          delay: 0,
        },
        {
          name: 'Tab',
          down: true,
          delay: 1000,
        },
        {
          name: 'Tab',
          down: false,
          delay: 0,
        },
        {
          name: 'AltLeft',
          down: false,
          delay: 1000,
        },
      ]);
    });

    this.container.querySelector('#shortcut-button-3').addEventListener('click', () => {
      window.api.simulateKeys([
        {
          name: 'ControlLeft',
          down: true,
          delay: 100,
        },
        {
          name: 'KeyC',
          down: true,
          delay: 0,
        },
        {
          name: 'KeyC',
          down: false,
          delay: 0,
        },
        {
          name: 'ControlLeft',
          down: false,
          delay: 0,
        },
        {
          name: 'ArrowRight',
          down: true,
          delay: 0,
        },
        {
          name: 'ArrowRight',
          down: false,
          delay: 0,
        },
        {
          name: 'ControlLeft',
          down: true,
          delay: 0,
        },
        {
          name: 'KeyV',
          down: true,
          delay: 0,
        },
        {
          name: 'KeyV',
          down: false,
          delay: 0,
        },
        {
          name: 'ControlLeft',
          down: false,
          delay: 0,
        },
      ]);
    });

    this.container.querySelector('#shortcut-button-4').addEventListener('click', () => {
      window.api.simulateKeys([
        {
          name: 'MetaLeft',
          down: true,
          delay: 0,
        },
        {
          name: 'MetaLeft',
          down: false,
          delay: 0,
        },
      ]);
    });

    this.container.querySelector('#blog-post-button').addEventListener('click', () => {
      window.api.openURI('https://ko-fi.com/post/Editor-Mockups-U6U1PD0K8');
    });

    this.container.querySelector('#url-button').addEventListener('click', () => {
      window.api.openURI('https://github.com/kando-menu/kando');
    });

    this.container.querySelector('#uri-button').addEventListener('click', () => {
      window.api.openURI('file:///');
    });
  }

  /** This method returns the container of the sidebar. */
  public getContainer(): HTMLElement {
    return this.container;
  }
}

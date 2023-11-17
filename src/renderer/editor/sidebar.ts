//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';

export class Sidebar {
  private element: HTMLElement = null;
  private videos: HTMLVideoElement[] = [];
  private lastVisibleVideo = 0;

  constructor(container: HTMLElement) {
    const tutorial = Handlebars.compile(require('./templates/tutorial-tab.hbs').default);
    const buttonTab = Handlebars.compile(require('./templates/button-tab.hbs').default);
    const sidebar = Handlebars.compile(require('./templates/sidebar.hbs').default);

    this.element = document.createElement('div');
    this.element.innerHTML = sidebar({
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
    this.element.querySelector('#show-sidebar-button').addEventListener('click', () => {
      document.querySelector('#kando').classList.add('sidebar-visible');
    });

    this.element.querySelector('#hide-sidebar-button').addEventListener('click', () => {
      document.querySelector('#kando').classList.remove('sidebar-visible');
    });

    // Add the tutorial videos.
    this.element.querySelector('#sidebar-tab-tutorial').addEventListener(
      'show.bs.collapse',
      () => {
        for (let i = 0; i < 5; ++i) {
          this.videos[i] = this.element.querySelector(
            `#tutorial-slides-video-${i + 1}`
          ) as HTMLVideoElement;
          this.videos[i].src = require(`../../../assets/videos/tutorial-${i + 1}.mp4`);
          this.videos[i].loop = true;
        }
      },
      { once: true }
    );

    // Start playing a video when the tutorial tab is shown.
    this.element
      .querySelector('#sidebar-tab-tutorial')
      .addEventListener('shown.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].currentTime = 0;
        this.videos[this.lastVisibleVideo].play();
      });

    // Pause the last visible video when the tutorial tab is hidden.
    this.element
      .querySelector('#sidebar-tab-tutorial')
      .addEventListener('hidden.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].pause();
      });

    // Start playing a video when its slide is shown and pause the last visible video.
    this.element
      .querySelector('#sidebar-tab-tutorial-content')
      .addEventListener('slide.bs.carousel', (e) => {
        this.videos[this.lastVisibleVideo].pause();
        this.videos[e.to].currentTime = 0;
        this.videos[e.to].play();

        this.lastVisibleVideo = e.to;
      });

    // Show the dev tools if the button is clicked.
    this.element.querySelector('#dev-tools-button').addEventListener('click', () => {
      window.api.showDevTools();
    });

    // Initialize all the example action buttons.
    this.element.querySelector('#shortcut-button-1').addEventListener('click', () => {
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

    this.element.querySelector('#shortcut-button-2').addEventListener('click', () => {
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

    this.element.querySelector('#shortcut-button-3').addEventListener('click', () => {
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

    this.element.querySelector('#shortcut-button-4').addEventListener('click', () => {
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

    this.element.querySelector('#blog-post-button').addEventListener('click', () => {
      window.api.openURI('https://ko-fi.com/post/Editor-Mockups-U6U1PD0K8');
    });

    this.element.querySelector('#url-button').addEventListener('click', () => {
      window.api.openURI('https://github.com/kando-menu/kando');
    });

    this.element.querySelector('#uri-button').addEventListener('click', () => {
      window.api.openURI('file:///');
    });

    // Finally, add the sidebar to the container.
    container.appendChild(this.element);
  }
}

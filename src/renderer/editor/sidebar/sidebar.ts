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
  /**
   * The container is the HTML element which contains the sidebar. It is created in the
   * constructor and returned by the getContainer() method.
   */
  private container: HTMLElement = null;

  /**
   * This variable stores the current visibility of the sidebar. This is also stored in
   * the app settings of the main process. We store it here so that we can avoid
   * unnecessary state changes.
   */
  private visible = true;

  /**
   * The videos are the tutorial videos which are shown in the tutorial tab. We store them
   * here so that we can pause and play them when the tab is shown and hidden.
   */
  private videos: HTMLVideoElement[] = [];

  /**
   * This variable stores the index of the last visible video. We use it to pause the
   * video when the tab is hidden.
   */
  private lastVisibleVideo = 0;

  /**
   * This constructor creates the HTML elements for the sidebar and wires up all the
   * functionality.
   */
  constructor() {
    this.loadContent();
    this.initVisibility();
    this.initTutorialVideos();
    this.initExampleActions();
  }

  /**
   * This method sets the visibility of the sidebar. If saveState is true, the new state
   * will be saved to the app settings.
   *
   * @param visible Whether the sidebar should be visible.
   */
  public setVisibility(visible: boolean) {
    if (this.visible !== visible) {
      if (visible) {
        this.container
          .querySelector('#kando-editor-sidebar-area')
          .classList.add('visible');
        this.container.querySelector('#hide-sidebar-button').classList.add('visible');
        this.container.querySelector('#show-sidebar-button').classList.remove('visible');
      } else {
        this.container
          .querySelector('#kando-editor-sidebar-area')
          .classList.remove('visible');
        this.container.querySelector('#hide-sidebar-button').classList.remove('visible');
        this.container.querySelector('#show-sidebar-button').classList.add('visible');
      }

      this.visible = visible;
      window.api.appSettings.set('sidebarVisible', visible);
    }
  }

  /** This method returns the container of the sidebar. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /** This method loads the HTML content of the sidebar. */
  private loadContent() {
    const tutorial = Handlebars.compile(require('./templates/tutorial-tab.hbs').default);
    const buttonTab = Handlebars.compile(require('./templates/button-tab.hbs').default);
    const sidebar = Handlebars.compile(require('./templates/sidebar.hbs').default);

    // Initialize the sidebar content.
    this.container = document.createElement('div');
    this.container.innerHTML = sidebar({
      areaId: 'kando-editor-sidebar-area',
      tabs: [
        {
          id: 'sidebar-tab-tutorial',
          icon: 'school',
          title: 'Tutorial',
          content: tutorial({
            id: 'tutorial-slides',
            slides: [
              {
                heading: 'Click Anywhere:',
                subheading:
                  'You do not have to exactly click on an item, you just have to click somewhere into its wedge!',
              },
              {
                heading: 'Go Back:',
                subheading: 'Quickly navigate one level up by clicking the center item.',
              },
              {
                heading: 'Marking Mode:',
                subheading:
                  'Drag over an item to enter marking mode. If you pause the pointer movement or make a turn, the currently dragged submenu will be opened.',
              },
              {
                heading: 'Turbo Mode:',
                subheading:
                  'If you keep Ctrl pressed after opening the menu, you can perform selections by just moving the pointer. This is the fastest way to select items!',
              },
              {
                heading: 'No accidental selections:',
                subheading:
                  'Final items are only selected as soon as you release your mouse button in "Marking Mode" or Ctrl in "Turbo Mode". Use this to explore the menu!',
              },
            ],
          }),
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
                title: cIsMac ? 'Command+Z' : 'Ctrl+Z',
                tooltip: 'This usually undoes your latest action.',
              },
              {
                id: 'shortcut-button-2',
                class: 'col-6',
                icon: 'keyboard',
                title: cIsMac ? 'Command+Tab' : 'Alt+Tab',
                tooltip:
                  'This will change the active window. This action uses delays between the individual key press events.',
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
                title: cIsMac ? 'Command+Space' : 'Meta',
                tooltip: cIsMac
                  ? 'This will open the Spotlight Search.'
                  : 'This will open a main menu on many desktop environments.',
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
            entries: [
              {
                id: 'command-action',
                class: 'col-12',
                icon: 'send',
                placeholder: 'Run Command',
                tooltip: 'This runs the given shell command.',
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
  }

  /**
   * This method initializes the visibility of the sidebar. There's a button to show the
   * sidebar, a button to hide it and the visibility is also stored in the app settings.
   */
  private initVisibility() {
    // Add functionality to show the sidebar.
    this.container
      .querySelector('#show-sidebar-button')
      .addEventListener('click', () => this.setVisibility(true));

    // Add functionality to hide the sidebar.
    this.container
      .querySelector('#hide-sidebar-button')
      .addEventListener('click', () => this.setVisibility(false));

    // Update of the visibility when the app settings are changed from somewhere else.
    window.api.appSettings.onChange('sidebarVisible', (visible) => {
      this.setVisibility(visible);
    });

    // Initialize the visibility from the app settings.
    window.api.appSettings.get('sidebarVisible').then((visible) => {
      this.setVisibility(visible);
    });
  }

  /**
   * This method initializes the tutorial videos. The videos are loaded from the assets
   * folder and played when the tutorial tab is shown. When the tab is hidden, the last
   * visible video is paused. Also, only the video of the currently visible slide is
   * played.
   */
  private initTutorialVideos() {
    // Add the tutorial videos. We do this here because else webpack will not pick them up.
    this.container.querySelector('#sidebar-tab-tutorial').addEventListener(
      'show.bs.collapse',
      () => {
        for (let i = 0; i < 5; ++i) {
          this.videos[i] = this.container.querySelector(
            `#tutorial-slides-video-${i}`
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
  }

  /**
   * This method initializes the example actions. These are buttons which show what the
   * menu could do in the future.
   */
  private initExampleActions() {
    // Initialize the undo button.
    this.container.querySelector('#shortcut-button-1').addEventListener('click', () => {
      const modifier = cIsMac ? 'MetaLeft' : 'ControlLeft';
      window.api.simulateKeys([
        {
          name: modifier,
          down: true,
          delay: 100,
        },
        {
          name: 'KeyZ',
          down: true,
          delay: 0,
        },
        {
          name: 'KeyZ',
          down: false,
          delay: 0,
        },
        {
          name: modifier,
          down: false,
          delay: 0,
        },
      ]);
    });

    // Initialize the alt-tab button.
    this.container.querySelector('#shortcut-button-2').addEventListener('click', () => {
      const modifier = cIsMac ? 'MetaLeft' : 'AltLeft';
      window.api.simulateKeys([
        {
          name: modifier,
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
          name: modifier,
          down: false,
          delay: 1000,
        },
      ]);
    });

    // Initialize the ctrl-c ctrl-v button.
    this.container.querySelector('#shortcut-button-3').addEventListener('click', () => {
      const modifier = cIsMac ? 'MetaLeft' : 'ControlLeft';
      window.api.simulateKeys([
        {
          name: modifier,
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
          name: modifier,
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
          name: modifier,
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
          name: modifier,
          down: false,
          delay: 0,
        },
      ]);
    });

    // Initialize the meta button.
    this.container.querySelector('#shortcut-button-4').addEventListener('click', () => {
      if (cIsMac) {
        window.api.simulateKeys([
          {
            name: 'MetaLeft',
            down: true,
            delay: 0,
          },
          {
            name: 'Space',
            down: true,
            delay: 0,
          },
          {
            name: 'Space',
            down: false,
            delay: 0,
          },
          {
            name: 'MetaLeft',
            down: false,
            delay: 0,
          },
        ]);
      } else {
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
      }
    });

    this.container.querySelector('#url-button').addEventListener('click', () => {
      window.api.openURI('https://github.com/kando-menu/kando');
    });

    this.container.querySelector('#uri-button').addEventListener('click', () => {
      window.api.openURI('file:///');
    });

    // Initialize the command action button + entry.
    const runCommand = () => {
      const input = this.container.querySelector(
        '#command-action-entry'
      ) as HTMLInputElement;
      window.api.runCommand(input.value);
      input.value = '';
    };

    // Run command on button click.
    this.container
      .querySelector('#command-action-button')
      .addEventListener('click', runCommand);

    // Run command on enter.
    this.container
      .querySelector('#command-action-entry')
      .addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          runCommand();
        }
      });

    // Show the dev tools if the button is clicked.
    this.container.querySelector('#dev-tools-button').addEventListener('click', () => {
      window.api.showDevTools();
    });

    // Currently, there is also a blog post button which links to the blog post about the
    // editor mockups. This will be removed in the future.
    this.container.querySelector('#blog-post-button').addEventListener('click', () => {
      window.api.openURI('https://ko-fi.com/post/Editor-Mockups-U6U1PD0K8');
    });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IBackendInfo, IVersionInfo } from '../../../common';

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
   * The videos are the introduction videos which are shown in the introduction tab. We
   * store them here so that we can pause and play them when the tab is shown and hidden.
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
   *
   * @param backend Provides information on the currently used backend of Kando.
   * @param version This will be shown in the developer-options tab.
   */
  constructor(backend: IBackendInfo, version: IVersionInfo) {
    this.loadContent(backend, version);
    this.initVisibility();
    this.initIntroductionVideos();
    this.initButtons();
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
      window.api.appSettings.setKey('sidebarVisible', visible);
    }
  }

  /** This method returns the container of the sidebar. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * This method loads the HTML content of the sidebar.
   *
   * @param backend Provides information on the currently used backend of Kando.
   * @param version This will be shown in the developer-options tab.
   */
  private loadContent(backend: IBackendInfo, version: IVersionInfo) {
    const introTab = require('./templates/introduction-tab.hbs');
    const devTab = require('./templates/dev-tab.hbs');
    const sidebar = require('./templates/sidebar.hbs');

    // Initialize the sidebar content.
    this.container = document.createElement('div');
    this.container.innerHTML = sidebar({
      areaId: 'kando-editor-sidebar-area',
      strings: {
        welcome: i18next.t('sidebar.welcome'),
        introText: i18next.t('sidebar.intro-text'),
        watchIntro: i18next.t('sidebar.watch-intro-button'),
        documentation: i18next.t('sidebar.documentation-button'),
        discord: i18next.t('sidebar.discord-button'),
        buyMeACoffee: i18next.t('sidebar.buy-me-a-coffee-button'),
        sponsors: i18next.t('sidebar.sponsors-button'),
        newVersion: i18next.t('sidebar.new-version-button'),
      },
      tabs: [
        {
          id: 'sidebar-tab-introduction',
          icon: 'school',
          title: i18next.t('sidebar.introduction-tab-header'),
          content: introTab({
            id: 'introduction-slides',
            slides: [
              {
                caption: i18next.t('sidebar.introduction-tab-slide-1-caption'),
              },
              {
                caption: i18next.t('sidebar.introduction-tab-slide-2-caption'),
              },
              {
                caption: i18next.t('sidebar.introduction-tab-slide-3-caption'),
              },
              {
                caption: i18next.t('sidebar.introduction-tab-slide-4-caption'),
              },
              {
                caption: i18next.t('sidebar.introduction-tab-slide-5-caption'),
              },
            ],
          }),
        },
        {
          id: 'sidebar-tab-debugging',
          icon: 'ads_click',
          title: i18next.t('sidebar.development-tab-header'),
          content: devTab({
            buttons: [
              {
                id: 'dev-tools-button',
                icon: 'code',
                title: i18next.t('sidebar.dev-tools-button'),
                tooltip: i18next.t('sidebar.dev-tools-button-tooltip'),
              },
              {
                id: 'reload-menu-theme-button',
                icon: 'palette',
                title: i18next.t('sidebar.reload-menu-theme-button'),
                tooltip: i18next.t('sidebar.reload-menu-theme-button-tooltip'),
              },
              {
                id: 'reload-sound-theme-button',
                icon: 'music_note',
                title: i18next.t('sidebar.reload-sound-theme-button'),
              },
            ],
            infos: [
              {
                label: i18next.t('sidebar.backend'),
                value: backend.name,
              },
              {
                label: i18next.t('sidebar.kando-version'),
                value: version.kandoVersion,
              },
              {
                label: i18next.t('sidebar.electron-version'),
                value: version.electronVersion,
              },
              {
                label: i18next.t('sidebar.chrome-version'),
                value: version.chromeVersion,
              },
              {
                label: i18next.t('sidebar.node-version'),
                value: version.nodeVersion,
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
    window.api.appSettings.getKey('sidebarVisible').then((visible) => {
      this.setVisibility(visible);
    });
  }

  /**
   * This method initializes the introduction videos. The videos are loaded from the
   * assets folder and played when the introduction tab is shown. When the tab is hidden,
   * the last visible video is paused. Also, only the video of the currently visible slide
   * is played.
   */
  private initIntroductionVideos() {
    // Add the introduction videos. We do this here because else webpack will not pick them up.
    this.container.querySelector('#sidebar-tab-introduction').addEventListener(
      'show.bs.collapse',
      () => {
        for (let i = 0; i < 5; ++i) {
          this.videos[i] = this.container.querySelector(
            `#introduction-slides-video-${i}`
          ) as HTMLVideoElement;
          this.videos[i].src = require(
            `../../../../assets/videos/introduction-${i + 1}.mp4`
          );
          this.videos[i].loop = true;
        }
      },
      { once: true }
    );

    // Start playing a video when the introduction tab is shown.
    this.container
      .querySelector('#sidebar-tab-introduction')
      .addEventListener('shown.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].currentTime = 0;
        this.videos[this.lastVisibleVideo].play();
      });

    // Pause the last visible video when the introduction tab is hidden.
    this.container
      .querySelector('#sidebar-tab-introduction')
      .addEventListener('hidden.bs.collapse', () => {
        this.videos[this.lastVisibleVideo].pause();
      });

    // Start playing a video when its slide is shown and pause the last visible video.
    this.container
      .querySelector('#sidebar-tab-introduction-content')
      .addEventListener('slide.bs.carousel', (e) => {
        this.videos[this.lastVisibleVideo].pause();
        this.videos[e.to].currentTime = 0;
        this.videos[e.to].play();

        this.lastVisibleVideo = e.to;
      });
  }

  /** This method initializes the buttons in the sidebar. */
  private initButtons() {
    // Show the dev tools if the button is clicked.
    this.container.querySelector('#dev-tools-button').addEventListener('click', () => {
      window.api.showDevTools();
    });

    this.container
      .querySelector('#reload-menu-theme-button')
      .addEventListener('click', () => {
        window.api.reloadMenuTheme();
      });

    this.container
      .querySelector('#reload-sound-theme-button')
      .addEventListener('click', () => {
        window.api.reloadSoundTheme();
      });
  }
}

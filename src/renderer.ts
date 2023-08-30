//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './renderer/index.scss';

import { Tooltip } from 'bootstrap';

import { Menu } from './renderer/menu/menu';
import { IKeySequence, IVec2, INode } from './common';

interface IElectronAPI {
  loadPreferences: () => void;
  hideWindow: (delay: number) => void;
  showDevTools: () => void;
  simulateKeys: (keys: IKeySequence) => void;
  movePointer: (dist: IVec2) => void;
  openURI: (uri: string) => void;
  log: (message: string) => void;
  showMenu: (func: (root: INode, pos: IVec2) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

// Set up the menu -----------------------------------------------------------------------

const container = document.getElementById('menu-container');
const menu = new Menu(container);

menu.on('cancel', () => {
  document.querySelector('body').classList.remove('menu-visible');
  window.api.hideWindow(300);
  menu.hide();
});

menu.on('select', () => {
  document.querySelector('body').classList.remove('menu-visible');
  window.api.hideWindow(400);
  menu.hide();
});

menu.on('move-pointer', (dist) => {
  window.api.movePointer(dist);
});

// Hide the menu when the user presses escape.
document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape') {
    document.querySelector('body').classList.remove('menu-visible');
    window.api.hideWindow(300);
    menu.hide();
  }
});

// Show the menu when the main process requests it.
window.api.showMenu((root, pos) => {
  document.querySelector('body').classList.add('menu-visible');
  menu.show(root, pos);
});

// Set up the sidebar --------------------------------------------------------------------

// Add functionality to show and hide the sidebar.
document.querySelector('#show-sidebar-button').addEventListener('click', () => {
  document.querySelector('body').classList.add('sidebar-visible');
});

document.querySelector('#hide-sidebar-button').addEventListener('click', () => {
  document.querySelector('body').classList.remove('sidebar-visible');
});

// Add the tutorial videos.
for (let i = 1; i <= 5; ++i) {
  const video = document.querySelector(`#tutorial-video-${i}`) as HTMLVideoElement;
  video.src = require(`../assets/videos/tutorial-${i}.mp4`);
  video.loop = true;
  video.autoplay = true;
}

// Show the dev tools if the button is clicked.
document.querySelector('#dev-tools-button').addEventListener('click', () => {
  window.api.showDevTools();
});

// Initialize all the example actio buttons.
document.querySelector('#shortcut-button-1').addEventListener('click', () => {
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

document.querySelector('#shortcut-button-2').addEventListener('click', () => {
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

document.querySelector('#shortcut-button-3').addEventListener('click', () => {
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

document.querySelector('#shortcut-button-4').addEventListener('click', () => {
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

document.querySelector('#url-button').addEventListener('click', () => {
  window.api.openURI('https://github.com/kando-menu/kando');
});

document.querySelector('#uri-button').addEventListener('click', () => {
  window.api.openURI('file:///');
});

// Miscellaneous -------------------------------------------------------------------------

// Initialize all tooltips.
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
tooltipTriggerList.forEach((tooltipTriggerEl) => {
  new Tooltip(tooltipTriggerEl, {
    delay: { show: 500, hide: 0 },
  });
});

// This is helpful during development as it shows us when the renderer process has
// finished reloading.
window.api.log("Successfully loaded Kando's renderer process.");

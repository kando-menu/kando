//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import { Menu } from './menu/menu';
import { IKeySequence, IVec2 } from './common';

interface IElectronAPI {
  loadPreferences: () => void;
  hideWindow: (delay: number) => void;
  showDevTools: () => void;
  simulateKeys: (keys: IKeySequence) => void;
  movePointer: (dist: IVec2) => void;
  openURI: (uri: string) => void;
  itemSelected: () => void;
  log: (message: string) => void;
  showMenu: (func: (pos: IVec2) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

const container = document.getElementById('menu-container');
const menu = new Menu(container);

menu.on('cancel', () => {
  document.querySelector('body').classList.add('hidden');
  window.api.hideWindow(150);
  menu.hide();
});

menu.on('select', () => {
  document.querySelector('body').classList.add('hidden');
  window.api.hideWindow(300);
  menu.hide();
});

menu.on('move-pointer', (dist) => {
  window.api.movePointer(dist);
});

document.querySelector('#show-editor-button').addEventListener('click', () => {
  document.querySelector('#show-editor-button').classList.add('hidden');
  document.querySelector('#editor-left').classList.remove('hidden');
});

document.querySelector('#hide-editor-button').addEventListener('click', () => {
  document.querySelector('#show-editor-button').classList.remove('hidden');
  document.querySelector('#editor-left').classList.add('hidden');
});

document.querySelector('#dev-tools-button').addEventListener('click', () => {
  window.api.showDevTools();
});

document.querySelector('#shortcut-button-1').addEventListener('click', () => {
  window.api.simulateKeys([
    {
      name: 'ControlLeft',
      down: true,
      delay: 0,
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
      name: 'MetaLseft',
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

document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape') {
    document.querySelector('body').classList.add('hidden');
    window.api.hideWindow(150);
    menu.hide();
  }
});

window.api.showMenu((pos) => {
  document.querySelector('body').classList.remove('hidden');
  menu.show(pos);
});

window.api.log("Successfully loaded Kando's renderer process.");

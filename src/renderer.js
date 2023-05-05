//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

document.querySelector('#close-button').addEventListener('click', () => {
  window.api.hideWindow();
});

document.querySelector('#dev-tools-button').addEventListener('click', () => {
  window.api.showDevTools();
});

document.querySelector('#shortcut-button').addEventListener('click', () => {
  window.api.simulateShortcut();
});

document.addEventListener('keyup', ev => {
  if (ev.key === 'Escape') {
    window.api.hideWindow();
  }
});

let menu = document.querySelector('#menu');

menu.addEventListener('click', () => {
  window.api.itemSelected();
});

window.api.showMenu((a, pos) => {
  document.querySelector('body').classList.add('visible');
  menu.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
});

window.api.setWindowInfo((a, info) => {
  document.querySelector('#window-name').textContent  = info.name;
  document.querySelector('#window-class').textContent = info.wmClass;
});

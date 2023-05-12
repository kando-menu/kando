//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import "./index.scss";

import { Menu } from "./menu/menu";

const menu = new Menu();

document.querySelector("#close-button").addEventListener("click", () => {
  window.api.hideWindow();
  menu.hide();
});

document.querySelector("#dev-tools-button").addEventListener("click", () => {
  window.api.showDevTools();
});

document.querySelector("#shortcut-button").addEventListener("click", () => {
  window.api.simulateShortcut();
});

document.addEventListener("keyup", (ev) => {
  if (ev.key === "Escape") {
    window.api.hideWindow();
    menu.hide();
  }
});

window.api.showMenu((pos) => {
  menu.show(pos);
});

window.api.setWindowInfo((info) => {
  document.querySelector("#window-name").textContent = info.name;
  document.querySelector("#window-class").textContent = info.wmClass;
});

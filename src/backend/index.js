//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const os      = require('node:os');
const process = require('node:process');

let Backend;

if (os.platform() === 'linux') {

  console.log(`Running on Linux (${process.env.XDG_CURRENT_DESKTOP} on ${
    process.env.XDG_SESSION_TYPE})!`);

  if (process.env.XDG_SESSION_TYPE === 'x11') {
    Backend = require('./x11.js').default;
  } else if (process.env.XDG_SESSION_TYPE === 'wayland') {
    Backend = require('./gnome.js').default;
  } else {
    console.log('Unknown session type!');
  }

} else if (os.platform() === 'win32') {
  console.log(`Running on Windows ${os.release()}!`);
} else if (os.platform() === 'darwin') {
  console.log('MacOS is not yet supported!');
}

export default Backend;

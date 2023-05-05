//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
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
    process.env.XDG_SESSION_TYPE}).`);

  if (process.env.XDG_SESSION_TYPE === 'x11') {
    Backend = require('./x11/backend.js').default;
  } else if (process.env.XDG_SESSION_TYPE === 'wayland') {
    Backend = require('./gnome/backend.js').default;
  } else {
    console.log('Unknown session type!');
  }

} else if (os.platform() === 'win32') {

  console.log(`Running on Windows ${os.release()}.`);
  Backend = require('./win32/backend.js').default;

} else if (os.platform() === 'darwin') {
  console.log('MacOS is not yet supported!');
}

export default Backend;

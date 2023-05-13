//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/* eslint-disable @typescript-eslint/no-var-requires */

import os from 'node:os';
import process from 'node:process';
import { Backend } from './backend';

export { Backend };

export function getBackend(): Backend | null {
  if (os.platform() === 'linux') {
    console.log(
      `Running on Linux (${process.env.XDG_CURRENT_DESKTOP} on ${process.env.XDG_SESSION_TYPE}).`
    );

    if (process.env.XDG_SESSION_TYPE === 'x11') {
      const Backend = require('./x11/backend').X11Backend;
      return new Backend();
    } else if (process.env.XDG_SESSION_TYPE === 'wayland') {
      const Backend = require('./gnome/backend').GnomeBackend;
      return new Backend();
    } else {
      console.log('Unknown session type!');
    }
  } else if (os.platform() === 'win32') {
    console.log(`Running on Windows ${os.release()}.`);
    const Backend = require('./win32/backend').Win32Backend;
    return new Backend();
  } else if (os.platform() === 'darwin') {
    console.log('MacOS is not yet supported!');
    return null;
  }
}

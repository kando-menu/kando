//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

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
      const { X11Backend } = require('./x11/backend');
      return new X11Backend();
    } else if (process.env.XDG_SESSION_TYPE === 'wayland') {
      const { GnomeBackend } = require('./gnome/backend');
      return new GnomeBackend();
    } else {
      console.log('Unknown session type!');
    }
  } else if (os.platform() === 'win32') {
    console.log(`Running on Windows ${os.release()}.`);
    const { Win32Backend } = require('./win32/backend');
    return new Win32Backend();
  } else if (os.platform() === 'darwin') {
    console.log('MacOS is not yet supported!');
    return null;
  }
}

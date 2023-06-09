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

/**
 * Based on the current platform, this function returns the backend which can be used to
 * interact with the system. If no suitable backend is available, null is returned.
 *
 * There are several backends available for different platforms. On Windows, there is only
 * one backend which uses the Win32 API. On Linux, the backend depends on the desktop
 * environment and the session type. There is a generic X11 backend which should work on
 * most desktop environments. However, it is also possible to implement derived X11
 * backends for specific desktop environments. On Wayland, it is not possible to create a
 * generic backend, so there are only a few backends for selected desktop environments.
 *
 * @returns The backend for the current platform or null if no backend is available.
 */
export function getBackend(): Backend | null {
  if (os.platform() === 'linux') {
    const desktop = process.env.XDG_CURRENT_DESKTOP;
    const session = process.env.XDG_SESSION_TYPE;

    console.log(`Running on Linux (${desktop} on ${session}).`);

    if (desktop === 'GNOME' && session === 'wayland') {
      const { GnomeBackend } = require('./linux/gnome/wayland/backend');
      return new GnomeBackend();
    }

    if (desktop === 'kde' && session === 'x11') {
      const { KDEX11Backend } = require('./linux/kde/x11/backend');
      return new KDEX11Backend();
    }

    if (session === 'x11') {
      const { X11Backend } = require('./linux/x11/backend');
      return new X11Backend();
    }

    console.log('This is an unsupported combination! Kando will not work here :(');
    return null;
  }

  if (os.platform() === 'win32') {
    console.log(`Running on Windows ${os.release()}.`);
    const { Win32Backend } = require('./win32/backend');
    return new Win32Backend();
  }

  if (os.platform() === 'darwin') {
    console.log('MacOS is not yet supported!');
    return null;
  }

  console.log(`Unsupported platform "${os.platform()}"! Kando will not work here :(`);
  return null;
}

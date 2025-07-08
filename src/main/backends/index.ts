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
    let desktop = process.env.XDG_CURRENT_DESKTOP || '';
    let session = process.env.XDG_SESSION_TYPE || '';

    console.log(`Running on Linux (${desktop} on ${session}).`);

    desktop = desktop.toLowerCase();
    session = session.toLowerCase();

    if ((desktop === 'gnome' || desktop === 'unity') && session === 'wayland') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { GnomeBackend } = require('./linux/gnome/wayland/backend');
      return new GnomeBackend();
    }

    if (desktop === 'kde' && session === 'x11') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { KDEX11Backend } = require('./linux/kde/x11/backend');
      return new KDEX11Backend();
    }

    if (desktop === 'kde' && session === 'wayland') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { KDEWaylandBackend } = require('./linux/kde/wayland/backend');
      return new KDEWaylandBackend();
    }

    if (desktop === 'hyprland') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { HyprBackend } = require('./linux/hyprland/backend');
      return new HyprBackend();
    }

    if (desktop === 'niri') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { NiriBackend } = require('./linux/niri/backend');
      return new NiriBackend();
    }

    if (desktop === 'x-cinnamon' && session === 'x11') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { CinnamonBackend } = require('./linux/cinnamon/x11/backend');
      return new CinnamonBackend();
    }

    if (session === 'x11') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { X11Backend } = require('./linux/x11/backend');
      return new X11Backend();
    }

    if (session === 'tty') {
      console.warn(
        'XDG_SESSION_TYPE is set to "tty". This is unusual - Kando will try to use the X11 backend.'
      );

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { X11Backend } = require('./linux/x11/backend');
      return new X11Backend();
    }

    console.error('This is an unsupported combination! Kando will not work here :(');
    return null;
  }

  if (os.platform() === 'win32') {
    console.log(`Running on Windows ${os.release()}.`);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { WindowsBackend } = require('./windows/backend');
    return new WindowsBackend();
  }

  if (os.platform() === 'darwin') {
    console.log(`Running on MacOS ${os.release()}.`);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { MacosBackend } = require('./macos/backend');
    return new MacosBackend();
  }

  console.log(`Unsupported platform "${os.platform()}"! Kando will not work here :(`);
  return null;
}

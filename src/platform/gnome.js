//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const DBus = require('dbus');

export default class Platform {
  constructor() {
    console.log('GNOME platform created');

    this._callbacks = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this._interface) {
        resolve();
      } else {
        const bus = DBus.getBus('session');

        bus.getInterface(
          'org.gnome.Shell', '/org/gnome/shell/extensions/KenDoIntegration',
          'org.gnome.Shell.Extensions.KenDoIntegration', (error, iFace) => {
            if (error) {
              reject(error);
              return;
            }

            this._interface = iFace;

            this._interface.on('ShortcutPressed', shortcut => {
              console.log('Shortcut pressed ' + shortcut);

              this._callbacks[shortcut]();
            });

            resolve();
          });
      }
    });
  }

  getPointer() {
    return new Promise((resolve, reject) => {
      this._interface.GetPointer((err, [x, y, mods]) => {
        if (err) {
          reject(err);
        } else {
          resolve({x: x, y: y, mods: mods});
        }
      });
    });
  }

  getFocusedWindow() {
    return new Promise((resolve, reject) => {
      this._interface.GetFocusedWindow((err, [name, wmClass]) => {
        if (err) {
          reject(err);
        } else {
          resolve({name: name, wmClass: wmClass});
        }
      });
    });
  }

  bindShortcut(shortcut, callback) {
    shortcut = shortcut.replace('CommandOrControl+', '<Ctrl>');
    shortcut = shortcut.replace('CmdOrCtrl+', '<Ctrl>');
    shortcut = shortcut.replace('Command+', '<Ctrl>');
    shortcut = shortcut.replace('Control+', '<Ctrl>');
    shortcut = shortcut.replace('Cmd+', '<Ctrl>');
    shortcut = shortcut.replace('Ctrl+', '<Ctrl>');
    shortcut = shortcut.replace('Alt+', '<Alt>');
    shortcut = shortcut.replace('Shift+', '<Shift>');
    shortcut = shortcut.replace('Meta+', '<Meta>');
    shortcut = shortcut.replace('Super+', '<Super>');

    if (shortcut.includes('Option')) {
      console.log('Option is not supported on GNOME');
      return;
    }

    if (shortcut.includes('AltGr')) {
      console.log('AltGr is not supported on GNOME');
      return;
    }

    console.log('Binding shortcut: ' + shortcut);

    this._interface.BindShortcut(shortcut, (err, success) => {
      if (err) {
        console.log(`Failed to bind shortcut ${shortcut}: ` + err);
        return;
      }

      if (!success) {
        console.log(`Failed to bind shortcut ${shortcut}!`);
        return;
      }

      this._callbacks[shortcut] = callback;

      console.log('Bound shortcut: ' + shortcut);
    });
  }

  unbindShortcut(shortcut) {
    shortcut = shortcut.replace('CommandOrControl+', '<Ctrl>');
    shortcut = shortcut.replace('CmdOrCtrl+', '<Ctrl>');
    shortcut = shortcut.replace('Command+', '<Ctrl>');
    shortcut = shortcut.replace('Control+', '<Ctrl>');
    shortcut = shortcut.replace('Cmd+', '<Ctrl>');
    shortcut = shortcut.replace('Ctrl+', '<Ctrl>');
    shortcut = shortcut.replace('Alt+', '<Alt>');
    shortcut = shortcut.replace('Shift+', '<Shift>');
    shortcut = shortcut.replace('Meta+', '<Meta>');
    shortcut = shortcut.replace('Super+', '<Super>');

    if (shortcut.includes('Option')) {
      console.log('Option is not supported on GNOME');
      return;
    }

    if (shortcut.includes('AltGr')) {
      console.log('AltGr is not supported on GNOME');
      return;
    }

    console.log('Unbinding shortcut: ' + shortcut);

    this._interface.UnbindShortcut(shortcut, (err, success) => {
      if (err) {
        console.log(`Failed to unbind shortcut ${shortcut}: ` + err);
        return;
      }

      if (!success) {
        console.log(`Failed to unbind shortcut ${shortcut}!`);
        return;
      }

      console.log('Unbound shortcut: ' + shortcut);
    });
  }
}
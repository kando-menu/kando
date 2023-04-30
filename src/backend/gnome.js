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

export default class Backend {
  constructor() {
    console.log('GNOME backend created');

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

  simulateShortcut(shortcut) {
    return new Promise((resolve, reject) => {
      try {
        shortcut = this._toGdkAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      this._interface.SimulateShortcut(shortcut, (err, success) => {
        if (err) {
          reject(err);
          return;
        }

        if (!success) {
          reject('Failed to simulate shortcut.');
          return;
        }

        resolve();
      });
    });
  }

  bindShortcut(shortcut, callback) {
    return new Promise((resolve, reject) => {
      try {
        shortcut = this._toGdkAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      this._interface.BindShortcut(shortcut, (err, success) => {
        if (err) {
          reject(err);
          return;
        }

        if (!success) {
          reject('Shortcut is already in use.');
          return;
        }

        this._callbacks[shortcut] = callback;
        resolve();
      });
    });
  }

  unbindShortcut(shortcut) {
    return new Promise((resolve, reject) => {
      try {
        shortcut = this._toGdkAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      this._interface.UnbindShortcut(shortcut, (err, success) => {
        if (err) {
          reject(err);
          return;
        }

        if (!success) {
          reject('Shortcut was not bound.');
          return;
        }

        resolve();
      });
    });
  }

  unbindAllShortcuts() {
    return new Promise((resolve, reject) => {
      this._interface.UnbindAllShortcuts(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  _toGdkAccelerator(shortcut) {
    if (shortcut.includes('Option')) {
      throw new Error('Shortcuts including Option are not yet supported on GNOME.');
    }

    if (shortcut.includes('AltGr')) {
      throw new Error('Shortcuts including AltGr are not yet supported on GNOME.');
    }

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

    return shortcut;
  }
}
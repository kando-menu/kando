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

export default class Input {
  constructor() {
    console.log('Input created');

    const bus = DBus.getBus('session');

    bus.getInterface(
      'org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop',
      'org.freedesktop.portal.RemoteDesktop', function(err, iFace) {
        if (err) {
          console.log('Error: ' + err);
        }

        console.log(iFace);

        this._name = bus.connection.uniqueName.substring(1).replace('.', '_');

        iFace.CreateSession({handle_token: '1', session_handle_token: '1'},
                            (err, handle) => {
                              iFace.Start(handle, '', {handle_token: '2'},
                                          (err, handle) => console.log(err, handle));
                              // iFace.NotifyPointerMotion(
                              // handle, {handle_token: '1', session_handle_token: '1'},
                              // 100, 100);
                            });

        // Do something with the interface
      });
  }
}
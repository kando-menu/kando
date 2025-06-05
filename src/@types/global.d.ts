//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// These are set by webpack in webpack.plugins.ts so that we can use them in the
// renderer process.
declare const cIsMac: boolean;
declare const cIsWindows: boolean;
declare const cIsLinux: boolean;

import { typeof COMMON_WINDOW_API } from '../settings-renderer/settings-window-api';
import { typeof SETTINGS_WINDOW_API } from '../settings-renderer/settings-window-api';

declare global {
  interface Window {
    commonAPI: typeof COMMON_WINDOW_API;
    settingsAPI: typeof SETTINGS_WINDOW_API;
  }
}
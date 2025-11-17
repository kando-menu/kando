//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { contextBridge } from 'electron';

import { COMMON_WINDOW_API } from '../common/common-window-api';
import { SETTINGS_WINDOW_API } from './settings-window-api';

contextBridge.exposeInMainWorld('commonAPI', COMMON_WINDOW_API);
contextBridge.exposeInMainWorld('settingsAPI', SETTINGS_WINDOW_API);

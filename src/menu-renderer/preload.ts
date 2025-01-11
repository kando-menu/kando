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
import { MENU_WINDOW_API } from './menu-window-api';

contextBridge.exposeInMainWorld('commonAPI', COMMON_WINDOW_API);
contextBridge.exposeInMainWorld('menuAPI', MENU_WINDOW_API);

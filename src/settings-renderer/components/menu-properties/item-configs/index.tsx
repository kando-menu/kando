//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import SubmenuItemConfig from './submenu-item-config';
import CommandItemConfig from './command-item-config';
import FileItemConfig from './file-item-config';
import HotkeyItemConfig from './hotkey-item-config';
import MacroItemConfig from './macro-item-config';
import TextItemConfig from './text-item-config';
import URIItemConfig from './uri-item-config';
import RedirectItemConfig from './redirect-item-config';
import SettingsItemConfig from './settings-item-config';

/**
 * This method returns a config component for the given menu item type.
 *
 * @param type The menu item type for which the config component should be created.
 * @returns The config component for the given menu item.
 */
export function getConfigComponent(type: string): React.ReactElement {
  const components: Record<string, React.ReactElement> = {
    submenu: <SubmenuItemConfig />,
    command: <CommandItemConfig />,
    file: <FileItemConfig />,
    hotkey: <HotkeyItemConfig />,
    macro: <MacroItemConfig />,
    text: <TextItemConfig />,
    uri: <URIItemConfig />,
    redirect: <RedirectItemConfig />,
    settings: <SettingsItemConfig />,
  };

  return components[type] || <></>;
}

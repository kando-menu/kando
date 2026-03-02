//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { getSubmenuItemTips } from './submenu-item-config';
import { CommandItemConfig, getCommandItemTips } from './command-item-config';
import { FileItemConfig, getFileItemTips } from './file-item-config';
import { HotkeyItemConfig, getHotkeyItemTips } from './hotkey-item-config';
import { MacroItemConfig, getMacroItemTips } from './macro-item-config';
import { TextItemConfig, getTextItemTips } from './text-item-config';
import { UriItemConfig, getUriItemTips } from './uri-item-config';
import { RedirectItemConfig } from './redirect-item-config';
import { getSettingsItemTips } from './settings-item-config';

/**
 * This method returns a config component for the given menu item type.
 *
 * @param type The menu item type for which the config component should be created.
 * @returns The config component for the given menu item.
 */
export function getConfigComponent(type: string): React.ReactElement {
  const components: Record<string, React.ReactElement> = {
    command: <CommandItemConfig />,
    file: <FileItemConfig />,
    hotkey: <HotkeyItemConfig />,
    macro: <MacroItemConfig />,
    text: <TextItemConfig />,
    uri: <UriItemConfig />,
    redirect: <RedirectItemConfig />,
  };

  return components[type] || null;
}

/**
 * This method returns the tips for the given menu item type.
 *
 * @param type The menu item type for which the tips should be returned.
 * @returns The tips for the given menu item type.
 */
export function getItemTips(type: string): string[] {
  const tips: Record<string, string[]> = {
    submenu: getSubmenuItemTips(),
    command: getCommandItemTips(),
    file: getFileItemTips(),
    hotkey: getHotkeyItemTips(),
    macro: getMacroItemTips(),
    text: getTextItemTips(),
    uri: getUriItemTips(),
    settings: getSettingsItemTips(),
  };

  return tips[type] || null;
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IItemConfig } from '../item-config-registry';

/** This class provides the configuration widgets for submenu items. */
export class SubmenuItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'Submenus can be used to group items.',
      'You can also nest submenus inside of submenus.',
      'Submenus can be used to create complex menu structures.',
      'You should avoid adding more than twelve items to a submenu. Eight is a good number.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** Submenus do not have any special settings. Therefore, this method returns `null`. */
  public getConfigWidget(): HTMLElement | null {
    return null;
  }
}

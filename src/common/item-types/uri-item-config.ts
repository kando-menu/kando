//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IItemConfig } from '../item-config-registry';

/** This class provides the configuration widgets for URI items. */
export class URIItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'You can use the URI item type to open a link to a website.',
      'You can use the URI item type to open a file or folder using the file:// protocol.',
      'You can use the URI item type to open a mailto:// link.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  public getConfigWidget(): HTMLElement | null {
    return null;
  }
}

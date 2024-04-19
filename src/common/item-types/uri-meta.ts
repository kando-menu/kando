//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from '../index';
import { IMeta } from '../item-factory';

/**
 * For this type of menu items, the user can configure a URL that will be opened when the
 * item is clicked.
 */
export interface IActionData {
  uri: string;
}

/** This class provides meta information for menu items that open a URL. */
export class URIMeta implements IMeta {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Open URL';
  }

  get defaultIcon(): string {
    return 'public';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IActionData {
    return {
      uri: '',
    };
  }

  get genericDescription(): string {
    return 'Opens files or websites.';
  }

  getDescription(node: INode): string {
    return (node.data as IActionData).uri || 'Not configured.';
  }
}

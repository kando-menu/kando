//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { useMenuSettings } from '../../../state/menu-settings';
import { Dropdown } from '../../common';
import { OpenMenuAction } from '../../../../common';

type Props = {
  /** The action to configure. */
  readonly action: OpenMenuAction;

  /** Function to call when the action changes. */
  readonly onUpdateAction: (action: OpenMenuAction) => void;

  /** Function to call when the container menu item should be modified. */
  readonly onUpdateItem: (info: {
    name?: string;
    icon?: string;
    iconTheme?: string;
  }) => void;
};

/**
 * The configuration component for open-menu actions is primarily a text input field for
 * the redirect.
 */
export function OpenMenuActionConfig(props: Props) {
  const menus = useMenuSettings((state) => state.menus);

  // Assemble a list of all existing menu names.
  const menuNames = menus.map((menu) => menu.root.name);
  const options = Array.from(new Set(menuNames)).map((name) => {
    return { value: name, label: name };
  });

  return (
    <Dropdown
      initialValue={props.action.menu}
      options={options}
      onChange={(menuName) => {
        const menu = menus.find((menu) => menu.root.name === menuName);

        if (!menu) {
          return;
        }

        props.onUpdateAction({
          ...props.action,
          menu: menu.root.name,
        });

        props.onUpdateItem({
          name: menu.root.name,
          icon: menu.root.icon,
          iconTheme: menu.root.iconTheme,
        });
      }}
    />
  );
}

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuV2 } from '../../src/common/settings-schemata';

export const simpleMenus: MenuV2[] = [
  {
    root: {
      type: 'root',
      name: 'E2E Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'E2E Item',
          icon: 'check',
          iconTheme: 'material-symbols-rounded',
          selectWorkflow: { actions: [] },
        },
      ],
    },
  },
];

export const simpleSeed = {
  menus: simpleMenus,
  config: {
    showIntroductionDialog: false,
    enableMenuAnimations: false,
  },
};

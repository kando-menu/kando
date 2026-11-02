// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import type { Page } from '@playwright/test';
import { MenuV2 } from '../../src/common/settings-schemata';

export const editorMenus: MenuV2[] = [
  {
    tags: [],
    root: {
      type: 'root',
      name: 'Work Menu',
      icon: 'work',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'First Item',
          icon: 'star',
          iconTheme: 'material-symbols-rounded',
          selectWorkflow: { actions: [] },
        },
        {
          type: 'submenu',
          name: 'Nested Menu',
          icon: 'folder',
          iconTheme: 'material-symbols-rounded',
          children: [
            {
              type: 'button',
              name: 'Nested Item',
              icon: 'check',
              iconTheme: 'material-symbols-rounded',
              selectWorkflow: { actions: [] },
            },
          ],
        },
      ],
    },
  },
  {
    tags: ['personal'],
    root: {
      type: 'root',
      name: 'Personal Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [],
    },
  },
];

export const editorSeed = {
  menus: editorMenus,
  config: {
    showIntroductionDialog: false,
    enableMenuAnimations: false,
  },
};

export const readMenus = async (kando: { readSettingsFile: () => Promise<unknown> }) => {
  const settings = (await kando.readSettingsFile()) as { menus: MenuV2[] };
  return settings.menus;
};

export const menuTitle = (page: Page, name: string) =>
  page.locator('[class*="menuTitle"]').getByText(name, { exact: true });

export const menuCard = (page: Page, name: string) =>
  menuTitle(page, name).locator('xpath=ancestor::div[@draggable="true"]');

export const addAction = async (page: Page, name: string): Promise<void> => {
  await page.getByRole('button', { name: 'Add Action' }).first().click();
  const search = page.getByPlaceholder('Search for an action…');
  await search.fill(name);
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
};

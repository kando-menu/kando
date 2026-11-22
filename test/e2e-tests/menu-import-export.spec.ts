// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import { MenuV2 } from '../../src/common/settings-schemata';
import { expect, test } from './fixtures';
import { editorSeed, readMenus, menuTitle, menuCard } from './editor-helpers';

test.use({ seed: editorSeed });

test('menu import and export round-trip current menus and migrate V1 exports', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const exportPath = `${kando.configDirectory}/round-trip-menu.json`;
  const legacyPath = `${kando.configDirectory}/legacy-menu.json`;
  const invalidPath = `${kando.configDirectory}/invalid-menu.json`;

  await kando.stubFileDialog('save', exportPath);
  await menuCard(page, 'Work Menu')
    .locator('[data-tooltip-content="Export menu"]')
    .click();
  await expect.poll(() => fs.existsSync(exportPath)).toBe(true);

  const exported = JSON.parse(await fs.promises.readFile(exportPath, 'utf8')) as {
    menu: MenuV2;
  };
  expect(exported.menu.root.name).toBe('Work Menu');

  const importButton = page.locator('[data-tooltip-content="Import menu"]');
  await kando.stubFileDialog('open', exportPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(3);
  await expect(menuTitle(page, 'Work Menu')).toHaveCount(2);

  await fs.promises.writeFile(
    legacyPath,
    JSON.stringify({
      version: '2.0.0',
      menu: {
        type: 'root',
        name: 'Legacy Menu',
        icon: 'home',
        iconTheme: 'material-symbols-rounded',
        children: [
          {
            type: 'command',
            name: 'Legacy Command',
            icon: 'terminal',
            iconTheme: 'material-symbols-rounded',
            data: { command: 'printf legacy' },
          },
        ],
      },
    })
  );
  await kando.stubFileDialog('open', legacyPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(4);
  await expect
    .poll(async () => {
      const imported = (await readMenus(kando)).find(
        (menu) => menu.root.name === 'Legacy Menu'
      );
      const child = imported?.root.children[0];
      return child?.type === 'button' ? child.selectWorkflow?.actions : undefined;
    })
    .toMatchObject([
      { type: 'execute-command', command: 'printf legacy' },
      { type: 'close-menu' },
    ]);

  await fs.promises.writeFile(invalidPath, '{"not": "an exported menu"}');
  await kando.stubFileDialog('open', invalidPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(4);

  await kando.restart();
  expect((await readMenus(kando)).map((menu) => menu.root.name)).toEqual([
    'Work Menu',
    'Personal Menu',
    'Work Menu',
    'Legacy Menu',
  ]);
  expect(kando.errors).toEqual([]);
});

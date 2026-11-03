// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import path from 'path';
import { MenuV2 } from '../../src/common/settings-schemata';
import { version } from '../../package.json';
import { expect, test } from './fixtures';
import { simpleSeed } from './simple-menus';

test.use({ seed: simpleSeed });

test('config and menus survive an app restart', async ({ kando }) => {
  await kando.openMenu('E2E Menu');
  await kando.menuWindow.keyboard.press('Escape');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);

  await kando.restart();
  await kando.openMenu('E2E Menu');

  const config = (await kando.readSettingsFile('config')) as {
    enableMenuAnimations: boolean;
  };
  expect(config.enableMenuAnimations).toBe(false);
  await expect(kando.menuWindow.locator('.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  expect(kando.errors).toEqual([]);
});

test('corrupted settings are backed up and replaced with defaults', async ({ kando }) => {
  const corruptedConfig = '{ invalid config';
  await kando.restartWithSettingsFiles({ config: corruptedConfig });

  const config = (await kando.readSettingsFile('config')) as {
    version: string;
    locale: string;
  };
  expect(config.version).toBe(version);
  expect(config.locale).toBe('auto');
  const backups = fs.readdirSync(path.join(kando.configDirectory, 'backups'));
  const backupName = backups.find((name) => name.startsWith('config-corrupted-'));
  expect(backupName).toBeDefined();
  expect(
    fs.readFileSync(
      path.join(kando.configDirectory, 'backups', backupName as string),
      'utf8'
    )
  ).toBe(corruptedConfig);
  expect(kando.errors).toEqual([]);
});

test('older settings files migrate and persist the current schema', async ({ kando }) => {
  const dataDirectory = path.join(__dirname, '..', 'data');
  const legacyConfig = fs.readFileSync(
    path.join(dataDirectory, 'legacy-config.json'),
    'utf8'
  );
  const legacyMenus = fs.readFileSync(
    path.join(dataDirectory, 'legacy-menus.json'),
    'utf8'
  );
  await kando.restartWithSettingsFiles({
    config: legacyConfig,
    menus: legacyMenus,
  });

  const config = (await kando.readSettingsFile('config')) as {
    version: string;
    hideSettingsButton: boolean;
    dragThreshold: number;
    enableMarkingMode: boolean;
  };
  expect(config.version).toBe(version);
  expect(config.hideSettingsButton).toBe(true);
  expect(config.dragThreshold).toBe(31);
  expect(config.enableMarkingMode).toBe(false);

  const migratedMenus = (await kando.readSettingsFile()) as {
    version: string;
    menus: MenuV2[];
  };
  expect(migratedMenus.version).toBe(version);
  expect(migratedMenus.menus[0].root.name).toBe('Legacy Menu');
  expect(migratedMenus.menus[0].root.children[0]).toMatchObject({
    type: 'button',
    name: 'Legacy action',
    selectWorkflow: {
      actions: [
        { type: 'execute-command', command: 'echo legacy' },
        { type: 'close-menu' },
      ],
    },
  });

  const backups = fs.readdirSync(path.join(kando.configDirectory, 'backups'));
  expect(backups.some((name) => name.startsWith('config-2.0.0-'))).toBe(true);
  expect(backups.some((name) => name.startsWith('menus-2.0.0-'))).toBe(true);
  expect(kando.errors).toEqual([]);
});

test('editing menus.json on disk updates the running app', async ({ kando }) => {
  const updatedMenus: MenuV2[] = [
    {
      root: {
        type: 'root',
        name: 'Reloaded Menu',
        icon: 'home',
        iconTheme: 'material-symbols-rounded',
        children: [],
      },
    },
  ];
  const menusPath = path.join(kando.configDirectory, 'menus.json');
  const currentSettings = (await kando.readSettingsFile()) as { version: string };
  fs.writeFileSync(
    menusPath,
    JSON.stringify({ ...currentSettings, menus: updatedMenus }, null, 2)
  );

  await expect
    .poll(async () => {
      const current = await kando.settingsWindow.evaluate(async () => {
        const api = (
          window as Window & {
            commonAPI: { menuSettings: { get: () => Promise<{ menus: MenuV2[] }> } };
          }
        ).commonAPI;
        return api.menuSettings.get();
      });
      return current.menus.some((menu) => menu.root.name === 'Reloaded Menu');
    })
    .toBe(true);
  await kando.openMenu('Reloaded Menu');
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'Reloaded Menu'
  );
  expect(kando.errors).toEqual([]);
});

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

for (const [legacy, expected] of [
  [true, 'select-parent'],
  [false, 'close'],
] as const) {
  test(`the legacy rmbSelectsParent: ${legacy} setting migrates to ${expected}`, async ({
    kando,
  }) => {
    await kando.restartWithSettingsFiles({
      config: JSON.stringify({ version, rmbSelectsParent: legacy }),
    });

    await expect
      .poll(async () => {
        const config = (await kando.readSettingsFile('config')) as Record<
          string,
          unknown
        >;
        return {
          right: config.rightMouseButtonBehavior,
          middle: config.middleMouseButtonBehavior,
          hasOld: 'rmbSelectsParent' in config,
        };
      })
      .toEqual({ right: expected, middle: 'select', hasOld: false });
    expect(kando.errors).toEqual([]);
  });
}

test('new mouse button settings in a file labelled 3.0.1 are kept', async ({ kando }) => {
  // Development builds still report version 3.0.1 but already store the new properties.
  const expectKept = async () => {
    await expect
      .poll(async () => {
        const config = (await kando.readSettingsFile('config')) as Record<
          string,
          unknown
        >;
        return {
          right: config.rightMouseButtonBehavior,
          middle: config.middleMouseButtonBehavior,
          hasOld: 'rmbSelectsParent' in config,
        };
      })
      .toEqual({ right: 'nothing', middle: 'close', hasOld: false });
  };

  await kando.restartWithSettingsFiles({
    config: JSON.stringify({
      version: '3.0.1',
      warpMouse: false,
      rightMouseButtonBehavior: 'nothing',
      middleMouseButtonBehavior: 'close',
    }),
  });
  await expectKept();

  await kando.restart();
  await expectKept();

  // The file content alone does not prove that the running app loaded the values. With
  // 'nothing' a right click must keep the menu open, and with 'close' a middle click must
  // close it (which also serves as a positive control for the right click above).
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');
  const root = await menu
    .locator('.menu-node.active > .icon-layer > .icon-container')
    .boundingBox();
  if (!root) {
    throw new Error('Could not measure the active menu icon.');
  }
  const x = root.x + root.width / 2;
  const y = root.y + root.height / 2;
  await kando.menuWindow.mouse.move(x + 3, y + 3);
  await kando.menuWindow.mouse.move(x, y);
  await kando.menuWindow.mouse.click(x, y, { button: 'right' });
  await kando.menuWindow.waitForTimeout(500);
  await expect(menu.locator('.type-root.active')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  await expect(menu).not.toHaveClass(/hidden/);

  await kando.menuWindow.mouse.click(x, y, { button: 'middle' });
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import path from 'path';
import { IPCObserverClient } from '../../src/common/ipc/ipc-observer-client';
import { IPCShowCustomMenuClient } from '../../src/common/ipc/ipc-show-custom-menu-client';
import { IPC_INFO_SCHEMA } from '../../src/common/ipc/types';
import { MenuV2, RootMenuItem } from '../../src/common/settings-schemata';
import { version } from '../../package.json';
import { expect, test } from './fixtures';

const menus: MenuV2[] = [
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

test.use({
  seed: {
    menus,
    config: {
      showIntroductionDialog: false,
      enableMenuAnimations: false,
    },
  },
});

test('a second launch forwards menu and settings requests to the existing instance', async ({
  kando,
}) => {
  expect(kando.windowCount).toBe(2);

  await kando.openMenu('E2E Menu');
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );

  await kando.settingsWindow.close();
  await expect.poll(() => kando.windowCount).toBe(1);
  await kando.runCommand('--settings');
  await expect.poll(() => kando.windowCount).toBe(2);
  expect(kando.windowCount).toBe(2);
  expect(kando.errors).toEqual([]);
});

test('CLI version and help flags print their output', async ({ kando }) => {
  const versionResult = await kando.runCommandOutput('--version');
  expect(versionResult.stdout.trim()).toBe(version);

  const helpResult = await kando.runCommandOutput('--help');
  expect(helpResult.stdout).toContain('Usage: kando');
  expect(helpResult.stdout).toContain('--menu <menu name>');
  expect(helpResult.stdout).toContain('--reload-menu-theme');
  expect(helpResult.stdout).toContain('--reload-sound-theme');
  expect(kando.errors).toEqual([]);
});

test('reload theme CLI flags reach the menu renderer', async ({ kando }) => {
  await kando.menuWindow.evaluate(() => {
    const state = window as Window & {
      kandoE2EReloadCounts?: { menu: number; sound: number };
      menuAPI: {
        onReloadMenuTheme: (callback: () => void) => void;
        onReloadSoundTheme: (callback: () => void) => void;
      };
    };
    state.kandoE2EReloadCounts = { menu: 0, sound: 0 };
    state.menuAPI.onReloadMenuTheme(() => {
      if (state.kandoE2EReloadCounts) {
        state.kandoE2EReloadCounts.menu++;
      }
    });
    state.menuAPI.onReloadSoundTheme(() => {
      if (state.kandoE2EReloadCounts) {
        state.kandoE2EReloadCounts.sound++;
      }
    });
  });

  await kando.runCommand('--reload-menu-theme');
  await expect
    .poll(() =>
      kando.menuWindow.evaluate(
        () =>
          (
            window as Window & {
              kandoE2EReloadCounts: { menu: number; sound: number };
            }
          ).kandoE2EReloadCounts.menu
      )
    )
    .toBe(1);

  await kando.runCommand('--reload-sound-theme');
  await expect
    .poll(() =>
      kando.menuWindow.evaluate(
        () =>
          (
            window as Window & {
              kandoE2EReloadCounts: { menu: number; sound: number };
            }
          ).kandoE2EReloadCounts.sound
      )
    )
    .toBe(1);
  expect(kando.errors).toEqual([]);
});

test('an invalid menu name reports a clean error without exiting', async ({ kando }) => {
  await kando.runCommand('--menu', 'Missing Menu');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
  await expect
    .poll(() => kando.mainProcessOutput.join(''))
    .toContain('No menu with name "Missing Menu" found.');

  await kando.openMenu('E2E Menu');
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  expect(kando.errors).toEqual([]);
});

test('the IPC observer and custom-menu client communicate with the real app', async ({
  kando,
}) => {
  const info = await kando.settingsWindow.evaluate(async () => {
    const api = (
      window as Window & {
        settingsAPI: {
          getSystemInfo: () => Promise<{ ipcPort: number; ipcApiVersion: number }>;
        };
      }
    ).settingsAPI;
    return api.getSystemInfo();
  });
  const ipcInfo = IPC_INFO_SCHEMA.parse({
    port: info.ipcPort,
    apiVersion: info.ipcApiVersion,
  });
  const observer = new IPCObserverClient(ipcInfo.port, ipcInfo.apiVersion);
  const customMenuClient = new IPCShowCustomMenuClient(ipcInfo.port, ipcInfo.apiVersion);
  const interactions: Array<{ interaction: string; path: number[] }> = [];
  observer.on('interaction', (interaction, itemPath) => {
    interactions.push({ interaction, path: itemPath });
  });

  try {
    await Promise.all([observer.init(), customMenuClient.init()]);
    observer.startObserving();
    await kando.menuWindow.waitForTimeout(100);

    const customMenu: RootMenuItem = {
      type: 'root',
      name: 'IPC Custom Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'IPC Item',
          icon: 'check',
          iconTheme: 'material-symbols-rounded',
          selectWorkflow: { actions: [] },
        },
      ],
    };
    customMenuClient.showMenu(customMenu);
    await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
      'data-name',
      'IPC Custom Menu'
    );
    await kando.menuWindow.keyboard.press('Escape');

    await expect
      .poll(() => interactions.some(({ interaction }) => interaction === 'closeMenu'))
      .toBe(true);
    expect(kando.errors).toEqual([]);
  } finally {
    observer.close();
    customMenuClient.close();
  }
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

test('the update-check endpoint is stubbed for offline tests', async ({ kando }) => {
  await kando.stubUpdateCheckRequest();

  expect(await kando.requestUpdateCheckEndpoint()).toBe(200);
  expect(await kando.readUpdateCheckRequests()).toEqual([
    'https://api.github.com/repos/kando-menu/kando/releases',
  ]);
  expect(kando.errors).toEqual([]);
});

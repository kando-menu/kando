// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IPCObserverClient } from '../../src/common/ipc/ipc-observer-client';
import { IPCShowCustomMenuClient } from '../../src/common/ipc/ipc-show-custom-menu-client';
import { IPC_INFO_SCHEMA } from '../../src/common/ipc/types';
import { RootMenuItem } from '../../src/common/settings-schemata';
import { expect, test } from './fixtures';
import { simpleSeed } from './simple-menus';

test.use({ seed: simpleSeed });

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

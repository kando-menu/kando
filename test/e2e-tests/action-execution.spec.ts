// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import { expect, test } from './fixtures';
import { interactionSeed } from './interaction-menus';
import { editorSeed, addAction, readMenus } from './editor-helpers';

test.describe('interaction menus', () => {
  test.use({ seed: interactionSeed });

  test('TCP, WebSocket, and command side effects reach local sinks', async ({
    kando,
  }) => {
    await kando.openMenu('E2E Menu');
    await kando.menuWindow.keyboard.press('w');
    await expect
      .poll(() => kando.sideEffects.webSocketMessages.join(''))
      .toContain('websocket hit');

    await kando.openMenu('E2E Menu');
    await kando.menuWindow.keyboard.press('c');
    await expect
      .poll(() => {
        return fs.existsSync(kando.sideEffects.commandOutputPath)
          ? fs.readFileSync(kando.sideEffects.commandOutputPath, 'utf8')
          : '';
      })
      .toContain('command fired');

    const settings = (await kando.readSettingsFile('menus')) as {
      menus: Array<{ root: { name: string } }>;
    };
    expect(settings.menus[0].root.name).toBe('E2E Menu');
    expect(kando.errors).toEqual([]);
  });
});

test.describe('editor menus', () => {
  test.use({ seed: editorSeed });

  test('editor-created command, URI, file, TCP, WebSocket, and delay actions run', async ({
    kando,
  }) => {
    const page = kando.settingsWindow;
    const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
    await previewChildren.nth(0).focus();
    await page.keyboard.press('Enter');

    await addAction(page, 'Execute Command');
    await page.getByPlaceholder('Insert any command…').fill(kando.sideEffects.command);
    await page.getByPlaceholder('Insert any command…').press('Tab');

    await addAction(page, 'Send TCP Message');
    await page.getByPlaceholder('127.0.0.1').last().fill('127.0.0.1');
    await page.getByPlaceholder('127.0.0.1').last().press('Tab');
    await page
      .locator('input[type="number"]')
      .last()
      .fill(String(kando.sideEffects.tcpPort));
    await page.locator('input[type="number"]').last().press('Enter');
    await page.getByPlaceholder('Insert a message…').last().fill('editor tcp action');
    await page.getByPlaceholder('Insert a message…').last().press('Tab');

    await addAction(page, 'Send WebSocket Message');
    const webSocketUrl = `ws://127.0.0.1:${kando.sideEffects.webSocketPort}`;
    await page.getByPlaceholder('ws://127.0.0.1:1234').fill(webSocketUrl);
    await page.getByPlaceholder('ws://127.0.0.1:1234').press('Tab');
    await page
      .getByPlaceholder('Insert a message…')
      .last()
      .fill('editor websocket action');
    await page.getByPlaceholder('Insert a message…').last().press('Tab');

    await addAction(page, 'Open URI');
    await page.getByPlaceholder('Insert any URI…').fill('https://editor.example.test');
    await page.getByPlaceholder('Insert any URI…').press('Tab');
    await kando.stubExternalOpen();
    await kando.stubFileOpen();

    await addAction(page, 'Open File');
    await page
      .getByPlaceholder('Choose a file or folder…')
      .fill(kando.sideEffects.fileToOpenPath);
    await page.getByPlaceholder('Choose a file or folder…').press('Tab');

    await addAction(page, 'Delay');
    const delayCard = page.locator('[class*="actionItem"]').filter({ hasText: 'Delay' });
    await delayCard.locator('input[type="number"]').fill('0.1');
    await delayCard.locator('input[type="number"]').press('Enter');

    await kando.previewMenu('Work Menu');
    await kando.selectItem([0]);
    await expect
      .poll(() => kando.sideEffects.tcpMessages.join(''))
      .toContain('editor tcp action');
    await expect
      .poll(() => kando.sideEffects.webSocketMessages.join(''))
      .toContain('editor websocket action');
    await expect
      .poll(() => fs.existsSync(kando.sideEffects.commandOutputPath))
      .toBe(true);
    await expect
      .poll(() => kando.readExternalOpenRequests())
      .toEqual(['https://editor.example.test']);
    await expect
      .poll(() => kando.readFileOpenRequests())
      .toContain(kando.sideEffects.fileToOpenPath);

    await kando.menuWindow.keyboard.press('Escape');
    await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
    expect(kando.errors).toEqual([]);
  });

  test('open-menu action configured in the editor opens the chosen menu', async ({
    kando,
  }) => {
    const page = kando.settingsWindow;
    const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
    await previewChildren.nth(0).focus();
    await page.keyboard.press('Enter');

    await addAction(page, 'Open Menu');
    await page.locator('select').last().selectOption('Personal Menu');
    await expect
      .poll(async () => {
        const item = (await readMenus(kando))[0].root.children[0];
        return item.type === 'button' ? item.selectWorkflow?.actions[0] : undefined;
      })
      .toMatchObject({ type: 'open-menu', menu: 'Personal Menu' });

    await kando.previewMenu('Work Menu');
    await kando.selectItem([0]);
    await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
      'data-name',
      'Personal Menu'
    );
    await kando.menuWindow.keyboard.press('Escape');
    await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
    expect(kando.errors).toEqual([]);
  });
});

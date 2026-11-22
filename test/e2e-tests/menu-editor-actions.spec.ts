// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { editorSeed, readMenus, addAction } from './editor-helpers';

test.use({ seed: editorSeed });

test('workflow editor configures all action forms and stores their JSON', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');

  await addAction(page, 'Execute Command');
  await page.getByPlaceholder('Insert any command…').fill('printf e2e');
  await page.getByPlaceholder('Insert any command…').press('Tab');

  await addAction(page, 'Execute Macro');
  const macro = page.getByPlaceholder('Hit the record button to start recording!');
  await macro.fill("{type: 'keyDown', key: 'KeyA'}");
  await macro.evaluate((element) => element.blur());

  await addAction(page, 'Focus Window');
  await page.getByPlaceholder('App name').fill('test-app');
  await page.getByPlaceholder('App name').press('Tab');
  await page.getByPlaceholder('Window title').fill('test-window');
  await page.getByPlaceholder('Window title').press('Tab');

  await addAction(page, 'Open File');
  await page.getByPlaceholder('Choose a file or folder…').fill('/tmp/e2e-file');
  await page.getByPlaceholder('Choose a file or folder…').press('Tab');

  await addAction(page, 'Open Menu');
  await page.locator('select').last().selectOption('Personal Menu');

  await addAction(page, 'Open URI');
  await page.getByPlaceholder('Insert any URI…').fill('https://example.test');
  await page.getByPlaceholder('Insert any URI…').press('Tab');

  await addAction(page, 'Set Clipboard');
  await page.getByPlaceholder('Insert any text…').fill('clipboard e2e');
  await page.getByPlaceholder('Insert any text…').press('Tab');

  await addAction(page, 'Send WebSocket Message');
  const webSocketUrl = `ws://127.0.0.1:${kando.sideEffects.webSocketPort}`;
  await page.getByPlaceholder('ws://127.0.0.1:1234').fill(webSocketUrl);
  await page.getByPlaceholder('ws://127.0.0.1:1234').press('Tab');
  await page.getByPlaceholder('Insert a message…').last().fill('configured websocket');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');

  await addAction(page, 'Send TCP Message');
  await page.getByPlaceholder('127.0.0.1').last().fill('127.0.0.1');
  await page.getByPlaceholder('127.0.0.1').last().press('Tab');
  await page
    .locator('input[type="number"]')
    .last()
    .fill(String(kando.sideEffects.tcpPort));
  await page.locator('input[type="number"]').last().press('Enter');
  await page.getByPlaceholder('Insert a message…').last().fill('configured tcp');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');
  await page.getByRole('checkbox', { name: 'Append line break' }).check();

  await addAction(page, 'Simulate Hotkey');
  const hotkey = page.locator('[class*="actionItem"]').filter({
    hasText: 'Simulate Hotkey',
  });
  await hotkey.locator('input').fill('ControlLeft+KeyA');
  await hotkey.locator('input').press('Enter');

  await addAction(page, 'Delay');
  const delayCard = page.locator('[class*="actionItem"]').filter({ hasText: 'Delay' });
  await delayCard.locator('input[type="number"]').fill('0.5');
  await delayCard.locator('input[type="number"]').press('Enter');

  await expect
    .poll(async () => {
      const item = (await readMenus(kando))[0].root.children[0];
      return item.type === 'button' ? item.selectWorkflow?.actions.length : -1;
    })
    .toBe(11);

  const item = (await readMenus(kando))[0].root.children[0];
  if (item.type !== 'button') {
    throw new Error('Expected the edited menu item to remain a button.');
  }
  expect(item.selectWorkflow?.actions).toMatchObject([
    { type: 'execute-command', command: 'printf e2e' },
    { type: 'execute-macro', macro: [{ type: 'keyDown', key: 'KeyA' }] },
    { type: 'focus-window', appName: 'test-app', windowName: 'test-window' },
    { type: 'open-file', path: '/tmp/e2e-file' },
    { type: 'open-menu', menu: 'Personal Menu' },
    { type: 'open-uri', uri: 'https://example.test' },
    { type: 'set-clipboard', text: 'clipboard e2e' },
    {
      type: 'send-websocket-message',
      url: webSocketUrl,
      message: 'configured websocket',
    },
    {
      type: 'send-tcp-message',
      host: '127.0.0.1',
      port: kando.sideEffects.tcpPort,
      message: 'configured tcp',
      appendNewline: true,
    },
    { type: 'simulate-hotkey', hotkey: 'ControlLeft+KeyA' },
    { type: 'delay', duration: 0.5 },
  ]);
  expect(kando.errors).toEqual([]);
});

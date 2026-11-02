// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { interactionSeed } from './interaction-menus';

test.use({ seed: interactionSeed });

test.describe('with the default menus', () => {
  test.use({ seed: undefined });

  test('menu can be opened via the command line and closed with escape', async ({
    kando,
  }) => {
    const menu = kando.menuWindow.locator('#kando-menu');

    // The menu is hidden until it is requested.
    await expect(menu.locator('.menu-node')).toHaveCount(0);

    // This is forwarded to the already running instance.
    await kando.openMenu('Example Menu');

    await expect(menu).not.toHaveClass(/hidden/);
    await expect(menu.locator('.menu-node.type-root')).toHaveAttribute(
      'data-name',
      'Example Menu'
    );

    await kando.menuWindow.keyboard.press('Escape');

    // Once the fade-out is done, the menu is cleared.
    await expect(menu.locator('.menu-node')).toHaveCount(0);
    await expect(menu).toHaveClass(/hidden/);

    // Give the main process time to hide the window after the fade-out.
    await kando.menuWindow.waitForTimeout(500);

    expect(kando.errors).toEqual([]);
  });
});

test('menu opens and closes through the settings preview API', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.previewMenu('E2E Menu');
  await expect(menu.locator('.type-root')).toHaveAttribute('data-name', 'E2E Menu');

  await kando.menuWindow.keyboard.press('Escape');
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('menu closes on outside click and right-click', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  const outside = await menu.evaluate((element) => ({
    x: element.clientWidth - 5,
    y: element.clientHeight - 5,
  }));
  await menu.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
  await menu.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
  await menu.dispatchEvent('pointerdown', {
    button: 0,
    buttons: 1,
    clientX: outside.x,
    clientY: outside.y,
  });
  await menu.dispatchEvent('pointerup', {
    button: 0,
    buttons: 0,
    clientX: outside.x,
    clientY: outside.y,
  });
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.openMenu('E2E Menu');
  await menu.dispatchEvent('pointerdown', {
    button: 2,
    buttons: 2,
    clientX: 1,
    clientY: 1,
  });
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('settings button in the menu opens settings', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  await kando.menuWindow
    .locator('#settings-button')
    .evaluate((button) =>
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    );
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  await expect
    .poll(() => kando.settingsWindow.evaluate(() => document.hasFocus()))
    .toBe(true);
  expect(kando.errors).toEqual([]);
});

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { test, expect } from './fixtures';

test('menu can be opened via the command line and closed with escape', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');

  const settle = async () => {
    await menu.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished))
    );
    await kando.menuWindow.waitForTimeout(300);
  };

  // The menu is hidden until it is requested.
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  // This is forwarded to the already running instance.
  await kando.runCommand('--menu', 'Example Menu');

  await expect(menu).not.toHaveClass(/hidden/);
  await expect(menu.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'Example Menu'
  );

  // Let the fade-in and all menu animations finish before interacting with the menu.
  await settle();

  await kando.menuWindow.keyboard.press('Escape');

  // Once the fade-out is done, the menu is cleared.
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  await expect(menu).toHaveClass(/hidden/);

  // Give the main process time to hide the window after the fade-out.
  await kando.menuWindow.waitForTimeout(500);

  expect(kando.errors).toEqual([]);
});

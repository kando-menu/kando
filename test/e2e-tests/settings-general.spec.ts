// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';

test('general settings dialog can be opened and closed with the mouse', async ({
  kando,
}) => {
  const page = kando.settingsWindow;

  const welcomeTitle = page.getByText('Welcome to Kando!');
  await expect(welcomeTitle).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(welcomeTitle).toBeHidden();

  // The toolbar buttons have no text, so we find them by their tooltip.
  await page.locator('button[data-tooltip-content="General Settings"]').click();

  const dialogTitle = page.getByText('General Settings', { exact: true });
  await expect(dialogTitle).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(dialogTitle).toBeHidden();

  expect(kando.errors).toEqual([]);
});

test('menu behavior tab offers configurable right and middle mouse buttons', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('button[data-tooltip-content="General Settings"]').click();
  await page
    .locator('div[class^="category"]')
    .filter({ hasText: 'Menu Behavior' })
    .click();

  // Each dropdown sits in a row with a label span. The innermost row div containing the
  // label span and exactly one select ties every select to its label text.
  const selectOf = (label: string) =>
    page
      .locator('div')
      .filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) })
      .filter({ has: page.locator('select') })
      .last()
      .locator('select');
  const rightSelect = selectOf('Right mouse button');
  const middleSelect = selectOf('Middle mouse button');
  await expect(rightSelect).toHaveCount(1);
  await expect(middleSelect).toHaveCount(1);
  await expect(page.getByText('Right mouse button selects parent')).toHaveCount(0);

  // Check the defaults, then change both and check that the config file follows.
  await expect(rightSelect).toHaveValue('close');
  await expect(middleSelect).toHaveValue('nothing');
  await rightSelect.selectOption('select-parent');
  await middleSelect.selectOption('close');

  await expect
    .poll(async () => {
      const config = (await kando.readSettingsFile('config')) as {
        rightMouseButtonBehavior: string;
        middleMouseButtonBehavior: string;
      };
      return [config.rightMouseButtonBehavior, config.middleMouseButtonBehavior];
    })
    .toEqual(['select-parent', 'close']);
  expect(kando.errors).toEqual([]);
});

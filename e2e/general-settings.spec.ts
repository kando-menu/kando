// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { test, expect } from './fixtures';

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

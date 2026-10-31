// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { test, expect } from './fixtures';

test('settings window renders without errors', async ({ kando }) => {
  const page = kando.settingsWindow;

  // The welcome dialog is shown on the first start.
  await expect(page.getByText('Welcome to Kando!')).toBeVisible();

  expect(kando.errors).toEqual([]);
});

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { editorSeed } from './editor-helpers';

test.use({ seed: editorSeed });

test('menu theme presets can be saved and applied', async ({ kando }) => {
  const page = kando.settingsWindow;
  await page.locator('[data-tooltip-content="Menu Themes"]').click();

  const themes = await page.evaluate(() => window.settingsAPI.getAllMenuThemes());
  const theme = themes.find((entry) => entry.id === 'default');
  if (!theme) {
    throw new Error('The bundled default menu theme was not available.');
  }

  const saveButton = page.locator('[data-tooltip-content="Save preset"]');
  await saveButton.click();
  await page.getByPlaceholder('e.g. My Custom Colors').fill('E2E Preset');
  await page.getByRole('button', { name: 'Save preset' }).click();

  const presets = () =>
    page.evaluate(() => window.settingsAPI.getMenuThemePresets('default'));
  await expect
    .poll(presets)
    .toContainEqual(expect.objectContaining({ name: 'E2E Preset' }));
  const savedPreset = (await presets()).find((preset) => preset.name === 'E2E Preset');
  expect(savedPreset?.colors).toEqual(theme.colors);

  await page.locator('select').selectOption('E2E Preset');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const settings = await window.commonAPI.generalSettings.get();
        return settings.menuThemeColors.default;
      })
    )
    .toEqual(theme.colors);
  expect(kando.errors).toEqual([]);
});

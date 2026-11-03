// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { interactionSeed, BASE64_ICON } from './interaction-menus';

test.use({ seed: interactionSeed });

test('emoji, Material Symbols, Simple Icons, file, and base64 icons render', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('Icon Menu');

  const icon = (name: string) =>
    menu.locator(
      `.menu-node.type-button[data-name=${JSON.stringify(name)}] .icon-container`
    );
  await expect(icon('Emoji icon').locator('.emoji-icon')).toHaveText('🌈');
  await expect(icon('Material icon').locator('.material-symbols-rounded')).toHaveText(
    'settings'
  );
  await expect(icon('Simple icon').locator('.si.si-github')).toHaveCount(1);
  await expect(icon('File icon').locator('svg')).toHaveCount(1);
  await expect(icon('Base64 icon').locator('img')).toHaveAttribute('src', BASE64_ICON);
  expect(kando.errors).toEqual([]);
});

test('each bundled menu theme renders without errors', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  const themeIDs = ['default', 'clean-circle', 'neon-lights', 'purity', 'rainbow-labels'];

  await kando.settingsWindow.evaluate(async () => {
    const settings = await window.commonAPI.generalSettings.get();
    window.commonAPI.generalSettings.set({ ...settings, enableSelectionWedges: true });
  });

  for (const themeID of themeIDs) {
    await kando.settingsWindow.evaluate(async (id) => {
      const settings = await window.commonAPI.generalSettings.get();
      window.commonAPI.generalSettings.set({ ...settings, menuTheme: id });
    }, themeID);
    await expect
      .poll(() =>
        kando.menuWindow.evaluate(async () => (await window.commonAPI.getMenuTheme()).id)
      )
      .toBe(themeID);
    const description = await kando.menuWindow.evaluate(() =>
      window.commonAPI.getMenuTheme()
    );

    await kando.openMenu('E2E Menu');
    await expect(menu.locator('.type-root')).toHaveAttribute('data-name', 'E2E Menu');
    await expect(menu.locator('.selection-wedges')).toHaveCount(
      description.drawSelectionWedges ? 1 : 0
    );
    await expect(menu.locator('.wedge-separators')).toHaveCount(
      description.drawWedgeSeparators ? 1 : 0
    );
    await kando.menuWindow.keyboard.press('Escape');
    await expect(menu.locator('.menu-node')).toHaveCount(0);
  }

  expect(kando.errors).toEqual([]);
});

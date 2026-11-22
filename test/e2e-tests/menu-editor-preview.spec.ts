// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { editorSeed, readMenus } from './editor-helpers';

test.use({ seed: editorSeed });

test('preview edits menu items and workflows and persists them after restart', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
  await expect(previewChildren).toHaveCount(2);

  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');
  const itemName = page.locator('input[class*="invisible"]');
  await expect(itemName).toHaveValue('First Item');
  await itemName.fill('Edited Item');
  await itemName.press('Enter');
  await expect
    .poll(async () => (await readMenus(kando))[0].root.children[0].name)
    .toBe('Edited Item');

  const selectedItemTools = page.locator('[data-tooltip-content="Duplicate menu item"]');
  await selectedItemTools.click();
  await expect.poll(async () => (await readMenus(kando))[0].root.children.length).toBe(3);

  await page.locator('[data-tooltip-content="Delete menu item"]').click();
  await expect.poll(async () => (await readMenus(kando))[0].root.children.length).toBe(2);

  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Add Action' }).click();
  const actionPicker = page.getByPlaceholder('Search for an action…');
  await expect(actionPicker).toBeVisible();
  await actionPicker.fill('Delay');
  await page.getByRole('button', { name: /Delay/ }).click();
  const delayCard = page.locator('[class*="actionItem"]').filter({ hasText: 'Delay' });
  await delayCard.locator('input[type="number"]').fill('0.5');
  await delayCard.locator('input[type="number"]').press('Enter');
  await expect
    .poll(async () => {
      const item = (await readMenus(kando))[0].root.children[0];
      return item.type === 'button' ? item.selectWorkflow?.actions[0] : undefined;
    })
    .toMatchObject({ type: 'delay', duration: 0.5 });

  await kando.restart();
  const savedMenus = await readMenus(kando);
  expect(savedMenus[0].root.children.map((child) => child.name)).toEqual([
    'Edited Item',
    'Nested Menu',
  ]);
  expect(savedMenus[0].root.children[0]).toMatchObject({
    selectWorkflow: { actions: [{ type: 'delay', duration: 0.5 }] },
  });
  expect(kando.errors).toEqual([]);
});

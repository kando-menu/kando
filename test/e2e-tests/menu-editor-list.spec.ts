// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuV2 } from '../../src/common/settings-schemata';
import { expect, test } from './fixtures';
import { editorSeed, readMenus, menuTitle, menuCard } from './editor-helpers';

test.use({ seed: editorSeed });

test('menu editor supports list management, collections, tags, search, and persistence', async ({
  kando,
}) => {
  const page = kando.settingsWindow;

  await expect(menuTitle(page, 'Work Menu')).toBeVisible();
  await expect(menuTitle(page, 'Personal Menu')).toBeVisible();

  await menuCard(page, 'Work Menu').click();
  await page.locator('input[class*="invisible"]').fill('Renamed Work Menu');
  await page.locator('input[class*="invisible"]').press('Enter');
  await expect(menuTitle(page, 'Renamed Work Menu')).toBeVisible();
  await expect
    .poll(async () => (await readMenus(kando))[0].root.name)
    .toBe('Renamed Work Menu');

  const menuTags = page.getByPlaceholder('Add tags…');
  await menuTags.fill('editor-tag');
  await menuTags.press('Enter');
  await expect.poll(async () => (await readMenus(kando))[0].tags).toContain('editor-tag');

  const renamedCard = menuCard(page, 'Renamed Work Menu').first();
  await renamedCard.locator('[data-tooltip-content="Duplicate menu"]').click();
  await expect(menuTitle(page, 'Renamed Work Menu')).toHaveCount(2);
  expect((await readMenus(kando)).map((menu) => menu.root.name)).toEqual([
    'Renamed Work Menu',
    'Renamed Work Menu',
    'Personal Menu',
  ]);

  await menuCard(page, 'Personal Menu').dragTo(
    menuCard(page, 'Renamed Work Menu').first()
  );
  await expect
    .poll(async () => (await readMenus(kando)).map((menu) => menu.root.name))
    .toEqual(['Personal Menu', 'Renamed Work Menu', 'Renamed Work Menu']);

  const collectionAdd = page.locator(
    '[data-tooltip-content^="Create a new menu collection"]'
  );
  await collectionAdd.click();
  const collectionName = page.locator('input[class*="collectionName"]');
  await expect(collectionName).toBeVisible();
  await collectionName.fill('Work Collection');
  await collectionName.press('Tab');
  const collectionTags = page.getByPlaceholder('Add tags…');
  await collectionTags.fill('editor-tag');
  await collectionTags.press('Enter');

  await page.locator('[data-tooltip-content="All Menus"]').click();

  await page.locator('[data-tooltip-content="Work Collection"]').click();
  await expect(menuTitle(page, 'Renamed Work Menu')).toHaveCount(2);
  await expect(menuTitle(page, 'Personal Menu')).toHaveCount(0);

  await page.locator('[data-tooltip-content="All Menus"]').click();
  await page.keyboard.press('Control+f');
  const search = page.getByPlaceholder('Search menus…');
  await expect(search).toBeVisible();
  await search.fill('Personal');
  await expect(menuTitle(page, 'Personal Menu')).toBeVisible();
  await expect(menuTitle(page, 'Renamed Work Menu')).toHaveCount(0);

  await search.fill('');
  await page.getByRole('button', { name: 'Add Menu' }).click();
  await expect(menuTitle(page, 'New Menu')).toBeVisible();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(4);

  const newMenuCard = menuCard(page, 'New Menu');
  await newMenuCard.locator('[data-tooltip-content="Delete menu"]').click();
  await expect(menuTitle(page, 'New Menu')).toHaveCount(0);
  await expect.poll(async () => (await readMenus(kando)).length).toBe(3);

  await kando.restart();
  expect((await readMenus(kando)).map((menu) => menu.root.name)).toEqual([
    'Personal Menu',
    'Renamed Work Menu',
    'Renamed Work Menu',
  ]);
  expect(kando.errors).toEqual([]);
});

test('menu preview adds an item from the footer by drag and drop', async ({ kando }) => {
  const page = kando.settingsWindow;
  const preview = page.locator('[class*="transitionContainer"]').last();
  const bounds = await preview.boundingBox();
  if (!bounds) {
    throw new Error('Could not measure the menu preview drop target.');
  }

  const footerItem = page.locator('[class*="newItems"] [data-tooltip-content="Submenu"]');
  await footerItem.dragTo(preview, {
    targetPosition: { x: bounds.width / 2 + 60, y: bounds.height / 2 },
  });
  await expect.poll(async () => (await readMenus(kando))[0].root.children.length).toBe(3);
  expect((await readMenus(kando))[0].root.children).toContainEqual(
    expect.objectContaining({ type: 'submenu', name: 'Submenu', children: [] })
  );
  expect(kando.errors).toEqual([]);
});

test('menu behavior, conditions, and shortcut edits are persisted', async ({ kando }) => {
  const page = kando.settingsWindow;
  await page.getByText('Menu Behavior', { exact: true }).click();

  const behaviorCheckbox = (name: string) =>
    page.locator('label').filter({ hasText: name }).getByRole('checkbox');
  await behaviorCheckbox('Fixed Position Mode').check();
  await page.getByPlaceholder('X').fill('0.2');
  await page.getByPlaceholder('Y').fill('0.8');
  await page.getByPlaceholder('Y').press('Tab');
  await behaviorCheckbox('Anchored Mode').check();
  await behaviorCheckbox('Hover Mode').check();

  await page.getByText('Menu Conditions', { exact: true }).click();
  await behaviorCheckbox('Limit to Specific Apps').check();
  await page.getByPlaceholder('App name').fill('test-app');
  await page.getByPlaceholder('App name').press('Tab');
  await page.locator('[data-tooltip-content="Select an app"]').click();
  await expect(page.getByRole('button', { name: 'Start countdown' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await behaviorCheckbox('Limit to Specific Window Titles').check();
  await page.getByPlaceholder('Window title').fill('test-window');
  await page.getByPlaceholder('Window title').press('Tab');
  await page.locator('[data-tooltip-content="Select a window"]').click();
  await expect(page.getByRole('button', { name: 'Start countdown' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await behaviorCheckbox('Limit to Specific Screen Area').check();
  await page.getByPlaceholder('Top').fill('10');
  await page.getByPlaceholder('Left').fill('20');
  await page.getByPlaceholder('Bottom').fill('80');
  await page.getByPlaceholder('Right').fill('90');
  await page.getByPlaceholder('Right').press('Tab');
  await page.locator('[data-tooltip-content="Select a screen area"]').click();
  await expect(page.getByRole('button', { name: 'Use this area' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel' }).click();

  const settings = await kando.readSettingsFile();
  const menu = (settings as { menus: MenuV2[] }).menus[0];
  expect(menu).toMatchObject({
    useFixedPosition: true,
    fixedMenuPosition: { x: 0.2, y: 0.8 },
    anchored: true,
    hoverMode: true,
    conditions: {
      appName: 'test-app',
      windowName: 'test-window',
      screenArea: { xMin: 20, yMin: 10, xMax: 90, yMax: 80 },
    },
  });

  await page.getByText('Menu Behavior', { exact: true }).click();
  await page.locator('[data-tooltip-content="Select a fixed position"]').click();
  await page.locator('[data-tooltip-content="Set position to center"]').click();
  await page.getByRole('button', { name: 'Use this position' }).click();
  await expect
    .poll(async () => (await readMenus(kando))[0].fixedMenuPosition)
    .toEqual({ x: 0.5, y: 0.5 });

  const shortcutInput = page.locator('[class*="shortcutPicker"] input').first();
  await shortcutInput.fill('Control+Alt+K');
  await shortcutInput.press('Enter');
  await expect
    .poll(async () => (await readMenus(kando))[0].shortcut)
    .toBe('Control+Alt+K');
  await page.locator('[class*="shortcutPicker"] button').first().click();
  await page.keyboard.press('Control+Alt+L');
  await expect
    .poll(async () => (await readMenus(kando))[0].shortcut)
    .toBe('Control+Alt+L');
  await shortcutInput.fill('');
  await shortcutInput.press('Enter');
  await expect.poll(async () => (await readMenus(kando))[0].shortcut).toBe('');

  await kando.restart();
  expect((await readMenus(kando))[0]).toMatchObject({
    useFixedPosition: true,
    fixedMenuPosition: { x: 0.5, y: 0.5 },
    anchored: true,
    hoverMode: true,
    conditions: {
      appName: 'test-app',
      windowName: 'test-window',
    },
  });
  expect(kando.errors).toEqual([]);
});

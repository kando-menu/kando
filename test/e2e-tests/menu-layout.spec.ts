// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { interactionSeed } from './interaction-menus';

test.use({ seed: interactionSeed });

test('fixed menu positions are clamped and centered on screen', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  const viewport = await kando.menuWindow.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  await kando.openMenu('Edge Menu');
  const edgeIcon = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!edgeIcon) {
    throw new Error('Could not measure the edge-positioned root icon.');
  }
  expect(edgeIcon.x).toBeGreaterThanOrEqual(0);
  expect(edgeIcon.y).toBeGreaterThanOrEqual(0);
  expect(edgeIcon.x + edgeIcon.width).toBeLessThanOrEqual(viewport.width);
  expect(edgeIcon.y + edgeIcon.height).toBeLessThanOrEqual(viewport.height);
  await kando.menuWindow.keyboard.press('Escape');
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.openMenu('Centered Menu');
  const centeredIcon = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!centeredIcon) {
    throw new Error('Could not measure the centered root icon.');
  }
  expect(
    Math.abs(centeredIcon.x + centeredIcon.width / 2 - viewport.width / 2)
  ).toBeLessThan(3);
  expect(
    Math.abs(centeredIcon.y + centeredIcon.height / 2 - viewport.height / 2)
  ).toBeLessThan(3);
  expect(kando.errors).toEqual([]);
});

test('anchored submenus stay at the original menu center and many children render', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('Anchored Menu');
  const rootIcon = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!rootIcon) {
    throw new Error('Could not measure the anchored root icon.');
  }
  const initialCenter = {
    x: rootIcon.x + rootIcon.width / 2,
    y: rootIcon.y + rootIcon.height / 2,
  };
  await kando.selectItem([0]);
  const submenuIcon = await menu
    .locator('.type-submenu.active > .icon-layer > .icon-container')
    .boundingBox();
  if (!submenuIcon) {
    throw new Error('Could not measure the anchored submenu icon.');
  }
  expect(Math.abs(submenuIcon.x + submenuIcon.width / 2 - initialCenter.x)).toBeLessThan(
    3
  );
  expect(Math.abs(submenuIcon.y + submenuIcon.height / 2 - initialCenter.y)).toBeLessThan(
    3
  );

  await kando.openMenu('Many Items');
  const items = menu.locator('.type-button');
  await expect(items).toHaveCount(20);
  const angles = await items.evaluateAll((nodes) =>
    nodes.map((node) =>
      Number.parseFloat(window.getComputedStyle(node).getPropertyValue('--angle'))
    )
  );
  expect(angles.every(Number.isFinite)).toBe(true);
  expect(new Set(angles).size).toBe(angles.length);
  expect(kando.errors).toEqual([]);
});

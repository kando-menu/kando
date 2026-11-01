// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { menus, interactionSeed, releaseDeferredTurboMode } from './interaction-menus';

test.use({ seed: interactionSeed });

test.describe('pointer gesture modes', () => {
  test.use({
    seed: {
      menus,
      config: {
        showIntroductionDialog: false,
        enableMenuAnimations: false,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        maxSelectionRadius: 400,
        hideOnFocusOut: false,
        gestureMinStrokeLength: 0,
      },
    },
  });

  test('turbo mode opens a submenu while holding a modifier key', async ({ kando }) => {
    const menu = kando.menuWindow.locator('#kando-menu');
    await kando.openMenu('E2E Menu');
    await releaseDeferredTurboMode(kando);

    const root = await menu
      .locator('.type-root > .icon-layer > .icon-container')
      .boundingBox();
    const submenu = await menu
      .locator('.type-submenu[data-name="Submenu"] > .icon-layer > .icon-container')
      .boundingBox();
    if (!root || !submenu) {
      throw new Error('Could not measure the menu items for the turbo-mode gesture.');
    }

    const start = { x: root.x + root.width / 2, y: root.y + root.height / 2 };
    const end = {
      x: submenu.x + submenu.width / 2,
      y: submenu.y + submenu.height / 2,
    };
    await menu.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
    await menu.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
    await kando.menuWindow.keyboard.down('Control');
    for (let step = 1; step <= 8; step++) {
      await menu.dispatchEvent('pointermove', {
        clientX: start.x + ((end.x - start.x) * step) / 8,
        clientY: start.y + ((end.y - start.y) * step) / 8,
        ctrlKey: true,
      });
      await kando.menuWindow.waitForTimeout(20);
    }
    await kando.menuWindow.keyboard.up('Control');
    await expect(menu.locator('.type-submenu.active')).toHaveAttribute(
      'data-name',
      'Submenu'
    );
    expect(kando.errors).toEqual([]);
  });

  test('hover mode selects a leaf item without a click', async ({ kando }) => {
    const menu = kando.menuWindow.locator('#kando-menu');
    await kando.openMenu('Hover Menu');
    await releaseDeferredTurboMode(kando);

    const root = await menu
      .locator('.type-root > .icon-layer > .icon-container')
      .boundingBox();
    const action = await menu
      .locator('.type-button[data-name="TCP action"] > .icon-layer > .icon-container')
      .boundingBox();
    if (!root || !action) {
      throw new Error('Could not measure the menu items for the hover-mode interaction.');
    }

    const start = { x: root.x + root.width / 2, y: root.y + root.height / 2 };
    const end = { x: action.x + action.width / 2, y: action.y + action.height / 2 };
    await menu.dispatchEvent('pointermove', { clientX: start.x, clientY: start.y });
    await menu.dispatchEvent('pointermove', { clientX: start.x, clientY: start.y });
    for (let step = 1; step <= 8; step++) {
      await menu.dispatchEvent('pointermove', {
        clientX: start.x + ((end.x - start.x) * step) / 8,
        clientY: start.y + ((end.y - start.y) * step) / 8,
      });
      await kando.menuWindow.waitForTimeout(20);
    }
    await expect.poll(() => kando.sideEffects.tcpMessages.join('')).toContain('tcp hit');
    expect(kando.errors).toEqual([]);
  });
});

test('pointer selects actions and opens submenus with parent navigation', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');

  await kando.openMenu('E2E Menu');
  await expect(menu.locator('.type-button[data-name="TCP action"]')).toHaveCSS(
    '--angle',
    '90deg'
  );
  await kando.selectItem([1]);
  await expect(menu).not.toHaveClass(/hidden/);
  await expect.poll(() => kando.sideEffects.tcpMessages.join('')).toContain('tcp hit');
  await kando.menuWindow.keyboard.press('Escape');
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.openMenu('E2E Menu');
  await kando.selectItem([0]);
  await expect(menu.locator('.type-submenu.active')).toHaveAttribute(
    'data-name',
    'Submenu'
  );
  const nestedAction = menu.locator('.type-button[data-name="Nested action"]');
  await expect(nestedAction).toHaveClass(/child/);

  const nestedIcon = await nestedAction
    .locator(':scope > .icon-layer > .icon-container')
    .boundingBox();
  if (!nestedIcon) {
    throw new Error('Could not measure the nested menu item.');
  }
  const container = menu;
  await container.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
  await container.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
  await container.dispatchEvent('pointermove', {
    clientX: nestedIcon.x + nestedIcon.width / 2,
    clientY: nestedIcon.y + nestedIcon.height / 2,
  });
  await expect(nestedAction).toHaveClass(/hovered/);
  await expect(kando.menuWindow.locator('.center-text').last()).toContainText(
    'Nested action'
  );

  await kando.selectItem([]);
  await expect(menu.locator('.type-root.active')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  expect(kando.errors).toEqual([]);
});

test('marking mode opens a submenu by dragging to it', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  const root = menu.locator('.type-root > .icon-layer > .icon-container');
  const submenu = menu.locator(
    '.type-submenu[data-name="Submenu"] > .icon-layer > .icon-container'
  );
  const rootBox = await root.boundingBox();
  const submenuBox = await submenu.boundingBox();
  if (!rootBox || !submenuBox) {
    throw new Error('Could not measure the menu items for the marking-mode gesture.');
  }

  const start = {
    x: rootBox.x + rootBox.width / 2,
    y: rootBox.y + rootBox.height / 2,
  };
  const end = {
    x: submenuBox.x + submenuBox.width / 2,
    y: submenuBox.y + submenuBox.height / 2,
  };

  await kando.menuWindow.mouse.move(start.x, start.y);
  await kando.menuWindow.mouse.down();
  await kando.menuWindow.mouse.move(end.x, end.y, { steps: 8 });
  await kando.menuWindow.mouse.up();

  await expect(menu.locator('.type-submenu.active')).toHaveAttribute(
    'data-name',
    'Submenu'
  );
  expect(kando.errors).toEqual([]);
});

test('movement under and over the drag threshold has distinct click behavior', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');

  await kando.openMenu('E2E Menu');
  const root = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!root) {
    throw new Error('Could not measure the root menu icon.');
  }
  const center = { x: root.x + root.width / 2, y: root.y + root.height / 2 };
  await kando.menuWindow.mouse.move(center.x, center.y);
  await kando.menuWindow.mouse.down();
  await kando.menuWindow.mouse.move(center.x + 5, center.y);
  await kando.menuWindow.mouse.up();
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.openMenu('E2E Menu');
  const reopenedRoot = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!reopenedRoot) {
    throw new Error('Could not measure the reopened root menu icon.');
  }
  const reopenedCenter = {
    x: reopenedRoot.x + reopenedRoot.width / 2,
    y: reopenedRoot.y + reopenedRoot.height / 2,
  };
  await kando.menuWindow.mouse.move(reopenedCenter.x, reopenedCenter.y);
  await kando.menuWindow.mouse.down();
  await kando.menuWindow.mouse.move(reopenedCenter.x + 20, reopenedCenter.y);
  await kando.menuWindow.mouse.up();
  await expect(menu.locator('.type-root')).toHaveAttribute('data-name', 'E2E Menu');
  expect(kando.errors).toEqual([]);
});

test('scroll deltas accumulate before triggering root scroll workflows', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  const rootIcon = await menu
    .locator('.type-root > .icon-layer > .icon-container')
    .boundingBox();
  if (!rootIcon) {
    throw new Error('Could not measure the root menu icon.');
  }
  const x = rootIcon.x + rootIcon.width / 2;
  const y = rootIcon.y + rootIcon.height / 2;
  await menu.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
  await menu.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
  await expect(async () => {
    await menu.dispatchEvent('pointermove', { clientX: x, clientY: y });
    await expect(menu.locator('.type-root')).toHaveClass(/hovered/, { timeout: 500 });
  }).toPass();

  await menu.dispatchEvent('wheel', { deltaY: -20, deltaMode: 0 });
  expect(kando.sideEffects.tcpMessages.join('')).not.toContain('root scroll up');
  await menu.dispatchEvent('wheel', { deltaY: -20, deltaMode: 0 });
  await expect
    .poll(() => kando.sideEffects.tcpMessages.join(''))
    .toContain('root scroll up');
  expect(kando.errors).toEqual([]);
});

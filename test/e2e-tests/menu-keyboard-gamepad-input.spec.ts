// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { interactionSeed } from './interaction-menus';

test.use({ seed: interactionSeed });

test('keyboard quick-select and arrow keys navigate menu items', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  await kando.menuWindow.keyboard.press('s');
  await expect(menu.locator('.type-submenu.active')).toHaveAttribute(
    'data-name',
    'Submenu'
  );

  await kando.menuWindow.keyboard.press('Backspace');
  await expect(menu.locator('.type-root.active')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );

  await kando.menuWindow.keyboard.press('ArrowRight');
  await expect(menu.locator('.hovered')).toHaveAttribute('data-name', 'TCP action');
  await kando.menuWindow.keyboard.press('Enter');
  await expect.poll(() => kando.sideEffects.tcpMessages.join('')).toContain('tcp hit');

  await kando.openMenu('E2E Menu');
  await kando.menuWindow.keyboard.press('5');
  await expect.poll(() => kando.sideEffects.tcpMessages.join('')).toContain('number hit');
  expect(kando.errors).toEqual([]);
});

test('a synthetic gamepad selects a menu action', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.menuWindow.evaluate(() => {
    const gamepad = {
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 4 }, () => ({
        pressed: false,
        touched: false,
        value: 0,
      })),
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [gamepad],
    });
    window.addEventListener('kando-e2e-gamepad-state', (event) => {
      const state = (event as CustomEvent<{ x: number; select: boolean }>).detail;
      gamepad.axes[0] = state.x;
      gamepad.buttons[0].pressed = state.select;
    });
    window.dispatchEvent(new Event('focus'));
  });

  await kando.openMenu('E2E Menu');
  await kando.menuWindow.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('kando-e2e-gamepad-state', { detail: { x: 1, select: false } })
    );
  });
  await expect(menu.locator('.type-button[data-name="TCP action"]')).toHaveClass(
    /hovered/
  );
  await kando.menuWindow.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('kando-e2e-gamepad-state', { detail: { x: 1, select: true } })
    );
  });
  await expect.poll(() => kando.sideEffects.tcpMessages.join('')).toContain('tcp hit');
  expect(kando.errors).toEqual([]);
});

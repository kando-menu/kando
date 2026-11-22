// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { version } from '../../package.json';
import { expect, test } from './fixtures';
import { simpleSeed } from './simple-menus';

test.use({ seed: simpleSeed });

test('menu opens via CLI and unknown names leave it closed', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');

  await expect(menu.locator('.menu-node')).toHaveCount(0);
  await kando.openMenu('E2E Menu');
  await expect(menu.locator('.type-root')).toHaveAttribute('data-name', 'E2E Menu');

  await kando.menuWindow.keyboard.press('Escape');
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.runCommand('--menu', 'Unknown E2E Menu');
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('CLI version and help flags print their output', async ({ kando }) => {
  const versionResult = await kando.runCommandOutput('--version');
  expect(versionResult.stdout.trim()).toBe(version);

  const helpResult = await kando.runCommandOutput('--help');
  expect(helpResult.stdout).toContain('Usage: kando');
  expect(helpResult.stdout).toContain('--menu <menu name>');
  expect(helpResult.stdout).toContain('--reload-menu-theme');
  expect(helpResult.stdout).toContain('--reload-sound-theme');
  expect(kando.errors).toEqual([]);
});

test('reload theme CLI flags reach the menu renderer', async ({ kando }) => {
  await kando.menuWindow.evaluate(() => {
    const state = window as Window & {
      kandoE2EReloadCounts?: { menu: number; sound: number };
      menuAPI: {
        onReloadMenuTheme: (callback: () => void) => void;
        onReloadSoundTheme: (callback: () => void) => void;
      };
    };
    state.kandoE2EReloadCounts = { menu: 0, sound: 0 };
    state.menuAPI.onReloadMenuTheme(() => {
      if (state.kandoE2EReloadCounts) {
        state.kandoE2EReloadCounts.menu++;
      }
    });
    state.menuAPI.onReloadSoundTheme(() => {
      if (state.kandoE2EReloadCounts) {
        state.kandoE2EReloadCounts.sound++;
      }
    });
  });

  await kando.runCommand('--reload-menu-theme');
  await expect
    .poll(() =>
      kando.menuWindow.evaluate(
        () =>
          (
            window as Window & {
              kandoE2EReloadCounts: { menu: number; sound: number };
            }
          ).kandoE2EReloadCounts.menu
      )
    )
    .toBe(1);

  await kando.runCommand('--reload-sound-theme');
  await expect
    .poll(() =>
      kando.menuWindow.evaluate(
        () =>
          (
            window as Window & {
              kandoE2EReloadCounts: { menu: number; sound: number };
            }
          ).kandoE2EReloadCounts.sound
      )
    )
    .toBe(1);
  expect(kando.errors).toEqual([]);
});

test('an invalid menu name reports a clean error without exiting', async ({ kando }) => {
  await kando.runCommand('--menu', 'Missing Menu');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
  await expect
    .poll(() => kando.mainProcessOutput.join(''))
    .toContain('No menu with name "Missing Menu" found.');

  await kando.openMenu('E2E Menu');
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  expect(kando.errors).toEqual([]);
});

test('a second launch forwards menu and settings requests to the existing instance', async ({
  kando,
}) => {
  expect(kando.windowCount).toBe(2);

  await kando.openMenu('E2E Menu');
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );

  await kando.settingsWindow.close();
  await expect.poll(() => kando.windowCount).toBe(1);
  await kando.runCommand('--settings');
  await expect.poll(() => kando.windowCount).toBe(2);
  expect(kando.windowCount).toBe(2);
  expect(kando.errors).toEqual([]);
});

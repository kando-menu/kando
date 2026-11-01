// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import { MenuV2 } from '../../src/common/settings-schemata';
import {
  expect,
  KandoApp,
  test,
  TEST_COMMAND,
  TEST_FILE_ICON_THEME,
  TEST_TCP_PORT,
  TEST_WEBSOCKET_URL,
} from './fixtures';

const menus: MenuV2[] = [
  {
    root: {
      type: 'root',
      name: 'E2E Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      activateWorkflow: { actions: [{ type: 'close-menu' }] },
      scrollUpWorkflow: {
        actions: [
          {
            type: 'send-tcp-message',
            host: '127.0.0.1',
            port: TEST_TCP_PORT,
            message: 'root scroll up',
          },
        ],
      },
      children: [
        {
          type: 'submenu',
          name: 'Submenu',
          icon: 'folder',
          iconTheme: 'material-symbols-rounded',
          angle: 0,
          openWorkflow: { quickSelectKey: 'S', actions: [] },
          activateWorkflow: {
            quickSelectKey: 'Backspace',
            actions: [{ type: 'close-submenu' }],
          },
          children: [
            {
              type: 'button',
              name: 'Nested action',
              icon: 'check',
              iconTheme: 'material-symbols-rounded',
              selectWorkflow: {
                quickSelectKey: 'N',
                actions: [{ type: 'close-menu' }],
              },
            },
          ],
        },
        {
          type: 'button',
          name: 'TCP action',
          icon: 'send',
          iconTheme: 'material-symbols-rounded',
          angle: 90,
          selectWorkflow: {
            quickSelectKey: 'T',
            actions: [
              {
                type: 'send-tcp-message',
                host: '127.0.0.1',
                port: TEST_TCP_PORT,
                message: 'tcp hit',
              },
            ],
          },
        },
        {
          type: 'button',
          name: 'WebSocket action',
          icon: 'send',
          iconTheme: 'material-symbols-rounded',
          angle: 180,
          selectWorkflow: {
            quickSelectKey: 'W',
            actions: [
              {
                type: 'send-websocket-message',
                url: TEST_WEBSOCKET_URL,
                message: 'websocket hit',
              },
              { type: 'close-menu' },
            ],
          },
        },
        {
          type: 'button',
          name: 'Command action',
          icon: 'terminal',
          iconTheme: 'material-symbols-rounded',
          angle: 270,
          selectWorkflow: {
            quickSelectKey: 'C',
            actions: [
              { type: 'execute-command', command: TEST_COMMAND },
              { type: 'close-menu' },
            ],
          },
        },
        {
          type: 'button',
          name: 'Number action',
          icon: 'home',
          iconTheme: 'material-symbols-rounded',
          angle: 315,
          selectWorkflow: {
            actions: [
              {
                type: 'send-tcp-message',
                host: '127.0.0.1',
                port: TEST_TCP_PORT,
                message: 'number hit',
              },
              { type: 'close-menu' },
            ],
          },
        },
      ],
    },
  },
  {
    root: {
      type: 'root',
      name: 'Icon Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'Emoji icon',
          icon: '🌈',
          iconTheme: 'emoji',
          angle: 0,
        },
        {
          type: 'button',
          name: 'Material icon',
          icon: 'settings',
          iconTheme: 'material-symbols-rounded',
          angle: 72,
        },
        {
          type: 'button',
          name: 'Simple icon',
          icon: 'github',
          iconTheme: 'simple-icons',
          angle: 144,
        },
        {
          type: 'button',
          name: 'File icon',
          icon: 'test-icon.svg',
          iconTheme: TEST_FILE_ICON_THEME,
          angle: 216,
        },
        {
          type: 'button',
          name: 'Base64 icon',
          icon: '',
          iconTheme: 'base64',
          angle: 288,
        },
      ],
    },
  },
];

const BASE64_ICON = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'
).toString('base64')}`;

menus[1].root.children[4].icon = BASE64_ICON;

menus.push(
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Edge Menu' },
    useFixedPosition: true,
    fixedMenuPosition: { x: 0, y: 0 },
  },
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Centered Menu' },
    useFixedPosition: true,
    fixedMenuPosition: { x: 0.5, y: 0.5 },
  },
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Anchored Menu' },
    anchored: true,
  },
  {
    root: {
      ...menus[0].root,
      name: 'Many Items',
      children: Array.from({ length: 20 }, (_, index) => ({
        type: 'button' as const,
        name: `Item ${index + 1}`,
        icon: 'star',
        iconTheme: 'material-symbols-rounded',
      })),
    },
  }
);

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
    },
  },
});

menus.push({
  ...menus[0],
  root: { ...menus[0].root, name: 'Hover Menu' },
  hoverMode: true,
});

// Fixed-position menus defer turbo mode until a key has been released.
const releaseDeferredTurboMode = (kando: KandoApp) =>
  kando.menuWindow.keyboard.press('Shift');

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

test('menu opens and closes through the settings preview API', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.previewMenu('E2E Menu');
  await expect(menu.locator('.type-root')).toHaveAttribute('data-name', 'E2E Menu');

  await kando.menuWindow.keyboard.press('Escape');
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('menu closes on outside click and right-click', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  const outside = await menu.evaluate((element) => ({
    x: element.clientWidth - 5,
    y: element.clientHeight - 5,
  }));
  await menu.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
  await menu.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
  await menu.dispatchEvent('pointerdown', {
    button: 0,
    buttons: 1,
    clientX: outside.x,
    clientY: outside.y,
  });
  await menu.dispatchEvent('pointerup', {
    button: 0,
    buttons: 0,
    clientX: outside.x,
    clientY: outside.y,
  });
  await expect(menu.locator('.menu-node')).toHaveCount(0);

  await kando.openMenu('E2E Menu');
  await menu.dispatchEvent('pointerdown', {
    button: 2,
    buttons: 2,
    clientX: 1,
    clientY: 1,
  });
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('settings button in the menu opens settings', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('E2E Menu');

  await kando.menuWindow
    .locator('#settings-button')
    .evaluate((button) =>
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    );
  await expect(menu.locator('.menu-node')).toHaveCount(0);
  await expect
    .poll(() => kando.settingsWindow.evaluate(() => document.hasFocus()))
    .toBe(true);
  expect(kando.errors).toEqual([]);
});

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

test('TCP, WebSocket, and command side effects reach local sinks', async ({ kando }) => {
  await kando.openMenu('E2E Menu');
  await kando.menuWindow.keyboard.press('w');
  await expect
    .poll(() => kando.sideEffects.webSocketMessages.join(''))
    .toContain('websocket hit');

  await kando.openMenu('E2E Menu');
  await kando.menuWindow.keyboard.press('c');
  await expect
    .poll(() => {
      return fs.existsSync(kando.sideEffects.commandOutputPath)
        ? fs.readFileSync(kando.sideEffects.commandOutputPath, 'utf8')
        : '';
    })
    .toContain('command fired');

  const settings = (await kando.readSettingsFile('menus')) as {
    menus: Array<{ root: { name: string } }>;
  };
  expect(settings.menus[0].root.name).toBe('E2E Menu');
  expect(kando.errors).toEqual([]);
});

test('config and menus survive an app restart', async ({ kando }) => {
  await kando.openMenu('E2E Menu');
  await kando.menuWindow.keyboard.press('Escape');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);

  await kando.restart();
  await kando.openMenu('E2E Menu');

  const config = (await kando.readSettingsFile('config')) as {
    enableMenuAnimations: boolean;
  };
  expect(config.enableMenuAnimations).toBe(false);
  await expect(kando.menuWindow.locator('.type-root')).toHaveAttribute(
    'data-name',
    'E2E Menu'
  );
  expect(kando.errors).toEqual([]);
});

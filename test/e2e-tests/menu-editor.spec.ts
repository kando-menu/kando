// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import { MenuV2 } from '../../src/common/settings-schemata';
import { expect, test } from './fixtures';

const editorMenus: MenuV2[] = [
  {
    tags: [],
    root: {
      type: 'root',
      name: 'Work Menu',
      icon: 'work',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'First Item',
          icon: 'star',
          iconTheme: 'material-symbols-rounded',
          selectWorkflow: { actions: [] },
        },
        {
          type: 'submenu',
          name: 'Nested Menu',
          icon: 'folder',
          iconTheme: 'material-symbols-rounded',
          children: [
            {
              type: 'button',
              name: 'Nested Item',
              icon: 'check',
              iconTheme: 'material-symbols-rounded',
              selectWorkflow: { actions: [] },
            },
          ],
        },
      ],
    },
  },
  {
    tags: ['personal'],
    root: {
      type: 'root',
      name: 'Personal Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [],
    },
  },
];

test.use({
  seed: {
    menus: editorMenus,
    config: {
      showIntroductionDialog: false,
      enableMenuAnimations: false,
    },
  },
});

const readMenus = async (kando: { readSettingsFile: () => Promise<unknown> }) => {
  const settings = (await kando.readSettingsFile()) as { menus: MenuV2[] };
  return settings.menus;
};

const menuTitle = (page: import('@playwright/test').Page, name: string) =>
  page.locator('[class*="menuTitle"]').getByText(name, { exact: true });

const menuCard = (page: import('@playwright/test').Page, name: string) =>
  menuTitle(page, name).locator('xpath=ancestor::div[@draggable="true"]');

const addAction = async (
  page: import('@playwright/test').Page,
  name: string
): Promise<void> => {
  await page.getByRole('button', { name: 'Add Action' }).first().click();
  const search = page.getByPlaceholder('Search for an action…');
  await search.fill(name);
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
};

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

test('workflow editor configures all action forms and stores their JSON', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');

  await addAction(page, 'Execute Command');
  await page.getByPlaceholder('Insert any command…').fill('printf e2e');
  await page.getByPlaceholder('Insert any command…').press('Tab');

  await addAction(page, 'Execute Macro');
  const macro = page.getByPlaceholder('Hit the record button to start recording!');
  await macro.fill("{type: 'keyDown', key: 'KeyA'}");
  await macro.evaluate((element) => element.blur());

  await addAction(page, 'Focus Window');
  await page.getByPlaceholder('App name').fill('test-app');
  await page.getByPlaceholder('App name').press('Tab');
  await page.getByPlaceholder('Window title').fill('test-window');
  await page.getByPlaceholder('Window title').press('Tab');

  await addAction(page, 'Open File');
  await page.getByPlaceholder('Choose a file or folder…').fill('/tmp/e2e-file');
  await page.getByPlaceholder('Choose a file or folder…').press('Tab');

  await addAction(page, 'Open Menu');
  await page.locator('select').last().selectOption('Personal Menu');

  await addAction(page, 'Open URI');
  await page.getByPlaceholder('Insert any URI…').fill('https://example.test');
  await page.getByPlaceholder('Insert any URI…').press('Tab');

  await addAction(page, 'Set Clipboard');
  await page.getByPlaceholder('Insert any text…').fill('clipboard e2e');
  await page.getByPlaceholder('Insert any text…').press('Tab');

  await addAction(page, 'Send WebSocket Message');
  const webSocketUrl = `ws://127.0.0.1:${kando.sideEffects.webSocketPort}`;
  await page.getByPlaceholder('ws://127.0.0.1:1234').fill(webSocketUrl);
  await page.getByPlaceholder('ws://127.0.0.1:1234').press('Tab');
  await page.getByPlaceholder('Insert a message…').last().fill('configured websocket');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');

  await addAction(page, 'Send TCP Message');
  await page.getByPlaceholder('127.0.0.1').last().fill('127.0.0.1');
  await page.getByPlaceholder('127.0.0.1').last().press('Tab');
  await page
    .locator('input[type="number"]')
    .last()
    .fill(String(kando.sideEffects.tcpPort));
  await page.locator('input[type="number"]').last().press('Enter');
  await page.getByPlaceholder('Insert a message…').last().fill('configured tcp');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');
  await page.getByRole('checkbox', { name: 'Append line break' }).check();

  await addAction(page, 'Simulate Hotkey');
  const hotkey = page.locator('[class*="actionItem"]').filter({
    hasText: 'Simulate Hotkey',
  });
  await hotkey.locator('input').fill('ControlLeft+KeyA');
  await hotkey.locator('input').press('Enter');

  await addAction(page, 'Delay');
  const delayCard = page.locator('[class*="actionItem"]').filter({ hasText: 'Delay' });
  await delayCard.locator('input[type="number"]').fill('0.5');
  await delayCard.locator('input[type="number"]').press('Enter');

  await expect
    .poll(async () => {
      const item = (await readMenus(kando))[0].root.children[0];
      return item.type === 'button' ? item.selectWorkflow?.actions.length : -1;
    })
    .toBe(11);

  const item = (await readMenus(kando))[0].root.children[0];
  if (item.type !== 'button') {
    throw new Error('Expected the edited menu item to remain a button.');
  }
  expect(item.selectWorkflow?.actions).toMatchObject([
    { type: 'execute-command', command: 'printf e2e' },
    { type: 'execute-macro', macro: [{ type: 'keyDown', key: 'KeyA' }] },
    { type: 'focus-window', appName: 'test-app', windowName: 'test-window' },
    { type: 'open-file', path: '/tmp/e2e-file' },
    { type: 'open-menu', menu: 'Personal Menu' },
    { type: 'open-uri', uri: 'https://example.test' },
    { type: 'set-clipboard', text: 'clipboard e2e' },
    {
      type: 'send-websocket-message',
      url: webSocketUrl,
      message: 'configured websocket',
    },
    {
      type: 'send-tcp-message',
      host: '127.0.0.1',
      port: kando.sideEffects.tcpPort,
      message: 'configured tcp',
      appendNewline: true,
    },
    { type: 'simulate-hotkey', hotkey: 'ControlLeft+KeyA' },
    { type: 'delay', duration: 0.5 },
  ]);
  expect(kando.errors).toEqual([]);
});

test('editor-created command, URI, file, TCP, WebSocket, and delay actions run', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');

  await addAction(page, 'Execute Command');
  await page.getByPlaceholder('Insert any command…').fill(kando.sideEffects.command);
  await page.getByPlaceholder('Insert any command…').press('Tab');

  await addAction(page, 'Send TCP Message');
  await page.getByPlaceholder('127.0.0.1').last().fill('127.0.0.1');
  await page.getByPlaceholder('127.0.0.1').last().press('Tab');
  await page
    .locator('input[type="number"]')
    .last()
    .fill(String(kando.sideEffects.tcpPort));
  await page.locator('input[type="number"]').last().press('Enter');
  await page.getByPlaceholder('Insert a message…').last().fill('editor tcp action');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');

  await addAction(page, 'Send WebSocket Message');
  const webSocketUrl = `ws://127.0.0.1:${kando.sideEffects.webSocketPort}`;
  await page.getByPlaceholder('ws://127.0.0.1:1234').fill(webSocketUrl);
  await page.getByPlaceholder('ws://127.0.0.1:1234').press('Tab');
  await page.getByPlaceholder('Insert a message…').last().fill('editor websocket action');
  await page.getByPlaceholder('Insert a message…').last().press('Tab');

  await addAction(page, 'Open URI');
  await page.getByPlaceholder('Insert any URI…').fill('https://editor.example.test');
  await page.getByPlaceholder('Insert any URI…').press('Tab');
  await kando.stubExternalOpen();

  await addAction(page, 'Open File');
  await page.getByPlaceholder('Choose a file or folder…').fill('/tmp/editor-e2e-file');
  await page.getByPlaceholder('Choose a file or folder…').press('Tab');

  await addAction(page, 'Delay');
  const delayCard = page.locator('[class*="actionItem"]').filter({ hasText: 'Delay' });
  await delayCard.locator('input[type="number"]').fill('0.1');
  await delayCard.locator('input[type="number"]').press('Enter');

  await kando.previewMenu('Work Menu');
  await kando.selectItem([0]);
  await expect
    .poll(() => kando.sideEffects.tcpMessages.join(''))
    .toContain('editor tcp action');
  await expect
    .poll(() => kando.sideEffects.webSocketMessages.join(''))
    .toContain('editor websocket action');
  await expect.poll(() => fs.existsSync(kando.sideEffects.commandOutputPath)).toBe(true);
  await expect
    .poll(() => kando.readExternalOpenRequests())
    .toEqual(['https://editor.example.test']);
  await expect.poll(() => fs.existsSync(kando.sideEffects.fileOpenOutputPath)).toBe(true);
  const openedFiles = (
    await fs.promises.readFile(kando.sideEffects.fileOpenOutputPath, 'utf8')
  )
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  expect(openedFiles).toContainEqual(['/tmp/editor-e2e-file']);

  await kando.menuWindow.keyboard.press('Escape');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('open-menu action configured in the editor opens the chosen menu', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const previewChildren = page.locator('[class*="previewArea"] [class*="child-"]');
  await previewChildren.nth(0).focus();
  await page.keyboard.press('Enter');

  await addAction(page, 'Open Menu');
  await page.locator('select').last().selectOption('Personal Menu');
  await expect
    .poll(async () => {
      const item = (await readMenus(kando))[0].root.children[0];
      return item.type === 'button' ? item.selectWorkflow?.actions[0] : undefined;
    })
    .toMatchObject({ type: 'open-menu', menu: 'Personal Menu' });

  await kando.previewMenu('Work Menu');
  await kando.selectItem([0]);
  await expect(kando.menuWindow.locator('.menu-node.type-root')).toHaveAttribute(
    'data-name',
    'Personal Menu'
  );
  await kando.menuWindow.keyboard.press('Escape');
  await expect(kando.menuWindow.locator('.menu-node')).toHaveCount(0);
  expect(kando.errors).toEqual([]);
});

test('menu import and export round-trip current menus and migrate V1 exports', async ({
  kando,
}) => {
  const page = kando.settingsWindow;
  const exportPath = `${kando.configDirectory}/round-trip-menu.json`;
  const legacyPath = `${kando.configDirectory}/legacy-menu.json`;
  const invalidPath = `${kando.configDirectory}/invalid-menu.json`;

  await kando.stubFileDialog('save', exportPath);
  await menuCard(page, 'Work Menu')
    .locator('[data-tooltip-content="Export menu"]')
    .click();
  await expect.poll(() => fs.existsSync(exportPath)).toBe(true);

  const exported = JSON.parse(await fs.promises.readFile(exportPath, 'utf8')) as {
    menu: MenuV2;
  };
  expect(exported.menu.root.name).toBe('Work Menu');

  const importButton = page.locator('[data-tooltip-content="Import menu"]');
  await kando.stubFileDialog('open', exportPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(3);
  await expect(menuTitle(page, 'Work Menu')).toHaveCount(2);

  await fs.promises.writeFile(
    legacyPath,
    JSON.stringify({
      version: '2.0.0',
      menu: {
        type: 'root',
        name: 'Legacy Menu',
        icon: 'home',
        iconTheme: 'material-symbols-rounded',
        children: [
          {
            type: 'command',
            name: 'Legacy Command',
            icon: 'terminal',
            iconTheme: 'material-symbols-rounded',
            data: { command: 'printf legacy' },
          },
        ],
      },
    })
  );
  await kando.stubFileDialog('open', legacyPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(4);
  await expect
    .poll(async () => {
      const imported = (await readMenus(kando)).find(
        (menu) => menu.root.name === 'Legacy Menu'
      );
      const child = imported?.root.children[0];
      return child?.type === 'button' ? child.selectWorkflow?.actions : undefined;
    })
    .toMatchObject([
      { type: 'execute-command', command: 'printf legacy' },
      { type: 'close-menu' },
    ]);

  await fs.promises.writeFile(invalidPath, '{"not": "an exported menu"}');
  await kando.stubFileDialog('open', invalidPath);
  await importButton.click();
  await expect.poll(async () => (await readMenus(kando)).length).toBe(4);

  await kando.restart();
  expect((await readMenus(kando)).map((menu) => menu.root.name)).toEqual([
    'Work Menu',
    'Personal Menu',
    'Work Menu',
    'Legacy Menu',
  ]);
  expect(kando.errors).toEqual([]);
});

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

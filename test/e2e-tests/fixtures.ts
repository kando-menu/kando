// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/* eslint-disable @typescript-eslint/naming-convention, react-hooks/rules-of-hooks */

import { expect, test as base, _electron as electron, Page } from '@playwright/test';
import { execFile } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { WebSocketServer } from 'ws';

import type { GeneralSettings, MenuV2 } from '../../src/common/settings-schemata';
import { version } from '../../package.json';

/** Returns the path to the packaged Kando executable for the current platform. */
function getExecutablePath(): string {
  if (process.env.KANDO_EXECUTABLE) {
    return process.env.KANDO_EXECUTABLE;
  }

  const out = path.join(
    __dirname,
    '..',
    '..',
    'out',
    `Kando-${process.platform}-${process.arch}`
  );
  switch (process.platform) {
    case 'darwin':
      return path.join(out, 'Kando.app', 'Contents', 'MacOS', 'Kando');
    case 'win32':
      return path.join(out, 'kando.exe');
    default:
      return path.join(out, 'kando');
  }
}

export type SeedData = {
  menus?: MenuV2[];
  config?: Partial<GeneralSettings>;
};

/**
 * Menus normally open at the physical pointer, which makes tests depend on where the
 * user's mouse is. Unless a menu specifies its own position, it opens at the screen
 * center instead.
 */
const isolatedMenus = (menus: MenuV2[]): MenuV2[] =>
  menus.map((menu) =>
    menu.useFixedPosition
      ? menu
      : { ...menu, useFixedPosition: true, fixedMenuPosition: { x: 0.5, y: 0.5 } }
  );

// Seeded action placeholders replaced with per-test endpoints and a local command script.
export const TEST_TCP_PORT = 0;
export const TEST_WEBSOCKET_URL = 'ws://127.0.0.1:0';
export const TEST_COMMAND = '__KANDO_E2E_WRITE_COMMAND__';
export const TEST_FILE_ICON_THEME = 'e2e-icons';

/**
 * The app instance and test helpers provided by the `kando` fixture. Tests use these
 * helpers instead of controlling the Electron process and menu windows directly.
 */
export type KandoApp = {
  /** The hidden window used for rendering pie menus. */
  readonly menuWindow: Page;
  /** The settings window. */
  readonly settingsWindow: Page;
  /** All errors printed to the console of any window, or uncaught exceptions. */
  errors: string[];
  /** The temporary directory containing this app instance's configuration. */
  configDirectory: string;
  /** Local endpoints and a command that writes a marker file for action tests. */
  sideEffects: {
    tcpPort: number;
    tcpMessages: string[];
    webSocketPort: number;
    webSocketMessages: string[];
    commandOutputPath: string;
    command: string;
    fileOpenOutputPath: string;
  };
  /**
   * Runs the Kando executable with the given command line arguments. As Kando is a
   * single-instance app, this forwards the arguments to the running instance.
   */
  runCommand: (...args: string[]) => Promise<void>;
  /** Opens a menu and waits for its entrance animations to finish. */
  openMenu: (name: string) => Promise<void>;
  /** Opens a seeded menu through the settings window's preview API. */
  previewMenu: (name: string) => Promise<void>;
  /**
   * Clicks a seeded menu item at the given sequence of child indexes, starting below the
   * root.
   */
  selectItem: (itemPath: number[]) => Promise<void>;
  /** Reads the current JSON content of config.json or menus.json. */
  readSettingsFile: (name?: 'config' | 'menus') => Promise<unknown>;
  /** Replaces Electron's external URI handler with a local request recorder. */
  stubExternalOpen: () => Promise<void>;
  /** Returns URIs received by the local external-open stub. */
  readExternalOpenRequests: () => Promise<string[]>;
  /** Supplies the next native open/save dialog response. */
  stubFileDialog: (kind: 'open' | 'save', filePath: string | null) => Promise<void>;
  /** Restarts the app while preserving its temporary configuration directory. */
  restart: () => Promise<void>;
};

/**
 * Starts a fresh Kando instance with an isolated temporary config directory so that tests
 * neither depend on nor modify the user's real configuration.
 */
export const test = base.extend<{ kando: KandoApp }, { seed: SeedData | undefined }>({
  // `seed` is an optional Playwright fixture option; tests set it to provide menus or settings.
  seed: [undefined, { option: true }],
  // Playwright's `use` is not a React hook.
  kando: async ({ seed }, use, testInfo) => {
    // Desktop interaction tests need a real display, so skip them in headless CI.
    if (process.env.CI && testInfo.title.includes('@desktop')) {
      testInfo.skip(true, 'Requires a real desktop session.');
    }

    // Keep each test's settings, icon theme, and generated files separate from the user's data.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-e2e-'));
    const configDirectory = path.join(tmp, 'config');
    fs.mkdirSync(configDirectory, { recursive: true });
    const fileIconThemeDirectory = path.join(
      configDirectory,
      'icon-themes',
      TEST_FILE_ICON_THEME
    );
    fs.mkdirSync(fileIconThemeDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(fileIconThemeDirectory, 'test-icon.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'
    );

    const executablePath = getExecutablePath();
    const baseArgs = ['--no-sandbox', '--config-dir', configDirectory];
    const env: Record<string, string> = {
      ...process.env,
      LANGUAGE: 'en_US',
      LC_ALL: 'en_US.UTF-8',
      XDG_CONFIG_HOME: tmp,
      APPDATA: tmp,
    } as Record<string, string>;
    if (process.platform === 'linux') {
      // Run Linux tests through X11 and hide the host compositor/socket variables.
      env.XDG_SESSION_TYPE = 'x11';
      env.XDG_CURRENT_DESKTOP = 'KandoE2E';
      env.GDK_BACKEND = 'x11';
      delete env.WAYLAND_DISPLAY;
      delete env.SWAYSOCK;
    }

    const fileOpenOutputPath = path.join(tmp, 'file-open-output.jsonl');
    const fileOpenStubDirectory = path.join(tmp, 'bin');
    fs.mkdirSync(fileOpenStubDirectory, { recursive: true });
    const fileOpenStubPath = path.join(fileOpenStubDirectory, 'xdg-open');
    fs.writeFileSync(
      fileOpenStubPath,
      `#!/usr/bin/env node\nrequire('node:fs').appendFileSync(${JSON.stringify(
        fileOpenOutputPath
      )}, JSON.stringify(process.argv.slice(2)) + '\\n');\n`
    );
    fs.chmodSync(fileOpenStubPath, 0o755);
    env.PATH = [fileOpenStubDirectory, env.PATH].filter(Boolean).join(path.delimiter);

    const errors: string[] = [];
    const mainProcessOutput: string[] = [];
    const watchedPages = new WeakSet<Page>();
    // Capture renderer errors from both windows, including windows opened after startup.
    const watch = (page: Page) => {
      if (watchedPages.has(page)) {
        return;
      }
      watchedPages.add(page);
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => errors.push(err.stack ?? err.message));
    };

    // Launch the app in settings mode and wait for both of its windows to finish loading.
    const startApp = async () => {
      const app = await electron.launch({
        executablePath,
        args: [...baseArgs, '--settings'],
        env,
      });

      app.windows().forEach(watch);
      app.on('window', watch);
      app.process().stderr?.on('data', (data: Buffer) => {
        mainProcessOutput.push(data.toString());
      });

      try {
        const find = async (name: string) => {
          const match = () => app.windows().find((w) => w.url().includes(name));
          for (let i = 0; i < 100 && !match(); i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          const page = match();
          if (!page) {
            throw new Error(
              `Window ${name} did not show up. Open windows: ${
                app
                  .windows()
                  .map((window) => window.url())
                  .join(', ') || 'none'
              }. Main-process output: ${mainProcessOutput.join('\n') || 'none'}.`
            );
          }
          await page.waitForLoadState('load');
          return page;
        };

        return {
          app,
          menuWindow: await find('menu_window'),
          settingsWindow: await find('settings_window'),
        };
      } catch (error) {
        await app.close();
        throw error;
      }
    };

    // Send CLI arguments to the running single-instance app, just as a second launch would.
    const runCommand = (...args: string[]) =>
      new Promise<void>((resolve, reject) => {
        execFile(executablePath, [...baseArgs, ...args], { env }, (error) =>
          error ? reject(error) : resolve()
        );
      });

    // Loopback servers let action tests observe TCP/WebSocket output without external services.
    const tcpMessages: string[] = [];
    const tcpServer = net.createServer((socket) => {
      socket.on('data', (data) => tcpMessages.push(data.toString()));
      socket.on('end', () => socket.destroy());
    });
    await new Promise<void>((resolve, reject) => {
      tcpServer.once('error', reject);
      tcpServer.listen(0, '127.0.0.1', resolve);
    });
    const tcpAddress = tcpServer.address();
    if (!tcpAddress || typeof tcpAddress === 'string') {
      throw new Error('Could not determine the TCP side-effect server port.');
    }

    const webSocketMessages: string[] = [];
    const webSocketServer = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise<void>((resolve, reject) => {
      webSocketServer.once('error', reject);
      webSocketServer.once('listening', resolve);
    });
    webSocketServer.on('connection', (socket) => {
      socket.on('message', (message) => webSocketMessages.push(message.toString()));
    });

    const webSocketAddress = webSocketServer.address();
    if (!webSocketAddress || typeof webSocketAddress === 'string') {
      throw new Error('Could not determine the WebSocket side-effect server port.');
    }

    // Action tests can verify command execution by checking for this file and its marker text.
    const commandOutputPath = path.join(tmp, 'command-output.txt');
    const commandScriptPath = path.join(tmp, 'write-command-output.js');
    fs.writeFileSync(
      commandScriptPath,
      `require('node:fs').writeFileSync(${JSON.stringify(commandOutputPath)}, 'command fired\\n');`
    );

    if (seed?.menus) {
      const command = `"${process.execPath}" "${commandScriptPath}"`;
      // Replace placeholders in seeded actions with local endpoints and a harmless test command.
      const seededMenus = JSON.stringify(
        { version, menus: isolatedMenus(seed.menus) },
        null,
        2
      )
        .replaceAll(`"port": ${TEST_TCP_PORT}`, `"port": ${tcpAddress.port}`)
        .replaceAll(TEST_WEBSOCKET_URL, `ws://127.0.0.1:${webSocketAddress.port}`)
        .replaceAll(TEST_COMMAND, JSON.stringify(command).slice(1, -1));
      fs.writeFileSync(path.join(configDirectory, 'menus.json'), seededMenus);
    }

    // Never warp the user's physical pointer while tests are running.
    fs.writeFileSync(
      path.join(configDirectory, 'config.json'),
      JSON.stringify({ version, warpMouse: false, ...seed?.config }, null, 2)
    );

    let current = await startApp();
    let activeMenuName: string | null = null;

    // Wait for CSS/WAAPI entrance effects to finish before tests inspect or interact with a menu.
    const settleMenuAnimations = async (page: Page) => {
      const menu = page.locator('#kando-menu');
      await menu.evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => undefined))
        );
      });
      await page.waitForTimeout(300);
    };

    const api: KandoApp = {
      get menuWindow() {
        return current.menuWindow;
      },
      get settingsWindow() {
        return current.settingsWindow;
      },
      errors,
      configDirectory,
      sideEffects: {
        tcpPort: tcpAddress.port,
        tcpMessages,
        webSocketPort: webSocketAddress.port,
        webSocketMessages,
        commandOutputPath,
        command: `"${process.execPath}" "${commandScriptPath}"`,
        fileOpenOutputPath,
      },
      runCommand,
      // Open a menu through the app's normal command-line interface.
      openMenu: async (name) => {
        const menu = api.menuWindow.locator('#kando-menu');
        await runCommand('--menu', name);
        activeMenuName = name;
        await menu.locator('.menu-node.type-root').waitFor({ state: 'attached' });
        await expect(menu).not.toHaveClass(/hidden/);
        await settleMenuAnimations(api.menuWindow);
      },
      // Open a menu from the settings window's preview flow instead of its normal trigger.
      previewMenu: async (name) => {
        const index = seed?.menus?.findIndex((menu) => menu.root.name === name) ?? -1;
        if (index < 0) {
          throw new Error(`No seeded menu matches "${name}".`);
        }
        await api.settingsWindow.evaluate((menuIndex) => {
          window.settingsAPI.openMenu(menuIndex);
        }, index);
        activeMenuName = name;
        const menu = api.menuWindow.locator('#kando-menu');
        await menu.locator('.menu-node.type-root').waitFor({ state: 'attached' });
        await expect(menu).not.toHaveClass(/hidden/);
        await settleMenuAnimations(api.menuWindow);
      },
      // Resolve an item by its child indexes, then synthesize the pointer events used to select it.
      selectItem: async (itemPath) => {
        if (itemPath.some((index) => !Number.isInteger(index) || index < 0)) {
          throw new Error(`Invalid menu item path: ${itemPath.join('.')}`);
        }
        const settings = (await api.readSettingsFile()) as { menus: MenuV2[] };
        const menu = settings.menus.find((item) => item.root.name === activeMenuName);
        if (!menu) {
          throw new Error(
            `No configured menu matches "${activeMenuName ?? 'the current menu'}".`
          );
        }

        type SeedMenuItem = MenuV2['root'] | MenuV2['root']['children'][number];
        let selectedItem: SeedMenuItem = menu.root;
        for (const index of itemPath) {
          if (!('children' in selectedItem)) {
            throw new Error(`Menu item at ${itemPath.join('.')} has no child items.`);
          }
          const child = selectedItem.children[index];
          if (!child) {
            throw new Error(`Menu item path is out of range: ${itemPath.join('.')}.`);
          }
          selectedItem = child;
        }
        const item = api.menuWindow.locator(
          `#kando-menu .menu-node.type-${selectedItem.type}[data-name=${JSON.stringify(
            selectedItem.name
          )}]`
        );
        await item.waitFor({ state: 'attached' });
        const bounds = await item
          .locator(':scope > .icon-layer > .icon-container')
          .boundingBox();
        if (!bounds) {
          throw new Error(`Menu item at ${itemPath.join('.')} has no visible bounds.`);
        }
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;
        const container = api.menuWindow.locator('#kando-menu');
        await container.dispatchEvent('pointermove', { clientX: 1, clientY: 1 });
        await container.dispatchEvent('pointermove', { clientX: 2, clientY: 2 });
        await container.dispatchEvent('pointermove', { clientX: x, clientY: y });
        await container.dispatchEvent('pointerdown', {
          button: 0,
          buttons: 1,
          clientX: x,
          clientY: y,
        });
        await expect(item).toHaveClass(/clicked/);
        await container.dispatchEvent('pointerup', {
          button: 0,
          buttons: 0,
          clientX: x,
          clientY: y,
        });
      },
      // Read the app's persisted test config or menu file for assertions.
      readSettingsFile: async (name = 'menus') => {
        const fileName = name === 'menus' ? 'menus.json' : 'config.json';
        return JSON.parse(
          await fs.promises.readFile(path.join(configDirectory, fileName), 'utf8')
        );
      },
      stubExternalOpen: async () => {
        await current.app.evaluate(({ shell }) => {
          const state = globalThis as typeof globalThis & {
            kandoE2EExternalOpenRequests?: string[];
          };
          state.kandoE2EExternalOpenRequests = [];
          shell.openExternal = async (url) => {
            state.kandoE2EExternalOpenRequests?.push(url);
          };
        });
      },
      readExternalOpenRequests: async () =>
        current.app.evaluate(() => {
          const state = globalThis as typeof globalThis & {
            kandoE2EExternalOpenRequests?: string[];
          };
          return state.kandoE2EExternalOpenRequests ?? [];
        }),
      stubFileDialog: async (kind, filePath) => {
        await current.app.evaluate(
          ({ dialog }, response) => {
            if (response.kind === 'open') {
              dialog.showOpenDialog = async () => ({
                canceled: response.filePath === null,
                filePaths: response.filePath === null ? [] : [response.filePath],
              });
              dialog.showMessageBox = async () => ({
                response: 0,
                checkboxChecked: false,
              });
            } else {
              dialog.showSaveDialog = async () => ({
                canceled: response.filePath === null,
                filePath: response.filePath ?? '',
              });
            }
          },
          { kind, filePath }
        );
      },
      // Restarting reuses the same temporary configuration, allowing persistence tests.
      restart: async () => {
        await current.app.close();
        current = await startApp();
      },
    };

    try {
      await use(api);
    } finally {
      // Stop app and local test servers, then remove all per-test files.
      await current.app.close();
      await new Promise<void>((resolve, reject) => {
        tcpServer.close((error) => (error ? reject(error) : resolve()));
      });
      await new Promise<void>((resolve, reject) => {
        webSocketServer.close((error) => (error ? reject(error) : resolve()));
      });
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  },
});

export { expect } from '@playwright/test';

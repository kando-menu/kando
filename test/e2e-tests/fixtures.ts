// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/* eslint-disable @typescript-eslint/naming-convention, react-hooks/rules-of-hooks, no-empty-pattern */

import { test as base, _electron as electron, Page } from '@playwright/test';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

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

export type KandoApp = {
  /** The hidden window used for rendering pie menus. */
  menuWindow: Page;
  /** The settings window. */
  settingsWindow: Page;
  /** All errors printed to the console of any window, or uncaught exceptions. */
  errors: string[];
  /**
   * Runs the Kando executable with the given command line arguments. As Kando is a
   * single-instance app, this forwards the arguments to the running instance.
   */
  runCommand: (...args: string[]) => Promise<void>;
};

/**
 * Starts a fresh Kando instance with an empty temporary config directory so that tests
 * neither depend on nor modify the user's real configuration.
 */
export const test = base.extend<{ kando: KandoApp }>({
  // Playwright's `use` is not a React hook.
  kando: async ({}, use) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-e2e-'));

    const executablePath = getExecutablePath();
    const baseArgs = ['--no-sandbox', '--config-dir', path.join(tmp, 'config')];
    const env = {
      ...process.env,
      LANGUAGE: 'en_US',
      LC_ALL: 'en_US.UTF-8',
      XDG_CONFIG_HOME: tmp,
      APPDATA: tmp,
    } as Record<string, string>;

    const app = await electron.launch({
      executablePath,
      args: [...baseArgs, '--settings'],
      env,
    });

    const errors: string[] = [];
    const watch = (page: Page) => {
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => errors.push(err.message));
    };
    app.windows().forEach(watch);
    app.on('window', watch);

    const find = async (name: string) => {
      const match = () => app.windows().find((w) => w.url().includes(name));
      for (let i = 0; i < 100 && !match(); i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      const page = match();
      if (!page) {
        throw new Error(`Window ${name} did not show up.`);
      }
      await page.waitForLoadState('load');
      return page;
    };

    const menuWindow = await find('menu_window');
    const settingsWindow = await find('settings_window');

    const runCommand = (...args: string[]) =>
      new Promise<void>((resolve, reject) => {
        execFile(executablePath, [...baseArgs, ...args], { env }, (error) =>
          error ? reject(error) : resolve()
        );
      });

    await use({ menuWindow, settingsWindow, errors, runCommand });

    await app.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  },
});

export { expect } from '@playwright/test';

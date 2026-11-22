// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { defineConfig } from '@playwright/test';

// These end-to-end tests launch the packaged app (run `npm run package` first).
export default defineConfig({
  testDir: 'test/e2e-tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure' },
});

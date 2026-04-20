// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import { globSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'i18next-cli';

const detectedLocales = globSync('*/translation.json', { cwd: 'locales' })
  .map((file) => path.dirname(file))
  .sort((a, b) => a.localeCompare(b));

export default defineConfig({
  locales: ['en', ...detectedLocales.filter((locale) => locale !== 'en')],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    primaryLanguage: 'en',
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});

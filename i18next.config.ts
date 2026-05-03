// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'i18next-cli';

// The code below is useful when renaming translation keys using i18next-cli. Usually, we
// only update the english translation file, but when renaming keys, we need to update all
// translation files. So for renaming, use the code below and then run something like:
//
// npx i18next-cli rename-key "old.key" "new.key"

// import { globSync } from 'node:fs';
// import path from 'node:path';
// const detectedLocales = globSync('*/translation.json', { cwd: 'locales' }).map((file) =>
//   path.dirname(file)
// );

export default defineConfig({
  locales: ['en'],
  // locales: detectedLocales,
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    primaryLanguage: 'en',
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
    sort: false,
    indentation: 4,
  },
  types: {
    input: ['locales/en/*.json'],
    output: 'src/types/i18next.d.ts',
  },
});

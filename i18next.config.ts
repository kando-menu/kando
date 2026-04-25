// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en'],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    primaryLanguage: 'en',
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
    sort: false,
  },
  types: {
    input: ['locales/en/*.json'],
    output: 'src/types/i18next.d.ts',
  },
});

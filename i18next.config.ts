// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    'ar',
    'cs',
    'da',
    'de',
    'el',
    'en',
    'es',
    'fa',
    'fi',
    'fr',
    'ia',
    'it',
    'ja',
    'ko',
    'lt',
    'nb-NO',
    'nl',
    'pl',
    'pt',
    'pt-BR',
    'ru',
    'sr',
    'ta',
    'tr',
    'uk',
    'vi',
    'zh-Hans',
    'zh-Hant',
  ],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

// See all options here: https://github.com/i18next/i18next-parser
export default {
  locales: ['en'],
  createOldCatalogs: false,
  pluralSeparator: false,
  namespaceSeparator: false,
  keySeparator: false,
  defaultValue: (locale: string, namespace: string, key: string) => key,
  customValueTemplate: {
    message: '${defaultValue}',
    description: '${description}',
    paths: '${filePaths}',
  },
};

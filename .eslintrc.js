// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

/* eslint-env node */
module.exports = {
  extends : ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser : '@typescript-eslint/parser',
  plugins : ['@typescript-eslint'],
  root : true,
  rules : {
    '@typescript-eslint/no-empty-function' : 'off',
    '@typescript-eslint/no-var-requires' : 'off',
  }
};
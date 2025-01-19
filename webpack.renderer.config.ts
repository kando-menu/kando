// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import { ignores } from './webpack.ignores';

// The settings renderer uses CSS modules, so we have to enable them here.
rules.push({
  test: /\.s[ac]ss$/i,
  use: [
    { loader: 'style-loader' },
    {
      loader: 'css-loader',
      options: { modules: { auto: true, localIdentName: '[local]-[hash:base64:8]' } },
    },
    { loader: 'sass-loader' },
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  externals: ignores,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss'],
  },
};

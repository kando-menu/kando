// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import { ignores } from './webpack.ignores';

// The settings renderer uses CSS modules, the menu renderer does not. So we use different
// loaders for these files.
rules.push(
  {
    test: /menu-renderer.*\.s[ac]ss$/i,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
      },
      { loader: 'sass-loader' },
    ],
  },
  {
    test: /settings-renderer.*\.s[ac]ss$/i,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: { modules: true },
      },
      { loader: 'sass-loader' },
    ],
  }
);

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

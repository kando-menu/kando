// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { ModuleOptions } from 'webpack';

export const rules: Required<ModuleOptions>['rules'] = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\](node_modules|build)[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    // The dbus-final module imports some native modules which are not actually used. We
    // can safely ignore them.
    test: /[/\\]node_modules[/\\]dbus-final[/\\]lib[/\\].+\.js$/,
    use: {
      loader: 'string-replace-loader',
      options: {
        multiple: [
          { search: "require\\('usocket'\\)", replace: 'undefined', flags: 'g' },
          { search: "require\\('x11'\\)", replace: 'undefined', flags: 'g' },
        ],
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.(png|svg|jpg|jpeg|gif|mp4|ttf|woff2)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'assets/[name].[hash:8][ext]',
    },
  },
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
];

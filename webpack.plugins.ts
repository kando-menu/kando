// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { NormalModuleReplacementPlugin } from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  // We do not need the otf, ttf, eot and woff files of the SimpleIcons package. They are
  // replaced by the woff2 file below. Maybe there is a more elegant way to do this, but
  // this works for now.
  new NormalModuleReplacementPlugin(
    /SimpleIcons\.(otf|ttf|eot|woff)$/,
    'SimpleIcons.woff2'
  ),
];

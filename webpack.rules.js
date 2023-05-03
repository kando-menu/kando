// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader
    // generates a "fake" .node file which is really a cjs file.
    test : /native_modules[/\\].+\.node$/,
    use : 'node-loader',
  },
  {
    test : /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser : {amd : false},
    use : {
      loader : '@vercel/webpack-asset-relocator-loader',
      options : {
        outputAssetBase : 'native_modules',
      },
    },
  },
  {
    test : /[/\\]build[/\\]Release[/\\].+\.node$/,
    parser : {amd : false},
    use : {
      loader : '@vercel/webpack-asset-relocator-loader',
      options : {
        outputAssetBase : 'native_modules',
      },
    },
  },
];

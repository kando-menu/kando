// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { Compiler, Configuration } from 'webpack';

import { rendererConfig } from './webpack.renderer.config';

// Sandboxed preload scripts can only require() a tiny set of modules. Since Electron 45,
// this no longer includes 'events', which is required by the webpack HMR client in
// development builds. Electron Forge treats 'events' as an external, so we rewrite the
// request to 'events/' (the npm package) before the externals are evaluated.
class BundleEventsPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap('BundleEventsPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('BundleEventsPlugin', (data) => {
        if (data.request === 'events') {
          data.request = 'events/';
          for (const dependency of data.dependencies) {
            (dependency as unknown as { request: string }).request = 'events/';
          }
        }
      });
    });
  }
}

export const preloadConfig: Configuration = {
  ...rendererConfig,
  plugins: [...(rendererConfig.plugins ?? []), new BundleEventsPlugin()],
};

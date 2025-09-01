//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// These are set by webpack in webpack.plugins.ts so that we can use them in the
// renderer process.
declare const cIsMac: boolean;
declare const cIsWindows: boolean;
declare const cIsLinux: boolean;
declare const cLocales: string[];

// This is a fallback decaration for SCSS module files.
// The `typescript-plugin-css-modules` does not work properly with `npx tsc --noEmit` CLI command.
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
  export = classes;
}

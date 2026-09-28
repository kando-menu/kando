// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import os from 'os';

export const ignores: RegExp[] = [];

if (os.platform() !== 'win32') {
  ignores.push(/NativeWin32\.node$/);
}

if (os.platform() !== 'darwin') {
  ignores.push(/NativeMacOS\.node$/);
}

if (os.platform() !== 'linux') {
  ignores.push(/NativeX11\.node$/);
  ignores.push(/NativeWLR\.node$/);
  ignores.push(/NativeHypr\.node$/);
}

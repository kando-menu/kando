<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <img src="img/banner01.png" alt="Kando — a cross-platform pie menu" width="100%" />
</p>

# Development quick start

This page is a quick start for working from a local checkout.
See the [full source compilation guide](https://kando.menu/compile-from-source/) for platform-specific dependency installation, cloning instructions, and packaging details.
For a map of the code, see the [architecture overview](architecture.md).

## Prerequisites

- Git
- Node.js matching the version in [`.node-version`](../.node-version) (currently 22)
- CMake and a C++ toolchain
- Platform-specific development libraries required to build Kando's native modules

The required native libraries and installation steps vary by operating system.
Follow the [platform-specific prerequisites in the full guide](https://kando.menu/compile-from-source/).
For Nix users, the repository provides a development shell with `nix develop`.

## Install and run

From the repository root:

```sh
npm install
npm start
```

`npm install` installs the dependencies and runs the native-module build (`cmake-js compile`).
`npm start` starts the app through Electron Forge.

## Validate changes

Run the checks that apply to the files you changed:

| Command | What it checks |
| --- | --- |
| `npm test` | Test suite in `test/` |
| `npm run lint` | ESLint across the repository |
| `npm run prettier` | Formatting of `src/` |
| `npm run tscheck` | TypeScript type-check (`tsc --noEmit`) |

Use `npm run format` to apply Prettier formatting to `src/`.
The CI definitions live in [`.github/workflows/checks.yml`](../.github/workflows/checks.yml); CI uses `npm ci` for a clean, lockfile-based dependency install and also checks REUSE license metadata.

## Useful project commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run the app in development |
| `npm run package` | Package the app |
| `npm run make` | Create distributable packages |
| `npm run i18n` | Extract localization strings and regenerate localization types |

Before changing a command or dependency, check [package.json](../package.json), the lockfile, and the CI workflow so local instructions stay aligned with the project.

<p align="center"><img src="img/hr.svg" alt="" /></p>

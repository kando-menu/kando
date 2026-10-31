<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <img src="docs/img/banner01.png" alt="Kando — a cross-platform pie menu" width="100%" />
</p>

# Working on Kando

Welcome!
This page is a short starting point for coding agents and people contributing from a checkout.
For more detail, see the [development guide](docs/development.md) and [architecture overview](docs/architecture.md).

## Get started

- Use the Node.js version in [`.node-version`](.node-version) and install dependencies with `npm install`.
- This also builds the platform's native modules.
- Install Git, Node.js, CMake, and a C++ toolchain before getting started.
- Follow the [platform-specific source compilation guide](https://kando.menu/compile-from-source/) for operating-system dependencies and setup details.
- Run the app with `npm start`.

## Before handing off a change

Run the checks relevant to your change:

```sh
npm test
npm run lint
npm run prettier
npm run tscheck
```

`npm run prettier` checks formatting; `npm run format` applies it to `src/`.
The [CI workflow](.github/workflows/checks.yml) runs these checks and REUSE compliance.

## Where to look

| Area | Location |
| --- | --- |
| Main process, application lifecycle, and system integration | [`src/main/`](src/main/) |
| Shared types, APIs, IPC, and settings schemas | [`src/common/`](src/common/) |
| Pie-menu window and input handling | [`src/menu-renderer/`](src/menu-renderer/) |
| Settings window and its UI | [`src/settings-renderer/`](src/settings-renderer/) |
| Tests | [`test/`](test/) |

Keep changes focused, preserve platform-specific behavior, and add or update tests when changing observable behavior.
Read the relevant code and tests before editing; see the [architecture overview](docs/architecture.md) for process boundaries and backend guidance.

<p align="center"><img src="docs/img/hr.svg" alt="" /></p>

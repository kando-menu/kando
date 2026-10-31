<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <img src="img/banner01.png" alt="Kando — a cross-platform pie menu" width="100%" />
</p>

# Architecture overview

Kando is an Electron application with a host (main) process and two renderer windows: the full-screen menu and the settings UI.
Shared types and renderer-facing APIs live separately so both windows can communicate with the host through explicit interfaces.
For setup and checks, see the [development guide](development.md).

## Source map

| Area | Responsibility |
| --- | --- |
| [`src/main/`](../src/main/) | Application lifecycle, windows, settings persistence, actions, and system integration |
| [`src/common/`](../src/common/) | Shared types, window APIs, IPC definitions, utilities, and settings schemas |
| [`src/menu-renderer/`](../src/menu-renderer/) | Pie-menu rendering, themes, and pointer/gesture/gamepad input |
| [`src/settings-renderer/`](../src/settings-renderer/) | Settings-window UI and state |
| [`src/types/`](../src/types/) | Type declarations shared with the TypeScript build |
| [`test/`](../test/) | Unit and integration-style tests |

## Process and API boundaries

- The main process owns Electron windows, application settings, and operating-system integration.
  Its application logic is centered in [`src/main/app.ts`](../src/main/app.ts).
- The menu and settings windows run in separate renderer processes.
  Their entry points and UI code are under `src/menu-renderer/` and `src/settings-renderer/`.
- Renderer code uses the window APIs exposed through preload scripts; shared API definitions are in [`src/common/`](../src/common/).
  IPC handlers and callers should be updated together when changing a message or its data shape.
- Shared settings and exported-menu schemas are versioned in [`src/common/settings-schemata/`](../src/common/settings-schemata/).
  Check the existing versioned definitions and their readers/writers before changing persisted data formats.

## Actions and platform backends

Menu actions are implemented in [`src/main/actions/`](../src/main/actions/).
The platform backend interface is in [`src/main/backends/backend.ts`](../src/main/backends/backend.ts), and [`src/main/backends/index.ts`](../src/main/backends/index.ts) selects an implementation based on the operating system and, on Linux, the desktop/session environment.

Backend implementations live under `src/main/backends/`:

- Windows and macOS have dedicated backends and native modules.
- Linux includes generic X11 support and desktop-specific X11/Wayland implementations; supported Wayland environments need dedicated integration rather than a single generic backend.
- Native sources and their CMake configuration are kept alongside the corresponding backend.

When changing backend behavior, preserve the common backend contract and consider whether the same user-visible behavior needs to be implemented for other platforms or desktop environments.
Backend selection is environment-dependent, so test the relevant platform/session when possible and add focused tests for logic that can be tested without that environment.

<p align="center"><img src="img/hr.svg" alt="" /></p>

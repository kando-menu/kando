<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0

Added      - for new features.
Changed    - for changes in existing functionality.
Deprecated - for soon-to-be removed features.
Removed    - for now removed features.
Fixed      - for any bug fixes.
Security   - in case of vulnerabilities.
-->

# Changelog of Kando

Kando uses [semantic versioning](https://semver.org).
This changelog follows the rules of [Keep a Changelog](http://keepachangelog.com/).

## Kando 0.3.0 [Unreleased]

**Release Date:** TBD

#### Added

- An example action which runs any given shell command. You can type a command into a text entry and Kando will execute it when you press enter. This will be one of the most basic actions in Kando.
- The possibility to run a command when a menu item is selected. This is the first step towards making Kando actually useful! To use this, you will have to edit your menu configuration file at `~/.config/kando/menus.json` or `%appdata%\kando\menus.json`. Change the `type` of an item to `command` and add a `data` field with the command you want to run. Kando will automatically reload the menu configuration file when you save it.

## [Kando 0.2.0](https://github.com/kando-menu/kando/releases/tag/v0.2.0)

**Release Date:** 2023-11-24

#### Added

- A new backend for [Hyprland](https://hyprland.org/). This backend uses the [virtual-pointer](https://wayland.app/protocols/wlr-virtual-pointer-unstable-v1) and [virtual-keyboard](https://wayland.app/protocols/virtual-keyboard-unstable-v1) Wayland protocols to simulate mouse and keyboard input. In addition, it uses `hyprctl` to get the name of the currently focused window as well as the current pointer location. Global shortcuts are bound via the [hyprland-global-shortcuts](https://github.com/hyprwm/hyprland-protocols/blob/main/protocols/hyprland-global-shortcuts-v1.xml) protocol.
- Callbacks which called whenever menu items are hovered, unhovered, or selected. There is a fourth callback which is executed when a selection is aborted. Later, we will use these events to actually make something happen when items are selected in the menu.
- Initial support for persistent settings. Some settings (like the demo menu layout) are now saved and loaded to / from a file in the user's home directory (e.g. `~/.config/kando/` on Linux).
- Some initial code for the menu editor. This is not yet functional, but you can already open it by clicking the small gear icon in the bottom right corner of the screen when the demo menu is shown. [You can read more about the future plans for the menu editor](https://ko-fi.com/post/Editor-Mockups-U6U1PD0K8)!

#### Changed

- Large parts of the code have been refactored. For instance, by using the template engine [Handlebars](https://handlebarsjs.com/), the code is now much more readable and maintainable. 

## [Kando 0.1.0](https://github.com/kando-menu/kando/releases/tag/v0.1.0)

**Release Date:** 2023-08-21

#### Added

- All initial features of the Tech-Demo. It's not a functional menu yet, but it already demonstrates the basic concepts. The following features are implemented:
  - Backends for Windows and Linux. On Linux, many X11-based window managers and KDE and GNOME on Wayland are supported.
  - Opening and closing a hard-coded example menu with about 400 entries.
  - Navigation in the menu using point-and-click.
  - Navigation in the menu using mouse gestures.
  - A short tutorial explaining the basic concepts.

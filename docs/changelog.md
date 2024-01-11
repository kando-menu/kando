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

<img src="img/banner01.jpg"></img>

# Changelog of Kando

Kando uses [semantic versioning](https://semver.org).
This changelog follows the rules of [Keep a Changelog](http://keepachangelog.com/).

## [Kando 0.4.0](https://github.com/kando-menu/kando/releases/tag/v0.4.0)

**Release Date:** 2024-01-11

#### Added

- **A new backend for macOS!**
  - This new native backend uses Objective-C++ and supports all required features for Kando. It can be used to synthesize keyboard and mouse events and to get the name and application of the currently focused window.
  - There are signed and notarized binaries for x86_64 and arm64 available on the [releases page](https://github.com/kando-menu/kando/releases). For now, I cannot test the arm64 version, so please let me know if it works for you!
  - I am still very new to macOS development, so please let me know if you encounter any issues!
- CodeQL analysis. This is a static analysis tool which is used to find bugs and security vulnerabilities in the code. It is now integrated into the CI pipeline and will run on every commit.

#### Changed

- When installed, the app is now called "Kando" instead of "kando".
- The X11 backend has been refactored to use a more object-oriented approach. Now it is more inlined with the other native backends.
- The Windows backend has been refactored to use a more object-oriented approach. Now it is more inlined with the other native backends.
- On Windows, the menu window is now minimized instead of hidden when the menu is closed. This allows for a smoother transition when opening the menu again.
- Replaced the switch-virtual-desktop example action with a <kbd>Ctrl</kbd>+<kbd>Z</kbd> example action.

#### Fixed

- Input focus after closing the menu on Windows. Now, the window which had focus before opening the menu will regain focus. Thanks to [@mmikeww](https://github.com/mmikeww) for this fix!
- Synthesizing key events on Windows which have _extended scan codes_ like for instance the <kbd>Win</kbd> key.

## [Kando 0.3.0](https://github.com/kando-menu/kando/releases/tag/v0.3.0)

<a href="https://www.youtube.com/watch?v=7vVdJ9LORAM">
<img align="right" width="400px" src="img/player03.jpg"></img>
</a>

**Release Date:** 2023-12-22

#### Added

- The possibility to **execute some specific actions when a menu item is selected**. This is the first step towards making Kando actually useful! To use this, you will have to edit your menu configuration file for now. This is located at `~/.config/kando/menus.json` (Linux) or `%appdata%\kando\menus.json` (Windows). Change the `type` of an item to one of the options below and add a `"data": { ... }` object with additional parameters. Kando will automatically reload the menu configuration file when you save it.
  - `"type": "command"`: This will execute a shell command. The command is specified in the `"data"` object. For instance, you can use `"data": { "command": "firefox" }` to open Firefox on Linux.
  - `"type": "uri"`: This will open a URI. The URI is specified in the `"data"` object. For instance, you can use `"data": { "uri": "https://github.com/kando-menu/kando" }` to open the Kando website.
  - `"type": "hotkey"`: This will simulate the given keyboard shortcut. The keys are given in the `"data"` object. For instance, you can use `"data": { "hotkey": "Control+V", "delayed": true }` to paste your clipboard content. If you set `"delayed"` to `true`, Kando will wait until its own window is closed before simulating the hotkey.
- Support for **multiple menus**. You can now add multiple menu configurations to the `menus.json` file with different shortcuts each. Each menu has to have a unique name. 
- Support for the `centered` property in the menu configuration. If this is set to `true`, **the menu will be opened in the center of the screen** instead of at the mouse pointer.
- A **new icon theme**: [Simple Icons](https://simpleicons.org/). This is a huge collection of icons for many different applications. You can use them in your menu configuration like this: `"icon": "firefox", "iconTheme": "simple-icons"`.
- The possibility to **open a specific menu from the command line**. You can use `kando --menu <name>` to open a specific menu. This also works when Kando is already running. In this case, a message will be sent to the running instance of Kando which will then open the requested menu.
- **Restoring of the sidebar visibility**. This is now stored in the application settings. This means that the sidebar will remain hidden when you restart Kando.
- A **new example action** in the sidebar which runs any given shell command. You can type a command into a text entry and Kando will execute it when you press enter. This will be one of the most basic actions in Kando.

#### Fixed

- Simulating the `MediaTrackPrevious`, `MediaTrackNext`, `MediaPlayPause`, and `MediaStop` keys on Linux.
- Loading of invalid menu configuration files. This no longer crashes Kando, but shows an error message in the console instead. Kando will fall back to the default configuration in this case.
- The `children` property of nodes in the menu configuration is now optional. Hence, leaf nodes do not have to have an empty `children` array anymore.
- Overwriting invalid menu configuration files. Instead of overwriting with the default settings, Kando will not touch invalid configuration files anymore.
- Alignment of the text on the center item. Before, it used to be left aligned if the text wrapped to multiple lines. Now, it is always centered.

#### Removed

- Showing the prototype menu when launching a second instance of Kando. As we now support multiple menus, this is no longer useful. Instead, you can now use the `--menu <name>` command line argument to open a specific menu.

## [Kando 0.2.0](https://github.com/kando-menu/kando/releases/tag/v0.2.0)

<a href="https://www.youtube.com/watch?v=hQGNSvu8IXY">
<img align="right" width="400px" src="img/player02.jpg"></img>
</a>

**Release Date:** 2023-11-24

#### Added

- A new backend for [Hyprland](https://hyprland.org/). This backend uses the [virtual-pointer](https://wayland.app/protocols/wlr-virtual-pointer-unstable-v1) and [virtual-keyboard](https://wayland.app/protocols/virtual-keyboard-unstable-v1) Wayland protocols to simulate mouse and keyboard input. In addition, it uses `hyprctl` to get the name of the currently focused window as well as the current pointer location. Global shortcuts are bound via the [hyprland-global-shortcuts](https://github.com/hyprwm/hyprland-protocols/blob/main/protocols/hyprland-global-shortcuts-v1.xml) protocol.
- Callbacks which called whenever menu items are hovered, unhovered, or selected. There is a fourth callback which is executed when a selection is aborted. Later, we will use these events to actually make something happen when items are selected in the menu.
- Initial support for persistent settings. Some settings (like the demo menu layout) are now saved and loaded to / from a file in the user's home directory (e.g. `~/.config/kando/` on Linux).
- Some initial code for the menu editor. This is not yet functional, but you can already open it by clicking the small gear icon in the bottom right corner of the screen when the demo menu is shown. [You can read more about the future plans for the menu editor](https://ko-fi.com/post/Editor-Mockups-U6U1PD0K8)!

#### Changed

- Large parts of the code have been refactored. For instance, by using the template engine [Handlebars](https://handlebarsjs.com/), the code is now much more readable and maintainable. 

## [Kando 0.1.0](https://github.com/kando-menu/kando/releases/tag/v0.1.0)

<a href="https://www.youtube.com/watch?v=ZTdfnUDMO9k">
<img align="right" width="400px" src="img/player01.jpg"></img>
</a>

**Release Date:** 2023-08-21

#### Added

- All initial features of the Tech-Demo. It's not a functional menu yet, but it already demonstrates the basic concepts. The following features are implemented:
  - Backends for Windows and Linux. On Linux, many X11-based window managers and KDE and GNOME on Wayland are supported.
  - Opening and closing a hard-coded example menu with about 400 entries.
  - Navigation in the menu using point-and-click.
  - Navigation in the menu using mouse gestures.
  - A short tutorial explaining the basic concepts.

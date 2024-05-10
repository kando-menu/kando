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

## [Kando 0.8.1](https://github.com/kando-menu/kando/releases/tag/v0.8.1)

**Release Date:** 2024-05-10

#### Added

- The possibility to change the open-menu-at-screen-center property via the menu editor.
- A link to the new [Kando Discord server](https://discord.gg/hZwbVSDkhy) to the README and to the sidebar in the menu editor.

#### Fixed

- An issue which prevented Kando from starting on Hyprland 0.40.0.

## [Kando 0.8.0](https://github.com/kando-menu/kando/releases/tag/v0.8.0)

<a href="https://www.youtube.com/watch?v=5WXzIvPXLuE">
<img align="right" width="400px" src="img/player08.jpg"></img>
</a>

**Release Date:** 2024-04-30

#### Added

- The possibility to change menu and menu item names! When a menu or menu item is selected, there is now a text field in the properties area on the right-hand side which allows to change the name.
- The possibility to change the icon of a menu or menu item! Next to the name field, there is now a button which opens an icon picker. This allows to select the icon theme and the icon itself. There is also a search field which allows searching for icons.
- A new icon theme: `"simple-icons-colored"`. This is a colored version of the [Simple Icons](https://simpleicons.org/) theme.
- A new item to the tray menu which allows to open the menu editor.
- A command line option to open the menu editor: `kando --settings`. If Kando is already running, the menu editor will be opened in the running instance.
- A desktop notification which is shown when you attempt to run a second instance of Kando.

#### Changed

- When a menu item is added to the menu preview in the menu editor, it will now be automatically selected. The only exception are submenus which will not be opened automatically.
- The binaries for the GitHub release are now built on newer versions of the CI runners. The Windows binaries are now built on Windows Server 2022, the macOS binaries on macOS 12 & 14, and the Linux binaries on Ubuntu 22.04.

#### Fixed

- Simulating hotkeys involving digit keys such as <kbd>Ctrl</kbd>+<kbd>1</kbd>.
- The desktop notification which is shown when a menu-item action fails. It now shows the correct error message.
- A crash when deleting or stashing one of the empty prototype menu items.

## [Kando 0.7.1](https://github.com/kando-menu/kando/releases/tag/v0.7.1)

**Release Date:** 2024-04-22

#### Fixed

- Fixed an issue which caused a JavaScript exception error to pop up when executing a command action for which the command returned a non-zero exit code.

## [Kando 0.7.0](https://github.com/kando-menu/kando/releases/tag/v0.7.0)

<a href="https://www.youtube.com/watch?v=Tv9kRgxygA4">
<img align="right" width="400px" src="img/player07.jpg"></img>
</a>

**Release Date:** 2024-04-21

#### Added

- The Add-New-Item tab! You can now add new items to the menu by dragging them from the toolbar to the menu preview. It's not yet possible to edit the items, but this is the next major step towards a fully functional menu editor.
- The Stash! You can now temporarily store menu items in the stash and later move them back to the menu. This is useful if you want to reorganize your menus or move things from one menu to another.
- The possibility to move menu items to the trash. They can be restored from the trash by dragging them back to the menu.

#### Changed

- Menu buttons in the toolbar of the menu editor have now a maximum width. They will not span the whole width of the toolbar anymore.
- Dragged menu items now have a subtle backdrop blur.
- If a dragged item from the toolbar is not successfully dropped somewhere, there will now be an animation of the item moving back to its original position.
- To support drag-and-drop operations from the toolbar to the menu preview, some code refactoring was necessary. Also, item types are now much less hard-coded and much more modular, which also involved much refactoring. Both changes should not be visible to the user, but if you experience any issues in the menu editor, please let me know!

#### Fixed

- Loosing menu items when pressing the <kbd>Escape</kbd> key in the menu editor during a drag operation. Now, the drag operation will be properly cancelled, and the menu editor will not be closed.
- A weird issue on Windows where closing the menu left a small unclickable area in the bottom left of the screen. See [#375](https://github.com/kando-menu/kando/issues/375) for details. 

## [Kando 0.6.0](https://github.com/kando-menu/kando/releases/tag/v0.6.0)

<a href="https://www.youtube.com/watch?v=8O5N6uS3cLo">
<img align="right" width="400px" src="img/player06.jpg"></img>
</a>

**Release Date:** 2024-03-29

#### Added

- The possibility to use emojis as menu item icons. Just use `"iconTheme": "emoji"` and for instance `"icon": "🚀"` in your `menus.json`.
- The possibility to select the to-be-edited menu in the menu editor.
- The possibility to add new menus in the editor. This is not yet very useful as there is no way to edit the menus yet, but it's a another step towards a fully functional menu editor.
- The possibility to delete menus in the editor. Simply drag an item from the menu list to the trash tab in the toolbar! You can also restore deleted menus from the trash by dragging them back to the menu list. It's not yet possible to delete menu items from the preview.
- The possibility to lock item positions in the menu preview of the editor. Locked items cannot be reordered but moved to a fixed angle instead.
- The possibility to close the menu with the right mouse button.
- A subtle pulse animation to the drop indicator in the menu editor's preview.
- Support for Plasma 6.
- Support for Wayland on GNOME 46 via an update to the [🐚 Kando GNOME Shell integration extension](https://github.com/kando-menu/gnome-shell-integration).

#### Changed

- Significantly improved the algorithm which calculates the drop location when dragging an item in the menu editor's preview. There are still some weird edge cases especially in the presence of fixed angles, but it should work much better now.
- The sizing and layout of the editor components now depends on the window size. The menu editor will now look much better on small and large screens.
- The drop indicator in the menu editor's preview will now move to submenus or the back-navigation button when an item is dragged over them.
- The icons of the menu are now cropped to a circle with some small padding. This improves the look of menu icons which before touched the border of the item.
- The menu editor now uses some subtle backdrop blur for the sidebar to reduce visual clutter.
- The mouse cursor will now change to a grabbing hand when moving an item in the menu editor's preview.
- The word wrapping in the menu's center text has been improved, and any overflowing text is now hidden.
- The SCSS source code of Kando has received a major cleanup. It is now much better documented and structured.
- If no menus are configured, Kando will recreate the default prototype menu on startup. This is useful if you accidentally removed all menus from the configuration file.

#### Fixed

- An issue which prevented the app from starting if no shortcut was configured for a menu.


## [Kando 0.5.0](https://github.com/kando-menu/kando/releases/tag/v0.5.0)

<a href="https://www.youtube.com/watch?v=rLJ1-z9i3cI">
<img align="right" width="400px" src="img/player05.jpg"></img>
</a>

**Release Date:** 2024-01-29

#### Added

- The first component of the menu editor: **The menu preview!** This shows a preview of the menu which is currently being edited. For now, it can be used to...
  * Reorder menu items.
  * Drop menu items into submenus.
  * Move menu items to the parent level.
  * Any changes will be saved to the menu configuration file when the editor is closed.
- Some initial documentation. You can read it [here](https://github.com/kando-menu/kando/blob/main/docs/README.md).
- A console message when a second instance of Kando is launched. Before, the second instance would just silently quit.

#### Changed

- The item positioning code has been slightly changed: If no fixed angle is given, the first child will now be positioned at the first valid position counting clockwise from the top. Before, it was positioned at the position closest to the top, which could have been slightly counter-clockwise as well.
- The menu is now hidden when the user exits the menu editor.
- Some parts of the rendering code have been refactored. This should not change anything for the user, but it makes the code more readable and maintainable.

#### Fixed

- Global shortcuts on KDE Wayland which were broken due to a regression.
- Opening the menu on KDE Wayland when no window was focused.

## [Kando 0.4.1](https://github.com/kando-menu/kando/releases/tag/v0.4.1)

**Release Date:** 2024-01-15

#### Fixed

- The macOS M1 binaries are now created on one of GitHub's [large macOS runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-larger-runners/about-larger-runners) which run on actual M1 hardware. This should fix the issue where the arm64 binaries did not work on M1 Macs.


## [Kando 0.4.0](https://github.com/kando-menu/kando/releases/tag/v0.4.0)

<a href="https://www.youtube.com/watch?v=GdbM-YxesC8">
<img align="right" width="400px" src="img/player04.jpg"></img>
</a>

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

<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <a href="contributing.md">Contributing Guidelines <img src ="img/right-arrow.png"/></a>
</p>
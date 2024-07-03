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

## [unreleased]

**Release Date:** TBD

#### Added

- **Copy Items:** If <kbd>Ctrl</kbd> or <kbd>Command</kbd> is pressed while dragging a menu or menu item in the editor, the item will be duplicated instead of moved. Due to an [issue in electron](https://github.com/electron/electron/issues/8730), the cursor graphic does not change when dragging or copying items on macOS. The operation is still performed correctly, though.
- **Menu Scaling:** The menu now behaves properly when scaled via <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>+</kbd>, <kbd>Ctrl</kbd>+<kbd>-</kbd>, and <kbd>Ctrl</kbd>+<kbd>0</kbd>. The scale factor is saved to and loaded from `config.json`. It's still a somewhat hidden feature, but once we have a general settings UI, this can be exposed via slider in the UI.
- **Anchored Mode:** In addition to the existing "Centered Mode", there is now an "Anchored Mode". In this mode, submenus are opened at the position of the parent item. With this, the menu will always stay at the same position on the screen. With this mode, gesture selections are not possible, but it seems that some users prefer this behavior.
- **Menu Templates:** The stash tab is now called "Templates". In addition to menu items, you can now also store entire menus in there. Move them back to the menus tab or the preview to create unlimited copies of the same menu, submenu, or menu item!
- **New-Version Notification:** When a new version of Kando is available, a notification will be shown. It works the following way: When you open a menu, Kando will check GitHub for a new release. If a new version is found, a notification will be shown and no further tests are made for this session. If no new version is found or the connection failed, Kando will try again when a menu is opened next time, but not earlier than an hour later. There is also a new `enableVersionCheck` in the application settings which can be used to disable this feature.
- **Icon-Name Tooltips in the Icon Picker:** When hovering over an icon in the icon picker, the name of the icon is now shown as a tooltip. This should make it easier to find an icon again. Thanks to [@pushkardev123](https://github.com/pushkardev123) for this contribution!

#### Changed

- The "Execute Delayed" property of hotkey and macro items is now called "Execute After Closing the Menu". This should make it clearer what this property does.
- The "Execute After Closing the Menu" property is now enabled by default for hotkey and macro items. This should make it easier to use these items in a way that is expected by most users.
- Command items now have an "Execute After Closing the Menu" property as well. This allows to execute a command after closing the menu. This is useful if the command should be executed in the context of the currently focused window.
- "Open at Pointer" has been renamed to "Centered Mode" (and the condition has been inverted).
- The menu items in the editor's preview use now a pointer cursor when hovered. This should make it clearer that the items are interactive.
- Newly added items in the editor's preview are now selected by default.
- The minimum distance your pointer has to travel to trigger a selection in mark mode has been reduced from 200 to 150 pixels. This makes it possible to draw gestures at a smaller scale.

#### Fixed

- A bug where the properties of a menu item were still shown in the editor after the item was deleted.
- A bug where menu items would be selected when pressing <kbd>Esc</kbd> (or nay other key) while dragging an item.
- A bug which caused empty error messages to be shown when executing an action failed.
- Simulating the <kbd>Tab</kbd> key on macOS. Thanks to [@NeighNeighNeigh](https://github.com/NeighNeighNeigh) for the fix!
- Simulating the <kbd>A</kbd> key on macOS.
- Restoring input focus after closing the menu on macOS 11 by downgrading Electron to version 29. This is a temporary fix until the issue is resolved in a newer version of Electron.

## [Kando 1.1.0](https://github.com/kando-menu/kando/releases/tag/v1.1.0)


<a href="https://www.youtube.com/watch?v=1TCpDkwqwxc">
<img align="right" width="400px" src="img/player11.jpg"></img>
</a>

**Release Date:** 2024-06-20

#### Added

- **Menu Conditions!** It is now possible to show menus only under certain circumstances. For instance, you can show a menu only if a specific application is focused or if the mouse is in a specific region of the screen. Thanks a ton to [@ClearStaff](https://github.com/ClearStaff) for many contributions to this feature!
- New menu item type: **Keyboard Macros**! You can now record and playback keyboard macros in Kando. This is very useful if you want to automate repetitive tasks! The new item type is much more flexible than the simple hotkey-simulation action. It allows for an arbitrary number of key presses and releases and also supports delays between the key events.
- **Single-Key Turbo Mode**: Now _any_ key is a Turbo-Mode modifier. Before only if <kbd>Alt</kbd>, <kbd>Ctrl</kbd>, <kbd>Shift</kbd>, and <kbd>Meta</kbd> were held down, you could browse through the menu in "Turbo-Mode". Now this is possible with any key. This makes it possible to easily use Turbo-Mode even if a menu is bound to a single key without a modifier.

#### Changed

- On macOS, the application settings are now stored in `~/Library/Application Support/kando/` (with a lowercase `kando`). This is more consistent with the other platforms and macOS seems to handle this in a case-insensitive way, so the settings should be preserved when upgrading from an older version.
- When a menu is opened in screen-center mode, turbo-mode is now disabled initially. This is to prevent accidental navigation when the menu is opened and a key is still pressed. Once all keyboard keys are released, turbo-mode can be activated by pressing and holding any key.
- Updated from Electron 28 to Electron 30. This should bring some performance improvements. However, there's also a regression on X11 Linux where getting the mouse position before opening the menu is not reliable anymore. Therefore, a custom implementation is used on X11 Linux now. Report any issues you encounter, especially on fractional scaling setups!
- The description line of hotkey items in the stash or in the trash now shows the hotkey in a shorter format. For instance, "ControlLeft+AltLeft+ArrowRight" is now shown as "Ctrl + Alt + ArrowRight".
- An [ESLint rule](https://typescript-eslint.io/rules/naming-convention/) which enforces naming conventions is used now. This should make the code more consistent, easier to read, and easier to contribute to.
- Another [ESLint rule](https://eslint.org/docs/latest/rules/curly) which enforces the use of curly braces for all control statements is used now. This should make the code more consistent and less error-prone.

#### Fixed

- A bug where the menu would not open on the correct monitor on Windows if there was a monitor with a higher DPI scale to the right of a monitor with a lower DPI scale.
- Low-resolutions tray icons on macOS.
- A regression which caused a dock-icon on macOS to be shown for Kando.
- A bug which caused the icons of the "Simple Icons (Colored)" theme to be shown in the center menu item even if a child item was hovered. This made the item names unreadable.

## [Kando 1.0.0](https://github.com/kando-menu/kando/releases/tag/v1.0.0)

<a href="https://www.youtube.com/watch?v=vOE7EAlPUwE">
<img align="right" width="400px" src="img/player10.jpg"></img>
</a>

**Release Date:** 2024-06-07

#### Added

- Support for HiDPI screens. Kando will now properly warp the mouse pointer to the center of a menu item even if display scaling is enabled.
- Better example menus. When you launch Kando for the first time (or delete your `menus.json` file), you will now see a more useful example menu. This menu depends on the platform you are using. There are some hard-coded applications and keyboard shortcuts, but you can easily change them in the menu editor.
- Some initial usage documentation. You can read it [here](usage.md).
- Some documentation about the [format of the shortcuts and hotkeys used in Kando](configuring.md#menu-shortcuts-vs-simulated-hotkeys).
- Issue templates. If you now [open a new issue](https://github.com/kando-menu/kando/issues/new/choose), you can choose from different templates.
- A [Code of Conduct](code-of-conduct.md). This is a set of rules which defines the behavior of contributors and users in the Kando community. It is important to read and understand this document before contributing to Kando.

#### Changed

- **[BREAKING]** On Linux, all configuration files are now stored in `~/.config/kando/`. The directory now starts with **lowercase letter**! To migrate your configuration, simply move the `menus.json` file from the old location to the new one.
- Kando is now shown on all workspaces.
- The sidebar tab "Tutorial" has been renamed to "Introduction". There will be real tutorials in the future.
- The top-level menu item in the configuration file is now called `"root"` instead of `"nodes"`. This is more consistent with the source code. Your settings file will be automatically migrated when you start Kando.

#### Removed

- The console message which reported hover and selection events. This was only useful for debugging and is no longer needed.

#### Fixed

- A regression on Windows where the menu would not open on the correct monitor.
- Touch input in the menu editor. It is now possible to edit menus on touch devices. This involved a complete rewrite of the drag-and-drop code - please let me know if you encounter any issues!

## [Kando 0.9.0](https://github.com/kando-menu/kando/releases/tag/v0.9.0)

<a href="https://www.youtube.com/watch?v=_3KkDnfu_CE">
<img align="right" width="400px" src="img/player09.jpg"></img>
</a>

**Release Date:** 2024-05-24

#### Added

- The possibility to **change the shortcut of a menu** in the menu editor. There is now a text field in the properties area on the right-hand side which allows to either enter the shortcut directly or to press the key combination on the keyboard. This works on all platforms, except for KDE/Wayland and Hyprland, where direct binding of global shortcuts is not directly supported.
- **[BREAKING]** The possibility to change the global shortcut ID on platforms which do not support direct binding of global shortcuts. For instance, on KDE/Wayland or on Hyprland, Kando can not directly bind global shortcuts. On those platforms, the menu editor shows a text field instead of the shortcut picker. Here you can enter a unique ID for the shortcut and then use the global shortcut settings of the desktop environment to bind the shortcut ID to a key combination. **On these platforms, your existing global shortcuts will not work anymore**. You will have to rebind them using the new method!
- The possibility to **configure menu items** in the menu editor:
  - For the hotkey action, there is a hotkey-picker which allows recording a key combination.
  - For the command action, there is now a text field which allows to enter the command directly.
  - For the URI action, there is also a text field which allows to enter the URI directly.
- Tips for the menu editor. When you select a menu item, a more or less related **tip will be shown** in the properties area on the right-hand side. 

#### Changed

- If binding a global shortcut fails, Kando will now show a desktop notification with an error message. Before, Kando would refuse to start.
- It is now allowed to have **multiple menus with the same shortcut**. In this case, Kando will simply show the first menu with the given shortcut. In the future, there will be the possibility to select the menu based on the currently focused window.
- The `"shortcut"` property in the menu configuration is now optional. If no shortcut is given, the menu will not be accessible via a global shortcut. This is useful if you want to have a menu which is only accessible via the tray icon or via the command line.
- **[BREAKING]** The Simulate-Hotkey action now strictly uses DOM key codes. Before, it was possible to use key names like `"Control"`, `"Shift"`, or `"Alt"`. Now, you have to use the key codes like `"ControlLeft"`, `"ShiftLeft"`, or `"AltLeft"`. You can find a list of all valid codes [here](https://github.com/kando-menu/kando/blob/main/src/common/key-codes.ts#L70). 
- Improved the code for creating the menu DOM tree. This improves the performance of opening menus with many items significantly (🚀 **about 5x faster**).
- Handlebars templates are now precompiled. This significantly improves the loading time of the menu editor (🚀 **about 2x faster**).
- Refactored some more editor-opening code to remove a forced reflow. This makes the editor open even faster (🚀 **another 1.5x**).
- Rename the "Open URL" action to "Open URI" in the menu editor.

#### Removed

- The Example Actions tab from the sidebar. As we are getting closer to a fully functional menu editor, this tab is no longer needed.
- The non-functional get-menus-online buttons from the menus tab. They will return in a later version when we have a way to actually get menus online.

#### Fixed

- A bug which occurred when opening a completely empty menu.
- The [GNOME Shell integration extension](https://github.com/kando-menu/gnome-shell-integration) now ensures that shortcuts are rebound when the extension is reloaded. This fixes an issue where shortcuts would not work after logging out and back in.

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
  <a href="code-of-conduct.md"><img src ="img/left-arrow.png"/> Code of Conduct</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <a href="contributing.md">Contributing Guidelines <img src ="img/right-arrow.png"/></a>
</p>
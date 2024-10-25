<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<img src="img/banner03.png"></img>

# The Config Files

All settings are stored in **two configuration files** JSON files which you can also edit manually.
`config.json` stores the general configuration of the application and `menus.json` stores the configuration of the individual menus.
Depending on your platform, the configuration files are located in different directories:

* <img height="14" width="26" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Windows_logo_-_2021_%28Black%29.svg" /> Windows: `%appdata%\kando\`
* <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS: `~/Library/Application Support/kando/`
* <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux: `~/.config/kando/`

**📝 JSON Format**: Both configuration files are JSON files. You can edit them with any text editor.

**🔥 Hot Reloading:** Whenever you save a file, Kando will automatically reload the configuration.

**✅ Validation:** Kando will validate the configuration files and [print errors to the console](installing.md#running-kando-from-the-command-line) if it finds any. In this case, the configuration will not be reloaded. If a configuration file is invalid at startup, Kando will use the default configuration instead.


## The General Configuration: `config.json`

This file contains the general configuration of Kando.

Property | Default Value | Description
-------- | ------------- | -----------
`menuTheme` | `"default"` | The directory name of the menu theme to use. Kando will first look for a directory with this name in the `menu-themes` subdirectory of the config directory. If it does not find one, it will look for a directory with this name in `.webpack/renderer/assets/menu-themes` in Kando's installation directory.
`darkMenuTheme` | `"default"` | The name of the theme which should be used if the system is in dark mode.
`menuThemeColors` | `{}` | A map of accent color overrides for each theme. A color override for the "default" theme could look like this: `{ "default": {"background-color":  "#RRGGBB"}}`.
`darkMenuThemeColors` | `{}` | Same as above, however this one will be used if the system is in dark mode.
`enableDarkModeForMenuThemes` | `false` | Whether Kando should use the dark menu theme if the system is in dark mode.
`sidebarVisible` | `true` | Whether the left sidebar is currently visible.
`zoomFactor` | `1.0` | The zoom factor of the menu. This can be used to scale the menu on high-resolution screens.
`enableVersionCheck` | `true` | If set to `true`, Kando will check for new version regularly, and show a notification if a new version is available.
`menuOptions` | _see below_ | The parameters configure the general behavior of the menus.
`editorOptions` | _see below_ | The parameters configure the behavior of the menu editor.

### The `menuOptions` Property

Property | Default Value | Description
-------- | ------------- | -----------
`centerDeadZone` | `50` | Clicking inside this radius (in pixels) will select the parent element or close the menu.
`minParentDistance` | `150` | The distance in pixels at which the parent menu item is placed if a submenu is selected close to the parent.
`dragThreshold` | `15` | This is the threshold in pixels which is used to differentiate between a click and a drag. If the mouse is moved more than this threshold before the mouse button is released, an item is dragged.
`fadeInDuration` | `150` | The duration of the fade-in animation in milliseconds. Set to `0` to disable the animation.
`fadeOutDuration` | `200` | The duration of the fade-out animation in milliseconds. Set to `0` to disable the animation. Some actions are only executed after the fade-out animation has finished, so reducing this value can make the menu much "snappier".
`enableMarkingMode` | `true` | If enabled, items can be selected by dragging the mouse over them.
`enableTurboMode` | `true` | If enabled, items can be selected by hovering over them while holding down a keyboard key.
`gestureMinStrokeLength` | `150` | Shorter gesture strokes will not lead to selections (in pixels).
`gestureMinStrokeAngle` | `20` | Smaller turns will not lead to selections (in degrees).
`gestureJitterThreshold` | `10` | Smaller pointer movements will not be considered at all during gesture recognition (in pixels).
`gesturePauseTimeout` | `100` | If the pointer is stationary for this many milliseconds, the current item will be selected during gesture recognition.
`fixedStrokeLength` | `0` | If set to a value greater than 0, items will be instantly selected if the mouse travelled more than `centerDeadZone` + `fixedStrokeLength` pixels in marking or turbo mode. Any other gesture detection based on angles or motion speed will be disabled in this case.
`rmbSelectsParent` | `false` | If enabled, the parent of a selected item will be selected on a right mouse button click. Else the menu will be closed directly.

### The `editorOptions` Property

Property | Default Value | Description
-------- | ------------- | -----------
`showSidebarButtonVisible` | `true` | Set this to `false` to hide the show-sidebar button. It will still be clickable, though.
`showEditorButtonVisible` | `true` | Set this to `false` to hide the show-editor button. It will still be clickable, though.

## The Menu Configuration: `menus.json`

This file contains the configuration of the individual menus.
There are two top-level JSON objects: `menus` contains a list of _Menu Descriptions_ and `templates` contains a list of _Menu Descriptions_ or _Menu Item Descriptions_.

```js
{
  "menus": [
    {
      // First Menu Description.
      // ...
    },
    {
      // Second Menu Description.
      // ...
    },
    // ...
  ],
  "templates": [
    // Can contain Menu Descriptions and Menu Item Descriptions.
  ]
}
```

> [!TIP]
> You can have a look at a the example menu configurations [here](https://github.com/kando-menu/kando/tree/main/src/main/example-menus)!


### Menu Descriptions

The items in the `menus` list are called menu descriptions.
They are JSON objects with the following properties:

Property | Default Value | Description
-------- | ------------- | -----------
`shortcut` | `""` | The shortcut which opens the menu. This is a string which can contain multiple keys separated by `+`. For example, `"Ctrl+Shift+K"` or `"Cmd+Shift+K"`. If empty, the menu will not have a shortcut. See [Menu Shortcuts vs. Simulated Hotkeys](configuring.md#menu-shortcuts-vs-simulated-hotkeys) for details.
`shortcutID` | `""` | On some platforms, Kando can not bind shortcuts directly. In this case, you can use this property to assign an ID which can be used in the global shortcut configuration of your desktop environment. This should be lowercase and contain only ASCII characters and dashes. For example, `"main-trigger"`.
`root` | _mandatory_ | The root menu item of the menu given as a Menu Item Description. See below for details.
`centered` | `false` | Whether the menu should be centered on the screen. If this is `false`, the menu will be opened at the position of the mouse cursor.
`warpMouse` | `false` | Whether the mouse cursor should be moved to the center of the menu when the menu is opened in `centered` mode.
`anchored` | `false` | Whether the submenus should be opened at the position where the menu was opened initially. If this is `false`, the submenus will be opened at the position of the mouse cursor.
`conditions` | `{}` | A dictionary of conditions which must be met for the menu to be shown. See below for details.

### Menu Conditions

The `conditions` property of a menu description can contain a dictionary of conditions.
Only if all conditions are met, the menu will be shown.

Property | Default Value | Description
-------- | ------------- | -----------
`appName` | `""` | The name of the application which must be focused for the menu to be shown. If it is a simple string, the condition is met if the name of the focused application contains the given string (case-insensitive). If the string starts with a `/`, it is interpreted as a regular expression.
`windowName` | `""` | The name of the window which must be focused for the menu to be shown. It is interpreted in the same way as `appName`.
`screenArea` | `{}` | A dictionary with the optional properties `xMin`, `xMax`, `yMin`, and `yMax`. The menu will only be shown if the mouse cursor is within the given screen area. The values are given in pixels and are relative to the top-left corner of the screen. If a value is not given, the area is unbounded in this direction.

### Menu Item Descriptions

The layout of the menu is described by a tree of menu items.
Each menu item is a JSON object with the following properties:

Property | Default Value | Description
-------- | ------------- | -----------
`name` | `"undefined"` | The name of the menu item. This is shown in the center of the menu when the item is hovered. The name of the root item defines the name of the menu.
`iconTheme` | `""` | This can either be one of the built-in icon themes (`"material-symbols-rounded"`, `"simple-icons"`, `"simple-icons-colored"`, `"base64"`, or `"emoji"`) or a subdirectory of the `icon-themes` subdirectory in Kando's config directory. The built-in icon themes use icons from [Google's Material Symbols](https://fonts.google.com/icons) or [Simple Icons](https://simpleicons.org/) respectively.
`icon` | `""` | The name of the icon from the given icon theme, an emoji like `"🚀"` (if the `iconTheme` is `"emoji"`), or a base64-encode image like `"data:image/gif;base64,..."` (if the icon theme is `"base64"`).
`angle` | _auto_ | If given, this defines the angle of the menu item in degrees. If this is not given, the angle is calculated automatically. 0° means that the item is at the top of the menu, 90° means that the item is on the right side of the menu, and so on. All sibling items are evenly distributed around the items with given angles.
`type` | `"submenu"` | The type of the menu item. There are several types available. See below for details.
`data` | `{}` | Depending on the type of the item, this can contain additional data. See below for details.
`children` | `[]` | If the menu item is a submenu, this contains a list of child items. See below for details.

### Menu Item Types

For now, the `type` property of a menu item can be one of the following values.
New types will be added in the future.

#### `"submenu"`
This is the default type.
It is used to create a submenu.
The `children` property of the menu item must contain a list of child items.

#### `"command"`
This type is used to execute a shell command.
The `data` property of the menu item must contain a `command` property which contains the shell command to execute.
The optional `delayed` property will ensure that the command is executed _after_ the Kando window is closed.
This can be useful if the command targets another window.
For instance, this menu item will open Inkscape on Linux:
```json
{
  "name": "Inkscape",
  "icon": "inkscape",
  "iconTheme": "simple-icons",
  "type": "command",
  "data": {
    "command": "/usr/bin/inkscape",
    "delayed": false
  }
}
```

#### `"uri"`
This type is used to open any kind of URI.
The `data` property of the menu item must contain a `uri` property which contains the URI to open.
For instance, this menu item will open GitHub in the default browser:
```json
{
  "name": "GitHub",
  "icon": "github",
  "iconTheme": "simple-icons",
  "type": "uri",
  "data": {
    "uri": "https://github.com"
  }
}
```

#### `"hotkey"`
This type is used to simulate simple keyboard events.
The `data` property of the menu item must contain a `hotkey` property which contains the hotkey to simulate.
See [Menu Shortcuts vs.
Simulated Hotkeys](configuring.md#menu-shortcuts-vs-simulated-hotkeys) for details on the format of the `hotkey` property.
The optional `delayed` property will ensure that the hotkey is simulated _after_ the Kando window is closed.
This can be used if the hotkey should be captured by another window.
For instance, this menu item will paste the clipboard content:
```json
{
  "name": "Paste",
  "icon": "content_paste_go",
  "iconTheme": "material-symbols-rounded",
  "type": "hotkey",
  "data": {
    "hotkey": "ControlLeft+KeyV",
    "delayed": true
  }
}
```

#### `"macro"`
This type is used to simulate a more comples sequence of keyboard events.
The `data` property of the menu item must contain a `macro` property which contains the sequence of key codes to simulate.
See [Menu Shortcuts vs. Simulated Hotkeys](configuring.md#menu-shortcuts-vs-simulated-hotkeys) for details on key code format.
The optional `delayed` property will ensure that the macro is simulated _after_ the Kando window is closed.
This can be used if the macro should be captured by another window.
For instance, this menu item will type "Hi" on most keyboard layouts:
```json
{
  "type": "macro",
  "data": {
    "macro": [
      {
        "type": "keyDown",
        "key": "ShiftLeft",
        "delay": 10
      },
      {
        "type": "keyDown",
        "key": "KeyH",
        "delay": 10
      },
      {
        "type": "keyUp",
        "key": "KeyH",
        "delay": 10
      },
      {
        "type": "keyUp",
        "key": "ShiftLeft",
        "delay": 10
      },
      {
        "type": "keyDown",
        "key": "KeyI",
        "delay": 10
      },
      {
        "type": "keyUp",
        "key": "KeyI",
        "delay": 10
      }
    ],
    "delayed": true
  },
  "name": "Hello World",
  "icon": "keyboard_keys",
  "iconTheme": "material-symbols-rounded"
}
```


<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <a href="configuring.md"><img src ="img/left-arrow.png"/> Configuring Kando</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <a href="menu-themes.md">Creating Menu Themes <img src ="img/right-arrow.png"/></a>
</p>

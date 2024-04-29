<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<img src="img/banner03.jpg"></img>

# Configuring Kando

> [!WARNING]
> This project is currently in a very early stage of development. There is not yet a graphical configuration tool and the configuration file format is not yet stable. You can read regular updates on the project on [my Ko-fi page](https://ko-fi.com/schneegans)!

## The Configuration Files

For now, Kando uses **two configuration files**. `config.json` stores the general configuration of the application and `menus.json` stores the configuration of the individual menus.
Depending on your platform, the configuration files are located in different directories:

* <img height="14" width="26" src="https://cdn.simpleicons.org/windows" /> Windows: `%appdata%\kando\`
* <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS: `~/Library/Application Support/Kando/`
* <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux: `~/.config/Kando/`

**📝 JSON Format**: Both configuration files are JSON files. You can edit them with any text editor.

**🔥 Hot Reloading:** Whenever you save a file, Kando will automatically reload the configuration.

**✅ Validation:** Kando will validate the configuration files and [print errors to the console](installing.md#running-kando-from-the-command-line) if it finds any. In this case, the configuration will not be reloaded. If a configuration file is invalid at startup, Kando will use the default configuration instead.


### The General Configuration: `config.json`

This file contains the general configuration of Kando.
For now, only a single option is available:

Property | Default Value | Description
-------- | ------------- | -----------
`sidebarVisible` | `true` | Whether the left sidebar is currently visible.

### The Menu Configuration: `menus.json`

This file contains the configuration of the individual menus.
The top-level JSON object is called `menus` and contains a list of menu descriptions:

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
  ]
}
```

> [!TIP]
> You can have a look at a complete example configuration [here](https://gist.github.com/Schneegans/ebd385030bb7e15aa24d73f23abb4b53)!


#### Menu Descriptions

The items in the `menus` list are called menu descriptions.
They are JSON objects with the following properties:

Property | Default Value | Description
-------- | ------------- | -----------
`shortcut` | _mandatory_ | The shortcut which opens the menu. This is a string which can contain multiple keys separated by `+`. For example, `"Ctrl+Shift+K"` or `"Cmd+Shift+K"`.
`nodes` | _mandatory_ | The root menu item of the menu given as a Menu Item Description. See below for details.
`centered` | `false` | Whether the menu should be centered on the screen. If this is `false`, the menu will be opened at the position of the mouse cursor.

#### Menu Item Descriptions

The layout of the menu is described by a tree of nodes.
Each menu item is a JSON object with the following properties:

Property | Default Value | Description
-------- | ------------- | -----------
`name` | `"undefined"` | The name of the menu item. This is shown in the center of the menu when the item is hovered. The name of the root item defines the name of the menu.
`iconTheme` | `""` | For now, this can either be `"material-symbols-rounded"`, `"simple-icons"`, `"simple-icons-colored"`, or `"emoji"`. With the first, you can use icons from [Google's Material Symbols](https://fonts.google.com/icons). With the second or third, you can use any icon from [Simple Icons](https://simpleicons.org/).
`icon` | `""` | The name of the icon from the given icon theme or an emoji like `"🚀"`.
`angle` | _auto_ | If given, this defines the angle of the menu item in degrees. If this is not given, the angle is calculated automatically. 0° means that the item is at the top of the menu, 90° means that the item is on the right side of the menu, and so on. All sibling nodes are evenly distributed around the nodes with given angles.
`type` | `"submenu"` | The type of the menu item. There are several types available. See below for details.
`data` | `{}` | Depending on the type of the item, this can contain additional data. See below for details.
`children` | `[]` | If the menu item is a submenu, this contains a list of child nodes. See below for details.

#### Menu Item Types

For now, the `type` property of a menu item can be one of the following values.
New types will be added in the future.

**`"submenu"`:** This is the default type. It is used to create a submenu. The `children` property of the menu item must contain a list of child nodes.

**`"command"`:** This type is used to execute a shell command. The `data` property of the menu item must contain a `command` property which contains the shell command to execute. For instance, this menu item will open Inkscape on Linux:
```json
{
  "name": "Inkscape",
  "icon": "inkscape",
  "iconTheme": "simple-icons",
  "type": "command",
  "data": {
    "command": "/usr/bin/inkscape"
  }
}
```

**`"uri"`:** This type is used to open any kind of URI. The `data` property of the menu item must contain a `uri` property which contains the URI to open. For instance, this menu item will open GitHub in the default browser:
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

**`"hotkey"`:** This type is used to simulate a keyboard shortcut. The `data` property of the menu item must contain a `hotkey` property which contains the shortcut to simulate. The optional `delayed` property will ensure that the hotkey is simulated _after_ the Kando window is closed. This can be used if the hotkey should be captured by another window. For instance, this menu item will paste the clipboard content:
```json
{
  "name": "Paste",
  "icon": "content_paste_go",
  "iconTheme": "material-symbols-rounded",
  "type": "hotkey",
  "data": {
    "hotkey": "Control+V",
    "delayed": true
  }
}
```

<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <a href="installing.md"><img src ="img/left-arrow.png"/> Building Kando</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
</p>

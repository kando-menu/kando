<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<img src="img/banner07.png"></img>

# Creating Menu Themes for Kando

Kando allows you to create custom themes for the menus.
A theme defines several layers which will be painted on top of each other for each menu item.
Depending on the menu item's state (e.g. active, child, parent, hovered, etc.), the layers can be styled differently.

## 🧬 Anatomy of a Menu Theme

A menu theme is a directory containing at least two files: `theme.json` and `theme.css`.
* The JSON file contains metadata about the theme and a list of layers which will be created for each menu item.
Each layer gets a specific _class name_ which can be used in the CSS file to style the layer.
* The CSS file can contain any CSS code you like. With _CSS selectors_, you can choose which layers to style in which way.

The CSS file can reference assets like images or fonts. These can be placed in the same directory as the JSON and CSS files or in a subdirectory.

## 📁 Menu Theme Locations

Depending on how you installed Kando, menu themes will be searched for in different locations.
First, Kando will look for menu-theme directories in your home directory:
* <img height="14" width="26" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Windows_logo_-_2021_%28Black%29.svg" /> Windows: `%appdata%\kando\menu-themes\`
* <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS: `~/Library/Application Support/kando/menu-themes/`
* <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux: `~/.config/kando/menu-themes/`

Next, Kando will look for menu-theme directories in the installation directory.
For this, look for the `resources/app/.webpack/renderer/assets/menu-themes/` directory in the installation directory.

If you are running Kando from the source code via `npm start`, it will look for themes in the `assets/menu-themes/` directory.

## 📑 Metadata and Layer Description: `theme.json`

> [!TIP]
> You can also name this file `theme.json5` and use the [JSON5](https://json5.org/) format. This is a bit easier to read and allows comments.

Below you can have a look at the `theme.json5` file of the default theme.
The keys are explained with inline comments.
Most of it will be clear, but some keys might need a bit more explanation.
We will have a look at the `colors` and `layers` keys in the following sections.

https://github.com/kando-menu/kando/blob/b829e2f8952118a8e2beb5842473e23ce2aac9b8/assets/menu-themes/default/theme.json5#L1-L39

### The `colors` Array

The `colors` key is an array of objects.
Each object has a `name` and a `default` key.
In your CSS file, you can use the colors with `var(--<name>)`.

In the future, the user will be able to override these colors in menu editor.
It is already possible to override them by adding a `"menuThemeColors": [],` key to the `config.json` file where each entry is an object with a `name` and a `color` key.

### The `layers` Array

This is maybe the most important part of the metadata file.
It describes the div elements which will be created for each menu item.

## 🎨 Styling of the Menu: `theme.css`

> [!TIP]
> In the "Development" tab of the sidebar, you can find a "Reload Menu Theme" button. You can use this button during theme development to reload the theme without restarting Kando. Changes you made to the CSS file will be applied immediately, for changes to the JSON file you need to re-open the menu. If you are running Kando from the source code via `npm start`, any changes made to the themes in the `assets/menu-themes/` directory will be applied immediately.

## 🛳️ Distributing your Theme

In the future, we plan to add a repository for sharing themes.
For now, you are invited to share your themes in [Kando's Discord Server](https://discord.gg/hZwbVSDkhy).
If the community likes your theme, we can even make it a default theme in Kando!

<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <a href="config-files.md"><img src ="img/left-arrow.png"/> Config Files</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
  <img src="img/nav-space.svg"/>
</p>
<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <img src="docs/img/logo-big.png"/>
</p>


_:construction: This project is currently in a very early stage of development. For now, I use this repository mainly for testing things. You can read regular updates on the project on [my Ko-fi page](https://ko-fi.com/schneegans)._

**Ken-Do** will be a pie menu for the desktop.
It will be highly customizable and will allow you to create your own menus and actions.
For instance, you can use it to control your music player, to open your favorite websites or to simulate shortcuts.
It will be available for Windows, Linux and maybe macOS.

# The Vision


I am the developer of [Fly-Pie](https://github.com/Schneegans/Fly-Pie/), which is a similar project but limited to the GNOME desktop.
I have been working on Fly-Pie for more than 3 years now and I am very happy with the result.
However, I have always wanted to create a similar application for the desktop in general.
This is why I started this project.

# The Prototype

This project is currently in a very early stage of development.
I am currently working on a prototype which will allow me to test some of the core concepts.
It currently demonstrates the following features:

|  | Windows | Linux (X11) | Linux (Wayland) |
|--|---------|-------------|-----------------|
| Opening a transparent top-level window | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Listening to global hotkeys | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Drawing something at the mouse position | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Get the name of the currently focused window | :heavy_check_mark:[^1] | :heavy_check_mark:[^2] | :heavy_check_mark: |
| Simulating key presses | :heavy_check_mark:[^1] | :heavy_check_mark:[^2] | :heavy_check_mark: |

[^1]: This is implemented with a native C++ node module which uses the Windows API.
[^2]: This is implemented with a native C++ node module which uses XLib methods.


on Linux and Windows:
- [x] Opening a transparent top-level window.
- [x] Listening to global hotkeys. On Windows and X11 this works with a native node module, on Wayland this requires communication with the compositor. For, this only works on GNOME via a small extension.
- [x] Simulating key presses. Again, this works on Windows and X11, but requires a small extension on Wayland.

## Building the Prototype

You will have to install `node` and `npm`.
You will also need `node-gyp` for building the native backends:

```
npm install -g node-gyp
```

Additionally, you will need a C++ toolchain.
On Linux, this will be installed already.
On Windows, you can install either Visual Studio or run this:


```
npm install -g windows-build-tools
```

Once these dependencies are installed, only these two commands are required:

```
npm install
npm start
```

To create a distributable zip file, just run `npm make`.


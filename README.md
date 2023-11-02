<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <a href="https://www.youtube.com/watch?v=ZTdfnUDMO9k"><img src="docs/img/video.jpg" /></a>
</p>


> [!WARNING]
> This project is currently in a very early stage of development. Kando is not yet a functional menu but rather a prototype which demonstrates the feasibility of the concept. You can read regular updates on the project on [my Ko-fi page](https://ko-fi.com/schneegans).

[![checks](https://github.com/kando-menu/kando/workflows/Checks/badge.svg?branch=main)](https://github.com/kando-menu/kando/actions)
[![reuse](https://api.reuse.software/badge/github.com/kando-menu/kando)](https://api.reuse.software/info/github.com/kando-menu/kando)
[![sponsors](https://gist.githubusercontent.com/Schneegans/2d06edf0937c480951feb86b9e719304/raw/weekly.svg)](https://schneegans.github.io/sponsors/)
[![license](https://img.shields.io/badge/License-MIT-blue.svg?labelColor=303030)](LICENSE.md)

**Kando** will be a pie menu for the desktop.
It will be highly customizable and will allow you to create your own menus and actions.
For instance, you can use it to control your music player, to open your favorite websites or to simulate shortcuts.
It will be available for Windows, Linux and maybe macOS.

# The Vision

I am the developer of [Fly-Pie](https://github.com/Schneegans/Fly-Pie/), which is a similar project but limited to the GNOME desktop.
I have been working on Fly-Pie for more than 3 years now and I am very happy with the result.
However, I have always wanted to create a similar application for the desktop in general.
This is why I started this project.

**Kando is very similar to Fly-Pie in terms of interaction and appearance.
At the same time, there will be some major differences.
You can read more in this [blog post](https://ko-fi.com/post/Introducing-Ken-Do-L3L7L0FQ2)!**

# The Prototype

<p align="center">
  <img src="docs/img/kando.gif"/>
</p>


The prototype already features the same interaction methods as Fly-Pie (point-and-click, marking mode, and turbo mode).

Implementing a menu like Kando is pretty hard on Wayland.
Things like getting the mouse position before opening a window, simulating key presses, or getting the name of the currently focused application window is not easily possible.

Nevertheless, I have managed to implement the prototype for several Wayland-based desktop environments.
I have tested it on the following platforms:

Tested Environment | Status | Notes
:-- | :---: | ---
<img height="14" width="14" src="https://cdn.simpleicons.org/windows" /> Windows 10 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/windows" /> Windows 11 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/apple" /> MacOS | :x: | Not yet supported, but I plan to add support for it in the future.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> GNOME / X11 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> GNOME / Wayland | :heavy_check_mark: | Requires [adapter GNOME Shell extension](https://github.com/kando-menu/gnome-shell-integration) which provides a DBus interface for Kando to communicate with.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> KDE / X11 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> KDE / Wayland | :heavy_check_mark: | Uses the [KWin Scripting API](https://techbase.kde.org/Development/Tutorials/KWin/Scripting) and the [Remote-Desktop Portal](https://flatpak.github.io/xdg-desktop-portal/#gdbus-org.freedesktop.portal.RemoteDesktop) to implement the required functionality.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> XFCE | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> MATE | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Budgie | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Cinnamon | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> LXQt | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> LXDE | :x: | Does not support compositing by default.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Openbox | :x: | Does not support compositing by default.


# :arrow_down: Installation

You can either [download a pre-built package from the releases page](https://github.com/kando-menu/kando/releases) or build the prototype yourself.
With a pre-built package, you can just run the executable; no installation is required.

> [!IMPORTANT]
> If you are using GNOME under Wayland, you will also need to install the [adapter extension](https://github.com/kando-menu/gnome-shell-integration)!

## Manual Compilation

If you want to test the latest development version of the prototype, you will have to install `node` and `npm`.
You will also need `cmake` for building the native backends.
Additionally, you will need a C++ toolchain.

### Windows

On Windows, you can install either Visual Studio or run this:

```
npm install -g windows-build-tools
```

### Linux

On Linux, `gcc` should already be installed.
However, some additional packages may be required for the native backend modules.
On **Debian-based** distributions you can install them with:

```
sudo apt install cmake libx11-dev libxtst-dev libwayland-bin
```

On **Arch-based** distributions you can install them with:

```
sudo pacman -S cmake libx11 libxtst wayland
```

On **RPM-based** distributions you can install them with:

```
sudo dnf install cmake libX11-devel libXtst-devel wayland-devel
```

On GNOME under Wayland you will also need to install the [adapter extension](https://github.com/kando-menu/gnome-shell-integration).

## :rocket: Running the Prototype

Once these dependencies are installed, only these two commands are required:

```
npm install
npm start
```

Once this is running, you can press <kbd>Ctrl</kbd>+<kbd>Space</kbd> to open the test window.

## :package: Creating a Release Executable

To create an executable compiled in release mode, run this: 

```
npm install
npm run package
```

This will create a directory in the `out/` directory containing the `kando` executable.

## :ship: Creating a Distributable Package

To create a distributable archive, just run this:

```
npm install
npm run make
```

This will create several packages in the `out/` directory.
On Windows, it will create a squirrel installer and a portable zip archive.
On Linux, it will create Debian, an RPM and a portable zip archive.

# :revolving_hearts: I want to contribute!

[![kofi](https://img.shields.io/badge/Donate-on_Ko--fi-ff5e5b?logo=ko-fi)](https://ko-fi.com/schneegans)
[![github](https://img.shields.io/badge/Donate-on_GitHub-purple?logo=github)](https://github.com/sponsors/Schneegans)
[![paypal](https://img.shields.io/badge/Donate-on_PayPal-009cde?logo=paypal)](https://www.paypal.com/donate/?hosted_button_id=3F7UFL8KLVPXE)
[![crypto](https://img.shields.io/badge/Donate-some_Crypto-f7931a?logo=bitcoin)](https://schneegans.cb.id)

That's great!
If you like the idea of Kando, you can help in many ways:
* **Discuss the idea!** Tell me what you think about Kando and what features you would like to see. You can do this by [opening a discussion](https://github.com/kando-menu/kando/discussions).
* **Spread the word!** Tell your friends about Kando and share this post on social media.
* **Contribute code!** If you are a developer, you can help me with the implementation. I have never worked with Electron before, so I'm sure there is a lot of room for improvement.

While direct contributions are the most awesome way to support the development, donations will encourage me to invest my spare time for developing free and open-source software.

**These awesome people have already donated to the development of my open-source projects:**

[![Sponsors](https://schneegans.github.io/sponsors/sponsors.svg)](https://schneegans.github.io/sponsors/)

## Credits

This README uses icons from [Simple Icons](https://simpleicons.org/).
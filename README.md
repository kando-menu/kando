<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <img src="docs/img/logo-big.png"/>
</p>


_:construction: This project is currently in a very early stage of development. Kando is not yet a functional menu but rather a prototype which demonstrates the feasibility of the concept. You can read regular updates on the project on [my Ko-fi page](https://ko-fi.com/schneegans)._

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
It currently supports the following platforms:

* Windows
* Linux (X11)
* Linux (GNOME under Wayland)
* Linux (KDE under Wayland)

The X11 backend should work on most X11-based Linux desktop environments, but has been tested only on GNOME and KDE so far.

Implementing a menu like Kando is pretty hard on Wayland due to the client isolation.
Things like getting the mouse position before opening a window, simulating key presses, or getting the name of the currently focused application window is not possible.

For Wayland support on GNOME, I have created a [GNOME Shell extension](https://github.com/kando-menu/gnome-shell-integration) which provides a DBus interface for Kando to communicate with. On KDE, I have used the [KWin Scripting API](https://techbase.kde.org/Development/Tutorials/KWin/Scripting) and the [Remote-Desktop Portal](https://flatpak.github.io/xdg-desktop-portal/#gdbus-org.freedesktop.portal.RemoteDesktop) to implement the required functionality.

With a similar approach, Kando could also be made to work on other Wayland-based desktop environments.

## Installing Dependencies

If you want to test the prototype, you will have to install `node` and `npm`.
You will also need `cmake` for building the native backends.

### Windows

Additionally, you will need a C++ toolchain.
On Windows, you can install either Visual Studio or run this:

```
npm install -g windows-build-tools
```

### Linux

On Linux, `gcc` should already be installed.
However, some additional packages may be required for the native backend modules.
On Debian-based distributions you can install them with:

```
sudo apt install cmake libx11-dev libxtst-dev
```

On GNOME under Wayland you will also need to install the [adapter extension](https://github.com/kando-menu/gnome-shell-integration).

## Running the Prototype

Once these dependencies are installed, only these two commands are required:

```
npm install
npm start
```

Once this is running, you can press <kbd>Ctrl</kbd>+<kbd>Space</kbd> to open the test window.

To create a distributable zip file, just run `npm run make`.



## :octocat: I want to contribute!

That's great!
If you like the idea of Kando, you can help in many ways:
* **Discuss the idea!** Tell me what you think about Kando and what features you would like to see. You can do this by [opening a discussion](https://github.com/kando-menu/kando/discussions).
* **Spread the word!** Tell your friends about Kando and share this post on social media.
* **Contribute code!** If you are a developer, you can help me with the implementation. I have never worked with Electron before, so I'm sure there is a lot of room for improvement.
* **Sponsor the development!** Time is by far the most limiting factor. If you like the idea, you can also support me financially. You can do this either on [Ko-fi](https://ko-fi.com/schneegans) or by [sponsoring me on GitHub](https://github.com/sponsors/Schneegans). **If enough people do this, I will be able to spend much more time on Kando and make it a reality.**

<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <a href="https://www.youtube.com/watch?v=XVu_ea9gpCY"><img src="docs/img/video.jpg" /></a>
</p>

[![checks](https://github.com/kando-menu/kando/workflows/Checks/badge.svg?branch=main)](https://github.com/kando-menu/kando/actions)
[![codeql](https://github.com/kando-menu/kando/workflows/CodeQL/badge.svg)](https://github.com/kando-menu/kando/actions)
[![reuse](https://api.reuse.software/badge/github.com/kando-menu/kando)](https://api.reuse.software/info/github.com/kando-menu/kando)
[![translate](https://hosted.weblate.org/widget/kando/svg-badge.svg)](https://hosted.weblate.org/engage/kando/)
[![downloads](https://img.shields.io/github/downloads/kando-menu/kando/total?label=Downloads)](https://github.com/kando-menu/kando/releases)
[![sponsors](https://gist.githubusercontent.com/Schneegans/2d06edf0937c480951feb86b9e719304/raw/weekly.svg)](https://schneegans.github.io/sponsors/)
[![Discord](https://img.shields.io/discord/1124300911574003732?logo=discord&label=Discord&color=%235865f2)](https://discord.gg/hZwbVSDkhy)
[![docs](https://img.shields.io/badge/Documentation-online-purple.svg?labelColor=303030)](docs/README.md)
[![contributions](https://img.shields.io/badge/🎉_Contributions-welcome-green.svg?labelColor=303030)](https://github.com/kando-menu/kando/issues?q=is%3Aissue+is%3Aopen+label%3A%22contributions+welcome%22)


# What is Kando?

**Kando is a cross-platform pie menu for your desktop.** It offers an unconventional, fast, highly efficient, and fun way of interacting with your computer! You can use Kando to launch applications, simulate keyboard shortcuts, open files, and much more. 

Kando is designed to be used with 🖱️ mouse, 🖊️ stylus, or 👆 touch input. If you have both hands at your keyboard most of the time, Kando is maybe not the right tool for you.

You are welcome to join the 💬 [Discord server](https://discord.gg/hZwbVSDkhy) to discuss the project, ask questions, or just to hang out with other Kando enthusiasts!

<p align="center">
  <img src="docs/img/kando.gif"/>
</p>


## Platform Support

Implementing a menu like Kando in a cross-platform manner is not exactly easy.
Things like getting the mouse position before opening a window, simulating key presses, or getting the name of the currently focused application window has to be implemented differently on each platform.

For now, Kando has been tested on the following platforms:

Tested Environment | Status | Notes
:-- | :---: | ---
<img height="14" width="14" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Windows_logo_-_2021_%28Black%29.svg" /> Windows | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/apple" /> macOS | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> GNOME / X11 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> GNOME / Wayland | :heavy_check_mark: | Requires [adapter GNOME Shell extension](https://github.com/kando-menu/gnome-shell-integration) which provides a DBus interface for Kando to communicate with.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> KDE / X11 | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> KDE / Wayland | :heavy_check_mark: | Works both on Plasma 5 and Plasma 6. See [platform-specific notes](docs/installing.md#platform-specific-notes) for some details.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Hyprland | :heavy_check_mark: | See [platform-specific notes](docs/installing.md#platform-specific-notes) for some details.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Cinnamon | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> XFCE | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> MATE | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Budgie | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> LXQt | :heavy_check_mark: |
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> LXDE | :heavy_check_mark: | Requires a compositor for the transparency to work.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> Openbox | :heavy_check_mark: | Requires a compositor for the transparency to work.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> i3 | :heavy_check_mark: | Requires a compositor for the transparency to work.
<img height="14" width="14" src="https://cdn.simpleicons.org/linux/black" /> dusk | :heavy_check_mark: | Requires a compositor for the transparency to work. See [platform-specific notes](docs/installing.md#platform-specific-notes) for some details.


# :package: Installation

You can either download a prebuilt binary or compile Kando yourself.
For both approaches there are instructions available in the [:memo: Installation Guide](docs/installing.md).

# :rocket: Getting Started

Kando comes with an example menu which you can open by pressing <kbd>Ctrl</kbd>+<kbd>Space</kbd> on most platforms.
This is great to get a first impression!
To learn some basics about the interaction with Kando, you can have a look at the [:memo: Usage Guide](docs/getting-started.md).

Once you are familiar with the basics, you can start creating your own menus.
Learn how to create your own menus in the [:memo: Configuration Guide](docs/configuring.md)!

# :revolving_hearts: I want to contribute!

**I am creating Kando out of sheer passion.** It is completely free, and I am not planning to monetize it in any way.
But I would be very happy if you could support the project with creative ideas, code contributions, or by sharing it with your friends and followers! 💖

There are always some open issues labeled as [good first issue](https://github.com/kando-menu/kando/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) which are a great starting point for new contributors.
Just drop a comment if you want to work on one of these issues, and we can discuss the details!

While direct contributions are the most awesome way to support the development, **donations will encourage me to invest my spare time for developing free and open-source software**.

[![kofi](https://img.shields.io/badge/Donate-on_Ko--fi-ff5e5b?logo=ko-fi)](https://ko-fi.com/schneegans)
[![github](https://img.shields.io/badge/Donate-on_GitHub-purple?logo=github)](https://github.com/sponsors/Schneegans)
[![paypal](https://img.shields.io/badge/Donate-on_PayPal-009cde?logo=paypal)](https://www.paypal.com/donate/?hosted_button_id=3F7UFL8KLVPXE)
[![crypto](https://img.shields.io/badge/Donate-some_Crypto-f7931a?logo=bitcoin)](https://schneegans.cb.id)


**These awesome people have already donated to the development of my open-source projects:**

<a href="https://schneegans.github.io/sponsors/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://schneegans.github.io/sponsors/sponsors_dark_small.svg">
    <img alt="Sponsors List" src="https://schneegans.github.io/sponsors/sponsors_light_small.svg#gh-light-mode-only">
  </picture>
</a>

## Credits

This README uses icons from [Simple Icons](https://simpleicons.org/).

<p align="center"><img src ="docs/img/hr.svg" /></p>

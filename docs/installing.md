<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<img src="img/banner05.jpg"></img>

# Installing Kando

You have two options to install Kando.
You can either download a pre-built package from the releases page or compile Kando yourself.

## a) Downloading a Release

This is the easiest way to get Kando.
Just head over to the [releases page](https://github.com/kando-menu/kando/releases) and download the latest version for your platform.
You can either download a portable zip archive or an installer.

If you choose the portable version, you can just extract the archive and run the `kando` executable.
If you choose the installer, you will find Kando in your start menu after the installation.

### Running Kando from the Command Line

If you installed Kando with an installer, you can just run it from the start menu.
However, sometimes it is useful to run Kando from the command line in order to see the output of the application.
Depending on your platform, the `kando` executable will be located in different directories:

* <img height="14" width="26" src="https://cdn.simpleicons.org/windows" /> Windows: `%localappdata%\Kando\app-<version number>\Kando.exe`
* <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS: `/Applications/Kando.app/Contents/MacOS/Kando`
* <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux: `/usr/bin/kando`

## b) Manual Installation

If you want to test the latest development version of the prototype, you will have to install `node` and `npm`.
You will also need `cmake` for building the native backends.
Additionally, you will need a C++ toolchain.

---

<details>
<summary><img height="14" width="26" src="https://cdn.simpleicons.org/windows" /> Windows Dependencies</summary>

On Windows, you can install either Visual Studio or run this to get the build tools:

```
npm install -g windows-build-tools
```

To get `node` and `npm`, you can follow the [official instructions](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

</details>

---

<details>
<summary><img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS Dependencies</summary>

On macOS, you will need the Xcode Commandline Tools and CMake.
The latter can easily be installed with [Homebrew](https://brew.sh/):

```
brew install cmake
```

To get `node` and `npm`, you can use [nvm](https://github.com/nvm-sh/nvm).

</details>

---

<details>
<summary><img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux Dependencies</summary>

On Linux, `gcc` should already be installed.
However, some additional packages may be required for the native backend modules.
On **Debian-based** distributions you can install them with:

```
sudo apt install nodejs cmake libx11-dev libxtst-dev libwayland-dev libxkbcommon-dev
```

On **Arch-based** distributions you can install them with:

```
sudo pacman -S nodejs npm cmake libx11 libxtst wayland libxkbcommon
```

On **RPM-based** distributions you can install them with:

```
sudo dnf install nodejs cmake libX11-devel libXtst-devel wayland-devel libxkbcommon-devel
```

On GNOME under Wayland you will also need to install the [adapter extension](https://github.com/kando-menu/gnome-shell-integration).
</details>

---

### :rocket: Running the Prototype

Once these dependencies are installed, navigate into the Kando directory, then only these two commands are required:

```
npm install
npm start
```

Once this is running, you can press <kbd>Ctrl</kbd>+<kbd>Space</kbd> to open the test window.

### :package: Creating a Release Executable

To create an executable compiled in release mode, run this: 

```
npm install
npm run package
```

This will create a directory in the `out/` directory containing the `kando` executable.

### :ship: Creating a Distributable Package

To create a distributable archive, just run this:

```
npm install
npm run make
```

This will create several packages in the `out/` directory.
* On Windows, it will create a Squirrel installer and a portable zip archive.
* On Linux, it will create Debian, an RPM and a portable zip archive.
* On macOS, it will create a DMG file and a portable zip archive. If the environment variables `KANDO_OSX_SIGN` and `KANDO_OSX_NOTARIZE` are set to `true`, the build process will try to sign and notarize the application.

<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <a href="contributing.md"><img src ="img/left-arrow.png"/> Contribution Guidelines</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <a href="configuring.md">Configuring Kando <img src ="img/right-arrow.png"/></a>
</p>

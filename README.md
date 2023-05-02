<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<p align="center">
  <a href="https://www.youtube.com/watch?v=ZHMboQq8Z5c"><img src ="docs/img/logo-big.png" /></a>
</p>

<h1 align="center">A Cross-Platform Pie Menu</h1>

_:construction: Ken-Do is currently in a very early stage of development. For now, I use this repository mainly for testing things. You can read regular updates on the project on [my Ko-fi page](https://ko-fi.com/schneegans)._

## Building

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
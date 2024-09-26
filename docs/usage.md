<!--
SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
SPDX-License-Identifier: CC-BY-4.0
-->

<img src="img/banner08.png"></img>

# Using Kando

Kando comes with a small example menu which you can use to get started.
However, you should soon [configure your own menu](configuring.md) to make the most out of Kando.


## 🚀 Starting Kando for the First Time

When you launch Kando, nothing will happen at first.
You will only see a small icon in the system tray.
However, on most platforms, you can open an example menu by pressing <kbd>Ctrl</kbd> + <kbd>Space</kbd>.

There are some exceptions where this will not work.
See the [platform-specific installation notes](installing.md#platform-specific-notes) for details.
It can also happen that the shortcut is already used by another application.
In this case, you can use the tray icon to open the settings and change the shortcut of the example menu.

## 💡 The Idea of Kando

<a href="https://www.youtube.com/watch?v=elHUCarOiXQ">
<img align="right" width="500px" src="img/player12.jpg"></img>
</a>

Kando uses [Fitts's Law](https://en.wikipedia.org/wiki/Fitts%27s_law) to make menu navigation as fast as possible.
You do not have to aim at the items you want to select, but you can click anywhere in the wedge of an item.

In additions, Kando is a _marking menu_ (which were [described first about 30 years ago by Gordon Kurtenbach](https://www.research.autodesk.com/app/uploads/2023/03/the-design-and-evaluation.pdf_recHpUp1v9dc1n2CJ.pdf)).
As such it allows you to select items by drawing zig-zag lines. This is extremely powerful!
**You can select things in subsubsubmenus in well below a second without looking at your screen!**

You can watch the video on the right to get an idea of how fast you can navigate through a menu with Kando.

However, people are different and so are their preferences.
Therefore, Kando comes with options like the **"Centered Mode"** or the **"Anchored Mode"** which change this default behavior.
Especially on smaller touch screens, these options may be beneficial, however, they will degrade your selection speed in most cases.

**Therefore, we recommend to learn the default behavior first and only change it if you are really sure that it is not working for you. It may take some time to get used to it, but it is worth it!** You will be surprised how fast you _can do_ something after you mastered it! 🍰🚀

At first, you will probably use the point-and-click method.
Once you get more comfortable with Kando, you can try the marking mode, and even the turbo mode.

| Navigation Method | Example |
| --- | --- |
| **Point and Click:** The most basic approach for selecting items is by clicking at them. Although you do not have to click directly at the item, anywhere in the item's wedge will do! <br><br> This can make selections very fast as you **do not have to aim carefully**. | <video src="https://github.com/kando-menu/kando/assets/829942/ccb9f5df-cc9e-4dd4-ac07-e37ebf797699"> |
| **Navigating Back:** If you entered a submenu by accident, you can always go back by selecting the parent item. It is only possible to go back one level at a time! <br><br> Alternatively, you can also **click in the center of the current submenu** to quickly go up one level. | <video src="https://github.com/kando-menu/kando/assets/829942/16d84e85-a90b-4225-b354-75b1ba68b593">  |
| **Marking Mode:** With Kando, you can select items by drawing gestures! To do so, simply press your left mouse button, and drag over an item. You will move the item around, until you stop the movement or make a sharp turn. Try to remember the path to an item and draw it without looking much at the menu! You will be surprised how quickly you can select items which are deeply nested in the menu. <br><br> **For successful selections, it is better to draw expressive zig-zag lines instead of shy and curvy lines :smiley:** | <video src="https://github.com/kando-menu/kando/assets/829942/bb0e0041-b599-4493-a7b1-7c39103d19cb"> |
| **Turbo Mode:** If you opened the menu using a key combination, you can keep a key pressed. If you do so, the menu will behave as if the left mouse button is pressed, and you can easily browse through the menu without having to click anywhere. Once you release the key, the currently dragged item will be selected. **This allows you to make even faster selections!** <br><br> Turbo-Mode works best with <kbd>Ctrl</kbd>, <kbd>Shift</kbd>, <kbd>Alt</kbd>, or <kbd>Meta</kbd>. For all other keys there will be a short delay until Turbo-Mode kicks in. If this delay is too long for your liking, you can hit the key quickly twice - this way Kando will get the key-down event faster and Turbo-Mode will work right out of the box! | <video src="https://github.com/kando-menu/kando/assets/829942/8f56791e-f9ae-4af1-85a4-cf33da15af65"> |
| **Exploring Items:** Kando will never select a menu item as long as a mouse button (or a keyboard key in _Turbo Mode_) is pressed. This means, as long as you keep the button or the key pressed, you can explore the menu! | <video src="https://github.com/kando-menu/kando/assets/829942/798b6d27-dabf-412f-96aa-5def20854ecc"> |

## 🖊️🖱️ Opening Menus without the Keyboard

There are currently three ways for opening menus in Kando: by pressing a **key combination**, by using the **tray icon**, or by using the `--menu "menu name"` **command line** argument.

While Kando does not have a cross-platform way to open menus with a mouse button, there are many platform-dependent third-party tools which can help you with this.
With some creativity, you can open menus not only with mouse buttons but also with gestures, desktop widgets, or in many other ways.

So you can either make the third-party tool open the menu by simulation the shortcut for the menu, or it can directly call the Kando executable with the `--menu "menu name"` argument.

* <img height="14" width="26" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Windows_logo_-_2021_%28Black%29.svg" /> Windows: `%localappdata%\Kando\app-<version number>\Kando.exe --menu "Menu Name"`
* <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS: `/Applications/Kando.app/Contents/MacOS/Kando --menu "Menu Name"`
* <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux: `/usr/bin/kando --menu "Menu Name"`

Below are some applications which can help you to open menus in various ways.
If you discovered a cool new way to open menus, please let us know! You can either open an issue, open a pull request, or join the [Discord server](https://discord.gg/hZwbVSDkhy) to discuss your idea!

### <img height="14" width="26" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Windows_logo_-_2021_%28Black%29.svg" /> Windows

* [AutoHotkey](https://www.autohotkey.com/) is a powerful scripting language for Windows. You can use it to run the kando command when you press a mouse button or to remap a mouse button to a keyboard shortcut which opens a Kando menu.
* [GestureSign](https://www.microsoft.com/store/productId/9N45WQVK2QQW?ocid=pdpshare) allows opening a Kando menu with multi-touch taps and gestures on both touchpad and touchscreen.

### <img height="14" width="26" src="https://cdn.simpleicons.org/apple" /> macOS

* [Karabiner-Elements](https://karabiner-elements.pqrs.org/) can be used to remap mouse buttons to keyboard shortcuts.
* [BetterTouchTool](https://folivora.ai/) allows opening a Kando menu via touchpad gestures.
* [BetterMouse](https://better-mouse.com/) is a tool which allows you to remap mouse buttons to keyboard shortcuts.

### <img height="14" width="26" src="https://cdn.simpleicons.org/linux/black" /> Linux

* [Input Remapper](https://github.com/sezanzeb/input-remapper) is a tool which allows you to remap mouse buttons to keyboard shortcuts. It works both on **X11 and Wayland**.
* [Touchegg](https://github.com/JoseExposito/touchegg#readme) is a multitouch gesture recognizer for Linux. You can use it to open a Kando menu with touchpad gestures. It only works on **X11**.
* **KDE Plasma** comes with built-in support for remapping mouse buttons to keyboard shortcuts. You can find [this feature](https://www.phoronix.com/news/KDE-Rebind-Extra-Mouse-Buttons) in the system settings under "System Settings" / "Mouse & Touchpad" / "Add Binding".
* There's a [Configurable Button](https://store.kde.org/p/1297839/) widget for **KDE Plasma** which allows running `kando --menu "menu name"` when clicked.
* On **GNOME Shell**, you can use the [CHC-E (Custom Hot Corners - Extended)](https://extensions.gnome.org/extension/4167/custom-hot-corners-extended/) extension to run arbitrary commands when you move your mouse to a corner of the screen.

<p align="center"><img src ="img/hr.svg" /></p>

<p align="center">
  <img src="img/nav-space.svg"/>
  <a href="installing.md"><img src ="img/left-arrow.png"/> Installing Kando</a>
  <img src="img/nav-space.svg"/>
  <a href="README.md"><img src ="img/home.png"/> Index</a>
  <img src="img/nav-space.svg"/>
  <a href="configuring.md">Configuring Kando <img src ="img/right-arrow.png"/></a>
  <img src="img/nav-space.svg"/>
</p>

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from "electron";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
  throw "";
}

// Prevent multiple instances of the app. In the future, we may want to show the
// preferences window instead.
// app.on('second-instance', (event, commandLine, workingDirectory) => {});
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  throw "";
}

// Start the app.
import kendo = require("./app");
const kenDo = new kendo.KenDoApp();

app
  .whenReady()
  .then(() => kenDo.init())
  .then(() => console.log("Ken-Do is ready!"))
  .catch((err) => {
    console.error("Failed to initialize Ken-Do: " + err);
    app.quit();
  });

app.on("will-quit", async () => {
  await kenDo.quit();
  console.log("Good-Pie :)");
});

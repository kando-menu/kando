//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';
import { program } from 'commander';
import i18next from 'i18next';
import i18Backend from 'i18next-fs-backend/cjs';

/**
 * This file is the main entry point for Kando's host process. It is responsible for
 * handling the lifecycle of the app. The drawing of the menu and the editor is done in
 * the renderer process (see renderer.ts).
 */

/** This interface is used to pass command line arguments to the app. */
interface CLIOptions {
  // This optional parameter is specified using the --menu option. It is used to show a
  // menu when the app or a second instance of the app is started.
  menu?: string;

  // This optional parameter is specified using the --settings option. It is used to show
  // the menu editor when the app or a second instance of the app is started.
  settings?: boolean;

  // This optional parameter is specified using the --reload-menu-theme option. It is used
  // to reload the current menu theme from disk.
  reloadMenuTheme?: boolean;

  // This optional parameter is specified using the --reload-sound-theme option. It is
  // used to reload the current sound theme from disk.
  reloadSoundTheme?: boolean;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0);
}

// Parse command line arguments.
program
  .name('kando')
  .description('The cross-platform pie menu.')
  .version(app.getVersion())
  .option('-m, --menu <menu>', 'show the menu with the given name')
  .option('-s, --settings', 'show the menu editor')
  .option('--reload-menu-theme', 'reload the current menu theme from disk')
  .option('--reload-sound-theme', 'reload the current sound theme from disk')
  .allowUnknownOption(true)
  .allowExcessArguments(true);

program.parse();
const options = program.opts() as CLIOptions;

// Prevent multiple instances of the app. If an instance of the app is already running,
// we just quit this one and let the other instance handle the command line arguments.
const gotTheLock = app.requestSingleInstanceLock(options);
if (!gotTheLock) {
  // Print a short message and exit. The running instance will get notified and will also
  // show a corresponding desktop notification.
  if (!options.menu && !options.settings && !options.reloadMenuTheme) {
    console.log(
      'Kando is already running. Use --help for a list of commands to communicate with the running instance!'
    );
  }
  app.quit();
  process.exit(0);
}

// Start the app. We import the KandoApp class here to make the code above as fast as
// possible.
import { KandoApp } from './main/app';
import path from 'path';

// It is not very nice that electron stores all its cache data in the user's config
// directory. Until https://github.com/electron/electron/pull/34337 is merged, we
// move most of the stuff to a separate directory to make it easier to clean up.
app.setPath('sessionData', path.join(app.getPath('sessionData'), 'session'));
app.setPath('crashDumps', path.join(app.getPath('sessionData'), 'crashDumps'));
app.setAppLogsPath(path.join(app.getPath('sessionData'), 'logs'));

// Create the app and initialize it as soon as electron is ready.
const kando = new KandoApp();

// This function is called when the app or a second instance is started with command line
// arguments. It returns true a option was passed that was handled by the app.
const handleCommandLine = (options: CLIOptions) => {
  if (options.menu) {
    kando.showMenu({
      trigger: '',
      name: options.menu,
    });
    return true;
  }

  if (options.settings) {
    kando.showEditor();
    return true;
  }

  if (options.reloadMenuTheme) {
    kando.reloadMenuTheme();
    return true;
  }

  return false;
};

app
  .whenReady()
  .then(() => {
    return i18next.use(i18Backend).init({
      lng: app.getLocale(),
      fallbackLng: {
        /* eslint-disable @typescript-eslint/naming-convention */
        'en-US': ['en'],
        'en-GB': ['en'],
        'de-DE': ['de', 'en'],
        'de-CH': ['de', 'en'],
        'de-AT': ['de', 'en'],
        'zh-CN': ['zh-Hans', 'en'],
        zh: ['zh-Hans', 'en'],
        pt: ['pt-BR', 'en'],
        /* eslint-enable @typescript-eslint/naming-convention */
        default: ['en'],
      },
      backend: {
        loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
      },
    });
  })
  .then(() => kando.init())
  .then(() => {
    // Save some settings when the app is closed.
    app.on('before-quit', () => {
      kando.saveSettings();
    });

    // Show a nifty message when the app is about to quit.
    app.on('will-quit', async () => {
      await kando.quit();
      console.log('Good-Pie :)');
    });

    // Show the menu passed via --menu when a second instance is started.
    app.on('second-instance', (e, argv, pwd, options: CLIOptions) => {
      // If no option was passed, we show the settings.
      if (!handleCommandLine(options)) {
        kando.showEditor();
      }
    });

    // Show a message that the app is ready.
    console.log(`Kando ${app.getVersion()} is ready.`);

    // Finally, handle the command line arguments (if any).
    handleCommandLine(options);
  })
  .catch((error) => {
    KandoApp.showError(i18next.t('main.failed-to-start-header'), error.message);
    app.quit();
    process.exitCode = 1;
  });

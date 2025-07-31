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

/**
 * This file is the main entry point for Kando's host process. It is responsible for
 * handling the lifecycle of the app. The drawing of the menu and the settings is done in
 * the renderer process (see renderer.ts).
 */

/** This interface is used to pass command line arguments to the app. */
interface CLIOptions {
  // This optional parameter is specified using the --menu option. It is used to show a
  // menu when the app or a second instance of the app is started.
  menu?: string;

  // This optional parameter is specified using the --settings option. It is used to show
  // the settings when the app or a second instance of the app is started.
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
  .option('-s, --settings', 'show the settings')
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
import path from 'path';
import i18next from 'i18next';
import i18Backend from 'i18next-fs-backend/cjs';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import { Notification } from './utils/notification';
import { KandoApp } from './app';

// It is not very nice that electron stores all its cache data in the user's config
// directory. Until https://github.com/electron/electron/pull/34337 is merged, we
// move most of the stuff to a separate directory to make it easier to clean up.
app.setPath('sessionData', path.join(app.getPath('sessionData'), 'session'));
app.setPath('crashDumps', path.join(app.getPath('sessionData'), 'crashDumps'));
app.setAppLogsPath(path.join(app.getPath('sessionData'), 'logs'));

// Set deep link support for the app. This is used to send commands to the app when the
// app is already running. For instance like this: kando://menu?name=<menuName>.
let deepLinkSupport = false;
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    deepLinkSupport = app.setAsDefaultProtocolClient('kando', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  deepLinkSupport = app.setAsDefaultProtocolClient('kando');
}

if (!deepLinkSupport) {
  console.error('Failed to register kando:// protocol. Deep links will not work.');
}

// Create the app and initialize it as soon as electron is ready.
const kando = new KandoApp();

// Performs actions based on the command line arguments passed to the app. It returns true
// a option was passed that was handled by the app.
const handleCommandLine = (options: CLIOptions) => {
  if (options.menu) {
    kando.showMenu({ name: options.menu });
    return true;
  }

  if (options.settings) {
    kando.showSettings();
    return true;
  }

  if (options.reloadMenuTheme) {
    kando.reloadMenuTheme();
    return true;
  }

  if (options.reloadSoundTheme) {
    kando.reloadSoundTheme();
    return true;
  }

  return false;
};

// This function is called when the app or a second instance is started with command line
// arguments or via a deep link. The deep link takes precedence over the command line
// arguments if both are present. The last boolean parameter is used to determine if the
// settings should be shown if no command line arguments were passed.
const handleArguments = (
  commandLine: CLIOptions | null,
  deepLink: string | null,
  showSettingsIfEmpty: boolean
) => {
  if (deepLink && deepLink.startsWith('kando://')) {
    const parsedUrl = new URL(deepLink);
    const options = {
      menu: parsedUrl.host === 'menu' && parsedUrl.searchParams.get('name'),
      settings: parsedUrl.host === 'settings',
      reloadMenuTheme: parsedUrl.host === 'reload-menu-theme',
      reloadSoundTheme: parsedUrl.host === 'reload-sound-theme',
    };

    if (!handleCommandLine(options)) {
      Notification.showError(
        i18next.t('main.invalid-link-header'),
        i18next.t('main.invalid-link-message')
      );
    }

    return;
  }

  if (commandLine) {
    if (!handleCommandLine(commandLine) && showSettingsIfEmpty) {
      kando.showSettings();
    }
  }
};

app
  .whenReady()
  .then(() => {
    if (process.env.NODE_ENV === 'development') {
      return installExtension(REACT_DEVELOPER_TOOLS);
    }
  })
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
    // Show a nifty message when the app is about to quit.
    app.on('will-quit', async () => {
      await kando.quit();
      console.log('Good-Pie :)');
    });

    // Respond to commandline arguments passed to a second instance. On Windows and Linux
    // this is also called when the app is opened via a deep link. In this case, the last
    // argument is the deep link.
    app.on('second-instance', (e, argv, pwd, options: CLIOptions) => {
      handleArguments(options, argv[argv.length - 1], true);
    });

    // Handle the case when the app is opened via a deep link. This is only called on
    // macOS, on Windows and Linux deep links are handled by the second-instance event.
    app.on('open-url', (e, url) => {
      handleArguments(null, url, false);
    });

    // Prevent the app from quitting when all windows are closed.
    app.on('window-all-closed', () => {});

    // Show a message that the app is ready.
    console.log(`Kando ${app.getVersion()} is ready.`);

    // Finally, handle the command line arguments (if any). If the app was started via a
    // deep link, the last argument is a deep link. In this case, we parse it and use
    // this instead of the command line arguments.
    handleArguments(options, process.argv[process.argv.length - 1], false);
  })
  .catch((error) => {
    Notification.showError(
      i18next.t('main.failed-to-start-header'),
      error.message || error
    );
    app.quit();
    process.exitCode = 1;
  });

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

import { CommandlineOptions } from '../common';

/**
 * This file is the main entry point for Kando's host process. It is responsible for
 * handling the lifecycle of the app. The drawing of the menu and the settings is done in
 * the renderer process (see src/menu-render/index.ts and src/settings-render/index.ts
 * respectively).
 */

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0);
}

// Parse command line arguments.
const options = program
  .name('kando')
  .description('The cross-platform pie menu.')
  .version(app.getVersion())
  .option('-m, --menu <menu>', 'show the menu with the given name')
  .option('-s, --settings', 'show the settings')
  .option('--reload-menu-theme', 'reload the current menu theme from disk')
  .option('--reload-sound-theme', 'reload the current sound theme from disk')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .parse()
  .opts() as CommandlineOptions;

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

// Start the app. We import the KandoApp class and other modules here to make the code
// above as fast as possible.
import fs from 'fs';
import path from 'path';
import i18next from 'i18next';
import i18Backend from 'i18next-fs-backend/cjs';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import { Notification } from './utils/notification';
import { getBackend } from './backends';
import { KandoApp } from './app';
import { getGeneralSettings, getMenuSettings } from './settings';

// Initialize the notification system. This will queue notifications until the app is
// ready so that we can even show notifications before the app is fully initialized. This
// is necessary because for instance loading the settings can lead to errors which we want
// to show to the user.
Notification.init();

/**
 * Shows a startup-error notification and quits the app.
 *
 * @param message The message shown in the notification body.
 */
function quitWithError(message: string) {
  Notification.show({ title: 'Kando failed to start', type: 'error', message });
  app.quit();
  process.exitCode = 1;
}

try {
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

  // Choose the backend to use. We quit the app if no backend is found.
  const backend = getBackend();
  if (!backend) {
    throw new Error('No suitable backend was found.');
  }

  // We load the menu settings from the user's home directory.
  const generalSettings = getGeneralSettings();
  if (!generalSettings) {
    throw new Error('Failed to load general settings. See console output for details.');
  }

  const menuSettings = getMenuSettings(
    generalSettings.get('ignoreWriteProtectedConfigFiles')
  );
  if (!menuSettings) {
    throw new Error('Failed to load menu settings. See console output for details.');
  }

  // Disable hardware acceleration if the user has set this in the settings.
  if (generalSettings.get('hardwareAcceleration') === false) {
    console.log('Hardware acceleration disabled');
    app.disableHardwareAcceleration();
  }

  // We ensure that the themes directories exist. If they do not exist, we create them.
  try {
    const themeDirs = ['menu-themes', 'sound-themes', 'icon-themes'];
    themeDirs.forEach((dir) => {
      fs.mkdirSync(path.join(app.getPath('userData'), dir), { recursive: true });
    });
  } catch (error) {
    if (
      (error.code === 'EROFS' || error.code === 'EACCES' || error.code === 'EPERM') &&
      !generalSettings.get('ignoreWriteProtectedConfigFiles')
    ) {
      console.log('Failed to create the themes folders due to write-protected files.');
    } else {
      console.warn('An unexpected error occurred while creating theme folders:', error);
    }
  }

  // Create the app. We will initialize it later when the Electron app is ready.
  const kando = new KandoApp(backend, generalSettings, menuSettings);

  // This function is called when the app or a second instance is started with command line
  // arguments or via a deep link. The deep link takes precedence over the command line
  // arguments if both are present. The last boolean parameter is used to determine if the
  // settings should be shown if no command line arguments were passed.
  const handleArguments = (
    commandLine: CommandlineOptions | null,
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

      if (!kando.handleCommandLine(options)) {
        Notification.show({
          title: i18next.t('main.invalid-link-header'),
          message: i18next.t('main.invalid-link-message'),
        });
      }

      return;
    }

    if (commandLine && !kando.handleCommandLine(commandLine) && showSettingsIfEmpty) {
      kando.showSettings();
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
      const locale = generalSettings.get('locale');
      return i18next.use(i18Backend).init({
        lng: locale === 'auto' ? app.getLocale() : locale,
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
    .then(() => backend.init())
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
      app.on('second-instance', (e, argv, pwd, options: CommandlineOptions) => {
        handleArguments(options, argv[argv.length - 1], true);
      });

      // This is called when the app is activated, for example when the user clicks on the
      // app in the launchpad of macOS. We show the settings.
      app.on('activate', () => {
        kando.showSettings();
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
    .catch((error) => quitWithError(error instanceof Error ? error.message : error));
} catch (error) {
  app
    .whenReady()
    .then(() => quitWithError(error instanceof Error ? error.message : error));
}

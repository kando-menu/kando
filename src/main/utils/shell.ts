//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import childProcess from 'child_process';
import * as os from 'os';

let systemdRunAvailable: boolean | undefined = undefined;

/**
 * Checks whether the system allows creating isolated processes. Currently this is only
 * supported on Linux with systemd. Feel free to extend this function if you want to
 * support this feature on platforms without systemd.
 */
export function supportsIsolatedProcesses(): boolean {
  if (systemdRunAvailable === undefined) {
    // Check if systemd-run is available by trying to spawn it.
    try {
      let command = 'systemd-run --version';

      if (process.env.container && process.env.container === 'flatpak') {
        command = 'flatpak-spawn --host ' + command;
      }

      childProcess.execSync(command, { stdio: 'ignore' });
      systemdRunAvailable = true;
    } catch (error) {
      console.debug(
        "System command 'systemd-run' is not available. Isolated processes will not be supported."
      );
      systemdRunAvailable = false;
    }
  }

  return systemdRunAvailable;
}

/**
 * Runs the given command. If executed inside a flatpak container, it will use
 * `flatpak-spawn` to run the command on the host system. If `options.isolate` is set, it
 * will try to use `systemd-run` to run the command in an isolated environment.
 *
 * If a command returns a non-zero exit code, the promise will be rejected with the error
 * output of the command.
 *
 * If `options.detach` is set, the command will be executed in a detached process. This
 * means that the process will be killed when Kando is closed. To get an estimate whether
 * the command succeeded it will asynchronously wait for one second to see if the command
 * finishes with an non-zero exit code. If it does, the promise will be rejected. Else it
 * will assume that the command was started successfully and resolve the promise. So if an
 * error occurs after one second, it will not be detected.
 *
 * @returns A promise which resolves when the command has been successfully started (or
 *   one second passed without an error in detached mode).
 */
export async function exec(
  command: string,
  options: { detach?: boolean; isolate?: boolean }
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Remove the CHROME_DESKTOP environment variable if it is set.
    // See https://github.com/kando-menu/kando/issues/552
    const env = { ...process.env };
    delete env.CHROME_DESKTOP;

    // Isolated processes are only supported on Linux with systemd for now.
    if (options.isolate && supportsIsolatedProcesses()) {
      command = 'systemd-run --user --pty --quiet ' + command;
    }

    // If we are inside a flatpak container, we cannot execute commands directly on the host.
    // Instead we need to use flatpak-spawn.
    if (env.container && env.container === 'flatpak') {
      command = 'flatpak-spawn --host ' + command;
    }

    // Explicitly check for false to allow undefined to mean true.
    if (options.detach === false) {
      childProcess.exec(
        command,
        {
          env,
          cwd: os.homedir(),
        },
        (error) => {
          if (error) {
            reject(error.message);
          } else {
            resolve();
          }
        }
      );

      return;
    }

    // We are only interested in a potential error output.
    const stdio: childProcess.StdioOptions = ['ignore', 'ignore', 'pipe'];

    const child = childProcess.spawn(command, [], {
      env,
      cwd: os.homedir(),
      shell: true,
      detached: true,
      stdio,
    });

    let resolved = false;
    let errorOutput = '';

    // We set a timeout of one second. If the process does not exit within this time,
    // we assume that it was started successfully and resolve the promise.
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.unref();
        resolve();
      }
    }, 1000);

    // We collect the error output of the process.
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // If the process exits within the timeout, we either resolve or reject the promise
    // based on the exit code.
    child.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        resolved = true;
        if (code !== 0) {
          reject(errorOutput);
        } else {
          resolve();
        }
      }
    });
  });
}

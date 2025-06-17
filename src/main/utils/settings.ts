//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import lodash from 'lodash';

import os from 'os';
import { Notification } from 'electron';

/**
 * This type is used to define all possible events which can be emitted by the
 * PropertyChangeEmitter class below.
 */
type PropertyChangeEvents<T> = {
  [K in keyof T]: (newValue: T[K], oldValue: T[K]) => void;
};

/**
 * This type is used to make all properties of an object readonly. It is used to make sure
 * that the settings object cannot be modified from outside of the class except through
 * the `set()` method.
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 * This class is used to emit events when a property of the Settings object changes. The
 * main purpose of this class is to provide type safety when connecting to events: The
 * `onChange()` method only accepts keys from `T` and the listener function must take two
 * values which correspond to the values of the given key in `T`.
 *
 * @template T The type of the object which contains the properties.
 */
class PropertyChangeEmitter<T> {
  private propertyListeners: Partial<
    Record<keyof T, Array<PropertyChangeEvents<T>[keyof T]>>
  > = {};

  /**
   * Connects the given listener to the given key. The listener will be called whenever
   * the given event is emitted.
   *
   * @param key The key to listen to. This must be a key of `T`.
   * @param listener The listener function which will be called when the event is emitted.
   *   The function must take two arguments of the same type as the property corresponding
   *   to the given key. The first argument is the new value, the second argument is the
   *   old value.
   */
  public onChange<K extends keyof T>(key: K, listener: PropertyChangeEvents<T>[K]) {
    if (!this.propertyListeners[key]) {
      this.propertyListeners[key] = [];
    }

    this.propertyListeners[key].push(listener);
  }

  /**
   * Disconnects the given listener from the given event. The listener will no longer be
   * called when the event is emitted.
   *
   * @param key The key to disconnect from. This must be a key of `T`.
   * @param listener The listener function to disconnect.
   */
  public disconnect<K extends keyof T>(key: K, listener: PropertyChangeEvents<T>[K]) {
    const listeners = this.propertyListeners[key];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  /** Disconnects all listeners from all propertyListeners. */
  public disconnectAll() {
    this.propertyListeners = {};
  }

  /**
   * Emits the listeners for the given key. This will call all listeners which are
   * connected to the given event. It is called automatically by the `set()` method of the
   * Settings class.
   *
   * @param key The key to emit an event for. This must be a key of `T`.
   * @param newValue The new value of the property.
   * @param oldValue The old value of the property.
   */
  protected emit<K extends keyof T>(key: K, newValue: T[K], oldValue: T[K]) {
    const listeners = this.propertyListeners[key];
    if (listeners) {
      listeners.forEach((listener) => listener(newValue, oldValue));
    }
  }
}

/**
 * The options object which can be passed to the constructor. See documentation of the
 * Settings class below for details.
 */
interface Options<T> {
  file: string;
  directory: string;
  defaults: T;
}

/**
 * This class can be used to persistently store user settings. The settings are stored in
 * a JSON file the user's config directory. The settings are loaded when the class is
 * instantiated and are automatically saved when the `set()` method is called.
 * Additionally, the class emits events when a setting changes.
 *
 * @example
 *   ```ts
 *   const settings = new Settings({defaults: { foo: 'bar' }});
 *
 *   settings.onChange('foo', (newValue, oldValue) => {
 *   console.log(`foo changed from ${oldValue} to ${newValue}`);
 *   });
 *
 *   settings.set({ foo: 'baz' });
 *   ```
 *
 * @template T The type of the settings object.
 * @param options The options object.
 * @param options.directory The directory in which the settings file should be stored.
 * @param options.file The name of the settings file.
 * @param options.defaults The default settings object. This object is used when the
 *   settings file does not exist yet.
 */
export class Settings<T extends object> extends PropertyChangeEmitter<T> {
  /** This is the path to the settings file. */
  private readonly filePath: string;

  /** If set to true, no notification will be shown when the JSON file cannot be written. */
  public ignoreWriteProtectedConfigFiles = false;

  /** This is the watcher which is used to watch the settings file for changes. */
  private watcher: chokidar.FSWatcher | null;

  /** This array contains all listeners which are called when a setting changes. */
  private anyChangeListeners: Array<(newSettings: T, oldSettings: T) => void> = [];

  /**
   * This is the current settings object. It is loaded from the settings file when the
   * class is instantiated. It is updated when the `set()` method is called or when the
   * settings file changes on disk.
   */
  private settings: T;

  /**
   * This is the default settings object. It is used when the settings file does not exist
   * yet or when it does not contain all properties.
   */
  public readonly defaults: T;

  /**
   * Creates a new settings object. If the settings file does not exist yet, the default
   * settings are used. If the settings file exists but does not contain all properties,
   * the missing properties are added from the default settings. If the settings file
   * contains a syntax error, an exception is thrown.
   *
   * See documentation of the class for more details.
   */
  constructor(options: Options<T>) {
    super();

    this.filePath = path.join(options.directory, options.file);
    this.defaults = options.defaults;
    this.settings = this.loadSettings(this.defaults);

    // Watch the settings file for changes.
    this.setupWatcher();
  }

  /**
   * Returns the current settings object or the value of a single property. The settings
   * are not loaded from disk, so this method is very cheap to call.
   *
   * @param key The key of the property to return. If not set, the whole settings object
   *   is returned.
   * @returns The current settings object or the value of a single property.
   */
  public get(): DeepReadonly<T>;
  public get<K extends keyof T>(key: K): DeepReadonly<T[K]>;
  public get<K extends keyof T>(key?: K): DeepReadonly<T> | DeepReadonly<T[K]> {
    return this.getMutable(key);
  }

  /**
   * This method is similar to `get()`, but it returns a mutable version of the settings
   * object. This method is provided for convenience, but it should be used with care.
   * Changing the returned object does not trigger any events and does not save the
   * settings to disk.
   *
   * @param key The key of the property to return. If not set, the whole settings object
   *   is returned.
   * @returns The current settings object or the value of a single property.
   */
  public getMutable(): T;
  public getMutable<K extends keyof T>(key: K): T[K];
  public getMutable<K extends keyof T>(key?: K): T | T[K] {
    if (key === undefined) {
      return this.settings;
    } else {
      return this.settings[key];
    }
  }

  /**
   * Sets the given settings. All properties which are not present in the given object are
   * left unchanged. The settings are saved to disk and events are emitted for all
   * properties which have changed.
   *
   * This is a rather expensive operation. If you want to change multiple properties at
   * once, you should avoid calling this method multiple times.
   *
   * @param newSettings The new settings object.
   * @param emitEvents Whether events should be emitted for the changed properties.
   */
  public set(newSettings: Partial<T>, emitEvents = true) {
    if (this.watcher) {
      const oldSettings = { ...this.settings };
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings(this.settings);

      if (emitEvents) {
        this.emitEvents(this.settings, oldSettings);
      }
    }
  }

  /**
   * Connects the given listener to all events. The listener will be called whenever any
   * setting changes. The callback function will be called after the specific event
   * listeners registered with `onChange()` are called.
   *
   * @param listener The listener function which will be called when any setting changes.
   */
  public onAnyChange(listener: (newSettings: T, oldSettings: T) => void) {
    this.anyChangeListeners.push(listener);
  }

  /**
   * Disconnects the given listener from all events. The listener will no longer be called
   * when any setting changes.
   *
   * @param listener The listener function to disconnect.
   */
  public disconnectAnyChange(listener: (newSettings: T, oldSettings: T) => void) {
    const index = this.anyChangeListeners.indexOf(listener);
    if (index >= 0) {
      this.anyChangeListeners.splice(index, 1);
    }
  }

  /** Closes the watcher and stops listening for changes. */
  public close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.disconnectAll();
  }

  /** Sets up the watcher to watch the settings file for changes. */
  private setupWatcher() {
    this.watcher = chokidar.watch(this.filePath, { ignoreInitial: true });
    this.watcher.on('change', () => {
      const oldSettings = { ...this.settings };
      try {
        this.settings = this.loadSettings(this.defaults);
      } catch (error) {
        console.error('Error loading settings:', error);
        return;
      }

      this.emitEvents(this.settings, oldSettings);
    });
  }

  /**
   * Loads the settings from disk. If the settings file does not exist yet, the given
   * default settings are used. If the settings file exists but does not contain all
   * properties, the missing properties are added from the default settings. If the
   * settings file contains a syntax error, the default settings are returned.
   *
   * @param defaultSettings The default settings object.
   * @returns The current settings object.
   */
  private loadSettings(defaultSettings: T): T {
    try {
      console.log('Loading settings from', this.filePath);
      const data = fs.readJSONSync(this.filePath);
      return lodash.merge({}, defaultSettings, data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // The settings file does not exist yet. Create it.
        this.saveSettings(defaultSettings);
      } else {
        throw error;
      }

      return defaultSettings;
    }
  }

  /**
   * Saves the given settings to disk. During this operation, the watcher is stopped and
   * restarted afterwards so that this does not trigger reloads.
   *
   * @param updatedSettings The new settings object.
   */
  private saveSettings(updatedSettings: T) {
    this.watcher?.unwatch(this.filePath);
    try {
      fs.writeJSONSync(this.filePath, updatedSettings, { spaces: 2 });
    } catch (error) {
      // Handle read-only config files correctly.
      // Generate a temporary directory to write the files to for easy reference and write to it.
      const tmpBaseDir = path.join(os.tmpdir(), 'kando');
      fs.mkdirSync(tmpBaseDir, { recursive: true });
      const baseName = path.basename(this.filePath);
      const tmpDir = path.join(tmpBaseDir, baseName);
      fs.writeJSONSync(tmpDir, updatedSettings, { spaces: 2 });

      // Check if the error is a read-only error as other errors should never be silenced.
      const isReadOnlyError =
        error.code === 'EROFS' || error.code === 'EACCES' || error.code === 'EPERM';
      const errorMessage = isReadOnlyError
        ? 'The ' +
          baseName +
          ' file was read-only. It will temporarily be saved to: ' +
          tmpDir +
          " Set ignoreWriteProtectedConfigFiles to 'true' to silence this warning"
        : 'There was an error while writing to the ' +
          baseName +
          ' file. It will be temporarily saved to : ' +
          tmpDir;

      // If the config option ignoreWriteProtectedConfigFiles is not set or the error is not a read-only error; notify the user that their hard work has not been permanently saved.
      if (!this.ignoreWriteProtectedConfigFiles || !isReadOnlyError) {
        console.warn(errorMessage);

        if (Notification.isSupported()) {
          const notification = new Notification({
            title: 'Could not save file.',
            body: errorMessage,
            icon: path.join(__dirname, require('../../../assets/icons/icon.png')),
          });

          notification.show();
        }
      }
    }
    this.watcher?.add(this.filePath);
  }

  /**
   * Emits events for all properties which have changed.
   *
   * @param newSettings The new settings object.
   * @param oldSettings The old settings object.
   */
  private emitEvents(newSettings: T, oldSettings: T) {
    let anyChanged = false;

    for (const key in newSettings) {
      if (
        Object.prototype.hasOwnProperty.call(newSettings, key) &&
        !lodash.isEqual(newSettings[key], oldSettings[key])
      ) {
        this.emit(key, newSettings[key], oldSettings[key]);
        anyChanged = true;
      }
    }

    if (anyChanged) {
      this.anyChangeListeners.forEach((listener) => listener(newSettings, oldSettings));
    }
  }
}

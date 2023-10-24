//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';
import * as fs from 'fs-extra';
import chokidar from 'chokidar';

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
type DeepReadonly<T> = {
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
  private events: Partial<PropertyChangeEvents<T>> = {};

  public onChange<K extends keyof T>(event: K, listener: PropertyChangeEvents<T>[K]) {
    this.events[event] = listener;
  }

  protected emit<K extends keyof T>(event: K, newValue: T[K], oldValue: T[K]) {
    const listener = this.events[event];
    if (listener) {
      listener(newValue, oldValue);
    }
  }
}

/**
 * The options object which can be passed to the constructor. See documentation of the
 * Settings class below for details.
 */
interface Options<T> {
  directory?: string;
  file?: string;
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
 * @param options.directory The directory in which the settings file should be stored. If
 *   not set, the user's config directory is used.
 * @param options.file The name of the settings file. If not set, `settings.json` is used.
 * @param options.defaults The default settings object. This object is used when the
 *   settings file does not exist yet.
 */
export class Settings<T extends object> extends PropertyChangeEmitter<T> {
  // This is the path to the settings file.
  private readonly filePath: string;

  // This is the watcher which is used to watch the settings file for changes.
  private watcher: chokidar.FSWatcher | null;

  // This is the current settings object. It is loaded from the settings file when the
  // class is instantiated. It is updated when the `set()` method is called or when the
  // settings file changes on disk.
  private settings: T;

  // This is the default settings object. It is used when the settings file does not
  // exist yet or when it does not contain all properties.
  private readonly defaults: T;

  /** Creates a new settings object. See documentation of the class for details. */
  constructor(options: Options<T>) {
    super();

    const directory = options.directory || app.getPath('userData');
    const file = options.file || 'settings.json';

    this.filePath = directory + '/' + file;
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
   */
  public set(newSettings: Partial<T>) {
    if (this.watcher) {
      const oldSettings = { ...this.settings };
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings(this.settings);
      this.emitEvents(this.settings, oldSettings);
    }
  }

  /** Closes the watcher and stops listening for changes. */
  public close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /** Sets up the watcher to watch the settings file for changes. */
  private setupWatcher() {
    this.watcher = chokidar.watch(this.filePath, { ignoreInitial: true });
    this.watcher.on('change', () => {
      const oldSettings = { ...this.settings };
      this.settings = this.loadSettings(this.defaults);
      this.emitEvents(this.settings, oldSettings);
    });
  }

  /**
   * Loads the settings from disk. If the settings file does not exist yet, the given
   * default settings are used. If the settings file exists but does not contain all
   * properties, the missing properties are added from the default settings.
   *
   * @param defaultSettings The default settings object.
   * @returns The current settings object.
   */
  private loadSettings(defaultSettings: T): T {
    try {
      const data = fs.readJSONSync(this.filePath);
      return { ...defaultSettings, ...data };
    } catch (error) {
      this.saveSettings(defaultSettings);
      return defaultSettings;
    }
  }

  /**
   * Saves the given settings to disk.
   *
   * @param updatedSettings The new settings object.
   */
  private saveSettings(updatedSettings: T) {
    fs.writeJSONSync(this.filePath, updatedSettings, { spaces: 2 });
  }

  /**
   * Emits events for all properties which have changed.
   *
   * @param newSettings The new settings object.
   * @param oldSettings The old settings object.
   */
  private emitEvents(newSettings: T, oldSettings: T) {
    for (const key in newSettings) {
      if (
        Object.prototype.hasOwnProperty.call(newSettings, key) &&
        newSettings[key] !== oldSettings[key]
      ) {
        this.emit(key, this.settings[key], oldSettings[key]);
      }
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import { globalShortcut } from 'electron';
import lodash from 'lodash';
import mime from 'mime-types';

import {
  BackendInfo,
  KeySequence,
  WMInfo,
  MenuItem,
  AppDescription,
  GeneralSettings,
} from '../../common';
import { Settings } from '../settings';

/**
 * This abstract class must be extended by all backends. A backend is responsible for
 * communicating with the operating system in ways impossible with the standard electron
 * APIs. It provides methods to bind global shortcuts (which is not possible on all
 * platforms using electron only), move the mouse pointer, simulate keyboard shortcuts, or
 * to get information about the currently focused window.
 *
 * If a global shortcut is activated, it will emit the 'shortcutPressed' event with the
 * activated shortcut as the first argument.
 *
 * See index.ts for information about how the backend is selected.
 */
export abstract class Backend extends EventEmitter {
  /** A list of all shortcuts which are currently bound. */
  private boundShortcuts: string[] = [];

  /**
   * A map of all shortcuts which are currently inhibited. The keys are the inhibition IDs
   * which were returned by inhibitShortcuts().
   */
  private inhibitedShortcuts: Map<number, string> = new Map();

  /** The next inhibition ID to be used. */
  private nextInhibitionID: number = 1;

  /**
   * Each backend must provide some basic information about the backend. See IBackendInfo
   * for more information. This method may be called before the backend is initialized.
   *
   * @returns Some information about the backend.
   */
  public abstract getBackendInfo(): BackendInfo;

  /**
   * This method will be called once when the backend is created. It can be used to
   * connect to some kind of IPC mechanisms.
   *
   * @returns A promise which resolves when the backend is ready to be used.
   */
  public abstract init(generalSettings: Settings<GeneralSettings>): Promise<void>;

  /**
   * This method will be called when Kando is about to exit. It can be used to disconnect
   * from IPC mechanisms or to clean up resources. Also, global shortcuts should be
   * unbound here.
   *
   * @returns A promise which resolves when the backend has been cleaned up.
   */
  public abstract deinit(): Promise<void>;

  /**
   * Each backend must provide a way to get the name and app of the currently focused
   * window as well as the current pointer position.
   *
   * @returns A promise which resolves to the name and app of the currently focused window
   *   as well as to the current pointer position.
   */
  public abstract getWMInfo(): Promise<WMInfo>;

  /**
   * Each backend must provide a way to get a list of all installed applications. This is
   * used by the settings window to populate the list of available applications.
   */
  public abstract getInstalledApps(): Promise<Array<AppDescription>>;

  /**
   * Each backend can provide a way to list available system icons. The method should
   * return a map of icon names to something which can be used as CSS image source. That
   * is for instance file paths or base64-encoded data URLs. This is used to create the
   * system icon theme.
   *
   * This method is not implemented by the base class, but can be implemented by derived
   * backends if they support listing system icons.
   *
   * @returns A promise which resolves to a map of icon names to their CSS image sources.
   *   If system icons are not available, it should resolve to an empty map.
   */
  public async getSystemIcons(): Promise<Map<string, string>> {
    return new Map();
  }

  /**
   * Each backend can provide a way to detect changes to the system icons. This method
   * should return true if the system icon theme has changed since the last call to
   * getSystemIcons().
   *
   * @returns A promise which resolves to true if the system icon theme has changed since
   *   the last call to getSystemIcons(), or false if it has not changed or if this is not
   *   implemented by the backend.
   */
  public async systemIconsChanged(): Promise<boolean> {
    // This method is not implemented by the base class, but can be implemented by
    // derived backends if they support detecting changes to system icons.
    return false;
  }

  /**
   * Each backend can provide custom item-creators for dropped files. The implementation
   * in this base class creates a default menu item for the file.
   *
   * @param name The name of the file that was dropped. This is usually the file name
   *   without the path.
   * @param path The full path to the file that was dropped.
   */
  public async createItemForDroppedFile(
    name: string,
    path: string
  ): Promise<MenuItem | null> {
    // If the path is empty, we can't create a menu item.
    if (!path) {
      return null;
    }

    const mimeType = mime.lookup(path);

    // If the mime type is not known, maybe a directory was passed.
    let icon = mimeType ? 'draft' : 'folder';

    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        icon = 'image';
      } else if (mimeType.startsWith('video/') || mimeType.includes('mp4')) {
        icon = 'video_file';
      } else if (mimeType.startsWith('audio/')) {
        icon = 'audio_file';
      } else if (mimeType.startsWith('text/')) {
        icon = 'text_snippet';
      }
    }

    return {
      type: 'file',
      name,
      icon,
      iconTheme: 'material-symbols-rounded',
      data: { path },
    };
  }

  /**
   * Each backend must provide a way to move the pointer.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   * @returns A promise which resolves when the pointer has been moved.
   */
  public abstract movePointer(dx: number, dy: number): Promise<void>;

  /**
   * Each backend must provide a way to simulate a key sequence. This is used to execute
   * keyboard macros.
   *
   * @param keys The keys to simulate.
   * @param inhibitShortcuts If true, all currently bound shortcuts should be inhibited
   *   while simulating the key sequence.
   * @returns A promise which resolves when the key sequence has been simulated.
   */
  public async simulateKeys(keys: KeySequence, inhibitShortcuts: boolean): Promise<void> {
    let inhibitionID = 0;

    if (inhibitShortcuts) {
      inhibitionID = await this.inhibitAllShortcuts();
    }

    await this.simulateKeysImpl(keys);

    if (inhibitShortcuts) {
      await this.releaseInhibition(inhibitionID);
    }
  }

  /**
   * This binds the given shortcuts globally. What the shortcut strings look like depends
   * on the backend:
   *
   * - For backends which support binding global shortcuts directly (this means if the
   *   IBackendInfo returned by getBackendInfo() contains 'supportsShortcuts: true'), the
   *   string is a key combination as defined by the electron globalShortcut module. See
   *   here: https://www.electronjs.org/docs/latest/api/accelerator
   * - For backends which can not support binding global shortcuts directly
   *   ('supportsShortcuts: false'), the string is some unique ID for the shortcut. This
   *   can be used in some manner to identify the shortcut in the OS's shortcut manager.
   *
   * Calling this method will override all previously bound shortcuts. So calling this
   * method with an empty array will unbind all previously bound shortcuts.
   *
   * @param shortcuts The shortcuts to bind (IDs or key combinations as described above).
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  public async bindShortcuts(shortcuts: string[]): Promise<void> {
    if (!lodash.isEqual(shortcuts, this.boundShortcuts)) {
      const previousShortcuts = Array.from(this.boundShortcuts);
      const previousEffectiveShortcuts = this.getEffectiveShortcuts();
      this.boundShortcuts = shortcuts;
      const currentEffectiveShortcuts = this.getEffectiveShortcuts();

      await this.onShortcutsChanged(
        shortcuts,
        previousShortcuts,
        currentEffectiveShortcuts,
        previousEffectiveShortcuts
      );
    }
  }

  /**
   * Temporarily disables a keyboard shortcut. What this does exactly, depends on the
   * backend: Ideally, it should unbind the given shortcut so that other applications can
   * use it. If this is not possible, backends may choose to just not emit the
   * 'shortcutPressed' signal of the inhibited shortcut.
   *
   * The returned inhibition ID must be used to release the inhibition again using
   * releaseInhibition() later.
   *
   * Multiple inhibitions may be active at the same time. The backend must ensure that
   * shortcuts are only re-enabled when all inhibitions which disabled them have been
   * released.
   *
   * Backends may use the getEffectiveShortcuts() method to determine which shortcuts are
   * currently effectively bound (i.e. bound but not inhibited by any active inhibition).
   *
   * @param shortcut A unique ID or key combination of the shortcut to inhibit. These are
   *   the same as the ones used in the bindShortcuts method.
   * @returns A promise which resolves to an inhibition ID which must be used to release
   *   the inhibition later.
   */
  public async inhibitShortcut(shortcut: string): Promise<number> {
    const inhibitionID = this.nextInhibitionID++;

    const previousEffectiveShortcuts = this.getEffectiveShortcuts();
    this.inhibitedShortcuts.set(inhibitionID, shortcut);
    const currentEffectiveShortcuts = this.getEffectiveShortcuts();

    await this.onShortcutsChanged(
      this.boundShortcuts,
      this.boundShortcuts,
      currentEffectiveShortcuts,
      previousEffectiveShortcuts
    );

    return inhibitionID;
  }

  /**
   * It is also possible to inhibit all currently bound shortcuts at once using this
   * method.
   *
   * @returns A promise which resolves when all shortcuts have been inhibited.
   */
  public async inhibitAllShortcuts(): Promise<number> {
    const inhibitionID = this.nextInhibitionID++;

    const previousEffectiveShortcuts = this.getEffectiveShortcuts();
    this.inhibitedShortcuts.set(inhibitionID, '*');
    const currentEffectiveShortcuts = this.getEffectiveShortcuts();

    await this.onShortcutsChanged(
      this.boundShortcuts,
      this.boundShortcuts,
      currentEffectiveShortcuts,
      previousEffectiveShortcuts
    );

    return inhibitionID;
  }

  /**
   * Releases a previously created inhibition.
   *
   * @param inhibitionID The inhibition ID that was returned by inhibitShortcut() or
   *   inhibitAllShortcuts().
   * @returns A promise which resolves when the inhibition has been released.
   */
  public async releaseInhibition(inhibitionID: number): Promise<void> {
    if (!this.inhibitedShortcuts.has(inhibitionID)) {
      console.warn(`Tried to release unknown shortcut inhibition ID ${inhibitionID}!`);
      return;
    }

    const previousEffectiveShortcuts = this.getEffectiveShortcuts();
    this.inhibitedShortcuts.delete(inhibitionID);
    const currentEffectiveShortcuts = this.getEffectiveShortcuts();

    await this.onShortcutsChanged(
      this.boundShortcuts,
      this.boundShortcuts,
      currentEffectiveShortcuts,
      previousEffectiveShortcuts
    );
  }

  /**
   * Derived backends should call this method when a global shortcut is pressed.
   *
   * @param shortcut The shortcut that was pressed. This should be the same string as used
   *   in the bindShortcuts method.
   */
  protected onShortcutPressed(shortcut: string): void {
    this.emit('shortcutPressed', shortcut);
  }

  /**
   * This method is called by the bind-shortcuts and inhibit-shortcuts methods above to
   * actually bind the shortcuts. The implementation in this class uses Electron's
   * globalShortcut module, however, this does not work on all platforms. Therefore,
   * derived backends can override this method to provide their own binding logic.
   *
   * Depending on whether the shortcuts got inhibited or bound, the parameters have the
   * following meaning:
   *
   * @param currentShortcuts The shortcuts that should be bound now. Some of these may be
   *   inhibited and should therefore not lead to emitting the 'shortcutPressed' event.
   * @param previousShortcuts The shortcuts that were bound before this call.
   * @param currentEffectiveShortcuts The list of currently effectively bound shortcuts.
   *   That is the list of all currently bound shortcuts minus the ones which are
   *   currently inhibited by any active inhibition.
   * @param previousEffectiveShortcuts The list of shortcuts which were effectively bound
   *   before this call.
   * @returns A promise which resolves when the shortcuts have been updated.
   */
  protected async onShortcutsChanged(
    currentShortcuts: string[],
    previousShortcuts: string[],
    currentEffectiveShortcuts: string[],
    previousEffectiveShortcuts: string[]
  ): Promise<void> {
    // Use a shortcut if we unbind all shortcuts :)
    if (currentEffectiveShortcuts.length === 0) {
      globalShortcut.unregisterAll();
      return;
    }

    const shortcutsToUnbind = previousEffectiveShortcuts.filter(
      (s) => !currentEffectiveShortcuts.includes(s)
    );
    const shortcutsToBind = currentEffectiveShortcuts.filter(
      (s) => !previousEffectiveShortcuts.includes(s)
    );

    // Unbind the obsolete shortcuts.
    for (const shortcut of shortcutsToUnbind) {
      globalShortcut.unregister(shortcut);
    }

    // Bind the new shortcuts.
    for (const shortcut of shortcutsToBind) {
      globalShortcut.register(shortcut, () => {
        this.onShortcutPressed(shortcut);
      });
    }
  }

  /**
   * Each backend must provide a way to simulate a key sequence. This is used to execute
   * keyboard macros.
   *
   * @param keys The keys to simulate.
   * @returns A promise which resolves when the key sequence has been simulated.
   */
  protected abstract simulateKeysImpl(keys: KeySequence): Promise<void>;

  /**
   * A helper method which returns whether the given shortcut is currently inhibited.
   *
   * @param shortcut The shortcut to check.
   * @returns True if the shortcut is currently inhibited, false otherwise.
   */
  protected isShortcutInhibited(shortcut: string): boolean {
    const inhibitedShortcuts = Array.from(this.inhibitedShortcuts.values());

    // If all shortcuts are inhibited, return true.
    if (inhibitedShortcuts.includes('*')) {
      return true;
    }

    // Otherwise, check if the given shortcut is in the list of inhibited shortcuts.
    return inhibitedShortcuts.includes(shortcut);
  }

  /**
   * A helper method which returns the list of currently effectively bound shortcuts. This
   * means the list of all bound shortcuts minus the ones which are currently inhibited by
   * any active inhibition.
   *
   * @returns The list of currently effectively bound shortcuts.
   */
  private getEffectiveShortcuts(): string[] {
    const inhibitedShortcuts = Array.from(this.inhibitedShortcuts.values());

    // If all shortcuts are inhibited, return an empty list.
    if (inhibitedShortcuts.includes('*')) {
      return [];
    }

    // Otherwise, return the bound shortcuts minus the inhibited ones.
    return this.boundShortcuts.filter((s) => !inhibitedShortcuts.includes(s));
  }
}

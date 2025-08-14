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
  IBackendInfo,
  IKeySequence,
  IWMInfo,
  IMenuItem,
  IAppDescription,
} from '../../common';

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
  private shortcuts: string[] = [];

  /** A list of all shortcuts which are currently inhibited. */
  private inhibitedShortcuts: string[] = [];

  /**
   * Each backend must provide some basic information about the backend. See IBackendInfo
   * for more information. This method may be called before the backend is initialized.
   *
   * @returns Some information about the backend.
   */
  public abstract getBackendInfo(): IBackendInfo;

  /**
   * This method will be called once when the backend is created. It can be used to
   * connect to some kind of IPC mechanisms.
   *
   * @returns A promise which resolves when the backend is ready to be used.
   */
  public abstract init(): Promise<void>;

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
  public abstract getWMInfo(): Promise<IWMInfo>;

  /**
   * Each backend must provide a way to get a list of all installed applications. This is
   * used by the settings window to populate the list of available applications.
   */
  public abstract getInstalledApps(): Promise<Array<IAppDescription>>;

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
  ): Promise<IMenuItem | null> {
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
   * @returns A promise which resolves when the key sequence has been simulated.
   */
  public abstract simulateKeys(keys: IKeySequence): Promise<void>;

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
   * If any shortcuts are currently inhibited, they will be restored if they are again in
   * the new sets of to-be-bound shortcuts.
   *
   * @param shortcuts The shortcuts to bind (IDs or key combinations as described above).
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  public async bindShortcuts(shortcuts: string[]): Promise<void> {
    await this.inhibitShortcuts([]);

    if (!lodash.isEqual(shortcuts, this.shortcuts)) {
      await this.bindShortcutsImpl(shortcuts, this.shortcuts);
      this.shortcuts = shortcuts;
    }
  }

  /**
   * Temporarily disables some keyboard shortcuts. What this does exactly, depends on the
   * backend: Ideally, it should unbind all given shortcuts so that other applications can
   * use them. If this is not possible, backends may choose to just not emit the
   * 'shortcutPressed' signal of the inhibited shortcuts.
   *
   * Calling this method multiple times will override the previously inhibited shortcuts.
   * So calling this method with an empty array restores all previously inhibited
   * shortcuts.
   *
   * @param shortcuts An array of strings containing the unique IDs or key combinations of
   *   the shortcuts to inhibit. These are the same as the ones used in the bindShortcuts
   *   method.
   * @returns A promise which resolves when the shortcuts have been inhibited.
   */
  public async inhibitShortcuts(shortcuts: string[]): Promise<void> {
    if (!lodash.isEqual(shortcuts, this.inhibitedShortcuts)) {
      await this.inhibitShortcutsImpl(shortcuts, this.inhibitedShortcuts);
      this.inhibitedShortcuts = shortcuts;
    }
  }

  /**
   * A convenience method to inhibit all currently bound shortcuts.
   *
   * @returns A promise which resolves when all shortcuts have been inhibited.
   */
  public async inhibitAllShortcuts(): Promise<void> {
    if (!lodash.isEqual(this.shortcuts, this.inhibitedShortcuts)) {
      await this.inhibitShortcutsImpl(this.shortcuts, this.inhibitedShortcuts);
      this.inhibitedShortcuts = [...this.shortcuts];
    }
  }

  /**
   * This returns the currently bound shortcuts. These are the same strings as used in the
   * bindShortcuts method.
   *
   * @returns An array of strings containing the unique IDs or key combinations of the
   *   currently bound shortcuts.
   */
  public getBoundShortcuts(): string[] {
    return this.shortcuts;
  }

  /**
   * This returns the currently inhibited shortcuts. These are the same strings as used in
   * the inhibitShortcuts method.
   *
   * @returns An array of strings containing the unique IDs or key combinations of the
   *   currently inhibited shortcuts.
   */
  public getInhibitedShortcuts(): string[] {
    return this.inhibitedShortcuts;
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
   * This method is called by the bindShortcuts method to actually bind the shortcuts. The
   * implementation in this class uses Electron's globalShortcut module, however, this
   * does not work on all platforms. Therefore, derived backends can override this method
   * to provide their own binding logic.
   *
   * This method will never be called with the same shortcuts for both arguments.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @param previouslyBound The shortcuts that were bound before this call.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  protected async bindShortcutsImpl(
    shortcuts: string[],
    previouslyBound: string[]
  ): Promise<void> {
    // Use a shortcut if we unbind all shortcuts :)
    if (shortcuts.length === 0) {
      globalShortcut.unregisterAll();
      return;
    }

    const shortcutsToUnbind = previouslyBound.filter((s) => !shortcuts.includes(s));
    const shortcutsToBind = shortcuts.filter((s) => !previouslyBound.includes(s));

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
   * This method is called by the inhibitShortcuts method to actually inhibit the
   * shortcuts. This implementation uses the bindShortcutsImpl method to simply unbind
   * shortcuts which are supposed to be inhibited. However, this does not work on all
   * platforms. Some platforms, like KDE Wayland cannot silently change the set of global
   * shortcuts. Such platforms can override this method and choose to not unbind the
   * shortcuts, but rather just not emit the 'shortcutPressed' event for the inhibited
   * shortcuts.
   *
   * This method will never be called with the same shortcuts for both arguments.
   *
   * @param shortcuts The shortcuts that should be inhibited now.
   * @param previouslyInhibited The shortcuts that were inhibited before this call.
   * @returns A promise which resolves when the shortcuts have been inhibited.
   */
  protected async inhibitShortcutsImpl(
    shortcuts: string[],
    previouslyInhibited: string[]
  ): Promise<void> {
    // Assemble a list of shortcuts that were actually bound before this call. This is the
    // bound shortcuts minus the ones that are currently inhibited.
    const boundShortcuts = this.getBoundShortcuts().filter(
      (s) => !previouslyInhibited.includes(s)
    );

    // Assemble a list of shortcuts that should be bound after this call. This is the
    // bound shortcuts minus the ones that are supposed to be inhibited.
    const shortcutsToBind = this.getBoundShortcuts().filter(
      (s) => !shortcuts.includes(s)
    );

    // Now use the bindShortcutsImpl method to unbind the inhibited shortcuts and
    // rebind the ones which are not inhibited anymore.
    await this.bindShortcutsImpl(shortcutsToBind, boundShortcuts);
  }
}
